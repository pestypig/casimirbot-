import { describe, expect, it } from "vitest";
import {
  disabledRealtimeSessionAdapter,
  openAiRealtimeSessionAdapterStub,
  selectRealtimeSessionAdapter,
} from "../adapter";
import {
  HELIX_REALTIME_SESSION_ADAPTER_ENABLED_ENV,
  HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED_ENV,
  HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED_ENV,
  readRealtimeSessionFeatureGate,
} from "../config";

describe("Realtime session adapter boundary", () => {
  it("keeps every feature gate disabled by default", () => {
    const gate = readRealtimeSessionFeatureGate({} as NodeJS.ProcessEnv);

    expect(gate).toEqual({
      schema: "helix.realtime_session.feature_gate.v1",
      descriptor_enabled: false,
      adapter_enabled: false,
      live_transport_enabled: false,
      descriptor_flag: HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED_ENV,
      adapter_flag: HELIX_REALTIME_SESSION_ADAPTER_ENABLED_ENV,
      live_transport_flag: HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED_ENV,
    });
    expect(selectRealtimeSessionAdapter({} as NodeJS.ProcessEnv)).toBe(disabledRealtimeSessionAdapter);
  });

  it("returns deterministic non-networked envelopes from the disabled adapter", async () => {
    const result = await disabledRealtimeSessionAdapter.createSession({
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result).toMatchObject({
      schema: "helix.realtime_session.adapter_result.v1",
      ok: false,
      action: "start",
      adapter_id: "disabled",
      adapter_state: "disabled",
      blocked_reason: "realtime_adapter_disabled_by_env",
      provider_session_ref: null,
      openai_network_call_attempted: false,
      ephemeral_credential_minted: false,
      webrtc_started: false,
      sideband_started: false,
      transport_plan: expect.objectContaining({
        adapter_id: "disabled",
        adapter_state: "disabled",
        descriptor_enabled: false,
        adapter_enabled: false,
        live_transport_enabled: false,
        client_secret_requested: false,
        client_secret_issued: false,
        sdp_exchange_requested: false,
        server_sideband_requested: false,
        provider_session_ref: null,
        live_execution_attempted: false,
      }),
    });
  });

  it("selects only a non-networked provider stub when adapter flags are enabled", async () => {
    const env = {
      HELIX_REALTIME_SESSION_ADAPTER_ENABLED: "1",
      HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED: "1",
      OPENAI_API_KEY: "must-not-leak",
    } as NodeJS.ProcessEnv;
    const adapter = selectRealtimeSessionAdapter(env);
    const result = await adapter.createSession({ env });

    expect(adapter).toBe(openAiRealtimeSessionAdapterStub);
    expect(result).toMatchObject({
      adapter_id: "openai_realtime_stub",
      adapter_state: "stubbed",
      blocked_reason: "openai_realtime_adapter_stub_no_live_call",
      provider_session_ref: null,
      openai_network_call_attempted: false,
      ephemeral_credential_minted: false,
      webrtc_started: false,
      sideband_started: false,
      transport_plan: expect.objectContaining({
        adapter_id: "openai_realtime_stub",
        adapter_state: "stubbed",
        adapter_enabled: true,
        live_transport_enabled: true,
        client_secret_requested: false,
        client_secret_issued: false,
        sdp_exchange_requested: false,
        server_sideband_requested: false,
        provider_session_ref: null,
      }),
    });
    expect(JSON.stringify(result)).not.toContain("must-not-leak");
  });
});
