import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1 as CONTRACT,
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_SEMANTIC_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_LITERAL_SEAL_STATUS,
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SEMANTIC_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SYNTHETIC_RECORD_HASH_DOMAIN,
  nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1CalculateSyntheticFixtureSelfHash,
  nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1SyntheticFixtureWireViolations,
  nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1WireViolations,
} from "@shared/contracts/nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi.v1";

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const dependencyPaths = {
  finalBranchSelectionNumerics:
    "shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts",
  branchBvp: "shared/contracts/nhm2-spherical-boson-star-branch-bvp.v1.ts",
  radialPrimaryNumerics:
    "shared/contracts/nhm2-spherical-boson-star-v2-radial-primary-numerics.v1.ts",
  finalCandidateFreezeV2:
    "shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v2.ts",
} as const;

const canonical = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonical(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(",")}}`;
};

const endpoint = (
  direction: "RNDD" | "RNDU",
  sign: "minus" | "plus" | "zero",
  mantissaLowercaseHex: string,
  exponent2: number,
) => ({
  direction,
  exponent2,
  mantissaLowercaseHex,
  precisionBits: 256,
  sign,
});

const syntheticPreimage = () => ({
  authorityFalse: true,
  contractVersion:
    "nhm2_spherical_boson_star_v2_vacuum_continuation_proof_abi/v1",
  disposition: "synthetic_fixture_validated_without_proof_authority",
  fixtureId: "synthetic.vacuum_continuation_codec.linear_map/v1",
  interval: [
    endpoint("RNDD", "minus", "1", -5),
    endpoint("RNDU", "plus", "3", -6),
  ],
  recordKind: "synthetic_fixture",
  recordOrdinal: 0,
  syntheticFixture: true,
  syntheticOnlyNoProofAuthority: true,
});

describe("NHM2 spherical boson-star v2 vacuum-continuation proof ABI v1", () => {
  it("binds the exact frozen predecessor source bytes and semantic identities", () => {
    for (const [key, path] of Object.entries(dependencyPaths)) {
      const bytes = readFileSync(path);
      const binding =
        CONTRACT.exactDependencyBindings[
          key as keyof typeof CONTRACT.exactDependencyBindings
        ];
      expect(binding.relativePath).toBe(path);
      expect(bytes.byteLength).toBe(binding.sizeBytes);
      expect(sha256(bytes)).toBe(binding.rawSha256);
    }
    expect(
      CONTRACT.exactDependencyBindings.finalBranchSelectionNumerics,
    ).toMatchObject({
      rawSha256:
        "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82",
      sizeBytes: 44_912,
      semanticSha256:
        "221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa",
      canonicalSizeBytes: 41_280,
    });
  });

  it("freezes all 1024 cells, 73 radii, and the exact logical product inventory", () => {
    expect(CONTRACT.frozenCoverDimensions.orderedCellOrdinals).toEqual(
      Array.from({ length: 1_024 }, (_, ordinal) => ordinal),
    );
    expect(
      CONTRACT.frozenCoverDimensions.exactOrderedRadiusExponentSet,
    ).toEqual(Array.from({ length: 73 }, (_, ordinal) => -80 + ordinal));
    expect(CONTRACT.logicalProducts).toMatchObject({
      exactLambdaZeroProductCount: 1,
      exactCellProductCount: 1_024,
      exactFaceProductCount: 1_023,
      exactSummaryProductCount: 1,
      exactTotalProductCount: 2_049,
      exactRadiusEvaluationsPerCell: 73,
      exactAllPassRadiusEvaluationCount: 74_752,
    });
    expect(CONTRACT.frozenCoverDimensions).toMatchObject({
      coefficientNormPolicyLabel: "weighted_l1_coefficient_norm",
      coefficientWeightExact: "17/16",
      requiredBoundsInOrder: ["Y", "Z0", "Z1", "Z2"],
      requiredBoundsNonnegativeAndOutwardRounded: true,
      finitePositiveLambdaMethodLabel:
        "MPFR256_directed_outward_radii_polynomial_interval_Newton_existence_and_local_uniqueness",
      methodLabelCompletesAnyMissingExactDefinition: false,
      lambdaZeroUsesIndependentDesingularizedLimitingProof: true,
      ordinaryIntervalNewtonOnUnscaledVacuumEquationsAtLambdaZeroForbidden: true,
      adjacentTubeSharedFaceOverlapRequired: true,
      adjacentTubeCompatibleOrientationRequired: true,
      firstTubeContainsCertifiedLambdaZeroLimit: true,
      lastTubeContainsLambda2Minus5TargetState: true,
      sevenBinary64ContinuationStagesAreDiagnosticsOnly: true,
      sevenStagesMaySubstituteForContinuousCover: false,
      expectedProofProduct: "existence_local_uniqueness_and_continuous_cover",
    });
    expect(
      CONTRACT.logicalProducts.orderedRoutes.map(
        ({ productKind, exactRecordCount }) => [productKind, exactRecordCount],
      ),
    ).toEqual([
      ["lambda_zero", 1],
      ["cell", 1_024],
      ["face", 1_023],
      ["summary", 1],
    ]);
  });

  it("freezes exact manifest, envelope, and product-payload key orders", () => {
    const orders = CONTRACT.exactWireKeyOrders;
    expect(orders.inputManifest).toEqual([
      "artifactId",
      "attemptOrdinal",
      "authorityFalse",
      "candidateId",
      "contractVersion",
      "inputManifestSelfSha256",
      "orderedInputBindings",
      "proofAbiSemanticSha256",
    ]);
    expect(orders.recordEnvelope).toEqual([
      "authorityFalse",
      "candidateId",
      "contractVersion",
      "inputManifestRawSha256",
      "payload",
      "payloadSha256",
      "productKind",
      "productOrdinal",
      "recordSelfSha256",
    ]);
    for (const order of Object.values(orders)) {
      expect(new Set(order).size).toBe(order.length);
    }
    expect(CONTRACT.dyadicEndpointCodec.exactKeyOrder).toEqual([
      "direction",
      "exponent2",
      "mantissaLowercaseHex",
      "precisionBits",
      "sign",
    ]);
  });

  it("keeps every unchosen scientific/runtime definition null with a one-to-one blocker", () => {
    const missing = CONTRACT.missingExactChoices;
    const keys = Object.keys(missing);
    expect(keys.length).toBeGreaterThan(30);
    expect(Object.values(missing).every((value) => value === null)).toBe(true);
    expect(missing).toMatchObject({
      desingularizedOperatorGDefinition: null,
      coefficientSpaceNormDefinition: null,
      analyticTailFactorizationDefinition: null,
      radiiPolynomialBoundAssemblyDefinition: null,
      intervalNewtonOperatorDefinition: null,
      intervalNewtonExistenceAndLocalUniquenessPredicateDefinition: null,
      YBoundDefinition: null,
      Z0BoundDefinition: null,
      Z1BoundDefinition: null,
      Z2BoundDefinition: null,
      sharedFaceOverlapPredicateDefinition: null,
      compatibleOrientationPredicateDefinition: null,
      lambdaZeroLimitingGroundStateDefinition: null,
      lambdaZeroSimpleKernelDefinition: null,
      lambdaZeroBifurcationTransversalityDefinition: null,
      intervalArithmeticDependencyLock: null,
      proofSourceManifestBinding: null,
      proofRuntimeBinding: null,
      proofIssuerBinding: null,
      proofBuilderBinding: null,
      terminalStateDefinition: null,
      terminalStateSourceBinding: null,
      terminalStateLiftDefinition: null,
      terminalStateContainmentPredicateDefinition: null,
    });
    expect(CONTRACT.blockers).toHaveLength(keys.length);
    expect(CONTRACT.blockers.map(({ choiceKey }) => choiceKey)).toEqual(keys);
    expect(
      CONTRACT.blockers.every(
        ({ choiceKey, blockerId }) =>
          blockerId === `missing_exact_${choiceKey}`,
      ),
    ).toBe(true);
  });

  it("freezes first-failure chronology and forbids every retune or fallback", () => {
    expect(CONTRACT.chronology[0]).toContain("raw_semantic_plain_and_size");
    expect(CONTRACT.chronology.at(-1)).toContain("first_failure");
    expect(CONTRACT.firstFailurePolicy.codesInPrecedenceOrder).toEqual([
      "VACUUM_POLICY_BINDING_MISMATCH",
      "VACUUM_PROOF_DEFINITION_UNBOUND",
      "VACUUM_SOURCE_CLOSURE_ABSENT",
      "VACUUM_RUNTIME_CLOSURE_ABSENT",
      "VACUUM_INPUT_MANIFEST_INVALID",
      "LAMBDA_ZERO_GROUND_STATE_UNPROVED",
      "LAMBDA_ZERO_KERNEL_NOT_SIMPLE",
      "LAMBDA_ZERO_TRANSVERSALITY_UNPROVED",
      "CELL_INPUT_INVALID",
      "CELL_INTERVAL_DOMAIN_FAILURE",
      "CELL_RADII_BOUNDS_INVALID",
      "CELL_NO_RADIUS",
      "FIRST_TUBE_MISSES_LAMBDA_ZERO",
      "CELL_SHARED_FACE_DISJOINT",
      "CELL_ORIENTATION_INCOMPATIBLE",
      "LAST_TUBE_MISSES_TARGET",
      "RECEIPT_PERSISTENCE_HASH_MISMATCH",
    ]);
    expect(CONTRACT.firstFailurePolicy).toMatchObject({
      stopBeforeLaterCellOrFace: true,
      retryAllowed: false,
      retuneAllowed: false,
      toleranceChangeAllowed: false,
      scheduleChangeAllowed: false,
      adaptiveSubdivisionAllowed: false,
      truncationIncreaseAllowed: false,
      precisionEscalationAllowed: false,
      alternateDefinitionSourceRuntimeOrTerminalStateAllowed: false,
      anyChangeRequiresNewContractVersion: true,
    });
  });

  it("keeps verifier, instances, readiness, authority, and every lamp false", () => {
    expect(CONTRACT.readiness.verifierImplemented).toBe(false);
    expect(CONTRACT.readiness.syntheticHarnessAvailable).toBe(true);
    expect(
      Object.entries(CONTRACT.readiness).every(
        ([key, value]) =>
          key === "syntheticHarnessAvailable" || value === false,
      ),
    ).toBe(true);
    expect(
      Object.values(CONTRACT.instances).every((value) => value === null),
    ).toBe(true);
    expect(
      Object.values(CONTRACT.authorityLocks).every((value) => value === false),
    ).toBe(true);
    expect(CONTRACT.syntheticHarness).toMatchObject({
      mayReadCandidateData: false,
      mayReadProofApproximants: false,
      mayEmitProofPass: false,
      maySetAnyReadinessOrAuthority: false,
    });
    expect(
      CONTRACT.additiveBoundary.bindsUnfinishedBoundaryRemaindersFiles,
    ).toBe(false);
  });

  it("admits only bounded primitive canonical JSON without touching hostile objects", () => {
    expect(CONTRACT.syntheticHarness.scope).toBe(
      "canonical_wire_budget_endpoint_codec_and_domain_separated_hash_calculation_only",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_SIZE_BYTES,
    ).toBeLessThanOrEqual(262_144);
    expect(
      nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1WireViolations(
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_JSON,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1WireViolations(
        ` ${NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_JSON}`,
      ),
    ).toContain("vacuum_proof_abi_canonical_json_required");

    const hostile = new Proxy(
      {},
      {
        ownKeys: () => {
          throw new Error("must not enumerate caller object");
        },
      },
    );
    expect(
      nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1WireViolations(
        hostile,
      ),
    ).toEqual(["vacuum_proof_abi_primitive_string_required"]);

    let getterRead = false;
    const accessor = Object.defineProperty({}, "x", {
      get: () => {
        getterRead = true;
        return 1;
      },
    });
    expect(
      nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1WireViolations(
        accessor,
      ),
    ).toEqual(["vacuum_proof_abi_primitive_string_required"]);
    expect(getterRead).toBe(false);

    const tooDeep = canonical(
      Array.from({ length: 34 }).reduce<unknown>((nested) => [nested], null),
    );
    expect(
      nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1WireViolations(
        tooDeep,
      ).some((violation) => violation.includes("_depth:")),
    ).toBe(true);
    expect(
      nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1WireViolations(
        canonical("x".repeat(16_385)),
      ).some((violation) => violation.includes("_string:")),
    ).toBe(true);
  });

  it("calculates and validates only a domain-separated authority-false synthetic fixture", () => {
    const preimage = syntheticPreimage();
    const preimageWire = canonical(preimage);
    const selfHash =
      nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1CalculateSyntheticFixtureSelfHash(
        preimageWire,
      );
    expect(selfHash).toMatch(/^[0-9a-f]{64}$/);
    const sealedWire = canonical({ ...preimage, recordSelfSha256: selfHash });
    expect(
      nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1SyntheticFixtureWireViolations(
        sealedWire,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1SyntheticFixtureWireViolations(
        canonical({ ...preimage, recordSelfSha256: "0".repeat(64) }),
      ),
    ).toEqual(["vacuum_proof_abi_synthetic_self_hash_mismatch"]);

    const noncanonicalMantissa = {
      ...preimage,
      interval: [
        endpoint("RNDD", "minus", "2", -6),
        endpoint("RNDU", "plus", "3", -6),
      ],
    };
    expect(() =>
      nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1CalculateSyntheticFixtureSelfHash(
        canonical(noncanonicalMantissa),
      ),
    ).toThrow("vacuum_proof_abi_synthetic_dyadic_interval_invalid");

    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SYNTHETIC_RECORD_HASH_DOMAIN,
          "utf8",
        )
        .digest("hex"),
    ).not.toBe(selfHash);
  });

  it("stays at the mandatory unpinned checkpoint until explicit parent acknowledgment", () => {
    const expected = [
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_SEMANTIC_SHA256,
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    ];
    const allNull = expected.every((value) => value === null);
    expect(
      expected.every((value) => value === null) ||
        expected.every((value) => value !== null),
    ).toBe(true);
    if (allNull) {
      expect(
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_LITERAL_SEAL_STATUS,
      ).toBe(
        "unsealed_pending_independent_parent_acknowledgement_before_any_verifier_implementation",
      );
    } else {
      expect(
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SEMANTIC_SHA256,
      ).toBe(
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_SEMANTIC_SHA256,
      );
      expect(
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_PLAIN_CANONICAL_SHA256,
      ).toBe(
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
      );
      expect(
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_SIZE_BYTES,
      ).toBe(
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_CANONICAL_SIZE_BYTES,
      );
    }
  });
});
