import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Info, Activity, Lock, Radio, Sigma, AudioWaveform } from "lucide-react";
import {
  LineChart,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceArea,
  ReferenceLine,
} from "recharts";

/**
 * SpectrumTunerPanel.tsx
 * ---------------------------------------
 * Read-only panel that *demonstrates* how geometry and dynamics shape the allowed vacuum spectrum.
 * - Mirrors the "provenance" / liveness pattern used elsewhere in Helix.
 * - Never writes to pipeline/mode state; toggles alter *only the rendering*.
 * - Geometry is the ONLY control that moves the spectral cutoff; other toggles only affect lineshape and power.
 * - Designed to drop into the right column under GreensLivePanel.
 *
 * Integration: pass live values from your store/metrics/derived. If a field is undefined the panel
 * will render a safe fallback and mark provenance as "—".
 */

// ---------------------------
// Types
// ---------------------------
export type Provenance = "live" | "metrics" | "derived" | "—";

export type SpectrumLiveInputs = {
  a_nm?: number;              // nominal flat gap (display-only default 1.000)
  sagDepth_nm?: number;       // bowl sag depth from pipeline (live)
  gammaGeo?: number;          // provided if you already compute it upstream

  Q0?: number;                // base (materials-limited) Q
  qCavity?: number;           // actual cavity Q if available
  qSpoilingFactor?: number;   // UI proxy; can reflect ports/roughness etc.
  modulationFreq_GHz?: number;// Ω / 2π in GHz

  duty?: number;              // 0..1 fractional (local burst duty)
  sectors?: number;           // sector count (S)
  lightCrossing_us?: number;  // light-crossing time of the tile (for the time plot scale)

  // Optional provenance labels for badges
  prov?: Partial<Record<keyof SpectrumLiveInputs, Provenance>>;
};

export type SpectrumTunerPanelProps = {
  title?: string;
  inputs?: SpectrumLiveInputs;
  readOnly?: boolean; // reserved for future; panel is always read-only by design
  className?: string;
};

// ---------------------------
// Helpers
// ---------------------------
const K = Math.PI ** 2 * 1.054e-34 * 3e8 / 240; // π^2 ħ c / 240 (SI); only for relative scaling

