import { createHash } from "node:crypto";
import { constants as fsConstants, type BigIntStats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CANONICAL_JSON,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
  NHM2_SEMICLASSICAL_V2_ORTHONORMAL_SYMMETRIC_TENSOR_MULTIPLICITIES,
} from "../../../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ALGORITHM_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_FORMULA_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RECEIPT_CLAIM_LOCKS,
  canonicalNhm2SemiclassicalV2ScientificCandidateManifestJson,
  computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256,
  isNhm2SemiclassicalV2ScientificCandidateManifest,
  nhm2SemiclassicalV2ScientificCandidateManifestViolations,
  type Nhm2SemiclassicalV2ScientificCandidateManifestV1,
  type Nhm2SemiclassicalV2ScientificNonSelfInputId,
  type Nhm2SemiclassicalV2MetricDemandDerivationReceiptV1,
} from "../../../shared/contracts/nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONZERO_SCREEN_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_AUTHORITY,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONSUMER_SCOPE,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
  computeNhm2SemiclassicalV2ScientificContentSha256,
  computeNhm2SemiclassicalV2ScientificSealKey,
  computeNhm2SemiclassicalV2SealedInventorySha256,
  isNhm2SemiclassicalV2ScientificPreseal,
  nhm2SemiclassicalV2ScientificPresealCandidateBindingViolations,
  type Nhm2SemiclassicalV2ScientificPresealPlanV1,
  type Nhm2SemiclassicalV2ScientificPresealStagedInputV1,
  type Nhm2SemiclassicalV2ScientificPresealV1,
} from "../../../shared/contracts/nhm2-semiclassical-v2-scientific-preseal.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "../../../shared/contracts/nhm2-semiclassical-state-realizability.v1";
import {
  Nhm2SecureRunOutputReaderError,
  readNhm2SecureRunOutputs,
  type Nhm2SecureRunOutputFilesystemIdentityV1,
  type Nhm2SecureRunOutputReadFileV1,
} from "./nhm2-secure-run-output-reader";
import { createTheoryRuntimeJsonFile } from "./runtime-atomic-json-store";

export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_RELATIVE_PATH =
  "candidate/scientific-candidate-manifest.v1.json" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RELATIVE_PATH =
  "scientific-preseal.v1.json" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_ARTIFACT_ID =
  "nhm2.semiclassical_v2_scientific_preseal_server_receipt" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_scientific_preseal_server_receipt/v2" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_MAX_PERSISTED_BYTES =
  4n * 1024n * 1024n;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_HASH_ALGORITHM =
  "sha256" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_CANONICALIZATION =
  "utf8_lexicographic_object_keys_json_v1" as const;

export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_LOCKS =
  Object.freeze({
    executionChronologyEstablished: false as const,
    serverAuthorizedRootLeaseEstablished: false as const,
    sameUserMutationExclusionEstablished: false as const,
    osReadOnlyIsolationEstablished: false as const,
    notMountedIsolationEstablished: false as const,
    independentExecutionEstablished: false as const,
    independentAgreementEstablished: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export type Nhm2SemiclassicalV2ScientificPresealerErrorCode =
  | "presealer_input_invalid"
  | "candidate_manifest_invalid"
  | "source_scientific_inventory_invalid"
  | "source_candidate_bytes_not_canonical"
  | "approved_policy_bytes_mismatch"
  | "metric_demand_nondegeneracy_failed"
  | "sealed_scientific_root_exists"
  | "sealed_scientific_root_invalid"
  | "sealed_scientific_root_stage_failed"
  | "staged_scientific_inventory_invalid"
  | "staged_scientific_bytes_mismatch"
  | "scientific_preseal_invalid"
  | "scientific_preseal_output_invalid"
  | "scientific_preseal_second_seal_conflict";

export class Nhm2SemiclassicalV2ScientificPresealerError extends Error {
  readonly code: Nhm2SemiclassicalV2ScientificPresealerErrorCode;
  readonly detailCode: string | null;

  constructor(
    code: Nhm2SemiclassicalV2ScientificPresealerErrorCode,
    message: string,
    options: { cause?: unknown; detailCode?: string | null } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "Nhm2SemiclassicalV2ScientificPresealerError";
    this.code = code;
    this.detailCode = options.detailCode ?? null;
  }
}

export type Nhm2SemiclassicalV2ScientificPresealServerReceiptV1 = {
  readonly artifactId: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_ARTIFACT_ID;
  readonly contractVersion: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_CONTRACT_VERSION;
  readonly authority: "server_observed_persistence_readback";
  readonly persistenceState:
    "created_exclusively" | "exact_idempotent_readback";
  readonly sealKey: string;
  readonly sealedAt: string;
  readonly persistenceObservedAt: string;
  readonly artifact: {
    readonly absolutePath: string;
    readonly sha256: string;
    readonly sizeBytes: string;
    readonly filesystemIdentity: Nhm2SecureRunOutputFilesystemIdentityV1;
  };
  readonly locks: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_LOCKS;
  readonly receiptHashAlgorithm: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_HASH_ALGORITHM;
  readonly receiptCanonicalization: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_CANONICALIZATION;
  /** SHA-256 over the canonical receipt with only this field omitted. */
  readonly receiptSha256: string;
};

export type PresealNhm2SemiclassicalV2ScientificCandidateInput = {
  /** Parsed candidate whose canonical serialization must be the exact source file. */
  candidateManifest: unknown;
  /** Absolute directory containing exactly the canonical twenty-one science files. */
  sourceScientificRootDirectory: string;
  /** Absolute server workspace against which the portable sealed root is resolved. */
  workspaceDirectory: string;
  /** Portable root written into the preseal and shared by both run plans. */
  sealedScientificRootDirectory: string;
  /** Dedicated absolute directory containing only the persisted preseal file. */
  presealOutputDirectory: string;
  runPlans: readonly [
    Nhm2SemiclassicalV2ScientificPresealPlanV1,
    Nhm2SemiclassicalV2ScientificPresealPlanV1,
  ];
  /** Server clock dependency. Tests may supply a deterministic clock. */
  now?: () => Date;
};

export type PresealNhm2SemiclassicalV2ScientificCandidateResult = {
  readonly preseal: Nhm2SemiclassicalV2ScientificPresealV1;
  readonly receipt: Nhm2SemiclassicalV2ScientificPresealServerReceiptV1;
  readonly sourceScientificRootRealPath: string;
  readonly sealedScientificRootRealPath: string;
};

type MetricDemandScreen =
  Nhm2SemiclassicalV2ScientificPresealV1["metricDemandNondegeneracy"];
type MetricDemandDerivationBinding =
  Nhm2SemiclassicalV2ScientificPresealV1["metricDemandDerivationBinding"];

const fail = (
  code: Nhm2SemiclassicalV2ScientificPresealerErrorCode,
  message: string,
  options: { cause?: unknown; detailCode?: string | null } = {},
): never => {
  throw new Nhm2SemiclassicalV2ScientificPresealerError(code, message, options);
};

const isAlreadyPresent = (error: unknown): boolean =>
  ["EEXIST", "ENOTEMPTY", "EPERM"].includes(
    (error as NodeJS.ErrnoException)?.code ?? "",
  );
const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");
const samePath = (left: string, right: string): boolean =>
  process.platform === "win32"
    ? left.toLocaleLowerCase("en-US") === right.toLocaleLowerCase("en-US")
    : left === right;
const pathsOverlap = (left: string, right: string): boolean => {
  const normalizedLeft = path.resolve(left);
  const normalizedRight = path.resolve(right);
  const relativeLeft = path.relative(normalizedLeft, normalizedRight);
  const relativeRight = path.relative(normalizedRight, normalizedLeft);
  return (
    samePath(normalizedLeft, normalizedRight) ||
    (relativeLeft !== "" &&
      relativeLeft !== ".." &&
      !relativeLeft.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativeLeft)) ||
    (relativeRight !== "" &&
      relativeRight !== ".." &&
      !relativeRight.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativeRight))
  );
};
const isPortableRelativePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 1024 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !value.startsWith("/") &&
  !/^[A-Za-z]:/.test(value) &&
  !value.includes("//") &&
  value
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
const nowIso = (clock: () => Date, label: string): string => {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    return fail(
      "presealer_input_invalid",
      "The server clock returned an invalid Date.",
    );
  }
  if (value.getTime() > Date.now()) {
    return fail(
      "scientific_preseal_invalid",
      `${label} cannot be supplied from a future clock reading.`,
    );
  }
  return value.toISOString();
};
const jsonFileBytes = (value: unknown): Buffer =>
  Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");

