import { createHash } from "node:crypto";

import { NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING } from "./nhm2-spherical-boson-star-branch-bvp.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING } from "./nhm2-spherical-boson-star-v2-branch-execution-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v2";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_ROOT,
} from "./nhm2-spherical-boson-star-v2-radial-primary-numerics.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING } from "./nhm2-spherical-boson-star-v2-branch-solver-policy.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2.branch_selection_numerics" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_VERSION =
  "nhm2_spherical_boson_star_v2_branch_selection_numerics/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANDIDATE_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_PHASE =
  "stage_2_preexecution_scientific_policy_definition_only" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumWireUtf16CodeUnits: 131_072,
    maximumWireUtf8Bytes: 131_072,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING_PINS =
  Object.freeze({
    finalCandidateFreezeV2: Object.freeze({
      semanticSha256:
        "a8e4d9cb4b07efc053fddc72339b8c3db464129a992731453059d3e160ca2ce2",
      plainCanonicalSha256:
        "ae7e7f17b67dca7bbb25cbddb60e20b08135dd513977a620463122e153f58932",
      canonicalSizeBytes: 20_843,
    }),
    branchExecutionPolicy: Object.freeze({
      semanticSha256:
        "55238947c0a21f71ff3b0b28d095733376527479214806790990aea4317b7cf8",
      canonicalSizeBytes: 21_266,
    }),
    branchSolverPolicy: Object.freeze({
      semanticSha256:
        "b7d2cb2d7dcf39531000bbfcdfadb44f5e9c38d3ab1950982515245336a77cb0",
      canonicalSizeBytes: 18_993,
    }),
    radialPrimaryNumerics: Object.freeze({
      semanticSha256:
        "f88e31544dfeccdbb43a5b956172c4b6b4b84f22de3b25ced762282cb5f271bc",
      canonicalSizeBytes: 14_732,
    }),
    branchBvp: Object.freeze({
      semanticSha256:
        "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
      canonicalSizeBytes: 13_847,
    }),
  } as const);

const NEW_POLICY_DECISION =
  "new_preexecution_scientific_policy_decision_not_inferred_from_diagnostics_or_pass_evidence" as const;

const POLICY_DECISION_LEDGER = Object.freeze(
  [
    "grid.level_ids_and_node_counts",
    "grid.four_independent_full_solves",
    "grid.level_chronology",
    "initializer.fixed_lambda",
    "continuation.amplitude_schedule",
    "continuation.predictor_chronology",
    "state.packing_order",
    "projection.second_form_barycentric_algorithm",
    "projection.term_order_scaling_and_zero_rule",
    "cross_grid.adjacent_pair_order",
    "cross_grid.componentwise_normalized_linf_norm",
    "cross_grid.F0_absolute_and_relative_tolerances",
    "cross_grid.F1_absolute_and_relative_tolerances",
    "cross_grid.varphi_absolute_and_relative_tolerances",
    "cross_grid.w_absolute_and_relative_tolerances",
    "cross_grid.three_consecutive_pair_requirement",
    "vacuum.weak_field_desingularization",
    "vacuum.parameter_cell_cover",
    "vacuum.mpfr_precision_and_outward_rounding",
    "vacuum.core_domain_and_spatial_truncation",
    "vacuum.parameter_degree_and_weighted_norm",
    "vacuum.analytic_tail_factorization",
    "vacuum.radii_polynomial_radius_schedule",
    "vacuum.radii_polynomial_inequalities",
    "vacuum.tube_overlap_orientation_and_endpoint_rules",
    "no_fold.tangent_definition_and_orientation",
    "no_fold.inverse_frequency_and_mass_margins",
    "continuum_sign.origin_domain_and_normalized_derivative",
    "continuum_sign.interior_cover_and_enclosure",
    "continuum_sign.tail_factorization_and_log_derivative",
    "continuum_sign.lambda_zero_limiting_profile",
    "origin.even_recurrence_through_x12",
    "origin.analytic_radius_domain_and_remainder_majorant",
    "tail.outer_amplitude_and_C0_normalization",
    "tail.metric_emission_and_A9_B9_internal_scratch",
    "tail.scalar_compatibility_and_diagonal_chronology",
    "tail.kappa_M_q_domain_and_singularity_separation",
    "tail.first_and_second_x_derivative_operators",
    "tail.recurrence_through_z8",
    "tail.domain_and_remainder_majorant",
    "residual.existing_newton_gates",
    "residual.every_stage_unused_constraint_gate",
    "residual.terminal_independent_replay_gates",
    "residual.continuum_interval_replay_gate",
  ].map((dimension, ordinal) =>
    Object.freeze({
      ordinal,
      dimension,
      decisionClass: NEW_POLICY_DECISION,
      priorDiagnosticPresenceIsNotJustification: true,
      passEvidenceInspectedOrUsed: false,
      derivedErrorBoundClaimed: false,
    }),
  ),
);

const GRID_LEVELS = Object.freeze([
  Object.freeze({
    levelId: "L0",
    nodeCount: 64,
    role: "coarse_convergence_witness",
  }),
  Object.freeze({
    levelId: "L1",
    nodeCount: 96,
    role: "first_refinement_witness",
  }),
  Object.freeze({
    levelId: "L2",
    nodeCount: 128,
    role: "second_refinement_witness",
  }),
  Object.freeze({
    levelId: "L3",
    nodeCount: 256,
    role: "terminal_candidate_and_audit_state",
  }),
] as const);

const AMPLITUDE_SCHEDULE = Object.freeze([
  "2^-16",
  "2^-15",
  "2^-14",
  "2^-13",
  "2^-12",
  "2^-11",
  "2^-10",
] as const);

