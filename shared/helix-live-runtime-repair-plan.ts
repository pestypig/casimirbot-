export const HELIX_LIVE_RUNTIME_REPAIR_PLAN_SCHEMA = "helix.live_runtime_repair_plan.v1" as const;

export type HelixLiveRuntimeRepairProblemKind =
  | "visual_stale"
  | "visual_no_chunks"
  | "visual_analysis_pending"
  | "visual_analysis_failed"
  | "vision_provider_missing"
  | "world_event_no_thread_context"
  | "world_event_stale"
  | "card_not_updated"
  | "analysis_backpressure"
  | "missing_audio_transcript"
  | "missing_permission";

export type HelixLiveRuntimeRepairActionId =
  | "grant_visual_capture_permission"
  | "capture_frame_now"
  | "run_due_analysis"
  | "configure_vision_provider"
  | "attach_world_event_source_to_thread"
  | "reduce_visual_cadence"
  | "resume_visual_producer"
  | "restart_visual_producer"
  | "attach_audio_or_transcript_source"
  | "rerun_acceptance";

export type HelixLiveRuntimeRepairPlan = {
  schema: typeof HELIX_LIVE_RUNTIME_REPAIR_PLAN_SCHEMA;
  repair_plan_id: string;
  thread_id: string;
  pipeline_id?: string | null;
  environment_id?: string | null;
  producer_id?: string | null;
  diagnostic_refs: string[];
  problem_kind: HelixLiveRuntimeRepairProblemKind;
  recommended_actions: Array<{
    action_id: HelixLiveRuntimeRepairActionId;
    requires_user_permission: boolean;
    can_run_automatically: boolean;
    summary: string;
  }>;
  selected_action_id?: HelixLiveRuntimeRepairActionId | null;
  assistant_answer: false;
  raw_content_included: false;
};
