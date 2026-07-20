import {
  isTheoryRuntimeReceiptV1,
  type TheoryRuntimeReceiptV1,
} from "./theory-runtime-receipt.v1";

export const NHM2_EXPERIMENT_READY_THEORY_CLOSURE_CONTRACT_VERSION =
  "nhm2_experiment_ready_theory_closure/v1" as const;

export const NHM2_EXPERIMENT_READY_THEORY_CLOSURE_STATUS_VALUES = [
  "not_ready",
  "falsified",
  "experiment_ready_theory_closed",
] as const;

export const NHM2_EXPERIMENT_READY_THEORY_CLOSURE_GATE_STATUS_VALUES = [
  "pass",
  "blocked",
  "fail",
] as const;

export const NHM2_EXPERIMENT_READY_THEORY_CLOSURE_GATE_IDS = [
  "runtime_reproducibility",
  "same_chart_full_source_tensor",
  "semiclassical_state_realizability",
  "covariant_conservation",
  "continuous_observer_optimization",
  "worldline_qei_coverage",
  "dynamic_backreaction_stability_causality",
  "finite_temperature_finite_geometry_material_model",
  "mechanical_control_energy_margin",
  "independent_numerical_formal_replication",
  "prediction_falsifier_freeze",
] as const;

export const NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_IDS = [
  "full_apparatus_source_tensor",
  "semiclassical_state",
  "covariant_conservation",
  "continuous_observer_optimizer",
  "worldline_qei",
  "dynamic_backreaction_stability_causality",
  "finite_temperature_finite_geometry_maxwell_stress",
  "mechanical_support_control_margin",
  "independent_numerical_replication",
  "formal_manifest_certificate",
  "prediction_falsifier_freeze",
] as const;

export const NHM2_EXPERIMENT_READY_THEORY_CLOSURE_ASSURANCE_VALUES = [
  "computed",
  "independent_computation",
  "formal_proof",
  "frozen_prediction",
] as const;

export const NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS = {
  full_apparatus_source_tensor: "nhm2_full_apparatus_source_tensor/v1",
  semiclassical_state: "nhm2_semiclassical_state_realizability/v1",
  covariant_conservation: "nhm2_covariant_conservation/v1",
  continuous_observer_optimizer: "nhm2_continuous_observer_optimizer/v1",
  worldline_qei: "nhm2_worldline_qei_coverage/v1",
  dynamic_backreaction_stability_causality:
    "nhm2_dynamic_backreaction_stability_causality/v1",
  finite_temperature_finite_geometry_maxwell_stress:
    "casimir_finite_temperature_finite_geometry_maxwell_stress/v1",
  mechanical_support_control_margin:
    "nhm2_mechanical_support_control_margin/v1",
  independent_numerical_replication:
    "nhm2_independent_numerical_replication/v1",
  formal_manifest_certificate: "nhm2_formal_manifest_certificate/v2",
  prediction_falsifier_freeze: "nhm2_prediction_falsifier_freeze/v1",
} as const satisfies Record<Nhm2ExperimentReadyTheoryClosureEvidenceId, string>;

export type Nhm2ExperimentReadyTheoryClosureStatus =
  (typeof NHM2_EXPERIMENT_READY_THEORY_CLOSURE_STATUS_VALUES)[number];
export type Nhm2ExperimentReadyTheoryClosureGateStatus =
  (typeof NHM2_EXPERIMENT_READY_THEORY_CLOSURE_GATE_STATUS_VALUES)[number];
export type Nhm2ExperimentReadyTheoryClosureGateId =
  (typeof NHM2_EXPERIMENT_READY_THEORY_CLOSURE_GATE_IDS)[number];
export type Nhm2ExperimentReadyTheoryClosureEvidenceId =
  (typeof NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_IDS)[number];
export type Nhm2ExperimentReadyTheoryClosureAssurance =
  (typeof NHM2_EXPERIMENT_READY_THEORY_CLOSURE_ASSURANCE_VALUES)[number];

/**
 * Archived v1 check vocabulary. These identifiers are retained only so the
 * superseded self-authored v1 certificate can still be parsed for historical
 * diagnostics. They are not closure-authoritative and cannot satisfy the v2
 * formal evidence role.
 */
export const NHM2_EXPERIMENT_READY_THEORY_CLOSURE_LEGACY_FORMAL_V1_CHECK_IDS = [
  "candidate_manifest_merkle_root_pinned",
  "source_artifact_hashes_recomputed",
  "theorem_scope_matches_candidate_contract",
  "independent_kernel_replay_pass",
  "no_unscoped_assumption_booleans",
  "physical_transport_propulsion_claim_locks_proved",
] as const;

/** Exact outer-observation v2 authority vocabulary. */
export const NHM2_EXPERIMENT_READY_THEORY_CLOSURE_FORMAL_V2_CHECK_IDS = [
  "outer_artifact_observation_exact",
  "trusted_candidate_and_plan_bindings_exact",
  "direct_lean_command_exact",
  "two_distinct_cold_replays_exact",
  "native_theorem_and_axiom_transcripts_exact",
  "sealed_source_toolchain_input_ledgers_stable",
  "replay_transcripts_and_outputs_identical",
  "fresh_output_inventory_exact",
  "pre_experimental_claim_locks_closed",
] as const;

/**
 * These checks are deliberately named and fail closed. A file name, artifact
 * presence, caller-supplied gate status, or generic `pass` flag cannot satisfy
 * a theory-closure gate.
 */
