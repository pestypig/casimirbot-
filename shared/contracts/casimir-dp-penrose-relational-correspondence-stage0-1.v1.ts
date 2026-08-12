import { z } from "zod";

export const CASIMIR_DP_PENROSE_RELATIONAL_CORRESPONDENCE_STAGE0_1_VERSION =
  "casimir_dp_penrose_relational_correspondence_stage0_1/1" as const;

const Finite = z.number().finite();
const PositiveFinite = Finite.positive();
const NonnegativeFinite = Finite.nonnegative();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Vec3 = z.tuple([Finite, Finite, Finite]);

const Source = z.object({
  source_id: z.string().min(1),
  citation: z.string().min(1),
  url: z.string().url(),
  supports: z.string().min(1),
  does_not_support: z.string().min(1),
}).strict();

const UpstreamAuthority = z.object({
  role: z.enum([
    "stage0_candidate_receipt_authority",
    "gaussian_energy_authority",
    "ordinary_worldline_authority",
  ]),
  path: z.string().min(1),
  sha256: Sha256,
}).strict();

const ClockLabels = z.object({
  preparation_s: NonnegativeFinite,
  hold_start_s: NonnegativeFinite,
  hold_end_s: PositiveFinite,
  recombination_s: PositiveFinite,
}).strict().superRefine((value, context) => {
  if (!(
    value.preparation_s <= value.hold_start_s &&
    value.hold_start_s < value.hold_end_s &&
    value.hold_end_s <= value.recombination_s
  )) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "clock labels must preserve preparation-hold-recombination order",
    });
  }
});

export const PenroseRelationalReferenceFrame = z.object({
  frame_id: z.string().min(1),
  reference_system_id: z.string().min(1),
  anchor_role: z.enum([
    "support_trap_and_plate_fiducials",
    "independent_apparatus_fiducials",
  ]),
  branch_blind: z.literal(true),
  anchor_ids: z.array(z.string().min(1)).min(4),
  origin_m: Vec3,
  x_axis_landmark_m: Vec3,
  y_axis_landmark_m: Vec3,
  z_axis_landmark_m: Vec3,
  clock_labels: ClockLabels,
  time_orientation: z.literal(1),
  domain_radius_m: PositiveFinite,
}).strict();

const ReferencePair = z.object({
  pair_id: z.string().min(1),
  branch_a: PenroseRelationalReferenceFrame,
  branch_b: PenroseRelationalReferenceFrame,
  branch_a_probe_center_coordinate_m: Vec3,
  branch_b_probe_center_coordinate_m: Vec3,
  expected_relational_separation_m: PositiveFinite,
}).strict();

const PhysicalAuthorityPacket = z.object({
  packet_id: z.string().min(1),
  status: z.literal("not_ready"),
  sha256: z.null(),
  missing_fields: z.array(z.string().min(1)).min(1),
}).strict();

