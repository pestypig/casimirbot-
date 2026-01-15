import express, { Router } from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { promises as fs, createReadStream } from "node:fs";
import { z } from "zod";
import multer from "multer";
import { listKnowledgeFilesByProjects } from "../db/knowledge";
import { runNoiseFieldLoop } from "../../modules/analysis/noise-field-loop.js";
import {
  findOriginalById,
  getNoisegenPaths,
  getNoisegenStore,
  downloadReplitObjectStream,
  isReplitStoragePath,
  resolveBundledOriginalsRoots,
  resolveOriginalAsset,
  resolveOriginalAssetPath,
  resolveReplitStorageKey,
  resolveStemAsset,
  resolveStemAssetPath,
  saveOriginalAsset,
  saveStemAsset,
  savePreviewBuffer,
  updateNoisegenStore,
} from "../services/noisegen-store";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const DEFAULT_NOISE_FIELD = {
  width: 32,
  height: 32,
  seed: 1,
  maxIterations: 6,
  stepSize: 0.15,
  thresholds: {
    laplacianRmsMax: 0.12,
    laplacianMaxAbsMax: 0.6,
  },
};
const MAX_NOISE_FIELD_SIDE = 256;
const MAX_NOISE_FIELD_STEPS = 25;
const PREVIEW_SAMPLE_RATE = 44_100;
const PREVIEW_CHANNELS = 1;
const PREVIEW_MIN_SECONDS = 6;
const PREVIEW_MAX_SECONDS = 30;

const peakSchema = z.object({
  omega: z.number(),
  gamma: z.number(),
  alpha: z.number(),
});

const helixPacketSchema = z
  .object({
    seed: z.string(),
    rc: z.number(),
    tau: z.number().optional(),
    lambda: z.number().optional(),
    K: z.number(),
    weirdness: z.number().optional(),
    branch: z.number().optional(),
    peaks: z.array(peakSchema),
  })
  .passthrough();

const barWindowSchema = z
  .object({
    startBar: z.number().int().min(1),
    endBar: z.number().int().min(1),
  })
  .refine(({ startBar, endBar }) => endBar > startBar, {
    message: "endBar must be greater than startBar",
  });

const tempoMetaSchema = z
  .object({
    bpm: z.number().min(40).max(250),
    timeSig: z.string().regex(/^\d+\/\d+$/),
    offsetMs: z.number().min(-2000).max(2000),
    barsInLoop: z.number().int().min(1).max(256).optional(),
    quantized: z.boolean().optional(),
  })
  .strict();

const timeSkySchema = z
  .object({
    publishedAt: z.number().int().min(0).optional(),
    composedStart: z.number().int().min(0).optional(),
    composedEnd: z.number().int().min(0).optional(),
    place: z.string().min(1).optional(),
    skySignature: z.string().min(1).optional(),
  })
  .strict()
  .refine(
    ({ composedStart, composedEnd }) =>
      composedStart == null ||
      composedEnd == null ||
      composedEnd >= composedStart,
    {
      message: "composedEnd must be >= composedStart",
    },
  );

const renderPlanSectionSchema = z
  .object({
    name: z.string().min(1),
    startBar: z.number().int().min(1),
    bars: z.number().int().min(1),
  })
  .passthrough();

const renderPlanEnergySchema = z
  .object({
    bar: z.number().int().min(1),
    energy: z.number().finite(),
  })
  .passthrough();

const renderPlanMaterialSchema = z
  .object({
    audioAtomIds: z.array(z.string().min(1)).optional(),
    midiMotifIds: z.array(z.string().min(1)).optional(),
    grooveTemplateIds: z.array(z.string().min(1)).optional(),
    macroCurveIds: z.array(z.string().min(1)).optional(),
    transposeSemitones: z.number().finite().optional(),
    timeStretch: z.number().finite().optional(),
  })
  .passthrough();

const renderPlanTextureBlendSchema = z
  .object({
    weights: z.record(z.number().finite()),
  })
  .passthrough();