const utf8Compare = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  value != null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);
const hasExactStringKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Reflect.ownKeys(value);
  return (
    actual.every((key) => typeof key === "string") &&
    isDeepStrictEqual(
      (actual as string[]).sort(utf8Compare),
      [...expected].sort(utf8Compare),
    )
  );
};
const isCanonicalUnsignedDecimal = (value: unknown): value is string =>
  typeof value === "string" && /^(?:0|[1-9][0-9]*)$/.test(value);
const isExactIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
};

const canonicalReceiptJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical receipt values must be finite.");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalReceiptJson).join(",")}]`;
  }
  if (typeof value !== "object") {
    throw new TypeError("Canonical receipt values must be JSON values.");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("Canonical receipt objects must be plain records.");
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    throw new TypeError(
      "Canonical receipt objects cannot contain symbol keys.",
    );
  }
  return `{${(keys as string[])
    .sort(utf8Compare)
    .map(
      (key) =>
        `${JSON.stringify(key)}:${canonicalReceiptJson(
          (value as Record<string, unknown>)[key],
        )}`,
    )
    .join(",")}}`;
};

type Nhm2SemiclassicalV2ScientificPresealUnsignedServerReceiptV1 = Omit<
  Nhm2SemiclassicalV2ScientificPresealServerReceiptV1,
  "receiptSha256"
>;

export const computeNhm2SemiclassicalV2ScientificPresealServerReceiptSha256 = (
  receipt: Nhm2SemiclassicalV2ScientificPresealUnsignedServerReceiptV1,
): string => sha256(Buffer.from(canonicalReceiptJson(receipt), "utf8"));

export const hasValidNhm2SemiclassicalV2ScientificPresealServerReceiptIntegrity =
  (
    receipt: unknown,
  ): receipt is Nhm2SemiclassicalV2ScientificPresealServerReceiptV1 => {
    if (!isPlainRecord(receipt)) return false;
    const record = receipt;
    const expectedKeys = [
      "artifact",
      "artifactId",
      "authority",
      "contractVersion",
      "locks",
      "persistenceObservedAt",
      "persistenceState",
      "receiptCanonicalization",
      "receiptHashAlgorithm",
      "receiptSha256",
      "sealKey",
      "sealedAt",
    ].sort(utf8Compare);
    const artifact = record.artifact;
    const filesystemIdentity = isPlainRecord(artifact)
      ? artifact.filesystemIdentity
      : null;
    if (
      !hasExactStringKeys(record, expectedKeys) ||
      record.artifactId !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_ARTIFACT_ID ||
      record.contractVersion !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_CONTRACT_VERSION ||
      record.authority !== "server_observed_persistence_readback" ||
      (record.persistenceState !== "created_exclusively" &&
        record.persistenceState !== "exact_idempotent_readback") ||
      record.receiptHashAlgorithm !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_HASH_ALGORITHM ||
      record.receiptCanonicalization !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_CANONICALIZATION ||
      typeof record.receiptSha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(record.receiptSha256) ||
      /^0{64}$/.test(record.receiptSha256) ||
      typeof record.sealKey !== "string" ||
      !/^[a-f0-9]{64}$/.test(record.sealKey) ||
      /^0{64}$/.test(record.sealKey) ||
      !isExactIsoTimestamp(record.sealedAt) ||
      !isExactIsoTimestamp(record.persistenceObservedAt) ||
      Date.parse(record.sealedAt) >= Date.parse(record.persistenceObservedAt) ||
      !isPlainRecord(artifact) ||
      !hasExactStringKeys(artifact, [
        "absolutePath",
        "filesystemIdentity",
        "sha256",
        "sizeBytes",
      ]) ||
      typeof artifact.absolutePath !== "string" ||
      !path.isAbsolute(artifact.absolutePath) ||
      path.resolve(artifact.absolutePath) !== artifact.absolutePath ||
      typeof artifact.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(artifact.sha256) ||
      /^0{64}$/.test(artifact.sha256) ||
      !isCanonicalUnsignedDecimal(artifact.sizeBytes) ||
      BigInt(artifact.sizeBytes) <= 0n ||
      BigInt(artifact.sizeBytes) >
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_MAX_PERSISTED_BYTES ||
      !isPlainRecord(filesystemIdentity) ||
      !hasExactStringKeys(filesystemIdentity, [
        "ctimeNs",
        "dev",
        "ino",
        "mtimeNs",
        "sizeBytes",
      ]) ||
      !isCanonicalUnsignedDecimal(filesystemIdentity.dev) ||
      !isCanonicalUnsignedDecimal(filesystemIdentity.ino) ||
      !isCanonicalUnsignedDecimal(filesystemIdentity.sizeBytes) ||
      !isCanonicalUnsignedDecimal(filesystemIdentity.mtimeNs) ||
      !isCanonicalUnsignedDecimal(filesystemIdentity.ctimeNs) ||
      filesystemIdentity.sizeBytes !== artifact.sizeBytes ||
      !isDeepStrictEqual(
        record.locks,
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_LOCKS,
      )
    ) {
      return false;
    }
    const { receiptSha256, ...unsigned } = record;
    try {
      return (
        receiptSha256 ===
        computeNhm2SemiclassicalV2ScientificPresealServerReceiptSha256(
          unsigned as Nhm2SemiclassicalV2ScientificPresealUnsignedServerReceiptV1,
        )
      );
    } catch {
      return false;
    }
  };

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.freeze(value);
};

const assertStrictChronology = (input: {
  candidateFrozenAt: string;
  sealedAt: string;
  persistenceObservedAt?: string;
}): void => {
  const candidateFrozenAt = Date.parse(input.candidateFrozenAt);
  const sealedAt = Date.parse(input.sealedAt);
  const persistenceObservedAt =
    input.persistenceObservedAt == null
      ? null
      : Date.parse(input.persistenceObservedAt);
  if (
    !Number.isFinite(candidateFrozenAt) ||
    !Number.isFinite(sealedAt) ||
    candidateFrozenAt >= sealedAt ||
    (persistenceObservedAt != null &&
      (!Number.isFinite(persistenceObservedAt) ||
        sealedAt >= persistenceObservedAt))
  ) {
    fail(
      "scientific_preseal_invalid",
      "Chronology must satisfy candidateFrozenAt < sealedAt < persistenceObservedAt.",
    );
  }
};

const assertAbsoluteDirectoryInput = (
  value: unknown,
  label: string,
): string => {
  if (
    typeof value !== "string" ||
    !path.isAbsolute(value) ||
    path.parse(path.resolve(value)).root === path.resolve(value)
  ) {
    return fail(
      "presealer_input_invalid",
      `${label} must be a non-root absolute path.`,
    );
  }
  return path.resolve(value);
};

