import React, { useCallback, useEffect, useMemo } from "react";
import ReversibilityBadge from "./ReversibilityBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useEnergyPipeline, type EnergyPipelineState as PipelineState } from "@/hooks/use-energy-pipeline";
import type { SweepRuntime, SweepPoint, VacuumGapSweepRow } from "@shared/schema";
import { summarizeSweepGuard } from "@/lib/sweep-guards";
import { sweepTelemetry, type SweepSnapshot } from "@/lib/sweepTelemetry";
import { useHardwareFeeds, type HardwareConnectHelp } from "@/hooks/useHardwareFeeds";
import HardwareConnectButton from "./HardwareConnectButton";

type VacuumGapSweepHUDProps = {
  className?: string;
};

type SweepDisplayRow = SweepPoint | VacuumGapSweepRow;
type MaybeSweepRow = SweepDisplayRow | null | undefined;

const FALLBACK = "--";

function formatQL(value?: number | null): string {
  if (!Number.isFinite(value ?? NaN)) return FALLBACK;
  const q = Number(value);
  if (q >= 1e4) return q.toExponential(2);
  if (q >= 1e3) return q.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return q.toFixed(0);
}

function formatPercent(value?: number | null): string {
  if (!Number.isFinite(value ?? NaN)) return FALLBACK;
  return `${(Number(value) * 100).toFixed(2)} %`;
}

function formatNumber(value?: number | null, digits = 2, suffix = ""): string {
  if (!Number.isFinite(value ?? NaN)) return FALLBACK;
  return `${Number(value).toFixed(digits)}${suffix}`;
}

function formatDegrees(value?: number | null): string {
  if (!Number.isFinite(value ?? NaN)) return FALLBACK;
  return `${Number(value).toFixed(2)} deg`;
}

function formatStatus(point: SweepDisplayRow | null): string {
  if (!point) return FALLBACK;
  return point.status ?? (point.stable ? "PASS" : "WARN");
}

function formatQuadrature(point: SweepDisplayRow | null): string {
  if (!point || !Number.isFinite(point.G)) return FALLBACK;
  const signed = formatSigned(point.G, 2, " dB");
  if (signed === FALLBACK) return signed;
  return point.G >= 0 ? `amp ${signed}` : `de-amp (squeezed quadrature) ${signed}`;
}

function formatSigned(value?: number | null, digits = 3, suffix = ""): string {
  if (!Number.isFinite(value ?? NaN)) return FALLBACK;
  const v = Number(value);
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  const absVal = Math.abs(v).toFixed(digits);
  return `${sign}${absVal}${suffix}`;
}

function formatKappa(value?: number | null): string {
  if (!Number.isFinite(value ?? NaN)) return FALLBACK;
  return `${Number(value).toFixed(3)} MHz`;
}

function formatKappaEff(point: SweepDisplayRow | null): string {
  if (!point) return FALLBACK;
  const value = point.kappaEff_MHz;
  if (Number.isFinite(value) && Number(value) > 0) {
    return formatKappa(value);
  }
  return point.status === "UNSTABLE" ? "THRESHOLD" : FALLBACK;
}

function formatRatio(value?: number | null): string {
  if (!Number.isFinite(value ?? NaN)) return FALLBACK;
  return Number(value).toFixed(3);
}

function coalesceSweepRows(primary: MaybeSweepRow, fallback: MaybeSweepRow): SweepDisplayRow | null {
  if (!primary && !fallback) return null;
  if (!primary) return (fallback ?? null) as SweepDisplayRow | null;
  if (!fallback) return (primary ?? null) as SweepDisplayRow | null;

  const base: Record<string, unknown> = {
    ...(fallback as unknown as Record<string, unknown>),
  };
  Object.entries(primary as unknown as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      base[key] = value;
    }
  });
  return base as unknown as SweepDisplayRow;
}

