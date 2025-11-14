import { z } from "zod";

export const COLLAPSE_SPACE = "collapse/unified-1024" as const;

/** --- Core crypto / provenance --- */
export const Hash = z.object({
  algo: z.enum(["sha256", "blake3"]),
  value: z.string(), // hex digest
});

export const Signature = z.object({
  alg: z.enum(["ed25519", "secp256k1"]),
  keyId: z.string(), // did:... or https://...#key
  sig: z.string(), // base64url signature
});

export const TransformStep = z.object({
  name: z.string(), // e.g., "stft", "mfcc", "clip-embed"
  impl_version: z.string(), // "1.3.2"
  lib_hash: Hash, // build/runtime digest
  params: z.record(z.any()), // window=1024, hop=256, ...
  seed: z.string().optional(),
  input_hash: Hash,
  output_hash: Hash,
  started_at: z.string(), // ISO timestamp
  ended_at: z.string(),
});

/** --- Embeddings / features --- */
export const EmbeddingMeta = z.object({
  space: z.string(), // "clip-ViT-L/14", "text-bert-base", etc.
  dim: z.number().int().positive(),
  dtype: z.enum(["f32", "f16", "q8"]).default("f32"),
  quantization: z.string().optional(),
  storage: z
    .object({
      inline_base64: z.string().optional(), // small vectors
      object_url: z.string().optional(), // s3://... or https://...
      cid: z.string().optional(), // content id if using CAS
    })
    .refine(
      (d) => !!(d.inline_base64 || d.object_url || d.cid),
      { message: "embedding must have storage" },
    ),
  composer: z.string().optional(),
});

export const EssenceHeader = z.object({
  id: z.string(), // CID or UUID
  version: z.literal("essence/1.0"),
  modality: z.enum(["text", "audio", "image", "video", "multimodal"]),
  created_at: z.string(),
  source: z.object({
    uri: z.string(), // allow URLs or paths
    original_hash: Hash,
    duration_ms: z.number().int().nonnegative().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    sample_rate: z.number().int().positive().optional(),
    channels: z.number().int().positive().optional(),
    mime: z.string().optional(),
    creator_id: z.string(),
    license: z.string().optional(), // SPDX id or custom
    cid: z.string().optional(),
  }),
  rights: z
    .object({
      allow_mix: z.boolean().default(true),
      allow_remix: z.boolean().default(true),
      allow_commercial: z.boolean().default(false),
      attribution: z.boolean().default(true),
    })
    .default({
      allow_mix: true,
      allow_remix: true,
      allow_commercial: false,
      attribution: true,
    }),
  acl: z
    .object({
      visibility: z.enum(["public", "followers", "private"]).default("public"),
      groups: z.array(z.string()).default([]),
    })
    .default({ visibility: "public", groups: [] }),
});

export const Features = z.object({
  text: z
    .object({
      lang: z.string().optional(),
      tokenizer: z.string().optional(),
      token_counts: z.record(z.number()).optional(),
      char_ngrams: z.record(z.number()).optional(),
      transcript: z.string().optional(),
      caption: z.string().optional(),
      summary: z.string().optional(),
      tags: z.array(z.string()).optional(),
      source: z.string().optional(),
    })
    .optional(),

  audio: z
    .object({
      sample_rate: z.number().int().positive(),
      duration_ms: z.number().int().nonnegative(),
      mfcc_url: z.string().optional(),
      chroma_url: z.string().optional(),
      fingerprint: z.string().optional(),
    })
    .optional(),

  image: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      pHash: z.string().optional(),
      color_hist_url: z.string().optional(),
    })
    .optional(),

  video: z
    .object({
      fps: z.number().positive().optional(),
      shot_boundaries_url: z.string().optional(),
      keyframe_phashes_url: z.string().optional(),
    })
    .optional(),

  physics: z
    .object({
      kind: z.literal("curvature-unit"),
      summary: z.object({
        total_energy_J: z.number(),
        mass_equivalent_kg: z.number(),
        residual_rms: z.number(),
        roots_count: z.number(),
      }),
      artifacts: z.object({
        potential_url: z.string(),
        energy_field_url: z.string().optional(),
      }),
    })
    .optional(),

  mixer: z
    .object({
      kind: z.literal("collapse/mixer"),
      version: z.string().default("1.0"),
      knobs: z.object({
        w_t: z.number().min(0).max(1),
        w_i: z.number().min(0).max(1),
        w_a: z.number().min(0).max(1),
        lambda: z.number().min(0).max(1).default(0.5),
        drive_norm: z.number().nonnegative().default(1),
        seed: z.number().int().nonnegative().optional(),
        conditioning: z
          .object({
            beta_tilt: z.number().optional(),
            epsilon: z.number().optional(),
            g_target: z.number().optional(),
            sector_state: z.string().optional(),
          })
          .partial()
          .default({}),
      }),
      sources: z
        .object({
          text: z.array(z.string()).optional(),
          image: z.array(z.string()).optional(),
          audio: z.array(z.string()).optional(),
        })
        .default({}),
    })
    .optional(),
});

