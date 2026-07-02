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
    lane_id: dispatchPlan.lane_id,
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
