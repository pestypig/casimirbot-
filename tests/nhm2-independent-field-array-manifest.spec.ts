import { describe, expect, it } from "vitest";

import {
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_ARTIFACT_ID,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
} from "../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_INDEPENDENT_FIELD_ARRAY_EXTERNAL_KERNEL_INTEGRATION,
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_ARTIFACT_ID,
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_CONTRACT_VERSION,
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS,
  NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_ARTIFACT_ID,
  NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_CONTRACT_VERSION,
  NHM2_INDEPENDENT_RELATIVE_L_INF_TECHNICAL_ZERO_SCALE,
  NHM2_ORDERED_SAMPLE_DOMAIN_MANIFEST_ARTIFACT_ID,
  NHM2_ORDERED_SAMPLE_DOMAIN_MANIFEST_CONTRACT_VERSION,
  computeNhm2IndependentRelativeLInfPolicySemanticSha256,
  isNhm2IndependentFieldArrayManifestV1,
  nhm2IndependentFieldArrayManifestViolations,
  validateNhm2IndependentFieldArrayManifestV1,
  type Nhm2IndependentFieldArrayArtifactRefV1,
  type Nhm2IndependentFieldArrayManifestV1,
} from "../shared/contracts/nhm2-independent-field-array-manifest.v1";
import {
  NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_ARTIFACT_ID,
  NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_CONTRACT_VERSION,
  NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_ARTIFACT_ID,
  NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_CONTRACT_VERSION,
  NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID,
  NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION,
  NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_SHA256,
} from "../shared/contracts/nhm2-primary-comparison-projection.v1";

const sha = (seed: string): string => {
  let output = "";
  for (let index = 0; output.length < 64; index += 1) {
    output += (seed.charCodeAt(index % seed.length) + index)
      .toString(16)
      .padStart(2, "0")
      .slice(-2);
  }
  return output.slice(0, 64).replace(/^0{64}$/, "1".repeat(64));
};

const token = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const artifact = (
  label: string,
  overrides: Partial<Nhm2IndependentFieldArrayArtifactRefV1> = {},
): Nhm2IndependentFieldArrayArtifactRefV1 => {
  const id = token(label);
  return {
    artifactId: `test.${id}`,
    contractVersion: `test_${id}/v1`,
    relativePath: `test-fixtures/${id}.json`,
    sha256: sha(label),
    sizeBytes: 127,
    ...overrides,
  };
};

const makeDerivation = (
  label: string,
  sourceArraySha256: string,
  orderedDomainSha256: string,
) => ({
  derivationId: `derivation.${token(label)}`,
  methodId: `method.${token(label)}`,
  artifact: artifact(`${label}-artifact`),
  semanticSha256: sha(`${label}-semantic`),
  sourceArraySha256,
  orderedDomainSha256,
});

