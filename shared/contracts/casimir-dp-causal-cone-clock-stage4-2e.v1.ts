import { z } from "zod";

export const CASIMIR_DP_CAUSAL_CONE_CLOCK_STAGE4_2E_VERSION =
  "casimir_dp_causal_cone_clock_stage4_2e/1" as const;

export const CASIMIR_DP_STAGE4_2E_SOURCE_IDS = [
  "gourgoulhon_3plus1_2007",
  "ehlers_pirani_schild_1972",
  "penrose_causal_spaces_1967",
  "hawking_king_mccarthy_1976",
  "penrose_nobel_2020",
  "penrose_or_1996",
  "fulling_milton_casimir_gravity_2007",
  "scharnhorst_1990",
  "barton_1990",
] as const;

export const CASIMIR_DP_STAGE4_2E_FIXTURE_CASE_IDS = [
  "baseline_recovery",
  "nonpositive_lapse_rejected",
  "nonpositive_spatial_metric_rejected",
  "timelike_path_outside_cone_rejected",
  "flat_l_over_c_promoted_as_null_solve_rejected",
  "scalar_negative_density_as_geometry_rejected",
  "qed_effective_cone_as_gr_metric_rejected",
  "boundary_label_as_standard_dp_modifier_rejected",
  "branch_metric_without_kernel_rejected",
  "synthetic_causal_recovery_promotion_rejected",
] as const;

export const CASIMIR_DP_STAGE4_2E_RUN_ORDER = [
  "verify_immutable_stage4_2d_authority_tuples",
  "freeze_causal_geometry_source_support_boundaries",
  "freeze_adm_units_chart_and_time_orientation",
  "recover_minkowski_local_null_cone_and_clock",
  "recover_nhm2_same_equation_cone_boundary_without_promoting_l_over_c",
  "recover_shifted_anisotropic_adm_cone",
  "integrate_bounded_schwarzschild_radial_null_and_radar_clock",
  "compute_ideal_casimir_interaction_stress_screening_bound",
  "block_geometry_promotion_without_complete_apparatus_tensor",
  "compute_qed_effective_propagation_control",
  "separate_metric_qed_material_and_polarization_signatures",
  "verify_standard_dp_boundary_independence",
  "block_branch_metric_and_metric_to_coherence_edges",
  "execute_fail_closed_fixture_matrix",
  "write_claim_nonclaim_and_pilot_ledger",
  "write_content_addressed_report_trace_and_receipt",
] as const;

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const PositiveFinite = z.number().finite().positive();
const Finite = z.number().finite();
const Vec3 = z.tuple([Finite, Finite, Finite]);
const Matrix3 = z.tuple([
  z.tuple([Finite, Finite, Finite]),
  z.tuple([Finite, Finite, Finite]),
  z.tuple([Finite, Finite, Finite]),
]);

export const CasimirDpStage4_2EAuthorityTuple = z.object({
  role: z.string().min(1),
  path: z.string().min(1),
  sha256: Sha256,
  required_at_runtime: z.literal(true),
}).strict();

export const CasimirDpStage4_2ESource = z.object({
  source_id: z.enum(CASIMIR_DP_STAGE4_2E_SOURCE_IDS),
  title: z.string().min(1),
  url: z.string().url(),
  source_class: z.enum(["primary_research", "official_reference"]),
  supports: z.string().min(1),
  does_not_support: z.string().min(1),
}).strict();

export const CasimirDpStage4_2EFixture = z.object({
  schema_version: z.literal("casimir_dp_stage4_2e_fixture/1"),
  campaign_id: z.literal("casimir-dp-causal-cone-clock-stage4-2e-v1"),
  evidence_class: z.literal("synthetic_fixture"),
  generated_at: z.string().datetime(),
  cases: z.array(z.object({
    case_id: z.enum(CASIMIR_DP_STAGE4_2E_FIXTURE_CASE_IDS),
    expected_gate: z.enum(["pass", "blocked"]),
    expected_status: z.string().min(1),
    scientific_interpretation: z.string().min(1),
  }).strict()).length(CASIMIR_DP_STAGE4_2E_FIXTURE_CASE_IDS.length),
}).strict().superRefine((fixture, context) => {
  if (
    JSON.stringify(fixture.cases.map((row) => row.case_id)) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2E_FIXTURE_CASE_IDS)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cases"],
      message: "Stage-4.2E fixture cases must preserve frozen order.",
    });
  }
});

