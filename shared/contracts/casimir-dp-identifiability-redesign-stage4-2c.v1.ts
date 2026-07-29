import { z } from "zod";

export const CASIMIR_DP_IDENTIFIABILITY_REDESIGN_STAGE4_2C_VERSION =
  "casimir_dp_identifiability_redesign_stage4_2c/1" as const;

export const CASIMIR_DP_STAGE4_2C_RUN_ORDER = [
  "verify_immutable_stage4_2b_authority_tuples",
  "freeze_stage4_2c_claim_policy_and_nonbridge_rules",
  "freeze_control_axis_values_response_models_and_covariance_ancestry",
  "freeze_bounded_apparatus_candidate_catalogue",
  "compile_raw_complex_control_response_vectors",
  "construct_block_covariance_and_whitening_receipt",
  "recover_stage4_2b_signature_no_go",
  "transport_each_candidate_through_the_registered_dp_generator",
  "append_covariance_whitened_control_contrast_channels",
  "evaluate_identifiability_conditioning_power_and_companion_gates",
  "reject_candidates_outside_registered_design_or_authority_domains",
  "select_the_minimum_burden_passing_candidate_without_confirmatory_data",
  "run_adversarial_recovery_and_fail_closed_fixtures",
  "freeze_selected_candidate_code_covariance_exclusions_and_scoring",
  "generate_calibration_pilot_confirmatory_and_replication_packets",
  "retain_blind_custody_and_prohibit_automatic_unblinding",
  "write_outcome_claim_nonclaim_and_blocker_ledger",
  "write_content_addressed_report_trace_and_campaign_receipt",
] as const;

export const CASIMIR_DP_STAGE4_2C_REQUIRED_CONTROL_AXES = [
  "temperature",
  "pressure",
  "vibration",
  "charge",
  "distance",
  "polarization",
  "readout_power",
] as const;

export const CASIMIR_DP_STAGE4_2C_REQUIRED_FIXTURE_CASE_IDS = [
  "stage4_2b_no_go_recovery",
  "control_response_round_trip",
  "thermal_intercept_decorrelation",
  "shared_calibration_covariance_recovery",
  "sensor_self_noise_covariance_only",
  "cross_axis_leakage_stress",
  "candidate_powered_region_recovery",
  "underpowered_candidate",
  "out_of_bounds_candidate_rejected",
  "missing_material_response_authority_rejected",
  "post_hoc_dp_retuning_rejected",
  "confirmatory_leakage_rejected",
  "bridge_without_kernel_rejected",
  "cross_scale_nonbridge_rejected",
  "state_preparation_not_promoted",
  "physical_pilot_readiness_fail_closed",
] as const;

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const PositiveFinite = z.number().finite().positive();
const NonnegativeFinite = z.number().finite().nonnegative();
const EvidenceClass = z.enum([
  "synthetic_fixture",
  "design_assumption",
  "source_backed_model",
  "measured",
]);

export const CasimirDpStage4_2CAuthorityTuple = z.object({
  role: z.string().min(1),
  path: z.string().min(1),
  sha256: Sha256,
  tracked: z.boolean(),
  required_at_runtime: z.literal(true),
}).strict();

export const CasimirDpStage4_2CControlAxis = z.object({
  axis_id: z.enum(CASIMIR_DP_STAGE4_2C_REQUIRED_CONTROL_AXES),
  low_level_id: z.string().min(1),
  high_level_id: z.string().min(1),
  low_numeric_value: z.number().finite(),
  high_numeric_value: z.number().finite(),
  unit: z.string().min(1),
  primary_lane: z.enum([
    "thermal",
    "electromagnetic",
    "vibration",
    "gas",
    "readout",
  ]),
  response_quadrature: z.enum(["real", "imaginary"]),
  raw_level_contrast_magnitude_log_coherence: PositiveFinite,
  response_standard_uncertainty_log_coherence: PositiveFinite,
  shared_calibration_fraction: z.number().finite().gte(0).lt(1),
  re_im_correlation: z.number().finite().gt(-1).lt(1),
  source_ref: z.string().min(1),
  source_sha256: Sha256,
  authority_class: z.literal("design_assumption"),
  measured_response_available: z.literal(false),
}).strict().superRefine((axis, context) => {
  if (axis.low_level_id === axis.high_level_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["high_level_id"],
      message: "Control-axis low and high level ids must be distinct.",
    });
  }
  if (axis.low_numeric_value === axis.high_numeric_value) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["high_numeric_value"],
      message: "Control-axis numerical levels must be distinct.",
    });
  }
});