const AUTHORITY_LOCKS = Object.freeze({
  policyLiteralPresealReady: false,
  candidateInstanceReady: false,
  candidateAdmissible: false,
  branchScienceReady: false,
  solverReady: false,
  proofProgramReady: false,
  proofSourceReady: false,
  proofReceiptReady: false,
  sourceRuntimeClosureReady: false,
  executionPresealReady: false,
  executionAuthorized: false,
  executionObserved: false,
  residualGatePassed: false,
  constraintGatePassed: false,
  continuousVacuumConnectionEstablished: false,
  noFoldEstablished: false,
  continuumSignEstablished: false,
  originRemainderEstablished: false,
  tailRemainderEstablished: false,
  primaryReplayReady: false,
  independentReplayReady: false,
  pairAgreementReady: false,
  pairAgreementObserved: false,
  diagnosticPass: false,
  stressNoiseLamp: false,
  constraintAlgebraLamp: false,
  theoryGraphLamp: false,
  theoryGraphAuthority: false,
  authorityPromoted: false,
  registryPromoted: false,
  casimirVerificationInvoked: false,
  certificateReady: false,
  physicalViability: false,
  propulsion: false,
  transport: false,
} as const);

const NULL_IMPLEMENTATION_AND_PROOF_BINDINGS = Object.freeze({
  integratedCandidateSolverProgram: null,
  crossGridProjectionProgram: null,
  crossGridProjectionSourceBinding: null,
  validatedBranchTopologyProgram: null,
  validatedBranchTopologySourceBinding: null,
  boundaryRemaindersProgram: null,
  boundaryRemaindersSourceBinding: null,
  intervalArithmeticDependencyLock: null,
  proofToolchainBinding: null,
  proofExecutableBinding: null,
  proofRuntimeBinding: null,
  proofIssuerBinding: null,
  proofBuilderBinding: null,
  limitingGroundStateProofReceipt: null,
  simpleKernelProofReceipt: null,
  bifurcationTransversalityProofReceipt: null,
  vacuumCoverProofReceipt: null,
  noFoldProofReceipt: null,
  continuumSignProofReceipt: null,
  originRecurrenceProofReceipt: null,
  originRemainderProofReceipt: null,
  tailRecurrenceProofReceipt: null,
  tailMetricScratchCoefficientBinding: null,
  tailScalarCompatibilityAndDiagonalReceipt: null,
  tailDenominatorAndSingularitySeparationReceipt: null,
  tailRemainderProofReceipt: null,
  terminalContinuumResidualProofReceipt: null,
} as const);

