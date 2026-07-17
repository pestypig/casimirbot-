import type { HelixAgentPermissionProfile, HelixAgentRuntimeId } from "./helix-agent-runtime";

export type HelixRuntimeGoalSessionStatus =
  | "starting"
  | "running"
  | "waiting"
  | "blocked"
  | "completed"
  | "cancelled"
  | "failed";

export type HelixRuntimeGoalWakeEventKind =
  | "user_message"
  | "visible_context_changed"
  | "visible_source_changed"
  | "visible_surface_changed"
  | "document_changed"
  | "account_language_changed"
  | "lane_session_observation"
  | "tool_receipt_ready"
  | "timer"
  | "manual_resume"
  | "failure"
  | "escalation";

export type HelixRuntimeGoalWakeCandidateEventKind =
  | "manual_resume"
  | "visible_source_changed"
  | "visible_surface_changed"
  | "timer"
  | "lane_session_observation"
  | "live_source_packet";

export type HelixRuntimeGoalWakeCandidate = {
  schema: "helix.runtime_goal.wake_candidate.v1";
  wake_candidate_id: string;
  goal_id: string | null;
  source_kind: string;
  source_id: string | null;
  source_label: string | null;
  doc_path: string | null;
  active_panel_id: string | null;
  reason: string;
  event_kind: HelixRuntimeGoalWakeCandidateEventKind;
  observed_at_ms: number;
  dedupe_key: string;
  freshness_status: "fresh" | "stale" | "unknown";
  source_freshness_ms: number | null;
  source_hash: string | null;
  proposed_tool: string | null;
  requires_user_visible_turn: boolean;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRuntimeGoalWakeAdmissionStatus =
  | "admitted"
  | "rejected";

export type HelixRuntimeGoalWakeAdmissionReason =
  | "manual_wake_admitted"
  | "visible_source_changed"
  | "visible_surface_changed"
  | "timer_wake_admitted"
  | "goal_session_not_found"
  | "goal_not_resumable"
  | "wake_policy_denied"
  | "duplicate_wake_candidate"
  | "candidate_missing_source";

export type HelixRuntimeGoalWakeAdmissionResult = {
  schema: "helix.runtime_goal.wake_admission.v1";
  status: HelixRuntimeGoalWakeAdmissionStatus;
  reason: HelixRuntimeGoalWakeAdmissionReason;
  goal_id: string | null;
  wake_candidate_id: string;
  dedupe_key: string;
  source_binding: HelixRuntimeGoalSourceBinding | null;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRuntimeGoalWakePolicy = {
  manual_resume: boolean;
  visible_context_changed: boolean;
  document_changed: boolean;
  account_language_changed: boolean;
  lane_session_observation: boolean;
  tool_receipt_ready: boolean;
  timer_ms: number | null;
};

export type HelixRuntimeGoalStopPolicy = {
  user_cancel: boolean;
  goal_completed: boolean;
  permission_revoked: boolean;
  lane_unavailable: boolean;
  repeated_failure_threshold: number;
  stale_source_ms: number | null;
  runtime_provider_unavailable: boolean;
};

export type HelixRuntimeGoalReportPolicy =
  | "report_only_failure"
  | "report_only_when_asked"
  | "report_summary_every_n_wakes"
  | "report_every_terminal_authorized_result";

export type HelixRuntimeGoalQuietPolicy = {
  quiet: boolean;
  report_policy: HelixRuntimeGoalReportPolicy;
  summary_every_n_wakes: number | null;
};

export type HelixRuntimeGoalTerminalAuthorityStatus =
  | "not_evaluated"
  | "pending_helix_terminal_authority"
  | "authorized"
  | "blocked"
  | "not_terminal_authority";

export type HelixRuntimeGoalSourceBinding = {
  schema: "helix.runtime_goal.source_binding.v1";
  source_kind: string;
  active_panel_id: string | null;
  doc_path: string | null;
  source_id: string | null;
  source_hash: string | null;
  source_freshness_ms: number | null;
  source_label: string | null;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRuntimeGoalJobBrief = {
  schema: "helix.runtime_goal.job_brief.v1";
  goal_id: string;
  thread_id: string;
  user_goal_text: string;
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  created_at: string;
  source_binding: HelixRuntimeGoalSourceBinding | null;
  expected_wake_behavior: string;
  allowed_capability_lanes: string[];
  allowed_workstation_tools: string[];
  stop_condition: string | null;
  report_policy: HelixRuntimeGoalReportPolicy;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRuntimeGoalWakePlan = {
  schema: "helix.runtime_goal.wake_plan.v1";
  goal_id: string;
  wake_event_id: string | null;
  turn_id: string | null;
  job_brief_ref: string;
  current_source_binding: HelixRuntimeGoalSourceBinding | null;
  requested_observation_or_lane: string | null;
  relevance_reason: string;
  expected_terminal_product: "job_progress_report";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRuntimeGoalProgressSummary = {
  schema: "helix.runtime_goal.progress_summary.v1";
  goal_id: string;
  wake_event_id: string | null;
  turn_id: string | null;
  job: string;
  runtime_agent_provider: HelixAgentRuntimeId;
  observed_source: HelixRuntimeGoalSourceBinding | null;
  evidence_used: {
    requested_tool_or_lane: string | null;
    observation_refs: string[];
    receipt_refs: string[];
    provider_terminal_candidate_ref: string | null;
  };
  current_summary: string;
  next_wake_behavior: string;
  terminal_authority_status: HelixRuntimeGoalTerminalAuthorityStatus;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRuntimeGoalStagePlayProjection = {
  schema: "helix.runtime_goal.stage_play_projection.v1";
  status: "projected" | "failed";
  goal_id: string;
  thread_id: string;
  runtime_session_id: string;
  stage_play_goal_session_ref: string | null;
  context_update_ref: string | null;
  projected_evidence_refs: string[];
  failure_code: string | null;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRuntimeGoalWakeEvent = {
  schema: "helix.runtime_goal.wake_event.v1";
  wake_event_id: string;
  goal_id: string;
  kind: HelixRuntimeGoalWakeEventKind;
  created_at: string;
  turn_id: string | null;
  observation_refs: string[];
  receipt_refs: string[];
  payload_ref: string | null;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRuntimeGoalDebugEvent = {
  schema: "helix.runtime_goal.debug_event.v1";
  event_id: string;
  seq: number;
  goal_id: string;
  runtime_agent_provider: HelixAgentRuntimeId;
  runtime_session_id: string;
  wake_event_id: string | null;
  stage:
    | "goal_started"
    | "wake_received"
    | "runtime_resumed"
    | "runtime_candidate_generated"
    | "tool_or_lane_requested"
    | "tool_or_lane_admitted"
    | "tool_or_lane_rejected"
    | "observation_recorded"
    | "evidence_reentered"
    | "terminal_authority_evaluated"
    | "quiet_policy_applied"
    | "goal_failure_recorded"
    | "goal_stopped"
    | "goal_blocked";
  status: "completed" | "pending" | "blocked" | "failed";
  requested_tool_or_lane: string | null;
  admitted: boolean | null;
  backend_selected: string | null;
  observation_refs: string[];
  receipt_refs: string[];
  reentry_status: "not_requested" | "pending_provider_reentry" | "reentered" | "blocked";
  terminal_authority_status: HelixRuntimeGoalTerminalAuthorityStatus;
  quiet_report_decision: "quiet" | "report" | "report_failure" | "not_evaluated";
  provider_terminal_candidate_ref?: string | null;
  reason: string | null;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRuntimeGoalSession = {
  schema: "helix.runtime_goal.session.v1";
  goal_id: string;
  thread_id: string;
  objective: string;
  runtime_agent_provider: HelixAgentRuntimeId;
  runtime_session_id: string;
  status: HelixRuntimeGoalSessionStatus;
  status_reason: string | null;
  permission_profile: HelixAgentPermissionProfile;
  allowed_lanes: string[];
  allowed_workstation_tools: string[];
  wake_policy: HelixRuntimeGoalWakePolicy;
  stop_policy: HelixRuntimeGoalStopPolicy;
  report_policy: HelixRuntimeGoalReportPolicy;
  quiet_policy: HelixRuntimeGoalQuietPolicy;
  job_brief: HelixRuntimeGoalJobBrief;
  latest_wake_plan: HelixRuntimeGoalWakePlan | null;
  latest_progress_summary: HelixRuntimeGoalProgressSummary | null;
  latest_source_binding: HelixRuntimeGoalSourceBinding | null;
  latest_turn_id: string | null;
  latest_observation_refs: string[];
  latest_receipt_refs: string[];
  latest_provider_terminal_candidate_ref: string | null;
  latest_final_answer_source: string | null;
  terminal_authority_status: HelixRuntimeGoalTerminalAuthorityStatus;
  failure_count: number;
  last_failure_reason: string | null;
  wake_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRuntimeGoalDebugExport = {
  schema: "helix.runtime_goal.debug_export.v1";
  goal_id: string;
  runtime_provider: HelixAgentRuntimeId;
  runtime_session_id: string;
  session_status: HelixRuntimeGoalSessionStatus;
  wake_events: HelixRuntimeGoalWakeEvent[];
  debug_events: HelixRuntimeGoalDebugEvent[];
  runtime_goal_job_brief: HelixRuntimeGoalJobBrief;
  runtime_goal_wake_plan: HelixRuntimeGoalWakePlan | null;
  runtime_goal_progress_summary: HelixRuntimeGoalProgressSummary | null;
  runtime_goal_source_binding: HelixRuntimeGoalSourceBinding | null;
  runtime_goal_observation_refs: string[];
  runtime_goal_stage_play_projection: HelixRuntimeGoalStagePlayProjection | null;
  runtime_goal_terminal_authority_status: HelixRuntimeGoalTerminalAuthorityStatus;
  latest_observation_refs: string[];
  latest_receipt_refs: string[];
  provider_terminal_candidate: Record<string, unknown> | null;
  provider_reasoning_reentry: Record<string, unknown> | null;
  provider_terminal_authority_bridge: Record<string, unknown> | null;
  terminal_answer_authority: Record<string, unknown> | null;
  terminal_presentation: Record<string, unknown> | null;
  terminal_authority_status: HelixRuntimeGoalTerminalAuthorityStatus;
  quiet_report_decision: "quiet" | "report" | "report_failure" | "not_evaluated";
  latest_wake_candidate?: HelixRuntimeGoalWakeCandidate | null;
  latest_wake_admission?: HelixRuntimeGoalWakeAdmissionResult | null;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export const defaultHelixRuntimeGoalWakePolicy = (): HelixRuntimeGoalWakePolicy => ({
  manual_resume: true,
  visible_context_changed: true,
  document_changed: true,
  account_language_changed: false,
  lane_session_observation: false,
  tool_receipt_ready: false,
  timer_ms: null,
});

export const defaultHelixRuntimeGoalStopPolicy = (): HelixRuntimeGoalStopPolicy => ({
  user_cancel: true,
  goal_completed: true,
  permission_revoked: true,
  lane_unavailable: true,
  repeated_failure_threshold: 3,
  stale_source_ms: null,
  runtime_provider_unavailable: true,
});

export const defaultHelixRuntimeGoalQuietPolicy = (
  reportPolicy: HelixRuntimeGoalReportPolicy = "report_only_failure",
): HelixRuntimeGoalQuietPolicy => ({
  quiet: reportPolicy !== "report_every_terminal_authorized_result",
  report_policy: reportPolicy,
  summary_every_n_wakes: reportPolicy === "report_summary_every_n_wakes" ? 5 : null,
});
