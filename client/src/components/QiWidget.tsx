import React from "react";
import { Badge } from "@/components/ui/badge";
import LRLDocsTooltip from "@/components/common/LRLDocsTooltip";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { useGrConstraintContract } from "@/hooks/useGrConstraintContract";
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

type ContractGuardrailStatus = "ok" | "fail" | "proxy" | "missing";

const contractGuardrailClass = (status: ContractGuardrailStatus) => {
  if (status === "ok") return "text-emerald-300";
  if (status === "fail") return "text-rose-300";
  if (status === "proxy") return "text-amber-300";
  return "text-slate-300";
};

const fmt = (value: unknown, digits = 3) => {
  if (!Number.isFinite(Number(value))) return FALLBACK;
  return Number(value).toFixed(digits);
};

const fmtInt = (value: unknown) => {
  if (!Number.isFinite(Number(value))) return FALLBACK;
  return Math.round(Number(value)).toLocaleString();
};

const wrapDegrees = (deg: number) => {
  const normalized = deg % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

const formatDegreesLabel = (deg: number, digits = 1) => `${deg.toFixed(digits)}°`;

type LrlTone = {
  chipClass: string;
  textClass: string;
};

const getLrlTone = (eccentricity: number): LrlTone => {
  if (!Number.isFinite(eccentricity)) {
    return {
      chipClass: "border-slate-600/60 text-slate-300 bg-slate-800/40",
      textClass: "text-slate-300",
    };
  }
  if (eccentricity <= 0.2) {
    return {
      chipClass: "border-emerald-400/70 text-emerald-200 bg-emerald-500/10",
      textClass: "text-emerald-200",
    };
  }
  if (eccentricity <= 0.5) {
    return {
      chipClass: "border-amber-400/70 text-amber-200 bg-amber-500/10",
      textClass: "text-amber-200",
    };
  }
  return {
    chipClass: "border-rose-500/70 text-rose-200 bg-rose-500/10",
    textClass: "text-rose-200",
  };
};

type LRLCompassProps = {
  angleDeg: number;
  toneClass: string;
};

const LRLCompass: React.FC<LRLCompassProps> = ({ angleDeg, toneClass }) => (
  <div
    className={cn(
      "flex h-12 w-12 items-center justify-center rounded-full border text-xs",
      toneClass,
    )}
    aria-label="LRL periapsis compass"
  >
    <svg viewBox="0 0 32 32" width={32} height={32} className="text-current">
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.35}
        strokeWidth="1"
      />
      <g transform={`rotate(${angleDeg} 16 16)`}>
        <line
          x1="16"
          y1="16"
          x2="16"
          y2="4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <polygon points="16,2 13,7 19,7" fill="currentColor" />
      </g>
    </svg>
  </div>
);

