import { z } from "zod";

const Finite = z.number().finite();
const Nonnegative = Finite.nonnegative();
const Positive = Finite.positive();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Vector3 = z.tuple([Finite, Finite, Finite]);
const NonnegativeVector3 = z.tuple([Nonnegative, Nonnegative, Nonnegative]);
const Matrix3 = z.tuple([Vector3, Vector3, Vector3]);
const NonnegativeMatrix3 = z.tuple([
  z.tuple([Nonnegative, Finite, Finite]),
  z.tuple([Finite, Nonnegative, Finite]),
  z.tuple([Finite, Finite, Nonnegative]),
]);

export const CASIMIR_DP_MATERIAL_THERMAL_ORDINARY_NULL_STAGE4_2N_VERSION =
  "casimir_dp_material_thermal_ordinary_null_stage4_2n/1" as const;

export const CASIMIR_DP_STAGE4_2N_RUN_ORDER = [
  "verify_immutable_stage4_2m_leading_candidate",
  "validate_specimen_loss_table_and_imaginary_axis_response",
  "evaluate_finite_geometry_green_mean_phase_and_fdt_noise",
  "recover_zero_coupling_and_infinite_distance_limits",
  "recover_planck_stefan_boltzmann_and_near_field_thermal_accounting",
  "reconstruct_phase_and_contraction_from_calibration_interventions",
  "assemble_four_cell_ordinary_complex_coherence_null",
  "compare_without_combining_the_frozen_dp_exponents",
  "return_empirical_readiness_or_explicit_not_ready",
] as const;

const CalibrationIntervention = z.object({
  intervention_id: z.string().min(1),
  kind: z.enum([
    "electric_phase",
    "temperature",
    "gap",
    "optical_recoil",
    "sham",
  ]),
  expected_phase_rad: Finite,
  expected_chi: Nonnegative,
  observed_complex: z.tuple([Finite, Finite]),
  covariance: z.tuple([
    z.tuple([Positive, Finite]),
    z.tuple([Finite, Positive]),
  ]),
  evidence_class: z.enum(["measured", "synthetic_fixture"]),
}).strict();

export const CasimirDpMaterialThermalOrdinaryNullFixtureStage4_2N = z.object({
  schema_version: z.literal("casimir_dp_material_thermal_ordinary_null_fixture_stage4_2n/1"),
  evidence_class: z.literal("synthetic_fixture"),
  optical_response: z.object({
    material_id: z.literal("diamond_candidate_002_synthetic_response"),
    label: z.string().min(1),
    source_ref: z.string().min(1),
    raw_artifact_path: z.string().min(1),
    expected_sha256: Sha256,
    actual_sha256: Sha256,
    calibration_refs: z.array(z.string().min(1)),
    points: z.array(z.object({
      omega_rad_s: Positive,
      epsilon_imag: Nonnegative,
      standard_uncertainty: Nonnegative,
    }).strict()).min(8),
    required_coverage: z.object({
      min_omega_rad_s: Positive,
      max_omega_rad_s: Positive,
    }).strict(),
    tails: z.object({
      low_frequency_model: z.string().min(1).nullable(),
      high_frequency_model: z.string().min(1).nullable(),
    }).strict(),
    xi_rad_s: z.array(Positive).min(2),
  }).strict(),
  green_response: z.object({
    source_ref: z.string().min(1),
    solver_name: z.string().min(1),
    solver_version: z.string().min(1),
    independent_solver_receipt_available: z.literal(false),
    reciprocity_relative_tolerance: Nonnegative,
    interpolation_relative_error: Nonnegative,
    maximum_interpolation_relative_error: Nonnegative,
    samples: z.array(z.object({
      omega_rad_s: Positive,
      real_m_inv: Matrix3,
      imaginary_m_inv: Matrix3,
    }).strict()).min(2),
  }).strict(),
  probe: z.object({
    state_ref: z.string().min(1),
    polarizability_SI: Matrix3,
    oscillator_omega_rad_s: Positive,
  }).strict(),
  branch_trace: z.object({
    time_s: z.array(Nonnegative).min(2),
    branch_a_potential_J: z.array(Finite).min(2),
    branch_b_potential_J: z.array(Finite).min(2),
    branch_a_potential_standard_uncertainty_J: z.array(Nonnegative).min(2),
    branch_b_potential_standard_uncertainty_J: z.array(Nonnegative).min(2),
    branch_a_force_N: z.array(Vector3).min(2),
    branch_b_force_N: z.array(Vector3).min(2),
    branch_a_force_standard_uncertainty_N: z.array(NonnegativeVector3).min(2),
    branch_b_force_standard_uncertainty_N: z.array(NonnegativeVector3).min(2),
    differential_force_gradient_N_m: z.array(Finite).min(2),
    differential_force_gradient_standard_uncertainty_N_m: z.array(Nonnegative).min(2),
    path_swap: z.boolean(),
  }).strict(),
  noise: z.object({
    source_ref: z.string().min(1),
    omega_rad_s: z.array(Finite).min(3),
    energy_difference_psd_J2_s: z.array(Nonnegative).min(3),
    energy_difference_psd_standard_uncertainty_J2_s: z.array(Nonnegative).min(3),
    force_noise_psd_N2_s: z.array(NonnegativeMatrix3).min(3),
    force_noise_psd_standard_uncertainty_N2_s: z.array(NonnegativeMatrix3).min(3),
    ramsey_filter_abs2_s2: z.array(Nonnegative).min(3),
    echo_filter_abs2_s2: z.array(Nonnegative).min(3),
  }).strict(),
  thermal_recovery: z.object({
    source_temperature_K: Nonnegative,
    environment_temperature_K: Nonnegative,
    source_emissivity: z.number().min(0).max(1),
    environment_emissivity: z.number().min(0).max(1),
    gross_thermal_power_W: Nonnegative,
    energy_transfer_variance_rate_J2_s: Nonnegative,
    recoil_force_N: Vector3,
    occupation_heating_rate_s: Nonnegative,
    decoherence_rate_s: Nonnegative,
    accumulated_covariance: z.tuple([
      z.tuple([Finite, Finite, Finite, Finite]),
      z.tuple([Finite, Finite, Finite, Finite]),
      z.tuple([Finite, Finite, Finite, Finite]),
      z.tuple([Finite, Finite, Finite, Finite]),
    ]),
  }).strict(),
  calibration_interventions: z.array(CalibrationIntervention).min(5),
  empirical_authorities: z.object({
    specimen_specific_temperature_matched_spectrum: z.literal(false),
    as_built_cad_and_alignment: z.literal(false),
    full_maxwell_green_tensor: z.literal(false),
    independent_green_solver: z.literal(false),
    measured_phase_loss_calibrations: z.literal(false),
    measured_block_covariance: z.literal(false),
  }).strict(),
}).strict();

