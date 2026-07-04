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

const uniqueNumbers = (values: number[]): number[] => Array.from(new Set(values));

const uniqueWakeKinds = (
  values: Array<"mailbox_wake" | "none" | null | undefined>,
): ("mailbox_wake" | "none")[] => Array.from(
  new Set(values.filter((value): value is "mailbox_wake" | "none" =>
    value === "mailbox_wake" || value === "none")),
);

const admissionPermissionsAreNonMutating = (
  admission: HelixCapabilityLaneGoalDispatchAdmission,
): boolean => {
  const permissions = admission.permissions;
  if (!permissions) return true;
  return permissions.write === false &&
    permissions.shell === false &&
    permissions.code_mutation === false;
};

export const buildHelixCapabilityLaneGoalDispatchReadiness = (input: {
  plans: HelixCapabilityLaneGoalDispatchPlan[];
  admissions: HelixCapabilityLaneGoalDispatchAdmission[];
}): HelixCapabilityLaneGoalDispatchReadiness => {
  const admitted = input.admissions.filter((admission) => admission.status !== "blocked");
  const blocked = input.admissions.filter((admission) => admission.status === "blocked");
  const liveMailLoopRequiredCount = admitted.filter((admission) =>
    admission.requires_live_mail_loop === true
  ).length;
  const terminalAuthorityRequiredCount = admitted.filter((admission) =>
    admission.requires_terminal_authority === true
  ).length;

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
    next_runtime_agent_providers: uniqueStrings(
      admitted.map((admission) => admission.selected_runtime_agent_provider).filter(Boolean),
    ) as HelixCapabilityLaneGoalDispatchReadiness["next_runtime_agent_providers"],
    next_requested_backend_providers: uniqueStrings(
      admitted.map((admission) => admission.requested_backend_provider ?? "").filter(Boolean),
    ),
    next_selected_backend_providers: uniqueStrings(
      admitted.map((admission) => admission.selected_backend_provider ?? "").filter(Boolean),
    ),
    next_fallback_backend_providers: uniqueStrings(
      admitted.map((admission) => admission.fallback_backend_provider ?? "").filter(Boolean),
    ),
    next_backend_selection_reasons: uniqueStrings(
      admitted.map((admission) => admission.backend_selection_reason ?? "").filter(Boolean),
    ),
    next_cost_classes: uniqueStrings(
      admitted.map((admission) => admission.cost_class ?? "").filter(Boolean),
    ) as HelixCapabilityLaneGoalDispatchReadiness["next_cost_classes"],
    next_latency_classes: uniqueStrings(
      admitted.map((admission) => admission.latency_class ?? "").filter(Boolean),
    ) as HelixCapabilityLaneGoalDispatchReadiness["next_latency_classes"],
    next_privacy_classes: uniqueStrings(
      admitted.map((admission) => admission.privacy_class ?? "").filter(Boolean),
    ) as HelixCapabilityLaneGoalDispatchReadiness["next_privacy_classes"],
    next_session_control_keys: uniqueStrings(
      admitted.map((admission) => admission.session_control_key ?? "").filter(Boolean),
    ),
    next_source_binding_keys: uniqueStrings(
      admitted.map((admission) => admission.source_binding_key ?? "").filter(Boolean),
    ),
    next_source_identity_keys: uniqueStrings(
      admitted.map((admission) => admission.source_identity_key ?? "").filter(Boolean),
    ),
    next_mail_loop_observation_keys: uniqueStrings(
      admitted.map((admission) => admission.latest_mail_loop_observation_key ?? "").filter(Boolean),
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
    next_source_hashes: uniqueStrings(
      admitted.map((admission) => admission.source_hash ?? "").filter(Boolean),
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
    next_latest_event_ids: uniqueStrings(
      admitted.map((admission) => admission.latest_event_id ?? "").filter(Boolean),
    ),
    next_session_event_counts: uniqueNumbers(
      admitted
        .map((admission) => admission.session_event_count)
        .filter((value): value is number => typeof value === "number"),
    ),
    next_has_observation: admitted.some((admission) => admission.has_observation === true),
    all_next_have_observation: admitted.length > 0 &&
      admitted.every((admission) => admission.has_observation === true),
    next_chunk_ids: uniqueStrings(
      admitted.map((admission) => admission.latest_chunk_id ?? "").filter(Boolean),
    ),
    next_chunk_indexes: uniqueNumbers(
      admitted
        .map((admission) => admission.latest_chunk_index)
        .filter((value): value is number => typeof value === "number"),
    ),
    next_latest_source_ids: uniqueStrings(
      admitted.map((admission) => admission.latest_source_id ?? "").filter(Boolean),
    ),
    next_latest_source_hashes: uniqueStrings(
      admitted.map((admission) => admission.latest_source_hash ?? "").filter(Boolean),
    ),
    next_latest_source_kinds: uniqueStrings(
      admitted.map((admission) => admission.latest_source_kind ?? "").filter(Boolean),
    ),
    next_latest_target_languages: uniqueStrings(
      admitted.map((admission) => admission.latest_target_language ?? "").filter(Boolean),
    ),
    next_dedupe_keys: uniqueStrings(
      admitted.map((admission) => admission.latest_dedupe_key ?? "").filter(Boolean),
    ),
    next_source_event_ids: uniqueStrings(
      admitted.map((admission) => admission.latest_source_event_id ?? "").filter(Boolean),
    ),
    next_source_event_mses: uniqueNumbers(
      admitted
        .map((admission) => admission.latest_source_event_ms)
        .filter((value): value is number => typeof value === "number"),
    ),
    next_observed_at_mses: uniqueNumbers(
      admitted
        .map((admission) => admission.latest_observed_at_ms)
        .filter((value): value is number => typeof value === "number"),
    ),
    next_source_text_hashes: uniqueStrings(
      admitted.map((admission) => admission.source_text_hash ?? "").filter(Boolean),
    ),
    next_source_text_char_counts: uniqueNumbers(
      admitted
        .map((admission) => admission.source_text_char_count)
        .filter((value): value is number => typeof value === "number"),
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
    next_mail_loop_wake_kinds: uniqueWakeKinds(
      admitted.map((admission) => admission.latest_mail_loop_wake_kind),
    ),
    live_mail_loop_required_count: liveMailLoopRequiredCount,
    terminal_authority_required_count: terminalAuthorityRequiredCount,
    any_live_mail_loop_required: liveMailLoopRequiredCount > 0,
    any_terminal_authority_required: terminalAuthorityRequiredCount > 0,
    all_admitted_permissions_non_mutating: admitted.every(admissionPermissionsAreNonMutating),
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
    context_role: "tool_evidence",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
