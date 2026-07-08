import { readBooleanEnv } from "../capability-lanes/backend-provider-config";
import type {
  HelixRealtimeSessionTransport,
  HelixRealtimeSessionTransportPlan,
} from "@shared/helix-realtime-session";

export const HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED_ENV =
  "HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED" as const;
export const HELIX_REALTIME_SESSION_ADAPTER_ENABLED_ENV =
  "HELIX_REALTIME_SESSION_ADAPTER_ENABLED" as const;
export const HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED_ENV =
  "HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED" as const;

export type HelixRealtimeSessionFeatureGate = {
  schema: "helix.realtime_session.feature_gate.v1";
  descriptor_enabled: boolean;
  adapter_enabled: boolean;
  live_transport_enabled: boolean;
  descriptor_flag: typeof HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED_ENV;
  adapter_flag: typeof HELIX_REALTIME_SESSION_ADAPTER_ENABLED_ENV;
  live_transport_flag: typeof HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED_ENV;
};

export const readRealtimeSessionFeatureGate = (
  env: NodeJS.ProcessEnv = process.env,
): HelixRealtimeSessionFeatureGate => ({
  schema: "helix.realtime_session.feature_gate.v1",
  descriptor_enabled: readBooleanEnv(env[HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED_ENV], false),
  adapter_enabled: readBooleanEnv(env[HELIX_REALTIME_SESSION_ADAPTER_ENABLED_ENV], false),
  live_transport_enabled: readBooleanEnv(env[HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED_ENV], false),
  descriptor_flag: HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED_ENV,
  adapter_flag: HELIX_REALTIME_SESSION_ADAPTER_ENABLED_ENV,
  live_transport_flag: HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED_ENV,
});

export const buildRealtimeSessionTransportPlan = (args?: {
  requestedTransport?: HelixRealtimeSessionTransport | null;
  clientReceiptRefs?: string[];
  env?: NodeJS.ProcessEnv;
}): HelixRealtimeSessionTransportPlan => {
  const featureGate = readRealtimeSessionFeatureGate(args?.env);
  const requestedTransport = args?.requestedTransport ?? "webrtc";
  const adapterEnabled = featureGate.adapter_enabled;
  const liveTransportEnabled = featureGate.live_transport_enabled;
  const adapterId = adapterEnabled ? "openai_realtime_stub" : "disabled";
  return {
    schema: "helix.realtime_session.transport_plan.v1",
    requested_transport: requestedTransport,
    planned_transport: "none",
    adapter_id: adapterId,
    adapter_state: adapterEnabled ? "stubbed" : "disabled",
    descriptor_enabled: featureGate.descriptor_enabled,
    adapter_enabled: adapterEnabled,
    live_transport_enabled: liveTransportEnabled,
    live_execution_attempted: false,
    live_execution_disabled_reason: !adapterEnabled
      ? "realtime_adapter_disabled_by_env"
      : !liveTransportEnabled
        ? "realtime_live_transport_disabled_by_env"
        : "openai_realtime_adapter_stub_no_live_call",
    requires_visible_user_gesture: true,
    requires_server_session_response: true,
    requires_client_consent_receipt: true,
    client_secret_requested: false,
    client_secret_issued: false,
    sdp_exchange_requested: false,
    server_sideband_requested: false,
    provider_session_ref: null,
    client_receipt_refs: args?.clientReceiptRefs ?? [],
  };
};
