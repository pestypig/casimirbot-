import crypto from "node:crypto";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { EssenceEnvelope } from "@shared/essence-schema";
import { putBlob } from "../storage";
import { putEnvelopeWithPolicy } from "./provenance";
import { assertHullAllowed } from "../security/hull-guard";

const DEFAULT_STT_HTTP_RPM = Math.max(1, Number(process.env.STT_HTTP_RPM ?? 60));

export const sttHttpSpec: ToolSpecShape = {
  name: "stt.whisper.http.transcribe",
  desc: "Whisper via HTTP (OpenAI-compatible or generic JSON)",
  inputSchema: {} as any,
  outputSchema: {} as any,
  deterministic: true,
  rateLimit: { rpm: DEFAULT_STT_HTTP_RPM },
  safety: { risks: ["network_access"] },
};

const whisperMode = (process.env.WHISPER_HTTP_MODE ?? "openai").toLowerCase();

let fetchImpl: typeof fetch | null = typeof globalThis.fetch === "function" ? globalThis.fetch : null;
async function getFetch(): Promise<typeof fetch> {
  if (fetchImpl) {
    return fetchImpl;
  }
  const mod = await import("node-fetch");
  fetchImpl = (mod.default ?? mod) as unknown as typeof fetch;
  return fetchImpl;
}

const resolveBaseUrl = (): string => {
  const base = (process.env.WHISPER_HTTP_URL ?? "").trim();
  if (!base) {
    throw new Error("WHISPER_HTTP_URL not set");
  }
  const normalized = base.replace(/\/+$/, "");
  assertHullAllowed(normalized);
  return normalized;
};

type HttpSttResult = {
  text: string;
  language?: string;
  duration_ms?: number;
  segments?: Array<Record<string, unknown>>;
  raw?: any;
};

async function callOpenAiLike(audioUrl: string, prompt?: string): Promise<HttpSttResult> {
  const fetch = await getFetch();
  const fd = new FormData();
  // Default OpenAI Whisper model name; callers may override at gateway level.
  fd.set("model", "whisper-1");
  if (prompt) {
    fd.set("prompt", prompt);
  }

  // OpenAI /v1/audio/transcriptions expects a multipart file upload under key `file`.
  // If we were given a remote URL, download it first (respecting Hull allowlist), then upload the bytes.
  try {
    const u = new URL(audioUrl);
    // Assert outbound to the audio host is allowed when in Hull Mode.
    // We only assert here; the actual POST goes to api.openai.com (or configured base), which is checked elsewhere.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { assertHullAllowed } = require("../security/hull-guard");
    assertHullAllowed(u.origin);
    const fileResp = await fetch(audioUrl);
    if (!fileResp.ok) {
      throw new Error(`audio_fetch_failed_${fileResp.status}`);
    }
    const ab = await fileResp.arrayBuffer();
    const filename = u.pathname.split("/").pop() || "audio.wav";
    const blob = new Blob([ab]);
    (fd as any).append("file", blob, filename);
  } catch {
    // If it's not a valid URL or fetch fails, attempt to treat as data URI
    if (audioUrl.startsWith("data:")) {
      const base64 = audioUrl.split(",", 2)[1] ?? "";
      const bin = Buffer.from(base64, "base64");
      const blob = new Blob([bin]);
      (fd as any).append("file", blob, "audio.wav");
    } else {
      // Last resort: some gateways support `file_url` passthrough, keep compatibility.
      fd.set("file_url", audioUrl);
    }
  }

  const base = resolveBaseUrl();
  const response = await fetch(`${base}/v1/audio/transcriptions`, {
    method: "POST",
    headers: {
      ...(process.env.WHISPER_HTTP_API_KEY ? { Authorization: `Bearer ${process.env.WHISPER_HTTP_API_KEY}` } : {}),
    },
    body: fd as any,
  });
  if (!response.ok) {
    throw new Error(`STT HTTP ${response.status}`);
  }
  const payload = (await response.json()) as any;
  return {
    text: payload?.text ?? "",
    language: payload?.language ?? "en",
    duration_ms: payload?.duration_ms,
    segments: payload?.segments ?? [],
    raw: payload,
  };
}

async function callGeneric(audioUrl: string, prompt?: string): Promise<HttpSttResult> {
  const fetch = await getFetch();
  const base = resolveBaseUrl();
  const response = await fetch(`${base}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: audioUrl, prompt }),
  });
  if (!response.ok) {
    throw new Error(`STT HTTP ${response.status}`);
  }
  const payload = (await response.json()) as any;
  return {
    text: payload?.text ?? "",
    language: payload?.language ?? "en",
    duration_ms: payload?.duration_ms,
    segments: payload?.segments ?? [],
    raw: payload,
  };
}

export const sttHttpHandler: ToolHandler = async (input: any, ctx: any) => {
  const audioUrl = input?.audio_url;
  if (!audioUrl) {
    throw new Error("audio_url required");
  }
  const prompt = typeof input?.prompt === "string" ? input.prompt : undefined;
  const personaId = ctx?.personaId ?? "persona:unknown";
  const request = whisperMode === "openai" ? await callOpenAiLike(audioUrl, prompt) : await callGeneric(audioUrl, prompt);
  const text = String(request.text ?? "");
  const language = request.language ?? input?.language ?? "en";
  const durationMs = request.duration_ms ?? input?.duration_ms ?? 0;
  const segments = Array.isArray(request.segments) ? request.segments : [];
  const now = new Date().toISOString();

  const buffer = Buffer.from(text, "utf8");
  const blob = await putBlob(buffer, { contentType: "text/plain" });
  if (!blob?.uri) {
    throw new Error("storage_put_failed");
  }
  const textHash = crypto.createHash("sha256").update(buffer).digest("hex");
  const paramsHash = crypto.createHash("sha256").update(JSON.stringify({ audioUrl, prompt, whisperMode })).digest("hex");

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
      text: { lang: language },
      audio: {
        duration_ms: durationMs,
        sample_rate: input?.sample_rate ?? 16000,
      },
    },
    provenance: {
      pipeline: [
        {
          name: "whisper-http",
          impl_version: whisperMode,
          lib_hash: { algo: "sha256", value: paramsHash },
          params: {
            audio_url: audioUrl,
            prompt,
            mode: whisperMode,
          },
          input_hash: { algo: "sha256", value: crypto.createHash("sha256").update(audioUrl).digest("hex") },
          output_hash: { algo: "sha256", value: textHash },
          started_at: now,
          ended_at: new Date().toISOString(),
        },
      ],
      merkle_root: { algo: "sha256", value: textHash },
      previous: null,
      signatures: [],
    },
    embeddings: [],
  });
  await putEnvelopeWithPolicy(env);

  return {
    essence_id: env.header.id,
    text,
    language,
    duration_ms: durationMs,
    segments,
    mode: whisperMode,
  };
};
