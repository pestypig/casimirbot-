import express, { Router } from "express";
import { createHash, randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import {
  promises as fs,
  createReadStream,
  createWriteStream,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { pipeline } from "node:stream/promises";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import { z } from "zod";
import multer from "multer";
import { XMLParser } from "fast-xml-parser";
import { listKnowledgeFilesByProjects } from "../db/knowledge";
import { runNoiseFieldLoop } from "../../modules/analysis/noise-field-loop.js";
import {
  type AbletonIntentSnapshot,
  findOriginalById,
  getNoisegenPaths,
  getNoisegenStore,
  downloadReplitObjectStream,
  isReplitStoragePath,
  isStorageLocator,
  type NoisegenOriginal,
  type NoisegenOriginalAsset,
  type NoisegenPlaybackAsset,
  type NoisegenProcessingState,
  type IntentSnapshotPreferences,
  type NoisegenIntentContract,
  type NoisegenEditionReceipt,
  type NoisegenTimeSkyMeta,
  type NoisegenRecipe,
  type NoisegenStemGroupAsset,
  type NoisegenStemAsset,
  resolveNoisegenStorageBackend,
  resolveNoisegenStoreBackend,
  resolvePlaybackAsset,
  resolvePlaybackAssetPath,
  resolveBundledOriginalsRoots,
  resolveOriginalAsset,
  resolveOriginalAssetPath,
  resolveReplitStorageKey,
  resolveStemAsset,
  resolveStemAssetPath,
  resolveStemGroupAsset,
  resolveStemGroupAssetPath,
  saveAnalysisArtifact,
  savePlaybackAsset,
  savePlaybackAssetFromFile,
  saveOriginalAssetFromFile,
  saveOriginalAsset,
  saveStemGroupAsset,
  saveStemAssetFromFile,
  saveStemAsset,
  savePreviewBuffer,
  updateNoisegenStore,
} from "../services/noisegen-store";
import { getBlob } from "../storage";
import { stableJsonStringify } from "../utils/stable-json";
import {
  createIntentEnforcementState,
  enforceIntentContractOnRequest,
  enforceIntentContractOnRenderPlan,
  finalizeIntentMeta,
} from "../services/noisegen-intent";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ORIGINALS_API_PREFIX = "/api/noise-gens/originals";
const buildOriginalAssetUrl = (originalId: string, assetPath: string) =>
  `${ORIGINALS_API_PREFIX}/${encodeURIComponent(originalId)}/${assetPath}`;
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
const MAX_WAV_NORMALIZE_BYTES = 200 * 1024 * 1024;
const WAVEFORM_BUCKETS = 1024;
const MAX_WAVEFORM_BYTES = MAX_WAV_NORMALIZE_BYTES;
const MAX_WAVEFORM_SAMPLES_PER_BUCKET = 2048;
const MAX_JS_WAV_CONVERT_BYTES = 8 * 1024 * 1024;
const MIXDOWN_SAMPLE_RATE = 44_100;
const MIXDOWN_CHANNELS = 2;
const MIXDOWN_PEAK_TARGET = 0.98;
const PLAYBACK_LIMITER_FILTER = `alimiter=limit=${MIXDOWN_PEAK_TARGET}`;
const PLAYBACK_OPUS_BITRATE = "160k";
const PLAYBACK_AAC_BITRATE = "192k";
const PLAYBACK_MP3_BITRATE = "192k";
const STEM_GROUP_DEFS = [
  { id: "drums", label: "Drums", categories: ["drums"] },
  { id: "bass", label: "Bass", categories: ["bass"] },
  { id: "music", label: "Music", categories: ["music", "other"] },
  { id: "fx", label: "FX", categories: ["fx"] },
];
const ABLETON_INTENT_VERSION = 1 as const;
const ABLETON_DEVICE_KEYS = new Set([
  "Eq8",
  "GlueCompressor",
  "Compressor",
  "Reverb",
  "Delay",
  "Chorus",
  "DrumBuss",
]);
const ABLETON_DEVICE_INTENTS: Record<
  string,
  {
    eqPeaks?: Array<{ freq: number; q: number; gainDb: number }>;
    fx?: {
      reverbSend?: number;
      comp?: number;
      chorus?: number;
      delay?: number;
      sat?: number;
    };
    bounds?: {
      reverbSend?: { min: number; max: number };
      comp?: { min: number; max: number };
      chorus?: { min: number; max: number };
      delay?: { min: number; max: number };
      sat?: { min: number; max: number };
    };
  }
> = {
  Eq8: {
    eqPeaks: [
      { freq: 120, q: 0.9, gainDb: 2.5 },
      { freq: 900, q: 1.1, gainDb: 1.6 },
      { freq: 5200, q: 0.8, gainDb: 2.2 },
    ],
  },
  GlueCompressor: {
    fx: { comp: 0.6 },
    bounds: { comp: { min: 0.35, max: 0.85 } },
  },
  Compressor: {
    fx: { comp: 0.5 },
    bounds: { comp: { min: 0.25, max: 0.75 } },
  },
  Reverb: {
    fx: { reverbSend: 0.45 },
    bounds: { reverbSend: { min: 0.2, max: 0.75 } },
  },
  Delay: {
    fx: { delay: 0.35 },
    bounds: { delay: { min: 0.15, max: 0.65 } },
  },
  Chorus: {
    fx: { chorus: 0.25 },
    bounds: { chorus: { min: 0.1, max: 0.5 } },
  },
  DrumBuss: {
    fx: { sat: 0.4 },
    bounds: { sat: { min: 0.2, max: 0.7 } },
  },
};
const ABLETON_DEVICE_HINT_RE = /(device|effect|instrument|plugin)/i;
const ABLETON_DEVICE_HINT_SKIP = new Set([
  "DeviceChain",
  "DeviceChainMixer",
  "InstrumentGroupDevice",
  "AudioEffectGroupDevice",
  "MidiEffectGroupDevice",
]);
const gunzipAsync = promisify(gunzip);
const ABLETON_XML = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});
const FFMPEG_PATH = process.env.FFMPEG_PATH?.trim() || "ffmpeg";
let ffmpegAvailable: boolean | null = null;
const IDEOLOGY_TREE_PATH = path.resolve("docs", "ethos", "ideology.json");
let ideologyMetaCache:
  | { mtimeMs: number; rootId?: string; treeVersion?: number }
  | null = null;

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

const timeSkyContextSchema = z
  .object({
    publishedAt: z.number().int().min(0).optional(),
    composedStart: z.number().int().min(0).optional(),
    composedEnd: z.number().int().min(0).optional(),
    timezone: z.string().min(1).optional(),
    place: z.string().min(1).optional(),
    placePrecision: z.enum(["exact", "approximate", "hidden"]).optional(),
    halobankSpanId: z.string().min(1).optional(),
    skySignature: z.string().min(1).optional(),
  })
  .strict();

const timeSkyPulseSchema = z
  .object({
    source: z
      .enum(["drand", "nist-beacon", "curby", "local-sky-photons"])
      .optional(),
    round: z.union([z.string().min(1), z.number().int()]).optional(),
    pulseTime: z.number().int().min(0).optional(),
    valueHash: z.string().min(1).optional(),
    seedSalt: z.string().min(1).optional(),
  })
  .strict();

const timeSkySchema = z
  .object({
    publishedAt: z.number().int().min(0).optional(),
    composedStart: z.number().int().min(0).optional(),
    composedEnd: z.number().int().min(0).optional(),
    place: z.string().min(1).optional(),
    skySignature: z.string().min(1).optional(),
    pulseRound: z.union([z.string().min(1), z.number().int()]).optional(),
    pulseHash: z.string().min(1).optional(),
    context: timeSkyContextSchema.optional(),
    pulse: timeSkyPulseSchema.optional(),
  })
  .strict()
  .refine(
    ({ composedStart, composedEnd, context }) => {
      const start = context?.composedStart ?? composedStart;
      const end = context?.composedEnd ?? composedEnd;
      return start == null || end == null || end >= start;
    },
    {
      message: "composedEnd must be >= composedStart",
    },
  );

const intentRangeSchema = z
  .object({
    min: z.number().min(0).max(1),
    max: z.number().min(0).max(1),
  })
  .refine((range) => range.max >= range.min, {
    message: "range max must be >= min",
  });

const intentContractSchema = z
  .object({
    version: z.literal(1),
    createdAt: z.number().int().min(0),
    updatedAt: z.number().int().min(0),
    invariants: z
      .object({
        tempoBpm: z.number().min(1).optional(),
        timeSig: z.string().regex(/^\d+\/\d+$/).optional(),
        key: z.string().min(1).optional(),
        grooveTemplateIds: z.array(z.string().min(1)).optional(),
        motifIds: z.array(z.string().min(1)).optional(),
        stemLocks: z.array(z.string().min(1)).optional(),
      })
      .strict()
      .optional(),
    ranges: z
      .object({
        sampleInfluence: intentRangeSchema.optional(),
        styleInfluence: intentRangeSchema.optional(),
        weirdness: intentRangeSchema.optional(),
        reverbSend: intentRangeSchema.optional(),
        chorus: intentRangeSchema.optional(),
        arrangementMoves: z.array(z.string().min(1)).optional(),
      })
      .strict()
      .optional(),
    meaning: z
      .object({
        ideologyRootId: z.string().min(1).optional(),
        allowedNodeIds: z.array(z.string().min(1)).optional(),
      })
      .strict()
      .optional(),
    provenancePolicy: z
      .object({
        storeTimeSky: z.boolean().optional(),
        storePulse: z.boolean().optional(),
        pulseSource: z
          .enum(["drand", "nist-beacon", "curby", "local-sky-photons"])
          .optional(),
        placePrecision: z.enum(["exact", "approximate", "hidden"]).optional(),
      })
      .strict()
      .optional(),
    notes: z.string().max(600).optional(),
  })
  .strict();

const intentSnapshotPreferencesSchema = z
  .object({
    applyTempo: z.boolean().optional(),
    applyMix: z.boolean().optional(),
    applyAutomation: z.boolean().optional(),
  })
  .strict();

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

const renderPlanLocksSchema = z
  .object({
    groove: z.boolean().optional(),
    harmony: z.boolean().optional(),
    drums: z.boolean().optional(),
    bass: z.boolean().optional(),
    music: z.boolean().optional(),
    textures: z.boolean().optional(),
    fx: z.boolean().optional(),
  })
  .strict();

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
        delay: z.number().finite().optional(),
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
        locks: renderPlanLocksSchema.optional(),
      })
      .passthrough()
      .optional(),
    windows: z.array(renderPlanWindowSchema),
  })
  .passthrough();

const planMetaSchema = z
  .object({
    plannerVersion: z.string().min(1).optional(),
    modelVersion: z.union([z.string().min(1), z.number().finite()]).optional(),
    toolVersions: z.record(z.string().min(1)).optional(),
  })
  .strict();

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
    planMeta: planMetaSchema.optional(),
    forceRemote: z.boolean().optional(),
  })
  .refine((value) => !value.linkHelix || Boolean(value.helix), {
    message: "helix packet required when linkHelix is true",
  });

const recipeMetricsSchema = z
  .object({
    idi: z.number().min(0).max(1).optional(),
  })
  .strict();

const recipeSchema = z
  .object({
    name: z.string().min(1),
    coverRequest: coverJobRequestSchema,
    seed: z.union([z.string().min(1), z.number().finite()]).optional(),
    notes: z.string().optional(),
    featured: z.boolean().optional(),
    parentId: z.string().min(1).optional(),
    metrics: recipeMetricsSchema.optional(),
  })
  .strict();

const recipeUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    notes: z.string().optional(),
    featured: z.boolean().optional(),
    parentId: z.union([z.string().min(1), z.null()]).optional(),
    metrics: recipeMetricsSchema.optional(),
  })
  .strict();

const listenerMacroSchema = z
  .object({
    energy: z.number().min(0).max(1),
    space: z.number().min(0).max(1),
    texture: z.number().min(0).max(1),
    weirdness: z.number().min(0).max(1).optional(),
    drive: z.number().min(0).max(1).optional(),
    locks: renderPlanLocksSchema.optional(),
  })
  .strict();

const legacyGenerateSchema = z
  .object({
    originalId: z.string().min(1),
    moodId: z.string().min(1),
    seed: z.number().int().optional(),
    helixPacket: helixPacketSchema.optional(),
    macros: listenerMacroSchema.optional(),
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

const readBooleanField = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
};

const buildIntentSnapshotPreferences = (params: {
  applyTempo?: boolean;
  applyMix?: boolean;
  applyAutomation?: boolean;
  hasSnapshot: boolean;
}): IntentSnapshotPreferences | undefined => {
  const explicit =
    params.applyTempo != null ||
    params.applyMix != null ||
    params.applyAutomation != null;
  if (!params.hasSnapshot && !explicit) return undefined;
  return {
    applyTempo: params.applyTempo ?? true,
    applyMix: params.applyMix ?? true,
    applyAutomation: params.applyAutomation ?? false,
  };
};

const normalizeNodeIds = (list?: string[]) => {
  if (!Array.isArray(list)) return [];
  const unique = new Set(
    list.map((entry) => (typeof entry === "string" ? entry.trim() : "")),
  );
  return Array.from(unique).filter(Boolean).sort();
};

const loadIdeologyReceiptMeta = async (): Promise<{
  rootId?: string;
  treeVersion?: number;
} | null> => {
  try {
    const stats = await fs.stat(IDEOLOGY_TREE_PATH);
    if (ideologyMetaCache && ideologyMetaCache.mtimeMs === stats.mtimeMs) {
      return ideologyMetaCache;
    }
    const payload = await fs.readFile(IDEOLOGY_TREE_PATH, "utf8");
    const parsed = JSON.parse(payload) as { rootId?: unknown; version?: unknown };
    const meta = {
      mtimeMs: stats.mtimeMs,
      rootId:
        typeof parsed.rootId === "string" ? parsed.rootId.trim() : undefined,
      treeVersion:
        typeof parsed.version === "number" && Number.isFinite(parsed.version)
          ? parsed.version
          : undefined,
    };
    ideologyMetaCache = meta;
    return meta;
  } catch {
    return null;
  }
};

const buildIdeologyMappingHash = (payload: {
  rootId?: string;
  allowedNodeIds?: string[];
  treeVersion?: number;
}) => {
  const stable = stableJsonStringify(payload);
  return createHash("sha256").update(stable).digest("hex");
};

const buildIdeologyReceipt = async (
  contract?: NoisegenIntentContract | null,
): Promise<NoisegenEditionReceipt["ideology"] | undefined> => {
  const allowedNodeIds = normalizeNodeIds(contract?.meaning?.allowedNodeIds);
  const meta = await loadIdeologyReceiptMeta();
  const rootId = contract?.meaning?.ideologyRootId ?? meta?.rootId;
  const treeVersion = meta?.treeVersion;
  if (!rootId && allowedNodeIds.length === 0 && treeVersion == null) {
    return undefined;
  }
  return {
    rootId: rootId ?? undefined,
    ...(allowedNodeIds.length ? { allowedNodeIds } : {}),
    ...(treeVersion != null ? { treeVersion } : {}),
    mappingHash: buildIdeologyMappingHash({
      rootId: rootId ?? undefined,
      allowedNodeIds,
      treeVersion,
    }),
  };
};

const sanitizeTimeSkyForReceipt = (
  timeSky: NoisegenTimeSkyMeta,
  policy: NoisegenIntentContract["provenancePolicy"] | undefined,
  options: { omitPulse: boolean },
): NoisegenTimeSkyMeta => {
  const placePrecision =
    policy?.placePrecision ?? timeSky.context?.placePrecision;
  const context = timeSky.context ? { ...timeSky.context } : undefined;
  if (context && placePrecision) {
    context.placePrecision = placePrecision;
    if (placePrecision === "hidden") {
      delete context.place;
    }
  }
  const sanitized: NoisegenTimeSkyMeta = {
    ...timeSky,
    ...(context ? { context } : {}),
  };
  if (placePrecision === "hidden") {
    delete sanitized.place;
  }
  if (options.omitPulse) {
    delete sanitized.pulse;
    delete sanitized.pulseRound;
    delete sanitized.pulseHash;
  }
  return sanitized;
};

const resolvePulseReceipt = (
  timeSky: NoisegenTimeSkyMeta | undefined,
  policy: NoisegenIntentContract["provenancePolicy"] | undefined,
) => {
  if (!timeSky) return undefined;
  if (policy?.storePulse === false) return undefined;
  if (timeSky.pulse) {
    const pulse = { ...timeSky.pulse };
    if (!pulse.source && policy?.pulseSource) {
      pulse.source = policy.pulseSource;
    }
    return pulse;
  }
  if (timeSky.pulseRound != null || timeSky.pulseHash) {
    return {
      source: policy?.pulseSource,
      round: timeSky.pulseRound,
      valueHash: timeSky.pulseHash,
    };
  }
  return undefined;
};

const buildProvenanceReceipt = (
  timeSky: NoisegenTimeSkyMeta | undefined,
  policy: NoisegenIntentContract["provenancePolicy"] | undefined,
): NoisegenEditionReceipt["provenance"] | undefined => {
  if (!timeSky && !policy) return undefined;
  const storeTimeSky = policy?.storeTimeSky !== false;
  const placePrecision =
    policy?.placePrecision ?? timeSky?.context?.placePrecision;
  const receipt: NoisegenEditionReceipt["provenance"] = {};
  if (storeTimeSky && timeSky) {
    receipt.timeSky = sanitizeTimeSkyForReceipt(timeSky, policy, {
      omitPulse: policy?.storePulse === false,
    });
  }
  const pulse = resolvePulseReceipt(timeSky, policy);
  if (pulse) {
    receipt.pulse = pulse;
  }
  if (placePrecision) {
    receipt.placePrecision = placePrecision;
  }
  return Object.keys(receipt).length ? receipt : undefined;
};

const parseIntentContractField = (
  value: unknown,
):
  | { contract?: z.infer<typeof intentContractSchema> }
  | { error: { error: string; issues?: z.ZodIssue[] } } => {
  const raw = readStringField(value);
  if (!raw) return { contract: undefined };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: { error: "invalid_intent_contract_json" } };
  }
  const validation = intentContractSchema.safeParse(parsed);
  if (!validation.success) {
    return {
      error: {
        error: "invalid_intent_contract",
        issues: validation.error.issues,
      },
    };
  }
  return { contract: validation.data };
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

