import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-1s-v3-tolerance-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1 as CONTRACT,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BLOCKERS,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS,
  isNhm2SphericalBosonStarBranchBvpV1,
  nhm2SphericalBosonStarBranchBvpV1Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-branch-bvp.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-coherent-candidate-plan.v1";

const clone = (): any =>
  JSON.parse(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON) as unknown;

const everyObjectFrozen = (
  value: unknown,
  seen = new Set<object>(),
): boolean => {
  if (value == null || typeof value !== "object" || seen.has(value)) {
    return true;
  }
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every((entry) =>
      everyObjectFrozen(entry, seen),
    )
  );
};

describe("NHM2 spherical boson-star branch BVP v1", () => {
  it("literal-pins the full contract bytes outside the canonical payload", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256_DOMAIN).toBe(
      "nhm2-spherical-boson-star-branch-bvp/v1\n",
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256).toBe(
      "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES).toBe(
      13847,
    );
    expect(
      createHash("sha256")
        .update(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256_DOMAIN, "utf8")
        .update(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON, "utf8")
        .digest("hex"),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256);
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES);
    expect(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING).toEqual({
      artifactId: "nhm2.spherical_boson_star_branch_bvp",
      contractVersion: "nhm2_spherical_boson_star_branch_bvp/v1",
      candidateId:
        "nhm2.semiclassical_v3.spherical_boson_star_1s_weak_field_control/v1",
      sha256Domain: "nhm2-spherical-boson-star-branch-bvp/v1\n",
      sha256:
        "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
      canonicalSizeBytes: 13847,
      mediaType: "application/json",
    });
  });

  it("exact-binds the frozen candidate and tolerance artifacts", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING_PINS).toEqual({
      candidateSha256:
        "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
      candidateCanonicalSizeBytes: 93214,
      tolerancePolicySha256:
        "867d96458940149f386d7153dff06c95ae336af222f5f42d8903fb18a728448d",
      tolerancePolicyCanonicalSizeBytes: 6302,
    });
    expect(NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING_PINS.candidateSha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING_PINS.candidateCanonicalSizeBytes,
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING_PINS.tolerancePolicySha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING_PINS.tolerancePolicyCanonicalSizeBytes,
    );
    expect(CONTRACT.bindingPins).toBe(
      NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING_PINS,
    );
    expect(CONTRACT.candidateBinding.canonicalBinding).toBe(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
    );
    expect(CONTRACT.tolerancePolicyBinding.canonicalBinding).toBe(
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING,
    );
    expect(CONTRACT.candidateBinding).toMatchObject({
      authoritativeSingletonIdentityRequired: true,
      artifactId: "nhm2.spherical_boson_star_coherent_candidate_plan",
      contractVersion: "nhm2_spherical_boson_star_coherent_candidate_plan/v1",
      candidateId:
        "nhm2.semiclassical_v3.spherical_boson_star_1s_weak_field_control/v1",
      scientificCandidateAdmissible: false,
    });
    expect(CONTRACT.tolerancePolicyBinding).toMatchObject({
      authoritativeSingletonIdentityRequired: true,
      artifactId: "nhm2.spherical_boson_star_1s_v3_tolerance_policy",
      contractVersion: "nhm2_spherical_boson_star_1s_v3_tolerance_policy/v1",
      policyId:
        "nhm2.server_owned.spherical_boson_star_1s.semiclassical_v3.tolerances/v1",
      presealReceipt: null,
      presealed: false,
    });
  });

  it("freezes the spherical chart, state ansatz, and dimensionless normalization", () => {
    expect(CONTRACT.covariantModel).toEqual({
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
    });
    expect(CONTRACT.dimensionlessRadialSystem).toEqual({
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
    });
  });

  it("freezes the cancellation-free radial EKG equations and row order", () => {
    expect(CONTRACT.radialJetNotation).toEqual({
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
    });
    expect(CONTRACT.cancellationFreeMixedComponents).toEqual({
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
    });
    expect(CONTRACT.ellipticResidualSystem).toEqual({
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
    });
    expect(CONTRACT.residualNormalization.solvedRows).toEqual([
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
    ]);
    expect(CONTRACT.residualNormalization.unusedConstraintRows).toEqual([
      {
        id: "einstein_Ex_x",
        expression: "abs(Ex_x)/(1+abs(Gx_x)+abs(Tx_x))",
      },
    ]);
    expect(CONTRACT.residualNormalization).toMatchObject({
      groupingOrTermSplittingMayChangeDenominator: false,
      numericAcceptanceThresholds: null,
      replayReceipt: null,
      passed: false,
    });
  });

  it("freezes regular-origin, asymptotic, branch, and fail-without-retune duties", () => {
    expect(CONTRACT.boundaryConditions).toEqual({
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
    });
    expect(CONTRACT.originSeriesDuty).toMatchObject({
      expansionVariable: "x",
      parity: "all_three_radial_unknowns_are_even_at_the_regular_origin",
      frozenLeadingForm: {
        F0: "f00+f02*x^2+O(x^4)",
        F1: "f10+f12*x^2+O(x^4)",
        varphi: "2^-10+p02*x^2+O(x^4)",
      },
      symbolicDerivationArtifact: null,
      derivationSha256: null,
      independentReplayReceipt: null,
      present: false,
      passed: false,
    });
    expect(CONTRACT.asymptoticTailSeriesDuty).toMatchObject({
      expansionVariable: "1/x",
      kappaDefinition: "kappa=sqrt(1-w^2)>0",
      frozenAnsatzClass: {
        F0: "sum_n>=1 a_n*x^-n",
        F1: "sum_n>=1 b_n*x^-n",
        varphi:
          "exp(-kappa*x)*x^sigma*sum_n>=0 c_n*x^-n_with_c0_strictly_positive",
      },
      noFlatSpaceOneOverXScalarTailMayBeAssumedWithoutDerivation: true,
      symbolicDerivationArtifact: null,
      derivationSha256: null,
      independentReplayReceipt: null,
      present: false,
      passed: false,
    });
    expect(CONTRACT.branchSelectionGates).toMatchObject({
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
    });
  });

  it("keeps every execution, evidence, lamp, and physical claim latch shut", () => {
    expect(CONTRACT.authority).toBe(
      "preregistered_radial_ekg_bvp_identity_only",
    );
    expect(CONTRACT.maturity).toBe(
      "frozen_equations_and_boundary_duties_no_solver_or_execution",
    );
    expect(CONTRACT.solverImplemented).toBe(false);
    expect(CONTRACT.executionAuthorized).toBe(false);
    expect(CONTRACT.sourceKernelReference).toMatchObject({
      role: "non_authoritative_pointwise_diagnostic_implementation_reference",
      sourceSha256: null,
      executableSha256: null,
      solverImplementation: false,
      executionAuthority: false,
    });
    expect(
      Object.values(CONTRACT.unresolvedExecutionSurface).every(
        (value) => value === null,
      ),
    ).toBe(true);
    expect(CONTRACT.executionBoundary).toEqual({
      solverPolicyRequiredBeforeExecution: true,
      gridPolicyRequiredBeforeExecution: true,
      continuationPolicyRequiredBeforeExecution: true,
      allThreeMustBeHashBoundByANewAuthorityContract: true,
      thisContractAuthorizesTheirFutureValues: false,
      executionPresent: false,
      structurallyAdmissible: false,
    });
    expect(
      Object.values(CONTRACT.authorityBoundary).every(
        (value) => value === false,
      ),
    ).toBe(true);
    expect(CONTRACT.authorityBoundary).toMatchObject({
      scientificCandidateAdmissible: false,
      executionAuthority: false,
      residualPassAuthority: false,
      nondegeneracyAuthority: false,
      rawReplayAuthority: false,
      pairAgreementAuthority: false,
      semiclassicalStressNoiseLamp: false,
      semiclassicalConstraintAlgebraLamp: false,
      diagnosticPass: false,
      theoryGraphAuthority: false,
      physicalViability: false,
      propulsion: false,
      transport: false,
    });
    expect(CONTRACT.claimLocksExhaustive).toBe(true);
    expect(new Set(CONTRACT.claimLockKeys).size).toBe(
      CONTRACT.claimLockKeys.length,
    );
    expect(new Set(CONTRACT.claimLockKeys)).toEqual(
      new Set(Object.keys(CONTRACT.claimLocks)),
    );
    expect(
      Object.values(CONTRACT.claimLocks).every((value) => value === false),
    ).toBe(true);
    expect(CONTRACT.blockers).toBe(
      NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BLOCKERS,
    );
    expect(CONTRACT.blockers).toEqual([
      "radial_solver_policy_absent",
      "radial_grid_policy_absent",
      "vacuum_connected_continuation_policy_absent",
      "origin_series_derivation_and_replay_absent",
      "asymptotic_tail_series_derivation_and_replay_absent",
      "branch_monotonicity_and_no_fold_replay_absent",
      "classical_radial_branch_not_executed",
      "candidate_metric_demand_nondegeneracy_receipt_absent",
    ]);
  });

  it("accepts only the recursively frozen authoritative singleton", () => {
    expect(everyObjectFrozen(CONTRACT)).toBe(true);
    expect(isNhm2SphericalBosonStarBranchBvpV1(CONTRACT)).toBe(true);
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(CONTRACT)).toEqual([]);
    expect(isNhm2SphericalBosonStarBranchBvpV1(clone())).toBe(false);
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(clone())).toEqual([
      "spherical_branch_bvp_v1_external_copy_not_authoritative",
    ]);
    const proxy = new Proxy(CONTRACT, {});
    expect(isNhm2SphericalBosonStarBranchBvpV1(proxy)).toBe(false);
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(proxy)).toEqual([
      "spherical_branch_bvp_v1_external_copy_not_authoritative",
    ]);
    expect(() => {
      (CONTRACT as any).executionAuthorized = true;
    }).toThrow(TypeError);
  });

  it("rejects semantic drift and hostile surfaces without invoking accessors", () => {
    const drift = clone();
    drift.authorityBoundary.diagnosticPass = true;
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(drift)).toEqual([
      "spherical_branch_bvp_v1_semantic_mismatch",
    ]);

    const accessor = clone();
    let getterCalls = 0;
    Object.defineProperty(accessor, "authority", {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return CONTRACT.authority;
      },
    });
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(accessor)).toEqual([
      "object_property_surface:/authority",
    ]);
    expect(getterCalls).toBe(0);

    const hidden = clone();
    Object.defineProperty(hidden, "side", {
      value: true,
      enumerable: false,
    });
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(hidden)).toEqual([
      "object_property_surface:/side",
    ]);

    const symbol = clone();
    symbol[Symbol("side")] = true;
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(symbol)).toEqual([
      "symbol_key:/",
    ]);

    const forbidden = clone();
    Object.defineProperty(forbidden, "constructor", {
      value: "side",
      enumerable: true,
    });
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(forbidden)).toEqual([
      "forbidden_key:/constructor",
    ]);

    const nonPlain = clone();
    nonPlain.dimensionlessRadialSystem.chart = Object.assign(
      Object.create(null),
      nonPlain.dimensionlessRadialSystem.chart,
    );
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(nonPlain)).toEqual([
      "non_plain_object:/dimensionlessRadialSystem/chart",
    ]);

    const sparse = clone();
    sparse.blockers = new Array(2);
    sparse.blockers[1] = "radial_grid_policy_absent";
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(sparse)).toEqual([
      "array_surface:/blockers",
    ]);

    const decoratedArray = clone();
    decoratedArray.blockers.side = true;
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(decoratedArray)).toEqual(
      ["array_surface:/blockers"],
    );
  });

  it("fails closed for cycles, invalid numbers, and adversarial proxies", () => {
    const cycle = clone();
    cycle.loop = cycle;
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(cycle)).toEqual([
      "cyclic_value:/loop",
    ]);

    for (const invalid of [Number.NaN, Infinity, -Infinity, -0]) {
      const numeric = clone();
      numeric.boundaryConditions.originAmplitude.value = invalid;
      expect(nhm2SphericalBosonStarBranchBvpV1Violations(numeric)).toEqual([
        "invalid_number:/boundaryConditions/originAmplitude/value",
      ]);
    }

    const throwingPrototype = new Proxy(clone(), {
      getPrototypeOf: () => {
        throw new Error("hostile");
      },
    });
    expect(
      nhm2SphericalBosonStarBranchBvpV1Violations(throwingPrototype),
    ).toEqual(["spherical_branch_bvp_v1_plain_data_snapshot_invalid"]);

    const throwingKeys = new Proxy(clone(), {
      ownKeys: () => {
        throw new Error("hostile");
      },
    });
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(throwingKeys)).toEqual([
      "spherical_branch_bvp_v1_plain_data_snapshot_invalid",
    ]);

    const revoked = Proxy.revocable(clone(), {});
    revoked.revoke();
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(revoked.proxy)).toEqual([
      "spherical_branch_bvp_v1_plain_data_snapshot_invalid",
    ]);
  });

  it("bounds hostile depth, nodes, arrays, object width, and UTF-8 strings", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_VALIDATOR_LIMITS).toEqual({
      maximumDepth: 32,
      maximumNodes: 8192,
      maximumArrayLength: 512,
      maximumObjectPropertyCount: 256,
      maximumStringUtf8Bytes: 8192,
    });

    const longString = clone();
    longString.authority = "x".repeat(8193);
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(longString)).toEqual([
      "string_byte_length_limit:/authority",
    ]);

    const deep = clone();
    let cursor: Record<string, unknown> = {};
    deep.deep = cursor;
    for (let index = 0; index <= 32; index += 1) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(deep)[0]).toMatch(
      /^snapshot_depth_limit:/,
    );

    const longArray = clone();
    longArray.side = Array.from({ length: 513 }, () => 0);
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(longArray)).toEqual([
      "array_length_limit:/side",
    ]);

    const wide = clone();
    wide.side = Object.fromEntries(
      Array.from({ length: 257 }, (_, index) => [`k${index}`, index]),
    );
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(wide)).toEqual([
      "object_property_count_limit:/side",
    ]);

    const nodeFlood = clone();
    nodeFlood.side = Array.from({ length: 256 }, () =>
      Array.from({ length: 40 }, (_, index) => index),
    );
    expect(nhm2SphericalBosonStarBranchBvpV1Violations(nodeFlood)[0]).toMatch(
      /^snapshot_node_limit:/,
    );
  });
});
