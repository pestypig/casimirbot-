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
  ok: false;
  action: HelixRealtimeSessionAction;
  adapter_id: HelixRealtimeSessionTransportPlan["adapter_id"];
  adapter_state: HelixRealtimeSessionTransportPlan["adapter_state"];
  blocked_reason:
    | "realtime_adapter_disabled_by_env"
    | "realtime_live_transport_disabled_by_env"
    | "openai_realtime_adapter_stub_no_live_call";
  transport_plan: HelixRealtimeSessionTransportPlan;
  provider_session_ref: null;
  openai_network_call_attempted: false;
  ephemeral_credential_minted: false;
  webrtc_started: false;
  sideband_started: false;
};

export type HelixRealtimeSessionAdapterArgs = {
  body?: unknown;
  realtimeSessionId?: string | null;
  env?: NodeJS.ProcessEnv;
};

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
}): HelixRealtimeSessionAdapterResult => {
  const transportPlan = buildRealtimeSessionTransportPlan({
    env: args.env,
    requestedTransport: readRequestedTransport(args.body),
    clientReceiptRefs: readClientReceiptRefs(args.body),
  });
  const blockedReason =
    args.blockedReason ??
    (transportPlan.live_execution_disabled_reason as HelixRealtimeSessionAdapterResult["blocked_reason"]);
  return {
    schema: "helix.realtime_session.adapter_result.v1",
    ok: false,
    action: args.action,
    adapter_id: transportPlan.adapter_id,
    adapter_state: transportPlan.adapter_state,
    blocked_reason: blockedReason,
    transport_plan: transportPlan,
    provider_session_ref: null,
    openai_network_call_attempted: false,
    ephemeral_credential_minted: false,
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

export const selectRealtimeSessionAdapter = (
  env: NodeJS.ProcessEnv = process.env,
): HelixRealtimeSessionAdapter =>
  buildRealtimeSessionTransportPlan({ env }).adapter_id === "openai_realtime_stub"
    ? openAiRealtimeSessionAdapterStub
    : disabledRealtimeSessionAdapter;