const renderPlanTextureSchema = z
  .object({
    kbTexture: z.union([z.string().min(1), renderPlanTextureBlendSchema]).optional(),
    sampleInfluence: z.number().min(0).max(1).optional(),
    styleInfluence: z.number().min(0).max(1).optional(),
    weirdness: z.number().min(0).max(1).optional(),
    eqPeaks: z
      .array(
        z
          .object({
            freq: z.number().finite(),
            q: z.number().finite(),
            gainDb: z.number().finite(),
          })
          .passthrough(),
      )
      .optional(),
    fx: z
      .object({
        chorus: z.number().finite().optional(),
        sat: z.number().finite().optional(),
        reverbSend: z.number().finite().optional(),
        comp: z.number().finite().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const renderPlanWindowSchema = z
  .object({
    startBar: z.number().int().min(1),
    bars: z.number().int().min(1),
    material: renderPlanMaterialSchema.optional(),
    texture: renderPlanTextureSchema.optional(),
  })
  .passthrough();

const renderPlanSchema = z
  .object({
    global: z
      .object({
        bpm: z.number().min(1).optional(),
        key: z.string().optional(),
        sections: z.array(renderPlanSectionSchema).optional(),
        energyCurve: z.array(renderPlanEnergySchema).optional(),
      })
      .passthrough()
      .optional(),
    windows: z.array(renderPlanWindowSchema),
  })
  .passthrough();

const coverJobRequestSchema = z
  .object({
    originalId: z.string().min(1),
    barWindows: z.array(barWindowSchema).min(1),
    linkHelix: z.boolean(),
    helix: helixPacketSchema.optional(),
    kbTexture: z.string().min(1).nullable().optional(),
    kbConfidence: z.number().min(0).max(1).optional(),
    sampleInfluence: z.number().min(0).max(1).optional(),
    styleInfluence: z.number().min(0).max(1).optional(),
    weirdness: z.number().min(0).max(1).optional(),
    tempo: tempoMetaSchema.optional(),
    knowledgeFileIds: z.array(z.string().min(1)).optional(), // audio from knowledge store
    renderPlan: renderPlanSchema.optional(),
    forceRemote: z.boolean().optional(),
  })
  .refine((value) => !value.linkHelix || Boolean(value.helix), {
    message: "helix packet required when linkHelix is true",
  });

const recipeSchema = z
  .object({
    name: z.string().min(1),
    coverRequest: coverJobRequestSchema,
    seed: z.union([z.string().min(1), z.number().finite()]).optional(),
    notes: z.string().optional(),
  })
  .strict();

const legacyGenerateSchema = z
  .object({
    originalId: z.string().min(1),
    moodId: z.string().min(1),
    seed: z.number().int().optional(),
    helixPacket: helixPacketSchema.optional(),
  })
  .strict();

const immersionScoresSchema = z
  .object({
    idi: z.number().min(0).max(1).optional(),
    confidence: z.number().min(0).max(1).optional(),
    timing: z.number().min(0).max(1),
    am: z.number().min(0).max(1),
    harm: z.number().min(0).max(1),
    cross: z.number().min(0).max(1),
    texture: z.number().min(0).max(1),
    spaceDyn: z.number().min(0).max(1),
    resolve4_low: z.number().min(0).max(1),
    resolve4_high: z.number().min(0).max(1),
    resolve8_low: z.number().min(0).max(1),
    resolve8_high: z.number().min(0).max(1),
    bassline_diversity: z.number().min(0).max(1),
    melody_division_rate: z.number().min(0).max(1),
    dyadness: z.number().min(0).max(1),
    chordness: z.number().min(0).max(1),
  })
  .strict();

const evidenceSchema = z
  .object({
    idi: z.number().min(0).max(1),
    idiConfidence: z.number().min(0).max(1),
    immersion: immersionScoresSchema,
  })
  .strict();

const noiseFieldThresholdSchema = z
  .object({
    laplacianRmsMax: z.number().positive(),
    laplacianMaxAbsMax: z.number().positive(),
  })
  .partial()
  .strict();

const noiseFieldClampSchema = z
  .object({
    min: z.number(),
    max: z.number(),
  })
  .refine((value) => value.max >= value.min, {
    message: "clamp max must be >= min",
  });

const noiseFieldRequestSchema = z
  .object({
    width: z.number().int().min(2).max(MAX_NOISE_FIELD_SIDE).optional(),
    height: z.number().int().min(2).max(MAX_NOISE_FIELD_SIDE).optional(),
    seed: z.number().int().min(0).max(2_147_483_647).optional(),
    maxIterations: z.number().int().min(1).max(MAX_NOISE_FIELD_STEPS).optional(),
    stepSize: z.number().min(0.001).max(1).optional(),
    thresholds: noiseFieldThresholdSchema.optional(),
    clamp: noiseFieldClampSchema.optional(),
    includeValues: z.boolean().optional(),
  })
  .strict();

type JobStatus = "queued" | "processing" | "ready" | "error";

type CoverJob = {
  id: string;
  type: "cover";
  status: JobStatus;
  request: z.infer<typeof coverJobRequestSchema>;
  createdAt: number;
  updatedAt: number;
  previewUrl?: string;
  error?: string;
  evidence?: z.infer<typeof evidenceSchema>;
};

type LegacyJob = {
  id: string;
  type: "legacy";
  status: JobStatus;
  request: z.infer<typeof legacyGenerateSchema>;
  createdAt: number;
  updatedAt: number;
  previewUrl?: string;
  error?: string;
  detail?: string;
};

type NoisegenJob = CoverJob | LegacyJob;

const parseProjectIds = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const readStringField = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.length ? String(value[0]).trim() : "";
  }
  if (typeof value === "string") return value.trim();
  return "";
};

const normalizeSearch = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const matchesSearch = (needle: string, fields: Array<string | undefined>) => {
  if (!needle) return true;
  return fields.some((field) =>
    field ? field.toLowerCase().includes(needle) : false,
  );
};

const isAudioMime = (mime: string | null | undefined): boolean => {
  if (!mime) return false;
  const lower = mime.toLowerCase();
  if (!lower.startsWith("audio/")) return false;
  return (
    lower.includes("wav") ||
    lower.includes("wave") ||
    lower.includes("mpeg") ||
    lower.includes("mp3") ||
    lower.includes("flac") ||
    lower.includes("ogg")
  );
};

const clampNumber = (
  value: number,
  min: number,
  max: number,
  fallback: number,
) => {
  if (!Number.isFinite(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const inferBpmFromName = (name?: string): number | null => {
  if (!name) return null;
  const base = name.replace(/\.[^/.]+$/, "");
  const matches = Array.from(
    base.matchAll(/(\d{2,3}(?:\.\d{1,2})?)\s*(?:bpm|bp|tempo)?/gi),
  );
  if (!matches.length) return null;
  const last = matches[matches.length - 1];
  const numeric = Number(last?.[1]);
  if (!Number.isFinite(numeric)) return null;
  return clampNumber(numeric, 40, 250, 120);
};

const normalizeStemName = (name?: string): string => {
  if (!name) return "stem";
  const base = name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base || "stem";
};

const slugifyStem = (value: string): string => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "stem";
};

const buildStemId = (name: string, used: Set<string>): string => {
  const base = slugifyStem(name);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let index = 2;
  while (used.has(`${base}-${index}`)) {
    index += 1;
  }
  const next = `${base}-${index}`;
  used.add(next);
  return next;
};

const STEM_CATEGORY_ALLOWLIST = new Set([
  "drums",
  "bass",
  "music",
  "fx",
  "other",
]);

const normalizeStemCategory = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return STEM_CATEGORY_ALLOWLIST.has(normalized) ? normalized : undefined;
};

const summarizeNoiseValues = (values: Float32Array) => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value < min) min = value;
    if (value > max) max = value;
    sum += value;
  }
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 0;
  const mean = values.length ? sum / values.length : 0;
  return { min, max, mean };
};

const fallbackDurationSeconds = (bytes: number): number => {
  if (!Number.isFinite(bytes) || bytes <= 0) return 180;
  return Math.max(45, Math.min(600, Math.round(bytes / 16_000)));
};

