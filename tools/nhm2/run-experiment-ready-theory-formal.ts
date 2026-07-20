import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import {
  isNhm2ExperimentReadyTheoryCandidateManifest,
  nhm2ExperimentReadyTheoryFormalInvocation,
  type Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1,
  type Nhm2ExperimentReadyTheoryCandidateManifestV1,
} from "../../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_FORMAL_KERNEL_AXIOM_TRANSCRIPT_MARKER,
  NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME,
  NHM2_FORMAL_KERNEL_THEOREM_TRANSCRIPT_MARKER,
  computeNhm2FormalKernelLedgerSha256,
  executeNhm2FormalKernelReplay,
  type Nhm2FormalKernelExecutionObservationV1,
  type Nhm2FormalKernelLedgerEntryV1,
  type Nhm2FormalKernelPresealedRunSpecV1,
  type Nhm2FormalKernelSealedLedgerV1,
} from "../../server/services/theory/nhm2-formal-kernel-executor";

export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_ARTIFACT_ID =
  "nhm2.experiment_ready_theory_formal_run_spec" as const;
export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_CONTRACT_VERSION =
  "nhm2_experiment_ready_theory_formal_run_spec/v1" as const;
export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_EXECUTION_ARTIFACT_ID =
  "nhm2.experiment_ready_theory_formal_execution" as const;
export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_EXECUTION_CONTRACT_VERSION =
  "nhm2_experiment_ready_theory_formal_execution/v1" as const;
export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_OUTER_FILENAME =
  "formal-kernel-execution-observation.json" as const;

export type Nhm2ExperimentReadyTheoryFormalClaimBoundaryV1 = {
  formalLogicReplayOnly: true;
  outerObservedExecutionOnly: true;
  numericalPhysicsValidated: false;
  empiricalValidationEstablished: false;
  experimentReadyTheoryClosureClaimAllowed: false;
  physicalViabilityClaimAllowed: false;
  transportClaimAllowed: false;
  propulsionClaimAllowed: false;
  routeEtaClaimAllowed: false;
  speedAuthorityClaimAllowed: false;
};

export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_REQUIRED_SOURCE_ROLES = [
  "lakefile",
  "lean_toolchain",
  "root_module",
  "claim_boundary",
  "experiment_ready_claim_locks",
  "replay_driver",
] as const;

export type Nhm2ExperimentReadyTheoryFormalRequiredSourceRoleV1 =
  (typeof NHM2_EXPERIMENT_READY_THEORY_FORMAL_REQUIRED_SOURCE_ROLES)[number];

export type Nhm2ExperimentReadyTheoryFormalSourceRoleV1 =
  Nhm2ExperimentReadyTheoryFormalRequiredSourceRoleV1 | "supporting_source";

export type Nhm2ExperimentReadyTheoryFormalSourceBindingV1 = {
  sourceRole: Nhm2ExperimentReadyTheoryFormalSourceRoleV1;
  path: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2ExperimentReadyTheoryFormalSourceBindingsV1 = {
  authority: "server_owned_formal_project";
  projectRoot: string;
  entries: Nhm2ExperimentReadyTheoryFormalSourceBindingV1[];
};

export type Nhm2ExperimentReadyTheoryFormalToolchainRoleV1 =
  "lean_executable" | "lake_executable" | "runtime_dependency";

export type Nhm2ExperimentReadyTheoryFormalToolchainBindingV1 = {
  toolchainRole: Nhm2ExperimentReadyTheoryFormalToolchainRoleV1;
  path: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2ExperimentReadyTheoryFormalToolchainBindingsV1 = {
  authority: "sealed_lean_toolchain";
  toolchainRoot: string;
  entries: Nhm2ExperimentReadyTheoryFormalToolchainBindingV1[];
};

export type Nhm2ExperimentReadyTheoryFormalRunSpecV1 = {
  artifactId: typeof NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_ARTIFACT_ID;
  contractVersion: typeof NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_CONTRACT_VERSION;
  generatedAt: string;
  sealedAt: string;
  identity: {
    candidateId: string;
    candidateManifestId: string;
    candidateManifestSha256: string;
    candidateFrozenAt: string;
    requestId: string;
    runId: string;
    receiptId: string;
    runtimeId: string;
    sourceCommitSha: string;
  };
  planBinding: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1;
  theoremName: typeof NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME;
  formalSourceBindings: Nhm2ExperimentReadyTheoryFormalSourceBindingsV1;
  toolchainBindings: Nhm2ExperimentReadyTheoryFormalToolchainBindingsV1;
  executor: Nhm2FormalKernelPresealedRunSpecV1;
  outerArtifactPath: string;
  claimBoundary: Nhm2ExperimentReadyTheoryFormalClaimBoundaryV1;
};

export type Nhm2ExperimentReadyTheoryFormalInventoryEntryV1 = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2ExperimentReadyTheoryFormalExecutionArtifactV1 = {
  artifactId: typeof NHM2_EXPERIMENT_READY_THEORY_FORMAL_EXECUTION_ARTIFACT_ID;
  contractVersion: typeof NHM2_EXPERIMENT_READY_THEORY_FORMAL_EXECUTION_CONTRACT_VERSION;
  generatedAt: string;
  identity: Nhm2ExperimentReadyTheoryFormalRunSpecV1["identity"];
  inputs: {
    candidateManifest: {
      path: string;
      sha256: string;
      sizeBytes: number;
    };
    formalRunSpec: {
      path: string;
      sha256: string;
      sizeBytes: number;
    };
  };
  planRole: "formal_kernel";
  theoremName: typeof NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME;
  replayOutputInventory: {
    algorithm: "sha256_canonical_tuple_list/v1";
    entries: Nhm2ExperimentReadyTheoryFormalInventoryEntryV1[];
    inventorySha256: string;
  };
  executionObservation: Nhm2FormalKernelExecutionObservationV1;
  claimBoundary: Nhm2ExperimentReadyTheoryFormalClaimBoundaryV1;
};

export type RunNhm2ExperimentReadyTheoryFormalInput = {
  candidateManifestPath: string;
  formalRunSpecPath: string;
  workspaceRoot?: string;
};

export type RunNhm2ExperimentReadyTheoryFormalResult = {
  executionArtifactPath: string;
  executionArtifactSha256: string;
  executionArtifactSizeBytes: number;
  candidateManifestSha256: string;
  formalRunSpecSha256: string;
  finalOutputInventory: Nhm2ExperimentReadyTheoryFormalInventoryEntryV1[];
  finalOutputInventorySha256: string;
  observation: Nhm2FormalKernelExecutionObservationV1;
  claimBoundary: Nhm2ExperimentReadyTheoryFormalClaimBoundaryV1;
};

export class Nhm2ExperimentReadyTheoryFormalWrapperError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "Nhm2ExperimentReadyTheoryFormalWrapperError";
    this.code = code;
  }
}

type SecureJsonObservation = {
  absolutePath: string;
  relativePath: string;
  bytes: Buffer;
  sha256: string;
  sizeBytes: number;
  identity: FileIdentity;
  value: unknown;
  canonicalEncoding: "compact_json_v1" | "pretty_json_2space_newline_v1";
};

type SecureTextObservation = {
  bytes: Buffer;
  text: string;
  sha256: string;
  sizeBytes: number;
};

