import React, { useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";

type TelemetryBinding = {
  label: string;
  path?: string;
  hint?: string;
  value?: string | number | boolean | null;
};

type LadderStep = {
  id: string;
  title: string;
  goal: string;
  experiments: string[];
  verifying: string;
  telemetry: TelemetryBinding[];
};

function get(path: string, payload: any): unknown {
  return path.split(".").reduce((acc: any, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), payload);
}

function fmtValue(raw: unknown): string {
  if (raw === null || raw === undefined) return "\u2014";
  if (typeof raw === "boolean") return raw ? "yes" : "no";
  const n = Number(raw);
  if (Number.isFinite(n)) {
    if (Math.abs(n) >= 1e5 || Math.abs(n) <= 1e-3) return n.toExponential(2);
    return n.toString();
  }
  return String(raw);
}

export default function WarpExperimentLadderPanel() {
  const { data: pipeline } = useEnergyPipeline({ refetchInterval: 1000 });
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const ampChain = useMemo(() => {
    const gGeo = Number(pipeline?.gammaGeo);
    const q = Number(pipeline?.qSpoilingFactor);
    const v = Number((pipeline as any)?.gammaVanDenBroeck ?? (pipeline as any)?.gammaVdB);
    if ([gGeo, q, v].every((x) => Number.isFinite(x))) {
      return Math.pow(gGeo, 3) * q * v;
    }
    return null;
  }, [pipeline]);

  const steps: LadderStep[] = useMemo(
    () => [
      {
        id: "static",
        title: "Static Casimir tile \u2192 negative-energy budget",
        goal: "Lock down per-tile static Casimir energy so the exotic-mass budget is grounded.",
        experiments: [
          "Fabricate single tiles and small arrays with the flight gap_nm and material stack.",
          "Measure Casimir force/energy vs gap, temperature, and coatings; fit to the server model.",
          "Populate U_static, U_cycle, U_geo, U_Q, P_loss_raw, N_tiles from the fit and extrapolate to the hull.",
          "Compare integrated static negative-energy band to the UI exotic mass (M_exotic, M_exotic_kg)."
        ],
        verifying: "Static Casimir model + hull tiling + mass proxy are numerically consistent with measurements.",
        telemetry: [
          { label: "U_static", path: "U_static" },
          { label: "U_cycle", path: "U_cycle" },
          { label: "U_geo", path: "U_geo" },
          { label: "U_Q", path: "U_Q" },
          { label: "P_loss_raw", path: "P_loss_raw" },
          { label: "N_tiles", path: "N_tiles" },
          { label: "M_exotic", path: "M_exotic" },
          { label: "M_exotic_kg", path: "M_exotic_kg", hint: "mass proxy" }
        ]
      },
      {
        id: "dynamic",
        title: "Dynamic Casimir ladder \u2192 amplification chain",
        goal: "Show pumped gaps produce the dynamic power and effective Q ladder the pipeline assumes.",
        experiments: [
          "Pump single cavities at GHz with pm strokes; measure output vs modulationFreq_GHz, qCavity, qMechanical, stroke.",
          "Scale to small arrays and map how effective Q, power density, and mode structure scale with tile count and phasing.",
          "Back out amp chain used by visuals: gammaGeo, qSpoilingFactor, qCavity, gammaVanDenBroeck_*, ampChain = gammaGeo^3 * qSpoilingFactor * gammaVdB."
        ],
        verifying: "The energy ladder that converts static negative energy into an effective exotic stress band matches measurements.",
        telemetry: [
          { label: "modulationFreq_GHz", path: "modulationFreq_GHz" },
          { label: "qCavity", path: "qCavity" },
          { label: "qMechanical", path: "qMechanical" },
          { label: "strokeAmplitude_pm", path: "strokeAmplitude_pm" },
          { label: "gammaGeo", path: "gammaGeo" },
          { label: "gammaVanDenBroeck", path: "gammaVanDenBroeck" },
          { label: "qSpoilingFactor", path: "qSpoilingFactor" },
          { label: "ampChain", value: ampChain ?? undefined, hint: "gammaGeo^3*qSpoil*gammaVdB (computed)" }
        ]
      },
      {
        id: "ford-roman",
        title: "Ford\u2013Roman / light-crossing \u2192 time-sliced regime",
        goal: "Show bursts are strobed fast compared to local light-crossing so GR sees the average.",
        experiments: [
          "Measure burst/dwell at tile and sector level; compare to burst_ms, dwell_ms, sectorPeriod_ms, sectorsTotal, sectorsConcurrent, dutyEffectiveFR.",
          "Measure tau_LC(x) = d_hull(x)/c and compare to lightCrossing.tauLC_ms / tauLC_s in pipeline and overlays.",
          "Run high time-scale ratio modes; confirm QI guards (zeta, fordRomanCompliance, TS_ratio) stay in the green band."
        ],
        verifying: "Duty vs tau_LC constraint holds in hardware so GR can couple to <T_mu_nu> over tauLC, not the microbursts.",
        telemetry: [
          { label: "burst_ms", path: "lightCrossing.burst_ms" },
          { label: "dwell_ms", path: "lightCrossing.dwell_ms" },
          { label: "tauLC_ms", path: "lightCrossing.tauLC_ms" },
          { label: "sectorPeriod_ms", path: "sectorPeriod_ms" },
          { label: "sectorCount", path: "sectorCount" },
          { label: "sectorsConcurrent", path: "concurrentSectors" },
          { label: "dutyEffectiveFR", path: "dutyEffectiveFR" },
          { label: "TS_ratio", path: "TS_ratio" },
          { label: "zeta", path: "zeta" },
          { label: "fordRomanCompliance", path: "fordRomanCompliance" }
        ]
      },
      {
        id: "phoenix",
        title: "Phoenix averaging \u2192 kappa_drive + tauLC in telemetry",
        goal: "Confirm Phoenix kappa_drive and light-crossing averaging are fed by real power and timing data.",
        experiments: [
          "Feed live pipeline into PhoenixNeedlePanel (dutyEffective, geometryGain, powerDensityBase, sectorCount, sectorsConcurrent, tauLC_s, burst_s, dwell_s, sectorPeriod_s, TS_ratio).",
          "Independently measure tile power density/timing and compare to Phoenix worldline/spacetime heatmaps and kappa_drive outputs.",
          "Confirm Phoenix tauLC_s and effective duty match step 3 measurements."
        ],
        verifying: "G_{mu nu} = 8*pi*G * avg_tauLC(T_{mu nu}) is tied to real telemetry, not placeholders.",
        telemetry: [
          { label: "dutyEffective", path: "dutyEffectiveFR" },
          { label: "geometryGain", path: "gammaGeo" },
          { label: "powerDensityBase", path: "powerDensityBase" },
          { label: "sectorCount", path: "sectorCount" },
          { label: "sectorsConcurrent", path: "concurrentSectors" },
          { label: "sectorPeriod_s", path: "sectorPeriod_ms", hint: "/1000 s" },
          { label: "tauLC_ms", path: "lightCrossing.tauLC_ms" },
          { label: "TS_ratio", path: "TS_ratio" }
        ]
      },
      {
        id: "natario",
        title: "Natario/Alcubierre constraints \u2192 math with live params",
        goal: "Check a Natario-like warp field exists for the measured ladder.",
        experiments: [
          "Feed measured ladder into server pipeline to emit warpParams: hull a/b/c, sigma, R, beta, ampChain, dutyEffectiveFR, sectorization, tauLC.",
          "Run the warp/Natario solver and inspect geometryValid, amplificationValid, quantumSafe, warpFieldStable.",
          "Iterate until experimentally QI-safe points also pass warp-module checks."
        ],
        verifying: "A Natario solution exists for the measured exotic-energy ladder and time-sliced stress tensor.",
        telemetry: [
          { label: "beta", path: "beta" },
          { label: "sigma", path: "sigma" },
          { label: "R", path: "R" },
          { label: "ampChain", value: ampChain ?? undefined },
          { label: "warp.geometryValid", path: "warp.geometryValid" },
          { label: "warp.amplificationValid", path: "warp.amplificationValid" },
          { label: "warp.quantumSafe", path: "warp.quantumSafe" },
          { label: "warp.warpFieldStable", path: "warp.warpFieldStable" }
        ]
      },
      {
        id: "gating",
        title: "Sector gating parity \u2192 front/back dipole",
        goal: "Show the live scheduler produces the expected front-negative / aft-positive dipole.",
        experiments: [
          "Sweep phase01, splitEnabled, splitFrac, sectorCount, sectorsConcurrent while watching Alcubierre/Hull3D.",
          "Phase-flip: set phase01=0.5 and confirm contraction/expansion swap front vs back.",
          "Scheduler: verify only non-overlapping wedges are on per tick; FR lamp stays PASS_AVG while steering."
        ],
        verifying: "Sector gating matches theta_gr sign flip (beta * df_dx) and stays within FR/QI duty bounds.",
        telemetry: [
          { label: "phase01", path: "phase01" },
          { label: "splitEnabled", path: "splitEnabled" },
          { label: "splitFrac", path: "splitFrac" },
          { label: "sectorCount", path: "sectorCount" },
          { label: "sectorsConcurrent", path: "concurrentSectors" },
          { label: "phaseSchedule.negSectors", path: "phaseSchedule.negSectors.length", hint: "count" },
          { label: "phaseSchedule.posSectors", path: "phaseSchedule.posSectors.length", hint: "count" }
        ]
      },
      {
        id: "integrated",
        title: "Integrated needle-hull stress proxy (no FTL claim)",
        goal: "Run a sub-scale needle hull and compare to coarse-grained stress/curvature proxies.",
        experiments: [
          "Operate a tiled, pumped sub-scale hull at an operating point that passed steps 2\u20136.",
          "Instrument strain/inertial sensors and EM timing loops across the shell; add any gravity/frame-drag proxies.",
          "Compare against Phoenix kappa_drive maps, Hull3D overlays (theta_gr, rho_gr, theta_drive), and Helix/Greens metrics (phi, tidal eigenvalues, duty/tauLC badges)."
        ],
        verifying: "Integrated hardware matches the Needle-hull GR model across stress proxies and light-crossing timing.",
        telemetry: [
          { label: "kappa_drive", path: "kappa_drive" },
          { label: "theta_drive", path: "theta_drive" },
          { label: "theta_gr", path: "theta_gr" },
          { label: "rho_gr", path: "rho_gr" },
          { label: "stressEnergy", path: "stressEnergy" },
          { label: "phi", path: "phi" }
        ]
      }
    ],
    [ampChain, pipeline]
  );

  const toggleStep = (id: string) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resolvedTelemetry = (binding: TelemetryBinding) => {
    const raw = binding.value ?? (binding.path ? get(binding.path, pipeline) : undefined);
    return fmtValue(raw);
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-50">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Helix experiment ladder</p>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-white">
            <ClipboardList className="h-5 w-5 text-emerald-300" />
            Warp Experiment Ladder
          </h1>
          <p className="text-xs text-slate-300">
            Seven rungs from Casimir tiles to Natario warp checks, pinned to live Helix/Needle telemetry so you can
            literally check them off.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-200">
          <Badge variant="outline" className="border-emerald-400/50 bg-emerald-500/10 text-emerald-100">
            Live pipeline
          </Badge>
          <button
            type="button"
            onClick={() => setCompleted({})}
            className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-[11px] text-slate-100 hover:border-emerald-400/60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset checkmarks
          </button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-5">
          {steps.map((step, idx) => (
            <Card key={step.id} className="border border-slate-800 bg-slate-900/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Step {idx + 1}</p>
                  <CardTitle className="flex items-center gap-2 text-base text-white">
                    {completed[step.id] ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-slate-500" aria-hidden />
                    )}
                    {step.title}
                  </CardTitle>
                  <p className="text-xs text-slate-300">{step.goal}</p>
                </div>
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(completed[step.id])}
                    onChange={() => toggleStep(step.id)}
                    className="h-4 w-4 rounded border-slate-500 text-emerald-500"
                  />
                  Mark done
                </label>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-100">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Experiments</p>
                  <ul className="space-y-2 text-sm leading-snug">
                    {step.experiments.map((item, i) => (
                      <li key={`${step.id}-exp-${i}`} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-slate-100">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator className="bg-slate-800" />
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Telemetry hooks</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {step.telemetry.map((binding) => (
                      <div
                        key={`${step.id}-${binding.label}`}
                        className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-100">{binding.label}</span>
                          <span className="text-[11px] text-slate-400">
                            {binding.path ? binding.path : "computed"}{binding.hint ? ` \u00b7 ${binding.hint}` : ""}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-emerald-200">{resolvedTelemetry(binding)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator className="bg-slate-800" />
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">You are verifying</p>
                  <p className="text-sm text-slate-200">{step.verifying}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="border border-amber-700/60 bg-amber-950/40 text-amber-50">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Big caveat
              </div>
              <p className="text-sm">
                Even if every rung passes, this does not prove a macroscopic, superluminal warp bubble. It shows the
                negative-energy budget is measured, the strobing scheme respects Ford\u2013Roman/QI bounds in the model, and
                a Natario-style warp field is mathematically compatible with those numbers.
              </p>
              <p className="text-xs text-amber-200">
                That is the intended target: internal consistency between Casimir tiles, FR-constrained strobing, Phoenix
                averaging, and Natario geometry wired to the telemetry and visuals you see in Helix Core.
              </p>
            </CardHeader>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
