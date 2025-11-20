import { createHash } from "node:crypto";
import type { TEssenceEnvelope } from "@shared/essence-schema";
import { EssenceEnvelope } from "@shared/essence-schema";
import { getEnvelope, putEnvelope } from "./store";
import { essenceHub } from "./events";

type StorageRef = { uri: string; cid?: string };

export type IngestJobDescriptor = {
  envelopeId: string;
  modality: TEssenceEnvelope["header"]["modality"];
  mime: string;
  originalName?: string;
  bytes: number;
  buffer: Buffer;
  hash: string;
  storage: StorageRef;
};

type JobKind = "stt" | "vision" | "audio_features" | "text_embed";
type JobRecord = { kind: JobKind; payload: IngestJobDescriptor };

const jobQueue: JobRecord[] = [];
let draining = false;
const flushWaiters = new Set<() => void>();

export function queueIngestJobs(descriptor: IngestJobDescriptor): void {
  const kinds = planJobs(descriptor);
  for (const kind of kinds) {
    jobQueue.push({ kind, payload: descriptor });
  }
  if (kinds.length) {
    scheduleDrain();
  }
}

const planJobs = (descriptor: IngestJobDescriptor): JobKind[] => {
  switch (descriptor.modality) {
    case "audio":
      return ["stt", "audio_features"];
    case "image":
      return ["vision"];
    case "video":
      return ["vision", "audio_features", "stt"];
    case "multimodal":
      return ["vision", "audio_features", "stt"];
    case "text":
      return ["text_embed"];
    default:
      return [];
  }
};

function scheduleDrain(): void {
  if (draining) {
    return;
  }
  setImmediate(() => {
    void drainQueue();
  });
}

async function drainQueue(): Promise<void> {
  if (draining) {
    return;
  }
  draining = true;
  try {
    while (jobQueue.length) {
      const job = jobQueue.shift();
      if (!job) {
        break;
      }
      try {
        switch (job.kind) {
          case "stt":
            await runSttJob(job.payload);
            break;
          case "vision":
            await runVisionJob(job.payload);
            break;
          case "audio_features":
            await runAudioFeatureJob(job.payload);
            break;
          case "text_embed":
            await runTextEmbeddingJob(job.payload);
            break;
          default:
            break;
        }
      } catch (err) {
        console.error(`[essence-ingest] job ${job.kind} failed for ${job.payload.envelopeId}`, err);
      }
    }
  } finally {
    draining = false;
    if (jobQueue.length) {
      scheduleDrain();
      return;
    }
    flushWaiters.forEach((resolve) => resolve());
    flushWaiters.clear();
  }
}

async function runSttJob(payload: IngestJobDescriptor): Promise<void> {
  const transcript = deriveTranscript(payload.buffer, payload.originalName || payload.mime);
  const lang = detectLanguage(transcript);
  const durationMs = estimateDuration(payload.bytes);
  await applyEnvelopePatch(payload.envelopeId, (current) => {
    const textFeature = {
      ...(current.features?.text ?? {}),
      transcript,
      lang,
      source: "ingest.stt",
    };
    const audioFeature = {
      sample_rate: current.features?.audio?.sample_rate ?? 16_000,
      duration_ms: current.features?.audio?.duration_ms ?? durationMs,
      fingerprint: current.features?.audio?.fingerprint ?? payload.hash,
    };
    const embedding = buildEmbeddingFromText(transcript, "ingest/audio-transcript-32");
    return {
      ...current,
      features: {
        ...current.features,
        text: textFeature,
        audio: { ...(current.features?.audio ?? {}), ...audioFeature },
      },
      embeddings: upsertEmbedding(current.embeddings, embedding),
    };
  });
}

