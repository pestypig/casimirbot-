import type { HelixAccountCapabilityPolicy } from "./helix-account-session";
import type {
  HelixLiveRuntimeAgentAuthority,
  HelixLiveRuntimeAgentControlState,
  HelixLiveRuntimeAgentMode,
} from "./helix-live-runtime-agent";
import type {
  HelixRealtimeClientReceiptObservation,
  HelixRealtimeToolSuggestionObservation,
  HelixRealtimeTranscriptObservation,
} from "./helix-realtime-observation";

export const HELIX_REALTIME_SESSION_RESPONSE_SCHEMA =
  "helix.realtime_session.response.v1" as const;

export const HELIX_REALTIME_SESSION_EVENT_RESPONSE_SCHEMA =
  "helix.realtime_session.event_response.v1" as const;

export const HELIX_REALTIME_SESSION_CLIENT_RECEIPT_RESPONSE_SCHEMA =
  "helix.realtime_session.client_receipt_response.v1" as const;

export type HelixRealtimeSessionAction =
  | "start"
  | "stop"
  | "record_event"
  | "record_client_receipt";

export type HelixRealtimeSessionTransport = "none" | "webrtc" | "websocket" | "server_sideband";

export type HelixRealtimeSessionTransportPlan = {
  schema: "helix.realtime_session.transport_plan.v1";
  requested_transport: HelixRealtimeSessionTransport;
  planned_transport: HelixRealtimeSessionTransport;
  adapter_id: "disabled" | "openai_realtime_stub";
  adapter_state: "disabled" | "stubbed";
  descriptor_enabled: boolean;
  adapter_enabled: boolean;
  live_transport_enabled: boolean;
  live_execution_attempted: false;
  live_execution_disabled_reason: string;
  requires_visible_user_gesture: true;
  requires_server_session_response: true;
  requires_client_consent_receipt: true;
  client_secret_requested: false;
  client_secret_issued: false;
  sdp_exchange_requested: false;
  server_sideband_requested: false;
  provider_session_ref: null;
  client_receipt_refs: string[];
};

export type HelixRealtimeSessionRequest = {
  runtime_agent_mode?: HelixLiveRuntimeAgentMode | string | null;
  runtime_agent_authority?: HelixLiveRuntimeAgentAuthority | string | null;
  requested_backend_provider?: string | null;
  selected_model_or_service?: string | null;
  source_binding?: Record<string, unknown> | null;
  visible_user_consent_receipt?: string | null;
};

export type HelixRealtimeSessionClientReceiptRequest = {
  client_receipt_ref?: string | null;
  receipt_kind?: string | null;
  status?: string | null;
  observed_at_ms?: number | null;
};

export type HelixRealtimeSessionEventRequest = {
  event_type?: string | null;
  event_ref?: string | null;
  client_receipt_ref?: string | null;
  observed_at_ms?: number | null;
};

export type HelixRealtimeSessionPolicyGate = {
  account_type: HelixAccountCapabilityPolicy["account_type"];
  runtime_agent_controls_available: boolean;
  locked_reason: string | null;
  requested_runtime_agent_mode: HelixLiveRuntimeAgentMode | string | null;
  requested_runtime_agent_authority: HelixLiveRuntimeAgentAuthority | string | null;
};

export type HelixRealtimeSessionDebugSummary = HelixLiveRuntimeAgentControlState & {
  realtime_session_id: string | null;
  live_session_admission_status:
    | "unavailable"
    | "locked_by_account_policy"
    | "admitted_stub"
    | "transport_blocked"
    | "receipt_recorded";
  session_lifecycle: string[];
  selected_realtime_model: string | null;
  transport_execution_attempted: false;
  media_capture_started: false;
  openai_network_call_attempted: false;
  webrtc_started: false;
  sideband_started: false;
  adapter_id: HelixRealtimeSessionTransportPlan["adapter_id"];
  adapter_state: HelixRealtimeSessionTransportPlan["adapter_state"];
  transport_plan: HelixRealtimeSessionTransportPlan;
  provider_session_ref: null;
  client_receipt_refs: string[];
  client_receipt_observation_count: number;
  latest_client_receipt_ref: string | null;
  latest_client_receipt_kind: string | null;
  latest_client_receipt_status: string | null;
  live_execution_disabled_reason: string;
  transcript_observation_count: number;
  latest_transcript_event_type: string | null;
  latest_transcript_observation_ref: string | null;
  tool_suggestion_count: number;
  latest_tool_suggestion_ref: string | null;
  latest_tool_suggestion_admission_status: "candidate_only" | "blocked" | null;
  latest_lifecycle_event_ref: string | null;
  realtime_reentry_status: "observation_packet_required_for_provider_reentry" | null;
};

export type HelixRealtimeSessionResponse = {
  schema:
    | typeof HELIX_REALTIME_SESSION_RESPONSE_SCHEMA
    | typeof HELIX_REALTIME_SESSION_EVENT_RESPONSE_SCHEMA
    | typeof HELIX_REALTIME_SESSION_CLIENT_RECEIPT_RESPONSE_SCHEMA;
  ok: boolean;
  action: HelixRealtimeSessionAction;
  error:
    | "realtime_runtime_agent_locked_by_account_policy"
    | "realtime_session_disabled"
    | "realtime_session_not_found"
    | null;
  blocked_reason: string | null;
  realtime_session_id: string | null;
  lane_id: "realtime_session";
  transport: HelixRealtimeSessionTransport;
  transport_plan: HelixRealtimeSessionTransportPlan;
  client_secret_requested: false;
  client_secret_issued: false;
  sdp_exchange_requested: false;
  server_sideband_requested: false;
  provider_session_ref: null;
  openai_network_call_attempted: false;
  ephemeral_credential_minted: false;
  webrtc_started: false;
  sideband_started: false;
  account_policy: HelixAccountCapabilityPolicy;
  policy_gate: HelixRealtimeSessionPolicyGate;
  realtime_runtime_session_summary: HelixRealtimeSessionDebugSummary;
  realtime_runtime_session_events: Array<Record<string, unknown>>;
  realtime_transcript_observations: HelixRealtimeTranscriptObservation[];
  realtime_tool_suggestion_observations: HelixRealtimeToolSuggestionObservation[];
  realtime_client_receipt_observations: HelixRealtimeClientReceiptObservation[];
  realtime_reentry_status: "observation_packet_required_for_provider_reentry" | null;
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