const validateInput = (
  input: PresealNhm2SemiclassicalV2ScientificCandidateInput,
): {
  candidate: Nhm2SemiclassicalV2ScientificCandidateManifestV1;
  sourceRoot: string;
  sealedRoot: string;
  outputRoot: string;
  outputPath: string;
  sealedScientificRootDirectory: string;
  runPlans: readonly [
    Nhm2SemiclassicalV2ScientificPresealPlanV1,
    Nhm2SemiclassicalV2ScientificPresealPlanV1,
  ];
  clock: () => Date;
} => {
  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    return fail(
      "presealer_input_invalid",
      "Presealer input must be an object.",
    );
  }
  if (
    !isNhm2SemiclassicalV2ScientificCandidateManifest(input.candidateManifest)
  ) {
    return fail(
      "candidate_manifest_invalid",
      `Candidate manifest is invalid: ${nhm2SemiclassicalV2ScientificCandidateManifestViolations(
        input.candidateManifest,
      ).join(", ")}.`,
    );
  }
  if (!isPortableRelativePath(input.sealedScientificRootDirectory)) {
    return fail(
      "presealer_input_invalid",
      "sealedScientificRootDirectory must be a portable relative path.",
    );
  }
  if (
    !Array.isArray(input.runPlans) ||
    input.runPlans.length !== 2 ||
    input.runPlans.some((plan) => plan == null || typeof plan !== "object")
  ) {
    return fail(
      "presealer_input_invalid",
      "Exactly two run plans are required.",
    );
  }
  if (input.now != null && typeof input.now !== "function") {
    return fail(
      "presealer_input_invalid",
      "now must be a server clock function.",
    );
  }
  const candidate = JSON.parse(
    canonicalNhm2SemiclassicalV2ScientificCandidateManifestJson(
      input.candidateManifest,
    ),
  ) as Nhm2SemiclassicalV2ScientificCandidateManifestV1;
  const runPlans = structuredClone(input.runPlans) as readonly [
    Nhm2SemiclassicalV2ScientificPresealPlanV1,
    Nhm2SemiclassicalV2ScientificPresealPlanV1,
  ];
  const sourceRoot = assertAbsoluteDirectoryInput(
    input.sourceScientificRootDirectory,
    "sourceScientificRootDirectory",
  );
  const workspaceRoot = assertAbsoluteDirectoryInput(
    input.workspaceDirectory,
    "workspaceDirectory",
  );
  const outputRoot = assertAbsoluteDirectoryInput(
    input.presealOutputDirectory,
    "presealOutputDirectory",
  );
  const sealedRoot = path.resolve(
    workspaceRoot,
    ...input.sealedScientificRootDirectory.split("/"),
  );
  const sealedRelative = path.relative(workspaceRoot, sealedRoot);
  if (
    sealedRelative === "" ||
    sealedRelative === ".." ||
    sealedRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(sealedRelative)
  ) {
    return fail(
      "presealer_input_invalid",
      "The sealed scientific root must resolve beneath workspaceDirectory.",
    );
  }
  if (
    pathsOverlap(sourceRoot, sealedRoot) ||
    pathsOverlap(sourceRoot, outputRoot) ||
    pathsOverlap(sealedRoot, outputRoot)
  ) {
    return fail(
      "presealer_input_invalid",
      "Source, sealed, and preseal-output roots must be mutually non-overlapping.",
    );
  }
  return {
    candidate,
    sourceRoot,
    sealedRoot,
    outputRoot,
    outputPath: path.join(
      outputRoot,
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RELATIVE_PATH,
    ),
    sealedScientificRootDirectory: input.sealedScientificRootDirectory,
    runPlans,
    clock: input.now ?? (() => new Date()),
  };
};

const sourceRequests = (
  candidate: Nhm2SemiclassicalV2ScientificCandidateManifestV1,
  candidateBytes: Buffer,
) => [
  {
    relativePath: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_RELATIVE_PATH,
    expectedSha256:
      computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256(
        candidateBytes,
      ),
    expectedSizeBytes: BigInt(candidateBytes.byteLength),
    decode: { kind: "bytes" as const },
  },
  ...candidate.scientificInputs.map((entry) => ({
    relativePath: entry.relativePath,
    expectedSha256: entry.sha256,
    expectedSizeBytes: BigInt(entry.sizeBytes),
    decode:
      entry.inputId === "metric_demand_tensor" ||
      entry.inputId === "metric_demand_absolute_error_bound"
        ? { kind: "float64_le" as const, shape: [64, 10] as const }
        : { kind: "bytes" as const },
  })),
];

const securelyReadInventory = async (input: {
  root: string;
  candidate: Nhm2SemiclassicalV2ScientificCandidateManifestV1;
  candidateBytes: Buffer;
  code:
    | "source_scientific_inventory_invalid"
    | "staged_scientific_inventory_invalid";
}) => {
  try {
    return await readNhm2SecureRunOutputs({
      runDirectory: input.root,
      files: sourceRequests(input.candidate, input.candidateBytes),
    });
  } catch (error) {
    return fail(input.code, "Secure exact scientific inventory read failed.", {
      cause: error,
      detailCode:
        error instanceof Nhm2SecureRunOutputReaderError ? error.code : null,
    });
  }
};

const assertSourceBytes = (input: {
  candidate: Nhm2SemiclassicalV2ScientificCandidateManifestV1;
  candidateBytes: Buffer;
  files: readonly Nhm2SecureRunOutputReadFileV1[];
}): void => {
  const byPath = new Map(input.files.map((file) => [file.relativePath, file]));
  const candidateFile = byPath.get(
    NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_RELATIVE_PATH,
  );
  if (
    candidateFile == null ||
    !candidateFile.bytes.equals(input.candidateBytes)
  ) {
    fail(
      "source_candidate_bytes_not_canonical",
      "The source candidate file is not the exact canonical candidate serialization.",
    );
  }
  const policyEntry = input.candidate.scientificInputs.find(
    (entry) => entry.inputId === "tolerance_policy",
  );
  const policyFile =
    policyEntry == null ? null : (byPath.get(policyEntry.relativePath) ?? null);
  const approvedPolicyBytes = Buffer.from(
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CANONICAL_JSON,
    "utf8",
  );
  if (policyFile == null || !policyFile.bytes.equals(approvedPolicyBytes)) {
    fail(
      "approved_policy_bytes_mismatch",
      "The tolerance-policy file is not the exact approved canonical policy bytes.",
    );
  }
};

const stableScaledNorm = (values: readonly number[]): number => {
  let scale = 0;
  let scaledSquares = 1;
  for (const value of values) {
    const absolute = Math.abs(value);
    if (absolute === 0) continue;
    if (scale < absolute) {
      const ratio = scale / absolute;
      scaledSquares = 1 + scaledSquares * ratio * ratio;
      scale = absolute;
    } else {
      const ratio = absolute / scale;
      scaledSquares += ratio * ratio;
    }
  }
  return scale === 0 ? 0 : scale * Math.sqrt(scaledSquares);
};

const stableSymmetricTensorFrobenius = (
  values: readonly number[],
  offset: number,
  sampleCount: number,
): number => {
  const weighted: number[] = [];
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const sampleOffset = offset + sample * 10;
    for (let component = 0; component < 10; component += 1) {
      weighted.push(
        values[sampleOffset + component] *
          Math.sqrt(
            NHM2_SEMICLASSICAL_V2_ORTHONORMAL_SYMMETRIC_TENSOR_MULTIPLICITIES[
              component
            ],
          ),
      );
    }
  }
  return stableScaledNorm(weighted);
};

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[a-f0-9]{64}$/.test(value) &&
  !/^0{64}$/.test(value);