const mimeFromName = (value?: string): string => {
  if (!value) return "application/octet-stream";
  const ext = path.extname(value).toLowerCase();
  if (ext === ".wav" || ext === ".wave") return "audio/wav";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".flac") return "audio/flac";
  if (ext === ".ogg" || ext === ".oga") return "audio/ogg";
  if (ext === ".aiff" || ext === ".aif") return "audio/aiff";
  if (ext === ".xml") return "application/xml";
  if (ext === ".als") return "application/octet-stream";
  return "application/octet-stream";
};

const isGzipBuffer = (buffer: Buffer): boolean =>
  buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;

const resolveAbletonIntentKind = (
  fileName: string | undefined,
  buffer: Buffer,
): "als" | "xml" | null => {
  const ext = fileName ? path.extname(fileName).toLowerCase() : "";
  if (ext === ".als") return "als";
  if (ext === ".xml") return "xml";
  if (isGzipBuffer(buffer)) return "als";
  return null;
};

const toArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const readScalarValue = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const node = value as Record<string, unknown>;
    const direct = node.Value ?? node.value ?? node.Name ?? node.name;
    if (typeof direct === "string" || typeof direct === "number") {
      return String(direct);
    }
  }
  return undefined;
};

const readNumericValue = (value: unknown): number | null => {
  const raw = readScalarValue(value);
  if (raw == null) return null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
};

const collectNodesByKey = (
  node: unknown,
  key: string,
  results: unknown[],
) => {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((entry) => collectNodesByKey(entry, key, results));
    return;
  }
  if (typeof node !== "object") return;
  for (const [entryKey, value] of Object.entries(
    node as Record<string, unknown>,
  )) {
    if (entryKey === key) {
      if (Array.isArray(value)) {
        results.push(...value);
      } else {
        results.push(value);
      }
    }
    if (value && typeof value === "object") {
      collectNodesByKey(value, key, results);
    }
  }
};

const resolveLiveSetRoot = (parsed: unknown): unknown => {
  if (!parsed || typeof parsed !== "object") return null;
  const root = parsed as Record<string, unknown>;
  const ableton = root.Ableton as Record<string, unknown> | undefined;
  if (ableton?.LiveSet) return ableton.LiveSet;
  if (root.LiveSet) return root.LiveSet;
  return parsed;
};

const extractTempoFromXml = (root: unknown): number | undefined => {
  const nodes: unknown[] = [];
  collectNodesByKey(root, "Tempo", nodes);
  for (const node of nodes) {
    const tempo =
      readNumericValue((node as Record<string, unknown>)?.Manual) ??
      readNumericValue((node as Record<string, unknown>)?.Value) ??
      readNumericValue(node);
    if (tempo && tempo > 0) return tempo;
  }
  return undefined;
};

const extractTimeSigFromXml = (root: unknown): string | undefined => {
  const nodes: unknown[] = [];
  collectNodesByKey(root, "TimeSignature", nodes);
  for (const node of nodes) {
    const numerator = readNumericValue(
      (node as Record<string, unknown>)?.Numerator,
    );
    const denominator = readNumericValue(
      (node as Record<string, unknown>)?.Denominator,
    );
    if (numerator && denominator) return `${numerator}/${denominator}`;
  }
  return undefined;
};

const extractLocatorsFromXml = (root: unknown) => {
  const nodes: unknown[] = [];
  collectNodesByKey(root, "Locator", nodes);
  const locators = nodes
    .flatMap((node) => toArray(node))
    .map((entry) => {
      const data = entry as Record<string, unknown>;
      const nameRaw = readScalarValue(data.Name);
      const time = readNumericValue(data.Time);
      const name = nameRaw?.trim();
      if (!name && time == null) return null;
      return { name: name || undefined, time: time ?? undefined };
    })
    .filter((entry): entry is { name?: string; time?: number } => !!entry);
  return locators;
};

const collectDeviceNames = (
  node: unknown,
  names: string[],
  counts: Map<string, number>,
) => {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((entry) => collectDeviceNames(entry, names, counts));
    return;
  }
  if (typeof node !== "object") return;
  for (const [entryKey, value] of Object.entries(
    node as Record<string, unknown>,
  )) {
    const isKnown = ABLETON_DEVICE_KEYS.has(entryKey);
    const isHint =
      isKnown ||
      (ABLETON_DEVICE_HINT_RE.test(entryKey) &&
        !ABLETON_DEVICE_HINT_SKIP.has(entryKey));
    if (isHint) {
      const entries = toArray(value);
      const count = entries.length > 0 ? entries.length : 1;
      for (let i = 0; i < count; i += 1) {
        names.push(entryKey);
      }
      counts.set(entryKey, (counts.get(entryKey) ?? 0) + count);
    }
    if (value && typeof value === "object") {
      collectDeviceNames(value, names, counts);
    }
  }
};

const mergeIntentFx = (
  base: NonNullable<AbletonIntentSnapshot["deviceIntent"]>["fx"] | undefined,
  next: NonNullable<AbletonIntentSnapshot["deviceIntent"]>["fx"] | undefined,
) => {
  if (!next) return base;
  const merged = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(next)) {
    if (typeof value !== "number") continue;
    const prev = merged[key as keyof typeof merged];
    const resolved =
      typeof prev === "number" ? Math.max(prev, value) : value;
    merged[key as keyof typeof merged] = resolved;
  }
  return merged;
};

const mergeIntentBounds = (
  base: NonNullable<AbletonIntentSnapshot["deviceIntent"]>["bounds"] | undefined,
  next: NonNullable<AbletonIntentSnapshot["deviceIntent"]>["bounds"] | undefined,
) => {
  if (!next) return base;
  const merged = { ...(base ?? {}) } as NonNullable<
    AbletonIntentSnapshot["deviceIntent"]
  >["bounds"];
  for (const [key, value] of Object.entries(next)) {
    if (!value || typeof value !== "object") continue;
    const range = value as { min: number; max: number };
    const current = merged?.[key as keyof typeof merged];
    const minValue =
      current && typeof current.min === "number"
        ? Math.min(current.min, range.min)
        : range.min;
    const maxValue =
      current && typeof current.max === "number"
        ? Math.max(current.max, range.max)
        : range.max;
    merged[key as keyof typeof merged] = { min: minValue, max: maxValue };
  }
  return merged;
};

const buildDeviceIntent = (deviceCounts: Map<string, number>) => {
  let eqPeaks: Array<{ freq: number; q: number; gainDb: number }> | undefined;
  let fx:
    | NonNullable<AbletonIntentSnapshot["deviceIntent"]>["fx"]
    | undefined;
  let bounds:
    | NonNullable<AbletonIntentSnapshot["deviceIntent"]>["bounds"]
    | undefined;
  for (const [name] of deviceCounts.entries()) {
    const intent = ABLETON_DEVICE_INTENTS[name];
    if (!intent) continue;
    if (!eqPeaks && intent.eqPeaks) {
      eqPeaks = intent.eqPeaks.map((peak) => ({ ...peak }));
    }
    fx = mergeIntentFx(fx, intent.fx);
    bounds = mergeIntentBounds(bounds, intent.bounds);
  }
  if (!eqPeaks && !fx && !bounds) return undefined;
  return {
    ...(eqPeaks ? { eqPeaks } : {}),
    ...(fx ? { fx } : {}),
    ...(bounds ? { bounds } : {}),
  };
};

const collectAutomationPoints = (
  node: unknown,
  points: Array<{ time: number; value: number }>,
) => {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((entry) => collectAutomationPoints(entry, points));
    return;
  }
  if (typeof node !== "object") return;
  const record = node as Record<string, unknown>;
  const time = readNumericValue(record.Time ?? record.time ?? record.Position);
  const value = readNumericValue(record.Value ?? record.value);
  if (time != null && value != null) {
    points.push({ time, value });
  }
  for (const child of Object.values(record)) {
    if (child && typeof child === "object") {
      collectAutomationPoints(child, points);
    }
  }
};

const buildAutomationSummary = (
  root: unknown,
  timeSig?: string,
): AbletonIntentSnapshot["automation"] | undefined => {
  const envelopes: unknown[] = [];
  collectNodesByKey(root, "AutomationEnvelope", envelopes);
  if (!envelopes.length) return undefined;
  const points: Array<{ time: number; value: number }> = [];
  for (const envelope of envelopes) {
    collectAutomationPoints(envelope, points);
  }
  if (!points.length) {
    return { envelopeCount: envelopes.length, pointCount: 0 };
  }
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    minValue = Math.min(minValue, point.value);
    maxValue = Math.max(maxValue, point.value);
  }
  const range =
    Number.isFinite(minValue) && Number.isFinite(maxValue) && maxValue > minValue
      ? maxValue - minValue
      : 0;
  const beatsPerBar = (() => {
    if (!timeSig || !timeSig.includes("/")) return 4;
    const [numRaw] = timeSig.split("/");
    const num = Number(numRaw);
    return Number.isFinite(num) && num > 0 ? Math.floor(num) : 4;
  })();
  const barMap = new Map<number, number>();
  for (const point of points) {
    const bar = Math.max(1, Math.floor(point.time / beatsPerBar) + 1);
    const normalized = range
      ? (point.value - minValue) / range
      : 0.5;
    barMap.set(bar, Math.max(0, Math.min(1, normalized)));
  }
  const energyCurve = Array.from(barMap.entries())
    .sort(([a], [b]) => a - b)
    .slice(0, 256)
    .map(([bar, energy]) => ({ bar, energy }));
  return {
    envelopeCount: envelopes.length,
    pointCount: points.length,
    ...(energyCurve.length ? { energyCurve } : {}),
  };
};

const readTrackName = (node: Record<string, unknown>) => {
  const nameNode = node.Name as Record<string, unknown> | undefined;
  const raw =
    (nameNode?.EffectiveName as Record<string, unknown> | undefined)?.Value ??
    (nameNode?.UserName as Record<string, unknown> | undefined)?.Value ??
    nameNode?.Value ??
    nameNode?.name;
  const value = typeof raw === "string" ? raw.trim() : undefined;
  return value || undefined;
};

const extractTracksFromXml = (root: unknown) => {
  const trackDefs: Array<{
    key: string;
    type: AbletonIntentSnapshot["tracks"][number]["type"];
  }> = [
    { key: "AudioTrack", type: "audio" },
    { key: "MidiTrack", type: "midi" },
    { key: "ReturnTrack", type: "return" },
    { key: "GroupTrack", type: "group" },
    { key: "MasterTrack", type: "master" },
  ];
  const tracks: AbletonIntentSnapshot["tracks"] = [];
  const deviceCounts = new Map<string, number>();
  for (const def of trackDefs) {
    const nodes: unknown[] = [];
    collectNodesByKey(root, def.key, nodes);
    for (const node of nodes.flatMap((entry) => toArray(entry))) {
      const trackNode = node as Record<string, unknown>;
      const deviceNames: string[] = [];
      collectDeviceNames(trackNode, deviceNames, deviceCounts);
      tracks.push({
        name: readTrackName(trackNode),
        type: def.type,
        devices: Array.from(new Set(deviceNames)),
      });
    }
  }
  return { tracks, deviceCounts };
};

