import type { HelixLivePipelineLifecycleEvent } from "./helix-live-pipeline-lifecycle";

export const HELIX_LIVE_PIPELINE_READINESS_SCHEMA =
  "helix.live_pipeline_readiness.v1" as const;

export type HelixLivePipelineReadinessState =
  | "not_started"
  | "waiting_for_permission"
  | "waiting_for_client_adoption"
  | "client_adopted_waiting_for_chunk"
  | "client_stream_ended"
  | "client_action_failed"
  | "producer_active_chunks_flowing"
  | "analysis_blocked"
  | "waiting_for_first_chunk"
  | "analyzing"
  | "ready"
  | "degraded"
  | "blocked"
  | "stale"
  | "error";

export type HelixLivePipelineReadiness = {
  schema: typeof HELIX_LIVE_PIPELINE_READINESS_SCHEMA;
  pipeline_id: string;
  thread_id: string;
  environment_id?: string | null;
  state: HelixLivePipelineReadinessState;
  score: number;
  summary: string;
  source_health: Array<{
    source_id: string;
    modality: string;
    status: string;
    latest_chunk_id?: string | null;
    latest_analysis_job_id?: string | null;
    latest_evidence_ref?: string | null;
    client_action_status?: string | null;
    client_adoption_status?: string | null;
    readiness_state?: string | null;
    next_required_action?: string | null;
  }>;
  missing_capabilities: string[];
  repair_actions: string[];
  latest_lifecycle_event?: HelixLivePipelineLifecycleEvent | null;
  lifecycle_event_count: number;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
