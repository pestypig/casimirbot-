import * as React from "react";
import { useMetrics } from "@/hooks/use-metrics";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { toHUDModel } from "@/lib/hud-adapter";

type ScaleProps = {
  dwellMs?: number;
  tauLcMs?: number;
  burstMs?: number;
  sectorIdx?: number;
  sectorCount?: number;
  phase?: number;
};

export default function LightSpeedStrobeScale(props: ScaleProps = {}) {
  const { data: metrics } = useMetrics();
  const { data: pipeline } = useEnergyPipeline();
  const wu  = metrics?.warpUniforms ?? pipeline?.warpUniforms ?? null;
  const hud = toHUDModel({
    warpUniforms: wu || {},
    viewerHints: metrics?.viewerHints || {},
    lightCrossing: metrics?.lightCrossing || {},
  });

  // Prefer props; fall back to HUD
  const fGHz  = (pipeline as any)?.modulationFreq_GHz ?? 15.0;
  const Tm    = 1 / (fGHz * 1e9);

  const tauLC = Number.isFinite(props.tauLcMs) ? props.tauLcMs! / 1000 : (hud.TS_long * Tm);
  const Tsec  = Number.isFinite(props.dwellMs) ? props.dwellMs! / 1000 : (hud.sectorPeriod_ms / 1000);
  const burst = Number.isFinite(props.burstMs) ? props.burstMs! / 1000 : (hud.dutyShip * Tsec);

  const sectors   = hud.sectorsConcurrent;
  const dutyFR    = hud.dutyShip;

  const tMax = Math.max(tauLC || 0, Tm || 0, Tsec || 0) || 1;
  const tPad = tMax * 1.08; // 8% headroom so labels don't clip

  const passBurstVsTau = Number.isFinite(burst) && Number.isFinite(tauLC) ? (burst < tauLC) : false;
  const passDwellVsTau = Number.isFinite(Tsec)  && Number.isFinite(tauLC) ? (Tsec  >= tauLC) : false;

  // small animation
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    let raf = 0, t0 = performance.now();
    const loop = (t: number) => { setTick((((t - t0) / 2000) % 1 + 1) % 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const mode = ((pipeline as any)?.currentMode ?? "hover").toLowerCase();
  const modeTint =
    mode === "standby"   ? "from-slate-700/40 to-slate-800/40" :
    mode === "cruise"    ? "from-cyan-700/30 to-slate-800/40"  :
    mode === "hover"     ? "from-sky-700/30 to-slate-800/40"   :
    mode === "emergency" ? "from-rose-700/30 to-slate-800/40"  :
                           "from-slate-700/40 to-slate-800/40";

  const pct = (v: number, max: number) =>
    `${Math.min(100, Math.max(0, (v / (max || 1)) * 100)).toFixed(3)}%`;

  const fmtSI = (t: number) => {
    if (!Number.isFinite(t)) return "—";
    if (t >= 1) return `${t.toFixed(2)} s`;
    if (t >= 1e-3) return `${(t*1e3).toFixed(2)} ms`;
    if (t >= 1e-6) return `${(t*1e6).toFixed(2)} µs`;
    if (t >= 1e-9) return `${(t*1e9).toFixed(2)} ns`;
    return `${(t*1e12).toFixed(2)} ps`;
  };

  return (
    <div className={`rounded-lg border bg-gradient-to-br ${modeTint} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-sm">Light-Speed vs Strobing Scale</div>
        <div className="text-xs text-slate-400">
          Mode: <span className="uppercase">{(pipeline as any)?.currentMode ?? "—"}</span>
        </div>
      </div>

      <div className="relative h-16 rounded-md bg-black/40 border border-white/10 overflow-hidden">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-white/10" />

        {/* τ_LC */}
        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: pct(tauLC, tPad) }} aria-label={`tauLC ${fmtSI(tauLC)}`}>
          <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          <div className="absolute top-2 left-1 translate-x-1 text-[10px] text-yellow-300">
            τₗc {fmtSI(tauLC)}
          </div>
        </div>

        {/* T_m */}
        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: pct(Tm, tPad) }} aria-label={`Tm ${fmtSI(Tm)}`}>
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <div className="absolute top-2 left-1 translate-x-1 text-[10px] text-cyan-300">
            Tₘ {fmtSI(Tm)}
          </div>
        </div>

        {/* T_sec */}
        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: pct(Tsec, tPad) }} aria-label={`Tsec ${fmtSI(Tsec)}`}>
          <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]" />
          <div className="absolute top-2 left-1 translate-x-1 text-[10px] text-violet-300">
            Tₛₑc {fmtSI(Tsec)}
          </div>
        </div>

        {/* Burst window (drawn as a faint span starting at sector start) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[6px] bg-white/10 rounded-sm"
          style={{ left: pct(0, tPad), width: pct(burst, tPad) }}
          title="Local FR window (burst)"
        />

        {/* tracer */}
        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${tick * 100}%` }}>
          <div className="w-[6px] h-[6px] rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
        </div>
      </div>

      {/* Legend + compliance */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
        <div className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />τₗc: light-crossing</div>
        <div className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />Tₘ: modulation</div>
        <div className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-violet-400" />Tₛₑc: dwell per sector</div>
        <div className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-white/70" />Duty (FR): {(dutyFR*100).toFixed(3)}% • burst {fmtSI(burst)}</div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
        <span className={`px-2 py-0.5 rounded border ${passBurstVsTau ? 'bg-green-500/15 border-green-500/30 text-green-300' : 'bg-red-500/15 border-red-500/30 text-red-300'}`}>
          burst &lt; τₗc: {passBurstVsTau ? 'PASS' : 'WARN'}
        </span>
        <span className={`px-2 py-0.5 rounded border ${passDwellVsTau ? 'bg-green-500/15 border-green-500/30 text-green-300' : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300'}`}>
          Tₛₑc ≥ τₗc: {passDwellVsTau ? 'PASS' : 'CHECK'}
        </span>
        <span className="px-2 py-0.5 rounded border border-white/10 text-slate-300">
          sectors: {sectors}
        </span>
      </div>
    </div>
  );
}