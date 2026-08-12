import { createHash } from "node:crypto";
import {
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_ARTIFACT_ID,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANDIDATE_ID,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CONTRACT_VERSION,
} from "./nhm2-prolate-boson-star-coherent-candidate-plan.v2";

export const NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_ARTIFACT_ID =
  "nhm2.prolate_boson_star_branch_bvp" as const;
export const NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CONTRACT_VERSION =
  "nhm2_prolate_boson_star_branch_bvp/v1" as const;

export const NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BLOCKERS = Object.freeze([
  "newtonian_2p_seed_artifact_and_sha256_absent",
  "classical_branch_solver_not_implemented",
  "hash_bound_solver_implementation_policy_and_receipt_absent",
  "resource_and_network_enforcement_not_implemented",
  "origin_regularity_server_replay_absent",
  "higher_order_origin_series_derivation_replay_absent",
  "branch_identity_and_fold_server_replay_absent",
  "classical_branch_bvp_not_executed",
  "diagnostic_residual_and_convergence_rails_not_evaluated",
] as const);

export const NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 8192,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 256,
    maximumStringUtf8Bytes: 8192,
  } as const);

const AMPLITUDE_CONTINUATION = Object.freeze([
  { exact: "2^-16", value: 2 ** -16 },
  { exact: "2^-15", value: 2 ** -15 },
  { exact: "2^-14", value: 2 ** -14 },
  { exact: "2^-13", value: 2 ** -13 },
  { exact: "2^-12", value: 2 ** -12 },
  { exact: "2^-11", value: 2 ** -11 },
  { exact: "2^-10", value: 2 ** -10 },
] as const);

const COLLOCATION_LEVELS = Object.freeze([
  { radialNodeCount: 16, angularNodeCount: 12 },
  { radialNodeCount: 32, angularNodeCount: 24 },
  { radialNodeCount: 64, angularNodeCount: 48 },
] as const);

const BRANCH_CLAIM_LOCKS = {
  ...NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2.claimLocks,
  newtonianSeedPresent: false,
  classicalBranchSolverImplemented: false,
  classicalBranchSolverImplementationBound: false,
  classicalBranchBvpExecuted: false,
  classicalBranchConverged: false,
  classicalBranchResidualRailsPassed: false,
  classicalBranchResolutionConverged: false,
  classicalBranchNodeless: false,
  classicalBranchNoFold: false,
  classicalBranchIdentityReplayPassed: false,
  classicalOriginRegularityReplayPassed: false,
  classicalBranchRegular: false,
  classicalBranchAsymptoticallyFlat: false,
  classicalBranchConicalGatePassed: false,
  classicalBranchAdmissible: false,
} as const;

