import type {
  PhysicsSimulationTickPayload,
  PhysicsStabilityTrackerConfig,
} from "@shared/helix-live-simulation";

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export function buildPhysicsStabilityTick(input: {
  config?: Partial<PhysicsStabilityTrackerConfig> | null;
  sample_index: number;
}): PhysicsSimulationTickPayload {
  const config = input.config ?? {};
  const sampleIndex = Math.max(1, Math.trunc(input.sample_index));
  const tolerance = asNumber(config.tolerance, 0.01);
  const stableWindowSize = Math.max(1, Math.trunc(asNumber(config.stable_window_size, 5)));
  const baseVariables = config.variable_bindings && typeof config.variable_bindings === "object"
    ? config.variable_bindings
    : {};
  const observed = Array.isArray(config.observed_series)
    ? config.observed_series[Math.min(config.observed_series.length - 1, sampleIndex - 1)] ?? null
    : null;
  const expected = asNumber(baseVariables.expected, 1);
  const amplitude = asNumber(baseVariables.amplitude, 0.08);
  const decay = Math.max(1, asNumber(baseVariables.decay, 3));
  const syntheticResult =
    observed && typeof observed.result === "number"
      ? observed.result
      : expected + amplitude / (sampleIndex + decay);
  const residual = Math.abs(syntheticResult - expected);
  const stableCount = Math.min(stableWindowSize, Math.max(0, sampleIndex - Math.ceil(residual / Math.max(tolerance, 0.000001))));
  return {
    sample_index: sampleIndex,
    variables: {
      ...baseVariables,
      expected,
      sample_index: sampleIndex,
    },
    result: syntheticResult,
    residual,
    tolerance,
    moving_average: syntheticResult,
    stability_window: {
      size: stableWindowSize,
      stable_count: residual <= tolerance ? stableCount : 0,
    },
    anomaly: residual > tolerance * 4,
  };
}

