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
import type {
  HelixRealtimeStagePlayAskHandoffV1,
  HelixRealtimeStagePlayContextSyncV1,
} from "./contracts/helix-realtime-stage-play.v1";

export const HELIX_REALTIME_SESSION_RESPONSE_SCHEMA =
  "helix.realtime_session.response.v1" as const;

export const HELIX_REALTIME_SESSION_EVENT_RESPONSE_SCHEMA =
  "helix.realtime_session.event_response.v1" as const;

export const HELIX_REALTIME_SESSION_CLIENT_RECEIPT_RESPONSE_SCHEMA =
  "helix.realtime_session.client_receipt_response.v1" as const;

export const HELIX_REALTIME_SDP_EXCHANGE_RESPONSE_SCHEMA =
  "helix.realtime_session.sdp_exchange_response.v1" as const;

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
  adapter_id: "disabled" | "openai_realtime_stub" | "openai_realtime";
  adapter_state: "disabled" | "stubbed" | "missing_key" | "contract_ready" | "contract_failed";
  descriptor_enabled: boolean;
  adapter_enabled: boolean;
  live_transport_enabled: boolean;
  live_execution_attempted: false;
  live_execution_disabled_reason: string;
  requires_visible_user_gesture: true;
  requires_server_session_response: true;
  requires_client_consent_receipt: true;
  client_secret_requested: boolean;
  client_secret_issued: boolean;
  sdp_exchange_requested: boolean;
  server_sideband_requested: boolean;
  provider_session_ref: string | null;
  client_receipt_refs: string[];
  ephemeral_client_secret_expires_at_ms: number | null;
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

export type HelixRealtimeSdpExchangeRequest = {
  offer_sdp?: string | null;
  visible_user_consent_receipt?: string | null;
};

export type HelixRealtimeSdpExchangeResponse = {
  schema: typeof HELIX_REALTIME_SDP_EXCHANGE_RESPONSE_SCHEMA;
  ok: boolean;
  error:
    | "realtime_runtime_agent_locked_by_account_policy"
    | "realtime_session_not_found"
    | "realtime_sdp_exchange_disabled"
    | "realtime_sdp_offer_invalid"
    | "realtime_openai_contract_failed"
    | null;
  blocked_reason: string | null;
  realtime_session_id: string | null;
  provider_call_ref: string | null;
  answer_sdp: string | null;
  openai_network_call_attempted: boolean;
  webrtc_started: boolean;
  sideband_started: boolean;
  realtime_stage_play_context_sync: HelixRealtimeStagePlayContextSyncV1 | null;
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
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
    | "missing_openai_key"
    | "openai_realtime_contract_ready"
    | "openai_realtime_contract_failed"
    | "transport_blocked"
    | "receipt_recorded";
  session_lifecycle: string[];
  selected_realtime_model: string | null;
  transport_execution_attempted: false;
  media_capture_started: false;
  openai_network_call_attempted: boolean;
  webrtc_started: false;
  sideband_started: boolean;
  adapter_id: HelixRealtimeSessionTransportPlan["adapter_id"];
  adapter_state: HelixRealtimeSessionTransportPlan["adapter_state"];
  transport_plan: HelixRealtimeSessionTransportPlan;
  provider_session_ref: string | null;
  client_receipt_refs: string[];
  ephemeral_client_secret_expires_at_ms: number | null;
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
    | "realtime_openai_contract_failed"
    | null;
  blocked_reason: string | null;
  realtime_session_id: string | null;
  lane_id: "realtime_session";
  transport: HelixRealtimeSessionTransport;
  transport_plan: HelixRealtimeSessionTransportPlan;
  client_secret_requested: boolean;
  client_secret_issued: boolean;
  sdp_exchange_requested: boolean;
  server_sideband_requested: boolean;
  provider_session_ref: string | null;
  openai_network_call_attempted: boolean;
  ephemeral_credential_minted: boolean;
  webrtc_started: false;
  sideband_started: boolean;
  account_policy: HelixAccountCapabilityPolicy;
  policy_gate: HelixRealtimeSessionPolicyGate;
  realtime_runtime_session_summary: HelixRealtimeSessionDebugSummary;
  realtime_runtime_session_events: Array<Record<string, unknown>>;
  realtime_transcript_observations: HelixRealtimeTranscriptObservation[];
  realtime_tool_suggestion_observations: HelixRealtimeToolSuggestionObservation[];
  realtime_client_receipt_observations: HelixRealtimeClientReceiptObservation[];
  realtime_reentry_status: "observation_packet_required_for_provider_reentry" | null;
  realtime_stage_play_ask_handoff?: HelixRealtimeStagePlayAskHandoffV1 | null;
  realtime_stage_play_context_sync?: HelixRealtimeStagePlayContextSyncV1 | null;
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
