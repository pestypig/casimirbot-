import {
  runConstraintLoop,
  type ConstraintLoopAttempt,
  type ConstraintLoopGate,
  type ConstraintLoopHandlers,
  type ConstraintLoopResult,
} from "./constraint-loop.js";

export type ImageFieldState = {
  width: number;
  height: number;
  channels: number;
  values: Float32Array;
};

export type ImageDiffusionDerivatives = {
  score: Float32Array;
};

export type ImageDiffusionConstraints = {
  scoreRms: number;
  scoreMaxAbs: number;
  fidelityRms: number;
};

export type ImageDiffusionThresholds = {
  scoreRmsMax: number;
  fidelityRmsMax: number;
};

export type ImageDiffusionTarget = ImageFieldState | Float32Array;

export type ImageDiffusionLoopOptions = {
  width?: number;
  height?: number;
  channels?: number;
  seed?: number;
  maxIterations?: number;
  stepSize?: number;
  scoreWeight?: number;
  smoothWeight?: number;
  thresholds?: Partial<ImageDiffusionThresholds>;
  clamp?: { min: number; max: number };
  initialState?: ImageFieldState;
  target?: ImageDiffusionTarget;
  targetValue?: number;
};

export type ImageDiffusionAttempt = ConstraintLoopAttempt<
  ImageFieldState,
  ImageDiffusionDerivatives,
  ImageDiffusionConstraints
>;

export type ImageDiffusionLoopResult = ConstraintLoopResult<
  ImageFieldState,
  ImageDiffusionDerivatives,
  ImageDiffusionConstraints
>;

const DEFAULT_THRESHOLDS: ImageDiffusionThresholds = {
  scoreRmsMax: 0.08,
  fidelityRmsMax: 0.25,
};

const makeRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

export const createImageField = (
  width: number,
  height: number,
  channels: number,
  seed = 1,
): ImageFieldState => {
  const rng = makeRng(seed);
  const total = width * height * channels;
  const values = new Float32Array(total);
  for (let i = 0; i < total; i += 1) {
    values[i] = rng() * 2 - 1;
  }
  return { width, height, channels, values };
};

const cloneImageState = (state: ImageFieldState): ImageFieldState => ({
  width: state.width,
  height: state.height,
  channels: state.channels,
  values: new Float32Array(state.values),
});

const resolveTarget = (
  state: ImageFieldState,
  target?: ImageDiffusionTarget,
  targetValue = 0,
): Float32Array => {
  const total = state.width * state.height * state.channels;
  if (!target) {
    return new Float32Array(total).fill(targetValue);
  }
  if (target instanceof Float32Array) {
    if (target.length !== total) {
      throw new Error("Target array length does not match state.");
    }
    return new Float32Array(target);
  }
  if (
    target.width !== state.width ||
    target.height !== state.height ||
    target.channels !== state.channels
  ) {
    throw new Error("Target dimensions do not match state.");
  }
  return new Float32Array(target.values);
};

const laplacianAt = (
  values: Float32Array,
  width: number,
  height: number,
  channels: number,
  x: number,
  y: number,
  c: number,
): number => {
  const xm = (x - 1 + width) % width;
  const xp = (x + 1) % width;
  const ym = (y - 1 + height) % height;
  const yp = (y + 1) % height;
  const idx = (y * width + x) * channels + c;
  const up = values[(ym * width + x) * channels + c];
  const down = values[(yp * width + x) * channels + c];
  const left = values[(y * width + xm) * channels + c];
  const right = values[(y * width + xp) * channels + c];
  const center = values[idx];
  return up + down + left + right - 4 * center;
};

export const computeScoreField = (
  state: ImageFieldState,
  target: Float32Array,
  scoreWeight: number,
  smoothWeight: number,
): ImageDiffusionDerivatives => {
  const { width, height, channels, values } = state;
  const total = values.length;
  const score = new Float32Array(total);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      for (let c = 0; c < channels; c += 1) {
        const idx = (y * width + x) * channels + c;
        const base = -scoreWeight * (values[idx] - target[idx]);
        const lap = laplacianAt(values, width, height, channels, x, y, c);
        score[idx] = base + smoothWeight * lap;
      }
    }
  }

  return { score };
};

