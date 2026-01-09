import { z } from "zod";
import { TokamakRzSnapshotInput } from "./tokamak-energy-field";
import { TokamakStabilityProxyMetrics } from "./tokamak-stability-proxies";
import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";

export const TokamakPrecursorScoreKey = z.enum([
  "u_total_p95",
  "u_deltaB_p95",
  "u_gradp_p95",
  "u_J_p95",
  "u_rad_p95",
  "k2",
  "fragmentation_rate",
  "k_combo_v1",
]);

export type TTokamakPrecursorScoreKey = z.infer<typeof TokamakPrecursorScoreKey>;

export const TokamakPrecursorLabel = z.object({
  event_present: z.boolean(),
  event_type: z.enum(["edge_crash", "tearing"]).optional(),
});

export type TTokamakPrecursorLabel = z.infer<typeof TokamakPrecursorLabel>;

export const TokamakPrecursorFrame = z.object({
  id: z.string().min(1),
  timestamp_iso: z.string().datetime(),
  snapshot: TokamakRzSnapshotInput,
  label: TokamakPrecursorLabel,
});

export type TTokamakPrecursorFrame = z.infer<typeof TokamakPrecursorFrame>;

export const TokamakPrecursorDataset = z.object({
  schema_version: z.literal("tokamak_precursor_dataset/1"),
  kind: z.literal("tokamak_precursor_dataset"),
  created_at: z.string().datetime(),
  name: z.string().optional(),
  description: z.string().optional(),
  frames: z.array(TokamakPrecursorFrame).min(1),
});

export type TTokamakPrecursorDataset = z.infer<typeof TokamakPrecursorDataset>;

export const TokamakPrecursorFrameMetrics = z.object({
  u_total_p95: z.number().nonnegative(),
  u_deltaB_p95: z.number().nonnegative().optional(),
  u_gradp_p95: z.number().nonnegative().optional(),
  u_J_p95: z.number().nonnegative().optional(),
  u_rad_p95: z.number().nonnegative().optional(),
  k0: z.number().nonnegative().optional(),
  k1: z.number().nonnegative().optional(),
  k2: z.number().nonnegative().optional(),
  k3: z.number().min(0).max(1).optional(),
  ridge_count: z.number().int().nonnegative().optional(),
  ridge_length_m: z.number().nonnegative().optional(),
  fragmentation_rate: z.number().nonnegative().optional(),
  fragmentation_index: z.number().nonnegative().optional(),
  fragmentation_rate_per_s: z.number().nonnegative().optional(),
  fragmentation_rate_per_m: z.number().nonnegative().optional(),
  ridge_lifetime_p50: z.number().nonnegative().optional(),
  ridge_lifetime_p90: z.number().nonnegative().optional(),
  ridge_lifetime_mean: z.number().nonnegative().optional(),
  ridge_length_density: z.number().nonnegative().optional(),
  edge_core_decoupling_k2: z.number().optional(),
  edge_core_ratio_k2: z.number().nonnegative().optional(),
  k2_dt: z.number().optional(),
  fragmentation_dt: z.number().optional(),
  bands: z
    .object({
      core: z
        .object({
          k0: z.number().nonnegative(),
          k1: z.number().nonnegative(),
          k2: z.number().nonnegative(),
          ridge_count: z.number().int().nonnegative(),
          ridge_length_m: z.number().nonnegative(),
          fragmentation_index: z.number().nonnegative(),
          coverage: z.number().min(0).max(1).optional(),
        })
        .optional(),
      edge: z
        .object({
          k0: z.number().nonnegative(),
          k1: z.number().nonnegative(),
          k2: z.number().nonnegative(),
          ridge_count: z.number().int().nonnegative(),
          ridge_length_m: z.number().nonnegative(),
          fragmentation_index: z.number().nonnegative(),
          coverage: z.number().min(0).max(1).optional(),
        })
        .optional(),
      sol: z
        .object({
          k0: z.number().nonnegative(),
          k1: z.number().nonnegative(),
          k2: z.number().nonnegative(),
          ridge_count: z.number().int().nonnegative(),
          ridge_length_m: z.number().nonnegative(),
          fragmentation_index: z.number().nonnegative(),
          coverage: z.number().min(0).max(1).optional(),
        })
        .optional(),
    })
    .optional(),
  coherence_budget: z
    .object({
      channels: z
        .object({
          u_deltaB_Jm3: z
            .object({
              k2: z.number().nonnegative().optional(),
              fragmentation_index: z.number().nonnegative().optional(),
            })
            .optional(),
          u_gradp: z
            .object({
              k2: z.number().nonnegative().optional(),
              fragmentation_index: z.number().nonnegative().optional(),
            })
            .optional(),
          u_J: z
            .object({
              k2: z.number().nonnegative().optional(),
              fragmentation_index: z.number().nonnegative().optional(),
            })
            .optional(),
          u_rad: z
            .object({
              k2: z.number().nonnegative().optional(),
              fragmentation_index: z.number().nonnegative().optional(),
            })
            .optional(),
        })
        .optional(),
      k2_share: z
        .object({
          u_deltaB_Jm3: z.number().min(0).max(1).optional(),
          u_gradp: z.number().min(0).max(1).optional(),
          u_J: z.number().min(0).max(1).optional(),
          u_rad: z.number().min(0).max(1).optional(),
        })
        .optional(),
      leading_k2_channel: z.string().optional(),
      leading_fragmentation_channel: z.string().optional(),
    })
    .optional(),
  stability_proxies: TokamakStabilityProxyMetrics.optional(),
});

