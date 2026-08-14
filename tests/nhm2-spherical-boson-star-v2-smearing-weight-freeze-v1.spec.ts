import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_VALUE,
  isNhm2SphericalBosonStarV2SmearingWeightFreezeV1,
  nhm2SphericalBosonStarV2SmearingWeightFreezeViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-smearing-weight-freeze.v1";

const contract = NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE;

describe("NHM2 spherical boson-star v2 smearing-weight freeze", () => {
  it("literal-seals the additive policy", () => {
    const digest = createHash("sha256")
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_SHA256_DOMAIN,
        "utf8",
      )
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CANONICAL_JSON,
        "utf8",
      )
      .digest("hex");
    expect(digest).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_SHA256,
    );
    expect(digest).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
    ).toMatchObject({ sha256: digest });
  });

  it("freezes exactly 64 equal binary64 weights", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_COUNT).toBe(64);
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_VALUE).toBe(2 ** -6);
    expect(contract.exactDiscreteMeasure.values).toHaveLength(64);
    expect(
      contract.exactDiscreteMeasure.values.every((value) => value === 0.015625),
    ).toBe(true);
    expect(contract.exactDiscreteMeasure.exactMathematicalSum).toBe(
      "64*(1/64)=1",
    );
    expect(contract.exactDiscreteMeasure.weightBinary64HexBigEndian).toBe(
      "3f90000000000000",
    );
    expect(contract.exactDiscreteMeasure.weightF64LeWordHex).toBe(
      "000000000000903f",
    );
    expect(contract.exactDiscreteMeasure.radiusSquaredOrbits).toEqual([
      { radiusSquared: "3/64", sampleCount: 8 },
      { radiusSquared: "11/64", sampleCount: 24 },
      { radiusSquared: "19/64", sampleCount: 24 },
      { radiusSquared: "27/64", sampleCount: 8 },
    ]);
    expect(
      contract.exactDiscreteMeasure
        .signedPermutationSymmetryAloneForcesEqualWeightsAcrossRadiusOrbits,
    ).toBe(false);
    expect(
      contract.exactDiscreteMeasure
        .equalWeightAcrossRadiusOrbitsIsAnExplicitFrozenChoice,
    ).toBe(true);
  });

  it("binds the exact 512 raw bytes and schema descriptor", () => {
    const raw = Buffer.alloc(
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES,
    );
    for (let index = 0; index < 64; index += 1)
      raw.writeDoubleLE(1 / 64, index * 8);
    expect(raw.byteLength).toBe(512);
    expect(createHash("sha256").update(raw).digest("hex")).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
    );
    expect(contract.physicalFileBinding).toMatchObject({
      fileOrdinal: 4,
      role: "smearing_weights",
      path: "{outputDirectory}/fixed/04-smearing_weights.f64le",
      shape: [64],
      sizeBytes: 512,
      exactRawSha256:
        "25493ecc62734a68fad443881a595d122cb7a93ddf9d07e5ec2060baf84f03fd",
    });
  });

  it("separates replay aggregation from normalized spacetime bumps", () => {
    expect(contract.semanticDistinction).toEqual({
      perProbeSpacetimeBump:
        "each_of_the_64_C_infinity_product_bumps_is_individually_normalized_against_sqrt_minus_g_d4x",
      replayAggregationWeights:
        "a_separate_discrete_measure_over_the_64_preregistered_probe_labels",
      bumpQuadratureWeightsMayReplaceReplayAggregationWeights: false,
      replayAggregationWeightsMayRetuneTheBumpNormalization: false,
    });
  });

  it("requires exact bits before the defense-in-depth sum check", () => {
    expect(contract.replayDuty).toMatchObject({
      exactFileSha256CheckBeforeFloatDecode: true,
      exactDecodedLength: 64,
      everyDecodedElementMustHaveBinary64Bits: "3f90000000000000",
      nonnegativeAndSumToleranceChecksRemainDefenseInDepth: true,
      exactBitsFailurePrecedesSmearingNormalizationFailure: true,
      primaryAndIndependentMustPerformTheExactBitsCheck: true,
    });
  });

  it("records all still-missing integration rather than promoting authority", () => {
    expect(contract.integrationBoundary).toMatchObject({
      currentRawSchemaAlreadyHasCompatibleOrdinalPathShapeAndEncoding: true,
      currentRawSchemaDoesNotEnforceThisExactContentHash: true,
      rawSchemaExactContentIntegrationComplete: false,
      currentServerRawAdmissionChecksExactHashBeforeFloatDecode: true,
      currentPrimaryReplayEnforcesExactHashThenDecodedBitsThenNormalization: true,
      currentIndependentReplayEnforcesExactHashThenDecodedBitsThenNormalization: true,
      currentPrimaryAndIndependentDecodedBitChecksPresent: true,
      currentPrimaryNormalizedThirtyOutcomeProjectionPresent: true,
      currentIndependentNormalizedThirtyOutcomeProjectionPresent: true,
      currentPairAgreementBindsBothLaneHashesToThisExactValue: true,
      currentPairAgreementBindsBothThirtyOutcomeProjections: true,
      replayAndPairExactContentIntegrationComplete: true,
      integrationComplete: false,
    });
    expect(contract.blockers).toEqual([
      "raw_schema_exact_smearing_weight_content_binding_not_integrated",
      "candidate_manifest_and_scientific_preseal_absent",
      "execution_and_output_bytes_absent",
    ]);
    expect(
      Object.values(contract.authorityLocks).every((value) => !value),
    ).toBe(true);
  });

  it("rejects every external copy or hostile graph without traversal", () => {
    let traps = 0;
    const hostile = new Proxy(
      {},
      {
        get() {
          traps += 1;
          throw new Error("not called");
        },
        ownKeys() {
          traps += 1;
          throw new Error("not called");
        },
      },
    );
    expect(isNhm2SphericalBosonStarV2SmearingWeightFreezeV1(contract)).toBe(
      true,
    );
    expect(
      nhm2SphericalBosonStarV2SmearingWeightFreezeViolations(contract),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2SmearingWeightFreezeViolations(hostile),
    ).toEqual(["spherical_v2_smearing_weight_freeze_identity_required"]);
    expect(traps).toBe(0);
    expect(
      nhm2SphericalBosonStarV2SmearingWeightFreezeViolations({ ...contract }),
    ).toEqual(["spherical_v2_smearing_weight_freeze_identity_required"]);
  });

  it("is deeply immutable and cannot unlock claims", () => {
    expect(Object.isFrozen(contract)).toBe(true);
    expect(Object.isFrozen(contract.exactDiscreteMeasure.values)).toBe(true);
    expect(Object.isFrozen(contract.authorityLocks)).toBe(true);
    expect(() =>
      Reflect.set(contract.authorityLocks, "diagnosticPass", true),
    ).not.toThrow();
    expect(contract.authorityLocks.diagnosticPass).toBe(false);
    expect(contract.authorityLocks.physicalViability).toBe(false);
    expect(contract.authorityLocks.propulsion).toBe(false);
    expect(contract.authorityLocks.transport).toBe(false);
  });
});