const metricDemandDerivationBinding = (input: {
  candidate: Nhm2SemiclassicalV2ScientificCandidateManifestV1;
  files: readonly Nhm2SecureRunOutputReadFileV1[];
}): MetricDemandDerivationBinding => {
  const byInputId = new Map(
    input.candidate.scientificInputs.map((entry) => [entry.inputId, entry]),
  );
  const receiptEntry = byInputId.get("metric_demand_derivation_receipt");
  const receiptFile = input.files.find(
    (file) => file.relativePath === receiptEntry?.relativePath,
  );
  const metricEntry = byInputId.get("metric_demand_tensor");
  const errorEntry = byInputId.get("metric_demand_absolute_error_bound");
  if (
    receiptEntry == null ||
    receiptFile == null ||
    metricEntry == null ||
    errorEntry == null
  ) {
    return fail(
      "metric_demand_nondegeneracy_failed",
      "The metric-demand derivation receipt and its two output bindings are required.",
      { detailCode: "metric_demand_derivation_executor_provenance_unverified" },
    );
  }
  let receipt: unknown;
  try {
    receipt = JSON.parse(receiptFile.bytes.toString("utf8"));
  } catch (error) {
    return fail(
      "metric_demand_nondegeneracy_failed",
      "The metric-demand derivation receipt is not valid JSON.",
      {
        cause: error,
        detailCode: "metric_demand_derivation_executor_provenance_unverified",
      },
    );
  }
  const record = isPlainRecord(receipt) ? receipt : null;
  const inputBindings =
    record != null && isPlainRecord(record.inputBindings)
      ? record.inputBindings
      : null;
  const derivation =
    record != null && isPlainRecord(record.derivation)
      ? record.derivation
      : null;
  const constants =
    derivation != null && isPlainRecord(derivation.constants)
      ? derivation.constants
      : null;
  const implementation =
    record != null && isPlainRecord(record.implementation)
      ? record.implementation
      : null;
  const execution =
    record != null && isPlainRecord(record.execution) ? record.execution : null;
  const outputs =
    record != null && isPlainRecord(record.outputs) ? record.outputs : null;
  const central =
    outputs != null && isPlainRecord(outputs.centralTensor)
      ? outputs.centralTensor
      : null;
  const errorBound =
    outputs != null && isPlainRecord(outputs.deterministicAbsoluteErrorBound)
      ? outputs.deterministicAbsoluteErrorBound
      : null;
  const intervalTrace =
    outputs != null && isPlainRecord(outputs.intervalTrace)
      ? outputs.intervalTrace
      : null;
  const integrity =
    record != null && isPlainRecord(record.integrity) ? record.integrity : null;
  const startedMs =
    typeof execution?.startedAt === "string"
      ? Date.parse(execution.startedAt)
      : Number.NaN;
  const completedMs =
    typeof execution?.completedAt === "string"
      ? Date.parse(execution.completedAt)
      : Number.NaN;
  const inputHash = (
    inputId: Nhm2SemiclassicalV2ScientificNonSelfInputId,
  ): string | undefined => byInputId.get(inputId)?.sha256;
  let integrityMatches = false;
  if (
    record != null &&
    integrity != null &&
    isSha256(integrity.receiptSha256)
  ) {
    try {
      const { receiptSha256, ...unsignedIntegrity } = integrity;
      const unsigned = { ...record, integrity: unsignedIntegrity };
      integrityMatches =
        receiptSha256 ===
        sha256(Buffer.from(canonicalReceiptJson(unsigned), "utf8"));
    } catch {
      integrityMatches = false;
    }
  }
  const canonicalBytesMatch =
    record != null &&
    receiptFile.bytes.equals(Buffer.from(canonicalReceiptJson(record), "utf8"));
  if (
    record == null ||
    !hasExactStringKeys(record, [
      "artifactId",
      "contractVersion",
      "candidateId",
      "inputBindings",
      "derivation",
      "implementation",
      "execution",
      "outputs",
      "verificationStatus",
      "claimLocks",
      "integrity",
    ]) ||
    record.artifactId !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID ||
    record.contractVersion !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION ||
    record.candidateId !== input.candidate.candidate.candidateId ||
    inputBindings == null ||
    !hasExactStringKeys(inputBindings, [
      "geometrySha256",
      "chartSha256",
      "samplingBasisSha256",
      "smearingDefinitionSha256",
      "normalizationSha256",
      "tolerancePolicySha256",
    ]) ||
    inputBindings.geometrySha256 !== inputHash("geometry") ||
    inputBindings.chartSha256 !== inputHash("chart") ||
    inputBindings.samplingBasisSha256 !== inputHash("sampling_basis") ||
    inputBindings.smearingDefinitionSha256 !==
      inputHash("smearing_definition") ||
    inputBindings.normalizationSha256 !== inputHash("normalization") ||
    inputBindings.tolerancePolicySha256 !== inputHash("tolerance_policy") ||
    derivation == null ||
    !hasExactStringKeys(derivation, [
      "formulaId",
      "algorithmId",
      "enclosureMethod",
      "coverage",
      "relativeEnclosureTarget",
      "boundScope",
      "zeroBoundDisposition",
      "constants",
      "intervalTraceSha256",
    ]) ||
    derivation.formulaId !== NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_FORMULA_ID ||
    derivation.algorithmId !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ALGORITHM_ID ||
    derivation.enclosureMethod !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD ||
    derivation.coverage !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE ||
    derivation.relativeEnclosureTarget !== 0.01 ||
    derivation.boundScope !==
      "deterministic_numerical_error_only_physical_constant_uncertainty_excluded" ||
    derivation.zeroBoundDisposition !==
      "strictly_positive_componentwise_bounds_required_pending_exact_zero_derivation_replay" ||
    constants == null ||
    !hasExactStringKeys(constants, [
      "speedOfLightMetersPerSecond",
      "newtonianGravitationalConstantSI",
      "newtonianGravitationalConstantStandardUncertaintySI",
      "einsteinCouplingConvention",
    ]) ||
    constants.speedOfLightMetersPerSecond !== 299792458 ||
    constants.newtonianGravitationalConstantSI !== 6.6743e-11 ||
    constants.newtonianGravitationalConstantStandardUncertaintySI !== 1.5e-15 ||
    constants.einsteinCouplingConvention !==
      "T_hat_ab=(c^4/(8*pi*G))*G_hat_ab" ||
    !isSha256(derivation.intervalTraceSha256) ||
    implementation == null ||
    !hasExactStringKeys(implementation, [
      "sourceSha256",
      "dependencyLockSha256",
      "toolchainArtifactSha256",
      "executableSha256",
    ]) ||
    ![
      implementation.sourceSha256,
      implementation.dependencyLockSha256,
      implementation.toolchainArtifactSha256,
      implementation.executableSha256,
    ].every(isSha256) ||
    execution == null ||
    !hasExactStringKeys(execution, [
      "authority",
      "gitCommitSha",
      "command",
      "argv",
      "startedAt",
      "completedAt",
      "durationMs",
      "exitCode",
    ]) ||
    execution.authority !== "executor_observed" ||
    typeof execution.gitCommitSha !== "string" ||
    !/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(execution.gitCommitSha) ||
    typeof execution.command !== "string" ||
    execution.command.length === 0 ||
    execution.command.length > 2048 ||
    !Array.isArray(execution.argv) ||
    execution.argv.length === 0 ||
    execution.argv.some(
      (value) =>
        typeof value !== "string" || value.length === 0 || value.length > 1024,
    ) ||
    !Number.isFinite(startedMs) ||
    !Number.isFinite(completedMs) ||
    !(startedMs < completedMs) ||
    !Number.isSafeInteger(execution.durationMs) ||
    execution.durationMs !== completedMs - startedMs ||
    execution.exitCode !== 0 ||
    outputs == null ||
    !hasExactStringKeys(outputs, [
      "centralTensor",
      "deterministicAbsoluteErrorBound",
      "intervalTrace",
    ]) ||
    central == null ||
    !hasExactStringKeys(central, [
      "inputId",
      "sha256",
      "sizeBytes",
      "freshness",
    ]) ||
    central.inputId !== "metric_demand_tensor" ||
    central.sha256 !== metricEntry.sha256 ||
    central.sizeBytes !== 5120 ||
    central.freshness !== "created_or_modified_during_execution" ||
    errorBound == null ||
    !hasExactStringKeys(errorBound, [
      "inputId",
      "sha256",
      "sizeBytes",
      "unit",
      "shape",
      "componentOrder",
      "freshness",
    ]) ||
    errorBound.inputId !== "metric_demand_absolute_error_bound" ||
    errorBound.sha256 !== errorEntry.sha256 ||
    errorBound.sizeBytes !== 5120 ||
    errorBound.unit !== "J/m^3" ||
    !isDeepStrictEqual(errorBound.shape, [64, 10]) ||
    !isDeepStrictEqual(
      errorBound.componentOrder,
      NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
    ) ||
    errorBound.freshness !== "created_or_modified_during_execution" ||
    intervalTrace == null ||
    !hasExactStringKeys(intervalTrace, ["sha256", "sizeBytes", "freshness"]) ||
    intervalTrace.sha256 !== derivation.intervalTraceSha256 ||
    !Number.isSafeInteger(intervalTrace.sizeBytes) ||
    Number(intervalTrace.sizeBytes) <= 0 ||
    intervalTrace.freshness !== "created_or_modified_during_execution" ||
    record.verificationStatus !==
      "metric_demand_derivation_executor_provenance_unverified" ||
    !isDeepStrictEqual(
      record.claimLocks,
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RECEIPT_CLAIM_LOCKS,
    ) ||
    integrity == null ||
    !hasExactStringKeys(integrity, [
      "hashAlgorithm",
      "canonicalization",
      "receiptSha256",
    ]) ||
    integrity.hashAlgorithm !== "sha256" ||
    integrity.canonicalization !== "utf8_lexicographic_object_keys_json_v1" ||
    !integrityMatches ||
    !canonicalBytesMatch
  ) {
    return fail(
      "metric_demand_nondegeneracy_failed",
      "The metric-demand derivation receipt lacks exact cross-bound deterministic-error and executor provenance structure.",
      { detailCode: "metric_demand_derivation_executor_provenance_unverified" },
    );
  }
  const typed =
    record as unknown as Nhm2SemiclassicalV2MetricDemandDerivationReceiptV1;
  return {
    inputId: "metric_demand_derivation_receipt",
    sha256: receiptEntry.sha256,
    artifactId: typed.artifactId,
    contractVersion: typed.contractVersion,
    metricDemandInputId: "metric_demand_tensor",
    metricDemandSha256: typed.outputs.centralTensor.sha256,
    errorBoundInputId: "metric_demand_absolute_error_bound",
    errorBoundSha256: typed.outputs.deterministicAbsoluteErrorBound.sha256,
    enclosureMethod: typed.derivation.enclosureMethod,
    coverage: typed.derivation.coverage,
    relativeEnclosureTarget: 0.01,
    verificationStatus:
      "metric_demand_derivation_executor_provenance_unverified",
    blockers: [
      "metric_demand_derivation_executor_provenance_unverified",
      "interval_trace_not_server_replayed",
    ],
  };
};

