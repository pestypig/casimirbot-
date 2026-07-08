import type { HelixAgentRuntimeId } from "./helix-agent-runtime";

export const HELIX_CAPABILITY_LANE_IDS = [
  "utility_text",
  "interactive_text",
  "deliberate_text",
  "code_text",
  "speech_to_text",
  "text_to_speech",
  "live_translation",
  "realtime_session",
  "visual_analysis",
  "workstation_tool_reference",
] as const;

export type HelixCapabilityLaneId = (typeof HELIX_CAPABILITY_LANE_IDS)[number];

export type HelixCapabilityLaneFamily =
  | "text_inference"
  | "code_inference"
  | "speech_to_text"
  | "text_to_speech"
  | "live_translation"
  | "live_runtime_agent"
  | "visual_analysis"
  | "workstation_tool_reference";

export type HelixCapabilityLaneStatus =
  | "available"
  | "unconfigured"
  | "permission_blocked"
  | "dry_run"
  | "disabled";

export type HelixCapabilityLaneBackendAvailabilityStatus =
  | "available"
  | "unconfigured"
  | "permission_blocked"
  | "dry_run"
  | "disabled";

export type HelixCapabilityLaneBackendPermissionStatus =
  | "admitted"
  | "permission_blocked"
  | "configuration_missing"
  | "policy_disabled";

export type HelixCapabilityLaneBackendConfigurationStatus =
  | "not_required"
  | "configured"
  | "missing"
  | "disabled";

export type HelixCapabilityLaneCostClass = "free_local" | "low" | "standard" | "premium" | "unknown";

export type HelixCapabilityLaneLatencyClass = "local" | "interactive" | "realtime" | "batch" | "unknown";

export type HelixCapabilityLanePrivacyClass =
  | "local_only"
  | "account_provider"
  | "external_provider"
  | "unknown";

export type HelixCapabilityLaneBackendFamily =
  | "openai_compatible"
  | "openai_realtime"
  | "google_gemini"
  | "elevenlabs"
  | "local_runtime"
  | "helix_workstation_gateway"
  | "none";

export type HelixCapabilityLaneBackendProviderDescriptor = {
  schema: "helix.capability_lane.backend_provider.v1";
  provider_id: string;
  backend_family: HelixCapabilityLaneBackendFamily;
  label: string;
  model_or_service_ref: string | null;
  configuration_status: HelixCapabilityLaneBackendConfigurationStatus;
  required_env_vars: string[];
  configured_env_vars: string[];
  availability_status: HelixCapabilityLaneBackendAvailabilityStatus;
  permission_status: HelixCapabilityLaneBackendPermissionStatus;
  cost_class: HelixCapabilityLaneCostClass;
  latency_class: HelixCapabilityLaneLatencyClass;
  privacy_class: HelixCapabilityLanePrivacyClass;
  fallback_backend_provider: string | null;
  raw_secret_exposed: false;
};

export type HelixCapabilityLaneBackendSelectionPolicy = {
  schema: "helix.capability_lane.backend_selection_policy.v1";
  owner: "helix";
  runtime_provider_may_request_preference: true;
  selected_runtime_provider_remains_root: true;
  dynamic_switching_enabled: false;
  selection_inputs: Array<
    | "configured_keys"
    | "runtime_permission"
    | "goal_permission"
    | "account_preference"
    | "account_locale"
    | "cost_class"
    | "latency_class"
    | "privacy_class"
    | "quality_requirement"
    | "fallback_availability"
    | "terminal_policy"
  >;
};

export type HelixCapabilityLaneBackendSelectionOutcome =
  | "blocked"
  | "default_selected"
  | "requested_selected"
  | "fallback_selected"
  | "requested_recorded_default_selected";