export const NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS = {
  full_apparatus_source_tensor: [
    "all_ten_components_computed",
    "all_apparatus_terms_included",
    "same_chart_basis_units_normalization",
    "atlas_masks_and_sample_counts_bound",
    "source_side_constitutive_derivation",
    "metric_target_echo_excluded_by_provenance_dag",
    "nondegenerate_metric_signal_above_numerical_floor",
    "independent_metric_route_and_grid_convergence",
    "uncertainty_aware_absolute_relative_residuals_pass",
    "raw_tensor_arrays_published",
    "source_tensor_coupled_to_evolution",
  ],
  semiclassical_state: [
    "field_model_and_state_construction_explicit",
    "hadamard_or_equivalent_state_admissible",
    "renormalization_scheme_counterterms_fixed",
    "renormalized_expectation_value_constructed",
    "ward_identity_pass",
    "boundary_switching_preparation_compatible",
    "qei_applicability_bound_to_same_state",
    "rset_uncertainty_budget_bounded",
  ],
  covariant_conservation: [
    "local_covariant_divergence_all_four_components_computed",
    "spacetime_switching_transition_terms_included",
    "supports_controls_and_boundary_flux_included",
    "discrete_global_balance_pass",
    "time_resolved_cycle_energy_ledger_closed",
    "residual_within_frozen_uncertainty_tolerance",
    "spatial_temporal_convergence_observed",
  ],
  continuous_observer_optimizer: [
    "unit_timelike_hyperboloid_continuously_optimized",
    "every_admitted_spatial_sample_covered",
    "observer_spatial_sample_count_meets_frozen_minimum",
    "null_direction_manifold_covered",
    "null_direction_sample_count_meets_frozen_minimum",
    "wec_nec_sec_dec_extrema_recorded",
    "optimizer_convergence_and_globality_evidence",
    "observer_resolution_convergence_meets_frozen_minimum",
    "adversarial_initializations_replayed",
    "contradictory_observer_evidence_resolved",
  ],
  worldline_qei: [
    "explicit_timelike_worldlines_published",
    "qei_sampling_family_count_meets_frozen_minimum",
    "qei_worldlines_per_region_family_meet_frozen_minimum",
    "qei_worldline_sample_count_meets_frozen_minimum",
    "four_velocity_normalization_verified",
    "acceleration_and_curvature_invariants_computed",
    "renormalized_tmunu_uu_samples_integrated",
    "sampling_function_normalized",
    "applicable_theorem_bound_computed",
    "quadrature_and_interpolation_error_bounded",
    "qei_worldline_convergence_meets_frozen_minimum",
    "tau_duty_light_crossing_modulation_consistent",
    "hull_wall_exterior_worldlines_covered",
    "all_margins_pass_with_uncertainty",
  ],
  dynamic_backreaction_stability_causality: [
    "candidate_initial_data_and_source_coupled",
    "positive_timestep_duration_and_multiple_samples",
    "dynamics_sample_count_meets_frozen_minimum",
    "normalized_positive_time_horizon_meets_frozen_minimum",
    "dynamic_nontriviality_verified",
    "bssn_constraints_propagate_within_tolerance",
    "resolution_boundary_and_frequency_convergence_observed",
    "semiclassical_backreaction_residual_bounded",
    "horizon_and_characteristic_screen_pass",
    "ray_blueshift_and_particle_accumulation_bounded",
    "perturbation_growth_spectrum_bounded",
    "global_hyperbolicity_ctc_and_geodesic_screen_pass",
    "parameter_neighborhood_robustness_pass",
  ],
  finite_temperature_finite_geometry_maxwell_stress: [
    "finite_temperature_lifshitz_terms_computed",
    "finite_geometry_maxwell_stress_field_computed",
    "real_dielectric_response_data_pinned",
    "kramers_kronig_drude_plasma_sensitivity_bounded",
    "nonlocal_response_at_target_gap_dispositioned",
    "cad_mesh_support_anchor_geometry_pinned",
    "matsubara_frequency_and_mesh_convergence_observed",
    "force_gap_and_gradient_fields_published",
    "roughness_patch_temperature_uncertainty_bounded",
    "analytic_limits_and_independent_solver_crosscheck_pass",
    "ideal_parallel_plate_scalar_not_used_as_authority",
  ],
  mechanical_support_control_margin: [
    "force_gradient_imported_from_realistic_solver",
    "coupled_nonlinear_fea_completed",
    "support_retention_overlap_lower95_gt_one",
    "pull_in_buckling_contact_stiction_margins_positive",
    "stress_thermal_fatigue_modal_margins_positive",
    "fabrication_tolerance_envelope_pass",
    "active_control_energy_noise_heat_timing_bounded",
    "periodic_cycle_energy_balance_closed",
    "mechanical_control_stress_energy_returned_to_source_tensor",
  ],
  independent_numerical_replication: [
    "independent_cold_run_completed",
    "independent_solver_and_implementation_used",
    "frozen_inputs_mesh_environment_replayed",
    "field_level_outputs_agree_within_frozen_tolerances",
    "discrepancies_and_uncertainties_dispositioned",
    "commits_containers_toolchains_seeds_pinned",
  ],
  formal_manifest_certificate:
    NHM2_EXPERIMENT_READY_THEORY_CLOSURE_FORMAL_V2_CHECK_IDS,
  prediction_falsifier_freeze: [
    "complete_parameter_vector_or_priors_frozen",
    "observable_distributions_frozen",
    "sign_phase_scaling_predictions_frozen",
    "uncertainty_likelihood_test_statistic_frozen",
    "null_controls_blinding_and_dummy_plan_frozen",
    "decision_thresholds_and_multiplicity_frozen",
    "falsifiers_and_retirement_rules_frozen",
    "analysis_code_and_environment_hashes_pinned",
    "immutable_supersession_policy_declared",
  ],
} as const satisfies Record<
  Nhm2ExperimentReadyTheoryClosureEvidenceId,
  readonly string[]
>;

/** Numeric checks cannot be promoted from a Boolean alone. */
export const NHM2_EXPERIMENT_READY_THEORY_CLOSURE_NUMERIC_CHECK_POLICIES = {
  nondegenerate_metric_signal_above_numerical_floor: "gt",
  independent_metric_route_and_grid_convergence: "lte",
  uncertainty_aware_absolute_relative_residuals_pass: "lte",
  ward_identity_pass: "lte",
  rset_uncertainty_budget_bounded: "lte",
  discrete_global_balance_pass: "lte",
  time_resolved_cycle_energy_ledger_closed: "lte",
  residual_within_frozen_uncertainty_tolerance: "lte",
  spatial_temporal_convergence_observed: "gte",
  every_admitted_spatial_sample_covered: "gte",
  optimizer_convergence_and_globality_evidence: "lte",
  four_velocity_normalization_verified: "lte",
  sampling_function_normalized: "lte",
  quadrature_and_interpolation_error_bounded: "lte",
  all_margins_pass_with_uncertainty: "gte",
  positive_timestep_duration_and_multiple_samples: "gt",
  bssn_constraints_propagate_within_tolerance: "lte",
  resolution_boundary_and_frequency_convergence_observed: "gte",
  semiclassical_backreaction_residual_bounded: "lte",
  ray_blueshift_and_particle_accumulation_bounded: "lte",
  perturbation_growth_spectrum_bounded: "lte",
  parameter_neighborhood_robustness_pass: "gte",
  matsubara_frequency_and_mesh_convergence_observed: "gte",
  roughness_patch_temperature_uncertainty_bounded: "lte",
  analytic_limits_and_independent_solver_crosscheck_pass: "lte",
  support_retention_overlap_lower95_gt_one: "gt",
  pull_in_buckling_contact_stiction_margins_positive: "gt",
  stress_thermal_fatigue_modal_margins_positive: "gt",
  fabrication_tolerance_envelope_pass: "gte",
  active_control_energy_noise_heat_timing_bounded: "lte",
  periodic_cycle_energy_balance_closed: "lte",
  field_level_outputs_agree_within_frozen_tolerances: "lte",
} as const satisfies Record<string, "lt" | "lte" | "gt" | "gte">;

const GATE_EVIDENCE: Record<
  Exclude<Nhm2ExperimentReadyTheoryClosureGateId, "runtime_reproducibility">,
  readonly Nhm2ExperimentReadyTheoryClosureEvidenceId[]
> = {
  same_chart_full_source_tensor: ["full_apparatus_source_tensor"],
  semiclassical_state_realizability: ["semiclassical_state"],
  covariant_conservation: ["covariant_conservation"],
  continuous_observer_optimization: ["continuous_observer_optimizer"],
  worldline_qei_coverage: ["worldline_qei"],
  dynamic_backreaction_stability_causality: [
    "dynamic_backreaction_stability_causality",
  ],
  finite_temperature_finite_geometry_material_model: [
    "finite_temperature_finite_geometry_maxwell_stress",
  ],
  mechanical_control_energy_margin: ["mechanical_support_control_margin"],
  independent_numerical_formal_replication: [
    "independent_numerical_replication",
    "formal_manifest_certificate",
  ],
  prediction_falsifier_freeze: ["prediction_falsifier_freeze"],
};

const EXPECTED_ASSURANCE: Record<
  Nhm2ExperimentReadyTheoryClosureEvidenceId,
  Nhm2ExperimentReadyTheoryClosureAssurance
