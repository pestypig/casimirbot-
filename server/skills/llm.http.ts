import crypto from "node:crypto";
import { EssenceEnvelope } from "@shared/essence-schema";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { putEnvelopeWithPolicy } from "./provenance";
import { putBlob } from "../storage";
import { assertHullAllowed } from "../security/hull-guard";

const DEFAULT_LLM_HTTP_RPM = Math.max(1, Number(process.env.LLM_HTTP_RPM ?? 60));

export type LlmHttpErrorClass =
  | "rate_limited"
  | "timeout"
  | "transport"
  | "server_error"
  | "auth_error"
  | "client_error"
  | "circuit_open"
  | "context_limit"
  | "backend_unavailable"
  | "unknown";

export type LlmHttpRateLimitSource = "provider_429" | "local_cooldown";
export type LlmHttpRateLimitKind =
  | "requests_per_minute"
  | "tokens_per_minute"
  | "quota"
  | "concurrency"
  | "unknown";

export type LlmHttpErrorInfo = {
  code?: string;
  message: string;
  errorClass: LlmHttpErrorClass;
  status?: number;
  retryAfterMs?: number;
  timeoutMs?: number;
  maxTokensRequested?: number;
  maxTokensEffective?: number;
  transient: boolean;
  breakerFailure: boolean;
  circuitOpen: boolean;
  circuitRemainingMs?: number;
  providerCalled?: boolean;
  rateLimitSource?: LlmHttpRateLimitSource;
  rateLimitKind?: LlmHttpRateLimitKind;
  providerRequestId?: string;
  providerRetryAfterRaw?: string;
  providerErrorText?: string;
  providerRateLimitHeaders?: Record<string, string>;
  promptMessagesCount?: number;
  promptChars?: number;
  promptTokensEstimate?: number;
  requestBodyBytes?: number;
};

export const llmHttpSpec: ToolSpecShape = {
  name: "llm.http.generate",
  desc: "LLM via OpenAI-compatible Chat Completions HTTP",
  inputSchema: {} as any,
  outputSchema: {} as any,
  deterministic: false,
  rateLimit: { rpm: DEFAULT_LLM_HTTP_RPM },
  safety: { risks: ["network_access"] },
};

let fetchImpl: typeof fetch | null = typeof globalThis.fetch === "function" ? globalThis.fetch : null;
let llmHttpBreakerConsecutiveFailures = 0;
let llmHttpBreakerOpenedAt = 0;
let llmHttpRateLimitedUntil = 0;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const getTimeoutMs = (): number => clamp(Number(process.env.LLM_HTTP_TIMEOUT_MS ?? 15_000), 500, 60_000);
const getRetryCount = (): number => clamp(Number(process.env.LLM_HTTP_RETRY_COUNT ?? 1), 0, 2);
const getRetryBackoffMs = (): number => clamp(Number(process.env.LLM_HTTP_RETRY_BACKOFF_MS ?? 250), 50, 5_000);
const get429RetryCount = (): number => clamp(Number(process.env.LLM_HTTP_429_RETRY_COUNT ?? 0), 0, 8);
const get429RetryBackoffMs = (): number =>
  clamp(Number(process.env.LLM_HTTP_429_RETRY_BACKOFF_MS ?? 750), 50, 60_000);
const shouldCount429BreakerFailures = (): boolean =>
  String(process.env.LLM_HTTP_429_COUNTS_AS_BREAKER_FAILURE ?? "0").trim() === "1";
const getBreakerThreshold = (): number => clamp(Number(process.env.LLM_HTTP_BREAKER_THRESHOLD ?? 3), 1, 10);
const getBreakerCooldownMs = (): number => clamp(Number(process.env.LLM_HTTP_BREAKER_COOLDOWN_MS ?? 30_000), 1_000, 300_000);

const LLM_HTTP_CODE_RE = /(llm_http_[a-z0-9:_-]+)/i;
const LLM_HTTP_CONTEXT_LIMIT_RE =
  /\b(context length|context window|max(?:imum)? context|too many tokens|token limit|max_tokens|prompt too long|length exceeded)\b/i;
const LLM_HTTP_DEBUG_TEXT_LIMIT = 400;
const LLM_HTTP_RATE_LIMIT_HEADERS = [
  "retry-after",
  "x-request-id",
  "openai-request-id",
  "x-ratelimit-limit-requests",
  "x-ratelimit-remaining-requests",
  "x-ratelimit-reset-requests",
  "x-ratelimit-limit-tokens",
  "x-ratelimit-remaining-tokens",
  "x-ratelimit-reset-tokens",
] as const;

type LlmHttpPromptStats = {
  promptMessagesCount: number;
  promptChars: number;
  promptTokensEstimate: number;
  requestBodyBytes: number;
};

const clipDebugText = (value: string, maxChars = LLM_HTTP_DEBUG_TEXT_LIMIT): string => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;
  if (maxChars <= 3) return normalized.slice(0, maxChars);
  return `${normalized.slice(0, maxChars - 3)}...`;
};

const stringifyMessageContent = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          const textCandidate =
            typeof (entry as { text?: unknown }).text === "string"
              ? (entry as { text: string }).text
              : JSON.stringify(entry);
          return textCandidate;
        }
        return String(entry ?? "");
      })
      .join(" ");
  }
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
};

