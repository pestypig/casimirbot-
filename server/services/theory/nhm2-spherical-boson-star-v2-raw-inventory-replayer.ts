import { createHash } from "node:crypto";
import { constants as fsConstants, type BigIntStats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { isProxy } from "node:util/types";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
} from "../../../shared/contracts/nhm2-spherical-boson-star-v2-raw-replay-schema.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256,
} from "../../../shared/contracts/nhm2-spherical-boson-star-v2-run-artifact-wire.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256 } from "../../../shared/contracts/nhm2-spherical-boson-star-v2-smearing-weight-freeze.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_REPLAYER_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_raw_inventory_admission_receipt" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_REPLAYER_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_raw_inventory_replayer/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_INPUT_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_raw_inventory_input/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_HASH_CLOSURE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-raw-hash-closure/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_FILESYSTEM_OBSERVER_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_raw_filesystem_observation_receipt" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_FILESYSTEM_OBSERVER_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_raw_filesystem_observer/v1" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS = Object.freeze({
  exactFileCount: 68,
  exactNonnegativeRoleCount: 18,
  maximumPerFileBytes: 3_276_800,
  exactAggregateBytes: 6_693_376,
  maximumAggregateBytes: 6_693_376,
  float64Bytes: 8,
} as const);

const EXPECTED_SCHEMA_SHA256 =
  "96f5816f9d04b9d3b14a228ab821c3224974f47839ace6d7c7819f77c6a223ff" as const;
const EXPECTED_SCHEMA_CANONICAL_SIZE_BYTES = 163_818 as const;
const EXPECTED_CANDIDATE_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1" as const;
const EXPECTED_NONNEGATIVE_FILE_ORDINALS = Object.freeze([
  1, 3, 4, 8, 12, 16, 20, 25, 29, 33, 37, 41, 46, 50, 54, 58, 62, 67,
] as const);

const INPUT_KEYS = Object.freeze([
  "contractVersion",
  "candidateId",
  "schemaBinding",
  "files",
] as const);
const SCHEMA_BINDING_KEYS = Object.freeze([
  "artifactId",
  "contractVersion",
  "candidateId",
  "sha256Domain",
  "sha256",
  "canonicalSizeBytes",
  "mediaType",
] as const);
const FILE_KEYS = Object.freeze([
  "fileOrdinal",
  "path",
  "role",
  "shape",
  "sizeBytes",
  "sha256",
  "bytes",
] as const);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const TYPED_ARRAY_PROTOTYPE = Object.getPrototypeOf(Uint8Array.prototype);
const TYPED_ARRAY_BUFFER_GETTER = Object.getOwnPropertyDescriptor(
  TYPED_ARRAY_PROTOTYPE,
  "buffer",
)?.get;
const TYPED_ARRAY_BYTE_OFFSET_GETTER = Object.getOwnPropertyDescriptor(
  TYPED_ARRAY_PROTOTYPE,
  "byteOffset",
)?.get;
const TYPED_ARRAY_BYTE_LENGTH_GETTER = Object.getOwnPropertyDescriptor(
  TYPED_ARRAY_PROTOTYPE,
  "byteLength",
)?.get;
const ARRAY_BUFFER_BYTE_LENGTH_GETTER = Object.getOwnPropertyDescriptor(
  ArrayBuffer.prototype,
  "byteLength",
)?.get;
const ARRAY_BUFFER_RESIZABLE_GETTER = Object.getOwnPropertyDescriptor(
  ArrayBuffer.prototype,
  "resizable",
)?.get;
const UINT8_ARRAY_SET = Uint8Array.prototype.set;
type ExpectedDescriptor =
  (typeof NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS)[number];

export type Nhm2SphericalBosonStarV2RawInventoryFileObservationV1 = Readonly<{
  fileOrdinal: number;
  path: string;
  role: string;
  shape: readonly number[];
  sizeBytes: number;
  sha256: string;
  bytes: Uint8Array;
}>;

export type Nhm2SphericalBosonStarV2RawInventoryInputV1 = Readonly<{
  contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_INPUT_CONTRACT_VERSION;
  candidateId: typeof EXPECTED_CANDIDATE_ID;
  schemaBinding: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING;
  files: readonly Nhm2SphericalBosonStarV2RawInventoryFileObservationV1[];
}>;

export type Nhm2SphericalBosonStarV2RawInventoryAdmissionPhase =
  | "built_in_schema"
  | "structure"
  | "hash_or_size"
  | "nonfinite"
  | "negative_zero"
  | "role_sensitive_nonnegative"
  | "decode"
  | "internal";

export type Nhm2SphericalBosonStarV2RawInventoryBlockerCode =
  | "built_in_schema_binding_invalid"
  | "input_proxy_or_accessor_invalid"
  | "input_shape_invalid"
  | "schema_binding_mismatch"
  | "candidate_id_mismatch"
  | "inventory_count_invalid"
  | "inventory_descriptor_mismatch"
  | "file_bytes_view_invalid"
  | "file_bytes_backing_buffer_not_unique"
  | "file_size_cap_exceeded"
  | "aggregate_size_cap_exceeded"
  | "file_size_mismatch"
  | "file_sha256_invalid"
  | "file_sha256_mismatch"
  | "candidate_frozen_content_sha256_mismatch"
  | "decoded_nonfinite"
  | "decoded_negative_zero"
  | "decoded_role_sensitive_negative"
  | "decoded_inventory_unavailable"
  | "server_minted_input_capability_required"
  | "internal_admission_error";

export type Nhm2SphericalBosonStarV2RawInventoryBlocker = Readonly<{
  code: Nhm2SphericalBosonStarV2RawInventoryBlockerCode;
  phase: Nhm2SphericalBosonStarV2RawInventoryAdmissionPhase;
  disposition: "rejected" | "blocked";
  pointer: string | null;
  detail: string;
}>;

export type Nhm2SphericalBosonStarV2RawHashBinding = Readonly<{
  fileOrdinal: number;
  path: string;
  role: string;
  shape: readonly number[];
  sizeBytes: number;
  sha256: string;
}>;

export type Nhm2SphericalBosonStarV2RawInventoryReceiptV1 = Readonly<{
  artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_REPLAYER_ARTIFACT_ID;
  contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_REPLAYER_CONTRACT_VERSION;
  serverOwned: true;
  diagnosticOnly: true;
  calculationOnly: true;
  overallDisposition: "blocked";
  scientificDisposition: "not_evaluated";
  claimDisposition: "locked";
  byteAdmissionDisposition: "accepted" | "rejected" | "blocked";
  calculationReady: boolean;
  firstBlocker: Nhm2SphericalBosonStarV2RawInventoryBlockerCode | null;
  blockers: readonly Nhm2SphericalBosonStarV2RawInventoryBlocker[];
  inputBinding: Readonly<{
    candidateId: typeof EXPECTED_CANDIDATE_ID;
    rawReplaySchema: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING;
    fileCount: 68;
    aggregateBytes: 6_693_376;
    rawHashClosureSha256Domain: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RAW_HASH_CLOSURE_SHA256_DOMAIN;
    rawHashClosureSha256: string;
    rawHashBindings: readonly Nhm2SphericalBosonStarV2RawHashBinding[];
  }> | null;
  admissionTrace: Readonly<{
    exactPlainGraphCapturedWithoutByteClone: boolean;
    exact68DescriptorInventoryVerified: boolean;
    perFileAndAggregateCapsPreflightedBeforeByteCopies: boolean;
    builtInFullViewCopiesCreated: boolean;
    sha256CompletedForEveryCopyBeforeNumericScan: boolean;
    candidateFrozenContentHashesVerifiedBeforeNumericScan: boolean;
    allNonfiniteWordsScanned: boolean;
    allNegativeZeroWordsScanned: boolean;
    all18RoleSensitiveNonnegativeFilesScanned: boolean;
    float64LeDecodedOnlyAfterEveryAdmissionPhase: boolean;
    deterministicPhaseOrder: readonly [
      "hash_or_size",
      "nonfinite",
      "negative_zero",
      "role_sensitive_nonnegative",
      "decode",
    ];
  }>;
  authorityBoundary: Readonly<{
    callerObservationAuthority: false;
    filesystemReadPerformed: false;
    filesystemSecurityVerified: false;
    freshnessVerified: false;
    preexecutionSkeletonVerified: false;
    scientificPresealVerified: false;
    executionProvenanceVerified: false;
    staticScientificInputClosureVerified: false;
    scientificRecomputationPerformed: false;
    replayPerformed: false;
    independentAgreement: false;
    semiclassicalStressNoiseLamp: false;
    semiclassicalConstraintAlgebraLamp: false;
    diagnosticPass: false;
    theoryGraphPromotion: false;
    physicalViability: false;
    propulsion: false;
    transport: false;
    certificateAuthority: false;
  }>;
}>;

export type Nhm2SphericalBosonStarV2RawFilesystemBlockerCode =
  | "filesystem_platform_inadmissible"
  | "filesystem_root_not_absolute"
  | "filesystem_root_not_resolved"
  | "filesystem_root_forbidden"
  | "filesystem_root_unreadable"
  | "filesystem_root_not_directory"
  | "filesystem_root_symlink_or_reparse"
  | "filesystem_inventory_mismatch"
  | "filesystem_parent_unreadable"
  | "filesystem_parent_not_directory"
  | "filesystem_parent_symlink_or_reparse"
  | "filesystem_entry_unreadable"
  | "filesystem_entry_not_regular"
  | "filesystem_entry_symlink_or_reparse"
  | "filesystem_entry_hardlinked"
  | "filesystem_entry_realpath_mismatch"
  | "filesystem_entry_size_mismatch"
  | "filesystem_entry_open_failed"
  | "filesystem_entry_open_identity_mismatch"
  | "filesystem_entry_bounded_read_mismatch"
  | "filesystem_entry_changed_while_reading"
  | "filesystem_entry_changed_after_initial_read"
  | "filesystem_internal_admission_failed"
  | "postrun_manifest_instance_and_preexecution_evidence_missing";

