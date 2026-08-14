import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { isProxy } from "node:util/types";

import {
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING,
} from "./nhm2-spherical-boson-star-branch-bvp.v1";
import { NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING } from "./nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
} from "./nhm2-spherical-boson-star-v2-branch-solver-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING,
} from "./nhm2-spherical-boson-star-v2-initializer-evaluator.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_ROOT,
} from "./nhm2-spherical-boson-star-v2-radial-primary-numerics.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2.branch_execution_policy" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_VERSION =
  "nhm2_spherical_boson_star_v2_branch_execution_policy/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANDIDATE_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 28,
    maximumNodes: 8_192,
    maximumArrayLength: 256,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 2_048,
    maximumStringUtf8Bytes: 32_768,
    maximumAggregateUtf8Bytes: 262_144,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_UPSTREAM_BINDING_PINS =
  Object.freeze({
    sourceCandidatePlan: Object.freeze({
      sha256:
        "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
      canonicalSizeBytes: 93_214,
    }),
    branchBvp: Object.freeze({
      sha256:
        "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
      canonicalSizeBytes: 13_847,
    }),
    targetCandidateFreeze: Object.freeze({
      sha256:
        "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
      canonicalSizeBytes: 55_997,
    }),
    branchSolverLedger: Object.freeze({
      sha256:
        "b7d2cb2d7dcf39531000bbfcdfadb44f5e9c38d3ab1950982515245336a77cb0",
      canonicalSizeBytes: 18_993,
    }),
    initializerEvaluator: Object.freeze({
      sha256:
        "2253cea43e7b0abc99aaebd19ced18994eba4605b65fe674febb03d9945cdbc5",
      canonicalSizeBytes: 24_711,
    }),
    radialPrimaryNumerics: Object.freeze({
      sha256:
        "f88e31544dfeccdbb43a5b956172c4b6b4b84f22de3b25ced762282cb5f271bc",
      canonicalSizeBytes: 14_732,
    }),
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_UPSTREAM_SOURCE_PINS =
  Object.freeze([
    Object.freeze({
      ordinal: 0,
      role: "source_candidate_plan_contract_source",
      relativePath:
        "shared/contracts/nhm2-spherical-boson-star-coherent-candidate-plan.v1.ts",
      sha256:
        "a4255ecc4c19e49598aa23c0a4fac1ccb5b001096bbeb0ea33fe41cc84dc3d2c",
      sizeBytes: 36_230,
    }),
    Object.freeze({
      ordinal: 1,
      role: "branch_bvp_contract_source",
      relativePath:
        "shared/contracts/nhm2-spherical-boson-star-branch-bvp.v1.ts",
      sha256:
        "4df37db5f8b01bda9b0c02eaef2fb661abd67e71fbe99ede51aa3238348cfcab",
      sizeBytes: 28_619,
    }),
    Object.freeze({
      ordinal: 2,
      role: "target_candidate_freeze_contract_source",
      relativePath:
        "shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1.ts",
      sha256:
        "2d9ff3447910e596f0e053d292df2cee43dc941ee8290e1518e019008ae6b4cd",
      sizeBytes: 37_334,
    }),
    Object.freeze({
      ordinal: 3,
      role: "branch_solver_ledger_contract_source",
      relativePath:
        "shared/contracts/nhm2-spherical-boson-star-v2-branch-solver-policy.v1.ts",
      sha256:
        "2565f4d9225f9d6727e315461cb20a49ff9c8cc953cf9286f2230f213046de10",
      sizeBytes: 35_083,
    }),
    Object.freeze({
      ordinal: 4,
      role: "initializer_evaluator_contract_source",
      relativePath:
        "shared/contracts/nhm2-spherical-boson-star-v2-initializer-evaluator.v1.ts",
      sha256:
        "05d0c327090a30065a453941ad4612f518818dd88f230864d4ef257c9e8a2be4",
      sizeBytes: 60_627,
    }),
    Object.freeze({
      ordinal: 5,
      role: "radial_primary_numerics_contract_source",
      relativePath:
        "shared/contracts/nhm2-spherical-boson-star-v2-radial-primary-numerics.v1.ts",
      sha256:
        "dfec69750d345893a02483e1a13eb65c928966f0635e43ee559e0ed630634f10",
      sizeBytes: 34_965,
    }),
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BRANCH_SOURCE_PINS =
  Object.freeze([
    Object.freeze({
      ordinal: 0,
      role: "binary64_environment_boundary",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/binary64_environment.py",
      sha256:
        "ec973351fa34efd1c76b3358e6b87da91688a06a648e5299d0aa800767e11a47",
      sizeBytes: 12_642,
    }),
    Object.freeze({
      ordinal: 1,
      role: "pointwise_radial_residual",
      relativePath: "tools/nhm2-spherical-boson-star-branch/radial_residual.py",
      sha256:
        "c22249155373344069772bfe2b4807385de6d7edc4454242d855b6f8611cd205",
      sizeBytes: 10_222,
    }),
    Object.freeze({
      ordinal: 2,
      role: "analytic_local_residual_jacobian",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_residual_jacobian.py",
      sha256:
        "5464f2010e051cf2487fbdd9f6879b355d7e7ede47e6bd3ea245916781a1119e",
      sizeBytes: 5_583,
    }),
    Object.freeze({
      ordinal: 3,
      role: "interior_collocation_assembly",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_collocation_interior.py",
      sha256:
        "253aee132897b6b11fa57df1b0864d9a821cc6dbce8b870dba3ab0e4f610290a",
      sizeBytes: 8_898,
    }),
    Object.freeze({
      ordinal: 4,
      role: "finite_origin_series_x4",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_origin_series.py",
      sha256:
        "ea76613c9cb5d3ad882d96786f98f85ee170f67e486672d97bc3add444a0d25d",
      sizeBytes: 4_738,
    }),
    Object.freeze({
      ordinal: 5,
      role: "leading_tail_asymptotics",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_tail_asymptotics.py",
      sha256:
        "b635e5d6f24d05f0c88b29dfa99a156c34968990f4948048a78bd98f2690b1b9",
      sizeBytes: 3_554,
    }),
    Object.freeze({
      ordinal: 6,
      role: "mpfr256_compactified_lobatto_grid",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_lobatto_grid.py",
      sha256:
        "ea424885abed4788d989cd228b7c4dd7b8907909bd4a0931b2e009d021d4d385",
      sizeBytes: 6_704,
    }),
    Object.freeze({
      ordinal: 7,
      role: "compactified_square_bvp_assembly",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_compactified_system.py",
      sha256:
        "dafe134453b5a2a328fbe9088b4e85593e9ea4ee231923fec4024d2f67ebb905",
      sizeBytes: 15_202,
    }),
    Object.freeze({
      ordinal: 8,
      role: "deterministic_dense_lu",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/deterministic_dense_lu.py",
      sha256:
        "70b63cdf3517d0ae5f81217ca31d6d1d2a7450b76569e7693c3b8e9e59572ce2",
      sizeBytes: 8_033,
    }),
    Object.freeze({
      ordinal: 9,
      role: "deterministic_newton_armijo",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/deterministic_newton.py",
      sha256:
        "60ad54e4376e43aa8c496e38fa9a495cab4d0a5001ca2515692a684889516618",
      sizeBytes: 13_891,
    }),
    Object.freeze({
      ordinal: 10,
      role: "finite_amplitude_continuation",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_continuation.py",
      sha256:
        "f244aa09926860ffc16099748f36928ed81cc1802abfa97bb63787d330398760",
      sizeBytes: 12_316,
    }),
  ] as const);

const RADIAL = NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1;
const SOLVER = NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY;
const BVP = NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1;
const FREEZE = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
const INITIALIZER = NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR;

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BLOCKERS =
  Object.freeze([
    Object.freeze({
      ordinal: 0,
      blockerId: "initializer_instance_and_supplemental_trace_unbound",
      surface: "initializer",
      unresolvedValue: null,
      evidence:
        "initializer_evaluator_instances_and_supplemental_join_payload_are_null",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      ordinal: 1,
      blockerId: "candidate_grid_and_refinement_schedule_underdetermined",
      surface: "candidate_grid",
      unresolvedValue: null,
      evidence:
        "source_supports_N_3_through_512_but_64_96_128_and_256_are_explicitly_diagnostic_only_and_not_a_candidate_schedule",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      ordinal: 2,
      blockerId: "cross_grid_convergence_criterion_underdetermined",
      surface: "cross_grid_convergence",
      unresolvedValue: null,
      evidence:
        "no_projection_comparison_norm_tolerance_or_pass_rule_is_selected_by_the_bound_bytes",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      ordinal: 3,
      blockerId: "continuous_vacuum_connection_proof_underdetermined",
      surface: "branch_topology",
      unresolvedValue: null,
      evidence:
        "finite_schedule_begins_at_nonzero_amplitude_and_contains_no_interval_proof",
      disposition: "block_candidate_acceptance",
    }),
    Object.freeze({
      ordinal: 4,
      blockerId: "no_fold_tangent_observable_and_threshold_underdetermined",
      surface: "no_fold",
      unresolvedValue: null,
      evidence:
        "nodal_ordering_and_frequency_progression_are_diagnostics_not_a_tangent_orientation_or_fold_proof",
      disposition: "block_candidate_acceptance",
    }),
    Object.freeze({
      ordinal: 5,
      blockerId: "origin_and_tail_remainder_proofs_unbound",
      surface: "boundary_proof",
      unresolvedValue: null,
      evidence:
        "origin_is_finite_through_x4_and_tail_is_leading_only_without_all_order_recurrence_or_remainder_bound",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      ordinal: 6,
      blockerId: "integrated_candidate_solver_runtime_and_preseal_unbound",
      surface: "runtime_closure",
      unresolvedValue: null,
      evidence:
        "finite_primitives_do_not_bind_an_integrated_source_toolchain_executable_runtime_or_scientific_preseal",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      ordinal: 7,
      blockerId: "candidate_execution_and_independent_replay_absent",
      surface: "execution_replay",
      unresolvedValue: null,
      evidence:
        "no_candidate_command_receipt_raw_branch_output_server_replay_or_independent_agreement_exists",
      disposition: "block_candidate_acceptance",
    }),
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_AUTHORITY_LOCKS =
  Object.freeze({
    sourceHashPresenceAuthority: false as const,
    sourcePrimitiveCompletenessAuthority: false as const,
    candidateGridAuthority: false as const,
    crossGridConvergenceAuthority: false as const,
    initializerAuthority: false as const,
    solverAuthority: false as const,
    continuationAuthority: false as const,
    continuousVacuumConnectionAuthority: false as const,
    firstBranchAuthority: false as const,
    noFoldAuthority: false as const,
    boundaryProofAuthority: false as const,
    runtimeAuthority: false as const,
    scientificPresealAuthority: false as const,
    executionAuthority: false as const,
    executionObserved: false as const,
    branchAcceptanceAuthority: false as const,
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

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_VERSION,
  candidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANDIDATE_ID,
  authority:
    "additive_branch_execution_choice_boundary_only_without_execution_or_acceptance_authority",
  maturity:
    "diagnostic_finite_chronology_and_parameters_bound_with_candidate_selection_and_proof_surfaces_typed_blocked",
  frozenBeforeAnyTargetCandidateExecution: true,
  additiveBoundary: {
    mutatesUpstreamContractsOrSources: false,
    importsSourceCandidateAuthority: false,
    sourceV3AndTargetV2CandidateIdsMustRemainDistinct: true,
    declaredLeverOrTileTensorUsed: false,
    sourceHashPresenceCanSatisfyAnyNullChoice: false,
    finitePrimitiveSupportCanBeInferredAsCandidateSelection: false,
  },
  exactUpstreamBindings: {
    sourceCandidatePlan: {
      ...NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
    },
    branchBvp: { ...NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING },
    targetCandidateFreeze: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    },
    branchSolverLedger: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
    },
    initializerEvaluator: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING,
    },
    radialPrimaryNumerics: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
    },
  },
  liveSourceClosure: {
    upstreamContractFiles:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_UPSTREAM_SOURCE_PINS,
    branchSourceRoot:
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_ROOT,
    branchImplementationFiles:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BRANCH_SOURCE_PINS,
    exactUpstreamContractFileCount: 6,
    exactBranchImplementationFileCount: 11,
    exactSizeAndPlainSha256RehashAtImport: true,
    exactBranchProductionFileSetEqualityAtImport: true,
    hashesDescribeOnlyTheBoundBytes: true,
    hashesSelectCandidateGridOrThresholds: false,
    hashesEstablishExecutionReplayOrScientificAuthority: false,
  },
  candidateBoundary: {
    sourceCandidateId:
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING.candidateId,
    targetCandidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING.candidateId,
    targetGeometryId: FREEZE.candidateIdentity.geometryId,
    targetQuantumStateId: FREEZE.candidateIdentity.quantumStateId,
    targetChartId: FREEZE.candidateIdentity.chartId,
    targetNormalizationId: FREEZE.candidateIdentity.normalizationId,
    targetTolerancePolicyId: FREEZE.candidateIdentity.tolerancePolicyId,
    targetOriginAmplitude: BVP.boundaryConditions.originAmplitude,
    targetFrequencyRange: BVP.boundaryConditions.frequency,
    sourceAndTargetDistinct: true,
    sourceEvidenceRoleOnly: true,
    declaredLeverOrTileTensorRead: false,
    failedCandidateDisposition: "fail_this_v2_candidate_without_retuning",
  },
  candidateGridAndRefinement: {
    status: "blocked_underdetermined",
    implementedGridFamily: "MPFR256_compactified_Lobatto",
    compactification:
      RADIAL.finiteOperationGraph.compactificationAndSquareSystem
        .compactification,
    sourceSupportedNodeCountRange:
      RADIAL.radialLevelDisposition.sourceImplementedNodeCountRange,
    diagnosticOnlyNodeCounts:
      RADIAL.radialLevelDisposition.preselectedDiagnosticLevels,
    diagnosticOnlyNodeCountsAreCandidateSchedule: false,
    auditOnlyNodeCount: RADIAL.radialLevelDisposition.auditLevel,
    auditOnlyNodeCountSelectedForCandidate: false,
    exactCandidateNodeSchedule: null,
    exactRefinementChronology: null,
    crossLevelProjectionOrInterpolation: null,
    candidateGridSelectionRule: null,
    sourceHashPresenceMayFillNullFields: false,
    sourceSupportMayBeInferredAsCandidateSchedule: false,
    blockerId: "candidate_grid_and_refinement_schedule_underdetermined",
  },
  finiteAmplitudeContinuation: {
    status: "finite_chronology_exactly_bound_but_not_branch_proof",
    parameter: "varphi_at_origin",
    schedule: RADIAL.finiteOperationGraph.finiteAmplitudeContinuation.schedule,
    scheduleDyadics:
      RADIAL.finiteOperationGraph.finiteAmplitudeContinuation.scheduleDyadics,
    chronology:
      "validate_frozen_schedule_and_caller_shape_then_for_each_amplitude_ascending:one_newton_attempt_then_record_diagnostics_then_accept_or_stop",
    lowestStagePredictor:
      RADIAL.finiteOperationGraph.finiteAmplitudeContinuation
        .lowestStagePredictor,
    laterStagePredictor:
      RADIAL.finiteOperationGraph.finiteAmplitudeContinuation
        .laterStagePredictor,
    interpolationPredictorAllowed: false,
    extrapolationPredictorAllowed: false,
    newtonAttemptsPerStage: 1,
    firstFailureDisposition:
      "record_failed_stage_then_stop_before_any_retry_or_later_stage",
    retryAllowed: false,
    retuneAllowed: false,
    alternateGridAllowed: false,
    alternateInitializerAllowed: false,
    discreteStagesProveContinuousVacuumConnection: false,
    continuousVacuumConnectionEstablished: false,
  },
  deterministicNewton: {
    status: "finite_operation_graph_exactly_bound_not_candidate_execution",
    unknownColumnOrder:
      RADIAL.finiteOperationGraph.compactificationAndSquareSystem
        .unknownColumnOrder,
    residualRowOrder:
      RADIAL.finiteOperationGraph.compactificationAndSquareSystem
        .residualRowOrder,
    updateEquation: "J_times_direction_equals_negative_residual",
    maximumAcceptedUpdates:
      RADIAL.finiteOperationGraph.newtonArmijo.maximumAcceptedUpdates,
    maximumBacktrackExponent:
      RADIAL.finiteOperationGraph.newtonArmijo.maximumBacktrackExponent,
    alphaSchedule: RADIAL.finiteOperationGraph.newtonArmijo.alphaSchedule,
    armijoC: RADIAL.finiteOperationGraph.newtonArmijo.armijoC,
    merit: RADIAL.finiteOperationGraph.newtonArmijo.merit,
    armijoGate: RADIAL.finiteOperationGraph.newtonArmijo.armijoGate,
    stationaryGate: RADIAL.finiteOperationGraph.newtonArmijo.stationaryGate,
    residualLinfThreshold:
      RADIAL.finiteOperationGraph.newtonArmijo.residualLinfThreshold,
    scaledStepLinfThreshold:
      RADIAL.finiteOperationGraph.newtonArmijo.scaledStepLinfThreshold,
    scaledAcceptedStep:
      RADIAL.finiteOperationGraph.newtonArmijo.scaledAcceptedStep,
    consecutiveAcceptedFullGateCount:
      RADIAL.finiteOperationGraph.newtonArmijo.consecutiveAcceptedFullGateCount,
    linearFailure: RADIAL.finiteOperationGraph.newtonArmijo.linearFailure,
    lineSearchFailure:
      RADIAL.finiteOperationGraph.newtonArmijo.lineSearchFailure,
    updateLimitFailure:
      RADIAL.finiteOperationGraph.newtonArmijo.updateLimitFailure,
    oneWrapperAttemptOnly: true,
    retryAllowed: false,
    retuneAllowed: false,
  },
  deterministicDenseLu: {
    status: "finite_operation_graph_exactly_bound_not_candidate_execution",
    arithmetic: RADIAL.finiteOperationGraph.denseLu.arithmetic,
    maximumSystemOrder: RADIAL.finiteOperationGraph.denseLu.maximumSystemOrder,
    matrixLayout: RADIAL.finiteOperationGraph.denseLu.matrixLayout,
    algorithm: RADIAL.finiteOperationGraph.denseLu.algorithm,
    pivotSelection: RADIAL.finiteOperationGraph.denseLu.pivotSelection,
    zeroPivotRule: RADIAL.finiteOperationGraph.denseLu.zeroPivotRule,
    permutationChronology:
      RADIAL.finiteOperationGraph.denseLu.permutationChronology,
    factorReuse: RADIAL.finiteOperationGraph.denseLu.factorReuse,
    exactRefinementPassCount:
      RADIAL.finiteOperationGraph.denseLu.exactRefinementPassCount,
    residualRecompute: RADIAL.finiteOperationGraph.denseLu.residualRecompute,
    blasUsed: false,
    fmaRequested: false,
    equilibrationUsed: false,
    alternatePivotRetryAllowed: false,
  },
  crossGridConvergence: {
    status: "blocked_underdetermined",
    availableDiagnosticNodeCounts:
      RADIAL.radialLevelDisposition.preselectedDiagnosticLevels,
    availableAuditNodeCount: RADIAL.radialLevelDisposition.auditLevel,
    thoseLevelsAreCandidateRefinementSchedule: false,
    exactCandidateLevels: null,
    projectionOrInterpolationGraph: null,
    comparedStateOrObservableOrder: null,
    norm: null,
    absoluteTolerance: null,
    relativeTolerance: null,
    requiredConsecutiveLevelPairs: null,
    failureRule: null,
    receipt: null,
    established: false,
    sourceHashPresenceMayFillNullFields: false,
    blockerId: "cross_grid_convergence_criterion_underdetermined",
  },
  branchAndNoFoldDiagnostics: {
    status: "finite_stage_diagnostics_bound_without_topology_authority",
    recordedStageDiagnostics:
      RADIAL.finiteOperationGraph.finiteAmplitudeContinuation
        .recordedDiagnostics,
    strictTargetProfileRequirement:
      BVP.branchSelectionGates.strictRadialMonotonicity.expression,
    fieldSignAndNodeRequirement: BVP.branchSelectionGates.fieldSignAndNodes,
    requiredFirstBranchDefinition:
      BVP.branchSelectionGates.firstVacuumConnectedBranch.definition,
    nodalNonnegativeDiagnostic:
      "all_varphi_nodes_greater_than_or_equal_to_zero",
    finiteNodeStrictPositivityDiagnostic:
      "all_varphi_nodes_except_the_infinity_endpoint_strictly_positive",
    nodalNonincreasingDiagnostic:
      "varphi_node_i_greater_than_or_equal_to_varphi_node_i_plus_1",
    frequencyProgressionRecorded: true,
    unusedConstraintLinfProgressionRecorded: true,
    continuousVacuumConnectionIntervalProof: null,
    continuationTangentDefinition: null,
    tangentOrientationAndSignRule: null,
    foldObservable: null,
    foldThreshold: null,
    foldProofReceipt: null,
    nodalDiagnosticsEstablishStrictContinuumMonotonicity: false,
    finiteScheduleEstablishesFirstVacuumConnectedBranch: false,
    frequencyProgressionEstablishesNoFold: false,
    continuousVacuumConnectionEstablished: false,
    firstBranchEstablished: false,
    noFoldEstablished: false,
    sourceHashPresenceMayFillNullFields: false,
  },
  finiteBoundaryEvidence: {
    originSeriesImplementedThrough: "x^4",
    originAllOrderRecurrenceImplemented: false,
    originRemainderBoundImplemented: false,
    tailMetricImplementedThrough: "x^-2",
    tailScalarImplementedThrough: "leading_exponential_and_power_exponent_only",
    finiteTailRepresentativeImplemented: false,
    tailAllOrderRecurrenceImplemented: false,
    tailRemainderBoundImplemented: false,
    originProofReceipt: null,
    tailProofReceipt: null,
  },
  initializerBoundary: {
    evaluatorPolicyBound: true,
    exactPayloadCount: INITIALIZER.inputAbi.orderedPayloads.length,
    exactTotalPayloadSizeBytes: INITIALIZER.inputAbi.exactTotalSizeBytes,
    supplementalJoinPayloadInstance:
      INITIALIZER.instances.supplementalJoinPayload,
    supplementalJoinBarrierTraceReceipt:
      INITIALIZER.instances.supplementalJoinBarrierTraceReceipt,
    selectedGrid: INITIALIZER.instances.selectedGrid,
    initializerBinding: INITIALIZER.instances.initializerBinding,
    initializerOutput: INITIALIZER.instances.initializerOutput,
    evaluatorPolicyPresenceEstablishesInitializerInstance: false,
    initializerInstancePresent: false,
  },
  failureAndAttemptPolicy: {
    preflightFailurePrecedence: RADIAL.firstFailurePrecedence,
    maximumCandidateAttempts: SOLVER.attemptPolicy.maximumCandidateAttempts,
    retryAllowed: false,
    retuneAllowed: false,
    alternateInitializerOrBranchFallbackAllowed: false,
    alternateGridContinuationNewtonLinearSolvePrecisionOrToleranceAllowed: false,
    observationMaySelectOrChangeAnyNumericalChoice: false,
    failedStageStopsBeforeLaterStage: true,
    firstFailedGateStopsWithoutFallback: true,
    failureDisposition:
      "fail_the_frozen_v2_candidate_without_retuning_retry_or_branch_switch",
  },
  unresolvedExecutionSurface: {
    candidateGridSchedule: null,
    candidateRefinementChronology: null,
    crossGridConvergenceCriterion: null,
    continuousVacuumConnectionIntervalProof: null,
    noFoldTangentObservableOrientationAndThreshold: null,
    originAllOrderRemainderProof: null,
    tailFiniteRepresentativeAndRemainderProof: null,
    initializerInstance: null,
    integratedImplementationBinding: null,
    toolchainBinding: null,
    executableBinding: null,
    runtimeBinding: null,
    scientificPreseal: null,
    executionCommand: null,
    executionReceipt: null,
    serverReplayReceipt: null,
    independentReplayReceipt: null,
  },
  completionBoundary: {
    exactUpstreamCanonicalBindingsPresent: true,
    exactLiveSourcePinsPresent: true,
    finiteContinuationChronologyBound: true,
    finiteNewtonParametersBound: true,
    finiteDenseLuParametersBound: true,
    candidateGridScheduleFrozen: false,
    candidateRefinementChronologyFrozen: false,
    crossGridConvergencePolicyComplete: false,
    continuousVacuumConnectionProofPresent: false,
    noFoldProofPresent: false,
    boundaryProofsPresent: false,
    initializerInstancePresent: false,
    integratedImplementationPresent: false,
    runtimeClosurePresent: false,
    scientificPresealPresent: false,
    executionAuthorized: false,
    executionObserved: false,
    serverReplayComplete: false,
    independentAgreementComplete: false,
    branchAccepted: false,
    lampsPromoted: false,
  },
  blockers: NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BLOCKERS,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (
    value === null ||
    typeof value !== "object" ||
    seen.has(value as object)
  ) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1 =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2BranchExecutionPolicyV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1;

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1);
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-branch-execution-policy/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_EXPECTED_SHA256:
  string | null =
  "55238947c0a21f71ff3b0b28d095733376527479214806790990aea4317b7cf8";
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES:
  number | null = 21_266;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_LITERAL_SEAL_STATUS =
  "sealed_before_any_candidate_execution_with_typed_blockers_active" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

type SourcePin = Readonly<{
  ordinal: number;
  role: string;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
}>;

const assertLiveSourcePins = (
  pins: readonly SourcePin[],
  label: string,
): void => {
  pins.forEach((pin, index) => {
    if (pin.ordinal !== index) {
      throw new Error(`${label}_source_ordinal_mismatch:${index}`);
    }
    const bytes = readFileSync(pin.relativePath);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (bytes.byteLength !== pin.sizeBytes || sha256 !== pin.sha256) {
      throw new Error(
        `${label}_source_pin_mismatch:${index}:${sha256}/${bytes.byteLength}`,
      );
    }
  });
};

const assertInvariants = (): void => {
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_UPSTREAM_BINDING_PINS;
  const bindings = [
    [
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
      pins.sourceCandidatePlan,
    ],
    [NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING, pins.branchBvp],
    [
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
      pins.targetCandidateFreeze,
    ],
    [
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
      pins.branchSolverLedger,
    ],
    [
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING,
      pins.initializerEvaluator,
    ],
    [
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
      pins.radialPrimaryNumerics,
    ],
  ] as const;
  if (
    bindings.some(
      ([binding, pin]) =>
        binding.sha256 !== pin.sha256 ||
        binding.canonicalSizeBytes !== pin.canonicalSizeBytes,
    )
  ) {
    throw new Error("spherical_v2_branch_execution_upstream_binding_drift");
  }
  assertLiveSourcePins(
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_UPSTREAM_SOURCE_PINS,
    "spherical_v2_branch_execution_upstream_contract",
  );
  assertLiveSourcePins(
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BRANCH_SOURCE_PINS,
    "spherical_v2_branch_execution_implementation",
  );
  const observedProductionNames = readdirSync(
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_ROOT,
    { withFileTypes: true },
  )
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".py") &&
        !entry.name.startsWith("test_"),
    )
    .map((entry) => entry.name)
    .sort();
  const pinnedProductionNames =
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BRANCH_SOURCE_PINS.map(
      (pin) => pin.relativePath.split("/").at(-1)!,
    ).sort();
  if (
    canonicalJson(observedProductionNames) !==
      canonicalJson(pinnedProductionNames) ||
    canonicalJson(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BRANCH_SOURCE_PINS,
    ) !==
      canonicalJson(
        NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS,
      )
  ) {
    throw new Error("spherical_v2_branch_execution_source_set_drift");
  }
  if (
    CONTRACT.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING.candidateId ||
    String(CONTRACT.candidateBoundary.sourceCandidateId) ===
      String(CONTRACT.candidateBoundary.targetCandidateId) ||
    CONTRACT.additiveBoundary.declaredLeverOrTileTensorUsed !== false ||
    CONTRACT.candidateBoundary.declaredLeverOrTileTensorRead !== false ||
    CONTRACT.candidateGridAndRefinement.diagnosticOnlyNodeCounts.join(",") !==
      "64,96,128" ||
    CONTRACT.candidateGridAndRefinement.auditOnlyNodeCount !== 256 ||
    CONTRACT.candidateGridAndRefinement
      .diagnosticOnlyNodeCountsAreCandidateSchedule !== false ||
    CONTRACT.candidateGridAndRefinement
      .sourceSupportMayBeInferredAsCandidateSchedule !== false ||
    CONTRACT.candidateGridAndRefinement.exactCandidateNodeSchedule !== null ||
    CONTRACT.candidateGridAndRefinement.exactRefinementChronology !== null ||
    CONTRACT.crossGridConvergence.exactCandidateLevels !== null ||
    CONTRACT.crossGridConvergence.norm !== null ||
    CONTRACT.crossGridConvergence.absoluteTolerance !== null ||
    CONTRACT.crossGridConvergence.relativeTolerance !== null ||
    CONTRACT.crossGridConvergence.established !== false ||
    CONTRACT.branchAndNoFoldDiagnostics
      .continuousVacuumConnectionIntervalProof !== null ||
    CONTRACT.branchAndNoFoldDiagnostics.tangentOrientationAndSignRule !==
      null ||
    CONTRACT.branchAndNoFoldDiagnostics.foldObservable !== null ||
    CONTRACT.branchAndNoFoldDiagnostics.foldThreshold !== null ||
    CONTRACT.branchAndNoFoldDiagnostics.noFoldEstablished !== false
  ) {
    throw new Error(
      "spherical_v2_branch_execution_underdetermined_surface_drift",
    );
  }
  if (
    CONTRACT.finiteAmplitudeContinuation.schedule.join(",") !==
      [
        2 ** -16,
        2 ** -15,
        2 ** -14,
        2 ** -13,
        2 ** -12,
        2 ** -11,
        2 ** -10,
      ].join(",") ||
    CONTRACT.deterministicNewton.maximumAcceptedUpdates !== 48 ||
    CONTRACT.deterministicNewton.maximumBacktrackExponent !== 24 ||
    CONTRACT.deterministicNewton.armijoC !== 2 ** -12 ||
    CONTRACT.deterministicNewton.residualLinfThreshold !== 2 ** -40 ||
    CONTRACT.deterministicNewton.scaledStepLinfThreshold !== 2 ** -42 ||
    CONTRACT.deterministicNewton.consecutiveAcceptedFullGateCount !== 2 ||
    CONTRACT.deterministicDenseLu.maximumSystemOrder !== 1537 ||
    CONTRACT.deterministicDenseLu.exactRefinementPassCount !== 3 ||
    CONTRACT.failureAndAttemptPolicy.maximumCandidateAttempts !== 1 ||
    canonicalJson(
      CONTRACT.failureAndAttemptPolicy.preflightFailurePrecedence,
    ) !== canonicalJson(RADIAL.firstFailurePrecedence)
  ) {
    throw new Error("spherical_v2_branch_execution_finite_choice_drift");
  }
  if (
    Object.values(CONTRACT.unresolvedExecutionSurface).some(
      (value) => value !== null,
    ) ||
    Object.values(CONTRACT.authorityLocks).some((value) => value !== false) ||
    CONTRACT.blockers.length !== 8 ||
    CONTRACT.blockers.some(
      (blocker, index) =>
        blocker.ordinal !== index || blocker.unresolvedValue !== null,
    ) ||
    CONTRACT.completionBoundary.executionAuthorized !== false ||
    CONTRACT.completionBoundary.executionObserved !== false ||
    CONTRACT.completionBoundary.serverReplayComplete !== false ||
    CONTRACT.completionBoundary.independentAgreementComplete !== false ||
    CONTRACT.completionBoundary.lampsPromoted !== false
  ) {
    throw new Error("spherical_v2_branch_execution_authority_drift");
  }
};

assertInvariants();

if (
  (NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_EXPECTED_SHA256 ===
    null) !==
  (NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES ===
    null)
) {
  throw new Error("spherical_v2_branch_execution_partial_literal_self_seal");
}
if (
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_EXPECTED_SHA256 !==
    null &&
  (NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_EXPECTED_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES)
) {
  throw new Error(
    `spherical_v2_branch_execution_literal_self_seal_mismatch:${NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_SIZE_BYTES}`,
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
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth) {
    return { ok: false, violation: `snapshot_depth_limit:${pointer || "/"}` };
  }
  budget.nodes += 1;
  if (budget.nodes > limits.maximumNodes) {
    return { ok: false, violation: `snapshot_node_limit:${pointer || "/"}` };
  }
  if (value === null || typeof value === "boolean") return { ok: true, value };
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? { ok: true, value }
      : { ok: false, violation: `invalid_number:${pointer || "/"}` };
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
      return { ok: false, violation: `invalid_string:${pointer || "/"}` };
    }
    return { ok: true, value };
  }
  if (typeof value !== "object") {
    return { ok: false, violation: `non_json_value:${pointer || "/"}` };
  }
  if (isProxy(value)) {
    return { ok: false, violation: `proxy_forbidden:${pointer || "/"}` };
  }
  if (ancestors.has(value)) {
    return { ok: false, violation: `cycle_forbidden:${pointer || "/"}` };
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
      return { ok: false, violation: `array_surface:${pointer || "/"}` };
    }
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor === undefined ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return { ok: false, violation: `array_entry:${pointer}/${index}` };
      }
      const child = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
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
    return { ok: false, violation: `non_plain_object:${pointer || "/"}` };
  }
  const keys = Reflect.ownKeys(value);
  if (
    keys.length > limits.maximumObjectPropertyCount ||
    keys.some((key) => typeof key !== "string")
  ) {
    return { ok: false, violation: `object_surface:${pointer || "/"}` };
  }
  const output: Record<string, unknown> = {};
  for (const key of keys as string[]) {
    if (
      FORBIDDEN_KEYS.has(key) ||
      Buffer.byteLength(key, "utf8") > limits.maximumPropertyKeyUtf8Bytes
    ) {
      return { ok: false, violation: `object_key:${pointer}/${key}` };
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      return { ok: false, violation: `object_entry:${pointer}/${key}` };
    }
    const child = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
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

export const cloneNhm2SphericalBosonStarV2BranchExecutionPolicyV1 = () =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_JSON,
  ) as Nhm2SphericalBosonStarV2BranchExecutionPolicyV1;

export const nhm2SphericalBosonStarV2BranchExecutionPolicyV1Violations = (
  value: unknown,
): string[] => {
  try {
    const snapshot = snapshotPlainData(value);
    if (!snapshot.ok) return [snapshot.violation];
    return canonicalJson(snapshot.value) ===
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_JSON
      ? []
      : ["spherical_v2_branch_execution_policy_semantic_drift"];
  } catch {
    return ["spherical_v2_branch_execution_policy_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2BranchExecutionPolicyV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2BranchExecutionPolicyV1 =>
  nhm2SphericalBosonStarV2BranchExecutionPolicyV1Violations(value).length === 0;
