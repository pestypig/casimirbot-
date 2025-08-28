import * as React from "react";
import { useMetrics } from "@/hooks/use-metrics";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { toHUDModel } from "@/lib/hud-adapter";

type ScaleProps = {
  dwellMs?: number;      // sector dwell (ms) override
  tauLcMs?: number;      // light-crossing (ms) override
  burstMs?: number;      // local on-window (ms) override
  sectorIdx?: number;    // optional current sector index (0..sectorCount-1)
  sectorCount?: number;  // optional total sectors (display only)
  phase?: number;        // optional burst phase: if <=1 treated as fraction of Tsec; if >1 treated as seconds
};

export default function LightSpeedStrobeScale(props: ScaleProps = {}) {
  const { data: metrics } = useMetrics();
  const { data: pipeline } = useEnergyPipeline();

  // HUD model (source of truth with sensible fallbacks)
  const wu  = metrics?.warpUniforms ?? pipeline?.warpUniforms ?? null;
  const hud = toHUDModel({
    warpUniforms: wu || {},
    viewerHints: metrics?.viewerHints || {},
    lightCrossing: metrics?.lightCrossing || {},
  });

  // Modulation period
  const fGHz = (pipeline as any)?.modulationFreq_GHz;
  const fHz  = Number.isFinite(fGHz) && fGHz! > 0 ? fGHz! * 1e9 : 15 * 1e9;
  const Tm   = 1 / fHz; // seconds

  // Light-crossing τ_LC (seconds): prefer explicit tau fields, then HUD/metrics, last resort fallback
  const tauLC: number = React.useMemo(() => {
    // 1) explicit prop (ms)
    if (Number.isFinite(props.tauLcMs)) return (props.tauLcMs as number) / 1000;

    // 2) HUD/metrics common shapes
    const lc = (metrics as any)?.lightCrossing ?? {};
    const fromHUDs =
      (hud as any)?.tauLC_s ??
      (hud as any)?.tau_lc_s ??
      (Number.isFinite((hud as any)?.tauLC_ms) ? (hud as any).tauLC_ms / 1000 : undefined) ??
      (Number.isFinite(lc.tauLC_ms) ? lc.tauLC_ms / 1000 : undefined) ??
      (Number.isFinite(lc.tau_ms) ? lc.tau_ms / 1000 : undefined);

    if (Number.isFinite(fromHUDs)) return fromHUDs as number;

    // 3) conservative fallback (ensure visible marker even if LC missing)
    return Tm; // fall back to one modulation period as a placeholder
  }, [props.tauLcMs, hud, metrics, Tm]);

  // Sector dwell (seconds)
  const Tsec: number = React.useMemo(() => {
    if (Number.isFinite(props.dwellMs)) return (props.dwellMs as number) / 1000;
    const dwellMs =
      (hud as any)?.sectorPeriod_ms ??
      (metrics as any)?.lightCrossing?.sectorPeriod_ms ??
      undefined;
    return Number.isFinite(dwellMs) ? (dwellMs as number) / 1000 : Tm * 100; // benign fallback
  }, [props.dwellMs, hud, metrics, Tm]);

  // Duty (Ford–Roman, ship-avg) and burst window
  const dutyFR = Number.isFinite((hud as any)?.dutyShip) ? (hud as any).dutyShip : 0;
  const burst: number = React.useMemo(() => {
    if (Number.isFinite(props.burstMs)) return (props.burstMs as number) / 1000;
    // default: dutyShip × Tsec
    return Math.max(0, dutyFR) * Math.max(0, Tsec);
  }, [props.burstMs, dutyFR, Tsec]);

  // Optional phase offset within the sector
  const burstOffset: number = React.useMemo(() => {
    const p = props.phase;
    if (!Number.isFinite(p)) return 0;
    // If phase ≤ 1, treat as fraction of Tsec; if >1, treat as seconds (clamped to Tsec)
    return p! <= 1 ? Math.max(0, Math.min(1, p!)) * Tsec : Math.max(0, Math.min(Tsec, p!));
  }, [props.phase, Tsec]);

  // Multi-sector readout (display only)
  const sectors =
    Number.isFinite(props.sectorCount) ? (props.sectorCount as number)
    : Number.isFinite((hud as any)?.sectorsConcurrent) ? (hud as any).sectorsConcurrent
    : undefined;
  const sectorIdx =
    Number.isFinite(props.sectorIdx) ? (props.sectorIdx as number)
    : undefined;

  // Timeline sizing
  const tMax = Math.max(tauLC || 0, Tm || 0, Tsec || 0) || 1;
  const tPad = tMax * 1.08; // headroom so labels don’t clip

  // Compliance checks
  const passBurstVsTau = Number.isFinite(burst) && Number.isFinite(tauLC) ? (burst < tauLC) : false;
  const passDwellVsTau = Number.isFinite(Tsec)  && Number.isFinite(tauLC) ? (Tsec  >= tauLC) : false;

  // Tiny tracer animation
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

  // Burst span with phase (wrap-aware: if it overflows the sector, draw two segments)
  const burstStart = Math.max(0, Math.min(Tsec, burstOffset));
  const burstEnd   = Math.max(0, Math.min(Tsec, burstOffset + burst));
  const burstWraps = burstEnd > Tsec;

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

        {/* Burst window with phase offset; draw 1–2 spans depending on wrap */}
        {/* Primary segment */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[6px] bg-white/12 rounded-sm"
          style={{
            left: pct(burstStart, tPad),
            width: pct(burstWraps ? (Tsec - burstStart) : (burstEnd - burstStart), tPad),
          }}
          title={`Local FR window (burst): ${fmtSI(burst)}${burstOffset ? `, phase ${fmtSI(burstOffset)}` : ""}`}
        />
        {/* Wrapped tail (if burst spans beyond sector) */}
        {burstWraps && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-[6px] bg-white/12 rounded-sm"
            style={{ left: pct(0, tPad), width: pct(burstEnd - Tsec, tPad) }}
          />
        )}

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
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-white/70" />
          Duty (FR): {(Math.max(0, dutyFR) * 100).toFixed(3)}% • burst {fmtSI(burst)}
          {Number.isFinite(burstOffset) && burstOffset > 0 ? ` • phase ${fmtSI(burstOffset)}` : ""}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
        <span className={`px-2 py-0.5 rounded border ${passBurstVsTau ? 'bg-green-500/15 border-green-500/30 text-green-300' : 'bg-red-500/15 border-red-500/30 text-red-300'}`}>
          burst &lt; τₗc: {passBurstVsTau ? 'PASS' : 'WARN'}
        </span>
        <span className={`px-2 py-0.5 rounded border ${passDwellVsTau ? 'bg-green-500/15 border-green-500/30 text-green-300' : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300'}`}>
          Tₛₑc ≥ τₗc: {passDwellVsTau ? 'PASS' : 'CHECK'}
        </span>
        {Number.isFinite(sectors) && (
          <span className="px-2 py-0.5 rounded border border-white/10 text-slate-300">
            sectors: {sectors}{Number.isFinite(sectorIdx) ? ` (sector ${sectorIdx! + 1})` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
