'use client';

import React, { useMemo, useState } from "react";
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
import type { TooltipProps } from "recharts";

// -------------------- Types & Model --------------------
export type DeepMixParams = {
  Mc: number; // kg, effective core mass
  Xe: number; // envelope H fraction (~0.70)
  Xc0: number; // initial core H fraction
  eps: number; // J/kg, fusion energy per mass of H burned
  h0: number; // base hazard rate (1/yr)
  beta: number; // hazard sensitivity
  Xthr: number; // threshold H fraction where hazard grows
  trip: {
    T: number; // years between trip starts
    dt: number; // years of active return per trip
    Mtrip: number; // kg delivered per trip
    mdotMax?: number; // kg/s cap (e.g., fleet capacity)
    guard?: { X: number; band: number }; // logistic band for actuation
  };
  Lc: (Xc: number) => number; // W, core luminosity proxy
};

type SimPoint = { t: number; Xc: number; Lc: number; h: number; P: number; mdot: number };

function simulate(p: DeepMixParams, tMaxYears: number, dtYears: number): SimPoint[] {
  let Xc = p.Xc0;
  let P = 0;
  const out: SimPoint[] = [];
  const year_s = 365.25 * 24 * 3600;
  let tYears = 0;

  while (tYears <= tMaxYears + 1e-12) {
    const L = p.Lc(Xc); // W
    const MdotBurn = L / p.eps; // kg/s

    const tSec = tYears * year_s;
    const TSec = p.trip.T * year_s;
    const dtSec = p.trip.dt * year_s;

    const inTrip = (tSec % TSec) < dtSec;
    const mdotBase = inTrip ? (p.trip.Mtrip / p.trip.dt) / year_s : 0; // kg/s

    const s = p.trip.guard
      ? 1 / (1 + Math.exp((Xc - p.trip.guard.X) / Math.max(1e-9, p.trip.guard.band)))
      : 1;

    const mdot = Math.min(p.trip.mdotMax ?? mdotBase, mdotBase) * s; // kg/s

    const dXc_dt = (mdot * (p.Xe - Xc) - MdotBurn) / p.Mc; // 1/s
    const dtSecStep = dtYears * year_s;

    Xc = Math.min(0.75, Math.max(0, Xc + dXc_dt * dtSecStep));

    // hazard in 1/yr; integrate hazard in years-domain
    const h = p.h0 * Math.exp(p.beta * Math.max(0, p.Xthr - Xc));
    const lambdaPrev = -Math.log(Math.max(1e-16, 1 - P));
    const lambdaNew = lambdaPrev + h * dtYears;
    P = 1 - Math.exp(-lambdaNew);

    out.push({ t: tYears, Xc, Lc: L, h, P, mdot });
    tYears += dtYears;
  }
  return out;
}

// Baseline constants (tune as needed)
const DEFAULTS: Omit<DeepMixParams, "Lc"> = {
  Mc: 3.5e29, // ~0.58 Msun effective core mass
  Xe: 0.70,
  Xc0: 0.34,
  eps: 6.3e14, // J/kg (order-of-magnitude for p–p chain)
  h0: 1e-11, // base hazard per year
  beta: 60, // sensitivity of hazard to Xc
  Xthr: 0.30, // hazard turns on as core H dips below ~0.30
  trip: { T: 2, dt: 0.05, Mtrip: 1e18, guard: { X: 0.32, band: 0.01 } },
};

// Map fleet → capacity cap mdotMax via ships * rate_per_ship
function fleetToTrip(p: DeepMixParams, ships: number, ratePerShipKgS: number): DeepMixParams {
  const mdotMax = ships * ratePerShipKgS; // kg/s
  return { ...p, trip: { ...p.trip, mdotMax } };
}

// Scan fleet sizes and measure cumulative P at horizon; include PASS under guard
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
    // --- Guard fix: never compare against undefined
    const guardX = base.trip.guard?.X ?? null;
    const pass = guardX === null ? true : series.every((pt) => pt.Xc >= guardX);
    return { ships, P, pass };
  });
}