const parseAbletonIntentSnapshot = async (params: {
  buffer: Buffer;
  fileName?: string;
}): Promise<AbletonIntentSnapshot | null> => {
  const fileName = params.fileName ?? "ableton.als";
  const kind = resolveAbletonIntentKind(fileName, params.buffer);
  if (!kind) return null;
  let xmlBuffer = params.buffer;
  if (kind === "als") {
    try {
      xmlBuffer = await gunzipAsync(params.buffer);
    } catch {
      return null;
    }
  }
  const xml = xmlBuffer.toString("utf8");
  if (!xml.trim()) return null;
  let parsed: unknown;
  try {
    parsed = ABLETON_XML.parse(xml);
  } catch {
    return null;
  }
  const root = resolveLiveSetRoot(parsed);
  const tempo = extractTempoFromXml(root);
  const timeSig = extractTimeSigFromXml(root);
  const locators = extractLocatorsFromXml(root);
  const { tracks, deviceCounts } = extractTracksFromXml(root);
  const devices = Array.from(deviceCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const deviceIntent = buildDeviceIntent(deviceCounts);
  const automation = buildAutomationSummary(root, timeSig);
  const summary = {
    trackCount: tracks.length,
    audioTrackCount: tracks.filter((track) => track.type === "audio").length,
    midiTrackCount: tracks.filter((track) => track.type === "midi").length,
    returnTrackCount: tracks.filter((track) => track.type === "return").length,
    groupTrackCount: tracks.filter((track) => track.type === "group").length,
    deviceCount: devices.reduce((sum, item) => sum + item.count, 0),
    locatorCount: locators.length,
  };
  return {
    version: ABLETON_INTENT_VERSION,
    source: { kind, fileName },
    createdAt: Date.now(),
    globals: {
      bpm: tempo,
      timeSig,
    },
    summary,
    devices,
    deviceIntent,
    automation,
    tracks,
    locators: locators.length ? locators : undefined,
  };
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

const normalizeStemCategoryValue = (value?: string): string | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return STEM_CATEGORY_ALLOWLIST.has(normalized) ? normalized : undefined;
};

const mergeStemAssets = (
  existing: NoisegenStemAsset[] | undefined,
  incoming: NoisegenStemAsset[],
): NoisegenStemAsset[] => {
  if (!incoming.length) return existing ? [...existing] : [];
  if (!existing || existing.length === 0) return [...incoming];
  const merged = [...existing];
  const indexById = new Map(
    merged.map((stem, index) => [stem.id.toLowerCase(), index]),
  );
  for (const stem of incoming) {
    const key = stem.id.toLowerCase();
    const existingIndex = indexById.get(key);
    if (existingIndex == null) {
      indexById.set(key, merged.length);
      merged.push(stem);
    } else {
      merged[existingIndex] = stem;
    }
  }
  return merged;
};

const mergePlaybackAssets = (
  existing: NoisegenPlaybackAsset[] | undefined,
  incoming: NoisegenPlaybackAsset[] | undefined,
): NoisegenPlaybackAsset[] => {
  if (!incoming || incoming.length === 0) return existing ? [...existing] : [];
  if (!existing || existing.length === 0) return [...incoming];
  const merged = [...existing];
  const indexById = new Map(
    merged.map((asset, index) => [asset.id.toLowerCase(), index]),
  );
  for (const asset of incoming) {
    const key = asset.id.toLowerCase();
    const existingIndex = indexById.get(key);
    if (existingIndex == null) {
      indexById.set(key, merged.length);
      merged.push(asset);
    } else {
      merged[existingIndex] = asset;
    }
  }
  return merged;
};

const mergeStemGroupAssets = (
  existing: NoisegenStemGroupAsset[] | undefined,
  incoming: NoisegenStemGroupAsset[] | undefined,
): NoisegenStemGroupAsset[] => {
  if (!incoming || incoming.length === 0) return existing ? [...existing] : [];
  if (!existing || existing.length === 0) return [...incoming];
  const merged = [...existing];
  const indexById = new Map(
    merged.map((asset, index) => [asset.id.toLowerCase(), index]),
  );
  for (const asset of incoming) {
    const key = asset.id.toLowerCase();
    const existingIndex = indexById.get(key);
    if (existingIndex == null) {
      indexById.set(key, merged.length);
      merged.push(asset);
    } else {
      merged[existingIndex] = asset;
    }
  }
  return merged;
};

const upsertOriginalRecord = async (params: {
  trackId: string;
  title: string;
  creator: string;
  durationSeconds: number;
  offsetMs: number;
  tempo?: z.infer<typeof tempoMetaSchema>;
  notes?: string;
  timeSky?: z.infer<typeof timeSkySchema>;
  intentSnapshot?: AbletonIntentSnapshot;
  intentSnapshotPreferences?: IntentSnapshotPreferences;
  intentContract?: z.infer<typeof intentContractSchema> | null;
  instrumentalAsset?: NoisegenOriginalAsset;
  vocalAsset?: NoisegenOriginalAsset;
  stemAssets?: NoisegenStemAsset[];
  playbackAssets?: NoisegenPlaybackAsset[];
  stemGroupAssets?: NoisegenStemGroupAsset[];
  processing?: NoisegenProcessingState;
}): Promise<void> => {
  await updateNoisegenStore((next) => {
    const existingOriginalIndex = next.originals.findIndex(
      (entry) => entry.id === params.trackId,
    );
    const existingPendingIndex = next.pendingOriginals.findIndex(
      (entry) => entry.id === params.trackId,
    );
    const existingEntry =
      existingOriginalIndex >= 0
        ? next.originals[existingOriginalIndex]
        : existingPendingIndex >= 0
          ? next.pendingOriginals[existingPendingIndex]
          : undefined;
    const existingAssets = existingEntry?.assets ?? {};
    const mergedStems =
      params.stemAssets && params.stemAssets.length > 0
        ? mergeStemAssets(existingAssets.stems, params.stemAssets)
        : existingAssets.stems ?? [];
    const mergedPlayback =
      params.playbackAssets && params.playbackAssets.length > 0
        ? mergePlaybackAssets(existingAssets.playback, params.playbackAssets)
        : existingAssets.playback ?? [];
    const mergedStemGroups =
      params.stemGroupAssets && params.stemGroupAssets.length > 0
        ? mergeStemGroupAssets(existingAssets.stemGroups, params.stemGroupAssets)
        : existingAssets.stemGroups ?? [];
    const mergedInstrumental =
      params.instrumentalAsset ?? existingAssets.instrumental;
    const mergedVocal = params.vocalAsset ?? existingAssets.vocal;
    const nextAssets: NoisegenOriginal["assets"] = {};
    if (mergedInstrumental) {
      nextAssets.instrumental = mergedInstrumental;
    }
    if (mergedVocal) {
      nextAssets.vocal = mergedVocal;
    }
    if (mergedStems.length > 0) {
      nextAssets.stems = mergedStems;
    }
    if (mergedPlayback.length > 0) {
      nextAssets.playback = mergedPlayback;
    }
    if (mergedStemGroups.length > 0) {
      nextAssets.stemGroups = mergedStemGroups;
    }
    const record = {
      id: params.trackId,
      title: params.title,
      artist: params.creator,
      listens: existingEntry?.listens ?? 0,
      duration:
        existingEntry?.duration && existingEntry.duration > 0
          ? existingEntry.duration
          : Math.max(1, Math.round(params.durationSeconds)),
      tempo: params.tempo ?? existingEntry?.tempo,
      notes: params.notes || existingEntry?.notes,
      offsetMs: Number.isFinite(params.offsetMs)
        ? params.offsetMs
        : existingEntry?.offsetMs,
      uploadedAt: existingEntry?.uploadedAt ?? Date.now(),
      timeSky: params.timeSky ?? existingEntry?.timeSky,
      intentSnapshot: params.intentSnapshot ?? existingEntry?.intentSnapshot,
      intentSnapshotPreferences:
        params.intentSnapshotPreferences ??
        existingEntry?.intentSnapshotPreferences,
      intentContract:
        params.intentContract === null
          ? undefined
          : params.intentContract ?? existingEntry?.intentContract,
      processing: params.processing ?? existingEntry?.processing,
      assets: nextAssets,
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
  if (file.buffer.byteLength > MAX_JS_WAV_CONVERT_BYTES) return null;
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

const resolvePlaybackCodec = (
  mime: string,
): NoisegenPlaybackAsset["codec"] => {
  const lower = mime.toLowerCase();
  if (lower.includes("mpeg") || lower.includes("mp3")) return "mp3";
  if (lower.includes("ogg") || lower.includes("opus")) return "opus";
  if (lower.includes("aac") || lower.includes("mp4")) return "aac";
  return "wav";
};

const resolvePlaybackReadyDetail = (
  playbackAssets: NoisegenPlaybackAsset[] | undefined,
): string => {
  if (!playbackAssets || playbackAssets.length === 0) return "playback ready";
  const hasCompressed = playbackAssets.some((asset) => asset.codec !== "wav");
  return hasCompressed ? "playback ready" : "playback ready (wav-only)";
};

const ensureFfmpegAvailable = (): boolean => {
  if (ffmpegAvailable != null) return ffmpegAvailable;
  try {
    const result = spawnSync(FFMPEG_PATH, ["-version"], { stdio: "ignore" });
    ffmpegAvailable = result.status === 0;
  } catch {
    ffmpegAvailable = false;
  }
  return ffmpegAvailable;
};

const runFfmpeg = async (args: string[], input: Buffer): Promise<Buffer> =>     
  new Promise((resolve, reject) => {
    const child = spawn(FFMPEG_PATH, args, { stdio: ["pipe", "pipe", "pipe"] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk) => {
      stdout.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    child.stderr.on("data", (chunk) => {
      stderr.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdout));
        return;
      }
      const message = Buffer.concat(stderr).toString("utf8").trim();
      reject(new Error(message || `ffmpeg exited with code ${code ?? 1}`));
    });
    child.stdin.on("error", () => undefined);
    child.stdin.end(input);
  });

const runFfmpegWithFiles = async (args: string[]): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const child = spawn(FFMPEG_PATH, args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk) => {
      stdout.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    child.stderr.on("data", (chunk) => {
      stderr.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdout));
        return;
      }
      const message = Buffer.concat(stderr).toString("utf8").trim();
      reject(new Error(message || `ffmpeg exited with code ${code ?? 1}`));
    });
  });

const writeStreamToFile = async (
  stream: NodeJS.ReadableStream,
  filePath: string,
): Promise<void> => {
  await pipeline(stream, createWriteStream(filePath));
};

const extractPcm16Samples = (
  buffer: Buffer,
  format: WavFormat,
): Int16Array => {
  const data = buffer.subarray(
    format.dataOffset,
    format.dataOffset + format.dataSize,
  );
  return new Int16Array(
    data.buffer,
    data.byteOffset,
    Math.floor(data.byteLength / 2),
  );
};

const convertPcm16Channels = (
  samples: Int16Array,
  fromChannels: number,
  toChannels: number,
): Int16Array | null => {
  if (fromChannels === toChannels) return samples;
  const frameCount = Math.floor(samples.length / fromChannels);
  if (frameCount <= 0) return null;
  if (fromChannels === 1 && toChannels === 2) {
    const output = new Int16Array(frameCount * 2);
    for (let i = 0; i < frameCount; i += 1) {
      const sample = samples[i];
      const base = i * 2;
      output[base] = sample;
      output[base + 1] = sample;
    }
    return output;
  }
  if (fromChannels === 2 && toChannels === 1) {
    const output = new Int16Array(frameCount);
    for (let i = 0; i < frameCount; i += 1) {
      const base = i * 2;
      const merged = (samples[base] + samples[base + 1]) / 2;
      output[i] = Math.max(-32768, Math.min(32767, Math.round(merged)));
    }
    return output;
  }
  return null;
};

const resamplePcm16Samples = (
  samples: Int16Array,
  channels: number,
  inputRate: number,
  outputRate: number,
): Int16Array => {
  if (inputRate === outputRate) return samples;
  const inputFrames = Math.floor(samples.length / channels);
  if (inputFrames <= 0) return new Int16Array(0);
  const outputFrames = Math.max(
    1,
    Math.round((inputFrames * outputRate) / inputRate),
  );
  const output = new Int16Array(outputFrames * channels);
  const ratio = inputRate / outputRate;
  for (let frame = 0; frame < outputFrames; frame += 1) {
    const sourcePos = frame * ratio;
    const leftIndex = Math.floor(sourcePos);
    const rightIndex = Math.min(leftIndex + 1, inputFrames - 1);
    const mix = sourcePos - leftIndex;
    const leftBase = leftIndex * channels;
    const rightBase = rightIndex * channels;
    const outBase = frame * channels;
    for (let channel = 0; channel < channels; channel += 1) {
      const leftSample = samples[leftBase + channel];
      const rightSample = samples[rightBase + channel];
      const value = leftSample + (rightSample - leftSample) * mix;
      output[outBase + channel] = Math.max(
        -32768,
        Math.min(32767, Math.round(value)),
      );
    }
  }
  return output;
};

const rebuildPcm16WavBuffer = (
  samples: Int16Array,
  sampleRate: number,
  channels: number,
): { buffer: Buffer; format: WavFormat } | null => {
  const buffer = buildPcm16WavBuffer({ samples, sampleRate, channels });
  const format = parseWavFormat(buffer);
  if (!format) return null;
  return { buffer, format };
};

const normalizePcm16WavBuffer = async (params: {
  buffer: Buffer;
  mime: string;
}): Promise<{ buffer: Buffer; format: WavFormat } | null> => {
  const direct = ensurePcm16WavBuffer(params.buffer, params.mime);
  if (direct) {
    let format = direct.format!;
    if (format.channels > MIXDOWN_CHANNELS) {
      if (!ensureFfmpegAvailable()) return null;
      try {
        const wavBuffer = await runFfmpeg(
          [
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            "pipe:0",
            "-acodec",
            "pcm_s16le",
            "-ac",
            String(MIXDOWN_CHANNELS),
            "-ar",
            String(MIXDOWN_SAMPLE_RATE),
            "-f",
            "wav",
            "pipe:1",
          ],
          direct.buffer,
        );
        return ensurePcm16WavBuffer(wavBuffer, "audio/wav");
      } catch {
        return null;
      }
    }
    let samples = extractPcm16Samples(direct.buffer, format);
    let updated = false;
    if (format.channels !== MIXDOWN_CHANNELS) {
      const converted = convertPcm16Channels(
        samples,
        format.channels,
        MIXDOWN_CHANNELS,
      );
      if (!converted) return null;
      samples = converted;
      format = { ...format, channels: MIXDOWN_CHANNELS };
      updated = true;
    }
    if (format.sampleRate !== MIXDOWN_SAMPLE_RATE) {
      samples = resamplePcm16Samples(
        samples,
        format.channels,
        format.sampleRate,
        MIXDOWN_SAMPLE_RATE,
      );
      format = { ...format, sampleRate: MIXDOWN_SAMPLE_RATE };
      updated = true;
    }
    if (!updated) return direct;
    return rebuildPcm16WavBuffer(samples, format.sampleRate, format.channels);
  }
  if (!ensureFfmpegAvailable()) return null;
  try {
    const wavBuffer = await runFfmpeg(
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-acodec",
        "pcm_s16le",
        "-ac",
        String(MIXDOWN_CHANNELS),
        "-ar",
        String(MIXDOWN_SAMPLE_RATE),
        "-f",
        "wav",
        "pipe:1",
      ],
      params.buffer,
    );
    return ensurePcm16WavBuffer(wavBuffer, "audio/wav");
  } catch {
    return null;
  }
};

const transcodePlaybackVariant = async (params: {
  originalId: string;
  buffer: Buffer;
  playbackId: string;
  label: string;
  codec: NoisegenPlaybackAsset["codec"];
  mime: string;
  originalName: string;
  args: string[];
}): Promise<NoisegenPlaybackAsset | null> => {
  if (!ensureFfmpegAvailable()) return null;
  try {
    const encoded = await runFfmpeg(params.args, params.buffer);
    return await savePlaybackAsset({
      originalId: params.originalId,
      playbackId: params.playbackId,
      label: params.label,
      codec: params.codec,
      buffer: encoded,
      mime: params.mime,
      originalName: params.originalName,
    });
  } catch {
    return null;
  }
};

