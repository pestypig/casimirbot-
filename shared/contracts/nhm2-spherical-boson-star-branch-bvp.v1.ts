import { createHash } from "node:crypto";

import {
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
} from "./nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_ID,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_SIZE_BYTES,
} from "./nhm2-spherical-boson-star-1s-v3-tolerance-policy.v1";

export const NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_branch_bvp" as const;
export const NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_branch_bvp/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_ANALYTIC_FORM_VERSION =
  "nhm2_spherical_boson_star_1s_radial_ekg_residual/v1" as const;

export const NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING_PINS =
  Object.freeze({
    candidateSha256:
      "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
    candidateCanonicalSizeBytes: 93214,
    tolerancePolicySha256:
      "867d96458940149f386d7153dff06c95ae336af222f5f42d8903fb18a728448d",
    tolerancePolicyCanonicalSizeBytes: 6302,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BLOCKERS = Object.freeze([
  "radial_solver_policy_absent",
  "radial_grid_policy_absent",
  "vacuum_connected_continuation_policy_absent",
  "origin_series_derivation_and_replay_absent",
  "asymptotic_tail_series_derivation_and_replay_absent",
  "branch_monotonicity_and_no_fold_replay_absent",
  "classical_radial_branch_not_executed",
  "candidate_metric_demand_nondegeneracy_receipt_absent",
] as const);

export const NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 8192,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 256,
    maximumStringUtf8Bytes: 8192,
  } as const);

