import { createHash } from "node:crypto";
import path from "node:path";
import { TextDecoder } from "node:util";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CANONICAL_JSON,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_IMPLEMENTATION_INPUT_IDS,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS,
  collectNhm2SemiclassicalV2RawReplayOutputArrays,
  nhm2SemiclassicalV2RawReplayManifestViolations,
  type Nhm2SemiclassicalV2RawReplayArrayV1,
  type Nhm2SemiclassicalV2RawReplayInputEntryV1,
  type Nhm2SemiclassicalV2RawReplayManifestV1,
  type Nhm2SemiclassicalV2RawReplayScientificPresealBindingV1,
} from "../../../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  replayNhm2SemiclassicalV2Content,
  type Nhm2SemiclassicalV2ContentReplayInput,
  type Nhm2SemiclassicalV2ContentReplayPolicy,
  type Nhm2SemiclassicalV2ContentReplayResult,
} from "./nhm2-semiclassical-v2-content-replay";
import {
  NHM2_SECURE_RUN_OUTPUT_READER_LIMITS,
  Nhm2SecureRunOutputReaderError,
  readNhm2SecureRunOutputs,
  type Nhm2SecureRunOutputFilesystemIdentityV1,
  type Nhm2SecureRunOutputReadFileV1,
  type Nhm2SecureRunOutputReadResultV1,
} from "./nhm2-secure-run-output-reader";

export const NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_run_replayer/v2" as const;

export const NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_MAX_MANIFEST_BYTES =
  4 * 1024 * 1024;
export const NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_MAX_FILE_BYTES =
  NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.defaultMaxFileBytes;
export const NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_MAX_AGGREGATE_BYTES =
  NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.defaultMaxAggregateBytes;

export const NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_AUTHORITY_BLOCKERS =
  Object.freeze([
    "preexecution_scientific_input_seal_not_verified",
    "input_exposure_not_mounted_isolation_not_verified",
    "run_output_absent_prestate_not_verified",
    "manifest_absent_prestate_not_verified",
    "server_authorized_run_root_not_established",
    "same_user_run_output_mutation_exclusion_not_os_enforced",
    "independent_implementation_agreement_not_established",
    "semiclassical_theory_graph_lamp_promotion_not_authorized",
    "experiment_ready_theory_closure_not_established",
    "empirical_validation_not_established",
  ] as const);

export type Nhm2SemiclassicalV2RunReplayerAuthorityBlocker =
  (typeof NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_AUTHORITY_BLOCKERS)[number];

export type Nhm2SemiclassicalV2RunReplayerErrorCode =
  | "replayer_input_invalid"
  | "trusted_manifest_binding_invalid"
  | "trusted_execution_interval_invalid"
  | "manifest_utf8_invalid"
  | "manifest_json_invalid"
  | "manifest_json_not_canonical"
  | "manifest_structural_invalid"
  | "trusted_run_binding_mismatch"
  | "logical_path_binding_invalid"
  | "filesystem_root_topology_invalid"
  | "filesystem_object_alias_detected"
  | "filesystem_resource_limit_exceeded"
  | "secure_filesystem_read_failed"
  | "manifest_filesystem_readback_mismatch"
  | "input_media_type_invalid"
  | "input_media_content_invalid"
  | "approved_policy_bytes_mismatch"
  | "input_current_metadata_incompatible_with_freeze"
  | "output_freshness_outside_execution_interval"
  | "manifest_freshness_outside_observation_interval"
  | "float64_decode_invalid"
  | "float64_reencoding_mismatch"
  | "array_mapping_invalid"
  | "content_replay_internal_error";

export type Nhm2SemiclassicalV2RunReplayerViolation = Readonly<{
  code: Nhm2SemiclassicalV2RunReplayerErrorCode;
  path: string | null;
  detail: string | null;
}>;

export type Nhm2SemiclassicalV2RunReplayerManifestBinding = Readonly<{
  /** Manifest bytes captured and hashed by the trusted outer runtime. */
  bytes: Buffer;
  sha256: string;
  sizeBytes: number;
  mediaType: "application/json";
  /** Portable path relative to the trusted output root. */
  relativePath: string;
  /** Trusted outer-runtime observation after the manifest was persisted. */
  observedAt: string;
}>;

export type Nhm2SemiclassicalV2RunReplayerTrustedBindings = Readonly<{
  manifestFrozenAt: string;
  generatedAt: string;
  candidate: Nhm2SemiclassicalV2RawReplayManifestV1["candidate"];
  implementation: Nhm2SemiclassicalV2RawReplayManifestV1["implementation"];
  execution: Nhm2SemiclassicalV2RawReplayManifestV1["execution"];
  /** Expected producer echo only; no persistence receipt is supplied here. */
  scientificPresealBinding: Nhm2SemiclassicalV2RawReplayScientificPresealBindingV1;
  /** Expected manifest snapshot closure; this is not a pre-execution seal. */
  manifestInputClosureSnapshot: Nhm2SemiclassicalV2RawReplayManifestV1["inputClosure"];
  roots: Readonly<{
    scientific: string;
    implementation: string;
    output: string;
  }>;
}>;

export type Nhm2SemiclassicalV2RunReplayerInput = Readonly<{
  manifest: Nhm2SemiclassicalV2RunReplayerManifestBinding;
  trusted: Nhm2SemiclassicalV2RunReplayerTrustedBindings;
}>;

export type Nhm2SemiclassicalV2RunReplayerFileReceipt = Readonly<{
  scope:
    "scientific_input" | "implementation_input" | "run_output" | "manifest";
  semanticId: string;
  logicalPath: string;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
  mediaType: string;
  encoding: "bytes" | "raw_ieee754_float64_little_endian";
  freshness:
    | "snapshot_bytes_match_manifest_metadata_compatible_not_presealed"
    | "created_or_modified_within_trusted_execution_interval"
    | "created_or_modified_post_execution_before_observation";
  filesystemIdentity: Nhm2SecureRunOutputFilesystemIdentityV1;
}>;

