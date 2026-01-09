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
  const fetch = await getFetch();
  const base = normalizeBase();
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
      : undefined;
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

  const response = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    throw new Error(`LLM HTTP ${response.status}`);
  }
  const payload = (await response.json()) as any;
  const text = payload?.choices?.[0]?.message?.content ?? "";
  const usage = payload?.usage ?? {};

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

  return { text, usage, model, essence_id: essenceId };
};
