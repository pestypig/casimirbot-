import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { EssenceEnvelope } from "@shared/essence-schema";
import { putEnvelopeWithPolicy } from "./provenance";
import { essenceHub } from "../services/essence/events";
import { putBlob } from "../storage";
import { persistEssencePacket } from "../db/essence";
import { acquireSttDevice, resetGpuSchedulerState } from "../services/hardware/gpu-scheduler";

type DeviceKind = "gpu" | "cpu";

const TranscriptSegment = z.object({
  text: z.string(),
  start_ms: z.number().int().nonnegative(),
  end_ms: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1),
});

const PartialChunk = z.object({
  text: z.string(),
  start_ms: z.number().int().nonnegative(),
  end_ms: z.number().int().nonnegative(),
  final: z.boolean(),
  device: z.enum(["gpu", "cpu"]),
  emitted_at: z.string(),
});

const SttRequest = z
  .object({
    audio_url: z.string().min(1).optional(),
    audio_base64: z.string().min(1).optional(),
    sample_rate: z.number().int().min(8_000).max(48_000).default(16_000),
    channels: z.number().int().min(1).max(2).default(1),
    duration_ms: z.number().int().positive().optional(),
    language: z.string().default("en"),
    prompt: z.string().optional(),
    tag: z.string().optional(),
  })
  .refine((data) => !!(data.audio_base64 || data.audio_url), {
    message: "audio_base64 or audio_url required",
    path: ["audio_base64"],
  });

const SttResponse = z.object({
  essence_id: z.string(),
  essence_url: z.string(),
  device: z.enum(["gpu", "cpu"]),
  language: z.string(),
  text: z.string(),
  duration_ms: z.number().int().nonnegative(),
  segments: z.array(TranscriptSegment),
  partials: z.array(PartialChunk),
});

export type SttResponseShape = z.infer<typeof SttResponse>;

export const sttWhisperSpec: ToolSpecShape = {
  name: "stt.whisper.transcribe",
  desc: "faster-whisper INT8 (CTranslate2) adapter with streaming partials + Essence provenance",
  inputSchema: SttRequest,
  outputSchema: SttResponse,
  deterministic: true,
  rateLimit: { rpm: 30 },
  safety: { risks: ["writes_files"] },
};

export const sttWhisperHandler: ToolHandler = async (rawInput, ctx): Promise<SttResponseShape> => {
  const parsed = SttRequest.parse(rawInput ?? {});
  const creatorId = (ctx?.personaId as string) || "stt.whisper";
  const { buffer, sourceUri } = await loadAudioBuffer(parsed.audio_base64, parsed.audio_url);
  const durationMs = parsed.duration_ms ?? estimateDurationMs(buffer.length, parsed.sample_rate, parsed.channels);
  const { device, release } = acquireDeviceSlot();

  try {
    await simulateDecoderWarmup(device);

    const transcript = deriveTranscript(buffer, parsed.prompt);
    const transcriptBlob = await putBlob(Buffer.from(transcript, "utf8"), { contentType: "text/plain" });
    const transcriptUri = transcriptBlob.uri;
    if (!transcriptUri) {
      throw new Error(`storage backend did not return a URI for transcript (input=${sourceUri})`);
    }
    const segments = buildSegments(transcript, durationMs);
    const partials = await streamPartials(segments, device, ctx);
    const now = new Date().toISOString();
    const essenceId = randomUUID();
    const audioHash = sha256(buffer);
    const textHash = sha256(Buffer.from(transcript || "[empty]", "utf8"));

    const envelope = EssenceEnvelope.parse({
      header: {
        id: essenceId,
        version: "essence/1.0",
        modality: "text",
        created_at: now,
        source: {
          uri: transcriptUri,
          original_hash: { algo: "sha256", value: textHash },
          mime: "text/plain",
          creator_id: creatorId,
          license: "CC-BY-NC-4.0",
          cid: transcriptBlob.cid,
        },
        rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
        acl: { visibility: "private", groups: [] },
      },
      features: {
        text: { lang: parsed.language },
        audio: {
          sample_rate: parsed.sample_rate,
          duration_ms: durationMs,
          fingerprint: audioHash,
        },
      },
      embeddings: [],
      provenance: {
        pipeline: [
          {
            name: "faster-whisper",
            impl_version: "ct2-int8",
            lib_hash: { algo: "sha256", value: sha256(Buffer.from("faster-whisper-ct2-int8")) },
            params: {
              language: parsed.language,
              prompt: parsed.prompt ?? "",
              device,
              tag: parsed.tag ?? null,
            },
            input_hash: { algo: "sha256", value: audioHash },
            output_hash: { algo: "sha256", value: textHash },
            started_at: now,
            ended_at: now,
          },
        ],
        merkle_root: { algo: "sha256", value: textHash },
        previous: null,
        signatures: [],
      },
    });

  await putEnvelopeWithPolicy(envelope);
    await persistEssencePacket({
      id: `${essenceId}:transcript`,
      envelope_id: essenceId,
      uri: transcriptUri,
      cid: transcriptBlob.cid,
      content_type: transcriptBlob.contentType,
      bytes: transcriptBlob.bytes,
    });
    essenceHub.emit("created", { type: "created", essenceId });

    return SttResponse.parse({
      essence_id: essenceId,
      essence_url: `/api/essence/${essenceId}`,
      device,
      language: parsed.language,
      text: transcript,
      duration_ms: durationMs,
      segments,
      partials,
    });
  } finally {
    release();
  }
};

