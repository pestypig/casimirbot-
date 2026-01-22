import { z } from "zod";
import { SI_UNITS, UnitSystemSI } from "./unit-system";
import { C as SPEED_OF_LIGHT, G as GRAVITATIONAL_CONSTANT } from "./physics-const";

const Grid2D_SI = z.object({
  nx: z.number().int().positive(),
  ny: z.number().int().positive(),
  dx_m: z.number().positive(),
  dy_m: z.number().positive(),
  thickness_m: z.number().positive().default(1),
});

export const Grid2D = z.preprocess((value) => {
  if (!value || typeof value !== "object") return value;
  const raw = value as Record<string, unknown>;
  return {
    ...raw,
    dx_m: raw.dx_m ?? raw.dx,
    dy_m: raw.dy_m ?? raw.dy,
  };
}, Grid2D_SI);

export const GridFrame2D = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("cartesian"),
    x_label: z.string().optional(),
    y_label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("rz-plane"),
    r_min_m: z.number(),
    r_max_m: z.number(),
    z_min_m: z.number(),
    z_max_m: z.number(),
    axis_order: z.tuple([z.literal("r"), z.literal("z")]).default(["r", "z"]),
    notes: z.string().optional(),
  }),
]);

export type TGridFrame2D = z.infer<typeof GridFrame2D>;

const GaussianSource_SI = z.object({
  x_m: z.number(),
  y_m: z.number(),
  sigma_m: z.number().positive(),
  peak_u_Jm3: z.number().nonnegative(),
});

export const GaussianSource = z.preprocess((value) => {
  if (!value || typeof value !== "object") return value;
  const raw = value as Record<string, unknown>;
  return {
    ...raw,
    x_m: raw.x_m ?? raw.x,
    y_m: raw.y_m ?? raw.y,
    sigma_m: raw.sigma_m ?? raw.sigma,
    peak_u_Jm3: raw.peak_u_Jm3 ?? raw.peak_u,
  };
}, GaussianSource_SI);

export const CurvatureBoundaryCondition2D = z.enum(["dirichlet0", "neumann0", "periodic"]);
export type TCurvatureBoundaryCondition2D = z.infer<typeof CurvatureBoundaryCondition2D>;

const stripDataUrlPrefix = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed.startsWith("data:")) {
    const comma = trimmed.indexOf(",");
    if (comma >= 0) {
      return trimmed.slice(comma + 1).replace(/\s+/g, "");
    }
  }
  return trimmed.replace(/\s+/g, "");
};

export const Float32RasterB64 = z.object({
  encoding: z.literal("base64"),
  dtype: z.literal("float32"),
  endian: z.literal("little"),
  order: z.literal("row-major"),
  data_b64: z.preprocess(stripDataUrlPrefix, z.string().min(1)),
});

export type TFloat32RasterB64 = z.infer<typeof Float32RasterB64>;

const StorageLocator = z
  .string()
  .min(1)
  .refine((value) => value.startsWith("storage://") || value.startsWith("cid:"), {
    message: "Expected a content-addressed locator (storage://… or cid:…).",
  });

export const Float32RasterBlob = z.object({
  encoding: z.literal("blob"),
  dtype: z.literal("float32"),
  endian: z.literal("little"),
  order: z.literal("row-major"),
  uri: StorageLocator,
  cid: z.string().optional(),
});

export type TFloat32RasterBlob = z.infer<typeof Float32RasterBlob>;

export const Float32RasterSource = z.union([Float32RasterB64, Float32RasterBlob]);
export type TFloat32RasterSource = z.infer<typeof Float32RasterSource>;

export const CurvatureMetricsConfig = z.object({
  k0_percentile: z.number().min(0.5).max(0.999).default(0.95),
  ridge_high_percentile: z.number().min(0.5).max(0.999).default(0.9),
  ridge_low_ratio: z.number().min(0).max(1).default(0.5),
  ridge_min_points: z.number().int().min(2).default(6),
  ridge_max_points: z.number().int().min(4).default(128),
  ridge_max_count: z.number().int().min(1).default(64),
});
export type TCurvatureMetricsConfig = z.infer<typeof CurvatureMetricsConfig>;

export const UFieldChannelNormalization = z.object({
  method: z.enum(["none", "scale_offset"]).default("none"),
  scale: z.number().optional(),
  offset: z.number().optional(),
  clamp: z.tuple([z.number(), z.number()]).optional(),
  notes: z.string().optional(),
});

export type TUFieldChannelNormalization = z.infer<typeof UFieldChannelNormalization>;

export const UFieldChannelManifestEntry = z.object({
  key: z.string().min(1),
  weight: z.number().finite(),
  normalization: UFieldChannelNormalization.default({ method: "none" }),
  units: z.string().optional(),
  notes: z.string().optional(),
});

export type TUFieldChannelManifestEntry = z.infer<typeof UFieldChannelManifestEntry>;

