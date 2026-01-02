import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type GrAgentLoopKpiSummary = {
  window: {
    limit: number;
    runs: number;
    attempts: number;
    accepted: number;
    rejected: number;
    violations: number;
  };
  successRate: number | null;
  constraintViolationRate: number | null;
  timeToGreenMs: {
    avg: number | null;
    last: number | null;
    count: number;
  };
  perfTrend: {
    series: number[];
    recentAvgMs: number | null;
    priorAvgMs: number | null;
    deltaPct: number | null;
    trend: "improving" | "degrading" | "flat" | "insufficient";
  };
};

type GrAgentLoopKpiResponse = {
  kpis: GrAgentLoopKpiSummary;
  limit?: number;
};

const formatPct = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return `${(value * 100).toFixed(1)}%`;
};

const formatDuration = (ms: number | null | undefined): string => {
  if (ms == null || !Number.isFinite(ms)) return "n/a";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = ms / 60000;
  return `${minutes.toFixed(1)} min`;
};

const formatDelta = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return "n/a";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

const buildSparkline = (values: number[], width = 120, height = 28) => {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, idx) => {
    const x = (idx / Math.max(1, values.length - 1)) * width;
    const y = height - ((value - min) / span) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return { path: `M${points.join(" L")}` };
};

type KpiTileProps = {
  label: string;
  value: string;
  detail?: string;
  badge?: React.ReactNode;
  sparkline?: number[];
};

const KpiTile = ({ label, value, detail, badge, sparkline }: KpiTileProps) => {
  const trend = sparkline ? buildSparkline(sparkline) : null;
  return (
    <div className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        {badge}
      </div>
      <div className="mt-2 text-xl font-semibold text-slate-100">{value}</div>
      {detail ? (
        <div className="mt-1 text-[11px] text-slate-500">{detail}</div>
      ) : null}
      {trend ? (
        <svg
          viewBox="0 0 120 28"
          className="mt-2 h-7 w-full text-cyan-300"
          role="img"
          aria-label={`${label} trend`}
        >
          <path d={trend.path} fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ) : null}
    </div>
  );
};

const trendBadge = (trend?: GrAgentLoopKpiSummary["perfTrend"]["trend"]) => {
  if (!trend || trend === "insufficient") {
    return (
      <Badge variant="outline" className="text-[10px] text-slate-300">
        pending
      </Badge>
    );
  }
  const className =
    trend === "improving"
      ? "bg-emerald-500/20 text-emerald-200"
      : trend === "degrading"
        ? "bg-rose-500/20 text-rose-200"
        : "bg-slate-500/20 text-slate-200";
  return (
    <Badge variant="outline" className={`text-[10px] ${className}`}>
      {trend}
    </Badge>
  );
};

export default function GrAgentLoopKpiPanel() {
  const { data, isFetching, isError } = useQuery({
    queryKey: ["/api/helix/gr-agent-loop/kpis?limit=50"],
    refetchInterval: 6000,
  });
  const kpis = (data as GrAgentLoopKpiResponse | undefined)?.kpis;

  const successRate = formatPct(kpis?.successRate ?? null);
  const successDetail =
    kpis && kpis.window.runs > 0
      ? `${kpis.window.accepted}/${kpis.window.runs} accepted`
      : "no runs";

  const timeToGreen = formatDuration(kpis?.timeToGreenMs.avg ?? null);
  const timeDetail =
    kpis && kpis.timeToGreenMs.count > 0
      ? `last ${formatDuration(kpis.timeToGreenMs.last)}`
      : "no recovery window";

  const violationRate = formatPct(kpis?.constraintViolationRate ?? null);
  const violationDetail =
    kpis && kpis.window.attempts > 0
      ? `${kpis.window.violations}/${kpis.window.attempts} attempts`
      : "no attempts";

  const perfValue = formatDuration(kpis?.perfTrend.recentAvgMs ?? null);
  const perfDetail =
    kpis?.perfTrend.priorAvgMs != null
      ? `prior ${formatDuration(kpis.perfTrend.priorAvgMs)} (${formatDelta(kpis.perfTrend.deltaPct)})`
      : "insufficient history";

  return (
    <div className="h-full w-full overflow-auto bg-slate-950/80 p-4 text-slate-100">
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            <span>GR Loop KPIs</span>
            <Badge variant="outline" className="text-[10px]">
              {isFetching ? "refreshing" : "live"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Build success, time to green, constraint violations, and perf trend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="text-[11px] text-rose-300">
              Failed to load KPI metrics.
            </div>
          ) : !kpis ? (
            <div className="text-[11px] text-slate-500">No KPI data yet.</div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KpiTile
                  label="Build success rate"
                  value={successRate}
                  detail={successDetail}
                />
                <KpiTile
                  label="Time to green"
                  value={timeToGreen}
                  detail={timeDetail}
                />
                <KpiTile
                  label="Constraint violations"
                  value={violationRate}
                  detail={violationDetail}
                />
                <KpiTile
                  label="Perf trend"
                  value={perfValue}
                  detail={perfDetail}
                  badge={trendBadge(kpis.perfTrend.trend)}
                  sparkline={kpis.perfTrend.series}
                />
              </div>
              <div className="text-[10px] text-slate-500">
                Window: last {kpis.window.runs} runs, {kpis.window.attempts} attempts.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
