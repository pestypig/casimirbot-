export type TsAutoscaleState = {
  enabled: boolean;
  targetTS: number;
  target?: number;            // legacy alias for UI/tests
  slewPerSec: number;
  slew?: number;              // legacy alias for UI/tests
  floor_ns: number;
  engaged: boolean;
  gating: string;
  TS_ratio?: number | null;
  tauPulse_ns?: number | null;
  proposedBurst_ns: number;
  appliedBurst_ns: number;
  dt_s?: number;
  /** Telemetry: when this servo last stepped (ms since epoch) */
  lastTickMs?: number;
  /** Telemetry: cached dt for the last step */
  dtLast_s?: number;
};

export type StepTsAutoscaleInput = {
  enable: boolean;
  targetTS: number;
  slewPerSec: number;
  floor_ns: number;
  windowTol?: number;
  TS_ratio: number | null;
  tauPulse_ns: number | null;
  dt_s: number;
  prevBurst_ns: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function stepTsAutoscale(ctx: StepTsAutoscaleInput): TsAutoscaleState {
  const gating: string[] = [];
  if (!ctx.enable) gating.push("disabled");

  const tsFinite = Number.isFinite(ctx.TS_ratio);
  const tsPositive = tsFinite && (ctx.TS_ratio as number) > 0;
  const pulseFinite = Number.isFinite(ctx.tauPulse_ns) && (ctx.tauPulse_ns as number) > 0;

  const windowTol = Number.isFinite(ctx.windowTol) ? Math.max(0, ctx.windowTol as number) : 0;
  const tsNearTarget =
    tsPositive &&
    (ctx.TS_ratio as number) >= (ctx.targetTS as number) * (1 - Math.max(0.001, Math.min(0.01, windowTol)));
  const prevVsMeasured =
    pulseFinite && Number.isFinite(ctx.prevBurst_ns) && ctx.prevBurst_ns > 0
      ? Math.abs((ctx.tauPulse_ns as number) - ctx.prevBurst_ns) /
          Math.max(ctx.prevBurst_ns, ctx.floor_ns) <= windowTol
      : true;

  if (!prevVsMeasured) gating.push("window_bad");
  if (!(tsPositive && pulseFinite)) gating.push("timing_bad");
  if (tsNearTarget) gating.push("ts_safe");

  const engaged = gating.length === 0;
  const desiredBurst_ns = engaged
    ? Math.max(ctx.floor_ns, (ctx.prevBurst_ns * (ctx.TS_ratio as number)) / ctx.targetTS)
    : ctx.prevBurst_ns;

  const alpha = clamp01(Math.max(0, ctx.slewPerSec) * Math.max(0, ctx.dt_s));
  const appliedBurst_ns = ctx.prevBurst_ns + (desiredBurst_ns - ctx.prevBurst_ns) * alpha;

  return {
    enabled: !!ctx.enable,
    targetTS: ctx.targetTS,
    target: ctx.targetTS,
    slewPerSec: Math.max(0, ctx.slewPerSec),
    slew: Math.max(0, ctx.slewPerSec),
    floor_ns: Math.max(0, ctx.floor_ns),
    engaged,
    gating: engaged ? "active" : (gating.join(",") || "idle"),
    TS_ratio: tsFinite ? (ctx.TS_ratio as number) : null,
    tauPulse_ns: pulseFinite ? (ctx.tauPulse_ns as number) : null,
    proposedBurst_ns: desiredBurst_ns,
    appliedBurst_ns,
    dt_s: Math.max(0, ctx.dt_s),
    dtLast_s: Math.max(0, ctx.dt_s),
  };
}

// Legacy alias retained for older callers/tests; delegates to the new step function.
export function evaluateTsAutoscale(input: {
  tauLC_s: number;
  tauPulse_s: number;
  tsCurrent: number;
  nowMs: number;
  lastUpdateMs?: number;
  cfg: { enabled: boolean; target: number; maxSlewPerSec: number; minPulse_ns: number };
}): TsAutoscaleState {
  const dt_s = Number.isFinite(input.lastUpdateMs)
    ? Math.max(0, (input.nowMs - (input.lastUpdateMs as number)) / 1000)
    : 0;
  const prevBurst_ns = Math.max(1e-9, input.tauPulse_s * 1e9);
  return stepTsAutoscale({
    enable: input.cfg.enabled,
    targetTS: input.cfg.target,
    slewPerSec: input.cfg.maxSlewPerSec,
    floor_ns: input.cfg.minPulse_ns,
    TS_ratio: input.tsCurrent,
    tauPulse_ns: prevBurst_ns,
    dt_s,
    prevBurst_ns,
  });
}