const CONTRACT = {
  artifactId: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_ARTIFACT_ID,
  contractVersion: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CONTRACT_VERSION,
  authority: "preregistered_classical_branch_bvp_only",
  maturity: "diagnostic_contract_only_all_execution_absent",
  solverImplemented: false,
  executionAuthorized: false,
  candidateBinding: {
    authoritativeSingletonIdentityRequired: true,
    artifactId: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_ARTIFACT_ID,
    contractVersion:
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CONTRACT_VERSION,
    candidateId:
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANDIDATE_ID,
    bindingPins:
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS,
    canonicalBinding:
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
  },
  sourceBindings: [
    {
      locator: "arXiv:2008.10608",
      title:
        "Multipolar boson stars: macroscopic Bose-Einstein condensates akin to hydrogen orbitals",
      doi: "10.1016/j.physletb.2020.136027",
      duty: "multipolar_N_ell_m_and_vacuum_connected_nodeless_branch_basis",
    },
    {
      locator: "arXiv:2210.01833",
      title: "Two boson stars in equilibrium",
      journalLocator: "PhysRevD.106.124039",
      doi: "10.1103/PhysRevD.106.124039",
      duty: "covariant_EKG_quasi_isotropic_dipole_BCs_constraints_and_local_series_basis",
    },
  ],
  covariantModel: {
    signature: "(-,+,+,+)",
    scalarComplex: true,
    scalarMassPositive: true,
    actionDensity:
      "R/(16*pi*G)-g^ab*(partial_a Phi^*)*(partial_b Phi)-mu^2*Phi^*Phi",
    stressTensor:
      "T_ab=(partial_a Phi^*)(partial_b Phi)+(partial_b Phi^*)(partial_a Phi)-g_ab[(partial_c Phi^*)(partial^c Phi)+mu^2*Phi^*Phi]",
    einsteinEquation: "E^a_b:=G^a_b-8*pi*G*T^a_b=0",
    kleinGordonEquation: "(nabla_a*nabla^a-mu^2)Phi=0",
  },
  ansatz: {
    coordinates: ["t", "r", "theta", "phi"],
    metric:
      "ds^2=-exp(2*F0)dt^2+exp(2*F1)(dr^2+r^2*dtheta^2)+exp(2*F2)r^2*sin(theta)^2*dphi^2",
    scalar: "Phi(t,r,theta)=phi(r,theta)*exp(-i*omega*t)",
    metricFunctionsReal: true,
    scalarAmplitudeReal: true,
    staticAxisymmetricDiagonalQuasiIsotropic: true,
    deTurckSystemUsed: false,
  },
  dimensionlessSystem: {
    definitions: {
      x: "mu*r",
      tau: "mu*t",
      w: "omega/mu",
      varphi: "sqrt(8*pi*G)*phi",
    },
    fieldUnknownOrder: ["F0", "F1", "F2", "varphi"],
    eigenvalueUnknownOrder: ["w"],
    normalizationAuxiliaryUnknownOrder: ["rhoPeak"],
    dimensionlessEinsteinEquation: "Ebar^a_b:=Gbar^a_b-Tbar^a_b[varphi,w]=0",
    dimensionlessKleinGordonEquation:
      "KGbar:=(nablaBar_a*nablaBar^a-1)(varphi*exp(-i*w*tau))=0",
    sourceCoefficient: { exact: "1", value: 1 },
    excludedPdeSourceFactors: ["8*pi*G*mu^2"],
    candidateCouplingIsNotDimensionlessPdeInput: true,
  },
  ellipticResidualSystem: {
    solvedResidualOrder: [
      { id: "einstein_Et_t", equation: "Ebar^t_t=0" },
      {
        id: "einstein_Er_r_plus_Etheta_theta",
        equation: "Ebar^r_r+Ebar^theta_theta=0",
      },
      { id: "einstein_Ephi_phi", equation: "Ebar^phi_phi=0" },
      { id: "klein_gordon", equation: "KGbar=0" },
    ],
    unusedConstraintOrder: [
      { id: "einstein_Er_theta", equation: "Ebar^r_theta=0" },
      {
        id: "einstein_Er_r_minus_Etheta_theta",
        equation: "Ebar^r_r-Ebar^theta_theta=0",
      },
    ],
    componentEvaluationMustDeriveFromCovariantModel: true,
    ansatzIdentityChecks: ["g_x_theta=0", "g_theta_theta=x^2*g_x_x", "g_t_i=0"],
  },
  domainAndCollocation: {
    halfDomain: {
      rho: { minimum: 0, maximum: 1 },
      theta: { minimum: 0, maximumExact: "pi/2" },
    },
    compactification: {
      forward: "rho=x/(1+x)",
      inverse: "x=rho/(1-rho)",
      firstDerivative: "partial_x=(1-rho)^2*partial_rho",
      secondDerivative:
        "partial_x^2=(1-rho)^4*partial_rho^2-2*(1-rho)^3*partial_rho",
    },
    basis: "tensor_product_Chebyshev_Lobatto_mapped_to_half_domain",
    mappedNodes: {
      rho: "rho_j=(1-cos(pi*j/(Nr-1)))/2",
      theta: "theta_k=(pi/4)*(1-cos(pi*k/(Ntheta-1)))",
      indexOrder: "j_then_k_ascending_from_origin_axis",
    },
    levels: COLLOCATION_LEVELS,
    oversampledCovariantGrid:
      "interlace_one_midpoint_between_each_adjacent_collocation_node_in_each_coordinate_including_original_nodes",
    oversampledNodeCounts: "(2*Nr-1,2*Ntheta-1)",
  },
  boundaryConditions: {
    originRho0: [
      "partial_rho(F0)=0",
      "partial_rho(F1)=0",
      "partial_rho(F2)=0",
      "varphi=0",
    ],
    infinityRho1: ["F0=0", "F1=0", "F2=0", "varphi=0"],
    northAxisTheta0: [
      "partial_theta(F0)=0",
      "partial_theta(F1)=0",
      "partial_theta(F2)=0",
      "partial_theta(varphi)=0",
    ],
    equatorThetaPiOver2: [
      "partial_theta(F0)=0",
      "partial_theta(F1)=0",
      "partial_theta(F2)=0",
      "varphi=0",
    ],
    cornerPrecedence: {
      rule: "radial_boundary_rows_replace_all_angular_rows_at_corners",
      radialRows: ["rho=0", "rho=1"],
      angularRowsApplyOnlyForRadialIndices: "1<=j<=Nr-2",
      fallbackOrRowAveragingAllowed: false,
    },
    conicalConditionIsIndependentHardGateNotExtraTauRow: "F1-F2=0 at theta=0",
  },
  originSeries: {
    variable: "x",
    coefficientDefinitions: [
      "f00 and f10 are finite real constants",
      "a1 is finite and strictly positive",
    ],
    normalization: "varphi=sqrt(8*pi*G)*phi",
    F0: "f00+O(x^2)",
    F1: "f10+O(x^2)",
    F2: "f10+O(x^2)",
    varphi: "a1*x*cos(theta)+O(x^3)",
    commonF1F2OriginConstantRequired: true,
    operationalLeadingRegularityReplay: {
      authority: "server_recomputed_fail_closed_replay",
      evaluatedAtEveryAcceptedStageAndResolution: true,
      derivativeConvention:
        "partial_x=partial_rho at rho=0; derivatives use the barycentric collocation interpolant",
      checks: [
        {
          id: "origin_metric_angular_constancy",
          expression: "max_i_in_[0,1,2] max_theta abs(Fi(0,theta)-Fi(0,0))",
          maximum: 1e-10,
        },
        {
          id: "origin_common_F1_F2_constant",
          expression: "abs(F1(0,0)-F2(0,0))",
          maximum: 1e-10,
        },
        {
          id: "origin_positive_dipole_slope",
          a1Definition: "a1=partial_x(varphi)(0,0)",
          strictCondition: "a1>0",
          expression: "max_theta abs(partial_x(varphi)(0,theta)-a1*cos(theta))",
          maximum: 1e-10,
        },
      ],
      evaluatorPolicyArtifact: null,
      evaluatorPolicySha256: null,
      replayReceipt: null,
      present: false,
      passed: false,
      structurallyAdmissible: false,
    },
    higherOrderCoefficientAuthority: {
      frozenHere: false,
      symbolicCovariantDerivationArtifactRequired: true,
      domainSeparatedSha256Required: true,
      independentReplayRequired: true,
      derivationArtifact: null,
      derivationArtifactSha256: null,
      replayReceipt: null,
      present: false,
      structurallyAdmissible: false,
    },
  },
  branchSelection: {
    quantumNumbers: { N: 2, ell: 1, m: 0 },
    radialNodeCount: 0,
    targetAmplitude: {
      definition: "A=max_domain(abs(varphi))",
      exact: "2^-10",
      value: 2 ** -10,
    },
    vacuumLimit: "A->0+, fields->0, w->1-",
    frequencyRange: "0<w<1",
    intendedBranch: "first_vacuum_connected_no_fold_no_node_branch",
    branchIdentityAuthority:
      "server_replay_required_previous_solution_initialization_is_not_evidence",
    interiorNodeRule:
      "varphi>0 for 0<rho<1 and 0<=theta<pi/2; only prescribed boundary zeros are allowed",
    northLobePhase: "positive",
    continuousPeakNormalization: {
      interpolation: "tensor_product_barycentric_Chebyshev_interpolant",
      rhoPeakDomain: "0<rhoPeak<1",
      equations: ["varphi(rhoPeak,0)=A", "partial_rho(varphi)(rhoPeak,0)=0"],
      hardInequalitiesAndUniqueness: [
        "partial_rho^2(varphi)(rhoPeak,0)<0",
        "abs(varphi) has exactly one global maximum on the north half-domain",
        "varphi(rhoPeak,0)>0",
      ],
    },
    branchIdentityAndFoldReplay: {
      authority: "server_recomputed_fail_closed_replay",
      requiredDuties: [
        "bind every accepted stage to the hash-bound Newtonian 2p seed and preceding accepted solution",
        "recompute the ordered amplitude path without accepting a disconnected root",
        "evaluate a separately hash-bound fold-detection policy over the complete accepted path",
        "establish first-vacuum-connected identity and no-fold status independently of initializer history",
      ],
      replayPolicyArtifact: null,
      replayPolicySha256: null,
      replayReceipt: null,
      firstVacuumConnectedBranchEstablished: false,
      noFoldEstablished: false,
      present: false,
      structurallyAdmissible: false,
    },
  },
  initializationAndContinuation: {
    newtonianSeed: {
      requiredKind: "nodeless_Newtonian_Schrodinger_Poisson_2p_seed",
      separateArtifactRequired: true,
      sha256RequiredBeforeExecution: true,
      sha256Domain:
        "nhm2.prolate_boson_star.newtonian_2p_seed.canonical_json.sha256.v1",
      artifact: null,
      artifactSha256: null,
      present: false,
      structurallyAdmissible: false,
    },
    directVacuumOrArbitraryFrequencyInitializationAllowed: false,
    amplitudeStages: AMPLITUDE_CONTINUATION,
    deterministicSolveSchedule: {
      coarseLevel:
        "run_all_seven_amplitudes_in_ascending_order_on_16x12; first uses hash-bound seed, each later stage uses only the immediately preceding accepted stage",
      refinementLevels:
        "run_target_2^-10_only_on_32x24_then_64x48; each uses barycentric prolongation of the immediately preceding accepted target solution",
      skipFallbackRetryWithRetunedPhysicsOrScheduleAllowed: false,
      branchSwitchAllowed: false,
      previousSolutionInitializationHasBranchIdentityAuthority: false,
      everyStageRemainsUnpromotedUntilBranchIdentityAndFoldReplay: true,
    },
  },
  nonlinearSolverPolicy: {
    completeness: "partial_constraints_only_not_an_executable_solver_policy",
    partialFrozenConstraints: {
      methodFamily: "matrix_free_Newton_Krylov",
      linearMethodFamily: "GMRES",
      denseJacobianFormationAllowed: false,
      maximumNewtonStepsPerStage: 30,
      gmresRelativeTolerance: 1e-10,
      maximumGmresIterationsPerNewtonStep: 500,
      armijoInitialStep: 1,
      armijoSufficientDecreaseC: 1e-4,
      armijoBacktrackFactor: 0.5,
      maximumArmijoBacktracks: 20,
      minimumArmijoStepExact: "2^-20",
      minimumArmijoStep: 2 ** -20,
    },
    unavailableRequiredChoices: [
      "nonlinear_unknown_scaling",
      "nonlinear_residual_norm",
      "merit_function",
      "GMRES_restart_policy",
      "preconditioner",
      "Jacobian_vector_product_realization",
      "deterministic_floating_point_and_reduction_policy",
    ],
    hashBoundImplementationPolicy: {
      requiredBeforeExecution: true,
      domainSeparatedSha256Required: true,
      policyArtifact: null,
      policyArtifactSha256: null,
      implementationReceipt: null,
      present: false,
      structurallyAdmissible: false,
    },
    failurePolicy: "fail_closed_with_no_accepted_solution_output",
  },
  diagnosticRails: {
    authority:
      "frozen_preregistration_diagnostic_rails_not_certified_physical_authority",
    residualNormalization: {
      authority: "server_recomputed_from_covariant_Gbar_Tbar_and_BoxBar",
      solvedRows: [
        {
          id: "einstein_Et_t",
          expression: "abs(Gbar^t_t-Tbar^t_t)/(1+abs(Gbar^t_t)+abs(Tbar^t_t))",
        },
        {
          id: "einstein_Er_r_plus_Etheta_theta",
          expression:
            "abs((Gbar^r_r+Gbar^theta_theta)-(Tbar^r_r+Tbar^theta_theta))/(1+abs(Gbar^r_r)+abs(Gbar^theta_theta)+abs(Tbar^r_r)+abs(Tbar^theta_theta))",
        },
        {
          id: "einstein_Ephi_phi",
          expression:
            "abs(Gbar^phi_phi-Tbar^phi_phi)/(1+abs(Gbar^phi_phi)+abs(Tbar^phi_phi))",
        },
        {
          id: "klein_gordon",
          expression:
            "abs(BoxBar_w(varphi)-varphi)/(1+abs(BoxBar_w(varphi))+abs(varphi))",
        },
      ],
      unusedConstraintRows: [
        {
          id: "einstein_Er_theta",
          expression:
            "abs(Gbar^r_theta-Tbar^r_theta)/(1+abs(Gbar^r_theta)+abs(Tbar^r_theta))",
        },
        {
          id: "einstein_Er_r_minus_Etheta_theta",
          expression:
            "abs((Gbar^r_r-Gbar^theta_theta)-(Tbar^r_r-Tbar^theta_theta))/(1+abs(Gbar^r_r)+abs(Gbar^theta_theta)+abs(Tbar^r_r)+abs(Tbar^theta_theta))",
        },
      ],
      groupingOrTermSplittingMayChangeDenominator: false,
    },
    solvedNormalizedPdeLInf: { maximum: 1e-9 },
    independentlyOversampledCovariantPdeLInf: { maximum: 1e-7 },
    boundaryConditionLInf: { maximum: 1e-10 },
    unusedEinsteinConstraintNormalizedLInf: { maximum: 1e-6 },
    axisConicalLInf: { expression: "max_rho(abs(F1-F2))", maximum: 1e-8 },
    amplitudeAbsoluteError: { maximum: 1e-12 },
    fullDomainParityLInf: {
      metricRule: "Fi(rho,theta)=Fi(rho,pi-theta)",
      scalarRule: "varphi(rho,theta)=-varphi(rho,pi-theta)",
      maximum: 1e-12,
    },
    adjacentResolutionFrequencyRelativeDifference: {
      expression: "abs(w_fine-w_coarse)/abs(w_fine)",
      maximum: 1e-4,
    },
    adjacentResolutionFieldRelativeLInfDifference: {
      expression:
        "for_each_u_in_[F0,F1,F2,varphi]: normInf(u_fine-prolong(u_coarse))/normInf(u_fine); if normInf(u_fine)=0 require numerator=0",
      maximum: 1e-3,
    },
    allRailsAreHardAndConjunctive: true,
  },
  resourcePolicy: {
    maximumChildRssMiB: 768,
    maximumWallSeconds: 1800,
    maximumProcesses: 1,
    maximumThreads: 1,
    maximumBlasThreads: 1,
    minimumHostReserveGiB: 2,
    network: "denied",
    osLevelEnforcementImplemented: false,
    executionBlockedUntilEnforced: true,
  },
  executionState: {
    executionPresent: false,
    solverImplementation: null,
    solverImplementationPolicyArtifact: null,
    solverImplementationPolicyArtifactSha256: null,
    solverImplementationReceipt: null,
    newtonianSeedArtifact: null,
    newtonianSeedArtifactSha256: null,
    higherOrderOriginSeriesDerivationArtifact: null,
    higherOrderOriginSeriesDerivationArtifactSha256: null,
    higherOrderOriginSeriesReplayReceipt: null,
    originRegularityEvaluatorPolicyArtifact: null,
    originRegularityEvaluatorPolicySha256: null,
    originRegularityReplayReceipt: null,
    branchIdentityAndFoldReplayPolicyArtifact: null,
    branchIdentityAndFoldReplayPolicySha256: null,
    branchIdentityAndFoldReplayReceipt: null,
    resourceEnforcementReceipt: null,
    branchSolutions: null,
    targetFrequencyW: null,
    targetRhoPeak: null,
    residualReport: null,
    convergenceReport: null,
    runtimeReceipt: null,
    outputArtifact: null,
    structurallyAdmissible: false,
  },
  blockers: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BLOCKERS,
  claimLocksExhaustive: true,
  claimLockKeys: Object.freeze(Object.keys(BRANCH_CLAIM_LOCKS)),
  claimLocks: BRANCH_CLAIM_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object))
    return value;
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>))
    deepFreeze(child, seen);
  return Object.freeze(value);
};

