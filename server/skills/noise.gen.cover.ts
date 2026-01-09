import { randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { EssenceEnvelope } from "@shared/essence-schema";
import { putEnvelopeWithPolicy } from "./provenance";
import { essenceHub } from "../services/essence/events";
import { putBlob } from "../storage";
import { persistEssencePacket } from "../db/essence";
import {
  buildInformationBoundaryFromHashes,
  sha256Hex,
} from "../utils/information-boundary";
import { stableJsonStringify } from "../utils/stable-json";

const WAV_MIME = "audio/wav";
const DEFAULT_DURATION_MS = 2400;
const DEFAULT_SAMPLE_RATE = 44_100;
const DEFAULT_CHANNELS = 1;
const DEFAULT_TONE_HZ = 220;
const DEFAULT_NOISE_MIX = 0.4;
const MIN_DURATION_MS = 250;
const MAX_DURATION_MS = 15_000;
const MIN_SAMPLE_RATE = 8_000;
const MAX_SAMPLE_RATE = 48_000;

const CoverRequest = z.object({
  duration_ms: z
    .number()
    .int()
    .min(MIN_DURATION_MS)
    .max(MAX_DURATION_MS)
    .default(DEFAULT_DURATION_MS),
  sample_rate: z
    .number()
    .int()
    .min(MIN_SAMPLE_RATE)
    .max(MAX_SAMPLE_RATE)
    .default(DEFAULT_SAMPLE_RATE),
  channels: z.number().int().min(1).max(2).default(DEFAULT_CHANNELS),
  seed: z.number().int().nonnegative().optional(),
  tone_hz: z.number().min(40).max(12_000).default(DEFAULT_TONE_HZ),
  noise_mix: z.number().min(0).max(1).default(DEFAULT_NOISE_MIX),
});

const CoverResponse = z.object({
  essence_id: z.string(),
  essence_url: z.string(),
  preview_url: z.string(),
  duration_ms: z.number().int().nonnegative(),
  sample_rate: z.number().int().positive(),
  channels: z.number().int().positive(),
  seed: z.number(),
  tone_hz: z.number(),
  noise_mix: z.number(),
});

type CoverInput = z.infer<typeof CoverRequest>;

export const noiseGenCoverSpec: ToolSpecShape = {
  name: "noise.gen.cover",
  desc: "Generate a short noise bed WAV with Essence provenance",
  inputSchema: CoverRequest,
  outputSchema: CoverResponse,
  deterministic: false,
  rateLimit: { rpm: 30 },
  safety: { risks: ["writes_files"] },
};

export const noiseGenCoverHandler: ToolHandler = async (rawInput, ctx) => {
  const parsed = CoverRequest.parse(rawInput ?? {});
  const seed = parsed.seed ?? randomInt(0, 2 ** 32);
  const noiseMix = clamp01(parsed.noise_mix);
  const toneMix = clamp01(1 - noiseMix);
  const toneHz = parsed.tone_hz;
  const now = new Date().toISOString();
  const dataCutoffIso =
    typeof ctx?.dataCutoffIso === "string" && ctx.dataCutoffIso.trim()
      ? new Date(ctx.dataCutoffIso).toISOString()
      : now;
  const essenceId = randomUUID();
  const creatorId = (ctx?.personaId as string) || "noise.gen.cover";
  const payload = {
    duration_ms: parsed.duration_ms,
    sample_rate: parsed.sample_rate,
    channels: parsed.channels,
    seed,
    tone_hz: toneHz,
    noise_mix: noiseMix,
  };

  const wav = buildWav({
    sampleRate: parsed.sample_rate,
    channels: parsed.channels,
    durationMs: parsed.duration_ms,
    seed,
    toneHz,
    toneMix,
    noiseMix,
  });
  const blob = await putBlob(wav.buffer, { contentType: WAV_MIME });
  if (!blob.uri) {
    throw new Error("storage backend did not return a URI for generated asset");
  }
  const outputHash = sha256Hex(wav.buffer);
  const inputHash = sha256Hex(stableJsonStringify(payload));
  const informationBoundary = buildInformationBoundaryFromHashes({
    data_cutoff_iso: dataCutoffIso,
    mode: "observables",
    labels_used_as_features: false,
    event_features_included: false,
    inputs_hash: `sha256:${inputHash}`,
    features_hash: `sha256:${outputHash}`,
  });

  const envelope = EssenceEnvelope.parse({
    header: {
      id: essenceId,
      version: "essence/1.0",
      modality: "audio",
      created_at: now,
      source: {
        uri: blob.uri,
        original_hash: { algo: "sha256", value: outputHash },
        duration_ms: wav.durationMs,
        sample_rate: parsed.sample_rate,
        channels: parsed.channels,
        mime: WAV_MIME,
        creator_id: creatorId,
        license: "CC-BY-NC-4.0",
        cid: blob.cid,
      },
      rights: {
        allow_mix: true,
        allow_remix: true,
        allow_commercial: false,
        attribution: true,
      },
      acl: { visibility: "private", groups: [] },
    },
    features: {
      audio: {
        sample_rate: parsed.sample_rate,
        duration_ms: wav.durationMs,
        fingerprint: outputHash,
      },
    },
    embeddings: [],
    provenance: {
      pipeline: [
        {
          name: "noisegen.cover",
          impl_version: "1.0.0",
          lib_hash: {
            algo: "sha256",
            value: sha256Hex(Buffer.from("noisegen.cover@1")),
          },
          params: payload,
          seed: String(seed),
          input_hash: { algo: "sha256", value: inputHash },
          output_hash: { algo: "sha256", value: outputHash },
          started_at: now,
          ended_at: now,
        },
      ],
      merkle_root: { algo: "sha256", value: outputHash },
      previous: null,
      signatures: [],
      information_boundary: informationBoundary,
    },
  });

  await putEnvelopeWithPolicy(envelope);
  await persistEssencePacket({
    id: `${essenceId}:audio`,
    envelope_id: essenceId,
    uri: blob.uri,
    cid: blob.cid,
    content_type: blob.contentType,
    bytes: blob.bytes,
  });
  essenceHub.emit("created", { type: "created", essenceId });

  return CoverResponse.parse({
    essence_id: essenceId,
    essence_url: `/api/essence/${essenceId}`,
    preview_url: makeDataUrl(wav.buffer, WAV_MIME),
    duration_ms: wav.durationMs,
    sample_rate: parsed.sample_rate,
    channels: parsed.channels,
    seed,
    tone_hz: toneHz,
    noise_mix: noiseMix,
  });
};

type WavBuild = {
  buffer: Buffer;
  durationMs: number;
};

type WavBuildOptions = {
  sampleRate: number;
  channels: number;
  durationMs: number;
  seed: number;
  toneHz: number;
  toneMix: number;
  noiseMix: number;
};

function buildWav(options: WavBuildOptions): WavBuild {
  const frameCount = Math.max(
    1,
    Math.round((options.sampleRate * options.durationMs) / 1000),
  );
  const blockAlign = options.channels * 2;
  const dataSize = frameCount * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);
  const byteRate = options.sampleRate * blockAlign;

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(options.channels, 22);
  buffer.writeUInt32LE(options.sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  const rng = mulberry32(options.seed);
  const amplitude = 0.85;
  const twoPi = Math.PI * 2;
  let offset = 44;
  for (let i = 0; i < frameCount; i += 1) {
    const t = i / options.sampleRate;
    const tone = Math.sin(twoPi * options.toneHz * t);
    const noise = rng() * 2 - 1;
    const sample =
      amplitude * (options.toneMix * tone + options.noiseMix * noise);
    const clamped = Math.max(-1, Math.min(1, sample));
    const intSample = Math.round(clamped * 32767);
    for (let ch = 0; ch < options.channels; ch += 1) {
      buffer.writeInt16LE(intSample, offset);
      offset += 2;
    }
  }

  return {
    buffer,
    durationMs: Math.round((frameCount / options.sampleRate) * 1000),
  };
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function makeDataUrl(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
