import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneCostClass,
  HelixCapabilityLaneId,
  HelixCapabilityLaneLatencyClass,
  HelixCapabilityLanePrivacyClass,
} from "./helix-capability-lane";

export const HELIX_CAPABILITY_LANE_MAIL_LOOP_DEBUG_SUMMARY_SCHEMA =
  "helix.capability_lane.mail_loop_debug_summary.v1" as const;

export type HelixCapabilityLaneMailLoopDebugSummary = {
  schema: typeof HELIX_CAPABILITY_LANE_MAIL_LOOP_DEBUG_SUMMARY_SCHEMA;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  capability: string;
  observation_ref: string | null;
  receipt_ref: string | null;
  stage_play_mail_id: string | null;
  stage_play_mail_delivery_status: "created" | "deduped_existing" | "blocked";
  materialized_mail_loop_evidence: boolean;
  previous_stage_play_mail_id: string | null;
  stage_play_wake_expected: boolean;
  stage_play_wake_kind: "mailbox_wake" | "none";
  mailbox_wake_expected: boolean;
  decision_wake_expected: false;
  mailbox_thread_id: string;
  observation_lane_session_id?: string | null;
  source_id: string | null;
  source_hash?: string | null;
  source_kind: string | null;
  account_locale: string | null;
  lane_session_source_id?: string | null;
  lane_session_source_hash?: string | null;
  lane_session_source_text_hash?: string | null;
  lane_session_source_text_char_count?: number | null;
  lane_session_projection_target?: string | null;
  lane_session_target_language?: string | null;
  lane_session_account_locale?: string | null;
  lane_session_control_key?: string | null;
  lane_session_source_binding_key?: string | null;
  lane_session_source_identity_key?: string | null;
  source_identity_key?: string | null;
  latest_source_identity_key?: string | null;
  mail_loop_observation_key: string | null;
  chunk_id: string | null;
  chunk_index: number | null;
  dedupe_key: string | null;
  source_event_id: string | null;
  source_event_ms: number | null;
  observed_at_ms: number | null;
  projection_target: string | null;
  target_language: string | null;
  cancel_requested: boolean;
  selected_backend_provider: string | null;
  requested_backend_provider: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  cost_class: HelixCapabilityLaneCostClass | "unknown" | null;
  latency_class: HelixCapabilityLaneLatencyClass | "unknown" | null;
  privacy_class: HelixCapabilityLanePrivacyClass | "unknown" | null;
  fallback_backend_provider: string | null;
  freshness_status: string | null;
  source_text_hash?: string | null;
  source_text_char_count?: number | null;
  blocked_reason: string | null;
  mail_status: string | null;
  evidence_refs: string[];
  reentry_required: true;
  terminal_authority_status: "pending_helix_terminal_authority" | "not_terminal_authority";
  context_role: "tool_evidence";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
