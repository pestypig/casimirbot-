import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-connected-noise-numerical-representation-mean-binding.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ADDED_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_AUTHORITY_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTENT_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTENT_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_INHERITED_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_MEAN_BINDING_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_MEAN_BINDING_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_OBSERVABLES_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_OBSERVABLES_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SCALAR_REFERENCE_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SYMBOL_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SYMBOL_EXPECTED_SIZE_BYTES,
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierJson,
  nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations,
} from "../nhm2-conformally-flat-needle-connected-noise-smearing-fourier.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-connected-noise-two-particle-symbol.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-fixed-background-observables.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE } from "../nhm2-conformally-flat-needle-scalar-reference.v1";

const clone = (): any =>
  structuredClone(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER,
  );

const binding = (value: unknown) => {
  const bytes = Buffer.from(
    canonicalNhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierJson(value),
    "utf8",
  );
  return {
    canonicalization: "utf8_lexicographic_object_keys_json_v1",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  };
};

const defineHostileKey = (
  target: object,
  key: "__proto__" | "prototype" | "constructor",
  getter?: () => unknown,
): void => {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    ...(getter == null ? { value: true, writable: true } : { get: getter }),
  });
};

const integerMicrometers = (meters: readonly string[]): number[] =>
  meters.map((value) => Math.round(Number(value) * 1_000_000));

const exactDisplacements = (centersMicrometers: readonly number[]): number[] =>
  [
    ...new Set(
      centersMicrometers.flatMap((left) =>
        centersMicrometers.map((right) => left - right),
      ),
    ),
  ].sort((left, right) => left - right);