const parseWavDurationSeconds = (buffer: Buffer): number | null => {
  if (buffer.byteLength < 44) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WAVE") return null;
  let offset = 12;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataSize = 0;
  while (offset + 8 <= buffer.byteLength) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkData = offset + 8;
    if (chunkId === "fmt " && chunkSize >= 16) {
      channels = buffer.readUInt16LE(chunkData + 2);
      sampleRate = buffer.readUInt32LE(chunkData + 4);
      bitsPerSample = buffer.readUInt16LE(chunkData + 14);
    } else if (chunkId === "data") {
      dataSize = chunkSize;
      break;
    }
    offset = chunkData + chunkSize + (chunkSize % 2);
  }
  if (!sampleRate || !channels || !bitsPerSample || !dataSize) return null;
  const bytesPerSample = bitsPerSample / 8;
  if (!bytesPerSample) return null;
  const frameSize = bytesPerSample * channels;
  return dataSize / (sampleRate * frameSize);
};

type WavFormat = {
  audioFormat: number;
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  dataOffset: number;
  dataSize: number;
};

const WAVE_FORMAT_EXTENSIBLE = 0xfffe;
const WAVE_FORMAT_PCM = 1;
const WAVE_FORMAT_IEEE_FLOAT = 3;

const parseWavFormat = (buffer: Buffer): WavFormat | null => {
  if (buffer.byteLength < 44) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WAVE") return null;
  let offset = 12;
  let audioFormat = 0;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataOffset = 0;
  let dataSize = 0;
  while (offset + 8 <= buffer.byteLength) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkData = offset + 8;
    if (chunkId === "fmt " && chunkSize >= 16) {
      audioFormat = buffer.readUInt16LE(chunkData);
      channels = buffer.readUInt16LE(chunkData + 2);
      sampleRate = buffer.readUInt32LE(chunkData + 4);
      bitsPerSample = buffer.readUInt16LE(chunkData + 14);
      if (audioFormat === WAVE_FORMAT_EXTENSIBLE && chunkSize >= 40) {
        // SubFormat GUID starts at byte 24; first 4 bytes map to PCM/float.
        const subFormat = buffer.readUInt32LE(chunkData + 24);
        if (subFormat === WAVE_FORMAT_PCM || subFormat === WAVE_FORMAT_IEEE_FLOAT) {
          audioFormat = subFormat;
        }
      }
    } else if (chunkId === "data") {
      dataOffset = chunkData;
      dataSize = chunkSize;
      break;
    }
    const nextOffset = chunkData + chunkSize + (chunkSize % 2);
    offset = nextOffset;
  }
  if (
    !audioFormat ||
    !channels ||
    !sampleRate ||
    !bitsPerSample ||
    !dataOffset ||
    !dataSize
  ) {
    return null;
  }
  return {
    audioFormat,
    channels,
    sampleRate,
    bitsPerSample,
    dataOffset,
    dataSize,
  };
};

const convertWavToPcm16 = (buffer: Buffer): Buffer | null => {
  const format = parseWavFormat(buffer);
  if (!format) return null;
  if (format.audioFormat === 1 && format.bitsPerSample === 16) return null;
  if (format.audioFormat !== WAVE_FORMAT_PCM && format.audioFormat !== WAVE_FORMAT_IEEE_FLOAT) {
    return null;
  }
  const bytesPerSample = format.bitsPerSample / 8;
  if (!Number.isInteger(bytesPerSample) || bytesPerSample <= 0) return null;
  if (![2, 3, 4].includes(bytesPerSample)) return null;
  if (format.audioFormat === 3 && format.bitsPerSample !== 32) return null;
  if (format.audioFormat === 1 && ![16, 24, 32].includes(format.bitsPerSample)) {
    return null;
  }

  const totalSamples = Math.floor(format.dataSize / bytesPerSample);
  if (totalSamples <= 0) return null;
  const outputDataSize = totalSamples * 2;
  const output = Buffer.alloc(44 + outputDataSize);
  const blockAlign = format.channels * 2;
  const byteRate = format.sampleRate * blockAlign;

  output.write("RIFF", 0);
  output.writeUInt32LE(36 + outputDataSize, 4);
  output.write("WAVE", 8);
  output.write("fmt ", 12);
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(format.channels, 22);
  output.writeUInt32LE(format.sampleRate, 24);
  output.writeUInt32LE(byteRate, 28);
  output.writeUInt16LE(blockAlign, 32);
  output.writeUInt16LE(16, 34);
  output.write("data", 36);
  output.writeUInt32LE(outputDataSize, 40);

  let readOffset = format.dataOffset;
  let writeOffset = 44;
  for (let i = 0; i < totalSamples; i += 1) {
    let sample = 0;
    if (format.audioFormat === 3) {
      sample = buffer.readFloatLE(readOffset);
    } else if (format.bitsPerSample === 24) {
      sample = buffer.readIntLE(readOffset, 3) / 8388608;
    } else if (format.bitsPerSample === 32) {
      sample = buffer.readInt32LE(readOffset) / 2147483648;
    } else {
      sample = buffer.readInt16LE(readOffset) / 32768;
    }
    const clamped = Math.max(-1, Math.min(1, sample));
    const int16 = Math.round(clamped * 32767);
    output.writeInt16LE(int16, writeOffset);
    readOffset += bytesPerSample;
    writeOffset += 2;
  }

  return output;
};

const normalizeWavUpload = (
  file: Express.Multer.File,
): { buffer: Buffer; mime: string } | null => {
  const mime = file.mimetype?.toLowerCase() ?? "";
  if (!mime.includes("wav") && !mime.includes("wave")) return null;
  const converted = convertWavToPcm16(file.buffer);
  if (!converted) return null;
  return { buffer: converted, mime: "audio/wav" };
};

const resolveUploadAudio = (
  file: Express.Multer.File,
): { buffer: Buffer; mime: string } => {
  const normalized = normalizeWavUpload(file);
  if (normalized) return normalized;
  return { buffer: file.buffer, mime: file.mimetype };
};

const normalizeWavFile = async (
  filePath: string,
  mime?: string,
): Promise<boolean> => {
  const lower = mime?.toLowerCase() ?? "";
  if (!lower.includes("wav") && !lower.includes("wave")) return false;
  const buffer = await fs.readFile(filePath);
  const converted = convertWavToPcm16(buffer);
  if (!converted) return false;
  await fs.writeFile(filePath, converted);
  return true;
};

