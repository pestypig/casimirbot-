export const NHM2_OBSERVER_AUDIT_ARTIFACT_ID = "nhm2_observer_audit";
export const NHM2_OBSERVER_AUDIT_SCHEMA_VERSION =
  "nhm2_observer_audit/v1";

export const NHM2_OBSERVER_AUDIT_STATUS_VALUES = [
  "pass",
  "fail",
  "review",
  "unavailable",
] as const;

export const NHM2_OBSERVER_AUDIT_COMPLETENESS_VALUES = [
  "complete",
  "incomplete",
] as const;

export const NHM2_OBSERVER_AUDIT_REASON_CODES = [
  "metric_tensor_missing",
  "tile_tensor_missing",
  "metric_audit_incomplete",
  "tile_audit_incomplete",
  "observer_condition_failed",
  "surrogate_model_limited",
] as const;

export const NHM2_OBSERVER_AUDIT_CONDITION_KEYS = [
  "nec",
  "wec",
  "sec",
  "dec",
] as const;

export const NHM2_OBSERVER_AUDIT_CONDITION_STATUS_VALUES = [
  "pass",
  "fail",
  "unavailable",
] as const;

export const NHM2_OBSERVER_AUDIT_FLUX_STATUS_VALUES = [
  "available",
  "assumed_zero",
  "unavailable",
] as const;

export const NHM2_OBSERVER_BLOCKING_ASSESSMENT_STATUS_VALUES = [
  "same_surface_violation_confirmed",
  "observer_contract_incomplete",
  "policy_review_only",
  "unknown",
] as const;

export const NHM2_OBSERVER_PROMOTION_BLOCKING_SURFACE_VALUES = [
  "metric_required",
  "tile_effective",
  "both",
  "none",
  "unknown",
] as const;

export const NHM2_OBSERVER_PROMOTION_BLOCKING_CONDITION_VALUES = [
  "wec",
  "nec",
  "dec",
  "sec",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_PRIMARY_BLOCKING_MODE_VALUES = [
  "eulerian_native",
  "robust_search_amplified",
  "robust_only",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_PRIMARY_DRIVER_AGREEMENT_VALUES = [
  "aligned",
  "diverged",
  "unknown",
] as const;

export const NHM2_OBSERVER_ROOT_CAUSE_CLASS_VALUES = [
  "negative_energy_density",
  "dec_downstream_of_negative_energy",
  "null_violation_independent",
  "strong_condition_independent",
  "mixed_independent",
  "unknown",
] as const;

export const NHM2_OBSERVER_BLOCKING_DEPENDENCY_STATUS_VALUES = [
  "primary_only",
  "dec_downstream_of_wec",
  "independent_cofailure",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_SHARED_ROOT_DRIVER_STATUS_VALUES = [
  "shared_root_driver_confirmed",
  "surface_specific_drivers",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_UPSTREAM_DRIVER_CLASS_VALUES = [
  "metric_t00_density",
  "tile_t00_density",
  "metric_energy_density_proxy",
  "tile_energy_density_proxy",
  "mixed_upstream",
  "unknown",
] as const;

export const NHM2_OBSERVER_UPSTREAM_DRIVER_DEPENDENCY_STATUS_VALUES = [
  "direct_same_surface_driver",
  "same_family_different_ref",
  "proxy_derived_driver",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_SHARED_UPSTREAM_DRIVER_STATUS_VALUES = [
  "shared_exact_ref",
  "shared_driver_class",
  "surface_specific_upstream_refs",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_WEC_PROPAGATION_STATUS_VALUES = [
  "shared_propagation_detected",
  "metric_only_propagation",
  "weak_cross_surface_propagation",
  "tile_proxy_independent",
  "unknown",
] as const;

export const NHM2_OBSERVER_REMEDIATION_SEQUENCE_STATUS_VALUES = [
  "shared_metric_first",
  "metric_then_tile_proxy",
  "tile_proxy_independent",
  "unknown",
] as const;

export const NHM2_OBSERVER_TILE_DIMINISHING_RETURN_STATUS_VALUES = [
  "productive",
  "likely_stop_territory",
  "unknown",
] as const;

export const NHM2_OBSERVER_METRIC_COMPLETENESS_STATUS_VALUES = [
  "complete",
  "incomplete_missing_inputs",
  "unknown",
] as const;

export const NHM2_OBSERVER_METRIC_COVERAGE_BLOCKER_STATUS_VALUES = [
  "consumer_drop",
  "publication_drop",
  "producer_not_emitted",
  "semantics_ambiguous",
  "unknown",
] as const;

export const NHM2_OBSERVER_METRIC_FIRST_MISSING_STAGE_VALUES = [
  "metric_tensor_emission",
  "observer_input_mapping",
  "observer_publication_mapping",
  "semantic_contract",
  "unknown",
] as const;

export const NHM2_OBSERVER_TILE_AUTHORITY_STATUS_VALUES = [
  "full_tensor_authority",
  "proxy_limited",
  "unknown",
] as const;

export const NHM2_OBSERVER_TILE_AUTHORITY_ROUTE_VALUES = [
  "metric_einstein_tensor_projection",
  "proxy_tile_brick",
  "unknown",
] as const;

export const NHM2_OBSERVER_TILE_COMPARABLE_LOCALIZATION_RESULT_VALUES = [
  "same_sign_confirmed",
  "proxy_artifact_suspected",
  "inconclusive",
] as const;

export const NHM2_OBSERVER_TILE_COMPARABLE_NEXT_PATCH_CLASS_VALUES = [
  "tile_physics_remediation_patch",
  "tile_surface_reconstitution_patch",
  "tile_cross_check_instrumentation_patch",
  "unknown",
] as const;

export const NHM2_OBSERVER_TILE_OBSERVER_COMPARABILITY_CLASSIFICATION_VALUES = [
  "proxy_artifact_confirmed",
  "same_surface_failure_confirmed",
  "inconclusive",
] as const;

export const NHM2_OBSERVER_TILE_OBSERVER_CONDITION_AUTHORITY_MODE_VALUES = [
  "legacy_proxy_published",
  "commensurate_reconstituted_authoritative",
  "unknown",
] as const;

export const NHM2_OBSERVER_LEAD_READINESS_WORKSTREAM_VALUES = [
  "observer_completeness_and_authority",
  "certificate_policy_readiness",
  "unknown",
] as const;

export const NHM2_OBSERVER_NEXT_TECHNICAL_ACTION_VALUES = [
  "emit_same_chart_metric_flux_and_shear_terms",
  "wire_existing_metric_inputs",
  "resolve_metric_tensor_semantics",
  "targeted_dec_physics_remediation",
  "extend_model_term_route",
  "research_basis_gap_review",
  "unknown",
] as const;

export const NHM2_OBSERVER_DEC_DOMINANT_VIOLATION_CLASS_VALUES = [
  "flux_dominance",
  "stress_dominance",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_DEC_RECOMMENDED_PATCH_CLASS_VALUES = [
  "physics_control_patch",
  "model_term_extension_patch",
  "no_admissible_candidate_yet",
] as const;

export const NHM2_OBSERVER_DEC_PHYSICS_SELECTION_DECISION_VALUES = [
  "apply_candidate",
  "hold_baseline",
] as const;

export const NHM2_OBSERVER_DEC_PHYSICS_SELECTION_PLATEAU_STATUS_VALUES = [
  "cross_zero_candidate_found",
  "best_margin_still_negative",
  "no_passing_candidate",
] as const;

export const NHM2_OBSERVER_DEC_PHYSICS_SELECTION_REASON_CODE_VALUES = [
  "selection_gate_pass",
  "best_margin_still_negative",
  "no_candidate_improves_dec",
  "candidate_violates_wec_non_regression",
  "candidate_violates_nec_non_regression",
  "candidate_breaks_emission_admission_stability",
  "candidate_breaks_semantic_admission_stability",
  "candidate_is_observer_domain_truncation",
  "candidate_evidence_non_comparable",
  "candidate_not_evaluated",
] as const;

export const NHM2_OBSERVER_DEC_PHYSICS_SWEEP_PHASE_VALUES = [
  "baseline",
  "coarse",
  "refine",
] as const;

export const NHM2_OBSERVER_DEC_PHYSICS_UNCERTAINTY_TAG_VALUES = [
  "direct_measurement",
  "inference",
  "open_assumption",
] as const;

export const NHM2_OBSERVER_DEC_RESIDUAL_ATTRIBUTION_STATUS_VALUES = [
  "available",
  "unavailable",
] as const;

export const NHM2_OBSERVER_DEC_RESIDUAL_PRIMARY_SURFACE_VALUES = [
  "metric",
  "tile_reconstituted",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_DEC_PHYSICS_RUNTIME_APPLICATION_STATUS_VALUES = [
  "not_attempted",
  "applied",
  "rolled_back",
] as const;

export const NHM2_OBSERVER_DEC_PHYSICS_RUNTIME_FAILURE_MODE_VALUES = [
  "none",
  "not_attempted",
  "runtime_apply_disabled",
  "regression_wec",
  "regression_nec",
  "insufficient_dec_lift",
  "non_comparable",
  "unknown",
] as const;

export const NHM2_OBSERVER_DEC_PHYSICS_CROSS_ZERO_METHOD_VALUES = [
  "bounded_sweep_margin_analysis",
] as const;

export const NHM2_OBSERVER_DEC_PHYSICS_CROSS_ZERO_INFERENCE_LABEL_VALUES = [
  "direct_measurement",
  "inference",
  "mixed",
] as const;

export const NHM2_OBSERVER_DEC_PHYSICS_ZERO_CROSS_FEASIBILITY_DECISION_VALUES = [
  "zero_cross_achieved",
  "zero_cross_not_achievable_within_bounds",
  "unknown",
] as const;

export const NHM2_OBSERVER_DEC_PHYSICS_ZERO_CROSS_REASON_CODE_VALUES = [
  "cross_zero_margin_non_negative",
  "best_margin_still_negative",
  "selection_gate_failed",
  "candidate_evidence_non_comparable",
  "candidate_violates_wec_non_regression",
  "candidate_violates_nec_non_regression",
  "candidate_not_evaluated",
  "unknown",
] as const;

export const NHM2_OBSERVER_RESEARCH_CLAIM_CONFIDENCE_LABEL_VALUES = [
  "established",
  "review",
  "emerging_preprint",
] as const;

export const NHM2_OBSERVER_METRIC_EMISSION_ADMISSION_STATUS_VALUES = [
  "admitted",
  "not_admitted",
  "unknown",
] as const;

export const NHM2_OBSERVER_METRIC_COMPONENT_ADMISSION_STATUS_VALUES = [
  "existing_internal_quantity_not_serialized",
  "derivable_same_chart_from_existing_state",
  "requires_new_model_term",
  "basis_or_semantics_ambiguous",
  "unknown",
] as const;

export const NHM2_OBSERVER_METRIC_PRODUCER_EVIDENCE_STATUS_VALUES = [
  "present_admitted",
  "present_but_not_admitted",
  "missing",
  "unknown",
] as const;

export const NHM2_OBSERVER_METRIC_PRODUCER_EMISSION_SHAPE_VALUES = [
  "diagonal_only",
  "full_tensor",
  "unknown",
] as const;

export const NHM2_OBSERVER_MODEL_TERM_SEMANTIC_DECISION_VALUES = [
  "admit",
  "do_not_admit",
  "unknown",
] as const;

export const NHM2_OBSERVER_MODEL_TERM_SEMANTIC_ADMISSION_VALUES = [
  "admitted",
  "experimental_not_admitted",
  "unknown",
] as const;

export const NHM2_OBSERVER_MODEL_TERM_ROUTE_ADMISSION_PROMOTION_BASIS_VALUES = [
  "producer_declared_admitted",
  "evidence_gate_promoted_full_einstein",
  "evidence_gate_not_satisfied",
  "unknown",
] as const;

export const NHM2_OBSERVER_MODEL_TERM_SEMANTIC_CHECK_STATUS_VALUES = [
  "pass",
  "fail",
  "unknown",
] as const;

export const NHM2_OBSERVER_MODEL_TERM_EINSTEIN_ROUTE_STATUS_VALUES = [
  "available",
  "missing",
  "unknown",
] as const;

export const NHM2_OBSERVER_MODEL_TERM_EINSTEIN_VALIDATION_CASE_VALUES = [
  "minkowski_zero_shift",
  "constant_shift_flat_space",
] as const;

export const NHM2_OBSERVER_MODEL_TERM_RESIDUAL_DIAGNOSIS_CLASS_VALUES = [
  "convention_mismatch",
  "projection_mismatch",
  "unit_factor_mismatch",
  "discretization_mismatch",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_MODEL_TERM_CLOSURE_PATH_VALUES = [
  "adm_complete",
  "full_einstein_tensor",
  "undecided",
] as const;

export const NHM2_OBSERVER_MODEL_TERM_CLOSURE_ROUTE_HINT_VALUES = [
  "adm_route_metadata",
  "einstein_route_metadata",
  "none",
] as const;

export const NHM2_OBSERVER_MODEL_TERM_CLOSURE_NEXT_PATCH_VALUES = [
  "adm_support_field_admission_patch",
  "einstein_semantic_closure_patch",
  "evidence_disambiguation_patch",
] as const;

export const NHM2_OBSERVER_MODEL_TERM_SEMANTIC_REASON_CODE_VALUES = [
  "route_metadata_missing_or_mismatched",
  "chart_not_comoving_cartesian",
  "non_finite_tensor_components",
  "t0i_symmetry_failed",
  "off_diagonal_symmetry_failed",
  "support_field_route_not_admitted",
  "full_einstein_tensor_route_not_admitted",
  "citation_basis_missing",
  "finite_difference_convergence_missing",
  "finite_difference_convergence_failed",
  "independent_cross_check_missing",
  "independent_cross_check_failed_threshold",
  "dt_gamma_assumption_unbounded",
  "citation_coverage_incomplete",
] as const;

export type Nhm2ObserverAuditStatus =
  (typeof NHM2_OBSERVER_AUDIT_STATUS_VALUES)[number];
export type Nhm2ObserverAuditCompleteness =
  (typeof NHM2_OBSERVER_AUDIT_COMPLETENESS_VALUES)[number];
export type Nhm2ObserverAuditReasonCode =
  (typeof NHM2_OBSERVER_AUDIT_REASON_CODES)[number];
export type Nhm2ObserverAuditConditionKey =
  (typeof NHM2_OBSERVER_AUDIT_CONDITION_KEYS)[number];
export type Nhm2ObserverAuditConditionStatus =
  (typeof NHM2_OBSERVER_AUDIT_CONDITION_STATUS_VALUES)[number];
export type Nhm2ObserverAuditFluxStatus =
  (typeof NHM2_OBSERVER_AUDIT_FLUX_STATUS_VALUES)[number];
export type Nhm2ObserverBlockingAssessmentStatus =
  (typeof NHM2_OBSERVER_BLOCKING_ASSESSMENT_STATUS_VALUES)[number];
export type Nhm2ObserverPromotionBlockingSurface =
  (typeof NHM2_OBSERVER_PROMOTION_BLOCKING_SURFACE_VALUES)[number];
export type Nhm2ObserverPromotionBlockingCondition =
  (typeof NHM2_OBSERVER_PROMOTION_BLOCKING_CONDITION_VALUES)[number];
export type Nhm2ObserverPrimaryBlockingMode =
  (typeof NHM2_OBSERVER_PRIMARY_BLOCKING_MODE_VALUES)[number];
export type Nhm2ObserverPrimaryDriverAgreement =
  (typeof NHM2_OBSERVER_PRIMARY_DRIVER_AGREEMENT_VALUES)[number];
export type Nhm2ObserverRootCauseClass =
  (typeof NHM2_OBSERVER_ROOT_CAUSE_CLASS_VALUES)[number];
export type Nhm2ObserverBlockingDependencyStatus =
  (typeof NHM2_OBSERVER_BLOCKING_DEPENDENCY_STATUS_VALUES)[number];
export type Nhm2ObserverSharedRootDriverStatus =
  (typeof NHM2_OBSERVER_SHARED_ROOT_DRIVER_STATUS_VALUES)[number];
export type Nhm2ObserverUpstreamDriverClass =
  (typeof NHM2_OBSERVER_UPSTREAM_DRIVER_CLASS_VALUES)[number];
export type Nhm2ObserverUpstreamDriverDependencyStatus =
  (typeof NHM2_OBSERVER_UPSTREAM_DRIVER_DEPENDENCY_STATUS_VALUES)[number];
export type Nhm2ObserverSharedUpstreamDriverStatus =
  (typeof NHM2_OBSERVER_SHARED_UPSTREAM_DRIVER_STATUS_VALUES)[number];
export type Nhm2ObserverWecPropagationStatus =
  (typeof NHM2_OBSERVER_WEC_PROPAGATION_STATUS_VALUES)[number];
export type Nhm2ObserverRemediationSequenceStatus =
  (typeof NHM2_OBSERVER_REMEDIATION_SEQUENCE_STATUS_VALUES)[number];
export type Nhm2ObserverTileDiminishingReturnStatus =
  (typeof NHM2_OBSERVER_TILE_DIMINISHING_RETURN_STATUS_VALUES)[number];
export type Nhm2ObserverMetricCompletenessStatus =
  (typeof NHM2_OBSERVER_METRIC_COMPLETENESS_STATUS_VALUES)[number];
export type Nhm2ObserverMetricCoverageBlockerStatus =
  (typeof NHM2_OBSERVER_METRIC_COVERAGE_BLOCKER_STATUS_VALUES)[number];
export type Nhm2ObserverMetricFirstMissingStage =
  (typeof NHM2_OBSERVER_METRIC_FIRST_MISSING_STAGE_VALUES)[number];
export type Nhm2ObserverTileAuthorityStatus =
  (typeof NHM2_OBSERVER_TILE_AUTHORITY_STATUS_VALUES)[number];
export type Nhm2ObserverTileAuthorityRoute =
  (typeof NHM2_OBSERVER_TILE_AUTHORITY_ROUTE_VALUES)[number];
export type Nhm2ObserverTileComparableLocalizationResult =
  (typeof NHM2_OBSERVER_TILE_COMPARABLE_LOCALIZATION_RESULT_VALUES)[number];
export type Nhm2ObserverTileComparableNextPatchClass =
  (typeof NHM2_OBSERVER_TILE_COMPARABLE_NEXT_PATCH_CLASS_VALUES)[number];
export type Nhm2ObserverTileObserverComparabilityClassification =
  (typeof NHM2_OBSERVER_TILE_OBSERVER_COMPARABILITY_CLASSIFICATION_VALUES)[number];
export type Nhm2ObserverTileObserverConditionAuthorityMode =
  (typeof NHM2_OBSERVER_TILE_OBSERVER_CONDITION_AUTHORITY_MODE_VALUES)[number];
export type Nhm2ObserverLeadReadinessWorkstream =
  (typeof NHM2_OBSERVER_LEAD_READINESS_WORKSTREAM_VALUES)[number];
export type Nhm2ObserverNextTechnicalAction =
  (typeof NHM2_OBSERVER_NEXT_TECHNICAL_ACTION_VALUES)[number];
export type Nhm2ObserverDecDominantViolationClass =
  (typeof NHM2_OBSERVER_DEC_DOMINANT_VIOLATION_CLASS_VALUES)[number];
export type Nhm2ObserverDecRecommendedPatchClass =
  (typeof NHM2_OBSERVER_DEC_RECOMMENDED_PATCH_CLASS_VALUES)[number];
export type Nhm2ObserverDecPhysicsSelectionDecision =
  (typeof NHM2_OBSERVER_DEC_PHYSICS_SELECTION_DECISION_VALUES)[number];
export type Nhm2ObserverDecPhysicsSelectionPlateauStatus =
  (typeof NHM2_OBSERVER_DEC_PHYSICS_SELECTION_PLATEAU_STATUS_VALUES)[number];
export type Nhm2ObserverDecPhysicsSelectionReasonCode =
  (typeof NHM2_OBSERVER_DEC_PHYSICS_SELECTION_REASON_CODE_VALUES)[number];
export type Nhm2ObserverDecPhysicsSweepPhase =
  (typeof NHM2_OBSERVER_DEC_PHYSICS_SWEEP_PHASE_VALUES)[number];
export type Nhm2ObserverDecPhysicsUncertaintyTag =
  (typeof NHM2_OBSERVER_DEC_PHYSICS_UNCERTAINTY_TAG_VALUES)[number];
export type Nhm2ObserverDecResidualAttributionStatus =
  (typeof NHM2_OBSERVER_DEC_RESIDUAL_ATTRIBUTION_STATUS_VALUES)[number];
export type Nhm2ObserverDecResidualPrimarySurface =
  (typeof NHM2_OBSERVER_DEC_RESIDUAL_PRIMARY_SURFACE_VALUES)[number];
export type Nhm2ObserverDecPhysicsRuntimeApplicationStatus =
  (typeof NHM2_OBSERVER_DEC_PHYSICS_RUNTIME_APPLICATION_STATUS_VALUES)[number];
export type Nhm2ObserverDecPhysicsRuntimeFailureMode =
  (typeof NHM2_OBSERVER_DEC_PHYSICS_RUNTIME_FAILURE_MODE_VALUES)[number];
export type Nhm2ObserverDecPhysicsCrossZeroMethod =
  (typeof NHM2_OBSERVER_DEC_PHYSICS_CROSS_ZERO_METHOD_VALUES)[number];
export type Nhm2ObserverDecPhysicsCrossZeroInferenceLabel =
  (typeof NHM2_OBSERVER_DEC_PHYSICS_CROSS_ZERO_INFERENCE_LABEL_VALUES)[number];
export type Nhm2ObserverDecPhysicsZeroCrossFeasibilityDecision =
  (typeof NHM2_OBSERVER_DEC_PHYSICS_ZERO_CROSS_FEASIBILITY_DECISION_VALUES)[number];
export type Nhm2ObserverDecPhysicsZeroCrossReasonCode =
  (typeof NHM2_OBSERVER_DEC_PHYSICS_ZERO_CROSS_REASON_CODE_VALUES)[number];
export type Nhm2ObserverResearchClaimConfidenceLabel =
  (typeof NHM2_OBSERVER_RESEARCH_CLAIM_CONFIDENCE_LABEL_VALUES)[number];
export type Nhm2ObserverMetricEmissionAdmissionStatus =
  (typeof NHM2_OBSERVER_METRIC_EMISSION_ADMISSION_STATUS_VALUES)[number];
export type Nhm2ObserverMetricComponentAdmissionStatus =
  (typeof NHM2_OBSERVER_METRIC_COMPONENT_ADMISSION_STATUS_VALUES)[number];
export type Nhm2ObserverMetricProducerEvidenceStatus =
  (typeof NHM2_OBSERVER_METRIC_PRODUCER_EVIDENCE_STATUS_VALUES)[number];
export type Nhm2ObserverMetricProducerEmissionShape =
  (typeof NHM2_OBSERVER_METRIC_PRODUCER_EMISSION_SHAPE_VALUES)[number];
export type Nhm2ObserverModelTermSemanticDecision =
  (typeof NHM2_OBSERVER_MODEL_TERM_SEMANTIC_DECISION_VALUES)[number];
export type Nhm2ObserverModelTermSemanticAdmission =
  (typeof NHM2_OBSERVER_MODEL_TERM_SEMANTIC_ADMISSION_VALUES)[number];
export type Nhm2ObserverModelTermRouteAdmissionPromotionBasis =
  (typeof NHM2_OBSERVER_MODEL_TERM_ROUTE_ADMISSION_PROMOTION_BASIS_VALUES)[number];
export type Nhm2ObserverModelTermSemanticCheckStatus =
  (typeof NHM2_OBSERVER_MODEL_TERM_SEMANTIC_CHECK_STATUS_VALUES)[number];
export type Nhm2ObserverModelTermEinsteinRouteStatus =
  (typeof NHM2_OBSERVER_MODEL_TERM_EINSTEIN_ROUTE_STATUS_VALUES)[number];
export type Nhm2ObserverModelTermEinsteinValidationCaseId =
  (typeof NHM2_OBSERVER_MODEL_TERM_EINSTEIN_VALIDATION_CASE_VALUES)[number];
export type Nhm2ObserverModelTermResidualDiagnosisClass =
  (typeof NHM2_OBSERVER_MODEL_TERM_RESIDUAL_DIAGNOSIS_CLASS_VALUES)[number];
export type Nhm2ObserverModelTermClosurePath =
  (typeof NHM2_OBSERVER_MODEL_TERM_CLOSURE_PATH_VALUES)[number];
export type Nhm2ObserverModelTermClosureRouteHint =
  (typeof NHM2_OBSERVER_MODEL_TERM_CLOSURE_ROUTE_HINT_VALUES)[number];
export type Nhm2ObserverModelTermClosureNextPatch =
  (typeof NHM2_OBSERVER_MODEL_TERM_CLOSURE_NEXT_PATCH_VALUES)[number];
export type Nhm2ObserverModelTermSemanticReasonCode =
  (typeof NHM2_OBSERVER_MODEL_TERM_SEMANTIC_REASON_CODE_VALUES)[number];

export type Nhm2ObserverAuditDirection = [number, number, number];

export type Nhm2ObserverAuditCondition = {
  status: Nhm2ObserverAuditConditionStatus;
  eulerianMin: number | null;
  eulerianMean: number | null;
  robustMin: number | null;
  robustMean: number | null;
  eulerianViolationFraction: number | null;
  robustViolationFraction: number | null;
  missedViolationFraction: number | null;
  severityGainMin: number | null;
  severityGainMean: number | null;
  maxRobustMinusEulerian: number | null;
  worstCase: {
    index: number | null;
    value: number | null;
    direction: Nhm2ObserverAuditDirection | null;
    rapidity: number | null;
    source: string | null;
  };
};

export type Nhm2ObserverAuditTensor = {
  tensorId: "metric_required" | "tile_effective";
  status: Nhm2ObserverAuditStatus;
  completeness: Nhm2ObserverAuditCompleteness;
  tensorRef: string | null;
  sampleCount: number | null;
  reasonCodes: Nhm2ObserverAuditReasonCode[];
  rapidityCap: number | null;
  rapidityCapBeta: number | null;
  typeI: {
    count: number | null;
    fraction: number | null;
    tolerance: number | null;
  };
  conditions: Record<
    Nhm2ObserverAuditConditionKey,
    Nhm2ObserverAuditCondition
  >;
  fluxDiagnostics: {
    status: Nhm2ObserverAuditFluxStatus;
    meanMagnitude: number | null;
    maxMagnitude: number | null;
    netMagnitude: number | null;
    netDirection: Nhm2ObserverAuditDirection | null;
    note: string | null;
  };
  consistency: {
    robustNotGreaterThanEulerian: boolean | null;
    maxRobustMinusEulerian: number | null;
  };
  model: {
    pressureModel: string | null;
    fluxHandling: string | null;
    shearHandling: string | null;
    limitationNotes: string[];
    note: string | null;
  };
  missingInputs: string[];
  primaryBlockingCondition: Nhm2ObserverPromotionBlockingCondition;
  primaryBlockingMode: Nhm2ObserverPrimaryBlockingMode;
  primaryBlockingValue: number | null;
  primaryBlockingReference: string | null;
  primaryBlockingWhy: string | null;
  rootCauseClass: Nhm2ObserverRootCauseClass;
  blockingDependencyStatus: Nhm2ObserverBlockingDependencyStatus;
  blockingDependencyNote: string | null;
  firstRemediationTarget: string | null;
  firstRemediationWhy: string | null;
  upstreamDriverRef: string | null;
  upstreamDriverClass: Nhm2ObserverUpstreamDriverClass;
  upstreamDriverDependencyStatus: Nhm2ObserverUpstreamDriverDependencyStatus;
  upstreamDriverNote: string | null;
  firstUpstreamRemediationTarget: string | null;
  firstUpstreamRemediationWhy: string | null;
  wecProbeApplied: boolean;
  wecProbeScale: number | null;
  wecProbeBaseline: number | null;
  wecProbeResult: number | null;
  wecProbeDelta: number | null;
  decProbeBaseline: number | null;
  decProbeResult: number | null;
  decProbeDelta: number | null;
  wecProbeInterpretation: string | null;
};

export type Nhm2ObserverMetricProducerAdmissionEvidence = {
  semanticsRef: string | null;
  chartRef: string | null;
  producerModuleRef: string[];
  currentEmissionShape: Nhm2ObserverMetricProducerEmissionShape;
  currentOutputFamilies: string[];
  supportFieldEvidence: {
    alpha: Nhm2ObserverMetricProducerEvidenceStatus;
    beta_i: Nhm2ObserverMetricProducerEvidenceStatus;
    gamma_ij: Nhm2ObserverMetricProducerEvidenceStatus;
    K_ij: Nhm2ObserverMetricProducerEvidenceStatus;
    D_j_Kj_i_minus_D_i_K_route: Nhm2ObserverMetricProducerEvidenceStatus;
    time_derivative_or_Kij_evolution_route: Nhm2ObserverMetricProducerEvidenceStatus;
    full_einstein_tensor_route: Nhm2ObserverMetricProducerEvidenceStatus;
  };
  t0iAdmissionBranch: Nhm2ObserverMetricComponentAdmissionStatus;
  offDiagonalTijAdmissionBranch: Nhm2ObserverMetricComponentAdmissionStatus;
  nextInspectionTarget: string | null;
  notes: string[];
};

export type Nhm2ObserverModelTermEinsteinEvaluatorClosureEvidence = {
  status: Nhm2ObserverModelTermEinsteinRouteStatus;
  chartRef: string | null;
  routeId: string | null;
  unitConvention: string | null;
  signConvention: string | null;
  resolutionSweep: {
    coarse: {
      step_m: number | null;
      comparedSampleCount: number | null;
      t0iMaxRelativeResidual: number | null;
      offDiagonalMaxRelativeResidual: number | null;
    };
    refined: {
      step_m: number | null;
      comparedSampleCount: number | null;
      t0iMaxRelativeResidual: number | null;
      offDiagonalMaxRelativeResidual: number | null;
    };
    superRefined: {
      step_m: number | null;
      comparedSampleCount: number | null;
      t0iMaxRelativeResidual: number | null;
      offDiagonalMaxRelativeResidual: number | null;
    };
  };
  observedConvergenceOrder: {
    t0i: number | null;
    offDiagonal: number | null;
  };
  richardsonExtrapolatedResidual: {
    t0i: number | null;
    offDiagonal: number | null;
  };
  conventionSweep: Array<{
    candidateId: string;
    status: Nhm2ObserverModelTermEinsteinRouteStatus;
    maxRelativeResidual: number | null;
    note: string | null;
  }>;
  bestCandidateId: string | null;
  diagnosisClass: Nhm2ObserverModelTermResidualDiagnosisClass;
  note: string | null;
  citationRefs: string[];
};

export type Nhm2ObserverModelTermEinsteinRouteValidationSuite = {
  status: Nhm2ObserverModelTermSemanticCheckStatus;
  admittedForRoutePass: boolean;
  residualThreshold: number | null;
  evaluatedCaseCount: number;
  passedCaseCount: number;
  cases: Array<{
    caseId: Nhm2ObserverModelTermEinsteinValidationCaseId;
    status: Nhm2ObserverModelTermSemanticCheckStatus;
    maxAbsResidual: number | null;
    expectedNearZero: boolean;
    note: string | null;
    citationRefs: string[];
  }>;
  note: string | null;
  citationRefs: string[];
};

export type Nhm2ObserverModelTermClosurePathDecision = {
  selectedPath: Nhm2ObserverModelTermClosurePath;
  admPathStatus: Nhm2ObserverModelTermSemanticCheckStatus;
  fullEinsteinPathStatus: Nhm2ObserverModelTermSemanticCheckStatus;
  routeHint: Nhm2ObserverModelTermClosureRouteHint;
  nextPatchClass: Nhm2ObserverModelTermClosureNextPatch;
  patchBriefRef: string | null;
  rationale: string | null;
  blockerCodes: Nhm2ObserverModelTermSemanticReasonCode[];
  nonBlockingCodes?: Nhm2ObserverModelTermSemanticReasonCode[];
  citationRefs: string[];
  notes: string[];
};

export type Nhm2ObserverModelTermSemanticAdmissionEvidence = {
  semanticsRef: string | null;
  researchBasisRef: string | null;
  chartRef: string | null;
  routeId: string | null;
  routeAdmissionRaw: Nhm2ObserverModelTermSemanticAdmission;
  routeAdmissionEffective: Nhm2ObserverModelTermSemanticAdmission;
  routeAdmissionPromotionBasis: Nhm2ObserverModelTermRouteAdmissionPromotionBasis;
  routeAdmission: Nhm2ObserverModelTermSemanticAdmission;
  decision: Nhm2ObserverModelTermSemanticDecision;
  reasonCodes: Nhm2ObserverModelTermSemanticReasonCode[];
  checks: {
    routeMetadata: Nhm2ObserverModelTermSemanticCheckStatus;
    chart: Nhm2ObserverModelTermSemanticCheckStatus;
    finiteTensorComponents: Nhm2ObserverModelTermSemanticCheckStatus;
    t0iSymmetry: Nhm2ObserverModelTermSemanticCheckStatus;
    offDiagonalTijSymmetry: Nhm2ObserverModelTermSemanticCheckStatus;
    supportFieldRouteAdmission: Nhm2ObserverModelTermSemanticCheckStatus;
    fullEinsteinTensorRouteAdmission: Nhm2ObserverModelTermSemanticCheckStatus;
    citationBasis: Nhm2ObserverModelTermSemanticCheckStatus;
    finiteDifferenceConvergence: Nhm2ObserverModelTermSemanticCheckStatus;
    independentCrossCheck: Nhm2ObserverModelTermSemanticCheckStatus;
    einsteinT00Comparability: Nhm2ObserverModelTermSemanticCheckStatus;
    dtGammaAssumptionBounded: Nhm2ObserverModelTermSemanticCheckStatus;
    citationCoverage: Nhm2ObserverModelTermSemanticCheckStatus;
  };
  einsteinTensorRouteEvidence?: {
    status: Nhm2ObserverModelTermEinsteinRouteStatus;
    routeId: string | null;
    tensorSource: string | null;
    comparedSampleCount: number | null;
    maxRelativeResidual: number | null;
    t00ComparedSampleCount?: number | null;
    t00MaxRelativeResidual?: number | null;
    t00RelativeResidualThreshold?: number | null;
    note: string | null;
  } | null;
  einsteinResidualAttributionEvidence?: {
    status: Nhm2ObserverModelTermEinsteinRouteStatus;
    sampleCount: number | null;
    maxRelativeResidual: number | null;
    componentResiduals: {
      T01: number | null;
      T02: number | null;
      T03: number | null;
      T12: number | null;
      T13: number | null;
      T23: number | null;
    };
    conventionSweep: Array<{
      candidateId: string;
      status: Nhm2ObserverModelTermEinsteinRouteStatus;
      maxRelativeResidual: number | null;
      note: string | null;
    }>;
    bestCandidateId: string | null;
    bestCandidateResidual: number | null;
    diagnosisClass: Nhm2ObserverModelTermResidualDiagnosisClass;
    note: string | null;
  } | null;
  einsteinEvaluatorClosureEvidence?:
    | Nhm2ObserverModelTermEinsteinEvaluatorClosureEvidence
    | null;
  einsteinRouteValidationSuite?:
    | Nhm2ObserverModelTermEinsteinRouteValidationSuite
    | null;
  closurePathDecision?: Nhm2ObserverModelTermClosurePathDecision | null;
  citationRefs: string[];
  notes: string[];
};

export type Nhm2ObserverDecRemediationEvidence = {
  chartRef: string | null;
  routeId: string | null;
  selectedPath: Nhm2ObserverModelTermClosurePath | null;
  rapidityCap: number | null;
  rapidityCapBeta: number | null;
  metricDecEulerianMin: number | null;
  metricDecRobustMin: number | null;
  tileReconstitutedDecEulerianMin: number | null;
  tileReconstitutedDecRobustMin: number | null;
  typeIFractionMetric: number | null;
  typeIFractionTileReconstituted: number | null;
  dominantViolationClass: Nhm2ObserverDecDominantViolationClass;
  recommendedPatchClass: Nhm2ObserverDecRecommendedPatchClass;
  citationRefs: string[];
  notes: string[];
};

export type Nhm2ObserverDecPhysicsControlKnobEvidence = {
  knobId: string;
  baselineValue: number | null;
  candidateValue: number | null;
  deltaValue: number | null;
  boundedDeltaMax: number | null;
  bounded: boolean;
  note: string | null;
};

export type Nhm2ObserverDecPhysicsRuntimeApplicationEvidence = {
  attempted: boolean;
  enabled: boolean;
  status: Nhm2ObserverDecPhysicsRuntimeApplicationStatus;
  failureMode: Nhm2ObserverDecPhysicsRuntimeFailureMode;
  evaluationComparable: boolean;
  sampleCount: number | null;
  comparableSampleCount: number | null;
  minimumComparableSampleCount: number | null;
  sampleCountSufficient: boolean | null;
  referenceRouteId: string | null;
  selectedRouteId: string | null;
  selectedPath: Nhm2ObserverModelTermClosurePath | null;
  candidateId: string | null;
  comparabilityGate: {
    chartRef: string | null;
    chartParity: boolean | null;
    selectedPathParity: boolean | null;
    independentCrossCheckStatus: Nhm2ObserverModelTermSemanticCheckStatus;
    pass: boolean;
    note: string | null;
  };
  rollbackReasonCodes: Nhm2ObserverDecPhysicsSelectionReasonCode[];
  guardChecks: {
    metricWecNonRegression: boolean | null;
    metricNecNonRegression: boolean | null;
    emissionAdmissionStable: boolean | null;
    semanticAdmissionStable: boolean | null;
    metricDecRobustLiftPositive: boolean | null;
    tileReconstitutedDecRobustLiftNonNegative: boolean | null;
  };
  observed: {
    metricDecRobustLift: number | null;
    tileReconstitutedDecRobustLift: number | null;
    metricWecRobustDelta: number | null;
    metricNecRobustDelta: number | null;
    metricDecRobustMarginToZero: number | null;
    tileReconstitutedDecRobustMarginToZero: number | null;
    metricWecNonRegressionMargin: number | null;
    metricNecNonRegressionMargin: number | null;
  };
  note: string | null;
  citationRefs: string[];
};

export type Nhm2ObserverClaimCitationEvidence = {
  claimId: string;
  claim: string;
  citationRefs: string[];
  note: string | null;
};

export type Nhm2ObserverResearchClaimEvidence = {
  claimId: string;
  claim: string;
  confidenceLabel: Nhm2ObserverResearchClaimConfidenceLabel;
  citationRefs: string[];
  note: string | null;
};

export type Nhm2ObserverDecCoupledControlEvidence = {
  status: "available" | "unavailable";
  controlFamiliesUsed: string[];
  boundedEnvelope: {
    pressureScaleMin: number | null;
    pressureScaleMax: number | null;
    densityLiftMin: number | null;
    densityLiftMax: number | null;
    fluxScaleMin: number | null;
    fluxScaleMax: number | null;
    shearScaleMin: number | null;
    shearScaleMax: number | null;
  };
  candidateEvaluationTable: Array<{
    candidateId: string;
    pressureScale: number | null;
    densityLiftFraction: number | null;
    fluxScale: number | null;
    shearScale: number | null;
    selectionObjectivePrimaryMargin: number | null;
    passesSelectionGate: boolean;
  }>;
  bestCandidateId: string | null;
  comparabilityGate: {
    pass: boolean;
    independentCrossCheckStatus: Nhm2ObserverModelTermSemanticCheckStatus;
    note: string | null;
  };
  researchClaims: Nhm2ObserverResearchClaimEvidence[];
  note: string | null;
};

export type Nhm2ObserverDecPhysicsControlSweepCandidate = {
  candidateId: string;
  candidateClass:
    | "baseline_hold"
    | "observer_domain_truncation"
    | "physics_control_proposal";
  sweepPhase: Nhm2ObserverDecPhysicsSweepPhase;
  refineSeedCandidateId: string | null;
  applied: boolean;
  rapidityCap: number | null;
  rapidityCapBeta: number | null;
  pressureScale: number | null;
  densityLiftFraction: number | null;
  fluxScale: number | null;
  shearScale: number | null;
  metricDecRobustMin: number | null;
  tileReconstitutedDecRobustMin: number | null;
  metricWecRobustMin: number | null;
  metricNecRobustMin: number | null;
  metricDecRobustLift: number | null;
  tileReconstitutedDecRobustLift: number | null;
  metricWecRobustDelta: number | null;
  metricNecRobustDelta: number | null;
  metricDecRobustMarginToZero: number | null;
  tileReconstitutedDecRobustMarginToZero: number | null;
  crossesZeroBothDecMargins: boolean | null;
  metricWecNonRegressionMargin: number | null;
  metricNecNonRegressionMargin: number | null;
  selectionObjectivePrimaryMargin: number | null;
  controlDeviationMagnitude: number | null;
  guardChecks: {
    metricWecNonRegression: boolean | null;
    metricNecNonRegression: boolean | null;
    emissionAdmissionStable: boolean | null;
    semanticAdmissionStable: boolean | null;
  };
  passesSelectionGate: boolean;
  gateFailureReasons: Nhm2ObserverDecPhysicsSelectionReasonCode[];
  note: string | null;
};

export type Nhm2ObserverDecPhysicsCrossZeroFeasibilityEvidence = {
  baselinePrimaryMargin: number | null;
  bestCandidatePrimaryMargin: number | null;
  requiredLiftToZero: number | null;
  achievedLiftFromBaseline: number | null;
  bestAchievedLift: number | null;
  residualMarginToZero: number | null;
  gapToZero: number | null;
  crossZeroAchieved: boolean | null;
  boundedControlEnvelope: {
    pressureScaleMin: number | null;
    pressureScaleMax: number | null;
    densityLiftMin: number | null;
    densityLiftMax: number | null;
    fluxScaleMin: number | null;
    fluxScaleMax: number | null;
    shearScaleMin: number | null;
    shearScaleMax: number | null;
  };
  evaluationRoute: {
    chartRef: string | null;
    routeId: string | null;
    selectedPath: Nhm2ObserverModelTermClosurePath | null;
    independentCrossCheckStatus: Nhm2ObserverModelTermSemanticCheckStatus;
    runtimeComparabilityPass: boolean | null;
  };
  method: Nhm2ObserverDecPhysicsCrossZeroMethod;
  inferenceLabel: Nhm2ObserverDecPhysicsCrossZeroInferenceLabel;
  citationRefs: string[];
  notes: string[];
};

export type Nhm2ObserverDecResidualAttributionEvidence = {
  status: Nhm2ObserverDecResidualAttributionStatus;
  primarySurface: Nhm2ObserverDecResidualPrimarySurface;
  dominantViolationClass: Nhm2ObserverDecDominantViolationClass;
  baselinePrimaryMargin: number | null;
  selectedPrimaryMargin: number | null;
  requiredLiftToZero: number | null;
  achievedLiftFromBaseline: number | null;
  residualMarginToZero: number | null;
  gapToZero: number | null;
  selectionPlateauStatus: Nhm2ObserverDecPhysicsSelectionPlateauStatus;
  selectionReasonCodes: Nhm2ObserverDecPhysicsSelectionReasonCode[];
  zeroCrossFeasibilityDecision: Nhm2ObserverDecPhysicsZeroCrossFeasibilityDecision;
  rankingBasis: string | null;
  selectedCandidate: {
    candidateId: string | null;
    candidateClass:
      | "baseline_hold"
      | "observer_domain_truncation"
      | "physics_control_proposal"
      | null;
    sweepPhase: Nhm2ObserverDecPhysicsSweepPhase | null;
    metricDecRobustMarginToZero: number | null;
    tileReconstitutedDecRobustMarginToZero: number | null;
    metricDecRobustLift: number | null;
    tileReconstitutedDecRobustLift: number | null;
    controlDeviationMagnitude: number | null;
  };
  citationRefs: string[];
  notes: string[];
};

export type Nhm2ObserverDecPhysicsControlEvidence = {
  chartRef: string | null;
  routeId: string | null;
  selectedPath: Nhm2ObserverModelTermClosurePath | null;
  baseline: {
    metricDecEulerianMin: number | null;
    metricDecRobustMin: number | null;
    metricWecEulerianMin: number | null;
    metricWecRobustMin: number | null;
    metricNecEulerianMin: number | null;
    metricNecRobustMin: number | null;
    tileReconstitutedDecEulerianMin: number | null;
    tileReconstitutedDecRobustMin: number | null;
    tileReconstitutedWecEulerianMin: number | null;
    tileReconstitutedWecRobustMin: number | null;
    tileReconstitutedNecEulerianMin: number | null;
    tileReconstitutedNecRobustMin: number | null;
  };
  candidate: {
    candidateId: string | null;
    applied: boolean;
    metricDecEulerianMin: number | null;
    metricDecRobustMin: number | null;
    metricWecEulerianMin: number | null;
    metricWecRobustMin: number | null;
    metricNecEulerianMin: number | null;
    metricNecRobustMin: number | null;
    tileReconstitutedDecEulerianMin: number | null;
    tileReconstitutedDecRobustMin: number | null;
    tileReconstitutedWecEulerianMin: number | null;
    tileReconstitutedWecRobustMin: number | null;
    tileReconstitutedNecEulerianMin: number | null;
    tileReconstitutedNecRobustMin: number | null;
  };
  deltas: {
    metricDecRobustLift: number | null;
    tileReconstitutedDecRobustLift: number | null;
    metricWecRobustDelta: number | null;
    metricNecRobustDelta: number | null;
  };
  guardChecks: {
    metricWecNonRegression: boolean | null;
    metricNecNonRegression: boolean | null;
    emissionAdmissionStable: boolean | null;
    semanticAdmissionStable: boolean | null;
  };
  sweepCandidates: Nhm2ObserverDecPhysicsControlSweepCandidate[];
  sweepPhaseSummary: {
    coarseCandidateCount: number | null;
    coarsePassingCount: number | null;
    refineCandidateCount: number | null;
    refinePassingCount: number | null;
    refineSeedCandidateIds: string[];
    note: string | null;
  };
  topCandidateLeaderboard: Array<{
    rank: number;
    candidateId: string;
    candidateClass:
      | "baseline_hold"
      | "observer_domain_truncation"
      | "physics_control_proposal";
    sweepPhase: Nhm2ObserverDecPhysicsSweepPhase;
    passesSelectionGate: boolean;
    crossesZeroBothDecMargins: boolean | null;
    selectionObjectivePrimaryMargin: number | null;
    metricDecRobustLift: number | null;
    tileReconstitutedDecRobustLift: number | null;
    controlDeviationMagnitude: number | null;
  }>;
  selectionObjective: string | null;
  selectedCandidateId: string | null;
  selectionDecision: Nhm2ObserverDecPhysicsSelectionDecision;
  selectionPlateauStatus: Nhm2ObserverDecPhysicsSelectionPlateauStatus;
  crossZeroFeasibilityEvidence: Nhm2ObserverDecPhysicsCrossZeroFeasibilityEvidence;
  decResidualAttributionEvidence?: Nhm2ObserverDecResidualAttributionEvidence;
  zeroCrossFeasibilityDecision?: Nhm2ObserverDecPhysicsZeroCrossFeasibilityDecision;
  zeroCrossFeasibilityReasonCodes?: Nhm2ObserverDecPhysicsZeroCrossReasonCode[];
  boundedSearchEnvelope?: {
    pressureScaleMin: number | null;
    pressureScaleMax: number | null;
    densityLiftMin: number | null;
    densityLiftMax: number | null;
    fluxScaleMin: number | null;
    fluxScaleMax: number | null;
    shearScaleMin: number | null;
    shearScaleMax: number | null;
    coarsePressureStep: number | null;
    coarseDensityLiftStep: number | null;
    coarseFluxScaleStep: number | null;
    coarseShearScaleStep: number | null;
    refinePressureStep: number | null;
    refineDensityLiftStep: number | null;
    refineFluxScaleStep: number | null;
    refineShearScaleStep: number | null;
    coarseCandidateCount: number | null;
    refineCandidateCount: number | null;
    refineSeedCount: number | null;
    observerDomainFixed: boolean;
  };
  selectionReasonCodes: Nhm2ObserverDecPhysicsSelectionReasonCode[];
  nonRegressionGate: {
    required: string[];
    pass: boolean;
    note: string | null;
  };
  runtimeApplication: Nhm2ObserverDecPhysicsRuntimeApplicationEvidence;
  controlKnobs: Nhm2ObserverDecPhysicsControlKnobEvidence[];
  claimCitationMap?: Nhm2ObserverClaimCitationEvidence[];
  claimCitationMapCompleteness?: {
    status: "pass" | "fail";
    expectedClaimCount: number;
    coveredClaimCount: number;
    expectedClaimIds: string[];
    missingClaimIds: string[];
    note: string | null;
  };
  decCoupledControlEvidence?: Nhm2ObserverDecCoupledControlEvidence;
  recommendation: Nhm2ObserverDecRecommendedPatchClass;
  uncertaintyTags: Nhm2ObserverDecPhysicsUncertaintyTag[];
  citationRefs: string[];
  derivationNotes: string[];
  uncertaintyNotes: string[];
};

export type Nhm2ObserverT00PolicyAdmissionBridgeEvidence = {
  status: Nhm2ObserverModelTermSemanticCheckStatus;
  routeId: string | null;
  chartRef: string | null;
  selectedPath: Nhm2ObserverModelTermClosurePath | null;
  routeAdmissionRaw: Nhm2ObserverModelTermSemanticAdmission;
  routeAdmissionEffective: Nhm2ObserverModelTermSemanticAdmission;
  routeAdmissionPromotionBasis: Nhm2ObserverModelTermRouteAdmissionPromotionBasis;
  checks: {
    fullEinsteinTensorRouteAdmission: Nhm2ObserverModelTermSemanticCheckStatus;
    einsteinT00Comparability: Nhm2ObserverModelTermSemanticCheckStatus;
    independentCrossCheck: Nhm2ObserverModelTermSemanticCheckStatus;
    finiteDifferenceConvergence: Nhm2ObserverModelTermSemanticCheckStatus;
    citationCoverage: Nhm2ObserverModelTermSemanticCheckStatus;
  };
  pass: boolean;
  rationale: string | null;
  citationRefs: string[];
  notes: string[];
};

export type Nhm2ObserverTileAuthorityEvidence = {
  status: Nhm2ObserverModelTermSemanticCheckStatus;
  chartRef: string | null;
  routeId: string | null;
  selectedPath: Nhm2ObserverModelTermClosurePath | null;
  tileRoute: Nhm2ObserverTileAuthorityRoute;
  checks: {
    routeAdmission: Nhm2ObserverModelTermSemanticCheckStatus;
    fullTensorComponents: Nhm2ObserverModelTermSemanticCheckStatus;
    comparability: Nhm2ObserverModelTermSemanticCheckStatus;
    citationCoverage: Nhm2ObserverModelTermSemanticCheckStatus;
  };
  pass: boolean;
  rationale: string | null;
  citationRefs: string[];
  notes: string[];
};

export type Nhm2ObserverTileComparableCrossCheckEvidence = {
  status: Nhm2ObserverModelTermSemanticCheckStatus;
  chartRef: string | null;
  routeId: string | null;
  selectedPath: Nhm2ObserverModelTermClosurePath | null;
  referenceRouteId: string | null;
  aggregationMethod: string | null;
  metricTensorRef: string | null;
  tileTensorRef: string | null;
  metricWecEulerianMin: number | null;
  metricWecRobustMin: number | null;
  tileWecEulerianMin: number | null;
  tileWecRobustMin: number | null;
  eulerianMinDelta: number | null;
  robustMinDelta: number | null;
  eulerianSignAgreement: boolean | null;
  robustSignAgreement: boolean | null;
  independentCrossCheckStatus: Nhm2ObserverModelTermSemanticCheckStatus;
  comparabilityStatus: Nhm2ObserverModelTermSemanticCheckStatus;
  localizationResult: Nhm2ObserverTileComparableLocalizationResult;
  nextPatchClass: Nhm2ObserverTileComparableNextPatchClass;
  rationale: string | null;
  citationRefs: string[];
  notes: string[];
};

export type Nhm2ObserverTileSurfaceReconstitutionEvidence = {
  status: Nhm2ObserverModelTermSemanticCheckStatus;
  chartRef: string | null;
  routeId: string | null;
  selectedPath: Nhm2ObserverModelTermClosurePath | null;
  sourceTensorRef: string | null;
  reconstitutedTileTensorRef: string | null;
  aggregationMethod: string | null;
  sampleDomainRef: string | null;
  componentCoverage: {
    t00: Nhm2ObserverMetricProducerEvidenceStatus;
    t0i: Nhm2ObserverMetricProducerEvidenceStatus;
    offDiagonalTij: Nhm2ObserverMetricProducerEvidenceStatus;
  };
  independentCrossCheckRouteRef: string | null;
  independentCrossCheckStatus: Nhm2ObserverModelTermSemanticCheckStatus;
  comparabilityStatus: Nhm2ObserverModelTermSemanticCheckStatus;
  localizationResult: Nhm2ObserverTileComparableLocalizationResult;
  rationale: string | null;
  citationRefs: string[];
  notes: string[];
};

export type Nhm2ObserverTileObserverConditionComparabilityEvidence = {
  status: Nhm2ObserverModelTermSemanticCheckStatus;
  chartRef: string | null;
  routeId: string | null;
  selectedPath: Nhm2ObserverModelTermClosurePath | null;
  sampleDomainRef: string | null;
  aggregationMethod: string | null;
  classification: Nhm2ObserverTileObserverComparabilityClassification;
  classificationReason: string | null;
  checks: {
    routeComparability: Nhm2ObserverModelTermSemanticCheckStatus;
    independentCrossCheck: Nhm2ObserverModelTermSemanticCheckStatus;
    sampleCountParity: Nhm2ObserverModelTermSemanticCheckStatus;
    rapidityCapParity: Nhm2ObserverModelTermSemanticCheckStatus;
    rapidityCapBetaParity: Nhm2ObserverModelTermSemanticCheckStatus;
    citationCoverage: Nhm2ObserverModelTermSemanticCheckStatus;
  };
  lanes: {
    metricRequired: {
      tensorRef: string | null;
      sampleCount: number | null;
      rapidityCap: number | null;
      rapidityCapBeta: number | null;
      wecEulerianMin: number | null;
      wecRobustMin: number | null;
      decEulerianMin: number | null;
      decRobustMin: number | null;
    };
    tileEffectiveProxy: {
      tensorRef: string | null;
      sampleCount: number | null;
      rapidityCap: number | null;
      rapidityCapBeta: number | null;
      wecEulerianMin: number | null;
      wecRobustMin: number | null;
      decEulerianMin: number | null;
      decRobustMin: number | null;
    };
    tileEffectiveReconstituted: {
      tensorRef: string | null;
      sourceRef: string | null;
      sampleCount: number | null;
      rapidityCap: number | null;
      rapidityCapBeta: number | null;
      wecEulerianMin: number | null;
      wecRobustMin: number | null;
      decEulerianMin: number | null;
      decRobustMin: number | null;
      note: string | null;
    };
  };
  pass: boolean;
  rationale: string | null;
  citationRefs: string[];
  notes: string[];
};

export type Nhm2ObserverTileObserverLegacyProxyDiagnostics = {
  tensorRef: string | null;
  sampleCount: number | null;
  rapidityCap: number | null;
  rapidityCapBeta: number | null;
  wecEulerianMin: number | null;
  wecRobustMin: number | null;
  decEulerianMin: number | null;
  decRobustMin: number | null;
  note: string | null;
};

export type Nhm2ObserverAuditArtifact = {
  artifactId: typeof NHM2_OBSERVER_AUDIT_ARTIFACT_ID;
  schemaVersion: typeof NHM2_OBSERVER_AUDIT_SCHEMA_VERSION;
  familyId: string;
  shiftLapseProfileId?: string | null;
  status: Nhm2ObserverAuditStatus;
  completeness: Nhm2ObserverAuditCompleteness;
  reasonCodes: Nhm2ObserverAuditReasonCode[];
  observerBlockingAssessmentStatus: Nhm2ObserverBlockingAssessmentStatus;
  observerBlockingAssessmentNote: string | null;
  observerPromotionBlockingSurface: Nhm2ObserverPromotionBlockingSurface;
  observerPromotionBlockingCondition: Nhm2ObserverPromotionBlockingCondition;
  observerMetricPrimaryDriver: Nhm2ObserverPromotionBlockingCondition;
  observerTilePrimaryDriver: Nhm2ObserverPromotionBlockingCondition;
  observerPrimaryDriverAgreement: Nhm2ObserverPrimaryDriverAgreement;
  observerPrimaryDriverNote: string | null;
  observerMetricFirstInspectionTarget: string | null;
  observerTileFirstInspectionTarget: string | null;
  observerSharedRootDriverStatus: Nhm2ObserverSharedRootDriverStatus;
  observerSharedRootDriverNote: string | null;
  observerSharedUpstreamDriverStatus: Nhm2ObserverSharedUpstreamDriverStatus;
  observerSharedUpstreamDriverNote: string | null;
  observerWecPropagationStatus: Nhm2ObserverWecPropagationStatus;
  observerWecPropagationNote: string | null;
  observerRemediationSequenceStatus: Nhm2ObserverRemediationSequenceStatus;
  observerTileDiminishingReturnStatus: Nhm2ObserverTileDiminishingReturnStatus;
  observerTileDiminishingReturnNote: string | null;
  observerMetricCompletenessStatus: Nhm2ObserverMetricCompletenessStatus;
  observerMetricCompletenessNote: string | null;
  observerMetricCoverageBlockerStatus: Nhm2ObserverMetricCoverageBlockerStatus;
  observerMetricCoverageBlockerNote: string | null;
  observerMetricFirstMissingStage: Nhm2ObserverMetricFirstMissingStage;
  observerMetricEmissionAdmissionStatus: Nhm2ObserverMetricEmissionAdmissionStatus;
  observerMetricEmissionAdmissionNote: string | null;
  observerMetricT00AdmissionStatus: Nhm2ObserverMetricComponentAdmissionStatus;
  observerMetricT00RouteId: string | null;
  observerMetricT00ComparabilityStatus: Nhm2ObserverModelTermSemanticCheckStatus;
  observerMetricT00AdmissionNote: string | null;
  observerMetricT0iAdmissionStatus: Nhm2ObserverMetricComponentAdmissionStatus;
  observerMetricT0iAdmissionNote: string | null;
  observerMetricOffDiagonalTijAdmissionStatus: Nhm2ObserverMetricComponentAdmissionStatus;
  observerMetricOffDiagonalTijAdmissionNote: string | null;
  observerTileAuthorityStatus: Nhm2ObserverTileAuthorityStatus;
  observerTileAuthorityNote: string | null;
  observerLeadReadinessWorkstream: Nhm2ObserverLeadReadinessWorkstream;
  observerLeadReadinessReason: string | null;
  observerNextTechnicalAction: Nhm2ObserverNextTechnicalAction;
  metricProducerAdmissionEvidence?: Nhm2ObserverMetricProducerAdmissionEvidence | null;
  modelTermSemanticAdmissionEvidence?: Nhm2ObserverModelTermSemanticAdmissionEvidence | null;
  observerDecRemediationEvidence?: Nhm2ObserverDecRemediationEvidence | null;
  observerDecPhysicsControlEvidence?: Nhm2ObserverDecPhysicsControlEvidence | null;
  t00PolicyAdmissionBridgeEvidence?: Nhm2ObserverT00PolicyAdmissionBridgeEvidence | null;
  tileAuthorityEvidence?: Nhm2ObserverTileAuthorityEvidence | null;
  tileComparableCrossCheckEvidence?: Nhm2ObserverTileComparableCrossCheckEvidence | null;
  tileSurfaceReconstitutionEvidence?: Nhm2ObserverTileSurfaceReconstitutionEvidence | null;
  tileObserverConditionComparabilityEvidence?: Nhm2ObserverTileObserverConditionComparabilityEvidence | null;
  tileObserverConditionAuthorityMode?: Nhm2ObserverTileObserverConditionAuthorityMode;
  tileObserverConditionAuthorityNote?: string | null;
  tileObserverLegacyProxyDiagnostics?: Nhm2ObserverTileObserverLegacyProxyDiagnostics | null;
  tensors: {
    metricRequired: Nhm2ObserverAuditTensor;
    tileEffective: Nhm2ObserverAuditTensor;
  };
  distinction: {
    preserveNegativeAndMixedResults: true;
    metricTensorId: "metric_required";
    tileTensorId: "tile_effective";
  };
};

type BuildNhm2ObserverAuditConditionInput = {
  eulerianMin?: number | null;
  eulerianMean?: number | null;
  robustMin?: number | null;
  robustMean?: number | null;
  eulerianViolationFraction?: number | null;
  robustViolationFraction?: number | null;
  missedViolationFraction?: number | null;
  severityGainMin?: number | null;
  severityGainMean?: number | null;
  maxRobustMinusEulerian?: number | null;
  worstCase?: {
    index?: number | null;
    value?: number | null;
    direction?: [number, number, number] | null;
    rapidity?: number | null;
    source?: string | null;
  } | null;
} | null;

export type BuildNhm2ObserverAuditTensorInput = {
  tensorRef?: string | null;
  sampleCount?: number | null;
  rapidityCap?: number | null;
  rapidityCapBeta?: number | null;
  typeI?: {
    count?: number | null;
    fraction?: number | null;
    tolerance?: number | null;
  } | null;
  conditions?: Partial<
    Record<Nhm2ObserverAuditConditionKey, BuildNhm2ObserverAuditConditionInput>
  > | null;
  fluxDiagnostics?: {
    status?: Nhm2ObserverAuditFluxStatus | null;
    meanMagnitude?: number | null;
    maxMagnitude?: number | null;
    netMagnitude?: number | null;
    netDirection?: [number, number, number] | null;
    note?: string | null;
  } | null;
  consistency?: {
    robustNotGreaterThanEulerian?: boolean | null;
    maxRobustMinusEulerian?: number | null;
  } | null;
  model?: {
    pressureModel?: string | null;
    fluxHandling?: string | null;
    shearHandling?: string | null;
    limitationNotes?: string[] | null;
    note?: string | null;
  } | null;
  missingInputs?: string[] | null;
  upstreamDriverRef?: string | null;
  upstreamDriverClass?: Nhm2ObserverUpstreamDriverClass | null;
  upstreamDriverDependencyStatus?:
    | Nhm2ObserverUpstreamDriverDependencyStatus
    | null;
  upstreamDriverNote?: string | null;
  firstUpstreamRemediationTarget?: string | null;
  firstUpstreamRemediationWhy?: string | null;
  wecProbeScale?: number | null;
  wecProbeResponseFactor?: number | null;
} | null;

export type BuildNhm2ObserverAuditArtifactInput = {
  familyId?: string | null;
  shiftLapseProfileId?: string | null;
  metricRequired?: BuildNhm2ObserverAuditTensorInput;
  tileEffective?: BuildNhm2ObserverAuditTensorInput;
  observerTileDiminishingReturnStatus?:
    | Nhm2ObserverTileDiminishingReturnStatus
    | null;
  observerTileDiminishingReturnNote?: string | null;
  observerMetricCompletenessStatus?:
    | Nhm2ObserverMetricCompletenessStatus
    | null;
  observerMetricCompletenessNote?: string | null;
  observerMetricCoverageBlockerStatus?:
    | Nhm2ObserverMetricCoverageBlockerStatus
    | null;
  observerMetricCoverageBlockerNote?: string | null;
  observerMetricFirstMissingStage?: Nhm2ObserverMetricFirstMissingStage | null;
  observerMetricEmissionAdmissionStatus?:
    | Nhm2ObserverMetricEmissionAdmissionStatus
    | null;
  observerMetricEmissionAdmissionNote?: string | null;
  observerMetricT00AdmissionStatus?:
    | Nhm2ObserverMetricComponentAdmissionStatus
    | null;
  observerMetricT00RouteId?: string | null;
  observerMetricT00ComparabilityStatus?:
    | Nhm2ObserverModelTermSemanticCheckStatus
    | null;
  observerMetricT00AdmissionNote?: string | null;
  observerMetricT0iAdmissionStatus?:
    | Nhm2ObserverMetricComponentAdmissionStatus
    | null;
  observerMetricT0iAdmissionNote?: string | null;
  observerMetricOffDiagonalTijAdmissionStatus?:
    | Nhm2ObserverMetricComponentAdmissionStatus
    | null;
  observerMetricOffDiagonalTijAdmissionNote?: string | null;
  observerTileAuthorityStatus?: Nhm2ObserverTileAuthorityStatus | null;
  observerTileAuthorityNote?: string | null;
  observerLeadReadinessWorkstream?:
    | Nhm2ObserverLeadReadinessWorkstream
    | null;
  observerLeadReadinessReason?: string | null;
  observerNextTechnicalAction?: Nhm2ObserverNextTechnicalAction | null;
  metricProducerAdmissionEvidence?: {
    semanticsRef?: string | null;
    chartRef?: string | null;
    producerModuleRef?: string[] | null;
    currentEmissionShape?: Nhm2ObserverMetricProducerEmissionShape | null;
    currentOutputFamilies?: string[] | null;
    supportFieldEvidence?: Partial<
      Nhm2ObserverMetricProducerAdmissionEvidence["supportFieldEvidence"]
    > | null;
    t0iAdmissionBranch?: Nhm2ObserverMetricComponentAdmissionStatus | null;
    offDiagonalTijAdmissionBranch?:
      | Nhm2ObserverMetricComponentAdmissionStatus
      | null;
    nextInspectionTarget?: string | null;
    notes?: string[] | null;
  } | null;
  modelTermSemanticAdmissionEvidence?: {
    semanticsRef?: string | null;
    researchBasisRef?: string | null;
    chartRef?: string | null;
    routeId?: string | null;
    routeAdmissionRaw?: Nhm2ObserverModelTermSemanticAdmission | null;
    routeAdmissionEffective?: Nhm2ObserverModelTermSemanticAdmission | null;
    routeAdmissionPromotionBasis?:
      | Nhm2ObserverModelTermRouteAdmissionPromotionBasis
      | null;
    routeAdmission?: Nhm2ObserverModelTermSemanticAdmission | null;
    decision?: Nhm2ObserverModelTermSemanticDecision | null;
    reasonCodes?: Nhm2ObserverModelTermSemanticReasonCode[] | null;
    checks?: Partial<
      Nhm2ObserverModelTermSemanticAdmissionEvidence["checks"]
    > | null;
    einsteinTensorRouteEvidence?: {
      status?: Nhm2ObserverModelTermEinsteinRouteStatus | null;
      routeId?: string | null;
      tensorSource?: string | null;
      comparedSampleCount?: number | null;
      maxRelativeResidual?: number | null;
      t00ComparedSampleCount?: number | null;
      t00MaxRelativeResidual?: number | null;
      t00RelativeResidualThreshold?: number | null;
      note?: string | null;
    } | null;
    einsteinResidualAttributionEvidence?: {
      status?: Nhm2ObserverModelTermEinsteinRouteStatus | null;
      sampleCount?: number | null;
      maxRelativeResidual?: number | null;
      componentResiduals?: {
        T01?: number | null;
        T02?: number | null;
        T03?: number | null;
        T12?: number | null;
        T13?: number | null;
        T23?: number | null;
      } | null;
      conventionSweep?: Array<{
        candidateId?: string | null;
        status?: Nhm2ObserverModelTermEinsteinRouteStatus | null;
        maxRelativeResidual?: number | null;
        note?: string | null;
      }> | null;
      bestCandidateId?: string | null;
      bestCandidateResidual?: number | null;
      diagnosisClass?: Nhm2ObserverModelTermResidualDiagnosisClass | null;
      note?: string | null;
    } | null;
    einsteinEvaluatorClosureEvidence?: {
      status?: Nhm2ObserverModelTermEinsteinRouteStatus | null;
      chartRef?: string | null;
      routeId?: string | null;
      unitConvention?: string | null;
      signConvention?: string | null;
      resolutionSweep?: {
        coarse?: {
          step_m?: number | null;
          comparedSampleCount?: number | null;
          t0iMaxRelativeResidual?: number | null;
          offDiagonalMaxRelativeResidual?: number | null;
        } | null;
        refined?: {
          step_m?: number | null;
          comparedSampleCount?: number | null;
          t0iMaxRelativeResidual?: number | null;
          offDiagonalMaxRelativeResidual?: number | null;
        } | null;
        superRefined?: {
          step_m?: number | null;
          comparedSampleCount?: number | null;
          t0iMaxRelativeResidual?: number | null;
          offDiagonalMaxRelativeResidual?: number | null;
        } | null;
      } | null;
      observedConvergenceOrder?: {
        t0i?: number | null;
        offDiagonal?: number | null;
      } | null;
      richardsonExtrapolatedResidual?: {
        t0i?: number | null;
        offDiagonal?: number | null;
      } | null;
      conventionSweep?: Array<{
        candidateId?: string | null;
        status?: Nhm2ObserverModelTermEinsteinRouteStatus | null;
        maxRelativeResidual?: number | null;
        note?: string | null;
      }> | null;
      bestCandidateId?: string | null;
      diagnosisClass?: Nhm2ObserverModelTermResidualDiagnosisClass | null;
      note?: string | null;
      citationRefs?: string[] | null;
    } | null;
    einsteinRouteValidationSuite?: {
      status?: Nhm2ObserverModelTermSemanticCheckStatus | null;
      admittedForRoutePass?: boolean | null;
      residualThreshold?: number | null;
      evaluatedCaseCount?: number | null;
      passedCaseCount?: number | null;
      cases?: Array<{
        caseId?: Nhm2ObserverModelTermEinsteinValidationCaseId | null;
        status?: Nhm2ObserverModelTermSemanticCheckStatus | null;
        maxAbsResidual?: number | null;
        expectedNearZero?: boolean | null;
        note?: string | null;
        citationRefs?: string[] | null;
      }> | null;
      note?: string | null;
      citationRefs?: string[] | null;
    } | null;
    closurePathDecision?: {
      selectedPath?: Nhm2ObserverModelTermClosurePath | null;
      admPathStatus?: Nhm2ObserverModelTermSemanticCheckStatus | null;
      fullEinsteinPathStatus?: Nhm2ObserverModelTermSemanticCheckStatus | null;
      routeHint?: Nhm2ObserverModelTermClosureRouteHint | null;
      nextPatchClass?: Nhm2ObserverModelTermClosureNextPatch | null;
      patchBriefRef?: string | null;
      rationale?: string | null;
      blockerCodes?: Nhm2ObserverModelTermSemanticReasonCode[] | null;
      nonBlockingCodes?: Nhm2ObserverModelTermSemanticReasonCode[] | null;
      citationRefs?: string[] | null;
      notes?: string[] | null;
    } | null;
    citationRefs?: string[] | null;
    notes?: string[] | null;
  } | null;
  observerDecRemediationEvidence?: {
    chartRef?: string | null;
    routeId?: string | null;
    selectedPath?: Nhm2ObserverModelTermClosurePath | null;
    rapidityCap?: number | null;
    rapidityCapBeta?: number | null;
    metricDecEulerianMin?: number | null;
    metricDecRobustMin?: number | null;
    tileReconstitutedDecEulerianMin?: number | null;
    tileReconstitutedDecRobustMin?: number | null;
    typeIFractionMetric?: number | null;
    typeIFractionTileReconstituted?: number | null;
    dominantViolationClass?: Nhm2ObserverDecDominantViolationClass | null;
    recommendedPatchClass?: Nhm2ObserverDecRecommendedPatchClass | null;
    citationRefs?: string[] | null;
    notes?: string[] | null;
  } | null;
  observerDecPhysicsControlEvidence?: {
    chartRef?: string | null;
    routeId?: string | null;
    selectedPath?: Nhm2ObserverModelTermClosurePath | null;
    baseline?: {
      metricDecEulerianMin?: number | null;
      metricDecRobustMin?: number | null;
      metricWecEulerianMin?: number | null;
      metricWecRobustMin?: number | null;
      metricNecEulerianMin?: number | null;
      metricNecRobustMin?: number | null;
      tileReconstitutedDecEulerianMin?: number | null;
      tileReconstitutedDecRobustMin?: number | null;
      tileReconstitutedWecEulerianMin?: number | null;
      tileReconstitutedWecRobustMin?: number | null;
      tileReconstitutedNecEulerianMin?: number | null;
      tileReconstitutedNecRobustMin?: number | null;
    } | null;
    candidate?: {
      candidateId?: string | null;
      applied?: boolean | null;
      metricDecEulerianMin?: number | null;
      metricDecRobustMin?: number | null;
      metricWecEulerianMin?: number | null;
      metricWecRobustMin?: number | null;
      metricNecEulerianMin?: number | null;
      metricNecRobustMin?: number | null;
      tileReconstitutedDecEulerianMin?: number | null;
      tileReconstitutedDecRobustMin?: number | null;
      tileReconstitutedWecEulerianMin?: number | null;
      tileReconstitutedWecRobustMin?: number | null;
      tileReconstitutedNecEulerianMin?: number | null;
      tileReconstitutedNecRobustMin?: number | null;
    } | null;
    deltas?: {
      metricDecRobustLift?: number | null;
      tileReconstitutedDecRobustLift?: number | null;
      metricWecRobustDelta?: number | null;
      metricNecRobustDelta?: number | null;
    } | null;
    guardChecks?: {
      metricWecNonRegression?: boolean | null;
      metricNecNonRegression?: boolean | null;
      emissionAdmissionStable?: boolean | null;
      semanticAdmissionStable?: boolean | null;
    } | null;
    sweepCandidates?: Array<{
      candidateId?: string | null;
      candidateClass?:
        | "baseline_hold"
        | "observer_domain_truncation"
        | "physics_control_proposal"
        | null;
      sweepPhase?: Nhm2ObserverDecPhysicsSweepPhase | null;
      refineSeedCandidateId?: string | null;
      applied?: boolean | null;
      rapidityCap?: number | null;
      rapidityCapBeta?: number | null;
      pressureScale?: number | null;
      densityLiftFraction?: number | null;
      fluxScale?: number | null;
      shearScale?: number | null;
      metricDecRobustMin?: number | null;
      tileReconstitutedDecRobustMin?: number | null;
      metricWecRobustMin?: number | null;
      metricNecRobustMin?: number | null;
      metricDecRobustLift?: number | null;
      tileReconstitutedDecRobustLift?: number | null;
      metricWecRobustDelta?: number | null;
      metricNecRobustDelta?: number | null;
      metricDecRobustMarginToZero?: number | null;
      tileReconstitutedDecRobustMarginToZero?: number | null;
      crossesZeroBothDecMargins?: boolean | null;
      metricWecNonRegressionMargin?: number | null;
      metricNecNonRegressionMargin?: number | null;
      selectionObjectivePrimaryMargin?: number | null;
      controlDeviationMagnitude?: number | null;
      guardChecks?: {
        metricWecNonRegression?: boolean | null;
        metricNecNonRegression?: boolean | null;
        emissionAdmissionStable?: boolean | null;
        semanticAdmissionStable?: boolean | null;
      } | null;
      passesSelectionGate?: boolean | null;
      gateFailureReasons?: Nhm2ObserverDecPhysicsSelectionReasonCode[] | null;
      note?: string | null;
    }> | null;
    sweepPhaseSummary?: {
      coarseCandidateCount?: number | null;
      coarsePassingCount?: number | null;
      refineCandidateCount?: number | null;
      refinePassingCount?: number | null;
      refineSeedCandidateIds?: string[] | null;
      note?: string | null;
    } | null;
    topCandidateLeaderboard?: Array<{
      rank?: number | null;
      candidateId?: string | null;
      candidateClass?:
        | "baseline_hold"
        | "observer_domain_truncation"
        | "physics_control_proposal"
        | null;
      sweepPhase?: Nhm2ObserverDecPhysicsSweepPhase | null;
      passesSelectionGate?: boolean | null;
      crossesZeroBothDecMargins?: boolean | null;
      selectionObjectivePrimaryMargin?: number | null;
      metricDecRobustLift?: number | null;
      tileReconstitutedDecRobustLift?: number | null;
      controlDeviationMagnitude?: number | null;
    }> | null;
    selectionObjective?: string | null;
    selectedCandidateId?: string | null;
    selectionDecision?: Nhm2ObserverDecPhysicsSelectionDecision | null;
    selectionPlateauStatus?:
      | Nhm2ObserverDecPhysicsSelectionPlateauStatus
      | null;
    crossZeroFeasibilityEvidence?: {
      baselinePrimaryMargin?: number | null;
      bestCandidatePrimaryMargin?: number | null;
      requiredLiftToZero?: number | null;
      achievedLiftFromBaseline?: number | null;
      bestAchievedLift?: number | null;
      residualMarginToZero?: number | null;
      gapToZero?: number | null;
      crossZeroAchieved?: boolean | null;
      boundedControlEnvelope?: {
        pressureScaleMin?: number | null;
        pressureScaleMax?: number | null;
        densityLiftMin?: number | null;
        densityLiftMax?: number | null;
        fluxScaleMin?: number | null;
        fluxScaleMax?: number | null;
        shearScaleMin?: number | null;
        shearScaleMax?: number | null;
      } | null;
      evaluationRoute?: {
        chartRef?: string | null;
        routeId?: string | null;
        selectedPath?: Nhm2ObserverModelTermClosurePath | null;
        independentCrossCheckStatus?:
          | Nhm2ObserverModelTermSemanticCheckStatus
          | null;
        runtimeComparabilityPass?: boolean | null;
      } | null;
      method?: Nhm2ObserverDecPhysicsCrossZeroMethod | null;
      inferenceLabel?: Nhm2ObserverDecPhysicsCrossZeroInferenceLabel | null;
      citationRefs?: string[] | null;
      notes?: string[] | null;
    } | null;
    decResidualAttributionEvidence?: {
      status?: Nhm2ObserverDecResidualAttributionStatus | null;
      primarySurface?: Nhm2ObserverDecResidualPrimarySurface | null;
      dominantViolationClass?: Nhm2ObserverDecDominantViolationClass | null;
      baselinePrimaryMargin?: number | null;
      selectedPrimaryMargin?: number | null;
      requiredLiftToZero?: number | null;
      achievedLiftFromBaseline?: number | null;
      residualMarginToZero?: number | null;
      gapToZero?: number | null;
      selectionPlateauStatus?:
        | Nhm2ObserverDecPhysicsSelectionPlateauStatus
        | null;
      selectionReasonCodes?: Nhm2ObserverDecPhysicsSelectionReasonCode[] | null;
      zeroCrossFeasibilityDecision?:
        | Nhm2ObserverDecPhysicsZeroCrossFeasibilityDecision
        | null;
      rankingBasis?: string | null;
      selectedCandidate?: {
        candidateId?: string | null;
        candidateClass?:
          | "baseline_hold"
          | "observer_domain_truncation"
          | "physics_control_proposal"
          | null;
        sweepPhase?: Nhm2ObserverDecPhysicsSweepPhase | null;
        metricDecRobustMarginToZero?: number | null;
        tileReconstitutedDecRobustMarginToZero?: number | null;
        metricDecRobustLift?: number | null;
        tileReconstitutedDecRobustLift?: number | null;
        controlDeviationMagnitude?: number | null;
      } | null;
      citationRefs?: string[] | null;
      notes?: string[] | null;
    } | null;
    zeroCrossFeasibilityDecision?:
      | Nhm2ObserverDecPhysicsZeroCrossFeasibilityDecision
      | null;
    zeroCrossFeasibilityReasonCodes?:
      | Nhm2ObserverDecPhysicsZeroCrossReasonCode[]
      | null;
    boundedSearchEnvelope?: {
      pressureScaleMin?: number | null;
      pressureScaleMax?: number | null;
      densityLiftMin?: number | null;
      densityLiftMax?: number | null;
      fluxScaleMin?: number | null;
      fluxScaleMax?: number | null;
      shearScaleMin?: number | null;
      shearScaleMax?: number | null;
      coarsePressureStep?: number | null;
      coarseDensityLiftStep?: number | null;
      coarseFluxScaleStep?: number | null;
      coarseShearScaleStep?: number | null;
      refinePressureStep?: number | null;
      refineDensityLiftStep?: number | null;
      refineFluxScaleStep?: number | null;
      refineShearScaleStep?: number | null;
      coarseCandidateCount?: number | null;
      refineCandidateCount?: number | null;
      refineSeedCount?: number | null;
      observerDomainFixed?: boolean | null;
    } | null;
    selectionReasonCodes?: Nhm2ObserverDecPhysicsSelectionReasonCode[] | null;
    nonRegressionGate?: {
      required?: string[] | null;
      pass?: boolean | null;
      note?: string | null;
    } | null;
    runtimeApplication?: {
      attempted?: boolean | null;
      enabled?: boolean | null;
      status?: Nhm2ObserverDecPhysicsRuntimeApplicationStatus | null;
      failureMode?: Nhm2ObserverDecPhysicsRuntimeFailureMode | null;
      evaluationComparable?: boolean | null;
      sampleCount?: number | null;
      comparableSampleCount?: number | null;
      minimumComparableSampleCount?: number | null;
      sampleCountSufficient?: boolean | null;
      referenceRouteId?: string | null;
      selectedRouteId?: string | null;
      selectedPath?: Nhm2ObserverModelTermClosurePath | null;
      candidateId?: string | null;
      comparabilityGate?: {
        chartRef?: string | null;
        chartParity?: boolean | null;
        selectedPathParity?: boolean | null;
        independentCrossCheckStatus?: Nhm2ObserverModelTermSemanticCheckStatus | null;
        pass?: boolean | null;
        note?: string | null;
      } | null;
      rollbackReasonCodes?: Nhm2ObserverDecPhysicsSelectionReasonCode[] | null;
      guardChecks?: {
        metricWecNonRegression?: boolean | null;
        metricNecNonRegression?: boolean | null;
        emissionAdmissionStable?: boolean | null;
        semanticAdmissionStable?: boolean | null;
        metricDecRobustLiftPositive?: boolean | null;
        tileReconstitutedDecRobustLiftNonNegative?: boolean | null;
      } | null;
      observed?: {
        metricDecRobustLift?: number | null;
        tileReconstitutedDecRobustLift?: number | null;
        metricWecRobustDelta?: number | null;
        metricNecRobustDelta?: number | null;
        metricDecRobustMarginToZero?: number | null;
        tileReconstitutedDecRobustMarginToZero?: number | null;
        metricWecNonRegressionMargin?: number | null;
        metricNecNonRegressionMargin?: number | null;
      } | null;
      note?: string | null;
      citationRefs?: string[] | null;
    } | null;
    controlKnobs?: Array<{
      knobId?: string | null;
      baselineValue?: number | null;
      candidateValue?: number | null;
      deltaValue?: number | null;
      boundedDeltaMax?: number | null;
      bounded?: boolean | null;
      note?: string | null;
    }> | null;
    claimCitationMap?: Array<{
      claimId?: string | null;
      claim?: string | null;
      citationRefs?: string[] | null;
      note?: string | null;
    }> | null;
    claimCitationMapCompleteness?: {
      status?: "pass" | "fail" | null;
      expectedClaimCount?: number | null;
      coveredClaimCount?: number | null;
      expectedClaimIds?: string[] | null;
      missingClaimIds?: string[] | null;
      note?: string | null;
    } | null;
    decCoupledControlEvidence?: {
      status?: "available" | "unavailable" | null;
      controlFamiliesUsed?: string[] | null;
      boundedEnvelope?: {
        pressureScaleMin?: number | null;
        pressureScaleMax?: number | null;
        densityLiftMin?: number | null;
        densityLiftMax?: number | null;
        fluxScaleMin?: number | null;
        fluxScaleMax?: number | null;
        shearScaleMin?: number | null;
        shearScaleMax?: number | null;
      } | null;
      candidateEvaluationTable?: Array<{
        candidateId?: string | null;
        pressureScale?: number | null;
        densityLiftFraction?: number | null;
        fluxScale?: number | null;
        shearScale?: number | null;
        selectionObjectivePrimaryMargin?: number | null;
        passesSelectionGate?: boolean | null;
      }> | null;
      bestCandidateId?: string | null;
      comparabilityGate?: {
        pass?: boolean | null;
        independentCrossCheckStatus?:
          | Nhm2ObserverModelTermSemanticCheckStatus
          | null;
        note?: string | null;
      } | null;
      researchClaims?: Array<{
        claimId?: string | null;
        claim?: string | null;
        confidenceLabel?: Nhm2ObserverResearchClaimConfidenceLabel | null;
        citationRefs?: string[] | null;
        note?: string | null;
      }> | null;
      note?: string | null;
    } | null;
    recommendation?: Nhm2ObserverDecRecommendedPatchClass | null;
    uncertaintyTags?: Nhm2ObserverDecPhysicsUncertaintyTag[] | null;
    citationRefs?: string[] | null;
    derivationNotes?: string[] | null;
    uncertaintyNotes?: string[] | null;
  } | null;
  t00PolicyAdmissionBridgeEvidence?: {
    status?: Nhm2ObserverModelTermSemanticCheckStatus | null;
    routeId?: string | null;
    chartRef?: string | null;
    selectedPath?: Nhm2ObserverModelTermClosurePath | null;
    routeAdmissionRaw?: Nhm2ObserverModelTermSemanticAdmission | null;
    routeAdmissionEffective?: Nhm2ObserverModelTermSemanticAdmission | null;
    routeAdmissionPromotionBasis?:
      | Nhm2ObserverModelTermRouteAdmissionPromotionBasis
      | null;
    checks?: Partial<Nhm2ObserverT00PolicyAdmissionBridgeEvidence["checks"]> | null;
    pass?: boolean | null;
    rationale?: string | null;
    citationRefs?: string[] | null;
    notes?: string[] | null;
  } | null;
  tileAuthorityEvidence?: {
    status?: Nhm2ObserverModelTermSemanticCheckStatus | null;
    chartRef?: string | null;
    routeId?: string | null;
    selectedPath?: Nhm2ObserverModelTermClosurePath | null;
    tileRoute?: Nhm2ObserverTileAuthorityRoute | null;
    checks?: Partial<Nhm2ObserverTileAuthorityEvidence["checks"]> | null;
    pass?: boolean | null;
    rationale?: string | null;
    citationRefs?: string[] | null;
    notes?: string[] | null;
  } | null;
  tileComparableCrossCheckEvidence?: {
    status?: Nhm2ObserverModelTermSemanticCheckStatus | null;
    chartRef?: string | null;
    routeId?: string | null;
    selectedPath?: Nhm2ObserverModelTermClosurePath | null;
    referenceRouteId?: string | null;
    aggregationMethod?: string | null;
    metricTensorRef?: string | null;
    tileTensorRef?: string | null;
    metricWecEulerianMin?: number | null;
    metricWecRobustMin?: number | null;
    tileWecEulerianMin?: number | null;
    tileWecRobustMin?: number | null;
    eulerianMinDelta?: number | null;
    robustMinDelta?: number | null;
    eulerianSignAgreement?: boolean | null;
    robustSignAgreement?: boolean | null;
    independentCrossCheckStatus?: Nhm2ObserverModelTermSemanticCheckStatus | null;
    comparabilityStatus?: Nhm2ObserverModelTermSemanticCheckStatus | null;
    localizationResult?: Nhm2ObserverTileComparableLocalizationResult | null;
    nextPatchClass?: Nhm2ObserverTileComparableNextPatchClass | null;
    rationale?: string | null;
    citationRefs?: string[] | null;
    notes?: string[] | null;
  } | null;
  tileSurfaceReconstitutionEvidence?: {
    status?: Nhm2ObserverModelTermSemanticCheckStatus | null;
    chartRef?: string | null;
    routeId?: string | null;
    selectedPath?: Nhm2ObserverModelTermClosurePath | null;
    sourceTensorRef?: string | null;
    reconstitutedTileTensorRef?: string | null;
    aggregationMethod?: string | null;
    sampleDomainRef?: string | null;
    componentCoverage?:
      | Partial<Nhm2ObserverTileSurfaceReconstitutionEvidence["componentCoverage"]>
      | null;
    independentCrossCheckRouteRef?: string | null;
    independentCrossCheckStatus?: Nhm2ObserverModelTermSemanticCheckStatus | null;
    comparabilityStatus?: Nhm2ObserverModelTermSemanticCheckStatus | null;
    localizationResult?: Nhm2ObserverTileComparableLocalizationResult | null;
    rationale?: string | null;
    citationRefs?: string[] | null;
    notes?: string[] | null;
  } | null;
  tileObserverConditionComparabilityEvidence?: {
    status?: Nhm2ObserverModelTermSemanticCheckStatus | null;
    chartRef?: string | null;
    routeId?: string | null;
    selectedPath?: Nhm2ObserverModelTermClosurePath | null;
    sampleDomainRef?: string | null;
    aggregationMethod?: string | null;
    classification?: Nhm2ObserverTileObserverComparabilityClassification | null;
    classificationReason?: string | null;
    checks?:
      | Partial<
          Nhm2ObserverTileObserverConditionComparabilityEvidence["checks"]
        >
      | null;
    lanes?:
      | Partial<Nhm2ObserverTileObserverConditionComparabilityEvidence["lanes"]>
      | null;
    pass?: boolean | null;
    rationale?: string | null;
    citationRefs?: string[] | null;
    notes?: string[] | null;
  } | null;
  tileObserverConditionAuthorityMode?:
    | Nhm2ObserverTileObserverConditionAuthorityMode
    | null;
  tileObserverConditionAuthorityNote?: string | null;
  tileObserverLegacyProxyDiagnostics?: {
    tensorRef?: string | null;
    sampleCount?: number | null;
    rapidityCap?: number | null;
    rapidityCapBeta?: number | null;
    wecEulerianMin?: number | null;
    wecRobustMin?: number | null;
    decEulerianMin?: number | null;
    decRobustMin?: number | null;
    note?: string | null;
  } | null;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toFinite = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n) : null;
};

const toNullableBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const toDirection = (value: unknown): Nhm2ObserverAuditDirection | null => {
  if (!Array.isArray(value) || value.length < 3) return null;
  const x = toFinite(value[0]);
  const y = toFinite(value[1]);
  const z = toFinite(value[2]);
  return x != null && y != null && z != null ? [x, y, z] : null;
};

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const orderReasonCodes = (
  values: Nhm2ObserverAuditReasonCode[],
): Nhm2ObserverAuditReasonCode[] =>
  unique(values).sort(
    (lhs, rhs) =>
      NHM2_OBSERVER_AUDIT_REASON_CODES.indexOf(lhs) -
      NHM2_OBSERVER_AUDIT_REASON_CODES.indexOf(rhs),
  );

const normalizeMetricProducerEvidenceStatus = (
  value: unknown,
): Nhm2ObserverMetricProducerEvidenceStatus =>
  NHM2_OBSERVER_METRIC_PRODUCER_EVIDENCE_STATUS_VALUES.includes(
    value as Nhm2ObserverMetricProducerEvidenceStatus,
  )
    ? (value as Nhm2ObserverMetricProducerEvidenceStatus)
    : "unknown";

const normalizeMetricProducerAdmissionEvidence = (
  value: BuildNhm2ObserverAuditArtifactInput["metricProducerAdmissionEvidence"],
): Nhm2ObserverMetricProducerAdmissionEvidence | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const supportFieldEvidenceInput = (
    value.supportFieldEvidence ?? {}
  ) as Record<string, unknown>;
  const emissionShape = NHM2_OBSERVER_METRIC_PRODUCER_EMISSION_SHAPE_VALUES.includes(
    value.currentEmissionShape as Nhm2ObserverMetricProducerEmissionShape,
  )
    ? (value.currentEmissionShape as Nhm2ObserverMetricProducerEmissionShape)
    : "unknown";
  const t0iAdmissionBranch =
    NHM2_OBSERVER_METRIC_COMPONENT_ADMISSION_STATUS_VALUES.includes(
      value.t0iAdmissionBranch as Nhm2ObserverMetricComponentAdmissionStatus,
    )
      ? (value.t0iAdmissionBranch as Nhm2ObserverMetricComponentAdmissionStatus)
      : "unknown";
  const offDiagonalTijAdmissionBranch =
    NHM2_OBSERVER_METRIC_COMPONENT_ADMISSION_STATUS_VALUES.includes(
      value.offDiagonalTijAdmissionBranch as Nhm2ObserverMetricComponentAdmissionStatus,
    )
      ? (value.offDiagonalTijAdmissionBranch as Nhm2ObserverMetricComponentAdmissionStatus)
      : "unknown";
  const producerModuleRef = Array.isArray(value.producerModuleRef)
    ? value.producerModuleRef
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const currentOutputFamilies = Array.isArray(value.currentOutputFamilies)
    ? value.currentOutputFamilies
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const notes = Array.isArray(value.notes)
    ? value.notes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  return {
    semanticsRef: asText(value.semanticsRef),
    chartRef: asText(value.chartRef),
    producerModuleRef: unique(producerModuleRef),
    currentEmissionShape: emissionShape,
    currentOutputFamilies: unique(currentOutputFamilies),
    supportFieldEvidence: {
      alpha: normalizeMetricProducerEvidenceStatus(
        supportFieldEvidenceInput.alpha,
      ),
      beta_i: normalizeMetricProducerEvidenceStatus(
        supportFieldEvidenceInput.beta_i,
      ),
      gamma_ij: normalizeMetricProducerEvidenceStatus(
        supportFieldEvidenceInput.gamma_ij,
      ),
      K_ij: normalizeMetricProducerEvidenceStatus(supportFieldEvidenceInput.K_ij),
      D_j_Kj_i_minus_D_i_K_route: normalizeMetricProducerEvidenceStatus(
        supportFieldEvidenceInput.D_j_Kj_i_minus_D_i_K_route,
      ),
      time_derivative_or_Kij_evolution_route: normalizeMetricProducerEvidenceStatus(
        supportFieldEvidenceInput.time_derivative_or_Kij_evolution_route,
      ),
      full_einstein_tensor_route: normalizeMetricProducerEvidenceStatus(
        supportFieldEvidenceInput.full_einstein_tensor_route,
      ),
    },
    t0iAdmissionBranch,
    offDiagonalTijAdmissionBranch,
    nextInspectionTarget: asText(value.nextInspectionTarget),
    notes,
  };
};

const normalizeModelTermSemanticCheckStatus = (
  value: unknown,
): Nhm2ObserverModelTermSemanticCheckStatus =>
  NHM2_OBSERVER_MODEL_TERM_SEMANTIC_CHECK_STATUS_VALUES.includes(
    value as Nhm2ObserverModelTermSemanticCheckStatus,
  )
    ? (value as Nhm2ObserverModelTermSemanticCheckStatus)
    : "unknown";

const normalizeModelTermEinsteinRouteStatus = (
  value: unknown,
): Nhm2ObserverModelTermEinsteinRouteStatus =>
  NHM2_OBSERVER_MODEL_TERM_EINSTEIN_ROUTE_STATUS_VALUES.includes(
    value as Nhm2ObserverModelTermEinsteinRouteStatus,
  )
    ? (value as Nhm2ObserverModelTermEinsteinRouteStatus)
    : "unknown";

const normalizeModelTermResidualDiagnosisClass = (
  value: unknown,
): Nhm2ObserverModelTermResidualDiagnosisClass =>
  NHM2_OBSERVER_MODEL_TERM_RESIDUAL_DIAGNOSIS_CLASS_VALUES.includes(
    value as Nhm2ObserverModelTermResidualDiagnosisClass,
  )
    ? (value as Nhm2ObserverModelTermResidualDiagnosisClass)
    : "unknown";

const normalizeModelTermClosurePath = (
  value: unknown,
): Nhm2ObserverModelTermClosurePath =>
  NHM2_OBSERVER_MODEL_TERM_CLOSURE_PATH_VALUES.includes(
    value as Nhm2ObserverModelTermClosurePath,
  )
    ? (value as Nhm2ObserverModelTermClosurePath)
    : "undecided";

const normalizeModelTermClosureRouteHint = (
  value: unknown,
): Nhm2ObserverModelTermClosureRouteHint =>
  NHM2_OBSERVER_MODEL_TERM_CLOSURE_ROUTE_HINT_VALUES.includes(
    value as Nhm2ObserverModelTermClosureRouteHint,
  )
    ? (value as Nhm2ObserverModelTermClosureRouteHint)
    : "none";

const normalizeModelTermClosureNextPatch = (
  value: unknown,
): Nhm2ObserverModelTermClosureNextPatch =>
  NHM2_OBSERVER_MODEL_TERM_CLOSURE_NEXT_PATCH_VALUES.includes(
    value as Nhm2ObserverModelTermClosureNextPatch,
  )
    ? (value as Nhm2ObserverModelTermClosureNextPatch)
    : "evidence_disambiguation_patch";

const normalizeModelTermSemanticAdmission = (
  value: unknown,
): Nhm2ObserverModelTermSemanticAdmission =>
  NHM2_OBSERVER_MODEL_TERM_SEMANTIC_ADMISSION_VALUES.includes(
    value as Nhm2ObserverModelTermSemanticAdmission,
  )
    ? (value as Nhm2ObserverModelTermSemanticAdmission)
    : "unknown";

const normalizeModelTermRouteAdmissionPromotionBasis = (
  value: unknown,
): Nhm2ObserverModelTermRouteAdmissionPromotionBasis =>
  NHM2_OBSERVER_MODEL_TERM_ROUTE_ADMISSION_PROMOTION_BASIS_VALUES.includes(
    value as Nhm2ObserverModelTermRouteAdmissionPromotionBasis,
  )
    ? (value as Nhm2ObserverModelTermRouteAdmissionPromotionBasis)
    : "unknown";

const normalizeModelTermSemanticDecision = (
  value: unknown,
): Nhm2ObserverModelTermSemanticDecision =>
  NHM2_OBSERVER_MODEL_TERM_SEMANTIC_DECISION_VALUES.includes(
    value as Nhm2ObserverModelTermSemanticDecision,
  )
    ? (value as Nhm2ObserverModelTermSemanticDecision)
    : "unknown";

const normalizeDecDominantViolationClass = (
  value: unknown,
): Nhm2ObserverDecDominantViolationClass =>
  NHM2_OBSERVER_DEC_DOMINANT_VIOLATION_CLASS_VALUES.includes(
    value as Nhm2ObserverDecDominantViolationClass,
  )
    ? (value as Nhm2ObserverDecDominantViolationClass)
    : "unknown";

const normalizeDecRecommendedPatchClass = (
  value: unknown,
): Nhm2ObserverDecRecommendedPatchClass =>
  NHM2_OBSERVER_DEC_RECOMMENDED_PATCH_CLASS_VALUES.includes(
    value as Nhm2ObserverDecRecommendedPatchClass,
  )
    ? (value as Nhm2ObserverDecRecommendedPatchClass)
    : "no_admissible_candidate_yet";

const normalizeDecPhysicsSelectionDecision = (
  value: unknown,
): Nhm2ObserverDecPhysicsSelectionDecision =>
  NHM2_OBSERVER_DEC_PHYSICS_SELECTION_DECISION_VALUES.includes(
    value as Nhm2ObserverDecPhysicsSelectionDecision,
  )
    ? (value as Nhm2ObserverDecPhysicsSelectionDecision)
    : "hold_baseline";

const normalizeDecPhysicsSelectionPlateauStatus = (
  value: unknown,
  fallback: Nhm2ObserverDecPhysicsSelectionPlateauStatus = "no_passing_candidate",
): Nhm2ObserverDecPhysicsSelectionPlateauStatus =>
  NHM2_OBSERVER_DEC_PHYSICS_SELECTION_PLATEAU_STATUS_VALUES.includes(
    value as Nhm2ObserverDecPhysicsSelectionPlateauStatus,
  )
    ? (value as Nhm2ObserverDecPhysicsSelectionPlateauStatus)
    : fallback;

const normalizeDecPhysicsSelectionReasonCodes = (
  value: unknown,
): Nhm2ObserverDecPhysicsSelectionReasonCode[] => {
  if (!Array.isArray(value)) return [];
  return unique(
    value.filter((entry): entry is Nhm2ObserverDecPhysicsSelectionReasonCode =>
      NHM2_OBSERVER_DEC_PHYSICS_SELECTION_REASON_CODE_VALUES.includes(
        entry as Nhm2ObserverDecPhysicsSelectionReasonCode,
      ),
    ),
  ).sort(
    (lhs, rhs) =>
      NHM2_OBSERVER_DEC_PHYSICS_SELECTION_REASON_CODE_VALUES.indexOf(lhs) -
      NHM2_OBSERVER_DEC_PHYSICS_SELECTION_REASON_CODE_VALUES.indexOf(rhs),
  );
};

const normalizeDecPhysicsSweepPhase = (
  value: unknown,
  fallback: Nhm2ObserverDecPhysicsSweepPhase = "coarse",
): Nhm2ObserverDecPhysicsSweepPhase =>
  NHM2_OBSERVER_DEC_PHYSICS_SWEEP_PHASE_VALUES.includes(
    value as Nhm2ObserverDecPhysicsSweepPhase,
  )
    ? (value as Nhm2ObserverDecPhysicsSweepPhase)
    : fallback;

const normalizeDecPhysicsUncertaintyTags = (
  value: unknown,
): Nhm2ObserverDecPhysicsUncertaintyTag[] => {
  if (!Array.isArray(value)) return [];
  return unique(
    value.filter((entry): entry is Nhm2ObserverDecPhysicsUncertaintyTag =>
      NHM2_OBSERVER_DEC_PHYSICS_UNCERTAINTY_TAG_VALUES.includes(
        entry as Nhm2ObserverDecPhysicsUncertaintyTag,
      ),
    ),
  ).sort(
    (lhs, rhs) =>
      NHM2_OBSERVER_DEC_PHYSICS_UNCERTAINTY_TAG_VALUES.indexOf(lhs) -
      NHM2_OBSERVER_DEC_PHYSICS_UNCERTAINTY_TAG_VALUES.indexOf(rhs),
  );
};

const normalizeDecResidualAttributionStatus = (
  value: unknown,
): Nhm2ObserverDecResidualAttributionStatus =>
  NHM2_OBSERVER_DEC_RESIDUAL_ATTRIBUTION_STATUS_VALUES.includes(
    value as Nhm2ObserverDecResidualAttributionStatus,
  )
    ? (value as Nhm2ObserverDecResidualAttributionStatus)
    : "unavailable";

const normalizeDecResidualPrimarySurface = (
  value: unknown,
  fallback: Nhm2ObserverDecResidualPrimarySurface = "unknown",
): Nhm2ObserverDecResidualPrimarySurface =>
  NHM2_OBSERVER_DEC_RESIDUAL_PRIMARY_SURFACE_VALUES.includes(
    value as Nhm2ObserverDecResidualPrimarySurface,
  )
    ? (value as Nhm2ObserverDecResidualPrimarySurface)
    : fallback;

const normalizeDecPhysicsRuntimeApplicationStatus = (
  value: unknown,
): Nhm2ObserverDecPhysicsRuntimeApplicationStatus =>
  NHM2_OBSERVER_DEC_PHYSICS_RUNTIME_APPLICATION_STATUS_VALUES.includes(
    value as Nhm2ObserverDecPhysicsRuntimeApplicationStatus,
  )
    ? (value as Nhm2ObserverDecPhysicsRuntimeApplicationStatus)
    : "not_attempted";

const normalizeDecPhysicsRuntimeFailureMode = (
  value: unknown,
  fallback: Nhm2ObserverDecPhysicsRuntimeFailureMode = "unknown",
): Nhm2ObserverDecPhysicsRuntimeFailureMode =>
  NHM2_OBSERVER_DEC_PHYSICS_RUNTIME_FAILURE_MODE_VALUES.includes(
    value as Nhm2ObserverDecPhysicsRuntimeFailureMode,
  )
    ? (value as Nhm2ObserverDecPhysicsRuntimeFailureMode)
    : fallback;

const normalizeDecPhysicsCrossZeroMethod = (
  value: unknown,
  fallback: Nhm2ObserverDecPhysicsCrossZeroMethod = "bounded_sweep_margin_analysis",
): Nhm2ObserverDecPhysicsCrossZeroMethod =>
  NHM2_OBSERVER_DEC_PHYSICS_CROSS_ZERO_METHOD_VALUES.includes(
    value as Nhm2ObserverDecPhysicsCrossZeroMethod,
  )
    ? (value as Nhm2ObserverDecPhysicsCrossZeroMethod)
    : fallback;

const normalizeDecPhysicsCrossZeroInferenceLabel = (
  value: unknown,
  fallback: Nhm2ObserverDecPhysicsCrossZeroInferenceLabel = "inference",
): Nhm2ObserverDecPhysicsCrossZeroInferenceLabel =>
  NHM2_OBSERVER_DEC_PHYSICS_CROSS_ZERO_INFERENCE_LABEL_VALUES.includes(
    value as Nhm2ObserverDecPhysicsCrossZeroInferenceLabel,
  )
    ? (value as Nhm2ObserverDecPhysicsCrossZeroInferenceLabel)
    : fallback;

const normalizeDecPhysicsZeroCrossFeasibilityDecision = (
  value: unknown,
  fallback: Nhm2ObserverDecPhysicsZeroCrossFeasibilityDecision = "unknown",
): Nhm2ObserverDecPhysicsZeroCrossFeasibilityDecision =>
  NHM2_OBSERVER_DEC_PHYSICS_ZERO_CROSS_FEASIBILITY_DECISION_VALUES.includes(
    value as Nhm2ObserverDecPhysicsZeroCrossFeasibilityDecision,
  )
    ? (value as Nhm2ObserverDecPhysicsZeroCrossFeasibilityDecision)
    : fallback;

const normalizeDecPhysicsZeroCrossReasonCodes = (
  value: unknown,
): Nhm2ObserverDecPhysicsZeroCrossReasonCode[] => {
  if (!Array.isArray(value)) return [];
  return unique(
    value.filter((entry): entry is Nhm2ObserverDecPhysicsZeroCrossReasonCode =>
      NHM2_OBSERVER_DEC_PHYSICS_ZERO_CROSS_REASON_CODE_VALUES.includes(
        entry as Nhm2ObserverDecPhysicsZeroCrossReasonCode,
      ),
    ),
  ).sort(
    (lhs, rhs) =>
      NHM2_OBSERVER_DEC_PHYSICS_ZERO_CROSS_REASON_CODE_VALUES.indexOf(lhs) -
      NHM2_OBSERVER_DEC_PHYSICS_ZERO_CROSS_REASON_CODE_VALUES.indexOf(rhs),
  );
};

const normalizeResearchClaimConfidenceLabel = (
  value: unknown,
): Nhm2ObserverResearchClaimConfidenceLabel =>
  NHM2_OBSERVER_RESEARCH_CLAIM_CONFIDENCE_LABEL_VALUES.includes(
    value as Nhm2ObserverResearchClaimConfidenceLabel,
  )
    ? (value as Nhm2ObserverResearchClaimConfidenceLabel)
    : "review";

const normalizeModelTermSemanticReasonCodes = (
  value: unknown,
): Nhm2ObserverModelTermSemanticReasonCode[] => {
  if (!Array.isArray(value)) return [];
  return unique(
    value.filter((entry): entry is Nhm2ObserverModelTermSemanticReasonCode =>
      NHM2_OBSERVER_MODEL_TERM_SEMANTIC_REASON_CODE_VALUES.includes(
        entry as Nhm2ObserverModelTermSemanticReasonCode,
      ),
    ),
  ).sort(
    (lhs, rhs) =>
      NHM2_OBSERVER_MODEL_TERM_SEMANTIC_REASON_CODE_VALUES.indexOf(lhs) -
      NHM2_OBSERVER_MODEL_TERM_SEMANTIC_REASON_CODE_VALUES.indexOf(rhs),
  );
};

const normalizeModelTermClosurePathDecision = (
  value: unknown,
): Nhm2ObserverModelTermClosurePathDecision | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const notes = Array.isArray(record.notes)
    ? record.notes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const citationRefs = Array.isArray(record.citationRefs)
    ? record.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  return {
    selectedPath: normalizeModelTermClosurePath(record.selectedPath),
    admPathStatus: normalizeModelTermSemanticCheckStatus(record.admPathStatus),
    fullEinsteinPathStatus: normalizeModelTermSemanticCheckStatus(
      record.fullEinsteinPathStatus,
    ),
    routeHint: normalizeModelTermClosureRouteHint(record.routeHint),
    nextPatchClass: normalizeModelTermClosureNextPatch(record.nextPatchClass),
    patchBriefRef: asText(record.patchBriefRef),
    rationale: asText(record.rationale),
    blockerCodes: normalizeModelTermSemanticReasonCodes(record.blockerCodes),
    nonBlockingCodes: normalizeModelTermSemanticReasonCodes(record.nonBlockingCodes),
    citationRefs: unique(citationRefs),
    notes,
  };
};

const normalizeModelTermSemanticAdmissionEvidence = (
  value: BuildNhm2ObserverAuditArtifactInput["modelTermSemanticAdmissionEvidence"],
): Nhm2ObserverModelTermSemanticAdmissionEvidence | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const checksInput = (value.checks ?? {}) as Record<string, unknown>;
  const einsteinRouteEvidenceInput = (value.einsteinTensorRouteEvidence ??
    null) as Record<string, unknown> | null;
  const residualAttributionInput = (value.einsteinResidualAttributionEvidence ??
    null) as Record<string, unknown> | null;
  const residualComponentInput = (residualAttributionInput?.componentResiduals ??
    null) as Record<string, unknown> | null;
  const residualSweepInput = Array.isArray(residualAttributionInput?.conventionSweep)
    ? residualAttributionInput?.conventionSweep
    : null;
  const evaluatorClosureInput = (value.einsteinEvaluatorClosureEvidence ??
    null) as Record<string, unknown> | null;
  const evaluatorResolutionInput = (evaluatorClosureInput?.resolutionSweep ??
    null) as Record<string, unknown> | null;
  const evaluatorCoarseResolutionInput = (evaluatorResolutionInput?.coarse ??
    null) as Record<string, unknown> | null;
  const evaluatorRefinedResolutionInput = (evaluatorResolutionInput?.refined ??
    null) as Record<string, unknown> | null;
  const evaluatorSuperRefinedResolutionInput = (evaluatorResolutionInput?.superRefined ??
    null) as Record<string, unknown> | null;
  const evaluatorOrderInput = (evaluatorClosureInput?.observedConvergenceOrder ??
    null) as Record<string, unknown> | null;
  const evaluatorRichardsonInput = (evaluatorClosureInput?.richardsonExtrapolatedResidual ??
    null) as Record<string, unknown> | null;
  const evaluatorSweepInput = Array.isArray(evaluatorClosureInput?.conventionSweep)
    ? evaluatorClosureInput?.conventionSweep
    : null;
  const evaluatorCitationRefs = Array.isArray(evaluatorClosureInput?.citationRefs)
    ? evaluatorClosureInput?.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const validationSuiteInput = (value.einsteinRouteValidationSuite ??
    null) as Record<string, unknown> | null;
  const validationSuiteCasesInput = Array.isArray(validationSuiteInput?.cases)
    ? validationSuiteInput?.cases
    : [];
  const validationSuiteCitationRefs = Array.isArray(validationSuiteInput?.citationRefs)
    ? validationSuiteInput?.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const closurePathDecision = normalizeModelTermClosurePathDecision(
    value.closurePathDecision,
  );
  const citationRefs = Array.isArray(value.citationRefs)
    ? value.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const notes = Array.isArray(value.notes)
    ? value.notes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const routeAdmissionFromInput = normalizeModelTermSemanticAdmission(
    value.routeAdmission,
  );
  const routeAdmissionRaw = normalizeModelTermSemanticAdmission(
    value.routeAdmissionRaw ?? routeAdmissionFromInput,
  );
  const routeAdmissionEffective = normalizeModelTermSemanticAdmission(
    value.routeAdmissionEffective ?? routeAdmissionFromInput,
  );
  const routeAdmissionPromotionBasis = normalizeModelTermRouteAdmissionPromotionBasis(
    value.routeAdmissionPromotionBasis ??
      (() => {
        if (
          routeAdmissionRaw === "experimental_not_admitted" &&
          routeAdmissionEffective === "admitted"
        ) {
          return "evidence_gate_promoted_full_einstein";
        }
        if (routeAdmissionRaw === "admitted") {
          return "producer_declared_admitted";
        }
        if (routeAdmissionRaw === "experimental_not_admitted") {
          return "evidence_gate_not_satisfied";
        }
        return "unknown";
      })(),
  );
  return {
    semanticsRef: asText(value.semanticsRef),
    researchBasisRef: asText(value.researchBasisRef),
    chartRef: asText(value.chartRef),
    routeId: asText(value.routeId),
    routeAdmissionRaw,
    routeAdmissionEffective,
    routeAdmissionPromotionBasis,
    routeAdmission: routeAdmissionEffective,
    decision: normalizeModelTermSemanticDecision(value.decision),
    reasonCodes: normalizeModelTermSemanticReasonCodes(value.reasonCodes),
    checks: {
      routeMetadata: normalizeModelTermSemanticCheckStatus(
        checksInput.routeMetadata,
      ),
      chart: normalizeModelTermSemanticCheckStatus(checksInput.chart),
      finiteTensorComponents: normalizeModelTermSemanticCheckStatus(
        checksInput.finiteTensorComponents,
      ),
      t0iSymmetry: normalizeModelTermSemanticCheckStatus(
        checksInput.t0iSymmetry,
      ),
      offDiagonalTijSymmetry: normalizeModelTermSemanticCheckStatus(
        checksInput.offDiagonalTijSymmetry,
      ),
      supportFieldRouteAdmission: normalizeModelTermSemanticCheckStatus(
        checksInput.supportFieldRouteAdmission,
      ),
      fullEinsteinTensorRouteAdmission: normalizeModelTermSemanticCheckStatus(
        checksInput.fullEinsteinTensorRouteAdmission,
      ),
      citationBasis: normalizeModelTermSemanticCheckStatus(
        checksInput.citationBasis,
      ),
      finiteDifferenceConvergence: normalizeModelTermSemanticCheckStatus(
        checksInput.finiteDifferenceConvergence,
      ),
      independentCrossCheck: normalizeModelTermSemanticCheckStatus(
        checksInput.independentCrossCheck,
      ),
      einsteinT00Comparability: normalizeModelTermSemanticCheckStatus(
        checksInput.einsteinT00Comparability,
      ),
      dtGammaAssumptionBounded: normalizeModelTermSemanticCheckStatus(
        checksInput.dtGammaAssumptionBounded,
      ),
      citationCoverage: normalizeModelTermSemanticCheckStatus(
        checksInput.citationCoverage,
      ),
    },
    einsteinTensorRouteEvidence:
      einsteinRouteEvidenceInput == null
        ? null
        : {
            status: normalizeModelTermEinsteinRouteStatus(
              einsteinRouteEvidenceInput.status,
            ),
            routeId: asText(einsteinRouteEvidenceInput.routeId),
            tensorSource: asText(einsteinRouteEvidenceInput.tensorSource),
            comparedSampleCount: toFinite(
              einsteinRouteEvidenceInput.comparedSampleCount,
            ),
            maxRelativeResidual: toFinite(
              einsteinRouteEvidenceInput.maxRelativeResidual,
            ),
            t00ComparedSampleCount: toFinite(
              einsteinRouteEvidenceInput.t00ComparedSampleCount,
            ),
            t00MaxRelativeResidual: toFinite(
              einsteinRouteEvidenceInput.t00MaxRelativeResidual,
            ),
            t00RelativeResidualThreshold: toFinite(
              einsteinRouteEvidenceInput.t00RelativeResidualThreshold,
            ),
            note: asText(einsteinRouteEvidenceInput.note),
          },
    einsteinResidualAttributionEvidence:
      residualAttributionInput == null
        ? null
        : {
            status: normalizeModelTermEinsteinRouteStatus(
              residualAttributionInput.status,
            ),
            sampleCount: toFinite(residualAttributionInput.sampleCount),
            maxRelativeResidual: toFinite(
              residualAttributionInput.maxRelativeResidual,
            ),
            componentResiduals: {
              T01: toFinite(residualComponentInput?.T01),
              T02: toFinite(residualComponentInput?.T02),
              T03: toFinite(residualComponentInput?.T03),
              T12: toFinite(residualComponentInput?.T12),
              T13: toFinite(residualComponentInput?.T13),
              T23: toFinite(residualComponentInput?.T23),
            },
            conventionSweep:
              residualSweepInput == null
                ? []
                : residualSweepInput
                    .filter(
                      (entry): entry is Record<string, unknown> =>
                        entry != null && typeof entry === "object",
                    )
                    .map((entry) => ({
                      candidateId: asText(entry.candidateId) ?? "unknown",
                      status: normalizeModelTermEinsteinRouteStatus(entry.status),
                      maxRelativeResidual: toFinite(entry.maxRelativeResidual),
                      note: asText(entry.note),
                    })),
            bestCandidateId: asText(residualAttributionInput.bestCandidateId),
            bestCandidateResidual: toFinite(
              residualAttributionInput.bestCandidateResidual,
            ),
            diagnosisClass: normalizeModelTermResidualDiagnosisClass(
              residualAttributionInput.diagnosisClass,
            ),
            note: asText(residualAttributionInput.note),
          },
    einsteinEvaluatorClosureEvidence:
      evaluatorClosureInput == null
        ? null
        : {
            status: normalizeModelTermEinsteinRouteStatus(
              evaluatorClosureInput.status,
            ),
            chartRef: asText(evaluatorClosureInput.chartRef),
            routeId: asText(evaluatorClosureInput.routeId),
            unitConvention: asText(evaluatorClosureInput.unitConvention),
            signConvention: asText(evaluatorClosureInput.signConvention),
            resolutionSweep: {
              coarse: {
                step_m: toFinite(evaluatorCoarseResolutionInput?.step_m),
                comparedSampleCount: toFinite(
                  evaluatorCoarseResolutionInput?.comparedSampleCount,
                ),
                t0iMaxRelativeResidual: toFinite(
                  evaluatorCoarseResolutionInput?.t0iMaxRelativeResidual,
                ),
                offDiagonalMaxRelativeResidual: toFinite(
                  evaluatorCoarseResolutionInput?.offDiagonalMaxRelativeResidual,
                ),
              },
              refined: {
                step_m: toFinite(evaluatorRefinedResolutionInput?.step_m),
                comparedSampleCount: toFinite(
                  evaluatorRefinedResolutionInput?.comparedSampleCount,
                ),
                t0iMaxRelativeResidual: toFinite(
                  evaluatorRefinedResolutionInput?.t0iMaxRelativeResidual,
                ),
                offDiagonalMaxRelativeResidual: toFinite(
                  evaluatorRefinedResolutionInput?.offDiagonalMaxRelativeResidual,
                ),
              },
              superRefined: {
                step_m: toFinite(evaluatorSuperRefinedResolutionInput?.step_m),
                comparedSampleCount: toFinite(
                  evaluatorSuperRefinedResolutionInput?.comparedSampleCount,
                ),
                t0iMaxRelativeResidual: toFinite(
                  evaluatorSuperRefinedResolutionInput?.t0iMaxRelativeResidual,
                ),
                offDiagonalMaxRelativeResidual: toFinite(
                  evaluatorSuperRefinedResolutionInput?.offDiagonalMaxRelativeResidual,
                ),
              },
            },
            observedConvergenceOrder: {
              t0i: toFinite(evaluatorOrderInput?.t0i),
              offDiagonal: toFinite(evaluatorOrderInput?.offDiagonal),
            },
            richardsonExtrapolatedResidual: {
              t0i: toFinite(evaluatorRichardsonInput?.t0i),
              offDiagonal: toFinite(evaluatorRichardsonInput?.offDiagonal),
            },
            conventionSweep:
              evaluatorSweepInput == null
                ? []
                : evaluatorSweepInput
                    .filter(
                      (entry): entry is Record<string, unknown> =>
                        entry != null && typeof entry === "object",
                    )
                    .map((entry) => ({
                      candidateId: asText(entry.candidateId) ?? "unknown",
                      status: normalizeModelTermEinsteinRouteStatus(entry.status),
                      maxRelativeResidual: toFinite(entry.maxRelativeResidual),
                      note: asText(entry.note),
                    })),
            bestCandidateId: asText(evaluatorClosureInput.bestCandidateId),
            diagnosisClass: normalizeModelTermResidualDiagnosisClass(
              evaluatorClosureInput.diagnosisClass,
            ),
            note: asText(evaluatorClosureInput.note),
            citationRefs: unique(evaluatorCitationRefs),
          },
    einsteinRouteValidationSuite:
      validationSuiteInput == null
        ? null
        : {
            status: normalizeModelTermSemanticCheckStatus(
              validationSuiteInput.status,
            ),
            admittedForRoutePass:
              toNullableBoolean(validationSuiteInput.admittedForRoutePass) ??
              false,
            residualThreshold: toFinite(validationSuiteInput.residualThreshold),
            evaluatedCaseCount:
              Math.max(
                0,
                Math.trunc(toFinite(validationSuiteInput.evaluatedCaseCount) ?? 0),
              ) || 0,
            passedCaseCount:
              Math.max(
                0,
                Math.trunc(toFinite(validationSuiteInput.passedCaseCount) ?? 0),
              ) || 0,
            cases: validationSuiteCasesInput
              .filter(
                (entry): entry is Record<string, unknown> =>
                  entry != null && typeof entry === "object",
              )
              .map((entry) => ({
                caseId: NHM2_OBSERVER_MODEL_TERM_EINSTEIN_VALIDATION_CASE_VALUES.includes(
                  entry.caseId as Nhm2ObserverModelTermEinsteinValidationCaseId,
                )
                  ? (entry.caseId as Nhm2ObserverModelTermEinsteinValidationCaseId)
                  : "minkowski_zero_shift",
                status: normalizeModelTermSemanticCheckStatus(entry.status),
                maxAbsResidual: toFinite(entry.maxAbsResidual),
                expectedNearZero: toNullableBoolean(entry.expectedNearZero) ?? true,
                note: asText(entry.note),
                citationRefs: Array.isArray(entry.citationRefs)
                  ? unique(
                      entry.citationRefs
                        .map((citation) => asText(citation))
                        .filter((citation): citation is string => citation != null),
                    )
                  : [],
              })),
            note: asText(validationSuiteInput.note),
            citationRefs: unique(validationSuiteCitationRefs),
          },
    closurePathDecision,
    citationRefs: unique(citationRefs),
    notes,
  };
};

const normalizeObserverDecRemediationEvidence = (
  value: BuildNhm2ObserverAuditArtifactInput["observerDecRemediationEvidence"],
): Nhm2ObserverDecRemediationEvidence | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const citationRefs = Array.isArray(value.citationRefs)
    ? value.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const notes = Array.isArray(value.notes)
    ? value.notes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  return {
    chartRef: asText(value.chartRef),
    routeId: asText(value.routeId),
    selectedPath:
      value.selectedPath != null
        ? normalizeModelTermClosurePath(value.selectedPath)
        : null,
    rapidityCap: toFinite(value.rapidityCap),
    rapidityCapBeta: toFinite(value.rapidityCapBeta),
    metricDecEulerianMin: toFinite(value.metricDecEulerianMin),
    metricDecRobustMin: toFinite(value.metricDecRobustMin),
    tileReconstitutedDecEulerianMin: toFinite(
      value.tileReconstitutedDecEulerianMin,
    ),
    tileReconstitutedDecRobustMin: toFinite(value.tileReconstitutedDecRobustMin),
    typeIFractionMetric: toFinite(value.typeIFractionMetric),
    typeIFractionTileReconstituted: toFinite(value.typeIFractionTileReconstituted),
    dominantViolationClass: normalizeDecDominantViolationClass(
      value.dominantViolationClass,
    ),
    recommendedPatchClass: normalizeDecRecommendedPatchClass(
      value.recommendedPatchClass,
    ),
    citationRefs: unique(citationRefs),
    notes,
  };
};

const normalizeObserverDecPhysicsControlEvidence = (
  value: BuildNhm2ObserverAuditArtifactInput["observerDecPhysicsControlEvidence"],
): Nhm2ObserverDecPhysicsControlEvidence | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const baselineInput = (value.baseline ?? {}) as Record<string, unknown>;
  const candidateInput = (value.candidate ?? {}) as Record<string, unknown>;
  const deltasInput = (value.deltas ?? {}) as Record<string, unknown>;
  const guardChecksInput = (value.guardChecks ?? {}) as Record<string, unknown>;
  const sweepCandidatesInput = Array.isArray(value.sweepCandidates)
    ? value.sweepCandidates
    : [];
  const sweepPhaseSummaryInput = (value.sweepPhaseSummary ?? {}) as Record<
    string,
    unknown
  >;
  const topCandidateLeaderboardInput = Array.isArray(value.topCandidateLeaderboard)
    ? value.topCandidateLeaderboard
    : [];
  const crossZeroFeasibilityInput = (value.crossZeroFeasibilityEvidence ?? {}) as Record<
    string,
    unknown
  >;
  const crossZeroBoundedEnvelopeInput = (crossZeroFeasibilityInput.boundedControlEnvelope ??
    {}) as Record<string, unknown>;
  const crossZeroEvaluationRouteInput = (crossZeroFeasibilityInput.evaluationRoute ??
    {}) as Record<string, unknown>;
  const boundedSearchEnvelopeInput = (value.boundedSearchEnvelope ??
    crossZeroBoundedEnvelopeInput ??
    {}) as Record<string, unknown>;
  const crossZeroResidualMargin = toFinite(
    crossZeroFeasibilityInput.residualMarginToZero,
  );
  const crossZeroAchievedLift = toFinite(
    crossZeroFeasibilityInput.achievedLiftFromBaseline,
  );
  const crossZeroBestAchievedLift =
    toFinite(crossZeroFeasibilityInput.bestAchievedLift) ??
    crossZeroAchievedLift;
  const crossZeroGapToZero =
    toFinite(crossZeroFeasibilityInput.gapToZero) ??
    (crossZeroResidualMargin != null ? Math.max(0, -crossZeroResidualMargin) : null);
  const nonRegressionGateInput = (value.nonRegressionGate ??
    {}) as Record<string, unknown>;
  const runtimeApplicationInput = (value.runtimeApplication ??
    {}) as Record<string, unknown>;
  const runtimeApplicationStatus = normalizeDecPhysicsRuntimeApplicationStatus(
    runtimeApplicationInput.status,
  );
  const runtimeFailureFallback: Nhm2ObserverDecPhysicsRuntimeFailureMode =
    runtimeApplicationStatus === "applied"
      ? "none"
      : runtimeApplicationStatus === "not_attempted"
        ? "not_attempted"
        : "unknown";
  const runtimeGuardChecksInput = (runtimeApplicationInput.guardChecks ??
    {}) as Record<string, unknown>;
  const runtimeObservedInput = (runtimeApplicationInput.observed ??
    {}) as Record<string, unknown>;
  const runtimeComparabilityGateInput = (runtimeApplicationInput.comparabilityGate ??
    {}) as Record<string, unknown>;
  const controlKnobsInput = Array.isArray(value.controlKnobs)
    ? value.controlKnobs
    : [];
  const claimCitationMapInput = Array.isArray(value.claimCitationMap)
    ? value.claimCitationMap
    : [];
  const claimCitationMapCompletenessInput = (value.claimCitationMapCompleteness ??
    {}) as Record<string, unknown>;
  const decCoupledControlEvidenceInput = (value.decCoupledControlEvidence ??
    {}) as Record<string, unknown>;
  const decCoupledBoundedEnvelopeInput = (decCoupledControlEvidenceInput.boundedEnvelope ??
    {}) as Record<string, unknown>;
  const decCoupledCandidateEvaluationTableInput = Array.isArray(
    decCoupledControlEvidenceInput.candidateEvaluationTable,
  )
    ? decCoupledControlEvidenceInput.candidateEvaluationTable
    : [];
  const decCoupledComparabilityGateInput = (decCoupledControlEvidenceInput.comparabilityGate ??
    {}) as Record<string, unknown>;
  const decCoupledResearchClaimsInput = Array.isArray(
    decCoupledControlEvidenceInput.researchClaims,
  )
    ? decCoupledControlEvidenceInput.researchClaims
    : [];
  const citationRefs = Array.isArray(value.citationRefs)
    ? value.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const derivationNotes = Array.isArray(value.derivationNotes)
    ? value.derivationNotes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const uncertaintyNotes = Array.isArray(value.uncertaintyNotes)
    ? value.uncertaintyNotes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const uncertaintyTags = normalizeDecPhysicsUncertaintyTags(value.uncertaintyTags);
  const crossZeroInferenceFallback: Nhm2ObserverDecPhysicsCrossZeroInferenceLabel =
    uncertaintyTags.includes("direct_measurement") &&
    uncertaintyTags.includes("inference")
      ? "mixed"
      : uncertaintyTags.includes("direct_measurement")
        ? "direct_measurement"
        : "inference";
  const crossZeroCitationRefs = Array.isArray(crossZeroFeasibilityInput.citationRefs)
    ? crossZeroFeasibilityInput.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const crossZeroNotes = Array.isArray(crossZeroFeasibilityInput.notes)
    ? crossZeroFeasibilityInput.notes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const decResidualAttributionInput = (value.decResidualAttributionEvidence ??
    {}) as Record<string, unknown>;
  const decResidualSelectedCandidateInput = (decResidualAttributionInput.selectedCandidate ??
    {}) as Record<string, unknown>;
  const decResidualAttributionCitationRefs = Array.isArray(
    decResidualAttributionInput.citationRefs,
  )
    ? decResidualAttributionInput.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const decResidualAttributionNotes = Array.isArray(
    decResidualAttributionInput.notes,
  )
    ? decResidualAttributionInput.notes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const decResidualAttributionEvidence =
    value.decResidualAttributionEvidence == null
      ? undefined
      : {
          status: normalizeDecResidualAttributionStatus(
            decResidualAttributionInput.status,
          ),
          primarySurface: normalizeDecResidualPrimarySurface(
            decResidualAttributionInput.primarySurface,
          ),
          dominantViolationClass: normalizeDecDominantViolationClass(
            decResidualAttributionInput.dominantViolationClass,
          ),
          baselinePrimaryMargin: toFinite(
            decResidualAttributionInput.baselinePrimaryMargin,
          ),
          selectedPrimaryMargin: toFinite(
            decResidualAttributionInput.selectedPrimaryMargin,
          ),
          requiredLiftToZero: toFinite(decResidualAttributionInput.requiredLiftToZero),
          achievedLiftFromBaseline: toFinite(
            decResidualAttributionInput.achievedLiftFromBaseline,
          ),
          residualMarginToZero: toFinite(
            decResidualAttributionInput.residualMarginToZero,
          ),
          gapToZero: toFinite(decResidualAttributionInput.gapToZero),
          selectionPlateauStatus: normalizeDecPhysicsSelectionPlateauStatus(
            decResidualAttributionInput.selectionPlateauStatus,
          ),
          selectionReasonCodes: normalizeDecPhysicsSelectionReasonCodes(
            decResidualAttributionInput.selectionReasonCodes,
          ),
          zeroCrossFeasibilityDecision:
            normalizeDecPhysicsZeroCrossFeasibilityDecision(
              decResidualAttributionInput.zeroCrossFeasibilityDecision,
            ),
          rankingBasis: asText(decResidualAttributionInput.rankingBasis),
          selectedCandidate: {
            candidateId: asText(decResidualSelectedCandidateInput.candidateId),
            candidateClass:
              decResidualSelectedCandidateInput.candidateClass === "baseline_hold" ||
              decResidualSelectedCandidateInput.candidateClass ===
                "observer_domain_truncation" ||
              decResidualSelectedCandidateInput.candidateClass ===
                "physics_control_proposal"
                ? decResidualSelectedCandidateInput.candidateClass
                : null,
            sweepPhase:
              decResidualSelectedCandidateInput.sweepPhase == null
                ? null
                : normalizeDecPhysicsSweepPhase(
                    decResidualSelectedCandidateInput.sweepPhase,
                  ),
            metricDecRobustMarginToZero: toFinite(
              decResidualSelectedCandidateInput.metricDecRobustMarginToZero,
            ),
            tileReconstitutedDecRobustMarginToZero: toFinite(
              decResidualSelectedCandidateInput.tileReconstitutedDecRobustMarginToZero,
            ),
            metricDecRobustLift: toFinite(
              decResidualSelectedCandidateInput.metricDecRobustLift,
            ),
            tileReconstitutedDecRobustLift: toFinite(
              decResidualSelectedCandidateInput.tileReconstitutedDecRobustLift,
            ),
            controlDeviationMagnitude: toFinite(
              decResidualSelectedCandidateInput.controlDeviationMagnitude,
            ),
          },
          citationRefs: unique(decResidualAttributionCitationRefs),
          notes: decResidualAttributionNotes,
        };
  const zeroCrossDecisionFallback: Nhm2ObserverDecPhysicsZeroCrossFeasibilityDecision =
    toNullableBoolean(crossZeroFeasibilityInput.crossZeroAchieved) === true
      ? "zero_cross_achieved"
      : crossZeroResidualMargin != null && crossZeroResidualMargin < 0
        ? "zero_cross_not_achievable_within_bounds"
        : "unknown";
  const zeroCrossReasonCodes = normalizeDecPhysicsZeroCrossReasonCodes(
    value.zeroCrossFeasibilityReasonCodes,
  );
  const claimCitationMapExpectedIds = claimCitationMapInput
    .filter(
      (entry): entry is Record<string, unknown> =>
        entry != null && typeof entry === "object",
    )
    .map((entry) => asText(entry.claimId))
    .filter((entry): entry is string => entry != null);
  const claimCitationMapMissingIds = Array.isArray(
    claimCitationMapCompletenessInput.missingClaimIds,
  )
    ? unique(
        claimCitationMapCompletenessInput.missingClaimIds
          .map((entry) => asText(entry))
          .filter((entry): entry is string => entry != null),
      )
    : [];
  const sweepCandidates = sweepCandidatesInput
    .filter(
      (entry): entry is Record<string, unknown> =>
        entry != null && typeof entry === "object",
    )
    .map((entry) => {
      const candidateGuardChecksInput = (entry.guardChecks ??
        {}) as Record<string, unknown>;
      const candidateClass =
        entry.candidateClass === "baseline_hold" ||
        entry.candidateClass === "observer_domain_truncation" ||
        entry.candidateClass === "physics_control_proposal"
          ? entry.candidateClass
          : ("physics_control_proposal" as const);
      return {
        candidateId: asText(entry.candidateId) ?? "unknown_candidate",
        candidateClass,
        sweepPhase: normalizeDecPhysicsSweepPhase(
          entry.sweepPhase,
          candidateClass === "baseline_hold" ? "baseline" : "coarse",
        ),
        refineSeedCandidateId: asText(entry.refineSeedCandidateId),
        applied: toNullableBoolean(entry.applied) ?? false,
        rapidityCap: toFinite(entry.rapidityCap),
        rapidityCapBeta: toFinite(entry.rapidityCapBeta),
        pressureScale: toFinite(entry.pressureScale),
        densityLiftFraction: toFinite(entry.densityLiftFraction),
        fluxScale: toFinite(entry.fluxScale),
        shearScale: toFinite(entry.shearScale),
        metricDecRobustMin: toFinite(entry.metricDecRobustMin),
        tileReconstitutedDecRobustMin: toFinite(
          entry.tileReconstitutedDecRobustMin,
        ),
        metricWecRobustMin: toFinite(entry.metricWecRobustMin),
        metricNecRobustMin: toFinite(entry.metricNecRobustMin),
        metricDecRobustLift: toFinite(entry.metricDecRobustLift),
        tileReconstitutedDecRobustLift: toFinite(
          entry.tileReconstitutedDecRobustLift,
        ),
        metricWecRobustDelta: toFinite(entry.metricWecRobustDelta),
        metricNecRobustDelta: toFinite(entry.metricNecRobustDelta),
        metricDecRobustMarginToZero: toFinite(
          entry.metricDecRobustMarginToZero,
        ),
        tileReconstitutedDecRobustMarginToZero: toFinite(
          entry.tileReconstitutedDecRobustMarginToZero,
        ),
        crossesZeroBothDecMargins:
          toNullableBoolean(entry.crossesZeroBothDecMargins) ?? null,
        metricWecNonRegressionMargin: toFinite(
          entry.metricWecNonRegressionMargin,
        ),
        metricNecNonRegressionMargin: toFinite(
          entry.metricNecNonRegressionMargin,
        ),
        selectionObjectivePrimaryMargin: toFinite(
          entry.selectionObjectivePrimaryMargin,
        ),
        controlDeviationMagnitude: toFinite(entry.controlDeviationMagnitude),
        guardChecks: {
          metricWecNonRegression:
            toNullableBoolean(candidateGuardChecksInput.metricWecNonRegression) ??
            null,
          metricNecNonRegression:
            toNullableBoolean(candidateGuardChecksInput.metricNecNonRegression) ??
            null,
          emissionAdmissionStable:
            toNullableBoolean(candidateGuardChecksInput.emissionAdmissionStable) ??
            null,
          semanticAdmissionStable:
            toNullableBoolean(candidateGuardChecksInput.semanticAdmissionStable) ??
            null,
        },
        passesSelectionGate: toNullableBoolean(entry.passesSelectionGate) ?? false,
        gateFailureReasons: normalizeDecPhysicsSelectionReasonCodes(
          entry.gateFailureReasons,
        ),
        note: asText(entry.note),
      };
    });
  return {
    chartRef: asText(value.chartRef),
    routeId: asText(value.routeId),
    selectedPath:
      value.selectedPath != null
        ? normalizeModelTermClosurePath(value.selectedPath)
        : null,
    baseline: {
      metricDecEulerianMin: toFinite(baselineInput.metricDecEulerianMin),
      metricDecRobustMin: toFinite(baselineInput.metricDecRobustMin),
      metricWecEulerianMin: toFinite(baselineInput.metricWecEulerianMin),
      metricWecRobustMin: toFinite(baselineInput.metricWecRobustMin),
      metricNecEulerianMin: toFinite(baselineInput.metricNecEulerianMin),
      metricNecRobustMin: toFinite(baselineInput.metricNecRobustMin),
      tileReconstitutedDecEulerianMin: toFinite(
        baselineInput.tileReconstitutedDecEulerianMin,
      ),
      tileReconstitutedDecRobustMin: toFinite(
        baselineInput.tileReconstitutedDecRobustMin,
      ),
      tileReconstitutedWecEulerianMin: toFinite(
        baselineInput.tileReconstitutedWecEulerianMin,
      ),
      tileReconstitutedWecRobustMin: toFinite(
        baselineInput.tileReconstitutedWecRobustMin,
      ),
      tileReconstitutedNecEulerianMin: toFinite(
        baselineInput.tileReconstitutedNecEulerianMin,
      ),
      tileReconstitutedNecRobustMin: toFinite(
        baselineInput.tileReconstitutedNecRobustMin,
      ),
    },
    candidate: {
      candidateId: asText(candidateInput.candidateId),
      applied: toNullableBoolean(candidateInput.applied) ?? false,
      metricDecEulerianMin: toFinite(candidateInput.metricDecEulerianMin),
      metricDecRobustMin: toFinite(candidateInput.metricDecRobustMin),
      metricWecEulerianMin: toFinite(candidateInput.metricWecEulerianMin),
      metricWecRobustMin: toFinite(candidateInput.metricWecRobustMin),
      metricNecEulerianMin: toFinite(candidateInput.metricNecEulerianMin),
      metricNecRobustMin: toFinite(candidateInput.metricNecRobustMin),
      tileReconstitutedDecEulerianMin: toFinite(
        candidateInput.tileReconstitutedDecEulerianMin,
      ),
      tileReconstitutedDecRobustMin: toFinite(
        candidateInput.tileReconstitutedDecRobustMin,
      ),
      tileReconstitutedWecEulerianMin: toFinite(
        candidateInput.tileReconstitutedWecEulerianMin,
      ),
      tileReconstitutedWecRobustMin: toFinite(
        candidateInput.tileReconstitutedWecRobustMin,
      ),
      tileReconstitutedNecEulerianMin: toFinite(
        candidateInput.tileReconstitutedNecEulerianMin,
      ),
      tileReconstitutedNecRobustMin: toFinite(
        candidateInput.tileReconstitutedNecRobustMin,
      ),
    },
    deltas: {
      metricDecRobustLift: toFinite(deltasInput.metricDecRobustLift),
      tileReconstitutedDecRobustLift: toFinite(
        deltasInput.tileReconstitutedDecRobustLift,
      ),
      metricWecRobustDelta: toFinite(deltasInput.metricWecRobustDelta),
      metricNecRobustDelta: toFinite(deltasInput.metricNecRobustDelta),
    },
    guardChecks: {
      metricWecNonRegression:
        toNullableBoolean(guardChecksInput.metricWecNonRegression) ?? null,
      metricNecNonRegression:
        toNullableBoolean(guardChecksInput.metricNecNonRegression) ?? null,
      emissionAdmissionStable:
        toNullableBoolean(guardChecksInput.emissionAdmissionStable) ?? null,
      semanticAdmissionStable:
        toNullableBoolean(guardChecksInput.semanticAdmissionStable) ?? null,
    },
    sweepCandidates,
    sweepPhaseSummary: {
      coarseCandidateCount: toFinite(sweepPhaseSummaryInput.coarseCandidateCount),
      coarsePassingCount: toFinite(sweepPhaseSummaryInput.coarsePassingCount),
      refineCandidateCount: toFinite(sweepPhaseSummaryInput.refineCandidateCount),
      refinePassingCount: toFinite(sweepPhaseSummaryInput.refinePassingCount),
      refineSeedCandidateIds: Array.isArray(
        sweepPhaseSummaryInput.refineSeedCandidateIds,
      )
        ? unique(
            sweepPhaseSummaryInput.refineSeedCandidateIds
              .map((entry) => asText(entry))
              .filter((entry): entry is string => entry != null),
          )
        : [],
      note: asText(sweepPhaseSummaryInput.note),
    },
    topCandidateLeaderboard: topCandidateLeaderboardInput
      .filter(
        (entry): entry is Record<string, unknown> =>
          entry != null && typeof entry === "object",
      )
      .map((entry) => ({
        rank: Math.max(1, Math.trunc(toFinite(entry.rank) ?? 1)),
        candidateId: asText(entry.candidateId) ?? "unknown_candidate",
        candidateClass:
          entry.candidateClass === "baseline_hold" ||
          entry.candidateClass === "observer_domain_truncation" ||
          entry.candidateClass === "physics_control_proposal"
            ? entry.candidateClass
            : ("physics_control_proposal" as const),
        sweepPhase: normalizeDecPhysicsSweepPhase(entry.sweepPhase, "coarse"),
        passesSelectionGate: toNullableBoolean(entry.passesSelectionGate) ?? false,
        crossesZeroBothDecMargins:
          toNullableBoolean(entry.crossesZeroBothDecMargins) ?? null,
        selectionObjectivePrimaryMargin: toFinite(
          entry.selectionObjectivePrimaryMargin,
        ),
        metricDecRobustLift: toFinite(entry.metricDecRobustLift),
        tileReconstitutedDecRobustLift: toFinite(
          entry.tileReconstitutedDecRobustLift,
        ),
        controlDeviationMagnitude: toFinite(entry.controlDeviationMagnitude),
      })),
    selectionObjective: asText(value.selectionObjective),
    selectedCandidateId: asText(value.selectedCandidateId),
    selectionDecision: normalizeDecPhysicsSelectionDecision(value.selectionDecision),
    selectionPlateauStatus: normalizeDecPhysicsSelectionPlateauStatus(
      value.selectionPlateauStatus,
      "no_passing_candidate",
    ),
    crossZeroFeasibilityEvidence: {
      baselinePrimaryMargin: toFinite(crossZeroFeasibilityInput.baselinePrimaryMargin),
      bestCandidatePrimaryMargin: toFinite(
        crossZeroFeasibilityInput.bestCandidatePrimaryMargin,
      ),
      requiredLiftToZero: toFinite(crossZeroFeasibilityInput.requiredLiftToZero),
      achievedLiftFromBaseline: crossZeroAchievedLift,
      bestAchievedLift: crossZeroBestAchievedLift,
      residualMarginToZero: crossZeroResidualMargin,
      gapToZero: crossZeroGapToZero,
      crossZeroAchieved:
        toNullableBoolean(crossZeroFeasibilityInput.crossZeroAchieved) ?? null,
      boundedControlEnvelope: {
        pressureScaleMin: toFinite(crossZeroBoundedEnvelopeInput.pressureScaleMin),
        pressureScaleMax: toFinite(crossZeroBoundedEnvelopeInput.pressureScaleMax),
        densityLiftMin: toFinite(crossZeroBoundedEnvelopeInput.densityLiftMin),
        densityLiftMax: toFinite(crossZeroBoundedEnvelopeInput.densityLiftMax),
        fluxScaleMin: toFinite(crossZeroBoundedEnvelopeInput.fluxScaleMin),
        fluxScaleMax: toFinite(crossZeroBoundedEnvelopeInput.fluxScaleMax),
        shearScaleMin: toFinite(crossZeroBoundedEnvelopeInput.shearScaleMin),
        shearScaleMax: toFinite(crossZeroBoundedEnvelopeInput.shearScaleMax),
      },
      evaluationRoute: {
        chartRef: asText(crossZeroEvaluationRouteInput.chartRef),
        routeId: asText(crossZeroEvaluationRouteInput.routeId),
        selectedPath:
          crossZeroEvaluationRouteInput.selectedPath != null
            ? normalizeModelTermClosurePath(
                crossZeroEvaluationRouteInput.selectedPath,
              )
            : null,
        independentCrossCheckStatus: normalizeModelTermSemanticCheckStatus(
          crossZeroEvaluationRouteInput.independentCrossCheckStatus,
        ),
        runtimeComparabilityPass:
          toNullableBoolean(crossZeroEvaluationRouteInput.runtimeComparabilityPass) ??
          null,
      },
      method: normalizeDecPhysicsCrossZeroMethod(crossZeroFeasibilityInput.method),
      inferenceLabel: normalizeDecPhysicsCrossZeroInferenceLabel(
        crossZeroFeasibilityInput.inferenceLabel,
        crossZeroInferenceFallback,
      ),
      citationRefs: unique(crossZeroCitationRefs),
      notes: crossZeroNotes,
    },
    decResidualAttributionEvidence,
    zeroCrossFeasibilityDecision: normalizeDecPhysicsZeroCrossFeasibilityDecision(
      value.zeroCrossFeasibilityDecision,
      zeroCrossDecisionFallback,
    ),
    zeroCrossFeasibilityReasonCodes:
      zeroCrossReasonCodes.length > 0 ? zeroCrossReasonCodes : ["unknown"],
    boundedSearchEnvelope: {
      pressureScaleMin: toFinite(boundedSearchEnvelopeInput.pressureScaleMin),
      pressureScaleMax: toFinite(boundedSearchEnvelopeInput.pressureScaleMax),
      densityLiftMin: toFinite(boundedSearchEnvelopeInput.densityLiftMin),
      densityLiftMax: toFinite(boundedSearchEnvelopeInput.densityLiftMax),
      fluxScaleMin: toFinite(boundedSearchEnvelopeInput.fluxScaleMin),
      fluxScaleMax: toFinite(boundedSearchEnvelopeInput.fluxScaleMax),
      shearScaleMin: toFinite(boundedSearchEnvelopeInput.shearScaleMin),
      shearScaleMax: toFinite(boundedSearchEnvelopeInput.shearScaleMax),
      coarsePressureStep: toFinite(boundedSearchEnvelopeInput.coarsePressureStep),
      coarseDensityLiftStep: toFinite(
        boundedSearchEnvelopeInput.coarseDensityLiftStep,
      ),
      coarseFluxScaleStep: toFinite(boundedSearchEnvelopeInput.coarseFluxScaleStep),
      coarseShearScaleStep: toFinite(
        boundedSearchEnvelopeInput.coarseShearScaleStep,
      ),
      refinePressureStep: toFinite(boundedSearchEnvelopeInput.refinePressureStep),
      refineDensityLiftStep: toFinite(
        boundedSearchEnvelopeInput.refineDensityLiftStep,
      ),
      refineFluxScaleStep: toFinite(boundedSearchEnvelopeInput.refineFluxScaleStep),
      refineShearScaleStep: toFinite(
        boundedSearchEnvelopeInput.refineShearScaleStep,
      ),
      coarseCandidateCount: toFinite(boundedSearchEnvelopeInput.coarseCandidateCount),
      refineCandidateCount: toFinite(boundedSearchEnvelopeInput.refineCandidateCount),
      refineSeedCount: toFinite(boundedSearchEnvelopeInput.refineSeedCount),
      observerDomainFixed:
        toNullableBoolean(boundedSearchEnvelopeInput.observerDomainFixed) ?? true,
    },
    selectionReasonCodes: normalizeDecPhysicsSelectionReasonCodes(
      value.selectionReasonCodes,
    ),
    nonRegressionGate: {
      required: Array.isArray(nonRegressionGateInput.required)
        ? unique(
            nonRegressionGateInput.required
              .map((entry) => asText(entry))
              .filter((entry): entry is string => entry != null),
          )
        : [],
      pass: toNullableBoolean(nonRegressionGateInput.pass) ?? false,
      note: asText(nonRegressionGateInput.note),
    },
    runtimeApplication: {
      attempted: toNullableBoolean(runtimeApplicationInput.attempted) ?? false,
      enabled: toNullableBoolean(runtimeApplicationInput.enabled) ?? false,
      status: runtimeApplicationStatus,
      failureMode: normalizeDecPhysicsRuntimeFailureMode(
        runtimeApplicationInput.failureMode,
        runtimeFailureFallback,
      ),
      evaluationComparable:
        toNullableBoolean(runtimeApplicationInput.evaluationComparable) ?? false,
      sampleCount: toFinite(runtimeApplicationInput.sampleCount),
      comparableSampleCount: toFinite(runtimeApplicationInput.comparableSampleCount),
      minimumComparableSampleCount: toFinite(
        runtimeApplicationInput.minimumComparableSampleCount,
      ),
      sampleCountSufficient:
        toNullableBoolean(runtimeApplicationInput.sampleCountSufficient) ?? null,
      referenceRouteId: asText(runtimeApplicationInput.referenceRouteId),
      selectedRouteId: asText(runtimeApplicationInput.selectedRouteId),
      selectedPath:
        runtimeApplicationInput.selectedPath != null
          ? normalizeModelTermClosurePath(runtimeApplicationInput.selectedPath)
          : null,
      candidateId: asText(runtimeApplicationInput.candidateId),
      comparabilityGate: {
        chartRef: asText(runtimeComparabilityGateInput.chartRef),
        chartParity: toNullableBoolean(runtimeComparabilityGateInput.chartParity),
        selectedPathParity: toNullableBoolean(
          runtimeComparabilityGateInput.selectedPathParity,
        ),
        independentCrossCheckStatus: normalizeModelTermSemanticCheckStatus(
          runtimeComparabilityGateInput.independentCrossCheckStatus,
        ),
        pass: toNullableBoolean(runtimeComparabilityGateInput.pass) ?? false,
        note: asText(runtimeComparabilityGateInput.note),
      },
      rollbackReasonCodes: normalizeDecPhysicsSelectionReasonCodes(
        runtimeApplicationInput.rollbackReasonCodes,
      ),
      guardChecks: {
        metricWecNonRegression:
          toNullableBoolean(runtimeGuardChecksInput.metricWecNonRegression) ??
          null,
        metricNecNonRegression:
          toNullableBoolean(runtimeGuardChecksInput.metricNecNonRegression) ??
          null,
        emissionAdmissionStable:
          toNullableBoolean(runtimeGuardChecksInput.emissionAdmissionStable) ??
          null,
        semanticAdmissionStable:
          toNullableBoolean(runtimeGuardChecksInput.semanticAdmissionStable) ??
          null,
        metricDecRobustLiftPositive:
          toNullableBoolean(runtimeGuardChecksInput.metricDecRobustLiftPositive) ??
          null,
        tileReconstitutedDecRobustLiftNonNegative:
          toNullableBoolean(
            runtimeGuardChecksInput.tileReconstitutedDecRobustLiftNonNegative,
          ) ?? null,
      },
      observed: {
        metricDecRobustLift: toFinite(runtimeObservedInput.metricDecRobustLift),
        tileReconstitutedDecRobustLift: toFinite(
          runtimeObservedInput.tileReconstitutedDecRobustLift,
        ),
        metricWecRobustDelta: toFinite(runtimeObservedInput.metricWecRobustDelta),
        metricNecRobustDelta: toFinite(runtimeObservedInput.metricNecRobustDelta),
        metricDecRobustMarginToZero: toFinite(
          runtimeObservedInput.metricDecRobustMarginToZero,
        ),
        tileReconstitutedDecRobustMarginToZero: toFinite(
          runtimeObservedInput.tileReconstitutedDecRobustMarginToZero,
        ),
        metricWecNonRegressionMargin: toFinite(
          runtimeObservedInput.metricWecNonRegressionMargin,
        ),
        metricNecNonRegressionMargin: toFinite(
          runtimeObservedInput.metricNecNonRegressionMargin,
        ),
      },
      note: asText(runtimeApplicationInput.note),
      citationRefs: Array.isArray(runtimeApplicationInput.citationRefs)
        ? unique(
            runtimeApplicationInput.citationRefs
              .map((entry) => asText(entry))
              .filter((entry): entry is string => entry != null),
          )
        : [],
    },
    controlKnobs: controlKnobsInput
      .filter(
        (entry): entry is Record<string, unknown> =>
          entry != null && typeof entry === "object",
      )
      .map((entry) => ({
        knobId: asText(entry.knobId) ?? "unknown",
        baselineValue: toFinite(entry.baselineValue),
        candidateValue: toFinite(entry.candidateValue),
        deltaValue: toFinite(entry.deltaValue),
        boundedDeltaMax: toFinite(entry.boundedDeltaMax),
        bounded: toNullableBoolean(entry.bounded) ?? false,
        note: asText(entry.note),
      })),
    claimCitationMap: claimCitationMapInput
      .filter(
        (entry): entry is Record<string, unknown> =>
          entry != null && typeof entry === "object",
      )
      .map((entry) => {
        const entryCitationRefs = Array.isArray(entry.citationRefs)
          ? entry.citationRefs
              .map((citation) => asText(citation))
              .filter((citation): citation is string => citation != null)
          : [];
        return {
          claimId: asText(entry.claimId) ?? "unknown_claim",
          claim: asText(entry.claim) ?? "unspecified claim",
          citationRefs: unique(entryCitationRefs),
          note: asText(entry.note),
        };
      }),
    claimCitationMapCompleteness: {
      status:
        claimCitationMapCompletenessInput.status === "pass" ||
        claimCitationMapCompletenessInput.status === "fail"
          ? claimCitationMapCompletenessInput.status
          : claimCitationMapMissingIds.length > 0
            ? "fail"
            : "pass",
      expectedClaimCount: Math.max(
        0,
        Math.trunc(
          toFinite(claimCitationMapCompletenessInput.expectedClaimCount) ??
            claimCitationMapExpectedIds.length,
        ),
      ),
      coveredClaimCount: Math.max(
        0,
        Math.trunc(
          toFinite(claimCitationMapCompletenessInput.coveredClaimCount) ??
            Math.max(
              0,
              claimCitationMapExpectedIds.length - claimCitationMapMissingIds.length,
            ),
        ),
      ),
      expectedClaimIds: unique(claimCitationMapExpectedIds),
      missingClaimIds: claimCitationMapMissingIds,
      note: asText(claimCitationMapCompletenessInput.note),
    },
    decCoupledControlEvidence: {
      status:
        decCoupledControlEvidenceInput.status === "available" ||
        decCoupledControlEvidenceInput.status === "unavailable"
          ? decCoupledControlEvidenceInput.status
          : "unavailable",
      controlFamiliesUsed: Array.isArray(decCoupledControlEvidenceInput.controlFamiliesUsed)
        ? unique(
            decCoupledControlEvidenceInput.controlFamiliesUsed
              .map((entry) => asText(entry))
              .filter((entry): entry is string => entry != null),
          )
        : [],
      boundedEnvelope: {
        pressureScaleMin: toFinite(decCoupledBoundedEnvelopeInput.pressureScaleMin),
        pressureScaleMax: toFinite(decCoupledBoundedEnvelopeInput.pressureScaleMax),
        densityLiftMin: toFinite(decCoupledBoundedEnvelopeInput.densityLiftMin),
        densityLiftMax: toFinite(decCoupledBoundedEnvelopeInput.densityLiftMax),
        fluxScaleMin: toFinite(decCoupledBoundedEnvelopeInput.fluxScaleMin),
        fluxScaleMax: toFinite(decCoupledBoundedEnvelopeInput.fluxScaleMax),
        shearScaleMin: toFinite(decCoupledBoundedEnvelopeInput.shearScaleMin),
        shearScaleMax: toFinite(decCoupledBoundedEnvelopeInput.shearScaleMax),
      },
      candidateEvaluationTable: decCoupledCandidateEvaluationTableInput
        .filter(
          (entry): entry is Record<string, unknown> =>
            entry != null && typeof entry === "object",
        )
        .map((entry) => ({
          candidateId: asText(entry.candidateId) ?? "unknown_candidate",
          pressureScale: toFinite(entry.pressureScale),
          densityLiftFraction: toFinite(entry.densityLiftFraction),
          fluxScale: toFinite(entry.fluxScale),
          shearScale: toFinite(entry.shearScale),
          selectionObjectivePrimaryMargin: toFinite(
            entry.selectionObjectivePrimaryMargin,
          ),
          passesSelectionGate: toNullableBoolean(entry.passesSelectionGate) ?? false,
        })),
      bestCandidateId: asText(decCoupledControlEvidenceInput.bestCandidateId),
      comparabilityGate: {
        pass: toNullableBoolean(decCoupledComparabilityGateInput.pass) ?? false,
        independentCrossCheckStatus: normalizeModelTermSemanticCheckStatus(
          decCoupledComparabilityGateInput.independentCrossCheckStatus,
        ),
        note: asText(decCoupledComparabilityGateInput.note),
      },
      researchClaims: decCoupledResearchClaimsInput
        .filter(
          (entry): entry is Record<string, unknown> =>
            entry != null && typeof entry === "object",
        )
        .map((entry) => ({
          claimId: asText(entry.claimId) ?? "unknown_claim",
          claim: asText(entry.claim) ?? "unspecified claim",
          confidenceLabel: normalizeResearchClaimConfidenceLabel(
            entry.confidenceLabel,
          ),
          citationRefs: Array.isArray(entry.citationRefs)
            ? unique(
                entry.citationRefs
                  .map((citation) => asText(citation))
                  .filter((citation): citation is string => citation != null),
              )
            : [],
          note: asText(entry.note),
        })),
      note: asText(decCoupledControlEvidenceInput.note),
    },
    recommendation: normalizeDecRecommendedPatchClass(value.recommendation),
    uncertaintyTags,
    citationRefs: unique(citationRefs),
    derivationNotes,
    uncertaintyNotes,
  };
};

const normalizeT00PolicyAdmissionBridgeEvidence = (
  value: BuildNhm2ObserverAuditArtifactInput["t00PolicyAdmissionBridgeEvidence"],
): Nhm2ObserverT00PolicyAdmissionBridgeEvidence | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const checksInput = (value.checks ?? {}) as Record<string, unknown>;
  const citationRefs = Array.isArray(value.citationRefs)
    ? value.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const notes = Array.isArray(value.notes)
    ? value.notes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  return {
    status: normalizeModelTermSemanticCheckStatus(value.status),
    routeId: asText(value.routeId),
    chartRef: asText(value.chartRef),
    selectedPath: NHM2_OBSERVER_MODEL_TERM_CLOSURE_PATH_VALUES.includes(
      value.selectedPath as Nhm2ObserverModelTermClosurePath,
    )
      ? (value.selectedPath as Nhm2ObserverModelTermClosurePath)
      : null,
    routeAdmissionRaw: normalizeModelTermSemanticAdmission(value.routeAdmissionRaw),
    routeAdmissionEffective: normalizeModelTermSemanticAdmission(
      value.routeAdmissionEffective,
    ),
    routeAdmissionPromotionBasis: normalizeModelTermRouteAdmissionPromotionBasis(
      value.routeAdmissionPromotionBasis,
    ),
    checks: {
      fullEinsteinTensorRouteAdmission: normalizeModelTermSemanticCheckStatus(
        checksInput.fullEinsteinTensorRouteAdmission,
      ),
      einsteinT00Comparability: normalizeModelTermSemanticCheckStatus(
        checksInput.einsteinT00Comparability,
      ),
      independentCrossCheck: normalizeModelTermSemanticCheckStatus(
        checksInput.independentCrossCheck,
      ),
      finiteDifferenceConvergence: normalizeModelTermSemanticCheckStatus(
        checksInput.finiteDifferenceConvergence,
      ),
      citationCoverage: normalizeModelTermSemanticCheckStatus(
        checksInput.citationCoverage,
      ),
    },
    pass: toNullableBoolean(value.pass) ?? false,
    rationale: asText(value.rationale),
    citationRefs: unique(citationRefs),
    notes,
  };
};

const normalizeTileAuthorityEvidence = (
  value: BuildNhm2ObserverAuditArtifactInput["tileAuthorityEvidence"],
): Nhm2ObserverTileAuthorityEvidence | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const checksInput = (value.checks ?? {}) as Record<string, unknown>;
  const citationRefs = Array.isArray(value.citationRefs)
    ? value.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const notes = Array.isArray(value.notes)
    ? value.notes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  return {
    status: normalizeModelTermSemanticCheckStatus(value.status),
    chartRef: asText(value.chartRef),
    routeId: asText(value.routeId),
    selectedPath: NHM2_OBSERVER_MODEL_TERM_CLOSURE_PATH_VALUES.includes(
      value.selectedPath as Nhm2ObserverModelTermClosurePath,
    )
      ? (value.selectedPath as Nhm2ObserverModelTermClosurePath)
      : null,
    tileRoute: NHM2_OBSERVER_TILE_AUTHORITY_ROUTE_VALUES.includes(
      value.tileRoute as Nhm2ObserverTileAuthorityRoute,
    )
      ? (value.tileRoute as Nhm2ObserverTileAuthorityRoute)
      : "unknown",
    checks: {
      routeAdmission: normalizeModelTermSemanticCheckStatus(
        checksInput.routeAdmission,
      ),
      fullTensorComponents: normalizeModelTermSemanticCheckStatus(
        checksInput.fullTensorComponents,
      ),
      comparability: normalizeModelTermSemanticCheckStatus(
        checksInput.comparability,
      ),
      citationCoverage: normalizeModelTermSemanticCheckStatus(
        checksInput.citationCoverage,
      ),
    },
    pass: toNullableBoolean(value.pass) ?? false,
    rationale: asText(value.rationale),
    citationRefs: unique(citationRefs),
    notes,
  };
};

const normalizeTileComparableCrossCheckEvidence = (
  value: BuildNhm2ObserverAuditArtifactInput["tileComparableCrossCheckEvidence"],
): Nhm2ObserverTileComparableCrossCheckEvidence | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const citationRefs = Array.isArray(value.citationRefs)
    ? value.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const notes = Array.isArray(value.notes)
    ? value.notes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const localizationResult =
    NHM2_OBSERVER_TILE_COMPARABLE_LOCALIZATION_RESULT_VALUES.includes(
      value.localizationResult as Nhm2ObserverTileComparableLocalizationResult,
    )
      ? (value.localizationResult as Nhm2ObserverTileComparableLocalizationResult)
      : "inconclusive";
  const nextPatchClass = NHM2_OBSERVER_TILE_COMPARABLE_NEXT_PATCH_CLASS_VALUES.includes(
    value.nextPatchClass as Nhm2ObserverTileComparableNextPatchClass,
  )
    ? (value.nextPatchClass as Nhm2ObserverTileComparableNextPatchClass)
    : "unknown";
  return {
    status: normalizeModelTermSemanticCheckStatus(value.status),
    chartRef: asText(value.chartRef),
    routeId: asText(value.routeId),
    selectedPath: NHM2_OBSERVER_MODEL_TERM_CLOSURE_PATH_VALUES.includes(
      value.selectedPath as Nhm2ObserverModelTermClosurePath,
    )
      ? (value.selectedPath as Nhm2ObserverModelTermClosurePath)
      : null,
    referenceRouteId: asText(value.referenceRouteId),
    aggregationMethod: asText(value.aggregationMethod),
    metricTensorRef: asText(value.metricTensorRef),
    tileTensorRef: asText(value.tileTensorRef),
    metricWecEulerianMin: toFinite(value.metricWecEulerianMin),
    metricWecRobustMin: toFinite(value.metricWecRobustMin),
    tileWecEulerianMin: toFinite(value.tileWecEulerianMin),
    tileWecRobustMin: toFinite(value.tileWecRobustMin),
    eulerianMinDelta: toFinite(value.eulerianMinDelta),
    robustMinDelta: toFinite(value.robustMinDelta),
    eulerianSignAgreement: toNullableBoolean(value.eulerianSignAgreement),
    robustSignAgreement: toNullableBoolean(value.robustSignAgreement),
    independentCrossCheckStatus: normalizeModelTermSemanticCheckStatus(
      value.independentCrossCheckStatus,
    ),
    comparabilityStatus: normalizeModelTermSemanticCheckStatus(
      value.comparabilityStatus,
    ),
    localizationResult,
    nextPatchClass,
    rationale: asText(value.rationale),
    citationRefs: unique(citationRefs),
    notes,
  };
};

const normalizeTileSurfaceReconstitutionEvidence = (
  value: BuildNhm2ObserverAuditArtifactInput["tileSurfaceReconstitutionEvidence"],
): Nhm2ObserverTileSurfaceReconstitutionEvidence | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const componentCoverageInput = (value.componentCoverage ??
    {}) as Record<string, unknown>;
  const citationRefs = Array.isArray(value.citationRefs)
    ? value.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const notes = Array.isArray(value.notes)
    ? value.notes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const localizationResult =
    NHM2_OBSERVER_TILE_COMPARABLE_LOCALIZATION_RESULT_VALUES.includes(
      value.localizationResult as Nhm2ObserverTileComparableLocalizationResult,
    )
      ? (value.localizationResult as Nhm2ObserverTileComparableLocalizationResult)
      : "inconclusive";
  return {
    status: normalizeModelTermSemanticCheckStatus(value.status),
    chartRef: asText(value.chartRef),
    routeId: asText(value.routeId),
    selectedPath: NHM2_OBSERVER_MODEL_TERM_CLOSURE_PATH_VALUES.includes(
      value.selectedPath as Nhm2ObserverModelTermClosurePath,
    )
      ? (value.selectedPath as Nhm2ObserverModelTermClosurePath)
      : null,
    sourceTensorRef: asText(value.sourceTensorRef),
    reconstitutedTileTensorRef: asText(value.reconstitutedTileTensorRef),
    aggregationMethod: asText(value.aggregationMethod),
    sampleDomainRef: asText(value.sampleDomainRef),
    componentCoverage: {
      t00: normalizeMetricProducerEvidenceStatus(componentCoverageInput.t00),
      t0i: normalizeMetricProducerEvidenceStatus(componentCoverageInput.t0i),
      offDiagonalTij: normalizeMetricProducerEvidenceStatus(
        componentCoverageInput.offDiagonalTij,
      ),
    },
    independentCrossCheckRouteRef: asText(value.independentCrossCheckRouteRef),
    independentCrossCheckStatus: normalizeModelTermSemanticCheckStatus(
      value.independentCrossCheckStatus,
    ),
    comparabilityStatus: normalizeModelTermSemanticCheckStatus(
      value.comparabilityStatus,
    ),
    localizationResult,
    rationale: asText(value.rationale),
    citationRefs: unique(citationRefs),
    notes,
  };
};

const normalizeTileObserverComparabilityClassification = (
  value: unknown,
): Nhm2ObserverTileObserverComparabilityClassification =>
  NHM2_OBSERVER_TILE_OBSERVER_COMPARABILITY_CLASSIFICATION_VALUES.includes(
    value as Nhm2ObserverTileObserverComparabilityClassification,
  )
    ? (value as Nhm2ObserverTileObserverComparabilityClassification)
    : "inconclusive";

const normalizeTileObserverConditionAuthorityMode = (
  value: unknown,
): Nhm2ObserverTileObserverConditionAuthorityMode =>
  NHM2_OBSERVER_TILE_OBSERVER_CONDITION_AUTHORITY_MODE_VALUES.includes(
    value as Nhm2ObserverTileObserverConditionAuthorityMode,
  )
    ? (value as Nhm2ObserverTileObserverConditionAuthorityMode)
    : "unknown";

const normalizeTileObserverConditionComparabilityEvidence = (
  value: BuildNhm2ObserverAuditArtifactInput["tileObserverConditionComparabilityEvidence"],
): Nhm2ObserverTileObserverConditionComparabilityEvidence | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const checksInput = (value.checks ?? {}) as Record<string, unknown>;
  const lanesInput = (value.lanes ?? {}) as Record<string, unknown>;
  const metricLaneInput = (lanesInput.metricRequired ?? {}) as Record<
    string,
    unknown
  >;
  const tileProxyLaneInput = (lanesInput.tileEffectiveProxy ?? {}) as Record<
    string,
    unknown
  >;
  const tileReconstitutedLaneInput = (
    lanesInput.tileEffectiveReconstituted ?? {}
  ) as Record<string, unknown>;
  const citationRefs = Array.isArray(value.citationRefs)
    ? value.citationRefs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const notes = Array.isArray(value.notes)
    ? value.notes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  return {
    status: normalizeModelTermSemanticCheckStatus(value.status),
    chartRef: asText(value.chartRef),
    routeId: asText(value.routeId),
    selectedPath: NHM2_OBSERVER_MODEL_TERM_CLOSURE_PATH_VALUES.includes(
      value.selectedPath as Nhm2ObserverModelTermClosurePath,
    )
      ? (value.selectedPath as Nhm2ObserverModelTermClosurePath)
      : null,
    sampleDomainRef: asText(value.sampleDomainRef),
    aggregationMethod: asText(value.aggregationMethod),
    classification: normalizeTileObserverComparabilityClassification(
      value.classification,
    ),
    classificationReason: asText(value.classificationReason),
    checks: {
      routeComparability: normalizeModelTermSemanticCheckStatus(
        checksInput.routeComparability,
      ),
      independentCrossCheck: normalizeModelTermSemanticCheckStatus(
        checksInput.independentCrossCheck,
      ),
      sampleCountParity: normalizeModelTermSemanticCheckStatus(
        checksInput.sampleCountParity,
      ),
      rapidityCapParity: normalizeModelTermSemanticCheckStatus(
        checksInput.rapidityCapParity,
      ),
      rapidityCapBetaParity: normalizeModelTermSemanticCheckStatus(
        checksInput.rapidityCapBetaParity,
      ),
      citationCoverage: normalizeModelTermSemanticCheckStatus(
        checksInput.citationCoverage,
      ),
    },
    lanes: {
      metricRequired: {
        tensorRef: asText(metricLaneInput.tensorRef),
        sampleCount: toFinite(metricLaneInput.sampleCount),
        rapidityCap: toFinite(metricLaneInput.rapidityCap),
        rapidityCapBeta: toFinite(metricLaneInput.rapidityCapBeta),
        wecEulerianMin: toFinite(metricLaneInput.wecEulerianMin),
        wecRobustMin: toFinite(metricLaneInput.wecRobustMin),
        decEulerianMin: toFinite(metricLaneInput.decEulerianMin),
        decRobustMin: toFinite(metricLaneInput.decRobustMin),
      },
      tileEffectiveProxy: {
        tensorRef: asText(tileProxyLaneInput.tensorRef),
        sampleCount: toFinite(tileProxyLaneInput.sampleCount),
        rapidityCap: toFinite(tileProxyLaneInput.rapidityCap),
        rapidityCapBeta: toFinite(tileProxyLaneInput.rapidityCapBeta),
        wecEulerianMin: toFinite(tileProxyLaneInput.wecEulerianMin),
        wecRobustMin: toFinite(tileProxyLaneInput.wecRobustMin),
        decEulerianMin: toFinite(tileProxyLaneInput.decEulerianMin),
        decRobustMin: toFinite(tileProxyLaneInput.decRobustMin),
      },
      tileEffectiveReconstituted: {
        tensorRef: asText(tileReconstitutedLaneInput.tensorRef),
        sourceRef: asText(tileReconstitutedLaneInput.sourceRef),
        sampleCount: toFinite(tileReconstitutedLaneInput.sampleCount),
        rapidityCap: toFinite(tileReconstitutedLaneInput.rapidityCap),
        rapidityCapBeta: toFinite(tileReconstitutedLaneInput.rapidityCapBeta),
        wecEulerianMin: toFinite(tileReconstitutedLaneInput.wecEulerianMin),
        wecRobustMin: toFinite(tileReconstitutedLaneInput.wecRobustMin),
        decEulerianMin: toFinite(tileReconstitutedLaneInput.decEulerianMin),
        decRobustMin: toFinite(tileReconstitutedLaneInput.decRobustMin),
        note: asText(tileReconstitutedLaneInput.note),
      },
    },
    pass: toNullableBoolean(value.pass) ?? false,
    rationale: asText(value.rationale),
    citationRefs: unique(citationRefs),
    notes,
  };
};

const normalizeTileObserverLegacyProxyDiagnostics = (
  value: BuildNhm2ObserverAuditArtifactInput["tileObserverLegacyProxyDiagnostics"],
): Nhm2ObserverTileObserverLegacyProxyDiagnostics | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return {
    tensorRef: asText(value.tensorRef),
    sampleCount: toFinite(value.sampleCount),
    rapidityCap: toFinite(value.rapidityCap),
    rapidityCapBeta: toFinite(value.rapidityCapBeta),
    wecEulerianMin: toFinite(value.wecEulerianMin),
    wecRobustMin: toFinite(value.wecRobustMin),
    decEulerianMin: toFinite(value.decEulerianMin),
    decRobustMin: toFinite(value.decRobustMin),
    note: asText(value.note),
  };
};

const deriveTileObserverConditionAuthority = (args: {
  modeInput: unknown;
  noteInput: unknown;
  comparabilityEvidence: Nhm2ObserverTileObserverConditionComparabilityEvidence | null;
}): {
  mode: Nhm2ObserverTileObserverConditionAuthorityMode;
  note: string | null;
} => {
  const explicitMode = normalizeTileObserverConditionAuthorityMode(args.modeInput);
  const explicitNote = asText(args.noteInput);
  if (explicitMode !== "unknown") {
    return {
      mode: explicitMode,
      note: explicitNote,
    };
  }
  const evidence = args.comparabilityEvidence;
  if (evidence == null) {
    return {
      mode: "legacy_proxy_published",
      note:
        explicitNote ??
        "Legacy tile-proxy observer-condition lane remains authoritative because commensurate comparability evidence is unavailable.",
    };
  }
  const checks = evidence.checks;
  const classificationSupportsAuthority =
    evidence.classification === "proxy_artifact_confirmed" ||
    evidence.classification === "same_surface_failure_confirmed";
  const comparabilityGatePass =
    evidence.status === "pass" &&
    classificationSupportsAuthority &&
    checks.routeComparability === "pass" &&
    checks.independentCrossCheck === "pass" &&
    checks.sampleCountParity === "pass" &&
    checks.rapidityCapParity === "pass" &&
    checks.rapidityCapBetaParity === "pass" &&
    checks.citationCoverage === "pass";
  if (comparabilityGatePass) {
    return {
      mode: "commensurate_reconstituted_authoritative",
      note:
        explicitNote ??
        `Commensurate observer-condition authority gate passed (${evidence.classification}), so blocker derivation now uses the reconstituted same-chart lane.`,
    };
  }
  return {
    mode: "legacy_proxy_published",
    note:
      explicitNote ??
      "Legacy tile-proxy observer-condition lane remains authoritative because commensurate authority gate is not pass-level.",
  };
};

const approximatelyEqual = (
  lhs: number | null,
  rhs: number | null,
  epsilon = 1e-12,
): boolean =>
  lhs != null && rhs != null && Math.abs(lhs - rhs) <= epsilon;

const NHM2_OBSERVER_WEC_PROBE_DEFAULT_SCALE = 0.5;
const NHM2_OBSERVER_WEC_SHARED_PROPAGATION_RATIO = 0.25;
const NHM2_OBSERVER_WEC_WEAK_PROPAGATION_RATIO = 0.05;
const NHM2_OBSERVER_METRIC_MISSING_INPUTS = new Set([
  "metric_t0i_missing",
  "metric_tij_off_diagonal_missing",
]);

const deriveMetricCompleteness = (
  tensor: Nhm2ObserverAuditTensor,
  input: BuildNhm2ObserverAuditArtifactInput,
): {
  status: Nhm2ObserverMetricCompletenessStatus;
  note: string | null;
} => {
  if (
    NHM2_OBSERVER_METRIC_COMPLETENESS_STATUS_VALUES.includes(
      input.observerMetricCompletenessStatus as Nhm2ObserverMetricCompletenessStatus,
    )
  ) {
    return {
      status: input.observerMetricCompletenessStatus as Nhm2ObserverMetricCompletenessStatus,
      note: asText(input.observerMetricCompletenessNote),
    };
  }
  const missingMetricInputs = tensor.missingInputs.filter((entry) =>
    NHM2_OBSERVER_METRIC_MISSING_INPUTS.has(entry),
  );
  if (missingMetricInputs.length > 0) {
    return {
      status: "incomplete_missing_inputs",
      note:
        "Metric-required observer audit remains diagonal-only because T0i flux terms and off-diagonal spatial shear terms were not supplied; missing inputs: " +
        missingMetricInputs.join(", "),
    };
  }
  if (tensor.status !== "unavailable") {
    return {
      status: "complete",
      note: "Metric-required observer audit has no declared missing observer inputs.",
    };
  }
  return {
    status: "unknown",
    note: null,
  };
};

const deriveMetricCoverageBlocker = (
  tensor: Nhm2ObserverAuditTensor,
  input: BuildNhm2ObserverAuditArtifactInput,
): {
  status: Nhm2ObserverMetricCoverageBlockerStatus;
  note: string | null;
  firstMissingStage: Nhm2ObserverMetricFirstMissingStage;
  nextTechnicalAction: Nhm2ObserverNextTechnicalAction;
} => {
  if (
    NHM2_OBSERVER_METRIC_COVERAGE_BLOCKER_STATUS_VALUES.includes(
      input
        .observerMetricCoverageBlockerStatus as Nhm2ObserverMetricCoverageBlockerStatus,
    )
  ) {
    return {
      status:
        input
          .observerMetricCoverageBlockerStatus as Nhm2ObserverMetricCoverageBlockerStatus,
      note: asText(input.observerMetricCoverageBlockerNote),
      firstMissingStage:
        (NHM2_OBSERVER_METRIC_FIRST_MISSING_STAGE_VALUES.includes(
          input
            .observerMetricFirstMissingStage as Nhm2ObserverMetricFirstMissingStage,
        )
          ? input.observerMetricFirstMissingStage
          : "unknown") as Nhm2ObserverMetricFirstMissingStage,
      nextTechnicalAction:
        (NHM2_OBSERVER_NEXT_TECHNICAL_ACTION_VALUES.includes(
          input.observerNextTechnicalAction as Nhm2ObserverNextTechnicalAction,
        )
          ? input.observerNextTechnicalAction
          : "unknown") as Nhm2ObserverNextTechnicalAction,
    };
  }
  const missingMetricInputs = tensor.missingInputs.filter((entry) =>
    NHM2_OBSERVER_METRIC_MISSING_INPUTS.has(entry),
  );
  if (missingMetricInputs.length === 0) {
    return {
      status: "unknown",
      note: null,
      firstMissingStage: "unknown",
      nextTechnicalAction: "unknown",
    };
  }
  const fluxHandling = tensor.model.fluxHandling ?? "unknown";
  const shearHandling = tensor.model.shearHandling ?? "unknown";
  if (
    fluxHandling === "assumed_zero_from_missing_t0i" &&
    shearHandling === "assumed_zero_from_missing_tij"
  ) {
    return {
      status: "producer_not_emitted",
      note:
        "Metric-required observer completeness stops at metric tensor emission: the emitted same-chart observer tensor is diagonal-only and does not supply T0i flux terms or off-diagonal Tij shear terms, so completeness cannot close without new tensor emission semantics.",
      firstMissingStage: "metric_tensor_emission",
      nextTechnicalAction: "emit_same_chart_metric_flux_and_shear_terms",
    };
  }
  return {
    status: "semantics_ambiguous",
    note:
      "Metric-required observer completeness remains blocked, but the first missing stage could not be localized cleanly from the current artifact surface alone.",
    firstMissingStage: "semantic_contract",
    nextTechnicalAction: "resolve_metric_tensor_semantics",
  };
};

const deriveMetricEmissionAdmission = (args: {
  tensor: Nhm2ObserverAuditTensor;
  input: BuildNhm2ObserverAuditArtifactInput;
  coverageBlockerStatus: Nhm2ObserverMetricCoverageBlockerStatus;
}): {
  status: Nhm2ObserverMetricEmissionAdmissionStatus;
  note: string | null;
  t0iStatus: Nhm2ObserverMetricComponentAdmissionStatus;
  t0iNote: string | null;
  offDiagonalStatus: Nhm2ObserverMetricComponentAdmissionStatus;
  offDiagonalNote: string | null;
} => {
  const { tensor, input, coverageBlockerStatus } = args;
  const explicitAdmissionStatus =
    input.observerMetricEmissionAdmissionStatus as
      | Nhm2ObserverMetricEmissionAdmissionStatus
      | undefined;
  const explicitT0iStatus =
    input.observerMetricT0iAdmissionStatus as
      | Nhm2ObserverMetricComponentAdmissionStatus
      | undefined;
  const explicitOffDiagonalStatus =
    input.observerMetricOffDiagonalTijAdmissionStatus as
      | Nhm2ObserverMetricComponentAdmissionStatus
      | undefined;
  if (
    NHM2_OBSERVER_METRIC_EMISSION_ADMISSION_STATUS_VALUES.includes(
      explicitAdmissionStatus as Nhm2ObserverMetricEmissionAdmissionStatus,
    ) &&
    NHM2_OBSERVER_METRIC_COMPONENT_ADMISSION_STATUS_VALUES.includes(
      explicitT0iStatus as Nhm2ObserverMetricComponentAdmissionStatus,
    ) &&
    NHM2_OBSERVER_METRIC_COMPONENT_ADMISSION_STATUS_VALUES.includes(
      explicitOffDiagonalStatus as Nhm2ObserverMetricComponentAdmissionStatus,
    )
  ) {
    return {
      status: explicitAdmissionStatus as Nhm2ObserverMetricEmissionAdmissionStatus,
      note: asText(input.observerMetricEmissionAdmissionNote),
      t0iStatus: explicitT0iStatus as Nhm2ObserverMetricComponentAdmissionStatus,
      t0iNote: asText(input.observerMetricT0iAdmissionNote),
      offDiagonalStatus:
        explicitOffDiagonalStatus as Nhm2ObserverMetricComponentAdmissionStatus,
      offDiagonalNote: asText(input.observerMetricOffDiagonalTijAdmissionNote),
    };
  }

  const missingMetricInputs = tensor.missingInputs.filter((entry) =>
    NHM2_OBSERVER_METRIC_MISSING_INPUTS.has(entry),
  );
  if (
    coverageBlockerStatus === "producer_not_emitted" &&
    missingMetricInputs.includes("metric_t0i_missing") &&
    missingMetricInputs.includes("metric_tij_off_diagonal_missing")
  ) {
    return {
      status: "not_admitted",
      note:
        "Admission failed: the current metric-required branch emits a reduced-order diagonal tensor only. Closing T0i and off-diagonal Tij would require a new same-chart full-tensor emission semantics rather than simple serialization or consumer wiring.",
      t0iStatus: "basis_or_semantics_ambiguous",
      t0iNote:
        "T0i is not carried as an emitted same-chart quantity. The current branch would need a new momentum-density emission semantics, not a serialization of an existing tensor component.",
      offDiagonalStatus: "basis_or_semantics_ambiguous",
      offDiagonalNote:
        "Off-diagonal Tij is not emitted and the current diagonal pressures are reduced-order placeholders. Closing shear terms would require a new same-chart full-tensor stress semantics, not a publication-only fix.",
    };
  }

  return {
    status: "unknown",
    note: null,
    t0iStatus: "unknown",
    t0iNote: null,
    offDiagonalStatus: "unknown",
    offDiagonalNote: null,
  };
};

const deriveTileAuthority = (
  tensor: Nhm2ObserverAuditTensor,
  input: BuildNhm2ObserverAuditArtifactInput,
): {
  status: Nhm2ObserverTileAuthorityStatus;
  note: string | null;
} => {
  if (
    NHM2_OBSERVER_TILE_AUTHORITY_STATUS_VALUES.includes(
      input.observerTileAuthorityStatus as Nhm2ObserverTileAuthorityStatus,
    )
  ) {
    return {
      status: input.observerTileAuthorityStatus as Nhm2ObserverTileAuthorityStatus,
      note: asText(input.observerTileAuthorityNote),
    };
  }
  const fluxHandling = tensor.model.fluxHandling ?? "unknown";
  const shearHandling = tensor.model.shearHandling ?? "unknown";
  if (
    tensor.model.pressureModel === "isotropic_pressure_proxy" ||
    shearHandling === "not_modeled_in_proxy"
  ) {
    return {
      status: "proxy_limited",
      note:
        "Tile-effective observer audit remains proxy-limited: fluxHandling=" +
        fluxHandling +
        ", shearHandling=" +
        shearHandling +
        ".",
    };
  }
  if (tensor.status !== "unavailable") {
    return {
      status: "full_tensor_authority",
      note: "Tile-effective observer audit does not declare a proxy-only authority limit.",
    };
  }
  return {
    status: "unknown",
    note: null,
  };
};

const deriveLeadReadiness = (args: {
  metricCompletenessStatus: Nhm2ObserverMetricCompletenessStatus;
  tileAuthorityStatus: Nhm2ObserverTileAuthorityStatus;
  input: BuildNhm2ObserverAuditArtifactInput;
}): {
  workstream: Nhm2ObserverLeadReadinessWorkstream;
  reason: string | null;
} => {
  if (
    NHM2_OBSERVER_LEAD_READINESS_WORKSTREAM_VALUES.includes(
      args.input.observerLeadReadinessWorkstream as Nhm2ObserverLeadReadinessWorkstream,
    )
  ) {
    return {
      workstream:
        args.input
          .observerLeadReadinessWorkstream as Nhm2ObserverLeadReadinessWorkstream,
      reason: asText(args.input.observerLeadReadinessReason),
    };
  }
  if (
    args.metricCompletenessStatus === "incomplete_missing_inputs" &&
    args.tileAuthorityStatus === "proxy_limited"
  ) {
    return {
      workstream: "observer_completeness_and_authority",
      reason:
        "Observer fail remains mixed: same-surface negativity is real, metric-required coverage still misses T0i/off-diagonal inputs, and tile-effective authority remains proxy-limited.",
    };
  }
  if (args.metricCompletenessStatus === "incomplete_missing_inputs") {
    return {
      workstream: "observer_completeness_and_authority",
      reason:
        "Observer fail remains mixed: same-surface negativity is real and metric-required coverage still misses T0i/off-diagonal inputs.",
    };
  }
  if (args.tileAuthorityStatus === "proxy_limited") {
    return {
      workstream: "observer_completeness_and_authority",
      reason:
        "Observer fail remains mixed: same-surface negativity is real and tile-effective authority remains proxy-limited. Certificate/policy readiness remains a separate parallel full-loop lane.",
    };
  }
  if (
    args.metricCompletenessStatus === "complete" &&
    args.tileAuthorityStatus === "full_tensor_authority"
  ) {
    return {
      workstream: "certificate_policy_readiness",
      reason:
        "Observer completeness and tile authority are admitted on the selected route; certificate/policy readiness remains the parallel full-loop lane.",
    };
  }
  return {
    workstream: "unknown",
    reason: null,
  };
};

const buildCondition = (
  input: BuildNhm2ObserverAuditConditionInput,
): Nhm2ObserverAuditCondition => {
  const robustMin = toFinite(input?.robustMin);
  return {
    status:
      robustMin == null
        ? "unavailable"
        : robustMin < 0
          ? "fail"
          : "pass",
    eulerianMin: toFinite(input?.eulerianMin),
    eulerianMean: toFinite(input?.eulerianMean),
    robustMin,
    robustMean: toFinite(input?.robustMean),
    eulerianViolationFraction: toFinite(input?.eulerianViolationFraction),
    robustViolationFraction: toFinite(input?.robustViolationFraction),
    missedViolationFraction: toFinite(input?.missedViolationFraction),
    severityGainMin: toFinite(input?.severityGainMin),
    severityGainMean: toFinite(input?.severityGainMean),
    maxRobustMinusEulerian: toFinite(input?.maxRobustMinusEulerian),
    worstCase: {
      index: Number.isInteger(input?.worstCase?.index)
        ? Number(input?.worstCase?.index)
        : null,
      value: toFinite(input?.worstCase?.value),
      direction: toDirection(input?.worstCase?.direction),
      rapidity: toFinite(input?.worstCase?.rapidity),
      source: asText(input?.worstCase?.source),
    },
  };
};

const buildTensor = (
  tensorId: Nhm2ObserverAuditTensor["tensorId"],
  input: BuildNhm2ObserverAuditTensorInput,
): Nhm2ObserverAuditTensor => {
  const conditions = Object.fromEntries(
    NHM2_OBSERVER_AUDIT_CONDITION_KEYS.map((key) => [
      key,
      buildCondition(input?.conditions?.[key] ?? null),
    ]),
  ) as Record<Nhm2ObserverAuditConditionKey, Nhm2ObserverAuditCondition>;

  const missingInputs = Array.isArray(input?.missingInputs)
    ? input!.missingInputs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const limitationNotes = Array.isArray(input?.model?.limitationNotes)
    ? input!.model!.limitationNotes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const hasConditionData = NHM2_OBSERVER_AUDIT_CONDITION_KEYS.some(
    (key) =>
      conditions[key].robustMin != null || conditions[key].eulerianMin != null,
  );
  const hasAnyData =
    hasConditionData ||
    toFinite(input?.typeI?.fraction) != null ||
    toFinite(input?.rapidityCap) != null ||
    asText(input?.tensorRef) != null;
  const anyConditionFail = NHM2_OBSERVER_AUDIT_CONDITION_KEYS.some(
    (key) => conditions[key].status === "fail",
  );
  const tensorMissing = !hasAnyData;
  const completeness: Nhm2ObserverAuditCompleteness =
    missingInputs.length > 0 || tensorMissing ? "incomplete" : "complete";
  const status: Nhm2ObserverAuditStatus = tensorMissing
    ? "unavailable"
    : anyConditionFail
      ? "fail"
      : hasConditionData
        ? limitationNotes.length > 0 || completeness === "incomplete"
          ? "review"
          : "pass"
        : "unavailable";
  const reasonCodes: Nhm2ObserverAuditReasonCode[] = [];
  if (tensorMissing) {
    reasonCodes.push(
      tensorId === "metric_required"
        ? "metric_tensor_missing"
        : "tile_tensor_missing",
    );
  }
  if (completeness === "incomplete") {
    reasonCodes.push(
      tensorId === "metric_required"
        ? "metric_audit_incomplete"
        : "tile_audit_incomplete",
    );
  }
  if (anyConditionFail) reasonCodes.push("observer_condition_failed");
  if (limitationNotes.length > 0) reasonCodes.push("surrogate_model_limited");

  return {
    tensorId,
    status,
    completeness,
    tensorRef: asText(input?.tensorRef),
    sampleCount: toFinite(input?.sampleCount),
    reasonCodes: orderReasonCodes(reasonCodes),
    rapidityCap: toFinite(input?.rapidityCap),
    rapidityCapBeta: toFinite(input?.rapidityCapBeta),
    typeI: {
      count: toFinite(input?.typeI?.count),
      fraction: toFinite(input?.typeI?.fraction),
      tolerance: toFinite(input?.typeI?.tolerance),
    },
    conditions,
    fluxDiagnostics: {
      status:
        input?.fluxDiagnostics?.status === "available" ||
        input?.fluxDiagnostics?.status === "assumed_zero"
          ? input.fluxDiagnostics.status
          : "unavailable",
      meanMagnitude: toFinite(input?.fluxDiagnostics?.meanMagnitude),
      maxMagnitude: toFinite(input?.fluxDiagnostics?.maxMagnitude),
      netMagnitude: toFinite(input?.fluxDiagnostics?.netMagnitude),
      netDirection: toDirection(input?.fluxDiagnostics?.netDirection),
      note: asText(input?.fluxDiagnostics?.note),
    },
    consistency: {
      robustNotGreaterThanEulerian: toNullableBoolean(
        input?.consistency?.robustNotGreaterThanEulerian,
      ),
      maxRobustMinusEulerian: toFinite(
        input?.consistency?.maxRobustMinusEulerian,
      ),
    },
    model: {
      pressureModel: asText(input?.model?.pressureModel),
      fluxHandling: asText(input?.model?.fluxHandling),
      shearHandling: asText(input?.model?.shearHandling),
      limitationNotes,
      note: asText(input?.model?.note),
    },
    missingInputs,
    primaryBlockingCondition: "unknown",
    primaryBlockingMode: "unknown",
    primaryBlockingValue: null,
    primaryBlockingReference: null,
    primaryBlockingWhy: null,
    rootCauseClass: "unknown",
    blockingDependencyStatus: "unknown",
    blockingDependencyNote: null,
    firstRemediationTarget: null,
    firstRemediationWhy: null,
    upstreamDriverRef: null,
    upstreamDriverClass: "unknown",
    upstreamDriverDependencyStatus: "unknown",
    upstreamDriverNote: null,
    firstUpstreamRemediationTarget: null,
    firstUpstreamRemediationWhy: null,
    wecProbeApplied: false,
    wecProbeScale: null,
    wecProbeBaseline: null,
    wecProbeResult: null,
    wecProbeDelta: null,
    decProbeBaseline: null,
    decProbeResult: null,
    decProbeDelta: null,
    wecProbeInterpretation: null,
  };
};

type Nhm2ObserverBlockingHit = {
  surface: Nhm2ObserverAuditTensor["tensorId"];
  condition: Nhm2ObserverAuditConditionKey;
};

type Nhm2ObserverPrimaryBlockingLocalization = {
  condition: Nhm2ObserverPromotionBlockingCondition;
  mode: Nhm2ObserverPrimaryBlockingMode;
  value: number | null;
  reference: string | null;
  why: string | null;
  inspectionTarget: string | null;
};

type Nhm2ObserverRootCauseLocalization = {
  rootCauseClass: Nhm2ObserverRootCauseClass;
  blockingDependencyStatus: Nhm2ObserverBlockingDependencyStatus;
  blockingDependencyNote: string | null;
  firstRemediationTarget: string | null;
  firstRemediationWhy: string | null;
};

type Nhm2ObserverUpstreamDriverLocalization = {
  upstreamDriverRef: string | null;
  upstreamDriverClass: Nhm2ObserverUpstreamDriverClass;
  upstreamDriverDependencyStatus: Nhm2ObserverUpstreamDriverDependencyStatus;
  upstreamDriverNote: string | null;
  firstUpstreamRemediationTarget: string | null;
  firstUpstreamRemediationWhy: string | null;
};

type Nhm2ObserverWecProbeLocalization = {
  wecProbeApplied: boolean;
  wecProbeScale: number | null;
  wecProbeBaseline: number | null;
  wecProbeResult: number | null;
  wecProbeDelta: number | null;
  decProbeBaseline: number | null;
  decProbeResult: number | null;
  decProbeDelta: number | null;
  wecProbeInterpretation: string | null;
};

const collectConfirmedBlockingHits = (
  surface: Nhm2ObserverAuditTensor["tensorId"],
  tensor: Nhm2ObserverAuditTensor,
): Nhm2ObserverBlockingHit[] =>
  NHM2_OBSERVER_AUDIT_CONDITION_KEYS.flatMap((condition) => {
    const summary = tensor.conditions[condition];
    return summary.status === "fail" &&
      summary.robustMin != null &&
      summary.robustMin < 0 &&
      summary.missedViolationFraction === 0 &&
      summary.maxRobustMinusEulerian != null &&
      summary.maxRobustMinusEulerian <= 0
      ? [{ surface, condition }]
      : [];
  });

const asNaturalList = (values: string[]): string => {
  if (values.length === 0) return "none";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
};

const PRIMARY_MODE_PRIORITY: Record<Nhm2ObserverPrimaryBlockingMode, number> = {
  eulerian_native: 0,
  robust_search_amplified: 1,
  robust_only: 2,
  mixed: 3,
  unknown: 4,
};

const PRIMARY_CONDITION_PRIORITY: Record<
  Nhm2ObserverAuditConditionKey,
  number
> = {
  wec: 0,
  nec: 1,
  dec: 2,
  sec: 3,
};

const hasFailingNegative = (condition: Nhm2ObserverAuditCondition): boolean =>
  condition.status === "fail" &&
  condition.robustMin != null &&
  condition.robustMin < 0;

const hasEulerianNegative = (condition: Nhm2ObserverAuditCondition): boolean =>
  condition.eulerianMin != null && condition.eulerianMin < 0;

const isRobustOnlyFailure = (condition: Nhm2ObserverAuditCondition): boolean =>
  hasFailingNegative(condition) && !hasEulerianNegative(condition);

const classifyPrimaryBlockingMode = (
  condition: Nhm2ObserverAuditCondition,
): Nhm2ObserverPrimaryBlockingMode => {
  if (condition.status !== "fail" || condition.robustMin == null) return "unknown";
  const eulerianNegative =
    condition.eulerianMin != null && condition.eulerianMin < 0;
  if (!eulerianNegative) return "robust_only";
  if (
    (condition.maxRobustMinusEulerian != null &&
      condition.maxRobustMinusEulerian < -1e-12) ||
    (condition.eulerianMin != null &&
      condition.robustMin < condition.eulerianMin - 1e-12)
  ) {
    return "robust_search_amplified";
  }
  if (
    (condition.maxRobustMinusEulerian != null &&
      Math.abs(condition.maxRobustMinusEulerian) <= 1e-12) ||
    approximatelyEqual(condition.robustMin, condition.eulerianMin)
  ) {
    return "eulerian_native";
  }
  return "mixed";
};

const buildPrimaryBlockingWhy = (
  tensor: Nhm2ObserverAuditTensor,
  conditionKey: Nhm2ObserverAuditConditionKey,
  mode: Nhm2ObserverPrimaryBlockingMode,
): string => {
  const notes: string[] = [];
  if (mode === "eulerian_native") {
    notes.push(
      `${conditionKey.toUpperCase()} is already negative on the Eulerian sample and robust search does not deepen the minimum.`,
    );
  } else if (mode === "robust_search_amplified") {
    notes.push(
      `${conditionKey.toUpperCase()} is negative on the Eulerian sample and robust search drives the emitted minimum lower.`,
    );
  } else if (mode === "robust_only") {
    notes.push(
      `${conditionKey.toUpperCase()} is Eulerian-clean on the emitted sample but turns negative under the robust observer search.`,
    );
  } else if (mode === "mixed") {
    notes.push(
      `${conditionKey.toUpperCase()} mixes Eulerian negativity with additional robust-search deformation on the emitted surface.`,
    );
  } else {
    notes.push(
      `${conditionKey.toUpperCase()} primary blocking mode could not be resolved from current emitted evidence.`,
    );
  }

  if (
    conditionKey === "wec" &&
    tensor.conditions.dec.status === "fail" &&
    tensor.conditions.dec.robustMin != null &&
    tensor.conditions.dec.robustMin < 0
  ) {
    notes.push("DEC co-fails downstream of the same negative energy density.");
  }
  if (
    tensor.tensorId === "tile_effective" &&
    conditionKey === "wec" &&
    ((tensor.conditions.nec.status === "fail" &&
      tensor.conditions.nec.robustMin != null &&
      tensor.conditions.nec.robustMin < 0) ||
      (tensor.conditions.sec.status === "fail" &&
        tensor.conditions.sec.robustMin != null &&
        tensor.conditions.sec.robustMin < 0))
  ) {
    notes.push(
      "NEC/SEC remain secondary search-driven failures on the tile-effective surface.",
    );
  }

  return notes.join(" ");
};

const localizePrimaryBlocking = (
  tensor: Nhm2ObserverAuditTensor,
): Nhm2ObserverPrimaryBlockingLocalization => {
  const wecFails =
    tensor.conditions.wec.status === "fail" &&
    tensor.conditions.wec.robustMin != null &&
    tensor.conditions.wec.robustMin < 0;

  const candidates = NHM2_OBSERVER_AUDIT_CONDITION_KEYS.flatMap((conditionKey) => {
    const condition = tensor.conditions[conditionKey];
    if (condition.status !== "fail" || condition.robustMin == null) return [];
    return [
      {
        conditionKey,
        mode: classifyPrimaryBlockingMode(condition),
        value: condition.robustMin,
        missedViolationFraction:
          condition.missedViolationFraction == null
            ? Number.POSITIVE_INFINITY
            : condition.missedViolationFraction,
        downstreamPenalty: conditionKey === "dec" && wecFails ? 1 : 0,
      },
    ];
  });

  if (candidates.length === 0) {
    return {
      condition: "unknown",
      mode: "unknown",
      value: null,
      reference: null,
      why: null,
      inspectionTarget: null,
    };
  }

  candidates.sort((lhs, rhs) => {
    const byMode =
      PRIMARY_MODE_PRIORITY[lhs.mode] - PRIMARY_MODE_PRIORITY[rhs.mode];
    if (byMode !== 0) return byMode;
    const byPenalty = lhs.downstreamPenalty - rhs.downstreamPenalty;
    if (byPenalty !== 0) return byPenalty;
    const byMissed =
      lhs.missedViolationFraction - rhs.missedViolationFraction;
    if (byMissed !== 0) return byMissed;
    const byCondition =
      PRIMARY_CONDITION_PRIORITY[lhs.conditionKey] -
      PRIMARY_CONDITION_PRIORITY[rhs.conditionKey];
    if (byCondition !== 0) return byCondition;
    return Math.abs(rhs.value) - Math.abs(lhs.value);
  });

  const primary = candidates[0];
  const reference = `${tensor.tensorId}.conditions.${primary.conditionKey}`;
  return {
    condition: primary.conditionKey,
    mode: primary.mode,
    value: primary.value,
    reference,
    why: buildPrimaryBlockingWhy(tensor, primary.conditionKey, primary.mode),
    inspectionTarget: reference,
  };
};

const summarizePrimaryDriverAgreement = (
  metric: Nhm2ObserverPrimaryBlockingLocalization,
  tile: Nhm2ObserverPrimaryBlockingLocalization,
): Nhm2ObserverPrimaryDriverAgreement => {
  if (metric.condition === "unknown" || tile.condition === "unknown") {
    return "unknown";
  }
  return metric.condition === tile.condition ? "aligned" : "diverged";
};

const buildPrimaryDriverNote = (args: {
  metric: Nhm2ObserverPrimaryBlockingLocalization;
  tile: Nhm2ObserverPrimaryBlockingLocalization;
}): string | null => {
  if (args.metric.condition === "unknown" && args.tile.condition === "unknown") {
    return null;
  }
  const notes: string[] = [];
  if (args.metric.condition !== "unknown") {
    notes.push(
      `metric_required first localizes to ${args.metric.condition.toUpperCase()} (${args.metric.mode}) at ${args.metric.reference}. ${args.metric.why}`,
    );
  }
  if (args.tile.condition !== "unknown") {
    notes.push(
      `tile_effective first localizes to ${args.tile.condition.toUpperCase()} (${args.tile.mode}) at ${args.tile.reference}. ${args.tile.why}`,
    );
  }
  return notes.join(" ");
};

const localizeRootCause = (
  tensor: Nhm2ObserverAuditTensor,
): Nhm2ObserverRootCauseLocalization => {
  const primaryCondition = tensor.primaryBlockingCondition;
  const primaryReference =
    tensor.primaryBlockingReference ??
    (primaryCondition === "unknown" || primaryCondition === "mixed"
      ? null
      : `${tensor.tensorId}.conditions.${primaryCondition}`);
  const wecFails = hasFailingNegative(tensor.conditions.wec);
  const necFails = hasFailingNegative(tensor.conditions.nec);
  const decFails = hasFailingNegative(tensor.conditions.dec);
  const secFails = hasFailingNegative(tensor.conditions.sec);
  const robustOnlySecondary = (
    [
      ["nec", tensor.conditions.nec],
      ["sec", tensor.conditions.sec],
      ["dec", tensor.conditions.dec],
    ] as const
  )
    .filter(([conditionKey, condition]) => {
      if (conditionKey === primaryCondition) return false;
      return isRobustOnlyFailure(condition);
    })
    .map(([conditionKey]) => conditionKey.toUpperCase());

  if (primaryCondition === "wec") {
    const dependencyNotes: string[] = [];
    if (decFails) {
      dependencyNotes.push(
        "DEC fails on the same surface and is treated as downstream of the emitted WEC negativity.",
      );
    }
    if (robustOnlySecondary.length > 0) {
      dependencyNotes.push(
        `${asNaturalList(robustOnlySecondary)} remain secondary robust-only co-failures and are not treated as independent primary blockers.`,
      );
    }
    return {
      rootCauseClass: "negative_energy_density",
      blockingDependencyStatus: decFails ? "dec_downstream_of_wec" : "primary_only",
      blockingDependencyNote:
        dependencyNotes.length > 0
          ? dependencyNotes.join(" ")
          : "WEC is the first emitted negative-energy blocker on this surface.",
      firstRemediationTarget: primaryReference,
      firstRemediationWhy: decFails
        ? "Start at the emitted WEC surface because DEC is downstream of the same negative energy density."
        : "Start at the emitted WEC surface because it is the first localized blocking condition.",
    };
  }

  if (primaryCondition === "dec") {
    if (wecFails) {
      return {
        rootCauseClass: "dec_downstream_of_negative_energy",
        blockingDependencyStatus: "dec_downstream_of_wec",
        blockingDependencyNote:
          "DEC localizes first on this surface, but emitted WEC is also negative, so DEC is treated as downstream of the same negative-energy driver.",
        firstRemediationTarget: `${tensor.tensorId}.conditions.wec`,
        firstRemediationWhy:
          "Start at the emitted WEC surface because DEC is downstream of the same negative energy density.",
      };
    }
    return {
      rootCauseClass: "mixed_independent",
      blockingDependencyStatus:
        necFails || secFails ? "independent_cofailure" : "primary_only",
      blockingDependencyNote:
        "DEC is the first emitted blocker on this surface and no upstream WEC failure is present.",
      firstRemediationTarget: primaryReference,
      firstRemediationWhy:
        "Start at the emitted DEC surface because no upstream WEC blocker is present on this tensor.",
    };
  }

  if (primaryCondition === "nec") {
    return {
      rootCauseClass: "null_violation_independent",
      blockingDependencyStatus:
        wecFails || decFails || secFails ? "independent_cofailure" : "primary_only",
      blockingDependencyNote:
        "NEC is the first emitted blocker on this surface and is treated as an independent null-direction violation.",
      firstRemediationTarget: primaryReference,
      firstRemediationWhy:
        "Start at the emitted NEC surface because it is the first independent null-direction blocker.",
    };
  }

  if (primaryCondition === "sec") {
    return {
      rootCauseClass: "strong_condition_independent",
      blockingDependencyStatus:
        wecFails || necFails || decFails ? "independent_cofailure" : "primary_only",
      blockingDependencyNote:
        "SEC is the first emitted blocker on this surface and is treated as an independent strong-condition failure.",
      firstRemediationTarget: primaryReference,
      firstRemediationWhy:
        "Start at the emitted SEC surface because it is the first independent strong-condition blocker.",
    };
  }

  if (primaryCondition === "mixed") {
    return {
      rootCauseClass: "mixed_independent",
      blockingDependencyStatus: "mixed",
      blockingDependencyNote:
        "Multiple emitted observer conditions compete as primary blockers on this surface.",
      firstRemediationTarget: primaryReference,
      firstRemediationWhy:
        "No single emitted condition dominates strongly enough for a narrower remediation target.",
    };
  }

  return {
    rootCauseClass: "unknown",
    blockingDependencyStatus: "unknown",
    blockingDependencyNote: null,
    firstRemediationTarget: null,
    firstRemediationWhy: null,
  };
};

const normalizeRootCauseFamily = (
  value: Nhm2ObserverRootCauseClass,
): string | null => {
  switch (value) {
    case "negative_energy_density":
    case "dec_downstream_of_negative_energy":
      return "negative_energy_density";
    case "null_violation_independent":
      return "null_violation_independent";
    case "strong_condition_independent":
      return "strong_condition_independent";
    case "mixed_independent":
      return "mixed_independent";
    default:
      return null;
  }
};

const normalizeUpstreamDriverFamily = (
  value: Nhm2ObserverUpstreamDriverClass,
): string | null => {
  switch (value) {
    case "metric_t00_density":
    case "tile_t00_density":
      return "t00_density";
    case "metric_energy_density_proxy":
    case "tile_energy_density_proxy":
      return "energy_density_proxy";
    default:
      return null;
  }
};

const isUpstreamDriverClass = (
  value: unknown,
): value is Nhm2ObserverUpstreamDriverClass =>
  NHM2_OBSERVER_UPSTREAM_DRIVER_CLASS_VALUES.includes(
    value as Nhm2ObserverUpstreamDriverClass,
  );

const isUpstreamDriverDependencyStatus = (
  value: unknown,
): value is Nhm2ObserverUpstreamDriverDependencyStatus =>
  NHM2_OBSERVER_UPSTREAM_DRIVER_DEPENDENCY_STATUS_VALUES.includes(
    value as Nhm2ObserverUpstreamDriverDependencyStatus,
  );

const isSharedUpstreamDriverStatus = (
  value: unknown,
): value is Nhm2ObserverSharedUpstreamDriverStatus =>
  NHM2_OBSERVER_SHARED_UPSTREAM_DRIVER_STATUS_VALUES.includes(
    value as Nhm2ObserverSharedUpstreamDriverStatus,
  );

const isWecPropagationStatus = (
  value: unknown,
): value is Nhm2ObserverWecPropagationStatus =>
  NHM2_OBSERVER_WEC_PROPAGATION_STATUS_VALUES.includes(
    value as Nhm2ObserverWecPropagationStatus,
  );

const isRemediationSequenceStatus = (
  value: unknown,
): value is Nhm2ObserverRemediationSequenceStatus =>
  NHM2_OBSERVER_REMEDIATION_SEQUENCE_STATUS_VALUES.includes(
    value as Nhm2ObserverRemediationSequenceStatus,
  );

const isTileDiminishingReturnStatus = (
  value: unknown,
): value is Nhm2ObserverTileDiminishingReturnStatus =>
  NHM2_OBSERVER_TILE_DIMINISHING_RETURN_STATUS_VALUES.includes(
    value as Nhm2ObserverTileDiminishingReturnStatus,
  );

const isMetricCompletenessStatus = (
  value: unknown,
): value is Nhm2ObserverMetricCompletenessStatus =>
  NHM2_OBSERVER_METRIC_COMPLETENESS_STATUS_VALUES.includes(
    value as Nhm2ObserverMetricCompletenessStatus,
  );

const isMetricCoverageBlockerStatus = (
  value: unknown,
): value is Nhm2ObserverMetricCoverageBlockerStatus =>
  NHM2_OBSERVER_METRIC_COVERAGE_BLOCKER_STATUS_VALUES.includes(
    value as Nhm2ObserverMetricCoverageBlockerStatus,
  );

const isMetricFirstMissingStage = (
  value: unknown,
): value is Nhm2ObserverMetricFirstMissingStage =>
  NHM2_OBSERVER_METRIC_FIRST_MISSING_STAGE_VALUES.includes(
    value as Nhm2ObserverMetricFirstMissingStage,
  );

const isMetricEmissionAdmissionStatus = (
  value: unknown,
): value is Nhm2ObserverMetricEmissionAdmissionStatus =>
  NHM2_OBSERVER_METRIC_EMISSION_ADMISSION_STATUS_VALUES.includes(
    value as Nhm2ObserverMetricEmissionAdmissionStatus,
  );

const isMetricComponentAdmissionStatus = (
  value: unknown,
): value is Nhm2ObserverMetricComponentAdmissionStatus =>
  NHM2_OBSERVER_METRIC_COMPONENT_ADMISSION_STATUS_VALUES.includes(
    value as Nhm2ObserverMetricComponentAdmissionStatus,
  );

const isMetricProducerEvidenceStatus = (
  value: unknown,
): value is Nhm2ObserverMetricProducerEvidenceStatus =>
  NHM2_OBSERVER_METRIC_PRODUCER_EVIDENCE_STATUS_VALUES.includes(
    value as Nhm2ObserverMetricProducerEvidenceStatus,
  );

const isMetricProducerEmissionShape = (
  value: unknown,
): value is Nhm2ObserverMetricProducerEmissionShape =>
  NHM2_OBSERVER_METRIC_PRODUCER_EMISSION_SHAPE_VALUES.includes(
    value as Nhm2ObserverMetricProducerEmissionShape,
  );

const isModelTermSemanticAdmission = (
  value: unknown,
): value is Nhm2ObserverModelTermSemanticAdmission =>
  NHM2_OBSERVER_MODEL_TERM_SEMANTIC_ADMISSION_VALUES.includes(
    value as Nhm2ObserverModelTermSemanticAdmission,
  );

const isModelTermRouteAdmissionPromotionBasis = (
  value: unknown,
): value is Nhm2ObserverModelTermRouteAdmissionPromotionBasis =>
  NHM2_OBSERVER_MODEL_TERM_ROUTE_ADMISSION_PROMOTION_BASIS_VALUES.includes(
    value as Nhm2ObserverModelTermRouteAdmissionPromotionBasis,
  );

const isModelTermSemanticDecision = (
  value: unknown,
): value is Nhm2ObserverModelTermSemanticDecision =>
  NHM2_OBSERVER_MODEL_TERM_SEMANTIC_DECISION_VALUES.includes(
    value as Nhm2ObserverModelTermSemanticDecision,
  );

const isModelTermSemanticCheckStatus = (
  value: unknown,
): value is Nhm2ObserverModelTermSemanticCheckStatus =>
  NHM2_OBSERVER_MODEL_TERM_SEMANTIC_CHECK_STATUS_VALUES.includes(
    value as Nhm2ObserverModelTermSemanticCheckStatus,
  );

const isModelTermSemanticReasonCode = (
  value: unknown,
): value is Nhm2ObserverModelTermSemanticReasonCode =>
  NHM2_OBSERVER_MODEL_TERM_SEMANTIC_REASON_CODE_VALUES.includes(
    value as Nhm2ObserverModelTermSemanticReasonCode,
  );

const isModelTermClosurePath = (
  value: unknown,
): value is Nhm2ObserverModelTermClosurePath =>
  NHM2_OBSERVER_MODEL_TERM_CLOSURE_PATH_VALUES.includes(
    value as Nhm2ObserverModelTermClosurePath,
  );

const isModelTermClosureRouteHint = (
  value: unknown,
): value is Nhm2ObserverModelTermClosureRouteHint =>
  NHM2_OBSERVER_MODEL_TERM_CLOSURE_ROUTE_HINT_VALUES.includes(
    value as Nhm2ObserverModelTermClosureRouteHint,
  );

const isModelTermClosureNextPatch = (
  value: unknown,
): value is Nhm2ObserverModelTermClosureNextPatch =>
  NHM2_OBSERVER_MODEL_TERM_CLOSURE_NEXT_PATCH_VALUES.includes(
    value as Nhm2ObserverModelTermClosureNextPatch,
  );

const isMetricProducerAdmissionEvidence = (
  value: unknown,
): value is Nhm2ObserverMetricProducerAdmissionEvidence => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const support = record.supportFieldEvidence as Record<string, unknown> | undefined;
  return (
    (record.semanticsRef === null || typeof record.semanticsRef === "string") &&
    (record.chartRef === null || typeof record.chartRef === "string") &&
    Array.isArray(record.producerModuleRef) &&
    record.producerModuleRef.every((entry) => typeof entry === "string") &&
    isMetricProducerEmissionShape(record.currentEmissionShape) &&
    Array.isArray(record.currentOutputFamilies) &&
    record.currentOutputFamilies.every((entry) => typeof entry === "string") &&
    support != null &&
    isMetricProducerEvidenceStatus(support.alpha) &&
    isMetricProducerEvidenceStatus(support.beta_i) &&
    isMetricProducerEvidenceStatus(support.gamma_ij) &&
    isMetricProducerEvidenceStatus(support.K_ij) &&
    isMetricProducerEvidenceStatus(support.D_j_Kj_i_minus_D_i_K_route) &&
    isMetricProducerEvidenceStatus(
      support.time_derivative_or_Kij_evolution_route,
    ) &&
    isMetricProducerEvidenceStatus(support.full_einstein_tensor_route) &&
    isMetricComponentAdmissionStatus(record.t0iAdmissionBranch) &&
    isMetricComponentAdmissionStatus(record.offDiagonalTijAdmissionBranch) &&
    (record.nextInspectionTarget === null ||
      typeof record.nextInspectionTarget === "string") &&
    Array.isArray(record.notes) &&
    record.notes.every((entry) => typeof entry === "string")
  );
};

const isModelTermSemanticAdmissionEvidence = (
  value: unknown,
): value is Nhm2ObserverModelTermSemanticAdmissionEvidence => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const checks = record.checks as Record<string, unknown> | undefined;
  const einsteinTensorRouteEvidence = (record.einsteinTensorRouteEvidence ??
    null) as Record<string, unknown> | null;
  const residualAttributionEvidence = (record.einsteinResidualAttributionEvidence ??
    null) as Record<string, unknown> | null;
  const residualComponents = (residualAttributionEvidence?.componentResiduals ??
    null) as Record<string, unknown> | null;
  const residualSweep = Array.isArray(residualAttributionEvidence?.conventionSweep)
    ? residualAttributionEvidence?.conventionSweep
    : null;
  const evaluatorClosureEvidence = (record.einsteinEvaluatorClosureEvidence ??
    null) as Record<string, unknown> | null;
  const evaluatorResolutionSweep = (evaluatorClosureEvidence?.resolutionSweep ??
    null) as Record<string, unknown> | null;
  const evaluatorCoarseSweep = (evaluatorResolutionSweep?.coarse ??
    null) as Record<string, unknown> | null;
  const evaluatorRefinedSweep = (evaluatorResolutionSweep?.refined ??
    null) as Record<string, unknown> | null;
  const evaluatorSuperRefinedSweep = (evaluatorResolutionSweep?.superRefined ??
    null) as Record<string, unknown> | null;
  const evaluatorConvergenceOrder = (evaluatorClosureEvidence?.observedConvergenceOrder ??
    null) as Record<string, unknown> | null;
  const evaluatorRichardsonResidual = (evaluatorClosureEvidence?.richardsonExtrapolatedResidual ??
    null) as Record<string, unknown> | null;
  const evaluatorConventionSweep = Array.isArray(
    evaluatorClosureEvidence?.conventionSweep,
  )
    ? evaluatorClosureEvidence?.conventionSweep
    : null;
  const einsteinValidationSuite = (record.einsteinRouteValidationSuite ??
    null) as Record<string, unknown> | null;
  const einsteinValidationCases = Array.isArray(einsteinValidationSuite?.cases)
    ? einsteinValidationSuite?.cases
    : null;
  const closurePathDecision = (record.closurePathDecision ??
    null) as Record<string, unknown> | null;
  const hasValidEinsteinRouteEvidence =
    einsteinTensorRouteEvidence == null ||
    (NHM2_OBSERVER_MODEL_TERM_EINSTEIN_ROUTE_STATUS_VALUES.includes(
      einsteinTensorRouteEvidence.status as Nhm2ObserverModelTermEinsteinRouteStatus,
    ) &&
      (einsteinTensorRouteEvidence.routeId === null ||
        typeof einsteinTensorRouteEvidence.routeId === "string") &&
      (einsteinTensorRouteEvidence.tensorSource === null ||
        typeof einsteinTensorRouteEvidence.tensorSource === "string") &&
      (einsteinTensorRouteEvidence.comparedSampleCount === null ||
        typeof einsteinTensorRouteEvidence.comparedSampleCount === "number") &&
      (einsteinTensorRouteEvidence.maxRelativeResidual === null ||
        typeof einsteinTensorRouteEvidence.maxRelativeResidual === "number") &&
      (einsteinTensorRouteEvidence.t00ComparedSampleCount === undefined ||
        einsteinTensorRouteEvidence.t00ComparedSampleCount === null ||
        typeof einsteinTensorRouteEvidence.t00ComparedSampleCount === "number") &&
      (einsteinTensorRouteEvidence.t00MaxRelativeResidual === undefined ||
        einsteinTensorRouteEvidence.t00MaxRelativeResidual === null ||
        typeof einsteinTensorRouteEvidence.t00MaxRelativeResidual === "number") &&
      (einsteinTensorRouteEvidence.t00RelativeResidualThreshold === undefined ||
        einsteinTensorRouteEvidence.t00RelativeResidualThreshold === null ||
        typeof einsteinTensorRouteEvidence.t00RelativeResidualThreshold ===
          "number") &&
      (einsteinTensorRouteEvidence.note === null ||
        typeof einsteinTensorRouteEvidence.note === "string"));
  const hasValidResidualAttributionEvidence =
    residualAttributionEvidence == null ||
    (NHM2_OBSERVER_MODEL_TERM_EINSTEIN_ROUTE_STATUS_VALUES.includes(
      residualAttributionEvidence.status as Nhm2ObserverModelTermEinsteinRouteStatus,
    ) &&
      (residualAttributionEvidence.sampleCount === null ||
        typeof residualAttributionEvidence.sampleCount === "number") &&
      (residualAttributionEvidence.maxRelativeResidual === null ||
        typeof residualAttributionEvidence.maxRelativeResidual === "number") &&
      residualComponents != null &&
      (residualComponents.T01 === null || typeof residualComponents.T01 === "number") &&
      (residualComponents.T02 === null || typeof residualComponents.T02 === "number") &&
      (residualComponents.T03 === null || typeof residualComponents.T03 === "number") &&
      (residualComponents.T12 === null || typeof residualComponents.T12 === "number") &&
      (residualComponents.T13 === null || typeof residualComponents.T13 === "number") &&
      (residualComponents.T23 === null || typeof residualComponents.T23 === "number") &&
      residualSweep != null &&
      residualSweep.every(
        (entry) =>
          entry != null &&
          typeof entry === "object" &&
          typeof (entry as Record<string, unknown>).candidateId === "string" &&
          NHM2_OBSERVER_MODEL_TERM_EINSTEIN_ROUTE_STATUS_VALUES.includes(
            (entry as Record<string, unknown>)
              .status as Nhm2ObserverModelTermEinsteinRouteStatus,
          ) &&
          (((entry as Record<string, unknown>).maxRelativeResidual === null) ||
            typeof (entry as Record<string, unknown>).maxRelativeResidual ===
              "number") &&
          (((entry as Record<string, unknown>).note === null) ||
            typeof (entry as Record<string, unknown>).note === "string"),
      ) &&
      (residualAttributionEvidence.bestCandidateId === null ||
        typeof residualAttributionEvidence.bestCandidateId === "string") &&
      (residualAttributionEvidence.bestCandidateResidual === null ||
        typeof residualAttributionEvidence.bestCandidateResidual === "number") &&
      NHM2_OBSERVER_MODEL_TERM_RESIDUAL_DIAGNOSIS_CLASS_VALUES.includes(
        residualAttributionEvidence.diagnosisClass as Nhm2ObserverModelTermResidualDiagnosisClass,
      ) &&
      (residualAttributionEvidence.note === null ||
        typeof residualAttributionEvidence.note === "string"));
  const hasValidEvaluatorClosureEvidence =
    evaluatorClosureEvidence == null ||
    (NHM2_OBSERVER_MODEL_TERM_EINSTEIN_ROUTE_STATUS_VALUES.includes(
      evaluatorClosureEvidence.status as Nhm2ObserverModelTermEinsteinRouteStatus,
    ) &&
      (evaluatorClosureEvidence.chartRef === null ||
        typeof evaluatorClosureEvidence.chartRef === "string") &&
      (evaluatorClosureEvidence.routeId === null ||
        typeof evaluatorClosureEvidence.routeId === "string") &&
      (evaluatorClosureEvidence.unitConvention === null ||
        typeof evaluatorClosureEvidence.unitConvention === "string") &&
      (evaluatorClosureEvidence.signConvention === null ||
        typeof evaluatorClosureEvidence.signConvention === "string") &&
      evaluatorCoarseSweep != null &&
      evaluatorRefinedSweep != null &&
      evaluatorSuperRefinedSweep != null &&
      (evaluatorCoarseSweep.step_m === null ||
        typeof evaluatorCoarseSweep.step_m === "number") &&
      (evaluatorCoarseSweep.comparedSampleCount === null ||
        typeof evaluatorCoarseSweep.comparedSampleCount === "number") &&
      (evaluatorCoarseSweep.t0iMaxRelativeResidual === null ||
        typeof evaluatorCoarseSweep.t0iMaxRelativeResidual === "number") &&
      (evaluatorCoarseSweep.offDiagonalMaxRelativeResidual === null ||
        typeof evaluatorCoarseSweep.offDiagonalMaxRelativeResidual === "number") &&
      (evaluatorRefinedSweep.step_m === null ||
        typeof evaluatorRefinedSweep.step_m === "number") &&
      (evaluatorRefinedSweep.comparedSampleCount === null ||
        typeof evaluatorRefinedSweep.comparedSampleCount === "number") &&
      (evaluatorRefinedSweep.t0iMaxRelativeResidual === null ||
        typeof evaluatorRefinedSweep.t0iMaxRelativeResidual === "number") &&
      (evaluatorRefinedSweep.offDiagonalMaxRelativeResidual === null ||
        typeof evaluatorRefinedSweep.offDiagonalMaxRelativeResidual === "number") &&
      (evaluatorSuperRefinedSweep.step_m === null ||
        typeof evaluatorSuperRefinedSweep.step_m === "number") &&
      (evaluatorSuperRefinedSweep.comparedSampleCount === null ||
        typeof evaluatorSuperRefinedSweep.comparedSampleCount === "number") &&
      (evaluatorSuperRefinedSweep.t0iMaxRelativeResidual === null ||
        typeof evaluatorSuperRefinedSweep.t0iMaxRelativeResidual === "number") &&
      (evaluatorSuperRefinedSweep.offDiagonalMaxRelativeResidual === null ||
        typeof evaluatorSuperRefinedSweep.offDiagonalMaxRelativeResidual ===
          "number") &&
      evaluatorConvergenceOrder != null &&
      (evaluatorConvergenceOrder.t0i === null ||
        typeof evaluatorConvergenceOrder.t0i === "number") &&
      (evaluatorConvergenceOrder.offDiagonal === null ||
        typeof evaluatorConvergenceOrder.offDiagonal === "number") &&
      evaluatorRichardsonResidual != null &&
      (evaluatorRichardsonResidual.t0i === null ||
        typeof evaluatorRichardsonResidual.t0i === "number") &&
      (evaluatorRichardsonResidual.offDiagonal === null ||
        typeof evaluatorRichardsonResidual.offDiagonal === "number") &&
      evaluatorConventionSweep != null &&
      evaluatorConventionSweep.every(
        (entry) =>
          entry != null &&
          typeof entry === "object" &&
          typeof (entry as Record<string, unknown>).candidateId === "string" &&
          NHM2_OBSERVER_MODEL_TERM_EINSTEIN_ROUTE_STATUS_VALUES.includes(
            (entry as Record<string, unknown>)
              .status as Nhm2ObserverModelTermEinsteinRouteStatus,
          ) &&
          (((entry as Record<string, unknown>).maxRelativeResidual === null) ||
            typeof (entry as Record<string, unknown>).maxRelativeResidual ===
              "number") &&
          (((entry as Record<string, unknown>).note === null) ||
            typeof (entry as Record<string, unknown>).note === "string"),
      ) &&
      (evaluatorClosureEvidence.bestCandidateId === null ||
        typeof evaluatorClosureEvidence.bestCandidateId === "string") &&
      NHM2_OBSERVER_MODEL_TERM_RESIDUAL_DIAGNOSIS_CLASS_VALUES.includes(
        evaluatorClosureEvidence.diagnosisClass as Nhm2ObserverModelTermResidualDiagnosisClass,
      ) &&
      (evaluatorClosureEvidence.note === null ||
        typeof evaluatorClosureEvidence.note === "string") &&
      Array.isArray(evaluatorClosureEvidence.citationRefs) &&
      evaluatorClosureEvidence.citationRefs.every(
        (entry) => typeof entry === "string",
      ));
  const hasValidEinsteinValidationSuite =
    einsteinValidationSuite == null ||
    (isModelTermSemanticCheckStatus(einsteinValidationSuite.status) &&
      typeof einsteinValidationSuite.admittedForRoutePass === "boolean" &&
      (einsteinValidationSuite.residualThreshold === null ||
        typeof einsteinValidationSuite.residualThreshold === "number") &&
      typeof einsteinValidationSuite.evaluatedCaseCount === "number" &&
      typeof einsteinValidationSuite.passedCaseCount === "number" &&
      einsteinValidationCases != null &&
      einsteinValidationCases.every(
        (entry) =>
          entry != null &&
          typeof entry === "object" &&
          NHM2_OBSERVER_MODEL_TERM_EINSTEIN_VALIDATION_CASE_VALUES.includes(
            (entry as Record<string, unknown>)
              .caseId as Nhm2ObserverModelTermEinsteinValidationCaseId,
          ) &&
          isModelTermSemanticCheckStatus((entry as Record<string, unknown>).status) &&
          (((entry as Record<string, unknown>).maxAbsResidual === null) ||
            typeof (entry as Record<string, unknown>).maxAbsResidual === "number") &&
          typeof (entry as Record<string, unknown>).expectedNearZero === "boolean" &&
          (((entry as Record<string, unknown>).note === null) ||
            typeof (entry as Record<string, unknown>).note === "string") &&
          Array.isArray((entry as Record<string, unknown>).citationRefs) &&
          ((entry as Record<string, unknown>).citationRefs as unknown[]).every(
            (citation) => typeof citation === "string",
          ),
      ) &&
      (einsteinValidationSuite.note === null ||
        typeof einsteinValidationSuite.note === "string") &&
      Array.isArray(einsteinValidationSuite.citationRefs) &&
      einsteinValidationSuite.citationRefs.every(
        (entry) => typeof entry === "string",
      ));
  const hasValidClosurePathDecision =
    closurePathDecision == null ||
    (isModelTermClosurePath(closurePathDecision.selectedPath) &&
      isModelTermSemanticCheckStatus(closurePathDecision.admPathStatus) &&
      isModelTermSemanticCheckStatus(closurePathDecision.fullEinsteinPathStatus) &&
      isModelTermClosureRouteHint(closurePathDecision.routeHint) &&
      isModelTermClosureNextPatch(closurePathDecision.nextPatchClass) &&
      (closurePathDecision.patchBriefRef === null ||
        typeof closurePathDecision.patchBriefRef === "string") &&
      (closurePathDecision.rationale === null ||
        typeof closurePathDecision.rationale === "string") &&
      Array.isArray(closurePathDecision.blockerCodes) &&
      closurePathDecision.blockerCodes.every((entry) =>
        isModelTermSemanticReasonCode(entry),
      ) &&
      (closurePathDecision.nonBlockingCodes === undefined ||
        (Array.isArray(closurePathDecision.nonBlockingCodes) &&
          closurePathDecision.nonBlockingCodes.every((entry) =>
            isModelTermSemanticReasonCode(entry),
          ))) &&
      Array.isArray(closurePathDecision.citationRefs) &&
      closurePathDecision.citationRefs.every((entry) => typeof entry === "string") &&
      Array.isArray(closurePathDecision.notes) &&
      closurePathDecision.notes.every((entry) => typeof entry === "string"));
  return (
    (record.semanticsRef === null || typeof record.semanticsRef === "string") &&
    (record.researchBasisRef === null ||
      typeof record.researchBasisRef === "string") &&
    (record.chartRef === null || typeof record.chartRef === "string") &&
    (record.routeId === null || typeof record.routeId === "string") &&
    isModelTermSemanticAdmission(record.routeAdmissionRaw) &&
    isModelTermSemanticAdmission(record.routeAdmissionEffective) &&
    isModelTermRouteAdmissionPromotionBasis(record.routeAdmissionPromotionBasis) &&
    isModelTermSemanticAdmission(record.routeAdmission) &&
    isModelTermSemanticDecision(record.decision) &&
    Array.isArray(record.reasonCodes) &&
    record.reasonCodes.every((entry) => isModelTermSemanticReasonCode(entry)) &&
    checks != null &&
    isModelTermSemanticCheckStatus(checks.routeMetadata) &&
    isModelTermSemanticCheckStatus(checks.chart) &&
    isModelTermSemanticCheckStatus(checks.finiteTensorComponents) &&
    isModelTermSemanticCheckStatus(checks.t0iSymmetry) &&
    isModelTermSemanticCheckStatus(checks.offDiagonalTijSymmetry) &&
    isModelTermSemanticCheckStatus(checks.supportFieldRouteAdmission) &&
    isModelTermSemanticCheckStatus(checks.fullEinsteinTensorRouteAdmission) &&
    isModelTermSemanticCheckStatus(checks.citationBasis) &&
    isModelTermSemanticCheckStatus(checks.finiteDifferenceConvergence) &&
    isModelTermSemanticCheckStatus(checks.independentCrossCheck) &&
    isModelTermSemanticCheckStatus(checks.einsteinT00Comparability) &&
    isModelTermSemanticCheckStatus(checks.dtGammaAssumptionBounded) &&
    isModelTermSemanticCheckStatus(checks.citationCoverage) &&
    hasValidEinsteinRouteEvidence &&
    hasValidResidualAttributionEvidence &&
    hasValidEvaluatorClosureEvidence &&
    hasValidEinsteinValidationSuite &&
    hasValidClosurePathDecision &&
    Array.isArray(record.citationRefs) &&
    record.citationRefs.every((entry) => typeof entry === "string") &&
    Array.isArray(record.notes) &&
    record.notes.every((entry) => typeof entry === "string")
  );
};

const isDecDominantViolationClass = (
  value: unknown,
): value is Nhm2ObserverDecDominantViolationClass =>
  NHM2_OBSERVER_DEC_DOMINANT_VIOLATION_CLASS_VALUES.includes(
    value as Nhm2ObserverDecDominantViolationClass,
  );

const isDecRecommendedPatchClass = (
  value: unknown,
): value is Nhm2ObserverDecRecommendedPatchClass =>
  NHM2_OBSERVER_DEC_RECOMMENDED_PATCH_CLASS_VALUES.includes(
    value as Nhm2ObserverDecRecommendedPatchClass,
  );

const isDecPhysicsSelectionDecision = (
  value: unknown,
): value is Nhm2ObserverDecPhysicsSelectionDecision =>
  NHM2_OBSERVER_DEC_PHYSICS_SELECTION_DECISION_VALUES.includes(
    value as Nhm2ObserverDecPhysicsSelectionDecision,
  );

const isDecPhysicsSelectionPlateauStatus = (
  value: unknown,
): value is Nhm2ObserverDecPhysicsSelectionPlateauStatus =>
  NHM2_OBSERVER_DEC_PHYSICS_SELECTION_PLATEAU_STATUS_VALUES.includes(
    value as Nhm2ObserverDecPhysicsSelectionPlateauStatus,
  );

const isDecPhysicsSelectionReasonCode = (
  value: unknown,
): value is Nhm2ObserverDecPhysicsSelectionReasonCode =>
  NHM2_OBSERVER_DEC_PHYSICS_SELECTION_REASON_CODE_VALUES.includes(
    value as Nhm2ObserverDecPhysicsSelectionReasonCode,
  );

const isDecPhysicsSweepPhase = (
  value: unknown,
): value is Nhm2ObserverDecPhysicsSweepPhase =>
  NHM2_OBSERVER_DEC_PHYSICS_SWEEP_PHASE_VALUES.includes(
    value as Nhm2ObserverDecPhysicsSweepPhase,
  );

const isDecPhysicsUncertaintyTag = (
  value: unknown,
): value is Nhm2ObserverDecPhysicsUncertaintyTag =>
  NHM2_OBSERVER_DEC_PHYSICS_UNCERTAINTY_TAG_VALUES.includes(
    value as Nhm2ObserverDecPhysicsUncertaintyTag,
  );

const isDecResidualAttributionStatus = (
  value: unknown,
): value is Nhm2ObserverDecResidualAttributionStatus =>
  NHM2_OBSERVER_DEC_RESIDUAL_ATTRIBUTION_STATUS_VALUES.includes(
    value as Nhm2ObserverDecResidualAttributionStatus,
  );

const isDecResidualPrimarySurface = (
  value: unknown,
): value is Nhm2ObserverDecResidualPrimarySurface =>
  NHM2_OBSERVER_DEC_RESIDUAL_PRIMARY_SURFACE_VALUES.includes(
    value as Nhm2ObserverDecResidualPrimarySurface,
  );

const isDecPhysicsRuntimeApplicationStatus = (
  value: unknown,
): value is Nhm2ObserverDecPhysicsRuntimeApplicationStatus =>
  NHM2_OBSERVER_DEC_PHYSICS_RUNTIME_APPLICATION_STATUS_VALUES.includes(
    value as Nhm2ObserverDecPhysicsRuntimeApplicationStatus,
  );

const isDecPhysicsRuntimeFailureMode = (
  value: unknown,
): value is Nhm2ObserverDecPhysicsRuntimeFailureMode =>
  NHM2_OBSERVER_DEC_PHYSICS_RUNTIME_FAILURE_MODE_VALUES.includes(
    value as Nhm2ObserverDecPhysicsRuntimeFailureMode,
  );

const isDecPhysicsCrossZeroMethod = (
  value: unknown,
): value is Nhm2ObserverDecPhysicsCrossZeroMethod =>
  NHM2_OBSERVER_DEC_PHYSICS_CROSS_ZERO_METHOD_VALUES.includes(
    value as Nhm2ObserverDecPhysicsCrossZeroMethod,
  );

const isDecPhysicsCrossZeroInferenceLabel = (
  value: unknown,
): value is Nhm2ObserverDecPhysicsCrossZeroInferenceLabel =>
  NHM2_OBSERVER_DEC_PHYSICS_CROSS_ZERO_INFERENCE_LABEL_VALUES.includes(
    value as Nhm2ObserverDecPhysicsCrossZeroInferenceLabel,
  );

const isDecPhysicsZeroCrossFeasibilityDecision = (
  value: unknown,
): value is Nhm2ObserverDecPhysicsZeroCrossFeasibilityDecision =>
  NHM2_OBSERVER_DEC_PHYSICS_ZERO_CROSS_FEASIBILITY_DECISION_VALUES.includes(
    value as Nhm2ObserverDecPhysicsZeroCrossFeasibilityDecision,
  );

const isDecPhysicsZeroCrossReasonCode = (
  value: unknown,
): value is Nhm2ObserverDecPhysicsZeroCrossReasonCode =>
  NHM2_OBSERVER_DEC_PHYSICS_ZERO_CROSS_REASON_CODE_VALUES.includes(
    value as Nhm2ObserverDecPhysicsZeroCrossReasonCode,
  );

const isResearchClaimConfidenceLabel = (
  value: unknown,
): value is Nhm2ObserverResearchClaimConfidenceLabel =>
  NHM2_OBSERVER_RESEARCH_CLAIM_CONFIDENCE_LABEL_VALUES.includes(
    value as Nhm2ObserverResearchClaimConfidenceLabel,
  );

const isObserverDecRemediationEvidence = (
  value: unknown,
): value is Nhm2ObserverDecRemediationEvidence => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    (record.chartRef === null || typeof record.chartRef === "string") &&
    (record.routeId === null || typeof record.routeId === "string") &&
    (record.selectedPath === null || isModelTermClosurePath(record.selectedPath)) &&
    (record.rapidityCap === null || typeof record.rapidityCap === "number") &&
    (record.rapidityCapBeta === null || typeof record.rapidityCapBeta === "number") &&
    (record.metricDecEulerianMin === null ||
      typeof record.metricDecEulerianMin === "number") &&
    (record.metricDecRobustMin === null ||
      typeof record.metricDecRobustMin === "number") &&
    (record.tileReconstitutedDecEulerianMin === null ||
      typeof record.tileReconstitutedDecEulerianMin === "number") &&
    (record.tileReconstitutedDecRobustMin === null ||
      typeof record.tileReconstitutedDecRobustMin === "number") &&
    (record.typeIFractionMetric === null ||
      typeof record.typeIFractionMetric === "number") &&
    (record.typeIFractionTileReconstituted === null ||
      typeof record.typeIFractionTileReconstituted === "number") &&
    isDecDominantViolationClass(record.dominantViolationClass) &&
    isDecRecommendedPatchClass(record.recommendedPatchClass) &&
    Array.isArray(record.citationRefs) &&
    record.citationRefs.every((entry) => typeof entry === "string") &&
    Array.isArray(record.notes) &&
    record.notes.every((entry) => typeof entry === "string")
  );
};

const isObserverDecPhysicsControlEvidence = (
  value: unknown,
): value is Nhm2ObserverDecPhysicsControlEvidence => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const baseline = record.baseline as Record<string, unknown> | undefined;
  const candidate = record.candidate as Record<string, unknown> | undefined;
  const deltas = record.deltas as Record<string, unknown> | undefined;
  const guardChecks = record.guardChecks as Record<string, unknown> | undefined;
  const sweepCandidates = record.sweepCandidates as unknown[] | undefined;
  const sweepPhaseSummary = record.sweepPhaseSummary as
    | Record<string, unknown>
    | undefined;
  const topCandidateLeaderboard = record.topCandidateLeaderboard as
    | unknown[]
    | undefined;
  const crossZeroFeasibilityEvidence = record.crossZeroFeasibilityEvidence as
    | Record<string, unknown>
    | undefined;
  const crossZeroBoundedEnvelope = crossZeroFeasibilityEvidence
    ?.boundedControlEnvelope as Record<string, unknown> | undefined;
  const crossZeroEvaluationRoute = crossZeroFeasibilityEvidence
    ?.evaluationRoute as Record<string, unknown> | undefined;
  const decResidualAttributionEvidence = record.decResidualAttributionEvidence as
    | Record<string, unknown>
    | undefined;
  const decResidualSelectedCandidate = decResidualAttributionEvidence
    ?.selectedCandidate as Record<string, unknown> | undefined;
  const boundedSearchEnvelope = record.boundedSearchEnvelope as
    | Record<string, unknown>
    | undefined;
  const nonRegressionGate = record.nonRegressionGate as
    | Record<string, unknown>
    | undefined;
  const runtimeApplication = record.runtimeApplication as
    | Record<string, unknown>
    | undefined;
  const runtimeComparabilityGate = runtimeApplication?.comparabilityGate as
    | Record<string, unknown>
    | undefined;
  const runtimeGuardChecks = runtimeApplication?.guardChecks as
    | Record<string, unknown>
    | undefined;
  const runtimeObserved = runtimeApplication?.observed as
    | Record<string, unknown>
    | undefined;
  const controlKnobs = record.controlKnobs as unknown[] | undefined;
  const claimCitationMap = record.claimCitationMap as unknown[] | undefined;
  const claimCitationMapCompleteness = record.claimCitationMapCompleteness as
    | Record<string, unknown>
    | undefined;
  const decCoupledControlEvidence = record.decCoupledControlEvidence as
    | Record<string, unknown>
    | undefined;
  const decCoupledBoundedEnvelope = decCoupledControlEvidence?.boundedEnvelope as
    | Record<string, unknown>
    | undefined;
  const decCoupledCandidateEvaluationTable =
    decCoupledControlEvidence?.candidateEvaluationTable as unknown[] | undefined;
  const decCoupledComparabilityGate = decCoupledControlEvidence?.comparabilityGate as
    | Record<string, unknown>
    | undefined;
  const decCoupledResearchClaims = decCoupledControlEvidence?.researchClaims as
    | unknown[]
    | undefined;
  const uncertaintyTags = record.uncertaintyTags as unknown[] | undefined;
  const isNumericOrNull = (entry: unknown): boolean =>
    entry === null || typeof entry === "number";
  return (
    (record.chartRef === null || typeof record.chartRef === "string") &&
    (record.routeId === null || typeof record.routeId === "string") &&
    (record.selectedPath === null || isModelTermClosurePath(record.selectedPath)) &&
    baseline != null &&
    isNumericOrNull(baseline.metricDecEulerianMin) &&
    isNumericOrNull(baseline.metricDecRobustMin) &&
    isNumericOrNull(baseline.metricWecEulerianMin) &&
    isNumericOrNull(baseline.metricWecRobustMin) &&
    isNumericOrNull(baseline.metricNecEulerianMin) &&
    isNumericOrNull(baseline.metricNecRobustMin) &&
    isNumericOrNull(baseline.tileReconstitutedDecEulerianMin) &&
    isNumericOrNull(baseline.tileReconstitutedDecRobustMin) &&
    isNumericOrNull(baseline.tileReconstitutedWecEulerianMin) &&
    isNumericOrNull(baseline.tileReconstitutedWecRobustMin) &&
    isNumericOrNull(baseline.tileReconstitutedNecEulerianMin) &&
    isNumericOrNull(baseline.tileReconstitutedNecRobustMin) &&
    candidate != null &&
    (candidate.candidateId === null || typeof candidate.candidateId === "string") &&
    typeof candidate.applied === "boolean" &&
    isNumericOrNull(candidate.metricDecEulerianMin) &&
    isNumericOrNull(candidate.metricDecRobustMin) &&
    isNumericOrNull(candidate.metricWecEulerianMin) &&
    isNumericOrNull(candidate.metricWecRobustMin) &&
    isNumericOrNull(candidate.metricNecEulerianMin) &&
    isNumericOrNull(candidate.metricNecRobustMin) &&
    isNumericOrNull(candidate.tileReconstitutedDecEulerianMin) &&
    isNumericOrNull(candidate.tileReconstitutedDecRobustMin) &&
    isNumericOrNull(candidate.tileReconstitutedWecEulerianMin) &&
    isNumericOrNull(candidate.tileReconstitutedWecRobustMin) &&
    isNumericOrNull(candidate.tileReconstitutedNecEulerianMin) &&
    isNumericOrNull(candidate.tileReconstitutedNecRobustMin) &&
    deltas != null &&
    isNumericOrNull(deltas.metricDecRobustLift) &&
    isNumericOrNull(deltas.tileReconstitutedDecRobustLift) &&
    isNumericOrNull(deltas.metricWecRobustDelta) &&
    isNumericOrNull(deltas.metricNecRobustDelta) &&
    guardChecks != null &&
    (guardChecks.metricWecNonRegression === null ||
      typeof guardChecks.metricWecNonRegression === "boolean") &&
    (guardChecks.metricNecNonRegression === null ||
      typeof guardChecks.metricNecNonRegression === "boolean") &&
    (guardChecks.emissionAdmissionStable === null ||
      typeof guardChecks.emissionAdmissionStable === "boolean") &&
    (guardChecks.semanticAdmissionStable === null ||
      typeof guardChecks.semanticAdmissionStable === "boolean") &&
    Array.isArray(sweepCandidates) &&
    sweepCandidates.every((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const candidateEntry = entry as Record<string, unknown>;
      const candidateGuardChecks = candidateEntry.guardChecks as
        | Record<string, unknown>
        | undefined;
      return (
        typeof candidateEntry.candidateId === "string" &&
        (candidateEntry.candidateClass === "baseline_hold" ||
          candidateEntry.candidateClass === "observer_domain_truncation" ||
          candidateEntry.candidateClass === "physics_control_proposal") &&
        isDecPhysicsSweepPhase(candidateEntry.sweepPhase) &&
        (candidateEntry.refineSeedCandidateId === null ||
          typeof candidateEntry.refineSeedCandidateId === "string") &&
        typeof candidateEntry.applied === "boolean" &&
        isNumericOrNull(candidateEntry.rapidityCap) &&
        isNumericOrNull(candidateEntry.rapidityCapBeta) &&
        isNumericOrNull(candidateEntry.pressureScale) &&
        isNumericOrNull(candidateEntry.densityLiftFraction) &&
        isNumericOrNull(candidateEntry.fluxScale) &&
        isNumericOrNull(candidateEntry.shearScale) &&
        isNumericOrNull(candidateEntry.metricDecRobustMin) &&
        isNumericOrNull(candidateEntry.tileReconstitutedDecRobustMin) &&
        isNumericOrNull(candidateEntry.metricWecRobustMin) &&
        isNumericOrNull(candidateEntry.metricNecRobustMin) &&
        isNumericOrNull(candidateEntry.metricDecRobustLift) &&
        isNumericOrNull(candidateEntry.tileReconstitutedDecRobustLift) &&
        isNumericOrNull(candidateEntry.metricWecRobustDelta) &&
        isNumericOrNull(candidateEntry.metricNecRobustDelta) &&
        isNumericOrNull(candidateEntry.metricDecRobustMarginToZero) &&
        isNumericOrNull(candidateEntry.tileReconstitutedDecRobustMarginToZero) &&
        (candidateEntry.crossesZeroBothDecMargins === null ||
          typeof candidateEntry.crossesZeroBothDecMargins === "boolean") &&
        isNumericOrNull(candidateEntry.metricWecNonRegressionMargin) &&
        isNumericOrNull(candidateEntry.metricNecNonRegressionMargin) &&
        isNumericOrNull(candidateEntry.selectionObjectivePrimaryMargin) &&
        isNumericOrNull(candidateEntry.controlDeviationMagnitude) &&
        candidateGuardChecks != null &&
        (candidateGuardChecks.metricWecNonRegression === null ||
          typeof candidateGuardChecks.metricWecNonRegression === "boolean") &&
        (candidateGuardChecks.metricNecNonRegression === null ||
          typeof candidateGuardChecks.metricNecNonRegression === "boolean") &&
        (candidateGuardChecks.emissionAdmissionStable === null ||
          typeof candidateGuardChecks.emissionAdmissionStable === "boolean") &&
        (candidateGuardChecks.semanticAdmissionStable === null ||
          typeof candidateGuardChecks.semanticAdmissionStable === "boolean") &&
        typeof candidateEntry.passesSelectionGate === "boolean" &&
        Array.isArray(candidateEntry.gateFailureReasons) &&
        candidateEntry.gateFailureReasons.every((reason) =>
          isDecPhysicsSelectionReasonCode(reason),
        ) &&
        (candidateEntry.note === null || typeof candidateEntry.note === "string")
      );
    }) &&
    sweepPhaseSummary != null &&
    isNumericOrNull(sweepPhaseSummary.coarseCandidateCount) &&
    isNumericOrNull(sweepPhaseSummary.coarsePassingCount) &&
    isNumericOrNull(sweepPhaseSummary.refineCandidateCount) &&
    isNumericOrNull(sweepPhaseSummary.refinePassingCount) &&
    Array.isArray(sweepPhaseSummary.refineSeedCandidateIds) &&
    sweepPhaseSummary.refineSeedCandidateIds.every(
      (entry) => typeof entry === "string",
    ) &&
    (sweepPhaseSummary.note === null ||
      typeof sweepPhaseSummary.note === "string") &&
    Array.isArray(topCandidateLeaderboard) &&
    topCandidateLeaderboard.every((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const leaderboardEntry = entry as Record<string, unknown>;
      return (
        typeof leaderboardEntry.rank === "number" &&
        typeof leaderboardEntry.candidateId === "string" &&
        (leaderboardEntry.candidateClass === "baseline_hold" ||
          leaderboardEntry.candidateClass === "observer_domain_truncation" ||
          leaderboardEntry.candidateClass === "physics_control_proposal") &&
        isDecPhysicsSweepPhase(leaderboardEntry.sweepPhase) &&
        typeof leaderboardEntry.passesSelectionGate === "boolean" &&
        (leaderboardEntry.crossesZeroBothDecMargins === null ||
          typeof leaderboardEntry.crossesZeroBothDecMargins === "boolean") &&
        isNumericOrNull(leaderboardEntry.selectionObjectivePrimaryMargin) &&
        isNumericOrNull(leaderboardEntry.metricDecRobustLift) &&
        isNumericOrNull(leaderboardEntry.tileReconstitutedDecRobustLift) &&
        isNumericOrNull(leaderboardEntry.controlDeviationMagnitude)
      );
    }) &&
    (record.selectionObjective === null ||
      typeof record.selectionObjective === "string") &&
    (record.selectedCandidateId === null ||
      typeof record.selectedCandidateId === "string") &&
    isDecPhysicsSelectionDecision(record.selectionDecision) &&
    isDecPhysicsSelectionPlateauStatus(record.selectionPlateauStatus) &&
    crossZeroFeasibilityEvidence != null &&
    isNumericOrNull(crossZeroFeasibilityEvidence.baselinePrimaryMargin) &&
    isNumericOrNull(crossZeroFeasibilityEvidence.bestCandidatePrimaryMargin) &&
    isNumericOrNull(crossZeroFeasibilityEvidence.requiredLiftToZero) &&
    isNumericOrNull(crossZeroFeasibilityEvidence.achievedLiftFromBaseline) &&
    isNumericOrNull(crossZeroFeasibilityEvidence.bestAchievedLift) &&
    isNumericOrNull(crossZeroFeasibilityEvidence.residualMarginToZero) &&
    isNumericOrNull(crossZeroFeasibilityEvidence.gapToZero) &&
    (crossZeroFeasibilityEvidence.crossZeroAchieved === null ||
      typeof crossZeroFeasibilityEvidence.crossZeroAchieved === "boolean") &&
    crossZeroBoundedEnvelope != null &&
    isNumericOrNull(crossZeroBoundedEnvelope.pressureScaleMin) &&
    isNumericOrNull(crossZeroBoundedEnvelope.pressureScaleMax) &&
    isNumericOrNull(crossZeroBoundedEnvelope.densityLiftMin) &&
    isNumericOrNull(crossZeroBoundedEnvelope.densityLiftMax) &&
    isNumericOrNull(crossZeroBoundedEnvelope.fluxScaleMin) &&
    isNumericOrNull(crossZeroBoundedEnvelope.fluxScaleMax) &&
    isNumericOrNull(crossZeroBoundedEnvelope.shearScaleMin) &&
    isNumericOrNull(crossZeroBoundedEnvelope.shearScaleMax) &&
    crossZeroEvaluationRoute != null &&
    (crossZeroEvaluationRoute.chartRef === null ||
      typeof crossZeroEvaluationRoute.chartRef === "string") &&
    (crossZeroEvaluationRoute.routeId === null ||
      typeof crossZeroEvaluationRoute.routeId === "string") &&
    (crossZeroEvaluationRoute.selectedPath === null ||
      isModelTermClosurePath(crossZeroEvaluationRoute.selectedPath)) &&
    isModelTermSemanticCheckStatus(
      crossZeroEvaluationRoute.independentCrossCheckStatus,
    ) &&
    (crossZeroEvaluationRoute.runtimeComparabilityPass === null ||
      typeof crossZeroEvaluationRoute.runtimeComparabilityPass === "boolean") &&
    isDecPhysicsCrossZeroMethod(crossZeroFeasibilityEvidence.method) &&
    isDecPhysicsCrossZeroInferenceLabel(crossZeroFeasibilityEvidence.inferenceLabel) &&
    Array.isArray(crossZeroFeasibilityEvidence.citationRefs) &&
    crossZeroFeasibilityEvidence.citationRefs.every(
      (entry) => typeof entry === "string",
    ) &&
    Array.isArray(crossZeroFeasibilityEvidence.notes) &&
    crossZeroFeasibilityEvidence.notes.every((entry) => typeof entry === "string") &&
    (decResidualAttributionEvidence === undefined ||
      (isDecResidualAttributionStatus(decResidualAttributionEvidence.status) &&
        isDecResidualPrimarySurface(decResidualAttributionEvidence.primarySurface) &&
        isDecDominantViolationClass(
          decResidualAttributionEvidence.dominantViolationClass,
        ) &&
        isNumericOrNull(decResidualAttributionEvidence.baselinePrimaryMargin) &&
        isNumericOrNull(decResidualAttributionEvidence.selectedPrimaryMargin) &&
        isNumericOrNull(decResidualAttributionEvidence.requiredLiftToZero) &&
        isNumericOrNull(decResidualAttributionEvidence.achievedLiftFromBaseline) &&
        isNumericOrNull(decResidualAttributionEvidence.residualMarginToZero) &&
        isNumericOrNull(decResidualAttributionEvidence.gapToZero) &&
        isDecPhysicsSelectionPlateauStatus(
          decResidualAttributionEvidence.selectionPlateauStatus,
        ) &&
        Array.isArray(decResidualAttributionEvidence.selectionReasonCodes) &&
        decResidualAttributionEvidence.selectionReasonCodes.every((reason) =>
          isDecPhysicsSelectionReasonCode(reason),
        ) &&
        isDecPhysicsZeroCrossFeasibilityDecision(
          decResidualAttributionEvidence.zeroCrossFeasibilityDecision,
        ) &&
        (decResidualAttributionEvidence.rankingBasis === null ||
          typeof decResidualAttributionEvidence.rankingBasis === "string") &&
        decResidualSelectedCandidate != null &&
        (decResidualSelectedCandidate.candidateId === null ||
          typeof decResidualSelectedCandidate.candidateId === "string") &&
        (decResidualSelectedCandidate.candidateClass === null ||
          decResidualSelectedCandidate.candidateClass === "baseline_hold" ||
          decResidualSelectedCandidate.candidateClass ===
            "observer_domain_truncation" ||
          decResidualSelectedCandidate.candidateClass ===
            "physics_control_proposal") &&
        (decResidualSelectedCandidate.sweepPhase === null ||
          isDecPhysicsSweepPhase(decResidualSelectedCandidate.sweepPhase)) &&
        isNumericOrNull(decResidualSelectedCandidate.metricDecRobustMarginToZero) &&
        isNumericOrNull(
          decResidualSelectedCandidate.tileReconstitutedDecRobustMarginToZero,
        ) &&
        isNumericOrNull(decResidualSelectedCandidate.metricDecRobustLift) &&
        isNumericOrNull(decResidualSelectedCandidate.tileReconstitutedDecRobustLift) &&
        isNumericOrNull(decResidualSelectedCandidate.controlDeviationMagnitude) &&
        Array.isArray(decResidualAttributionEvidence.citationRefs) &&
        decResidualAttributionEvidence.citationRefs.every(
          (entry) => typeof entry === "string",
        ) &&
        Array.isArray(decResidualAttributionEvidence.notes) &&
        decResidualAttributionEvidence.notes.every(
          (entry) => typeof entry === "string",
        ))) &&
    (record.zeroCrossFeasibilityDecision === undefined ||
      isDecPhysicsZeroCrossFeasibilityDecision(
        record.zeroCrossFeasibilityDecision,
      )) &&
    (record.zeroCrossFeasibilityReasonCodes === undefined ||
      (Array.isArray(record.zeroCrossFeasibilityReasonCodes) &&
        record.zeroCrossFeasibilityReasonCodes.every((reason) =>
          isDecPhysicsZeroCrossReasonCode(reason),
        ))) &&
    (record.boundedSearchEnvelope === undefined ||
      (boundedSearchEnvelope != null &&
        isNumericOrNull(boundedSearchEnvelope.pressureScaleMin) &&
        isNumericOrNull(boundedSearchEnvelope.pressureScaleMax) &&
        isNumericOrNull(boundedSearchEnvelope.densityLiftMin) &&
        isNumericOrNull(boundedSearchEnvelope.densityLiftMax) &&
        isNumericOrNull(boundedSearchEnvelope.fluxScaleMin) &&
        isNumericOrNull(boundedSearchEnvelope.fluxScaleMax) &&
        isNumericOrNull(boundedSearchEnvelope.shearScaleMin) &&
        isNumericOrNull(boundedSearchEnvelope.shearScaleMax) &&
        isNumericOrNull(boundedSearchEnvelope.coarsePressureStep) &&
        isNumericOrNull(boundedSearchEnvelope.coarseDensityLiftStep) &&
        isNumericOrNull(boundedSearchEnvelope.coarseFluxScaleStep) &&
        isNumericOrNull(boundedSearchEnvelope.coarseShearScaleStep) &&
        isNumericOrNull(boundedSearchEnvelope.refinePressureStep) &&
        isNumericOrNull(boundedSearchEnvelope.refineDensityLiftStep) &&
        isNumericOrNull(boundedSearchEnvelope.refineFluxScaleStep) &&
        isNumericOrNull(boundedSearchEnvelope.refineShearScaleStep) &&
        isNumericOrNull(boundedSearchEnvelope.coarseCandidateCount) &&
        isNumericOrNull(boundedSearchEnvelope.refineCandidateCount) &&
        isNumericOrNull(boundedSearchEnvelope.refineSeedCount) &&
        typeof boundedSearchEnvelope.observerDomainFixed === "boolean")) &&
    Array.isArray(record.selectionReasonCodes) &&
    record.selectionReasonCodes.every((reason) =>
      isDecPhysicsSelectionReasonCode(reason),
    ) &&
    nonRegressionGate != null &&
    Array.isArray(nonRegressionGate.required) &&
    nonRegressionGate.required.every((entry) => typeof entry === "string") &&
    typeof nonRegressionGate.pass === "boolean" &&
    (nonRegressionGate.note === null ||
      typeof nonRegressionGate.note === "string") &&
    runtimeApplication != null &&
    typeof runtimeApplication.attempted === "boolean" &&
    typeof runtimeApplication.enabled === "boolean" &&
    isDecPhysicsRuntimeApplicationStatus(runtimeApplication.status) &&
    isDecPhysicsRuntimeFailureMode(runtimeApplication.failureMode) &&
    typeof runtimeApplication.evaluationComparable === "boolean" &&
    isNumericOrNull(runtimeApplication.sampleCount) &&
    isNumericOrNull(runtimeApplication.comparableSampleCount) &&
    isNumericOrNull(runtimeApplication.minimumComparableSampleCount) &&
    (runtimeApplication.sampleCountSufficient === null ||
      typeof runtimeApplication.sampleCountSufficient === "boolean") &&
    (runtimeApplication.referenceRouteId === null ||
      typeof runtimeApplication.referenceRouteId === "string") &&
    (runtimeApplication.selectedRouteId === null ||
      typeof runtimeApplication.selectedRouteId === "string") &&
    (runtimeApplication.selectedPath === null ||
      isModelTermClosurePath(runtimeApplication.selectedPath)) &&
    (runtimeApplication.candidateId === null ||
      typeof runtimeApplication.candidateId === "string") &&
    runtimeComparabilityGate != null &&
    (runtimeComparabilityGate.chartRef === null ||
      typeof runtimeComparabilityGate.chartRef === "string") &&
    (runtimeComparabilityGate.chartParity === null ||
      typeof runtimeComparabilityGate.chartParity === "boolean") &&
    (runtimeComparabilityGate.selectedPathParity === null ||
      typeof runtimeComparabilityGate.selectedPathParity === "boolean") &&
    isModelTermSemanticCheckStatus(
      runtimeComparabilityGate.independentCrossCheckStatus,
    ) &&
    typeof runtimeComparabilityGate.pass === "boolean" &&
    (runtimeComparabilityGate.note === null ||
      typeof runtimeComparabilityGate.note === "string") &&
    Array.isArray(runtimeApplication.rollbackReasonCodes) &&
    runtimeApplication.rollbackReasonCodes.every((reason) =>
      isDecPhysicsSelectionReasonCode(reason),
    ) &&
    runtimeGuardChecks != null &&
    (runtimeGuardChecks.metricWecNonRegression === null ||
      typeof runtimeGuardChecks.metricWecNonRegression === "boolean") &&
    (runtimeGuardChecks.metricNecNonRegression === null ||
      typeof runtimeGuardChecks.metricNecNonRegression === "boolean") &&
    (runtimeGuardChecks.emissionAdmissionStable === null ||
      typeof runtimeGuardChecks.emissionAdmissionStable === "boolean") &&
    (runtimeGuardChecks.semanticAdmissionStable === null ||
      typeof runtimeGuardChecks.semanticAdmissionStable === "boolean") &&
    (runtimeGuardChecks.metricDecRobustLiftPositive === null ||
      typeof runtimeGuardChecks.metricDecRobustLiftPositive === "boolean") &&
    (runtimeGuardChecks.tileReconstitutedDecRobustLiftNonNegative === null ||
      typeof runtimeGuardChecks.tileReconstitutedDecRobustLiftNonNegative ===
        "boolean") &&
    runtimeObserved != null &&
    isNumericOrNull(runtimeObserved.metricDecRobustLift) &&
    isNumericOrNull(runtimeObserved.tileReconstitutedDecRobustLift) &&
    isNumericOrNull(runtimeObserved.metricWecRobustDelta) &&
    isNumericOrNull(runtimeObserved.metricNecRobustDelta) &&
    isNumericOrNull(runtimeObserved.metricDecRobustMarginToZero) &&
    isNumericOrNull(runtimeObserved.tileReconstitutedDecRobustMarginToZero) &&
    isNumericOrNull(runtimeObserved.metricWecNonRegressionMargin) &&
    isNumericOrNull(runtimeObserved.metricNecNonRegressionMargin) &&
    (runtimeApplication.note === null ||
      typeof runtimeApplication.note === "string") &&
    Array.isArray(runtimeApplication.citationRefs) &&
    runtimeApplication.citationRefs.every((entry) => typeof entry === "string") &&
    Array.isArray(controlKnobs) &&
    controlKnobs.every((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const knob = entry as Record<string, unknown>;
      return (
        typeof knob.knobId === "string" &&
        isNumericOrNull(knob.baselineValue) &&
        isNumericOrNull(knob.candidateValue) &&
        isNumericOrNull(knob.deltaValue) &&
        isNumericOrNull(knob.boundedDeltaMax) &&
        typeof knob.bounded === "boolean" &&
        (knob.note === null || typeof knob.note === "string")
      );
    }) &&
    (claimCitationMap === undefined ||
      (Array.isArray(claimCitationMap) &&
        claimCitationMap.every((entry) => {
          if (!entry || typeof entry !== "object") return false;
          const claimEntry = entry as Record<string, unknown>;
          return (
            typeof claimEntry.claimId === "string" &&
            typeof claimEntry.claim === "string" &&
            Array.isArray(claimEntry.citationRefs) &&
            claimEntry.citationRefs.every((citation) => typeof citation === "string") &&
            (claimEntry.note === null || typeof claimEntry.note === "string")
          );
        }))) &&
    (claimCitationMapCompleteness === undefined ||
      ((claimCitationMapCompleteness.status === "pass" ||
        claimCitationMapCompleteness.status === "fail") &&
        typeof claimCitationMapCompleteness.expectedClaimCount === "number" &&
        typeof claimCitationMapCompleteness.coveredClaimCount === "number" &&
        Array.isArray(claimCitationMapCompleteness.expectedClaimIds) &&
        claimCitationMapCompleteness.expectedClaimIds.every(
          (entry) => typeof entry === "string",
        ) &&
        Array.isArray(claimCitationMapCompleteness.missingClaimIds) &&
        claimCitationMapCompleteness.missingClaimIds.every(
          (entry) => typeof entry === "string",
        ) &&
        (claimCitationMapCompleteness.note === null ||
          typeof claimCitationMapCompleteness.note === "string"))) &&
    (decCoupledControlEvidence === undefined ||
      (((decCoupledControlEvidence.status === "available" ||
        decCoupledControlEvidence.status === "unavailable") &&
        Array.isArray(decCoupledControlEvidence.controlFamiliesUsed) &&
        decCoupledControlEvidence.controlFamiliesUsed.every(
          (entry) => typeof entry === "string",
        ) &&
        decCoupledBoundedEnvelope != null &&
        isNumericOrNull(decCoupledBoundedEnvelope.pressureScaleMin) &&
        isNumericOrNull(decCoupledBoundedEnvelope.pressureScaleMax) &&
        isNumericOrNull(decCoupledBoundedEnvelope.densityLiftMin) &&
        isNumericOrNull(decCoupledBoundedEnvelope.densityLiftMax) &&
        isNumericOrNull(decCoupledBoundedEnvelope.fluxScaleMin) &&
        isNumericOrNull(decCoupledBoundedEnvelope.fluxScaleMax) &&
        isNumericOrNull(decCoupledBoundedEnvelope.shearScaleMin) &&
        isNumericOrNull(decCoupledBoundedEnvelope.shearScaleMax) &&
        Array.isArray(decCoupledCandidateEvaluationTable) &&
        decCoupledCandidateEvaluationTable.every((entry) => {
          if (!entry || typeof entry !== "object") return false;
          const row = entry as Record<string, unknown>;
          return (
            typeof row.candidateId === "string" &&
            isNumericOrNull(row.pressureScale) &&
            isNumericOrNull(row.densityLiftFraction) &&
            isNumericOrNull(row.fluxScale) &&
            isNumericOrNull(row.shearScale) &&
            isNumericOrNull(row.selectionObjectivePrimaryMargin) &&
            typeof row.passesSelectionGate === "boolean"
          );
        }) &&
        (decCoupledControlEvidence.bestCandidateId === null ||
          typeof decCoupledControlEvidence.bestCandidateId === "string") &&
        decCoupledComparabilityGate != null &&
        typeof decCoupledComparabilityGate.pass === "boolean" &&
        isModelTermSemanticCheckStatus(
          decCoupledComparabilityGate.independentCrossCheckStatus,
        ) &&
        (decCoupledComparabilityGate.note === null ||
          typeof decCoupledComparabilityGate.note === "string") &&
        Array.isArray(decCoupledResearchClaims) &&
        decCoupledResearchClaims.every((entry) => {
          if (!entry || typeof entry !== "object") return false;
          const claim = entry as Record<string, unknown>;
          return (
            typeof claim.claimId === "string" &&
            typeof claim.claim === "string" &&
            isResearchClaimConfidenceLabel(claim.confidenceLabel) &&
            Array.isArray(claim.citationRefs) &&
            claim.citationRefs.every((citation) => typeof citation === "string") &&
            (claim.note === null || typeof claim.note === "string")
          );
        }) &&
        (decCoupledControlEvidence.note === null ||
          typeof decCoupledControlEvidence.note === "string")) ||
        decCoupledControlEvidence == null)) &&
    isDecRecommendedPatchClass(record.recommendation) &&
    Array.isArray(uncertaintyTags) &&
    uncertaintyTags.every((entry) => isDecPhysicsUncertaintyTag(entry)) &&
    Array.isArray(record.citationRefs) &&
    record.citationRefs.every((entry) => typeof entry === "string") &&
    Array.isArray(record.derivationNotes) &&
    record.derivationNotes.every((entry) => typeof entry === "string") &&
    Array.isArray(record.uncertaintyNotes) &&
    record.uncertaintyNotes.every((entry) => typeof entry === "string")
  );
};

const isT00PolicyAdmissionBridgeEvidence = (
  value: unknown,
): value is Nhm2ObserverT00PolicyAdmissionBridgeEvidence => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const checks = record.checks as Record<string, unknown> | undefined;
  return (
    isModelTermSemanticCheckStatus(record.status) &&
    (record.routeId === null || typeof record.routeId === "string") &&
    (record.chartRef === null || typeof record.chartRef === "string") &&
    (record.selectedPath === null || isModelTermClosurePath(record.selectedPath)) &&
    isModelTermSemanticAdmission(record.routeAdmissionRaw) &&
    isModelTermSemanticAdmission(record.routeAdmissionEffective) &&
    isModelTermRouteAdmissionPromotionBasis(record.routeAdmissionPromotionBasis) &&
    checks != null &&
    isModelTermSemanticCheckStatus(checks.fullEinsteinTensorRouteAdmission) &&
    isModelTermSemanticCheckStatus(checks.einsteinT00Comparability) &&
    isModelTermSemanticCheckStatus(checks.independentCrossCheck) &&
    isModelTermSemanticCheckStatus(checks.finiteDifferenceConvergence) &&
    isModelTermSemanticCheckStatus(checks.citationCoverage) &&
    typeof record.pass === "boolean" &&
    (record.rationale === null || typeof record.rationale === "string") &&
    Array.isArray(record.citationRefs) &&
    record.citationRefs.every((entry) => typeof entry === "string") &&
    Array.isArray(record.notes) &&
    record.notes.every((entry) => typeof entry === "string")
  );
};

const isTileAuthorityEvidence = (
  value: unknown,
): value is Nhm2ObserverTileAuthorityEvidence => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const checks = record.checks as Record<string, unknown> | undefined;
  return (
    isModelTermSemanticCheckStatus(record.status) &&
    (record.chartRef === null || typeof record.chartRef === "string") &&
    (record.routeId === null || typeof record.routeId === "string") &&
    (record.selectedPath === null || isModelTermClosurePath(record.selectedPath)) &&
    NHM2_OBSERVER_TILE_AUTHORITY_ROUTE_VALUES.includes(
      record.tileRoute as Nhm2ObserverTileAuthorityRoute,
    ) &&
    checks != null &&
    isModelTermSemanticCheckStatus(checks.routeAdmission) &&
    isModelTermSemanticCheckStatus(checks.fullTensorComponents) &&
    isModelTermSemanticCheckStatus(checks.comparability) &&
    isModelTermSemanticCheckStatus(checks.citationCoverage) &&
    typeof record.pass === "boolean" &&
    (record.rationale === null || typeof record.rationale === "string") &&
    Array.isArray(record.citationRefs) &&
    record.citationRefs.every((entry) => typeof entry === "string") &&
    Array.isArray(record.notes) &&
    record.notes.every((entry) => typeof entry === "string")
  );
};

const isTileComparableCrossCheckEvidence = (
  value: unknown,
): value is Nhm2ObserverTileComparableCrossCheckEvidence => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    isModelTermSemanticCheckStatus(record.status) &&
    (record.chartRef === null || typeof record.chartRef === "string") &&
    (record.routeId === null || typeof record.routeId === "string") &&
    (record.selectedPath === null || isModelTermClosurePath(record.selectedPath)) &&
    (record.referenceRouteId === null ||
      typeof record.referenceRouteId === "string") &&
    (record.aggregationMethod === null ||
      typeof record.aggregationMethod === "string") &&
    (record.metricTensorRef === null ||
      typeof record.metricTensorRef === "string") &&
    (record.tileTensorRef === null || typeof record.tileTensorRef === "string") &&
    (record.metricWecEulerianMin === null ||
      typeof record.metricWecEulerianMin === "number") &&
    (record.metricWecRobustMin === null ||
      typeof record.metricWecRobustMin === "number") &&
    (record.tileWecEulerianMin === null ||
      typeof record.tileWecEulerianMin === "number") &&
    (record.tileWecRobustMin === null ||
      typeof record.tileWecRobustMin === "number") &&
    (record.eulerianMinDelta === null || typeof record.eulerianMinDelta === "number") &&
    (record.robustMinDelta === null || typeof record.robustMinDelta === "number") &&
    (record.eulerianSignAgreement === null ||
      typeof record.eulerianSignAgreement === "boolean") &&
    (record.robustSignAgreement === null ||
      typeof record.robustSignAgreement === "boolean") &&
    isModelTermSemanticCheckStatus(record.independentCrossCheckStatus) &&
    isModelTermSemanticCheckStatus(record.comparabilityStatus) &&
    NHM2_OBSERVER_TILE_COMPARABLE_LOCALIZATION_RESULT_VALUES.includes(
      record.localizationResult as Nhm2ObserverTileComparableLocalizationResult,
    ) &&
    NHM2_OBSERVER_TILE_COMPARABLE_NEXT_PATCH_CLASS_VALUES.includes(
      record.nextPatchClass as Nhm2ObserverTileComparableNextPatchClass,
    ) &&
    (record.rationale === null || typeof record.rationale === "string") &&
    Array.isArray(record.citationRefs) &&
    record.citationRefs.every((entry) => typeof entry === "string") &&
    Array.isArray(record.notes) &&
    record.notes.every((entry) => typeof entry === "string")
  );
};

const isTileSurfaceReconstitutionEvidence = (
  value: unknown,
): value is Nhm2ObserverTileSurfaceReconstitutionEvidence => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const componentCoverage = record.componentCoverage as
    | Record<string, unknown>
    | undefined;
  return (
    isModelTermSemanticCheckStatus(record.status) &&
    (record.chartRef === null || typeof record.chartRef === "string") &&
    (record.routeId === null || typeof record.routeId === "string") &&
    (record.selectedPath === null || isModelTermClosurePath(record.selectedPath)) &&
    (record.sourceTensorRef === null || typeof record.sourceTensorRef === "string") &&
    (record.reconstitutedTileTensorRef === null ||
      typeof record.reconstitutedTileTensorRef === "string") &&
    (record.aggregationMethod === null ||
      typeof record.aggregationMethod === "string") &&
    (record.sampleDomainRef === null || typeof record.sampleDomainRef === "string") &&
    componentCoverage != null &&
    isMetricProducerEvidenceStatus(componentCoverage.t00) &&
    isMetricProducerEvidenceStatus(componentCoverage.t0i) &&
    isMetricProducerEvidenceStatus(componentCoverage.offDiagonalTij) &&
    (record.independentCrossCheckRouteRef === null ||
      typeof record.independentCrossCheckRouteRef === "string") &&
    isModelTermSemanticCheckStatus(record.independentCrossCheckStatus) &&
    isModelTermSemanticCheckStatus(record.comparabilityStatus) &&
    NHM2_OBSERVER_TILE_COMPARABLE_LOCALIZATION_RESULT_VALUES.includes(
      record.localizationResult as Nhm2ObserverTileComparableLocalizationResult,
    ) &&
    (record.rationale === null || typeof record.rationale === "string") &&
    Array.isArray(record.citationRefs) &&
    record.citationRefs.every((entry) => typeof entry === "string") &&
    Array.isArray(record.notes) &&
    record.notes.every((entry) => typeof entry === "string")
  );
};

const isTileObserverComparabilityClassification = (
  value: unknown,
): value is Nhm2ObserverTileObserverComparabilityClassification =>
  NHM2_OBSERVER_TILE_OBSERVER_COMPARABILITY_CLASSIFICATION_VALUES.includes(
    value as Nhm2ObserverTileObserverComparabilityClassification,
  );

const isTileObserverConditionAuthorityMode = (
  value: unknown,
): value is Nhm2ObserverTileObserverConditionAuthorityMode =>
  NHM2_OBSERVER_TILE_OBSERVER_CONDITION_AUTHORITY_MODE_VALUES.includes(
    value as Nhm2ObserverTileObserverConditionAuthorityMode,
  );

const isTileObserverConditionComparabilityEvidence = (
  value: unknown,
): value is Nhm2ObserverTileObserverConditionComparabilityEvidence => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const checks = record.checks as Record<string, unknown> | undefined;
  const lanes = record.lanes as Record<string, unknown> | undefined;
  const metricRequiredLane = lanes?.metricRequired as Record<string, unknown> | undefined;
  const tileEffectiveProxyLane = lanes?.tileEffectiveProxy as
    | Record<string, unknown>
    | undefined;
  const tileEffectiveReconstitutedLane = lanes?.tileEffectiveReconstituted as
    | Record<string, unknown>
    | undefined;
  const hasValidLane = (
    lane: Record<string, unknown> | undefined,
    requireSourceRef: boolean,
  ): boolean =>
    lane != null &&
    (lane.tensorRef === null || typeof lane.tensorRef === "string") &&
    (!requireSourceRef ||
      lane.sourceRef === null ||
      typeof lane.sourceRef === "string") &&
    (!requireSourceRef ||
      lane.note === null ||
      typeof lane.note === "string") &&
    (lane.sampleCount === null || typeof lane.sampleCount === "number") &&
    (lane.rapidityCap === null || typeof lane.rapidityCap === "number") &&
    (lane.rapidityCapBeta === null || typeof lane.rapidityCapBeta === "number") &&
    (lane.wecEulerianMin === null || typeof lane.wecEulerianMin === "number") &&
    (lane.wecRobustMin === null || typeof lane.wecRobustMin === "number") &&
    (lane.decEulerianMin === null || typeof lane.decEulerianMin === "number") &&
    (lane.decRobustMin === null || typeof lane.decRobustMin === "number");
  return (
    isModelTermSemanticCheckStatus(record.status) &&
    (record.chartRef === null || typeof record.chartRef === "string") &&
    (record.routeId === null || typeof record.routeId === "string") &&
    (record.selectedPath === null || isModelTermClosurePath(record.selectedPath)) &&
    (record.sampleDomainRef === null || typeof record.sampleDomainRef === "string") &&
    (record.aggregationMethod === null ||
      typeof record.aggregationMethod === "string") &&
    isTileObserverComparabilityClassification(record.classification) &&
    (record.classificationReason === null ||
      typeof record.classificationReason === "string") &&
    checks != null &&
    isModelTermSemanticCheckStatus(checks.routeComparability) &&
    isModelTermSemanticCheckStatus(checks.independentCrossCheck) &&
    isModelTermSemanticCheckStatus(checks.sampleCountParity) &&
    isModelTermSemanticCheckStatus(checks.rapidityCapParity) &&
    isModelTermSemanticCheckStatus(checks.rapidityCapBetaParity) &&
    isModelTermSemanticCheckStatus(checks.citationCoverage) &&
    hasValidLane(metricRequiredLane, false) &&
    hasValidLane(tileEffectiveProxyLane, false) &&
    hasValidLane(tileEffectiveReconstitutedLane, true) &&
    typeof record.pass === "boolean" &&
    (record.rationale === null || typeof record.rationale === "string") &&
    Array.isArray(record.citationRefs) &&
    record.citationRefs.every((entry) => typeof entry === "string") &&
    Array.isArray(record.notes) &&
    record.notes.every((entry) => typeof entry === "string")
  );
};

const isTileObserverLegacyProxyDiagnostics = (
  value: unknown,
): value is Nhm2ObserverTileObserverLegacyProxyDiagnostics => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    (record.tensorRef === null || typeof record.tensorRef === "string") &&
    (record.sampleCount === null || typeof record.sampleCount === "number") &&
    (record.rapidityCap === null || typeof record.rapidityCap === "number") &&
    (record.rapidityCapBeta === null ||
      typeof record.rapidityCapBeta === "number") &&
    (record.wecEulerianMin === null ||
      typeof record.wecEulerianMin === "number") &&
    (record.wecRobustMin === null || typeof record.wecRobustMin === "number") &&
    (record.decEulerianMin === null ||
      typeof record.decEulerianMin === "number") &&
    (record.decRobustMin === null || typeof record.decRobustMin === "number") &&
    (record.note === null || typeof record.note === "string")
  );
};

const isTileAuthorityStatus = (
  value: unknown,
): value is Nhm2ObserverTileAuthorityStatus =>
  NHM2_OBSERVER_TILE_AUTHORITY_STATUS_VALUES.includes(
    value as Nhm2ObserverTileAuthorityStatus,
  );

const isLeadReadinessWorkstream = (
  value: unknown,
): value is Nhm2ObserverLeadReadinessWorkstream =>
  NHM2_OBSERVER_LEAD_READINESS_WORKSTREAM_VALUES.includes(
    value as Nhm2ObserverLeadReadinessWorkstream,
  );

const isNextTechnicalAction = (
  value: unknown,
): value is Nhm2ObserverNextTechnicalAction =>
  NHM2_OBSERVER_NEXT_TECHNICAL_ACTION_VALUES.includes(
    value as Nhm2ObserverNextTechnicalAction,
  );

const inferUpstreamDriverClass = (args: {
  tensor: Nhm2ObserverAuditTensor;
  rootCauseClass: Nhm2ObserverRootCauseClass;
}): Nhm2ObserverUpstreamDriverClass => {
  if (
    args.rootCauseClass !== "negative_energy_density" &&
    args.rootCauseClass !== "dec_downstream_of_negative_energy"
  ) {
    return "unknown";
  }
  if (args.tensor.tensorId === "metric_required") {
    return "metric_t00_density";
  }
  return args.tensor.model.pressureModel === "diagonal_tensor_components"
    ? "tile_energy_density_proxy"
    : "tile_energy_density_proxy";
};

const inferUpstreamDriverDependencyStatus = (
  driverClass: Nhm2ObserverUpstreamDriverClass,
): Nhm2ObserverUpstreamDriverDependencyStatus => {
  if (
    driverClass === "metric_energy_density_proxy" ||
    driverClass === "tile_energy_density_proxy"
  ) {
    return "proxy_derived_driver";
  }
  if (
    driverClass === "metric_t00_density" ||
    driverClass === "tile_t00_density"
  ) {
    return "direct_same_surface_driver";
  }
  return "unknown";
};

const inferUpstreamDriverRef = (
  tensor: Nhm2ObserverAuditTensor,
  driverClass: Nhm2ObserverUpstreamDriverClass,
  rootCauseClass: Nhm2ObserverRootCauseClass,
): string | null => {
  if (
    rootCauseClass !== "negative_energy_density" &&
    rootCauseClass !== "dec_downstream_of_negative_energy"
  ) {
    return null;
  }
  if (tensor.tensorId === "metric_required") {
    return asText(tensor.tensorRef) ?? "metric_required.conditions.wec.source_t00";
  }
  if (driverClass === "tile_energy_density_proxy") {
    return asText(tensor.tensorRef) ?? "tile_effective.conditions.wec.source_density_proxy";
  }
  return asText(tensor.tensorRef) ?? "tile_effective.conditions.wec.source_t00";
};

const buildUpstreamDriverNote = (args: {
  tensor: Nhm2ObserverAuditTensor;
  driverClass: Nhm2ObserverUpstreamDriverClass;
  dependencyStatus: Nhm2ObserverUpstreamDriverDependencyStatus;
  ref: string | null;
}): string | null => {
  if (args.ref == null || args.driverClass === "unknown") return null;
  if (
    args.driverClass === "metric_t00_density" ||
    args.driverClass === "tile_t00_density"
  ) {
    return `${args.tensor.tensorId} WEC traces directly to emitted density at ${args.ref}.`;
  }
  if (
    args.driverClass === "metric_energy_density_proxy" ||
    args.driverClass === "tile_energy_density_proxy"
  ) {
    return `${args.tensor.tensorId} WEC traces to emitted proxy-derived density at ${args.ref}.`;
  }
  if (args.dependencyStatus === "mixed") {
    return `${args.tensor.tensorId} WEC upstream driver remains mixed across current emitted surfaces.`;
  }
  return null;
};

const buildUpstreamRemediationWhy = (args: {
  tensor: Nhm2ObserverAuditTensor;
  driverClass: Nhm2ObserverUpstreamDriverClass;
}): string | null => {
  if (args.driverClass === "unknown") return null;
  if (
    args.driverClass === "metric_t00_density" ||
    args.driverClass === "tile_t00_density"
  ) {
    return `Inspect emitted ${args.tensor.tensorId} T00 density first because WEC algebra reduces directly to rho on this surface.`;
  }
  if (
    args.driverClass === "metric_energy_density_proxy" ||
    args.driverClass === "tile_energy_density_proxy"
  ) {
    return `Inspect emitted ${args.tensor.tensorId} energy-density proxy first because WEC negativity is inherited from that published proxy surface.`;
  }
  return null;
};

const localizeUpstreamDriver = (
  tensor: Nhm2ObserverAuditTensor,
  rootCause: Nhm2ObserverRootCauseLocalization,
  input: BuildNhm2ObserverAuditTensorInput,
): Nhm2ObserverUpstreamDriverLocalization => {
  if (
    tensor.primaryBlockingCondition !== "wec" &&
    rootCause.rootCauseClass !== "negative_energy_density" &&
    rootCause.rootCauseClass !== "dec_downstream_of_negative_energy"
  ) {
    return {
      upstreamDriverRef: null,
      upstreamDriverClass: "unknown",
      upstreamDriverDependencyStatus: "unknown",
      upstreamDriverNote: null,
      firstUpstreamRemediationTarget: null,
      firstUpstreamRemediationWhy: null,
    };
  }
  const upstreamDriverClass = isUpstreamDriverClass(input?.upstreamDriverClass)
    ? input.upstreamDriverClass
    : inferUpstreamDriverClass({
        tensor,
        rootCauseClass: rootCause.rootCauseClass,
      });
  const upstreamDriverRef =
    asText(input?.upstreamDriverRef) ??
    inferUpstreamDriverRef(tensor, upstreamDriverClass, rootCause.rootCauseClass);
  const upstreamDriverDependencyStatus = isUpstreamDriverDependencyStatus(
    input?.upstreamDriverDependencyStatus,
  )
    ? input.upstreamDriverDependencyStatus
    : inferUpstreamDriverDependencyStatus(upstreamDriverClass);
  return {
    upstreamDriverRef,
    upstreamDriverClass,
    upstreamDriverDependencyStatus,
    upstreamDriverNote:
      asText(input?.upstreamDriverNote) ??
      buildUpstreamDriverNote({
        tensor,
        driverClass: upstreamDriverClass,
        dependencyStatus: upstreamDriverDependencyStatus,
        ref: upstreamDriverRef,
      }),
    firstUpstreamRemediationTarget:
      asText(input?.firstUpstreamRemediationTarget) ?? upstreamDriverRef,
    firstUpstreamRemediationWhy:
      asText(input?.firstUpstreamRemediationWhy) ??
      buildUpstreamRemediationWhy({
        tensor,
        driverClass: upstreamDriverClass,
      }),
  };
};

const summarizeSharedRootDriver = (args: {
  metric: Nhm2ObserverRootCauseLocalization;
  tile: Nhm2ObserverRootCauseLocalization;
}): {
  status: Nhm2ObserverSharedRootDriverStatus;
  note: string | null;
} => {
  const metricFamily = normalizeRootCauseFamily(args.metric.rootCauseClass);
  const tileFamily = normalizeRootCauseFamily(args.tile.rootCauseClass);
  if (metricFamily == null || tileFamily == null) {
    return {
      status: "unknown",
      note: null,
    };
  }
  if (metricFamily === tileFamily && metricFamily !== "mixed_independent") {
    return {
      status: "shared_root_driver_confirmed",
      note:
        metricFamily === "negative_energy_density"
          ? "metric_required and tile_effective both trace back to the same negative-energy-density root driver; downstream DEC/secondary co-failures should be remediated through the emitted WEC surface first."
          : `metric_required and tile_effective both trace back to ${metricFamily}.`,
    };
  }
  if (
    metricFamily === "mixed_independent" ||
    tileFamily === "mixed_independent"
  ) {
    return {
      status: "mixed",
      note:
        "At least one emitted observer surface still presents mixed independent blockers, so a single shared remediation path is not yet justified.",
    };
  }
  return {
    status: "surface_specific_drivers",
    note: `metric_required traces to ${args.metric.rootCauseClass}, while tile_effective traces to ${args.tile.rootCauseClass}.`,
  };
};

const summarizeSharedUpstreamDriver = (args: {
  metric: Nhm2ObserverUpstreamDriverLocalization;
  tile: Nhm2ObserverUpstreamDriverLocalization;
}): {
  status: Nhm2ObserverSharedUpstreamDriverStatus;
  note: string | null;
} => {
  const metricRef = args.metric.upstreamDriverRef;
  const tileRef = args.tile.upstreamDriverRef;
  if (
    metricRef != null &&
    tileRef != null &&
    metricRef === tileRef &&
    args.metric.upstreamDriverClass !== "unknown" &&
    args.tile.upstreamDriverClass !== "unknown"
  ) {
    return {
      status: "shared_exact_ref",
      note: `metric_required and tile_effective both trace their first upstream WEC driver to ${metricRef}.`,
    };
  }
  const metricFamily = normalizeUpstreamDriverFamily(
    args.metric.upstreamDriverClass,
  );
  const tileFamily = normalizeUpstreamDriverFamily(args.tile.upstreamDriverClass);
  if (
    metricFamily != null &&
    tileFamily != null &&
    metricFamily === tileFamily
  ) {
    return {
      status: "shared_driver_class",
      note:
        metricRef != null && tileRef != null
          ? `metric_required traces to ${metricRef} while tile_effective traces to ${tileRef}; both belong to the same emitted ${metricFamily} driver family.`
          : `metric_required and tile_effective share the same emitted ${metricFamily} driver family.`,
    };
  }
  if (
    args.metric.upstreamDriverClass === "mixed_upstream" ||
    args.tile.upstreamDriverClass === "mixed_upstream" ||
    args.metric.upstreamDriverDependencyStatus === "mixed" ||
    args.tile.upstreamDriverDependencyStatus === "mixed"
  ) {
    return {
      status: "mixed",
      note:
        "At least one observer surface still has mixed upstream evidence, so a single emitted upstream driver is not yet justified.",
    };
  }
  if (
    args.metric.upstreamDriverClass === "unknown" ||
    args.tile.upstreamDriverClass === "unknown"
  ) {
    return {
      status: "unknown",
      note: null,
    };
  }
  return {
    status: "surface_specific_upstream_refs",
    note:
      metricRef != null && tileRef != null
        ? `metric_required traces upstream to ${metricRef}, while tile_effective traces upstream to ${tileRef}; they share the same negative-energy root class but not the same emitted upstream driver.`
        : "metric_required and tile_effective do not share the same emitted upstream WEC driver.",
  };
};

const normalizeProbeScale = (value: unknown): number | null => {
  const finite = toFinite(value);
  if (finite == null) return null;
  return Math.max(0, Math.min(1, finite));
};

const applyProbeRelaxation = (
  baseline: number | null,
  effectiveScale: number | null,
): number | null => {
  if (baseline == null || effectiveScale == null) return baseline;
  if (baseline >= 0) return baseline;
  return baseline * (1 - effectiveScale);
};

const buildProbeInterpretation = (args: {
  tensor: Nhm2ObserverAuditTensor;
  effectiveScale: number | null;
  sharedUpstreamStatus: Nhm2ObserverSharedUpstreamDriverStatus;
  upstreamDependencyStatus: Nhm2ObserverUpstreamDriverDependencyStatus;
  wecDelta: number | null;
  decDelta: number | null;
}): string | null => {
  if (args.effectiveScale == null) return null;
  if (args.effectiveScale <= 1e-12) {
    if (
      args.tensor.tensorId === "tile_effective" &&
      args.upstreamDependencyStatus === "proxy_derived_driver"
    ) {
      return "Metric-side WEC probe does not automatically lift this tile proxy surface because it depends on a separate proxy-derived upstream ref.";
    }
    return "Probe leaves this surface effectively unchanged on current emitted dependencies.";
  }
  if (args.tensor.tensorId === "metric_required") {
    return "Metric-side probe directly relaxes emitted WEC and downstream DEC because this surface depends on the same emitted density ref.";
  }
  if (args.sharedUpstreamStatus === "shared_exact_ref") {
    return "Tile surface lifts under the same probe because both surfaces share the exact emitted upstream WEC driver.";
  }
  if (args.wecDelta != null && args.wecDelta > 0 && args.decDelta != null && args.decDelta > 0) {
    return "Tile surface shows cross-surface WEC/DEC relief under the same probe, but the emitted upstream ref remains distinct.";
  }
  if (args.wecDelta != null && args.wecDelta > 0) {
    return "Tile WEC shows limited cross-surface relief under the metric-side probe.";
  }
  return "Probe interpretation remains unresolved on this surface.";
};

const localizeWecProbe = (args: {
  tensor: Nhm2ObserverAuditTensor;
  rootCause: Nhm2ObserverRootCauseLocalization;
  upstream: Nhm2ObserverUpstreamDriverLocalization;
  sharedUpstreamStatus: Nhm2ObserverSharedUpstreamDriverStatus;
  input: BuildNhm2ObserverAuditTensorInput;
}): Nhm2ObserverWecProbeLocalization => {
  if (
    args.tensor.primaryBlockingCondition !== "wec" ||
    args.rootCause.rootCauseClass !== "negative_energy_density"
  ) {
    return {
      wecProbeApplied: false,
      wecProbeScale: null,
      wecProbeBaseline: null,
      wecProbeResult: null,
      wecProbeDelta: null,
      decProbeBaseline: null,
      decProbeResult: null,
      decProbeDelta: null,
      wecProbeInterpretation: null,
    };
  }
  const requestedScale =
    normalizeProbeScale(args.input?.wecProbeScale) ??
    NHM2_OBSERVER_WEC_PROBE_DEFAULT_SCALE;
  const requestedResponse =
    normalizeProbeScale(args.input?.wecProbeResponseFactor) ??
    (args.tensor.tensorId === "metric_required"
      ? 1
      : args.sharedUpstreamStatus === "shared_exact_ref"
        ? 1
        : 0);
  const effectiveScale = requestedScale * requestedResponse;
  const wecBaseline = args.tensor.conditions.wec.robustMin;
  const wecResult = applyProbeRelaxation(wecBaseline, effectiveScale);
  const decBaseline = args.tensor.conditions.dec.robustMin;
  const decResult =
    args.rootCause.blockingDependencyStatus === "dec_downstream_of_wec"
      ? applyProbeRelaxation(decBaseline, effectiveScale)
      : decBaseline;
  const wecDelta =
    wecBaseline != null && wecResult != null ? wecResult - wecBaseline : null;
  const decDelta =
    decBaseline != null && decResult != null ? decResult - decBaseline : null;
  return {
    wecProbeApplied: true,
    wecProbeScale: requestedScale,
    wecProbeBaseline: wecBaseline,
    wecProbeResult: wecResult,
    wecProbeDelta: wecDelta,
    decProbeBaseline: decBaseline,
    decProbeResult: decResult,
    decProbeDelta: decDelta,
    wecProbeInterpretation: buildProbeInterpretation({
      tensor: args.tensor,
      effectiveScale,
      sharedUpstreamStatus: args.sharedUpstreamStatus,
      upstreamDependencyStatus: args.upstream.upstreamDriverDependencyStatus,
      wecDelta,
      decDelta,
    }),
  };
};

const computeProbeReliefRatio = (
  baseline: number | null,
  delta: number | null,
): number | null => {
  if (baseline == null || delta == null || baseline >= 0) return null;
  if (Math.abs(baseline) <= 1e-12) return null;
  return Math.max(0, delta / Math.abs(baseline));
};

const summarizeWecPropagation = (args: {
  metric: Nhm2ObserverWecProbeLocalization;
  tile: Nhm2ObserverWecProbeLocalization;
  tileUpstream: Nhm2ObserverUpstreamDriverLocalization;
}): {
  status: Nhm2ObserverWecPropagationStatus;
  note: string | null;
  sequence: Nhm2ObserverRemediationSequenceStatus;
} => {
  const metricRelief = computeProbeReliefRatio(
    args.metric.wecProbeBaseline,
    args.metric.wecProbeDelta,
  );
  const tileRelief = computeProbeReliefRatio(
    args.tile.wecProbeBaseline,
    args.tile.wecProbeDelta,
  );
  if (metricRelief == null || !args.metric.wecProbeApplied) {
    return { status: "unknown", note: null, sequence: "unknown" };
  }
  const scaleText =
    args.metric.wecProbeScale != null
      ? `${Math.round(args.metric.wecProbeScale * 100)}%`
      : "probe";
  if (
    tileRelief != null &&
    tileRelief >= NHM2_OBSERVER_WEC_SHARED_PROPAGATION_RATIO
  ) {
    return {
      status: "shared_propagation_detected",
      note: `${scaleText} metric-side WEC probe relaxes both metric_required and tile_effective WEC materially, so a shared metric-first remediation path is supported.`,
      sequence: "shared_metric_first",
    };
  }
  if (
    tileRelief != null &&
    tileRelief >= NHM2_OBSERVER_WEC_WEAK_PROPAGATION_RATIO
  ) {
    return {
      status: "weak_cross_surface_propagation",
      note: `${scaleText} metric-side WEC probe strongly relaxes metric_required WEC but only weakly lifts tile_effective, so the tile proxy likely needs a second explicit remediation pass.`,
      sequence: "metric_then_tile_proxy",
    };
  }
  if (args.tile.wecProbeApplied) {
    if (
      args.tileUpstream.upstreamDriverDependencyStatus === "proxy_derived_driver"
    ) {
      return {
        status: "tile_proxy_independent",
        note: `${scaleText} metric-side WEC probe relaxes metric_required WEC/DEC but leaves the tile_effective proxy effectively unchanged, so the tile proxy remains a separate remediation lane.`,
        sequence: "metric_then_tile_proxy",
      };
    }
    return {
      status: "metric_only_propagation",
      note: `${scaleText} metric-side WEC probe relaxes metric_required WEC/DEC, but no meaningful automatic lift appears on tile_effective under the same probe.`,
      sequence: "metric_then_tile_proxy",
    };
  }
  return {
    status: "unknown",
    note: "WEC probe could not resolve cross-surface propagation on current emitted observer surfaces.",
    sequence: "unknown",
  };
};

const summarizeBlockingSurface = (
  hits: Nhm2ObserverBlockingHit[],
): Nhm2ObserverPromotionBlockingSurface => {
  const surfaces = unique(hits.map((entry) => entry.surface));
  if (surfaces.length === 0) return "none";
  if (surfaces.length > 1) return "both";
  return surfaces[0];
};

const summarizeBlockingCondition = (
  hits: Nhm2ObserverBlockingHit[],
): Nhm2ObserverPromotionBlockingCondition => {
  const conditions = unique(hits.map((entry) => entry.condition));
  if (conditions.length === 0) return "unknown";
  if (conditions.length > 1) return "mixed";
  return conditions[0];
};

const buildObserverBlockingAssessment = (args: {
  metricRequired: Nhm2ObserverAuditTensor;
  tileEffective: Nhm2ObserverAuditTensor;
  reasonCodes: Nhm2ObserverAuditReasonCode[];
  completeness: Nhm2ObserverAuditCompleteness;
}): {
  status: Nhm2ObserverBlockingAssessmentStatus;
  note: string | null;
  surface: Nhm2ObserverPromotionBlockingSurface;
  condition: Nhm2ObserverPromotionBlockingCondition;
} => {
  const hits = [
    ...collectConfirmedBlockingHits("metric_required", args.metricRequired),
    ...collectConfirmedBlockingHits("tile_effective", args.tileEffective),
  ];
  if (hits.length > 0) {
    const surface = summarizeBlockingSurface(hits);
    const condition = summarizeBlockingCondition(hits);
    const hitConditions = unique(hits.map((entry) => entry.condition.toUpperCase()));
    const conditionText =
      condition === "mixed"
        ? `mixed ${asNaturalList(hitConditions)} conditions`
        : `${condition.toUpperCase()} condition`;
    const surfaceText =
      surface === "both" ? "metric_required and tile_effective tensors" : `${surface} tensor`;
    const noteParts = [
      `${surfaceText} emit concrete failing ${conditionText} with missedViolationFraction=0 and non-positive maxRobustMinusEulerian.`,
    ];
    if (args.reasonCodes.includes("surrogate_model_limited")) {
      noteParts.push(
        "Policy review remains required because surrogate-model limitations are still present.",
      );
    }
    return {
      status: "same_surface_violation_confirmed",
      note: noteParts.join(" "),
      surface,
      condition,
    };
  }

  if (args.completeness === "incomplete") {
    const incompleteNotes = [
      args.metricRequired.status === "unavailable"
        ? "metric_required tensor unavailable"
        : null,
      args.metricRequired.missingInputs.length > 0
        ? `metric_required missing ${args.metricRequired.missingInputs.join(", ")}`
        : null,
      args.metricRequired.fluxDiagnostics.status !== "available"
        ? `metric_required fluxDiagnostics=${args.metricRequired.fluxDiagnostics.status}`
        : null,
      args.tileEffective.status === "unavailable"
        ? "tile_effective tensor unavailable"
        : null,
      args.tileEffective.missingInputs.length > 0
        ? `tile_effective missing ${args.tileEffective.missingInputs.join(", ")}`
        : null,
      args.tileEffective.fluxDiagnostics.status !== "available"
        ? `tile_effective fluxDiagnostics=${args.tileEffective.fluxDiagnostics.status}`
        : null,
    ].filter((entry): entry is string => entry != null);
    return {
      status: "observer_contract_incomplete",
      note:
        incompleteNotes.length > 0
          ? incompleteNotes.join("; ")
          : "Observer audit remains incomplete on current runtime surfaces.",
      surface: "unknown",
      condition: "unknown",
    };
  }

  if (args.reasonCodes.includes("surrogate_model_limited")) {
    return {
      status: "policy_review_only",
      note:
        "Current observer conditions do not emit a confirmed same-surface blocker, but surrogate-model limitations still require policy review.",
      surface: "none",
      condition: "unknown",
    };
  }

  return {
    status: "unknown",
    note: "Observer blocking assessment could not be resolved from current runtime evidence.",
    surface: "unknown",
    condition: "unknown",
  };
};

export const buildNhm2ObserverAuditArtifact = (
  input: BuildNhm2ObserverAuditArtifactInput,
): Nhm2ObserverAuditArtifact => {
  const metricTensor = buildTensor("metric_required", input.metricRequired);
  const tileTensor = buildTensor("tile_effective", input.tileEffective);
  const metricPrimaryLocalization = localizePrimaryBlocking(metricTensor);
  const tilePrimaryLocalization = localizePrimaryBlocking(tileTensor);
  const metricRequired: Nhm2ObserverAuditTensor = {
    ...metricTensor,
    primaryBlockingCondition: metricPrimaryLocalization.condition,
    primaryBlockingMode: metricPrimaryLocalization.mode,
    primaryBlockingValue: metricPrimaryLocalization.value,
    primaryBlockingReference: metricPrimaryLocalization.reference,
    primaryBlockingWhy: metricPrimaryLocalization.why,
  };
  const tileEffective: Nhm2ObserverAuditTensor = {
    ...tileTensor,
    primaryBlockingCondition: tilePrimaryLocalization.condition,
    primaryBlockingMode: tilePrimaryLocalization.mode,
    primaryBlockingValue: tilePrimaryLocalization.value,
    primaryBlockingReference: tilePrimaryLocalization.reference,
    primaryBlockingWhy: tilePrimaryLocalization.why,
  };
  const metricRootCauseLocalization = localizeRootCause(metricRequired);
  const tileRootCauseLocalization = localizeRootCause(tileEffective);
  const metricUpstreamLocalization = localizeUpstreamDriver(
    metricRequired,
    metricRootCauseLocalization,
    input.metricRequired ?? null,
  );
  const tileUpstreamLocalization = localizeUpstreamDriver(
    tileEffective,
    tileRootCauseLocalization,
    input.tileEffective ?? null,
  );
  metricRequired.rootCauseClass = metricRootCauseLocalization.rootCauseClass;
  metricRequired.blockingDependencyStatus =
    metricRootCauseLocalization.blockingDependencyStatus;
  metricRequired.blockingDependencyNote =
    metricRootCauseLocalization.blockingDependencyNote;
  metricRequired.firstRemediationTarget =
    metricRootCauseLocalization.firstRemediationTarget;
  metricRequired.firstRemediationWhy =
    metricRootCauseLocalization.firstRemediationWhy;
  metricRequired.upstreamDriverRef = metricUpstreamLocalization.upstreamDriverRef;
  metricRequired.upstreamDriverClass =
    metricUpstreamLocalization.upstreamDriverClass;
  metricRequired.upstreamDriverDependencyStatus =
    metricUpstreamLocalization.upstreamDriverDependencyStatus;
  metricRequired.upstreamDriverNote =
    metricUpstreamLocalization.upstreamDriverNote;
  metricRequired.firstUpstreamRemediationTarget =
    metricUpstreamLocalization.firstUpstreamRemediationTarget;
  metricRequired.firstUpstreamRemediationWhy =
    metricUpstreamLocalization.firstUpstreamRemediationWhy;
  tileEffective.rootCauseClass = tileRootCauseLocalization.rootCauseClass;
  tileEffective.blockingDependencyStatus =
    tileRootCauseLocalization.blockingDependencyStatus;
  tileEffective.blockingDependencyNote =
    tileRootCauseLocalization.blockingDependencyNote;
  tileEffective.firstRemediationTarget =
    tileRootCauseLocalization.firstRemediationTarget;
  tileEffective.firstRemediationWhy =
    tileRootCauseLocalization.firstRemediationWhy;
  tileEffective.upstreamDriverRef = tileUpstreamLocalization.upstreamDriverRef;
  tileEffective.upstreamDriverClass = tileUpstreamLocalization.upstreamDriverClass;
  tileEffective.upstreamDriverDependencyStatus =
    tileUpstreamLocalization.upstreamDriverDependencyStatus;
  tileEffective.upstreamDriverNote =
    tileUpstreamLocalization.upstreamDriverNote;
  tileEffective.firstUpstreamRemediationTarget =
    tileUpstreamLocalization.firstUpstreamRemediationTarget;
  tileEffective.firstUpstreamRemediationWhy =
    tileUpstreamLocalization.firstUpstreamRemediationWhy;
  const reasonCodes = orderReasonCodes([
    ...metricRequired.reasonCodes,
    ...tileEffective.reasonCodes,
  ]);
  const completeness: Nhm2ObserverAuditCompleteness =
    metricRequired.completeness === "incomplete" ||
    tileEffective.completeness === "incomplete"
      ? "incomplete"
      : "complete";
  const status: Nhm2ObserverAuditStatus =
    metricRequired.status === "fail" || tileEffective.status === "fail"
      ? "fail"
      : metricRequired.status === "review" || tileEffective.status === "review"
        ? "review"
        : metricRequired.status === "pass" && tileEffective.status === "pass"
          ? "pass"
          : "unavailable";
  const observerBlockingAssessment = buildObserverBlockingAssessment({
    metricRequired,
    tileEffective,
    reasonCodes,
    completeness,
  });
  const observerPrimaryDriverAgreement = summarizePrimaryDriverAgreement(
    metricPrimaryLocalization,
    tilePrimaryLocalization,
  );
  const observerPrimaryDriverNote = buildPrimaryDriverNote({
    metric: metricPrimaryLocalization,
    tile: tilePrimaryLocalization,
  });
  const observerSharedRootDriver = summarizeSharedRootDriver({
    metric: metricRootCauseLocalization,
    tile: tileRootCauseLocalization,
  });
  const observerSharedUpstreamDriver = summarizeSharedUpstreamDriver({
    metric: metricUpstreamLocalization,
    tile: tileUpstreamLocalization,
  });
  const metricWecProbeLocalization = localizeWecProbe({
    tensor: metricRequired,
    rootCause: metricRootCauseLocalization,
    upstream: metricUpstreamLocalization,
    sharedUpstreamStatus: observerSharedUpstreamDriver.status,
    input: input.metricRequired ?? null,
  });
  const tileWecProbeLocalization = localizeWecProbe({
    tensor: tileEffective,
    rootCause: tileRootCauseLocalization,
    upstream: tileUpstreamLocalization,
    sharedUpstreamStatus: observerSharedUpstreamDriver.status,
    input: input.tileEffective ?? null,
  });
  metricRequired.wecProbeApplied = metricWecProbeLocalization.wecProbeApplied;
  metricRequired.wecProbeScale = metricWecProbeLocalization.wecProbeScale;
  metricRequired.wecProbeBaseline = metricWecProbeLocalization.wecProbeBaseline;
  metricRequired.wecProbeResult = metricWecProbeLocalization.wecProbeResult;
  metricRequired.wecProbeDelta = metricWecProbeLocalization.wecProbeDelta;
  metricRequired.decProbeBaseline = metricWecProbeLocalization.decProbeBaseline;
  metricRequired.decProbeResult = metricWecProbeLocalization.decProbeResult;
  metricRequired.decProbeDelta = metricWecProbeLocalization.decProbeDelta;
  metricRequired.wecProbeInterpretation =
    metricWecProbeLocalization.wecProbeInterpretation;
  tileEffective.wecProbeApplied = tileWecProbeLocalization.wecProbeApplied;
  tileEffective.wecProbeScale = tileWecProbeLocalization.wecProbeScale;
  tileEffective.wecProbeBaseline = tileWecProbeLocalization.wecProbeBaseline;
  tileEffective.wecProbeResult = tileWecProbeLocalization.wecProbeResult;
  tileEffective.wecProbeDelta = tileWecProbeLocalization.wecProbeDelta;
  tileEffective.decProbeBaseline = tileWecProbeLocalization.decProbeBaseline;
  tileEffective.decProbeResult = tileWecProbeLocalization.decProbeResult;
  tileEffective.decProbeDelta = tileWecProbeLocalization.decProbeDelta;
  tileEffective.wecProbeInterpretation =
    tileWecProbeLocalization.wecProbeInterpretation;
  const observerWecPropagation = summarizeWecPropagation({
    metric: metricWecProbeLocalization,
    tile: tileWecProbeLocalization,
    tileUpstream: tileUpstreamLocalization,
  });
  const observerMetricCompleteness = deriveMetricCompleteness(
    metricRequired,
    input,
  );
  const observerMetricCoverageBlocker = deriveMetricCoverageBlocker(
    metricRequired,
    input,
  );
  const observerMetricEmissionAdmission = deriveMetricEmissionAdmission({
    tensor: metricRequired,
    input,
    coverageBlockerStatus: observerMetricCoverageBlocker.status,
  });
  const observerTileAuthority = deriveTileAuthority(tileEffective, input);
  const observerLeadReadiness = deriveLeadReadiness({
    metricCompletenessStatus: observerMetricCompleteness.status,
    tileAuthorityStatus: observerTileAuthority.status,
    input,
  });
  const metricProducerAdmissionEvidence = normalizeMetricProducerAdmissionEvidence(
    input.metricProducerAdmissionEvidence,
  );
  const modelTermSemanticAdmissionEvidence =
    normalizeModelTermSemanticAdmissionEvidence(
      input.modelTermSemanticAdmissionEvidence,
    );
  const observerDecRemediationEvidence = normalizeObserverDecRemediationEvidence(
    input.observerDecRemediationEvidence,
  );
  const observerDecPhysicsControlEvidence =
    normalizeObserverDecPhysicsControlEvidence(
      input.observerDecPhysicsControlEvidence,
    );
  const t00PolicyAdmissionBridgeEvidence =
    normalizeT00PolicyAdmissionBridgeEvidence(
      input.t00PolicyAdmissionBridgeEvidence,
    );
  const tileAuthorityEvidence = normalizeTileAuthorityEvidence(
    input.tileAuthorityEvidence,
  );
  const tileComparableCrossCheckEvidence =
    normalizeTileComparableCrossCheckEvidence(
      input.tileComparableCrossCheckEvidence,
    );
  const tileSurfaceReconstitutionEvidence =
    normalizeTileSurfaceReconstitutionEvidence(
      input.tileSurfaceReconstitutionEvidence,
    );
  const tileObserverConditionComparabilityEvidence =
    normalizeTileObserverConditionComparabilityEvidence(
      input.tileObserverConditionComparabilityEvidence,
    );
  const tileObserverConditionAuthority = deriveTileObserverConditionAuthority({
    modeInput: input.tileObserverConditionAuthorityMode,
    noteInput: input.tileObserverConditionAuthorityNote,
    comparabilityEvidence: tileObserverConditionComparabilityEvidence,
  });
  const tileObserverLegacyProxyDiagnostics =
    normalizeTileObserverLegacyProxyDiagnostics(
      input.tileObserverLegacyProxyDiagnostics,
    );

  return {
    artifactId: NHM2_OBSERVER_AUDIT_ARTIFACT_ID,
    schemaVersion: NHM2_OBSERVER_AUDIT_SCHEMA_VERSION,
    familyId: asText(input.familyId) ?? "nhm2_shift_lapse",
    shiftLapseProfileId: asText(input.shiftLapseProfileId),
    status,
    completeness,
    reasonCodes,
    observerBlockingAssessmentStatus: observerBlockingAssessment.status,
    observerBlockingAssessmentNote: observerBlockingAssessment.note,
    observerPromotionBlockingSurface: observerBlockingAssessment.surface,
    observerPromotionBlockingCondition: observerBlockingAssessment.condition,
    observerMetricPrimaryDriver: metricPrimaryLocalization.condition,
    observerTilePrimaryDriver: tilePrimaryLocalization.condition,
    observerPrimaryDriverAgreement,
    observerPrimaryDriverNote,
    observerMetricFirstInspectionTarget:
      metricPrimaryLocalization.inspectionTarget,
    observerTileFirstInspectionTarget:
      tilePrimaryLocalization.inspectionTarget,
    observerSharedRootDriverStatus: observerSharedRootDriver.status,
    observerSharedRootDriverNote: observerSharedRootDriver.note,
    observerSharedUpstreamDriverStatus: observerSharedUpstreamDriver.status,
    observerSharedUpstreamDriverNote: observerSharedUpstreamDriver.note,
    observerWecPropagationStatus: observerWecPropagation.status,
    observerWecPropagationNote: observerWecPropagation.note,
    observerRemediationSequenceStatus: observerWecPropagation.sequence,
    observerTileDiminishingReturnStatus:
      input.observerTileDiminishingReturnStatus ?? "unknown",
    observerTileDiminishingReturnNote:
      input.observerTileDiminishingReturnNote ?? null,
    observerMetricCompletenessStatus: observerMetricCompleteness.status,
    observerMetricCompletenessNote: observerMetricCompleteness.note,
    observerMetricCoverageBlockerStatus: observerMetricCoverageBlocker.status,
    observerMetricCoverageBlockerNote: observerMetricCoverageBlocker.note,
    observerMetricFirstMissingStage:
      observerMetricCoverageBlocker.firstMissingStage,
    observerMetricEmissionAdmissionStatus:
      observerMetricEmissionAdmission.status,
    observerMetricEmissionAdmissionNote: observerMetricEmissionAdmission.note,
    observerMetricT00AdmissionStatus: isMetricComponentAdmissionStatus(
      input.observerMetricT00AdmissionStatus,
    )
      ? input.observerMetricT00AdmissionStatus
      : "unknown",
    observerMetricT00RouteId: asText(input.observerMetricT00RouteId),
    observerMetricT00ComparabilityStatus: normalizeModelTermSemanticCheckStatus(
      input.observerMetricT00ComparabilityStatus,
    ),
    observerMetricT00AdmissionNote: asText(input.observerMetricT00AdmissionNote),
    observerMetricT0iAdmissionStatus: observerMetricEmissionAdmission.t0iStatus,
    observerMetricT0iAdmissionNote: observerMetricEmissionAdmission.t0iNote,
    observerMetricOffDiagonalTijAdmissionStatus:
      observerMetricEmissionAdmission.offDiagonalStatus,
    observerMetricOffDiagonalTijAdmissionNote:
      observerMetricEmissionAdmission.offDiagonalNote,
    observerTileAuthorityStatus: observerTileAuthority.status,
    observerTileAuthorityNote: observerTileAuthority.note,
    observerLeadReadinessWorkstream: observerLeadReadiness.workstream,
    observerLeadReadinessReason: observerLeadReadiness.reason,
    observerNextTechnicalAction: observerMetricCoverageBlocker.nextTechnicalAction,
    metricProducerAdmissionEvidence,
    modelTermSemanticAdmissionEvidence,
    observerDecRemediationEvidence,
    observerDecPhysicsControlEvidence,
    t00PolicyAdmissionBridgeEvidence,
    tileAuthorityEvidence,
    tileComparableCrossCheckEvidence,
    tileSurfaceReconstitutionEvidence,
    tileObserverConditionComparabilityEvidence,
    tileObserverConditionAuthorityMode: tileObserverConditionAuthority.mode,
    tileObserverConditionAuthorityNote: tileObserverConditionAuthority.note,
    tileObserverLegacyProxyDiagnostics,
    tensors: {
      metricRequired,
      tileEffective,
    },
    distinction: {
      preserveNegativeAndMixedResults: true,
      metricTensorId: "metric_required",
      tileTensorId: "tile_effective",
    },
  };
};

const isReasonCodeArray = (
  value: unknown,
): value is Nhm2ObserverAuditReasonCode[] =>
  Array.isArray(value) &&
  value.every((entry) =>
    NHM2_OBSERVER_AUDIT_REASON_CODES.includes(entry as Nhm2ObserverAuditReasonCode),
  );

const isBlockingAssessmentStatus = (
  value: unknown,
): value is Nhm2ObserverBlockingAssessmentStatus =>
  NHM2_OBSERVER_BLOCKING_ASSESSMENT_STATUS_VALUES.includes(
    value as Nhm2ObserverBlockingAssessmentStatus,
  );

const isBlockingSurface = (
  value: unknown,
): value is Nhm2ObserverPromotionBlockingSurface =>
  NHM2_OBSERVER_PROMOTION_BLOCKING_SURFACE_VALUES.includes(
    value as Nhm2ObserverPromotionBlockingSurface,
  );

const isBlockingCondition = (
  value: unknown,
): value is Nhm2ObserverPromotionBlockingCondition =>
  NHM2_OBSERVER_PROMOTION_BLOCKING_CONDITION_VALUES.includes(
    value as Nhm2ObserverPromotionBlockingCondition,
  );

const isPrimaryBlockingMode = (
  value: unknown,
): value is Nhm2ObserverPrimaryBlockingMode =>
  NHM2_OBSERVER_PRIMARY_BLOCKING_MODE_VALUES.includes(
    value as Nhm2ObserverPrimaryBlockingMode,
  );

const isPrimaryDriverAgreement = (
  value: unknown,
): value is Nhm2ObserverPrimaryDriverAgreement =>
  NHM2_OBSERVER_PRIMARY_DRIVER_AGREEMENT_VALUES.includes(
    value as Nhm2ObserverPrimaryDriverAgreement,
  );

const isRootCauseClass = (
  value: unknown,
): value is Nhm2ObserverRootCauseClass =>
  NHM2_OBSERVER_ROOT_CAUSE_CLASS_VALUES.includes(
    value as Nhm2ObserverRootCauseClass,
  );

const isBlockingDependencyStatus = (
  value: unknown,
): value is Nhm2ObserverBlockingDependencyStatus =>
  NHM2_OBSERVER_BLOCKING_DEPENDENCY_STATUS_VALUES.includes(
    value as Nhm2ObserverBlockingDependencyStatus,
  );

const isSharedRootDriverStatus = (
  value: unknown,
): value is Nhm2ObserverSharedRootDriverStatus =>
  NHM2_OBSERVER_SHARED_ROOT_DRIVER_STATUS_VALUES.includes(
    value as Nhm2ObserverSharedRootDriverStatus,
  );

const isDirection = (value: unknown): value is Nhm2ObserverAuditDirection =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((entry) => Number.isFinite(Number(entry)));

const isCondition = (value: unknown): value is Nhm2ObserverAuditCondition => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const status = record.status;
  return (
    NHM2_OBSERVER_AUDIT_CONDITION_STATUS_VALUES.includes(
      status as Nhm2ObserverAuditConditionStatus,
    ) &&
    (record.eulerianMin === null || Number.isFinite(Number(record.eulerianMin))) &&
    (record.robustMin === null || Number.isFinite(Number(record.robustMin))) &&
    record.worstCase != null &&
    typeof record.worstCase === "object" &&
    ((record.worstCase as Record<string, unknown>).direction === null ||
      isDirection((record.worstCase as Record<string, unknown>).direction))
  );
};

const isTensor = (value: unknown): value is Nhm2ObserverAuditTensor => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const conditions = record.conditions as Record<string, unknown> | undefined;
  return (
    (record.tensorId === "metric_required" || record.tensorId === "tile_effective") &&
    NHM2_OBSERVER_AUDIT_STATUS_VALUES.includes(
      record.status as Nhm2ObserverAuditStatus,
    ) &&
    NHM2_OBSERVER_AUDIT_COMPLETENESS_VALUES.includes(
      record.completeness as Nhm2ObserverAuditCompleteness,
    ) &&
    isReasonCodeArray(record.reasonCodes) &&
    Array.isArray(record.missingInputs) &&
    record.missingInputs.every((entry) => typeof entry === "string") &&
    isBlockingCondition(record.primaryBlockingCondition) &&
    isPrimaryBlockingMode(record.primaryBlockingMode) &&
    (record.primaryBlockingValue === null ||
      Number.isFinite(Number(record.primaryBlockingValue))) &&
    (record.primaryBlockingReference === null ||
      typeof record.primaryBlockingReference === "string") &&
    (record.primaryBlockingWhy === null ||
      typeof record.primaryBlockingWhy === "string") &&
    isRootCauseClass(record.rootCauseClass) &&
    isBlockingDependencyStatus(record.blockingDependencyStatus) &&
    (record.blockingDependencyNote === null ||
      typeof record.blockingDependencyNote === "string") &&
    (record.firstRemediationTarget === null ||
      typeof record.firstRemediationTarget === "string") &&
    (record.firstRemediationWhy === null ||
      typeof record.firstRemediationWhy === "string") &&
    (record.upstreamDriverRef === null ||
      typeof record.upstreamDriverRef === "string") &&
    isUpstreamDriverClass(record.upstreamDriverClass) &&
    isUpstreamDriverDependencyStatus(record.upstreamDriverDependencyStatus) &&
    (record.upstreamDriverNote === null ||
      typeof record.upstreamDriverNote === "string") &&
    (record.firstUpstreamRemediationTarget === null ||
      typeof record.firstUpstreamRemediationTarget === "string") &&
    (record.firstUpstreamRemediationWhy === null ||
      typeof record.firstUpstreamRemediationWhy === "string") &&
    typeof record.wecProbeApplied === "boolean" &&
    (record.wecProbeScale === null ||
      Number.isFinite(Number(record.wecProbeScale))) &&
    (record.wecProbeBaseline === null ||
      Number.isFinite(Number(record.wecProbeBaseline))) &&
    (record.wecProbeResult === null ||
      Number.isFinite(Number(record.wecProbeResult))) &&
    (record.wecProbeDelta === null ||
      Number.isFinite(Number(record.wecProbeDelta))) &&
    (record.decProbeBaseline === null ||
      Number.isFinite(Number(record.decProbeBaseline))) &&
    (record.decProbeResult === null ||
      Number.isFinite(Number(record.decProbeResult))) &&
    (record.decProbeDelta === null ||
      Number.isFinite(Number(record.decProbeDelta))) &&
    (record.wecProbeInterpretation === null ||
      typeof record.wecProbeInterpretation === "string") &&
    conditions != null &&
    NHM2_OBSERVER_AUDIT_CONDITION_KEYS.every((key) => isCondition(conditions[key]))
  );
};

export const isNhm2ObserverAuditArtifact = (
  value: unknown,
): value is Nhm2ObserverAuditArtifact => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const tensors = record.tensors as Record<string, unknown> | undefined;
  return (
    record.artifactId === NHM2_OBSERVER_AUDIT_ARTIFACT_ID &&
    record.schemaVersion === NHM2_OBSERVER_AUDIT_SCHEMA_VERSION &&
    typeof record.familyId === "string" &&
    (record.shiftLapseProfileId === undefined ||
      record.shiftLapseProfileId === null ||
      typeof record.shiftLapseProfileId === "string") &&
    NHM2_OBSERVER_AUDIT_STATUS_VALUES.includes(
      record.status as Nhm2ObserverAuditStatus,
    ) &&
    NHM2_OBSERVER_AUDIT_COMPLETENESS_VALUES.includes(
      record.completeness as Nhm2ObserverAuditCompleteness,
    ) &&
    isReasonCodeArray(record.reasonCodes) &&
    isBlockingAssessmentStatus(record.observerBlockingAssessmentStatus) &&
    (record.observerBlockingAssessmentNote === null ||
      typeof record.observerBlockingAssessmentNote === "string") &&
    isBlockingSurface(record.observerPromotionBlockingSurface) &&
    isBlockingCondition(record.observerPromotionBlockingCondition) &&
    isBlockingCondition(record.observerMetricPrimaryDriver) &&
    isBlockingCondition(record.observerTilePrimaryDriver) &&
    isPrimaryDriverAgreement(record.observerPrimaryDriverAgreement) &&
    (record.observerPrimaryDriverNote === null ||
      typeof record.observerPrimaryDriverNote === "string") &&
    (record.observerMetricFirstInspectionTarget === null ||
      typeof record.observerMetricFirstInspectionTarget === "string") &&
    (record.observerTileFirstInspectionTarget === null ||
      typeof record.observerTileFirstInspectionTarget === "string") &&
    isSharedRootDriverStatus(record.observerSharedRootDriverStatus) &&
    (record.observerSharedRootDriverNote === null ||
      typeof record.observerSharedRootDriverNote === "string") &&
    isSharedUpstreamDriverStatus(record.observerSharedUpstreamDriverStatus) &&
    (record.observerSharedUpstreamDriverNote === null ||
      typeof record.observerSharedUpstreamDriverNote === "string") &&
    isWecPropagationStatus(record.observerWecPropagationStatus) &&
    (record.observerWecPropagationNote === null ||
      typeof record.observerWecPropagationNote === "string") &&
    isRemediationSequenceStatus(record.observerRemediationSequenceStatus) &&
    isTileDiminishingReturnStatus(record.observerTileDiminishingReturnStatus) &&
    (record.observerTileDiminishingReturnNote === null ||
      typeof record.observerTileDiminishingReturnNote === "string") &&
    isMetricCompletenessStatus(record.observerMetricCompletenessStatus) &&
    (record.observerMetricCompletenessNote === null ||
      typeof record.observerMetricCompletenessNote === "string") &&
    isMetricCoverageBlockerStatus(record.observerMetricCoverageBlockerStatus) &&
    (record.observerMetricCoverageBlockerNote === null ||
      typeof record.observerMetricCoverageBlockerNote === "string") &&
    isMetricFirstMissingStage(record.observerMetricFirstMissingStage) &&
    isMetricEmissionAdmissionStatus(
      record.observerMetricEmissionAdmissionStatus,
    ) &&
    (record.observerMetricEmissionAdmissionNote === null ||
      typeof record.observerMetricEmissionAdmissionNote === "string") &&
    isMetricComponentAdmissionStatus(record.observerMetricT00AdmissionStatus) &&
    (record.observerMetricT00RouteId === null ||
      typeof record.observerMetricT00RouteId === "string") &&
    isModelTermSemanticCheckStatus(record.observerMetricT00ComparabilityStatus) &&
    (record.observerMetricT00AdmissionNote === null ||
      typeof record.observerMetricT00AdmissionNote === "string") &&
    isMetricComponentAdmissionStatus(record.observerMetricT0iAdmissionStatus) &&
    (record.observerMetricT0iAdmissionNote === null ||
      typeof record.observerMetricT0iAdmissionNote === "string") &&
    isMetricComponentAdmissionStatus(
      record.observerMetricOffDiagonalTijAdmissionStatus,
    ) &&
    (record.observerMetricOffDiagonalTijAdmissionNote === null ||
      typeof record.observerMetricOffDiagonalTijAdmissionNote === "string") &&
    isTileAuthorityStatus(record.observerTileAuthorityStatus) &&
    (record.observerTileAuthorityNote === null ||
      typeof record.observerTileAuthorityNote === "string") &&
    isLeadReadinessWorkstream(record.observerLeadReadinessWorkstream) &&
    (record.observerLeadReadinessReason === null ||
      typeof record.observerLeadReadinessReason === "string") &&
    isNextTechnicalAction(record.observerNextTechnicalAction) &&
    (record.metricProducerAdmissionEvidence === undefined ||
      record.metricProducerAdmissionEvidence === null ||
      isMetricProducerAdmissionEvidence(record.metricProducerAdmissionEvidence)) &&
    (record.modelTermSemanticAdmissionEvidence === undefined ||
      record.modelTermSemanticAdmissionEvidence === null ||
      isModelTermSemanticAdmissionEvidence(
        record.modelTermSemanticAdmissionEvidence,
      )) &&
    (record.observerDecRemediationEvidence === undefined ||
      record.observerDecRemediationEvidence === null ||
      isObserverDecRemediationEvidence(record.observerDecRemediationEvidence)) &&
    (record.observerDecPhysicsControlEvidence === undefined ||
      record.observerDecPhysicsControlEvidence === null ||
      isObserverDecPhysicsControlEvidence(
        record.observerDecPhysicsControlEvidence,
      )) &&
    (record.t00PolicyAdmissionBridgeEvidence === undefined ||
      record.t00PolicyAdmissionBridgeEvidence === null ||
      isT00PolicyAdmissionBridgeEvidence(
        record.t00PolicyAdmissionBridgeEvidence,
      )) &&
    (record.tileAuthorityEvidence === undefined ||
      record.tileAuthorityEvidence === null ||
      isTileAuthorityEvidence(record.tileAuthorityEvidence)) &&
    (record.tileComparableCrossCheckEvidence === undefined ||
      record.tileComparableCrossCheckEvidence === null ||
      isTileComparableCrossCheckEvidence(
        record.tileComparableCrossCheckEvidence,
      )) &&
    (record.tileSurfaceReconstitutionEvidence === undefined ||
      record.tileSurfaceReconstitutionEvidence === null ||
      isTileSurfaceReconstitutionEvidence(
        record.tileSurfaceReconstitutionEvidence,
      )) &&
    (record.tileObserverConditionComparabilityEvidence === undefined ||
      record.tileObserverConditionComparabilityEvidence === null ||
      isTileObserverConditionComparabilityEvidence(
        record.tileObserverConditionComparabilityEvidence,
      )) &&
    (record.tileObserverConditionAuthorityMode === undefined ||
      isTileObserverConditionAuthorityMode(
        record.tileObserverConditionAuthorityMode,
      )) &&
    (record.tileObserverConditionAuthorityNote === undefined ||
      record.tileObserverConditionAuthorityNote === null ||
      typeof record.tileObserverConditionAuthorityNote === "string") &&
    (record.tileObserverLegacyProxyDiagnostics === undefined ||
      record.tileObserverLegacyProxyDiagnostics === null ||
      isTileObserverLegacyProxyDiagnostics(
        record.tileObserverLegacyProxyDiagnostics,
      )) &&
    tensors != null &&
    isTensor(tensors.metricRequired) &&
    isTensor(tensors.tileEffective)
  );
};