function toSnapshot(
  row: SweepDisplayRow,
  sweepRuntime: SweepRuntime | null,
  guard: string | null,
): SweepSnapshot {
  const toFinite = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const iter = toFinite(sweepRuntime?.iter);
  const total = toFinite(sweepRuntime?.total);
  const pct =
    iter != null && total != null && total > 0
      ? Math.max(0, Math.min(100, (iter / total) * 100))
      : null;

  const rawStatus =
    (row as SweepPoint | VacuumGapSweepRow)?.status ??
    ((row as SweepPoint | VacuumGapSweepRow)?.stable != null
      ? (row as SweepPoint | VacuumGapSweepRow).stable
        ? "PASS"
        : "WARN"
      : null);
  const runtimeStatus =
    typeof sweepRuntime?.status === "string" ? sweepRuntime.status.toUpperCase() : null;
  const status = rawStatus ?? runtimeStatus ?? null;

  const rawKappaEff = (row as SweepPoint | VacuumGapSweepRow)?.kappaEff_MHz;
  let kappaEff: number | "THRESHOLD" | null = null;
  if (Number.isFinite(rawKappaEff ?? NaN)) {
    kappaEff = Number(rawKappaEff);
  } else if (status === "UNSTABLE") {
    kappaEff = "THRESHOLD";
  }

  const guardCap =
    typeof (sweepRuntime as any)?.guardCap === "boolean" ? Boolean((sweepRuntime as any).guardCap) : null;

  return {
    iter,
    total,
    pct,
    d_nm: toFinite((row as SweepPoint | VacuumGapSweepRow)?.d_nm),
    m: toFinite((row as SweepPoint | VacuumGapSweepRow)?.m),
    phi_deg: toFinite((row as SweepPoint | VacuumGapSweepRow)?.phi_deg),
    Omega_GHz: toFinite((row as SweepPoint | VacuumGapSweepRow)?.Omega_GHz),
    detune_MHz: toFinite((row as SweepPoint | VacuumGapSweepRow)?.detune_MHz),
    kappa_MHz: toFinite((row as SweepPoint | VacuumGapSweepRow)?.kappa_MHz),
    kappaEff_MHz: kappaEff,
    pumpRatio: toFinite((row as SweepPoint | VacuumGapSweepRow)?.pumpRatio),
    G_dB: toFinite((row as SweepPoint | VacuumGapSweepRow)?.G),
    QL: toFinite((row as SweepPoint | VacuumGapSweepRow)?.QL),
    status,
    guard: guard ?? null,
    etaMs: toFinite(sweepRuntime?.etaMs),
    slewDelayMs: toFinite(sweepRuntime?.slewDelayMs),
    bestIdx: null,
    guardCap,
  };
}

const STATUS_STYLES: Record<string, string> = {
  RUNNING: "bg-emerald-500/20 text-emerald-300",
  STOPPING: "bg-amber-500/20 text-amber-300",
  CANCELLED: "bg-rose-500/20 text-rose-300",
  COMPLETE: "bg-cyan-500/20 text-cyan-300",
  IDLE: "bg-slate-700/40 text-slate-300",
  PASS: "bg-emerald-500/20 text-emerald-200",
  WARN: "bg-amber-500/20 text-amber-200",
  UNSTABLE: "bg-rose-500/20 text-rose-200",
};

const VACUUM_SWEEP_PROFILE = JSON.stringify(
  {
    profileId: "demo-vacuum-sweep",
    description: "Bench pump + piezo gap, emits flat VacuumGapSweepRow-compatible fields",
    timebase: { source: "ptp", confidence: 0.9 },
    streams: [
      {
        topic: "hardware/vacuum-gap-sweep",
        ingest: {
          type: "scpi",
          endpoint: "tcp://10.42.0.20:5025",
          pollMs: 500,
          commands: [{ send: "READ:SWEEP:POINT?", field: "raw" }],
        },
        transform: {
          flatten: {
            "raw.d_nm": "d_nm",
            "raw.m": "m",
            "raw.Omega_GHz": "Omega_GHz",
            "raw.phi_deg": "phi_deg",
            "raw.kappa_Hz": "kappa_Hz",
            "raw.kappaEff_Hz": "kappaEff_Hz",
            "raw.detune_Hz": "detune_Hz",
            "raw.pumpRatio": "pumpRatio",
            "raw.gain_dB": "G",
            "raw.QL": "QL",
            "raw.noise_temp_K": "noiseTemp_K",
            "raw.plateau": "plateau",
          },
        },
        normalize: {
          pre: "normalizeSweepRowUnitsAndKeys",
          endpoint: "/api/helix/hardware/sweep-point",
        },
      },
    ],
  },
  null,
  2,
);

const VACUUM_GAP_HELP: HardwareConnectHelp = {
  instruments: [
    "Pump synthesizer",
    "Piezo/electrostatic gap actuator",
    "Cryo displacement sensor",
  ],
  feeds: [
    "POST /api/helix/hardware/sweep-point (VacuumGapSweepRow flat)",
    "Guarded on server before append",
  ],
  notes: [
    "Rows must normalize to phi_deg, kappa_MHz, detune_MHz, pumpRatio, noiseTemp_K, plateau.width_deg",
    "Guard parity with sim constants (RHO_CUTOFF, depth, phase bounds)",
  ],
  fileTypes: [".csv (one point per row)", ".json (row per object)"],
  profiles: [
    {
      name: "Bench Sweep (SCPI)",
      description: "Tek/Keysight + piezo stack via LabBridge",
      json: VACUUM_SWEEP_PROFILE,
    },
  ],
};

