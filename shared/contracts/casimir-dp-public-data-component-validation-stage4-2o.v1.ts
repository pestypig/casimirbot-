import { z } from "zod";

const Finite = z.number().finite();
const Positive = Finite.positive();
const Nonnegative = Finite.nonnegative();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Complex = z.tuple([Finite, Finite]);
const Matrix = z.array(z.array(Finite).min(1)).min(1);

export const CASIMIR_DP_PUBLIC_DATA_COMPONENT_VALIDATION_STAGE4_2O_VERSION =
  "casimir_dp_public_data_component_validation_stage4_2o/1" as const;

export const CASIMIR_DP_STAGE4_2O_RUN_ORDER = [
  "verify_immutable_stage4_2n_leading_design",
  "authenticate_public_source_archives",
  "recover_sodium_complex_fringe_coefficients",
  "recover_measured_superconducting_drum_response",
  "recover_lisa_pathfinder_covariance_and_heldout_residual",
  "authenticate_gran_sasso_external_dp_bound",
  "enforce_no_cross_apparatus_covariance_fusion",
  "return_component_validation_without_joint_protocol_promotion",
] as const;

const SourceReceipt = z.object({
  source_id: z.string().min(1),
  filename: z.string().min(1),
  url: z.string().url(),
  record: z.string().url(),
  expected_sha256: Sha256,
  actual_sha256: Sha256,
  integrity_verified: z.literal(true),
}).strict();

export const CasimirDpPublicDataComponentFixtureStage4_2O = z.object({
  schema_version: z.literal("casimir_dp_public_data_component_fixture_stage4_2o/1"),
  evidence_class: z.literal("external_public_component_measurements_only"),
  cross_apparatus_covariance_fusion: z.literal(false),
  sources: z.object({
    sodium: SourceReceipt,
    casimir: SourceReceipt,
    lisa_pathfinder: SourceReceipt,
    gran_sasso_fig3: SourceReceipt,
    gran_sasso_fig4: SourceReceipt,
  }).strict(),
  components: z.object({
    sodium: z.object({
      role: z.literal("complex_fringe_recovery"),
      observable_definition: z.string().min(1),
      period_nm: Positive,
      nominal_bin_nm: Positive,
      scan_count: z.number().int().positive(),
      scans: z.array(z.object({
        scan_id: z.number().int().positive(),
        sample_count: z.number().int().positive(),
        mean_counts: Nonnegative,
        coefficient_re: Finite,
        coefficient_im: Finite,
        visibility: Nonnegative,
        phase_rad: Finite,
      }).strict()).min(2),
      alternating_split: z.object({
        train_count: z.number().int().positive(),
        holdout_count: z.number().int().positive(),
        train_mean_complex: Complex,
        holdout_mean_complex: Complex,
        train_covariance: z.tuple([z.tuple([Finite, Finite]), z.tuple([Finite, Finite])]),
        holdout_covariance: z.tuple([z.tuple([Finite, Finite]), z.tuple([Finite, Finite])]),
      }).strict(),
      claim_boundary: z.string().min(1),
    }).strict(),
    casimir: z.object({
      role: z.literal("measured_boundary_response_recovery"),
      dataset_description: z.string().min(1),
      array_shape: z.array(z.number().int().positive()).length(4),
      trace_count: z.number().int().positive(),
      down_centroid_Hz: z.array(Positive).min(2),
      up_centroid_Hz: z.array(Positive).min(2),
      paired_centroid_covariance_Hz2: z.tuple([z.tuple([Finite, Finite]), z.tuple([Finite, Finite])]),
      up_minus_down_shift: z.object({
        mean_Hz: Finite,
        rms_Hz: Nonnegative,
        median_absolute_Hz: Nonnegative,
        p95_absolute_Hz: Nonnegative,
      }).strict(),
      claim_boundary: z.string().min(1),
    }).strict(),
    lisa_pathfinder: z.object({
      role: z.literal("multichannel_covariance_recovery"),
      channel_ids: z.array(z.string().min(1)).min(4),
      channel_semantics: z.array(z.string().min(1)).min(4),
      active_row_count: z.number().int().positive(),
      window_size_s: z.number().int().positive(),
      train_window_count: z.number().int().positive(),
      holdout_window_count: z.number().int().positive(),
      standardization_mean_SI: z.array(Finite).min(4),
      standardization_scale_SI: z.array(Positive).min(4),
      shrinkage_fraction: z.number().min(0).max(1),
      train_covariance: Matrix,
      holdout_covariance: Matrix,
      train_shrunk_condition_number: Positive,
      holdout_shrunk_condition_number: Positive,
      relative_covariance_drift: Nonnegative,
      linear_residual: z.object({
        target_channel: z.string().min(1),
        train_rmse_standardized: Nonnegative,
        holdout_rmse_standardized: Nonnegative,
        holdout_mean_standardized: Finite,
      }).strict(),
      claim_boundary: z.string().min(1),
    }).strict(),
    gran_sasso: z.object({
      role: z.literal("external_dp_bound"),
      paper_result: z.string().min(1),
      fig3: z.object({
        bin_count: z.number().int().positive(),
        energy_min_keV: Nonnegative,
        energy_max_keV: Positive,
        total_counts: Nonnegative,
      }).strict(),
      fig4: z.object({
        bin_count: z.number().int().positive(),
        energy_min_keV: Nonnegative,
        energy_max_keV: Positive,
        data_total_counts: Nonnegative,
        simulation_total_counts: Nonnegative,
        data_simulation_pearson: z.number().min(-1).max(1),
      }).strict(),
      registered_stage4_2o_model_adjudication: z.literal("not_adjudicated"),
      claim_boundary: z.string().min(1),
    }).strict(),
  }).strict(),
  joint_protocol_cells_present: z.literal(false),
  leading_design_modified: z.literal(false),
}).strict();

