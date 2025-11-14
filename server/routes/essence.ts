import { Router, type Request, type Response } from "express";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { COLLAPSE_SPACE, EssenceEnvelope, RemixRequest, type TEssenceEnvelope } from "@shared/essence-schema";
import { essenceHub, type EssenceEvent } from "../services/essence/events";
import { findEnvelopeByOriginalHash, getEnvelope, putEnvelope } from "../services/essence/store";
import { putBlob } from "../storage";
import { observeUploadBytes } from "../metrics";
import { collapseMix, MissingEssenceInputError } from "../services/mixer/collapse";
import { createEssenceMix } from "../services/essence/mix";
import { ensureEssenceEnvironment } from "../services/essence/environment";
import { listUiPreferences } from "../services/essence/preferences";
import { persistEssencePacket } from "../db/essence";
import { queueIngestJobs } from "../services/essence/ingest-jobs";
import { buildThemeDeckForOwner } from "../services/essence/themes";

export const essenceRouter = Router();
type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

const resolveActorId = (req: Request): string | null =>
  (req as any)?.auth?.sub ?? (req as any)?.auth?.personaId ?? null;

const isEnvelopePublic = (env: TEssenceEnvelope): boolean =>
  (env.header.acl?.visibility ?? "public") === "public";

const isEnvelopeOwner = (req: Request, env: TEssenceEnvelope): boolean => {
  const actorId = resolveActorId(req);
  if (!actorId) {
    return false;
  }
  return actorId === env.header.source?.creator_id;
};

const canAccessEnvelope = (req: Request, env: TEssenceEnvelope | null): env is TEssenceEnvelope => {
  if (!env) {
    return false;
  }
  if (isEnvelopePublic(env)) {
    return true;
  }
  return isEnvelopeOwner(req, env);
};

const ensureEnvelopeReadable = (
  req: Request,
  res: Response,
  env: TEssenceEnvelope | null,
): TEssenceEnvelope | null => {
  if (!env) {
    res.status(404).json({ error: "not_found" });
    return null;
  }
  if (!canAccessEnvelope(req, env)) {
    res.status(403).json({ error: "forbidden" });
    return null;
  }
  return env;
};

class ForbiddenEssenceAccessError extends Error {
  essenceId: string;
  constructor(essenceId: string) {
    super("forbidden");
    this.name = "ForbiddenEssenceAccessError";
    this.essenceId = essenceId;
  }
}

essenceRouter.get("/preferences", async (req, res) => {
  const ownerId = resolveActorId(req);
  if (!ownerId) {
    return res.json({ preferences: [], environment: null });
  }
  const [preferences, environment] = await Promise.all([
    listUiPreferences(ownerId),
    ensureEssenceEnvironment(ownerId),
  ]);
  res.json({ preferences, environment });
});

essenceRouter.get("/themes", async (req, res) => {
  const ownerId = resolveActorId(req);
  const limit = Number.isFinite(Number(req.query.limit)) ? Number(req.query.limit) : undefined;
  try {
    const deck = await buildThemeDeckForOwner(ownerId, { limit });
    res.json(deck);
  } catch (err) {
    console.error("[essence:themes] failed to build theme deck", err);
    res.status(500).json({ error: "theme_analysis_failed" });
  }
});