const recomputeMetricDemandScreen = (input: {
  candidate: Nhm2SemiclassicalV2ScientificCandidateManifestV1;
  files: readonly Nhm2SecureRunOutputReadFileV1[];
}): MetricDemandScreen => {
  const metricEntry = input.candidate.scientificInputs.find(
    (entry) => entry.inputId === "metric_demand_tensor",
  );
  const errorBoundEntry = input.candidate.scientificInputs.find(
    (entry) => entry.inputId === "metric_demand_absolute_error_bound",
  );
  const metricFile = input.files.find(
    (file) => file.relativePath === metricEntry?.relativePath,
  );
  const errorBoundFile = input.files.find(
    (file) => file.relativePath === errorBoundEntry?.relativePath,
  );
  if (
    metricEntry == null ||
    metricFile == null ||
    errorBoundEntry == null ||
    errorBoundFile == null ||
    metricFile.bytes.byteLength !==
      64 * NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length * 8 ||
    errorBoundFile.bytes.byteLength !==
      64 * NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length * 8
  ) {
    return fail(
      "metric_demand_nondegeneracy_failed",
      "The exact 64x10 Float64 metric-demand and deterministic error-bound inputs are unavailable.",
    );
  }
  const metricView = new DataView(
    metricFile.bytes.buffer,
    metricFile.bytes.byteOffset,
    metricFile.bytes.byteLength,
  );
  const errorBoundView = new DataView(
    errorBoundFile.bytes.buffer,
    errorBoundFile.bytes.byteOffset,
    errorBoundFile.bytes.byteLength,
  );
  const values: number[] = [];
  const errorBounds: number[] = [];
  for (let index = 0; index < 640; index += 1) {
    const value = metricView.getFloat64(index * 8, true);
    const errorBound = errorBoundView.getFloat64(index * 8, true);
    if (!Number.isFinite(value)) {
      return fail(
        "metric_demand_nondegeneracy_failed",
        `Metric-demand Float64 value ${index} is not finite.`,
      );
    }
    if (!Number.isFinite(errorBound) || errorBound < 0) {
      return fail(
        "metric_demand_nondegeneracy_failed",
        `Metric-demand deterministic error bound ${index} is not finite and nonnegative.`,
      );
    }
    if (errorBound === 0) {
      return fail(
        "metric_demand_nondegeneracy_failed",
        `Metric-demand deterministic error bound ${index} is zero without a replayed exact-zero derivation proof.`,
      );
    }
    values.push(value);
    errorBounds.push(errorBound);
  }
  const sampleNorms = Array.from({ length: 64 }, (_, sample) =>
    stableSymmetricTensorFrobenius(values, sample * 10, 1),
  );
  const sampleErrorBoundNorms = Array.from({ length: 64 }, (_, sample) =>
    stableSymmetricTensorFrobenius(errorBounds, sample * 10, 1),
  );
  const sampleLowerBounds = sampleNorms.map((norm, sample) =>
    Math.max(0, norm - sampleErrorBoundNorms[sample]),
  );
  const sampleRelativeErrorBounds = sampleNorms.map((norm, sample) =>
    norm > 0 ? sampleErrorBoundNorms[sample] / norm : Number.POSITIVE_INFINITY,
  );
  const floor =
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumMetricDemandFrobeniusSI;
  const nondegenerateCount = sampleLowerBounds.filter(
    (lowerBound) => lowerBound > floor,
  ).length;
  if (nondegenerateCount !== 64) {
    return fail(
      "metric_demand_nondegeneracy_failed",
      `All 64 samples must exceed the frozen metric-demand floor; observed ${nondegenerateCount}.`,
    );
  }
  const maximumObservedRelativeErrorBound = Math.max(
    ...sampleRelativeErrorBounds,
  );
  if (
    !Number.isFinite(maximumObservedRelativeErrorBound) ||
    maximumObservedRelativeErrorBound >
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.tolerances
        .metricDemandRelativeErrorBound
  ) {
    return fail(
      "metric_demand_nondegeneracy_failed",
      "Every metric-demand deterministic error norm must be at most the frozen 1% relative enclosure target.",
    );
  }
  const minimum = Math.min(...sampleNorms);
  const maximum = Math.max(...sampleNorms);
  const minimumLowerBound = Math.min(...sampleLowerBounds);
  const maximumErrorBound = Math.max(...sampleErrorBoundNorms);
  const global = stableSymmetricTensorFrobenius(values, 0, 64);
  if (
    ![minimum, maximum, minimumLowerBound, maximumErrorBound, global].every(
      Number.isFinite,
    )
  ) {
    return fail(
      "metric_demand_nondegeneracy_failed",
      "Metric-demand norm recomputation produced a non-finite result.",
    );
  }
  return {
    screenId: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONZERO_SCREEN_ID,
    authority: "server_recomputed_from_staged_metric_and_error_float64_bytes",
    inputId: "metric_demand_tensor",
    metricDemandSha256: metricEntry.sha256,
    errorBoundInputId: "metric_demand_absolute_error_bound",
    metricDemandAbsoluteErrorBoundSha256: errorBoundEntry.sha256,
    algorithm:
      "stable_scaled_symmetric_tensor_frobenius_lower_bound_per_sample_float64_v2",
    sampleCount: 64,
    componentCount: 10,
    valueCount: 640,
    finiteValueCount: 640,
    errorBoundValueCount: 640,
    finiteErrorBoundValueCount: 640,
    minimumMetricDemandFrobeniusSI: floor,
    requiredNondegenerateSampleFraction:
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.requiredMetricDemandSampleFraction,
    observedNondegenerateSampleCount: 64,
    observedNondegenerateSampleFraction: 1,
    minimumObservedSampleFrobeniusSI: minimum,
    maximumObservedSampleFrobeniusSI: maximum,
    minimumObservedSampleFrobeniusLowerBoundSI: minimumLowerBound,
    maximumObservedSampleErrorBoundFrobeniusSI: maximumErrorBound,
    maximumAllowedRelativeErrorBound:
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.tolerances
        .metricDemandRelativeErrorBound,
    maximumObservedRelativeErrorBound,
    allSamplesWithinRelativeErrorBound: true,
    globalMetricDemandFrobeniusSI: global,
    allValuesFinite: true,
    allErrorBoundsFiniteAndNonnegative: true,
    allErrorBoundsStrictlyPositive: true,
    passesFrozenScreen: true,
    regionalPhysicalNondegeneracyAuthority: false,
  };
};

