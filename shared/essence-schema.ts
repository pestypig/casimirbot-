import { z } from "zod";
import { InformationBoundary } from "./information-boundary";
import { grOsPayloadSchema } from "./schema";

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
  modality: z.enum(["text", "audio", "image", "video", "code", "multimodal"]),
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

const CodeNodeKind = z.enum([
  "function",
  "component",
  "schema",
  "test",
  "class",
  "hook",
  "store",
  "interface",
  "type",
  "utility",
]);

const CodeResonanceKind = z.enum([
  "architecture",
  "ideology",
  "ui",
  "plumbing",
  "test",
  "doc",
  "data",
  "unknown",
]);

const CodeEdgeKind = z.enum(["import", "export", "call", "local", "cochange", "reference"]);

const CodeByteRange = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});

const CodeSourceSpan = z.object({
  startLine: z.number().int().nonnegative(),
  startCol: z.number().int().nonnegative(),
  endLine: z.number().int().nonnegative(),
  endCol: z.number().int().nonnegative(),
});

export const CodeNeighbor = z.object({
  nodeId: z.string().optional(),
  filePath: z.string().optional(),
  symbol: z.string().optional(),
  kind: CodeEdgeKind,
  weight: z.number().nonnegative().optional(),
  note: z.string().optional(),
});

const CodeHealth = z.object({
  coverage: z.number().min(0).max(1).optional(),
  flaky: z.boolean().optional(),
  lastStatus: z.enum(["pass", "fail", "unknown"]).optional(),
  lastTestedAt: z.string().optional(),
  tests: z.array(z.string()).optional(),
});

const CodeSalience = z.object({
  attention: z.number().nonnegative().optional(),
  lastTouchedByUserAt: z.string().optional(),
  activePanels: z.array(z.string()).optional(),
  traces: z.array(z.string()).optional(),
});

