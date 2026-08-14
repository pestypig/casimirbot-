import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_BLOCK_DIAGNOSTIC_SCHEMA_VERSION } from "../../../server/services/theory/nhm2-conformally-flat-needle-connected-noise-spectral-block-diagnostic";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_WORKER_DESCRIPTOR,
} from "../../../server/services/theory/nhm2-conformally-flat-needle-connected-noise-spectral-moment-map";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_ADDED_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_AUTHORITY_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CONTENT_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CONTENT_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_INHERITED_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SMEARING_FOURIER_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SMEARING_FOURIER_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_EXPECTED_SCHEMA_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_SOURCE_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_SOURCE_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SYMBOL_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SYMBOL_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CONTENT_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CONTENT_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SIZE_BYTES,
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyJson,
  nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations,
} from "../nhm2-conformally-flat-needle-connected-noise-diagnostic-cubature-policy.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-connected-noise-smearing-fourier.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-connected-noise-two-particle-symbol.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE } from "../nhm2-conformally-flat-needle-scalar-reference.v1";

const clone = (): any =>
  structuredClone(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY,
  );

const canonicalBinding = (value: unknown) => {
  const bytes = Buffer.from(
    canonicalNhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyJson(
      value,
    ),
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
  getter: () => unknown,
): void => {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get: getter,
  });
};

const signedDisplacements = (coordinates: readonly string[]): number[] => {
  const integerMicrometers = coordinates.map((value) =>
    Math.round(Number(value) * 1_000_000),
  );
  return [
    ...new Set(
      integerMicrometers.flatMap((left) =>
        integerMicrometers.map((right) => left - right),
      ),
    ),
  ].sort((left, right) => left - right);
};

const sobolDirections = (
  degree: number,
  coefficient: number,
  initialOddM: readonly number[],
  count: number,
): number[] => {
  if (degree === 0) {
    return Array.from(
      { length: count },
      (_, index) => (2 ** (31 - index)) >>> 0,
    );
  }
  const directions = Array.from({ length: count }, () => 0);
  for (let index = 0; index < degree; index += 1) {
    directions[index] = (initialOddM[index] * 2 ** (31 - index)) >>> 0;
  }
  for (let j = degree + 1; j <= count; j += 1) {
    let value =
      directions[j - degree - 1] ^ (directions[j - degree - 1] >>> degree);
    for (let k = 1; k < degree; k += 1) {
      const coefficientBit = (coefficient >>> (degree - 1 - k)) & 1;
      if (coefficientBit === 1) value ^= directions[j - k - 1];
    }
    directions[j - 1] = value >>> 0;
  }
  return directions;
};

const sobolPoints = (count: number): number[][] => {
  const parameters =
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY
      .content.reductions;
  expect(parameters.exactMomentCount).toBe(22);
  const directionParameters =
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY
      .content.sobolPolicy.directionNumberParameters;
  const directions = directionParameters.map((entry) =>
    sobolDirections(entry.degreeS, entry.coefficientA, entry.initialOddM, 18),
  );
  return Array.from({ length: count }, (_, index) => {
    const gray = index ^ (index >>> 1);
    return directions.map((dimensionDirections) => {
      let word = 0;
      for (let bit = 0; bit < 18; bit += 1) {
        if (((gray >>> bit) & 1) === 1) word ^= dimensionDirections[bit];
      }
      return (word >>> 0) / 2 ** 32;
    });
  });
};