export type CollapseMixerFeature = NonNullable<z.infer<typeof Features>["mixer"]>;
export type CollapseMixerKnobs = CollapseMixerFeature["knobs"];

export const Provenance = z.object({
  pipeline: z.array(TransformStep),
  merkle_root: Hash,
  previous: z.string().nullable().default(null),
  signatures: z.array(Signature).default([]),
});

export const EssenceEnvelope = z.object({
  header: EssenceHeader,
  features: Features.default({}),
  embeddings: z.array(EmbeddingMeta).default([]),
  metrics: z
    .object({
      rehydrate_psnr: z.number().optional(),
      rehydrate_snr: z.number().optional(),
      hash_distance: z.number().optional(),
    })
    .optional(),
  provenance: Provenance,
});

export type TEssenceEnvelope = z.infer<typeof EssenceEnvelope>;

export const EssencePacket = z.object({
  essence_id: z.string(),
  idx: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  payload_url: z.string(),
  payload_hash: Hash,
});

const LegacyMixRecipe = z.object({
  id: z.string(),
  created_at: z.string(),
  inputs: z.array(
    z.object({
      essence_id: z.string(),
      weight: z.number().default(1),
      range: z
        .object({
          start_ms: z.number(),
          end_ms: z.number(),
        })
        .optional(),
    }),
  ),
  method: z.enum(["embed-blend", "feature-union", "prompt-compose"]),
  params: z.record(z.any()).default({}),
  deterministic_seed: z.string().optional(),
});

export const CollapseMixRecipe = z.object({
  kind: z.literal("collapse_mixer"),
  dim: z.number().int().positive().default(1024),
  inputs: z
    .object({
      text: z.array(z.string()).optional(),
      image: z.array(z.string()).optional(),
      audio: z.array(z.string()).optional(),
    })
    .default({}),
  knobs: z
    .object({
      w_t: z.number().min(0).max(1).default(1 / 3),
      w_i: z.number().min(0).max(1).default(1 / 3),
      w_a: z.number().min(0).max(1).default(1 / 3),
      lambda: z.number().min(0).max(1).default(0.5),
      drive_norm: z.number().nonnegative().default(1),
      seed: z.number().int().nonnegative().optional(),
      conditioning: z
        .object({
          beta_tilt: z.number().optional(),
          epsilon: z.number().optional(),
          g_target: z.number().optional(),
          sector_state: z.string().optional(),
        })
        .partial()
        .default({}),
    })
    .default({}),
});

export type TCollapseMixRecipe = z.infer<typeof CollapseMixRecipe>;

export const MixRecipe = z.union([LegacyMixRecipe, CollapseMixRecipe]);

export const RemixRequest = z.object({
  recipe: MixRecipe,
  target_envelope_id: z.string(),
  controls: z.record(z.any()).default({}),
});

export const EssenceEnvironmentOverrides = z
  .object({
    layout: z.unknown().optional(),
    theme: z.unknown().optional(),
    widgets: z.unknown().optional(),
  })
  .default({});
export type TEssenceEnvironmentOverrides = z.infer<typeof EssenceEnvironmentOverrides>;

export const EssenceTemplate = z.object({
  id: z.string(),
  templateVersion: z.number().int().nonnegative(),
  osVersion: z.string(),
  schemaVersion: z.number().int().nonnegative(),
  defaultDesktopLayout: z.unknown().default({}),
  defaultPanels: z.array(z.string()).default([]),
  defaultTheme: z.unknown().default({}),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type TEssenceTemplate = z.infer<typeof EssenceTemplate>;

export const EssenceEnvironment = z.object({
  ownerId: z.string(),
  templateId: z.string(),
  templateVersion: z.number().int().nonnegative(),
  userOverrides: EssenceEnvironmentOverrides,
  lastUpdatedAt: z.string(),
  createdAt: z.string().optional(),
});
export type TEssenceEnvironment = z.infer<typeof EssenceEnvironment>;