export const NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1 = deepFreeze(CONTRACT);

const assertInvariants = (): void => {
  const contract = NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1;
  if (
    contract.candidateBinding.bindingPins !==
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS ||
    contract.candidateBinding.canonicalBinding !==
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING ||
    contract.candidateBinding.candidateId !==
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2.candidateIdentity
        .candidateId ||
    contract.initializationAndContinuation.amplitudeStages.length !== 7 ||
    contract.domainAndCollocation.levels.length !== 3 ||
    contract.originSeries.operationalLeadingRegularityReplay.present !==
      false ||
    contract.branchSelection.branchIdentityAndFoldReplay.present !== false ||
    contract.nonlinearSolverPolicy.hashBoundImplementationPolicy.present !==
      false ||
    contract.executionState.executionPresent !== false ||
    contract.executionState.structurallyAdmissible !== false ||
    Object.values(contract.claimLocks).some((value) => value !== false) ||
    contract.claimLockKeys.length !== Object.keys(contract.claimLocks).length
  ) {
    throw new Error(
      "nhm2_prolate_boson_star_branch_bvp_v1_invariant_violation",
    );
  }
};

assertInvariants();

export type Nhm2ProlateBosonStarBranchBvpV1 =
  typeof NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1;

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
  const limits = NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS;
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
      lengthDescriptor && "value" in lengthDescriptor
        ? lengthDescriptor.value
        : null;
    if (!Number.isSafeInteger(length) || length < 0) {
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
        !descriptor ||
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
      !descriptor ||
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
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON =
  canonicalJson(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1);
export const NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-branch-bvp/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_SHA256 = createHash("sha256")
  .update(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_SHA256_DOMAIN, "utf8")
  .update(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON, "utf8")
  .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING = Object.freeze({
  artifactId: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_ARTIFACT_ID,
  contractVersion: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CONTRACT_VERSION,
  sha256Domain: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_SHA256_DOMAIN,
  sha256: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_SHA256,
  canonicalSizeBytes:
    NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES,
});

const EXPECTED_CANONICAL_JSON =
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON;

export const nhm2ProlateBosonStarBranchBvpV1Violations = (
  value: unknown,
): string[] => {
  if (value === NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1) return [];
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["branch_bvp_v1_plain_data_snapshot_invalid"];
  }
  if (!snapshot.ok) return [snapshot.violation];
  try {
    return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
      ? ["branch_bvp_v1_external_copy_not_authoritative"]
      : ["branch_bvp_v1_semantic_mismatch"];
  } catch {
    return ["branch_bvp_v1_plain_data_snapshot_invalid"];
  }
};

export const isNhm2ProlateBosonStarBranchBvpV1 = (
  value: unknown,
): value is Nhm2ProlateBosonStarBranchBvpV1 =>
  nhm2ProlateBosonStarBranchBvpV1Violations(value).length === 0;
