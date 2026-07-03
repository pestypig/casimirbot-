import type {
  HelixCapabilityLaneGoalBinding,
  HelixCapabilityLaneGoalBindingDebugSummary,
  HelixCapabilityLaneGoalDispatchPlan,
  HelixCapabilityLaneGoalReportAction,
  HelixCapabilityLaneGoalReportDecision,
} from "@shared/helix-capability-lane-goal-binding";
import {
  HELIX_CAPABILITY_LANE_GOAL_BINDING_DEBUG_SUMMARY_SCHEMA,
  HELIX_CAPABILITY_LANE_GOAL_DISPATCH_PLAN_SCHEMA,
  HELIX_CAPABILITY_LANE_GOAL_REPORT_DECISION_SCHEMA,
} from "@shared/helix-capability-lane-goal-binding";
import type { HelixCapabilityLaneSessionEvent } from "@shared/helix-capability-lane-session";
import { buildHelixCapabilityLaneGoalDispatchAdmission } from "./goal-dispatch-admission";

const readTerminalAuthorityStatus = (
  binding: HelixCapabilityLaneGoalBinding,
): HelixCapabilityLaneGoalBindingDebugSummary["terminal_authority_status"] => {
  const latestObservationEvent = readLatestObservationEvent(binding);
  return (
    binding.latest_mail_loop_summary?.terminal_authority_status ??
    latestObservationEvent?.terminal_authority_status ??
    binding.debug_history.at(-1)?.terminal_authority_status ??
    binding.latest_lane_session_event?.terminal_authority_status ??
    "not_terminal_authority"
  );
};

const readLatestObservationEvent = (
  binding: HelixCapabilityLaneGoalBinding,
): HelixCapabilityLaneSessionEvent | null =>
  [...binding.lane_session_debug_history].reverse().find((event) => event.observation_ref) ??
  (binding.latest_lane_session_event?.observation_ref ? binding.latest_lane_session_event : null);

const readMailLoopRef = (binding: HelixCapabilityLaneGoalBinding): string | null =>
  binding.latest_mail_loop_summary?.stage_play_mail_id ||
  binding.latest_mail_loop_summary?.observation_ref ||
  binding.lane_session_mail_loop_refs.at(-1) ||
  null;

const readReceiptRef = (binding: HelixCapabilityLaneGoalBinding): string | null =>
  binding.latest_mail_loop_summary?.receipt_ref ??
  binding.lane_session_last_receipt_ref ??
  null;

const readTargetLanguage = (
  binding: HelixCapabilityLaneGoalBinding,
  latestObservationEvent: HelixCapabilityLaneSessionEvent | null,
): string | null =>
  binding.latest_mail_loop_summary?.target_language ??
  latestObservationEvent?.target_language ??
  binding.latest_lane_session_event?.target_language ??
  null;

const readMailLoopWakeKind = (
  binding: HelixCapabilityLaneGoalBinding,
): "mailbox_wake" | "none" | null => {
  const wakeKind = binding.latest_mail_loop_summary?.stage_play_wake_kind;
  if (wakeKind === "mailbox_wake" || wakeKind === "none") return wakeKind;
  if (binding.latest_mail_loop_summary?.stage_play_wake_expected === true) return "mailbox_wake";
  if (binding.latest_mail_loop_summary) return "none";
  return null;
};

const permissionProfileFor = (
  binding: HelixCapabilityLaneGoalBinding,
): HelixCapabilityLaneGoalBindingDebugSummary["permission_profile"] => {
  const permissions = binding.lane_session_permissions;
  if (!permissions.write && !permissions.shell && !permissions.code_mutation) {
    return "permissions non-mutating";
  }
  const allowed = [
    permissions.write ? "write" : "",
    permissions.shell ? "shell" : "",
    permissions.code_mutation ? "code mutation" : "",
  ].filter(Boolean);
  return allowed.length ? `permissions ${allowed.join(", ")}` : "permissions unknown";
};

const buildReportSummaryText = (input: {
  action: HelixCapabilityLaneGoalReportAction;
  reason: string;
  evidenceRef: string | null;
  mailLoopRef: string | null;
  receiptRef: string | null;
  terminalAuthorityStatus: HelixCapabilityLaneGoalReportDecision["terminal_authority_status"];
}): string => [
  `goal lane ${input.action.replace(/_/g, " ")}`,
  `reason ${input.reason}`,
  input.evidenceRef ? `evidence ${input.evidenceRef}` : "evidence none",
  input.mailLoopRef ? `mail ${input.mailLoopRef}` : "mail none",
  input.receiptRef ? `receipt ${input.receiptRef}` : "receipt none",
  `terminal authority ${input.terminalAuthorityStatus}`,
].join(" | ");

