import React, { useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import type { QiGuardrail } from "@/types/pipeline";

type QiGuardBadgeProps = {
  className?: string;
  onClick?: () => void;
  title?: string;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const ZETA_SYMBOL = "\u03b6";
const SIGMA_SYMBOL = "\u03a3";
const MISSING_VALUE = "\u2014";

const formatFixed = (value: number | null | undefined, digits = 2) =>
  isFiniteNumber(value) ? value.toFixed(digits) : MISSING_VALUE;

const formatSi = (value: number | null | undefined, digits = 2) => {
  if (!isFiniteNumber(value)) return MISSING_VALUE;
  const abs = Math.abs(value);
  if (abs > 0 && (abs < 1e-3 || abs >= 1e3)) return value.toExponential(digits);
  return value.toFixed(digits);
};

const formatEnergyDensity = (value: number | null | undefined, digits = 2) => {
  const formatted = formatSi(value, digits);
  return formatted === MISSING_VALUE ? formatted : `${formatted} J/m\u00b3`;
};

const formatMs = (value: number | null | undefined, digits = 1) =>
  isFiniteNumber(value) && value > 0 ? `${value.toFixed(digits)} ms` : MISSING_VALUE;

type Tone = "muted" | "green" | "amber" | "red";

const TONE_COLOR: Record<Tone, string> = {
  muted: "#94A3B8",
  green: "#10B981",
  amber: "#FBBF24",
  red: "#EF4444",
};

const DEFF_GREEN_MAX = 3e-5;

export function QiGuardBadge({ className, onClick, title = "QI" }: QiGuardBadgeProps) {
  const { data: pipeline } = useEnergyPipeline({ refetchInterval: 1500 });

  const guard: QiGuardrail | undefined = pipeline?.qiGuardrail;

  const guardZetaRaw = isFiniteNumber(guard?.marginRatioRaw) ? guard.marginRatioRaw : null;
  const guardZeta = isFiniteNumber(guard?.marginRatio) ? guard.marginRatio : null;
  const pipelineZetaRaw = pipeline?.zetaRaw;
  const pipelineZeta = pipeline?.zeta;

  const qiAutoscale = (pipeline as any)?.qiAutoscale;
  const autoscaleScaleRaw = Number(
    qiAutoscale?.appliedScale ?? qiAutoscale?.scale,
  );
  const autoscaleScale =
    Number.isFinite(autoscaleScaleRaw) && autoscaleScaleRaw > 0
      ? autoscaleScaleRaw
      : null;
  const autoscaleGating = typeof qiAutoscale?.gating === "string" ? qiAutoscale.gating : null;
  const autoscaleActive = autoscaleGating === "active";
  const autoscaleTarget = isFiniteNumber((qiAutoscale as any)?.target ?? (qiAutoscale as any)?.targetZeta)
    ? Number((qiAutoscale as any)?.target ?? (qiAutoscale as any)?.targetZeta)
    : 0.9;

  const zetaForStatus =
    (isFiniteNumber(guardZetaRaw) ? guardZetaRaw : null) ??
    (isFiniteNumber(pipelineZetaRaw) ? pipelineZetaRaw : null) ??
    (isFiniteNumber(guardZeta) ? guardZeta : null) ??
    (isFiniteNumber(pipelineZeta) ? pipelineZeta : null);

  const dutyEff =
    (guard && isFiniteNumber(guard.duty) ? guard.duty : null) ??
    (isFiniteNumber((pipeline as any)?.dutyEffectiveFR) ? (pipeline as any).dutyEffectiveFR : null) ??
    (isFiniteNumber((pipeline as any)?.dutyEffective_FR) ? (pipeline as any).dutyEffective_FR : null) ??
    (isFiniteNumber((pipeline as any)?.dutyEff) ? (pipeline as any).dutyEff : null) ??
    (isFiniteNumber((pipeline as any)?.dutyShip) ? (pipeline as any).dutyShip : null);

  const { tone, status } = useMemo(() => {
    if (!isFiniteNumber(zetaForStatus)) return { tone: "muted" as Tone, status: "Warming up" };
    if (zetaForStatus >= 1) return { tone: "red" as Tone, status: "At risk" };
    if (zetaForStatus >= 0.95) return { tone: "amber" as Tone, status: "Watch" };
    return { tone: "green" as Tone, status: "OK" };
  }, [zetaForStatus]);

  const color = TONE_COLOR[tone];

  const sumWindowDt = guard?.sumWindowDt;
  const dtValue = isFiniteNumber(sumWindowDt) ? sumWindowDt : null;
  const dtWarning = dtValue != null && (dtValue < 0.98 || dtValue > 1.02);
  const dtGuardHint = dtWarning
    ? `Window not normalized (${SIGMA_SYMBOL} g\u00b7dt = ${dtValue.toFixed(3)})`
    : undefined;

  const lhsLabel = formatEnergyDensity(guard?.lhs_Jm3);
  const boundLabel = formatEnergyDensity(guard?.bound_Jm3);
  const zetaRawLabel = formatFixed(guardZetaRaw);
  const zetaClampedLabel = guardZeta != null ? `${formatFixed(guardZeta)} (policy/clamped)` : MISSING_VALUE;
  const windowLabel = formatMs(guard?.window_ms);
  const samplerLabel = guard?.sampler ?? MISSING_VALUE;
  const dEffLabel = formatSi(dutyEff, 3);
  const patternDutyLabel = formatSi(guard?.patternDuty, 3);
  const maskSumLabel = formatSi(guard?.maskSum, 2);
  const effectiveRhoLabel = formatEnergyDensity(guard?.effectiveRho, 3);
  const rhoOnLabel = formatEnergyDensity(guard?.rhoOn, 3);
  const rhoOnDutyLabel = formatEnergyDensity(guard?.rhoOnDuty, 3);
  const rhoSourceLabel = guard?.rhoSource ?? MISSING_VALUE;
  const fieldTypeLabel = guard?.fieldType ?? MISSING_VALUE;

  const detailLines = [
    `${title} - ${status}`,
    `${ZETA_SYMBOL}_raw=${zetaRawLabel}; ${ZETA_SYMBOL}=${zetaClampedLabel}`,
    `d_eff=${dEffLabel} (<=${formatSi(DEFF_GREEN_MAX, 1)})`,
    `pattern=${patternDutyLabel}; mask\u03a3=${maskSumLabel}`,
    `lhs=${lhsLabel}`,
    `bound=${boundLabel}`,
    `field=${fieldTypeLabel}; source=${rhoSourceLabel}`,
    `rho_on=${rhoOnLabel}; rho_eff=${effectiveRhoLabel}`,
    rhoOnDutyLabel !== MISSING_VALUE ? `rho_on*d=${rhoOnDutyLabel}` : null,
    `window=${windowLabel}; sampler=${samplerLabel}`,
    isFiniteNumber(sumWindowDt) ? `${SIGMA_SYMBOL}dt=${formatFixed(sumWindowDt, 3)}` : null,
    dtGuardHint,
  ]
    .filter((line): line is string => Boolean(line))
    .map((line) => line.trim());

  const titleText = detailLines.join("\n");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          role={onClick ? "button" : "group"}
          onClick={onClick}
          title={titleText}
          data-testid="qi-guard-badge"
          data-tone={tone}
          className={className}
          style={{
            display: "inline-flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            padding: "6px 10px",
            borderRadius: 999,
            background: "var(--guard-badge-bg, rgba(255,255,255,0.06))",
            border: "1px solid var(--guard-badge-border, rgba(255,255,255,0.08))",
            fontSize: 12,
            lineHeight: 1.2,
            cursor: onClick ? "pointer" : "default",
            userSelect: "text",
            width: "100%",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: color,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.15) inset",
              flexShrink: 0,
            }}
          />
          <strong style={{ letterSpacing: 0.2 }}>{title}</strong>
          <span style={{ opacity: 0.9 }}>{status}</span>
          <span style={{ opacity: 0.85, fontVariantNumeric: "tabular-nums" }}>{`${ZETA_SYMBOL}_raw:${zetaRawLabel}`}</span>
          <span style={{ opacity: 0.78, fontVariantNumeric: "tabular-nums" }}>{`${ZETA_SYMBOL}:${zetaClampedLabel}`}</span>
          <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{`lhs:${lhsLabel}`}</span>
          <span style={{ opacity: 0.65, fontVariantNumeric: "tabular-nums" }}>{`bound:${boundLabel}`}</span>
          <span style={{ opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>{`window:${windowLabel}`}</span>
          <span style={{ opacity: 0.55, fontVariantNumeric: "tabular-nums" }}>{`sampler:${samplerLabel}`}</span>
          <span style={{ opacity: 0.5, fontVariantNumeric: "tabular-nums" }}>{`d_eff:${dEffLabel}`}</span>
          {autoscaleActive && autoscaleScale != null ? (
            <span
              data-testid="qi-autoscale-chip"
              style={{
                color: "#22c55e",
                opacity: 0.92,
                fontSize: 11,
                fontVariantNumeric: "tabular-nums",
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(34, 197, 94, 0.12)",
                border: "1px solid rgba(34, 197, 94, 0.35)",
              }}
            >
              {`Autoscale active (→${autoscaleTarget.toFixed(2)}${autoscaleScale != null ? ` · A=${autoscaleScale.toFixed(2)}` : ""})`}
            </span>
          ) : null}
          {dtGuardHint ? (
            <span
              title={dtGuardHint}
              data-testid="qi-guard-badge-dt-warning"
              style={{
                color: "#FB923C",
                opacity: 0.9,
                fontSize: 11,
                fontVariantNumeric: "tabular-nums",
                padding: "2px 6px",
                borderRadius: 999,
                background: "rgba(251, 146, 60, 0.12)",
                border: "1px solid rgba(251, 146, 60, 0.25)",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {dtGuardHint}
            </span>
          ) : null}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="w-[360px] max-w-[440px] border-slate-800/80 bg-slate-950/95 text-slate-50"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">QI guard details</p>
        <pre className="mt-2 max-h-80 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-slate-100">
          {titleText}
        </pre>
      </PopoverContent>
    </Popover>
  );
}
