import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneCostClass,
  HelixCapabilityLaneId,
  HelixCapabilityLaneLatencyClass,
  HelixCapabilityLanePrivacyClass,
} from "./helix-capability-lane";
import type {
  HelixCapabilityLaneSessionEvent,
  HelixCapabilityLaneSessionHealth,
  HelixCapabilityLaneSessionStatus,
} from "./helix-capability-lane-session";
import type { HelixAgentRuntimeId } from "./helix-agent-runtime";
import type { HelixCapabilityLaneMailLoopDebugSummary } from "./helix-capability-lane-mail-loop";

export const HELIX_CAPABILITY_LANE_GOAL_BINDING_SCHEMA =
  "helix.capability_lane.goal_binding.v1" as const;
export const HELIX_CAPABILITY_LANE_GOAL_BINDING_EVENT_SCHEMA =
  "helix.capability_lane.goal_binding_event.v1" as const;
export const HELIX_CAPABILITY_LANE_GOAL_BINDING_DEBUG_SUMMARY_SCHEMA =
  "helix.capability_lane.goal_binding_debug_summary.v1" as const;
export const HELIX_CAPABILITY_LANE_GOAL_REPORT_DECISION_SCHEMA =
  "helix.capability_lane.goal_report_decision.v1" as const;
export const HELIX_CAPABILITY_LANE_GOAL_DISPATCH_PLAN_SCHEMA =
  "helix.capability_lane.goal_dispatch_plan.v1" as const;
export const HELIX_CAPABILITY_LANE_GOAL_DISPATCH_ADMISSION_SCHEMA =
  "helix.capability_lane.goal_dispatch_admission.v1" as const;
export const HELIX_CAPABILITY_LANE_GOAL_DISPATCH_READINESS_SCHEMA =
  "helix.capability_lane.goal_dispatch_readiness.v1" as const;

export type HelixCapabilityLaneGoalActivationPolicy =
  | "manual"
  | "while_goal_active"
  | "on_source_event";

export type HelixCapabilityLaneGoalAttentionPolicy =
  | "quiet_until_salient"
  | "report_each_observation"
  | "manual_review";

export type HelixCapabilityLaneGoalStopCondition =
  | "manual_stop"
  | "goal_complete"
  | "source_stopped"
  | "session_stopped";

export type HelixCapabilityLaneGoalReportPolicy =
  | "debug_only"
  | "terminal_authorized_summary"
  | "ask_on_salience";

export type HelixCapabilityLaneGoalQuietBehavior =
  | "record_only"
  | "surface_badge"
  | "wake_on_salience";

export type HelixCapabilityLaneGoalReportAction =
  | "record_only"
  | "surface_badge"
  | "wake_on_salience"
  | "request_terminal_authority"
  | "manual_review"
  | "stopped";