export class Nhm2SphericalBosonStarV2RawFilesystemObserverError extends Error {
  constructor(
    readonly code: Exclude<
      Nhm2SphericalBosonStarV2RawFilesystemBlockerCode,
      "postrun_manifest_instance_and_preexecution_evidence_missing"
    >,
    message: string,
    readonly relativePath: string | null = null,
  ) {
    super(message);
    this.name = "Nhm2SphericalBosonStarV2RawFilesystemObserverError";
  }
}

export type Nhm2SphericalBosonStarV2RawFilesystemIdentityV1 = Readonly<{
  dev: string;
  ino: string;
  sizeBytes: string;
  mtimeNs: string;
  ctimeNs: string;
}>;

export type Nhm2SphericalBosonStarV2RawFilesystemObservationReceiptV1 =
  Readonly<{
    artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RAW_FILESYSTEM_OBSERVER_ARTIFACT_ID;
    contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RAW_FILESYSTEM_OBSERVER_CONTRACT_VERSION;
    stage: "stage_2_bounded_current_filesystem_observation";
    diagnosticOnly: true;
    overallDisposition: "blocked";
    observationDisposition: "accepted";
    readiness: false;
    rootRealPath: string;
    fileCount: 68;
    aggregateBytes: 6_693_376;
    files: readonly Readonly<{
      fileOrdinal: number;
      relativePath: string;
      role: string;
      sizeBytes: number;
      sha256: string;
      filesystemIdentity: Nhm2SphericalBosonStarV2RawFilesystemIdentityV1;
    }>[];
    contentAdmission: Readonly<{
      byteAdmissionDisposition: "accepted";
      calculationReady: false;
      privateAdmissionReceiptExposed: false;
      observedInputBinding: NonNullable<
        Nhm2SphericalBosonStarV2RawInventoryReceiptV1["inputBinding"]
      >;
    }>;
    blockers: readonly Readonly<{
      code: "postrun_manifest_instance_and_preexecution_evidence_missing";
      detail: string;
    }>[];
    manifestBoundary: Readonly<{
      namedArtifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_ARTIFACT_ID;
      namedContractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_CONTRACT_VERSION;
      concreteCanonicalWireValidatorPresent: true;
      concreteCanonicalWireByteLimitPresent: true;
      runArtifactWirePolicySha256: string;
      runArtifactWirePolicyCanonicalSizeBytes: number;
      manifestEntryBytesPresentInSchemaArtifact: false;
      producerHashFreshnessOrProvenanceAccepted: false;
    }>;
    observationTrace: Readonly<{
      serverProcessOpenedExactPredeclaredPaths: true;
      exactDirectoryInventoryObservedBeforeAndAfterReads: true;
      all68SizesPreflightedBeforeFileByteAllocation: true;
      exactAggregateCapPreflightedBeforeFileByteAllocation: true;
      everyEntryLstatRegularNonSymlinkSingleLink: true;
      everyEntryRealpathEqualToPredeclaredAbsolutePath: true;
      everyEntryOpenFstatMatchedLstat: true;
      everyEntryPostReadFstatMatchedPreReadFstat: true;
      everyEntryPostCloseLstatMatchedPreReadFstat: true;
      everyEntryReopenedAndByteReplayed: true;
      everyEntryReplayIdentityAndHashMatched: true;
      everyEntryFinalSweepIdentityAndHashMatchedOriginallyObservedBytes: true;
      boundedSweepsDoNotClaimAtomicFilesystemSnapshotOrStabilityThroughReturn: true;
      currentReadOnlyNoExecutionFreshnessInference: true;
      privateOneShotAdmissionCapabilityConsumed: true;
    }>;
    authorityBoundary: Readonly<{
      serverAuthorizedRoot: false;
      producerManifestAuthority: false;
      observedHashesAreManifestBindings: false;
      freshnessVerified: false;
      preexecutionSkeletonVerified: false;
      scientificPresealVerified: false;
      executionProvenanceVerified: false;
      postrunManifestVerified: false;
      replayPerformed: false;
      independentAgreement: false;
      semiclassicalStressNoiseLamp: false;
      semiclassicalConstraintAlgebraLamp: false;
      physicalViability: false;
      propulsion: false;
      transport: false;
      certificateAuthority: false;
    }>;
  }>;

type PreparedObservation = Readonly<{
  descriptor: ExpectedDescriptor;
  claimedSizeBytes: unknown;
  claimedSha256: unknown;
  bytes: Uint8Array;
  buffer: ArrayBuffer;
  intrinsicByteLength: number;
}>;

type MintedInputState =
  | Readonly<{ prepared: readonly PreparedObservation[]; blocker: null }>
  | Readonly<{
      prepared: null;
      blocker: Nhm2SphericalBosonStarV2RawInventoryBlocker;
    }>;

type AdmissionTrace =
  Nhm2SphericalBosonStarV2RawInventoryReceiptV1["admissionTrace"];
type DecodedInventory = Readonly<{
  valuesByOrdinal: readonly Float64Array[];
}>;

const DECODED_INVENTORIES = new WeakMap<object, DecodedInventory>();
const MINTED_INPUTS = new WeakMap<object, MintedInputState>();

type FilesystemIdentity = Readonly<{
  dev: bigint;
  ino: bigint;
  mode: bigint;
  size: bigint;
  mtimeNs: bigint;
  ctimeNs: bigint;
  nlink: bigint;
}>;

type FilesystemDirectoryGuard = Readonly<{
  absolutePath: string;
  realPath: string;
  identity: FilesystemIdentity;
}>;

type FilesystemObservedFile = Readonly<{
  descriptor: ExpectedDescriptor;
  relativePath: string;
  sha256: string;
  bytes: Uint8Array;
  identity: FilesystemIdentity;
}>;

const FILESYSTEM_OBSERVER_AUTHORITY_BOUNDARY = Object.freeze({
  serverAuthorizedRoot: false as const,
  producerManifestAuthority: false as const,
  observedHashesAreManifestBindings: false as const,
  freshnessVerified: false as const,
  preexecutionSkeletonVerified: false as const,
  scientificPresealVerified: false as const,
  executionProvenanceVerified: false as const,
  postrunManifestVerified: false as const,
  replayPerformed: false as const,
  independentAgreement: false as const,
  semiclassicalStressNoiseLamp: false as const,
  semiclassicalConstraintAlgebraLamp: false as const,
  physicalViability: false as const,
  propulsion: false as const,
  transport: false as const,
  certificateAuthority: false as const,
});

const AUTHORITY_BOUNDARY = Object.freeze({
  callerObservationAuthority: false as const,
  filesystemReadPerformed: false as const,
  filesystemSecurityVerified: false as const,
  freshnessVerified: false as const,
  preexecutionSkeletonVerified: false as const,
  scientificPresealVerified: false as const,
  executionProvenanceVerified: false as const,
  staticScientificInputClosureVerified: false as const,
  scientificRecomputationPerformed: false as const,
  replayPerformed: false as const,
  independentAgreement: false as const,
  semiclassicalStressNoiseLamp: false as const,
  semiclassicalConstraintAlgebraLamp: false as const,
  diagnosticPass: false as const,
  theoryGraphPromotion: false as const,
  physicalViability: false as const,
  propulsion: false as const,
  transport: false as const,
  certificateAuthority: false as const,
});

const DETERMINISTIC_PHASE_ORDER = Object.freeze([
  "hash_or_size",
  "nonfinite",
  "negative_zero",
  "role_sensitive_nonnegative",
  "decode",
] as const);

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

const exactArray = (
  left: readonly unknown[],
  right: readonly unknown[],
): boolean =>
  left.length === right.length &&
  left.every((entry, index) => entry === right[index]);

const builtInSchemaIsExact = (): boolean => {
  try {
    if (
      typeof TYPED_ARRAY_BUFFER_GETTER !== "function" ||
      typeof TYPED_ARRAY_BYTE_OFFSET_GETTER !== "function" ||
      typeof TYPED_ARRAY_BYTE_LENGTH_GETTER !== "function" ||
      typeof ARRAY_BUFFER_BYTE_LENGTH_GETTER !== "function" ||
      typeof UINT8_ARRAY_SET !== "function" ||
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256 !==
        EXPECTED_SCHEMA_SHA256 ||
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_SHA256 !==
        EXPECTED_SCHEMA_SHA256 ||
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_SIZE_BYTES !==
        EXPECTED_SCHEMA_CANONICAL_SIZE_BYTES ||
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES !==
        EXPECTED_SCHEMA_CANONICAL_SIZE_BYTES ||
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.candidateIdentity
        .candidateId !== EXPECTED_CANDIDATE_ID ||
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING.sha256 !==
        EXPECTED_SCHEMA_SHA256 ||
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING.canonicalSizeBytes !==
        EXPECTED_SCHEMA_CANONICAL_SIZE_BYTES
    ) {
      return false;
    }
    const descriptors =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS;
    if (descriptors.length !== 68) return false;
    const paths = new Set<string>();
    const roles = new Set<string>();
    let aggregateBytes = 0;
    for (let index = 0; index < descriptors.length; index += 1) {
      const descriptor = descriptors[index];
      const elementCount = descriptor.shape.reduce(
        (product, dimension) => product * dimension,
        1,
      );
      if (
        descriptor.fileOrdinal !== index ||
        !Number.isSafeInteger(elementCount) ||
        elementCount <= 0 ||
        elementCount * 8 !== descriptor.sizeBytes ||
        descriptor.sizeBytes >
          NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS.maximumPerFileBytes ||
        descriptor.dtype !== "float64" ||
        descriptor.binaryEncoding !== "raw_ieee754" ||
        descriptor.endianness !== "little" ||
        descriptor.storageOrder !== "row-major" ||
        descriptor.mediaType !== "application/octet-stream" ||
        descriptor.finiteValuesRequired !== true ||
        descriptor.negativeZeroAllowed !== false ||
        paths.has(descriptor.path) ||
        roles.has(descriptor.role)
      ) {
        return false;
      }
      paths.add(descriptor.path);
      roles.add(descriptor.role);
      aggregateBytes += descriptor.sizeBytes;
    }
    const schemaNonnegative =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.serverRecomputation
        .primitiveDecodePolicy.roleSensitiveNonnegativeAdmission
        .outputPhysicalFilesInOrdinalOrder;
    return (
      aggregateBytes === 6_693_376 &&
      schemaNonnegative.length === 18 &&
      exactArray(
        schemaNonnegative.map((entry) => entry.physicalFileOrdinal),
        EXPECTED_NONNEGATIVE_FILE_ORDINALS,
      ) &&
      schemaNonnegative.every((entry) => {
        const descriptor = descriptors[entry.physicalFileOrdinal];
        return descriptor.path === entry.path && descriptor.role === entry.role;
      })
    );
  } catch {
    return false;
  }
};

