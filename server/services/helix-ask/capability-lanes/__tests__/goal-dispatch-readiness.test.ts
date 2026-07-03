import { describe, expect, it } from "vitest";
import type {
  HelixCapabilityLaneGoalDispatchAdmission,
  HelixCapabilityLaneGoalDispatchPlan,
} from "@shared/helix-capability-lane-goal-binding";
import { buildHelixCapabilityLaneGoalDispatchReadiness } from "../goal-dispatch-readiness";

const buildPlan = (
  goalBindingId: string,
  receiptRef: string | null,
  target: HelixCapabilityLaneGoalDispatchPlan["target"] = "ask_wake",
): HelixCapabilityLaneGoalDispatchPlan => ({
  schema: "helix.capability_lane.goal_dispatch_plan.v1",
  target,
  status: "planned_not_dispatched",
  reason: `goal_binding_policy_plans_${target}`,
  source_report_action: target === "terminal_authority_review"
    ? "request_terminal_authority"
    : target === "manual_review"
      ? "manual_review"
      : target === "ui_badge"
        ? "surface_badge"
        : target === "none"
          ? "record_only"
          : "wake_on_salience",
  goal_binding_id: goalBindingId,
  goal_id: `goal:${goalBindingId}`,
  lane_session_id: `session:${goalBindingId}`,
  lane_id: "live_translation",
  source_id: `docs:${goalBindingId}`,
  source_hash: `sha256:${goalBindingId}`,
  source_kind: "docs",
  source_projection_target: "docs_chunk",
  account_locale: "es-US",
  latest_chunk_id: `chunk:${goalBindingId}`,
  latest_chunk_index: 1,
  latest_dedupe_key: `dedupe:${goalBindingId}:es`,
  latest_source_event_id: `docs:${goalBindingId}:event`,
  latest_source_event_ms: 100,
  latest_observed_at_ms: 125,
  latest_freshness_status: "fresh",
  latest_projection_target: "docs_chunk",
  target_language: "es",
  latest_cancel_requested: goalBindingId.includes("duplicate"),
  permissions: {
    read: true,
    observe: true,
    act: true,
    write: false,
    shell: false,
    code_mutation: false,
  },
  evidence_ref: `ask:lane:translation:${goalBindingId}:obs`,
  mail_loop_ref: `stage-play-mail:${goalBindingId}`,
  receipt_ref: receiptRef,
  requires_live_mail_loop: target === "ask_wake",
  requires_terminal_authority: target === "terminal_authority_review",
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
  source_id: plan.source_id ?? null,
  source_hash: plan.source_hash ?? null,
  source_kind: plan.source_kind ?? null,
  source_projection_target: plan.source_projection_target ?? null,
  account_locale: plan.account_locale ?? null,
  latest_chunk_id: plan.latest_chunk_id ?? null,
  latest_chunk_index: plan.latest_chunk_index ?? null,
  latest_dedupe_key: plan.latest_dedupe_key ?? null,
  latest_source_event_id: plan.latest_source_event_id ?? null,
  latest_source_event_ms: plan.latest_source_event_ms ?? null,
  latest_observed_at_ms: plan.latest_observed_at_ms ?? null,
  latest_freshness_status: plan.latest_freshness_status ?? null,
  latest_projection_target: plan.latest_projection_target ?? null,
  target_language: plan.target_language ?? null,
  latest_cancel_requested: plan.latest_cancel_requested ?? null,
  permissions: plan.permissions,
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
      next_source_ids: ["docs:goal-binding-ready", "docs:goal-binding-ready-duplicate"],
      next_source_hashes: ["sha256:goal-binding-ready", "sha256:goal-binding-ready-duplicate"],
      next_source_kinds: ["docs"],
      next_source_projection_targets: ["docs_chunk"],
      next_account_locales: ["es-US"],
      next_chunk_ids: ["chunk:goal-binding-ready", "chunk:goal-binding-ready-duplicate"],
      next_dedupe_keys: ["dedupe:goal-binding-ready:es", "dedupe:goal-binding-ready-duplicate:es"],
      next_source_event_ids: ["docs:goal-binding-ready:event", "docs:goal-binding-ready-duplicate:event"],
      next_projection_targets: ["docs_chunk"],
      next_target_languages: ["es"],
      next_freshness_statuses: ["fresh"],
      next_cancel_requested: true,
      all_admitted_permissions_non_mutating: true,
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

  it("classifies terminal-review, projection, manual, and debug-only admissions without enabling dispatch side effects", () => {
    const terminalReview = buildPlan(
      "goal-binding-terminal",
      "ask:lane:translation:terminal-obs:projection:receipt",
      "terminal_authority_review",
    );
    const projectionOnly = buildPlan(
      "goal-binding-badge",
      "ask:lane:translation:badge-obs:projection:receipt",
      "ui_badge",
    );
    const manualReview = buildPlan(
      "goal-binding-manual",
      "ask:lane:translation:manual-obs:projection:receipt",
      "manual_review",
    );
    const debugOnly = buildPlan(
      "goal-binding-debug",
      "ask:lane:translation:debug-obs:projection:receipt",
      "none",
    );

    expect(buildHelixCapabilityLaneGoalDispatchReadiness({
      plans: [terminalReview, projectionOnly, manualReview, debugOnly],
      admissions: [
        buildAdmission(terminalReview, "eligible_pending_terminal_authority"),
        buildAdmission(projectionOnly, "admitted_projection_only"),
        buildAdmission(manualReview, "eligible_manual_review"),
        buildAdmission(debugOnly, "admitted_debug_only"),
      ],
    })).toMatchObject({
      total_plans: 4,
      total_admissions: 4,
      admitted_count: 4,
      blocked_count: 0,
      pending_wake_count: 0,
      pending_terminal_authority_count: 1,
      projection_only_count: 1,
      manual_review_count: 1,
      debug_only_count: 1,
      blocked_reasons: [],
      next_dispatch_targets: [
        "terminal_authority_review",
        "ui_badge",
        "manual_review",
      ],
      next_goal_binding_ids: [
        "goal-binding-terminal",
        "goal-binding-badge",
        "goal-binding-manual",
        "goal-binding-debug",
      ],
      next_evidence_refs: [
        "ask:lane:translation:goal-binding-terminal:obs",
        "ask:lane:translation:goal-binding-badge:obs",
        "ask:lane:translation:goal-binding-manual:obs",
        "ask:lane:translation:goal-binding-debug:obs",
      ],
      next_receipt_refs: [
        "ask:lane:translation:terminal-obs:projection:receipt",
        "ask:lane:translation:badge-obs:projection:receipt",
        "ask:lane:translation:manual-obs:projection:receipt",
        "ask:lane:translation:debug-obs:projection:receipt",
      ],
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
