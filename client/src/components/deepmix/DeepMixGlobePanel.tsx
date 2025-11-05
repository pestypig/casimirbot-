'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type { WebGLRenderer } from "three";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { registerWebGLContext } from "@/lib/webgl/context-pool";

// -------------------- Types & Model --------------------
export type DeepMixParams = {
  Mc: number;  // kg, effective core mass
  Xe: number;  // envelope H fraction (~0.70)
  Xc0: number; // initial core H fraction
  eps: number; // J/kg, fusion energy per mass of H burned
  h0: number;  // base hazard (1/yr)
  beta: number;// hazard sensitivity
  Xthr: number;// threshold H where hazard grows
  trip: {
    T: number;    // years between trip starts
    dt: number;   // years of active return per trip
    Mtrip: number;// kg delivered per trip
    mdotMax?: number; // kg/s cap (fleet capacity)
    guard?: { X: number; band: number };
  };
  Lc: (Xc: number) => number; // W
};

type SimPoint = { t: number; Xc: number; Lc: number; h: number; P: number; mdot: number };

function simulate(p: DeepMixParams, tMaxYears: number, dtYears: number): SimPoint[] {
  let Xc = p.Xc0;
  let P = 0;
  const out: SimPoint[] = [];
  const year_s = 365.25 * 24 * 3600;
  let tYears = 0;

  while (tYears <= tMaxYears + 1e-12) {
    const L = p.Lc(Xc);                 // W
    const MdotBurn = L / p.eps;         // kg/s

    const tSec = tYears * year_s;
    const TSec = p.trip.T * year_s;
    const dtSecTrip = p.trip.dt * year_s;

    const inTrip = (tSec % TSec) < dtSecTrip;
    const mdotBase = inTrip ? (p.trip.Mtrip / p.trip.dt) / year_s : 0; // kg/s

    const s = p.trip.guard
      ? 1 / (1 + Math.exp((Xc - p.trip.guard.X) / Math.max(1e-9, p.trip.guard.band)))
      : 1;

    const mdot = Math.min(p.trip.mdotMax ?? mdotBase, mdotBase) * s; // kg/s

    const dXc_dt = (mdot * (p.Xe - Xc) - MdotBurn) / p.Mc; // 1/s
    const dtSecStep = dtYears * year_s;

    Xc = Math.min(0.75, Math.max(0, Xc + dXc_dt * dtSecStep));

    // hazard in 1/yr; integrate in years-domain
    const hazardExponent = p.beta * (p.Xthr - Xc);
    const h = p.h0 * Math.exp(Math.max(-60, Math.min(60, hazardExponent)));
    const lambdaPrev = -Math.log(Math.max(1e-16, 1 - P));
    const lambdaNew = lambdaPrev + h * dtYears;
    P = 1 - Math.exp(-lambdaNew);

    out.push({ t: tYears, Xc, Lc: L, h, P, mdot });
    tYears += dtYears;
  }
  return out;
}

const DEFAULTS: Omit<DeepMixParams, "Lc"> = {
  Mc: 5e22, // effective mixing mass (kg)
  Xe: 0.70,
  Xc0: 0.34,
  eps: 6.3e14, // J/kg (p–p chain order)
  h0: 0.002,   // base hazard per year
  beta: 14,
  Xthr: 0.31,
  trip: { T: 0.8, dt: 0.5, Mtrip: 1e23, guard: { X: 0.32, band: 0.02 } },
};

function fleetToTrip(p: DeepMixParams, ships: number, ratePerShipKgS: number): DeepMixParams {
  const mdotMax = ships * ratePerShipKgS; // kg/s
  return { ...p, trip: { ...p.trip, mdotMax } };
}

