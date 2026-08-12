import { z } from "zod";

const Finite = z.number().finite();
const Positive = Finite.positive();
const Nonnegative = Finite.nonnegative();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export const CASIMIR_DP_RETARDED_SOURCE_PROPAGATION_STAGE4_2S_VERSION =
  "casimir_dp_retarded_source_propagation_stage4_2s/1" as const;

export const CASIMIR_DP_STAGE4_2S_RUN_ORDER = [
  "verify_immutable_stage4_2r_evidence",
  "freeze_source_spectrum_and_geometry_contract",
  "recover_retarded_point_charge_radiation",
  "recover_current_conservation_transversality_and_polarization",
  "classify_quasistatic_transition_and_retarded_source_scales",
  "propagate_synthetic_source_through_branch_green_response",
  "map_ordinary_response_to_phase_loss_recoil_heating_and_complex_coherence",
  "audit_same_apparatus_empirical_authorities",
  "return_ordinary_null_input_or_explicit_no_go",
] as const;

export const CASIMIR_DP_STAGE4_2S_SOURCE_IDS = [
  "boundary_modulation_fundamental",
  "boundary_switching_edge_benchmark",
  "rf_control_benchmark",
  "optical_readout_benchmark_1550nm",
] as const;

export const CASIMIR_DP_STAGE4_2S_AUTHORITY_IDS = [
  "measured_source_current_maps_and_waveforms",
  "as_built_retarded_green_tensor",
  "measured_complex_material_response",
  "branch_geometry_and_polarization_transfer",
  "switching_edge_spectral_coverage",
  "phase_loss_recoil_heating_covariance",
  "independent_solver_and_energy_balance",
] as const;

const Complex = z.object({ re: Finite, im: Finite }).strict();
const ComplexMatrix3 = z.array(z.array(Complex).length(3)).length(3);
const ComplexVector3 = z.array(Complex).length(3);

const Authority = z.object({
  authority_id: z.enum(CASIMIR_DP_STAGE4_2S_AUTHORITY_IDS),
  status: z.enum(["absent", "measured", "computed_from_measured"]),
  receipt_path: z.string().min(1).nullable(),
  receipt_sha256: Sha256.nullable(),
  independent_custodian: z.string().min(1).nullable(),
  measured_on_leading_apparatus: z.boolean(),
  covariance_ancestry_frozen: z.boolean(),
  notes: z.string().min(1),
}).strict();

export const CasimirDpRetardedSourcePropagationStage4_2SConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_RETARDED_SOURCE_PROPAGATION_STAGE4_2S_VERSION),
  campaign_id: z.literal("casimir-dp-retarded-source-propagation-stage4-2s-v1"),
  evidence_class: z.literal("analytic_and_synthetic_ordinary_em_recovery_only"),
  claim_ceiling: z.literal("retarded_source_ordinary_null_contract_and_software_recovery_only"),
  promotion_allowed: z.literal(false),
  collapse_bridge_edges_allowed: z.literal(false),
  run_order: z.array(z.enum(CASIMIR_DP_STAGE4_2S_RUN_ORDER)).length(CASIMIR_DP_STAGE4_2S_RUN_ORDER.length),
  upstream: z.object({
    stage4_2r_campaign_receipt_path: z.string().min(1),
    stage4_2r_campaign_receipt_sha256: Sha256,
    stage4_2r_verification_receipt_path: z.string().min(1),
    stage4_2r_verification_receipt_sha256: Sha256,
  }).strict(),
  constants: z.object({
    c_m_s: Positive,
    epsilon0_F_m: Positive,
    hbar_J_s: Positive,
  }).strict(),
  apparatus: z.object({
    characteristic_length_m: Positive,
    branch_separation_m: Positive,
    hold_time_s: Positive,
    boundary_modulation_Hz: Positive,
    frozen_diosi_model_id: z.literal("diosi_1989_gaussian_regularized_nondissipative"),
    frozen_diosi_modified: z.literal(false),
  }).strict(),
  analytic_benchmark: z.object({
    point_charge_C: Positive,
    acceleration_m_s2: Positive,
    observation_distance_m: Positive,
    observation_angle_rad: Positive,
    angular_quadrature_points: z.number().int().min(100),
    maximum_relative_error: Positive,
    maximum_absolute_transversality_error: Nonnegative,
    maximum_current_conservation_residual: Nonnegative,
    maximum_polarization_projector_error: Nonnegative,
  }).strict(),
  source_spectrum: z.array(z.object({
    source_id: z.enum(CASIMIR_DP_STAGE4_2S_SOURCE_IDS),
    evidence_class: z.enum(["frozen_design_frequency_only", "synthetic_recovery_benchmark"]),
    frequency_Hz: Positive,
    wavelength_m: Positive.nullable(),
    current_map_receipt_available: z.literal(false),
    measured_waveform_receipt_available: z.literal(false),
    notes: z.string().min(1),
  }).strict()).length(CASIMIR_DP_STAGE4_2S_SOURCE_IDS.length),
  synthetic_green_fixture: z.object({
    source_id: z.literal("optical_readout_benchmark_1550nm"),
    field_scale_V_m: Positive,
    source_jones: ComplexVector3,
    branch_a_green: ComplexMatrix3,
    branch_b_green: ComplexMatrix3,
    polarizability_re_SI: Positive,
    polarizability_im_SI: Nonnegative,
  }).strict(),
  authority_packets: z.array(Authority).length(CASIMIR_DP_STAGE4_2S_AUTHORITY_IDS.length),
  standing: z.object({
    measured_evidence: z.literal("not_ready"),
    ordinary_null_authority: z.literal("not_ready"),
    retarded_source_covariance: z.literal("not_ready"),
    residual_attribution: z.literal("blocked"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
}).strict();

export type CasimirDpRetardedSourcePropagationStage4_2SConfig = z.infer<
  typeof CasimirDpRetardedSourcePropagationStage4_2SConfig
>;
