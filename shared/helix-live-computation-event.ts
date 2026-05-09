export const HELIX_LIVE_COMPUTATION_EVENT_SCHEMA = "helix.live_computation_event.v1" as const;

export type LiveComputationEvent = {
  schema: typeof HELIX_LIVE_COMPUTATION_EVENT_SCHEMA;
  event_id: string;
  source_id: string;
  environment_id: string;
  seq: number;
  expression?: string;
  inputs: Record<string, number | string | boolean | null>;
  output: Record<string, unknown>;
  ok: boolean;
  error?: string | null;
  tolerance?: number | null;
  residual?: number | null;
  stability?: {
    window_size: number;
    mean?: number | null;
    variance?: number | null;
    confidence?: number | null;
  } | null;
  evidence_refs: string[];
  ts: string;
};
