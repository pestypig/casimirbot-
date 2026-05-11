import type { LivePipelineTransformKind } from "./helix-live-workstation-pipeline";

export const HELIX_LIVE_TRANSFORM_RESULT_SCHEMA = "helix.live_transform_result.v1" as const;

export type LiveTransformResult = {
  schema: typeof HELIX_LIVE_TRANSFORM_RESULT_SCHEMA;
  transform_id: string;
  pipeline_id: string;
  source_event_ids: string[];
  window_id?: string | null;
  kind: LivePipelineTransformKind;
  text: string;
  lines?: Record<string, string>;
  evidence_refs: string[];
  model_invoked: boolean;
  deterministic: boolean;
  confidence?: number | null;
  ts: string;
};