type FileIdentity = {
  dev: string;
  ino: string;
  mode: number;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  nlink: number;
};

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS = {
  maxCandidateManifestBytes: 64 * 1024 * 1024,
  maxFormalRunSpecBytes: 256 * 1024 * 1024,
  maxReplayDriverBytes: 4 * 1024 * 1024,
  maxFinalFileBytes: 512 * 1024 * 1024,
  maxFinalAggregateBytes: 1024 * 1024 * 1024,
  maxFinalFileCount: 64,
  maxFinalDirectoryCount: 64,
  maxFinalPathDepth: 64,
  maxOuterArtifactBytes: 512 * 1024 * 1024,
} as const;

const CLAIM_BOUNDARY: Nhm2ExperimentReadyTheoryFormalClaimBoundaryV1 = {
  formalLogicReplayOnly: true,
  outerObservedExecutionOnly: true,
  numericalPhysicsValidated: false,
  empiricalValidationEstablished: false,
  experimentReadyTheoryClosureClaimAllowed: false,
  physicalViabilityClaimAllowed: false,
  transportClaimAllowed: false,
  propulsionClaimAllowed: false,
  routeEtaClaimAllowed: false,
  speedAuthorityClaimAllowed: false,
};

const fail = (code: string, message: string): never => {
  throw new Nhm2ExperimentReadyTheoryFormalWrapperError(code, message);
};

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

const utf8Compare = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value);
  return (
    actual.length === keys.length && actual.every((key) => keys.includes(key))
  );
};

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.trim() === value;

const isPortableRelativePath = (value: unknown): value is string => {
  if (
    !isText(value) ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value)
  ) {
    return false;
  }
  const segments = value.split("/");
  return (
    segments.length > 0 &&
    segments.every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    ) &&
    path.posix.normalize(value) === value
  );
};

const isIso = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const milliseconds = Date.parse(value);
  return (
    Number.isFinite(milliseconds) &&
    new Date(milliseconds).toISOString() === value
  );
};

const isClaimBoundary = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryFormalClaimBoundaryV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, [
    "formalLogicReplayOnly",
    "outerObservedExecutionOnly",
    "numericalPhysicsValidated",
    "empiricalValidationEstablished",
    "experimentReadyTheoryClosureClaimAllowed",
    "physicalViabilityClaimAllowed",
    "transportClaimAllowed",
    "propulsionClaimAllowed",
    "routeEtaClaimAllowed",
    "speedAuthorityClaimAllowed",
  ]) &&
  value.formalLogicReplayOnly === true &&
  value.outerObservedExecutionOnly === true &&
  value.numericalPhysicsValidated === false &&
  value.empiricalValidationEstablished === false &&
  value.experimentReadyTheoryClosureClaimAllowed === false &&
  value.physicalViabilityClaimAllowed === false &&
  value.transportClaimAllowed === false &&
  value.propulsionClaimAllowed === false &&
  value.routeEtaClaimAllowed === false &&
  value.speedAuthorityClaimAllowed === false;

const normalizedPath = (value: string): string => {
  const normalized = path.resolve(value);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
};

const samePath = (left: string, right: string): boolean =>
  normalizedPath(left) === normalizedPath(right);

const pathKey = (value: string): string => normalizedPath(value);

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

const portablePath = (workspaceRoot: string, absolutePath: string): string =>
  path.relative(workspaceRoot, absolutePath).split(path.sep).join("/");

const resolveWorkspacePath = (
  workspaceRoot: string,
  candidatePath: string,
  label: string,
): string => {
  if (!isText(candidatePath) || candidatePath.includes("\0")) {
    fail("path_invalid", `${label} path is invalid.`);
  }
  const absolutePath = path.isAbsolute(candidatePath)
    ? path.resolve(candidatePath)
    : path.resolve(workspaceRoot, candidatePath);
  if (!isInside(workspaceRoot, absolutePath)) {
    fail("path_escape", `${label} escapes the trusted workspace.`);
  }
  return absolutePath;
};

const identity = (
  stat: Awaited<ReturnType<typeof fs.lstat>>,
): FileIdentity => ({
  dev: String(stat.dev),
  ino: String(stat.ino),
  mode: Number(stat.mode),
  size: Number(stat.size),
  mtimeMs: Number(stat.mtimeMs),
  ctimeMs: Number(stat.ctimeMs),
  nlink: Number(stat.nlink),
});

const identitiesMatch = (
  left: Awaited<ReturnType<typeof fs.lstat>>,
  right: Awaited<ReturnType<typeof fs.lstat>>,
): boolean => isDeepStrictEqual(identity(left), identity(right));

async function assertSafePathChain(
  workspaceRoot: string,
  workspaceRealPath: string,
  absolutePath: string,
  finalKind: "file" | "directory",
): Promise<void> {
  const relative = path.relative(workspaceRoot, absolutePath);
  const segments = relative.split(path.sep);
  let cursor = workspaceRoot;
  for (let index = 0; index < segments.length; index += 1) {
    cursor = path.join(cursor, segments[index]);
    const stat = await fs
      .lstat(cursor)
      .catch((error: NodeJS.ErrnoException) =>
        fail("path_unreadable", `${cursor}: ${error.code ?? "lstat_failed"}`),
      );
    const final = index === segments.length - 1;
    if (stat.isSymbolicLink()) {
      fail(
        "symlink_or_reparse_forbidden",
        `${cursor} is a symbolic link or reparse point.`,
      );
    }
    if ((!final || finalKind === "directory") && !stat.isDirectory()) {
      fail(
        "regular_directory_required",
        `${cursor} is not a regular directory.`,
      );
    }
    if (final && finalKind === "file" && !stat.isFile()) {
      fail("regular_file_required", `${cursor} is not a regular file.`);
    }
    if (final && finalKind === "file" && stat.nlink !== 1) {
      fail("hardlink_forbidden", `${cursor} has nlink=${stat.nlink}.`);
    }
    const realPath = await fs.realpath(cursor);
    const expectedReal = path.resolve(
      workspaceRealPath,
      ...segments.slice(0, index + 1),
    );
    if (!samePath(realPath, expectedReal)) {
      fail(
        "symlink_or_reparse_forbidden",
        `${cursor} resolves through an alias.`,
      );
    }
  }
}