const estimatePromptStats = (messages: Array<{ role?: unknown; content?: unknown }>, requestBody: unknown): LlmHttpPromptStats => {
  const promptMessagesCount = Array.isArray(messages) ? messages.length : 0;
  const promptChars = (messages ?? []).reduce((sum, entry) => {
    const role = typeof entry?.role === "string" ? entry.role : "";
    const content = stringifyMessageContent(entry?.content);
    return sum + role.length + content.length;
  }, 0);
  const promptTokensEstimate = Math.max(
    promptMessagesCount * 4,
    Math.ceil(promptChars / 4) + promptMessagesCount * 2,
  );
  const requestBodyBytes = Buffer.byteLength(JSON.stringify(requestBody ?? {}), "utf8");
  return {
    promptMessagesCount,
    promptChars,
    promptTokensEstimate,
    requestBodyBytes,
  };
};

const extractRateLimitHeaders = (response: Response): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const name of LLM_HTTP_RATE_LIMIT_HEADERS) {
    const value = response.headers?.get?.(name);
    if (typeof value === "string" && value.trim()) {
      out[name] = value.trim();
    }
  }
  return out;
};

const inferRateLimitKind = (
  responseErrorText: string,
  headers: Record<string, string>,
): LlmHttpRateLimitKind => {
  const haystack = `${responseErrorText} ${Object.values(headers).join(" ")}`.toLowerCase();
  if (/insufficient_quota|quota|billing/i.test(haystack)) return "quota";
  if (/tokens?\s+per\s+min|tokens?\s+per\s+minute|tpm\b/i.test(haystack)) return "tokens_per_minute";
  if (/requests?\s+per\s+min|requests?\s+per\s+minute|rpm\b/i.test(haystack)) return "requests_per_minute";
  if (/concurr|simultaneous|parallel request/i.test(haystack)) return "concurrency";
  if ((headers["x-ratelimit-remaining-tokens"] ?? "") === "0") return "tokens_per_minute";
  if ((headers["x-ratelimit-remaining-requests"] ?? "") === "0") return "requests_per_minute";
  return "unknown";
};

const resetBreaker = (): void => {
  llmHttpBreakerConsecutiveFailures = 0;
  llmHttpBreakerOpenedAt = 0;
};

const resetRateLimitWindow = (): void => {
  llmHttpRateLimitedUntil = 0;
};

const refreshBreakerWindow = (): void => {
  if (!llmHttpBreakerOpenedAt) {
    return;
  }
  const elapsedMs = Date.now() - llmHttpBreakerOpenedAt;
  if (elapsedMs >= getBreakerCooldownMs()) {
    resetBreaker();
  }
};

const refreshRateLimitWindow = (): void => {
  if (!llmHttpRateLimitedUntil) {
    return;
  }
  if (Date.now() >= llmHttpRateLimitedUntil) {
    resetRateLimitWindow();
  }
};

const noteRateLimitWindow = (delayMs: number): void => {
  const boundedDelayMs = Number.isFinite(delayMs) ? Math.max(0, Math.floor(delayMs)) : 0;
  if (boundedDelayMs <= 0) return;
  llmHttpRateLimitedUntil = Math.max(llmHttpRateLimitedUntil, Date.now() + boundedDelayMs);
};

export const getLlmHttpBreakerSnapshot = (): {
  open: boolean;
  consecutive_failures: number;
  threshold: number;
  cooldown_ms: number;
  opened_at: string | null;
  remaining_ms: number;
} => {
  refreshBreakerWindow();
  const threshold = getBreakerThreshold();
  const cooldownMs = getBreakerCooldownMs();
  const open = llmHttpBreakerOpenedAt > 0;
  const elapsedMs = open ? Date.now() - llmHttpBreakerOpenedAt : 0;
  const remainingMs = open ? Math.max(0, cooldownMs - elapsedMs) : 0;
  return {
    open,
    consecutive_failures: llmHttpBreakerConsecutiveFailures,
    threshold,
    cooldown_ms: cooldownMs,
    opened_at: open ? new Date(llmHttpBreakerOpenedAt).toISOString() : null,
    remaining_ms: remainingMs,
  };
};

export const getLlmHttpRateLimitSnapshot = (): {
  open: boolean;
  until_at: string | null;
  remaining_ms: number;
} => {
  refreshRateLimitWindow();
  const open = llmHttpRateLimitedUntil > 0;
  const remainingMs = open ? Math.max(0, llmHttpRateLimitedUntil - Date.now()) : 0;
  return {
    open,
    until_at: open ? new Date(llmHttpRateLimitedUntil).toISOString() : null,
    remaining_ms: remainingMs,
  };
};

export const __resetLlmHttpBreakerForTests = (): void => {
  resetBreaker();
  resetRateLimitWindow();
};

export const __setLlmHttpFetchForTests = (impl: typeof fetch | null): void => {
  fetchImpl = impl;
};

const noteBreakerFailure = (): void => {
  llmHttpBreakerConsecutiveFailures += 1;
  if (llmHttpBreakerConsecutiveFailures >= getBreakerThreshold()) {
    llmHttpBreakerOpenedAt = Date.now();
  }
};

