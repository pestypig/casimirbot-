import { describe, expect, it } from "vitest";
import {
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BLOCKERS,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_SHA256,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_SHA256_DOMAIN,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS,
  isNhm2ProlateBosonStarBranchBvpV1,
  nhm2ProlateBosonStarBranchBvpV1Violations,
} from "../shared/contracts/nhm2-prolate-boson-star-branch-bvp.v1";
import {
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256_DOMAIN,
} from "../shared/contracts/nhm2-prolate-boson-star-coherent-candidate-plan.v2";
import { createHash } from "node:crypto";

const clone = (): Record<string, any> =>
  JSON.parse(JSON.stringify(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1)) as Record<
    string,
    any
  >;

const expectDeepFrozen = (value: unknown, seen = new Set<object>()): void => {
  if (value == null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value as Record<string, unknown>)) {
    expectDeepFrozen(child, seen);
  }
};

describe("NHM2 prolate boson-star classical branch BVP v1", () => {
  it("binds the authoritative candidate-v2 identity, pins, and primary sources", () => {
    const contract = NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1;
    expect(contract.authority).toBe("preregistered_classical_branch_bvp_only");
    expect(contract.candidateBinding).toMatchObject({
      artifactId: "nhm2.prolate_boson_star_coherent_candidate_plan",
      contractVersion: "nhm2_prolate_boson_star_coherent_candidate_plan/v2",
      candidateId:
        "nhm2.semiclassical_v3.prolate_boson_star_2p_weak_field_plan/v2",
      authoritativeSingletonIdentityRequired: true,
    });
    expect(contract.candidateBinding.bindingPins).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS,
    );
    expect(contract.candidateBinding.canonicalBinding).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
    );
    expect(contract.candidateBinding.canonicalBinding).toEqual({
      artifactId: "nhm2.prolate_boson_star_coherent_candidate_plan",
      contractVersion: "nhm2_prolate_boson_star_coherent_candidate_plan/v2",
      candidateId:
        "nhm2.semiclassical_v3.prolate_boson_star_2p_weak_field_plan/v2",
      sha256Domain:
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256_DOMAIN,
      sha256: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256,
      canonicalSizeBytes:
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_SIZE_BYTES,
    });
    expect(contract.candidateBinding.canonicalBinding.sha256Domain).toBe(
      "nhm2-prolate-boson-star-coherent-candidate-plan/v2\n",
    );
    expect(contract.candidateBinding.canonicalBinding.sha256).toBe(
      "945290005dced13762a8972e725ac72bb2006eda88f5537ec3a231c848122f14",
    );
    expect(contract.candidateBinding.canonicalBinding.canonicalSizeBytes).toBe(
      134951,
    );
    expect(contract.candidateBinding.candidateId).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2.candidateIdentity
        .candidateId,
    );
    expect(contract.candidateBinding.bindingPins).toMatchObject({
      replayEpochPolicySha256:
        "72809f7bf15551886994ee80bf3f67d793d4024e2c64decd838f9c6d6795413f",
      constraintArithmeticPolicySha256:
        "ec6dc71043c35d20b74efe0053ae2b3665af6ec9ac9c2d5c36e2911b89defeb8",
      pairNumericAgreementPolicySha256:
        "872f17a82aead893b9371ded595c631ce8dc825152de2f545b0b2840f51d1cb8",
    });
    expect(contract.sourceBindings.map((source) => source.locator)).toEqual([
      "arXiv:2008.10608",
      "arXiv:2210.01833",
    ]);
    expect(contract.sourceBindings[1]).toMatchObject({
      journalLocator: "PhysRevD.106.124039",
      doi: "10.1103/PhysRevD.106.124039",
    });
  });

  it("freezes the covariant EKG model, quasi-isotropic ansatz, and exact residual split", () => {
    const contract = NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1;
    expect(contract.covariantModel.einsteinEquation).toBe(
      "E^a_b:=G^a_b-8*pi*G*T^a_b=0",
    );
    expect(contract.covariantModel.kleinGordonEquation).toBe(
      "(nabla_a*nabla^a-mu^2)Phi=0",
    );
    expect(contract.ansatz.metric).toContain("exp(2*F1)(dr^2+r^2*dtheta^2)");
    expect(contract.ansatz.scalar).toBe(
      "Phi(t,r,theta)=phi(r,theta)*exp(-i*omega*t)",
    );
    expect(contract.ansatz.staticAxisymmetricDiagonalQuasiIsotropic).toBe(true);
    expect(contract.ansatz.deTurckSystemUsed).toBe(false);
    expect(contract.dimensionlessSystem.fieldUnknownOrder).toEqual([
      "F0",
      "F1",
      "F2",
      "varphi",
    ]);
    expect(contract.dimensionlessSystem.eigenvalueUnknownOrder).toEqual(["w"]);
    expect(
      contract.ellipticResidualSystem.solvedResidualOrder.map(({ id }) => id),
    ).toEqual([
      "einstein_Et_t",
      "einstein_Er_r_plus_Etheta_theta",
      "einstein_Ephi_phi",
      "klein_gordon",
    ]);
    expect(
      contract.ellipticResidualSystem.unusedConstraintOrder.map(({ id }) => id),
    ).toEqual(["einstein_Er_theta", "einstein_Er_r_minus_Etheta_theta"]);
  });

  it("absorbs G and mu into x, w, and varphi without leaking the candidate coupling into PDE sources", () => {
    const system = NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.dimensionlessSystem;
    expect(system.definitions).toEqual({
      x: "mu*r",
      tau: "mu*t",
      w: "omega/mu",
      varphi: "sqrt(8*pi*G)*phi",
    });
    expect(system.sourceCoefficient).toEqual({ exact: "1", value: 1 });
    expect(system.excludedPdeSourceFactors).toEqual(["8*pi*G*mu^2"]);
    expect(system.candidateCouplingIsNotDimensionlessPdeInput).toBe(true);
    expect(JSON.stringify(system)).not.toContain("2^-40");
  });

  it("fixes compactification, Lobatto levels, boundary rows, and radial corner precedence", () => {
    const contract = NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1;
    expect(contract.domainAndCollocation.halfDomain).toEqual({
      rho: { minimum: 0, maximum: 1 },
      theta: { minimum: 0, maximumExact: "pi/2" },
    });
    expect(contract.domainAndCollocation.compactification.forward).toBe(
      "rho=x/(1+x)",
    );
    expect(contract.domainAndCollocation.levels).toEqual([
      { radialNodeCount: 16, angularNodeCount: 12 },
      { radialNodeCount: 32, angularNodeCount: 24 },
      { radialNodeCount: 64, angularNodeCount: 48 },
    ]);
    expect(contract.boundaryConditions.originRho0).toEqual([
      "partial_rho(F0)=0",
      "partial_rho(F1)=0",
      "partial_rho(F2)=0",
      "varphi=0",
    ]);
    expect(contract.boundaryConditions.northAxisTheta0.at(-1)).toBe(
      "partial_theta(varphi)=0",
    );
    expect(contract.boundaryConditions.equatorThetaPiOver2.at(-1)).toBe(
      "varphi=0",
    );
    expect(contract.boundaryConditions.infinityRho1).toEqual([
      "F0=0",
      "F1=0",
      "F2=0",
      "varphi=0",
    ]);
    expect(contract.boundaryConditions.cornerPrecedence).toMatchObject({
      rule: "radial_boundary_rows_replace_all_angular_rows_at_corners",
      angularRowsApplyOnlyForRadialIndices: "1<=j<=Nr-2",
      fallbackOrRowAveragingAllowed: false,
    });
    expect(
      contract.boundaryConditions
        .conicalConditionIsIndependentHardGateNotExtraTauRow,
    ).toBe("F1-F2=0 at theta=0");
  });

  it("fixes the regular dimensionless dipole series and positive north-lobe phase", () => {
    const contract = NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1;
    expect(contract.originSeries.normalization).toBe("varphi=sqrt(8*pi*G)*phi");
    expect(contract.originSeries.F0).toBe("f00+O(x^2)");
    expect(contract.originSeries.F1).toBe("f10+O(x^2)");
    expect(contract.originSeries.F2).toBe("f10+O(x^2)");
    expect(contract.originSeries.varphi).toBe("a1*x*cos(theta)+O(x^3)");
    expect(contract.originSeries.commonF1F2OriginConstantRequired).toBe(true);
    expect(
      contract.originSeries.operationalLeadingRegularityReplay,
    ).toMatchObject({
      authority: "server_recomputed_fail_closed_replay",
      evaluatedAtEveryAcceptedStageAndResolution: true,
      evaluatorPolicyArtifact: null,
      evaluatorPolicySha256: null,
      replayReceipt: null,
      present: false,
      passed: false,
      structurallyAdmissible: false,
    });
    expect(
      contract.originSeries.operationalLeadingRegularityReplay.checks,
    ).toEqual([
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
    ]);
    expect(contract.originSeries.higherOrderCoefficientAuthority).toEqual({
      frozenHere: false,
      symbolicCovariantDerivationArtifactRequired: true,
      domainSeparatedSha256Required: true,
      independentReplayRequired: true,
      derivationArtifact: null,
      derivationArtifactSha256: null,
      replayReceipt: null,
      present: false,
      structurallyAdmissible: false,
    });
    expect(contract.branchSelection).toMatchObject({
      quantumNumbers: { N: 2, ell: 1, m: 0 },
      radialNodeCount: 0,
      intendedBranch: "first_vacuum_connected_no_fold_no_node_branch",
      northLobePhase: "positive",
    });
    expect(contract.branchSelection.targetAmplitude).toEqual({
      definition: "A=max_domain(abs(varphi))",
      exact: "2^-10",
      value: 2 ** -10,
    });
    expect(contract.branchSelection.continuousPeakNormalization).toMatchObject({
      interpolation: "tensor_product_barycentric_Chebyshev_interpolant",
      rhoPeakDomain: "0<rhoPeak<1",
      equations: ["varphi(rhoPeak,0)=A", "partial_rho(varphi)(rhoPeak,0)=0"],
    });
    expect(
      contract.branchSelection.continuousPeakNormalization
        .hardInequalitiesAndUniqueness,
    ).toContain("partial_rho^2(varphi)(rhoPeak,0)<0");
    expect(contract.branchSelection.branchIdentityAuthority).toBe(
      "server_replay_required_previous_solution_initialization_is_not_evidence",
    );
    expect(contract.branchSelection.branchIdentityAndFoldReplay).toMatchObject({
      authority: "server_recomputed_fail_closed_replay",
      replayPolicyArtifact: null,
      replayPolicySha256: null,
      replayReceipt: null,
      firstVacuumConnectedBranchEstablished: false,
      noFoldEstablished: false,
      present: false,
      structurallyAdmissible: false,
    });
  });

  it("requires a separately hash-bound null seed and freezes the continuation without fallback", () => {
    const policy =
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.initializationAndContinuation;
    expect(policy.newtonianSeed).toMatchObject({
      requiredKind: "nodeless_Newtonian_Schrodinger_Poisson_2p_seed",
      separateArtifactRequired: true,
      sha256RequiredBeforeExecution: true,
      artifact: null,
      artifactSha256: null,
      present: false,
      structurallyAdmissible: false,
    });
    expect(policy.amplitudeStages.map(({ exact }) => exact)).toEqual([
      "2^-16",
      "2^-15",
      "2^-14",
      "2^-13",
      "2^-12",
      "2^-11",
      "2^-10",
    ]);
    expect(
      policy.deterministicSolveSchedule
        .skipFallbackRetryWithRetunedPhysicsOrScheduleAllowed,
    ).toBe(false);
    expect(policy.deterministicSolveSchedule.branchSwitchAllowed).toBe(false);
    expect(
      policy.deterministicSolveSchedule
        .previousSolutionInitializationHasBranchIdentityAuthority,
    ).toBe(false);
    expect(
      policy.deterministicSolveSchedule
        .everyStageRemainsUnpromotedUntilBranchIdentityAndFoldReplay,
    ).toBe(true);
    expect(policy.directVacuumOrArbitraryFrequencyInitializationAllowed).toBe(
      false,
    );
  });

  it("keeps solver constraints partial and blocks execution on a hash-bound implementation policy", () => {
    const contract = NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1;
    expect(contract.nonlinearSolverPolicy).toMatchObject({
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
      },
      hashBoundImplementationPolicy: {
        requiredBeforeExecution: true,
        domainSeparatedSha256Required: true,
        policyArtifact: null,
        policyArtifactSha256: null,
        implementationReceipt: null,
        present: false,
        structurallyAdmissible: false,
      },
    });
    expect(contract.nonlinearSolverPolicy.unavailableRequiredChoices).toEqual([
      "nonlinear_unknown_scaling",
      "nonlinear_residual_norm",
      "merit_function",
      "GMRES_restart_policy",
      "preconditioner",
      "Jacobian_vector_product_realization",
      "deterministic_floating_point_and_reduction_policy",
    ]);
  });

  it("freezes grouping-invariant server residual normalization and resource rails", () => {
    const contract = NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1;
    expect(contract.diagnosticRails.residualNormalization).toEqual({
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
    });
    expect(contract.diagnosticRails).toMatchObject({
      authority:
        "frozen_preregistration_diagnostic_rails_not_certified_physical_authority",
      solvedNormalizedPdeLInf: { maximum: 1e-9 },
      independentlyOversampledCovariantPdeLInf: { maximum: 1e-7 },
      boundaryConditionLInf: { maximum: 1e-10 },
      unusedEinsteinConstraintNormalizedLInf: { maximum: 1e-6 },
      axisConicalLInf: { maximum: 1e-8 },
      amplitudeAbsoluteError: { maximum: 1e-12 },
      fullDomainParityLInf: { maximum: 1e-12 },
      adjacentResolutionFrequencyRelativeDifference: { maximum: 1e-4 },
      adjacentResolutionFieldRelativeLInfDifference: { maximum: 1e-3 },
      allRailsAreHardAndConjunctive: true,
    });
    expect(contract.resourcePolicy).toEqual({
      maximumChildRssMiB: 768,
      maximumWallSeconds: 1800,
      maximumProcesses: 1,
      maximumThreads: 1,
      maximumBlasThreads: 1,
      minimumHostReserveGiB: 2,
      network: "denied",
      osLevelEnforcementImplemented: false,
      executionBlockedUntilEnforced: true,
    });
  });

  it("contains no solver output or promoted claim authority", () => {
    const contract = NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1;
    expect(contract.solverImplemented).toBe(false);
    expect(contract.executionAuthorized).toBe(false);
    expect(contract.executionState.executionPresent).toBe(false);
    expect(contract.executionState.structurallyAdmissible).toBe(false);
    for (const [key, value] of Object.entries(contract.executionState)) {
      if (key === "executionPresent" || key === "structurallyAdmissible")
        continue;
      expect(value, key).toBeNull();
    }
    expect(contract.blockers).toBe(
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BLOCKERS,
    );
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "hash_bound_solver_implementation_policy_and_receipt_absent",
        "origin_regularity_server_replay_absent",
        "branch_identity_and_fold_server_replay_absent",
      ]),
    );
    expect(contract.claimLocksExhaustive).toBe(true);
    expect(contract.claimLockKeys).toHaveLength(
      Object.keys(contract.claimLocks).length,
    );
    expect(
      Object.values(contract.claimLocks).every((value) => value === false),
    ).toBe(true);
    expect(contract.claimLocks).toMatchObject({
      classicalBranchSolverImplementationBound: false,
      classicalBranchIdentityReplayPassed: false,
      classicalOriginRegularityReplayPassed: false,
      classicalBranchNoFold: false,
    });
  });

  it("exports stable canonical bytes and a domain-separated SHA-256 binding", () => {
    const expected = createHash("sha256")
      .update(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_SHA256_DOMAIN, "utf8")
      .update(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON, "utf8")
      .digest("hex");
    expect(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_SHA256_DOMAIN).toBe(
      "nhm2-prolate-boson-star-branch-bvp/v1\n",
    );
    expect(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_SHA256).toBe(expected);
    expect(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_SHA256).toBe(
      "4c6d460b8dc83719c590cc24caed9f8e8ad91474528efaacb334226a391c6747",
    );
    expect(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_SHA256).toMatch(
      /^[0-9a-f]{64}$/,
    );
    expect(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES).toBe(
      Buffer.byteLength(
        NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON,
        "utf8",
      ),
    );
    expect(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES).toBe(
      17355,
    );
    expect(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING).toEqual({
      artifactId: "nhm2.prolate_boson_star_branch_bvp",
      contractVersion: "nhm2_prolate_boson_star_branch_bvp/v1",
      sha256Domain: "nhm2-prolate-boson-star-branch-bvp/v1\n",
      sha256:
        "4c6d460b8dc83719c590cc24caed9f8e8ad91474528efaacb334226a391c6747",
      canonicalSizeBytes: 17355,
    });
  });

  it("accepts only the recursively frozen authoritative singleton", () => {
    const contract = NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1;
    expectDeepFrozen(contract);
    expect(isNhm2ProlateBosonStarBranchBvpV1(contract)).toBe(true);
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(contract)).toEqual([]);
    expect(isNhm2ProlateBosonStarBranchBvpV1(clone())).toBe(false);
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(clone())).toEqual([
      "branch_bvp_v1_external_copy_not_authoritative",
    ]);

    const drift = clone();
    drift.executionAuthorized = true;
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(drift)).toEqual([
      "branch_bvp_v1_semantic_mismatch",
    ]);

    const wrapped = new Proxy(contract, {});
    expect(isNhm2ProlateBosonStarBranchBvpV1(wrapped)).toBe(false);
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(wrapped)).toEqual([
      "branch_bvp_v1_external_copy_not_authoritative",
    ]);
  });

  it("rejects accessors and malformed object surfaces without invoking getters", () => {
    const accessor = clone();
    let invocations = 0;
    Object.defineProperty(accessor, "authority", {
      get() {
        invocations += 1;
        return "preregistered_classical_branch_bvp_only";
      },
      enumerable: true,
    });
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(accessor)).toEqual([
      "object_property_surface:/authority",
    ]);
    expect(invocations).toBe(0);

    const hidden = clone();
    Object.defineProperty(hidden, "hidden", { value: true, enumerable: false });
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(hidden)).toEqual([
      "object_property_surface:/hidden",
    ]);

    const symbolKey = clone();
    Object.defineProperty(symbolKey, Symbol("hostile"), {
      value: true,
      enumerable: true,
    });
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(symbolKey)).toEqual([
      "symbol_key:/",
    ]);

    const forbidden = clone();
    Object.defineProperty(forbidden, "__proto__", {
      value: "hostile",
      enumerable: true,
    });
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(forbidden)).toEqual([
      "forbidden_key:/__proto__",
    ]);
  });

  it("fails closed for sparse, cyclic, invalid-number, and revoked-proxy inputs", () => {
    const sparse = clone();
    const sparseSources = new Array(2);
    sparseSources[0] = sparse.sourceBindings[0];
    sparse.sourceBindings = sparseSources;
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(sparse)).toEqual([
      "array_surface:/sourceBindings",
    ]);

    const cyclic = clone();
    cyclic.loop = cyclic;
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(cyclic)).toEqual([
      "cyclic_value:/loop",
    ]);

    const invalidNumber = clone();
    invalidNumber.resourcePolicy.maximumChildRssMiB = Number.NaN;
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(invalidNumber)).toEqual([
      "invalid_number:/resourcePolicy/maximumChildRssMiB",
    ]);

    const revocable = Proxy.revocable(clone(), {});
    revocable.revoke();
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(revocable.proxy)).toEqual([
      "branch_bvp_v1_plain_data_snapshot_invalid",
    ]);
  });

  it("caps hostile snapshot depth, nodes, arrays, object width, and UTF-8 strings", () => {
    expect(NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS).toEqual({
      maximumDepth: 32,
      maximumNodes: 8192,
      maximumArrayLength: 512,
      maximumObjectPropertyCount: 256,
      maximumStringUtf8Bytes: 8192,
    });

    const longString = clone();
    longString.authority = "x".repeat(
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS.maximumStringUtf8Bytes +
        1,
    );
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(longString)).toEqual([
      "string_byte_length_limit:/authority",
    ]);

    const deep = clone();
    let cursor: Record<string, unknown> = {};
    deep.deep = cursor;
    for (
      let index = 0;
      index <=
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS.maximumDepth;
      index += 1
    ) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(deep)[0]).toMatch(
      /^snapshot_depth_limit:/,
    );

    const wide = clone();
    wide.wide = Object.fromEntries(
      Array.from(
        {
          length:
            NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS.maximumObjectPropertyCount +
            1,
        },
        (_, index) => [`k${index}`, index],
      ),
    );
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(wide)).toEqual([
      "object_property_count_limit:/wide",
    ]);

    const tooLong = clone();
    const longArray: unknown[] = [];
    longArray.length =
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS.maximumArrayLength +
      1;
    let ownKeysCalls = 0;
    tooLong.sourceBindings = new Proxy(longArray, {
      ownKeys(target) {
        ownKeysCalls += 1;
        return Reflect.ownKeys(target);
      },
    });
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(tooLong)).toEqual([
      "array_length_limit:/sourceBindings",
    ]);
    expect(ownKeysCalls).toBe(0);

    const tooManyNodes = clone();
    tooManyNodes.nodeBomb = Array.from(
      {
        length:
          NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS.maximumArrayLength,
      },
      () => ({ values: Array.from({ length: 16 }, () => 0) }),
    );
    expect(nhm2ProlateBosonStarBranchBvpV1Violations(tooManyNodes)[0]).toMatch(
      /^snapshot_node_limit:/,
    );
  });
});
