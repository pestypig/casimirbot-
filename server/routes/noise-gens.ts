import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import multer from "multer";
import { listKnowledgeFilesByProjects } from "../db/knowledge";

const router = Router();
const upload = multer();
const LOCAL_TTS_URL = process.env.LOCAL_TTS_URL ?? "http://127.0.0.1:8000/api/tts";

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
    knowledgeFileIds: z.array(z.string().min(1)).optional(), // audio from knowledge store
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