export const QiWidget: React.FC<QiWidgetProps> = ({ className }) => {
  const { data } = useEnergyPipeline();
  const contractQuery = useGrConstraintContract({ enabled: true, refetchInterval: 2000 });
  const contractGuardrails = contractQuery.data?.guardrails;
  const qi = data?.qi;
  const qiGuard = data?.qiGuardrail;
  const badge = data?.qiBadge ?? "idle";

  if (!qi) return null;

  const status = STATUS_META[badge] ?? STATUS_META.idle;
  const marginClass = status.marginClass;
  const interestDebt = Number(qi.interestDebt);
  const interestCredit = Number(qi.interestCredit);
  const interestMargin = Number(qi.interestMargin);
  const interestWindow_ms = Number(qi.interestWindow_ms);
  const interestNet = Number(qi.interestNetCycle);
  const hasInterest = Number.isFinite(interestDebt) || Number.isFinite(interestCredit);
  const interestGuardFrac = 0.05;
  const interestTone =
    !Number.isFinite(interestMargin)
      ? "text-right text-slate-400"
      : interestMargin < 0
        ? "text-right text-rose-300"
        : Number.isFinite(interestDebt) && interestDebt > 0 && interestMargin < interestDebt * interestGuardFrac
          ? "text-right text-amber-300"
          : "text-right text-emerald-300";

  const observerLabel = qi.observerId || "observer";
  const homogenizerValues = [
    qi.varT00_lattice,
    qi.gradT00_norm,
    qi.C_warp,
    qi.QI_envelope_okPct,
  ];
  const homogenizerSource = qi.homogenizerSource;
  const homogenizerOffline = homogenizerSource === "offline";
  const showHomogenizer =
    homogenizerSource != null || homogenizerValues.some((value) => Number.isFinite(Number(value)));
  const cWarp = Number(qi.C_warp);
  const cWarpClass = !Number.isFinite(cWarp)
    ? "text-right"
    : cWarp >= 0.8
      ? "text-right text-emerald-300"
      : cWarp >= 0.6
        ? "text-right text-amber-300"
        : "text-right text-rose-300";
  const lrlEccentricity = Number(qi.eccentricity);
  const lrlPeriapsis = Number(qi.periapsisAngle);
  const hasLrlTelemetry =
    Number.isFinite(lrlEccentricity) && Number.isFinite(lrlPeriapsis);
  const lrlAngleDeg = hasLrlTelemetry
    ? wrapDegrees((lrlPeriapsis * 180) / Math.PI)
    : 0;
  const lrlTone = hasLrlTelemetry ? getLrlTone(lrlEccentricity) : null;
  const badgeTitleParts = [
    `margin ${fmt(qi.margin, 4)}`,
    `window ${fmt(qi.window_ms, 2)} ms`,
  ];
  if (Number.isFinite(interestMargin)) {
    const payoffWindow = Number.isFinite(interestWindow_ms) ? `${fmt(interestWindow_ms, 2)} ms` : null;
    badgeTitleParts.push(
      `interest ${fmt(interestMargin, 4)}${payoffWindow ? ` @ ${payoffWindow}` : ""}`,
    );
  }
  const badgeTitle = badgeTitleParts.filter(Boolean).join(" | ");
  const qiSamples = Number(qi.samples);
  const marginRaw =
    Number.isFinite(qi.marginRatioRaw) && Number(qi.marginRatioRaw) !== 0
      ? Number(qi.marginRatioRaw)
      : Number.isFinite(qi.marginRatio)
        ? Number(qi.marginRatio)
        : Number(qi.margin);
  const sigmaNorm = Number(qi.sigmaT00_norm);
  const sigmaDisplay = Number.isFinite(sigmaNorm) ? sigmaNorm.toPrecision(3) : FALLBACK;
  const sigmaOverRootN =
    Number.isFinite(sigmaNorm) && Number.isFinite(qiSamples) && qiSamples > 0
      ? (sigmaNorm / Math.sqrt(qiSamples)).toPrecision(3)
      : null;
  const policyLimit = Number(qi.policyLimit);
  const autoscale = data?.qiAutoscale;
  const autoscaleGating = (autoscale?.gating as string) ?? "idle";
  const autoscaleScale = Number(
    autoscale?.appliedScale ?? autoscale?.scale ?? undefined,
  );
  const autoscaleTarget = Number(
    (autoscale as { target?: number } | undefined)?.target ??
      (autoscale as { targetZeta?: number } | undefined)?.targetZeta,
  );
  const autoscaleZetaRaw = Number(autoscale?.zetaRaw);
  const autoscaleBadge =
    {
      active: { label: "Active", className: "border-amber-400/50 bg-amber-500/15 text-amber-100" },
      safe: { label: "Safe", className: "border-emerald-400/60 bg-emerald-500/15 text-emerald-100" },
      idle: { label: "Idle", className: "border-slate-700/70 bg-slate-900/60 text-slate-200" },
      window_bad: { label: "Window", className: "border-rose-400/50 bg-rose-500/10 text-rose-100" },
      source_mismatch: { label: "Source", className: "border-rose-400/50 bg-rose-500/10 text-rose-100" },
      disabled: { label: "Disabled", className: "border-slate-700/70 bg-slate-900/60 text-slate-200" },
      no_effect: { label: "No Effect", className: "border-rose-500/60 bg-rose-600/20 text-rose-50" },
    }[autoscaleGating] ?? { label: "Idle", className: "border-slate-700/70 bg-slate-900/60 text-slate-200" };
  const autoscaleScaleDisplay = Number.isFinite(autoscaleScale)
    ? autoscaleScale.toPrecision(3)
    : FALLBACK;
  const autoscaleTargetDisplay = Number.isFinite(autoscaleTarget)
    ? autoscaleTarget.toPrecision(3)
    : "0.90";
  const autoscaleZetaDisplay = Number.isFinite(autoscaleZetaRaw)
    ? (autoscaleZetaRaw as number).toPrecision(3)
    : null;
  const rhoSource = (qiGuard?.rhoSource ?? "").toString();
  const metricDerived = qiGuard?.metricDerived;
  const metricDerivedSource = (qiGuard?.metricDerivedSource ?? "unknown").toString();
  const rhoIsMetric =
    rhoSource.startsWith("warp.metric") ||
    rhoSource.startsWith("gr.rho_constraint") ||
    rhoSource.startsWith("gr.metric");
  const rhoSourceLabel = rhoSource.length ? rhoSource : "unknown";
  const rhoSourceClass = rhoIsMetric ? "text-emerald-300" : "text-amber-300";
  const metricDerivedClass =
    metricDerived === true
      ? "text-emerald-300"
      : metricDerived === false
        ? "text-amber-300"
        : "text-slate-300";
  const metricDerivedLabel =
    metricDerived === true ? "geometry-derived" : metricDerived === false ? "proxy-only" : "unknown";
  const curvatureRatio = Number(qiGuard?.curvatureRatio);
  const curvatureRadius = Number(qiGuard?.curvatureRadius_m);
  const curvatureOk = qiGuard?.curvatureOk;
  const curvatureEnforced = qiGuard?.curvatureEnforced === true;
  const curvatureStatus =
    curvatureOk === true ? "ok" : curvatureOk === false ? "fail" : "n/a";
  const curvatureClass =
    curvatureOk === true
      ? "text-emerald-300"
      : curvatureOk === false
        ? "text-rose-300"
        : "text-slate-300";
  const curvatureRatioDisplay = Number.isFinite(curvatureRatio)
    ? curvatureRatio.toPrecision(3)
    : null;
  const curvatureRadiusDisplay = Number.isFinite(curvatureRadius)
    ? curvatureRadius.toExponential(2)
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200 shadow-inner shadow-black/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="uppercase tracking-wide text-[11px] text-slate-400">
            Quantum Inequality
          </div>
          <LRLDocsTooltip className="border-slate-700/70 text-slate-400" />
        </div>
        <Badge
          className={cn("px-2.5 py-0.5 text-[11px] font-semibold", status.badgeClass)}
          title={badgeTitle}
        >
          {status.label}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800/70 bg-slate-900/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            Autoscale
          </span>
          <Badge className={cn("px-2 py-0.5 text-[10px]", autoscaleBadge.className)}>
            {autoscaleBadge.label}
          </Badge>
        </div>
        <div className="text-[11px] text-slate-200">
          m× {autoscaleScaleDisplay} → ζ {autoscaleTargetDisplay}
          {autoscaleZetaDisplay ? (
            <span className="text-slate-400"> (ζ_raw {autoscaleZetaDisplay})</span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 text-[11px] text-slate-400">
        tau_s window:{" "}
        <span className="font-mono text-slate-200">{fmt(qi.tau_s_ms, 2)} ms</span>
        {" | "}
        sampler: <span className="font-mono text-slate-200">{qi.sampler}</span>
      </div>
      {qiGuard && (
        <div className="mt-1 text-[11px] text-slate-400">
          rho source:{" "}
          <span className={cn("font-mono", rhoSourceClass)}>{rhoSourceLabel}</span>
          {" | "}
          metric path:{" "}
          <span className={cn("font-mono", metricDerivedClass)}>
            {metricDerivedLabel}
          </span>
          <span className="text-slate-500"> ({metricDerivedSource})</span>
          {" | "}
          curvature window:{" "}
          <span className={cn("font-mono", curvatureClass)}>
            {curvatureStatus}
            {curvatureRatioDisplay ? ` (τ/R=${curvatureRatioDisplay})` : ""}
          </span>
          {curvatureRadiusDisplay ? (
            <span className="text-slate-500"> {curvatureRadiusDisplay} m</span>
          ) : null}
          {curvatureEnforced && curvatureOk === false ? (
            <span className="ml-1 text-rose-300">enforced</span>
          ) : null}
        </div>
      )}
      {contractGuardrails && (
        <div className="mt-1 text-[11px] text-slate-400">
          contract guardrails:{" "}
          <span className={cn("font-mono", contractGuardrailClass(contractGuardrails.fordRoman))}>
            FR={contractGuardrails.fordRoman}
          </span>
          {" | "}
          <span className={cn("font-mono", contractGuardrailClass(contractGuardrails.thetaAudit))}>
            TH={contractGuardrails.thetaAudit}
          </span>
          {" | "}
          <span className={cn("font-mono", contractGuardrailClass(contractGuardrails.tsRatio))}>
            TS={contractGuardrails.tsRatio}
          </span>
          {" | "}
          <span className={cn("font-mono", contractGuardrailClass(contractGuardrails.vdbBand))}>
            VdB={contractGuardrails.vdbBand}
          </span>
          <span className="text-slate-500">
            {" "}
            ({contractQuery.data?.sources?.grDiagnostics ?? "unknown"})
          </span>
        </div>
      )}

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

      <div className="mt-3 rounded border border-slate-800/70 bg-slate-900/60 p-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-400">
          <span>Sampling stability</span>
          <span className="text-slate-500">
            {sigmaOverRootN ? `${sigmaOverRootN} ~ σ/√N` : "variance ~ 1/√N"}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-300">
          <span className="text-slate-400">ζ raw</span>
          <span className="text-right">{fmt(marginRaw, 3)}</span>

          <span className="text-slate-400">σ (norm)</span>
          <span className="text-right">{sigmaDisplay}</span>

          <span className="text-slate-400">σ / √N</span>
          <span className="text-right">{sigmaOverRootN ?? FALLBACK}</span>

          {Number.isFinite(policyLimit) && (
            <>
              <span className="text-slate-400">Policy cap</span>
              <span className="text-right">{fmt(policyLimit, 3)}</span>
            </>
          )}
        </div>
        {policyLimit === 0 && (
          <div className="mt-2 text-[11px] text-amber-300">
            Policy clamp enforced (ζ displayed as 0). Toggle enforcement to inspect ζ_raw.
          </div>
        )}
      </div>

      {hasInterest && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded border border-slate-800/70 bg-slate-900/50 p-3">
          <span className="text-slate-400">Interest debt</span>
          <span className="text-right">{fmt(interestDebt, 4)}</span>

          <span className="text-slate-400">Payback scheduled</span>
          <span className="text-right">{fmt(interestCredit, 4)}</span>

          <span className="text-slate-400">Interest margin</span>
          <span className={interestTone}>{fmt(interestMargin, 4)}</span>

          <span className="text-slate-400">Payback window</span>
          <span className="text-right">{fmt(interestWindow_ms, 2)} ms</span>

          <span className="text-slate-400">Net cycle</span>
          <span className="text-right">{fmt(interestNet, 4)}</span>
        </div>
      )}

      {hasLrlTelemetry && lrlTone && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded border border-slate-800/70 bg-slate-900/40 px-3 py-2">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400">
              LRL lock
            </div>
            <div className={cn("font-mono text-[11px]", lrlTone.textClass)}>
              e={fmt(lrlEccentricity, 2)} · ϖ={formatDegreesLabel(lrlAngleDeg, 1)}
            </div>
          </div>
          <LRLCompass angleDeg={lrlAngleDeg} toneClass={lrlTone.chipClass} />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
        <span>Observer: {observerLabel}</span>
        <span>dt x samples ~ {fmt(Number(qi.dt_ms) * Number(qi.samples) / 1000, 2)} s</span>
      </div>

      {showHomogenizer && (
        <>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800/70 pt-3 text-[11px] uppercase tracking-wide text-slate-400">
            <span>Lattice Homogenizer</span>
            {homogenizerSource && (
              <span
                className={cn(
                  "rounded border px-2 py-0.5 font-mono text-[10px]",
                  homogenizerSource === "hardware" && "border-emerald-500/60 text-emerald-200",
                  homogenizerSource === "synthetic" && "border-amber-400/60 text-amber-200",
                  homogenizerSource === "offline" && "border-slate-600/60 text-slate-300",
                )}
              >
                {homogenizerSource === "hardware"
                  ? "live"
                  : homogenizerSource === "synthetic"
                    ? "simulated"
                    : "offline"}
              </span>
            )}
          </div>
          {homogenizerOffline ? (
            <div className="mt-2 rounded border border-slate-700/60 bg-slate-900/60 p-2 text-[11px] text-amber-200">
              Telemetry unavailable. Waiting for lattice tiles to report.
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-300">
              <span className="text-slate-400">var T00 (norm)</span>
              <span className="text-right">{fmt(qi.varT00_lattice, 3)}</span>

              <span className="text-slate-400">|grad T00| (norm)</span>
              <span className="text-right">{fmt(qi.gradT00_norm, 3)}</span>

              <span className="text-slate-400">C_warp</span>
              <span className={cn(cWarpClass)}>{fmt(qi.C_warp, 3)}</span>

              <span className="text-slate-400">QI ok %</span>
              <span className="text-right">{fmt(qi.QI_envelope_okPct, 1)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QiWidget;
