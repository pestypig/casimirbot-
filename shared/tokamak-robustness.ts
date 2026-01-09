import { z } from "zod";
import { CurvatureBoundaryCondition2D } from "./essence-physics";
import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";
import { TokamakPrecursorScoreKey } from "./tokamak-precursor";

export const TokamakRobustnessDeltaSummary = z.object({
  count: z.number().int().nonnegative(),
  mean: z.number(),
  mean_abs: z.number().nonnegative(),
  p50: z.number(),
  p90: z.number(),
  max_abs: z.number().nonnegative(),
});

export type TTokamakRobustnessDeltaSummary = z.infer<
  typeof TokamakRobustnessDeltaSummary
>;

export const TokamakRobustnessInfoLoss = z.object({
  k0_rel_mean: z.number().nonnegative().optional(),
  k1_rel_mean: z.number().nonnegative().optional(),
  k2_rel_mean: z.number().nonnegative().optional(),
  score_rel_mean: z.number().nonnegative().optional(),
});

export type TTokamakRobustnessInfoLoss = z.infer<
  typeof TokamakRobustnessInfoLoss
>;

export const TokamakRobustnessScenario = z.object({
  id: z.string().min(1),
  kind: z.enum(["downsample", "mask_holes", "noise", "boundary"]),
  boundary: CurvatureBoundaryCondition2D.optional(),
  frame_count: z.number().int().nonnegative(),
  config: z.record(z.string(), z.any()).optional(),
  k_metrics: z.object({
    k0: TokamakRobustnessDeltaSummary,
    k1: TokamakRobustnessDeltaSummary,
    k2: TokamakRobustnessDeltaSummary,
  }),
  score: TokamakRobustnessDeltaSummary,
  info_loss: TokamakRobustnessInfoLoss.optional(),
  notes: z.string().optional(),
});

export type TTokamakRobustnessScenario = z.infer<
  typeof TokamakRobustnessScenario
>;

export const TokamakRobustnessBaseline = z.object({
  boundary: CurvatureBoundaryCondition2D,
  score_key: TokamakPrecursorScoreKey,
  frame_count: z.number().int().nonnegative(),
  k_metrics: z.object({
    k0_mean: z.number().nonnegative().optional(),
    k1_mean: z.number().nonnegative().optional(),
    k2_mean: z.number().nonnegative().optional(),
  }),
  score_mean: z.number().optional(),
});

export type TTokamakRobustnessBaseline = z.infer<
  typeof TokamakRobustnessBaseline
>;

export const TokamakRobustnessReport = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("tokamak_robustness_report/1"),
  kind: z.literal("tokamak_robustness_report"),
  generated_at_iso: z.string().datetime(),
  dataset_path: z.string().optional(),
  report_hash: z.string().min(8),
  baseline: TokamakRobustnessBaseline,
  scenarios: z.array(TokamakRobustnessScenario),
});

export type TTokamakRobustnessReport = z.infer<
  typeof TokamakRobustnessReport
>;