export type TTokamakPrecursorFrameMetrics = z.infer<typeof TokamakPrecursorFrameMetrics>;

export const TokamakPrecursorFrameResult = z.object({
  id: z.string().min(1),
  timestamp_iso: z.string().datetime(),
  label: TokamakPrecursorLabel,
  metrics: TokamakPrecursorFrameMetrics,
  score: z.number(),
});

export type TTokamakPrecursorFrameResult = z.infer<typeof TokamakPrecursorFrameResult>;

export const TokamakPrecursorRocPoint = z.object({
  threshold: z.number(),
  tpr: z.number().min(0).max(1),
  fpr: z.number().min(0).max(1),
});

export type TTokamakPrecursorRocPoint = z.infer<typeof TokamakPrecursorRocPoint>;

export const TokamakPhaseLockScanPoint = z.object({
  frequency_hz: z.number().positive(),
  k3: z.number().min(0).max(1),
});

export type TTokamakPhaseLockScanPoint = z.infer<typeof TokamakPhaseLockScanPoint>;

export const TokamakPhaseLockBandwidth = z.object({
  low_hz: z.number().nonnegative(),
  high_hz: z.number().nonnegative(),
  width_hz: z.number().nonnegative(),
  threshold: z.number().min(0).max(1),
});

export type TTokamakPhaseLockBandwidth = z.infer<typeof TokamakPhaseLockBandwidth>;

export const TokamakPhaseSlipEvent = z.object({
  frame_id: z.string().min(1),
  timestamp_iso: z.string().datetime(),
  t_s: z.number().optional(),
  coherence: z.number().min(0).max(1),
  delta: z.number(),
});

export type TTokamakPhaseSlipEvent = z.infer<typeof TokamakPhaseSlipEvent>;

export const TokamakChiStats = z.object({
  count: z.number().int().nonnegative(),
  mean: z.number().nonnegative().optional(),
  p50: z.number().nonnegative().optional(),
  p90: z.number().nonnegative().optional(),
});

export type TTokamakChiStats = z.infer<typeof TokamakChiStats>;

export const TokamakChiByLabel = z.object({
  stable: TokamakChiStats.optional(),
  unstable: TokamakChiStats.optional(),
});

export type TTokamakChiByLabel = z.infer<typeof TokamakChiByLabel>;

