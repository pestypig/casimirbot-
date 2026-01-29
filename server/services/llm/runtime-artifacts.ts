import path from "node:path";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import type { Client as ReplitStorageClient } from "@replit/object-storage";

type ArtifactSpec = {
  label: string;
  objectKey: string;
  sha256: string;
  targetPath: string;
  executable?: boolean;
};

let replitClient: ReplitStorageClient | null = null;

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

const validateLocalArtifact = async (
  label: string,
  targetPath: string,
  expectedSha?: string | null,
): Promise<void> => {
  const resolved = resolveTargetPath(targetPath);
  if (!(await fileExists(resolved))) {
    console.warn(`[runtime] ${label} not found at ${resolved}`);
    return;
  }
  const expected = normalizeSha256(expectedSha);
  if (!expected) {
    console.log(`[runtime] ${label} present (${resolved})`);
    await logArtifactState(label, resolved);
    return;
  }
  const existingHash = await hashFile(resolved);
  if (existingHash !== expected) {
    throw new Error(
      `[runtime] ${label} sha256 mismatch (expected ${expected}, got ${existingHash})`,
    );
  }
  console.log(`[runtime] ${label} verified (${resolved})`);
  await logArtifactState(label, resolved);
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
    throw new Error(`[runtime] ${spec.label} sha256 is required for hydration`);
  }
  const target = resolveTargetPath(spec.targetPath);
  if (await fileExists(target)) {
    const existingHash = await hashFile(target);
    if (existingHash === expected) {
      console.log(`[runtime] ${spec.label} already hydrated (${target})`);
      await logArtifactState(spec.label, target);
      return;
    }
    console.warn(`[runtime] ${spec.label} hash mismatch; rehydrating (${target})`);
  }

  console.log(`[runtime] downloading ${spec.label} from object storage`);
  const tmpPath = await downloadObject(spec.objectKey, target);
  try {
    const downloadedHash = await hashFile(tmpPath);
    if (downloadedHash !== expected) {
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

export const hydrateRuntimeArtifacts = async (): Promise<void> => {
  const artifacts: ArtifactSpec[] = [];
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

  const modelKey = normalizeObjectKey(process.env.LLM_LOCAL_MODEL_OBJECT_KEY);
  if (modelKey) {
    artifacts.push({
      label: "model",
      objectKey: modelKey,
      sha256: process.env.LLM_LOCAL_MODEL_SHA256 ?? "",
      targetPath: process.env.LLM_LOCAL_MODEL_PATH ?? process.env.LLM_LOCAL_MODEL ?? "./models/model.gguf",
    });
  }

  const cmdKey = normalizeObjectKey(process.env.LLM_LOCAL_CMD_OBJECT_KEY);
  if (cmdKey) {
    const cmdPath =
      process.env.LLM_LOCAL_CMD?.trim() ??
      ".cache/llm/llama-build/bin/llama-cli";
    if (!process.env.LLM_LOCAL_CMD) {
      process.env.LLM_LOCAL_CMD = cmdPath;
    }
    console.log(`[runtime] llama-cli target=${resolveTargetPath(cmdPath)}`);
    artifacts.push({
      label: "llama-cli",
      objectKey: cmdKey,
      sha256: process.env.LLM_LOCAL_CMD_SHA256 ?? "",
      targetPath: cmdPath,
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
  if (loraKey) {
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
