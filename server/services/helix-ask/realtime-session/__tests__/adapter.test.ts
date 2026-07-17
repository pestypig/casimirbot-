import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createOpenAiRealtimeSessionAdapter,
  createDefaultOpenAiRealtimeContractTransport,
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
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("derives the default feature gate from the normal OpenAI startup key", () => {
    const disabledGate = readRealtimeSessionFeatureGate({} as NodeJS.ProcessEnv);

    expect(disabledGate).toEqual({
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

    const keyedEnv = { OPENAI_API_KEY: "normal-startup-key" } as NodeJS.ProcessEnv;
    expect(readRealtimeSessionFeatureGate(keyedEnv)).toMatchObject({
      descriptor_enabled: true,
      adapter_enabled: true,
      live_transport_enabled: true,
      openai_contract_enabled: true,
    });
    expect(selectRealtimeSessionAdapter(keyedEnv).id).toBe("openai_realtime");

    const killedEnv = {
      OPENAI_API_KEY: "normal-startup-key",
      HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED: "0",
    } as NodeJS.ProcessEnv;
    expect(readRealtimeSessionFeatureGate(killedEnv)).toMatchObject({
      descriptor_enabled: true,
      adapter_enabled: true,
      live_transport_enabled: false,
      openai_contract_enabled: true,
    });
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
      HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED: "0",
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

  it("does not call the injected OpenAI transport when the contract kill switch is disabled", async () => {
    const transport = vi.fn(async () => ({ ok: true, providerSessionRef: "provider:should-not-run" }));
    setOpenAiRealtimeContractTransportForTests(transport);
    const env = {
      HELIX_REALTIME_SESSION_ADAPTER_ENABLED: "1",
      HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED: "1",
      HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED: "0",
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
      voice: null,
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

  it("calls OpenAI client_secrets with the GA realtime session shape through the default transport", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "sess_adapter_default",
        value: "ephemeral-default-secret",
        expires_at: 1783551000,
      }),
    }));
    const transport = createDefaultOpenAiRealtimeContractTransport(fetchMock);

    const result = await transport({
      apiKey: "server-key-must-not-leak",
      model: "gpt-realtime-2.1",
      requestedTransport: "webrtc",
      runtimeAgentMode: "live_voice",
      runtimeAgentAuthority: "suggest_actions",
      clientReceiptRefs: ["receipt:visible-consent:default"],
      safetyIdentifier: "hashed-user-id",
      voice: "marin",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/realtime/client_secrets");
    expect(init).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer server-key-must-not-leak",
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": "hashed-user-id",
      },
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      session: {
        type: "realtime",
        model: "gpt-realtime-2.1",
        audio: {
          output: {
            voice: "marin",
          },
        },
      },
    });
    expect(result).toEqual({
      ok: true,
      providerSessionRef: "sess_adapter_default",
      ephemeralClientSecret: "ephemeral-default-secret",
      ephemeralClientSecretExpiresAtMs: 1783551000000,
    });
    expect(JSON.stringify(result)).not.toContain("server-key-must-not-leak");
  });

  it("does not send unsafe OpenAI safety identifiers", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        value: "ephemeral-default-secret",
        expires_at_ms: 1783551000000,
      }),
    }));

    await createDefaultOpenAiRealtimeContractTransport(fetchMock)({
      apiKey: "server-key-must-not-leak",
      model: "gpt-realtime-2.1",
      requestedTransport: "webrtc",
      runtimeAgentMode: "live_voice",
      runtimeAgentAuthority: "suggest_actions",
      clientReceiptRefs: [],
      safetyIdentifier: "not safe from browser",
      voice: null,
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.headers).not.toHaveProperty("OpenAI-Safety-Identifier");
  });

  it("returns a typed failure for non-2xx OpenAI client_secrets responses without raw provider leakage", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 429,
      json: async () => ({
        error: {
          message: "raw provider quota body must not leak",
        },
      }),
    }));

    const result = await createDefaultOpenAiRealtimeContractTransport(fetchMock)({
      apiKey: "server-key-must-not-leak",
      model: "gpt-realtime-2.1",
      requestedTransport: "webrtc",
      runtimeAgentMode: null,
      runtimeAgentAuthority: null,
      clientReceiptRefs: [],
    });

    expect(result).toEqual({
      ok: false,
      failureReason: "openai_realtime_provider_http_429",
    });
    expect(JSON.stringify(result)).not.toContain("raw provider quota body must not leak");
    expect(JSON.stringify(result)).not.toContain("server-key-must-not-leak");
  });

  it("returns a typed failure for malformed OpenAI client_secrets responses", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "sess_missing_secret",
        raw_provider_response: "must-not-leak",
      }),
    }));

    const result = await createDefaultOpenAiRealtimeContractTransport(fetchMock)({
      apiKey: "server-key-must-not-leak",
      model: "gpt-realtime-2.1",
      requestedTransport: "webrtc",
      runtimeAgentMode: null,
      runtimeAgentAuthority: null,
      clientReceiptRefs: [],
    });

    expect(result).toEqual({
      ok: false,
      failureReason: "openai_realtime_client_secret_missing",
    });
    expect(JSON.stringify(result)).not.toContain("must-not-leak");
  });

  it("returns typed failures for OpenAI client_secrets network and timeout errors", async () => {
    const networkFetch = vi.fn(async () => {
      throw new Error("raw network detail must not leak");
    });
    const timeoutFetch = vi.fn(async () => {
      const error = new Error("raw timeout detail must not leak");
      error.name = "AbortError";
      throw error;
    });
    const request = {
      apiKey: "server-key-must-not-leak",
      model: "gpt-realtime-2.1",
      requestedTransport: "webrtc" as const,
      runtimeAgentMode: null,
      runtimeAgentAuthority: null,
      clientReceiptRefs: [],
    };

    const networkResult = await createDefaultOpenAiRealtimeContractTransport(networkFetch)(request);
    const timeoutResult = await createDefaultOpenAiRealtimeContractTransport(timeoutFetch)(request);

    expect(networkResult).toEqual({
      ok: false,
      failureReason: "openai_realtime_transport_network_error",
    });
    expect(timeoutResult).toEqual({
      ok: false,
      failureReason: "openai_realtime_transport_timeout",
    });
    expect(JSON.stringify([networkResult, timeoutResult])).not.toContain("raw");
    expect(JSON.stringify([networkResult, timeoutResult])).not.toContain("server-key-must-not-leak");
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
