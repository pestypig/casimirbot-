import type {
  HelixRealtimeSessionAction,
  HelixRealtimeSessionTransport,
  HelixRealtimeSessionTransportPlan,
} from "@shared/helix-realtime-session";
import { buildRealtimeSessionTransportPlan } from "./config";

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readClientReceiptRefs = (body: unknown): string[] => {
  const record = readRecord(body);
  return [
    readString(record.visible_user_consent_receipt ?? record.visibleUserConsentReceipt),
    readString(record.client_receipt_ref ?? record.clientReceiptRef),
  ].filter((entry): entry is string => Boolean(entry));
};

const readRequestedTransport = (body: unknown): HelixRealtimeSessionTransport => {
  const record = readRecord(body);
  const value = readString(record.transport ?? record.requested_transport ?? record.requestedTransport);
  return value === "webrtc" || value === "websocket" || value === "server_sideband"
    ? value
    : "webrtc";
};

export type HelixRealtimeSessionAdapterResult = {
  schema: "helix.realtime_session.adapter_result.v1";
  ok: boolean;
  action: HelixRealtimeSessionAction;
  adapter_id: HelixRealtimeSessionTransportPlan["adapter_id"];
  adapter_state: HelixRealtimeSessionTransportPlan["adapter_state"];
  blocked_reason:
    | "realtime_adapter_disabled_by_env"
    | "realtime_live_transport_disabled_by_env"
    | "openai_realtime_adapter_stub_no_live_call"
    | "missing_openai_key"
    | "openai_realtime_transport_not_configured"
    | "openai_realtime_contract_ready"
    | "openai_realtime_contract_failed";
  transport_plan: HelixRealtimeSessionTransportPlan;
  provider_session_ref: string | null;
  openai_network_call_attempted: boolean;
  ephemeral_credential_minted: boolean;
  ephemeral_client_secret: string | null;
  ephemeral_client_secret_expires_at_ms: number | null;
  webrtc_started: false;
  sideband_started: false;
};

export type HelixRealtimeSessionAdapterArgs = {
  body?: unknown;
  realtimeSessionId?: string | null;
  env?: NodeJS.ProcessEnv;
};

export type HelixRealtimeOpenAiContractRequest = {
  apiKey: string;
  model: string;
  requestedTransport: HelixRealtimeSessionTransport;
  runtimeAgentMode: string | null;
  runtimeAgentAuthority: string | null;
  clientReceiptRefs: string[];
};

export type HelixRealtimeOpenAiContractResult = {
  ok: boolean;
  providerSessionRef?: string | null;
  ephemeralClientSecret?: string | null;
  ephemeralClientSecretExpiresAtMs?: number | null;
  failureReason?: string | null;
};

export type HelixRealtimeOpenAiContractTransport = (
  request: HelixRealtimeOpenAiContractRequest,
) => Promise<HelixRealtimeOpenAiContractResult>;

export type HelixRealtimeSessionAdapter = {
  id: HelixRealtimeSessionTransportPlan["adapter_id"];
  createSession(args: HelixRealtimeSessionAdapterArgs): Promise<HelixRealtimeSessionAdapterResult>;
  stopSession(args: HelixRealtimeSessionAdapterArgs): Promise<HelixRealtimeSessionAdapterResult>;
  recordClientReceipt(args: HelixRealtimeSessionAdapterArgs): Promise<HelixRealtimeSessionAdapterResult>;
  recordProviderEvent(args: HelixRealtimeSessionAdapterArgs): Promise<HelixRealtimeSessionAdapterResult>;
};