export const CasimirDpStage4_2CApparatusCandidate = z.object({
  candidate_id: z.string().min(1),
  material_id: z.enum(["silica", "diamond"]),
  material_response_authority: z.enum([
    "stage4_2b_source_backed",
    "contextual_not_admitted",
  ]),
  radius_m: PositiveFinite,
  mass_kg: PositiveFinite,
  mass_scale_from_stage4_2b_nominal: PositiveFinite,
  branch_separation_scale: PositiveFinite,
  hold_time_scale: PositiveFinite,
  primary_sequence: z.enum(["ramsey", "echo", "path_swap"]),
  cavity_gap_m: PositiveFinite,
  boundary_modulation_hz: NonnegativeFinite,
  environment_temperature_K: PositiveFinite,
  pressure_Pa: PositiveFinite,
  vibration_acceleration_asd_m_s2_sqrtHz: PositiveFinite,
  readout_power_W: PositiveFinite,
  readout_wavelength_m: PositiveFinite,
  polarization_program: z.enum([
    "te_tm_balanced",
    "linear_only",
    "circular_control_pair",
  ]),
  control_response_gain: PositiveFinite,
  planned_paired_windows: z.number().int().positive(),
  preparation_domain: z.enum([
    "inside_bounded_design_assumption",
    "outside_bounded_design_assumption",
  ]),
  state_preparation_evidence_class: z.literal("design_assumption"),
  authentic_state_preparation_receipt_available: z.literal(false),
}).strict();

export const CasimirDpStage4_2CSyntheticFixture = z.object({
  schema_version: z.literal("casimir_dp_stage4_2c_synthetic_campaign/1"),
  campaign_id: z.literal(
    "casimir-dp-identifiability-redesign-stage4-2c-v1",
  ),
  evidence_class: z.literal("synthetic_fixture"),
  generated_at: z.string().datetime(),
  measured_evidence: z.literal("not_ready"),
  collapse_identification: z.literal("blocked"),
  manifold_dynamics: z.literal("blocked"),
  physical_viability: z.literal("not_evaluated"),
  cases: z.array(z.object({
    case_id: z.enum(CASIMIR_DP_STAGE4_2C_REQUIRED_FIXTURE_CASE_IDS),
    target_runtime: z.enum(["H", "I", "J", "K", "L", "M"]),
    expected_gate: z.enum(["pass", "blocked"]),
    expected_status: z.string().min(1),
    mutation: z.record(z.unknown()),
    scientific_interpretation: z.string().min(1),
  }).strict()).length(CASIMIR_DP_STAGE4_2C_REQUIRED_FIXTURE_CASE_IDS.length),
}).strict().superRefine((fixture, context) => {
  const ids = fixture.cases.map((row) => row.case_id);
  if (
    JSON.stringify(ids) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2C_REQUIRED_FIXTURE_CASE_IDS)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cases"],
      message:
        "Stage-4.2C fixture cases must exactly preserve the preregistered order.",
    });
  }
});

