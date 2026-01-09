import { z } from "zod";
import {
  CurvatureKMetrics,
  CurvatureRidgeSummary,
  Float32RasterB64,
  Grid2D,
} from "./essence-physics";
import { TokamakPrecursorScoreKey } from "./tokamak-precursor";
import { TokamakRzFrame } from "./tokamak-energy-field";

export const TokamakSyntheticSensorConfig = z.object({
  bolometry_chords: z.number().int().min(1).default(8),
  interferometry_chords: z.number().int().min(1).default(8),
  probe_count: z.number().int().min(1).default(16),
  integration_step_m: z.number().positive().optional(),
  noise_std: z.number().nonnegative().optional(),
});

export type TTokamakSyntheticSensorConfig = z.infer<
  typeof TokamakSyntheticSensorConfig
>;

export const TokamakSyntheticChordSpec = z.object({
  id: z.string().min(1),
  kind: z.enum(["bolometry", "interferometry"]),
  start_m: z.tuple([z.number(), z.number()]),
  end_m: z.tuple([z.number(), z.number()]),
});

export type TTokamakSyntheticChordSpec = z.infer<
  typeof TokamakSyntheticChordSpec
>;

export const TokamakSyntheticChord = z.object({
  id: z.string().min(1),
  kind: z.enum(["bolometry", "interferometry"]),
  start_m: z.tuple([z.number(), z.number()]),
  end_m: z.tuple([z.number(), z.number()]),
  integral: z.number(),
});

export type TTokamakSyntheticChord = z.infer<typeof TokamakSyntheticChord>;

export const TokamakSyntheticProbeSample = z.object({
  id: z.string().min(1),
  position_m: z.tuple([z.number(), z.number()]),
  value: z.number(),
});

export type TTokamakSyntheticProbeSample = z.infer<
  typeof TokamakSyntheticProbeSample
>;

export const TokamakSyntheticDiagnosticsInput = z.object({
  schema_version: z.literal("tokamak_synthetic_input/1"),
  device_id: z.string().optional(),
  shot_id: z.string().optional(),
  timestamp_iso: z.string().datetime(),
  grid: Grid2D,
  frame: TokamakRzFrame,
  separatrix_mask: Float32RasterB64.optional(),
  u_total: Float32RasterB64,
  phi: Float32RasterB64.optional(),
  config: TokamakSyntheticSensorConfig.optional(),
  chords: z.array(TokamakSyntheticChordSpec).optional(),
  reconstruction_mode: z.enum(["backprojection", "none"]).default("backprojection"),
  score_key: TokamakPrecursorScoreKey.optional(),
});

export type TTokamakSyntheticDiagnosticsInput = z.infer<
  typeof TokamakSyntheticDiagnosticsInput
>;

export const TokamakSyntheticDiagnosticsReport = z.object({
  schema_version: z.literal("tokamak_synthetic_report/1"),
  kind: z.literal("tokamak_synthetic_report"),
  generated_at_iso: z.string().datetime(),
  device_id: z.string().optional(),
  shot_id: z.string().optional(),
  timestamp_iso: z.string().datetime(),
  grid: Grid2D,
  frame: TokamakRzFrame,
  sensors: z.object({
    config: TokamakSyntheticSensorConfig,
    bolometry: z.array(TokamakSyntheticChord),
    interferometry: z.array(TokamakSyntheticChord),
    probes: z.array(TokamakSyntheticProbeSample),
  }),
  reconstruction_mode: z.enum(["backprojection", "none"]),
  truth: z.object({
    k_metrics: CurvatureKMetrics,
    ridge_summary: CurvatureRidgeSummary,
    residual_rms: z.number().nonnegative(),
  }),
  reconstruction: z.object({
    k_metrics: CurvatureKMetrics,
    ridge_summary: CurvatureRidgeSummary,
    residual_rms: z.number().nonnegative(),
    u_total_recon: Float32RasterB64.optional(),
  }),
  info_loss: z.object({
    k_metrics: z.object({
      k0_abs: z.number().nonnegative(),
      k1_abs: z.number().nonnegative(),
      k2_abs: z.number().nonnegative(),
      k0_rel: z.number().nonnegative().optional(),
      k1_rel: z.number().nonnegative().optional(),
      k2_rel: z.number().nonnegative().optional(),
    }),
    ridge_count_delta: z.number(),
    ridge_length_delta: z.number(),
    fragmentation_index_delta: z.number(),
    residual_rms_delta: z.number().nonnegative(),
  }),
  score_comparison: z
    .object({
      score_key: TokamakPrecursorScoreKey,
      truth_score: z.number(),
      recon_score: z.number(),
      delta: z.number(),
      abs_delta: z.number().nonnegative(),
      rel_delta: z.number().nonnegative().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export type TTokamakSyntheticDiagnosticsReport = z.infer<
  typeof TokamakSyntheticDiagnosticsReport
>;
