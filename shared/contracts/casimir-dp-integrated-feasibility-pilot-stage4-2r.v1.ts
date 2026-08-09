import { z } from "zod";

const Finite = z.number().finite();
const Positive = Finite.positive();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export const CASIMIR_DP_INTEGRATED_FEASIBILITY_PILOT_STAGE4_2R_VERSION =
  "casimir_dp_integrated_feasibility_pilot_stage4_2r/1" as const;

export const CASIMIR_DP_STAGE4_2R_RUN_ORDER = [
  "verify_immutable_stage4_2o_2p_2q_evidence",
  "freeze_leading_apparatus_and_diosi_comparator",
  "validate_state_preparation_and_recombination_packet",
  "validate_as_built_geometry_material_and_green_packet",
  "validate_worldline_phase_gas_and_covariance_packets",
  "validate_four_cell_complex_coherence_and_companion_packets",
  "validate_exact_external_bound_recast",
  "evaluate_primary_diosi_and_boundary_interaction_estimands_separately",
  "return_authorized_pilot_or_explicit_empirical_no_go",
] as const;

export const CASIMIR_DP_STAGE4_2R_AUTHORITY_IDS = [
  "state_preparation_recombination",
  "as_built_geometry_and_green_response",
  "measured_material_spectral_response",
  "worldline_and_phase_covariance",
  "quantum_gas_collision_kernel",
  "four_cell_complex_coherence",
  "independent_companion_channel",
  "exact_registered_model_external_bound_recast",
] as const;

const AuthorityId = z.enum(CASIMIR_DP_STAGE4_2R_AUTHORITY_IDS);

const EvidencePacket = z.object({
  authority_id: AuthorityId,
  status: z.enum(["absent", "measured", "computed_from_measured", "published_external_recast"]),
  receipt_path: z.string().min(1).nullable(),
  receipt_sha256: Sha256.nullable(),
  independent_custodian: z.string().min(1).nullable(),
  blinded: z.boolean(),
  measured_on_leading_apparatus: z.boolean(),
  covariance_ancestry_frozen: z.boolean(),
  notes: z.string().min(1),
}).strict();

export const CasimirDpIntegratedFeasibilityPilotStage4_2RConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_INTEGRATED_FEASIBILITY_PILOT_STAGE4_2R_VERSION),
  campaign_id: z.literal("casimir-dp-integrated-feasibility-pilot-stage4-2r-v1"),
  evidence_class: z.literal("empirical_input_readiness_contract_only"),
  claim_ceiling: z.literal("integrated_feasibility_pilot_packet_and_acceptance_contract_only"),
  promotion_allowed: z.literal(false),
  collapse_bridge_edges_allowed: z.literal(false),
  run_order: z.array(z.enum(CASIMIR_DP_STAGE4_2R_RUN_ORDER)).length(CASIMIR_DP_STAGE4_2R_RUN_ORDER.length),
  upstream: z.object({
    stage4_2o_campaign_receipt_path: z.string().min(1),
    stage4_2o_campaign_receipt_sha256: Sha256,
    stage4_2p_campaign_receipt_path: z.string().min(1),
    stage4_2p_campaign_receipt_sha256: Sha256,
    stage4_2q_campaign_receipt_path: z.string().min(1),
    stage4_2q_campaign_receipt_sha256: Sha256,
    stage4_2q_verification_receipt_path: z.string().min(1),
    stage4_2q_verification_receipt_sha256: Sha256,
  }).strict(),
  leading_design: z.object({
    candidate_id: z.literal("stage4_2m_candidate_002"),
    material: z.literal("diamond"),
    radius_m: Positive,
    mass_kg: Positive,
    branch_separation_m: Positive,
    hold_time_s: Positive,
    gap_m: Positive,
    plate_size_m: Positive,
    temperature_K: Positive,
    pressure_Pa: Positive,
  }).strict(),
  frozen_diosi: z.object({
    model_id: z.literal("diosi_1989_gaussian_regularized_nondissipative"),
    R0_m: Positive,
    gaussian_exponent_at_hold: Positive,
    boundary_state_dependence: z.literal(false),
    modified_by_campaign: z.literal(false),
  }).strict(),
  pilot_design: z.object({
    four_cells: z.tuple([
      z.literal("active_separated"),
      z.literal("active_compact_sham"),
      z.literal("reference_separated"),
      z.literal("reference_compact_sham"),
    ]),
    primary_estimand: z.literal("heldout_complex_coherence_contraction_following_frozen_mass_separation_time_law"),
    boundary_estimand: z.literal("four_cell_complex_cross_ratio_nonfactorization"),
    minimum_primary_signal_snr: Positive,
    maximum_phase_sigma_rad: Positive,
    maximum_covariance_relative_drift: Positive,
    require_train_holdout_split: z.literal(true),
    require_blinding_before_confirmatory_analysis: z.literal(true),
    require_zero_cross_apparatus_covariance_fusion: z.literal(true),
  }).strict(),
  authority_packets: z.array(EvidencePacket).length(CASIMIR_DP_STAGE4_2R_AUTHORITY_IDS.length),
  standing: z.object({
    measured_evidence: z.literal("not_ready"),
    joint_protocol_validation: z.literal("not_ready"),
    ordinary_null_authority: z.literal("not_ready"),
    residual_attribution: z.literal("blocked"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
    physical_pilot_authorized: z.literal(false),
    confirmatory_campaign_authorized: z.literal(false),
  }).strict(),
}).strict();

export type CasimirDpIntegratedFeasibilityPilotStage4_2RConfig = z.infer<
  typeof CasimirDpIntegratedFeasibilityPilotStage4_2RConfig
>;

