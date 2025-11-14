import { Router } from "express";
import multer from "multer";
import { createPublicKey, verify as verifySignature } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { putBlob } from "../storage";
import { hullModeEnabled } from "../security/hull-guard";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

const resolvePubKeyPath = (): string => {
  const explicit = process.env.HULL_CA_PUBKEY_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  return path.resolve(process.cwd(), "ops", "hull-ca.pub");
};

const verifyManifest = async (manifest: Buffer, signature: Buffer): Promise<boolean> => {
  const pem = await fs.readFile(resolvePubKeyPath());
  const publicKey = createPublicKey(pem);
  try {
    return verifySignature(null, manifest, publicKey, signature);
  } catch {
    return false;
  }
};

const parseSignature = (value: unknown): Buffer | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  try {
    return Buffer.from(value.trim(), "base64");
  } catch {
    return null;
  }
};

const parseManifest = (value: unknown): { buffer: Buffer; json: unknown } | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  try {
    const buffer = Buffer.from(value, "utf8");
    const json = JSON.parse(value);
    return { buffer, json };
  } catch {
    return null;
  }
};

export const hullCapsules = Router();

hullCapsules.post("/import", upload.single("capsule"), async (req, res) => {
  if (process.env.ENABLE_CAPSULE_IMPORT !== "1") {
    return res.status(404).json({ error: "capsule_import_disabled" });
  }
  if (!hullModeEnabled()) {
    return res.status(403).json({ error: "hull_mode_disabled" });
  }
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "capsule_missing" });
  }
  const manifest = parseManifest(req.body?.manifest);
  const signature = parseSignature(req.body?.signature);
  if (!manifest || !signature) {
    return res.status(400).json({ error: "manifest_or_signature_missing" });
  }
  try {
    const ok = await verifyManifest(manifest.buffer, signature);
    if (!ok) {
      return res.status(400).json({ error: "bad_signature" });
    }
  } catch (err) {
    return res.status(500).json({ error: "capsule_verification_error", message: (err as Error).message });
  }
  const blob = await putBlob(file.buffer, { contentType: file.mimetype || "application/octet-stream" });
  return res.json({
    ok: true,
    capsule_uri: blob.uri,
    bytes: file.size,
    manifest: manifest.json,
  });
});
