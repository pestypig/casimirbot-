import { z } from "zod";

export const Grid2D = z.object({
  nx: z.number().int().positive(),
  ny: z.number().int().positive(),
  dx: z.number().positive(),
  dy: z.number().positive(),
  thickness_m: z.number().positive().default(1),
});

export const GaussianSource = z.object({
  x: z.number(),
  y: z.number(),
  sigma: z.number().positive(),
  peak_u: z.number().nonnegative(),
});

export const CurvatureUnitInput = z.object({
  grid: Grid2D,
  sources: z.array(GaussianSource).min(1),
  constants: z
    .object({
      c: z.number().positive().default(299_792_458),
      G: z.number().positive().default(6.6743e-11),
    })
    .default({}),
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
