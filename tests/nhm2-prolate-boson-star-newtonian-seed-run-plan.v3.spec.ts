import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING,
} from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v2";
import { NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1 } from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed.v1";
import * as v3 from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v3";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord => value as UnknownRecord;

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new TypeError("noncanonical number");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (typeof value !== "object") {
    throw new TypeError("noncanonical value");
  }
  const record = asRecord(value);
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const sha256Hex = (domain: string, payload: string): string =>
  createHash("sha256")
    .update(domain, "utf8")
    .update(payload, "utf8")
    .digest("hex");

const resolvePath = (root: UnknownRecord, dottedPath: string): unknown =>
  dottedPath.split(".").reduce<unknown>((value, segment) => {
    if (typeof value !== "object" || value === null) return undefined;
    return asRecord(value)[segment];
  }, root);

const schemaExports = (): Array<[string, UnknownRecord]> =>
  Object.entries(v3)
    .filter(
      ([name, value]) =>
        name.endsWith("_SCHEMA") && typeof value === "object" && value !== null,
    )
    .map(([name, value]) => [name, asRecord(value)]);

const collectExactKeyMismatches = (
  value: unknown,
  pointer = "",
  mismatches: string[] = [],
): string[] => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectExactKeyMismatches(entry, `${pointer}/${index}`, mismatches),
    );
    return mismatches;
  }
  if (typeof value !== "object" || value === null) return mismatches;

  const record = asRecord(value);
  if (
    pointer !== "" &&
    typeof record.artifactId === "string" &&
    !record.artifactId.includes(".v3.")
  ) {
    return mismatches;
  }
  if (Array.isArray(record.exactKeys)) {
    if (record.fields === undefined) {
      mismatches.push(`${pointer || "/"}:missing-fields`);
    } else {
      const fields = asRecord(record.fields);
      const exactKeys = [...(record.exactKeys as string[])].sort();
      const fieldKeys = Object.keys(fields).sort();
      if (JSON.stringify(exactKeys) !== JSON.stringify(fieldKeys)) {
        mismatches.push(pointer || "/");
      }
    }
  }
  if (Array.isArray(record.itemExactKeys)) {
    if (record.itemFields === undefined) {
      mismatches.push(`${pointer || "/"}/item:missing-fields`);
    } else {
      const itemFields = asRecord(record.itemFields);
      const exactKeys = [...(record.itemExactKeys as string[])].sort();
      const fieldKeys = Object.keys(itemFields).sort();
      if (JSON.stringify(exactKeys) !== JSON.stringify(fieldKeys)) {
        mismatches.push(`${pointer || "/"}/item`);
      }
    }
  }
  Object.entries(record).forEach(([key, nested]) =>
    collectExactKeyMismatches(nested, `${pointer}/${key}`, mismatches),
  );
  return mismatches;
};

const collectStringItemSchemaReferences = (
  value: unknown,
  pointer = "",
  references: Array<[string, string]> = [],
): Array<[string, string]> => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectStringItemSchemaReferences(
        entry,
        `${pointer}/${index}`,
        references,
      ),
    );
    return references;
  }
  if (typeof value !== "object" || value === null) return references;
  const record = asRecord(value);
  if (typeof record.itemSchema === "string") {
    references.push([`${pointer}/itemSchema`, record.itemSchema]);
  }
  Object.entries(record).forEach(([key, nested]) =>
    collectStringItemSchemaReferences(nested, `${pointer}/${key}`, references),
  );
  return references;
};

const classifySyntheticResourceViolation = (
  counters: {
    canonicalUtf8Bytes?: number;
    depth?: number;
    totalNodes?: number;
    totalObjectKeys?: number;
    keysPerObject?: number;
    arrayLength?: number;
    utf8BytesPerString?: number;
    numericTokenBytes?: number;
    duplicateKey?: boolean;
    negativeZero?: boolean;
  },
  profile: string,
): string | null => {
  const registry = asRecord(
    v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY,
  );
  const policy = asRecord(registry.runtimeInstanceResourcePolicy);
  const caps = asRecord(policy.maximumCanonicalUtf8BytesByRuntimeProfile);
  const budgets = asRecord(policy.tokenizerAndStructureBudgets);
  if ((counters.canonicalUtf8Bytes ?? 0) > Number(caps[profile])) {
    return "file_size_cap_exceeded";
  }
  if ((counters.depth ?? 0) > Number(budgets.maximumDepth)) {
    return "maximum_depth_exceeded";
  }
  if ((counters.totalNodes ?? 0) > Number(budgets.maximumTotalNodes)) {
    return "maximum_total_nodes_exceeded";
  }
  if (
    (counters.totalObjectKeys ?? 0) > Number(budgets.maximumTotalObjectKeys)
  ) {
    return "maximum_total_object_keys_exceeded";
  }
  if ((counters.keysPerObject ?? 0) > Number(budgets.maximumKeysPerObject)) {
    return "maximum_keys_per_object_exceeded";
  }
  if ((counters.arrayLength ?? 0) > Number(budgets.maximumArrayLength)) {
    return "maximum_array_length_exceeded";
  }
  if (
    (counters.utf8BytesPerString ?? 0) >
    Number(budgets.maximumUtf8BytesPerString)
  ) {
    return "maximum_string_utf8_bytes_exceeded";
  }
  if (
    (counters.numericTokenBytes ?? 0) > Number(budgets.maximumNumericTokenBytes)
  ) {
    return "maximum_numeric_token_bytes_exceeded";
  }
  if (counters.duplicateKey === true) return "duplicate_object_key";
  if (counters.negativeZero === true) return "negative_zero_forbidden";
  return null;
};

