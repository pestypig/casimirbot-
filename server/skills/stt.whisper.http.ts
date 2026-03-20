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

type WhisperHttpMode = "openai" | "generic";
type WhisperTask = "transcribe" | "translate";

const normalizeWhisperMode = (value: unknown): WhisperHttpMode => {
  return typeof value === "string" && value.trim().toLowerCase() === "generic" ? "generic" : "openai";
};

const normalizeWhisperTask = (value: unknown): WhisperTask => {
  return typeof value === "string" && value.trim().toLowerCase() === "translate" ? "translate" : "transcribe";
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

const resolveBaseUrl = (): string => {
  const mode = normalizeWhisperMode(process.env.WHISPER_HTTP_MODE);
  const base = ((process.env.WHISPER_HTTP_URL ?? "").trim() || (mode === "openai" ? "https://api.openai.com" : "")).trim();
  if (!base) {
    throw new Error("WHISPER_HTTP_URL not set");
  }
  const normalized = base.replace(/\/+$/, "");
  assertHullAllowed(normalized);
  return normalized;
};

const resolveBaseUrlOverride = (args: { backendUrl?: string; mode: WhisperHttpMode }): string => {
  const explicit = (args.backendUrl ?? "").trim();
  if (explicit) {
    const normalizedExplicit = explicit.replace(/\/+$/, "");
    assertHullAllowed(normalizedExplicit);
    return normalizedExplicit;
  }
  if (args.mode === "openai") {
    const fallbackOpenAi = "https://api.openai.com";
    const envBase = (process.env.WHISPER_HTTP_URL ?? "").trim();
    const normalized = (envBase || fallbackOpenAi).replace(/\/+$/, "");
    assertHullAllowed(normalized);
    return normalized;
  }
  return resolveBaseUrl();
};

const resolveApiKey = (explicitKey?: string): string | undefined => {
  const explicit = (explicitKey ?? "").trim();
  if (explicit) return explicit;
  return (
    process.env.WHISPER_HTTP_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    undefined
  );
};

type HttpSttResult = {
  text: string;
  language?: string;
  duration_ms?: number;
  segments?: Array<Record<string, unknown>>;
  model_used?: string;
  raw?: any;
};

const extensionForAudioMime = (mime: string | undefined): string => {
  const normalized = (mime ?? "").trim().toLowerCase();
  if (normalized.includes("webm")) return "webm";
  if (normalized.includes("ogg")) return "ogg";
  if (normalized.includes("mpeg")) return "mp3";
  if (normalized.includes("wav") || normalized.includes("wave")) return "wav";
  if (normalized.includes("mp4")) return "mp4";
  return "webm";
};

const sanitizeAudioMime = (mime: string | undefined): string => {
  const normalized = (mime ?? "").trim().toLowerCase();
  if (!normalized) return "audio/webm";
  const base = normalized.split(";")[0]?.trim() ?? "";
  if (!base || !base.includes("/")) return "audio/webm";
  return base;
};

const decodeDataUriAudio = (dataUri: string): { buffer: Buffer; mime: string } | null => {
  if (!dataUri.startsWith("data:")) return null;
  const commaIndex = dataUri.indexOf(",");
  if (commaIndex <= "data:".length) return null;
  const header = dataUri.slice("data:".length, commaIndex);
  const payload = dataUri.slice(commaIndex + 1);
  const headerParts = header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const mimeCandidate = headerParts[0] && headerParts[0].includes("/") ? headerParts[0] : "audio/webm";
  const mime = sanitizeAudioMime(mimeCandidate);
  const hasBase64 = headerParts.some((part) => part.toLowerCase() === "base64");
  if (hasBase64) {
    return { buffer: Buffer.from(payload, "base64"), mime };
  }
  try {
    return { buffer: Buffer.from(decodeURIComponent(payload), "utf8"), mime };
  } catch {
    return null;
  }
};

const resolveUploadFileName = (args: {
  fileNameHint?: string;
  mimeHint?: string;
  fallbackBase?: string;
}): string => {
  const fileName = (args.fileNameHint ?? "").trim();
  if (fileName) return fileName;
  const ext = extensionForAudioMime(args.mimeHint);
  const base = (args.fallbackBase ?? "audio").trim() || "audio";
  return `${base}.${ext}`;
};

const clipErrorDetail = (value: string, limit = 240): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 3)}...`;
};

const readErrorDetail = async (response: Response): Promise<string> => {
  let text = "";
  try {
    text = await response.text();
  } catch {
    return "";
  }
  const trimmed = text.trim();
  if (!trimmed) return "";
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const nested = parsed?.error as Record<string, unknown> | undefined;
    const candidate =
      (typeof nested?.message === "string" && nested.message) ||
      (typeof parsed?.message === "string" && parsed.message) ||
      trimmed;
    return clipErrorDetail(candidate);
  } catch {
    return clipErrorDetail(trimmed);
  }
};

const inferHttpStatus = (message: string): number | null => {
  const match = message.match(/STT HTTP (\d{3})/i);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
};

async function callOpenAiLike(
  args: {
    audioUrl: string;
    baseUrl: string;
    apiKey?: string;
    prompt?: string;
    language?: string;
    fileNameHint?: string;
    mimeHint?: string;
    model?: string;
    task: WhisperTask;
  },
): Promise<HttpSttResult> {
  const fetch = await getFetch();
  const fd = new FormData();
  const configuredModel = (
    args.model ??
    (args.task === "translate" ? "whisper-1" : process.env.WHISPER_HTTP_MODEL ?? "gpt-4o-mini-transcribe")
  ).trim();
  const primaryModel = configuredModel || "gpt-4o-mini-transcribe";
  const buildFormData = async (model: string): Promise<FormData> => {
    const nextFd = new FormData();
    nextFd.set("model", model);
    if (args.task === "transcribe" && args.prompt) {
      nextFd.set("prompt", args.prompt);
    }
    if (args.task === "transcribe" && typeof args.language === "string" && args.language.trim()) {
      nextFd.set("language", args.language.trim());
    }

    try {
      const u = new URL(args.audioUrl);
      // Assert outbound to the audio host is allowed when in Hull Mode.
      // We only assert here; the actual POST goes to api.openai.com (or configured base), which is checked elsewhere.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { assertHullAllowed } = require("../security/hull-guard");
      assertHullAllowed(u.origin);
      const fileResp = await fetch(args.audioUrl);
      if (!fileResp.ok) {
        throw new Error(`audio_fetch_failed_${fileResp.status}`);
      }
      const ab = await fileResp.arrayBuffer();
      const responseMime = sanitizeAudioMime(fileResp.headers.get("content-type")?.trim() || args.mimeHint);
      const filename =
        resolveUploadFileName({
          fileNameHint: args.fileNameHint,
          mimeHint: responseMime,
          fallbackBase: u.pathname.split("/").pop()?.split(".")[0] || "audio",
        });
      const blob = new Blob([ab], { type: responseMime });
      (nextFd as any).append("file", blob, filename);
    } catch {
      // If it's not a valid URL or fetch fails, attempt to treat as a data URI.
      const decodedDataUri = args.audioUrl.startsWith("data:") ? decodeDataUriAudio(args.audioUrl) : null;
      if (decodedDataUri) {
        const filename = resolveUploadFileName({
          fileNameHint: args.fileNameHint,
          mimeHint: decodedDataUri.mime || args.mimeHint,
          fallbackBase: "audio",
        });
        const blob = new Blob([decodedDataUri.buffer], {
          type: sanitizeAudioMime(decodedDataUri.mime || args.mimeHint || "audio/webm"),
        });
        (nextFd as any).append("file", blob, filename);
      } else {
        if (args.audioUrl.startsWith("data:")) {
          throw new Error("invalid_audio_data_uri");
        }
        // Last resort: some gateways support `file_url` passthrough, keep compatibility.
        nextFd.set("file_url", args.audioUrl);
      }
    }
    return nextFd;
  };

  const submit = async (model: string): Promise<{ payload: any; modelUsed: string }> => {
    const endpoint = args.task === "translate" ? "/v1/audio/translations" : "/v1/audio/transcriptions";
    const body = await buildFormData(model);
    const response = await fetch(`${args.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        ...(args.apiKey ? { Authorization: `Bearer ${args.apiKey}` } : {}),
      },
      body: body as any,
    });
    if (!response.ok) {
      const detail = await readErrorDetail(response);
      throw new Error(detail ? `STT HTTP ${response.status}: ${detail}` : `STT HTTP ${response.status}`);
    }
    const payload = (await response.json()) as any;
    return { payload, modelUsed: model };
  };

  let submitted: { payload: any; modelUsed: string };
  try {
    submitted = await submit(primaryModel);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = inferHttpStatus(message);
    const shouldFallbackModel =
      args.task === "transcribe" && status === 400 && primaryModel.toLowerCase() !== "whisper-1";
    if (!shouldFallbackModel) {
      throw error;
    }
    submitted = await submit("whisper-1");
  }

  const payload = submitted.payload;
  const modelUsed = submitted.modelUsed;
  if (args.task === "transcribe" && args.prompt) {
    // no-op (prompt already applied in buildFormData)
  }
  const language =
    args.task === "translate"
      ? "en"
      : payload?.language ??
        (typeof args.language === "string" && args.language.trim() ? args.language.trim() : "unknown");
  return {
    text: payload?.text ?? "",
    language,
    duration_ms: payload?.duration_ms,
    segments: payload?.segments ?? [],
    model_used: modelUsed,
    raw: payload,
  };
}