export default function VacuumGapSweepHUD({ className }: VacuumGapSweepHUDProps) {
  const {
    data,
    sweepResults,
    sweepResultsTotal,
    sweepResultsDropped,
    sweepResultsLimit,
  } = useEnergyPipeline();
  const pipeline = data as PipelineState | undefined;
  const sweep = (pipeline?.sweep ?? null) as SweepRuntime | null;
  const top = Array.isArray(sweep?.top) ? (sweep?.top as SweepPoint[]) : [];
  const historyRows = Array.isArray(sweepResults)
    ? (sweepResults as VacuumGapSweepRow[])
    : [];
  const rowsVisible = historyRows.length;
  const totalRows =
    typeof sweepResultsTotal === "number" ? sweepResultsTotal : rowsVisible;
  const droppedRows =
    typeof sweepResultsDropped === "number"
      ? Math.max(0, sweepResultsDropped)
      : Math.max(0, totalRows - rowsVisible);
  const guardLimit =
    typeof sweepResultsLimit === "number" ? sweepResultsLimit : undefined;
  const trimmedForGuard = droppedRows > 0;

  const hardwareController = useHardwareFeeds({
    panelId: "vacuum-gap-sweep",
    panelTitle: "Vacuum-Gap Sweep",
    help: VACUUM_GAP_HELP,
    fileIngest: {
      endpoint: "/api/helix/hardware/sweep-point",
      kind: "vacuum-sweep",
    },
  });

  const handleCancel = useCallback(async () => {
    try {
      await apiRequest("POST", "/api/helix/pipeline/cancel-sweep", {});
    } catch (err) {
      console.error("[SweepHUD] Failed to cancel sweep:", err);
    }
  }, []);

  const handleCopyTop = useCallback(async () => {
    if (!top.length || !navigator?.clipboard?.writeText) return;
    try {
      const payload = JSON.stringify(top, null, 2);
      await navigator.clipboard.writeText(payload);
    } catch (err) {
      console.error("[SweepHUD] Failed to copy ridge table:", err);
    }
  }, [top]);

  const last = (sweep?.last ?? null) as SweepPoint | null;
  const best = top.length ? top[0] : null;
  const latestHistoryRow: SweepDisplayRow | null = historyRows.length
    ? historyRows[historyRows.length - 1]
    : null;

  const rowForMetrics = useMemo<SweepDisplayRow | null>(() => {
    if (!latestHistoryRow && !last && !best) {
      return null;
    }
    // Prefer the measured history row so partially-populated sweep.last snapshots don't zero out fields mid-step.
    return (
      coalesceSweepRows(latestHistoryRow, last) ??
      (latestHistoryRow as SweepDisplayRow | null) ??
      (last as SweepDisplayRow | null) ??
      (best as SweepDisplayRow | null) ??
      null
    );
  }, [best, last, latestHistoryRow]);

  const guardSummary = useMemo(
    () => summarizeSweepGuard(rowForMetrics ?? best ?? null),
    [best, rowForMetrics],
  );

  const snapshot = useMemo<SweepSnapshot | null>(() => {
    if (!sweep || !rowForMetrics) {
      return null;
    }
    return toSnapshot(rowForMetrics, sweep, guardSummary ?? null);
  }, [guardSummary, rowForMetrics, sweep]);

  useEffect(() => {
    if (!snapshot) {
      sweepTelemetry.set(null);
      return;
    }
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      sweepTelemetry.set(snapshot);
      return () => {
        sweepTelemetry.set(null);
      };
    }
    let raf = 0;
    let lastTick = 0;
    const INTERVAL_MS = 125;
    const tick = (ts: number) => {
      if (ts - lastTick >= INTERVAL_MS) {
        sweepTelemetry.set(snapshot);
        lastTick = ts;
      }
      raf = window.requestAnimationFrame(tick);
    };
    sweepTelemetry.set(snapshot);
    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      sweepTelemetry.set(null);
    };
  }, [snapshot]);

  const renderRunSweepPrompt = () => {
    const badgeClass = STATUS_STYLES.IDLE;
    return (
      <div className={cn("rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs", className)}>
        <div className="flex items-center justify-between">
          <div className="uppercase tracking-wide text-slate-400 text-[11px]">Vacuum-Gap Sweep</div>
          <Badge className={cn("text-[11px] font-semibold", badgeClass)}>Awaiting Sweep</Badge>
        </div>
        <div className="mt-3 text-[11px] leading-relaxed text-slate-400">
          Run <span className="text-slate-200 font-semibold">Run Sweep (HW Slew)</span> to populate this HUD with live telemetry.
        </div>
      </div>
    );
  };

  if (!sweep) {
    return renderRunSweepPrompt();
  }

  const hasHistory =
    (sweep.iter ?? 0) > 0 ||
    sweep.last != null ||
    top.length > 0;

  if (!sweep.active && !sweep.completedAt && !sweep.cancelled && !hasHistory) {
    return renderRunSweepPrompt();
  }

  const total = sweep.total ?? 0;
  const iter = sweep.iter ?? 0;
  const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((iter / total) * 100))) : sweep.active ? 0 : 100;
  const etaSeconds =
    typeof sweep.etaMs === "number" && sweep.etaMs >= 0
      ? Math.max(0, Math.round(sweep.etaMs / 1000))
      : undefined;

  const statusValueRaw = formatStatus(rowForMetrics);
  const statusValue = guardSummary && statusValueRaw === "UNSTABLE" ? "WARN" : statusValueRaw;

  let statusLabel = "IDLE";
  if (sweep.active) {
    statusLabel = sweep.cancelRequested ? "STOPPING" : "RUNNING";
  } else if (sweep.cancelled) {
    statusLabel = "CANCELLED";
  } else if (sweep.completedAt) {
    statusLabel = "COMPLETE";
  }
  let displayStatusLabel = statusLabel;
  if (displayStatusLabel === "IDLE") {
    if (guardSummary) {
      displayStatusLabel = "WARN";
    } else if (statusValue && statusValue !== FALLBACK) {
      displayStatusLabel = statusValue;
    }
  }
  const badgeClass = STATUS_STYLES[displayStatusLabel] ?? STATUS_STYLES.IDLE;

  return (
    <div className={cn("rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs", className)}>
      <div className="flex items-center justify-between">
        <div className="uppercase tracking-wide text-slate-400 text-[11px]">Vacuum-Gap Sweep</div>
        <div className="flex items-center gap-2">
          <HardwareConnectButton controller={hardwareController} />
          <Badge className={cn("text-[11px] font-semibold", badgeClass)}>{displayStatusLabel}</Badge>
        </div>
      </div>

      <Progress className="mt-2" value={pct} />

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-300">
        <div>step</div>
        <div>
          {iter.toLocaleString()} / {total ? total.toLocaleString() : "?"}
        </div>
        <div>gap</div>
        <div>{formatNumber(rowForMetrics?.d_nm, 0, " nm")}</div>
        <div>depth</div>
        <div>{formatPercent(rowForMetrics?.m)}</div>
        <div>phase</div>
        <div>{formatDegrees(rowForMetrics?.phi_deg)}</div>
        <div>pump</div>
        <div>{formatNumber(rowForMetrics?.Omega_GHz, 3, " GHz")}</div>
        <div>detune</div>
        <div>{formatSigned(rowForMetrics?.detune_MHz, 3, " MHz")}</div>
        <div>kappa</div>
        <div>{formatKappa(rowForMetrics?.kappa_MHz)}</div>
        <div>kappa_eff</div>
        <div>{formatKappaEff(rowForMetrics)}</div>
        <div>rho (g/g_th)</div>
        <div>{formatRatio(rowForMetrics?.pumpRatio)}</div>
        <div>quadrature</div>
        <div>{formatQuadrature(rowForMetrics)}</div>
        <div>Q<sub>L</sub></div>
        <div>{formatQL(rowForMetrics?.QL)}</div>
        <div>status</div>
        <div>{statusValue}</div>
        {guardSummary ? (
          <>
            <div>guard</div>
            <div className="text-amber-300">{guardSummary}</div>
          </>
        ) : null}
        <div>ETA</div>
        <div>
          {sweep.active
            ? etaSeconds != null
              ? `${etaSeconds}s`
              : "estimating"
            : "0s"}
        </div>
        <div>slew</div>
        <div>{sweep.slewDelayMs != null ? `${Math.round(sweep.slewDelayMs)} ms` : FALLBACK}</div>
      </div>

      <ReversibilityBadge className="mt-3" analytics={pipeline?.gateAnalytics} />

      <div className="mt-3 flex items-center gap-2">
        {sweep.active ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={sweep.cancelRequested}
            className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
          >
            {sweep.cancelRequested ? "Stopping..." : "Stop Sweep"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyTop}
            disabled={!top.length || !navigator?.clipboard}
            className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
          >
            Copy Top Ridge
          </Button>
        )}
        <div className="text-[11px] text-slate-500">
          total rows: {totalRows.toLocaleString()}
          {trimmedForGuard ? (
            <span className="ml-1 text-amber-300">
              (showing last {rowsVisible.toLocaleString()}
              {guardLimit ? ` / cap ${guardLimit.toLocaleString()}` : ""})
            </span>
          ) : null}
        </div>
      </div>

      {best ? (
        <div className="mt-3 text-[11px] text-slate-400">
          best: {formatQuadrature(best)} @ d={formatNumber(best.d_nm, 0, " nm")}, phi={formatDegrees(best.phi_deg)}
        </div>
      ) : null}
    </div>
  );
}
