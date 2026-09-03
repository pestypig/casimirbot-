import crypto from "node:crypto";
import {
  buildHelixRealtimeProviderSession,
  HELIX_REALTIME_PROVISIONAL_POLICY,
} from "@shared/helix-realtime-session";
import {
  readDesktopOpenAiRealtimeBrokerConfig,
  type DesktopOpenAiRealtimeBrokerConfig,
} from "./adapter";

const OPENAI_REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";
const OPENAI_REALTIME_CALL_TIMEOUT_MS = 15_000;
const MAX_SDP_CHARS = 256_000;
const DEFAULT_REALTIME_MODEL = "gpt-realtime-2.1";
const DEFAULT_REALTIME_VOICE = "marin";
export { HELIX_REALTIME_PROVISIONAL_POLICY };

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
  /** Server-private OpenAI call identifier. Never serialize this field to clients. */
  providerCallId?: string | null;
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
    body?: FormData | string;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
  headers?: { get(name: string): string | null };
}>;

type OpenAiCredentialProbeFetch = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
}>;

export type OpenAiApiCredentialProbeStatus =
  | "accepted"
  | "authentication_failed"
  | "access_forbidden"
  | "rate_limited"
  | `provider_http_${number}`
  | "timeout"
  | "network_error";

export const probeOpenAiApiCredential = async (input: {
  apiKey: string;
  fetchImpl?: OpenAiCredentialProbeFetch;
  timeoutMs?: number;
}): Promise<OpenAiApiCredentialProbeStatus> => {
  const fetchImpl = input.fetchImpl ?? globalThis.fetch as OpenAiCredentialProbeFetch;
  if (typeof fetchImpl !== "function") return "network_error";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 5_000);
  try {
    const response = await fetchImpl("https://api.openai.com/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${input.apiKey}` },
      signal: controller.signal,
    });
    if (response.ok) return "accepted";
    if (response.status === 401) return "authentication_failed";
    if (response.status === 403) return "access_forbidden";
    if (response.status === 429) return "rate_limited";
    return `provider_http_${response.status}`;
  } catch (error) {
    const name = error && typeof error === "object" && "name" in error
      ? String((error as { name?: unknown }).name ?? "")
      : "";
    return name === "AbortError" ? "timeout" : "network_error";
  } finally {
    clearTimeout(timeout);
  }
};

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

const failureReasonForProviderStatus = (status: number): string => {
  if (status === 401) return "openai_realtime_authentication_failed";
  if (status === 403) return "openai_realtime_access_forbidden";
  if (status === 429) return "openai_realtime_rate_limited";
  return `openai_realtime_provider_http_${status}`;
};

const readSafeProviderErrorCode = (payload: string): string | null => {
  try {
    const parsed = JSON.parse(payload) as { error?: { code?: unknown; type?: unknown } };
    const candidate = typeof parsed.error?.code === "string"
      ? parsed.error.code
      : typeof parsed.error?.type === "string"
        ? parsed.error.type
        : null;
    return candidate && /^[a-z0-9._-]{1,96}$/i.test(candidate) ? candidate.toLowerCase() : null;
  } catch {
    return null;
  }
};

const providerFailureReason = (status: number, payload: string): string => {
  const baseReason = failureReasonForProviderStatus(status);
  const providerCode = readSafeProviderErrorCode(payload);
  return providerCode ? `${baseReason}_${providerCode}` : baseReason;
};

