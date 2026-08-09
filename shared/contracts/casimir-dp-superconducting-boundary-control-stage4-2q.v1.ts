import { z } from "zod";

const Finite = z.number().finite();
const Positive = Finite.positive();
const Nonnegative = Finite.nonnegative();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Complex = z.tuple([Finite, Finite]);

export const CASIMIR_DP_SUPERCONDUCTING_BOUNDARY_CONTROL_STAGE4_2Q_VERSION =
  "casimir_dp_superconducting_boundary_control_stage4_2q/1" as const;

export const CASIMIR_DP_STAGE4_2Q_RUN_ORDER = [
  "verify_immutable_stage4_2p_and_component_evidence",
  "recover_london_and_finite_frequency_impedance_relations",
  "construct_normal_and_superconducting_ordinary_coherence",
  "prove_boundary_ratio_cancels_frozen_standard_diosi",
  "score_temperature_field_and_matched_pair_controls",
  "bound_condensation_energy_mass_equivalent",
  "separate_higgs_anderson_higgs_bec_and_diosi_claims",
  "return_synthetic_control_candidate_or_explicit_no_go",
] as const;

const ImpedancePoint = z.object({
  omega_rad_s: Positive,
  resistance_ohm: Nonnegative,
  reactance_ohm: Nonnegative,
}).strict();

const CoherencePoint = z.object({
  hold_time_s: Positive,
  phase_rad: Finite,
  chi: Nonnegative,
  complex_coherence: Complex,
}).strict();

const ToggleStrategy = z.object({
  strategy_id: z.enum(["temperature_crossing", "magnetic_field_toggle", "matched_static_pair"]),
  description: z.string().min(1),
  covariance_diagonal: z.array(Positive).min(4),
  nuisance_vectors: z.array(z.object({
    nuisance_id: z.string().min(1),
    vector: z.array(Finite).min(4),
  }).strict()).min(1),
  required_measured_authorities: z.array(z.string().min(1)).min(1),
}).strict();

export const CasimirDpSuperconductingBoundaryFixtureStage4_2Q = z.object({
  schema_version: z.literal("casimir_dp_superconducting_boundary_fixture_stage4_2q/1"),
  evidence_class: z.literal("synthetic_superconducting_boundary_response_fixture_only"),
  boundary_specimen: z.object({
    material_id: z.literal("niobium_hypothetical_coating"),
    response_authority: z.literal("synthetic_not_specimen_measured"),
    critical_temperature_K: Positive,
    thermodynamic_critical_field_T: Positive,
    coating_thickness_m: Positive,
    london_penetration_depth_m: Positive,
    carrier_density_m3: Positive,
    carrier_charge_C: Positive,
    carrier_mass_kg: Positive,
    superconducting_gap_J: Positive,
    dc_resistance_superconducting_ohm: z.literal(0),
    normal_impedance: z.array(ImpedancePoint).min(4),
    superconducting_impedance: z.array(ImpedancePoint).min(4),
  }).strict(),
  ordinary_response: z.object({
    response_kernel_authority: z.literal("synthetic_stage4_2n_transport_only"),
    green_transfer: z.object({
      model_id: z.literal("linearized_synthetic_impedance_contrast_to_green_phase_loss"),
      frequency_weights: z.array(Nonnegative).min(4),
      phase_scale_rad: Finite,
      chi_scale: Finite,
    }).strict(),
    normal: z.array(CoherencePoint).min(4),
    superconducting: z.array(CoherencePoint).min(4),
  }).strict(),
  toggle_strategies: z.array(ToggleStrategy).length(3),
  public_component_context: z.object({
    superconducting_drum_replay_status: z.literal("pass"),
    apparatus_matched_transfer_allowed: z.literal(false),
    covariance_transport_allowed: z.literal(false),
  }).strict(),
  empirical_authorities: z.object({
    specimen_complex_impedance_measured: z.literal(false),
    normal_superconducting_casimir_contrast_measured: z.literal(false),
    as_built_green_tensor_measured: z.literal(false),
    transition_temperature_covariance_measured: z.literal(false),
    magnetic_switch_transfer_measured: z.literal(false),
    vortex_state_measured: z.literal(false),
    joint_complex_coherence_cells_measured: z.literal(false),
  }).strict(),
}).strict();

