import { z } from "zod";

export const CASIMIR_DP_EMPIRICAL_AUTHORITY_STAGE4_2L_VERSION =
  "casimir_dp_empirical_authority_stage4_2l/1" as const;

export const CASIMIR_DP_STAGE4_2L_RUN_ORDER = [
  "verify_immutable_stage4_2k_authority_tuples",
  "freeze_three_dimensional_apparatus_design_manifest",
  "validate_material_spectrum_ingestion_and_provenance",
  "crosscheck_finite_rectangle_green_surrogate",
  "propagate_phase_response_jacobian_and_covariance",
  "evaluate_quantum_linear_boltzmann_proxy",
  "audit_state_preparation_scale_and_sequence",
  "map_current_external_dp_bound",
  "evaluate_mass_density_and_regularization_envelope",
  "preserve_empirical_not_ready_and_zero_bridge_edges",
  "write_content_addressed_report_trace_and_receipt",
] as const;

const Positive = z.number().finite().positive();
const Nonnegative = z.number().finite().nonnegative();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Vector3 = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);
const Authority = z.object({
  role: z.string().min(1),
  path: z.string().min(1),
  sha256: Sha256,
  required_at_runtime: z.literal(true),
}).strict();

export const CasimirDpApparatusDesignManifestStage4_2L = z.object({
  schema_version: z.literal("casimir_dp_apparatus_design_manifest_stage4_2l/1"),
  manifest_id: z.literal("casimir-dp-stage4-2l-reference-geometry-v1"),
  authority_class: z.literal("frozen_engineering_reference_not_as_built_metrology"),
  coordinate_frame: z.object({
    origin: z.literal("plate_geometric_center_on_particle_facing_surface"),
    axes: z.object({ x: z.literal("plate_long_axis"), y: z.literal("plate_short_axis"), z: z.literal("surface_outward_normal") }).strict(),
    handedness: z.literal("right_handed"),
  }).strict(),
  object: z.object({
    identity_id: z.literal("silica_high_mass_identifiable_single_object_v1"),
    material: z.literal("fused_silica_design_proxy"),
    mass_kg: Positive,
    radius_m: Positive,
    nominal_center_m: Vector3,
  }).strict(),
  superposition: z.object({
    branch_vector_m: Vector3,
    separation_m: Positive,
    orientation: z.literal("tangential_to_plate_along_x"),
    hold_time_s: Positive,
    path_swap_required: z.literal(true),
    echo_required: z.literal(true),
  }).strict(),
  boundary: z.object({
    model: z.literal("finite_rectangular_plate_design_reference"),
    center_m: Vector3,
    normal: Vector3,
    size_x_m: Positive,
    size_y_m: Positive,
    thickness_m: Positive,
    aperture_radius_m: Nonnegative,
    coating: z.literal("unregistered_actual_coating"),
  }).strict(),
  nearby_conductors: z.array(z.object({
    id: z.string().min(1),
    minimum_distance_m: Positive,
    included_in_surrogate: z.boolean(),
  }).strict()),
  design_tolerances: z.object({
    branch_tilt_rad: Positive,
    plate_tilt_rad: Positive,
    lateral_centering_m: Positive,
    gap_m: Positive,
  }).strict(),
  receipts: z.object({
    as_built_cad_mesh: z.literal(false),
    coordinate_metrology: z.literal(false),
    branch_vector_metrology: z.literal(false),
    plate_normal_metrology: z.literal(false),
    nearby_conductor_survey: z.literal(false),
  }).strict(),
}).strict().superRefine((manifest, context) => {
  const d = Math.hypot(...manifest.superposition.branch_vector_m);
  if (Math.abs(d - manifest.superposition.separation_m) > 1e-18) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["superposition", "branch_vector_m"], message: "Branch-vector norm must equal separation." });
  }
  const n = manifest.boundary.normal;
  const nNorm = Math.hypot(...n);
  if (Math.abs(nNorm - 1) > 1e-12) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["boundary", "normal"], message: "Boundary normal must be a unit vector." });
  }
  const dot = manifest.superposition.branch_vector_m.reduce((sum, value, index) => sum + value * n[index], 0);
  if (Math.abs(dot) > 1e-18) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["superposition", "branch_vector_m"], message: "Reference branch must be tangential." });
  }
});