async function readSecureWorkspaceText(input: {
  workspaceRoot: string;
  workspaceRealPath: string;
  absolutePath: string;
  label: string;
  maxBytes: number;
}): Promise<SecureTextObservation> {
  await assertSafePathChain(
    input.workspaceRoot,
    input.workspaceRealPath,
    input.absolutePath,
    "file",
  );
  const before = await fs.lstat(input.absolutePath);
  if (before.size > input.maxBytes) {
    fail(
      "resource_limit_exceeded",
      `${input.label} exceeds its ${input.maxBytes}-byte limit.`,
    );
  }
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const noFollow =
      process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
    handle = await fs.open(input.absolutePath, fsConstants.O_RDONLY | noFollow);
    const opened = await handle.stat();
    if (!identitiesMatch(before, opened) || opened.size > input.maxBytes) {
      fail("input_changed", `${input.label} changed while opening.`);
    }
    const bytes = await handle.readFile();
    if (bytes.byteLength > input.maxBytes) {
      fail(
        "resource_limit_exceeded",
        `${input.label} exceeds its ${input.maxBytes}-byte limit.`,
      );
    }
    const after = await fs.lstat(input.absolutePath);
    if (
      after.isSymbolicLink() ||
      !after.isFile() ||
      after.nlink !== 1 ||
      !identitiesMatch(before, after)
    ) {
      fail("input_changed", `${input.label} changed while reading.`);
    }
    const text = (() => {
      try {
        return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        return fail(
          "formal_driver_invalid",
          "Standalone Lean replay driver is not valid UTF-8.",
        );
      }
    })();
    return {
      bytes,
      text,
      sha256: sha256(bytes),
      sizeBytes: bytes.byteLength,
    };
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

async function readCanonicalWorkspaceJson(input: {
  workspaceRoot: string;
  workspaceRealPath: string;
  inputPath: string;
  label: string;
  maxBytes: number;
  canonicalEncoding: "compact_json_v1" | "pretty_json_2space_newline_v1";
}): Promise<SecureJsonObservation> {
  const absolutePath = resolveWorkspacePath(
    input.workspaceRoot,
    input.inputPath,
    input.label,
  );
  await assertSafePathChain(
    input.workspaceRoot,
    input.workspaceRealPath,
    absolutePath,
    "file",
  );
  const before = await fs.lstat(absolutePath);
  if (before.size > input.maxBytes) {
    fail(
      "resource_limit_exceeded",
      `${input.label} exceeds its ${input.maxBytes}-byte limit.`,
    );
  }
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const noFollow =
      process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
    handle = await fs.open(absolutePath, fsConstants.O_RDONLY | noFollow);
    const opened = await handle.stat();
    if (!identitiesMatch(before, opened) || opened.size > input.maxBytes) {
      fail("input_changed", `${input.label} changed while opening.`);
    }
    const bytes = await handle.readFile();
    if (bytes.byteLength > input.maxBytes) {
      fail(
        "resource_limit_exceeded",
        `${input.label} exceeds its ${input.maxBytes}-byte limit.`,
      );
    }
    const after = await fs.lstat(absolutePath);
    if (
      after.isSymbolicLink() ||
      !after.isFile() ||
      after.nlink !== 1 ||
      !identitiesMatch(before, after)
    ) {
      fail("input_changed", `${input.label} changed while reading.`);
    }
    const text = (() => {
      try {
        return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        return fail(
          "canonical_json_invalid",
          `${input.label} is not valid UTF-8 JSON.`,
        );
      }
    })();
    const value: unknown = (() => {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return fail(
          "canonical_json_invalid",
          `${input.label} is not valid UTF-8 JSON.`,
        );
      }
    })();
    const canonicalText =
      input.canonicalEncoding === "compact_json_v1"
        ? JSON.stringify(value)
        : `${JSON.stringify(value, null, 2)}\n`;
    if (canonicalText !== text) {
      fail("canonical_json_invalid", `${input.label} is not canonical JSON.`);
    }
    return {
      absolutePath,
      relativePath: portablePath(input.workspaceRoot, absolutePath),
      bytes,
      sha256: sha256(bytes),
      sizeBytes: bytes.byteLength,
      identity: identity(before),
      value,
      canonicalEncoding: input.canonicalEncoding,
    };
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

const isLedgerEntry = (
  value: unknown,
): value is Nhm2FormalKernelLedgerEntryV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, ["relativePath", "sha256", "sizeBytes"]) &&
  isText(value.relativePath) &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256) &&
  Number.isSafeInteger(value.sizeBytes) &&
  (value.sizeBytes as number) >= 0;

const isLedger = (
  value: unknown,
  kind: "source" | "toolchain" | "input",
): value is Nhm2FormalKernelSealedLedgerV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, ["kind", "rootPath", "entries", "ledgerSha256"]) &&
  value.kind === kind &&
  isText(value.rootPath) &&
  path.isAbsolute(value.rootPath) &&
  Array.isArray(value.entries) &&
  value.entries.length > 0 &&
  value.entries.every(isLedgerEntry) &&
  typeof value.ledgerSha256 === "string" &&
  SHA256.test(value.ledgerSha256) &&
  computeNhm2FormalKernelLedgerSha256({ kind, entries: value.entries }) ===
    value.ledgerSha256;

const isExecutable = (value: unknown): boolean =>
  isRecord(value) &&
  hasOnlyKeys(value, ["absolutePath", "sha256", "sizeBytes"]) &&
  isText(value.absolutePath) &&
  path.isAbsolute(value.absolutePath) &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256) &&
  Number.isSafeInteger(value.sizeBytes) &&
  (value.sizeBytes as number) > 0;

const FORMAL_SOURCE_ROLE_SUFFIXES: Readonly<
  Partial<Record<Nhm2ExperimentReadyTheoryFormalRequiredSourceRoleV1, string>>
> = {
  lakefile: "lakefile.lean",
  lean_toolchain: "lean-toolchain",
  root_module: "NHM2Formal.lean",
  claim_boundary: "NHM2Formal/ClaimBoundary.lean",
  experiment_ready_claim_locks: "NHM2Formal/ExperimentReadyClaimLocks.lean",
};

const isFormalSourceBinding = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryFormalSourceBindingV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["sourceRole", "path", "sha256", "sizeBytes"]) ||
    ![
      ...NHM2_EXPERIMENT_READY_THEORY_FORMAL_REQUIRED_SOURCE_ROLES,
      "supporting_source",
    ].includes(
      value.sourceRole as Nhm2ExperimentReadyTheoryFormalSourceRoleV1,
    ) ||
    !isPortableRelativePath(value.path) ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256) ||
    !Number.isSafeInteger(value.sizeBytes) ||
    (value.sizeBytes as number) <= 0
  ) {
    return false;
  }
  const role = value.sourceRole as Nhm2ExperimentReadyTheoryFormalSourceRoleV1;
  const sourcePath = value.path;
  if (role === "replay_driver") {
    return /(?:^|\/)[^/]*ReplayDriver\.lean$/.test(sourcePath);
  }
  if (role === "supporting_source") {
    return (
      sourcePath.endsWith(".lean") || sourcePath.endsWith("lake-manifest.json")
    );
  }
  const suffix = FORMAL_SOURCE_ROLE_SUFFIXES[role];
  return (
    suffix != null &&
    (sourcePath === suffix || sourcePath.endsWith(`/${suffix}`))
  );
};

const isFormalSourceBindings = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryFormalSourceBindingsV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["authority", "projectRoot", "entries"]) ||
    value.authority !== "server_owned_formal_project" ||
    !isText(value.projectRoot) ||
    !path.isAbsolute(value.projectRoot) ||
    !Array.isArray(value.entries) ||
    value.entries.length <
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_REQUIRED_SOURCE_ROLES.length ||
    !value.entries.every(isFormalSourceBinding)
  ) {
    return false;
  }
  const entries =
    value.entries as Nhm2ExperimentReadyTheoryFormalSourceBindingV1[];
  const paths = entries.map((entry) => entry.path);
  if (
    new Set(paths).size !== paths.length ||
    JSON.stringify(paths) !== JSON.stringify([...paths].sort(utf8Compare))
  ) {
    return false;
  }
  return NHM2_EXPERIMENT_READY_THEORY_FORMAL_REQUIRED_SOURCE_ROLES.every(
    (role) => entries.filter((entry) => entry.sourceRole === role).length === 1,
  );
};

const isToolchainBinding = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryFormalToolchainBindingV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["toolchainRole", "path", "sha256", "sizeBytes"]) ||
    (value.toolchainRole !== "lean_executable" &&
      value.toolchainRole !== "lake_executable" &&
      value.toolchainRole !== "runtime_dependency") ||
    !isPortableRelativePath(value.path) ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256) ||
    !Number.isSafeInteger(value.sizeBytes)
  ) {
    return false;
  }
  return value.toolchainRole === "runtime_dependency"
    ? (value.sizeBytes as number) >= 0
    : (value.sizeBytes as number) > 0;
};

