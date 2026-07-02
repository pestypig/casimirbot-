import type {
  HelixCapabilityLaneGoalDispatchAdmission,
  HelixCapabilityLaneGoalDispatchPlan,
  HelixCapabilityLaneGoalDispatchReadiness,
  HelixCapabilityLaneGoalDispatchTarget,
} from "@shared/helix-capability-lane-goal-binding";
import { HELIX_CAPABILITY_LANE_GOAL_DISPATCH_READINESS_SCHEMA } from "@shared/helix-capability-lane-goal-binding";

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const uniqueTargets = (
  values: HelixCapabilityLaneGoalDispatchTarget[],
): HelixCapabilityLaneGoalDispatchTarget[] => Array.from(new Set(values));

export const buildHelixCapabilityLaneGoalDispatchReadiness = (input: {
  plans: HelixCapabilityLaneGoalDispatchPlan[];
  admissions: HelixCapabilityLaneGoalDispatchAdmission[];
}): HelixCapabilityLaneGoalDispatchReadiness => {
  const admitted = input.admissions.filter((admission) => admission.status !== "blocked");
  const blocked = input.admissions.filter((admission) => admission.status === "blocked");

  return {
    schema: HELIX_CAPABILITY_LANE_GOAL_DISPATCH_READINESS_SCHEMA,
    total_plans: input.plans.length,
    total_admissions: input.admissions.length,
    admitted_count: admitted.length,
    blocked_count: blocked.length,
    pending_wake_count: input.admissions.filter((admission) =>
      admission.status === "eligible_waiting_for_mail_loop").length,
    pending_terminal_authority_count: input.admissions.filter((admission) =>
      admission.status === "eligible_pending_terminal_authority").length,
    projection_only_count: input.admissions.filter((admission) =>
      admission.status === "admitted_projection_only").length,
    manual_review_count: input.admissions.filter((admission) =>
      admission.status === "eligible_manual_review").length,
    debug_only_count: input.admissions.filter((admission) =>
      admission.status === "admitted_debug_only").length,
    blocked_reasons: uniqueStrings(
      blocked.map((admission) => admission.blocked_reason ?? "").filter(Boolean),
    ),
    next_lane_ids: uniqueStrings(
      admitted.map((admission) => admission.lane_id),
    ) as HelixCapabilityLaneGoalDispatchReadiness["next_lane_ids"],
    next_lane_session_ids: uniqueStrings(
      admitted.map((admission) => admission.lane_session_id).filter(Boolean),
    ),
    next_dispatch_targets: uniqueTargets(
      admitted
        .map((admission) => admission.target)
        .filter((target) => target !== "none"),
    ),
    next_goal_binding_ids: uniqueStrings(
      admitted.map((admission) => admission.goal_binding_id).filter(Boolean),
    ),
    next_source_ids: uniqueStrings(
      admitted.map((admission) => admission.source_id ?? "").filter(Boolean),
    ),
    next_source_kinds: uniqueStrings(
      admitted.map((admission) => admission.source_kind ?? "").filter(Boolean),
    ),
    next_source_projection_targets: uniqueStrings(
      admitted.map((admission) => admission.source_projection_target ?? "").filter(Boolean),
    ),
    next_account_locales: uniqueStrings(
      admitted.map((admission) => admission.account_locale ?? "").filter(Boolean),
    ),
    next_chunk_ids: uniqueStrings(
      admitted.map((admission) => admission.latest_chunk_id ?? "").filter(Boolean),
    ),
    next_dedupe_keys: uniqueStrings(
      admitted.map((admission) => admission.latest_dedupe_key ?? "").filter(Boolean),
    ),
    next_source_event_ids: uniqueStrings(
      admitted.map((admission) => admission.latest_source_event_id ?? "").filter(Boolean),
    ),
    next_projection_targets: uniqueStrings(
      admitted.map((admission) => admission.latest_projection_target ?? "").filter(Boolean),
    ),
    next_target_languages: uniqueStrings(
      admitted.map((admission) => admission.target_language ?? "").filter(Boolean),
    ),
    next_freshness_statuses: uniqueStrings(
      admitted.map((admission) => admission.latest_freshness_status ?? "").filter(Boolean),
    ),
    next_cancel_requested: admitted.some((admission) => admission.latest_cancel_requested === true),
    next_evidence_refs: uniqueStrings(
      admitted.map((admission) => admission.evidence_ref ?? "").filter(Boolean),
    ),
    next_receipt_refs: uniqueStrings(
      admitted.map((admission) => admission.receipt_ref ?? "").filter(Boolean),
    ),
    side_effects_allowed: false,
    side_effects_executed: false,
    wake_dispatch_allowed: false,
    badge_projection_allowed: false,
    terminal_report_allowed: false,
    terminal_report_emitted: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
