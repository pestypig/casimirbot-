import { createHash, timingSafeEqual } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { TextDecoder } from "node:util";

import {
  NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES,
  NHM2_PRIMARY_RAW_OBSERVABLE_SOURCE_FAMILY_IDS,
  NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID,
  NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS,
  type Nhm2PrimaryRawRoleContentPolicyV1,
} from "../../../shared/contracts/nhm2-primary-raw-content-policy.v1";
import {
  NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256,
  type Nhm2PrimaryRawOutputFileV1,
  type Nhm2PrimaryRawOutputManifestV1,
} from "../../../shared/contracts/nhm2-primary-raw-output-manifest.v1";
import {
  NHM2_PREDICTION_RUN1_BINDING_SET_ARTIFACT_ID,
  NHM2_PREDICTION_RUN1_BINDING_SET_CONTRACT_VERSION,
  NHM2_PREDICTION_RUN1_BOOTSTRAP_ARTIFACT_ID,
  NHM2_PREDICTION_RUN1_BOOTSTRAP_CONTRACT_VERSION,
  NHM2_PREDICTION_RUN1_BOOTSTRAP_STATUS,
  NHM2_PREDICTION_RUN1_BOOTSTRAP_SUPERSEDES,
  NHM2_PREDICTION_RUN1_CLAIM_BOUNDARY,
  NHM2_PREDICTION_RUN1_OBSERVABLE_ORDERING,
  NHM2_PREDICTION_RUN1_SOURCE_FILE_ORDERING,
  canonicalizeNhm2PredictionRun1Json,
  computeNhm2PredictionRun1PredictionSetSha256,
  computeNhm2PredictionRun1SourceSetSha256,
  isNhm2PredictionRun1BindingSetV2,
  isNhm2PredictionRun1BootstrapArtifactV2,
  nhm2PredictionRun1ObservableUnitCompositionViolations,
  nhm2PredictionRun1BindingSetViolations,
  sha256Nhm2PredictionRun1Bytes,
  type Nhm2PredictionRun1BindingSetV2,
  type Nhm2PredictionRun1BootstrapArtifactV2,
  type Nhm2PredictionRun1FileRefV2,
  type Nhm2PredictionRun1PredictionV2,
  type Nhm2PredictionRun1UnitConversionV2,
} from "../../../shared/contracts/nhm2-prediction-run1-bootstrap.v2";
import {
  THEORY_RUNTIME_RECEIPT_ARTIFACT_ID,
  THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION,
  isTheoryRuntimeReceiptV1,
  type TheoryRuntimeReceiptV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";
import type { Nhm2PrimaryRawOutputFilesystemVerification } from "./nhm2-primary-raw-output-filesystem-verifier";
import {
  NHM2_PRIMARY_RAW_MATERIAL_DYNAMICS_REPLAY_CONTRACT_VERSION,
  type Nhm2PrimaryRawMaterialDynamicsReplayResult,
} from "./nhm2-primary-raw-material-dynamics-content-replay";
import { verifyTheoryRuntimeReceiptFilesystem } from "./theory-runtime-receipt-filesystem-verifier";
import {
  readTheoryRuntimeReceiptArtifact,
  type TheoryRuntimePersistedReceiptRefV1,
} from "./theory-runtime-receipt-store";

export const NHM2_PREDICTION_RUN1_BOOTSTRAP_RESOURCE_LIMITS = Object.freeze({
  maxReceiptBytes: 2 * 1024 * 1024,
  maxBindingSetBytes: 2 * 1024 * 1024,
  maxManifestBytes: 8 * 1024 * 1024,
  maxSourceFileBytes: 128 * 1024 * 1024,
  maxSourceTotalBytes: 512 * 1024 * 1024,
  maxSourceFiles: 512,
  maxPathDepth: 16,
  maxJsonDepth: 32,
  maxJsonNodes: 100_000,
  maxJsonStringBytes: 4 * 1024 * 1024,
  maxPublishedBytes: 2 * 1024 * 1024,
  freshnessToleranceMs: 2_000,
} as const);

export type Nhm2PredictionRun1BootstrapCompilerInput = {
  rawVerification: Nhm2PrimaryRawOutputFilesystemVerification;
  materialDynamicsReplay: Nhm2PrimaryRawMaterialDynamicsReplayResult;
  sourceReceiptStoreBinding: Nhm2PredictionRun1ReceiptStoreBinding | null;
  bindingSet: {
    bytes: Uint8Array;
    expectedSha256: string;
  } | null;
  generatedAt: string;
  frozenAt: string;
  bootstrapId: string;
  targetRunReservation: {
    candidateId: string;
    manifestId: string;
    requestId: string;
    runId: string;
    runtimeId: string;
    plannedStartAt: string;
  };
  resourceLimits?: Partial<
    typeof NHM2_PREDICTION_RUN1_BOOTSTRAP_RESOURCE_LIMITS
  >;
};

export const NHM2_PREDICTION_RUN1_RECEIPT_STORE_BINDING_ARTIFACT_ID =
  "nhm2_prediction_run1_receipt_store_binding" as const;
export const NHM2_PREDICTION_RUN1_RECEIPT_STORE_BINDING_CONTRACT_VERSION =
  "nhm2_prediction_run1_receipt_store_binding/v1" as const;

export type Nhm2PredictionRun1ReceiptStoreBinding = Readonly<{
  artifactId: typeof NHM2_PREDICTION_RUN1_RECEIPT_STORE_BINDING_ARTIFACT_ID;
  contractVersion: typeof NHM2_PREDICTION_RUN1_RECEIPT_STORE_BINDING_CONTRACT_VERSION;
  projectRootSha256: string;
}>;

export type Nhm2PredictionRun1BootstrapCompilation =
  | {
      status: "not_ready";
      blockers: string[];
      artifact: null;
    }
  | {
      status: typeof NHM2_PREDICTION_RUN1_BOOTSTRAP_STATUS;
      blockers: [];
      artifact: Nhm2PredictionRun1BootstrapArtifactV2;
    };

export type Nhm2PredictionRun1BootstrapPublication = {
  published: true;
  absolutePath: string;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
};

export class Nhm2PredictionRun1BootstrapPublicationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "Nhm2PredictionRun1BootstrapPublicationError";
  }
}

type ResolvedLimits = typeof NHM2_PREDICTION_RUN1_BOOTSTRAP_RESOURCE_LIMITS;

type ReopenedNumericalFile = {
  kind: "numerical_array";
  descriptor: Nhm2PrimaryRawOutputFileV1;
  bytes: Uint8Array;
  values: Float64Array;
};

type ReopenedRecordFile = {
  kind: "records";
  descriptor: Nhm2PrimaryRawOutputFileV1;
  bytes: Uint8Array;
  records: ReadonlyArray<Readonly<Record<string, unknown>>>;
};

type ReopenedFile = ReopenedNumericalFile | ReopenedRecordFile;

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const REPLAY_CLOSURE_DOMAIN =
  "nhm2-primary-raw-material-dynamics-file-closure/v1\n";
const REPLAY_OBSERVABLE_BLOCKER =
  "observable_projection_source_component_unit_conversion_unresolved";
const RECEIPT_STORE_ROOT_HASH_DOMAIN =
  "nhm2_prediction_run1_receipt_store_root_sha256/v1\n";
const receiptStoreRoots = new WeakMap<object, string>();

/**
 * Creates a process-local capability for the server-owned immutable receipt
 * store.  The compiler rejects structurally identical caller objects because
 * the real root is retained only in this module's WeakMap.
 */
export async function bindNhm2PredictionRun1ReceiptStore(input: {
  projectRoot: string;
}): Promise<Nhm2PredictionRun1ReceiptStoreBinding> {
  const resolved = path.resolve(input.projectRoot);
  const stat = await fs.lstat(resolved);
  const real = await fs.realpath(resolved);
  if (
    stat.isSymbolicLink() ||
    !stat.isDirectory() ||
    !samePath(resolved, real)
  ) {
    throw new Error(
      "NHM2 prediction receipt-store project root must be one real directory.",
    );
  }
  const binding = Object.freeze({
    artifactId: NHM2_PREDICTION_RUN1_RECEIPT_STORE_BINDING_ARTIFACT_ID,
    contractVersion:
      NHM2_PREDICTION_RUN1_RECEIPT_STORE_BINDING_CONTRACT_VERSION,
    projectRootSha256: createHash("sha256")
      .update(RECEIPT_STORE_ROOT_HASH_DOMAIN, "utf8")
      .update(real, "utf8")
      .digest("hex"),
  } satisfies Nhm2PredictionRun1ReceiptStoreBinding);
  receiptStoreRoots.set(binding, real);
  return binding;
}

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort((left, right) =>
    Buffer.compare(Buffer.from(left), Buffer.from(right)),
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isIso = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};

const isText = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim() === value &&
  value.length > 0 &&
  value.length <= 512 &&
  !/[\u0000-\u001f\u007f]/.test(value);

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const sha256DomainJson = (domain: string, value: unknown): string =>
  createHash("sha256")
    .update(domain, "utf8")
    .update(canonicalizeNhm2PredictionRun1Json(value), "utf8")
    .digest("hex");