const BUILT_IN_SCHEMA_IS_EXACT = builtInSchemaIsExact();

const blocker = (
  code: Nhm2SphericalBosonStarV2RawInventoryBlockerCode,
  phase: Nhm2SphericalBosonStarV2RawInventoryAdmissionPhase,
  detail: string,
  pointer: string | null = null,
  disposition: "rejected" | "blocked" = "rejected",
): Nhm2SphericalBosonStarV2RawInventoryBlocker => ({
  code,
  phase,
  disposition,
  pointer,
  detail,
});

class InputCaptureError extends Error {
  constructor(
    readonly code: Nhm2SphericalBosonStarV2RawInventoryBlockerCode,
    readonly pointer: string,
    detail: string,
  ) {
    super(detail);
  }
}

const claimIdentity = (
  value: object,
  seen: Set<object>,
  pointer: string,
): void => {
  if (seen.has(value)) {
    throw new InputCaptureError(
      "input_shape_invalid",
      pointer,
      "Repeated object identity is not admitted.",
    );
  }
  seen.add(value);
};

/**
 * Capture only the fixed ABI fields. Unknown caller metadata is deliberately
 * not enumerated: ECMAScript's own-key APIs allocate the complete hostile key
 * set. The returned module capability is the exact canonical graph admitted by
 * this boundary; the caller object itself is never admitted.
 */
const captureCanonicalPlainRecord = (
  value: unknown,
  keys: readonly string[],
  seen: Set<object>,
  pointer: string,
): Record<string, unknown> => {
  if (value == null || typeof value !== "object" || isProxy(value)) {
    throw new InputCaptureError(
      "input_proxy_or_accessor_invalid",
      pointer,
      "Expected one non-proxy plain object.",
    );
  }
  claimIdentity(value, seen, pointer);
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new InputCaptureError(
      "input_shape_invalid",
      pointer,
      "Expected the exact built-in Object prototype.",
    );
  }
  const captured: Record<string, unknown> = {};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.get != null ||
      descriptor.set != null ||
      descriptor.enumerable !== true
    ) {
      throw new InputCaptureError(
        "input_proxy_or_accessor_invalid",
        `${pointer}/${key}`,
        "Every admitted field must be one enumerable own data property.",
      );
    }
    captured[key] = descriptor.value;
  }
  return captured;
};

const captureCanonicalDenseArray = (
  value: unknown,
  exactLength: number,
  seen: Set<object>,
  pointer: string,
): unknown[] => {
  if (value == null || typeof value !== "object" || isProxy(value)) {
    throw new InputCaptureError(
      "input_proxy_or_accessor_invalid",
      pointer,
      "Expected one non-proxy dense built-in Array.",
    );
  }
  claimIdentity(value, seen, pointer);
  if (
    !Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Array.prototype
  ) {
    throw new InputCaptureError(
      "input_shape_invalid",
      pointer,
      "Expected the exact built-in Array prototype.",
    );
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  if (
    lengthDescriptor == null ||
    !("value" in lengthDescriptor) ||
    lengthDescriptor.value !== exactLength
  ) {
    throw new InputCaptureError(
      "inventory_count_invalid",
      pointer,
      `Expected exactly ${exactLength} entries.`,
    );
  }
  const captured: unknown[] = [];
  for (let index = 0; index < exactLength; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.get != null ||
      descriptor.set != null ||
      descriptor.enumerable !== true
    ) {
      throw new InputCaptureError(
        "input_proxy_or_accessor_invalid",
        `${pointer}/${index}`,
        "Every array entry must be one enumerable own data property.",
      );
    }
    captured.push(descriptor.value);
  }
  return captured;
};

const captureExactShape = (
  value: unknown,
  expected: readonly number[],
  seen: Set<object>,
  pointer: string,
): readonly number[] => {
  const values = captureCanonicalDenseArray(
    value,
    expected.length,
    seen,
    pointer,
  );
  if (!exactArray(values, expected)) {
    throw new InputCaptureError(
      "inventory_descriptor_mismatch",
      pointer,
      "Shape does not exactly match the sealed descriptor.",
    );
  }
  return values as number[];
};

const intrinsicTypedArrayField = <T>(
  getter: ((this: unknown) => T) | undefined,
  value: object,
): T => {
  if (getter == null) throw new TypeError("intrinsic_getter_unavailable");
  return Reflect.apply(getter, value, []) as T;
};

const captureExactByteView = (
  value: unknown,
  seen: Set<object>,
  backingBuffers: Set<ArrayBuffer>,
  pointer: string,
): Readonly<{
  bytes: Uint8Array;
  buffer: ArrayBuffer;
  byteLength: number;
}> => {
  if (value == null || typeof value !== "object" || isProxy(value)) {
    throw new InputCaptureError(
      "file_bytes_view_invalid",
      pointer,
      "Bytes must be a non-proxy built-in Uint8Array.",
    );
  }
  claimIdentity(value, seen, pointer);
  if (Object.getPrototypeOf(value) !== Uint8Array.prototype) {
    throw new InputCaptureError(
      "file_bytes_view_invalid",
      pointer,
      "Uint8Array subclasses, Buffer, and foreign prototypes are rejected.",
    );
  }
  let buffer: ArrayBuffer;
  let byteOffset: number;
  let byteLength: number;
  let bufferByteLength: number;
  try {
    buffer = intrinsicTypedArrayField<ArrayBuffer>(
      TYPED_ARRAY_BUFFER_GETTER,
      value,
    );
    byteOffset = intrinsicTypedArrayField<number>(
      TYPED_ARRAY_BYTE_OFFSET_GETTER,
      value,
    );
    byteLength = intrinsicTypedArrayField<number>(
      TYPED_ARRAY_BYTE_LENGTH_GETTER,
      value,
    );
    if (
      isProxy(buffer) ||
      Object.getPrototypeOf(buffer) !== ArrayBuffer.prototype
    ) {
      throw new TypeError("backing_buffer_not_exact_array_buffer");
    }
    bufferByteLength = intrinsicTypedArrayField<number>(
      ARRAY_BUFFER_BYTE_LENGTH_GETTER,
      buffer,
    );
    if (
      ARRAY_BUFFER_RESIZABLE_GETTER != null &&
      intrinsicTypedArrayField<boolean>(ARRAY_BUFFER_RESIZABLE_GETTER, buffer)
    ) {
      throw new TypeError("resizable_array_buffer_not_admitted");
    }
  } catch {
    throw new InputCaptureError(
      "file_bytes_view_invalid",
      pointer,
      "Bytes must have one attached, fixed-length, exact built-in ArrayBuffer.",
    );
  }
  if (
    byteOffset !== 0 ||
    byteLength !== bufferByteLength ||
    !Number.isSafeInteger(byteLength) ||
    byteLength <= 0
  ) {
    throw new InputCaptureError(
      "file_bytes_view_invalid",
      pointer,
      "Partial, detached, empty, and non-full byte views are rejected.",
    );
  }
  if (backingBuffers.has(buffer)) {
    throw new InputCaptureError(
      "file_bytes_backing_buffer_not_unique",
      pointer,
      "Every physical file must use one distinct backing ArrayBuffer.",
    );
  }
  backingBuffers.add(buffer);
  seen.add(buffer);
  return { bytes: value as Uint8Array, buffer, byteLength };
};

const schemaBindingMatches = (captured: Record<string, unknown>): boolean =>
  SCHEMA_BINDING_KEYS.every(
    (key) =>
      captured[key] ===
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING[key],
  );

