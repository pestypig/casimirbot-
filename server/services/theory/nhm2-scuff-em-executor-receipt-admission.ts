import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual, TextDecoder } from "node:util";

import type {
  Nhm2ExternalNumericalKernelExecutableBindingV1,
  Nhm2ExternalNumericalKernelLedgerEntryV1,
  Nhm2ExternalNumericalKernelObservationV1,
} from "./nhm2-external-numerical-kernel-executor";
import {
  NHM2_SCUFF_EM_GIT_TRACKED_ENTRY_COUNT,
  NHM2_SCUFF_EM_GIT_TREE_OBJECT_ID,
  type Nhm2ScuffEmForceSweepExternalPlanV1,
  validateNhm2ScuffEmForceSweepExternalPlan,
} from "./nhm2-scuff-em-force-sweep-external-plan";

export const NHM2_SCUFF_EM_EXECUTOR_RECEIPT_VERSION =
  "nhm2_scuff_em_executor_receipt/v1" as const;
export const NHM2_SCUFF_EM_SOURCE_TO_BINARY_PROVENANCE_VERSION =
  "nhm2_scuff_em_source_to_binary_provenance/v1" as const;

export const NHM2_SCUFF_EM_EXECUTOR_RECEIPT_LIMITS = {
  maxReceiptBytes: 32 * 1024 * 1024,
  maxReceiptPathDepth: 8,
  maxReceiptPathUtf8Bytes: 512,
} as const;

export type Nhm2ScuffEmSourceToBinaryProvenanceV1 = {
  artifactId: "nhm2.scuff_em_source_to_binary_provenance";
  contractVersion: typeof NHM2_SCUFF_EM_SOURCE_TO_BINARY_PROVENANCE_VERSION;
  officialBinaryArtifactPublishedAtPin: false;
  fullSourceLedger: {
    authority: "complete_declared_scuff_build_source_tree";
    rootPrefix: "source/";
    gitTreeObjectId: typeof NHM2_SCUFF_EM_GIT_TREE_OBJECT_ID;
    gitTrackedEntryCount: typeof NHM2_SCUFF_EM_GIT_TRACKED_ENTRY_COUNT;
    gitTreeVerificationReceiptBinding: Nhm2ExternalNumericalKernelLedgerEntryV1;
    ledgerSha256: string;
    entryCount: number;
    aggregateBytes: number;
    entries: Nhm2ExternalNumericalKernelLedgerEntryV1[];
  };
  reproducibleBuildReceipt: {
    authority: "server_persisted_rebuild_twice_byte_identical";
    receiptBinding: Nhm2ExternalNumericalKernelLedgerEntryV1;
    compilerExecutableBinding: Nhm2ExternalNumericalKernelLedgerEntryV1;
    linkerExecutableBinding: Nhm2ExternalNumericalKernelLedgerEntryV1;
    buildDriverExecutableBinding: Nhm2ExternalNumericalKernelLedgerEntryV1;
    compilerInvocationSha256: string;
    linkerInvocationSha256: string;
    environmentSha256: string;
    firstBuildExecutableSha256: string;
    secondBuildExecutableSha256: string;
    runExecutable: Nhm2ExternalNumericalKernelExecutableBindingV1;
    byteIdenticalRebuilds: true;
  };
  sourceToBinaryProvenanceEstablished: true;
};

