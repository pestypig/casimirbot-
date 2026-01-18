import { z } from "zod";
import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";
import { SolarGuardrailReport } from "./solar-guardrails";

export const SolarModelFamily = z.enum([
  "opacity_depth",
  "emissivity_drude",
]);

export type TSolarModelFamily = z.infer<typeof SolarModelFamily>;

export const SolarModelObjective = z.enum(["rmse"]);
export type TSolarModelObjective = z.infer<typeof SolarModelObjective>;

export const SolarModelMuPolicy = z.object({
  mode: z.enum(["mu-grid", "disk-center", "include-integrated"]),
  integrated_mu: z.number().min(0).max(1).optional(),
  stability_target: z.number().min(0).max(1).optional(),
});

export type TSolarModelMuPolicy = z.infer<typeof SolarModelMuPolicy>;

export const SolarModelParamRange = z.object({
  min: z.number(),
  max: z.number(),
  steps: z.number().int().positive().optional(),
});

export type TSolarModelParamRange = z.infer<typeof SolarModelParamRange>;

export const SolarModelConfig = z.object({
  schema_version: z.literal("solar_model_config/1"),
  model_family: SolarModelFamily,
  parameter_bounds: z.record(z.string(), SolarModelParamRange),
  continuum_windows_m: z.array(z.tuple([z.number(), z.number()])).optional(),
  objective: SolarModelObjective.default("rmse"),
  mu_policy: SolarModelMuPolicy.default({ mode: "mu-grid" }),
  grid: z
    .object({
      coarse_samples: z.number().int().positive().default(120),
      refine_samples: z.number().int().positive().default(60),
      seed: z.string().optional(),
    })
    .default({ coarse_samples: 120, refine_samples: 60 }),
});

export type TSolarModelConfig = z.infer<typeof SolarModelConfig>;

export const SolarModelFitBandMetric = z.object({
  band_id: z.string().min(1),
  lambda_min_m: z.number(),
  lambda_max_m: z.number(),
  rmse: z.number().nonnegative(),
});

export type TSolarModelFitBandMetric = z.infer<typeof SolarModelFitBandMetric>;

export const SolarModelFitMuMetric = z.object({
  mu: z.number().min(0).max(1).nullable(),
  rmse: z.number().nonnegative(),
});

export type TSolarModelFitMuMetric = z.infer<typeof SolarModelFitMuMetric>;

export const SolarModelMuStability = z.object({
  mean_rmse: z.number().nonnegative(),
  std_rmse: z.number().nonnegative(),
  range_rmse: z.number().nonnegative(),
  score: z.number().min(0).max(1),
});

export type TSolarModelMuStability = z.infer<typeof SolarModelMuStability>;

export const SolarModelFitMetrics = z.object({
  rmse: z.number().nonnegative(),
  n_points: z.number().int().nonnegative(),
  n_params: z.number().int().nonnegative(),
  sse: z.number().nonnegative().optional(),
  aic: z.number().optional(),
  bic: z.number().optional(),
  mu_rmse: z.array(SolarModelFitMuMetric).optional(),
  mu_stability: SolarModelMuStability.optional(),
  band_rmse: z.array(SolarModelFitBandMetric).optional(),
});

export type TSolarModelFitMetrics = z.infer<typeof SolarModelFitMetrics>;

export const SolarModelFitReport = z.object({
  model_family: SolarModelFamily,
  params: z.record(z.string(), z.number()),
  metrics: SolarModelFitMetrics,
  plausible: z.boolean().optional(),
  notes: z.string().optional(),
});

export type TSolarModelFitReport = z.infer<typeof SolarModelFitReport>;

export const SolarModelViability = z.object({
  status: z.enum(["pass", "review", "fail"]),
  reasons: z.array(z.string()).optional(),
});

export type TSolarModelViability = z.infer<typeof SolarModelViability>;

export const SolarModelComparisonReport = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("solar_model_comparison/1"),
  kind: z.literal("solar_model_comparison"),
  generated_at_iso: z.string().datetime(),
  spectrum_inputs_hash: z.string().min(8),
  analysis_inputs_hash: z.string().min(8),
  model_configs: z.array(SolarModelConfig).min(1),
  models: z.array(SolarModelFitReport).min(1),
  best_model: SolarModelFamily.optional(),
  mu_consistency_ok: z.boolean().optional(),
  guardrails: SolarGuardrailReport.optional(),
  viability: SolarModelViability.optional(),
});

export type TSolarModelComparisonReport = z.infer<
  typeof SolarModelComparisonReport
>;
