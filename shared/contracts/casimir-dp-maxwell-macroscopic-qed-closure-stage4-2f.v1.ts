import { z } from "zod";

export const CASIMIR_DP_MAXWELL_QED_CLOSURE_STAGE4_2F_VERSION =
  "casimir_dp_maxwell_macroscopic_qed_closure_stage4_2f/1" as const;

export const CASIMIR_DP_STAGE4_2F_SOURCE_IDS = [
  "rahi_scattering_2009",
  "rodriguez_imaginary_frequency_2007",
  "buhmann_scheel_macroscopic_qed_2008",
  "hwang_noh_curved_maxwell_2023",
  "diosi_master_equation_1989",
  "bahrami_dp_heating_2014",
  "donadi_dp_radiation_bound_2021",
] as const;

export const CASIMIR_DP_STAGE4_2F_FIXTURE_CASE_IDS = [
  "baseline_maxwell_qed_dp_separation",
  "longitudinal_plane_wave_rejected",
  "nonpassive_green_response_rejected",
  "polarization_basis_changes_energy_rejected",
  "nhm2_method_promoted_as_casimir_dp_evidence_rejected",
  "ideal_scalar_promoted_as_finite_geometry_authority_rejected",
  "maxwell_frequency_connected_to_dp_rate_rejected",
  "synthetic_companion_snr_promoted_rejected",
  "r0_sensitivity_promoted_as_allowed_region_rejected",
  "unprepared_superposition_promoted_rejected",
  "active_boundary_without_transfer_audit_rejected",
  "partial_field_stress_promoted_as_gr_source_rejected",
] as const;

export const CASIMIR_DP_STAGE4_2F_RUN_ORDER = [
  "verify_immutable_stage4_2e_authority_tuples",
  "bind_nhm2_maxwell_contract_as_method_only",
  "freeze_maxwell_macroscopic_qed_source_boundaries",
  "recover_covariant_maxwell_charge_conservation",
  "recover_transverse_plane_wave_and_polarization_basis_invariance",
  "recover_green_tensor_fdt_passivity_and_zero_temperature_limit",
  "recover_ideal_casimir_stress_limit",
  "instantiate_empty_finite_geometry_contract_fail_closed",
  "freeze_exact_regularized_dp_generator_and_model_domain",
  "compute_r0_sensitivity_without_declaring_allowed_region",
  "audit_stage4_2b_companion_observable_and_synthetic_uncertainty",
  "audit_state_preparation_and_active_boundary_timescale_gates",
  "separate_maxwell_stress_from_complete_renormalized_apparatus_tensor",
  "enforce_zero_maxwell_qed_gr_to_dp_observable_bridges",
  "execute_fail_closed_fixture_matrix",
  "write_content_addressed_report_trace_and_receipt",
] as const;

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const PositiveFinite = z.number().finite().positive();

const AuthorityTuple = z.object({
  role: z.string().min(1),
  path: z.string().min(1),
  sha256: Sha256,
  required_at_runtime: z.literal(true),
}).strict();

const MethodAuthority = z.object({
  role: z.string().min(1),
  path: z.string().min(1),
  sha256: Sha256,
  evidence_reuse_allowed: z.literal(false),
}).strict();

const Source = z.object({
  source_id: z.enum(CASIMIR_DP_STAGE4_2F_SOURCE_IDS),
  title: z.string().min(1),
  url: z.string().url(),
  source_class: z.literal("primary_research"),
  supports: z.string().min(1),
  does_not_support: z.string().min(1),
}).strict();

export const CasimirDpStage4_2FFixture = z.object({
  schema_version: z.literal("casimir_dp_stage4_2f_fixture/1"),
  campaign_id: z.literal(
    "casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f-v1",
  ),
  evidence_class: z.literal("synthetic_fixture"),
  generated_at: z.string().datetime(),
  cases: z.array(z.object({
    case_id: z.enum(CASIMIR_DP_STAGE4_2F_FIXTURE_CASE_IDS),
    expected_gate: z.enum(["pass", "blocked"]),
    expected_status: z.string().min(1),
  }).strict()).length(CASIMIR_DP_STAGE4_2F_FIXTURE_CASE_IDS.length),
}).strict().superRefine((fixture, context) => {
  if (
    JSON.stringify(fixture.cases.map((row) => row.case_id)) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2F_FIXTURE_CASE_IDS)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cases"],
      message: "Stage-4.2F fixture cases must preserve frozen order.",
    });
  }
});

