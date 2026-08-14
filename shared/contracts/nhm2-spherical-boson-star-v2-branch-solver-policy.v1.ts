import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256,
} from "./nhm2-spherical-boson-star-branch-bvp.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_SHA256,
} from "./nhm2-spherical-boson-star-v2-initializer-bridge.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_branch_solver_policy" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_branch_solver_policy/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_PHASE =
  "stage_2_preexecution_radial_ekg_solver_closure_ledger" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING_PINS =
  Object.freeze({
    branchBvpSha256:
      "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
    branchBvpCanonicalSizeBytes: 13_847,
    sourceSeedPrimaryNumericsSha256:
      "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
    sourceSeedPrimaryNumericsCanonicalSizeBytes: 80_055,
    targetCandidateFreezeSha256:
      "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    targetCandidateFreezeCanonicalSizeBytes: 55_997,
    initializerBridgeSha256:
      "c5c4c45755e0dc682694f8a107c31780d85d860b2a71be567a2cfe0d06300631",
    initializerBridgeCanonicalSizeBytes: 7_715,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BLOCKERS =
  Object.freeze([
    Object.freeze({
      blockerId: "radial_grid_discretization_unclosed",
      surface: "grid",
      upstreamEvidence:
        "branch_bvp.unresolvedExecutionSurface.gridPolicy_is_null",
      requiredResolution:
        "candidate_specific_compactification_nodes_domain_decomposition_and_differentiation_operators_literal_bytes",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "vacuum_continuation_schedule_unclosed",
      surface: "continuation",
      upstreamEvidence:
        "branch_bvp.unresolvedExecutionSurface.continuationPolicy_is_null",
      requiredResolution:
        "start_amplitude_step_schedule_tangent_orientation_fold_test_and_target_landing_rule_literal_bytes",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "relativistic_newton_update_graph_unclosed",
      surface: "newton",
      upstreamEvidence:
        "branch_bvp.unresolvedExecutionSurface.solverPolicy_is_null",
      requiredResolution:
        "state_packing_residual_assembly_update_sign_globalization_iteration_limits_and_stop_rule_literal_bytes",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "relativistic_jacobian_graph_unclosed",
      surface: "jacobian",
      upstreamEvidence:
        "frozen_rows_do_not_select_analytic_automatic_or_finite_difference_discrete_jacobian",
      requiredResolution:
        "exact_discrete_row_column_order_endpoint_rows_derivative_graph_and_materialization_order_literal_bytes",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "relativistic_linear_solve_unclosed",
      surface: "linear_solve",
      upstreamEvidence:
        "source_seed_primary_numerics_has_source_candidate_only_and_initializer_bridge_imports_no_runtime_authority",
      requiredResolution:
        "factorization_pivoting_scaling_refinement_precision_reduction_and_singularity_rules_literal_bytes",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "origin_series_derivation_unbound",
      surface: "origin_boundary",
      upstreamEvidence: "branch_bvp.originSeriesDuty.present_is_false",
      requiredResolution:
        "symbolic_origin_series_derivation_hash_and_independent_replay_receipt",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "asymptotic_tail_derivation_unbound",
      surface: "infinity_boundary",
      upstreamEvidence: "branch_bvp.asymptoticTailSeriesDuty.present_is_false",
      requiredResolution:
        "symbolic_tail_series_derivation_hash_and_independent_replay_receipt",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "radial_acceptance_thresholds_unclosed",
      surface: "acceptance",
      upstreamEvidence:
        "branch_bvp.residualNormalization.numericAcceptanceThresholds_is_null",
      requiredResolution:
        "preexecution_numeric_thresholds_for_solved_rows_unused_constraint_boundaries_branch_identity_and_fold_detection",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "natural_units_to_si_normalization_packet_unbound",
      surface: "si_normalization",
      upstreamEvidence:
        "candidate_outputs_are_labeled_J_per_m3_or_squared_while_the_radial_BVP_is_dimensionless_and_only_the_combined_8_pi_G_mu_squared_coupling_is_frozen",
      requiredResolution:
        "literal_CODATA_or_explicit_equivalent_physical_constants_dataset_identity_G_hbar_c_decimal_values_units_uncertainties_mu_SI_binding_and_ordered_dimensionless_stress_to_J_per_m3_conversion_graph_with_precision_rounding_and_replay",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "initializer_instance_unbound",
      surface: "initializer",
      upstreamEvidence:
        "initializer_bridge.completionBoundary.initializerInstancePresent_is_false",
      requiredResolution:
        "valid_target_candidate_initializer_binding_over_the_exact_five_payloads",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "implementation_runtime_and_preseal_absent",
      surface: "runtime",
      upstreamEvidence:
        "no_candidate_specific_source_toolchain_executable_runtime_or_scientific_preseal_is_bound",
      requiredResolution:
        "disjoint_source_toolchain_executable_runtime_manifest_and_preexecution_preseal",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "branch_and_fold_replay_absent",
      surface: "replay",
      upstreamEvidence:
        "branch_bvp_branch_identity_and_no_fold_receipts_are_null",
      requiredResolution:
        "server_byte_replay_and_independent_branch_identity_monotonicity_and_no_fold_agreement",
      disposition: "block_candidate_acceptance",
    }),
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_AUTHORITY_LOCKS =
  Object.freeze({
    policyCompletenessAuthority: false as const,
    sourceCandidateAuthorityImported: false as const,
    sourceRuntimeAuthorityImported: false as const,
    targetCandidateAuthority: false as const,
    gridAuthority: false as const,
    continuationAuthority: false as const,
    newtonAuthority: false as const,
    jacobianAuthority: false as const,
    linearSolveAuthority: false as const,
    originSeriesAuthority: false as const,
    tailSeriesAuthority: false as const,
    acceptanceAuthority: false as const,
    siNormalizationAuthority: false as const,
    implementationAuthority: false as const,
    runtimeAuthority: false as const,
    scientificPresealAuthority: false as const,
    executionAuthority: false as const,
    branchSolveAuthority: false as const,
    firstBranchAuthority: false as const,
    noFoldAuthority: false as const,
    residualPassAuthority: false as const,
    nondegeneracyAuthority: false as const,
    rawReplayAuthority: false as const,
    independentAgreementAuthority: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphAuthority: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateAuthority: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 16_384,
    maximumArrayLength: 1_024,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 2_048,
    maximumStringUtf8Bytes: 32_768,
    maximumAggregateUtf8Bytes: 524_288,
  } as const);

const BVP = NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1;
const SEED_PRIMARY =
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1;
const FREEZE = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
const BRIDGE = NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE;

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CONTRACT_VERSION,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_PHASE,
  authority:
    "preexecution_solver_closure_ledger_only_without_numerical_execution_or_branch_authority",
  maturity:
    "stage_2_bvp_and_initializer_semantics_bound_but_candidate_specific_discrete_solver_policy_incomplete",
  frozenBeforeTargetExecution: true,
  exactUpstreamBindings: {
    branchBvp: { ...NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING },
    sourceSeedPrimaryNumerics: {
      ...NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING,
    },
    targetCandidateFreeze: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    },
    initializerBridge: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING,
    },
  },
  candidateBoundary: {
    targetCandidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sourceCandidateId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING.candidateId,
    sourceAndTargetMustBeDistinct: true,
    sourceSeedRole:
      "evidence_and_initial_guess_semantics_only_not_relativistic_solver_runtime_authority",
    branchBvpRole:
      "frozen_relativistic_equations_boundary_duties_and_branch_gates_only",
    automaticV3RuntimeGridSolverContinuationOrReceiptInheritanceAllowed: false,
    declaredLeverOrTileTensorUsed: false,
    sourceMode: FREEZE.candidateIdentity.sourceMode,
    failureDisposition: "fail_this_v2_candidate_without_retuning",
  },
  frozenIdentity: {
    geometryId: FREEZE.candidateIdentity.geometryId,
    quantumStateId: FREEZE.candidateIdentity.quantumStateId,
    chartId: FREEZE.candidateIdentity.chartId,
    normalizationId: FREEZE.candidateIdentity.normalizationId,
    tolerancePolicyId: FREEZE.candidateIdentity.tolerancePolicyId,
    selectedProfileId: FREEZE.candidateIdentity.selectedProfileId,
  },
  bvpSemanticClosure: {
    radialDomain: BVP.dimensionlessRadialSystem.radialDomain,
    chart: BVP.dimensionlessRadialSystem.chart,
    unknownFunctionOrder: BVP.dimensionlessRadialSystem.unknownFunctionOrder,
    eigenvalueUnknownOrder:
      BVP.dimensionlessRadialSystem.eigenvalueUnknownOrder,
    solvedResidualOrder: BVP.ellipticResidualSystem.solvedResidualOrder,
    unusedConstraintOrder: BVP.ellipticResidualSystem.unusedConstraintOrder,
    cancellationFreeComponentFormulas: BVP.cancellationFreeMixedComponents,
    residualNormalization: {
      denominatorRule: BVP.residualNormalization.denominatorRule,
      solvedRows: BVP.residualNormalization.solvedRows,
      unusedConstraintRows: BVP.residualNormalization.unusedConstraintRows,
      numericAcceptanceThresholds:
        BVP.residualNormalization.numericAcceptanceThresholds,
    },
    boundaryConditions: BVP.boundaryConditions,
    branchSelectionGates: {
      quantumNumbers: BVP.branchSelectionGates.quantumNumbers,
      targetOriginAmplitude: BVP.branchSelectionGates.targetOriginAmplitude,
      fieldSignAndNodes: BVP.branchSelectionGates.fieldSignAndNodes,
      strictRadialMonotonicityExpression:
        BVP.branchSelectionGates.strictRadialMonotonicity.expression,
      firstVacuumConnectedBranchDefinition:
        BVP.branchSelectionGates.firstVacuumConnectedBranch.definition,
      failedGateDisposition: BVP.branchSelectionGates.failedGateDisposition,
    },
    finiteArithmeticRequired:
      BVP.cancellationFreeMixedComponents.finiteArithmeticRequired,
    negativeZeroCanonicalizedToPositiveZero:
      BVP.cancellationFreeMixedComponents
        .negativeZeroCanonicalizedToPositiveZero,
    submittedTargetOrResidualArraysMayBeRead:
      BVP.ellipticResidualSystem.submittedTargetOrResidualArraysMayBeRead,
    equationsAndBoundaryDutiesFrozen: true,
    discreteNumericalRealizationFrozen: false,
  },
  initializerAdmission: {
    bridgeScope: BRIDGE.initializerSemantics.scope,
    exactScaling: BRIDGE.initializerSemantics.exactScaling,
    varphiInit: BRIDGE.initializerSemantics.varphiInit,
    F0Init: BRIDGE.initializerSemantics.F0Init,
    F1Init: BRIDGE.initializerSemantics.F1Init,
    wInit: BRIDGE.initializerSemantics.wInit,
    targetOriginAmplitude: BRIDGE.initializerSemantics.targetOriginAmplitude,
    relativisticBvpMustResolveFrequencyAgain:
      BRIDGE.initializerSemantics.relativisticBvpMustResolveFrequencyAgain,
    initializerBindingRequired: true,
    initializerInstancePresent:
      BRIDGE.completionBoundary.initializerInstancePresent,
    initializerBinding: BRIDGE.unresolved.initializerBinding,
    establishesRelativisticResidualPass:
      BRIDGE.initializerSemantics.establishesRelativisticResidualPass,
    establishesBranchIdentity:
      BRIDGE.initializerSemantics.establishesBranchIdentity,
    establishesNoFold: BRIDGE.initializerSemantics.establishesNoFold,
    sourcePrimaryGridNewtonJacobianOrLinearSolveMayBeCopiedToTarget: false,
  },
  gridPolicy: {
    status: "blocked_unclosed",
    radialCoordinateAndDomainFrozen: true,
    radialCoordinate: BVP.dimensionlessRadialSystem.definitions.x,
    radialDomain: BVP.dimensionlessRadialSystem.radialDomain,
    discretizationFamily: null,
    compactificationMap: null,
    finiteOuterBoundary: null,
    domainDecomposition: null,
    nodeCountAndNodeFormula: null,
    collocationOrGalerkinBasis: null,
    differentiationOperatorConstruction: null,
    integrationAndReductionOrder: null,
    originRowRealization: null,
    infinityRowRealization: null,
    refinementOrConvergenceGrid: null,
    frozen: false,
  },
  continuationPolicy: {
    status: "blocked_unclosed",
    requiredBranch:
      BVP.branchSelectionGates.firstVacuumConnectedBranch.definition,
    targetOriginAmplitude: BVP.branchSelectionGates.targetOriginAmplitude.exact,
    startAmplitude: null,
    continuationParameter: null,
    stepSchedule: null,
    predictor: null,
    corrector: null,
    tangentOrientationAndSignRule: null,
    foldObservableAndThreshold: null,
    targetLandingRule: null,
    branchSwitchAllowed: false,
    observedResultMayChangeSchedule: false,
    frozen: false,
  },
  newtonPolicy: {
    status: "blocked_unclosed",
    continuumUnknownOrder: [
      ...BVP.dimensionlessRadialSystem.unknownFunctionOrder,
      ...BVP.dimensionlessRadialSystem.eigenvalueUnknownOrder,
    ],
    continuumSolvedResidualOrder:
      BVP.ellipticResidualSystem.solvedResidualOrder,
    discreteStatePacking: null,
    discreteResidualPacking: null,
    updateEquationAndSign: null,
    iterationLimit: null,
    globalizationOrLineSearch: null,
    acceptedUpdateRule: null,
    convergenceNormAndThreshold: null,
    consecutivePassCount: null,
    stagnationAndDivergenceRules: null,
    frozen: false,
  },
  jacobianPolicy: {
    status: "blocked_unclosed",
    derivativeSource:
      "must_differentiate_the_exact_frozen_cancellation_free_rows_and_selected_boundary_rows",
    analyticAutomaticOrFiniteDifferenceSelection: null,
    discreteRowOrder: null,
    discreteColumnOrder: null,
    endpointRowSubstitution: null,
    frequencyColumnDerivatives: null,
    materializationAndEvaluationOrder: null,
    derivativeVerificationFixture: null,
    submittedOrObservedResidualMayBeUsedAsDerivativeAuthority: false,
    frozen: false,
  },
  linearSolvePolicy: {
    status: "blocked_unclosed",
    algorithm: null,
    matrixLayout: null,
    equilibrationOrScaling: null,
    pivotSelectionAndTieBreak: null,
    singularityThreshold: null,
    arithmeticPrecisionAndRounding: null,
    iterativeRefinement: null,
    residualRecomputeOrder: null,
    threadAndReductionOrder: null,
    sourceSeedPrimaryAlgorithmImportedAsTargetAuthority: false,
    frozen: false,
  },
  boundaryDerivationClosure: {
    originSeriesArtifact: BVP.originSeriesDuty.symbolicDerivationArtifact,
    originSeriesSha256: BVP.originSeriesDuty.derivationSha256,
    originSeriesReplayReceipt: BVP.originSeriesDuty.independentReplayReceipt,
    originSeriesPresent: BVP.originSeriesDuty.present,
    tailSeriesArtifact: BVP.asymptoticTailSeriesDuty.symbolicDerivationArtifact,
    tailSeriesSha256: BVP.asymptoticTailSeriesDuty.derivationSha256,
    tailSeriesReplayReceipt:
      BVP.asymptoticTailSeriesDuty.independentReplayReceipt,
    tailSeriesPresent: BVP.asymptoticTailSeriesDuty.present,
    complete: false,
  },
  siNormalizationClosure: {
    status: "blocked_unclosed",
    sourceNaturalUnits:
      FREEZE.frozenScience.normalization.conventions.naturalUnits,
    dimensionlessDefinitions:
      FREEZE.frozenScience.normalization.dimensionlessDefinitions,
    frozenCombinedMatterCoupling:
      FREEZE.frozenScience.normalization.matterCoupling,
    declaredOutputUnits: FREEZE.frozenScience.normalization.units,
    outputUnitsAreLabelsNotConversionAuthority: true,
    combinedEightPiGMuSquaredDeterminesSeparateGAndMuValues: false,
    dimensionlessRadialSolutionMayBeTreatedAsSIStressBytes: false,
    physicalConstantsDatasetIdentity: null,
    codataReleaseIdentity: null,
    gravitationalConstantGSIDecimalValueUnitAndUncertainty: null,
    reducedPlanckConstantHbarSIExactValueAndUnit: null,
    speedOfLightCSIExactValueAndUnit: null,
    scalarMassOrInverseLengthMuSIExactBinding: null,
    dimensionlessStressToJPerM3OperationGraph: null,
    dimensionlessNoiseToJ2PerM6OperationGraph: null,
    arithmeticPrecisionRoundingAndReductionOrder: null,
    serverConversionReplayReceipt: null,
    independentConversionAgreementReceipt: null,
    complete: false,
  },
  attemptPolicy: {
    maximumCandidateAttempts: BRIDGE.attemptPolicy.maximumAttempts,
    retryAllowed: BRIDGE.attemptPolicy.retryAllowed,
    retuneAllowed: BRIDGE.attemptPolicy.retuneAllowed,
    alternateInitializerOrBranchFallbackAllowed:
      BRIDGE.attemptPolicy.alternateInitializerOrBranchFallbackAllowed,
    alternateGridContinuationNewtonJacobianLinearSolvePrecisionOrToleranceAllowed: false,
    observationMaySelectOrChangeAnyNumericalChoice: false,
    failureDisposition:
      "fail_the_distinct_frozen_v2_candidate_without_retuning_or_fallback",
    frozen: true,
  },
  executionClosure: {
    gridPolicyRequired: true,
    continuationPolicyRequired: true,
    newtonPolicyRequired: true,
    jacobianPolicyRequired: true,
    linearSolvePolicyRequired: true,
    originAndTailDerivationsRequired: true,
    radialAcceptanceThresholdsRequired: true,
    naturalUnitsToSINormalizationPacketRequired: true,
    initializerBindingRequired: true,
    candidateSpecificSourceToolchainExecutableRuntimeRequired: true,
    scientificPresealRequired: true,
    exactCommandTimingHashesAndFreshnessRequired: true,
    allRequiredSurfacesMustBeLiteralHashBoundBeforeExecution: true,
    sourceManifest: null,
    toolchainManifest: null,
    executableBinding: null,
    runtimeManifest: null,
    scientificPreseal: null,
    command: null,
    timing: null,
    freshnessReceipt: null,
    branchOutputManifest: null,
    branchExecutionReceipt: null,
  },
  replayClosure: {
    serverMustRecomputeFrozenRowsFromPersistedPrimitiveBytes: true,
    independentImplementationMustUseSameFrozenInputBytes: true,
    branchMonotonicityReplayReceipt: null,
    firstVacuumConnectedBranchReplayReceipt: null,
    noFoldReplayReceipt: null,
    solvedResidualReplayReceipt: null,
    unusedConstraintReplayReceipt: null,
    pairAgreementReceipt: null,
    performed: false,
    passed: false,
  },
  completion: {
    upstreamIdentityAndBvpSemanticsBound: true,
    oneAttemptAndNoRetuneSemanticsFrozen: true,
    gridPolicyComplete: false,
    continuationPolicyComplete: false,
    newtonPolicyComplete: false,
    jacobianPolicyComplete: false,
    linearSolvePolicyComplete: false,
    boundaryDerivationsComplete: false,
    radialAcceptancePolicyComplete: false,
    siNormalizationComplete: false,
    initializerInstancePresent: false,
    implementationPresent: false,
    runtimeClosurePresent: false,
    scientificPresealPresent: false,
    policyComplete: false,
    executionAuthorized: false,
    executionObserved: false,
    branchOutputPresent: false,
    replayComplete: false,
    independentAgreementComplete: false,
    lampsPromoted: false,
  },
  blockers: NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BLOCKERS,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2BranchSolverPolicyV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY;

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map((entry) => canonicalJson(entry)).join(",") + "]";
  }
  const record = value as Record<string, unknown>;
  return (
    "{" +
    Object.keys(record)
      .sort()
      .map((key) => JSON.stringify(key) + ":" + canonicalJson(record[key]))
      .join(",") +
    "}"
  );
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY);
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-branch-solver-policy/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_EXPECTED_SHA256 =
  "b7d2cb2d7dcf39531000bbfcdfadb44f5e9c38d3ab1950982515245336a77cb0" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_EXPECTED_CANONICAL_SIZE_BYTES =
  18_993 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_LITERAL_SEAL_STATUS =
  "sealed_before_target_candidate_execution_with_unclosed_solver_and_SI_normalization_surfaces" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

