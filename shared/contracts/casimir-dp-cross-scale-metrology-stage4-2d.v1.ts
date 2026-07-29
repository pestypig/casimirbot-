import { z } from "zod";

export const CASIMIR_DP_CROSS_SCALE_METROLOGY_STAGE4_2D_VERSION =
  "casimir_dp_cross_scale_metrology_stage4_2d/1" as const;

export const CASIMIR_DP_STAGE4_2D_SOURCE_IDS = [
  "penrose_spinor_1960",
  "penrose_or_1996",
  "diosi_master_equation_1987",
  "nist_zeeman",
  "nist_rydberg_stark_2022",
  "blackbody_stark_1997",
  "potato_radius_2010",
  "jeans_molecular_cloud_2023",
  "nasa_schwarzschild",
] as const;

export const CASIMIR_DP_STAGE4_2D_FIXTURE_CASE_IDS = [
  "baseline_recovery",
  "zeeman_missing_field_authority",
  "stark_missing_polarizability_authority",
  "blackbody_stark_dp_bridge_rejected",
  "spinor_as_mass_rejected",
  "schwarzschild_as_dp_threshold_rejected",
  "potato_radius_as_dp_threshold_rejected",
  "jeans_scale_as_dp_threshold_rejected",
  "registered_dp_generator_mutation_rejected",
  "synthetic_metrology_promotion_rejected",
] as const;

export const CASIMIR_DP_STAGE4_2D_RUN_ORDER = [
  "verify_immutable_stage4_2c_authority_tuples",
  "freeze_primary_and_official_source_support_boundaries",
  "freeze_constants_units_and_frequency_conventions",
  "evaluate_weak_field_zeeman_witness",
  "evaluate_static_stark_witness",
  "evaluate_blackbody_dynamic_stark_witness",
  "construct_spectroscopic_response_and_covariance_receipt",
  "recover_schwarzschild_compactness_limits",
  "recover_material_strength_gravity_crossover",
  "recover_jeans_pressure_gravity_crossover",
  "enforce_spinor_representation_nonbridge",
  "compare_equations_by_transfer_recovery_and_nonbridge_class",
  "verify_registered_dp_generator_unchanged",
  "execute_fail_closed_fixture_matrix",
  "write_claim_nonclaim_and_empirical_pilot_ledger",
  "write_content_addressed_report_trace_and_receipt",
] as const;

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const PositiveFinite = z.number().finite().positive();
const NonnegativeFinite = z.number().finite().nonnegative();

export const CasimirDpStage4_2DAuthorityTuple = z.object({
  role: z.string().min(1),
  path: z.string().min(1),
  sha256: Sha256,
  required_at_runtime: z.literal(true),
}).strict();

export const CasimirDpStage4_2DSource = z.object({
  source_id: z.enum(CASIMIR_DP_STAGE4_2D_SOURCE_IDS),
  title: z.string().min(1),
  url: z.string().url(),
  source_class: z.enum(["primary_research", "official_reference"]),
  supports: z.string().min(1),
  does_not_support: z.string().min(1),
}).strict();

export const CasimirDpStage4_2DFixture = z.object({
  schema_version: z.literal("casimir_dp_stage4_2d_fixture/1"),
  campaign_id: z.literal(
    "casimir-dp-cross-scale-metrology-stage4-2d-v1",
  ),
  evidence_class: z.literal("synthetic_fixture"),
  generated_at: z.string().datetime(),
  cases: z.array(z.object({
    case_id: z.enum(CASIMIR_DP_STAGE4_2D_FIXTURE_CASE_IDS),
    expected_gate: z.enum(["pass", "blocked"]),
    expected_status: z.string().min(1),
    scientific_interpretation: z.string().min(1),
  }).strict()).length(CASIMIR_DP_STAGE4_2D_FIXTURE_CASE_IDS.length),
}).strict().superRefine((fixture, context) => {
  const ids = fixture.cases.map((row) => row.case_id);
  if (
    JSON.stringify(ids) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2D_FIXTURE_CASE_IDS)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cases"],
      message: "Stage-4.2D fixture cases must preserve frozen order.",
    });
  }
});