export const TokamakChiSummary = z.object({
  reference_frequency_hz: z.number().positive().optional(),
  tau_char_s: z
    .object({
      tau_alfven_s: z.number().positive().optional(),
      tau_growth_k2_s: z.number().positive().optional(),
      tau_growth_fragmentation_s: z.number().positive().optional(),
      tau_E_s: z.number().positive().optional(),
    })
    .optional(),
  chi_values: z
    .object({
      alfven: z.number().nonnegative().optional(),
      growth_k2: z.number().nonnegative().optional(),
      growth_fragmentation: z.number().nonnegative().optional(),
      tau_E: z.number().nonnegative().optional(),
    })
    .optional(),
  chi_by_label: z
    .object({
      growth_k2: TokamakChiByLabel.optional(),
      growth_fragmentation: TokamakChiByLabel.optional(),
      alfven: TokamakChiByLabel.optional(),
      tau_E: TokamakChiByLabel.optional(),
    })
    .optional(),
});

export type TTokamakChiSummary = z.infer<typeof TokamakChiSummary>;

export const TokamakPhaseDetuningPoint = z.object({
  frame_id: z.string().min(1),
  timestamp_iso: z.string().datetime(),
  t_s: z.number().optional(),
  f_mode_hz: z.number().nonnegative().optional(),
  delta: z.number().optional(),
  abs_delta: z.number().optional(),
});

export type TTokamakPhaseDetuningPoint = z.infer<
  typeof TokamakPhaseDetuningPoint
>;

export const TokamakPhaseDetuningByLabel = z.object({
  stable: TokamakChiStats.optional(),
  unstable: TokamakChiStats.optional(),
  spike_count: z.number().int().nonnegative().optional(),
  spike_rate_per_s: z.number().nonnegative().optional(),
  threshold: z.number().nonnegative().optional(),
});

export type TTokamakPhaseDetuningByLabel = z.infer<
  typeof TokamakPhaseDetuningByLabel
>;

export const TokamakPhaseDetuningReport = z.object({
  f_star_hz: z.number().positive(),
  bandwidth_hz: TokamakPhaseLockBandwidth,
  series: z.array(TokamakPhaseDetuningPoint),
  stats: TokamakPhaseDetuningByLabel.optional(),
});

export type TTokamakPhaseDetuningReport = z.infer<
  typeof TokamakPhaseDetuningReport
>;

export const TokamakPhaseLockReport = z.object({
  scan: z.array(TokamakPhaseLockScanPoint),
  f_star_hz: z.number().positive().optional(),
  k3_star: z.number().min(0).max(1).optional(),
  bandwidth_hz: TokamakPhaseLockBandwidth.optional(),
  phase_slips: z.array(TokamakPhaseSlipEvent),
  phase_slip_count: z.number().int().nonnegative().optional(),
  phase_slip_rate_per_s: z.number().nonnegative().optional(),
  detuning: TokamakPhaseDetuningReport.optional(),
  chi: TokamakChiSummary.optional(),
});

export type TTokamakPhaseLockReport = z.infer<typeof TokamakPhaseLockReport>;

export const TokamakPrecursorMetricCI = z.object({
  method: z.enum(["bootstrap", "jackknife"]),
  samples: z.number().int().nonnegative(),
  mean: z.number().optional(),
  p50: z.number().optional(),
  lower: z.number().optional(),
  upper: z.number().optional(),
  std_error: z.number().optional(),
});

export type TTokamakPrecursorMetricCI = z.infer<typeof TokamakPrecursorMetricCI>;

export const TokamakPrecursorConfidence = z.object({
  bootstrap: TokamakPrecursorMetricCI.optional(),
  jackknife: TokamakPrecursorMetricCI.optional(),
});

export type TTokamakPrecursorConfidence = z.infer<
  typeof TokamakPrecursorConfidence
>;