> = {
  full_apparatus_source_tensor: "computed",
  semiclassical_state: "computed",
  covariant_conservation: "computed",
  continuous_observer_optimizer: "computed",
  worldline_qei: "computed",
  dynamic_backreaction_stability_causality: "computed",
  finite_temperature_finite_geometry_maxwell_stress: "computed",
  mechanical_support_control_margin: "computed",
  independent_numerical_replication: "independent_computation",
  formal_manifest_certificate: "formal_proof",
  prediction_falsifier_freeze: "frozen_prediction",
};

const NON_PRIMARY_RUN_EVIDENCE =
  new Set<Nhm2ExperimentReadyTheoryClosureEvidenceId>([
    "independent_numerical_replication",
    "formal_manifest_certificate",
  ]);

export type Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1 = {
  candidateId: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  primaryRunId: string;
  chartId: string;
  unitsRef: string;
  unitsSha256: string;
  normalizationRef: string;
  normalizationSha256: string;
  atlasPath: string;
  atlasSha256: string;
  candidateManifestPath: string;
  candidateManifestSha256: string;
  candidateManifestId: string;
  candidateManifestContractVersion: "nhm2_experiment_ready_theory_candidate_manifest/v1";
  numericPolicySetPath: string;
  numericPolicySetSha256: string;
  numericPolicySetSemanticSha256: string;
  primaryGitSha: string;
  primaryRequestId: string;
  primaryRuntimeId: string;
  primaryReceiptId: string;
  primaryReceiptPath: string;
  primaryReceiptSha256: string;
};

export type Nhm2ExperimentReadyTheoryClosureCheckResultV1 = {
  pass: boolean;
  method: string;
  evidenceRef: string;
  frozenPolicyId: string;
  policyManifestSha256: string;
  frozenPolicySha256: string;
  policySetSemanticSha256: string;
  metricValue: number | null;
  tolerance: number | null;
  units: string | null;
};

export type Nhm2ExperimentReadyTheoryClosureEvidenceV1 = {
  evidenceId: Nhm2ExperimentReadyTheoryClosureEvidenceId;
  artifactContractVersion: string;
  artifactPath: string;
  sha256: string;
  receiptId: string;
  receiptPath: string;
  receiptSha256: string;
  candidateId: string;
  candidateManifestSha256: string;
  runId: string;
  selectedProfileId: string;
  chartId: string;
  unitsRef: string;
  unitsSha256: string;
  normalizationRef: string;
  normalizationSha256: string;
  atlasSha256: string;
  gitSha: string;
  producerId: string;
  implementationId: string;
  independenceGroup: string;
  assurance: Nhm2ExperimentReadyTheoryClosureAssurance;
  schemaValidated: boolean;
  assertionOnly: boolean;
  proxy: boolean;
  metricEcho: boolean;
  verdict: "pass" | "fail";
  checks: Record<string, Nhm2ExperimentReadyTheoryClosureCheckResultV1>;
  blockers: string[];
};

export type Nhm2ExperimentReadyTheoryClosureGateV1 = {
  gateId: Nhm2ExperimentReadyTheoryClosureGateId;
  status: Nhm2ExperimentReadyTheoryClosureGateStatus;
  pass: boolean;
  evidenceIds: Nhm2ExperimentReadyTheoryClosureEvidenceId[];
  blockers: string[];
  failedCheckIds: string[];
};

export type Nhm2ExperimentReadyTheoryClosureArtifactV1 = {
  contractVersion: typeof NHM2_EXPERIMENT_READY_THEORY_CLOSURE_CONTRACT_VERSION;
  evaluationAuthority: "filesystem_replay_evaluator_required";
  generatedAt: string;
  candidate: Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1;
  runtimeReceipts: TheoryRuntimeReceiptV1[];
  evidence: Nhm2ExperimentReadyTheoryClosureEvidenceV1[];
  gates: Nhm2ExperimentReadyTheoryClosureGateV1[];
  status: Nhm2ExperimentReadyTheoryClosureStatus;
  verdictLabel:
    "NOT_READY" | "FALSIFIED" | "THEORY_CLOSED_EXPERIMENT_READY_CANDIDATE";
  summary: {
    experimentReadyTheoryClosed: boolean;
    filesystemVerificationRequired: true;
    passedGateCount: number;
    blockedGateIds: Nhm2ExperimentReadyTheoryClosureGateId[];
    failedGateIds: Nhm2ExperimentReadyTheoryClosureGateId[];
    requiredEvidenceCount: number;
    suppliedEvidenceCount: number;
    allEvidenceRunBoundFreshAndHashed: boolean;
    firstBlocker: string;
    empiricalStatus: "blocked_pending_empirical_receipts";
  };
  claimBoundary: {
    theoryClosureOnly: true;
    experimentReadyTheoryClosureClaimAllowed: false;
    theoryClosureIsNotPhysicalValidation: true;
    physicalViabilityStatus: "blocked_pending_empirical_receipts";
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
    historicalOrPreexistingArtifactsCannotQualify: true;
    assertionOnlyOrPresenceOnlyArtifactsCannotQualify: true;
    empiricalReceiptsRequiredForPhysicalPromotion: true;
  };
};

export type BuildNhm2ExperimentReadyTheoryClosureInput = {
  generatedAt?: string | null;
  candidate: Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1;
  runtimeReceipts?: TheoryRuntimeReceiptV1[] | null;
  evidence?: Nhm2ExperimentReadyTheoryClosureEvidenceV1[] | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));

const textValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);

const isGitSha = (value: unknown): value is string =>
  typeof value === "string" && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value);

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => textValue(value))
        .filter((value): value is string => value != null),
    ),
  );

const candidateIssues = (
  candidate: Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1,
): string[] =>
  unique([
    textValue(candidate.candidateId) == null ? "candidate_id_missing" : null,
    candidate.laneId !== "nhm2_shift_lapse" ? "candidate_lane_invalid" : null,
    textValue(candidate.selectedProfileId) == null
      ? "candidate_profile_id_missing"
      : null,
    textValue(candidate.primaryRunId) == null
      ? "candidate_primary_run_id_missing"
      : null,
    textValue(candidate.chartId) == null ? "candidate_chart_id_missing" : null,
    textValue(candidate.unitsRef) == null
      ? "candidate_units_ref_missing"
      : null,
    !isSha256(candidate.unitsSha256) ? "candidate_units_sha256_invalid" : null,
    textValue(candidate.normalizationRef) == null
      ? "candidate_normalization_ref_missing"
      : null,
    !isSha256(candidate.normalizationSha256)
      ? "candidate_normalization_sha256_invalid"
      : null,
    textValue(candidate.atlasPath) == null
      ? "candidate_atlas_path_missing"
      : null,
    !isSha256(candidate.atlasSha256) ? "candidate_atlas_sha256_invalid" : null,
    textValue(candidate.candidateManifestPath) == null
      ? "candidate_manifest_path_missing"
      : null,
    !isSha256(candidate.candidateManifestSha256)
      ? "candidate_manifest_sha256_invalid"
      : null,
    textValue(candidate.candidateManifestId) == null
      ? "candidate_manifest_id_missing"
      : null,
    candidate.candidateManifestContractVersion !==
    "nhm2_experiment_ready_theory_candidate_manifest/v1"
      ? "candidate_manifest_contract_version_invalid"
      : null,
    textValue(candidate.numericPolicySetPath) == null
      ? "candidate_numeric_policy_set_path_missing"
      : null,
    !isSha256(candidate.numericPolicySetSha256)
      ? "candidate_numeric_policy_set_sha256_invalid"
      : null,
    !isSha256(candidate.numericPolicySetSemanticSha256)
      ? "candidate_numeric_policy_set_semantic_sha256_invalid"
      : null,
    !isGitSha(candidate.primaryGitSha)
      ? "candidate_primary_git_sha_invalid"
      : null,
    textValue(candidate.primaryRequestId) == null
      ? "candidate_primary_request_id_missing"
      : null,
    textValue(candidate.primaryRuntimeId) == null
      ? "candidate_primary_runtime_id_missing"
      : null,
    textValue(candidate.primaryReceiptId) == null
      ? "candidate_primary_receipt_id_missing"
      : null,
    textValue(candidate.primaryReceiptPath) == null
      ? "candidate_primary_receipt_path_missing"
      : null,
    !isSha256(candidate.primaryReceiptSha256)
      ? "candidate_primary_receipt_sha256_invalid"
      : null,
  ]);

