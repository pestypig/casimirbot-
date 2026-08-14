import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_VALIDATOR_LIMITS,
  cloneNhm2SphericalBosonStarV2BranchSolverPolicy,
  isNhm2SphericalBosonStarV2BranchSolverPolicyV1,
  nhm2SphericalBosonStarV2BranchSolverPolicyViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-branch-solver-policy.v1";

const clone = (): any => cloneNhm2SphericalBosonStarV2BranchSolverPolicy();

describe("spherical boson-star v2 branch solver policy", () => {
  it("exact-binds the live BVP, seed-primary, v2 freeze, and initializer bridge", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING_PINS,
    ).toEqual({
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
    });
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY.exactUpstreamBindings,
      ).every(
        (binding) =>
          binding.sha256.length === 64 && binding.canonicalSizeBytes > 0,
      ),
    ).toBe(true);
  });

  it("keeps source candidate numerics separate from the target v2 candidate", () => {
    const boundary =
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY.candidateBoundary;
    expect(boundary.sourceAndTargetMustBeDistinct).toBe(true);
    expect(boundary.sourceCandidateId).not.toBe(boundary.targetCandidateId);
    expect(boundary.targetCandidateId).toBe(
      "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1",
    );
    expect(boundary.sourceCandidateId).toBe(
      "nhm2.semiclassical_v3.spherical_boson_star_1s_weak_field_control/v1",
    );
    expect(
      boundary.automaticV3RuntimeGridSolverContinuationOrReceiptInheritanceAllowed,
    ).toBe(false);
    expect(boundary.declaredLeverOrTileTensorUsed).toBe(false);
  });

  it("freezes only the upstream-closed continuum BVP semantics", () => {
    const bvp =
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY.bvpSemanticClosure;
    expect(bvp.radialDomain).toBe("x_in_[0,infinity)");
    expect(bvp.unknownFunctionOrder).toEqual(["F0(x)", "F1(x)", "varphi(x)"]);
    expect(bvp.eigenvalueUnknownOrder).toEqual(["w"]);
    expect(bvp.solvedResidualOrder.map(({ id }) => id)).toEqual([
      "einstein_Et_t",
      "einstein_Etheta_theta",
      "klein_gordon",
    ]);
    expect(bvp.unusedConstraintOrder.map(({ id }) => id)).toEqual([
      "einstein_Ex_x",
    ]);
    expect(bvp.boundaryConditions.originAmplitude.exact).toBe("2^-10");
    expect(bvp.submittedTargetOrResidualArraysMayBeRead).toBe(false);
    expect(bvp.equationsAndBoundaryDutiesFrozen).toBe(true);
    expect(bvp.discreteNumericalRealizationFrozen).toBe(false);
  });

  it("admits only the bridge initializer semantics and requires a new frequency solve", () => {
    const initializer =
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY.initializerAdmission;
    expect(initializer.exactScaling).toBe("lambda=2^-5");
    expect(initializer.varphiInit).toBe("varphi_init(x)=u_star(x)");
    expect(initializer.F0Init).toBe("F0_init(x)=V_star(x)");
    expect(initializer.F1Init).toBe("F1_init(x)=-V_star(x)");
    expect(initializer.wInit).toBe("w_init=sqrt(1+2*nu_star)");
    expect(initializer.relativisticBvpMustResolveFrequencyAgain).toBe(true);
    expect(initializer.initializerInstancePresent).toBe(false);
    expect(initializer.initializerBinding).toBeNull();
    expect(initializer.establishesRelativisticResidualPass).toBe(false);
    expect(initializer.establishesBranchIdentity).toBe(false);
    expect(initializer.establishesNoFold).toBe(false);
    expect(
      initializer.sourcePrimaryGridNewtonJacobianOrLinearSolveMayBeCopiedToTarget,
    ).toBe(false);
  });

  it("fails closed on every unselected discrete numerical surface", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY;
    expect(policy.gridPolicy).toMatchObject({
      status: "blocked_unclosed",
      discretizationFamily: null,
      nodeCountAndNodeFormula: null,
      differentiationOperatorConstruction: null,
      frozen: false,
    });
    expect(policy.continuationPolicy).toMatchObject({
      status: "blocked_unclosed",
      startAmplitude: null,
      stepSchedule: null,
      foldObservableAndThreshold: null,
      frozen: false,
    });
    expect(policy.newtonPolicy).toMatchObject({
      status: "blocked_unclosed",
      discreteStatePacking: null,
      updateEquationAndSign: null,
      iterationLimit: null,
      convergenceNormAndThreshold: null,
      frozen: false,
    });
    expect(policy.jacobianPolicy).toMatchObject({
      status: "blocked_unclosed",
      analyticAutomaticOrFiniteDifferenceSelection: null,
      discreteRowOrder: null,
      discreteColumnOrder: null,
      frozen: false,
    });
    expect(policy.linearSolvePolicy).toMatchObject({
      status: "blocked_unclosed",
      algorithm: null,
      pivotSelectionAndTieBreak: null,
      arithmeticPrecisionAndRounding: null,
      frozen: false,
    });
  });

  it("blocks dimensionless-to-SI output until an exact constants and conversion packet exists", () => {
    const normalization =
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY.siNormalizationClosure;
    expect(normalization.status).toBe("blocked_unclosed");
    expect(normalization.sourceNaturalUnits).toBe("hbar=c=1");
    expect(normalization.frozenCombinedMatterCoupling).toEqual({
      expression: "8*pi*G*mu^2",
      exact: "2^-40",
      value: 2 ** -40,
    });
    expect(normalization.declaredOutputUnits.meanRset).toBe("J/m^3");
    expect(normalization.declaredOutputUnits.noiseKernel).toBe("(J/m^3)^2");
    expect(normalization.outputUnitsAreLabelsNotConversionAuthority).toBe(true);
    expect(
      normalization.combinedEightPiGMuSquaredDeterminesSeparateGAndMuValues,
    ).toBe(false);
    expect(
      normalization.dimensionlessRadialSolutionMayBeTreatedAsSIStressBytes,
    ).toBe(false);
    expect(normalization.physicalConstantsDatasetIdentity).toBeNull();
    expect(normalization.codataReleaseIdentity).toBeNull();
    expect(
      normalization.gravitationalConstantGSIDecimalValueUnitAndUncertainty,
    ).toBeNull();
    expect(
      normalization.reducedPlanckConstantHbarSIExactValueAndUnit,
    ).toBeNull();
    expect(normalization.speedOfLightCSIExactValueAndUnit).toBeNull();
    expect(normalization.scalarMassOrInverseLengthMuSIExactBinding).toBeNull();
    expect(normalization.dimensionlessStressToJPerM3OperationGraph).toBeNull();
    expect(normalization.dimensionlessNoiseToJ2PerM6OperationGraph).toBeNull();
    expect(normalization.serverConversionReplayReceipt).toBeNull();
    expect(normalization.complete).toBe(false);
  });

  it("carries typed execution blockers with unique ids", () => {
    const blockers = NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY.blockers;
    expect(blockers).toHaveLength(12);
    expect(new Set(blockers.map(({ blockerId }) => blockerId)).size).toBe(12);
    expect(blockers.map(({ surface }) => surface)).toEqual([
      "grid",
      "continuation",
      "newton",
      "jacobian",
      "linear_solve",
      "origin_boundary",
      "infinity_boundary",
      "acceptance",
      "si_normalization",
      "initializer",
      "runtime",
      "replay",
    ]);
    expect(
      blockers.every(
        ({ upstreamEvidence, requiredResolution, disposition }) =>
          upstreamEvidence.length > 0 &&
          requiredResolution.length > 0 &&
          disposition.startsWith("block_candidate_"),
      ),
    ).toBe(true);
    expect(
      blockers.find(
        ({ blockerId }) =>
          blockerId === "natural_units_to_si_normalization_packet_unbound",
      )?.requiredResolution,
    ).toContain("CODATA");
  });

  it("freezes one attempt and fail-without-retune before any execution", () => {
    const attempt =
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY.attemptPolicy;
    expect(attempt.maximumCandidateAttempts).toBe(1);
    expect(attempt.retryAllowed).toBe(false);
    expect(attempt.retuneAllowed).toBe(false);
    expect(attempt.alternateInitializerOrBranchFallbackAllowed).toBe(false);
    expect(
      attempt.alternateGridContinuationNewtonJacobianLinearSolvePrecisionOrToleranceAllowed,
    ).toBe(false);
    expect(attempt.observationMaySelectOrChangeAnyNumericalChoice).toBe(false);
    expect(attempt.failureDisposition).toContain(
      "fail_the_distinct_frozen_v2_candidate_without_retuning_or_fallback",
    );
    expect(attempt.frozen).toBe(true);
  });

  it("contains no implementation, runtime, execution, replay, or acceptance evidence", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY;
    expect(Object.values(policy.executionClosure).filter(Boolean)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(policy.executionClosure.sourceManifest).toBeNull();
    expect(policy.executionClosure.toolchainManifest).toBeNull();
    expect(policy.executionClosure.executableBinding).toBeNull();
    expect(policy.executionClosure.runtimeManifest).toBeNull();
    expect(policy.executionClosure.scientificPreseal).toBeNull();
    expect(policy.executionClosure.command).toBeNull();
    expect(policy.executionClosure.branchExecutionReceipt).toBeNull();
    expect(policy.replayClosure.performed).toBe(false);
    expect(policy.replayClosure.passed).toBe(false);
    expect(policy.replayClosure.pairAgreementReceipt).toBeNull();
  });

  it("keeps completeness, lamps, physical viability, propulsion, and transport locked", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY;
    expect(policy.completion.policyComplete).toBe(false);
    expect(policy.completion.executionAuthorized).toBe(false);
    expect(policy.completion.executionObserved).toBe(false);
    expect(policy.completion.replayComplete).toBe(false);
    expect(policy.completion.independentAgreementComplete).toBe(false);
    expect(policy.completion.lampsPromoted).toBe(false);
    expect(policy.completion.siNormalizationComplete).toBe(false);
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_AUTHORITY_LOCKS,
      ).every((value) => value === false),
    ).toBe(true);
    expect(policy.authorityLocks.semiclassicalStressNoiseLamp).toBe(false);
    expect(policy.authorityLocks.semiclassicalConstraintAlgebraLamp).toBe(
      false,
    );
    expect(policy.authorityLocks.siNormalizationAuthority).toBe(false);
    expect(policy.authorityLocks.physicalViability).toBe(false);
    expect(policy.authorityLocks.propulsion).toBe(false);
    expect(policy.authorityLocks.transport).toBe(false);
  });

  it("is recursively frozen and sealed to literal canonical bytes", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY;
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.gridPolicy)).toBe(true);
    expect(Object.isFrozen(policy.blockers)).toBe(true);
    expect(Object.isFrozen(policy.blockers[0])).toBe(true);
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING.sha256,
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_SHA256);
  });

  it("accepts canonical plain data and rejects semantic drift", () => {
    expect(isNhm2SphericalBosonStarV2BranchSolverPolicyV1(clone())).toBe(true);
    const changed = clone();
    changed.gridPolicy.discretizationFamily = "guessed_chebyshev";
    expect(isNhm2SphericalBosonStarV2BranchSolverPolicyV1(changed)).toBe(false);
    expect(
      nhm2SphericalBosonStarV2BranchSolverPolicyViolations(changed),
    ).toEqual(["spherical_v2_branch_solver_policy_semantic_drift"]);
  });

  it("rejects proxies, accessors, cycles, symbols, non-plain objects, and hostile arrays", () => {
    expect(
      nhm2SphericalBosonStarV2BranchSolverPolicyViolations(
        new Proxy({}, {}),
      )[0],
    ).toContain("proxy_forbidden");

    const accessor = clone();
    Object.defineProperty(accessor, "maturity", {
      enumerable: true,
      get: () => "spoofed",
    });
    expect(
      nhm2SphericalBosonStarV2BranchSolverPolicyViolations(accessor)[0],
    ).toContain("object_entry_surface");

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(
      nhm2SphericalBosonStarV2BranchSolverPolicyViolations(cyclic)[0],
    ).toContain("cycle_forbidden");

    const symbolKey = clone();
    symbolKey[Symbol("hidden")] = true;
    expect(
      nhm2SphericalBosonStarV2BranchSolverPolicyViolations(symbolKey)[0],
    ).toContain("object_surface");

    expect(
      nhm2SphericalBosonStarV2BranchSolverPolicyViolations(
        Object.create(null),
      )[0],
    ).toContain("non_plain_object");

    const sparse = new Array(2);
    sparse[1] = 1;
    expect(
      nhm2SphericalBosonStarV2BranchSolverPolicyViolations(sparse)[0],
    ).toContain("array_surface");

    const extraArray = [1];
    Object.defineProperty(extraArray, "extra", {
      enumerable: true,
      value: true,
    });
    expect(
      nhm2SphericalBosonStarV2BranchSolverPolicyViolations(extraArray)[0],
    ).toContain("array_surface");
  });

  it("rejects non-JSON numbers and bounded-resource attacks", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -0, 1n]) {
      expect(
        nhm2SphericalBosonStarV2BranchSolverPolicyViolations(value).length,
      ).toBeGreaterThan(0);
    }

    expect(
      nhm2SphericalBosonStarV2BranchSolverPolicyViolations(
        "x".repeat(
          NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_VALIDATOR_LIMITS.maximumStringUtf8Bytes +
            1,
        ),
      )[0],
    ).toContain("string_byte_limit");

    let cursor: Record<string, unknown> = {};
    const root = cursor;
    for (
      let index = 0;
      index <
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_VALIDATOR_LIMITS.maximumDepth +
        2;
      index += 1
    ) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(
      nhm2SphericalBosonStarV2BranchSolverPolicyViolations(root)[0],
    ).toContain("snapshot_depth_limit");
  });
});