const validateFreshDestinationParent = async (
  sealedRoot: string,
): Promise<void> => {
  const parent = path.dirname(sealedRoot);
  try {
    const stat = await fs.lstat(parent);
    const real = await fs.realpath(parent);
    if (
      stat.isSymbolicLink() ||
      !stat.isDirectory() ||
      !samePath(real, parent)
    ) {
      fail(
        "sealed_scientific_root_invalid",
        "The sealed scientific root parent resolves through an alias or is not a directory.",
      );
    }
  } catch (error) {
    if (error instanceof Nhm2SemiclassicalV2ScientificPresealerError)
      throw error;
    fail(
      "sealed_scientific_root_invalid",
      "The sealed scientific root parent could not be securely prepared.",
      { cause: error },
    );
  }
};

const stageFreshScientificRoot = async (input: {
  sealedRoot: string;
  files: readonly Nhm2SecureRunOutputReadFileV1[];
}): Promise<void> => {
  await validateFreshDestinationParent(input.sealedRoot);
  try {
    try {
      await fs.mkdir(input.sealedRoot, { mode: 0o700 });
    } catch (error) {
      if (isAlreadyPresent(error)) {
        return fail(
          "sealed_scientific_root_exists",
          "The sealed scientific root already exists and will not be overwritten.",
        );
      }
      throw error;
    }
    const rootStat = await fs.lstat(input.sealedRoot);
    const rootRealPath = await fs.realpath(input.sealedRoot);
    if (
      rootStat.isSymbolicLink() ||
      !rootStat.isDirectory() ||
      !samePath(rootRealPath, input.sealedRoot)
    ) {
      fail(
        "sealed_scientific_root_invalid",
        "The exclusively created sealed root changed identity or resolves through an alias.",
      );
    }
    for (const file of input.files) {
      const destination = path.resolve(
        input.sealedRoot,
        ...file.relativePath.split("/"),
      );
      const relative = path.relative(input.sealedRoot, destination);
      if (
        relative === "" ||
        relative === ".." ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
      ) {
        fail(
          "sealed_scientific_root_stage_failed",
          "A staged scientific path escaped its fresh sealed root.",
        );
      }
      await fs.mkdir(path.dirname(destination), {
        recursive: true,
        mode: 0o700,
      });
      const handle = await fs.open(destination, "wx", 0o600);
      try {
        await handle.writeFile(file.bytes);
        await handle.sync();
      } finally {
        await handle.close();
      }
    }
  } catch (error) {
    if (error instanceof Nhm2SemiclassicalV2ScientificPresealerError)
      throw error;
    fail(
      "sealed_scientific_root_stage_failed",
      "The exact scientific inventory could not be staged.",
      { cause: error },
    );
  }
};

const assertExactStagedBytes = (
  source: readonly Nhm2SecureRunOutputReadFileV1[],
  staged: readonly Nhm2SecureRunOutputReadFileV1[],
): void => {
  if (source.length !== staged.length) {
    fail(
      "staged_scientific_bytes_mismatch",
      "Staged scientific file count differs from the source inventory.",
    );
  }
  const stagedByPath = new Map(staged.map((file) => [file.relativePath, file]));
  for (const sourceFile of source) {
    const stagedFile = stagedByPath.get(sourceFile.relativePath);
    if (
      stagedFile == null ||
      stagedFile.sha256 !== sourceFile.sha256 ||
      stagedFile.sizeBytes !== sourceFile.sizeBytes ||
      !stagedFile.bytes.equals(sourceFile.bytes)
    ) {
      fail(
        "staged_scientific_bytes_mismatch",
        `Staged bytes differ for ${sourceFile.relativePath}.`,
      );
    }
  }
};

const buildPreseal = (input: {
  candidate: Nhm2SemiclassicalV2ScientificCandidateManifestV1;
  candidateBytes: Buffer;
  sealedAt: string;
  sealedScientificRootDirectory: string;
  runPlans: PresealNhm2SemiclassicalV2ScientificCandidateInput["runPlans"];
  metricDemandScreen: MetricDemandScreen;
  metricDemandDerivationBinding: MetricDemandDerivationBinding;
}): Nhm2SemiclassicalV2ScientificPresealV1 => {
  const candidateSha256 =
    computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256(
      input.candidateBytes,
    );
  const stagedInputs: Nhm2SemiclassicalV2ScientificPresealStagedInputV1[] = [
    {
      inputId: "candidate_manifest",
      relativePath: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_RELATIVE_PATH,
      sha256: candidateSha256,
      sizeBytes: input.candidateBytes.byteLength,
      mediaType: "application/json",
      descriptor: {
        descriptorKind: "scientific_candidate_manifest",
        scientificInputId: "candidate_manifest",
        artifactId:
          NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID,
        contractVersion:
          NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION,
        candidateId: input.candidate.candidate.candidateId,
        candidateManifestId: input.candidate.candidate.candidateManifestId,
        candidateFrozenAt: input.candidate.candidateFrozenAt,
      },
    },
    ...structuredClone(input.candidate.scientificInputs),
  ];
  const unsigned = {
    artifactId: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
    contractVersion: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
    authority: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_AUTHORITY,
    consumerScope: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONSUMER_SCOPE,
    sealKey: computeNhm2SemiclassicalV2ScientificSealKey(
      input.candidate.candidate.candidateId,
    ),
    candidateFrozenAt: input.candidate.candidateFrozenAt,
    sealedAt: input.sealedAt,
    candidateBinding: {
      candidateId: input.candidate.candidate.candidateId,
      candidateManifestId: input.candidate.candidate.candidateManifestId,
      candidateManifestInputId: "candidate_manifest" as const,
      candidateManifestSha256: candidateSha256,
      candidateManifestSizeBytes: input.candidateBytes.byteLength,
    },
    sealedScientificRootDirectory: input.sealedScientificRootDirectory,
    stagedInputs,
    scientificContentSha256:
      computeNhm2SemiclassicalV2ScientificContentSha256(stagedInputs),
    approvedReplayPolicy: {
      ...NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
    },
    metricDemandDerivationBinding: input.metricDemandDerivationBinding,
    metricDemandNondegeneracy: input.metricDemandScreen,
    runPlans: [
      structuredClone(input.runPlans[0]),
      structuredClone(input.runPlans[1]),
    ] as [
      Nhm2SemiclassicalV2ScientificPresealPlanV1,
      Nhm2SemiclassicalV2ScientificPresealPlanV1,
    ],
    claimLocks: { ...NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS },
  };
  return {
    ...unsigned,
    sealedInventorySha256:
      computeNhm2SemiclassicalV2SealedInventorySha256(unsigned),
  };
};

type PersistedPresealFileIdentity = {
  dev: bigint;
  ino: bigint;
  mode: bigint;
  size: bigint;
  mtimeNs: bigint;
  ctimeNs: bigint;
  nlink: bigint;
};

const persistedPresealFileIdentity = (
  stat: BigIntStats,
): PersistedPresealFileIdentity => ({
  dev: stat.dev,
  ino: stat.ino,
  mode: stat.mode,
  size: stat.size,
  mtimeNs: stat.mtimeNs,
  ctimeNs: stat.ctimeNs,
  nlink: stat.nlink,
});

const persistedPresealIdentitiesMatch = (
  left: PersistedPresealFileIdentity,
  right: PersistedPresealFileIdentity,
): boolean =>
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.mode === right.mode &&
  left.size === right.size &&
  left.mtimeNs === right.mtimeNs &&
  left.ctimeNs === right.ctimeNs &&
  left.nlink === right.nlink;

const publicPersistedPresealIdentity = (
  value: PersistedPresealFileIdentity,
): Nhm2SecureRunOutputFilesystemIdentityV1 => ({
  dev: value.dev.toString(10),
  ino: value.ino.toString(10),
  sizeBytes: value.size.toString(10),
  mtimeNs: value.mtimeNs.toString(10),
  ctimeNs: value.ctimeNs.toString(10),
});