const isToolchainBindings = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryFormalToolchainBindingsV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["authority", "toolchainRoot", "entries"]) ||
    value.authority !== "sealed_lean_toolchain" ||
    !isText(value.toolchainRoot) ||
    !path.isAbsolute(value.toolchainRoot) ||
    !Array.isArray(value.entries) ||
    value.entries.length < 2 ||
    !value.entries.every(isToolchainBinding)
  ) {
    return false;
  }
  const entries =
    value.entries as Nhm2ExperimentReadyTheoryFormalToolchainBindingV1[];
  const paths = entries.map((entry) => entry.path);
  return (
    new Set(paths).size === paths.length &&
    JSON.stringify(paths) === JSON.stringify([...paths].sort(utf8Compare)) &&
    entries.filter((entry) => entry.toolchainRole === "lean_executable")
      .length === 1 &&
    entries.filter((entry) => entry.toolchainRole === "lake_executable")
      .length === 1
  );
};

const isExecutorSpec = (
  value: unknown,
): value is Nhm2FormalKernelPresealedRunSpecV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, [
    "theoremName",
    "executableRole",
    "executables",
    "ledgers",
    "outputRoot",
    "replayWorkdirs",
    "environmentAllowlist",
    "environment",
    "executableArguments",
    "expectedOutputPaths",
    "timeoutMs",
    "maxCapturedOutputBytes",
  ]) &&
  (value.executableRole === "lean" || value.executableRole === "lake") &&
  value.theoremName === NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME &&
  isRecord(value.executables) &&
  hasOnlyKeys(value.executables, ["lean", "lake"]) &&
  isExecutable(value.executables.lean) &&
  isExecutable(value.executables.lake) &&
  isRecord(value.ledgers) &&
  hasOnlyKeys(value.ledgers, ["source", "toolchain", "input"]) &&
  isLedger(value.ledgers.source, "source") &&
  isLedger(value.ledgers.toolchain, "toolchain") &&
  isLedger(value.ledgers.input, "input") &&
  isText(value.outputRoot) &&
  path.isAbsolute(value.outputRoot) &&
  Array.isArray(value.replayWorkdirs) &&
  value.replayWorkdirs.length === 2 &&
  value.replayWorkdirs.every(
    (entry) => isText(entry) && path.isAbsolute(entry),
  ) &&
  Array.isArray(value.environmentAllowlist) &&
  value.environmentAllowlist.every(isText) &&
  isRecord(value.environment) &&
  Object.entries(value.environment).every(
    ([key, entry]) => isText(key) && isText(entry),
  ) &&
  Array.isArray(value.executableArguments) &&
  value.executableArguments.length > 0 &&
  value.executableArguments.every(isText) &&
  Array.isArray(value.expectedOutputPaths) &&
  value.expectedOutputPaths.length > 0 &&
  value.expectedOutputPaths.every(isText) &&
  Number.isSafeInteger(value.timeoutMs) &&
  (value.timeoutMs as number) > 0 &&
  Number.isSafeInteger(value.maxCapturedOutputBytes) &&
  (value.maxCapturedOutputBytes as number) > 0;

const isRunSpec = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryFormalRunSpecV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "artifactId",
      "contractVersion",
      "generatedAt",
      "sealedAt",
      "identity",
      "planBinding",
      "theoremName",
      "formalSourceBindings",
      "toolchainBindings",
      "executor",
      "outerArtifactPath",
      "claimBoundary",
    ]) ||
    value.artifactId !==
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_CONTRACT_VERSION ||
    !isIso(value.generatedAt) ||
    !isIso(value.sealedAt) ||
    Date.parse(value.generatedAt) > Date.parse(value.sealedAt) ||
    !isRecord(value.identity) ||
    !hasOnlyKeys(value.identity, [
      "candidateId",
      "candidateManifestId",
      "candidateManifestSha256",
      "candidateFrozenAt",
      "requestId",
      "runId",
      "receiptId",
      "runtimeId",
      "sourceCommitSha",
    ]) ||
    !isText(value.identity.candidateId) ||
    !isText(value.identity.candidateManifestId) ||
    typeof value.identity.candidateManifestSha256 !== "string" ||
    !SHA256.test(value.identity.candidateManifestSha256) ||
    !isIso(value.identity.candidateFrozenAt) ||
    !isText(value.identity.requestId) ||
    !isText(value.identity.runId) ||
    !isText(value.identity.receiptId) ||
    !isText(value.identity.runtimeId) ||
    typeof value.identity.sourceCommitSha !== "string" ||
    !GIT_SHA.test(value.identity.sourceCommitSha) ||
    !isRecord(value.planBinding) ||
    value.planBinding.planRole !== "formal_kernel" ||
    value.theoremName !== NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME ||
    !isFormalSourceBindings(value.formalSourceBindings) ||
    !isToolchainBindings(value.toolchainBindings) ||
    !isExecutorSpec(value.executor) ||
    !isText(value.outerArtifactPath) ||
    !isClaimBoundary(value.claimBoundary)
  ) {
    return false;
  }
  const executor = value.executor as Nhm2FormalKernelPresealedRunSpecV1;
  const toolchainBindings = value.toolchainBindings
    .entries as Nhm2ExperimentReadyTheoryFormalToolchainBindingV1[];
  if (
    executor.ledgers.source.entries.some((entry) => entry.sizeBytes <= 0) ||
    executor.ledgers.input.entries.some((entry) => entry.sizeBytes <= 0) ||
    executor.ledgers.toolchain.entries.some(
      (entry) =>
        entry.sizeBytes === 0 &&
        !toolchainBindings.some(
          (binding) =>
            binding.toolchainRole === "runtime_dependency" &&
            binding.sizeBytes === 0 &&
            binding.sha256 === entry.sha256 &&
            (binding.path === entry.relativePath ||
              binding.path.endsWith(`/${entry.relativePath}`)),
        ),
    )
  ) {
    return false;
  }
  return true;
};

const ledgerAbsoluteEntries = (
  ledger: Nhm2FormalKernelSealedLedgerV1,
): Map<string, Nhm2FormalKernelLedgerEntryV1> =>
  new Map(
    ledger.entries.map((entry) => [
      pathKey(path.resolve(ledger.rootPath, ...entry.relativePath.split("/"))),
      entry,
    ]),
  );