const buildAdapterResult = (args: {
  action: HelixRealtimeSessionAction;
  body?: unknown;
  env?: NodeJS.ProcessEnv;
  blockedReason?: HelixRealtimeSessionAdapterResult["blocked_reason"];
  ok?: boolean;
  providerSessionRef?: string | null;
  openaiNetworkCallAttempted?: boolean;
  ephemeralCredentialMinted?: boolean;
  ephemeralClientSecret?: string | null;
  ephemeralClientSecretExpiresAtMs?: number | null;
  transportPlanPatch?: Partial<HelixRealtimeSessionTransportPlan>;
}): HelixRealtimeSessionAdapterResult => {
  const baseTransportPlan = buildRealtimeSessionTransportPlan({
    env: args.env,
    requestedTransport: readRequestedTransport(args.body),
    clientReceiptRefs: readClientReceiptRefs(args.body),
  });
  const transportPlan = {
    ...baseTransportPlan,
    ...args.transportPlanPatch,
  };
  const blockedReason =
    args.blockedReason ??
    (transportPlan.live_execution_disabled_reason as HelixRealtimeSessionAdapterResult["blocked_reason"]);
  return {
    schema: "helix.realtime_session.adapter_result.v1",
    ok: args.ok === true,
    action: args.action,
    adapter_id: transportPlan.adapter_id,
    adapter_state: transportPlan.adapter_state,
    blocked_reason: blockedReason,
    transport_plan: transportPlan,
    provider_session_ref: args.providerSessionRef ?? null,
    openai_network_call_attempted: args.openaiNetworkCallAttempted === true,
    ephemeral_credential_minted: args.ephemeralCredentialMinted === true,
    ephemeral_client_secret: args.ephemeralClientSecret ?? null,
    ephemeral_client_secret_expires_at_ms: args.ephemeralClientSecretExpiresAtMs ?? null,
    webrtc_started: false,
    sideband_started: false,
  };
};

export const disabledRealtimeSessionAdapter: HelixRealtimeSessionAdapter = {
  id: "disabled",
  createSession: async (args) => buildAdapterResult({
    action: "start",
    body: args.body,
    env: args.env,
    blockedReason: "realtime_adapter_disabled_by_env",
  }),
  stopSession: async (args) => buildAdapterResult({
    action: "stop",
    body: args.body,
    env: args.env,
    blockedReason: "realtime_adapter_disabled_by_env",
  }),
  recordClientReceipt: async (args) => buildAdapterResult({
    action: "record_client_receipt",
    body: args.body,
    env: args.env,
    blockedReason: "realtime_adapter_disabled_by_env",
  }),
  recordProviderEvent: async (args) => buildAdapterResult({
    action: "record_event",
    body: args.body,
    env: args.env,
    blockedReason: "realtime_adapter_disabled_by_env",
  }),
};

export const openAiRealtimeSessionAdapterStub: HelixRealtimeSessionAdapter = {
  id: "openai_realtime_stub",
  createSession: async (args) => buildAdapterResult({
    action: "start",
    body: args.body,
    env: args.env,
  }),
  stopSession: async (args) => buildAdapterResult({
    action: "stop",
    body: args.body,
    env: args.env,
  }),
  recordClientReceipt: async (args) => buildAdapterResult({
    action: "record_client_receipt",
    body: args.body,
    env: args.env,
  }),
  recordProviderEvent: async (args) => buildAdapterResult({
    action: "record_event",
    body: args.body,
    env: args.env,
  }),
};

const readOpenAiApiKey = (env?: NodeJS.ProcessEnv): string | null =>
  readString(env?.OPENAI_API_KEY);

const defaultOpenAiContractTransport: HelixRealtimeOpenAiContractTransport = async () => ({
  ok: false,
  failureReason: "openai_realtime_transport_not_configured",
});

const readSelectedRealtimeModel = (body: unknown): string => {
  const record = readRecord(body);
  return (
    readString(record.selected_model_or_service ?? record.selectedModelOrService ?? record.selected_realtime_model) ??
    "gpt-realtime"
  );
};

