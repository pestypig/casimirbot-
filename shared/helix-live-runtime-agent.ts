export const HELIX_LIVE_RUNTIME_AGENT_CONTROL_STATE_SCHEMA =
  "helix.live_runtime_agent.control_state.v1" as const;

export const HELIX_LIVE_RUNTIME_AGENT_MODES = [
  "off",
  "live_voice",
  "live_voice_mini",
  "live_transcription",
  "live_translation",
] as const;

export type HelixLiveRuntimeAgentMode = (typeof HELIX_LIVE_RUNTIME_AGENT_MODES)[number];

export const HELIX_LIVE_RUNTIME_AGENT_AUTHORITIES = [
  "observe_only",
  "suggest_actions",
  "execute_safe_actions",
  "execute_confirmed_actions",
] as const;

export type HelixLiveRuntimeAgentAuthority =
  (typeof HELIX_LIVE_RUNTIME_AGENT_AUTHORITIES)[number];

export type HelixLiveRuntimeTransport =
  | "none"
  | "webrtc"
  | "websocket"
  | "server_sideband";

export type HelixLiveRuntimeSessionStatus =
  | "idle"
  | "requesting"
  | "active"
  | "paused"
  | "stopping"
  | "stopped"
  | "error";

export type HelixLiveRuntimeAgentControlState = {
  schema: typeof HELIX_LIVE_RUNTIME_AGENT_CONTROL_STATE_SCHEMA;
  runtime_agent_mode: HelixLiveRuntimeAgentMode;
  runtime_agent_authority: HelixLiveRuntimeAgentAuthority;
  transport: HelixLiveRuntimeTransport;
  session_status: HelixLiveRuntimeSessionStatus;
  selected_backend_provider: string | null;
  selected_model_or_service: string | null;
  source_binding: Record<string, unknown> | null;
  consent_state: "not_requested" | "requested" | "granted" | "denied" | "revoked";
  tool_admission_state:
    | "not_requested"
    | "observe_only"
    | "suggest_only"
    | "confirmation_required"
    | "blocked";
  client_receipt_state:
    | "not_expected"
    | "awaiting_client_receipt"
    | "received"
    | "failed";
  tool_request_count: number;
  admitted_tool_request_count: number;
  blocked_tool_request_count: number;
  client_receipt_count: number;
  latest_failure_code: string | null;
  terminal_authority_status:
    | "not_terminal_authority"
    | "pending_helix_terminal_authority"
    | "terminal_authority_rejected";
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

const isLiveRuntimeMode = (value: unknown): value is HelixLiveRuntimeAgentMode =>
  typeof value === "string" &&
  HELIX_LIVE_RUNTIME_AGENT_MODES.includes(value as HelixLiveRuntimeAgentMode);

const isLiveRuntimeAuthority = (value: unknown): value is HelixLiveRuntimeAgentAuthority =>
  typeof value === "string" &&
  HELIX_LIVE_RUNTIME_AGENT_AUTHORITIES.includes(value as HelixLiveRuntimeAgentAuthority);

export const resolveHelixLiveRuntimeMode = (
  value: unknown,
  fallback: HelixLiveRuntimeAgentMode = "off",
): HelixLiveRuntimeAgentMode => isLiveRuntimeMode(value) ? value : fallback;

export const resolveHelixLiveRuntimeAuthority = (
  value: unknown,
  fallback: HelixLiveRuntimeAgentAuthority = "observe_only",
): HelixLiveRuntimeAgentAuthority => isLiveRuntimeAuthority(value) ? value : fallback;

export const buildInactiveHelixLiveRuntimeAgentControlState = (
  input: Partial<Pick<
    HelixLiveRuntimeAgentControlState,
    | "runtime_agent_mode"
    | "runtime_agent_authority"
    | "selected_backend_provider"
    | "selected_model_or_service"
    | "latest_failure_code"
  >> = {},
): HelixLiveRuntimeAgentControlState => ({
  schema: HELIX_LIVE_RUNTIME_AGENT_CONTROL_STATE_SCHEMA,
  runtime_agent_mode: resolveHelixLiveRuntimeMode(input.runtime_agent_mode),
  runtime_agent_authority: resolveHelixLiveRuntimeAuthority(input.runtime_agent_authority),
  transport: "none",
  session_status: "idle",
  selected_backend_provider: input.selected_backend_provider ?? null,
  selected_model_or_service: input.selected_model_or_service ?? null,
  source_binding: null,
  consent_state: "not_requested",
  tool_admission_state: "not_requested",
  client_receipt_state: "not_expected",
  tool_request_count: 0,
  admitted_tool_request_count: 0,
  blocked_tool_request_count: 0,
  client_receipt_count: 0,
  latest_failure_code: input.latest_failure_code ?? null,
  terminal_authority_status: "not_terminal_authority",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});
