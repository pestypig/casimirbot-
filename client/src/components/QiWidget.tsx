import React from "react";
import { Badge } from "@/components/ui/badge";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { cn } from "@/lib/utils";

type QiWidgetProps = {
  className?: string;
};

const STATUS_META: Record<
  "ok" | "near" | "violation" | "idle",
  { label: string; badgeClass: string; marginClass: string }
> = {
  ok: {
    label: "QI OK",
    badgeClass: "border-emerald-400/50 bg-emerald-500/20 text-emerald-200",
    marginClass: "text-emerald-300",
  },
  near: {
    label: "QI Thin",
    badgeClass: "border-amber-400/50 bg-amber-500/20 text-amber-200",
    marginClass: "text-amber-300",
  },
  violation: {
    label: "QI Violation",
    badgeClass: "border-rose-500/50 bg-rose-500/20 text-rose-200",
    marginClass: "text-rose-300",
  },
  idle: {
    label: "QI",
    badgeClass: "border-slate-600/60 bg-slate-800/60 text-slate-200",
    marginClass: "text-slate-300",
  },
};

const FALLBACK = "--";

const fmt = (value: unknown, digits = 3) => {
  if (!Number.isFinite(Number(value))) return FALLBACK;
  return Number(value).toFixed(digits);
};

const fmtInt = (value: unknown) => {
  if (!Number.isFinite(Number(value))) return FALLBACK;
  return Math.round(Number(value)).toLocaleString();
};

export const QiWidget: React.FC<QiWidgetProps> = ({ className }) => {
  const { data } = useEnergyPipeline();
  const qi = data?.qi;
  const badge = data?.qiBadge ?? "idle";

  if (!qi) return null;

  const status = STATUS_META[badge] ?? STATUS_META.idle;
  const marginClass = status.marginClass;

  const observerLabel = qi.observerId || "observer";

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200 shadow-inner shadow-black/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="uppercase tracking-wide text-[11px] text-slate-400">
          Quantum Inequality
        </div>
        <Badge className={cn("px-2.5 py-0.5 text-[11px] font-semibold", status.badgeClass)}>
          {status.label}
        </Badge>
      </div>

      <div className="mt-3 text-[11px] text-slate-400">
        tau_s window:{" "}
        <span className="font-mono text-slate-200">{fmt(qi.tau_s_ms, 2)} ms</span>
        {" | "}
        sampler: <span className="font-mono text-slate-200">{qi.sampler}</span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-300">
        <span className="text-slate-400">avg rho_f</span>
        <span className="text-right">{fmt(qi.avg, 4)}</span>

        <span className="text-slate-400">Bound</span>
        <span className="text-right">{fmt(qi.bound, 4)}</span>

        <span className="text-slate-400">Margin</span>
        <span className={cn("text-right", marginClass)}>{fmt(qi.margin, 4)}</span>

        <span className="text-slate-400">delta t (ms)</span>
        <span className="text-right">{fmt(qi.dt_ms, 2)}</span>

        <span className="text-slate-400">Window (ms)</span>
        <span className="text-right">{fmt(qi.window_ms, 2)}</span>

        <span className="text-slate-400">Samples</span>
        <span className="text-right">{fmtInt(qi.samples)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
        <span>Observer: {observerLabel}</span>
        <span>dt x samples ~ {fmt(Number(qi.dt_ms) * Number(qi.samples) / 1000, 2)} s</span>
      </div>
    </div>
  );
};

export default QiWidget;