const assertInvariants = (): void => {
  const pins = NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING_PINS;
  if (
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256 !== pins.branchBvpSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES !==
      pins.branchBvpCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256 !==
      pins.sourceSeedPrimaryNumericsSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES !==
      pins.sourceSeedPrimaryNumericsCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256 !==
      pins.targetCandidateFreezeSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES !==
      pins.targetCandidateFreezeCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_SHA256 !==
      pins.initializerBridgeSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_SIZE_BYTES !==
      pins.initializerBridgeCanonicalSizeBytes
  ) {
    throw new Error("nhm2_spherical_v2_branch_solver_dependency_pin_drift");
  }
  if (
    String(CONTRACT.candidateBoundary.targetCandidateId) ===
      String(CONTRACT.candidateBoundary.sourceCandidateId) ||
    CONTRACT.candidateBoundary.targetCandidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID ||
    CONTRACT.candidateBoundary.declaredLeverOrTileTensorUsed !== false ||
    CONTRACT.bvpSemanticClosure.submittedTargetOrResidualArraysMayBeRead !==
      false ||
    CONTRACT.initializerAdmission.relativisticBvpMustResolveFrequencyAgain !==
      true ||
    CONTRACT.initializerAdmission
      .sourcePrimaryGridNewtonJacobianOrLinearSolveMayBeCopiedToTarget !== false
  ) {
    throw new Error("nhm2_spherical_v2_branch_solver_semantic_invariant");
  }
  if (
    CONTRACT.attemptPolicy.maximumCandidateAttempts !== 1 ||
    CONTRACT.attemptPolicy.retryAllowed !== false ||
    CONTRACT.attemptPolicy.retuneAllowed !== false ||
    CONTRACT.attemptPolicy.observationMaySelectOrChangeAnyNumericalChoice !==
      false ||
    CONTRACT.gridPolicy.frozen !== false ||
    CONTRACT.continuationPolicy.frozen !== false ||
    CONTRACT.newtonPolicy.frozen !== false ||
    CONTRACT.jacobianPolicy.frozen !== false ||
    CONTRACT.linearSolvePolicy.frozen !== false ||
    CONTRACT.siNormalizationClosure.complete !== false ||
    CONTRACT.siNormalizationClosure
      .dimensionlessRadialSolutionMayBeTreatedAsSIStressBytes !== false ||
    CONTRACT.siNormalizationClosure.physicalConstantsDatasetIdentity !== null ||
    CONTRACT.siNormalizationClosure
      .dimensionlessStressToJPerM3OperationGraph !== null ||
    CONTRACT.completion.policyComplete !== false ||
    CONTRACT.completion.executionAuthorized !== false ||
    CONTRACT.replayClosure.performed !== false ||
    CONTRACT.replayClosure.passed !== false ||
    Object.values(CONTRACT.authorityLocks).some((value) => value !== false)
  ) {
    throw new Error("nhm2_spherical_v2_branch_solver_authority_invariant");
  }
  if (
    CONTRACT.blockers.length !== 12 ||
    new Set(CONTRACT.blockers.map(({ blockerId }) => blockerId)).size !==
      CONTRACT.blockers.length ||
    CONTRACT.blockers.some(
      ({ disposition }) =>
        disposition !== "block_candidate_execution" &&
        disposition !== "block_candidate_acceptance",
    )
  ) {
    throw new Error("nhm2_spherical_v2_branch_solver_blocker_invariant");
  }
  if (
    SEED_PRIMARY.completionBoundary.executionAuthorized !== false ||
    BRIDGE.authorityLocks.sourceRuntimeAuthorityImported !== false ||
    BVP.unresolvedExecutionSurface.solverPolicy !== null ||
    BVP.unresolvedExecutionSurface.gridPolicy !== null ||
    BVP.unresolvedExecutionSurface.continuationPolicy !== null
  ) {
    throw new Error("nhm2_spherical_v2_branch_solver_upstream_boundary_drift");
  }
};