export const CasimirDpIdentifiabilityRedesignStage4_2CConfig = z.object({
  schema_version: z.literal(
    CASIMIR_DP_IDENTIFIABILITY_REDESIGN_STAGE4_2C_VERSION,
  ),
  study_id: z.literal("casimir-dp-quantum-foam-study-v1"),
  campaign_id: z.literal(
    "casimir-dp-identifiability-redesign-stage4-2c-v1",
  ),
  implementation_version: z.literal("stage4.2c-v1"),
  evidence_cutoff: z.string().datetime(),
  evidence_class: z.literal("synthetic_fixture"),
  claim_ceiling: z.literal(
    "bounded_synthetic_apparatus_redesign_and_empirical_input_readiness_only",
  ),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  authority_manifest: z.object({
    role: z.literal("stage4_2c_authority_manifest"),
    path: z.literal(
      "configs/research/casimir-dp-stage4-2c-authorities.v1.json",
    ),
    sha256: Sha256,
    tracked: z.boolean(),
    required_at_runtime: z.literal(true),
  }).strict(),
  upstream_authorities: z.array(CasimirDpStage4_2CAuthorityTuple).min(8),
  immutable_stage4_2b: z.object({
    campaign_run_id: z.literal(
      "casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z",
    ),
    campaign_report_sha256: z.literal(
      "2ebd9971bacc393842dc71bfd80063d7b244231947074bc70b3be25bd7ad5b67",
    ),
    campaign_receipt_sha256: z.literal(
      "50632b32c4133fe3f0f5eee3cbbb157a983d0a9da69de6239d58563ca88f569c",
    ),
    downstream_verification_receipt_sha256: z.literal(
      "194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d",
    ),
    recovered_verdict: z.literal("signature_not_identifiable"),
    recovered_maximum_abs_whitened_cosine: z.literal(
      0.9999771044199663,
    ),
    recovered_normalized_gram_condition_number: z.literal(
      179103.91134865975,
    ),
  }).strict(),
  control_response_authority: z.object({
    observable: z.literal("complex_log_coherence"),
    values_are_measured: z.literal(false),
    authority_class: z.literal("design_assumption"),
    physical_disturbance_and_sensor_self_noise_separated: z.literal(true),
    control_responses_are_not_orthogonal_proxies: z.literal(true),
    response_values_derive_from_frozen_axis_levels: z.literal(true),
    block_covariance_required: z.literal(true),
    shared_calibration_covariance_required: z.literal(true),
    control_axes: z.array(CasimirDpStage4_2CControlAxis).length(
      CASIMIR_DP_STAGE4_2C_REQUIRED_CONTROL_AXES.length,
    ),
    sham_switch: z.object({
      raw_response_log_coherence: NonnegativeFinite,
      response_standard_uncertainty_log_coherence: PositiveFinite,
      primary_lane: z.literal("readout"),
      measured_response_available: z.literal(false),
    }).strict(),
    detuned_boundary: z.object({
      raw_response_log_coherence: NonnegativeFinite,
      response_standard_uncertainty_log_coherence: PositiveFinite,
      primary_lane: z.literal("electromagnetic"),
      measured_response_available: z.literal(false),
    }).strict(),
    sensor_self_noise: z.object({
      admitted_as_physical_decoherence_lane: z.literal(false),
      admitted_in_covariance: z.literal(true),
      raw_standard_uncertainty_log_coherence: PositiveFinite,
      source_ref: z.string().min(1),
      source_sha256: Sha256,
    }).strict(),
  }).strict().superRefine((authority, context) => {
    const ids = authority.control_axes.map((axis) => axis.axis_id);
    if (
      JSON.stringify(ids) !==
        JSON.stringify(CASIMIR_DP_STAGE4_2C_REQUIRED_CONTROL_AXES)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["control_axes"],
        message:
          "Stage-4.2C control axes must preserve the frozen Stage-4.2B order.",
      });
    }
  }),
  apparatus_search: z.object({
    search_mode: z.literal("exhaustive_frozen_candidate_catalogue"),
    objective_order: z.tuple([
      z.literal("all_hard_gates"),
      z.literal("minimum_required_paired_windows"),
      z.literal("minimum_mass_scale"),
      z.literal("lexicographic_candidate_id"),
    ]),
    maximum_mass_scale: z.literal(60),
    maximum_branch_separation_scale: z.literal(5),
    maximum_hold_time_scale: z.literal(4),
    candidates: z.array(CasimirDpStage4_2CApparatusCandidate).min(5),
  }).strict().superRefine((search, context) => {
    const ids = search.candidates.map((candidate) => candidate.candidate_id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["candidates"],
        message: "Stage-4.2C candidate ids must be unique.",
      });
    }
  }),
  hypothesis_policy: z.object({
    ordinary_physics_null: z.literal("registered_and_profiled"),
    frozen_mass_density_dp: z.literal(
      "registered_nonrelativistic_markovian_mass_density_dp",
    ),
    boundary_conditioned_bridge: z.literal(
      "separate_hypothesis_not_admitted_without_transfer_kernel",
    ),
    transfer_kernel_registered: z.literal(false),
    compton_higgs_qed_blackbody_as_transfer_kernel: z.literal(false),
    conditional_boundary_null_scope: z.literal(
      "registered_mass_density_dp_under_complete_joint_system_equivalence_only",
    ),
  }).strict(),
  thresholds: z.object({
    maximum_abs_whitened_signature_cosine: z.literal(0.97),
    augmented_design_condition_number_max: z.literal(100),
    minimum_power: z.literal(0.8),
    maximum_false_positive_rate: z.literal(0.05),
    minimum_companion_snr: z.literal(5),
    maximum_forecast_covariance_condition_number: z.literal(100000000),
  }).strict(),
  packet_policy: z.object({
    partitions: z.tuple([
      z.literal("calibration"),
      z.literal("pilot"),
      z.literal("confirmatory"),
      z.literal("independent_replication"),
    ]),
    freeze_before_confirmatory_ingestion: z.literal(true),
    confirmatory_data_available: z.literal(false),
    automatic_unblinding_allowed: z.literal(false),
    independent_replication_required: z.literal(true),
    exclusions_frozen_from_calibration_and_pilot_only: z.literal(true),
  }).strict(),
  fixture: z.object({
    path: z.literal(
      "configs/research/fixtures/casimir-dp-stage4-2c-campaign.synthetic.v1.json",
    ),
    sha256: Sha256,
    evidence_class: z.literal("synthetic_fixture"),
    required_case_ids: z.array(
      z.enum(CASIMIR_DP_STAGE4_2C_REQUIRED_FIXTURE_CASE_IDS),
    ).length(CASIMIR_DP_STAGE4_2C_REQUIRED_FIXTURE_CASE_IDS.length),
  }).strict().superRefine((fixture, context) => {
    if (
      JSON.stringify(fixture.required_case_ids) !==
        JSON.stringify(CASIMIR_DP_STAGE4_2C_REQUIRED_FIXTURE_CASE_IDS)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["required_case_ids"],
        message:
          "Stage-4.2C required fixture ids must preserve the preregistered order.",
      });
    }
  }),
  run_order: z.array(z.enum(CASIMIR_DP_STAGE4_2C_RUN_ORDER)).length(
    CASIMIR_DP_STAGE4_2C_RUN_ORDER.length,
  ),
  final_status_policy: z.object({
    software_and_synthetic_diagnostics: z.literal("pass"),
    bounded_design_region: z.enum([
      "not_evaluated",
      "available",
      "redesign_no_go",
    ]),
    physical_pilot_readiness: z.literal("not_ready"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
    publication_claim: z.literal(
      "bounded_synthetic_apparatus_redesign_and_empirical_input_readiness_only",
    ),
  }).strict(),
}).strict().superRefine((config, context) => {
  if (
    JSON.stringify(config.run_order) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2C_RUN_ORDER)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["run_order"],
      message: "Stage-4.2C run order must preserve the preregistered order.",
    });
  }
});

export type CasimirDpIdentifiabilityRedesignStage4_2CConfig = z.infer<
  typeof CasimirDpIdentifiabilityRedesignStage4_2CConfig
>;

export type CasimirDpStage4_2CApparatusCandidate = z.infer<
  typeof CasimirDpStage4_2CApparatusCandidate
>;

export type CasimirDpStage4_2CControlAxis = z.infer<
  typeof CasimirDpStage4_2CControlAxis
>;
