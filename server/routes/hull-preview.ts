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
const REPO_GLB_DIRS = [
  { dir: path.resolve(process.cwd(), "public"), urlPrefix: "/" },
  { dir: path.resolve(process.cwd(), "client", "public"), urlPrefix: "/" },
  { dir: path.resolve(process.cwd(), "dist", "public"), urlPrefix: "/" },
  { dir: path.resolve(process.cwd(), "attached_assets"), urlPrefix: "/attached_assets/" },
] as const;
const REPO_SCAN_DEPTH = 3;

type HullAssetEntry = {
  id: string;
  label: string;
  url: string;
  source: "repo" | "upload";
  meshHash?: string;
  updatedAt?: number;
};
type HullAssetsResponse = {
  kind: "hull-assets";
  repo: HullAssetEntry[];
  uploads: HullAssetEntry[];
};

const normalizeMeshHash = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !HASH_PATTERN.test(trimmed)) return null;
  return trimmed;
};

const computeMeshHash = (buffer: Buffer): string =>
  createHash("sha256").update(buffer).digest("hex");

const toPosixPath = (value: string) => value.split(path.sep).join("/");

const buildAssetUrl = (prefix: string, relPath: string) => {
  const cleanPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  const cleanRel = toPosixPath(relPath).replace(/^\/+/, "");
  return `${cleanPrefix}${cleanRel}`.replace(/\/{2,}/g, "/");
};

const collectGlbAssets = async (
  rootDir: string,
  urlPrefix: string,
  depth: number,
): Promise<HullAssetEntry[]> => {
  const assets: HullAssetEntry[] = [];
  try {
    const stat = await fs.stat(rootDir);
    if (!stat.isDirectory()) return assets;
  } catch {
    return assets;
  }
  const visit = async (dir: string, remaining: number) => {
    if (remaining < 0) return;
    let entries: Array<import("node:fs").Dirent> = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await visit(fullPath, remaining - 1);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!entry.name.toLowerCase().endsWith(".glb")) continue;
      const relPath = path.relative(rootDir, fullPath);
      const url = buildAssetUrl(urlPrefix, relPath);
      assets.push({
        id: url,
        label: entry.name,
        url,
        source: "repo",
      });
    }
  };
  await visit(rootDir, depth);
  return assets;
};

const listRepoGlbAssets = async (): Promise<HullAssetEntry[]> => {
  const seen = new Set<string>();
  const assets: HullAssetEntry[] = [];
  for (const root of REPO_GLB_DIRS) {
    const entries = await collectGlbAssets(root.dir, root.urlPrefix, REPO_SCAN_DEPTH);
    for (const entry of entries) {
      if (seen.has(entry.url)) continue;
      seen.add(entry.url);
      assets.push(entry);
    }
  }
  assets.sort((a, b) => a.label.localeCompare(b.label));
  return assets;
};

const listUploadGlbAssets = async (): Promise<HullAssetEntry[]> => {
  const assets: HullAssetEntry[] = [];
  try {
    await ensurePreviewDir();
  } catch {
    return assets;
  }
  let entries: Array<import("node:fs").Dirent> = [];
  try {
    entries = await fs.readdir(PREVIEW_DIR, { withFileTypes: true });
  } catch {
    return assets;
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith(".glb")) continue;
    const base = entry.name.slice(0, -4);
    const meshHash = normalizeMeshHash(base);
    if (!meshHash) continue;
    let updatedAt: number | undefined;
    try {
      const stat = await fs.stat(path.join(PREVIEW_DIR, entry.name));
      updatedAt = Number.isFinite(stat.mtimeMs) ? Math.round(stat.mtimeMs) : undefined;
    } catch {
      updatedAt = undefined;
    }
    const label = meshHash.length > 12 ? `${meshHash.slice(0, 12)}...` : meshHash;
    assets.push({
      id: `/api/helix/hull-preview/${meshHash}.glb`,
      label,
      url: `/api/helix/hull-preview/${meshHash}.glb`,
      source: "upload",
      meshHash,
      updatedAt,
    });
  }
  assets.sort((a, b) => {
    if (a.updatedAt && b.updatedAt && a.updatedAt !== b.updatedAt) {
      return b.updatedAt - a.updatedAt;
    }
    return a.label.localeCompare(b.label);
  });
  return assets;
};

const ensurePreviewDir = async () => {
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
};

const resolveGlbPath = (meshHash: string) => path.join(PREVIEW_DIR, `${meshHash}.glb`);

export const hullPreviewRouter = Router();

hullPreviewRouter.get("/assets", async (_req, res) => {
  try {
    const [repo, uploads] = await Promise.all([listRepoGlbAssets(), listUploadGlbAssets()]);
    const payload: HullAssetsResponse = { kind: "hull-assets", repo, uploads };
    return res.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "hull_assets_failed";
    return res.status(500).json({ error: "hull_assets_failed", message });
  }
});

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