const makeManifest = (): Nhm2IndependentFieldArrayManifestV1 => {
  const primaryRequestId = "primary-request";
  const primaryRuntimeId = "nhm2-primary-runtime";
  const independentRequestId = "independent-request";
  const independentRuntimeId = "nhm2-independent-runtime";
  const inputLedger = artifact("independent-input-ledger");
  const domains = NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS.map(
    (field, ordinal) => {
      const orderedRowsSha256 = sha(`ordered-rows-${ordinal}`);
      return {
        ordinal,
        domainId: `domain.${ordinal}`,
        appliesToFieldIds: [field.fieldId],
        sampleCount: field.minimumSampleCount,
        axisOrder: ["sample_ordinal"],
        rowIdentityFields: ["sample_ordinal"],
        ordering: {
          rule: "lexicographic_key_tuple/v1" as const,
          keyOrder: ["sample_ordinal"],
          direction: "ascending" as const,
          duplicateRowIdentities: "forbidden" as const,
          canonicalScalarEncoding:
            "ieee754_hex_or_utf8_length_prefixed/v1" as const,
        },
        primaryDomainManifest: artifact(`primary-domain-${ordinal}`, {
          artifactId: NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_ARTIFACT_ID,
          contractVersion:
            NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_CONTRACT_VERSION,
          relativePath: `primary/domains/domain-${ordinal}.json`,
        }),
        independentDomainManifest: artifact(`independent-domain-${ordinal}`, {
          artifactId: NHM2_ORDERED_SAMPLE_DOMAIN_MANIFEST_ARTIFACT_ID,
          contractVersion: NHM2_ORDERED_SAMPLE_DOMAIN_MANIFEST_CONTRACT_VERSION,
          relativePath: `independent/domains/domain-${ordinal}.json`,
        }),
        primaryOrderedRowsSha256: orderedRowsSha256,
        independentOrderedRowsSha256: orderedRowsSha256,
        sharedOrderedRowsSha256: orderedRowsSha256,
      };
    },
  );
  const fields = NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS.map(
    (field, ordinal) => {
      const rawSha256 = sha(`field-array-${ordinal}`);
      const orderedDomainSha256 = domains[ordinal].sharedOrderedRowsSha256;
      const sampleCount = field.minimumSampleCount;
      const sizeBytes = sampleCount * field.componentOrder.length * 8;
      return {
        ordinal,
        fieldId: field.fieldId,
        componentOrder: [...field.componentOrder],
        componentUnits: [...field.componentUnits],
        sampleDomainId: domains[ordinal].domainId,
        independentRawArray: {
          arrayId: `independent.field.${ordinal}`,
          relativePath: `independent/fields/field-${ordinal}.f64le`,
          sha256: rawSha256,
          sizeBytes,
          mediaType: "application/octet-stream" as const,
          representation: {
            dtype: "float64" as const,
            encoding: "raw_ieee754" as const,
            endianness: "little" as const,
            rank: 2 as const,
            shape: [sampleCount, field.componentOrder.length] as [
              number,
              number,
            ],
            storageOrder: "row-major" as const,
            componentOrder: [...field.componentOrder],
            componentUnits: [...field.componentUnits],
            finiteValuesRequired: true as const,
          },
        },
        diagnostics: {
          sampleCount,
          domainCoverageFraction: 1,
          refinementLevels: 3,
          refinementLevelIds: ["level_0", "level_1", "level_2"],
          refinementOrdering: "coarse_to_fine" as const,
          observedConvergenceOrder: 1,
          coverageDerivation: makeDerivation(
            `field-${ordinal}-coverage`,
            rawSha256,
            orderedDomainSha256,
          ),
          refinementDerivation: makeDerivation(
            `field-${ordinal}-refinement`,
            rawSha256,
            orderedDomainSha256,
          ),
          convergenceDerivation: makeDerivation(
            `field-${ordinal}-convergence`,
            rawSha256,
            orderedDomainSha256,
          ),
        },
        uncertaintyDerivation: {
          ...makeDerivation(
            `field-${ordinal}-uncertainty`,
            rawSha256,
            orderedDomainSha256,
          ),
          confidenceLevel: 0.95 as const,
        },
      };
    },
  );
  const comparisonPolicy: Nhm2IndependentFieldArrayManifestV1["comparisonPolicy"] =
    {
      policyId: "independent.relative-l-inf.test-policy",
      artifact: artifact("relative-l-inf-policy", {
        artifactId: NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_ARTIFACT_ID,
        contractVersion:
          NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_CONTRACT_VERSION,
        relativePath: "inputs/independent-relative-l-inf-policy.json",
      }),
      frozenAt: "2026-07-20T00:00:00.000Z",
      sealedInputLedgerSha256: inputLedger.sha256,
      semanticSha256: "1".repeat(64),
      metric: "relative_L_inf",
      numerator: "abs_independent_minus_primary",
      reduction: "max_over_all_samples_and_components",
      denominator: {
        referenceSide: "primary",
        formula: "max_abs_primary_component_or_frozen_absolute_zero_scale",
        zeroScaleMode: "componentwise_frozen_absolute_floor",
        nonFiniteInputPolicy: "fail_closed",
      },
      comparator: "lte",
      tolerance: 0.1,
      unit: "relative_L_inf",
      fields: NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS.map(
        (field) => ({
          fieldId: field.fieldId,
          components: field.componentOrder.map(
            (componentId, componentIndex) => ({
              componentId,
              absoluteZeroScale:
                NHM2_INDEPENDENT_RELATIVE_L_INF_TECHNICAL_ZERO_SCALE,
              unit: field.componentUnits[componentIndex],
            }),
          ),
        }),
      ),
    };
  comparisonPolicy.semanticSha256 =
    computeNhm2IndependentRelativeLInfPolicySemanticSha256(comparisonPolicy);
  return {
    artifactId: NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_ARTIFACT_ID,
    contractVersion: NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_CONTRACT_VERSION,
    generatedAt: "2026-07-20T00:00:02.000Z",
    identity: {
      candidate: {
        candidateId: "candidate.test",
        candidateManifestId: "candidate.manifest.test",
        selectedProfileId: "profile.test",
        chartId: "comoving_cartesian",
        atlasSha256: sha("atlas"),
        unitsSha256: sha("units"),
        normalizationSha256: sha("normalization"),
        sourceCommitSha: "a".repeat(40),
        candidateManifest: artifact("candidate-manifest", {
          artifactId:
            NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_ARTIFACT_ID,
          contractVersion:
            NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
          relativePath: "inputs/candidate-manifest.json",
        }),
      },
      primaryExecution: {
        requestId: primaryRequestId,
        runId: "primary-run",
        runtimeId: primaryRuntimeId,
        receiptId: nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
          primaryRuntimeId,
          primaryRequestId,
        ),
        solverId: "primary-solver",
        implementationId: "primary-implementation",
        independenceGroup: "primary-group",
        comparisonProjectionManifest: artifact("primary-projection-manifest", {
          artifactId: NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_ARTIFACT_ID,
          contractVersion:
            NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_CONTRACT_VERSION,
          relativePath: "primary/comparison-projection-manifest.json",
        }),
        comparisonProjectionPolicy: {
          artifactId: NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID,
          contractVersion:
            NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION,
          semanticSha256: NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_SHA256,
        },
      },
      independentExecution: {
        planRole: "independent_numerical",
        requestId: independentRequestId,
        runId: "independent-run",
        runtimeId: independentRuntimeId,
        receiptId: nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
          independentRuntimeId,
          independentRequestId,
        ),
        sourceCommitSha: "b".repeat(40),
        deterministicSeed: "independent-seed-test",
        startedAt: "2026-07-20T00:00:01.000Z",
        completedAt: "2026-07-20T00:00:02.000Z",
        durationMs: 1000,
        inputLedger,
      },
      toolchain: {
        solverFamily: "independent_replication_suite",
        solverId: "independent-solver",
        solverVersion: "1.0.0-test",
        implementationId: "independent-implementation",
        independenceGroup: "independent-group",
        executable: artifact("independent-executable", {
          relativePath: "toolchain/bin/independent-kernel.exe",
        }),
        toolchainLedger: artifact("independent-toolchain-ledger", {
          relativePath: "toolchain/toolchain-ledger.json",
        }),
        environmentLock: artifact("independent-environment-lock", {
          relativePath: "toolchain/environment-lock.json",
        }),
      },
    },
    domainMode: "field_specific_domains",
    orderedSampleDomains: domains,
    comparisonPolicy,
    fields,
    publicationBoundary: {
      rawIndependentKernelDeclarationsOnly: true,
      serverFilesystemReadbackRequired: true,
      serverFloat64FiniteReplayRequired: true,
      serverPrimaryProjectionBindingRequired: true,
      serverMetricRecomputationRequired: true,
      producerAuthoredScientificDispositionForbidden: true,
      persistedReceiptBindingDeferredToServer: true,
    },
    claimLocks: {
      schemaConformanceEstablishesScientificAgreement: false,
      independentNumericalReplicationReady: false,
      theoryClosureEstablished: false,
      physicalViabilityEstablished: false,
      transportEstablished: false,
      propulsionEstablished: false,
      routeEtaEstablished: false,
      certifiedSpeedEstablished: false,
      empiricalValidationEstablished: false,
    },
  };
};