async function runVisionJob(payload: IngestJobDescriptor): Promise<void> {
  const dims = readImageDimensions(payload.buffer);
  const fallback = fallbackDimensions(payload.bytes);
  const width = dims?.width ?? fallback.width;
  const height = dims?.height ?? fallback.height;
  const phash = createHash("sha256").update(payload.buffer).digest("hex").slice(0, 48);
  const embedding = buildEmbeddingFromHash(payload.buffer, "ingest/image-hash-32");
  const { caption, tags: visionTags } = await describeImage(payload, width, height);
  const fallbackTags = buildImageTags(payload, caption, width, height);
  const mergedVisionTags = mergeTags(visionTags, fallbackTags);
  await applyEnvelopePatch(payload.envelopeId, (current) => {
    const imageFeature = {
      width,
      height,
      pHash: phash,
    };
    const existingText = current.features?.text ?? {};
    const textUpdates: Record<string, unknown> = {};
    if (caption) {
      textUpdates.caption = caption;
      textUpdates.source = "ingest.vision";
    }
    const mergedTags = mergeTags(existingText.tags, mergedVisionTags);
    if (mergedTags.length > 0) {
      textUpdates.tags = mergedTags;
    }
    const nextText =
      Object.keys(textUpdates).length > 0 ? { ...existingText, ...textUpdates } : undefined;
    return {
      ...current,
      features: {
        ...current.features,
        image: imageFeature,
        ...(nextText ? { text: nextText } : {}),
      },
      embeddings: upsertEmbedding(current.embeddings, embedding),
    };
  });
}

async function runAudioFeatureJob(payload: IngestJobDescriptor): Promise<void> {
  const sampleRate = 16_000;
  const channels = 1;
  const bytesPerFrame = Math.max(1, channels * 2);
  const frames = payload.bytes / bytesPerFrame;
  const durationMs = Math.max(500, Math.round((frames / sampleRate) * 1000));
  const fingerprint = payload.hash;
  const embedding = buildEmbeddingFromHash(payload.buffer, "ingest/audio-fingerprint-16");
  await applyEnvelopePatch(payload.envelopeId, (current) => {
    const audioFeature = {
      sample_rate: sampleRate,
      duration_ms: durationMs,
      fingerprint,
    };
    return {
      ...current,
      features: { ...current.features, audio: { ...(current.features?.audio ?? {}), ...audioFeature } },
      embeddings: upsertEmbedding(current.embeddings, embedding),
    };
  });
}

async function runTextEmbeddingJob(payload: IngestJobDescriptor): Promise<void> {
  const text = bufferToUtf8(payload.buffer);
  const normalized = text.replace(/\s+/g, " ").trim();
  const summary = summarizeText(normalized, payload.originalName);
  if (!summary) {
    return;
  }
  const tokenCounts = buildTokenCounts(summary);
  const embedding = buildEmbeddingFromText(summary, "ingest/text-hash-32");
  const keywordTags = Object.keys(tokenCounts).slice(0, 8);
  const nameTags = extractNameTags(payload.originalName);
  const mergedTags = mergeTags(keywordTags, nameTags);
  await applyEnvelopePatch(payload.envelopeId, (current) => {
    const existingText = current.features?.text ?? {};
    const nextTags = mergeTags(existingText.tags, mergedTags);
    return {
      ...current,
      features: {
        ...current.features,
        text: {
          ...existingText,
          summary,
          tokenizer: "unicode-word",
          token_counts: tokenCounts,
          tags: nextTags.length > 0 ? nextTags : existingText.tags,
          source: "ingest.text",
        },
      },
      embeddings: upsertEmbedding(current.embeddings, embedding),
    };
  });
}

async function applyEnvelopePatch(
  envelopeId: string,
  mutator: (current: TEssenceEnvelope) => TEssenceEnvelope,
): Promise<void> {
  const current = await getEnvelope(envelopeId);
  if (!current) {
    return;
  }
  const next = EssenceEnvelope.parse(mutator(current));
  await putEnvelope(next);
  essenceHub.emit("updated", { type: "updated", essenceId: envelopeId });
}