describe.sequential(
  "NHM2 connected-noise frozen diagnostic cubature policy",
  () => {
    it("exact-binds both canonical upstream contracts and the spectral schema/source bytes", () => {
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SYMBOL_EXPECTED_SHA256,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SYMBOL_EXPECTED_SIZE_BYTES,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SHA256,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SMEARING_FOURIER_EXPECTED_SHA256,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SIZE_BYTES,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SMEARING_FOURIER_EXPECTED_SIZE_BYTES,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_BLOCK_DIAGNOSTIC_SCHEMA_VERSION,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_EXPECTED_SCHEMA_VERSION,
      );

      const sourceBinding =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY
          .content.upstreamBindings.spectralBlockDiagnostic;
      const sourceBytes = readFileSync(
        resolve(process.cwd(), sourceBinding.implementationSourcePath),
      );
      expect(createHash("sha256").update(sourceBytes).digest("hex")).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_SOURCE_EXPECTED_SHA256,
      );
      expect(sourceBytes.byteLength).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_SOURCE_EXPECTED_SIZE_BYTES,
      );
      expect(sourceBinding).toMatchObject({
        sourceBytePinVerificationRequired: true,
        sourceBytesVerifiedAtModuleInitialization: false,
        semanticSubstitutionAllowed: false,
      });
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SHA256,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SHA256,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SIZE_BYTES,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SIZE_BYTES,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY
          .content.upstreamBindings.spectralMomentMap,
      ).toMatchObject({
        canonicalSha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SHA256,
        canonicalSizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SIZE_BYTES,
        exactIdentityVerifiedAtModuleInitialization: true,
        semanticSubstitutionAllowed: false,
      });
    });

    it("pins content and full contract bytes independently and deeply freezes them", () => {
      const policy =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY;
      expect(policy.contentBinding).toEqual(canonicalBinding(policy.content));
      expect(policy.contentBinding).toEqual({
        canonicalization: "utf8_lexicographic_object_keys_json_v1",
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CONTENT_EXPECTED_SHA256,
        sizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CONTENT_EXPECTED_SIZE_BYTES,
      });
      expect(
        createHash("sha256")
          .update(
            NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CANONICAL_JSON,
            "utf8",
          )
          .digest("hex"),
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SHA256,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SHA256,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_EXPECTED_SHA256,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SIZE_BYTES,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_EXPECTED_SIZE_BYTES,
      );
      expect(Object.isFrozen(policy)).toBe(true);
      expect(Object.isFrozen(policy.content)).toBe(true);
      expect(
        Object.isFrozen(
          policy.content.exactMomentPlan.exponentTripleOrderKxKyKz,
        ),
      ).toBe(true);
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          policy,
        ),
      ).toEqual([]);
    });

    it("exports an exact-pinned, deeply frozen, JSON-only worker descriptor with no caller override surface", () => {
      const worker =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY;
      expect(worker.contentBinding).toEqual({
        canonicalization: "utf8_lexicographic_object_keys_json_v1",
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CONTENT_EXPECTED_SHA256,
        sizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CONTENT_EXPECTED_SIZE_BYTES,
      });
      expect(
        createHash("sha256")
          .update(
            NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CANONICAL_JSON,
            "utf8",
          )
          .digest("hex"),
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_EXPECTED_SHA256,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SHA256,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_EXPECTED_SHA256,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SIZE_BYTES,
      ).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_EXPECTED_SIZE_BYTES,
      );
      expect(JSON.parse(JSON.stringify(worker))).toEqual(worker);
      expect(Object.isFrozen(worker)).toBe(true);
      expect(Object.isFrozen(worker.content.outputInventory)).toBe(true);
      expect(worker.content.inputBoundary).toEqual({
        acceptedCallerConfigurationKeys: [],
        acceptsNumericArguments: false,
        acceptsUserArguments: false,
        acceptsEnvironmentOverrides: false,
        acceptsCommandLineOverrides: false,
        acceptsToleranceOverrides: false,
        acceptsWorkOverrides: false,
        acceptsAuthorityOverrides: false,
        contractOwnedValuesOnly: true,
      });
      expect(worker.content.diagnosticWorkerImplementationInputsFrozen).toBe(
        true,
      );
      expect(worker.content.authoritativeExecutionReady).toBe(false);
      expect(
        Object.values(worker.content.outputAuthority).every(
          (entry) => entry === false || entry === null,
        ),
      ).toBe(true);
    });

    it("freezes every geometry, normalization, factor, accumulation, and scatter input needed by a deterministic binary64 worker", () => {
      const worker =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY.content;
      const geometry = worker.geometryAndScatter;
      expect(geometry.halfWidthsM).toEqual([0.002, 0.01, 0.002, 0.002]);
      expect(geometry.exactHalfWidthsM).toEqual([
        "2/1000",
        "1/100",
        "2/1000",
        "2/1000",
      ]);
      expect(geometry.sampleCentersXYZMicrometersInOrdinalOrder).toEqual(
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.samplePoints.map(
          (point) => {
            const coordinates = point.inertialConformalCoordinatesM;
            return [coordinates.X, coordinates.Y, coordinates.Z].map((entry) =>
              Math.round(Number(entry) * 1_000_000),
            );
          },
        ),
      );
      expect(
        geometry.canonicalDisplacementsXYZMicrometersInOrdinalOrder,
      ).toHaveLength(75);
      expect(geometry.normalizationOrbitRepresentativesXYZMicrometers).toEqual([
        [50000, 10000, 10000],
        [50000, 10000, 25000],
        [50000, 25000, 25000],
        [125000, 10000, 10000],
        [125000, 10000, 25000],
        [125000, 25000, 25000],
      ]);
      expect(geometry.normalizationOrbitOrdinalBySampleOrdinal).toHaveLength(
        64,
      );
      expect(
        new Set(geometry.normalizationOrbitOrdinalBySampleOrdinal),
      ).toEqual(new Set([0, 1, 2, 3, 4, 5]));
      expect(geometry.fullArrayFlatIndexIdentity).toBe(
        "((leftSampleOrdinal*64+rightSampleOrdinal)*100)+componentPairOrdinal",
      );
      expect(geometry.samplePairReconstruction).toMatchObject({
        missingCanonicalLookupDisposition: "abort_without_output",
        sampleNormalizationMultiplierIdentity: "C_left*C_right",
      });

      const mapBoundary = worker.diagnosticNumerics.momentMapBoundary;
      expect(mapBoundary).toMatchObject({
        canonicalSha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SHA256,
        canonicalSizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SIZE_BYTES,
        commonDenominator: 6,
        numeratorRowCount: 100,
        momentCountPerRow: 22,
        coefficientMeaning:
          "parity_projected_s2Pi_abcd_quartic_polynomial_only",
        coefficientIncludesRhoPlusFactor: false,
        coefficientIncludesInverseFourierFactor: false,
        coefficientIncludesHbarCSquared: false,
        coefficientIncludesSmearingFactors: false,
        coefficientIncludesD4KJacobian: false,
      });
      const factors = worker.diagnosticNumerics.scalarIntegrationAndScatter;
      const hbar = factors.planckConstantExactJouleSeconds / (2 * Math.PI);
      const hbarC = hbar * factors.speedOfLightExactMPerS;
      expect(factors.reducedPlanckConstantJouleSecondsBinary64).toBe(hbar);
      expect(factors.hbarC_JouleMetersBinary64).toBe(hbarC);
      expect(factors.inverseFourierMeasureBinary64).toBe(
        1 / (2 * Math.PI) ** 4,
      );
      expect(factors.positiveFrequencySpectralFactorBinary64).toBe(
        1 / (480 * Math.PI),
      );
      expect(factors.hbarCSquaredTimesInverseFourierAndRhoBinary64).toBe(
        (hbarC ** 2 / (2 * Math.PI) ** 4) * (1 / (480 * Math.PI)),
      );
      expect(factors.coefficientApplicationIdentity).toContain(
        "numeratorRows[component][m]/6",
      );
      expect(factors.rhoFactorAppliedAfterRationalMomentMap).toBe(true);

      expect(worker.diagnosticNumerics.accumulationPrimitive).toMatchObject({
        matrixProductRoutine: "numpy.matmul",
        parityClassOrder: [
          "evenEvenEven",
          "oddOddEven",
          "oddEvenOdd",
          "evenOddOdd",
        ],
        momentContributionColumnCountsByParityClass: [10, 4, 4, 4],
        arrayDtype: "numpy.float64",
        arrayMemoryOrder: "C_contiguous",
        pointOrderWithinBatch: "ascending_sobol_index",
        batchOrder: "ascending_batch_index_0_through_63",
        coarseSnapshotAfterExclusiveBatchOrdinal: 32,
        fineSnapshotAfterExclusiveBatchOrdinal: 64,
        workerProcessCount: 1,
        numpySeterr: "raise",
        byteDeterminismAcrossUnattestedRuntimesClaimed: false,
        deterministicEnclosure: null,
      });
    });

    it("freezes the diagnostic runtime tuple while leaving every runtime byte identity unattested and non-authoritative", () => {
      const runtime =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY
          .content.diagnosticRuntimePolicy;
      expect(runtime.requiredUnattestedVersionTuple).toEqual({
        implementation: "CPython",
        pythonVersion: "3.13.7",
        numpyVersion: "2.2.6",
        scipyVersion: "1.16.1",
      });
      expect(runtime).toMatchObject({
        tupleStatus: "required_for_diagnostic_reproduction_but_unattested",
        pythonBinarySha256: null,
        numpyDistributionSha256: null,
        scipyDistributionSha256: null,
        dependencyLockfileSha256: null,
        runtimeReceipt: null,
        sobolImplementation:
          "contract_owned_dependency_independent_uint32_gray_code_recurrence",
        scipySobolImplementationAllowed: false,
        numpyRandomImplementationAllowed: false,
        runtimeAuthority: false,
      });
    });

    it("mechanically derives the 64x64x100 layout and all finite reduction counts", () => {
      const content =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY.content;
      const componentOrder =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL.content
          .tetradComponentConvention.componentOrder;
      expect(componentOrder).toHaveLength(10);
      expect(64 * 64 * componentOrder.length ** 2).toBe(
        content.rawArrayLayout.elementCount,
      );
      expect(content.rawArrayLayout.elementCount * 8).toBe(3276800);
      expect(content.rawArrayLayout.shape).toEqual([64, 64, 100]);

      const mapping =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content
          .sampleAndDisplacementMapping;
      const xSigned = signedDisplacements(mapping.xCenterCoordinatesM);
      const yzSigned = signedDisplacements(mapping.yzCenterCoordinatesM);
      const absolute = (values: readonly number[]) =>
        [...new Set(values.map(Math.abs))].sort((left, right) => left - right);
      const xAbsolute = absolute(xSigned);
      const yzAbsolute = absolute(yzSigned);
      expect([xSigned.length, yzSigned.length, yzSigned.length]).toEqual([
        9, 9, 9,
      ]);
      expect([xAbsolute.length, yzAbsolute.length]).toEqual([5, 5]);
      expect(9 ** 3).toBe(
        content.structuralReductionPlan.signedDisplacements.exactTripleCount,
      );
      expect(5 ** 3).toBe(
        content.structuralReductionPlan.absoluteDisplacements.exactTripleCount,
      );
      expect(5 * ((5 * 6) / 2)).toBe(
        content.structuralReductionPlan.yzCanonicalDisplacements
          .exactTripleCount,
      );
      const yzCanonicalTriples = new Set(
        xAbsolute.flatMap((x) =>
          yzAbsolute.flatMap((y) =>
            yzAbsolute.map((z) => {
              const [yzLow, yzHigh] = [y, z].sort(
                (left, right) => left - right,
              );
              return `${x},${yzLow},${yzHigh}`;
            }),
          ),
        ),
      );
      expect(yzCanonicalTriples.size).toBe(75);
      expect(2 * ((2 * 3) / 2)).toBe(
        content.structuralReductionPlan.normalizationOrbits.exactOrbitCount,
      );
      const normalizationOrbits = new Set(
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.samplePoints.map(
          (point) => {
            const coordinates = point.inertialConformalCoordinatesM;
            const absX = Math.abs(Number(coordinates.X));
            const [absY, absZ] = [
              Math.abs(Number(coordinates.Y)),
              Math.abs(Number(coordinates.Z)),
            ].sort((left, right) => left - right);
            return `${absX},${absY},${absZ}`;
          },
        ),
      );
      expect(normalizationOrbits.size).toBe(6);
      expect(
        content.structuralReductionPlan
          .anyNumericalReductionEquivalenceCertified,
      ).toBe(false);
    });

    it("mechanically enumerates exactly the 22 even-degree moments without claiming tensor equivalence", () => {
      const plan =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY
          .content.exactMomentPlan;
      const allTriples: string[] = [];
      for (let x = 0; x <= 4; x += 1) {
        for (let y = 0; y <= 4 - x; y += 1) {
          for (let z = 0; z <= 4 - x - y; z += 1) {
            allTriples.push(`${x},${y},${z}`);
          }
        }
      }
      const evenTriples = allTriples.filter((entry) => {
        const degree = entry
          .split(",")
          .reduce((sum, value) => sum + Number(value), 0);
        return degree % 2 === 0;
      });
      expect(allTriples).toHaveLength(35);
      expect(evenTriples).toHaveLength(22);
      expect(new Set(plan.exponentTripleOrderKxKyKz)).toEqual(
        new Set(evenTriples),
      );
      expect(plan.tensorToMomentMapPresent).toBe(true);
      expect(plan.tensorToMomentMapCanonicalSha256).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SHA256,
      );
      expect(plan.tensorToMomentMapCanonicalSizeBytes).toBe(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SIZE_BYTES,
      );
      expect(plan.tensorToMomentMapCommonDenominator).toBe(6);
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_WORKER_DESCRIPTOR.monomialExponents.map(
          (entry) => entry.slice(1).join(","),
        ),
      ).toEqual(plan.exponentTripleOrderKxKyKz);
      expect(plan.tensorToMomentEquivalenceCertified).toBe(false);
    });

    it("freezes deterministic unscrambled nested Sobol prefixes and hard point/work/memory caps", () => {
      const policy =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY.content;
      expect(sobolPoints(8)).toEqual([
        [0, 0, 0],
        [0.5, 0.5, 0.5],
        [0.75, 0.25, 0.25],
        [0.25, 0.75, 0.75],
        [0.375, 0.375, 0.625],
        [0.875, 0.875, 0.125],
        [0.625, 0.125, 0.875],
        [0.125, 0.625, 0.375],
      ]);
      expect(policy.sobolPolicy).toMatchObject({
        dimensionCount: 3,
        scramble: false,
        digitalShift: null,
        sequenceIndexOrigin: 0,
        nestedPrefixRequired: true,
        coarsePrefix: { exponent: 17, pointCount: 131072 },
        finePrefix: { exponent: 18, pointCount: 262144 },
        coarseIsExactInitialPrefixOfFine: true,
        sourceProvenanceCertified: false,
      });
      const caps = policy.batchingAndHardCaps;
      expect(caps.maximumPointCount / caps.batchPointCount).toBe(
        caps.maximumBatchCount,
      );
      expect(262144 * 75 * 22 * 2).toBe(caps.maximumMomentAccumulatorUpdates);
      expect(caps.maximumResidentBytes).toBe(256 * 1024 * 1024);
      expect(caps.maximumFullArrayInventoryBytes).toBe(3 * 3276800);
      expect(caps).toMatchObject({
        hardCapsCheckedBeforeAllocationAndWork: true,
        hardCapDisposition: "abort_without_output",
        partialOutputAllowed: false,
        runtimeCapOverrideAccepted: false,
      });
      const workerCaps =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY
          .content.hardCaps;
      expect(workerCaps.maximumQQuadratureNodeApplications).toBe(65537 * 256);
      expect(workerCaps.maximumNormalizationTensorProductNodeApplications).toBe(
        6 * 32 ** 3,
      );
      expect(workerCaps.maximumPhaseTrigonometricEvaluations).toBe(
        262144 * 75 * 6,
      );
      expect(workerCaps.maximumMomentAccumulatorUpdates).toBe(
        262144 * 75 * 22 * 2,
      );
      expect(workerCaps).toMatchObject({
        maximumResidentBytes: 268435456,
        maximumRawBytesPerFullArray: 3276800,
        maximumFullArrayInventoryBytes: 9830400,
        disposition: "abort_without_output",
        partialOutputAllowed: false,
      });
    });

    it("keeps K0 integration, Q/Q0/Cp/D12, core, tail, and enclosure status explicitly unresolved", () => {
      const content =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY.content;
      expect(content.analyticK0IntegrationPlan).toMatchObject({
        finiteTruncationMomentIdentity:
          "J_(4-d)^T(r)=integral_r^T_dK0*K0^(4-d)*Q(a0*K0)^2",
        primaryUpperCutoffDimensionless: 128,
        comparisonUpperCutoffDimensionless: 256,
        primaryUpperCutoffMInverse: 64000,
        comparisonUpperCutoffMInverse: 128000,
        retainedK0Powers: [0, 2, 4],
        binary64PrefixTableAlgorithmFrozen: true,
        numericalJImplementationPresent: false,
        analyticReductionEquivalenceProof: null,
        tailFormula: null,
        tailFormulaCertified: false,
        d12Enclosure: null,
        coreEnclosure: null,
        tailEnclosure: null,
      });
      expect(content.importanceTransformPlan).toMatchObject({
        qEvaluator: {
          quadratureFamily: "gauss_legendre",
          quadratureOrder: 256,
          rowBatchPointCount: 1024,
          binary64DiagnosticOnly: true,
        },
        qSquaredTable: {
          lowerInclusive: 0,
          upperInclusive: 256,
          intervalCount: 65536,
          pointCount: 65537,
          exactStep: "1/256",
        },
        q0Enclosure: null,
        truncatedCdfNormalizerEnclosure: null,
        inverseCdfEnclosure: null,
        spatialTailEnclosure: null,
        transformReadyForBinary64DiagnosticImplementation: true,
        transformReadyForAuthoritativeExecution: false,
      });
      expect(
        Object.entries(content.unavailableProofAndExecutionInputs).every(
          ([key, value]) =>
            key === "allFieldsRequiredBeforeAuthoritativeExecution"
              ? value === true
              : key === "nullFieldAuthoritativeExecutionAllowed"
                ? value === false
                : key === "tensorToMomentMapBinding"
                  ? value != null && typeof value === "object"
                  : value === null,
        ),
      ).toBe(true);
    });

    it("keeps central, refinement, and cutoff observations separate and non-authoritative", () => {
      const content =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY.content;
      expect(content.rawArrayLayout.outputStatus).toBe(
        "diagnostic_binary64_truncated_not_enclosed",
      );
      expect(content.observationSeparation).toMatchObject({
        observationsStoredSeparately: true,
        refinementAndCutoffMayNotBeAddedAsCertifiedUncertainty: true,
        deterministicEnclosure: null,
        simultaneousAbsoluteUncertainty95: null,
        tailEnclosure: null,
      });
      const workerOutputs =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY
          .content.outputInventory;
      expect(workerOutputs.map((entry) => entry.id)).toEqual([
        "central",
        "refinement_observation",
        "cutoff_observation",
      ]);
      expect(
        workerOutputs.every((entry) => entry.exactByteCount === 3276800),
      ).toBe(true);
      expect(workerOutputs[0].status).toBe(
        "diagnostic_binary64_truncated_not_enclosed",
      );
    });

    it("preserves inherited blockers, exposes every requested unproved class, and keeps all locks false", () => {
      const content =
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY.content;
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_INHERITED_BLOCKERS,
      ).toEqual(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS,
      );
      expect(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_BLOCKERS,
      ).toEqual([
        ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_INHERITED_BLOCKERS,
        ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_ADDED_BLOCKERS,
      ]);
      for (const fragment of [
        "source",
        "q_evaluator",
        "q0",
        "cp_",
        "d12",
        "equivalence",
        "core",
        "tail",
        "enclosure",
        "runtime",
        "independent_executor_lineage",
      ]) {
        expect(
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_BLOCKERS.some(
            (entry) => entry.includes(fragment),
          ),
          fragment,
        ).toBe(true);
      }
      expect(content.authority).toMatchObject({
        status: "blocked",
        firstBlocker: "primary_source_artifact_bytes_not_verified",
        blockers:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_BLOCKERS,
      });
      expect(content.authority.locks).toEqual(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_AUTHORITY_LOCKS,
      );
      expect(
        Object.values(content.authority.locks).every((entry) => !entry),
      ).toBe(true);
      expect(content.claimLocks).toEqual(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CLAIM_LOCKS,
      );
      expect(Object.values(content.claimLocks).every((entry) => !entry)).toBe(
        true,
      );
      expect(content.implementationBoundary.mayFeedFixedBackgroundRun).toBe(
        false,
      );
      expect(content.executionAdmissible).toBe(false);
    });

    it("rejects exact-schema drift and stale bindings", () => {
      const extra = clone();
      extra.content.scopeBoundary.executionReceipt = {};
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          extra,
        ),
      ).toEqual(
        expect.arrayContaining([
          "extra_key:/content/scopeBoundary/executionReceipt",
          "content_binding_invalid",
        ]),
      );

      const missing = clone();
      delete missing.content.rawArrayLayout.outputStatus;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          missing,
        ),
      ).toEqual(
        expect.arrayContaining([
          "missing_key:/content/rawArrayLayout/outputStatus",
          "content_binding_invalid",
          "raw_64x64x100_binary64_layout_invalid",
        ]),
      );

      const stale = clone();
      stale.contentBinding.sha256 = "0".repeat(64);
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          stale,
        ),
      ).toContain("content_binding_invalid");
    });

    it("rejects proxies and accessors without invoking traps or getters", () => {
      let calls = 0;
      const proxy = new Proxy(clone(), {
        get: () => {
          calls += 1;
          throw new Error("proxy_get_must_not_run");
        },
        ownKeys: () => {
          calls += 1;
          throw new Error("proxy_own_keys_must_not_run");
        },
      });
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          proxy,
        ),
      ).toEqual(["proxy_forbidden:/"]);
      expect(() =>
        canonicalNhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyJson(
          proxy,
        ),
      ).toThrow("proxy_forbidden:/");

      const accessor = clone();
      Object.defineProperty(accessor.content, "status", {
        configurable: true,
        enumerable: true,
        get: () => {
          calls += 1;
          return "blocked_frozen_diagnostic_cubature_policy_no_emitter";
        },
      });
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          accessor,
        ),
      ).toEqual(["accessor_or_hidden_property_forbidden:/content/status"]);
      expect(calls).toBe(0);
    });

    it("rejects forbidden keys, symbols, sparse or side-key arrays, cycles, and unsafe numbers", () => {
      let getterCalls = 0;
      for (const key of ["__proto__", "prototype", "constructor"] as const) {
        const invalid = clone();
        defineHostileKey(invalid.content, key, () => {
          getterCalls += 1;
          return true;
        });
        expect(
          nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
            invalid,
          ),
        ).toEqual([`forbidden_data_key:/content/${key}`]);
      }
      expect(getterCalls).toBe(0);

      const symbolic = clone();
      symbolic.content[Symbol("authority")] = true;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          symbolic,
        ),
      ).toEqual(["symbol_key_forbidden:/content"]);

      const sparse = clone();
      delete sparse.content.rawArrayLayout.shape[1];
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          sparse,
        ),
      ).toEqual(["array_keys_invalid:/content/rawArrayLayout/shape"]);

      const sideKey = clone();
      Object.defineProperty(sideKey.content.rawArrayLayout.shape, "side", {
        configurable: true,
        enumerable: true,
        value: true,
      });
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          sideKey,
        ),
      ).toEqual(["array_keys_invalid:/content/rawArrayLayout/shape"]);

      const cyclic = clone();
      cyclic.content.loop = cyclic.content;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          cyclic,
        ),
      ).toEqual(["cycle_forbidden:/content/loop"]);

      for (const [number, violation] of [
        [
          Number.NaN,
          "nonfinite_number:/content/rawArrayLayout/exactRawByteCount",
        ],
        [
          Number.POSITIVE_INFINITY,
          "nonfinite_number:/content/rawArrayLayout/exactRawByteCount",
        ],
        [-0, "negative_zero:/content/rawArrayLayout/exactRawByteCount"],
      ] as const) {
        const invalid = clone();
        invalid.content.rawArrayLayout.exactRawByteCount = number;
        expect(
          nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
            invalid,
          ),
        ).toEqual([violation]);
      }
    });

    it("bounds hostile deep and wide values before canonicalization or comparison can exhaust the stack", () => {
      const deep = clone();
      let cursor: any = {};
      deep.extra = cursor;
      for (let index = 0; index < 20_000; index += 1) {
        cursor.next = {};
        cursor = cursor.next;
      }
      const deepViolations =
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          deep,
        );
      expect(deepViolations).toHaveLength(1);
      expect(deepViolations[0]).toMatch(/^maximum_depth_exceeded:/);
      expect(() =>
        canonicalNhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyJson(
          deep,
        ),
      ).toThrow(TypeError);

      const wide = clone();
      const branch: Record<string, number> = {};
      for (let index = 0; index < 20_000; index += 1) {
        branch[`k${index}`] = index;
      }
      wide.extra = branch;
      const wideViolations =
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          wide,
        );
      expect(wideViolations).toHaveLength(1);
      expect(wideViolations[0]).toMatch(/^maximum_own_keys_exceeded:/);
      expect(() =>
        canonicalNhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyJson(
          wide,
        ),
      ).toThrow(TypeError);
    });

    it("detects every authority, claim, execution, and fixed-background feed unlock", () => {
      for (const key of Object.keys(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_AUTHORITY_LOCKS,
      )) {
        const invalid = clone();
        invalid.content.authority.locks[key] = true;
        expect(
          nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
            invalid,
          ),
          key,
        ).toContain("authority_must_remain_blocked");
      }
      for (const key of Object.keys(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CLAIM_LOCKS,
      )) {
        const invalid = clone();
        invalid.content.claimLocks[key] = true;
        expect(
          nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
            invalid,
          ),
          key,
        ).toContain("claim_locks_must_remain_false");
      }

      const implementation = clone();
      implementation.content.executionAdmissible = true;
      implementation.content.implementationBoundary.vectorizedCubatureWorkerPresent = true;
      implementation.content.implementationBoundary.mayFeedFixedBackgroundRun = true;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
          implementation,
        ),
      ).toEqual(
        expect.arrayContaining([
          "implementation_and_run_feed_must_remain_absent",
          "execution_must_remain_blocked",
        ]),
      );
    });
  },
);