export const CodeFeature = z.object({
  nodeId: z.string(),
  symbol: z.string(),
  exportName: z.string().optional(),
  kind: CodeNodeKind,
  resonanceKind: CodeResonanceKind.optional(),
  filePath: z.string(),
  signature: z.string().optional(),
  astHash: z.string(),
  fileHash: z.string().optional(),
  byteRange: CodeByteRange.optional(),
  loc: CodeSourceSpan.optional(),
  doc: z.string().optional(),
  snippet: z.string().optional(),
  semanticEmbeddingId: z.string().optional(),
  neighbors: z.array(CodeNeighbor).default([]),
  dependencies: z.array(z.string()).default([]),
  dependants: z.array(z.string()).default([]),
  health: CodeHealth.optional(),
  salience: CodeSalience.optional(),
  metrics: z
    .object({
      bytes: z.number().int().nonnegative().optional(),
      lines: z.number().int().nonnegative().optional(),
      complexity: z.number().nonnegative().optional(),
      imports: z.number().int().nonnegative().optional(),
      exports: z.number().int().nonnegative().optional(),
      commit: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
});

const PhysicsCurvatureFeature = z.object({
  kind: z.literal("curvature-unit"),
  summary: z.object({
    total_energy_J: z.number(),
    mass_equivalent_kg: z.number(),
    residual_rms: z.number(),
    stability: z
      .object({
        iterations: z.number().int().nonnegative(),
        nan_count: z.number().int().nonnegative(),
        phi_min: z.number(),
        phi_max: z.number(),
        grad_rms: z.number().nonnegative(),
        laplacian_rms: z.number().nonnegative(),
        residual_max_abs: z.number().nonnegative(),
        mask_coverage: z.number().min(0).max(1).optional(),
      })
      .optional(),
    k_metrics: z
      .object({
        k0: z.number().nonnegative(),
        k1: z.number().nonnegative(),
        k2: z.number().nonnegative(),
        k3: z.number().min(0).max(1).optional(),
      })
      .optional(),
    ridge_summary: z
      .object({
        ridge_count: z.number().int().nonnegative(),
        ridge_point_count: z.number().int().nonnegative(),
        ridge_length_m: z.number().nonnegative(),
        ridge_density: z.number().nonnegative(),
        fragmentation_index: z.number().nonnegative(),
        thresholds: z.object({
          high: z.number().nonnegative(),
          low: z.number().nonnegative(),
        }),
      })
      .optional(),
    roots_count: z.number(),
  }),
    artifacts: z.object({
      potential_url: z.string(),
      potential_cid: z.string().optional(),
      energy_field_url: z.string().optional(),
      energy_field_cid: z.string().optional(),
      manifest_url: z.string().optional(),
      manifest_cid: z.string().optional(),
      grad_mag_url: z.string().optional(),
      grad_mag_cid: z.string().optional(),
      laplacian_url: z.string().optional(),
      laplacian_cid: z.string().optional(),
    residual_url: z.string().optional(),
    residual_cid: z.string().optional(),
    mask_url: z.string().optional(),
    mask_cid: z.string().optional(),
    ridge_spines_url: z.string().optional(),
    ridge_spines_cid: z.string().optional(),
  }),
});

const PhysicsEnergyFieldArtifacts = z.object({
  energy_field_url: z.string(),
  energy_field_cid: z.string().optional(),
  mask_url: z.string().optional(),
  mask_cid: z.string().optional(),
  manifest_url: z.string().optional(),
  manifest_cid: z.string().optional(),
});

const PhysicsSolarEnergyFieldFeature = z.object({
  kind: z.literal("solar-energy-field"),
  summary: z.object({
    calibration_version: z.string().nullable().optional(),
    instrument: z.string().nullable().optional(),
    wavelength_A: z.number().nullable().optional(),
    window_start: z.string().nullable().optional(),
    window_end: z.string().nullable().optional(),
  }),
  artifacts: PhysicsEnergyFieldArtifacts,
});

const PhysicsTokamakEnergyFieldFeature = z.object({
  kind: z.literal("tokamak-energy-field"),
  summary: z.object({
    device_id: z.string().nullable().optional(),
    shot_id: z.string().nullable().optional(),
    manifest_hash: z.string().optional(),
    channel_count: z.number().int().nonnegative().optional(),
  }),
  artifacts: PhysicsEnergyFieldArtifacts,
});

const PhysicsTokamakAddedValueFeature = z.object({
  kind: z.literal("tokamak-added-value"),
  summary: z.object({
    dataset_path: z.string().nullable().optional(),
    report_hash: z.string().optional(),
    recall_target: z.number().min(0).max(1).optional(),
    physics_only_auc: z.number().min(0).max(1).nullable().optional(),
    combined_auc: z.number().min(0).max(1).nullable().optional(),
    delta_auc: z.number().nullable().optional(),
  }),
  artifacts: z.object({
    report_url: z.string(),
    report_cid: z.string().optional(),
  }),
});

const PhysicsSolarSpectrumFeature = z.object({
  kind: z.literal("solar-spectrum"),
  summary: z.object({
    dataset: z.string().optional(),
    version: z.string().optional(),
    view: z.string().optional(),
    series_count: z.number().int().nonnegative().optional(),
    wavelength_min_m: z.number().optional(),
    wavelength_max_m: z.number().optional(),
  }),
  artifacts: z.object({
    spectrum_url: z.string(),
    spectrum_cid: z.string().optional(),
    analysis_url: z.string().optional(),
    analysis_cid: z.string().optional(),
  }),
});

const PhysicsGrOsFeature = z.object({
  kind: z.literal("gr-os"),
  payload: grOsPayloadSchema,
});

const PhysicsFeature = z.discriminatedUnion("kind", [
  PhysicsCurvatureFeature,
  PhysicsSolarEnergyFieldFeature,
  PhysicsSolarSpectrumFeature,
  PhysicsTokamakEnergyFieldFeature,
  PhysicsTokamakAddedValueFeature,
  PhysicsGrOsFeature,
]);

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
      mask_uri: z.string().optional(),
    })
    .optional(),

  video: z
    .object({
      fps: z.number().positive().optional(),
      shot_boundaries_url: z.string().optional(),
      keyframe_phashes_url: z.string().optional(),
    })
    .optional(),

  code: CodeFeature.optional(),

  physics: PhysicsFeature.optional(),

  mixer: z
    .object({
      kind: z.literal("collapse/mixer"),
      version: z.string().default("1.0"),
      strategy: z.string().optional(),
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

  piece: z
    .object({
      type: z.enum(["cape", "shirt", "pants"]),
      template_id: z.string().optional(),
    })
    .optional(),

  knit: z
    .object({
      palette_map: z
        .array(
          z.object({
            yarn_id: z.string().optional(),
            name: z.string().optional(),
            rgb: z.array(z.number()).length(3).optional(),
            carrier: z.string().optional(),
            usage_pct: z.number().optional(),
          }),
        )
        .optional(),
      stitchgrid_uri: z.string().optional(),
      gauge: z
        .object({
          gg: z.number().optional(),
          npi: z.number().optional(),
          cpi: z.number().optional(),
        })
        .optional(),
      target: z
        .object({
          stitches_w: z.number().int().nonnegative().optional(),
          courses_h: z.number().int().nonnegative().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type CollapseMixerFeature = NonNullable<z.infer<typeof Features>["mixer"]>;
export type CollapseMixerKnobs = CollapseMixerFeature["knobs"];
export type TCodeFeature = NonNullable<z.infer<typeof Features>["code"]>;
export type TCodeNeighbor = TCodeFeature["neighbors"][number];
export type TCodeHealth = NonNullable<TCodeFeature["health"]>;
export type TCodeSalience = NonNullable<TCodeFeature["salience"]>;
export type TCodeResonanceKind = z.infer<typeof CodeResonanceKind>;

export const Provenance = z.object({
  pipeline: z.array(TransformStep),
  merkle_root: Hash,
  previous: z.string().nullable().default(null),
  signatures: z.array(Signature).default([]),
  information_boundary: InformationBoundary.optional(),
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
