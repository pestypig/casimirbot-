import { z } from "zod";

const Finite = z.number().finite();
const Positive = Finite.positive();
const Nonnegative = Finite.nonnegative();
const Fraction = Finite.min(0).max(1);
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Vec3 = z.tuple([Finite, Finite, Finite]);

export const CASIMIR_DP_PROPER_TIME_WORLDLINE_CLOSURE_STAGE4_2P_VERSION =
  "casimir_dp_proper_time_worldline_closure_stage4_2p/1" as const;

export const CASIMIR_DP_STAGE4_2P_RUN_ORDER = [
  "verify_immutable_stage4_2o_component_receipt",
  "bind_leading_stage4_2m_apparatus_without_modification",
  "recover_minkowski_and_equal_worldline_limits",
  "integrate_weak_field_branch_proper_time",
  "propagate_earth_gradient_rotation_local_mass_and_kinematic_phase",
  "apply_frequency_resolved_echo_and_path_swap_response",
  "bound_internal_energy_time_dilation_dephasing",
  "combine_with_ordinary_em_clock_and_control_phase_covariance",
  "enforce_registered_total_phase_gate",
  "preserve_frozen_diosi_law_and_zero_bridge_policy",
] as const;

const LocalMass = z.object({
  id: z.string().min(1),
  mass_kg: Positive,
  mass_relative_sigma: Nonnegative,
  position_m: Vec3,
  position_sigma_m: Nonnegative,
}).strict();

const EchoSpectralBin = z.object({
  frequency_Hz: Positive,
  tilt_asd_rad_per_sqrt_Hz: Nonnegative,
  bandwidth_Hz: Positive,
  echo_transfer_magnitude: Nonnegative,
}).strict();

export const CasimirDpProperTimeWorldlineClosureStage4_2PConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_PROPER_TIME_WORLDLINE_CLOSURE_STAGE4_2P_VERSION),
  campaign_id: z.literal("casimir-dp-proper-time-worldline-closure-stage4-2p-v1"),
  evidence_class: z.literal("synthetic_ordinary_relativistic_phase_closure_only"),
  claim_ceiling: z.literal("ordinary_unitary_proper_time_and_phase_budget_only"),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  frozen_diosi_law_modified: z.literal(false),
  run_order: z.tuple(CASIMIR_DP_STAGE4_2P_RUN_ORDER.map((entry) => z.literal(entry)) as [
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2P_RUN_ORDER)[0]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2P_RUN_ORDER)[1]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2P_RUN_ORDER)[2]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2P_RUN_ORDER)[3]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2P_RUN_ORDER)[4]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2P_RUN_ORDER)[5]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2P_RUN_ORDER)[6]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2P_RUN_ORDER)[7]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2P_RUN_ORDER)[8]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2P_RUN_ORDER)[9]>,
  ]),
  upstream_stage4_2o: z.object({
    campaign_receipt_path: z.string().min(1),
    campaign_receipt_sha256: Sha256,
    run_id: z.literal("casimir-dp-public-data-component-validation-stage4-2o-v1-20260807T120000000Z"),
  }).strict(),
  constants: z.object({
    c_m_s: Positive,
    hbar_J_s: Positive,
    G_m3_kg_s2: Positive,
    earth_g_m_s2: Positive,
    earth_rotation_rad_s: Positive,
  }).strict(),
  apparatus: z.object({
    material_id: z.literal("diamond"),
    mass_kg: Positive,
    radius_m: Positive,
    branch_separation_vector_m: Vec3,
    branch_midpoint_m: Vec3,
    hold_time_s: Positive,
    gap_m: Positive,
    nominal_branch_velocity_A_m_s: Vec3,
    nominal_branch_velocity_B_m_s: Vec3,
  }).strict(),
  weak_field: z.object({
    local_vertical_unit_vector: Vec3,
    gravity_gradient_s2: z.tuple([Vec3, Vec3, Vec3]),
    branch_tilt_sigma_rad: Nonnegative,
    branch_midpoint_sigma_m: Nonnegative,
    local_masses: z.array(LocalMass),
    differential_v2_integral_sigma_m2_s: Nonnegative,
    sagnac_area_sigma_m2: Nonnegative,
  }).strict(),
  echo_response: z.object({
    static_signed_phase_residual_fraction: Fraction,
    path_swap_signed_phase_residual_fraction: Fraction,
    spectral_bins: z.array(EchoSpectralBin).min(1),
  }).strict(),
  ordinary_phase_covariance: z.object({
    transported_stage4_2m_em_phase_sigma_rad: Nonnegative,
    control_phase_sigma_rad: Nonnegative,
    ordinary_differential_angular_frequency_rad_s: Nonnegative,
    laboratory_clock_skew_sigma_s: Nonnegative,
  }).strict(),
  internal_energy: z.object({
    synthetic_energy_std_J: Nonnegative,
    measured_heat_capacity_ready: z.literal(false),
    measured_internal_spectrum_ready: z.literal(false),
  }).strict(),
  frozen_diosi_comparator: z.object({
    model_id: z.literal("diosi_1989_gaussian_regularized_nondissipative"),
    R0_m: Positive,
    conservative_exponent: Positive,
    gaussian_exponent: Positive,
  }).strict(),
  gates: z.object({
    maximum_total_phase_sigma_rad: Positive,
    maximum_internal_time_dilation_chi: Positive,
    require_minkowski_recovery: z.literal(true),
    require_equal_worldline_recovery: z.literal(true),
    require_coordinate_offset_invariance: z.literal(true),
    require_dp_echo_invariance: z.literal(true),
  }).strict(),
  empirical_authorities: z.object({
    measured_worldlines: z.literal(false),
    measured_gravity_gradient: z.literal(false),
    as_built_local_mass_cad: z.literal(false),
    measured_tilt_spectrum: z.literal(false),
    measured_echo_transfer: z.literal(false),
    measured_clock_control_covariance: z.literal(false),
    measured_internal_energy_variance: z.literal(false),
  }).strict(),
  standing: z.object({
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
    physical_pilot_authorized: z.literal(false),
    confirmatory_campaign_authorized: z.literal(false),
  }).strict(),
}).strict();

export type CasimirDpProperTimeWorldlineClosureStage4_2PConfig = z.infer<
  typeof CasimirDpProperTimeWorldlineClosureStage4_2PConfig
>;
