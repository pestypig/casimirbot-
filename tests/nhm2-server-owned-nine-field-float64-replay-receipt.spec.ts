import { describe, expect, it } from "vitest";

import {
  NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_ARGMAX_TIE_BREAK,
  NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_ARTIFACT_ID,
  NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_CONTRACT_VERSION,
  NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_REQUIRED_FIELDS,
  NHM2_PRIMARY_COMPARISON_PROJECTION_OPERATOR_REPLAY_RECEIPT_ARTIFACT_ID,
  NHM2_PRIMARY_COMPARISON_PROJECTION_OPERATOR_REPLAY_RECEIPT_CONTRACT_VERSION,
  isNhm2ServerOwnedNineFieldFloat64ReplayReceiptV1,
  nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations,
  validateNhm2ServerOwnedNineFieldFloat64ReplayReceiptV1,
  type Nhm2ServerOwnedNineFieldFloat64ReplayArtifactRefV1,
  type Nhm2ServerOwnedNineFieldFloat64ReplayReceiptV1,
} from "../shared/contracts/nhm2-server-owned-nine-field-float64-replay-receipt.v1";
import {
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_ARTIFACT_ID,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION,
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
} from "../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_ARTIFACT_ID,
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_CONTRACT_VERSION,
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS,
  NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_ARTIFACT_ID,
  NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-independent-field-array-manifest.v1";
import {
  NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_ARTIFACT_ID,
  NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_CONTRACT_VERSION,
  NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES,
  NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID,
  NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION,
  NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_SHA256,
} from "../shared/contracts/nhm2-primary-comparison-projection.v1";
import {
  NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID,
  NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-primary-raw-output-manifest.v1";
import {
  THEORY_RUNTIME_RECEIPT_ARTIFACT_ID,
  THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION,
} from "../shared/contracts/theory-runtime-receipt.v1";

const digest = (character: string): string => character.repeat(64);

const artifact = (
  artifactId: string,
  contractVersion: string,
  name: string,
  character = "a",
): Nhm2ServerOwnedNineFieldFloat64ReplayArtifactRefV1 => ({
  artifactId,
  contractVersion,
  relativePath: `runs/replay/${name}.json`,
  sha256: digest(character),
  sizeBytes: 1024,
});

const executionReceipt = (
  side: "primary" | "independent",
  character: string,
) => {
  const runtimeId = `nhm2.${side}.runtime`;
  const requestId = `${side}-request-1`;
  return {
    requestId,
    runId: `${side}-run-1`,
    runtimeId,
    receiptId: nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
      runtimeId,
      requestId,
    ),
    artifact: artifact(
      THEORY_RUNTIME_RECEIPT_ARTIFACT_ID,
      THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION,
      `${side}-receipt`,
      character,
    ),
  };
};

const clone = <Value>(value: Value): Value => structuredClone(value);

