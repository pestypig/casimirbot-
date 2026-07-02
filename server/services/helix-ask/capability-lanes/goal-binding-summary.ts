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
import { buildHelixCapabilityLaneGoalDispatchAdmission } from "./goal-dispatch-admission";

const readTerminalAuthorityStatus = (
  binding: HelixCapabilityLaneGoalBinding,
): HelixCapabilityLaneGoalBindingDebugSummary["terminal_authority_status"] =>
  binding.debug_history.at(-1)?.terminal_authority_status ??
  binding.latest_lane_session_event?.terminal_authority_status ??
  "not_terminal_authority";

const readMailLoopRef = (binding: HelixCapabilityLaneGoalBinding): string | null =>
  binding.latest_mail_loop_summary?.stage_play_mail_id ||
  binding.latest_mail_loop_summary?.observation_ref ||
  binding.lane_session_mail_loop_refs.at(-1) ||
  null;

const readReceiptRef = (binding: HelixCapabilityLaneGoalBinding): string | null =>
  binding.latest_mail_loop_summary?.receipt_ref ??
  binding.lane_session_last_receipt_ref ??
  null;

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
    lane_id: binding.lane_id,
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
  const dispatchPlan = buildDispatchPlan(binding, reportDecision);
  return {
    schema: HELIX_CAPABILITY_LANE_GOAL_BINDING_DEBUG_SUMMARY_SCHEMA,
    goal_binding_id: binding.goal_binding_id,
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
    session_status: binding.lane_session_status,
    session_health: binding.lane_session_health,
    source_id: binding.lane_session_source_id,
    last_observation_ref: binding.lane_session_last_observation_ref,
    last_receipt_ref: binding.lane_session_last_receipt_ref,
    latest_session_event: binding.latest_lane_session_event,
    latest_mail_loop_summary: binding.latest_mail_loop_summary,
    mail_loop_refs: binding.lane_session_mail_loop_refs,
    report_decision: reportDecision,
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
