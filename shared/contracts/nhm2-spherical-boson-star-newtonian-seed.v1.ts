import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256,
} from "./nhm2-spherical-boson-star-1s-v3-tolerance-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256,
} from "./nhm2-spherical-boson-star-branch-bvp.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
} from "./nhm2-spherical-boson-star-coherent-candidate-plan.v1";

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_newtonian_seed" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_newtonian_seed/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANDIDATE_ID =
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID;

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING_PINS =
  Object.freeze({
    candidateSha256:
      "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
    candidateCanonicalSizeBytes: 93214,
    toleranceSha256:
      "867d96458940149f386d7153dff06c95ae336af222f5f42d8903fb18a728448d",
    toleranceCanonicalSizeBytes: 6302,
    branchBvpSha256:
      "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
    branchBvpCanonicalSizeBytes: 13847,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BLOCKERS =
  Object.freeze([
    "radial_solver_operation_policy_absent",
    "tail_representative_and_outward_remainder_operation_policy_absent",
    "directed_interval_proof_kernel_absent",
    "complete_convergence_gate_and_interval_budget_policy_absent",
    "seed_output_descriptor_and_replay_inventory_absent",
    "source_toolchain_executable_and_runtime_closure_absent",
    "candidate_manifest_and_preexecution_preseal_absent",
    "newtonian_seed_not_executed",
    "composite_continuum_not_replayed",
    "relativistic_spherical_branch_not_solved",
    "metric_demand_nondegeneracy_receipt_absent",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 28,
    maximumNodes: 8192,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 256,
    maximumStringUtf8Bytes: 16384,
  } as const);

const LEVELS = Object.freeze([
  Object.freeze({
    id: "L0",
    radialNodeCount: 64,
    solveScheduled: true,
    resamplingScheduled: false,
    executionObserved: false,
    accepted: false,
  }),
  Object.freeze({
    id: "L1",
    radialNodeCount: 96,
    solveScheduled: true,
    resamplingScheduled: false,
    executionObserved: false,
    accepted: false,
  }),
  Object.freeze({
    id: "L2",
    radialNodeCount: 128,
    solveScheduled: true,
    resamplingScheduled: false,
    executionObserved: false,
    accepted: false,
  }),
  Object.freeze({
    id: "AUDIT",
    radialNodeCount: 256,
    solveScheduled: false,
    resamplingScheduled: true,
    executionObserved: false,
    accepted: false,
  }),
] as const);

const ARRAY_ROLES = Object.freeze([
  "rho_nodes",
  "base_scalar_u0",
  "base_potential_V0",
  "target_scalar_u_star",
  "target_potential_V_star",
] as const);

const SCALAR_METADATA_ROLES = Object.freeze([
  "nu0",
  "Vc",
  "N0",
  "C",
  "kappa",
  "sigma",
  "lambda",
  "nu_star",
  "wSeed",
] as const);

const ARRAY_ROLE_SOURCE_MATRIX = Object.freeze([
  Object.freeze({
    levelId: "L0",
    rho_nodes: "frozen_L0_mapped_nodes",
    base_scalar_u0:
      "accepted_L0_postprojected_solve_polynomial_nodal_values_with_authority_only_on_x<=32",
    base_potential_V0:
      "accepted_L0_postprojected_solve_polynomial_nodal_values_with_authority_only_on_x<=32",
    target_scalar_u_star:
      "direct_resample_of_the_final_verified_L2_base_composite_after_exact_lambda_scaling_not_an_L0_target_solve",
    target_potential_V_star:
      "direct_resample_of_the_final_verified_L2_base_composite_after_exact_lambda_scaling_not_an_L0_target_solve",
  }),
  Object.freeze({
    levelId: "L1",
    rho_nodes: "frozen_L1_mapped_nodes",
    base_scalar_u0:
      "accepted_L1_postprojected_solve_polynomial_nodal_values_with_authority_only_on_x<=32",
    base_potential_V0:
      "accepted_L1_postprojected_solve_polynomial_nodal_values_with_authority_only_on_x<=32",
    target_scalar_u_star:
      "direct_resample_of_the_final_verified_L2_base_composite_after_exact_lambda_scaling_not_an_L1_target_solve",
    target_potential_V_star:
      "direct_resample_of_the_final_verified_L2_base_composite_after_exact_lambda_scaling_not_an_L1_target_solve",
  }),
  Object.freeze({
    levelId: "L2",
    rho_nodes: "frozen_L2_mapped_nodes",
    base_scalar_u0:
      "accepted_L2_postprojected_solve_polynomial_nodal_values_defining_the_core_reconstruction_only_on_x<=32",
    base_potential_V0:
      "accepted_L2_postprojected_solve_polynomial_nodal_values_defining_the_core_reconstruction_only_on_x<=32",
    target_scalar_u_star:
      "direct_resample_of_the_final_verified_L2_base_composite_after_exact_lambda_scaling_not_an_independent_target_solve",
    target_potential_V_star:
      "direct_resample_of_the_final_verified_L2_base_composite_after_exact_lambda_scaling_not_an_independent_target_solve",
  }),
  Object.freeze({
    levelId: "AUDIT",
    rho_nodes: "frozen_AUDIT_mapped_nodes",
    base_scalar_u0:
      "direct_resample_of_the_final_verified_L2_core_plus_tail_base_composite",
    base_potential_V0:
      "direct_resample_of_the_final_verified_L2_core_plus_tail_base_composite",
    target_scalar_u_star:
      "direct_resample_of_the_same_verified_base_composite_after_exact_lambda_scaling",
    target_potential_V_star:
      "direct_resample_of_the_same_verified_base_composite_after_exact_lambda_scaling",
  }),
] as const);

const AUTHORITY_BOUNDARY = Object.freeze({
  candidateAuthority: false,
  scientificCandidateAdmissible: false,
  seedSemanticAuthority: false,
  solverAuthority: false,
  tailAuthority: false,
  intervalProofAuthority: false,
  issuerAuthority: false,
  builderAuthority: false,
  executionAuthority: false,
  seedArtifactAuthority: false,
  relativisticBranchAuthority: false,
  nondegeneracyAuthority: false,
  scientificPresealAuthority: false,
  runReplayAuthority: false,
  pairAgreementAuthority: false,
  semiclassicalStressNoiseLamp: false,
  semiclassicalConstraintAlgebraLamp: false,
  diagnosticPass: false,
  theoryGraphAuthority: false,
  physicalViability: false,
  propulsion: false,
  transport: false,
} as const);

const UNRESOLVED_EXECUTION = Object.freeze({
  solverOperationPolicy: null,
  tailOperationPolicy: null,
  intervalProofPolicy: null,
  sourceManifest: null,
  toolchainManifest: null,
  executableBinding: null,
  runtimeBinding: null,
  issuer: null,
  builder: null,
  executionCommand: null,
  executionReceipt: null,
  outputDescriptor: null,
  outputArrays: null,
  coreReplayReceipt: null,
  tailReplayReceipt: null,
  originReplayReceipt: null,
  continuousPositivityReceipt: null,
  continuousMonotonicityReceipt: null,
  continuousNegativePotentialReceipt: null,
  convergenceReceipt: null,
  targetScalingReceipt: null,
  coulombConsistencyReceipt: null,
  globalIdentityReceipt: null,
  bvpInitializerReceipt: null,
  seedResult: null,
} as const);

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_ARTIFACT_ID,
  contractVersion: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CONTRACT_VERSION,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANDIDATE_ID,
  authority: "preexecution_initializer_semantics_only",
  maturity: "stage_2_frozen_radial_seed_without_execution_or_proof_authority",
  frozenBeforeExecution: true,
  bindings: {
    candidate: {
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING_PINS.candidateSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING_PINS.candidateCanonicalSizeBytes,
    },
    tolerance: {
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING_PINS.toleranceSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING_PINS.toleranceCanonicalSizeBytes,
    },
    branchBvp: {
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING_PINS.branchBvpSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING_PINS.branchBvpCanonicalSizeBytes,
    },
  },
  branchIdentity: {
    quantumNumbers: { N: 1, ell: 0, m: 0 },
    radialNodeCount: 0,
    parity: "spherical_even",
    phase: "u0_at_origin_strictly_positive",
    distinctFromObservedProlateLineage: true,
    failedLimitDisposition: "fail_candidate_without_retuning_or_fallback",
  },
  nondimensionalization: {
    x: "mu*r",
    u: "sqrt(8*pi*G)*phi_equal_to_the_weak_field_limit_of_varphi",
    V: "Newtonian_limit_of_F0_with_V_at_infinity_zero",
    nu: "((omega/mu)^2-1)/2",
    couplingAppearsInDimensionlessSeedPde: false,
  },
  radialSchrodingerPoissonProblem: {
    domain: "x_in_[0,infinity)",
    unknowns: ["u0(x)", "V0(x)", "nu0"],
    radialLaplacian: "Delta_radial(q)=q_double_prime+(2/x)*q_prime",
    schrodingerResidual: "R_S=-(1/2)*(u_double_prime+2*u_prime/x)+(V-nu)*u",
    poissonResidual: "R_P=V_double_prime+2*V_prime/x-u^2",
    boundaryConditions: [
      "u_prime(0)=0",
      "V_prime(0)=0",
      "u(infinity)=0",
      "V(infinity)=0",
      "u(0)=1",
    ],
    baseGauge: {
      centralScalarExact: "1",
      centralScalar: 1,
      nu0IsSolvedEigenvalue: true,
      nu0Domain: "nu0<0",
      baseNuNeedNotSatisfyRelativisticFrequencyDomain: true,
      vacuumRootExcludedByCentralScalarEquation: true,
    },
    signConditions: {
      uStrictlyPositiveAtEveryFiniteX: true,
      uPrimeStrictlyNegativeAtEveryFiniteXGreaterThanZero: true,
      VStrictlyNegativeAtEveryFiniteX: true,
      noSecondaryExtremumOrNode: true,
    },
    singularCoordinateTermsUseRegularSeriesOnly: true,
  },
  exactScalingToFrozenCandidate: {
    targetCentralAmplitudeExact: "2^-10",
    targetCentralAmplitude: 2 ** -10,
    lambdaExact: "2^-5",
    lambda: 2 ** -5,
    derivation: "lambda=sqrt((2^-10)/1)=2^-5",
    scalar: "u_star(x)=lambda^2*u0(lambda*x)",
    potential: "V_star(x)=lambda^2*V0(lambda*x)",
    eigenvalue: "nu_star=lambda^2*nu0=2^-10*nu0",
    frequencyInitializer: "wSeed=sqrt(1+2*nu_star)",
    hardDomain: "-1/2<nu_star<0_and_0<wSeed<1",
    compactPullback: "rho_lambda=lambda*rho/(1-(1-lambda)*rho)",
    relativisticBvpMustResolveFrequencyAgain: true,
    frequencyInitializerHasNoBranchAuthority: true,
    oneTargetOnly: true,
    continuousCandidateNormalizationGate: {
      equality: "max_(x>=0)|u_star(x)|=u_star(0)=2^-10",
      proofOrder:
        "evaluate_only_after_continuous_u_star>0_and_u_star_prime<0_for_every_x>0_are_proved",
      nodalOrOriginValueAloneIsSufficient: false,
      established: false,
    },
  },
  regularOriginSeries: {
    convention: "u=sum_n>=0 a_(2n)*x^(2n)_and_V=sum_n>=0 b_(2n)*x^(2n)",
    a0: "A=1",
    b0: "Vc",
    delta: "delta=Vc-nu0",
    explicitCoefficients: {
      a2: "A*delta/3",
      a4: "A*(2*delta^2+A^2)/60",
      b2: "A^2/6",
      b4: "A^2*delta/30",
    },
    exactRecurrence: {
      a2nPlus2: "2*(sum_(k=0)^n b_(2k)*a_(2(n-k))-nu0*a_(2n))/((2n+2)*(2n+3))",
      b2nPlus2: "sum_(k=0)^n a_(2k)*a_(2(n-k))/((2n+2)*(2n+3))",
    },
    monotonicFactoredField: "h(x)=-u_prime(x)/x",
    regularMonotonicLimit: "h(0)=-2*A*delta/3",
    requiredOriginSign: "delta<0_and_h(0)>0",
    targetCoefficientScaling:
      "a_star_(2n)=lambda^(2+2n)*a_(2n)_and_b_star_(2n)=lambda^(2+2n)*b_(2n)",
    symbolicDerivationReceipt: null,
    independentReplayReceipt: null,
  },
  compactCore: {
    compactification: {
      forward: "rho=x/(1+x)",
      inverse: "x=rho/(1-rho)",
      firstDerivative: "partial_x=(1-rho)^2*partial_rho",
      secondDerivative:
        "partial_x^2=(1-rho)^4*partial_rho^2-2*(1-rho)^3*partial_rho",
    },
    mappedNodes: "rho_j=(1-cos(pi*j/(Nr-1)))/2",
    mappedNodeSerialization:
      "successor_operation_policy_must_freeze_MPFR256_generation_each_named_get_d_RN_even_barrier_and_exact_f64le_bits_before_execution",
    levels: LEVELS,
    scheduledSolveOrder: ["L0", "L1", "L2"],
    auditIsResamplingOnly: true,
    baseCoreMaximumX: 32,
    baseCoreMaximumRhoExact: "32/33",
    baseCoreMaximumRho: 32 / 33,
    polynomialAuthority:
      "accepted_L2_radial_Chebyshev_reconstruction_only_on_0<=x<=32",
    rawPolynomialBeyondCoreHasContinuumAuthority: false,
    rawPolynomialMaySupplyGlobalIntegralsOrTailClaims: false,
    endpointPolynomialDirichletRowsAreDiagnosticsOnly: true,
  },
  compositeExterior: {
    soleGlobalContinuum:
      "accepted_L2_core_on_x<=32_C1_joined_to_the_verified_Coulomb_exponential_tail_on_x>=32",
    baseJoinX: 32,
    baseJoinRhoExact: "32/33",
    targetJoinX: 1024,
    targetJoinRhoExact: "1024/1025",
    targetCompositeIsExactScalingOfWholeBaseComposite: true,
    exactValueAndFirstDerivativeEqualityAtJoinRequired: true,
    kappa: "sqrt(-2*nu0)>0",
    fullParticleNumber: "N0=4*pi*integral_0^infinity x^2*u0(x)^2*dx",
    coulombCoefficient: "C=N0/(4*pi)>0",
    potentialPrincipalTail:
      "V0(x)=-C/x_plus_an_exponentially_small_sourced_correction",
    scalarPrincipalTail:
      "u0(x)_has_the_formal_asymptotic_principal_sector_exp(-kappa*x)*x^sigma*sum_(n>=0)c_n*x^-n_plus_sourced_exponential_remainders",
    principalSectorSemantics:
      "formal_asymptotic_sector_only_not_an_assumed_convergent_infinite_sum_and_never_a_value_evaluator",
    sigma: "C/kappa-1",
    principalRecurrence: "c_(n+1)=-((sigma-n)*(sigma-n+1)/(2*kappa*(n+1)))*c_n",
    principalLeadingCoefficientStrictlyPositive: true,
    recurrenceDoesNotEraseSourcedExponentialRemainders: true,
    valueEvaluatorAuthority:
      "only_the_future_finite_representative_plus_directed_outward_remainder_may_define_tail_values",
    finiteTailRepresentativePolicy: null,
    outwardRemainderPolicy: null,
    coulombConsistencyReceipt: null,
    C1JoinReceipt: null,
    tailResidualReceipt: null,
    established: false,
  },
  observablesAndIdentities: {
    authoritySubject: "verified_composite_continuum_only",
    definitions: {
      N: "4*pi*integral_0^infinity x^2*u^2*dx",
      T: "2*pi*integral_0^infinity x^2*(u_prime)^2*dx",
      W: "2*pi*integral_0^infinity x^2*V*u^2*dx",
      potentialGradient: "4*pi*integral_0^infinity x^2*(V_prime)^2*dx",
      gaussFlux: "4*pi*limit_x_to_infinity(x^2*V_prime)",
    },
    identities: [
      "2*T+W=0",
      "nu*N=T+2*W",
      "potentialGradient+2*W=0",
      "gaussFlux=N",
    ],
    coreOnlyComparisonXMaximum: 32,
    endpointLimitsMustBeAnalytic: true,
  },
  frozenNumericalRails: {
    status:
      "frozen_upper_bounds_only_incomplete_until_the_successor_operation_output_and_interval_policy_freezes_every_definition_and_work_budget",
    productionSchrodingerNormalizedLInfMaximum: 1e-10,
    productionPoissonNormalizedLInfMaximum: 1e-10,
    auditSchrodingerNormalizedLInfMaximum: 1e-10,
    auditPoissonNormalizedLInfMaximum: 1e-10,
    boundaryLInfMaximum: 1e-12,
    targetAmplitudeAbsoluteErrorMaximumExact: "2^-30",
    targetAmplitudeAbsoluteErrorMaximum: 2 ** -30,
    targetScalingRelativeLInfMaximum: 1e-12,
    L1ToL2FieldRelativeLInfMaximum: 1e-8,
    L1ToL2CoreObservableRelativeMaximum: 1e-9,
    D01OverD12Minimum: 4,
    D12ZeroRule: "if_D12_is_zero_D01_must_be_zero",
    radialSpectralTailRelativeMaximum: 1e-10,
    globalIdentityRelativeMaximum: 1e-9,
    angularTailGatePresent: false,
    continuousPositivityAndMonotonicityProofRequired: true,
    unresolvedIntervalIsFailure: true,
  },
  convergenceAndGateDefinitions: {
    fieldDifference:
      "D_ab=max_(q_in_{u0,V0})(normInf_on_0<=x<=32(q_b-prolong_a_to_b(q_a))/max(normInf_on_0<=x<=32(q_b),1e-300))",
    differenceRatio:
      "if_D12>0_require_D01/D12>=4;_if_D12=0_require_D01=0_and_differenceRatio=0",
    L1ToL2FieldRelativeLInf: "bitwise_equal_to_D12",
    coreObservableDifference:
      "max_(q_in_{A32,N32,T32,W32})(abs(q_L2-q_L1)/max(abs(q_L2),1e-300))_with_every_integral_truncated_at_x=32",
    radialSpectralTail:
      "for_each_of_u0_and_V0_at_each_solved_level_max_abs_last_8_radial_Chebyshev_coefficients/max_abs_all_radial_Chebyshev_coefficients_with_zero_denominator_passing_only_when_all_coefficients_are_exact_positive_zero",
    boundaryTupleOrder: [
      "u0_prime_at_origin",
      "V0_prime_at_origin",
      "u0_at_infinity",
      "V0_at_infinity",
      "u0_at_origin_minus_1",
      "base_core_tail_u_value_jump_at_x=32",
      "base_core_tail_u_first_derivative_jump_at_x=32",
      "base_core_tail_V_value_jump_at_x=32",
      "base_core_tail_V_first_derivative_jump_at_x=32",
    ],
    boundaryGate: "max_abs_of_the_exact_boundary_tuple<=1e-12",
    targetAmplitudeAbsoluteError: "abs(u_star(0)-2^-10)",
    targetScalingRelativeLInf:
      "max_for_q_in_{u,V}_over_the_successor_policy_frozen_evaluator_inventory(abs(q_target-direct_lambda_scaled_base)/max(abs(direct_lambda_scaled_base),1e-300))",
    identityNormalizations: {
      virial: "abs(2*T+W)/(2*T+abs(W))",
      eigenvalue: "abs(nu*N-T-2*W)/(abs(nu)*N+T+2*abs(W))",
      poissonEnergy: "abs(potentialGradient+2*W)/(potentialGradient+2*abs(W))",
      gaussFlux: "abs(gaussFlux-N)/N",
    },
    tailScaledResidualDefinition:
      "must_be_frozen_by_the_successor_operation_policy_together_with_the_finite_tail_basis_outward_remainder_and_directed_denominator_enclosures",
    tailScaledResidualThreshold: null,
    intervalCoverCutoffsAndBudgets: null,
    completeNumericalDefinitionFreeze: false,
  },
  normalizedResiduals: {
    schrodinger:
      "abs(R_S)/(1+abs(u_double_prime/2)+abs(u_prime/x)+abs(V*u)+abs(nu*u))",
    poisson: "abs(R_P)/(1+abs(V_double_prime)+abs(2*V_prime/x)+u^2)",
    originUsesExactRegularSeries: true,
    exteriorUsesCompositeTailAndOutwardRemainder: true,
    producerDiagnosticsHavePassAuthority: false,
  },
  relativisticBvpInitializationMap: {
    evaluationSubject:
      "the_final_verified_target_core_plus_tail_composite_resampled_on_the_future_frozen_BVP_grid",
    varphiInit: "varphi_init(x)=u_star(x)",
    F0Init: "F0_init(x)=V_star(x)",
    F1Init: "F1_init(x)=-V_star(x)",
    wInit: "w_init=sqrt(1+2*nu_star)",
    branchBvpMustResolveWAgain: true,
    establishesRelativisticEkgResidualAuthority: false,
    establishesBranchAuthority: false,
    establishesNoFoldAuthority: false,
    establishesMetricDemandAuthority: false,
  },
  deterministicSchedule: {
    beforeAnyExecution:
      "hash_bind_solver_tail_interval_source_toolchain_executable_runtime_and_command",
    steps: [
      "solve_the_u0(0)=1_base_eigenproblem_once_on_L0",
      "prolong_the_accepted_L0_base_to_L1_and_solve_once_without_retuning",
      "prolong_the_accepted_L1_base_to_L2_and_solve_once_without_retuning",
      "construct_and_independently_replay_the_unique_L2_core_plus_tail_composite",
      "scale_the_whole_verified_composite_exactly_by_lambda=2^-5",
      "resample_the_same_base_and_target_composites_on_AUDIT_without_a_fourth_solve",
      "reassemble_every_gate_from_raw_bytes_and_the_verified_composite",
    ],
    retryAfterAnyFailedStageAllowed: false,
    precisionGridTailToleranceOrAlgorithmRetuneAllowed: false,
    alternateInitializerOrBranchFallbackAllowed: false,
    gateOutputMayInfluenceExecution: false,
  },
  outputInventory: {
    levelOrder: ["L0", "L1", "L2", "AUDIT"],
    arrayRoleOrder: ARRAY_ROLES,
    arrayRoleSourceMatrix: ARRAY_ROLE_SOURCE_MATRIX,
    arrayCount: 20,
    encoding: "f64le",
    shapeRule: "each_array_shape_is_[radialNodeCount_for_its_level]",
    exactElementCount: LEVELS.reduce(
      (sum, level) => sum + 5 * level.radialNodeCount,
      0,
    ),
    exactByteCount:
      LEVELS.reduce((sum, level) => sum + 5 * level.radialNodeCount, 0) * 8,
    everyArrayFreshFullNonaliasedView: true,
    everyNumberFiniteAndNegativeZeroForbidden: true,
    descriptorAndCompositeProofReceiptsRequired: true,
    arrays: null,
  },
  outputDescriptorSuccessorRequirements: {
    scalarMetadata: {
      roleOrder: SCALAR_METADATA_ROLES,
      exactCount: 9,
      encoding: "f64le_one_scalar_per_role_in_role_order",
      finiteAndNegativeZeroForbidden: true,
      exactSemantics: {
        nu0: "accepted_base_eigenvalue",
        Vc: "accepted_base_V0_at_x=0",
        N0: "verified_full_composite_particle_number",
        C: "verified_N0/(4*pi)_Coulomb_coefficient",
        kappa: "verified_sqrt(-2*nu0)",
        sigma: "verified_C/kappa-1",
        lambda: "exact_2^-5",
        nu_star: "exact_lambda^2*nu0",
        wSeed: "verified_sqrt(1+2*nu_star)",
      },
    },
    mandatoryReplayPayloadsInExactFutureOrder: [
      "literal_output_descriptor",
      "nine_scalar_metadata_f64le_values",
      "twenty_level_role_f64le_arrays",
      "L0_L1_L2_core_Chebyshev_coefficient_arrays",
      "finite_tail_representative_coefficient_arrays_and_C",
      "directed_outward_remainder_and_interval_cover_records",
      "origin_recurrence_replay_records",
      "core_tail_C1_and_full_mass_consistency_records",
      "continuous_positivity_monotonicity_and_negative_potential_records",
      "global_identity_and_target_scaling_records",
      "BVP_initializer_resampling_records",
    ],
    lengthDelimitedSha256Recipe:
      "successor_policy_must_freeze_domain_separator_utf8_role_path_utf8_byte_length_u64le_and_payload_bytes_for_every_payload",
    descriptorSchemaBinding: null,
    coreCoefficientInventoryBinding: null,
    tailRepresentativeInventoryBinding: null,
    remainderRecordSchemaBinding: null,
    proofOperandInventoryBinding: null,
    completeBeforeExecution: false,
  },
  executionBoundary: {
    solverOperationPolicyRequiredBeforeExecution: true,
    tailOperationPolicyRequiredBeforeExecution: true,
    directedIntervalProofPolicyRequiredBeforeExecution: true,
    implementationAndRuntimeClosureRequiredBeforeExecution: true,
    thisContractAuthorizesFuturePolicyValues: false,
    solverImplemented: false,
    executionAuthorized: false,
    executionPresent: false,
    outputPresent: false,
    structurallyAdmissible: false,
  },
  blockers: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BLOCKERS,
  unresolvedExecution: UNRESOLVED_EXECUTION,
  authorityBoundary: AUTHORITY_BOUNDARY,
  claimLockKeys:
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN.claimLockKeys,
  claimLocks: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN.claimLocks,
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

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1 = deepFreeze(CONTRACT);

const assertInvariants = (): void => {
  const pins = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING_PINS;
  if (
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256 !==
      pins.candidateSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES !==
      pins.candidateCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256 !==
      pins.toleranceSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_SIZE_BYTES !==
      pins.toleranceCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256 !== pins.branchBvpSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES !==
      pins.branchBvpCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY.candidateId !==
      CONTRACT.candidateId ||
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1.candidateBinding.candidateId !==
      CONTRACT.candidateId ||
    CONTRACT.exactScalingToFrozenCandidate.lambda !== 2 ** -5 ||
    CONTRACT.compactCore.levels.some(
      (level) => level.executionObserved !== false || level.accepted !== false,
    ) ||
    CONTRACT.compactCore.levels[3].solveScheduled !== false ||
    CONTRACT.compactCore.levels[3].resamplingScheduled !== true ||
    CONTRACT.outputInventory.arrayCount !== 20 ||
    CONTRACT.outputInventory.exactElementCount !== 2720 ||
    CONTRACT.outputInventory.exactByteCount !== 21760 ||
    CONTRACT.outputDescriptorSuccessorRequirements.scalarMetadata.exactCount !==
      9 ||
    CONTRACT.outputDescriptorSuccessorRequirements.completeBeforeExecution !==
      false ||
    CONTRACT.compositeExterior.established !== false ||
    CONTRACT.executionBoundary.executionAuthorized !== false ||
    Object.values(CONTRACT.authorityBoundary).some(
      (value) => value !== false,
    ) ||
    Object.values(CONTRACT.claimLocks).some((value) => value !== false) ||
    Object.values(CONTRACT.unresolvedExecution).some((value) => value !== null)
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_newtonian_seed_v1_invariant_violation",
    );
  }
};

assertInvariants();

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;
type SnapshotBudget = { visitedNodes: number };

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
  budget: SnapshotBudget = { visitedNodes: 0 },
): SnapshotResult => {
  const limits = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_depth_limit:${pointer || "/"}`,
    });
  }
  budget.visitedNodes += 1;
  if (budget.visitedNodes > limits.maximumNodes) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_node_limit:${pointer || "/"}`,
    });
  }
  if (value === null || typeof value === "boolean") {
    return Object.freeze({ ok: true, value });
  }
  if (typeof value === "string") {
    return Buffer.byteLength(value, "utf8") <= limits.maximumStringUtf8Bytes
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `string_byte_length_limit:${pointer || "/"}`,
        });
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `invalid_number:${pointer || "/"}`,
        });
  }
  if (typeof value !== "object") {
    return Object.freeze({
      ok: false,
      violation: `non_json_value:${pointer || "/"}`,
    });
  }
  if (isProxy(value)) {
    return Object.freeze({
      ok: false,
      violation: `proxy_forbidden:${pointer || "/"}`,
    });
  }
  if (ancestors.has(value)) {
    return Object.freeze({
      ok: false,
      violation: `cyclic_value:${pointer || "/"}`,
    });
  }
  ancestors.add(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      return Object.freeze({
        ok: false,
        violation: `non_plain_array:${pointer || "/"}`,
      });
    }
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    const length =
      lengthDescriptor != null && "value" in lengthDescriptor
        ? lengthDescriptor.value
        : null;
    if (
      typeof length !== "number" ||
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > limits.maximumArrayLength
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_length_limit:${pointer || "/"}`,
      });
    }
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string")) {
      return Object.freeze({
        ok: false,
        violation: `symbol_key:${pointer || "/"}`,
      });
    }
    const indexKeys = (keys as string[]).filter((key) => key !== "length");
    if (
      keys.length !== length + 1 ||
      indexKeys.length !== length ||
      indexKeys.some((key) => {
        if (!/^(0|[1-9][0-9]*)$/.test(key)) return true;
        const index = Number(key);
        return !Number.isSafeInteger(index) || index < 0 || index >= length;
      })
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_surface:${pointer || "/"}`,
      });
    }
    const output: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return Object.freeze({
          ok: false,
          violation: `array_entry_surface:${pointer}/${index}`,
        });
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
        depth + 1,
        budget,
      );
      if (!nested.ok) return nested;
      output.push(nested.value);
    }
    ancestors.delete(value);
    return Object.freeze({ ok: true, value: output });
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return Object.freeze({
      ok: false,
      violation: `non_plain_object:${pointer || "/"}`,
    });
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    return Object.freeze({
      ok: false,
      violation: `symbol_key:${pointer || "/"}`,
    });
  }
  if (keys.length > limits.maximumObjectPropertyCount) {
    return Object.freeze({
      ok: false,
      violation: `object_property_count_limit:${pointer || "/"}`,
    });
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    if (FORBIDDEN_KEYS.has(key)) {
      return Object.freeze({
        ok: false,
        violation: `forbidden_key:${pointer}/${key}`,
      });
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      return Object.freeze({
        ok: false,
        violation: `object_property_surface:${pointer}/${key}`,
      });
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
      depth + 1,
      budget,
    );
    if (!nested.ok) return nested;
    Object.defineProperty(output, key, {
      value: nested.value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  ancestors.delete(value);
  return Object.freeze({ ok: true, value: output });
};

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

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1);
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-newtonian-seed/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256 = createHash(
  "sha256",
)
  .update(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256_DOMAIN, "utf8")
  .update(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON, "utf8")
  .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANDIDATE_ID,
    sha256Domain: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_SHA256: string =
  "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c";
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_CANONICAL_SIZE_BYTES: number = 18894;

if (
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_boson_star_newtonian_seed_v1_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES}`,
  );
}

const EXPECTED_CANONICAL_JSON =
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON;

export const nhm2SphericalBosonStarNewtonianSeedV1Violations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1) return [];
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["spherical_newtonian_seed_v1_plain_data_snapshot_invalid"];
  }
  if (!snapshot.ok) return [snapshot.violation];
  try {
    return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
      ? ["spherical_newtonian_seed_v1_external_copy_not_authoritative"]
      : ["spherical_newtonian_seed_v1_semantic_mismatch"];
  } catch {
    return ["spherical_newtonian_seed_v1_plain_data_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarNewtonianSeedV1 = (
  value: unknown,
): value is typeof NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1 =>
  value === NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1;