function provBadge(p: Provenance | undefined) {
  const label = p ?? "—";
  const map: Record<Provenance, string> = {
    live: "bg-emerald-500/20 text-emerald-700",
    metrics: "bg-indigo-500/20 text-indigo-700",
    derived: "bg-slate-500/20 text-slate-700",
    "—": "bg-muted text-muted-foreground",
  } as const;
  return <Badge className={`rounded-full px-2 py-0.5 text-[10px] ${map[label]}`}>{label}</Badge>;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

// Make a nice normalized frequency axis (0..1). We'll visualize cutoff as x_cut in [0,1].
function makeFreqAxis(N = 240) {
  return Array.from({ length: N }, (_, i) => i / (N - 1));
}
// ---------------------------
// Component
// ---------------------------
export default function SpectrumTunerPanel({
  title = "Spectrum Tuner (LIVE, Read-only)",
  inputs,
  className,
}: SpectrumTunerPanelProps) {
  const [showGeom, setShowGeom] = useState(true);
  const [showMaterials, setShowMaterials] = useState(true);
  const [showTemp, setShowTemp] = useState(false);
  const [showDCE, setShowDCE] = useState(true);
  const [showTimeLoop, setShowTimeLoop] = useState(true);

  // ---- Live inputs with safe fallbacks (display-only; never written upstream)
  const a_nm = inputs?.a_nm ?? 1.0; // display-only baseline
  const sag_nm = inputs?.sagDepth_nm ?? 0.016; // typical for your 0.984 nm case
  const gammaGeoLive = inputs?.gammaGeo;

  // Effective gap and gamma
  const a_eff_nm_geomOnly = a_nm - sag_nm;
  const a_eff_nm = showGeom ? a_eff_nm_geomOnly : a_nm;
  const gamma_geo = showGeom ? a_nm / a_eff_nm_geomOnly : 1.0;

  // Cutoff in normalized frequency units (0..1 axis): place x_cut proportional to 1/a_eff
  const x_cut = clamp01((a_nm / a_eff_nm) * 0.25 + 0.05); // heuristic mapping for viz

  // Q / lineshape
  const Q0 = inputs?.Q0 ?? 1e9;
  const qCavity = inputs?.qCavity ?? Q0;
  const qSpoil = inputs?.qSpoilingFactor ?? 1.0;
  const Qvis = showMaterials ? qCavity * qSpoil : Q0;
  const lineWidth = 0.002 * Math.sqrt(1e9 / Math.max(1, Qvis)); // bigger when Q is smaller

  // Dynamic (DCE) parameters for visualization only
  const f_mod_GHz = inputs?.modulationFreq_GHz ?? 15;
  const omegaNorm = clamp01(f_mod_GHz / 30); // normalized to axis 0..1
  const etaDCE = showDCE ? Math.min(2, ((qSpoil * qCavity) / Math.max(1, Q0)) * 0.05) : 0; // proxy

  // Time loop
  const duty = inputs?.duty ?? 0.01;
  const sectors = inputs?.sectors ?? 400;
  const effDuty = showTimeLoop ? duty * (1 / Math.max(1, sectors)) : 1.0; // ship-wide effective duty
  const lc_us = inputs?.lightCrossing_us ?? 0.3; // for scale only

  // Static pressure (for readout only; scaled)
  const P_static_rel = -K / Math.pow(a_eff_nm * 1e-9, 4);

  // ---- Plot data
  const freqAxis = useMemo(() => makeFreqAxis(220), []);

  // Δρ(ω): 0 below cutoff, 1 above; apply tiny ripples + materials if toggled
  const deltaRhoData = useMemo(() => {
    const ripAmp = showMaterials ? 0.05 : 0.02;
    return freqAxis.map((x) => {
      const base = x < x_cut ? 0 : 1;
      const ripple = ripAmp * Math.sin(12 * Math.PI * x);
      return { x, y: Math.max(0, base + ripple) };
    });
  }, [freqAxis, x_cut, showMaterials]);

  // Mode comb with linewidths, plus optional sidebands
  const combData = useMemo(() => {
    const sticks: { x: number; y: number; type: "mode" | "sb"; k?: number }[] = [];
    const spacing = 0.08; // base mode spacing in normalized units
    for (let n = 1; n <= 10; n++) {
      const x0 = x_cut + n * spacing;
      if (x0 > 1) break;
      sticks.push({ x: x0, y: 1, type: "mode" });
      if (showDCE) {
        // first-order sidebands at ±omegaNorm
        const sbAmp = Math.min(0.8, 0.2 + 0.8 * etaDCE);
        const x1 = x0 + omegaNorm * 0.5;
        const x2 = x0 - omegaNorm * 0.5;
        if (x1 < 1) sticks.push({ x: x1, y: sbAmp, type: "sb", k: +1 });
        if (x2 > 0) sticks.push({ x: x2, y: sbAmp, type: "sb", k: -1 });
      }
    }
    return sticks;
  }, [x_cut, showDCE, omegaNorm, etaDCE]);

  // Time loop: envelope and average
  const timeData = useMemo(() => {
    const N = 300;
    const out: { t: number; p: number; env: number }[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1); // 0..1
      const inBurst = (t % (1 / Math.max(1, sectors))) < (duty / Math.max(1, sectors));
      const env = showTimeLoop ? (inBurst ? 1 : 0) : 1;
      const p = (1 + etaDCE * Math.cos(2 * Math.PI * (6 + f_mod_GHz / 5) * t)) * env;
      out.push({ t, p, env });
    }
    return out;
  }, [showTimeLoop, duty, sectors, etaDCE, f_mod_GHz]);

  // Provenance badges mapping
  const prov = inputs?.prov ?? {};

  return (
    <Card className={`w-full min-w-0 shadow-sm ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AudioWaveform className="h-4 w-4 text-primary" />
            {title}
            <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              LIVE
            </Badge>
            <Badge variant="secondary" className="ml-2 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              read-only
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" /> Geometry moves cutoff; other toggles reshape spectrum only
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-12 gap-4">
        {/* Left rail: toggles + readouts */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <div className="rounded-2xl border p-3">
            <div className="flex items-center gap-2">
              <Checkbox id="geom" checked={showGeom} onCheckedChange={(v) => setShowGeom(Boolean(v))} />
              <Label htmlFor="geom" className="font-medium">
                Geometry (bowl)
              </Label>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>a (nm)</span>
                <span className="font-mono">{a_nm.toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>sag t (nm)</span>
                <span className="font-mono flex items-center gap-1">
                  {sag_nm.toFixed(3)} {provBadge(prov.sagDepth_nm)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>a_eff (nm)</span>
                <span className="font-mono">{a_eff_nm.toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>γ_geo</span>
                <span className="font-mono flex items-center gap-1">
                  {gamma_geo.toFixed(4)} {gammaGeoLive ? provBadge(prov.gammaGeo) : provBadge("—")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>λ_cut(eq) (nm)</span>
                <span className="font-mono">{(2 * a_eff_nm).toFixed(3)}</span>
              </div>
              <div className="col-span-2">
                {Math.abs(a_eff_nm - 0.984) < 5e-4 && (
                  <Badge className="w-full justify-center bg-amber-500/20 text-amber-800">0.984 nm achieved</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-3">
            <div className="flex items-center gap-2">
              <Checkbox id="mat" checked={showMaterials} onCheckedChange={(v) => setShowMaterials(Boolean(v))} />
              <Label htmlFor="mat" className="font-medium">
                Materials / Q / Ports
              </Label>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Q₀</span>
                <span className="font-mono flex items-center gap-1">
                  {Q0.toExponential(2)} {provBadge(prov.Q0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Q (vis)</span>
                <span className="font-mono flex items-center gap-1">
                  {Qvis.toExponential(2)} {provBadge(prov.qCavity)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>ports·roughness</span>
                <span className="font-mono">×{qSpoil.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-3">
            <div className="flex items-center gap-2">
              <Checkbox id="temp" checked={showTemp} onCheckedChange={(v) => setShowTemp(Boolean(v))} />
              <Label htmlFor="temp" className="font-medium">
                Temperature (thermal correction)
              </Label>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Lifshitz factor applied multiplicatively in the equation view; hidden if not wired.
            </p>
          </div>

          <div className="rounded-2xl border p-3">
            <div className="flex items-center gap-2">
              <Checkbox id="dce" checked={showDCE} onCheckedChange={(v) => setShowDCE(Boolean(v))} />
              <Label htmlFor="dce" className="font-medium">
                Dynamic (DCE)
              </Label>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>f_mod (GHz)</span>
                <span className="font-mono flex items-center gap-1">
                  {f_mod_GHz.toFixed(2)} {provBadge(prov.modulationFreq_GHz)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>η_DCE (proxy)</span>
                <span className="font-mono">{etaDCE.toFixed(3)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-3">
            <div className="flex items-center gap-2">
              <Checkbox id="time" checked={showTimeLoop} onCheckedChange={(v) => setShowTimeLoop(Boolean(v))} />
              <Label htmlFor="time" className="font-medium">
                Global time loop
              </Label>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>burst duty</span>
                <span className="font-mono">{(100 * duty).toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>sectors</span>
                <span className="font-mono flex items-center gap-1">
                  {sectors} {provBadge(prov.sectors)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>d_eff</span>
                <span className="font-mono">{(100 * effDuty).toFixed(3)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>τ_LC (µs)</span>
                <span className="font-mono">{lc_us.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: equation view */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
              <Sigma className="h-4 w-4" /> Live equations
            </div>
            <div className="space-y-1 font-mono text-[12.5px] leading-6">
              <div>λ_cut = 2·a</div>
              {showGeom && (
                <>
                  <div>
                    a_eff = a − t = {a_nm.toFixed(3)} − {sag_nm.toFixed(3)} ={" "}
                    <span className="text-primary font-semibold">{a_eff_nm_geomOnly.toFixed(3)} nm</span>
                  </div>
                  <div>
                    γ_geo = a / a_eff = {a_nm.toFixed(3)} / {a_eff_nm_geomOnly.toFixed(3)} ={" "}
                    <span className="text-primary font-semibold">{gamma_geo.toFixed(4)}</span>
                  </div>
                  <div>
                    λ_cut(eq) = 2·a_eff = <span className="text-primary font-semibold">{(2 * a_eff_nm).toFixed(3)} nm</span>
                  </div>
                </>
              )}
              {!showGeom && <div className="opacity-70">λ_cut(eq) = 2·a (geometry toggle off)</div>}
              <Separator className="my-2" />
              <div>
                P_static(a_eff) = −K·a_eff^(−4) →{" "}
                <span className="text-muted-foreground">relative: {(P_static_rel / 1e-4).toExponential(2)}</span>
              </div>
              {showMaterials && <div>× F_cond(R_s) × F_ports(φ) × F_rough(σ/a)</div>}
              {showTemp && <div>× F_T(a_eff, T)</div>}
              {showDCE && (
                <div className="text-primary/80">
                  DCE sidebands at ±Ω with gain ∝ η_DCE ≈ Q·(δa/a_eff) (UI proxy)
                </div>
              )}
              {showTimeLoop && (
                <div>
                  FR average with envelope g(t): burst duty d = {(100 * duty).toFixed(2)}%, sectors S = {sectors}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Radio className="h-4 w-4" /> Key readouts
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Cutoff x_cut (norm)</span>
                <span className="font-mono">{x_cut.toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Comb width (∝1/Q)</span>
                <span className="font-mono">{lineWidth.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sideband spacing (norm)</span>
                <span className="font-mono">{omegaNorm.toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>η_DCE (proxy)</span>
                <span className="font-mono">{etaDCE.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: plots */}
        <div className="col-span-12 lg:col-span-5 space-y-3">
          {/* Δρ(ω) */}
          <div className="rounded-2xl border p-3">
            <div className="text-sm font-semibold mb-1">Δρ(ω): density-of-states difference</div>
            <div className="h-40 w-full">
              <ResponsiveContainer>
                <AreaChart data={deltaRhoData} margin={{ top: 4, right: 12, left: 6, bottom: 6 }}>
                  <defs>
                    <linearGradient id="gradRho" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="x" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} domain={[0, 1]} type="number" />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} domain={[0, 1.2]} />
                  <RTooltip cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: 3 }} />
                  <Area dataKey="y" stroke="hsl(var(--primary))" fill="url(#gradRho)" strokeWidth={2} />
                  {/* shaded forbidden band */}
                  <ReferenceArea x1={0} x2={x_cut} y1={0} y2={1.2} fill="hsl(var(--muted))" fillOpacity={0.25} />
                  <ReferenceLine x={x_cut} stroke="hsl(var(--destructive))" strokeDasharray="4 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mode comb + sidebands */}
          <div className="rounded-2xl border p-3">
            <div className="text-sm font-semibold mb-1">Mode comb & sidebands (lineshape reflects Q)</div>
            <div className="h-40 w-full">
              <ResponsiveContainer>
                <LineChart data={[] as any} margin={{ top: 4, right: 12, left: 6, bottom: 6 }}>
                  <XAxis type="number" dataKey="x" domain={[0, 1]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="number" dataKey="y" domain={[0, 1.1]} hide />
                  <RTooltip cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: 3 }} />
                  {combData.map((s, i) => (
                    <ReferenceLine
                      key={i}
                      x={s.x}
                      stroke={s.type === "mode" ? "hsl(var(--foreground))" : "hsl(var(--primary))"}
                      strokeOpacity={s.type === "mode" ? 0.9 : 0.6}
                      strokeWidth={s.type === "mode" ? 2 : 1}
                    />
                  ))}
                  <ReferenceArea x1={0} x2={x_cut} y1={0} y2={1.1} fill="hsl(var(--muted))" fillOpacity={0.2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time-domain envelope */}
          <div className="rounded-2xl border p-3">
            <div className="text-sm font-semibold mb-1">P(t) under global time loop (normalized)</div>
            <div className="h-40 w-full">
              <ResponsiveContainer>
                <AreaChart data={timeData} margin={{ top: 4, right: 12, left: 6, bottom: 6 }}>
                  <XAxis dataKey="t" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} domain={[0, 1]} type="number" />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} domain={[0, 1.8]} />
                  <RTooltip cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: 3 }} />
                  <Area dataKey="env" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" fillOpacity={0.25} />
                  <Area dataKey="p" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
