import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SEED_PIN,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_VALIDATOR_LIMITS,
  isNhm2SphericalBosonStarNewtonianSeedOperationPolicyV1,
  nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-operation-policy.v1";

const clone = (): Record<string, any> =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_JSON,
  );

describe("spherical Newtonian seed operation policy v1", () => {
  it("pins the exact canonical policy independently", () => {
    const expectedSha =
      "3aaadad7b8bec8d7883c172c380e10d3100c9e4c64404740b963e5820762de24";
    const expectedSize = 32308;
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
    ).toBe(expectedSha);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
    ).toBe(expectedSize);
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(expectedSha);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_EXPECTED_SHA256,
    ).toBe(expectedSha);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(expectedSize);
  });

  it("exact-binds the independently cleared semantic seed", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SEED_PIN,
    ).toEqual({
      sha256:
        "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c",
      canonicalSizeBytes: 18894,
    });
  });

  it("freezes exact square core systems and one deterministic Newton/LU path", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1;
    expect(policy.coreSquareSystem.unknownOrder).toContain("length_2N+1");
    expect(policy.coreSquareSystem.residualOrder).toContain("length_2N+1");
    expect(policy.coreSquareSystem.radialLaplacian).toBe(
      "Lrho(q)_i=(1-rho_i)^4*((D2*q)_i+2*(D*q)_i/rho_i)_for_1<=i<=N-2",
    );
    expect(policy.deterministicDenseLinearSolve).toMatchObject({
      rowScaling: "identity_only",
      columnScaling: "identity_only",
      iterativeRefinementPassCount: 3,
      equilibrationAllowed: false,
    });
    expect(policy.deterministicNewton).toMatchObject({
      maximumUpdatesPerCoreLevel: 48,
      maximumTailUpdates: 48,
      maximumLineSearchTrialsPerUpdate: 25,
      armijoConstantExact: "2^-12",
      linearRightHandSide: "solve_J_delta=-F",
      retryAfterFailureAllowed: false,
    });
    expect(policy.approximationAuthorityBoundary).toMatchObject({
      exactGlobalSchrodingerPoissonSolutionAuthority: false,
      exactCoreRootAuthority: false,
      exactRelativisticBranchAuthority: false,
      BvpMustResolveTheRelativisticEquationsIndependently: true,
    });
  });

  it("freezes the 65-row C1 tail with correct transformed equations", () => {
    const tail =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1.tailSquareSystem;
    expect(tail.coefficientCountPerField).toBe(32);
    expect(tail.unknownOrder).toContain("length_65");
    expect(tail.rowOrder).toContain("length_65");
    expect(tail.C1EliminatedLifts.Hy1).toBe("H_y(1)=(-kappa*R+sigma)*U-R*U1");
    expect(tail.C1EliminatedLifts.Qy1).toBe(
      "Q_y(1)=(-2*kappa*R+2*sigma)*Q(1)+C/R-R*V1",
    );
    expect(tail.scaledRows.schrodinger).toContain("R^2*(E/y^2)*Q*H");
    expect(tail.scaledRows.poisson).toContain("4*a^2");
    expect(tail.scaledRows.infinitySchrodinger).toBe(
      "S(0)=-a*Hy(0)-sigma*(sigma+1)*H(0)/2",
    );
    expect(tail.scaledRows.EOverYSquaredExtension).toContain(
      "not_real_analytic",
    );
    expect(tail.fullMassFixedPoint.residualSign).toContain("F_mass=C-");
  });

  it("closes representative-to-true-tail and open-endpoint proof duties", () => {
    const proof =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1.independentDirectedProof;
    expect(proof.outwardRemainderProof.BanachSpace).toContain("sum_n(1+n)^4");
    expect(proof.outwardRemainderProof.inequalities).toContain("p(r)=");
    expect(proof.outwardRemainderProof.uniqueness).toContain("exactly_one");
    expect(proof.positivity.decreasing).toContain("a*H+y^2*H_y");
    expect(proof.positivity.potentialOpenEndpoint).toContain(
      "sup(max(Q,0)*E/y)<C_lower/R",
    );
    expect(proof.tailResidualNormalization).toContain("no_additive_floor");
    expect(proof.unresolvedIntervalDisposition).toBe("fail_candidate");
  });

  it("freezes output materialization, proof records, hashing, and atomic publish", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1;
    expect(policy.materializationGraphs.coreCoefficients).toContain(
      "compute_a_m=(2/(N-1))",
    );
    expect(policy.materializationGraphs.BVPInitializer).toContain(
      "no_BVP_grid_values_are_emitted",
    );
    expect(policy.proofRecordSchemas.commonExactKeys).toHaveLength(11);
    expect(policy.outputDescriptorAndPayloadPolicy).toMatchObject({
      scalarByteLength: 72,
      arrayCount: 20,
      arrayByteLength: 21760,
      coreCoefficientByteLength: 4608,
      tailCoefficientByteLength: 512,
      partialOutputOnFailureAllowed: false,
    });
    expect(policy.outputDescriptorAndPayloadPolicy.writeProtocol).toContain(
      "atomically_rename_the_temp_root",
    );
    expect(policy.outputDescriptorAndPayloadPolicy.payloadHashDomain).toBe(
      "nhm2-spherical-boson-star-newtonian-seed-payload/v1\n",
    );
  });

  it("keeps one attempt, implementation closure, execution, lamps, and claims shut", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1;
    expect(policy.attemptPolicy).toMatchObject({
      maximumCandidateAttempts: 1,
      retryAfterAnyFailureAllowed: false,
      retuneGridJoinTailOrderPrecisionToleranceAlgorithmOrInitializerAllowed: false,
      branchFallbackAllowed: false,
    });
    expect(policy.completionBoundary).toMatchObject({
      primaryCandidateMapStructureFrozen: true,
      primaryOperationSemanticsComplete: false,
      primaryOutputInventoryComplete: true,
      directedProofOperatorSemanticsComplete: false,
      exactProofReceiptSchemasComplete: false,
      quadratureFixtureBound: false,
      operationSemanticsComplete: false,
      outputAndProofSchemasComplete: false,
      implementationClosureComplete: false,
      preexecutionPresealComplete: false,
      executionAuthorized: false,
      executionObserved: false,
      seedAccepted: false,
    });
    expect(Object.values(policy.authorityLocks).every((value) => !value)).toBe(
      true,
    );
    expect(Object.values(policy.claimLocks).every((value) => !value)).toBe(
      true,
    );
    expect(
      Object.values(policy.unresolved).every((value) => value === null),
    ).toBe(true);
  });

  it("treats only the frozen singleton as authoritative", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1;
    expect(isNhm2SphericalBosonStarNewtonianSeedOperationPolicyV1(policy)).toBe(
      true,
    );
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(policy),
    ).toEqual([]);
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.tailSquareSystem)).toBe(true);
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(clone()),
    ).toEqual([
      "spherical_seed_operation_policy_external_copy_not_authoritative",
    ]);
  });

  it("rejects semantic or authority drift", () => {
    const drift = clone();
    drift.authorityLocks.physicalViability = true;
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(drift),
    ).toEqual(["spherical_seed_operation_policy_semantic_mismatch"]);
    const formula = clone();
    formula.tailSquareSystem.scaledRows.schrodinger = "forged";
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(formula),
    ).toEqual(["spherical_seed_operation_policy_semantic_mismatch"]);
  });

  it("rejects proxies and accessors without executing them", () => {
    let traps = 0;
    const proxy = new Proxy(clone(), {
      getPrototypeOf() {
        traps += 1;
        throw new Error("must not execute");
      },
      ownKeys() {
        traps += 1;
        throw new Error("must not execute");
      },
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(proxy),
    ).toEqual(["proxy_forbidden:/"]);
    expect(traps).toBe(0);

    let getters = 0;
    const accessor = clone();
    Object.defineProperty(accessor, "purpose", {
      enumerable: true,
      get() {
        getters += 1;
        return "forged";
      },
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(accessor),
    ).toEqual(["object_property_surface:/purpose"]);
    expect(getters).toBe(0);
  });

  it("rejects hidden, symbolic, forbidden, sparse, and array-side properties", () => {
    const hidden = clone();
    Object.defineProperty(hidden, "hidden", { value: true, enumerable: false });
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(hidden),
    ).toEqual(["object_property_surface:/hidden"]);

    const symbol = clone();
    Object.defineProperty(symbol, Symbol("hidden"), {
      value: true,
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(symbol),
    ).toEqual(["symbol_key:/"]);

    const forbidden = clone();
    Object.defineProperty(forbidden, "__proto__", {
      value: {},
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(forbidden),
    ).toEqual(["forbidden_key:/__proto__"]);

    const sparse = clone();
    delete sparse.firstFailurePrecedence[1];
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(sparse),
    ).toEqual(["array_surface:/firstFailurePrecedence"]);

    const side = clone();
    Object.defineProperty(side.firstFailurePrecedence, "4294967295", {
      value: "extra",
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(side),
    ).toEqual(["array_surface:/firstFailurePrecedence"]);
  });

  it("bounds hostile depth, width, cycles, strings, and numbers", () => {
    const deep = clone();
    let cursor: Record<string, unknown> = {};
    deep.extra = cursor;
    for (
      let index = 0;
      index <
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_VALIDATOR_LIMITS.maximumDepth +
        4;
      index += 1
    ) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(deep)[0],
    ).toMatch(/^snapshot_depth_limit:/);

    const wide = clone();
    for (
      let index = 0;
      index <=
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_VALIDATOR_LIMITS.maximumObjectPropertyCount;
      index += 1
    ) {
      wide[`extra_${index}`] = index;
    }
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(wide),
    ).toEqual(["object_property_count_limit:/"]);

    const cycle = clone();
    cycle.self = cycle;
    expect(
      nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(cycle),
    ).toEqual(["cycle:/self"]);

    for (const invalid of [Number.NaN, Infinity, -Infinity, -0]) {
      const numeric = clone();
      numeric.outputDescriptorAndPayloadPolicy.arrayCount = invalid;
      expect(
        nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations(
          numeric,
        )[0],
      ).toBe("invalid_number:/outputDescriptorAndPayloadPolicy/arrayCount");
    }
  });
});
