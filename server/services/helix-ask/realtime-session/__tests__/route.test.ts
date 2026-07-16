import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accountSessionRouter } from "../../../../routes/account-session";
import { realtimeSessionRouter } from "../../../../routes/agi.realtime-session";
import { resetAccountSessionStore } from "../../../helix-account/account-session-store";
import { setOpenAiRealtimeContractTransportForTests } from "../adapter";
import { buildRealtimeClientReceiptObservation } from "../route-boundary";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "256kb" }));
  app.use("/api/account", accountSessionRouter);
  app.use("/api/agi", realtimeSessionRouter);
  return app;
};

const createDeveloperAgent = async () => {
  const app = createApp();
  const agent = request.agent(app);
  await agent
    .post("/api/account/session/sign-in")
    .send({ profile_id: "profile:developer-realtime-route" })
    .expect(200);
  return agent;
};

const createUserAgent = async () => {
  const app = createApp();
  const agent = request.agent(app);
  await agent
    .post("/api/account/session/sign-in")
    .send({ profile_id: "profile:user-realtime-route", account_type: "user" })
    .expect(200);
  return agent;
};

const expectNonTerminalRealtimeEnvelope = (body: Record<string, unknown>, ok = false) => {
  expect(body).toMatchObject({
    ok,
    lane_id: "realtime_session",
    transport: "none",
    transport_plan: expect.objectContaining({
      schema: "helix.realtime_session.transport_plan.v1",
      planned_transport: "none",
      client_secret_requested: false,
      client_secret_issued: false,
      sdp_exchange_requested: false,
      server_sideband_requested: false,
      provider_session_ref: null,
      live_execution_attempted: false,
      requires_visible_user_gesture: true,
      requires_server_session_response: true,
      requires_client_consent_receipt: true,
    }),
    client_secret_requested: false,
    client_secret_issued: false,
    sdp_exchange_requested: false,
    server_sideband_requested: false,
    provider_session_ref: null,
    openai_network_call_attempted: false,
    ephemeral_credential_minted: false,
    webrtc_started: false,
    sideband_started: false,
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    realtime_runtime_session_summary: expect.objectContaining({
      schema: "helix.live_runtime_agent.control_state.v1",
      transport: "none",
      session_status: expect.any(String),
      live_session_admission_status: expect.any(String),
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      adapter_id: expect.any(String),
      adapter_state: expect.any(String),
      provider_session_ref: null,
      client_receipt_observation_count: expect.any(Number),
      transport_execution_attempted: false,
      media_capture_started: false,
      openai_network_call_attempted: false,
      webrtc_started: false,
      sideband_started: false,
      live_execution_disabled_reason: expect.any(String),
    }),
  });
};