export type Nhm2ScuffEmPersistedExecutorReceiptV1 = {
  artifactId: "nhm2.scuff_em_executor_receipt";
  contractVersion: typeof NHM2_SCUFF_EM_EXECUTOR_RECEIPT_VERSION;
  receiptId: string;
  persistedAt: string;
  planSha256: string;
  observationSha256: string;
  plan: Nhm2ScuffEmForceSweepExternalPlanV1;
  observation: Nhm2ExternalNumericalKernelObservationV1;
  sourceToBinaryProvenance: Nhm2ScuffEmSourceToBinaryProvenanceV1;
  claimBoundary: {
    serverOwnedImmutableReceiptRequired: true;
    callerSuppliedPlanAccepted: false;
    callerSuppliedObservationAccepted: false;
    empiricalValidationEstablished: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type Nhm2ScuffEmServerReceiptResolutionV1 = {
  receiptStoreRoot: string;
  receiptRelativePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2ScuffEmServerReceiptResolverV1 = (input: {
  receiptId: string;
}) =>
  | Nhm2ScuffEmServerReceiptResolutionV1
  | null
  | Promise<Nhm2ScuffEmServerReceiptResolutionV1 | null>;

export type Nhm2ScuffEmExecutorReceiptNotReadyV1 = {
  artifactId: "nhm2.scuff_em_executor_receipt_admission";
  contractVersion: "nhm2_scuff_em_executor_receipt_admission/v1";
  status: "not_ready";
  receiptId: string;
  blocker:
    | "server_owned_executor_receipt_not_configured"
    | "server_owned_executor_receipt_not_found"
    | "server_owned_executor_receipt_invalid";
  detail: string;
  claimBoundary: {
    externalBinaryExecutionObserved: false;
    sourceToBinaryProvenanceEstablished: false;
    empiricalValidationEstablished: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

type ReceiptFileIdentity = {
  dev: string;
  ino: string;
  mode: number;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  nlink: number;
};

export type Nhm2ScuffEmExecutorReceiptAdmissionV1 = {
  status: "admitted";
  receipt: Nhm2ScuffEmPersistedExecutorReceiptV1;
  receiptSha256: string;
  receiptSizeBytes: number;
  receiptAbsolutePath: string;
  receiptIdentity: ReceiptFileIdentity;
};

const SHA256 = /^[a-f0-9]{64}$/;
const RECEIPT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

const compareUtf8 = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

const stableJson = (value: unknown): string => {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) throw new Error("non_finite_hash_input");
      return JSON.stringify(Object.is(value, -0) ? 0 : value);
    case "string":
      return JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) {
        return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
      }
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record)
        .sort(compareUtf8)
        .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
        .join(",")}}`;
    }
    default:
      throw new Error("non_json_hash_input");
  }
};

const hashDomain = (domain: string, value: unknown): string =>
  createHash("sha256")
    .update(`${domain}\n`, "utf8")
    .update(stableJson(value), "utf8")
    .digest("hex");

export const computeNhm2ScuffEmExecutorReceiptPlanSha256 = (
  plan: Nhm2ScuffEmForceSweepExternalPlanV1,
): string =>
  hashDomain("nhm2_scuff_em_force_sweep_external_plan_binding/v1", plan);

export const computeNhm2ScuffEmExecutorReceiptObservationSha256 = (
  observation: Nhm2ExternalNumericalKernelObservationV1,
): string =>
  hashDomain(
    "nhm2_external_numerical_kernel_observation_binding/v1",
    observation,
  );

export const computeNhm2ScuffEmFullSourceLedgerSha256 = (
  entries: readonly Nhm2ExternalNumericalKernelLedgerEntryV1[],
): string =>
  sha256(
    JSON.stringify({
      domain: "nhm2_scuff_em_complete_build_source_ledger/v1",
      rootPrefix: "source/",
      entries,
    }),
  );

const exactKeys: (
  value: unknown,
  expected: readonly string[],
  label: string,
) => asserts value is Record<string, unknown> = (value, expected, label) => {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}_not_object`);
  }
  const observed = Object.keys(value as object).sort(compareUtf8);
  const sortedExpected = [...expected].sort(compareUtf8);
  if (!isDeepStrictEqual(observed, sortedExpected)) {
    throw new Error(`${label}_keys_invalid`);
  }
};

const canonicalIsoMillis = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const millis = Date.parse(value);
  return Number.isFinite(millis) && new Date(millis).toISOString() === value;
};

const portableReceiptPath = (value: string): boolean =>
  value.length > 0 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !path.posix.isAbsolute(value) &&
  Buffer.byteLength(value, "utf8") <=
    NHM2_SCUFF_EM_EXECUTOR_RECEIPT_LIMITS.maxReceiptPathUtf8Bytes &&
  value.split("/").length <=
    NHM2_SCUFF_EM_EXECUTOR_RECEIPT_LIMITS.maxReceiptPathDepth &&
  value
    .split("/")
    .every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    );

