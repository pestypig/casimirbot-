import { z } from "zod";

export const CASIMIR_DP_BOUNDARY_BRANCH_STAGE4_2I_VERSION =
  "casimir_dp_boundary_branch_interaction_stage4_2i/1" as const;

export const CASIMIR_DP_STAGE4_2I_CELL_ORDER = [
  "reference__branch_control",
  "reference__separated",
  "active__branch_control",
  "active__separated",
] as const;

export const CASIMIR_DP_STAGE4_2I_COVARIANCE_ORDER = [
  "observed.reference__branch_control.re",
  "observed.reference__branch_control.im",
  "observed.reference__separated.re",
  "observed.reference__separated.im",
  "observed.active__branch_control.re",
  "observed.active__branch_control.im",
  "observed.active__separated.re",
  "observed.active__separated.im",
  "ordinary.reference__branch_control.re",
  "ordinary.reference__branch_control.im",
  "ordinary.reference__separated.re",
  "ordinary.reference__separated.im",
  "ordinary.active__branch_control.re",
  "ordinary.active__branch_control.im",
  "ordinary.active__separated.re",
  "ordinary.active__separated.im",
] as const;

export const CASIMIR_DP_STAGE4_2I_RUN_ORDER = [
  "verify_immutable_stage4_2h_authority_tuples",
  "freeze_factorial_cell_and_complex_coordinate_order",
  "validate_structured_wavepacket_custody",
  "validate_boundary_to_boundary_branch_equivalence",
  "validate_joint_complex_covariance",
  "recover_boundary_independent_dp_cancellation",
  "compute_raw_complex_interaction_contrast",
  "compute_complex_cross_ratio_amplitude_and_phase",
  "subtract_registered_ordinary_physics_interaction",
  "propagate_joint_covariance_without_postfreeze_refit",
  "compare_factorial_contrast_with_whitened_projection",
  "run_adversarial_recovery_and_fail_closed_cases",
  "preserve_zero_unregistered_transfer_edges",
  "write_content_addressed_report_trace_and_receipt",
] as const;

const Finite = z.number().finite();
const NonnegativeFinite = Finite.nonnegative();
const PositiveFinite = Finite.positive();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Vector3 = z.tuple([Finite, Finite, Finite]);
const Matrix3 = z.tuple([Vector3, Vector3, Vector3]);
const Matrix16 = z.array(z.array(Finite).length(16)).length(16);

const AuthorityTuple = z.object({
  role: z.string().min(1),
  path: z.string().min(1),
  sha256: Sha256,
  required_at_runtime: z.literal(true),
}).strict();

const ComplexValue = z.object({
  re: Finite,
  im: Finite,
}).strict();

const CoherenceCell = z.object({
  cell_id: z.enum(CASIMIR_DP_STAGE4_2I_CELL_ORDER),
  boundary_state: z.enum(["reference", "active"]),
  branch_state: z.enum(["branch_control", "separated"]),
  coherence_t0: ComplexValue,
  coherence_t: ComplexValue,
}).strict();

const WavepacketState = z.object({
  wavepacket_id: z.string().min(1),
  boundary_state: z.enum(["reference", "active"]),
  branch_state: z.enum(["branch_control", "separated"]),
  authority_class: z.enum([
    "unacquired",
    "synthetic_validation",
    "measured_empirical",
  ]),
  center_a_m: Vector3,
  center_b_m: Vector3,
  covariance_a_m2: Matrix3,
  covariance_b_m2: Matrix3,
  overlap_abs: z.number().min(0).max(1),
  separation_standard_uncertainty_m: NonnegativeFinite,
  hold_time_s: NonnegativeFinite,
  hold_time_jitter_s: NonnegativeFinite,
  preparation_fidelity: z.number().min(0).max(1),
  momentum_difference_kg_m_s: Vector3,
  trajectory_ref: z.string().min(1),
  tomography_artifact_ref: z.string().min(1),
  tomography_artifact_sha256: Sha256,
}).strict().superRefine((state, context) => {
  const synthetic = state.authority_class === "synthetic_validation";
  const unacquired = state.authority_class === "unacquired";
  if (synthetic !== state.tomography_artifact_ref.startsWith("synthetic://")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tomography_artifact_ref"],
      message: "Synthetic wave-packet states require synthetic:// tomography; non-synthetic states may not use it.",
    });
  }
  if (unacquired !== state.tomography_artifact_ref.startsWith("unacquired://")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tomography_artifact_ref"],
      message: "Unacquired wave-packet states require unacquired:// tomography; acquired states may not use it.",
    });
  }
});

