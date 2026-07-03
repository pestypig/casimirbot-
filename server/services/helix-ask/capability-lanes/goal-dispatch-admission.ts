import type {
  HelixCapabilityLaneGoalDispatchAdmission,
  HelixCapabilityLaneGoalDispatchPlan,
} from "@shared/helix-capability-lane-goal-binding";
import { HELIX_CAPABILITY_LANE_GOAL_DISPATCH_ADMISSION_SCHEMA } from "@shared/helix-capability-lane-goal-binding";

export const buildHelixCapabilityLaneGoalDispatchAdmission = (
  dispatchPlan: HelixCapabilityLaneGoalDispatchPlan,
): HelixCapabilityLaneGoalDispatchAdmission => {
  const blockedReason = (() => {
    if (dispatchPlan.source_report_action === "stopped") return "goal_binding_stopped";
    if (!dispatchPlan.evidence_ref) return "missing_evidence_ref";
    if (dispatchPlan.target === "ask_wake" && !dispatchPlan.mail_loop_ref) {
      return "missing_mail_loop_ref";
    }
    if (
      dispatchPlan.target === "terminal_authority_review" &&
      dispatchPlan.terminal_authority_status !== "pending_helix_terminal_authority"
    ) {
      return "terminal_authority_not_pending";
    }
    return null;
  })();

  const status = (() => {
    if (blockedReason) return "blocked";
    if (dispatchPlan.target === "ui_badge") return "admitted_projection_only";
    if (dispatchPlan.target === "ask_wake") return "eligible_waiting_for_mail_loop";
    if (dispatchPlan.target === "terminal_authority_review") {
      return "eligible_pending_terminal_authority";
    }
    if (dispatchPlan.target === "manual_review") return "eligible_manual_review";
    return "admitted_debug_only";
  })();

  return {
    schema: HELIX_CAPABILITY_LANE_GOAL_DISPATCH_ADMISSION_SCHEMA,
    status,
    reason: blockedReason
      ? `goal_dispatch_admission_blocked:${blockedReason}`
      : `goal_dispatch_admission_${status}`,
    target: dispatchPlan.target,
    goal_binding_id: dispatchPlan.goal_binding_id,
    goal_id: dispatchPlan.goal_id,
    lane_session_id: dispatchPlan.lane_session_id,
    session_control_key: dispatchPlan.session_control_key ?? null,
    source_binding_key: dispatchPlan.source_binding_key ?? null,
    latest_mail_loop_observation_key: dispatchPlan.latest_mail_loop_observation_key ?? null,
    lane_id: dispatchPlan.lane_id,
    source_id: dispatchPlan.source_id ?? null,
    source_hash: dispatchPlan.source_hash ?? null,
    source_kind: dispatchPlan.source_kind ?? null,
    source_projection_target: dispatchPlan.source_projection_target ?? null,
    account_locale: dispatchPlan.account_locale ?? null,
    latest_event_id: dispatchPlan.latest_event_id ?? null,
    session_event_count: dispatchPlan.session_event_count ?? null,
    has_observation: dispatchPlan.has_observation === true,
    latest_chunk_id: dispatchPlan.latest_chunk_id ?? null,
    latest_chunk_index: dispatchPlan.latest_chunk_index ?? null,
    latest_source_id: dispatchPlan.latest_source_id ?? null,
    latest_source_hash: dispatchPlan.latest_source_hash ?? null,
    latest_source_kind: dispatchPlan.latest_source_kind ?? null,
    latest_target_language: dispatchPlan.latest_target_language ?? null,
    latest_dedupe_key: dispatchPlan.latest_dedupe_key ?? null,
    latest_source_event_id: dispatchPlan.latest_source_event_id ?? null,
    latest_source_event_ms: dispatchPlan.latest_source_event_ms ?? null,
    latest_observed_at_ms: dispatchPlan.latest_observed_at_ms ?? null,
    latest_freshness_status: dispatchPlan.latest_freshness_status ?? null,
    source_text_hash: dispatchPlan.source_text_hash ?? null,
    source_text_char_count: dispatchPlan.source_text_char_count ?? null,
    latest_projection_target: dispatchPlan.latest_projection_target ?? null,
    target_language: dispatchPlan.target_language ?? null,
    latest_cancel_requested: dispatchPlan.latest_cancel_requested ?? null,
    latest_mail_loop_wake_kind: dispatchPlan.latest_mail_loop_wake_kind ?? null,
    permissions: dispatchPlan.permissions,
    evidence_ref: dispatchPlan.evidence_ref,
    mail_loop_ref: dispatchPlan.mail_loop_ref,
    receipt_ref: dispatchPlan.receipt_ref,
    blocked_reason: blockedReason,
    requires_live_mail_loop: dispatchPlan.requires_live_mail_loop,
    requires_terminal_authority: dispatchPlan.requires_terminal_authority,
    side_effects_allowed: false,
    side_effects_executed: false,
    wake_dispatch_allowed: false,
    badge_projection_allowed: false,
    terminal_report_allowed: false,
    terminal_authority_status: dispatchPlan.terminal_authority_status,
    reentry_required: true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