const samePath = (left: string, right: string): boolean => {
  const normalize = (value: string): string => {
    const resolved = path.resolve(value);
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  };
  return normalize(left) === normalize(right);
};

const inside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

const fileIdentity = (
  stat: Awaited<ReturnType<typeof fs.lstat>>,
): ReceiptFileIdentity => ({
  dev: String(stat.dev),
  ino: String(stat.ino),
  mode: Number(stat.mode),
  size: Number(stat.size),
  mtimeMs: Number(stat.mtimeMs),
  ctimeMs: Number(stat.ctimeMs),
  birthtimeMs: Number(stat.birthtimeMs),
  nlink: Number(stat.nlink),
});

const notReady = (
  receiptId: string,
  blocker: Nhm2ScuffEmExecutorReceiptNotReadyV1["blocker"],
  detail: string,
): Nhm2ScuffEmExecutorReceiptNotReadyV1 => ({
  artifactId: "nhm2.scuff_em_executor_receipt_admission",
  contractVersion: "nhm2_scuff_em_executor_receipt_admission/v1",
  status: "not_ready",
  receiptId,
  blocker,
  detail,
  claimBoundary: {
    externalBinaryExecutionObserved: false,
    sourceToBinaryProvenanceEstablished: false,
    empiricalValidationEstablished: false,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    propulsionClaimAllowed: false,
    routeEtaClaimAllowed: false,
    speedAuthorityClaimAllowed: false,
  },
});

let installedResolver: Nhm2ScuffEmServerReceiptResolverV1 | null = null;

/** Installs process-local server receipt authority; replay callers cannot pass it. */
export function installNhm2ScuffEmServerReceiptResolver(
  resolver: Nhm2ScuffEmServerReceiptResolverV1,
): () => void {
  if (installedResolver != null) {
    throw new Error("scuff_server_receipt_resolver_already_installed");
  }
  installedResolver = resolver;
  return () => {
    if (installedResolver === resolver) installedResolver = null;
  };
}

const ledgerBindingExists = (
  entries: readonly Nhm2ExternalNumericalKernelLedgerEntryV1[],
  binding: Nhm2ExternalNumericalKernelLedgerEntryV1,
): boolean =>
  entries.some(
    (entry) =>
      entry.relativePath === binding.relativePath &&
      entry.sha256 === binding.sha256 &&
      entry.sizeBytes === binding.sizeBytes,
  );

