import React, { useCallback } from "react";
import ReversibilityBadge from "./ReversibilityBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useEnergyPipeline, type EnergyPipelineState as PipelineState } from "@/hooks/use-energy-pipeline";
import type { SweepRuntime, SweepPoint } from "@shared/schema";

type VacuumGapSweepHUDProps = {
  className?: string;
};

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

function formatStatus(point: SweepPoint | null): string {
  if (!point) return FALLBACK;
  return point.status ?? (point.stable ? "PASS" : "WARN");
}

function formatQuadrature(point: SweepPoint | null): string {
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

function formatKappaEff(point: SweepPoint | null): string {
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

const STATUS_STYLES: Record<string, string> = {
  RUNNING: "bg-emerald-500/20 text-emerald-300",
  STOPPING: "bg-amber-500/20 text-amber-300",
  CANCELLED: "bg-rose-500/20 text-rose-300",
  COMPLETE: "bg-cyan-500/20 text-cyan-300",
  IDLE: "bg-slate-700/40 text-slate-300",
};

export default function VacuumGapSweepHUD({ className }: VacuumGapSweepHUDProps) {
  const {
    data,
    sweepResultsTotal,
    sweepResultsDropped,
    sweepResultsLimit,
  } = useEnergyPipeline();
  const pipeline = data as PipelineState | undefined;
  const sweep = (pipeline?.sweep ?? null) as SweepRuntime | null;
  const top = Array.isArray(sweep?.top) ? (sweep?.top as SweepPoint[]) : [];
  const rowsVisible = pipeline?.vacuumGapSweepResults?.length ?? 0;
  const totalRows =
    typeof sweepResultsTotal === "number" ? sweepResultsTotal : rowsVisible;
  const droppedRows =
    typeof sweepResultsDropped === "number"
      ? Math.max(0, sweepResultsDropped)
      : Math.max(0, totalRows - rowsVisible);
  const guardLimit =
    typeof sweepResultsLimit === "number" ? sweepResultsLimit : undefined;
  const trimmedForGuard = droppedRows > 0;

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

  const hasHistory =
    (sweep?.iter ?? 0) > 0 ||
    (sweep?.last != null) ||
    top.length > 0;

  if (!sweep || (!sweep.active && !sweep.completedAt && !sweep.cancelled && !hasHistory)) {
    return null;
  }

  const total = sweep.total ?? 0;
  const iter = sweep.iter ?? 0;
  const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((iter / total) * 100))) : sweep.active ? 0 : 100;
  const etaSeconds =
    typeof sweep.etaMs === "number" && sweep.etaMs >= 0
      ? Math.max(0, Math.round(sweep.etaMs / 1000))
      : undefined;

  const last = sweep.last ?? null;
  const best = top.length ? top[0] : null;

  let statusLabel = "IDLE";
  if (sweep.active) {
    statusLabel = sweep.cancelRequested ? "STOPPING" : "RUNNING";
  } else if (sweep.cancelled) {
    statusLabel = "CANCELLED";
  } else if (sweep.completedAt) {
    statusLabel = "COMPLETE";
  }
  const badgeClass = STATUS_STYLES[statusLabel] ?? STATUS_STYLES.IDLE;

  return (
    <div className={cn("rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs", className)}>
      <div className="flex items-center justify-between">
        <div className="uppercase tracking-wide text-slate-400 text-[11px]">Vacuum-Gap Sweep</div>
        <Badge className={cn("text-[11px] font-semibold", badgeClass)}>{statusLabel}</Badge>
      </div>

      <Progress className="mt-2" value={pct} />

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-300">
        <div>step</div>
        <div>
          {iter.toLocaleString()} / {total ? total.toLocaleString() : "?"}
        </div>
        <div>gap</div>
        <div>{formatNumber(last?.d_nm, 0, " nm")}</div>
        <div>depth</div>
        <div>{formatPercent(last?.m)}</div>
        <div>phase</div>
        <div>{formatDegrees(last?.phi_deg)}</div>
        <div>pump</div>
        <div>{formatNumber(last?.Omega_GHz, 3, " GHz")}</div>
        <div>detune</div>
        <div>{formatSigned(last?.detune_MHz, 3, " MHz")}</div>
        <div>kappa</div>
        <div>{formatKappa(last?.kappa_MHz)}</div>
        <div>kappa_eff</div>
        <div>{formatKappaEff(last)}</div>
        <div>rho (g/g_th)</div>
        <div>{formatRatio(last?.pumpRatio)}</div>
        <div>quadrature</div>
        <div>{formatQuadrature(last)}</div>
        <div>Q<sub>L</sub></div>
        <div>{formatQL(last?.QL)}</div>
        <div>status</div>
        <div>{formatStatus(last)}</div>
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