const createLlmHttpError = (args: {
  code: string;
  message?: string;
  status?: number;
  retryAfterMs?: number;
  timeoutMs?: number;
  maxTokensRequested?: number;
  maxTokensEffective?: number;
  transient?: boolean;
  breakerFailure?: boolean;
  providerCalled?: boolean;
  rateLimitSource?: LlmHttpRateLimitSource;
  rateLimitKind?: LlmHttpRateLimitKind;
  providerRequestId?: string;
  providerRetryAfterRaw?: string;
  providerErrorText?: string;
  providerRateLimitHeaders?: Record<string, string>;
  promptMessagesCount?: number;
  promptChars?: number;
  promptTokensEstimate?: number;
  requestBodyBytes?: number;
}): Error => {
  const error = new Error(args.message ?? args.code);
  const record = error as Error & {
    llmErrorCode?: string;
    llmHttpStatus?: number;
    llmRetryAfterMs?: number;
    llmTimeoutMs?: number;
    llmMaxTokensRequested?: number;
    llmMaxTokensEffective?: number;
    llmTransient?: boolean;
    llmBreakerFailure?: boolean;
    llmProviderCalled?: boolean;
    llmRateLimitSource?: LlmHttpRateLimitSource;
    llmRateLimitKind?: LlmHttpRateLimitKind;
    llmProviderRequestId?: string;
    llmProviderRetryAfterRaw?: string;
    llmProviderErrorText?: string;
    llmProviderRateLimitHeaders?: Record<string, string>;
    llmPromptMessagesCount?: number;
    llmPromptChars?: number;
    llmPromptTokensEstimate?: number;
    llmRequestBodyBytes?: number;
  };
  record.llmErrorCode = args.code;
  if (typeof args.status === "number" && Number.isFinite(args.status)) {
    record.llmHttpStatus = Math.floor(args.status);
  }
  if (typeof args.retryAfterMs === "number" && Number.isFinite(args.retryAfterMs)) {
    record.llmRetryAfterMs = Math.max(0, Math.floor(args.retryAfterMs));
  }
  if (typeof args.timeoutMs === "number" && Number.isFinite(args.timeoutMs)) {
    record.llmTimeoutMs = Math.max(0, Math.floor(args.timeoutMs));
  }
  if (typeof args.maxTokensRequested === "number" && Number.isFinite(args.maxTokensRequested)) {
    record.llmMaxTokensRequested = Math.max(0, Math.floor(args.maxTokensRequested));
  }
  if (typeof args.maxTokensEffective === "number" && Number.isFinite(args.maxTokensEffective)) {
    record.llmMaxTokensEffective = Math.max(0, Math.floor(args.maxTokensEffective));
  }
  if (typeof args.transient === "boolean") record.llmTransient = args.transient;
  if (typeof args.breakerFailure === "boolean") record.llmBreakerFailure = args.breakerFailure;
  if (typeof args.providerCalled === "boolean") record.llmProviderCalled = args.providerCalled;
  if (args.rateLimitSource) record.llmRateLimitSource = args.rateLimitSource;
  if (args.rateLimitKind) record.llmRateLimitKind = args.rateLimitKind;
  if (typeof args.providerRequestId === "string" && args.providerRequestId.trim()) {
    record.llmProviderRequestId = args.providerRequestId.trim();
  }
  if (typeof args.providerRetryAfterRaw === "string" && args.providerRetryAfterRaw.trim()) {
    record.llmProviderRetryAfterRaw = args.providerRetryAfterRaw.trim();
  }
  if (typeof args.providerErrorText === "string" && args.providerErrorText.trim()) {
    record.llmProviderErrorText = clipDebugText(args.providerErrorText);
  }
  if (args.providerRateLimitHeaders && Object.keys(args.providerRateLimitHeaders).length > 0) {
    record.llmProviderRateLimitHeaders = args.providerRateLimitHeaders;
  }
  if (typeof args.promptMessagesCount === "number" && Number.isFinite(args.promptMessagesCount)) {
    record.llmPromptMessagesCount = Math.max(0, Math.floor(args.promptMessagesCount));
  }
  if (typeof args.promptChars === "number" && Number.isFinite(args.promptChars)) {
    record.llmPromptChars = Math.max(0, Math.floor(args.promptChars));
  }
  if (typeof args.promptTokensEstimate === "number" && Number.isFinite(args.promptTokensEstimate)) {
    record.llmPromptTokensEstimate = Math.max(0, Math.floor(args.promptTokensEstimate));
  }
  if (typeof args.requestBodyBytes === "number" && Number.isFinite(args.requestBodyBytes)) {
    record.llmRequestBodyBytes = Math.max(0, Math.floor(args.requestBodyBytes));
  }
  return error;
};