const expectedInputBindings = (input: {
  workspaceRoot: string;
  sealedInputRoot: string;
  candidatePath: string;
  candidateSha256: string;
  candidateSizeBytes: number;
  candidate: Nhm2ExperimentReadyTheoryCandidateManifestV1;
  plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1;
}): Map<string, { sha256: string; sizeBytes?: number }> => {
  const entries = new Map<string, { sha256: string; sizeBytes?: number }>();
  const add = (repoPath: string, sha: string, sizeBytes?: number): void => {
    const originalAbsolute = resolveWorkspacePath(
      input.workspaceRoot,
      repoPath,
      "sealed input",
    );
    const relative = portablePath(input.workspaceRoot, originalAbsolute);
    if (!isPortableRelativePath(relative)) {
      fail("sealed_ledger_mismatch", `Invalid sealed input path ${repoPath}.`);
    }
    const absolute = path.resolve(
      input.sealedInputRoot,
      ...relative.split("/"),
    );
    const key = pathKey(absolute);
    const prior = entries.get(key);
    if (prior != null && prior.sha256 !== sha) {
      fail("input_binding_collision", `Conflicting hashes bind ${repoPath}.`);
    }
    entries.set(key, {
      sha256: sha,
      ...(sizeBytes == null ? {} : { sizeBytes }),
    });
  };
  add(input.candidatePath, input.candidateSha256, input.candidateSizeBytes);
  for (const binding of Object.values(input.candidate.bindings)) {
    add(binding.path, binding.sha256);
  }
  add(
    input.candidate.numericCheckPolicySet.artifactPath,
    input.candidate.numericCheckPolicySet.artifactRawSha256,
  );
  add(input.plan.solver.path, input.plan.solver.sha256);
  add(input.plan.environmentLock.path, input.plan.environmentLock.sha256);
  return entries;
};

const assertExactLedgerBindings = (input: {
  actual: Map<string, Nhm2FormalKernelLedgerEntryV1>;
  expected: Map<string, { sha256: string; sizeBytes?: number }>;
  label: string;
}): void => {
  if (input.actual.size !== input.expected.size) {
    fail(
      "sealed_ledger_mismatch",
      `${input.label} ledger entry count differs from its frozen bindings.`,
    );
  }
  for (const [absolutePath, expected] of input.expected) {
    const actual = input.actual.get(absolutePath);
    if (
      actual == null ||
      actual.sha256 !== expected.sha256 ||
      (expected.sizeBytes != null && actual.sizeBytes !== expected.sizeBytes)
    ) {
      fail(
        "sealed_ledger_mismatch",
        `${input.label} ledger does not bind ${absolutePath}.`,
      );
    }
  }
};

const inventorySha256 = (
  entries: readonly Nhm2ExperimentReadyTheoryFormalInventoryEntryV1[],
): string =>
  sha256(
    `nhm2_formal_outer_inventory/v1\0${JSON.stringify(
      entries.map((entry) => [entry.path, entry.sha256, entry.sizeBytes]),
    )}`,
  );

const replayInventory = (
  observation: Nhm2FormalKernelExecutionObservationV1,
  executor: Nhm2FormalKernelPresealedRunSpecV1,
): Nhm2ExperimentReadyTheoryFormalInventoryEntryV1[] =>
  observation.replays
    .flatMap((replay, index) =>
      replay.outputs.map((entry) => ({
        path: `${path.basename(executor.replayWorkdirs[index])}/${entry.relativePath}`,
        sha256: entry.sha256,
        sizeBytes: entry.sizeBytes,
      })),
    )
    .sort((left, right) => utf8Compare(left.path, right.path));

async function recheckInput(
  prior: SecureJsonObservation,
  workspaceRoot: string,
  workspaceRealPath: string,
  label: string,
): Promise<void> {
  const after = await readCanonicalWorkspaceJson({
    workspaceRoot,
    workspaceRealPath,
    inputPath: prior.absolutePath,
    label,
    maxBytes: prior.sizeBytes,
    canonicalEncoding: prior.canonicalEncoding,
  });
  if (
    after.sha256 !== prior.sha256 ||
    after.sizeBytes !== prior.sizeBytes ||
    !isDeepStrictEqual(after.identity, prior.identity)
  ) {
    fail("input_changed", `${label} changed during formal execution.`);
  }
}

async function atomicPublish(
  absolutePath: string,
  bytes: Buffer,
): Promise<void> {
  if (
    bytes.byteLength >
    NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxOuterArtifactBytes
  ) {
    fail(
      "resource_limit_exceeded",
      "Formal outer execution artifact exceeds its byte limit.",
    );
  }
  const temporaryPath = `${absolutePath}.tmp-${process.pid}-${Date.now()}-${createHash(
    "sha256",
  )
    .update(bytes)
    .digest("hex")
    .slice(0, 12)}`;
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    await fs.lstat(absolutePath).then(
      () =>
        fail(
          "outer_artifact_exists",
          "Formal outer execution artifact already exists.",
        ),
      (error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      },
    );
    handle = await fs.open(temporaryPath, "wx", 0o600);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = null;
    await fs.rename(temporaryPath, absolutePath);
  } finally {
    await handle?.close().catch(() => undefined);
    await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
  }
}

async function observeExactFinalInventory(input: {
  outputRoot: string;
  expected: readonly Nhm2ExperimentReadyTheoryFormalInventoryEntryV1[];
}): Promise<Nhm2ExperimentReadyTheoryFormalInventoryEntryV1[]> {
  if (
    input.expected.length >
    NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxFinalFileCount
  ) {
    fail(
      "resource_limit_exceeded",
      "Expected formal output inventory exceeds the file-count limit.",
    );
  }
  const expected = [...input.expected].sort((left, right) =>
    utf8Compare(left.path, right.path),
  );
  const expectedByPath = new Map(expected.map((entry) => [entry.path, entry]));
  const expectedDirectories = new Set<string>();
  for (const entry of expected) {
    if (
      entry.path.split("/").length >
        NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxFinalPathDepth ||
      entry.sizeBytes >
        NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxFinalFileBytes
    ) {
      fail(
        "resource_limit_exceeded",
        `Expected formal output exceeds a path or file limit: ${entry.path}.`,
      );
    }
    const parts = entry.path.split("/");
    for (let index = 1; index < parts.length; index += 1) {
      expectedDirectories.add(parts.slice(0, index).join("/"));
    }
  }
  if (
    expected.reduce((total, entry) => total + entry.sizeBytes, 0) >
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxFinalAggregateBytes ||
    expectedDirectories.size >
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxFinalDirectoryCount
  ) {
    fail(
      "resource_limit_exceeded",
      "Expected formal output inventory exceeds its aggregate budget.",
    );
  }
  const observed: Nhm2ExperimentReadyTheoryFormalInventoryEntryV1[] = [];
  const directories: string[] = [];
  let aggregateBytes = 0;
  const visit = async (
    absoluteDirectory: string,
    relativeDirectory: string,
  ): Promise<void> => {
    const entries = await fs.readdir(absoluteDirectory, {
      withFileTypes: true,
    });
    entries.sort((left, right) => utf8Compare(left.name, right.name));
    for (const entry of entries) {
      const absolute = path.join(absoluteDirectory, entry.name);
      const relative = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      if (
        relative.split("/").length >
        NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxFinalPathDepth
      ) {
        fail(
          "resource_limit_exceeded",
          `Formal output path exceeds the depth limit: ${relative}.`,
        );
      }
      const stat = await fs.lstat(absolute);
      if (stat.isSymbolicLink())
        fail(
          "output_alias_forbidden",
          `${relative} is a symbolic link or reparse point.`,
        );
      const real = await fs.realpath(absolute);
      if (!samePath(real, absolute))
        fail(
          "output_alias_forbidden",
          `${relative} resolves through an alias.`,
        );
      if (stat.isDirectory()) {
        if (
          directories.length >=
          NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxFinalDirectoryCount
        ) {
          fail(
            "resource_limit_exceeded",
            "Formal output exceeds the directory-count limit.",
          );
        }
        directories.push(relative);
        await visit(absolute, relative);
        continue;
      }
      if (!stat.isFile())
        fail("output_inventory_mismatch", `${relative} is not a regular file.`);
      if (stat.nlink !== 1)
        fail(
          "output_hardlink_forbidden",
          `${relative} has nlink=${stat.nlink}.`,
        );
      const expectedEntry = expectedByPath.get(relative);
      if (
        expectedEntry == null ||
        stat.size !== expectedEntry.sizeBytes ||
        stat.size >
          NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxFinalFileBytes ||
        observed.length >=
          NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxFinalFileCount ||
        aggregateBytes + stat.size >
          NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxFinalAggregateBytes
      ) {
        fail(
          "output_inventory_mismatch",
          `Formal output is unexpected or outside its resource budget: ${relative}.`,
        );
      }
      aggregateBytes += stat.size;
      const bytes = await fs.readFile(absolute);
      observed.push({
        path: relative,
        sha256: sha256(bytes),
        sizeBytes: bytes.byteLength,
      });
    }
  };
  await visit(input.outputRoot, "");
  observed.sort((left, right) => utf8Compare(left.path, right.path));
  if (
    JSON.stringify(observed) !== JSON.stringify(expected) ||
    JSON.stringify([...directories].sort(utf8Compare)) !==
      JSON.stringify([...expectedDirectories].sort(utf8Compare))
  ) {
    fail(
      "output_inventory_mismatch",
      "Final formal output inventory is not exact.",
    );
  }
  return observed;
}