export const CasimirDpBoundaryBranchFixtureStage4_2I = z.object({
  schema_version: z.literal(
    "casimir_dp_boundary_branch_fixture_stage4_2i/1",
  ),
  campaign_id: z.literal(
    "casimir-dp-boundary-branch-interaction-stage4-2i-v1",
  ),
  fixture_id: z.string().min(1),
  evidence_class: z.literal("synthetic_validation"),
  generated_at: z.string().datetime(),
  apparatus_identity: z.object({
    identity_id: z.literal(
      "silica_high_mass_identifiable_single_object_v1",
    ),
    mass_kg: z.literal(1.94385e-16),
    sphere_radius_m: z.literal(2.76302362398029e-7),
    dp_regularization_length_m: z.literal(1e-7),
    separated_branch_distance_m: z.literal(1.6e-7),
    hold_time_s: z.literal(0.25),
  }).strict(),
  cell_order: z.tuple([
    z.literal("reference__branch_control"),
    z.literal("reference__separated"),
    z.literal("active__branch_control"),
    z.literal("active__separated"),
  ]),
  observed_cells: z.array(CoherenceCell).length(4),
  ordinary_prediction_cells: z.array(CoherenceCell).length(4),
  joint_covariance_coordinate_order: z.tuple([
    z.literal("observed.reference__branch_control.re"),
    z.literal("observed.reference__branch_control.im"),
    z.literal("observed.reference__separated.re"),
    z.literal("observed.reference__separated.im"),
    z.literal("observed.active__branch_control.re"),
    z.literal("observed.active__branch_control.im"),
    z.literal("observed.active__separated.re"),
    z.literal("observed.active__separated.im"),
    z.literal("ordinary.reference__branch_control.re"),
    z.literal("ordinary.reference__branch_control.im"),
    z.literal("ordinary.reference__separated.re"),
    z.literal("ordinary.reference__separated.im"),
    z.literal("ordinary.active__branch_control.re"),
    z.literal("ordinary.active__branch_control.im"),
    z.literal("ordinary.active__separated.re"),
    z.literal("ordinary.active__separated.im"),
  ]),
  joint_observed_ordinary_covariance: Matrix16,
  wavepacket_states: z.array(WavepacketState).length(4),
  dp_loss_exponent_by_boundary: z.object({
    reference: NonnegativeFinite,
    active: NonnegativeFinite,
  }).strict(),
  registered_transfer_kernel: z.literal(false),
  expected_case: z.enum([
    "boundary_independent_dp_null",
    "injected_boundary_branch_interaction",
    "coverage_failure_raw_complex_only",
  ]),
}).strict().superRefine((fixture, context) => {
  const ids = fixture.observed_cells.map((cell) => cell.cell_id);
  const ordinaryIds = fixture.ordinary_prediction_cells.map(
    (cell) => cell.cell_id,
  );
  if (JSON.stringify(ids) !== JSON.stringify(CASIMIR_DP_STAGE4_2I_CELL_ORDER)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["observed_cells"],
      message: "Observed cells must preserve the frozen 2x2 factorial order.",
    });
  }
  if (
    JSON.stringify(ordinaryIds) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2I_CELL_ORDER)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ordinary_prediction_cells"],
      message: "Ordinary-prediction cells must preserve the frozen 2x2 factorial order.",
    });
  }
  if (
    JSON.stringify(fixture.joint_covariance_coordinate_order) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2I_COVARIANCE_ORDER)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["joint_covariance_coordinate_order"],
      message: "Joint covariance coordinates must preserve the frozen observed/ordinary complex order.",
    });
  }
  const wavepacketKeys = fixture.wavepacket_states.map(
    (state) => `${state.boundary_state}__${state.branch_state}`,
  );
  if (
    JSON.stringify(wavepacketKeys) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2I_CELL_ORDER)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["wavepacket_states"],
      message: "Wave-packet custody must preserve the frozen 2x2 factorial order.",
    });
  }
});