const captureInput = (callerInput: unknown): PreparedObservation[] => {
  const seen = new Set<object>();
  const backingBuffers = new Set<ArrayBuffer>();
  const input = captureCanonicalPlainRecord(callerInput, INPUT_KEYS, seen, "");
  if (
    input.contractVersion !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_INPUT_CONTRACT_VERSION
  ) {
    throw new InputCaptureError(
      "input_shape_invalid",
      "/contractVersion",
      "Input contract version does not match this boundary.",
    );
  }
  if (input.candidateId !== EXPECTED_CANDIDATE_ID) {
    throw new InputCaptureError(
      "candidate_id_mismatch",
      "/candidateId",
      "Candidate identity does not match the sealed spherical v2 candidate.",
    );
  }
  const schemaBinding = captureCanonicalPlainRecord(
    input.schemaBinding,
    SCHEMA_BINDING_KEYS,
    seen,
    "/schemaBinding",
  );
  if (!schemaBindingMatches(schemaBinding)) {
    throw new InputCaptureError(
      "schema_binding_mismatch",
      "/schemaBinding",
      "Raw replay schema binding does not exactly match the sealed schema.",
    );
  }
  const files = captureCanonicalDenseArray(
    input.files,
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS.exactFileCount,
    seen,
    "/files",
  );
  const prepared: PreparedObservation[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const pointer = `/files/${index}`;
    const file = captureCanonicalPlainRecord(
      files[index],
      FILE_KEYS,
      seen,
      pointer,
    );
    const expected =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS[index];
    if (
      file.fileOrdinal !== expected.fileOrdinal ||
      file.path !== expected.path ||
      file.role !== expected.role
    ) {
      throw new InputCaptureError(
        "inventory_descriptor_mismatch",
        pointer,
        "Ordinal, path, role, and physical-file order must exactly match the sealed 68-file inventory.",
      );
    }
    captureExactShape(file.shape, expected.shape, seen, `${pointer}/shape`);
    const byteView = captureExactByteView(
      file.bytes,
      seen,
      backingBuffers,
      `${pointer}/bytes`,
    );
    prepared.push({
      descriptor: expected,
      claimedSizeBytes: file.sizeBytes,
      claimedSha256: file.sha256,
      bytes: byteView.bytes,
      buffer: byteView.buffer,
      intrinsicByteLength: byteView.byteLength,
    });
  }
  return prepared;
};

const makeTrace = (values: Partial<AdmissionTrace>): AdmissionTrace => ({
  exactPlainGraphCapturedWithoutByteClone: false,
  exact68DescriptorInventoryVerified: false,
  perFileAndAggregateCapsPreflightedBeforeByteCopies: false,
  builtInFullViewCopiesCreated: false,
  sha256CompletedForEveryCopyBeforeNumericScan: false,
  candidateFrozenContentHashesVerifiedBeforeNumericScan: false,
  allNonfiniteWordsScanned: false,
  allNegativeZeroWordsScanned: false,
  all18RoleSensitiveNonnegativeFilesScanned: false,
  float64LeDecodedOnlyAfterEveryAdmissionPhase: false,
  deterministicPhaseOrder: DETERMINISTIC_PHASE_ORDER,
  ...values,
});

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object))
    return value;
  seen.add(value as object);
  for (const key of Reflect.ownKeys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value as object, key);
    if (descriptor != null && "value" in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }
  return Object.freeze(value);
};

const makeReceipt = (input: {
  blockers: readonly Nhm2SphericalBosonStarV2RawInventoryBlocker[];
  trace: AdmissionTrace;
  inputBinding: Nhm2SphericalBosonStarV2RawInventoryReceiptV1["inputBinding"];
}): Nhm2SphericalBosonStarV2RawInventoryReceiptV1 => {
  const hasRejected = input.blockers.some(
    (entry) => entry.disposition === "rejected",
  );
  return deepFreeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_REPLAYER_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_REPLAYER_CONTRACT_VERSION,
    serverOwned: true as const,
    diagnosticOnly: true as const,
    calculationOnly: true as const,
    overallDisposition: "blocked" as const,
    scientificDisposition: "not_evaluated" as const,
    claimDisposition: "locked" as const,
    byteAdmissionDisposition:
      input.blockers.length === 0
        ? ("accepted" as const)
        : hasRejected
          ? ("rejected" as const)
          : ("blocked" as const),
    calculationReady: input.blockers.length === 0,
    firstBlocker: input.blockers[0]?.code ?? null,
    blockers: [...input.blockers],
    inputBinding: input.inputBinding,
    admissionTrace: { ...input.trace },
    authorityBoundary: { ...AUTHORITY_BOUNDARY },
  });
};

const copyExactFullViews = (
  prepared: readonly PreparedObservation[],
): Uint8Array[] =>
  prepared.map((entry) => {
    const copy = new Uint8Array(entry.intrinsicByteLength);
    Reflect.apply(UINT8_ARRAY_SET, copy, [entry.bytes]);
    return copy;
  });

const wordCount = (bytes: Uint8Array): number => bytes.byteLength / 8;

const highWordAt = (bytes: Uint8Array, wordIndex: number): number => {
  const offset = wordIndex * 8 + 4;
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
};

const lowWordAt = (bytes: Uint8Array, wordIndex: number): number => {
  const offset = wordIndex * 8;
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
};

const scanAllNonfinite = (
  copies: readonly Uint8Array[],
): Nhm2SphericalBosonStarV2RawInventoryBlocker[] => {
  const blockers: Nhm2SphericalBosonStarV2RawInventoryBlocker[] = [];
  for (let ordinal = 0; ordinal < copies.length; ordinal += 1) {
    const bytes = copies[ordinal];
    let count = 0;
    let firstWord = -1;
    for (let word = 0; word < wordCount(bytes); word += 1) {
      if ((highWordAt(bytes, word) & 0x7ff0_0000) === 0x7ff0_0000) {
        if (firstWord < 0) firstWord = word;
        count += 1;
      }
    }
    if (count > 0) {
      blockers.push(
        blocker(
          "decoded_nonfinite",
          "nonfinite",
          `${count} IEEE-754 word(s) are NaN or infinity; the first is word ${firstWord}.`,
          `/files/${ordinal}/bytes/${firstWord}`,
        ),
      );
    }
  }
  return blockers;
};

const scanAllNegativeZero = (
  copies: readonly Uint8Array[],
): Nhm2SphericalBosonStarV2RawInventoryBlocker[] => {
  const blockers: Nhm2SphericalBosonStarV2RawInventoryBlocker[] = [];
  for (let ordinal = 0; ordinal < copies.length; ordinal += 1) {
    const bytes = copies[ordinal];
    let count = 0;
    let firstWord = -1;
    for (let word = 0; word < wordCount(bytes); word += 1) {
      if (
        lowWordAt(bytes, word) === 0 &&
        highWordAt(bytes, word) === 0x8000_0000
      ) {
        if (firstWord < 0) firstWord = word;
        count += 1;
      }
    }
    if (count > 0) {
      blockers.push(
        blocker(
          "decoded_negative_zero",
          "negative_zero",
          `${count} IEEE-754 word(s) are forbidden negative zero; the first is word ${firstWord}.`,
          `/files/${ordinal}/bytes/${firstWord}`,
        ),
      );
    }
  }
  return blockers;
};

const scanAllRoleSensitiveNonnegative = (
  copies: readonly Uint8Array[],
): Nhm2SphericalBosonStarV2RawInventoryBlocker[] => {
  const blockers: Nhm2SphericalBosonStarV2RawInventoryBlocker[] = [];
  for (const ordinal of EXPECTED_NONNEGATIVE_FILE_ORDINALS) {
    const bytes = copies[ordinal];
    let count = 0;
    let firstWord = -1;
    for (let word = 0; word < wordCount(bytes); word += 1) {
      if ((highWordAt(bytes, word) & 0x8000_0000) !== 0) {
        if (firstWord < 0) firstWord = word;
        count += 1;
      }
    }
    if (count > 0) {
      blockers.push(
        blocker(
          "decoded_role_sensitive_negative",
          "role_sensitive_nonnegative",
          `${count} value(s) violate this uncertainty or smearing-weight role's nonnegative requirement; the first is word ${firstWord}.`,
          `/files/${ordinal}/bytes/${firstWord}`,
        ),
      );
    }
  }
  return blockers;
};

const decodeFloat64LeAfterAdmission = (
  copies: readonly Uint8Array[],
): Float64Array[] =>
  copies.map((bytes) => {
    const count = wordCount(bytes);
    const decoded = new Float64Array(count);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let index = 0; index < count; index += 1) {
      decoded[index] = view.getFloat64(index * 8, true);
    }
    return decoded;
  });

const rawHashBindings = (
  hashes: readonly string[],
): Nhm2SphericalBosonStarV2RawHashBinding[] =>
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS.map(
    (descriptor, index) => ({
      fileOrdinal: descriptor.fileOrdinal,
      path: descriptor.path,
      role: descriptor.role,
      shape: [...descriptor.shape],
      sizeBytes: descriptor.sizeBytes,
      sha256: hashes[index],
    }),
  );

const makeAcceptedInputBinding = (
  hashes: readonly string[],
): NonNullable<
  Nhm2SphericalBosonStarV2RawInventoryReceiptV1["inputBinding"]
> => {
  const bindings = rawHashBindings(hashes);
  return {
    candidateId: EXPECTED_CANDIDATE_ID,
    rawReplaySchema: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
    },
    fileCount: 68,
    aggregateBytes: 6_693_376,
    rawHashClosureSha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_HASH_CLOSURE_SHA256_DOMAIN,
    rawHashClosureSha256: sha256(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_HASH_CLOSURE_SHA256_DOMAIN +
        JSON.stringify(bindings),
    ),
    rawHashBindings: bindings,
  };
};

const RAW_OUTPUT_PREFIX = "{outputDirectory}/" as const;
const MAXIMUM_ROOT_UTF8_BYTES = 4_096;
const NETWORK_OR_DEVICE_ROOT =
  /^(?:[/\\]{2}(?:[?.][/\\])?|\\[?][?]\\|(?:smb|nfs|afp|ftp|https?|file):\/\/)/i;

