import * as React from "react";
import { useMetrics } from "@/hooks/use-metrics";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { toHUDModel, si, zetaStatusColor } from "@/lib/hud-adapter";

function fmtSI(t: number) {
  if (!Number.isFinite(t)) return "—";
  if (t >= 1) return `${t.toFixed(2)} s`;
  if (t >= 1e-3) return `${(t*1e3).toFixed(2)} ms`;
  if (t >= 1e-6) return `${(t*1e6).toFixed(2)} µs`;
  if (t >= 1e-9) return `${(t*1e9).toFixed(2)} ns`;
  return `${(t*1e12).toFixed(2)} ps`;
}

// linear map [0,max] -> [0,100%]
function pct(v: number, max: number) {
  return `${Math.min(100, Math.max(0, (v / max) * 100)).toFixed(3)}%`;
}

export default function LightSpeedStrobeScale() {
  const { data: metrics } = useMetrics();
  const { data: pipeline } = useEnergyPipeline();

  // Use HUD adapter for drift-proof field access
  const hud = toHUDModel({ ...(pipeline || {}), ...(metrics || {}) } as any);
  
  // --- Inputs with graceful fallbacks ---
  const fGHz = (pipeline as any)?.modulationFreq_GHz ?? 15.0;              // 15 GHz default
  const Tm   = 1 / (fGHz * 1e9);                                   // s
  const tauLC = hud.TS_long * Tm;                                   // s (conservative long axis)
  const Tsec = hud.sectorPeriod_ms / 1000;                        // s per sector
  const sectors = hud.sectorsConcurrent;                          // concurrent live sectors
  const dutyFR = hud.dutyShip;                                     // authoritative ship-wide duty

  // pick a shared max for the bar
  const tMax = Math.max(tauLC, Tm, Tsec) || 1;

  // tiny animation 0..1 on ~2 second cycle (doesn't affect physics)
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    let t0 = performance.now();
    const loop = (t: number) => {
      const dt = (t - t0) / 2000; // 2s
      setTick((dt % 1 + 1) % 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Mode tint
  const mode = ((pipeline as any)?.currentMode ?? "hover").toLowerCase();
  const modeTint =
    mode === "standby"   ? "from-slate-700/40 to-slate-800/40" :
    mode === "cruise"    ? "from-cyan-700/30 to-slate-800/40"  :
    mode === "hover"     ? "from-sky-700/30 to-slate-800/40"   :
    mode === "emergency" ? "from-rose-700/30 to-slate-800/40"  :
                           "from-slate-700/40 to-slate-800/40";

  return (
    <div className={`rounded-lg border bg-gradient-to-br ${modeTint} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-sm">Light-Speed vs Strobing Scale</div>
        <div className="text-xs text-slate-400">
          Mode: <span className="uppercase">{(pipeline as any)?.currentMode ?? "—"}</span>
        </div>
      </div>

      {/* Ruler */}
      <div className="relative h-16 rounded-md bg-black/40 border border-white/10 overflow-hidden">
        {/* base track */}
        <div className="absolute inset-y-0 left-0 right-0">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-white/10" />
        </div>

        {/* τ_LC marker (gold dot + label) */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: pct(tauLC, tMax) }}
        >
          <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          <div className="absolute top-2 left-1 translate-x-1 text-[10px] text-yellow-300">
            τₗc {fmtSI(tauLC)}
          </div>
        </div>

        {/* T_m marker (cyan) */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: pct(Tm, tMax) }}
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <div className="absolute top-2 left-1 translate-x-1 text-[10px] text-cyan-300">
            Tₘ {fmtSI(Tm)}
          </div>
        </div>

        {/* T_sec marker (violet) */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: pct(Tsec, tMax) }}
        >
          <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]" />
          <div className="absolute top-2 left-1 translate-x-1 text-[10px] text-violet-300">
            Tₛₑc {fmtSI(Tsec)}
          </div>
        </div>

        {/* animated tracer along the ruler */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `${tick * 100}%` }}
        >
          <div className="w-[6px] h-[6px] rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
          τₗc: light-crossing time (long axis)
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />
          Tₘ: modulation period (1/fₘ)
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
          Tₛₑc: per-sector dwell
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-white/70" />
          Duty (FR proxy): {(dutyFR*100).toFixed(3)}%
        </div>
      </div>
    </div>
  );
}