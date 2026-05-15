/**
 * Simple vision provider abstraction so we can swap OpenAI-style vision and Ollama vision.
 * Ollama is treated as an OpenAI-compatible chat endpoint when OLLAMA_ENDPOINT is set,
 * unless VISION_PROVIDER explicitly selects a different vision provider.
 */
import crypto from "node:crypto";
import type { HelixVisualProviderHealth } from "@shared/helix-visual-evidence-health";

type CaptionResult = string | undefined;
let lastVisionProviderError: string | null = null;

export interface VisionProvider {
  describeImage(imageBase64: string, mime: string, prompt: string): Promise<CaptionResult>;
}

const env = (key: string) => (process.env[key] ?? "").trim();
const envInt = (key: string, fallback: number) => {
  const raw = Number.parseInt(env(key), 10);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
};

const OPENAI_STYLE_MODEL_RE = /^(?:gpt-|o\d|chatgpt-|text-|dall-e)/i;
const isOfficialOpenAiBase = (base: string) => {
  try {
    return /(^|\.)api\.openai\.com$/i.test(new URL(base).hostname);
  } catch {
    return false;
  }
};
const resolveOllamaVisionModel = () => {
  const explicit = env("OLLAMA_VISION_MODEL");
  if (explicit) return explicit;
  const sharedVisionModel = env("VISION_HTTP_MODEL");
  if (sharedVisionModel && !OPENAI_STYLE_MODEL_RE.test(sharedVisionModel)) return sharedVisionModel;
  return "qwen3-vl:2b";
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  timeout.unref?.();
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const resolvePrompt = (prompt?: string) =>
  prompt?.trim() ||
  env("VISION_DEFAULT_PROMPT") ||
  env("OLLAMA_VISION_PROMPT") ||
  "Describe this image and mention notable objects or text.";

class OpenAiVisionProvider implements VisionProvider {
  async describeImage(imageBase64: string, mime: string, prompt: string): Promise<CaptionResult> {
    const apiKey = env("VISION_HTTP_API_KEY") || env("OPENAI_API_KEY");
    const base = env("VISION_HTTP_BASE") || (apiKey ? "https://api.openai.com" : "");
    lastVisionProviderError = null;
    if (!base || typeof fetch !== "function") {
      lastVisionProviderError = !base ? "vision_provider_base_missing" : "fetch_unavailable";
      return undefined;
    }
    if (isOfficialOpenAiBase(base) && !apiKey) {
      lastVisionProviderError = "vision_provider_api_key_missing";
      return undefined;
    }
    const model = env("VISION_HTTP_MODEL") || env("LLM_HTTP_MODEL") || "gpt-4o-mini";
    const body = {
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: resolvePrompt(prompt) },
            { type: "image_url", image_url: { url: `data:${mime};base64,${imageBase64}` } },
          ],
        },
      ],
      stream: false,
    };
    const timeoutMs = envInt("VISION_HTTP_TIMEOUT_MS", 30_000);
    const res = await fetchWithTimeout(`${base.replace(/\/+$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    }, timeoutMs).catch((error: unknown) => {
      lastVisionProviderError = error instanceof Error ? error.message : "vision_provider_request_failed";
      return undefined;
    });
    if (!res) {
      lastVisionProviderError ??= "vision_provider_request_failed";
      return undefined;
    }
    if (!res.ok) {
      lastVisionProviderError = `vision_provider_http_${res.status}`;
      return undefined;
    }
    const payloadJson = (await res.json()) as any;
    const text = payloadJson?.choices?.[0]?.message?.content;
    const trimmed = typeof text === "string" ? text.trim() : "";
    if (!trimmed) lastVisionProviderError = "vision_provider_empty_response";
    return trimmed || undefined;
  }
}

class OllamaVisionProvider implements VisionProvider {
  async describeImage(imageBase64: string, mime: string, prompt: string): Promise<CaptionResult> {
    const base = env("OLLAMA_ENDPOINT") || env("VISION_HTTP_BASE");
    lastVisionProviderError = null;
    if (!base || typeof fetch !== "function") {
      lastVisionProviderError = !base ? "vision_provider_base_missing" : "fetch_unavailable";
      return undefined;
    }
    const model = resolveOllamaVisionModel();
    const apiKey = env("OLLAMA_API_KEY") || env("VISION_HTTP_API_KEY");
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: resolvePrompt(prompt) },
          { type: "image_url", image_url: { url: `data:${mime};base64,${imageBase64}` } },
        ],
      },
    ];
    const body = { model, messages, stream: false };
    const timeoutMs = envInt("VISION_HTTP_TIMEOUT_MS", 30_000);
    const res = await fetchWithTimeout(`${base.replace(/\/+$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    }, timeoutMs).catch((error: unknown) => {
      lastVisionProviderError = error instanceof Error ? error.message : "vision_provider_request_failed";
      return undefined;
    });
    if (!res) {
      lastVisionProviderError ??= "vision_provider_request_failed";
      return undefined;
    }
    if (!res.ok) {
      lastVisionProviderError = `vision_provider_http_${res.status}`;
      return undefined;
    }
    const payloadJson = (await res.json()) as any;
    const text = payloadJson?.choices?.[0]?.message?.content;
    const trimmed = typeof text === "string" ? text.trim() : "";
    if (!trimmed) lastVisionProviderError = "vision_provider_empty_response";
    return trimmed || undefined;
  }
}