const filesystemFail = (
  code: Exclude<
    Nhm2SphericalBosonStarV2RawFilesystemBlockerCode,
    "postrun_manifest_instance_and_preexecution_evidence_missing"
  >,
  message: string,
  relativePath: string | null = null,
): never => {
  throw new Nhm2SphericalBosonStarV2RawFilesystemObserverError(
    code,
    message,
    relativePath,
  );
};

const fsCode = (error: unknown): string => {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" && code.length <= 32 ? code : "unknown";
};

const normalizedFilesystemPath = (value: string): string => {
  const resolved = path.resolve(value);
  return process.platform === "win32"
    ? resolved.toLocaleLowerCase("en-US")
    : resolved;
};

const sameFilesystemPath = (left: string, right: string): boolean =>
  normalizedFilesystemPath(left) === normalizedFilesystemPath(right);

const filesystemIdentity = (stat: BigIntStats): FilesystemIdentity => ({
  dev: stat.dev,
  ino: stat.ino,
  mode: stat.mode,
  size: stat.size,
  mtimeNs: stat.mtimeNs,
  ctimeNs: stat.ctimeNs,
  nlink: stat.nlink,
});

const filesystemIdentitiesMatch = (
  left: FilesystemIdentity,
  right: FilesystemIdentity,
): boolean =>
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.mode === right.mode &&
  left.size === right.size &&
  left.mtimeNs === right.mtimeNs &&
  left.ctimeNs === right.ctimeNs &&
  left.nlink === right.nlink;

const publicFilesystemIdentity = (
  value: FilesystemIdentity,
): Nhm2SphericalBosonStarV2RawFilesystemIdentityV1 => ({
  dev: value.dev.toString(10),
  ino: value.ino.toString(10),
  sizeBytes: value.size.toString(10),
  mtimeNs: value.mtimeNs.toString(10),
  ctimeNs: value.ctimeNs.toString(10),
});

const lstatForObserver = async (
  absolutePath: string,
  code: Exclude<
    Nhm2SphericalBosonStarV2RawFilesystemBlockerCode,
    "postrun_manifest_instance_and_preexecution_evidence_missing"
  >,
  label: string,
  relativePath: string | null = null,
): Promise<BigIntStats> => {
  try {
    return await fs.lstat(absolutePath, { bigint: true });
  } catch (error) {
    return filesystemFail(
      code,
      `${label} is unreadable (${fsCode(error)}).`,
      relativePath,
    );
  }
};

const realpathForObserver = async (
  absolutePath: string,
  code: Exclude<
    Nhm2SphericalBosonStarV2RawFilesystemBlockerCode,
    "postrun_manifest_instance_and_preexecution_evidence_missing"
  >,
  label: string,
  relativePath: string | null = null,
): Promise<string> => {
  try {
    return await fs.realpath(absolutePath);
  } catch (error) {
    return filesystemFail(
      code,
      `${label} realpath is unreadable (${fsCode(error)}).`,
      relativePath,
    );
  }
};

const exactRelativePath = (descriptor: ExpectedDescriptor): string => {
  if (!descriptor.path.startsWith(RAW_OUTPUT_PREFIX)) {
    return filesystemFail(
      "filesystem_internal_admission_failed",
      "The sealed output descriptor has no exact output-directory prefix.",
    );
  }
  const relativePath = descriptor.path.slice(RAW_OUTPUT_PREFIX.length);
  const segments = relativePath.split("/");
  if (
    relativePath.length === 0 ||
    path.posix.isAbsolute(relativePath) ||
    path.win32.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.includes(":") ||
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        Buffer.byteLength(segment, "utf8") > 255,
    )
  ) {
    return filesystemFail(
      "filesystem_internal_admission_failed",
      "The sealed output descriptor path is not a bounded portable suffix.",
    );
  }
  return relativePath;
};

type ExpectedDirectoryChildren = ReadonlyMap<
  string,
  ReadonlyMap<string, "directory" | "file">
>;

const expectedDirectoryChildren = (): ExpectedDirectoryChildren => {
  const directories = new Map<string, Map<string, "directory" | "file">>();
  directories.set("", new Map());
  for (const descriptor of NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS) {
    const segments = exactRelativePath(descriptor).split("/");
    let parent = "";
    for (let index = 0; index < segments.length; index += 1) {
      const name = segments[index];
      const kind = index === segments.length - 1 ? "file" : "directory";
      const children = directories.get(parent);
      if (children == null) {
        return filesystemFail(
          "filesystem_internal_admission_failed",
          "The compiled descriptor directory tree is incomplete.",
        );
      }
      const prior = children.get(name);
      if (prior != null && prior !== kind) {
        return filesystemFail(
          "filesystem_internal_admission_failed",
          "The compiled descriptor tree contains a file-directory collision.",
        );
      }
      children.set(name, kind);
      if (kind === "directory") {
        parent = parent.length === 0 ? name : `${parent}/${name}`;
        if (!directories.has(parent)) directories.set(parent, new Map());
      }
    }
  }
  return directories;
};

const EXPECTED_DIRECTORY_CHILDREN = expectedDirectoryChildren();

const absoluteChildPath = (root: string, relativePath: string): string =>
  relativePath.length === 0
    ? root
    : path.join(root, ...relativePath.split("/"));

const validateRootDirectory = async (
  rootDirectory: string,
): Promise<FilesystemDirectoryGuard> => {
  if (
    rootDirectory.length === 0 ||
    Buffer.byteLength(rootDirectory, "utf8") > MAXIMUM_ROOT_UTF8_BYTES ||
    NETWORK_OR_DEVICE_ROOT.test(rootDirectory)
  ) {
    return filesystemFail(
      "filesystem_root_forbidden",
      "The output root is empty, oversized, network-addressed, or device-addressed.",
    );
  }
  if (!path.isAbsolute(rootDirectory)) {
    return filesystemFail(
      "filesystem_root_not_absolute",
      "The server-resolved output root must be absolute.",
    );
  }
  if (
    path.normalize(rootDirectory) !== rootDirectory ||
    path.resolve(rootDirectory) !== rootDirectory
  ) {
    return filesystemFail(
      "filesystem_root_not_resolved",
      "The server-resolved output root must already be normalized and resolved.",
    );
  }
  if (sameFilesystemPath(rootDirectory, path.parse(rootDirectory).root)) {
    return filesystemFail(
      "filesystem_root_forbidden",
      "A filesystem root cannot be an output root.",
    );
  }

  const parent = path.dirname(rootDirectory);
  const parentStat = await lstatForObserver(
    parent,
    "filesystem_parent_unreadable",
    "Output-root parent",
  );
  if (parentStat.isSymbolicLink()) {
    return filesystemFail(
      "filesystem_parent_symlink_or_reparse",
      "The output-root parent is a symbolic link or reparse point.",
    );
  }
  if (!parentStat.isDirectory()) {
    return filesystemFail(
      "filesystem_parent_not_directory",
      "The output-root parent is not a directory.",
    );
  }
  const parentRealPath = await realpathForObserver(
    parent,
    "filesystem_parent_unreadable",
    "Output-root parent",
  );
  if (!sameFilesystemPath(parent, parentRealPath)) {
    return filesystemFail(
      "filesystem_parent_symlink_or_reparse",
      "The output-root parent resolves through an alias or reparse point.",
    );
  }

  const rootStat = await lstatForObserver(
    rootDirectory,
    "filesystem_root_unreadable",
    "Output root",
  );
  if (rootStat.isSymbolicLink()) {
    return filesystemFail(
      "filesystem_root_symlink_or_reparse",
      "The output root is a symbolic link or reparse point.",
    );
  }
  if (!rootStat.isDirectory()) {
    return filesystemFail(
      "filesystem_root_not_directory",
      "The output root is not a directory.",
    );
  }
  const rootRealPath = await realpathForObserver(
    rootDirectory,
    "filesystem_root_unreadable",
    "Output root",
  );
  if (!sameFilesystemPath(rootDirectory, rootRealPath)) {
    return filesystemFail(
      "filesystem_root_symlink_or_reparse",
      "The output root resolves through an alias or reparse point.",
    );
  }
  return {
    absolutePath: rootDirectory,
    realPath: rootRealPath,
    identity: filesystemIdentity(rootStat),
  };
};