assertInvariants();

if (
  (NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_EXPECTED_SHA256 ==
    null) !==
  (NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_EXPECTED_CANONICAL_SIZE_BYTES ==
    null)
) {
  throw new Error("nhm2_spherical_v2_branch_solver_partial_literal_seal");
}
if (
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_EXPECTED_SHA256 != null &&
  (NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_EXPECTED_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_EXPECTED_CANONICAL_SIZE_BYTES)
) {
  throw new Error(
    "nhm2_spherical_v2_branch_solver_literal_pin_mismatch:" +
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_SHA256 +
      "/" +
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CANONICAL_SIZE_BYTES,
  );
}

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;
type SnapshotBudget = { nodes: number; utf8Bytes: number };

const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
  depth = 0,
  budget: SnapshotBudget = { nodes: 0, utf8Bytes: 0 },
): SnapshotResult => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth) {
    return { ok: false, violation: "snapshot_depth_limit:" + (pointer || "/") };
  }
  budget.nodes += 1;
  if (budget.nodes > limits.maximumNodes) {
    return { ok: false, violation: "snapshot_node_limit:" + (pointer || "/") };
  }
  if (value === null || typeof value === "boolean") return { ok: true, value };
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? { ok: true, value }
      : { ok: false, violation: "non_json_number:" + (pointer || "/") };
  }
  if (typeof value === "string") {
    const bytes = Buffer.byteLength(value, "utf8");
    budget.utf8Bytes += bytes;
    if (
      bytes > limits.maximumStringUtf8Bytes ||
      budget.utf8Bytes > limits.maximumAggregateUtf8Bytes ||
      value.includes("\0") ||
      /[\ud800-\udfff]/u.test(value)
    ) {
      return { ok: false, violation: "string_byte_limit:" + (pointer || "/") };
    }
    return { ok: true, value };
  }
  if (typeof value !== "object") {
    return { ok: false, violation: "non_json_value:" + (pointer || "/") };
  }
  if (isProxy(value)) {
    return { ok: false, violation: "proxy_forbidden:" + (pointer || "/") };
  }
  if (ancestors.has(value)) {
    return { ok: false, violation: "cycle_forbidden:" + (pointer || "/") };
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    const keys = Reflect.ownKeys(value);
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      value.length > limits.maximumArrayLength ||
      Object.keys(value).length !== value.length ||
      keys.some(
        (key) =>
          key !== "length" &&
          (typeof key !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(key)),
      )
    ) {
      return { ok: false, violation: "array_surface:" + (pointer || "/") };
    }
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return { ok: false, violation: "array_surface:" + (pointer || "/") };
      }
      const child = snapshotPlainData(
        descriptor.value,
        pointer + "/" + index,
        ancestors,
        depth + 1,
        budget,
      );
      if (!child.ok) return child;
      output.push(child.value);
    }
    ancestors.delete(value);
    return { ok: true, value: output };
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return { ok: false, violation: "non_plain_object:" + (pointer || "/") };
  }
  const keys = Reflect.ownKeys(value);
  if (
    keys.length > limits.maximumObjectPropertyCount ||
    keys.some(
      (key) =>
        typeof key !== "string" ||
        FORBIDDEN_KEYS.has(key) ||
        Buffer.byteLength(key, "utf8") > limits.maximumPropertyKeyUtf8Bytes,
    )
  ) {
    return { ok: false, violation: "object_surface:" + (pointer || "/") };
  }
  const output: Record<string, unknown> = {};
  for (const key of keys as string[]) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      return {
        ok: false,
        violation: "object_entry_surface:" + pointer + "/" + key,
      };
    }
    const child = snapshotPlainData(
      descriptor.value,
      pointer + "/" + key,
      ancestors,
      depth + 1,
      budget,
    );
    if (!child.ok) return child;
    output[key] = child.value;
  }
  ancestors.delete(value);
  return { ok: true, value: output };
};

export const cloneNhm2SphericalBosonStarV2BranchSolverPolicy = () =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CANONICAL_JSON,
  ) as Nhm2SphericalBosonStarV2BranchSolverPolicyV1;

export const nhm2SphericalBosonStarV2BranchSolverPolicyViolations = (
  value: unknown,
): string[] => {
  try {
    const snapshot = snapshotPlainData(value);
    if (!snapshot.ok) return [snapshot.violation];
    return canonicalJson(snapshot.value) ===
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CANONICAL_JSON
      ? []
      : ["spherical_v2_branch_solver_policy_semantic_drift"];
  } catch {
    return ["spherical_v2_branch_solver_policy_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2BranchSolverPolicyV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2BranchSolverPolicyV1 =>
  nhm2SphericalBosonStarV2BranchSolverPolicyViolations(value).length === 0;