const receiptBindingValue = (
  receipt: TheoryRuntimeReceiptV1,
  keys: string[],
): string | null => {
  for (const key of keys) {
    const fromArgs = textValue(receipt.args[key]);
    if (fromArgs != null) return fromArgs;
    const fromScalars = textValue(receipt.outputs.scalars[key]);
    if (fromScalars != null) return fromScalars;
  }
  return null;
};

type ArtifactBinding = {
  receiptId: string;
  runId: string;
  gitSha: string;
  artifactPath: string;
  sha256: string;
};

const runtimeBindingIssues = (input: {
  receipt: TheoryRuntimeReceiptV1 | null;
  candidate: Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1;
  binding: ArtifactBinding;
}): string[] => {
  const { receipt, candidate, binding } = input;
  if (receipt == null) return [`runtime_receipt_missing:${binding.receiptId}`];
  if (!isTheoryRuntimeReceiptV1(receipt)) {
    return [`runtime_receipt_schema_invalid:${binding.receiptId}`];
  }
  const manifest = receipt.outputs.artifactManifest;
  const freshnessProof = manifest?.freshnessProof;
  const execution = receipt.execution;
  const entry = manifest?.entries.find(
    (candidateEntry) =>
      candidateEntry.path === binding.artifactPath &&
      candidateEntry.sha256.toLowerCase() === binding.sha256.toLowerCase(),
  );
  const startedAt = receipt.provenance.startedAt;
  const completedAt = receipt.provenance.completedAt;
  const computedDuration =
    startedAt != null && completedAt != null
      ? Date.parse(completedAt) - Date.parse(startedAt)
      : null;
  const beforeEntry = freshnessProof?.beforeEntries.find(
    (candidateEntry) => candidateEntry.path === binding.artifactPath,
  );
  const primaryReceipt = binding.receiptId === candidate.primaryReceiptId;
  return unique([
    receipt.receiptId !== binding.receiptId
      ? `runtime_receipt_id_mismatch:${binding.receiptId}`
      : null,
    receipt.status !== "completed"
      ? `runtime_receipt_not_completed:${binding.receiptId}`
      : null,
    textValue(receipt.command) == null
      ? `runtime_command_missing:${binding.receiptId}`
      : null,
    receipt.provenance.gitSha !== binding.gitSha
      ? `runtime_git_sha_mismatch:${binding.receiptId}`
      : null,
    primaryReceipt && receipt.runtimeId !== candidate.primaryRuntimeId
      ? `runtime_primary_runtime_id_mismatch:${binding.receiptId}`
      : null,
    startedAt == null ||
    completedAt == null ||
    receipt.provenance.durationMs == null
      ? `runtime_execution_interval_missing:${binding.receiptId}`
      : null,
    computedDuration != null &&
    receipt.provenance.durationMs !== computedDuration
      ? `runtime_duration_mismatch:${binding.receiptId}`
      : null,
    execution == null
      ? `runtime_execution_record_missing:${binding.receiptId}`
      : null,
    execution != null && execution.exitCode !== 0
      ? `runtime_exit_code_not_zero:${binding.receiptId}`
      : null,
    execution?.timedOut === true
      ? `runtime_execution_timed_out:${binding.receiptId}`
      : null,
    execution != null && execution.error != null
      ? `runtime_execution_error_present:${binding.receiptId}`
      : null,
    execution != null && execution.command !== receipt.command
      ? `runtime_execution_command_mismatch:${binding.receiptId}`
      : null,
    execution?.outputDirectoryBound !== true
      ? `runtime_output_directory_unbound:${binding.receiptId}`
      : null,
    manifest == null
      ? `runtime_artifact_manifest_missing:${binding.receiptId}`
      : null,
    manifest?.boundToExecution !== true
      ? `runtime_artifact_manifest_unbound:${binding.receiptId}`
      : null,
    freshnessProof == null
      ? `runtime_freshness_snapshot_proof_missing:${binding.receiptId}`
      : null,
    freshnessProof != null &&
    (textValue(freshnessProof.beforeCommitmentPath) == null ||
      !isSha256(freshnessProof.beforeCommitmentSha256))
      ? `runtime_pre_spawn_commitment_missing:${binding.receiptId}`
      : null,
    freshnessProof != null && freshnessProof.beforeEntries.length > 0
      ? `runtime_output_directory_not_exclusive:${binding.receiptId}`
      : null,
    freshnessProof != null &&
    startedAt != null &&
    Date.parse(freshnessProof.beforeCapturedAt) > Date.parse(startedAt)
      ? `runtime_before_snapshot_after_execution_started:${binding.receiptId}`
      : null,
    freshnessProof != null &&
    completedAt != null &&
    Date.parse(freshnessProof.afterCapturedAt) < Date.parse(completedAt)
      ? `runtime_after_snapshot_before_execution_completed:${binding.receiptId}`
      : null,
    !isSha256(manifest?.manifestSha256)
      ? `runtime_manifest_sha256_missing:${binding.receiptId}`
      : null,
    manifest?.gitSha !== binding.gitSha
      ? `runtime_manifest_git_sha_mismatch:${binding.receiptId}`
      : null,
    receiptBindingValue(receipt, ["requestId", "request_id"]) !==
    manifest?.requestId
      ? `runtime_manifest_request_id_unbound:${binding.receiptId}`
      : null,
    primaryReceipt && manifest?.requestId !== candidate.primaryRequestId
      ? `runtime_primary_request_id_mismatch:${binding.receiptId}`
      : null,
    manifest?.startedAt !== startedAt || manifest?.completedAt !== completedAt
      ? `runtime_manifest_interval_mismatch:${binding.receiptId}`
      : null,
    execution != null && manifest?.outputDirectory !== execution.outputDirectory
      ? `runtime_manifest_output_directory_mismatch:${binding.receiptId}`
      : null,
    receipt.outputs.gates.runtime_artifact_freshness !== "pass"
      ? `runtime_artifact_freshness_gate_not_pass:${binding.receiptId}`
      : null,
    receipt.outputs.missingSignals.length > 0
      ? `runtime_missing_signals_present:${binding.receiptId}`
      : null,
    receipt.claimBoundary.currentTier === "certified"
      ? `runtime_certified_tier_forbidden:${binding.receiptId}`
      : null,
    receipt.claimBoundary.promotionAllowed === true
      ? `runtime_promotion_authority_forbidden:${binding.receiptId}`
      : null,
    receiptBindingValue(receipt, ["candidateId", "candidate_id"]) !==
    candidate.candidateId
      ? `runtime_candidate_id_unbound:${binding.receiptId}`
      : null,
    receiptBindingValue(receipt, [
      "selectedProfileId",
      "selected_profile_id",
      "profileId",
    ]) !== candidate.selectedProfileId
      ? `runtime_profile_id_unbound:${binding.receiptId}`
      : null,
    receiptBindingValue(receipt, ["chartId", "chart_id"]) !== candidate.chartId
      ? `runtime_chart_id_unbound:${binding.receiptId}`
      : null,
    receiptBindingValue(receipt, ["runId", "run_id", "run-id"]) !==
    binding.runId
      ? `runtime_run_id_unbound:${binding.receiptId}`
      : null,
    receiptBindingValue(receipt, [
      "candidateManifestSha256",
      "candidate_manifest_sha256",
    ]) !== candidate.candidateManifestSha256
      ? `runtime_candidate_manifest_hash_unbound:${binding.receiptId}`
      : null,
    receiptBindingValue(receipt, ["atlasSha256", "atlas_sha256"]) !==
    candidate.atlasSha256
      ? `runtime_atlas_hash_unbound:${binding.receiptId}`
      : null,
    execution?.environment.THEORY_RUNTIME_RECEIPT_ID !== binding.receiptId
      ? `runtime_execution_receipt_id_unbound:${binding.receiptId}`
      : null,
    execution?.environment.THEORY_RUNTIME_ID !== receipt.runtimeId
      ? `runtime_execution_runtime_id_unbound:${binding.receiptId}`
      : null,
    execution?.environment.THEORY_RUNTIME_REQUEST_ID !== manifest?.requestId
      ? `runtime_execution_request_id_unbound:${binding.receiptId}`
      : null,
    execution?.environment.NHM2_RUN_ID !== binding.runId
      ? `runtime_execution_run_id_unbound:${binding.receiptId}`
      : null,
    execution?.environment.NHM2_CANDIDATE_ID !== candidate.candidateId
      ? `runtime_execution_candidate_id_unbound:${binding.receiptId}`
      : null,
    execution?.environment.NHM2_SELECTED_PROFILE_ID !==
    candidate.selectedProfileId
      ? `runtime_execution_profile_id_unbound:${binding.receiptId}`
      : null,
    execution?.environment.NHM2_CHART_ID !== candidate.chartId
      ? `runtime_execution_chart_id_unbound:${binding.receiptId}`
      : null,
    execution?.environment.NHM2_CANDIDATE_MANIFEST_SHA256 !==
    candidate.candidateManifestSha256
      ? `runtime_execution_candidate_manifest_hash_unbound:${binding.receiptId}`
      : null,
    execution?.environment.NHM2_ATLAS_SHA256 !== candidate.atlasSha256
      ? `runtime_execution_atlas_hash_unbound:${binding.receiptId}`
      : null,
    execution?.environment.NHM2_UNITS_SHA256 !== candidate.unitsSha256
      ? `runtime_execution_units_hash_unbound:${binding.receiptId}`
      : null,
    execution?.environment.NHM2_NORMALIZATION_SHA256 !==
    candidate.normalizationSha256
      ? `runtime_execution_normalization_hash_unbound:${binding.receiptId}`
      : null,
    entry == null
      ? `runtime_artifact_hash_binding_missing:${binding.artifactPath}`
      : null,
    entry != null && entry.freshness !== "new"
      ? `runtime_artifact_not_new:${binding.artifactPath}`
      : null,
    entry?.freshness === "new" && beforeEntry != null
      ? `runtime_new_artifact_present_in_before_snapshot:${binding.artifactPath}`
      : null,
    entry?.freshness === "changed" && beforeEntry == null
      ? `runtime_changed_artifact_missing_from_before_snapshot:${binding.artifactPath}`
      : null,
    entry?.freshness === "changed" &&
    beforeEntry != null &&
    beforeEntry.sha256 === entry.sha256 &&
    beforeEntry.sizeBytes === entry.sizeBytes
      ? `runtime_changed_artifact_unchanged_in_before_snapshot:${binding.artifactPath}`
      : null,
  ]);
};