export type Nhm2SemiclassicalV2RunReplayClaimLocks = Readonly<{
  boundedFilesystemSnapshotReadbackEstablished: boolean;
  currentGlobalFilesystemStateEstablished: false;
  serverAuthorizedRootsVerified: false;
  sameUserMutationExclusionVerified: false;
  contentReplayCalculationCompleted: boolean;
  preexecutionScientificInputSealVerified: false;
  inputExposureNotMountedVerified: false;
  runOutputCreationFromAbsentPrestateVerified: false;
  manifestCreationFromAbsentPrestateVerified: false;
  independentImplementationAgreementEstablished: false;
  theoryGraphNoiseKernelLampPromotable: false;
  theoryGraphConstraintAlgebraLampPromotable: false;
  experimentReadyTheoryClosureEstablished: false;
  physicalViabilityEstablished: false;
  propulsionEstablished: false;
  transportEstablished: false;
  routeEtaEstablished: false;
  certifiedSpeedEstablished: false;
  empiricalValidationEstablished: false;
}>;

export type Nhm2SemiclassicalV2RunReplaySuccess = Readonly<{
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION;
  serverOwned: true;
  diagnosticOnly: true;
  verificationState: "bounded_filesystem_snapshots_replayed";
  calculationDisposition: Nhm2SemiclassicalV2ContentReplayResult["status"];
  candidateDisposition: "single_run_replay_only" | "fail" | "blocked";
  manifest: Readonly<{
    relativePath: string;
    sha256: string;
    sizeBytes: number;
    mediaType: "application/json";
    canonicalJsonVerified: true;
    structuralContractVerified: true;
    filesystemReadbackVerified: true;
  }>;
  provenance: Readonly<{
    commitSha: string;
    command: string;
    argv: readonly string[];
    workingDirectory: string;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    manifestObservedAt: string;
    scientificPresealBinding: Readonly<Nhm2SemiclassicalV2RawReplayScientificPresealBindingV1>;
    scientificPresealBindingStatus: "producer_echo_matches_trusted_binding_not_persistence_receipt";
    scientificClosureSha256: string;
    completeClosureSha256: string;
    files: readonly Nhm2SemiclassicalV2RunReplayerFileReceipt[];
    readbackClosureSha256: string;
  }>;
  replay: Nhm2SemiclassicalV2ContentReplayResult;
  authorityState: "blocked_pending_preseal_and_independent_reproduction";
  authorityBlockers: readonly Nhm2SemiclassicalV2RunReplayerAuthorityBlocker[];
  claimLocks: Nhm2SemiclassicalV2RunReplayClaimLocks;
  violations: readonly [];
}>;

export type Nhm2SemiclassicalV2RunReplayFailure = Readonly<{
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION;
  serverOwned: true;
  diagnosticOnly: true;
  verificationState: "blocked";
  calculationDisposition: "blocked";
  candidateDisposition: "blocked";
  manifest: null;
  provenance: null;
  replay: null;
  authorityState: "blocked";
  authorityBlockers: readonly Nhm2SemiclassicalV2RunReplayerAuthorityBlocker[];
  claimLocks: Nhm2SemiclassicalV2RunReplayClaimLocks;
  violations: readonly Nhm2SemiclassicalV2RunReplayerViolation[];
}>;

export type Nhm2SemiclassicalV2RunReplayResult =
  Nhm2SemiclassicalV2RunReplaySuccess | Nhm2SemiclassicalV2RunReplayFailure;

const SHA256 = /^[a-f0-9]{64}$/;
const MEDIA_TYPE =
  /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*(?:;[ -~]+)?$/;
const utf8 = new TextDecoder("utf-8", { fatal: true });
const SCIENTIFIC_PRESEAL_BINDING_KEYS = [
  "artifactId",
  "contractVersion",
  "sealKey",
  "candidateManifestSha256",
  "scientificContentSha256",
  "sealedInventorySha256",
  "sealedAt",
] as const;

const CLAIM_LOCKS_BASE = Object.freeze({
  preexecutionScientificInputSealVerified: false as const,
  inputExposureNotMountedVerified: false as const,
  runOutputCreationFromAbsentPrestateVerified: false as const,
  manifestCreationFromAbsentPrestateVerified: false as const,
  independentImplementationAgreementEstablished: false as const,
  theoryGraphNoiseKernelLampPromotable: false as const,
  theoryGraphConstraintAlgebraLampPromotable: false as const,
  experimentReadyTheoryClosureEstablished: false as const,
  physicalViabilityEstablished: false as const,
  propulsionEstablished: false as const,
  transportEstablished: false as const,
  routeEtaEstablished: false as const,
  certifiedSpeedEstablished: false as const,
  empiricalValidationEstablished: false as const,
});

const failure = (
  code: Nhm2SemiclassicalV2RunReplayerErrorCode,
  detail: string,
  filePath: string | null = null,
): Nhm2SemiclassicalV2RunReplayFailure =>
  Object.freeze({
    contractVersion: NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION,
    serverOwned: true,
    diagnosticOnly: true,
    verificationState: "blocked",
    calculationDisposition: "blocked",
    candidateDisposition: "blocked",
    manifest: null,
    provenance: null,
    replay: null,
    authorityState: "blocked",
    authorityBlockers: Object.freeze([
      ...NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_AUTHORITY_BLOCKERS,
    ]),
    claimLocks: Object.freeze({
      boundedFilesystemSnapshotReadbackEstablished: false,
      currentGlobalFilesystemStateEstablished: false,
      serverAuthorizedRootsVerified: false,
      sameUserMutationExclusionVerified: false,
      contentReplayCalculationCompleted: false,
      ...CLAIM_LOCKS_BASE,
    }),
    violations: Object.freeze([
      Object.freeze({ code, path: filePath, detail }),
    ]),
  });

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (value == null || typeof value !== "object" || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
) => {
  const actual = Reflect.ownKeys(value);
  return (
    actual.length === keys.length &&
    actual.every((key) => typeof key === "string" && keys.includes(key))
  );
};

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("nonfinite_json_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort((left, right) =>
        Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")),
      )
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  throw new Error("noncanonical_json_value");
};

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

