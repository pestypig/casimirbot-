import { z } from "zod";

export const CASIMIR_DP_MICROSCOPIC_EM_CLOSURE_STAGE4_2K_VERSION =
  "casimir_dp_microscopic_em_closure_stage4_2k/1" as const;

export const CASIMIR_DP_STAGE4_2K_RUN_ORDER = [
  "verify_immutable_stage4_2j_authority_tuples",
  "freeze_em_dp_and_bridge_hypothesis_lanes",
  "recover_ground_state_polarizability_sum",
  "recover_causal_permittivity_on_imaginary_axis",
  "compute_silica_sphere_polarizability",
  "evaluate_planar_retarded_branch_phase_orientation_screen",
  "audit_finite_geometry_green_scattering_readiness",
  "propagate_ordinary_phase_jitter_to_coherence_loss_budget",
  "evaluate_four_cell_ordinary_subtraction",
  "audit_quantum_linear_boltzmann_input_readiness",
  "preserve_boundary_independent_dp_and_zero_transfer_edges",
  "write_content_addressed_report_trace_and_receipt",
] as const;

const Positive = z.number().finite().positive();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Authority = z.object({
  role: z.string().min(1), path: z.string().min(1), sha256: Sha256,
  required_at_runtime: z.literal(true),
}).strict();

export const CasimirDpMicroscopicEmClosureFixtureStage4_2K = z.object({
  schema_version: z.literal("casimir_dp_microscopic_em_closure_fixture_stage4_2k/1"),
  campaign_id: z.literal("casimir-dp-microscopic-em-closure-stage4-2k-v1"),
  fixture_id: z.string().min(1), evidence_class: z.literal("synthetic_diagnostic"),
  generated_at: z.string().datetime(),
  apparatus: z.object({
    identity_id: z.literal("silica_high_mass_identifiable_single_object_v1"),
    sphere_radius_m: Positive, branch_separation_m: Positive,
    hold_time_s: Positive, surface_gap_m: Positive,
    dp_energy_J: Positive, dp_rate_s: Positive,
  }).strict(),
  constants: z.object({ hbar_J_s: Positive, c_m_s: Positive, epsilon0_F_m: Positive }).strict(),
  silica_response: z.object({
    model: z.literal("synthetic_two_oscillator_lorentz"),
    oscillators: z.array(z.object({ strength: Positive, omega0_rad_s: Positive }).strict()).min(1),
    expected_static_relative_permittivity: Positive,
    measured_spectrum_receipt_available: z.boolean(),
    temperature_matched_receipt_available: z.boolean(),
  }).strict(),
  ground_state_benchmark: z.object({
    transition_frequency_Hz: Positive, dipole_matrix_element_C_m: Positive,
    role: z.literal("atomic_polarizability_to_green_tensor_recovery_only"),
  }).strict(),
  geometry: z.object({
    screen_model: z.literal("ideal_conductor_planar_retarded_dipole"),
    registered_branch_orientation: z.enum(["unregistered", "normal", "tangential"]),
    evaluate_orientations: z.tuple([z.literal("normal"), z.literal("tangential")]),
    finite_cad_mesh_receipt_available: z.boolean(),
    finite_geometry_green_receipt_available: z.boolean(),
    independent_solver_receipt_available: z.boolean(),
  }).strict(),
  ordinary_loss: z.object({
    synthetic_active_separated_log_loss: z.number().finite().nonnegative(),
    empirical_response_receipt_available: z.boolean(),
    empirical_covariance_receipt_available: z.boolean(),
    maximum_allowed_model_fractional_uncertainty: z.number().gt(0).lt(1),
  }).strict(),
  qlbe_readiness: z.record(z.boolean()),
  interaction_fixture: z.object({
    injected_bridge_log_amplitude: z.number().finite(),
    injected_bridge_phase_rad: z.number().finite(),
    phase_unwrap_custody: z.literal("synthetic_only"),
  }).strict(),
}).strict();

export type CasimirDpMicroscopicEmClosureFixtureStage4_2K = z.infer<typeof CasimirDpMicroscopicEmClosureFixtureStage4_2K>;

export const CasimirDpMicroscopicEmClosureStage4_2KConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_MICROSCOPIC_EM_CLOSURE_STAGE4_2K_VERSION),
  study_id: z.literal("casimir-dp-quantum-foam-study-v1"),
  campaign_id: z.literal("casimir-dp-microscopic-em-closure-stage4-2k-v1"),
  implementation_version: z.literal("stage4.2k-v1"),
  evidence_cutoff: z.string().datetime(),
  evidence_class: z.literal("synthetic_microscopic_em_closure_and_residual_attribution_only"),
  claim_ceiling: z.literal("ordinary_em_phase_loss_and_readiness_diagnostic_only"),
  promotion_allowed: z.literal(false), observable_bridge_edges_allowed: z.literal(false),
  authority_manifest: z.object({ path: z.string(), sha256: Sha256 }).strict(),
  upstream_authorities: z.array(Authority).min(4), method_authorities: z.array(Authority).min(2),
  fixture: z.object({ path: z.string(), sha256: Sha256 }).strict(),
  numerical: z.object({
    static_permittivity_relative_tolerance: Positive,
    dp_rate_recovery_relative_tolerance: Positive,
    maximum_phase_jitter_fraction_of_dp_exponent: z.number().gt(0).lt(1),
    phase_unwrap_target_rad: Positive,
  }).strict(),
  run_order: z.array(z.enum(CASIMIR_DP_STAGE4_2K_RUN_ORDER)).length(CASIMIR_DP_STAGE4_2K_RUN_ORDER.length),
  final_status_policy: z.object({
    software_contract: z.literal("pass"), analytic_material_recovery: z.literal("pass"),
    ideal_planar_orientation_screen: z.literal("diagnostic_ready"),
    measured_material_spectrum: z.literal("not_ready"),
    finite_geometry_green_authority: z.literal("not_ready"),
    branch_orientation_authority: z.literal("not_ready"),
    ordinary_phase_covariance: z.literal("not_ready"),
    qlbe_environment_model: z.literal("not_ready"),
    residual_attribution: z.literal("blocked"), transfer_kernel: z.literal("not_registered"),
    measured_evidence: z.literal("not_ready"), collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"), physical_viability: z.literal("not_evaluated"),
  }).strict(),
}).strict().superRefine((config, context) => {
  if (JSON.stringify(config.run_order) !== JSON.stringify(CASIMIR_DP_STAGE4_2K_RUN_ORDER)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["run_order"], message: "Stage-4.2K order is frozen." });
  }
});

export type CasimirDpMicroscopicEmClosureStage4_2KConfig = z.infer<typeof CasimirDpMicroscopicEmClosureStage4_2KConfig>;
