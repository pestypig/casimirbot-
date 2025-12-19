import { z } from "zod";
import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";

export const SolarForecastRecord = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("solar_forecast/1"),
  kind: z.literal("solar_forecast"),
  issued_at_iso: z.string().datetime(),
  horizon_s: z.number().positive(),
  model_version: z.string().min(1),
  p_event: z.number().min(0).max(1),
  meta: z
    .object({
      calibration_version: z.string().optional(),
      feature_window_start: z.string().datetime().optional(),
      feature_window_end: z.string().datetime().optional(),
      source: z.string().optional(),
    })
    .optional(),
});

export type TSolarForecastRecord = z.infer<typeof SolarForecastRecord>;

export const SolarOutcomeRecord = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("solar_outcome/1"),
  kind: z.literal("solar_outcome"),
  window_start_iso: z.string().datetime(),
  window_end_iso: z.string().datetime(),
  event_present: z.boolean(),
  label_source: z.string().optional(),
});

export type TSolarOutcomeRecord = z.infer<typeof SolarOutcomeRecord>;

export const ReliabilityBin = z.object({
  bin_start: z.number(),
  bin_end: z.number(),
  forecast_freq: z.number(),
  observed_freq: z.number(),
});

export type TReliabilityBin = z.infer<typeof ReliabilityBin>;

export const SolarEvalReport = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("solar_eval/1"),
  kind: z.literal("solar_eval"),
  count: z.number().int().nonnegative(),
  joined: z.number().int().nonnegative(),
  horizon_s: z.number().positive().optional(),
  model_version: z.string().optional(),
  brier_score: z.number().nonnegative().optional(),
  auc: z.number().min(0).max(1).nullable().optional(),
  baselines: z
    .object({
      null_rate_brier: z.number().nonnegative().optional(),
      persistence_brier: z.number().nonnegative().optional(),
      shuffled_brier: z.number().nonnegative().optional(),
    })
    .optional(),
  reliability: z.array(ReliabilityBin).optional(),
});

export type TSolarEvalReport = z.infer<typeof SolarEvalReport>;