const validReceipt = (): Nhm2ServerOwnedNineFieldFloat64ReplayReceiptV1 => {
  const fields =
    NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_REQUIRED_FIELDS.map(
      (required) => {
        const components = required.componentOrder.map(
          (componentId, ordinal) => {
            const primaryValue = 0;
            const independentValue = 0.05;
            const maxAbsDifference = Math.abs(independentValue - primaryValue);
            const denominator = 1;
            return {
              ordinal,
              componentId,
              unit: required.componentUnits[ordinal],
              primaryMaxAbs: 1,
              independentMaxAbs: 1,
              maxAbsDifference,
              denominator,
              relativeLInf: maxAbsDifference / denominator,
              ratioOverflowed: false,
              argmax: {
                rowIndex: ordinal,
                primaryValue,
                independentValue,
              },
            };
          },
        );
        return {
          ordinal: required.ordinal,
          fieldId: required.fieldId,
          componentOrder: [...required.componentOrder],
          componentUnits: [...required.componentUnits],
          sampleCount: 64,
          inputBindings: {
            primarySha256: digest("a"),
            independentSha256: digest("b"),
            primaryOrderedRowsSha256: digest("c"),
            independentOrderedRowsSha256: digest("c"),
            bufferHashesRecomputedAndMatched: true as const,
            orderedRowsHashesMatch: true as const,
            sharedArrayBufferBacked: false as const,
          },
          components,
          metric: {
            metricId: "relative_L_inf" as const,
            value: 0.05,
            comparator: "lte" as const,
            tolerance: 0.1,
            unit: "relative_L_inf" as const,
            argmaxComponentIndex: 0,
          },
          status: "pass" as const,
        };
      },
    );
  const componentCount = fields.reduce(
    (count, field) => count + field.components.length,
    0,
  );
  return {
    artifactId: NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_ARTIFACT_ID,
    contractVersion:
      NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_CONTRACT_VERSION,
    generatedAt: "2026-07-20T15:00:01.000Z",
    receiptId: "nhm2-nine-field-replay-receipt-1",
    candidate: {
      candidateId: "nhm2-candidate-1",
      candidateManifestId: "nhm2-candidate-manifest-1",
      selectedProfileId: "alpha-0.7",
      chartId: "nhm2-same-chart-1",
      manifest: artifact(
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_ARTIFACT_ID,
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
        "candidate-manifest",
        "1",
      ),
    },
    numericPolicy: {
      candidatePolicySet: {
        ...artifact(
          NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID,
          NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION,
          "candidate-numeric-policy",
          "2",
        ),
        semanticSha256: digest("3"),
      },
      independentRelativeLInfPolicy: {
        ...artifact(
          NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_ARTIFACT_ID,
          NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_CONTRACT_VERSION,
          "independent-relative-linf-policy",
          "4",
        ),
        semanticSha256: digest("5"),
      },
      checkId: "field_level_outputs_agree_within_frozen_tolerances",
      metric: "relative_L_inf",
      comparator: "lte",
      tolerance: 0.1,
      unit: "relative_L_inf",
      argmaxTieBreak:
        NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_ARGMAX_TIE_BREAK,
    },
    primary: {
      executionReceipt: executionReceipt("primary", "6"),
      rawOutputManifest: artifact(
        NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID,
        NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION,
        "primary-raw-output-manifest",
        "7",
      ),
      rawInventory: {
        semanticSha256: digest("8"),
        entryCount: 107,
        aggregateSizeBytes: 8192,
      },
      projectionManifest: artifact(
        NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_ARTIFACT_ID,
        NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_CONTRACT_VERSION,
        "primary-projection-manifest",
        "9",
      ),
      projectionPolicy: {
        artifactId: NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID,
        contractVersion:
          NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION,
        semanticSha256: NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_SHA256,
      },
      operatorReplayReceipt: artifact(
        NHM2_PRIMARY_COMPARISON_PROJECTION_OPERATOR_REPLAY_RECEIPT_ARTIFACT_ID,
        NHM2_PRIMARY_COMPARISON_PROJECTION_OPERATOR_REPLAY_RECEIPT_CONTRACT_VERSION,
        "primary-operator-replay-receipt",
        "a",
      ),
    },
    independent: {
      executionReceipt: executionReceipt("independent", "b"),
      executionInventory: {
        semanticSha256: digest("c"),
        entryCount: 31,
        aggregateSizeBytes: 4096,
      },
      fieldArrayManifest: artifact(
        NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_ARTIFACT_ID,
        NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_CONTRACT_VERSION,
        "independent-field-array-manifest",
        "d",
      ),
    },
    readback: {
      startedAt: "2026-07-20T15:00:00.000Z",
      completedAt: "2026-07-20T15:00:01.000Z",
      durationMs: 1000,
      serverImplementation: {
        implementationId: "nhm2-nine-field-float64-replay",
        implementationVersion: "1.0.0",
        sourceCommitSha: "e".repeat(40),
        executableSha256: digest("f"),
      },
      inventory: {
        semanticSha256: digest("1"),
        entryCount: 18,
        aggregateSizeBytes: 16384,
      },
    },
    fields,
    summary: {
      expectedFieldCount: 9,
      comparedFieldCount: 9,
      expectedComponentCount: componentCount,
      comparedComponentCount: componentCount,
      passingFieldCount: 9,
      failingFieldCount: 0,
      blockedFieldCount: 0,
      maximumRelativeLInf: 0.05,
      argmax: {
        fieldIndex: 0,
        fieldId: fields[0].fieldId,
        componentIndex: 0,
        componentId: fields[0].componentOrder[0],
        rowIndex: 0,
      },
      status: "pass",
    },
    authority: {
      receiptOwner: "server",
      producerDisposition: "untrusted",
      candidateManifestServerVerified: true,
      numericPolicyServerVerified: true,
      primaryExecutionReceiptServerVerified: true,
      primaryRawInventoryServerVerified: true,
      primaryProjectionManifestServerVerified: true,
      primaryOperatorReplayReceiptServerVerified: true,
      independentExecutionReceiptServerVerified: true,
      independentExecutionInventoryServerVerified: true,
      independentFieldManifestServerVerified: true,
      readbackIntervalServerVerified: true,
      serverImplementationServerVerified: true,
      readbackInventoryServerVerified: true,
      allPrerequisitesServerVerified: true,
      schemaValidationEstablishesAuthority: false,
    },
    claimLocks: {
      theoryClosure: false,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
      empiricalValidation: false,
    },
  };
};