export type CasimirDpApparatusDesignManifestStage4_2L = z.infer<typeof CasimirDpApparatusDesignManifestStage4_2L>;

export const CasimirDpEmpiricalAuthorityFixtureStage4_2L = z.object({
  schema_version: z.literal("casimir_dp_empirical_authority_fixture_stage4_2l/1"),
  campaign_id: z.literal("casimir-dp-empirical-authority-stage4-2l-v1"),
  fixture_id: z.string().min(1),
  evidence_class: z.literal("synthetic_and_literature_bound_diagnostic"),
  generated_at: z.string().datetime(),
  constants: z.object({
    G_m3_kg_s2: Positive,
    hbar_J_s: Positive,
    c_m_s: Positive,
    epsilon0_F_m: Positive,
    k_B_J_K: Positive,
    dalton_kg: Positive,
  }).strict(),
  registered_dp: z.object({
    model_id: z.literal("diosi_1989_gaussian_regularized_nondissipative"),
    regularization_m: Positive,
    rate_s: Positive,
    energy_J: Positive,
    maximum_phase_jitter_rad: Positive,
  }).strict(),
  material_response: z.object({
    ingestion_schema: z.literal("frequency_hz_epsilon_real_epsilon_imaginary_covariance_v1"),
    specimen_measured_rows: z.array(z.object({ frequency_Hz: Positive, epsilon_real: z.number().finite(), epsilon_imaginary: Nonnegative }).strict()),
    literature_proxy_source_id: z.literal("cleek_1966_fused_silica_ir"),
    literature_proxy_static_permittivity: Positive,
    literature_proxy_temperature_K: Positive,
    apparatus_temperature_K: Positive,
    specimen_identity_matches: z.literal(false),
    cryogenic_temperature_matches: z.literal(false),
  }).strict(),
  finite_geometry: z.object({
    surrogate_model: z.literal("solid_angle_weighted_retarded_cp_finite_rectangle"),
    quadrature_panels_per_axis: z.number().int().min(32).max(1024),
    crosscheck_relative_tolerance: Positive,
    full_maxwell_green_receipt_available: z.literal(false),
    independent_solver_receipt_available: z.literal(false),
  }).strict(),
  phase_covariance: z.object({
    finite_difference: z.object({ lateral_centering_m: Positive, gap_m: Positive, branch_tilt_rad: Positive, plate_tilt_rad: Positive }).strict(),
    design_standard_deviations: z.object({ lateral_centering_m: Positive, gap_m: Positive, branch_tilt_rad: Positive, plate_tilt_rad: Positive }).strict(),
    empirical_jacobian_receipt_available: z.literal(false),
    empirical_covariance_receipt_available: z.literal(false),
  }).strict(),
  gas_environment: z.object({
    temperature_K: Positive,
    total_pressure_Pa: Positive,
    species: z.array(z.object({ id: z.string().min(1), pressure_fraction: z.number().gt(0).lte(1), molecular_mass_kg: Positive, total_cross_section_m2: Positive }).strict()).min(1),
    angular_quadrature_points: z.number().int().min(32).max(4096),
    target_fraction_of_dp_rate: z.number().gt(0).lt(1),
    measured_species_receipt_available: z.literal(false),
    measured_temperature_receipt_available: z.literal(false),
    measured_differential_scattering_receipt_available: z.literal(false),
    confinement_kernel_receipt_available: z.literal(false),
    independent_pressure_calibration_available: z.literal(false),
  }).strict(),
  state_preparation: z.object({
    demonstrated_mass_Da: Positive,
    demonstrated_separation_m: Positive,
    demonstrated_particle_diameter_m: Positive,
    source_id: z.literal("pedalino_etal_2026"),
    same_material: z.literal(false),
    same_platform: z.literal(false),
    integrated_sequence_receipt_available: z.literal(false),
  }).strict(),
  external_dp_bound: z.object({
    source_id: z.literal("xenonnt_2026"),
    convention: z.literal("diosi_markovian"),
    lower_R0_m_90CL: Positive,
    lower_R0_m_95CL: Positive,
    exact_composite_mapping_receipt_available: z.literal(false),
  }).strict(),
  density_representations: z.array(z.object({
    id: z.enum(["single_effective_gaussian", "homogeneous_sphere", "thin_shell", "core_shell_sensitivity"]),
    shell_mass_fraction: z.number().gte(0).lte(1),
  }).strict()).length(4),
  regularization_grid_m: z.array(Positive).min(3),
}).strict().superRefine((fixture, context) => {
  const sum = fixture.gas_environment.species.reduce((value, row) => value + row.pressure_fraction, 0);
  if (Math.abs(sum - 1) > 1e-12) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["gas_environment", "species"], message: "Gas pressure fractions must sum to one." });
  }
});

