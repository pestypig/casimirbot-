import crypto from "node:crypto";
import { EssenceEnvelope } from "@shared/essence-schema";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { putEnvelopeWithPolicy } from "./provenance";
import { putBlob } from "../storage";
import { assertHullAllowed } from "../security/hull-guard";

const DEFAULT_LLM_HTTP_RPM = Math.max(1, Number(process.env.LLM_HTTP_RPM ?? 60));

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
const getBreakerThreshold = (): number => clamp(Number(process.env.LLM_HTTP_BREAKER_THRESHOLD ?? 3), 1, 10);
const getBreakerCooldownMs = (): number => clamp(Number(process.env.LLM_HTTP_BREAKER_COOLDOWN_MS ?? 30_000), 1_000, 300_000);

const resetBreaker = (): void => {
  llmHttpBreakerConsecutiveFailures = 0;
  llmHttpBreakerOpenedAt = 0;
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

const ensureBreakerClosed = (): void => {
  if (!llmHttpBreakerOpenedAt) {
    return;
  }
  const elapsedMs = Date.now() - llmHttpBreakerOpenedAt;
  if (elapsedMs >= getBreakerCooldownMs()) {
    resetBreaker();
    return;
  }
  throw new Error("llm_http_circuit_open");
};

const withTimeout = async (url: string, init: RequestInit): Promise<Response> => {
  const fetch = await getFetch();
  const timeoutMs = getTimeoutMs();
  const controller = new AbortController();
  const handle = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if ((error as any)?.name === "AbortError") {
      throw new Error(`llm_http_timeout:${timeoutMs}`);
    }
    throw new Error(`llm_http_transport:${message}`);
  } finally {
    clearTimeout(handle);
  }
};

const isRetryableError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /llm_http_timeout|llm_http_transport|llm_http_5xx|llm_http_429/i.test(message);
};

const isBreakerTransientError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /llm_http_timeout|llm_http_transport|llm_http_5xx|llm_http_429/i.test(message);
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
  const base = (process.env.LLM_HTTP_BASE ?? "").trim();
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
  const envMaxTokensRaw = Number(process.env.LLM_HTTP_MAX_TOKENS ?? NaN);
  const envMaxTokens =
    Number.isFinite(envMaxTokensRaw) && envMaxTokensRaw > 0
      ? Math.min(32_768, Math.floor(envMaxTokensRaw))
      : undefined;
  const model =
    (typeof input?.model === "string" && input.model.trim()) ||
    (process.env.LLM_HTTP_MODEL ?? "gpt-4o-mini").trim();
  const temperature =
    typeof input?.temperature === "number" && Number.isFinite(input.temperature)
      ? input.temperature
      : Number(process.env.LLM_HTTP_TEMPERATURE ?? 0.2);
  const maxTokens =
    typeof input?.max_tokens === "number" && Number.isFinite(input.max_tokens) && input.max_tokens > 0
      ? Math.min(32_768, Math.floor(input.max_tokens))
      : envMaxTokens;
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
  const retryBackoffMs = getRetryBackoffMs();
  let payload: any;
  let text = "";
  let usage: any = {};
  let responseStatus = 0;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await withTimeout(`${base}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...correlationHeaders,
        },
        body: JSON.stringify(requestBody),
      });
      responseStatus = response.status;
      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error(`llm_http_5xx:${response.status}`);
        }
        if (response.status === 429) {
          throw new Error("llm_http_429");
        }
        throw new Error(`llm_http_${response.status}`);
      }
      payload = (await response.json()) as any;
      text = payload?.choices?.[0]?.message?.content ?? "";
      usage = payload?.usage ?? {};
      resetBreaker();
      break;
    } catch (error) {
      const canRetry = attempt < retries && isRetryableError(error);
      if (canRetry) {
        await new Promise((resolve) => setTimeout(resolve, retryBackoffMs * (attempt + 1)));
        continue;
      }
      if (isBreakerTransientError(error)) {
        noteBreakerFailure();
      } else {
        // Do not keep the transport circuit open on auth/config errors.
        resetBreaker();
      }
      throw error;
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
    __llm_routed_via:
      typeof ctx?.routedVia === "string" && ctx.routedVia.trim()
        ? ctx.routedVia.trim()
        : "llm.http.generate",
  };
};