const observeExactDirectoryInventory = async (
  root: FilesystemDirectoryGuard,
  priorGuards: ReadonlyMap<string, FilesystemDirectoryGuard> | null,
): Promise<ReadonlyMap<string, FilesystemDirectoryGuard>> => {
  const guards = new Map<string, FilesystemDirectoryGuard>();
  const directoryPaths = [...EXPECTED_DIRECTORY_CHILDREN.keys()].sort();
  for (const relativeDirectory of directoryPaths) {
    const absolutePath = absoluteChildPath(
      root.absolutePath,
      relativeDirectory,
    );
    const stat = await lstatForObserver(
      absolutePath,
      relativeDirectory.length === 0
        ? "filesystem_root_unreadable"
        : "filesystem_parent_unreadable",
      "Expected output directory",
      relativeDirectory || null,
    );
    if (stat.isSymbolicLink()) {
      return filesystemFail(
        relativeDirectory.length === 0
          ? "filesystem_root_symlink_or_reparse"
          : "filesystem_parent_symlink_or_reparse",
        "An expected output directory is a symbolic link or reparse point.",
        relativeDirectory || null,
      );
    }
    if (!stat.isDirectory()) {
      return filesystemFail(
        relativeDirectory.length === 0
          ? "filesystem_root_not_directory"
          : "filesystem_parent_not_directory",
        "An expected output directory is not a directory.",
        relativeDirectory || null,
      );
    }
    const realPath = await realpathForObserver(
      absolutePath,
      relativeDirectory.length === 0
        ? "filesystem_root_unreadable"
        : "filesystem_parent_unreadable",
      "Expected output directory",
      relativeDirectory || null,
    );
    if (!sameFilesystemPath(absolutePath, realPath)) {
      return filesystemFail(
        relativeDirectory.length === 0
          ? "filesystem_root_symlink_or_reparse"
          : "filesystem_parent_symlink_or_reparse",
        "An expected output directory resolves through an alias or reparse point.",
        relativeDirectory || null,
      );
    }
    const guard = {
      absolutePath,
      realPath,
      identity: filesystemIdentity(stat),
    };
    const prior = priorGuards?.get(relativeDirectory);
    if (
      prior != null &&
      (!sameFilesystemPath(prior.realPath, guard.realPath) ||
        !filesystemIdentitiesMatch(prior.identity, guard.identity))
    ) {
      return filesystemFail(
        "filesystem_inventory_mismatch",
        "An expected output directory changed during observation.",
        relativeDirectory || null,
      );
    }
    guards.set(relativeDirectory, guard);

    const expectedChildren = EXPECTED_DIRECTORY_CHILDREN.get(relativeDirectory);
    if (expectedChildren == null) {
      return filesystemFail(
        "filesystem_internal_admission_failed",
        "The compiled expected directory inventory is unavailable.",
      );
    }
    let directory;
    try {
      directory = await fs.opendir(absolutePath);
    } catch (error) {
      return filesystemFail(
        "filesystem_inventory_mismatch",
        `An expected output directory cannot be enumerated (${fsCode(error)}).`,
        relativeDirectory || null,
      );
    }
    const observed = new Set<string>();
    try {
      while (true) {
        const entry = await directory.read();
        if (entry == null) break;
        if (
          observed.size >= expectedChildren.size ||
          !expectedChildren.has(entry.name) ||
          observed.has(entry.name)
        ) {
          return filesystemFail(
            "filesystem_inventory_mismatch",
            "The output directory contains an extra, misspelled, or duplicate entry.",
            relativeDirectory || null,
          );
        }
        if (entry.isSymbolicLink()) {
          return filesystemFail(
            expectedChildren.get(entry.name) === "file"
              ? "filesystem_entry_symlink_or_reparse"
              : "filesystem_parent_symlink_or_reparse",
            "The output inventory contains a symbolic link or reparse point.",
            relativeDirectory.length === 0
              ? entry.name
              : `${relativeDirectory}/${entry.name}`,
          );
        }
        observed.add(entry.name);
      }
    } catch (error) {
      if (error instanceof Nhm2SphericalBosonStarV2RawFilesystemObserverError)
        throw error;
      return filesystemFail(
        "filesystem_inventory_mismatch",
        `The output directory enumeration failed (${fsCode(error)}).`,
        relativeDirectory || null,
      );
    } finally {
      try {
        await directory.close();
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ERR_DIR_CLOSED") {
          return filesystemFail(
            "filesystem_inventory_mismatch",
            `The output directory handle did not close cleanly (${fsCode(error)}).`,
            relativeDirectory || null,
          );
        }
      }
    }
    if (observed.size !== expectedChildren.size) {
      return filesystemFail(
        "filesystem_inventory_mismatch",
        "The output directory is missing a predeclared entry.",
        relativeDirectory || null,
      );
    }
  }
  return guards;
};

type PreflightFile = Readonly<{
  descriptor: ExpectedDescriptor;
  relativePath: string;
  absolutePath: string;
  realPath: string;
  identity: FilesystemIdentity;
}>;

const preflightExactFiles = async (
  root: FilesystemDirectoryGuard,
): Promise<readonly PreflightFile[]> => {
  const files: PreflightFile[] = [];
  let aggregateBytes = BigInt(0);
  for (const descriptor of NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS) {
    const relativePath = exactRelativePath(descriptor);
    const absolutePath = absoluteChildPath(root.absolutePath, relativePath);
    const stat = await lstatForObserver(
      absolutePath,
      "filesystem_entry_unreadable",
      "Predeclared output file",
      relativePath,
    );
    if (stat.isSymbolicLink()) {
      return filesystemFail(
        "filesystem_entry_symlink_or_reparse",
        "A predeclared output file is a symbolic link or reparse point.",
        relativePath,
      );
    }
    if (!stat.isFile()) {
      return filesystemFail(
        "filesystem_entry_not_regular",
        "A predeclared output entry is not a regular file.",
        relativePath,
      );
    }
    if (stat.nlink !== BigInt(1)) {
      return filesystemFail(
        "filesystem_entry_hardlinked",
        "A predeclared output file has more than one hard link.",
        relativePath,
      );
    }
    if (stat.size !== BigInt(descriptor.sizeBytes)) {
      return filesystemFail(
        "filesystem_entry_size_mismatch",
        "A predeclared output file size does not match its sealed descriptor.",
        relativePath,
      );
    }
    aggregateBytes += stat.size;
    if (
      aggregateBytes >
      BigInt(
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS.maximumAggregateBytes,
      )
    ) {
      return filesystemFail(
        "filesystem_entry_size_mismatch",
        "The predeclared output aggregate exceeds its fixed allocation cap.",
      );
    }
    const realPath = await realpathForObserver(
      absolutePath,
      "filesystem_entry_unreadable",
      "Predeclared output file",
      relativePath,
    );
    if (!sameFilesystemPath(absolutePath, realPath)) {
      return filesystemFail(
        "filesystem_entry_realpath_mismatch",
        "A predeclared output file resolves through an alias or reparse point.",
        relativePath,
      );
    }
    files.push({
      descriptor,
      relativePath,
      absolutePath,
      realPath,
      identity: filesystemIdentity(stat),
    });
  }
  if (
    files.length !==
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS.exactFileCount ||
    aggregateBytes !==
      BigInt(
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS.exactAggregateBytes,
      )
  ) {
    return filesystemFail(
      "filesystem_inventory_mismatch",
      "The exact 68-file, 6,693,376-byte preflight inventory is incomplete.",
    );
  }
  return files;
};

const openFlags = (): number =>
  fsConstants.O_RDONLY |
  (typeof fsConstants.O_NOFOLLOW === "number" ? fsConstants.O_NOFOLLOW : 0) |
  (typeof fsConstants.O_NONBLOCK === "number" ? fsConstants.O_NONBLOCK : 0);

const readExactPreflightedFile = async (
  file: PreflightFile,
): Promise<Readonly<{ bytes: Uint8Array; identity: FilesystemIdentity }>> => {
  let handle;
  try {
    handle = await fs.open(file.absolutePath, openFlags());
  } catch (error) {
    return filesystemFail(
      "filesystem_entry_open_failed",
      `A predeclared output file could not be opened (${fsCode(error)}).`,
      file.relativePath,
    );
  }
  let bytes: Uint8Array;
  let openedIdentity: FilesystemIdentity;
  try {
    const before = await handle.stat({ bigint: true });
    openedIdentity = filesystemIdentity(before);
    if (
      !before.isFile() ||
      before.isSymbolicLink() ||
      before.nlink !== BigInt(1) ||
      !filesystemIdentitiesMatch(openedIdentity, file.identity)
    ) {
      return filesystemFail(
        "filesystem_entry_open_identity_mismatch",
        "The opened file descriptor does not match the exact preflight identity.",
        file.relativePath,
      );
    }

    bytes = new Uint8Array(file.descriptor.sizeBytes);
    let offset = 0;
    while (offset < bytes.byteLength) {
      const read = await handle.read(
        bytes,
        offset,
        bytes.byteLength - offset,
        offset,
      );
      if (read.bytesRead <= 0) {
        return filesystemFail(
          "filesystem_entry_bounded_read_mismatch",
          "The exact positional file read ended before the sealed byte length.",
          file.relativePath,
        );
      }
      offset += read.bytesRead;
    }
    const trailing = new Uint8Array(1);
    const trailingRead = await handle.read(
      trailing,
      0,
      1,
      file.descriptor.sizeBytes,
    );
    if (trailingRead.bytesRead !== 0) {
      return filesystemFail(
        "filesystem_entry_bounded_read_mismatch",
        "The opened file contains bytes beyond the sealed descriptor size.",
        file.relativePath,
      );
    }
    const after = await handle.stat({ bigint: true });
    if (!filesystemIdentitiesMatch(openedIdentity, filesystemIdentity(after))) {
      return filesystemFail(
        "filesystem_entry_changed_while_reading",
        "The descriptor device, inode, mode, size, link count, mtime, or ctime changed while reading.",
        file.relativePath,
      );
    }
  } catch (error) {
    if (error instanceof Nhm2SphericalBosonStarV2RawFilesystemObserverError)
      throw error;
    return filesystemFail(
      "filesystem_entry_changed_while_reading",
      `The bounded file read failed (${fsCode(error)}).`,
      file.relativePath,
    );
  } finally {
    try {
      await handle.close();
    } catch (error) {
      if (
        !(error instanceof Nhm2SphericalBosonStarV2RawFilesystemObserverError)
      ) {
        return filesystemFail(
          "filesystem_entry_changed_while_reading",
          `The file descriptor did not close cleanly (${fsCode(error)}).`,
          file.relativePath,
        );
      }
    }
  }

  const afterClose = await lstatForObserver(
    file.absolutePath,
    "filesystem_entry_changed_after_initial_read",
    "Observed output file",
    file.relativePath,
  );
  const afterCloseRealPath = await realpathForObserver(
    file.absolutePath,
    "filesystem_entry_changed_after_initial_read",
    "Observed output file",
    file.relativePath,
  );
  if (
    afterClose.isSymbolicLink() ||
    !afterClose.isFile() ||
    !sameFilesystemPath(afterCloseRealPath, file.realPath) ||
    !filesystemIdentitiesMatch(filesystemIdentity(afterClose), openedIdentity!)
  ) {
    return filesystemFail(
      "filesystem_entry_changed_after_initial_read",
      "The output path or its exact identity changed after the descriptor read.",
      file.relativePath,
    );
  }
  return { bytes: bytes!, identity: openedIdentity! };
};

