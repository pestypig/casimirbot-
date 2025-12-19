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

export const CurvatureUnitInput = z.object({
  units: UnitSystemSI.default(SI_UNITS),
  grid: Grid2D,
  boundary: CurvatureBoundaryCondition2D.default("dirichlet0"),
  sources: z.array(GaussianSource).min(1).optional(),
  u_field: Float32RasterSource.optional(),
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
  });

export const VectorRoot = z.object({
  x: z.number(),
  y: z.number(),
  kind: z.enum(["min", "max", "saddle"]),
  grad_mag: z.number(),
});

export const CurvatureSummary = z.object({
  total_energy_J: z.number().nonnegative(),
  mass_equivalent_kg: z.number().nonnegative(),
  residual_rms: z.number().nonnegative(),
  vector_roots: z.array(VectorRoot),
});

export const CurvatureArtifacts = z.object({
  potential_url: z.string(),
  potential_cid: z.string().optional(),
  energy_field_url: z.string().optional(),
  energy_field_cid: z.string().optional(),
});

export const CurvatureUnit = z.object({
  grid: Grid2D,
  inputs: CurvatureUnitInput,
  summary: CurvatureSummary,
  artifacts: CurvatureArtifacts,
});

export type TCurvatureUnit = z.infer<typeof CurvatureUnit>;
export type TCurvatureUnitInput = z.infer<typeof CurvatureUnitInput>;
