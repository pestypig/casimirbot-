import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createOpenAiRealtimeSessionAdapter,
  disabledRealtimeSessionAdapter,
  openAiRealtimeSessionAdapterStub,
  selectRealtimeSessionAdapter,
  setOpenAiRealtimeContractTransportForTests,
} from "../adapter";
import {
  HELIX_REALTIME_SESSION_ADAPTER_ENABLED_ENV,
  HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED_ENV,
  HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED_ENV,
  HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED_ENV,
  readRealtimeSessionFeatureGate,
} from "../config";

describe("Realtime session adapter boundary", () => {
  afterEach(() => {
    setOpenAiRealtimeContractTransportForTests(null);
  });

  it("keeps every feature gate disabled by default", () => {
    const gate = readRealtimeSessionFeatureGate({} as NodeJS.ProcessEnv);

    expect(gate).toEqual({
      schema: "helix.realtime_session.feature_gate.v1",
      descriptor_enabled: false,
      adapter_enabled: false,
      live_transport_enabled: false,
      openai_contract_enabled: false,
      descriptor_flag: HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED_ENV,
      adapter_flag: HELIX_REALTIME_SESSION_ADAPTER_ENABLED_ENV,
      live_transport_flag: HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED_ENV,
      openai_contract_flag: HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED_ENV,
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

  it("does not call the injected OpenAI transport unless the explicit contract flag is enabled", async () => {
    const transport = vi.fn(async () => ({ ok: true, providerSessionRef: "provider:should-not-run" }));
    setOpenAiRealtimeContractTransportForTests(transport);
    const env = {
      HELIX_REALTIME_SESSION_ADAPTER_ENABLED: "1",
      HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED: "1",
      OPENAI_API_KEY: "must-not-leak",
    } as NodeJS.ProcessEnv;

    const adapter = selectRealtimeSessionAdapter(env);
    const result = await adapter.createSession({ env });

    expect(adapter).toBe(openAiRealtimeSessionAdapterStub);
    expect(transport).not.toHaveBeenCalled();
    expect(result.openai_network_call_attempted).toBe(false);
    expect(JSON.stringify(result)).not.toContain("must-not-leak");
  });

  it("returns a typed missing-key envelope before any OpenAI transport call", async () => {
    const transport = vi.fn(async () => ({ ok: true, providerSessionRef: "provider:should-not-run" }));
    const env = {
      HELIX_REALTIME_SESSION_ADAPTER_ENABLED: "1",
      HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED: "1",
      HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED: "1",
    } as NodeJS.ProcessEnv;

    const result = await createOpenAiRealtimeSessionAdapter(transport).createSession({
      env,
      body: {
        transport: "webrtc",
        runtime_agent_mode: "live_voice",
        runtime_agent_authority: "suggest_actions",
      },
    });

    expect(transport).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: false,
      adapter_id: "openai_realtime",
      adapter_state: "missing_key",
      blocked_reason: "missing_openai_key",
      provider_session_ref: null,
      openai_network_call_attempted: false,
      ephemeral_credential_minted: false,
      ephemeral_client_secret: null,
      ephemeral_client_secret_expires_at_ms: null,
      transport_plan: expect.objectContaining({
        adapter_id: "openai_realtime",
        adapter_state: "missing_key",
        live_execution_disabled_reason: "missing_openai_key",
      }),
    });
  });

  it("uses an injected OpenAI contract transport and returns only adapter-safe contract metadata", async () => {
    const transport = vi.fn(async () => ({
      ok: true,
      providerSessionRef: "provider:session:adapter",
      ephemeralClientSecret: "ephemeral-secret-internal-only",
      ephemeralClientSecretExpiresAtMs: 1783550000000,
    }));
    const env = {
      HELIX_REALTIME_SESSION_ADAPTER_ENABLED: "1",
      HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED: "1",
      HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED: "1",
      OPENAI_API_KEY: "server-key-must-not-leak",
    } as NodeJS.ProcessEnv;

    const result = await createOpenAiRealtimeSessionAdapter(transport).createSession({
      env,
      body: {
        transport: "webrtc",
        runtime_agent_mode: "live_voice",
        runtime_agent_authority: "suggest_actions",
        selected_model_or_service: "gpt-realtime",
        visible_user_consent_receipt: "receipt:visible-consent:adapter",
      },
    });

    expect(transport).toHaveBeenCalledWith({
      apiKey: "server-key-must-not-leak",
      model: "gpt-realtime",
      requestedTransport: "webrtc",
      runtimeAgentMode: "live_voice",
      runtimeAgentAuthority: "suggest_actions",
      clientReceiptRefs: ["receipt:visible-consent:adapter"],
    });
    expect(result).toMatchObject({
      ok: true,
      adapter_id: "openai_realtime",
      adapter_state: "contract_ready",
      blocked_reason: "openai_realtime_contract_ready",
      provider_session_ref: "provider:session:adapter",
      openai_network_call_attempted: true,
      ephemeral_credential_minted: true,
      ephemeral_client_secret: "ephemeral-secret-internal-only",
      ephemeral_client_secret_expires_at_ms: 1783550000000,
      transport_plan: expect.objectContaining({
        planned_transport: "webrtc",
        adapter_id: "openai_realtime",
        adapter_state: "contract_ready",
        client_secret_requested: true,
        client_secret_issued: true,
        sdp_exchange_requested: true,
        provider_session_ref: "provider:session:adapter",
        ephemeral_client_secret_expires_at_ms: 1783550000000,
      }),
    });
    expect(JSON.stringify(result)).not.toContain("server-key-must-not-leak");
  });

  it("returns a typed contract failure when the injected OpenAI transport rejects the contract", async () => {
    const transport = vi.fn(async () => ({
      ok: false,
      failureReason: "fixture_contract_failure",
    }));
    const env = {
      HELIX_REALTIME_SESSION_ADAPTER_ENABLED: "1",
      HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED: "1",
      HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED: "1",
      OPENAI_API_KEY: "server-key-must-not-leak",
    } as NodeJS.ProcessEnv;

    const result = await createOpenAiRealtimeSessionAdapter(transport).createSession({ env });

    expect(transport).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      ok: false,
      adapter_id: "openai_realtime",
      adapter_state: "contract_failed",
      blocked_reason: "openai_realtime_contract_failed",
      provider_session_ref: null,
      openai_network_call_attempted: true,
      ephemeral_credential_minted: false,
      ephemeral_client_secret: null,
      transport_plan: expect.objectContaining({
        adapter_state: "contract_failed",
        live_execution_disabled_reason: "fixture_contract_failure",
        client_secret_issued: false,
      }),
    });
    expect(JSON.stringify(result)).not.toContain("server-key-must-not-leak");
  });
});