const evidenceIdentityIssues = (input: {
  evidence: Nhm2ExperimentReadyTheoryClosureEvidenceV1;
  candidate: Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1;
  receiptById: Map<string, TheoryRuntimeReceiptV1>;
}): string[] => {
  const { evidence, candidate, receiptById } = input;
  const mustUsePrimaryRun = !NON_PRIMARY_RUN_EVIDENCE.has(evidence.evidenceId);
  return unique([
    textValue(evidence.artifactContractVersion) == null
      ? `${evidence.evidenceId}:artifact_contract_version_missing`
      : null,
    evidence.artifactContractVersion !==
    NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS[
      evidence.evidenceId
    ]
      ? `${evidence.evidenceId}:artifact_contract_version_mismatch`
      : null,
    textValue(evidence.artifactPath) == null
      ? `${evidence.evidenceId}:artifact_path_missing`
      : null,
    !isSha256(evidence.sha256) ? `${evidence.evidenceId}:sha256_invalid` : null,
    textValue(evidence.receiptPath) == null
      ? `${evidence.evidenceId}:receipt_path_missing`
      : null,
    !isSha256(evidence.receiptSha256)
      ? `${evidence.evidenceId}:receipt_sha256_invalid`
      : null,
    evidence.candidateId !== candidate.candidateId
      ? `${evidence.evidenceId}:candidate_id_mismatch`
      : null,
    evidence.candidateManifestSha256 !== candidate.candidateManifestSha256
      ? `${evidence.evidenceId}:candidate_manifest_hash_mismatch`
      : null,
    evidence.selectedProfileId !== candidate.selectedProfileId
      ? `${evidence.evidenceId}:profile_id_mismatch`
      : null,
    evidence.chartId !== candidate.chartId
      ? `${evidence.evidenceId}:chart_id_mismatch`
      : null,
    evidence.unitsRef !== candidate.unitsRef
      ? `${evidence.evidenceId}:units_ref_mismatch`
      : null,
    evidence.unitsSha256 !== candidate.unitsSha256
      ? `${evidence.evidenceId}:units_hash_mismatch`
      : null,
    evidence.normalizationRef !== candidate.normalizationRef
      ? `${evidence.evidenceId}:normalization_ref_mismatch`
      : null,
    evidence.normalizationSha256 !== candidate.normalizationSha256
      ? `${evidence.evidenceId}:normalization_hash_mismatch`
      : null,
    evidence.atlasSha256 !== candidate.atlasSha256
      ? `${evidence.evidenceId}:atlas_hash_mismatch`
      : null,
    mustUsePrimaryRun && evidence.runId !== candidate.primaryRunId
      ? `${evidence.evidenceId}:primary_run_id_mismatch`
      : null,
    mustUsePrimaryRun && evidence.receiptId !== candidate.primaryReceiptId
      ? `${evidence.evidenceId}:primary_receipt_id_mismatch`
      : null,
    mustUsePrimaryRun && evidence.receiptPath !== candidate.primaryReceiptPath
      ? `${evidence.evidenceId}:primary_receipt_path_mismatch`
      : null,
    mustUsePrimaryRun &&
    evidence.receiptSha256 !== candidate.primaryReceiptSha256
      ? `${evidence.evidenceId}:primary_receipt_hash_mismatch`
      : null,
    evidence.evidenceId === "independent_numerical_replication" &&
    evidence.runId === candidate.primaryRunId
      ? `${evidence.evidenceId}:independent_run_not_distinct`
      : null,
    !mustUsePrimaryRun && evidence.receiptPath === candidate.primaryReceiptPath
      ? `${evidence.evidenceId}:independent_receipt_path_not_distinct`
      : null,
    mustUsePrimaryRun && evidence.gitSha !== candidate.primaryGitSha
      ? `${evidence.evidenceId}:primary_git_sha_mismatch`
      : null,
    !isGitSha(evidence.gitSha)
      ? `${evidence.evidenceId}:git_sha_invalid`
      : null,
    textValue(evidence.producerId) == null
      ? `${evidence.evidenceId}:producer_id_missing`
      : null,
    textValue(evidence.implementationId) == null
      ? `${evidence.evidenceId}:implementation_id_missing`
      : null,
    textValue(evidence.independenceGroup) == null
      ? `${evidence.evidenceId}:independence_group_missing`
      : null,
    evidence.assurance !== EXPECTED_ASSURANCE[evidence.evidenceId]
      ? `${evidence.evidenceId}:assurance_mismatch`
      : null,
    evidence.schemaValidated !== true
      ? `${evidence.evidenceId}:schema_not_validated`
      : null,
    evidence.assertionOnly !== false
      ? `${evidence.evidenceId}:assertion_only_evidence_forbidden`
      : null,
    evidence.proxy !== false
      ? `${evidence.evidenceId}:proxy_evidence_forbidden`
      : null,
    evidence.metricEcho !== false
      ? `${evidence.evidenceId}:metric_echo_forbidden`
      : null,
    ...runtimeBindingIssues({
      receipt: receiptById.get(evidence.receiptId) ?? null,
      candidate,
      binding: {
        receiptId: evidence.receiptId,
        runId: evidence.runId,
        gitSha: evidence.gitSha,
        artifactPath: evidence.artifactPath,
        sha256: evidence.sha256,
      },
    }).map((issue) => `${evidence.evidenceId}:${issue}`),
  ]);
};

