import fs from "node:fs/promises";
import path from "node:path";
import { hashStableJson, sha256Prefixed } from "../../utils/information-boundary";
import type { SolarKernelBundleManifest, SolarThresholdsManifest } from "./types";

const KERNEL_BUNDLE_PATH = "configs/halobank-solar-kernel-bundle.v1.json";
const THRESHOLDS_PATH = "configs/halobank-solar-thresholds.v1.json";

let cachedKernelBundle: SolarKernelBundleManifest | null = null;
let cachedThresholds: SolarThresholdsManifest | null = null;

function parseJson<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse ${label}: ${message}`);
  }
}

function ensureKernelManifest(manifest: SolarKernelBundleManifest): SolarKernelBundleManifest {
  if (manifest.schema_version !== "halobank.solar.kernel.bundle/1") {
    throw new Error("Invalid kernel bundle schema_version");
  }
  if (!manifest.bundle_id || !manifest.epoch_range?.start_iso || !manifest.epoch_range?.end_iso) {
    throw new Error("Kernel bundle manifest is missing required fields");
  }
  return manifest;
}

function ensureThresholdsManifest(manifest: SolarThresholdsManifest): SolarThresholdsManifest {
  if (manifest.schema_version !== "halobank.solar.thresholds/1") {
    throw new Error("Invalid solar thresholds schema_version");
  }
  if (!manifest.epoch_window?.start_iso || !manifest.epoch_window?.end_iso) {
    throw new Error("Solar thresholds epoch_window is required");
  }
  return manifest;
}

export async function loadSolarKernelBundle(): Promise<SolarKernelBundleManifest> {
  if (cachedKernelBundle) return cachedKernelBundle;
  const filePath = path.join(process.cwd(), KERNEL_BUNDLE_PATH);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = parseJson<SolarKernelBundleManifest>(raw, KERNEL_BUNDLE_PATH);
  cachedKernelBundle = ensureKernelManifest(parsed);
  return cachedKernelBundle;
}

export async function loadSolarThresholds(): Promise<SolarThresholdsManifest> {
  if (cachedThresholds) return cachedThresholds;
  const filePath = path.join(process.cwd(), THRESHOLDS_PATH);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = parseJson<SolarThresholdsManifest>(raw, THRESHOLDS_PATH);
  cachedThresholds = ensureThresholdsManifest(parsed);
  return cachedThresholds;
}

export function verifyKernelBundleSignature(manifest: SolarKernelBundleManifest): {
  ok: boolean;
  expected: string;
  actual: string;
} {
  const canonicalPayload = {
    schema_version: manifest.schema_version,
    bundle_id: manifest.bundle_id,
    release_policy: manifest.release_policy,
    epoch_range: manifest.epoch_range,
    assets: manifest.assets,
  };
  const actual = hashStableJson(canonicalPayload);
  const expected = manifest.signature?.signed_payload_hash ?? "";
  return {
    ok: actual === expected,
    expected,
    actual,
  };
}

export async function validateKernelBundleAssets(
  manifest: SolarKernelBundleManifest,
  repoRoot = process.cwd(),
): Promise<{
  ok: boolean;
  missing: string[];
  digestMismatch: string[];
  verified: string[];
}> {
  const missing: string[] = [];
  const digestMismatch: string[] = [];
  const verified: string[] = [];

  for (const asset of manifest.assets ?? []) {
    const abs = path.resolve(repoRoot, asset.path);
    let content: Buffer;
    try {
      content = await fs.readFile(abs);
    } catch {
      if (!asset.optional) {
        missing.push(asset.id);
      }
      continue;
    }

    if (!/^sha256:[a-fA-F0-9]{64}$/.test(asset.digest)) {
      digestMismatch.push(asset.id);
      continue;
    }
    const computed = sha256Prefixed(content);
    if (computed !== asset.digest) {
      digestMismatch.push(asset.id);
      continue;
    }
    verified.push(asset.id);
  }

  return {
    ok: missing.length === 0 && digestMismatch.length === 0,
    missing,
    digestMismatch,
    verified,
  };
}

export function isCanonicalEvidenceRef(value: string): boolean {
  const normalized = value.trim();
  return /^artifact:[A-Za-z0-9._:+-]+$/.test(normalized);
}