export const classifyLlmHttpError = (error: unknown): LlmHttpErrorInfo => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const record = error as
    | (Error & {
        llmErrorCode?: unknown;
        llmHttpStatus?: unknown;
        llmRetryAfterMs?: unknown;
        llmTimeoutMs?: unknown;
        llmMaxTokensRequested?: unknown;
        llmMaxTokensEffective?: unknown;
        llmProviderCalled?: unknown;
        llmRateLimitSource?: unknown;
        llmRateLimitKind?: unknown;
        llmProviderRequestId?: unknown;
        llmProviderRetryAfterRaw?: unknown;
        llmProviderErrorText?: unknown;
        llmProviderRateLimitHeaders?: unknown;
        llmPromptMessagesCount?: unknown;
        llmPromptChars?: unknown;
        llmPromptTokensEstimate?: unknown;
        llmRequestBodyBytes?: unknown;
      })
    | undefined;
  const codeFromProperty =
    typeof record?.llmErrorCode === "string" && record.llmErrorCode.trim()
      ? record.llmErrorCode.trim().toLowerCase()
      : undefined;
  const codeFromMessage = message.match(LLM_HTTP_CODE_RE)?.[1]?.toLowerCase();
  const code =
    codeFromProperty ??
    codeFromMessage ??
    (/llm_backend_unavailable/i.test(message) ? "llm_backend_unavailable" : undefined);
  const explicitStatus =
    typeof record?.llmHttpStatus === "number" && Number.isFinite(record.llmHttpStatus)
      ? Math.max(0, Math.floor(record.llmHttpStatus))
      : undefined;
  const codeStatus = code?.match(/^llm_http_(\d{3})(?::|$)/i)?.[1];
  const statusFromCode = codeStatus ? Number(codeStatus) : undefined;
  const status = Number.isFinite(explicitStatus ?? NaN)
    ? explicitStatus
    : Number.isFinite(statusFromCode ?? NaN)
      ? Math.max(0, Math.floor(statusFromCode ?? 0))
      : undefined;
  const retryAfterFromCode = code?.match(/^llm_http_429:(\d+)$/i)?.[1];
  const retryAfterMsFromCode = retryAfterFromCode ? Number(retryAfterFromCode) : undefined;
  const retryAfterMsFromProperty =
    typeof record?.llmRetryAfterMs === "number" && Number.isFinite(record.llmRetryAfterMs)
      ? Math.max(0, Math.floor(record.llmRetryAfterMs))
      : undefined;
  const retryAfterMs = Number.isFinite(retryAfterMsFromProperty ?? NaN)
    ? retryAfterMsFromProperty
    : Number.isFinite(retryAfterMsFromCode ?? NaN)
      ? Math.max(0, Math.floor(retryAfterMsFromCode ?? 0))
      : undefined;
  const timeoutFromCode = code?.match(/^llm_http_timeout:(\d+)$/i)?.[1];
  const timeoutMsFromCode = timeoutFromCode ? Number(timeoutFromCode) : undefined;
  const timeoutMsFromProperty =
    typeof record?.llmTimeoutMs === "number" && Number.isFinite(record.llmTimeoutMs)
      ? Math.max(0, Math.floor(record.llmTimeoutMs))
      : undefined;
  const timeoutMs = Number.isFinite(timeoutMsFromProperty ?? NaN)
    ? timeoutMsFromProperty
    : Number.isFinite(timeoutMsFromCode ?? NaN)
      ? Math.max(0, Math.floor(timeoutMsFromCode ?? 0))
      : undefined;
  const maxTokensRequested =
    typeof record?.llmMaxTokensRequested === "number" && Number.isFinite(record.llmMaxTokensRequested)
      ? Math.max(0, Math.floor(record.llmMaxTokensRequested))
      : undefined;
  const maxTokensEffective =
    typeof record?.llmMaxTokensEffective === "number" && Number.isFinite(record.llmMaxTokensEffective)
      ? Math.max(0, Math.floor(record.llmMaxTokensEffective))
      : undefined;
  const providerCalled =
    typeof record?.llmProviderCalled === "boolean" ? record.llmProviderCalled : undefined;
  const rateLimitSource =
    record?.llmRateLimitSource === "provider_429" || record?.llmRateLimitSource === "local_cooldown"
      ? record.llmRateLimitSource
      : undefined;
  const rateLimitKind =
    record?.llmRateLimitKind === "requests_per_minute" ||
    record?.llmRateLimitKind === "tokens_per_minute" ||
    record?.llmRateLimitKind === "quota" ||
    record?.llmRateLimitKind === "concurrency" ||
    record?.llmRateLimitKind === "unknown"
      ? record.llmRateLimitKind
      : undefined;
  const providerRequestId =
    typeof record?.llmProviderRequestId === "string" && record.llmProviderRequestId.trim()
      ? record.llmProviderRequestId.trim()
      : undefined;
  const providerRetryAfterRaw =
    typeof record?.llmProviderRetryAfterRaw === "string" && record.llmProviderRetryAfterRaw.trim()
      ? record.llmProviderRetryAfterRaw.trim()
      : undefined;
  const providerErrorText =
    typeof record?.llmProviderErrorText === "string" && record.llmProviderErrorText.trim()
      ? clipDebugText(record.llmProviderErrorText)
      : undefined;
  const providerRateLimitHeaders =
    record?.llmProviderRateLimitHeaders &&
    typeof record.llmProviderRateLimitHeaders === "object" &&
    !Array.isArray(record.llmProviderRateLimitHeaders)
      ? Object.fromEntries(
          Object.entries(record.llmProviderRateLimitHeaders as Record<string, unknown>)
            .map(([key, value]) => [String(key), typeof value === "string" ? value.trim() : String(value ?? "").trim()])
            .filter(([, value]) => value.length > 0),
        )
      : undefined;
  const promptMessagesCount =
    typeof record?.llmPromptMessagesCount === "number" && Number.isFinite(record.llmPromptMessagesCount)
      ? Math.max(0, Math.floor(record.llmPromptMessagesCount))
      : undefined;
  const promptChars =
    typeof record?.llmPromptChars === "number" && Number.isFinite(record.llmPromptChars)
      ? Math.max(0, Math.floor(record.llmPromptChars))
      : undefined;
  const promptTokensEstimate =
    typeof record?.llmPromptTokensEstimate === "number" && Number.isFinite(record.llmPromptTokensEstimate)
      ? Math.max(0, Math.floor(record.llmPromptTokensEstimate))
      : undefined;
  const requestBodyBytes =
    typeof record?.llmRequestBodyBytes === "number" && Number.isFinite(record.llmRequestBodyBytes)
      ? Math.max(0, Math.floor(record.llmRequestBodyBytes))
      : undefined;

  let errorClass: LlmHttpErrorClass = "unknown";
  if (code === "llm_backend_unavailable") {
    errorClass = "backend_unavailable";
  } else if (code === "llm_http_circuit_open") {
    errorClass = "circuit_open";
  } else if (code?.startsWith("llm_http_429")) {
    errorClass = "rate_limited";
  } else if (code?.startsWith("llm_http_timeout")) {
    errorClass = "timeout";
  } else if (code?.startsWith("llm_http_transport")) {
    errorClass = "transport";
  } else if (code?.startsWith("llm_http_5xx")) {
    errorClass = "server_error";
  } else if (code?.startsWith("llm_http_context_limit")) {
    errorClass = "context_limit";
  } else if (typeof status === "number" && status >= 500) {
    errorClass = "server_error";
  } else if (typeof status === "number" && (status === 401 || status === 403)) {
    errorClass = "auth_error";
  } else if (typeof status === "number" && status >= 400 && status < 500) {
    errorClass = "client_error";
  } else if (LLM_HTTP_CONTEXT_LIMIT_RE.test(message)) {
    errorClass = "context_limit";
  } else if (/aborterror|timeout|timed out/i.test(message)) {
    errorClass = "timeout";
  } else if (/econnrefused|econnreset|enotfound|socket|network|fetch failed/i.test(message)) {
    errorClass = "transport";
  }

  const transient =
    errorClass === "rate_limited" ||
    errorClass === "timeout" ||
    errorClass === "transport" ||
    errorClass === "server_error" ||
    errorClass === "circuit_open";
  const breakerFailure =
    errorClass === "timeout" ||
    errorClass === "transport" ||
    errorClass === "server_error" ||
    (errorClass === "rate_limited" && shouldCount429BreakerFailures());
  const breakerSnapshot = getLlmHttpBreakerSnapshot();
  const circuitOpen = errorClass === "circuit_open" || breakerSnapshot.open;
  const circuitRemainingMs =
    circuitOpen && Number.isFinite(breakerSnapshot.remaining_ms)
      ? Math.max(0, Math.floor(breakerSnapshot.remaining_ms))
      : undefined;

  return {
    code,
    message,
    errorClass,
    status,
    retryAfterMs,
    timeoutMs,
    maxTokensRequested,
    maxTokensEffective,
    transient,
    breakerFailure,
    circuitOpen,
    circuitRemainingMs,
    providerCalled,
    rateLimitSource,
    rateLimitKind,
    providerRequestId,
    providerRetryAfterRaw,
    providerErrorText,
    providerRateLimitHeaders,
    promptMessagesCount,
    promptChars,
    promptTokensEstimate,
    requestBodyBytes,
  };
};

