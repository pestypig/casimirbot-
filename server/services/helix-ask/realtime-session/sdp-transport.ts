import crypto from "node:crypto";

const OPENAI_REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";
const OPENAI_REALTIME_CALL_TIMEOUT_MS = 15_000;
const MAX_SDP_CHARS = 256_000;
const DEFAULT_REALTIME_MODEL = "gpt-realtime-2.1";
const DEFAULT_REALTIME_VOICE = "marin";

export type HelixRealtimeSdpTransportRequest = {
  apiKey: string;
  offerSdp: string;
  model?: string | null;
  voice?: string | null;
  safetyIdentifier?: string | null;
};

export type HelixRealtimeSdpTransportResult = {
  ok: boolean;
  answerSdp?: string | null;
  providerCallRef?: string | null;
  failureReason?: string | null;
};

export type HelixRealtimeSdpTransport = (
  request: HelixRealtimeSdpTransportRequest,
) => Promise<HelixRealtimeSdpTransportResult>;

type RealtimeCallsFetch = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: FormData;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
  headers?: { get(name: string): string | null };
}>;

const readSafeToken = (value: unknown, fallback: string): string =>
  typeof value === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(value.trim())
    ? value.trim()
    : fallback;

export const isValidRealtimeOfferSdp = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= MAX_SDP_CHARS &&
  /^v=0(?:\r?\n)/.test(value);

const buildProviderCallRef = (value: string | null): string | null => {
  if (!value) return null;
  const digest = crypto.createHash("sha256").update(value).digest("hex").slice(0, 20);
  return `openai-realtime:call:${digest}`;
};

export const createDefaultOpenAiRealtimeSdpTransport = (
  fetchImpl: RealtimeCallsFetch = globalThis.fetch as RealtimeCallsFetch,
): HelixRealtimeSdpTransport => async (request) => {
  if (typeof fetchImpl !== "function") {
    return { ok: false, failureReason: "openai_realtime_transport_not_configured" };
  }
  if (!isValidRealtimeOfferSdp(request.offerSdp)) {
    return { ok: false, failureReason: "realtime_sdp_offer_invalid" };
  }

  const model = readSafeToken(request.model, DEFAULT_REALTIME_MODEL);
  const voice = readSafeToken(request.voice, DEFAULT_REALTIME_VOICE);
  const session = {
    type: "realtime",
    model,
    instructions:
      "You are Helix's provisional live voice companion. Keep spoken responses brief, make no workstation action or completion claims, and state that Helix is checking when a question needs grounded reasoning. Your audio is never the terminal answer.",
    tools: [],
    tool_choice: "none",
    audio: {
      input: {
        transcription: { model: "gpt-4o-mini-transcribe" },
        turn_detection: {
          type: "semantic_vad",
          create_response: true,
          interrupt_response: true,
        },
      },
      output: { voice },
    },
  };
  const form = new FormData();
  form.set("sdp", request.offerSdp);
  form.set("session", JSON.stringify(session));
  const headers: Record<string, string> = {
    Authorization: `Bearer ${request.apiKey}`,
  };
  if (
    typeof request.safetyIdentifier === "string" &&
    /^[A-Za-z0-9._:-]{8,128}$/.test(request.safetyIdentifier)
  ) {
    headers["OpenAI-Safety-Identifier"] = request.safetyIdentifier;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_REALTIME_CALL_TIMEOUT_MS);
  try {
    const response = await fetchImpl(OPENAI_REALTIME_CALLS_URL, {
      method: "POST",
      headers,
      body: form,
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        ok: false,
        failureReason: `openai_realtime_provider_http_${response.status}`,
      };
    }
    const answerSdp = await response.text();
    if (!isValidRealtimeOfferSdp(answerSdp)) {
      return { ok: false, failureReason: "openai_realtime_answer_sdp_invalid" };
    }
    const callIdentity =
      response.headers?.get("location") ?? response.headers?.get("x-request-id") ?? answerSdp;
    return {
      ok: true,
      answerSdp,
      providerCallRef: buildProviderCallRef(callIdentity),
    };
  } catch (error) {
    const name = error && typeof error === "object" && "name" in error
      ? String((error as { name?: unknown }).name ?? "")
      : "";
    return {
      ok: false,
      failureReason:
        name === "AbortError"
          ? "openai_realtime_transport_timeout"
          : "openai_realtime_transport_network_error",
    };
  } finally {
    clearTimeout(timeout);
  }
};

let injectedTransport: HelixRealtimeSdpTransport | null = null;

export const setOpenAiRealtimeSdpTransportForTests = (
  transport: HelixRealtimeSdpTransport | null,
): void => {
  injectedTransport = transport;
};

export const exchangeOpenAiRealtimeSdp = (
  request: HelixRealtimeSdpTransportRequest,
): Promise<HelixRealtimeSdpTransportResult> =>
  (injectedTransport ?? createDefaultOpenAiRealtimeSdpTransport())(request);
