import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import multer from "multer";
import { listKnowledgeFilesByProjects } from "../db/knowledge";
import { runNoiseFieldLoop } from "../../modules/analysis/noise-field-loop.js";

const router = Router();
const upload = multer();
const LOCAL_TTS_URL = process.env.LOCAL_TTS_URL ?? "http://127.0.0.1:8000/api/tts";
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
  })
  .refine((value) => !value.linkHelix || Boolean(value.helix), {
    message: "helix packet required when linkHelix is true",
  });

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
  status: JobStatus;
  request: z.infer<typeof coverJobRequestSchema>;
  createdAt: number;
  updatedAt: number;
  previewUrl?: string;
  error?: string;
  evidence?: z.infer<typeof evidenceSchema>;
};

const jobs = new Map<string, CoverJob>();

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

router.post("/api/noise-gens/upload", upload.any(), (req, res) => {
  const tempoField = Array.isArray(req.body?.tempo) ? req.body.tempo[0] : req.body?.tempo;
  if (tempoField != null && typeof tempoField !== "string") {
    return res.status(400).json({ error: "invalid_tempo_format" });
  }

  if (typeof tempoField === "string" && tempoField.trim().length > 0) {
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
  }

  const trackId = randomUUID();
  return res.json({ trackId });
});

router.post("/api/noise-gens/jobs", (req, res) => {
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
    status: "queued",
    request: parsed.data,
    createdAt: now,
    updatedAt: now,
  };

  jobs.set(id, job);

  job.status = "processing";
  job.updatedAt = Date.now();

  void processJob(job).catch((error) => {
    job.status = "error";
    job.updatedAt = Date.now();
    job.error = error instanceof Error ? error.message : String(error);
  });

  return res.json({ id });
});

router.get("/api/noise-gens/jobs/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: "not_found" });
  }
  return res.json(job);
});

router.put("/api/noise-gens/jobs/:id/ready", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: "not_found" });
  }

  job.status = "ready";
  job.updatedAt = Date.now();
  if (typeof req.body?.previewUrl === "string") {
    job.previewUrl = req.body.previewUrl;
  }
  if (req.body?.evidence != null) {
    const parsedEvidence = evidenceSchema.safeParse(req.body.evidence);
    if (!parsedEvidence.success) {
      return res
        .status(400)
        .json({ error: "invalid_evidence", issues: parsedEvidence.error.issues });
    }
    job.evidence = parsedEvidence.data;
  }
  return res.json(job);
});

router.put("/api/noise-gens/jobs/:id/error", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: "not_found" });
  }
  job.status = "error";
  job.updatedAt = Date.now();
  job.error =
    typeof req.body?.error === "string" && req.body.error.trim().length > 0     
      ? req.body.error
      : "unknown";
  return res.json(job);
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

const buildPromptFromJob = (job: CoverJob): string => {
  const parts: string[] = [];
  parts.push(`cover job ${job.id}`);
  if (job.request.knowledgeFileIds?.length) {
    parts.push(`based on knowledge files ${job.request.knowledgeFileIds.join(", ")}`);
  }
  if (job.request.kbTexture) {
    parts.push(`texture: ${job.request.kbTexture}`);
  }
  if (typeof job.request.weirdness === "number") {
    parts.push(`weirdness ${job.request.weirdness}`);
  }
  if (job.request.tempo?.bpm) {
    parts.push(`tempo ${job.request.tempo.bpm} bpm`);
  }
  return parts.join(" | ");
};

const processJob = async (job: CoverJob) => {
  const prompt = buildPromptFromJob(job);
  const duration = Math.max(
    10,
    Math.min(
      60,
      job.request.barWindows?.[0]
        ? (job.request.barWindows[0].endBar - job.request.barWindows[0].startBar + 1) * 4
        : 30,
    ),
  );

  const payload = {
    text: prompt,
    duration,
  };

  const response = await fetch(LOCAL_TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`local_tts_failed status=${response.status}`);
  }

  const buf = Buffer.from(await response.arrayBuffer());
  job.previewUrl = `data:audio/wav;base64,${buf.toString("base64")}`;
  job.status = "ready";
  job.updatedAt = Date.now();
};

export default router;