const BRANCH_CLAIM_LOCKS = Object.freeze({
  ...NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN.claimLocks,
  radialResidualAlgebraImplemented: false,
  radialSolverPolicyPresent: false,
  radialGridPolicyPresent: false,
  radialContinuationPolicyPresent: false,
  radialBranchExecuted: false,
  radialBranchConverged: false,
  radialSolvedRowsPassed: false,
  radialUnusedConstraintPassed: false,
  radialOriginSeriesReplayPassed: false,
  radialTailSeriesReplayPassed: false,
  radialFieldPositiveNodelessStrictlyDecreasing: false,
  radialFirstVacuumConnectedBranchEstablished: false,
  radialNoFoldEstablished: false,
  radialBranchAdmissible: false,
} as const);

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_ARTIFACT_ID,
  contractVersion: NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CONTRACT_VERSION,
  authority: "preregistered_radial_ekg_bvp_identity_only",
  maturity: "frozen_equations_and_boundary_duties_no_solver_or_execution",
  solverImplemented: false,
  executionAuthorized: false,
  bindingPins: NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING_PINS,
  candidateBinding: {
    authoritativeSingletonIdentityRequired: true,
    artifactId: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID,
    canonicalBinding: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
    scientificCandidateAdmissible: false,
  },
  tolerancePolicyBinding: {
    authoritativeSingletonIdentityRequired: true,
    artifactId: NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CONTRACT_VERSION,
    policyId: NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_ID,
    canonicalBinding: NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING,
    presealReceipt: null,
    presealed: false,
  },
  sourceKernelReference: {
    relativePath: "tools/nhm2-spherical-boson-star-branch/radial_residual.py",
    analyticFormVersion:
      NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_ANALYTIC_FORM_VERSION,
    role: "non_authoritative_pointwise_diagnostic_implementation_reference",
    sourceSha256: null,
    executableSha256: null,
    solverImplementation: false,
    executionAuthority: false,
  },
  covariantModel: {
    spacetimeSignature: "(-,+,+,+)",
    scalarField: "single_minimally_coupled_complex_scalar",
    scalarMass: "mu>0",
    curvatureCouplingXi: { exact: "0", value: 0 },
    selfCouplingLambda: { exact: "0", value: 0 },
    actionDensity:
      "R/(16*pi*G)-g^ab*(partial_a Phi^*)*(partial_b Phi)-mu^2*Phi^*Phi",
    stressTensor:
      "T_ab=(partial_a Phi^*)(partial_b Phi)+(partial_b Phi^*)(partial_a Phi)-g_ab[(partial_c Phi^*)(partial^c Phi)+mu^2*Phi^*Phi]",
    einsteinEquation: "E^a_b:=G^a_b-8*pi*G*T^a_b=0",
    kleinGordonEquation: "(nabla_a*nabla^a-mu^2)Phi=0",
    declaredLeverOrTileTensorAllowed: false,
  },
  dimensionlessRadialSystem: {
    definitions: {
      x: "mu*r",
      tau: "mu*t",
      w: "omega/mu",
      varphi: "sqrt(8*pi*G)*phi",
    },
    chart: {
      name: "static_spherical_isotropic_chart",
      dimensionlessCoordinates: ["tau", "x", "theta", "varphi_coordinate"],
      radialCoordinateRelation: "x=mu*r",
      angularRanges:
        "theta_in_[0,pi]_and_varphi_coordinate_identified_modulo_2*pi",
      center: "x=0_is_the_regular_center",
      asymptoticEnd: "x_to_infinity_is_the_unique_asymptotically_flat_end",
      horizonOrSecondEndAllowed: false,
    },
    radialDomain: "x_in_[0,infinity)",
    unknownFunctionOrder: ["F0(x)", "F1(x)", "varphi(x)"],
    eigenvalueUnknownOrder: ["w"],
    coordinates: ["tau", "x", "theta", "varphi_coordinate"],
    metricAnsatz:
      "d sbar^2=-exp(2*F0(x))*d tau^2+exp(2*F1(x))*(d x^2+x^2*d theta^2+x^2*sin(theta)^2*d varphi_coordinate^2)",
    scalarAnsatz:
      "Phibar(tau,x)=varphi(x)*exp(-i*w*tau)_with_Phibar=sqrt(8*pi*G)*Phi",
    sphericalIdentity: "F2=F1_and_all_angular_derivatives_are_zero",
    dimensionlessEinsteinEquation: "Ebar^a_b:=Gbar^a_b-Tbar^a_b[varphi,w]=0",
    dimensionlessKleinGordonEquation:
      "KGbar:=(nablaBar_a*nablaBar^a-1)(varphi*exp(-i*w*tau))=0",
    sourceCoefficient: { exact: "1", value: 1 },
    excludedPdeSourceFactors: ["8*pi*G*mu^2"],
    candidateCouplingIsNotDimensionlessPdeInput: true,
    eigenvalueRange: { strictLower: 0, strictUpper: 1 },
  },
  radialJetNotation: {
    prime: "d/dx",
    doublePrime: "d^2/dx^2",
    abbreviations: {
      ap: "F0_prime",
      app: "F0_double_prime",
      bp: "F1_prime",
      bpp: "F1_double_prime",
      p: "varphi",
      pp: "varphi_prime",
      ppp: "varphi_double_prime",
    },
    interiorDomainRequirement: "x>0",
    originEvaluatedOnlyThroughFrozenRegularSeries: true,
  },
  cancellationFreeMixedComponents: {
    evaluationRule:
      "evaluate_each_listed_additive_term_from_finite_radial_jets_then_sum_without_algebraically_cancelling_terms_across_G_T_or_Box",
    einstein: {
      Gt_t: "exp(-2*F1)*(2*F1_double_prime+F1_prime^2+4*F1_prime/x)",
      Gx_x: "exp(-2*F1)*(2*F0_prime*F1_prime+F1_prime^2+2*(F0_prime+F1_prime)/x)",
      Gtheta_theta:
        "exp(-2*F1)*(F0_prime^2+F0_double_prime+F1_double_prime+(F0_prime+F1_prime)/x)",
      Gvarphi_varphi: "Gtheta_theta",
    },
    scalarTerms: {
      timeGradient: "exp(-2*F0)*w^2*varphi^2",
      radialGradient: "exp(-2*F1)*varphi_prime^2",
      massTerm: "varphi^2",
    },
    stress: {
      Tt_t: "-timeGradient-radialGradient-massTerm",
      Tx_x: "timeGradient+radialGradient-massTerm",
      Ttheta_theta: "timeGradient-radialGradient-massTerm",
      Tvarphi_varphi: "Ttheta_theta",
    },
    box: {
      radialBox: "varphi_double_prime+(F0_prime+F1_prime+2/x)*varphi_prime",
      Box_w_varphi: "exp(-2*F1)*radialBox+exp(-2*F0)*w^2*varphi",
    },
    residuals: {
      Et_t: "Gt_t-Tt_t",
      Ex_x: "Gx_x-Tx_x",
      Etheta_theta: "Gtheta_theta-Ttheta_theta",
      Evarphi_varphi: "Etheta_theta",
      KGbar: "Box_w_varphi-varphi",
    },
    finiteArithmeticRequired: true,
    negativeZeroCanonicalizedToPositiveZero: true,
  },
  ellipticResidualSystem: {
    solvedResidualOrder: [
      { id: "einstein_Et_t", equation: "Et_t=0" },
      {
        id: "einstein_Etheta_theta",
        equation: "Etheta_theta=Evarphi_varphi=0",
      },
      { id: "klein_gordon", equation: "KGbar=0" },
    ],
    unusedConstraintOrder: [{ id: "einstein_Ex_x", equation: "Ex_x=0" }],
    sphericalAngularEqualityMustBeReplayed: true,
    componentEvaluationMustUseTheFrozenFormulasAbove: true,
    submittedTargetOrResidualArraysMayBeRead: false,
  },
  residualNormalization: {
    authority: "frozen_formula_only_no_pass_authority",
    denominatorRule:
      "one_plus_sum_of_absolute_magnitudes_of_the_uncancelled_equation_sides",
    solvedRows: [
      {
        id: "einstein_Et_t",
        expression: "abs(Et_t)/(1+abs(Gt_t)+abs(Tt_t))",
      },
      {
        id: "einstein_Etheta_theta",
        expression: "abs(Etheta_theta)/(1+abs(Gtheta_theta)+abs(Ttheta_theta))",
      },
      {
        id: "klein_gordon",
        expression: "abs(KGbar)/(1+abs(Box_w_varphi)+abs(varphi))",
      },
    ],
    unusedConstraintRows: [
      {
        id: "einstein_Ex_x",
        expression: "abs(Ex_x)/(1+abs(Gx_x)+abs(Tx_x))",
      },
    ],
    groupingOrTermSplittingMayChangeDenominator: false,
    numericAcceptanceThresholds: null,
    replayReceipt: null,
    passed: false,
  },
  boundaryConditions: {
    originX0: [
      "F0_prime(0)=0",
      "F1_prime(0)=0",
      "varphi_prime(0)=0",
      "varphi(0)=2^-10",
    ],
    originAmplitude: { exact: "2^-10", value: 2 ** -10 },
    infinity: [
      "limit_x_to_infinity F0(x)=0",
      "limit_x_to_infinity F1(x)=0",
      "limit_x_to_infinity varphi(x)=0",
    ],
    frequency: "0<w<1",
    horizonOrInnerBoundaryAllowed: false,
    alternateAsymptoticNormalizationAllowed: false,
  },
  originSeriesDuty: {
    expansionVariable: "x",
    parity: "all_three_radial_unknowns_are_even_at_the_regular_origin",
    frozenLeadingForm: {
      F0: "f00+f02*x^2+O(x^4)",
      F1: "f10+f12*x^2+O(x^4)",
      varphi: "2^-10+p02*x^2+O(x^4)",
    },
    coefficientDuty:
      "derive_f02_f12_p02_and_every_higher_coefficient_by_substituting_the_series_into_the_exact_frozen_cancellation_free_rows_before_execution",
    singularTermDuty:
      "server_replay_must_take_the_regular_x_to_0_limits_of_F1_prime/x_(F0_prime+F1_prime)/x_and_2*varphi_prime/x_without_pointwise_division_by_zero",
    symbolicDerivationArtifact: null,
    derivationSha256: null,
    independentReplayReceipt: null,
    present: false,
    passed: false,
  },
  asymptoticTailSeriesDuty: {
    expansionVariable: "1/x",
    kappaDefinition: "kappa=sqrt(1-w^2)>0",
    frozenAnsatzClass: {
      F0: "sum_n>=1 a_n*x^-n",
      F1: "sum_n>=1 b_n*x^-n",
      varphi:
        "exp(-kappa*x)*x^sigma*sum_n>=0 c_n*x^-n_with_c0_strictly_positive",
    },
    coefficientDuty:
      "derive_sigma_and_all_metric_and_scalar_tail_coefficients_from_the_exact_frozen_rows_with_the_same_w_and_origin_normalization",
    noFlatSpaceOneOverXScalarTailMayBeAssumedWithoutDerivation: true,
    symbolicDerivationArtifact: null,
    derivationSha256: null,
    independentReplayReceipt: null,
    present: false,
    passed: false,
  },
  branchSelectionGates: {
    quantumNumbers: { N: 1, ell: 0, m: 0 },
    targetOriginAmplitude: { exact: "2^-10", value: 2 ** -10 },
    fieldSignAndNodes: {
      varphiAtOriginStrictlyPositive: true,
      varphiStrictlyPositiveAtEveryFiniteX: true,
      radialNodeCount: 0,
      phaseFlipAllowed: false,
    },
    strictRadialMonotonicity: {
      expression: "varphi_prime(x)<0_for_every_finite_x>0",
      tailLimitMayApproachZeroFromBelow: true,
      secondaryExtremumAllowed: false,
      replayReceipt: null,
      established: false,
    },
    firstVacuumConnectedBranch: {
      definition:
        "the_unique_solution_reached_continuously_from_origin_amplitude_tending_to_zero_before_the_first_mass_frequency_or_linearized_operator_fold",
      previousSolutionInitializationAloneIsEvidence: false,
      continuationReplayReceipt: null,
      established: false,
    },
    noFold: {
      massOrFrequencyTurningPointCrossed: false,
      singularOrSignChangingContinuationTangentAllowed: false,
      branchSwitchAllowed: false,
      foldReplayReceipt: null,
      established: false,
    },
    failedGateDisposition: "fail_candidate_without_retuning_or_fallback",
  },
  unresolvedExecutionSurface: {
    solverPolicy: null,
    gridPolicy: null,
    continuationPolicy: null,
    implementationSource: null,
    dependencyLock: null,
    executable: null,
    issuer: null,
    builder: null,
    executionCommand: null,
    executionReceipt: null,
    originSeriesReceipt: null,
    tailSeriesReceipt: null,
    branchIdentityReceipt: null,
    noFoldReceipt: null,
    result: null,
  },
  executionBoundary: {
    solverPolicyRequiredBeforeExecution: true,
    gridPolicyRequiredBeforeExecution: true,
    continuationPolicyRequiredBeforeExecution: true,
    allThreeMustBeHashBoundByANewAuthorityContract: true,
    thisContractAuthorizesTheirFutureValues: false,
    executionPresent: false,
    structurallyAdmissible: false,
  },
  authorityBoundary: {
    candidateAuthority: false,
    scientificCandidateAdmissible: false,
    solverAuthority: false,
    gridAuthority: false,
    continuationAuthority: false,
    issuerAuthority: false,
    builderAuthority: false,
    executionAuthority: false,
    branchSolveAuthority: false,
    residualPassAuthority: false,
    originSeriesAuthority: false,
    tailSeriesAuthority: false,
    firstBranchAuthority: false,
    noFoldAuthority: false,
    nondegeneracyAuthority: false,
    scientificPresealAuthority: false,
    rawReplayAuthority: false,
    pairAgreementAuthority: false,
    semiclassicalStressNoiseLamp: false,
    semiclassicalConstraintAlgebraLamp: false,
    diagnosticPass: false,
    theoryGraphAuthority: false,
    physicalViability: false,
    propulsion: false,
    transport: false,
  },
  blockers: NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BLOCKERS,
  claimLockKeys: Object.freeze(Object.keys(BRANCH_CLAIM_LOCKS)),
  claimLocks: BRANCH_CLAIM_LOCKS,
  claimLocksExhaustive: true,
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