export const CasimirDpCausalConeClockStage4_2EConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_CAUSAL_CONE_CLOCK_STAGE4_2E_VERSION),
  study_id: z.literal("casimir-dp-quantum-foam-study-v1"),
  campaign_id: z.literal("casimir-dp-causal-cone-clock-stage4-2e-v1"),
  implementation_version: z.literal("stage4.2e-v1"),
  evidence_cutoff: z.string().datetime(),
  evidence_class: z.literal(
    "synthetic_causal_geometry_recovery_and_screening_bound",
  ),
  claim_ceiling: z.literal(
    "causal_geometry_consistency_and_propagation_control_only",
  ),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  authority_manifest: z.object({
    path: z.literal(
      "configs/research/casimir-dp-stage4-2e-authorities.v1.json",
    ),
    sha256: Sha256,
  }).strict(),
  upstream_authorities: z.array(CasimirDpStage4_2EAuthorityTuple).length(6),
  immutable_stage4_2d: z.object({
    campaign_run_id: z.literal(
      "casimir-dp-cross-scale-metrology-stage4-2d-v1-20260728T193200000Z",
    ),
    software_and_recovery_diagnostics: z.literal("pass"),
    spectroscopic_response_authority: z.literal("not_ready"),
    physical_pilot_readiness: z.literal("not_ready"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
  sources: z.array(CasimirDpStage4_2ESource).length(
    CASIMIR_DP_STAGE4_2E_SOURCE_IDS.length,
  ),
  constants: z.object({
    hbar_J_s: PositiveFinite,
    G_m3_kg_s2: PositiveFinite,
    c_m_s: PositiveFinite,
    fine_structure_constant: PositiveFinite,
    electron_reduced_compton_wavelength_m: PositiveFinite,
  }).strict(),
  adm_benchmarks: z.array(z.object({
    case_id: z.enum([
      "minkowski",
      "nhm2_centerline_lapse_reference",
      "shifted_anisotropic_chart",
    ]),
    authority: z.enum([
      "analytic_recovery",
      "synthetic_same_equation_recovery",
      "synthetic_adm_recovery",
    ]),
    lapse: PositiveFinite,
    shift: Vec3,
    spatial_metric: Matrix3,
    direction: Vec3,
    timelike_coordinate_velocity_over_c: Vec3,
    segment_length_m: PositiveFinite,
    expected_clock_rate: PositiveFinite,
  }).strict()).length(3),
  weak_field_radial_null_recovery: z.object({
    central_mass_kg: PositiveFinite,
    emitter_radius_m: PositiveFinite,
    reflector_radius_m: PositiveFinite,
    coordinate_system: z.literal("schwarzschild_areal_radius"),
    expected_maximum_relative_error: PositiveFinite,
  }).strict(),
  casimir_semiclassical_screen: z.object({
    gap_m: PositiveFinite,
    plate_area_m2: PositiveFinite,
    ideal_parallel_conductors: z.literal(true),
    complete_apparatus_tensor_available: z.literal(false),
    conserved_total_stress_verified: z.literal(false),
    metric_boundary_conditions_registered: z.literal(false),
  }).strict(),
  qed_effective_propagation_control: z.object({
    model: z.literal("ideal_low_frequency_scharnhorst_scaling"),
    coefficient_11_pi2_over_2700: PositiveFinite,
    probe_frequency_Hz: PositiveFinite,
    sigma_plus_weight: z.literal(1),
    sigma_minus_weight: z.literal(1),
    material_dispersion_measured: z.literal(false),
    polarization_response_measured: z.literal(false),
    front_velocity_claim_allowed: z.literal(false),
  }).strict(),
  hypothesis_policy: z.object({
    ordinary_qed_and_material_propagation: z.literal(
      "registered_control_lane",
    ),
    ordinary_gr_complete_apparatus_response: z.literal(
      "screening_bound_only",
    ),
    frozen_mass_density_dp: z.literal(
      "registered_nonrelativistic_markovian_mass_density_dp",
    ),
    standard_dp_boundary_modifier: z.literal(false),
    branch_metric_kernel_registered: z.literal(false),
    metric_to_coherence_kernel_registered: z.literal(false),
    registered_dp_generator_mutated: z.literal(false),
  }).strict(),
  thresholds: z.object({
    maximum_null_constraint_absolute_error: PositiveFinite,
    maximum_clock_identity_absolute_error: PositiveFinite,
    minimum_spatial_metric_leading_minor: PositiveFinite,
    maximum_weak_field_recovery_relative_error: PositiveFinite,
    maximum_direct_gravitational_fractional_light_time_bound: PositiveFinite,
    minimum_qed_to_gravity_scale_separation: PositiveFinite,
  }).strict(),
  fixture: z.object({
    path: z.literal(
      "configs/research/fixtures/casimir-dp-stage4-2e-causal-cone.synthetic.v1.json",
    ),
    sha256: Sha256,
  }).strict(),
  run_order: z.array(z.enum(CASIMIR_DP_STAGE4_2E_RUN_ORDER)).length(
    CASIMIR_DP_STAGE4_2E_RUN_ORDER.length,
  ),
  final_status_policy: z.object({
    software_and_causal_recovery_diagnostics: z.literal("pass"),
    null_geodesic_apparatus_authority: z.literal("not_ready"),
    complete_apparatus_metric_response: z.literal("not_ready"),
    physical_pilot_readiness: z.literal("not_ready"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
}).strict().superRefine((config, context) => {
  if (
    JSON.stringify(config.sources.map((row) => row.source_id)) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2E_SOURCE_IDS)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sources"],
      message: "Stage-4.2E sources must preserve frozen order.",
    });
  }
  if (
    JSON.stringify(config.run_order) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2E_RUN_ORDER)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["run_order"],
      message: "Stage-4.2E run order must preserve frozen order.",
    });
  }
  if (
    JSON.stringify(config.adm_benchmarks.map((row) => row.case_id)) !==
      JSON.stringify([
        "minkowski",
        "nhm2_centerline_lapse_reference",
        "shifted_anisotropic_chart",
      ])
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["adm_benchmarks"],
      message: "Stage-4.2E ADM benchmarks must preserve frozen order.",
    });
  }
  if (
    config.weak_field_radial_null_recovery.reflector_radius_m <=
      config.weak_field_radial_null_recovery.emitter_radius_m
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["weak_field_radial_null_recovery", "reflector_radius_m"],
      message: "Reflector radius must exceed emitter radius.",
    });
  }
});

export type CasimirDpCausalConeClockStage4_2EConfig = z.infer<
  typeof CasimirDpCausalConeClockStage4_2EConfig
>;