type EmbeddingEntry = TEssenceEnvelope["embeddings"][number];

function upsertEmbedding(existing: EmbeddingEntry[], next: EmbeddingEntry): EmbeddingEntry[] {
  const filtered = existing.filter((entry) => entry.space !== next.space);
  return [...filtered, next];
}

function deriveTranscript(buffer: Buffer, fallbackLabel: string): string {
  const decoded = buffer.toString("utf8").replace(/[^\p{Letter}\p{Number}\s.,!?'-]+/gu, " ").replace(/\s+/g, " ").trim();
  if (decoded.length >= 4) {
    return decoded.slice(0, 2048);
  }
  return `Transcription pending for ${fallbackLabel}`;
}

function detectLanguage(text: string): string {
  if (/[а-яё]/iu.test(text)) return "ru";
  if (/[ñáéíóúü]/iu.test(text)) return "es";
  if (/[äöüß]/iu.test(text)) return "de";
  if (/[àèìòùçâêîôû]/iu.test(text)) return "fr";
  return "en";
}

function estimateDuration(bytes: number): number {
  const sampleRate = 16_000;
  const bytesPerSample = 2;
  const frames = bytes / bytesPerSample;
  const seconds = frames / sampleRate;
  return Math.max(500, Math.round(seconds * 1000));
}

type ImageDimensions = { width: number; height: number };

function readImageDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length >= 24 && buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length >= 10 && buffer.slice(0, 6).toString("ascii").startsWith("GIF")) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        break;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2) {
        break;
      }
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + length;
    }
  }
  return null;
}

const fallbackDimensions = (bytes: number): ImageDimensions => {
  const base = Math.max(32, Math.round(Math.sqrt(bytes)));
  return { width: base, height: Math.max(32, base) };
};

function buildEmbeddingFromText(text: string, space: string): EmbeddingEntry {
  const vec = textToVector(text, 32);
  return {
    space,
    dim: vec.length,
    storage: { inline_base64: float32ToBase64(vec) },
    composer: "ingest/enrichment-0.1",
    dtype: "f32",
  };
}

function buildEmbeddingFromHash(buffer: Buffer, space: string): EmbeddingEntry {
  const hash = createHash("sha256").update(buffer).digest();
  const vec = new Array(16).fill(0).map((_, idx) => hash[idx] / 255);
  return {
    space,
    dim: vec.length,
    storage: { inline_base64: float32ToBase64(vec) },
    composer: "ingest/enrichment-0.1",
    dtype: "f32",
  };
}

