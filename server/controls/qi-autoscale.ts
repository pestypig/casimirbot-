export type QiAutoscaleGating =
  | "disabled"
  | "idle"
  | "window_bad"
  | "source_mismatch"
  | "safe"
  | "active"
  | "no_effect";

export type QiAutoscaleClampReason = {
  kind:
    | "min_scale"
    | "max_scale"
    | "slew_limit"
    | "depth_floor"
    | "depth_ceiling"
    | "stroke_floor"
    | "stroke_ceiling";
  before?: number;
  after?: number;
  limit?: number;
  floor?: number;
  ceiling?: number;
  perSec?: number;
  dt_s?: number;
  toneOmegaHz?: number;
};

export type QiAutoscaleState = {
  enabled: boolean;
  targetZeta: number;
  rawZeta?: number | null;
  scale: number;
  appliedScale: number;
  proposedScale?: number | null;
  slewLimitedScale?: number | null;
  gating: QiAutoscaleGating;
  note?: string;
  at: number;
  clamps?: QiAutoscaleClampReason[];
  activeSince?: number | null;
  baselineZeta?: number | null;
  safeSince?: number | null;
};

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export type QiAutoscaleGuardView = {
  sumWindowDt?: number;
  marginRatioRaw?: number;
  rhoSource?: string;
};

export type StepQiAutoscaleInput = {
  guard: QiAutoscaleGuardView;
  enableFlag: boolean;
  target: number;
  minScale: number;
  slewPerS: number;
  now?: number;
  windowTolerance?: number;
  noEffectSeconds?: number;
  prev?: QiAutoscaleState | null;
  clamps?: QiAutoscaleClampReason[];
};

export const initQiAutoscaleState = (
  target: number,
  now: number = Date.now(),
): QiAutoscaleState => ({
  enabled: true,
  targetZeta: Math.max(1e-6, Number.isFinite(target) ? target : 0.9),
  rawZeta: null,
  scale: 1,
  appliedScale: 1,
  proposedScale: null,
  slewLimitedScale: null,
  gating: "idle",
  note: "idle",
  at: now,
  clamps: [],
  activeSince: null,
  baselineZeta: null,
  safeSince: null,
});

const relaxTowardsUnity = (
  prevScale: number,
  slewPerS: number,
  dt_s: number,
): { applied: number; slewLimited: number } => {
  const maxUp = prevScale * (1 + slewPerS * dt_s);
  const slewed = Math.min(1, maxUp);
  return {
    applied: slewed,
    slewLimited: slewed,
  };
};

