import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256,
  computeNhm2SphericalBosonStarV2OutputRootAbsenceInventorySha256,
  computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256,
  computeNhm2SphericalBosonStarV2PrePresealStaticInputAggregateSha256,
  deriveNhm2SphericalBosonStarV2DiagnosticPrePresealStaticClosure,
  NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2,
  type Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2,
  type Nhm2SphericalV2OutputRootAbsenceInventoryV2,
  type Nhm2SphericalV2OutputRootPlanV2,
  type Nhm2SphericalV2PrePresealStaticInputEntryV2,
  type Nhm2SphericalV2PrePresealStaticInputRoleV2,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-preexecution-profile.v2";
import type {
  Nhm2SphericalV2LinuxFileStatV1,
  Nhm2SphericalV2RunIdentityV1,
  Nhm2SphericalV2StaticInputKindV1,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-preexecution-profile.v1";
import {
  computeNhm2SphericalBosonStarV2SkeletonByteBindingV2,
  computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptSha256,
  deriveNhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2CanonicalJson,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-run-artifact-wire.v2";
import {
  deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-scientific-preseal-envelope.v1";
import {
  computeNhm2SphericalBosonStarV2ScientificPresealByteBindingV1,
  computeNhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptSha256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CLAIM_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-scientific-preseal-persistence-receipt.v1";
import * as executionWireModule from "../shared/contracts/nhm2-spherical-boson-star-v2-execution-preseal-wire.v1";
import {
  computeNhm2SphericalBosonStarV2DiagnosticExecutionPresealByteBindingV2,
  computeNhm2SphericalBosonStarV2ExecutionFreshnessReceiptSha256,
  computeNhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptSha256,
  computeNhm2SphericalBosonStarV2OutputRootAbsenceReceiptSha256,
  deriveNhm2SphericalBosonStarV2DiagnosticExecutionPresealV2CanonicalJson,
  NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_EXACT_KEYS,
  NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_WIRE_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_EVIDENCE_EXACT_KEYS,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_EXACT_KEYS,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_EXECUTION_PRESEAL_BINDING_EXACT_KEYS,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_BLOCKERS,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_INSTANCES,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LAMPS,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_READINESS,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS,
  NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_EXACT_KEYS,
  NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_SHA256_DOMAIN,
  nhm2SphericalBosonStarV2DiagnosticExecutionPresealPairViolations,
  nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2Violations,
  nhm2SphericalBosonStarV2ExecutionPresealPersistencePairViolations,
  nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptV1Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-execution-preseal-wire.v1";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const canonical = (value: unknown): string => {
  if (
    value === null ||
    ["boolean", "number", "string"].includes(typeof value)
  ) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (typeof value !== "object") throw new TypeError("fixture_not_json");
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(",")}}`;
};

const hash = (label: string): string =>
  createHash("sha256").update(`fixture:${label}`, "utf8").digest("hex");

const u64le = (value: number): Buffer => {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes;
};

const lengthDelimitedSha256 = (domain: string, text: string): string => {
  const bytes = Buffer.from(text, "utf8");
  return createHash("sha256")
    .update(domain, "utf8")
    .update(u64le(bytes.length))
    .update(bytes)
    .digest("hex");
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

const makeStaticInputs = (
  variant = "primary",
): Nhm2SphericalV2PrePresealStaticInputEntryV2[] =>
  NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2.map(
    (role, index) => {
      const semanticKind = KIND_BY_ROLE[role];
      const sha256 = hash(`static:${variant}:${role}`);
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

const OUTPUT_ROOT_PLAN: Nhm2SphericalV2OutputRootPlanV2 = [
  { role: "primary", absolutePath: "/srv/nhm2/runs/primary" },
  { role: "independent", absolutePath: "/srv/nhm2/runs/independent" },
];

type Chain = Readonly<{
  aJson: string;
  skeletonJson: string;
  skeletonReceiptJson: string;
  presealJson: string;
  presealReceiptJson: string;
  fJson: string;
  frJson: string;
  oJson: string;
  orJson: string;
  eJson: string;
  erJson: string;
}>;

const seal = (
  unsigned: Record<string, Json>,
  compute: (text: string) => string,
): string => {
  const text = canonical(unsigned);
  return canonical({
    ...structuredClone(unsigned),
    receiptSha256: compute(text),
  });
};

type SourceChain = Omit<Chain, "eJson" | "erJson">;

const makeSources = (
  skeletonPath = "/srv/nhm2/preexecution/output-skeleton.v2.json",
  variant = "primary",
): SourceChain => {
  const staticInputs = makeStaticInputs(variant);
  const outputRootPlan: Nhm2SphericalV2OutputRootPlanV2 =
    variant === "primary"
      ? OUTPUT_ROOT_PLAN
      : [
          {
            role: "primary",
            absolutePath: `/srv/nhm2/runs/${variant}-primary`,
          },
          {
            role: "independent",
            absolutePath: `/srv/nhm2/runs/${variant}-independent`,
          },
        ];
  const prePresealFreshness = staticInputs.map((entry) => ({
    postread: structuredClone(entry.stat),
    preopen: structuredClone(entry.stat),
    relativePath: entry.relativePath,
    stable: true as const,
  }));
  const closure =
    deriveNhm2SphericalBosonStarV2DiagnosticPrePresealStaticClosure(
      canonical({
        argv: ["/opt/nhm2/primary", "--candidate", "spherical-v2"],
        dirtyTreeDigestSha256: hash("dirty-tree"),
        expectedRuntimeClosureSha256: hash("expected-runtime"),
        freshnessObservations: prePresealFreshness,
        outputRootPlan,
        runIdentity: RUN_IDENTITY,
        staticInputs,
      }),
    );
  const aJson = canonical(closure);
  const skeletonJson =
    deriveNhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2CanonicalJson(
      aJson,
      canonical({ skeletonFrozenAt: "2026-08-14T12:00:00.000000001Z" }),
    );
  const skeletonBinding =
    computeNhm2SphericalBosonStarV2SkeletonByteBindingV2(skeletonJson);
  const skeletonReceiptJson = seal(
    {
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID,
      authenticatedObservationContext: null,
      authorityFalse: true,
      authorityLocks: structuredClone(
        NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
      ) as unknown as Json,
      candidateId:
        NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2.candidateId,
      claimLocks: structuredClone(
        NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
      ) as unknown as Json,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
      observationAuthentication: "not_established_by_plain_canonical_json",
      persistedAt: "2026-08-14T12:00:00.000000002Z",
      persistenceKind: "external_durable_publication_readback",
      phase: "external_durable_readback_receipt_integrity_only",
      skeletonBinding: {
        ...structuredClone(skeletonBinding),
        path: skeletonPath,
      } as unknown as Json,
    },
    computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptSha256,
  );
  const presealJson =
    deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
      skeletonJson,
      skeletonReceiptJson,
      canonical({ createdAt: "2026-08-14T12:00:00.000000003Z" }),
    );
  const presealBinding =
    computeNhm2SphericalBosonStarV2ScientificPresealByteBindingV1(
      aJson,
      skeletonJson,
      skeletonReceiptJson,
      presealJson,
    );
  const presealReceiptJson = seal(
    {
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID,
      authenticatedObservationContext: null,
      authorityFalse: true,
      authorityLocks: structuredClone(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_AUTHORITY_LOCKS,
      ) as unknown as Json,
      candidateId:
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING.candidateId,
      claimLocks: structuredClone(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CLAIM_LOCKS,
      ) as unknown as Json,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
      observationAuthentication: "not_established_by_plain_canonical_json",
      path: "/srv/nhm2/preexecution/scientific-preseal-receipt.v1.json",
      persistedAt: "2026-08-14T12:00:00.000000004Z",
      persistenceKind: "external_durable_publication_readback",
      persistenceObservedAt: "2026-08-14T12:00:00.000000005Z",
      phase:
        "external_scientific_preseal_durable_readback_receipt_integrity_only",
      scientificPresealBinding: {
        ...structuredClone(presealBinding),
        path: "/srv/nhm2/preexecution/scientific-preseal-envelope.v1.json",
      } as unknown as Json,
    },
    computeNhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptSha256,
  );
  const executionFreshnessObservations: Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2[] =
    staticInputs.map((entry, index) => ({
      observedAtMonotonicRawNanoseconds: String(600 + index),
      observedAtWallUtc: `2026-08-14T12:00:00.${String(6 + index).padStart(9, "0")}Z`,
      postread: structuredClone(entry.stat),
      preopen: structuredClone(entry.stat),
      relativePath: entry.relativePath,
      stable: true,
    }));
  const fJson = canonical({
    attemptOrdinal: 1,
    createdMonotonicRawNanoseconds: "800",
    createdWallUtc: "2026-08-14T12:00:00.000000022Z",
    executionFreshnessObservations,
    runIdentity: RUN_IDENTITY,
    staticInputs,
  });
  const prePresealStaticClosureSha256 =
    computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256(aJson);
  const baseAggregate =
    computeNhm2SphericalBosonStarV2PrePresealStaticInputAggregateSha256(
      canonical(staticInputs),
      canonical(RUN_IDENTITY),
    );
  const executionFreshnessInventorySha256 =
    computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256(
      canonical(executionFreshnessObservations),
      canonical(staticInputs),
      canonical(RUN_IDENTITY),
    );
  const presealReceipt = JSON.parse(presealReceiptJson) as Record<string, Json>;
  const frJson = seal(
    {
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_ARTIFACT_ID,
      authenticatedObservationContext: null,
      authorityFalse: true,
      authorityLocks: structuredClone(
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS,
      ) as unknown as Json,
      candidateId:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId,
      claimLocks: structuredClone(
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS,
      ) as unknown as Json,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_CONTRACT_VERSION,
      executionFreshnessInventorySha256,
      observationAuthentication: "not_established_by_plain_canonical_json",
      observedAt: "2026-08-14T12:00:00.000000018Z",
      path: "/srv/nhm2/preexecution/execution-freshness-receipt.v1.json",
      phase:
        "caller_claimed_execution_freshness_observation_receipt_integrity_only",
      prePresealStaticClosureSha256,
      prePresealStaticInputAggregateSha256: baseAggregate,
      scientificPersistenceReceiptSha256: presealReceipt.receiptSha256!,
    },
    computeNhm2SphericalBosonStarV2ExecutionFreshnessReceiptSha256,
  );
  const outputRootAbsenceInventory: Nhm2SphericalV2OutputRootAbsenceInventoryV2 =
    [
      {
        absolutePath: outputRootPlan[0].absolutePath,
        observedAbsent: true,
        observedAtMonotonicRawNanoseconds: "700",
        observedAtWallUtc: "2026-08-14T12:00:00.000000019Z",
        role: "primary",
      },
      {
        absolutePath: outputRootPlan[1].absolutePath,
        observedAbsent: true,
        observedAtMonotonicRawNanoseconds: "710",
        observedAtWallUtc: "2026-08-14T12:00:00.000000020Z",
        role: "independent",
      },
    ];
  const oJson = canonical(outputRootAbsenceInventory);
  const outputRootAbsenceInventorySha256 =
    computeNhm2SphericalBosonStarV2OutputRootAbsenceInventorySha256(
      oJson,
      canonical(outputRootPlan),
    );
  const orJson = seal(
    {
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_ARTIFACT_ID,
      authenticatedObservationContext: null,
      authorityFalse: true,
      authorityLocks: structuredClone(
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS,
      ) as unknown as Json,
      candidateId:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId,
      claimLocks: structuredClone(
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS,
      ) as unknown as Json,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_CONTRACT_VERSION,
      observationAuthentication: "not_established_by_plain_canonical_json",
      observedAt: "2026-08-14T12:00:00.000000021Z",
      outputRootAbsenceInventorySha256,
      outputRootPlanSha256: closure.outputRootPlanSha256,
      path: "/srv/nhm2/preexecution/output-root-absence-receipt.v1.json",
      phase:
        "caller_claimed_output_root_absence_observation_receipt_integrity_only",
      prePresealStaticClosureSha256,
      scientificPersistenceReceiptSha256: presealReceipt.receiptSha256!,
    },
    computeNhm2SphericalBosonStarV2OutputRootAbsenceReceiptSha256,
  );
  return {
    aJson,
    skeletonJson,
    skeletonReceiptJson,
    presealJson,
    presealReceiptJson,
    fJson,
    frJson,
    oJson,
    orJson,
  };
};

const deriveE = (sources: SourceChain): string =>
  deriveNhm2SphericalBosonStarV2DiagnosticExecutionPresealV2CanonicalJson(
    sources.aJson,
    sources.skeletonJson,
    sources.skeletonReceiptJson,
    sources.presealJson,
    sources.presealReceiptJson,
    sources.fJson,
    sources.frJson,
    sources.oJson,
    sources.orJson,
  );

const makeChain = (variant = "primary"): Chain => {
  const sources = makeSources(
    "/srv/nhm2/preexecution/output-skeleton.v2.json",
    variant,
  );
  const eJson = deriveE(sources);
  const eBinding =
    computeNhm2SphericalBosonStarV2DiagnosticExecutionPresealByteBindingV2(
      eJson,
    );
  const erJson = seal(
    {
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID,
      authenticatedObservationContext: null,
      authorityFalse: true,
      authorityLocks: structuredClone(
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS,
      ) as unknown as Json,
      candidateId:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId,
      claimLocks: structuredClone(
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS,
      ) as unknown as Json,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
      executionPresealBinding: {
        ...structuredClone(eBinding),
        path: "/srv/nhm2/external E/execution\\preseal.json",
      } as unknown as Json,
      observationAuthentication: "not_established_by_plain_canonical_json",
      observedAt: "2026-08-14T12:00:00.000000024Z",
      path: "/srv/nhm2/external receipts/ER\\receipt.json",
      persistedAt: "2026-08-14T12:00:00.000000023Z",
      persistenceKind: "external_durable_publication_readback",
      phase:
        "external_execution_preseal_durable_readback_receipt_integrity_only",
    },
    computeNhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptSha256,
  );
  return { ...sources, eJson, erJson };
};

const bundleViolations = (chain: Chain): readonly string[] =>
  nhm2SphericalBosonStarV2ExecutionPresealPersistencePairViolations(
    chain.aJson,
    chain.skeletonJson,
    chain.skeletonReceiptJson,
    chain.presealJson,
    chain.presealReceiptJson,
    chain.fJson,
    chain.frJson,
    chain.oJson,
    chain.orJson,
    chain.eJson,
    chain.erJson,
  );

const resealRecord = (
  value: Record<string, Json>,
  compute: (text: string) => string,
): string => {
  const unsigned = structuredClone(value);
  delete unsigned.receiptSha256;
  return seal(unsigned, compute);
};

const rebindFreshnessReceipt = (
  sources: SourceChain,
  fJson: string,
): string => {
  const f = JSON.parse(fJson) as Record<string, Json>;
  const receipt = JSON.parse(sources.frJson) as Record<string, Json>;
  receipt.executionFreshnessInventorySha256 =
    computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256(
      canonical(f.executionFreshnessObservations),
      canonical(f.staticInputs),
      canonical(f.runIdentity),
    );
  return resealRecord(
    receipt,
    computeNhm2SphericalBosonStarV2ExecutionFreshnessReceiptSha256,
  );
};

const rebindAbsenceReceipt = (sources: SourceChain, oJson: string): string => {
  const closure = JSON.parse(sources.aJson) as Record<string, Json>;
  const receipt = JSON.parse(sources.orJson) as Record<string, Json>;
  receipt.outputRootAbsenceInventorySha256 =
    computeNhm2SphericalBosonStarV2OutputRootAbsenceInventorySha256(
      oJson,
      canonical(closure.outputRootPlan),
    );
  return resealRecord(
    receipt,
    computeNhm2SphericalBosonStarV2OutputRootAbsenceReceiptSha256,
  );
};

describe("NHM2 spherical boson-star v2 execution-preseal wire v1", () => {
  it("has the acknowledged literal semantic self-seal and exact final dependencies", () => {
    const canonicalAgain = canonical(
      JSON.parse(
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_CANONICAL_JSON,
      ),
    );
    expect(canonicalAgain).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_CANONICAL_JSON,
    );
    const bytes = Buffer.from(canonicalAgain, "utf8");
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_SHA256_DOMAIN,
          "utf8",
        )
        .update(u64le(bytes.length))
        .update(bytes)
        .digest("hex"),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_SHA256);
    expect(bytes.length).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_EXPECTED_SHA256,
    ).toBe("b9ef8ec056ce931e23aca660ab978f7861a2222d6658772e52e6cdca66a57987");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(13_524);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_SHA256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_EXPECTED_SHA256,
    );
    expect(bytes.length).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS,
    ).toEqual({
      preexecutionProfileV2: {
        sha256:
          "dce4c293d09224e4b7d79bd8b04b46542875f0306eecee84c35bb4c10bf68cb8",
        canonicalSizeBytes: 11_663,
      },
      runArtifactWireV2: {
        sha256:
          "d681751c9f0cec9e10336f98bb4c6a2657411bc74d612313660692363202971d",
        canonicalSizeBytes: 11_117,
      },
      scientificPresealEnvelopeV1: {
        sha256:
          "b832aefb663b08cc9982d7ffb6ee0d21eea4a3453aa4aec6c22ab3cd6d2ccbca",
        canonicalSizeBytes: 10_551,
      },
      scientificPresealPersistenceReceiptV1: {
        sha256:
          "4c4112703dc13778d7053287fa03f0a22fb532ea09c9dad5b0b7046757140605",
        canonicalSizeBytes: 8_306,
      },
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    ).toMatchObject(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS.preexecutionProfileV2,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
    ).toMatchObject(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS.runArtifactWireV2,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING,
    ).toMatchObject(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS.scientificPresealEnvelopeV1,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING,
    ).toMatchObject(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS.scientificPresealPersistenceReceiptV1,
    );
  });

  it("derives and validates the exact A,S,SR,P,PR,F,FR,O,OR,E,ER bundle", () => {
    const chain = makeChain();
    const f = JSON.parse(chain.fJson) as Record<string, unknown>;
    const fr = JSON.parse(chain.frJson) as Record<string, unknown>;
    const or = JSON.parse(chain.orJson) as Record<string, unknown>;
    const e = JSON.parse(chain.eJson) as Record<string, unknown>;
    const er = JSON.parse(chain.erJson) as Record<string, any>;
    expect(Object.keys(f)).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_EVIDENCE_EXACT_KEYS,
    );
    expect(Object.keys(fr)).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_EXACT_KEYS,
    );
    expect(Object.keys(or)).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_EXACT_KEYS,
    );
    expect(Object.keys(e)).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_EXACT_KEYS,
    );
    expect(Object.keys(er)).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS,
    );
    expect(Object.keys(er.executionPresealBinding)).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_EXECUTION_PRESEAL_BINDING_EXACT_KEYS,
    );
    for (const keys of [
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_EVIDENCE_EXACT_KEYS,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_EXACT_KEYS,
      NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_EXACT_KEYS,
      NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_EXACT_KEYS,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_EXECUTION_PRESEAL_BINDING_EXACT_KEYS,
    ]) {
      expect([...keys]).toEqual([...keys].sort());
    }
    expect(bundleViolations(chain)).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2Violations(
        chain.eJson,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptV1Violations(
        chain.erJson,
      ),
    ).toEqual([]);
    expect(e).not.toHaveProperty("rawSha256");
    expect(e).not.toHaveProperty("wireSha256");
    expect(e).not.toHaveProperty("sizeBytes");
    expect(e).not.toHaveProperty("executionPresealPersistenceReceipt");
    expect(er.path).toContain(" ");
    expect(er.path).toContain("\\");
    expect(er.executionPresealBinding.path).toContain(" ");
    expect(er.executionPresealBinding.path).toContain("\\");
  });

  it("rejects every single-position splice from a second coherent resealed chain", () => {
    const primary = makeChain();
    const alternate = makeChain("alternate");
    expect(bundleViolations(primary)).toEqual([]);
    expect(bundleViolations(alternate)).toEqual([]);
    const artifactKeys = [
      "aJson",
      "skeletonJson",
      "skeletonReceiptJson",
      "presealJson",
      "presealReceiptJson",
      "fJson",
      "frJson",
      "oJson",
      "orJson",
      "eJson",
      "erJson",
    ] as const satisfies readonly (keyof Chain)[];
    for (const artifactKey of artifactKeys) {
      expect(alternate[artifactKey]).not.toBe(primary[artifactKey]);
      const spliced = {
        ...primary,
        [artifactKey]: alternate[artifactKey],
      } as Chain;
      expect(bundleViolations(spliced), artifactKey).not.toEqual([]);
    }
  });

  it("preserves the legacy E inner seal and keeps raw/wire/size external", () => {
    const chain = makeChain();
    const e = JSON.parse(chain.eJson) as Record<string, Json>;
    const actualInner = e.diagnosticPresealSha256;
    delete e.diagnosticPresealSha256;
    const unsignedE = canonical(e);
    expect(actualInner).toBe(
      lengthDelimitedSha256(
        NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_SHA256_DOMAIN,
        unsignedE,
      ),
    );
    const binding =
      computeNhm2SphericalBosonStarV2DiagnosticExecutionPresealByteBindingV2(
        chain.eJson,
      );
    expect(binding.rawSha256).toBe(
      createHash("sha256").update(chain.eJson, "utf8").digest("hex"),
    );
    expect(binding.wireSha256).toBe(
      lengthDelimitedSha256(
        NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_WIRE_SHA256_DOMAIN,
        chain.eJson,
      ),
    );
    expect(binding.sizeBytes).toBe(Buffer.byteLength(chain.eJson, "utf8"));
    expect(binding.rawSha256).not.toBe(binding.wireSha256);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_WIRE_SHA256_DOMAIN,
    ).toBe(
      "nhm2-spherical-boson-star-v2/diagnostic-preexecution-preseal-wire/v2\n",
    );
  });

  it("uses distinct unsigned self-hash domains for FR, OR, and ER", () => {
    const chain = makeChain();
    const cases = [
      [
        chain.frJson,
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_SHA256_DOMAIN,
      ],
      [
        chain.orJson,
        NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_SHA256_DOMAIN,
      ],
      [
        chain.erJson,
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_SHA256_DOMAIN,
      ],
    ] as const;
    for (const [text, domain] of cases) {
      const receipt = JSON.parse(text) as Record<string, Json>;
      const actual = receipt.receiptSha256;
      delete receipt.receiptSha256;
      expect(actual).toBe(lengthDelimitedSha256(domain, canonical(receipt)));
    }
  });

  it("requires PR observation strictly before every F and O wall observation", () => {
    const sources = makeSources();
    const f = JSON.parse(sources.fJson) as Record<string, any>;
    f.executionFreshnessObservations[5].observedAtWallUtc =
      "2026-08-14T12:00:00.000000005Z";
    const fJson = canonical(f);
    expect(() =>
      deriveE({
        ...sources,
        fJson,
        frJson: rebindFreshnessReceipt(sources, fJson),
      }),
    ).toThrow("spherical_v2_execution_preseal_strict_chronology_invalid");
    const o = JSON.parse(sources.oJson) as any[];
    o[1].observedAtWallUtc = "2026-08-14T12:00:00.000000005Z";
    const oJson = canonical(o);
    expect(() =>
      deriveE({
        ...sources,
        oJson,
        orJson: rebindAbsenceReceipt(sources, oJson),
      }),
    ).toThrow("spherical_v2_execution_preseal_strict_chronology_invalid");
  });

  it("requires latest F < FR < E and latest O < OR < E", () => {
    const sources = makeSources();
    const fr = JSON.parse(sources.frJson) as Record<string, Json>;
    fr.observedAt = "2026-08-14T12:00:00.000000017Z";
    expect(() =>
      deriveE({
        ...sources,
        frJson: resealRecord(
          fr,
          computeNhm2SphericalBosonStarV2ExecutionFreshnessReceiptSha256,
        ),
      }),
    ).toThrow("spherical_v2_execution_preseal_strict_chronology_invalid");
    fr.observedAt = "2026-08-14T12:00:00.000000022Z";
    expect(() =>
      deriveE({
        ...sources,
        frJson: resealRecord(
          fr,
          computeNhm2SphericalBosonStarV2ExecutionFreshnessReceiptSha256,
        ),
      }),
    ).toThrow("spherical_v2_execution_preseal_strict_chronology_invalid");
    const or = JSON.parse(sources.orJson) as Record<string, Json>;
    or.observedAt = "2026-08-14T12:00:00.000000020Z";
    expect(() =>
      deriveE({
        ...sources,
        orJson: resealRecord(
          or,
          computeNhm2SphericalBosonStarV2OutputRootAbsenceReceiptSha256,
        ),
      }),
    ).toThrow("spherical_v2_execution_preseal_strict_chronology_invalid");
  });

  it("requires every F/O monotonic observation strictly before E monotonic creation", () => {
    const sources = makeSources();
    const f = JSON.parse(sources.fJson) as Record<string, any>;
    f.executionFreshnessObservations[0].observedAtMonotonicRawNanoseconds =
      "800";
    const fJson = canonical(f);
    expect(() =>
      deriveE({
        ...sources,
        fJson,
        frJson: rebindFreshnessReceipt(sources, fJson),
      }),
    ).toThrow("spherical_v2_execution_preseal_strict_chronology_invalid");
    const o = JSON.parse(sources.oJson) as any[];
    o[0].observedAtMonotonicRawNanoseconds = "800";
    const oJson = canonical(o);
    expect(() =>
      deriveE({
        ...sources,
        oJson,
        orJson: rebindAbsenceReceipt(sources, oJson),
      }),
    ).toThrow("spherical_v2_execution_preseal_strict_chronology_invalid");
  });

  it("cross-binds every richer FR/OR digest before legacy projection", () => {
    const sources = makeSources();
    for (const field of [
      "executionFreshnessInventorySha256",
      "prePresealStaticClosureSha256",
      "prePresealStaticInputAggregateSha256",
      "scientificPersistenceReceiptSha256",
    ]) {
      const fr = JSON.parse(sources.frJson) as Record<string, Json>;
      fr[field] = hash(`wrong-fr:${field}`);
      expect(() =>
        deriveE({
          ...sources,
          frJson: resealRecord(
            fr,
            computeNhm2SphericalBosonStarV2ExecutionFreshnessReceiptSha256,
          ),
        }),
      ).toThrow(
        "spherical_v2_execution_preseal_F_FR_O_OR_cross_binding_invalid",
      );
    }
    for (const field of [
      "outputRootAbsenceInventorySha256",
      "outputRootPlanSha256",
      "prePresealStaticClosureSha256",
      "scientificPersistenceReceiptSha256",
    ]) {
      const or = JSON.parse(sources.orJson) as Record<string, Json>;
      or[field] = hash(`wrong-or:${field}`);
      expect(() =>
        deriveE({
          ...sources,
          orJson: resealRecord(
            or,
            computeNhm2SphericalBosonStarV2OutputRootAbsenceReceiptSha256,
          ),
        }),
      ).toThrow(
        "spherical_v2_execution_preseal_F_FR_O_OR_cross_binding_invalid",
      );
    }
  });

  it("rejects a validly resealed but non-derived E and any ER byte splice", () => {
    const chain = makeChain();
    const e = JSON.parse(chain.eJson) as Record<string, Json>;
    e.expectedRuntimeClosureSha256 = hash("wrong-expected-runtime");
    delete e.diagnosticPresealSha256;
    e.diagnosticPresealSha256 = lengthDelimitedSha256(
      NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_SHA256_DOMAIN,
      canonical(e),
    );
    const alteredE = canonical(e);
    expect(
      nhm2SphericalBosonStarV2DiagnosticExecutionPresealPairViolations(
        chain.aJson,
        chain.skeletonJson,
        chain.skeletonReceiptJson,
        chain.presealJson,
        chain.presealReceiptJson,
        chain.fJson,
        chain.frJson,
        chain.oJson,
        chain.orJson,
        alteredE,
      ),
    ).toContain("spherical_v2_execution_preseal_exact_derivation_mismatch");
    const er = JSON.parse(chain.erJson) as Record<string, any>;
    er.executionPresealBinding.rawSha256 = hash("wrong-e-raw");
    const alteredEr = resealRecord(
      er,
      computeNhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptSha256,
    );
    expect(bundleViolations({ ...chain, erJson: alteredEr })).toContain(
      "spherical_v2_execution_preseal_ER_byte_binding_invalid",
    );
  });

  it("enforces E.created < ER.persisted <= ER.observed", () => {
    const chain = makeChain();
    const er = JSON.parse(chain.erJson) as Record<string, Json>;
    er.persistedAt = "2026-08-14T12:00:00.000000022Z";
    expect(() =>
      resealRecord(
        er,
        computeNhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptSha256,
      ),
    ).toThrow(
      "spherical_v2_execution_preseal_persistence_receipt_identity_or_chronology_invalid",
    );
    er.persistedAt = "2026-08-14T12:00:00.000000025Z";
    er.observedAt = "2026-08-14T12:00:00.000000024Z";
    expect(() =>
      resealRecord(
        er,
        computeNhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptSha256,
      ),
    ).toThrow(
      "spherical_v2_execution_preseal_persistence_receipt_identity_or_chronology_invalid",
    );
  });

  it("fails typed on repaired Pair1 paths that legacy E cannot project", () => {
    const sources = makeSources(
      "/srv/nhm2/preexecution/output skeleton.v2.json",
    );
    expect(() => deriveE(sources)).toThrow(
      "legacy_preexecution_v2_path_grammar_incompatible",
    );
    const compatible = makeSources();
    const fr = JSON.parse(compatible.frJson) as Record<string, Json>;
    fr.path = "/srv/nhm2/preexecution/freshness receipt.json";
    expect(() =>
      deriveE({
        ...compatible,
        frJson: resealRecord(
          fr,
          computeNhm2SphericalBosonStarV2ExecutionFreshnessReceiptSha256,
        ),
      }),
    ).toThrow("legacy_preexecution_v2_path_grammar_incompatible");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_BLOCKERS,
    ).toContain("legacy_preexecution_v2_path_grammar_incompatible");
  });

  it("rejects a non-string proxy at every aggregate ingress position with zero traps", () => {
    const chain = makeChain();
    const sourceArgs = [
      chain.aJson,
      chain.skeletonJson,
      chain.skeletonReceiptJson,
      chain.presealJson,
      chain.presealReceiptJson,
      chain.fJson,
      chain.frJson,
      chain.oJson,
      chain.orJson,
    ];
    const calls: readonly Readonly<{
      label: string;
      fn: (...args: unknown[]) => unknown;
      args: readonly unknown[];
    }>[] = [
      {
        label: "derive",
        fn: deriveNhm2SphericalBosonStarV2DiagnosticExecutionPresealV2CanonicalJson as unknown as (
          ...args: unknown[]
        ) => unknown,
        args: sourceArgs,
      },
      {
        label: "execution-pair",
        fn: nhm2SphericalBosonStarV2DiagnosticExecutionPresealPairViolations as unknown as (
          ...args: unknown[]
        ) => unknown,
        args: [...sourceArgs, chain.eJson],
      },
      {
        label: "persistence-pair",
        fn: nhm2SphericalBosonStarV2ExecutionPresealPersistencePairViolations as unknown as (
          ...args: unknown[]
        ) => unknown,
        args: [...sourceArgs, chain.eJson, chain.erJson],
      },
    ];
    for (const { label, fn, args } of calls) {
      for (let index = 0; index < args.length; index += 1) {
        let traps = 0;
        const proxy = new Proxy(
          {},
          {
            get() {
              traps += 1;
              throw new Error("get trap");
            },
            ownKeys() {
              traps += 1;
              throw new Error("ownKeys trap");
            },
            getOwnPropertyDescriptor() {
              traps += 1;
              throw new Error("descriptor trap");
            },
          },
        );
        const hostileArgs = [...args];
        hostileArgs[index] = proxy;
        let rejected = false;
        try {
          const result = fn(...hostileArgs);
          rejected = Array.isArray(result) && result.length > 0;
        } catch (error) {
          expect(error).toBeInstanceOf(TypeError);
          rejected = true;
        }
        expect(rejected, `${label}:${index}`).toBe(true);
        expect(traps, `${label}:${index}`).toBe(0);
      }
    }
  });

  it("rejects proxy and accessor objects at every unary public ingress with zero traps", () => {
    const unaryIngressNames = [
      "nhm2SphericalBosonStarV2ExecutionFreshnessEvidenceV1Violations",
      "computeNhm2SphericalBosonStarV2ExecutionFreshnessReceiptSha256",
      "nhm2SphericalBosonStarV2ExecutionFreshnessReceiptV1Violations",
      "computeNhm2SphericalBosonStarV2OutputRootAbsenceReceiptSha256",
      "nhm2SphericalBosonStarV2OutputRootAbsenceReceiptV1Violations",
      "nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2Violations",
      "computeNhm2SphericalBosonStarV2DiagnosticExecutionPresealByteBindingV2",
      "computeNhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptSha256",
      "nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptV1Violations",
      "computeNhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptByteBinding",
    ] as const satisfies readonly (keyof typeof executionWireModule)[];
    for (const name of unaryIngressNames) {
      const fn = executionWireModule[name] as unknown as (
        value: unknown,
      ) => unknown;
      for (const hostileKind of ["proxy", "accessor"] as const) {
        let traps = 0;
        const hostile =
          hostileKind === "proxy"
            ? new Proxy(
                {},
                {
                  get() {
                    traps += 1;
                    throw new Error("get trap");
                  },
                  ownKeys() {
                    traps += 1;
                    throw new Error("ownKeys trap");
                  },
                  getOwnPropertyDescriptor() {
                    traps += 1;
                    throw new Error("descriptor trap");
                  },
                },
              )
            : Object.defineProperty({}, "length", {
                get() {
                  traps += 1;
                  throw new Error("accessor trap");
                },
              });
        let rejected = false;
        try {
          const result = fn(hostile);
          rejected = Array.isArray(result) && result.length > 0;
        } catch (error) {
          expect(error).toBeInstanceOf(TypeError);
          rejected = true;
        }
        expect(rejected, `${name}:${hostileKind}`).toBe(true);
        expect(traps, `${name}:${hostileKind}`).toBe(0);
      }
    }
  });

  it("isolates every canonical-text and parsed-tree resource bound", () => {
    const limits = NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS;
    const violation = (text: string): string =>
      nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2Violations(text)[0] ??
      "";

    const overCodeUnits = "0".repeat(limits.maximumCanonicalCodeUnits + 1);
    expect(violation(overCodeUnits)).toContain("canonical_code_units_exceeded");

    const overUtf8 = JSON.stringify(
      "é".repeat(Math.floor(limits.maximumCanonicalUtf8Bytes / 2) + 1),
    );
    expect(overUtf8.length).toBeLessThan(limits.maximumCanonicalCodeUnits);
    expect(Buffer.byteLength(overUtf8, "utf8")).toBeGreaterThan(
      limits.maximumCanonicalUtf8Bytes,
    );
    expect(violation(overUtf8)).toContain("canonical_bytes_exceeded");

    let overDepth = "0";
    for (let index = 0; index <= limits.maximumDepth; index += 1) {
      overDepth = `[${overDepth}]`;
    }
    expect(violation(overDepth)).toContain(":depth:");

    const overNodes = `[${"[0],".repeat(limits.maximumArrayLength - 1)}[0]]`;
    expect(violation(overNodes)).toContain(":nodes:");

    const overArray = `[${"0,".repeat(limits.maximumArrayLength)}0]`;
    expect(violation(overArray)).toContain(":array:");

    const overObject = canonical(
      Object.fromEntries(
        Array.from(
          { length: limits.maximumObjectPropertyCount + 1 },
          (_, index) => [String(index).padStart(3, "0"), 0],
        ),
      ),
    );
    expect(violation(overObject)).toContain(":object:");

    const overKey = canonical({
      ["k".repeat(limits.maximumPropertyKeyUtf8Bytes + 1)]: 0,
    });
    expect(violation(overKey)).toContain(":key_utf8:");

    const overString = JSON.stringify(
      "s".repeat(limits.maximumStringUtf8Bytes + 1),
    );
    expect(violation(overString)).toContain(":string_utf8:");

    const aggregateString = canonical(
      Array.from({ length: 17 }, () =>
        "a".repeat(limits.maximumStringUtf8Bytes),
      ),
    );
    expect(Buffer.byteLength(aggregateString, "utf8")).toBeLessThan(
      limits.maximumCanonicalUtf8Bytes,
    );
    expect(violation(aggregateString)).toContain(":aggregate_string_utf8:");
  });

  it("isolates aggregate code-unit and UTF-8 bundle prebounds", () => {
    const limits = NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS;
    const derive =
      deriveNhm2SphericalBosonStarV2DiagnosticExecutionPresealV2CanonicalJson as unknown as (
        ...args: unknown[]
      ) => unknown;
    const codeUnitChunk = "0".repeat(
      Math.floor(limits.maximumAggregateInputCodeUnits / 9) + 1,
    );
    const codeUnitArgs = Array(9).fill(codeUnitChunk) as string[];
    expect(codeUnitChunk.length).toBeLessThan(limits.maximumCanonicalCodeUnits);
    expect(
      codeUnitArgs.reduce((sum, value) => sum + value.length, 0),
    ).toBeGreaterThan(limits.maximumAggregateInputCodeUnits);
    expect(() => derive(...codeUnitArgs)).toThrow(
      "bundle_aggregate_code_units_exceeded",
    );

    const utf8Chunk = "é".repeat(500_000);
    const utf8Args = Array(9).fill(utf8Chunk) as string[];
    expect(utf8Args.reduce((sum, value) => sum + value.length, 0)).toBeLessThan(
      limits.maximumAggregateInputCodeUnits,
    );
    expect(
      utf8Args.reduce(
        (sum, value) => sum + Buffer.byteLength(value, "utf8"),
        0,
      ),
    ).toBeGreaterThan(limits.maximumAggregateInputUtf8Bytes);
    expect(() => derive(...utf8Args)).toThrow(
      "bundle_aggregate_utf8_bytes_exceeded",
    );
  });

  it("keeps every authority/readiness/claim/lamp false and instance null", () => {
    for (const boundary of [
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LAMPS,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_READINESS,
    ]) {
      expect(Object.values(boundary).every((value) => value === false)).toBe(
        true,
      );
    }
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_INSTANCES,
      ).every((value) => value === null),
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT
        .externalExecutionPresealWireIdentity
        .executionPersistenceReceiptInsideEAllowed,
    ).toBe(false);
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_BINDING,
      ),
    ).toBe(true);
    expect(
      Object.keys(executionWireModule).some((name) =>
        /issuer|mint|capability|observer|launch|execute/i.test(name),
      ),
    ).toBe(false);
    const source = readFileSync(
      new URL(
        "../shared/contracts/nhm2-spherical-boson-star-v2-execution-preseal-wire.v1.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(source).not.toMatch(/from\s+["']node:fs/);
    expect(source).not.toMatch(/\bWeakSet\b/);
    expect(source).not.toMatch(
      /writeFile|readFile|openat2|statx|execFile|spawn/,
    );
    expect(source).not.toMatch(/candidate-registry|casimir/i);
  });
});