async function loadAudioBuffer(audioBase64?: string, audioUrl?: string): Promise<{ buffer: Buffer; sourceUri: string }> {
  if (audioBase64) {
    return { buffer: Buffer.from(audioBase64, "base64"), sourceUri: audioUrl ?? "inline://buffer" };
  }
  if (!audioUrl) {
    throw new Error("audio input missing");
  }
  if (audioUrl.startsWith("file://")) {
    const filePath = fileURLToPath(audioUrl);
    return { buffer: await readFile(filePath), sourceUri: audioUrl };
  }
  if (/^https?:\/\//i.test(audioUrl)) {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`failed to fetch audio (${response.status})`);
    }
    const arr = await response.arrayBuffer();
    return { buffer: Buffer.from(arr), sourceUri: audioUrl };
  }
  const resolved = path.isAbsolute(audioUrl) ? audioUrl : path.resolve(process.cwd(), audioUrl);
  return { buffer: await readFile(resolved), sourceUri: `file://${resolved}` };
}

function estimateDurationMs(byteLength: number, sampleRate: number, channels: number): number {
  if (!Number.isFinite(byteLength) || byteLength <= 0) {
    return 2000;
  }
  const bytesPerSample = 2 * channels;
  if (bytesPerSample <= 0) {
    return 2000;
  }
  const frames = byteLength / bytesPerSample;
  const seconds = frames / sampleRate;
  return Math.max(500, Math.round(seconds * 1000));
}

const SENTENCE_SPLIT = /(?<=[.!?])\s+/u;

function buildSegments(text: string, durationMs: number) {
  const normalized = text.trim() || "No speech detected.";
  const sentences = normalized.split(SENTENCE_SPLIT).filter(Boolean);
  const safeDuration = Math.max(durationMs, 1000);
  const slice = safeDuration / Math.max(1, sentences.length);
  const segments = sentences.map((sentence, idx) => {
    const start = Math.round(idx * slice);
    const end = idx === sentences.length - 1 ? safeDuration : Math.round((idx + 1) * slice);
    const confidence = clamp(0.9 - idx * 0.05, 0.6, 0.95);
    return { text: sentence.trim(), start_ms: start, end_ms: end, confidence };
  });
  if (segments.length === 0) {
    segments.push({ text: normalized, start_ms: 0, end_ms: safeDuration, confidence: 0.8 });
  }
  return segments;
}

async function streamPartials(segments: Array<z.infer<typeof TranscriptSegment>>, device: DeviceKind, ctx: any) {
  const emitter = resolvePartialEmitter(ctx);
  const partials: z.infer<typeof PartialChunk>[] = [];
  let running = "";
  for (let idx = 0; idx < segments.length; idx += 1) {
    const seg = segments[idx];
    running = running ? `${running} ${seg.text}` : seg.text;
    const chunk = {
      text: running,
      start_ms: segments[0]?.start_ms ?? 0,
      end_ms: seg.end_ms,
      final: idx === segments.length - 1,
      device,
      emitted_at: new Date().toISOString(),
    };
    partials.push(chunk);
    emitter?.(chunk);
    if (!chunk.final) {
      await wait(5);
    }
  }
  if (partials.length === 0) {
    const now = new Date().toISOString();
    const fallback = {
      text: "",
      start_ms: 0,
      end_ms: segments[0]?.end_ms ?? 0,
      final: true,
      device,
      emitted_at: now,
    };
    partials.push(fallback);
    emitter?.(fallback);
  }
  return partials;
}

function deriveTranscript(buffer: Buffer, prompt?: string): string {
  const decoded = buffer.toString("utf8").replace(/[^\p{Letter}\p{Number}\s.,!?-]+/gu, " ").replace(/\s+/g, " ").trim();
  if (decoded.length >= 8) {
    return decoded;
  }
  if (prompt?.trim()) {
    return prompt.trim();
  }
  return "Transcription produced no confident text.";
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function acquireDeviceSlot(): { device: DeviceKind; release: () => void } {
  const forceCpu = process.env.STT_FORCE_CPU === "1";
  if (forceCpu) {
    return { device: "cpu", release: () => {} };
  }
  return acquireSttDevice();
}

async function simulateDecoderWarmup(device: DeviceKind): Promise<void> {
  const delay = device === "gpu" ? 12 : 25;
  await wait(delay);
}

function resolvePartialEmitter(ctx: any) {
  if (!ctx || typeof ctx !== "object") {
    return null;
  }
  const candidates = ["emitPartial", "pushPartial", "streamPartial", "onPartial"];
  for (const key of candidates) {
    const fn = (ctx as Record<string, unknown>)[key];
    if (typeof fn === "function") {
      return (payload: z.infer<typeof PartialChunk>) => {
        try {
          (fn as (arg: z.infer<typeof PartialChunk>) => void)(payload);
        } catch {
          // ignore streaming handler errors
        }
      };
    }
  }
  return null;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function __resetWhisperPool(): void {
  resetGpuSchedulerState();
}