const missingAndFailedChecks = (
  evidence: Nhm2ExperimentReadyTheoryClosureEvidenceV1,
  candidate: Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1,
): { missing: string[]; failed: string[] } => {
  const required = NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS[
    evidence.evidenceId
  ] as readonly string[];
  const missing: string[] = [];
  const failed: string[] = [];
  for (const checkId of required) {
    const check = evidence.checks[checkId];
    if (
      check == null ||
      textValue(check.method) == null ||
      textValue(check.evidenceRef) == null ||
      check.frozenPolicyId !== `${evidence.evidenceId}.${checkId}` ||
      check.policyManifestSha256 !== evidence.candidateManifestSha256 ||
      !isSha256(check.frozenPolicySha256) ||
      check.policySetSemanticSha256 !== candidate.numericPolicySetSemanticSha256
    ) {
      missing.push(checkId);
      continue;
    }
    const numericPolicy = (
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_NUMERIC_CHECK_POLICIES as Record<
        string,
        "lt" | "lte" | "gt" | "gte" | undefined
      >
    )[checkId];
    if (
      numericPolicy != null &&
      (check.metricValue == null ||
        check.tolerance == null ||
        textValue(check.units) == null)
    ) {
      missing.push(`${checkId}:numeric_metric_tolerance_or_units`);
      continue;
    }
    if (
      checkId === "support_retention_overlap_lower95_gt_one" &&
      (check.tolerance !== 1 || check.units !== "1")
    ) {
      missing.push(`${checkId}:frozen_threshold_or_units_mismatch`);
      continue;
    }
    const numericPass =
      numericPolicy == null
        ? true
        : numericPolicy === "lt"
          ? check.metricValue! < check.tolerance!
          : numericPolicy === "lte"
            ? check.metricValue! <= check.tolerance!
            : numericPolicy === "gt"
              ? check.metricValue! > check.tolerance!
              : check.metricValue! >= check.tolerance!;
    if (check.pass !== true || !numericPass) {
      failed.push(checkId);
    }
  }
  return { missing, failed };
};

const gate = (input: {
  gateId: Nhm2ExperimentReadyTheoryClosureGateId;
  status: Nhm2ExperimentReadyTheoryClosureGateStatus;
  evidenceIds?: readonly Nhm2ExperimentReadyTheoryClosureEvidenceId[];
  blockers?: string[];
  failedCheckIds?: string[];
}): Nhm2ExperimentReadyTheoryClosureGateV1 => ({
  gateId: input.gateId,
  status: input.status,
  pass: input.status === "pass",
  evidenceIds: [...(input.evidenceIds ?? [])],
  blockers: unique(input.blockers ?? []),
  failedCheckIds: unique(input.failedCheckIds ?? []),
});

const buildDomainGate = (input: {
  gateId: Exclude<
    Nhm2ExperimentReadyTheoryClosureGateId,
    "runtime_reproducibility"
  >;
  candidate: Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1;
  evidenceById: Map<
    Nhm2ExperimentReadyTheoryClosureEvidenceId,
    Nhm2ExperimentReadyTheoryClosureEvidenceV1
  >;
  receiptById: Map<string, TheoryRuntimeReceiptV1>;
}): Nhm2ExperimentReadyTheoryClosureGateV1 => {
  const evidenceIds = GATE_EVIDENCE[input.gateId];
  const missingEvidence = evidenceIds.filter(
    (evidenceId) => !input.evidenceById.has(evidenceId),
  );
  if (missingEvidence.length > 0) {
    return gate({
      gateId: input.gateId,
      status: "blocked",
      evidenceIds,
      blockers: missingEvidence.map(
        (evidenceId) => `${evidenceId}:evidence_missing`,
      ),
    });
  }

  const identityBlockers: string[] = [];
  const domainBlockers: string[] = [];
  const failedCheckIds: string[] = [];
  let explicitFailure = false;
  for (const evidenceId of evidenceIds) {
    const evidence = input.evidenceById.get(evidenceId)!;
    identityBlockers.push(
      ...evidenceIdentityIssues({
        evidence,
        candidate: input.candidate,
        receiptById: input.receiptById,
      }),
    );
    const checks = missingAndFailedChecks(evidence, input.candidate);
    domainBlockers.push(
      ...checks.missing.map(
        (checkId) => `${evidenceId}:required_check_missing:${checkId}`,
      ),
      ...evidence.blockers.map((blocker) => `${evidenceId}:${blocker}`),
    );
    if (evidenceId === "formal_manifest_certificate") {
      // A failed or malformed formal replay is an unavailable certificate, not
      // a physical falsification of the candidate. Only a filesystem-rebuilt
      // v2 pass can contribute formal authority.
      domainBlockers.push(
        ...checks.failed.map(
          (checkId) => `${evidenceId}:formal_replay_not_ready:${checkId}`,
        ),
        ...(evidence.verdict === "fail"
          ? [`${evidenceId}:formal_replay_not_ready`]
          : []),
      );
    } else {
      failedCheckIds.push(
        ...checks.failed.map((checkId) => `${evidenceId}:${checkId}`),
      );
      explicitFailure ||= evidence.verdict === "fail";
    }
  }

  // Unbound or invalid evidence is not authoritative enough to falsify a model.
  if (identityBlockers.length > 0) {
    return gate({
      gateId: input.gateId,
      status: "blocked",
      evidenceIds,
      blockers: [...identityBlockers, ...domainBlockers],
      failedCheckIds,
    });
  }
  if (explicitFailure || failedCheckIds.length > 0) {
    return gate({
      gateId: input.gateId,
      status: "fail",
      evidenceIds,
      blockers: domainBlockers,
      failedCheckIds,
    });
  }
  if (domainBlockers.length > 0) {
    return gate({
      gateId: input.gateId,
      status: "blocked",
      evidenceIds,
      blockers: domainBlockers,
    });
  }
  return gate({ gateId: input.gateId, status: "pass", evidenceIds });
};