const boundedIdentityStablePresealRead = async (input: {
  outputPath: string;
}): Promise<{
  bytes: Buffer;
  filesystemIdentity: Nhm2SecureRunOutputFilesystemIdentityV1;
}> => {
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const beforeStat = await fs.lstat(input.outputPath, { bigint: true });
    if (
      beforeStat.isSymbolicLink() ||
      !beforeStat.isFile() ||
      beforeStat.nlink !== 1n ||
      beforeStat.size <= 0n ||
      beforeStat.size >
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_MAX_PERSISTED_BYTES
    ) {
      return fail(
        "scientific_preseal_output_invalid",
        "The persisted preseal must be a nonempty, single-link regular file within the byte ceiling.",
      );
    }
    const realPath = await fs.realpath(input.outputPath);
    if (!samePath(realPath, input.outputPath)) {
      return fail(
        "scientific_preseal_output_invalid",
        "The persisted preseal resolves through a filesystem alias.",
      );
    }
    const defensiveFlags =
      process.platform === "win32"
        ? 0
        : (fsConstants.O_NOFOLLOW ?? 0) | (fsConstants.O_NONBLOCK ?? 0);
    handle = await fs.open(
      input.outputPath,
      fsConstants.O_RDONLY | defensiveFlags,
    );
    const openedStat = await handle.stat({ bigint: true });
    const beforeIdentity = persistedPresealFileIdentity(beforeStat);
    if (
      !openedStat.isFile() ||
      openedStat.nlink !== 1n ||
      !persistedPresealIdentitiesMatch(
        beforeIdentity,
        persistedPresealFileIdentity(openedStat),
      )
    ) {
      return fail(
        "scientific_preseal_output_invalid",
        "The opened preseal descriptor differs from the bounded lstat identity.",
      );
    }

    const size = Number(beforeStat.size);
    const bytes = Buffer.alloc(size);
    let offset = 0;
    while (offset < size) {
      const observation = await handle.read(
        bytes,
        offset,
        size - offset,
        offset,
      );
      if (observation.bytesRead === 0) break;
      offset += observation.bytesRead;
    }
    const trailingProbe = Buffer.alloc(1);
    const trailing = await handle.read(trailingProbe, 0, 1, size);
    if (offset !== size || trailing.bytesRead !== 0) {
      return fail(
        "scientific_preseal_output_invalid",
        "The bounded preseal read was truncated or found a trailing byte.",
      );
    }

    const openedAfterStat = await handle.stat({ bigint: true });
    const afterStat = await fs.lstat(input.outputPath, { bigint: true });
    const afterRealPath = await fs.realpath(input.outputPath);
    if (
      afterStat.isSymbolicLink() ||
      !afterStat.isFile() ||
      afterStat.nlink !== 1n ||
      !samePath(afterRealPath, realPath) ||
      !persistedPresealIdentitiesMatch(
        beforeIdentity,
        persistedPresealFileIdentity(openedAfterStat),
      ) ||
      !persistedPresealIdentitiesMatch(
        beforeIdentity,
        persistedPresealFileIdentity(afterStat),
      )
    ) {
      return fail(
        "scientific_preseal_output_invalid",
        "The persisted preseal identity changed during bounded readback.",
      );
    }
    return {
      bytes,
      filesystemIdentity: publicPersistedPresealIdentity(beforeIdentity),
    };
  } catch (error) {
    if (error instanceof Nhm2SemiclassicalV2ScientificPresealerError) {
      throw error;
    }
    return fail(
      "scientific_preseal_output_invalid",
      "The persisted preseal could not be opened for bounded identity-stable readback.",
      { cause: error },
    );
  } finally {
    await handle?.close().catch(() => undefined);
  }
};

const readPersistedPreseal = async (input: {
  outputRoot: string;
  outputPath: string;
  expected?: Nhm2SemiclassicalV2ScientificPresealV1;
}): Promise<{
  preseal: Nhm2SemiclassicalV2ScientificPresealV1;
  file: Nhm2SecureRunOutputReadFileV1;
}> => {
  const boundedRead = await boundedIdentityStablePresealRead({
    outputPath: input.outputPath,
  });
  const untrustedBytes = boundedRead.bytes;
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(untrustedBytes),
    );
  } catch (error) {
    return fail(
      "scientific_preseal_output_invalid",
      "The persisted preseal is not exact UTF-8 JSON.",
      { cause: error },
    );
  }
  if (!isNhm2SemiclassicalV2ScientificPreseal(parsed)) {
    return fail(
      "scientific_preseal_output_invalid",
      "The persisted preseal does not satisfy its exact contract.",
    );
  }
  const deterministicBytes = jsonFileBytes(parsed);
  if (!untrustedBytes.equals(deterministicBytes)) {
    return fail(
      "scientific_preseal_output_invalid",
      "The persisted preseal bytes are not the deterministic server serialization.",
    );
  }
  if (input.expected != null && !isDeepStrictEqual(parsed, input.expected)) {
    return fail(
      "scientific_preseal_second_seal_conflict",
      "A different artifact already occupies the deterministic preseal output.",
    );
  }
  let readback;
  try {
    readback = await readNhm2SecureRunOutputs({
      runDirectory: input.outputRoot,
      files: [
        {
          relativePath: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RELATIVE_PATH,
          expectedSha256: sha256(deterministicBytes),
          expectedSizeBytes: BigInt(deterministicBytes.byteLength),
          decode: { kind: "bytes" },
        },
      ],
    });
  } catch (error) {
    return fail(
      "scientific_preseal_output_invalid",
      "Secure exact preseal readback failed.",
      {
        cause: error,
        detailCode:
          error instanceof Nhm2SecureRunOutputReaderError ? error.code : null,
      },
    );
  }
  const file = readback.files[0];
  if (
    file == null ||
    !file.bytes.equals(deterministicBytes) ||
    !isDeepStrictEqual(file.filesystemIdentity, boundedRead.filesystemIdentity)
  ) {
    return fail(
      "scientific_preseal_output_invalid",
      "Secure preseal replay differs in bytes or identity from the bounded read.",
    );
  }
  return { preseal: parsed, file };
};

const ensureDedicatedOutputRoot = async (input: {
  outputRoot: string;
}): Promise<"missing" | "existing"> => {
  try {
    const stat = await fs.lstat(input.outputRoot);
    const real = await fs.realpath(input.outputRoot);
    if (
      stat.isSymbolicLink() ||
      !stat.isDirectory() ||
      !samePath(real, input.outputRoot)
    ) {
      return fail(
        "scientific_preseal_output_invalid",
        "The dedicated preseal output root resolves through an alias or is not a directory.",
      );
    }
    const entries = await fs.readdir(input.outputRoot);
    const outputExists = entries.includes(
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RELATIVE_PATH,
    );
    if (entries.length !== (outputExists ? 1 : 0)) {
      return fail(
        "scientific_preseal_output_invalid",
        "The dedicated preseal output root contains an undeclared entry.",
      );
    }
    return outputExists ? "existing" : "missing";
  } catch (error) {
    if (error instanceof Nhm2SemiclassicalV2ScientificPresealerError)
      throw error;
    return fail(
      "scientific_preseal_output_invalid",
      "The dedicated preseal output root could not be securely prepared.",
      { cause: error },
    );
  }
};

const receiptFor = (input: {
  preseal: Nhm2SemiclassicalV2ScientificPresealV1;
  file: Nhm2SecureRunOutputReadFileV1;
  persistenceState: Nhm2SemiclassicalV2ScientificPresealServerReceiptV1["persistenceState"];
  persistenceObservedAt: string;
}): Nhm2SemiclassicalV2ScientificPresealServerReceiptV1 => {
  const unsigned: Nhm2SemiclassicalV2ScientificPresealUnsignedServerReceiptV1 =
    {
      artifactId: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_CONTRACT_VERSION,
      authority: "server_observed_persistence_readback",
      persistenceState: input.persistenceState,
      sealKey: input.preseal.sealKey,
      sealedAt: input.preseal.sealedAt,
      persistenceObservedAt: input.persistenceObservedAt,
      artifact: {
        absolutePath: input.file.absolutePath,
        sha256: input.file.sha256,
        sizeBytes: input.file.sizeBytes.toString(),
        filesystemIdentity: { ...input.file.filesystemIdentity },
      },
      locks: { ...NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_LOCKS },
      receiptHashAlgorithm:
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_HASH_ALGORITHM,
      receiptCanonicalization:
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_RECEIPT_CANONICALIZATION,
    };
  return deepFreeze({
    ...unsigned,
    receiptSha256:
      computeNhm2SemiclassicalV2ScientificPresealServerReceiptSha256(unsigned),
  });
};