export type CasimirDpBoundaryBranchFixtureStage4_2I = z.infer<
  typeof CasimirDpBoundaryBranchFixtureStage4_2I
>;

export const CasimirDpBoundaryBranchInteractionStage4_2IConfig = z.object({
  schema_version: z.literal(
    CASIMIR_DP_BOUNDARY_BRANCH_STAGE4_2I_VERSION,
  ),
  study_id: z.literal("casimir-dp-quantum-foam-study-v1"),
  campaign_id: z.literal(
    "casimir-dp-boundary-branch-interaction-stage4-2i-v1",
  ),
  implementation_version: z.literal("stage4.2i-v1"),
  evidence_cutoff: z.string().datetime(),
  evidence_class: z.literal(
    "synthetic_interaction_diagnostic_and_wavepacket_contract_only",
  ),
  claim_ceiling: z.literal(
    "boundary_branch_nonfactorization_diagnostic_only",
  ),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  authority_manifest: z.object({
    path: z.literal(
      "configs/research/casimir-dp-stage4-2i-authorities.v1.json",
    ),
    sha256: Sha256,
  }).strict(),
  upstream_authorities: z.array(AuthorityTuple).length(6),
  method_authorities: z.array(AuthorityTuple).length(1),
  immutable_stage4_2h: z.object({
    campaign_run_id: z.literal(
      "casimir-dp-commissioning-intake-stage4-2h-v1-20260730T050000000Z",
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
      "configs/research/fixtures/casimir-dp-stage4-2i-factorial.synthetic.v1.json",
    ),
    sha256: Sha256,
  }).strict(),
  tolerances: z.object({
    minimum_coherence_magnitude: PositiveFinite,
    dp_boundary_exponent_absolute: NonnegativeFinite,
    branch_center_equivalence_m: NonnegativeFinite,
    packet_covariance_equivalence_m2: NonnegativeFinite,
    overlap_equivalence_absolute: NonnegativeFinite,
    hold_time_equivalence_s: NonnegativeFinite,
    momentum_equivalence_kg_m_s: NonnegativeFinite,
    projection_equivalence_absolute: NonnegativeFinite,
    covariance_symmetry_absolute: NonnegativeFinite,
    cholesky_positive_pivot: PositiveFinite,
    interaction_z_threshold: PositiveFinite,
  }).strict(),
  run_order: z.array(z.enum(CASIMIR_DP_STAGE4_2I_RUN_ORDER)).length(
    CASIMIR_DP_STAGE4_2I_RUN_ORDER.length,
  ),
  final_status_policy: z.object({
    software_contract: z.literal("pass"),
    synthetic_recovery: z.literal("pass"),
    branch_control_empirical_authority: z.literal("not_ready"),
    wavepacket_custody_empirical_authority: z.literal("not_ready"),
    ordinary_interaction_model_empirical_authority: z.literal("not_ready"),
    measured_interaction_contrast: z.literal("not_ready"),
    transfer_kernel: z.literal("not_registered"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
}).strict().superRefine((config, context) => {
  if (
    JSON.stringify(config.run_order) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2I_RUN_ORDER)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["run_order"],
      message: "Stage-4.2I run order must preserve the frozen dependency order.",
    });
  }
});

export type CasimirDpBoundaryBranchInteractionStage4_2IConfig = z.infer<
  typeof CasimirDpBoundaryBranchInteractionStage4_2IConfig
>;