const addIndependenceBlockers = (input: {
  gate: Nhm2ExperimentReadyTheoryClosureGateV1;
  evidenceById: Map<
    Nhm2ExperimentReadyTheoryClosureEvidenceId,
    Nhm2ExperimentReadyTheoryClosureEvidenceV1
  >;
}): Nhm2ExperimentReadyTheoryClosureGateV1 => {
  if (input.gate.status !== "pass") return input.gate;
  const primary = input.evidenceById.get("full_apparatus_source_tensor");
  const independent = input.evidenceById.get(
    "independent_numerical_replication",
  );
  const formal = input.evidenceById.get("formal_manifest_certificate");
  const blockers = unique([
    primary == null ? "full_apparatus_source_tensor:evidence_missing" : null,
    primary != null && independent?.receiptId === primary.receiptId
      ? "independent_replication_receipt_not_distinct"
      : null,
    primary != null &&
    independent?.implementationId === primary.implementationId
      ? "independent_replication_implementation_not_distinct"
      : null,
    primary != null &&
    independent?.independenceGroup === primary.independenceGroup
      ? "independent_replication_group_not_distinct"
      : null,
    formal != null &&
    (formal.receiptId === primary?.receiptId ||
      formal.receiptId === independent?.receiptId)
      ? "formal_kernel_receipt_not_distinct"
      : null,
    formal != null &&
    (formal.independenceGroup === primary?.independenceGroup ||
      formal.independenceGroup === independent?.independenceGroup)
      ? "formal_kernel_independence_group_not_distinct"
      : null,
  ]);
  return blockers.length === 0
    ? input.gate
    : gate({
        gateId: input.gate.gateId,
        status: "blocked",
        evidenceIds: input.gate.evidenceIds,
        blockers,
      });
};

const runtimeGate = (input: {
  candidate: Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1;
  receipts: TheoryRuntimeReceiptV1[];
  evidence: Nhm2ExperimentReadyTheoryClosureEvidenceV1[];
  evidenceById: Map<
    Nhm2ExperimentReadyTheoryClosureEvidenceId,
    Nhm2ExperimentReadyTheoryClosureEvidenceV1
  >;
  receiptById: Map<string, TheoryRuntimeReceiptV1>;
}): Nhm2ExperimentReadyTheoryClosureGateV1 => {
  const duplicateEvidenceIds = input.evidence
    .map((entry) => entry.evidenceId)
    .filter((evidenceId, index, all) => all.indexOf(evidenceId) !== index);
  const duplicateReceiptIds = input.receipts
    .map((entry) => entry.receiptId)
    .filter((receiptId, index, all) => all.indexOf(receiptId) !== index);
  const missingEvidenceIds =
    NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_IDS.filter(
      (evidenceId) => !input.evidenceById.has(evidenceId),
    );
  const blockers = unique([
    ...candidateIssues(input.candidate),
    ...duplicateEvidenceIds.map(
      (evidenceId) => `duplicate_evidence_id:${evidenceId}`,
    ),
    ...duplicateReceiptIds.map(
      (receiptId) => `duplicate_runtime_receipt_id:${receiptId}`,
    ),
    ...missingEvidenceIds.map((evidenceId) => `${evidenceId}:evidence_missing`),
    ...input.evidence.flatMap((evidence) =>
      evidenceIdentityIssues({
        evidence,
        candidate: input.candidate,
        receiptById: input.receiptById,
      }),
    ),
  ]);
  return gate({
    gateId: "runtime_reproducibility",
    status: blockers.length === 0 ? "pass" : "blocked",
    evidenceIds: [...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_IDS],
    blockers,
  });
};

const sortEvidence = (
  evidence: Nhm2ExperimentReadyTheoryClosureEvidenceV1[],
): Nhm2ExperimentReadyTheoryClosureEvidenceV1[] =>
  [...evidence].sort(
    (left, right) =>
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_IDS.indexOf(
        left.evidenceId,
      ) -
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_IDS.indexOf(
        right.evidenceId,
      ),
  );

export const buildNhm2ExperimentReadyTheoryClosure = (
  input: BuildNhm2ExperimentReadyTheoryClosureInput,
): Nhm2ExperimentReadyTheoryClosureArtifactV1 => {
  const runtimeReceipts = [...(input.runtimeReceipts ?? [])].sort(
    (left, right) => left.receiptId.localeCompare(right.receiptId),
  );
  const evidence = sortEvidence(input.evidence ?? []);
  const receiptById = new Map(
    runtimeReceipts.map((receipt) => [receipt.receiptId, receipt]),
  );
  const evidenceById = new Map(
    evidence.map((entry) => [entry.evidenceId, entry]),
  );
  const gates: Nhm2ExperimentReadyTheoryClosureGateV1[] = [
    runtimeGate({
      candidate: input.candidate,
      receipts: runtimeReceipts,
      evidence,
      evidenceById,
      receiptById,
    }),
    ...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_GATE_IDS.filter(
      (
        gateId,
      ): gateId is Exclude<
        Nhm2ExperimentReadyTheoryClosureGateId,
        "runtime_reproducibility"
      > => gateId !== "runtime_reproducibility",
    ).map((gateId) =>
      buildDomainGate({
        gateId,
        candidate: input.candidate,
        evidenceById,
        receiptById,
      }),
    ),
  ];
  const replicationIndex = gates.findIndex(
    (entry) => entry.gateId === "independent_numerical_formal_replication",
  );
  gates[replicationIndex] = addIndependenceBlockers({
    gate: gates[replicationIndex],
    evidenceById,
  });

  const failedGateIds = gates
    .filter((entry) => entry.status === "fail")
    .map((entry) => entry.gateId);
  const blockedGateIds = gates
    .filter((entry) => entry.status === "blocked")
    .map((entry) => entry.gateId);
  // This builder validates the structural envelope only. It deliberately has
  // no filesystem, raw-byte, process, Git-object, or evidence-adapter
  // authority, so it can never emit a promoted or falsified verdict. The
  // filesystem replay evaluator derives the terminal theory result after
  // independently replaying every bound receipt and evidence artifact.
  const status: Nhm2ExperimentReadyTheoryClosureStatus = "not_ready";
  const firstNonPass = gates.find((entry) => entry.status !== "pass");
  const experimentReadyTheoryClosed = false;

  return {
    contractVersion: NHM2_EXPERIMENT_READY_THEORY_CLOSURE_CONTRACT_VERSION,
    evaluationAuthority: "filesystem_replay_evaluator_required",
    generatedAt: textValue(input.generatedAt) ?? new Date(0).toISOString(),
    candidate: input.candidate,
    runtimeReceipts,
    evidence,
    gates,
    status,
    verdictLabel: "NOT_READY",
    summary: {
      experimentReadyTheoryClosed,
      filesystemVerificationRequired: true,
      passedGateCount: gates.filter((entry) => entry.status === "pass").length,
      blockedGateIds,
      failedGateIds,
      requiredEvidenceCount:
        NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_IDS.length,
      suppliedEvidenceCount: evidence.length,
      allEvidenceRunBoundFreshAndHashed:
        gates.find((entry) => entry.gateId === "runtime_reproducibility")
          ?.status === "pass",
      firstBlocker:
        firstNonPass?.blockers[0] ??
        firstNonPass?.failedCheckIds[0] ??
        firstNonPass?.gateId ??
        "filesystem_replay_evaluation_required",
      empiricalStatus: "blocked_pending_empirical_receipts",
    },
    claimBoundary: {
      theoryClosureOnly: true,
      experimentReadyTheoryClosureClaimAllowed: false,
      theoryClosureIsNotPhysicalValidation: true,
      physicalViabilityStatus: "blocked_pending_empirical_receipts",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
      historicalOrPreexistingArtifactsCannotQualify: true,
      assertionOnlyOrPresenceOnlyArtifactsCannotQualify: true,
      empiricalReceiptsRequiredForPhysicalPromotion: true,
    },
  };
};

