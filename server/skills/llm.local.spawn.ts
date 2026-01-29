import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { EssenceEnvelope } from "@shared/essence-schema";
import { appendToolLog } from "../services/observability/tool-log-store";
import { putBlob } from "../storage";
import { putEnvelopeWithPolicy } from "./provenance";
import { beginLlMJob } from "../services/hardware/gpu-scheduler";
import { llmLocalSpawnCalls, llmLocalSpawnLatency } from "../metrics";
import { resolveLocalContextTokens } from "../services/llm/local-runtime";
import { recordLocalRuntimeStats } from "../services/llm/local-runtime-stats";

const DEFAULT_RPM = Math.max(1, Number(process.env.LLM_LOCAL_RPM ?? 60));
const DEFAULT_MODEL =
  process.env.LLM_LOCAL_MODEL_PATH?.trim() ||
  process.env.LLM_LOCAL_MODEL?.trim() ||
  "./models/model.gguf";
const DEFAULT_CMD = process.env.LLM_LOCAL_CMD?.trim() || "./llama";
const DEFAULT_ARGS = parseArgs(process.env.LLM_LOCAL_ARGS_BASE ?? "");
const DEFAULT_MAX_TOKENS = toPositiveInt(process.env.LLM_LOCAL_MAX_TOKENS, 512);
const DEFAULT_TEMPERATURE = toNumber(process.env.LLM_LOCAL_TEMP, 0.2);
const DEFAULT_SEED = toPositiveInt(process.env.LLM_LOCAL_SEED, 42);
const DEFAULT_TIMEOUT_MS = toPositiveInt(process.env.LLM_LOCAL_SPAWN_TIMEOUT_MS, 60_000);
const DEFAULT_CONCURRENCY = Math.max(1, Number(process.env.LLM_LOCAL_CONCURRENCY ?? 1));
const DEFAULT_STOP_FLAG = process.env.LLM_LOCAL_STOP_FLAG?.trim() || "--stop";
const TOOL_NAME = "llm.local.spawn.generate";
const TOOL_VERSION = process.env.LLM_LOCAL_SPAWN_VERSION?.trim() || "1.0.0";
const TEXT_MIME = "text/plain";
const PROMPT_INLINE_MAX = 8000;
const PROMPT_FILE_DIR = resolve(process.env.LLM_LOCAL_PROMPT_DIR?.trim() || "tmp/llm-prompts");
let activeSpawns = 0;
const spawnWaiters: Array<() => void> = [];

const resolveExecutable = (value: string): string => {
  if (!value) return value;
  if (value.startsWith(".") || value.includes("/") || value.includes("\\")) {
    return resolve(value);
  }
  return value;
};

const acquireSpawnSlot = async (): Promise<() => void> => {
  if (activeSpawns < DEFAULT_CONCURRENCY) {
    activeSpawns += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      activeSpawns = Math.max(0, activeSpawns - 1);
      const next = spawnWaiters.shift();
      if (next) next();
    };
  }
  return new Promise((resolve) => {
    spawnWaiters.push(() => {
      activeSpawns += 1;
      let released = false;
      resolve(() => {
        if (released) return;
        released = true;
        activeSpawns = Math.max(0, activeSpawns - 1);
        const next = spawnWaiters.shift();
        if (next) next();
      });
    });
  });
};

const GenerateInput = z.object({
  prompt: z.string().min(1, "prompt required"),
  max_tokens: z.number().int().positive().max(8_192).optional(),
  temperature: z.number().min(0).max(2).optional(),
  seed: z.number().int().nonnegative().optional(),
  stop: z.union([z.string(), z.array(z.string().min(1))]).optional(),
  metadata: z.record(z.any()).optional(),
});