export const NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1 = deepFreeze(CONTRACT);

const assertContractInvariants = (): void => {
  const pins = NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING_PINS;
  if (
    CONTRACT.bindingPins !== pins ||
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256 !==
      pins.candidateSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES !==
      pins.candidateCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256 !==
      pins.tolerancePolicySha256 ||
    NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_SIZE_BYTES !==
      pins.tolerancePolicyCanonicalSizeBytes ||
    CONTRACT.candidateBinding.canonicalBinding.sha256 !==
      pins.candidateSha256 ||
    CONTRACT.candidateBinding.canonicalBinding.canonicalSizeBytes !==
      pins.candidateCanonicalSizeBytes ||
    CONTRACT.tolerancePolicyBinding.canonicalBinding.sha256 !==
      pins.tolerancePolicySha256 ||
    CONTRACT.tolerancePolicyBinding.canonicalBinding.canonicalSizeBytes !==
      pins.tolerancePolicyCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN.candidateIdentity
      .candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID ||
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN.frozenBranchSelector
      .multipolarQuantumNumbers.N !== 1 ||
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN.frozenBranchSelector
      .multipolarQuantumNumbers.ell !== 0 ||
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN.frozenBranchSelector
      .multipolarQuantumNumbers.m !== 0 ||
    NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID ||
    CONTRACT.dimensionlessRadialSystem.sourceCoefficient.value !== 1 ||
    CONTRACT.dimensionlessRadialSystem.eigenvalueRange.strictLower !== 0 ||
    CONTRACT.dimensionlessRadialSystem.eigenvalueRange.strictUpper !== 1 ||
    CONTRACT.boundaryConditions.originAmplitude.value !== 2 ** -10 ||
    CONTRACT.branchSelectionGates.quantumNumbers.N !== 1 ||
    CONTRACT.branchSelectionGates.quantumNumbers.ell !== 0 ||
    CONTRACT.branchSelectionGates.quantumNumbers.m !== 0 ||
    CONTRACT.branchSelectionGates.targetOriginAmplitude.value !== 2 ** -10 ||
    CONTRACT.solverImplemented !== false ||
    CONTRACT.executionAuthorized !== false ||
    CONTRACT.candidateBinding.scientificCandidateAdmissible !== false ||
    CONTRACT.tolerancePolicyBinding.presealReceipt !== null ||
    CONTRACT.tolerancePolicyBinding.presealed !== false ||
    CONTRACT.sourceKernelReference.sourceSha256 !== null ||
    CONTRACT.sourceKernelReference.executableSha256 !== null ||
    CONTRACT.sourceKernelReference.solverImplementation !== false ||
    CONTRACT.sourceKernelReference.executionAuthority !== false ||
    CONTRACT.residualNormalization.numericAcceptanceThresholds !== null ||
    CONTRACT.residualNormalization.replayReceipt !== null ||
    CONTRACT.residualNormalization.passed !== false ||
    CONTRACT.originSeriesDuty.symbolicDerivationArtifact !== null ||
    CONTRACT.originSeriesDuty.derivationSha256 !== null ||
    CONTRACT.originSeriesDuty.independentReplayReceipt !== null ||
    CONTRACT.originSeriesDuty.present !== false ||
    CONTRACT.originSeriesDuty.passed !== false ||
    CONTRACT.asymptoticTailSeriesDuty.symbolicDerivationArtifact !== null ||
    CONTRACT.asymptoticTailSeriesDuty.derivationSha256 !== null ||
    CONTRACT.asymptoticTailSeriesDuty.independentReplayReceipt !== null ||
    CONTRACT.asymptoticTailSeriesDuty.present !== false ||
    CONTRACT.asymptoticTailSeriesDuty.passed !== false ||
    CONTRACT.branchSelectionGates.strictRadialMonotonicity.replayReceipt !==
      null ||
    CONTRACT.branchSelectionGates.strictRadialMonotonicity.established !==
      false ||
    CONTRACT.branchSelectionGates.firstVacuumConnectedBranch
      .continuationReplayReceipt !== null ||
    CONTRACT.branchSelectionGates.firstVacuumConnectedBranch.established !==
      false ||
    CONTRACT.branchSelectionGates.noFold.foldReplayReceipt !== null ||
    CONTRACT.branchSelectionGates.noFold.established !== false ||
    CONTRACT.executionBoundary.executionPresent !== false ||
    CONTRACT.executionBoundary.structurallyAdmissible !== false ||
    Object.values(CONTRACT.authorityBoundary).some(
      (value) => value !== false,
    ) ||
    Object.values(BRANCH_CLAIM_LOCKS).some((value) => value !== false) ||
    CONTRACT.claimLockKeys.length !== Object.keys(BRANCH_CLAIM_LOCKS).length ||
    new Set(CONTRACT.claimLockKeys).size !== CONTRACT.claimLockKeys.length ||
    Object.values(CONTRACT.unresolvedExecutionSurface).some(
      (value) => value !== null,
    )
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_branch_bvp_v1_invariant_violation",
    );
  }
};