const privatelyAdmitFilesystemObservation = (
  observed: readonly FilesystemObservedFile[],
): Nhm2SphericalBosonStarV2RawInventoryReceiptV1 => {
  const capability = Object.freeze(Object.create(null)) as object;
  const prepared: PreparedObservation[] = observed.map((file) => ({
    descriptor: file.descriptor,
    claimedSizeBytes: file.descriptor.sizeBytes,
    claimedSha256: file.sha256,
    bytes: file.bytes,
    buffer: file.bytes.buffer as ArrayBuffer,
    intrinsicByteLength: file.bytes.byteLength,
  }));
  MINTED_INPUTS.set(capability, { prepared, blocker: null });
  return admitNhm2SphericalBosonStarV2RawInventory(capability);
};

/**
 * Pure content admission only. Direct caller graphs are never traversed here.
 * The only producer of the opaque one-shot capability is the private
 * filesystem-observation path in this module; no caller-facing mint function
 * exists. This boundary itself performs no filesystem read, freshness check,
 * scientific replay, candidate execution, or claim unlock. Exact byte copies
 * and decoded arrays never leave this module.
 */
export const admitNhm2SphericalBosonStarV2RawInventory = (
  callerInput: unknown,
): Nhm2SphericalBosonStarV2RawInventoryReceiptV1 => {
  if (!BUILT_IN_SCHEMA_IS_EXACT) {
    return makeReceipt({
      blockers: [
        blocker(
          "built_in_schema_binding_invalid",
          "built_in_schema",
          "The compiled 68-file boundary no longer matches the sealed raw replay schema.",
          null,
          "blocked",
        ),
      ],
      trace: makeTrace({}),
      inputBinding: null,
    });
  }

  if (callerInput == null || typeof callerInput !== "object") {
    return makeReceipt({
      blockers: [
        blocker(
          "server_minted_input_capability_required",
          "structure",
          "Direct caller input is diagnostic-blocked; an opaque server-minted input capability is required.",
          null,
          "blocked",
        ),
      ],
      trace: makeTrace({}),
      inputBinding: null,
    });
  }
  const minted = MINTED_INPUTS.get(callerInput);
  if (minted == null) {
    return makeReceipt({
      blockers: [
        blocker(
          "server_minted_input_capability_required",
          "structure",
          "Direct caller input is diagnostic-blocked; an opaque server-minted input capability is required.",
          null,
          "blocked",
        ),
      ],
      trace: makeTrace({}),
      inputBinding: null,
    });
  }
  MINTED_INPUTS.delete(callerInput);
  if (minted.blocker != null) {
    return makeReceipt({
      blockers: [minted.blocker],
      trace: makeTrace({}),
      inputBinding: null,
    });
  }
  const prepared = [...minted.prepared];

  const capturedTrace = makeTrace({
    exactPlainGraphCapturedWithoutByteClone: true,
  });
  const sizeBlockers: Nhm2SphericalBosonStarV2RawInventoryBlocker[] = [];
  let aggregateBytes = 0;
  for (let index = 0; index < prepared.length; index += 1) {
    const entry = prepared[index];
    if (
      !Number.isSafeInteger(entry.claimedSizeBytes) ||
      (entry.claimedSizeBytes as number) < 0 ||
      entry.claimedSizeBytes !== entry.descriptor.sizeBytes ||
      entry.claimedSizeBytes !== entry.intrinsicByteLength
    ) {
      sizeBlockers.push(
        blocker(
          "file_size_mismatch",
          "hash_or_size",
          "Claimed size, intrinsic byte length, and sealed descriptor size must be exactly equal.",
          `/files/${index}/sizeBytes`,
        ),
      );
    }
    if (
      entry.intrinsicByteLength >
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS.maximumPerFileBytes
    ) {
      sizeBlockers.push(
        blocker(
          "file_size_cap_exceeded",
          "hash_or_size",
          "Intrinsic file length exceeds the fixed per-file allocation cap.",
          `/files/${index}/bytes`,
        ),
      );
    }
    if (entry.intrinsicByteLength !== entry.descriptor.sizeBytes) {
      sizeBlockers.push(
        blocker(
          "file_size_mismatch",
          "hash_or_size",
          "Intrinsic file length does not match the sealed descriptor size.",
          `/files/${index}/bytes`,
        ),
      );
    }
    aggregateBytes += entry.intrinsicByteLength;
    if (!Number.isSafeInteger(aggregateBytes)) {
      sizeBlockers.push(
        blocker(
          "aggregate_size_cap_exceeded",
          "hash_or_size",
          "Aggregate byte count exceeded safe-integer admission.",
          "/files",
        ),
      );
      break;
    }
  }
  if (
    aggregateBytes >
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS.maximumAggregateBytes ||
    aggregateBytes !==
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS.exactAggregateBytes
  ) {
    sizeBlockers.push(
      blocker(
        "aggregate_size_cap_exceeded",
        "hash_or_size",
        "Aggregate intrinsic byte count does not equal the fixed 6,693,376-byte inventory cap.",
        "/files",
      ),
    );
  }
  if (sizeBlockers.length > 0) {
    return makeReceipt({
      blockers: sizeBlockers,
      trace: makeTrace({
        ...capturedTrace,
        perFileAndAggregateCapsPreflightedBeforeByteCopies: true,
      }),
      inputBinding: null,
    });
  }

  const preflightTrace = makeTrace({
    exactPlainGraphCapturedWithoutByteClone: true,
    exact68DescriptorInventoryVerified: true,
    perFileAndAggregateCapsPreflightedBeforeByteCopies: true,
  });
  let copies: Uint8Array[];
  try {
    copies = copyExactFullViews(prepared);
  } catch {
    return makeReceipt({
      blockers: [
        blocker(
          "internal_admission_error",
          "internal",
          "Exact built-in byte-copy allocation failed closed after preflight.",
        ),
      ],
      trace: preflightTrace,
      inputBinding: null,
    });
  }
  const copiedTrace = makeTrace({
    exactPlainGraphCapturedWithoutByteClone: true,
    exact68DescriptorInventoryVerified: true,
    perFileAndAggregateCapsPreflightedBeforeByteCopies: true,
    builtInFullViewCopiesCreated: true,
  });

  let hashes: string[];
  try {
    hashes = copies.map((bytes) => sha256(bytes));
  } catch {
    return makeReceipt({
      blockers: [
        blocker(
          "internal_admission_error",
          "internal",
          "SHA-256 computation failed closed before numeric scanning.",
        ),
      ],
      trace: copiedTrace,
      inputBinding: null,
    });
  }
  const hashBlockers: Nhm2SphericalBosonStarV2RawInventoryBlocker[] = [];
  for (let index = 0; index < prepared.length; index += 1) {
    const claimedSha256 = prepared[index].claimedSha256;
    if (
      typeof claimedSha256 !== "string" ||
      claimedSha256.length !== 64 ||
      !SHA256_PATTERN.test(claimedSha256)
    ) {
      hashBlockers.push(
        blocker(
          "file_sha256_invalid",
          "hash_or_size",
          "Claimed SHA-256 is not exactly 64 lowercase hexadecimal characters.",
          `/files/${index}/sha256`,
        ),
      );
    } else if (hashes[index] !== claimedSha256) {
      hashBlockers.push(
        blocker(
          "file_sha256_mismatch",
          "hash_or_size",
          "Claimed SHA-256 does not match the exact copied bytes.",
          `/files/${index}/bytes`,
        ),
      );
    }
  }
  if (hashes[4] !== NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256)
    hashBlockers.push(
      blocker(
        "candidate_frozen_content_sha256_mismatch",
        "hash_or_size",
        "The smearing-weight file does not match the candidate-bound exact 64-copy 1/64 byte string.",
        "/files/4/bytes",
      ),
    );
  const hashedTrace = makeTrace({
    exactPlainGraphCapturedWithoutByteClone: true,
    exact68DescriptorInventoryVerified: true,
    perFileAndAggregateCapsPreflightedBeforeByteCopies: true,
    builtInFullViewCopiesCreated: true,
    sha256CompletedForEveryCopyBeforeNumericScan: true,
    candidateFrozenContentHashesVerifiedBeforeNumericScan:
      hashBlockers.length === 0,
  });
  if (hashBlockers.length > 0) {
    return makeReceipt({
      blockers: hashBlockers,
      trace: hashedTrace,
      inputBinding: null,
    });
  }

  const nonfiniteBlockers = scanAllNonfinite(copies);
  const nonfiniteTrace = makeTrace({
    ...hashedTrace,
    allNonfiniteWordsScanned: true,
  });
  if (nonfiniteBlockers.length > 0) {
    return makeReceipt({
      blockers: nonfiniteBlockers,
      trace: nonfiniteTrace,
      inputBinding: null,
    });
  }

  const negativeZeroBlockers = scanAllNegativeZero(copies);
  const negativeZeroTrace = makeTrace({
    ...nonfiniteTrace,
    allNegativeZeroWordsScanned: true,
  });
  if (negativeZeroBlockers.length > 0) {
    return makeReceipt({
      blockers: negativeZeroBlockers,
      trace: negativeZeroTrace,
      inputBinding: null,
    });
  }

  const nonnegativeBlockers = scanAllRoleSensitiveNonnegative(copies);
  const admittedTrace = makeTrace({
    ...negativeZeroTrace,
    all18RoleSensitiveNonnegativeFilesScanned: true,
  });
  if (nonnegativeBlockers.length > 0) {
    return makeReceipt({
      blockers: nonnegativeBlockers,
      trace: admittedTrace,
      inputBinding: null,
    });
  }

  let decoded: Float64Array[];
  try {
    decoded = decodeFloat64LeAfterAdmission(copies);
  } catch {
    return makeReceipt({
      blockers: [
        blocker(
          "decoded_inventory_unavailable",
          "decode",
          "Private float64le decoding failed closed after byte admission.",
        ),
      ],
      trace: admittedTrace,
      inputBinding: null,
    });
  }
  const receipt = makeReceipt({
    blockers: [],
    trace: makeTrace({
      ...admittedTrace,
      float64LeDecodedOnlyAfterEveryAdmissionPhase: true,
    }),
    inputBinding: makeAcceptedInputBinding(hashes),
  });
  DECODED_INVENTORIES.set(receipt, { valuesByOrdinal: decoded });
  return receipt;
};

