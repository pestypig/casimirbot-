export type QiAutoscaleGating =
  | "disabled"
  | "idle"
  | "window_bad"
  | "source_mismatch"
  | "zeta_safe"
  | "active";

export type QiAutoscaleClampReason = {
  kind:
    | "min_scale"
    | "max_scale"
    | "slew_limit"
    | "depth_floor"
    | "depth_ceiling";
  before?: number;
  after?: number;
  limit?: number;
  perSec?: number;
  dt_s?: number;
  floor?: number;
  ceiling?: number;
  toneOmegaHz?: number;
};

export type QiAutoscaleState = {
  enabled: boolean;
  targetZeta: number;
  /** Optional alias for UI/test surfaces */
  target?: number;
  rawZeta: number | null;
  sumWindowDt?: number | null;
  rhoSource?: string | null;
  source?: string | null;
  minScale: number;
  slewPerSec: number;
  /** Optional alias for UI/test surfaces */
  slew?: number;
  engaged: boolean;
  gating: string;
  proposedScale: number;
  appliedScale: number;
  scale?: number; // legacy alias
  note?: string;
  at: number;
  clamps?: QiAutoscaleClampReason[];
  /** Telemetry: cached wall-time delta for the last step */
  dt_s?: number;
  dtLast_s?: number;
  /** Telemetry: when this servo last stepped (ms since epoch) */
  lastTickMs?: number;
};

export type StepQiAutoscaleInput = {
  enable: boolean;
  target: number;
  minScale: number;
  slewPerSec: number;
  windowTol: number;
  zetaRaw: number | null;
  sumWindowDt: number | null;
  rhoSource: string | null;
  dt_s: number;
  now?: number;
  prev?: QiAutoscaleState | null;
  clamps?: QiAutoscaleClampReason[];
  expectedSource?: string | null;
};

export const initQiAutoscaleState = (
  target = 0.9,
  now: number = Date.now(),
): QiAutoscaleState => ({
  enabled: true,
  targetZeta: Math.max(1e-6, target),
  rawZeta: null,
  sumWindowDt: null,
  rhoSource: null,
  minScale: 1,
  slewPerSec: 0,
  engaged: false,
  gating: "idle",
  proposedScale: 1,
  appliedScale: 1,
  scale: 1,
  note: "idle",
  at: now,
  clamps: [],
});

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function stepQiAutoscale(input: StepQiAutoscaleInput): QiAutoscaleState {
  const now = input.now ?? Date.now();
  const prev = input.prev ?? initQiAutoscaleState(input.target, now);
  const clampLog = Array.isArray(input.clamps) ? input.clamps : [];

  const prevApplied = Number.isFinite(prev.appliedScale)
    ? (prev.appliedScale as number)
    : Number.isFinite(prev.scale)
    ? (prev.scale as number)
    : 1;

  const dt_s =
    Number.isFinite(input.dt_s) && (input.dt_s as number) > 0
      ? (input.dt_s as number)
      : Math.max(0, (now - (Number(prev.at) || now)) / 1000);

  const targetZeta = Math.max(1e-6, Number.isFinite(input.target) ? input.target : 0.9);
  const minScale = Math.max(0, Math.min(1, input.minScale));
  const slewPerSec = Math.max(0, Number.isFinite(input.slewPerSec) ? input.slewPerSec : 0.25);
  const windowTol = Number.isFinite(input.windowTol) ? Math.max(0, input.windowTol) : 0.05;
  const expectedSource = input.expectedSource ?? "tile-telemetry";

  const windowOk =
    Number.isFinite(input.sumWindowDt) &&
    Math.abs((input.sumWindowDt as number) - 1) <= windowTol;
  const zetaOk = Number.isFinite(input.zetaRaw) && (input.zetaRaw as number) > targetZeta;
  const sourceOk = (input.rhoSource ?? "") === expectedSource;

  const gating: QiAutoscaleGating[] = [];
  if (!input.enable) gating.push("disabled");
  if (!sourceOk) gating.push("source_mismatch");
  if (!windowOk) gating.push("window_bad");
  if (!zetaOk) gating.push("zeta_safe");

  const engaged = gating.length === 0;
  const proposedScale = engaged
    ? Math.max(minScale, Math.min(1, targetZeta / (input.zetaRaw as number)))
    : 1;

  if (engaged && proposedScale === minScale) {
    clampLog.push({ kind: "min_scale", before: targetZeta / (input.zetaRaw as number), after: minScale, limit: minScale });
  }

  const alpha = clamp01(slewPerSec * dt_s);
  const appliedScale = engaged
    ? prevApplied + (proposedScale - prevApplied) * alpha
    : Math.min(1, prevApplied + (1 - prevApplied) * alpha);

  if (engaged && appliedScale !== proposedScale) {
    clampLog.push({
      kind: "slew_limit",
      before: proposedScale,
      after: appliedScale,
      perSec: slewPerSec,
      dt_s,
    });
  }

  return {
    enabled: !!input.enable,
    targetZeta,
    rawZeta: Number.isFinite(input.zetaRaw) ? (input.zetaRaw as number) : null,
    sumWindowDt: Number.isFinite(input.sumWindowDt) ? (input.sumWindowDt as number) : null,
    rhoSource: input.rhoSource ?? null,
    minScale,
    slewPerSec,
    engaged,
    gating: engaged ? "active" : (gating.join(",") || "idle"),
    proposedScale,
    appliedScale,
    scale: appliedScale,
    note: engaged ? "tile-telemetry autoscale" : (gating.join(",") || "idle"),
    at: now,
    clamps: clampLog,
    dt_s,
    dtLast_s: dt_s,
    lastTickMs: now,
  };
}