export const UFieldChannelManifest = z.object({
  schema_version: z.literal("u_field_manifest/1"),
  version: z.string().min(1),
  device_id: z.string().optional(),
  channels: z.array(UFieldChannelManifestEntry).min(1),
  total_policy: z
    .object({
      method: z.enum(["weighted-sum", "external"]).default("weighted-sum"),
      normalize_weights: z.boolean().default(false),
    })
    .default({ method: "weighted-sum", normalize_weights: false }),
  notes: z.string().optional(),
});

export type TUFieldChannelManifest = z.infer<typeof UFieldChannelManifest>;

export const CurvatureUnitInput = z.object({
  units: UnitSystemSI.default(SI_UNITS),
  grid: Grid2D,
  frame: GridFrame2D.optional(),
  boundary: CurvatureBoundaryCondition2D.default("dirichlet0"),
  sources: z.array(GaussianSource).min(1).optional(),
  u_field: Float32RasterSource.optional(),
  u_manifest: UFieldChannelManifest.optional(),
  u_manifest_hash: z.string().min(8).optional(),
  mask: Float32RasterSource.optional(),
  metrics: CurvatureMetricsConfig.optional(),
  constants: z
    .object({
      c: z.number().positive().default(SPEED_OF_LIGHT),
      G: z.number().positive().default(GRAVITATIONAL_CONSTANT),
    })
    .default({}),
})
  .superRefine((value, ctx) => {
    const hasSources = Array.isArray(value.sources) && value.sources.length > 0;
    const hasUField = value.u_field !== undefined;
    if (hasSources === hasUField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one of: sources[] or u_field.",
      });
    }
    if (value.u_manifest && !value.u_field) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "u_manifest requires u_field.",
        path: ["u_manifest"],
      });
    }
    if (value.u_manifest_hash && !value.u_manifest) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "u_manifest_hash requires u_manifest.",
        path: ["u_manifest_hash"],
      });
    }
  });

export const VectorRoot = z.object({
  x: z.number(),
  y: z.number(),
  kind: z.enum(["min", "max", "saddle"]),
  grad_mag: z.number(),
});

export const CurvatureKMetrics = z.object({
  k0: z.number().nonnegative(),
  k1: z.number().nonnegative(),
  k2: z.number().nonnegative(),
  k3: z.number().min(0).max(1).optional(),
});
export type TCurvatureKMetrics = z.infer<typeof CurvatureKMetrics>;

export const CurvatureRidgeSummary = z.object({
  ridge_count: z.number().int().nonnegative(),
  ridge_point_count: z.number().int().nonnegative(),
  ridge_length_m: z.number().nonnegative(),
  ridge_density: z.number().nonnegative(),
  fragmentation_index: z.number().nonnegative(),
  thresholds: z.object({
    high: z.number().nonnegative(),
    low: z.number().nonnegative(),
  }),
});
export type TCurvatureRidgeSummary = z.infer<typeof CurvatureRidgeSummary>;

export const CurvatureRidgePoint = z.object({
  x: z.number(),
  y: z.number(),
  grad_mag: z.number().nonnegative(),
});

export const CurvatureRidgeSpine = z.object({
  id: z.string().optional(),
  points: z.array(CurvatureRidgePoint).min(1),
  length_m: z.number().nonnegative(),
  mean_grad: z.number().nonnegative(),
  max_grad: z.number().nonnegative(),
  centroid: z.object({ x: z.number(), y: z.number() }),
  bbox: z.object({
    x_min: z.number(),
    x_max: z.number(),
    y_min: z.number(),
    y_max: z.number(),
  }),
  point_count: z.number().int().nonnegative(),
});
export type TCurvatureRidgeSpine = z.infer<typeof CurvatureRidgeSpine>;

export const CurvatureRidgeFrame = z.object({
  summary: CurvatureRidgeSummary,
  spines: z.array(CurvatureRidgeSpine),
});
export type TCurvatureRidgeFrame = z.infer<typeof CurvatureRidgeFrame>;

export const CurvatureSummary = z.object({
  total_energy_J: z.number().nonnegative(),
  mass_equivalent_kg: z.number().nonnegative(),
  residual_rms: z.number().nonnegative(),
  stability: z.object({
    iterations: z.number().int().nonnegative(),
    nan_count: z.number().int().nonnegative(),
    phi_min: z.number(),
    phi_max: z.number(),
    grad_rms: z.number().nonnegative(),
    laplacian_rms: z.number().nonnegative(),
    residual_max_abs: z.number().nonnegative(),
    mask_coverage: z.number().min(0).max(1).optional(),
  }),
  k_metrics: CurvatureKMetrics,
  ridge_summary: CurvatureRidgeSummary,
  vector_roots: z.array(VectorRoot),
});

export const CurvatureArtifacts = z.object({
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
});

export const CurvatureUnit = z.object({
  grid: Grid2D,
  inputs: CurvatureUnitInput,
  summary: CurvatureSummary,
  artifacts: CurvatureArtifacts,
  ridges: CurvatureRidgeFrame.optional(),
});

export type TCurvatureUnit = z.infer<typeof CurvatureUnit>;
export type TCurvatureUnitInput = z.infer<typeof CurvatureUnitInput>;