assertContractInvariants();

export type Nhm2SphericalBosonStarBranchBvpV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1;

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
  const limits = NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS;
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
      length < 0
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_length:${pointer || "/"}`,
      });
    }
    if (length > limits.maximumArrayLength) {
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

export const NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1);
export const NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-branch-bvp/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256 = createHash(
  "sha256",
)
  .update(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256_DOMAIN, "utf8")
  .update(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON, "utf8")
  .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING = Object.freeze({
  artifactId: NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_ARTIFACT_ID,
  contractVersion: NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CONTRACT_VERSION,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID,
  sha256Domain: NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256_DOMAIN,
  sha256: NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256,
  canonicalSizeBytes:
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES,
  mediaType: "application/json" as const,
});

const EXPECTED_CANONICAL_JSON =
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON;

export const nhm2SphericalBosonStarBranchBvpV1Violations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1) return [];
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["spherical_branch_bvp_v1_plain_data_snapshot_invalid"];
  }
  if (!snapshot.ok) return [snapshot.violation];
  try {
    return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
      ? ["spherical_branch_bvp_v1_external_copy_not_authoritative"]
      : ["spherical_branch_bvp_v1_semantic_mismatch"];
  } catch {
    return ["spherical_branch_bvp_v1_plain_data_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarBranchBvpV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarBranchBvpV1 =>
  nhm2SphericalBosonStarBranchBvpV1Violations(value).length === 0;