const buildPlaybackDerivatives = async (params: {
  originalId: string;
  buffer: Buffer;
  label: string;
}): Promise<NoisegenPlaybackAsset[]> => {
  if (!ensureFfmpegAvailable()) return [];
  const assets: NoisegenPlaybackAsset[] = [];
  const opus = await transcodePlaybackVariant({
    originalId: params.originalId,
    buffer: params.buffer,
    playbackId: "mix-opus",
    label: params.label,
    codec: "opus",
    mime: "audio/ogg",
    originalName: "mix.opus",
    args: [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      "pipe:0",
      "-af",
      PLAYBACK_LIMITER_FILTER,
      "-c:a",
      "libopus",
      "-b:a",
      PLAYBACK_OPUS_BITRATE,
      "-vbr",
      "on",
      "-ac",
      String(MIXDOWN_CHANNELS),
      "-ar",
      String(MIXDOWN_SAMPLE_RATE),
      "-f",
      "ogg",
      "pipe:1",
    ],
  });
  if (opus) assets.push(opus);
  const aac = await transcodePlaybackVariant({
    originalId: params.originalId,
    buffer: params.buffer,
    playbackId: "mix-aac",
    label: params.label,
    codec: "aac",
    mime: "audio/mp4",
    originalName: "mix.m4a",
    args: [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      "pipe:0",
      "-af",
      PLAYBACK_LIMITER_FILTER,
      "-c:a",
      "aac",
      "-b:a",
      PLAYBACK_AAC_BITRATE,
      "-movflags",
      "frag_keyframe+empty_moov",
      "-ac",
      String(MIXDOWN_CHANNELS),
      "-ar",
      String(MIXDOWN_SAMPLE_RATE),
      "-f",
      "mp4",
      "pipe:1",
    ],
  });
  if (aac) assets.push(aac);
  const mp3 = await transcodePlaybackVariant({
    originalId: params.originalId,
    buffer: params.buffer,
    playbackId: "mix-mp3",
    label: params.label,
    codec: "mp3",
    mime: "audio/mpeg",
    originalName: "mix.mp3",
    args: [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      "pipe:0",
      "-af",
      PLAYBACK_LIMITER_FILTER,
      "-c:a",
      "libmp3lame",
      "-b:a",
      PLAYBACK_MP3_BITRATE,
      "-ac",
      String(MIXDOWN_CHANNELS),
      "-ar",
      String(MIXDOWN_SAMPLE_RATE),
      "-f",
      "mp3",
      "pipe:1",
    ],
  });
  if (mp3) assets.push(mp3);
  return assets;
};

const buildPlaybackAssetsFromBuffer = async (params: {
  originalId: string;
  buffer: Buffer;
  mime: string;
  originalName?: string;
  fallbackAsset?: NoisegenOriginalAsset;
}): Promise<NoisegenPlaybackAsset[]> => {
  const label = "Mix";
  const direct = ensurePcm16WavBuffer(params.buffer, params.mime);
  const reuseOriginal =
    !!params.fallbackAsset &&
    !!direct &&
    direct.buffer === params.buffer &&
    direct.format?.sampleRate === MIXDOWN_SAMPLE_RATE &&
    direct.format?.channels === MIXDOWN_CHANNELS;
  const normalized = await normalizePcm16WavBuffer({
    buffer: params.buffer,
    mime: params.mime,
  });
  if (normalized) {
    const playbackAssets: NoisegenPlaybackAsset[] = [];
    if (reuseOriginal && params.fallbackAsset) {
      playbackAssets.push(buildPlaybackFromInstrumental(params.fallbackAsset));
    } else {
      const wavAsset = await savePlaybackAsset({
        originalId: params.originalId,
        playbackId: "mix",
        label,
        codec: "wav",
        buffer: normalized.buffer,
        mime: "audio/wav",
        originalName: "mix.wav",
      });
      playbackAssets.push(wavAsset);
    }
    const derivatives = await buildPlaybackDerivatives({
      originalId: params.originalId,
      buffer: normalized.buffer,
      label,
    });
    playbackAssets.push(...derivatives);
    return playbackAssets;
  }
  if (params.fallbackAsset) {
    return [buildPlaybackFromInstrumental(params.fallbackAsset)];
  }
  const fallback = await savePlaybackAsset({
    originalId: params.originalId,
    playbackId: "mix",
    label,
    codec: resolvePlaybackCodec(params.mime),
    buffer: params.buffer,
    mime: params.mime,
    originalName: params.originalName,
  });
  return [fallback];
};

const buildPlaybackAssetsFromFile = async (params: {
  originalId: string;
  filePath: string;
  mime: string;
  originalName?: string;
  fallbackAsset?: NoisegenOriginalAsset;
}): Promise<NoisegenPlaybackAsset[]> => {
  const buffer = await fs.readFile(params.filePath);
  return buildPlaybackAssetsFromBuffer({
    originalId: params.originalId,
    buffer,
    mime: params.mime,
    originalName: params.originalName,
    fallbackAsset: params.fallbackAsset,
  });
};

const transcodeStemGroupVariant = async (params: {
  originalId: string;
  groupId: string;
  label: string;
  category: string;
  assetId: string;
  codec: NoisegenStemGroupAsset["codec"];
  mime: string;
  originalName: string;
  durationMs?: number;
  sampleRate?: number;
  channels?: number;
  buffer: Buffer;
  args: string[];
}): Promise<NoisegenStemGroupAsset | null> => {
  if (!ensureFfmpegAvailable()) return null;
  try {
    const encoded = await runFfmpeg(params.args, params.buffer);
    return await saveStemGroupAsset({
      originalId: params.originalId,
      assetId: params.assetId,
      groupId: params.groupId,
      label: params.label,
      category: params.category,
      codec: params.codec,
      buffer: encoded,
      mime: params.mime,
      originalName: params.originalName,
      durationMs: params.durationMs,
      sampleRate: params.sampleRate,
      channels: params.channels,
    });
  } catch {
    return null;
  }
};

const buildStemGroupAssetsFromBuffer = async (params: {
  originalId: string;
  groupId: string;
  label: string;
  category: string;
  buffer: Buffer;
  durationMs?: number;
}): Promise<NoisegenStemGroupAsset[]> => {
  const normalized = await normalizePcm16WavBuffer({
    buffer: params.buffer,
    mime: "audio/wav",
  });
  if (!normalized) return [];
  const format = normalized.format!;
  const assets: NoisegenStemGroupAsset[] = [];

  if (ensureFfmpegAvailable()) {
    const opus = await transcodeStemGroupVariant({
      originalId: params.originalId,
      groupId: params.groupId,
      label: params.label,
      category: params.category,
      assetId: `${params.groupId}-opus`,
      codec: "opus",
      mime: "audio/ogg",
      originalName: `${params.groupId}.opus`,
      durationMs: params.durationMs,
      sampleRate: format.sampleRate,
      channels: format.channels,
      buffer: normalized.buffer,
      args: [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-c:a",
        "libopus",
        "-b:a",
        PLAYBACK_OPUS_BITRATE,
        "-vbr",
        "on",
        "-ac",
        String(MIXDOWN_CHANNELS),
        "-ar",
        String(MIXDOWN_SAMPLE_RATE),
        "-f",
        "ogg",
        "pipe:1",
      ],
    });
    if (opus) assets.push(opus);

    const aac = await transcodeStemGroupVariant({
      originalId: params.originalId,
      groupId: params.groupId,
      label: params.label,
      category: params.category,
      assetId: `${params.groupId}-aac`,
      codec: "aac",
      mime: "audio/mp4",
      originalName: `${params.groupId}.m4a`,
      durationMs: params.durationMs,
      sampleRate: format.sampleRate,
      channels: format.channels,
      buffer: normalized.buffer,
      args: [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-c:a",
        "aac",
        "-b:a",
        PLAYBACK_AAC_BITRATE,
        "-movflags",
        "frag_keyframe+empty_moov",
        "-ac",
        String(MIXDOWN_CHANNELS),
        "-ar",
        String(MIXDOWN_SAMPLE_RATE),
        "-f",
        "mp4",
        "pipe:1",
      ],
    });
    if (aac) assets.push(aac);
    const mp3 = await transcodeStemGroupVariant({
      originalId: params.originalId,
      groupId: params.groupId,
      label: params.label,
      category: params.category,
      assetId: `${params.groupId}-mp3`,
      codec: "mp3",
      mime: "audio/mpeg",
      originalName: `${params.groupId}.mp3`,
      durationMs: params.durationMs,
      sampleRate: format.sampleRate,
      channels: format.channels,
      buffer: normalized.buffer,
      args: [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-c:a",
        "libmp3lame",
        "-b:a",
        PLAYBACK_MP3_BITRATE,
        "-ac",
        String(MIXDOWN_CHANNELS),
        "-ar",
        String(MIXDOWN_SAMPLE_RATE),
        "-f",
        "mp3",
        "pipe:1",
      ],
    });
    if (mp3) assets.push(mp3);
  }

  if (assets.length === 0) {
    const wavAsset = await saveStemGroupAsset({
      originalId: params.originalId,
      assetId: `${params.groupId}-wav`,
      groupId: params.groupId,
      label: params.label,
      category: params.category,
      codec: "wav",
      buffer: normalized.buffer,
      mime: "audio/wav",
      originalName: `${params.groupId}.wav`,
      durationMs: params.durationMs,
      sampleRate: format.sampleRate,
      channels: format.channels,
    });
    assets.push(wavAsset);
  }

  return assets;
};

const collectStemGroupAssets = (params: {
  original: NoisegenOriginal;
  categories: string[];
  includeVocal: boolean;
}): MixdownAssetEntry[] => {
  const entries: MixdownAssetEntry[] = [];
  if (params.includeVocal && params.original.assets.vocal) {
    entries.push({ label: "Vocal", asset: params.original.assets.vocal });
    return entries;
  }
  const stems = params.original.assets.stems ?? [];
  for (const stem of stems) {
    const category = stem.category ?? "music";
    if (!params.categories.includes(category)) continue;
    entries.push({ label: stem.name, asset: stem });
  }
  return entries;
};

const buildStemGroupAssets = async (
  original: NoisegenOriginal,
): Promise<NoisegenStemGroupAsset[]> => {
  if (!original.assets.stems?.length && !original.assets.vocal) return [];
  const grouped: NoisegenStemGroupAsset[] = [];
  for (const group of STEM_GROUP_DEFS) {
    const mixAssets = collectStemGroupAssets({
      original,
      categories: group.categories,
      includeVocal: false,
    });
    if (!mixAssets.length) continue;
    const mixdown = await mixdownAssets(mixAssets);
    if (!mixdown) continue;
    const assets = await buildStemGroupAssetsFromBuffer({
      originalId: original.id,
      groupId: group.id,
      label: group.label,
      category: group.id,
      buffer: mixdown.buffer,
      durationMs: mixdown.durationMs,
    });
    grouped.push(...assets);
  }
  if (original.assets.vocal) {
    const mixAssets = collectStemGroupAssets({
      original,
      categories: [],
      includeVocal: true,
    });
    if (mixAssets.length) {
      const mixdown = await mixdownAssets(mixAssets);
      if (mixdown) {
        const assets = await buildStemGroupAssetsFromBuffer({
          originalId: original.id,
          groupId: "vocal",
          label: "Vocal",
          category: "vocal",
          buffer: mixdown.buffer,
          durationMs: mixdown.durationMs,
        });
        grouped.push(...assets);
      }
    }
  }
  return grouped;
};

const buildWaveformSummaryFromBuffer = (
  buffer: Buffer,
  mime?: string,
): {
  peaks: number[];
  durationMs: number;
  loudnessDb?: number;
  sampleRate?: number;
  channels?: number;
} | null => {
  const lower = mime?.toLowerCase() ?? "";
  if (!lower.includes("wav") && !lower.includes("wave")) return null;
  const format = parseWavFormat(buffer);
  if (!format || format.audioFormat !== 1 || format.bitsPerSample !== 16) {
    return null;
  }
  const bytesPerSample = format.bitsPerSample / 8;
  const frameSize = bytesPerSample * format.channels;
  const totalFrames = Math.floor(format.dataSize / frameSize);
  if (totalFrames <= 0 || format.sampleRate <= 0) return null;

  const bucketCount = Math.min(WAVEFORM_BUCKETS, totalFrames);
  const framesPerBucket = Math.max(1, Math.floor(totalFrames / bucketCount));
  const peaks = new Array(bucketCount).fill(0);
  let sumSquares = 0;
  let sampleCount = 0;

  for (let i = 0; i < bucketCount; i += 1) {
    const startFrame = i * framesPerBucket;
    const endFrame =
      i === bucketCount - 1
        ? totalFrames
        : Math.min(totalFrames, (i + 1) * framesPerBucket);
    const bucketFrames = endFrame - startFrame;
    const step = Math.max(
      1,
      Math.floor(bucketFrames / MAX_WAVEFORM_SAMPLES_PER_BUCKET),
    );
    let peak = 0;
    for (let frame = startFrame; frame < endFrame; frame += step) {
      const offset = format.dataOffset + frame * frameSize;
      if (offset + 2 > buffer.length) break;
      const sample = buffer.readInt16LE(offset);
      const normalized = Math.abs(sample) / 32768;
      if (normalized > peak) peak = normalized;
      sumSquares += (sample / 32768) ** 2;
      sampleCount += 1;
    }
    peaks[i] = Number(peak.toFixed(4));
  }

  const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;
  const loudnessDb =
    rms > 0 ? Number((20 * Math.log10(rms)).toFixed(2)) : undefined;
  const durationMs = Math.round((totalFrames / format.sampleRate) * 1000);
  return {
    peaks,
    durationMs,
    loudnessDb,
    sampleRate: format.sampleRate,
    channels: format.channels,
  };
};

const buildWaveformSummaryFromFile = async (
  filePath: string,
  mime?: string,
): Promise<{ peaks: number[]; durationMs: number; loudnessDb?: number } | null> => {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_WAVEFORM_BYTES) return null;
    const buffer = await fs.readFile(filePath);
    return buildWaveformSummaryFromBuffer(buffer, mime);
  } catch {
    return null;
  }
};

const attachWaveformSummary = async (
  asset: {
    waveformPeaks?: number[];
    waveformDurationMs?: number;
    loudnessDb?: number;
    sampleRate?: number;
    channels?: number;
    analysisPath?: string;
  },
  summary: {
    peaks: number[];
    durationMs: number;
    loudnessDb?: number;
    sampleRate?: number;
    channels?: number;
  } | null,
  originalId: string,
  fileName: string,
): Promise<void> => {
  if (!summary) return;
  asset.waveformPeaks = summary.peaks;
  asset.waveformDurationMs = summary.durationMs;
  if (summary.loudnessDb != null) asset.loudnessDb = summary.loudnessDb;
  if (summary.sampleRate != null) asset.sampleRate = summary.sampleRate;
  if (summary.channels != null) asset.channels = summary.channels;
  try {
    const buffer = Buffer.from(JSON.stringify(summary));
    asset.analysisPath = await saveAnalysisArtifact({
      originalId,
      fileName,
      buffer,
    });
  } catch {
    // Analysis artifacts are best-effort.
  }
};

const isOriginalAsset = (
  asset: NoisegenOriginalAsset | NoisegenStemAsset,
): asset is NoisegenOriginalAsset => "kind" in asset;

