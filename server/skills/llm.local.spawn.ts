import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { EssenceEnvelope } from "@shared/essence-schema";
import { appendToolLog } from "../services/observability/tool-log-store";
import { putBlob } from "../storage";
import { putEnvelope } from "../services/essence/store";
import { beginLlMJob } from "../services/hardware/gpu-scheduler";
import { llmLocalSpawnCalls, llmLocalSpawnLatency } from "../metrics";

const DEFAULT_RPM = Math.max(1, Number(process.env.LLM_LOCAL_RPM ?? 60));
const DEFAULT_MODEL = process.env.LLM_LOCAL_MODEL?.trim() || "./models/model.gguf";
const DEFAULT_CMD = process.env.LLM_LOCAL_CMD?.trim() || "./llama";
const DEFAULT_ARGS = parseArgs(process.env.LLM_LOCAL_ARGS_BASE ?? "");
const DEFAULT_MAX_TOKENS = toPositiveInt(process.env.LLM_LOCAL_MAX_TOKENS, 512);
const DEFAULT_TEMPERATURE = toNumber(process.env.LLM_LOCAL_TEMP, 0.2);
const DEFAULT_SEED = toPositiveInt(process.env.LLM_LOCAL_SEED, 42);
const TOOL_NAME = "llm.local.spawn.generate";
const TOOL_VERSION = process.env.LLM_LOCAL_SPAWN_VERSION?.trim() || "1.0.0";
const TEXT_MIME = "text/plain";

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
  const prompt = parsed.prompt;
  const cmd = process.env.LLM_LOCAL_CMD?.trim() || DEFAULT_CMD;
  const model = process.env.LLM_LOCAL_MODEL?.trim() || DEFAULT_MODEL;
  const baseArgs = parseArgs(process.env.LLM_LOCAL_ARGS_BASE ?? "") ?? DEFAULT_ARGS;
  const maxTokens = clampTokens(parsed.max_tokens ?? toPositiveInt(process.env.LLM_LOCAL_MAX_TOKENS, DEFAULT_MAX_TOKENS));
  const temperature = clampTemperature(
    parsed.temperature ?? toNumber(process.env.LLM_LOCAL_TEMP, DEFAULT_TEMPERATURE),
  );
  const seed = parsed.seed ?? toPositiveInt(process.env.LLM_LOCAL_SEED, DEFAULT_SEED);
  const started = Date.now();
  llmLocalSpawnCalls.inc();
  const startedAt = new Date(started).toISOString();
  const release = beginLlMJob();
  const args = buildArgs(baseArgs, {
    model,
    prompt,
    maxTokens,
    temperature,
    seed,
    stop: parsed.stop,
  });
  let outputText = "";
  const stderr: string[] = [];
  const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
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
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`llm spawn exit ${code}: ${stderr.join("").trim()}`));
        }
      });
    });
  } catch (err) {
    appendToolLog({
      tool: TOOL_NAME,
      version: TOOL_VERSION,
      paramsHash: hashPayload({ prompt, maxTokens, temperature, seed, cmd, args }),
      durationMs: Date.now() - started,
      sessionId,
      ok: false,
      error: serializeError(err),
      seed,
      text: `[err] ${TOOL_NAME} spawn failed`,
    });
    throw err;
  } finally {
    release();
  }

  const trimmedOutput = outputText.trim();
  const promptTokens = countTokens(prompt);
  const completionTokens = countTokens(trimmedOutput);
  const totalTokens = promptTokens + completionTokens;
  const buffer = Buffer.from(trimmedOutput, "utf8");
  const blob = await putBlob(buffer, { contentType: TEXT_MIME });
  const textHash = sha256(buffer);
  const promptHash = sha256(Buffer.from(prompt, "utf8"));
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
            value: sha256(Buffer.from(`${cmd}:${model}:${args.join(" ")}`)),
          },
          params: {
            model,
            max_tokens: maxTokens,
            temperature,
            seed,
            stop: parsed.stop,
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
  await putEnvelope(envelope);

  const durationMs = Date.now() - started;
  llmLocalSpawnLatency.observe(durationMs);
  appendToolLog({
    tool: TOOL_NAME,
    version: TOOL_VERSION,
    paramsHash: hashPayload({ prompt, maxTokens, temperature, seed, cmd, args }),
    durationMs,
    sessionId,
    ok: true,
    essenceId,
    seed,
    text: `✓ local spawn model=${model} tok<=${maxTokens}`,
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
};

function buildArgs(
  baseArgs: string[],
  opts: { model: string; prompt: string; maxTokens: number; temperature: number; seed: number; stop?: unknown },
): string[] {
  const args = [...baseArgs];
  args.push("-m", opts.model);
  args.push("-p", opts.prompt);
  args.push("-n", String(opts.maxTokens));
  args.push("--temp", String(opts.temperature));
  args.push("--seed", String(opts.seed));
  args.push("--no-color");
  if (Array.isArray(opts.stop)) {
    opts.stop.filter(Boolean).forEach((stop) => {
      args.push("--stop", String(stop));
    });
  } else if (typeof opts.stop === "string" && opts.stop) {
    args.push("--stop", opts.stop);
  }
  return args;
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

function clampTokens(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_MAX_TOKENS;
  }
  return Math.min(Math.round(value), 8_192);
}

function clampTemperature(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TEMPERATURE;
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