const timingSafeHexEqual = (left: string, right: string): boolean => {
  if (!SHA256.test(left) || !SHA256.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
};

const samePath = (left: string, right: string): boolean => {
  const normalize = (value: string) => {
    const resolved = path.resolve(value);
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  };
  return normalize(left) === normalize(right);
};

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!path.isAbsolute(relative) &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`))
  );
};

const portable = (value: string): string => value.split(path.sep).join("/");

const pinnedPath = (value: unknown, maxDepth: number): value is string => {
  if (
    !isText(value) ||
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[a-z]:/i.test(value) ||
    /[?#*{}[\]]/.test(value)
  ) {
    return false;
  }
  const parts = value.split("/");
  return (
    parts.length <= maxDepth &&
    parts.every((part) => part !== "" && part !== "." && part !== "..") &&
    !parts.some((part) => part.toLowerCase() === "latest")
  );
};

const jsonResourceBlocker = (
  root: unknown,
  limits: ResolvedLimits,
): string | null => {
  const stack: Array<{ value: unknown; depth: number }> = [
    { value: root, depth: 0 },
  ];
  const seen = new Set<object>();
  let nodes = 0;
  let stringBytes = 0;
  while (stack.length > 0) {
    const current = stack.pop()!;
    nodes += 1;
    if (nodes > limits.maxJsonNodes || current.depth > limits.maxJsonDepth)
      return "bootstrap_json_resource_limit_exceeded";
    if (typeof current.value === "string") {
      stringBytes += Buffer.byteLength(current.value, "utf8");
      if (stringBytes > limits.maxJsonStringBytes)
        return "bootstrap_json_resource_limit_exceeded";
      continue;
    }
    if (typeof current.value === "number" && !Number.isFinite(current.value))
      return "bootstrap_json_nonfinite";
    if (current.value && typeof current.value === "object") {
      if (ArrayBuffer.isView(current.value)) continue;
      if (seen.has(current.value)) return "bootstrap_json_cycle_forbidden";
      seen.add(current.value);
      const children = Array.isArray(current.value)
        ? current.value
        : Object.values(current.value as Record<string, unknown>);
      for (const child of children)
        stack.push({ value: child, depth: current.depth + 1 });
    }
  }
  return null;
};

const resolveLimits = (
  value: Nhm2PredictionRun1BootstrapCompilerInput["resourceLimits"],
): ResolvedLimits => {
  const result = {
    ...NHM2_PREDICTION_RUN1_BOOTSTRAP_RESOURCE_LIMITS,
    ...(value ?? {}),
  };
  for (const [key, hardMaximum] of Object.entries(
    NHM2_PREDICTION_RUN1_BOOTSTRAP_RESOURCE_LIMITS,
  )) {
    const selected = result[key as keyof ResolvedLimits];
    if (
      !Number.isSafeInteger(selected) ||
      selected <= 0 ||
      selected > hardMaximum
    ) {
      return NHM2_PREDICTION_RUN1_BOOTSTRAP_RESOURCE_LIMITS;
    }
  }
  return result;
};

const decodeUtf8 = (bytes: Uint8Array): string | null => {
  if (bytes.length >= 3 && Buffer.from(bytes.subarray(0, 3)).equals(UTF8_BOM))
    return null;
  try {
    const text = new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true,
    }).decode(bytes);
    const roundTrip = Buffer.from(text, "utf8");
    return roundTrip.equals(Buffer.from(bytes)) ? text : null;
  } catch {
    return null;
  }
};

const fileIdentity = (stat: Awaited<ReturnType<typeof fs.lstat>>) => ({
  dev: stat.dev,
  ino: stat.ino,
  size: stat.size,
  mtimeMs: stat.mtimeMs,
  ctimeMs: stat.ctimeMs,
  nlink: stat.nlink,
});

const identitiesEqual = (
  left: ReturnType<typeof fileIdentity>,
  right: ReturnType<typeof fileIdentity>,
): boolean =>
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.size === right.size &&
  left.mtimeMs === right.mtimeMs &&
  left.ctimeMs === right.ctimeMs &&
  left.nlink === right.nlink;

const directoryIdentitiesEqual = (
  left: ReturnType<typeof fileIdentity>,
  right: ReturnType<typeof fileIdentity>,
): boolean =>
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.nlink === right.nlink;

const parseCanonicalJsonArtifact = (input: {
  bytes: Uint8Array;
  expectedSha256: string;
  maxBytes: number;
  limits: ResolvedLimits;
  label: "receipt" | "binding_set";
}): {
  parsed: unknown;
  sha256: string;
  sizeBytes: number;
  blockers: string[];
} => {
  const blockers: string[] = [];
  if (
    !(input.bytes instanceof Uint8Array) ||
    input.bytes.byteLength < 2 ||
    input.bytes.byteLength > input.maxBytes
  ) {
    blockers.push(`${input.label}_resource_limit_exceeded`);
    return {
      parsed: null,
      sha256: "",
      sizeBytes: input.bytes?.byteLength ?? 0,
      blockers,
    };
  }
  const observedSha256 = sha256(input.bytes);
  if (
    !SHA256.test(input.expectedSha256) ||
    !timingSafeHexEqual(observedSha256, input.expectedSha256)
  ) {
    blockers.push(`${input.label}_sha256_mismatch`);
  }
  const text = decodeUtf8(input.bytes);
  if (text == null) {
    blockers.push(`${input.label}_utf8_invalid`);
    return {
      parsed: null,
      sha256: observedSha256,
      sizeBytes: input.bytes.byteLength,
      blockers,
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    blockers.push(`${input.label}_json_invalid`);
    return {
      parsed: null,
      sha256: observedSha256,
      sizeBytes: input.bytes.byteLength,
      blockers,
    };
  }
  const resourceBlocker = jsonResourceBlocker(parsed, input.limits);
  if (resourceBlocker != null)
    blockers.push(`${input.label}_${resourceBlocker}`);
  if (
    resourceBlocker == null &&
    input.label === "binding_set" &&
    canonicalizeNhm2PredictionRun1Json(parsed) !== text
  ) {
    blockers.push(`${input.label}_json_not_canonical`);
  }
  return {
    parsed,
    sha256: observedSha256,
    sizeBytes: input.bytes.byteLength,
    blockers,
  };
};

type ReopenedPersistedReceipt = {
  receipt: TheoryRuntimeReceiptV1;
  bytes: Buffer;
  sha256: string;
  sizeBytes: number;
  identity: ReturnType<typeof fileIdentity>;
};

const reopenPersistedReceipt = async (input: {
  projectRoot: string;
  persisted: {
    receipt: TheoryRuntimeReceiptV1;
    artifact: TheoryRuntimePersistedReceiptRefV1;
  };
  maxBytes: number;
  limits: ResolvedLimits;
}): Promise<{
  reopened: ReopenedPersistedReceipt | null;
  blockers: string[];
}> => {
  const blockers: string[] = [];
  const absolutePath = path.resolve(
    input.projectRoot,
    ...input.persisted.artifact.path.split("/"),
  );
  if (
    !isInside(input.projectRoot, absolutePath) ||
    absolutePath === input.projectRoot
  ) {
    return {
      reopened: null,
      blockers: ["source_runtime_receipt_store_path_escape"],
    };
  }
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const lstat = await fs.lstat(absolutePath);
    const real = await fs.realpath(absolutePath);
    if (
      lstat.isSymbolicLink() ||
      !lstat.isFile() ||
      lstat.nlink !== 1 ||
      !isInside(input.projectRoot, real)
    ) {
      return {
        reopened: null,
        blockers: ["source_runtime_receipt_store_file_not_immutable_regular"],
      };
    }
    handle = await fs.open(absolutePath, "r");
    const before = await handle.stat();
    if (before.size < 2 || before.size > input.maxBytes) {
      return {
        reopened: null,
        blockers: ["receipt_resource_limit_exceeded"],
      };
    }
    const bytes = await handle.readFile();
    const after = await handle.stat();
    const beforeIdentity = fileIdentity(before);
    const afterIdentity = fileIdentity(after);
    if (!identitiesEqual(beforeIdentity, afterIdentity)) {
      return {
        reopened: null,
        blockers: ["source_runtime_receipt_changed_while_reading"],
      };
    }
    const observedSha256 = sha256(bytes);
    if (
      observedSha256 !== input.persisted.artifact.sha256 ||
      bytes.byteLength !== input.persisted.artifact.sizeBytes
    ) {
      blockers.push("source_runtime_receipt_store_artifact_identity_mismatch");
    }
    const text = decodeUtf8(bytes);
    let parsed: unknown = null;
    try {
      parsed = text == null ? null : (JSON.parse(text) as unknown);
    } catch {
      blockers.push("source_runtime_receipt_store_json_invalid");
    }
    if (text == null)
      blockers.push("source_runtime_receipt_store_utf8_invalid");
    const resourceBlocker = jsonResourceBlocker(parsed, input.limits);
    if (resourceBlocker != null)
      blockers.push(`source_runtime_receipt_store_${resourceBlocker}`);
    if (
      !isTheoryRuntimeReceiptV1(parsed) ||
      canonicalizeNhm2PredictionRun1Json(parsed) !==
        canonicalizeNhm2PredictionRun1Json(input.persisted.receipt)
    ) {
      blockers.push("source_runtime_receipt_store_reopen_mismatch");
    }
    return {
      reopened:
        blockers.length === 0 && isTheoryRuntimeReceiptV1(parsed)
          ? {
              receipt: parsed,
              bytes,
              sha256: observedSha256,
              sizeBytes: bytes.byteLength,
              identity: afterIdentity,
            }
          : null,
      blockers: uniqueSorted(blockers),
    };
  } catch (error) {
    return {
      reopened: null,
      blockers: [
        `source_runtime_receipt_store_reopen_failed:${
          (error as NodeJS.ErrnoException).code ?? "unknown"
        }`,
      ],
    };
  } finally {
    if (handle != null) await handle.close().catch(() => undefined);
  }
};

const exactFalseReceiptClaims = (receipt: TheoryRuntimeReceiptV1): boolean =>
  receipt.claimBoundary.promotionAllowed === false &&
  receipt.claimBoundary.currentTier === "diagnostic" &&
  (receipt.claimBoundary.maximumTier === "diagnostic" ||
    receipt.claimBoundary.maximumTier === "reduced_order");

const validateReceipt = (input: {
  parsed: unknown;
  sha256: string;
  sizeBytes: number;
  manifest: Nhm2PrimaryRawOutputManifestV1;
  manifestSha256: string;
  manifestSizeBytes: number;
  manifestAbsolutePath: string;
  projectRoot: string;
  runRootRealPath: string;
  sourceFiles: readonly Nhm2PredictionRun1FileRefV2[];
}): { receipt: TheoryRuntimeReceiptV1 | null; blockers: string[] } => {
  const blockers: string[] = [];
  if (!isTheoryRuntimeReceiptV1(input.parsed)) {
    return { receipt: null, blockers: ["source_runtime_receipt_invalid"] };
  }
  const receipt = input.parsed;
  const execution = input.manifest.execution;
  const artifactManifest = receipt.outputs.artifactManifest;
  if (
    receipt.artifactId !== THEORY_RUNTIME_RECEIPT_ARTIFACT_ID ||
    receipt.schemaVersion !== THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION ||
    receipt.status !== "completed" ||
    receipt.receiptId !== execution.receiptId ||
    receipt.runtimeId !== execution.runtimeId ||
    receipt.provenance.gitSha !== execution.sourceCommitSha ||
    receipt.provenance.startedAt !== execution.startedAt ||
    receipt.provenance.completedAt !== execution.completedAt ||
    receipt.provenance.durationMs !== execution.durationMs ||
    receipt.execution?.exitCode !== 0 ||
    receipt.execution.timedOut !== false ||
    receipt.execution.error !== null ||
    receipt.execution.outputDirectoryBound !== true ||
    receipt.execution.outputDirectory == null ||
    !samePath(
      path.resolve(input.projectRoot, receipt.execution.outputDirectory),
      input.runRootRealPath,
    ) ||
    !exactFalseReceiptClaims(receipt)
  ) {
    blockers.push("source_runtime_receipt_execution_binding_invalid");
  }
  if (
    artifactManifest == null ||
    artifactManifest.boundToExecution !== true ||
    artifactManifest.requestId !== execution.requestId ||
    artifactManifest.runtimeId !== execution.runtimeId ||
    artifactManifest.gitSha !== execution.sourceCommitSha ||
    artifactManifest.startedAt !== execution.startedAt ||
    artifactManifest.completedAt !== execution.completedAt ||
    artifactManifest.outputDirectory == null ||
    !samePath(
      path.resolve(input.projectRoot, artifactManifest.outputDirectory),
      input.runRootRealPath,
    )
  ) {
    blockers.push("source_runtime_receipt_artifact_manifest_invalid");
  } else {
    const matchingEntries = artifactManifest.entries.filter(
      (entry) =>
        samePath(
          path.resolve(input.projectRoot, ...entry.path.split("/")),
          input.manifestAbsolutePath,
        ) &&
        entry.sha256 === input.manifestSha256 &&
        entry.sizeBytes === input.manifestSizeBytes,
    );
    if (
      matchingEntries.length !== 1 ||
      matchingEntries[0]?.freshness !== "new"
    ) {
      blockers.push("source_runtime_receipt_manifest_freshness_not_new");
    }
    for (const sourceFile of input.sourceFiles) {
      const matches = artifactManifest.entries.filter((entry) => {
        const expectedAbsolutePath = path.resolve(
          input.runRootRealPath,
          ...sourceFile.path.split("/"),
        );
        return (
          samePath(
            path.resolve(input.projectRoot, ...entry.path.split("/")),
            expectedAbsolutePath,
          ) &&
          entry.sha256 === sourceFile.sha256 &&
          entry.sizeBytes === sourceFile.sizeBytes
        );
      });
      if (matches.length !== 1 || matches[0]?.freshness !== "new") {
        blockers.push(
          `source_runtime_receipt_file_freshness_not_new:${sourceFile.fileId}`,
        );
      }
    }
  }
  if (!SHA256.test(input.sha256) || input.sizeBytes < 2)
    blockers.push("source_runtime_receipt_hash_invalid");
  return { receipt, blockers };
};

const parseNumericalBytes = (
  descriptor: Nhm2PrimaryRawOutputFileV1,
  bytes: Uint8Array,
): Float64Array | null => {
  if (
    descriptor.representation.kind !== "numerical_array" ||
    bytes.byteLength % 8 !== 0
  ) {
    return null;
  }
  const shape = descriptor.representation.shape;
  const count = shape.reduce((product, item) => product * item, 1);
  if (!Number.isSafeInteger(count) || count * 8 !== bytes.byteLength)
    return null;
  const values = new Float64Array(count);
  const view = Buffer.from(bytes);
  for (let index = 0; index < count; index += 1) {
    const value = view.readDoubleLE(index * 8);
    if (!Number.isFinite(value)) return null;
    values[index] = value;
  }
  return values;
};

const parseRecordBytes = (
  descriptor: Nhm2PrimaryRawOutputFileV1,
  bytes: Uint8Array,
): ReadonlyArray<Readonly<Record<string, unknown>>> | null => {
  if (descriptor.representation.kind !== "records") return null;
  const text = decodeUtf8(bytes);
  if (text == null) return null;
  const records: Record<string, unknown>[] = [];
  if (descriptor.representation.format === "json") {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed) || !parsed.every(isRecord)) return null;
      if (canonicalizeNhm2PredictionRun1Json(parsed) !== text) return null;
      records.push(...(parsed as Record<string, unknown>[]));
    } catch {
      return null;
    }
  } else {
    if (!text.endsWith("\n") || text.includes("\r")) return null;
    const lines = text.slice(0, -1).split("\n");
    try {
      for (const line of lines) {
        const parsed = JSON.parse(line) as unknown;
        if (!isRecord(parsed) || JSON.stringify(parsed) !== line) return null;
        records.push(parsed);
      }
    } catch {
      return null;
    }
  }
  return records.length === descriptor.representation.recordCount
    ? records
    : null;
};

const reopenRegularFile = async (input: {
  absolutePath: string;
  expectedSha256: string;
  expectedSizeBytes: number;
  runRootRealPath: string;
  startedMs: number;
  completedMs: number;
  toleranceMs: number;
  maxBytes: number;
  expectedObserved?: {
    mtimeMs: number;
    ctimeMs: number;
    sizeBytes: number;
  };
}): Promise<{ bytes: Uint8Array | null; blockers: string[] }> => {
  const blockers: string[] = [];
  if (
    input.expectedSizeBytes < 1 ||
    input.expectedSizeBytes > input.maxBytes ||
    !SHA256.test(input.expectedSha256)
  ) {
    return { bytes: null, blockers: ["source_file_resource_limit_exceeded"] };
  }
  let before: Awaited<ReturnType<typeof fs.lstat>>;
  try {
    before = await fs.lstat(input.absolutePath);
  } catch {
    return { bytes: null, blockers: ["source_file_unreadable"] };
  }
  if (before.isSymbolicLink()) blockers.push("source_file_symlink_or_reparse");
  if (!before.isFile()) blockers.push("source_file_not_regular");
  if (before.nlink !== 1) blockers.push("source_file_hardlink_forbidden");
  if (
    before.size !== input.expectedSizeBytes ||
    (input.expectedObserved != null &&
      (before.size !== input.expectedObserved.sizeBytes ||
        before.mtimeMs !== input.expectedObserved.mtimeMs ||
        before.ctimeMs !== input.expectedObserved.ctimeMs))
  ) {
    blockers.push("source_file_changed_since_verification");
  }
  const lower = input.startedMs - input.toleranceMs;
  const upper = input.completedMs + input.toleranceMs;
  if (
    before.mtimeMs < lower ||
    before.mtimeMs > upper ||
    before.ctimeMs < lower ||
    before.ctimeMs > upper
  ) {
    blockers.push("source_file_freshness_outside_execution_interval");
  }
  try {
    const real = await fs.realpath(input.absolutePath);
    if (
      !isInside(input.runRootRealPath, real) ||
      !samePath(real, input.absolutePath)
    ) {
      blockers.push("source_file_realpath_escape_or_alias");
    }
  } catch {
    blockers.push("source_file_unreadable");
  }
  if (blockers.length > 0) return { bytes: null, blockers };
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const noFollow =
      process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
    handle = await fs.open(input.absolutePath, fsConstants.O_RDONLY | noFollow);
    const opened = await handle.stat();
    if (!identitiesEqual(fileIdentity(before), fileIdentity(opened))) {
      blockers.push("source_file_changed_during_reopen");
      return { bytes: null, blockers };
    }
    const bytes = await handle.readFile();
    const after = await fs.lstat(input.absolutePath);
    if (
      after.isSymbolicLink() ||
      !after.isFile() ||
      after.nlink !== 1 ||
      !identitiesEqual(fileIdentity(before), fileIdentity(after))
    ) {
      blockers.push("source_file_changed_during_reopen");
    }
    if (
      bytes.byteLength !== input.expectedSizeBytes ||
      !timingSafeHexEqual(sha256(bytes), input.expectedSha256)
    ) {
      blockers.push("source_file_hash_or_size_mismatch");
    }
    return { bytes: blockers.length === 0 ? bytes : null, blockers };
  } catch {
    blockers.push("source_file_read_failed");
    return { bytes: null, blockers };
  } finally {
    await handle?.close().catch(() => undefined);
  }
};

const reopenVerifiedRun = async (input: {
  verification: Extract<
    Nhm2PrimaryRawOutputFilesystemVerification,
    { verified: true }
  >;
  limits: ResolvedLimits;
}): Promise<{
  manifest: Nhm2PrimaryRawOutputManifestV1 | null;
  manifestSizeBytes: number;
  files: Map<string, ReopenedFile>;
  fileRefs: Nhm2PredictionRun1FileRefV2[];
  blockers: string[];
}> => {
  const blockers: string[] = [];
  const files = new Map<string, ReopenedFile>();
  const fileRefs: Nhm2PredictionRun1FileRefV2[] = [];
  const verification = input.verification;
  if (
    verification.violations.length !== 0 ||
    verification.manifestSha256 == null ||
    !SHA256.test(verification.manifestSha256) ||
    verification.files.length !==
      verification.manifest.fileInventory.files.length ||
    verification.files.length < 1 ||
    verification.files.length > input.limits.maxSourceFiles
  ) {
    return {
      manifest: null,
      manifestSizeBytes: 0,
      files,
      fileRefs,
      blockers: ["raw_filesystem_verification_not_closed"],
    };
  }
  let rootStat: Awaited<ReturnType<typeof fs.lstat>>;
  let rootReal: string;
  try {
    rootStat = await fs.lstat(verification.runRootRealPath);
    rootReal = await fs.realpath(verification.runRootRealPath);
  } catch {
    return {
      manifest: null,
      manifestSizeBytes: 0,
      files,
      fileRefs,
      blockers: ["source_run_root_unreadable"],
    };
  }
  if (
    rootStat.isSymbolicLink() ||
    !rootStat.isDirectory() ||
    !samePath(rootReal, verification.runRootRealPath)
  ) {
    return {
      manifest: null,
      manifestSizeBytes: 0,
      files,
      fileRefs,
      blockers: ["source_run_root_symlink_or_alias"],
    };
  }
  const startedMs = Date.parse(verification.manifest.execution.startedAt);
  const completedMs = Date.parse(verification.manifest.execution.completedAt);
  if (
    !Number.isFinite(startedMs) ||
    !Number.isFinite(completedMs) ||
    startedMs > completedMs
  ) {
    return {
      manifest: null,
      manifestSizeBytes: 0,
      files,
      fileRefs,
      blockers: ["source_execution_interval_invalid"],
    };
  }
  if (
    !path.isAbsolute(verification.manifestPath) ||
    !isInside(rootReal, verification.manifestPath)
  ) {
    blockers.push("source_manifest_path_escape");
    return { manifest: null, manifestSizeBytes: 0, files, fileRefs, blockers };
  }
  let manifestStat: Awaited<ReturnType<typeof fs.lstat>>;
  try {
    manifestStat = await fs.lstat(verification.manifestPath);
  } catch {
    blockers.push("source_manifest_unreadable");
    return { manifest: null, manifestSizeBytes: 0, files, fileRefs, blockers };
  }
  const reopenedManifest = await reopenRegularFile({
    absolutePath: verification.manifestPath,
    expectedSha256: verification.manifestSha256,
    expectedSizeBytes: manifestStat.size,
    runRootRealPath: rootReal,
    startedMs,
    completedMs,
    toleranceMs: input.limits.freshnessToleranceMs,
    maxBytes: input.limits.maxManifestBytes,
  });
  blockers.push(
    ...reopenedManifest.blockers.map((entry) => `manifest:${entry}`),
  );
  if (reopenedManifest.bytes == null) {
    return {
      manifest: null,
      manifestSizeBytes: manifestStat.size,
      files,
      fileRefs,
      blockers: uniqueSorted(blockers),
    };
  }
  const manifestText = decodeUtf8(reopenedManifest.bytes);
  let manifest: Nhm2PrimaryRawOutputManifestV1 | null = null;
  try {
    const parsed =
      manifestText == null ? null : (JSON.parse(manifestText) as unknown);
    if (
      !isRecord(parsed) ||
      manifestText !== JSON.stringify(parsed) ||
      canonicalizeNhm2PredictionRun1Json(parsed) !==
        canonicalizeNhm2PredictionRun1Json(verification.manifest)
    ) {
      blockers.push("source_manifest_reopen_mismatch");
    } else {
      manifest = parsed as unknown as Nhm2PrimaryRawOutputManifestV1;
    }
  } catch {
    blockers.push("source_manifest_json_invalid");
  }
  if (manifest == null) {
    return {
      manifest,
      manifestSizeBytes: manifestStat.size,
      files,
      fileRefs,
      blockers: uniqueSorted(blockers),
    };
  }

  const verifiedByFileId = new Map(
    verification.files.map((file) => [file.descriptor.fileId, file]),
  );
  let totalBytes = 0;
  for (const descriptor of manifest.fileInventory.files) {
    totalBytes += descriptor.sizeBytes;
    if (
      !Number.isSafeInteger(totalBytes) ||
      totalBytes > input.limits.maxSourceTotalBytes ||
      descriptor.sizeBytes > input.limits.maxSourceFileBytes
    ) {
      blockers.push("source_run_resource_limit_exceeded");
      break;
    }
    if (!pinnedPath(descriptor.path, input.limits.maxPathDepth)) {
      blockers.push(`source_file_path_invalid:${descriptor.fileId}`);
      continue;
    }
    const verified = verifiedByFileId.get(descriptor.fileId);
    if (
      verified == null ||
      canonicalizeNhm2PredictionRun1Json(verified.descriptor) !==
        canonicalizeNhm2PredictionRun1Json(descriptor) ||
      verified.observedSha256 !== descriptor.sha256 ||
      verified.observedSizeBytes !== descriptor.sizeBytes
    ) {
      blockers.push(
        `source_file_verification_binding_mismatch:${descriptor.fileId}`,
      );
      continue;
    }
    const absolutePath = path.resolve(rootReal, ...descriptor.path.split("/"));
    if (!isInside(rootReal, absolutePath)) {
      blockers.push(`source_file_path_escape:${descriptor.fileId}`);
      continue;
    }
    const reopened = await reopenRegularFile({
      absolutePath,
      expectedSha256: descriptor.sha256,
      expectedSizeBytes: descriptor.sizeBytes,
      runRootRealPath: rootReal,
      startedMs,
      completedMs,
      toleranceMs: input.limits.freshnessToleranceMs,
      maxBytes: input.limits.maxSourceFileBytes,
      expectedObserved: {
        mtimeMs: verified.observedMtimeMs,
        ctimeMs: verified.observedCtimeMs,
        sizeBytes: verified.observedSizeBytes,
      },
    });
    blockers.push(
      ...reopened.blockers.map((entry) => `${entry}:${descriptor.fileId}`),
    );
    if (reopened.bytes == null) continue;
    if (descriptor.representation.kind === "numerical_array") {
      const values = parseNumericalBytes(descriptor, reopened.bytes);
      if (values == null) {
        blockers.push(`source_numerical_file_invalid:${descriptor.fileId}`);
        continue;
      }
      files.set(descriptor.fileId, {
        kind: "numerical_array",
        descriptor,
        bytes: reopened.bytes,
        values,
      });
    } else {
      const records = parseRecordBytes(descriptor, reopened.bytes);
      if (records == null) {
        blockers.push(`source_record_file_invalid:${descriptor.fileId}`);
        continue;
      }
      files.set(descriptor.fileId, {
        kind: "records",
        descriptor,
        bytes: reopened.bytes,
        records,
      });
    }
    fileRefs.push({
      familyId: descriptor.familyId,
      semanticRole: descriptor.semanticRole,
      fileId: descriptor.fileId,
      path: descriptor.path,
      sha256: descriptor.sha256,
      sizeBytes: descriptor.sizeBytes,
    });
  }
  let rootAfter: Awaited<ReturnType<typeof fs.lstat>> | null = null;
  try {
    rootAfter = await fs.lstat(rootReal);
  } catch {
    blockers.push("source_run_root_changed_during_reopen");
  }
  if (
    rootAfter != null &&
    !identitiesEqual(fileIdentity(rootStat), fileIdentity(rootAfter))
  ) {
    blockers.push("source_run_root_changed_during_reopen");
  }
  if (files.size !== manifest.fileInventory.files.length)
    blockers.push("source_run_file_reopen_incomplete");
  fileRefs.sort((left, right) =>
    Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)),
  );
  return {
    manifest,
    manifestSizeBytes: manifestStat.size,
    files,
    fileRefs,
    blockers: uniqueSorted(blockers),
  };
};

const fileByRole = (
  files: ReadonlyMap<string, ReopenedFile>,
  familyId: string,
  semanticRole: string,
): ReopenedFile | null => {
  const matches = [...files.values()].filter(
    (file) =>
      file.descriptor.familyId === familyId &&
      file.descriptor.semanticRole === semanticRole,
  );
  return matches.length === 1 ? matches[0]! : null;
};

const rowCount = (file: ReopenedNumericalFile): number =>
  file.descriptor.representation.kind === "numerical_array"
    ? (file.descriptor.representation.shape[0] ?? 0)
    : 0;

const columnCount = (file: ReopenedNumericalFile): number =>
  file.descriptor.representation.kind === "numerical_array"
    ? (file.descriptor.representation.shape[1] ?? 0)
    : 0;

const at = (file: ReopenedNumericalFile, row: number, column: number): number =>
  file.values[row * columnCount(file) + column] ?? Number.NaN;

const recordFieldUnit = (
  file: ReopenedRecordFile,
  fieldName: string,
): string | null | undefined =>
  file.descriptor.representation.kind === "records"
    ? file.descriptor.representation.schema.fields.find(
        (field) => field.name === fieldName,
      )?.unit
    : undefined;

const replayClaimBoundaryClosed = (
  replay: Nhm2PrimaryRawMaterialDynamicsReplayResult,
): boolean =>
  replay.claimBoundary.diagnosticReplayOnly === true &&
  replay.claimBoundary.theoryClosureEstablished === false &&
  replay.claimBoundary.physicalViabilityEstablished === false &&
  replay.claimBoundary.transportEstablished === false &&
  replay.claimBoundary.propulsionEstablished === false &&
  replay.claimBoundary.routeEtaEstablished === false &&
  replay.claimBoundary.certifiedSpeedEstablished === false &&
  replay.claimBoundary.empiricalValidationEstablished === false;

const expectedReplayClosure = (input: {
  manifestSha256: string;
  files: readonly Nhm2PredictionRun1FileRefV2[];
}) => {
  const files = input.files.map((file) => ({
    familyId: file.familyId,
    semanticRole: file.semanticRole,
    fileId: file.fileId,
    path: file.path,
    sha256: file.sha256,
    sizeBytes: file.sizeBytes,
  }));
  const payload = {
    manifestSha256: input.manifestSha256,
    contentPolicySha256: NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256,
    files,
  };
  return {
    verified: true as const,
    ...payload,
    closureSha256: sha256DomainJson(REPLAY_CLOSURE_DOMAIN, payload),
  };
};

const closeEnough = (left: number, right: number): boolean => {
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= 32 * Number.EPSILON * scale;
};

const replayObservableProjection = (input: {
  files: ReadonlyMap<string, ReopenedFile>;
  replay: Nhm2PrimaryRawMaterialDynamicsReplayResult;
}): {
  definitions: ReopenedRecordFile | null;
  derivations: ReopenedRecordFile | null;
  operators: ReopenedRecordFile | null;
  uncertainty: ReopenedNumericalFile | null;
  blockers: string[];
} => {
  const blockers: string[] = [];
  const definitions = fileByRole(
    input.files,
    "observable_projection",
    "observable_definition_records",
  );
  const derivations = fileByRole(
    input.files,
    "observable_projection",
    "projection_derivation_inputs",
  );
  const operators = fileByRole(
    input.files,
    "observable_projection",
    "projection_operator_entries",
  );
  const projectionSource = fileByRole(
    input.files,
    "observable_projection",
    "projection_source_values",
  );
  const jacobian = fileByRole(
    input.files,
    "observable_projection",
    "projection_jacobian_components",
  );
  const uncertainty = fileByRole(
    input.files,
    "observable_projection",
    "projection_uncertainty_samples",
  );
  if (
    definitions?.kind !== "records" ||
    derivations?.kind !== "records" ||
    operators?.kind !== "records" ||
    projectionSource?.kind !== "numerical_array" ||
    jacobian?.kind !== "numerical_array" ||
    uncertainty?.kind !== "numerical_array"
  ) {
    blockers.push("observable_projection_primitive_set_incomplete");
    return {
      definitions: definitions?.kind === "records" ? definitions : null,
      derivations: derivations?.kind === "records" ? derivations : null,
      operators: operators?.kind === "records" ? operators : null,
      uncertainty: uncertainty?.kind === "numerical_array" ? uncertainty : null,
      blockers,
    };
  }
  const exactSix = NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS;
  if (
    definitions.records.length !== exactSix.length ||
    derivations.records.length !== exactSix.length ||
    operators.records.length !== exactSix.length ||
    rowCount(projectionSource) !== exactSix.length ||
    columnCount(projectionSource) !== 1 ||
    rowCount(jacobian) !== exactSix.length ||
    columnCount(jacobian) !== 1 ||
    rowCount(uncertainty) !== exactSix.length ||
    columnCount(uncertainty) !== 3
  ) {
    blockers.push("observable_projection_exact_six_layout_invalid");
  }
  const computedPredictions: number[] = [];
  const computedUncertainty: number[] = [];
  exactSix.forEach((observableId, index) => {
    const definition = definitions.records[index];
    const derivation = derivations.records[index];
    const operator = operators.records[index];
    if (
      definition?.observable_id !== observableId ||
      definition.unit !==
        NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID[observableId] ||
      !isIso(definition.target_time) ||
      !isText(definition.projection_id) ||
      derivation?.observable_id !== observableId ||
      !isText(derivation.source_file_id) ||
      typeof derivation.source_sha256 !== "string" ||
      !SHA256.test(derivation.source_sha256) ||
      operator?.observable_id !== observableId ||
      Number(operator.source_index) !== index ||
      !finite(operator.coefficient)
    ) {
      blockers.push(`observable_projection_binding_invalid:${observableId}`);
      return;
    }
    const lower = at(uncertainty, index, 0);
    const central = at(uncertainty, index, 1);
    const upper = at(uncertainty, index, 2);
    if (lower > central || central > upper) {
      blockers.push(
        `observable_projection_uncertainty_invalid:${observableId}`,
      );
      return;
    }
    computedPredictions.push(
      operator.coefficient * at(projectionSource, index, 0),
    );
    computedUncertainty.push(
      Math.abs(at(jacobian, index, 0)) *
        Math.max(Math.abs(central - lower), Math.abs(upper - central)),
    );
  });
  const metrics = input.replay.families.observableProjection.metrics;
  if (
    metrics.observableIds.length !== exactSix.length ||
    !exactSix.every((id, index) => metrics.observableIds[index] === id) ||
    metrics.predictedValues.length !== exactSix.length ||
    metrics.propagatedUncertainty95.length !== exactSix.length ||
    !computedPredictions.every((value, index) =>
      closeEnough(value, metrics.predictedValues[index] ?? Number.NaN),
    ) ||
    !computedUncertainty.every((value, index) =>
      closeEnough(value, metrics.propagatedUncertainty95[index] ?? Number.NaN),
    )
  ) {
    blockers.push("material_dynamics_replay_observable_metrics_mismatch");
  }
  const allowedReplayBlockers =
    input.replay.families.observableProjection.blockers.filter(
      (entry) => entry !== REPLAY_OBSERVABLE_BLOCKER,
    );
  if (
    input.replay.families.observableProjection.status !== "blocked" ||
    !input.replay.families.observableProjection.blockers.includes(
      REPLAY_OBSERVABLE_BLOCKER,
    ) ||
    allowedReplayBlockers.length > 0 ||
    input.replay.families.observableProjection.breaches.length > 0 ||
    metrics.dimensionalNormalizationResolved !== false ||
    metrics.comparisonSampleVectorsHaveAuthority !== false
  ) {
    blockers.push(
      "material_dynamics_replay_observable_not_dimension_only_blocked",
    );
  }
  return {
    definitions,
    derivations,
    operators,
    uncertainty,
    blockers: uniqueSorted(blockers),
  };
};

const applyConversion = (
  conversion: Nhm2PredictionRun1UnitConversionV2,
  value: number,
): number => conversion.parameters.scale * value + conversion.parameters.offset;

const sourceRoleHasAuthority = (file: ReopenedNumericalFile): boolean => {
  if (
    !(
      NHM2_PRIMARY_RAW_OBSERVABLE_SOURCE_FAMILY_IDS as readonly string[]
    ).includes(file.descriptor.familyId)
  ) {
    return false;
  }
  const policies = NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES as unknown as Record<
    string,
    Record<string, Nhm2PrimaryRawRoleContentPolicyV1>
  >;
  const policy =
    policies[file.descriptor.familyId]?.[file.descriptor.semanticRole];
  return (
    policy?.kind === "numerical_array" &&
    policy.producerValueIsComparisonOnly === false
  );
};

const compilePredictions = (input: {
  files: ReadonlyMap<string, ReopenedFile>;
  definitions: ReopenedRecordFile;
  derivations: ReopenedRecordFile;
  operators: ReopenedRecordFile;
  uncertaintyFile: ReopenedNumericalFile;
  bindingSet: Nhm2PredictionRun1BindingSetV2;
}): { predictions: Nhm2PredictionRun1PredictionV2[]; blockers: string[] } => {
  const blockers: string[] = [];
  const predictions: Nhm2PredictionRun1PredictionV2[] = [];
  NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS.forEach((observableId, index) => {
    const binding = input.bindingSet.observableBindings[index]!;
    const definition = input.definitions.records[index]!;
    const derivation = input.derivations.records[index]!;
    const operatorRecord = input.operators.records[index]!;
    const sourceFile = input.files.get(binding.sourceComponent.fileId);
    const operatorFile = input.operators;
    const targetUnit = NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID[observableId];
    if (
      binding.observableId !== observableId ||
      binding.projectionId !== definition.projection_id ||
      derivation.observable_id !== observableId ||
      derivation.source_file_id !== binding.sourceComponent.fileId ||
      derivation.source_sha256 !== binding.sourceComponent.sha256 ||
      sourceFile?.kind !== "numerical_array" ||
      sourceFile.descriptor.familyId !== binding.sourceComponent.familyId ||
      sourceFile.descriptor.semanticRole !==
        binding.sourceComponent.semanticRole ||
      sourceFile.descriptor.sha256 !== binding.sourceComponent.sha256 ||
      !sourceRoleHasAuthority(sourceFile) ||
      sourceFile.descriptor.representation.kind !== "numerical_array" ||
      sourceFile.descriptor.representation.unit !==
        binding.sourceComponent.sourceUnit ||
      sourceFile.descriptor.representation.componentOrder[
        binding.sourceComponent.componentIndex
      ] !== binding.sourceComponent.component ||
      binding.sourceComponent.rowIndex >= rowCount(sourceFile) ||
      binding.sourceComponent.componentIndex >= columnCount(sourceFile)
    ) {
      blockers.push(
        `prediction_source_component_binding_invalid:${observableId}`,
      );
      return;
    }
    if (
      binding.operator.fileId !== operatorFile.descriptor.fileId ||
      binding.operator.sha256 !== operatorFile.descriptor.sha256 ||
      binding.operator.rowIndex !== index ||
      binding.operator.sourceIndex !== index ||
      operatorRecord.observable_id !== observableId ||
      Number(operatorRecord.source_index) !== binding.operator.sourceIndex ||
      operatorRecord.coefficient !== binding.operator.coefficient ||
      recordFieldUnit(operatorFile, "coefficient") !==
        binding.operator.coefficientStorageUnit
    ) {
      blockers.push(`prediction_operator_binding_invalid:${observableId}`);
      return;
    }
    if (
      binding.normalization.inputUnit !== binding.sourceComponent.sourceUnit ||
      binding.normalization.outputUnit !== binding.conversion.sourceUnit ||
      binding.conversion.targetUnit !== targetUnit ||
      nhm2PredictionRun1ObservableUnitCompositionViolations(binding, targetUnit)
        .length !== 0
    ) {
      blockers.push(`prediction_unit_binding_invalid:${observableId}`);
      return;
    }
    if (
      binding.uncertainty.fileId !== input.uncertaintyFile.descriptor.fileId ||
      binding.uncertainty.sha256 !== input.uncertaintyFile.descriptor.sha256 ||
      binding.uncertainty.rowIndex !== index ||
      input.uncertaintyFile.descriptor.representation.kind !==
        "numerical_array" ||
      input.uncertaintyFile.descriptor.representation.unit !==
        binding.uncertainty.sourceUnit ||
      binding.uncertainty.targetUnit !== targetUnit ||
      input.uncertaintyFile.descriptor.representation.componentOrder[0] !==
        binding.uncertainty.lowerComponent ||
      input.uncertaintyFile.descriptor.representation.componentOrder[1] !==
        binding.uncertainty.centralComponent ||
      input.uncertaintyFile.descriptor.representation.componentOrder[2] !==
        binding.uncertainty.upperComponent
    ) {
      blockers.push(`prediction_uncertainty_binding_invalid:${observableId}`);
      return;
    }
    const rawSource = at(
      sourceFile,
      binding.sourceComponent.rowIndex,
      binding.sourceComponent.componentIndex,
    );
    const normalizedSource =
      binding.normalization.parameters.scale * rawSource +
      binding.normalization.parameters.offset;
    const convertedSource = applyConversion(
      binding.conversion,
      normalizedSource,
    );
    const centralValue = binding.operator.coefficient * convertedSource;
    const uncertaintyLowerSource = at(input.uncertaintyFile, index, 0);
    const uncertaintyCentralSource = at(input.uncertaintyFile, index, 1);
    const uncertaintyUpperSource = at(input.uncertaintyFile, index, 2);
    const convertedUncertainty = [
      uncertaintyLowerSource,
      uncertaintyCentralSource,
      uncertaintyUpperSource,
    ].map(
      (value) =>
        binding.operator.coefficient *
        applyConversion(binding.uncertainty.conversion, value),
    );
    const uncertaintyCentral = convertedUncertainty[1] ?? Number.NaN;
    if (
      ![centralValue, ...convertedUncertainty].every(Number.isFinite) ||
      !closeEnough(centralValue, uncertaintyCentral)
    ) {
      blockers.push(`prediction_uncertainty_central_mismatch:${observableId}`);
      return;
    }
    const lower = Math.min(...convertedUncertainty);
    const upper = Math.max(...convertedUncertainty);
    if (lower > centralValue || upper < centralValue) {
      blockers.push(`prediction_uncertainty_interval_invalid:${observableId}`);
      return;
    }
    predictions.push({
      observableId,
      projectionId: binding.projectionId,
      targetTime: String(definition.target_time),
      unit: targetUnit,
      centralValue,
      interval95: {
        lower,
        upper,
        coverageProbability: 0.95,
      },
      derivation: {
        sourceComponent: binding.sourceComponent,
        operator: binding.operator,
        normalization: binding.normalization,
        conversion: binding.conversion,
        uncertainty: binding.uncertainty,
      },
    });
  });
  if (predictions.length !== NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS.length)
    blockers.push("prediction_exact_six_recomputation_incomplete");
  return { predictions, blockers: uniqueSorted(blockers) };
};

const targetReservationBlockers = (
  input: Nhm2PredictionRun1BootstrapCompilerInput,
  manifest: Nhm2PrimaryRawOutputManifestV1,
): string[] => {
  const blockers: string[] = [];
  const target = input.targetRunReservation;
  if (
    !isIso(input.generatedAt) ||
    !isIso(input.frozenAt) ||
    !isIso(target?.plannedStartAt) ||
    !isText(input.bootstrapId) ||
    ![
      target?.candidateId,
      target?.manifestId,
      target?.requestId,
      target?.runId,
      target?.runtimeId,
    ].every(isText)
  ) {
    return ["bootstrap_publication_identity_or_timing_invalid"];
  }
  const completed = Date.parse(manifest.execution.completedAt);
  const generated = Date.parse(input.generatedAt);
  const frozen = Date.parse(input.frozenAt);
  const planned = Date.parse(target.plannedStartAt);
  if (completed > generated || generated > frozen || frozen >= planned) {
    blockers.push("bootstrap_publication_chronology_invalid");
  }
  const source = manifest.execution;
  if (
    target.candidateId === manifest.identity.candidateId ||
    target.requestId === source.requestId ||
    target.runId === source.runId ||
    target.runtimeId === source.runtimeId
  ) {
    blockers.push("bootstrap_target_run_not_distinct");
  }
  return blockers;
};

export async function compileNhm2PredictionRun1BootstrapV2(
  input: Nhm2PredictionRun1BootstrapCompilerInput,
): Promise<Nhm2PredictionRun1BootstrapCompilation> {
  const limits = resolveLimits(input.resourceLimits);
  const blockers: string[] = [];
  const inputResourceBlockers = [
    jsonResourceBlocker(input.rawVerification.manifest, limits),
    jsonResourceBlocker(input.materialDynamicsReplay, limits),
    jsonResourceBlocker(input.targetRunReservation, limits),
  ].filter((entry): entry is string => entry != null);
  if (inputResourceBlockers.length > 0) {
    return {
      status: "not_ready",
      blockers: uniqueSorted(inputResourceBlockers),
      artifact: null,
    };
  }
  if (input.rawVerification.verified !== true) {
    return {
      status: "not_ready",
      blockers: ["raw_filesystem_verification_required"],
      artifact: null,
    };
  }
  const reopened = await reopenVerifiedRun({
    verification: input.rawVerification,
    limits,
  });
  blockers.push(...reopened.blockers);
  if (reopened.manifest == null || reopened.blockers.length > 0) {
    return {
      status: "not_ready",
      blockers: uniqueSorted(blockers),
      artifact: null,
    };
  }
  const manifest = reopened.manifest;
  if (
    manifest.contentPolicy.sha256 !== NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256 ||
    manifest.execution.exitCode !== 0 ||
    manifest.execution.terminationSignal !== null ||
    manifest.execution.planRole !== "primary_numerical" ||
    manifest.identity.laneId !== "nhm2_shift_lapse" ||
    !GIT_SHA.test(manifest.execution.sourceCommitSha)
  ) {
    blockers.push("source_primary_run_manifest_not_admissible");
  }

  const receiptStoreBinding = input.sourceReceiptStoreBinding;
  const receiptProjectRoot =
    receiptStoreBinding == null
      ? undefined
      : receiptStoreRoots.get(receiptStoreBinding);
  if (receiptProjectRoot == null) {
    return {
      status: "not_ready",
      blockers: ["source_runtime_receipt_store_binding_unverified"],
      artifact: null,
    };
  }
  const expectedProjectRootSha256 = createHash("sha256")
    .update(RECEIPT_STORE_ROOT_HASH_DOMAIN, "utf8")
    .update(receiptProjectRoot, "utf8")
    .digest("hex");
  if (
    receiptStoreBinding == null ||
    receiptStoreBinding.projectRootSha256 !== expectedProjectRootSha256
  ) {
    return {
      status: "not_ready",
      blockers: ["source_runtime_receipt_store_binding_identity_invalid"],
      artifact: null,
    };
  }
  let persistedReceipt: Awaited<
    ReturnType<typeof readTheoryRuntimeReceiptArtifact>
  > = null;
  try {
    persistedReceipt = await readTheoryRuntimeReceiptArtifact({
      projectRoot: receiptProjectRoot,
      runtimeId: manifest.execution.runtimeId,
      requestId: manifest.execution.requestId,
      receiptId: manifest.execution.receiptId,
    });
  } catch (error) {
    blockers.push(
      `source_runtime_receipt_store_resolution_failed:${
        (error as NodeJS.ErrnoException).code ?? "invalid"
      }`,
    );
  }
  if (persistedReceipt == null) {
    blockers.push("source_runtime_receipt_immutable_artifact_missing");
    return {
      status: "not_ready",
      blockers: uniqueSorted(blockers),
      artifact: null,
    };
  }
  const firstReceiptReopen = await reopenPersistedReceipt({
    projectRoot: receiptProjectRoot,
    persisted: persistedReceipt,
    maxBytes: limits.maxReceiptBytes,
    limits,
  });
  blockers.push(...firstReceiptReopen.blockers);
  if (firstReceiptReopen.reopened == null) {
    return {
      status: "not_ready",
      blockers: uniqueSorted(blockers),
      artifact: null,
    };
  }
  const receiptFilesystem = await verifyTheoryRuntimeReceiptFilesystem({
    projectRoot: receiptProjectRoot,
    receipt: firstReceiptReopen.reopened.receipt,
  });
  blockers.push(
    ...receiptFilesystem.blockers.map(
      (entry) => `source_runtime_receipt_filesystem:${entry}`,
    ),
  );
  if (!receiptFilesystem.ok || !receiptFilesystem.freshnessProofVerified) {
    blockers.push("source_runtime_receipt_filesystem_verification_required");
  }
  if (
    receiptFilesystem.outputDirectory == null ||
    !samePath(
      receiptFilesystem.outputDirectory,
      input.rawVerification.runRootRealPath,
    )
  ) {
    blockers.push("source_runtime_receipt_filesystem_run_root_mismatch");
  }
  let persistedReceiptAfterVerification: Awaited<
    ReturnType<typeof readTheoryRuntimeReceiptArtifact>
  > = null;
  try {
    persistedReceiptAfterVerification = await readTheoryRuntimeReceiptArtifact({
      projectRoot: receiptProjectRoot,
      runtimeId: manifest.execution.runtimeId,
      requestId: manifest.execution.requestId,
      receiptId: manifest.execution.receiptId,
    });
  } catch {
    blockers.push(
      "source_runtime_receipt_store_post_verification_resolution_failed",
    );
  }
  if (persistedReceiptAfterVerification == null) {
    blockers.push("source_runtime_receipt_store_changed_during_verification");
  }
  const secondReceiptReopen =
    persistedReceiptAfterVerification == null
      ? { reopened: null, blockers: [] as string[] }
      : await reopenPersistedReceipt({
          projectRoot: receiptProjectRoot,
          persisted: persistedReceiptAfterVerification,
          maxBytes: limits.maxReceiptBytes,
          limits,
        });
  blockers.push(...secondReceiptReopen.blockers);
  if (
    secondReceiptReopen.reopened == null ||
    firstReceiptReopen.reopened.sha256 !==
      secondReceiptReopen.reopened.sha256 ||
    firstReceiptReopen.reopened.sizeBytes !==
      secondReceiptReopen.reopened.sizeBytes ||
    !identitiesEqual(
      firstReceiptReopen.reopened.identity,
      secondReceiptReopen.reopened.identity,
    )
  ) {
    blockers.push("source_runtime_receipt_store_changed_during_verification");
  }
  const receiptArtifact = firstReceiptReopen.reopened;
  const receiptValidation = validateReceipt({
    parsed: receiptArtifact.receipt,
    sha256: receiptArtifact.sha256,
    sizeBytes: receiptArtifact.sizeBytes,
    manifest,
    manifestSha256: input.rawVerification.manifestSha256,
    manifestSizeBytes: reopened.manifestSizeBytes,
    manifestAbsolutePath: input.rawVerification.manifestPath,
    projectRoot: receiptProjectRoot,
    runRootRealPath: input.rawVerification.runRootRealPath,
    sourceFiles: reopened.fileRefs,
  });
  blockers.push(...receiptValidation.blockers);

  const replay = input.materialDynamicsReplay;
  const expectedClosure = expectedReplayClosure({
    manifestSha256: input.rawVerification.manifestSha256,
    files: reopened.fileRefs,
  });
  if (
    replay.contractVersion !==
      NHM2_PRIMARY_RAW_MATERIAL_DYNAMICS_REPLAY_CONTRACT_VERSION ||
    replay.acceptedInput !== true ||
    replay.inputBlockers.length !== 0 ||
    replay.fileHashClosure == null ||
    canonicalizeNhm2PredictionRun1Json(replay.fileHashClosure) !==
      canonicalizeNhm2PredictionRun1Json(expectedClosure) ||
    !replayClaimBoundaryClosed(replay)
  ) {
    blockers.push("material_dynamics_replay_binding_invalid");
  }
  const observableReplay = replayObservableProjection({
    files: reopened.files,
    replay,
  });
  blockers.push(...observableReplay.blockers);
  blockers.push(...targetReservationBlockers(input, manifest));

  if (input.bindingSet == null) {
    blockers.push(REPLAY_OBSERVABLE_BLOCKER);
    return {
      status: "not_ready",
      blockers: uniqueSorted(blockers),
      artifact: null,
    };
  }
  const bindingArtifact = parseCanonicalJsonArtifact({
    bytes: input.bindingSet.bytes,
    expectedSha256: input.bindingSet.expectedSha256,
    maxBytes: limits.maxBindingSetBytes,
    limits,
    label: "binding_set",
  });
  blockers.push(...bindingArtifact.blockers);
  if (!isNhm2PredictionRun1BindingSetV2(bindingArtifact.parsed)) {
    blockers.push(
      ...nhm2PredictionRun1BindingSetViolations(bindingArtifact.parsed).map(
        (entry) => `binding_set_invalid:${entry}`,
      ),
    );
  }
  if (
    !isNhm2PredictionRun1BindingSetV2(bindingArtifact.parsed) ||
    observableReplay.definitions == null ||
    observableReplay.derivations == null ||
    observableReplay.operators == null ||
    observableReplay.uncertainty == null
  ) {
    return {
      status: "not_ready",
      blockers: uniqueSorted(blockers),
      artifact: null,
    };
  }
  const bindingSet = bindingArtifact.parsed;
  const planned = bindingSet.plannedSourceRun;
  if (
    planned.candidateId !== manifest.identity.candidateId ||
    planned.selectedProfileId !== manifest.identity.selectedProfileId ||
    planned.requestId !== manifest.execution.requestId ||
    planned.runId !== manifest.execution.runId ||
    planned.runtimeId !== manifest.execution.runtimeId ||
    Date.parse(bindingSet.generatedAt) <
      Date.parse(manifest.execution.completedAt) ||
    Date.parse(bindingSet.frozenAt) > Date.parse(input.frozenAt)
  ) {
    blockers.push("binding_set_not_frozen_between_source_and_target_runs");
  }
  const compiled = compilePredictions({
    files: reopened.files,
    definitions: observableReplay.definitions,
    derivations: observableReplay.derivations,
    operators: observableReplay.operators,
    uncertaintyFile: observableReplay.uncertainty,
    bindingSet,
  });
  blockers.push(...compiled.blockers);
  if (blockers.length > 0) {
    return {
      status: "not_ready",
      blockers: uniqueSorted(blockers),
      artifact: null,
    };
  }
  const receipt = receiptValidation.receipt!;
  const replayCanonical = canonicalizeNhm2PredictionRun1Json(replay);
  const replayBytes = Buffer.from(replayCanonical, "utf8");
  const sourceFileSetSha256 = computeNhm2PredictionRun1SourceSetSha256(
    reopened.fileRefs,
  );
  const predictionSetSha256 = computeNhm2PredictionRun1PredictionSetSha256(
    compiled.predictions,
  );
  const artifact: Nhm2PredictionRun1BootstrapArtifactV2 = {
    artifactId: NHM2_PREDICTION_RUN1_BOOTSTRAP_ARTIFACT_ID,
    contractVersion: NHM2_PREDICTION_RUN1_BOOTSTRAP_CONTRACT_VERSION,
    supersedesContractVersion: NHM2_PREDICTION_RUN1_BOOTSTRAP_SUPERSEDES,
    status: NHM2_PREDICTION_RUN1_BOOTSTRAP_STATUS,
    generatedAt: input.generatedAt,
    frozenAt: input.frozenAt,
    bootstrapId: input.bootstrapId,
    sourceRun: {
      candidateId: manifest.identity.candidateId,
      selectedProfileId: manifest.identity.selectedProfileId,
      requestId: manifest.execution.requestId,
      runId: manifest.execution.runId,
      runtimeId: manifest.execution.runtimeId,
      receiptId: manifest.execution.receiptId,
      sourceCommitSha: manifest.execution.sourceCommitSha,
      startedAt: manifest.execution.startedAt,
      completedAt: manifest.execution.completedAt,
      manifest: {
        artifactId: manifest.artifactId,
        contractVersion: manifest.contractVersion,
        sha256: input.rawVerification.manifestSha256,
        sizeBytes: reopened.manifestSizeBytes,
      },
      receipt: {
        artifactId: receipt.artifactId,
        contractVersion: receipt.schemaVersion,
        sha256: receiptArtifact.sha256,
        sizeBytes: receiptArtifact.sizeBytes,
        status: "completed",
        freshness: "new",
      },
      materialDynamicsReplay: {
        artifactId: "nhm2_primary_raw_material_dynamics_content_replay",
        contractVersion: replay.contractVersion,
        sha256: sha256Nhm2PredictionRun1Bytes(replayBytes),
        sizeBytes: replayBytes.byteLength,
        fileClosureSha256: expectedClosure.closureSha256,
      },
      bindingSet: {
        artifactId: NHM2_PREDICTION_RUN1_BINDING_SET_ARTIFACT_ID,
        contractVersion: NHM2_PREDICTION_RUN1_BINDING_SET_CONTRACT_VERSION,
        sha256: bindingArtifact.sha256,
        sizeBytes: bindingArtifact.sizeBytes,
        frozenAt: bindingSet.frozenAt,
      },
      sourceFileSet: {
        ordering: NHM2_PREDICTION_RUN1_SOURCE_FILE_ORDERING,
        sha256: sourceFileSetSha256,
        entries: reopened.fileRefs,
      },
    },
    targetRunReservation: {
      ...input.targetRunReservation,
      receipt: null,
    },
    predictionSet: {
      ordering: NHM2_PREDICTION_RUN1_OBSERVABLE_ORDERING,
      sha256: predictionSetSha256,
      entries: compiled.predictions,
    },
    claimBoundary: { ...NHM2_PREDICTION_RUN1_CLAIM_BOUNDARY },
  };
  if (!isNhm2PredictionRun1BootstrapArtifactV2(artifact)) {
    return {
      status: "not_ready",
      blockers: ["compiled_bootstrap_artifact_self_validation_failed"],
      artifact: null,
    };
  }
  const artifactBytes = Buffer.from(
    canonicalizeNhm2PredictionRun1Json(artifact),
    "utf8",
  );
  if (artifactBytes.byteLength > limits.maxPublishedBytes) {
    return {
      status: "not_ready",
      blockers: ["compiled_bootstrap_artifact_resource_limit_exceeded"],
      artifact: null,
    };
  }
  return {
    status: NHM2_PREDICTION_RUN1_BOOTSTRAP_STATUS,
    blockers: [],
    artifact,
  };
}

const publicationFailure = (code: string, message: string): never => {
  throw new Nhm2PredictionRun1BootstrapPublicationError(code, message);
};

export async function publishNhm2PredictionRun1BootstrapV2(input: {
  artifact: Nhm2PredictionRun1BootstrapArtifactV2;
  publicationRoot: string;
  relativePath: string;
  maxPublishedBytes?: number;
}): Promise<Nhm2PredictionRun1BootstrapPublication> {
  if (!isNhm2PredictionRun1BootstrapArtifactV2(input.artifact)) {
    publicationFailure(
      "artifact_invalid",
      "Bootstrap artifact failed v2 validation.",
    );
  }
  const maxPublishedBytes =
    input.maxPublishedBytes ??
    NHM2_PREDICTION_RUN1_BOOTSTRAP_RESOURCE_LIMITS.maxPublishedBytes;
  if (
    !Number.isSafeInteger(maxPublishedBytes) ||
    maxPublishedBytes < 1 ||
    maxPublishedBytes >
      NHM2_PREDICTION_RUN1_BOOTSTRAP_RESOURCE_LIMITS.maxPublishedBytes
  ) {
    publicationFailure(
      "resource_limit_invalid",
      "Publication byte ceiling is invalid.",
    );
  }
  if (
    !path.isAbsolute(input.publicationRoot) ||
    !pinnedPath(
      input.relativePath,
      NHM2_PREDICTION_RUN1_BOOTSTRAP_RESOURCE_LIMITS.maxPathDepth,
    )
  ) {
    publicationFailure(
      "publication_path_escape",
      "Publication path is not pinned.",
    );
  }
  const bytes = Buffer.from(
    canonicalizeNhm2PredictionRun1Json(input.artifact),
    "utf8",
  );
  if (bytes.byteLength > maxPublishedBytes) {
    publicationFailure(
      "publication_resource_limit_exceeded",
      "Canonical artifact exceeds the publication byte ceiling.",
    );
  }
  const root = await (async () => {
    try {
      return {
        stat: await fs.lstat(input.publicationRoot),
        real: await fs.realpath(input.publicationRoot),
      };
    } catch {
      return publicationFailure(
        "publication_root_unreadable",
        "Publication root is unreadable.",
      );
    }
  })();
  const rootStat = root.stat;
  const rootReal = root.real;
  if (
    rootStat.isSymbolicLink() ||
    !rootStat.isDirectory() ||
    !samePath(rootReal, input.publicationRoot)
  ) {
    publicationFailure(
      "publication_root_symlink_or_alias",
      "Publication root must be a real directory.",
    );
  }
  const parts = input.relativePath.split("/");
  const fileName = parts.pop()!;
  let cursor = rootReal;
  const parentSnapshots: Array<{
    absolutePath: string;
    identity: ReturnType<typeof fileIdentity>;
  }> = [{ absolutePath: rootReal, identity: fileIdentity(rootStat) }];
  for (const part of parts) {
    cursor = path.join(cursor, part);
    const parent = await (async () => {
      try {
        return {
          stat: await fs.lstat(cursor),
          real: await fs.realpath(cursor),
        };
      } catch {
        return publicationFailure(
          "publication_parent_missing",
          "Every publication parent directory must be pre-created.",
        );
      }
    })();
    const stat = parent.stat;
    const real = parent.real;
    if (
      stat.isSymbolicLink() ||
      !stat.isDirectory() ||
      !samePath(real, cursor) ||
      !isInside(rootReal, real)
    ) {
      publicationFailure(
        "publication_parent_symlink_or_alias",
        "Publication parent must be a real in-root directory.",
      );
    }
    parentSnapshots.push({
      absolutePath: cursor,
      identity: fileIdentity(stat),
    });
  }
  const absolutePath = path.join(cursor, fileName);
  if (!isInside(rootReal, absolutePath)) {
    publicationFailure(
      "publication_path_escape",
      "Publication target escapes its root.",
    );
  }
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const noFollow =
      process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
    handle = await fs.open(
      absolutePath,
      fsConstants.O_WRONLY |
        fsConstants.O_CREAT |
        fsConstants.O_EXCL |
        noFollow,
      0o600,
    );
    await handle.writeFile(bytes);
    await handle.sync();
  } catch (error) {
    if (
      isRecord(error) &&
      (error.code === "EEXIST" || error.code === "ELOOP")
    ) {
      publicationFailure(
        "publication_overwrite_forbidden",
        "Bootstrap publication is immutable and cannot overwrite a path.",
      );
    }
    publicationFailure(
      "publication_write_failed",
      error instanceof Error ? error.message : "Publication write failed.",
    );
  } finally {
    await handle?.close().catch(() => undefined);
  }
  for (const snapshot of parentSnapshots) {
    const after = await fs.lstat(snapshot.absolutePath).catch(() => null);
    if (
      after == null ||
      after.isSymbolicLink() ||
      !after.isDirectory() ||
      !directoryIdentitiesEqual(snapshot.identity, fileIdentity(after))
    ) {
      publicationFailure(
        "publication_parent_changed",
        "Publication parent changed during the no-overwrite write.",
      );
    }
  }
  const finalStat = await fs.lstat(absolutePath).catch(() => null);
  const finalReal = await fs.realpath(absolutePath).catch(() => null);
  if (
    finalStat == null ||
    finalStat.isSymbolicLink() ||
    !finalStat.isFile() ||
    finalStat.nlink !== 1 ||
    finalReal == null ||
    !samePath(finalReal, absolutePath) ||
    !isInside(rootReal, finalReal)
  ) {
    publicationFailure(
      "publication_postwrite_identity_invalid",
      "Published artifact did not remain a unique regular file.",
    );
  }
  const reopened = await fs.readFile(absolutePath);
  if (!reopened.equals(bytes)) {
    publicationFailure(
      "publication_postwrite_mismatch",
      "Published artifact bytes changed after the write.",
    );
  }
  return {
    published: true,
    absolutePath,
    relativePath: portable(path.relative(rootReal, absolutePath)),
    sha256: sha256(bytes),
    sizeBytes: bytes.byteLength,
  };
}
