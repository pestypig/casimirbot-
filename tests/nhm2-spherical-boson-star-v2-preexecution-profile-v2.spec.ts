import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import * as profileV2Module from "../shared/contracts/nhm2-spherical-boson-star-v2-preexecution-profile.v2";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_COMMAND_ARGV_V2_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_INVENTORY_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_INVENTORY_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_PLAN_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CLAIM_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_LAMPS,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_FRESHNESS_INVENTORY_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_CLOSURE_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_AGGREGATE_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2,
  computeNhm2SphericalBosonStarV2CommandArgvSha256V2,
  computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256,
  computeNhm2SphericalBosonStarV2OutputRootAbsenceInventorySha256,
  computeNhm2SphericalBosonStarV2OutputRootPlanSha256,
  computeNhm2SphericalBosonStarV2PrePresealFreshnessInventorySha256,
  computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256,
  computeNhm2SphericalBosonStarV2PrePresealStaticInputAggregateSha256,
  deriveNhm2SphericalBosonStarV2DiagnosticPrePresealStaticClosure,
  deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2,
  isNhm2SphericalBosonStarV2PreexecutionProfileV2,
  nhm2SphericalBosonStarV2PreexecutionProfileV2CanonicalJson,
  nhm2SphericalBosonStarV2PreexecutionProfileV2Violations,
  type Nhm2SphericalV2DiagnosticPreexecutionPresealEvidenceV2,
  type Nhm2SphericalV2DiagnosticPrePresealStaticClosureEvidenceV2,
  type Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2,
  type Nhm2SphericalV2OutputRootAbsenceInventoryV2,
  type Nhm2SphericalV2OutputRootPlanV2,
  type Nhm2SphericalV2PrePresealStaticInputEntryV2,
  type Nhm2SphericalV2PrePresealStaticInputRoleV2,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-preexecution-profile.v2";
