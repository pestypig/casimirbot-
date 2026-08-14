import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed.v1";
import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-interchange.v1";
import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1";
import {
  computeNhm2SphericalBosonStarV2InitializerBindingSha256,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-initializer-bridge.v1";
import {
  computeNhm2SphericalBosonStarV2InitializerEvaluatorBarrierRawSha256,
  computeNhm2SphericalBosonStarV2InitializerEvaluatorInstanceBindingSha256,
  computeNhm2SphericalBosonStarV2InitializerEvaluatorTraceBindingSha256,
  computeNhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptRawSha256,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_CAPTURE_BOUNDARY,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_SOURCE_OPERATION,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BLOCKERS,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_INSTANCE_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_INSTANCE_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PAYLOADS,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PRIMARY_RECEIPT_SCHEMA_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SUPPLEMENTAL_JOIN_PAYLOAD,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_VALIDATOR_LIMITS,
  cloneNhm2SphericalBosonStarV2InitializerEvaluator,
  isNhm2SphericalBosonStarV2InitializerEvaluatorV1,
  nhm2SphericalBosonStarV2InitializerEvaluatorInstanceViolations,
  nhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptViolations,
  nhm2SphericalBosonStarV2InitializerEvaluatorViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-initializer-evaluator.v1";

type MutableRecord = Record<string, unknown>;

const mutableClone = (): MutableRecord =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_JSON,
  ) as MutableRecord;

const at = (value: unknown, ...keys: string[]): MutableRecord => {
  let cursor = value as MutableRecord;
  for (const key of keys) cursor = cursor[key] as MutableRecord;
  return cursor;
};

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  const record = value as MutableRecord;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const sha256 = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const PRIMARY_PAYLOAD_ROLES = [
  "primary_scalar_operands",
  "primary_L2_scalar_Chebyshev_coefficients",
  "primary_L2_potential_Chebyshev_coefficients",
  "primary_tail_H_Chebyshev_coefficients",
  "primary_tail_Q_Chebyshev_coefficients",
] as const;

const makeBoundInstanceFixture = () => {
  const sourceInputBindingSha256 = sha256("source-input");
  const sourceProofSummaryRawSha256 = sha256("source-proof-summary");
  const fiveRawSha256 = NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS.map(
    (_, index) => sha256(`source-payload-${index}`),
  );
  const primaryReceipt = {
    authorityFalse: true,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.candidateId,
    descriptorBinding: {
      mediaType: "application/json",
      path: "descriptor.json",
      sha256: sha256("primary-descriptor"),
      sizeBytes: 1_337,
    },
    inputBindingSha256: sourceInputBindingSha256,
    orderedPayloadBindings:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS.map(
        (payload, index) => ({
          elementCount: [9, 128, 128, 32, 32][index],
          elementType: "IEEE754_binary64_little_endian",
          path: payload.path,
          payloadSha256: sha256(`primary-payload-binding-${index}`),
          rawSha256: fiveRawSha256[index],
          semanticRole: PRIMARY_PAYLOAD_ROLES[index],
          sizeBytes: payload.sizeBytes,
        }),
      ),
    publication: {
      finalRoot: "/sealed/primary-attempt-1",
      parentDirectoryFsyncRequired: true,
      publicationMethod: "renameat2_RENAME_NOREPLACE_then_parent_fsync",
      publicationPreparedWallUtc: "2026-08-13T00:00:00.000Z",
      tempRootNonceSha256: sha256("primary-temp-root-nonce"),
    },
    schemaVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PRIMARY_RECEIPT_SCHEMA_VERSION,
  };
  const sourcePrimaryReceiptCanonicalWire = canonicalJson(primaryReceipt);
  const sourcePrimaryReceiptRawSha256 = sha256(
    sourcePrimaryReceiptCanonicalWire,
  );
  const initializerBridgeInstanceSha256 =
    computeNhm2SphericalBosonStarV2InitializerBindingSha256(
      sourceInputBindingSha256,
      sourceProofSummaryRawSha256,
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS.map(
        (payload, index) => ({
          path: payload.path,
          rawSha256: fiveRawSha256[index]!,
          sizeBytes: payload.sizeBytes,
        }),
      ),
    );
  const f64LeWordHex = [
    "000000000000f03f",
    "000000000000e03f",
    "000000000000f0bf",
    "0000000000000000",
  ] as const;
  const barrierRawSha256 =
    computeNhm2SphericalBosonStarV2InitializerEvaluatorBarrierRawSha256(
      ...f64LeWordHex,
    );
  const barrierTracePreimage = {
    captureBoundary:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_CAPTURE_BOUNDARY,
    elementOrder: ["U", "U1", "V", "V1"],
    f64LeWordHex: [...f64LeWordHex],
    rawSha256: barrierRawSha256,
    sourceOperation:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_SOURCE_OPERATION,
  };
  const traceReceiptBase = {
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_ARTIFACT_ID,
    attemptOrdinal: 1,
    authorityFalse: true,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_CONTRACT_VERSION,
    evaluatorPolicySha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256,
    initializerBridgeInstanceSha256,
    orderedFiveSourcePayloadRawSha256: fiveRawSha256,
    primaryNumericsPolicySha256:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING.sha256,
    sourceInputBindingSha256,
    sourcePrimaryReceiptCanonicalWire,
    sourcePrimaryReceiptRawSha256,
    sourcePrimaryReceiptSchemaVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PRIMARY_RECEIPT_SCHEMA_VERSION,
    sourceProofSummaryRawSha256,
    targetCandidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING.candidateId,
  };
  const traceBindingSha256 =
    computeNhm2SphericalBosonStarV2InitializerEvaluatorTraceBindingSha256(
      canonicalJson({
        ...traceReceiptBase,
        barrierTrace: barrierTracePreimage,
      }),
    );
  const traceReceipt = {
    ...traceReceiptBase,
    barrierTrace: {
      ...barrierTracePreimage,
      traceBindingSha256,
    },
  };
  const traceReceiptWire = canonicalJson(traceReceipt);
  const supplementalJoinBarrierTraceReceiptRawSha256 =
    computeNhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptRawSha256(
      traceReceiptWire,
    );
  const orderedPayloadBindings = [
    ...NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS.map(
      (payload, index) => ({
        ordinal: index,
        path: payload.path,
        rawSha256: fiveRawSha256[index],
        sizeBytes: payload.sizeBytes,
      }),
    ),
    {
      ordinal: 5,
      path: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SUPPLEMENTAL_JOIN_PAYLOAD.path,
      rawSha256: barrierRawSha256,
      sizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SUPPLEMENTAL_JOIN_PAYLOAD.sizeBytes,
    },
  ];
  const instancePreimage = {
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_INSTANCE_ARTIFACT_ID,
    attemptOrdinal: 1,
    authorityFalse: true,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_INSTANCE_CONTRACT_VERSION,
    evaluatorPolicySha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256,
    initializerBridgeInstanceSha256,
    orderedPayloadBindings,
    primaryNumericsPolicySha256:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING.sha256,
    sourceInputBindingSha256,
    sourcePrimaryReceiptRawSha256,
    sourceProofSummaryRawSha256,
    supplementalJoinBarrierTraceReceipt: traceReceipt,
    supplementalJoinBarrierTraceReceiptRawSha256,
    targetCandidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING.candidateId,
  };
  const instanceBindingSha256 =
    computeNhm2SphericalBosonStarV2InitializerEvaluatorInstanceBindingSha256(
      canonicalJson(instancePreimage),
    );
  const instance = { ...instancePreimage, instanceBindingSha256 };
  return {
    instance,
    instanceWire: canonicalJson(instance),
    traceReceipt,
    traceReceiptWire,
  };
};

describe("NHM2 spherical boson-star v2 initializer evaluator successor", () => {
  it("has a literal seal and exact-binds all four upstream policies", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256).toBe(
      "2253cea43e7b0abc99aaebd19ced18994eba4605b65fe674febb03d9945cdbc5",
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_SIZE_BYTES,
    ).toBe(24_711);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING.sha256,
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.exactUpstreamBindings,
    ).toEqual({
      semanticSeed: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
      interchange:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_BINDING,
      primaryNumerics:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING,
      initializerBridge:
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING,
    });
  });

  it("preserves the exact five-payload ABI and adds only the 32-byte join barrier", () => {
    const abi = NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.inputAbi;
    expect(abi.existingPayloadCount).toBe(5);
    expect(abi.successorPayloadCount).toBe(6);
    expect(abi.orderedPayloads).toHaveLength(6);
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS.forEach(
      (entry, index) => {
        expect(abi.orderedPayloads[index]).toMatchObject({
          ordinal: index,
          path: entry.path,
          sizeBytes: entry.sizeBytes,
          origin: "existing_interchange_payload",
        });
      },
    );
    expect(abi.orderedPayloads[5]).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SUPPLEMENTAL_JOIN_PAYLOAD,
    );
    expect(abi.orderedPayloads[5]).toMatchObject({
      ordinal: 5,
      path: "initializer/core_L2_join_barrier.f64le",
      elementType: "IEEE754_binary64_little_endian",
      elementCount: 4,
      sizeBytes: 32,
      elementOrder: ["U", "U1", "V", "V1"],
      requiredForTailC1Lift: true,
      currentInstance: null,
    });
    expect(abi.exactTotalElementCount).toBe(333);
    expect(abi.exactTotalSizeBytes).toBe(2_664);
    expect(abi.supplementalJoinBarrierTraceReceiptSchema.exactKeyOrder).toEqual(
      [
        "artifactId",
        "attemptOrdinal",
        "authorityFalse",
        "barrierTrace",
        "contractVersion",
        "evaluatorPolicySha256",
        "initializerBridgeInstanceSha256",
        "orderedFiveSourcePayloadRawSha256",
        "primaryNumericsPolicySha256",
        "sourceInputBindingSha256",
        "sourcePrimaryReceiptCanonicalWire",
        "sourcePrimaryReceiptRawSha256",
        "sourcePrimaryReceiptSchemaVersion",
        "sourceProofSummaryRawSha256",
        "targetCandidateId",
      ],
    );
    expect(
      abi.supplementalJoinBarrierTraceReceiptSchema.exactBarrierTraceKeyOrder,
    ).toEqual([
      "captureBoundary",
      "elementOrder",
      "f64LeWordHex",
      "rawSha256",
      "sourceOperation",
      "traceBindingSha256",
    ]);
    expect(
      abi.supplementalJoinBarrierTraceReceiptSchema.currentReceipt,
    ).toBeNull();
    expect(abi.successorInstanceBindingSchema.exactKeyOrder).toEqual([
      "artifactId",
      "attemptOrdinal",
      "authorityFalse",
      "contractVersion",
      "evaluatorPolicySha256",
      "initializerBridgeInstanceSha256",
      "instanceBindingSha256",
      "orderedPayloadBindings",
      "primaryNumericsPolicySha256",
      "sourceInputBindingSha256",
      "sourcePrimaryReceiptRawSha256",
      "sourceProofSummaryRawSha256",
      "supplementalJoinBarrierTraceReceipt",
      "supplementalJoinBarrierTraceReceiptRawSha256",
      "targetCandidateId",
    ]);
    expect(
      abi.successorInstanceBindingSchema.exactPayloadBindingKeyOrder,
    ).toEqual(["ordinal", "path", "rawSha256", "sizeBytes"]);
    expect(abi.successorInstanceBindingSchema.hashRecipe).toContain(
      "exact_canonical_instance_preimage_utf8",
    );
    expect(
      abi.supplementalJoinBarrierTraceReceiptSchema.traceHashRecipe,
    ).toContain(
      "primary_policy_initializer_bridge_input_primary_receipt_exact_wire",
    );
    expect(abi.successorInstanceBindingSchema.currentInstance).toBeNull();
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PAYLOADS.map(
        (entry) => entry.ordinal,
      ),
    ).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("honestly replaces only initializer evaluation and never claims nodal or join recovery", () => {
    const successor =
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.additiveSuccessor;
    expect(successor.supersedesOnly).toBe(
      "v2_initializer_evaluator_input_and_finite_operation_semantics",
    );
    expect(successor.upstreamFivePayloadInventoryMutated).toBe(false);
    expect(successor.sourceDescriptorOrInterchangeSchemaMutated).toBe(false);
    expect(successor.sourceProofOrPrimaryNumericsReinterpreted).toBe(false);
    expect(successor.sourceFivePayloadsAloneSufficientForExactTailC1Lift).toBe(
      false,
    );
    expect(
      successor.roundedCoreCoefficientsCannotRecoverPrimaryProjectedNodalBits,
    ).toBe(true);
    expect(
      successor.roundedCoreCoefficientsCannotInferExactPrimaryJoinBarrierBits,
    ).toBe(true);
    expect(successor.primaryProjectedNodalCompositeRecoveredOrClaimed).toBe(
      false,
    );
    expect(
      successor.coefficientSpaceInitializerIsANewNonAuthoritativeEvaluator,
    ).toBe(true);
    expect(
      successor.doesNotClearAnyBranchSolverPreexecutionReplayOrAcceptanceBlocker,
    ).toBe(true);
  });

  it("validates a cryptographically closed primary receipt, barrier trace, and six-payload instance", () => {
    const fixture = makeBoundInstanceFixture();
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptViolations(
        fixture.traceReceiptWire,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorInstanceViolations(
        fixture.instanceWire,
      ),
    ).toEqual([]);

    const instance = fixture.instance as MutableRecord;
    const traceReceipt =
      instance.supplementalJoinBarrierTraceReceipt as MutableRecord;
    const trace = traceReceipt.barrierTrace as MutableRecord;
    const payloads = instance.orderedPayloadBindings as MutableRecord[];
    expect(traceReceipt.evaluatorPolicySha256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256,
    );
    expect(traceReceipt.primaryNumericsPolicySha256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING.sha256,
    );
    expect(traceReceipt.orderedFiveSourcePayloadRawSha256).toEqual(
      payloads.slice(0, 5).map((payload) => payload.rawSha256),
    );
    expect(trace.rawSha256).toBe(payloads[5].rawSha256);
    expect(trace.captureBoundary).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_CAPTURE_BOUNDARY,
    );
    expect(trace.elementOrder).toEqual(["U", "U1", "V", "V1"]);

    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.inputAbi
        .supplementalJoinBarrierTraceReceiptSchema.currentReceipt,
    ).toBeNull();
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.inputAbi
        .successorInstanceBindingSchema.currentInstance,
    ).toBeNull();
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.instances
        .supplementalJoinBarrierTraceReceipt,
    ).toBeNull();
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.completionBoundary
        .targetCandidateExecutionAuthorized,
    ).toBe(false);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.completionBoundary
        .targetCandidateExecuted,
    ).toBe(false);
  });

  it("rejects every attempted break in primary-run, five-payload, barrier, receipt, and instance closure", () => {
    const fixture = makeBoundInstanceFixture();

    const changedWord = JSON.parse(fixture.traceReceiptWire) as MutableRecord;
    const changedWordTrace = changedWord.barrierTrace as MutableRecord;
    (changedWordTrace.f64LeWordHex as string[])[0] = "0000000000000040";
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptViolations(
        canonicalJson(changedWord),
      ),
    ).toEqual(["initializer_evaluator_barrier_trace_raw_sha256_mismatch"]);

    const negativeZeroWord = JSON.parse(
      fixture.traceReceiptWire,
    ) as MutableRecord;
    const negativeZeroTrace = negativeZeroWord.barrierTrace as MutableRecord;
    (negativeZeroTrace.f64LeWordHex as string[])[3] = "0000000000000080";
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptViolations(
        canonicalJson(negativeZeroWord),
      ),
    ).toEqual(["initializer_evaluator_barrier_trace_word_invalid"]);

    const nonprimitiveWord = JSON.parse(
      fixture.traceReceiptWire,
    ) as MutableRecord;
    const nonprimitiveTrace = nonprimitiveWord.barrierTrace as MutableRecord;
    (nonprimitiveTrace.f64LeWordHex as unknown[])[0] = ["000000000000f03f"];
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptViolations(
        canonicalJson(nonprimitiveWord),
      ),
    ).toEqual(["initializer_evaluator_barrier_trace_schema_invalid"]);

    const changedPrimaryPayload = JSON.parse(
      fixture.traceReceiptWire,
    ) as MutableRecord;
    const primaryReceipt = JSON.parse(
      String(changedPrimaryPayload.sourcePrimaryReceiptCanonicalWire),
    ) as MutableRecord;
    const primaryPayloads =
      primaryReceipt.orderedPayloadBindings as MutableRecord[];
    primaryPayloads[0].rawSha256 = sha256("forged-primary-payload");
    changedPrimaryPayload.sourcePrimaryReceiptCanonicalWire =
      canonicalJson(primaryReceipt);
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptViolations(
        canonicalJson(changedPrimaryPayload),
      ),
    ).toEqual(["initializer_evaluator_primary_receipt_payload_invalid:0"]);

    const changedPrimaryInput = JSON.parse(
      fixture.traceReceiptWire,
    ) as MutableRecord;
    const inputReceipt = JSON.parse(
      String(changedPrimaryInput.sourcePrimaryReceiptCanonicalWire),
    ) as MutableRecord;
    inputReceipt.inputBindingSha256 = sha256("other-primary-input");
    changedPrimaryInput.sourcePrimaryReceiptCanonicalWire =
      canonicalJson(inputReceipt);
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptViolations(
        canonicalJson(changedPrimaryInput),
      ),
    ).toEqual(["initializer_evaluator_primary_receipt_binding_invalid"]);

    const changedPrimaryReceiptHash = JSON.parse(
      fixture.traceReceiptWire,
    ) as MutableRecord;
    changedPrimaryReceiptHash.sourcePrimaryReceiptRawSha256 = sha256(
      "wrong-primary-receipt",
    );
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptViolations(
        canonicalJson(changedPrimaryReceiptHash),
      ),
    ).toEqual(["initializer_evaluator_primary_receipt_raw_sha256_mismatch"]);

    const changedPayload5 = JSON.parse(fixture.instanceWire) as MutableRecord;
    const sixPayloads =
      changedPayload5.orderedPayloadBindings as MutableRecord[];
    sixPayloads[5].rawSha256 = sha256("forged-barrier-payload");
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorInstanceViolations(
        canonicalJson(changedPayload5),
      ),
    ).toEqual([
      "initializer_evaluator_instance_barrier_payload_sha256_mismatch",
    ]);

    const changedTraceReceiptHash = JSON.parse(
      fixture.instanceWire,
    ) as MutableRecord;
    changedTraceReceiptHash.supplementalJoinBarrierTraceReceiptRawSha256 =
      sha256("forged-trace-receipt");
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorInstanceViolations(
        canonicalJson(changedTraceReceiptHash),
      ),
    ).toEqual(["initializer_evaluator_trace_receipt_raw_sha256_mismatch"]);

    const changedInstanceHash = JSON.parse(
      fixture.instanceWire,
    ) as MutableRecord;
    changedInstanceHash.instanceBindingSha256 = sha256(
      "forged-instance-binding",
    );
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorInstanceViolations(
        canonicalJson(changedInstanceHash),
      ),
    ).toEqual(["initializer_evaluator_instance_binding_sha256_mismatch"]);

    expect(() =>
      computeNhm2SphericalBosonStarV2InitializerEvaluatorTraceBindingSha256({}),
    ).toThrow(
      "initializer_evaluator_trace_preimage_canonical_wire_string_required",
    );
  });

  it("freezes scalar checks, MPFR256 context, coordinate admission, and coefficient core order", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR;
    expect(contract.scalarValidationGraph.decodedOrder).toEqual([
      "nu0",
      "Vc",
      "N0",
      "C",
      "kappa",
      "sigma",
      "lambda",
      "nu_star",
      "wSeed",
    ]);
    expect(contract.scalarValidationGraph.operationOrder.join("\n")).toContain(
      "require_bit_identity_for_N0_kappa_sigma_lambda_nu_star_wSeed",
    );
    expect(
      contract.scalarValidationGraph.producerScalarAcceptedWithoutRecomputation,
    ).toBe(false);
    expect(contract.mpfr256Context).toMatchObject({
      precisionBits: 256,
      roundingMode: "MPFR_RNDN_round_to_nearest_ties_to_even",
      emin: -1_073_741_823,
      emax: 1_073_741_823,
      subnormalize: false,
      trapsEnabled: false,
      contextIsolatedFromAmbientAndRestoredExactly: true,
      fusedOperationsOrReassociationAllowed: false,
      precisionEscalationAllowed: false,
    });
    expect(contract.coordinateAbi.inputTupleLengthMinimum).toBe(3);
    expect(contract.coordinateAbi.inputTupleLengthMaximum).toBe(512);
    expect(contract.coordinateAbi.nodeCountSelectedByThisPolicy).toBe(false);
    expect(contract.coefficientCoreEvaluator.polynomialConvention).toContain(
      "no_implicit_endpoint_halves",
    );
    expect(
      contract.coefficientCoreEvaluator.recurrenceAndSumGraph.join("\n"),
    ).toContain("for_n_increasing_1_through_127");
    expect(contract.coefficientCoreEvaluator.projectedL2NodalBitsUsed).toBe(
      false,
    );
    expect(contract.coefficientCoreEvaluator.inverseDctUsed).toBe(false);
    expect(
      contract.coefficientCoreEvaluator
        .byteIdentityWithPrimaryBarycentricCoreClaimed,
    ).toBe(false);
  });

  it("uses the supplemental bits for the exact tail lifts and preserves the initializer map", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR;
    expect(contract.tailEvaluator.joinBarrierSource).toContain(
      "supplemental_payload_only",
    );
    expect(contract.tailEvaluator.joinBarrierSource).toContain(
      "never_from_rounded_core_coefficients",
    );
    expect(contract.tailEvaluator.liftGraph.join("\n")).toContain(
      "sub(Hy1,liftProduct,RU1)",
    );
    expect(contract.tailEvaluator.liftGraph.join("\n")).toContain(
      "sub(Qy1,qLiftPlusC,RV1)",
    );
    expect(
      contract.tailEvaluator.recurrenceAndCompositeGraph.join("\n"),
    ).toContain("generate_T2_through_T31");
    expect(
      contract.tailEvaluator
        .supplementalPayloadEstablishesSourceProofOrC1Acceptance,
    ).toBe(false);
    expect(
      contract.tailEvaluator.tailRemainderOrTrueSolutionBallInherited,
    ).toBe(false);
    expect(contract.targetInitializerMaterialization.outputSemantics).toEqual({
      varphi: "varphi_init(xTarget)=u_star(xTarget)",
      F0: "F0_init(xTarget)=V_star(xTarget)",
      F1: "F1_init(xTarget)=-V_star(xTarget)",
      w: "w_init=sqrt(1+2*nu_star)",
    });
    expect(contract.targetInitializerMaterialization.outputFieldOrder).toEqual([
      "F0",
      "F1",
      "varphi",
      "w",
    ]);
    expect(
      contract.targetInitializerMaterialization
        .outputIsOnlyANonAuthoritativeInitialGuess,
    ).toBe(true);
    expect(
      contract.targetInitializerMaterialization
        .relativisticBvpMustResolveFrequencyAgain,
    ).toBe(true);
  });

  it("keeps the supplemental ABI and every implementation or execution instance blocked", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR;
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BLOCKERS,
    ).toHaveLength(5);
    expect(contract.activeBlockers.map((entry) => entry.blockerId)).toEqual([
      "supplemental_join_barrier_payload_unbound",
      "initializer_evaluator_implementation_unbound",
      "initializer_evaluator_runtime_and_preseal_unbound",
      "initializer_grid_instance_unbound",
      "initializer_evaluation_unexecuted",
    ]);
    expect(Object.values(contract.instances)).toEqual(
      Array.from({ length: 13 }, () => null),
    );
    expect(contract.instances.supplementalJoinBarrierTraceReceipt).toBeNull();
    expect(contract.completionBoundary.evaluatorPolicyComplete).toBe(true);
    expect(
      Object.entries(contract.completionBoundary)
        .filter(([key]) => key !== "evaluatorPolicyComplete")
        .every(([, value]) => value === false),
    ).toBe(true);
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_AUTHORITY_LOCKS,
      ).every((value) => value === false),
    ).toBe(true);
  });

  it("fails observed defects without retuning and preserves earlier failure over a later block", () => {
    const failure =
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.failurePolicy;
    expect(failure.firstFailureOrder[0]).toBe(
      "upstream_policy_binding_mismatch",
    );
    expect(failure.firstFailureOrder).toContain(
      "supplemental_join_barrier_payload_unbound_or_invalid",
    );
    expect(failure.missingRequiredInstanceDisposition).toBe(
      "blocked_without_candidate_result",
    );
    expect(failure.observedInvalidOrMismatchedEvidenceDisposition).toBe(
      "fail_this_v2_candidate_without_retry_or_retune",
    );
    expect(failure.earlierObservedFailThenLaterMissingEvidenceDisposition).toBe(
      "fail_this_v2_candidate_without_retry_or_retune",
    );
    expect(failure.laterBlockMayOverwriteEarlierFail).toBe(false);
    expect(failure.retryAllowed).toBe(false);
    expect(failure.retuneAllowed).toBe(false);
    expect(
      failure.alternateCoefficientGraphJoinInferenceOrInitializerAllowed,
    ).toBe(false);
  });

  it("accepts only the exact canonical wire and rejects payload, graph, blocker, instance, and authority drift", () => {
    const wire = cloneNhm2SphericalBosonStarV2InitializerEvaluator();
    expect(wire).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_JSON,
    );
    expect(isNhm2SphericalBosonStarV2InitializerEvaluatorV1(wire)).toBe(true);
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(wire),
    ).toEqual([]);

    const payloadDrift = mutableClone();
    const payloads = at(payloadDrift, "inputAbi").orderedPayloads as
      MutableRecord[] | undefined;
    payloads![5].sizeBytes = 24;
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(
        canonicalJson(payloadDrift),
      ),
    ).toEqual(["spherical_v2_initializer_evaluator_semantic_drift"]);

    const graphDrift = mutableClone();
    at(graphDrift, "coefficientCoreEvaluator").inverseDctUsed = true;
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(
        canonicalJson(graphDrift),
      ),
    ).toEqual(["spherical_v2_initializer_evaluator_semantic_drift"]);

    const blockerDrift = mutableClone();
    const blockers = blockerDrift.activeBlockers as MutableRecord[];
    blockers.shift();
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(
        canonicalJson(blockerDrift),
      ),
    ).toEqual(["spherical_v2_initializer_evaluator_semantic_drift"]);

    const forgedInstance = mutableClone();
    at(forgedInstance, "instances").runtimeManifest = { forged: true };
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(
        canonicalJson(forgedInstance),
      ),
    ).toEqual(["spherical_v2_initializer_evaluator_semantic_drift"]);

    const authorityDrift = mutableClone();
    at(authorityDrift, "authorityLocks").physicalViability = true;
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(
        canonicalJson(authorityDrift),
      ),
    ).toEqual(["spherical_v2_initializer_evaluator_semantic_drift"]);
  });

  it("prebounds canonical wire before parse and never reflects or invokes a hostile caller graph", () => {
    let trapInvoked = false;
    const hostile = new Proxy(mutableClone(), {
      get: () => {
        trapInvoked = true;
        throw new Error("must not execute");
      },
      getOwnPropertyDescriptor: () => {
        trapInvoked = true;
        throw new Error("must not execute");
      },
      ownKeys: () => {
        trapInvoked = true;
        throw new Error("must not execute");
      },
    });
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(hostile),
    ).toEqual([
      "spherical_v2_initializer_evaluator_canonical_wire_string_required",
    ]);
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptViolations(
        hostile,
      ),
    ).toEqual([
      "initializer_evaluator_trace_receipt_canonical_wire_string_required",
    ]);
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorInstanceViolations(hostile),
    ).toEqual([
      "initializer_evaluator_instance_canonical_wire_string_required",
    ]);
    expect(() =>
      computeNhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptRawSha256(
        hostile,
      ),
    ).toThrow(
      "initializer_evaluator_trace_receipt_canonical_wire_string_required",
    );
    expect(() =>
      computeNhm2SphericalBosonStarV2InitializerEvaluatorInstanceBindingSha256(
        hostile,
      ),
    ).toThrow(
      "initializer_evaluator_instance_preimage_canonical_wire_string_required",
    );
    expect(trapInvoked).toBe(false);

    let accessorInvoked = false;
    const accessor = mutableClone();
    Object.defineProperty(accessor, "artifactId", {
      enumerable: true,
      get: () => {
        accessorInvoked = true;
        throw new Error("must not execute");
      },
    });
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(accessor),
    ).toEqual([
      "spherical_v2_initializer_evaluator_canonical_wire_string_required",
    ]);
    expect(accessorInvoked).toBe(false);

    const cycle = mutableClone();
    cycle.artifactId = cycle;
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(cycle),
    ).toEqual([
      "spherical_v2_initializer_evaluator_canonical_wire_string_required",
    ]);

    expect(nhm2SphericalBosonStarV2InitializerEvaluatorViolations("{")).toEqual(
      ["spherical_v2_initializer_evaluator_canonical_wire_parse_invalid"],
    );
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(
        JSON.stringify(mutableClone(), null, 2),
      ),
    ).toEqual([
      "spherical_v2_initializer_evaluator_canonical_wire_noncanonical",
    ]);
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations("-0"),
    ).toEqual([
      "spherical_v2_initializer_evaluator_canonical_wire_invalid_number:/",
    ]);

    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(
        canonicalJson(Array.from({ length: 513 }, () => null)),
      ),
    ).toEqual([
      "spherical_v2_initializer_evaluator_canonical_wire_array_length_limit:/",
    ]);
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(
        "x".repeat(
          NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_VALIDATOR_LIMITS.maximumCanonicalWireCodeUnits +
            1,
        ),
      ),
    ).toEqual([
      "spherical_v2_initializer_evaluator_canonical_wire_code_unit_limit",
    ]);
    const tooDeep = `${"[".repeat(25)}null${"]".repeat(25)}`;
    expect(
      nhm2SphericalBosonStarV2InitializerEvaluatorViolations(tooDeep)[0],
    ).toContain("canonical_wire_depth_limit");

    const source = readFileSync(
      "shared/contracts/nhm2-spherical-boson-star-v2-initializer-evaluator.v1.ts",
      "utf8",
    );
    expect(source).not.toContain("Reflect.ownKeys");
    expect(source).not.toContain("isProxy");
  });

  it("deep-freezes the policy and its nested ABI surfaces", () => {
    expect(
      Object.isFrozen(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR),
    ).toBe(true);
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.inputAbi
          .orderedPayloads,
      ),
    ).toBe(true);
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.tailEvaluator
          .liftGraph,
      ),
    ).toBe(true);
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.authorityLocks,
      ),
    ).toBe(true);
  });
});
