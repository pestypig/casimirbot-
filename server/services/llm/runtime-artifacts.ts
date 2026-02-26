import path from "node:path";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import type { Client as ReplitStorageClient } from "@replit/object-storage";
import { createCircuitBreaker } from "../resilience/circuit-breaker";

export type RuntimeArtifactIntegrityState = "verified" | "mismatch" | "missing" | "unverifiable";
export type RuntimeArtifactHydrationMode = "rehydrated" | "already_present" | "local_only" | "disabled";

export type RuntimeArtifactProvenance = {
  sourceClass: "object-storage" | "local-env";
  integrityState: RuntimeArtifactIntegrityState;
  hydrationMode: RuntimeArtifactHydrationMode;
  expectedSha256: string | null;
  observedSha256: string | null;
  targetPath: string;
};

export type RuntimeArtifactStatus = {
  label: string;
  provenance: RuntimeArtifactProvenance;
};

type ArtifactSpec = {
  label: string;
  objectKey: string;
  sha256: string;
  targetPath: string;
  executable?: boolean;
};

let replitClient: ReplitStorageClient | null = null;
let hydrationPromise: Promise<void> | null = null;
let artifactStatuses: RuntimeArtifactStatus[] = [];

const toPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return fallback;
};

const hydrationBreaker = createCircuitBreaker({
  name: "runtime-artifacts",
  failureThreshold: toPositiveInt(process.env.RUNTIME_ARTIFACT_BREAKER_FAIL_MAX, 3),
  cooldownMs: toPositiveInt(process.env.RUNTIME_ARTIFACT_BREAKER_COOLDOWN_MS, 60_000),
});

const getReplitClient = async (): Promise<ReplitStorageClient> => {
  if (!replitClient) {
    const { Client } = await import("@replit/object-storage");
    replitClient = new Client();
  }
  return replitClient;
};

const normalizeObjectKey = (value?: string | null): string | null => {
  const raw = value?.trim();
  if (!raw) return null;
  if (raw.startsWith("replit://")) {
    return raw.slice("replit://".length);
  }
  if (raw.startsWith("storage://")) {
    return raw.slice("storage://".length);
  }
  return raw;
};

const normalizeSha256 = (value?: string | null): string | null => {
  const raw = value?.trim().toLowerCase();
  if (!raw) return null;
  if (raw.startsWith("sha256:")) {
    return raw.slice("sha256:".length);
  }
  return raw;
};

const resolveTargetPath = (value: string): string => {
  if (path.isAbsolute(value)) {
    return value;
  }
  return path.resolve(process.cwd(), value);
};

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
};

const hashFile = async (filePath: string): Promise<string> => {
  const hash = createHash("sha256");
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
};

const logArtifactState = async (label: string, targetPath: string): Promise<void> => {
  const resolved = resolveTargetPath(targetPath);
  try {
    const stat = await fs.stat(resolved);
    const mode = (stat.mode & 0o777).toString(8).padStart(3, "0");
    console.log(
      `[runtime] ${label} state path=${resolved} size=${stat.size} mode=${mode}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[runtime] ${label} state unavailable (${message}) path=${resolved}`);
  }
};

const setArtifactStatus = (status: RuntimeArtifactStatus): void => {
  const index = artifactStatuses.findIndex((entry) => entry.label === status.label);
  if (index >= 0) {
    artifactStatuses[index] = status;
    return;
  }
  artifactStatuses.push(status);
};

const setLocalArtifactStatus = (
  label: string,
  targetPath: string,
  integrityState: RuntimeArtifactIntegrityState,
  hydrationMode: RuntimeArtifactHydrationMode,
  expectedSha: string | null,
  observedSha: string | null,
): void => {
  setArtifactStatus({
    label,
    provenance: {
      sourceClass: "local-env",
      integrityState,
      hydrationMode,
      expectedSha256: expectedSha,
      observedSha256: observedSha,
      targetPath: resolveTargetPath(targetPath),
    },
  });
};

const setHydratedArtifactStatus = (
  label: string,
  targetPath: string,
  integrityState: RuntimeArtifactIntegrityState,
  hydrationMode: RuntimeArtifactHydrationMode,
  expectedSha: string | null,
  observedSha: string | null,
): void => {
  setArtifactStatus({
    label,
    provenance: {
      sourceClass: "object-storage",
      integrityState,
      hydrationMode,
      expectedSha256: expectedSha,
      observedSha256: observedSha,
      targetPath: resolveTargetPath(targetPath),
    },
  });
};

