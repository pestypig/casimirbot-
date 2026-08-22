import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1 as CONTRACT,
  NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_EXPECTED_SEMANTIC_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_LITERAL_SEAL_STATUS,
  NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_SEMANTIC_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_SEMANTIC_SHA256,
  cloneNhm2SphericalBosonStarV2LambdaZeroProofDefinitionV1CanonicalWire,
  isNhm2SphericalBosonStarV2LambdaZeroProofDefinitionV1Wire,
  nhm2SphericalBosonStarV2LambdaZeroProofDefinitionV1Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-lambda-zero-proof-definition.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1 as VACUUM_ABI } from "../shared/contracts/nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi.v1";

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const u64le = (value: number): Buffer => {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes;
};

const allNull = (value: unknown): boolean =>
  value === null ||
  (typeof value === "object" &&
    value !== null &&
    Object.values(value as Record<string, unknown>).every(allNull));

const allFalse = (value: unknown): boolean =>
  typeof value === "boolean"
    ? value === false
    : typeof value === "object" &&
      value !== null &&
      Object.values(value as Record<string, unknown>).every(allFalse);

describe("NHM2 spherical boson-star v2 lambda-zero proof definition v1", () => {
  it("binds every reviewed predecessor by exact raw bytes", () => {
    for (const binding of Object.values(CONTRACT.exactDependencyBindings)) {
      const bytes = readFileSync(binding.path);
      expect(bytes.byteLength).toBe(binding.sizeBytes);
      expect(sha256(bytes)).toBe(binding.rawSha256);
    }
    expect(
      CONTRACT.exactDependencyBindings.vacuumContinuationProofAbi,
    ).toMatchObject({
      semanticSha256:
        "2fb589d024463ec1e656a2b180b9fdfcd61713e474666afdc217c49f1bd03251",
      plainCanonicalSha256:
        "4af8b689f175a418cacf252f260aa513407bcdba6161cd6497ec17932b17c732",
      canonicalSizeBytes: 29_628,
    });
  });

  it("fills the four missing meanings only in an additive successor", () => {
    expect(VACUUM_ABI.missingExactChoices).toMatchObject({
      lambdaZeroBifurcationTransversalityDefinition: null,
      lambdaZeroFirstTubeContainmentDefinition: null,
      lambdaZeroLimitingGroundStateDefinition: null,
      lambdaZeroSimpleKernelDefinition: null,
    });
    expect(CONTRACT.lambdaZeroLimitingGroundStateDefinition).toBeDefined();
    expect(CONTRACT.fixedPotentialSimpleKernelDefinition).toBeDefined();
    expect(CONTRACT.transversalityDefinition).toBeDefined();
    expect(CONTRACT.firstTubeContainmentDefinition).toBeDefined();
  });

  it("requires an accepted global Newtonian root and forbids finite substitutes", () => {
    expect(
      CONTRACT.lambdaZeroLimitingGroundStateDefinition.requiredGlobalProduct,
    ).toContain("accepted_independently_replayed_global_root");
    expect(
      CONTRACT.lambdaZeroLimitingGroundStateDefinition.substitutesForbidden,
    ).toEqual([
      "N64_diagnostic",
      "unproved_seed_output",
      "origin_recurrence_without_exterior_global_root",
      "finite_exterior_truncation",
    ]);
    expect(CONTRACT.lambdaZeroLimitingGroundStateDefinition.exactG2Map).toEqual(
      {
        m0: "C=N0/(4*pi)=integral_0^infinity(y^2*u0(y)^2)dy",
        nu0: "nu",
        u0: "u",
        v0: "V",
        v1: "-V",
      },
    );
  });

  it("does not conflate spectral simplicity with coupled invertibility", () => {
    expect(CONTRACT.fixedPotentialSimpleKernelDefinition.claim).toBe(
      "kernel(L0)=span{u0}",
    );
    expect(
      CONTRACT.fixedPotentialSimpleKernelDefinition
        .coupledJacobianInvertibilityFollowsFromThisClaim,
    ).toBe(false);
    expect(
      CONTRACT.normalizedCoupledJacobianDefinition
        .spectralSimplicityMaySubstitute,
    ).toBe(false);
    expect(CONTRACT.normalizedCoupledJacobianDefinition.claim).toContain(
      "DR0_is_bijective",
    );
    expect(CONTRACT.normalizedCoupledJacobianDefinition.derivative).toEqual([
      "delta_R_u=L0*delta_u+u0*delta_V-u0*delta_nu",
      "delta_R_V=delta_V''+2*delta_V'/y-2*u0*delta_u",
      "delta_R_norm=delta_u(0)",
    ]);
  });

  it("freezes a strict adjoint transversality pairing", () => {
    expect(CONTRACT.transversalityDefinition).toMatchObject({
      adjointKernelRepresentative: "u0",
      parameterDerivative: "partial_nu_R_u=-u0",
      finiteDifferenceSlopeAllowed: false,
      nonzeroNormalizationAssertionAloneAllowed: false,
      separateFromCoupledJacobianInvertibility: true,
    });
    expect(
      CONTRACT.transversalityDefinition.requiredDirectedConclusion,
    ).toContain("=-N0<0");
  });

  it("requires an exact tangent embedding into the selected first tube", () => {
    expect(CONTRACT.lambdaZeroTangentDefinition).toMatchObject({
      analyticParameter: "s=lambda^2",
      finitePositiveLambdaDifferenceAllowed: false,
      orientation: "t_lambda=1",
    });
    expect(CONTRACT.firstTubeContainmentDefinition).toMatchObject({
      cellIdentity: "I_0=[0,2^-15]",
      pointwiseMatchIsContainment: false,
      requiresSelectedUniformTubeRadius: true,
      tangentInclusionRequired: true,
    });
    expect(CONTRACT.firstTubeContainmentDefinition.chronology).toHaveLength(7);
    expect(CONTRACT.firstTubeContainmentDefinition.chronology[4]).toContain(
      "select_lowest_ordinal",
    );
  });

  it("freezes the exact future product root order and self-hash", () => {
    const full = CONTRACT.receiptDefinition.exactFullRootKeysInCanonicalOrder;
    const unsigned =
      CONTRACT.receiptDefinition.exactUnsignedRootKeysInCanonicalOrder;
    expect(full).toEqual([...full].sort());
    expect(unsigned).toEqual([...unsigned].sort());
    expect(full).toHaveLength(13);
    expect(unsigned).toHaveLength(12);
    expect(new Set(full).size).toBe(full.length);
    expect(new Set(unsigned).size).toBe(unsigned.length);
    expect(full.filter((key) => key !== "receiptSha256")).toEqual(unsigned);
    expect(unsigned).not.toContain("receiptSha256");
    expect(CONTRACT.receiptDefinition.selfHashDomain.endsWith("\n")).toBe(true);
    expect(CONTRACT.receiptDefinition.selfHashRecipe).toContain("u64le");
    expect(
      CONTRACT.receiptDefinition.successfulProductRequiresEveryBinding,
    ).toBe(true);
  });

  it("keeps every instance null and every authority lock false", () => {
    expect(allNull(CONTRACT.instances)).toBe(true);
    expect(allFalse(CONTRACT.authorityLocks)).toBe(true);
    expect(CONTRACT.reviewBoundary).toEqual({
      definitionsFrozenByThisSuccessorOnly: true,
      implementationMayBeginAfterIndependentSemanticAudit: true,
      implementationOrExecutionCompleted: false,
      lambdaZeroProductProduced: false,
      proofClaimEstablished: false,
    });
  });

  it("recomputes plain and domain-separated semantic hashes independently", () => {
    const canonicalBytes = Buffer.from(
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_JSON,
      "utf8",
    );
    expect(canonicalBytes.byteLength).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_SIZE_BYTES,
    );
    expect(sha256(canonicalBytes)).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_PLAIN_CANONICAL_SHA256,
    );
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_SEMANTIC_DOMAIN,
          "utf8",
        )
        .update(u64le(canonicalBytes.byteLength))
        .update(canonicalBytes)
        .digest("hex"),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_SEMANTIC_SHA256,
    );
    expect(
      JSON.stringify(
        JSON.parse(
          NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_JSON,
        ),
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_JSON,
    );
  });

  it("pins the acknowledged repaired semantic tuple", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_EXPECTED_SEMANTIC_SHA256,
    ).toBe("bb8dc226a11d3189357f75da67b8ea7b189c09b9b0091fc42aabac4da66f629f");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
    ).toBe("39d71f698d1d8bbe0fa4fca6e3b1bd4d61f0f55a696555f771f00fdc0c06b23b");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(8_157);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_LITERAL_SEAL_STATUS,
    ).toContain("sealed_after_parent_acknowledgement_and_receipt_root_repair");
  });

  it("accepts only the one bounded primitive canonical wire without traps", () => {
    const wire =
      cloneNhm2SphericalBosonStarV2LambdaZeroProofDefinitionV1CanonicalWire();
    expect(
      isNhm2SphericalBosonStarV2LambdaZeroProofDefinitionV1Wire(wire),
    ).toBe(true);
    expect(
      nhm2SphericalBosonStarV2LambdaZeroProofDefinitionV1Violations(`${wire} `),
    ).toEqual(["lambda_zero_definition_wire_mismatch"]);
    let reads = 0;
    const hostile = new Proxy(
      {},
      {
        get() {
          reads += 1;
          throw new Error("trap");
        },
        ownKeys() {
          reads += 1;
          throw new Error("trap");
        },
      },
    );
    expect(
      nhm2SphericalBosonStarV2LambdaZeroProofDefinitionV1Violations(hostile),
    ).toEqual(["lambda_zero_definition_wire_required"]);
    expect(reads).toBe(0);
    expect(
      nhm2SphericalBosonStarV2LambdaZeroProofDefinitionV1Violations(
        "x".repeat(65_537),
      ),
    ).toEqual(["lambda_zero_definition_wire_code_unit_limit"]);
  });

  it("deep-freezes the definition and exposes no execution surface", () => {
    expect(Object.isFrozen(CONTRACT)).toBe(true);
    expect(Object.isFrozen(CONTRACT.firstTubeContainmentDefinition)).toBe(true);
    expect(Object.isFrozen(CONTRACT.instances)).toBe(true);
    const source = readFileSync(
      "shared/contracts/nhm2-spherical-boson-star-v2-lambda-zero-proof-definition.v1.ts",
      "utf8",
    );
    for (const forbidden of [
      "child_process",
      "node:fs",
      "WeakMap",
      ".set(",
      "proofExecutionAuthorized: true",
      "candidateAdmissionAuthorized: true",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