describe("AGI Realtime session route boundary", () => {
  it("normalizes safe client-reported Realtime lifecycle metadata without authority", () => {
    const observation = buildRealtimeClientReceiptObservation({
      realtimeSessionId: "realtime:safe-metadata",
      body: {
        client_receipt_ref: "receipt:response:completed",
        receipt_kind: "response_completed",
        observed_at_ms: 1783549299000,
        selected_model_or_service: "gpt-realtime-2.1-mini",
        provider_session_ref: "provider:session:safe",
        provider_event_type: "response.done",
        provider_response_ref: "response:safe-ref",
        response_status: "completed",
        vad_state: "speech_stopped",
        audio_focus_owner: "helix_realtime",
        qualified_user_interruption: true,
        terminal_voice_interrupted: true,
        barge_in_qualification_basis:
          "browser_echo_cancellation_plus_persistent_provider_vad",
        transport_execution_attempted: true,
        openai_network_call_attempted: true,
        webrtc_started: true,
        media_capture_started: true,
        browser_tracks_created: true,
        data_channels_created: true,
      },
    });

    expect(observation).toMatchObject({
      realtime_session_id: "realtime:safe-metadata",
      selected_model_or_service: "gpt-realtime-2.1-mini",
      provider_session_ref: "provider:session:safe",
      provider_event_type: "response.done",
      provider_response_ref: "response:safe-ref",
      response_status: "completed",
      vad_state: "speech_stopped",
      audio_focus_owner: "helix_realtime",
      qualified_user_interruption: true,
      terminal_voice_interrupted: true,
      client_reported_transport_execution_attempted: true,
      client_reported_openai_network_call_attempted: true,
      client_reported_webrtc_started: true,
      client_reported_media_capture_started: true,
      client_reported_browser_tracks_created: true,
      client_reported_data_channels_created: true,
      openai_network_call_attempted: false,
      webrtc_started: false,
      media_capture_started: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  });
  beforeEach(async () => {
    await resetAccountSessionStore();
  });

  afterEach(() => {
    setOpenAiRealtimeContractTransportForTests(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("locks no-session and user accounts out of Realtime runtime controls", async () => {
    const noSession = await request(createApp())
      .post("/api/agi/realtime/session")
      .send({ runtime_agent_mode: "live_voice" })
      .expect(403);
    expect(noSession.body).toMatchObject({
      schema: "helix.realtime_session.response.v1",
      action: "start",
      error: "realtime_runtime_agent_locked_by_account_policy",
      blocked_reason: "developer_account_required",
      policy_gate: {
        account_type: "user",
        runtime_agent_controls_available: false,
        locked_reason: "developer_account_required",
      },
      account_policy: {
        account_type: "user",
        locked_features: expect.arrayContaining(["runtime_agent_controls"]),
      },
    });
    expectNonTerminalRealtimeEnvelope(noSession.body);

    const userAgent = await createUserAgent();
    const user = await userAgent
      .post("/api/agi/realtime/session")
      .send({ runtime_agent_mode: "live_voice" })
      .expect(403);
    expect(user.body.policy_gate).toMatchObject({
      account_type: "user",
      runtime_agent_controls_available: false,
      locked_reason: "developer_account_required",
    });
    expectNonTerminalRealtimeEnvelope(user.body);
  });

  it("exposes the developer route boundary but keeps live execution disabled", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
      .post("/api/agi/realtime/session")
      .send({
        runtime_agent_mode: "live_voice",
        runtime_agent_authority: "execute_confirmed_actions",
        requested_backend_provider: "realtime_session.openai_realtime",
        selected_model_or_service: "gpt-realtime-placeholder",
        visible_user_consent_receipt: "receipt:visible-consent:test",
      })
      .expect(409);

    expect(response.body).toMatchObject({
      schema: "helix.realtime_session.response.v1",
      action: "start",
      error: "realtime_session_disabled",
      blocked_reason: "capability_lane_disabled_by_policy",
      policy_gate: {
        account_type: "developer",
        runtime_agent_controls_available: true,
        locked_reason: null,
        requested_runtime_agent_mode: "live_voice",
        requested_runtime_agent_authority: "execute_confirmed_actions",
      },
      realtime_runtime_session_summary: expect.objectContaining({
        runtime_agent_mode: "live_voice",
        runtime_agent_authority: "execute_confirmed_actions",
        selected_backend_provider: "realtime_session.openai_realtime",
        selected_model_or_service: "gpt-realtime-placeholder",
        selected_realtime_model: "gpt-realtime-placeholder",
        latest_failure_code: "realtime_adapter_disabled_by_env",
        tool_request_count: 0,
        admitted_tool_request_count: 0,
        blocked_tool_request_count: 0,
        client_receipt_count: 0,
        terminal_authority_status: "not_terminal_authority",
        adapter_id: "disabled",
        adapter_state: "disabled",
        provider_session_ref: null,
        client_receipt_refs: ["receipt:visible-consent:test"],
        live_execution_disabled_reason: "realtime_adapter_disabled_by_env",
      }),
      transport_plan: expect.objectContaining({
        adapter_id: "disabled",
        adapter_state: "disabled",
        client_receipt_refs: ["receipt:visible-consent:test"],
        client_secret_requested: false,
        client_secret_issued: false,
        sdp_exchange_requested: false,
        server_sideband_requested: false,
        provider_session_ref: null,
      }),
    });
    expectNonTerminalRealtimeEnvelope(response.body);
    expect(JSON.stringify(response.body)).not.toContain("OPENAI_API_KEY");
  });

  it("keeps the provider stub non-networked even when adapter and transport flags are enabled", async () => {
    const previousAdapter = process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
    const previousTransport = process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
    const previousKey = process.env.OPENAI_API_KEY;
    process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = "1";
    process.env.OPENAI_API_KEY = "route-secret-must-not-leak";
    try {
      const agent = await createDeveloperAgent();
      const response = await agent
        .post("/api/agi/realtime/session")
        .send({
          runtime_agent_mode: "live_voice",
          runtime_agent_authority: "suggest_actions",
          visible_user_consent_receipt: "receipt:visible-consent:stub",
        })
        .expect(409);

      expect(response.body).toMatchObject({
        error: "realtime_session_disabled",
        blocked_reason: "openai_realtime_adapter_stub_no_live_call",
        transport_plan: expect.objectContaining({
          adapter_id: "openai_realtime_stub",
          adapter_state: "stubbed",
          adapter_enabled: true,
          live_transport_enabled: true,
          live_execution_disabled_reason: "openai_realtime_adapter_stub_no_live_call",
          client_secret_requested: false,
          client_secret_issued: false,
          sdp_exchange_requested: false,
          server_sideband_requested: false,
          provider_session_ref: null,
        }),
        realtime_runtime_session_summary: expect.objectContaining({
          adapter_id: "openai_realtime_stub",
          adapter_state: "stubbed",
          provider_session_ref: null,
          live_execution_disabled_reason: "openai_realtime_adapter_stub_no_live_call",
          client_receipt_refs: ["receipt:visible-consent:stub"],
        }),
        openai_network_call_attempted: false,
        ephemeral_credential_minted: false,
        webrtc_started: false,
        sideband_started: false,
      });
      expect(JSON.stringify(response.body)).not.toContain("route-secret-must-not-leak");
    } finally {
      if (previousAdapter === undefined) {
        delete process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
      } else {
        process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = previousAdapter;
      }
      if (previousTransport === undefined) {
        delete process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
      } else {
        process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = previousTransport;
      }
      if (previousKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = previousKey;
      }
    }
  });

  it("admits the guarded developer live session path when descriptor and adapter flags permit it", async () => {
    const previousDescriptor = process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED;
    const previousAdapter = process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
    const previousTransport = process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
    const previousKey = process.env.OPENAI_API_KEY;
    process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = "0";
    process.env.OPENAI_API_KEY = "admitted-secret-must-not-leak";
    try {
      const agent = await createDeveloperAgent();
      const response = await agent
        .post("/api/agi/realtime/session")
        .send({
          runtime_agent_mode: "live_voice",
          runtime_agent_authority: "suggest_actions",
          transport: "webrtc",
          requested_backend_provider: "realtime_session.openai_realtime",
          selected_model_or_service: "gpt-realtime",
          visible_user_consent_receipt: "receipt:visible-consent:admitted",
        })
        .expect(200);

      expect(response.body).toMatchObject({
        schema: "helix.realtime_session.response.v1",
        ok: true,
        action: "start",
        error: null,
        blocked_reason: null,
        lane_id: "realtime_session",
        transport: "none",
        client_secret_requested: false,
        client_secret_issued: false,
        sdp_exchange_requested: false,
        server_sideband_requested: false,
        provider_session_ref: null,
        openai_network_call_attempted: false,
        ephemeral_credential_minted: false,
        webrtc_started: false,
        sideband_started: false,
        transport_plan: expect.objectContaining({
          requested_transport: "webrtc",
          planned_transport: "none",
          adapter_id: "openai_realtime_stub",
          adapter_state: "stubbed",
          descriptor_enabled: true,
          adapter_enabled: true,
          live_transport_enabled: false,
          live_execution_disabled_reason: "realtime_live_transport_disabled_by_env",
          client_secret_requested: false,
          client_secret_issued: false,
          sdp_exchange_requested: false,
          server_sideband_requested: false,
          provider_session_ref: null,
        }),
        realtime_runtime_session_summary: expect.objectContaining({
          live_session_admission_status: "admitted_stub",
          session_status: "requesting",
          session_lifecycle: [
            "start",
            "realtime_session_admitted_stub",
            "realtime_live_transport_disabled_by_env",
          ],
          runtime_agent_mode: "live_voice",
          runtime_agent_authority: "suggest_actions",
          selected_backend_provider: "realtime_session.openai_realtime",
          selected_model_or_service: "gpt-realtime",
          selected_realtime_model: "gpt-realtime",
          client_receipt_refs: ["receipt:visible-consent:admitted"],
          client_receipt_state: "awaiting_client_receipt",
          latest_failure_code: "realtime_live_transport_disabled_by_env",
          transport_execution_attempted: false,
          media_capture_started: false,
          openai_network_call_attempted: false,
          webrtc_started: false,
          sideband_started: false,
          terminal_authority_status: "not_terminal_authority",
        }),
        realtime_runtime_session_events: [
          expect.objectContaining({
            schema: "helix.realtime_session.lifecycle_event.v1",
            action: "start",
            event_type: "session.admitted_stub",
            admission_status: "admitted_stub",
            transport_execution_attempted: false,
            media_capture_started: false,
            openai_network_call_attempted: false,
            webrtc_started: false,
            sideband_started: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          }),
        ],
        realtime_client_receipt_observations: [],
      });
      expectNonTerminalRealtimeEnvelope(response.body, true);
      expect(JSON.stringify(response.body)).not.toContain("admitted-secret-must-not-leak");
      expect(JSON.stringify(response.body)).not.toContain("OPENAI_API_KEY");
    } finally {
      if (previousDescriptor === undefined) {
        delete process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED;
      } else {
        process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = previousDescriptor;
      }
      if (previousAdapter === undefined) {
        delete process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
      } else {
        process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = previousAdapter;
      }
      if (previousTransport === undefined) {
        delete process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
      } else {
        process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = previousTransport;
      }
      if (previousKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = previousKey;
      }
    }
  });

  it("keeps no-session locked before the OpenAI contract adapter can run", async () => {
    const previousDescriptor = process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED;
    const previousAdapter = process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
    const previousTransport = process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
    const previousContract = process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED;
    const previousKey = process.env.OPENAI_API_KEY;
    const transport = vi.fn(async () => ({
      ok: true,
      providerSessionRef: "provider:session:locked",
      ephemeralClientSecret: "locked-secret-must-not-export",
    }));
    setOpenAiRealtimeContractTransportForTests(transport);
    process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED = "1";
    process.env.OPENAI_API_KEY = "locked-server-key-must-not-leak";
    try {
      const response = await request(createApp())
        .post("/api/agi/realtime/session")
        .send({
          runtime_agent_mode: "live_voice",
          runtime_agent_authority: "suggest_actions",
          transport: "webrtc",
        })
        .expect(403);

      expect(transport).not.toHaveBeenCalled();
      expect(response.body).toMatchObject({
        error: "realtime_runtime_agent_locked_by_account_policy",
        blocked_reason: "developer_account_required",
        openai_network_call_attempted: false,
        ephemeral_credential_minted: false,
        realtime_runtime_session_summary: expect.objectContaining({
          live_session_admission_status: "locked_by_account_policy",
          openai_network_call_attempted: false,
          provider_session_ref: null,
        }),
      });
      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain("locked-server-key-must-not-leak");
      expect(serialized).not.toContain("locked-secret-must-not-export");
    } finally {
      if (previousDescriptor === undefined) delete process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = previousDescriptor;
      if (previousAdapter === undefined) delete process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = previousAdapter;
      if (previousTransport === undefined) delete process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = previousTransport;
      if (previousContract === undefined) delete process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED = previousContract;
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousKey;
    }
  });

  it("returns a typed missing-key envelope for developer OpenAI contract admission", async () => {
    const previousDescriptor = process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED;
    const previousAdapter = process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
    const previousTransport = process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
    const previousContract = process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED;
    const previousKey = process.env.OPENAI_API_KEY;
    const transport = vi.fn(async () => ({
      ok: true,
      providerSessionRef: "provider:session:missing-key",
    }));
    setOpenAiRealtimeContractTransportForTests(transport);
    process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED = "1";
    delete process.env.OPENAI_API_KEY;
    try {
      const agent = await createDeveloperAgent();
      const response = await agent
        .post("/api/agi/realtime/session")
        .send({
          runtime_agent_mode: "live_voice",
          runtime_agent_authority: "suggest_actions",
          transport: "webrtc",
          visible_user_consent_receipt: "receipt:visible-consent:missing-key",
        })
        .expect(409);

      expect(transport).not.toHaveBeenCalled();
      expect(response.body).toMatchObject({
        error: "realtime_session_disabled",
        blocked_reason: "missing_openai_key",
        provider_session_ref: null,
        openai_network_call_attempted: false,
        ephemeral_credential_minted: false,
        transport_plan: expect.objectContaining({
          adapter_id: "openai_realtime",
          adapter_state: "missing_key",
          live_execution_disabled_reason: "missing_openai_key",
        }),
        realtime_runtime_session_summary: expect.objectContaining({
          live_session_admission_status: "missing_openai_key",
          adapter_id: "openai_realtime",
          adapter_state: "missing_key",
          latest_failure_code: "missing_openai_key",
          openai_network_call_attempted: false,
          provider_session_ref: null,
        }),
      });
    } finally {
      if (previousDescriptor === undefined) delete process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = previousDescriptor;
      if (previousAdapter === undefined) delete process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = previousAdapter;
      if (previousTransport === undefined) delete process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = previousTransport;
      if (previousContract === undefined) delete process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED = previousContract;
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousKey;
    }
  });

  it("returns a browser-safe OpenAI Realtime session contract for guarded developer admission", async () => {
    const previousDescriptor = process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED;
    const previousAdapter = process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
    const previousTransport = process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
    const previousContract = process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED;
    const previousKey = process.env.OPENAI_API_KEY;
    const transport = vi.fn(async () => ({
      ok: true,
      providerSessionRef: "provider:session:route",
      ephemeralClientSecret: "route-ephemeral-secret-must-not-debug",
      ephemeralClientSecretExpiresAtMs: 1783550100000,
    }));
    setOpenAiRealtimeContractTransportForTests(transport);
    process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED = "1";
    process.env.OPENAI_API_KEY = "route-server-key-must-not-leak";
    try {
      const agent = await createDeveloperAgent();
      const response = await agent
        .post("/api/agi/realtime/session")
        .send({
          runtime_agent_mode: "live_voice",
          runtime_agent_authority: "suggest_actions",
          transport: "webrtc",
          selected_model_or_service: "gpt-realtime",
          visible_user_consent_receipt: "receipt:visible-consent:route",
        })
        .expect(200);

      expect(transport).toHaveBeenCalledWith({
        apiKey: "route-server-key-must-not-leak",
        model: "gpt-realtime",
        requestedTransport: "webrtc",
        runtimeAgentMode: "live_voice",
        runtimeAgentAuthority: "suggest_actions",
        clientReceiptRefs: ["receipt:visible-consent:route"],
        voice: null,
      });
      expect(response.body).toMatchObject({
        ok: true,
        error: null,
        blocked_reason: null,
        client_secret_requested: true,
        client_secret_issued: true,
        sdp_exchange_requested: true,
        provider_session_ref: "provider:session:route",
        openai_network_call_attempted: true,
        ephemeral_credential_minted: true,
        transport_plan: expect.objectContaining({
          adapter_id: "openai_realtime",
          adapter_state: "contract_ready",
          planned_transport: "webrtc",
          client_secret_requested: true,
          client_secret_issued: true,
          sdp_exchange_requested: true,
          provider_session_ref: "provider:session:route",
          ephemeral_client_secret_expires_at_ms: 1783550100000,
        }),
        realtime_runtime_session_summary: expect.objectContaining({
          live_session_admission_status: "openai_realtime_contract_ready",
          adapter_id: "openai_realtime",
          adapter_state: "contract_ready",
          provider_session_ref: "provider:session:route",
          openai_network_call_attempted: true,
          ephemeral_client_secret_expires_at_ms: 1783550100000,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
        realtime_runtime_session_events: [
          expect.objectContaining({
            event_type: "session.openai_realtime_contract_ready",
            admission_status: "openai_realtime_contract_ready",
            openai_network_call_attempted: true,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          }),
        ],
      });
      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain("route-server-key-must-not-leak");
      expect(serialized).not.toContain("route-ephemeral-secret-must-not-debug");
      expect(serialized).not.toContain("OPENAI_API_KEY");
      expect(serialized).not.toContain("v=0");
    } finally {
      if (previousDescriptor === undefined) delete process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = previousDescriptor;
      if (previousAdapter === undefined) delete process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = previousAdapter;
      if (previousTransport === undefined) delete process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = previousTransport;
      if (previousContract === undefined) delete process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED = previousContract;
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousKey;
    }
  });

  it("uses the default OpenAI client_secrets transport through mocked fetch without leaking secrets", async () => {
    const previousDescriptor = process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED;
    const previousAdapter = process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
    const previousTransport = process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
    const previousContract = process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED;
    const previousKey = process.env.OPENAI_API_KEY;
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "sess_route_default",
        value: "route-default-ephemeral-secret",
        expires_at_ms: 1783551100000,
        raw_provider_response: "raw-provider-json-must-not-export",
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED = "1";
    process.env.OPENAI_API_KEY = "route-default-server-key-must-not-leak";
    try {
      const agent = await createDeveloperAgent();
      const response = await agent
        .post("/api/agi/realtime/session")
        .send({
          runtime_agent_mode: "live_voice",
          runtime_agent_authority: "suggest_actions",
          transport: "webrtc",
          selected_realtime_voice: "marin",
          visible_user_consent_receipt: "receipt:visible-consent:route-default",
        })
        .expect(200);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.openai.com/v1/realtime/client_secrets");
      expect(init).toMatchObject({
        method: "POST",
        headers: {
          Authorization: "Bearer route-default-server-key-must-not-leak",
          "Content-Type": "application/json",
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
      expect(response.body).toMatchObject({
        ok: true,
        client_secret_requested: true,
        client_secret_issued: true,
        provider_session_ref: "sess_route_default",
        openai_network_call_attempted: true,
        ephemeral_credential_minted: true,
        transport_plan: expect.objectContaining({
          adapter_id: "openai_realtime",
          adapter_state: "contract_ready",
          provider_session_ref: "sess_route_default",
          ephemeral_client_secret_expires_at_ms: 1783551100000,
        }),
        realtime_runtime_session_summary: expect.objectContaining({
          live_session_admission_status: "openai_realtime_contract_ready",
          provider_session_ref: "sess_route_default",
          openai_network_call_attempted: true,
          ephemeral_client_secret_expires_at_ms: 1783551100000,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
      });
      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain("route-default-server-key-must-not-leak");
      expect(serialized).not.toContain("route-default-ephemeral-secret");
      expect(serialized).not.toContain("raw-provider-json-must-not-export");
      expect(serialized).not.toContain("OPENAI_API_KEY");
      expect(serialized).not.toContain("v=0");
    } finally {
      if (previousDescriptor === undefined) delete process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = previousDescriptor;
      if (previousAdapter === undefined) delete process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = previousAdapter;
      if (previousTransport === undefined) delete process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = previousTransport;
      if (previousContract === undefined) delete process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED = previousContract;
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousKey;
    }
  });

  it("returns a typed OpenAI Realtime contract failure envelope without leaking provider payloads", async () => {
    const previousDescriptor = process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED;
    const previousAdapter = process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
    const previousTransport = process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
    const previousContract = process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED;
    const previousKey = process.env.OPENAI_API_KEY;
    const transport = vi.fn(async () => ({
      ok: false,
      failureReason: "fixture_contract_failure",
      providerSessionRef: "provider:should-not-export",
      ephemeralClientSecret: "failed-secret-must-not-export",
    }));
    setOpenAiRealtimeContractTransportForTests(transport);
    process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = "1";
    process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED = "1";
    process.env.OPENAI_API_KEY = "failure-server-key-must-not-leak";
    try {
      const agent = await createDeveloperAgent();
      const response = await agent
        .post("/api/agi/realtime/session")
        .send({
          runtime_agent_mode: "live_voice",
          runtime_agent_authority: "suggest_actions",
          transport: "webrtc",
        })
        .expect(409);

      expect(transport).toHaveBeenCalledTimes(1);
      expect(response.body).toMatchObject({
        error: "realtime_openai_contract_failed",
        blocked_reason: "openai_realtime_contract_failed",
        provider_session_ref: null,
        openai_network_call_attempted: true,
        ephemeral_credential_minted: false,
        transport_plan: expect.objectContaining({
          adapter_id: "openai_realtime",
          adapter_state: "contract_failed",
          live_execution_disabled_reason: "fixture_contract_failure",
          client_secret_issued: false,
        }),
        realtime_runtime_session_summary: expect.objectContaining({
          live_session_admission_status: "openai_realtime_contract_failed",
          latest_failure_code: "openai_realtime_contract_failed",
          provider_session_ref: null,
          openai_network_call_attempted: true,
        }),
      });
      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain("failure-server-key-must-not-leak");
      expect(serialized).not.toContain("failed-secret-must-not-export");
      expect(serialized).not.toContain("provider:should-not-export");
      expect(serialized).not.toContain("OPENAI_API_KEY");
    } finally {
      if (previousDescriptor === undefined) delete process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = previousDescriptor;
      if (previousAdapter === undefined) delete process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = previousAdapter;
      if (previousTransport === undefined) delete process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = previousTransport;
      if (previousContract === undefined) delete process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED;
      else process.env.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED = previousContract;
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousKey;
    }
  });

  it("keeps stop, client receipt, and event routes non-terminal while disabled", async () => {
    const agent = await createDeveloperAgent();
    const stop = await agent
      .post("/api/agi/realtime/session/realtime:test/stop")
      .send({ runtime_agent_mode: "live_voice", runtime_agent_authority: "suggest_actions" })
      .expect(409);
    const receipt = await agent
      .post("/api/agi/realtime/session/realtime:test/client-receipt")
      .send({
        runtime_agent_mode: "live_voice",
        runtime_agent_authority: "execute_confirmed_actions",
        client_receipt_ref: "receipt:client:test",
        receipt_kind: "mic_permission_granted",
        status: "granted",
        lifecycle_state: "requesting",
        observed_at_ms: 1783549300000,
      })
      .expect(200);
    const event = await agent
      .post("/api/agi/realtime/session/realtime:test/event")
      .send({
        runtime_agent_mode: "live_transcription",
        event_type: "transcript.delta",
        event_ref: "event:realtime:test",
      })
      .expect(409);

    for (const body of [stop.body, event.body]) {
      expect(body).toMatchObject({
        error: "realtime_session_disabled",
        blocked_reason: "capability_lane_disabled_by_policy",
        realtime_session_id: "realtime:test",
      });
      expectNonTerminalRealtimeEnvelope(body);
    }
    expect(stop.body).toMatchObject({
      schema: "helix.realtime_session.response.v1",
      action: "stop",
    });
    expect(receipt.body).toMatchObject({
      schema: "helix.realtime_session.client_receipt_response.v1",
      action: "record_client_receipt",
      ok: true,
      error: null,
      blocked_reason: null,
      realtime_runtime_session_summary: expect.objectContaining({
        live_session_admission_status: "receipt_recorded",
        client_receipt_count: 1,
        client_receipt_observation_count: 1,
        client_receipt_state: "received",
        latest_client_receipt_ref: "receipt:client:test",
        latest_client_receipt_kind: "mic_permission_granted",
        latest_client_receipt_status: "granted",
        runtime_agent_authority: "execute_confirmed_actions",
        realtime_reentry_status: "observation_packet_required_for_provider_reentry",
      }),
      realtime_client_receipt_observations: [
        expect.objectContaining({
          schema: "helix.realtime.client_receipt_observation.v1",
          realtime_session_id: "realtime:test",
          runtime_agent_mode: "live_voice",
          runtime_agent_authority: "execute_confirmed_actions",
          receipt_kind: "mic_permission_granted",
          lifecycle_state: "requesting",
          status: "granted",
          observed_at_ms: 1783549300000,
          client_receipt_ref: "receipt:client:test",
          openai_network_call_attempted: false,
          ephemeral_credential_minted: false,
          webrtc_started: false,
          sideband_started: false,
          media_capture_started: false,
          browser_media_api_referenced: false,
          browser_tracks_created: false,
          data_channels_created: false,
          reentry_status: "pending_solver_reentry",
          observation_reentered: false,
          context_role: "tool_evidence",
          reentry_required: true,
          answer_authority: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
      ],
    });
    expect(event.body).toMatchObject({
      schema: "helix.realtime_session.event_response.v1",
      action: "record_event",
      ok: false,
      realtime_runtime_session_summary: expect.objectContaining({
        runtime_agent_mode: "live_transcription",
        runtime_agent_authority: "observe_only",
      }),
    });
  });

  it("records deterministic transcript events as non-terminal observations", async () => {
    const agent = await createDeveloperAgent();
    const transcriptText = "turn on the lights later, not now";
    const response = await agent
      .post("/api/agi/realtime/session/realtime:transcript:event/event")
      .send({
        runtime_agent_mode: "live_transcription",
        event_type: "transcript.final",
        event_ref: "event:realtime:transcript-final",
        transcript_text: transcriptText,
        source_binding: {
          source_id: "mic:developer-visible",
          source_kind: "audio",
          source_hash: "sha256:source-visible",
        },
        observed_at_ms: 1783549000000,
        client_receipt_ref: "receipt:client:transcript-final",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      schema: "helix.realtime_session.event_response.v1",
      ok: true,
      action: "record_event",
      error: null,
      blocked_reason: null,
      realtime_session_id: "realtime:transcript:event",
      realtime_runtime_session_summary: expect.objectContaining({
        runtime_agent_mode: "live_transcription",
        runtime_agent_authority: "observe_only",
        transcript_observation_count: 1,
        latest_transcript_event_type: "transcript.final",
        latest_transcript_observation_ref: "event:realtime:transcript-final",
        latest_lifecycle_event_ref: expect.stringMatching(/^event:realtime:lifecycle:[a-f0-9]{16}$/),
        realtime_reentry_status: "observation_packet_required_for_provider_reentry",
        client_receipt_count: 1,
        client_receipt_state: "received",
        latest_failure_code: null,
        terminal_authority_status: "not_terminal_authority",
        tool_admission_state: "observe_only",
      }),
      realtime_transcript_observations: [
        expect.objectContaining({
          schema: "helix.realtime.transcript_observation.v1",
          observation_ref: "event:realtime:transcript-final",
          realtime_session_id: "realtime:transcript:event",
          runtime_agent_mode: "live_transcription",
          runtime_agent_authority: "observe_only",
          event_type: "transcript.final",
          source_binding: {
            source_id: "mic:developer-visible",
            source_kind: "audio",
            source_hash: "sha256:source-visible",
          },
          source_id: "mic:developer-visible",
          source_kind: "audio",
          source_hash: "sha256:source-visible",
          transcript_text_hash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
          transcript_text_char_count: transcriptText.length,
          observed_at_ms: 1783549000000,
          client_receipt_ref: "receipt:client:transcript-final",
          reentry_status: "pending_solver_reentry",
          observation_reentered: false,
          context_role: "tool_evidence",
          transcript_is_user_intent: false,
          reentry_required: true,
          answer_authority: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
      ],
      realtime_runtime_session_events: [
        expect.objectContaining({
          schema: "helix.realtime_session.lifecycle_event.v1",
          lifecycle_event_ref: expect.stringMatching(/^event:realtime:lifecycle:[a-f0-9]{16}$/),
          observation_ref: "event:realtime:transcript-final",
          client_receipt_ref: "receipt:client:transcript-final",
          reentry_status: "pending_solver_reentry",
          observation_reentered: false,
          context_role: "tool_evidence",
          reentry_required: true,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
      ],
      realtime_reentry_status: "observation_packet_required_for_provider_reentry",
    });
    expectNonTerminalRealtimeEnvelope(response.body, true);
    expect(JSON.stringify(response.body)).not.toContain(transcriptText);
    expect(response.body).toMatchObject({
      openai_network_call_attempted: false,
      ephemeral_credential_minted: false,
      webrtc_started: false,
      sideband_started: false,
    });
  });

  it.each([
    {
      label: "quoted command",
      transcriptText: 'she said "open the postulate board" but I am only quoting her',
    },
    {
      label: "negated command",
      transcriptText: "do not open the calculator or change any workstation panel",
    },
    {
      label: "future conditional command",
      transcriptText: "if I ask later, maybe open the moral graph then",
    },
    {
      label: "historical command",
      transcriptText: "yesterday I asked it to open image lens during a test",
    },
    {
      label: "mixed intent",
      transcriptText: "summarize this note, and the phrase click save is just part of the transcript",
    },
  ])("keeps adversarial transcript cue as evidence only: $label", async ({ label, transcriptText }) => {
    const agent = await createDeveloperAgent();
    const response = await agent
      .post(`/api/agi/realtime/session/realtime:adversarial:${encodeURIComponent(label)}/event`)
      .send({
        runtime_agent_mode: "live_transcription",
        runtime_agent_authority: "execute_confirmed_actions",
        event_type: "transcript.final",
        transcript_text: transcriptText,
        source_binding: {
          source_id: `mic:${label}`,
          source_kind: "audio",
          source_hash: `sha256:${label.replace(/\W+/g, "-")}`,
        },
        observed_at_ms: 1783549100000,
        client_receipt_ref: `receipt:client:${label.replace(/\W+/g, "-")}`,
        workstation_action_args: {
          action_id: "must_not_execute",
          transcript_text: transcriptText,
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      action: "record_event",
      realtime_reentry_status: "observation_packet_required_for_provider_reentry",
      openai_network_call_attempted: false,
      ephemeral_credential_minted: false,
      webrtc_started: false,
      sideband_started: false,
      realtime_runtime_session_summary: expect.objectContaining({
        runtime_agent_mode: "live_transcription",
        runtime_agent_authority: "execute_confirmed_actions",
        tool_admission_state: "observe_only",
        tool_request_count: 0,
        admitted_tool_request_count: 0,
        blocked_tool_request_count: 0,
        terminal_authority_status: "not_terminal_authority",
        realtime_reentry_status: "observation_packet_required_for_provider_reentry",
      }),
      realtime_transcript_observations: [
        expect.objectContaining({
          runtime_agent_mode: "live_transcription",
          runtime_agent_authority: "execute_confirmed_actions",
          transcript_text_hash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
          transcript_text_char_count: transcriptText.length,
          transcript_is_user_intent: false,
          reentry_status: "pending_solver_reentry",
          observation_reentered: false,
          context_role: "tool_evidence",
          reentry_required: true,
          answer_authority: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
      ],
    });
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain(transcriptText);
    expect(serialized).not.toContain("must_not_execute");
    expect(serialized).not.toContain("workstation_action_args");
  });

  it("records explicit Realtime tool suggestions as candidate-only observations", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
      .post("/api/agi/realtime/session/realtime:suggestion:event/event")
      .send({
        runtime_agent_mode: "live_voice",
        runtime_agent_authority: "suggest_actions",
        event_type: "tool.suggestion",
        event_ref: "suggestion:realtime:read-only",
        suggested_capability_id: "workstation.docs_viewer.inspect_selection",
        source_observation_ref: "obs:realtime:transcript:prior",
        client_receipt_ref: "receipt:client:suggestion",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      action: "record_event",
      realtime_reentry_status: "observation_packet_required_for_provider_reentry",
      realtime_runtime_session_summary: expect.objectContaining({
        runtime_agent_mode: "live_voice",
        runtime_agent_authority: "suggest_actions",
        tool_admission_state: "suggest_only",
        tool_request_count: 1,
        admitted_tool_request_count: 0,
        blocked_tool_request_count: 0,
        latest_tool_suggestion_ref: "suggestion:realtime:read-only",
        latest_tool_suggestion_admission_status: "candidate_only",
        terminal_authority_status: "not_terminal_authority",
        realtime_reentry_status: "observation_packet_required_for_provider_reentry",
      }),
      realtime_tool_suggestion_observations: [
        expect.objectContaining({
          schema: "helix.realtime.tool_suggestion_observation.v1",
          suggestion_ref: "suggestion:realtime:read-only",
          realtime_session_id: "realtime:suggestion:event",
          runtime_agent_mode: "live_voice",
          runtime_agent_authority: "suggest_actions",
          event_type: "tool.suggestion",
          suggested_capability_id: "workstation.docs_viewer.inspect_selection",
          suggested_action_id: null,
          source_observation_ref: "obs:realtime:transcript:prior",
          client_receipt_ref: "receipt:client:suggestion",
          tool_admission_state: "suggest_only",
          admission_status: "candidate_only",
          blocked_reason: null,
          reentry_status: "pending_solver_reentry",
          observation_reentered: false,
          context_role: "tool_evidence",
          execution_attempted: false,
          gateway_execution_attempted: false,
          workstation_action_executed: false,
          reentry_required: true,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
      ],
      realtime_runtime_session_events: [
        expect.objectContaining({
          schema: "helix.realtime_session.lifecycle_event.v1",
          lifecycle_event_ref: expect.stringMatching(/^event:realtime:lifecycle:[a-f0-9]{16}$/),
          suggestion_ref: "suggestion:realtime:read-only",
          admission_status: "candidate_only",
          reentry_required: true,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
      ],
      realtime_transcript_observations: [],
      openai_network_call_attempted: false,
      ephemeral_credential_minted: false,
      webrtc_started: false,
      sideband_started: false,
    });
    expectNonTerminalRealtimeEnvelope(response.body, true);
  });

  it.each([
    {
      label: "quoted tool cue",
      transcriptText: 'the screen says "open calculator", but that is quoted text',
    },
    {
      label: "negated tool cue",
      transcriptText: "do not inspect the docs viewer right now",
    },
    {
      label: "future conditional tool cue",
      transcriptText: "if I approve later, inspect the selected equation",
    },
    {
      label: "historical tool cue",
      transcriptText: "last week the runtime suggested opening the graph",
    },
    {
      label: "screen visible tool cue",
      transcriptText: "the visible button says run calculator",
    },
    {
      label: "mixed intent tool cue",
      transcriptText: "explain the panel; words like run action are part of the transcript",
    },
  ])("does not convert transcript cue into a suggestion: $label", async ({ label, transcriptText }) => {
    const agent = await createDeveloperAgent();
    const response = await agent
      .post(`/api/agi/realtime/session/realtime:cue:${encodeURIComponent(label)}/event`)
      .send({
        runtime_agent_mode: "live_transcription",
        runtime_agent_authority: "execute_confirmed_actions",
        event_type: "transcript.final",
        transcript_text: transcriptText,
        suggested_capability_id: "workstation.calculator.run",
        suggested_action_id: "run_calculator",
        observed_at_ms: 1783549200000,
        client_receipt_ref: `receipt:cue:${label.replace(/\W+/g, "-")}`,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      realtime_runtime_session_summary: expect.objectContaining({
        runtime_agent_mode: "live_transcription",
        runtime_agent_authority: "execute_confirmed_actions",
        tool_admission_state: "observe_only",
        tool_request_count: 0,
        admitted_tool_request_count: 0,
        blocked_tool_request_count: 0,
        latest_tool_suggestion_ref: null,
        latest_tool_suggestion_admission_status: null,
      }),
      realtime_tool_suggestion_observations: [],
      realtime_transcript_observations: [
        expect.objectContaining({
          transcript_text_hash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
          transcript_text_char_count: transcriptText.length,
          transcript_is_user_intent: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
      ],
    });
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain(transcriptText);
    expect(serialized).not.toContain("workstation.calculator.run");
    expect(serialized).not.toContain("run_calculator");
  });
});