export const TokamakPrecursorOperatingPoint = z.object({
  threshold: z.number(),
  false_alarm_rate: z.number().min(0).max(1),
  lead_time_s: z
    .object({
      count: z.number().int().nonnegative(),
      mean: z.number().nonnegative().optional(),
      p50: z.number().nonnegative().optional(),
      p90: z.number().nonnegative().optional(),
    })
    .optional(),
});

export type TTokamakPrecursorOperatingPoint = z.infer<
  typeof TokamakPrecursorOperatingPoint
>;

export const TokamakPrecursorUncertainty = z.object({
  seed: z.string().min(1).optional(),
  operating_point: TokamakPrecursorOperatingPoint.optional(),
  auc: TokamakPrecursorConfidence.optional(),
  false_alarm_rate: TokamakPrecursorConfidence.optional(),
  lead_time_s: TokamakPrecursorConfidence.optional(),
});

export type TTokamakPrecursorUncertainty = z.infer<
  typeof TokamakPrecursorUncertainty
>;

export const TokamakPrecursorFeatureImpact = z.object({
  auc: z.number().min(0).max(1).nullable(),
  auc_delta: z.number().nullable(),
});

export type TTokamakPrecursorFeatureImpact = z.infer<
  typeof TokamakPrecursorFeatureImpact
>;

export const TokamakPrecursorFeatureSensitivity = z.object({
  ablation: z.record(z.string(), TokamakPrecursorFeatureImpact).optional(),
  permutation: z.record(z.string(), TokamakPrecursorFeatureImpact).optional(),
  seed: z.string().min(1).optional(),
});

export type TTokamakPrecursorFeatureSensitivity = z.infer<
  typeof TokamakPrecursorFeatureSensitivity
>;

export const TokamakPrecursorFeatureVectorSet = z.object({
  features: z.array(z.string()).min(1),
  vectors: z.array(z.array(z.number())),
});

export type TTokamakPrecursorFeatureVectorSet = z.infer<
  typeof TokamakPrecursorFeatureVectorSet
>;

export const TokamakPrecursorFeatureVectorReport = z.object({
  physics_only: TokamakPrecursorFeatureVectorSet,
  physics_plus_curvature: TokamakPrecursorFeatureVectorSet,
});

export type TTokamakPrecursorFeatureVectorReport = z.infer<
  typeof TokamakPrecursorFeatureVectorReport
>;

export const TokamakPrecursorDomainShiftScenario = z.object({
  id: z.string().min(1),
  auc: z.number().min(0).max(1).nullable(),
  auc_delta: z.number().nullable(),
  score_corr: z.number().min(-1).max(1).nullable(),
  config: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
});

export type TTokamakPrecursorDomainShiftScenario = z.infer<
  typeof TokamakPrecursorDomainShiftScenario
>;

export const TokamakPrecursorDomainShiftReport = z.object({
  scenarios: z.array(TokamakPrecursorDomainShiftScenario),
});

export type TTokamakPrecursorDomainShiftReport = z.infer<
  typeof TokamakPrecursorDomainShiftReport
>;

export const TokamakPrecursorStatSummary = z.object({
  count: z.number().int().nonnegative(),
  mean: z.number().optional(),
  p50: z.number().optional(),
  p90: z.number().optional(),
});

export type TTokamakPrecursorStatSummary = z.infer<
  typeof TokamakPrecursorStatSummary
>;

export const TokamakPrecursorHazardModel = z.object({
  features: z.array(z.string()).min(1),
  weights: z.array(z.number()),
  bias: z.number(),
  means: z.array(z.number()),
  scales: z.array(z.number()),
});

export type TTokamakPrecursorHazardModel = z.infer<
  typeof TokamakPrecursorHazardModel
>;

export const TokamakPrecursorHazardPoint = z.object({
  frame_id: z.string().min(1),
  timestamp_iso: z.string().datetime(),
  t_s: z.number().optional(),
  delta_t_s: z.number().optional(),
  hazard_prob: z.number().min(0).max(1),
  event_next: z.boolean().optional(),
});

export type TTokamakPrecursorHazardPoint = z.infer<
  typeof TokamakPrecursorHazardPoint