function findSweetSpot(
  base: DeepMixParams,
  horizonYrs: number,
  shipsGrid: number[],
  ratePerShipKgS: number
) {
  return shipsGrid.map((ships) => {
    const p = fleetToTrip(base, ships, ratePerShipKgS);
    const series = simulate(p, horizonYrs, 0.2);
    const P = series[series.length - 1]?.P ?? 0;
    const guardX = base.trip.guard?.X ?? null; // guard fix
    const pass = guardX === null ? true : series.every((pt) => pt.Xc >= guardX);
    return { ships, P, pass };
  });
}

// -------------------- 3D Visuals --------------------
function SunMesh({ hazard01 }: { hazard01: number }) {
  const ref = useRef<any>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });

  const baseR = 1.0;
  const r = baseR * (1 + 0.15 * hazard01);
  const emissiveIntensity = 0.6 + 1.2 * hazard01;

  return React.createElement(
    "mesh",
    { ref, scale: [r, r, r] } as JSX.IntrinsicElements["mesh"],
    React.createElement(
      "sphereGeometry",
      { args: [1, 96, 96] } as JSX.IntrinsicElements["sphereGeometry"]
    ),
    React.createElement(
      "meshStandardMaterial",
      {
        color: "#fcbf49",
        emissive: "#ff7f11",
        emissiveIntensity,
        roughness: 0.4,
        metalness: 0.0,
      } as JSX.IntrinsicElements["meshStandardMaterial"]
    )
  );
}

function MixingRing({ activity01 }: { activity01: number }) {
  // Torus thickness grows with average mixing activity
  const ref = useRef<any>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.12;
  });

  // Clamp thickness so it never vanishes or overwhelms the globe
  const tube = 0.02 + 0.10 * Math.max(0, Math.min(1, activity01));
  return React.createElement(
    "mesh",
    { ref, rotation: [Math.PI / 2, 0, 0] } as JSX.IntrinsicElements["mesh"],
    React.createElement(
      "torusGeometry",
      { args: [1.2, tube, 64, 256] } as JSX.IntrinsicElements["torusGeometry"]
    ),
    React.createElement(
      "meshStandardMaterial",
      {
        color: "#ffffff",
        emissive: "#ffd166",
        emissiveIntensity: 0.4 + 0.9 * activity01,
        roughness: 0.3,
        metalness: 0.0,
      } as JSX.IntrinsicElements["meshStandardMaterial"]
    )
  );
}

