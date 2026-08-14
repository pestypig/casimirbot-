import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import * as symbolModule from "../nhm2-conformally-flat-needle-connected-noise-two-particle-symbol.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_AUTHORITY_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTENT_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTENT_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_DISTRIBUTION_CONVENTION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_BINDING_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_BINDING_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_CONVENTION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_NUMERICAL_REPRESENTATION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_OBSERVABLES_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_OBSERVABLES_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_RESOLVED_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SCALAR_REFERENCE_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolJson,
  isNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolV1,
  nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations,
} from "../nhm2-conformally-flat-needle-connected-noise-two-particle-symbol.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-connected-noise-distribution-convention.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-connected-noise-numerical-representation.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-connected-noise-numerical-representation-mean-binding.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-fixed-background-observables.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-mean-rset-renormalization-convention.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE } from "../nhm2-conformally-flat-needle-scalar-reference.v1";

const clone = (): any =>
  structuredClone(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
  );

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const binding = (value: unknown) => {
  const bytes = Buffer.from(canonicalJson(value), "utf8");
  return {
    canonicalization: "utf8_lexicographic_object_keys_json_v1",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  };
};

const isDeepFrozen = (value: unknown, seen = new Set<object>()): boolean => {
  if (value == null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Reflect.ownKeys(value).every((key) =>
      isDeepFrozen((value as Record<PropertyKey, unknown>)[key], seen),
    )
  );
};

const defineHostileKey = (
  target: object,
  key: "__proto__" | "prototype" | "constructor",
): void => {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value: { executionAuthority: true },
    writable: true,
  });
};

const eta = [-1, 1, 1, 1] as const;

const lower = (vector: readonly number[]): number[] =>
  vector.map((value, index) => eta[index] * value);

const dot = (left: readonly number[], right: readonly number[]): number =>
  left.reduce(
    (sum, value, index) => sum + eta[index] * value * right[index],
    0,
  );

const sixPActual = (
  kUpper: readonly number[],
  lUpper: readonly number[],
): number[][] => {
  const k = lower(kUpper);
  const l = lower(lUpper);
  const totalUpper = kUpper.map((value, index) => value + lUpper[index]);
  const total = lower(totalUpper);
  const kDotL = dot(kUpper, lUpper);
  const totalSquared = dot(totalUpper, totalUpper);
  return Array.from({ length: 4 }, (_, a) =>
    Array.from({ length: 4 }, (_, b) => {
      const etaAb = a === b ? eta[a] : 0;
      return (
        -3 * (k[a] * l[b] + l[a] * k[b]) +
        3 * etaAb * kDotL +
        total[a] * total[b] -
        etaAb * totalSquared
      );
    }),
  );
};

const sixPOnShellEquivalent = (
  kUpper: readonly number[],
  lUpper: readonly number[],
): number[][] => {
  const k = lower(kUpper);
  const l = lower(lUpper);
  const kDotL = dot(kUpper, lUpper);
  return Array.from({ length: 4 }, (_, a) =>
    Array.from({ length: 4 }, (_, b) => {
      const etaAb = a === b ? eta[a] : 0;
      return (
        k[a] * k[b] +
        l[a] * l[b] -
        2 * (k[a] * l[b] + l[a] * k[b]) +
        etaAb * kDotL
      );
    }),
  );
};

const polynomialProjector = (
  KUpper: readonly number[],
  a: number,
  b: number,
  c: number,
  d: number,
): number => {
  const K = lower(KUpper);
  const s = -dot(KUpper, KUpper);
  const q = (i: number, j: number): number =>
    s * (i === j ? eta[i] : 0) + K[i] * K[j];
  return (q(a, c) * q(b, d) + q(a, d) * q(b, c)) / 2 - (q(a, b) * q(c, d)) / 3;
};

const projectorTimesS2 = (
  KUpper: readonly number[],
  a: number,
  b: number,
  c: number,
  d: number,
): number => {
  const K = lower(KUpper);
  const s = -dot(KUpper, KUpper);
  const h = (i: number, j: number): number =>
    (i === j ? eta[i] : 0) + (K[i] * K[j]) / s;
  return (
    s *
    s *
    ((h(a, c) * h(b, d) + h(a, d) * h(b, c)) / 2 - (h(a, b) * h(c, d)) / 3)
  );
};