const compactKey = (parts: Array<string | null | undefined>): string | null => {
  const key = parts
    .map((part) => typeof part === "string" ? part.trim() : "")
    .filter(Boolean)
    .join("::");
  return key || null;
};

const goalBindingKeyFor = (binding: HelixCapabilityLaneGoalBinding): string =>
  compactKey([
    binding.goal_id,
    binding.goal_binding_id,
    binding.lane_session_id,
    binding.lane_id,
  ]) ?? binding.goal_binding_id;

const sourceBindingKeyFor = (binding: HelixCapabilityLaneGoalBinding): string | null =>
  compactKey([
    binding.lane_session_source_id,
    binding.lane_session_source_hash,
    binding.lane_session_projection_target,
    binding.lane_session_account_locale,
    readTargetLanguage(binding, readLatestObservationEvent(binding)),
  ]);

const sessionControlKeyFor = (binding: HelixCapabilityLaneGoalBinding): string | null =>
  compactKey([
    binding.lane_session_id,
    sourceBindingKeyFor(binding),
  ]);

const latestObservationKeyFor = (
  latestObservationEvent: HelixCapabilityLaneSessionEvent | null,
): string | null => {
  if (!latestObservationEvent) return null;
  return compactKey([
    latestObservationEvent.source_id,
    latestObservationEvent.source_hash,
    latestObservationEvent.projection_target,
    latestObservationEvent.target_language,
    latestObservationEvent.chunk_id,
    latestObservationEvent.receipt_ref ?? latestObservationEvent.observation_ref,
  ]);
};

const latestMailLoopObservationKeyFor = (
  binding: HelixCapabilityLaneGoalBinding,
): string | null =>
  binding.latest_mail_loop_summary?.mail_loop_observation_key ??
  compactKey([
    binding.latest_mail_loop_summary?.source_id,
    binding.latest_mail_loop_summary?.source_hash,
    binding.latest_mail_loop_summary?.projection_target,
    binding.latest_mail_loop_summary?.target_language,
    binding.latest_mail_loop_summary?.chunk_id,
    binding.latest_mail_loop_summary?.receipt_ref ??
      binding.latest_mail_loop_summary?.observation_ref,
  ]);

