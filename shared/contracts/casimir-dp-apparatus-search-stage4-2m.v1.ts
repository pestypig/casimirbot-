import { z } from "zod";

const Finite = z.number().finite();
const Positive = Finite.positive();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export const CasimirDpApparatusSearchStage4_2MConfig = z.object({
  schema_version: z.literal("casimir_dp_apparatus_search_stage4_2m/1"),
  campaign_id: z.literal("casimir-dp-apparatus-search-stage4-2m-v1"),
  evidence_class: z.literal("synthetic_bounded_apparatus_search_only"),
  claim_ceiling: z.literal("bounded_configuration_for_measured_commissioning_or_explicit_no_go_only"),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  max_candidates: z.number().int().min(1).max(200),
  upstream_stage4_2l: z.object({
    verification_receipt_path: z.string().min(1),
    verification_receipt_sha256: Sha256,
    run_id: z.string().min(1),
  }).strict(),
  frozen_dp: z.object({
    model_id: z.literal("diosi_1989_gaussian_regularized_nondissipative"),
    R0_m: Positive,
    numerical_softening_m: Positive,
    integration_upper_u: Positive,
    even_intervals: z.number().int().positive().refine((value) => value % 2 === 0),
    crosscheck_relative_tolerance: Positive,
  }).strict(),
  materials: z.array(z.object({
    id: z.enum(["silica", "silicon", "diamond"]),
    density_kg_m3: Positive,
  }).strict()).min(1),
  axes: z.object({
    radius_m: z.array(Positive).min(2),
    separation_m: z.array(Positive).min(2),
    hold_time_s: z.array(Positive).min(2),
    gap_m: z.array(Positive).min(2),
    plate_size_m: z.array(Positive).min(2),
    branch_orientation_tilt_rad: z.array(Finite).min(2),
    temperature_K: z.array(Positive).min(1),
    pressure_Pa: z.array(Positive).min(2),
    lateral_sigma_m: z.array(Positive).min(2),
    angular_sigma_rad: z.array(Positive).min(2),
    echo_residual_fraction: z.array(Positive.max(1)).min(2),
    modulation_frequency_Hz: z.array(Positive).min(1),
    readout_efficiency: z.array(Positive.max(1)).min(1),
  }).strict(),
  reference: z.object({
    radius_m: Positive,
    mass_kg: Positive,
    separation_m: Positive,
    hold_time_s: Positive,
    gap_m: Positive,
    pressure_Pa: Positive,
    temperature_K: Positive,
    dp_exponent: Positive,
    dp_rate_s: Positive,
    phase_lateral_jacobian_rad_per_m: Finite,
    phase_angular_jacobian_rad_per_rad: Finite,
    gas_rate_s: Positive,
    density_envelope_factor: Positive,
    stage4_2c_required_windows: z.number().int().positive(),
    stage4_2c_maximum_cosine: Positive,
    stage4_2c_condition_number: Positive,
    companion_snr: Positive,
    demonstrated_mass_Da: Positive,
    dalton_kg: Positive,
  }).strict(),
  gates: z.object({
    maximum_phase_sigma_rad: Positive,
    maximum_echoed_nominal_phase_rad: Positive,
    maximum_gas_to_dp_ratio: Positive,
    minimum_worst_density_dp_exponent: Positive,
    maximum_gaussian_dp_exponent: Positive,
    maximum_required_windows: z.number().int().positive(),
    minimum_power: Positive.max(1),
    maximum_signature_cosine: Positive.max(1),
    maximum_condition_number: Positive,
    minimum_companion_snr: Positive,
    maximum_state_preparation_mass_ratio: Positive,
    maximum_separation_to_diameter: Positive,
  }).strict(),
  empirical_authorities: z.object({
    measured_material_spectrum: z.literal(false),
    as_built_geometry: z.literal(false),
    full_maxwell_green: z.literal(false),
    measured_phase_covariance: z.literal(false),
    measured_qlbe_environment: z.literal(false),
    integrated_state_preparation: z.literal(false),
    measured_companion_detector: z.literal(false),
    independent_replication: z.literal(false),
  }).strict(),
}).strict();

export type CasimirDpApparatusSearchStage4_2MConfig = z.infer<
  typeof CasimirDpApparatusSearchStage4_2MConfig
>;
