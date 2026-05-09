export const HELIX_PHYSICS_STABILITY_TRACKER_CONFIG_SCHEMA =
  "helix.physics_stability_tracker_config.v1" as const;

export type PhysicsStabilityTrackerConfig = {
  schema?: typeof HELIX_PHYSICS_STABILITY_TRACKER_CONFIG_SCHEMA;
  expression: string;
  variable_bindings: Record<string, number>;
  observed_series?: Array<Record<string, number>>;
  tolerance: number;
  stable_window_size: number;
  tick_rate_ms: number;
};

export type PhysicsSimulationTickPayload = {
  sample_index: number;
  variables: Record<string, number>;
  result: number;
  residual?: number | null;
  tolerance?: number | null;
  moving_average?: number | null;
  stability_window?: {
    size: number;
    stable_count: number;
  } | null;
  anomaly?: boolean;
};

