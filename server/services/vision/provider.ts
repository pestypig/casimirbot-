/**
 * Simple vision provider abstraction so we can swap OpenAI-style vision and Ollama vision.
 * Ollama is treated as an OpenAI-compatible chat endpoint when OLLAMA_ENDPOINT is set.
 */
import crypto from "node:crypto";

type CaptionResult = string | undefined;

export interface VisionProvider {
  describeImage(imageBase64: string, mime: string, prompt: string): Promise<CaptionResult>;
}

const env = (key: string) => (process.env[key] ?? "").trim();

const resolvePrompt = (prompt?: string) =>
  prompt?.trim() ||
  env("VISION_DEFAULT_PROMPT") ||
  env("OLLAMA_VISION_PROMPT") ||
  "Describe this image and mention notable objects or text.";

class OpenAiVisionProvider implements VisionProvider {
  async describeImage(imageBase64: string, mime: string, prompt: string): Promise<CaptionResult> {
    const base = env("VISION_HTTP_BASE");
    if (!base || typeof fetch !== "function") return undefined;
    const model = env("VISION_HTTP_MODEL") || env("LLM_HTTP_MODEL") || "gpt-4o-mini";
    const apiKey = env("VISION_HTTP_API_KEY") || env("LLM_HTTP_API_KEY");
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
    const res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return undefined;
    const payloadJson = (await res.json()) as any;
    const text = payloadJson?.choices?.[0]?.message?.content;
    return typeof text === "string" ? text.trim() : undefined;
  }
}

class OllamaVisionProvider implements VisionProvider {
  async describeImage(imageBase64: string, mime: string, prompt: string): Promise<CaptionResult> {
    const base = env("OLLAMA_ENDPOINT") || env("VISION_HTTP_BASE");
    if (!base || typeof fetch !== "function") return undefined;
    const model =
      env("OLLAMA_VISION_MODEL") ||
      env("VISION_HTTP_MODEL") ||
      env("LLM_HTTP_MODEL") ||
      "qwen3-vl";
    const apiKey = env("OLLAMA_API_KEY") || env("VISION_HTTP_API_KEY") || env("LLM_HTTP_API_KEY");
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
    const res = await fetch(`${base.replace(/\/+$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return undefined;
    const payloadJson = (await res.json()) as any;
    const text = payloadJson?.choices?.[0]?.message?.content;
    return typeof text === "string" ? text.trim() : undefined;
  }
}

export const getVisionProvider = (): VisionProvider => {
  const wantOllama = !!env("OLLAMA_ENDPOINT") || env("VISION_PROVIDER") === "ollama";
  if (wantOllama) return new OllamaVisionProvider();
  return new OpenAiVisionProvider();
};

// Re-export prompt resolver for callers that want to reuse the same env selection.
export const defaultVisionPrompt = resolvePrompt;