const isCheckResult = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryClosureCheckResultV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    hasOnlyKeys(record, [
      "pass",
      "method",
      "evidenceRef",
      "frozenPolicyId",
      "policyManifestSha256",
      "frozenPolicySha256",
      "policySetSemanticSha256",
      "metricValue",
      "tolerance",
      "units",
    ]) &&
    typeof record.pass === "boolean" &&
    textValue(record.method) != null &&
    textValue(record.evidenceRef) != null &&
    textValue(record.frozenPolicyId) != null &&
    isSha256(record.policyManifestSha256) &&
    isSha256(record.frozenPolicySha256) &&
    isSha256(record.policySetSemanticSha256) &&
    (record.metricValue === null ||
      (typeof record.metricValue === "number" &&
        Number.isFinite(record.metricValue))) &&
    (record.tolerance === null ||
      (typeof record.tolerance === "number" &&
        Number.isFinite(record.tolerance))) &&
    (record.units === null || textValue(record.units) != null)
  );
};

const isEvidence = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryClosureEvidenceV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    hasOnlyKeys(record, [
      "evidenceId",
      "artifactContractVersion",
      "artifactPath",
      "sha256",
      "receiptId",
      "receiptPath",
      "receiptSha256",
      "candidateId",
      "candidateManifestSha256",
      "runId",
      "selectedProfileId",
      "chartId",
      "unitsRef",
      "unitsSha256",
      "normalizationRef",
      "normalizationSha256",
      "atlasSha256",
      "gitSha",
      "producerId",
      "implementationId",
      "independenceGroup",
      "assurance",
      "schemaValidated",
      "assertionOnly",
      "proxy",
      "metricEcho",
      "verdict",
      "checks",
      "blockers",
    ]) &&
    NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_IDS.includes(
      record.evidenceId as Nhm2ExperimentReadyTheoryClosureEvidenceId,
    ) &&
    textValue(record.artifactContractVersion) != null &&
    textValue(record.artifactPath) != null &&
    isSha256(record.sha256) &&
    textValue(record.receiptId) != null &&
    textValue(record.receiptPath) != null &&
    isSha256(record.receiptSha256) &&
    textValue(record.candidateId) != null &&
    isSha256(record.candidateManifestSha256) &&
    textValue(record.runId) != null &&
    textValue(record.selectedProfileId) != null &&
    textValue(record.chartId) != null &&
    textValue(record.unitsRef) != null &&
    isSha256(record.unitsSha256) &&
    textValue(record.normalizationRef) != null &&
    isSha256(record.normalizationSha256) &&
    isSha256(record.atlasSha256) &&
    isGitSha(record.gitSha) &&
    textValue(record.producerId) != null &&
    textValue(record.implementationId) != null &&
    textValue(record.independenceGroup) != null &&
    NHM2_EXPERIMENT_READY_THEORY_CLOSURE_ASSURANCE_VALUES.includes(
      record.assurance as Nhm2ExperimentReadyTheoryClosureAssurance,
    ) &&
    typeof record.schemaValidated === "boolean" &&
    typeof record.assertionOnly === "boolean" &&
    typeof record.proxy === "boolean" &&
    typeof record.metricEcho === "boolean" &&
    (record.verdict === "pass" || record.verdict === "fail") &&
    isRecord(record.checks) &&
    Object.values(record.checks).every(isCheckResult) &&
    Array.isArray(record.blockers) &&
    record.blockers.every((entry) => typeof entry === "string")
  );
};

const isCandidate = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    hasOnlyKeys(record, [
      "candidateId",
      "laneId",
      "selectedProfileId",
      "primaryRunId",
      "chartId",
      "unitsRef",
      "unitsSha256",
      "normalizationRef",
      "normalizationSha256",
      "atlasPath",
      "atlasSha256",
      "candidateManifestPath",
      "candidateManifestSha256",
      "candidateManifestId",
      "candidateManifestContractVersion",
      "numericPolicySetPath",
      "numericPolicySetSha256",
      "numericPolicySetSemanticSha256",
      "primaryGitSha",
      "primaryRequestId",
      "primaryRuntimeId",
      "primaryReceiptId",
      "primaryReceiptPath",
      "primaryReceiptSha256",
    ]) &&
    record.laneId === "nhm2_shift_lapse" &&
    textValue(record.candidateId) != null &&
    textValue(record.selectedProfileId) != null &&
    textValue(record.primaryRunId) != null &&
    textValue(record.chartId) != null &&
    textValue(record.unitsRef) != null &&
    isSha256(record.unitsSha256) &&
    textValue(record.normalizationRef) != null &&
    isSha256(record.normalizationSha256) &&
    textValue(record.atlasPath) != null &&
    isSha256(record.atlasSha256) &&
    textValue(record.candidateManifestPath) != null &&
    isSha256(record.candidateManifestSha256) &&
    textValue(record.candidateManifestId) != null &&
    record.candidateManifestContractVersion ===
      "nhm2_experiment_ready_theory_candidate_manifest/v1" &&
    textValue(record.numericPolicySetPath) != null &&
    isSha256(record.numericPolicySetSha256) &&
    isSha256(record.numericPolicySetSemanticSha256) &&
    isGitSha(record.primaryGitSha) &&
    textValue(record.primaryRequestId) != null &&
    textValue(record.primaryRuntimeId) != null &&
    textValue(record.primaryReceiptId) != null &&
    textValue(record.primaryReceiptPath) != null &&
    isSha256(record.primaryReceiptSha256)
  );
};

export const isNhm2ExperimentReadyTheoryClosureArtifact = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryClosureArtifactV1 => {
  const record = isRecord(value) ? value : null;
  if (
    record == null ||
    !hasOnlyKeys(record, [
      "contractVersion",
      "evaluationAuthority",
      "generatedAt",
      "candidate",
      "runtimeReceipts",
      "evidence",
      "gates",
      "status",
      "verdictLabel",
      "summary",
      "claimBoundary",
    ]) ||
    record.contractVersion !==
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_CONTRACT_VERSION ||
    record.evaluationAuthority !== "filesystem_replay_evaluator_required" ||
    !isIsoTimestamp(record.generatedAt) ||
    !isCandidate(record.candidate) ||
    !Array.isArray(record.runtimeReceipts) ||
    !record.runtimeReceipts.every(isTheoryRuntimeReceiptV1) ||
    !Array.isArray(record.evidence) ||
    !record.evidence.every(isEvidence)
  ) {
    return false;
  }
  const rebuilt = buildNhm2ExperimentReadyTheoryClosure({
    generatedAt: record.generatedAt,
    candidate: record.candidate,
    runtimeReceipts: record.runtimeReceipts,
    evidence: record.evidence,
  });
  return (
    JSON.stringify(record.gates) === JSON.stringify(rebuilt.gates) &&
    record.status === rebuilt.status &&
    record.verdictLabel === rebuilt.verdictLabel &&
    JSON.stringify(record.summary) === JSON.stringify(rebuilt.summary) &&
    JSON.stringify(record.claimBoundary) ===
      JSON.stringify(rebuilt.claimBoundary)
  );
};