/**
 * Server-side, current-filesystem observation for the exact compiled 68-file
 * inventory. The input is one primitive, already-resolved absolute root; this
 * API accepts neither caller byte graphs nor caller manifest metadata. It
 * securely reads and replays only schema-predeclared paths, then consumes a
 * private one-shot admission capability internally.
 *
 * The separately sealed run-artifact wire contract now closes the canonical
 * skeleton/postrun shape, limits, and pair binding. This observer binds the
 * initially read bytes only after one complete replay and one complete final
 * identity-and-hash sweep, followed by a final directory-inventory check. The
 * bounded sequential sweeps are not an atomic filesystem snapshot and cannot
 * prove path stability after each entry's last sweep through function return.
 * It also receives no skeleton, preseal, execution, absence, or postrun-
 * manifest instance. Readiness and every authority flag therefore remain false
 * with an explicit instance blocker.
 */
export async function observeNhm2SphericalBosonStarV2RawInventoryFromFilesystem(
  rootDirectory: string,
): Promise<Nhm2SphericalBosonStarV2RawFilesystemObservationReceiptV1> {
  if (typeof rootDirectory !== "string") {
    return filesystemFail(
      "filesystem_root_forbidden",
      "The server-resolved output root must be one primitive string.",
    );
  }
  if (process.platform !== "linux") {
    return filesystemFail(
      "filesystem_platform_inadmissible",
      "This observer requires the sealed Linux filesystem policy and fails closed on every other host platform.",
    );
  }
  if (!BUILT_IN_SCHEMA_IS_EXACT) {
    return filesystemFail(
      "filesystem_internal_admission_failed",
      "The compiled 68-file boundary no longer matches the sealed raw replay schema.",
    );
  }

  const root = await validateRootDirectory(rootDirectory);
  const initialDirectoryGuards = await observeExactDirectoryInventory(
    root,
    new Map([["", root]]),
  );
  const preflight = await preflightExactFiles(root);
  const observed: FilesystemObservedFile[] = [];
  for (const file of preflight) {
    const read = await readExactPreflightedFile(file);
    observed.push({
      descriptor: file.descriptor,
      relativePath: file.relativePath,
      sha256: sha256(read.bytes),
      bytes: read.bytes,
      identity: read.identity,
    });
  }

  for (let index = 0; index < preflight.length; index += 1) {
    const replay = await readExactPreflightedFile(preflight[index]);
    if (
      !filesystemIdentitiesMatch(replay.identity, observed[index].identity) ||
      sha256(replay.bytes) !== observed[index].sha256
    ) {
      return filesystemFail(
        "filesystem_entry_changed_after_initial_read",
        "A predeclared output changed identity or bytes during the mandatory replay read.",
        preflight[index].relativePath,
      );
    }
  }

  // Close the retired-entry window in the mandatory replay with one final
  // complete inventory sweep. This validates the originally observed bytes at
  // another bounded sequence of read points; it does not create an atomic
  // snapshot or assert stability after an entry's final sweep through return.
  for (let index = 0; index < preflight.length; index += 1) {
    const finalSweep = await readExactPreflightedFile(preflight[index]);
    if (
      !filesystemIdentitiesMatch(
        finalSweep.identity,
        observed[index].identity,
      ) ||
      sha256(finalSweep.bytes) !== observed[index].sha256
    ) {
      return filesystemFail(
        "filesystem_entry_changed_after_initial_read",
        "A predeclared output changed identity or bytes during the mandatory final complete inventory sweep.",
        preflight[index].relativePath,
      );
    }
  }
  await observeExactDirectoryInventory(root, initialDirectoryGuards);

  const byteAdmission = privatelyAdmitFilesystemObservation(observed);
  if (
    byteAdmission.byteAdmissionDisposition !== "accepted" ||
    byteAdmission.calculationReady !== true ||
    byteAdmission.inputBinding == null
  ) {
    return filesystemFail(
      "filesystem_internal_admission_failed",
      `The internally observed bytes failed closed content admission (${byteAdmission.firstBlocker ?? "unknown"}).`,
    );
  }

  return deepFreeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_FILESYSTEM_OBSERVER_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_FILESYSTEM_OBSERVER_CONTRACT_VERSION,
    stage: "stage_2_bounded_current_filesystem_observation" as const,
    diagnosticOnly: true as const,
    overallDisposition: "blocked" as const,
    observationDisposition: "accepted" as const,
    readiness: false as const,
    rootRealPath: root.realPath,
    fileCount: 68 as const,
    aggregateBytes: 6_693_376 as const,
    files: observed.map((file) => ({
      fileOrdinal: file.descriptor.fileOrdinal,
      relativePath: file.relativePath,
      role: file.descriptor.role,
      sizeBytes: file.descriptor.sizeBytes,
      sha256: file.sha256,
      filesystemIdentity: publicFilesystemIdentity(file.identity),
    })),
    contentAdmission: {
      byteAdmissionDisposition: "accepted" as const,
      calculationReady: false as const,
      privateAdmissionReceiptExposed: false as const,
      observedInputBinding: byteAdmission.inputBinding,
    },
    blockers: [
      {
        code: "postrun_manifest_instance_and_preexecution_evidence_missing" as const,
        detail:
          "The exact bounded skeleton/postrun wire validator is now sealed, but no concrete postrun manifest instance, authenticated preexecution absence receipt, scientific preseal, or execution observation is supplied to this current-filesystem observer.",
      },
    ],
    manifestBoundary: {
      namedArtifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
      namedContractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
      concreteCanonicalWireValidatorPresent: true as const,
      concreteCanonicalWireByteLimitPresent: true as const,
      runArtifactWirePolicySha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256,
      runArtifactWirePolicyCanonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_SIZE_BYTES,
      manifestEntryBytesPresentInSchemaArtifact: false as const,
      producerHashFreshnessOrProvenanceAccepted: false as const,
    },
    observationTrace: {
      serverProcessOpenedExactPredeclaredPaths: true as const,
      exactDirectoryInventoryObservedBeforeAndAfterReads: true as const,
      all68SizesPreflightedBeforeFileByteAllocation: true as const,
      exactAggregateCapPreflightedBeforeFileByteAllocation: true as const,
      everyEntryLstatRegularNonSymlinkSingleLink: true as const,
      everyEntryRealpathEqualToPredeclaredAbsolutePath: true as const,
      everyEntryOpenFstatMatchedLstat: true as const,
      everyEntryPostReadFstatMatchedPreReadFstat: true as const,
      everyEntryPostCloseLstatMatchedPreReadFstat: true as const,
      everyEntryReopenedAndByteReplayed: true as const,
      everyEntryReplayIdentityAndHashMatched: true as const,
      everyEntryFinalSweepIdentityAndHashMatchedOriginallyObservedBytes:
        true as const,
      boundedSweepsDoNotClaimAtomicFilesystemSnapshotOrStabilityThroughReturn:
        true as const,
      currentReadOnlyNoExecutionFreshnessInference: true as const,
      privateOneShotAdmissionCapabilityConsumed: true as const,
    },
    authorityBoundary: { ...FILESYSTEM_OBSERVER_AUTHORITY_BOUNDARY },
  });
}

/**
 * Read-only calculation surface keyed by the genuine receipt object. A copied,
 * serialized, or forged receipt has no WeakMap state and cannot access values.
 */
export const readNhm2SphericalBosonStarV2AdmittedFloat64 = (
  receipt: unknown,
  fileOrdinal: number,
  flatElementOrdinal: number,
): number | null => {
  if (
    receipt == null ||
    typeof receipt !== "object" ||
    !Number.isSafeInteger(fileOrdinal) ||
    !Number.isSafeInteger(flatElementOrdinal) ||
    fileOrdinal < 0 ||
    flatElementOrdinal < 0
  ) {
    return null;
  }
  const inventory = DECODED_INVENTORIES.get(receipt);
  const values = inventory?.valuesByOrdinal[fileOrdinal];
  return values != null && flatElementOrdinal < values.length
    ? values[flatElementOrdinal]
    : null;
};

export const getNhm2SphericalBosonStarV2AdmittedFloat64Length = (
  receipt: unknown,
  fileOrdinal: number,
): number | null => {
  if (
    receipt == null ||
    typeof receipt !== "object" ||
    !Number.isSafeInteger(fileOrdinal) ||
    fileOrdinal < 0
  ) {
    return null;
  }
  return (
    DECODED_INVENTORIES.get(receipt)?.valuesByOrdinal[fileOrdinal]?.length ??
    null
  );
};