const NULL_ACTUAL_INSTANCES = Object.freeze({
  candidateManifestInstance: null,
  candidateInstance: null,
  initializerInstance: null,
  L0FullSolveInstance: null,
  L1FullSolveInstance: null,
  L2FullSolveInstance: null,
  L3FullSolveInstance: null,
  crossGridPairInstances: null,
  projectedStateInstances: null,
  normalizedErrorInstances: null,
  vacuumParameterCellInstances: null,
  radiiPolynomialInstances: null,
  certifiedTubeInstances: null,
  tangentInstances: null,
  continuumSignInstances: null,
  originRecurrenceInstance: null,
  tailRecurrenceInstance: null,
  tailMetricScratchInstance: null,
  tailScalarCompatibilityInstance: null,
  tailDenominatorSeparationInstance: null,
  residualArrayInstances: null,
  constraintArrayInstances: null,
  executionReceipt: null,
  primaryReplayReceipt: null,
  independentReplayReceipt: null,
  pairAgreementReceipt: null,
  outputRoot: null,
  outputManifest: null,
  registryEntry: null,
  certificate: null,
} as const);

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_VERSION,
  candidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANDIDATE_ID,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_PHASE,
  maturity:
    "stage_2_policy_dimensions_specified_but_all_proofs_instances_execution_replay_and_claim_authority_absent",
  authority:
    "preexecution_policy_definition_only_no_solver_proof_execution_replay_lamp_certificate_or_physical_authority",
  additiveBoundary: {
    mutatesAnyBoundPredecessor: false,
    importsPassEvidence: false,
    importsDiagnosticResults: false,
    claimsPolicyValuesAreUniquelyImpliedByPriorArtifacts: false,
    priorDiagnosticCountsAdoptedOnlyAsNewPreregisteredPolicy: true,
    policyValuesSpecifiedBeforeCandidateExecution: true,
    publicRequestMayOverridePolicyValue: false,
  },
  candidateAndClaimBoundary: {
    sourceMode: "state_derived_not_declared_lever",
    declaredLeverTensorUsed: false,
    declaredTileTensorUsed: false,
    candidateAdmittedInstanceCount: 0,
    policyDefinitionIsCandidatePassEvidence: false,
    policyDefinitionIsPhysicalViabilityEvidence: false,
    policyDefinitionMayUnlockPropulsionOrTransportClaims: false,
  },
  policyDecisionClassification: {
    classification: NEW_POLICY_DECISION,
    everyScheduleToleranceAndProofDimensionCoveredByLedger: true,
    numericalValuesAreConservativeEngineeringDecisions: true,
    numericalValuesAreNotDerivedDiscretizationErrorBounds: true,
    noTargetOutputOrPassEvidenceUsedToChooseValues: true,
    decisionLedger: POLICY_DECISION_LEDGER,
  },
  exactDefinitionBindings: {
    finalCandidateFreezeV2:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING,
    branchExecutionPolicy:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING,
    branchSolverPolicy:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
    radialPrimaryNumerics:
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
    branchBvp: NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING,
    bindingsImportDefinitionOnlyNotAuthority: true,
  },
  existingFiniteSolverSourceClosure: {
    sourceRoot:
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_ROOT,
    exactFileCount: 11,
    files: NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS,
    exactOrdinalClosureRequired: true,
    exactPathSizeAndSha256ClosureRequired: true,
    closureInheritedFromBoundRadialPrimaryNumerics: true,
    finitePrimitiveClosureIsNotIntegratedCandidateSolverClosure: true,
    finitePrimitiveClosureIsNotProofProgramClosure: true,
    finitePrimitiveClosureIsNotRuntimeOrExecutionAuthority: true,
  },
  frozenGridAndChronologyPolicy: {
    decisionClass: NEW_POLICY_DECISION,
    gridFamily: "existing_mpfr256_compactified_chebyshev_lobatto",
    levels: GRID_LEVELS,
    exactLevelCount: 4,
    everyLevelIsAnIndependentFullSolve: true,
    perLevelChronology: [
      "generate_exact_existing_lobatto_grid",
      "materialize_same_frozen_initializer_evaluator_output_at_lambda_2^-5",
      "use_that_output_as_caller_initializer_for_A_2^-16",
      "run_complete_frozen_amplitude_schedule_through_A_2^-10",
      "use_only_previous_accepted_same_grid_amplitude_state_as_next_predictor",
      "apply_all_later_fixed_gates",
    ],
    initializerLambda: { exact: "2^-5", value: 2 ** -5 },
    amplitudeScheduleExact: AMPLITUDE_SCHEDULE,
    amplitudeScheduleValues: AMPLITUDE_SCHEDULE.map(
      (value) => 2 ** Number(value.slice(2)),
    ),
    coarseGridStateMayInitializeFinerGrid: false,
    crossGridInterpolationRole: "diagnostic_gate_only_never_predictor",
    interpolationPredictorAllowed: false,
    alternateGridFallbackAllowed: false,
    alternateInitializerFallbackAllowed: false,
    terminalCandidateState: "L3_N256_A2^-10",
    firstFailureStopsWholeCandidate: true,
  },
  statePackingAndProjectionPolicy: {
    decisionClass: NEW_POLICY_DECISION,
    packedStateOrder: [
      "F0_nodes_ascending_rho",
      "F1_nodes_ascending_rho",
      "varphi_nodes_ascending_rho",
      "w",
    ],
    adjacentPairOrder: ["64_to_96", "96_to_128", "128_to_256"],
    projectedFields: ["F0", "F1", "varphi"],
    wComparedDirectlyWithoutProjection: true,
    projection: {
      algorithm: "deterministic_second_form_chebyshev_lobatto_barycentric",
      coarseWeight: "b_j=(-1)^j*(1/2_at_endpoints_otherwise_1)",
      exactBitEqualNodeHit: "copy_source_value",
      nonNodeHitEvaluation:
        "barycentric_numerator_and_denominator_with_ascending_index_term_creation_and_math_fsum",
      termScaling:
        "divide_all_terms_by_maximum_term_magnitude_before_summation",
      exactMaximumTieRule: "retain_lowest_ordinal",
      outputZeroRule: "canonicalize_to_positive_zero",
      alternateProjectionAllowed: false,
    },
  },
  crossGridConvergencePolicy: {
    decisionClass: NEW_POLICY_DECISION,
    componentErrorDefinition:
      "E_q=max_i(abs(q_f(i)-P(q_c)(i))/(a_q+r_q*max(abs(q_f(i)),abs(P(q_c)(i)))))",
    frequencyErrorDefinition:
      "E_w=abs(w_f-w_c)/(a_w+r_w*max(abs(w_f),abs(w_c)))",
    overallNorm: "E=max(E_F0,E_F1,E_varphi,E_w)",
    normFamily: "componentwise_normalized_Linf",
    componentTolerances: {
      F0: {
        absolute: {
          exact: "2^-36",
          value: 2 ** -36,
          binary64Word: "3db0000000000000",
        },
        relative: {
          exact: "2^-24",
          value: 2 ** -24,
          binary64Word: "3e70000000000000",
        },
      },
      F1: {
        absolute: {
          exact: "2^-36",
          value: 2 ** -36,
          binary64Word: "3db0000000000000",
        },
        relative: {
          exact: "2^-24",
          value: 2 ** -24,
          binary64Word: "3e70000000000000",
        },
      },
      varphi: {
        absolute: {
          exact: "2^-40",
          value: 2 ** -40,
          binary64Word: "3d70000000000000",
        },
        relative: {
          exact: "2^-24",
          value: 2 ** -24,
          binary64Word: "3e70000000000000",
        },
      },
      w: {
        absolute: {
          exact: "2^-40",
          value: 2 ** -40,
          binary64Word: "3d70000000000000",
        },
        relative: {
          exact: "2^-32",
          value: 2 ** -32,
          binary64Word: "3df0000000000000",
        },
      },
    },
    pairPassRule: "E<=1",
    requiredConsecutivePairCount: 3,
    allThreeAdjacentPairsMustPass: true,
    failureDisposition:
      "fail_candidate_immediately_without_more_levels_tolerance_change_retry_or_fallback",
    currentObservedPairErrors: null,
    established: false,
  },
  continuousVacuumConnectionPolicy: {
    decisionClass: NEW_POLICY_DECISION,
    branchParameter: "lambda_in_[0,2^-5]",
    weakFieldScaling: {
      physicalOriginAmplitude: "A=lambda^2_in_[0,2^-10]",
      scaledRadius: "y=lambda*x",
      scalar: "varphi=lambda^2*u",
      metricF0: "F0=lambda^2*v0",
      metricF1: "F1=lambda^2*v1",
      scaledFrequency: "nu=(w^2-1)/(2*lambda^2)",
      scaledAdmCoefficient: "m=M/lambda",
    },
    lambdaZeroRule: {
      variablesDefinedByContinuousLimits: true,
      independentlyProveLimitingNewtonianGroundState: true,
      independentlyProveSimpleKernel: true,
      independentlyProveBifurcationTransversality: true,
      ordinaryIntervalNewtonOnUnscaledVacuumEquationsForbidden: true,
      reason: "zero_field_frequency_is_degenerate",
    },
    fixedRadiiPolynomialCover: {
      exactParameterCellCount: 1_024,
      parameterCellFormula: "I_k=[k*2^-15,(k+1)*2^-15],k=0,...,1023",
      mpfrPrecisionBits: 256,
      intervalRounding: "directed_outward",
      coreScaledRadialDomain: "y_in_[0,64]",
      spatialChebyshevCoefficientsPerUnknown: 256,
      parameterChebyshevDegreePerCell: 32,
      coefficientNorm: "weighted_l1_coefficient_norm",
      coefficientWeight: { exact: "17/16", numerator: 17, denominator: 16 },
      analyticTailFactorizationBeyondY: 64,
      adaptiveCellSubdivisionAllowed: false,
      truncationIncreaseAllowed: false,
      precisionEscalationAllowed: false,
      requiredBounds: ["Y", "Z0", "Z1", "Z2"],
      requiredBoundsNonnegativeAndOutwardRounded: true,
      exactOrderedRadiusExponentSet: Array.from(
        { length: 73 },
        (_, index) => -80 + index,
      ),
      radiusValueDefinition: "r=2^exponent",
      radiusSelectionRule: "first_passing_member_in_ascending_exponent_order",
      existenceInequality: "Y+(Z0+Z1-1)*r+Z2*r^2<0",
      contractionInequality: "Z0+Z1+2*Z2*r<1",
      adjacentTubeSharedFaceOverlapRequired: true,
      adjacentTubeCompatibleOrientationRequired: true,
      firstTubeContainsCertifiedLambdaZeroLimit: true,
      lastTubeContainsLambda2Minus5TargetState: true,
    },
    sevenBinary64ContinuationStagesAreDiagnosticsOnly: true,
    sevenStagesMaySubstituteForContinuousCover: false,
    expectedProofProduct: "existence_local_uniqueness_and_continuous_cover",
    established: false,
  },
  tangentAndNoFoldPolicy: {
    decisionClass: NEW_POLICY_DECISION,
    desingularizedEquation: "G(z,lambda)=0",
    tangentEquation: "D_zG*t_z+partial_lambda_G=0",
    affineNormalization: "t_lambda=1",
    orientation: "strictly_increasing_lambda",
    signReversalAllowed: false,
    branchSwitchAllowed: false,
    norm: "same_weighted_coefficient_norm_chi_17/16",
    margins: {
      linearizedInverse: "beta=1/||D_zG^-1||_chi>=2^-40",
      frequencyOrientation:
        "dw/dA<=-2^-40_with_analytic_limiting_value_at_lambda_0",
      admMassOrientation: "dM/dlambda>=2^-40_with_M=-F0[x^-1]=F1[x^-1]",
      exactThreshold: "2^-40",
      thresholdValue: 2 ** -40,
      thresholdBinary64Word: "3d70000000000000",
    },
    foldObservable: "min(beta,-dw/dA,dM/dlambda)",
    foldPassRule: "foldMargin>=2^-40_everywhere",
    observedFrequencyProgressionAloneIsProof: false,
    thresholdIsEvidenceDerived: false,
    established: false,
  },
  continuumPositivityAndMonotonicityPolicy: {
    decisionClass: NEW_POLICY_DECISION,
    scaledScalar: "u=varphi/lambda^2",
    positiveLambdaRequirement: {
      uStrictlyPositiveAtEveryFiniteX: true,
      uDerivativeStrictlyNegativeForEveryXGreaterThanZero: true,
    },
    originDomain: {
      x: "0<x<=2^-8",
      proveUPositive: true,
      proveNormalizedDerivative: "u_x/x<0",
      forcedCenterDerivativeZeroHandledWithoutStrictUxAtX0: true,
    },
    interiorDomain: {
      rho: "[1/257,64/(kappa+64)]",
      exactEqualAffineCellCount: 4_096,
      enclosure: "interval_chebyshev_to_bernstein",
      prove: ["u>0", "u_x<0"],
    },
    tailDomain: {
      condition: "kappa*x>=64",
      proveFactoredScalarTailPositive: true,
      proveLogarithmicDerivativeStrictlyNegative: true,
    },
    lambdaZero: {
      limitingGroundStateProfileCertifiedPositiveAndDecreasingSeparately: true,
      physicalVacuumFieldExemptFromStrictPositivity: true,
    },
    uniformAbsolutePositivityMarginRequired: false,
    strictIntervalSeparationInNormalizedCoreAndTailRequired: true,
    established: false,
  },
  originRecurrenceAndRemainderPolicy: {
    decisionClass: NEW_POLICY_DECISION,
    evenExpansions: {
      F0: "sum_n>=0 a_2n*x^(2n)",
      F1: "sum_n>=0 b_2n*x^(2n)",
      varphi: "sum_n>=0 p_2n*x^(2n)",
    },
    recurrenceForEveryNGreaterThanOrEqualToZero: [
      "substitute_complete_lower_order_series_and_exact_exponential_series_convolutions_into_frozen_Et_t_Etheta_theta_and_Klein_Gordon_rows",
      "extract_coefficient_of_x^(2n)",
      "solve_resulting_exact_three_row_linear_coefficient_system_for_a_2n+2_b_2n+2_p_2n+2",
      "fail_if_system_is_singular_or_interval_enclosure_contains_singularity",
    ],
    finiteRepresentativeThrough: "x^12",
    firstOmittedPower: "x^14",
    analyticRadiusMinimum: "R_o>=2^-4",
    evaluationDomain: "0<=x<=x_o=2^-8",
    normalizedRadius: "z=x/R_o_with_0<=z<=1/16",
    derivativeOrders: [0, 1, 2],
    remainderRule: "abs(R_q^(j)(x))<=C_q*R_o^(-j)*d^j/dz^j[z^14/(1-z^2)]",
    receiptMustSupplyNonnegativeCertifiedCqForEveryField: true,
    rightSideEvaluatedAsNonnegativeRationalFunction: true,
    recurrenceExpressionsPresent: false,
    majorantConstantsPresent: false,
    established: false,
  },
  tailRecurrenceAndRemainderPolicy: {
    decisionClass: NEW_POLICY_DECISION,
    parameterAndDomainClosure: {
      frequency: "0<w<1",
      kappa: "kappa=sqrt(1-w^2)>0",
      admMass: "M=-F0[x^-1]=F1[x^-1]>0",
      coulombParameter: "q=M*kappa/2",
      coulombParameterDomain: "0<q<64",
      normalizedInverseRadius: "z=(kappa*x)^-1",
      tailDomain: "0<z<=1/64",
      exactDomainConsequence: "0<q*z<1_and_1-q*z>0",
      schwarzschildCoordinateSingularity: "q*z=1",
      schwarzschildCoordinateSingularityOutsideTailDomain: true,
      everyScalarDiagonalDenominatorMustExcludeZero: true,
      everyCoordinateOrPrefactorSingularityMustBeSeparatedFromDomain: true,
      candidateSpecificStrictIntervalSeparationRequired: true,
      domainBoundsAloneMayStandInForSeparationReceipt: false,
      actualParameterTuple: null,
      futureDenominatorAndSingularitySeparationReceipt: null,
      lambdaZeroIncludedInThisTailChart: false,
      lambdaZeroDisposition:
        "covered_only_by_separate_desingularized_limiting_proof_because_kappa=0_makes_z_undefined_and_scalar_diagonals_vanish",
    },
    scalarScaleNormalization: {
      outerPrincipalAmplitude: "C>0",
      actualOuterPrincipalAmplitude: null,
      exactScalarCorrectionLeadingCoefficient: "C_0=1",
      scalarCorrectionLeadingCoefficientValue: 1,
      C0MayBeAdjusted: false,
      independentCAndC0RescalingAllowed: false,
      noCC0ScaleDegeneracy: true,
      zeroOrNegativeOuterAmplitudeAllowed: false,
    },
    emittedRepresentative: {
      metricCoefficientRange: "A_n_and_B_n_for_n=1,...,8",
      scalarCorrectionCoefficientRange: "C_n_for_n=0,...,8_with_C_0=1",
      metricSeriesThrough: "z^8",
      scalarCorrectionSeriesThrough: "z^8",
      F0: "sum_n=1^8 A_n*z^n+R_F0",
      F1: "sum_n=1^8 B_n*z^n+R_F1",
      varphi: "C*exp(-kappa*x)*x^sigma*(1+sum_n=1^8 C_n*z^n+R_S)",
      exactAlgebraicMetricCoefficients: {
        A_n: "-2*q^n/n_for_odd_n_and_0_for_even_n",
        B_n: "2*(-1)^(n+1)*q^n/n",
      },
      canonicalSerializationOrder:
        "parameters_(w,kappa,M,C,sigma)_then_metric_(n,A_n,B_n)_n1_to_8_then_non_emitted_scratch_(9,A_9,B_9)_then_scalar_C_0_exactly_1_and_(n,C_n)_n1_to_8",
    },
    algebraicMetricDiagonalRecurrence: {
      massMode: "B_1=M*kappa=2*q_and_A_1=-M*kappa=-2*q",
      BnRow: "2*n*(n-1)*B_n+sum_(i+j=n)_i*j*B_i*B_j=0",
      AnBnRow: "n^2*(A_n+B_n)+sum_(i+j=n)_i*j*A_i*A_j=0",
      diagonalRowOrder: ["BnRow", "AnBnRow"],
      diagonalUnknownOrder: ["B_n", "A_n"],
      diagonalRange: "n=2,...,9",
      diagonalDeterminant: "+2*n^3*(n-1)",
      diagonalDeterminantNonzeroForEveryRequiredN: true,
      scalarStressTreatment:
        "exponentially_flat_at_z=0_and_not_part_of_algebraic_metric_coefficient_rows",
    },
    internalNonEmittedMetricProofScratch: {
      exactCoefficientNames: ["A_9", "B_9"],
      exactCoefficientCount: 2,
      generatedFrom:
        "exact_coefficient_extraction_from_frozen_Et_t_and_Etheta_theta_Einstein_rows",
      generatedBefore: "Klein_Gordon_C_8_diagonal_from_z^9",
      exactScratchValues: {
        A_9: "-2*q^9/9",
        B_9: "2*q^9/9",
      },
      includedInEmittedMetricRepresentative: false,
      mustBeBoundByFutureProofReceipt: true,
      futureProofReceiptBinding: null,
      missingEitherCoefficientDisposition: "fail_candidate",
    },
    scalarCompatibilityAndDiagonalChronology: {
      equationsEvaluatedAfterFactoring: "nonzero_C*exp(-kappa*x)*x^sigma",
      exactFactoredSeries: "S(z)=1+sum_n=1^8_C_n*z^n+R_S",
      exactDifferentialOperator: "L_sigma(S)=(-1+sigma*z)*S-z^2*dS/dz",
      exactFrozenKleinGordonCoefficientEquation:
        "exp(-2*F1)*kappa^2*(L_sigma^2(S)+(2*z-z^2*(dF0/dz+dF1/dz))*L_sigma(S))+(exp(-2*F0)*w^2-1)*S=0",
      leadingExponentialCompatibility: {
        exactKleinGordonCoefficient: "z^0",
        condition: "kappa^2=1-w^2_with_kappa>0",
      },
      leadingPowerCompatibility: {
        exactKleinGordonCoefficient: "z^1",
        condition: "sigma=M*(2*w^2-1)/kappa-1",
      },
      C0Role: "exact_normalization_C_0=1_not_a_diagonal_unknown",
      recurrenceRule:
        "for_n=1,...,8_extract_exact_Klein_Gordon_coefficient_z^(n+1)_and_solve_only_for_C_n_after_required_metric_coefficients_through_A_(n+1)_and_B_(n+1)_are_available",
      exactScalarDiagonal: "2*kappa^2*n",
      exactScalarDiagonalRange: "n=1,...,8",
      scalarDiagonalNonzeroWhenKappaStrictlyPositive: true,
      exactChronology: [
        "derive_emitted_A_1_through_A_8_and_B_1_through_B_8_from_exact_frozen_Einstein_coefficient_rows",
        "enforce_Klein_Gordon_z^0_kappa_compatibility",
        "enforce_Klein_Gordon_z^1_sigma_compatibility_with_C_0_exactly_1",
        "solve_Klein_Gordon_diagonals_C_1_through_C_7_from_z^2_through_z^8_after_each_required_metric_diagonal_is_available",
        "generate_internal_non_emitted_A_9_and_B_9_from_exact_frozen_Einstein_coefficient_rows",
        "bind_A_9_and_B_9_in_future_proof_receipt_before_the_C_8_diagonal",
        "solve_C_8_from_exact_Klein_Gordon_z^9_only_after_A_9_and_B_9_are_bound",
      ],
      everyDiagonalDenominatorMustHaveStrictIntervalSeparationFromZero: true,
      resonanceOrIntervalDenominatorContainingZeroDisposition: "fail_candidate",
      futureCompatibilityAndDiagonalReceiptBinding: null,
    },
    ansatz: {
      F0: "sum_n=1^8 A_n*z^n+R_F0",
      F1: "sum_n=1^8 B_n*z^n+R_F1",
      varphi: "C*exp(-kappa*x)*x^sigma*(1+sum_n=1^8 C_n*z^n+R_S)_with_C>0",
    },
    coefficientGeneration:
      "exact_coefficient_extraction_from_same_frozen_radial_rows_preserving_existing_leading_terms",
    normalizedRemainderRule: "abs(R_q^(j)(z))<=K_q*d^j/dz^j[z^9/(1-z)]",
    derivativeOrders: [0, 1, 2],
    physicalXDerivativeOperators: {
      first: "d/dx=-kappa*z^2*d/dz",
      second: "d2/dx2=kappa^2*(z^4*d2/dz2+2*z^3*d/dz)",
      applyToMetricRemainders: true,
      applyToCompleteScalarPrefactorPlusSeries:
        "C*exp(-kappa*x)*x^sigma*(1+sum_n=1^8 C_n*z^n+R_S)",
      completeScalarFirstDerivativeMustUse: "kappa*L_sigma",
      completeScalarSecondDerivativeMustUse: "kappa^2*L_sigma^2",
      differentiatingOnlyNormalizedScalarCorrectionIsForbidden: true,
    },
    firstOmittedGeometricFactorUpperBoundAtDomainEdge: "2^-54",
    recurrencePresent: false,
    scratchMetricCoefficientsPresent: false,
    scalarCompatibilityReceiptPresent: false,
    denominatorSeparationReceiptPresent: false,
    majorantProofPresent: false,
    established: false,
  },
  separateResidualAndConstraintGatePolicy: {
    decisionClass: NEW_POLICY_DECISION,
    residualAndConstraintGatesAreSeparate: true,
    retainedNewtonGates: {
      solvedResidualLinfMaximum: {
        exact: "2^-40",
        value: 2 ** -40,
        binary64Word: "3d70000000000000",
      },
      scaledAcceptedStepLinfMaximum: {
        exact: "2^-42",
        value: 2 ** -42,
        binary64Word: "3d50000000000000",
      },
      consecutiveAcceptedFullPassCount: 2,
      unchangedFromBoundFiniteNewtonPolicy: true,
    },
    everyAmplitudeStageEveryGridUnusedConstraintGate: {
      row: "unused_Ex_x",
      normalizedLinfMaximum: {
        exact: "2^-28",
        value: 2 ** -28,
        binary64Word: "3e30000000000000",
      },
    },
    terminalN256IndependentReplayGates: {
      normalizedSolvedRowLinfMaximum: {
        exact: "2^-36",
        value: 2 ** -36,
        binary64Word: "3db0000000000000",
      },
      normalizedUnusedExXConstraintLinfMaximum: {
        exact: "2^-32",
        value: 2 ** -32,
        binary64Word: "3df0000000000000",
      },
      normalizedEndpointBoundaryRowLinfMaximum: {
        exact: "2^-36",
        value: 2 ** -36,
        binary64Word: "3db0000000000000",
      },
    },
    continuumIntervalReplayOfTerminalInterpolant: {
      cover: "origin_interior_tail",
      normalizedSolvedRowLinfMaximum: {
        exact: "2^-32",
        value: 2 ** -32,
        binary64Word: "3df0000000000000",
      },
    },
    independentReplaySlackIsPolicyNotEvidence: true,
    unusedConstraintToleranceIsPolicyNotDiscretizationEstimate: true,
    observedGateValues: null,
    residualGatePassed: false,
    constraintGatePassed: false,
  },
  fixedFailureAndVersioningPolicy: {
    firstGridNewtonProjectionConvergenceProofResidualOrConstraintFailureStopsCandidate: true,
    retryAllowed: false,
    retuneAllowed: false,
    toleranceChangeAllowed: false,
    scheduleChangeAllowed: false,
    adaptiveFallbackAllowed: false,
    alternateGridAllowed: false,
    alternateInitializerAllowed: false,
    branchSwitchAllowed: false,
    publicOverrideAllowed: false,
    anyPolicyChangeRequiresNewContractVersion: true,
    failedCandidateMayNotBeRelabeledAsPassing: true,
  },
  missingImplementationAndProofBindings: NULL_IMPLEMENTATION_AND_PROOF_BINDINGS,
  actualInstances: NULL_ACTUAL_INSTANCES,
  blockers: [
    "integrated_candidate_solver_program_absent",
    "cross_grid_projection_program_and_source_binding_absent",
    "validated_branch_topology_program_and_source_binding_absent",
    "boundary_remainders_program_and_source_binding_absent",
    "limiting_ground_state_kernel_and_transversality_proofs_absent",
    "radii_polynomial_cover_program_and_receipt_absent",
    "no_fold_proof_program_and_receipt_absent",
    "continuum_sign_proof_program_and_receipt_absent",
    "origin_recurrence_and_majorant_program_and_receipt_absent",
    "tail_recurrence_and_majorant_program_and_receipt_absent",
    "terminal_continuum_residual_replay_program_and_receipt_absent",
    "approved_proof_toolchain_executable_runtime_and_issuer_absent",
    "candidate_initializer_and_four_full_solve_instances_absent",
    "preexecution_literal_self_seal_pending_parent_acknowledgement",
    "execution_replay_pair_output_registry_and_certificate_absent",
  ],
  selfSealPolicy: {
    semanticDomainSeparatedSealRequired: true,
    plainCanonicalHashRequiredAndDistinctlyNamed: true,
    expectedLiteralsExcludedFromSemanticPayload: true,
    expectedSemanticPlainAndSizeLiteralsPending: true,
    independentParentRecomputationAndAcknowledgementRequiredBeforePin: true,
    literalPinningMustOccurBeforeAnyCandidateExecution: true,
    observedRawBinding: null,
  },
  authorityLocks: AUTHORITY_LOCKS,
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1 =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2BranchSelectionNumericsV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1;

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1);
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_SEMANTIC_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-branch-selection-numerics/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_SEMANTIC_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_SEMANTIC_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_PLAIN_CANONICAL_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_JSON,
    "utf8",
  );

