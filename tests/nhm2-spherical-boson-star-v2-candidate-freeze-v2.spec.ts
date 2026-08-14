import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-raw-replay-schema.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_ADMITTED_CANDIDATE_INSTANCE_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_ALIAS_ADDITIONAL_PHYSICAL_FILE_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BYTE_COUNT_PER_LANE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CENTRAL_ALIAS_COUNT_PER_LANE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONSTRAINT_OPERANDS_PER_LEVEL,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONSTRAINT_PHYSICAL_FILE_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_SEMANTIC_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_BYTE_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_PHYSICAL_FILE_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_ROLE_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_LITERAL_SEAL_STATUS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_NONCONSTRAINT_PHYSICAL_FILE_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_OUTPUT_INSTANCE_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PHYSICAL_FILE_COUNT_PER_LANE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_REGULATOR_LEVEL_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_REQUIRED_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SELECTED_IDENTITY_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SEMANTIC_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_VALIDATOR_LIMITS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_VALUE_COUNT_PER_LANE,
  cloneNhm2SphericalBosonStarV2CandidateFreezeV2CanonicalWire,
  isNhm2SphericalBosonStarV2CandidateFreezeV2Wire,
  nhm2SphericalBosonStarV2CandidateFreezeV2WireViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v2";

const deepFrozen = (value: unknown, seen = new Set<object>()): boolean => {
  if (value == null || typeof value !== "object" || seen.has(value)) {
    return true;
  }
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every((entry) =>
      deepFrozen(entry, seen),
    )
  );
};

const allNullLeaves = (value: unknown): boolean => {
  if (value === null) return true;
  if (Array.isArray(value)) return value.every(allNullLeaves);
  if (typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).every(allNullLeaves);
};

const sealAndSize = (
  binding: Readonly<{ sha256: string; canonicalSizeBytes: number }>,
) => ({
  semanticSha256: binding.sha256,
  canonicalSizeBytes: binding.canonicalSizeBytes,
});

