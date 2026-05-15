export const HELIX_LIVE_PIPELINE_LIFECYCLE_EVENT_SCHEMA =
  "helix.live_pipeline_lifecycle_event.v1" as const;

export type HelixLivePipelineLifecycleKind =
  | "pipeline_planned"
  | "pipeline_executed"
  | "producer_created"
  | "rate_policy_set"
  | "source_permission_required"
  | "source_active"
  | "chunk_received"
  | "analysis_job_queued"
  | "analysis_job_started"
  | "analysis_job_completed"
  | "analysis_job_failed"
  | "evidence_routed"
  | "present_state_updated"
  | "repair_action_proposed"
  | "repair_action_executed"
  | "pipeline_ready"
  | "pipeline_degraded"
  | "pipeline_stopped";

export type HelixLivePipelineLifecycleStatus =
  | "planned"
  | "running"
  | "completed"
  | "failed"
  | "blocked"
  | "degraded";

export type HelixLivePipelineLifecycleEvent = {
  schema: typeof HELIX_LIVE_PIPELINE_LIFECYCLE_EVENT_SCHEMA;
  event_id: string;
  pipeline_id: string;
  thread_id: string;
  environment_id?: string | null;
  kind: HelixLivePipelineLifecycleKind;
  status: HelixLivePipelineLifecycleStatus;
  summary: string;
  related_ids: string[];
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
