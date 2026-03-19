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

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const getTimeoutMs = (): number => clamp(Number(process.env.LLM_HTTP_TIMEOUT_MS ?? 15_000), 500, 60_000);
const getRetryCount = (): number => clamp(Number(process.env.LLM_HTTP_RETRY_COUNT ?? 1), 0, 2);
const getRetryBackoffMs = (): number => clamp(Number(process.env.LLM_HTTP_RETRY_BACKOFF_MS ?? 250), 50, 5_000);
const get429RetryCount = (): number => clamp(Number(process.env.LLM_HTTP_429_RETRY_COUNT ?? 3), 0, 8);
const get429RetryBackoffMs = (): number =>
  clamp(Number(process.env.LLM_HTTP_429_RETRY_BACKOFF_MS ?? 750), 50, 60_000);
const shouldCount429BreakerFailures = (): boolean =>
  String(process.env.LLM_HTTP_429_COUNTS_AS_BREAKER_FAILURE ?? "0").trim() === "1";
const getBreakerThreshold = (): number => clamp(Number(process.env.LLM_HTTP_BREAKER_THRESHOLD ?? 3), 1, 10);
const getBreakerCooldownMs = (): number => clamp(Number(process.env.LLM_HTTP_BREAKER_COOLDOWN_MS ?? 30_000), 1_000, 300_000);

const LLM_HTTP_CODE_RE = /(llm_http_[a-z0-9:_-]+)/i;
const LLM_HTTP_CONTEXT_LIMIT_RE =
  /\b(context length|context window|max(?:imum)? context|too many tokens|token limit|max_tokens|prompt too long|length exceeded)\b/i;

const resetBreaker = (): void => {
  llmHttpBreakerConsecutiveFailures = 0;
  llmHttpBreakerOpenedAt = 0;
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

export const __resetLlmHttpBreakerForTests = (): void => {
  resetBreaker();
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
  };
};

const ensureBreakerClosed = (): void => {
  refreshBreakerWindow();
  if (!llmHttpBreakerOpenedAt) return;
  const breaker = getLlmHttpBreakerSnapshot();
  throw createLlmHttpError({
    code: "llm_http_circuit_open",
    message: "llm_http_circuit_open",
    transient: true,
    breakerFailure: false,
    retryAfterMs: breaker.remaining_ms,
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
  const hasApiKey = Boolean(process.env.LLM_HTTP_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim());
  const base = configuredBase || (allowDefaultOpenAiBase && hasApiKey ? "https://api.openai.com" : "");
  if (!base) {
    throw new Error("LLM_HTTP_BASE not set");
  }
  const normalized = base.replace(/\/+$/, "");
  assertHullAllowed(normalized);
  return normalized;
};

export const llmHttpHandler: ToolHandler = async (input: any, ctx: any) => {
  ensureBreakerClosed();
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
  const apiKey = process.env.LLM_HTTP_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("LLM_HTTP_API_KEY or OPENAI_API_KEY not set; cannot call OpenAI");
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
          });
        }
        if (response.status === 429) {
          const retryAfterMs = parseRetryAfterMs(response);
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
        });
      }
      payload = (await response.json()) as any;
      text = payload?.choices?.[0]?.message?.content ?? "";
      usage = payload?.usage ?? {};
      resetBreaker();
      break;
    } catch (error) {
      const parsed = classifyLlmHttpError(error);
      const errorCode = parseLlmHttpErrorCode(error);
      const is429 = parsed.errorClass === "rate_limited";
      const maxRetries = is429 ? Math.max(retries, retries429) : retries;
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
    __llm_retry_after_ms: lastRetryAfterMs > 0 ? lastRetryAfterMs : null,
    __llm_routed_via:
      typeof ctx?.routedVia === "string" && ctx.routedVia.trim()
        ? ctx.routedVia.trim()
        : "llm.http.generate",
  };
};
