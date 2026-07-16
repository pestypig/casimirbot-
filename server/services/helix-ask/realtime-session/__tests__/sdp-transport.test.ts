import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDefaultOpenAiRealtimeSdpTransport,
  isValidRealtimeOfferSdp,
} from "../sdp-transport";
import { createOpenAiRealtimeSessionAdapter } from "../adapter";

describe("OpenAI Realtime SDP transport", () => {
  afterEach(() => vi.restoreAllMocks());

  it("posts multipart SDP and a governed GA Realtime session contract", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => "v=0\r\nanswer",
      headers: {
        get: (name: string) => name.toLowerCase() === "location" ? "/v1/realtime/calls/call_123" : null,
      },
    }));
    const result = await createDefaultOpenAiRealtimeSdpTransport(fetchMock)({
      apiKey: "server-key-must-not-leak",
      offerSdp: "v=0\r\noffer",
      model: "gpt-realtime-2.1-mini",
      voice: "marin",
      safetyIdentifier: "requester:realtime:test",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/realtime/calls");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer server-key-must-not-leak",
      "OpenAI-Safety-Identifier": "requester:realtime:test",
    });
    expect(init?.body).toBeInstanceOf(FormData);
    expect(init?.body?.get("sdp")).toBe("v=0\r\noffer");
    const session = JSON.parse(String(init?.body?.get("session")));
    expect(session).toMatchObject({
      type: "realtime",
      model: "gpt-realtime-2.1-mini",
      tool_choice: "none",
      tools: [],
      audio: {
        input: {
          transcription: { model: "gpt-4o-mini-transcribe" },
          turn_detection: {
            type: "semantic_vad",
            create_response: true,
            interrupt_response: true,
          },
        },
        output: { voice: "marin" },
      },
    });
    expect(result).toMatchObject({
      ok: true,
      answerSdp: "v=0\r\nanswer",
      providerCallRef: expect.stringMatching(/^openai-realtime:call:/),
    });
    expect(JSON.stringify(result)).not.toContain("server-key-must-not-leak");
  });

  it("rejects malformed and oversized SDP before fetch", async () => {
    const fetchMock = vi.fn();
    const transport = createDefaultOpenAiRealtimeSdpTransport(fetchMock);
    expect(isValidRealtimeOfferSdp("not-sdp")).toBe(false);
    expect(isValidRealtimeOfferSdp(`v=0\r\n${"x".repeat(256_001)}`)).toBe(false);
    await expect(transport({ apiKey: "secret", offerSdp: "not-sdp" })).resolves.toEqual({
      ok: false,
      failureReason: "realtime_sdp_offer_invalid",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("admits server-SDP mode without minting an unused client secret", async () => {
    const clientSecretTransport = vi.fn();
    const result = await createOpenAiRealtimeSessionAdapter(clientSecretTransport).createSession({
      env: {
        HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED: "1",
        HELIX_REALTIME_SESSION_ADAPTER_ENABLED: "1",
        HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED: "1",
        HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED: "1",
        OPENAI_API_KEY: "server-key-must-not-leak",
      } as NodeJS.ProcessEnv,
      body: {
        transport: "webrtc",
        sdp_exchange_mode: "server",
        selected_model_or_service: "gpt-realtime-2.1",
        visible_user_consent_receipt: "receipt:server-sdp",
      },
    });
    expect(clientSecretTransport).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
      blocked_reason: "openai_realtime_contract_ready",
      openai_network_call_attempted: false,
      ephemeral_credential_minted: false,
      transport_plan: {
        planned_transport: "webrtc",
        adapter_state: "contract_ready",
        client_secret_requested: false,
        client_secret_issued: false,
        sdp_exchange_requested: true,
        live_execution_disabled_reason: "openai_realtime_server_sdp_ready",
      },
    });
    expect(JSON.stringify(result)).not.toContain("server-key-must-not-leak");
  });
});