export type HelixCapabilityLaneBackendSelectionDecision = {
  schema: "helix.capability_lane.backend_selection_decision.v1";
  owner: "helix";
  outcome: HelixCapabilityLaneBackendSelectionOutcome;
  reason: string;
  requested_backend_provider: string | null;
  requested_backend_provider_known: boolean;
  selected_backend_provider: string | null;
  fallback_backend_provider: string | null;
  selected_runtime_provider_remains_root: true;
  backend_provider_becomes_root_agent: false;
  dynamic_switching_executed: false;
  live_backend_execution_enabled: boolean;
  terminal_authority_owner: "helix";
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneOneShotCallContract = {
  schema: "helix.capability_lane.one_shot_call_contract.v1";
  supported: boolean;
  request_schema_ref: string;
  response_schema_ref: string;
  output_role: "observation_or_receipt";
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
};

export type HelixCapabilityLaneSessionContract = {
  schema: "helix.capability_lane.session_contract.v1";
  supported: boolean;
  lifecycle: Array<"start" | "stop" | "pause" | "resume">;
  requires_source_binding: boolean;
  emits_observations: true;
  terminal_eligible: false;
};

export type HelixCapabilityLaneGoalBindingContract = {
  schema: "helix.capability_lane.goal_binding_contract.v1";
  supported: boolean;
  binding_fields: Array<
    | "goal_id"
    | "lane_session_id"
    | "activation_policy"
    | "attention_policy"
    | "stop_condition"
    | "report_policy"
    | "quiet_behavior"
  >;
  backend_provider_becomes_root_agent: false;
  final_reports_require_terminal_authority: true;
};

export type HelixCapabilityLaneObservationContract = {
  schema: "helix.capability_lane.observation_contract.v1";
  observation_schema_ref: string;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  reentry_required: true;
};

export type HelixCapabilityLaneReceiptContract = {
  schema: "helix.capability_lane.receipt_contract.v1";
  receipt_schema_ref: string;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  reentry_required: true;
};

export type HelixCapabilityLaneTerminalPolicy = {
  schema: "helix.capability_lane.terminal_policy.v1";
  lane_output_can_be_final_answer: false;
  terminal_authority_owner: "helix";
  requires_evidence_reentry: true;
  preserves_runtime_provider_root: true;
};

export type HelixCapabilityLaneCapabilityDescriptor = {
  schema: "helix.capability_lane.capability_descriptor.v1";
  capability_id: string;
  label: string;
  lane_id: HelixCapabilityLaneId;
  one_shot_status: "executable" | "shadow_only" | "not_supported";
  session_status: "supported" | "not_supported";
  backend_provider_required: boolean;
  model_visible_hint: HelixCapabilityLaneModelVisibleHint;
  result_authority: "observation_or_receipt_only";
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneModelVisibleHint = {
  required_input_fields: string[];
  optional_input_fields: string[];
  when_to_use: string;
  when_not_to_use?: string;
  request_shape_hint: Record<string, unknown>;
};

export type HelixCapabilityLaneDescriptor = {
  schema: "helix.capability_lane.descriptor.v1";
  lane_id: HelixCapabilityLaneId;
  family: HelixCapabilityLaneFamily;
  label: string;
  description: string;
  status: HelixCapabilityLaneStatus;
  status_reason: string;
  shadow_only: true;
  backend_family: HelixCapabilityLaneBackendFamily;
  model_or_service_ref: string | null;
  backend_providers: HelixCapabilityLaneBackendProviderDescriptor[];
  default_backend_provider: string | null;
  backend_selection_policy: HelixCapabilityLaneBackendSelectionPolicy;
  one_shot_call_contract: HelixCapabilityLaneOneShotCallContract;
  session_contract: HelixCapabilityLaneSessionContract;
  goal_binding_contract: HelixCapabilityLaneGoalBindingContract;
  observation_contract: HelixCapabilityLaneObservationContract;
  receipt_contract: HelixCapabilityLaneReceiptContract;
  terminal_policy: HelixCapabilityLaneTerminalPolicy;
  capabilities: HelixCapabilityLaneCapabilityDescriptor[];
  requestable_by_runtime_provider: boolean;
  result_authority: "observation_or_receipt_only";
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
  safety_tags: string[];
};

export type HelixCapabilityLaneManifest = {
  schema: "helix.capability_lane_manifest.v1";
  manifest_version: "2026-06-30.shadow.v1";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  policy_mode: "shadow";
  lanes: HelixCapabilityLaneDescriptor[];
  lane_ids: HelixCapabilityLaneId[];
  backend_selection_policy: HelixCapabilityLaneBackendSelectionPolicy;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneResolveTrace = {
  schema: "helix.capability_lane_resolve_trace.v1";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  requested_lane: HelixCapabilityLaneId | string | null;
  admission_status: "admitted_shadow_only" | "blocked";
  lane_status: HelixCapabilityLaneStatus | "unknown";
  requested_backend_provider: string | null;
  requested_backend_provider_known: boolean;
  requested_backend_configuration_status: HelixCapabilityLaneBackendConfigurationStatus | "unknown" | null;
  requested_backend_availability_status: HelixCapabilityLaneBackendAvailabilityStatus | "unknown" | null;
  requested_backend_permission_status: HelixCapabilityLaneBackendPermissionStatus | "unknown" | null;
  requested_backend_cost_class: HelixCapabilityLaneCostClass | "unknown" | null;
  requested_backend_latency_class: HelixCapabilityLaneLatencyClass | "unknown" | null;
  requested_backend_privacy_class: HelixCapabilityLanePrivacyClass | "unknown" | null;
  requested_backend_fallback_provider: string | null;
  selected_backend_provider: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  selection_reason: string;
  availability_status: HelixCapabilityLaneBackendAvailabilityStatus | "unknown";
  permission_status: HelixCapabilityLaneBackendPermissionStatus | "unknown";
  cost_class: HelixCapabilityLaneCostClass;
  latency_class: HelixCapabilityLaneLatencyClass;
  privacy_class: HelixCapabilityLanePrivacyClass;
  fallback_backend_provider: string | null;
  resolved_backend_provider: HelixCapabilityLaneBackendFamily | null;
  resolved_model_or_service: string | null;
  result_ref: string | null;
  observation_ref: string | null;
  receipt_ref: string | null;
  terminal_policy: HelixCapabilityLaneTerminalPolicy;
  reentry_required: true;
  execution_status: "not_executed_shadow_only" | "executed_observation_only";
  blocked_reason: string | null;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneBackendSelectionSummary = {
  schema: "helix.capability_lane.backend_selection_summary.v1";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  lane_id: HelixCapabilityLaneId | string;
  capability: string;
  requested_lane: HelixCapabilityLaneId | string | null;
  requested_backend_provider: string | null;
  requested_backend_provider_known: boolean;
  requested_backend_configuration_status: HelixCapabilityLaneBackendConfigurationStatus | "unknown" | null;
  requested_backend_availability_status: HelixCapabilityLaneBackendAvailabilityStatus | "unknown" | null;
  requested_backend_permission_status: HelixCapabilityLaneBackendPermissionStatus | "unknown" | null;
  requested_backend_cost_class: HelixCapabilityLaneCostClass | "unknown" | null;
  requested_backend_latency_class: HelixCapabilityLaneLatencyClass | "unknown" | null;
  requested_backend_privacy_class: HelixCapabilityLanePrivacyClass | "unknown" | null;
  requested_backend_fallback_provider: string | null;
  selected_backend_provider: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  selection_reason: string;
  availability_status: HelixCapabilityLaneBackendAvailabilityStatus | "unknown";
  permission_status: HelixCapabilityLaneBackendPermissionStatus | "unknown";
  cost_class: HelixCapabilityLaneCostClass;
  latency_class: HelixCapabilityLaneLatencyClass;
  privacy_class: HelixCapabilityLanePrivacyClass;
  fallback_backend_provider: string | null;
  resolved_backend_provider: HelixCapabilityLaneBackendFamily | null;
  resolved_model_or_service: string | null;
  observation_ref: string | null;
  receipt_ref: string | null;
  result_ref: string | null;
  execution_status: HelixCapabilityLaneResolveTrace["execution_status"];
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneDebugEventStage =
  | "lane_visible"
  | "lane_requested"
  | "lane_backend_selected"
  | "lane_observation"
  | "lane_projection_receipt"
  | "lane_reentered"
  | "lane_session"
  | "lane_mail_loop"
  | "lane_goal_binding"
  | "goal_binding"
  | "lane_goal_dispatch_plan"
  | "lane_goal_dispatch_admission"
  | "lane_goal_dispatch_readiness"
  | "terminal_selected"
  | "terminal_rejected";

export type HelixCapabilityLaneTerminalAuthorityStatus =
  | "not_terminal_authority"
  | "pending_helix_terminal_authority"
  | "authorized_by_helix_provider_candidate_bridge"
  | "terminal_authority_rejected";

export type HelixCapabilityLaneDebugEvent = {
  schema: "helix.capability_lane.debug_event.v1";
  event_id: string;
  seq: number;
  stage: HelixCapabilityLaneDebugEventStage;
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  lane_id: HelixCapabilityLaneId | string;
  capability: string;
  status: "completed" | "blocked" | "failed" | "pending";
  requested_backend_provider: string | null;
  requested_backend_provider_known: boolean | null;
  requested_backend_configuration_status: HelixCapabilityLaneBackendConfigurationStatus | "unknown" | null;
  requested_backend_availability_status: HelixCapabilityLaneBackendAvailabilityStatus | "unknown" | null;
  requested_backend_permission_status: HelixCapabilityLaneBackendPermissionStatus | "unknown" | null;
  requested_backend_cost_class: HelixCapabilityLaneCostClass | "unknown" | null;
  requested_backend_latency_class: HelixCapabilityLaneLatencyClass | "unknown" | null;
  requested_backend_privacy_class: HelixCapabilityLanePrivacyClass | "unknown" | null;
  requested_backend_fallback_provider: string | null;
  selected_backend_provider: string | null;
  selection_reason: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision | null;
  availability_status: HelixCapabilityLaneBackendAvailabilityStatus | "unknown" | null;
  permission_status: HelixCapabilityLaneBackendPermissionStatus | "unknown" | null;
  cost_class: HelixCapabilityLaneCostClass | "unknown" | null;
  latency_class: HelixCapabilityLaneLatencyClass | "unknown" | null;
  privacy_class: HelixCapabilityLanePrivacyClass | "unknown" | null;
  fallback_backend_provider: string | null;
  execution_status: HelixCapabilityLaneResolveTrace["execution_status"] | null;
  observation_ref: string | null;
  result_ref: string | null;
  receipt_ref: string | null;
  source_id?: string | null;
  doc_path?: string | null;
  source_hash?: string | null;
  source_kind?: string | null;
  source_text_hash?: string | null;
  source_text_char_count?: number | null;
  source_projection_target?: string | null;
  account_locale?: string | null;
  target_language?: string | null;
  latest_chunk_id?: string | null;
  latest_chunk_index?: number | null;
  latest_dedupe_key?: string | null;
  latest_source_event_id?: string | null;
  latest_source_event_ms?: number | null;
  latest_observed_at_ms?: number | null;
  latest_freshness_status?: string | null;
  latest_cancel_requested?: boolean | null;
  reentry_required: true;
  reentry_status: "not_applicable" | "observation_packet_required_for_provider_reentry";
  terminal_authority_status: HelixCapabilityLaneTerminalAuthorityStatus;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};