const estimateDurationSeconds = (buffer: Buffer, mime?: string): number => {
  const lower = mime?.toLowerCase() ?? "";
  if (lower.includes("wav") || lower.includes("wave")) {
    const parsed = parseWavDurationSeconds(buffer);
    if (parsed) return parsed;
  }
  return fallbackDurationSeconds(buffer.byteLength);
};

const { previewsDir } = getNoisegenPaths();
const kbTexturesDir = path.join(process.cwd(), "client", "public", "kb-textures");
const staticOriginalsDirs = resolveBundledOriginalsRoots();

router.use("/kb-textures", express.static(kbTexturesDir));
router.use("/noisegen/previews", express.static(previewsDir));
staticOriginalsDirs.forEach((dir) => {
  router.use("/originals", express.static(dir));
});

const streamAudioFile = async (
  req: express.Request,
  res: express.Response,
  filePath: string,
  mime: string,
) => {
  const stats = await fs.stat(filePath);
  const size = stats.size;
  res.setHeader("Content-Type", mime);
  res.setHeader("Accept-Ranges", "bytes");

  if (req.method === "HEAD") {
    res.setHeader("Content-Length", size);
    res.status(200).end();
    return;
  }

  const range = req.headers.range;
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (!match) {
      res.setHeader("Content-Range", `bytes */${size}`);
      res.status(416).end();
      return;
    }
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : size - 1;
    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start > end ||
      start >= size
    ) {
      res.setHeader("Content-Range", `bytes */${size}`);
      res.status(416).end();
      return;
    }
    const clampedEnd = Math.min(end, size - 1);
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${clampedEnd}/${size}`);
    res.setHeader("Content-Length", clampedEnd - start + 1);
    createReadStream(filePath, { start, end: clampedEnd }).pipe(res);
    return;
  }

  res.setHeader("Content-Length", size);
  createReadStream(filePath).pipe(res);
};

const streamReplitAsset = async (
  req: express.Request,
  res: express.Response,
  asset: { path: string; mime: string; bytes?: number },
) => {
  res.setHeader("Content-Type", asset.mime);
  if (asset.bytes) {
    res.setHeader("Content-Length", asset.bytes);
  }
  if (req.method === "HEAD") {
    res.status(200).end();
    return;
  }
  const key = resolveReplitStorageKey(asset.path);
  const stream = await downloadReplitObjectStream(key);
  stream.pipe(res);
};

const serveOriginalAsset = async (req: any, res: any) => {
  try {
    const store = await getNoisegenStore();
    const original = findOriginalById(store, req.params.id);
    if (!original) {
      return res.status(404).json({ error: "not_found" });
    }
    const asset = resolveOriginalAsset(original, req.params.asset);
    if (!asset) {
      return res.status(404).json({ error: "asset_not_found" });
    }
    if (isReplitStoragePath(asset.path)) {
      await streamReplitAsset(req, res, asset);
      return;
    }

    const assetPath = resolveOriginalAssetPath(asset);
    try {
      await fs.access(assetPath);
    } catch {
      return res.status(404).json({ error: "asset_missing" });
    }
    try {
      const shouldNormalize =
        req.method !== "HEAD" && !path.isAbsolute(asset.path);
      if (shouldNormalize) {
        await normalizeWavFile(assetPath, asset.mime);
      }
    } catch {
      // fall through to streaming the original asset
    }
    return await streamAudioFile(req, res, assetPath, asset.mime);
  } catch (error) {
    return res.status(500).json({
      error: "asset_fetch_failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

const serveStemAsset = async (req: any, res: any) => {
  try {
    const store = await getNoisegenStore();
    const original = findOriginalById(store, req.params.id);
    if (!original) {
      return res.status(404).json({ error: "not_found" });
    }
    const stem = resolveStemAsset(original, req.params.stemId ?? "");
    if (!stem) {
      return res.status(404).json({ error: "stem_not_found" });
    }
    if (isReplitStoragePath(stem.path)) {
      await streamReplitAsset(req, res, stem);
      return;
    }

    const stemPath = resolveStemAssetPath(stem);
    try {
      await fs.access(stemPath);
    } catch {
      return res.status(404).json({ error: "stem_missing" });
    }
    try {
      const shouldNormalize =
        req.method !== "HEAD" && !path.isAbsolute(stem.path);
      if (shouldNormalize) {
        await normalizeWavFile(stemPath, stem.mime);
      }
    } catch {
      // fall through to streaming the original stem
    }
    return await streamAudioFile(req, res, stemPath, stem.mime);
  } catch (error) {
    return res.status(500).json({
      error: "stem_fetch_failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

router.get("/originals/:id/:asset", serveOriginalAsset);
router.head("/originals/:id/:asset", serveOriginalAsset);
router.get("/audio/originals/:id/:asset", serveOriginalAsset);
router.head("/audio/originals/:id/:asset", serveOriginalAsset);
router.get("/originals/:id/stems/:stemId", serveStemAsset);
router.head("/originals/:id/stems/:stemId", serveStemAsset);
router.get("/audio/originals/:id/stems/:stemId", serveStemAsset);
router.head("/audio/originals/:id/stems/:stemId", serveStemAsset);

router.get("/api/noise-gens/originals", async (req, res) => {
  const search = normalizeSearch(req.query?.search);
  const store = await getNoisegenStore();
  const sorted = [...store.originals].sort(
    (a, b) => (b.listens ?? 0) - (a.listens ?? 0),
  );
  const filtered = sorted.filter((original) =>
    matchesSearch(search, [original.title, original.artist]),
  );
  return res.json(
    filtered.map((original) => ({
      id: original.id,
      title: original.title,
      artist: original.artist,
      listens: original.listens ?? 0,
      duration: original.duration ?? 0,
      tempo: original.tempo ?? undefined,
      stemCount: original.assets.stems?.length ?? 0,
    })),
  );
});

router.get("/api/noise-gens/originals/pending", async (req, res) => {
  const search = normalizeSearch(req.query?.search);
  const store = await getNoisegenStore();
  const sorted = [...store.pendingOriginals].sort(
    (a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0),
  );
  const filtered = sorted.filter((original) =>
    matchesSearch(search, [original.title, original.artist]),
  );
  return res.json(
    filtered.map((original) => ({
      id: original.id,
      title: original.title,
      artist: original.artist,
      listens: original.listens ?? 0,
      duration: original.duration ?? 0,
      tempo: original.tempo ?? undefined,
      stemCount: original.assets.stems?.length ?? 0,
      uploadedAt: original.uploadedAt,
      status: "pending",
    })),
  );
});

router.get("/api/noise-gens/originals/:id", async (req, res) => {
  const store = await getNoisegenStore();
  const original = findOriginalById(store, req.params.id ?? "");
  if (!original) {
    return res.status(404).json({ error: "not_found" });
  }
  const isPending = store.pendingOriginals.some(
    (entry) => entry.id.toLowerCase() === original.id.toLowerCase(),
  );
  return res.json({
    id: original.id,
    title: original.title,
    artist: original.artist,
    listens: original.listens ?? 0,
    duration: original.duration ?? 0,
    tempo: original.tempo ?? undefined,
      stemCount: original.assets.stems?.length ?? 0,
      uploadedAt: original.uploadedAt,
      status: isPending ? "pending" : "ranked",
      lyrics: original.notes ?? undefined,
      timeSky: original.timeSky ?? undefined,
    });
  });

router.get("/api/noise-gens/originals/:id/stems", async (req, res) => {
  const store = await getNoisegenStore();
  const original = findOriginalById(store, req.params.id ?? "");
  if (!original) {
    return res.status(404).json({ error: "not_found" });
  }
  const stems = original.assets.stems ?? [];
  return res.json({
    stems: stems.map((stem) => ({
      id: stem.id,
      name: stem.name,
      category: stem.category ?? undefined,
      mime: stem.mime,
      size: stem.bytes,
      uploadedAt: stem.uploadedAt,
      url: `/originals/${encodeURIComponent(original.id)}/stems/${encodeURIComponent(stem.id)}`,
    })),
  });
});

router.get("/api/noise-gens/generations", async (req, res) => {
  const search = normalizeSearch(req.query?.search);
  const store = await getNoisegenStore();
  const sorted = [...store.generations].sort(
    (a, b) => (b.listens ?? 0) - (a.listens ?? 0),
  );
  const filtered = sorted.filter((generation) =>
    matchesSearch(search, [generation.title, generation.mood]),
  );
  return res.json(
    filtered.map((generation) => ({
      id: generation.id,
      originalId: generation.originalId,
      title: generation.title,
      mood: generation.mood,
      listens: generation.listens ?? 0,
    })),
  );
});

router.get("/api/noise-gens/moods", async (_req, res) => {
  const store = await getNoisegenStore();
  return res.json(store.moods ?? []);
});

router.get("/api/noise-gens/recipes", async (req, res) => {
  const search = normalizeSearch(req.query?.search);
  const store = await getNoisegenStore();
  const recipes = store.recipes ?? [];
  const filtered = search
    ? recipes.filter((recipe) =>
        matchesSearch(search, [recipe.name, recipe.originalId, recipe.notes]),
      )
    : recipes;
  return res.json(filtered);
});

router.get("/api/noise-gens/recipes/:id", async (req, res) => {
  const id = String(req.params.id ?? "").trim();
  if (!id) return res.status(400).json({ error: "recipe_id_required" });
  const store = await getNoisegenStore();
  const recipe = store.recipes?.find((entry) => entry.id === id);
  if (!recipe) {
    return res.status(404).json({ error: "recipe_not_found" });
  }
  return res.json(recipe);
});

router.post("/api/noise-gens/recipes", async (req, res) => {
  const parsed = recipeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "invalid_request", issues: parsed.error.issues });
  }
  const now = Date.now();
  const recipe = {
    id: randomUUID(),
    name: parsed.data.name.trim(),
    originalId: parsed.data.coverRequest.originalId,
    createdAt: now,
    updatedAt: now,
    seed: parsed.data.seed,
    coverRequest: parsed.data.coverRequest,
    notes: parsed.data.notes?.trim() || undefined,
  };
  await updateNoisegenStore((next) => {
    next.recipes.push(recipe);
    return next;
  });
  return res.json(recipe);
});

router.delete("/api/noise-gens/recipes/:id", async (req, res) => {
  const id = String(req.params.id ?? "").trim();
  if (!id) return res.status(400).json({ error: "recipe_id_required" });
  let removed = false;
  await updateNoisegenStore((next) => {
    const nextRecipes = (next.recipes ?? []).filter((entry) => entry.id !== id);
    removed = nextRecipes.length !== (next.recipes ?? []).length;
    next.recipes = nextRecipes;
    return next;
  });
  if (!removed) {
    return res.status(404).json({ error: "recipe_not_found" });
  }
  return res.json({ ok: true });
});

router.post("/api/noise-gens/generate", async (req, res) => {
  const parsed = legacyGenerateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "invalid_request", issues: parsed.error.issues });
  }
  const store = await getNoisegenStore();
  const original = findOriginalById(store, parsed.data.originalId);
  if (!original) {
    return res.status(404).json({ error: "original_not_found" });
  }

  const id = randomUUID();
  const now = Date.now();
  const job: LegacyJob = {
    id,
    type: "legacy",
    status: "processing",
    request: parsed.data,
    createdAt: now,
    updatedAt: now,
    detail: "processing",
  };

  await updateNoisegenStore((next) => {
    next.jobs.push(job);
    return next;
  });

  void processLegacyJob(id).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    void updateNoisegenStore((next) => {
      const found = next.jobs.find((entry) => entry.id === id);
      if (!found) return next;
      found.status = "error";
      found.updatedAt = Date.now();
      found.error = message;
      found.detail = message;
      return next;
    });
  });

  return res.json({ jobId: id });
});

router.post(
  "/api/noise-gens/previews",
  upload.single("preview"),
  async (req, res) => {
    const jobId = readStringField(req.body?.jobId);
    if (!jobId) {
      return res.status(400).json({ error: "job_id_required" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "preview_required" });
    }
    const store = await getNoisegenStore();
    const job = store.jobs.find((entry) => entry.id === jobId);
    if (!job) {
      return res.status(404).json({ error: "job_not_found" });
    }
    const preview = await savePreviewBuffer({
      jobId,
      buffer: Buffer.from(req.file.buffer),
      mime: req.file.mimetype,
    });
    return res.json({ previewUrl: preview.url });
  },
);

router.get("/api/noise-gens/library", async (req, res) => {
  const projectIds = parseProjectIds(req.query?.projectId);
  if (!projectIds.length) {
    return res.status(400).json({ error: "project_ids_required" });
  }
  try {
    const rows = await listKnowledgeFilesByProjects(projectIds);
    const audio = rows
      .filter((row) => isAudioMime(row.mime))
      .map((row) => ({
        projectId: row.project_id,
        projectName: row.project_name,
        fileId: row.file_id,
        name: row.name,
        mime: row.mime,
        size: row.size,
        hashSlug: row.hash_slug ?? undefined,
        updatedAt: row.updated_at,
      }));
    return res.json({ files: audio });
  } catch (error) {
    return res.status(500).json({ error: "library_fetch_failed", message: String(error) });
  }
});

router.post(
  "/api/noise-gens/upload",
  upload.fields([
    { name: "instrumental", maxCount: 1 },
    { name: "vocal", maxCount: 1 },
    { name: "stems", maxCount: 32 },
  ]),
  async (req, res) => {
    const title = readStringField(req.body?.title);
    const creator = readStringField(req.body?.creator);
    const notes = readStringField(req.body?.notes);
    const existingOriginalId = readStringField(req.body?.existingOriginalId);
    const offsetMsRaw = readStringField(req.body?.offsetMs);
    const offsetMs = clampNumber(Number(offsetMsRaw), -2000, 2000, 0);

    if (!title) {
      return res.status(400).json({ error: "title_required" });
    }
    if (!creator) {
      return res.status(400).json({ error: "creator_required" });
    }

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const instrumental = files?.instrumental?.[0];
    const vocal = files?.vocal?.[0];
    const stems = files?.stems ?? [];
    if (!instrumental && stems.length === 0) {
      return res.status(400).json({ error: "instrumental_or_stems_required" });
    }

    const stemCategoriesRaw = readStringField(req.body?.stemCategories);
    let stemCategories: string[] = [];
    if (stemCategoriesRaw) {
      try {
        const parsed = JSON.parse(stemCategoriesRaw);
        if (Array.isArray(parsed)) {
          stemCategories = parsed.map((entry) => String(entry));
        }
      } catch {
        return res.status(400).json({ error: "invalid_stem_categories" });
      }
    }

    const tempoField = readStringField(req.body?.tempo);
    let tempo: z.infer<typeof tempoMetaSchema> | undefined;
    if (tempoField) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(tempoField);
      } catch {
        return res.status(400).json({ error: "invalid_tempo_json" });
      }
      const tempoValidation = tempoMetaSchema.safeParse(parsed);
      if (!tempoValidation.success) {
        return res
          .status(400)
          .json({ error: "invalid_tempo", issues: tempoValidation.error.issues });
      }
      tempo = tempoValidation.data;
    } else {
      const bpmSourceName =
        instrumental?.originalname ?? stems[0]?.originalname ?? vocal?.originalname;
      const inferredBpm = inferBpmFromName(bpmSourceName);
      if (inferredBpm) {
        tempo = {
          bpm: inferredBpm,
          timeSig: "4/4",
          offsetMs,
          barsInLoop: 8,
          quantized: true,
        };
      }
    }

    const timeSkyField = readStringField(req.body?.timeSky);
    let timeSky: z.infer<typeof timeSkySchema> | undefined;
    if (timeSkyField) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(timeSkyField);
      } catch {
        return res.status(400).json({ error: "invalid_time_sky_json" });
      }
      const timeSkyValidation = timeSkySchema.safeParse(parsed);
      if (!timeSkyValidation.success) {
        return res.status(400).json({
          error: "invalid_time_sky",
          issues: timeSkyValidation.error.issues,
        });
      }
      timeSky = timeSkyValidation.data;
    }

    const durationSource = instrumental ?? stems[0] ?? vocal;
    const durationSeconds = durationSource
      ? estimateDurationSeconds(durationSource.buffer, durationSource.mimetype)
      : 0;
    const trackId = existingOriginalId || randomUUID();
    const now = Date.now();
    const instrumentalAsset = instrumental
      ? await saveOriginalAsset({
          originalId: trackId,
          kind: "instrumental",
          ...resolveUploadAudio(instrumental),
          originalName: instrumental.originalname,
        })
      : undefined;
    const vocalAsset = vocal
      ? await saveOriginalAsset({
          originalId: trackId,
          kind: "vocal",
          ...resolveUploadAudio(vocal),
          originalName: vocal.originalname,
        })
      : undefined;
    const stemAssets = stems.length
      ? await Promise.all(
          (() => {
            const used = new Set<string>();
            return stems.map((stem, index) => {
              const displayName =
                normalizeStemName(stem.originalname) || `stem-${index + 1}`;
              const stemId = buildStemId(displayName, used);
              const category = normalizeStemCategory(stemCategories[index]);
              return saveStemAsset({
                originalId: trackId,
                stemId,
                stemName: displayName,
                category,
                ...resolveUploadAudio(stem),
                originalName: stem.originalname,
              });
            });
          })(),
        )
      : [];

    await updateNoisegenStore((next) => {
      const existingOriginalIndex = next.originals.findIndex(
        (entry) => entry.id === trackId,
      );
      const existingPendingIndex = next.pendingOriginals.findIndex(
        (entry) => entry.id === trackId,
      );
      const existingEntry =
        existingOriginalIndex >= 0
          ? next.originals[existingOriginalIndex]
          : existingPendingIndex >= 0
            ? next.pendingOriginals[existingPendingIndex]
            : undefined;
      const record = {
        id: trackId,
        title,
        artist: creator,
        listens: existingEntry?.listens ?? 0,
        duration: Math.max(1, Math.round(durationSeconds)),
        tempo,
        notes: notes || undefined,
        offsetMs,
        uploadedAt: now,
        timeSky: timeSky ?? existingEntry?.timeSky,
        assets: {
          ...(instrumentalAsset ? { instrumental: instrumentalAsset } : {}),
          ...(vocalAsset ? { vocal: vocalAsset } : {}),
          ...(stemAssets.length ? { stems: stemAssets } : {}),
        },
      };
      if (existingOriginalIndex >= 0) {
        next.originals[existingOriginalIndex] = record;
      } else if (existingPendingIndex >= 0) {
        next.pendingOriginals[existingPendingIndex] = record;
      } else {
        next.pendingOriginals.push(record);
      }
      return next;
    });

    return res.json({ trackId });
  },
);

router.post("/api/noise-gens/jobs", async (req, res) => {
  const parsed = coverJobRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "invalid_request", issues: parsed.error.issues });
  }

  const id = randomUUID();
  const now = Date.now();
  const job: CoverJob = {
    id,
    type: "cover",
    status: "processing",
    request: parsed.data,
    createdAt: now,
    updatedAt: now,
  };

  await updateNoisegenStore((next) => {
    next.jobs.push(job);
    return next;
  });

  if (shouldRemoteRender(parsed.data)) {
    void processCoverJob(id).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      void updateNoisegenStore((next) => {
        const found = next.jobs.find((entry) => entry.id === id);
        if (!found) return next;
        found.status = "error";
        found.updatedAt = Date.now();
        found.error = message;
        return next;
      });
    });
  }

  return res.json({ id });
});

router.get("/api/noise-gens/jobs/:id", async (req, res) => {
  const store = await getNoisegenStore();
  const job = store.jobs.find((entry) => entry.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: "not_found" });
  }
  return res.json(job);
});

router.put("/api/noise-gens/jobs/:id/ready", async (req, res) => {
  const parsedEvidence =
    req.body?.evidence != null
      ? evidenceSchema.safeParse(req.body.evidence)
      : null;
  if (parsedEvidence && !parsedEvidence.success) {
    return res
      .status(400)
      .json({ error: "invalid_evidence", issues: parsedEvidence.error.issues });
  }

  const previewUrl =
    typeof req.body?.previewUrl === "string" ? req.body.previewUrl : undefined;
  const evidence = parsedEvidence?.success ? parsedEvidence.data : undefined;

  const store = await updateNoisegenStore((next) => {
    const job = next.jobs.find((entry) => entry.id === req.params.id);
    if (!job) return next;
    job.status = "ready";
    job.updatedAt = Date.now();
    if (previewUrl) {
      job.previewUrl = previewUrl;
    }
    if (evidence) {
      job.evidence = evidence;
    }
    if (job.type === "legacy") {
      job.detail = "ready";
    }
    return next;
  });
  const updated = store.jobs.find((entry) => entry.id === req.params.id);
  if (!updated) {
    return res.status(404).json({ error: "not_found" });
  }
  return res.json(updated);
});

router.put("/api/noise-gens/jobs/:id/error", async (req, res) => {
  const message =
    typeof req.body?.error === "string" && req.body.error.trim().length > 0
      ? req.body.error
      : "unknown";
  const store = await updateNoisegenStore((next) => {
    const job = next.jobs.find((entry) => entry.id === req.params.id);
    if (!job) return next;
    job.status = "error";
    job.updatedAt = Date.now();
    job.error = message;
    if (job.type === "legacy") {
      job.detail = message;
    }
    return next;
  });
  const updated = store.jobs.find((entry) => entry.id === req.params.id);
  if (!updated) {
    return res.status(404).json({ error: "not_found" });
  }
  return res.json(updated);
});

router.post("/api/noise-gens/noise-field", (req, res) => {
  const parsed = noiseFieldRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "invalid_noise_field_request", issues: parsed.error.issues });
  }

  const request = parsed.data;
  const width = Math.max(2, request.width ?? DEFAULT_NOISE_FIELD.width);
  const height = Math.max(2, request.height ?? DEFAULT_NOISE_FIELD.height);
  const seed = request.seed ?? DEFAULT_NOISE_FIELD.seed;
  const maxIterations =
    request.maxIterations ?? DEFAULT_NOISE_FIELD.maxIterations;
  const stepSize = request.stepSize ?? DEFAULT_NOISE_FIELD.stepSize;
  const thresholds = {
    ...DEFAULT_NOISE_FIELD.thresholds,
    ...(request.thresholds ?? {}),
  };
  const includeValues = request.includeValues !== false;

  const result = runNoiseFieldLoop({
    width,
    height,
    seed,
    maxIterations,
    stepSize,
    thresholds,
    clamp: request.clamp,
  });

  const attempts = result.attempts.map((attempt) => ({
    iteration: attempt.iteration,
    accepted: attempt.accepted,
    gate: attempt.gate,
    constraints: attempt.constraints,
  }));
  const finalAttempt = attempts[attempts.length - 1] ?? null;
  const stats = summarizeNoiseValues(result.finalState.values);
  const values = includeValues ? Array.from(result.finalState.values) : undefined;

  return res.json({
    config: {
      width,
      height,
      seed,
      maxIterations,
      stepSize,
      thresholds,
      clamp: request.clamp ?? null,
    },
    accepted: result.accepted,
    acceptedIteration: result.acceptedIteration ?? null,
    iterations: attempts.length,
    attempts,
    gate: finalAttempt?.gate ?? null,
    constraints: finalAttempt?.constraints ?? null,
    finalState: {
      width: result.finalState.width,
      height: result.finalState.height,
      encoding: "row-major",
      ...(includeValues ? { values } : {}),
    },
    stats,
  });
});

const getRemoteRenderMode = (): "auto" | "force" | "off" => {
  const raw = (process.env.NOISEGEN_REMOTE_RENDER ?? "auto").toLowerCase();
  if (raw === "force" || raw === "off") return raw;
  return "auto";
};

const shouldRemoteRender = (request: z.infer<typeof coverJobRequestSchema>) => {
  const mode = getRemoteRenderMode();
  if (mode === "force") return true;
  if (mode === "off") return false;
  return request.forceRemote === true;
};

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const seedFromString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const resolvePreviewDurationSeconds = (
  request: z.infer<typeof coverJobRequestSchema>,
): number => {
  const window = request.barWindows?.[0];
  const bars =
    window && Number.isFinite(window.endBar - window.startBar)
      ? Math.max(1, Math.round(window.endBar - window.startBar))
      : 8;
  const bpm = request.tempo?.bpm ?? 120;
  const timeSig = request.tempo?.timeSig ?? "4/4";
  const beatsPerBar = Number(timeSig.split("/")[0]) || 4;
  const seconds = (bars * beatsPerBar * 60) / Math.max(1, bpm);
  return clampNumber(seconds, PREVIEW_MIN_SECONDS, PREVIEW_MAX_SECONDS, 12);
};

const resolvePreviewSettings = (options: {
  seedSource: string;
  styleInfluence?: number;
  sampleInfluence?: number;
  weirdness?: number;
}) => {
  const seed = seedFromString(options.seedSource);
  const style = clamp01(options.styleInfluence ?? 0.3);
  const sample = clamp01(options.sampleInfluence ?? 0.7);
  const weird = clamp01(options.weirdness ?? 0.2);
  const noiseMix = clamp01(0.25 + weird * 0.6 + (1 - sample) * 0.15);
  const toneMix = clamp01(1 - noiseMix);
  const toneHz = clampNumber(140 + Math.round(style * 260) + (seed % 80), 60, 2000, 220);
  return { seed, toneHz, toneMix, noiseMix };
};

const buildPreviewWav = (options: {
  durationSeconds: number;
  seed: number;
  toneHz: number;
  toneMix: number;
  noiseMix: number;
}) => {
  const durationSeconds = Math.max(0.1, options.durationSeconds);
  const frameCount = Math.max(
    1,
    Math.round(durationSeconds * PREVIEW_SAMPLE_RATE),
  );
  const blockAlign = PREVIEW_CHANNELS * 2;
  const dataSize = frameCount * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);
  const byteRate = PREVIEW_SAMPLE_RATE * blockAlign;

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(PREVIEW_CHANNELS, 22);
  buffer.writeUInt32LE(PREVIEW_SAMPLE_RATE, 24);
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
    const t = i / PREVIEW_SAMPLE_RATE;
    const tone = Math.sin(twoPi * options.toneHz * t);
    const noise = rng() * 2 - 1;
    const sample =
      amplitude * (options.toneMix * tone + options.noiseMix * noise);
    const clamped = Math.max(-1, Math.min(1, sample));
    const intSample = Math.round(clamped * 32767);
    for (let ch = 0; ch < PREVIEW_CHANNELS; ch += 1) {
      buffer.writeInt16LE(intSample, offset);
      offset += 2;
    }
  }

  return {
    buffer,
    durationSeconds: frameCount / PREVIEW_SAMPLE_RATE,
  };
};

const processCoverJob = async (jobId: string) => {
  const store = await getNoisegenStore();
  const job = store.jobs.find((entry) => entry.id === jobId);
  if (!job || job.type !== "cover") return;
  if (job.status === "ready" || job.status === "error") return;
  const parsed = coverJobRequestSchema.safeParse(job.request);
  if (!parsed.success) {
    throw new Error("cover_job_request_invalid");
  }

  const durationSeconds = resolvePreviewDurationSeconds(parsed.data);
  const settings = resolvePreviewSettings({
    seedSource: parsed.data.helix?.seed ?? jobId,
    styleInfluence: parsed.data.styleInfluence,
    sampleInfluence: parsed.data.sampleInfluence,
    weirdness: parsed.data.weirdness,
  });
  const preview = buildPreviewWav({ durationSeconds, ...settings });
  const storedPreview = await savePreviewBuffer({
    jobId,
    buffer: preview.buffer,
    mime: "audio/wav",
  });

  await updateNoisegenStore((next) => {
    const target = next.jobs.find((entry) => entry.id === jobId);
    if (!target || target.status === "ready") return next;
    target.status = "ready";
    target.updatedAt = Date.now();
    target.previewUrl = storedPreview.url;
    target.error = undefined;
    return next;
  });
};

const processLegacyJob = async (jobId: string) => {
  const store = await getNoisegenStore();
  const job = store.jobs.find((entry) => entry.id === jobId);
  if (!job || job.type !== "legacy") return;
  if (job.status === "ready" || job.status === "error") return;

  const parsed = legacyGenerateSchema.safeParse(job.request);
  if (!parsed.success) {
    throw new Error("legacy_job_request_invalid");
  }
  const original = findOriginalById(store, parsed.data.originalId);
  if (!original) {
    throw new Error("legacy_original_missing");
  }
  const moodLabel =
    store.moods.find((preset) => preset.id === parsed.data.moodId)?.label ??
    parsed.data.moodId;
  const durationSeconds = clampNumber(12, PREVIEW_MIN_SECONDS, PREVIEW_MAX_SECONDS, 12);
  const settings = resolvePreviewSettings({
    seedSource: `${parsed.data.moodId}:${parsed.data.seed ?? jobId}`,
    styleInfluence: 0.4,
    sampleInfluence: 0.6,
    weirdness: 0.3,
  });
  const preview = buildPreviewWav({ durationSeconds, ...settings });
  const storedPreview = await savePreviewBuffer({
    jobId,
    buffer: preview.buffer,
    mime: "audio/wav",
  });

  await updateNoisegenStore((next) => {
    const target = next.jobs.find((entry) => entry.id === jobId);
    if (!target || target.status === "ready") return next;
    target.status = "ready";
    target.updatedAt = Date.now();
    target.previewUrl = storedPreview.url;
    target.detail = "ready";
    target.error = undefined;
    next.generations.push({
      id: randomUUID(),
      originalId: original.id,
      title: `${original.title} - ${moodLabel}`,
      mood: moodLabel,
      listens: 0,
      createdAt: Date.now(),
      previewUrl: storedPreview.url,
    });
    return next;
  });
};

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export default router;