export const CasimirDpPenroseRelationalCorrespondenceStage01Config = z.object({
  schema_version: z.literal(
    CASIMIR_DP_PENROSE_RELATIONAL_CORRESPONDENCE_STAGE0_1_VERSION,
  ),
  study_id: z.literal("casimir-dp-quantum-foam-study"),
  campaign_id: z.literal(
    "casimir-dp-penrose-relational-correspondence-stage0-1-v1",
  ),
  benchmark_id: z.literal(
    "operational_relational_landmarks_weak_field_v0",
  ),
  benchmark_version: z.literal("0.1.0"),
  canonical_generated_at: z.literal("2026-08-11T20:30:00.000Z"),
  maturity: z.literal("stage0_exploratory"),
  evidence_class: z.literal("synthetic_theory_correspondence_benchmark"),
  claim_ceiling: z.literal(
    "formal_synthetic_correspondence_recovery_only",
  ),
  physical_prediction_allowed: z.literal(false),
  collapse_dynamics_allowed: z.literal(false),
  model_comparison_admission: z.literal(false),
  sources: z.array(Source).min(5),
  upstream_authorities: z.array(UpstreamAuthority).length(3).superRefine(
    (rows, context) => {
      const roles = rows.map((row) => row.role);
      if (new Set(roles).size !== roles.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "upstream authority roles must be unique",
        });
      }
    },
  ),
  formal_definition: z.object({
    common_relational_base: z.literal(
      "B_lab=(tau,xi1,xi2,xi3)_within_registered_local_domain",
    ),
    branch_embeddings: z.literal(
      "X_A:B_lab_to_M_A_and_X_B:B_lab_to_M_B",
    ),
    correspondence: z.literal(
      "varphi_corr_A_to_B=X_B_after_X_A_inverse_on_X_A_of_B_lab",
    ),
    pullback_stress_difference: z.literal(
      "Delta_B_T=X_A_pullback_T_A-X_B_pullback_T_B",
    ),
    pullback_metric_difference: z.literal(
      "Delta_B_g=X_A_pullback_g_A-X_B_pullback_g_B",
    ),
    admissible_gauge_group: z.literal(
      "independent_branch_rigid_coordinate_relabelings_within_static_weak_field_fixture",
    ),
    covariance_rule: z.literal(
      "independent_rigid_coordinate_relabeling_fixture_preserves_relational_probe_centers",
    ),
    regularity_assumptions: z.array(z.enum([
      "common_topology_local_domain",
      "differentiable_one_to_one_maps",
      "nonzero_jacobian",
      "matched_time_orientation",
      "complete_declared_density_support",
    ])).length(5),
    nonuniqueness_policy: z.literal(
      "freeze_at_least_two_branch_blind_reference_sets_before_coherence_and_block_if_spread_exceeds_threshold",
    ),
    source_ids: z.array(z.string().min(1)).min(4),
    equation_ids: z.array(z.enum([
      "casimir_dp_penrose_relational_branch_state",
      "casimir_dp_penrose_relational_pullback_stress_difference",
      "casimir_dp_penrose_relational_pullback_metric_difference",
      "casimir_dp_penrose_correspondence_covariance_gate",
      "casimir_dp_penrose_correspondence_identity_swap_gate",
      "casimir_dp_penrose_newtonian_target_limit",
    ])).length(6),
  }).strict(),
  reference_contract: z.object({
    scope: z.literal("static_weak_field_laboratory_domain"),
    construction: z.literal(
      "branch_blind_apparatus_landmarks_local_affine_material_reference_proxy",
    ),
    event_pairing_rule: z.literal(
      "varphi_corr_A_to_B=X_B_after_X_A_inverse_on_X_A_of_B_lab",
    ),
    time_label: z.literal("registered_pulse_and_apparatus_clock_labels"),
    spatial_labels: z.literal(
      "origin_and_three_oriented_apparatus_fiducials",
    ),
    prohibit_probe_centered_alignment: z.literal(true),
    require_complete_density_support: z.literal(true),
    density_support_sigma: PositiveFinite,
    physical_authority_packets: z.array(PhysicalAuthorityPacket).min(5),
  }).strict(),
  primary_fixture: ReferencePair,
  alternate_reference_fixture: ReferencePair,
  weak_field_target: z.object({
    model_id: z.literal("gaussian_regularized_newtonian_E_G"),
    mass_kg: PositiveFinite,
    R0_m: PositiveFinite,
    formula: z.literal(
      "E_G=G*m^2*(1/(sqrt(pi)*R0)-erf(d/(2*R0))/d)",
    ),
    integration_upper_u: PositiveFinite,
    even_intervals: z.number().int().positive().refine(
      (value) => value % 2 === 0,
      "even_intervals must be even",
    ),
  }).strict(),
  common_context: z.object({
    branch_a_uniform_acceleration_m_s2: Vec3,
    branch_b_uniform_acceleration_m_s2: Vec3,
    branch_a_potential_offset_m2_s2: Finite,
    branch_b_potential_offset_m2_s2: Finite,
    boundary_policy: z.literal("fixed_branch_source_boundary_null"),
    proper_time_channel: z.literal("separate_signed_unitary_phase_control"),
  }).strict(),
  thresholds: z.object({
    frame_orthogonality_max: PositiveFinite,
    landmark_geometry_relative_max: PositiveFinite,
    map_roundtrip_m_max: PositiveFinite,
    jacobian_determinant_error_max: PositiveFinite,
    separation_relative_error_max: PositiveFinite,
    coordinate_relabel_residual_m_max: PositiveFinite,
    reference_choice_energy_relative_max: PositiveFinite,
    weak_field_E_G_relative_max: PositiveFinite,
    common_acceleration_null_max_m_s2: NonnegativeFinite,
    common_potential_null_max_m2_s2: NonnegativeFinite,
  }).strict(),
  output_policy: z.object({
    synthetic_gate_may_pass: z.literal(true),
    physical_correspondence_status: z.literal(
      "blocked_pending_same_apparatus_reference_receipts",
    ),
    stage0_candidate_first_failure_remains: z.literal(
      "PCT_BRANCH_CORRESPONDENCE_MISSING",
    ),
    invariant_functional_status: z.literal("not_supplied"),
    collapse_rate: z.null(),
    lifetime_distribution: z.null(),
    coherence_prediction: z.null(),
    casimir_modifier: z.null(),
    empirical_validation: z.literal(false),
  }).strict(),
}).strict();

export type PenroseRelationalReferenceFrame = z.infer<
  typeof PenroseRelationalReferenceFrame
>;

export type CasimirDpPenroseRelationalCorrespondenceStage01Config = z.infer<
  typeof CasimirDpPenroseRelationalCorrespondenceStage01Config
>;
