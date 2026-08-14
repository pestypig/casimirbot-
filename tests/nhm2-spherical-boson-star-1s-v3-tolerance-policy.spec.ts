import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
} from "../shared/contracts/nhm2-semiclassical-v3-replay-epoch.v1";
import { NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING } from "../shared/contracts/nhm2-semiclassical-v3-pair-numeric-agreement-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY as POLICY,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_VALIDATOR_LIMITS,
  isNhm2SphericalBosonStar1sV3TolerancePolicy,
  nhm2SphericalBosonStar1sV3TolerancePolicyViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-1s-v3-tolerance-policy.v1";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const everyObjectFrozen = (
  value: unknown,
  seen = new Set<object>(),
): boolean => {
  if (value == null || typeof value !== "object" || seen.has(value))
    return true;
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every((entry) =>
      everyObjectFrozen(entry, seen),
    )
  );
};

describe("NHM2 spherical 1s v3 tolerance policy v1", () => {
  it("pins the full candidate-specific bytes and current v3 contracts", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256_DOMAIN).toBe(
      "nhm2-spherical-boson-star-1s-v3-tolerance-policy/v1\n",
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256).toBe(
      "867d96458940149f386d7153dff06c95ae336af222f5f42d8903fb18a728448d",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_SIZE_BYTES,
    ).toBe(6302);
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256);
    expect(NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING).toEqual({
      artifactId: "nhm2.spherical_boson_star_1s_v3_tolerance_policy",
      contractVersion: "nhm2_spherical_boson_star_1s_v3_tolerance_policy/v1",
      policyId:
        "nhm2.server_owned.spherical_boson_star_1s.semiclassical_v3.tolerances/v1",
      candidateId:
        "nhm2.semiclassical_v3.spherical_boson_star_1s_weak_field_control/v1",
      sha256Domain: "nhm2-spherical-boson-star-1s-v3-tolerance-policy/v1\n",
      sha256:
        "867d96458940149f386d7153dff06c95ae336af222f5f42d8903fb18a728448d",
      canonicalSizeBytes: 6302,
      mediaType: "application/json",
    });

    expect(POLICY.exactV3Bindings.replayEpoch.sha256).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING.sha256,
    );
    expect(POLICY.exactV3Bindings.constraintArithmetic).toBe(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
    );
    expect(POLICY.exactV3Bindings.pairNumericAgreement.sha256).toBe(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING.sha256,
    );
    expect(POLICY.exactV3Bindings.literalSha256Pins).toBe(
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING_PINS,
    );
    expect(POLICY.exactV3Bindings.literalSha256Pins).toEqual({
      replayEpochPolicySha256:
        "72809f7bf15551886994ee80bf3f67d793d4024e2c64decd838f9c6d6795413f",
      constraintArithmeticPolicySha256:
        "ec6dc71043c35d20b74efe0053ae2b3665af6ec9ac9c2d5c36e2911b89defeb8",
      pairNumericAgreementPolicySha256:
        "872f17a82aead893b9371ded595c631ce8dc825152de2f545b0b2840f51d1cb8",
    });
  });

  it("copies the numeric thresholds into v3 without binding legacy v2", () => {
    expect(POLICY.candidateId).toBe(
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANDIDATE_ID,
    );
    expect(POLICY.provenance).toEqual({
      legacyV2PolicyImportedOrBound: false,
      numericValuesCopiedIntoThisNewCandidateSpecificV3Artifact: true,
      issuer: null,
      builder: null,
      execution: null,
      presealReceipt: null,
    });
    expect(POLICY.frozenThresholds).toEqual({
      selfConsistencyRelativeLInf: 1e-3,
      smearingWeightSumAbsolute: 1e-12,
      exchangeSymmetryUpper95SI: 1e-12,
      psdNegativeEigenvalueSI: 1e-12,
      meanNormalizationFloorSI: 1e-12,
      fluctuationToMeanRatioUpper95: 1,
      meanMetricDemandPointwiseRelativeUpper95: 0.1,
      metricDemandRelativeErrorBound: 0.01,
      bracketResidualUpper95: 0.1,
      antisymmetryResidualUpper95: 0.1,
      jacobiResidualUpper95: 0.1,
      regulatorResidualUpper95: 0.1,
      regulatorMonotonicityAbsolute: 1e-12,
      minimumRegulatorConvergenceOrder: 1,
      producerResidualConsistency: 1e-12,
      float64RecomputeAbsolute: 1e-12,
    });
    expect(POLICY.pairGroupTolerances).toMatchObject({
      noise_kernel: { absoluteTolerance: 1e-12, relativeTolerance: 1e-5 },
      mean_rset: { absoluteTolerance: 1e-12, relativeTolerance: 1e-6 },
      smearing_weights: {
        absoluteTolerance: 1e-12,
        relativeTolerance: 1e-10,
      },
      normalized_constraint_operand: {
        absoluteTolerance: 1e-12,
        relativeTolerance: 1e-6,
      },
    });
    expect(JSON.stringify(POLICY)).not.toContain("semiclassical_v2");
  });

  it("requires a future lower-bound receipt and grants no authority", () => {
    expect(POLICY.nondegeneracyPresealGate).toEqual({
      criterion:
        "all_64_metric_demand_symmetric_tensor_Frobenius_lower_bounds_strictly_exceed_the_frozen_floor_after_subtracting_the_registered_error_enclosure",
      minimumMetricDemandFrobeniusSI: 1e-12,
      requiredNondegenerateSampleFraction: 1,
      maximumRelativeErrorBound: 0.01,
      metricDemandLowerBoundReceiptRequired: true,
      metricDemandLowerBoundReceipt: null,
      established: false,
      mayBeAssertedFromCandidatePlausibilityOrSelection: false,
      scientificPresealAdmission: false,
    });
    expect(POLICY.versioning).toMatchObject({
      producerSelectedToleranceAllowed: false,
      postObservationRetuningAllowed: false,
      automaticLegacyUpgradeAllowed: false,
      failedFrozenLimitDisposition: "fail_candidate_without_retuning",
    });
    expect(POLICY.result).toBeNull();
    expect(
      Object.values(POLICY.authorityBoundary).every((value) => value === false),
    ).toBe(true);
    expect(POLICY.claimLocks).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
    );
    expect(Object.values(POLICY.claimLocks).every((value) => !value)).toBe(
      true,
    );
  });

  it("is recursively frozen and singleton-authoritative only as policy identity", () => {
    expect(everyObjectFrozen(POLICY)).toBe(true);
    expect(nhm2SphericalBosonStar1sV3TolerancePolicyViolations(POLICY)).toEqual(
      [],
    );
    expect(isNhm2SphericalBosonStar1sV3TolerancePolicy(POLICY)).toBe(true);
    expect(
      nhm2SphericalBosonStar1sV3TolerancePolicyViolations(clone(POLICY)),
    ).toEqual([
      "spherical_1s_v3_tolerance_policy_external_copy_not_authoritative",
    ]);

    const retuned = clone(POLICY) as any;
    retuned.frozenThresholds.bracketResidualUpper95 = 0.2;
    expect(
      nhm2SphericalBosonStar1sV3TolerancePolicyViolations(retuned),
    ).toEqual(["spherical_1s_v3_tolerance_policy_semantic_mismatch"]);
    const unlocked = clone(POLICY) as any;
    unlocked.authorityBoundary.diagnosticPass = true;
    expect(
      nhm2SphericalBosonStar1sV3TolerancePolicyViolations(unlocked),
    ).toEqual(["spherical_1s_v3_tolerance_policy_semantic_mismatch"]);
  });

  it("rejects hostile object surfaces without invoking accessors", () => {
    let getterCalls = 0;
    const accessor = clone(POLICY) as any;
    Object.defineProperty(accessor, "policyId", {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return POLICY.policyId;
      },
    });
    expect(
      nhm2SphericalBosonStar1sV3TolerancePolicyViolations(accessor)[0],
    ).toContain("object_property_surface");
    expect(getterCalls).toBe(0);

    const hidden = clone(POLICY) as any;
    Object.defineProperty(hidden, "side", { value: true, enumerable: false });
    expect(
      nhm2SphericalBosonStar1sV3TolerancePolicyViolations(hidden)[0],
    ).toContain("object_property_surface");

    const symbol = clone(POLICY) as any;
    symbol[Symbol("side")] = true;
    expect(
      nhm2SphericalBosonStar1sV3TolerancePolicyViolations(symbol)[0],
    ).toContain("symbol_key");

    const forbidden = clone(POLICY) as any;
    Object.defineProperty(forbidden, "constructor", {
      value: "side",
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStar1sV3TolerancePolicyViolations(forbidden)[0],
    ).toContain("forbidden_key");

    const sparse = clone(POLICY) as any;
    sparse.claimLockKeys = ["a", "b"];
    delete sparse.claimLockKeys[0];
    expect(
      nhm2SphericalBosonStar1sV3TolerancePolicyViolations(sparse)[0],
    ).toContain("array_surface");

    const cyclic = clone(POLICY) as any;
    cyclic.self = cyclic;
    expect(
      nhm2SphericalBosonStar1sV3TolerancePolicyViolations(cyclic)[0],
    ).toContain("cyclic_value");

    for (const invalid of [Number.NaN, Infinity, -Infinity, -0]) {
      const numeric = clone(POLICY) as any;
      numeric.frozenThresholds.bracketResidualUpper95 = invalid;
      expect(
        nhm2SphericalBosonStar1sV3TolerancePolicyViolations(numeric)[0],
      ).toContain("invalid_number");
    }

    const throwingProxy = new Proxy(clone(POLICY), {
      getPrototypeOf: () => {
        throw new Error("hostile");
      },
    });
    expect(
      nhm2SphericalBosonStar1sV3TolerancePolicyViolations(throwingProxy),
    ).toEqual(["spherical_1s_v3_tolerance_policy_plain_data_snapshot_invalid"]);
    const revoked = Proxy.revocable(clone(POLICY), {});
    revoked.revoke();
    expect(
      nhm2SphericalBosonStar1sV3TolerancePolicyViolations(revoked.proxy),
    ).toEqual(["spherical_1s_v3_tolerance_policy_plain_data_snapshot_invalid"]);
  });

  it("bounds snapshot work", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_VALIDATOR_LIMITS,
    ).toEqual({
      maximumDepth: 24,
      maximumNodes: 4096,
      maximumArrayLength: 256,
      maximumObjectPropertyCount: 128,
      maximumStringUtf8Bytes: 4096,
    });
    const long = clone(POLICY) as any;
    long.authority = "x".repeat(4097);
    expect(nhm2SphericalBosonStar1sV3TolerancePolicyViolations(long)).toEqual([
      "string_byte_length_limit:/authority",
    ]);
    const wide = clone(POLICY) as any;
    wide.side = Object.fromEntries(
      Array.from({ length: 129 }, (_, index) => [`k${index}`, index]),
    );
    expect(nhm2SphericalBosonStar1sV3TolerancePolicyViolations(wide)).toEqual([
      "object_property_count_limit:/side",
    ]);
  });
});
