import type { HelixLiveEnvironmentCommentary } from "./helix-live-environment-commentary";

export const HELIX_INTERPRETED_EVENT_SCHEMA =
  "helix.interpreted_event.v1" as const;

export type HelixInterpretedEventKind =
  | "source_observation"
  | "visual_observation"
  | "visual_event_alignment"
  | "categorization"
  | "present_state_synthesis"
  | "line_tool_evaluation"
  | "synthetic_evidence"
  | "subgoal_update"
  | "mission_memory_update"
  | "live_environment_delta"
  | "user_steering"
  | "steering_applied"
  | "hypothesis_confidence_changed"
  | "clarification_need"
  | "clarification_question"
  | "utility_hypothesis"
  | "pattern_candidate"
  | "archive_summary"
  | "agentic_review"
  | "tool_trace"
  | "proof_recall"
  | "callout_proposal"
  | "callout_delivery"
  | "final_answer_snapshot";

export type HelixInterpretedEvent = {
  schema: typeof HELIX_INTERPRETED_EVENT_SCHEMA;
  event_id: string;
  thread_id: string;
  room_id?: string | null;
  source_family?: string | null;
  kind: HelixInterpretedEventKind;
  title: string;
  summary: string;
  confidence?: number | null;
  evidence_refs: string[];
  source_event_ids?: string[];
  related_artifact_ids?: string[];
  related_job_ids?: string[];
  created_at: string;
  model_invoked: boolean;
  deterministic: boolean;
  assistant_answer: false;
  raw_logs_included: false;
  context_policy: "compact_context_pack_only";
};

export type HelixInterpretedLogRead = {
  schema: "helix.interpreted_log_read.v1";
  thread_id: string;
  room_id?: string | null;
  events: HelixInterpretedEvent[];
  interpreted_events?: HelixInterpretedEvent[];
  typed_commentary?: HelixLiveEnvironmentCommentary[];
  raw_logs_included: false;
  deterministic_content_role: "evidence_not_assistant_answer";
  context_role?: "tool_evidence";
  ask_context_policy?: "evidence_only";
  assistant_answer?: false;
};