const readStreamToBuffer = async (
  stream: NodeJS.ReadableStream,
): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const loadAssetBuffer = async (
  asset: NoisegenOriginalAsset | NoisegenStemAsset,
): Promise<Buffer> => {
  if (isReplitStoragePath(asset.path)) {
    const key = resolveReplitStorageKey(asset.path);
    const stream = await downloadReplitObjectStream(key);
    return readStreamToBuffer(stream);
  }
  if (isStorageLocator(asset.path)) {
    const stream = await getBlob(asset.path);
    return readStreamToBuffer(stream);
  }
  const assetPath = isOriginalAsset(asset)
    ? resolveOriginalAssetPath(asset)
    : resolveStemAssetPath(asset);
  return fs.readFile(assetPath);
};

const resolveAssetPath = (
  asset: NoisegenOriginalAsset | NoisegenStemAsset,
): string =>
  isOriginalAsset(asset) ? resolveOriginalAssetPath(asset) : resolveStemAssetPath(asset);

const resolveMixdownInputFiles = async (
  assets: MixdownAssetEntry[],
): Promise<{ files: string[]; tempDir?: string }> => {
  const files: string[] = [];
  let tempDir: string | undefined;
  for (const entry of assets) {
    const asset = entry.asset;
    if (isReplitStoragePath(asset.path) || isStorageLocator(asset.path)) {
      if (!tempDir) {
        tempDir = await fs.mkdtemp(path.join(tmpdir(), "noisegen-mixdown-"));
      }
      const ext = path.extname(asset.fileName || "") || ".wav";
      const filePath = path.join(tempDir, `${randomUUID()}${ext}`);
      const stream = isReplitStoragePath(asset.path)
        ? await downloadReplitObjectStream(resolveReplitStorageKey(asset.path))
        : await getBlob(asset.path);
      await writeStreamToFile(stream, filePath);
      files.push(filePath);
      continue;
    }
    files.push(resolveAssetPath(asset));
  }
  return { files, tempDir };
};

const mixdownAssetsWithFfmpeg = async (
  assets: MixdownAssetEntry[],
): Promise<{ buffer: Buffer; durationMs: number } | null> => {
  if (!ensureFfmpegAvailable() || assets.length === 0) return null;
  const { files, tempDir } = await resolveMixdownInputFiles(assets);
  try {
    if (!files.length) return null;
    const args = [
      "-hide_banner",
      "-loglevel",
      "error",
      ...files.flatMap((file) => ["-i", file]),
      "-filter_complex",
      `amix=inputs=${files.length}:normalize=1,alimiter=limit=${MIXDOWN_PEAK_TARGET}`,
      "-ac",
      String(MIXDOWN_CHANNELS),
      "-ar",
      String(MIXDOWN_SAMPLE_RATE),
      "-c:a",
      "pcm_s16le",
      "-f",
      "wav",
      "pipe:1",
    ];
    const buffer = await runFfmpegWithFiles(args);
    const durationSeconds = estimateDurationSeconds(buffer, "audio/wav");
    return {
      buffer,
      durationMs: Math.max(0, Math.round(durationSeconds * 1000)),
    };
  } catch {
    return null;
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
};

const mixdownAssets = async (
  assets: MixdownAssetEntry[],
): Promise<{ buffer: Buffer; durationMs: number; loudnessDb?: number } | null> => {
  if (assets.length === 0) return null;
  const ffmpegMix = await mixdownAssetsWithFfmpeg(assets);
  if (ffmpegMix) return ffmpegMix;
  const sources: Array<{ label: string; buffer: Buffer; mime: string }> = [];
  for (const entry of assets) {
    sources.push({
      label: entry.label,
      buffer: await loadAssetBuffer(entry.asset),
      mime: entry.asset.mime,
    });
  }
  return mixdownPcm16WavBuffers({ sources });
};

const ensurePcm16WavBuffer = (
  buffer: Buffer,
  mime: string,
): { buffer: Buffer; format: ReturnType<typeof parseWavFormat> } | null => {    
  const lower = mime.toLowerCase();
  if (!lower.includes("wav") && !lower.includes("wave")) return null;
  const format = parseWavFormat(buffer);
  if (!format) return null;
  if (format.audioFormat === 1 && format.bitsPerSample === 16) {
    return { buffer, format };
  }
  if (buffer.byteLength > MAX_JS_WAV_CONVERT_BYTES) {
    return null;
  }
  const converted = convertWavToPcm16(buffer);
  if (!converted) return null;
  const nextFormat = parseWavFormat(converted);
  if (!nextFormat || nextFormat.audioFormat !== 1 || nextFormat.bitsPerSample !== 16) {
    return null;
  }
  return { buffer: converted, format: nextFormat };
};

const buildPcm16WavBuffer = (params: {
  samples: Int16Array;
  sampleRate: number;
  channels: number;
}): Buffer => {
  const dataSize = params.samples.length * 2;
  const blockAlign = params.channels * 2;
  const byteRate = params.sampleRate * blockAlign;
  const output = Buffer.alloc(44 + dataSize);
  output.write("RIFF", 0);
  output.writeUInt32LE(36 + dataSize, 4);
  output.write("WAVE", 8);
  output.write("fmt ", 12);
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(params.channels, 22);
  output.writeUInt32LE(params.sampleRate, 24);
  output.writeUInt32LE(byteRate, 28);
  output.writeUInt16LE(blockAlign, 32);
  output.writeUInt16LE(16, 34);
  output.write("data", 36);
  output.writeUInt32LE(dataSize, 40);
  Buffer.from(
    params.samples.buffer,
    params.samples.byteOffset,
    params.samples.byteLength,
  ).copy(output, 44);
  return output;
};

const mixdownPcm16WavBuffers = async (params: {
  sources: Array<{ label: string; buffer: Buffer; mime: string }>;
}): Promise<{ buffer: Buffer; durationMs: number; loudnessDb?: number } | null> => {
  if (params.sources.length === 0) return null;
  const tracks: Int16Array[] = [];

  for (const source of params.sources) {
    const normalized = await normalizePcm16WavBuffer({
      buffer: source.buffer,
      mime: source.mime,
    });
    if (!normalized) return null;
    const format = normalized.format!;
    const data = normalized.buffer.subarray(
      format.dataOffset,
      format.dataOffset + format.dataSize,
    );
    tracks.push(
      new Int16Array(
        data.buffer,
        data.byteOffset,
        Math.floor(data.byteLength / 2),
      ),
    );
  }

  const maxSamples = Math.max(...tracks.map((track) => track.length));
  const mixed = new Int16Array(maxSamples);
  const gain = 1 / Math.max(1, tracks.length);
  let peak = 0;

  for (let i = 0; i < maxSamples; i += 1) {
    let sum = 0;
    for (const track of tracks) {
      if (i < track.length) {
        sum += track[i];
      }
    }
    const scaled = sum * gain;
    const abs = Math.abs(scaled);
    if (abs > peak) peak = abs;
  }

  const maxAllowed = 32767 * MIXDOWN_PEAK_TARGET;
  const limiterGain = peak > maxAllowed ? maxAllowed / peak : 1;
  let sumSquares = 0;
  let sampleCount = 0;

  for (let i = 0; i < maxSamples; i += 1) {
    let sum = 0;
    for (const track of tracks) {
      if (i < track.length) {
        sum += track[i];
      }
    }
    const scaled = sum * gain * limiterGain;
    const clamped = Math.max(-32768, Math.min(32767, Math.round(scaled)));
    mixed[i] = clamped;
    const normalized = clamped / 32768;
    sumSquares += normalized * normalized;
    sampleCount += 1;
  }

  const durationMs = Math.round(
    (maxSamples / MIXDOWN_CHANNELS / MIXDOWN_SAMPLE_RATE) * 1000,
  );
  const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;
  const loudnessDb =
    rms > 0 ? Number((20 * Math.log10(rms)).toFixed(2)) : undefined;
  return {
    buffer: buildPcm16WavBuffer({
      samples: mixed,
      sampleRate: MIXDOWN_SAMPLE_RATE,
      channels: MIXDOWN_CHANNELS,
    }),
    durationMs,
    loudnessDb,
  };
};

const buildPlaybackFromInstrumental = (
  asset: NoisegenOriginalAsset,
): NoisegenPlaybackAsset => ({
  id: "mix",
  label: "Mix",
  codec: resolvePlaybackCodec(asset.mime),
  fileName: asset.fileName,
  path: asset.path,
  mime: asset.mime,
  bytes: asset.bytes,
  uploadedAt: asset.uploadedAt,
});

type MixdownAssetEntry = {
  label: string;
  asset: NoisegenOriginalAsset | NoisegenStemAsset;
};

const collectMixdownAssets = (original: NoisegenOriginal): MixdownAssetEntry[] => {
  const entries: MixdownAssetEntry[] = [];
  const stems = original.assets.stems ?? [];
  for (const stem of stems) {
    entries.push({ label: stem.name, asset: stem });
  }
  if (original.assets.vocal) {
    entries.push({ label: "Vocal", asset: original.assets.vocal });
  }
  return entries;
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

ensureFfmpegAvailable();

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
  const key = resolveReplitStorageKey(asset.path);
  const rangeHeader = req.headers.range;
  const fileSize = asset.bytes ?? 0;

  const toReplitError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      (error as { status?: number }).status ??
      (error as { statusCode?: number }).statusCode ??
      (error as { response?: { status?: number } }).response?.status;
    const lowered = message.toLowerCase();
    const notFound =
      status === 404 ||
      lowered.includes("not found") ||
      lowered.includes("no such key") ||
      lowered.includes("nosuchkey");
    const wrapped = new Error(message || "replit_download_failed");
    (wrapped as Error & { code?: string }).code = notFound
      ? "replit_not_found"
      : "replit_failed";
    return wrapped;
  };

  const openReplitStream = async () => {
    try {
      return await downloadReplitObjectStream(key);
    } catch (error) {
      throw toReplitError(error);
    }
  };

  if (rangeHeader && fileSize > 0) {
    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    if (match) {
      const start = parseInt(match[1], 10);
      const requestedEnd = match[2] ? parseInt(match[2], 10) : fileSize - 1;
      
      if (
        Number.isNaN(start) ||
        Number.isNaN(requestedEnd) ||
        start > requestedEnd ||
        start >= fileSize
      ) {
        res.setHeader("Content-Range", `bytes */${fileSize}`);
        res.status(416).end();
        return;
      }
      
      const end = Math.min(requestedEnd, fileSize - 1);
      const chunkSize = end - start + 1;

      res.setHeader("Content-Type", asset.mime);
      res.setHeader("Accept-Ranges", "bytes");
      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      res.setHeader("Content-Length", chunkSize);

      if (req.method === "HEAD") {
        res.end();
        return;
      }
      const stream = await openReplitStream();
      let bytesSkipped = 0;
      let bytesSent = 0;
      
      stream.on("data", (chunk: Buffer) => {
        if (bytesSent >= chunkSize) {
          stream.destroy();
          return;
        }
        
        if (bytesSkipped < start) {
          const remaining = start - bytesSkipped;
          if (chunk.length <= remaining) {
            bytesSkipped += chunk.length;
            return;
          }
          chunk = chunk.slice(remaining);
          bytesSkipped = start;
        }
        
        const remainingToSend = chunkSize - bytesSent;
        if (chunk.length > remainingToSend) {
          chunk = chunk.slice(0, remainingToSend);
        }
        
        bytesSent += chunk.length;
        res.write(chunk);
        
        if (bytesSent >= chunkSize) {
          stream.destroy();
          res.end();
        }
      });
      
      stream.on("end", () => {
        if (!res.writableEnded) res.end();
      });
      stream.on("error", (err: Error) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "stream_failed" });
        } else {
          res.destroy();
        }
      });
      return;
    }
  }

  res.setHeader("Content-Type", asset.mime);
  res.setHeader("Accept-Ranges", "bytes");
  if (fileSize > 0) {
    res.setHeader("Content-Length", fileSize);
  }
  if (req.method === "HEAD") {
    res.status(200).end();
    return;
  }
  const stream = await openReplitStream();
  stream.on("error", (err: Error) => {
    console.error("Stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "stream_failed" });
    } else {
      res.destroy();
    }
  });
  stream.pipe(res);
};

const resolveLocalAssetFallback = (
  originalId: string,
  fileName: string,
  subDir?: string,
): string | null => {
  if (!fileName) return null;
  const { originalsDir } = getNoisegenPaths();
  const candidates: string[] = [];
  if (subDir) {
    candidates.push(path.join(originalsDir, originalId, subDir, fileName));
  } else {
    candidates.push(path.join(originalsDir, originalId, fileName));
  }
  for (const root of resolveBundledOriginalsRoots()) {
    candidates.push(
      subDir
        ? path.join(root, originalId, subDir, fileName)
        : path.join(root, originalId, fileName),
    );
  }
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
};

