import type { HelixAgentRuntimeId } from "./helix-agent-runtime";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneCostClass,
  HelixCapabilityLaneId,
  HelixCapabilityLaneLatencyClass,
  HelixCapabilityLanePrivacyClass,
} from "./helix-capability-lane";

export const HELIX_CAPABILITY_LANE_SESSION_SCHEMA =
  "helix.capability_lane.session.v1" as const;
export const HELIX_CAPABILITY_LANE_SESSION_EVENT_SCHEMA =
  "helix.capability_lane.session_event.v1" as const;
export const HELIX_CAPABILITY_LANE_SESSION_DEBUG_SUMMARY_SCHEMA =
  "helix.capability_lane.session_debug_summary.v1" as const;
export const HELIX_CAPABILITY_LANE_SESSION_CALL_SCHEMA =
  "helix.capability_lane.session_call.v1" as const;

export type HelixCapabilityLaneSessionStatus =
  | "running"
  | "paused"
  | "stopped"
  | "blocked";

export type HelixCapabilityLaneSessionHealth =
  | "healthy"
  | "degraded"
  | "blocked"
  | "stopped";

export type HelixCapabilityLaneSessionAction =
  | "start"
  | "pause"
  | "resume"
  | "stop";

export type HelixCapabilityLaneSessionEventAction =
  | HelixCapabilityLaneSessionAction
  | "record_observation";

export type HelixCapabilityLaneSessionCallAction =
  | HelixCapabilityLaneSessionEventAction
  | "list";

export type HelixCapabilityLaneSessionCall = {
  schema?: typeof HELIX_CAPABILITY_LANE_SESSION_CALL_SCHEMA;
  action: HelixCapabilityLaneSessionCallAction;
  lane_id?: HelixCapabilityLaneId | null;
  lane_session_id?: string | null;
  requested_backend_provider?: string | null;
  source_binding?: Partial<HelixCapabilityLaneSessionSourceBinding> | null;
  source_id?: string | null;
  source_hash?: string | null;
  source_binding_key?: string | null;
  source_identity_key?: string | null;
  latest_source_identity_key?: string | null;
  source_kind?: HelixCapabilityLaneSessionSourceBinding["source_kind"] | null;
  account_locale?: string | null;
  target_language?: string | null;
  observation_ref?: string | null;
  receipt_ref?: string | null;
  chunk_id?: string | null;
  chunk_index?: number | null;
  dedupe_key?: string | null;
  source_event_id?: string | null;
  source_event_ms?: number | null;
  observed_at_ms?: number | null;
  freshness_status?: "fresh" | "stale" | "unknown" | string | null;
  source_text_hash?: string | null;
  source_text_char_count?: number | null;
  projection_target?: string | null;
  cancel_requested?: boolean | null;
  reason?: string | null;
  now_ms?: number | null;
  context_role?: "tool_evidence";
  answer_authority?: false;
  terminal_eligible?: false;
  assistant_answer?: false;
  raw_content_included?: false;
};

export type HelixCapabilityLaneSessionSourceBinding = {
  source_id: string;
  source_hash?: string | null;
  source_binding_key?: string | null;
  source_text_hash?: string | null;
  source_text_char_count?: number | null;
  source_identity_key?: string | null;
  latest_source_identity_key?: string | null;
  source_kind:
    | "docs"
    | "docs_hover"
    | "docs_selection"
    | "audio"
    | "visual"
    | "ask_turn"
    | "unknown";
  projection_target: string | null;
  account_locale: string | null;
  target_language?: string | null;
};

export type HelixCapabilityLaneSessionPermissions = {
  read: boolean;
  observe: boolean;
  act: boolean;
  write: false;
  shell: false;
  code_mutation: false;
};