const isoMs = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value
    ? parsed
    : null;
};

const toNs = (milliseconds: number): bigint =>
  BigInt(milliseconds) * 1_000_000n;

const normalizedFilesystemPath = (value: string): string => {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
};

const rootContains = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length === 0 ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
};

const rootsOverlap = (left: string, right: string): boolean => {
  const normalizedLeft = normalizedFilesystemPath(left);
  const normalizedRight = normalizedFilesystemPath(right);
  return (
    rootContains(normalizedLeft, normalizedRight) ||
    rootContains(normalizedRight, normalizedLeft)
  );
};

const portableRelativePath = (
  logicalRoot: string,
  logicalPath: string,
): string | null => {
  const prefix = `${logicalRoot}/`;
  if (!logicalPath.startsWith(prefix)) return null;
  const relative = logicalPath.slice(prefix.length);
  if (
    relative.length === 0 ||
    relative.startsWith("/") ||
    relative.includes("\\") ||
    relative
      .split("/")
      .some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    return null;
  }
  return relative;
};

const identityTimes = (identity: Nhm2SecureRunOutputFilesystemIdentityV1) => ({
  mtimeNs: BigInt(identity.mtimeNs),
  ctimeNs: BigInt(identity.ctimeNs),
});

const validateInputContent = (
  entry: Nhm2SemiclassicalV2RawReplayInputEntryV1,
  bytes: Buffer,
): boolean => {
  if (!MEDIA_TYPE.test(entry.mediaType)) return false;
  const jsonMedia =
    entry.mediaType === "application/json" || entry.mediaType.endsWith("+json");
  if (!jsonMedia) {
    if (entry.mediaType.startsWith("text/")) {
      try {
        return !utf8.decode(bytes).includes("\u0000");
      } catch {
        return false;
      }
    }
    return true;
  }
  try {
    const text = utf8.decode(bytes);
    const parsed = JSON.parse(text) as unknown;
    return canonicalJson(parsed) === text;
  } catch {
    return false;
  }
};

const decodeFloat64Le = (
  file: Nhm2SecureRunOutputReadFileV1,
  expectedSha256: string,
): Float64Array | null => {
  if (file.bytes.byteLength % 8 !== 0 || file.sha256 !== expectedSha256)
    return null;
  const view = new DataView(
    file.bytes.buffer,
    file.bytes.byteOffset,
    file.bytes.byteLength,
  );
  const values = new Float64Array(file.bytes.byteLength / 8);
  for (let index = 0; index < values.length; index += 1) {
    const value = view.getFloat64(index * 8, true);
    if (!Number.isFinite(value)) return null;
    values[index] = value;
  }
  if (values.byteOffset !== 0 || values.byteLength !== values.buffer.byteLength)
    return null;
  const encoded = Buffer.allocUnsafe(values.byteLength);
  const encodedView = new DataView(
    encoded.buffer,
    encoded.byteOffset,
    encoded.byteLength,
  );
  for (let index = 0; index < values.length; index += 1) {
    encodedView.setFloat64(index * 8, values[index], true);
  }
  return sha256(encoded) === expectedSha256 && encoded.equals(file.bytes)
    ? values
    : null;
};

const readbackClosureSha256 = (
  files: readonly Nhm2SemiclassicalV2RunReplayerFileReceipt[],
): string =>
  sha256(
    `nhm2-semiclassical-v2-current-readback/v2\n${canonicalJson(
      [...files]
        .sort((left, right) =>
          Buffer.compare(
            Buffer.from(left.logicalPath),
            Buffer.from(right.logicalPath),
          ),
        )
        .map((file) => ({
          scope: file.scope,
          semanticId: file.semanticId,
          logicalPath: file.logicalPath,
          sha256: file.sha256,
          sizeBytes: file.sizeBytes,
          mediaType: file.mediaType,
          filesystemIdentity: file.filesystemIdentity,
        })),
    )}`,
  );

const asFileReceipt = (input: {
  scope: Nhm2SemiclassicalV2RunReplayerFileReceipt["scope"];
  semanticId: string;
  logicalPath: string;
  mediaType: string;
  encoding: Nhm2SemiclassicalV2RunReplayerFileReceipt["encoding"];
  freshness: Nhm2SemiclassicalV2RunReplayerFileReceipt["freshness"];
  file: Nhm2SecureRunOutputReadFileV1;
}): Nhm2SemiclassicalV2RunReplayerFileReceipt =>
  Object.freeze({
    scope: input.scope,
    semanticId: input.semanticId,
    logicalPath: input.logicalPath,
    relativePath: input.file.relativePath,
    sha256: input.file.sha256,
    sizeBytes: Number(input.file.sizeBytes),
    mediaType: input.mediaType,
    encoding: input.encoding,
    freshness: input.freshness,
    filesystemIdentity: input.file.filesystemIdentity,
  });

const duplicateFilesystemObject = (
  receipts: readonly Nhm2SemiclassicalV2RunReplayerFileReceipt[],
): Nhm2SemiclassicalV2RunReplayerFileReceipt | null => {
  const identities = new Set<string>();
  for (const receipt of receipts) {
    const identity = `${receipt.filesystemIdentity.dev}:${receipt.filesystemIdentity.ino}`;
    if (identities.has(identity)) return receipt;
    identities.add(identity);
  }
  return null;
};

const frozenSnapshot = <T>(value: T): T =>
  JSON.parse(canonicalJson(value)) as T;

/**
 * Reopens a complete single-run semiclassical-v2 filesystem inventory and
 * independently recomputes its calculation metrics from raw Float64 bytes.
 *
 * This boundary deliberately does not interpret a producer freeze declaration,
 * an echoed scientific-preseal identity, or `not_mounted` declarations as
 * authority. A separate trusted preseal persistence receipt and a genuinely
 * independent paired run remain mandatory before lamp promotion.
 */