function textToVector(text: string, dim: number): number[] {
  const vector = new Array(dim).fill(0);
  for (let idx = 0; idx < text.length; idx += 1) {
    const code = text.charCodeAt(idx) || 0;
    vector[idx % dim] += code / 255;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

function float32ToBase64(vector: number[]): string {
  const array = new Float32Array(vector);
  return Buffer.from(array.buffer).toString("base64");
}

async function describeImage(
  payload: IngestJobDescriptor,
  width: number,
  height: number,
): Promise<{ caption?: string; tags: string[] }> {
  const remoteCaption = await requestVisionCaption(payload).catch(() => undefined);
  if (remoteCaption) {
    return {
      caption: remoteCaption,
      tags: mergeTags(extractKeywords(remoteCaption), extractNameTags(payload.originalName)),
    };
  }
  const orientation = width >= height ? "landscape" : "portrait";
  const brightness = estimateBrightnessTag(payload.buffer);
  const mediaLabel = payload.mime?.split("/")[1] ?? "image";
  const baseCaption = `A ${brightness} ${orientation} image (${mediaLabel}) approximately ${width}×${height}px.`;
  const tags = mergeTags([orientation, brightness, payload.mime?.split("/")[1] ?? "image"], extractNameTags(payload.originalName));
  return { caption: baseCaption, tags };
}

function buildImageTags(
  payload: IngestJobDescriptor,
  caption: string | undefined,
  width: number,
  height: number,
): string[] {
  const resTag = width * height >= 1_000_000 ? "high-res" : "low-res";
  const orientation = width >= height ? "landscape" : "portrait";
  return mergeTags(
    [resTag, orientation, payload.mime?.split("/")[1] ?? "image"],
    extractNameTags(payload.originalName),
    extractKeywords(caption),
  );
}

async function requestVisionCaption(payload: IngestJobDescriptor): Promise<string | undefined> {
  const base = (process.env.VISION_HTTP_BASE ?? "").trim();
  if (!base || typeof fetch !== "function") {
    return undefined;
  }
  try {
    const model = (process.env.VISION_HTTP_MODEL ?? process.env.LLM_HTTP_MODEL ?? "gpt-4o-mini").trim();
    const apiKey = process.env.VISION_HTTP_API_KEY?.trim() || process.env.LLM_HTTP_API_KEY?.trim();
    const mime = payload.mime || "image/png";
    const imageBase64 = payload.buffer.toString("base64");
    const body = {
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this image and mention notable objects or text." },
            { type: "image_url", image_url: { url: `data:${mime};base64,${imageBase64}` } },
          ],
        },
      ],
      stream: false,
    };
    const response = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return undefined;
    }
    const payloadJson = (await response.json()) as any;
    const text = payloadJson?.choices?.[0]?.message?.content;
    return typeof text === "string" ? text.trim() : undefined;
  } catch (error) {
    console.warn("[essence-ingest] vision caption failed", error);
    return undefined;
  }
}

function estimateBrightnessTag(buffer: Buffer): string {
  if (!buffer.length) return "neutral";
  const sample = Math.min(buffer.length, 4096);
  let sum = 0;
  for (let i = 0; i < sample; i += 1) {
    sum += buffer[i];
  }
  const avg = sum / sample;
  if (avg > 180) return "bright";
  if (avg < 70) return "dark";
  return "neutral";
}

function mergeTags(...lists: Array<string[] | undefined>): string[] {
  const set = new Set<string>();
  for (const list of lists) {
    for (const entry of list ?? []) {
      const normalized = entry?.toString().trim().toLowerCase();
      if (normalized) {
        set.add(normalized);
      }
    }
  }
  return Array.from(set);
}

function extractKeywords(text?: string): string[] {
  if (!text?.trim()) {
    return [];
  }
  const matches = text.toLowerCase().match(/\p{Letter}[\p{Letter}\p{Number}_-]{2,}/gu) ?? [];
  return matches.slice(0, 12);
}

function extractNameTags(name?: string): string[] {
  if (!name) return [];
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !/^\d+$/.test(token))
    .slice(0, 8);
}

function bufferToUtf8(buffer: Buffer, limit = 64_000): string {
  if (!buffer || buffer.length === 0) {
    return "";
  }
  const slice = buffer.slice(0, Math.min(limit, buffer.length));
  return slice.toString("utf8");
}

function summarizeText(text: string, fallbackName?: string): string {
  const normalized = text.trim();
  if (normalized.length > 0) {
    return normalized.length > 600 ? `${normalized.slice(0, 600)}…` : normalized;
  }
  return fallbackName ? `Text attachment ${fallbackName}` : "";
}

function buildTokenCounts(text: string, maxEntries = 48): Record<string, number> {
  const counts: Record<string, number> = {};
  const tokens = text.toLowerCase().match(/\p{Letter}[\p{Letter}\p{Number}_-]*/gu) ?? [];
  for (const token of tokens) {
    counts[token] = (counts[token] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxEntries),
  );
}
export function __flushIngestJobsForTest(): Promise<void> {
  if (!jobQueue.length && !draining) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    flushWaiters.add(resolve);
  });
}

export function __resetIngestJobQueueForTest(): void {
  jobQueue.length = 0;
  draining = false;
  flushWaiters.forEach((resolve) => resolve());
  flushWaiters.clear();
}