describe("nhm2_conformally_flat_needle_connected_noise_two_particle_symbol/v1", () => {
  it("exports one deeply frozen blocked convention and no execution entry point", () => {
    expect(
      Object.keys(symbolModule).filter((name) =>
        /^(?:build|create|issue|execute|replay|receipt|certify|promote)/i.test(
          name,
        ),
      ),
    ).toEqual([]);
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
      ),
    ).toEqual([]);
    expect(
      isNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolV1(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
      ),
    ).toBe(true);
    expect(
      isDeepFrozen(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
      ),
    ).toBe(true);
  });

  it("independently rehashes and exact-binds all six upstream contracts", () => {
    const cases = [
      [
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SCALAR_REFERENCE_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
        undefined,
        undefined,
      ],
      [
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_OBSERVABLES_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_OBSERVABLES_EXPECTED_SIZE_BYTES,
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
      ],
      [
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_DISTRIBUTION_CONVENTION_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
      ],
      [
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_CONVENTION_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
      ],
      [
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_NUMERICAL_REPRESENTATION_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES,
      ],
      [
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_BINDING_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_BINDING_EXPECTED_SIZE_BYTES,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES,
      ],
    ] as const;
    for (const [
      value,
      expectedSha,
      expectedSize,
      reportedSha,
      reportedSize,
    ] of cases) {
      expect(binding(value)).toMatchObject({
        sha256: expectedSha,
        sizeBytes: expectedSize,
      });
      if (reportedSha != null) expect(reportedSha).toBe(expectedSha);
      if (reportedSize != null) expect(reportedSize).toBe(expectedSize);
    }
    expect(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL.content
          .upstreamBindings,
      ).every(
        (entry) =>
          entry.exactUpstreamBytesRequired &&
          entry.exactIdentityVerifiedAtModuleInitialization &&
          !entry.semanticSubstitutionAllowed,
      ),
    ).toBe(true);
  });

  it("pins canonical content and complete contract bytes independently", () => {
    const contract =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL;
    expect(contract.contentBinding).toEqual(binding(contract.content));
    expect(contract.contentBinding).toEqual({
      canonicalization: "utf8_lexicographic_object_keys_json_v1",
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTENT_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTENT_EXPECTED_SIZE_BYTES,
    });
    expect(
      createHash("sha256")
        .update(
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_EXPECTED_SHA256,
    );
    expect(
      Buffer.byteLength(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_EXPECTED_SIZE_BYTES,
    );
  });

  it("directly derives both exact stress-symbol forms and the rational microfixture", () => {
    const k = [1, 0, 0, 1] as const;
    const l = [1, 0, 0, -1] as const;
    const actual = sixPActual(k, l);
    const equivalent = sixPOnShellEquivalent(k, l);
    const expected = [
      [0, 0, 0, 0],
      [0, -2, 0, 0],
      [0, 0, -2, 0],
      [0, 0, 0, 4],
    ];

    expect(dot(k, k)).toBe(0);
    expect(dot(l, l)).toBe(0);
    expect(dot(k, l)).toBe(-2);
    expect(actual).toEqual(expected);
    expect(equivalent).toEqual(expected);
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL.content
        .exactRationalMicrofixture.sixTimesPCovariantMatrix,
    ).toEqual(expected);

    const traceSixP =
      -actual[0][0] + actual[1][1] + actual[2][2] + actual[3][3];
    expect(traceSixP).toBe(0);
    const totalUpper = [2, 0, 0, 0];
    for (let b = 0; b < 4; b += 1) {
      expect(
        totalUpper.reduce((sum, value, a) => sum + value * actual[a][b], 0),
      ).toBe(0);
    }
    for (let a = 0; a < 4; a += 1) {
      for (let b = 0; b < 4; b += 1) {
        expect(actual[a][b]).toBe(actual[b][a]);
      }
    }
    expect([actual[1][1] / 6, actual[2][2] / 6, actual[3][3] / 6]).toEqual([
      -1 / 3,
      -1 / 3,
      2 / 3,
    ]);
  });

  it("directly reduces the angular/LIPS coefficient and both density crosswalks", () => {
    const numerator = 2 * 1 * 1 * 2;
    const denominator = 1 * 8 * 16 * 15;
    expect(numerator).toBe(4);
    expect(denominator).toBe(1920);
    expect(numerator * 480).toBe(denominator);

    const spectral =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL.content
        .spectralConvention;
    expect(
      spectral.positiveFrequencyStandardLips.exactCoefficientDerivation,
    ).toMatchObject({
      standardMasslessTwoBodyPhaseSpace: "1/(8*pi)",
      phaseSpaceRationalPartAfterFactoringPiInverse: "1/8",
      identity: "2*(1/(8*pi))*(1/16)*(2/15)=1/(480*pi)",
      rationalCoefficientIdentity: "2*(1/8)*(1/16)*(2/15)=1/480",
      numeratorProduct: 4,
      denominatorProduct: 1920,
      reducedNumerator: 1,
      reducedDenominator: 480,
    });
    expect(16 * 480).toBe(7680);
    expect(spectral.bareDeltaEquivalent.exactRationalCrosscheck).toBe(
      "16/7680=1/480",
    );
    expect(2 * 480).toBe(960);
    expect(spectral.realSmearingAllCone.exactHalfDensityCrosscheck).toBe(
      "1/960=(1/2)*(1/480)",
    );
    expect(spectral.normalizationCrosswalk.projectToPhillipsHuFactor).toBe(4);
  });

  it("checks the boundary-safe polynomial against s squared times the spin-two projector", () => {
    for (const K of [
      [2, 0, 0, 0],
      [3, 1, 0, 0],
      [5, 1, 2, 1],
    ]) {
      expect(-dot(K, K)).toBeGreaterThan(0);
      for (let a = 0; a < 4; a += 1) {
        for (let b = 0; b < 4; b += 1) {
          for (let c = 0; c < 4; c += 1) {
            for (let d = 0; d < 4; d += 1) {
              expect(polynomialProjector(K, a, b, c, d)).toBeCloseTo(
                projectorTimesS2(K, a, b, c, d),
                12,
              );
            }
          }
        }
      }
    }
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL.content
        .spectralConvention.boundarySafePolynomial.containsDivisionByS,
    ).toBe(false);
  });

  it("freezes exact components, conformal cancellation, and SI restoration without a flat-normalization claim", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL.content;
    expect(content.tetradComponentConvention.componentOrder).toEqual([
      "T00",
      "T01",
      "T02",
      "T03",
      "T11",
      "T12",
      "T13",
      "T22",
      "T23",
      "T33",
    ]);
    expect(
      content.tetradComponentConvention.frobeniusSqrt2OffDiagonalWeightApplied,
    ).toBe(false);
    expect(content.twoParticleHilbertSpaceAndGramForm).toMatchObject({
      BoseSymmetryFactor: 2,
      normalizationConstant: "sqrt(2)",
      normalizationAndSymmetryFrozen: true,
    });
    expect(content.conformalTetradAndSmearingCancellation).toMatchObject({
      physicalSmearingPullback: "f_on_M=F^*barf_on_X",
      curvedObservable: "A_M[f]=integral_M_dmu_g*f^hatAhatB*t_hatAhatB[g]",
      exactCancellation: "A_M[F^*barf]=integral_R4_d4X*barf^AB(X)*t_AB[eta](X)",
      barfCurvedNormalizationPreserved: true,
      barfAssertedNormalizedAgainstFlatLebesgueMeasure: false,
    });
    expect(content.siRestoration.connectedCovarianceMultiplier).toBe(
      "(hbar*c)^2",
    );
  });

  it("resolves only six formula/convention blockers and preserves the remaining ten in order", () => {
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS,
    ).toEqual([
      "primary_source_artifact_bytes_not_verified",
      ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_RESOLVED_BLOCKERS,
      ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS.slice(
        1,
      ),
    ]);
    const accounting =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL.content
        .inheritedBlockerAccounting;
    expect(accounting).toMatchObject({
      meanBindingOverlayBlockerCount: 16,
      resolvedBlockerCount: 6,
      remainingBlockerCount: 10,
      resolvesAnyOtherMeanBindingOverlayBlocker: false,
      modifiesMeanBindingOverlayBytes: false,
      analyticConventionFreezeAuthorizesExecution: false,
    });
    expect(accounting.resolvedBlockers).toEqual(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_RESOLVED_BLOCKERS,
    );
    expect(accounting.remainingBlockers).toEqual(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS,
    );
  });

  it("keeps source bytes, execution, authority, lamps, ADM, certificate, and physical claims blocked", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL.content;
    expect(content.executionAdmissible).toBe(false);
    expect(content.provenanceBoundary).toMatchObject({
      everySourceArtifactByteBindingComplete: false,
      sourceAuditAloneAuthorizesExecution: false,
      projectDerivationsAreDirectPrimarySourceQuotations: false,
      executableIndependentProofStillRequired: true,
    });
    expect(
      content.provenanceBoundary.sourceFactRecords.every(
        (source) =>
          source.sourceArtifactSha256 === null &&
          source.sourceArtifactSizeBytes === null &&
          !source.sourceBytesVendored &&
          !source.sourceBytesVerified,
      ),
    ).toBe(true);
    expect(content.authority.status).toBe("blocked");
    expect(content.authority.blockers).toEqual(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS,
    );
    expect(Object.values(content.authority.locks)).toEqual(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_AUTHORITY_LOCKS,
      ),
    );
    expect(
      Object.values(content.authority.locks).every((value) => !value),
    ).toBe(true);
    expect(Object.values(content.claimLocks)).toEqual(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CLAIM_LOCKS,
      ),
    );
    expect(Object.values(content.claimLocks).every((value) => !value)).toBe(
      true,
    );
    expect(
      Object.values(content.implementationBoundary).every((value) => !value),
    ).toBe(true);
    expect(
      Object.values(content.unresolvedExecutionFreeze)
        .filter((value) => typeof value === "boolean")
        .every((value) => value === true || value === false),
    ).toBe(true);
    expect(content.unresolvedExecutionFreeze.nullFieldExecutionAllowed).toBe(
      false,
    );
  });

  it("canonicalizes safe plain data but rejects exact-schema additions, omissions, and stale bindings", () => {
    expect(
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolJson(
        clone(),
      ),
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CANONICAL_JSON,
    );
    expect(
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolJson({
        z: [2, 1],
        a: true,
      }),
    ).toBe('{"a":true,"z":[2,1]}');

    const extra = clone();
    extra.content.scopeBoundary.executionReceipt = {};
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(extra),
    ).toEqual(
      expect.arrayContaining([
        "extra_key:/content/scopeBoundary/executionReceipt",
        "content_binding_invalid",
      ]),
    );

    const missing = clone();
    delete missing.content.twoParticleStressSymbol
      .coefficientIsActualNotTwiceActual;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        missing,
      ),
    ).toEqual(
      expect.arrayContaining([
        "missing_key:/content/twoParticleStressSymbol/coefficientIsActualNotTwiceActual",
        "content_binding_invalid",
        "symbol_spectral_or_conformal_boundary_invalid",
      ]),
    );

    const stale = clone();
    stale.contentBinding.sha256 = "0".repeat(64);
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(stale),
    ).toContain("content_binding_invalid");
  });

  it("rejects root and nested proxies before invoking any proxy trap", () => {
    let trapCalls = 0;
    const rootProxy = new Proxy(clone(), {
      get: () => {
        trapCalls += 1;
        throw new Error("proxy_get_must_not_run");
      },
      getOwnPropertyDescriptor: () => {
        trapCalls += 1;
        throw new Error("proxy_getOwnPropertyDescriptor_must_not_run");
      },
      getPrototypeOf: () => {
        trapCalls += 1;
        throw new Error("proxy_getPrototypeOf_must_not_run");
      },
      ownKeys: () => {
        trapCalls += 1;
        throw new Error("proxy_ownKeys_must_not_run");
      },
    });
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        rootProxy,
      ),
    ).toEqual(["proxy_forbidden:/"]);
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolJson(
        rootProxy,
      ),
    ).toThrow("Cannot canonicalize unsafe plain data: proxy_forbidden:/");
    expect(trapCalls).toBe(0);

    const nested = clone();
    nested.content.spectralConvention = new Proxy(
      nested.content.spectralConvention,
      {
        ownKeys: () => {
          trapCalls += 1;
          throw new Error("nested_proxy_ownKeys_must_not_run");
        },
      },
    );
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        nested,
      ),
    ).toEqual(["proxy_forbidden:/content/spectralConvention"]);
    expect(trapCalls).toBe(0);
  });

  it("rejects accessors and hidden properties without invoking getters", () => {
    let getterCalls = 0;
    const accessor = clone();
    Object.defineProperty(accessor.content, "status", {
      configurable: true,
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return "blocked_exact_two_particle_symbol_and_spectral_convention_frozen";
      },
    });
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        accessor,
      ),
    ).toEqual(["accessor_or_hidden_property_forbidden:/content/status"]);
    expect(getterCalls).toBe(0);

    const arrayAccessor = clone();
    arrayAccessor.content.tetradComponentConvention.componentOrder = Array.from(
      arrayAccessor.content.tetradComponentConvention.componentOrder,
    );
    Object.defineProperty(
      arrayAccessor.content.tetradComponentConvention.componentOrder,
      "0",
      {
        configurable: true,
        enumerable: true,
        get: () => {
          getterCalls += 1;
          return "T00";
        },
      },
    );
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        arrayAccessor,
      ),
    ).toEqual([
      "accessor_sparse_or_hidden_array_entry:/content/tetradComponentConvention/componentOrder/0",
    ]);
    expect(getterCalls).toBe(0);

    const hidden = clone();
    Object.defineProperty(hidden.content, "hiddenAuthority", {
      configurable: true,
      enumerable: false,
      value: true,
    });
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        hidden,
      ),
    ).toEqual([
      "accessor_or_hidden_property_forbidden:/content/hiddenAuthority",
    ]);
  });

  it("rejects symbols, forbidden keys, array side keys, sparse arrays, and non-plain containers", () => {
    const symbol = clone();
    symbol.content[Symbol("execution-authority")] = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        symbol,
      ),
    ).toEqual(["symbol_key_forbidden:/content"]);

    for (const key of ["__proto__", "prototype", "constructor"] as const) {
      const forbiddenRoot = clone();
      defineHostileKey(forbiddenRoot, key);
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
          forbiddenRoot,
        ),
      ).toEqual([`forbidden_data_key:/${key}`]);

      const forbiddenNested = clone();
      defineHostileKey(forbiddenNested.content.twoParticleStressSymbol, key);
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
          forbiddenNested,
        ),
      ).toEqual([`forbidden_data_key:/content/twoParticleStressSymbol/${key}`]);
    }

    const sideKey = clone();
    sideKey.content.tetradComponentConvention.componentOrder = Array.from(
      sideKey.content.tetradComponentConvention.componentOrder,
    );
    Object.defineProperty(
      sideKey.content.tetradComponentConvention.componentOrder,
      "4294967295",
      {
        configurable: true,
        enumerable: true,
        value: "hidden",
        writable: true,
      },
    );
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        sideKey,
      ),
    ).toEqual([
      "array_keys_invalid:/content/tetradComponentConvention/componentOrder",
    ]);

    const sparse = clone();
    sparse.content.tetradComponentConvention.componentOrder = Array.from(
      sparse.content.tetradComponentConvention.componentOrder,
    );
    delete sparse.content.tetradComponentConvention.componentOrder[0];
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        sparse,
      ),
    ).toEqual([
      "array_keys_invalid:/content/tetradComponentConvention/componentOrder",
    ]);

    const inherited = Object.assign(
      Object.create({ authority: true }),
      clone(),
    );
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        inherited,
      ),
    ).toEqual(["non_plain_object:/"]);
  });

  it("rejects cycles, nonfinite numbers, and negative zero", () => {
    const cyclic = clone();
    cyclic.content.loop = cyclic.content;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        cyclic,
      ),
    ).toEqual(["cycle_forbidden:/content/loop"]);

    for (const [number, violation] of [
      [Number.NaN, "nonfinite_number:/content/exactRationalMicrofixture/s"],
      [
        Number.POSITIVE_INFINITY,
        "nonfinite_number:/content/exactRationalMicrofixture/s",
      ],
      [
        Number.NEGATIVE_INFINITY,
        "nonfinite_number:/content/exactRationalMicrofixture/s",
      ],
      [-0, "negative_zero:/content/exactRationalMicrofixture/s"],
    ] as const) {
      const invalid = clone();
      invalid.content.exactRationalMicrofixture.s = number;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
          invalid,
        ),
      ).toEqual([violation]);
    }
  });

  it("rejects hidden blocker removal and every authority, claim, or implementation unlock", () => {
    const blockerRemoval = clone();
    blockerRemoval.content.inheritedBlockerAccounting.remainingBlockers.pop();
    blockerRemoval.content.authority.blockers.pop();
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        blockerRemoval,
      ),
    ).toEqual(
      expect.arrayContaining([
        "blocker_accounting_invalid",
        "authority_must_remain_blocked",
      ]),
    );

    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_AUTHORITY_LOCKS,
    )) {
      const authority = clone();
      authority.content.authority.locks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
          authority,
        ),
        key,
      ).toContain("authority_must_remain_blocked");
    }

    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CLAIM_LOCKS,
    )) {
      const claim = clone();
      claim.content.claimLocks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
          claim,
        ),
        key,
      ).toContain("claim_locks_must_remain_false");
    }

    const implementation = clone();
    implementation.content.executionAdmissible = true;
    implementation.content.implementationBoundary.executorPresent = true;
    implementation.content.implementationBoundary.executionReceiptPresent = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(
        implementation,
      ),
    ).toEqual(
      expect.arrayContaining([
        "builder_issuer_executor_receipts_must_remain_absent",
        "authority_must_remain_blocked",
      ]),
    );
  });
});
