import crypto from "node:crypto";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { EssenceEnvelope } from "@shared/essence-schema";
import { putBlob } from "../storage";
import { putEnvelope } from "../services/essence/store";
import { assertHullAllowed } from "../security/hull-guard";

const DEFAULT_VISION_HTTP_RPM = Math.max(1, Number(process.env.VISION_HTTP_RPM ?? 60));

const resolveVisionBase = (): string => {
  const base =
    (process.env.VISION_HTTP_BASE ?? "").trim() ||
    (process.env.OLLAMA_ENDPOINT ?? "").trim();
  if (!base) throw new Error("VISION_HTTP_BASE not set (you can also set OLLAMA_ENDPOINT for local vision)");
  const normalized = base.replace(/\/+$/, "");
  assertHullAllowed(normalized);
  return normalized;
};

const resolveVisionModel = (): string => {
  const explicit =
    (process.env.VISION_HTTP_MODEL ?? "").trim() ||
    (process.env.LLM_HTTP_MODEL ?? "").trim() ||
    (process.env.OLLAMA_VISION_MODEL ?? "").trim();
  if (explicit) return explicit;
  // Sensible default for Ollama vision-capable models; OpenAI users already set VISION_HTTP_MODEL.
  return "qwen3-vl";
};

export const visionHttpSpec: ToolSpecShape = {
  name: "vision.http.describe",
  desc: "Vision model via OpenAI-compatible Chat Completions HTTP (image caption/extract)",
  inputSchema: {} as any,
  outputSchema: {} as any,
  deterministic: false,
  rateLimit: { rpm: DEFAULT_VISION_HTTP_RPM },
  safety: { risks: ["network_access"] },
};

let fetchImpl: typeof fetch | null = typeof globalThis.fetch === "function" ? globalThis.fetch : null;
async function getFetch(): Promise<typeof fetch> {
  if (fetchImpl) return fetchImpl;
  const mod = await import("node-fetch");
  fetchImpl = (mod.default ?? mod) as unknown as typeof fetch;
  return fetchImpl;
}

const normalizeBase = (): string => {
  return resolveVisionBase();
};

type VisionInput = {
  image_url?: string;
  image_base64?: string;
  prompt?: string;
  language?: string;
};

const resolvePrompt = (input?: string, goal?: string): string => {
  const envPrompt =
    (process.env.VISION_DEFAULT_PROMPT ?? "").trim() ||
    (process.env.OLLAMA_VISION_PROMPT ?? "").trim();
  if (input && input.trim()) return input.trim();
  if (goal && goal.trim()) return goal.trim();
  if (envPrompt) return envPrompt;
  return "Describe this image succinctly with key entities and text.";
};

export const visionHttpHandler: ToolHandler = async (_input: any, ctx: any) => {
  const input = (_input ?? {}) as VisionInput;
  const fetch = await getFetch();
  const base = normalizeBase();
  const model = resolveVisionModel();
  const apiKey =
    process.env.VISION_HTTP_API_KEY?.trim() ||
    process.env.LLM_HTTP_API_KEY?.trim() ||
    process.env.OLLAMA_API_KEY?.trim();
  const personaId = ctx?.personaId ?? "persona:unknown";
  const now = new Date().toISOString();

  const imageUrl = input.image_url || (input.image_base64 ? `data:image/png;base64,${input.image_base64}` : undefined);
  if (!imageUrl) {
    throw new Error("image_url or image_base64 required");
  }

  const userPrompt = resolvePrompt(input.prompt, ctx?.goal);

  // OpenAI-compatible multimodal chat body
  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: userPrompt },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    },
  ];

  const body = { model, messages, stream: false } as any;

  const response = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`VISION HTTP ${response.status}`);
  }
  const payload = (await response.json()) as any;
  const text = payload?.choices?.[0]?.message?.content ?? "";
  const usage = payload?.usage ?? {};

  // Persist caption as a text Essence envelope (optional but useful for provenance)
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
          license: _input?.license ?? "CC-BY-4.0",
        },
        rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
        acl: { visibility: "private", groups: [] },
      },
      features: {
        text: { lang: input.language ?? "en" },
      },
      embeddings: [],
      provenance: {
        pipeline: [
          {
            name: "vision-http",
            impl_version: payload?.system_fingerprint ?? "1.0",
            lib_hash: {
              algo: "sha256",
              value: crypto.createHash("sha256").update(`${base}:${model}`).digest("hex"),
            },
            params: { model },
            input_hash: { algo: "sha256", value: crypto.createHash("sha256").update(imageUrl).digest("hex") },
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
    await putEnvelope(env);
    essenceId = env.header.id;
  }

  return { text, usage, model, essence_id: essenceId };
};

