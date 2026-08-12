import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
} from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v1";
import * as v2 from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v2";

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const domainHash = (domain: string, value: unknown): string =>
  createHash("sha256")
    .update(domain, "utf8")
    .update(canonicalJson(value), "utf8")
    .digest("hex");

const recursivelyFrozen = (value: unknown, seen = new Set<object>()): boolean => {
  if (value === null || typeof value !== "object" || seen.has(value)) return true;
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every((child) =>
      recursivelyFrozen(child, seen),
    )
  );
};

const plan = v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2;
const registry =
  v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY;

describe("NHM2 boson-star successor run-plan v2", () => {
  it("exact-pins sealed v1 and inherits its eight-file request surface", () => {
    expect(plan.predecessor.binding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING,
    );
    expect(plan.predecessor.exactExpectedBinding).toEqual({
      artifactId: "nhm2.prolate_boson_star_newtonian_seed_run_plan",
      contractVersion: "nhm2_prolate_boson_star_newtonian_seed_run_plan/v1",
      sha256Domain:
        "nhm2-prolate-boson-star-newtonian-seed-run-plan/v1\n",
      sha256:
        "3facc28fc62c9515a4c751f47ac9b6d90ab1179216d3d7c29c2a37b48e7e8f41",
      canonicalSizeBytes: 261169,
    });
    expect(plan.predecessor.v1MutationAllowed).toBe(false);
    expect(
      registry.inheritedV1ControlPlaneEvidenceGrammarRegistryBinding,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
    );

    expect(plan.inputPathInventories.baseInputRelativePathOrder).toEqual([
      "00-seed-run-request.v1.json",
      "01-candidate-plan-v2.canonical.json",
      "02-branch-bvp-v1.canonical.json",
      "03-newtonian-seed-v1.canonical.json",
      "04-proof-replay-protocol.v1.canonical.json",
      "05-output-descriptor-schema.v1.canonical.json",
      "06-verifier-replay-bundle-schema.v1.canonical.json",
      "07-control-plane-evidence-grammar-registry.v1.canonical.json",
    ]);
    expect(plan.inputPathInventories.baseInputRelativePathOrder).toHaveLength(8);
    expect(plan.commonRunRequestPolicy.path).toBe(
      "/run/input/00-seed-run-request.v1.json",
    );
    expect(plan.commonRunRequestPolicy.exactKeys).toEqual(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
        .schemas.seedRunRequest.exactKeys,
    );
    expect(plan.commonRunRequestPolicy.sha256Domain).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
        .domains.seedRunRequest,
    );
  });

  it("forbids every future runtime-evidence surface in the common request", () => {
    const exact = new Set<string>(plan.commonRunRequestPolicy.exactKeys);
    const forbidden = plan.commonRunRequestPolicy.forbiddenFutureEvidenceKeys;

    expect(plan.commonRunRequestPolicy.futureHashOrBindingPreregistrationAllowed).toBe(
      false,
    );
    expect(
      plan.commonRunRequestPolicy.stageLocalRuntimeEvidenceMayAppearInCommonRunRequest,
    ).toBe(false);
    expect(plan.commonRunRequestPolicy.binding).toBeNull();
    expect(forbidden).toEqual(
      expect.arrayContaining([
        "absoluteDeadlineReceiptBinding",
        "brokerRuntimeChannelBinding",
        "stageInputLedgerBinding",
        "stageLaunchEnvelopeBinding",
        "stageEnforcementReceiptBinding",
        "verifierReplayBundleBinding",
        "finalContainerObservationBinding",
      ]),
    );
    expect(forbidden.filter((key) => exact.has(key))).toEqual([]);
  });

  it("freezes unique domains, exact schemas, profiles, and independent schema hashes", () => {
    const domains = Object.values(registry.domains);
    expect(new Set(domains).size).toBe(domains.length);
    expect(domains.every((domain) => domain.endsWith("\n"))).toBe(true);
    expect(registry.canonicalization).toBe(
      "RFC8785_JSON_Canonicalization_Scheme_UTF8",
    );
    expect(registry.recursiveRules.extraKeysAllowedAtAnyObjectDepth).toBe(false);
    expect(registry.recursiveRules.rawBytesMustEqualRecanonicalizedUtf8Exactly).toBe(
      true,
    );
    expect(registry.runtimeTypedInterpreterBinding).toBeNull();
    expect(registry.executableValidationAuthorityPresent).toBe(false);

    const schemaCases = [
      [
        v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_VERIFIER_RUNTIME_CHANNEL_SCHEMA,
        v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_VERIFIER_RUNTIME_CHANNEL_SCHEMA_BINDING,
      ],
      [
        v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA,
        v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA_BINDING,
      ],
      [
        v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_INPUT_LEDGER_SCHEMA,
        v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_INPUT_LEDGER_SCHEMA_BINDING,
      ],
      [
        v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA,
        v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA_BINDING,
      ],
      [
        v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA,
        v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA_BINDING,
      ],
    ] as const;

    for (const [schema, binding] of schemaCases) {
      expect(binding.sha256).toBe(domainHash(binding.sha256Domain, schema));
      expect(binding.canonicalSizeBytes).toBe(
        Buffer.byteLength(canonicalJson(schema), "utf8"),
      );
    }
  });

  it("keeps channel instances acyclic and stage-local", () => {
    const verifierKeys =
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_VERIFIER_RUNTIME_CHANNEL_SCHEMA
        .topLevel.exactKeys;
    const assemblerKeys =
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA
        .topLevel.exactKeys;

    expect(verifierKeys).toEqual(
      expect.arrayContaining([
        "absoluteDeadlineReceipt",
        "absoluteDeadlineReceiptBinding",
        "verifierInputLedgerBinding",
        "secureStagingObservationClosure",
        "typedInterpreterBinding",
      ]),
    );
    expect(assemblerKeys).toEqual(
      expect.arrayContaining([
        "verifierClosedOutputObservation",
        "freshVerifierEnforcementReceiptObservation",
        "verifierEnforcementReceiptBinding",
        "verifierReplayBundleBinding",
        "replayBundleRawSha256",
        "replayBundleCanonicalSizeBytes",
        "assemblerInputLedgerBinding",
        "typedInterpreterBinding",
      ]),
    );
    for (const keys of [verifierKeys, assemblerKeys]) {
      expect(keys.some((key) => key.includes("LaunchEnvelopeBinding"))).toBe(false);
      expect(keys.some((key) => key.includes("channelInstanceBinding"))).toBe(
        false,
      );
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("preserves v1 observation ordinals and makes the channel the sole visible extra", () => {
    const { verifier, assembler } = plan.inputPathInventories;
    expect(plan.inputPathInventories.stagingAbsoluteArrayPathOrder).toHaveLength(32);
    expect(verifier.preChannelInputLedgerFileCount).toBe(40);
    expect(verifier.launchVisibleFileCount).toBe(41);
    expect(verifier.preChannelInputLedgerFilePathOrder).toHaveLength(40);
    expect(verifier.launchVisibleFilePathOrder).toHaveLength(41);
    expect(verifier.channelObservationContextualPosition).toBe(40);
    expect(verifier.channelIsSoleLaunchVisibleExtraFile).toBe(true);
    expect(verifier.launchVisibleFilePathOrder.slice(0, 40)).toEqual(
      verifier.preChannelInputLedgerFilePathOrder,
    );
    expect(verifier.launchVisibleFilePathOrder[40]).toBe(verifier.brokerChannelPath);

    expect(assembler.preChannelInputLedgerFileCount).toBe(42);
    expect(assembler.launchVisibleFileCount).toBe(43);
    expect(assembler.preChannelInputLedgerFilePathOrder).toHaveLength(42);
    expect(assembler.launchVisibleFilePathOrder).toHaveLength(43);
    expect(assembler.channelObservationContextualPosition).toBe(42);
    expect(assembler.channelIsSoleLaunchVisibleExtraFile).toBe(true);
    expect(assembler.preChannelInputLedgerFilePathOrder[40]).toBe(
      "/run/replay/seed-verifier-replay-bundle.canonical.json",
    );
    expect(assembler.preChannelInputLedgerFilePathOrder[41]).toBe(
      "/run/attestation/verifier-stage-enforcement-receipt.canonical.json",
    );
    expect(assembler.launchVisibleFilePathOrder[42]).toBe(
      assembler.brokerChannelPath,
    );
    expect(new Set(assembler.launchVisibleFilePathOrder).size).toBe(43);
  });

  it("seals ledger, channel observation, launch envelope, and enforcement without a cycle", () => {
    for (const order of [
      plan.stageLocalChronology.verifierExactOrder,
      plan.stageLocalChronology.assemblerExactOrder,
    ]) {
      const ledger = order.findIndex((step) => step.includes("input_ledger_seal"));
      const channel = order.findIndex((step) =>
        step.includes("channel_exclusive_canonical_seal"),
      );
      const observation = order.findIndex((step) =>
        step.includes("channel_secure_observation"),
      );
      const envelope = order.findIndex((step) =>
        step.includes("launch_envelope_seal"),
      );
      const revalidation = order.findIndex((step) =>
        step.includes("pre_exec_channel"),
      );
      const launch = order.findIndex((step) => step.endsWith("_launch"));
      expect([ledger, channel, observation, envelope, revalidation, launch]).toEqual(
        [...[ledger, channel, observation, envelope, revalidation, launch]].sort(
          (a, b) => a - b,
        ),
      );
      expect(ledger).toBeGreaterThanOrEqual(0);
    }

    expect(plan.stageLocalChronology.inputLedgerOrLaunchEnvelopeMayBindFutureChannelInstance).toBe(
      false,
    );
    expect(plan.stageLocalChronology.channelMayEmbedLaunchEnvelopeBinding).toBe(
      false,
    );
    expect(
      plan.stageLocalChronology.launchEnvelopeMustBindExactChannelInstanceAndSecureObservation,
    ).toBe(true);
    expect(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA.topLevel.exactKeys,
    ).toEqual(
      expect.arrayContaining([
        "channelInstanceBinding",
        "channelObservation",
        "channelObservationBinding",
        "typedInterpreterBinding",
      ]),
    );
    expect(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA.topLevel.exactKeys,
    ).toEqual(
      expect.arrayContaining([
        "launchEnvelopeBinding",
        "channelInstanceBinding",
        "channelPreExecObservation",
        "channelBootstrapReadObservation",
        "channelPostExitObservation",
      ]),
    );

    const launchSchema =
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA
        .topLevel;
    const enforcementSchema =
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA
        .topLevel;
    expect(launchSchema.exactKeys).not.toContain(
      "preExecRevalidationMonotonicNanoseconds",
    );
    expect(launchSchema.fields).not.toHaveProperty(
      "preExecRevalidationMonotonicNanoseconds",
    );
    expect(launchSchema.extraKeysAllowed).toBe(false);
    expect(enforcementSchema.exactKeys).toContain(
      "channelPreExecRevalidationMonotonicNanoseconds",
    );
    expect(
      enforcementSchema.crossFieldInvariants.some(
        (rule) =>
          rule.includes(
            "launchEnvelopeSealMonotonicNanoseconds_is_not_after_channelPreExecRevalidationMonotonicNanoseconds",
          ) && rule.includes("strictly_before_monotonicStartNanoseconds_exec"),
      ),
    ).toBe(true);
  });

  it("resolves each channel-schema identifier to an exact schemaBindings key", () => {
    for (const stage of ["verifier", "assembler"] as const) {
      const profile = registry.successorStageProfiles[stage];
      expect(Object.prototype.hasOwnProperty.call(
        registry.schemaBindings,
        profile.channelSchemaBindingProfile,
      )).toBe(true);
      expect(profile.channelSchemaBindingSource).toBe(
        `schemaBindings.${profile.channelSchemaBindingProfile}`,
      );
    }
    expect(
      registry.successorStageProfiles.verifier.channelSchemaBindingProfile,
    ).toBe("verifierRuntimeChannel");
    expect(
      registry.successorStageProfiles.assembler.channelSchemaBindingProfile,
    ).toBe("assemblerRuntimeChannel");
    expect(canonicalJson(registry.successorStageProfiles)).not.toContain(
      "RuntimeChannelSchema\"",
    );
  });

  it("pins exact v1 manifest paths plus one explicit stage-local channel argv", () => {
    expect(plan.invocations.producer.argvAfterExecutable).toContain(
      "/run/input/00-seed-run-request.v1.json",
    );
    expect(plan.invocations.producer.argvAfterExecutable).not.toContain(
      "--broker-runtime-evidence",
    );
    for (const stage of ["verifier", "assembler"] as const) {
      const invocation = plan.invocations[stage];
      expect(invocation.argvAfterExecutable).toContain(
        "/run/input/00-seed-run-request.v1.json",
      );
      const flag = invocation.argvAfterExecutable.indexOf(
        "--broker-runtime-evidence",
      );
      expect(flag).toBeGreaterThanOrEqual(0);
      expect(invocation.argvAfterExecutable.filter((value) => value === "--broker-runtime-evidence")).toHaveLength(
        1,
      );
      expect(invocation.argvAfterExecutable[flag + 1]).toBe(
        plan.inputPathInventories[stage].brokerChannelPath,
      );
    }
    expect(canonicalJson(plan.invocations)).not.toContain(
      "00-seed-run-request.v2.json",
    );
  });

  it("freezes exclusive read-only identity and nonmutation through exit", () => {
    const policy = plan.brokerChannelOwnershipAndMountPolicy;
    expect(policy.exclusiveWriter).toContain("trusted_broker");
    expect(policy.creationFlags).toEqual(
      expect.arrayContaining(["O_EXCL", "O_CLOEXEC", "O_NOFOLLOW"]),
    );
    expect(policy.brokerWriterDescriptorClosedBeforeSecureObservation).toBe(true);
    expect(policy.stageMountAccess).toBe("read_only");
    expect(policy.writableAliasOrSecondPathToChannelAllowed).toBe(false);
    expect(policy.channelRegularFileLinkCount).toBe(1);
    expect(policy.launchEnvelopeBindsPostMountObservationNotPreMountSourceObservation).toBe(
      true,
    );
    expect(policy.preExecOpenat2ObservationMustRecursivelyEqualLaunchObservation).toBe(
      true,
    );
    expect(policy.bootstrapFirstReadObservationMustRecursivelyEqualLaunchObservation).toBe(
      true,
    );
    expect(policy.postExitBeforeUnmountObservationMustRecursivelyEqualLaunchObservation).toBe(
      true,
    );
    expect(policy.mountAndUnderlyingFileMustRemainNonmutableThroughStageExitAndCgroupEmpty).toBe(
      true,
    );
  });

  it("keeps every absent authority null and every execution or claim lock false", () => {
    expect(Object.values(plan.externalBindings).every((value) => value === null)).toBe(
      true,
    );
    expect(plan.sourceClosureDisposition.producer.binding).toBeNull();
    expect(plan.sourceClosureDisposition.verifier.binding).toBeNull();
    expect(plan.sourceClosureDisposition.assembler.binding).toBeNull();
    for (const stage of ["producer", "verifier", "assembler"] as const) {
      expect(plan.sourceClosureDisposition[stage].reason).toContain(
        "source_exists_only_as_new_unsealed_files_pending_review_and_source_closure_manifest",
      );
    }
    expect(plan.sourceClosureDisposition.sourcePresenceAloneGrantsClosureAuthority).toBe(
      false,
    );
    expect(plan.providerPolicy.currentHostFallbackAllowed).toBe(false);
    expect(plan.providerPolicy.windowsProviderLaunchAllowed).toBe(false);
    expect(plan.providerPolicy.defaultProviderLaunchAllowed).toBe(false);
    expect(plan.providerPolicy.currentHostLaunchCount).toBe(0);
    expect(plan.providerPolicy.windowsLaunchCount).toBe(0);
    expect(plan.providerPolicy.defaultProviderLaunchCount).toBe(0);

    for (const value of Object.values(plan.executionState)) {
      expect(value === null || value === false).toBe(true);
    }
    expect(Object.values(plan.claimLocks).every((value) => value === false)).toBe(
      true,
    );
    expect(new Set(plan.claimLockKeys)).toEqual(new Set(Object.keys(plan.claimLocks)));
    const predecessorLocks =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1.claimLocks;
    expect(Object.keys(predecessorLocks)).toHaveLength(45);
    expect(plan.predecessor.claimLocks).toBe(predecessorLocks);
    expect(plan.predecessorClaimLockKeys).toEqual(Object.keys(predecessorLocks));
    for (const [key, value] of Object.entries(predecessorLocks)) {
      expect(value).toBe(false);
      expect(plan.claimLocks[key as keyof typeof plan.claimLocks]).toBe(value);
    }
    expect(plan.predecessorClaimLockKeys).toEqual(
      expect.arrayContaining([
        "rawReplayAdmission",
        "rawReplayAuthority",
        "runReplayAuthority",
        "pairAgreementAuthority",
        "semiclassicalStressNoiseLamp",
        "semiclassicalConstraintAlgebraLamp",
        "propulsion",
        "transport",
        "routeEta",
        "certifiedSpeed",
      ]),
    );
    expect(plan.successorClaimLockKeys.every((key) => key.startsWith("successor"))).toBe(
      true,
    );
    expect(
      plan.predecessorClaimLockKeys.filter((key) =>
        plan.successorClaimLockKeys.includes(
          key as (typeof plan.successorClaimLockKeys)[number],
        ),
      ),
    ).toEqual([]);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "closed_schema_typed_interpreter_binding_and_executable_authority_absent",
        "stage_local_broker_channel_writer_observer_and_read_only_mount_provider_absent",
      ]),
    );
  });

  it("pins the independently recomputed sealed preregistration identities", () => {
    expect(v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SHA256).toBe(
      domainHash(
        v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SHA256_DOMAIN,
        plan,
      ),
    );
    expect(v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CANONICAL_JSON).toBe(
      canonicalJson(plan),
    );
    expect(v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CANONICAL_SIZE_BYTES).toBe(
      Buffer.byteLength(canonicalJson(plan), "utf8"),
    );
    expect(v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING.sha256).toBe(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SHA256,
    );
    expect(v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_EXPECTED_SHA256).toBe(
      "c2483042ce046e2226e83ef9a3e90b381fe583483c0810ebd99d0af643c52f3f",
    );
    expect(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(128964);
    expect(v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SHA256).toBe(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_EXPECTED_SHA256,
    );
    expect(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CANONICAL_SIZE_BYTES,
    ).toBe(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_EXPECTED_SHA256,
    ).toBe("3aae03da02aca1ec23210eeba24536bca6cca880241c18778bf335fad78df284");
    expect(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(52841);
    expect(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING.sha256,
    ).toBe(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_EXPECTED_SHA256,
    );
    expect(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING.canonicalSizeBytes,
    ).toBe(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_LITERAL_SEAL_STATUS).toBe(
      "sealed_preregistration_read_only_red_team_clear",
    );
    expect(plan.maturity).toBe(
      "diagnostic_execution_contract_sealed_preregistration_no_capability_no_execution_no_artifact",
    );
    expect(plan.sealedPreregistrationPolicy).toEqual({
      literalExpectedSha256AndCanonicalSizeAddedOnlyAfterReadOnlyRedTeamClear:
        true,
      sealedPreregistrationBindingGrantsExecutionAuthority: false,
      sealedPreregistrationBindingGrantsArtifactOrScientificAuthority: false,
    });
    expect(
      plan.blockers.some((blocker) =>
        blocker.includes("literal_binding_not_red_team_cleared_or_sealed"),
      ),
    ).toBe(false);

    expect(
      createHash("sha256")
        .update(
          v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe("3f22c0a0d466ea6904985d7a4b17544fbf829bd92c4831a08bbacbe932192690");
    expect(
      createHash("sha256")
        .update(canonicalJson(registry), "utf8")
        .digest("hex"),
    ).toBe("347590023261c85a585cbb37ac22663ad6a4556e6e7452e3f6e25845de2ee04f");
  });

  it("defines seal pins as literals rather than tautological computed aliases", () => {
    const source = readFileSync(
      new URL(
        "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v2.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(source).toMatch(
      /RUN_PLAN_V2_EXPECTED_SHA256\s*=\s*\r?\n\s*"c2483042ce046e2226e83ef9a3e90b381fe583483c0810ebd99d0af643c52f3f"/,
    );
    expect(source).toMatch(
      /RUN_PLAN_V2_EXPECTED_CANONICAL_SIZE_BYTES\s*=\s*\r?\n\s*128964/,
    );
    expect(source).toMatch(
      /REGISTRY_EXPECTED_SHA256\s*=\s*\r?\n\s*"3aae03da02aca1ec23210eeba24536bca6cca880241c18778bf335fad78df284"/,
    );
    expect(source).toMatch(
      /REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES\s*=\s*\r?\n\s*52841/,
    );
    expect(source).not.toMatch(
      /EXPECTED_SHA256\s*=\s*\r?\n\s*NHM2_[A-Z0-9_]*_SHA256\b/,
    );
    expect(source).not.toMatch(
      /EXPECTED_CANONICAL_SIZE_BYTES\s*=\s*\r?\n\s*NHM2_[A-Z0-9_]*_CANONICAL_SIZE_BYTES\b/,
    );
  });

  it("deep-freezes the authority singleton and rejects external-copy authority", () => {
    expect(recursivelyFrozen(plan)).toBe(true);
    expect(recursivelyFrozen(registry)).toBe(true);
    expect(v2.isNhm2ProlateBosonStarNewtonianSeedRunPlanV2(plan)).toBe(true);
    const copy = JSON.parse(
      v2.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CANONICAL_JSON,
    );
    expect(v2.isNhm2ProlateBosonStarNewtonianSeedRunPlanV2(copy)).toBe(false);
    expect(v2.nhm2ProlateBosonStarNewtonianSeedRunPlanV2Violations(copy)).toEqual([
      "seed_run_plan_v2_external_copy_not_authoritative",
    ]);
    copy.executionState.executed = true;
    expect(v2.nhm2ProlateBosonStarNewtonianSeedRunPlanV2Violations(copy)).toEqual([
      "seed_run_plan_v2_semantic_mismatch",
    ]);
  });
});
