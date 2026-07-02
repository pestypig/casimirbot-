import { describe, expect, it } from "vitest";
import type {
  HelixCapabilityLaneGoalDispatchAdmission,
  HelixCapabilityLaneGoalDispatchPlan,
} from "@shared/helix-capability-lane-goal-binding";
import { buildHelixCapabilityLaneGoalDispatchReadiness } from "../goal-dispatch-readiness";

const buildPlan = (
  goalBindingId: string,
  receiptRef: string | null,
): HelixCapabilityLaneGoalDispatchPlan => ({
  schema: "helix.capability_lane.goal_dispatch_plan.v1",
  target: "ask_wake",
  status: "planned_not_dispatched",
  reason: "goal_binding_policy_plans_ask_wake",
  source_report_action: "wake_on_salience",
  goal_binding_id: goalBindingId,
  goal_id: `goal:${goalBindingId}`,
  lane_session_id: `session:${goalBindingId}`,
  lane_id: "live_translation",
  evidence_ref: `ask:lane:translation:${goalBindingId}:obs`,
  mail_loop_ref: `stage-play-mail:${goalBindingId}`,
  receipt_ref: receiptRef,
  requires_live_mail_loop: true,
  requires_terminal_authority: false,
  side_effects_executed: false,
  wake_dispatched: false,
  badge_projected: false,
  terminal_report_emitted: false,
  terminal_authority_status: "pending_helix_terminal_authority",
  reentry_required: true,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const buildAdmission = (
  plan: HelixCapabilityLaneGoalDispatchPlan,
  status: HelixCapabilityLaneGoalDispatchAdmission["status"],
  blockedReason: string | null = null,
): HelixCapabilityLaneGoalDispatchAdmission => ({
  schema: "helix.capability_lane.goal_dispatch_admission.v1",
  status,
  reason: blockedReason
    ? `goal_dispatch_admission_blocked:${blockedReason}`
    : `goal_dispatch_admission_${status}`,
  target: plan.target,
  goal_binding_id: plan.goal_binding_id,
  goal_id: plan.goal_id,
  lane_session_id: plan.lane_session_id,
  lane_id: plan.lane_id,
  evidence_ref: plan.evidence_ref,
  mail_loop_ref: plan.mail_loop_ref,
  receipt_ref: plan.receipt_ref,
  blocked_reason: blockedReason,
  requires_live_mail_loop: plan.requires_live_mail_loop,
  requires_terminal_authority: plan.requires_terminal_authority,
  side_effects_allowed: false,
  side_effects_executed: false,
  wake_dispatch_allowed: false,
  badge_projection_allowed: false,
  terminal_report_allowed: false,
  terminal_authority_status: plan.terminal_authority_status,
  reentry_required: true,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

describe("capability lane goal dispatch readiness", () => {
  it("aggregates next evidence and receipt refs from admitted dispatch admissions without granting side effects", () => {
    const admitted = buildPlan(
      "goal-binding-ready",
      "ask:lane:translation:ready-obs:projection:receipt",
    );
    const duplicateReceipt = buildPlan(
      "goal-binding-ready-duplicate",
      "ask:lane:translation:ready-obs:projection:receipt",
    );
    const blocked = buildPlan(
      "goal-binding-blocked",
      "ask:lane:translation:blocked-obs:projection:receipt",
    );

    expect(buildHelixCapabilityLaneGoalDispatchReadiness({
      plans: [admitted, duplicateReceipt, blocked],
      admissions: [
        buildAdmission(admitted, "eligible_waiting_for_mail_loop"),
        buildAdmission(duplicateReceipt, "eligible_waiting_for_mail_loop"),
        buildAdmission(blocked, "blocked", "missing_mail_loop_ref"),
      ],
    })).toMatchObject({
      schema: "helix.capability_lane.goal_dispatch_readiness.v1",
      total_plans: 3,
      total_admissions: 3,
      admitted_count: 2,
      blocked_count: 1,
      pending_wake_count: 2,
      blocked_reasons: ["missing_mail_loop_ref"],
      next_lane_ids: ["live_translation"],
      next_lane_session_ids: ["session:goal-binding-ready", "session:goal-binding-ready-duplicate"],
      next_dispatch_targets: ["ask_wake"],
      next_goal_binding_ids: ["goal-binding-ready", "goal-binding-ready-duplicate"],
      next_evidence_refs: [
        "ask:lane:translation:goal-binding-ready:obs",
        "ask:lane:translation:goal-binding-ready-duplicate:obs",
      ],
      next_receipt_refs: ["ask:lane:translation:ready-obs:projection:receipt"],
      side_effects_allowed: false,
      side_effects_executed: false,
      wake_dispatch_allowed: false,
      badge_projection_allowed: false,
      terminal_report_allowed: false,
      terminal_report_emitted: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });
});