const streamStorageAsset = async (
  req: express.Request,
  res: express.Response,
  asset: { path: string; mime: string; bytes?: number },
) => {
  res.setHeader("Content-Type", asset.mime);
  res.setHeader("Accept-Ranges", "bytes");

  const rangeHeader = req.headers.range;
  const fileSize = asset.bytes ?? 0;

  if (rangeHeader && fileSize > 0) {
    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    if (match) {
      const start = parseInt(match[1], 10);
      const requestedEnd = match[2] ? parseInt(match[2], 10) : fileSize - 1;

      if (
        Number.isNaN(start) ||
        Number.isNaN(requestedEnd) ||
        start > requestedEnd ||
        start >= fileSize
      ) {
        res.setHeader("Content-Range", `bytes */${fileSize}`);
        res.status(416).end();
        return;
      }

      const end = Math.min(requestedEnd, fileSize - 1);
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      res.setHeader("Content-Length", chunkSize);

      if (req.method === "HEAD") {
        res.end();
        return;
      }

      const stream = await getBlob(asset.path, { start, end });
      stream.on("error", (err: Error) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "stream_failed" });
        } else {
          res.destroy();
        }
      });
      stream.pipe(res);
      return;
    }
  }

  if (fileSize > 0) {
    res.setHeader("Content-Length", fileSize);
  }
  if (req.method === "HEAD") {
    res.status(200).end();
    return;
  }
  const stream = await getBlob(asset.path);
  stream.on("error", (err: Error) => {
    console.error("Stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "stream_failed" });
    } else {
      res.destroy();
    }
  });
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
      try {
        await streamReplitAsset(req, res, asset);
        return;
      } catch (error) {
        if ((error as { code?: string })?.code === "replit_not_found") {
          const fallback = resolveLocalAssetFallback(
            original.id,
            asset.fileName,
          );
          if (fallback) {
            return await streamAudioFile(req, res, fallback, asset.mime);
          }
          return res.status(404).json({ error: "asset_missing" });
        }
        throw error;
      }
    }
    if (isStorageLocator(asset.path)) {
      await streamStorageAsset(req, res, asset);
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

const serveNamedOriginalAsset =
  (assetName: string) => async (req: any, res: any) => {
    req.params = { ...req.params, asset: assetName };
    return serveOriginalAsset(req, res);
  };

const servePlaybackAsset = async (req: any, res: any) => {
  try {
    const store = await getNoisegenStore();
    const original = findOriginalById(store, req.params.id);
    if (!original) {
      return res.status(404).json({ error: "not_found" });
    }
    const asset = resolvePlaybackAsset(original, req.params.playbackId ?? "");
    if (!asset) {
      return res.status(404).json({ error: "playback_not_found" });
    }
    if (isReplitStoragePath(asset.path)) {
      try {
        await streamReplitAsset(req, res, asset);
        return;
      } catch (error) {
        if ((error as { code?: string })?.code === "replit_not_found") {
          const fallback = resolveLocalAssetFallback(
            original.id,
            asset.fileName,
            "playback",
          );
          if (fallback) {
            return await streamAudioFile(req, res, fallback, asset.mime);
          }
          return res.status(404).json({ error: "playback_missing" });
        }
        throw error;
      }
    }
    if (isStorageLocator(asset.path)) {
      await streamStorageAsset(req, res, asset);
      return;
    }

    const assetPath = resolvePlaybackAssetPath(asset);
    try {
      await fs.access(assetPath);
    } catch {
      return res.status(404).json({ error: "playback_missing" });
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
      error: "playback_fetch_failed",
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
      try {
        await streamReplitAsset(req, res, stem);
        return;
      } catch (error) {
        if ((error as { code?: string })?.code === "replit_not_found") {
          const fallback = resolveLocalAssetFallback(
            original.id,
            stem.fileName,
            "stems",
          );
          if (fallback) {
            return await streamAudioFile(req, res, fallback, stem.mime);
          }
          return res.status(404).json({ error: "stem_missing" });
        }
        throw error;
      }
    }
    if (isStorageLocator(stem.path)) {
      await streamStorageAsset(req, res, stem);
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

const serveStemGroupAsset = async (req: any, res: any) => {
  try {
    const store = await getNoisegenStore();
    const original = findOriginalById(store, req.params.id);
    if (!original) {
      return res.status(404).json({ error: "not_found" });
    }
    const asset = resolveStemGroupAsset(original, req.params.groupId ?? "");
    if (!asset) {
      return res.status(404).json({ error: "stem_group_not_found" });
    }
    if (isReplitStoragePath(asset.path)) {
      try {
        await streamReplitAsset(req, res, asset);
        return;
      } catch (error) {
        if ((error as { code?: string })?.code === "replit_not_found") {
          const fallback = resolveLocalAssetFallback(
            original.id,
            asset.fileName,
            "stem-groups",
          );
          if (fallback) {
            return await streamAudioFile(req, res, fallback, asset.mime);
          }
          return res.status(404).json({ error: "stem_group_missing" });
        }
        throw error;
      }
    }
    if (isStorageLocator(asset.path)) {
      await streamStorageAsset(req, res, asset);
      return;
    }

    const assetPath = resolveStemGroupAssetPath(asset);
    try {
      await fs.access(assetPath);
    } catch {
      return res.status(404).json({ error: "stem_group_missing" });
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
      error: "stem_group_fetch_failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

router.get("/originals/:id/:asset", serveOriginalAsset);
router.head("/originals/:id/:asset", serveOriginalAsset);
router.get("/audio/originals/:id/:asset", serveOriginalAsset);
router.head("/audio/originals/:id/:asset", serveOriginalAsset);
router.get("/originals/:id/playback/:playbackId", servePlaybackAsset);
router.head("/originals/:id/playback/:playbackId", servePlaybackAsset);
router.get("/audio/originals/:id/playback/:playbackId", servePlaybackAsset);
router.head("/audio/originals/:id/playback/:playbackId", servePlaybackAsset);
router.get("/originals/:id/stems/:stemId", serveStemAsset);
router.head("/originals/:id/stems/:stemId", serveStemAsset);
router.get("/audio/originals/:id/stems/:stemId", serveStemAsset);
router.head("/audio/originals/:id/stems/:stemId", serveStemAsset);
router.get("/originals/:id/stem-groups/:groupId", serveStemGroupAsset);
router.head("/originals/:id/stem-groups/:groupId", serveStemGroupAsset);
router.get("/audio/originals/:id/stem-groups/:groupId", serveStemGroupAsset);
router.head("/audio/originals/:id/stem-groups/:groupId", serveStemGroupAsset);
router.get(
  "/api/noise-gens/originals/:id/instrumental",
  serveNamedOriginalAsset("instrumental"),
);
router.head(
  "/api/noise-gens/originals/:id/instrumental",
  serveNamedOriginalAsset("instrumental"),
);
router.get(
  "/api/noise-gens/originals/:id/vocal",
  serveNamedOriginalAsset("vocal"),
);
router.head(
  "/api/noise-gens/originals/:id/vocal",
  serveNamedOriginalAsset("vocal"),
);
router.get(
  "/api/noise-gens/originals/:id/playback/:playbackId",
  servePlaybackAsset,
);
router.head(
  "/api/noise-gens/originals/:id/playback/:playbackId",
  servePlaybackAsset,
);
router.get("/api/noise-gens/originals/:id/stems/:stemId", serveStemAsset);
router.head("/api/noise-gens/originals/:id/stems/:stemId", serveStemAsset);
router.get(
  "/api/noise-gens/originals/:id/stem-groups/:groupId",
  serveStemGroupAsset,
);
router.head(
  "/api/noise-gens/originals/:id/stem-groups/:groupId",
  serveStemGroupAsset,
);

router.get("/api/noise-gens/originals", async (req, res) => {
  res.set("Cache-Control", "no-store");
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
      uploadedAt: original.uploadedAt,
      processing: original.processing ?? undefined,
    })),
  );
});

router.get("/api/noise-gens/originals/pending", async (req, res) => {
  res.set("Cache-Control", "no-store");
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
      processing: original.processing ?? undefined,
    })),
  );
});

router.get("/api/noise-gens/originals/:id", async (req, res) => {
  const store = await getNoisegenStore();
  const original = findOriginalById(store, req.params.id ?? "");
  if (!original) {
    console.warn("[noise-gens] original not found", {
      id: req.params.id,
      originals: store.originals.length,
      pending: store.pendingOriginals.length,
    });
    return res.status(404).json({ error: "not_found" });
  }
  const isPending = store.pendingOriginals.some(
    (entry) => entry.id.toLowerCase() === original.id.toLowerCase(),
  );
  const playbackAssets = original.assets.playback ?? [];
  const playbackFallback = original.assets.instrumental
    ? {
        id: "instrumental",
        label: "Mix",
        codec: resolvePlaybackCodec(original.assets.instrumental.mime),
        mime: original.assets.instrumental.mime,
        size: original.assets.instrumental.bytes,
        uploadedAt: original.assets.instrumental.uploadedAt,
        url: buildOriginalAssetUrl(original.id, "instrumental"),
      }
    : null;
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
    processing: original.processing ?? undefined,
    intentSnapshot: original.intentSnapshot ?? undefined,
    intentSnapshotPreferences: original.intentSnapshotPreferences ?? undefined,
    intentContract: original.intentContract ?? undefined,
    playback: playbackAssets.length
      ? playbackAssets.map((asset) => ({
          id: asset.id,
          label: asset.label,
          codec: asset.codec,
          mime: asset.mime,
          size: asset.bytes,
          uploadedAt: asset.uploadedAt,
          url: buildOriginalAssetUrl(
            original.id,
            `playback/${encodeURIComponent(asset.id)}`,
          ),
        }))
      : playbackFallback
        ? [playbackFallback]
        : [],
  });
});

router.put("/api/noise-gens/originals/:id/meta", async (req, res) => {
  const store = await getNoisegenStore();
  const original = findOriginalById(store, req.params.id ?? "");
  if (!original) {
    return res.status(404).json({ error: "not_found" });
  }
  const titleField = readStringField(req.body?.title);
  const creatorField = readStringField(req.body?.creator);
  const notesField = readStringField(req.body?.notes);
  const offsetMsRaw = readStringField(req.body?.offsetMs);
  const offsetMs = Number.isFinite(Number(offsetMsRaw))
    ? clampNumber(Number(offsetMsRaw), -2000, 2000, original.offsetMs ?? 0)
    : original.offsetMs ?? 0;

  let tempo: z.infer<typeof tempoMetaSchema> | undefined;
  if (req.body?.tempo != null) {
    const tempoValidation = tempoMetaSchema.safeParse(req.body.tempo);
    if (!tempoValidation.success) {
      return res
        .status(400)
        .json({ error: "invalid_tempo", issues: tempoValidation.error.issues });
    }
    tempo = tempoValidation.data;
  }

  let timeSky: z.infer<typeof timeSkySchema> | undefined;
  if (req.body?.timeSky != null) {
    const timeSkyValidation = timeSkySchema.safeParse(req.body.timeSky);
    if (!timeSkyValidation.success) {
      return res.status(400).json({
        error: "invalid_time_sky",
        issues: timeSkyValidation.error.issues,
      });
    }
    timeSky = timeSkyValidation.data;
  }

  const intentContractParsed = parseIntentContractField(
    req.body?.intentContract,
  );
  if ("error" in intentContractParsed) {
    return res.status(400).json(intentContractParsed.error);
  }
  const intentContract = intentContractParsed.contract;

  const title = titleField?.trim() || original.title;
  const creator = creatorField?.trim() || original.artist;
  if (!title) {
    return res.status(400).json({ error: "title_required" });
  }
  if (!creator) {
    return res.status(400).json({ error: "creator_required" });
  }

  await upsertOriginalRecord({
    trackId: original.id,
    title,
    creator,
    durationSeconds: original.duration ?? 1,
    offsetMs,
    tempo: tempo ?? original.tempo,
    notes: notesField?.trim() || original.notes,
    timeSky: timeSky ?? original.timeSky,
    intentSnapshot: original.intentSnapshot,
    intentSnapshotPreferences: original.intentSnapshotPreferences,
    intentContract: intentContract ?? original.intentContract,
  });

  return res.json({
    id: original.id,
    title,
    creator,
    tempo: tempo ?? original.tempo,
    notes: notesField?.trim() || original.notes,
    timeSky: timeSky ?? original.timeSky,
  });
});

router.put(
  "/api/noise-gens/originals/:id/intent-snapshot-preferences",
  async (req, res) => {
    const store = await getNoisegenStore();
    const original = findOriginalById(store, req.params.id ?? "");
    if (!original) {
      return res.status(404).json({ error: "not_found" });
    }
    const payload = req.body?.intentSnapshotPreferences;
    let intentSnapshotPreferences: IntentSnapshotPreferences | null = null;
    if (payload == null) {
      intentSnapshotPreferences = null;
    } else {
      const validation = intentSnapshotPreferencesSchema.safeParse(payload);
      if (!validation.success) {
        return res.status(400).json({
          error: "invalid_intent_snapshot_preferences",
          issues: validation.error.issues,
        });
      }
      intentSnapshotPreferences = validation.data;
    }
    await upsertOriginalRecord({
      trackId: original.id,
      title: original.title,
      creator: original.artist,
      durationSeconds: original.duration,
      offsetMs: original.offsetMs ?? 0,
      tempo: original.tempo,
      notes: original.notes,
      timeSky: original.timeSky,
      processing: original.processing,
      intentSnapshot: original.intentSnapshot,
      intentSnapshotPreferences:
        intentSnapshotPreferences === null
          ? undefined
          : intentSnapshotPreferences,
      intentContract: original.intentContract ?? null,
    });
    return res.json({
      id: original.id,
      intentSnapshotPreferences:
        intentSnapshotPreferences === null
          ? null
          : intentSnapshotPreferences,
    });
  },
);

router.get("/api/noise-gens/originals/:id/lyrics", async (req, res) => {
  const store = await getNoisegenStore();
  const original = findOriginalById(store, req.params.id ?? "");
  if (!original) {
    return res.status(404).json({ error: "not_found" });
  }
  return res.json({
    id: original.id,
    lyrics: original.notes ?? "",
  });
});

router.put("/api/noise-gens/originals/:id/lyrics", async (req, res) => {
  const lyrics = readStringField(req.body?.lyrics).trim();
  const store = await getNoisegenStore();
  const original = findOriginalById(store, req.params.id ?? "");
  if (!original) {
    return res.status(404).json({ error: "not_found" });
  }
  await upsertOriginalRecord({
    trackId: original.id,
    title: original.title,
    creator: original.artist,
    durationSeconds: original.duration,
    offsetMs: original.offsetMs ?? 0,
    tempo: original.tempo,
    notes: lyrics || undefined,
    timeSky: original.timeSky,
    processing: original.processing,
    intentSnapshot: original.intentSnapshot,
  });
  return res.json({
    id: original.id,
    lyrics,
  });
});

router.get("/api/noise-gens/originals/:id/intent-contract", async (req, res) => {
  const store = await getNoisegenStore();
  const original = findOriginalById(store, req.params.id ?? "");
  if (!original) {
    return res.status(404).json({ error: "not_found" });
  }
  return res.json({
    id: original.id,
    intentContract: original.intentContract ?? null,
  });
});

router.put("/api/noise-gens/originals/:id/intent-contract", async (req, res) => {
  const store = await getNoisegenStore();
  const original = findOriginalById(store, req.params.id ?? "");
  if (!original) {
    return res.status(404).json({ error: "not_found" });
  }
  const payload = req.body?.intentContract;
  let intentContract: z.infer<typeof intentContractSchema> | null = null;
  if (payload != null) {
    let parsed: unknown = payload;
    if (typeof payload === "string") {
      try {
        parsed = JSON.parse(payload);
      } catch {
        return res.status(400).json({ error: "invalid_intent_contract_json" });
      }
    }
    const validation = intentContractSchema.safeParse(parsed);
    if (!validation.success) {
      return res.status(400).json({
        error: "invalid_intent_contract",
        issues: validation.error.issues,
      });
    }
    intentContract = validation.data;
  }
  await upsertOriginalRecord({
    trackId: original.id,
    title: original.title,
    creator: original.artist,
    durationSeconds: original.duration,
    offsetMs: original.offsetMs ?? 0,
    tempo: original.tempo,
    notes: original.notes,
    timeSky: original.timeSky,
    processing: original.processing,
    intentSnapshot: original.intentSnapshot,
    intentContract,
  });
  return res.json({
    id: original.id,
    intentContract: intentContract ?? null,
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
      waveformPeaks: stem.waveformPeaks ?? undefined,
      waveformDurationMs: stem.waveformDurationMs ?? undefined,
      sampleRate: stem.sampleRate ?? undefined,
      channels: stem.channels ?? undefined,
      url: buildOriginalAssetUrl(
        original.id,
        `stems/${encodeURIComponent(stem.id)}`,
      ),
    })),
  });
});

