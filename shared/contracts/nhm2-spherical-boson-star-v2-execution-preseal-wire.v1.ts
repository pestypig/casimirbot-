import { createHash } from "node:crypto";

import {
  computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256,
  computeNhm2SphericalBosonStarV2OutputRootAbsenceInventorySha256,
  computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256,
  computeNhm2SphericalBosonStarV2PrePresealStaticInputAggregateSha256,
  deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2,
  NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CLAIM_LOCKS,
  type Nhm2SphericalV2DiagnosticExecutionFreshnessReceiptBindingV2,
  type Nhm2SphericalV2DiagnosticOutputRootAbsenceReceiptBindingV2,
  type Nhm2SphericalV2DiagnosticPersistenceReceiptBindingV2,
  type Nhm2SphericalV2DiagnosticScientificPresealBindingV2,
  type Nhm2SphericalV2DiagnosticSkeletonBindingV2,
  type Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2,
  type Nhm2SphericalV2OutputRootAbsenceInventoryV2,
  type Nhm2SphericalV2PrePresealStaticClosureV2,
  type Nhm2SphericalV2PrePresealStaticInputEntryV2,
} from "./nhm2-spherical-boson-star-v2-preexecution-profile.v2";
import type { Nhm2SphericalV2RunIdentityV1 } from "./nhm2-spherical-boson-star-v2-preexecution-profile.v1";
import {
  deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
} from "./nhm2-spherical-boson-star-v2-run-artifact-wire.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING } from "./nhm2-spherical-boson-star-v2-scientific-preseal-envelope.v1";
import {
  deriveNhm2SphericalBosonStarV2DiagnosticScientificPresealPersistencePairV1,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING,
  nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations,
  type Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1,
} from "./nhm2-spherical-boson-star-v2-scientific-preseal-persistence-receipt.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_execution_preseal_wire" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_execution_preseal_wire/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-execution-preseal-wire-contract/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_WIRE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2/diagnostic-preexecution-preseal-wire/v2\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_diagnostic_execution_freshness_receipt" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_diagnostic_execution_freshness_receipt/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2/diagnostic-execution-freshness-receipt/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_diagnostic_output_root_absence_receipt" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_diagnostic_output_root_absence_receipt/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2/diagnostic-output-root-absence-receipt/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_diagnostic_preexecution_preseal_persistence_receipt" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_diagnostic_preexecution_preseal_persistence_receipt/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2/diagnostic-preexecution-preseal-persistence-receipt/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS =
  Object.freeze({
    maximumCanonicalCodeUnits: 2_097_152,
    maximumCanonicalUtf8Bytes: 2_097_152,
    maximumAggregateInputCodeUnits: 8_388_608,
    maximumAggregateInputUtf8Bytes: 8_388_608,
    maximumPrePresealStaticClosureUtf8Bytes: 262_144,
    maximumSkeletonUtf8Bytes: 1_048_576,
    maximumReceiptUtf8Bytes: 262_144,
    maximumScientificPresealUtf8Bytes: 262_144,
    maximumFreshnessEvidenceUtf8Bytes: 2_097_152,
    maximumAbsenceInventoryUtf8Bytes: 262_144,
    maximumExecutionPresealUtf8Bytes: 2_097_152,
    maximumDepth: 32,
    maximumNodes: 32_768,
    maximumArrayLength: 16_384,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 4_096,
    maximumStringUtf8Bytes: 65_536,
    maximumAggregateStringUtf8Bytes: 1_048_576,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS =
  Object.freeze({
    canonicalBytesGrantAuthority: false as const,
    callerClaimedObservationGrantsAuthority: false as const,
    receiptIntegrityGrantsPersistenceAuthority: false as const,
    authenticatedObservationAuthority: false as const,
    filesystemObservationAuthority: false as const,
    durabilityObservationAuthority: false as const,
    executionFreshnessObservationAuthority: false as const,
    outputRootAbsenceAuthority: false as const,
    presealPersistenceAuthority: false as const,
    runtimeLoaderObservationAuthority: false as const,
    implementationClosureAuthority: false as const,
    runtimeClosureAuthority: false as const,
    syscallTraceAuthority: false as const,
    launchAuthority: false as const,
    executionAuthority: false as const,
    executionObserved: false as const,
    candidateAuthority: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    diagnosticPass: false as const,
    theoryGraphPromotion: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS =
  Object.freeze({
    observationAuthenticated: false as const,
    persistenceObserved: false as const,
    durabilityEstablished: false as const,
    launchAuthorized: false as const,
    executionAuthorized: false as const,
    candidateAccepted: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LAMPS =
  Object.freeze({
    authenticatedFilesystemObservationLamp: false as const,
    authenticatedExecutionFreshnessLamp: false as const,
    authenticatedOutputRootAbsenceLamp: false as const,
    authenticatedPresealPersistenceLamp: false as const,
    runtimeLoaderObservationLamp: false as const,
    launchLamp: false as const,
    executionLamp: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    independentAgreementLamp: false as const,
    diagnosticPassLamp: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_READINESS =
  Object.freeze({
    exactPair1ChainReady: false as const,
    authenticatedExecutionFreshnessObservationReady: false as const,
    authenticatedOutputRootAbsenceObservationReady: false as const,
    authenticatedFilesystemObservationReady: false as const,
    authenticatedPresealPersistenceReady: false as const,
    authenticatedRuntimeLoaderObservationReady: false as const,
    authenticatedSyscallTraceReady: false as const,
    implementationClosureReady: false as const,
    runtimeClosureReady: false as const,
    launchReady: false as const,
    executionReady: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_INSTANCES =
  Object.freeze({
    authenticatedExecutionFreshnessReceipt: null,
    authenticatedOutputRootAbsenceReceipt: null,
    authenticatedFilesystemObservation: null,
    authenticatedExecutionPresealPersistenceReceipt: null,
    runtimeLoaderObservation: null,
    syscallTrace: null,
    launchEnvelope: null,
    executionReceipt: null,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_BLOCKERS =
  Object.freeze([
    "server_authenticated_execution_freshness_observer_not_implemented",
    "server_authenticated_output_root_absence_observer_not_implemented",
    "server_authenticated_filesystem_observer_not_implemented",
    "server_authenticated_execution_preseal_persistence_observer_not_implemented",
    "server_authenticated_runtime_loader_observer_not_implemented",
    "legacy_preexecution_v2_path_grammar_incompatible",
    "launch_envelope_not_implemented",
    "execution_not_authorized",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS =
  Object.freeze({
    preexecutionProfileV2: Object.freeze({
      sha256:
        "dce4c293d09224e4b7d79bd8b04b46542875f0306eecee84c35bb4c10bf68cb8",
      canonicalSizeBytes: 11_663,
    }),
    runArtifactWireV2: Object.freeze({
      sha256:
        "d681751c9f0cec9e10336f98bb4c6a2657411bc74d612313660692363202971d",
      canonicalSizeBytes: 11_117,
    }),
    scientificPresealEnvelopeV1: Object.freeze({
      sha256:
        "b832aefb663b08cc9982d7ffb6ee0d21eea4a3453aa4aec6c22ab3cd6d2ccbca",
      canonicalSizeBytes: 10_551,
    }),
    scientificPresealPersistenceReceiptV1: Object.freeze({
      sha256:
        "4c4112703dc13778d7053287fa03f0a22fb532ea09c9dad5b0b7046757140605",
      canonicalSizeBytes: 8_306,
    }),
  } as const);

export type Nhm2SphericalBosonStarV2ExecutionFreshnessEvidenceBundleV1 =
  Readonly<{
    attemptOrdinal: 1;
    createdMonotonicRawNanoseconds: string;
    createdWallUtc: string;
    executionFreshnessObservations: readonly Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2[];
    runIdentity: Nhm2SphericalV2RunIdentityV1;
    staticInputs: readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[];
  }>;

export type Nhm2SphericalBosonStarV2ExecutionFreshnessReceiptUnsignedV1 =
  Readonly<{
    artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_ARTIFACT_ID;
    authenticatedObservationContext: null;
    authorityFalse: true;
    authorityLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS;
    candidateId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId;
    claimLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS;
    contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_CONTRACT_VERSION;
    executionFreshnessInventorySha256: string;
    observationAuthentication: "not_established_by_plain_canonical_json";
    observedAt: string;
    path: string;
    phase: "caller_claimed_execution_freshness_observation_receipt_integrity_only";
    prePresealStaticClosureSha256: string;
    prePresealStaticInputAggregateSha256: string;
    scientificPersistenceReceiptSha256: string;
  }>;

export type Nhm2SphericalBosonStarV2ExecutionFreshnessReceiptV1 = Readonly<
  Nhm2SphericalBosonStarV2ExecutionFreshnessReceiptUnsignedV1 & {
    receiptSha256: string;
  }
>;

export type Nhm2SphericalBosonStarV2OutputRootAbsenceReceiptUnsignedV1 =
  Readonly<{
    artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_ARTIFACT_ID;
    authenticatedObservationContext: null;
    authorityFalse: true;
    authorityLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS;
    candidateId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId;
    claimLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS;
    contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_CONTRACT_VERSION;
    observationAuthentication: "not_established_by_plain_canonical_json";
    observedAt: string;
    outputRootAbsenceInventorySha256: string;
    outputRootPlanSha256: string;
    path: string;
    phase: "caller_claimed_output_root_absence_observation_receipt_integrity_only";
    prePresealStaticClosureSha256: string;
    scientificPersistenceReceiptSha256: string;
  }>;

export type Nhm2SphericalBosonStarV2OutputRootAbsenceReceiptV1 = Readonly<
  Nhm2SphericalBosonStarV2OutputRootAbsenceReceiptUnsignedV1 & {
    receiptSha256: string;
  }
>;

export type Nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2 = Readonly<{
  artifactId: "nhm2.spherical_boson_star_v2_diagnostic_preexecution_preseal";
  attemptOrdinal: 1;
  authorityFalse: true;
  candidateId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId;
  claimLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CLAIM_LOCKS;
  createdMonotonicRawNanoseconds: string;
  createdWallUtc: string;
  diagnosticPresealSha256: string;
  executionFreshnessInventorySha256: string;
  executionFreshnessReceiptBinding: Nhm2SphericalV2DiagnosticExecutionFreshnessReceiptBindingV2;
  expectedRuntimeClosureSha256: string;
  outputRootAbsenceInventorySha256: string;
  outputRootAbsenceReceiptBinding: Nhm2SphericalV2DiagnosticOutputRootAbsenceReceiptBindingV2;
  outputRootPlanSha256: string;
  phase: "execution_static_closure_after_scientific_preseal";
  prePresealStaticClosureSha256: string;
  prePresealStaticInputAggregateSha256: string;
  preexecutionSkeletonBinding: Nhm2SphericalV2DiagnosticSkeletonBindingV2;
  schemaVersion: "nhm2_spherical_boson_star_v2_diagnostic_preexecution_preseal/v2";
  scientificPersistenceReceiptBinding: Nhm2SphericalV2DiagnosticPersistenceReceiptBindingV2;
  scientificPresealBinding: Nhm2SphericalV2DiagnosticScientificPresealBindingV2;
}>;

export type Nhm2SphericalBosonStarV2DiagnosticExecutionPresealByteBindingV2 =
  Readonly<{
    artifactId: Nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2["artifactId"];
    candidateId: Nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2["candidateId"];
    createdMonotonicRawNanoseconds: string;
    createdWallUtc: string;
    diagnosticPresealSha256: string;
    mediaType: "application/json";
    prePresealStaticClosureSha256: string;
    rawSha256: string;
    schemaVersion: Nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2["schemaVersion"];
    sizeBytes: number;
    wireSha256: string;
  }>;

export type Nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptExecutionPresealBindingV1 =
  Readonly<
    Nhm2SphericalBosonStarV2DiagnosticExecutionPresealByteBindingV2 & {
      path: string;
    }
  >;

export type Nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptUnsignedV1 =
  Readonly<{
    artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID;
    authenticatedObservationContext: null;
    authorityFalse: true;
    authorityLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS;
    candidateId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId;
    claimLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS;
    contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION;
    executionPresealBinding: Nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptExecutionPresealBindingV1;
    observationAuthentication: "not_established_by_plain_canonical_json";
    observedAt: string;
    path: string;
    persistedAt: string;
    persistenceKind: "external_durable_publication_readback";
    phase: "external_execution_preseal_durable_readback_receipt_integrity_only";
  }>;

export type Nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptV1 =
  Readonly<
    Nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptUnsignedV1 & {
      receiptSha256: string;
    }
  >;

export type Nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptByteBindingV1 =
  Readonly<{
    artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID;
    contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION;
    mediaType: "application/json";
    observedAt: string;
    rawSha256: string;
    receiptSha256: string;
    sizeBytes: number;
  }>;

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalValue[]
  | { readonly [key: string]: CanonicalValue };

type ParsedFrame = Readonly<{
  value: unknown;
  pointer: string;
  depth: number;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const DECIMAL = /^(?:0|[1-9][0-9]*)$/;
const U64_DECIMAL_MAX = "18446744073709551615";
const PRINTABLE_ASCII_PATH_SEGMENT = /^[\x20-\x7e]+$/;
const VISIBLE_ASCII_RELATIVE_PATH =
  /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*\/\/)[\x21-\x7e]+$/;
const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

const nonzeroSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);

const u64DecimalValid = (value: unknown): value is string =>
  typeof value === "string" &&
  DECIMAL.test(value) &&
  (value.length < U64_DECIMAL_MAX.length ||
    (value.length === U64_DECIMAL_MAX.length && value <= U64_DECIMAL_MAX));

const repairedAbsolutePath = (value: unknown): value is string => {
  if (typeof value !== "string" || !value.startsWith("/")) return false;
  const segments = value.slice(1).split("/");
  return segments.every(
    (segment) =>
      segment.length > 0 &&
      segment !== "." &&
      segment !== ".." &&
      PRINTABLE_ASCII_PATH_SEGMENT.test(segment),
  );
};

const legacyAbsolutePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.startsWith("/") &&
  !value.endsWith("/") &&
  value.normalize("NFC") === value &&
  Buffer.byteLength(value, "utf8") <= 4_096 &&
  VISIBLE_ASCII_RELATIVE_PATH.test(value.slice(1)) &&
  !value.includes("\\");

const pointerSegment = (value: string): string =>
  value.replaceAll("~", "~0").replaceAll("/", "~1");

const u64le = (value: number): Buffer => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("spherical_v2_execution_preseal_wire_u64_invalid");
  }
  const output = Buffer.alloc(8);
  output.writeBigUInt64LE(BigInt(value));
  return output;
};

const canonicalJsonFromValue = (value: CanonicalValue): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJsonFromValue).join(",")}]`;
  }
  const record = value as { readonly [key: string]: CanonicalValue };
  return `{${Object.keys(record)
    .sort()
    .map(
      (key) => `${JSON.stringify(key)}:${canonicalJsonFromValue(record[key]!)}`,
    )
    .join(",")}}`;
};

const validateParsedTree = (root: unknown, code: string): void => {
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS;
  const stack: ParsedFrame[] = [{ value: root, pointer: "", depth: 0 }];
  let nodes = 0;
  let aggregateStringUtf8Bytes = 0;
  while (stack.length > 0) {
    const frame = stack.pop()!;
    nodes += 1;
    if (nodes > limits.maximumNodes) {
      throw new TypeError(`${code}:nodes:${frame.pointer || "/"}`);
    }
    if (frame.depth > limits.maximumDepth) {
      throw new TypeError(`${code}:depth:${frame.pointer || "/"}`);
    }
    const value = frame.value;
    if (value === null || typeof value === "boolean") continue;
    if (typeof value === "number") {
      if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
        throw new TypeError(`${code}:number:${frame.pointer || "/"}`);
      }
      continue;
    }
    if (typeof value === "string") {
      if (
        value.includes("\0") ||
        /[\ud800-\udfff]/u.test(value) ||
        value.normalize("NFC") !== value
      ) {
        throw new TypeError(`${code}:string:${frame.pointer || "/"}`);
      }
      const size = Buffer.byteLength(value, "utf8");
      if (size > limits.maximumStringUtf8Bytes) {
        throw new TypeError(`${code}:string_utf8:${frame.pointer || "/"}`);
      }
      aggregateStringUtf8Bytes += size;
      if (aggregateStringUtf8Bytes > limits.maximumAggregateStringUtf8Bytes) {
        throw new TypeError(
          `${code}:aggregate_string_utf8:${frame.pointer || "/"}`,
        );
      }
      continue;
    }
    if (typeof value !== "object") {
      throw new TypeError(`${code}:surface:${frame.pointer || "/"}`);
    }
    if (Array.isArray(value)) {
      if (value.length > limits.maximumArrayLength) {
        throw new TypeError(`${code}:array:${frame.pointer || "/"}`);
      }
      for (let index = value.length - 1; index >= 0; index -= 1) {
        stack.push({
          value: value[index],
          pointer: `${frame.pointer}/${index}`,
          depth: frame.depth + 1,
        });
      }
      continue;
    }
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length > limits.maximumObjectPropertyCount) {
      throw new TypeError(`${code}:object:${frame.pointer || "/"}`);
    }
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index]!;
      const keyPointer = `${frame.pointer}/${pointerSegment(key)}`;
      if (
        FORBIDDEN_KEYS.has(key) ||
        key.includes("\0") ||
        /[\ud800-\udfff]/u.test(key) ||
        key.normalize("NFC") !== key
      ) {
        throw new TypeError(`${code}:key:${keyPointer}`);
      }
      const size = Buffer.byteLength(key, "utf8");
      if (size > limits.maximumPropertyKeyUtf8Bytes) {
        throw new TypeError(`${code}:key_utf8:${keyPointer}`);
      }
      aggregateStringUtf8Bytes += size;
      if (aggregateStringUtf8Bytes > limits.maximumAggregateStringUtf8Bytes) {
        throw new TypeError(`${code}:aggregate_string_utf8:${keyPointer}`);
      }
      stack.push({
        value: record[key],
        pointer: keyPointer,
        depth: frame.depth + 1,
      });
    }
  }
};

const parseBoundedCanonicalJson = (
  canonicalJson: unknown,
  code: string,
  maximumBytes: number = NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumCanonicalUtf8Bytes,
): CanonicalValue => {
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS;
  if (typeof canonicalJson !== "string") {
    throw new TypeError(`${code}:canonical_json_text_required`);
  }
  if (canonicalJson.length > limits.maximumCanonicalCodeUnits) {
    throw new TypeError(`${code}:canonical_code_units_exceeded`);
  }
  if (Buffer.byteLength(canonicalJson, "utf8") > maximumBytes) {
    throw new TypeError(`${code}:canonical_bytes_exceeded`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(canonicalJson) as unknown;
  } catch {
    throw new TypeError(`${code}:json_parse_invalid`);
  }
  validateParsedTree(parsed, code);
  if (canonicalJsonFromValue(parsed as CanonicalValue) !== canonicalJson) {
    throw new TypeError(`${code}:canonical_encoding_invalid`);
  }
  return parsed as CanonicalValue;
};

const requireBoundedAggregateCanonicalStrings = (
  values: readonly unknown[],
): readonly string[] => {
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS;
  for (const value of values) {
    if (typeof value !== "string") {
      throw new TypeError(
        "spherical_v2_execution_preseal_bundle_canonical_json_text_required",
      );
    }
  }
  const strings = values as readonly string[];
  let codeUnits = 0;
  for (const value of strings) {
    if (value.length > limits.maximumCanonicalCodeUnits) {
      throw new TypeError(
        "spherical_v2_execution_preseal_bundle_canonical_code_units_exceeded",
      );
    }
    codeUnits += value.length;
    if (codeUnits > limits.maximumAggregateInputCodeUnits) {
      throw new TypeError(
        "spherical_v2_execution_preseal_bundle_aggregate_code_units_exceeded",
      );
    }
  }
  let bytes = 0;
  for (const value of strings) {
    bytes += Buffer.byteLength(value, "utf8");
    if (bytes > limits.maximumAggregateInputUtf8Bytes) {
      throw new TypeError(
        "spherical_v2_execution_preseal_bundle_aggregate_utf8_bytes_exceeded",
      );
    }
  }
  return strings;
};

const exactKeys = (value: unknown, expected: readonly string[]): boolean => {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  );
};

const sameCanonical = (left: unknown, right: unknown): boolean =>
  canonicalJsonFromValue(left as CanonicalValue) ===
  canonicalJsonFromValue(right as CanonicalValue);

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
};

const parseUtcNanoseconds = (value: unknown): bigint | null => {
  if (typeof value !== "string") return null;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{9})Z$/.exec(value);
  if (match === null) return null;
  const [, year, month, day, hour, minute, second, fraction] = match;
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  const h = Number(hour);
  const mi = Number(minute);
  const s = Number(second);
  if (y < 1970 || mo < 1 || mo > 12 || h > 23 || mi > 59 || s > 59) {
    return null;
  }
  const maxDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  if (d < 1 || d > maxDay) return null;
  const milliseconds = Date.UTC(y, mo - 1, d, h, mi, s);
  const roundTrip = new Date(milliseconds);
  if (
    roundTrip.getUTCFullYear() !== y ||
    roundTrip.getUTCMonth() !== mo - 1 ||
    roundTrip.getUTCDate() !== d ||
    roundTrip.getUTCHours() !== h ||
    roundTrip.getUTCMinutes() !== mi ||
    roundTrip.getUTCSeconds() !== s
  ) {
    return null;
  }
  return BigInt(milliseconds) * 1_000_000n + BigInt(fraction);
};

const lengthDelimitedSha256 = (
  domain: string,
  canonicalJson: string,
): string => {
  const bytes = Buffer.from(canonicalJson, "utf8");
  return createHash("sha256")
    .update(domain, "utf8")
    .update(u64le(bytes.length))
    .update(bytes)
    .digest("hex");
};

const rawSha256 = (canonicalJson: string): string =>
  createHash("sha256").update(canonicalJson, "utf8").digest("hex");

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_EVIDENCE_EXACT_KEYS =
  Object.freeze([
    "attemptOrdinal",
    "createdMonotonicRawNanoseconds",
    "createdWallUtc",
    "executionFreshnessObservations",
    "runIdentity",
    "staticInputs",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_UNSIGNED_EXACT_KEYS =
  Object.freeze([
    "artifactId",
    "authenticatedObservationContext",
    "authorityFalse",
    "authorityLocks",
    "candidateId",
    "claimLocks",
    "contractVersion",
    "executionFreshnessInventorySha256",
    "observationAuthentication",
    "observedAt",
    "path",
    "phase",
    "prePresealStaticClosureSha256",
    "prePresealStaticInputAggregateSha256",
    "scientificPersistenceReceiptSha256",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_EXACT_KEYS =
  Object.freeze([
    "artifactId",
    "authenticatedObservationContext",
    "authorityFalse",
    "authorityLocks",
    "candidateId",
    "claimLocks",
    "contractVersion",
    "executionFreshnessInventorySha256",
    "observationAuthentication",
    "observedAt",
    "path",
    "phase",
    "prePresealStaticClosureSha256",
    "prePresealStaticInputAggregateSha256",
    "receiptSha256",
    "scientificPersistenceReceiptSha256",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_UNSIGNED_EXACT_KEYS =
  Object.freeze([
    "artifactId",
    "authenticatedObservationContext",
    "authorityFalse",
    "authorityLocks",
    "candidateId",
    "claimLocks",
    "contractVersion",
    "observationAuthentication",
    "observedAt",
    "outputRootAbsenceInventorySha256",
    "outputRootPlanSha256",
    "path",
    "phase",
    "prePresealStaticClosureSha256",
    "scientificPersistenceReceiptSha256",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_EXACT_KEYS =
  Object.freeze([
    "artifactId",
    "authenticatedObservationContext",
    "authorityFalse",
    "authorityLocks",
    "candidateId",
    "claimLocks",
    "contractVersion",
    "observationAuthentication",
    "observedAt",
    "outputRootAbsenceInventorySha256",
    "outputRootPlanSha256",
    "path",
    "phase",
    "prePresealStaticClosureSha256",
    "receiptSha256",
    "scientificPersistenceReceiptSha256",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_EXACT_KEYS =
  Object.freeze([
    "artifactId",
    "attemptOrdinal",
    "authorityFalse",
    "candidateId",
    "claimLocks",
    "createdMonotonicRawNanoseconds",
    "createdWallUtc",
    "diagnosticPresealSha256",
    "executionFreshnessInventorySha256",
    "executionFreshnessReceiptBinding",
    "expectedRuntimeClosureSha256",
    "outputRootAbsenceInventorySha256",
    "outputRootAbsenceReceiptBinding",
    "outputRootPlanSha256",
    "phase",
    "prePresealStaticClosureSha256",
    "prePresealStaticInputAggregateSha256",
    "preexecutionSkeletonBinding",
    "schemaVersion",
    "scientificPersistenceReceiptBinding",
    "scientificPresealBinding",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_EXECUTION_PRESEAL_BINDING_EXACT_KEYS =
  Object.freeze([
    "artifactId",
    "candidateId",
    "createdMonotonicRawNanoseconds",
    "createdWallUtc",
    "diagnosticPresealSha256",
    "mediaType",
    "path",
    "prePresealStaticClosureSha256",
    "rawSha256",
    "schemaVersion",
    "sizeBytes",
    "wireSha256",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_UNSIGNED_EXACT_KEYS =
  Object.freeze([
    "artifactId",
    "authenticatedObservationContext",
    "authorityFalse",
    "authorityLocks",
    "candidateId",
    "claimLocks",
    "contractVersion",
    "executionPresealBinding",
    "observationAuthentication",
    "observedAt",
    "path",
    "persistedAt",
    "persistenceKind",
    "phase",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS =
  Object.freeze([
    "artifactId",
    "authenticatedObservationContext",
    "authorityFalse",
    "authorityLocks",
    "candidateId",
    "claimLocks",
    "contractVersion",
    "executionPresealBinding",
    "observationAuthentication",
    "observedAt",
    "path",
    "persistedAt",
    "persistenceKind",
    "phase",
    "receiptSha256",
  ] as const);

const executionFreshnessEvidenceSemanticViolations = (
  value: unknown,
): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_EVIDENCE_EXACT_KEYS,
    )
  ) {
    return ["spherical_v2_execution_freshness_evidence_fields_invalid"];
  }
  const evidence =
    value as unknown as Nhm2SphericalBosonStarV2ExecutionFreshnessEvidenceBundleV1;
  if (
    evidence.attemptOrdinal !== 1 ||
    !u64DecimalValid(evidence.createdMonotonicRawNanoseconds) ||
    parseUtcNanoseconds(evidence.createdWallUtc) === null
  ) {
    return ["spherical_v2_execution_freshness_evidence_identity_invalid"];
  }
  try {
    const entries = canonicalJsonFromValue(
      evidence.staticInputs as unknown as CanonicalValue,
    );
    const identity = canonicalJsonFromValue(
      evidence.runIdentity as unknown as CanonicalValue,
    );
    const observations = canonicalJsonFromValue(
      evidence.executionFreshnessObservations as unknown as CanonicalValue,
    );
    computeNhm2SphericalBosonStarV2PrePresealStaticInputAggregateSha256(
      entries,
      identity,
    );
    computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256(
      observations,
      entries,
      identity,
    );
  } catch {
    return ["spherical_v2_execution_freshness_evidence_inventory_invalid"];
  }
  return [];
};

export const nhm2SphericalBosonStarV2ExecutionFreshnessEvidenceV1Violations = (
  value: unknown,
): readonly string[] => {
  let parsed: CanonicalValue;
  try {
    parsed = parseBoundedCanonicalJson(
      value,
      "spherical_v2_execution_freshness_evidence",
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumFreshnessEvidenceUtf8Bytes,
    );
  } catch (error) {
    return Object.freeze([
      error instanceof Error
        ? error.message
        : "spherical_v2_execution_freshness_evidence_surface_invalid",
    ]);
  }
  try {
    return Object.freeze(executionFreshnessEvidenceSemanticViolations(parsed));
  } catch {
    return Object.freeze([
      "spherical_v2_execution_freshness_evidence_validation_failed",
    ]);
  }
};

const commonClaimedReceiptBoundaryValid = (value: {
  readonly authenticatedObservationContext: unknown;
  readonly authorityFalse: unknown;
  readonly authorityLocks: unknown;
  readonly candidateId: unknown;
  readonly claimLocks: unknown;
  readonly observationAuthentication: unknown;
  readonly observedAt: unknown;
  readonly path: unknown;
}): boolean =>
  value.authenticatedObservationContext === null &&
  value.authorityFalse === true &&
  sameCanonical(
    value.authorityLocks,
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS,
  ) &&
  value.candidateId ===
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId &&
  sameCanonical(
    value.claimLocks,
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS,
  ) &&
  value.observationAuthentication ===
    "not_established_by_plain_canonical_json" &&
  parseUtcNanoseconds(value.observedAt) !== null &&
  repairedAbsolutePath(value.path);

const executionFreshnessReceiptUnsignedSemanticViolations = (
  value: unknown,
): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_UNSIGNED_EXACT_KEYS,
    )
  ) {
    return ["spherical_v2_execution_freshness_receipt_unsigned_fields_invalid"];
  }
  const receipt =
    value as unknown as Nhm2SphericalBosonStarV2ExecutionFreshnessReceiptUnsignedV1;
  if (
    receipt.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_ARTIFACT_ID ||
    receipt.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_CONTRACT_VERSION ||
    receipt.phase !==
      "caller_claimed_execution_freshness_observation_receipt_integrity_only" ||
    !commonClaimedReceiptBoundaryValid(receipt) ||
    !nonzeroSha256(receipt.executionFreshnessInventorySha256) ||
    !nonzeroSha256(receipt.prePresealStaticClosureSha256) ||
    !nonzeroSha256(receipt.prePresealStaticInputAggregateSha256) ||
    !nonzeroSha256(receipt.scientificPersistenceReceiptSha256)
  ) {
    return ["spherical_v2_execution_freshness_receipt_identity_invalid"];
  }
  return [];
};

export const computeNhm2SphericalBosonStarV2ExecutionFreshnessReceiptSha256 = (
  unsignedReceiptCanonicalJson: unknown,
): string => {
  const parsed = parseBoundedCanonicalJson(
    unsignedReceiptCanonicalJson,
    "spherical_v2_execution_freshness_receipt_unsigned",
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumReceiptUtf8Bytes,
  );
  const violations =
    executionFreshnessReceiptUnsignedSemanticViolations(parsed);
  if (violations.length !== 0) throw new TypeError(violations[0]);
  return lengthDelimitedSha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_SHA256_DOMAIN,
    unsignedReceiptCanonicalJson as string,
  );
};

const executionFreshnessReceiptSemanticViolations = (
  value: unknown,
): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_EXACT_KEYS,
    )
  ) {
    return ["spherical_v2_execution_freshness_receipt_fields_invalid"];
  }
  const receipt =
    value as unknown as Nhm2SphericalBosonStarV2ExecutionFreshnessReceiptV1;
  const { receiptSha256, ...unsigned } = receipt;
  const violations =
    executionFreshnessReceiptUnsignedSemanticViolations(unsigned);
  if (violations.length !== 0) return violations;
  if (!nonzeroSha256(receiptSha256)) {
    return ["spherical_v2_execution_freshness_receipt_sha256_invalid"];
  }
  const expected =
    computeNhm2SphericalBosonStarV2ExecutionFreshnessReceiptSha256(
      canonicalJsonFromValue(unsigned as unknown as CanonicalValue),
    );
  return receiptSha256 === expected
    ? []
    : ["spherical_v2_execution_freshness_receipt_sha256_mismatch"];
};

export const nhm2SphericalBosonStarV2ExecutionFreshnessReceiptV1Violations = (
  value: unknown,
): readonly string[] => {
  try {
    const parsed = parseBoundedCanonicalJson(
      value,
      "spherical_v2_execution_freshness_receipt",
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumReceiptUtf8Bytes,
    );
    return Object.freeze(executionFreshnessReceiptSemanticViolations(parsed));
  } catch (error) {
    return Object.freeze([
      error instanceof Error
        ? error.message
        : "spherical_v2_execution_freshness_receipt_validation_failed",
    ]);
  }
};

const outputRootAbsenceReceiptUnsignedSemanticViolations = (
  value: unknown,
): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_UNSIGNED_EXACT_KEYS,
    )
  ) {
    return ["spherical_v2_output_root_absence_receipt_unsigned_fields_invalid"];
  }
  const receipt =
    value as unknown as Nhm2SphericalBosonStarV2OutputRootAbsenceReceiptUnsignedV1;
  if (
    receipt.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_ARTIFACT_ID ||
    receipt.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_CONTRACT_VERSION ||
    receipt.phase !==
      "caller_claimed_output_root_absence_observation_receipt_integrity_only" ||
    !commonClaimedReceiptBoundaryValid(receipt) ||
    !nonzeroSha256(receipt.outputRootAbsenceInventorySha256) ||
    !nonzeroSha256(receipt.outputRootPlanSha256) ||
    !nonzeroSha256(receipt.prePresealStaticClosureSha256) ||
    !nonzeroSha256(receipt.scientificPersistenceReceiptSha256)
  ) {
    return ["spherical_v2_output_root_absence_receipt_identity_invalid"];
  }
  return [];
};

export const computeNhm2SphericalBosonStarV2OutputRootAbsenceReceiptSha256 = (
  unsignedReceiptCanonicalJson: unknown,
): string => {
  const parsed = parseBoundedCanonicalJson(
    unsignedReceiptCanonicalJson,
    "spherical_v2_output_root_absence_receipt_unsigned",
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumReceiptUtf8Bytes,
  );
  const violations = outputRootAbsenceReceiptUnsignedSemanticViolations(parsed);
  if (violations.length !== 0) throw new TypeError(violations[0]);
  return lengthDelimitedSha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_SHA256_DOMAIN,
    unsignedReceiptCanonicalJson as string,
  );
};

const outputRootAbsenceReceiptSemanticViolations = (
  value: unknown,
): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_EXACT_KEYS,
    )
  ) {
    return ["spherical_v2_output_root_absence_receipt_fields_invalid"];
  }
  const receipt =
    value as unknown as Nhm2SphericalBosonStarV2OutputRootAbsenceReceiptV1;
  const { receiptSha256, ...unsigned } = receipt;
  const violations =
    outputRootAbsenceReceiptUnsignedSemanticViolations(unsigned);
  if (violations.length !== 0) return violations;
  if (!nonzeroSha256(receiptSha256)) {
    return ["spherical_v2_output_root_absence_receipt_sha256_invalid"];
  }
  const expected =
    computeNhm2SphericalBosonStarV2OutputRootAbsenceReceiptSha256(
      canonicalJsonFromValue(unsigned as unknown as CanonicalValue),
    );
  return receiptSha256 === expected
    ? []
    : ["spherical_v2_output_root_absence_receipt_sha256_mismatch"];
};

export const nhm2SphericalBosonStarV2OutputRootAbsenceReceiptV1Violations = (
  value: unknown,
): readonly string[] => {
  try {
    const parsed = parseBoundedCanonicalJson(
      value,
      "spherical_v2_output_root_absence_receipt",
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumReceiptUtf8Bytes,
    );
    return Object.freeze(outputRootAbsenceReceiptSemanticViolations(parsed));
  } catch (error) {
    return Object.freeze([
      error instanceof Error
        ? error.message
        : "spherical_v2_output_root_absence_receipt_validation_failed",
    ]);
  }
};

const requireFreshnessReceipt = (
  canonicalJson: unknown,
): Nhm2SphericalBosonStarV2ExecutionFreshnessReceiptV1 => {
  const violations =
    nhm2SphericalBosonStarV2ExecutionFreshnessReceiptV1Violations(
      canonicalJson,
    );
  if (violations.length !== 0) throw new TypeError(violations[0]);
  return parseBoundedCanonicalJson(
    canonicalJson,
    "spherical_v2_execution_freshness_receipt",
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumReceiptUtf8Bytes,
  ) as unknown as Nhm2SphericalBosonStarV2ExecutionFreshnessReceiptV1;
};

const requireAbsenceReceipt = (
  canonicalJson: unknown,
): Nhm2SphericalBosonStarV2OutputRootAbsenceReceiptV1 => {
  const violations =
    nhm2SphericalBosonStarV2OutputRootAbsenceReceiptV1Violations(canonicalJson);
  if (violations.length !== 0) throw new TypeError(violations[0]);
  return parseBoundedCanonicalJson(
    canonicalJson,
    "spherical_v2_output_root_absence_receipt",
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumReceiptUtf8Bytes,
  ) as unknown as Nhm2SphericalBosonStarV2OutputRootAbsenceReceiptV1;
};

const projectFreshnessReceiptBinding = (
  canonicalJson: string,
): Nhm2SphericalV2DiagnosticExecutionFreshnessReceiptBindingV2 => {
  const receipt = requireFreshnessReceipt(canonicalJson);
  return deepFreeze({
    artifactId: receipt.artifactId,
    contractVersion: receipt.contractVersion,
    executionFreshnessInventorySha256:
      receipt.executionFreshnessInventorySha256,
    mediaType: "application/json" as const,
    observedAt: receipt.observedAt,
    path: receipt.path,
    rawSha256: rawSha256(canonicalJson),
    receiptSha256: receipt.receiptSha256,
    sizeBytes: Buffer.byteLength(canonicalJson, "utf8"),
  });
};

const projectAbsenceReceiptBinding = (
  canonicalJson: string,
): Nhm2SphericalV2DiagnosticOutputRootAbsenceReceiptBindingV2 => {
  const receipt = requireAbsenceReceipt(canonicalJson);
  return deepFreeze({
    artifactId: receipt.artifactId,
    contractVersion: receipt.contractVersion,
    mediaType: "application/json" as const,
    observedAt: receipt.observedAt,
    outputRootAbsenceInventorySha256: receipt.outputRootAbsenceInventorySha256,
    path: receipt.path,
    rawSha256: rawSha256(canonicalJson),
    receiptSha256: receipt.receiptSha256,
    sizeBytes: Buffer.byteLength(canonicalJson, "utf8"),
  });
};

const diagnosticExecutionPresealUnsignedSha256 = (
  preseal: Nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2,
): string => {
  const { diagnosticPresealSha256: ignored, ...unsigned } = preseal;
  void ignored;
  return lengthDelimitedSha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_SHA256_DOMAIN,
    canonicalJsonFromValue(unsigned as unknown as CanonicalValue),
  );
};

const diagnosticExecutionPresealSemanticViolations = (
  value: unknown,
): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_EXACT_KEYS,
    )
  ) {
    return ["spherical_v2_diagnostic_execution_preseal_fields_invalid"];
  }
  const preseal =
    value as unknown as Nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2;
  if (
    preseal.artifactId !==
      "nhm2.spherical_boson_star_v2_diagnostic_preexecution_preseal" ||
    preseal.schemaVersion !==
      "nhm2_spherical_boson_star_v2_diagnostic_preexecution_preseal/v2" ||
    preseal.phase !== "execution_static_closure_after_scientific_preseal" ||
    preseal.attemptOrdinal !== 1 ||
    preseal.authorityFalse !== true ||
    preseal.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId ||
    !sameCanonical(
      preseal.claimLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CLAIM_LOCKS,
    ) ||
    !u64DecimalValid(preseal.createdMonotonicRawNanoseconds) ||
    parseUtcNanoseconds(preseal.createdWallUtc) === null ||
    ![
      preseal.diagnosticPresealSha256,
      preseal.executionFreshnessInventorySha256,
      preseal.expectedRuntimeClosureSha256,
      preseal.outputRootAbsenceInventorySha256,
      preseal.outputRootPlanSha256,
      preseal.prePresealStaticClosureSha256,
      preseal.prePresealStaticInputAggregateSha256,
    ].every(nonzeroSha256)
  ) {
    return ["spherical_v2_diagnostic_execution_preseal_identity_invalid"];
  }
  if (
    !legacyAbsolutePath(preseal.preexecutionSkeletonBinding?.path) ||
    !legacyAbsolutePath(preseal.scientificPresealBinding?.path) ||
    !legacyAbsolutePath(preseal.scientificPersistenceReceiptBinding?.path) ||
    !legacyAbsolutePath(preseal.executionFreshnessReceiptBinding?.path) ||
    !legacyAbsolutePath(preseal.outputRootAbsenceReceiptBinding?.path)
  ) {
    return ["legacy_preexecution_v2_path_grammar_incompatible"];
  }
  let expected: string;
  try {
    expected = diagnosticExecutionPresealUnsignedSha256(preseal);
  } catch {
    return ["spherical_v2_diagnostic_execution_preseal_unsigned_invalid"];
  }
  return preseal.diagnosticPresealSha256 === expected
    ? []
    : ["spherical_v2_diagnostic_execution_preseal_sha256_mismatch"];
};

export const nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2Violations = (
  value: unknown,
): readonly string[] => {
  try {
    const parsed = parseBoundedCanonicalJson(
      value,
      "spherical_v2_diagnostic_execution_preseal",
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumExecutionPresealUtf8Bytes,
    );
    return Object.freeze(diagnosticExecutionPresealSemanticViolations(parsed));
  } catch (error) {
    return Object.freeze([
      error instanceof Error
        ? error.message
        : "spherical_v2_diagnostic_execution_preseal_validation_failed",
    ]);
  }
};

const requireExecutionPreseal = (
  canonicalJson: unknown,
): Nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2 => {
  const violations =
    nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2Violations(
      canonicalJson,
    );
  if (violations.length !== 0) throw new TypeError(violations[0]);
  return parseBoundedCanonicalJson(
    canonicalJson,
    "spherical_v2_diagnostic_execution_preseal",
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumExecutionPresealUtf8Bytes,
  ) as unknown as Nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2;
};

export const computeNhm2SphericalBosonStarV2DiagnosticExecutionPresealByteBindingV2 =
  (
    executionPresealCanonicalJson: unknown,
  ): Nhm2SphericalBosonStarV2DiagnosticExecutionPresealByteBindingV2 => {
    const preseal = requireExecutionPreseal(executionPresealCanonicalJson);
    const canonicalText = executionPresealCanonicalJson as string;
    const bytes = Buffer.from(canonicalText, "utf8");
    return deepFreeze({
      artifactId: preseal.artifactId,
      candidateId: preseal.candidateId,
      createdMonotonicRawNanoseconds: preseal.createdMonotonicRawNanoseconds,
      createdWallUtc: preseal.createdWallUtc,
      diagnosticPresealSha256: preseal.diagnosticPresealSha256,
      mediaType: "application/json" as const,
      prePresealStaticClosureSha256: preseal.prePresealStaticClosureSha256,
      rawSha256: createHash("sha256").update(bytes).digest("hex"),
      schemaVersion: preseal.schemaVersion,
      sizeBytes: bytes.length,
      wireSha256: lengthDelimitedSha256(
        NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_WIRE_SHA256_DOMAIN,
        canonicalText,
      ),
    });
  };

const executionPresealPersistenceReceiptBindingSemanticViolations = (
  value: unknown,
): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_EXECUTION_PRESEAL_BINDING_EXACT_KEYS,
    )
  ) {
    return [
      "spherical_v2_execution_preseal_persistence_receipt_binding_fields_invalid",
    ];
  }
  const binding =
    value as unknown as Nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptExecutionPresealBindingV1;
  if (
    binding.artifactId !==
      "nhm2.spherical_boson_star_v2_diagnostic_preexecution_preseal" ||
    binding.schemaVersion !==
      "nhm2_spherical_boson_star_v2_diagnostic_preexecution_preseal/v2" ||
    binding.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId ||
    binding.mediaType !== "application/json" ||
    !repairedAbsolutePath(binding.path) ||
    !u64DecimalValid(binding.createdMonotonicRawNanoseconds) ||
    parseUtcNanoseconds(binding.createdWallUtc) === null ||
    !nonzeroSha256(binding.diagnosticPresealSha256) ||
    !nonzeroSha256(binding.prePresealStaticClosureSha256) ||
    !nonzeroSha256(binding.rawSha256) ||
    !nonzeroSha256(binding.wireSha256) ||
    binding.rawSha256 === binding.wireSha256 ||
    !Number.isSafeInteger(binding.sizeBytes) ||
    binding.sizeBytes <= 0
  ) {
    return [
      "spherical_v2_execution_preseal_persistence_receipt_binding_invalid",
    ];
  }
  return [];
};

const executionPresealPersistenceReceiptUnsignedSemanticViolations = (
  value: unknown,
): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_UNSIGNED_EXACT_KEYS,
    )
  ) {
    return [
      "spherical_v2_execution_preseal_persistence_receipt_unsigned_fields_invalid",
    ];
  }
  const receipt =
    value as unknown as Nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptUnsignedV1;
  const created = parseUtcNanoseconds(
    receipt.executionPresealBinding.createdWallUtc,
  );
  const persisted = parseUtcNanoseconds(receipt.persistedAt);
  const observed = parseUtcNanoseconds(receipt.observedAt);
  if (
    receipt.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID ||
    receipt.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION ||
    receipt.phase !==
      "external_execution_preseal_durable_readback_receipt_integrity_only" ||
    receipt.persistenceKind !== "external_durable_publication_readback" ||
    receipt.authenticatedObservationContext !== null ||
    receipt.authorityFalse !== true ||
    receipt.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId ||
    receipt.observationAuthentication !==
      "not_established_by_plain_canonical_json" ||
    !sameCanonical(
      receipt.authorityLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS,
    ) ||
    !sameCanonical(
      receipt.claimLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS,
    ) ||
    !repairedAbsolutePath(receipt.path) ||
    created === null ||
    persisted === null ||
    observed === null ||
    created >= persisted ||
    persisted > observed
  ) {
    return [
      "spherical_v2_execution_preseal_persistence_receipt_identity_or_chronology_invalid",
    ];
  }
  return executionPresealPersistenceReceiptBindingSemanticViolations(
    receipt.executionPresealBinding,
  );
};

export const computeNhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptSha256 =
  (unsignedReceiptCanonicalJson: unknown): string => {
    const parsed = parseBoundedCanonicalJson(
      unsignedReceiptCanonicalJson,
      "spherical_v2_execution_preseal_persistence_receipt_unsigned",
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumReceiptUtf8Bytes,
    );
    const violations =
      executionPresealPersistenceReceiptUnsignedSemanticViolations(parsed);
    if (violations.length !== 0) throw new TypeError(violations[0]);
    return lengthDelimitedSha256(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_SHA256_DOMAIN,
      unsignedReceiptCanonicalJson as string,
    );
  };

const executionPresealPersistenceReceiptSemanticViolations = (
  value: unknown,
): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS,
    )
  ) {
    return [
      "spherical_v2_execution_preseal_persistence_receipt_fields_invalid",
    ];
  }
  const receipt =
    value as unknown as Nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptV1;
  const { receiptSha256, ...unsigned } = receipt;
  const violations =
    executionPresealPersistenceReceiptUnsignedSemanticViolations(unsigned);
  if (violations.length !== 0) return violations;
  if (!nonzeroSha256(receiptSha256)) {
    return [
      "spherical_v2_execution_preseal_persistence_receipt_sha256_invalid",
    ];
  }
  const expected =
    computeNhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptSha256(
      canonicalJsonFromValue(unsigned as unknown as CanonicalValue),
    );
  return receiptSha256 === expected
    ? []
    : ["spherical_v2_execution_preseal_persistence_receipt_sha256_mismatch"];
};

export const nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptV1Violations =
  (value: unknown): readonly string[] => {
    try {
      const parsed = parseBoundedCanonicalJson(
        value,
        "spherical_v2_execution_preseal_persistence_receipt",
        NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumReceiptUtf8Bytes,
      );
      return Object.freeze(
        executionPresealPersistenceReceiptSemanticViolations(parsed),
      );
    } catch (error) {
      return Object.freeze([
        error instanceof Error
          ? error.message
          : "spherical_v2_execution_preseal_persistence_receipt_validation_failed",
      ]);
    }
  };

const requireExecutionPresealPersistenceReceipt = (
  canonicalJson: unknown,
): Nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptV1 => {
  const violations =
    nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptV1Violations(
      canonicalJson,
    );
  if (violations.length !== 0) throw new TypeError(violations[0]);
  return parseBoundedCanonicalJson(
    canonicalJson,
    "spherical_v2_execution_preseal_persistence_receipt",
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumReceiptUtf8Bytes,
  ) as unknown as Nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptV1;
};

export const computeNhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptByteBinding =
  (
    canonicalJson: unknown,
  ): Nhm2SphericalBosonStarV2ExecutionPresealPersistenceReceiptByteBindingV1 => {
    const receipt = requireExecutionPresealPersistenceReceipt(canonicalJson);
    const canonicalText = canonicalJson as string;
    return deepFreeze({
      artifactId: receipt.artifactId,
      contractVersion: receipt.contractVersion,
      mediaType: "application/json" as const,
      observedAt: receipt.observedAt,
      rawSha256: rawSha256(canonicalText),
      receiptSha256: receipt.receiptSha256,
      sizeBytes: Buffer.byteLength(canonicalText, "utf8"),
    });
  };

type DerivedExecutionPresealSources = Readonly<{
  canonicalExecutionPreseal: string;
  prePresealStaticClosureSha256: string;
}>;

const deriveExecutionPresealFromSources = (
  prePresealStaticClosureCanonicalJson: string,
  skeletonCanonicalJson: string,
  skeletonPersistenceReceiptCanonicalJson: string,
  scientificPresealCanonicalJson: string,
  scientificPresealPersistenceReceiptCanonicalJson: string,
  freshnessEvidenceCanonicalJson: string,
  freshnessReceiptCanonicalJson: string,
  outputRootAbsenceInventoryCanonicalJson: string,
  outputRootAbsenceReceiptCanonicalJson: string,
): DerivedExecutionPresealSources => {
  const pair1Violations =
    nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations(
      prePresealStaticClosureCanonicalJson,
      skeletonCanonicalJson,
      skeletonPersistenceReceiptCanonicalJson,
      scientificPresealCanonicalJson,
      scientificPresealPersistenceReceiptCanonicalJson,
    );
  if (pair1Violations.length !== 0) {
    throw new TypeError(
      `spherical_v2_execution_preseal_pair1_invalid:${pair1Violations[0]}`,
    );
  }
  const closure = parseBoundedCanonicalJson(
    prePresealStaticClosureCanonicalJson,
    "spherical_v2_execution_preseal_A",
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumPrePresealStaticClosureUtf8Bytes,
  ) as unknown as Nhm2SphericalV2PrePresealStaticClosureV2;
  const freshnessEvidenceValue = parseBoundedCanonicalJson(
    freshnessEvidenceCanonicalJson,
    "spherical_v2_execution_preseal_F",
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumFreshnessEvidenceUtf8Bytes,
  );
  const freshnessEvidenceViolations =
    executionFreshnessEvidenceSemanticViolations(freshnessEvidenceValue);
  if (freshnessEvidenceViolations.length !== 0) {
    throw new TypeError(freshnessEvidenceViolations[0]);
  }
  const freshnessEvidence =
    freshnessEvidenceValue as unknown as Nhm2SphericalBosonStarV2ExecutionFreshnessEvidenceBundleV1;
  const absenceInventory = parseBoundedCanonicalJson(
    outputRootAbsenceInventoryCanonicalJson,
    "spherical_v2_execution_preseal_O",
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumAbsenceInventoryUtf8Bytes,
  ) as unknown as Nhm2SphericalV2OutputRootAbsenceInventoryV2;
  const freshnessReceipt = requireFreshnessReceipt(
    freshnessReceiptCanonicalJson,
  );
  const absenceReceipt = requireAbsenceReceipt(
    outputRootAbsenceReceiptCanonicalJson,
  );
  const scientificReceipt = parseBoundedCanonicalJson(
    scientificPresealPersistenceReceiptCanonicalJson,
    "spherical_v2_execution_preseal_PR",
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS.maximumReceiptUtf8Bytes,
  ) as unknown as Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1;
  const prePresealStaticClosureSha256 =
    computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256(
      prePresealStaticClosureCanonicalJson,
    );
  const staticInputsCanonicalJson = canonicalJsonFromValue(
    freshnessEvidence.staticInputs as unknown as CanonicalValue,
  );
  const runIdentityCanonicalJson = canonicalJsonFromValue(
    freshnessEvidence.runIdentity as unknown as CanonicalValue,
  );
  const observationsCanonicalJson = canonicalJsonFromValue(
    freshnessEvidence.executionFreshnessObservations as unknown as CanonicalValue,
  );
  const baseAggregate =
    computeNhm2SphericalBosonStarV2PrePresealStaticInputAggregateSha256(
      staticInputsCanonicalJson,
      runIdentityCanonicalJson,
    );
  const freshnessDigest =
    computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256(
      observationsCanonicalJson,
      staticInputsCanonicalJson,
      runIdentityCanonicalJson,
    );
  const outputRootPlanCanonicalJson = canonicalJsonFromValue(
    closure.outputRootPlan as unknown as CanonicalValue,
  );
  let absenceDigest: string;
  try {
    absenceDigest =
      computeNhm2SphericalBosonStarV2OutputRootAbsenceInventorySha256(
        outputRootAbsenceInventoryCanonicalJson,
        outputRootPlanCanonicalJson,
      );
  } catch {
    throw new TypeError(
      "spherical_v2_execution_preseal_output_root_absence_inventory_invalid",
    );
  }
  if (
    baseAggregate !== closure.prePresealStaticInputAggregateSha256 ||
    freshnessReceipt.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId ||
    freshnessReceipt.prePresealStaticClosureSha256 !==
      prePresealStaticClosureSha256 ||
    freshnessReceipt.prePresealStaticInputAggregateSha256 !== baseAggregate ||
    freshnessReceipt.scientificPersistenceReceiptSha256 !==
      scientificReceipt.receiptSha256 ||
    freshnessReceipt.executionFreshnessInventorySha256 !== freshnessDigest ||
    absenceReceipt.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId ||
    absenceReceipt.prePresealStaticClosureSha256 !==
      prePresealStaticClosureSha256 ||
    absenceReceipt.scientificPersistenceReceiptSha256 !==
      scientificReceipt.receiptSha256 ||
    absenceReceipt.outputRootPlanSha256 !== closure.outputRootPlanSha256 ||
    absenceReceipt.outputRootAbsenceInventorySha256 !== absenceDigest
  ) {
    throw new TypeError(
      "spherical_v2_execution_preseal_F_FR_O_OR_cross_binding_invalid",
    );
  }
  const scientificObserved = parseUtcNanoseconds(
    scientificReceipt.persistenceObservedAt,
  )!;
  const freshnessWallTimes =
    freshnessEvidence.executionFreshnessObservations.map((entry) =>
      parseUtcNanoseconds(entry.observedAtWallUtc)!,
    );
  const absenceWallTimes = absenceInventory.map((entry) =>
    parseUtcNanoseconds(entry.observedAtWallUtc),
  );
  if (
    freshnessWallTimes.length === 0 ||
    absenceWallTimes.some((value) => value === null)
  ) {
    throw new TypeError(
      "spherical_v2_execution_preseal_observation_time_invalid",
    );
  }
  const latestFreshnessWall = freshnessWallTimes.reduce((latest, value) =>
    value > latest ? value : latest,
  );
  const latestAbsenceWall = (absenceWallTimes as bigint[]).reduce(
    (latest, value) => (value > latest ? value : latest),
  );
  const freshnessReceiptObserved = parseUtcNanoseconds(
    freshnessReceipt.observedAt,
  )!;
  const absenceReceiptObserved = parseUtcNanoseconds(
    absenceReceipt.observedAt,
  )!;
  const executionCreated = parseUtcNanoseconds(
    freshnessEvidence.createdWallUtc,
  )!;
  const executionCreatedMonotonic = BigInt(
    freshnessEvidence.createdMonotonicRawNanoseconds,
  );
  if (
    freshnessWallTimes.some((value) => value <= scientificObserved) ||
    (absenceWallTimes as bigint[]).some(
      (value) => value <= scientificObserved,
    ) ||
    latestFreshnessWall >= freshnessReceiptObserved ||
    freshnessReceiptObserved >= executionCreated ||
    latestAbsenceWall >= absenceReceiptObserved ||
    absenceReceiptObserved >= executionCreated ||
    freshnessEvidence.executionFreshnessObservations.some(
      (entry) =>
        BigInt(entry.observedAtMonotonicRawNanoseconds) >=
        executionCreatedMonotonic,
    ) ||
    absenceInventory.some(
      (entry) =>
        BigInt(entry.observedAtMonotonicRawNanoseconds) >=
        executionCreatedMonotonic,
    )
  ) {
    throw new TypeError(
      "spherical_v2_execution_preseal_strict_chronology_invalid",
    );
  }
  const persistedSkeleton =
    deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2(
      skeletonCanonicalJson,
      skeletonPersistenceReceiptCanonicalJson,
    );
  const scientificPair =
    deriveNhm2SphericalBosonStarV2DiagnosticScientificPresealPersistencePairV1(
      prePresealStaticClosureCanonicalJson,
      skeletonCanonicalJson,
      skeletonPersistenceReceiptCanonicalJson,
      scientificPresealCanonicalJson,
      scientificPresealPersistenceReceiptCanonicalJson,
    );
  if (
    ![
      persistedSkeleton.path,
      scientificPair.scientificPresealBinding.path,
      scientificPair.scientificPersistenceReceiptBinding.path,
      freshnessReceipt.path,
      absenceReceipt.path,
    ].every(legacyAbsolutePath)
  ) {
    throw new TypeError("legacy_preexecution_v2_path_grammar_incompatible");
  }
  const evidence = {
    attemptOrdinal: freshnessEvidence.attemptOrdinal,
    createdMonotonicRawNanoseconds:
      freshnessEvidence.createdMonotonicRawNanoseconds,
    createdWallUtc: freshnessEvidence.createdWallUtc,
    executionFreshnessObservations:
      freshnessEvidence.executionFreshnessObservations,
    executionFreshnessReceiptBinding: projectFreshnessReceiptBinding(
      freshnessReceiptCanonicalJson,
    ),
    outputRootAbsenceInventory: absenceInventory,
    outputRootAbsenceReceiptBinding: projectAbsenceReceiptBinding(
      outputRootAbsenceReceiptCanonicalJson,
    ),
    prePresealStaticClosure: closure,
    preexecutionSkeletonBinding: persistedSkeleton,
    runIdentity: freshnessEvidence.runIdentity,
    scientificPersistenceReceiptBinding:
      scientificPair.scientificPersistenceReceiptBinding,
    scientificPresealBinding: scientificPair.scientificPresealBinding,
    staticInputs: freshnessEvidence.staticInputs,
  };
  let derived: Readonly<Record<string, unknown>>;
  try {
    derived =
      deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2(
        canonicalJsonFromValue(evidence as unknown as CanonicalValue),
      );
  } catch (error) {
    throw new TypeError(
      `spherical_v2_execution_preseal_legacy_derivation_failed:${error instanceof Error ? error.message : "unknown"}`,
    );
  }
  if (
    !exactKeys(
      derived,
      NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_EXACT_KEYS,
    )
  ) {
    throw new TypeError("spherical_v2_execution_preseal_legacy_root_invalid");
  }
  const canonicalExecutionPreseal = canonicalJsonFromValue(
    derived as unknown as CanonicalValue,
  );
  const derivedViolations =
    diagnosticExecutionPresealSemanticViolations(derived);
  if (derivedViolations.length !== 0) {
    throw new TypeError(derivedViolations[0]);
  }
  return deepFreeze({
    canonicalExecutionPreseal,
    prePresealStaticClosureSha256,
  });
};

export const deriveNhm2SphericalBosonStarV2DiagnosticExecutionPresealV2CanonicalJson =
  (
    prePresealStaticClosureCanonicalJson: unknown,
    skeletonCanonicalJson: unknown,
    skeletonPersistenceReceiptCanonicalJson: unknown,
    scientificPresealCanonicalJson: unknown,
    scientificPresealPersistenceReceiptCanonicalJson: unknown,
    freshnessEvidenceCanonicalJson: unknown,
    freshnessReceiptCanonicalJson: unknown,
    outputRootAbsenceInventoryCanonicalJson: unknown,
    outputRootAbsenceReceiptCanonicalJson: unknown,
  ): string => {
    const values = requireBoundedAggregateCanonicalStrings([
      prePresealStaticClosureCanonicalJson,
      skeletonCanonicalJson,
      skeletonPersistenceReceiptCanonicalJson,
      scientificPresealCanonicalJson,
      scientificPresealPersistenceReceiptCanonicalJson,
      freshnessEvidenceCanonicalJson,
      freshnessReceiptCanonicalJson,
      outputRootAbsenceInventoryCanonicalJson,
      outputRootAbsenceReceiptCanonicalJson,
    ]);
    return deriveExecutionPresealFromSources(
      values[0]!,
      values[1]!,
      values[2]!,
      values[3]!,
      values[4]!,
      values[5]!,
      values[6]!,
      values[7]!,
      values[8]!,
    ).canonicalExecutionPreseal;
  };

export const nhm2SphericalBosonStarV2DiagnosticExecutionPresealPairViolations =
  (
    prePresealStaticClosureCanonicalJson: unknown,
    skeletonCanonicalJson: unknown,
    skeletonPersistenceReceiptCanonicalJson: unknown,
    scientificPresealCanonicalJson: unknown,
    scientificPresealPersistenceReceiptCanonicalJson: unknown,
    freshnessEvidenceCanonicalJson: unknown,
    freshnessReceiptCanonicalJson: unknown,
    outputRootAbsenceInventoryCanonicalJson: unknown,
    outputRootAbsenceReceiptCanonicalJson: unknown,
    executionPresealCanonicalJson: unknown,
  ): readonly string[] => {
    try {
      const values = requireBoundedAggregateCanonicalStrings([
        prePresealStaticClosureCanonicalJson,
        skeletonCanonicalJson,
        skeletonPersistenceReceiptCanonicalJson,
        scientificPresealCanonicalJson,
        scientificPresealPersistenceReceiptCanonicalJson,
        freshnessEvidenceCanonicalJson,
        freshnessReceiptCanonicalJson,
        outputRootAbsenceInventoryCanonicalJson,
        outputRootAbsenceReceiptCanonicalJson,
        executionPresealCanonicalJson,
      ]);
      const expected = deriveExecutionPresealFromSources(
        values[0]!,
        values[1]!,
        values[2]!,
        values[3]!,
        values[4]!,
        values[5]!,
        values[6]!,
        values[7]!,
        values[8]!,
      ).canonicalExecutionPreseal;
      const executionPresealViolations =
        nhm2SphericalBosonStarV2DiagnosticExecutionPresealV2Violations(
          values[9],
        );
      if (executionPresealViolations.length !== 0) {
        return executionPresealViolations;
      }
      return expected === values[9]
        ? Object.freeze([])
        : Object.freeze([
            "spherical_v2_execution_preseal_exact_derivation_mismatch",
          ]);
    } catch (error) {
      return Object.freeze([
        error instanceof Error
          ? error.message
          : "spherical_v2_execution_preseal_pair_validation_failed",
      ]);
    }
  };

export const nhm2SphericalBosonStarV2ExecutionPresealPersistencePairViolations =
  (
    prePresealStaticClosureCanonicalJson: unknown,
    skeletonCanonicalJson: unknown,
    skeletonPersistenceReceiptCanonicalJson: unknown,
    scientificPresealCanonicalJson: unknown,
    scientificPresealPersistenceReceiptCanonicalJson: unknown,
    freshnessEvidenceCanonicalJson: unknown,
    freshnessReceiptCanonicalJson: unknown,
    outputRootAbsenceInventoryCanonicalJson: unknown,
    outputRootAbsenceReceiptCanonicalJson: unknown,
    executionPresealCanonicalJson: unknown,
    executionPresealPersistenceReceiptCanonicalJson: unknown,
  ): readonly string[] => {
    const pairViolations =
      nhm2SphericalBosonStarV2DiagnosticExecutionPresealPairViolations(
        prePresealStaticClosureCanonicalJson,
        skeletonCanonicalJson,
        skeletonPersistenceReceiptCanonicalJson,
        scientificPresealCanonicalJson,
        scientificPresealPersistenceReceiptCanonicalJson,
        freshnessEvidenceCanonicalJson,
        freshnessReceiptCanonicalJson,
        outputRootAbsenceInventoryCanonicalJson,
        outputRootAbsenceReceiptCanonicalJson,
        executionPresealCanonicalJson,
      );
    if (pairViolations.length !== 0) return pairViolations;
    try {
      const values = requireBoundedAggregateCanonicalStrings([
        prePresealStaticClosureCanonicalJson,
        skeletonCanonicalJson,
        skeletonPersistenceReceiptCanonicalJson,
        scientificPresealCanonicalJson,
        scientificPresealPersistenceReceiptCanonicalJson,
        freshnessEvidenceCanonicalJson,
        freshnessReceiptCanonicalJson,
        outputRootAbsenceInventoryCanonicalJson,
        outputRootAbsenceReceiptCanonicalJson,
        executionPresealCanonicalJson,
        executionPresealPersistenceReceiptCanonicalJson,
      ]);
      const presealBytes =
        computeNhm2SphericalBosonStarV2DiagnosticExecutionPresealByteBindingV2(
          values[9],
        );
      const receipt = requireExecutionPresealPersistenceReceipt(values[10]);
      if (
        !sameCanonical(receipt.executionPresealBinding, {
          ...presealBytes,
          path: receipt.executionPresealBinding.path,
        })
      ) {
        return Object.freeze([
          "spherical_v2_execution_preseal_ER_byte_binding_invalid",
        ]);
      }
      return Object.freeze([]);
    } catch (error) {
      return Object.freeze([
        error instanceof Error
          ? error.message
          : "spherical_v2_execution_preseal_persistence_pair_validation_failed",
      ]);
    }
  };

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_VERSION,
  candidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId,
  phase:
    "stage_2_exact_A_S_SR_P_PR_F_FR_O_OR_E_ER_integrity_without_observation_launch_or_execution_authority",
  exactBindings: {
    preexecutionProfileV2:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    runArtifactWireV2:
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
    scientificPresealEnvelopeV1:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING,
    scientificPresealPersistenceReceiptV1:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING,
  },
  requiredDependencyPins:
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS,
  exactCanonicalBundleOrder: [
    "A_pre_preseal_static_closure",
    "S_preexecution_skeleton",
    "SR_skeleton_persistence_receipt",
    "P_scientific_preseal",
    "PR_scientific_preseal_persistence_receipt",
    "F_execution_freshness_evidence_bundle",
    "FR_execution_freshness_receipt",
    "O_output_root_absence_inventory",
    "OR_output_root_absence_receipt",
    "E_diagnostic_execution_preseal",
    "ER_execution_preseal_persistence_receipt",
  ],
  freshnessEvidenceSchema: {
    exactKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_EVIDENCE_EXACT_KEYS,
    rawStaticInputsIncluded: true,
    rawRunIdentityIncluded: true,
    rawTimedFreshnessObservationsIncluded: true,
    attemptAndExecutionPresealCreationTimesIncluded: true,
    wrapperIsPersistenceOrObserverReceipt: false,
  },
  freshnessReceiptSchema: {
    exactKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_EXACT_KEYS,
    unsignedExactKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_UNSIGNED_EXACT_KEYS,
    selfHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_RECEIPT_SHA256_DOMAIN,
    selfHashRecipe:
      "SHA256(domain_utf8||u64le(canonical_unsigned_FR_length)||canonical_unsigned_FR_bytes)",
    exactBindings: [
      "candidateId",
      "prePresealStaticClosureSha256",
      "prePresealStaticInputAggregateSha256",
      "scientificPersistenceReceiptSha256",
      "executionFreshnessInventorySha256",
      "observedAt",
    ],
    callerClaimedDiagnosticIntegrityOnly: true,
  },
  outputRootAbsenceReceiptSchema: {
    exactKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_EXACT_KEYS,
    unsignedExactKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_UNSIGNED_EXACT_KEYS,
    selfHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_RECEIPT_SHA256_DOMAIN,
    selfHashRecipe:
      "SHA256(domain_utf8||u64le(canonical_unsigned_OR_length)||canonical_unsigned_OR_bytes)",
    exactBindings: [
      "candidateId",
      "prePresealStaticClosureSha256",
      "scientificPersistenceReceiptSha256",
      "outputRootPlanSha256",
      "outputRootAbsenceInventorySha256",
      "observedAt",
    ],
    callerClaimedDiagnosticIntegrityOnly: true,
  },
  legacyExecutionPresealProjection: {
    existingDerivationApi:
      "deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2",
    exactLegacyEvidenceKeyCount: 13,
    exactExecutionPresealKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_EXACT_KEYS,
    exactExecutionPresealKeyCount: 21,
    artifactId: "nhm2.spherical_boson_star_v2_diagnostic_preexecution_preseal",
    schemaVersion:
      "nhm2_spherical_boson_star_v2_diagnostic_preexecution_preseal/v2",
    schemaVersionUsedInsteadOfContractVersion: true,
    exactCanonicalDerivedBytesRequired: true,
    pair1ScientificBindingsExplicitlyProjectedToLegacyShapes: true,
    fullRichReceiptsPassedDirectlyToLegacyDeriver: false,
    innerSelfHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_SHA256_DOMAIN,
  },
  externalExecutionPresealWireIdentity: {
    rawSha256Recipe: "SHA256(full_canonical_E_bytes)",
    wireSha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_WIRE_SHA256_DOMAIN,
    wireSha256Recipe:
      "SHA256(domain_utf8||u64le(full_canonical_E_length)||full_canonical_E_bytes)",
    rawWireAndSizeFieldsInsideEAllowed: false,
    executionPersistenceReceiptInsideEAllowed: false,
    selfBindingCycleAllowed: false,
  },
  executionPresealPersistenceReceiptSchema: {
    exactKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS,
    unsignedExactKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_UNSIGNED_EXACT_KEYS,
    executionPresealBindingExactKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_EXECUTION_PRESEAL_BINDING_EXACT_KEYS,
    selfHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_PERSISTENCE_RECEIPT_SHA256_DOMAIN,
    selfHashRecipe:
      "SHA256(domain_utf8||u64le(canonical_unsigned_ER_length)||canonical_unsigned_ER_bytes)",
    bindsExactERawWireSizeAndInnerSelfHash: true,
    ECreatedWallStrictlyBeforeERPersistedAt: true,
    ERPersistedAtLessThanOrEqualToObservedAt: true,
    integrityOnlyWithoutAuthenticatedDurabilityObservation: true,
  },
  chronology: {
    PRObservedStrictlyBeforeEveryFreshnessWallObservation: true,
    PRObservedStrictlyBeforeEveryAbsenceWallObservation: true,
    latestFreshnessWallStrictlyBeforeFRObservedAt: true,
    FRObservedAtStrictlyBeforeECreatedWallUtc: true,
    latestAbsenceWallStrictlyBeforeORObservedAt: true,
    ORObservedAtStrictlyBeforeECreatedWallUtc: true,
    everyFreshnessAndAbsenceMonotonicStrictlyBeforeECreatedMonotonic: true,
    wallTimeComparedToMonotonicTime: false,
    FROrOROrderingRequired: false,
  },
  pathCompatibility: {
    repairedExternalReceiptPaths:
      "absolute_nonempty_printable_ASCII_segments_without_dot_segments",
    legacyProjectedPaths:
      "NFC_absolute_visible_ASCII_no_space_no_backslash_no_trailing_slash_max_4096_UTF8",
    legacyProjectedPathSet: ["S", "P", "PR", "FR", "OR"],
    normalizationOrRewriteAllowed: false,
    typedRestriction: "legacy_preexecution_v2_path_grammar_incompatible",
    ERAndNestedEPathUseRepairedGrammarNotLegacySubset: true,
  },
  publicBoundary: {
    ingress: "primitive_prebounded_canonical_JSON_text_only",
    codeUnitCapBeforeUtf8Measurement: true,
    aggregateCodeUnitCapBeforeAggregateUtf8Measurement: true,
    utf8CapBeforeJsonParse: true,
    parsedTreeValidation: "iterative_and_bounded",
    exactCanonicalReserializationRequired: true,
    callerOwnedObjectsAccepted: false,
    issuerOrWeakSetOrMintExported: false,
    authenticatedObserverExported: false,
    launchOrExecutionFunctionExported: false,
  },
  resourceLimits: NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LIMITS,
  readiness: NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_READINESS,
  instances: NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_INSTANCES,
  blockers: NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_BLOCKERS,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS,
  claimLocks: NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS,
  lamps: NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LAMPS,
} as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT =
  deepFreeze(CONTRACT);
export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_CANONICAL_JSON =
  canonicalJsonFromValue(
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT as unknown as CanonicalValue,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_SHA256 =
  lengthDelimitedSha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_SHA256_DOMAIN,
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_CANONICAL_JSON,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_EXPECTED_SHA256 =
  "b9ef8ec056ce931e23aca660ab978f7861a2222d6658772e52e6cdca66a57987";
export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES = 13_524;

export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.sha256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS
      .preexecutionProfileV2.sha256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.canonicalSizeBytes !==
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS
      .preexecutionProfileV2.canonicalSizeBytes ||
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING.sha256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS
      .runArtifactWireV2.sha256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING.canonicalSizeBytes !==
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS
      .runArtifactWireV2.canonicalSizeBytes ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING.sha256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS
      .scientificPresealEnvelopeV1.sha256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING.canonicalSizeBytes !==
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS
      .scientificPresealEnvelopeV1.canonicalSizeBytes ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING.sha256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS
      .scientificPresealPersistenceReceiptV1.sha256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING.canonicalSizeBytes !==
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS
      .scientificPresealPersistenceReceiptV1.canonicalSizeBytes
) {
  throw new Error("spherical_v2_execution_preseal_wire_dependency_drift");
}

if (
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_AUTHORITY_LOCKS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CLAIM_LOCKS,
  ).some((value) => value !== false) ||
  Object.values(NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_LAMPS).some(
    (value) => value !== false,
  ) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_READINESS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_INSTANCES,
  ).some((value) => value !== null)
) {
  throw new Error("spherical_v2_execution_preseal_wire_false_null_invariant");
}

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `spherical_v2_execution_preseal_wire_literal_seal_drift:${NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_CONTRACT_CANONICAL_SIZE_BYTES}`,
  );
}
