import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import * as representationModule from "../nhm2-conformally-flat-needle-connected-noise-numerical-representation.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_AUTHORITY_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTENT_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTENT_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_DISTRIBUTION_CONVENTION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_OBSERVABLES_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_OBSERVABLES_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SCALAR_REFERENCE_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES,
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationJson,
  isNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationV1,
  nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations,
} from "../nhm2-conformally-flat-needle-connected-noise-numerical-representation.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-connected-noise-distribution-convention.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-fixed-background-observables.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE } from "../nhm2-conformally-flat-needle-scalar-reference.v1";

const clone = (): any =>
  structuredClone(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
  );

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const binding = (value: unknown) => {
  const bytes = Buffer.from(canonicalJson(value), "utf8");
  return {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  };
};

const scalarReferenceBinding = binding(
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
);

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

describe("nhm2_conformally_flat_needle_connected_noise_numerical_representation/v1", () => {
  it("exports one exact deeply frozen Stage-2 blocked overlay with no builder or issuer", () => {
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
      ),
    ).toEqual([]);
    expect(
      isNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationV1(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
      ),
    ).toBe(true);
    expect(
      isDeepFrozen(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
      ),
    ).toBe(true);
    expect(
      Object.keys(representationModule).filter((name) =>
        /^(?:build|create|issue|promote|execute)/i.test(name),
      ),
    ).toEqual([]);
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content,
    ).toMatchObject({
      maturity: "stage_2_blocked_numerical_representation_overlay",
      status: "blocked_pending_exact_representation_and_error_freeze",
      executionAdmissible: false,
    });
  });

  it("binds literal scalar-reference, observables, convention, content, and full bytes", () => {
    const contract =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION;
    expect(scalarReferenceBinding).toEqual({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SCALAR_REFERENCE_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_OBSERVABLES_EXPECTED_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_OBSERVABLES_EXPECTED_SIZE_BYTES,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_DISTRIBUTION_CONVENTION_EXPECTED_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES,
    );
    expect(contract.contentBinding).toMatchObject(binding(contract.content));
    expect(contract.contentBinding).toMatchObject({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTENT_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTENT_EXPECTED_SIZE_BYTES,
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256,
    ).toBe(
      createHash("sha256")
        .update(
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_EXPECTED_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES,
    ).toBe(
      Buffer.byteLength(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CANONICAL_JSON,
        "utf8",
      ),
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES,
    );
  });

  it("canonicalizes a valid clone identically and rejects hostile canonical-identity collisions without reads", () => {
    expect(
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationJson(
        clone(),
      ),
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CANONICAL_JSON,
    );

    const symbol = clone();
    symbol.content[Symbol("hidden-authority")] = true;
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationJson(
        symbol,
      ),
    ).toThrowError(
      new TypeError(
        "Cannot canonicalize unsafe plain data: symbol_key_forbidden:/content",
      ),
    );

    const hidden = clone();
    Object.defineProperty(hidden.content, "hiddenAuthority", {
      configurable: true,
      enumerable: false,
      value: true,
      writable: true,
    });
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationJson(
        hidden,
      ),
    ).toThrowError(
      new TypeError(
        "Cannot canonicalize unsafe plain data: accessor_or_hidden_property_forbidden:/content/hiddenAuthority",
      ),
    );

    for (const forbiddenKey of [
      "__proto__",
      "prototype",
      "constructor",
    ] as const) {
      const forbidden = clone();
      Object.defineProperty(
        forbidden.content.algorithmPlans.primary,
        forbiddenKey,
        {
          configurable: true,
          enumerable: true,
          value: { executionAllowed: true },
          writable: true,
        },
      );
      expect(() =>
        canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationJson(
          forbidden,
        ),
      ).toThrowError(
        new TypeError(
          `Cannot canonicalize unsafe plain data: forbidden_data_key:/content/algorithmPlans/primary/${forbiddenKey}`,
        ),
      );
    }

    const arraySideKey = clone();
    Object.defineProperty(
      arraySideKey.content.deterministicErrorAndTailPlan.requiredTailSectors,
      "4294967295",
      {
        configurable: true,
        enumerable: true,
        value: true,
        writable: true,
      },
    );
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationJson(
        arraySideKey,
      ),
    ).toThrowError(
      new TypeError(
        "Cannot canonicalize unsafe plain data: array_keys_invalid:/content/deterministicErrorAndTailPlan/requiredTailSectors",
      ),
    );

    let getterReads = 0;
    const accessor = clone();
    Object.defineProperty(accessor.content, "status", {
      configurable: true,
      enumerable: true,
      get: () => {
        getterReads += 1;
        return "blocked_pending_exact_representation_and_error_freeze";
      },
    });
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationJson(
        accessor,
      ),
    ).toThrowError(
      new TypeError(
        "Cannot canonicalize unsafe plain data: accessor_or_hidden_property_forbidden:/content/status",
      ),
    );
    expect(getterReads).toBe(0);

    let proxyTrapCalls = 0;
    const proxy = new Proxy(clone(), {
      get: () => {
        proxyTrapCalls += 1;
        throw new Error("proxy_get_must_not_run");
      },
      getOwnPropertyDescriptor: () => {
        proxyTrapCalls += 1;
        throw new Error("proxy_descriptor_trap_must_not_run");
      },
      getPrototypeOf: () => {
        proxyTrapCalls += 1;
        throw new Error("proxy_prototype_trap_must_not_run");
      },
      ownKeys: () => {
        proxyTrapCalls += 1;
        throw new Error("proxy_ownKeys_must_not_run");
      },
    });
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationJson(
        proxy,
      ),
    ).toThrowError(
      new TypeError("Cannot canonicalize unsafe plain data: proxy_forbidden:/"),
    );
    expect(proxyTrapCalls).toBe(0);

    const cycle = clone();
    cycle.content.cycle = cycle.content;
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationJson(
        cycle,
      ),
    ).toThrowError(
      new TypeError(
        "Cannot canonicalize unsafe plain data: cycle_forbidden:/content/cycle",
      ),
    );

    for (const [hostileNumber, violation] of [
      [Number.NaN, "nonfinite_number:/content/storageMapping/elementSizeBytes"],
      [
        Number.POSITIVE_INFINITY,
        "nonfinite_number:/content/storageMapping/elementSizeBytes",
      ],
      [-0, "negative_zero:/content/storageMapping/elementSizeBytes"],
    ] as const) {
      const number = clone();
      number.content.storageMapping.elementSizeBytes = hostileNumber;
      expect(() =>
        canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationJson(
          number,
        ),
      ).toThrowError(
        new TypeError(`Cannot canonicalize unsafe plain data: ${violation}`),
      );
    }
  });

  it("keeps the concurrently supplied mean convention and every exact execution quantity null", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content;
    expect(content.requiredMeanConventionBinding).toEqual({
      artifactId: null,
      contractVersion: null,
      canonicalSha256: null,
      canonicalSizeBytes: null,
      canonicalization: null,
      bindingAvailable: false,
      requiredBeforeExecution: true,
      runtimeOrConcurrentContractImportAllowedInV1: false,
      nullBindingAuthorizesExecution: false,
    });
    expect(
      content.sourceArtifactBoundary.sourceArtifactByteVerificationSet,
    ).toBeNull();
    expect(content.twoParticleGramRepresentationPlan).toMatchObject({
      exactStressTensorOperator: null,
      exactTwoParticleStressSymbol: null,
      twoParticleNormalizationConstant: null,
      onShellMeasure: null,
      twoParticleSymmetryFactor: null,
      fourierTransformConvention: null,
      fourierPhaseConvention: null,
      exactFormulaFrozen: false,
      executionAllowed: false,
    });
    expect(content.deterministicErrorAndTailPlan).toMatchObject({
      fourierDecayDerivativeOrder: null,
      fourierDerivativeNorms: null,
      exactStressPolynomialDegree: null,
      ultravioletPowerCount: null,
      infraredPowerCount: null,
      primaryCoreDomainCutoff: null,
      independentCoreDomainCutoff: null,
      tailSectorCutoffs: null,
      cubatureRules: null,
      maximumAdaptiveCells: null,
      maximumFunctionEvaluations: null,
      maximumWallClockMs: null,
      maximumPrecisionBits: null,
      absoluteToleranceByComponentPair: null,
      relativeToleranceByComponentPair: null,
      nullNumericalPolicyExecutionAllowed: false,
    });
    for (const [key, value] of Object.entries(
      content.unresolvedExecutionFreeze,
    )) {
      if (key === "allFieldsRequiredBeforeExecution") expect(value).toBe(true);
      else if (key === "nullFieldExecutionAllowed") expect(value).toBe(false);
      else expect(value, key).toBeNull();
    }
  });

  it("freezes one uniform two-particle Gram representation for diagonal, overlap, and separated pairs", () => {
    const plan =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION
        .content.twoParticleGramRepresentationPlan;
    expect(plan).toMatchObject({
      smearedCenteredOperatorDefinition: "A_pI=t_hatI(f_p)",
      twoParticleVectorDefinition: "Psi_pI=A_pI*Omega_state",
      connectedNoiseDefinition: "N_pI_qJ=Re(inner_product(Psi_pI,Psi_qJ))",
      ordinaryLocalWickAlgebraProductRequired: true,
      centeredBeforeGramPairing: true,
      realPartImplementsSymmetrization: true,
      uniformRepresentationForEverySampleAndComponentPair: true,
      diagonalObtainedByDistributionPairingNotPointwiseLimit: true,
      evaluatesWightmanSquareAsPointwiseFunction: false,
      positiveSemidefiniteAtExactDistributionLevel: true,
      executionAllowed: false,
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION
        .content.distributionalEquivalenceProofObligations,
    ).toMatchObject({
      status: "undischarged",
      diagonalPointwiseLimitAcceptedAsProof: false,
      pointSeparatedAgreementAcceptedAsDiagonalExtensionProof: false,
      numericalRefinementAcceptedAsDistributionalProof: false,
      proofArtifactSha256: null,
      proofArtifactSizeBytes: null,
      independentlyReplayed: false,
      allObligationsDischarged: false,
      executionAllowed: false,
    });
  });

  it("freezes the exact support ledger including all same-sample component pairings", () => {
    const ledger =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION
        .content.supportSeparationLedger;
    expect(ledger).toMatchObject({
      sampleCount: 64,
      bumpHalfWidthsM: { cTau: 0.002, dx: 0.01, dy: 0.002, dz: 0.002 },
      combinedPairHalfWidthsM: { X0: 0.004, X: 0.02, Y: 0.004, Z: 0.004 },
      minimumDistinctCenterSeparationM: { X: 0.075, Y: 0.015, Z: 0.015 },
      maximumTemporalCoordinateSeparationM: 0.004,
      minimumResidualSpatialSeparationM: 0.011,
      minimumStrictSpacelikeMarginM: 0.007,
      everyDistinctSamplePairStrictlySpacelike: true,
      distinctOrderedSamplePairs: 4032,
      distinctOrderedComponentPairScalars: 403200,
      sameSampleBlocks: 64,
      sameSampleComponentPairScalars: 6400,
      sameSampleSupportsContainCoincidence: true,
      sameSampleSupportsContainNullRelatedPairs: true,
      everyOneHundredComponentPairInSameSampleBlockRequiresDistributionPairing: true,
      covarianceDimension: 640,
      covarianceMatrixDiagonalVariances: 640,
      sameSampleOffComponentEntriesAreCovariancesNotMatrixDiagonal: true,
      offDiagonalPointSeparationMayReplaceUniformGramRepresentation: false,
      independentLedgerReplayReceipt: null,
      ledgerAloneAuthorizesExecution: false,
    });
  });

  it("freezes the [64,64,100] left-major byte mapping and exchange transpose", () => {
    const mapping =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION
        .content.storageMapping;
    expect(mapping).toMatchObject({
      shape: [64, 64, 100],
      sampleOrdinalFormula: "p=16*i_z+4*i_y+i_x",
      xVariesFastest: true,
      pairOrdinalFormula: "k=10*I+J",
      leftMajorPairOrdering: true,
      flatElementIndexFormula: "((p*64+q)*100+k)",
      byteOffsetFormula: "8*((p*64+q)*100+(10*I+J))",
      encoding: "raw_ieee754_float64_little_endian",
      headerBytes: 0,
      elementCount: 409600,
      elementSizeBytes: 8,
      expectedSizeBytes: 3276800,
      covarianceRowFormula: "r=10*p+I",
      covarianceColumnFormula: "s=10*q+J",
      exchangeTransposeMapping: "[q,p,10*J+I]",
      absoluteUncertainty95UsesIdenticalMapping: true,
      explicitIndexMapReceiptRequiredBeforeExecution: true,
    });
    expect(mapping.componentOrder).toEqual([
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
    expect(mapping.pairOrder[0]).toBe("T00:T00");
    expect(mapping.pairOrder[1]).toBe("T00:T01");
    expect(mapping.pairOrder[10]).toBe("T01:T00");
    expect(mapping.pairOrder[99]).toBe("T33:T33");
  });

  it("keeps primary 4D and independent 6D algorithms planned, null, and lineage-separated", () => {
    const algorithms =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION
        .content.algorithmPlans;
    expect(algorithms.primary).toMatchObject({
      representation: "analytic_two_particle_phase_space_pushforward",
      integralDimension: 4,
      exactSpectralDensityFormula: null,
      coreCubatureRule: null,
      tailCertificate: null,
      sourceLineageIdentity: null,
      dependencyLineageIdentity: null,
      executableIdentity: null,
      status: "planned_blocked",
      executionAllowed: false,
    });
    expect(algorithms.independent).toMatchObject({
      representation: "direct_unreduced_two_future_mass_shell_pair_integral",
      integralDimension: 6,
      exactOnShellMeasure: null,
      coreCubatureRule: null,
      tailCertificate: null,
      sourceLineageIdentity: null,
      dependencyLineageIdentity: null,
      executableIdentity: null,
      status: "planned_blocked",
      executionAllowed: false,
    });
    for (const [key, value] of Object.entries(
      algorithms.independentAgreement,
    )) {
      if (
        key.endsWith("MayBeShared") &&
        key !== "onlyFrozenContractAndExactInputBytesMayBeShared"
      ) {
        expect(value, key).toBe(false);
      }
    }
    expect(algorithms.independentAgreement).toMatchObject({
      onlyFrozenContractAndExactInputBytesMayBeShared: true,
      observedSourceDependencyExecutableHashesRequired: true,
      presealedAgreementTolerance: null,
      agreementReceipt: null,
      executionAllowed: false,
    });
  });

  it("requires deterministic joint enclosures and full-dimensional PSD evidence", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content;
    expect(content.deterministicErrorAndTailPlan.requiredTailSectors).toEqual([
      "compact_core",
      "simultaneous_large_k_and_l",
      "one_large_k_one_small_l",
      "one_small_k_one_large_l",
      "massless_infrared_near_k_or_l_zero",
      "future_cone_null_boundary",
      "collinear_and_angular_endpoints",
      "bump_normalization_integral",
      "rounding_reduction_and_output_conversion",
    ]);
    expect(content.deterministicEnclosureAndU95Semantics).toEqual({
      centralOutput: "midpoint_of_outward_deterministic_enclosure",
      uncertainty95Output:
        "outward_deterministic_absolute_radius_covering_the_exact_value",
      uncertainty95NameIsLegacyStorageRole: true,
      statisticalConfidenceInterval: false,
      probabilisticSamplingErrorModelUsed: false,
      deterministicCoverageLowerBound: 1,
      simultaneousCoverageOfAll409600EntriesRequired: true,
      entrywiseMarginalCoverageAloneAllowed: false,
      nonnegativeFiniteRadiusRequired: true,
      exactValueMustLieInMidpointPlusOrMinusRadius: true,
      jointCoverageProofArtifact: null,
      semanticsAuthorizeExecutionWithoutProof: false,
    });
    expect(
      content.jointPositiveSemidefiniteCertificateRequirements,
    ).toMatchObject({
      covarianceDimension: 640,
      analyticGramPositivityProofRequired: true,
      numericalCertificateMustCoverSameJointEnclosures: true,
      fullDimensionCertificateRequiredForPositiveAuthority: true,
      pointwiseUncertainty95AloneSufficient: false,
      GershgorinLowerBoundsMayGrantPositiveAuthority: false,
      absenceOfNegativeWitnessMayGrantPositiveAuthority: false,
      positiveCertificateScheme: null,
      certificateArtifactSha256: null,
      certificateArtifactSizeBytes: null,
      certificatePresent: false,
      executionAllowedWithoutCertificateScheme: false,
    });
  });

  it("forbids every position-space, PV/delta, Bates, delta-squared, and contact shortcut", () => {
    const forbidden =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION
        .content.forbiddenExecutionPaths;
    for (const [key, value] of Object.entries(forbidden)) {
      if (key.endsWith("Allowed")) expect(value, key).toBe(false);
    }
    expect(forbidden.batesEquation2_11Role).toBe(
      "semantic_warning_anchor_only",
    );
  });

  it("keeps every authority, lamp, ADM, physical, propulsion, transport, and certificate lock false", () => {
    expect(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_AUTHORITY_LOCKS,
      ),
    ).not.toContain(true);
    expect(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CLAIM_LOCKS,
      ),
    ).not.toContain(true);
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION
        .content.authority.blockers,
    ).toEqual(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_BLOCKERS,
    );

    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_AUTHORITY_LOCKS,
    )) {
      const value = clone();
      value.content.authority.locks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
          value,
        ),
        key,
      ).toContain("authority_must_remain_blocked");
    }
    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CLAIM_LOCKS,
    )) {
      const value = clone();
      value.content.claimLocks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
          value,
        ),
        key,
      ).toContain("claim_locks_must_remain_false");
    }
  });

  it("rejects exact-key drift, accessors, proxies, symbols, forbidden keys, and array extras", () => {
    const extra = clone();
    extra.content.algorithmPlans.primary.promoted = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
        extra,
      ),
    ).toContain("extra_key:/content/algorithmPlans/primary/promoted");

    const missing = clone();
    delete missing.content.storageMapping.exchangeTransposeMapping;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
        missing,
      ),
    ).toContain("missing_key:/content/storageMapping/exchangeTransposeMapping");

    const accessor = clone();
    Object.defineProperty(accessor.content, "status", {
      enumerable: true,
      get: () => "blocked_pending_exact_representation_and_error_freeze",
    });
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
        accessor,
      ),
    ).toEqual(["accessor_or_hidden_property_forbidden:/content/status"]);

    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
        new Proxy(clone(), {}),
      ),
    ).toEqual(["proxy_forbidden:/"]);

    const symbol = clone();
    symbol.content[Symbol("authority")] = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
        symbol,
      ),
    ).toEqual(["symbol_key_forbidden:/content"]);

    for (const forbiddenKey of ["__proto__", "constructor"] as const) {
      const value = clone();
      Object.defineProperty(
        value.content.algorithmPlans.primary,
        forbiddenKey,
        {
          enumerable: true,
          configurable: true,
          writable: true,
          value: { executionAllowed: true },
        },
      );
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
          value,
        ),
      ).toEqual([
        `forbidden_data_key:/content/algorithmPlans/primary/${forbiddenKey}`,
      ]);
    }

    const arrayExtra = clone();
    Object.defineProperty(
      arrayExtra.content.deterministicErrorAndTailPlan.requiredTailSectors,
      "hiddenAuthority",
      { enumerable: true, configurable: true, writable: true, value: true },
    );
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
        arrayExtra,
      ),
    ).toEqual([
      "array_keys_invalid:/content/deterministicErrorAndTailPlan/requiredTailSectors",
    ]);
  });

  it("rejects attempts to fill null science fields, admit unsafe formulas, or unlock execution", () => {
    const invented = clone();
    invented.content.twoParticleGramRepresentationPlan.exactTwoParticleStressSymbol =
      "invented_symbol";
    invented.content.unresolvedExecutionFreeze.exactTwoParticleStressSymbol =
      "invented_symbol";
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
        invented,
      ),
    ).toContain("unresolved_execution_fields_must_remain_null");

    const sourceBytes = clone();
    sourceBytes.content.sourceArtifactBoundary.sourceArtifactByteVerificationSet =
      { sha256: "0".repeat(64), sizeBytes: 1 };
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
        sourceBytes,
      ),
    ).toContain("source_byte_verification_must_remain_null");

    const unsafe = clone();
    unsafe.content.forbiddenExecutionPaths.batesEquation2_11ExecutionAllowed = true;
    unsafe.content.forbiddenExecutionPaths.deltaSquaredAllowed = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
        unsafe,
      ),
    ).toContain("unsafe_distribution_execution_path_forbidden");

    const mean = clone();
    mean.content.requiredMeanConventionBinding.canonicalSha256 = "0".repeat(64);
    mean.content.requiredMeanConventionBinding.bindingAvailable = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
        mean,
      ),
    ).toContain("mean_convention_binding_must_remain_null_and_blocking");

    const execute = clone();
    execute.content.executionAdmissible = true;
    execute.content.authority.locks.executionAuthority = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
        execute,
      ),
    ).toEqual(
      expect.arrayContaining([
        "execution_must_remain_blocked",
        "authority_must_remain_blocked",
      ]),
    );
  });
});