export const CasimirDpCrossScaleMetrologyStage4_2DConfig = z.object({
  schema_version: z.literal(
    CASIMIR_DP_CROSS_SCALE_METROLOGY_STAGE4_2D_VERSION,
  ),
  study_id: z.literal("casimir-dp-quantum-foam-study-v1"),
  campaign_id: z.literal(
    "casimir-dp-cross-scale-metrology-stage4-2d-v1",
  ),
  implementation_version: z.literal("stage4.2d-v1"),
  evidence_cutoff: z.string().datetime(),
  evidence_class: z.literal("synthetic_fixture"),
  claim_ceiling: z.literal(
    "spectroscopic_field_metrology_and_classical_gravity_recovery_only",
  ),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  authority_manifest: z.object({
    path: z.literal(
      "configs/research/casimir-dp-stage4-2d-authorities.v1.json",
    ),
    sha256: Sha256,
  }).strict(),
  upstream_authorities: z.array(CasimirDpStage4_2DAuthorityTuple).min(6),
  immutable_stage4_2c: z.object({
    campaign_run_id: z.literal(
      "casimir-dp-identifiability-redesign-stage4-2c-v1-20260728T042510781Z",
    ),
    selected_candidate_id: z.literal("silica_high_mass_identifiable"),
    required_paired_windows: z.literal(542),
    physical_pilot_readiness: z.literal("not_ready"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
  sources: z.array(CasimirDpStage4_2DSource).length(
    CASIMIR_DP_STAGE4_2D_SOURCE_IDS.length,
  ),
  constants: z.object({
    h_J_s: PositiveFinite,
    mu_B_J_T: PositiveFinite,
    G_m3_kg_s2: PositiveFinite,
    c_m_s: PositiveFinite,
    k_B_J_K: PositiveFinite,
    m_u_kg: PositiveFinite,
    parsec_m: PositiveFinite,
    solar_mass_kg: PositiveFinite,
    solar_radius_m: PositiveFinite,
  }).strict(),
  spectroscopic_witness: z.object({
    evidence_class: z.literal("design_assumption"),
    measured_response_available: z.literal(false),
    zeeman: z.object({
      lande_g: PositiveFinite,
      magnetic_quantum_number: z.number().int(),
      magnetic_field_T: PositiveFinite,
      magnetic_field_standard_uncertainty_T: PositiveFinite,
    }).strict(),
    stark: z.object({
      differential_polarizability_Hz_per_V2_m2: PositiveFinite,
      electric_field_V_m: PositiveFinite,
      electric_field_standard_uncertainty_V_m: PositiveFinite,
    }).strict(),
    blackbody_dynamic_stark: z.object({
      coefficient_Hz_K4: z.number().finite().negative(),
      temperature_K: PositiveFinite,
      reference_temperature_K: PositiveFinite,
      temperature_standard_uncertainty_K: PositiveFinite,
    }).strict(),
    circular_polarization: z.object({
      sigma_plus_delta_m: z.literal(1),
      sigma_minus_delta_m: z.literal(-1),
      handedness_convention_frozen: z.literal(true),
    }).strict(),
  }).strict(),
  gravitational_recovery: z.object({
    compactness_cases: z.array(z.object({
      case_id: z.enum(["sun", "stage4_2c_selected_object"]),
      mass_kg: PositiveFinite,
      radius_m: PositiveFinite,
      expected_compactness_max: PositiveFinite,
    }).strict()).length(2),
    potato_crossover: z.object({
      density_kg_m3: PositiveFinite,
      yield_strength_Pa: PositiveFinite,
      expected_radius_min_m: PositiveFinite,
      expected_radius_max_m: PositiveFinite,
      geometry_coefficient: PositiveFinite,
    }).strict(),
    jeans_crossover: z.object({
      temperature_K: PositiveFinite,
      molecular_weight_u: PositiveFinite,
      number_density_m3: PositiveFinite,
      expected_jeans_length_min_m: PositiveFinite,
      expected_jeans_length_max_m: PositiveFinite,
    }).strict(),
  }).strict(),
  hypothesis_policy: z.object({
    ordinary_physics_null: z.literal("registered_and_profiled"),
    frozen_mass_density_dp: z.literal(
      "registered_nonrelativistic_markovian_mass_density_dp",
    ),
    registered_dp_generator_mutated: z.literal(false),
    transfer_kernel_registered: z.literal(false),
    spectroscopic_or_gravity_recovery_as_dp_kernel: z.literal(false),
    spinor_as_mass_or_collapse_generator: z.literal(false),
  }).strict(),
  thresholds: z.object({
    maximum_algebraic_relative_error: z.literal(1e-12),
    minimum_covariance_diagonal: z.literal(1e-30),
    maximum_covariance_asymmetry: z.literal(1e-18),
  }).strict(),
  fixture: z.object({
    path: z.literal(
      "configs/research/fixtures/casimir-dp-stage4-2d-cross-scale.synthetic.v1.json",
    ),
    sha256: Sha256,
  }).strict(),
  run_order: z.array(z.enum(CASIMIR_DP_STAGE4_2D_RUN_ORDER)).length(
    CASIMIR_DP_STAGE4_2D_RUN_ORDER.length,
  ),
  final_status_policy: z.object({
    software_and_recovery_diagnostics: z.literal("pass"),
    spectroscopic_response_authority: z.literal("not_ready"),
    physical_pilot_readiness: z.literal("not_ready"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
}).strict().superRefine((config, context) => {
  const sourceIds = config.sources.map((row) => row.source_id);
  if (
    JSON.stringify(sourceIds) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2D_SOURCE_IDS)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sources"],
      message: "Stage-4.2D sources must preserve frozen order.",
    });
  }
  if (
    JSON.stringify(config.run_order) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2D_RUN_ORDER)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["run_order"],
      message: "Stage-4.2D run order must preserve frozen order.",
    });
  }
});

export type CasimirDpCrossScaleMetrologyStage4_2DConfig = z.infer<
  typeof CasimirDpCrossScaleMetrologyStage4_2DConfig
>;