export type HelixCapabilityLaneGoalReportDecision = {
  schema: typeof HELIX_CAPABILITY_LANE_GOAL_REPORT_DECISION_SCHEMA;
  action: HelixCapabilityLaneGoalReportAction;
  reason: string;
  wake_expected: boolean;
  surface_badge_expected: boolean;
  terminal_report_requested: boolean;
  terminal_report_authorized: boolean;
  terminal_report_requires_authority: true;
  terminal_authority_status: "not_terminal_authority" | "pending_helix_terminal_authority";
  evidence_ref: string | null;
  mail_loop_ref: string | null;
  receipt_ref: string | null;
  reentry_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneGoalDispatchTarget =
  | "none"
  | "ui_badge"
  | "ask_wake"
  | "terminal_authority_review"
  | "manual_review";

export type HelixCapabilityLaneGoalDispatchPlan = {
  schema: typeof HELIX_CAPABILITY_LANE_GOAL_DISPATCH_PLAN_SCHEMA;
  target: HelixCapabilityLaneGoalDispatchTarget;
  status: "planned_not_dispatched";
  reason: string;
  source_report_action: HelixCapabilityLaneGoalReportAction;
  goal_binding_id: string;
  goal_id: string;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  evidence_ref: string | null;
  mail_loop_ref: string | null;
  receipt_ref: string | null;
  requires_live_mail_loop: boolean;
  requires_terminal_authority: boolean;
  side_effects_executed: false;
  wake_dispatched: false;
  badge_projected: false;
  terminal_report_emitted: false;
  terminal_authority_status: "not_terminal_authority" | "pending_helix_terminal_authority";
  reentry_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneGoalDispatchAdmissionStatus =
  | "admitted_debug_only"
  | "admitted_projection_only"
  | "eligible_waiting_for_mail_loop"
  | "eligible_pending_terminal_authority"
  | "eligible_manual_review"
  | "blocked";

export type HelixCapabilityLaneGoalDispatchAdmission = {
  schema: typeof HELIX_CAPABILITY_LANE_GOAL_DISPATCH_ADMISSION_SCHEMA;
  status: HelixCapabilityLaneGoalDispatchAdmissionStatus;
  reason: string;
  target: HelixCapabilityLaneGoalDispatchTarget;
  goal_binding_id: string;
  goal_id: string;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  evidence_ref: string | null;
  mail_loop_ref: string | null;
  receipt_ref: string | null;
  blocked_reason: string | null;
  requires_live_mail_loop: boolean;
  requires_terminal_authority: boolean;
  side_effects_allowed: false;
  side_effects_executed: false;
  wake_dispatch_allowed: false;
  badge_projection_allowed: false;
  terminal_report_allowed: false;
  terminal_authority_status: "not_terminal_authority" | "pending_helix_terminal_authority";
  reentry_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneGoalDispatchReadiness = {
  schema: typeof HELIX_CAPABILITY_LANE_GOAL_DISPATCH_READINESS_SCHEMA;
  total_plans: number;
  total_admissions: number;
  admitted_count: number;
  blocked_count: number;
  pending_wake_count: number;
  pending_terminal_authority_count: number;
  projection_only_count: number;
  manual_review_count: number;
  debug_only_count: number;
  blocked_reasons: string[];
  next_lane_ids: HelixCapabilityLaneId[];
  next_lane_session_ids: string[];
  next_dispatch_targets: HelixCapabilityLaneGoalDispatchTarget[];
  next_goal_binding_ids: string[];
  next_evidence_refs: string[];
  next_receipt_refs: string[];
  side_effects_allowed: false;
  side_effects_executed: false;
  wake_dispatch_allowed: false;
  badge_projection_allowed: false;
  terminal_report_allowed: false;
  terminal_report_emitted: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneGoalBindingEvent = {
  schema: typeof HELIX_CAPABILITY_LANE_GOAL_BINDING_EVENT_SCHEMA;
  event_id: string;
  goal_binding_id: string;
  goal_id: string;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  event:
    | "bound"
    | "attention_updated"
    | "mail_loop_recorded"
    | "report_requested"
    | "stopped";
  at_ms: number;
  reason: string;
  lane_session_status: HelixCapabilityLaneSessionStatus;
  lane_session_health: HelixCapabilityLaneSessionHealth;
  lane_session_observation_ref: string | null;
  mail_loop_ref?: string | null;
  receipt_ref: string | null;
  terminal_authority_status: "not_terminal_authority" | "pending_helix_terminal_authority";
  reentry_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneGoalBinding = {
  schema: typeof HELIX_CAPABILITY_LANE_GOAL_BINDING_SCHEMA;
  goal_binding_id: string;
  goal_id: string;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  selected_backend_provider: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  cost_class: HelixCapabilityLaneCostClass | "unknown" | null;
  latency_class: HelixCapabilityLaneLatencyClass | "unknown" | null;
  privacy_class: HelixCapabilityLanePrivacyClass | "unknown" | null;
  fallback_backend_provider: string | null;
  lane_session_status: HelixCapabilityLaneSessionStatus;
  lane_session_health: HelixCapabilityLaneSessionHealth;
  lane_session_source_id: string | null;
  lane_session_last_observation_ref: string | null;
  lane_session_last_receipt_ref: string | null;
  latest_lane_session_event: HelixCapabilityLaneSessionEvent | null;
  lane_session_debug_history: HelixCapabilityLaneSessionEvent[];
  latest_mail_loop_summary: HelixCapabilityLaneMailLoopDebugSummary | null;
  lane_session_mail_loop_refs: string[];
  activation_policy: HelixCapabilityLaneGoalActivationPolicy;
  attention_policy: HelixCapabilityLaneGoalAttentionPolicy;
  stop_condition: HelixCapabilityLaneGoalStopCondition;
  report_policy: HelixCapabilityLaneGoalReportPolicy;
  quiet_behavior: HelixCapabilityLaneGoalQuietBehavior;
  status: "bound" | "stopped";
  last_report_ref: string | null;
  debug_history: HelixCapabilityLaneGoalBindingEvent[];
  backend_provider_becomes_root_agent: false;
  final_reports_require_terminal_authority: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneGoalBindingDebugSummary = {
  schema: typeof HELIX_CAPABILITY_LANE_GOAL_BINDING_DEBUG_SUMMARY_SCHEMA;
  goal_binding_id: string;
  goal_id: string;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  selected_backend_provider: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  cost_class: HelixCapabilityLaneCostClass | "unknown" | null;
  latency_class: HelixCapabilityLaneLatencyClass | "unknown" | null;
  privacy_class: HelixCapabilityLanePrivacyClass | "unknown" | null;
  fallback_backend_provider: string | null;
  session_status: HelixCapabilityLaneSessionStatus;
  session_health: HelixCapabilityLaneSessionHealth;
  source_id: string | null;
  last_observation_ref: string | null;
  last_receipt_ref: string | null;
  latest_session_event: HelixCapabilityLaneSessionEvent | null;
  latest_mail_loop_summary: HelixCapabilityLaneMailLoopDebugSummary | null;
  mail_loop_refs: string[];
  report_decision: HelixCapabilityLaneGoalReportDecision;
  dispatch_plan: HelixCapabilityLaneGoalDispatchPlan;
  dispatch_admission: HelixCapabilityLaneGoalDispatchAdmission;
  latest_goal_binding_event: HelixCapabilityLaneGoalBindingEvent | null;
  activation_policy: HelixCapabilityLaneGoalActivationPolicy;
  attention_policy: HelixCapabilityLaneGoalAttentionPolicy;
  stop_condition: HelixCapabilityLaneGoalStopCondition;
  report_policy: HelixCapabilityLaneGoalReportPolicy;
  quiet_behavior: HelixCapabilityLaneGoalQuietBehavior;
  binding_status: "bound" | "stopped";
  last_report_ref: string | null;
  backend_provider_becomes_root_agent: false;
  final_reports_require_terminal_authority: true;
  terminal_authority_status: "not_terminal_authority" | "pending_helix_terminal_authority";
  reentry_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneGoalBindingResult = {
  ok: boolean;
  goal_binding: HelixCapabilityLaneGoalBinding | null;
  blocked_reason: string | null;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
