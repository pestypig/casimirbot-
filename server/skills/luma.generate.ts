import { createHash, randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { EssenceEnvelope } from "@shared/essence-schema";
import { putEnvelope } from "../services/essence/store";
import { essenceHub } from "../services/essence/events";
import { putBlob } from "../storage";
import { persistEssencePacket } from "../db/essence";
import { enqueueMediaJob, registerMediaWorker } from "../queue";
import { acquireMediaSlot } from "../services/hardware/gpu-scheduler";

const DEFAULT_ENGINE = process.env.DIFF_ENGINE?.trim() || "sd15-lcm";
const DEFAULT_STEPS = clampSteps(Number(process.env.DIFF_STEPS ?? 4));
const DEFAULT_SLICING = process.env.DIFF_SLICING ? process.env.DIFF_SLICING !== "false" : true;
const DEFAULT_VERSION = process.env.DIFF_MODEL_VERSION?.trim() || "2025.09-lcm";
const DEFAULT_LORA = process.env.LORA_ADAPTER?.trim() || "lcm-lora-v1";
const DEFAULT_GUIDANCE = 4.5;
const LUMA_RATE_LIMIT_RPM = Math.max(1, Number(process.env.LUMA_GENERATE_RPM ?? 30));
const MAX_DIMENSION = 1024;
const MIN_DIMENSION = 64;
const SVG_MIME = "image/svg+xml";

const DiffusionRequest = z.object({
  prompt: z.string().min(3, "prompt required"),
  negative_prompt: z.string().optional(),
  width: z.number().int().min(MIN_DIMENSION).max(MAX_DIMENSION).default(512),
  height: z.number().int().min(MIN_DIMENSION).max(MAX_DIMENSION).default(512),
  steps: z.number().int().min(1).max(50).default(DEFAULT_STEPS),
  guidance: z.number().min(0).max(20).default(DEFAULT_GUIDANCE),
  seed: z.number().int().nonnegative().optional(),
  lora: z.string().optional(),
  slicing: z.boolean().optional(),
});

const DiffusionResponse = z.object({
  essence_id: z.string(),
  data_url: z.string(),
  mime: z.string(),
  width: z.number(),
  height: z.number(),
  prompt: z.string(),
  negative_prompt: z.string().optional(),
  seed: z.number(),
  steps: z.number(),
  guidance: z.number(),
  slicing: z.boolean(),
  lora_adapter: z.string(),
  model: z.string(),
  version: z.string(),
});

export const lumaGenerateSpec: ToolSpecShape = {
  name: "luma.generate",
  desc: "LCM-LoRA stable diffusion adapter (4 steps, slicing) with Essence provenance",
  inputSchema: DiffusionRequest,
  outputSchema: DiffusionResponse,
  deterministic: false,
  rateLimit: { rpm: LUMA_RATE_LIMIT_RPM },
  safety: { risks: ["writes_files"] },
};

type DiffusionInput = z.infer<typeof DiffusionRequest>;
type SvgArgs = Pick<DiffusionInput, "prompt" | "width" | "height"> & { seed: number };

const BYPASS_QUEUE = process.env.MEDIA_QUEUE_BYPASS === "1";

registerMediaWorker(async ({ input, ctx }) => runLocalLumaGeneration(input, ctx));

export const lumaGenerateHandler: ToolHandler = async (rawInput, ctx) => {
  if (BYPASS_QUEUE) {
    return runLocalLumaGeneration(rawInput, ctx);
  }
  return (await enqueueMediaJob({ input: rawInput, ctx })) as Awaited<ReturnType<typeof runLocalLumaGeneration>>;
};

async function runLocalLumaGeneration(rawInput: unknown, ctx: any) {
  const parsed = DiffusionRequest.parse(rawInput ?? {});
  const seed = parsed.seed ?? randomInt(0, 2 ** 32);
  const steps = clampSteps(parsed.steps ?? DEFAULT_STEPS);
  const slicing = parsed.slicing ?? DEFAULT_SLICING;
  const loraAdapter = parsed.lora?.trim() || DEFAULT_LORA;
  const now = new Date().toISOString();
  const essenceId = randomUUID();
  const model = DEFAULT_ENGINE;
  const version = DEFAULT_VERSION;
  const creatorId = (ctx?.personaId as string) || "luma.generate";

  const releaseGpu = await acquireMediaSlot();
  try {
    const svgBuffer = buildSvgPreview({
      prompt: parsed.prompt,
      width: parsed.width,
      height: parsed.height,
      seed,
    });
    const blob = await putBlob(svgBuffer, { contentType: SVG_MIME });
    const assetUri = blob.uri;
    if (!assetUri) {
      throw new Error("storage backend did not return a URI for generated asset");
    }
    const outputHash = sha256(svgBuffer);
    const promptHash = sha256(Buffer.from(parsed.prompt, "utf8"));

    const envelope = EssenceEnvelope.parse({
      header: {
        id: essenceId,
        version: "essence/1.0",
        modality: "image",
        created_at: now,
        source: {
          uri: assetUri,
          original_hash: { algo: "sha256", value: outputHash },
          width: parsed.width,
          height: parsed.height,
          mime: SVG_MIME,
          creator_id: creatorId,
          license: "CC-BY-NC-4.0",
          cid: blob.cid,
        },
        rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
        acl: { visibility: "private", groups: [] },
      },
      features: {
        image: {
          width: parsed.width,
          height: parsed.height,
        },
        text: {
          lang: "prompt",
        },
      },
      embeddings: [],
      provenance: {
        pipeline: [
          {
            name: "stable-diffusion",
            impl_version: version,
            lib_hash: { algo: "sha256", value: sha256(Buffer.from(`${model}:${version}`)) },
            params: {
              prompt: parsed.prompt,
              negative_prompt: parsed.negative_prompt ?? "",
              width: parsed.width,
              height: parsed.height,
              steps,
              guidance: parsed.guidance,
              slicing,
              lora_adapter: loraAdapter,
              engine: model,
            },
            seed: String(seed),
            input_hash: { algo: "sha256", value: promptHash },
            output_hash: { algo: "sha256", value: outputHash },
            started_at: now,
            ended_at: now,
          },
        ],
        merkle_root: { algo: "sha256", value: outputHash },
        previous: null,
        signatures: [],
      },
    });

    await putEnvelope(envelope);
    await persistEssencePacket({
      id: `${essenceId}:image`,
      envelope_id: essenceId,
      uri: assetUri,
      cid: blob.cid,
      content_type: blob.contentType,
      bytes: blob.bytes,
    });
    essenceHub.emit("created", { type: "created", essenceId });

    const dataUrl = makeDataUrl(svgBuffer, SVG_MIME);

    return DiffusionResponse.parse({
      essence_id: essenceId,
      data_url: dataUrl,
      mime: SVG_MIME,
      width: parsed.width,
      height: parsed.height,
      prompt: parsed.prompt,
      negative_prompt: parsed.negative_prompt,
      seed,
      steps,
      guidance: parsed.guidance,
      slicing,
      lora_adapter: loraAdapter,
      model,
      version,
    });
  } finally {
    releaseGpu();
  }
}
function buildSvgPreview(args: SvgArgs): Buffer {
  const clampedWidth = clampDimension(args.width);
  const clampedHeight = clampDimension(args.height);
  const snippet = escapeForSvg(args.prompt).slice(0, 160);
  const seedText = `seed ${args.seed}`;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${clampedWidth}" height="${clampedHeight}">`,
    `<defs>`,
    `<linearGradient id="bg" gradientTransform="rotate(90)">`,
    `<stop offset="0%" stop-color="#0a021f"/>`,
    `<stop offset="100%" stop-color="#1f114d"/>`,
    `</linearGradient>`,
    `</defs>`,
    `<rect width="100%" height="100%" fill="url(#bg)"/>`,
    `<text x="24" y="${Math.max(32, Math.round(clampedHeight * 0.25))}" font-size="20" font-family="monospace" fill="#b3a9ff">LCM-LoRA A- ${seedText}</text>`,
    `<text x="24" y="${Math.max(70, Math.round(clampedHeight * 0.45))}" font-size="28" font-family="monospace" fill="#fefefe">${snippet}</text>`,
    `</svg>`,
  ].join("");
  return Buffer.from(svg, "utf8");
}
function escapeForSvg(value: string): string {
  return value.replace(/[<>&"']/g, (ch) => {
    switch (ch) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return ch;
    }
  });
}

function makeDataUrl(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function clampDimension(value: number): number {
  if (!Number.isFinite(value)) {
    return 512;
  }
  return Math.min(Math.max(Math.round(value), MIN_DIMENSION), MAX_DIMENSION);
}

function clampSteps(value: number): number {
  if (!Number.isFinite(value)) {
    return 4;
  }
  return Math.min(Math.max(Math.round(value), 1), 50);
}