const GenerateOutput = z.object({
  text: z.string(),
  model: z.string(),
  essence_id: z.string(),
  seed: z.number().int().nonnegative(),
  duration_ms: z.number().int().nonnegative(),
  usage: z
    .object({
      prompt_tokens: z.number().int().nonnegative().optional(),
      completion_tokens: z.number().int().nonnegative().optional(),
      total_tokens: z.number().int().nonnegative().optional(),
      max_tokens: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export type LocalSpawnInput = z.infer<typeof GenerateInput>;
export type LocalSpawnOutput = z.infer<typeof GenerateOutput>;

export const llmLocalSpawnSpec: ToolSpecShape = {
  name: TOOL_NAME,
  desc: "Local LLM via spawned binary (no HTTP)",
  inputSchema: GenerateInput,
  outputSchema: GenerateOutput,
  deterministic: false,
  rateLimit: { rpm: DEFAULT_RPM },
  safety: { risks: [] },
};

export const llmLocalSpawnHandler: ToolHandler = async (rawInput, ctx): Promise<LocalSpawnOutput> => {
  const parsed = GenerateInput.parse(rawInput ?? {});
  const personaId = (ctx?.personaId as string) || "persona:unknown";
  const sessionId = (ctx?.sessionId as string) || undefined;
  const traceId = (ctx?.traceId as string) || undefined;
  const prompt = parsed.prompt;
  let promptFilePath: string | null = null;
  const { ensureRuntimeArtifactsHydrated } = await import("../services/llm/runtime-artifacts");
  await ensureRuntimeArtifactsHydrated();
  const cmd = resolveExecutable(process.env.LLM_LOCAL_CMD?.trim() || DEFAULT_CMD);
  const model =
    process.env.LLM_LOCAL_MODEL_PATH?.trim() ||
    process.env.LLM_LOCAL_MODEL?.trim() ||
    DEFAULT_MODEL;
  const loraPathRaw = process.env.LLM_LOCAL_LORA_PATH?.trim() || "";
  const loraPath = resolveLoraPath(loraPathRaw);
  const loraScaleRaw = process.env.LLM_LOCAL_LORA_SCALE?.trim();
  const loraScale =
    loraScaleRaw && loraScaleRaw.length > 0
      ? clampLoraScale(toNumber(loraScaleRaw, 1))
      : undefined;
  const baseArgs = parseArgs(process.env.LLM_LOCAL_ARGS_BASE ?? "") ?? DEFAULT_ARGS;
  const cpuBackend = resolveCpuBackend(cmd, process.env.LLM_LOCAL_CPU_BACKEND?.trim());
  prepareCpuBackend(cmd, cpuBackend);
  const promptTokens = countTokens(prompt);
  const contextTokens = resolveLocalContextTokens();
  const maxTokensRequested = clampTokens(
    parsed.max_tokens ?? toPositiveInt(process.env.LLM_LOCAL_MAX_TOKENS, DEFAULT_MAX_TOKENS),
  );
  const maxTokens = clampCompletionTokens(maxTokensRequested, promptTokens, contextTokens);
  const temperature = clampTemperature(
    parsed.temperature ?? toNumber(process.env.LLM_LOCAL_TEMP, DEFAULT_TEMPERATURE),
  );
  const seed = parsed.seed ?? toPositiveInt(process.env.LLM_LOCAL_SEED, DEFAULT_SEED);
  const timeoutMs = toPositiveInt(process.env.LLM_LOCAL_SPAWN_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const started = Date.now();
  llmLocalSpawnCalls.inc();
  const startedAt = new Date(started).toISOString();
  const release = beginLlMJob();
  let releaseSpawn: (() => void) | null = null;
  let stopFlag = DEFAULT_STOP_FLAG;
  const cleanupPromptFile = () => {
    if (!promptFilePath) return;
    try {
      unlinkSync(promptFilePath);
    } catch {
      // best-effort cleanup
    }
    promptFilePath = null;
  };
  const buildSpawnArgs = (override?: { loraPath?: string; loraScale?: number }) =>
    buildArgs(baseArgs, {
      model,
      prompt,
      promptFile: promptFilePath ?? undefined,
      maxTokens,
      contextTokens,
      temperature,
      seed,
      stop: parsed.stop,
      stopFlag,
      loraPath: override?.loraPath ?? loraPath,
      loraScale: override?.loraScale ?? loraScale,
    });
  let args = buildSpawnArgs();
  let usedArgs = args;
  let activeLoraPath = loraPath;
  let activeLoraScale = loraScale;
  const promptHash = sha256(Buffer.from(prompt, "utf8"));
  let outputText = "";
  const stderr: string[] = [];
  let timedOut = false;
  const runSpawn = async (spawnArgs: string[]) => {
    outputText = "";
    stderr.length = 0;
    const child = spawn(cmd, spawnArgs, { stdio: ["ignore", "pipe", "pipe"] });
    const timeout = setTimeout(() => {
      timedOut = true;
      try {
        child.kill();
      } catch {
        // Ignore failures on teardown.
      }
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      outputText += chunk;
      emitToken(ctx, chunk);
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => stderr.push(chunk));
    try {
      await new Promise<void>((resolve, reject) => {
        child.on("error", reject);
        child.on("close", (code) => {
          if (code === 0 && !timedOut) {
            resolve();
          } else {
            const reason = timedOut
              ? `llm spawn timeout after ${timeoutMs}ms`
              : `llm spawn exit ${code}: ${stderr.join("").trim()}`;
            reject(new Error(reason));
          }
        });
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  let lastSpawnError: unknown;
  let spawnDiagLogged = false;
  let triedStopFlagFallback = false;
  const attempt = async (spawnArgs: string[]): Promise<boolean> => {
    try {
      timedOut = false;
      usedArgs = spawnArgs;
      await runSpawn(spawnArgs);
      lastSpawnError = null;
      return true;
    } catch (error) {
      lastSpawnError = error;
      if (!spawnDiagLogged) {
        spawnDiagLogged = true;
        logSpawnFailureDiagnostics(error, cmd);
      }
      return false;
    }
  };
  let lastError: unknown;
  let triedNoLora = false;
  try {
    releaseSpawn = await acquireSpawnSlot();
    if (shouldUsePromptFile(prompt)) {
      try {
        mkdirSync(PROMPT_FILE_DIR, { recursive: true });
        promptFilePath = resolve(PROMPT_FILE_DIR, `prompt-${randomUUID()}.txt`);
        writeFileSync(promptFilePath, prompt, "utf8");
      } catch {
        promptFilePath = null;
      }
      args = buildSpawnArgs();
    }
    const missingDeps = verifyWindowsBinaryDeps(cmd, cpuBackend);
    if (missingDeps.length) {
      throw new Error(
        `llm spawn missing runtime DLL(s): ${missingDeps.join(", ")}. ` +
          `Ensure they exist next to ${basename(cmd)} or reinstall the llama prebuilt bundle.`,
      );
    }
    if (await attempt(args)) {
      return await finalizeSuccess();
    }
    const error = lastSpawnError ?? new Error("llm spawn failed");
    lastError = error;
    const message = error instanceof Error ? error.message : String(error);
    const stopFlagFallback =
      stopFlag === "--stop" ? "--reverse-prompt" : "--stop";
    const stopFlagInvalid =
      parsed.stop &&
      !triedStopFlagFallback &&
      /invalid argument|unknown argument|unrecognized option/i.test(message) &&
      message.includes(stopFlag);
    if (stopFlagInvalid) {
      triedStopFlagFallback = true;
      stopFlag = stopFlagFallback;
      const retryArgs = buildSpawnArgs({ loraPath: loraPath, loraScale });
      if (await attempt(retryArgs)) {
        return await finalizeSuccess();
      }
    }
    const isAccessViolation = /3221225477|0xC0000005/i.test(message);
    const isMissingDll =
      /3221225781|0xC0000135|module could not be found/i.test(message);
    const isBackendLoad = /load_backend/i.test(message);
    if (loraPath && isAccessViolation) {
      const noLoraArgs = buildSpawnArgs({ loraPath: "", loraScale: undefined });
      triedNoLora = true;
      if (await attempt(noLoraArgs)) {
        activeLoraPath = "";
        activeLoraScale = undefined;
        return await finalizeSuccess();
      }
    }
    if (loraPath && !triedNoLora && isBackendLoad) {
      const noLoraArgs = buildSpawnArgs({ loraPath: "", loraScale: undefined });
      triedNoLora = true;
      if (await attempt(noLoraArgs)) {
        activeLoraPath = "";
        activeLoraScale = undefined;
        return await finalizeSuccess();
      }
    }
    if (process.platform === "win32" && isMissingDll) {
      throw new Error(
        `${message}. Missing Windows runtime DLLs. Install the Microsoft Visual C++ 2015-2022 Redistributable (x64) and restart.`,
      );
    }
    const shouldTryNoMmap =
      process.platform === "win32" &&
      isAccessViolation &&
      !args.includes("--no-mmap") &&
      !args.includes("--mmap");
    if (shouldTryNoMmap) {
      const retryArgs = [...args, "--no-mmap"];
      if (await attempt(retryArgs)) {
        return await finalizeSuccess();
      }
    }
    if (process.platform === "win32" && isAccessViolation) {
      const availableBackends = listCpuBackends(cmd).filter((entry) => entry !== "haswell");
      const fallbackOrder = Array.from(new Set(["sse42", "x64", ...availableBackends]));
      const retryArgs = args.includes("--no-mmap") ? args : [...args, "--no-mmap"];
      for (const backend of fallbackOrder) {
        if (!applyCpuBackend(cmd, backend)) {
          continue;
        }
        if (await attempt(retryArgs)) {
          return await finalizeSuccess();
        }
      }
    }
    if (isAccessViolation) {
      const available = listCpuBackends(cmd);
      const hint = available.length
        ? ` Available CPU backends: ${available.join(", ")}.`
        : " No alternate CPU backends were found.";
      const finalMessage = `${message}.${hint} Set LLM_LOCAL_CPU_BACKEND to a supported backend (sse42/x64), or install a compatible llama prebuilt.`;
      throw new Error(finalMessage);
    }
    const isMemoryAlloc =
      /failed to allocate|unable to allocate|alloc_tensor_range|ggml_backend_cpu_buffer_type_alloc_buffer/i.test(
        message,
      );
    if (isMemoryAlloc) {
      throw new Error(
        `${message}. Likely insufficient contiguous RAM. Close heavy apps, reboot, reduce model size/context, or remove --no-mmap.`,
      );
    }
    throw error;
  } catch (err) {
    lastError = err;
    const memory = process.memoryUsage();
    recordLocalRuntimeStats({
      ts: new Date().toISOString(),
      durationMs: Date.now() - started,
      promptTokens,
      completionTokens: 0,
      totalTokens: promptTokens,
      maxTokens,
      contextTokens,
      memory: {
        rssBytes: memory.rss,
        heapUsedBytes: memory.heapUsed,
        heapTotalBytes: memory.heapTotal,
        externalBytes: memory.external,
        arrayBuffersBytes: memory.arrayBuffers,
      },
    });
    appendToolLog({
      tool: TOOL_NAME,
      version: TOOL_VERSION,
      paramsHash: hashPayload({
        prompt,
        maxTokens,
        contextTokens,
        temperature,
        seed,
        cmd,
        args: usedArgs,
        loraPath: activeLoraPath,
        loraScale: activeLoraScale,
      }),
      promptHash,
      durationMs: Date.now() - started,
      sessionId,
      traceId,
      ok: false,
      error: serializeError(err),
      seed,
      text: `[err] ${TOOL_NAME} spawn failed`,
    });
    throw lastError;
  } finally {
    cleanupPromptFile();
    release();
    if (releaseSpawn) {
      releaseSpawn();
    }
  }

  async function finalizeSuccess(): Promise<LocalSpawnOutput> {
    const trimmedOutput = stripCliNoise(outputText);
    const completionTokens = countTokens(trimmedOutput);
    const totalTokens = promptTokens + completionTokens;
    const memory = process.memoryUsage();
    recordLocalRuntimeStats({
      ts: new Date().toISOString(),
      durationMs: Date.now() - started,
      promptTokens,
      completionTokens,
      totalTokens,
      maxTokens,
      contextTokens,
      memory: {
        rssBytes: memory.rss,
        heapUsedBytes: memory.heapUsed,
        heapTotalBytes: memory.heapTotal,
        externalBytes: memory.external,
        arrayBuffersBytes: memory.arrayBuffers,
      },
    });
    const buffer = Buffer.from(trimmedOutput, "utf8");
    const blob = await putBlob(buffer, { contentType: TEXT_MIME });
    const textHash = sha256(buffer);
    const essenceId = randomUUID();
    const envelope = EssenceEnvelope.parse({
      header: {
        id: essenceId,
        version: "essence/1.0",
        modality: "text",
        created_at: startedAt,
        source: {
          uri: blob.uri,
          cid: blob.cid,
          original_hash: { algo: "sha256", value: textHash },
          mime: TEXT_MIME,
          creator_id: personaId,
          license: parsed.metadata?.license ?? "CC-BY-4.0",
        },
        rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
        acl: { visibility: "private", groups: [] },
      },
      features: {
        text: {
          lang: parsed.metadata?.language ?? "en",
          token_counts: {
            prompt: promptTokens,
            completion: completionTokens,
            total: totalTokens,
          },
        },
      },
      embeddings: [],
      provenance: {
        pipeline: [
          {
            name: TOOL_NAME,
            impl_version: TOOL_VERSION,
            lib_hash: {
              algo: "sha256",
              value: sha256(Buffer.from(`${cmd}:${model}:${usedArgs.join(" ")}`)),
            },
            params: {
              model,
              max_tokens: maxTokens,
              context_tokens: contextTokens,
              temperature,
              seed,
              stop: parsed.stop,
              lora_path: activeLoraPath || undefined,
              lora_scale: activeLoraPath ? activeLoraScale : undefined,
              metadata: parsed.metadata,
            },
            seed: String(seed),
            input_hash: { algo: "sha256", value: promptHash },
            output_hash: { algo: "sha256", value: textHash },
            started_at: startedAt,
            ended_at: new Date().toISOString(),
          },
        ],
        merkle_root: { algo: "sha256", value: textHash },
        previous: null,
        signatures: [],
      },
    });
    await putEnvelopeWithPolicy(envelope);

    const durationMs = Date.now() - started;
    llmLocalSpawnLatency.observe(durationMs);
    appendToolLog({
      tool: TOOL_NAME,
      version: TOOL_VERSION,
      paramsHash: hashPayload({
        prompt,
        maxTokens,
        contextTokens,
        temperature,
        seed,
        cmd,
        args: usedArgs,
        loraPath: activeLoraPath,
        loraScale: activeLoraScale,
      }),
      promptHash,
      durationMs,
      sessionId,
      traceId,
      ok: true,
      essenceId,
      seed,
      text: formatLogText({
        model,
        maxTokens,
        contextTokens,
        loraPath: activeLoraPath,
        memoryRssBytes: memory.rss,
      }),
    });

    return GenerateOutput.parse({
      text: trimmedOutput,
      model,
      essence_id: essenceId,
      seed,
      duration_ms: durationMs,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        max_tokens: maxTokens,
      },
    });
  }

  return await finalizeSuccess();
};

function listCpuBackends(cmdPath: string): string[] {
  if (process.platform !== "win32") return [];
  const resolved = resolve(cmdPath);
  if (!existsSync(resolved)) return [];
  const binDir = dirname(resolved);
  const candidates: string[] = [];
  const collect = (dir: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.startsWith("ggml-cpu-") || !entry.endsWith(".dll")) continue;
      if (entry.endsWith(".bak")) continue;
      const backend = entry.replace(/^ggml-cpu-/, "").replace(/\.dll$/, "");
      if (backend) candidates.push(backend);
    }
  };
  collect(binDir);
  collect(resolve(binDir, "generic"));
  return Array.from(new Set(candidates));
}

function verifyWindowsBinaryDeps(cmdPath: string, backendOverride?: string): string[] {
  if (process.platform !== "win32") return [];
  const resolved = resolve(cmdPath);
  if (!existsSync(resolved)) return [];
  const binDir = dirname(resolved);
  const required = ["llama.dll", "ggml.dll", "ggml-base.dll", "libomp140.x86_64.dll"];
  const missing: string[] = [];
  for (const file of required) {
    if (!existsSync(resolve(binDir, file))) {
      missing.push(file);
    }
  }
  const backend = backendOverride ?? resolveCpuBackend(cmdPath, backendOverride);
  if (backend) {
    const backendFile = `ggml-cpu-${backend}.dll`;
    const backendPath = resolve(binDir, backendFile);
    const backendBak = resolve(binDir, `${backendFile}.bak`);
    if (!existsSync(backendPath) && !existsSync(backendBak)) {
      missing.push(backendFile);
    }
  } else if (!listCpuBackends(cmdPath).length) {
    missing.push("ggml-cpu-<backend>.dll");
  }
  return missing;
}

function resolveCpuBackend(cmdPath: string, override?: string): string {
  if (override) return override;
  if (process.platform !== "win32") return "";
  const available = listCpuBackends(cmdPath);
  if (available.includes("sse42")) return "sse42";
  if (available.includes("x64")) return "x64";
  return "";
}

function prepareCpuBackend(cmdPath: string, backendOverride?: string): void {
  if (process.platform != "win32") {
    return;
  }
  const backend = backendOverride ?? process.env.LLM_LOCAL_CPU_BACKEND?.trim();
  if (!backend) {
    return;
  }
  const resolved = resolve(cmdPath);
  if (!existsSync(resolved)) {
    return;
  }
  const binDir = dirname(resolved);
  let entries: string[];
  try {
    entries = readdirSync(binDir);
  } catch {
    return;
  }
  const target = `ggml-cpu-${backend}.dll`;
  const targetBak = `${target}.bak`;
  if (!entries.includes(target) && !entries.includes(targetBak)) {
    const genericDir = resolve(binDir, "generic");
    const genericTarget = resolve(genericDir, target);
    if (existsSync(genericTarget)) {
      try {
        copyFileSync(genericTarget, resolve(binDir, target));
        entries = readdirSync(binDir);
      } catch {
        return;
      }
    }
  }
  if (entries.includes(targetBak) && !entries.includes(target)) {
    try {
      renameSync(resolve(binDir, targetBak), resolve(binDir, target));
    } catch {
      return;
    }
  }
  for (const entry of entries) {
    if (!entry.startsWith("ggml-cpu-") || !entry.endsWith(".dll")) {
      continue;
    }
    if (entry == target) {
      continue;
    }
    try {
      renameSync(resolve(binDir, entry), resolve(binDir, `${entry}.bak`));
    } catch {
      return;
    }
  }
}

function applyCpuBackend(cmdPath: string, backend: string): boolean {
  if (process.platform != "win32") {
    return false;
  }
  const resolved = resolve(cmdPath);
  if (!existsSync(resolved)) {
    return false;
  }
  const binDir = dirname(resolved);
  let entries: string[];
  try {
    entries = readdirSync(binDir);
  } catch {
    return false;
  }
  const target = `ggml-cpu-${backend}.dll`;
  const targetBak = `${target}.bak`;
  const hasTarget = entries.includes(target);
  const hasBak = entries.includes(targetBak);
  if (!hasTarget && !hasBak) {
    const genericDir = resolve(binDir, "generic");
    const genericTarget = resolve(genericDir, target);
    if (!existsSync(genericTarget)) {
      return false;
    }
    try {
      copyFileSync(genericTarget, resolve(binDir, target));
      entries = readdirSync(binDir);
    } catch {
      return false;
    }
  }
  if (hasBak && !hasTarget) {
    try {
      renameSync(resolve(binDir, targetBak), resolve(binDir, target));
    } catch {
      return false;
    }
  }
  for (const entry of entries) {
    if (!entry.startsWith("ggml-cpu-") || !entry.endsWith(".dll")) {
      continue;
    }
    if (entry === target) {
      continue;
    }
    try {
      renameSync(resolve(binDir, entry), resolve(binDir, `${entry}.bak`));
    } catch {
      return false;
    }
  }
  return true;
}

function stripCliNoise(output: string): string {
  const raw = output.trim();
  if (!raw) {
    return raw;
  }
  const lines = raw.split(/\r?\n/);
  const hasBanner = lines.some((line) => isCliBannerLine(line));
  if (!hasBanner) {
    return raw;
  }
  let startIdx = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim().startsWith(">")) {
      startIdx = i + 1;
    }
  }
  const cleaned = lines
    .slice(startIdx)
    .filter((line) => !isCliNoiseLine(line))
    .join("\n")
    .trim();
  return cleaned || raw;
}

function isCliBannerLine(line: string): boolean {
  const trimmed = line.trim().toLowerCase();
  return (
    trimmed.startsWith("loading model") ||
    /^build\s*:/.test(trimmed) ||
    /^model\s*:/.test(trimmed) ||
    /^modalities\s*:/.test(trimmed) ||
    trimmed.startsWith("available commands") ||
    trimmed.startsWith("/exit") ||
    trimmed.startsWith("/regen") ||
    trimmed.startsWith("/clear") ||
    trimmed.startsWith("/read")
  );
}

function isCliNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  if (lower.startsWith(">")) {
    return true;
  }
  if (lower.startsWith("exiting")) {
    return true;
  }
  if (lower.includes("prompt:") && lower.includes("t/s")) {
    return true;
  }
  if (lower.includes("generation:") && lower.includes("t/s")) {
    return true;
  }
  return isCliBannerLine(trimmed);
}

function buildArgs(
  baseArgs: string[],
  opts: {
    model: string;
    prompt: string;
    promptFile?: string;
    maxTokens: number;
    contextTokens: number;
    temperature: number;
    seed: number;
    stop?: unknown;
    stopFlag?: string;
    loraPath?: string;
    loraScale?: number;
  },
): string[] {
  const args = sanitizeBaseArgs(baseArgs);
  args.push("-m", opts.model);
  if (opts.promptFile) {
    args.push("-f", opts.promptFile);
  } else {
    args.push("-p", opts.prompt);
  }
  args.push("-n", String(opts.maxTokens));
  args.push("--ctx-size", String(opts.contextTokens));
  args.push("--temp", String(opts.temperature));
  args.push("--seed", String(opts.seed));
  const hasLogFlag = args.some((arg) => arg.startsWith("--log-"));
  const hasDisplayPromptFlag = args.includes("--display-prompt") || args.includes("--no-display-prompt");
  const disableLogs = (process.env.LLM_LOCAL_LOG_DISABLE ?? "1") !== "0";
  const displayPrompt = process.env.LLM_LOCAL_DISPLAY_PROMPT === "1";
  args.push("--simple-io");
  if (!hasLogFlag && disableLogs) {
    args.push("--log-disable");
  }
  if (!hasDisplayPromptFlag) {
    args.push(displayPrompt ? "--display-prompt" : "--no-display-prompt");
  }
  if (process.env.LLM_LOCAL_DISABLE_SINGLE_TURN !== "1") {
    args.push("--single-turn");
  }
  if (opts.loraPath) {
    args.push("--lora", opts.loraPath);
    if (typeof opts.loraScale === "number" && Number.isFinite(opts.loraScale)) {
      args.push("--lora-scale", String(opts.loraScale));
    }
  }
  const stopFlag = opts.stopFlag?.trim() || "--stop";
  if (Array.isArray(opts.stop)) {
    opts.stop.filter(Boolean).forEach((stop) => {
      args.push(stopFlag, String(stop));
    });
  } else if (typeof opts.stop === "string" && opts.stop) {
    args.push(stopFlag, opts.stop);
  }
  return args;
}

function shouldUsePromptFile(prompt: string): boolean {
  return /[\r\n]/.test(prompt) || prompt.length > PROMPT_INLINE_MAX;
}

function sanitizeBaseArgs(baseArgs: string[]): string[] {
  if (!baseArgs.length) {
    return [];
  }
  const sanitized: string[] = [];
  let skipNext = false;
  const skipFlags = new Set(["--ctx-size", "-c", "--n-gpu-layers", "-ngl"]);
  for (const token of baseArgs) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    if (skipFlags.has(token)) {
      skipNext = true;
      continue;
    }
    if (
      token.startsWith("--ctx-size=") ||
      token.startsWith("-c=") ||
      token.startsWith("--n-gpu-layers=") ||
      token.startsWith("-ngl=")
    ) {
      continue;
    }
    sanitized.push(token);
  }
  return sanitized;
}

function parseArgs(value: string): string[] {
  if (!value) {
    return [];
  }
  const tokens = value.match(/"([^"]*)"|'([^']*)'|[^\s]+/g);
  if (!tokens) {
    return [];
  }
  return tokens.map((token) => token.replace(/^(['"])(.*)\1$/, "$2"));
}

function resolveLoraPath(value: string): string {
  if (!value) {
    return "";
  }
  const resolved = resolve(value);
  if (!existsSync(resolved)) {
    return "";
  }
  try {
    if (!statSync(resolved).isFile()) {
      return "";
    }
  } catch {
    return "";
  }
  const lower = resolved.toLowerCase();
  if (!lower.endsWith(".gguf") && !lower.endsWith(".bin")) {
    return "";
  }
  return resolved;
}

function clampTokens(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_MAX_TOKENS;
  }
  return Math.min(Math.round(value), 8_192);
}

function clampCompletionTokens(value: number, promptTokens: number, contextTokens: number): number {
  const available = Math.max(0, contextTokens - promptTokens);
  if (available <= 0) {
    return 1;
  }
  return Math.min(Math.max(1, Math.floor(value)), available);
}

function clampTemperature(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TEMPERATURE;
  }
  return Math.min(Math.max(value, 0), 2);
}

function clampLoraScale(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(Math.max(value, 0), 2);
}

function toPositiveInt(value: string | number | undefined, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return fallback;
  }
  return Math.round(num);
}

function toNumber(value: string | number | undefined, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return num;
}

function emitToken(ctx: any, chunk: string): void {
  const emitter = ctx?.onToken ?? ctx?.emitToken ?? ctx?.sendToken;
  if (typeof emitter === "function") {
    emitter(chunk);
  }
}

const countTokens = (text: string): number => {
  const normalized = text.trim();
  if (!normalized) {
    return 0;
  }
  return normalized.split(/\s+/).length;
};

const sha256 = (buffer: Buffer): string => createHash("sha256").update(buffer).digest("hex");

const hashPayload = (payload: unknown): string => {
  try {
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 16);
  } catch {
    return "hash_error";
  }
};

const formatLogText = (input: {
  model: string;
  maxTokens: number;
  contextTokens: number;
  loraPath?: string;
  memoryRssBytes: number;
}): string => {
  const parts = [
    "ok",
    `model=${input.model}`,
    `ctx=${input.contextTokens}`,
    `tok<=${input.maxTokens}`,
    `rss=${formatBytes(input.memoryRssBytes)}`,
  ];
  if (input.loraPath) {
    parts.push(`lora=${input.loraPath}`);
  }
  return parts.join(" ");
};

const formatBytes = (bytes: number): string => {
  const mb = Math.round(bytes / (1024 * 1024));
  return `${mb}MB`;
};

const serializeError = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message || err.name;
  }
  if (typeof err === "string") {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};

const logSpawnFailureDiagnostics = (error: unknown, cmd: string): void => {
  try {
    const resolved = resolve(cmd);
    const cwd = process.cwd();
    const exists = existsSync(resolved);
    let statInfo = "stat=missing";
    if (exists) {
      const stat = statSync(resolved);
      const mode = (stat.mode & 0o777).toString(8).padStart(3, "0");
      statInfo = `size=${stat.size} mode=${mode}`;
    }
    const parent = dirname(resolved);
    let entries: string[] = [];
    try {
      entries = readdirSync(parent);
    } catch {
      entries = [];
    }
    const entrySample = entries.slice(0, 8).join(", ");
    const errMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      `[llm.local.spawn] spawn diagnostics err=${errMessage} cwd=${cwd} cmd=${cmd} resolved=${resolved} exists=${exists} ${statInfo} parent=${parent} entries=${entrySample}`,
    );
  } catch (logError) {
    const message = logError instanceof Error ? logError.message : String(logError);
    console.warn(`[llm.local.spawn] spawn diagnostics failed: ${message}`);
  }
};