const ensureBreakerClosed = (promptStats?: Partial<LlmHttpPromptStats>): void => {
  refreshBreakerWindow();
  if (!llmHttpBreakerOpenedAt) return;
  const breaker = getLlmHttpBreakerSnapshot();
  throw createLlmHttpError({
    code: "llm_http_circuit_open",
    message: "llm_http_circuit_open",
    transient: true,
    breakerFailure: false,
    retryAfterMs: breaker.remaining_ms,
    providerCalled: false,
    promptMessagesCount: promptStats?.promptMessagesCount,
    promptChars: promptStats?.promptChars,
    promptTokensEstimate: promptStats?.promptTokensEstimate,
    requestBodyBytes: promptStats?.requestBodyBytes,
  });
};

const ensureRateLimitWindowClosed = (promptStats?: Partial<LlmHttpPromptStats>): void => {
  refreshRateLimitWindow();
  if (!llmHttpRateLimitedUntil) return;
  const rateLimit = getLlmHttpRateLimitSnapshot();
  throw createLlmHttpError({
    code:
      typeof rateLimit.remaining_ms === "number" && rateLimit.remaining_ms > 0
        ? `llm_http_429:${Math.max(0, Math.floor(rateLimit.remaining_ms))}`
        : "llm_http_429",
    message:
      typeof rateLimit.remaining_ms === "number" && rateLimit.remaining_ms > 0
        ? `llm_http_429:${Math.max(0, Math.floor(rateLimit.remaining_ms))}`
        : "llm_http_429",
    status: 429,
    retryAfterMs: rateLimit.remaining_ms,
    transient: true,
    breakerFailure: false,
    providerCalled: false,
    rateLimitSource: "local_cooldown",
    rateLimitKind: "unknown",
    promptMessagesCount: promptStats?.promptMessagesCount,
    promptChars: promptStats?.promptChars,
    promptTokensEstimate: promptStats?.promptTokensEstimate,
    requestBodyBytes: promptStats?.requestBodyBytes,
  });
};

const withTimeout = async (url: string, init: RequestInit, timeoutMs: number): Promise<Response> => {
  const fetch = await getFetch();
  const controller = new AbortController();
  const handle = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if ((error as any)?.name === "AbortError") {
      throw createLlmHttpError({
        code: `llm_http_timeout:${timeoutMs}`,
        message: `llm_http_timeout:${timeoutMs}`,
        timeoutMs,
        transient: true,
        breakerFailure: true,
      });
    }
    throw createLlmHttpError({
      code: `llm_http_transport:${message}`,
      message: `llm_http_transport:${message}`,
      timeoutMs,
      transient: true,
      breakerFailure: true,
    });
  } finally {
    clearTimeout(handle);
  }
};

const isRetryableError = (error: unknown): boolean => {
  return classifyLlmHttpError(error).transient;
};

const isBreakerTransientError = (error: unknown): boolean => {
  return classifyLlmHttpError(error).breakerFailure;
};

const parseLlmHttpErrorCode = (error: unknown): string => {
  return String(classifyLlmHttpError(error).code ?? "llm_http_unknown").toLowerCase();
};

