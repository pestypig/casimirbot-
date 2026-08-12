import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
} from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed.v1";
import * as policyModule from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-policy.v1";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_AUTHORITATIVE_SINGLETONS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_LITERAL_SEAL_STATUS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SHA256_DOMAIN,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256_DOMAIN,
  isNhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1,
  nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1Violations,
} from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-policy.v1";

const gcd = (left: bigint, right: bigint): bigint => {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
};

const assertDeepFrozen = (value: unknown, seen = new Set<object>()): void => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return;
  }
  seen.add(value as object);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value as Record<string, unknown>)) {
    assertDeepFrozen(child, seen);
  }
};

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

type DagStage = Readonly<{
  externalInputs: readonly string[];
  nodes: readonly Readonly<{
    ordinal: number;
    id: string;
    inputs: readonly string[];
    outputs: readonly string[];
  }>[];
}>;

const expectTopologicalStage = (stage: DagStage): void => {
  const available = new Set(stage.externalInputs);
  expect(stage.nodes.map((node) => node.ordinal)).toEqual(
    stage.nodes.map((_, index) => index),
  );
  expect(new Set(stage.nodes.map((node) => node.id)).size).toBe(
    stage.nodes.length,
  );
  for (const node of stage.nodes) {
    for (const input of node.inputs) expect(available.has(input)).toBe(true);
    for (const output of node.outputs) {
      expect(available.has(output)).toBe(false);
      available.add(output);
    }
  }
};

const measureSnapshotSurface = (
  value: unknown,
  depth = 0,
  result = {
    nodes: 0,
    keys: 0,
    stringCodeUnits: 0,
    maximumDepth: 0,
    maximumSingleStringCodeUnits: 0,
  },
) => {
  result.nodes += 1;
  result.maximumDepth = Math.max(result.maximumDepth, depth);
  if (typeof value === "string") {
    result.stringCodeUnits += value.length;
    result.maximumSingleStringCodeUnits = Math.max(
      result.maximumSingleStringCodeUnits,
      value.length,
    );
    return result;
  }
  if (value == null || typeof value !== "object") return result;
  const keys = Reflect.ownKeys(value).map(String);
  result.keys += keys.length;
  for (const key of keys) {
    result.stringCodeUnits += key.length;
    result.maximumSingleStringCodeUnits = Math.max(
      result.maximumSingleStringCodeUnits,
      key.length,
    );
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of keys) {
    if (Array.isArray(value) && key === "length") continue;
    const descriptor = descriptors[key];
    if (descriptor && "value" in descriptor) {
      measureSnapshotSurface(descriptor.value, depth + 1, result);
    }
  }
  return result;
};

