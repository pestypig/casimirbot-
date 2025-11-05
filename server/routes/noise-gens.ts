import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import multer from "multer";

const router = Router();
const upload = multer();

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

export default router;
