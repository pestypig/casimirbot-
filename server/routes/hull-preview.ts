import { Router } from "express";
import multer from "multer";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

const PREVIEW_DIR = path.resolve(process.cwd(), "data", "hull-previews");
const HASH_PATTERN = /^[a-f0-9]{8,128}$/i;

const normalizeMeshHash = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !HASH_PATTERN.test(trimmed)) return null;
  return trimmed;
};

const computeMeshHash = (buffer: Buffer): string =>
  createHash("sha256").update(buffer).digest("hex");

const ensurePreviewDir = async () => {
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
};

const resolveGlbPath = (meshHash: string) => path.join(PREVIEW_DIR, `${meshHash}.glb`);

export const hullPreviewRouter = Router();

hullPreviewRouter.post("/upload", upload.single("glb"), async (req, res) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file?.buffer) {
    return res.status(400).json({ error: "glb_missing" });
  }

  const meshHash = normalizeMeshHash(req.body?.meshHash) ?? computeMeshHash(file.buffer);
  const updatedAt = Date.now();
  const glbUrl = `/api/helix/hull-preview/${meshHash}.glb`;

  try {
    await ensurePreviewDir();
    const filePath = resolveGlbPath(meshHash);
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, file.buffer);
    }
    return res.json({ glbUrl, meshHash, updatedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "upload_failed";
    return res.status(500).json({ error: "upload_failed", message });
  }
});

hullPreviewRouter.get("/:meshHash.glb", async (req, res) => {
  const meshHash = normalizeMeshHash(req.params.meshHash);
  if (!meshHash) {
    return res.status(400).json({ error: "invalid_mesh_hash" });
  }
  const filePath = resolveGlbPath(meshHash);
  try {
    await fs.access(filePath);
  } catch {
    return res.status(404).json({ error: "glb_not_found" });
  }
  res.setHeader("Content-Type", "model/gltf-binary");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.sendFile(filePath);
});