/** POST /api/essence/ingest -- accepts a blob upload and schedules enrichment */
essenceRouter.post("/ingest", async (req, res) => {
  const { default: multer } = await import("multer");
  const MAX_MB = Number(process.env.ESSENCE_MAX_UPLOAD_MB ?? 25);
  const ALLOW_MIME = (process.env.ESSENCE_UPLOAD_MIME ?? "text/plain,image/png,image/jpeg,audio/wav,audio/mpeg")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_MB * 1024 * 1024 },
  }).single("file");
  const file = await new Promise<UploadedFile>((resolve, reject) => {
    upload(req, res, (err: unknown) => {
      if (err) {
        if (typeof (err as any)?.code === "string" && (err as any).code === "LIMIT_FILE_SIZE") {
          const limitErr = new Error("file_too_large");
          (limitErr as any).status = 413;
          reject(limitErr);
          return;
        }
        reject(err instanceof Error ? err : new Error("upload_failed"));
        return;
      }
      const payload = (req as any).file;
      if (!payload) {
        reject(new Error("file_required"));
        return;
      }
      resolve(payload);
    });
  }).catch((err: Error & { status?: number }) => {
    if (err.message === "file_required") {
      res.status(400).json({ error: "file_required" });
    } else if (err.message === "file_too_large") {
      res.status(413).json({ error: "file_too_large", limit_mb: MAX_MB });
    } else {
      const status = Number.isFinite(err.status) ? Number(err.status) : 400;
      res.status(status).json({ error: "upload_failed", details: err.message });
    }
    return null;
  });
  if (!file) {
    return;
  }
  const normalizedMime = String(file.mimetype ?? "").toLowerCase();
  if (ALLOW_MIME.length && !ALLOW_MIME.includes(normalizedMime)) {
    return res.status(415).json({ error: "unsupported_media_type", mimetype: file.mimetype });
  }
  const creatorId =
    (typeof req.body?.creator_id === "string" && req.body.creator_id.trim()) ||
    resolveActorId(req) ||
    "persona:unknown";
  const visibility =
    (typeof req.body?.visibility === "string" && req.body.visibility.trim()) || "public";
  const license = typeof req.body?.license === "string" ? req.body.license : "CC-BY-4.0";
  const now = new Date().toISOString();
  const buffer = file.buffer as Buffer;
  const hash = createHash("sha256").update(buffer).digest("hex");
  const existing = await findEnvelopeByOriginalHash("sha256", hash, creatorId);
  if (existing?.header?.id) {
    return res.status(200).json({
      essence_id: existing.header.id,
      uri: existing.header.source?.uri,
      hash,
      dedup: true,
    });
  }
  const blob = await putBlob(buffer, { contentType: file.mimetype });
  if (!blob?.uri) {
    throw new Error("storage_put_failed");
  }
  const modality = detectModality(file.mimetype);

  const envelope = EssenceEnvelope.parse({
    header: {
      id: randomUUID(),
      version: "essence/1.0",
      modality,
      created_at: now,
      source: {
        uri: blob.uri,
        cid: blob.cid,
        original_hash: { algo: "sha256", value: hash },
        creator_id: creatorId,
        license,
        mime: file.mimetype,
      },
      rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
      acl: { visibility, groups: [] },
    },
    features: {},
    embeddings: [],
    provenance: {
      pipeline: [],
      merkle_root: { algo: "sha256", value: hash },
      previous: null,
      signatures: [],
    },
  });

  await putEnvelope(envelope);
  await persistEssencePacket({
    id: `${envelope.header.id}:source`,
    envelope_id: envelope.header.id,
    uri: blob.uri,
    cid: blob.cid,
    content_type: blob.contentType,
    bytes: blob.bytes,
  });
  observeUploadBytes(buffer.length);
  essenceHub.emit("created", { type: "created", essenceId: envelope.header.id });
  queueIngestJobs({
    envelopeId: envelope.header.id,
    modality,
    mime: file.mimetype,
    originalName: file.originalname,
    bytes: blob.bytes,
    buffer,
    hash,
    storage: { uri: blob.uri, cid: blob.cid },
  });
  return res.json({ essence_id: envelope.header.id, uri: blob.uri, hash });
});

