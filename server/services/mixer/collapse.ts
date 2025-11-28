import { createHash } from "node:crypto";
import type {
  CollapseMixerFeature,
  TEssenceEnvelope,
  CollapseMixerKnobs,
  TCollapseMixRecipe,
} from "@shared/essence-schema";

type FetchEnvelopeFn = (id: string) => Promise<TEssenceEnvelope | null>;

export type CollapseStrategyName = "deterministic_hash_v1" | "embedding_v1" | "micro_llm_v1";

export interface CollapseStrategy {
  name: CollapseStrategyName;
  apply: (params: CollapseMixParams) => Promise<{ fused: Float32Array; feature: CollapseMixerFeature }>;
}

export class MissingEssenceInputError extends Error {
  constructor(public readonly essenceId: string) {
    super(`Essence input ${essenceId} not found`);
    this.name = "MissingEssenceInputError";
  }
}

type CollapseMixParams = {
  recipe: TCollapseMixRecipe;
  fetchEnvelope: FetchEnvelopeFn;
};

const normalizeStrategy = (value?: string | null): CollapseStrategyName => {
  if (!value || typeof value !== "string") return "deterministic_hash_v1";
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith("embed")) {
    return "embedding_v1";
  }
  if (normalized.startsWith("micro") || normalized.includes("llm")) {
    return "micro_llm_v1";
  }
  return "deterministic_hash_v1";
};

const DEFAULT_KNOBS: Required<Omit<CollapseMixerKnobs, "seed">> = {
  w_t: 1 / 3,
  w_i: 1 / 3,
  w_a: 1 / 3,
  lambda: 0.5,
  drive_norm: 1,
  conditioning: {},
};

export async function collapseMix(params: CollapseMixParams): Promise<{
  fused: Float32Array;
  feature: CollapseMixerFeature;
}> {
  const { recipe, fetchEnvelope } = params;
  const knobs = {
    ...DEFAULT_KNOBS,
    ...recipe.knobs,
    conditioning: { ...DEFAULT_KNOBS.conditioning, ...(recipe.knobs?.conditioning ?? {}) },
  };

  const sources = {
    text: await resolveEnvelopes(fetchEnvelope, recipe.inputs.text ?? []),
    image: await resolveEnvelopes(fetchEnvelope, recipe.inputs.image ?? []),
    audio: await resolveEnvelopes(fetchEnvelope, recipe.inputs.audio ?? []),
  };

  const dim = recipe.dim ?? 1024;
  const vectors: Array<{ weight: number; vec: Float32Array; kind: "text" | "image" | "audio" }> = [];

  if (sources.text.items.length) {
    vectors.push({
      weight: knobs.w_t,
      vec: buildVectorFromContent("text", sources.text.seedMaterial, dim, knobs.seed),
      kind: "text",
    });
  }
  if (sources.image.items.length) {
    vectors.push({
      weight: knobs.w_i,
      vec: buildVectorFromContent("image", sources.image.seedMaterial, dim, knobs.seed),
      kind: "image",
    });
  }
  if (sources.audio.items.length) {
    vectors.push({
      weight: knobs.w_a,
      vec: buildVectorFromContent("audio", sources.audio.seedMaterial, dim, knobs.seed),
      kind: "audio",
    });
  }

  if (!vectors.length) {
    throw new Error("collapse_mixer requires at least one input modality");
  }

  const fused = fuseVectors(vectors, dim, knobs.drive_norm);

  const feature: CollapseMixerFeature = {
    kind: "collapse/mixer",
    version: "1.0",
    knobs,
    sources: {
      text: recipe.inputs.text,
      image: recipe.inputs.image,
      audio: recipe.inputs.audio,
    },
  };

  return { fused, feature };
}

function fuseVectors(
  vectors: Array<{ weight: number; vec: Float32Array; kind: string }>,
  dim: number,
  driveNorm: number,
): Float32Array {
  const active = vectors.filter((entry) => entry.weight > 0);
  const totalWeight = active.reduce((sum, entry) => sum + entry.weight, 0) || 1;
  const fused = new Float32Array(dim);

  for (const { vec, weight } of active) {
    const factor = weight / totalWeight;
    for (let i = 0; i < dim; i++) {
      fused[i] += vec[i] * factor;
    }
  }

  for (let i = 0; i < dim; i++) {
    fused[i] *= driveNorm ?? 1;
  }

  return normalizeVector(fused);
}