export const CasimirDpMaterialThermalOrdinaryNullStage4_2NConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_MATERIAL_THERMAL_ORDINARY_NULL_STAGE4_2N_VERSION),
  campaign_id: z.literal("casimir-dp-material-thermal-ordinary-null-stage4-2n-v1"),
  evidence_class: z.literal("synthetic_material_green_fdt_pipeline_validation_only"),
  claim_ceiling: z.literal("material_resolved_ordinary_null_commissioning_requirements_only"),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  run_order: z.tuple([
    z.literal("verify_immutable_stage4_2m_leading_candidate"),
    z.literal("validate_specimen_loss_table_and_imaginary_axis_response"),
    z.literal("evaluate_finite_geometry_green_mean_phase_and_fdt_noise"),
    z.literal("recover_zero_coupling_and_infinite_distance_limits"),
    z.literal("recover_planck_stefan_boltzmann_and_near_field_thermal_accounting"),
    z.literal("reconstruct_phase_and_contraction_from_calibration_interventions"),
    z.literal("assemble_four_cell_ordinary_complex_coherence_null"),
    z.literal("compare_without_combining_the_frozen_dp_exponents"),
    z.literal("return_empirical_readiness_or_explicit_not_ready"),
  ]),
  upstream_stage4_2m: z.object({
    verification_receipt_path: z.string().min(1),
    verification_receipt_sha256: Sha256,
    run_id: z.literal("casimir-dp-apparatus-search-stage4-2m-v1-20260806T070000000Z"),
    candidate_id: z.literal("stage4_2m_candidate_002"),
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
  frozen_dp_comparator: z.object({
    model_id: z.literal("diosi_1989_gaussian_regularized_nondissipative"),
    R0_m: Positive,
    conservative_density_envelope_exponent: Positive,
    gaussian_exponent: Positive,
    combined_with_ordinary_null: z.literal(false),
  }).strict(),
  gates: z.object({
    maximum_kramers_kronig_relative_uncertainty: Nonnegative,
    maximum_phase_sigma_rad: Positive,
    maximum_calibration_mahalanobis2: Positive,
    maximum_limit_magnitude: Nonnegative,
    require_planck_stefan_boltzmann_recovery: z.literal(true),
    require_zero_coupling_recovery: z.literal(true),
    require_infinite_distance_recovery: z.literal(true),
    require_single_counted_thermal_channel: z.literal(true),
  }).strict(),
  standing: z.object({
    measured_evidence: z.literal("not_ready"),
    ordinary_null_authority: z.literal("not_ready"),
    residual_attribution: z.literal("blocked"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
    physical_pilot_authorized: z.literal(false),
    confirmatory_campaign_authorized: z.literal(false),
  }).strict(),
}).strict();

export type CasimirDpMaterialThermalOrdinaryNullFixtureStage4_2N = z.infer<
  typeof CasimirDpMaterialThermalOrdinaryNullFixtureStage4_2N
>;

export type CasimirDpMaterialThermalOrdinaryNullStage4_2NConfig = z.infer<
  typeof CasimirDpMaterialThermalOrdinaryNullStage4_2NConfig
>;