// Frozen only after the parent independently recomputed and explicitly
// acknowledged all three narrow P2 determinant-metadata repair values. These
// literals are outside the canonical semantic payload.
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_SEMANTIC_SHA256:
  string | null =
  "221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa";
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_PLAIN_CANONICAL_SHA256:
  string | null =
  "913b9d524071c20669e8f0abfd838ef6daa7b2e17b1bd5775a1fafc1e2282962";
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES:
  number | null = 41_280;
export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_LITERAL_SEAL_STATUS =
  "sealed_after_independent_parent_acknowledgement_of_P2_determinant_metadata_repair_before_candidate_execution" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANDIDATE_ID,
    hashSemantics:
      "domain_separated_semantic_contract_seal_distinct_from_plain_canonical_hash_and_observed_raw_binding" as const,
    semanticSha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_SEMANTIC_SHA256_DOMAIN,
    semanticSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_SEMANTIC_SHA256,
    plainCanonicalSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_PLAIN_CANONICAL_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
    observedRawBinding: null,
    literalSealStatus:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_LITERAL_SEAL_STATUS,
  });

const exactLegacyBinding = (
  binding: Readonly<{ sha256: string; canonicalSizeBytes: number }>,
  pin: Readonly<{ semanticSha256: string; canonicalSizeBytes: number }>,
): boolean =>
  binding.sha256 === pin.semanticSha256 &&
  binding.canonicalSizeBytes === pin.canonicalSizeBytes;

