import { z } from "zod";

export const CASIMIR_DP_SCHRODINGER_MASS_DENSITY_STAGE4_2J_VERSION =
  "casimir_dp_schrodinger_mass_density_stage4_2j/1" as const;

export const CASIMIR_DP_STAGE4_2J_REPRESENTATION_ORDER = [
  "single_effective_gaussian",
  "homogeneous_sphere_gaussian_convolved",
  "layered_sphere_gaussian_convolved",
  "coarse_grained_constituents_gaussian_convolved",
  "atomistic_constituents_gaussian_convolved",
] as const;

export const CASIMIR_DP_STAGE4_2J_RUN_ORDER = [
  "verify_immutable_stage4_2i_authority_tuples",
  "freeze_schrodinger_environment_dp_hypothesis_lanes",
  "recover_registered_effective_gaussian_dp_point",
  "separate_hamiltonian_phase_from_nonunitary_contraction",
  "compute_homogeneous_sphere_with_identical_gaussian_regularization",
  "evaluate_representation_coverage_and_spread",
  "invert_synthetic_coherence_residual_to_dp_equivalent_energy",
  "compute_hydrogen_and_qed_dimensional_nonbridge",
  "screen_residual_gas_collision_decoherence",
  "screen_state_preparation_scale_transport",
  "preserve_external_bound_mapping_as_unresolved",
  "preserve_boundary_independent_dp_and_zero_transfer_edges",
  "run_adversarial_recovery_and_fail_closed_cases",
  "write_content_addressed_report_trace_and_receipt",
] as const;

const Finite = z.number().finite();
const PositiveFinite = Finite.positive();
const NonnegativeFinite = Finite.nonnegative();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);

const AuthorityTuple = z.object({
  role: z.string().min(1),
  path: z.string().min(1),
  sha256: Sha256,
  required_at_runtime: z.literal(true),
}).strict();

const Representation = z.object({
  representation_id: z.enum(CASIMIR_DP_STAGE4_2J_REPRESENTATION_ORDER),
  readiness: z.enum(["ready", "not_ready"]),
  method: z.enum([
    "registered_analytic_gaussian",
    "radial_fourier_simpson",
    "missing_layer_manifest",
    "missing_provenance_bound_density_map",
    "missing_atomistic_structure_and_covariance",
  ]),
  physical_gaussian_regularization_applied: z.literal(true),
}).strict();

export const CasimirDpSchrodingerMassDensityFixtureStage4_2J = z.object({
  schema_version: z.literal(
    "casimir_dp_schrodinger_mass_density_fixture_stage4_2j/1",
  ),
  campaign_id: z.literal(
    "casimir-dp-schrodinger-mass-density-stage4-2j-v1",
  ),
  fixture_id: z.string().min(1),
  evidence_class: z.literal("synthetic_diagnostic"),
  generated_at: z.string().datetime(),
  apparatus_identity: z.object({
    identity_id: z.literal("silica_high_mass_identifiable_single_object_v1"),
    material: z.literal("silica"),
    mass_kg: z.literal(1.94385e-16),
    sphere_radius_m: z.literal(2.76302362398029e-7),
    branch_separation_m: z.literal(1.6e-7),
    hold_time_s: z.literal(0.25),
    dp_regularization_length_m: z.literal(1e-7),
    cavity_gap_m: z.literal(1.2e-6),
    environment_temperature_K: z.literal(4),
    environment_pressure_Pa: z.literal(2e-11),
  }).strict(),
  constants: z.object({
    G_m3_kg_s2: PositiveFinite,
    hbar_J_s: PositiveFinite,
    h_J_s: PositiveFinite,
    k_B_J_K: PositiveFinite,
    elementary_charge_C: PositiveFinite,
    dalton_kg: PositiveFinite,
  }).strict(),
  schrodinger_baseline: z.object({
    branch_energy_difference_J: Finite,
    initial_coherence: z.object({ re: Finite, im: Finite }).strict(),
    registered_dp_changes_hamiltonian_phase: z.literal(false),
  }).strict(),
  registered_dp_reference: z.object({
    model_id: z.literal("diosi_1989_gaussian_regularized_nondissipative"),
    E_G_J: PositiveFinite,
    Gamma_DP_s: PositiveFinite,
    visibility_ratio: z.number().gt(0).lte(1),
    boundary_variable_in_generator: z.literal(false),
    transfer_kernel_registered: z.literal(false),
  }).strict(),
  mass_representations: z.array(Representation).length(
    CASIMIR_DP_STAGE4_2J_REPRESENTATION_ORDER.length,
  ),
  hydrogen_calibration: z.object({
    rydberg_energy_eV: PositiveFinite,
    leading_hydrogen_1s_2s_frequency_Hz: PositiveFinite,
    role: z.literal("dimensional_and_hamiltonian_calibration_only"),
    collapse_transfer_kernel_registered: z.literal(false),
  }).strict(),
  residual_gases: z.array(z.object({
    species_id: z.enum(["H2", "He4"]),
    molecular_mass_kg: PositiveFinite,
  }).strict()).length(2),
  state_preparation_benchmark: z.object({
    demonstrated_mass_Da: PositiveFinite,
    source_doi: z.literal("10.1038/s41586-025-09917-9"),
    comparison_role: z.literal("cross_platform_scale_benchmark_only"),
  }).strict(),
}).strict().superRefine((fixture, context) => {
  const ids = fixture.mass_representations.map((row) => row.representation_id);
  if (JSON.stringify(ids) !== JSON.stringify(CASIMIR_DP_STAGE4_2J_REPRESENTATION_ORDER)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mass_representations"],
      message: "Mass representations must preserve the preregistered order.",
    });
  }
  const gasIds = fixture.residual_gases.map((row) => row.species_id);
  if (new Set(gasIds).size !== gasIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["residual_gases"],
      message: "Residual-gas species must be unique.",
    });
  }
});