describe("newtonian seed run plan v3 preregistration", () => {
  it("binds the exact sealed v2 predecessor without widening the common request", () => {
    const plan = v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3;
    expect(plan.predecessors.runPlanV2Binding).toEqual(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING,
    );
    expect(plan.commonRunRequestPolicy).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.commonRunRequestPolicy,
    );
    expect(
      plan.inputPathInventories.commonRunRequestMayContainV3RuntimeEvidence,
    ).toBe(false);
  });

  it("adds the two exact sealed policy-byte inputs at ordinals 8 and 9", () => {
    const profiles =
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POLICY_INPUT_PROFILES;
    expect(profiles.map(({ ordinal }) => ordinal)).toEqual([8, 9]);
    expect(profiles.map(({ byteLength }) => byteLength)).toEqual([
      243_240, 220_450,
    ]);
    expect(profiles.map(({ plainSha256 }) => plainSha256)).toEqual([
      "3ab28f4e777e201a0b6dac73cf637af901d28f2b86db590d18aced5d89e75b40",
      "e5cc63fe4f22831ab18bc33ec8f608ea23cbe934cf2160f5be47f9bb2680d2c1",
    ]);
    expect(
      profiles.every(
        ({ domainSeparatedBinding }) =>
          domainSeparatedBinding.canonicalSizeBytes > 0,
      ),
    ).toBe(true);
  });

  it("freezes producer, verifier, and assembler counts and ordinals", () => {
    const inventory =
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_INPUT_PATH_INVENTORIES;
    expect(inventory.producer.preChannelInputLedgerFileCount).toBe(10);
    expect(inventory.producer.launchVisibleFileCount).toBe(10);
    expect(inventory.verifier.preChannelInputLedgerFileCount).toBe(48);
    expect(inventory.verifier.staging32OrdinalRange).toEqual([10, 41]);
    expect(inventory.verifier.raw6OrdinalRange).toEqual([42, 47]);
    expect(inventory.verifier.channelObservationContextualPosition).toBe(48);
    expect(inventory.verifier.launchVisibleFileCount).toBe(49);
    expect(inventory.assembler.preChannelInputLedgerFileCount).toBe(44);
    expect(inventory.assembler.compositeReplayOrdinal).toBe(42);
    expect(inventory.assembler.verifierEnforcementReceiptOrdinal).toBe(43);
    expect(inventory.assembler.channelObservationContextualPosition).toBe(44);
    expect(inventory.assembler.launchVisibleFileCount).toBe(45);
    expect(inventory.assembler.rawEvidenceRootMounted).toBe(false);

    const base10 = [...inventory.baseInputAbsolutePathOrder];
    const producerLedger = [
      ...inventory.producer.preChannelInputLedgerFilePathOrder,
    ];
    const verifierLedger = [
      ...inventory.verifier.preChannelInputLedgerFilePathOrder,
    ];
    const assemblerLedger = [
      ...inventory.assembler.preChannelInputLedgerFilePathOrder,
    ];
    expect(producerLedger).toEqual(base10);
    expect(verifierLedger.slice(0, 10)).toEqual(base10);
    expect(assemblerLedger.slice(0, 10)).toEqual(base10);
    expect(new Set(producerLedger).size).toBe(producerLedger.length);
    expect(new Set(verifierLedger).size).toBe(verifierLedger.length);
    expect(new Set(assemblerLedger).size).toBe(assemblerLedger.length);
    expect(inventory.producer.launchVisibleFilePathOrder).toEqual(
      producerLedger,
    );
    expect(inventory.verifier.launchVisibleFilePathOrder).toEqual([
      ...verifierLedger,
      inventory.verifier.brokerChannelPath,
    ]);
    expect(inventory.assembler.launchVisibleFilePathOrder).toEqual([
      ...assemblerLedger,
      inventory.assembler.brokerChannelPath,
    ]);
    expect(verifierLedger.slice(42, 48)).toEqual([
      "/run/postprojection-evidence/L0/00-raw-scalar-u.f64le",
      "/run/postprojection-evidence/L0/01-raw-potential-v.f64le",
      "/run/postprojection-evidence/L1/00-raw-scalar-u.f64le",
      "/run/postprojection-evidence/L1/01-raw-potential-v.f64le",
      "/run/postprojection-evidence/L2/00-raw-scalar-u.f64le",
      "/run/postprojection-evidence/L2/01-raw-potential-v.f64le",
    ]);
  });

  it("keeps S32 and raw6 as disjoint roots and never mounts raw6 in the assembler", () => {
    const inventory =
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_INPUT_PATH_INVENTORIES;
    const verifierPaths = inventory.verifier.preChannelInputLedgerFilePathOrder;
    const assemblerPaths =
      inventory.assembler.preChannelInputLedgerFilePathOrder;
    expect(
      verifierPaths.filter((path) => path.startsWith("/run/staging/")),
    ).toHaveLength(32);
    expect(
      verifierPaths.filter((path) =>
        path.startsWith("/run/postprojection-evidence/"),
      ),
    ).toHaveLength(6);
    expect(
      assemblerPaths.some((path) =>
        path.startsWith("/run/postprojection-evidence/"),
      ),
    ).toBe(false);
    expect(inventory.roots.numericStaging32).not.toBe(
      inventory.roots.postprojectionRaw6,
    );
  });

  it("keeps one verifier, one composite, and gate evidence distinct from final admission", () => {
    const order =
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3
        .candidateComputationOrder;
    expect(order.oneVerifierProcess).toBe(true);
    expect(order.preExitOrder).toEqual([
      "candidate_postprojection_P",
      "candidate_numeric_materialization_N_if_P_matches",
      "candidate_full_seed_gate_evidence_if_N_matches",
      "one_composite_replay_bundle_close_and_fsync",
      "verifier_exit",
    ]);
    expect(order.standalonePostprojectionReceiptPathAllowed).toBe(false);
    expect(order.secondVerifierStageAllowed).toBe(false);
    expect(order.compositeReplayBundlePath).toBe(
      "/run/replay/seed-verifier-replay-bundle.canonical.json",
    );
  });

  it("registers every exported v3 schema exactly once and closes every key map", () => {
    const registry = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY,
    );
    const registeredSchemas = asRecord(registry.schemas);
    const schemaBindings = asRecord(registry.schemaBindings);
    const exports = schemaExports();
    const exportedValues = new Set(exports.map(([, schema]) => schema));
    const registeredValues = new Set(Object.values(registeredSchemas));

    expect(registeredValues).toEqual(exportedValues);
    expect(Object.values(registeredSchemas)).toHaveLength(exports.length);
    expect(registeredValues.size).toBe(exports.length);
    for (const [exportName, schema] of exports) {
      expect(
        Object.values(registeredSchemas).filter(
          (candidate) => candidate === schema,
        ),
        exportName,
      ).toHaveLength(1);
    }
    expect(Object.keys(schemaBindings).sort()).toEqual(
      Object.keys(registeredSchemas).sort(),
    );
    const missingOrMismatchedMaps = exports.flatMap(([name, schema]) =>
      collectExactKeyMismatches(schema).map((pointer) => `${name}${pointer}`),
    );
    expect(missingOrMismatchedMaps.sort()).toEqual(
      [
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_NUMERIC_STAGING32_COMPOSITE_SCHEMA/importedExactSchemas/numericN32Manifest/fields/entries/item:missing-fields",
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_NUMERIC_STAGING32_COMPOSITE_SCHEMA/importedExactSchemas/sealedPostpolicyS32ToN32Projection/fields/entries/item:missing-fields",
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_RAW_EVIDENCE6_COMPOSITE_SCHEMA/importedExactSchemas/sealedPostpolicyR6Manifest/fields/entries/item:missing-fields",
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_RAW_EVIDENCE6_COMPOSITE_SCHEMA/importedExactSchemas/sealedPostpolicyS6ToR6Projection/fields/entries/item:missing-fields",
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_VERIFIER_RUNTIME_CHANNEL_SCHEMA/topLevel/fields/implementationSeparationReceipt/fields/separationChecks/item:missing-fields",
      ].sort(),
    );
  });

  it("resolves every symbolic tuple item schema through the imported registry", () => {
    const registry = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY,
    );
    const registeredSchemas = asRecord(registry.schemas);
    const imported = asRecord(registry.importedPrimitiveSchemaRegistry);
    const allowedPaths = new Set(
      imported.allowedPrimitiveAndSchemaPaths as string[],
    );
    const references = Object.entries(registeredSchemas).flatMap(
      ([name, schema]) =>
        collectStringItemSchemaReferences(schema, `/schemas/${name}`),
    );

    expect(references.length).toBeGreaterThan(0);
    for (const [pointer, reference] of references.filter(([, value]) =>
      value.includes("."),
    )) {
      expect(
        resolvePath(registry, reference),
        `${pointer} -> ${reference}`,
      ).toBeDefined();
      const importedPath = reference.replace(
        /^importedPrimitiveSchemaRegistry\./,
        "",
      );
      expect(allowedPaths.has(importedPath), `${pointer} -> ${reference}`).toBe(
        true,
      );
    }
  });

  it("types every final descriptor projection-comparison tuple field", () => {
    const projection = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_PROJECTION_EQUALITY_SCHEMA,
    );
    const fields = asRecord(asRecord(projection.topLevel).fields);
    const comparisons = asRecord(fields.fieldComparisons);
    expect(Object.keys(asRecord(comparisons.itemFields)).sort()).toEqual(
      [...(comparisons.itemExactKeys as string[])].sort(),
    );
  });

  it("recomputes every schema binding, the registry binding, and the provisional root binding", () => {
    const registry = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY,
    );
    const schemas = asRecord(registry.schemas);
    const schemaBindings = asRecord(registry.schemaBindings);
    const schemaDomains = asRecord(asRecord(registry.domains).schemaBindings);
    for (const [name, schema] of Object.entries(schemas)) {
      const binding = asRecord(schemaBindings[name]);
      const schemaRecord = asRecord(schema);
      const canonical = canonicalJson(schema);
      expect(binding.artifactId, `${name}.artifactId`).toBe(
        schemaRecord.artifactId,
      );
      expect(binding.schemaVersion, `${name}.schemaVersion`).toBe(
        schemaRecord.schemaVersion,
      );
      expect(binding.sha256Domain, `${name}.sha256Domain`).toBe(
        schemaDomains[name],
      );
      expect(binding.canonicalSizeBytes, name).toBe(
        Buffer.byteLength(canonical, "utf8"),
      );
      expect(binding.sha256, name).toBe(
        sha256Hex(String(binding.sha256Domain), canonical),
      );
    }

    const registryCanonical = canonicalJson(registry);
    const registryBinding =
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING;
    expect(registryBinding.canonicalSizeBytes).toBe(
      Buffer.byteLength(registryCanonical, "utf8"),
    );
    expect(registryBinding.sha256).toBe(
      sha256Hex(registryBinding.sha256Domain, registryCanonical),
    );

    const plan = v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3;
    const planCanonical = canonicalJson(plan);
    const planBinding =
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING;
    expect(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANONICAL_JSON,
    ).toBe(planCanonical);
    expect(planBinding.artifactId).toBe(plan.artifactId);
    expect(planBinding.contractVersion).toBe(plan.contractVersion);
    expect(planBinding.sha256Domain).toBe(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SHA256_DOMAIN,
    );
    expect(planBinding.canonicalSizeBytes).toBe(
      Buffer.byteLength(planCanonical, "utf8"),
    );
    expect(planBinding.sha256).toBe(
      sha256Hex(
        v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SHA256_DOMAIN,
        planCanonical,
      ),
    );
  });

  it("resolves every binding profile and gives every domain one LF-terminated identity", () => {
    const registry = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY,
    );
    const profiles = asRecord(registry.bindingProfiles);
    for (const [name, rawProfile] of Object.entries(profiles)) {
      const profile = asRecord(rawProfile);
      const resolvedSchemaBinding = asRecord(
        resolvePath(registry, String(profile.schemaBinding)),
      );
      expect(
        resolvedSchemaBinding.artifactId,
        `${name}.schemaBinding.artifactId`,
      ).toBeTypeOf("string");
      expect(
        resolvedSchemaBinding.schemaVersion ??
          resolvedSchemaBinding.registryVersion,
        `${name}.schemaBinding.version`,
      ).toBeTypeOf("string");
      expect(
        resolvedSchemaBinding.sha256Domain,
        `${name}.schemaBinding.sha256Domain`,
      ).toMatch(/\n$/);
      expect(
        resolvedSchemaBinding.sha256,
        `${name}.schemaBinding.sha256`,
      ).toMatch(/^[0-9a-f]{64}$/);
      expect(
        resolvedSchemaBinding.canonicalSizeBytes,
        `${name}.schemaBinding.canonicalSizeBytes`,
      ).toSatisfy(
        (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0,
      );
      expect(
        resolvePath(registry, String(profile.domain)),
        `${name}.domain`,
      ).toBeDefined();
      if (profile.schema !== undefined) {
        expect(
          resolvePath(registry, String(profile.schema)),
          `${name}.schema`,
        ).toBeDefined();
      }
      if (profile.stageProfile !== undefined) {
        expect(
          resolvePath(registry, String(profile.stageProfile)),
          `${name}.stageProfile`,
        ).toBeDefined();
      }
      if (profile.rawObservedTarget !== undefined) {
        expect(
          resolvePath(registry, String(profile.rawObservedTarget)),
          `${name}.rawObservedTarget`,
        ).toBeDefined();
      }
    }

    const domains = asRecord(registry.domains);
    const allDomains = [
      ...Object.values(asRecord(domains.schemaBindings)),
      ...Object.values(asRecord(domains.runtimeInstances)),
    ].map(String);
    expect(new Set(allDomains).size).toBe(allDomains.length);
    expect(allDomains.every((domain) => domain.endsWith("\n"))).toBe(true);
    expect(allDomains.every((domain) => !domain.endsWith("\n\n"))).toBe(true);
  });

  it("covers every runtime profile with a positive bounded canonical-byte cap", () => {
    const registry = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY,
    );
    const profiles = asRecord(registry.bindingProfiles);
    const resourcePolicy = asRecord(registry.runtimeInstanceResourcePolicy);
    const caps = asRecord(
      resourcePolicy.maximumCanonicalUtf8BytesByRuntimeProfile,
    );
    expect(Object.keys(caps).sort()).toEqual(Object.keys(profiles).sort());
    expect(
      Object.values(caps).every(
        (cap) =>
          Number.isSafeInteger(cap) &&
          Number(cap) > 0 &&
          Number(cap) <= 32 * 1024 * 1024,
      ),
    ).toBe(true);
    expect(resourcePolicy.verifierCompositeOutputMaximumBytes).toBe(
      32 * 1024 * 1024,
    );
    const rawTargets = asRecord(
      resourcePolicy.rawObservedTargetMaximumCanonicalUtf8Bytes,
    );
    expect(rawTargets.finalDescriptorCanonicalBytes).toBe(16 * 1024 * 1024);
    expect(caps.finalDescriptorInstance).toBe(
      rawTargets.finalDescriptorCanonicalBytes,
    );
    const rawTargetReferences = Object.values(profiles)
      .map((rawProfile) => asRecord(rawProfile).rawObservedTarget)
      .filter((value): value is string => typeof value === "string")
      .sort();
    expect(rawTargetReferences).toEqual(
      Object.keys(rawTargets)
        .map(
          (key) =>
            `runtimeInstanceResourcePolicy.rawObservedTargetMaximumCanonicalUtf8Bytes.${key}`,
        )
        .sort(),
    );
    for (const [profileName, ownerProfileName] of Object.entries({
      compositeReplayBundle: "compositeReplayBundle",
      verifierChannelObservation: "verifierRuntimeChannel",
      assemblerChannelObservation: "assemblerRuntimeChannel",
      finalDescriptorInstance: "finalDescriptorInstance",
    })) {
      const profile = asRecord(profiles[profileName]);
      expect(
        resolvePath(registry, String(profile.rawObservedTarget)),
        profileName,
      ).toBe(caps[ownerProfileName]);
    }
    const preRead = asRecord(resourcePolicy.preReadPolicy);
    expect(preRead.declaredSizeCheckedBeforeAllocationOrParse).toBe(true);
    expect(preRead.boundedStreamingSha256BeforeParse).toBe(true);
    expect(
      preRead.bytesReadBeyondDeclaredOrProfileCapAllowedOnlyForSentinel,
    ).toBe(true);
    expect(preRead.maximumSentinelBytesBeyondCap).toBe(1);
    expect(
      preRead.capPlusOneSentinelReadRequiredWhenDeclaredSizeDoesNotAlreadyReject,
    ).toBe(true);
    expect(preRead.truncationAllowed).toBe(false);
    expect(preRead.partialHashBindingOrRegistrationAllowed).toBe(false);
  });

  it("maps every hostile runtime budget boundary to a closed failure code", () => {
    const registry = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY,
    );
    const policy = asRecord(registry.runtimeInstanceResourcePolicy);
    const caps = asRecord(policy.maximumCanonicalUtf8BytesByRuntimeProfile);
    const budgets = asRecord(policy.tokenizerAndStructureBudgets);
    const profile = "compositeReplayBundle";
    const rejection = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_RUNTIME_INSTANCE_INTERPRETATION_REJECTION_SCHEMA,
    );
    const failureCodes = new Set(
      (asRecord(rejection.topLevel).failureCodeEnum as string[]) ?? [],
    );
    const coherentWithinProfile = {
      canonicalUtf8Bytes: Number(caps[profile]),
    };
    expect(Number(budgets.maximumUtf8BytesPerString)).toBeLessThan(
      Math.min(...Object.values(caps).map(Number)),
    );

    const cases: Array<
      [string, Parameters<typeof classifySyntheticResourceViolation>[0]]
    > = [
      [
        "file_size_cap_exceeded",
        { canonicalUtf8Bytes: Number(caps[profile]) + 1 },
      ],
      [
        "maximum_depth_exceeded",
        { ...coherentWithinProfile, depth: Number(budgets.maximumDepth) + 1 },
      ],
      [
        "maximum_total_nodes_exceeded",
        {
          ...coherentWithinProfile,
          totalNodes: Number(budgets.maximumTotalNodes) + 1,
        },
      ],
      [
        "maximum_total_object_keys_exceeded",
        {
          ...coherentWithinProfile,
          totalObjectKeys: Number(budgets.maximumTotalObjectKeys) + 1,
        },
      ],
      [
        "maximum_keys_per_object_exceeded",
        {
          ...coherentWithinProfile,
          keysPerObject: Number(budgets.maximumKeysPerObject) + 1,
        },
      ],
      [
        "maximum_array_length_exceeded",
        {
          ...coherentWithinProfile,
          arrayLength: Number(budgets.maximumArrayLength) + 1,
        },
      ],
      [
        "maximum_string_utf8_bytes_exceeded",
        {
          ...coherentWithinProfile,
          utf8BytesPerString: Number(budgets.maximumUtf8BytesPerString) + 1,
        },
      ],
      [
        "maximum_numeric_token_bytes_exceeded",
        {
          ...coherentWithinProfile,
          numericTokenBytes: Number(budgets.maximumNumericTokenBytes) + 1,
        },
      ],
      [
        "duplicate_object_key",
        { ...coherentWithinProfile, duplicateKey: true },
      ],
      [
        "negative_zero_forbidden",
        { ...coherentWithinProfile, negativeZero: true },
      ],
    ];
    for (const [expected, counters] of cases) {
      expect(
        classifySyntheticResourceViolation(counters, profile),
        expected,
      ).toBe(expected);
      expect(failureCodes.has(expected), expected).toBe(true);
    }
    for (const [runtimeProfile, cap] of Object.entries(caps)) {
      expect(
        classifySyntheticResourceViolation(
          { canonicalUtf8Bytes: Number(cap) },
          runtimeProfile,
        ),
        `${runtimeProfile}.exact-cap`,
      ).toBeNull();
      expect(
        classifySyntheticResourceViolation(
          { canonicalUtf8Bytes: Number(cap) + 1 },
          runtimeProfile,
        ),
        `${runtimeProfile}.cap-plus-one`,
      ).toBe("file_size_cap_exceeded");
    }
    expect(
      classifySyntheticResourceViolation(
        {
          canonicalUtf8Bytes: Number(caps[profile]) + 1,
          depth: Number(budgets.maximumDepth) + 1,
          duplicateKey: true,
        },
        profile,
      ),
    ).toBe("file_size_cap_exceeded");

    const rejectionTop = asRecord(rejection.topLevel);
    const failureProfiles = asRecord(rejectionTop.failureProfiles);
    expect(
      asRecord(failureProfiles.raw_bytes_not_equal_recanonicalized_utf8)
        .canonicalizationCompleted,
    ).toBe(true);
    const postCanonical = asRecord(
      failureProfiles.postCanonicalValidationFailureCodes,
    );
    const preReadOrTokenizer = asRecord(
      failureProfiles.preReadOrTokenizerFailureCodes,
    );
    expect(postCanonical.canonicalizationCompleted).toBe(true);
    expect(preReadOrTokenizer.canonicalizationCompleted).toBe(false);
    const unknownProfile = asRecord(failureProfiles.unknown_runtime_profile);
    expect(unknownProfile.runtimeProfile).toBe("unrecognized_nonempty_string");
    expect(unknownProfile.maximumCanonicalUtf8BytesOrNull).toBeNull();
    expect(unknownProfile.canonicalizationCompleted).toBe(false);
    for (const key of [
      "attemptedFileObservationOrNull",
      "attemptedInstanceBindingOrNull",
      "declaredByteLengthOrNull",
      "observedByteLengthOrNull",
      "firstJsonPointerOrNull",
      "firstByteOffsetOrNull",
    ]) {
      expect(unknownProfile[key], key).toBeNull();
    }
    for (const key of [
      "bindingCreated",
      "interpretationAccepted",
      "registrationAllowed",
      "executionAuthorized",
      "seedAdmissionGranted",
      "artifactAccepted",
      "scientificAdmissionGranted",
      "physicalAuthorityGranted",
      "propulsionAuthorityGranted",
      "transportAuthorityGranted",
      "allPassed",
    ]) {
      expect(unknownProfile[key], key).toBe(false);
    }
    expect(rejectionTop.deterministicFailurePrecedence).toEqual([
      "unknown_runtime_profile",
      "secure_file_resolution_or_identity_changed",
      "declared_observed_size_or_unexpected_eof",
      "file_size_cap_exceeded",
      "maximum_depth_exceeded",
      "maximum_total_nodes_exceeded",
      "maximum_total_object_keys_exceeded",
      "maximum_keys_per_object_exceeded",
      "maximum_array_length_exceeded",
      "maximum_string_utf8_bytes_exceeded",
      "maximum_numeric_token_bytes_exceeded",
      "duplicate_object_key",
      "invalid_json_token_or_encoding",
      "negative_zero_forbidden",
      "raw_bytes_not_equal_recanonicalized_utf8",
      "exact_schema_or_union_profile_mismatch",
      "cross_field_invariant_mismatch",
      "asserted_instance_binding_mismatch",
    ]);
    expect(
      [
        "raw_bytes_not_equal_recanonicalized_utf8",
        "unknown_runtime_profile",
        ...(postCanonical.codes as string[]),
        ...(preReadOrTokenizer.codes as string[]),
      ].sort(),
    ).toEqual([...failureCodes].sort());
    for (const code of [
      "secure_file_resolution_or_identity_changed",
      "declared_observed_size_or_unexpected_eof",
      "unknown_runtime_profile",
      "exact_schema_or_union_profile_mismatch",
      "cross_field_invariant_mismatch",
      "asserted_instance_binding_mismatch",
    ]) {
      expect(failureCodes.has(code), code).toBe(true);
    }
    for (const key of [
      "bindingCreated",
      "interpretationAccepted",
      "registrationAllowed",
      "executionAuthorized",
      "seedAdmissionGranted",
      "artifactAccepted",
      "scientificAdmissionGranted",
      "physicalAuthorityGranted",
      "propulsionAuthorityGranted",
      "transportAuthorityGranted",
      "allPassed",
    ]) {
      expect(asRecord(rejectionTop.fields)[key], key).toBe("literal_false");
    }
    expect(
      classifySyntheticResourceViolation(
        {
          canonicalUtf8Bytes: Number(caps[profile]),
          depth: Number(budgets.maximumDepth),
          totalNodes: Number(budgets.maximumTotalNodes),
          totalObjectKeys: Number(budgets.maximumTotalObjectKeys),
          keysPerObject: Number(budgets.maximumKeysPerObject),
          arrayLength: Number(budgets.maximumArrayLength),
          utf8BytesPerString: Number(budgets.maximumUtf8BytesPerString),
          numericTokenBytes: Number(budgets.maximumNumericTokenBytes),
        },
        profile,
      ),
    ).toBeNull();
  });

  it("keeps P, N, and gate evidence as one value-bearing wrapper each", () => {
    const composite = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_COMPOSITE_REPLAY_BUNDLE_SCHEMA,
    );
    const topLevel = asRecord(composite.topLevel);
    const exactKeys = topLevel.exactKeys as string[];
    expect(exactKeys).toEqual(
      expect.arrayContaining([
        "candidatePWrapper",
        "candidatePWrapperBinding",
        "candidateNWrapperOrNull",
        "candidateNWrapperBindingOrNull",
        "candidateFullSeedGateEvidenceOrNull",
        "candidateFullSeedGateEvidenceBindingOrNull",
      ]),
    );
    for (const forbidden of [
      "representativeTuple",
      "numericMaterializationMatch",
      "positiveNumericReplayBundleOrNull",
      "verifierStageRuntimeConformance",
    ]) {
      expect(exactKeys).not.toContain(forbidden);
    }

    const nWrapper = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_N_WRAPPER_SCHEMA,
    );
    const nFields = asRecord(asRecord(nWrapper.topLevel).fields);
    expect(nFields.positiveNumericReplayBundleOrNull).toBeDefined();
    expect(asRecord(nWrapper.topLevel).forbiddenKeys).toEqual(
      expect.arrayContaining([
        "representativeTuple",
        "representativeTupleSha256",
        "representativeContinuumSha256",
      ]),
    );
  });

  it("carries each non-static evidence value beside the binding that names it", () => {
    const exactKeys = (schema: unknown): string[] => {
      const record = asRecord(schema);
      const surface =
        record.topLevel === undefined ? record : asRecord(record.topLevel);
      return surface.exactKeys as string[];
    };
    const expectPairs = (
      schema: unknown,
      pairs: ReadonlyArray<readonly [string, string]>,
    ): void => {
      const keys = exactKeys(schema);
      for (const [valueKey, bindingKey] of pairs) {
        expect(keys, valueKey).toContain(valueKey);
        expect(keys, bindingKey).toContain(bindingKey);
      }
    };

    expectPairs(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_NUMERIC_STAGING32_COMPOSITE_SCHEMA,
      [
        [
          "v3SecureStaging32ObservationClosure",
          "v3SecureStaging32ObservationClosureBinding",
        ],
        [
          "importedV2CompatibleS32Projection",
          "importedV2CompatibleS32ProjectionBinding",
        ],
        ["numericPolicyN32Manifest", "numericPolicyN32ManifestBinding"],
        [
          "sealedPostpolicyS32ToN32ProjectionReceipt",
          "sealedPostpolicyS32ToN32ProjectionReceiptBinding",
        ],
        [
          "sealedPostpolicyNumericStaging32RuntimeClosure",
          "sealedPostpolicyNumericStaging32RuntimeClosureBinding",
        ],
      ],
    );
    expectPairs(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_RAW_EVIDENCE6_COMPOSITE_SCHEMA,
      [
        [
          "v3SecureRaw6ObservationClosure",
          "v3SecureRaw6ObservationClosureBinding",
        ],
        [
          "sealedPostpolicyCompatibleS6Projection",
          "sealedPostpolicyCompatibleS6ProjectionBinding",
        ],
        [
          "postprojectionPolicyR6Manifest",
          "postprojectionPolicyR6ManifestBinding",
        ],
        [
          "sealedPostpolicyS6ToR6ProjectionReceipt",
          "sealedPostpolicyS6ToR6ProjectionReceiptBinding",
        ],
        [
          "sealedPostpolicyRawEvidenceRuntimeClosure",
          "sealedPostpolicyRawEvidenceRuntimeClosureBinding",
        ],
      ],
    );
    expectPairs(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_INSTANCE_IDENTITY_SCHEMA,
      [
        [
          "producerFullEnforcementReceipt",
          "producerFullEnforcementReceiptBinding",
        ],
        ["numericStaging32Composite", "numericStaging32CompositeBinding"],
        ["rawEvidence6Composite", "rawEvidence6CompositeBinding"],
        [
          "sealedPostpolicyCandidateInstanceIdentity",
          "sealedPostpolicyCandidateInstanceIdentityBinding",
        ],
      ],
    );
    expectPairs(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_UNTRUSTED_CANDIDATE_P_WRAPPER_SCHEMA,
      [
        [
          "verifierStageRuntimeConformance",
          "verifierStageRuntimeConformanceBinding",
        ],
        ["candidateP", "candidatePReceiptInstanceBinding"],
      ],
    );
    expectPairs(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_N_WRAPPER_SCHEMA,
      [
        [
          "positiveNumericReplayBundleOrNull",
          "positiveNumericReplayBundleBindingOrNull",
        ],
        [
          "multipolePassThroughValidationReceiptOrNull",
          "multipolePassThroughValidationReceiptBindingOrNull",
        ],
        [
          "exteriorHLowerBoundEvidenceOrNull",
          "exteriorHLowerBoundEvidenceBindingOrNull",
        ],
        [
          "continuousNodelessProofCoreResultOrNull",
          "continuousNodelessProofCoreResultBindingOrNull",
        ],
      ],
    );
    expectPairs(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA,
      [
        [
          "verifierClosedOutputObservation",
          "verifierClosedOutputObservationBinding",
        ],
        [
          "brokerRuntimeSeparationReceipt",
          "brokerRuntimeSeparationReceiptBinding",
        ],
        [
          "typedInterpreterValidationReceipt",
          "typedInterpreterValidationReceiptBinding",
        ],
        [
          "atomicNestedRegistrationReceipt",
          "atomicNestedRegistrationReceiptBinding",
        ],
      ],
    );
  });

  it("keeps runtime failure typed, postlaunch, and short-circuited before N and F", () => {
    const runtime = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_RUNTIME_CONFORMANCE_SCHEMA,
    );
    const runtimeTop = asRecord(runtime.topLevel);
    const profiles = asRecord(runtimeTop.dispositionProfiles);
    expect(asRecord(profiles.conformant).passed).toBe(true);
    expect(asRecord(profiles.rejection).passed).toBe(false);
    expect(
      asRecord(profiles.rejection).firstPolicyWorkMonotonicNanosecondsOrNull,
    ).toBeNull();
    expect(asRecord(profiles.rejection).noPolicyArithmeticBegan).toBe(true);

    const pWrapper = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_UNTRUSTED_CANDIDATE_P_WRAPPER_SCHEMA,
    );
    expect(canonicalJson(pWrapper)).toContain("postlaunch_formable_rejection");
    expect(canonicalJson(pWrapper)).toContain("runtime_binding_mismatch");
    const pProfiles = asRecord(
      asRecord(pWrapper.topLevel).wrapperDispositionProfiles,
    );
    expect(
      asRecord(pProfiles.match).verifierStageRuntimeConformanceDisposition,
    ).toBe("conformant");
    expect(
      asRecord(pProfiles.postlaunch_formable_rejection)
        .verifierStageRuntimeConformanceDisposition,
    ).toContain("conformant_for_every_candidateP_failureCode_except");
    expect(
      asRecord(pProfiles.postlaunch_formable_rejection)
        .runtimeRejectionIffCandidatePFailureCode,
    ).toBe("runtime_binding_mismatch");

    const composite = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_COMPOSITE_REPLAY_BUNDLE_SCHEMA,
    );
    const pRejection = asRecord(
      asRecord(asRecord(composite.topLevel).outcomeProfiles).P_rejection,
    );
    expect(pRejection.candidatePWrapperDisposition).toBe(
      "postlaunch_formable_rejection",
    );
    expect(pRejection.candidateNWrapperOrNull).toBeNull();
    expect(pRejection.candidateFullSeedGateEvidenceOrNull).toBeNull();
  });

  it("types prelaunch verifier-context failure without launching or emitting replay", () => {
    const rejection = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_VERIFIER_PRELAUNCH_CONTEXT_REJECTION_SCHEMA,
    );
    const top = asRecord(rejection.topLevel);
    const fields = asRecord(top.fields);
    expect(fields.disposition).toBe(
      "literal_broker_prelaunch_context_rejection",
    );
    expect(fields.verifierWorkerAttemptBindingOrNull).toBeDefined();
    for (const key of [
      "verifierSourceManifestBindingOrNull",
      "verifierToolchainManifestBindingOrNull",
      "verifierExecutableBindingOrNull",
      "verifierOciImageDigestOrNull",
      "typedInterpreterBindingOrNull",
      "independentProofKernelBindingOrNull",
      "independentProofKernelToolchainBindingOrNull",
      "mpfrGmpRuntimeManifestBindingOrNull",
      "attemptedVerifierLaunchEnvelopeBindingOrNull",
    ]) {
      expect(fields[key], key).toBeDefined();
    }
    const failureCodes = top.failureCodeEnum as string[];
    const firstFields = top.firstFailedContextFieldEnum as string[];
    expect(failureCodes).toHaveLength(firstFields.length);
    expect(new Set(top.deterministicFailurePrecedence as string[])).toEqual(
      new Set(failureCodes),
    );
    expect(failureCodes).toEqual(
      expect.arrayContaining([
        "verifier_source_toolchain_executable_or_oci_missing_or_invalid",
        "typed_interpreter_missing_or_invalid",
        "mpfr_gmp_runtime_manifest_missing_or_invalid",
        "proof_kernel_or_toolchain_missing_or_invalid",
        "verifier_launch_envelope_formation_failed",
      ]),
    );
    for (const key of [
      "verifierLaunchEnvelopeBinding",
      "compositeReplayBundleBinding",
      "verifierFullEnforcementReceiptBinding",
      "typedInterpreterValidationReceiptBinding",
      "atomicNestedRegistrationReceiptBinding",
      "assemblerLaunchEnvelopeBinding",
    ]) {
      expect(fields[key], key).toBe("literal_null");
    }
    for (const key of [
      "verifierLaunchAuthorized",
      "executionAuthorized",
      "registrationAllowed",
      "seedAdmissionGranted",
      "artifactAccepted",
      "scientificAdmissionGranted",
      "physicalAuthorityGranted",
      "propulsionAuthorityGranted",
      "transportAuthorityGranted",
      "allPassed",
    ]) {
      expect(fields[key], key).toBe("literal_false");
    }
    expect(canonicalJson(top.crossFieldInvariants)).toContain(
      "distinct_from_runtimeInstanceInterpretationRejection",
    );
    expect(canonicalJson(top.crossFieldInvariants)).toContain(
      "no_valid_or_admitted_verifierLaunchEnvelopeBinding_composite_full-verifier-E",
    );
    expect(canonicalJson(top.crossFieldInvariants)).toContain(
      "attemptedVerifierLaunchEnvelopeBindingOrNull_may_hold_only_an_untrusted",
    );

    const channelFields = asRecord(
      asRecord(
        v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_VERIFIER_RUNTIME_CHANNEL_SCHEMA,
      ).topLevel,
    ).fields;
    expect(asRecord(channelFields).independentProofKernelBinding).toBeDefined();
    expect(
      asRecord(channelFields).independentProofKernelToolchainBinding,
    ).toBeDefined();
    expect(asRecord(channelFields).independentProofKernelBinding).not.toBe(
      asRecord(channelFields).independentProofKernelToolchainBinding,
    );
    const launchFields = asRecord(
      asRecord(
        v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_LAUNCH_ENVELOPE_SCHEMA,
      ).topLevel,
    ).fields;
    expect(
      asRecord(launchFields).independentProofKernelBindingOrNull,
    ).toBeDefined();
    const fullVerifier = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FULL_VERIFIER_ENFORCEMENT_SCHEMA,
    );
    const fullFields = asRecord(asRecord(fullVerifier.topLevel).fields);
    expect(String(fullFields.proofKernelBinding)).toContain(
      "channel.independentProofKernelBinding",
    );
    expect(fullFields.singleCompositeOutputLifecyclePassed).toBe(
      "literal_true",
    );
    expect(fullFields.candidateOrderPassed).toBeUndefined();
    expect(
      canonicalJson(asRecord(fullVerifier.topLevel).crossFieldInvariants),
    ).toContain("cross-substitution_is_forbidden");
    expect(
      canonicalJson(asRecord(fullVerifier.topLevel).crossFieldInvariants),
    ).toContain("candidateDependencyOrderValidated_exists_only_in_the_later");
  });

  it("bridges imported P and N identities without aliasing their sealed domains", () => {
    const pWrapper = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_UNTRUSTED_CANDIDATE_P_WRAPPER_SCHEMA,
    );
    const pTop = asRecord(pWrapper.topLevel);
    const pProfiles = asRecord(pTop.wrapperDispositionProfiles);
    const pMatchBridge = String(
      asRecord(pProfiles.match).candidatePCompactIdentityBridge,
    );
    const pRejectionBridge = String(
      asRecord(pProfiles.postlaunch_formable_rejection)
        .candidatePCompactIdentityBridge,
    );
    expect(pMatchBridge).toContain("candidateP.candidateInstanceIdentity_and_");
    expect(pMatchBridge).not.toContain("candidateInstanceIdentityOrNull");
    expect(pRejectionBridge).toContain("candidateInstanceIdentityOrNull");
    expect(canonicalJson(pTop.crossFieldInvariants)).toContain(
      "binding_are_distinct",
    );

    const nWrapper = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_N_WRAPPER_SCHEMA,
    );
    const nProfiles = asRecord(asRecord(nWrapper.topLevel).dispositionProfiles);
    const positiveBridge = String(
      asRecord(nProfiles.positive_match).numericStagingBridge,
    );
    const rejectionBridge = String(
      asRecord(nProfiles.rejection).numericStagingBridge,
    );
    expect(positiveBridge).toContain("numericPolicyN32ManifestBinding");
    expect(positiveBridge).toContain(
      "numericMaterializationMatch.stagingBinding",
    );
    expect(rejectionBridge).toContain("stagingBindingOrNull");
    expect(rejectionBridge).toContain("exact_sealed_unformable-rule");
    const nInvariants = canonicalJson(
      asRecord(nWrapper.topLevel).crossFieldInvariants,
    );
    expect(nInvariants).toContain(
      "exteriorHLowerBoundEvidenceOrNull.proofKernelBinding",
    );
    expect(nInvariants).toContain(
      "continuousNodelessProofCoreResultOrNull.proofKernelBinding",
    );
    expect(nInvariants).toContain("independent-proof-kernel-toolchain_binding");
    expect(nInvariants).toContain("distinct_actual-kernel");
    expect(nInvariants).not.toContain("fullVerifierE.");

    const gate = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_FULL_SEED_GATE_EVIDENCE_SCHEMA,
    );
    const gateInvariants = canonicalJson(gate.crossFieldInvariants);
    expect(gateInvariants).toContain(
      "continuousNodelessProofReceiptOrNull.proofKernelBinding",
    );
    expect(gateInvariants).toContain(
      "numericalOriginSeriesDefectReceiptOrNull.proofKernelBinding",
    );
    expect(gateInvariants).toContain(
      "continuousPeakProofReceiptOrNull.proofKernelBinding",
    );
    expect(gateInvariants).toContain("actual-kernel_bindings_must_never_equal");
    expect(gateInvariants).not.toContain("fullVerifierE.");

    const composite = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_COMPOSITE_REPLAY_BUNDLE_SCHEMA,
    );
    expect(
      canonicalJson(asRecord(composite.topLevel).crossFieldInvariants),
    ).not.toContain("full-verifier-E_binds_the_attempt-scoped_wrapper");
  });

  it("creates post-exit P acceptance and final F without a hash cycle", () => {
    const pAcceptance = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_POSTPROJECTION_ACCEPTANCE_SCHEMA,
    );
    const pTop = asRecord(pAcceptance.topLevel);
    expect(pTop.forbiddenKeys).toEqual(
      expect.arrayContaining(["typedInterpreterValidationReceiptBinding"]),
    );
    const pFields = asRecord(pTop.fields);
    expect(pFields.postprojectionAcceptanceGranted).toBe("literal_true");
    expect(pFields.scientificAdmissionGranted).toBe("literal_false");
    expect(pFields.seedAdmissionGranted).toBe("literal_false");
    expect(pFields.artifactAdmissionGranted).toBe("literal_false");

    const finalF = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_FINAL_FULL_SEED_ADMISSION_SCHEMA,
    );
    const fTop = asRecord(finalF.topLevel);
    expect(fTop.forbiddenKeys).toEqual(
      expect.arrayContaining(["typedInterpreterValidationReceiptBinding"]),
    );
    const match = asRecord(asRecord(fTop.dispositionProfiles).match);
    expect(match.seedAdmissionGranted).toBe(true);
    expect(match.scientificAdmissionGranted).toBe(false);
    expect(match.artifactAdmissionGranted).toBe(false);
  });

  it("keeps every declared future field out of the object it would cycle into", () => {
    for (const [name, schema] of schemaExports()) {
      const surface = asRecord(schema.topLevel ?? schema);
      const exactKeys = new Set((surface.exactKeys as string[]) ?? []);
      for (const forbidden of (surface.forbiddenKeys as string[]) ?? []) {
        expect(exactKeys.has(forbidden), `${name}.${forbidden}`).toBe(false);
      }
    }

    const expectNoKeys = (
      schema: unknown,
      forbidden: readonly string[],
    ): void => {
      const record = asRecord(schema);
      const surface = asRecord(record.topLevel ?? record);
      const keys = surface.exactKeys as string[];
      for (const key of forbidden) expect(keys).not.toContain(key);
    };
    expectNoKeys(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_COMPOSITE_REPLAY_BUNDLE_SCHEMA,
      [
        "verifierFullEnforcementReceiptBinding",
        "brokerRuntimeSeparationReceiptBinding",
        "typedInterpreterValidationReceiptBinding",
        "atomicNestedRegistrationReceiptBinding",
        "assemblerRuntimeChannelBinding",
      ],
    );
    expectNoKeys(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FULL_VERIFIER_ENFORCEMENT_SCHEMA,
      [
        "brokerRuntimeSeparationReceiptBinding",
        "typedInterpreterValidationReceiptBinding",
        "atomicNestedRegistrationReceiptBinding",
        "assemblerRuntimeChannelBinding",
      ],
    );
    expectNoKeys(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_TYPED_INTERPRETER_VALIDATION_SCHEMA,
      [
        "atomicNestedRegistrationReceiptBinding",
        "assemblerRuntimeChannelBinding",
      ],
    );
    expectNoKeys(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ATOMIC_NESTED_REGISTRATION_SCHEMA,
      [
        "assemblerRuntimeChannelBinding",
        "assemblerFullEnforcementReceiptBinding",
      ],
    );
  });

  it("registers only positive dependency nodes and launches the assembler only terminally", () => {
    const registration = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ATOMIC_NESTED_REGISTRATION_SCHEMA,
    );
    const profiles = asRecord(asRecord(registration.topLevel).outcomeProfiles);
    expect(asRecord(profiles.P_rejection).registrationOrder).toEqual([]);
    expect(asRecord(profiles.P_match_N_rejection).registrationOrder).toEqual([
      "postprojectionAcceptance",
    ]);
    expect(
      asRecord(profiles.PN_match_gate_evidence_rejection).registrationOrder,
    ).toEqual(["postprojectionAcceptance", "candidateNWrapper"]);
    expect(
      asRecord(profiles.PN_match_gate_evidence_complete).registrationOrder,
    ).toEqual([
      "postprojectionAcceptance",
      "candidateNWrapper",
      "validatedFinalFullSeedAdmission",
    ]);
    expect(
      asRecord(profiles.PN_match_gate_evidence_complete)
        .assemblerLaunchEligible,
    ).toBe(true);
    expect(
      Object.entries(profiles)
        .filter(([name]) => name !== "PN_match_gate_evidence_complete")
        .every(
          ([, profile]) => asRecord(profile).assemblerLaunchEligible === false,
        ),
    ).toBe(true);

    const assembler = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA,
    );
    const assemblerFields = asRecord(asRecord(assembler.topLevel).fields);
    expect(
      String(assemblerFields.positiveNumericReplayBundleBinding),
    ).toContain("support_binding");
    expect(
      String(assemblerFields.positiveNumericReplayBundleBinding),
    ).not.toContain("registered_positive-N-replay");
    expect(
      String(assemblerFields.positiveNumericReplayBundleBinding),
    ).toContain("not_a_separate_registered_node");
  });

  it("securely rereads S32 and raw6 post-exit and recomputes every digest recipe", () => {
    const typed = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_TYPED_INTERPRETER_VALIDATION_SCHEMA,
    );
    const fields = asRecord(asRecord(typed.topLevel).fields);
    for (const key of [
      "postexitEvidenceRereadStartMonotonicNanoseconds",
      "postexitEvidenceRereadEndMonotonicNanoseconds",
      "postexitSecureStaging32ObservationClosure",
      "postexitSecureStaging32ObservationClosureBinding",
      "postexitSecureRawEvidence6ObservationClosure",
      "postexitSecureRawEvidence6ObservationClosureBinding",
      "postexitEvidenceHashCrosswalk",
    ]) {
      expect(fields[key], key).toBeDefined();
    }
    expect(fields.evidenceRootsReadOnlyUntilRereadEnd).toBe("literal_true");
    expect(String(fields.postexitSecureStaging32ObservationClosure)).toContain(
      "postexitSecureStaging32Reread",
    );
    expect(
      String(fields.postexitSecureRawEvidence6ObservationClosure),
    ).toContain("postexitSecureRawEvidence6Reread");

    for (const schema of [
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_SECURE_STAGING32_REREAD_SCHEMA,
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_SECURE_RAW_EVIDENCE6_REREAD_SCHEMA,
    ]) {
      const text = canonicalJson(schema);
      expect(text).toContain(
        "full-verifier-E_and_broker-runtime-separation_close",
      );
      expect(text).not.toContain("before_verifier_channel_assembly");
    }

    const crosswalk = asRecord(fields.postexitEvidenceHashCrosswalk);
    const crosswalkFields = asRecord(crosswalk.fields);
    const numeric = asRecord(crosswalkFields.numeric32Entries);
    const raw6 = asRecord(crosswalkFields.raw6Entries);
    expect(numeric.exactLength).toBe(32);
    expect(raw6.exactLength).toBe(6);
    const numericItem = asRecord(numeric.itemFields);
    expect(numericItem.freshPlainSha256).toBeDefined();
    expect(numericItem.seedV1ArrayDomainSha256).toBeDefined();
    expect(numericItem.freshPlainSha256).not.toBe(
      numericItem.seedV1ArrayDomainSha256,
    );
    expect(numericItem.allRecipesRecomputedFromSameRawBytes).toBe(
      "literal_true",
    );
    const rawItem = asRecord(raw6.itemFields);
    expect(rawItem.freshPlainSha256).toBeDefined();
    expect(rawItem.postprojectionDomainSha256).toBeDefined();
    expect(rawItem.freshPlainSha256).not.toBe(
      rawItem.postprojectionDomainSha256,
    );
    expect(rawItem.allRecipesRecomputedFromSameRawBytes).toBe("literal_true");
  });

  it("durably observes the exact composite and full-verifier enforcement paths", () => {
    const typed = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_TYPED_INTERPRETER_VALIDATION_SCHEMA,
    );
    const top = asRecord(typed.topLevel);
    const fields = asRecord(top.fields);
    expect(fields.rawCompositeReplayAbsolutePath).toBe(
      "/run/replay/seed-verifier-replay-bundle.canonical.json",
    );
    expect(fields.rawVerifierEnforcementAbsolutePath).toBe(
      "/run/attestation/verifier-stage-enforcement-receipt.canonical.json",
    );
    const durableWrite = asRecord(
      fields.verifierFullEnforcementDurableWriteReceipt,
    );
    expect(Object.keys(asRecord(durableWrite.fields)).sort()).toEqual(
      [...(durableWrite.exactKeys as string[])].sort(),
    );
    const durableFields = asRecord(durableWrite.fields);
    expect(durableFields.absolutePath).toBe(
      fields.rawVerifierEnforcementAbsolutePath,
    );
    expect(durableFields.oExclUsed).toBe("literal_true");
    expect(
      durableFields.fileCloseAndFsyncEndMonotonicNanoseconds,
    ).toBeDefined();
    expect(
      durableFields.parentDirectoryFsyncEndMonotonicNanoseconds,
    ).toBeDefined();
    const invariants = canonicalJson(top.crossFieldInvariants);
    expect(invariants).toContain("for_every_postlaunch_composite_outcome");
    expect(invariants).toContain("parent-directory-fsynced");
    expect(invariants).toContain(
      "only_the_later_exact-one-attestation-root-observation_and_assembler path are conditional",
    );

    const plan = v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3;
    expect(plan.candidateComputationOrder.rejectionTermination).toContain(
      "after_the_mandatory_full-E_durable-attestation-file-write-and-fresh-raw-observation",
    );
    expect(plan.candidateComputationOrder.rejectionTermination).toContain(
      "before_the_terminal-positive_exact-one-attestation-root-poststate-observation-and-closure",
    );
  });

  it("timestamps full verifier enforcement, runtime separation, and postexit rereads", () => {
    const separation = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BROKER_RUNTIME_SEPARATION_SCHEMA,
    );
    const separationTop = asRecord(separation.topLevel);
    const separationFields = asRecord(separationTop.fields);
    expect(separationFields.clockId).toBe("literal_CLOCK_MONOTONIC_RAW");
    expect(
      separationFields.verifierFullEnforcementPostExitObservationMonotonicNanoseconds,
    ).toBeDefined();
    expect(
      separationFields.separationObservationStartMonotonicNanoseconds,
    ).toBeDefined();
    expect(
      separationFields.separationReceiptCloseMonotonicNanoseconds,
    ).toBeDefined();
    expect(canonicalJson(separationTop.crossFieldInvariants)).toContain(
      "later_postexit-S32-and-S6-reread_schemas_cross-bind_this_exact_close",
    );

    for (const schema of [
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_SECURE_STAGING32_REREAD_SCHEMA,
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_SECURE_RAW_EVIDENCE6_REREAD_SCHEMA,
    ]) {
      const surface = asRecord(asRecord(schema).topLevel);
      const keys = surface.exactKeys as string[];
      expect(keys).toEqual(
        expect.arrayContaining([
          "verifierFullEnforcementReceiptBinding",
          "brokerRuntimeSeparationReceiptBinding",
          "observationStartMonotonicNanoseconds",
          "observationEndMonotonicNanoseconds",
        ]),
      );
      expect(canonicalJson(surface.crossFieldInvariants)).toContain(
        "broker-runtime-separation_close_strictly_before_observationStart",
      );
    }
  });

  it("closes exactly 32 copied arrays plus a descriptor and admits only that seed artifact", () => {
    const closed = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ASSEMBLER_CLOSED_OUTPUT_SCHEMA,
    );
    const closedFields = asRecord(asRecord(closed.topLevel).fields);
    expect(closedFields.requiredFileCount).toBe("literal_33");
    expect(asRecord(closedFields.fileObservations).exactLength).toBe(33);
    expect(asRecord(closedFields.directoryObservations).exactLength).toBe(5);
    expect(closedFields.descriptorObservationOrdinal).toBe("literal_32");
    expect(closedFields.descriptorWasLastFilesystemWrite).toBe("literal_true");

    const projection = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_PROJECTION_EQUALITY_SCHEMA,
    );
    const projectionFields = asRecord(asRecord(projection.topLevel).fields);
    const comparisons = asRecord(projectionFields.fieldComparisons);
    expect(comparisons.exactLength).toBe(6);
    expect(
      (comparisons.exactPointerOrder as string[][]).every(([source]) =>
        source.startsWith("/candidateFullSeedGateEvidenceOrNull/"),
      ),
    ).toBe(true);
    const arrays = asRecord(projectionFields.arrayByteComparisons);
    expect(arrays.exactLength).toBe(32);
    const arrayItem = asRecord(arrays.itemFields);
    expect(arrayItem.sourceStagingPlainSha256).toBeDefined();
    expect(arrayItem.descriptorInventorySha256).toBeDefined();
    expect(arrayItem.sourceStagingPlainSha256).not.toBe(
      arrayItem.descriptorInventorySha256,
    );

    const artifactReceipt = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_ARTIFACT_BINDING_RECEIPT_SCHEMA,
    );
    expect(artifactReceipt.importedSeedV1ArtifactHashPolicy).toEqual({
      artifactKind:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
          .artifactKind,
      sha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
          .sha256Domain,
      artifactHashRecipe:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
          .artifactHashRecipe,
    });
    const artifactTop = asRecord(artifactReceipt.topLevel);
    const artifactFields = asRecord(artifactTop.fields);
    expect(artifactTop.exactKeys).not.toEqual(
      expect.arrayContaining([
        "finalArtifactBindingReceipt",
        "finalArtifactBindingReceiptBinding",
      ]),
    );
    expect(artifactTop.forbiddenKeys).toEqual(
      expect.arrayContaining([
        "finalAdmissionReceiptBinding",
        "seedArtifactAccepted",
      ]),
    );
    const finalArtifactBinding = asRecord(artifactFields.finalArtifactBinding);
    const finalArtifactFields = asRecord(finalArtifactBinding.fields);
    expect(finalArtifactFields.artifactKind).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
        .artifactKind,
    );
    expect(finalArtifactFields.sha256Domain).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
        .sha256Domain,
    );
    expect(String(finalArtifactFields.sha256)).toContain("u64be");
    expect(String(finalArtifactFields.sha256)).toContain(
      "same_raw_schema-valid_canonical_descriptor_UTF8_bytes",
    );
    expect(String(artifactFields.canonicalDescriptorPlainSha256)).toContain(
      "plain_SHA256",
    );
    expect(canonicalJson(artifactTop.crossFieldInvariants)).toContain(
      "none_of_the_three_digests_is_substituted_for_another",
    );

    const finalAdmission = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_ADMISSION_SCHEMA,
    );
    const finalTop = asRecord(finalAdmission.topLevel);
    const finalFields = asRecord(finalTop.fields);
    expect(finalTop.exactKeys).toEqual(
      expect.arrayContaining([
        "finalArtifactBindingReceipt",
        "finalArtifactBindingReceiptBinding",
      ]),
    );
    expect(finalFields.finalArtifactBindingReceipt).toBeDefined();
    expect(finalFields.finalArtifactBindingReceiptBinding).toBeDefined();
    expect(finalFields.seedArtifactAccepted).toBe("literal_true");
    expect(finalFields.physicalAuthorityGranted).toBe("literal_false");
    expect(finalFields.propulsionAuthorityGranted).toBe("literal_false");
    expect(finalFields.transportAuthorityGranted).toBe("literal_false");
    expect(finalFields.allPassed).toBe("literal_true");
  });

  it("orders every producer, verifier, broker, assembler, and final phase acyclically", () => {
    const registry = asRecord(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY,
    );
    const chronology = asRecord(registry.chronology);
    const order = chronology.exactAcyclicOrder as string[];
    const requiredInOrder = [
      "five_root_prestate",
      "producer_base10_ledger",
      "producer_writes_exact32_and_exact6",
      "O38_pre-enforcement",
      "full_producer_E",
      "post-E_secure_S32_and_S6",
      "N32_and_R6_manifests",
      "candidate_identity_binding",
      "verifier_48-ledger",
      "single_verifier_candidate_P",
      "verifier_closed-output-observation",
      "broker_runtime-separation",
      "terminal-positive-only_exact-one_attestation-root",
      "assembler_44-ledger",
      "assembler_writes_exact32_arrays_then_descriptor-last",
      "full_assembler_E",
      "fresh_final_descriptor_observation",
      "descriptor-and-array_projection-equality",
    ];
    let lastIndex = -1;
    for (const token of requiredInOrder) {
      const index = order.findIndex((step) => step.includes(token));
      expect(index, token).toBeGreaterThan(lastIndex);
      lastIndex = index;
    }
    expect(new Set(order).size).toBe(order.length);
    expect(chronology.temporalCycleAllowed).toBe(false);
    expect(chronology.commonRunRequestMayContainFutureEvidence).toBe(false);
  });

  it("preserves every predecessor claim lock and keeps every successor lock false", () => {
    const plan = v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3;
    expect(plan.inheritedClaimLockKeys).toEqual(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.claimLockKeys,
    );
    for (const key of NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.claimLockKeys) {
      expect(plan.claimLocks[key], key).toBe(false);
    }
    expect(new Set(plan.claimLockKeys).size).toBe(plan.claimLockKeys.length);
    expect(
      Object.values(plan.claimLocks).every((value) => value === false),
    ).toBe(true);
    expect(plan.claimLocks.physicalViabilityEstablishedBySeedRun).toBe(false);
    expect(plan.claimLocks.transportOrPropulsionEstablishedBySeedRun).toBe(
      false,
    );
  });

  it("keeps every runtime artifact null and all execution or artifact state false", () => {
    const plan = v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3;
    const newExternalKeys = Object.keys(plan.externalBindings)
      .filter(
        (key) =>
          !(
            key in
            NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.externalBindings
          ),
      )
      .sort();
    expect(newExternalKeys).toEqual(
      [
        "absoluteDeadlineReceiptBinding",
        "assemblerClosedOutputObservationBinding",
        "assemblerChannelObservationBinding",
        "assemblerExecutableBinding",
        "assemblerFullEnforcementReceiptBinding",
        "assemblerGenericStageControlEvidenceBinding",
        "assemblerInputLedgerBinding",
        "assemblerLaunchEnvelopeBinding",
        "assemblerQuotaSetupReceiptBinding",
        "assemblerRuntimeChannelBinding",
        "assemblerSeccompLoadReceiptBinding",
        "assemblerWorkerAttemptBinding",
        "atomicNestedRegistrationReceiptBinding",
        "attestationRootPostStateObservationBinding",
        "brokerRuntimeSeparationReceiptBinding",
        "candidateFullSeedGateEvidenceBinding",
        "candidateInstanceIdentityBinding",
        "candidateNWrapperBinding",
        "candidatePWrapperBinding",
        "compositeReplayBundleBinding",
        "eligibleLinuxWorkerProviderBinding",
        "finalAdmissionReceiptBinding",
        "finalArtifactBinding",
        "finalArtifactBindingReceiptBinding",
        "finalContainerObservationBinding",
        "finalDescriptorInstanceBinding",
        "finalDescriptorObservationBinding",
        "finalProjectionEqualityReceiptBinding",
        "fiveRootPreparationReceiptBinding",
        "globalRunAttemptBinding",
        "implementationSeparationReceiptBinding",
        "independentProofKernelBinding",
        "independentProofKernelToolchainBinding",
        "mpfrGmpRuntimeManifestBinding",
        "numericMaterializationPolicyFileObservationBinding",
        "numericStaging32CompositeBinding",
        "numericStaging32RootPostStateBinding",
        "postexitPostprojectionAcceptanceReceiptBinding",
        "postexitSecureRawEvidence6RereadBinding",
        "postexitSecureStaging32RereadBinding",
        "postexitValidatedFinalFullSeedResultBinding",
        "postprojectionPolicyFileObservationBinding",
        "preVerifierSecureRawEvidence6ObservationBinding",
        "preVerifierSecureStaging32ObservationBinding",
        "producerExact38ClosedOutputObservationBinding",
        "producerExecutableBinding",
        "producerFullEnforcementReceiptBinding",
        "producerGenericStageControlEvidenceBinding",
        "producerInputLedgerBinding",
        "producerLaunchEnvelopeBinding",
        "producerNumericImplementationBinding",
        "producerProjectionImplementationBinding",
        "producerQuotaSetupReceiptBinding",
        "producerSeccompLoadReceiptBinding",
        "producerStageRuntimeConformanceBinding",
        "producerWorkerAttemptBinding",
        "rawEvidence6CompositeBinding",
        "replayRootPostStateBinding",
        "rootPrestateReceiptBinding",
        "runtimeInstanceInterpretationRejectionBinding",
        "typedInterpreterBinding",
        "typedInterpreterValidationReceiptBinding",
        "verifierChannelObservationBinding",
        "verifierClosedOutputObservationBinding",
        "verifierExecutableBinding",
        "verifierFullEnforcementReceiptBinding",
        "verifierGenericStageControlEvidenceBinding",
        "verifierInputLedgerBinding",
        "verifierLaunchEnvelopeBinding",
        "verifierPrelaunchContextRejectionBinding",
        "verifierProjectionImplementationBinding",
        "verifierQuotaSetupReceiptBinding",
        "verifierRuntimeChannelBinding",
        "verifierSeccompLoadReceiptBinding",
        "verifierStageRuntimeConformanceBinding",
        "verifierWorkerAttemptBinding",
      ].sort(),
    );

    const newExecutionKeys = Object.keys(plan.executionState)
      .filter(
        (key) =>
          !(
            key in
            NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.executionState
          ),
      )
      .sort();
    expect(newExecutionKeys).toEqual(
      [
        "assemblerClosedOutputObservationBinding",
        "assemblerExecutableBinding",
        "assemblerFullEnforcementReceiptBinding",
        "assemblerGenericStageControlEvidenceBinding",
        "assemblerLaunched",
        "assemblerQuotaCapabilityBinding",
        "assemblerRuntimeChannelBinding",
        "assemblerSeccompLoadReceiptBinding",
        "assemblerSeccompPolicyBinding",
        "assemblerSourceManifestBinding",
        "assemblerToolchainManifestBinding",
        "assemblerWorkerAttemptBinding",
        "atomicNestedRegistrationReceiptBinding",
        "atomicRegistrationCompleted",
        "attestationRootPostStateObservationBinding",
        "brokerRuntimeSeparationReceiptBinding",
        "candidateFullSeedGateEvidenceBinding",
        "candidateInstanceIdentityBinding",
        "candidateNWrapperBinding",
        "candidatePWrapperBinding",
        "compositeReplayBundleBinding",
        "eligibleLinuxWorkerProviderBinding",
        "finalAdmissionGranted",
        "finalArtifactBindingReceiptBinding",
        "finalContainerObservationBinding",
        "finalDescriptorInstanceBinding",
        "finalDescriptorObservationBinding",
        "finalProjectionEqualityReceiptBinding",
        "fiveRootPreparationReceiptBinding",
        "globalRunAttemptBinding",
        "implementationSeparationReceiptBinding",
        "independentProofKernelBinding",
        "independentProofKernelToolchainBinding",
        "mpfrGmpRuntimeManifestBinding",
        "numericStaging32CompositeBinding",
        "numericStaging32RootPostStateBinding",
        "physicalAuthorityGranted",
        "postexitPostprojectionAcceptanceReceiptBinding",
        "postexitSecureRawEvidence6RereadBinding",
        "postexitSecureStaging32RereadBinding",
        "postexitValidatedFinalFullSeedResultBinding",
        "preVerifierSecureRawEvidence6ObservationBinding",
        "preVerifierSecureStaging32ObservationBinding",
        "producerExact38ClosedOutputObservationBinding",
        "producerExecutableBinding",
        "producerFullEnforcementReceiptBinding",
        "producerGenericStageControlEvidenceBinding",
        "producerInputLedgerBinding",
        "producerLaunchEnvelopeBinding",
        "producerLaunched",
        "producerNumericImplementationBinding",
        "producerProjectionImplementationBinding",
        "producerQuotaCapabilityBinding",
        "producerQuotaSetupReceiptBinding",
        "producerSeccompLoadReceiptBinding",
        "producerSeccompPolicyBinding",
        "producerSourceManifestBinding",
        "producerStageRuntimeConformanceBinding",
        "producerToolchainManifestBinding",
        "producerWorkerAttemptBinding",
        "propulsionAuthorityGranted",
        "rawEvidence6CompositeBinding",
        "replayRootPostStateBinding",
        "rootPrestateReceiptBinding",
        "runtimeInstanceInterpretationRejectionBinding",
        "schedulerLeaseBinding",
        "scientificAdmissionGranted",
        "transportAuthorityGranted",
        "typedInterpretationCompleted",
        "typedInterpreterBinding",
        "typedInterpreterValidationReceiptBinding",
        "verifierClosedOutputObservationBinding",
        "verifierExecutableBinding",
        "verifierFullEnforcementReceiptBinding",
        "verifierGenericStageControlEvidenceBinding",
        "verifierLaunched",
        "verifierPrelaunchContextRejectionBinding",
        "verifierProjectionImplementationBinding",
        "verifierQuotaCapabilityBinding",
        "verifierRuntimeChannelBinding",
        "verifierSeccompLoadReceiptBinding",
        "verifierSeccompPolicyBinding",
        "verifierSourceManifestBinding",
        "verifierStageRuntimeConformanceBinding",
        "verifierToolchainManifestBinding",
        "verifierWorkerAttemptBinding",
      ].sort(),
    );
    expect(
      Object.values(plan.externalBindings).every((value) => value === null),
    ).toBe(true);
    expect(
      Object.values(plan.executionState).every(
        (value) => value === null || value === false,
      ),
    ).toBe(true);
    expect(plan.executionState.executionAuthorized).toBe(false);
    expect(plan.executionState.executed).toBe(false);
    expect(plan.executionState.artifactAccepted).toBe(false);
    expect(
      Object.values(plan.schemaImplementationState).every(
        (value) => value === true,
      ),
    ).toBe(true);
    expect(plan.blockers.length).toBeGreaterThan(0);
    expect(canonicalJson(plan.blockers)).not.toContain(
      "schemas_not_yet_present",
    );
    expect(canonicalJson(plan.blockers)).toContain(
      "no_execution_output_artifact",
    );
  });

  it("seals the descriptive registry and v3 plan without granting runtime authority", () => {
    const registry =
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY;
    expect(registry.runtimeTypedInterpreterBinding).toBeNull();
    expect(registry.executableValidationAuthorityPresent).toBe(false);
    expect(registry.executionAuthorityPresent).toBe(false);
    expect(registry.artifactOrScientificAuthorityPresent).toBe(false);
    expect(registry.status).toBe(
      "sealed_preregistration_read_only_red_team_clear",
    );
    expect(v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.status).toBe(
      "sealed_preregistration_read_only_red_team_clear",
    );
    expect(v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.maturity).toBe(
      "diagnostic_execution_contract_sealed_preregistration_no_capability_no_execution_no_artifact",
    );
    expect(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_LITERAL_SEAL_STATUS,
    ).toBe("sealed_preregistration_read_only_red_team_clear");
    expect(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.blockers,
    ).not.toContain(
      "additive_v3_evidence_schemas_and_registry_are_present_but_unsealed_pending_complete_structural_semantic_and_adversarial_review",
    );
    expect(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.blockers,
    ).toEqual([
      "no_runtime_instance_including_five-root-preparation_stage-ledgers_channels_envelopes_enforcement_receipts_composite_interpreter_registration_or_final-output-evidence_is_bound",
      "eligible_external_Linux_x86_64_worker_provider_absent",
      "attested_MPFR_GMP_runtime_independent_proof-kernel_and_all_three_source_toolchain_executable_closures_absent",
      "producer_numeric_producer_projection_and_independent_verifier_projection_implementations_and_same-attempt_separation_evidence_absent",
      "full_seed_v1_continuous_proof_and_gate_receipts_absent",
      "typed_interpreter_provider_and_atomic_content-addressed_registration_implementation_absent",
      "trusted_descriptor_assembler_source-toolchain-runtime_closure_and_terminal_projection-admission_evidence_absent",
      "no_execution_output_artifact_scientific_physical_propulsion_or_transport_authority",
    ]);
    expect(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_SHA256_DOMAIN,
    ).toBe("nhm2-prolate-boson-star-newtonian-seed-run-plan/v3\n");
    expect(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_SHA256,
    ).toBe("ac223c9b79b621b39d25fe9807492e030da916d8f2c6453a30b612de4ae6562c");
    expect(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(54136);
    expect(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256_DOMAIN,
    ).toBe(
      "nhm2-prolate-boson-star-newtonian-seed-v3-evidence-schema-registry/v1\n",
    );
    expect(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256,
    ).toBe("14f800a2675d6ecc23ebdfc5ba62d4efcde1b70961be8b6fed146fda5bd2d89f");
    expect(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(837250);
    expect(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING.sha256,
    ).toBe(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_SHA256,
    );
    expect(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING
        .canonicalSizeBytes,
    ).toBe(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      v3
        .NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING
        .sha256,
    ).toBe(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256,
    );
    expect(
      v3
        .NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING
        .canonicalSizeBytes,
    ).toBe(
      v3.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES,
    );
  });

  it("defines v3 seal pins as independent direct literals rather than computed aliases", () => {
    const source = readFileSync(
      new URL(
        "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v3.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(source).toMatch(
      /RUN_PLAN_V3_EXPECTED_SHA256\s*=\s*\r?\n\s*"ac223c9b79b621b39d25fe9807492e030da916d8f2c6453a30b612de4ae6562c"/,
    );
    expect(source).toMatch(
      /RUN_PLAN_V3_EXPECTED_CANONICAL_SIZE_BYTES\s*=\s*\r?\n\s*54136/,
    );
    expect(source).toMatch(
      /EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256\s*=\s*\r?\n\s*"14f800a2675d6ecc23ebdfc5ba62d4efcde1b70961be8b6fed146fda5bd2d89f"/,
    );
    expect(source).toMatch(
      /EVIDENCE_SCHEMA_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES\s*=\s*\r?\n\s*837250/,
    );
    expect(source).toContain(
      'NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_SHA256_DOMAIN =\n  "nhm2-prolate-boson-star-newtonian-seed-run-plan/v3\\n" as const;',
    );
    expect(source).toContain(
      'NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256_DOMAIN =\n  "nhm2-prolate-boson-star-newtonian-seed-v3-evidence-schema-registry/v1\\n" as const;',
    );
    expect(source).not.toMatch(
      /EXPECTED_SHA256\s*=\s*\r?\n\s*NHM2_[A-Z0-9_]*_SHA256\b/,
    );
    expect(source).not.toMatch(
      /EXPECTED_CANONICAL_SIZE_BYTES\s*=\s*\r?\n\s*NHM2_[A-Z0-9_]*_CANONICAL_SIZE_BYTES\b/,
    );
    expect(source).not.toMatch(
      /EXPECTED_SHA256_DOMAIN\s*=\s*\r?\n\s*NHM2_[A-Z0-9_]*_SHA256_DOMAIN\b/,
    );
  });
});
