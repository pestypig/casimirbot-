import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMetrics } from "@/hooks/use-metrics";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { toHUDModel } from "@/lib/hud-adapter";
import { useDriveSyncStore } from "@/store/useDriveSyncStore";

type ScaleProps = {
  dwellMs?: number;
  tauLcMs?: number;
  burstMs?: number;
  sectorIdx?: number;
  sectorCount?: number;
  phase?: number;
};

const pickNumber = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const fmtSeconds = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "-";
  if (seconds >= 1) return `${seconds.toFixed(2)} s`;
  if (seconds >= 1e-3) return `${(seconds * 1e3).toFixed(2)} ms`;
  if (seconds >= 1e-6) return `${(seconds * 1e6).toFixed(2)} us`;
  if (seconds >= 1e-9) return `${(seconds * 1e9).toFixed(2)} ns`;
  return `${(seconds * 1e12).toFixed(2)} ps`;
};

export default function LightSpeedStrobeScale(props: ScaleProps = {}) {
  const { data: metrics } = useMetrics();
  const { data: pipeline } = useEnergyPipeline();
  const queryClient = useQueryClient();
  const driveState = useDriveSyncStore();

  const derived = queryClient.getQueryData<any>(["helix:pipeline:derived"]);

  const dutyFRDerived = pickNumber(derived?.dutyEffectiveFR);
  const burstDerived = pickNumber(derived?.burst_ms);
  const dwellDerived = pickNumber(derived?.dwell_ms);
  const sectorsTotalDerived = pickNumber(derived?.sectorsTotal);

  const hud = toHUDModel({
    P_avg: (pipeline as any)?.P_avg ?? (metrics as any)?.energyOutput ?? 0,
    P_loss_raw: (pipeline as any)?.P_loss_raw ?? (metrics as any)?.P_loss_raw ?? 0,
    N_tiles: (pipeline as any)?.N_tiles ?? (metrics as any)?.totalTiles ?? 0,
    dutyEffective_FR:
      (pipeline as any)?.dutyEffectiveFR ??
      (metrics as any)?.dutyEffectiveFR ??
      (metrics as any)?.dutyEffective_FR ??
      0,
    strobeHz: (pipeline as any)?.strobeHz ?? (metrics as any)?.strobeHz ?? 1000,
    sectorPeriod_ms: (pipeline as any)?.sectorPeriod_ms ?? (metrics as any)?.sectorPeriod_ms,
    lightCrossing: (metrics as any)?.lightCrossing || {},
  } as any);

  const modulationGHz = pickNumber((pipeline as any)?.modulationFreq_GHz);
  const modulationHz = Number.isFinite(modulationGHz) && modulationGHz! > 0 ? modulationGHz! * 1e9 : 15e9;
  const Tm = 1 / modulationHz;

  const tauLC = React.useMemo(() => {
    if (Number.isFinite(props.tauLcMs)) return (props.tauLcMs as number) / 1000;

    const derivedTau = pickNumber(derived?.tau_LC_ms);
    if (Number.isFinite(derivedTau)) return (derivedTau as number) / 1000;

    const lc = (metrics as any)?.lightCrossing ?? {};
    const hudTau =
      pickNumber((hud as any)?.tauLC_s) ??
      pickNumber((hud as any)?.tau_lc_s) ??
      (Number.isFinite((hud as any)?.tauLC_ms) ? Number((hud as any).tauLC_ms) / 1000 : undefined) ??
      (Number.isFinite(lc?.tauLC_ms) ? Number(lc.tauLC_ms) / 1000 : undefined) ??
      (Number.isFinite(lc?.tau_ms) ? Number(lc.tau_ms) / 1000 : undefined);

    if (Number.isFinite(hudTau)) return hudTau as number;
    return Tm;
  }, [props.tauLcMs, derived, hud, metrics, Tm]);

  const Tsec = React.useMemo(() => {
    if (Number.isFinite(props.dwellMs)) return (props.dwellMs as number) / 1000;
    if (Number.isFinite(dwellDerived)) return (dwellDerived as number) / 1000;

    const lc = (metrics as any)?.lightCrossing ?? {};
    const dwellMs =
      pickNumber((hud as any)?.sectorPeriod_ms) ??
      pickNumber(lc?.sectorPeriod_ms);

    if (Number.isFinite(dwellMs)) return (dwellMs as number) / 1000;

    if (Number.isFinite(sectorsTotalDerived) && sectorsTotalDerived! > 0) {
      return (sectorsTotalDerived as number) * Tm;
    }

    return Tm;
  }, [props.dwellMs, dwellDerived, hud, metrics, Tm, sectorsTotalDerived]);

  const dutyFR =
    Number.isFinite(dutyFRDerived) ? (dutyFRDerived as number) :
    pickNumber((hud as any)?.dutyShip) ?? 0;

  const burst = React.useMemo(() => {
    if (Number.isFinite(props.burstMs)) return (props.burstMs as number) / 1000;
    if (Number.isFinite(burstDerived)) return (burstDerived as number) / 1000;
    return Math.max(0, dutyFR) * Math.max(0, Tsec);
  }, [props.burstMs, burstDerived, dutyFR, Tsec]);

  const burstOffset = React.useMemo(() => {
    if (!Number.isFinite(props.phase)) return 0;
    const phase = props.phase as number;
    if (phase <= 1) return Math.max(0, Math.min(1, phase)) * Tsec;
    return Math.max(0, Math.min(Tsec, phase));
  }, [props.phase, Tsec]);

  const sectors =
    Number.isFinite(props.sectorCount) ? (props.sectorCount as number) :
    Number.isFinite(sectorsTotalDerived) ? (sectorsTotalDerived as number) :
    pickNumber((hud as any)?.sectorsConcurrent) ?? undefined;

  const sectorIdx = Number.isFinite(props.sectorIdx) ? (props.sectorIdx as number) : undefined;

  const tMax = Math.max(
    Number.isFinite(tauLC) ? tauLC : 0,
    Number.isFinite(Tm) ? Tm : 0,
    Number.isFinite(Tsec) ? Tsec : 0,
  ) || 1;
  const tPad = tMax * 1.08;

  const reciprocityStatus = (derived as any)?.reciprocity?.status as string | undefined;
  // Prefer the shared reciprocity gate; fall back to local timing
  const passBurstVsTau = (() => {
    if (typeof reciprocityStatus === "string") {
      return reciprocityStatus !== "BROKEN_INSTANT";
    }
    return Number.isFinite(burst) && Number.isFinite(tauLC) ? burst >= tauLC : false;
  })();
  const passDwellVsTau = Number.isFinite(Tsec) && Number.isFinite(tauLC) ? Tsec >= tauLC : false;
  const derivedTsRatio = pickNumber((derived as any)?.TS_ratio);
  const fallbackTsRatio =
    Number.isFinite(Tsec) && Number.isFinite(tauLC) && tauLC > 0 ? Tsec / tauLC : undefined;
  const tsRatio = derivedTsRatio ?? fallbackTsRatio;
  const passNatarioTS = Number.isFinite(tsRatio) ? (tsRatio as number) >= 100 : false;
  const burstTauRatio =
    Number.isFinite(burst) && Number.isFinite(tauLC) && tauLC > 0 ? burst / tauLC : undefined;

  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const phase = (((now - start) / 2000) % 1 + 1) % 1;
      setTick(phase);
      raf = requestAnimationFrame(loop);
    };
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

  const pct = (value: number, max: number) => {
    const span = max || 1;
    const clamped = Math.min(100, Math.max(0, (value / span) * 100));
    return `${clamped.toFixed(3)}%`;
  };

  const windows = React.useMemo(() => {
    if (!Number.isFinite(Tsec) || Tsec <= 0 || !Number.isFinite(burst) || burst <= 0) {
      return [] as Array<{ start: number; end: number }>;
    }

    const spans: Array<{ start: number; end: number }> = [];

    const addWindow = (start: number) => {
      const s = Math.max(0, Math.min(Tsec, start));
      const e = Math.max(0, Math.min(Tsec, start + burst));

      if (e > Tsec) {
        spans.push({ start: s, end: Tsec });
        spans.push({ start: 0, end: e - Tsec });
      } else {
        spans.push({ start: s, end: e });
      }
    };

    addWindow(burstOffset);

    if (driveState?.splitEnabled) {
      const offset2 = ((burstOffset + 0.5 * Tsec) % Tsec + Tsec) % Tsec;
      addWindow(offset2);
    }

    return spans;
  }, [burstOffset, burst, Tsec, driveState?.splitEnabled]);

  return (
    <div className={`rounded-lg border bg-gradient-to-br ${modeTint} p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Light-Speed vs Strobing Scale</div>
        <div className="text-xs text-slate-400">
          Mode: <span className="uppercase">{(pipeline as any)?.currentMode ?? "-"}</span>
        </div>
      </div>

      <div className="relative h-16 overflow-hidden rounded-md border border-white/10 bg-black/40">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-white/10" />

        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: pct(tauLC, tPad) }}
          aria-label={`tauLC ${fmtSeconds(tauLC)}`}
        >
          <div className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          <div className="absolute top-2 left-1 translate-x-1 text-[10px] text-yellow-300">
            tauLC {fmtSeconds(tauLC)}
          </div>
        </div>

        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: pct(Tm, tPad) }}
          aria-label={`Tm ${fmtSeconds(Tm)}`}
        >
          <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <div className="absolute top-2 left-1 translate-x-1 text-[10px] text-cyan-300">
            Tm {fmtSeconds(Tm)}
          </div>
        </div>

        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: pct(Tsec, tPad) }}
          aria-label={`Tsec ${fmtSeconds(Tsec)}`}
        >
          <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]" />
          <div className="absolute top-2 left-1 translate-x-1 text-[10px] text-violet-300">
            Tsec {fmtSeconds(Tsec)}
          </div>
        </div>

        {windows.map((window, index) => (
          <div
            key={index}
            className="absolute top-1/2 -translate-y-1/2 rounded-sm bg-white/12"
            style={{
              left: pct(window.start, tPad),
              width: pct(window.end - window.start, tPad),
              height: "6px",
            }}
            title={`Local FR window: ${fmtSeconds(burst)}${burstOffset ? `, phase ${fmtSeconds(burstOffset)}` : ""}`}
          />
        ))}

        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${tick * 100}%` }}>
          <div className="h-[6px] w-[6px] rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
          tauLC: light-crossing
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
          Tm: modulation
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
          Tsec: dwell per sector
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-white/70" />
          Duty (FR): {(Math.max(0, dutyFR) * 100).toFixed(3)}% | burst {fmtSeconds(burst)} | dwell {fmtSeconds(Tsec)}
          {Number.isFinite(burstOffset) && burstOffset > 0 ? ` | phase ${fmtSeconds(burstOffset)}` : ""}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
        <span
          className={`rounded border px-2 py-0.5 ${
            passBurstVsTau
              ? "bg-green-500/15 border-green-500/30 text-green-300"
              : "bg-red-500/15 border-red-500/30 text-red-300"
          }`}
        >
          burst ≥ tauLC: {passBurstVsTau ? "PASS" : "WARN"}
          {Number.isFinite(burstTauRatio) ? ` (${(burstTauRatio as number).toFixed(1)}x)` : ""}
        </span>
        <span
          className={`rounded border px-2 py-0.5 ${
            passDwellVsTau
              ? "bg-green-500/15 border-green-500/30 text-green-300"
              : "bg-yellow-500/15 border-yellow-500/30 text-yellow-300"
          }`}
        >
          Tsec &gt;= tauLC: {passDwellVsTau ? "PASS" : "CHECK"}
        </span>
        <span
          className={`rounded border px-2 py-0.5 ${
            passNatarioTS
              ? "bg-green-500/15 border-green-500/30 text-green-300"
              : "bg-red-500/15 border-red-500/30 text-red-300"
          }`}
        >
          GR proxy: tau, TS&gt;=100 {passNatarioTS ? "PASS" : "WARN"}
          {Number.isFinite(tsRatio) ? ` (${(tsRatio as number).toFixed(1)}x)` : ""}
        </span>
        {Number.isFinite(sectors) && (
          <span className="rounded border border-white/10 px-2 py-0.5 text-slate-300">
            sectors: {sectors}
            {Number.isFinite(sectorIdx) ? ` (sector ${Number(sectorIdx) + 1})` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