export const readOpenAiRealtimeProviderCallId = (value: string | null): string | null => {
  if (!value) return null;
  const match = value.match(/(?:^|\/)(rtc_[A-Za-z0-9_-]{6,160})(?:[/?#]|$)/);
  return match?.[1] ?? (/^rtc_[A-Za-z0-9_-]{6,160}$/.test(value) ? value : null);
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
  const session = buildHelixRealtimeProviderSession(model, voice);
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
      const providerErrorPayload = await response.text().catch(() => "");
      return {
        ok: false,
        failureReason: providerFailureReason(response.status, providerErrorPayload),
      };
    }
    const answerSdp = await response.text();
    if (!isValidRealtimeOfferSdp(answerSdp)) {
      return { ok: false, failureReason: "openai_realtime_answer_sdp_invalid" };
    }
    const location = response.headers?.get("location") ?? null;
    const providerCallId = readOpenAiRealtimeProviderCallId(location);
    const callIdentity = providerCallId ?? location ?? response.headers?.get("x-request-id") ?? answerSdp;
    return {
      ok: true,
      answerSdp,
      providerCallRef: buildProviderCallRef(callIdentity),
      providerCallId,
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

export const createDesktopBrokerOpenAiRealtimeSdpTransport = (
  config: DesktopOpenAiRealtimeBrokerConfig,
  fetchImpl: RealtimeCallsFetch = globalThis.fetch as RealtimeCallsFetch,
): HelixRealtimeSdpTransport => async (request) => {
  if (typeof fetchImpl !== "function") {
    return { ok: false, failureReason: "openai_realtime_transport_not_configured" };
  }
  if (!isValidRealtimeOfferSdp(request.offerSdp)) {
    return { ok: false, failureReason: "realtime_sdp_offer_invalid" };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_REALTIME_CALL_TIMEOUT_MS);
  try {
    const response = await fetchImpl(`${config.origin}/v1/openai/realtime/sdp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offerSdp: request.offerSdp,
        model: readSafeToken(request.model, DEFAULT_REALTIME_MODEL),
        voice: readSafeToken(request.voice, DEFAULT_REALTIME_VOICE),
        safetyIdentifier: request.safetyIdentifier,
      }),
      signal: controller.signal,
    });
    const payloadText = await response.text().catch(() => "");
    let payload: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(payloadText) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        payload = parsed as Record<string, unknown>;
      }
    } catch {
      return { ok: false, failureReason: "openai_realtime_broker_response_invalid" };
    }
    if (
      !response.ok ||
      payload.schema !== "casimir_desktop_provider_credential_broker/1" ||
      payload.ok !== true
    ) {
      return {
        ok: false,
        failureReason: typeof payload.error === "string" &&
          /^[a-z0-9._:-]{1,160}$/iu.test(payload.error)
          ? payload.error
          : `openai_realtime_broker_http_${response.status}`,
      };
    }
    const answerSdp = typeof payload.answerSdp === "string"
      ? payload.answerSdp
      : "";
    if (!isValidRealtimeOfferSdp(answerSdp)) {
      return { ok: false, failureReason: "openai_realtime_answer_sdp_invalid" };
    }
    const providerCallId = typeof payload.providerCallId === "string" &&
      /^rtc_[A-Za-z0-9_-]{6,160}$/u.test(payload.providerCallId)
      ? payload.providerCallId
      : null;
    return {
      ok: true,
      answerSdp,
      providerCallId,
      providerCallRef: buildProviderCallRef(providerCallId ?? answerSdp),
    };
  } catch (error) {
    const name = error && typeof error === "object" && "name" in error
      ? String((error as { name?: unknown }).name ?? "")
      : "";
    return {
      ok: false,
      failureReason: name === "AbortError"
        ? "openai_realtime_broker_timeout"
        : "openai_realtime_broker_unavailable",
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
  env: NodeJS.ProcessEnv = process.env,
): Promise<HelixRealtimeSdpTransportResult> => {
  if (injectedTransport) return injectedTransport(request);
  if (request.apiKey.trim()) {
    return createDefaultOpenAiRealtimeSdpTransport()(request);
  }
  const broker = readDesktopOpenAiRealtimeBrokerConfig(env);
  return broker
    ? createDesktopBrokerOpenAiRealtimeSdpTransport(broker)(request)
    : Promise.resolve({ ok: false, failureReason: "missing_openai_key" });
};