function createDeterministicRng(a: number, b: number, c: number, d: number): () => number {
  let x = a >>> 0;
  let y = b >>> 0;
  let z = c >>> 0;
  let w = d >>> 0;
  if ((x | y | z | w) === 0) {
    w = 1;
  }
  return () => {
    x >>>= 0;
    y >>>= 0;
    z >>>= 0;
    w >>>= 0;
    const t = (x + y) | 0;
    x = y ^ (y >>> 9);
    y = (z + (z << 3)) | 0;
    z = ((z << 21) | (z >>> 11)) | 0;
    w = (w + 1) | 0;
    const res = (t + w) | 0;
    return ((res >>> 0) / 4294967296);
  };
}

function buildVectorFromContent(prefix: string, material: string, dim: number, seed?: number): Float32Array {
  const base = createHash("sha256").update(`${prefix}:${material}`).digest();
  const seedMix = createHash("sha256")
    .update(base)
    .update(Buffer.from(String(seed ?? 0)))
    .digest();
  const rand = createDeterministicRng(
    seedMix.readUInt32BE(0),
    seedMix.readUInt32BE(4),
    seedMix.readUInt32BE(8),
    seedMix.readUInt32BE(12),
  );
  const vec = new Float32Array(dim);
  for (let i = 0; i < dim; i++) {
    vec[i] = rand() * 2 - 1;
  }
  return normalizeVector(vec);
}

function normalizeVector(vec: Float32Array): Float32Array {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < vec.length; i++) {
    vec[i] /= norm;
  }
  return vec;
}

type ResolvedInput = {
  items: TEssenceEnvelope[];
  seedMaterial: string;
};

async function resolveEnvelopes(
  fetchEnvelope: FetchEnvelopeFn,
  ids: string[],
): Promise<ResolvedInput> {
  const items: TEssenceEnvelope[] = [];
  const parts: string[] = [];
  for (const id of ids) {
    const env = await fetchEnvelope(id);
    if (!env) {
      throw new MissingEssenceInputError(id);
    }
    items.push(env);
    parts.push(buildSeedMaterial(env));
  }
  return { items, seedMaterial: parts.join("\n---\n") };
}

function buildSeedMaterial(env: TEssenceEnvelope): string {
  const sections: string[] = [];
  const text = env.features?.text;
  if (text?.transcript || text?.caption || text?.summary) {
    sections.push(
      [text.transcript, text.caption, text.summary].filter(Boolean).join("\n"),
      JSON.stringify(text.tags ?? []),
    );
  } else if (text) {
    sections.push(JSON.stringify(text));
  }

  const image = env.features?.image;
  if (image) {
    sections.push(`image:${image.width}x${image.height}:${image.pHash ?? "na"}`);
  }

  const audio = env.features?.audio;
  if (audio) {
    sections.push(`audio:${audio.sample_rate}:${audio.duration_ms}`);
  }

  if (sections.length === 0) {
    sections.push(JSON.stringify(env.header));
  }

  return sections.join("\n");
}

const deterministicHashStrategy: CollapseStrategy = {
  name: "deterministic_hash_v1",
  apply: collapseMix,
};

const embeddingStrategy: CollapseStrategy = {
  name: "embedding_v1",
  apply: async (params) => deterministicHashStrategy.apply(params),
};

const microLLMStrategy: CollapseStrategy = {
  name: "micro_llm_v1",
  apply: async (params) => deterministicHashStrategy.apply(params),
};

export const getCollapseStrategy = (preferred?: string | null): CollapseStrategy => {
  const strategyName = normalizeStrategy(preferred ?? process.env.HYBRID_COLLAPSE_MODE);
  switch (strategyName) {
    case "embedding_v1":
      return embeddingStrategy;
    case "micro_llm_v1":
      return microLLMStrategy;
    default:
      return deterministicHashStrategy;
  }
};

export async function applyCollapseStrategy(
  params: CollapseMixParams,
  preferredStrategy?: string | null,
): Promise<{ fused: Float32Array; feature: CollapseMixerFeature; strategy: CollapseStrategyName }> {
  const strategy = getCollapseStrategy(preferredStrategy);
  const result = await strategy.apply(params);
  const feature: CollapseMixerFeature = { ...result.feature, strategy: strategy.name };
  return { fused: result.fused, feature, strategy: strategy.name };
}