// -------------------- UI Component --------------------
export default function DeepMixSweetSpot() {
  // Controls
  const [ships, setShips] = useState<number>(1_000_000); // fleet size
  const [rateKgS, setRateKgS] = useState<number>(1e3); // kg/s per ship
  const [horizonYrs, setHorizonYrs] = useState<number>(200);

  // Base params + luminosity proxy
  const baseParams: DeepMixParams = useMemo(
    () => ({
      ...DEFAULTS,
      Lc: (Xc: number) =>
        3.5e26 * Math.pow(Math.max(1e-6, Xc / DEFAULTS.Xc0), 0.6), // smooth monotone proxy
    }),
    []
  );

  // Mix vs no-mix
  const sim = useMemo(() => {
    const p = fleetToTrip(baseParams, ships, rateKgS);
    return simulate(p, horizonYrs, 0.2);
  }, [baseParams, ships, rateKgS, horizonYrs]);

  const Pfinal = sim.at(-1)?.P ?? 0;
  const Xmin = sim.reduce((m, pt) => Math.min(m, pt.Xc), 1);
  const guardX = baseParams.trip.guard?.X ?? null;

  const pass =
    (guardX === null || Xmin >= guardX) &&
    Pfinal < 0.2; // simple gate: maintain guard & keep hazard under 20% at horizon

  // Baseline (no-mix) for reference / suppression metric
  const noMixParams: DeepMixParams = useMemo(
    () => ({ ...baseParams, trip: { ...baseParams.trip, mdotMax: 0, Mtrip: 0 } }),
    [baseParams]
  );
  const noMixSim = useMemo(() => simulate(noMixParams, horizonYrs, 0.2), [noMixParams, horizonYrs]);
  const PfinalNoMix = noMixSim.at(-1)?.P ?? 0;

  const absoluteReduction = Math.max(0, (PfinalNoMix - Pfinal) * 100); // percentage points
  const suppressionRatio =
    PfinalNoMix > 1e-9 ? Math.max(0, Math.min(1, Pfinal / PfinalNoMix)) : null; // lower is better

  // Sweet-spot scan (log-spaced fleets)
  const sweet = useMemo(() => {
    const grid: number[] = [];
    for (let e = 3; e <= 10; e += 0.25) grid.push(Math.round(Math.pow(10, e)));
    return findSweetSpot(baseParams, horizonYrs, grid, rateKgS);
  }, [baseParams, horizonYrs, rateKgS]);

  const sweetMin = useMemo(() => {
    if (!sweet.length) return null;
    return sweet.reduce((best, cur) => (cur.P < best.P ? cur : best), sweet[0]);
  }, [sweet]);

  // Recharts data
  const sweetData = sweet.map((d) => ({ ships: d.ships, hazard: d.P, pass: d.pass }));
  const hazardTooltipFormatter: TooltipProps<number, string>["formatter"] = (value, name) => {
    if (!Number.isFinite(value)) {
      return "N/A";
    }
    if (name === "hazard") {
      return `${(value * 100).toFixed(2)}%`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Deep-Mixing: Sweet-Spot Scanner</h2>
            <Badge variant={pass ? "default" : "destructive"}>{pass ? "PASS" : "FAIL"}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="text-xs uppercase tracking-wide opacity-70">
                Cumulative transition probability
              </div>
              <div className="text-2xl font-semibold">{(Pfinal * 100).toFixed(2)}%</div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40">
              <div className="text-xs uppercase tracking-wide opacity-70">Core H guard</div>
              <div className="text-2xl font-semibold">
                {guardX === null ? "—" : guardX.toFixed(3)} (min {Xmin.toFixed(3)})
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40">
              <div className="text-xs uppercase tracking-wide opacity-70">Suppression vs no-mix</div>
              <div className="text-2xl font-semibold">
                {suppressionRatio === null
                  ? "—"
                  : `${Math.round((1 - suppressionRatio) * 100)}% less risk`}
                <span className="text-xs ml-1 opacity-70">
                  ({absoluteReduction.toFixed(2)} pts)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 mb-2">
            <h3 className="text-lg font-semibold">Horizon hazard vs fleet size</h3>
            <Badge>
              {sweetMin
                ? `Sweet spot ≈ ${sweetMin.ships.toLocaleString()} ships`
                : "Lower is better"}
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
                  formatter={hazardTooltipFormatter}
                  labelFormatter={(x) => `ships=${Number(x).toLocaleString()}`}
                />
                <Line type="monotone" dataKey="hazard" dot={false} strokeWidth={2} />
                {/* Target threshold */}
                <ReferenceLine y={0.2} strokeDasharray="4 2" />
                {/* Current fleet */}
                <ReferenceLine x={ships} strokeDasharray="1 3" />
                {/* Sweet spot marker */}
                {sweetMin ? <ReferenceLine x={sweetMin.ships} strokeDasharray="3 3" /> : null}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-sm mt-3 opacity-80">
            This scanner sweeps fleet capacity and plots the cumulative red-giant transition
            probability at the selected horizon. The “sweet spot” is the lowest point of the curve,
            where adding more ships yields diminishing returns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