describe("NHM2 spherical boson-star v2 candidate freeze v2", () => {
  it("freezes only the independently acknowledged literal seal values", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_SEMANTIC_SHA256,
    ).toBe("a8e4d9cb4b07efc053fddc72339b8c3db464129a992731453059d3e160ca2ce2");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_PLAIN_CANONICAL_SHA256,
    ).toBe("ae7e7f17b67dca7bbb25cbddb60e20b08135dd513977a620463122e153f58932");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(20_843);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_LITERAL_SEAL_STATUS,
    ).toBe(
      "sealed_after_independent_parent_acknowledgement_before_candidate_execution",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SEMANTIC_SHA256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_SEMANTIC_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PLAIN_CANONICAL_SHA256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_PLAIN_CANONICAL_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SEMANTIC_SHA256,
    ).not.toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PLAIN_CANONICAL_SHA256,
    );
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING.observedRawBinding,
    ).toBeNull();
  });

  it("binds the predecessor, branch, raw schema, final SI and definition seals exactly", () => {
    const freeze = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2;
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_REQUIRED_BINDING_PINS;

    expect(sealAndSize(freeze.additiveSuccessorBoundary.predecessor)).toEqual({
      semanticSha256: pins.predecessorCandidateFreeze.semanticSha256,
      canonicalSizeBytes: pins.predecessorCandidateFreeze.canonicalSizeBytes,
    });
    expect(freeze.hashNamespaces.predecessorPlainCanonicalJsonSha256).toBe(
      pins.predecessorCandidateFreeze.plainCanonicalSha256,
    );
    expect(
      sealAndSize(freeze.exactDefinitionBindings.branchExecutionPolicy),
    ).toEqual(pins.branchExecutionPolicy);
    expect(sealAndSize(freeze.exactDefinitionBindings.rawReplaySchema)).toEqual(
      pins.rawReplaySchema,
    );
    expect(
      sealAndSize(freeze.exactDefinitionBindings.finalSiOutputNormalizationV2),
    ).toEqual(pins.finalSiOutputNormalizationV2);

    expect(
      sealAndSize(freeze.exactDefinitionBindings.meanNoiseRealization),
    ).toEqual(pins.meanNoiseRealization);
    expect(
      sealAndSize(freeze.exactDefinitionBindings.renormalizationPrescription),
    ).toEqual(pins.renormalizationPrescription);
    expect(
      sealAndSize(freeze.exactDefinitionBindings.renormalizationCounterterms),
    ).toEqual(pins.renormalizationCounterterms);
    expect(
      sealAndSize(freeze.exactDefinitionBindings.constraintFormulation),
    ).toEqual(pins.constraintFormulation);
    expect(
      sealAndSize(freeze.exactDefinitionBindings.classicalStructureFunctions),
    ).toEqual(pins.classicalStructureFunctions);
    expect(
      sealAndSize(freeze.exactDefinitionBindings.operatorOrdering),
    ).toEqual(pins.operatorOrdering);
    expect(
      sealAndSize(freeze.exactDefinitionBindings.operatorDerivationClosure),
    ).toEqual(pins.operatorDerivationClosure);
    expect(
      sealAndSize(freeze.exactDefinitionBindings.regulatorDefinition),
    ).toEqual(pins.regulatorDefinition);
    expect(
      sealAndSize(freeze.exactDefinitionBindings.metricDemandProgram),
    ).toEqual(pins.metricDemandProgram);
    expect(
      sealAndSize(freeze.exactDefinitionBindings.smearingWeightFreeze),
    ).toEqual({
      semanticSha256: pins.smearingWeightFreeze.semanticSha256,
      canonicalSizeBytes: pins.smearingWeightFreeze.canonicalSizeBytes,
    });
    expect(
      sealAndSize(freeze.exactDefinitionBindings.pairAgreementPlan),
    ).toEqual(pins.pairAgreementPlan);
  });

  it("freezes one identity but admits no candidate instance or nondegeneracy claim", () => {
    const freeze = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2;
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SELECTED_IDENTITY_COUNT,
    ).toBe(1);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_ADMITTED_CANDIDATE_INSTANCE_COUNT,
    ).toBe(0);
    expect(freeze.selectedCandidateIdentity.exactSelectedIdentityCount).toBe(1);
    expect(freeze.candidateAdmission).toMatchObject({
      selectedIdentityRequiresNondegeneracy: true,
      exactAdmittedCandidateInstanceCount: 0,
      nondegeneracyEstablished: false,
      candidateAdmissible: false,
      candidateInstance: null,
      candidateManifestSemanticInstance: null,
      candidateManifestObservedRawBinding: null,
      admissionReceipt: null,
    });
    expect(freeze.selectedCandidateIdentity).toMatchObject({
      sourceMode: "state_derived_not_declared_lever",
      declaredLeverTensorUsed: false,
      declaredTileTensorUsed: false,
      retuningAfterObservationAllowed: false,
      alternateCandidateFallbackAllowed: false,
    });
  });

  it("keeps identity keys, semantic seals, plain hashes and observed raw bindings disjoint", () => {
    const hashes =
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2.hashNamespaces;
    expect(hashes.candidateIdentityDeterministicSealKey).toBe(
      "9595c5fe3cfd3d46af095cd4980942d47c72db7f18cc53089683d8661ab449cb",
    );
    expect(hashes.predecessorSemanticContractSeal).toBe(
      "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    );
    expect(hashes.predecessorPlainCanonicalJsonSha256).toBe(
      "0a961dea8a620132efb8d669bbca1509ef53de6bf0073d1a174b2a743dfd112f",
    );
    expect(
      new Set([
        hashes.candidateIdentityDeterministicSealKey,
        hashes.predecessorSemanticContractSeal,
        hashes.predecessorPlainCanonicalJsonSha256,
      ]).size,
    ).toBe(3);
    expect(hashes.candidateManifestObservedRawBinding).toBeNull();
    expect(hashes).toMatchObject({
      semanticContractSealMayStandInForObservedRawFileHash: false,
      plainCanonicalHashMayStandInForDomainSeparatedSemanticSeal: false,
      candidateIdentityStringMayStandInForCandidateManifestBytes: false,
      candidateIdentitySealKeyMayStandInForNondegeneracyProof: false,
    });
  });

  it("records the unresolved SI-v1 consumer pins without claiming SI-v2 integration", () => {
    const ledger =
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2.staleSiIntegrationLedger;
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_REQUIRED_BINDING_PINS;
    expect(sealAndSize(ledger.finalRequiredNormalization)).toEqual(
      pins.finalSiOutputNormalizationV2,
    );
    expect(sealAndSize(ledger.staleEmbeddedNormalization)).toEqual(
      pins.staleSiOutputNormalizationV1,
    );
    expect(ledger.staleConsumers).toHaveLength(3);
    expect(
      ledger.staleConsumers.every(
        (entry) =>
          entry.integrationRepaired === false &&
          entry.embeddedNormalization.sha256 ===
            pins.staleSiOutputNormalizationV1.semanticSha256 &&
          entry.embeddedNormalization.canonicalSizeBytes ===
            pins.staleSiOutputNormalizationV1.canonicalSizeBytes,
      ),
    ).toBe(true);
    expect(ledger).toMatchObject({
      finalSiV2MayBeClaimedTransitivelyIntegrated: false,
      successorScienceDefinitionIntegrationComplete: false,
      additiveSuccessorsRequiredBeforeCandidateAdmission: true,
    });
  });

  it("freezes exactly 68 physical files per lane without duplicating 21 aliases", () => {
    const output = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2.outputAbi;
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_NONCONSTRAINT_PHYSICAL_FILE_COUNT,
    ).toBe(5);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_REGULATOR_LEVEL_COUNT,
    ).toBe(3);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONSTRAINT_OPERANDS_PER_LEVEL,
    ).toBe(21);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONSTRAINT_PHYSICAL_FILE_COUNT,
    ).toBe(63);
    expect(5 + 3 * 21).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PHYSICAL_FILE_COUNT_PER_LANE,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
    ).toHaveLength(68);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES,
    ).toHaveLength(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CENTRAL_ALIAS_COUNT_PER_LANE,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES.every(
        (alias) => alias.additionalPhysicalFile === false,
      ),
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_ALIAS_ADDITIONAL_PHYSICAL_FILE_COUNT,
    ).toBe(0);
    expect(output.perLane).toEqual({
      exactNonconstraintPhysicalFileCount: 5,
      exactRegulatorLevelCount: 3,
      exactConstraintOperandCountPerLevel: 21,
      exactConstraintPhysicalFileCount: 63,
      exactPhysicalFileCount: 68,
      exactCentralLogicalAliasCount: 21,
      exactAdditionalPhysicalFileCountFromAliases: 0,
      exactFloat64ValueCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_VALUE_COUNT_PER_LANE,
      exactByteCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BYTE_COUNT_PER_LANE,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_VALUE_COUNT_PER_LANE,
    ).toBe(836_672);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BYTE_COUNT_PER_LANE,
    ).toBe(6_693_376);
  });

  it("freezes the future pair arithmetic without claiming either lane exists", () => {
    const futurePair =
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2.outputAbi.futurePair;
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_PHYSICAL_FILE_COUNT,
    ).toBe(136);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_ROLE_COUNT,
    ).toBe(68);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_BYTE_COUNT,
    ).toBe(13_386_752);
    expect(futurePair).toEqual({
      exactLaneCount: 2,
      exactPhysicalFileCount: 136,
      exactPairedRoleCount: 68,
      exactByteCount: 13_386_752,
      exactCheckAndToleranceOutcomeCount: 30,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_OUTPUT_INSTANCE_COUNT,
    ).toBe(0);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2.outputAbi
        .exactOutputInstanceCount,
    ).toBe(0);
  });

  it("keeps all underdetermined scientific choices and all output instances null", () => {
    const freeze = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2;
    expect(allNullLeaves(freeze.unresolvedScientificChoices)).toBe(true);
    expect(freeze.outputScientificInstances.meanNoise).toHaveLength(4);
    expect(
      freeze.outputScientificInstances.meanNoise.map((entry) => entry.role),
    ).toEqual([
      "noise_kernel",
      "noise_kernel_absolute_uncertainty95",
      "mean_rset",
      "mean_rset_absolute_uncertainty95",
    ]);
    expect(
      freeze.outputScientificInstances.meanNoise.every(
        (entry) => entry.rawBinding === null && entry.values === null,
      ),
    ).toBe(true);
    expect(
      freeze.outputScientificInstances.constraintOperands
        .rawBindingsInSchemaOrder,
    ).toHaveLength(63);
    expect(
      freeze.outputScientificInstances.constraintOperands.rawBindingsInSchemaOrder.every(
        (entry) => entry === null,
      ),
    ).toBe(true);
    expect(
      freeze.outputScientificInstances.constraintOperands.decodedValues,
    ).toBeNull();
    expect(
      freeze.outputScientificInstances.smearingWeights.outputRawBinding,
    ).toBeNull();
    expect(
      freeze.outputScientificInstances.smearingWeights.outputValues,
    ).toBeNull();
    expect(
      freeze.outputScientificInstances.smearingWeights.frozenSourceRawPayload,
    ).toEqual({
      sha256:
        "25493ecc62734a68fad443881a595d122cb7a93ddf9d07e5ec2060baf84f03fd",
      sizeBytes: 512,
    });
  });

  it("keeps the 23-entry scientific inventory, runtime, preseal and replay absent", () => {
    const freeze = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2;
    expect(freeze.scientificInputInventoryBoundary).toMatchObject({
      candidateManifestRawEntryCount: 1,
      exactNonSelfScientificInputCount: 22,
      exactTotalScientificInputCount: 23,
      candidateManifestMustBeCanonicalUtf8Bytes: true,
      candidateManifestSelfHashFieldForbidden: true,
      externalRawHashAndSizeMustOccupyInputOrdinalZero: true,
      candidateManifestObservedRawBinding: null,
      stagedScientificInputInventory: null,
      scientificInputClosureReceipt: null,
    });
    expect(allNullLeaves(freeze.runtimePresealAndReplayInstances)).toBe(true);
    expect(freeze.outputAbi.outputRoot).toBeNull();
    expect(freeze.outputAbi.outputManifest).toBeNull();
    expect(freeze.outputAbi.physicalFileRawBindings).toBeNull();
  });

  it("does not duplicate the output skeleton, execution adapter or receipt issuer", () => {
    const freeze = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2;
    expect(freeze.outputAbi.definitionOnlyNoSkeletonDuplication).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(
        freeze.outputAbi,
        "physicalFileDescriptors",
      ),
    ).toBe(false);
    expect(
      Object.entries(freeze.ownershipBoundary)
        .filter(([, value]) => typeof value === "boolean")
        .every(([, value]) => value === false),
    ).toBe(true);
  });

  it("keeps every readiness, authority, lamp and physical claim false", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2.authorityLocks,
    ).toEqual(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_AUTHORITY_LOCKS);
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2.authorityLocks,
      ).every((value) => value === false),
    ).toBe(true);
  });

  it("accepts only the bounded exact canonical primitive string", () => {
    const wire = cloneNhm2SphericalBosonStarV2CandidateFreezeV2CanonicalWire();
    expect(typeof wire).toBe("string");
    expect(wire).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_JSON,
    );
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeV2WireViolations(wire),
    ).toEqual([]);
    expect(isNhm2SphericalBosonStarV2CandidateFreezeV2Wire(wire)).toBe(true);

    expect(
      nhm2SphericalBosonStarV2CandidateFreezeV2WireViolations(
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2,
      ),
    ).toEqual([
      "spherical_v2_candidate_freeze_v2_wire_must_be_primitive_string",
    ]);
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeV2WireViolations(new String(wire)),
    ).toEqual([
      "spherical_v2_candidate_freeze_v2_wire_must_be_primitive_string",
    ]);
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeV2WireViolations(`${wire} `),
    ).toEqual(["spherical_v2_candidate_freeze_v2_canonical_wire_mismatch"]);
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeV2WireViolations(
        JSON.stringify(JSON.parse(wire), null, 2),
      ),
    ).toEqual(["spherical_v2_candidate_freeze_v2_canonical_wire_mismatch"]);
  });

  it("rejects wrappers and bounds UTF-16 and UTF-8 before comparison", () => {
    let traps = 0;
    const proxy = new Proxy(
      { wire: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_JSON },
      {
        ownKeys(target) {
          traps += 1;
          return Reflect.ownKeys(target);
        },
      },
    );
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeV2WireViolations(proxy),
    ).toEqual([
      "spherical_v2_candidate_freeze_v2_wire_must_be_primitive_string",
    ]);
    expect(traps).toBe(0);

    expect(
      nhm2SphericalBosonStarV2CandidateFreezeV2WireViolations(
        "x".repeat(
          NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_VALIDATOR_LIMITS.maximumWireUtf16CodeUnits +
            1,
        ),
      ),
    ).toEqual(["spherical_v2_candidate_freeze_v2_wire_utf16_limit"]);
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeV2WireViolations(
        "💥".repeat(40_000),
      ),
    ).toEqual(["spherical_v2_candidate_freeze_v2_wire_utf8_limit"]);
  });

  it("deep-freezes the exported semantic singleton", () => {
    expect(deepFrozen(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2)).toBe(
      true,
    );
  });
});