export const CasimirDpMaxwellMacroscopicQedClosureStage4_2FConfig = z.object({
  schema_version: z.literal(
    CASIMIR_DP_MAXWELL_QED_CLOSURE_STAGE4_2F_VERSION,
  ),
  study_id: z.literal("casimir-dp-quantum-foam-study-v1"),
  campaign_id: z.literal(
    "casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f-v1",
  ),
  implementation_version: z.literal("stage4.2f-v1"),
  evidence_cutoff: z.string().datetime(),
  evidence_class: z.literal(
    "synthetic_maxwell_macroscopic_qed_closure_and_readiness_audit",
  ),
  claim_ceiling: z.literal(
    "maxwell_macroscopic_qed_and_named_dp_model_definition_only",
  ),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  authority_manifest: z.object({
    path: z.literal(
      "configs/research/casimir-dp-stage4-2f-authorities.v1.json",
    ),
    sha256: Sha256,
  }).strict(),
  upstream_authorities: z.array(AuthorityTuple).length(6),
  method_authorities: z.array(MethodAuthority).length(2),
  immutable_stage4_2e: z.object({
    campaign_run_id: z.literal(
      "casimir-dp-causal-cone-clock-stage4-2e-v1-20260729T193000000Z",
    ),
    software_and_causal_recovery_diagnostics: z.literal("pass"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
  sources: z.array(Source).length(CASIMIR_DP_STAGE4_2F_SOURCE_IDS.length),
  constants: z.object({
    epsilon0_F_m: PositiveFinite,
    mu0_N_A2: PositiveFinite,
    c_m_s: PositiveFinite,
    hbar_J_s: PositiveFinite,
    k_B_J_K: PositiveFinite,
    G_m3_kg_s2: PositiveFinite,
  }).strict(),
  maxwell_recovery: z.object({
    observer_frame: z.literal("eulerian_laboratory_frame"),
    constitutive_domain: z.literal(
      "local_linear_isotropic_vacuum_recovery_only",
    ),
    frequency_Hz: PositiveFinite,
    electric_field_peak_V_m: PositiveFinite,
    propagation_axis: z.literal("z"),
    linear_polarization_axis: z.literal("x"),
    relative_permittivity: z.literal(1),
    relative_permeability: z.literal(1),
    maximum_normalized_residual: PositiveFinite,
    maximum_basis_invariance_error: PositiveFinite,
  }).strict(),
  green_fdt_recovery: z.object({
    angular_frequency_rad_s: PositiveFinite,
    temperature_K: PositiveFinite,
    imaginary_green_trace_m_inv: PositiveFinite,
    passive_response_required: z.literal(true),
    maximum_zero_temperature_relative_error: PositiveFinite,
  }).strict(),
  ideal_casimir_recovery: z.object({
    gap_m: PositiveFinite,
    ideal_parallel_conductors: z.literal(true),
    analytic_limit_only: z.literal(true),
    pressure_to_energy_density_ratio: z.literal(3),
    maximum_identity_relative_error: PositiveFinite,
  }).strict(),
  finite_geometry_readiness: z.object({
    method_contract_path: z.literal(
      "shared/contracts/casimir-finite-temperature-finite-geometry-maxwell-stress.v1.ts",
    ),
    import_nhm2_evidence: z.literal(false),
    measured_dielectric_response_available: z.literal(false),
    finite_cad_green_tensor_available: z.literal(false),
    maxwell_stress_receipt_available: z.literal(false),
    independent_solver_receipt_available: z.literal(false),
  }).strict(),
  dp_model_audit: z.object({
    registered_model_id: z.literal(
      "diosi_1989_gaussian_regularized_nondissipative",
    ),
    mass_kg: PositiveFinite,
    branch_separation_m: PositiveFinite,
    hold_time_s: PositiveFinite,
    selected_R0_m: PositiveFinite,
    sensitivity_R0_m: z.array(PositiveFinite).length(3),
    sensitivity_is_allowed_parameter_region: z.literal(false),
    boundary_variable_in_generator: z.literal(false),
    transfer_kernel_registered: z.literal(false),
  }).strict(),
  stage4_2c_transport_audit: z.object({
    source_report_path: z.literal(
      "artifacts/research/casimir-dp-identifiability-redesign-stage4-2c/casimir-dp-identifiability-redesign-stage4-2c-v1-20260728T042510781Z/identifiability-redesign-stage4-2c-report.json",
    ),
    source_report_sha256: Sha256,
    selected_candidate_id: z.literal("silica_high_mass_identifiable"),
    declared_candidate_mass_kg: PositiveFinite,
    strongest_baseline_cell_mass_kg: PositiveFinite,
    mass_scale: PositiveFinite,
    strongest_baseline_separation_m: PositiveFinite,
    branch_separation_scale: PositiveFinite,
    reported_strongest_Gamma_DP_s: PositiveFinite,
    single_mass_apparatus_identity_demonstrated: z.literal(false),
  }).strict(),
  companion_forecast_audit: z.object({
    source_report_path: z.literal(
      "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-report.json",
    ),
    source_report_sha256: Sha256,
    observable: z.literal("heating_W"),
    one_shot_standard_uncertainty_W: PositiveFinite,
    planned_independent_samples: z.number().int().positive(),
    expected_forecast_snr: PositiveFinite,
    independence_receipt_class: z.literal("synthetic"),
    detector_noise_receipt_available: z.literal(false),
    measured_companion_authority: z.literal("not_ready"),
  }).strict(),
  apparatus_gates: z.object({
    selected_superposition_prepared: z.literal(false),
    branch_separation_metrology_measured: z.literal(false),
    hold_time_coherence_demonstrated: z.literal(false),
    boundary_modulation_Hz: PositiveFinite,
    cavity_relaxation_measured: z.literal(false),
    material_relaxation_measured: z.literal(false),
    mechanical_sideband_transfer_measured: z.literal(false),
    dynamical_casimir_background_bounded: z.literal(false),
    complete_apparatus_renormalized_stress_energy_available:
      z.literal(false),
    conserved_total_stress_verified: z.literal(false),
  }).strict(),
  fixture: z.object({
    path: z.literal(
      "configs/research/fixtures/casimir-dp-stage4-2f-maxwell-closure.synthetic.v1.json",
    ),
    sha256: Sha256,
  }).strict(),
  run_order: z.array(z.enum(CASIMIR_DP_STAGE4_2F_RUN_ORDER)).length(
    CASIMIR_DP_STAGE4_2F_RUN_ORDER.length,
  ),
  final_status_policy: z.object({
    software_and_equation_recovery: z.literal("pass"),
    finite_geometry_maxwell_authority: z.literal("not_ready"),
    measured_material_green_authority: z.literal("not_ready"),
    named_dp_model_definition: z.literal("pass"),
    candidate_transport_identity_authority: z.literal("not_ready"),
    dp_parameter_region_authority: z.literal("not_ready"),
    companion_detector_authority: z.literal("not_ready"),
    companion_model_identity_authority: z.literal("not_ready"),
    state_preparation_authority: z.literal("not_ready"),
    quasistatic_modulation_authority: z.literal("not_ready"),
    complete_apparatus_stress_energy: z.literal("not_ready"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
}).strict().superRefine((config, context) => {
  if (
    JSON.stringify(config.sources.map((row) => row.source_id)) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2F_SOURCE_IDS)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sources"],
      message: "Stage-4.2F sources must preserve frozen order.",
    });
  }
  if (
    JSON.stringify(config.run_order) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2F_RUN_ORDER)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["run_order"],
      message: "Stage-4.2F run order must preserve frozen order.",
    });
  }
  if (
    !config.dp_model_audit.sensitivity_R0_m.includes(
      config.dp_model_audit.selected_R0_m,
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dp_model_audit", "sensitivity_R0_m"],
      message: "The frozen selected R0 must be included in the sensitivity scan.",
    });
  }
});

export type CasimirDpMaxwellMacroscopicQedClosureStage4_2FConfig = z.infer<
  typeof CasimirDpMaxwellMacroscopicQedClosureStage4_2FConfig
>;