const allNullLeaves = (value: unknown): boolean => {
  if (value === null) return true;
  if (Array.isArray(value)) return value.every(allNullLeaves);
  if (typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).every(allNullLeaves);
};

const assertInvariants = (): void => {
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING_PINS;
  const candidateBinding =
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING;
  const sourcePins =
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS;

  if (
    candidateBinding.semanticSha256 !==
      pins.finalCandidateFreezeV2.semanticSha256 ||
    candidateBinding.plainCanonicalSha256 !==
      pins.finalCandidateFreezeV2.plainCanonicalSha256 ||
    candidateBinding.canonicalSizeBytes !==
      pins.finalCandidateFreezeV2.canonicalSizeBytes ||
    !exactLegacyBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING,
      pins.branchExecutionPolicy,
    ) ||
    !exactLegacyBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
      pins.branchSolverPolicy,
    ) ||
    !exactLegacyBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
      pins.radialPrimaryNumerics,
    ) ||
    !exactLegacyBinding(
      NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING,
      pins.branchBvp,
    )
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_v2_branch_selection_numerics_v1_dependency_pin_drift",
    );
  }

  if (
    sourcePins.length !== 11 ||
    sourcePins.some((pin, ordinal) => pin.ordinal !== ordinal) ||
    new Set(sourcePins.map((pin) => pin.relativePath)).size !== 11 ||
    new Set(sourcePins.map((pin) => pin.sha256)).size !== 11 ||
    CONTRACT.existingFiniteSolverSourceClosure.files !== sourcePins
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_v2_branch_selection_numerics_v1_source_closure_drift",
    );
  }

  const decisionDimensions = POLICY_DECISION_LEDGER.map(
    (entry) => entry.dimension,
  );
  if (
    decisionDimensions.length !== 44 ||
    new Set(decisionDimensions).size !== decisionDimensions.length ||
    POLICY_DECISION_LEDGER.some(
      (entry, ordinal) =>
        entry.ordinal !== ordinal ||
        entry.decisionClass !== NEW_POLICY_DECISION ||
        entry.priorDiagnosticPresenceIsNotJustification !== true ||
        entry.passEvidenceInspectedOrUsed !== false ||
        entry.derivedErrorBoundClaimed !== false,
    )
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_v2_branch_selection_numerics_v1_decision_ledger_drift",
    );
  }

  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1;
  const levels = contract.frozenGridAndChronologyPolicy.levels;
  const expectedLiterals = [
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_SEMANTIC_SHA256,
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  ];
  if (
    contract.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2.selectedCandidateIdentity
        .candidateId ||
    levels.map((level) => level.nodeCount).join(",") !== "64,96,128,256" ||
    contract.frozenGridAndChronologyPolicy.exactLevelCount !== 4 ||
    contract.frozenGridAndChronologyPolicy
      .everyLevelIsAnIndependentFullSolve !== true ||
    contract.frozenGridAndChronologyPolicy.amplitudeScheduleExact.join(",") !==
      "2^-16,2^-15,2^-14,2^-13,2^-12,2^-11,2^-10" ||
    contract.statePackingAndProjectionPolicy.adjacentPairOrder.join(",") !==
      "64_to_96,96_to_128,128_to_256" ||
    contract.crossGridConvergencePolicy.requiredConsecutivePairCount !== 3 ||
    contract.continuousVacuumConnectionPolicy.fixedRadiiPolynomialCover
      .exactParameterCellCount !== 1_024 ||
    contract.continuousVacuumConnectionPolicy.fixedRadiiPolynomialCover
      .exactOrderedRadiusExponentSet.length !== 73 ||
    contract.continuumPositivityAndMonotonicityPolicy.interiorDomain
      .exactEqualAffineCellCount !== 4_096 ||
    contract.originRecurrenceAndRemainderPolicy.finiteRepresentativeThrough !==
      "x^12" ||
    contract.tailRecurrenceAndRemainderPolicy.emittedRepresentative
      .metricSeriesThrough !== "z^8" ||
    contract.tailRecurrenceAndRemainderPolicy.scalarScaleNormalization
      .outerPrincipalAmplitude !== "C>0" ||
    contract.tailRecurrenceAndRemainderPolicy.scalarScaleNormalization
      .scalarCorrectionLeadingCoefficientValue !== 1 ||
    contract.tailRecurrenceAndRemainderPolicy.scalarScaleNormalization
      .independentCAndC0RescalingAllowed !== false ||
    contract.tailRecurrenceAndRemainderPolicy.internalNonEmittedMetricProofScratch.exactCoefficientNames.join(
      ",",
    ) !== "A_9,B_9" ||
    contract.tailRecurrenceAndRemainderPolicy
      .internalNonEmittedMetricProofScratch.futureProofReceiptBinding !==
      null ||
    contract.tailRecurrenceAndRemainderPolicy.algebraicMetricDiagonalRecurrence.diagonalRowOrder.join(
      ",",
    ) !== "BnRow,AnBnRow" ||
    contract.tailRecurrenceAndRemainderPolicy.algebraicMetricDiagonalRecurrence.diagonalUnknownOrder.join(
      ",",
    ) !== "B_n,A_n" ||
    contract.tailRecurrenceAndRemainderPolicy.algebraicMetricDiagonalRecurrence
      .diagonalDeterminant !== "+2*n^3*(n-1)" ||
    contract.tailRecurrenceAndRemainderPolicy.parameterAndDomainClosure
      .coulombParameter !== "q=M*kappa/2" ||
    contract.tailRecurrenceAndRemainderPolicy.parameterAndDomainClosure
      .coulombParameterDomain !== "0<q<64" ||
    contract.tailRecurrenceAndRemainderPolicy.physicalXDerivativeOperators
      .second !== "d2/dx2=kappa^2*(z^4*d2/dz2+2*z^3*d/dz)" ||
    contract.tailRecurrenceAndRemainderPolicy.scalarCompatibilityAndDiagonalChronology.exactChronology.at(
      -1,
    ) !==
      "solve_C_8_from_exact_Klein_Gordon_z^9_only_after_A_9_and_B_9_are_bound" ||
    contract.separateResidualAndConstraintGatePolicy
      .residualAndConstraintGatesAreSeparate !== true ||
    !allNullLeaves(contract.missingImplementationAndProofBindings) ||
    !allNullLeaves(contract.actualInstances) ||
    Object.values(contract.authorityLocks).some((value) => value !== false) ||
    expectedLiterals.some((value) => value === null) ||
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_SEMANTIC_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_SEMANTIC_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_PLAIN_CANONICAL_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_PLAIN_CANONICAL_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES ||
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_LITERAL_SEAL_STATUS !==
      "sealed_after_independent_parent_acknowledgement_of_P2_determinant_metadata_repair_before_candidate_execution"
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_v2_branch_selection_numerics_v1_authority_or_policy_invariant",
    );
  }
};