describe("newtonian seed numeric materialization policy v1", () => {
  it("identity-binds the exact sealed seed, proof protocol, and descriptor singletons", () => {
    const policy =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1;
    const anchors =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_AUTHORITATIVE_SINGLETONS;

    expect(anchors.seedV1).toBe(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1);
    expect(anchors.proofReplayProtocolV1).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL,
    );
    expect(anchors.outputDescriptorSchemaV1).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA,
    );
    expect(anchors.derivedHashRegistryV1).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY,
    );
    expect(anchors.amplitudeScheduleV1).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE,
    );
    expect(anchors.gridLevelsV1).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
    );
    expect(anchors.outputRolesV1).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES,
    );
    expect(anchors.outputArrayInventoryV1).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
    );
    expect(policy.bindings.seedV1.binding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
    );
    expect(policy.bindings.proofReplayProtocolV1.binding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
    );
    expect(policy.bindings.outputDescriptorSchemaV1.binding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
    );
    expect(policy.bindings.seedV1.binding.sha256).toBe(
      "e839a670e57fad1a445d61d88d2ebc49796af33f78fb752103bded74bbd121ea",
    );
    expect(policy.bindings.proofReplayProtocolV1.binding.sha256).toBe(
      "c6a97e35d9838ff8c5a49f75b4bdc7b5b3adc59df8d32a3d17bd96ef14ecd29b",
    );
    expect(policy.bindings.outputDescriptorSchemaV1.binding.sha256).toBe(
      "deb52c3d2d80f63a4b98dfb8e6ec9180a0d5063e27d2310d59ec0cddf294ab58",
    );
    expect(
      policy.bindings.seedV1DerivedHashPreimages.tailCoefficientInventorySha256,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY.entries.find(
        (entry) => entry.receiptField === "tailCoefficientInventorySha256",
      ),
    );
    expect(
      policy.bindings.seedV1DerivedHashPreimages.representativeContinuumSha256,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY.entries.find(
        (entry) => entry.receiptField === "representativeContinuumSha256",
      ),
    );
    expect(policy.bindings.seedV1DerivedHashPreimages.coverTraceSha256).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY.entries.find(
        (entry) => entry.receiptField === "coverTraceSha256",
      ),
    );
    expect(policy.bindings.seedV1InventorySingletons).toMatchObject({
      sourceSeedBinding: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
      outputArrayCount: 32,
      targetArrayOrder:
        "amplitude_stage_outer_then_radial_index_then_angular_index_in_C_order",
    });
  });

  it("formally closes the arrays-only three-stage DAG and every derived-hash preimage", () => {
    const policy =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1;
    const dag = policy.selectionDAG;
    expect(dag.exactStageOrder).toEqual([
      "untrusted_seed_producer",
      "trusted_independent_verifier",
      "trusted_descriptor_assembler",
    ]);
    expectTopologicalStage(dag.producerCandidateDAG);
    expectTopologicalStage(dag.verifierAdmissibilityDAG);
    expectTopologicalStage(dag.descriptorAssemblerDAG);
    expect(dag.temporalCycleAllowed).toBe(false);
    expect(dag.producerCandidateDAG.terminalAuthority).toBe(false);
    expect(
      dag.verifierAdmissibilityDAG.trustsProducerRepresentativeSelection,
    ).toBe(false);
    expect(dag.verifierAdmissibilityDAG.soleScientificAdmissionStage).toBe(
      false,
    );
    expect(
      dag.verifierAdmissibilityDAG
        .numericMatchHasSeedOrArtifactAdmissionAuthority,
    ).toBe(false);
    expect(dag.descriptorAssemblerDAG.mayRecomputeOrOverrideScience).toBe(
      false,
    );
    expect(dag.descriptorAssemblerDAG.policyAloneMayAuthorizeAssembly).toBe(
      false,
    );
    expect(
      dag.verifierAdmissibilityDAG.nodes
        .slice(2, 10)
        .flatMap((node) => [...node.inputs, ...node.outputs])
        .some((name) => /^producer(C|P|Tail|A0|Representative)/.test(name)),
    ).toBe(false);
    expect(dag.producerCandidateDAG.nodes.at(-1)).toEqual({
      ordinal: 9,
      id: "stage_exactly_32_arrays",
      inputs: ["producer32OrderedF64leArrays"],
      outputs: ["producer32ArrayStagingBundle"],
    });
    expect(dag.producerCandidateDAG.outputChannel).toEqual({
      exactArrayCount: 32,
      exactPayload: "producer32ArrayStagingBundle",
      exactPayloadMembers:
        "the_32_raw_f64le_arrays_in_imported_inventory_order_only",
      representativeTupleIncluded: false,
      representativeMetadataIncluded: false,
      selectorOrDerivedHashMetadataIncluded: false,
      producerSelectorsAndDerivedHashesRemainInternalProvisionalOnly: true,
    });
    expect(
      dag.verifierAdmissibilityDAG.nodes.find(
        (node) => node.id === "observe_candidate_without_trust",
      )?.outputs,
    ).toEqual(["observedProducer32ArrayBytes"]);
    expect(
      dag.verifierAdmissibilityDAG.nodes.find(
        (node) =>
          node.id === "freeze_observed_producer_32_array_staging_identity",
      ),
    ).toEqual({
      ordinal: 1,
      id: "freeze_observed_producer_32_array_staging_identity",
      inputs: [
        "observedProducer32ArrayBytes",
        "boundSeedV1Inputs",
        "boundNumericMaterializationPolicyBinding",
        "boundNumericMaterializationOperationGraphIdentity",
        "seedV1GridAndArrayInventory",
      ],
      outputs: [
        "observedProducer32ArrayStagingManifest",
        "observedProducer32ArrayStagingBinding",
      ],
    });
    const passThroughValidationNode = dag.verifierAdmissibilityDAG.nodes.find(
      (node) =>
        node.id === "fail_closed_validate_six_multipole_pass_through_inputs",
    );
    expect(passThroughValidationNode).toEqual({
      ordinal: 2,
      id: "fail_closed_validate_six_multipole_pass_through_inputs",
      inputs: [
        "observedProducer32ArrayBytes",
        "observedProducer32ArrayStagingManifest",
        "observedProducer32ArrayStagingBinding",
        "boundSeedV1Inputs",
        "boundNumericMaterializationPolicyBinding",
        "boundNumericMaterializationOperationGraphIdentity",
        "seedV1GridAndArrayInventory",
      ],
      outputs: [
        "validatedProducerOwnLevelMultipoleBytes",
        "validatedProducerL2ScalarMultipoleBytes",
        "validatedProducerL2PotentialMultipoleBytes",
        "verifierMultipolePassThroughValidationReceipt",
        "verifierMultipolePassThroughValidationReceiptBinding",
      ],
    });
    const validationOrdinal = passThroughValidationNode?.ordinal ?? -1;
    for (const node of dag.verifierAdmissibilityDAG.nodes) {
      if (node.inputs.some((input) => input.startsWith("validatedProducer"))) {
        expect(node.ordinal).toBeGreaterThan(validationOrdinal);
      }
      for (const forbiddenUnvalidatedInput of [
        "observedProducerOwnLevelMultipoleBytes",
        "observedProducerL2ScalarMultipoleBytes",
        "observedProducerL2PotentialMultipoleBytes",
      ]) {
        expect(node.inputs).not.toContain(forbiddenUnvalidatedInput);
      }
    }
    expect(
      dag.verifierAdmissibilityDAG.multipolePassThroughInputValidation,
    ).toEqual({
      nodeId: "fail_closed_validate_six_multipole_pass_through_inputs",
      occursBeforeAnyMultipolePassThroughOrScientificEvaluation: true,
      exactExpectedEntries:
        policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_MULTIPOLE_PASS_THROUGH_EXPECTATIONS,
      exactChecksInOrder: [
        "staging_bundle_contains_exactly_32_arrays_in_the_imported_inventory_order",
        "each_of_the_six_L0_L1_L2_multipole_entries_has_the_exact_inventory_index_level_role_relative_path_shape_dtype_order_and_byte_length",
        "each_raw_array_byte_length_equals_the_bound_inventory_byte_length_before_decoding",
        "every_decoded_binary64_value_is_finite",
        "no_decoded_binary64_value_is_negative_zero",
        "every_seed_v1_symbolic_multipole_mask_entry_is_exact_positive_zero_and_every_required_mask_position_is_present",
        "no_unvalidated_multipole_byte_is_exposed_to_a_selector_reconstruction_or_bit_pass_through",
      ],
      expectedEntryCount: 6,
      failureDisposition: "fail_closed_before_any_pass_through_or_evaluation",
      validationReceiptAuthority: false,
    });
    expect(
      dag.verifierAdmissibilityDAG.multipolePassThroughInputValidation
        .exactExpectedEntries,
    ).toBe(
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_MULTIPOLE_PASS_THROUGH_EXPECTATIONS,
    );
    expect(
      dag.verifierAdmissibilityDAG.multipolePassThroughInputValidation.exactExpectedEntries.map(
        (entry) => entry.inventoryIndex,
      ),
    ).toEqual([6, 7, 14, 15, 22, 23]);
    for (const expectation of dag.verifierAdmissibilityDAG
      .multipolePassThroughInputValidation.exactExpectedEntries) {
      const inventory =
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY[
          expectation.inventoryIndex
        ];
      expect(expectation).toEqual({
        inventoryIndex: inventory.inventoryIndex,
        levelId: inventory.levelId,
        role: inventory.role,
        relativePath: inventory.relativePath,
        shape: inventory.shape,
        byteLength: inventory.byteLength,
        dtype: inventory.dtype,
        order: inventory.order,
      });
    }
    const exteriorHNode = dag.verifierAdmissibilityDAG.nodes.find(
      (node) => node.id === "close_exterior_H_lower_bound_evidence",
    );
    expect(exteriorHNode).toEqual({
      ordinal: 10,
      id: "close_exterior_H_lower_bound_evidence",
      inputs: [
        "boundSeedV1Inputs",
        "boundProofReplayProtocolInput",
        "boundNumericMaterializationPolicyBinding",
        "boundNumericMaterializationOperationGraphIdentity",
        "independentProofKernelToolchainBinding",
        "verifierSourceL2ScalarSha256",
        "verifierRepresentativeContinuumSha256",
        "verifierScalarBoundaryLiftSha256",
        "verifierTailCoefficientInventorySha256",
        "verifierAInfinityOverCosThetaGlobalIntervalBits",
        "verifierScalarWeightedRemainderRatioUpperBits",
        "verifierTailRadiiYBits",
        "verifierTailRadiiZBits",
        "verifierTailRadiusBits",
        "verifierTailContractionUpperBits",
        "verifierStrictExteriorHLowerBoundBits",
        "verifierJoinValueDefectUpperBits",
        "verifierJoinDerivativeDefectUpperBits",
      ],
      outputs: [
        "verifierExteriorHLowerBoundEvidence",
        "verifierExteriorHLowerBoundEvidenceBinding",
      ],
    });
    const compactCoverNode = dag.verifierAdmissibilityDAG.nodes.find(
      (node) =>
        node.id === "independently_replay_compact_regular_quotient_g_cover",
    );
    expect(compactCoverNode).toEqual({
      ordinal: 11,
      id: "independently_replay_compact_regular_quotient_g_cover",
      inputs: [
        "boundSeedV1Inputs",
        "boundProofReplayProtocolInput",
        "boundNumericMaterializationPolicyBinding",
        "boundNumericMaterializationOperationGraphIdentity",
        "boundSeedV1DerivedHashRegistryPreimages",
        "observedProducer32ArrayStagingBinding",
        "verifierMultipolePassThroughValidationReceiptBinding",
        "validatedProducerL2ScalarMultipoleBytes",
        "verifierSourceL2ScalarSha256",
        "verifierRepresentativeContinuumSha256",
        "verifierBoundaryLiftValues",
        "verifierScalarBoundaryLiftSha256",
        "verifierTailScalarCoefficientBits",
        "verifierScalarTailCoefficientIntervals",
        "verifierTailCoefficientInventorySha256",
        "verifierExteriorHLowerBoundEvidence",
        "verifierExteriorHLowerBoundEvidenceBinding",
        "independentProofKernelToolchainBinding",
      ],
      outputs: [
        "verifierCompactRegularQuotientGCoverRecords",
        "verifierAcceptedCompactBoxCount",
        "verifierCoverRecordCount",
        "verifierMaximumDepthUsed",
        "verifierMinimumCompactRegularQuotientGLowerBoundBits",
        "verifierCoverTraceSha256",
        "verifierCompactRegularQuotientGProofPassedTrue",
      ],
    });
    const nodelessCoreNode = dag.verifierAdmissibilityDAG.nodes.find(
      (node) => node.id === "independently_prove_continuous_nodeless_core",
    );
    expect(nodelessCoreNode).toEqual({
      ordinal: 12,
      id: "independently_prove_continuous_nodeless_core",
      inputs: [
        "boundSeedV1Inputs",
        "boundProofReplayProtocolInput",
        "boundNumericMaterializationPolicyBinding",
        "boundNumericMaterializationOperationGraphIdentity",
        "observedProducer32ArrayStagingBinding",
        "verifierMultipolePassThroughValidationReceiptBinding",
        "validatedProducerL2ScalarMultipoleBytes",
        "verifierSourceL2ScalarSha256",
        "verifierSourceL2PotentialSha256",
        "verifierRepresentativeContinuumSha256",
        "verifierBoundaryLiftValues",
        "verifierScalarBoundaryLiftSha256",
        "verifierPotentialBoundaryLiftSha256",
        "verifierTailScalarCoefficientBits",
        "verifierTailPotentialCoefficientBits",
        "verifierScalarTailCoefficientIntervals",
        "verifierPotentialTailCoefficientIntervals",
        "verifierTailCoefficientInventorySha256",
        "independentProofKernelToolchainBinding",
        "verifierCompactRegularQuotientGCoverRecords",
        "verifierAcceptedCompactBoxCount",
        "verifierCoverRecordCount",
        "verifierMaximumDepthUsed",
        "verifierMinimumCompactRegularQuotientGLowerBoundBits",
        "verifierCoverTraceSha256",
        "verifierCompactRegularQuotientGProofPassedTrue",
        "verifierExteriorHLowerBoundEvidence",
        "verifierExteriorHLowerBoundEvidenceBinding",
      ],
      outputs: [
        "verifierContinuousNodelessProofCoreResult",
        "verifierContinuousNodelessProofCoreResultBinding",
        "verifierContinuousNodelessProofCorePassedTrue",
      ],
    });
    const peakNode = dag.verifierAdmissibilityDAG.nodes.find(
      (node) => node.id === "independently_prove_peak_and_select_A0",
    );
    expect(peakNode?.inputs).toEqual([
      "boundSeedV1Inputs",
      "boundProofReplayProtocolInput",
      "boundNumericMaterializationPolicyBinding",
      "boundNumericMaterializationOperationGraphIdentity",
      "validatedProducerL2ScalarMultipoleBytes",
      "validatedProducerL2PotentialMultipoleBytes",
      "verifierSourceL2ScalarSha256",
      "verifierSourceL2PotentialSha256",
      "verifierCRepresentativeBits",
      "verifierPRepresentativeBits",
      "verifierBoundaryLiftValues",
      "verifierScalarBoundaryLiftSha256",
      "verifierPotentialBoundaryLiftSha256",
      "verifierTailScalarCoefficientBits",
      "verifierTailPotentialCoefficientBits",
      "verifierScalarTailCoefficientIntervals",
      "verifierPotentialTailCoefficientIntervals",
      "verifierTailCoefficientInventorySha256",
      "verifierExteriorHLowerBoundEvidence",
      "verifierExteriorHLowerBoundEvidenceBinding",
      "verifierRepresentativeContinuumSha256",
      "verifierContinuousNodelessProofCoreResult",
      "verifierContinuousNodelessProofCoreResultBinding",
      "verifierContinuousNodelessProofCorePassedTrue",
      "independentProofKernelToolchainBinding",
    ]);
    expect(nodelessCoreNode?.ordinal).toBeLessThan(peakNode?.ordinal ?? -1);
    expect(dag.verifierAdmissibilityDAG.continuousNodelessProofCore).toEqual({
      nodeId: "independently_prove_continuous_nodeless_core",
      requiredBeforePeakNodeId: "independently_prove_peak_and_select_A0",
      requiredResultSchema: "continuousNodelessProofCoreResultSchema",
      requiredResultBinding:
        "continuousNodelessProofCoreResultSchema.bindingRecipe",
      requiredPassedValue: true,
      requiredFinalReceiptClosedValue: false,
      compactField:
        "g(rho,theta)=u(x,theta)/(x*cos(theta))_with_regular_endpoint_limits",
      rawScalarUIsTheCertifiedCompactLowerBoundSubject: false,
      exteriorEvidenceSchema: "exteriorHLowerBoundEvidenceSchema",
      excludesDownstreamInputs: [
        "verifierExpected32OrderedF64leArrays",
        "numericMaterializationMatchOrRejection",
        "verifierNumericMaterializationReplayBundle",
        "AUDIT_array_trace",
        "finalContinuousNodelessIntervalProofReceipt",
      ],
      finalReceiptDuty:
        "external_full_seed_v1_admission_must_later_supply_the_fully_closed_continuous_nodeless_interval_proof_receipt_after_array_replay_without_replacing_or_retroactively_authorizing_this_core",
      coreMayAdmitSeedOrArtifact: false,
    });
    for (const excluded of dag.verifierAdmissibilityDAG
      .continuousNodelessProofCore.excludesDownstreamInputs) {
      expect(nodelessCoreNode?.inputs).not.toContain(excluded);
    }
    expect(
      dag.verifierAdmissibilityDAG.nodes.find(
        (node) => node.id === "independently_materialize_32_arrays",
      )?.inputs,
    ).toEqual([
      "boundSeedV1Inputs",
      "boundNumericMaterializationPolicyBinding",
      "boundNumericMaterializationOperationGraphIdentity",
      "validatedProducerOwnLevelMultipoleBytes",
      "verifierMultipolePassThroughValidationReceipt",
      "verifierMultipolePassThroughValidationReceiptBinding",
      "verifierSourceL2ScalarSha256",
      "verifierSourceL2PotentialSha256",
      "verifierCRepresentativeBits",
      "verifierPRepresentativeBits",
      "verifierBoundaryLiftValues",
      "verifierTailScalarCoefficientBits",
      "verifierTailPotentialCoefficientBits",
      "verifierTailCoefficientInventorySha256",
      "verifierA0Bits",
      "verifierRepresentativeContinuumSha256",
      "verifierRepresentativeTuple",
      "verifierRepresentativeTupleSha256",
      "seedV1GridAndArrayInventory",
    ]);
    expect(
      dag.verifierAdmissibilityDAG.nodes.find(
        (node) => node.id === "compare_candidate_and_close_receipts",
      ),
    ).toEqual({
      ordinal: 17,
      id: "compare_candidate_and_close_receipts",
      inputs: [
        "observedProducer32ArrayBytes",
        "observedProducer32ArrayStagingBinding",
        "verifierExpected32OrderedF64leArrays",
        "verifierMultipolePassThroughValidationReceipt",
        "verifierMultipolePassThroughValidationReceiptBinding",
        "boundNumericMaterializationPolicyBinding",
        "boundNumericMaterializationOperationGraphIdentity",
        "verifierRepresentativeTuple",
        "verifierRepresentativeTupleSha256",
        "verifierA0Bits",
        "verifierSourceL2ScalarSha256",
        "verifierSourceL2PotentialSha256",
        "verifierCRepresentativeBits",
        "verifierPRepresentativeBits",
        "verifierBoundaryLiftValues",
        "verifierScalarBoundaryLiftSha256",
        "verifierPotentialBoundaryLiftSha256",
        "verifierTailCoefficientInventorySha256",
        "verifierRepresentativeContinuumSha256",
        "verifierCoulombProofTrace",
        "verifierPeakProofTrace",
        "verifierExteriorHLowerBoundEvidence",
        "verifierExteriorHLowerBoundEvidenceBinding",
        "verifierContinuousNodelessProofCoreResult",
        "verifierContinuousNodelessProofCoreResultBinding",
        "verifierContinuousNodelessProofCorePassedTrue",
      ],
      outputs: [
        "numericMaterializationMatchOrRejection",
        "numericMaterializationMatchBindingOrNull",
      ],
    });
    expect(
      dag.verifierAdmissibilityDAG.verifierRepresentativeTupleSha256Recipe,
    ).toEqual({
      algorithm: "SHA-256",
      domain:
        policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VERIFIER_REPRESENTATIVE_TUPLE_SHA256_DOMAIN,
      domainEndsWithExactlyOneLf: true,
      canonicalTupleSerialization:
        "UTF8_of_no_whitespace_canonical_JSON_with_recursively_lexicographically_sorted_object_keys_arrays_in_schema_order_finite_integers_in_canonical_decimal_and_strings_byte_exact",
      tupleSchema:
        "nhm2.prolate_boson_star_newtonian_seed.numeric_representative_tuple/v1",
      orderedPreimage: [
        "domain_UTF8_bytes_including_the_single_terminal_LF",
        "u64be_canonical_tuple_UTF8_byte_length",
        "canonical_tuple_UTF8_bytes",
      ],
      hashExpression:
        "sha256(domainUtf8 || u64be(canonicalTupleUtf8ByteLength) || canonicalTupleUtf8Bytes)",
      anyOtherPreimageComponentAllowed: false,
    });
    const domains = [
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VERIFIER_REPRESENTATIVE_TUPLE_SHA256_DOMAIN,
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_PRODUCER_32_ARRAY_STAGING_SHA256_DOMAIN,
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_MULTIPOLE_VALIDATION_RECEIPT_SHA256_DOMAIN,
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_EXTERIOR_H_EVIDENCE_SHA256_DOMAIN,
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_NODELESS_PROOF_CORE_SHA256_DOMAIN,
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_NUMERIC_MATCH_SHA256_DOMAIN,
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VERIFIER_REPLAY_BUNDLE_SHA256_DOMAIN,
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SHA256_DOMAIN,
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_SHA256_DOMAIN,
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_SHA256_DOMAIN,
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_SHA256_DOMAIN,
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_SHA256_DOMAIN,
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256_DOMAIN,
    ];
    for (const domain of domains) {
      expect(domain.endsWith("\n")).toBe(true);
      expect(domain.slice(0, -1)).not.toContain("\n");
    }
    expect(new Set(domains).size).toBe(domains.length);
    expect(
      dag.verifierAdmissibilityDAG.nodes.find(
        (node) => node.id === "hash_canonical_representative_tuple",
      ),
    ).toEqual({
      ordinal: 15,
      id: "hash_canonical_representative_tuple",
      inputs: [
        "boundNumericMaterializationPolicyBinding",
        "verifierRepresentativeTuple",
        "verifierRepresentativeTupleCanonicalJsonUtf8",
      ],
      outputs: ["verifierRepresentativeTupleSha256"],
    });
    expect(dag.verifierAdmissibilityDAG.tuplePublication).toEqual({
      producerPublishesTuple: false,
      verifierPublishesTupleOnlyAfterByteComparison: true,
      verifierPublishesReplayOnlyAfterPositiveMatchGuard: true,
      rejectionPublishesReplayBundleOrBinding: false,
      onlyTupleBearingChannel: "verifierNumericMaterializationReplayBundle",
    });
    expect(
      dag.verifierAdmissibilityDAG.nodes.find(
        (node) =>
          node.id === "gate_replay_on_positive_numeric_materialization_match",
      ),
    ).toEqual({
      ordinal: 18,
      id: "gate_replay_on_positive_numeric_materialization_match",
      inputs: [
        "numericMaterializationMatchOrRejection",
        "numericMaterializationMatchBindingOrNull",
      ],
      outputs: [
        "validatedPositiveNumericMaterializationMatch",
        "validatedPositiveNumericMaterializationMatchBinding",
      ],
      guard: {
        dispositionMustEqual: "match",
        passedMustEqual: true,
        bindingMustBeNonNullAndRecompute: true,
        onRejectionOrInvalidBinding:
          "emit_no_validated_positive_match_no_replay_bundle_and_no_replay_binding_then_fail_closed",
      },
    });
    expect(
      dag.verifierAdmissibilityDAG.nodes.find(
        (node) => node.id === "publish_verifier_replay_bundle",
      ),
    ).toEqual({
      ordinal: 19,
      id: "publish_verifier_replay_bundle",
      inputs: [
        "validatedPositiveNumericMaterializationMatch",
        "validatedPositiveNumericMaterializationMatchBinding",
        "verifierRepresentativeTuple",
        "verifierRepresentativeTupleSha256",
        "verifierRepresentativeContinuumSha256",
        "boundNumericMaterializationPolicyBinding",
        "boundNumericMaterializationOperationGraphIdentity",
        "observedProducer32ArrayStagingBinding",
        "verifierMultipolePassThroughValidationReceiptBinding",
        "verifierContinuousNodelessProofCoreResultBinding",
        "verifierExteriorHLowerBoundEvidenceBinding",
      ],
      outputs: [
        "verifierNumericMaterializationReplayBundle",
        "verifierNumericMaterializationReplayBundleBinding",
      ],
    });
    expect(dag.externalFullSeedV1AdmissionRequirements).toEqual([
      "complete_seed_v1_gate_report",
      "continuous_nodeless_interval_proof_receipt",
      "numerical_origin_series_defect_gate_receipt",
      "continuous_unique_peak_interval_proof_receipt",
      "separately_bound_nodal_to_postprojection_parity_Legendre_operation_graph_and_input_acceptance_receipt",
    ]);
    expect(dag.crossStageBindings).toEqual([
      "producer32ArrayStagingBundle_is_immutably_observed_as_immutableProducer32ArrayStagingObservation",
      "producer_to_verifier_channel_contains_exactly_32_ordered_f64le_arrays_and_no_tuple_or_metadata",
      "verifierNumericMaterializationReplayBundle_is_the_only_tuple_bearing_channel",
      "numeric_materialization_rejection_emits_no_verifier_replay_bundle_or_binding_and_only_a_guarded_positive_match_can_reach_replay_publication",
      "descriptor_assembly_extracts_the_positive_numericMaterializationMatch_tuple_tuple_hash_and_continuum_only_from_the_bound_verifierNumericMaterializationReplayBundle_and_also_requires_externalFullSeedV1Admission",
      "descriptor_assembly_requires_replay_validation_nodeless_core_policy_operation_graph_staging_and_full_admission_identities_to_name_one_exact_candidate",
    ]);
    expect(dag.descriptorAssemblerDAG.externalInputs).toEqual([
      "verifierNumericMaterializationReplayBundle",
      "verifierNumericMaterializationReplayBundleBinding",
      "observedProducer32ArrayStagingBinding",
      "boundNumericMaterializationPolicyBinding",
      "boundNumericMaterializationOperationGraphIdentity",
      "externalFullSeedV1Admission",
      "immutableProducer32ArrayStagingObservation",
      "boundOutputDescriptorSchemaV1",
    ]);
    expect(dag.descriptorAssemblerDAG.nodes[0].inputs).toEqual(
      dag.descriptorAssemblerDAG.externalInputs,
    );
    expect(
      dag.descriptorAssemblerDAG.sameCandidateIdentityRequirements,
    ).toEqual([
      "verifierNumericMaterializationReplayBundleBinding_recomputes_from_the_exact_replay_bundle_under_its_unique_LF_domain_and_closed_schema",
      "the_assembler_resolves_representativeTuple_representativeTupleSha256_representativeContinuumSha256_and_numericMaterializationMatch_only_from_verifierNumericMaterializationReplayBundle_and_accepts_no_separate_tuple_tuple_hash_continuum_or_match_input",
      "the_replay_bundle_numericMaterializationMatch_is_the_positive_match_variant_with_passed_true_and_its_binding_recomputes_under_the_numeric_match_unique_LF_domain_after_the_explicit_guard_while_every_rejection_emits_no_replay_bundle_or_binding",
      "the_replay_bundle_stagingBinding_equals_observedProducer32ArrayStagingBinding_which_recomputes_from_the_exact_immutableProducer32ArrayStagingObservation_32_entry_manifest",
      "the_replay_bundle_representativeTupleSha256_recomputes_from_its_embedded_representativeTuple_under_the_frozen_tuple_LF_domain_and_ordered_preimage_recipe",
      "the_replay_bundle_representativeTuple_representativeContinuum_source_L2_exterior_H_evidence_and_cover_trace_identities_equal_the_corresponding_numeric_match_validation_nodeless_core_and_staging_identities",
      "the_replay_bundle_policyBinding_and_operationGraphBinding_equal_the_bound_policy_and_operation_graph_inputs",
      "externalFullSeedV1Admission_candidate_identity_equals_the_same_stagingBinding_and_its_complete_gate_report_final_closed_nodeless_origin_peak_and_nodal_to_postprojection_receipts_bind_the_same_source_L2_representative_continuum_policy_and_operation_graph_identities",
      "any_identity_absence_mismatch_duplicate_or_cross_candidate_mix_fails_closed_before_descriptor_assembly",
    ]);
    expect(dag.descriptorAssemblerDAG.tupleResolution).toEqual({
      soleTupleBearingInput: "verifierNumericMaterializationReplayBundle",
      separateTupleInputAllowed: false,
      separateTupleSha256InputAllowed: false,
      separateContinuumSha256InputAllowed: false,
      separateNumericMatchInputAllowed: false,
    });
    for (const forbiddenStandaloneInput of [
      "numericMaterializationMatchOrRejection",
      "verifierRepresentativeTuple",
      "verifierRepresentativeTupleSha256",
      "verifierRepresentativeContinuumSha256",
    ]) {
      expect(dag.descriptorAssemblerDAG.externalInputs).not.toContain(
        forbiddenStandaloneInput,
      );
      expect(dag.descriptorAssemblerDAG.nodes[0].inputs).not.toContain(
        forbiddenStandaloneInput,
      );
    }

    const registryByReceipt = new Map<
      string,
      (typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY.entries)[number]
    >(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY.entries.map(
        (entry) => [entry.receiptField, entry],
      ),
    );
    const exactClosurePayloadFields = (prefix: "producer" | "verifier") => {
      const scalarIntervals =
        prefix === "producer"
          ? "producerTailScalarCoefficientIntervals"
          : "verifierScalarTailCoefficientIntervals";
      const potentialIntervals =
        prefix === "producer"
          ? "producerTailPotentialCoefficientIntervals"
          : "verifierPotentialTailCoefficientIntervals";
      return {
        ...(prefix === "verifier"
          ? {
              verifierCoverTraceSha256: [
                ["protocolBinding", "boundProofReplayProtocolInput"],
                ["sourceL2ScalarSha256", "verifierSourceL2ScalarSha256"],
                ["coverRecords", "verifierCompactRegularQuotientGCoverRecords"],
              ],
            }
          : {}),
        [`${prefix}TailCoefficientInventorySha256`]: [
          ["protocolBinding", "boundProofReplayProtocolInput"],
          [
            "tailScalarRepresentativeCoefficients",
            `${prefix}TailScalarCoefficientBits`,
          ],
          [
            "tailPotentialRepresentativeCoefficients",
            `${prefix}TailPotentialCoefficientBits`,
          ],
          ["tailScalarContinuationCoefficientIntervals", scalarIntervals],
          ["tailPotentialContinuationCoefficientIntervals", potentialIntervals],
        ],
        [`${prefix}ScalarBoundaryLiftSha256`]: [
          ["protocolBinding", "boundProofReplayProtocolInput"],
          ["sourceL2ScalarSha256", `${prefix}SourceL2ScalarSha256`],
          ["CRepresentative", `${prefix}CRepresentativeBits`],
          ["pRepresentative", `${prefix}PRepresentativeBits`],
          ["formulaId", "H_boundary_lift/v1"],
          [
            "liftDerivationRecords",
            `${prefix}ScalarBoundaryLiftDerivationRecords`,
          ],
        ],
        [`${prefix}PotentialBoundaryLiftSha256`]: [
          ["protocolBinding", "boundProofReplayProtocolInput"],
          ["sourceL2PotentialSha256", `${prefix}SourceL2PotentialSha256`],
          ["CRepresentative", `${prefix}CRepresentativeBits`],
          ["pRepresentative", `${prefix}PRepresentativeBits`],
          ["formulaId", "Q_boundary_lift/v1"],
          [
            "liftDerivationRecords",
            `${prefix}PotentialBoundaryLiftDerivationRecords`,
          ],
        ],
        [`${prefix}RepresentativeContinuumSha256`]: [
          ["protocolBinding", "boundProofReplayProtocolInput"],
          ["sourceL2ScalarSha256", `${prefix}SourceL2ScalarSha256`],
          ["sourceL2PotentialSha256", `${prefix}SourceL2PotentialSha256`],
          ["CRepresentative", `${prefix}CRepresentativeBits`],
          ["pRepresentative", `${prefix}PRepresentativeBits`],
          ["scalarBoundaryLiftSha256", `${prefix}ScalarBoundaryLiftSha256`],
          [
            "potentialBoundaryLiftSha256",
            `${prefix}PotentialBoundaryLiftSha256`,
          ],
          [
            "tailCoefficientInventorySha256",
            `${prefix}TailCoefficientInventorySha256`,
          ],
          ["formulaId", "piecewise_L2_HQ_lifted_tail/v1"],
        ],
      } as const;
    };
    for (const [stage, prefix] of [
      [dag.producerCandidateDAG, "producer"],
      [dag.verifierAdmissibilityDAG, "verifier"],
    ] as const) {
      const typedStage: DagStage = stage;
      const closures = stage.derivedHashPreimageClosures as Readonly<
        Record<
          string,
          Readonly<{
            registryReceiptField: string;
            recipeBindingInput: string;
            orderedPayloadFields: readonly (readonly [string, string])[];
          }>
        >
      >;
      expect(Object.keys(closures)).toEqual([
        ...(prefix === "verifier" ? ["verifierCoverTraceSha256"] : []),
        `${prefix}TailCoefficientInventorySha256`,
        `${prefix}ScalarBoundaryLiftSha256`,
        `${prefix}PotentialBoundaryLiftSha256`,
        `${prefix}RepresentativeContinuumSha256`,
      ]);
      const exactPayloads = exactClosurePayloadFields(prefix);
      const exactReceiptFields: Readonly<Record<string, string>> = {
        ...(prefix === "verifier"
          ? { verifierCoverTraceSha256: "coverTraceSha256" }
          : {}),
        [`${prefix}TailCoefficientInventorySha256`]:
          "tailCoefficientInventorySha256",
        [`${prefix}ScalarBoundaryLiftSha256`]: "scalarBoundaryLiftSha256",
        [`${prefix}PotentialBoundaryLiftSha256`]: "potentialBoundaryLiftSha256",
        [`${prefix}RepresentativeContinuumSha256`]:
          "representativeContinuumSha256",
      };
      for (const [output, closure] of Object.entries(closures)) {
        expect(closure.registryReceiptField, output).toBe(
          exactReceiptFields[output],
        );
        expect(closure.orderedPayloadFields, output).toEqual(
          exactPayloads[output as keyof typeof exactPayloads],
        );
        const registryEntry = registryByReceipt.get(
          closure.registryReceiptField,
        );
        expect(registryEntry, output).toBeDefined();
        expect(
          closure.orderedPayloadFields.map(([field]) => field),
          output,
        ).toEqual(registryEntry?.orderedFields.map(([field]) => field));
        expect(closure.recipeBindingInput, output).toBe(
          "boundSeedV1DerivedHashRegistryPreimages",
        );
        const node = typedStage.nodes.find((candidate) =>
          candidate.outputs.includes(output),
        );
        expect(node, output).toBeDefined();
        const availableAtNode = new Set([
          ...(node?.inputs ?? []),
          ...(node?.outputs ?? []),
        ]);
        for (const [, source] of closure.orderedPayloadFields) {
          if (source.endsWith("/v1")) continue;
          expect(availableAtNode.has(source), `${output}:${source}`).toBe(true);
        }
      }
    }
    expect(policy.chronology.auditInteriorTailReceiptIsSelectorInput).toBe(
      false,
    );
    expect(policy.chronology.auditTraceCardinality).toBe(524288);
    expect(policy.chronology.producerSelectionStatus).toBe(
      "provisional_unserialized_no_authority",
    );
    expect(
      policy.chronology.verifierMustRecomputeSelectionFromBoundInputs,
    ).toBe(true);
    expect(policy.chronology.producerCandidateDAGMayAdmitScience).toBe(false);
    expect(
      policy.chronology.verifierAdmissibilityDAGIsOnlyScientificAdmissionDAG,
    ).toBe(false);
    expect(policy.chronology.fullSeedV1AdmissionMustBeExternal).toBe(true);
    expect(policy.chronology.laterTrustedMaterializerRequired).toBe(false);
  });

  it("closes every runtime evidence schema, LF domain, binding recipe, and 32-entry staging preimage", () => {
    const verifier =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1
        .selectionDAG.verifierAdmissibilityDAG;
    const staging = verifier.producer32ArrayStagingEvidenceSchema;
    expect(staging.exactKeys).toEqual([
      "schemaVersion",
      "seedBinding",
      "policyBinding",
      "operationGraphBinding",
      "entryCount",
      "entries",
    ]);
    expect(Object.keys(staging.fields)).toEqual(staging.exactKeys);
    expect(staging.extraKeysAllowed).toBe(false);
    expect(staging.fields.entries).toEqual({
      kind: "tuple",
      exactLength: 32,
      order: "imported_seed_v1_inventory_index_ascending_0_through_31",
      itemExactKeys: [
        "inventoryIndex",
        "levelId",
        "role",
        "relativePath",
        "shape",
        "byteLength",
        "dtype",
        "order",
        "rawArraySha256",
      ],
      itemExtraKeysAllowed: false,
      itemSemantics:
        "the_first_eight_fields_equal_the_same_index_imported_inventory_entry_and_rawArraySha256_is_SHA256_of_the_exact_raw_f64le_file_bytes",
    });
    expect(staging.orderedEntryPreimage).toEqual([
      "inventoryIndex_as_u64be",
      "levelId_as_u16be_length_plus_UTF8",
      "role_as_u16be_length_plus_UTF8",
      "relativePath_as_u16be_length_plus_UTF8",
      "shape_as_u64be_rank_then_each_extent_u64be",
      "byteLength_as_u64be",
      "dtype_as_u16be_length_plus_UTF8",
      "order_as_u16be_length_plus_UTF8",
      "rawArraySha256_as_exact_32_digest_bytes",
    ]);
    expect(staging.exactInventoryExpectations).toBe(
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_STAGING_ENTRY_EXPECTATIONS,
    );
    expect(staging.exactInventoryExpectations).toHaveLength(32);
    expect(staging.exactInventoryExpectations).toEqual(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
        (entry) => ({
          inventoryIndex: entry.inventoryIndex,
          levelId: entry.levelId,
          role: entry.role,
          relativePath: entry.relativePath,
          shape: entry.shape,
          byteLength: entry.byteLength,
          dtype: entry.dtype,
          order: entry.order,
        }),
      ),
    );

    const validation = verifier.multipolePassThroughValidationReceiptSchema;
    expect(validation.exactKeys).toEqual([
      "schemaVersion",
      "policyBinding",
      "operationGraphBinding",
      "stagingBinding",
      "expectedEntryCount",
      "validatedMultipoleEntries",
      "checksPassed",
      "passed",
    ]);
    expect(Object.keys(validation.fields)).toEqual(validation.exactKeys);
    expect(validation.extraKeysAllowed).toBe(false);
    expect(validation.fields.passed).toBe("literal_true");

    const exterior = verifier.exteriorHLowerBoundEvidenceSchema;
    expect(exterior.exactKeys).toEqual([
      "schemaVersion",
      "seedBinding",
      "proofReplayProtocolBinding",
      "policyBinding",
      "operationGraphBinding",
      "proofKernelBinding",
      "sourceL2ScalarSha256",
      "representativeContinuumSha256",
      "scalarBoundaryLiftSha256",
      "tailCoefficientInventorySha256",
      "scaledExteriorVariable",
      "aInfinityOverCosThetaGlobalIntervalBits",
      "scalarWeightedRemainderRatioUpperBits",
      "tailRadiiYBits",
      "tailRadiiZBits",
      "tailRadiusBits",
      "tailContractionUpperBits",
      "strictExteriorHLowerBoundBits",
      "joinValueDefectUpperBits",
      "joinDerivativeDefectUpperBits",
      "passed",
    ]);
    expect(Object.keys(exterior.fields)).toEqual(exterior.exactKeys);
    expect(exterior.extraKeysAllowed).toBe(false);
    expect(exterior.fields.passed).toBe("literal_true");
    expect(Object.keys(exterior.fields)).not.toContain(
      "tailProofAndErrorEnclosureSha256",
    );

    const core = verifier.continuousNodelessProofCoreResultSchema;
    expect(core.exactKeys).toEqual([
      "schemaVersion",
      "seedBinding",
      "proofReplayProtocolBinding",
      "policyBinding",
      "operationGraphBinding",
      "proofKernelBinding",
      "stagingBinding",
      "validationReceiptBinding",
      "sourceL2ScalarSha256",
      "sourceL2PotentialSha256",
      "representativeContinuumSha256",
      "scalarBoundaryLiftSha256",
      "tailCoefficientInventorySha256",
      "coverTraceSha256",
      "acceptedCompactBoxCount",
      "coverRecordCount",
      "maximumDepthUsed",
      "factoredCompactField",
      "minimumCompactRegularQuotientGLowerBoundBits",
      "exteriorHLowerBoundEvidenceBinding",
      "passed",
      "finalReceiptClosed",
    ]);
    expect(Object.keys(core.fields)).toEqual(core.exactKeys);
    expect(core.extraKeysAllowed).toBe(false);
    expect(core.fields.passed).toBe("literal_true");
    expect(core.fields.finalReceiptClosed).toBe("literal_false");
    expect(core.fields.factoredCompactField).toContain(
      "g(rho,theta)=u(x,theta)/(x*cos(theta))",
    );
    for (const forbiddenOpaqueOrRawScalarField of [
      "scalarTailCoefficientIntervalsSha256",
      "potentialTailCoefficientIntervalsSha256",
      "tailProofAndErrorEnclosureSha256",
      "minimumScalarLowerBoundBits",
    ]) {
      expect(Object.keys(core.fields)).not.toContain(
        forbiddenOpaqueOrRawScalarField,
      );
    }

    const match = verifier.numericMaterializationMatchOrRejectionSchema;
    expect(match.discriminator).toBe("disposition");
    expect(match.positiveMatch.exactKeys).toEqual([
      "schemaVersion",
      "disposition",
      "policyBinding",
      "operationGraphBinding",
      "stagingBinding",
      "validationReceiptBinding",
      "nodelessProofCoreBinding",
      "exteriorHLowerBoundEvidenceBinding",
      "representativeTupleSha256",
      "representativeContinuumSha256",
      "sourceL2ScalarSha256",
      "sourceL2PotentialSha256",
      "candidateArrayRawSha256",
      "expectedArrayRawSha256",
      "passed",
    ]);
    expect(Object.keys(match.positiveMatch.fields)).toEqual(
      match.positiveMatch.exactKeys,
    );
    expect(match.positiveMatch.extraKeysAllowed).toBe(false);
    expect(match.positiveMatch.fields.disposition).toBe("literal_match");
    expect(match.positiveMatch.fields.passed).toBe("literal_true");
    expect(match.rejection.exactKeys).toEqual([
      "schemaVersion",
      "disposition",
      "policyBinding",
      "stagingBindingOrNull",
      "failureCode",
      "firstMismatchInventoryIndexOrNull",
      "detailSha256",
    ]);
    expect(Object.keys(match.rejection.fields)).toEqual(
      match.rejection.exactKeys,
    );
    expect(match.rejection.extraKeysAllowed).toBe(false);
    expect(match.rejection.fields.failureCode).toEqual({
      kind: "enum",
      exactValues:
        policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REJECTION_FAILURE_CODES,
      anyOtherValueAllowed: false,
    });
    expect(
      new Set(
        policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REJECTION_FAILURE_CODES,
      ).size,
    ).toBe(14);
    expect(match.rejectionBinding).toBeNull();
    expect(match.replayPublicationGuard).toEqual({
      nodeId: "gate_replay_on_positive_numeric_materialization_match",
      requiresDisposition: "match",
      requiresPassed: true,
      requiresNonNullRecomputedPositiveBinding: true,
      rejectionEmitsReplayBundle: false,
      rejectionEmitsReplayBinding: false,
    });

    const replay = verifier.verifierNumericMaterializationReplayBundleSchema;
    expect(replay.exactKeys).toEqual([
      "schemaVersion",
      "policyBinding",
      "operationGraphBinding",
      "stagingBinding",
      "validationReceiptBinding",
      "nodelessProofCoreBinding",
      "exteriorHLowerBoundEvidenceBinding",
      "numericMaterializationMatch",
      "numericMaterializationMatchBinding",
      "representativeTuple",
      "representativeTupleSha256",
      "representativeContinuumSha256",
      "sourceL2ScalarSha256",
      "sourceL2PotentialSha256",
    ]);
    expect(Object.keys(replay.fields)).toEqual(replay.exactKeys);
    expect(replay.extraKeysAllowed).toBe(false);
    expect(replay.onlyTupleBearingInterstageChannel).toBe(true);

    const recipes = [
      {
        recipe: staging.bindingRecipe,
        domain:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_PRODUCER_32_ARRAY_STAGING_SHA256_DOMAIN,
      },
      {
        recipe: validation.bindingRecipe,
        domain:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_MULTIPOLE_VALIDATION_RECEIPT_SHA256_DOMAIN,
      },
      {
        recipe: exterior.bindingRecipe,
        domain:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_EXTERIOR_H_EVIDENCE_SHA256_DOMAIN,
      },
      {
        recipe: core.bindingRecipe,
        domain:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_NODELESS_PROOF_CORE_SHA256_DOMAIN,
      },
      {
        recipe: match.positiveBindingRecipe,
        domain:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_NUMERIC_MATCH_SHA256_DOMAIN,
      },
      {
        recipe: replay.bindingRecipe,
        domain:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VERIFIER_REPLAY_BUNDLE_SHA256_DOMAIN,
      },
    ];
    expect(new Set(recipes.map(({ domain }) => domain)).size).toBe(
      recipes.length,
    );
    for (const { recipe, domain } of recipes) {
      expect(recipe.bindingExactKeys).toEqual([
        "artifactId",
        "schemaVersion",
        "sha256Domain",
        "sha256",
        "canonicalSizeBytes",
      ]);
      expect(Object.keys(recipe.bindingFields)).toEqual(
        recipe.bindingExactKeys,
      );
      expect(recipe.bindingExtraKeysAllowed).toBe(false);
      expect(recipe.canonicalHash).toEqual({
        algorithm: "SHA-256",
        domain,
        domainEndsWithExactlyOneLf: true,
        serialization:
          "UTF8_of_no_whitespace_canonical_JSON_with_recursively_lexicographically_sorted_object_keys_and_arrays_in_schema_order",
        orderedPreimage: [
          "domain_UTF8_bytes_including_the_single_terminal_LF",
          "u64be_canonical_value_UTF8_byte_length",
          "canonical_value_UTF8_bytes",
        ],
        hashExpression:
          "sha256(domainUtf8 || u64be(canonicalValueUtf8ByteLength) || canonicalValueUtf8Bytes)",
        anyOtherPreimageComponentAllowed: false,
      });
      expect(domain.endsWith("\n")).toBe(true);
      expect(domain.slice(0, -1)).not.toContain("\n");
    }
    expect(verifier.typedOutputBindings).toEqual({
      observedProducer32ArrayStagingManifest:
        "producer32ArrayStagingEvidenceSchema",
      observedProducer32ArrayStagingBinding:
        "producer32ArrayStagingEvidenceSchema.bindingRecipe",
      verifierMultipolePassThroughValidationReceipt:
        "multipolePassThroughValidationReceiptSchema",
      verifierMultipolePassThroughValidationReceiptBinding:
        "multipolePassThroughValidationReceiptSchema.bindingRecipe",
      verifierExteriorHLowerBoundEvidence: "exteriorHLowerBoundEvidenceSchema",
      verifierExteriorHLowerBoundEvidenceBinding:
        "exteriorHLowerBoundEvidenceSchema.bindingRecipe",
      verifierContinuousNodelessProofCoreResult:
        "continuousNodelessProofCoreResultSchema",
      verifierContinuousNodelessProofCoreResultBinding:
        "continuousNodelessProofCoreResultSchema.bindingRecipe",
      numericMaterializationMatchOrRejection:
        "numericMaterializationMatchOrRejectionSchema",
      numericMaterializationMatchBindingOrNull:
        "numericMaterializationMatchOrRejectionSchema.positiveBindingRecipe_or_null",
      validatedPositiveNumericMaterializationMatch:
        "numericMaterializationMatchOrRejectionSchema.positiveMatch",
      validatedPositiveNumericMaterializationMatchBinding:
        "numericMaterializationMatchOrRejectionSchema.positiveBindingRecipe",
      verifierNumericMaterializationReplayBundle:
        "verifierNumericMaterializationReplayBundleSchema",
      verifierNumericMaterializationReplayBundleBinding:
        "verifierNumericMaterializationReplayBundleSchema.bindingRecipe",
    });
  });

  it("freezes the complete MPFR256/RNDN operation graph and symbolic positive-zero rule", () => {
    const graph =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1.operationGraph;
    expect(graph.boundedExpectedBitFixtureStatus).toEqual({
      provenance:
        "frozen_nonphysical_spec_literals_supplied_for_adversarial_review",
      executedAgainstBoundMpfrGmpRuntime: false,
      runtimeConformanceAuthority: false,
      scientificAuthority: false,
    });
    expect(graph.arithmeticKernel.precisionBits).toBe(256);
    expect(graph.arithmeticKernel.everyDestinationPrecisionBits).toBe(256);
    expect(graph.arithmeticKernel.roundingMode).toBe("MPFR_RNDN");
    expect(graph.arithmeticKernel.exponentRange).toEqual({
      emin: -1000000,
      emax: 1000000,
    });
    expect(graph.arithmeticKernel.flagDiscipline).toEqual({
      clear: "mpfr_clear_flags_before_each_array_element_or_modal_record_graph",
      inspectOrBranchOnFlags: false,
      acceptanceFromFlagsAllowed: false,
    });
    expect(graph.arithmeticKernel.everyPrimitiveRoundsIndependently).toBe(true);
    expect(graph.arithmeticKernel.prohibited).toContain("fused_multiply_add");
    expect(graph.arithmeticKernel.prohibited).toContain(
      "any_binary64_intermediate_not_named_in_allowedBinary64Barriers",
    );
    expect(graph.arithmeticKernel.allowedBinary64Barriers).toEqual(
      expect.arrayContaining([
        "CRepresentativeBits",
        "pRepresentativeBits",
        "A0Bits",
        "tailScalarCoefficientBits",
        "tailPotentialCoefficientBits",
        "perTargetLambdaBits",
      ]),
    );
    expect(
      graph.arithmeticKernel.selectorAndSerializationBarrierInventory.map(
        (entry) => entry.id,
      ),
    ).toEqual(graph.arithmeticKernel.allowedBinary64Barriers);
    expect(graph.arithmeticKernel.runtimeToolchainBinding).toBeNull();
    expect(
      graph.arithmeticKernel.runtimeConformanceBindingRequirements,
    ).toEqual({
      binding: null,
      exactKeys: [
        "mpfrBinarySha256",
        "mpfrVersion",
        "mpfrAbi",
        "gmpBinarySha256",
        "gmpVersion",
        "gmpAbi",
        "eminSetExact",
        "emaxSetExact",
        "exponentRangeSetSucceeded",
        "nonconcurrentExponentRangeMutation",
        "everyDestinationPrecisionBits",
        "flagsClearedAtNamedBoundaries",
        "noFlagDependentBranching",
        "binary64GradualUnderflowRNDNTiesToEven",
        "flushToZeroDisabled",
        "denormalsAreZeroDisabled",
      ],
      binaryDigestsRequired: true,
      abiIdentityRequired: true,
      exponentRangeSetSuccessReceiptRequired: true,
      nonconcurrentExponentRangeMutationReceiptRequired: true,
      flagDisciplineReceiptRequired: true,
      gradualUnderflowReceiptRequired: true,
      conformanceAuthorityUntilBoundAndExecuted: false,
    });
    expect(graph.arithmeticKernel.mpfrGetDBarrierInventory).toEqual([
      "serialized_rho_node_bits",
      "serialized_theta_node_bits",
      "serialized_analytic_z_bits",
      "pRepresentativeBits",
      "tailScalarCoefficientBits",
      "tailPotentialCoefficientBits",
      "A0Bits",
      "perTargetLambdaBits",
      "final_ordered_array_element_bits",
    ]);
    const executableGetDStrings: string[] = [];
    const collectGetDStrings = (value: unknown): void => {
      if (typeof value === "string") {
        if (value.includes("mpfr_get_d(")) executableGetDStrings.push(value);
        return;
      }
      if (value == null || typeof value !== "object") return;
      for (const child of Object.values(value as Record<string, unknown>)) {
        collectGetDStrings(child);
      }
    };
    collectGetDStrings(graph);
    expect(executableGetDStrings).toHaveLength(
      graph.arithmeticKernel.mpfrGetDBarrierInventory.length,
    );
    for (const operation of executableGetDStrings) {
      expect(
        graph.arithmeticKernel.mpfrGetDBarrierInventory.filter((id) =>
          operation.includes(`barrier_${id}`),
        ),
        operation,
      ).toHaveLength(1);
    }
    expect(graph.mappedNodes.commonProgram).toEqual([
      "pi256=MPFR_const_pi(256,MPFR_RNDN)",
      "argument=RN256(pi256*index)",
      "argument=RN256(argument/(count-1))",
      "cosine=RN256(cos(argument))",
      "difference=RN256(1-cosine)",
      "rho=RN256(difference/exact_2)",
      "thetaNumerator=RN256(pi256*difference)",
      "theta=RN256(thetaNumerator/exact_4)",
      "z=RN256(cos(theta))_before_theta_binary64_serialization",
      "rhoBits=mpfr_get_d(rho,MPFR_RNDN)_as_binary64_bits_at_barrier_serialized_rho_node_bits",
      "thetaBits=mpfr_get_d(theta,MPFR_RNDN)_as_binary64_bits_at_barrier_serialized_theta_node_bits",
      "zBits=mpfr_get_d(z,MPFR_RNDN)_as_binary64_bits_at_barrier_serialized_analytic_z_bits",
    ]);
    expect(graph.mappedNodes.rawLittleEndianBinary64Sha256).toEqual({
      rho64: "1f42876204af11c7eebab8bba8cbcd8694270e106f19479bbbd74fc47521ecab",
      rho96: "e4693c83ca71d6cba37317baa2a716b487cbd6689b003845246e9e1e235f8cd9",
      rho128:
        "9e170ea9a3c1a75005fa764258be838a2141564140e0434caeadc178863f24a4",
      rho256:
        "0de2b433de1de16840a4a63231bfe72089b4a91b6f44bbe410b3724f2a6e9e9a",
      theta32:
        "991643f4c2d20d7c7c8f639f42346af45bd2ac01cebb35c44eae06b5f38e5ae3",
      theta48:
        "e9c60c916310165f1f1719bfaef2fb7ca418e37a3a7b2d56e05878c9750e050e",
      theta64:
        "010b1fb4c92e8ae89c6ae217e98143e3d42f90f781de04e51ee61e8dbaaa5178",
      theta128:
        "0c35a610d4f1197991302eabd929da6864f5ea3a33dcf8be87401c29320aa601",
      z32: "43df86c4df06c23912e5081c50dacc95770cdb42ead94e76843b5cf1783b6152",
      z48: "59b550cace75f27d7e0d09842d2a27c705865ab449a1a3a89e54a0b4afb3d46c",
      z64: "e1a253f71ce0a71d52f062be5d20a817df5c8b2d6e86859464058d2a8ec26c28",
      z128: "c65b4e8c6c69e02c383b7eb2cf247d450e53f4bd626686da046efa54727c2773",
    });
    expect(graph.mappedNodes.boundedCount4ExpectedBitsFixture).toMatchObject({
      rawF64leSha256: {
        rho: "ecfe72366c4a0df3556412053b6a488285f7713e724b116c1a84cb7b8a93e0a8",
        theta:
          "1c05cdde7f66f8f7fb76613edcef0898fd042052cf94bde56472fd09ec6ae47e",
        z: "6c36ca2b7fceb265baabadaf8f281f535b9b429e51100d856aad7e17a3c716fb",
      },
      analyticZIndex2Bits: "3fd87de2a6aea963",
      rejectedAdjacentUlpBits: "3fd87de2a6aea964",
    });
    expect(graph.mappedNodes.evaluatorReinjection).toEqual(
      expect.arrayContaining([
        "rhoEval=mpfr_set_d_256(exact_binary64_from_rhoBits,MPFR_RNDN)",
        "pre_serialization_rho_theta_z_MPFR_values_have_node_generation_duty_only_and_never_flow_to_an_evaluator",
      ]),
    );
    expect(graph.inventoryTraversalAndPreArithmeticMasks).toMatchObject({
      traversalAndMaskDecisionsFrozenBeforeAnyArithmetic: true,
      levelOrder: ["L0", "L1", "L2", "AUDIT"],
      amplitudeOrder: [
        "2^-16",
        "2^-15",
        "2^-14",
        "2^-13",
        "2^-12",
        "2^-11",
        "2^-10",
      ],
      withinArrayLoopOrder: {
        targetNodal:
          "amplitude_stage_outer_then_radial_index_j_middle_then_angular_index_k_inner_matching_shape_[7,Nr,Ntheta]_C_order",
      },
    });
    expect(graph.outputRoleSourceTable).toBe(
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OUTPUT_ROLE_SOURCE_TABLE,
    );
    expect(graph.outputRoleSourceTableSchema).toEqual({
      levelCount: 4,
      roleCountPerLevel: 8,
      exactEntryCount: 32,
      exactEntryKeys: [
        "inventoryIndex",
        "levelIndex",
        "roleIndex",
        "levelId",
        "role",
        "relativePath",
        "shape",
        "byteLength",
        "serialization",
        "sourceKind",
        "sourceDetail",
      ],
      extraEntriesAllowed: false,
      extraEntryKeysAllowed: false,
    });
    expect(graph.outputRoleSourceTable).toHaveLength(32);
    for (const [index, source] of graph.outputRoleSourceTable.entries()) {
      const inventory =
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY[index];
      expect(source).toMatchObject({
        inventoryIndex: index,
        levelIndex: inventory.levelIndex,
        roleIndex: inventory.roleIndex,
        levelId: inventory.levelId,
        role: inventory.role,
        relativePath: inventory.relativePath,
        shape: inventory.shape,
        byteLength: inventory.byteLength,
        serialization: "raw_IEEE754_binary64_little_endian_C_order",
      });
      expect(Object.keys(source)).toEqual(
        graph.outputRoleSourceTableSchema.exactEntryKeys,
      );
    }
    const passThroughRows = graph.outputRoleSourceTable.filter(
      (row) =>
        row.sourceKind ===
        "validated_observed_postprojection_binary64_bit_passthrough",
    );
    expect(passThroughRows).toHaveLength(6);
    expect(passThroughRows.map((row) => row.inventoryIndex)).toEqual(
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_MULTIPOLE_PASS_THROUGH_EXPECTATIONS.map(
        (entry) => entry.inventoryIndex,
      ),
    );
    expect(
      graph.outputRoleSourceTable.filter(
        (row) =>
          row.sourceKind !==
          "validated_observed_postprojection_binary64_bit_passthrough",
      ),
    ).toHaveLength(26);
    expect(
      graph.outputRoleSourceTable.every(
        (row) => row.sourceKind.length > 0 && row.sourceDetail.length > 0,
      ),
    ).toBe(true);
    expect(passThroughRows.map((row) => [row.levelId, row.role])).toEqual(
      ["L0", "L1", "L2"].flatMap((levelId) => [
        [levelId, "newtonian_seed.multipole.scalar_odd"],
        [levelId, "newtonian_seed.multipole.potential_even"],
      ]),
    );
    for (const row of passThroughRows) {
      expect(row.sourceDetail).toBe(
        "exact_input_bits_after_finite_negative_zero_and_symbolic_mask_validation;no_MPFR_no_reprojection_no_get_d",
      );
    }
    expect(graph.evaluationCoordinateSources).toEqual({
      gridBaseAndAudit: {
        source:
          "rhoEval=mpfr_set_d_256(exact_binary64_from_the_exact_serialized_rhoBits,MPFR_RNDN)",
        preSerializationMappedRhoMayFlowToEvaluator: false,
      },
      targets: {
        source:
          "rhoLambda256_is_computed_by_the_frozen_pullback_from_reinjected_rhoEval_and_reinjected_lambda_without_any_rhoLambda_binary64_barrier",
        rhoLambdaBinary64BarrierAllowed: false,
      },
      c1Join: {
        source:
          "rhoJoin256=mpfr_set_q(destination_precision_256,GMP_mpq(exact_32,exact_33),MPFR_RNDN)",
        rhoJoinBinary64BarrierAllowed: false,
        xConstants: "all_tail_join_formula_constants_are_exact_integer_32",
      },
      anyOtherCoordinateSourceAllowed: false,
    });
    expect(graph.arithmeticKernel.allowedBinary64Barriers).not.toContain(
      "rhoJoinBits",
    );
    expect(graph.arithmeticKernel.allowedBinary64Barriers).not.toContain(
      "rhoLambdaBits",
    );
    expect(
      graph.inventoryTraversalAndPreArithmeticMasks.symbolicMaskPrecedence.rule,
    ).toContain("return_before_singular_coordinate_conversion");
    expect(graph.angularSynthesis.projectionFromNodalValuesAllowed).toBe(false);
    expect(graph.radialDctI.loopOrder).toContain("m_outer_ascending");
    expect(graph.radialDctI.rhoSource256Bindings).toEqual([
      {
        duty: "grid_base_and_AUDIT",
        source: "rhoEval",
        derivation:
          "mpfr_set_d_256(exact_binary64_from_the_exact_serialized_rhoBits,MPFR_RNDN)",
      },
      {
        duty: "targets",
        source: "rhoLambda256",
        derivation:
          "frozen_target_pullback_from_reinjected_rhoEval_and_reinjected_lambda_without_a_rhoLambda_binary64_barrier",
      },
      {
        duty: "C1_join",
        source: "rhoJoin256",
        derivation:
          "mpfr_set_q(destination_precision_256,GMP_mpq(exact_32,exact_33),MPFR_RNDN)_without_get_d_or_set_d",
      },
    ]);
    expect(graph.radialDctI.anyOtherRhoSource256Allowed).toBe(false);
    expect(graph.radialDctI.xi).toBe(
      "twoRho=RN256(exact_2*rhoSource256);xi=RN256(1-twoRho)",
    );
    expect(graph.radialDctI.primitiveProgram).toEqual(
      expect.arrayContaining([
        "angle=RN256(pi256*m)",
        "angle=RN256(angle*j)",
        "angle=RN256(angle/n)",
        "endpointSign=exact_symbolic_(-1)^m_without_transcendental_evaluation",
      ]),
    );
    expect(graph.radialClenshaw.loopOrder).toContain("m_descending");
    expect(graph.radialDerivative.outputCoefficientDegree).toBe("n-1");
    expect(graph.radialDerivative.derivativeClenshaw.degree).toBe("n-1");
    expect(graph.radialDerivative.joinRhoSourceAndXiGraph).toEqual(
      expect.arrayContaining([
        "rhoJoin256=mpfr_set_q(destination_precision_256,rhoJoinMpq,MPFR_RNDN)",
        "twoRhoJoin=RN256(exact_2*rhoJoin256)",
        "no_mpfr_get_d_or_mpfr_set_d_occurs_in_the_C1_join_coordinate_graph",
      ]),
    );
    expect(
      graph.radialDerivative.joinRhoSourceAndXiGraph.some((operation) =>
        operation.includes("rhoJoinBits"),
      ),
    ).toBe(false);
    expect(graph.radialDctI.boundedExpectedBitsFixture).toMatchObject({
      coefficientAscendingMBits: [
        "3fe0000000000000",
        "3fd0000000000000",
        "bfc0000000000000",
        "3fb0000000000000",
      ],
      valueBits: "3fe4000000000000",
      derivativeXiBits: "3fb0000000000000",
      derivativeRhoBits: "bfc0000000000000",
      derivativeXBits: "bfa0000000000000",
    });
    expect(graph.analyticTail.correctionModalHorner).toContain(
      "n_descending_16_through_0",
    );
    expect(graph.analyticTail.tailMultipoleProgram.scalarOdd).toEqual(
      expect.arrayContaining([
        "alphaTerm=RN256(alpha256*H_r)",
        "betaTerm=RN256(betaNext256*H_(r+1))",
        "u_r=RN256(envelope*modalBracket)",
      ]),
    );
    expect(graph.analyticTail.tailMultipoleProgram.potentialEven).toEqual(
      expect.arrayContaining([
        "V_0=RN256(coulomb+qTerm_for_q_0)",
        "for_q_ascending_1_through_63_V_q=qTerm",
      ]),
    );
    expect(graph.analyticTail.rationalOperationsClaimExactMpfrValue).toBe(
      false,
    );
    expect(
      graph.analyticTail.c1BoundaryLiftModalProgram.initialization,
    ).toEqual([
      "for_q_ascending_0_through_63_initialize_hJ_q=+0_hSJ_q=+0_qJ_q=+0_qSJ_q=+0",
      "populate_hJ_and_hSJ_only_for_q_ascending_0_through_31_from_the_odd_to_even_connection",
      "populate_qJ_and_qSJ_only_for_q_ascending_0_through_31_from_the_L2_even_modes",
      "q_32_through_63_remain_exact_symbolic_+0_in_all_four_boundary_lift_vectors",
      "tail_coefficient_corrections_never_modify_boundary_lift_vectors_and_enter_only_multiplied_by_oneMinusSSquared",
    ]);
    expect(
      graph.analyticTail.c1BoundaryLiftModalProgram
        .boundedExpectedBitsMicrofixture,
    ).toEqual({
      provenance:
        "frozen_nonphysical_spec_literals_only_not_evidence_of_MPFR_execution_or_runtime_conformance",
      HJ: [
        { q: 0, exact: "-2/3", bits: "bfe5555555555555" },
        { q: 1, exact: "5/3", bits: "3ffaaaaaaaaaaaab" },
      ],
      HSJ: [
        { q: 0, exact: "64/3", bits: "4035555555555555" },
        { q: 1, exact: "-160/3", bits: "c04aaaaaaaaaaaab" },
      ],
      QJ: [{ q: 0, exact: "2048", bits: "40a0000000000000" }],
      QSJ: [{ q: 0, exact: "-2048", bits: "c0a0000000000000" }],
      expMinus64Bits: "3a2969d47321e4cc",
      unlistedModalValues: {
        HJ: "q_2_through_63_are_exact_+0",
        HSJ: "q_2_through_63_are_exact_+0",
        QJ: "q_1_through_63_are_exact_+0",
        QSJ: "q_1_through_63_are_exact_+0",
        bits: "0000000000000000",
      },
      scientificAuthority: false,
      runtimeConformanceAuthority: false,
    });
    expect(graph.analyticTail.boundedExpectedBitsFixture).toMatchObject({
      scalar: {
        H0Bits: "3ff0000000000000",
        H1Bits: "3fe0000000000000",
        unlistedHqPositiveZero: {
          qMinimumInclusive: 2,
          qMaximumInclusive: 64,
          bits: "0000000000000000",
        },
        u0Bits: "3fd3333333333333",
        u1Bits: "3fb3333333333333",
      },
      potential: {
        V0Bits: "0000000000000000",
        V1Bits: "bfa0000000000000",
      },
    });
    expect(graph.audit.angularQuadratureAllowed).toBe(false);
    expect(graph.audit.radialRowPartition).toEqual({
      interiorAndPadding: "j_ascending_0_through_226_inclusive",
      analyticTail: "j_ascending_227_through_254_inclusive",
      symbolicInfinity: "j_exactly_255",
      exhaustiveAndDisjoint: true,
    });
    expect(graph.audit.baseNodalMayCallPiecewiseContinuumPointEvaluator).toBe(
      false,
    );
    expect(graph.audit.baseNodalArrays).toContain(
      "canonical_64_scalar_and_64_potential_AUDIT_multipoles_first",
    );
    expect(graph.namedPiecewiseContinuumPointEvaluator.name).toBe(
      "evaluatePiecewiseL2HqContinuumAtPulledRhoAndZ",
    );
    expect(graph.targetScalingAndPullback.pullbackProgram).toEqual([
      "num=RN256(lambda*rhoEval)",
      "oneMinusLambda=RN256(1-lambda)",
      "inner=RN256(oneMinusLambda*rhoEval)",
      "den=RN256(1-inner)",
      "rhoLambda256=RN256(num/den)",
      "oneMinusRhoLambda256=RN256(1-rhoLambda256)",
      "xLambda256=RN256(rhoLambda256/oneMinusRhoLambda256)",
      "branch_after_pullback_is_interior_if_xLambda256<=exact_32_including_equality_and_analytic_tail_only_if_xLambda256>exact_32",
      "continuumValue=evaluatePiecewiseL2HqContinuumAtPulledRhoAndZ(rhoLambda256,zEval)",
      "target=RN256(lambda2*continuumValue)",
    ]);
    const executablePullback =
      graph.targetScalingAndPullback.pullbackProgram.join("\n");
    expect(executablePullback).not.toMatch(/\brhoLambda=/);
    expect(executablePullback).not.toMatch(/\bxLambda=/);
    expect(executablePullback).not.toMatch(/\boneMinusRhoLambda=/);
    expect(executablePullback).toContain(
      "evaluatePiecewiseL2HqContinuumAtPulledRhoAndZ(rhoLambda256,zEval)",
    );
    expect(graph.targetScalingAndPullback.lambdaProgram[0]).toContain(
      "mpfr_set_z_2exp_256",
    );
    expect(
      graph.targetScalingAndPullback.boundedExpectedBitsFixture,
    ).toMatchObject({
      lambdaBits: "3fe0000000000000",
      rhoLambdaBits: "3fd5555555555555",
      targetBits: "3fc8000000000000",
    });
    expect(graph.symbolicPositiveZero.negativeZeroAllowed).toBe(false);
    expect(graph.symbolicPositiveZero.exactPopulations).toEqual({
      allLevelsNodalProjectedEntries: 10816,
      allLevelsMultipoleProjectedEntries: 408,
      combinedProjectedEntries: 11224,
      auditBaseScalarPrescribedBoundaryEntries: 510,
      auditBaseScalarEligibleNonboundaryEntries: 32258,
      auditBaseAndSevenTargetsPrescribedBoundaryEntries: 4080,
      auditBaseAndSevenTargetsEligibleNonboundaryEntries: 258064,
      auditInteriorRadialRowsWithModePadding: 227,
      auditPaddingAssignments: 14528,
      auditPaddingFormula:
        "227_rows*(32_scalar_padded_modes+32_potential_padded_modes)=14528",
      overlapBetweenProjectedMasksAndAuditPadding: 32,
      overlapIdentity:
        "AUDIT_scalar_origin_row_q_32_through_63_is_both_a_projected_scalar_origin_mask_and_an_interior_padding_mask",
      uniqueStructuralMaskUnion: 25720,
      uniqueStructuralMaskUnionFormula: "11224+14528-32=25720",
    });
    let poisonCalls = 0;
    const masked =
      policyModule.nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1ConformanceOnlySymbolicMaskBarrier(
        true,
        () => {
          poisonCalls += 1;
          throw new Error("masked_evaluator_must_not_run");
        },
      );
    expect(masked).toBe("0000000000000000");
    expect(poisonCalls).toBe(0);
    const unmasked =
      policyModule.nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1ConformanceOnlySymbolicMaskBarrier(
        false,
        () => {
          poisonCalls += 1;
          return "3ff0000000000000";
        },
      );
    expect(unmasked).toBe("3ff0000000000000");
    expect(poisonCalls).toBe(1);
  });

  it("ships a normalized exact-rational odd Legendre quotient fixture", () => {
    const fixture =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1;
    expect(fixture.rows).toHaveLength(32);
    expect(
      fixture.rows.reduce((sum, row) => sum + row.coefficients.length, 0),
    ).toBe(528);
    expect(fixture.rows[0].coefficients).toEqual([
      { targetEvenEll: 0, numerator: "1", denominator: "1" },
    ]);
    expect(fixture.rows[1].coefficients).toEqual([
      { targetEvenEll: 0, numerator: "-2", denominator: "3" },
      { targetEvenEll: 2, numerator: "5", denominator: "3" },
    ]);
    expect(fixture.runtimeSourceType).toBe(
      "GMP_mpq_set_from_canonical_numerator_and_denominator",
    );
    expect(fixture.runtimeConversion).toContain("mpfr_set_q");
    expect(fixture.exactMpfrRationalClaim).toBe(false);

    for (const [r, row] of fixture.rows.entries()) {
      expect(row.sourceOddEll).toBe(2 * r + 1);
      expect(row.coefficients).toHaveLength(r + 1);
      let sumNumerator = 0n;
      let sumDenominator = 1n;
      for (const [q, coefficient] of row.coefficients.entries()) {
        const numerator = BigInt(coefficient.numerator);
        const denominator = BigInt(coefficient.denominator);
        expect(coefficient.targetEvenEll).toBe(2 * q);
        expect(denominator > 0n).toBe(true);
        expect(gcd(numerator, denominator)).toBe(1n);
        sumNumerator = sumNumerator * denominator + numerator * sumDenominator;
        sumDenominator *= denominator;
        const divisor = gcd(sumNumerator, sumDenominator);
        sumNumerator /= divisor;
        sumDenominator /= divisor;
      }
      expect([sumNumerator, sumDenominator]).toEqual([1n, 1n]);
    }

    expect(
      createHash("sha256")
        .update(
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256,
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_BINDING.sha256,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256,
    );
  });

  it("expands the nonphysical conformance representative inputs in canonical n/q order", () => {
    const fixture =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE;
    const scalar = fixture.representativeInputs.tailScalarCoefficientBits;
    const potential = fixture.representativeInputs.tailPotentialCoefficientBits;
    expect(fixture.inputOnly).toBe(true);
    expect(fixture.operationGraphExpectedOutputs).toBeNull();
    expect(fixture.operationGraphConformanceAuthority).toBe(false);
    expect(fixture.scientificAcceptance).toBe(false);
    expect(fixture.proofAuthority).toBe(false);
    expect(fixture.gateAuthority).toBe(false);
    expect(fixture.representativeInputs).toMatchObject({
      A0Bits: "3fb0000000000000",
      CRepresentativeBits: "3fc0000000000000",
      pRepresentativeBits: "bfec000000000000",
    });
    expect(scalar).toHaveLength(1088);
    expect(potential).toHaveLength(1088);
    for (const [index, entry] of scalar.entries()) {
      expect(entry).toMatchObject({ n: Math.floor(index / 64), q: index % 64 });
      expect(entry.bits).toMatch(/^[0-9a-f]{16}$/);
    }
    expect(scalar[0].bits).toBe("3f90000000000000");
    expect(scalar[65].bits).toBe("bf80000000000000");
    expect(scalar[1087].bits).toBe("3eb0000000000000");
    expect(potential[0].bits).toBe("bfa0000000000000");
    expect(potential[2 * 64 + 3].bits).toBe("3f60000000000000");
    expect(
      scalar.filter((entry) => entry.bits !== "0000000000000000"),
    ).toHaveLength(3);
    expect(
      potential.filter((entry) => entry.bits !== "0000000000000000"),
    ).toHaveLength(2);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA.bitEncoding,
    ).toEqual({
      representativeFieldBits:
        "exactly_16_lowercase_hex_characters_encoding_the_MSB_first_IEEE754_binary64_numeric_bit_pattern_with_the_sign_and_high_exponent_bits_in_the_first_hex_octet",
      representativeFieldByteReversalAllowed: false,
      arrayBytes:
        "raw_IEEE754_binary64_little_endian_bytes_in_the_frozen_C_order_array_traversal",
      arrayHexAndRepresentativeNumericBitHexAreNotInterchangeable: true,
    });
    const bitsViolations =
      policyModule.nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1RepresentativeBitsViolations;
    expect(bitsViolations("bfec000000000000")).toEqual([]);
    expect(bitsViolations("3fb0000000000000", "3fb0000000000000")).toEqual([]);
    expect(bitsViolations("000000000000b03f", "3fb0000000000000")).toEqual([
      "representative_bits_byte_reversed_raw_f64le_confusion",
    ]);
    expect(bitsViolations("7ff0000000000000")).toEqual([
      "representative_bits_nonfinite",
    ]);
    expect(bitsViolations("fff0000000000000")).toEqual([
      "representative_bits_nonfinite",
    ]);
    expect(bitsViolations("7ff8000000000000")).toEqual([
      "representative_bits_nonfinite",
    ]);
    expect(bitsViolations("8000000000000000")).toEqual([
      "representative_bits_negative_zero",
    ]);
    expect(bitsViolations("3FB0000000000000")).toEqual([
      "representative_bits_not_exact_16_lowercase_hex",
    ]);
  });

  it("keeps every execution and authority lock false or null and names unresolved proof blockers", () => {
    const policy =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1;
    const claimLockKeys = [
      "producerRepresentativeAuthority",
      "materializerProofAuthority",
      "policyProofAuthority",
      "policyGateAuthority",
      "policyArtifactAuthority",
      "policyPhysicalAuthority",
      "operationGraphConformanceAuthority",
      "sharedImplementationAuthority",
      "toleranceBasedAcceptanceAllowed",
      "proofKernelDefined",
      "intervalKernelDefined",
      "quadratureKernelDefined",
      "mpfrRuntimeToolchainBound",
      "symbolicMaskConformanceHelperAuthority",
      "representativeBitsConformanceHelperAuthority",
      "executionAuthorized",
      "numericMaterializationMatchPresent",
      "fullSeedV1AdmissionPresent",
      "policyMayAdmitSeed",
      "policyMayAdmitArtifact",
      "policyMaySatisfyFullSeedGateReport",
      "artifactAccepted",
      "candidateAdmissible",
      "relativisticBranchSolved",
      "physicalViabilityEstablished",
      "propulsionCapabilityEstablished",
      "transportCapabilityEstablished",
      "anySemiclassicalClaimEstablished",
    ];
    const executionStateKeys = [
      "executionAuthorized",
      "mpfrRuntimeToolchainBinding",
      "policyRuntimeObserved",
      "producer32ArrayStagingBundleBinding",
      "observedProducer32ArrayStagingBinding",
      "multipolePassThroughValidationReceiptBinding",
      "exteriorHLowerBoundEvidenceBinding",
      "continuousNodelessProofCoreResultBinding",
      "numericMaterializationMatchBinding",
      "fullSeedV1AdmissionBinding",
      "verifierNumericMaterializationReplayBundleBinding",
      "materializationPresent",
      "materializedArrayBinding",
      "proofReceiptBindings",
      "verified",
      "descriptorAssembled",
      "artifactAccepted",
    ];
    expect(policy.claimLockKeys).toEqual(claimLockKeys);
    expect(Object.keys(policy.claimLocks)).toEqual(claimLockKeys);
    expect(policy.claimLocks).toEqual(
      Object.fromEntries(claimLockKeys.map((key) => [key, false])),
    );
    expect(Object.keys(policy.executionState)).toEqual(executionStateKeys);
    expect(policy.executionState).toEqual({
      executionAuthorized: false,
      mpfrRuntimeToolchainBinding: null,
      policyRuntimeObserved: false,
      producer32ArrayStagingBundleBinding: null,
      observedProducer32ArrayStagingBinding: null,
      multipolePassThroughValidationReceiptBinding: null,
      exteriorHLowerBoundEvidenceBinding: null,
      continuousNodelessProofCoreResultBinding: null,
      numericMaterializationMatchBinding: null,
      fullSeedV1AdmissionBinding: null,
      verifierNumericMaterializationReplayBundleBinding: null,
      materializationPresent: false,
      materializedArrayBinding: null,
      proofReceiptBindings: null,
      verified: false,
      descriptorAssembled: false,
      artifactAccepted: false,
    });
    expect(policy.blockers).toEqual([
      "representative_tuple_absent",
      "materialized_32_array_inventory_absent",
      "independent_bit_replay_absent",
      "representative_input_fixture_has_no_expected_outputs_and_no_conformance_authority",
      "full_end_to_end_tail_expected_bit_conformance_fixture_absent",
      "bounded_expected_bit_fixtures_are_frozen_literals_not_executed_MPFR_evidence",
      "typed_observed_staging_validation_exterior_H_evidence_nodeless_core_numeric_match_and_verifier_replay_runtime_bindings_absent",
      "pre_peak_continuous_nodeless_proof_core_is_not_the_final_closed_continuous_nodeless_interval_proof_receipt",
      "mpfr_gmp_binary_hash_version_abi_exponent_range_success_nonconcurrent_mutation_flag_and_gradual_underflow_runtime_binding_absent",
      "nodal_to_postprojection_parity_Legendre_operation_graph_and_input_acceptance_binding_absent",
      "external_full_seed_v1_admission_with_complete_gate_report_nodeless_origin_peak_and_nodal_to_postprojection_acceptance_receipts_absent",
      "proof_directed_interval_operators_remain_underdefined_by_seed_v1",
      "proof_root_isolation_operator_remains_underdefined_by_seed_v1",
      "proof_interval_transcendental_operator_remains_underdefined_by_seed_v1",
      "proof_quadrature_error_operator_remains_underdefined_by_seed_v1",
      "proof_kernel_binding_is_null",
      "run_plan_successor_binding_this_policy_is_absent",
    ]);
    expect(
      policy.interpretationBoundary
        .policyEstablishesPostprojectionInputAcceptance,
    ).toBe(false);
    expect(policy.chronology.policyTerminalDuty).toBe(
      "numericMaterializationMatchOrRejection_only_without_seed_or_artifact_admission_authority",
    );
    expect(policy.mutatesSeedV1).toBe(false);
    expect(policy.mutatesRunPlanV1).toBe(false);
    expect(policy.mutatesRunPlanV2).toBe(false);
  });

  it("seals all six independently recomputed canonical bindings with direct literal pins", () => {
    const policy =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1;
    expect(policy.selectionDAG).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG,
    );
    expect(policy.representativeTupleSchema).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA,
    );
    expect(policy.operationGraph).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH,
    );
    expect(policy.bindings.selectionDAGV1.binding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_BINDING,
    );
    expect(policy.bindings.representativeTupleSchemaV1.binding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_BINDING,
    );
    expect(policy.bindings.operationGraphV1.binding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
    );
    expect(
      new Set([
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_BINDING.sha256Domain,
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_BINDING.sha256Domain,
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING.sha256Domain,
      ]).size,
    ).toBe(3);
    const projections = [
      {
        name: "rootPolicy",
        artifactId:
          "nhm2.prolate_boson_star_newtonian_seed.numeric_materialization_policy",
        contractVersion:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_policy/v1",
        value:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1,
        canonicalJson:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_JSON,
        domain:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SHA256_DOMAIN,
        expectedDomain:
          "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-policy/v1\n",
        sha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SHA256,
        expectedSha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_EXPECTED_SHA256,
        size: policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_SIZE_BYTES,
        expectedSize:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES,
        binding:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
      },
      {
        name: "selectionDAG",
        artifactId:
          "nhm2.prolate_boson_star_newtonian_seed.numeric_materialization_selection_dag",
        contractVersion:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_selection_dag/v1",
        value:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG,
        canonicalJson:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_CANONICAL_JSON,
        domain:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_SHA256_DOMAIN,
        expectedDomain:
          "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-selection-dag/v1\n",
        sha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_SHA256,
        expectedSha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_EXPECTED_SHA256,
        size: policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_CANONICAL_SIZE_BYTES,
        expectedSize:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_EXPECTED_CANONICAL_SIZE_BYTES,
        binding:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_BINDING,
      },
      {
        name: "representativeTupleSchema",
        artifactId:
          "nhm2.prolate_boson_star_newtonian_seed.numeric_representative_tuple_schema",
        contractVersion:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_representative_tuple_schema/v1",
        value:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA,
        canonicalJson:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_CANONICAL_JSON,
        domain:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_SHA256_DOMAIN,
        expectedDomain:
          "nhm2-prolate-boson-star-newtonian-seed-numeric-representative-tuple-schema/v1\n",
        sha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_SHA256,
        expectedSha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_EXPECTED_SHA256,
        size: policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_CANONICAL_SIZE_BYTES,
        expectedSize:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES,
        binding:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_BINDING,
      },
      {
        name: "operationGraph",
        artifactId:
          "nhm2.prolate_boson_star_newtonian_seed.numeric_operation_graph",
        contractVersion:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_operation_graph/mpfr256_rndn_v1",
        value:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH,
        canonicalJson:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_CANONICAL_JSON,
        domain:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_SHA256_DOMAIN,
        expectedDomain:
          "nhm2-prolate-boson-star-newtonian-seed-numeric-operation-graph/mpfr256-rndn-v1\n",
        sha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_SHA256,
        expectedSha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_EXPECTED_SHA256,
        size: policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_CANONICAL_SIZE_BYTES,
        expectedSize:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_EXPECTED_CANONICAL_SIZE_BYTES,
        binding:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
      },
      {
        name: "representativeInputFixture",
        artifactId:
          "nhm2.prolate_boson_star_newtonian_seed.numeric_representative_input_fixture",
        contractVersion:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_representative_input_fixture/v1",
        value:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE,
        canonicalJson:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_CANONICAL_JSON,
        domain:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_SHA256_DOMAIN,
        expectedDomain:
          "nhm2-prolate-boson-star-newtonian-seed-numeric-representative-input-fixture/v1\n",
        sha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_SHA256,
        expectedSha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_EXPECTED_SHA256,
        size: policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_CANONICAL_SIZE_BYTES,
        expectedSize:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_EXPECTED_CANONICAL_SIZE_BYTES,
        binding:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_BINDING,
      },
      {
        name: "oddLegendreConnectionFixture",
        artifactId:
          "nhm2.prolate_boson_star_newtonian_seed.odd_legendre_quotient_connection_fixture",
        contractVersion:
          "nhm2_prolate_boson_star_newtonian_seed_odd_legendre_quotient_connection_fixture/v1",
        value:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1,
        canonicalJson:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_CANONICAL_JSON,
        domain:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256_DOMAIN,
        expectedDomain:
          "nhm2-prolate-boson-star-newtonian-seed-odd-legendre-quotient-connection-fixture/v1\n",
        sha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256,
        expectedSha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_EXPECTED_SHA256,
        size: policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_CANONICAL_SIZE_BYTES,
        expectedSize:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_EXPECTED_CANONICAL_SIZE_BYTES,
        binding:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_BINDING,
      },
    ];
    expect(new Set(projections.map((item) => item.name)).size).toBe(
      projections.length,
    );
    expect(new Set(projections.map((item) => item.domain)).size).toBe(
      projections.length,
    );
    for (const item of projections) {
      expect(item.domain, `${item.name}:domain`).toBe(item.expectedDomain);
      expect(canonicalJson(item.value), item.name).toBe(item.canonicalJson);
      expect(Buffer.byteLength(item.canonicalJson, "utf8"), item.name).toBe(
        item.size,
      );
      expect(
        createHash("sha256")
          .update(item.domain, "utf8")
          .update(item.canonicalJson, "utf8")
          .digest("hex"),
        item.name,
      ).toBe(item.sha256);
      expect(item.sha256, `${item.name}:literal_sha256`).toBe(
        item.expectedSha256,
      );
      expect(item.size, `${item.name}:literal_size`).toBe(item.expectedSize);
      expect(Object.keys(item.binding), item.name).toEqual([
        "artifactId",
        "contractVersion",
        "sha256Domain",
        "sha256",
        "canonicalSizeBytes",
      ]);
      expect(item.binding, item.name).toEqual({
        artifactId: item.artifactId,
        contractVersion: item.contractVersion,
        sha256Domain: item.domain,
        sha256: item.sha256,
        canonicalSizeBytes: item.size,
      });
    }
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_LITERAL_SEAL_STATUS,
    ).toBe("sealed_preregistration_read_only_red_team_clear");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1.status,
    ).toBe("sealed_preregistration_read_only_red_team_clear");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1.blockers,
    ).not.toContain("read_only_red_team_and_literal_seal_pending");
    expect(
      Object.keys(policyModule).filter(
        (key) =>
          key.endsWith("_EXPECTED_SHA256") ||
          key.endsWith("_EXPECTED_CANONICAL_SIZE_BYTES"),
      ),
    ).toHaveLength(12);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_JSON,
    ).not.toContain("run_plan_v3");
  });

  it("source-audits six direct literal pins, exact domains, and non-tautological module-load self-checks", () => {
    const source = readFileSync(
      new URL(
        "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-policy.v1.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const escapeRegExp = (value: string): string =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const literalPins = [
      {
        stem: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-policy/v1\n",
        sha256:
          "ec9905f87b5d11c902a5b292772bdc11ec755ecd00fa08949382f42f1671652d",
        canonicalSizeBytes: 243240,
        driftError:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_policy_v1_literal_binding_drift",
      },
      {
        stem: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-selection-dag/v1\n",
        sha256:
          "3174e8ce18a1e254417babfab3f28951309fd02d106abe19d7993c6663b3f8f6",
        canonicalSizeBytes: 58130,
        driftError:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_selection_dag_v1_literal_binding_drift",
      },
      {
        stem: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed-numeric-representative-tuple-schema/v1\n",
        sha256:
          "f8bed90558b5a4ab5d3edbc170a35d0c55f0edf232fb09e0223b13bd45cfad98",
        canonicalSizeBytes: 2801,
        driftError:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_representative_tuple_schema_v1_literal_binding_drift",
      },
      {
        stem: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed-numeric-operation-graph/mpfr256-rndn-v1\n",
        sha256:
          "a4383a581779f90736588de253e2148c392156f001636a2b994e8eb0c905c835",
        canonicalSizeBytes: 39345,
        driftError:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_operation_graph_v1_literal_binding_drift",
      },
      {
        stem: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed-numeric-representative-input-fixture/v1\n",
        sha256:
          "07be01c97f3ce0b20b4b9e31a236993b3e9638f75bcbdcbaf5065badf906c756",
        canonicalSizeBytes: 90355,
        driftError:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_representative_input_fixture_v1_literal_binding_drift",
      },
      {
        stem: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed-odd-legendre-quotient-connection-fixture/v1\n",
        sha256:
          "75be3e81e8c2ab6a1a279f3970bece1850b2e6e1ea7f028b1387e1b1be2352aa",
        canonicalSizeBytes: 39594,
        driftError:
          "nhm2_prolate_boson_star_newtonian_seed_odd_legendre_quotient_connection_fixture_v1_literal_binding_drift",
      },
    ] as const;
    expect(literalPins).toHaveLength(6);
    for (const pin of literalPins) {
      const stem = escapeRegExp(pin.stem);
      const domainSourceLiteral = escapeRegExp(
        pin.domain.replace(/\n/g, "\\n"),
      );
      expect(source, `${pin.stem}:domain_literal`).toMatch(
        new RegExp(
          `${stem}_SHA256_DOMAIN\\s*=\\s*\\r?\\n\\s*"${domainSourceLiteral}" as const`,
        ),
      );
      expect(source, `${pin.stem}:sha256_literal`).toMatch(
        new RegExp(
          `${stem}_EXPECTED_SHA256\\s*=\\s*\\r?\\n\\s*"${pin.sha256}" as const`,
        ),
      );
      expect(source, `${pin.stem}:size_literal`).toMatch(
        new RegExp(
          `${stem}_EXPECTED_CANONICAL_SIZE_BYTES\\s*=\\s*\\r?\\n\\s*${pin.canonicalSizeBytes} as const`,
        ),
      );
      expect(source, `${pin.stem}:module_load_self_check`).toMatch(
        new RegExp(
          `${stem}_SHA256\\s*!==\\s*${stem}_EXPECTED_SHA256\\s*\\|\\|[\\s\\S]{0,300}${stem}_CANONICAL_SIZE_BYTES\\s*!==\\s*${stem}_EXPECTED_CANONICAL_SIZE_BYTES`,
        ),
      );
      expect(source, `${pin.stem}:drift_error`).toContain(pin.driftError);
    }
    expect(source).not.toMatch(
      /EXPECTED_SHA256\s*=\s*\r?\n\s*NHM2_[A-Z0-9_]*_SHA256\b/,
    );
    expect(source).not.toMatch(
      /EXPECTED_CANONICAL_SIZE_BYTES\s*=\s*\r?\n\s*NHM2_[A-Z0-9_]*_CANONICAL_SIZE_BYTES\b/,
    );
  });

  it("is deeply frozen and accepts only the authoritative singleton", () => {
    const policy =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1;
    assertDeepFrozen(policy);
    expect(
      isNhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1(policy),
    ).toBe(true);
    const externalCopy = JSON.parse(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_JSON,
    ) as unknown;
    expect(
      nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1Violations(
        externalCopy,
      ),
    ).toEqual([
      "numeric_materialization_policy_v1_external_copy_not_authoritative",
    ]);

    const adversarialMutations: Array<(copy: any) => void> = [
      (copy) => {
        copy.selectionDAG.verifierAdmissibilityDAG.nodes.splice(1, 1);
      },
      (copy) => {
        copy.selectionDAG.verifierAdmissibilityDAG.verifierRepresentativeTupleSha256Recipe.domain =
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SHA256_DOMAIN;
      },
      (copy) => {
        copy.selectionDAG.descriptorAssemblerDAG.nodes[0].inputs.shift();
      },
      (copy) => {
        copy.selectionDAG.externalFullSeedV1AdmissionRequirements.pop();
      },
      (copy) => {
        copy.operationGraph.radialDctI.xi =
          "twoRho=RN256(exact_2*rhoEval);xi=RN256(1-twoRho)";
      },
      (copy) => {
        copy.selectionDAG.descriptorAssemblerDAG.externalInputs.splice(
          1,
          0,
          "verifierRepresentativeTuple",
        );
      },
      (copy) => {
        const entries =
          copy.selectionDAG.verifierAdmissibilityDAG
            .producer32ArrayStagingEvidenceSchema.exactInventoryExpectations;
        [entries[0], entries[1]] = [entries[1], entries[0]];
      },
      (copy) => {
        copy.selectionDAG.verifierAdmissibilityDAG.multipolePassThroughValidationReceiptSchema.exactKeys.push(
          "untypedExtension",
        );
      },
      (copy) => {
        copy.selectionDAG.verifierAdmissibilityDAG.continuousNodelessProofCoreResultSchema.fields.passed =
          "boolean_not_literal_true";
      },
      (copy) => {
        copy.selectionDAG.verifierAdmissibilityDAG.continuousNodelessProofCoreResultSchema.fields.minimumCompactRegularQuotientGLowerBoundBits =
          "raw_scalar_u_lower_bound";
      },
      (copy) => {
        copy.selectionDAG.verifierAdmissibilityDAG.numericMaterializationMatchOrRejectionSchema.rejection.fields.failureCode.exactValues.pop();
      },
      (copy) => {
        copy.selectionDAG.verifierAdmissibilityDAG.numericMaterializationMatchOrRejectionSchema.replayPublicationGuard.rejectionEmitsReplayBundle = true;
      },
      (copy) => {
        copy.selectionDAG.verifierAdmissibilityDAG.verifierNumericMaterializationReplayBundleSchema.exactKeys.splice(
          8,
          1,
        );
      },
      (copy) => {
        copy.operationGraph.targetScalingAndPullback.pullbackProgram[4] =
          "rhoLambda=RN256(num/den)";
      },
    ];
    for (const mutate of adversarialMutations) {
      const hostileCopy = JSON.parse(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_JSON,
      ) as any;
      mutate(hostileCopy);
      expect(
        nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1Violations(
          hostileCopy,
        ),
      ).toEqual(["numeric_materialization_policy_v1_semantic_mismatch"]);
    }
  });

  it("rejects proxies and every hostile snapshot-budget surface before unsafe reflection", () => {
    const violations =
      nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1Violations;
    const limits =
      policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VALIDATION_LIMITS;
    const baseline = measureSnapshotSurface(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1,
    );
    expect(baseline.nodes).toBeLessThan(limits.maximumNodes / 2);
    expect(baseline.keys).toBeLessThan(limits.maximumKeys / 2);
    expect(baseline.stringCodeUnits).toBeLessThan(
      limits.maximumTotalStringCodeUnits / 2,
    );
    expect(baseline.maximumDepth).toBeLessThan(limits.maximumDepth / 2);
    expect(baseline.maximumSingleStringCodeUnits).toBeLessThan(
      limits.maximumStringCodeUnits / 2,
    );

    let proxyTrapCalls = 0;
    const trap = () => {
      proxyTrapCalls += 1;
      throw new Error("proxy_reflection_must_not_run");
    };
    const zeroTrapProxy = new Proxy(
      {},
      {
        getPrototypeOf: trap,
        ownKeys: trap,
        getOwnPropertyDescriptor: trap,
        get: trap,
      },
    );
    expect(violations(zeroTrapProxy)).toEqual(["proxy_value:/"]);
    expect(proxyTrapCalls).toBe(0);

    let getterCalls = 0;
    const accessor = {} as Record<string, unknown>;
    Object.defineProperty(accessor, "payload", {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return 1;
      },
    });
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const symbolValue = { ok: true } as Record<PropertyKey, unknown>;
    symbolValue[Symbol("hostile")] = true;
    const oversizedPropertyName = {
      ["k".repeat(262145)]: true,
    };
    const sparseArray = [1, , 3];
    const extraPropertyArray = [1] as number[] & { extra?: boolean };
    extraPropertyArray.extra = true;
    let tooDeep: Record<string, unknown> = {};
    const tooDeepRoot = tooDeep;
    for (let depth = 0; depth <= limits.maximumDepth; depth += 1) {
      const child: Record<string, unknown> = {};
      tooDeep.next = child;
      tooDeep = child;
    }
    const tooManyNodes = Array.from({ length: 13 }, () =>
      Array.from({ length: limits.maximumArrayLength }, () => 0),
    );
    const tooManyKeys: Record<string, unknown> = {};
    for (let index = 0; index <= limits.maximumKeys; index += 1) {
      tooManyKeys[`k${index}`] = true;
    }
    const oversizedValueString = "v".repeat(limits.maximumStringCodeUnits + 1);
    const cumulativeStrings = Array.from({ length: 8 }, () =>
      "s".repeat(250_001),
    );
    const forbiddenKey = { constructor: true };

    expect(violations(accessor)[0]).toContain("object_property_surface");
    expect(getterCalls).toBe(0);
    expect(violations(cyclic)[0]).toContain("cyclic_value");
    expect(violations(Object.create({ inherited: true }))[0]).toContain(
      "non_plain_object",
    );
    expect(violations(new Array(4097))[0]).toContain("array_length");
    expect(violations(sparseArray)[0]).toContain("array_surface");
    expect(violations(extraPropertyArray)[0]).toContain("array_surface");
    expect(violations(symbolValue)[0]).toContain("symbol_key");
    expect(violations(-0)[0]).toContain("invalid_number");
    expect(violations(Number.NaN)[0]).toContain("invalid_number");
    expect(violations(tooDeepRoot)[0]).toContain("snapshot_depth_limit");
    expect(violations(tooManyNodes)[0]).toContain("snapshot_node_limit");
    expect(violations(tooManyKeys)[0]).toContain("snapshot_key_limit");
    expect(violations(oversizedValueString)).toEqual([
      "snapshot_string_limit:/",
    ]);
    expect(violations(cumulativeStrings)[0]).toContain("snapshot_string_limit");
    expect(violations(forbiddenKey)[0]).toContain("forbidden_key");
    expect(violations(oversizedPropertyName)).toEqual([
      "snapshot_property_name_string_limit:/",
    ]);
  });
});
