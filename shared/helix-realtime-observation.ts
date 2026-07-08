import type {
  HelixLiveRuntimeAgentAuthority,
  HelixLiveRuntimeAgentMode,
} from "./helix-live-runtime-agent";

export const HELIX_REALTIME_TRANSCRIPT_OBSERVATION_SCHEMA =
  "helix.realtime.transcript_observation.v1" as const;
export const HELIX_REALTIME_TOOL_SUGGESTION_OBSERVATION_SCHEMA =
  "helix.realtime.tool_suggestion_observation.v1" as const;
export const HELIX_REALTIME_CLIENT_RECEIPT_OBSERVATION_SCHEMA =
  "helix.realtime.client_receipt_observation.v1" as const;

export type HelixRealtimeTranscriptEventType = "transcript.partial" | "transcript.final";
export type HelixRealtimeToolSuggestionEventType = "tool.suggestion" | "action.suggestion";
export type HelixRealtimeClientReceiptKind =
  | "session_start_requested"
  | "session_started"
  | "mic_permission_granted"
  | "mic_permission_denied"
  | "consent_granted"
  | "consent_denied"
  | "capture_active"
  | "capture_stopped"
  | "track_stopped"
  | "playback_started"
  | "playback_ended"
  | "playback_failed"
  | "transport_start_blocked"
  | "transport_stop_requested"
  | "transport_stopped"
  | "stop_requested"
  | "stopped"
  | "error";

export type HelixRealtimeTranscriptObservation = {
  schema: typeof HELIX_REALTIME_TRANSCRIPT_OBSERVATION_SCHEMA;
  observation_ref: string;
  realtime_session_id: string;
  lane_session_id: string | null;
  runtime_agent_mode: Extract<HelixLiveRuntimeAgentMode, "live_transcription">;
  runtime_agent_authority: HelixLiveRuntimeAgentAuthority;
  event_type: HelixRealtimeTranscriptEventType;
  source_binding: Record<string, unknown> | null;
  source_id: string | null;
  source_kind: string | null;
  source_hash: string | null;
  transcript_text_hash: string | null;
  transcript_text_char_count: number | null;
  observed_at_ms: number;
  client_receipt_ref: string | null;
  reentry_status: "pending_solver_reentry";
  observation_reentered: false;
  context_role: "tool_evidence";
  transcript_is_user_intent: false;
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRealtimeToolSuggestionObservation = {
  schema: typeof HELIX_REALTIME_TOOL_SUGGESTION_OBSERVATION_SCHEMA;
  suggestion_ref: string;
  realtime_session_id: string;
  lane_session_id: string | null;
  runtime_agent_mode: HelixLiveRuntimeAgentMode;
  runtime_agent_authority: HelixLiveRuntimeAgentAuthority;
  event_type: HelixRealtimeToolSuggestionEventType;
  suggested_capability_id: string | null;
  suggested_action_id: string | null;
  source_observation_ref: string | null;
  client_receipt_ref: string | null;
  tool_admission_state: "suggest_only" | "blocked";
  admission_status: "candidate_only" | "blocked";
  blocked_reason: string | null;
  reentry_status: "pending_solver_reentry";
  observation_reentered: false;
  context_role: "tool_evidence";
  execution_attempted: false;
  gateway_execution_attempted: false;
  workstation_action_executed: false;
  answer_authority: false;
  reentry_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRealtimeClientReceiptObservation = {
  schema: typeof HELIX_REALTIME_CLIENT_RECEIPT_OBSERVATION_SCHEMA;
  receipt_ref: string;
  realtime_session_id: string;
  lane_session_id: string | null;
  runtime_agent_mode: HelixLiveRuntimeAgentMode;
  runtime_agent_authority: HelixLiveRuntimeAgentAuthority;
  receipt_kind: HelixRealtimeClientReceiptKind | string;
  lifecycle_state: string | null;
  controller_state: string | null;
  status: string | null;
  observed_at_ms: number;
  client_receipt_ref: string;
  source_binding_ref: string | null;
  failure_code: string | null;
  failure_reason: string | null;
  openai_network_call_attempted: false;
  ephemeral_credential_minted: false;
  webrtc_started: false;
  sideband_started: false;
  media_capture_started: false;
  browser_media_api_referenced: false;
  browser_tracks_created: false;
  data_channels_created: false;
  answer_authority: false;
  reentry_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  reentry_status: "pending_solver_reentry";
  observation_reentered: false;
  context_role: "tool_evidence";
};

export const isHelixRealtimeTranscriptEventType = (
  value: unknown,
): value is HelixRealtimeTranscriptEventType =>
  value === "transcript.partial" || value === "transcript.final";

export const isHelixRealtimeToolSuggestionEventType = (
  value: unknown,
): value is HelixRealtimeToolSuggestionEventType =>
  value === "tool.suggestion" || value === "action.suggestion";