const clone = (): Nhm2IndependentFieldArrayManifestV1 =>
  structuredClone(makeManifest());

describe("NHM2 independent typed nine-field array manifest", () => {
  it("accepts the exact field-specific declaration while withholding all authority", () => {
    const manifest = makeManifest();
    const validation = validateNhm2IndependentFieldArrayManifestV1(manifest);

    expect(validation).toEqual({
      contractVersion: NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_CONTRACT_VERSION,
      schemaValid: true,
      scientificAgreementEstablished: false,
      claimAuthority: false,
      violations: [],
    });
    expect(isNhm2IndependentFieldArrayManifestV1(manifest)).toBe(true);
    expect(manifest.fields.map((field) => field.fieldId)).toEqual(
      NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS.map(
        (field) => field.fieldId,
      ),
    );
    expect(Object.values(manifest.claimLocks).every((value) => !value)).toBe(
      true,
    );
  });

  it("rejects one synthetic shared domain across heterogeneous field families", () => {
    const manifest = clone();
    const shared = manifest.orderedSampleDomains[0];
    const sharedSampleCount = Math.max(
      ...NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS.map(
        (field) => field.minimumSampleCount,
      ),
    );
    (manifest as any).domainMode = "single_shared_domain";
    shared.ordinal = 0;
    shared.domainId = "domain.shared";
    shared.appliesToFieldIds = manifest.fields.map((field) => field.fieldId);
    shared.sampleCount = sharedSampleCount;
    manifest.orderedSampleDomains = [shared];
    for (const field of manifest.fields) {
      field.sampleDomainId = shared.domainId;
      field.independentRawArray.representation.shape[0] = sharedSampleCount;
      field.independentRawArray.sizeBytes =
        sharedSampleCount * field.componentOrder.length * 8;
      field.diagnostics.sampleCount = sharedSampleCount;
      field.uncertaintyDerivation.orderedDomainSha256 =
        shared.sharedOrderedRowsSha256;
      for (const key of [
        "coverageDerivation",
        "refinementDerivation",
        "convergenceDerivation",
      ] as const) {
        field.diagnostics[key].orderedDomainSha256 =
          shared.sharedOrderedRowsSha256;
      }
    }

    expect(nhm2IndependentFieldArrayManifestViolations(manifest)).toEqual(
      expect.arrayContaining([
        "domain_mode_invalid",
        "ordered_domain_count_invalid",
        "ordered_domain_binding_invalid:/orderedSampleDomains/0",
      ]),
    );
  });

  it("rejects unknown keys at every strict boundary", () => {
    const root = clone() as unknown as Record<string, unknown>;
    root.producerVerdict = "pass";
    expect(nhm2IndependentFieldArrayManifestViolations(root)).toEqual([
      "manifest_shape_invalid",
    ]);

    const nested = clone() as any;
    nested.fields[0].independentRawArray.representation.authority = true;
    expect(nhm2IndependentFieldArrayManifestViolations(nested)).toContain(
      "field_array_shape_invalid:/fields/0",
    );
  });

  it("fails closed instead of throwing on malformed nested domain and policy values", () => {
    const malformedDomain = clone() as any;
    malformedDomain.orderedSampleDomains[0].rowIdentityFields = null;
    expect(() =>
      nhm2IndependentFieldArrayManifestViolations(malformedDomain),
    ).not.toThrow();
    expect(
      nhm2IndependentFieldArrayManifestViolations(malformedDomain),
    ).toContain("ordered_domain_binding_invalid:/orderedSampleDomains/0");

    const malformedPolicy = clone() as any;
    malformedPolicy.comparisonPolicy.fields = [null];
    expect(() =>
      nhm2IndependentFieldArrayManifestViolations(malformedPolicy),
    ).not.toThrow();
    expect(
      nhm2IndependentFieldArrayManifestViolations(malformedPolicy),
    ).toEqual(
      expect.arrayContaining([
        "comparison_policy_field_count_invalid",
        "comparison_policy_field_invalid:/comparisonPolicy/fields/0",
      ]),
    );
  });

  it("rejects field reordering, substituted IDs, and component permutation", () => {
    const reordered = clone();
    [reordered.fields[0], reordered.fields[1]] = [
      reordered.fields[1],
      reordered.fields[0],
    ];
    expect(nhm2IndependentFieldArrayManifestViolations(reordered)).toContain(
      "field_identity_or_order_invalid:/fields/0",
    );

    const substituted = clone() as any;
    substituted.fields[0].fieldId = "worldline_qei.sampled_bound_and_margin";
    expect(nhm2IndependentFieldArrayManifestViolations(substituted)).toContain(
      "field_identity_or_order_invalid:/fields/0",
    );

    const permuted = clone();
    permuted.fields[0].componentOrder.reverse();
    expect(nhm2IndependentFieldArrayManifestViolations(permuted)).toContain(
      "field_identity_or_order_invalid:/fields/0",
    );
  });

  it("binds the exact primary projection manifest and frozen policy hash", () => {
    const artifactId = clone() as any;
    artifactId.identity.primaryExecution.comparisonProjectionManifest.artifactId =
      "nhm2.lookalike_projection_manifest";
    expect(nhm2IndependentFieldArrayManifestViolations(artifactId)).toContain(
      "artifact_identity_invalid:/identity/primaryExecution/comparisonProjectionManifest",
    );

    const rawHash = clone();
    rawHash.identity.primaryExecution.comparisonProjectionManifest.sha256 =
      "0".repeat(64);
    expect(nhm2IndependentFieldArrayManifestViolations(rawHash)).toContain(
      "artifact_identity_invalid:/identity/primaryExecution/comparisonProjectionManifest",
    );

    const policyHash = clone();
    policyHash.identity.primaryExecution.comparisonProjectionPolicy.semanticSha256 =
      sha("wrong-primary-projection-policy");
    expect(nhm2IndependentFieldArrayManifestViolations(policyHash)).toContain(
      "primary_execution_identity_invalid",
    );
  });

  it("rejects arbitrary component units on every independent declaration surface", () => {
    const fieldUnits = clone();
    fieldUnits.fields[0].componentUnits[0] = "test_unit";
    expect(nhm2IndependentFieldArrayManifestViolations(fieldUnits)).toContain(
      "field_identity_or_order_invalid:/fields/0",
    );

    const rawUnits = clone();
    rawUnits.fields[0].independentRawArray.representation.componentUnits[0] =
      "test_unit";
    expect(nhm2IndependentFieldArrayManifestViolations(rawUnits)).toContain(
      "field_array_binding_invalid:/fields/0",
    );

    const zeroScaleUnits = clone();
    zeroScaleUnits.comparisonPolicy.fields[0].components[0].unit = "test_unit";
    expect(
      nhm2IndependentFieldArrayManifestViolations(zeroScaleUnits),
    ).toContain(
      "comparison_policy_component_invalid:/comparisonPolicy/fields/0/0",
    );
  });

  it("derives heterogeneous field minima from the primary projection policy", () => {
    const byId = new Map(
      NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS.map((field) => [
        field.fieldId,
        field.minimumSampleCount,
      ]),
    );
    expect(byId.get("worldline_qei.sampled_bound_and_margin")).toBe(24);
    expect(
      byId.get(
        "dynamic_backreaction_stability_causality.constraint_stability_causality",
      ),
    ).toBe(16);
    expect(
      byId.get("prediction_falsifier_freeze.pre_registered_observables"),
    ).toBe(6);

    for (const required of NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS) {
      const manifest = clone();
      const domain = manifest.orderedSampleDomains[required.ordinal];
      const field = manifest.fields[required.ordinal];
      const belowMinimum = required.minimumSampleCount - 1;
      domain.sampleCount = belowMinimum;
      field.diagnostics.sampleCount = belowMinimum;
      field.independentRawArray.representation.shape[0] = belowMinimum;
      field.independentRawArray.sizeBytes =
        belowMinimum * required.componentOrder.length * 8;
      expect(nhm2IndependentFieldArrayManifestViolations(manifest)).toContain(
        `ordered_domain_binding_invalid:/orderedSampleDomains/${required.ordinal}`,
      );
    }
  });

  it("fails closed without throwing when field ledgers have extra or missing entries", () => {
    const extra = clone() as any;
    const unexpected = structuredClone(extra.fields.at(-1));
    unexpected.ordinal = extra.fields.length;
    extra.fields.push(unexpected);
    expect(() =>
      nhm2IndependentFieldArrayManifestViolations(extra),
    ).not.toThrow();
    expect(nhm2IndependentFieldArrayManifestViolations(extra)).toEqual(
      expect.arrayContaining([
        "field_count_invalid",
        "field_unexpected:/fields/9",
      ]),
    );

    const missing = clone();
    missing.fields.pop();
    expect(() =>
      nhm2IndependentFieldArrayManifestViolations(missing),
    ).not.toThrow();
    expect(nhm2IndependentFieldArrayManifestViolations(missing)).toContain(
      "field_count_invalid",
    );

    const extraPolicy = clone() as any;
    extraPolicy.comparisonPolicy.fields.push(
      structuredClone(extraPolicy.comparisonPolicy.fields.at(-1)),
    );
    expect(() =>
      nhm2IndependentFieldArrayManifestViolations(extraPolicy),
    ).not.toThrow();
    expect(nhm2IndependentFieldArrayManifestViolations(extraPolicy)).toEqual(
      expect.arrayContaining([
        "comparison_policy_field_count_invalid",
        "comparison_policy_field_unexpected:/comparisonPolicy/fields/9",
      ]),
    );

    const missingPolicy = clone();
    missingPolicy.comparisonPolicy.fields.pop();
    expect(() =>
      nhm2IndependentFieldArrayManifestViolations(missingPolicy),
    ).not.toThrow();
    expect(
      nhm2IndependentFieldArrayManifestViolations(missingPolicy),
    ).toContain("comparison_policy_field_count_invalid");
  });

  it.each([
    ["dtype", "float32"],
    ["encoding", "json"],
    ["endianness", "big"],
    ["rank", 1],
    ["storageOrder", "column-major"],
    ["finiteValuesRequired", false],
  ])("rejects noncanonical raw-array representation %s=%s", (key, value) => {
    const manifest = clone() as any;
    manifest.fields[0].independentRawArray.representation[key] = value;
    expect(nhm2IndependentFieldArrayManifestViolations(manifest)).toContain(
      "field_array_binding_invalid:/fields/0",
    );
  });

  it("rejects path traversal, wrong hashes, byte sizes, and shapes", () => {
    const traversal = clone();
    traversal.fields[0].independentRawArray.relativePath = "../escape.f64le";
    expect(nhm2IndependentFieldArrayManifestViolations(traversal)).toContain(
      "field_array_binding_invalid:/fields/0",
    );

    const hash = clone();
    hash.fields[0].independentRawArray.sha256 = "0".repeat(64);
    expect(nhm2IndependentFieldArrayManifestViolations(hash)).toContain(
      "field_array_binding_invalid:/fields/0",
    );

    const size = clone();
    size.fields[0].independentRawArray.sizeBytes += 8;
    expect(nhm2IndependentFieldArrayManifestViolations(size)).toContain(
      "field_array_binding_invalid:/fields/0",
    );

    const shape = clone();
    shape.fields[0].independentRawArray.representation.shape[1] -= 1;
    expect(nhm2IndependentFieldArrayManifestViolations(shape)).toContain(
      "field_array_binding_invalid:/fields/0",
    );
  });

  it("rejects incomplete domain coverage and unequal primary/independent row digests", () => {
    const missing = clone();
    missing.orderedSampleDomains.pop();
    expect(nhm2IndependentFieldArrayManifestViolations(missing)).toEqual(
      expect.arrayContaining([
        "ordered_domain_count_invalid",
        "ordered_domain_field_coverage_not_exact",
      ]),
    );

    const digest = clone();
    digest.orderedSampleDomains[0].independentOrderedRowsSha256 =
      sha("different-domain");
    expect(nhm2IndependentFieldArrayManifestViolations(digest)).toContain(
      "ordered_domain_binding_invalid:/orderedSampleDomains/0",
    );

    const samePath = clone();
    samePath.orderedSampleDomains[0].independentDomainManifest.relativePath =
      samePath.orderedSampleDomains[0].primaryDomainManifest.relativePath;
    expect(nhm2IndependentFieldArrayManifestViolations(samePath)).toContain(
      "ordered_domain_paths_not_distinct:/orderedSampleDomains/0",
    );
  });

  it("rejects weak coverage, refinement, and convergence declarations", () => {
    const coverage = clone();
    coverage.fields[0].diagnostics.domainCoverageFraction = 0.99;
    expect(nhm2IndependentFieldArrayManifestViolations(coverage)).toContain(
      "field_diagnostics_invalid:/fields/0",
    );

    const refinement = clone();
    refinement.fields[0].diagnostics.refinementLevels = 2;
    refinement.fields[0].diagnostics.refinementLevelIds = [
      "level_0",
      "level_1",
    ];
    expect(nhm2IndependentFieldArrayManifestViolations(refinement)).toContain(
      "field_diagnostics_invalid:/fields/0",
    );

    const convergence = clone();
    convergence.fields[0].diagnostics.observedConvergenceOrder = 0.99;
    expect(nhm2IndependentFieldArrayManifestViolations(convergence)).toContain(
      "field_diagnostics_invalid:/fields/0",
    );
  });

  it("rejects detached coverage and uncertainty derivations", () => {
    const source = clone();
    source.fields[0].diagnostics.coverageDerivation.sourceArraySha256 =
      sha("other-array");
    expect(nhm2IndependentFieldArrayManifestViolations(source)).toContain(
      "derivation_binding_invalid:/fields/0/diagnostics/coverageDerivation",
    );

    const domain = clone();
    domain.fields[0].uncertaintyDerivation.orderedDomainSha256 =
      sha("other-domain");
    expect(nhm2IndependentFieldArrayManifestViolations(domain)).toContain(
      "derivation_binding_invalid:/fields/0/uncertaintyDerivation",
    );

    const confidence = clone() as any;
    confidence.fields[0].uncertaintyDerivation.confidenceLevel = 0.9;
    expect(nhm2IndependentFieldArrayManifestViolations(confidence)).toContain(
      "derivation_binding_invalid:/fields/0/uncertaintyDerivation",
    );
  });

  it("rejects denominator-policy drift, zero floors, stale digests, and post-start freeze", () => {
    const formula = clone() as any;
    formula.comparisonPolicy.denominator.formula = "max_abs_primary";
    expect(nhm2IndependentFieldArrayManifestViolations(formula)).toContain(
      "comparison_policy_binding_invalid",
    );

    const zeroFloor = clone();
    zeroFloor.comparisonPolicy.fields[0].components[0].absoluteZeroScale = 0;
    expect(nhm2IndependentFieldArrayManifestViolations(zeroFloor)).toContain(
      "comparison_policy_component_invalid:/comparisonPolicy/fields/0/0",
    );

    const producerTunableFloor = clone();
    producerTunableFloor.comparisonPolicy.fields[0].components[0].absoluteZeroScale = 1e300;
    producerTunableFloor.comparisonPolicy.semanticSha256 =
      computeNhm2IndependentRelativeLInfPolicySemanticSha256(
        producerTunableFloor.comparisonPolicy,
      );
    expect(
      nhm2IndependentFieldArrayManifestViolations(producerTunableFloor),
    ).toContain(
      "comparison_policy_component_invalid:/comparisonPolicy/fields/0/0",
    );

    const staleDigest = clone();
    staleDigest.comparisonPolicy.semanticSha256 = sha("not-the-policy");
    expect(nhm2IndependentFieldArrayManifestViolations(staleDigest)).toContain(
      "comparison_policy_semantic_sha256_mismatch",
    );

    const late = clone();
    late.comparisonPolicy.frozenAt =
      late.identity.independentExecution.startedAt;
    expect(nhm2IndependentFieldArrayManifestViolations(late)).toContain(
      "comparison_policy_binding_invalid",
    );
  });

  it("rejects receipt spoofing and non-independent toolchain identity", () => {
    const receipt = clone();
    receipt.identity.independentExecution.receiptId = "spoofed-receipt";
    expect(nhm2IndependentFieldArrayManifestViolations(receipt)).toContain(
      "independent_execution_identity_invalid",
    );

    const reused = clone();
    reused.identity.toolchain.implementationId =
      reused.identity.primaryExecution.implementationId;
    expect(nhm2IndependentFieldArrayManifestViolations(reused)).toContain(
      "primary_independent_toolchain_not_distinct",
    );

    const sameRun = clone();
    sameRun.identity.independentExecution.runId =
      sameRun.identity.primaryExecution.runId;
    expect(nhm2IndependentFieldArrayManifestViolations(sameRun)).toContain(
      "primary_independent_runId_not_distinct",
    );
  });

  it("rejects any attempt to unlock a claim", () => {
    for (const key of Object.keys(clone().claimLocks)) {
      const manifest = clone() as any;
      manifest.claimLocks[key] = true;
      expect(nhm2IndependentFieldArrayManifestViolations(manifest)).toContain(
        "claim_locks_invalid",
      );
    }
  });

  it("records external-kernel output-role integration as explicitly pending", () => {
    expect(NHM2_INDEPENDENT_FIELD_ARRAY_EXTERNAL_KERNEL_INTEGRATION).toEqual({
      outputRole: "independent_field_array_manifest",
      status: "pending",
      registeredInExternalKernelPolicy: false,
      blocker:
        "external_kernel_manifest_declared_sidecar_closure_not_implemented",
    });
  });
});