export const getVisionProvider = (): VisionProvider => {
  const configuredProvider = env("VISION_PROVIDER").toLowerCase();
  if (configuredProvider === "openai") return new OpenAiVisionProvider();
  if (configuredProvider === "ollama") return new OllamaVisionProvider();
  const wantOllama = !!env("OLLAMA_ENDPOINT");
  if (wantOllama) return new OllamaVisionProvider();
  return new OpenAiVisionProvider();
};

// Re-export prompt resolver for callers that want to reuse the same env selection.
export const defaultVisionPrompt = resolvePrompt;

export const getVisionProviderHealth = (): HelixVisualProviderHealth => {
  const configuredProvider = env("VISION_PROVIDER").toLowerCase();
  const hasOllamaEndpoint = !!env("OLLAMA_ENDPOINT");
  const hasOllama = configuredProvider === "ollama" || (!configuredProvider && hasOllamaEndpoint);
  const apiKey = env("VISION_HTTP_API_KEY") || env("OPENAI_API_KEY");
  const customBase = env("VISION_HTTP_BASE");
  const openAiBase = customBase || (apiKey ? "https://api.openai.com" : "");
  const provider = hasOllama ? "ollama" : openAiBase ? "openai" : configuredProvider ? "unknown" : "none";
  const model = hasOllama
    ? resolveOllamaVisionModel()
    : openAiBase
      ? (env("VISION_HTTP_MODEL") || env("LLM_HTTP_MODEL") || "gpt-4o-mini")
      : null;
  const openAiNeedsKey = provider === "openai" && Boolean(openAiBase) && isOfficialOpenAiBase(openAiBase) && !apiKey;
  const configured = !openAiNeedsKey && (hasOllamaEndpoint || Boolean(customBase) || Boolean(apiKey));
  const missingReason = !configured
    ? openAiNeedsKey
      ? "OpenAI vision is selected, but OPENAI_API_KEY or VISION_HTTP_API_KEY is missing."
      : "No vision provider endpoint or API key is configured."
    : hasOllama && !hasOllamaEndpoint
      ? "VISION_PROVIDER=ollama is set, but OLLAMA_ENDPOINT is missing."
      : null;
  return {
    schema: "helix.visual_provider_health.v1",
    configured,
    provider,
    model,
    last_error: missingReason ?? lastVisionProviderError,
    can_analyze_inline_image: configured && typeof fetch === "function" && !missingReason,
    assistant_answer: false,
    raw_image_included: false,
  };
};