export type HelixCapabilityLaneSessionEvent = {
  schema: typeof HELIX_CAPABILITY_LANE_SESSION_EVENT_SCHEMA;
  event_id: string;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  selected_backend_provider: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  cost_class: HelixCapabilityLaneCostClass | "unknown" | null;
  latency_class: HelixCapabilityLaneLatencyClass | "unknown" | null;
  privacy_class: HelixCapabilityLanePrivacyClass | "unknown" | null;
  fallback_backend_provider: string | null;
  action: HelixCapabilityLaneSessionEventAction;
  status: HelixCapabilityLaneSessionStatus;
  at_ms: number;
  reason: string;
  source_id: string | null;
  source_hash?: string | null;
  source_binding_key?: string | null;
  source_identity_key?: string | null;
  source_kind?: HelixCapabilityLaneSessionSourceBinding["source_kind"] | null;
  account_locale?: string | null;
  target_language?: string | null;
  observation_ref: string | null;
  receipt_ref: string | null;
  chunk_id?: string | null;
  chunk_index?: number | null;
  dedupe_key?: string | null;
  source_event_id?: string | null;
  source_event_ms?: number | null;
  observed_at_ms?: number | null;
  freshness_status?: string | null;
  source_text_hash?: string | null;
  source_text_char_count?: number | null;
  projection_target?: string | null;
  cancel_requested?: boolean | null;
  terminal_authority_status: "not_terminal_authority" | "pending_helix_terminal_authority";
  reentry_required: true;
  context_role: "tool_evidence";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneSession = {
  schema: typeof HELIX_CAPABILITY_LANE_SESSION_SCHEMA;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  selected_backend_provider: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  cost_class: HelixCapabilityLaneCostClass | "unknown" | null;
  latency_class: HelixCapabilityLaneLatencyClass | "unknown" | null;
  privacy_class: HelixCapabilityLanePrivacyClass | "unknown" | null;
  fallback_backend_provider: string | null;
  status: HelixCapabilityLaneSessionStatus;
  health: HelixCapabilityLaneSessionHealth;
  source_binding: HelixCapabilityLaneSessionSourceBinding;
  permissions: HelixCapabilityLaneSessionPermissions;
  created_at_ms: number;
  updated_at_ms: number;
  last_observation_ref: string | null;
  last_receipt_ref: string | null;
  debug_history: HelixCapabilityLaneSessionEvent[];
  context_role: "tool_evidence";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneSessionDebugSummary = {
  schema: typeof HELIX_CAPABILITY_LANE_SESSION_DEBUG_SUMMARY_SCHEMA;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  selected_backend_provider: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  cost_class: HelixCapabilityLaneCostClass | "unknown" | null;
  latency_class: HelixCapabilityLaneLatencyClass | "unknown" | null;
  privacy_class: HelixCapabilityLanePrivacyClass | "unknown" | null;
  fallback_backend_provider: string | null;
  lifecycle_action: HelixCapabilityLaneSessionEventAction | null;
  session_lifecycle_action: HelixCapabilityLaneSessionEventAction | null;
  session_action: HelixCapabilityLaneSessionEventAction | null;
  latest_session_reason: string | null;
  session_reason: string | null;
  session_debug_phase: string;
  session_observation_status: "no_observation" | "observation_recorded";
  session_status: HelixCapabilityLaneSessionStatus;
  session_health: HelixCapabilityLaneSessionHealth;
  source_id: string | null;
  source_hash?: string | null;
  source_kind: HelixCapabilityLaneSessionSourceBinding["source_kind"];
  projection_target: string | null;
  account_locale: string | null;
  target_language?: string | null;
  session_control_key: string;
  source_binding_key: string;
  source_identity_key: string;
  permissions: HelixCapabilityLaneSessionPermissions;
  permission_profile: string;
  created_at_ms: number;
  updated_at_ms: number;
  last_observation_ref: string | null;
  last_receipt_ref: string | null;
  latest_chunk_id?: string | null;
  latest_chunk_index?: number | null;
  latest_source_id?: string | null;
  latest_source_hash?: string | null;
  latest_source_binding_key?: string | null;
  latest_source_identity_key?: string | null;
  latest_source_kind?: HelixCapabilityLaneSessionSourceBinding["source_kind"] | null;
  latest_account_locale?: string | null;
  latest_target_language?: string | null;
  latest_dedupe_key?: string | null;
  latest_source_event_id?: string | null;
  latest_source_event_ms?: number | null;
  latest_observed_at_ms?: number | null;
  latest_freshness_status?: string | null;
  source_text_hash?: string | null;
  source_text_char_count?: number | null;
  latest_projection_target?: string | null;
  latest_cancel_requested?: boolean | null;
  latest_session_event: HelixCapabilityLaneSessionEvent | null;
  latest_event_id: string | null;
  latest_receipt_ref: string | null;
  latest_observation_key: string | null;
  evidence_refs: string[];
  session_event_count: number;
  has_observation: boolean;
  terminal_authority_status: "not_terminal_authority" | "pending_helix_terminal_authority";
  reentry_required: true;
  backend_provider_becomes_root_agent: false;
  final_reports_require_terminal_authority: true;
  context_role: "tool_evidence";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneSessionResult = {
  ok: boolean;
  action: HelixCapabilityLaneSessionCallAction;
  lane_id?: HelixCapabilityLaneId | null;
  lane_session_id?: string | null;
  selected_runtime_agent_provider?: HelixAgentRuntimeId | null;
  requested_backend_provider?: string | null;
  session_supported?: boolean | null;
  source_id?: string | null;
  source_hash?: string | null;
  source_binding_key?: string | null;
  source_identity_key?: string | null;
  source_text_hash?: string | null;
  source_text_char_count?: number | null;
  projection_target?: string | null;
  account_locale?: string | null;
  target_language?: string | null;
  lane_session: HelixCapabilityLaneSession | null;
  blocked_reason: string | null;
  reentry_required: true;
  context_role: "tool_evidence";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