export async function runNhm2ExperimentReadyTheoryFormal(
  input: RunNhm2ExperimentReadyTheoryFormalInput,
): Promise<RunNhm2ExperimentReadyTheoryFormalResult> {
  const workspaceRoot = path.resolve(input.workspaceRoot ?? process.cwd());
  const rootStat = await fs
    .lstat(workspaceRoot)
    .catch((error: NodeJS.ErrnoException) =>
      fail("workspace_unreadable", error.code ?? "lstat_failed"),
    );
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    fail("workspace_invalid", "Workspace root must be a regular directory.");
  }
  const workspaceRealPath = await fs.realpath(workspaceRoot);
  if (!samePath(workspaceRoot, workspaceRealPath)) {
    fail(
      "workspace_invalid",
      "Workspace root resolves through a symlink or reparse alias.",
    );
  }

  const candidateObservation = await readCanonicalWorkspaceJson({
    workspaceRoot,
    workspaceRealPath,
    inputPath: input.candidateManifestPath,
    label: "candidate manifest",
    maxBytes:
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxCandidateManifestBytes,
    canonicalEncoding: "pretty_json_2space_newline_v1",
  });
  const specObservation = await readCanonicalWorkspaceJson({
    workspaceRoot,
    workspaceRealPath,
    inputPath: input.formalRunSpecPath,
    label: "formal run spec",
    maxBytes:
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxFormalRunSpecBytes,
    canonicalEncoding: "compact_json_v1",
  });
  const candidateValue = candidateObservation.value;
  if (!isNhm2ExperimentReadyTheoryCandidateManifest(candidateValue)) {
    fail(
      "candidate_manifest_invalid",
      "Candidate manifest is not a complete frozen pre-run manifest.",
    );
  }
  const candidate: Nhm2ExperimentReadyTheoryCandidateManifestV1 =
    candidateValue as Nhm2ExperimentReadyTheoryCandidateManifestV1;
  if (candidate.readiness.status !== "pre_run_manifest_ready") {
    fail(
      "candidate_manifest_invalid",
      "Candidate manifest is not a complete frozen pre-run manifest.",
    );
  }
  const specValue = specObservation.value;
  if (!isRunSpec(specValue)) {
    fail(
      "formal_run_spec_invalid",
      "Formal run spec is structurally invalid or opens a claim lock.",
    );
  }
  const spec: Nhm2ExperimentReadyTheoryFormalRunSpecV1 =
    specValue as Nhm2ExperimentReadyTheoryFormalRunSpecV1;
  const formalPlans = candidate.executionPlans.filter(
    (entry) => entry.planRole === "formal_kernel",
  );
  if (formalPlans.length !== 1) {
    fail(
      "formal_plan_invalid",
      "Candidate must contain exactly one formal_kernel execution plan.",
    );
  }
  const plan = formalPlans[0];
  const frozenFormalInvocation = (() => {
    try {
      return nhm2ExperimentReadyTheoryFormalInvocation({
        candidateManifestPath: candidateObservation.relativePath,
        outputDirectory: plan.expectedInvocation.outputDirectory,
        runId: plan.runId,
      });
    } catch (error) {
      return fail(
        "formal_plan_invalid",
        error instanceof Error
          ? error.message
          : "Formal plan has no deterministic run-spec path.",
      );
    }
  })();
  const frozenFormalRunSpecPath = frozenFormalInvocation.formalRunSpecPath;
  if (
    plan.expectedInvocation.entrypoint !== frozenFormalInvocation.entrypoint ||
    plan.expectedInvocation.command !== frozenFormalInvocation.command ||
    !isDeepStrictEqual(
      plan.expectedInvocation.args,
      frozenFormalInvocation.args,
    ) ||
    plan.expectedInvocation.cwd !== frozenFormalInvocation.cwd
  ) {
    fail(
      "formal_plan_invocation_mismatch",
      "Formal plan invocation is not the exact governed producer command.",
    );
  }
  const frozenFormalRunSpecAbsolutePath = resolveWorkspacePath(
    workspaceRoot,
    frozenFormalRunSpecPath,
    "frozen formal run spec",
  );
  if (
    !samePath(specObservation.absolutePath, frozenFormalRunSpecAbsolutePath)
  ) {
    fail(
      "formal_run_spec_path_mismatch",
      "Formal run spec must occupy the exact path frozen by the candidate plan.",
    );
  }
  const candidateId = candidate.bindings.candidate.candidateId;
  if (
    spec.identity.candidateId !== candidateId ||
    spec.identity.candidateManifestId !== candidate.manifestId ||
    spec.identity.candidateManifestSha256 !== candidateObservation.sha256 ||
    spec.identity.candidateFrozenAt !== candidate.frozenAt ||
    spec.identity.requestId !== plan.requestId ||
    spec.identity.runId !== plan.runId ||
    spec.identity.receiptId !== plan.receiptId ||
    spec.identity.runtimeId !== plan.runtimeId ||
    spec.identity.sourceCommitSha !== plan.sourceCommitSha ||
    !isDeepStrictEqual(spec.planBinding, plan) ||
    spec.theoremName !== NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME ||
    spec.executor.theoremName !== NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME ||
    Date.parse(spec.sealedAt) < Date.parse(candidate.frozenAt)
  ) {
    fail(
      "formal_spec_binding_mismatch",
      "Formal run spec does not exactly bind the frozen candidate plan.",
    );
  }
  if (
    candidate.claimBoundary.experimentReadyTheoryClosureClaimAllowed !==
      false ||
    candidate.claimBoundary.physicalViabilityClaimAllowed !== false ||
    candidate.claimBoundary.transportClaimAllowed !== false ||
    candidate.claimBoundary.propulsionClaimAllowed !== false ||
    candidate.claimBoundary.routeEtaClaimAllowed !== false ||
    candidate.claimBoundary.speedAuthorityClaimAllowed !== false
  ) {
    fail(
      "candidate_claim_lock_opened",
      "Candidate opens a pre-experimental claim lock.",
    );
  }

  const expectedOutputRoot = resolveWorkspacePath(
    workspaceRoot,
    plan.expectedInvocation.outputDirectory,
    "formal output directory",
  );
  const expectedOuterArtifact = path.join(
    expectedOutputRoot,
    NHM2_EXPERIMENT_READY_THEORY_FORMAL_OUTER_FILENAME,
  );
  const declaredOuterArtifact = resolveWorkspacePath(
    workspaceRoot,
    spec.outerArtifactPath,
    "formal outer artifact",
  );
  if (
    !samePath(spec.executor.outputRoot, expectedOutputRoot) ||
    !samePath(
      spec.executor.replayWorkdirs[0],
      path.join(expectedOutputRoot, "replay-one"),
    ) ||
    !samePath(
      spec.executor.replayWorkdirs[1],
      path.join(expectedOutputRoot, "replay-two"),
    ) ||
    !samePath(declaredOuterArtifact, expectedOuterArtifact)
  ) {
    fail(
      "formal_output_binding_mismatch",
      "Formal output and replay paths do not match the preallocated plan.",
    );
  }

  for (const ledger of Object.values(spec.executor.ledgers)) {
    const root = resolveWorkspacePath(
      workspaceRoot,
      ledger.rootPath,
      `${ledger.kind} ledger root`,
    );
    if (!samePath(root, ledger.rootPath))
      fail(
        "sealed_ledger_mismatch",
        `${ledger.kind} ledger root is not canonical.`,
      );
    await assertSafePathChain(
      workspaceRoot,
      workspaceRealPath,
      root,
      "directory",
    );
  }
  const sourceEntries = ledgerAbsoluteEntries(spec.executor.ledgers.source);
  const outerWrapperAbsolutePath = resolveWorkspacePath(
    workspaceRoot,
    plan.solver.path,
    "formal outer runtime wrapper",
  );
  if (path.extname(outerWrapperAbsolutePath).toLowerCase() !== ".ts") {
    fail(
      "outer_wrapper_binding_invalid",
      "The frozen formal plan solver must bind the outer TypeScript runtime wrapper.",
    );
  }
  const formalProjectRoot = resolveWorkspacePath(
    workspaceRoot,
    spec.formalSourceBindings.projectRoot,
    "server-owned formal project root",
  );
  if (!samePath(formalProjectRoot, spec.executor.ledgers.source.rootPath)) {
    fail(
      "formal_source_root_mismatch",
      "Formal source bindings must use the exact sealed source-ledger root.",
    );
  }
  if (sourceEntries.has(pathKey(outerWrapperAbsolutePath))) {
    fail(
      "outer_wrapper_source_role_conflict",
      "The outer TypeScript runtime wrapper cannot be a Lean project source.",
    );
  }
  const expectedSources = new Map<
    string,
    { sha256: string; sizeBytes?: number }
  >();
  let replayDriverAbsolutePath: string | null = null;
  let replayDriverBinding: Nhm2ExperimentReadyTheoryFormalSourceBindingV1 | null =
    null;
  for (const binding of spec.formalSourceBindings.entries) {
    const absolutePath = resolveWorkspacePath(
      workspaceRoot,
      binding.path,
      `${binding.sourceRole} formal source`,
    );
    if (!isInside(formalProjectRoot, absolutePath)) {
      fail(
        "formal_source_path_escape",
        `${binding.sourceRole} is outside the server-owned formal project root.`,
      );
    }
    if (samePath(absolutePath, outerWrapperAbsolutePath)) {
      fail(
        "outer_wrapper_source_role_conflict",
        "The outer TypeScript runtime wrapper cannot be assigned a Lean source role.",
      );
    }
    expectedSources.set(pathKey(absolutePath), {
      sha256: binding.sha256,
      sizeBytes: binding.sizeBytes,
    });
    if (binding.sourceRole === "replay_driver") {
      replayDriverAbsolutePath = absolutePath;
      replayDriverBinding = binding;
    }
  }
  if (replayDriverAbsolutePath == null || replayDriverBinding == null) {
    fail("formal_run_spec_invalid", "A sealed Lean replay driver is required.");
  }
  const sealedReplayDriverPath = replayDriverAbsolutePath as string;
  const sealedReplayDriverBinding =
    replayDriverBinding as Nhm2ExperimentReadyTheoryFormalSourceBindingV1;
  assertExactLedgerBindings({
    actual: sourceEntries,
    expected: expectedSources,
    label: "formal source",
  });
  const replayDriverObservation = await readSecureWorkspaceText({
    workspaceRoot,
    workspaceRealPath,
    absolutePath: sealedReplayDriverPath,
    label: "standalone Lean replay driver",
    maxBytes:
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_WRAPPER_RESOURCE_LIMITS.maxReplayDriverBytes,
  });
  if (
    replayDriverObservation.sha256 !== sealedReplayDriverBinding.sha256 ||
    replayDriverObservation.sizeBytes !== sealedReplayDriverBinding.sizeBytes
  ) {
    fail(
      "sealed_ledger_mismatch",
      "Standalone Lean replay driver bytes do not match the formal source binding.",
    );
  }
  const driverText = replayDriverObservation.text;
  if (/\b(?:import|axiom|opaque|sorry|admit)\b/.test(driverText)) {
    fail(
      "formal_driver_not_standalone",
      "Standalone Lean replay driver may not import modules or introduce proof holes/axioms.",
    );
  }
  if (
    !/\btheorem\s+nhm2_pre_experimental_claim_locks\b/.test(driverText) ||
    !/#print\s+axioms\s+nhm2_pre_experimental_claim_locks\b/.test(driverText) ||
    !driverText.includes(NHM2_FORMAL_KERNEL_THEOREM_TRANSCRIPT_MARKER)
  ) {
    fail(
      "formal_driver_contract_mismatch",
      "Standalone Lean replay driver lacks the theorem, axiom audit, or exact transcript markers.",
    );
  }

  const inputEntries = ledgerAbsoluteEntries(spec.executor.ledgers.input);
  const expectedInputs = expectedInputBindings({
    workspaceRoot,
    sealedInputRoot: spec.executor.ledgers.input.rootPath,
    candidatePath: candidateObservation.relativePath,
    candidateSha256: candidateObservation.sha256,
    candidateSizeBytes: candidateObservation.sizeBytes,
    candidate,
    plan,
  });
  assertExactLedgerBindings({
    actual: inputEntries,
    expected: expectedInputs,
    label: "input",
  });

  const invocation = spec.executor.executableArguments;
  const expectedOutputs = spec.executor.expectedOutputPaths;
  if (
    spec.executor.executableRole !== "lean" ||
    invocation.length !== 3 ||
    !path.isAbsolute(invocation[0]) ||
    !samePath(invocation[0], sealedReplayDriverPath) ||
    invocation[1] !== "-o" ||
    expectedOutputs.length !== 1 ||
    !isPortableRelativePath(invocation[2]) ||
    invocation[2] !== expectedOutputs[0]
  ) {
    fail(
      "formal_invocation_mismatch",
      "Formal execution must be exact direct Lean `<sealed-standalone-driver> -o <relative-output>`.",
    );
  }
  const toolchainEntries = ledgerAbsoluteEntries(
    spec.executor.ledgers.toolchain,
  );
  const declaredToolchainRoot = resolveWorkspacePath(
    workspaceRoot,
    spec.toolchainBindings.toolchainRoot,
    "sealed Lean toolchain root",
  );
  if (
    !samePath(declaredToolchainRoot, spec.executor.ledgers.toolchain.rootPath)
  ) {
    fail(
      "formal_toolchain_root_mismatch",
      "Toolchain bindings must use the exact sealed toolchain-ledger root.",
    );
  }
  const expectedToolchain = new Map<
    string,
    { sha256: string; sizeBytes?: number }
  >();
  if (
    samePath(
      spec.executor.executables.lean.absolutePath,
      spec.executor.executables.lake.absolutePath,
    )
  ) {
    fail(
      "formal_toolchain_role_alias",
      "Lean and Lake executable roles must bind distinct filesystem paths.",
    );
  }
  let declaredLean: Nhm2ExperimentReadyTheoryFormalToolchainBindingV1 | null =
    null;
  let declaredLake: Nhm2ExperimentReadyTheoryFormalToolchainBindingV1 | null =
    null;
  for (const binding of spec.toolchainBindings.entries) {
    const absolutePath = resolveWorkspacePath(
      workspaceRoot,
      binding.path,
      `${binding.toolchainRole} toolchain entry`,
    );
    if (!isInside(declaredToolchainRoot, absolutePath)) {
      fail(
        "formal_toolchain_path_escape",
        `${binding.toolchainRole} is outside the sealed toolchain root.`,
      );
    }
    expectedToolchain.set(pathKey(absolutePath), {
      sha256: binding.sha256,
      sizeBytes: binding.sizeBytes,
    });
    if (binding.toolchainRole === "lean_executable") declaredLean = binding;
    if (binding.toolchainRole === "lake_executable") declaredLake = binding;
  }
  if (declaredLean == null || declaredLake == null) {
    fail(
      "formal_run_spec_invalid",
      "Lean and Lake executable toolchain bindings are required.",
    );
  }
  const sealedLeanBinding =
    declaredLean as Nhm2ExperimentReadyTheoryFormalToolchainBindingV1;
  const sealedLakeBinding =
    declaredLake as Nhm2ExperimentReadyTheoryFormalToolchainBindingV1;
  const executableBindingsMatch = (
    declared: Nhm2ExperimentReadyTheoryFormalToolchainBindingV1,
    executable: Nhm2FormalKernelPresealedRunSpecV1["executables"]["lean"],
  ): boolean => {
    const declaredAbsolute = resolveWorkspacePath(
      workspaceRoot,
      declared.path,
      `${declared.toolchainRole} executable`,
    );
    return (
      samePath(declaredAbsolute, executable.absolutePath) &&
      declared.sha256 === executable.sha256 &&
      declared.sizeBytes === executable.sizeBytes
    );
  };
  if (
    !executableBindingsMatch(
      sealedLeanBinding,
      spec.executor.executables.lean,
    ) ||
    !executableBindingsMatch(sealedLakeBinding, spec.executor.executables.lake)
  ) {
    fail(
      "formal_toolchain_executable_mismatch",
      "Lean/Lake executable bindings do not match the exact toolchain closure.",
    );
  }
  assertExactLedgerBindings({
    actual: toolchainEntries,
    expected: expectedToolchain,
    label: "toolchain",
  });

  await recheckInput(
    candidateObservation,
    workspaceRoot,
    workspaceRealPath,
    "candidate manifest",
  );
  await recheckInput(
    specObservation,
    workspaceRoot,
    workspaceRealPath,
    "formal run spec",
  );

  const observation = await executeNhm2FormalKernelReplay(spec.executor);
  if (
    observation.replays.some(
      (replay) =>
        !`${replay.process.stdout}\n${replay.process.stderr}`.includes(
          NHM2_FORMAL_KERNEL_AXIOM_TRANSCRIPT_MARKER,
        ),
    )
  ) {
    fail(
      "formal_axiom_audit_missing",
      "Direct Lean replay did not report the theorem's native empty-axiom audit.",
    );
  }

  await recheckInput(
    candidateObservation,
    workspaceRoot,
    workspaceRealPath,
    "candidate manifest",
  );
  await recheckInput(
    specObservation,
    workspaceRoot,
    workspaceRealPath,
    "formal run spec",
  );

  const replayEntries = replayInventory(observation, spec.executor);
  const artifact: Nhm2ExperimentReadyTheoryFormalExecutionArtifactV1 = {
    artifactId: NHM2_EXPERIMENT_READY_THEORY_FORMAL_EXECUTION_ARTIFACT_ID,
    contractVersion:
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_EXECUTION_CONTRACT_VERSION,
    generatedAt: observation.generatedAt,
    identity: { ...spec.identity },
    inputs: {
      candidateManifest: {
        path: candidateObservation.relativePath,
        sha256: candidateObservation.sha256,
        sizeBytes: candidateObservation.sizeBytes,
      },
      formalRunSpec: {
        path: specObservation.relativePath,
        sha256: specObservation.sha256,
        sizeBytes: specObservation.sizeBytes,
      },
    },
    planRole: "formal_kernel",
    theoremName: NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME,
    replayOutputInventory: {
      algorithm: "sha256_canonical_tuple_list/v1",
      entries: replayEntries,
      inventorySha256: inventorySha256(replayEntries),
    },
    executionObservation: observation,
    claimBoundary: CLAIM_BOUNDARY,
  };
  const artifactBytes = Buffer.from(JSON.stringify(artifact), "utf8");
  await atomicPublish(expectedOuterArtifact, artifactBytes);
  const artifactEntry: Nhm2ExperimentReadyTheoryFormalInventoryEntryV1 = {
    path: NHM2_EXPERIMENT_READY_THEORY_FORMAL_OUTER_FILENAME,
    sha256: sha256(artifactBytes),
    sizeBytes: artifactBytes.byteLength,
  };
  const finalOutputInventory = await observeExactFinalInventory({
    outputRoot: expectedOutputRoot,
    expected: [...replayEntries, artifactEntry],
  });
  return {
    executionArtifactPath: portablePath(workspaceRoot, expectedOuterArtifact),
    executionArtifactSha256: artifactEntry.sha256,
    executionArtifactSizeBytes: artifactEntry.sizeBytes,
    candidateManifestSha256: candidateObservation.sha256,
    formalRunSpecSha256: specObservation.sha256,
    finalOutputInventory,
    finalOutputInventorySha256: inventorySha256(finalOutputInventory),
    observation,
    claimBoundary: CLAIM_BOUNDARY,
  };
}

export const parseNhm2ExperimentReadyTheoryFormalCliArgs = (
  argv: string[],
): { candidateManifestPath: string; formalRunSpecPath: string } => {
  let candidateManifestPath: string | null = null;
  let formalRunSpecPath: string | null = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--candidate-manifest") {
      candidateManifestPath = argv[++index] ?? null;
      continue;
    }
    if (argument === "--formal-run-spec") {
      formalRunSpecPath = argv[++index] ?? null;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (!isText(candidateManifestPath))
    throw new Error("--candidate-manifest is required.");
  if (!isText(formalRunSpecPath))
    throw new Error("--formal-run-spec is required.");
  return { candidateManifestPath, formalRunSpecPath };
};

async function main(): Promise<void> {
  const args = parseNhm2ExperimentReadyTheoryFormalCliArgs(
    process.argv.slice(2),
  );
  const result = await runNhm2ExperimentReadyTheoryFormal(args);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    const code =
      error instanceof Nhm2ExperimentReadyTheoryFormalWrapperError ||
      (isRecord(error) && typeof error.code === "string")
        ? ` [${String(error.code)}]`
        : "";
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}${code}\n`,
    );
    process.exitCode = 1;
  });
}