router.get("/api/noise-gens/originals/:id/stem-pack", async (req, res) => {
  const store = await getNoisegenStore();
  const original = findOriginalById(store, req.params.id ?? "");
  if (!original) {
    return res.status(404).json({ error: "not_found" });
  }
  const groupAssets = original.assets.stemGroups ?? [];
  const grouped = new Map<
    string,
    {
      id: string;
      label: string;
      category: string;
      durationMs?: number;
      sampleRate?: number;
      channels?: number;
      sources: Array<{
        id: string;
        codec: NoisegenStemGroupAsset["codec"];
        mime: string;
        size: number;
        uploadedAt: number;
        url: string;
      }>;
    }
  >();
  for (const asset of groupAssets) {
    const existing = grouped.get(asset.groupId);
    const entry =
      existing ??
      {
        id: asset.groupId,
        label: asset.label,
        category: asset.category,
        durationMs: asset.durationMs,
        sampleRate: asset.sampleRate,
        channels: asset.channels,
        sources: [],
      };
    entry.sources.push({
      id: asset.id,
      codec: asset.codec,
      mime: asset.mime,
      size: asset.bytes,
      uploadedAt: asset.uploadedAt,
      url: buildOriginalAssetUrl(
        original.id,
        `stem-groups/${encodeURIComponent(asset.id)}`,
      ),
    });
    grouped.set(asset.groupId, entry);
  }
  const codecPriority: Record<string, number> = {
    aac: 0,
    opus: 1,
    mp3: 2,
    wav: 3,
  };
  const groups = Array.from(grouped.values()).map((group) => ({
    ...group,
    defaultGain: 1,
    offsetMs: 0,
    sources: group.sources.sort(
      (a, b) =>
        (codecPriority[a.codec] ?? 99) - (codecPriority[b.codec] ?? 99),
    ),
  }));

  const stems = original.assets.stems ?? [];
  return res.json({
    processing: original.processing ?? undefined,
    groups,
    stems: stems.map((stem) => ({
      id: stem.id,
      name: stem.name,
      category: stem.category ?? undefined,
      mime: stem.mime,
      size: stem.bytes,
      uploadedAt: stem.uploadedAt,
      waveformDurationMs: stem.waveformDurationMs ?? undefined,
      sampleRate: stem.sampleRate ?? undefined,
      channels: stem.channels ?? undefined,
      defaultGain: 1,
      offsetMs: 0,
      url: buildOriginalAssetUrl(
        original.id,
        `stems/${encodeURIComponent(stem.id)}`,
      ),
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

router.get("/api/noise-gens/capabilities", (_req, res) => {
  const ffmpeg = ensureFfmpegAvailable();
  const codecs = ["wav"];
  if (ffmpeg) {
    codecs.push("aac", "opus", "mp3");
  }
  const storeBackend = resolveNoisegenStoreBackend();
  const storageBackend = resolveNoisegenStorageBackend();
  const storageDriver =
    storageBackend === "storage" &&
    (process.env.STORAGE_BACKEND ?? "fs").toLowerCase() === "s3"
      ? "s3"
      : storageBackend === "storage"
        ? "fs"
        : undefined;
  return res.json({
    ffmpeg,
    codecs,
    store: { backend: storeBackend },
    storage: {
      backend: storageBackend,
      ...(storageDriver ? { driver: storageDriver } : {}),
    },
  });
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

router.put("/api/noise-gens/recipes/:id", async (req, res) => {
  const id = String(req.params.id ?? "").trim();
  if (!id) return res.status(400).json({ error: "recipe_id_required" });
  const parsed = recipeUpdateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "invalid_request", issues: parsed.error.issues });
  }
  let updated: NoisegenRecipe | null = null;
  await updateNoisegenStore((next) => {
    const recipes = next.recipes ?? [];
    const index = recipes.findIndex((entry) => entry.id === id);
    if (index === -1) return next;
    const current = recipes[index];
    const parentIdRaw = parsed.data.parentId;
    const parentId =
      parentIdRaw === null ? undefined : parentIdRaw?.trim() || undefined;
    if (parentId && parentId === current.id) {
      return next;
    }
    if (parentId && !recipes.some((entry) => entry.id === parentId)) {
      return next;
    }
    const nextRecipe: NoisegenRecipe = {
      ...current,
      name: parsed.data.name?.trim() || current.name,
      notes:
        typeof parsed.data.notes === "string"
          ? parsed.data.notes.trim() || undefined
          : current.notes,
      featured:
        typeof parsed.data.featured === "boolean"
          ? parsed.data.featured
          : current.featured,
      parentId: parentId ?? current.parentId,
      metrics: parsed.data.metrics ?? current.metrics,
      updatedAt: Date.now(),
    };
    recipes[index] = nextRecipe;
    updated = nextRecipe;
    next.recipes = recipes;
    return next;
  });
  if (!updated) {
    return res.status(404).json({ error: "recipe_not_found" });
  }
  return res.json(updated);
});

router.post("/api/noise-gens/recipes", async (req, res) => {
  const parsed = recipeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "invalid_request", issues: parsed.error.issues });
  }
  const now = Date.now();
  const store = await getNoisegenStore();
  const parentId = parsed.data.parentId?.trim();
  if (parentId && !store.recipes?.some((entry) => entry.id === parentId)) {
    return res.status(400).json({ error: "parent_recipe_not_found" });
  }
  const original = findOriginalById(store, parsed.data.coverRequest.originalId);
  const contract = original?.intentContract ?? null;
  const intentState = createIntentEnforcementState();
  const enforcedRequest = enforceIntentContractOnRequest(
    parsed.data.coverRequest,
    contract,
    intentState,
  );
  if (parsed.data.coverRequest.renderPlan) {
    enforcedRequest.renderPlan = enforceIntentContractOnRenderPlan(
      parsed.data.coverRequest.renderPlan,
      contract,
      intentState,
    );
  }
  const intentMeta = finalizeIntentMeta(intentState, contract);
  if (intentMeta.violations.length) {
    console.warn(
      "[noise-gens] intent violations on recipe",
      parsed.data.coverRequest.originalId,
      intentMeta.violations,
    );
  }
  const ideologyReceipt = await buildIdeologyReceipt(contract);
  const provenanceReceipt = buildProvenanceReceipt(
    original?.timeSky,
    contract?.provenancePolicy,
  );
  const planMeta = enforcedRequest.planMeta;
  const toolsReceipt =
    planMeta &&
    (planMeta.plannerVersion ||
      planMeta.modelVersion != null ||
      (planMeta.toolVersions && Object.keys(planMeta.toolVersions).length > 0))
      ? {
          plannerVersion: planMeta.plannerVersion,
          modelVersion:
            planMeta.modelVersion != null
              ? String(planMeta.modelVersion)
              : undefined,
          toolVersions:
            planMeta.toolVersions && Object.keys(planMeta.toolVersions).length > 0
              ? planMeta.toolVersions
              : undefined,
        }
      : undefined;
  const receipt: NoisegenEditionReceipt = {
    createdAt: now,
    ...(contract
      ? {
          contract: {
            version: contract.version,
            hash: intentMeta.contractHash,
            intentSimilarity: intentMeta.intentSimilarity,
            ...(intentMeta.violations.length
              ? { violations: intentMeta.violations }
              : {}),
          },
        }
      : {}),
    ...(ideologyReceipt ? { ideology: ideologyReceipt } : {}),
    ...(provenanceReceipt ? { provenance: provenanceReceipt } : {}),
    ...(toolsReceipt ? { tools: toolsReceipt } : {}),
  };
  const recipe = {
    id: randomUUID(),
    name: parsed.data.name.trim(),
    originalId: parsed.data.coverRequest.originalId,
    createdAt: now,
    updatedAt: now,
    seed: parsed.data.seed,
    coverRequest: enforcedRequest,
    notes: parsed.data.notes?.trim() || undefined,
    featured: parsed.data.featured ?? false,
    parentId: parentId ?? undefined,
    metrics: parsed.data.metrics,
    receipt,
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
    { name: "intent", maxCount: 1 },
  ]),
  async (req, res) => {
    const title = readStringField(req.body?.title);
    const creator = readStringField(req.body?.creator);
    const notes = readStringField(req.body?.notes);
    const existingOriginalId = readStringField(req.body?.existingOriginalId);
    const offsetMsRaw = readStringField(req.body?.offsetMs);
    const offsetMs = clampNumber(Number(offsetMsRaw), -2000, 2000, 0);
    const storeSnapshot = existingOriginalId
      ? await getNoisegenStore()
      : null;
    const existingSnapshot = existingOriginalId
      ? findOriginalById(storeSnapshot, existingOriginalId)
      : undefined;

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
    const intentFile = files?.intent?.[0];
    const hasUploads = Boolean(
      instrumental || vocal || stems.length > 0 || intentFile,
    );
    if (!hasUploads) {
      return res.status(400).json({ error: "files_required" });
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
    const intentContractParsed = parseIntentContractField(
      req.body?.intentContract,
    );
    if ("error" in intentContractParsed) {
      return res.status(400).json(intentContractParsed.error);
    }
    const intentContract = intentContractParsed.contract;

    const trackId = existingOriginalId || randomUUID();
    const now = Date.now();
    const instrumentalPayload = instrumental
      ? resolveUploadAudio(instrumental)
      : null;
    const vocalPayload = vocal ? resolveUploadAudio(vocal) : null;
    const intentSnapshot = intentFile
      ? await parseAbletonIntentSnapshot({
          buffer: Buffer.from(intentFile.buffer),
          fileName: intentFile.originalname,
        })
      : undefined;
    const intentSnapshotPreferences = buildIntentSnapshotPreferences({
      applyTempo: readBooleanField(req.body?.intentApplyTempo),
      applyMix: readBooleanField(req.body?.intentApplyMix),
      applyAutomation: readBooleanField(req.body?.intentApplyAutomation),
      hasSnapshot: Boolean(intentSnapshot),
    });
    const stemPayloads = stems.length
      ? (() => {
          const used = new Set<string>(
            existingSnapshot?.assets.stems?.map((stem) => stem.id) ?? [],
          );
          return stems.map((stem, index) => {
            const displayName =
              normalizeStemName(stem.originalname) || `stem-${index + 1}`;
            const stemId = buildStemId(displayName, used);
            const category = normalizeStemCategory(stemCategories[index]);
            const payload = resolveUploadAudio(stem);
            return {
              stem,
              stemId,
              displayName,
              category,
              payload,
              summary: buildWaveformSummaryFromBuffer(
                payload.buffer,
                payload.mime,
              ),
            };
          });
        })()
      : [];

    const instrumentalSummary = instrumentalPayload
      ? buildWaveformSummaryFromBuffer(
          instrumentalPayload.buffer,
          instrumentalPayload.mime,
        )
      : null;
    const vocalSummary = vocalPayload
      ? buildWaveformSummaryFromBuffer(vocalPayload.buffer, vocalPayload.mime)
      : null;

    const durationSeconds = (() => {
      if (instrumentalSummary?.durationMs) {
        return instrumentalSummary.durationMs / 1000;
      }
      if (stemPayloads[0]?.summary?.durationMs) {
        return stemPayloads[0].summary.durationMs / 1000;
      }
      if (vocalSummary?.durationMs) {
        return vocalSummary.durationMs / 1000;
      }
      const durationSource = instrumental ?? stems[0] ?? vocal;
      return durationSource
        ? estimateDurationSeconds(durationSource.buffer, durationSource.mimetype)
        : 0;
    })();

    const instrumentalAsset = instrumentalPayload
      ? await saveOriginalAsset({
          originalId: trackId,
          kind: "instrumental",
          ...instrumentalPayload,
          originalName: instrumental?.originalname,
        })
      : undefined;
    if (instrumentalAsset) {
      await attachWaveformSummary(
        instrumentalAsset,
        instrumentalSummary,
        trackId,
        "instrumental-waveform.json",
      );
    }

    const vocalAsset = vocalPayload
      ? await saveOriginalAsset({
          originalId: trackId,
          kind: "vocal",
          ...vocalPayload,
          originalName: vocal?.originalname,
        })
      : undefined;
    if (vocalAsset) {
      await attachWaveformSummary(
        vocalAsset,
        vocalSummary,
        trackId,
        "vocal-waveform.json",
      );
    }

    const stemAssets = stemPayloads.length
      ? await Promise.all(
          stemPayloads.map(async (entry) => {
            const asset = await saveStemAsset({
              originalId: trackId,
              stemId: entry.stemId,
              stemName: entry.displayName,
              category: entry.category,
              ...entry.payload,
              originalName: entry.stem.originalname,
            });
            await attachWaveformSummary(
              asset,
              entry.summary,
              trackId,
              `stem-${entry.stemId}-waveform.json`,
            );
            return asset;
          }),
        )
      : [];

    const playbackAssets: NoisegenPlaybackAsset[] = [];
    if (instrumentalPayload) {
      const assets = await buildPlaybackAssetsFromBuffer({
        originalId: trackId,
        buffer: instrumentalPayload.buffer,
        mime: instrumentalPayload.mime,
        originalName: instrumental?.originalname,
        fallbackAsset: instrumentalAsset,
      });
      playbackAssets.push(...assets);
    }

    const processing: NoisegenProcessingState | undefined =
      playbackAssets.length > 0
        ? {
            status: "ready",
            detail: resolvePlaybackReadyDetail(playbackAssets),
            updatedAt: now,
          }
        : existingSnapshot?.processing?.status === "ready"
          ? existingSnapshot.processing
          : {
              status: "processing",
              detail: "awaiting mixdown for playback",
              updatedAt: now,
            };

    await upsertOriginalRecord({
      trackId,
      title,
      creator,
      durationSeconds,
      offsetMs,
      tempo,
      notes: notes || undefined,
      timeSky,
      intentSnapshot,
      intentSnapshotPreferences,
      intentContract,
      instrumentalAsset,
      vocalAsset,
      stemAssets,
      playbackAssets,
      processing,
    });

    return res.json({ trackId });
  },
);

router.post("/api/noise-gens/upload/chunk", upload.single("chunk"), async (req, res) => {
  const title = readStringField(req.body?.title);
  const creator = readStringField(req.body?.creator);
  const existingOriginalId = readStringField(req.body?.existingOriginalId);
  const trackId = existingOriginalId || readStringField(req.body?.trackId);
  const offsetMsRaw = readStringField(req.body?.offsetMs);
  const offsetMs = clampNumber(Number(offsetMsRaw), -2000, 2000, 0);

  if (!title) {
    return res.status(400).json({ error: "title_required" });
  }
  if (!creator) {
    return res.status(400).json({ error: "creator_required" });
  }
  if (!trackId) {
    return res.status(400).json({ error: "track_id_required" });
  }

  const chunkFile = req.file;
  if (!chunkFile) {
    return res.status(400).json({ error: "chunk_required" });
  }

  const chunkIndex = Number(readStringField(req.body?.chunkIndex));
  const chunkCount = Number(readStringField(req.body?.chunkCount));
  if (!Number.isFinite(chunkIndex) || chunkIndex < 0) {
    return res.status(400).json({ error: "invalid_chunk_index" });
  }
  if (!Number.isFinite(chunkCount) || chunkCount < 1) {
    return res.status(400).json({ error: "invalid_chunk_count" });
  }
  if (chunkIndex >= chunkCount) {
    return res.status(400).json({ error: "chunk_index_out_of_range" });
  }

  const fileId = readStringField(req.body?.fileId);
  if (!fileId) {
    return res.status(400).json({ error: "file_id_required" });
  }
  const fileName = readStringField(req.body?.fileName) || chunkFile.originalname;
  const kindRaw = readStringField(req.body?.kind).toLowerCase();
  const kind =
    kindRaw === "instrumental" ||
    kindRaw === "vocal" ||
    kindRaw === "stem" ||
    kindRaw === "intent"
      ? kindRaw
      : null;
  if (!kind) {
    return res.status(400).json({ error: "invalid_kind" });
  }
  const stemCategory = normalizeStemCategoryValue(readStringField(req.body?.stemCategory));

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
  const intentContractParsed = parseIntentContractField(
    req.body?.intentContract,
  );
  if ("error" in intentContractParsed) {
    return res.status(400).json(intentContractParsed.error);
  }
  const intentContract = intentContractParsed.contract;

  const notes = readStringField(req.body?.notes);
  const { baseDir } = getNoisegenPaths();
  const uploadDir = path.join(baseDir, "uploads", trackId, fileId);
  await fs.mkdir(uploadDir, { recursive: true });
  const partName = `part-${String(Math.floor(chunkIndex)).padStart(6, "0")}`;
  const partPath = path.join(uploadDir, partName);
  await fs.writeFile(partPath, chunkFile.buffer);

  const metaPath = path.join(uploadDir, "meta.json");
  await fs.writeFile(
    metaPath,
    JSON.stringify(
      {
        fileName,
        kind,
        stemCategory: stemCategory ?? null,
        chunkCount: Math.floor(chunkCount),
      },
      null,
      2,
    ),
    "utf8",
  );

  const partFiles = (await fs.readdir(uploadDir)).filter((entry) =>
    entry.startsWith("part-"),
  );
  if (partFiles.length < chunkCount) {
    return res.json({ trackId, complete: false });
  }

  partFiles.sort();
  const assembledPath = path.join(uploadDir, "assembled");
  const writeStream = createWriteStream(assembledPath);
  for (const part of partFiles) {
    const sourcePath = path.join(uploadDir, part);
    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(sourcePath);
      stream.on("error", reject);
      stream.on("end", resolve);
      stream.pipe(writeStream, { end: false });
    });
  }
  await new Promise<void>((resolve, reject) => {
    writeStream.on("error", reject);
    writeStream.on("finish", resolve);
    writeStream.end();
  });

  const mime =
    chunkFile.mimetype &&
    chunkFile.mimetype !== "application/octet-stream" &&
    chunkFile.mimetype !== "binary/octet-stream"
      ? chunkFile.mimetype
      : mimeFromName(fileName);
  const storeSnapshot = await getNoisegenStore();
  const existingSnapshot = findOriginalById(storeSnapshot, trackId);
  if (kind === "intent") {
    const buffer = await fs.readFile(assembledPath);
    const intentSnapshot = await parseAbletonIntentSnapshot({
      buffer,
      fileName,
    });
    const intentSnapshotPreferences = buildIntentSnapshotPreferences({
      applyTempo: readBooleanField(req.body?.intentApplyTempo),
      applyMix: readBooleanField(req.body?.intentApplyMix),
      applyAutomation: readBooleanField(req.body?.intentApplyAutomation),
      hasSnapshot: Boolean(intentSnapshot),
    });
    await upsertOriginalRecord({
      trackId,
      title,
      creator,
      durationSeconds: existingSnapshot?.duration ?? 1,
      offsetMs,
      tempo,
      notes: notes || undefined,
      timeSky,
      intentSnapshot,
      intentSnapshotPreferences,
      intentContract,
    });
    await fs.rm(uploadDir, { recursive: true, force: true });
    return res.json({ trackId, complete: true });
  }
  let finalPath = assembledPath;
  try {
    const stats = await fs.stat(assembledPath);
    if (stats.size <= MAX_WAV_NORMALIZE_BYTES) {
      const normalized = await normalizeWavFile(assembledPath, mime);
      if (normalized) {
        finalPath = assembledPath;
      }
    }
  } catch {
    // Leave as-is if normalization fails.
  }
  const waveformSummary = await buildWaveformSummaryFromFile(finalPath, mime);

  const usedIds = new Set<string>();
  existingSnapshot?.assets.stems?.forEach((stem) => usedIds.add(stem.id));

  let instrumentalAsset: NoisegenOriginalAsset | undefined;
  let vocalAsset: NoisegenOriginalAsset | undefined;
  let stemAssets: NoisegenStemAsset[] | undefined;
  const playbackAssets: NoisegenPlaybackAsset[] = [];
  if (kind === "instrumental") {
    instrumentalAsset = await saveOriginalAssetFromFile({
      originalId: trackId,
      kind: "instrumental",
      filePath: finalPath,
      mime,
      originalName: fileName,
    });
    await attachWaveformSummary(
      instrumentalAsset,
      waveformSummary,
      trackId,
      "instrumental-waveform.json",
    );
    const assets = await buildPlaybackAssetsFromFile({
      originalId: trackId,
      filePath: finalPath,
      mime,
      originalName: fileName,
      fallbackAsset: instrumentalAsset,
    });
    playbackAssets.push(...assets);
  } else if (kind === "vocal") {
    vocalAsset = await saveOriginalAssetFromFile({
      originalId: trackId,
      kind: "vocal",
      filePath: finalPath,
      mime,
      originalName: fileName,
    });
    await attachWaveformSummary(
      vocalAsset,
      waveformSummary,
      trackId,
      "vocal-waveform.json",
    );
  } else {
    const displayName = normalizeStemName(fileName);
    const stemId = buildStemId(displayName, usedIds);
    stemAssets = [
      await saveStemAssetFromFile({
        originalId: trackId,
        stemId,
        stemName: displayName,
        category: stemCategory,
        filePath: finalPath,
        mime,
        originalName: fileName,
      }),
    ];
    await attachWaveformSummary(
      stemAssets[0],
      waveformSummary,
      trackId,
      `stem-${stemId}-waveform.json`,
    );
  }

  const stats = await fs.stat(finalPath);
  const durationSeconds = waveformSummary?.durationMs
    ? waveformSummary.durationMs / 1000
    : fallbackDurationSeconds(stats.size);
  const processing: NoisegenProcessingState | undefined =
    playbackAssets.length > 0
      ? {
          status: "ready",
          detail: resolvePlaybackReadyDetail(playbackAssets),
          updatedAt: Date.now(),
        }
      : existingSnapshot?.processing?.status === "ready"
        ? existingSnapshot.processing
        : {
            status: "processing",
            detail: "awaiting mixdown for playback",
            updatedAt: Date.now(),
          };
    await upsertOriginalRecord({
      trackId,
      title,
      creator,
      durationSeconds,
      offsetMs,
      tempo,
      notes: notes || undefined,
      timeSky,
      intentContract,
      instrumentalAsset,
      vocalAsset,
      stemAssets,
      playbackAssets,
      processing,
    });

  await fs.rm(uploadDir, { recursive: true, force: true });
  return res.json({ trackId, complete: true });
});

router.post("/api/noise-gens/upload/complete", async (req, res) => {
  const trackId = readStringField(req.body?.trackId);
  if (!trackId) {
    return res.status(400).json({ error: "track_id_required" });
  }
  const autoMixdown = readBooleanField(req.body?.autoMixdown);
  const forcePlayback = readBooleanField(req.body?.forcePlayback);
  const store = await getNoisegenStore();
  const original = findOriginalById(store, trackId);
  if (!original) {
    return res.status(404).json({ error: "not_found" });
  }
  const shouldBuildStemGroups =
    (!original.assets.stemGroups || original.assets.stemGroups.length === 0) &&
    ((original.assets.stems?.length ?? 0) > 0 || Boolean(original.assets.vocal));
  const buildStemGroupsIfNeeded = async () =>
    shouldBuildStemGroups ? await buildStemGroupAssets(original) : undefined;

  if (forcePlayback) {
    if (original.assets.instrumental) {
      try {
        const buffer = await loadAssetBuffer(original.assets.instrumental);
        const playbackAssets = await buildPlaybackAssetsFromBuffer({
          originalId: trackId,
          buffer,
          mime: original.assets.instrumental.mime,
          originalName: original.assets.instrumental.fileName,
          fallbackAsset: original.assets.instrumental,
        });
        const stemGroupAssets = await buildStemGroupsIfNeeded();
        await upsertOriginalRecord({
          trackId,
          title: original.title,
          creator: original.artist,
          durationSeconds: original.duration,
          offsetMs: original.offsetMs ?? 0,
          tempo: original.tempo,
          notes: original.notes,
          timeSky: original.timeSky,
          playbackAssets,
          stemGroupAssets,
          processing: {
            status: "ready",
            detail: resolvePlaybackReadyDetail(playbackAssets),
            updatedAt: Date.now(),
          },
        });
        return res.json({ status: "ready", regenerated: true });
      } catch {
        return res
          .status(500)
          .json({ error: "playback_rebuild_failed" });
      }
    }
    if (!original.assets.stems?.length && !original.assets.vocal) {
      return res.status(400).json({ error: "playback_source_missing" });
    }
  }

  if (!forcePlayback && original.assets.playback && original.assets.playback.length > 0) {
    const stemGroupAssets = await buildStemGroupsIfNeeded();
    await upsertOriginalRecord({
      trackId,
      title: original.title,
      creator: original.artist,
      durationSeconds: original.duration,
      offsetMs: original.offsetMs ?? 0,
      tempo: original.tempo,
      notes: original.notes,
      timeSky: original.timeSky,
      stemGroupAssets,
      processing: {
        status: "ready",
        detail: resolvePlaybackReadyDetail(original.assets.playback),
        updatedAt: Date.now(),
      },
    });
    return res.json({ status: "ready" });
  }

  if (original.assets.instrumental) {
    try {
      const buffer = await loadAssetBuffer(original.assets.instrumental);
      const playbackAssets = await buildPlaybackAssetsFromBuffer({
        originalId: trackId,
        buffer,
        mime: original.assets.instrumental.mime,
        originalName: original.assets.instrumental.fileName,
        fallbackAsset: original.assets.instrumental,
      });
      const stemGroupAssets = await buildStemGroupsIfNeeded();
      await upsertOriginalRecord({
        trackId,
        title: original.title,
        creator: original.artist,
        durationSeconds: original.duration,
        offsetMs: original.offsetMs ?? 0,
        tempo: original.tempo,
        notes: original.notes,
        timeSky: original.timeSky,
        playbackAssets,
        stemGroupAssets,
        processing: {
          status: "ready",
          detail: resolvePlaybackReadyDetail(playbackAssets),
          updatedAt: Date.now(),
        },
      });
      return res.json({ status: "ready" });
    } catch {
      const playbackAsset = buildPlaybackFromInstrumental(
        original.assets.instrumental,
      );
      const stemGroupAssets = await buildStemGroupsIfNeeded();
      await upsertOriginalRecord({
        trackId,
        title: original.title,
        creator: original.artist,
        durationSeconds: original.duration,
        offsetMs: original.offsetMs ?? 0,
        tempo: original.tempo,
        notes: original.notes,
        timeSky: original.timeSky,
        playbackAssets: [playbackAsset],
        stemGroupAssets,
        processing: {
          status: "ready",
          detail: resolvePlaybackReadyDetail([playbackAsset]),
          updatedAt: Date.now(),
        },
      });
      return res.json({ status: "ready" });
    }
  }

  if (!autoMixdown && !forcePlayback) {
    await upsertOriginalRecord({
      trackId,
      title: original.title,
      creator: original.artist,
      durationSeconds: original.duration,
      offsetMs: original.offsetMs ?? 0,
      tempo: original.tempo,
      notes: original.notes,
      timeSky: original.timeSky,
      processing: {
        status: "processing",
        detail: "awaiting mixdown for playback",
        updatedAt: Date.now(),
      },
    });
    return res.json({ status: "processing" });
  }

  if (!original.assets.stems?.length && !original.assets.vocal) {
    return res.status(400).json({ error: "stems_required" });
  }

  await upsertOriginalRecord({
    trackId,
    title: original.title,
    creator: original.artist,
    durationSeconds: original.duration,
    offsetMs: original.offsetMs ?? 0,
    tempo: original.tempo,
    notes: original.notes,
    timeSky: original.timeSky,
    processing: {
      status: "processing",
      detail: "building playback mixdown",
      updatedAt: Date.now(),
    },
  });

  try {
    const mixAssets = collectMixdownAssets(original);
    const mixdown = await mixdownAssets(mixAssets);
    if (!mixdown) {
      throw new Error(
        `Mixdown requires stems decodable to PCM16 WAV at ${MIXDOWN_SAMPLE_RATE} Hz.`,
      );
    }
    const instrumentalAsset = await saveOriginalAsset({
      originalId: trackId,
      kind: "instrumental",
      buffer: mixdown.buffer,
      mime: "audio/wav",
      originalName: "instrumental.wav",
    });
    await attachWaveformSummary(
      instrumentalAsset,
      buildWaveformSummaryFromBuffer(mixdown.buffer, "audio/wav"),
      trackId,
      "instrumental-waveform.json",
    );
    const playbackAssets = await buildPlaybackAssetsFromBuffer({
      originalId: trackId,
      buffer: mixdown.buffer,
      mime: "audio/wav",
      originalName: "mix.wav",
      fallbackAsset: instrumentalAsset,
    });
    const stemGroupAssets = await buildStemGroupAssets(original);
    await upsertOriginalRecord({
      trackId,
      title: original.title,
      creator: original.artist,
      durationSeconds: mixdown.durationMs / 1000,
      offsetMs: original.offsetMs ?? 0,
      tempo: original.tempo,
      notes: original.notes,
      timeSky: original.timeSky,
      instrumentalAsset,
      playbackAssets,
      stemGroupAssets,
      processing: {
        status: "ready",
        detail: resolvePlaybackReadyDetail(playbackAssets),
        updatedAt: Date.now(),
      },
    });
    return res.json({ status: "ready" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Mixdown failed.";
    await upsertOriginalRecord({
      trackId,
      title: original.title,
      creator: original.artist,
      durationSeconds: original.duration,
      offsetMs: original.offsetMs ?? 0,
      tempo: original.tempo,
      notes: original.notes,
      timeSky: original.timeSky,
      processing: {
        status: "error",
        detail: message,
        updatedAt: Date.now(),
      },
    });
    return res.status(500).json({ error: "mixdown_failed", message });
  }
});

router.post("/api/noise-gens/jobs", async (req, res) => {
  const parsed = coverJobRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "invalid_request", issues: parsed.error.issues });
  }

  const store = await getNoisegenStore();
  const original = findOriginalById(store, parsed.data.originalId);
  const contract = original?.intentContract ?? null;
  const intentState = createIntentEnforcementState();
  const enforcedRequest = enforceIntentContractOnRequest(
    parsed.data,
    contract,
    intentState,
  );
  if (parsed.data.renderPlan) {
    enforcedRequest.renderPlan = enforceIntentContractOnRenderPlan(
      parsed.data.renderPlan,
      contract,
      intentState,
    );
  }
  const intentMeta = finalizeIntentMeta(intentState, contract);
  if (intentMeta.violations.length) {
    console.warn(
      "[noise-gens] intent violations on cover job",
      parsed.data.originalId,
      intentMeta.violations,
    );
  }

  const id = randomUUID();
  const now = Date.now();
  const job: CoverJob = {
    id,
    type: "cover",
    status: "processing",
    request: enforcedRequest,
    createdAt: now,
    updatedAt: now,
  };

  await updateNoisegenStore((next) => {
    next.jobs.push(job);
    return next;
  });

  if (shouldRemoteRender(enforcedRequest)) {
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

  return res.json({ id, request: enforcedRequest, intent: intentMeta });
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
  const macros = parsed.data.macros;
  const macroEnergy = clamp01(macros?.energy ?? 0.6);
  const macroTexture = clamp01(macros?.texture ?? 0.5);
  const macroSpace = clamp01(macros?.space ?? 0.45);
  const macroWeird = clamp01(macros?.weirdness ?? macroTexture);
  const macroDrive = clamp01(macros?.drive ?? 0.3);
  const durationSeconds = clampNumber(12, PREVIEW_MIN_SECONDS, PREVIEW_MAX_SECONDS, 12);
  const settings = resolvePreviewSettings({
    seedSource: `${parsed.data.moodId}:${parsed.data.seed ?? jobId}`,
    styleInfluence: clamp01(0.2 + macroTexture * 0.65),
    sampleInfluence: clamp01(0.35 + macroEnergy * 0.55),
    weirdness: clamp01(0.1 + macroWeird * 0.6 + macroSpace * 0.15 + macroDrive * 0.1),
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
