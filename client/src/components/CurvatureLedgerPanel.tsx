import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LEDGER_GUARD_THRESHOLD,
  useCycleLedger,
} from "@/hooks/useCycleLedger";

const SPARKLINE_WIDTH = 220;
const SPARKLINE_HEIGHT = 72;
const SPARKLINE_PADDING = 8;
const MAX_POINTS = 48;

function formatPercent(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return "–";
  return `${(value * 100).toFixed(digits)}%`;
}

function formatJoules(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)} MJ`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)} kJ`;
  if (abs >= 1) return `${value.toFixed(0)} J`;
  return `${value.toExponential(2)} J`;
}

export function CurvatureLedgerPanel() {
  const { rows, ratioSeries, ratio, ok, source, cycleMs, latest } = useCycleLedger();
  const series = useMemo(() => {
    if (!ratioSeries.length) return [];
    if (ratioSeries.length <= MAX_POINTS) return ratioSeries;
    return ratioSeries.slice(-MAX_POINTS);
  }, [ratioSeries]);

  const sparkline = useMemo(() => {
    if (series.length === 0) {
      return { path: "", thresholdY: SPARKLINE_HEIGHT - SPARKLINE_PADDING };
    }
    const safeSeries = series.map((value) =>
      Number.isFinite(value) && value >= 0 ? value : 0,
    );
    const maxValue = Math.max(
      LEDGER_GUARD_THRESHOLD * 1.2,
      ...safeSeries,
      1e-6,
    );
    const xStep =
      series.length > 1
        ? (SPARKLINE_WIDTH - SPARKLINE_PADDING * 2) / (series.length - 1)
        : 0;
    const scaleY = (value: number) => {
      const clamped = Math.max(0, value);
      return (
        SPARKLINE_HEIGHT -
        SPARKLINE_PADDING -
        (clamped / maxValue) * (SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2)
      );
    };
    const points = safeSeries
      .map((value, index) => {
        const x = SPARKLINE_PADDING + index * xStep;
        const y = scaleY(value);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
    const thresholdY = scaleY(LEDGER_GUARD_THRESHOLD);
    return { path: points, thresholdY };
  }, [series]);

  const cadenceLabel =
    typeof cycleMs === "number" && Number.isFinite(cycleMs)
      ? `${cycleMs.toFixed(2)} ms cadence`
      : "Cadence unknown";
  const sourceLabel =
    source === "server"
      ? "server ledger"
      : source === "client"
        ? "client aggregate"
        : "no samples";
  const statusTone =
    ok === null ? "text-slate-300" : ok ? "text-emerald-300" : "text-amber-300";

  return (
    <Card className="border-slate-800/60 bg-slate-950/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-100">
          Curvature ledger
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          {cadenceLabel} · {sourceLabel}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="text-xs uppercase tracking-tight text-slate-400">
            Ledger drift
          </div>
          <div className={`font-mono text-sm ${statusTone}`}>
            {formatPercent(ratio, 3)}
          </div>
        </div>
        <svg
          viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
          className="h-16 w-full text-slate-500"
          role="img"
          aria-label="Cycle ledger drift sparkline"
        >
          {sparkline.path ? (
            <path
              d={sparkline.path}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className={ok ? "text-emerald-300/80" : "text-amber-300/80"}
            />
          ) : (
            <line
              x1={SPARKLINE_PADDING}
              x2={SPARKLINE_WIDTH - SPARKLINE_PADDING}
              y1={SPARKLINE_HEIGHT - SPARKLINE_PADDING}
              y2={SPARKLINE_HEIGHT - SPARKLINE_PADDING}
              stroke="currentColor"
              strokeWidth={1}
              className="text-slate-600/40"
            />
          )}
          <line
            x1={SPARKLINE_PADDING}
            x2={SPARKLINE_WIDTH - SPARKLINE_PADDING}
            y1={sparkline.thresholdY}
            y2={sparkline.thresholdY}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-slate-500/40"
            strokeWidth={1}
          />
        </svg>
        <dl className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div>
            <dt className="text-[10px] uppercase tracking-wide">Bus</dt>
            <dd className="font-mono text-slate-200">
              {formatJoules(latest?.bus ?? null)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide">Sink</dt>
            <dd className="font-mono text-slate-200">
              {formatJoules(latest?.sink ?? null)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide">ΔE</dt>
            <dd className="font-mono text-slate-200">
              {formatJoules(latest?.dE ?? null)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide">
              Cycles tracked
            </dt>
            <dd className="font-mono text-slate-200">{rows.length}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export default CurvatureLedgerPanel;