export const CasimirDpPublicDataComponentValidationStage4_2OConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_PUBLIC_DATA_COMPONENT_VALIDATION_STAGE4_2O_VERSION),
  campaign_id: z.literal("casimir-dp-public-data-component-validation-stage4-2o-v1"),
  evidence_class: z.literal("external_public_component_validation_only"),
  claim_ceiling: z.literal("separate_public_dataset_recovery_only"),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  cross_apparatus_covariance_fusion_allowed: z.literal(false),
  run_order: z.tuple([
    z.literal("verify_immutable_stage4_2n_leading_design"),
    z.literal("authenticate_public_source_archives"),
    z.literal("recover_sodium_complex_fringe_coefficients"),
    z.literal("recover_measured_superconducting_drum_response"),
    z.literal("recover_lisa_pathfinder_covariance_and_heldout_residual"),
    z.literal("authenticate_gran_sasso_external_dp_bound"),
    z.literal("enforce_no_cross_apparatus_covariance_fusion"),
    z.literal("return_component_validation_without_joint_protocol_promotion"),
  ]),
  upstream_stage4_2n: z.object({
    campaign_receipt_path: z.string().min(1),
    campaign_receipt_sha256: Sha256,
    run_id: z.literal("casimir-dp-material-thermal-ordinary-null-stage4-2n-v1-20260806T120000000Z"),
  }).strict(),
  fixture_path: z.string().min(1),
  fixture_sha256: Sha256,
  leading_design: z.object({
    material_id: z.literal("diamond"),
    radius_m: Positive,
    mass_kg: Positive,
    branch_separation_m: Positive,
    hold_time_s: Positive,
    gap_m: Positive,
    plate_size_m: Positive,
    temperature_K: Positive,
    pressure_Pa: Positive,
  }).strict(),
  gates: z.object({
    minimum_sodium_scan_count: z.number().int().positive(),
    maximum_sodium_split_mahalanobis2: Positive,
    minimum_casimir_trace_count: z.number().int().positive(),
    minimum_casimir_shift_rms_Hz: Positive,
    maximum_lisa_shrunk_condition_number: Positive,
    maximum_lisa_relative_covariance_drift: Positive,
    maximum_lisa_holdout_to_train_rmse_ratio: Positive,
    minimum_gran_sasso_fig4_bins: z.number().int().positive(),
    minimum_gran_sasso_data_simulation_pearson: z.number().min(-1).max(1),
  }).strict(),
  standing: z.object({
    measured_evidence: z.literal("not_ready"),
    joint_protocol_validation: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
    physical_pilot_authorized: z.literal(false),
    confirmatory_campaign_authorized: z.literal(false),
  }).strict(),
}).strict();

export type CasimirDpPublicDataComponentFixtureStage4_2O = z.infer<
  typeof CasimirDpPublicDataComponentFixtureStage4_2O
>;
export type CasimirDpPublicDataComponentValidationStage4_2OConfig = z.infer<
  typeof CasimirDpPublicDataComponentValidationStage4_2OConfig
>;