const finalizeResult = (
  result: PresealNhm2SemiclassicalV2ScientificCandidateResult,
): PresealNhm2SemiclassicalV2ScientificCandidateResult => {
  if (
    !hasValidNhm2SemiclassicalV2ScientificPresealServerReceiptIntegrity(
      result.receipt,
    )
  ) {
    return fail(
      "scientific_preseal_output_invalid",
      "The server receipt failed its canonical integrity binding.",
    );
  }
  return deepFreeze(result);
};

const assertIdempotentBinding = (input: {
  existing: Nhm2SemiclassicalV2ScientificPresealV1;
  candidate: Nhm2SemiclassicalV2ScientificCandidateManifestV1;
  candidateBytes: Buffer;
  sealedScientificRootDirectory: string;
  runPlans: PresealNhm2SemiclassicalV2ScientificCandidateInput["runPlans"];
  metricDemandScreen: MetricDemandScreen;
  metricDemandDerivationBinding: MetricDemandDerivationBinding;
}): void => {
  const bindingViolations =
    nhm2SemiclassicalV2ScientificPresealCandidateBindingViolations(
      input.existing,
      input.candidate,
      input.candidateBytes,
    );
  if (
    bindingViolations.length > 0 ||
    input.existing.sealedScientificRootDirectory !==
      input.sealedScientificRootDirectory ||
    !isDeepStrictEqual(input.existing.runPlans, input.runPlans) ||
    !isDeepStrictEqual(
      input.existing.metricDemandNondegeneracy,
      input.metricDemandScreen,
    ) ||
    !isDeepStrictEqual(
      input.existing.metricDemandDerivationBinding,
      input.metricDemandDerivationBinding,
    )
  ) {
    fail(
      "scientific_preseal_second_seal_conflict",
      `A different seal already exists for this deterministic identity${
        bindingViolations.length > 0 ? `: ${bindingViolations.join(", ")}` : "."
      }`,
    );
  }
};

/**
 * Freezes the exact canonical semiclassical-v2 scientific inventory before any
 * implementation executes. This operation stages bytes and observes durable
 * JSON persistence; it does not establish OS mount isolation, independent
 * execution, diagnostic lamps, theory closure, or physical authority.
 */
export async function presealNhm2SemiclassicalV2ScientificCandidate(
  input: PresealNhm2SemiclassicalV2ScientificCandidateInput,
): Promise<PresealNhm2SemiclassicalV2ScientificCandidateResult> {
  const validated = validateInput(input);
  const candidateBytes = Buffer.from(
    canonicalNhm2SemiclassicalV2ScientificCandidateManifestJson(
      validated.candidate,
    ),
    "utf8",
  );
  const sourceRead = await securelyReadInventory({
    root: validated.sourceRoot,
    candidate: validated.candidate,
    candidateBytes,
    code: "source_scientific_inventory_invalid",
  });
  assertSourceBytes({
    candidate: validated.candidate,
    candidateBytes,
    files: sourceRead.files,
  });
  const metricDemandScreen = recomputeMetricDemandScreen({
    candidate: validated.candidate,
    files: sourceRead.files,
  });
  const sourceMetricDemandDerivationBinding = metricDemandDerivationBinding({
    candidate: validated.candidate,
    files: sourceRead.files,
  });
  const outputState = await ensureDedicatedOutputRoot({
    outputRoot: validated.outputRoot,
  });

  if (outputState === "existing") {
    const persisted = await readPersistedPreseal({
      outputRoot: validated.outputRoot,
      outputPath: validated.outputPath,
    });
    assertIdempotentBinding({
      existing: persisted.preseal,
      candidate: validated.candidate,
      candidateBytes,
      sealedScientificRootDirectory: validated.sealedScientificRootDirectory,
      runPlans: validated.runPlans,
      metricDemandScreen,
      metricDemandDerivationBinding: sourceMetricDemandDerivationBinding,
    });
    const stagedRead = await securelyReadInventory({
      root: validated.sealedRoot,
      candidate: validated.candidate,
      candidateBytes,
      code: "staged_scientific_inventory_invalid",
    });
    assertExactStagedBytes(sourceRead.files, stagedRead.files);
    const observedAt = nowIso(validated.clock, "persistenceObservedAt");
    assertStrictChronology({
      candidateFrozenAt: validated.candidate.candidateFrozenAt,
      sealedAt: persisted.preseal.sealedAt,
      persistenceObservedAt: observedAt,
    });
    return finalizeResult({
      preseal: persisted.preseal,
      receipt: receiptFor({
        preseal: persisted.preseal,
        file: persisted.file,
        persistenceState: "exact_idempotent_readback",
        persistenceObservedAt: observedAt,
      }),
      sourceScientificRootRealPath: sourceRead.runDirectoryRealPath,
      sealedScientificRootRealPath: stagedRead.runDirectoryRealPath,
    });
  }

  await stageFreshScientificRoot({
    sealedRoot: validated.sealedRoot,
    files: sourceRead.files,
  });
  const stagedRead = await securelyReadInventory({
    root: validated.sealedRoot,
    candidate: validated.candidate,
    candidateBytes,
    code: "staged_scientific_inventory_invalid",
  });
  assertExactStagedBytes(sourceRead.files, stagedRead.files);
  const stagedMetricDemandScreen = recomputeMetricDemandScreen({
    candidate: validated.candidate,
    files: stagedRead.files,
  });
  const stagedMetricDemandDerivationBinding = metricDemandDerivationBinding({
    candidate: validated.candidate,
    files: stagedRead.files,
  });
  if (!isDeepStrictEqual(metricDemandScreen, stagedMetricDemandScreen)) {
    return fail(
      "staged_scientific_bytes_mismatch",
      "Metric-demand recomputation changed after staging.",
    );
  }
  if (
    !isDeepStrictEqual(
      sourceMetricDemandDerivationBinding,
      stagedMetricDemandDerivationBinding,
    )
  ) {
    return fail(
      "staged_scientific_bytes_mismatch",
      "Metric-demand derivation binding changed after staging.",
    );
  }
  const sealedAt = nowIso(validated.clock, "sealedAt");
  assertStrictChronology({
    candidateFrozenAt: validated.candidate.candidateFrozenAt,
    sealedAt,
  });
  const preseal = buildPreseal({
    candidate: validated.candidate,
    candidateBytes,
    sealedAt,
    sealedScientificRootDirectory: validated.sealedScientificRootDirectory,
    runPlans: validated.runPlans,
    metricDemandScreen: stagedMetricDemandScreen,
    metricDemandDerivationBinding: stagedMetricDemandDerivationBinding,
  });
  const bindingViolations =
    nhm2SemiclassicalV2ScientificPresealCandidateBindingViolations(
      preseal,
      validated.candidate,
      candidateBytes,
    );
  if (
    !isNhm2SemiclassicalV2ScientificPreseal(preseal) ||
    bindingViolations.length > 0
  ) {
    return fail(
      "scientific_preseal_invalid",
      `Constructed scientific preseal is invalid: ${bindingViolations.join(", ")}.`,
    );
  }
  try {
    await createTheoryRuntimeJsonFile(validated.outputPath, preseal);
  } catch (error) {
    if (isAlreadyPresent(error)) {
      return fail(
        "scientific_preseal_second_seal_conflict",
        "A concurrent writer already occupied the deterministic preseal output.",
        { cause: error },
      );
    }
    return fail(
      "scientific_preseal_output_invalid",
      "The scientific preseal could not be exclusively persisted.",
      { cause: error },
    );
  }
  const persisted = await readPersistedPreseal({
    outputRoot: validated.outputRoot,
    outputPath: validated.outputPath,
    expected: preseal,
  });
  const observedAt = nowIso(validated.clock, "persistenceObservedAt");
  assertStrictChronology({
    candidateFrozenAt: validated.candidate.candidateFrozenAt,
    sealedAt: persisted.preseal.sealedAt,
    persistenceObservedAt: observedAt,
  });
  return finalizeResult({
    preseal: persisted.preseal,
    receipt: receiptFor({
      preseal: persisted.preseal,
      file: persisted.file,
      persistenceState: "created_exclusively",
      persistenceObservedAt: observedAt,
    }),
    sourceScientificRootRealPath: sourceRead.runDirectoryRealPath,
    sealedScientificRootRealPath: stagedRead.runDirectoryRealPath,
  });
}