export function stepQiAutoscale(input: StepQiAutoscaleInput): QiAutoscaleState {
  const {
    guard,
    enableFlag,
    target,
    minScale,
    slewPerS,
    now = Date.now(),
    windowTolerance = 0.05,
    noEffectSeconds = 5,
  } = input;
  const clampLog = Array.isArray(input.clamps) ? input.clamps : [];
  const safeTarget = Math.max(1e-6, Number.isFinite(target) ? target : 0.9);
  const scaleFloor = clamp(minScale, 0, 1);
  const slew = Math.max(0, Number.isFinite(slewPerS) ? slewPerS : 0.25);
  const prev = input.prev ?? initQiAutoscaleState(safeTarget, now);
  const prevScale = Number.isFinite(prev.appliedScale)
    ? (prev.appliedScale as number)
    : Number.isFinite(prev.scale)
    ? (prev.scale as number)
    : 1;
  const prevAt = Number.isFinite(prev.at) ? prev.at : now;
  const dt_s = Math.max(0.001, (now - prevAt) / 1000);
  const rawZeta = Number(guard?.marginRatioRaw);
  const windowDt = Number(guard?.sumWindowDt);
  const windowOk = Number.isFinite(windowDt) && Math.abs(windowDt - 1) <= windowTolerance;
  const hasRaw = Number.isFinite(rawZeta);
  const scaleForReturn = (scale: number, gating: QiAutoscaleGating, note: string): QiAutoscaleState => ({
    enabled: !!enableFlag,
    targetZeta: safeTarget,
    rawZeta: hasRaw ? (rawZeta as number) : prev.rawZeta ?? null,
    scale,
    appliedScale: scale,
    proposedScale: gating === "active" ? scale : 1,
    slewLimitedScale: scale,
    gating,
    note,
    at: now,
    clamps: clampLog,
    activeSince: null,
    baselineZeta: null,
    safeSince: gating === "safe" ? now : null,
  });

  if (!enableFlag) {
    const relaxed = relaxTowardsUnity(prevScale, slew, dt_s);
    return scaleForReturn(relaxed.applied, "disabled", "disabled");
  }
  if (!windowOk) {
    const relaxed = relaxTowardsUnity(prevScale, slew, dt_s);
    return scaleForReturn(relaxed.applied, "window_bad", "sumWindowDt out of band");
  }
  if (guard?.rhoSource !== "tile-telemetry") {
    const relaxed = relaxTowardsUnity(prevScale, slew, dt_s);
    return scaleForReturn(relaxed.applied, "source_mismatch", `rhoSource=${guard?.rhoSource ?? "unknown"}`);
  }
  if (!hasRaw) {
    const relaxed = relaxTowardsUnity(prevScale, slew, dt_s);
    return scaleForReturn(relaxed.applied, "idle", "missing zetaRaw");
  }
  if ((rawZeta as number) <= safeTarget) {
    const relaxed = relaxTowardsUnity(prevScale, slew, dt_s);
    return {
      ...scaleForReturn(relaxed.applied, "safe", "zeta within target"),
      safeSince: prev.safeSince ?? now,
    };
  }

  const idealScale = safeTarget / (rawZeta as number);
  let clampedScale = clamp(idealScale, scaleFloor, 1);
  if (clampedScale !== idealScale) {
    clampLog.push({
      kind: clampedScale < idealScale ? "min_scale" : "max_scale",
      before: idealScale,
      after: clampedScale,
      limit: clampedScale < idealScale ? scaleFloor : 1,
    });
  }

  const maxUp = prevScale * (1 + slew * dt_s);
  const maxDown = prevScale * (1 - slew * dt_s);
  let slewLimited = clamp(clampedScale, maxDown, maxUp);
  if (slewLimited !== clampedScale) {
    clampLog.push({
      kind: "slew_limit",
      before: clampedScale,
      after: slewLimited,
      perSec: slew,
      dt_s,
    });
  }

  let appliedScale = clamp(slewLimited, 0, 1);
  if (appliedScale !== slewLimited) {
    clampLog.push({
      kind: appliedScale < slewLimited ? "min_scale" : "max_scale",
      before: slewLimited,
      after: appliedScale,
      limit: appliedScale < slewLimited ? 0 : 1,
    });
  }

  const activeSince = prev.activeSince ?? now;
  const baselineZeta = prev.baselineZeta ?? (hasRaw ? (rawZeta as number) : null);
  let gating: QiAutoscaleGating = "active";
  let note = "tile-telemetry autoscale";

  if (
    baselineZeta &&
    baselineZeta > 0 &&
    noEffectSeconds > 0 &&
    hasRaw &&
    (now - activeSince) / 1000 >= noEffectSeconds
  ) {
    const dropFraction = 1 - (rawZeta as number) / baselineZeta;
    if (!(dropFraction >= 0.2)) {
      gating = "no_effect";
      note = "no_effect halt";
    }
  }

  return {
    enabled: !!enableFlag,
    targetZeta: safeTarget,
    rawZeta: hasRaw ? (rawZeta as number) : prev.rawZeta ?? null,
    scale: appliedScale,
    appliedScale,
    proposedScale: clampedScale,
    slewLimitedScale: slewLimited,
    gating,
    note,
    at: now,
    clamps: clampLog,
    activeSince,
    baselineZeta,
    safeSince: null,
  };
}