const parseRetryAfterMs = (response: Response): number => {
  try {
    const raw = response.headers?.get?.("retry-after");
    if (!raw) return 0;
    const seconds = Number(raw);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.max(0, Math.round(seconds * 1000));
    }
    const retryAtMs = Date.parse(raw);
    if (!Number.isFinite(retryAtMs)) return 0;
    return Math.max(0, retryAtMs - Date.now());
  } catch {
    return 0;
  }
};

const resolveRetryDelayMs = (args: {
  errorCode: string;
  attempt: number;
  retryAfterMs?: number;
  fallbackBackoffMs: number;
}): number => {
  const normalizedCode = String(args.errorCode ?? "").toLowerCase();
  const exponential = args.fallbackBackoffMs * Math.max(1, args.attempt + 1);
  const jitter = Math.floor(Math.random() * Math.max(10, Math.min(250, args.fallbackBackoffMs)));
  const hinted = Number.isFinite(args.retryAfterMs ?? NaN) ? Math.max(0, Math.floor(args.retryAfterMs ?? 0)) : 0;
  if (normalizedCode.startsWith("llm_http_429")) {
    return Math.max(hinted, exponential) + jitter;
  }
  return exponential + jitter;
};

const readResponseErrorText = async (response: Response): Promise<string> => {
  try {
    const text = await response.text();
    return String(text ?? "").trim();
  } catch {
    return "";
  }
};

async function getFetch(): Promise<typeof fetch> {
  if (fetchImpl) {
    return fetchImpl;
  }
  const mod = await import("node-fetch");
  fetchImpl = (mod.default ?? mod) as unknown as typeof fetch;
  return fetchImpl;
}

const normalizeBase = (): string => {
  const configuredBase = (process.env.LLM_HTTP_BASE ?? "").trim();
  const allowDefaultOpenAiBase =
    String(process.env.LLM_HTTP_ALLOW_DEFAULT_OPENAI_BASE ?? "1").trim() !== "0";
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  const base = configuredBase || (allowDefaultOpenAiBase && hasApiKey ? "https://api.openai.com" : "");
  if (!base) {
    throw new Error("LLM_HTTP_BASE not set");
  }
  const normalized = base.replace(/\/+$/, "");
  assertHullAllowed(normalized);
  return normalized;
};