import type {
  Nhm2SphericalV2FreshnessObservationV1,
  Nhm2SphericalV2LinuxFileStatV1,
  Nhm2SphericalV2RunIdentityV1,
  Nhm2SphericalV2StaticInputKindV1,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-preexecution-profile.v1";

const hash = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const canonicalJson = (value: unknown): string => {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (typeof value !== "object") {
    throw new TypeError("test_fixture_not_canonical_json");
  }
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

type Mutable<T> = T extends readonly (infer U)[]
  ? Mutable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: Mutable<T[K]> }
    : T;

const mutableClone = <T>(value: T): Mutable<T> =>
  structuredClone(value) as Mutable<T>;

const u64le = (value: number): Buffer => {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes;
};

const RUN_IDENTITY: Nhm2SphericalV2RunIdentityV1 = {
  ownerUid: "1001",
  ownerGid: "1002",
  supplementaryGids: [],
};

const KIND_BY_ROLE = {
  v2_candidate_freeze: "canonical_json",
  initializer_bridge: "canonical_json",
  scientific_candidate_manifest: "canonical_json",
  source_manifest: "canonical_json",
  source_file: "source_text",
  source_payload: "f64le",
  build_recipe: "source_text",
  dependency_lock: "dependency_lock",
  toolchain_manifest: "canonical_json",
  executable: "executable",
  elf_interpreter: "elf_interpreter",
  shared_object: "shared_object",
} as const satisfies Readonly<
  Record<
    Nhm2SphericalV2PrePresealStaticInputRoleV2,
    Nhm2SphericalV2StaticInputKindV1
  >
>;

const MEDIA_BY_KIND = {
  canonical_json: "application/json",
  source_text: "text/plain",
  f64le: "application/octet-stream",
  dependency_lock: "application/octet-stream",
  executable: "application/octet-stream",
  elf_interpreter: "application/octet-stream",
  shared_object: "application/octet-stream",
  opaque_binary: "application/octet-stream",
} as const;

const makeStat = (
  role: Nhm2SphericalV2PrePresealStaticInputRoleV2,
  index: number,
  sha256: string,
  sizeBytes: number,
): Nhm2SphericalV2LinuxFileStatV1 => ({
  changeTimeNanoseconds: String(1_000 + index),
  device: "8",
  fileType: "regular",
  inode: String(10_000 + index),
  linkCount: "1",
  modeOctal:
    role === "executable" || role === "elf_interpreter" ? "0500" : "0400",
  modifyTimeNanoseconds: String(900 + index),
  ownerGid: RUN_IDENTITY.ownerGid,
  ownerUid: RUN_IDENTITY.ownerUid,
  sha256,
  sizeBytes,
});

const makeStaticInputs = (): Nhm2SphericalV2PrePresealStaticInputEntryV2[] =>
  NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2.map(
    (role, index) => {
      const semanticKind = KIND_BY_ROLE[role];
      const sha256 = hash(`static:${role}`);
      const sizeBytes = index + 1;
      return {
        mediaType: MEDIA_BY_KIND[semanticKind],
        relativePath: `inputs/${String(index).padStart(2, "0")}-${role}`,
        semanticKind,
        semanticRole: role,
        sha256,
        sizeBytes,
        stat: makeStat(role, index, sha256, sizeBytes),
      };
    },
  );

const makeFreshness = (
  entries: readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[],
): Nhm2SphericalV2FreshnessObservationV1[] =>
  entries.map((entry) => ({
    postread: structuredClone(entry.stat),
    preopen: structuredClone(entry.stat),
    relativePath: entry.relativePath,
    stable: true,
  }));

const makeTimedFreshness = (
  entries: readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[],
): Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2[] =>
  entries.map((entry, index) => ({
    observedAtMonotonicRawNanoseconds: String(550 + index),
    observedAtWallUtc: `2026-08-14T12:00:00.${String(
      550_000_000 + index,
    ).padStart(9, "0")}Z`,
    postread: structuredClone(entry.stat),
    preopen: structuredClone(entry.stat),
    relativePath: entry.relativePath,
    stable: true,
  }));

const OUTPUT_ROOT_PLAN: Nhm2SphericalV2OutputRootPlanV2 = [
  {
    role: "primary",
    absolutePath: "/srv/nhm2/runs/attempt-1/primary",
  },
  {
    role: "independent",
    absolutePath: "/srv/nhm2/runs/attempt-1/independent",
  },
];

const OUTPUT_ROOT_ABSENCE_INVENTORY: Nhm2SphericalV2OutputRootAbsenceInventoryV2 =
  [
    {
      role: "primary",
      absolutePath: OUTPUT_ROOT_PLAN[0].absolutePath,
      observedAbsent: true,
      observedAtMonotonicRawNanoseconds: "600",
      observedAtWallUtc: "2026-08-14T12:00:00.600000000Z",
    },
    {
      role: "independent",
      absolutePath: OUTPUT_ROOT_PLAN[1].absolutePath,
      observedAbsent: true,
      observedAtMonotonicRawNanoseconds: "610",
      observedAtWallUtc: "2026-08-14T12:00:00.610000000Z",
    },
  ];

const makePrePresealEvidence =
  (): Nhm2SphericalV2DiagnosticPrePresealStaticClosureEvidenceV2 => {
    const staticInputs = makeStaticInputs();
    return {
      argv: ["/opt/nhm2/primary", "--candidate", "spherical-v2"],
      dirtyTreeDigestSha256: hash("dirty-tree"),
      expectedRuntimeClosureSha256: hash("expected-runtime"),
      freshnessObservations: makeFreshness(staticInputs),
      outputRootPlan: structuredClone(OUTPUT_ROOT_PLAN),
      runIdentity: structuredClone(RUN_IDENTITY),
      staticInputs,
    };
  };

const makeExecutionEvidence =
  (): Nhm2SphericalV2DiagnosticPreexecutionPresealEvidenceV2 => {
    const preEvidence = makePrePresealEvidence();
    const prePresealStaticClosure =
      deriveNhm2SphericalBosonStarV2DiagnosticPrePresealStaticClosure(
        canonicalJson(preEvidence),
      );
    const prePresealStaticClosureSha256 =
      computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256(
        canonicalJson(prePresealStaticClosure),
      );
    const executionFreshnessObservations = makeTimedFreshness(
      preEvidence.staticInputs,
    );
    const executionFreshnessInventorySha256 =
      computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256(
        canonicalJson(executionFreshnessObservations),
        canonicalJson(preEvidence.staticInputs),
        canonicalJson(preEvidence.runIdentity),
      );
    const skeletonRawSha256 = hash("skeleton-raw");
    const skeletonWireSha256 = hash("skeleton-wire");
    const skeletonPersistenceReceiptSha256 = hash(
      "skeleton-persistence-receipt",
    );
    const skeletonSizeBytes = 8_192;
    const scientificRawSha256 = hash("scientific-preseal-raw");
    const scientificSizeBytes = 16_384;
    const outputRootAbsenceInventory = structuredClone(
      OUTPUT_ROOT_ABSENCE_INVENTORY,
    );
    const absenceInventorySha256 =
      computeNhm2SphericalBosonStarV2OutputRootAbsenceInventorySha256(
        canonicalJson(outputRootAbsenceInventory),
        canonicalJson(prePresealStaticClosure.outputRootPlan),
      );
    return {
      attemptOrdinal: 1,
      createdMonotonicRawNanoseconds: "800",
      createdWallUtc: "2026-08-14T12:00:00.800000000Z",
      executionFreshnessObservations,
      executionFreshnessReceiptBinding: {
        artifactId:
          "nhm2.spherical_boson_star_v2_diagnostic_execution_freshness_receipt",
        contractVersion:
          "nhm2_spherical_boson_star_v2_diagnostic_execution_freshness_receipt/v1",
        executionFreshnessInventorySha256,
        mediaType: "application/json",
        observedAt: "2026-08-14T12:00:00.580000000Z",
        path: "/srv/nhm2/receipts/execution-freshness.json",
        rawSha256: hash("execution-freshness-receipt-raw"),
        receiptSha256: hash("execution-freshness-receipt-envelope"),
        sizeBytes: 3_072,
      },
      outputRootAbsenceInventory,
      outputRootAbsenceReceiptBinding: {
        artifactId: "nhm2.spherical_boson_star_v2_output_root_absence_receipt",
        contractVersion:
          "nhm2_spherical_boson_star_v2_output_root_absence_receipt/v1",
        mediaType: "application/json",
        observedAt: "2026-08-14T12:00:00.700000000Z",
        outputRootAbsenceInventorySha256: absenceInventorySha256,
        path: "/srv/nhm2/receipts/output-root-absence.json",
        rawSha256: hash("absence-receipt-raw"),
        receiptSha256: hash("absence-receipt-envelope"),
        sizeBytes: 2_048,
      },
      prePresealStaticClosure,
      preexecutionSkeletonBinding: {
        artifactId: "nhm2.spherical_boson_star_v2_preexecution_output_skeleton",
        contractVersion:
          "nhm2_spherical_boson_star_v2_preexecution_output_skeleton/v2",
        mediaType: "application/json",
        path: "/srv/nhm2/skeleton/preexecution-output-skeleton.json",
        persistedAt: "2026-08-14T12:00:00.200000000Z",
        persistenceReceiptSha256: skeletonPersistenceReceiptSha256,
        prePresealStaticClosureSha256,
        rawSha256: skeletonRawSha256,
        sizeBytes: skeletonSizeBytes,
        skeletonFrozenAt: "2026-08-14T12:00:00.100000000Z",
        wireSha256: skeletonWireSha256,
      },
      runIdentity: structuredClone(RUN_IDENTITY),
      scientificPersistenceReceiptBinding: {
        artifactId:
          "nhm2.spherical_boson_star_v2_scientific_preseal_persistence_receipt",
        contractVersion:
          "nhm2_spherical_boson_star_v2_scientific_preseal_persistence_receipt/v1",
        mediaType: "application/json",
        path: "/srv/nhm2/receipts/scientific-preseal-persistence.json",
        persistedArtifactRawSha256: scientificRawSha256,
        persistedArtifactSizeBytes: scientificSizeBytes,
        persistenceObservedAt: "2026-08-14T12:00:00.500000000Z",
        rawSha256: hash("scientific-receipt-raw"),
        receiptSha256: hash("scientific-receipt-envelope"),
        sizeBytes: 4_096,
      },
      scientificPresealBinding: {
        artifactId: "nhm2.spherical_boson_star_v2_scientific_preseal_envelope",
        boundSkeletonPersistenceReceiptSha256: skeletonPersistenceReceiptSha256,
        boundSkeletonRawSha256: skeletonRawSha256,
        boundSkeletonSizeBytes: skeletonSizeBytes,
        boundSkeletonWireSha256: skeletonWireSha256,
        contractVersion:
          "nhm2_spherical_boson_star_v2_scientific_preseal_envelope/v1",
        createdAt: "2026-08-14T12:00:00.300000000Z",
        mediaType: "application/json",
        path: "/srv/nhm2/preseal/scientific-preseal.json",
        persistedAt: "2026-08-14T12:00:00.400000000Z",
        presealEnvelopeSha256: hash("scientific-preseal-envelope"),
        rawSha256: scientificRawSha256,
        sizeBytes: scientificSizeBytes,
      },
      staticInputs: structuredClone(preEvidence.staticInputs),
    };
  };

const manualAggregate = (
  domain: string,
  entries: readonly unknown[],
): string => {
  const digest = createHash("sha256")
    .update(domain, "utf8")
    .update(u64le(entries.length));
  for (const entry of entries) {
    const bytes = Buffer.from(canonicalJson(entry), "utf8");
    digest.update(u64le(bytes.length)).update(bytes);
  }
  return digest.digest("hex");
};

describe("NHM2 spherical boson-star v2 additive preexecution profile v2", () => {
  it("pins the literal self-seal and leaves the predecessor untouched", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_SHA256).toBe(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    );
    expect(
      Object.isFrozen(NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2),
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.predecessorBinding
        .contractVersion,
    ).toBe("nhm2_spherical_boson_star_v2_preexecution_profile/v1");
  });

  it("freezes the exact pre-preseal role subtraction and phase closure keys", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2,
    ).toEqual([
      "v2_candidate_freeze",
      "initializer_bridge",
      "scientific_candidate_manifest",
      "source_manifest",
      "source_file",
      "source_payload",
      "build_recipe",
      "dependency_lock",
      "toolchain_manifest",
      "executable",
      "elf_interpreter",
      "shared_object",
    ]);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2,
    ).not.toContain("scientific_preseal");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2,
    ).not.toContain("scientific_persistence_receipt");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2
        .prePresealStaticClosureSchema.exactKeys,
    ).toEqual([
      "schemaVersion",
      "closurePhase",
      "preexecutionProfileBinding",
      "commandArgvSha256",
      "prePresealStaticInputAggregateSha256",
      "prePresealFreshnessInventorySha256",
      "dirtyTreeDigestSha256",
      "expectedRuntimeClosureSha256",
      "outputRootPlan",
      "outputRootPlanSha256",
    ]);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.scientificPresealBindingSchema,
    ).toMatchObject({
      exactKeys: [
        "artifactId",
        "boundSkeletonPersistenceReceiptSha256",
        "boundSkeletonRawSha256",
        "boundSkeletonSizeBytes",
        "boundSkeletonWireSha256",
        "contractVersion",
        "createdAt",
        "mediaType",
        "path",
        "persistedAt",
        "presealEnvelopeSha256",
        "rawSha256",
        "sizeBytes",
      ],
      boundSkeletonRawSha256Required: true,
      boundSkeletonWireSha256Required: true,
      boundSkeletonSizeBytesRequired: true,
      boundSkeletonPersistenceReceiptSha256Required: true,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.preexecutionSkeletonBindingSchema,
    ).toMatchObject({
      contractVersion:
        "nhm2_spherical_boson_star_v2_preexecution_output_skeleton/v2",
      prePresealStaticClosureSha256Required: true,
      preexecutionSkeletonV2CanonicalWireValidatorImplemented: false,
      byteLevelAtoSClosureProven: false,
      v1SkeletonIdentityAccepted: false,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.executionFreshnessInventorySchema,
    ).toMatchObject({
      everyObservationOccursAfterScientificPresealPersistence: true,
      exactStatAndContentEqualityWithStaticInputsRequired: true,
      untimedPrePresealObservationReuseAccepted: false,
      callerClaimedDiagnosticEvidenceOnly: true,
      authenticatedObservationAuthority: false,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.chronology
        .exactAcyclicOrder,
    ).toEqual([
      "freeze_pre_preseal_static_input_bytes_and_output_root_plan",
      "derive_pre_preseal_static_closure_A",
      "future_validate_persist_and_read_back_preexecution_skeleton_v2_declaring_A_digest",
      "create_scientific_preseal_binding_exact_skeleton_raw_wire_size_and_persistence_receipt_sha256",
      "persist_and_read_back_scientific_preseal",
      "rehash_base_static_inputs_with_timed_claimed_freshness_receipt_and_observe_output_root_absence",
      "derive_diagnostic_execution_preseal_binding_skeleton_preseal_and_receipts",
      "future_durable_execution_preseal_publication",
      "future_launch_envelope_creation",
      "future_stopped_exec_runtime_loader_admission",
      "future_execution_release",
    ]);
  });

  it("derives a deterministic hashless skeleton closure with no later artifact", () => {
    const evidence = makePrePresealEvidence();
    const closure =
      deriveNhm2SphericalBosonStarV2DiagnosticPrePresealStaticClosure(
        canonicalJson(evidence),
      );
    expect(Object.keys(closure)).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2
        .prePresealStaticClosureSchema.exactKeys,
    );
    expect(closure.closurePhase).toBe("pre_scientific_preseal");
    expect(closure.prePresealStaticInputAggregateSha256).toBe(
      computeNhm2SphericalBosonStarV2PrePresealStaticInputAggregateSha256(
        canonicalJson(evidence.staticInputs),
        canonicalJson(evidence.runIdentity),
      ),
    );
    expect(closure.prePresealFreshnessInventorySha256).toBe(
      computeNhm2SphericalBosonStarV2PrePresealFreshnessInventorySha256(
        canonicalJson(evidence.freshnessObservations),
        canonicalJson(evidence.staticInputs),
        canonicalJson(evidence.runIdentity),
      ),
    );
    expect(closure.outputRootPlanSha256).toBe(
      computeNhm2SphericalBosonStarV2OutputRootPlanSha256(
        canonicalJson(evidence.outputRootPlan),
      ),
    );
    expect(JSON.stringify(closure)).not.toContain("scientificPreseal");
    expect(JSON.stringify(closure)).not.toContain("persistenceReceipt");
    expect(JSON.stringify(closure)).not.toContain("observedAbsent");
    expect(Object.isFrozen(closure)).toBe(true);
    expect(Object.isFrozen(closure.outputRootPlan)).toBe(true);
  });

  it("implements the exact length-delimited digest recipes", () => {
    const evidence = makePrePresealEvidence();
    const timedFreshness = makeTimedFreshness(evidence.staticInputs);
    const closure =
      deriveNhm2SphericalBosonStarV2DiagnosticPrePresealStaticClosure(
        canonicalJson(evidence),
      );
    const closureBytes = Buffer.from(canonicalJson(closure), "utf8");
    expect(
      computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256(
        canonicalJson(closure),
      ),
    ).toBe(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_CLOSURE_SHA256_DOMAIN,
          "utf8",
        )
        .update(u64le(closureBytes.length))
        .update(closureBytes)
        .digest("hex"),
    );
    const expectedArgvSha256 = createHash("sha256")
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_COMMAND_ARGV_V2_SHA256_DOMAIN,
        "utf8",
      )
      .update(u64le(evidence.argv.length));
    for (const argument of evidence.argv) {
      const bytes = Buffer.from(argument, "utf8");
      expectedArgvSha256.update(u64le(bytes.length)).update(bytes);
    }
    expect(
      computeNhm2SphericalBosonStarV2CommandArgvSha256V2(
        canonicalJson(evidence.argv),
      ),
    ).toBe(expectedArgvSha256.digest("hex"));
    expect(
      computeNhm2SphericalBosonStarV2PrePresealStaticInputAggregateSha256(
        canonicalJson(evidence.staticInputs),
        canonicalJson(evidence.runIdentity),
      ),
    ).toBe(
      manualAggregate(
        NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_AGGREGATE_SHA256_DOMAIN,
        evidence.staticInputs,
      ),
    );
    expect(
      computeNhm2SphericalBosonStarV2PrePresealFreshnessInventorySha256(
        canonicalJson(evidence.freshnessObservations),
        canonicalJson(evidence.staticInputs),
        canonicalJson(evidence.runIdentity),
      ),
    ).toBe(
      manualAggregate(
        NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_FRESHNESS_INVENTORY_SHA256_DOMAIN,
        evidence.freshnessObservations,
      ),
    );
    expect(
      computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256(
        canonicalJson(timedFreshness),
        canonicalJson(evidence.staticInputs),
        canonicalJson(evidence.runIdentity),
      ),
    ).toBe(
      manualAggregate(
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_INVENTORY_SHA256_DOMAIN,
        timedFreshness,
      ),
    );
    expect(
      computeNhm2SphericalBosonStarV2OutputRootPlanSha256(
        canonicalJson(OUTPUT_ROOT_PLAN),
      ),
    ).toBe(
      manualAggregate(
        NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_PLAN_SHA256_DOMAIN,
        OUTPUT_ROOT_PLAN,
      ),
    );
    expect(
      computeNhm2SphericalBosonStarV2OutputRootAbsenceInventorySha256(
        canonicalJson(OUTPUT_ROOT_ABSENCE_INVENTORY),
        canonicalJson(OUTPUT_ROOT_PLAN),
      ),
    ).toBe(
      manualAggregate(
        NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_INVENTORY_SHA256_DOMAIN,
        OUTPUT_ROOT_ABSENCE_INVENTORY,
      ),
    );
  });

  it("rejects excluded roles, role drift, aliasing, and unstable freshness", () => {
    const evidence = makePrePresealEvidence();
    const excluded = mutableClone(evidence.staticInputs);
    (excluded[2] as unknown as { semanticRole: string }).semanticRole =
      "scientific_preseal";
    expect(() =>
      computeNhm2SphericalBosonStarV2PrePresealStaticInputAggregateSha256(
        canonicalJson(
          excluded as unknown as Nhm2SphericalV2PrePresealStaticInputEntryV2[],
        ),
        canonicalJson(evidence.runIdentity),
      ),
    ).toThrow(/pre_preseal_static_inventory_invalid/);

    const reversed = [...evidence.staticInputs].reverse();
    expect(() =>
      computeNhm2SphericalBosonStarV2PrePresealStaticInputAggregateSha256(
        canonicalJson(reversed),
        canonicalJson(evidence.runIdentity),
      ),
    ).toThrow(/pre_preseal_static_inventory_invalid/);

    const duplicate = mutableClone(evidence.staticInputs);
    duplicate[1]!.relativePath = duplicate[0]!.relativePath.toUpperCase();
    expect(() =>
      computeNhm2SphericalBosonStarV2PrePresealStaticInputAggregateSha256(
        canonicalJson(duplicate),
        canonicalJson(evidence.runIdentity),
      ),
    ).toThrow(/pre_preseal_static_inventory_invalid/);

    const unstable = mutableClone(evidence.freshnessObservations);
    unstable[0]!.postread.inode = "999999";
    expect(() =>
      computeNhm2SphericalBosonStarV2PrePresealFreshnessInventorySha256(
        canonicalJson(unstable),
        canonicalJson(evidence.staticInputs),
        canonicalJson(evidence.runIdentity),
      ),
    ).toThrow(/pre_preseal_freshness_invalid/);
  });

  it("keeps output-root planning separate from later absence observation", () => {
    expect(Object.keys(OUTPUT_ROOT_PLAN[0])).toEqual(["role", "absolutePath"]);
    const planHash = computeNhm2SphericalBosonStarV2OutputRootPlanSha256(
      canonicalJson(OUTPUT_ROOT_PLAN),
    );
    const absenceHash =
      computeNhm2SphericalBosonStarV2OutputRootAbsenceInventorySha256(
        canonicalJson(OUTPUT_ROOT_ABSENCE_INVENTORY),
        canonicalJson(OUTPUT_ROOT_PLAN),
      );
    expect(planHash).not.toBe(absenceHash);

    const nested = mutableClone(OUTPUT_ROOT_PLAN);
    nested[1]!.absolutePath = `${nested[0]!.absolutePath}/child`;
    expect(() =>
      computeNhm2SphericalBosonStarV2OutputRootPlanSha256(
        canonicalJson(nested as unknown as Nhm2SphericalV2OutputRootPlanV2),
      ),
    ).toThrow(/output_root_plan_invalid/);

    const wrongPath = mutableClone(OUTPUT_ROOT_ABSENCE_INVENTORY);
    wrongPath[0].absolutePath = "/srv/nhm2/runs/attempt-1/other";
    expect(() =>
      computeNhm2SphericalBosonStarV2OutputRootAbsenceInventorySha256(
        canonicalJson(wrongPath),
        canonicalJson(OUTPUT_ROOT_PLAN),
      ),
    ).toThrow(/output_root_absence_inventory_invalid/);
  });

  it("derives the later diagnostic preseal with separate causal bindings", () => {
    const evidence = makeExecutionEvidence();
    const preseal =
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(evidence),
      );
    expect(Object.keys(preseal)).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2
        .executionPresealSchema.exactKeys,
    );
    expect(preseal.authorityFalse).toBe(true);
    expect(preseal.preexecutionSkeletonBinding).toEqual(
      evidence.preexecutionSkeletonBinding,
    );
    expect(preseal.scientificPresealBinding).toEqual(
      evidence.scientificPresealBinding,
    );
    expect(preseal.scientificPersistenceReceiptBinding).toEqual(
      evidence.scientificPersistenceReceiptBinding,
    );
    expect(preseal.prePresealStaticClosureSha256).toBe(
      computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256(
        canonicalJson(evidence.prePresealStaticClosure),
      ),
    );
    expect(preseal.prePresealStaticClosureSha256).toBe(
      evidence.preexecutionSkeletonBinding.prePresealStaticClosureSha256,
    );
    expect(preseal.prePresealStaticInputAggregateSha256).toBe(
      evidence.prePresealStaticClosure.prePresealStaticInputAggregateSha256,
    );
    expect(preseal.executionFreshnessInventorySha256).toBe(
      computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256(
        canonicalJson(evidence.executionFreshnessObservations),
        canonicalJson(evidence.staticInputs),
        canonicalJson(evidence.runIdentity),
      ),
    );
    expect(preseal.executionFreshnessReceiptBinding).toEqual(
      evidence.executionFreshnessReceiptBinding,
    );
    expect(preseal.diagnosticPresealSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.isFrozen(preseal)).toBe(true);
    expect(Object.isFrozen(preseal.scientificPresealBinding)).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2
        .executionPresealSchema
        .scientificPresealOrPersistenceReceiptIncludedInBaseAggregate,
    ).toBe(false);
  });

  it("rejects skeleton, scientific receipt, absence receipt, chronology, and base drift", () => {
    const skeletonDrift = mutableClone(makeExecutionEvidence());
    skeletonDrift.scientificPresealBinding.boundSkeletonRawSha256 =
      hash("different-skeleton");
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(skeletonDrift),
      ),
    ).toThrow(/cross_binding_invalid/);

    const skeletonWireDrift = mutableClone(makeExecutionEvidence());
    skeletonWireDrift.scientificPresealBinding.boundSkeletonWireSha256 = hash(
      "different-skeleton-wire",
    );
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(skeletonWireDrift),
      ),
    ).toThrow(/cross_binding_invalid/);

    const skeletonPersistenceReceiptDrift = mutableClone(
      makeExecutionEvidence(),
    );
    skeletonPersistenceReceiptDrift.scientificPresealBinding.boundSkeletonPersistenceReceiptSha256 =
      hash("different-skeleton-persistence-receipt");
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(skeletonPersistenceReceiptDrift),
      ),
    ).toThrow(/cross_binding_invalid/);

    const receiptDrift = mutableClone(makeExecutionEvidence());
    receiptDrift.scientificPersistenceReceiptBinding.persistedArtifactRawSha256 =
      hash("different-preseal");
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(receiptDrift),
      ),
    ).toThrow(/cross_binding_invalid/);

    const absenceDrift = mutableClone(makeExecutionEvidence());
    absenceDrift.outputRootAbsenceReceiptBinding.outputRootAbsenceInventorySha256 =
      hash("different-absence-inventory");
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(absenceDrift),
      ),
    ).toThrow(/cross_binding_invalid/);

    const chronologyDrift = mutableClone(makeExecutionEvidence());
    chronologyDrift.scientificPresealBinding.createdAt =
      "2026-08-14T12:00:00.100000000Z";
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(chronologyDrift),
      ),
    ).toThrow(/cross_binding_invalid/);

    const baseDrift = mutableClone(makeExecutionEvidence());
    baseDrift.staticInputs[3]!.sha256 = hash("changed-source-manifest");
    baseDrift.staticInputs[3]!.stat.sha256 = baseDrift.staticInputs[3]!.sha256;
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(baseDrift),
      ),
    ).toThrow(/base_static_aggregate_drift/);
  });

  it("rejects A/S splicing and the incompatible v1 skeleton identity", () => {
    const digestDrift = mutableClone(makeExecutionEvidence());
    digestDrift.preexecutionSkeletonBinding.prePresealStaticClosureSha256 =
      hash("different-A-digest");
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(digestDrift),
      ),
    ).toThrow(/cross_binding_invalid/);

    const splicedA = mutableClone(makeExecutionEvidence());
    splicedA.prePresealStaticClosure.dirtyTreeDigestSha256 = hash(
      "valid-but-spliced-A",
    );
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(splicedA),
      ),
    ).toThrow(/cross_binding_invalid/);

    const v1Identity = mutableClone(makeExecutionEvidence());
    (
      v1Identity.preexecutionSkeletonBinding as unknown as {
        contractVersion: string;
      }
    ).contractVersion =
      "nhm2_spherical_boson_star_v2_preexecution_output_skeleton/v1";
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(v1Identity),
      ),
    ).toThrow(/execution_preseal_evidence_invalid/);

    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.blockers,
    ).toContain(
      "preexecution_skeleton_v2_canonical_wire_validator_not_implemented",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2
        .preexecutionSkeletonBindingSchema.byteLevelAtoSClosureProven,
    ).toBe(false);
  });

  it("rejects any output-root absence observation before scientific persistence", () => {
    const oneEarlyAbsence = mutableClone(makeExecutionEvidence());
    oneEarlyAbsence.outputRootAbsenceInventory[0].observedAtWallUtc =
      "2026-08-14T12:00:00.450000000Z";
    oneEarlyAbsence.outputRootAbsenceReceiptBinding.outputRootAbsenceInventorySha256 =
      computeNhm2SphericalBosonStarV2OutputRootAbsenceInventorySha256(
        canonicalJson(oneEarlyAbsence.outputRootAbsenceInventory),
        canonicalJson(oneEarlyAbsence.prePresealStaticClosure.outputRootPlan),
      );
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(oneEarlyAbsence),
      ),
    ).toThrow(/cross_binding_invalid/);
  });

  it("requires timed post-persistence freshness and its claimed receipt binding", () => {
    const untimedReuse = mutableClone(makeExecutionEvidence());
    untimedReuse.executionFreshnessObservations = makeFreshness(
      untimedReuse.staticInputs,
    ) as unknown as Mutable<
      Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2[]
    >;
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(untimedReuse),
      ),
    ).toThrow(/execution_freshness_invalid/);

    const earlyFreshness = mutableClone(makeExecutionEvidence());
    earlyFreshness.executionFreshnessObservations[0].observedAtWallUtc =
      "2026-08-14T12:00:00.450000000Z";
    earlyFreshness.executionFreshnessReceiptBinding.executionFreshnessInventorySha256 =
      computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256(
        canonicalJson(earlyFreshness.executionFreshnessObservations),
        canonicalJson(earlyFreshness.staticInputs),
        canonicalJson(earlyFreshness.runIdentity),
      );
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(earlyFreshness),
      ),
    ).toThrow(/cross_binding_invalid/);

    const receiptDigestDrift = mutableClone(makeExecutionEvidence());
    receiptDigestDrift.executionFreshnessReceiptBinding.executionFreshnessInventorySha256 =
      hash("different-execution-freshness-inventory");
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(receiptDigestDrift),
      ),
    ).toThrow(/cross_binding_invalid/);

    const earlyReceipt = mutableClone(makeExecutionEvidence());
    earlyReceipt.executionFreshnessReceiptBinding.observedAt =
      "2026-08-14T12:00:00.540000000Z";
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(earlyReceipt),
      ),
    ).toThrow(/cross_binding_invalid/);

    const lateMonotonic = mutableClone(makeExecutionEvidence());
    lateMonotonic.executionFreshnessObservations[0].observedAtMonotonicRawNanoseconds =
      "800";
    lateMonotonic.executionFreshnessReceiptBinding.executionFreshnessInventorySha256 =
      computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256(
        canonicalJson(lateMonotonic.executionFreshnessObservations),
        canonicalJson(lateMonotonic.staticInputs),
        canonicalJson(lateMonotonic.runIdentity),
      );
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJson(lateMonotonic),
      ),
    ).toThrow(/cross_binding_invalid/);

    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.blockers,
    ).toContain("server_authenticated_freshness_observer_not_implemented");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.authorityLocks
        .executionFreshnessObservationAuthority,
    ).toBe(false);
  });

  it("accepts only prebounded canonical JSON text without touching caller objects", () => {
    let getterCalls = 0;
    const accessor = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(accessor, "value", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return "unsafe";
      },
    });
    expect(() =>
      nhm2SphericalBosonStarV2PreexecutionProfileV2CanonicalJson(
        accessor as unknown as string,
      ),
    ).toThrow(/canonical_json_text_required/);
    expect(getterCalls).toBe(0);

    let proxyTrapCalls = 0;
    const proxy = new Proxy(
      { value: 1 },
      {
        get() {
          proxyTrapCalls += 1;
          throw new Error("get trap must not run");
        },
        getOwnPropertyDescriptor() {
          proxyTrapCalls += 1;
          throw new Error("descriptor trap must not run");
        },
        ownKeys() {
          proxyTrapCalls += 1;
          throw new Error("ownKeys trap must not run");
        },
      },
    );
    expect(() =>
      computeNhm2SphericalBosonStarV2OutputRootPlanSha256(
        proxy as unknown as string,
      ),
    ).toThrow(/canonical_json_text_required/);
    expect(proxyTrapCalls).toBe(0);
    expect(
      nhm2SphericalBosonStarV2PreexecutionProfileV2Violations(proxy),
    ).toEqual(["v2_preexecution_profile_v2_canonical_json_text_required"]);
    expect(proxyTrapCalls).toBe(0);
  });

  it("enforces code-unit and UTF-8 caps before parsing hostile JSON text", () => {
    const millionMemberJson = `{${'"x":0,'.repeat(1_000_000)}"z":0}`;
    expect(() =>
      nhm2SphericalBosonStarV2PreexecutionProfileV2CanonicalJson(
        millionMemberJson,
      ),
    ).toThrow(/canonical_code_units_exceeded/);

    const byteHeavyJson = `"${"\u{1f600}".repeat(
      Math.floor(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS.maximumCanonicalCodeUnits /
          3,
      ),
    )}"`;
    expect(byteHeavyJson.length).toBeLessThanOrEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS.maximumCanonicalCodeUnits,
    );
    expect(() =>
      nhm2SphericalBosonStarV2PreexecutionProfileV2CanonicalJson(byteHeavyJson),
    ).toThrow(/canonical_bytes_exceeded/);
  });

  it("rejects long keys, unsafe values, and noncanonical encodings after bounded parse", () => {
    const longKeyJson = canonicalJson({
      ["k".repeat(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS.maximumPropertyKeyUtf8Bytes +
          1,
      )]: 0,
    });
    expect(() =>
      nhm2SphericalBosonStarV2PreexecutionProfileV2CanonicalJson(longKeyJson),
    ).toThrow(/key_utf8/);
    expect(() =>
      nhm2SphericalBosonStarV2PreexecutionProfileV2CanonicalJson(
        "9007199254740992",
      ),
    ).toThrow(/number/);
    expect(() =>
      nhm2SphericalBosonStarV2PreexecutionProfileV2CanonicalJson('"\\ud800"'),
    ).toThrow(/string/);
    expect(() =>
      nhm2SphericalBosonStarV2PreexecutionProfileV2CanonicalJson(
        '{"b":1,"a":2}',
      ),
    ).toThrow(/canonical_encoding_invalid/);
    expect(() =>
      nhm2SphericalBosonStarV2PreexecutionProfileV2CanonicalJson('{"a": 1}'),
    ).toThrow(/canonical_encoding_invalid/);
  });

  it("keeps every authority/readiness/claim/lamp false and every instance null", () => {
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_AUTHORITY_LOCKS,
      ),
    ).toSatisfy((values: unknown[]) =>
      values.every((value) => value === false),
    );
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CLAIM_LOCKS,
      ),
    ).toSatisfy((values: unknown[]) =>
      values.every((value) => value === false),
    );
    expect(
      Object.values(NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_LAMPS),
    ).toSatisfy((values: unknown[]) =>
      values.every((value) => value === false),
    );
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.readiness,
      ),
    ).toSatisfy((values: unknown[]) =>
      values.every((value) => value === false),
    );
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.instances,
      ),
    ).toSatisfy((values: unknown[]) => values.every((value) => value === null));
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.blockers,
    ).toContain("execution_not_authorized");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.blockerResolutionReceipt,
    ).toBeNull();
  });

  it("exposes no issuer, authority context, or validated-instance builder", () => {
    const forbiddenExports = Object.keys(profileV2Module).filter((key) =>
      /issuer|authoritycontext|validatedinstance|weakset/i.test(key),
    );
    expect(forbiddenExports).toEqual([]);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.diagnosticBoundary,
    ).toMatchObject({
      issuerExported: false,
      opaqueAuthorityContextExported: false,
      weakSetAuthorityUsed: false,
      validatedInstanceBuilderExported: false,
    });
  });

  it("accepts only the frozen identity and treats canonical text copies as non-authoritative", () => {
    expect(
      isNhm2SphericalBosonStarV2PreexecutionProfileV2(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2,
      ),
    ).toBe(true);
    expect(
      nhm2SphericalBosonStarV2PreexecutionProfileV2Violations(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2PreexecutionProfileV2Violations(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CANONICAL_JSON,
      ),
    ).toEqual(["v2_preexecution_profile_v2_external_copy_not_authoritative"]);
    expect(
      nhm2SphericalBosonStarV2PreexecutionProfileV2Violations(
        structuredClone(NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2),
      ),
    ).toEqual(["v2_preexecution_profile_v2_canonical_json_text_required"]);
    const drift = mutableClone(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2,
    ) as unknown as { maturity: string };
    drift.maturity = "certified";
    expect(
      nhm2SphericalBosonStarV2PreexecutionProfileV2Violations(
        canonicalJson(drift),
      ),
    ).toEqual(["v2_preexecution_profile_v2_semantic_mismatch"]);
  });

  it("domain-separates diagnostic preseal hashing from plan and absence hashing", () => {
    expect(
      new Set([
        NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_SHA256_DOMAIN,
        NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_PLAN_SHA256_DOMAIN,
        NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_INVENTORY_SHA256_DOMAIN,
      ]).size,
    ).toBe(3);
  });
});
