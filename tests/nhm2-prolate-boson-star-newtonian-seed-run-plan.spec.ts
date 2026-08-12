import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING } from "../shared/contracts/nhm2-prolate-boson-star-branch-bvp.v1";
import { NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING } from "../shared/contracts/nhm2-prolate-boson-star-coherent-candidate-plan.v2";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
} from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed.v1";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BASE_INPUT_PROFILE,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_EXPECTED_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_SHA256_DOMAIN,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_ENVIRONMENT,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_EXPECTED_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_OUTPUT_INVENTORY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256_DOMAIN,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VALIDATOR_LIMITS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_EXPECTED_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_SHA256_DOMAIN,
  isNhm2ProlateBosonStarNewtonianSeedRunPlanV1,
  nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations,
} from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v1";

const PLAN = NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1;
const clone = (): Record<string, any> =>
  JSON.parse(JSON.stringify(PLAN)) as Record<string, any>;

const expectDeepFrozen = (value: unknown): void => {
  if (value === null || typeof value !== "object") return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value as Record<string, unknown>)) {
    expectDeepFrozen(child);
  }
};

describe("NHM2 prolate boson-star Newtonian seed run plan v1", () => {
  it("binds the authoritative candidate, BVP, and seed canonical singletons", () => {
    expect(PLAN.bindings.candidatePlanV2.canonicalBinding).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
    );
    expect(PLAN.bindings.branchBvpV1.canonicalBinding).toBe(
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING,
    );
    expect(PLAN.bindings.newtonianSeedV1.canonicalBinding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
    );
    expect(
      PLAN.bindings.seedOutputAndProofProtocol.outputDescriptorSchemaBinding,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
    );
    expect(
      PLAN.bindings.seedOutputAndProofProtocol.proofReplayProtocolBinding,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
    );
    expect(
      PLAN.bindings.seedOutputAndProofProtocol
        .controlPlaneEvidenceGrammarRegistryBinding,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
    );
    expect(PLAN.controlPlaneEvidenceGrammar.registry).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY,
    );
    expect(PLAN.bindings.candidatePlanV2.canonicalBinding).toEqual({
      artifactId: "nhm2.prolate_boson_star_coherent_candidate_plan",
      candidateId:
        "nhm2.semiclassical_v3.prolate_boson_star_2p_weak_field_plan/v2",
      contractVersion: "nhm2_prolate_boson_star_coherent_candidate_plan/v2",
      sha256Domain: "nhm2-prolate-boson-star-coherent-candidate-plan/v2\n",
      sha256:
        "945290005dced13762a8972e725ac72bb2006eda88f5537ec3a231c848122f14",
      canonicalSizeBytes: 134951,
    });
    expect(PLAN.bindings.branchBvpV1.canonicalBinding).toEqual({
      artifactId: "nhm2.prolate_boson_star_branch_bvp",
      contractVersion: "nhm2_prolate_boson_star_branch_bvp/v1",
      sha256Domain: "nhm2-prolate-boson-star-branch-bvp/v1\n",
      sha256:
        "4c6d460b8dc83719c590cc24caed9f8e8ad91474528efaacb334226a391c6747",
      canonicalSizeBytes: 17355,
    });
    expect(PLAN.bindings.newtonianSeedV1.canonicalBinding).toEqual({
      artifactId: "nhm2.prolate_boson_star_newtonian_seed",
      contractVersion: "nhm2_prolate_boson_star_newtonian_seed/v1",
      sha256Domain: "nhm2-prolate-boson-star-newtonian-seed/v1\n",
      sha256:
        "e839a670e57fad1a445d61d88d2ebc49796af33f78fb752103bded74bbd121ea",
      canonicalSizeBytes: 50226,
    });
    expect(
      PLAN.bindings.seedOutputAndProofProtocol.outputDescriptorSchemaBinding,
    ).toEqual({
      artifactId:
        "nhm2.prolate_boson_star_newtonian_seed.output_descriptor_schema",
      schemaVersion:
        "nhm2.prolate_boson_star.newtonian_2p_seed.output_descriptor_schema/v1",
      sha256Domain:
        "nhm2-prolate-boson-star-newtonian-seed-output-descriptor-schema/v1\n",
      sha256:
        "deb52c3d2d80f63a4b98dfb8e6ec9180a0d5063e27d2310d59ec0cddf294ab58",
      canonicalSizeBytes: 56194,
    });
    expect(
      PLAN.bindings.seedOutputAndProofProtocol.proofReplayProtocolBinding,
    ).toEqual({
      artifactId:
        "nhm2.prolate_boson_star_newtonian_seed.proof_replay_protocol",
      protocolVersion:
        "nhm2.prolate_boson_star_newtonian_seed.proof_replay_protocol/v1",
      sha256Domain:
        "nhm2-prolate-boson-star-newtonian-seed-proof-replay-protocol/v1\n",
      sha256:
        "c6a97e35d9838ff8c5a49f75b4bdc7b5b3adc59df8d32a3d17bd96ef14ecd29b",
      canonicalSizeBytes: 46365,
    });
  });

  it("closes exactly 32 imported arrays followed by one descriptor commit marker", () => {
    const inventory =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_OUTPUT_INVENTORY;
    expect(inventory).toBe(PLAN.outputPolicy.inventory);
    expect(inventory).toHaveLength(33);
    const arrays = inventory.slice(0, 32);
    expect(
      arrays.map((entry) => {
        if (entry.kind !== "array") throw new Error("array output expected");
        return {
          relativePath: entry.relativePath,
          role: entry.role,
          shape: entry.shape,
          byteLength: entry.exactByteLength,
        };
      }),
    ).toEqual(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
        (entry) => ({
          relativePath: entry.relativePath,
          role: entry.role,
          shape: entry.shape,
          byteLength: entry.byteLength,
        }),
      ),
    );
    expect(arrays.every((entry) => entry.kind === "array")).toBe(true);
    expect(
      arrays.every(
        (entry) =>
          entry.kind === "array" &&
          entry.producerWriterStage === "untrusted_seed_producer" &&
          entry.producerDestinationClass === "staging_only" &&
          entry.finalContainerWriterStage === "trusted_descriptor_assembler" &&
          entry.assemblerMustCopyVerifiedBytesExactly,
      ),
    ).toBe(true);
    expect(arrays.map((entry) => entry.writeOrderIndex)).toEqual(
      Array.from({ length: 32 }, (_, index) => index),
    );
    expect(new Set(inventory.map((entry) => entry.relativePath)).size).toBe(33);
    expect(inventory[32]).toEqual(
      expect.objectContaining({
        kind: "descriptor",
        writeOrderIndex: 32,
        relativePath: "seed-descriptor.canonical.json",
        writerStage: "trusted_descriptor_assembler",
        producerMayCreate: false,
        verifierMayCreate: false,
        createdOnlyAfterAllThirtyTwoVerifiedArraysCopiedClosedAndFsynced: true,
        temporaryFileOrRenameAllowed: false,
        actsAsLastWriteCommitMarkerOnly: true,
        exactRecursiveSchemaValidationRequired: true,
        rawBytesMustEqualRecanonicalizedUtf8BytesExactly: true,
        byteOrderMarkTrailingWhitespaceAndAlternateJsonSpellingsAllowed: false,
        canonicalByteEqualityRequiredBeforeLastWriteCommitMarkerAdmission: true,
        outputDescriptorSchemaBinding:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
        proofReplayProtocolBinding:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
        requiredServerReplayedReceiptFields: [
          "continuousNodelessProofReceipt",
          "continuousPeakProofReceipt",
          "numericalOriginSeriesDefectReceipt",
        ],
      }),
    );
    expect(PLAN.outputPolicy).toMatchObject({
      finalOutputMountPath: "/run/output",
      assemblerOutputMountIsOnlyWritableMount: true,
      descriptorLast: true,
      closedInventory: true,
      extraFilesDirectoriesSocketsDevicesOrPipesAllowed: false,
      arrayCount: 32,
      totalFileCount: 33,
      exactArrayByteLength: 6_482_304,
    });
    expect(PLAN.outputPolicy.producerStaging).toMatchObject({
      writerStage: "untrusted_seed_producer",
      root: "/run/staging",
      exactFileCount: 32,
      descriptorPathMustNotExist: "seed-descriptor.canonical.json",
      receiptsGateReportsLogsTempFilesOrOtherWritesAllowed: false,
      grantsArtifactOrGateAuthority: false,
    });
    expect(
      PLAN.outputPolicy.producerStaging.exactRelativeFilePathOrder,
    ).toEqual(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
        ({ relativePath }) => relativePath,
      ),
    );
    expect(PLAN.outputPolicy.verifierReplay).toMatchObject({
      writerStage: "trusted_independent_verifier",
      root: "/run/replay",
      exactFileCount: 1,
      exactPermittedFilePath:
        "/run/replay/seed-verifier-replay-bundle.canonical.json",
      descriptorPathMayNotBeCreated: true,
      grantsFinalArtifactAuthority: false,
      replayBundle: null,
    });
    expect(PLAN.outputPolicy.trustedFinalAssembly).toMatchObject({
      writerStage: "trusted_descriptor_assembler",
      root: "/run/output",
      rootMustBeFreshAndIdentityDistinctFromStagingAndReplayRoots: true,
      arraysCopiedExclusivelyInImportedInventoryOrder: true,
      descriptorCreatedExclusivelyAsTheLastWrite: true,
      exactFileCount: 33,
      assemblerEnforcementReceiptBinding: null,
      admitted: false,
    });
    expect(PLAN.outputPolicy.seedContainerClosure).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
        .containerClosure,
    );
    expect(PLAN.outputPolicy.seedContainerClosure.descriptorRelativePath).toBe(
      "seed-descriptor.canonical.json",
    );
    expect(PLAN.outputPolicy.expectedFilePathOrder).toEqual([
      "seed-descriptor.canonical.json",
      ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
        ({ relativePath }) => relativePath,
      ),
    ]);
    expect(PLAN.outputPolicy.expectedDirectories).toEqual([
      "arrays",
      "arrays/L0",
      "arrays/L1",
      "arrays/L2",
      "arrays/AUDIT",
    ]);
    expect(PLAN.outputPolicy.descriptorByteAdmission).toEqual({
      rawBytesReadBeforeJsonAuthority: true,
      recursiveSchemaValidationUsesAuthoritativeImportedBinding: true,
      parsedValueRecanonicalizedUnderFrozenSeedCanonicalization: true,
      recanonicalizedUtf8MustEqualRawBytesByteForByte: true,
      byteOrderMarkTrailingWhitespaceAndAlternateJsonSpellingsReject: true,
      equalityRequiredBeforeDescriptorLastWriteAdmission: true,
    });
    expect(PLAN.outputPolicy.exactArrayByteLength).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS.byteLength,
    );
  });

  it("freezes an exact shell-free isolated Python invocation and environment", () => {
    expect(PLAN.invocation).toMatchObject({
      stageId: "untrusted_seed_producer",
      executionTarget: "external_linux_oci_cgroup_v2_worker",
      executableAbsolutePath: "/opt/nhm2-producer/toolchain/python/bin/python3",
      argvAfterExecutable: [
        "-I",
        "-S",
        "-B",
        "-X",
        "utf8",
        "/opt/nhm2-producer/source/producer/bootstrap.py",
        "--input-manifest",
        "/run/input/00-seed-run-request.v1.json",
        "--output-root",
        "/run/staging",
      ],
      workingDirectory: "/run/staging",
      writesOnlyExactThirtyTwoStagingArrays: true,
      descriptorReceiptOrGateReportWritesAllowed: false,
      shellAllowed: false,
      inheritedEnvironmentAllowed: false,
      launchApi: null,
      callbackApi: null,
      remoteExecutionApi: null,
    });
    expect(PLAN.invocation.environment).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_ENVIRONMENT,
    );
    expect(PLAN.invocation.environmentAllowlist).toEqual(
      Object.keys(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_ENVIRONMENT,
      ).sort(),
    );
    expect(Object.values(PLAN.invocation.environment)).toContain("1");
    expect(PLAN.invocation.forbiddenAmbientVariables).toEqual(
      expect.arrayContaining([
        "PATH",
        "PYTHONPATH",
        "PYTHONHOME",
        "VIRTUAL_ENV",
      ]),
    );
    expect(PLAN.trustedStageInvocations.verifier).toMatchObject({
      stageId: "trusted_independent_verifier",
      executableAbsolutePath: "/opt/nhm2-verifier/toolchain/python/bin/python3",
      workingDirectory: "/run/replay",
      shellAllowed: false,
      inheritedEnvironmentAllowed: false,
      launchApi: null,
      callbackApi: null,
      remoteExecutionApi: null,
    });
    expect(PLAN.trustedStageInvocations.assembler).toMatchObject({
      stageId: "trusted_descriptor_assembler",
      executableAbsolutePath:
        "/opt/nhm2-assembler/toolchain/python/bin/python3",
      workingDirectory: "/run/output",
      shellAllowed: false,
      inheritedEnvironmentAllowed: false,
      launchApi: null,
      callbackApi: null,
      remoteExecutionApi: null,
    });
    expect(PLAN.stageSequence.exactStageOrder).toEqual([
      "untrusted_seed_producer",
      "trusted_independent_verifier",
      "trusted_descriptor_assembler",
    ]);
    expect(PLAN.stageSequence).toMatchObject({
      concurrentStageExecutionAllowed: false,
      runWideWallDeadlineCoversAllStagesAndFinalReread: true,
      producer: {
        exactPermittedWrites: "thirty_two_imported_seed_array_files_only",
        descriptorReceiptGateReportOrFinalOutputWritesAllowed: false,
      },
      verifier: {
        stagingAndBaseInputAccess:
          "read_only_fixed_imported_inventory_plus_server_observed_hash_size_shape_dtype_order_reread",
        exactPermittedWrite:
          "/run/replay/seed-verifier-replay-bundle.canonical.json",
        seedDescriptorWritesAllowed: false,
      },
      assembler: {
        copiesOnlyVerifierAdmittedArrayBytesExclusively: true,
        writesExactCanonicalDescriptorExclusivelyAfterArrayFsyncs: true,
        producerOrVerifierSourceRuntimeImportsAllowed: false,
      },
      finalAdmission: { receipt: null, accepted: false },
    });
  });

  it("closes directory ownership, secure rereads, and every output byte surface", () => {
    const preparation = PLAN.outputPolicy.directoryPreparationPolicy;
    expect(preparation.exclusiveOwner).toBe(
      "trusted_broker_outside_all_three_stage_runtimes",
    );
    expect(preparation.stagingPrestate.exactDirectoryCreationPathOrder).toEqual(
      [
        "/run/staging",
        "/run/staging/arrays",
        "/run/staging/arrays/L0",
        "/run/staging/arrays/L1",
        "/run/staging/arrays/L2",
        "/run/staging/arrays/AUDIT",
      ],
    );
    expect(
      preparation.finalOutputPrestate.exactDirectoryCreationPathOrder,
    ).toEqual([
      "/run/output",
      "/run/output/arrays",
      "/run/output/arrays/L0",
      "/run/output/arrays/L1",
      "/run/output/arrays/L2",
      "/run/output/arrays/AUDIT",
    ]);
    expect(preparation).toMatchObject({
      stagingPrestate: {
        rootMustBeNewlyCreatedAndPreviouslyAbsent: true,
        exactDirectoriesObservedWithNoFilesOrOtherEntries: true,
        receipt: null,
      },
      replayPrestate: { rootObservedEmpty: true, receipt: null },
      attestationPrestate: {
        rootObservedEmptyBeforeExclusiveBrokerReceiptWrite: true,
        receipt: null,
      },
      finalOutputPrestate: {
        rootMustBeNewlyCreatedAndPreviouslyAbsent: true,
        exactDirectoriesObservedWithNoFilesOrOtherEntries: true,
        receipt: null,
      },
      stagingReplayAttestationAndFinalRootsMustBePairwiseIdentityDistinct: true,
      bindMountJunctionSymlinkHardlinkOrPathAliasCollisionsAllowed: false,
      preparationReceiptBundle: null,
      established: false,
    });
    expect(PLAN.outputPolicy.secureFileObservationProtocol).toMatchObject({
      acceptedFileType: "regular_file_only",
      symlinksHardlinksDevicesFifosSocketsOrOtherSpecialFilesAllowed: false,
      requiredLinkCount: 1,
      preOpenPathStatOpenHandleStatPostReadHandleStatAndPostReadPathStatRequired: true,
      everyIdentityAndTimeFieldMustRemainEqualAcrossStatReadStat: true,
      assemblerSourceAndDestinationByteLengthAndSha256MustMatchExactly: true,
      anyMismatchReplacementMutationOrExtraEntryFailsClosed: true,
      observationBindings: {
        brokerStagingInputLedger: null,
        verifierStagingReplay: null,
        assemblerSourceAndDestination: null,
        finalContainer: null,
      },
      passed: false,
    });
    expect(PLAN.observationCapturePolicy.perStage).toEqual({
      producer: {
        maximumStdoutBytes: 1_048_576,
        maximumStderrBytes: 1_048_576,
        maximumCombinedCaptureBytes: 2_097_152,
        maximumFilesystemOutputBytes: 6_482_304,
        maximumCombinedCaptureAndFilesystemOutputBytes: 8_579_456,
      },
      verifier: {
        maximumStdoutBytes: 1_048_576,
        maximumStderrBytes: 1_048_576,
        maximumCombinedCaptureBytes: 2_097_152,
        maximumFilesystemOutputBytes: 16_777_216,
        maximumCombinedCaptureAndFilesystemOutputBytes: 18_874_368,
      },
      assembler: {
        maximumStdoutBytes: 1_048_576,
        maximumStderrBytes: 1_048_576,
        maximumCombinedCaptureBytes: 2_097_152,
        maximumFilesystemOutputBytes: 23_259_520,
        maximumCombinedCaptureAndFilesystemOutputBytes: 25_356_672,
      },
    });
    expect(PLAN.observationCapturePolicy).toMatchObject({
      brokerEnforcementReceiptMaximumUtf8Bytes: 1_048_576,
      overflowAction: "kill_active_stage_cgroup_and_wait_for_populated_zero",
      truncationOrOverflowCanNeverBeAdmitted: true,
      receiptBindings: {
        producer: null,
        verifier: null,
        assembler: null,
      },
    });
    expect(PLAN.outputPolicy.verifierReplay.maximumCanonicalUtf8Bytes).toBe(
      16_777_216,
    );
    expect(
      PLAN.isolatedWorkerCapabilityRequirements.verifierPostExitReceiptClosure
        .maximumCanonicalUtf8Bytes,
    ).toBe(1_048_576);
    expect(PLAN.stageSequence.verifier).toMatchObject({
      derivesItsScientificOperatorsIndependentlyFromTheFrozenSeedBvpAndProofProtocol: true,
      producerSourceDiagnosticsOrRuntimeImportsAllowed: false,
    });
    expect(PLAN.stageSequence.finalAdmission).toMatchObject({
      sourceReplayBundleMustBeTheExactInstanceBoundByTheVerifierPostExitReceipt: true,
      everyProjectedSourceAndTargetCanonicalUtf8ByteStringAndRecursiveValueMustMatch: true,
      observedArrayInventoryMustEqualDescriptorArrayInventoryInAllTwelveFieldsAndFinalRawBytes: true,
      assemblerEnforcementEndNotAfterDescriptorPhaseStart: true,
      projectionEqualityReceipt: null,
      accepted: false,
    });
  });

  it("requires exact closed inputs and three separately sealed stage ledgers", () => {
    expect(PLAN.inputClosure.duties.map(({ id }) => id)).toEqual([
      "seed_run_request",
      "candidate_plan_v2_canonical_bytes",
      "branch_bvp_v1_canonical_bytes",
      "newtonian_seed_v1_canonical_bytes",
      "proof_replay_protocol_canonical_bytes",
      "output_descriptor_schema_canonical_bytes",
      "verifier_replay_bundle_schema_canonical_bytes",
      "control_plane_evidence_grammar_registry_canonical_bytes",
    ]);
    expect(PLAN.inputClosure).toMatchObject({
      requiredFileCount: 8,
      baseInputProfileCount: 8,
      firstEightStageLedgerObservationsMustMatchProfileOneToOne: true,
      requiredExplicitDirectoryPathOrder: [],
      exactClosedFileInventoryRequired: true,
      extraFilesOrDirectoriesAllowed: false,
      everyFileRequiresSha256AndByteLength: true,
      symlinksReparsePointsAndHardlinksAllowed: false,
      mountAccess: "read_only",
      seedRunRequestBinding: null,
      inputLedgerBinding: null,
      inputClosureManifestBinding: null,
      runRequestBinding: null,
      sealed: false,
    });
    expect(PLAN.inputClosure.requiredFilePathOrder).toEqual(
      PLAN.inputClosure.duties.map(({ relativePath }) => relativePath),
    );
    expect(PLAN.inputClosure.runRequestExactKeyOrder).toEqual([
      "schemaVersion",
      "runPlanBinding",
      "candidatePlanV2Binding",
      "branchBvpV1Binding",
      "seedContractBinding",
      "outputDescriptorSchemaBinding",
      "proofReplayProtocolBinding",
      "verifierReplayBundleSchemaBinding",
      "controlPlaneEvidenceGrammarRegistryBinding",
      "isolatedWorkerCapabilityBinding",
      "schedulerLeaseBinding",
      "producerSourceManifestBinding",
      "producerSourceLedgerBinding",
      "producerToolchainManifestBinding",
      "producerToolchainLedgerBinding",
      "producerSeccompPolicyBinding",
      "producerQuotaCapabilityBinding",
      "producerOciImageDigest",
      "verifierSourceManifestBinding",
      "verifierSourceLedgerBinding",
      "verifierToolchainManifestBinding",
      "verifierToolchainLedgerBinding",
      "verifierSeccompPolicyBinding",
      "verifierQuotaCapabilityBinding",
      "verifierOciImageDigest",
      "assemblerSourceManifestBinding",
      "assemblerSourceLedgerBinding",
      "assemblerToolchainManifestBinding",
      "assemblerToolchainLedgerBinding",
      "assemblerSeccompPolicyBinding",
      "assemblerQuotaCapabilityBinding",
      "assemblerOciImageDigest",
      "crossStageSeparationReceiptBinding",
      "verifierProofKernelBinding",
      "verifierMpfrGmpRuntimeBinding",
      "stageInputLedgerConstructionPolicyBinding",
      "exactOutputInventoryBinding",
    ]);
    expect(PLAN.inputClosure.runRequestSha256Domain).toBe(
      "nhm2-prolate-boson-star-newtonian-seed-run-request/v1\n",
    );
    expect(PLAN.stageClosures.exactStageOrder).toEqual([
      "untrusted_seed_producer",
      "trusted_independent_verifier",
      "trusted_descriptor_assembler",
    ]);
    expect(PLAN.stageClosures.producer.duties.map(({ id }) => id)).toEqual([
      "oci_image_manifest_config_and_layers",
      "base_os_and_dynamic_loader_closure",
      "cpython_runtime_closure",
      "numpy_runtime_closure",
      "scipy_runtime_closure",
      "blas_lapack_runtime_closure",
      "producer_bootstrap_and_import_policy",
      "seed_solver_and_discretization_source",
      "staging_array_serializer",
      "producer_runtime_sbom_and_dependency_lock",
      "producer_seccomp_profile",
    ]);
    expect(PLAN.stageClosures.verifier.duties.map(({ id }) => id)).toEqual([
      "verifier_oci_image_manifest_config_and_layers",
      "verifier_base_os_and_dynamic_loader_closure",
      "verifier_runtime_and_numerics_closure",
      "secure_staging_array_reader_and_rehasher",
      "independent_seed_gate_replayer",
      "mpfr_gmp_continuous_proof_kernel",
      "sealed_replay_bundle_serializer",
      "verifier_runtime_sbom_and_dependency_lock",
      "verifier_seccomp_profile",
    ]);
    expect(PLAN.stageClosures.assembler.duties.map(({ id }) => id)).toEqual([
      "assembler_oci_image_manifest_config_and_layers",
      "assembler_base_os_and_dynamic_loader_closure",
      "assembler_minimal_runtime_closure",
      "verified_array_exclusive_copier",
      "descriptor_schema_validator",
      "canonical_descriptor_last_writer",
      "assembler_runtime_sbom_and_dependency_lock",
      "assembler_seccomp_profile",
    ]);
    expect(PLAN.stageClosures.producer).toMatchObject({
      requiredInputFileCount: 8,
      requiredExplicitDirectoryPathOrder: [],
      extraInputFilesOrDirectoriesAllowed: false,
      sourceManifestBinding: null,
      sourceLedgerBinding: null,
      toolchainManifestBinding: null,
      toolchainLedgerBinding: null,
      inputLedgerBinding: null,
      selectedPythonRuntime: null,
      selectedNumpyRuntime: null,
      selectedScipyRuntime: null,
      selectedBlasLapackRuntime: null,
      ociImageDigest: null,
      sealed: false,
    });
    expect(PLAN.stageClosures.verifier).toMatchObject({
      requiredInputFileCount: 40,
      sourceManifestBinding: null,
      sourceLedgerBinding: null,
      toolchainManifestBinding: null,
      toolchainLedgerBinding: null,
      inputLedgerBinding: null,
      ociImageDigest: null,
      selectedVerifierRuntime: null,
      importsFromProducerOrAssemblerSourceAllowed: false,
      sealed: false,
    });
    expect(
      PLAN.stageClosures.verifier.requiredExplicitDirectoryPathOrder,
    ).toEqual([
      "/run/staging/arrays",
      "/run/staging/arrays/L0",
      "/run/staging/arrays/L1",
      "/run/staging/arrays/L2",
      "/run/staging/arrays/AUDIT",
    ]);
    expect(PLAN.stageClosures.assembler).toMatchObject({
      requiredInputFileCount: 42,
      sourceManifestBinding: null,
      sourceLedgerBinding: null,
      toolchainManifestBinding: null,
      toolchainLedgerBinding: null,
      inputLedgerBinding: null,
      ociImageDigest: null,
      selectedAssemblerRuntime: null,
      importsFromProducerOrVerifierSourceAllowed: false,
      sealed: false,
    });
    expect(
      PLAN.stageClosures.assembler.requiredExplicitDirectoryPathOrder,
    ).toEqual([
      "/run/staging/arrays",
      "/run/staging/arrays/L0",
      "/run/staging/arrays/L1",
      "/run/staging/arrays/L2",
      "/run/staging/arrays/AUDIT",
      "/run/replay",
      "/run/attestation",
    ]);
    expect(
      PLAN.stageClosures.assembler.requiredInputFilePathOrder.slice(-2),
    ).toEqual([
      "/run/replay/seed-verifier-replay-bundle.canonical.json",
      "/run/attestation/verifier-stage-enforcement-receipt.canonical.json",
    ]);
    expect(
      PLAN.stageClosures.crossStageIsolation
        .pairwiseDistinctNonNullBindingsRequiredBeforeProducerLaunch,
    ).toEqual([
      "sourceManifestBinding",
      "sourceLedgerBinding",
      "toolchainManifestBinding",
      "toolchainLedgerBinding",
      "ociImageDigest",
    ]);
    expect(PLAN.stageClosures.crossStageIsolation).toMatchObject({
      sourceImportsAcrossStagesAllowed: false,
      sharedExecutableOrRuntimeLedgerAuthorityAllowed: false,
      sharedInProcessAddressSpaceAllowed: false,
      dynamicPluginOrCallbackLoadingAcrossStagesAllowed: false,
      onlyHashBoundContractAndDataArtifactsMayCrossStageBoundaries: true,
      separationReceiptBinding: null,
      established: false,
    });
    expect(
      PLAN.inputClosure
        .futureVerifierOrAssemblerInputLedgerDigestMayAppearInRunRequest,
    ).toBe(false);
    expect(
      PLAN.inputClosure
        .runtimeLaunchEnvelopeOrPriorStageReceiptMayAppearInRunRequest,
    ).toBe(false);
    expect(PLAN.inputClosure.baseInputProfile).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BASE_INPUT_PROFILE,
    );
    expect(PLAN.inputClosure.baseInputProfile).toHaveLength(8);
    expect(PLAN.inputClosure.baseInputProfile[0]).toMatchObject({
      ordinal: 0,
      absolutePath: "/run/input/00-seed-run-request.v1.json",
      binding: null,
      rawCanonicalUtf8Sha256: null,
      canonicalSizeBytes: null,
      resolvedFromStageInputLedgerRunRequestBindingBeforeStageLaunch: true,
    });
    expect(
      PLAN.inputClosure.baseInputProfile
        .slice(1)
        .every(
          (entry) =>
            entry.binding !== null &&
            /^[0-9a-f]{64}$/.test(entry.rawCanonicalUtf8Sha256) &&
            entry.canonicalSizeBytes === entry.binding.canonicalSizeBytes,
        ),
    ).toBe(true);
    for (const stage of ["producer", "verifier", "assembler"] as const) {
      expect(
        PLAN.stageClosures[stage].requiredInputFilePathOrder.slice(0, 8),
      ).toEqual(
        PLAN.inputClosure.baseInputProfile.map(
          ({ absolutePath }) => absolutePath,
        ),
      );
      const dutyIds = new Set(
        PLAN.stageClosures[stage].duties.map(({ id }) => id),
      );
      expect(
        [
          ...PLAN.stageClosures[stage].sourceDutyProfile,
          ...PLAN.stageClosures[stage].toolchainDutyProfile,
        ].every(({ dutyId }) => dutyIds.has(dutyId)),
      ).toBe(true);
    }
    expect(PLAN.stageInputLedgerAndLaunchEnvelopePolicy).toMatchObject({
      inputLedgerSha256Domains: {
        producer:
          "nhm2-prolate-boson-star-newtonian-seed-producer-input-ledger/v1\n",
        verifier:
          "nhm2-prolate-boson-star-newtonian-seed-verifier-input-ledger/v1\n",
        assembler:
          "nhm2-prolate-boson-star-newtonian-seed-assembler-input-ledger/v1\n",
      },
      producer: {
        priorStageReceiptBindingsExactLength: 0,
        launchRequiresSealedInputLedgerAndEnvelope: true,
      },
      verifier: {
        priorStageReceiptBindings: [
          "producer_enforcement_receipt_binding",
          "staging_prestate_receipt_binding",
        ],
        launchRequiresSealedInputLedgerAndEnvelope: true,
      },
      assembler: {
        priorStageReceiptBindings: [
          "producer_enforcement_receipt_binding",
          "verifier_enforcement_receipt_binding",
          "verifier_replay_bundle_binding",
          "final_output_prestate_receipt_binding",
        ],
        launchRequiresSealedInputLedgerAndEnvelope: true,
      },
      eachStageEnforcementReceiptMustBindExactLaunchEnvelopeSha256: true,
      commonRunRequestMayBindOnlyThisConstructionPolicyNotFutureLedgerDigests: true,
      producerInputLedgerBinding: null,
      verifierInputLedgerBinding: null,
      assemblerInputLedgerBinding: null,
      producerLaunchEnvelopeBinding: null,
      verifierLaunchEnvelopeBinding: null,
      assemblerLaunchEnvelopeBinding: null,
    });
  });

  it("requires an attested OCI/cgroup-v2 capability with the frozen resource rails", () => {
    const capability = PLAN.isolatedWorkerCapabilityRequirements;
    expect(capability.capabilityPresent).toBe(false);
    expect(capability.capabilityBinding).toBeNull();
    expect(capability.executionBlockedUntilCapabilityPresent).toBe(true);
    expect(capability.capabilitySha256Domain).toBe(
      "nhm2-prolate-boson-star-newtonian-seed-isolated-worker-capability/v1\n",
    );
    expect(capability.seccompPolicyBindingByStage).toEqual({
      producer: null,
      verifier: null,
      assembler: null,
    });
    expect(capability.cgroupV2).toEqual({
      required: true,
      freshDedicatedCgroupPerStageRequired: true,
      stageCgroupsMayNotOverlap: true,
      aggregateChargedMemoryMetric: "cgroup_v2_memory.current",
      aggregateChargedMemoryScope:
        "active_stage_cgroup_including_all_descendants_and_threads",
      maximumAggregateChargedMemoryBytes: 805_306_368,
      memoryMaxExact: "805306368",
      memorySwapMaxExact: "0",
      memoryOomGroupExact: "1",
      pidsAndTasksMetric: "cgroup_v2_pids.current",
      maximumContainedPidsAndTasks: 1,
      pidsMaxExact: "1",
      threadsCountAsTasks: true,
      trustedBrokerIncludedInContainedTaskCount: false,
      descendantsAndThreadsMayEscapeCgroup: false,
      eachStageCgroupMustReportPopulatedZeroBeforeNextStageOrFinalReread: true,
    });
    expect(capability.wallLimit).toEqual({
      maximumWallMilliseconds: 1_800_000,
      scope: "run_wide_across_all_three_sequential_stages_and_final_reread",
      clock: "CLOCK_MONOTONIC_RAW",
      timeoutAction: "write_1_to_cgroup.kill",
      completionCondition:
        "cgroup_events_populated_equals_zero_before_receipt_or_completion",
      direct_child_signal_or_taskkillAloneSufficient: false,
    });
    expect(capability.filesystem).toMatchObject({
      rootFilesystemReadOnly: true,
      inputMount: { path: "/run/input", access: "read_only" },
      stageMounts: {
        producer: {
          toolchainMount: {
            path: "/opt/nhm2-producer",
            access: "read_only",
            exactFirstLevelDirectoryOrder: ["source", "toolchain"],
            extraFirstLevelEntriesAllowed: false,
          },
          stagingMount: { path: "/run/staging", access: "read_write" },
          writablePaths: ["/run/staging"],
        },
        verifier: {
          toolchainMount: {
            path: "/opt/nhm2-verifier",
            access: "read_only",
            exactFirstLevelDirectoryOrder: ["source", "toolchain"],
            extraFirstLevelEntriesAllowed: false,
          },
          stagingMount: { path: "/run/staging", access: "read_only" },
          replayMount: { path: "/run/replay", access: "read_write" },
          writablePaths: ["/run/replay"],
        },
        assembler: {
          toolchainMount: {
            path: "/opt/nhm2-assembler",
            access: "read_only",
            exactFirstLevelDirectoryOrder: ["source", "toolchain"],
            extraFirstLevelEntriesAllowed: false,
          },
          stagingMount: { path: "/run/staging", access: "read_only" },
          replayMount: { path: "/run/replay", access: "read_only" },
          attestationMount: {
            path: "/run/attestation",
            access: "read_only",
          },
          outputMount: { path: "/run/output", access: "read_write" },
          writablePaths: ["/run/output"],
        },
      },
      exactlyOneDeclaredStageOutputRootWritablePerStage: true,
      otherWritableMountsAllowed: false,
      hostPathsOutsideDeclaredMountsVisible: false,
    });
    expect(capability.privilege).toMatchObject({
      linuxCapabilitiesAllowed: [],
      dropAllLinuxCapabilitiesRequired: true,
      noNewPrivilegesRequired: true,
      privilegedContainerAllowed: false,
    });
    expect(capability.networkAndSeccomp).toMatchObject({
      isolatedNetworkNamespaceRequired: true,
      networkNamespaceAloneSufficient: false,
      loopbackSocketUseAllowed: false,
      seccompProfileRequired: true,
      allowedAndDeniedSyscallSetsMustBeDisjoint: true,
      deterministicCompiledBpfMustBindCompilerSourceToolchainAndPolicy: true,
      genericSocketProbeGrantsLoadedFilterAuthority: false,
      seccompPolicyBindingsByStage: {
        producer: null,
        verifier: null,
        assembler: null,
      },
      seccompLoadReceiptBindingsByStage: {
        producer: null,
        verifier: null,
        assembler: null,
      },
      dnsIpv4Ipv6UnixAndLoopbackAttemptsMustFail: true,
    });
    expect(capability.networkAndSeccomp.socketSyscallsExplicitlyDenied).toEqual(
      expect.arrayContaining([
        "socket",
        "socketpair",
        "connect",
        "bind",
        "sendmsg",
      ]),
    );
    expect(capability.schedulerAdmissionLease).toMatchObject({
      required: true,
      minimumHostReserveBytes: 2_147_483_648,
      minimumHostReserveGiB: 2,
      issuedBeforeCgroupCreation: true,
      heldUntilAllStageCgroupsEmptyAndFinalSecureRereadComplete: true,
      serializesCompetingScientificRuns: true,
      oneTimeFreeMemorySampleGrantsAuthority: false,
      leaseSha256Domain:
        "nhm2-prolate-boson-star-newtonian-seed-scheduler-lease/v1\n",
      leaseBinding: null,
    });
    expect(capability.stageEnforcementReceipts).toEqual({
      producer: null,
      verifier: null,
      assembler: null,
    });
    expect(capability.exactlyThreeStageEnforcementReceiptsRequired).toBe(true);
    expect(capability.verifierPostExitReceiptClosure).toMatchObject({
      receiptPathForAssemblerReadOnlyInput:
        "/run/attestation/verifier-stage-enforcement-receipt.canonical.json",
      maximumCanonicalUtf8Bytes: 1_048_576,
      trustedBrokerIsExclusiveWriter: true,
      createdOnlyAfterVerifierExitAndCgroupPopulatedZero: true,
      mustBindAlreadyClosedReplayBundleSha256AndByteLength: true,
      brokerMayNotRewriteReplayBundle: true,
      assemblerLaunchRequiresReceiptValidation: true,
      finalAdmissionRequiresReceiptAndBundleCrossValidation: true,
      receipt: null,
    });
    expect(capability.absoluteMonotonicDeadline).toMatchObject({
      clockId: "CLOCK_MONOTONIC_RAW",
      maximumWallNanoseconds: "1800000000000",
      issuedWithSchedulerLeaseBeforeAnyRootPreparation: true,
      exactlyOneRunStartAndAbsoluteDeadlineForTheEntireSequence: true,
      everyBrokerGapWaitObservationReadHashValidationAndFsyncCharged: true,
      stageLaunchAtOrAfterDeadlineAllowed: false,
      finalAdmissionAtOrAfterDeadlineAllowed: false,
      activeStageAtDeadlineAction:
        "write_1_to_active_stage_cgroup.kill_then_wait_for_cgroup_events_populated_zero",
      expiryWithNoActiveStageAction:
        "terminal_fail_closed_no_future_stage_launch_or_final_admission",
      absoluteDeadlineReceiptBinding: null,
      established: false,
    });
    expect(
      capability.absoluteMonotonicDeadline
        .checkedBeforeAndAfterExactOrderedPhases,
    ).toEqual([
      "staging_root_and_directory_preparation",
      "producer_input_ledger_and_launch_envelope_sealing",
      "producer_launch_execution_exit_and_cgroup_empty",
      "broker_staging_secure_observation",
      "replay_root_preparation",
      "verifier_quota_setup_receipt",
      "verifier_input_ledger_and_launch_envelope_sealing",
      "verifier_launch_execution_bundle_close_exit_and_cgroup_empty",
      "attestation_root_preparation_and_verifier_post_exit_receipt_write",
      "verifier_receipt_bundle_cross_validation",
      "final_output_root_and_directory_preparation",
      "assembler_input_ledger_and_launch_envelope_sealing",
      "assembler_launch_execution_exit_and_cgroup_empty",
      "final_container_secure_reread_and_rehash",
      "descriptor_bundle_projection_equality_replay",
      "final_admission_receipt_write",
    ]);
    expect(capability.kernelWritableMountQuotaAndFileSizePolicy).toMatchObject({
      kernelEnforcedLinuxProjectQuotaRequired: true,
      userspaceAccountingAloneSufficient: false,
      staticQuotaCapabilityMustBeSealedInCommonRunRequest: true,
      dynamicQuotaSetupReceiptMayExistBeforeItsStageRootExists: false,
      projectInheritanceFlagRequired: "FS_XFLAG_PROJINHERIT",
      zeroGraceHardLimitsRequired: true,
      stageDeviceAndProjectIdPairsMustBePairwiseDistinct: true,
      stagePolicies: {
        producer: {
          writableMountPath: "/run/staging",
          maximumChargedBytes: 16_777_216,
          maximumChargedInodes: 64,
          exactLogicalOutputBytes: 6_482_304,
          exactOutputFileCount: 32,
        },
        verifier: {
          writableMountPath: "/run/replay",
          maximumChargedBytes: 20_971_520,
          maximumChargedInodes: 8,
          rlimitFsizeBytes: 16_777_216,
          exactOutputFileCount: 1,
        },
        assembler: {
          writableMountPath: "/run/output",
          maximumChargedBytes: 33_554_432,
          maximumChargedInodes: 64,
          rlimitFsizeBytes: 16_777_216,
          exactOutputFileCount: 33,
        },
      },
      rlimitFsizeSetBeforeExecAndInheritedUnchanged: true,
      rlimitFsizeSoftAndHardLimitsMustBothEqualTheStageLiteral: true,
      preExecKernelReadbackMustEqualConfiguredByteInodeAndRlimitHardLimits: true,
      quotaCapabilityBindings: {
        producer: null,
        verifier: null,
        assembler: null,
      },
      quotaSetupReceiptBindings: {
        producer: null,
        verifier: null,
        assembler: null,
      },
      established: false,
    });
    expect(
      capability.kernelWritableMountQuotaAndFileSizePolicy.stagePolicies
        .producer.rlimitFsizeBytes,
    ).toBe(
      Math.max(
        ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
          ({ byteLength }) => byteLength,
        ),
      ),
    );
    expect("finalOutputRootCreatedByAssembler" in PLAN.artifactLocks).toBe(
      false,
    );
    expect(
      PLAN.artifactLocks
        .finalOutputRootAndExactDirectoriesPrecreatedByTrustedBroker,
    ).toBe(false);
  });

  it("rejects the current host executor and ambient cross-environment CPython", () => {
    expect(PLAN.rejectedCurrentExecutionSurfaces.hostNodeExecutor).toEqual({
      module:
        "server/services/theory/nhm2-external-numerical-kernel-executor.ts",
      callable: "executeNhm2ExternalNumericalKernel",
      maySupplyLedgerFormatOrOutputObservationReference: true,
      mayExecuteThisSeedRun: false,
      grantsOperatingSystemHermeticity: false,
      grantsTreeMemoryProcessThreadOrNetworkEnforcement: false,
      directChildKillOrTimeoutGrantsTreeEmptyReceipt: false,
      acceptedAsCapabilityAuthority: false,
    });
    expect(PLAN.rejectedCurrentExecutionSurfaces.ambientHostCpython).toEqual({
      interpreter: "CPython 3.13.7",
      interpreterLocationClass: "system_installation",
      importedNumpy: "2.2.6_from_user_roaming_site_packages",
      importedScipy: "1.16.1_from_separate_Manim_environment",
      rootUvLockNumpy: "2.3.2",
      rootUvLockScipy: "1.16.3",
      uvCliPresent: false,
      exactTransitiveRuntimeClosureEstablished: false,
      allowedAsProducerRuntime: false,
      allowedAsVerifierRuntime: false,
      allowedAsAssemblerRuntime: false,
    });
  });

  it("hash-binds the nonexecuting field-complete verifier replay-bundle schema preregistration", () => {
    const schema =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA;
    expect(PLAN.outputPolicy.verifierReplay.schema).toBe(schema);
    expect(PLAN.outputPolicy.verifierReplay.schemaBinding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING,
    );
    expect(schema.recursiveRules.extraKeysAllowedAtAnyObjectDepth).toBe(false);
    expect(schema.runtimeTypedInterpreterBinding).toBeNull();
    expect(schema.executableValidationAuthorityPresent).toBe(false);
    expect(schema.topLevel.extraKeysAllowed).toBe(false);
    expect(schema.topLevel.exactKeys).toEqual([
      "schemaVersion",
      "runPlanBinding",
      "runRequestBinding",
      "seedContractBinding",
      "candidatePlanV2Binding",
      "branchBvpV1Binding",
      "outputDescriptorSchemaBinding",
      "proofReplayProtocolBinding",
      "absoluteDeadlineBinding",
      "verifierSourceLedgerBinding",
      "verifierToolchainLedgerBinding",
      "verifierInputLedgerBinding",
      "verifierOciImageDigest",
      "observedArrayInventory",
      "serverRecomputedGateReport",
      "serverRecomputedScalarMetadata",
      "continuousNodelessProofReceipt",
      "continuousPeakProofReceipt",
      "numericalOriginSeriesDefectReceipt",
    ]);
    expect(schema.topLevel.exactKeys).not.toContain(
      "verifierEnforcementReceiptSha256",
    );
    expect(schema.topLevel.fields.verifierSourceLedgerBinding).toEqual({
      kind: "exact_evidence_grammar_registry_binding_profile",
      profile: "verifierSourceClosureLedger",
    });
    expect(schema.topLevel.fields.absoluteDeadlineBinding).toEqual({
      kind: "exact_evidence_grammar_registry_binding_profile",
      profile: "absoluteDeadlineReceipt",
    });
    expect(schema.topLevel.fields.observedArrayInventory).toMatchObject({
      exactLength: 32,
      extraEntriesAllowed: false,
      itemExactKeys: [
        "inventoryIndex",
        "levelIndex",
        "roleIndex",
        "levelId",
        "role",
        "relativePath",
        "dtype",
        "order",
        "shape",
        "elementCount",
        "byteLength",
        "sha256",
      ],
      staticFieldsMustEqualImportedSeedInventory: true,
      byteLengthAndSha256MustBeServerObservedFromSecureReread: true,
      sha256Semantics: {
        domainSource:
          "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy.arraySha256Domain",
        recipeSource:
          "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy.arrayHashRecipe",
        digest: "lowercase_hex_sha256",
      },
    });
    expect(schema.topLevel.fields.serverRecomputedScalarMetadata).toEqual({
      kind: "exact_imported_schema_reference",
      source:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA.topLevel.fields.scalarMetadata",
    });
    const independentSchemaSha = createHash("sha256")
      .update(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_SHA256_DOMAIN,
        "utf8",
      )
      .update(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_JSON,
        "utf8",
      )
      .digest("hex");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_SHA256,
    ).toBe(independentSchemaSha);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_SHA256,
    ).toBe("e9e2742d6e3fa1c2549a7bbeee0e917bba311920732078040de10e3d6995fa78");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_SHA256,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_EXPECTED_SHA256,
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_SIZE_BYTES,
    ).toBe(
      Buffer.byteLength(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_JSON,
        "utf8",
      ),
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_SIZE_BYTES,
    ).toBe(5492);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(PLAN.outputPolicy.verifierReplay).toMatchObject({
      instanceSha256Domain:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-replay-bundle/v1\n",
      instanceBinding: null,
    });
  });

  it("hash-binds nonexecuting control-plane evidence grammar preregistrations", () => {
    const registry =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY;
    expect(PLAN.controlPlaneEvidenceGrammar.registry).toBe(registry);
    expect(registry.recursiveRules).toMatchObject({
      extraKeysAllowedAtAnyObjectDepth: false,
      sparseArraysAllowed: false,
      extraArrayEntriesAllowed: false,
      unregisteredSchemaReferencesAllowed: false,
      allInstanceBytesMustEqualRecanonicalizedUtf8Bytes: true,
    });
    expect(registry.stageProfiles.producer.inputFileCount).toBe(8);
    expect(registry.stageProfiles.verifier.inputFileCount).toBe(40);
    expect(registry.stageProfiles.assembler.inputFileCount).toBe(42);
    expect(registry.schemaDslMetaSchema).toMatchObject({
      descriptiveBlueprintOnly: true,
      runtimeTypedInterpreterPresent: false,
      runtimeTypedInterpreterBinding: null,
      executableClosedSchemaAuthorityClaimed: false,
      futureInterpreterMustEnforceRequiredAndForbiddenAttributesByKind: true,
    });
    expect(PLAN.controlPlaneEvidenceGrammar).toMatchObject({
      typedInterpreterBinding: null,
      executableValidationAuthorityPresent: false,
      runtimeInstanceOrReceipt: null,
    });
    const registeredDomains = Object.values(registry.domains);
    expect(new Set(registeredDomains).size).toBe(registeredDomains.length);
    expect(registeredDomains.every((domain) => domain.endsWith("\n"))).toBe(
      true,
    );
    expect(
      Object.values(registry.artifactBindingProfiles)
        .map(({ sha256DomainSource }) =>
          sha256DomainSource.replace(/^domains\./, ""),
        )
        .sort(),
    ).toEqual(Object.keys(registry.domains).sort());
    expect(registry.hashPreimage.exactBytes).toBe(
      "utf8(domain_literal_with_terminal_LF)+canonical_json_utf8",
    );
    expect(registry.schemas.seedRunRequest.exactKeys).toEqual(
      PLAN.inputClosure.runRequestExactKeyOrder,
    );
    expect(registry.instanceHashGrammars).toMatchObject({
      seedRunRequest: {
        schema: "schemas.seedRunRequest",
        bindingProfile: "seedRunRequest",
        preimage: "hashPreimage.exactBytes",
      },
      sourceClosureManifests: {
        schema: "schemas.closureManifest",
        exactBindingProfileOrder: [
          "producerSourceClosureManifest",
          "verifierSourceClosureManifest",
          "assemblerSourceClosureManifest",
        ],
      },
      toolchainClosureLedgers: {
        schema: "schemas.closureLedger",
        exactBindingProfileOrder: [
          "producerToolchainClosureLedger",
          "verifierToolchainClosureLedger",
          "assemblerToolchainClosureLedger",
        ],
      },
      quotaCapabilities: {
        schema: "schemas.quotaCapability",
        exactBindingProfileOrder: [
          "producerQuotaCapability",
          "verifierQuotaCapability",
          "assemblerQuotaCapability",
        ],
      },
      quotaSetupReceipts: {
        schema: "schemas.quotaSetupReceipt",
        exactBindingProfileOrder: [
          "producerQuotaSetupReceipt",
          "verifierQuotaSetupReceipt",
          "assemblerQuotaSetupReceipt",
        ],
      },
      seccompLoadReceipts: {
        schema: "schemas.seccompLoadReceipt",
        exactBindingProfileOrder: [
          "producerSeccompLoadReceipt",
          "verifierSeccompLoadReceipt",
          "assemblerSeccompLoadReceipt",
        ],
      },
      stageInputLedgers: {
        schema: "schemas.stageInputLedger",
        exactBindingProfileOrder: [
          "producerInputLedger",
          "verifierInputLedger",
          "assemblerInputLedger",
        ],
      },
      stageLaunchEnvelopes: {
        schema: "schemas.stageLaunchEnvelope",
        exactBindingProfileOrder: [
          "producerLaunchEnvelope",
          "verifierLaunchEnvelope",
          "assemblerLaunchEnvelope",
        ],
      },
      directoryPrestateReceipts: {
        schema: "schemas.directoryPrestateReceipt",
        exactBindingProfileOrder: [
          "stagingPrestateReceipt",
          "replayPrestateReceipt",
          "attestationPrestateReceipt",
          "finalOutputPrestateReceipt",
        ],
      },
      closedStageOutputObservations: {
        schema: "schemas.closedStageOutputObservation",
        exactBindingProfileOrder: [
          "producerClosedOutputObservation",
          "verifierClosedOutputObservation",
          "assemblerClosedOutputObservation",
        ],
      },
      stageEnforcementReceipts: {
        schema: "schemas.stageEnforcementReceipt",
        exactBindingProfileOrder: [
          "producerEnforcementReceipt",
          "verifierEnforcementReceipt",
          "assemblerEnforcementReceipt",
        ],
      },
    });
    const instanceGrammarProfiles: string[] = Object.values(
      registry.instanceHashGrammars,
    ).flatMap((grammar) =>
      "bindingProfile" in grammar
        ? [grammar.bindingProfile]
        : [...grammar.exactBindingProfileOrder],
    );
    instanceGrammarProfiles.push(
      registry.verifierReplayBundleInstanceHashGrammar.bindingProfile,
    );
    expect(instanceGrammarProfiles).toHaveLength(56);
    expect(new Set(instanceGrammarProfiles).size).toBe(56);
    expect(instanceGrammarProfiles.sort()).toEqual(
      Object.keys(registry.artifactBindingProfiles).sort(),
    );
    expect(registry.schemas.namedControlPlaneBinding).toEqual({
      kind: "object",
      exactKeys: ["name", "binding"],
      extraKeysAllowed: false,
      fields: {
        name: { kind: "literal_by_referencing_tuple_profile" },
        binding: {
          kind: "schema_reference",
          source: "controlPlaneBinding",
          bindingProfile:
            "exact_profile_selected_by_name_and_referencing_tuple",
        },
      },
      crossFieldInvariants: [
        "name_and_binding_profile_equal_the_same_exact_referencing_tuple_entry",
      ],
    });
    expect(
      registry.schemas.stageInputLedger.fields.priorStageReceiptBindings,
    ).toEqual({
      kind: "tuple_by_stage_profile",
      itemSchema: "namedControlPlaneBinding",
      exactNameOrderSource: "stageProfiles.priorStageReceiptNameOrder",
      extraEntriesAllowed: false,
    });
    expect(
      registry.schemas.stageLaunchEnvelope.fields
        .directoryPrestateReceiptBindings,
    ).toEqual({
      kind: "tuple_by_stage_profile",
      itemSchema: "namedControlPlaneBinding",
      exactNameOrderSource: "stageProfiles.launchPrestateReceiptNameOrder",
      extraEntriesAllowed: false,
    });
    expect(registry.stageProfiles.verifier.priorStageReceiptNameOrder).toEqual([
      "producer_enforcement_receipt_binding",
      "staging_prestate_receipt_binding",
    ]);
    expect(registry.stageProfiles.assembler.priorStageReceiptNameOrder).toEqual(
      [
        "producer_enforcement_receipt_binding",
        "verifier_enforcement_receipt_binding",
        "verifier_replay_bundle_binding",
        "final_output_prestate_receipt_binding",
      ],
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_JSON,
    ).not.toContain("staging_directory_prestate_receipt_binding");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_JSON,
    ).not.toContain("final_directory_prestate_receipt_binding");
    expect(registry.schemas.stageInputLedger).toMatchObject({
      extraKeysAllowed: false,
      exactKeys: expect.arrayContaining([
        "absoluteDeadlineBinding",
        "quotaSetupReceiptBinding",
        "requiredFilePathOrder",
        "fileObservations",
        "directoryIdentityObservations",
        "priorStageReceiptBindings",
      ]),
    });
    expect(registry.schemas.fileObservation).toMatchObject({
      extraKeysAllowed: false,
      fields: {
        linkCount: { kind: "literal", value: 1 },
        modeFileType: { kind: "literal", value: "regular_file" },
        secureResolutionPassed: { kind: "literal", value: true },
        statReadStatStable: { kind: "literal", value: true },
      },
    });
    expect(registry.schemas.fileObservation.exactKeys).not.toContain("ordinal");
    expect(registry.schemas.stageInputLedger.crossFieldInvariants).toEqual(
      expect.arrayContaining([
        "for_each_i_fileObservations[i].absolutePath=requiredFilePathOrder[i]_and_tuple_index_i_is_the_only_contextual_ledger_ordinal",
        "assembler_fileObservations[41]_is_a_fresh_secure_observation_of_the_raw_canonical_verifier_enforcement_receipt_bytes_and_its_byteLength_raw_SHA256_and_recanonicalized_schema_valid_bytes_recompute_the_exact_named_verifierEnforcementReceipt_domain_binding_in_priorStageReceiptBindings_without_any_self_referential_receipt_observation",
        "only_verifier_and_assembler_fileObservations[8..39]_and_assembler_fileObservations[40]_reuse_prior_broker_observations_with_the_same_absolutePath_byteLength_raw_SHA256_mount_device_inode_linkCount_type_times_secureResolution_and_statReadStat_fields_while_the_fresh_assembler_receipt_observation_at_index_41_is_explicitly_excluded",
      ]),
    );
    for (const schemaName of [
      "seedRunRequest",
      "closureManifest",
      "closureLedger",
      "isolatedWorkerCapability",
      "seccompCompilerInvocationBinding",
      "seccompCompilerInvocation",
      "seccompRuntimeLoadAttestationBinding",
      "seccompRuntimeLoadAttestation",
      "seccompPolicy",
      "seccompLoadReceipt",
      "schedulerLease",
      "quotaCapability",
      "quotaSetupReceipt",
      "crossStageSeparationReceipt",
      "verifierMpfrGmpRuntime",
      "stageLaunchEnvelope",
      "directoryPrestateReceipt",
      "directoryPreparationReceiptBundle",
      "closedStageOutputObservation",
      "observationCaptureReceipt",
      "absoluteDeadlineReceipt",
      "stageEnforcementReceipt",
      "finalDescriptorObservation",
      "finalContainerObservation",
      "finalProjectionEqualityReceipt",
      "finalAdmissionReceipt",
    ] as const) {
      expect(registry.schemas[schemaName].extraKeysAllowed).toBe(false);
    }
    expect(registry.schemas.stageLaunchEnvelope.exactKeys).toEqual([
      "schemaVersion",
      "stageId",
      "runPlanBinding",
      "runRequestBinding",
      "sourceManifestBinding",
      "sourceLedgerBinding",
      "toolchainManifestBinding",
      "toolchainLedgerBinding",
      "inputLedgerBinding",
      "ociImageDigest",
      "capabilityBinding",
      "sandboxAndSeccompPolicyBinding",
      "schedulerLeaseBinding",
      "quotaCapabilityBinding",
      "quotaSetupReceiptBinding",
      "absoluteDeadlineBinding",
      "directoryPrestateReceiptBindings",
      "executableFileObservation",
      "bootstrapFileObservation",
      "exactInvocationSha256",
      "exactEnvironmentSha256",
      "exactMountPolicySha256",
      "exactResourcePolicySha256",
    ]);
    expect(registry.schemas.stageEnforcementReceipt.exactKeys).toEqual([
      "schemaVersion",
      "stageId",
      "runPlanBinding",
      "runRequestBinding",
      "launchEnvelopeBinding",
      "sourceManifestBinding",
      "sourceLedgerBinding",
      "toolchainManifestBinding",
      "toolchainLedgerBinding",
      "inputLedgerBinding",
      "ociImageDigest",
      "capabilityBinding",
      "sandboxAndSeccompPolicyBinding",
      "seccompLoadReceiptBinding",
      "schedulerLeaseBinding",
      "quotaCapabilityBinding",
      "quotaSetupReceiptBinding",
      "absoluteDeadlineBinding",
      "clockId",
      "monotonicStartNanoseconds",
      "secureInputRereadStartMonotonicNanoseconds",
      "secureInputRereadEndMonotonicNanoseconds",
      "stageWorkStartMonotonicNanoseconds",
      "stageWorkEndMonotonicNanoseconds",
      "outputCloseAndFsyncStartMonotonicNanoseconds",
      "outputCloseAndFsyncEndMonotonicNanoseconds",
      "monotonicEndNanoseconds",
      "postExitReceiptAssemblyStartMonotonicNanoseconds",
      "memoryPeakBytes",
      "memoryMaxBytes",
      "memoryOomEvents",
      "memoryOomKillEvents",
      "pidsPeak",
      "pidsMaxEvents",
      "seccompViolationCount",
      "toolchainParentExactFirstLevelInventoryObserved",
      "stdoutBytes",
      "stderrBytes",
      "mountIdentityStableThroughStage",
      "projectInheritanceStableThroughStage",
      "descendantOutputFileCount",
      "allDescendantOutputsCarrySetupDeviceAndProjectId",
      "writableMountPeakBytes",
      "writableMountPeakInodes",
      "writableMountQuotaExceeded",
      "rlimitFsizeBytes",
      "rlimitFsizeExceeded",
      "exitCode",
      "timedOut",
      "killed",
      "cgroupPopulatedZero",
      "closedStageOutputObservationBinding",
      "observationCaptureReceiptBinding",
    ]);
    expect(registry.schemas.quotaCapability.exactKeys).toEqual([
      "schemaVersion",
      "stageId",
      "runPlanBinding",
      "isolatedWorkerCapabilityBinding",
      "quotaSha256Domain",
      "quotaMechanism",
      "projectInheritanceFlag",
      "configuredHardByteLimit",
      "configuredHardInodeLimit",
      "configuredRlimitFsizeSoftBytes",
      "configuredRlimitFsizeHardBytes",
      "quotaGraceAllowed",
      "dynamicStageEvidenceAllowedInStaticCapability",
    ]);
    expect(registry.schemas.quotaSetupReceipt.exactKeys).toEqual([
      "schemaVersion",
      "stageId",
      "runPlanBinding",
      "quotaCapabilityBinding",
      "absoluteDeadlineBinding",
      "setupReceiptSha256Domain",
      "writableMountPath",
      "mountId",
      "deviceId",
      "filesystemType",
      "projectId",
      "rootProjectIdReadback",
      "projectInheritFlagName",
      "rootProjectInheritFlagReadback",
      "kernelReadbackHardByteLimit",
      "kernelReadbackHardInodeLimit",
      "kernelReadbackGraceSeconds",
      "preExecRlimitFsizeSoftReadbackBytes",
      "preExecRlimitFsizeHardReadbackBytes",
      "setupMonotonicNanoseconds",
      "rootIdentityStable",
      "readbacksCompletedImmediatelyBeforeExec",
    ]);
    expect(registry.schemas.seccompPolicy.crossFieldInvariants).toContain(
      "allowedSyscallOrder_and_explicitlyDeniedSocketSyscallOrder_are_disjoint",
    );
    expect(registry.schemas.seccompPolicy.exactKeys).toEqual([
      "schemaVersion",
      "stageId",
      "policySha256Domain",
      "defaultAction",
      "architectureOrder",
      "allowedSyscallOrder",
      "explicitlyDeniedSocketSyscallOrder",
      "compilerSourceLedgerBinding",
      "compilerToolchainLedgerBinding",
      "compilerInvocation",
      "compilerInvocationBinding",
      "compiledBpfSha256",
      "compiledBpfByteLength",
      "noNewPrivilegesRequired",
      "linuxCapabilityOrder",
      "userNotificationOrBrokeredSyscallsAllowed",
    ]);
    expect(registry.schemas.seccompCompilerInvocationBinding.fields).toEqual(
      expect.objectContaining({
        artifactKind: {
          kind: "literal",
          value:
            "nhm2.prolate_boson_star_newtonian_seed.seccomp_compiler_invocation",
        },
        sha256Domain: {
          kind: "literal",
          value:
            "nhm2-prolate-boson-star-newtonian-seed-seccomp-compiler-invocation/v1\n",
        },
      }),
    );
    expect(registry.schemas.seccompCompilerInvocation.exactKeys).toEqual(
      expect.arrayContaining([
        "compilerSourceLedgerBinding",
        "compilerToolchainLedgerBinding",
        "compilerSourceObservation",
        "compilerRuntimeExecutableObservation",
        "compilerArgumentOrder",
        "compilerEnvironmentOrder",
        "compiledBpfSha256",
        "compiledBpfByteLength",
      ]),
    );
    expect(
      registry.schemas.seccompRuntimeLoadAttestationBinding.fields,
    ).toEqual(
      expect.objectContaining({
        artifactKind: {
          kind: "literal",
          value:
            "nhm2.prolate_boson_star_newtonian_seed.seccomp_runtime_load_attestation",
        },
        sha256Domain: {
          kind: "literal",
          value:
            "nhm2-prolate-boson-star-newtonian-seed-seccomp-runtime-load-attestation/v1\n",
        },
      }),
    );
    expect(registry.schemas.seccompRuntimeLoadAttestation.exactKeys).toEqual(
      expect.arrayContaining([
        "seccompPolicyBinding",
        "capabilityBinding",
        "absoluteDeadlineBinding",
        "ociRuntimeExecutableObservation",
        "containerId",
        "containerInitPid",
        "pidNamespaceInode",
        "compiledBpfSha256",
        "loadedBpfSha256",
        "seccompModeReadback",
        "noNewPrivilegesReadback",
      ]),
    );
    expect(registry.schemas.seccompLoadReceipt.exactKeys).toEqual([
      "schemaVersion",
      "stageId",
      "runPlanBinding",
      "seccompPolicyBinding",
      "capabilityBinding",
      "absoluteDeadlineBinding",
      "ociImageDigest",
      "compiledBpfSha256",
      "loadedBpfSha256",
      "seccompModeReadback",
      "noNewPrivilegesReadback",
      "runtimeLoadAttestation",
      "runtimeLoadAttestationBinding",
      "readbackMonotonicNanoseconds",
      "loadedBeforeScientificWork",
    ]);
    expect(registry.schemas.closureManifest.exactKeys).toEqual([
      "schemaVersion",
      "stageId",
      "closureClass",
      "manifestSha256Domain",
      "rootAbsolutePath",
      "exactDirectoryCount",
      "exactDirectoryPathOrder",
      "directoryItems",
      "exactFileCount",
      "exactFilePathOrder",
      "fileItems",
      "dutyCoverage",
      "criticalFileRoleCoverage",
      "aggregateFileBytes",
      "inventoryComplete",
    ]);
    expect(
      registry.stageProfiles.producer.criticalFileRoleProfiles.source,
    ).toEqual([
      { roleId: "bootstrap", dutyIndex: 6 },
      { roleId: "solver_entrypoint", dutyIndex: 7 },
      { roleId: "array_serializer", dutyIndex: 8 },
      { roleId: "seccomp_compiler_source", dutyIndex: 10 },
      { roleId: "source_build_recipe", dutyIndex: 7 },
    ]);
    for (const stageProfile of Object.values(registry.stageProfiles)) {
      for (const closureClass of ["source", "toolchain"] as const) {
        const allowedDutyIndexes = new Set(
          stageProfile.closureDutyProfiles[closureClass].map(
            ({ dutyIndex }) => dutyIndex,
          ),
        );
        expect(
          stageProfile.criticalFileRoleProfiles[closureClass].every(
            ({ roleId, dutyIndex }) =>
              roleId.length > 0 && allowedDutyIndexes.has(dutyIndex),
          ),
        ).toBe(true);
      }
    }
    expect(
      registry.schemas.seedRunRequest.fields.producerQuotaCapabilityBinding,
    ).toEqual({
      kind: "binding_profile",
      profile: "producerQuotaCapability",
    });
    expect(
      registry.schemas.stageLaunchEnvelope.fields.quotaCapabilityBinding,
    ).toEqual({
      kind: "binding_profile_by_stage",
      profileSource: "stageProfiles.quotaCapabilityBindingProfile",
    });
    expect(
      registry.schemaDslMetaSchema.bindingFieldProfiles[
        "stageEnforcementReceipt.quotaCapabilityBinding"
      ],
    ).toBe("quotaCapability_by_stage_profile");
    expect(
      registry.schemas.stageEnforcementReceipt.crossFieldInvariants,
    ).toContain(
      "quotaSetupReceiptBinding_recursively_equals_the_launch_envelope_and_input_ledger_binding_and_supplies_the_exact_mount_device_project_FS_XFLAG_PROJINHERIT_kernel_limit_and_RLIMIT_readbacks",
    );
    expect(registry.schemas.stageEnforcementReceipt.fieldTypes.clockId).toBe(
      "literal_CLOCK_MONOTONIC_RAW",
    );
    expect(
      registry.schemas.stageEnforcementReceipt.crossFieldInvariants,
    ).toEqual(
      expect.arrayContaining([
        "all_phase_fields_use_exact_CLOCK_MONOTONIC_RAW_and_monotonicStart_is_not_after_secureInputRereadStart_is_not_after_secureInputRereadEnd_is_not_after_stageWorkStart_is_not_after_stageWorkEnd_is_not_after_outputCloseAndFsyncStart_is_not_after_outputCloseAndFsyncEnd_is_not_after_monotonicEnd_is_not_after_postExitReceiptAssemblyStart_and_every_phase_is_strictly_before_the_bound_absolute_deadline",
        "for_the_verifier_secureInputRereadStart_through_End_is_the_exact_secure_reread_and_rehash_of_the_bound_base_inputs_and_32_staging_arrays_stageWorkStart_through_End_is_the_producer_independent_gate_and_three_proof_receipt_recomputation_and_outputCloseAndFsyncStart_through_End_is_the_exclusive_canonical_replay_bundle_write_fsync_and_close_bound_by_closedStageOutputObservationBinding",
        "monotonicEndNanoseconds_is_the_trusted_broker_time_at_which_stage_exit_and_cgroupPopulatedZero_have_both_been_observed_and_for_the_verifier_it_is_not_before_outputCloseAndFsyncEndMonotonicNanoseconds",
        "postExitReceiptAssemblyStartMonotonicNanoseconds_is_after_stage_exit_and_cgroup_empty_and_before_the_trusted_broker_canonical_receipt_write_while_the_receipt_never_embeds_or_predicts_its_own_binding_or_later_fresh_file_observation",
      ]),
    );
    expect(registry.domains.finalContainerObservation).toBe(
      "nhm2-prolate-boson-star-newtonian-seed-final-container-observation/v1\n",
    );
    expect(registry.artifactBindingProfiles.finalContainerObservation).toEqual({
      artifactKind:
        "nhm2.prolate_boson_star_newtonian_seed.final_container_observation",
      sha256DomainSource: "domains.finalContainerObservation",
    });

    const usedFieldTypeTokens = new Set<string>();
    for (const schema of Object.values(registry.schemas)) {
      const collectNested = (value: unknown): void => {
        if (value === null || typeof value !== "object") return;
        if (
          "fieldTypes" in value &&
          value.fieldTypes &&
          typeof value.fieldTypes === "object"
        ) {
          for (const token of Object.values(
            value.fieldTypes as Record<string, unknown>,
          )) {
            if (typeof token === "string") usedFieldTypeTokens.add(token);
          }
        }
        for (const child of Object.values(value)) collectNested(child);
      };
      collectNested(schema);
    }
    expect([...usedFieldTypeTokens].sort()).toEqual(
      Object.keys(
        registry.schemaDslMetaSchema.fieldTypesTokenDefinitions,
      ).sort(),
    );

    const bindingProfiles = registry.schemaDslMetaSchema
      .bindingFieldProfiles as Record<string, string>;
    const genericBindingPaths: string[] = [];
    for (const [schemaName, schema] of Object.entries(registry.schemas)) {
      if ("fields" in schema && schema.fields) {
        for (const [fieldName, field] of Object.entries(schema.fields)) {
          if (
            field &&
            typeof field === "object" &&
            "source" in field &&
            field.source === "controlPlaneBinding"
          ) {
            genericBindingPaths.push(`${schemaName}.${fieldName}`);
          }
        }
      }
      if ("fieldTypes" in schema && schema.fieldTypes) {
        for (const [fieldName, token] of Object.entries(schema.fieldTypes)) {
          if (token === "controlPlaneBinding") {
            genericBindingPaths.push(`${schemaName}.${fieldName}`);
          }
        }
      }
    }
    expect(
      genericBindingPaths.filter((path) => !(path in bindingProfiles)),
    ).toEqual([]);

    expect(
      registry.schemas.finalProjectionEqualityReceipt.fields.fieldComparisons
        .exactPointerOrder,
    ).toEqual([
      ["/serverRecomputedScalarMetadata", "/scalarMetadata"],
      ["/serverRecomputedGateReport", "/serverRecomputedGateReport"],
      ["/continuousNodelessProofReceipt", "/continuousNodelessProofReceipt"],
      ["/continuousPeakProofReceipt", "/continuousPeakProofReceipt"],
      [
        "/numericalOriginSeriesDefectReceipt",
        "/numericalOriginSeriesDefectReceipt",
      ],
      ["/observedArrayInventory", "/arrayInventory"],
    ]);
    expect(registry.schemas.finalDescriptorObservation.exactKeys).toEqual(
      expect.arrayContaining([
        "clockId",
        "phaseStartMonotonicNanoseconds",
        "phaseEndMonotonicNanoseconds",
      ]),
    );
    expect(registry.schemas.finalContainerObservation.exactKeys).toEqual(
      expect.arrayContaining([
        "clockId",
        "phaseStartMonotonicNanoseconds",
        "phaseEndMonotonicNanoseconds",
      ]),
    );
    expect(registry.schemas.finalProjectionEqualityReceipt.exactKeys).toEqual(
      expect.arrayContaining([
        "finalContainerObservationBinding",
        "clockId",
        "phaseStartMonotonicNanoseconds",
        "phaseEndMonotonicNanoseconds",
      ]),
    );
    expect(registry.schemas.finalAdmissionReceipt.fieldTypes.clockId).toBe(
      "literal_CLOCK_MONOTONIC_RAW",
    );
    expect(
      registry.schemas.finalAdmissionReceipt.crossFieldInvariants,
    ).toContain(
      "the_bound_assemblerEnforcementReceipt.monotonicEndNanoseconds_is_not_after_the_finalDescriptorObservation.phaseStartMonotonicNanoseconds_resolved_through_the_bound_finalProjectionEqualityReceipt_and_all_use_CLOCK_MONOTONIC_RAW",
    );
    const independentRegistrySha = createHash("sha256")
      .update(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_SHA256_DOMAIN,
        "utf8",
      )
      .update(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_JSON,
        "utf8",
      )
      .digest("hex");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_SHA256,
    ).toBe(independentRegistrySha);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_SHA256,
    ).toBe("b048a86ef1932cc06bd2d1c829011aa1df8341621ded24e4be13c8fdc4c54c9e");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_SHA256,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_EXPECTED_SHA256,
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_SIZE_BYTES,
    ).toBe(
      Buffer.byteLength(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_JSON,
        "utf8",
      ),
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_SIZE_BYTES,
    ).toBe(120618);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES,
    );
  });

  it("requires producer-independent descriptor and all-three-proof replay", () => {
    expect(PLAN.producerIndependentAcceptanceReplay).toMatchObject({
      required: true,
      serverOwnedAndProducerIndependent: true,
      verifierStageId: "trusted_independent_verifier",
      mayImportProducerResidualObservableOrProofSummaryCode: false,
      mayImportProducerOrAssemblerExecutableSourceOrRuntime: false,
      producerDescriptorIsForbiddenAndDoesNotExistAtReplayTime: true,
      allThirtyTwoStagingArraysMustBeSecurelyRereadAndRehashedFirst: true,
      secureRereadMustValidateExactClosedArrayInventoryShapeDtypeOrderAndSize: true,
      outputDescriptorSchemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
      proofReplayProtocolBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
      verifierReplayBundleSchemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING,
      controlPlaneEvidenceGrammarRegistryBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
      requiredServerReplayedReceipts: [
        "continuousNodelessProofReceipt",
        "continuousPeakProofReceipt",
        "numericalOriginSeriesDefectReceipt",
      ],
      numericalOriginSeriesReceiptAuthorityBoundary:
        "numerical_defect_gate_only_no_exact_regularity_or_PDE_series_equality_authority",
      allThreeReceiptsMustBindTheSameProtocolAndProofKernel: true,
      allThreeReceiptsMustBindAllThirtyTwoSecurelyRereadArrayHashes: true,
      assemblerAndFinalAdmissionMustValidateExactRecursiveDescriptorSchema: true,
      everyScientificGateMustBeRecomputedFromRawArrays: true,
      verifierMustDeriveScientificOperatorsIndependentlyFromFrozenSeedBvpAndProofProtocol: true,
      producerSpecificOperatorQuadratureOrProlongationBytesMayAppearOnlyInProducerSealedClosure: true,
      verifierMaySeeOrImportProducerSpecificOperatorQuadratureOrProlongationBytes: false,
      mpfrGmpRuntimeBinding: null,
      replayBundlePath:
        "/run/replay/seed-verifier-replay-bundle.canonical.json",
      replayBundleRawBytesMustEqualSchemaValidatedCanonicalUtf8BytesExactly: true,
      verifierMayWriteOnlyTheSealedReplayBundleAndNeverTheDescriptor: true,
      verifierReplayBundleInstanceBinding: null,
      accepted: false,
    });
  });

  it("keeps execution, artifacts, replay, and every claim lock false", () => {
    expect(PLAN.executionAuthorized).toBe(false);
    expect(PLAN.executionState).toMatchObject({
      executionPresent: false,
      launchRequest: null,
      spawnOrCallback: null,
      seedRunRequestBinding: null,
      capabilityBinding: null,
      schedulerLeaseBinding: null,
      absoluteDeadlineReceiptBinding: null,
      quotaCapabilityBindings: {
        producer: null,
        verifier: null,
        assembler: null,
      },
      quotaSetupReceiptBindings: {
        producer: null,
        verifier: null,
        assembler: null,
      },
      crossStageSeparationReceiptBinding: null,
      seccompLoadReceiptBindings: {
        producer: null,
        verifier: null,
        assembler: null,
      },
      verifierMpfrGmpRuntimeBinding: null,
      verifierProofKernelBinding: null,
      directoryPreparationReceiptBundleBinding: null,
      observationCaptureReceiptBindings: {
        producer: null,
        verifier: null,
        assembler: null,
      },
      producerClosedOutputObservationBinding: null,
      verifierClosedOutputObservationBinding: null,
      assemblerClosedOutputObservationBinding: null,
      producerEnforcementReceiptBinding: null,
      verifierEnforcementReceiptBinding: null,
      assemblerEnforcementReceiptBinding: null,
      verifierReplayBundleInstanceBinding: null,
      continuousNodelessProofReceipt: null,
      continuousPeakProofReceipt: null,
      numericalOriginSeriesDefectReceipt: null,
      numericalOriginSeriesDefectGatePassed: false,
      finalContainerObservationBinding: null,
      finalProjectionEqualityReceiptBinding: null,
      finalAdmissionReceiptBinding: null,
      outputArtifactBinding: null,
      structurallyAdmissibleDiagnosticSeed: false,
    });
    expect(
      Object.values(PLAN.executionLocks).every((value) => value === false),
    ).toBe(true);
    expect(
      Object.values(PLAN.artifactLocks).every((value) => value === false),
    ).toBe(true);
    expect(
      Object.values(PLAN.claimLocks).every((value) => value === false),
    ).toBe(true);
    expect(PLAN.claimLockKeys).toEqual(Object.keys(PLAN.claimLocks));
    expect(PLAN.claimBoundary).toMatchObject({
      preregistrationOnly: true,
      executesByItself: false,
      newtonianSeedEstablished: false,
      relativisticBranchSolved: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    });
  });

  it("exports literal-pinned domain-separated canonical bytes", () => {
    const independentlyComputed = createHash("sha256")
      .update(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256_DOMAIN,
        "utf8",
      )
      .update(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_JSON,
        "utf8",
      )
      .digest("hex");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256_DOMAIN,
    ).toBe("nhm2-prolate-boson-star-newtonian-seed-run-plan/v1\n");
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256).toBe(
      independentlyComputed,
    );
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256).toBe(
      "3facc28fc62c9515a4c751f47ac9b6d90ab1179216d3d7c29c2a37b48e7e8f41",
    );
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_EXPECTED_SHA256,
    );
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256).toMatch(
      /^[0-9a-f]{64}$/,
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_SIZE_BYTES,
    ).toBe(
      Buffer.byteLength(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_JSON,
        "utf8",
      ),
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_SIZE_BYTES,
    ).toBe(261169);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING).toEqual({
      artifactId: "nhm2.prolate_boson_star_newtonian_seed_run_plan",
      contractVersion: "nhm2_prolate_boson_star_newtonian_seed_run_plan/v1",
      sha256Domain: "nhm2-prolate-boson-star-newtonian-seed-run-plan/v1\n",
      sha256: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256,
      canonicalSizeBytes:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_SIZE_BYTES,
    });
  });

  it("accepts only the recursively frozen authoritative singleton", () => {
    expectDeepFrozen(PLAN);
    expect(isNhm2ProlateBosonStarNewtonianSeedRunPlanV1(PLAN)).toBe(true);
    expect(nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(PLAN)).toEqual(
      [],
    );
    expect(isNhm2ProlateBosonStarNewtonianSeedRunPlanV1(clone())).toBe(false);
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(clone()),
    ).toEqual(["seed_run_plan_v1_external_copy_not_authoritative"]);
    const drift = clone();
    drift.executionAuthorized = true;
    expect(nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(drift)).toEqual(
      ["seed_run_plan_v1_semantic_mismatch"],
    );
    const wrapped = new Proxy(PLAN, {});
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(wrapped),
    ).toEqual(["seed_run_plan_v1_external_copy_not_authoritative"]);
  });

  it("rejects hostile accessors, surfaces, cycles, numbers, proxies, and bounded bombs", () => {
    let getterInvocations = 0;
    const accessor = clone();
    Object.defineProperty(accessor, "authority", {
      enumerable: true,
      get() {
        getterInvocations += 1;
        return PLAN.authority;
      },
    });
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(accessor),
    ).toEqual(["object_property_surface:/authority"]);
    expect(getterInvocations).toBe(0);

    const symbol = clone();
    Object.defineProperty(symbol, Symbol("hostile"), {
      enumerable: true,
      value: true,
    });
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(symbol),
    ).toEqual(["symbol_key:/"]);

    const sparse = clone();
    const sparseInventory = new Array(33);
    sparseInventory[0] = sparse.outputPolicy.inventory[0];
    sparse.outputPolicy.inventory = sparseInventory;
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(sparse),
    ).toEqual(["array_surface:/outputPolicy/inventory"]);

    const cyclic = clone();
    cyclic.loop = cyclic;
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(cyclic),
    ).toEqual(["cyclic_value:/loop"]);

    const invalidNumber = clone();
    invalidNumber.outputPolicy.arrayCount = Number.NaN;
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(invalidNumber),
    ).toEqual(["invalid_number:/outputPolicy/arrayCount"]);

    const revoked = Proxy.revocable(clone(), {});
    revoked.revoke();
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(revoked.proxy),
    ).toEqual(["seed_run_plan_v1_plain_data_snapshot_invalid"]);

    const longString = clone();
    longString.authority = "x".repeat(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VALIDATOR_LIMITS.maximumStringCodeUnits +
        1,
    );
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(longString),
    ).toEqual(["string_code_unit_limit:/authority"]);

    const longArray: unknown[] = [];
    longArray.length =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VALIDATOR_LIMITS.maximumArrayLength +
      1;
    let ownKeysCalls = 0;
    const oversized = clone();
    oversized.outputPolicy.inventory = new Proxy(longArray, {
      ownKeys(target) {
        ownKeysCalls += 1;
        return Reflect.ownKeys(target);
      },
    });
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(oversized),
    ).toEqual(["array_length_limit:/outputPolicy/inventory"]);
    expect(ownKeysCalls).toBe(0);
  });

  it("caps depth, nodes, object width, property names, and aggregate string work", () => {
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VALIDATOR_LIMITS,
    ).toEqual({
      maximumDepth: 16,
      maximumNodes: 6912,
      maximumArrayLength: 64,
      maximumObjectPropertyCount: 64,
      maximumStringCodeUnits: 400,
      maximumStringUtf8Bytes: 1024,
      maximumTotalStringUtf8Bytes: 147456,
      maximumPropertyNameCodeUnits: 128,
      maximumPropertyNameUtf8Bytes: 256,
      maximumTotalPropertyNameUtf8Bytes: 82432,
    });

    const deep = clone();
    let cursor: Record<string, unknown> = {};
    deep.deep = cursor;
    for (
      let index = 0;
      index <=
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VALIDATOR_LIMITS.maximumDepth;
      index += 1
    ) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(deep)[0],
    ).toMatch(/^snapshot_depth_limit:/);

    const wide = clone();
    wide.wide = Object.fromEntries(
      Array.from(
        {
          length:
            NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VALIDATOR_LIMITS.maximumObjectPropertyCount +
            1,
        },
        (_, index) => [`k${index}`, index],
      ),
    );
    expect(nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(wide)).toEqual([
      "object_property_count_limit:/wide",
    ]);

    const longKey = clone();
    Object.defineProperty(
      longKey,
      "k".repeat(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VALIDATOR_LIMITS.maximumPropertyNameCodeUnits +
          1,
      ),
      { enumerable: true, value: 1 },
    );
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(longKey)[0],
    ).toBe("property_name_code_unit_limit:/");

    const propertyNameBomb = clone();
    propertyNameBomb.propertyNameBomb = Array.from({ length: 16 }, (_, row) =>
      Object.fromEntries(
        Array.from({ length: 8 }, (_, column) => [
          `k${row}_${column}_`.padEnd(128, "x"),
          0,
        ]),
      ),
    );
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(propertyNameBomb)[0],
    ).toMatch(/^total_property_name_byte_length_limit:/);

    const nodeBomb = clone();
    nodeBomb.nodeBomb = Array.from({ length: 64 }, () => ({
      values: Array.from({ length: 64 }, () => 0),
    }));
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(nodeBomb)[0],
    ).toMatch(/^snapshot_node_limit:/);

    const stringBomb = clone();
    stringBomb.stringBomb = Array.from({ length: 64 }, () => "x".repeat(256));
    expect(
      nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(stringBomb)[0],
    ).toMatch(/^total_string_byte_length_limit:/);
  });
});