assertInvariants();

export const nhm2SphericalBosonStarV2BranchSelectionNumericsV1WireViolations = (
  wire: unknown,
): string[] => {
  if (typeof wire !== "string") {
    return [
      "spherical_v2_branch_selection_numerics_v1_wire_must_be_primitive_string",
    ];
  }
  if (
    wire.length >
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_VALIDATOR_LIMITS.maximumWireUtf16CodeUnits
  ) {
    return ["spherical_v2_branch_selection_numerics_v1_wire_utf16_limit"];
  }
  if (
    Buffer.byteLength(wire, "utf8") >
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_VALIDATOR_LIMITS.maximumWireUtf8Bytes
  ) {
    return ["spherical_v2_branch_selection_numerics_v1_wire_utf8_limit"];
  }
  return wire ===
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_JSON
    ? []
    : ["spherical_v2_branch_selection_numerics_v1_canonical_wire_mismatch"];
};

export const isNhm2SphericalBosonStarV2BranchSelectionNumericsV1Wire = (
  wire: unknown,
): wire is string =>
  nhm2SphericalBosonStarV2BranchSelectionNumericsV1WireViolations(wire)
    .length === 0;

export const cloneNhm2SphericalBosonStarV2BranchSelectionNumericsV1CanonicalWire =
  (): string =>
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_JSON;
