import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accountSessionRouter } from "../../../../routes/account-session";
import { realtimeSessionRouter } from "../../../../routes/agi.realtime-session";
import { resetAccountSessionStore } from "../../../helix-account/account-session-store";
import { setOpenAiRealtimeContractTransportForTests } from "../adapter";
import { resetRealtimeSessionRegistryForTests } from "../session-registry";
import { setOpenAiRealtimeSdpTransportForTests } from "../sdp-transport";
import { resetStagePlayLiveSourceConversationStoreForTest } from "../../../stage-play/stage-play-live-source-conversation-store";
import { resetRealtimeStagePlayAskHandoffsForTests } from "../../live-source/realtime-stage-play-handoff";

const ENV_KEYS = [
  "HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED",
  "HELIX_REALTIME_SESSION_ADAPTER_ENABLED",
  "HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED",
  "HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED",
  "OPENAI_API_KEY",
] as const;

const priorEnv = new Map<string, string | undefined>();

const createApp = () => {
  const app = express();
  app.use(express.json({ limit: "256kb" }));
  app.use("/api/account", accountSessionRouter);
  app.use("/api/agi", realtimeSessionRouter);
  return app;
};

describe("Realtime SDP route", () => {
  beforeEach(async () => {
    await resetAccountSessionStore();
    resetRealtimeSessionRegistryForTests();
    resetStagePlayLiveSourceConversationStoreForTest();
    resetRealtimeStagePlayAskHandoffsForTests();
    for (const key of ENV_KEYS) priorEnv.set(key, process.env[key]);
    process.env.OPENAI_API_KEY = "server-key-must-not-leak";
    setOpenAiRealtimeContractTransportForTests(async () => ({
      ok: true,
      providerSessionRef: "provider:admission",
      ephemeralClientSecret: "internal-only",
    }));
  });

  afterEach(() => {
    setOpenAiRealtimeContractTransportForTests(null);
    setOpenAiRealtimeSdpTransportForTests(null);
    resetRealtimeSessionRegistryForTests();
    resetStagePlayLiveSourceConversationStoreForTest();
    resetRealtimeStagePlayAskHandoffsForTests();
    for (const key of ENV_KEYS) {
      const value = priorEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    priorEnv.clear();
    vi.restoreAllMocks();
  });

  it("exchanges SDP from the README startup contract for the admitted developer session and matching consent", async () => {
    const sdpTransport = vi.fn(async () => ({
      ok: true,
      answerSdp: "v=0\r\nanswer",
      providerCallRef: "openai-realtime:call:test",
    }));
    setOpenAiRealtimeSdpTransportForTests(sdpTransport);
    const agent = request.agent(createApp());
    await agent.post("/api/account/session/sign-in")
      .send({ profile_id: "profile:developer-realtime-sdp" })
      .expect(200);
    const admission = await agent.post("/api/agi/realtime/session").send({
      runtime_agent_mode: "live_voice",
      runtime_agent_authority: "observe_only",
      transport: "webrtc",
      sdp_exchange_mode: "server",
      selected_model_or_service: "gpt-realtime-2.1",
      selected_realtime_voice: "marin",
      source_binding: {
        thread_id: "helix-ask:desktop",
        focus_panel_id: "docs-viewer",
        document_ref: "docs/research/test.md",
      },
      visible_user_consent_receipt: "receipt:visible-consent:sdp",
    }).expect(200);

    const response = await agent
      .post(`/api/agi/realtime/session/${encodeURIComponent(admission.body.realtime_session_id)}/sdp`)
      .send({
        offer_sdp: "v=0\r\noffer",
        visible_user_consent_receipt: "receipt:visible-consent:sdp",
      })
      .expect(200);

    expect(sdpTransport).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: "server-key-must-not-leak",
      offerSdp: "v=0\r\noffer",
      model: "gpt-realtime-2.1",
      voice: "marin",
    }));
    expect(response.body).toMatchObject({
      schema: "helix.realtime_session.sdp_exchange_response.v1",
      ok: true,
      error: null,
      answer_sdp: "v=0\r\nanswer",
      provider_call_ref: "openai-realtime:call:test",
      openai_network_call_attempted: true,
      webrtc_started: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(JSON.stringify(response.body)).not.toContain("server-key-must-not-leak");
    expect(JSON.stringify(response.body)).not.toContain("internal-only");

    const transcript = await agent
      .post(`/api/agi/realtime/session/${encodeURIComponent(admission.body.realtime_session_id)}/event`)
      .send({
        event_type: "transcript.final",
        event_ref: "provider-event:admitted-transcript",
        transcript_text: "What is currently open in the workstation?",
        observed_at_ms: 1784230000000,
      })
      .expect(200);
    expect(transcript.body).toMatchObject({
      ok: true,
      realtime_stage_play_ask_handoff: {
        schema: "helix.realtime_stage_play.ask_handoff.v1",
        realtime_session_id: admission.body.realtime_session_id,
        provider_event_ref: "provider-event:admitted-transcript",
        read_only: true,
        answer_authority: false,
        terminal_eligible: false,
        route_metadata: {
          source: "realtime_stage_play",
          invocationKind: "stage_play_realtime_transcript_handoff",
          sourceTarget: "operator_text",
          source_target_intent: expect.objectContaining({
            must_enter_backend_ask: true,
            admitted_readonly_handoff: true,
          }),
        },
      },
    });
    expect(JSON.stringify(transcript.body)).not.toContain("What is currently open");
  });

  it("fails closed before OpenAI for absent admission or mismatched consent", async () => {
    const sdpTransport = vi.fn();
    setOpenAiRealtimeSdpTransportForTests(sdpTransport);
    await request(createApp())
      .post("/api/agi/realtime/session/realtime%3Aunknown/sdp")
      .send({ offer_sdp: "v=0\r\noffer", visible_user_consent_receipt: "receipt:none" })
      .expect(403);
    expect(sdpTransport).not.toHaveBeenCalled();
  });
});