const validateLocalArtifact = async (
  label: string,
  targetPath: string,
  expectedSha?: string | null,
): Promise<void> => {
  const resolved = resolveTargetPath(targetPath);
  if (!(await fileExists(resolved))) {
    console.warn(`[runtime] ${label} not found at ${resolved}`);
    setLocalArtifactStatus(label, targetPath, "missing", "local_only", normalizeSha256(expectedSha), null);
    return;
  }
  const expected = normalizeSha256(expectedSha);
  if (!expected) {
    console.log(`[runtime] ${label} present (${resolved})`);
    await logArtifactState(label, resolved);
    setLocalArtifactStatus(label, targetPath, "unverifiable", "local_only", null, null);
    return;
  }
  const existingHash = await hashFile(resolved);
  if (existingHash !== expected) {
    setLocalArtifactStatus(label, targetPath, "mismatch", "local_only", expected, existingHash);
    throw new Error(
      `[runtime] ${label} sha256 mismatch (expected ${expected}, got ${existingHash})`,
    );
  }
  console.log(`[runtime] ${label} verified (${resolved})`);
  await logArtifactState(label, resolved);
  setLocalArtifactStatus(label, targetPath, "verified", "local_only", expected, existingHash);
};

const downloadObject = async (key: string, targetPath: string): Promise<string> => {
  const client = await getReplitClient();
  const stream = await client.downloadAsStream(key);
  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });
  const tmpPath = `${targetPath}.tmp`;
  await pipeline(stream, createWriteStream(tmpPath));
  return tmpPath;
};

const hydrateArtifact = async (spec: ArtifactSpec): Promise<void> => {
  const expected = normalizeSha256(spec.sha256);
  if (!expected) {
    setHydratedArtifactStatus(spec.label, spec.targetPath, "unverifiable", "disabled", null, null);
    throw new Error(`[runtime] ${spec.label} sha256 is required for hydration`);
  }
  const target = resolveTargetPath(spec.targetPath);
  if (await fileExists(target)) {
    const existingHash = await hashFile(target);
    if (existingHash === expected) {
      console.log(`[runtime] ${spec.label} already hydrated (${target})`);
      await logArtifactState(spec.label, target);
      setHydratedArtifactStatus(spec.label, spec.targetPath, "verified", "already_present", expected, existingHash);
      return;
    }
    console.warn(`[runtime] ${spec.label} hash mismatch; rehydrating (${target})`);
  }

  console.log(`[runtime] downloading ${spec.label} from object storage`);
  const tmpPath = await downloadObject(spec.objectKey, target);
  try {
    const downloadedHash = await hashFile(tmpPath);
    if (downloadedHash !== expected) {
      setHydratedArtifactStatus(spec.label, spec.targetPath, "mismatch", "rehydrated", expected, downloadedHash);
      throw new Error(
        `[runtime] ${spec.label} sha256 mismatch (expected ${expected}, got ${downloadedHash})`,
      );
    }
    if (await fileExists(target)) {
      await fs.unlink(target);
    }
    await fs.rename(tmpPath, target);
    if (spec.executable) {
      try {
        await fs.chmod(target, 0o755);
      } catch (error) {
        console.warn(
          `[runtime] ${spec.label} chmod skipped (${(error as Error).message})`,
        );
      }
    }
    console.log(`[runtime] ${spec.label} hydrated (${target})`);
    await logArtifactState(spec.label, target);
    setHydratedArtifactStatus(spec.label, spec.targetPath, "verified", "rehydrated", expected, downloadedHash);
  } catch (error) {
    await fs.unlink(tmpPath).catch(() => undefined);
    throw error;
  }
};

const describeEnv = (value?: string | null, max = 12): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "(empty)";
  }
  const safe = trimmed.length > max ? `${trimmed.slice(0, max)}...` : trimmed;
  return `${safe} (len ${trimmed.length})`;
};

const isHttpRuntimeLocked = (): boolean => {
  const policy = (process.env.LLM_POLICY ?? "").trim().toLowerCase();
  if (policy === "http") return true;
  const runtime = (process.env.LLM_RUNTIME ?? "").trim().toLowerCase();
  return runtime === "http" || runtime === "openai";
};

const shouldHydrateLocalLlmArtifacts = (): boolean => {
  if (!isHttpRuntimeLocked()) return true;
  return process.env.LLM_HYDRATE_LOCAL_ARTIFACTS_IN_HTTP_MODE === "1";
};

export const getRuntimeArtifactStatuses = (): RuntimeArtifactStatus[] =>
  artifactStatuses.map((entry) => ({ ...entry, provenance: { ...entry.provenance } }));

