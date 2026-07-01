import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneId,
} from "./helix-capability-lane";

export const HELIX_CAPABILITY_LANE_MAIL_LOOP_DEBUG_SUMMARY_SCHEMA =
  "helix.capability_lane.mail_loop_debug_summary.v1" as const;

export type HelixCapabilityLaneMailLoopDebugSummary = {
  schema: typeof HELIX_CAPABILITY_LANE_MAIL_LOOP_DEBUG_SUMMARY_SCHEMA;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  capability: string;
  observation_ref: string | null;
  stage_play_mail_id: string | null;
  stage_play_wake_expected: boolean;
  mailbox_thread_id: string;
  source_id: string | null;
  source_kind: string | null;
  chunk_id: string | null;
  projection_target: string | null;
  selected_backend_provider: string | null;
  requested_backend_provider: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  freshness_status: string | null;
  blocked_reason: string | null;
  mail_status: string | null;
  evidence_refs: string[];
  reentry_required: true;
  terminal_authority_status: "pending_helix_terminal_authority" | "not_terminal_authority";
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