export type CasimirDpEmpiricalAuthorityFixtureStage4_2L = z.infer<typeof CasimirDpEmpiricalAuthorityFixtureStage4_2L>;

export const CasimirDpEmpiricalAuthorityStage4_2LConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_EMPIRICAL_AUTHORITY_STAGE4_2L_VERSION),
  study_id: z.literal("casimir-dp-quantum-foam-study-v1"),
  campaign_id: z.literal("casimir-dp-empirical-authority-stage4-2l-v1"),
  implementation_version: z.literal("stage4.2l-v1"),
  evidence_cutoff: z.string().datetime(),
  evidence_class: z.literal("synthetic_and_literature_bound_empirical_readiness_only"),
  claim_ceiling: z.literal("apparatus_redesign_and_empirical_acquisition_requirements_only"),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  authority_manifest: z.object({ path: z.string().min(1), sha256: Sha256 }).strict(),
  apparatus_manifest: z.object({ path: z.string().min(1), sha256: Sha256 }).strict(),
  upstream_authorities: z.array(Authority).min(4),
  method_authorities: z.array(Authority).min(2),
  fixture: z.object({ path: z.string().min(1), sha256: Sha256 }).strict(),
  numerical: z.object({
    density_integration_upper_u: Positive,
    density_integration_intervals: z.number().int().positive().refine((value) => value % 2 === 0),
    geometry_crosscheck_relative_tolerance: Positive,
  }).strict(),
  run_order: z.array(z.enum(CASIMIR_DP_STAGE4_2L_RUN_ORDER)).length(CASIMIR_DP_STAGE4_2L_RUN_ORDER.length),
  final_status_policy: z.object({
    software_contract: z.literal("pass"),
    apparatus_design_manifest: z.literal("frozen_reference_only"),
    as_built_geometry: z.literal("not_ready"),
    full_finite_geometry_green_authority: z.literal("not_ready"),
    measured_material_spectrum: z.literal("not_ready"),
    empirical_phase_covariance: z.literal("not_ready"),
    measured_qlbe_environment: z.literal("not_ready"),
    state_preparation: z.literal("not_ready"),
    external_bound_mapping: z.literal("partial_scalar_screen_only"),
    complete_mass_density_authority: z.literal("not_ready"),
    residual_attribution: z.literal("blocked"),
    confirmatory_campaign: z.literal("not_authorized"),
    transfer_kernel: z.literal("not_registered"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
}).strict().superRefine((config, context) => {
  if (JSON.stringify(config.run_order) !== JSON.stringify(CASIMIR_DP_STAGE4_2L_RUN_ORDER)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["run_order"], message: "Stage-4.2L order is frozen." });
  }
});

export type CasimirDpEmpiricalAuthorityStage4_2LConfig = z.infer<typeof CasimirDpEmpiricalAuthorityStage4_2LConfig>;