export const hydrateRuntimeArtifacts = async (): Promise<void> => {
  artifactStatuses = [];
  const artifacts: ArtifactSpec[] = [];
  const hydrateLocalLlmArtifacts = shouldHydrateLocalLlmArtifacts();
  console.log(
    `[runtime] env LLM_LOCAL_CMD_OBJECT_KEY=${describeEnv(process.env.LLM_LOCAL_CMD_OBJECT_KEY)} ` +
      `LLM_LOCAL_CMD_SHA256=${describeEnv(process.env.LLM_LOCAL_CMD_SHA256, 16)} ` +
      `LLM_LOCAL_CMD=${describeEnv(process.env.LLM_LOCAL_CMD, 48)}`,
  );
  console.log(
    `[runtime] env LLM_LOCAL_MODEL_OBJECT_KEY=${describeEnv(process.env.LLM_LOCAL_MODEL_OBJECT_KEY)} ` +
      `LLM_LOCAL_LORA_OBJECT_KEY=${describeEnv(process.env.LLM_LOCAL_LORA_OBJECT_KEY)} ` +
      `LLM_LOCAL_INDEX_OBJECT_KEY=${describeEnv(process.env.LLM_LOCAL_INDEX_OBJECT_KEY)}`,
  );
  console.log(`[runtime] cwd=${process.cwd()}`);
  if (!hydrateLocalLlmArtifacts) {
    console.log("[runtime] explicit HTTP mode detected; skipping local LLM artifact hydration");
  }

  const cmdKey = normalizeObjectKey(process.env.LLM_LOCAL_CMD_OBJECT_KEY);
  if (hydrateLocalLlmArtifacts && cmdKey) {
    const cmdPath =
      process.env.LLM_LOCAL_CMD?.trim() ??
      ".cache/llm/llama-build/bin/llama-cli";
    const resolvedCmdPath = resolveTargetPath(cmdPath);
    process.env.LLM_LOCAL_CMD = resolvedCmdPath;
    console.log(`[runtime] llama-cli target=${resolvedCmdPath}`);
    artifacts.push({
      label: "llama-cli",
      objectKey: cmdKey,
      sha256: process.env.LLM_LOCAL_CMD_SHA256 ?? "",
      targetPath: resolvedCmdPath,
      executable: true,
    });
  }

  const indexPath =
    process.env.LLM_LOCAL_INDEX_PATH ?? "server/_generated/code-lattice.json";
  const indexKey = normalizeObjectKey(process.env.LLM_LOCAL_INDEX_OBJECT_KEY);
  if (indexKey) {
    artifacts.push({
      label: "index",
      objectKey: indexKey,
      sha256: process.env.LLM_LOCAL_INDEX_SHA256 ?? "",
      targetPath: indexPath,
    });
  } else {
    await validateLocalArtifact("index", indexPath, process.env.LLM_LOCAL_INDEX_SHA256);
  }

  const loraKey = normalizeObjectKey(process.env.LLM_LOCAL_LORA_OBJECT_KEY);
  if (hydrateLocalLlmArtifacts && loraKey) {
    const loraPath =
      process.env.LLM_LOCAL_LORA_PATH ?? "./models/lora.safetensors";
    if (!process.env.LLM_LOCAL_LORA_PATH) {
      process.env.LLM_LOCAL_LORA_PATH = loraPath;
    }
    artifacts.push({
      label: "lora",
      objectKey: loraKey,
      sha256: process.env.LLM_LOCAL_LORA_SHA256 ?? "",
      targetPath: loraPath,
    });
  }

  const modelKey = normalizeObjectKey(process.env.LLM_LOCAL_MODEL_OBJECT_KEY);
  if (hydrateLocalLlmArtifacts && modelKey) {
    artifacts.push({
      label: "model",
      objectKey: modelKey,
      sha256: process.env.LLM_LOCAL_MODEL_SHA256 ?? "",
      targetPath: process.env.LLM_LOCAL_MODEL_PATH ?? process.env.LLM_LOCAL_MODEL ?? "./models/model.gguf",
    });
  }

  if (artifacts.length === 0) {
    return;
  }

  console.log(
    `[runtime] artifact labels=${artifacts.map((artifact) => artifact.label).join(", ")}`,
  );
  console.log(`[runtime] hydrating ${artifacts.length} artifact(s)`);
  for (const artifact of artifacts) {
    await hydrateArtifact(artifact);
  }
};

export const ensureRuntimeArtifactsHydrated = (): Promise<void> => {
  if (hydrationBreaker.isOpen()) {
    throw new Error("runtime_artifacts_temporarily_unavailable");
  }
  if (!hydrationPromise) {
    hydrationPromise = hydrateRuntimeArtifacts()
      .then(() => {
        hydrationBreaker.recordSuccess();
      })
      .catch((error) => {
        hydrationPromise = null;
        hydrationBreaker.recordFailure(error);
        throw error;
      });
  }
  return hydrationPromise;
};