const buildReportDecision = (
  binding: HelixCapabilityLaneGoalBinding,
): HelixCapabilityLaneGoalReportDecision => {
  const terminalAuthorityStatus = readTerminalAuthorityStatus(binding);
  const evidenceRef = binding.lane_session_last_observation_ref ?? binding.last_report_ref ?? null;
  const mailLoopRef = readMailLoopRef(binding);
  const receiptRef = readReceiptRef(binding);

  let action: HelixCapabilityLaneGoalReportAction = "record_only";
  let reason = "goal_lane_evidence_recorded_for_debug_only";

  if (binding.status === "stopped") {
    action = "stopped";
    reason = "goal_binding_stopped";
  } else if (binding.attention_policy === "manual_review") {
    action = "manual_review";
    reason = "goal_binding_waiting_for_manual_review";
  } else if (
    binding.quiet_behavior === "wake_on_salience" ||
    binding.report_policy === "ask_on_salience"
  ) {
    action = "wake_on_salience";
    reason = "goal_binding_policy_requests_wake_on_salience";
  } else if (
    binding.attention_policy === "report_each_observation" &&
    binding.report_policy === "terminal_authorized_summary"
  ) {
    action = "request_terminal_authority";
    reason = "goal_binding_policy_requests_terminal_authorized_summary";
  } else if (binding.quiet_behavior === "surface_badge") {
    action = "surface_badge";
    reason = "goal_binding_policy_surfaces_badge_without_terminal_answer";
  }

  return {
    schema: HELIX_CAPABILITY_LANE_GOAL_REPORT_DECISION_SCHEMA,
    action,
    reason,
    summary_text: buildReportSummaryText({
      action,
      reason,
      evidenceRef,
      mailLoopRef,
      receiptRef,
      terminalAuthorityStatus,
    }),
    attention_policy: binding.attention_policy,
    report_policy: binding.report_policy,
    quiet_behavior: binding.quiet_behavior,
    quiet_behavior_applied: action === "record_only" || action === "surface_badge",
    wake_expected: action === "wake_on_salience",
    surface_badge_expected: action === "surface_badge",
    terminal_report_requested: action === "request_terminal_authority",
    terminal_report_authorized: Boolean(binding.last_report_ref),
    terminal_report_requires_authority: true,
    terminal_authority_status: terminalAuthorityStatus,
    evidence_ref: evidenceRef,
    mail_loop_ref: mailLoopRef,
    receipt_ref: receiptRef,
    reentry_required: true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const buildDispatchPlan = (
  binding: HelixCapabilityLaneGoalBinding,
  reportDecision: HelixCapabilityLaneGoalReportDecision,
  latestObservationEvent: HelixCapabilityLaneSessionEvent | null,
): HelixCapabilityLaneGoalDispatchPlan => {
  const target = (() => {
    if (reportDecision.action === "surface_badge") return "ui_badge";
    if (reportDecision.action === "wake_on_salience") return "ask_wake";
    if (reportDecision.action === "request_terminal_authority") {
      return "terminal_authority_review";
    }
    if (reportDecision.action === "manual_review") return "manual_review";
    return "none";
  })();
  const targetLanguage = readTargetLanguage(binding, latestObservationEvent);
  const sourceBindingKey = sourceBindingKeyFor(binding);
  const latestMailLoopObservationKey = latestMailLoopObservationKeyFor(binding);

  return {
    schema: HELIX_CAPABILITY_LANE_GOAL_DISPATCH_PLAN_SCHEMA,
    target,
    status: "planned_not_dispatched",
    reason: target === "none"
      ? "goal_binding_policy_records_without_dispatch"
      : `goal_binding_policy_plans_${target}`,
    source_report_action: reportDecision.action,
    goal_binding_id: binding.goal_binding_id,
    goal_id: binding.goal_id,
    lane_session_id: binding.lane_session_id,
    session_control_key: sessionControlKeyFor(binding),
    source_binding_key: sourceBindingKey,
    latest_mail_loop_observation_key: latestMailLoopObservationKey,
    lane_id: binding.lane_id,
    source_id: binding.lane_session_source_id,
    source_hash: binding.lane_session_source_hash,
    source_kind: binding.lane_session_source_kind,
    source_projection_target: binding.lane_session_projection_target,
    account_locale: binding.lane_session_account_locale,
    latest_event_id: binding.latest_lane_session_event?.event_id ?? null,
    session_event_count: binding.lane_session_debug_history.length,
    has_observation: Boolean(
      binding.lane_session_last_observation_ref ||
      latestObservationEvent?.observation_ref ||
      binding.latest_mail_loop_summary?.observation_ref,
    ),
    latest_chunk_id: latestObservationEvent?.chunk_id ?? null,
    latest_chunk_index: latestObservationEvent?.chunk_index ?? null,
    latest_source_id: latestObservationEvent?.source_id ?? null,
    latest_source_hash: latestObservationEvent?.source_hash ?? null,
    latest_source_kind: latestObservationEvent?.source_kind ?? null,
    latest_target_language: latestObservationEvent?.target_language ?? null,
    latest_dedupe_key: latestObservationEvent?.dedupe_key ?? null,
    latest_source_event_id: latestObservationEvent?.source_event_id ?? null,
    latest_source_event_ms: latestObservationEvent?.source_event_ms ?? null,
    latest_observed_at_ms: latestObservationEvent?.observed_at_ms ?? null,
    latest_freshness_status: latestObservationEvent?.freshness_status ?? null,
    source_text_hash:
      binding.latest_mail_loop_summary?.source_text_hash ??
      latestObservationEvent?.source_text_hash ??
      null,
    source_text_char_count:
      binding.latest_mail_loop_summary?.source_text_char_count ??
      latestObservationEvent?.source_text_char_count ??
      null,
    latest_projection_target: latestObservationEvent?.projection_target ?? null,
    target_language: targetLanguage,
    latest_cancel_requested: latestObservationEvent?.cancel_requested ?? null,
    latest_mail_loop_wake_kind: readMailLoopWakeKind(binding),
    permissions: binding.lane_session_permissions,
    evidence_ref: reportDecision.evidence_ref,
    mail_loop_ref: reportDecision.mail_loop_ref,
    receipt_ref: reportDecision.receipt_ref,
    requires_live_mail_loop: target === "ask_wake",
    requires_terminal_authority: target === "terminal_authority_review",
    side_effects_executed: false,
    wake_dispatched: false,
    badge_projected: false,
    terminal_report_emitted: false,
    terminal_authority_status: reportDecision.terminal_authority_status,
    reentry_required: true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const buildHelixCapabilityLaneGoalBindingDebugSummary = (
  binding: HelixCapabilityLaneGoalBinding,
): HelixCapabilityLaneGoalBindingDebugSummary => {
  const reportDecision = buildReportDecision(binding);
  const latestObservationEvent = readLatestObservationEvent(binding);
  const hasObservation = Boolean(
    binding.lane_session_last_observation_ref ||
    latestObservationEvent?.observation_ref ||
    binding.latest_mail_loop_summary?.observation_ref,
  );
  const dispatchPlan = buildDispatchPlan(binding, reportDecision, latestObservationEvent);
  const targetLanguage = readTargetLanguage(binding, latestObservationEvent);
  const lifecycleAction = binding.latest_lane_session_event?.action ?? null;
  return {
    schema: HELIX_CAPABILITY_LANE_GOAL_BINDING_DEBUG_SUMMARY_SCHEMA,
    goal_binding_id: binding.goal_binding_id,
    goal_binding_key: goalBindingKeyFor(binding),
    goal_id: binding.goal_id,
    lane_session_id: binding.lane_session_id,
    lane_id: binding.lane_id,
    selected_runtime_agent_provider: binding.selected_runtime_agent_provider,
    selected_backend_provider: binding.selected_backend_provider,
    backend_selection_decision: binding.backend_selection_decision,
    cost_class: binding.cost_class,
    latency_class: binding.latency_class,
    privacy_class: binding.privacy_class,
    fallback_backend_provider: binding.fallback_backend_provider,
    lifecycle_action: lifecycleAction,
    session_lifecycle_action: lifecycleAction,
    session_action: lifecycleAction,
    session_status: binding.lane_session_status,
    session_health: binding.lane_session_health,
    source_id: binding.lane_session_source_id,
    source_hash: binding.lane_session_source_hash,
    source_kind: binding.lane_session_source_kind,
    source_projection_target: binding.lane_session_projection_target,
    account_locale: binding.lane_session_account_locale,
    session_control_key: sessionControlKeyFor(binding),
    source_binding_key: sourceBindingKeyFor(binding),
    permissions: binding.lane_session_permissions,
    permission_profile: permissionProfileFor(binding),
    last_observation_ref: binding.lane_session_last_observation_ref,
    last_receipt_ref: binding.lane_session_last_receipt_ref,
    latest_event_id: binding.latest_lane_session_event?.event_id ?? null,
    session_event_count: binding.lane_session_debug_history.length,
    has_observation: hasObservation,
    latest_chunk_id: latestObservationEvent?.chunk_id ?? null,
    latest_chunk_index: latestObservationEvent?.chunk_index ?? null,
    latest_source_id: latestObservationEvent?.source_id ?? null,
    latest_source_hash: latestObservationEvent?.source_hash ?? null,
    latest_source_kind: latestObservationEvent?.source_kind ?? null,
    latest_target_language: latestObservationEvent?.target_language ?? null,
    latest_dedupe_key: latestObservationEvent?.dedupe_key ?? null,
    latest_source_event_id: latestObservationEvent?.source_event_id ?? null,
    latest_source_event_ms: latestObservationEvent?.source_event_ms ?? null,
    latest_observed_at_ms: latestObservationEvent?.observed_at_ms ?? null,
    latest_freshness_status: latestObservationEvent?.freshness_status ?? null,
    source_text_hash:
      binding.latest_mail_loop_summary?.source_text_hash ??
      latestObservationEvent?.source_text_hash ??
      null,
    source_text_char_count:
      binding.latest_mail_loop_summary?.source_text_char_count ??
      latestObservationEvent?.source_text_char_count ??
      null,
    latest_projection_target: latestObservationEvent?.projection_target ?? null,
    target_language: targetLanguage,
    latest_cancel_requested: latestObservationEvent?.cancel_requested ?? null,
    latest_mail_loop_wake_kind: readMailLoopWakeKind(binding),
    latest_observation_key: latestObservationKeyFor(latestObservationEvent),
    latest_session_event: binding.latest_lane_session_event,
    latest_mail_loop_summary: binding.latest_mail_loop_summary,
    latest_mail_loop_observation_lane_session_id:
      binding.latest_mail_loop_summary?.observation_lane_session_id ?? null,
    latest_mail_loop_observation_key: latestMailLoopObservationKeyFor(binding),
    mail_loop_refs: binding.lane_session_mail_loop_refs,
    report_decision: reportDecision,
    report_summary_text: reportDecision.summary_text,
    dispatch_plan: dispatchPlan,
    dispatch_admission: buildHelixCapabilityLaneGoalDispatchAdmission(dispatchPlan),
    latest_goal_binding_event: binding.debug_history.at(-1) ?? null,
    activation_policy: binding.activation_policy,
    attention_policy: binding.attention_policy,
    stop_condition: binding.stop_condition,
    report_policy: binding.report_policy,
    quiet_behavior: binding.quiet_behavior,
    binding_status: binding.status,
    last_report_ref: binding.last_report_ref,
    backend_provider_becomes_root_agent: false,
    final_reports_require_terminal_authority: true,
    terminal_authority_status: readTerminalAuthorityStatus(binding),
    reentry_required: true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const buildHelixCapabilityLaneGoalBindingDebugSummaries = (
  bindings: HelixCapabilityLaneGoalBinding[],
): HelixCapabilityLaneGoalBindingDebugSummary[] =>
  bindings.map(buildHelixCapabilityLaneGoalBindingDebugSummary);
