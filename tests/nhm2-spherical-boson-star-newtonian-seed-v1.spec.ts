import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_VALIDATOR_LIMITS,
  isNhm2SphericalBosonStarNewtonianSeedV1,
  nhm2SphericalBosonStarNewtonianSeedV1Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed.v1";

const clone = (): Record<string, any> =>
  JSON.parse(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON);

describe("spherical boson-star Newtonian seed v1", () => {
  it("pins the exact canonical singleton independently", () => {
    const expectedSha =
      "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c";
    const expectedSize = 18894;
    expect(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256).toBe(
      expectedSha,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
    ).toBe(expectedSize);
    expect(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_SHA256).toBe(
      expectedSha,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(expectedSize);
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(expectedSize);
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(expectedSha);
    expect(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.sha256).toBe(
      expectedSha,
    );
  });

  it("exact-binds the new candidate, tolerance, and radial BVP", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING_PINS).toEqual({
      candidateSha256:
        "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
      candidateCanonicalSizeBytes: 93214,
      toleranceSha256:
        "867d96458940149f386d7153dff06c95ae336af222f5f42d8903fb18a728448d",
      toleranceCanonicalSizeBytes: 6302,
      branchBvpSha256:
        "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
      branchBvpCanonicalSizeBytes: 13847,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.branchIdentity
        .distinctFromObservedProlateLineage,
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.branchIdentity
        .failedLimitDisposition,
    ).toBe("fail_candidate_without_retuning_or_fallback");
  });

  it("freezes the radial l=0 SP eigenproblem and spherical gauge", () => {
    const problem =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.radialSchrodingerPoissonProblem;
    expect(problem.schrodingerResidual).toBe(
      "R_S=-(1/2)*(u_double_prime+2*u_prime/x)+(V-nu)*u",
    );
    expect(problem.poissonResidual).toBe("R_P=V_double_prime+2*V_prime/x-u^2");
    expect(problem.baseGauge.centralScalar).toBe(1);
    expect(problem.baseGauge.nu0IsSolvedEigenvalue).toBe(true);
    expect(
      problem.baseGauge.baseNuNeedNotSatisfyRelativisticFrequencyDomain,
    ).toBe(true);
    expect(problem.boundaryConditions).toHaveLength(5);
  });

  it("freezes exact origin recurrence and the lambda=2^-5 target map", () => {
    const origin =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.regularOriginSeries;
    expect(origin.explicitCoefficients).toEqual({
      a2: "A*delta/3",
      a4: "A*(2*delta^2+A^2)/60",
      b2: "A^2/6",
      b4: "A^2*delta/30",
    });
    expect(origin.requiredOriginSign).toBe("delta<0_and_h(0)>0");
    const scaling =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.exactScalingToFrozenCandidate;
    expect(scaling.lambda).toBe(2 ** -5);
    expect(scaling.targetCentralAmplitude).toBe(2 ** -10);
    expect(scaling.eigenvalue).toBe("nu_star=lambda^2*nu0=2^-10*nu0");
    expect(scaling.hardDomain).toBe("-1/2<nu_star<0_and_0<wSeed<1");
    expect(scaling.continuousCandidateNormalizationGate).toMatchObject({
      equality: "max_(x>=0)|u_star(x)|=u_star(0)=2^-10",
      nodalOrOriginValueAloneIsSufficient: false,
      established: false,
    });
  });

  it("forbids a finite compact polynomial from masquerading as the global tail", () => {
    const core = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.compactCore;
    const exterior =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.compositeExterior;
    expect(core.baseCoreMaximumX).toBe(32);
    expect(core.rawPolynomialBeyondCoreHasContinuumAuthority).toBe(false);
    expect(core.rawPolynomialMaySupplyGlobalIntegralsOrTailClaims).toBe(false);
    expect(exterior.baseJoinX).toBe(32);
    expect(exterior.targetJoinX).toBe(1024);
    expect(exterior.exactValueAndFirstDerivativeEqualityAtJoinRequired).toBe(
      true,
    );
    expect(exterior.coulombCoefficient).toBe("C=N0/(4*pi)>0");
    expect(exterior.recurrenceDoesNotEraseSourcedExponentialRemainders).toBe(
      true,
    );
    expect(exterior.principalSectorSemantics).toContain(
      "formal_asymptotic_sector_only",
    );
    expect(exterior.valueEvaluatorAuthority).toContain(
      "finite_representative_plus_directed_outward_remainder",
    );
    expect(exterior.finiteTailRepresentativePolicy).toBeNull();
    expect(exterior.established).toBe(false);
  });

  it("freezes grids, strong rails, output inventory, and one-attempt chronology", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.compactCore.levels.map(
        (level) => [
          level.id,
          level.radialNodeCount,
          level.solveScheduled,
          level.resamplingScheduled,
          level.executionObserved,
          level.accepted,
        ],
      ),
    ).toEqual([
      ["L0", 64, true, false, false, false],
      ["L1", 96, true, false, false, false],
      ["L2", 128, true, false, false, false],
      ["AUDIT", 256, false, true, false, false],
    ]);
    const rails =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.frozenNumericalRails;
    expect(rails.productionSchrodingerNormalizedLInfMaximum).toBe(1e-10);
    expect(rails.productionPoissonNormalizedLInfMaximum).toBe(1e-10);
    expect(rails.radialSpectralTailRelativeMaximum).toBe(1e-10);
    expect(rails.angularTailGatePresent).toBe(false);
    expect(rails.D01OverD12Minimum).toBe(4);
    expect(rails.targetAmplitudeAbsoluteErrorMaximum).toBe(2 ** -30);
    expect(rails.status).toContain("incomplete_until_the_successor");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.deterministicSchedule
        .retryAfterAnyFailedStageAllowed,
    ).toBe(false);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.outputInventory,
    ).toMatchObject({
      arrayCount: 20,
      exactElementCount: 2720,
      exactByteCount: 21760,
      arrays: null,
    });
  });

  it("freezes unambiguous per-level replay roles and future descriptor duties", () => {
    const inventory =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.outputInventory;
    expect(inventory.arrayRoleSourceMatrix).toHaveLength(4);
    expect(inventory.arrayRoleSourceMatrix[0].target_scalar_u_star).toContain(
      "not_an_L0_target_solve",
    );
    expect(inventory.arrayRoleSourceMatrix[2].base_scalar_u0).toContain(
      "defining_the_core_reconstruction_only_on_x<=32",
    );
    expect(inventory.arrayRoleSourceMatrix[3].base_scalar_u0).toContain(
      "final_verified_L2_core_plus_tail_base_composite",
    );

    const descriptor =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.outputDescriptorSuccessorRequirements;
    expect(descriptor.scalarMetadata.roleOrder).toEqual([
      "nu0",
      "Vc",
      "N0",
      "C",
      "kappa",
      "sigma",
      "lambda",
      "nu_star",
      "wSeed",
    ]);
    expect(descriptor.scalarMetadata.exactCount).toBe(9);
    expect(descriptor.mandatoryReplayPayloadsInExactFutureOrder).toContain(
      "finite_tail_representative_coefficient_arrays_and_C",
    );
    expect(descriptor.descriptorSchemaBinding).toBeNull();
    expect(
      [
        descriptor.descriptorSchemaBinding,
        descriptor.coreCoefficientInventoryBinding,
        descriptor.tailRepresentativeInventoryBinding,
        descriptor.remainderRecordSchemaBinding,
        descriptor.proofOperandInventoryBinding,
      ].every((value) => value === null),
    ).toBe(true);
    expect(descriptor.completeBeforeExecution).toBe(false);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.executionBoundary
        .executionAuthorized,
    ).toBe(false);
  });

  it("freezes convergence meanings and the seed-to-BVP bridge without authority", () => {
    const gates =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.convergenceAndGateDefinitions;
    expect(gates.fieldDifference).toContain("0<=x<=32");
    expect(gates.radialSpectralTail).toContain("last_8");
    expect(gates.boundaryTupleOrder).toHaveLength(9);
    expect(gates.targetAmplitudeAbsoluteError).toBe("abs(u_star(0)-2^-10)");
    expect(gates.tailScaledResidualThreshold).toBeNull();
    expect(gates.completeNumericalDefinitionFreeze).toBe(false);

    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.relativisticBvpInitializationMap,
    ).toMatchObject({
      varphiInit: "varphi_init(x)=u_star(x)",
      F0Init: "F0_init(x)=V_star(x)",
      F1Init: "F1_init(x)=-V_star(x)",
      wInit: "w_init=sqrt(1+2*nu_star)",
      branchBvpMustResolveWAgain: true,
      establishesRelativisticEkgResidualAuthority: false,
      establishesBranchAuthority: false,
      establishesNoFoldAuthority: false,
    });
  });

  it("keeps every execution, lamp, and physical authority closed", () => {
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.authorityBoundary,
      ).every((value) => value === false),
    ).toBe(true);
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.claimLocks,
      ).every((value) => value === false),
    ).toBe(true);
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.unresolvedExecution,
      ).every((value) => value === null),
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.executionBoundary,
    ).toMatchObject({
      solverImplemented: false,
      executionAuthorized: false,
      executionPresent: false,
      outputPresent: false,
      structurallyAdmissible: false,
    });
  });

  it("treats only the recursively frozen singleton as authoritative", () => {
    expect(
      isNhm2SphericalBosonStarNewtonianSeedV1(
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1,
      ),
    ).toBe(true);
    expect(
      nhm2SphericalBosonStarNewtonianSeedV1Violations(
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1,
      ),
    ).toEqual([]);
    expect(Object.isFrozen(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1)).toBe(
      true,
    );
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.compositeExterior,
      ),
    ).toBe(true);
    expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(clone())).toEqual([
      "spherical_newtonian_seed_v1_external_copy_not_authoritative",
    ]);
  });

  it("rejects semantic and authority drift", () => {
    const drift = clone();
    drift.authorityBoundary.physicalViability = true;
    expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(drift)).toEqual([
      "spherical_newtonian_seed_v1_semantic_mismatch",
    ]);
    const tailDrift = clone();
    tailDrift.compactCore.rawPolynomialBeyondCoreHasContinuumAuthority = true;
    expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(tailDrift)).toEqual([
      "spherical_newtonian_seed_v1_semantic_mismatch",
    ]);
  });

  it("rejects proxies and accessors without invoking them", () => {
    let trapReads = 0;
    const proxy = new Proxy(clone(), {
      getPrototypeOf() {
        trapReads += 1;
        throw new Error("must not execute");
      },
      ownKeys() {
        trapReads += 1;
        throw new Error("must not execute");
      },
    });
    expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(proxy)).toEqual([
      "proxy_forbidden:/",
    ]);
    expect(trapReads).toBe(0);

    let getterReads = 0;
    const accessor = clone();
    Object.defineProperty(accessor, "authority", {
      enumerable: true,
      get() {
        getterReads += 1;
        return "forged";
      },
    });
    expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(accessor)).toEqual([
      "object_property_surface:/authority",
    ]);
    expect(getterReads).toBe(0);
  });

  it("rejects hidden, symbol, forbidden, sparse, and array-side surfaces", () => {
    const hidden = clone();
    Object.defineProperty(hidden, "hidden", { value: true, enumerable: false });
    expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(hidden)).toEqual([
      "object_property_surface:/hidden",
    ]);

    const symbol = clone();
    Object.defineProperty(symbol, Symbol("hidden"), {
      value: true,
      enumerable: true,
    });
    expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(symbol)).toEqual([
      "symbol_key:/",
    ]);

    const forbidden = clone();
    Object.defineProperty(forbidden, "__proto__", {
      value: {},
      enumerable: true,
    });
    expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(forbidden)).toEqual([
      "forbidden_key:/__proto__",
    ]);

    const sparse = clone();
    delete sparse.compactCore.levels[1];
    expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(sparse)).toEqual([
      "array_surface:/compactCore/levels",
    ]);

    const side = clone();
    Object.defineProperty(side.compactCore.levels, "4294967295", {
      value: "extra",
      enumerable: true,
    });
    expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(side)).toEqual([
      "array_surface:/compactCore/levels",
    ]);
  });

  it("bounds hostile depth, width, strings, and numeric values", () => {
    const deep = clone();
    let cursor: Record<string, unknown> = {};
    deep.extra = cursor;
    for (
      let index = 0;
      index <
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_VALIDATOR_LIMITS.maximumDepth +
        4;
      index += 1
    ) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(deep)[0]).toMatch(
      /^snapshot_depth_limit:/,
    );

    const wide = clone();
    for (
      let index = 0;
      index <=
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_VALIDATOR_LIMITS.maximumObjectPropertyCount;
      index += 1
    ) {
      wide[`extra_${index}`] = index;
    }
    expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(wide)).toEqual([
      "object_property_count_limit:/",
    ]);

    for (const invalid of [Number.NaN, Infinity, -Infinity, -0]) {
      const numeric = clone();
      numeric.outputInventory.exactByteCount = invalid;
      expect(nhm2SphericalBosonStarNewtonianSeedV1Violations(numeric)[0]).toBe(
        "invalid_number:/outputInventory/exactByteCount",
      );
    }
  });
});