>;

export const TokamakPrecursorHazardReport = z.object({
  model: TokamakPrecursorHazardModel.optional(),
  auc: z.number().min(0).max(1).nullable(),
  series: z.array(TokamakPrecursorHazardPoint),
  notes: z.string().optional(),
});

export type TTokamakPrecursorHazardReport = z.infer<
  typeof TokamakPrecursorHazardReport
>;

export const TokamakPrecursorCulpabilityEntry = z.object({
  channel: z.string().min(1),
  weight: z.number(),
  epsilon: z.number().positive(),
  mean_score_delta: z.number().optional(),
  auc_delta: z.number().nullable().optional(),
  gradient: z.number().nullable().optional(),
  contribution: z.number().optional(),
  normalized_contribution: z.number().min(-1).max(1).optional(),
  rank: z.number().int().positive().optional(),
});

export type TTokamakPrecursorCulpabilityEntry = z.infer<
  typeof TokamakPrecursorCulpabilityEntry
>;

export const TokamakPrecursorCulpabilityReport = z.object({
  method: z.enum(["finite-diff"]),
  entries: z.array(TokamakPrecursorCulpabilityEntry),
  notes: z.string().optional(),
});

export type TTokamakPrecursorCulpabilityReport = z.infer<
  typeof TokamakPrecursorCulpabilityReport
>;

export const TokamakCulpabilityArtifact = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("tokamak_culpability/1"),
  kind: z.literal("tokamak_culpability"),
  generated_at_iso: z.string().datetime(),
  score_key: TokamakPrecursorScoreKey,
  report_hash: z.string().min(8),
  entries: z.array(TokamakPrecursorCulpabilityEntry),
  notes: z.string().optional(),
});

export type TTokamakCulpabilityArtifact = z.infer<
  typeof TokamakCulpabilityArtifact
>;

export const TokamakPrecursorNormalizationReport = z.object({
  ridge_topology_change_rate_per_s: z.number().nonnegative().optional(),
  ridge_fragmentation_rate_mean: z.number().nonnegative().optional(),
  ridge_survival: z
    .object({
      total_tracks: z.number().int().nonnegative(),
      max_lifetime_frames: z.number().int().nonnegative(),
    })
    .optional(),
  phase_slip_count: z.number().int().nonnegative().optional(),
  phase_slip_rate_per_s: z.number().nonnegative().optional(),
});

export type TTokamakPrecursorNormalizationReport = z.infer<
  typeof TokamakPrecursorNormalizationReport
>;

export const TokamakRidgeSurvivalCI = z.object({
  lower: z.number().nonnegative(),
  upper: z.number().nonnegative(),
});

export type TTokamakRidgeSurvivalCI = z.infer<typeof TokamakRidgeSurvivalCI>;

export const TokamakRidgeSurvivalPoint = z.object({
  t_frames: z.number().int().nonnegative(),
  survival: z.number().min(0).max(1),
  hazard: z.number().min(0).max(1),
  mean_residual_life: z.number().nonnegative(),
  survival_ci: TokamakRidgeSurvivalCI.optional(),
  hazard_ci: TokamakRidgeSurvivalCI.optional(),
  mean_residual_life_ci: TokamakRidgeSurvivalCI.optional(),
});

export type TTokamakRidgeSurvivalPoint = z.infer<
  typeof TokamakRidgeSurvivalPoint
>;

export const TokamakRidgeSurvivalSummary = z.object({
  total_tracks: z.number().int().nonnegative(),
  max_lifetime_frames: z.number().int().nonnegative(),
  points: z.array(TokamakRidgeSurvivalPoint),
  bootstrap: z
    .object({
      samples: z.number().int().nonnegative(),
      seed: z.string().min(1),
      lower_q: z.number().min(0).max(1),
      upper_q: z.number().min(0).max(1),
    })
    .optional(),
});

export type TTokamakRidgeSurvivalSummary = z.infer<
  typeof TokamakRidgeSurvivalSummary