const handleEssenceEventStream = (req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\ndata: {}\n\n`);
    } catch {
      // ignore write errors; cleanup will run from close/error
    }
  }, 25000);

  const writeEvent = (event: EssenceEvent) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      // swallow write errors; close handler will clean up
    }
  };

  const created = (evt: EssenceEvent) => writeEvent(evt);
  const updated = (evt: EssenceEvent) => writeEvent(evt);
  const progress = (evt: EssenceEvent) => writeEvent(evt);
  const complete = (evt: EssenceEvent) => writeEvent(evt);
  const proposalProgress = (evt: EssenceEvent) => writeEvent(evt);
  const proposalChat = (evt: EssenceEvent) => writeEvent(evt);

  essenceHub.on("created", created);
  essenceHub.on("updated", updated);
  essenceHub.on("remix-progress", progress);
  essenceHub.on("remix-complete", complete);
  essenceHub.on("proposal-progress", proposalProgress);
  essenceHub.on("proposal-chat", proposalChat);

  const cleanup = () => {
    clearInterval(heartbeat);
    essenceHub.off("created", created);
    essenceHub.off("updated", updated);
    essenceHub.off("remix-progress", progress);
    essenceHub.off("remix-complete", complete);
    essenceHub.off("proposal-progress", proposalProgress);
    essenceHub.off("proposal-chat", proposalChat);
  };

  req.on("close", cleanup);
  req.on("error", cleanup);
};

/** GET /api/essence/events - preferred server-sent event feed */
essenceRouter.get("/events", handleEssenceEventStream);

/** GET /api/essence/stream/sse - legacy alias */
essenceRouter.get("/stream/sse", handleEssenceEventStream);

/** GET /api/essence/verify/hash?id=... — placeholder verification */
essenceRouter.get("/verify/hash", async (req, res) => {
  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) {
    return res.status(400).json({ error: "missing-id" });
  }
  const env = await ensureEnvelopeReadable(req, res, await getEnvelope(id));
  if (!env) {
    return;
  }
  res.json({ id, ok: true, algo: env.header.source.original_hash.algo });
});

/** POST /api/essence/remix — stubbed deterministic job */
essenceRouter.post("/remix", async (req, res) => {
  const parsed = RemixRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error);
  }
  const jobId = randomUUID();
  const { recipe, target_envelope_id } = parsed.data;
  const target = await ensureEnvelopeReadable(req, res, await getEnvelope(target_envelope_id));
  if (!target) {
    return;
  }

  if ("kind" in recipe && recipe.kind === "collapse_mixer") {
    essenceHub.emit("remix-progress", { type: "remix-progress", jobId, progress: 0.1 });
    try {
      const { fused, feature } = await collapseMix({
        recipe,
        fetchEnvelope: async (id) => {
          const env = await getEnvelope(id);
          if (!env) {
            throw new MissingEssenceInputError(id);
          }
          if (!canAccessEnvelope(req, env)) {
            throw new ForbiddenEssenceAccessError(id);
          }
          return env;
        },
      });
      const buffer = Buffer.from(fused.buffer, fused.byteOffset, fused.byteLength);
      const blob = await putBlob(buffer, { contentType: "application/octet-stream" });
      observeUploadBytes(buffer.length);

      const newEmbedding: TEssenceEnvelope["embeddings"][number] = {
        space: COLLAPSE_SPACE,
        dim: fused.length,
        dtype: "f32",
        storage: { object_url: blob.uri, cid: blob.cid },
        composer: "collapse-mixer/1.0",
      };
      const embeddings: TEssenceEnvelope["embeddings"] = [
        ...(Array.isArray(target.embeddings) ? target.embeddings : []),
        newEmbedding,
      ];
      const updated: TEssenceEnvelope = {
        ...target,
        features: { ...(target.features ?? {}), mixer: feature },
        embeddings,
      };
      await putEnvelope(updated);
      essenceHub.emit("updated", { type: "updated", essenceId: updated.header.id });
      essenceHub.emit("remix-complete", { type: "remix-complete", jobId, essenceId: updated.header.id });
      return res.json({ job_id: jobId, envelope_id: updated.header.id, space: COLLAPSE_SPACE, dim: fused.length });
    } catch (err) {
      if (err instanceof ForbiddenEssenceAccessError) {
        return res.status(403).json({ error: "forbidden", essence_id: err.essenceId });
      }
      if (err instanceof MissingEssenceInputError) {
        return res.status(404).json({ error: "input_not_found", essence_id: err.essenceId });
      }
      console.error("[essence:remix] collapse mixer failed", err);
      return res.status(500).json({ error: "collapse_mixer_failed" });
    }
  }

  setImmediate(() => {
    essenceHub.emit("remix-progress", { type: "remix-progress", jobId, progress: 0.5 });
    const newId = randomUUID();
    essenceHub.emit("remix-complete", { type: "remix-complete", jobId, essenceId: newId });
  });
  res.json({ job_id: jobId });
});

const MixCreateSchema = z.object({
  mode: z.enum(["project-assets", "proposal-identity"]),
  creatorId: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(64).optional(),
  label: z.string().trim().max(240).optional(),
  seed: z.coerce.number().int().nonnegative().optional(),
});

essenceRouter.post("/mix/create", async (req, res) => {
  const parsed = MixCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
  }
  const actorId = resolveActorId(req) ?? "persona:unknown";
  if (parsed.data.mode === "project-assets" && !parsed.data.creatorId) {
    return res.status(400).json({ error: "creator_required" });
  }
  try {
    const result = await createEssenceMix({
      ...parsed.data,
      creatorId: parsed.data.creatorId ?? actorId,
      personaId: actorId,
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: "mix_failed", message });
  }
});

/** GET /api/essence/:id — fetch envelope */
essenceRouter.get("/:id([a-f0-9-]{36}|cid/.+)", async (req, res) => {
  const env = await ensureEnvelopeReadable(req, res, await getEnvelope(req.params.id));
  if (!env) {
    return;
  }
  res.json(env);
});

function detectModality(mime: string): "text" | "audio" | "image" | "video" | "multimodal" {
  if (mime.startsWith("image/")) {
    return "image";
  }
  if (mime.startsWith("audio/")) {
    return "audio";
  }
  if (mime.startsWith("video/")) {
    return "video";
  }
  return "text";
}