describe("NHM2 server-owned nine-field float64 replay receipt v1", () => {
  it("accepts the exact nine-field receipt while withholding claim authority", () => {
    const receipt = validReceipt();
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(receipt),
    ).toEqual([]);
    expect(isNhm2ServerOwnedNineFieldFloat64ReplayReceiptV1(receipt)).toBe(
      true,
    );
    expect(
      validateNhm2ServerOwnedNineFieldFloat64ReplayReceiptV1(receipt),
    ).toEqual({
      contractVersion:
        NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_CONTRACT_VERSION,
      schemaValid: true,
      internallyDerivedMetricsValid: true,
      prerequisitesDeclaredServerVerified: true,
      schemaConsistentPassDeclaration: true,
      claimAuthority: false,
      violations: [],
    });
  });

  it("keeps startup component, unit, and minimum-row policies exactly aligned", () => {
    expect(
      NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_REQUIRED_FIELDS,
    ).toHaveLength(9);
    for (const [
      fieldIndex,
      field,
    ] of NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_REQUIRED_FIELDS.entries()) {
      const independent =
        NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS[fieldIndex];
      const projection =
        NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES[fieldIndex];
      expect(field).toEqual({
        ordinal: fieldIndex,
        fieldId: independent.fieldId,
        componentOrder: independent.componentOrder,
        componentUnits: independent.componentUnits,
        minimumRows: independent.minimumSampleCount,
      });
      expect(field.componentOrder).toEqual(projection.componentOrder);
      expect(field.componentUnits).toEqual(projection.componentUnits);
      expect(field.minimumRows).toBe(projection.minimumSampleCount);
    }
  });

  it("rejects unknown root and nested keys", () => {
    const root = clone(validReceipt()) as unknown as Record<string, unknown>;
    root.callerAuthority = true;
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(root),
    ).toEqual(["receipt_shape_invalid"]);

    const nested = clone(validReceipt()) as unknown as {
      fields: Array<Record<string, unknown>>;
    };
    nested.fields[0].producerMetric = 0;
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(nested),
    ).toContain("field_shape_invalid:/fields/0");
  });

  it.each([
    [
      "reordered",
      (receipt: Nhm2ServerOwnedNineFieldFloat64ReplayReceiptV1) => {
        [receipt.fields[0], receipt.fields[1]] = [
          receipt.fields[1],
          receipt.fields[0],
        ];
      },
    ],
    [
      "eight-of-nine",
      (receipt: Nhm2ServerOwnedNineFieldFloat64ReplayReceiptV1) => {
        receipt.fields.pop();
      },
    ],
    [
      "duplicate",
      (receipt: Nhm2ServerOwnedNineFieldFloat64ReplayReceiptV1) => {
        receipt.fields[1] = clone(receipt.fields[0]);
      },
    ],
  ])("rejects a %s field ledger", (_label, mutate) => {
    const receipt = validReceipt();
    mutate(receipt);
    expect(isNhm2ServerOwnedNineFieldFloat64ReplayReceiptV1(receipt)).toBe(
      false,
    );
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(receipt).some(
        (violation) =>
          violation === "field_count_invalid" ||
          violation === "field_ids_not_unique" ||
          violation.startsWith("field_binding_invalid"),
      ),
    ).toBe(true);
  });

  it("rejects component order and unit drift", () => {
    const receipt = validReceipt();
    receipt.fields[0].componentOrder[0] = "T99";
    receipt.fields[1].components[0].unit = "Pa";
    const violations =
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(receipt);
    expect(violations).toContain("field_binding_invalid:/fields/0");
    expect(violations).toContain(
      "component_binding_invalid:/fields/1/components/0",
    );
  });

  it("rejects unverified or mismatched per-field byte/domain bindings", () => {
    const invalidHash = validReceipt();
    invalidHash.fields[0].inputBindings.primarySha256 = "not-a-sha256";
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(invalidHash),
    ).toContain("field_input_bindings_invalid:/fields/0");

    const domainMismatch = validReceipt();
    domainMismatch.fields[0].inputBindings.independentOrderedRowsSha256 =
      digest("d");
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(domainMismatch),
    ).toContain("field_input_bindings_invalid:/fields/0");

    const forgedReadback = validReceipt();
    forgedReadback.fields[0].inputBindings.bufferHashesRecomputedAndMatched =
      false as never;
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(forgedReadback),
    ).toContain("field_input_bindings_invalid:/fields/0");
  });

  it("rejects tampered field and summary derivations", () => {
    const receipt = validReceipt();
    receipt.fields[0].metric.value = 0.04;
    receipt.summary.maximumRelativeLInf = 0.04;
    receipt.summary.passingFieldCount = 8;
    const result =
      validateNhm2ServerOwnedNineFieldFloat64ReplayReceiptV1(receipt);
    expect(result.schemaValid).toBe(false);
    expect(result.internallyDerivedMetricsValid).toBe(false);
    expect(result.violations).toContain(
      "field_metric_or_status_invalid:/fields/0",
    );
    expect(result.violations).toContain("summary_derivation_invalid");
    expect(result.claimAuthority).toBe(false);
  });

  it("requires the frozen technical denominator and field sample minimum", () => {
    const denominator = validReceipt();
    denominator.fields[0].components[0].denominator = 1_000_000;
    denominator.fields[0].components[0].relativeLInf = 0.05 / 1_000_000;
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(denominator),
    ).toContain("component_derivation_invalid:/fields/0/components/0");

    const samples = validReceipt();
    samples.fields[0].sampleCount = 63;
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(samples),
    ).toContain("field_binding_invalid:/fields/0");
  });

  it("records a finite-input ratio overflow as a numeric fail", () => {
    const receipt = validReceipt();
    const component = receipt.fields[0].components[0];
    component.primaryMaxAbs = 0;
    component.independentMaxAbs = 1;
    component.maxAbsDifference = 1;
    component.denominator = Number.MIN_VALUE;
    component.relativeLInf = Number.MAX_VALUE;
    component.ratioOverflowed = true;
    component.argmax = {
      rowIndex: 0,
      primaryValue: 0,
      independentValue: 1,
    };
    receipt.fields[0].metric.value = Number.MAX_VALUE;
    receipt.fields[0].metric.argmaxComponentIndex = 0;
    receipt.fields[0].status = "fail";
    receipt.summary.passingFieldCount = 8;
    receipt.summary.failingFieldCount = 1;
    receipt.summary.maximumRelativeLInf = Number.MAX_VALUE;
    receipt.summary.status = "fail";

    const result =
      validateNhm2ServerOwnedNineFieldFloat64ReplayReceiptV1(receipt);
    expect(result.schemaValid).toBe(true);
    expect(result.internallyDerivedMetricsValid).toBe(true);
    expect(result.schemaConsistentPassDeclaration).toBe(false);
    expect(result.claimAuthority).toBe(false);
    expect(receipt.fields[0].status).toBe("fail");
    expect(receipt.summary.status).toBe("fail");
  });

  it("rejects a forged overflow flag or inexact finite quotient", () => {
    const flag = validReceipt();
    flag.fields[0].components[0].ratioOverflowed = true;
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(flag),
    ).toContain("component_derivation_invalid:/fields/0/components/0");

    const quotient = validReceipt();
    quotient.fields[0].components[0].relativeLInf = 0.049;
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(quotient),
    ).toContain("component_derivation_invalid:/fields/0/components/0");
  });

  it("accepts receipt-ready canonical zeros with the technical denominator", () => {
    const receipt = validReceipt();
    const zeroField = receipt.fields[3];
    const component = zeroField.components[0];
    component.primaryMaxAbs = 0;
    component.independentMaxAbs = 0;
    component.maxAbsDifference = 0;
    component.denominator = Number.MIN_VALUE;
    component.relativeLInf = 0;
    component.ratioOverflowed = false;
    component.argmax = {
      rowIndex: 0,
      primaryValue: 0,
      independentValue: 0,
    };
    zeroField.metric.value = 0;
    zeroField.metric.argmaxComponentIndex = 0;

    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(receipt),
    ).toEqual([]);
    expect(Object.is(component.primaryMaxAbs, -0)).toBe(false);
    expect(Object.is(component.relativeLInf, -0)).toBe(false);
    expect(Object.is(component.argmax.primaryValue, -0)).toBe(false);
  });

  it("rejects negative zero in an emitted argmax value", () => {
    const receipt = validReceipt();
    receipt.fields[0].components[0].argmax.primaryValue = -0;
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(receipt),
    ).toContain("component_number_invalid:/fields/0/components/0");
  });

  it("derives tied component argmax by lowest row before component order", () => {
    const receipt = validReceipt();
    receipt.fields[0].components[0].argmax.rowIndex = 5;
    receipt.fields[0].components[1].argmax.rowIndex = 1;
    receipt.fields[0].metric.argmaxComponentIndex = 1;
    receipt.summary.argmax.componentIndex = 1;
    receipt.summary.argmax.componentId = receipt.fields[0].componentOrder[1];
    receipt.summary.argmax.rowIndex = 1;
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(receipt),
    ).toEqual([]);
  });

  it("accepts a zero-duration atomic readback interval", () => {
    const receipt = validReceipt();
    receipt.readback.startedAt = receipt.readback.completedAt;
    receipt.readback.durationMs = 0;
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(receipt),
    ).toEqual([]);
  });

  it.each([
    "theoryClosure",
    "physicalViability",
    "transport",
    "propulsion",
    "routeEta",
    "certifiedSpeed",
    "empiricalValidation",
  ] as const)("rejects a forged %s claim", (claim) => {
    const receipt = validReceipt();
    receipt.claimLocks[claim] = true as never;
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(receipt),
    ).toContain("claim_locks_invalid");
  });

  it("rejects producer authority and a forged prerequisite aggregate", () => {
    const producer = validReceipt();
    (
      producer.authority as { producerDisposition: string }
    ).producerDisposition = "trusted";
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(producer),
    ).toContain("authority_boundary_invalid");

    const aggregate = validReceipt();
    aggregate.authority.primaryRawInventoryServerVerified = false;
    expect(
      nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(aggregate),
    ).toContain("authority_boundary_invalid");
  });

  it("permits a schema-valid blocked receipt but still grants no authority", () => {
    const receipt = validReceipt();
    receipt.authority.primaryRawInventoryServerVerified = false;
    receipt.authority.allPrerequisitesServerVerified = false;
    for (const field of receipt.fields) field.status = "blocked";
    receipt.summary.passingFieldCount = 0;
    receipt.summary.blockedFieldCount = 9;
    receipt.summary.status = "blocked";
    const result =
      validateNhm2ServerOwnedNineFieldFloat64ReplayReceiptV1(receipt);
    expect(result.schemaValid).toBe(true);
    expect(result.prerequisitesDeclaredServerVerified).toBe(false);
    expect(result.schemaConsistentPassDeclaration).toBe(false);
    expect(result.claimAuthority).toBe(false);
  });

  it.each([
    ["NaN", Number.NaN],
    ["positive infinity", Number.POSITIVE_INFINITY],
    ["negative", -1],
    ["negative zero", -0],
  ])("rejects an invalid %s metric number", (_label, invalid) => {
    const receipt = validReceipt();
    receipt.fields[0].components[0].relativeLInf = invalid;
    const result =
      validateNhm2ServerOwnedNineFieldFloat64ReplayReceiptV1(receipt);
    expect(result.schemaValid).toBe(false);
    expect(result.internallyDerivedMetricsValid).toBe(false);
    expect(result.violations).toContain(
      "component_number_invalid:/fields/0/components/0",
    );
    expect(result.claimAuthority).toBe(false);
  });
});