function validateSourceToBinaryProvenance(
  value: Nhm2ScuffEmSourceToBinaryProvenanceV1,
  plan: Nhm2ScuffEmForceSweepExternalPlanV1,
): void {
  exactKeys(
    value,
    [
      "artifactId",
      "contractVersion",
      "fullSourceLedger",
      "officialBinaryArtifactPublishedAtPin",
      "reproducibleBuildReceipt",
      "sourceToBinaryProvenanceEstablished",
    ],
    "source_to_binary_provenance",
  );
  exactKeys(
    value.fullSourceLedger,
    [
      "aggregateBytes",
      "authority",
      "entries",
      "entryCount",
      "gitTrackedEntryCount",
      "gitTreeVerificationReceiptBinding",
      "gitTreeObjectId",
      "ledgerSha256",
      "rootPrefix",
    ],
    "full_source_ledger",
  );
  exactKeys(
    value.reproducibleBuildReceipt,
    [
      "authority",
      "buildDriverExecutableBinding",
      "byteIdenticalRebuilds",
      "compilerExecutableBinding",
      "compilerInvocationSha256",
      "environmentSha256",
      "firstBuildExecutableSha256",
      "linkerExecutableBinding",
      "linkerInvocationSha256",
      "receiptBinding",
      "runExecutable",
      "secondBuildExecutableSha256",
    ],
    "reproducible_build_receipt",
  );
  const toolchainEntries = plan.runSpec.ledgers.toolchain.entries;
  const exactSourceEntries = toolchainEntries.filter((entry) =>
    entry.relativePath.startsWith("source/"),
  );
  const aggregateBytes = exactSourceEntries.reduce(
    (total, entry) => total + entry.sizeBytes,
    0,
  );
  const build = value.reproducibleBuildReceipt;
  const buildBindings = [
    build.receiptBinding,
    build.compilerExecutableBinding,
    build.linkerExecutableBinding,
    build.buildDriverExecutableBinding,
  ];
  if (
    value.artifactId !== "nhm2.scuff_em_source_to_binary_provenance" ||
    value.contractVersion !==
      NHM2_SCUFF_EM_SOURCE_TO_BINARY_PROVENANCE_VERSION ||
    value.officialBinaryArtifactPublishedAtPin !== false ||
    value.sourceToBinaryProvenanceEstablished !== true ||
    value.fullSourceLedger.authority !==
      "complete_declared_scuff_build_source_tree" ||
    value.fullSourceLedger.rootPrefix !== "source/" ||
    value.fullSourceLedger.gitTreeObjectId !==
      NHM2_SCUFF_EM_GIT_TREE_OBJECT_ID ||
    value.fullSourceLedger.gitTrackedEntryCount !==
      NHM2_SCUFF_EM_GIT_TRACKED_ENTRY_COUNT ||
    !ledgerBindingExists(
      toolchainEntries,
      value.fullSourceLedger.gitTreeVerificationReceiptBinding,
    ) ||
    !value.fullSourceLedger.gitTreeVerificationReceiptBinding.relativePath.startsWith(
      "provenance/",
    ) ||
    !isDeepStrictEqual(value.fullSourceLedger.entries, exactSourceEntries) ||
    exactSourceEntries.length !== NHM2_SCUFF_EM_GIT_TRACKED_ENTRY_COUNT ||
    value.fullSourceLedger.entryCount !== exactSourceEntries.length ||
    value.fullSourceLedger.aggregateBytes !== aggregateBytes ||
    value.fullSourceLedger.ledgerSha256 !==
      computeNhm2ScuffEmFullSourceLedgerSha256(exactSourceEntries) ||
    build.authority !== "server_persisted_rebuild_twice_byte_identical" ||
    build.byteIdenticalRebuilds !== true ||
    !isDeepStrictEqual(build.runExecutable, plan.runSpec.executable) ||
    build.firstBuildExecutableSha256 !== plan.runSpec.executable.sha256 ||
    build.secondBuildExecutableSha256 !== plan.runSpec.executable.sha256 ||
    !SHA256.test(build.compilerInvocationSha256) ||
    !SHA256.test(build.linkerInvocationSha256) ||
    !SHA256.test(build.environmentSha256) ||
    new Set(buildBindings.map((entry) => entry.relativePath)).size !==
      buildBindings.length ||
    buildBindings.some(
      (binding) =>
        !SHA256.test(binding.sha256) ||
        !Number.isSafeInteger(binding.sizeBytes) ||
        binding.sizeBytes <= 0 ||
        !ledgerBindingExists(toolchainEntries, binding),
    )
  ) {
    throw new Error("source_to_binary_provenance_invalid");
  }
}