export const CasimirDpSuperconductingBoundaryControlStage4_2QConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_SUPERCONDUCTING_BOUNDARY_CONTROL_STAGE4_2Q_VERSION),
  campaign_id: z.literal("casimir-dp-superconducting-boundary-control-stage4-2q-v1"),
  evidence_class: z.literal("synthetic_superconducting_control_identifiability_only"),
  claim_ceiling: z.literal("ordinary_superconducting_boundary_control_design_only"),
  promotion_allowed: z.literal(false),
  collapse_bridge_edges_allowed: z.literal(false),
  run_order: z.tuple(CASIMIR_DP_STAGE4_2Q_RUN_ORDER.map((entry) => z.literal(entry)) as [
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2Q_RUN_ORDER)[0]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2Q_RUN_ORDER)[1]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2Q_RUN_ORDER)[2]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2Q_RUN_ORDER)[3]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2Q_RUN_ORDER)[4]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2Q_RUN_ORDER)[5]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2Q_RUN_ORDER)[6]>,
    z.ZodLiteral<(typeof CASIMIR_DP_STAGE4_2Q_RUN_ORDER)[7]>,
  ]),
  upstream: z.object({
    stage4_2p_campaign_receipt_path: z.string().min(1),
    stage4_2p_campaign_receipt_sha256: Sha256,
    stage4_2o_verification_receipt_path: z.string().min(1),
    stage4_2o_verification_receipt_sha256: Sha256,
    stage4_2n_verification_receipt_path: z.string().min(1),
    stage4_2n_verification_receipt_sha256: Sha256,
  }).strict(),
  fixture_path: z.string().min(1),
  fixture_sha256: Sha256,
  leading_design: z.object({
    candidate_id: z.literal("stage4_2m_candidate_002"),
    radius_m: Positive,
    mass_kg: Positive,
    branch_separation_m: Positive,
    hold_time_s: Positive,
    gap_m: Positive,
    plate_size_m: Positive,
    temperature_K: Positive,
  }).strict(),
  frozen_diosi: z.object({
    model_id: z.literal("diosi_1989_gaussian_regularized_nondissipative"),
    R0_m: Positive,
    gaussian_exponent_at_hold: Positive,
    boundary_state_dependence: z.literal(false),
    modified_by_campaign: z.literal(false),
  }).strict(),
  constants: z.object({
    mu0_N_A2: Positive,
    hbar_J_s: Positive,
    c_m_s: Positive,
  }).strict(),
  gates: z.object({
    london_relative_tolerance: Positive,
    maximum_signature_cosine: z.number().min(0).max(1),
    maximum_augmented_condition_number: Positive,
    minimum_boundary_contrast_snr: Positive,
    maximum_dp_cancellation_error: Nonnegative,
    maximum_green_transfer_absolute_error: Nonnegative,
    require_nonzero_finite_frequency_impedance: z.literal(true),
  }).strict(),
  sources: z.array(z.object({
    source_id: z.string().min(1),
    citation: z.string().min(1),
    url: z.string().url(),
    supports: z.string().min(1),
    does_not_support: z.string().min(1),
  }).strict()).min(4),
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

export type CasimirDpSuperconductingBoundaryFixtureStage4_2Q = z.infer<
  typeof CasimirDpSuperconductingBoundaryFixtureStage4_2Q
>;
export type CasimirDpSuperconductingBoundaryControlStage4_2QConfig = z.infer<
  typeof CasimirDpSuperconductingBoundaryControlStage4_2QConfig
>;