export const createOpenAiRealtimeSessionAdapter = (
  transport: HelixRealtimeOpenAiContractTransport = defaultOpenAiContractTransport,
): HelixRealtimeSessionAdapter => ({
  id: "openai_realtime",
  createSession: async (args) => {
    const basePlan = buildRealtimeSessionTransportPlan({
      env: args.env,
      requestedTransport: readRequestedTransport(args.body),
      clientReceiptRefs: readClientReceiptRefs(args.body),
    });
    if (!basePlan.adapter_enabled) {
      return buildAdapterResult({
        action: "start",
        body: args.body,
        env: args.env,
        blockedReason: "realtime_adapter_disabled_by_env",
      });
    }
    if (!basePlan.live_transport_enabled) {
      return buildAdapterResult({
        action: "start",
        body: args.body,
        env: args.env,
        blockedReason: "realtime_live_transport_disabled_by_env",
      });
    }
    if (basePlan.adapter_id !== "openai_realtime") {
      return buildAdapterResult({
        action: "start",
        body: args.body,
        env: args.env,
        blockedReason: "openai_realtime_adapter_stub_no_live_call",
      });
    }
    const apiKey = readOpenAiApiKey(args.env);
    if (!apiKey) {
      return buildAdapterResult({
        action: "start",
        body: args.body,
        env: args.env,
        blockedReason: "missing_openai_key",
        transportPlanPatch: {
          adapter_state: "missing_key",
          live_execution_disabled_reason: "missing_openai_key",
        },
      });
    }
    const request = {
      apiKey,
      model: readSelectedRealtimeModel(args.body),
      requestedTransport: readRequestedTransport(args.body),
      runtimeAgentMode: readString(readRecord(args.body).runtime_agent_mode ?? readRecord(args.body).runtimeAgentMode),
      runtimeAgentAuthority: readString(
        readRecord(args.body).runtime_agent_authority ?? readRecord(args.body).runtimeAgentAuthority,
      ),
      clientReceiptRefs: readClientReceiptRefs(args.body),
    };
    const result = await transport(request);
    if (!result.ok) {
      return buildAdapterResult({
        action: "start",
        body: args.body,
        env: args.env,
        blockedReason: "openai_realtime_contract_failed",
        openaiNetworkCallAttempted: true,
        transportPlanPatch: {
          adapter_state: "contract_failed",
          live_execution_disabled_reason:
            readString(result.failureReason) ?? "openai_realtime_contract_failed",
        },
      });
    }
    const providerSessionRef =
      readString(result.providerSessionRef) ?? `openai-realtime:${Date.now()}`;
    const expiresAtMs =
      typeof result.ephemeralClientSecretExpiresAtMs === "number" &&
      Number.isFinite(result.ephemeralClientSecretExpiresAtMs)
        ? Math.trunc(result.ephemeralClientSecretExpiresAtMs)
        : null;
    return buildAdapterResult({
      action: "start",
      body: args.body,
      env: args.env,
      ok: true,
      blockedReason: "openai_realtime_contract_ready",
      providerSessionRef,
      openaiNetworkCallAttempted: true,
      ephemeralCredentialMinted: Boolean(readString(result.ephemeralClientSecret)),
      ephemeralClientSecret: readString(result.ephemeralClientSecret),
      ephemeralClientSecretExpiresAtMs: expiresAtMs,
      transportPlanPatch: {
        planned_transport: request.requestedTransport,
        adapter_state: "contract_ready",
        live_execution_disabled_reason: "openai_realtime_contract_ready",
        client_secret_requested: true,
        client_secret_issued: Boolean(readString(result.ephemeralClientSecret)),
        sdp_exchange_requested: true,
        provider_session_ref: providerSessionRef,
        ephemeral_client_secret_expires_at_ms: expiresAtMs,
      },
    });
  },
  stopSession: async (args) => buildAdapterResult({
    action: "stop",
    body: args.body,
    env: args.env,
    blockedReason: "openai_realtime_adapter_stub_no_live_call",
  }),
  recordClientReceipt: async (args) => buildAdapterResult({
    action: "record_client_receipt",
    body: args.body,
    env: args.env,
    blockedReason: "openai_realtime_adapter_stub_no_live_call",
  }),
  recordProviderEvent: async (args) => buildAdapterResult({
    action: "record_event",
    body: args.body,
    env: args.env,
    blockedReason: "openai_realtime_adapter_stub_no_live_call",
  }),
});

let injectedOpenAiContractTransport: HelixRealtimeOpenAiContractTransport | null = null;

export const setOpenAiRealtimeContractTransportForTests = (
  transport: HelixRealtimeOpenAiContractTransport | null,
): void => {
  injectedOpenAiContractTransport = transport;
};

export const selectRealtimeSessionAdapter = (
  env: NodeJS.ProcessEnv = process.env,
): HelixRealtimeSessionAdapter =>
  buildRealtimeSessionTransportPlan({ env }).adapter_id === "openai_realtime"
    ? createOpenAiRealtimeSessionAdapter(injectedOpenAiContractTransport ?? defaultOpenAiContractTransport)
    : buildRealtimeSessionTransportPlan({ env }).adapter_id === "openai_realtime_stub"
      ? openAiRealtimeSessionAdapterStub
      : disabledRealtimeSessionAdapter;