function validateReceipt(
  value: Nhm2ScuffEmPersistedExecutorReceiptV1,
  expectedReceiptId: string,
): void {
  exactKeys(
    value,
    [
      "artifactId",
      "claimBoundary",
      "contractVersion",
      "observation",
      "observationSha256",
      "persistedAt",
      "plan",
      "planSha256",
      "receiptId",
      "sourceToBinaryProvenance",
    ],
    "executor_receipt",
  );
  exactKeys(
    value.claimBoundary,
    [
      "callerSuppliedObservationAccepted",
      "callerSuppliedPlanAccepted",
      "empiricalValidationEstablished",
      "physicalViabilityClaimAllowed",
      "propulsionClaimAllowed",
      "routeEtaClaimAllowed",
      "serverOwnedImmutableReceiptRequired",
      "speedAuthorityClaimAllowed",
      "transportClaimAllowed",
    ],
    "executor_receipt_claim_boundary",
  );
  validateNhm2ScuffEmForceSweepExternalPlan(value.plan);
  validateSourceToBinaryProvenance(value.sourceToBinaryProvenance, value.plan);
  const expectedClaims: Nhm2ScuffEmPersistedExecutorReceiptV1["claimBoundary"] =
    {
      serverOwnedImmutableReceiptRequired: true,
      callerSuppliedPlanAccepted: false,
      callerSuppliedObservationAccepted: false,
      empiricalValidationEstablished: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    };
  if (
    value.artifactId !== "nhm2.scuff_em_executor_receipt" ||
    value.contractVersion !== NHM2_SCUFF_EM_EXECUTOR_RECEIPT_VERSION ||
    value.receiptId !== expectedReceiptId ||
    !canonicalIsoMillis(value.persistedAt) ||
    !SHA256.test(value.planSha256) ||
    !SHA256.test(value.observationSha256) ||
    value.planSha256 !==
      computeNhm2ScuffEmExecutorReceiptPlanSha256(value.plan) ||
    value.observationSha256 !==
      computeNhm2ScuffEmExecutorReceiptObservationSha256(value.observation) ||
    !canonicalIsoMillis(value.observation.generatedAt) ||
    Date.parse(value.persistedAt) < Date.parse(value.observation.generatedAt) ||
    !isDeepStrictEqual(value.claimBoundary, expectedClaims)
  ) {
    throw new Error("executor_receipt_contract_invalid");
  }
}

async function assertPathChainSafe(absolutePath: string): Promise<void> {
  const parsed = path.parse(absolutePath);
  const segments = path
    .relative(parsed.root, absolutePath)
    .split(path.sep)
    .filter(Boolean);
  let cursor = parsed.root;
  for (const segment of segments) {
    cursor = path.join(cursor, segment);
    const stat = await fs.lstat(cursor);
    if (stat.isSymbolicLink()) throw new Error("receipt_path_symlink");
    const real = await fs.realpath(cursor);
    if (!samePath(real, cursor)) throw new Error("receipt_path_alias");
  }
}