async function callGeneric(args: {
  audioUrl: string;
  baseUrl: string;
  prompt?: string;
  language?: string;
  task: WhisperTask;
}): Promise<HttpSttResult> {
  const fetch = await getFetch();
  const endpoint = args.task === "translate" ? "/translate" : "/transcribe";
  const response = await fetch(`${args.baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: args.audioUrl,
      prompt: args.prompt,
      language: args.language,
      task: args.task,
      target_language: args.task === "translate" ? "en" : undefined,
    }),
  });
  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new Error(detail ? `STT HTTP ${response.status}: ${detail}` : `STT HTTP ${response.status}`);
  }
  const payload = (await response.json()) as any;
  const language = args.task === "translate" ? "en" : payload?.language ?? args.language ?? "unknown";
  return {
    text: payload?.text ?? "",
    language,
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
  const mode = normalizeWhisperMode(input?.backend_mode ?? process.env.WHISPER_HTTP_MODE);
  const task = normalizeWhisperTask(input?.task);
  const prompt = typeof input?.prompt === "string" ? input.prompt : undefined;
  const rawLanguage = typeof input?.language === "string" ? input.language.trim() : "";
  const language = rawLanguage && !/^auto$/i.test(rawLanguage) ? rawLanguage : undefined;
  const model = typeof input?.model === "string" && input.model.trim() ? input.model.trim() : undefined;
  const baseUrl = resolveBaseUrlOverride({
    backendUrl: typeof input?.backend_url === "string" ? input.backend_url : undefined,
    mode,
  });
  const apiKey = resolveApiKey(typeof input?.api_key === "string" ? input.api_key : undefined);
  const personaId = ctx?.personaId ?? "persona:unknown";
  const request = mode === "openai"
    ? await callOpenAiLike({
        audioUrl,
        baseUrl,
        apiKey,
        prompt,
        language,
        fileNameHint: typeof input?.audio_filename === "string" ? input.audio_filename : undefined,
        mimeHint: typeof input?.audio_mime === "string" ? input.audio_mime : undefined,
        model,
        task,
      })
    : await callGeneric({
        audioUrl,
        baseUrl,
        prompt,
        language,
        task,
      });
  const text = String(request.text ?? "");
  const resolvedLanguage = request.language ?? language ?? "unknown";
  const durationMs = request.duration_ms ?? input?.duration_ms ?? 0;
  const segments = Array.isArray(request.segments) ? request.segments : [];
  const now = new Date().toISOString();

  const buffer = Buffer.from(text, "utf8");
  const blob = await putBlob(buffer, { contentType: "text/plain" });
  if (!blob?.uri) {
    throw new Error("storage_put_failed");
  }
  const textHash = crypto.createHash("sha256").update(buffer).digest("hex");
  const paramsHash = crypto.createHash("sha256").update(JSON.stringify({ audioUrl, prompt, mode, task, model, baseUrl })).digest("hex");

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
      text: { lang: resolvedLanguage },
      audio: {
        duration_ms: durationMs,
        sample_rate: input?.sample_rate ?? 16000,
      },
    },
    provenance: {
      pipeline: [
        {
          name: "whisper-http",
          impl_version: mode,
          lib_hash: { algo: "sha256", value: paramsHash },
          params: {
            audio_url: audioUrl,
            prompt,
            mode,
            task,
            model,
            base_url: baseUrl,
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
    language: resolvedLanguage,
    duration_ms: durationMs,
    segments,
    mode,
    task,
    model:
      request.model_used ??
      model ??
      (task === "translate" ? "whisper-1" : process.env.WHISPER_HTTP_MODEL ?? "gpt-4o-mini-transcribe"),
    backend_url: baseUrl,
  };
};