// -------------------- Main Panel --------------------
export default function DeepMixGlobePanel() {
  // Controls
  const [ships, setShips] = useState<number>(700_000_000);
  const [rateKgS, setRateKgS] = useState<number>(5e4);
  const [horizonYrs, setHorizonYrs] = useState<number>(200);

  // Base params + luminosity proxy
  const baseParams: DeepMixParams = useMemo(
    () => ({
      ...DEFAULTS,
      Lc: (Xc: number) =>
        3.6e26 * Math.pow(DEFAULTS.Xc0 / Math.max(1e-4, Xc), 0.85), // hotter core as H depletes
    }),
    []
  );

  // Simulation for selected fleet
  const sim = useMemo(() => {
    const p = fleetToTrip(baseParams, ships, rateKgS);
    return simulate(p, horizonYrs, 0.2);
  }, [baseParams, ships, rateKgS, horizonYrs]);

  const last = sim[sim.length - 1] ?? { P: 0, Xc: baseParams.Xc0, mdot: 0 };
  const Pfinal = last.P;
  const Xmin = sim.reduce((m, pt) => Math.min(m, pt.Xc), 1);
  const guardX = baseParams.trip.guard?.X ?? null;

  const pass = (guardX === null || Xmin >= guardX) && Pfinal < 0.2;

  // Average mixing activity across the horizon (0..1 relative to fleet capacity)
  const mdotMax = Math.max(1e-12, ships * rateKgS);
  const avgActivity =
    sim.length > 0
      ? sim.reduce((acc, pt) => acc + Math.min(1, Math.max(0, pt.mdot / mdotMax)), 0) / sim.length
      : 0;

  // No-mix baseline for suppression metric
  const noMixParams: DeepMixParams = useMemo(
    () => ({ ...baseParams, trip: { ...baseParams.trip, mdotMax: 0, Mtrip: 0 } }),
    [baseParams]
  );
  const noMixSim = useMemo(() => simulate(noMixParams, horizonYrs, 0.2), [noMixParams, horizonYrs]);
  const PfinalNoMix = noMixSim[noMixSim.length - 1]?.P ?? 0;
  const absoluteReduction = Math.max(0, (PfinalNoMix - Pfinal) * 100);
  const suppressionRatio =
    PfinalNoMix > 1e-9 ? Math.max(0, Math.min(1, Pfinal / PfinalNoMix)) : null;

  // Sweet spot scan (log-spaced fleet sizes)
  const sweet = useMemo(() => {
    const grid: number[] = [];
    for (let e = 3; e <= 10; e += 0.25) grid.push(Math.round(Math.pow(10, e)));
    return findSweetSpot(baseParams, horizonYrs, grid, rateKgS);
  }, [baseParams, horizonYrs, rateKgS]);

  const sweetMin = useMemo(() => {
    if (!sweet.length) return null;
    return sweet.reduce((best, cur) => (cur.P < best.P ? cur : best), sweet[0]);
  }, [sweet]);

  const rendererRef = useRef<WebGLRenderer | null>(null);
  const releaseRendererRef = useRef<() => void>(() => {});

  const handleCanvasCreated = useCallback(
    (state: RootState) => {
      const renderer = state.gl as WebGLRenderer;
      rendererRef.current = renderer;

      // Ensure previous registrations are cleared if React remounts the Canvas.
      releaseRendererRef.current();
      releaseRendererRef.current = () => {};

      const canvas = renderer.domElement;
      const onLost = (event: Event) => {
        event.preventDefault();
        console.warn("[DeepMixGlobePanel] WebGL context lost");
      };
      const onRestored = () => {
        console.info("[DeepMixGlobePanel] WebGL context restored");
      };

      canvas.addEventListener("webglcontextlost", onLost, false);
      canvas.addEventListener("webglcontextrestored", onRestored, false);

      const release = registerWebGLContext(renderer.getContext(), {
        label: "DeepMixGlobePanel",
        onDispose: () => {
          canvas.removeEventListener("webglcontextlost", onLost, false);
          canvas.removeEventListener("webglcontextrestored", onRestored, false);
          try {
            renderer.forceContextLoss?.();
          } catch (err) {
            console.warn("[DeepMixGlobePanel] forceContextLoss failed", err);
          }
          renderer.dispose();
        },
      });

      releaseRendererRef.current = release;
    },
    []
  );

  useEffect(() => {
    return () => {
      releaseRendererRef.current();
      releaseRendererRef.current = () => {};
      rendererRef.current = null;
    };
  }, []);

  // Globe "breathing" with hazard (bigger/brighter => higher risk)
  const hazard01 = Math.min(1, Math.pow(Pfinal, 0.35));

  const sceneElements = useMemo(
    () => [
      React.createElement(
        "ambientLight",
        { key: "ambient", intensity: 0.35 } as JSX.IntrinsicElements["ambientLight"]
      ),
      React.createElement(
        "directionalLight",
        {
          key: "dir",
          position: [2, 2, 3],
          intensity: 1.2,
        } as JSX.IntrinsicElements["directionalLight"]
      ),
      React.createElement(SunMesh, { key: "sun", hazard01 }),
      React.createElement(MixingRing, { key: "ring", activity01: avgActivity }),
      React.createElement(Stars, {
        key: "stars",
        radius: 80,
        depth: 50,
        count: 1800,
        factor: 2,
        fade: true,
      }),
      React.createElement(OrbitControls, {
        key: "orbit",
        enablePan: false,
        minDistance: 2.2,
        maxDistance: 6,
      }),
    ],
    [avgActivity, hazard01]
  );

  // Chart data
  const sweetData = sweet.map((d) => ({ ships: d.ships, hazard: d.P, pass: d.pass }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Left: 3D globe */}
      <Card className="w-full">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Solar Deep‑Mixing Globe</h2>
            <Badge variant={pass ? "default" : "destructive"}>{pass ? "PASS" : "FAIL"}</Badge>
          </div>

          <div className="h-[420px] rounded-2xl overflow-hidden border">
            <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} onCreated={handleCanvasCreated}>
              {sceneElements}
            </Canvas>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div>
              <div className="text-sm mb-1">Fleet size (ships)</div>
              <Slider
                value={[Math.log10(ships)]}
                min={3}
                max={10}
                step={0.01}
                onValueChange={(v) => setShips(Math.round(Math.pow(10, v[0])))}
              />
              <div className="text-xs mt-1 opacity-70">{ships.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm mb-1">Rate per ship (kg/s)</div>
              <Slider
                value={[Math.log10(rateKgS)]}
                min={0}
                max={5}
                step={0.01}
                onValueChange={(v) => setRateKgS(Math.pow(10, v[0]))}
              />
              <div className="text-xs mt-1 opacity-70">{rateKgS.toExponential(2)} kg/s</div>
            </div>
            <div>
              <div className="text-sm mb-1">Horizon (years)</div>
              <Slider
                value={[horizonYrs]}
                min={10}
                max={1000}
                step={10}
                onValueChange={(v) => setHorizonYrs(v[0])}
              />
              <div className="text-xs mt-1 opacity-70">{horizonYrs.toFixed(0)} yr</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-muted/40">
              <div className="text-xs uppercase tracking-wide opacity-70">Cumulative transition probability</div>
              <div className="text-2xl font-semibold">{(Pfinal * 100).toFixed(2)}%</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/40">
              <div className="text-xs uppercase tracking-wide opacity-70">Core H guard</div>
              <div className="text-2xl font-semibold">
                {guardX === null ? "—" : guardX.toFixed(3)} (min {Xmin.toFixed(3)})
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/40">
              <div className="text-xs uppercase tracking-wide opacity-70">Suppression vs no‑mix</div>
              <div className="text-2xl font-semibold">
                {suppressionRatio === null ? "—" : `${Math.round((1 - suppressionRatio) * 100)}% less risk`}
                <span className="text-xs ml-1 opacity-70">({absoluteReduction.toFixed(2)} pts)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Sweet‑spot scanner */}
      <Card className="w-full">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Sweet‑Spot Scanner</h3>
            <Badge>
              {sweetMin ? `Sweet spot ≈ ${sweetMin.ships.toLocaleString()} ships` : "Lower is better"}
            </Badge>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sweetData} margin={{ top: 10, bottom: 10, left: 5, right: 5 }}>
                <XAxis
                  dataKey="ships"
                  type="number"
                  domain={[1e3, 1e10]}
                  scale="log"
                  tickFormatter={(v) => Number(v).toExponential(0)}
                />
                <YAxis
                  dataKey="hazard"
                  domain={[0, 1]}
                  tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
                />
                <Tooltip
                  formatter={(v: any, n: any) =>
                    n === "hazard" ? `${(v as number * 100).toFixed(2)}%` : v
                  }
                  labelFormatter={(x) => `ships=${Number(x).toLocaleString()}`}
                />
                <Line type="monotone" dataKey="hazard" dot={false} strokeWidth={2} />
                {/* Target probability threshold */}
                <ReferenceLine y={0.2} strokeDasharray="4 2" />
                {/* Current fleet */}
                <ReferenceLine x={ships} strokeDasharray="1 3" />
                {/* Sweet spot */}
                {sweetMin ? <ReferenceLine x={sweetMin.ships} strokeDasharray="3 3" /> : null}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-sm mt-3 opacity-80">
            The globe swells with risk; increase fleet capacity to inject hydrogen and push back the transition.
            The scanner plots horizon risk vs fleet size; the “sweet spot” marks diminishing returns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
