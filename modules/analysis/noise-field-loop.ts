import {
  runConstraintLoop,
  type ConstraintLoopAttempt,
  type ConstraintLoopGate,
  type ConstraintLoopHandlers,
  type ConstraintLoopResult,
} from "./constraint-loop.js";

export type NoiseFieldState = {
  width: number;
  height: number;
  values: Float32Array;
};

export type NoiseFieldDerivatives = {
  laplacian: Float32Array;
};

export type NoiseFieldConstraints = {
  laplacianRms: number;
  laplacianMaxAbs: number;
};

export type NoiseFieldThresholds = {
  laplacianRmsMax: number;
  laplacianMaxAbsMax: number;
};

export type NoiseFieldLoopOptions = {
  width?: number;
  height?: number;
  seed?: number;
  maxIterations?: number;
  stepSize?: number;
  thresholds?: Partial<NoiseFieldThresholds>;
  clamp?: { min: number; max: number };
  initialState?: NoiseFieldState;
};

export type NoiseFieldAttempt = ConstraintLoopAttempt<
  NoiseFieldState,
  NoiseFieldDerivatives,
  NoiseFieldConstraints
>;

export type NoiseFieldLoopResult = ConstraintLoopResult<
  NoiseFieldState,
  NoiseFieldDerivatives,
  NoiseFieldConstraints
>;

const DEFAULT_THRESHOLDS: NoiseFieldThresholds = {
  laplacianRmsMax: 0.12,
  laplacianMaxAbsMax: 0.6,
};

const makeRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

export const createNoiseField = (
  width: number,
  height: number,
  seed = 1,
): NoiseFieldState => {
  const rng = makeRng(seed);
  const total = width * height;
  const values = new Float32Array(total);
  for (let i = 0; i < total; i += 1) {
    values[i] = rng() * 2 - 1;
  }
  return { width, height, values };
};

const cloneNoiseState = (state: NoiseFieldState): NoiseFieldState => ({
  width: state.width,
  height: state.height,
  values: new Float32Array(state.values),
});

const laplacianAt = (
  values: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
): number => {
  const xm = (x - 1 + width) % width;
  const xp = (x + 1) % width;
  const ym = (y - 1 + height) % height;
  const yp = (y + 1) % height;

  const idx = y * width + x;
  const up = values[ym * width + x];
  const down = values[yp * width + x];
  const left = values[y * width + xm];
  const right = values[y * width + xp];
  const center = values[idx];
  return up + down + left + right - 4 * center;
};

export const computeLaplacian = (state: NoiseFieldState): NoiseFieldDerivatives => {
  const { width, height, values } = state;
  const total = width * height;
  const laplacian = new Float32Array(total);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      laplacian[idx] = laplacianAt(values, width, height, x, y);
    }
  }
  return { laplacian };
};

export const evaluateLaplacian = (
  derivatives: NoiseFieldDerivatives,
): NoiseFieldConstraints => {
  const values = derivatives.laplacian;
  let sumSq = 0;
  let maxAbs = 0;
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    sumSq += value * value;
    const abs = Math.abs(value);
    if (abs > maxAbs) maxAbs = abs;
  }
  const rms = values.length ? Math.sqrt(sumSq / values.length) : 0;
  return {
    laplacianRms: rms,
    laplacianMaxAbs: maxAbs,
  };
};

const buildGate = (
  constraints: NoiseFieldConstraints,
  thresholds: NoiseFieldThresholds,
): ConstraintLoopGate => {
  const pass =
    constraints.laplacianRms <= thresholds.laplacianRmsMax &&
    constraints.laplacianMaxAbs <= thresholds.laplacianMaxAbsMax;
  return {
    status: pass ? "pass" : "fail",
    residuals: {
      laplacianRms: constraints.laplacianRms,
      laplacianMaxAbs: constraints.laplacianMaxAbs,
    },
  };
};

const stepNoiseField = (
  state: NoiseFieldState,
  derivatives: NoiseFieldDerivatives,
  stepSize: number,
  clamp?: { min: number; max: number },
): NoiseFieldState => {
  const total = state.values.length;
  const next = new Float32Array(total);
  for (let i = 0; i < total; i += 1) {
    const updated = state.values[i] + stepSize * derivatives.laplacian[i];
    if (clamp) {
      next[i] = Math.min(clamp.max, Math.max(clamp.min, updated));
    } else {
      next[i] = updated;
    }
  }
  return { width: state.width, height: state.height, values: next };
};

export function runNoiseFieldLoop(options: NoiseFieldLoopOptions = {}): NoiseFieldLoopResult {
  const width = Math.max(2, options.width ?? 32);
  const height = Math.max(2, options.height ?? 32);
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(options.thresholds ?? {}) };
  const stepSize = options.stepSize ?? 0.15;
  const initialState =
    options.initialState ?? createNoiseField(width, height, options.seed ?? 1);

  const handlers: ConstraintLoopHandlers<
    NoiseFieldState,
    NoiseFieldDerivatives,
    NoiseFieldConstraints
  > = {
    derive: (state) => computeLaplacian(state),
    constrain: (_state, derivatives) => evaluateLaplacian(derivatives),
    gate: (constraints) => buildGate(constraints, thresholds),
    step: (state, derivatives) => stepNoiseField(state, derivatives, stepSize, options.clamp),
    cloneState: cloneNoiseState,
    capture: ({ state, derivatives, constraints }) => ({
      state: cloneNoiseState(state),
      derivatives: { laplacian: new Float32Array(derivatives.laplacian) },
      constraints: { ...constraints },
    }),
  };

  return runConstraintLoop({
    initialState,
    maxIterations: options.maxIterations ?? 6,
    handlers,
  });
}