export const evaluateDiffusionConstraints = (
  state: ImageFieldState,
  derivatives: ImageDiffusionDerivatives,
  target: Float32Array,
): ImageDiffusionConstraints => {
  let scoreSumSq = 0;
  let scoreMaxAbs = 0;
  let fidelitySumSq = 0;
  const total = state.values.length;

  for (let i = 0; i < total; i += 1) {
    const score = derivatives.score[i];
    const diff = state.values[i] - target[i];
    scoreSumSq += score * score;
    fidelitySumSq += diff * diff;
    const abs = Math.abs(score);
    if (abs > scoreMaxAbs) scoreMaxAbs = abs;
  }

  const scoreRms = total ? Math.sqrt(scoreSumSq / total) : 0;
  const fidelityRms = total ? Math.sqrt(fidelitySumSq / total) : 0;
  return { scoreRms, scoreMaxAbs, fidelityRms };
};

const buildGate = (
  constraints: ImageDiffusionConstraints,
  thresholds: ImageDiffusionThresholds,
): ConstraintLoopGate => {
  const pass =
    constraints.scoreRms <= thresholds.scoreRmsMax &&
    constraints.fidelityRms <= thresholds.fidelityRmsMax;
  return {
    status: pass ? "pass" : "fail",
    residuals: {
      scoreRms: constraints.scoreRms,
      scoreMaxAbs: constraints.scoreMaxAbs,
      fidelityRms: constraints.fidelityRms,
    },
  };
};

const clampValue = (value: number, clamp?: { min: number; max: number }) => {
  if (!Number.isFinite(value)) return 0;
  if (!clamp) return value;
  return Math.min(clamp.max, Math.max(clamp.min, value));
};

const stepImageField = (
  state: ImageFieldState,
  derivatives: ImageDiffusionDerivatives,
  stepSize: number,
  clamp?: { min: number; max: number },
): ImageFieldState => {
  const total = state.values.length;
  const next = new Float32Array(total);
  for (let i = 0; i < total; i += 1) {
    const updated = state.values[i] + stepSize * derivatives.score[i];
    next[i] = clampValue(updated, clamp);
  }
  return {
    width: state.width,
    height: state.height,
    channels: state.channels,
    values: next,
  };
};

export function runImageDiffusionLoop(
  options: ImageDiffusionLoopOptions = {},
): ImageDiffusionLoopResult {
  const width = Math.max(2, options.width ?? 32);
  const height = Math.max(2, options.height ?? 32);
  const channels = Math.max(1, options.channels ?? 1);
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(options.thresholds ?? {}) };
  const stepSize = options.stepSize ?? 0.2;
  const scoreWeight = options.scoreWeight ?? 1;
  const smoothWeight = options.smoothWeight ?? 0.04;

  const initialState =
    options.initialState ?? createImageField(width, height, channels, options.seed ?? 1);
  const target = resolveTarget(initialState, options.target, options.targetValue ?? 0);

  const handlers: ConstraintLoopHandlers<
    ImageFieldState,
    ImageDiffusionDerivatives,
    ImageDiffusionConstraints
  > = {
    derive: (state) => computeScoreField(state, target, scoreWeight, smoothWeight),
    constrain: (state, derivatives) =>
      evaluateDiffusionConstraints(state, derivatives, target),
    gate: (constraints) => buildGate(constraints, thresholds),
    step: (state, derivatives) =>
      stepImageField(state, derivatives, stepSize, options.clamp),
    cloneState: cloneImageState,
    capture: ({ state, derivatives, constraints }) => ({
      state: cloneImageState(state),
      derivatives: { score: new Float32Array(derivatives.score) },
      constraints: { ...constraints },
    }),
  };

  return runConstraintLoop({
    initialState,
    maxIterations: options.maxIterations ?? 8,
    handlers,
  });
}