export async function replayNhm2SemiclassicalV2Run(
  input: Nhm2SemiclassicalV2RunReplayerInput,
): Promise<Nhm2SemiclassicalV2RunReplayResult> {
  if (
    !isPlainRecord(input) ||
    !hasExactKeys(input, ["manifest", "trusted"]) ||
    !isPlainRecord(input.manifest) ||
    !hasExactKeys(input.manifest, [
      "bytes",
      "sha256",
      "sizeBytes",
      "mediaType",
      "relativePath",
      "observedAt",
    ]) ||
    !Buffer.isBuffer(input.manifest.bytes) ||
    typeof input.manifest.sha256 !== "string" ||
    typeof input.manifest.sizeBytes !== "number" ||
    typeof input.manifest.mediaType !== "string" ||
    typeof input.manifest.relativePath !== "string" ||
    typeof input.manifest.observedAt !== "string" ||
    !isPlainRecord(input.trusted) ||
    !hasExactKeys(input.trusted, [
      "manifestFrozenAt",
      "generatedAt",
      "candidate",
      "implementation",
      "execution",
      "scientificPresealBinding",
      "manifestInputClosureSnapshot",
      "roots",
    ]) ||
    typeof input.trusted.manifestFrozenAt !== "string" ||
    typeof input.trusted.generatedAt !== "string" ||
    !isPlainRecord(input.trusted.candidate) ||
    !isPlainRecord(input.trusted.implementation) ||
    !isPlainRecord(input.trusted.execution) ||
    !isPlainRecord(input.trusted.scientificPresealBinding) ||
    !hasExactKeys(
      input.trusted.scientificPresealBinding,
      SCIENTIFIC_PRESEAL_BINDING_KEYS,
    ) ||
    SCIENTIFIC_PRESEAL_BINDING_KEYS.some(
      (key) => typeof input.trusted.scientificPresealBinding[key] !== "string",
    ) ||
    !isPlainRecord(input.trusted.manifestInputClosureSnapshot) ||
    !isPlainRecord(input.trusted.roots) ||
    !hasExactKeys(input.trusted.roots, [
      "scientific",
      "implementation",
      "output",
    ]) ||
    typeof input.trusted.roots.scientific !== "string" ||
    typeof input.trusted.roots.implementation !== "string" ||
    typeof input.trusted.roots.output !== "string"
  ) {
    return failure(
      "replayer_input_invalid",
      "Input keys do not match the exact replay contract.",
    );
  }

  const manifestBytes = Buffer.from(input.manifest.bytes);
  const manifestSha256 = input.manifest.sha256;
  const manifestSizeBytes = input.manifest.sizeBytes;
  const manifestRelativePath = input.manifest.relativePath;
  const manifestObservedAt = input.manifest.observedAt;
  if (
    !SHA256.test(manifestSha256) ||
    !Number.isSafeInteger(manifestSizeBytes) ||
    manifestSizeBytes <= 0 ||
    manifestSizeBytes > NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_MAX_MANIFEST_BYTES ||
    manifestBytes.byteLength !== manifestSizeBytes ||
    sha256(manifestBytes) !== manifestSha256 ||
    input.manifest.mediaType !== "application/json" ||
    portableRelativePath(
      "manifest-root",
      `manifest-root/${manifestRelativePath}`,
    ) == null
  ) {
    return failure(
      "trusted_manifest_binding_invalid",
      "Trusted manifest path, hash, size, media type, or byte binding is invalid.",
      manifestRelativePath,
    );
  }

  let trusted: Nhm2SemiclassicalV2RunReplayerTrustedBindings;
  try {
    trusted = frozenSnapshot(input.trusted);
  } catch {
    return failure(
      "replayer_input_invalid",
      "Trusted bindings are not canonical JSON data.",
    );
  }
  const frozenMs = isoMs(trusted.manifestFrozenAt);
  const generatedMs = isoMs(trusted.generatedAt);
  const startedMs = isoMs(trusted.execution.startedAt);
  const completedMs = isoMs(trusted.execution.completedAt);
  const sealedMs = isoMs(trusted.scientificPresealBinding.sealedAt);
  const manifestObservedMs = isoMs(manifestObservedAt);
  if (
    frozenMs == null ||
    generatedMs == null ||
    startedMs == null ||
    completedMs == null ||
    sealedMs == null ||
    manifestObservedMs == null ||
    completedMs - startedMs !== trusted.execution.durationMs ||
    !(frozenMs < sealedMs) ||
    !(sealedMs < startedMs) ||
    generatedMs < completedMs ||
    manifestObservedMs < generatedMs ||
    trusted.execution.exitCode !== 0 ||
    trusted.execution.terminationSignal !== null
  ) {
    return failure(
      "trusted_execution_interval_invalid",
      "Trusted freeze, scientific-preseal echo, execution, generation, and manifest-observation interval is inconsistent.",
    );
  }

  let manifestText: string;
  let parsed: unknown;
  try {
    manifestText = utf8.decode(manifestBytes);
  } catch {
    return failure(
      "manifest_utf8_invalid",
      "Manifest is not strict UTF-8.",
      manifestRelativePath,
    );
  }
  try {
    parsed = JSON.parse(manifestText) as unknown;
  } catch {
    return failure(
      "manifest_json_invalid",
      "Manifest is not valid JSON.",
      manifestRelativePath,
    );
  }
  try {
    if (canonicalJson(parsed) !== manifestText) {
      return failure(
        "manifest_json_not_canonical",
        "Manifest bytes are not compact, sorted-key canonical JSON.",
        manifestRelativePath,
      );
    }
  } catch {
    return failure(
      "manifest_json_not_canonical",
      "Manifest contains a value forbidden by canonical JSON.",
      manifestRelativePath,
    );
  }
  const structuralViolations =
    nhm2SemiclassicalV2RawReplayManifestViolations(parsed);
  if (structuralViolations.length > 0) {
    return failure(
      "manifest_structural_invalid",
      structuralViolations.join(";"),
      manifestRelativePath,
    );
  }
  const manifest = parsed as Nhm2SemiclassicalV2RawReplayManifestV1;

  try {
    const exactBindings =
      canonicalJson(manifest.candidate) === canonicalJson(trusted.candidate) &&
      canonicalJson(manifest.implementation) ===
        canonicalJson(trusted.implementation) &&
      canonicalJson(manifest.execution) === canonicalJson(trusted.execution) &&
      canonicalJson(manifest.inputClosure.scientificPresealBinding) ===
        canonicalJson(trusted.scientificPresealBinding) &&
      canonicalJson(manifest.inputClosure) ===
        canonicalJson(trusted.manifestInputClosureSnapshot) &&
      manifest.manifestFrozenAt === trusted.manifestFrozenAt &&
      manifest.generatedAt === trusted.generatedAt;
    if (!exactBindings) {
      return failure(
        "trusted_run_binding_mismatch",
        "Manifest candidate, implementation, execution, scientific-preseal producer echo, or current input closure differs from trusted outer-runtime bindings.",
      );
    }
  } catch {
    return failure(
      "trusted_run_binding_mismatch",
      "Trusted binding comparison failed.",
    );
  }

  const roots = trusted.roots;
  if (
    !path.isAbsolute(roots.scientific) ||
    !path.isAbsolute(roots.implementation) ||
    !path.isAbsolute(roots.output) ||
    rootsOverlap(roots.scientific, roots.implementation) ||
    rootsOverlap(roots.scientific, roots.output) ||
    rootsOverlap(roots.implementation, roots.output)
  ) {
    return failure(
      "filesystem_root_topology_invalid",
      "Trusted scientific, implementation, and output roots must be absolute, distinct, and nonnested.",
    );
  }

  const scientificIds = new Set<string>(
    NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS,
  );
  const implementationIds = new Set<string>(
    NHM2_SEMICLASSICAL_V2_RAW_REPLAY_IMPLEMENTATION_INPUT_IDS,
  );
  const scientificEntries = manifest.inputClosure.entries.filter((entry) =>
    scientificIds.has(entry.inputId),
  );
  const implementationEntries = manifest.inputClosure.entries.filter((entry) =>
    implementationIds.has(entry.inputId),
  );
  const inputRelative = new Map<string, string>();
  for (const entry of scientificEntries) {
    const relative = portableRelativePath(
      manifest.inputClosure.scientificRootDirectory,
      entry.path,
    );
    if (relative == null) {
      return failure(
        "logical_path_binding_invalid",
        "Scientific input path is outside its logical root.",
        entry.path,
      );
    }
    inputRelative.set(entry.path, relative);
  }
  for (const entry of implementationEntries) {
    const relative = portableRelativePath(
      manifest.inputClosure.implementationRootDirectory,
      entry.path,
    );
    if (relative == null) {
      return failure(
        "logical_path_binding_invalid",
        "Implementation input path is outside its logical root.",
        entry.path,
      );
    }
    inputRelative.set(entry.path, relative);
  }

  const outputArrays =
    collectNhm2SemiclassicalV2RawReplayOutputArrays(manifest);
  const declaredSizes = [
    manifestSizeBytes,
    ...manifest.inputClosure.entries.map((entry) => entry.sizeBytes),
    ...outputArrays.map((entry) => entry.sizeBytes),
  ];
  let declaredAggregateBytes = 0n;
  for (const size of declaredSizes) {
    const exactSize = BigInt(size);
    if (
      exactSize <= 0n ||
      exactSize > NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_MAX_FILE_BYTES
    ) {
      return failure(
        "filesystem_resource_limit_exceeded",
        "A declared file exceeds the immutable single-run replay file-size ceiling.",
      );
    }
    declaredAggregateBytes += exactSize;
    if (
      declaredAggregateBytes >
      NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_MAX_AGGREGATE_BYTES
    ) {
      return failure(
        "filesystem_resource_limit_exceeded",
        "The complete scientific, toolchain, output, and manifest inventory exceeds the immutable aggregate replay ceiling.",
      );
    }
  }
  if (
    manifest.candidate.sampleCount <
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumSampleCount ||
    manifest.candidate.sampleCount >
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.maximumSampleCount
  ) {
    return failure(
      "filesystem_resource_limit_exceeded",
      "Candidate sample count is outside the immutable server-owned replay policy.",
    );
  }
  const outputRelative = new Map<string, string>();
  for (const descriptor of outputArrays) {
    const relative = portableRelativePath(
      manifest.execution.outputDirectory,
      descriptor.path,
    );
    if (relative == null || relative === manifestRelativePath) {
      return failure(
        "logical_path_binding_invalid",
        "Output array path is outside its logical root or collides with the manifest.",
        descriptor.path,
      );
    }
    outputRelative.set(descriptor.path, relative);
  }

  let scientificRead: Nhm2SecureRunOutputReadResultV1;
  let implementationRead: Nhm2SecureRunOutputReadResultV1;
  let outputRead: Nhm2SecureRunOutputReadResultV1;
  try {
    [scientificRead, implementationRead, outputRead] = await Promise.all([
      readNhm2SecureRunOutputs({
        runDirectory: roots.scientific,
        files: scientificEntries.map((entry) => ({
          relativePath: inputRelative.get(entry.path)!,
          expectedSha256: entry.sha256,
          expectedSizeBytes: BigInt(entry.sizeBytes),
          decode:
            entry.inputId === "metric_demand_tensor" ||
            entry.inputId === "metric_demand_absolute_error_bound"
              ? { kind: "float64_le" as const, shape: entry.shape }
              : { kind: "bytes" as const },
        })),
        maxFileBytes: NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_MAX_FILE_BYTES,
        maxAggregateBytes:
          NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_MAX_AGGREGATE_BYTES,
      }),
      readNhm2SecureRunOutputs({
        runDirectory: roots.implementation,
        files: implementationEntries.map((entry) => ({
          relativePath: inputRelative.get(entry.path)!,
          expectedSha256: entry.sha256,
          expectedSizeBytes: BigInt(entry.sizeBytes),
          decode: { kind: "bytes" as const },
        })),
        maxFileBytes: NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_MAX_FILE_BYTES,
        maxAggregateBytes:
          NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_MAX_AGGREGATE_BYTES,
      }),
      readNhm2SecureRunOutputs({
        runDirectory: roots.output,
        files: [
          {
            relativePath: manifestRelativePath,
            expectedSha256: manifestSha256,
            expectedSizeBytes: BigInt(manifestSizeBytes),
            decode: { kind: "bytes" as const },
          },
          ...outputArrays.map((descriptor) => ({
            relativePath: outputRelative.get(descriptor.path)!,
            expectedSha256: descriptor.sha256,
            expectedSizeBytes: BigInt(descriptor.sizeBytes),
            decode: { kind: "float64_le" as const, shape: descriptor.shape },
          })),
        ],
        maxFileBytes: NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_MAX_FILE_BYTES,
        maxAggregateBytes:
          NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_MAX_AGGREGATE_BYTES,
      }),
    ]);
  } catch (error) {
    const detail =
      error instanceof Nhm2SecureRunOutputReaderError
        ? `${error.code}:${error.message}`
        : error instanceof Error
          ? error.message
          : "unknown_secure_reader_failure";
    const filePath =
      error instanceof Nhm2SecureRunOutputReaderError
        ? error.relativePath
        : null;
    return failure("secure_filesystem_read_failed", detail, filePath);
  }

  if (
    rootsOverlap(
      scientificRead.runDirectoryRealPath,
      implementationRead.runDirectoryRealPath,
    ) ||
    rootsOverlap(
      scientificRead.runDirectoryRealPath,
      outputRead.runDirectoryRealPath,
    ) ||
    rootsOverlap(
      implementationRead.runDirectoryRealPath,
      outputRead.runDirectoryRealPath,
    )
  ) {
    return failure(
      "filesystem_root_topology_invalid",
      "Resolved filesystem roots alias or nest despite distinct trusted spellings.",
    );
  }

  const manifestFile = outputRead.files.find(
    (file) => file.relativePath === manifestRelativePath,
  );
  if (
    manifestFile == null ||
    manifestFile.sha256 !== manifestSha256 ||
    manifestFile.sizeBytes !== BigInt(manifestSizeBytes) ||
    !manifestFile.bytes.equals(manifestBytes)
  ) {
    return failure(
      "manifest_filesystem_readback_mismatch",
      "Manifest reopened from the exact output inventory differs from trusted bytes.",
      manifestRelativePath,
    );
  }

  const scientificFiles = new Map<string, Nhm2SecureRunOutputReadFileV1>(
    scientificRead.files.map((file) => [file.relativePath, file] as const),
  );
  const implementationFiles = new Map<string, Nhm2SecureRunOutputReadFileV1>(
    implementationRead.files.map((file) => [file.relativePath, file] as const),
  );
  const outputFiles = new Map<string, Nhm2SecureRunOutputReadFileV1>(
    outputRead.files.map((file) => [file.relativePath, file] as const),
  );
  const entryById = new Map<string, Nhm2SemiclassicalV2RawReplayInputEntryV1>(
    manifest.inputClosure.entries.map(
      (entry) => [entry.inputId, entry] as const,
    ),
  );
  const fileReceipts: Nhm2SemiclassicalV2RunReplayerFileReceipt[] = [];
  const startedNs = toNs(startedMs);
  // This is only a consistency check on the producer's current staged-input
  // snapshot. Its ctime may legitimately be later than candidate freeze, but
  // the producer echo is not the separate trusted persistence receipt needed
  // to establish a pre-execution scientific seal.
  for (const entry of manifest.inputClosure.entries) {
    const relative = inputRelative.get(entry.path)!;
    const scientific = scientificIds.has(entry.inputId);
    const file = (scientific ? scientificFiles : implementationFiles).get(
      relative,
    );
    if (file == null) {
      return failure(
        "secure_filesystem_read_failed",
        "Current input is absent after exact inventory read.",
        entry.path,
      );
    }
    if (!MEDIA_TYPE.test(entry.mediaType)) {
      return failure(
        "input_media_type_invalid",
        "Input media type is invalid.",
        entry.path,
      );
    }
    if (!validateInputContent(entry, file.bytes)) {
      return failure(
        "input_media_content_invalid",
        "Input bytes do not satisfy their bound media type.",
        entry.path,
      );
    }
    const observedMs = isoMs(entry.observedAt);
    if (observedMs == null) {
      return failure(
        "input_current_metadata_incompatible_with_freeze",
        "Input observation timestamp is invalid.",
        entry.path,
      );
    }
    const times = identityTimes(file.filesystemIdentity);
    const observedNs = toNs(observedMs);
    if (
      times.mtimeNs > observedNs ||
      times.ctimeNs > observedNs ||
      times.mtimeNs >= startedNs ||
      times.ctimeNs >= startedNs
    ) {
      return failure(
        "input_current_metadata_incompatible_with_freeze",
        "Current input metadata is later than its declared observation or is not strictly pre-execution; no pre-execution seal is inferred even when compatible.",
        entry.path,
      );
    }
    if (
      entry.inputId === "tolerance_policy" &&
      !file.bytes.equals(
        Buffer.from(
          NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CANONICAL_JSON,
          "utf8",
        ),
      )
    ) {
      return failure(
        "approved_policy_bytes_mismatch",
        "Tolerance-policy input is not the server-owned canonical policy bytes.",
        entry.path,
      );
    }
    fileReceipts.push(
      asFileReceipt({
        scope: scientific ? "scientific_input" : "implementation_input",
        semanticId: entry.inputId,
        logicalPath: entry.path,
        mediaType: entry.mediaType,
        encoding:
          entry.inputId === "metric_demand_tensor" ||
          entry.inputId === "metric_demand_absolute_error_bound"
            ? "raw_ieee754_float64_little_endian"
            : "bytes",
        freshness:
          "snapshot_bytes_match_manifest_metadata_compatible_not_presealed",
        file,
      }),
    );
  }

  const completedNs = toNs(completedMs);
  const decodedByLogicalPath = new Map<string, Float64Array>();
  for (const descriptor of outputArrays) {
    const relative = outputRelative.get(descriptor.path)!;
    const file = outputFiles.get(relative);
    if (file == null) {
      return failure(
        "array_mapping_invalid",
        "Output array is absent after exact inventory read.",
        descriptor.path,
      );
    }
    const times = identityTimes(file.filesystemIdentity);
    if (
      times.mtimeNs < startedNs ||
      times.ctimeNs < startedNs ||
      times.mtimeNs > completedNs ||
      times.ctimeNs > completedNs
    ) {
      return failure(
        "output_freshness_outside_execution_interval",
        "Output array metadata is not wholly inside the trusted execution interval.",
        descriptor.path,
      );
    }
    const values = decodeFloat64Le(file, descriptor.sha256);
    if (values == null) {
      return failure(
        "float64_reencoding_mismatch",
        "Float64 LE decoding did not round-trip to the exact bound bytes.",
        descriptor.path,
      );
    }
    decodedByLogicalPath.set(descriptor.path, values);
    fileReceipts.push(
      asFileReceipt({
        scope: "run_output",
        semanticId: descriptor.role,
        logicalPath: descriptor.path,
        mediaType: "application/vnd.nhm2.raw-float64-le",
        encoding: "raw_ieee754_float64_little_endian",
        freshness: "created_or_modified_within_trusted_execution_interval",
        file,
      }),
    );
  }

  const manifestTimes = identityTimes(manifestFile.filesystemIdentity);
  const generatedNs = toNs(generatedMs);
  const manifestObservedNs = toNs(manifestObservedMs);
  if (
    manifestTimes.mtimeNs < generatedNs ||
    manifestTimes.ctimeNs < generatedNs ||
    manifestTimes.mtimeNs > manifestObservedNs ||
    manifestTimes.ctimeNs > manifestObservedNs ||
    generatedNs > manifestObservedNs
  ) {
    return failure(
      "manifest_freshness_outside_observation_interval",
      "Manifest metadata is not between its trusted generation instant and outer-runtime observation.",
      manifestRelativePath,
    );
  }
  fileReceipts.push(
    asFileReceipt({
      scope: "manifest",
      semanticId: "raw_replay_manifest",
      logicalPath: `${manifest.execution.outputDirectory}/${manifestRelativePath}`,
      mediaType: "application/json",
      encoding: "bytes",
      freshness: "created_or_modified_post_execution_before_observation",
      file: manifestFile,
    }),
  );

  const aliasedFile = duplicateFilesystemObject(fileReceipts);
  if (aliasedFile != null) {
    return failure(
      "filesystem_object_alias_detected",
      "Two declared semantic files resolve to the same filesystem device/inode identity.",
      aliasedFile.logicalPath,
    );
  }

  const metricEntry = entryById.get("metric_demand_tensor");
  const metricFile =
    metricEntry == null
      ? null
      : scientificFiles.get(inputRelative.get(metricEntry.path) ?? "");
  if (metricEntry == null || metricFile == null) {
    return failure(
      "array_mapping_invalid",
      "Metric-demand input bytes are unavailable.",
    );
  }
  const metricDemand = decodeFloat64Le(metricFile, metricEntry.sha256);
  if (metricDemand == null) {
    return failure(
      "float64_decode_invalid",
      "Metric-demand Float64 input failed exact decoding.",
      metricEntry.path,
    );
  }
  const metricErrorEntry = entryById.get("metric_demand_absolute_error_bound");
  const metricErrorFile =
    metricErrorEntry == null
      ? null
      : scientificFiles.get(inputRelative.get(metricErrorEntry.path) ?? "");
  if (metricErrorEntry == null || metricErrorFile == null) {
    return failure(
      "array_mapping_invalid",
      "Metric-demand deterministic error-bound input bytes are unavailable.",
    );
  }
  const metricDemandAbsoluteErrorBound = decodeFloat64Le(
    metricErrorFile,
    metricErrorEntry.sha256,
  );
  if (metricDemandAbsoluteErrorBound == null) {
    return failure(
      "float64_decode_invalid",
      "Metric-demand deterministic error-bound Float64 input failed exact decoding.",
      metricErrorEntry.path,
    );
  }

  const array = (
    descriptor: Nhm2SemiclassicalV2RawReplayArrayV1,
  ): Float64Array => {
    const value = decodedByLogicalPath.get(descriptor.path);
    if (value == null)
      throw new Error(`missing_decoded_array:${descriptor.path}`);
    return value;
  };
  const t = NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.tolerances;
  const geometry = entryById.get("geometry")!;
  const quantumState = entryById.get("quantum_state")!;
  const chart = entryById.get("chart")!;
  const normalization = entryById.get("normalization")!;
  const policy: Nhm2SemiclassicalV2ContentReplayPolicy = Object.freeze({
    policyId: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
    candidateId: manifest.candidate.candidateId,
    geometrySha256: geometry.sha256,
    quantumStateSha256: quantumState.sha256,
    chartId: manifest.candidate.chartId,
    chartSha256: chart.sha256,
    normalizationId: manifest.candidate.normalizationId,
    normalizationSha256: normalization.sha256,
    sourceTensorProvenance: "state_derived_not_declared_lever",
    declaredLeverTensorUsed: false,
    manifestDeclaresFrozenBeforeExecution: true,
    sampleCount: manifest.candidate.sampleCount,
    regulatorLevelCount: manifest.arrays.regulatorLevels.length,
    noisePsdToleranceSI: t.psdNegativeEigenvalueSI,
    noiseExchangeToleranceSI: t.exchangeSymmetryUpper95SI,
    fluctuationRatioTolerance: t.fluctuationToMeanRatioUpper95,
    meanNormalizationFloorSI: t.meanNormalizationFloorSI,
    meanMetricDemandRelativeUpper95Tolerance:
      t.meanMetricDemandPointwiseRelativeUpper95,
    maximumMetricDemandRelativeErrorBound: t.metricDemandRelativeErrorBound,
    metricDemandDerivationStatus:
      "metric_demand_derivation_executor_provenance_unverified",
    metricDemandIntervalTraceStatus: "interval_trace_not_server_replayed",
    minimumMetricDemandFrobeniusSI:
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumMetricDemandFrobeniusSI,
    requiredMetricDemandSampleFraction:
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.requiredMetricDemandSampleFraction,
    smearingWeightNormalizationTolerance: t.smearingWeightSumAbsolute,
    bracketResidualTolerance: t.bracketResidualUpper95,
    antisymmetryResidualTolerance: t.antisymmetryResidualUpper95,
    jacobiResidualTolerance: t.jacobiResidualUpper95,
    regulatorFinalResidualTolerance: t.regulatorResidualUpper95,
    producerResidualConsistencyTolerance: t.float64RecomputeAbsolute,
    regulatorMonotonicityTolerance: t.regulatorMonotonicityAbsolute,
    minimumRegulatorConvergenceOrder: t.minimumRegulatorConvergenceOrder,
  });

  let replay: Nhm2SemiclassicalV2ContentReplayResult;
  try {
    const brackets = Object.fromEntries(
      manifest.arrays.brackets.map((entry) => [
        entry.bracketId,
        {
          computed: array(entry.computed),
          classicalTarget: array(entry.target),
          producerResidual: array(entry.residual),
          absoluteUncertainty95: array(entry.absoluteUncertainty95),
        },
      ]),
    ) as Nhm2SemiclassicalV2ContentReplayInput["arrays"]["brackets"];
    replay = replayNhm2SemiclassicalV2Content({
      policy,
      arrays: {
        noiseKernel: array(manifest.arrays.noiseKernel),
        noiseAbsoluteUncertainty95: array(
          manifest.arrays.noiseKernelAbsoluteUncertainty95,
        ),
        meanStressTensor: array(manifest.arrays.meanRset),
        meanStressAbsoluteUncertainty95: array(
          manifest.arrays.meanRsetAbsoluteUncertainty95,
        ),
        metricDemandRset: metricDemand,
        metricDemandAbsoluteErrorBound,
        meanSmearingWeights: array(manifest.arrays.smearingWeights),
        brackets,
        antisymmetry: {
          forward: array(manifest.arrays.antisymmetry.forward),
          reverse: array(manifest.arrays.antisymmetry.reverse),
          producerResidual: array(manifest.arrays.antisymmetry.residual),
          absoluteUncertainty95: array(
            manifest.arrays.antisymmetry.absoluteUncertainty95,
          ),
        },
        jacobi: {
          first: array(manifest.arrays.jacobi.term1),
          second: array(manifest.arrays.jacobi.term2),
          third: array(manifest.arrays.jacobi.term3),
          producerResidual: array(manifest.arrays.jacobi.residual),
          absoluteUncertainty95: array(
            manifest.arrays.jacobi.absoluteUncertainty95,
          ),
        },
        regulator: {
          levels: manifest.arrays.regulatorLevels.map((level) => ({
            scale: level.scale,
            residual: array(level.residual),
            absoluteUncertainty95: array(level.absoluteUncertainty95),
          })),
        },
      },
    });
  } catch (error) {
    return failure(
      "content_replay_internal_error",
      error instanceof Error ? error.message : "unknown_content_replay_failure",
    );
  }

  const receipts = Object.freeze(
    [...fileReceipts].sort((left, right) =>
      Buffer.compare(
        Buffer.from(left.logicalPath),
        Buffer.from(right.logicalPath),
      ),
    ),
  );
  return Object.freeze({
    contractVersion: NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION,
    serverOwned: true,
    diagnosticOnly: true,
    verificationState: "bounded_filesystem_snapshots_replayed",
    calculationDisposition: replay.status,
    candidateDisposition:
      replay.status === "pass"
        ? "single_run_replay_only"
        : replay.status === "fail"
          ? "fail"
          : "blocked",
    manifest: Object.freeze({
      relativePath: manifestRelativePath,
      sha256: manifestSha256,
      sizeBytes: manifestSizeBytes,
      mediaType: "application/json" as const,
      canonicalJsonVerified: true as const,
      structuralContractVerified: true as const,
      filesystemReadbackVerified: true as const,
    }),
    provenance: Object.freeze({
      commitSha: manifest.execution.commitSha,
      command: manifest.execution.command,
      argv: Object.freeze([...manifest.execution.argv]),
      workingDirectory: manifest.execution.workingDirectory,
      startedAt: manifest.execution.startedAt,
      completedAt: manifest.execution.completedAt,
      durationMs: manifest.execution.durationMs,
      manifestObservedAt,
      scientificPresealBinding: Object.freeze({
        ...manifest.inputClosure.scientificPresealBinding,
      }),
      scientificPresealBindingStatus:
        "producer_echo_matches_trusted_binding_not_persistence_receipt",
      scientificClosureSha256: manifest.inputClosure.scientificClosureSha256,
      completeClosureSha256: manifest.inputClosure.completeClosureSha256,
      files: receipts,
      readbackClosureSha256: readbackClosureSha256(receipts),
    }),
    replay,
    authorityState: "blocked_pending_preseal_and_independent_reproduction",
    authorityBlockers: Object.freeze([
      ...NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_AUTHORITY_BLOCKERS,
    ]),
    claimLocks: Object.freeze({
      boundedFilesystemSnapshotReadbackEstablished: true,
      currentGlobalFilesystemStateEstablished: false,
      serverAuthorizedRootsVerified: false,
      sameUserMutationExclusionVerified: false,
      contentReplayCalculationCompleted: true,
      ...CLAIM_LOCKS_BASE,
    }),
    violations: Object.freeze([] as const),
  });
}