describe.sequential(
  "NHM2 conformally-flat needle connected-noise smearing Fourier contract",
  () => {
    it("exact-binds the symbol, mean binding, scalar reference, and observables", () => {
      expect(
        binding(
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
        ),
      ).toMatchObject({
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SYMBOL_EXPECTED_SHA256,
        sizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SYMBOL_EXPECTED_SIZE_BYTES,
      });
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SYMBOL_EXPECTED_SHA256,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SYMBOL_EXPECTED_SIZE_BYTES,
      );
      expect(
        binding(
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
        ),
      ).toMatchObject({
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_MEAN_BINDING_EXPECTED_SHA256,
        sizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_MEAN_BINDING_EXPECTED_SIZE_BYTES,
      });
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_MEAN_BINDING_EXPECTED_SHA256,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_MEAN_BINDING_EXPECTED_SIZE_BYTES,
      );
      expect(
        binding(NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE),
      ).toMatchObject({
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SCALAR_REFERENCE_EXPECTED_SHA256,
        sizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
      });
      expect(
        binding(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES),
      ).toMatchObject({
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_OBSERVABLES_EXPECTED_SHA256,
        sizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_OBSERVABLES_EXPECTED_SIZE_BYTES,
      });
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_OBSERVABLES_EXPECTED_SHA256,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_OBSERVABLES_EXPECTED_SIZE_BYTES,
      );
      expect(
        Object.values(
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content
            .upstreamBindings,
        ).every(
          (entry) =>
            entry.exactUpstreamBytesRequired &&
            entry.exactIdentityVerifiedAtModuleInitialization &&
            !entry.semanticSubstitutionAllowed,
        ),
      ).toBe(true);
    });

    it("pins content and full canonical bytes independently and deeply freezes the artifact", () => {
      const contract =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER;
      expect(contract.contentBinding).toEqual(binding(contract.content));
      expect(contract.contentBinding).toEqual({
        canonicalization: "utf8_lexicographic_object_keys_json_v1",
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTENT_EXPECTED_SHA256,
        sizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTENT_EXPECTED_SIZE_BYTES,
      });
      expect(
        createHash("sha256")
          .update(
            NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CANONICAL_JSON,
            "utf8",
          )
          .digest("hex"),
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SHA256,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SHA256,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_EXPECTED_SHA256,
      );
      expect(
        Buffer.byteLength(
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CANONICAL_JSON,
          "utf8",
        ),
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SIZE_BYTES,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SIZE_BYTES,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_EXPECTED_SIZE_BYTES,
      );
      expect(Object.isFrozen(contract)).toBe(true);
      expect(Object.isFrozen(contract.content)).toBe(true);
      expect(
        Object.isFrozen(
          contract.content.sampleAndDisplacementMapping.xDisplacementsM,
        ),
      ).toBe(true);
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          contract,
        ),
      ).toEqual([]);
    });

    it("freezes the exact bump, rational half-width product, Q convention, and product transform", () => {
      const content =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content;
      expect(content.oneDimensionalBump).toMatchObject({
        positiveOnInterior: true,
        realValued: true,
        even: true,
        endpointValues: { minusOne: 0, plusOne: 0 },
        numericalEvaluatorPresent: false,
      });
      const upstreamHalfWidths =
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.smearing
          .halfWidthsM;
      expect(content.halfWidthsAndVolume.halfWidthsM).toEqual([
        upstreamHalfWidths.cTau,
        upstreamHalfWidths.dx,
        upstreamHalfWidths.dy,
        upstreamHalfWidths.dz,
      ]);
      const fractions = content.halfWidthsAndVolume.exactRationalMeters.map(
        (fraction) => fraction.split("/").map(BigInt),
      );
      const numerator = fractions.reduce(
        (value, entry) => value * entry[0],
        1n,
      );
      const denominator = fractions.reduce(
        (value, entry) => value * entry[1],
        1n,
      );
      expect(`${numerator}/${denominator}`).toBe(
        content.halfWidthsAndVolume.exactProductRationalM4,
      );
      expect(Number(numerator) / Number(denominator)).toBe(
        content.halfWidthsAndVolume.productM4,
      );
      expect(content.oneDimensionalFourierTransform).toMatchObject({
        definition: "Q(z)=integral_-1^1_du*q(u)*exp(-i*z*u)",
        realEvenReduction: "Q(z)=2*integral_0^1_du*q(u)*cos(z*u)",
        realValuedForRealZ: true,
        evenForRealZ: true,
        noTwoPiFactorInForwardTransform: true,
        numericalQ0: null,
        numericalQ0Enclosure: null,
      });
      expect(content.productSmearingFourierTransform).toMatchObject({
        exactTransform:
          "bar_f_hat_p(K)=C_p*V*exp(-i*K_dot_X_p)*Q(a0*K0)*Q(ax*Kx)*Q(ay*Ky)*Q(az*Kz)",
        dotProduct: "K_dot_X=-K0*X0+Kx*X+Ky*Y+Kz*Z",
        transformFactorizesExactly: true,
        omegaCenterFactoringUsed: false,
        evaluatorPresent: false,
      });
    });

    it("keeps curved normalization distinct from flat normalization and freezes the exact zero-mode interval", () => {
      const content =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content;
      expect(content.curvedNormalization).toMatchObject({
        exactSBounds: ["Q0^3", "(1+1e-6)^4*Q0^3"],
        normalizedAgainstCurvedVolume: true,
        normalizedAgainstFlatLebesgueMeasure: false,
        omegaInsertedInsideFlatFourierTransform: false,
        numericalSampleNormalizationValues: null,
        numericalSampleNormalizationEnclosures: null,
      });
      expect(content.zeroModeBoundary).toEqual({
        identity: "bar_f_hat_p(0)=Q0^3/S_p",
        exactInclusiveBounds: ["(1+1e-6)^-4", "1"],
        exactLowerEquivalentRationalPower: "(1000000/1000001)^4",
        followsFromCurvedNormalization: true,
        assertedEqualToOne: false,
        flatLebesgueNormalizationClaimAllowed: false,
        numericalZeroModes: null,
        numericalZeroModeEnclosures: null,
      });
      const lower = (1_000_000 / 1_000_001) ** 4;
      expect(lower).toBeGreaterThan(0);
      expect(lower).toBeLessThan(1);
      for (const q0 of [0.25, 0.75, 1.5]) {
        const minimumS = q0 ** 3;
        const maximumS = (1 + 1e-6) ** 4 * q0 ** 3;
        expect(q0 ** 3 / minimumS).toBe(1);
        expect(q0 ** 3 / maximumS).toBeCloseTo(lower, 15);
      }
    });

    it("directly derives every frozen displacement and the 729-triple mapping", () => {
      const mapping =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content
          .sampleAndDisplacementMapping;
      const upstreamPoints =
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.samplePoints;
      expect([
        ...new Set(
          upstreamPoints.map((point) => point.inertialConformalCoordinatesM.X),
        ),
      ]).toEqual(mapping.xCenterCoordinatesM);
      expect([
        ...new Set(
          upstreamPoints.map((point) => point.inertialConformalCoordinatesM.Y),
        ),
      ]).toEqual(mapping.yzCenterCoordinatesM);
      expect([
        ...new Set(
          upstreamPoints.map((point) => point.inertialConformalCoordinatesM.Z),
        ),
      ]).toEqual(mapping.yzCenterCoordinatesM);
      const xCenters = integerMicrometers(mapping.xCenterCoordinatesM);
      const yzCenters = integerMicrometers(mapping.yzCenterCoordinatesM);
      expect(exactDisplacements(xCenters)).toEqual(
        integerMicrometers(mapping.xDisplacementsM),
      );
      expect(exactDisplacements(yzCenters)).toEqual(
        integerMicrometers(mapping.yAndZDisplacementsM),
      );
      expect(mapping.xDisplacementsM).toHaveLength(9);
      expect(mapping.yAndZDisplacementsM).toHaveLength(9);
      expect(9 ** 3).toBe(mapping.uniqueSpatialDisplacementTripleCount);
      expect(upstreamPoints.map((entry) => entry.ordinal)).toEqual(
        Array.from({ length: 64 }, (_, index) => index),
      );
      expect(mapping.sampleOrdinalFormula).toBe("p=16*i_z+4*i_y+i_x");
      expect(mapping.mappingAuthorizesNumericalReduction).toBe(false);
    });

    it("retains N=12 as an uncertified plan and leaves every numerical or execution field null", () => {
      const content =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content;
      expect(content.plannedDecayBoundary).toEqual({
        plannedIntegrationByPartsDerivativeOrder: 12,
        derivativeOrderIsPlannedNotCertified: true,
        derivativeOrderAuthority: false,
        exactDerivativeFormula: null,
        certifiedDerivativeL1NormD12: null,
        certifiedDerivativeL1NormEnclosure: null,
        integrationByPartsBoundaryProofArtifact: null,
        fourierDecayCertificate: null,
        plannedOrderResolvesCertifiedDerivativeBlocker: false,
      });
      expect(
        Object.entries(content.unresolvedNumericalAndExecutionFreeze).every(
          ([key, value]) =>
            key === "allFieldsRequiredBeforeExecution"
              ? value === true
              : key === "nullFieldExecutionAllowed"
                ? value === false
                : value === null,
        ),
      ).toBe(true);
    });

    it("preserves inherited blockers, appends normalization blockers, and keeps every lock false", () => {
      const content =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content;
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_INHERITED_BLOCKERS,
      ).toEqual(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ADDED_BLOCKERS,
      ).toEqual([
        "certified_q0_enclosure_not_frozen",
        "certified_sample_normalization_enclosures_and_receipt_not_frozen",
      ]);
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS,
      ).toEqual([
        ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS,
        ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ADDED_BLOCKERS,
      ]);
      expect(content.blockerAccounting).toEqual({
        inheritedBlockerCount: 10,
        inheritedBlockers:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_INHERITED_BLOCKERS,
        addedBlockerCount: 2,
        addedBlockers:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ADDED_BLOCKERS,
        totalBlockerCount: 12,
        totalBlockers:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS,
        inheritedBlockerOrderPreservedExactly: true,
        addedBlockerOrderFrozen: true,
        resolvesAnyInheritedBlocker: false,
        analyticFreezeAuthorizesNumericalNormalization: false,
      });
      expect(content.authority).toMatchObject({
        status: "blocked",
        firstBlocker: "primary_source_artifact_bytes_not_verified",
        blockers:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS,
      });
      expect(Object.values(content.authority.locks)).toEqual(
        Object.values(
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_AUTHORITY_LOCKS,
        ),
      );
      expect(
        Object.values(content.authority.locks).every((entry) => !entry),
      ).toBe(true);
      expect(Object.values(content.claimLocks)).toEqual(
        Object.values(
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CLAIM_LOCKS,
        ),
      );
      expect(Object.values(content.claimLocks).every((entry) => !entry)).toBe(
        true,
      );
      expect(
        Object.values(content.implementationBoundary).every((entry) => !entry),
      ).toBe(true);
      expect(content.executionAdmissible).toBe(false);

      const badAccounting = clone();
      badAccounting.content.blockerAccounting.totalBlockerCount = 11;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          badAccounting,
        ),
      ).toContain("smearing_fourier_blocker_accounting_invalid");
    });

    it("canonicalizes safe plain data and rejects exact-schema additions, omissions, and stale bindings", () => {
      expect(
        canonicalNhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierJson(
          clone(),
        ),
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CANONICAL_JSON,
      );
      expect(
        canonicalNhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierJson({
          z: [2, 1],
          a: true,
        }),
      ).toBe('{"a":true,"z":[2,1]}');

      const extra = clone();
      extra.content.scopeBoundary.executionReceipt = {};
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(extra),
      ).toEqual(
        expect.arrayContaining([
          "extra_key:/content/scopeBoundary/executionReceipt",
          "content_binding_invalid",
        ]),
      );

      const missing = clone();
      delete missing.content.zeroModeBoundary.assertedEqualToOne;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          missing,
        ),
      ).toEqual(
        expect.arrayContaining([
          "missing_key:/content/zeroModeBoundary/assertedEqualToOne",
          "content_binding_invalid",
        ]),
      );

      const stale = clone();
      stale.contentBinding.sha256 = "0".repeat(64);
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(stale),
      ).toContain("content_binding_invalid");
    });

    it("rejects root and nested proxies before invoking a proxy trap", () => {
      let trapCalls = 0;
      const rootProxy = new Proxy(clone(), {
        get: () => {
          trapCalls += 1;
          throw new Error("proxy_get_must_not_run");
        },
        getOwnPropertyDescriptor: () => {
          trapCalls += 1;
          throw new Error("proxy_descriptor_must_not_run");
        },
        getPrototypeOf: () => {
          trapCalls += 1;
          throw new Error("proxy_prototype_must_not_run");
        },
        ownKeys: () => {
          trapCalls += 1;
          throw new Error("proxy_keys_must_not_run");
        },
      });
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          rootProxy,
        ),
      ).toEqual(["proxy_forbidden:/"]);
      expect(() =>
        canonicalNhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierJson(
          rootProxy,
        ),
      ).toThrow("Cannot canonicalize unsafe plain data: proxy_forbidden:/");
      expect(trapCalls).toBe(0);

      const nested = clone();
      nested.content.curvedNormalization = new Proxy(
        nested.content.curvedNormalization,
        {
          ownKeys: () => {
            trapCalls += 1;
            throw new Error("nested_proxy_keys_must_not_run");
          },
        },
      );
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          nested,
        ),
      ).toEqual(["proxy_forbidden:/content/curvedNormalization"]);
      expect(trapCalls).toBe(0);
    });

    it("rejects accessors, hidden properties, and forbidden accessor keys without reading them", () => {
      let getterCalls = 0;
      const accessor = clone();
      Object.defineProperty(accessor.content, "status", {
        configurable: true,
        enumerable: true,
        get: () => {
          getterCalls += 1;
          return "blocked_analytic_smearing_fourier_identities_frozen";
        },
      });
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          accessor,
        ),
      ).toEqual(["accessor_or_hidden_property_forbidden:/content/status"]);
      expect(getterCalls).toBe(0);

      const hidden = clone();
      Object.defineProperty(hidden.content, "hiddenAuthority", {
        configurable: true,
        enumerable: false,
        value: true,
      });
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          hidden,
        ),
      ).toEqual([
        "accessor_or_hidden_property_forbidden:/content/hiddenAuthority",
      ]);

      for (const key of ["__proto__", "prototype", "constructor"] as const) {
        const root = clone();
        defineHostileKey(root, key, () => {
          getterCalls += 1;
          return true;
        });
        expect(
          nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
            root,
          ),
        ).toEqual([`forbidden_data_key:/${key}`]);

        const nested = clone();
        defineHostileKey(
          nested.content.productSmearingFourierTransform,
          key,
          () => {
            getterCalls += 1;
            return true;
          },
        );
        expect(
          nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
            nested,
          ),
        ).toEqual([
          `forbidden_data_key:/content/productSmearingFourierTransform/${key}`,
        ]);
      }
      expect(getterCalls).toBe(0);
    });

    it("rejects symbols, array side keys, sparse arrays, and non-plain containers", () => {
      const symbolic = clone();
      symbolic.content[Symbol("execution-authority")] = true;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          symbolic,
        ),
      ).toEqual(["symbol_key_forbidden:/content"]);

      const sideKey = clone();
      sideKey.content.halfWidthsAndVolume.halfWidthsM = Array.from(
        sideKey.content.halfWidthsAndVolume.halfWidthsM,
      );
      Object.defineProperty(
        sideKey.content.halfWidthsAndVolume.halfWidthsM,
        "4294967295",
        {
          configurable: true,
          enumerable: true,
          value: 1,
          writable: true,
        },
      );
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          sideKey,
        ),
      ).toEqual([
        "array_keys_invalid:/content/halfWidthsAndVolume/halfWidthsM",
      ]);

      const sparse = clone();
      sparse.content.halfWidthsAndVolume.halfWidthsM = Array.from(
        sparse.content.halfWidthsAndVolume.halfWidthsM,
      );
      delete sparse.content.halfWidthsAndVolume.halfWidthsM[0];
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          sparse,
        ),
      ).toEqual([
        "array_keys_invalid:/content/halfWidthsAndVolume/halfWidthsM",
      ]);

      const inherited = Object.assign(
        Object.create({ authority: true }),
        clone(),
      );
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          inherited,
        ),
      ).toEqual(["non_plain_object:/"]);
    });

    it("rejects cycles, nonfinite numbers, negative zero, and every authority unlock", () => {
      const cyclic = clone();
      cyclic.content.loop = cyclic.content;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          cyclic,
        ),
      ).toEqual(["cycle_forbidden:/content/loop"]);

      for (const [number, violation] of [
        [Number.NaN, "nonfinite_number:/content/halfWidthsAndVolume/productM4"],
        [
          Number.POSITIVE_INFINITY,
          "nonfinite_number:/content/halfWidthsAndVolume/productM4",
        ],
        [
          Number.NEGATIVE_INFINITY,
          "nonfinite_number:/content/halfWidthsAndVolume/productM4",
        ],
        [-0, "negative_zero:/content/halfWidthsAndVolume/productM4"],
      ] as const) {
        const invalid = clone();
        invalid.content.halfWidthsAndVolume.productM4 = number;
        expect(
          nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
            invalid,
          ),
        ).toEqual([violation]);
      }

      for (const key of Object.keys(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_AUTHORITY_LOCKS,
      )) {
        const authority = clone();
        authority.content.authority.locks[key] = true;
        expect(
          nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
            authority,
          ),
          key,
        ).toContain("authority_must_remain_blocked");
      }

      for (const key of Object.keys(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CLAIM_LOCKS,
      )) {
        const claim = clone();
        claim.content.claimLocks[key] = true;
        expect(
          nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
            claim,
          ),
          key,
        ).toContain("claim_locks_must_remain_false");
      }

      const implementation = clone();
      implementation.content.executionAdmissible = true;
      implementation.content.implementationBoundary.evaluatorPresent = true;
      implementation.content.implementationBoundary.outputWriterPresent = true;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(
          implementation,
        ),
      ).toEqual(
        expect.arrayContaining([
          "builder_evaluator_executor_outputs_must_remain_absent",
          "execution_must_remain_blocked",
        ]),
      );
    });
  },
);
