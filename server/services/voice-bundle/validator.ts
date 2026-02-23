import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export type VoiceBundleValidationFailure = {
  code: "manifest_missing" | "manifest_invalid" | "required_file_missing" | "checksum_mismatch" | "bytes_mismatch";
  message: string;
  details?: Record<string, unknown>;
};

export type VoiceBundleValidationResult =
  | { ok: true; profileId: string; filesValidated: number }
  | { ok: false; failure: VoiceBundleValidationFailure };

type ManifestEntry = { path: string; sha256: string; bytes: number };
type Manifest = {
  bundle_version: string;
  voice_profile_id: string;
  display_name: string;
  created_at: string;
  files: ManifestEntry[];
};

const sha256 = (buf: Buffer): string => createHash("sha256").update(buf).digest("hex");

export const validateVoiceBundle = (bundleDir: string): VoiceBundleValidationResult => {
  const manifestPath = join(bundleDir, "manifest.json");
  let manifestRaw: string;
  try {
    manifestRaw = readFileSync(manifestPath, "utf8");
  } catch {
    return { ok: false, failure: { code: "manifest_missing", message: "manifest.json is required." } };
  }

  let manifest: Manifest;
  try {
    manifest = JSON.parse(manifestRaw) as Manifest;
  } catch {
    return { ok: false, failure: { code: "manifest_invalid", message: "manifest.json is not valid JSON." } };
  }

  if (
    manifest.bundle_version !== "voice_bundle/1" ||
    !manifest.voice_profile_id ||
    !manifest.display_name ||
    !manifest.created_at ||
    !Array.isArray(manifest.files)
  ) {
    return { ok: false, failure: { code: "manifest_invalid", message: "manifest.json missing required fields." } };
  }

  for (const entry of manifest.files) {
    const filePath = join(bundleDir, entry.path);
    let buf: Buffer;
    try {
      buf = readFileSync(filePath);
    } catch {
      return {
        ok: false,
        failure: { code: "required_file_missing", message: "Required bundle file is missing.", details: { path: entry.path } },
      };
    }
    const actualSize = statSync(filePath).size;
    if (actualSize !== entry.bytes) {
      return {
        ok: false,
        failure: { code: "bytes_mismatch", message: "File size does not match manifest.", details: { path: entry.path, expected: entry.bytes, actual: actualSize } },
      };
    }
    const actualHash = sha256(buf);
    if (actualHash !== entry.sha256.toLowerCase()) {
      return {
        ok: false,
        failure: { code: "checksum_mismatch", message: "File checksum does not match manifest.", details: { path: entry.path, expected: entry.sha256, actual: actualHash } },
      };
    }
  }

  return { ok: true, profileId: manifest.voice_profile_id, filesValidated: manifest.files.length };
};


export const validateVoiceBundleOrThrow = (bundleDir: string): VoiceBundleValidationResult => {
  const result = validateVoiceBundle(bundleDir);
  if (!result.ok) throw new Error(`${result.failure.code}:${result.failure.message}`);
  return result;
};
