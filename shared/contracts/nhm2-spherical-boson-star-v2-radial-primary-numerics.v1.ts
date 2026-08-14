import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { isProxy } from "node:util/types";

import { NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING } from "./nhm2-spherical-boson-star-branch-bvp.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING } from "./nhm2-spherical-boson-star-v2-branch-solver-policy.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING } from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING } from "./nhm2-spherical-boson-star-v2-initializer-evaluator.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING } from "./nhm2-spherical-boson-star-v2-si-output-normalization.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2.radial_primary_numerics" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_VERSION =
  "nhm2_spherical_boson_star_v2_radial_primary_numerics/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANDIDATE_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 24,
    maximumNodes: 4096,
    maximumArrayLength: 128,
    maximumObjectPropertyCount: 128,
    maximumPropertyKeyUtf8Bytes: 1024,
    maximumStringUtf8Bytes: 16384,
    maximumAggregateUtf8Bytes: 131072,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_UPSTREAM_BINDING_PINS =
  Object.freeze({
    candidateFreeze: Object.freeze({
      sha256:
        "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
      canonicalSizeBytes: 55997,
      status: "exact_bound",
    }),
    branchBvp: Object.freeze({
      sha256:
        "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
      canonicalSizeBytes: 13847,
      status: "exact_bound",
    }),
    branchSolverLedger: Object.freeze({
      sha256:
        "b7d2cb2d7dcf39531000bbfcdfadb44f5e9c38d3ab1950982515245336a77cb0",
      canonicalSizeBytes: 18993,
      status: "exact_bound",
    }),
    initializerEvaluator: Object.freeze({
      sha256:
        "2253cea43e7b0abc99aaebd19ced18994eba4605b65fe674febb03d9945cdbc5",
      canonicalSizeBytes: 24711,
      status: "exact_bound",
    }),
    siOutputNormalization: Object.freeze({
      sha256:
        "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24",
      canonicalSizeBytes: 23822,
      status: "exact_bound",
    }),
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_ROOT =
  "tools/nhm2-spherical-boson-star-branch" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS =
  Object.freeze([
    Object.freeze({
      ordinal: 0,
      role: "binary64_environment_boundary",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/binary64_environment.py",
      sha256:
        "ec973351fa34efd1c76b3358e6b87da91688a06a648e5299d0aa800767e11a47",
      sizeBytes: 12642,
    }),
    Object.freeze({
      ordinal: 1,
      role: "pointwise_radial_residual",
      relativePath: "tools/nhm2-spherical-boson-star-branch/radial_residual.py",
      sha256:
        "c22249155373344069772bfe2b4807385de6d7edc4454242d855b6f8611cd205",
      sizeBytes: 10222,
    }),
    Object.freeze({
      ordinal: 2,
      role: "analytic_local_residual_jacobian",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_residual_jacobian.py",
      sha256:
        "5464f2010e051cf2487fbdd9f6879b355d7e7ede47e6bd3ea245916781a1119e",
      sizeBytes: 5583,
    }),
    Object.freeze({
      ordinal: 3,
      role: "interior_collocation_assembly",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_collocation_interior.py",
      sha256:
        "253aee132897b6b11fa57df1b0864d9a821cc6dbce8b870dba3ab0e4f610290a",
      sizeBytes: 8898,
    }),
    Object.freeze({
      ordinal: 4,
      role: "finite_origin_series_x4",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_origin_series.py",
      sha256:
        "ea76613c9cb5d3ad882d96786f98f85ee170f67e486672d97bc3add444a0d25d",
      sizeBytes: 4738,
    }),
    Object.freeze({
      ordinal: 5,
      role: "leading_tail_asymptotics",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_tail_asymptotics.py",
      sha256:
        "b635e5d6f24d05f0c88b29dfa99a156c34968990f4948048a78bd98f2690b1b9",
      sizeBytes: 3554,
    }),
    Object.freeze({
      ordinal: 6,
      role: "mpfr256_compactified_lobatto_grid",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_lobatto_grid.py",
      sha256:
        "ea424885abed4788d989cd228b7c4dd7b8907909bd4a0931b2e009d021d4d385",
      sizeBytes: 6704,
    }),
    Object.freeze({
      ordinal: 7,
      role: "compactified_square_bvp_assembly",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_compactified_system.py",
      sha256:
        "dafe134453b5a2a328fbe9088b4e85593e9ea4ee231923fec4024d2f67ebb905",
      sizeBytes: 15202,
    }),
    Object.freeze({
      ordinal: 8,
      role: "deterministic_dense_lu",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/deterministic_dense_lu.py",
      sha256:
        "70b63cdf3517d0ae5f81217ca31d6d1d2a7450b76569e7693c3b8e9e59572ce2",
      sizeBytes: 8033,
    }),
    Object.freeze({
      ordinal: 9,
      role: "deterministic_newton_armijo",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/deterministic_newton.py",
      sha256:
        "60ad54e4376e43aa8c496e38fa9a495cab4d0a5001ca2515692a684889516618",
      sizeBytes: 13891,
    }),
    Object.freeze({
      ordinal: 10,
      role: "finite_amplitude_continuation",
      relativePath:
        "tools/nhm2-spherical-boson-star-branch/radial_continuation.py",
      sha256:
        "f244aa09926860ffc16099748f36928ed81cc1802abfa97bb63787d330398760",
      sizeBytes: 12316,
    }),
  ] as const);

const INITIALIZER_PIN =
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_UPSTREAM_BINDING_PINS.initializerEvaluator;

const IMPLEMENTED_DIAGNOSTIC_LEVELS = Object.freeze([64, 96, 128] as const);
const AMPLITUDE_SCHEDULE = Object.freeze([
  2 ** -16,
  2 ** -15,
  2 ** -14,
  2 ** -13,
  2 ** -12,
  2 ** -11,
  2 ** -10,
] as const);

const BLOCKERS = Object.freeze([
  Object.freeze({
    code: "initializer_instance_and_supplemental_instance_source_absent",
    category: "initializer_instance",
    status: "blocked",
  }),
  Object.freeze({
    code: "candidate_node_schedule_blocked_by_upstream_grid_policy",
    category: "candidate_grid",
    status: "blocked",
  }),
  Object.freeze({
    code: "cross_grid_convergence_criterion_and_receipt_absent",
    category: "convergence_evidence",
    status: "blocked",
  }),
  Object.freeze({
    code: "continuous_vacuum_connection_interval_proof_absent",
    category: "branch_topology",
    status: "blocked",
  }),
  Object.freeze({
    code: "no_fold_tangent_orientation_and_proof_absent",
    category: "branch_topology",
    status: "blocked",
  }),
  Object.freeze({
    code: "origin_series_all_order_remainder_proof_absent",
    category: "boundary_proof",
    status: "blocked",
  }),
  Object.freeze({
    code: "tail_finite_representative_and_remainder_proof_absent",
    category: "boundary_proof",
    status: "blocked",
  }),
  Object.freeze({
    code: "overall_candidate_solver_integration_implementation_absent",
    category: "implementation",
    status: "blocked",
  }),
  Object.freeze({
    code: "approved_toolchain_executable_and_runtime_binding_absent",
    category: "runtime_closure",
    status: "blocked",
  }),
  Object.freeze({
    code: "preexecution_preseal_absent",
    category: "preseal",
    status: "blocked",
  }),
  Object.freeze({
    code: "candidate_execution_receipt_and_independent_replay_absent",
    category: "execution",
    status: "blocked",
  }),
] as const);

const UNRESOLVED = Object.freeze({
  initializerInstanceBinding: null,
  supplementalInitializerInstanceSourceBinding: null,
  candidateNodeSchedule: null,
  crossGridConvergenceCriterion: null,
  crossGridConvergenceReceipt: null,
  continuousVacuumConnectionIntervalProof: null,
  noFoldTangentOrientationProof: null,
  originAllOrderRemainderProof: null,
  tailFiniteRepresentativeAndRemainderProof: null,
  overallCandidateSolverImplementationBinding: null,
  approvedToolchainBinding: null,
  executableBinding: null,
  runtimeBinding: null,
  preexecutionPreseal: null,
  executionCommand: null,
  executionReceipt: null,
  independentReplayReceipt: null,
} as const);

const AUTHORITY_LOCKS = Object.freeze({
  sourceOperationGraphCompletenessGrantsSolverAuthority: false,
  overallSolverAuthority: false,
  candidateGridSelected: false,
  crossGridConvergenceEstablished: false,
  continuousVacuumConnectionEstablished: false,
  noFoldEstablished: false,
  firstBranchEstablished: false,
  initializerAccepted: false,
  candidateExecutionAuthorized: false,
  candidateExecutionObserved: false,
  replayAuthority: false,
  diagnosticPass: false,
  semiclassicalStressNoiseLamp: false,
  semiclassicalConstraintAlgebraLamp: false,
  physicalViability: false,
  propulsion: false,
  transport: false,
} as const);

const POLICY = {
  schemaVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_VERSION,
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_ARTIFACT_ID,
  candidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANDIDATE_ID,
  maturity:
    "diagnostic_finite_primitive_source_operation_graph_not_candidate_solver_closure",
  exactUpstreamBindings:
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_UPSTREAM_BINDING_PINS,
  productionSourceClosure: {
    sourceRoot:
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_ROOT,
    ordering: "ordinal_ascending_exactly_once",
    exactFileCount: 11,
    files: NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS,
    importTimeExactSizeAndSha256RehashRequired: true,
    importTimeProductionFileSetEqualityRequired: true,
    completeForImplementedFinitePrimitives: true,
    completenessScope:
      "only_the_literal_bound_finite_operation_graphs_in_the_eleven_python_sources",
    doesNotCloseOverallCandidateSolverImplementationRuntimePresealExecutionOrAuthority: true,
  },
  finiteOperationGraph: {
    binary64Environment: {
      sourceTarget: "linux_x86_64_glibc_full_fenv",
      admission:
        "sys.platform_linux_and_machine_x86_64_or_amd64_and_64_bit_pointer_and_glibc_symbols_present",
      unsupportedPlatformLibcOrArchitectureDisposition: "fail_closed_at_import",
      glibcDefaultEnvironment: "fesetenv(FE_DFL_ENV)",
      roundingMode: "round_to_nearest_ties_to_even",
      x87ControlMaskHex: "0x0f3f",
      x87RequiredControlHex: "0x033f",
      x87ExceptionStatusMaskHex: "0x003f",
      mxcsrControlMaskHex: "0xffc0",
      mxcsrRequiredControlHex: "0x1f80",
      mxcsrExceptionStatusMaskHex: "0x003f",
      exceptionMasksRequired: "all_x87_and_mxcsr_exceptions_masked",
      ftzRequired: false,
      dazRequired: false,
      setupExceptionStatusRequiredClear: true,
      callerArithmeticEnvironmentExactRestoreRequired: true,
      windowsControlPathImplementedButNotFrozenSourceTarget: true,
      observedGlibcVersionRecordedButRuntimeVersionNotBound: true,
    },
    pointwiseResidualAndJacobian: {
      solvedResidualOrder: [
        "einstein_Et_t",
        "einstein_Etheta_theta",
        "klein_gordon",
      ],
      unusedConstraintOrder: ["einstein_Ex_x"],
      localVariableOrder: [
        "F0",
        "F0_prime",
        "F0_double_prime",
        "F1",
        "F1_prime",
        "F1_double_prime",
        "varphi",
        "varphi_prime",
        "varphi_double_prime",
        "w",
      ],
      analyticLocalJacobianImplemented: true,
      normalizedDiagnosticsImplemented: true,
      unusedConstraintIsNotASolvedRow: true,
    },
    finiteBoundaryKernels: {
      originSeriesOrder: "even_series_through_x^4",
      originAllOrderRecurrenceImplemented: false,
      originRemainderBoundImplemented: false,
      tailMetricSector: "vacuum_1_over_x_through_1_over_x_squared",
      tailScalarSector: "leading_exponential_and_power_exponent",
      finiteTailRepresentativeImplemented: false,
      tailAllOrderRecurrenceImplemented: false,
      tailRemainderBoundImplemented: false,
    },
    lobattoGrid: {
      nodeCountDomain: "exact_integer_3_through_512",
      endpoints: "binary64_positive_zero_and_one",
      interiorNodeFormula:
        "rho_i=get_d_RNDN((1-cos_RNDN(pi*i/(N-1)))/2)_under_exact_MPFR256_context",
      mpfrPrecisionBits: 256,
      mpfrRounding: "RoundToNearest",
      mpfrEmin: -1073741823,
      mpfrEmax: 1073741823,
      subnormalize: false,
      trapsAndFlagsInitiallyClear: true,
      allowComplex: false,
      rationalDivision: false,
      allowReleaseGil: false,
      ambientContextIgnoredAndRestored: true,
      barycentricWeights: "w_i=(-1)^i_times_one_half_at_endpoints_else_one",
      firstDerivativeOffDiagonal:
        "D_ij=w_j/(w_i*(rho_i-rho_j))_binary64_left_to_right",
      firstDerivativeDiagonal: "D_ii=-fsum_j_not_i(D_ij)",
      secondDerivative: "D2_ij=fsum_k(D_ik*D_kj)",
    },
    compactificationAndSquareSystem: {
      compactification: "rho=x/(1+x);x=rho/(1-rho)",
      firstDerivativeChainRule: "d_dx=(1-rho)^2*d_drho",
      secondDerivativeChainRule: "d2_dx2=(1-rho)^4*d2_drho2-2*(1-rho)^3*d_drho",
      nodeCountSymbol: "N",
      unknownCount: "3*N+1",
      residualCount: "3*N+1",
      interiorPdeRowCount: "3*(N-2)",
      boundaryRowCount: 7,
      residualRowOrder:
        "F0_origin_dx_then_Et_t_interior_ascending_rho_then_F0_infinity;F1_origin_dx_then_Etheta_theta_interior_ascending_rho_then_F1_infinity;varphi_origin_dx_then_KG_interior_ascending_rho_then_varphi_infinity;varphi_origin_minus_origin_amplitude",
      unknownColumnOrder:
        "F0_nodes_ascending_rho_then_F1_nodes_ascending_rho_then_varphi_nodes_ascending_rho_then_w",
      endpointRows:
        "each_field_origin_first_rho_derivative_zero_and_each_field_infinity_value_zero",
      amplitudeRow: "varphi_node_0-origin_amplitude",
      targetDefaultOriginAmplitude: 2 ** -10,
      targetDefaultOriginAmplitudeDyadic: "2^-10",
      unusedConstraintRows: "einstein_Ex_x_at_each_interior_node",
      globalAnalyticJacobianImplemented: true,
    },
    denseLu: {
      arithmetic: "scalar_binary64_under_shared_environment_boundary",
      maximumSystemOrder: 1537,
      matrixLayout: "exact_tuple_rows",
      algorithm: "dense_partial_pivot_LU_factor_once",
      pivotSelection:
        "maximum_absolute_value_in_rows_step_through_end_with_exact_ties_retaining_lowest_row_ordinal",
      zeroPivotRule: "exact_zero_or_nonfinite_fails_without_threshold_retry",
      permutationChronology:
        "swap_LU_rows_and_permutation_entries_at_each_step_then_apply_final_permutation_to_rhs",
      factorReuse: "same_single_factor_for_initial_solve_and_all_refinements",
      exactRefinementPassCount: 3,
      residualRecompute:
        "row_ascending_math_fsum_of_coefficient_times_solution_then_rhs_minus_product",
      blasUsed: false,
      fmaRequested: false,
      equilibrationUsed: false,
      alternatePivotRetryAllowed: false,
    },
    newtonArmijo: {
      maximumAcceptedUpdates: 48,
      maximumBacktrackExponent: 24,
      alphaSchedule: "alpha=2^-exponent_for_exponent_0_through_24",
      armijoC: 2 ** -12,
      merit: "residual_l2_via_increasing_order_math_hypot",
      armijoGate: "trial_merit<=(1-armijoC*alpha)*current_merit",
      stationaryGate:
        "trial_equals_current_and_current_residual_linf<=2^-40_and_trial_scaled_step_linf<=2^-42",
      residualLinfThreshold: 2 ** -40,
      scaledStepLinfThreshold: 2 ** -42,
      scaledAcceptedStep: "max_i(abs(alpha*direction_i)/max(1,abs(trial_i)))",
      consecutiveAcceptedFullGateCount: 2,
      rhsNegation: "positive_zero_if_residual_is_zero_else_binary64_negation",
      linearFailure: "linear_solve_failed_without_retry",
      lineSearchFailure: "armijo_schedule_exhausted_without_retry",
      updateLimitFailure: "maximum_newton_updates_reached_without_retry",
      oneWrapperAttemptOnly: true,
      retryAllowed: false,
      retuneAllowed: false,
      alternateInitializerAllowed: false,
      alternateGridAllowed: false,
    },
    finiteAmplitudeContinuation: {
      schedule: AMPLITUDE_SCHEDULE,
      scheduleDyadics: [
        "2^-16",
        "2^-15",
        "2^-14",
        "2^-13",
        "2^-12",
        "2^-11",
        "2^-10",
      ],
      lowestStagePredictor: "lowest_stage_caller_initializer",
      laterStagePredictor: "previous_accepted_solution",
      interpolationPredictorAllowed: false,
      extrapolationPredictorAllowed: false,
      newtonAttemptsPerStage: 1,
      firstFailureDisposition:
        "record_failed_stage_then_stop_before_any_retry_or_later_stage",
      retryAllowed: false,
      retuneAllowed: false,
      alternateGridAllowed: false,
      alternateInitializerAllowed: false,
      recordedDiagnostics: [
        "stage_index",
        "origin_amplitude",
        "predictor_source",
        "accepted",
        "newton_failure_code",
        "newton_update_and_alpha_chronology",
        "residual_linf",
        "scaled_step_linf",
        "unused_constraint_linf",
        "w",
        "varphi_nodes_nonnegative",
        "varphi_finite_nodes_strictly_positive",
        "varphi_nodes_nonincreasing",
      ],
      discreteStagesDoNotProveContinuousVacuumConnection: true,
      nodalSignsAndOrderingDoNotProveNoFold: true,
      continuousVacuumConnectionEstablished: false,
      noFoldEstablished: false,
    },
  },
  radialLevelDisposition: {
    sourceImplementedNodeCountRange: [3, 512],
    preselectedDiagnosticLevels: IMPLEMENTED_DIAGNOSTIC_LEVELS,
    preselectedLevelsAreCandidateSchedule: false,
    auditLevel: 256,
    auditLevelSourceGraphImplemented: true,
    auditLevelCandidateAdmission:
      "only_after_upstream_candidate_grid_and_cross_grid_convergence_policy_are_exactly_closed",
    auditLevelSelectedForCandidate: false,
    exactCandidateNodeSchedule: null,
    exactCandidateNodeScheduleStatus:
      "blocked_because_upstream_branch_solver_grid_policy_node_count_and_refinement_are_null",
    crossGridConvergenceCriterion: null,
    crossGridConvergenceEstablished: false,
  },
  firstFailurePrecedence: [
    "upstream_binding_or_literal_self_seal_mismatch",
    "production_source_file_set_size_or_sha256_mismatch",
    "initializer_instance_or_supplemental_source_absent",
    "candidate_node_schedule_or_cross_grid_policy_absent",
    "overall_solver_implementation_toolchain_executable_or_runtime_absent",
    "preexecution_preseal_absent",
    "stage_zero_newton_failure",
    "first_later_stage_newton_failure_in_schedule_order",
    "cross_grid_convergence_not_established",
    "continuous_vacuum_connection_or_no_fold_proof_absent",
    "origin_or_tail_remainder_proof_absent",
    "candidate_execution_or_replay_not_observed",
  ],
  completionBoundary: {
    implementedFinitePrimitiveSourceOperationGraphComplete: true,
    exactElevenProductionSourcePinsComplete: true,
    exactUpstreamBindingsComplete: true,
    overallCandidateSolverClosureComplete: false,
    initializerInstancePresent: false,
    candidateNodeScheduleFrozen: false,
    crossGridConvergenceEstablished: false,
    continuousVacuumConnectionEstablished: false,
    noFoldEstablished: false,
    originRemainderProofPresent: false,
    tailRemainderProofPresent: false,
    overallCandidateSolverImplementationPresent: false,
    approvedToolchainExecutableRuntimeClosurePresent: false,
    preexecutionPresealPresent: false,
    executionAuthorized: false,
    executionObserved: false,
    branchAccepted: false,
  },
  blockers: BLOCKERS,
  unresolved: UNRESOLVED,
  authorityLocks: AUTHORITY_LOCKS,
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1 =
  deepFreeze(POLICY);

type ExactBinding = Readonly<{
  sha256: string;
  canonicalSizeBytes: number;
}>;

const exactUpstreamBindingMatches = (
  expected: Readonly<{
    sha256: string | null;
    canonicalSizeBytes: number | null;
  }>,
  observed: ExactBinding,
): boolean =>
  expected.sha256 !== null &&
  expected.canonicalSizeBytes !== null &&
  observed.sha256 === expected.sha256 &&
  observed.canonicalSizeBytes === expected.canonicalSizeBytes;

const assertLiveProductionSourcePins = (): void => {
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS;
  const observedNames = readdirSync(
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
  const pinnedNames = pins
    .map((entry) => entry.relativePath.split("/").at(-1) ?? "")
    .slice()
    .sort();
  if (
    observedNames.length !== pinnedNames.length ||
    observedNames.some((name, index) => name !== pinnedNames[index])
  ) {
    throw new Error(
      "nhm2_spherical_v2_radial_primary_numerics_production_source_set_mismatch",
    );
  }
  for (const [index, pin] of pins.entries()) {
    let bytes: Buffer;
    try {
      bytes = readFileSync(pin.relativePath);
    } catch {
      throw new Error(
        `nhm2_spherical_v2_radial_primary_numerics_source_read_failed:${index}:${pin.relativePath}`,
      );
    }
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (bytes.byteLength !== pin.sizeBytes || sha256 !== pin.sha256) {
      throw new Error(
        `nhm2_spherical_v2_radial_primary_numerics_source_pin_mismatch:${index}:${pin.relativePath}:${sha256}/${bytes.byteLength}`,
      );
    }
  }
};

const assertInvariants = (): void => {
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_UPSTREAM_BINDING_PINS;
  if (
    !exactUpstreamBindingMatches(
      pins.candidateFreeze,
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    ) ||
    !exactUpstreamBindingMatches(
      pins.branchBvp,
      NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING,
    ) ||
    !exactUpstreamBindingMatches(
      pins.branchSolverLedger,
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
    ) ||
    !exactUpstreamBindingMatches(
      INITIALIZER_PIN,
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING,
    ) ||
    !exactUpstreamBindingMatches(
      pins.siOutputNormalization,
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    )
  ) {
    throw new Error(
      "nhm2_spherical_v2_radial_primary_numerics_upstream_binding_mismatch",
    );
  }
  if (INITIALIZER_PIN.status !== "exact_bound") {
    throw new Error(
      "nhm2_spherical_v2_radial_primary_numerics_initializer_binding_mismatch",
    );
  }
  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1;
  if (
    contract.productionSourceClosure.exactFileCount !== 11 ||
    contract.productionSourceClosure.files.length !== 11 ||
    contract.productionSourceClosure.files.some(
      (pin, index) => pin.ordinal !== index,
    ) ||
    contract.finiteOperationGraph.lobattoGrid.mpfrPrecisionBits !== 256 ||
    contract.finiteOperationGraph.compactificationAndSquareSystem
      .unknownCount !== "3*N+1" ||
    contract.finiteOperationGraph.compactificationAndSquareSystem
      .boundaryRowCount !== 7 ||
    contract.finiteOperationGraph.denseLu.maximumSystemOrder !== 1537 ||
    contract.finiteOperationGraph.denseLu.exactRefinementPassCount !== 3 ||
    contract.finiteOperationGraph.newtonArmijo.maximumAcceptedUpdates !== 48 ||
    contract.finiteOperationGraph.newtonArmijo.maximumBacktrackExponent !==
      24 ||
    contract.finiteOperationGraph.newtonArmijo
      .consecutiveAcceptedFullGateCount !== 2 ||
    contract.finiteOperationGraph.finiteAmplitudeContinuation.schedule.join(
      ",",
    ) !== AMPLITUDE_SCHEDULE.join(",") ||
    contract.finiteOperationGraph.finiteAmplitudeContinuation
      .newtonAttemptsPerStage !== 1 ||
    contract.radialLevelDisposition.preselectedDiagnosticLevels.join(",") !==
      "64,96,128" ||
    contract.radialLevelDisposition.auditLevel !== 256 ||
    contract.radialLevelDisposition.exactCandidateNodeSchedule !== null ||
    contract.completionBoundary.exactUpstreamBindingsComplete !== true ||
    contract.completionBoundary
      .implementedFinitePrimitiveSourceOperationGraphComplete !== true ||
    contract.completionBoundary.exactElevenProductionSourcePinsComplete !==
      true ||
    Object.entries(contract.completionBoundary)
      .filter(
        ([key]) =>
          key !== "implementedFinitePrimitiveSourceOperationGraphComplete" &&
          key !== "exactElevenProductionSourcePinsComplete" &&
          key !== "exactUpstreamBindingsComplete",
      )
      .some(([, value]) => value !== false) ||
    Object.values(contract.unresolved).some((value) => value !== null) ||
    Object.values(contract.authorityLocks).some((value) => value !== false)
  ) {
    throw new Error(
      "nhm2_spherical_v2_radial_primary_numerics_invariant_violation",
    );
  }
  assertLiveProductionSourcePins();
};

assertInvariants();

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1);
export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-radial-primary-numerics/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_EXPECTED_SHA256 =
  "f88e31544dfeccdbb43a5b956172c4b6b4b84f22de3b25ced762282cb5f271bc" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES =
  14732 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_LITERAL_SEAL_STATUS =
  "sealed_after_final_initializer_evaluator_repin_before_any_candidate_execution" as const;
if (
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_v2_radial_primary_numerics_literal_self_seal_mismatch:${NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES}`,
  );
}

export const NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

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
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth) {
    return { ok: false, violation: `snapshot_depth_limit:${pointer || "/"}` };
  }
  budget.nodes += 1;
  if (budget.nodes > limits.maximumNodes) {
    return { ok: false, violation: `snapshot_node_limit:${pointer || "/"}` };
  }
  if (value === null || typeof value === "boolean") {
    return { ok: true, value };
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? { ok: true, value }
      : { ok: false, violation: `invalid_number:${pointer || "/"}` };
  }
  if (typeof value === "string") {
    if (value.includes("\0") || /[\ud800-\udfff]/u.test(value)) {
      return { ok: false, violation: `invalid_string:${pointer || "/"}` };
    }
    const size = Buffer.byteLength(value, "utf8");
    if (size > limits.maximumStringUtf8Bytes) {
      return { ok: false, violation: `string_byte_limit:${pointer || "/"}` };
    }
    budget.utf8Bytes += size;
    return budget.utf8Bytes <= limits.maximumAggregateUtf8Bytes
      ? { ok: true, value }
      : {
          ok: false,
          violation: `aggregate_utf8_byte_limit:${pointer || "/"}`,
        };
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
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      value.length > limits.maximumArrayLength ||
      Reflect.ownKeys(value).some(
        (key) =>
          key !== "length" &&
          (typeof key !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(key)),
      ) ||
      Object.keys(value).length !== value.length
    ) {
      ancestors.delete(value);
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
        ancestors.delete(value);
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
  if (![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    ancestors.delete(value);
    return { ok: false, violation: `non_plain_object:${pointer || "/"}` };
  }
  const keys = Reflect.ownKeys(value);
  if (
    keys.length > limits.maximumObjectPropertyCount ||
    keys.some((key) => typeof key !== "string")
  ) {
    ancestors.delete(value);
    return { ok: false, violation: `object_surface:${pointer || "/"}` };
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    const keySize = Buffer.byteLength(key, "utf8");
    budget.utf8Bytes += keySize;
    if (
      keySize > limits.maximumPropertyKeyUtf8Bytes ||
      budget.utf8Bytes > limits.maximumAggregateUtf8Bytes ||
      FORBIDDEN_KEYS.has(key)
    ) {
      ancestors.delete(value);
      return { ok: false, violation: `object_key:${pointer}/${key}` };
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      ancestors.delete(value);
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

const EXPECTED_CANONICAL_JSON =
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_JSON;

export const nhm2SphericalBosonStarV2RadialPrimaryNumericsV1Violations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1) {
    return [];
  }
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["radial_primary_numerics_plain_data_snapshot_invalid"];
  }
  if (!snapshot.ok) return [snapshot.violation];
  try {
    return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
      ? ["radial_primary_numerics_external_copy_not_authoritative"]
      : ["radial_primary_numerics_semantic_mismatch"];
  } catch {
    return ["radial_primary_numerics_plain_data_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2RadialPrimaryNumericsV1 = (
  value: unknown,
): value is typeof NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1 =>
  value === NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1;