export type CasimirDpSchrodingerMassDensityFixtureStage4_2J = z.infer<
  typeof CasimirDpSchrodingerMassDensityFixtureStage4_2J
>;

export const CasimirDpSchrodingerMassDensityStage4_2JConfig = z.object({
  schema_version: z.literal(
    CASIMIR_DP_SCHRODINGER_MASS_DENSITY_STAGE4_2J_VERSION,
  ),
  study_id: z.literal("casimir-dp-quantum-foam-study-v1"),
  campaign_id: z.literal(
    "casimir-dp-schrodinger-mass-density-stage4-2j-v1",
  ),
  implementation_version: z.literal("stage4.2j-v1"),
  evidence_cutoff: z.string().datetime(),
  evidence_class: z.literal(
    "synthetic_schrodinger_mass_density_and_environmental_screen_only",
  ),
  claim_ceiling: z.literal(
    "schrodinger_open_system_mass_density_and_environmental_diagnostic_only",
  ),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  authority_manifest: z.object({
    path: z.literal("configs/research/casimir-dp-stage4-2j-authorities.v1.json"),
    sha256: Sha256,
  }).strict(),
  upstream_authorities: z.array(AuthorityTuple).min(4),
  method_authorities: z.array(AuthorityTuple).min(2),
  immutable_stage4_2i: z.object({
    campaign_run_id: z.literal(
      "casimir-dp-boundary-branch-interaction-stage4-2i-v1-20260805T160000000Z",
    ),
    report_sha256: Sha256,
    campaign_receipt_sha256: Sha256,
    verification_receipt_sha256: Sha256,
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
  fixture: z.object({
    path: z.literal(
      "configs/research/fixtures/casimir-dp-stage4-2j.synthetic.v1.json",
    ),
    sha256: Sha256,
  }).strict(),
  numerical: z.object({
    integration_upper_u: z.number().gte(6).lte(16),
    convergence_intervals: z.array(
      z.number().int().min(256).max(65_536).refine((n) => n % 2 === 0),
    ).length(3),
    maximum_relative_convergence_error: PositiveFinite,
    registered_point_relative_tolerance: PositiveFinite,
    inverse_energy_relative_tolerance: PositiveFinite,
    phase_absolute_tolerance_rad: NonnegativeFinite,
  }).strict(),
  environmental_screen: z.object({
    maximum_gas_to_dp_rate_ratio_for_candidate: PositiveFinite,
    target_gas_fraction_of_dp: z.number().gt(0).lt(1),
    minimum_separation_to_thermal_wavelength_for_full_localization: PositiveFinite,
  }).strict(),
  required_complete_representations: z.array(
    z.enum(CASIMIR_DP_STAGE4_2J_REPRESENTATION_ORDER),
  ).length(CASIMIR_DP_STAGE4_2J_REPRESENTATION_ORDER.length),
  run_order: z.array(z.enum(CASIMIR_DP_STAGE4_2J_RUN_ORDER)).length(
    CASIMIR_DP_STAGE4_2J_RUN_ORDER.length,
  ),
  final_status_policy: z.object({
    software_contract: z.literal("pass"),
    schrodinger_dp_separation: z.literal("pass"),
    registered_gaussian_recovery: z.literal("pass"),
    homogeneous_convolved_representation: z.literal("diagnostic_ready"),
    complete_representation_robustness: z.literal("blocked"),
    declared_equilibrium_gas_screen: z.literal("no_go"),
    measured_environment_model: z.literal("not_ready"),
    state_preparation: z.literal("not_ready"),
    external_bound_mapping: z.literal("not_ready"),
    transfer_kernel: z.literal("not_registered"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
}).strict().superRefine((config, context) => {
  if (JSON.stringify(config.run_order) !== JSON.stringify(CASIMIR_DP_STAGE4_2J_RUN_ORDER)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["run_order"],
      message: "Stage-4.2J run order must preserve the preregistered dependency order.",
    });
  }
  if (
    JSON.stringify(config.required_complete_representations) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2J_REPRESENTATION_ORDER)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["required_complete_representations"],
      message: "The complete robustness gate must require every preregistered representation.",
    });
  }
});

export type CasimirDpSchrodingerMassDensityStage4_2JConfig = z.infer<
  typeof CasimirDpSchrodingerMassDensityStage4_2JConfig
>;