async function readResolvedReceipt(input: {
  receiptId: string;
  resolution: Nhm2ScuffEmServerReceiptResolutionV1;
}): Promise<Nhm2ScuffEmExecutorReceiptAdmissionV1> {
  const { resolution } = input;
  if (
    !path.isAbsolute(resolution.receiptStoreRoot) ||
    !portableReceiptPath(resolution.receiptRelativePath) ||
    !SHA256.test(resolution.sha256) ||
    !Number.isSafeInteger(resolution.sizeBytes) ||
    resolution.sizeBytes <= 0 ||
    resolution.sizeBytes > NHM2_SCUFF_EM_EXECUTOR_RECEIPT_LIMITS.maxReceiptBytes
  ) {
    throw new Error("receipt_resolution_invalid");
  }
  const root = path.resolve(resolution.receiptStoreRoot);
  const absolutePath = path.resolve(
    root,
    ...resolution.receiptRelativePath.split("/"),
  );
  if (!inside(root, absolutePath)) throw new Error("receipt_path_escape");
  await assertPathChainSafe(absolutePath);
  const rootStat = await fs.lstat(root);
  const before = await fs.lstat(absolutePath);
  if (
    !rootStat.isDirectory() ||
    before.isSymbolicLink() ||
    !before.isFile() ||
    before.nlink !== 1 ||
    before.size !== resolution.sizeBytes
  ) {
    throw new Error("receipt_file_identity_invalid");
  }
  const realRoot = await fs.realpath(root);
  const realPath = await fs.realpath(absolutePath);
  if (!inside(realRoot, realPath) || !samePath(realPath, absolutePath)) {
    throw new Error("receipt_realpath_invalid");
  }
  const noFollow =
    process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
  const handle = await fs.open(absolutePath, fsConstants.O_RDONLY | noFollow);
  let bytes: Buffer;
  try {
    const opened = await handle.stat();
    if (!isDeepStrictEqual(fileIdentity(before), fileIdentity(opened))) {
      throw new Error("receipt_changed_while_opening");
    }
    bytes = Buffer.allocUnsafe(before.size);
    let offset = 0;
    while (offset < bytes.byteLength) {
      const { bytesRead } = await handle.read(
        bytes,
        offset,
        bytes.byteLength - offset,
        offset,
      );
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    const overflow = await handle.read(Buffer.allocUnsafe(1), 0, 1, offset);
    if (offset !== bytes.byteLength || overflow.bytesRead !== 0) {
      throw new Error("receipt_bounded_read_invalid");
    }
  } finally {
    await handle.close();
  }
  const after = await fs.lstat(absolutePath);
  if (
    !isDeepStrictEqual(fileIdentity(before), fileIdentity(after)) ||
    sha256(bytes) !== resolution.sha256
  ) {
    throw new Error("receipt_bytes_or_identity_invalid");
  }
  if (
    bytes.byteLength >= UTF8_BOM.byteLength &&
    bytes.subarray(0, UTF8_BOM.byteLength).equals(UTF8_BOM)
  ) {
    throw new Error("receipt_utf8_bom_forbidden");
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (!Buffer.from(text, "utf8").equals(bytes) || text.includes("\0")) {
    throw new Error("receipt_utf8_invalid");
  }
  const parsed = JSON.parse(text) as Nhm2ScuffEmPersistedExecutorReceiptV1;
  validateReceipt(parsed, input.receiptId);
  return {
    status: "admitted",
    receipt: parsed,
    receiptSha256: resolution.sha256,
    receiptSizeBytes: resolution.sizeBytes,
    receiptAbsolutePath: absolutePath,
    receiptIdentity: fileIdentity(after),
  };
}

export async function admitNhm2ScuffEmServerExecutorReceipt(input: {
  receiptId: string;
}): Promise<
  Nhm2ScuffEmExecutorReceiptAdmissionV1 | Nhm2ScuffEmExecutorReceiptNotReadyV1
> {
  if (
    typeof input.receiptId !== "string" ||
    !RECEIPT_ID.test(input.receiptId)
  ) {
    return notReady(
      typeof input.receiptId === "string" ? input.receiptId : "invalid",
      "server_owned_executor_receipt_invalid",
      "Receipt identity is invalid.",
    );
  }
  if (installedResolver == null) {
    return notReady(
      input.receiptId,
      "server_owned_executor_receipt_not_configured",
      "SCUFF replay has no server-owned immutable executor receipt resolver.",
    );
  }
  try {
    const resolution = await installedResolver({ receiptId: input.receiptId });
    if (resolution == null) {
      return notReady(
        input.receiptId,
        "server_owned_executor_receipt_not_found",
        "The server-owned receipt resolver did not return this execution.",
      );
    }
    return await readResolvedReceipt({
      receiptId: input.receiptId,
      resolution,
    });
  } catch (error) {
    return notReady(
      input.receiptId,
      "server_owned_executor_receipt_invalid",
      error instanceof Error ? error.message : "Receipt admission failed.",
    );
  }
}

export async function reverifyNhm2ScuffEmServerExecutorReceipt(
  admission: Nhm2ScuffEmExecutorReceiptAdmissionV1,
): Promise<void> {
  const stat = await fs.lstat(admission.receiptAbsolutePath);
  if (
    stat.isSymbolicLink() ||
    !stat.isFile() ||
    stat.nlink !== 1 ||
    !isDeepStrictEqual(fileIdentity(stat), admission.receiptIdentity)
  ) {
    throw new Error("server_owned_executor_receipt_changed_during_replay");
  }
  const bytes = await fs.readFile(admission.receiptAbsolutePath);
  if (
    bytes.byteLength !== admission.receiptSizeBytes ||
    sha256(bytes) !== admission.receiptSha256
  ) {
    throw new Error("server_owned_executor_receipt_changed_during_replay");
  }
}