>;

export const TokamakPrecursorControlObjective = z.object({
  mode: z.literal("linear"),
  weights: z.object({
    k2: z.number().nonnegative().optional(),
    fragmentation_rate: z.number().nonnegative().optional(),
    k1: z.number().nonnegative().optional(),
    k3: z.number().nonnegative().optional(),
  }),
  lower_is_better: z.boolean(),
  notes: z.string().optional(),
});

export type TTokamakPrecursorControlObjective = z.infer<
  typeof TokamakPrecursorControlObjective
>;

export const TokamakPrecursorControlSummary = z.object({
  k1: TokamakPrecursorStatSummary.optional(),
  k2: TokamakPrecursorStatSummary.optional(),
  k3: TokamakPrecursorStatSummary.optional(),
  fragmentation_rate: TokamakPrecursorStatSummary.optional(),
  ridge_count: TokamakPrecursorStatSummary.optional(),
  ridge_length_m: TokamakPrecursorStatSummary.optional(),
  ridge_lifetime_p50: TokamakPrecursorStatSummary.optional(),
  ridge_lifetime_p90: TokamakPrecursorStatSummary.optional(),
  coherence_objective: TokamakPrecursorStatSummary.optional(),
  ridge_survival: z
    .object({
      total_tracks: z.number().int().nonnegative(),
      max_lifetime_frames: z.number().int().nonnegative(),
    })
    .optional(),
});

export type TTokamakPrecursorControlSummary = z.infer<
  typeof TokamakPrecursorControlSummary
>;

export const TokamakPrecursorControlScenario = z.object({
  id: z.string().min(1),
  kind: z.enum(["u_J_ramp", "u_gradp_reduce", "drive_frequency"]),
  config: z.record(z.string(), z.any()).optional(),
  baseline: TokamakPrecursorControlSummary.optional(),
  actuated: TokamakPrecursorControlSummary.optional(),
  delta: TokamakPrecursorControlSummary.optional(),
  notes: z.string().optional(),
});

export type TTokamakPrecursorControlScenario = z.infer<
  typeof TokamakPrecursorControlScenario
>;

export const TokamakPrecursorControlReport = z.object({
  objective: TokamakPrecursorControlObjective.optional(),
  scenarios: z.array(TokamakPrecursorControlScenario),
});

export type TTokamakPrecursorControlReport = z.infer<
  typeof TokamakPrecursorControlReport
>;

export const TokamakPrecursorReport = z.object({
  schema_version: z.literal("tokamak_precursor_report/1"),
  kind: z.literal("tokamak_precursor_report"),
  generated_at_iso: z.string().datetime(),
  dataset_path: z.string().optional(),
  score_key: TokamakPrecursorScoreKey,
  auc: z.number().min(0).max(1).nullable(),
  frames: z.array(TokamakPrecursorFrameResult),
  roc_curve: z.array(TokamakPrecursorRocPoint),
  report_hash: z.string().min(8),
  feature_vectors: TokamakPrecursorFeatureVectorReport.optional(),
  ridge_survival: TokamakRidgeSurvivalSummary.optional(),
  phase_lock: TokamakPhaseLockReport.optional(),
  uncertainty: TokamakPrecursorUncertainty.optional(),
  feature_sensitivity: TokamakPrecursorFeatureSensitivity.optional(),
  domain_shift: TokamakPrecursorDomainShiftReport.optional(),
  hazard_forecast: TokamakPrecursorHazardReport.optional(),
  culpability: TokamakPrecursorCulpabilityReport.optional(),
  culpability_artifact: TokamakCulpabilityArtifact.optional(),
  culpability_artifact_hash: z.string().min(8).optional(),
  culpability_artifact_path: z.string().min(1).optional(),
  normalization: TokamakPrecursorNormalizationReport.optional(),
  control_experiments: TokamakPrecursorControlReport.optional(),
});

export type TTokamakPrecursorReport = z.infer<typeof TokamakPrecursorReport>;