export const llmHttpHandler: ToolHandler = async (input: any, ctx: any) => {
  const base = normalizeBase();
  const timeoutMs = getTimeoutMs();
  const envMaxTokensRaw = Number(process.env.LLM_HTTP_MAX_TOKENS ?? NaN);
  const envMaxTokens =
    Number.isFinite(envMaxTokensRaw) && envMaxTokensRaw > 0
      ? Math.min(32_768, Math.floor(envMaxTokensRaw))
      : undefined;
  const requestedMaxTokens =
    typeof input?.max_tokens === "number" && Number.isFinite(input.max_tokens) && input.max_tokens > 0
      ? Math.min(32_768, Math.floor(input.max_tokens))
      : undefined;
  const model =
    (typeof input?.model === "string" && input.model.trim()) ||
    (process.env.LLM_HTTP_MODEL ?? "gpt-4o-mini").trim();
  const temperature =
    typeof input?.temperature === "number" && Number.isFinite(input.temperature)
      ? input.temperature
      : Number(process.env.LLM_HTTP_TEMPERATURE ?? 0.2);
  const maxTokens = requestedMaxTokens ?? envMaxTokens;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set; cannot call OpenAI");
  }
  const personaId = ctx?.personaId ?? "persona:unknown";
  const now = new Date().toISOString();

  const messages = Array.isArray(input?.messages) && input.messages.length > 0
    ? input.messages
    : [{ role: "user", content: String(input?.prompt ?? ctx?.goal ?? "Say hello") }];

  const requestBody = {
    model,
    messages,
    temperature: Number.isFinite(temperature) ? temperature : 0.2,
    max_tokens: maxTokens,
    stream: false,
  };
  const promptStats = estimatePromptStats(messages, requestBody);

  const correlationHeaders: Record<string, string> = {};
  const traceId = typeof input?.traceId === "string" && input.traceId.trim()
    ? input.traceId.trim()
    : typeof ctx?.traceId === "string" && ctx.traceId.trim()
      ? ctx.traceId.trim()
      : undefined;
  const sessionId = typeof input?.sessionId === "string" && input.sessionId.trim()
    ? input.sessionId.trim()
    : typeof ctx?.sessionId === "string" && ctx.sessionId.trim()
      ? ctx.sessionId.trim()
      : undefined;
  const tenantId =
    (typeof input?.tenantId === "string" && input.tenantId.trim()) ||
    (typeof ctx?.tenantId === "string" && ctx.tenantId.trim()) ||
    process.env.AGI_TENANT_ID?.trim() ||
    process.env.X_TENANT_ID?.trim();
  if (traceId) correlationHeaders["X-Trace-Id"] = traceId;
  if (sessionId) correlationHeaders["X-Session-Id"] = sessionId;
  if (tenantId) {
    correlationHeaders["X-Tenant-Id"] = tenantId;
    correlationHeaders["X-Customer-Id"] = tenantId;
  }
  ensureBreakerClosed(promptStats);
  ensureRateLimitWindowClosed(promptStats);

  const retries = getRetryCount();
  const retries429 = get429RetryCount();
  const retryBackoffMs = getRetryBackoffMs();
  const retry429BackoffMs = get429RetryBackoffMs();
  const retryDelaysMs: number[] = [];
  let retryCountUsed = 0;
  let attemptsUsed = 0;
  let lastRetryAfterMs = 0;
  let payload: any;
  let text = "";
  let usage: any = {};
  let responseStatus = 0;
  let providerRequestId: string | undefined;
  for (let attempt = 0; ; attempt += 1) {
    attemptsUsed = attempt + 1;
    try {
      const response = await withTimeout(`${base}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...correlationHeaders,
        },
        body: JSON.stringify(requestBody),
      }, timeoutMs);
      responseStatus = response.status;
      if (!response.ok) {
        const responseErrorText = await readResponseErrorText(response);
        if (response.status >= 500) {
          throw createLlmHttpError({
            code: `llm_http_5xx:${response.status}`,
            message: `llm_http_5xx:${response.status}`,
            status: response.status,
            timeoutMs,
            maxTokensRequested: requestedMaxTokens,
            maxTokensEffective: maxTokens,
            transient: true,
            breakerFailure: true,
            providerCalled: true,
            promptMessagesCount: promptStats.promptMessagesCount,
            promptChars: promptStats.promptChars,
            promptTokensEstimate: promptStats.promptTokensEstimate,
            requestBodyBytes: promptStats.requestBodyBytes,
          });
        }
        if (response.status === 429) {
          const retryAfterMs = parseRetryAfterMs(response);
          const retryAfterRaw = response.headers?.get?.("retry-after") ?? undefined;
          const providerHeaders = extractRateLimitHeaders(response);
          const providerRequestId =
            providerHeaders["x-request-id"] ?? providerHeaders["openai-request-id"] ?? undefined;
          const rateLimitKind = inferRateLimitKind(responseErrorText, providerHeaders);
          noteRateLimitWindow(Math.max(retryAfterMs, retry429BackoffMs));
          throw createLlmHttpError({
            code: retryAfterMs > 0 ? `llm_http_429:${retryAfterMs}` : "llm_http_429",
            message: retryAfterMs > 0 ? `llm_http_429:${retryAfterMs}` : "llm_http_429",
            status: 429,
            retryAfterMs,
            timeoutMs,
            maxTokensRequested: requestedMaxTokens,
            maxTokensEffective: maxTokens,
            transient: true,
            breakerFailure: shouldCount429BreakerFailures(),
            providerCalled: true,
            rateLimitSource: "provider_429",
            rateLimitKind,
            providerRequestId,
            providerRetryAfterRaw: retryAfterRaw,
            providerErrorText: responseErrorText,
            providerRateLimitHeaders: providerHeaders,
            promptMessagesCount: promptStats.promptMessagesCount,
            promptChars: promptStats.promptChars,
            promptTokensEstimate: promptStats.promptTokensEstimate,
            requestBodyBytes: promptStats.requestBodyBytes,
          });
        }
        if (response.status === 400 && LLM_HTTP_CONTEXT_LIMIT_RE.test(responseErrorText)) {
          throw createLlmHttpError({
            code: "llm_http_context_limit:400",
            message: "llm_http_context_limit:400",
            status: 400,
            timeoutMs,
            maxTokensRequested: requestedMaxTokens,
            maxTokensEffective: maxTokens,
            transient: false,
            breakerFailure: false,
            providerCalled: true,
            promptMessagesCount: promptStats.promptMessagesCount,
            promptChars: promptStats.promptChars,
            promptTokensEstimate: promptStats.promptTokensEstimate,
            requestBodyBytes: promptStats.requestBodyBytes,
          });
        }
        throw createLlmHttpError({
          code: `llm_http_${response.status}`,
          message: `llm_http_${response.status}`,
          status: response.status,
          timeoutMs,
          maxTokensRequested: requestedMaxTokens,
          maxTokensEffective: maxTokens,
          transient: false,
          breakerFailure: false,
          providerCalled: true,
          promptMessagesCount: promptStats.promptMessagesCount,
          promptChars: promptStats.promptChars,
          promptTokensEstimate: promptStats.promptTokensEstimate,
          requestBodyBytes: promptStats.requestBodyBytes,
        });
      }
      const providerHeaders = extractRateLimitHeaders(response);
      providerRequestId = providerHeaders["x-request-id"] ?? providerHeaders["openai-request-id"] ?? undefined;
      payload = (await response.json()) as any;
      text = payload?.choices?.[0]?.message?.content ?? "";
      usage = payload?.usage ?? {};
      resetRateLimitWindow();
      resetBreaker();
      break;
    } catch (error) {
      const parsed = classifyLlmHttpError(error);
      const errorCode = parseLlmHttpErrorCode(error);
      const is429 = parsed.errorClass === "rate_limited";
      const maxRetries = is429 ? retries429 : retries;
      const canRetry = attempt < maxRetries && isRetryableError(error);
      if (canRetry) {
        const retryAfterMs =
          typeof parsed.retryAfterMs === "number" && Number.isFinite(parsed.retryAfterMs)
            ? Math.max(0, Math.floor(parsed.retryAfterMs))
            : 0;
        lastRetryAfterMs = retryAfterMs;
        const delayMs = resolveRetryDelayMs({
          errorCode,
          attempt,
          retryAfterMs,
          fallbackBackoffMs: is429 ? retry429BackoffMs : retryBackoffMs,
        });
        retryCountUsed += 1;
        retryDelaysMs.push(delayMs);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      if (isBreakerTransientError(error)) {
        noteBreakerFailure();
      } else {
        // Do not keep the transport circuit open on auth/config errors.
        resetBreaker();
      }
      const outError = error instanceof Error ? error : new Error(String(error));
      const outRecord = outError as Error & Record<string, unknown>;
      outRecord.llmErrorCode = parsed.code;
      outRecord.llmErrorClass = parsed.errorClass;
      if (typeof parsed.status === "number") outRecord.llmHttpStatus = parsed.status;
      if (typeof parsed.retryAfterMs === "number") outRecord.llmRetryAfterMs = parsed.retryAfterMs;
      if (typeof parsed.timeoutMs === "number") outRecord.llmTimeoutMs = parsed.timeoutMs;
      if (typeof parsed.maxTokensRequested === "number") {
        outRecord.llmMaxTokensRequested = parsed.maxTokensRequested;
      }
      if (typeof parsed.maxTokensEffective === "number") {
        outRecord.llmMaxTokensEffective = parsed.maxTokensEffective;
      }
      outRecord.llmTransient = parsed.transient;
      outRecord.llmBreakerFailure = parsed.breakerFailure;
      outRecord.llmCircuitOpen = parsed.circuitOpen;
      if (typeof parsed.circuitRemainingMs === "number") {
        outRecord.llmCircuitRemainingMs = parsed.circuitRemainingMs;
      }
      outRecord.__llm_http_attempts = attemptsUsed;
      outRecord.__llm_http_retry_count = retryCountUsed;
      outRecord.__llm_http_retry_delays_ms = retryDelaysMs.slice(0, 8);
      outRecord.__llm_timeout_ms = timeoutMs;
      outRecord.__llm_max_tokens_requested = requestedMaxTokens ?? null;
      outRecord.__llm_max_tokens_effective = maxTokens ?? null;
      outRecord.__llm_prompt_messages_count = promptStats.promptMessagesCount;
      outRecord.__llm_prompt_chars = promptStats.promptChars;
      outRecord.__llm_prompt_tokens_estimate = promptStats.promptTokensEstimate;
      outRecord.__llm_request_body_bytes = promptStats.requestBodyBytes;
      if (lastRetryAfterMs > 0) {
        outRecord.__llm_retry_after_ms = lastRetryAfterMs;
      }
      throw outError;
    }
  }

  let essenceId: string | undefined;
  if (text) {
    const buffer = Buffer.from(text, "utf8");
    const blob = await putBlob(buffer, { contentType: "text/plain" });
    const textHash = crypto.createHash("sha256").update(buffer).digest("hex");
    const env = EssenceEnvelope.parse({
      header: {
        id: crypto.randomUUID(),
        version: "essence/1.0",
        modality: "text",
        created_at: now,
        source: {
          uri: blob.uri,
          cid: blob.cid,
          original_hash: { algo: "sha256", value: textHash },
          creator_id: personaId,
          license: input?.license ?? "CC-BY-4.0",
        },
        rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
        acl: { visibility: "private", groups: [] },
      },
      features: {
        text: {
          lang: input?.language ?? "en",
        },
      },
      embeddings: [],
      provenance: {
        pipeline: [
          {
            name: "llm-http-chat",
            impl_version: payload?.system_fingerprint ?? "1.0",
            lib_hash: {
              algo: "sha256",
              value: crypto.createHash("sha256").update(`${base}:${model}`).digest("hex"),
            },
            params: {
              model,
              temperature: requestBody.temperature,
              messages_count: messages.length,
            },
            seed: input?.seed ? String(input.seed) : undefined,
            input_hash: {
              algo: "sha256",
              value: crypto.createHash("sha256").update(JSON.stringify(messages)).digest("hex"),
            },
            output_hash: { algo: "sha256", value: textHash },
            started_at: now,
            ended_at: new Date().toISOString(),
          },
        ],
        merkle_root: { algo: "sha256", value: textHash },
        previous: null,
        signatures: [],
      },
    });
    await putEnvelopeWithPolicy(env);
    essenceId = env.header.id;
  }

  return {
    text,
    usage,
    model,
    essence_id: essenceId,
    status: responseStatus || 200,
    __llm_backend: "http",
    __llm_provider_called: true,
    __llm_provider: "openai_compatible",
    __llm_http_attempts: attemptsUsed,
    __llm_http_retry_count: retryCountUsed,
    __llm_http_retry_delays_ms: retryDelaysMs.slice(0, 8),
    __llm_timeout_ms: timeoutMs,
    __llm_max_tokens_requested: requestedMaxTokens ?? null,
    __llm_max_tokens_effective: maxTokens ?? null,
    __llm_prompt_messages_count: promptStats.promptMessagesCount,
    __llm_prompt_chars: promptStats.promptChars,
    __llm_prompt_tokens_estimate: promptStats.promptTokensEstimate,
    __llm_request_body_bytes: promptStats.requestBodyBytes,
    __llm_usage_prompt_tokens:
      typeof usage?.prompt_tokens === "number" && Number.isFinite(usage.prompt_tokens)
        ? Math.max(0, Math.floor(usage.prompt_tokens))
        : null,
    __llm_usage_completion_tokens:
      typeof usage?.completion_tokens === "number" && Number.isFinite(usage.completion_tokens)
        ? Math.max(0, Math.floor(usage.completion_tokens))
        : null,
    __llm_usage_total_tokens:
      typeof usage?.total_tokens === "number" && Number.isFinite(usage.total_tokens)
        ? Math.max(0, Math.floor(usage.total_tokens))
        : null,
    __llm_provider_request_id: providerRequestId ?? null,
    __llm_retry_after_ms: lastRetryAfterMs > 0 ? lastRetryAfterMs : null,
    __llm_routed_via:
      typeof ctx?.routedVia === "string" && ctx.routedVia.trim()
        ? ctx.routedVia.trim()
        : "llm.http.generate",
  };
};
