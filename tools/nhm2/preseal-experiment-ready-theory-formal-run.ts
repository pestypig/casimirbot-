import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import {
  NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_FILENAME,
  isNhm2ExperimentReadyTheoryCandidateManifest,
  nhm2ExperimentReadyTheoryFormalInvocation,
  type Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1,
  type Nhm2ExperimentReadyTheoryCandidateManifestV1,
} from "../../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME,
  NHM2_FORMAL_KERNEL_THEOREM_TRANSCRIPT_MARKER,
  computeNhm2FormalKernelLedgerSha256,
  type Nhm2FormalKernelLedgerEntryV1,
  type Nhm2FormalKernelLedgerKind,
  type Nhm2FormalKernelSealedLedgerV1,
} from "../../server/services/theory/nhm2-formal-kernel-executor";
import {
  NHM2_EXPERIMENT_READY_THEORY_FORMAL_OUTER_FILENAME,
  NHM2_EXPERIMENT_READY_THEORY_FORMAL_REQUIRED_SOURCE_ROLES,
  NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_ARTIFACT_ID,
  NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_CONTRACT_VERSION,
  type Nhm2ExperimentReadyTheoryFormalClaimBoundaryV1,
  type Nhm2ExperimentReadyTheoryFormalRunSpecV1,
  type Nhm2ExperimentReadyTheoryFormalSourceBindingV1,
  type Nhm2ExperimentReadyTheoryFormalSourceRoleV1,
  type Nhm2ExperimentReadyTheoryFormalToolchainBindingV1,
} from "./run-experiment-ready-theory-formal";

export { NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_FILENAME } from "../../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";

export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_PRESEAL_DEFAULT_LIMITS = {
  maxFileCount: 100_000,
  maxFileBytes: 512 * 1024 * 1024,
  maxAggregateBytes: 8 * 1024 * 1024 * 1024,
  maxCandidateManifestBytes: 16 * 1024 * 1024,
} as const;

export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_PRESEAL_HARD_LIMITS = {
  maxFileCount: 250_000,
  maxFileBytes: 2 * 1024 * 1024 * 1024,
  maxAggregateBytes: 16 * 1024 * 1024 * 1024,
  maxCandidateManifestBytes: 64 * 1024 * 1024,
} as const;

export type Nhm2ExperimentReadyTheoryFormalPresealResourceLimitsV1 = {
  maxFileCount: number;
  maxFileBytes: number;
  maxAggregateBytes: number;
  maxCandidateManifestBytes: number;
};

export type PresealNhm2ExperimentReadyTheoryFormalRunInput = {
  candidateManifestPath: string;
  stagingRoot: string;
  trustedToolchainRoot: string;
  trustedLeanExecutablePath: string;
  trustedLakeExecutablePath: string;
  trustedFormalProjectRoot?: string;
  workspaceRoot?: string;
  timeoutMs?: number;
  maxCapturedOutputBytes?: number;
  resourceLimits?: Partial<Nhm2ExperimentReadyTheoryFormalPresealResourceLimitsV1>;
  now?: () => Date;
};

export type PresealNhm2ExperimentReadyTheoryFormalRunResult = {
  formalRunSpecPath: string;
  formalRunSpecSha256: string;
  formalRunSpecSizeBytes: number;
  stagingRoot: string;
  sourceLedger: Nhm2FormalKernelSealedLedgerV1;
  toolchainLedger: Nhm2FormalKernelSealedLedgerV1;
  inputLedger: Nhm2FormalKernelSealedLedgerV1;
  runSpec: Nhm2ExperimentReadyTheoryFormalRunSpecV1;
  claimBoundary: Nhm2ExperimentReadyTheoryFormalClaimBoundaryV1;
};

export class Nhm2ExperimentReadyTheoryFormalPresealError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "Nhm2ExperimentReadyTheoryFormalPresealError";
    this.code = code;
  }
}

type FileIdentity = {
  dev: string;
  ino: string;
  mode: number;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  nlink: number;
};

type TreeFile = {
  absolutePath: string;
  relativePath: string;
  identity: FileIdentity;
};

type TreeObservation = {
  files: TreeFile[];
  directories: string[];
};

type HashedFile = Nhm2FormalKernelLedgerEntryV1 & {
  absolutePath: string;
};

const SHA256 = /^[a-f0-9]{64}$/;
const MAX_TIMEOUT_MS = 60 * 60 * 1_000;
const MAX_CAPTURE_BYTES = 16 * 1024 * 1024;
const COPY_CHUNK_BYTES = 1024 * 1024;
const DRIVER_MAX_BYTES = 4 * 1024 * 1024;

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

const REQUIRED_SOURCE_ROLE_SUFFIXES: Readonly<
  Record<
    Exclude<Nhm2ExperimentReadyTheoryFormalSourceRoleV1, "supporting_source">,
    string
  >
> = {
  lakefile: "lakefile.lean",
  lean_toolchain: "lean-toolchain",
  root_module: "NHM2Formal.lean",
  claim_boundary: "NHM2Formal/ClaimBoundary.lean",
  experiment_ready_claim_locks: "NHM2Formal/ExperimentReadyClaimLocks.lean",
  replay_driver: "NHM2Formal/ExperimentReadyReplayDriver.lean",
};

const fail = (code: string, message: string): never => {
  throw new Nhm2ExperimentReadyTheoryFormalPresealError(code, message);
};

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

const compareUtf8 = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.trim() === value;

const normalizedPath = (value: string): string => {
  let normalized = path.resolve(value);
  if (process.platform === "win32") {
    normalized = normalized
      .replace(/^\\\\\?\\UNC\\/i, "\\\\")
      .replace(/^\\\\\?\\/, "")
      .toLowerCase();
  }
  return normalized;
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

const pathsOverlap = (left: string, right: string): boolean =>
  samePath(left, right) || isInside(left, right) || isInside(right, left);

const portablePath = (root: string, absolutePath: string): string =>
  path.relative(root, absolutePath).split(path.sep).join("/");

const isPortableRelativePath = (value: string): boolean =>
  value.length > 0 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !path.posix.isAbsolute(value) &&
  !path.win32.isAbsolute(value) &&
  path.posix.normalize(value) === value &&
  value
    .split("/")
    .every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    );

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
  left: FileIdentity,
  right: Awaited<ReturnType<typeof fs.lstat>>,
): boolean => isDeepStrictEqual(left, identity(right));

const requireAbsoluteLocalPath = (value: string, label: string): string => {
  if (
    !isText(value) ||
    value.includes("\0") ||
    !path.isAbsolute(value) ||
    (process.platform === "win32" &&
      (/^\\\\/.test(value) || /^\\\\\?\\/.test(value)))
  ) {
    fail(
      "absolute_local_path_required",
      `${label} must be an absolute local path.`,
    );
  }
  return path.resolve(value);
};

const resolveWorkspacePath = (
  workspaceRoot: string,
  candidate: string,
  label: string,
): string => {
  if (!isText(candidate) || candidate.includes("\0")) {
    fail("path_invalid", `${label} path is invalid.`);
  }
  const absolute = path.isAbsolute(candidate)
    ? path.resolve(candidate)
    : path.resolve(workspaceRoot, candidate);
  if (!isInside(workspaceRoot, absolute)) {
    fail("path_escape", `${label} escapes the trusted workspace.`);
  }
  return absolute;
};

async function assertExistingPathChainSafe(
  absolutePath: string,
  label: string,
): Promise<void> {
  const parsed = path.parse(absolutePath);
  const relative = path.relative(parsed.root, absolutePath);
  const segments = relative.length === 0 ? [] : relative.split(path.sep);
  let cursor = parsed.root;
  for (const segment of segments) {
    cursor = path.join(cursor, segment);
    const stat = await fs
      .lstat(cursor)
      .catch((error: NodeJS.ErrnoException) =>
        fail(
          "path_unreadable",
          `${label} path component is unreadable (${cursor}): ${error.code ?? "lstat_failed"}.`,
        ),
      );
    if (stat.isSymbolicLink()) {
      fail(
        "symlink_or_reparse_forbidden",
        `${label} contains a symbolic link or reparse point: ${cursor}.`,
      );
    }
    const real = await fs.realpath(cursor);
    if (!samePath(real, cursor)) {
      fail(
        "symlink_or_reparse_forbidden",
        `${label} resolves through a symbolic link or reparse point: ${cursor}.`,
      );
    }
  }
}

async function assertMissing(
  absolutePath: string,
  label: string,
): Promise<void> {
  try {
    await fs.lstat(absolutePath);
    fail("fresh_root_required", `${label} already exists.`);
  } catch (error) {
    if (
      error instanceof Nhm2ExperimentReadyTheoryFormalPresealError ||
      (error as NodeJS.ErrnoException).code !== "ENOENT"
    ) {
      throw error;
    }
  }
}

const resolveLimits = (
  supplied: Partial<Nhm2ExperimentReadyTheoryFormalPresealResourceLimitsV1> = {},
): Nhm2ExperimentReadyTheoryFormalPresealResourceLimitsV1 => {
  const limits = {
    ...NHM2_EXPERIMENT_READY_THEORY_FORMAL_PRESEAL_DEFAULT_LIMITS,
    ...supplied,
  };
  for (const key of Object.keys(limits) as Array<keyof typeof limits>) {
    const value = limits[key];
    const hard = NHM2_EXPERIMENT_READY_THEORY_FORMAL_PRESEAL_HARD_LIMITS[key];
    if (!Number.isSafeInteger(value) || value <= 0 || value > hard) {
      fail(
        "resource_limits_invalid",
        `${key} must be a positive safe integer no greater than ${hard}.`,
      );
    }
  }
  if (limits.maxCandidateManifestBytes > limits.maxFileBytes) {
    fail(
      "resource_limits_invalid",
      "maxCandidateManifestBytes cannot exceed maxFileBytes.",
    );
  }
  return limits;
};

class ResourceBudget {
  private fileCount = 0;
  private aggregateBytes = 0;

  constructor(
    private readonly limits: Nhm2ExperimentReadyTheoryFormalPresealResourceLimitsV1,
  ) {}

  add(sizeBytes: number, label: string): void {
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 0) {
      fail("resource_limit_exceeded", `${label} has an invalid byte size.`);
    }
    if (sizeBytes > this.limits.maxFileBytes) {
      fail(
        "resource_limit_exceeded",
        `${label} exceeds maxFileBytes=${this.limits.maxFileBytes}.`,
      );
    }
    this.fileCount += 1;
    this.aggregateBytes += sizeBytes;
    if (
      this.fileCount > this.limits.maxFileCount ||
      this.aggregateBytes > this.limits.maxAggregateBytes
    ) {
      fail(
        "resource_limit_exceeded",
        `Preseal input exceeds maxFileCount=${this.limits.maxFileCount} or maxAggregateBytes=${this.limits.maxAggregateBytes}.`,
      );
    }
  }
}

async function observeTree(input: {
  rootPath: string;
  label: string;
  budget: ResourceBudget;
  includeFile: (relativePath: string) => boolean;
}): Promise<TreeObservation> {
  await assertExistingPathChainSafe(input.rootPath, input.label);
  const rootStat = await fs.lstat(input.rootPath);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    fail(
      "regular_directory_required",
      `${input.label} root must be a regular non-aliased directory.`,
    );
  }
  const files: TreeFile[] = [];
  const includedDirectories = new Set<string>();
  const visit = async (
    absoluteDirectory: string,
    relativeDirectory: string,
  ): Promise<void> => {
    const entries = await fs.readdir(absoluteDirectory, {
      encoding: "utf8",
      withFileTypes: true,
    });
    entries.sort((left, right) => compareUtf8(left.name, right.name));
    for (const entry of entries) {
      const absoluteEntry = path.join(absoluteDirectory, entry.name);
      const relativeEntry = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const stat = await fs.lstat(absoluteEntry);
      if (entry.isSymbolicLink() || stat.isSymbolicLink()) {
        fail(
          "symlink_or_reparse_forbidden",
          `${input.label} contains a symbolic link or reparse point: ${relativeEntry}.`,
        );
      }
      const real = await fs.realpath(absoluteEntry);
      if (!samePath(real, absoluteEntry)) {
        fail(
          "symlink_or_reparse_forbidden",
          `${input.label} entry resolves through a symbolic link or reparse point: ${relativeEntry}.`,
        );
      }
      if (entry.isDirectory() && stat.isDirectory()) {
        await visit(absoluteEntry, relativeEntry);
        continue;
      }
      if (!entry.isFile() || !stat.isFile()) {
        fail(
          "special_file_forbidden",
          `${input.label} contains a non-regular entry: ${relativeEntry}.`,
        );
      }
      if (stat.nlink !== 1) {
        fail(
          "hardlink_forbidden",
          `${input.label} file has nlink=${stat.nlink}: ${relativeEntry}.`,
        );
      }
      if (!input.includeFile(relativeEntry)) continue;
      input.budget.add(Number(stat.size), `${input.label}:${relativeEntry}`);
      const parts = relativeEntry.split("/");
      parts.pop();
      let directory = "";
      for (const part of parts) {
        directory = directory ? `${directory}/${part}` : part;
        includedDirectories.add(directory);
      }
      files.push({
        absolutePath: absoluteEntry,
        relativePath: relativeEntry,
        identity: identity(stat),
      });
    }
  };
  await visit(input.rootPath, "");
  files.sort((left, right) =>
    compareUtf8(left.relativePath, right.relativePath),
  );
  return {
    files,
    directories: [...includedDirectories].sort(compareUtf8),
  };
}

async function hashObservedFile(input: {
  file: TreeFile;
  label: string;
  collectBytes?: boolean;
  collectLimitBytes?: number;
}): Promise<{ sha256: string; sizeBytes: number; bytes?: Buffer }> {
  const noFollow =
    process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    handle = await fs.open(
      input.file.absolutePath,
      fsConstants.O_RDONLY | noFollow,
    );
    const opened = await handle.stat();
    if (!identitiesMatch(input.file.identity, opened)) {
      fail("input_changed", `${input.label} changed while opening.`);
    }
    if (
      input.collectBytes &&
      input.collectLimitBytes != null &&
      input.file.identity.size > input.collectLimitBytes
    ) {
      fail(
        "resource_limit_exceeded",
        `${input.label} exceeds its in-memory inspection limit.`,
      );
    }
    const digest = createHash("sha256");
    const chunks: Buffer[] = [];
    const buffer = Buffer.allocUnsafe(COPY_CHUNK_BYTES);
    let position = 0;
    while (position < input.file.identity.size) {
      const requested = Math.min(
        buffer.byteLength,
        input.file.identity.size - position,
      );
      const { bytesRead } = await handle.read(buffer, 0, requested, position);
      if (bytesRead <= 0) {
        fail("input_changed", `${input.label} ended before its declared size.`);
      }
      const chunk = buffer.subarray(0, bytesRead);
      digest.update(chunk);
      if (input.collectBytes) chunks.push(Buffer.from(chunk));
      position += bytesRead;
    }
    const after = await fs.lstat(input.file.absolutePath);
    if (!identitiesMatch(input.file.identity, after)) {
      fail("input_changed", `${input.label} changed while hashing.`);
    }
    return {
      sha256: digest.digest("hex"),
      sizeBytes: position,
      ...(input.collectBytes ? { bytes: Buffer.concat(chunks) } : {}),
    };
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

async function copyObservedFile(input: {
  file: TreeFile;
  destinationPath: string;
  label: string;
}): Promise<HashedFile> {
  const noFollow =
    process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
  let source: Awaited<ReturnType<typeof fs.open>> | null = null;
  let destination: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    source = await fs.open(
      input.file.absolutePath,
      fsConstants.O_RDONLY | noFollow,
    );
    const opened = await source.stat();
    if (!identitiesMatch(input.file.identity, opened)) {
      fail("input_changed", `${input.label} changed while opening for copy.`);
    }
    destination = await fs.open(input.destinationPath, "wx", 0o600);
    const digest = createHash("sha256");
    const buffer = Buffer.allocUnsafe(COPY_CHUNK_BYTES);
    let position = 0;
    while (position < input.file.identity.size) {
      const requested = Math.min(
        buffer.byteLength,
        input.file.identity.size - position,
      );
      const { bytesRead } = await source.read(buffer, 0, requested, position);
      if (bytesRead <= 0) {
        fail("input_changed", `${input.label} ended during copy.`);
      }
      digest.update(buffer.subarray(0, bytesRead));
      let written = 0;
      while (written < bytesRead) {
        const result = await destination.write(
          buffer,
          written,
          bytesRead - written,
          position + written,
        );
        if (result.bytesWritten <= 0) {
          fail("staging_write_failed", `${input.label} could not be staged.`);
        }
        written += result.bytesWritten;
      }
      position += bytesRead;
    }
    await destination.sync();
    await destination.close();
    destination = null;
    const afterSource = await fs.lstat(input.file.absolutePath);
    if (!identitiesMatch(input.file.identity, afterSource)) {
      fail("input_changed", `${input.label} changed while being copied.`);
    }
    if (process.platform !== "win32") {
      await fs.chmod(input.destinationPath, input.file.identity.mode & 0o777);
    }
    const stagedStat = await fs.lstat(input.destinationPath);
    if (
      stagedStat.isSymbolicLink() ||
      !stagedStat.isFile() ||
      stagedStat.nlink !== 1 ||
      Number(stagedStat.size) !== position
    ) {
      fail("staged_copy_invalid", `${input.label} staged as an unsafe file.`);
    }
    const sourceSha256 = digest.digest("hex");
    const staged = await hashObservedFile({
      file: {
        absolutePath: input.destinationPath,
        relativePath: input.file.relativePath,
        identity: identity(stagedStat),
      },
      label: `staged ${input.label}`,
    });
    if (staged.sha256 !== sourceSha256 || staged.sizeBytes !== position) {
      fail("staged_hash_mismatch", `${input.label} staged bytes do not match.`);
    }
    return {
      absolutePath: input.destinationPath,
      relativePath: input.file.relativePath,
      sha256: sourceSha256,
      sizeBytes: position,
    };
  } finally {
    await source?.close().catch(() => undefined);
    await destination?.close().catch(() => undefined);
  }
}

async function createExactDirectories(
  rootPath: string,
  directories: readonly string[],
): Promise<void> {
  await fs.mkdir(rootPath);
  for (const relative of directories) {
    if (!isPortableRelativePath(relative)) {
      fail("path_invalid", `Staged directory path is invalid: ${relative}.`);
    }
    await fs.mkdir(path.join(rootPath, ...relative.split("/")));
  }
}

async function stageTree(input: {
  tree: TreeObservation;
  destinationRoot: string;
  label: string;
}): Promise<HashedFile[]> {
  await createExactDirectories(input.destinationRoot, input.tree.directories);
  const staged: HashedFile[] = [];
  for (const file of input.tree.files) {
    staged.push(
      await copyObservedFile({
        file,
        destinationPath: path.join(
          input.destinationRoot,
          ...file.relativePath.split("/"),
        ),
        label: `${input.label}:${file.relativePath}`,
      }),
    );
  }
  return staged;
}

const ledger = (
  kind: Nhm2FormalKernelLedgerKind,
  rootPath: string,
  files: readonly Pick<HashedFile, "relativePath" | "sha256" | "sizeBytes">[],
): Nhm2FormalKernelSealedLedgerV1 => {
  const entries = files
    .map(({ relativePath, sha256: digest, sizeBytes }) => ({
      relativePath,
      sha256: digest,
      sizeBytes,
    }))
    .sort((left, right) => compareUtf8(left.relativePath, right.relativePath));
  return {
    kind,
    rootPath,
    entries,
    ledgerSha256: computeNhm2FormalKernelLedgerSha256({ kind, entries }),
  };
};

const sourceRole = (
  relativePath: string,
): Nhm2ExperimentReadyTheoryFormalSourceRoleV1 | null => {
  for (const [role, suffix] of Object.entries(
    REQUIRED_SOURCE_ROLE_SUFFIXES,
  ) as Array<
    [
      Exclude<Nhm2ExperimentReadyTheoryFormalSourceRoleV1, "supporting_source">,
      string,
    ]
  >) {
    if (
      relativePath === suffix ||
      relativePath.endsWith(`/${suffix}`) ||
      (role === "replay_driver" &&
        /(?:^|\/)[^/]*ReplayDriver\.lean$/.test(relativePath))
    ) {
      return role;
    }
  }
  if (
    relativePath.endsWith(".lean") ||
    relativePath.endsWith("lake-manifest.json")
  ) {
    return "supporting_source";
  }
  return null;
};

const expectedDirectories = (relativePaths: readonly string[]): string[] => {
  const directories = new Set<string>();
  for (const relativePath of relativePaths) {
    const parts = relativePath.split("/");
    parts.pop();
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      directories.add(current);
    }
  }
  return [...directories].sort(compareUtf8);
};

const requireClosedCandidateClaims = (
  candidate: Nhm2ExperimentReadyTheoryCandidateManifestV1,
): void => {
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
};

const validateDriver = async (driver: HashedFile): Promise<void> => {
  if (driver.sizeBytes > DRIVER_MAX_BYTES) {
    fail(
      "formal_driver_invalid",
      "Standalone Lean replay driver is too large.",
    );
  }
  const stat = await fs.lstat(driver.absolutePath);
  const observed = await hashObservedFile({
    file: {
      absolutePath: driver.absolutePath,
      relativePath: driver.relativePath,
      identity: identity(stat),
    },
    label: "standalone Lean replay driver",
    collectBytes: true,
    collectLimitBytes: DRIVER_MAX_BYTES,
  });
  if (
    observed.sha256 !== driver.sha256 ||
    observed.sizeBytes !== driver.sizeBytes
  ) {
    fail(
      "staged_hash_mismatch",
      "Standalone Lean replay driver changed after staging.",
    );
  }
  const text = (() => {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(observed.bytes);
    } catch {
      return fail(
        "formal_driver_invalid",
        "Standalone Lean replay driver is not UTF-8.",
      );
    }
  })();
  if (/\b(?:import|axiom|opaque|sorry|admit)\b/.test(text)) {
    fail(
      "formal_driver_not_standalone",
      "Standalone Lean replay driver imports a project module or introduces an axiom/proof hole.",
    );
  }
  if (
    !/\btheorem\s+nhm2_pre_experimental_claim_locks\b/.test(text) ||
    !/#print\s+axioms\s+nhm2_pre_experimental_claim_locks\b/.test(text) ||
    !text.includes(NHM2_FORMAL_KERNEL_THEOREM_TRANSCRIPT_MARKER)
  ) {
    fail(
      "formal_driver_contract_mismatch",
      "Standalone Lean replay driver lacks the required theorem, native axiom audit, or transcript marker.",
    );
  }
};

const readCandidate = async (input: {
  workspaceRoot: string;
  candidatePath: string;
  limits: Nhm2ExperimentReadyTheoryFormalPresealResourceLimitsV1;
}): Promise<{
  candidate: Nhm2ExperimentReadyTheoryCandidateManifestV1;
  sha256: string;
  sizeBytes: number;
  identity: FileIdentity;
}> => {
  await assertExistingPathChainSafe(input.candidatePath, "candidate manifest");
  const stat = await fs.lstat(input.candidatePath);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) {
    fail(
      "candidate_manifest_invalid",
      "Candidate manifest must be a unique regular file.",
    );
  }
  if (Number(stat.size) > input.limits.maxCandidateManifestBytes) {
    fail(
      "resource_limit_exceeded",
      "Candidate manifest exceeds its resource cap.",
    );
  }
  const observed = await hashObservedFile({
    file: {
      absolutePath: input.candidatePath,
      relativePath: portablePath(input.workspaceRoot, input.candidatePath),
      identity: identity(stat),
    },
    label: "candidate manifest",
    collectBytes: true,
    collectLimitBytes: input.limits.maxCandidateManifestBytes,
  });
  const text = (() => {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(observed.bytes);
    } catch {
      return fail(
        "candidate_manifest_invalid",
        "Candidate manifest is not UTF-8 JSON.",
      );
    }
  })();
  const value: unknown = (() => {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return fail(
        "candidate_manifest_invalid",
        "Candidate manifest is not valid JSON.",
      );
    }
  })();
  if (
    `${JSON.stringify(value, null, 2)}\n` !== text ||
    !isNhm2ExperimentReadyTheoryCandidateManifest(value)
  ) {
    fail(
      "candidate_manifest_invalid",
      "Candidate manifest is not canonical, complete, and pre-run ready.",
    );
  }
  const candidate = value as Nhm2ExperimentReadyTheoryCandidateManifestV1;
  if (candidate.readiness.status !== "pre_run_manifest_ready") {
    fail("candidate_manifest_invalid", "Candidate is not pre-run ready.");
  }
  requireClosedCandidateClaims(candidate);
  return {
    candidate,
    sha256: observed.sha256,
    sizeBytes: observed.sizeBytes,
    identity: identity(stat),
  };
};

const formalPlan = (
  candidate: Nhm2ExperimentReadyTheoryCandidateManifestV1,
): Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1 => {
  const plans = candidate.executionPlans.filter(
    (entry) => entry.planRole === "formal_kernel",
  );
  if (plans.length !== 1) {
    fail(
      "formal_plan_invalid",
      "Candidate must contain exactly one formal_kernel plan.",
    );
  }
  return plans[0];
};

const canonicalInputBindings = (input: {
  workspaceRoot: string;
  candidatePath: string;
  candidateSha256: string;
  candidate: Nhm2ExperimentReadyTheoryCandidateManifestV1;
  plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1;
}): Map<string, string> => {
  const bindings = new Map<string, string>();
  const add = (candidatePath: string, digest: string, label: string): void => {
    if (!SHA256.test(digest))
      fail("input_binding_invalid", `${label} has an invalid SHA-256.`);
    const absolute = resolveWorkspacePath(
      input.workspaceRoot,
      candidatePath,
      label,
    );
    const key = pathKey(absolute);
    const prior = bindings.get(key);
    if (prior != null && prior !== digest) {
      fail(
        "input_binding_collision",
        `${label} conflicts with another frozen binding.`,
      );
    }
    bindings.set(key, digest);
  };
  add(input.candidatePath, input.candidateSha256, "candidate manifest");
  for (const [role, binding] of Object.entries(input.candidate.bindings)) {
    add(binding.path, binding.sha256, `${role} binding`);
  }
  add(
    input.candidate.numericCheckPolicySet.artifactPath,
    input.candidate.numericCheckPolicySet.artifactRawSha256,
    "numeric policy",
  );
  add(input.plan.solver.path, input.plan.solver.sha256, "formal outer wrapper");
  add(
    input.plan.environmentLock.path,
    input.plan.environmentLock.sha256,
    "formal environment lock",
  );
  return bindings;
};

async function observeBoundInputTree(input: {
  workspaceRoot: string;
  bindings: Map<string, string>;
  budget: ResourceBudget;
}): Promise<TreeObservation> {
  const files: TreeFile[] = [];
  for (const absolutePath of [...input.bindings.keys()].sort(compareUtf8)) {
    const relativePath = portablePath(input.workspaceRoot, absolutePath);
    if (!isPortableRelativePath(relativePath)) {
      fail(
        "input_root_invalid",
        `Candidate input path is not portable: ${relativePath}.`,
      );
    }
    await assertExistingPathChainSafe(
      absolutePath,
      `candidate input:${relativePath}`,
    );
    const stat = await fs.lstat(absolutePath);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      fail(
        "regular_file_required",
        `Candidate input must be a regular file: ${relativePath}.`,
      );
    }
    if (stat.nlink !== 1) {
      fail(
        "hardlink_forbidden",
        `Candidate input has nlink=${stat.nlink}: ${relativePath}.`,
      );
    }
    input.budget.add(Number(stat.size), `candidate input:${relativePath}`);
    const file: TreeFile = {
      absolutePath,
      relativePath,
      identity: identity(stat),
    };
    const observed = await hashObservedFile({
      file,
      label: `candidate input:${relativePath}`,
    });
    const expected = input.bindings.get(pathKey(absolutePath));
    if (expected == null || expected !== observed.sha256) {
      fail(
        "input_hash_mismatch",
        `Candidate input hash differs: ${relativePath}.`,
      );
    }
    files.push(file);
  }
  files.sort((left, right) =>
    compareUtf8(left.relativePath, right.relativePath),
  );
  return {
    files,
    directories: expectedDirectories(files.map((entry) => entry.relativePath)),
  };
}

async function verifyLedgerTree(
  ledgerValue: Nhm2FormalKernelSealedLedgerV1,
): Promise<void> {
  const budget = new ResourceBudget(
    NHM2_EXPERIMENT_READY_THEORY_FORMAL_PRESEAL_HARD_LIMITS,
  );
  const tree = await observeTree({
    rootPath: ledgerValue.rootPath,
    label: `staged ${ledgerValue.kind} closure`,
    budget,
    includeFile: () => true,
  });
  const observed: Nhm2FormalKernelLedgerEntryV1[] = [];
  for (const file of tree.files) {
    const hashed = await hashObservedFile({
      file,
      label: `staged ${ledgerValue.kind}:${file.relativePath}`,
    });
    observed.push({
      relativePath: file.relativePath,
      sha256: hashed.sha256,
      sizeBytes: hashed.sizeBytes,
    });
  }
  if (
    JSON.stringify(observed) !== JSON.stringify(ledgerValue.entries) ||
    computeNhm2FormalKernelLedgerSha256({
      kind: ledgerValue.kind,
      entries: observed,
    }) !== ledgerValue.ledgerSha256
  ) {
    fail("staged_hash_mismatch", `Staged ${ledgerValue.kind} closure changed.`);
  }
}

export async function presealNhm2ExperimentReadyTheoryFormalRun(
  input: PresealNhm2ExperimentReadyTheoryFormalRunInput,
): Promise<PresealNhm2ExperimentReadyTheoryFormalRunResult> {
  const workspaceRoot = path.resolve(input.workspaceRoot ?? process.cwd());
  await assertExistingPathChainSafe(workspaceRoot, "workspace root");
  const workspaceStat = await fs.lstat(workspaceRoot);
  if (workspaceStat.isSymbolicLink() || !workspaceStat.isDirectory()) {
    fail(
      "workspace_invalid",
      "Workspace root must be a regular non-aliased directory.",
    );
  }
  const limits = resolveLimits(input.resourceLimits);
  const budget = new ResourceBudget(limits);
  const candidatePath = resolveWorkspacePath(
    workspaceRoot,
    input.candidateManifestPath,
    "candidate manifest",
  );
  const stagingRoot = resolveWorkspacePath(
    workspaceRoot,
    input.stagingRoot,
    "formal staging root",
  );
  await assertMissing(stagingRoot, "Formal staging root");
  await assertExistingPathChainSafe(
    path.dirname(stagingRoot),
    "formal staging parent",
  );

  const trustedFormalProjectRoot = input.trustedFormalProjectRoot
    ? requireAbsoluteLocalPath(
        input.trustedFormalProjectRoot,
        "trusted formal project root",
      )
    : path.resolve(workspaceRoot, "formal", "lean");
  const trustedToolchainRoot = requireAbsoluteLocalPath(
    input.trustedToolchainRoot,
    "trusted toolchain root",
  );
  const trustedLeanExecutable = requireAbsoluteLocalPath(
    input.trustedLeanExecutablePath,
    "trusted Lean executable",
  );
  const trustedLakeExecutable = requireAbsoluteLocalPath(
    input.trustedLakeExecutablePath,
    "trusted Lake executable",
  );
  if (
    !isInside(trustedToolchainRoot, trustedLeanExecutable) ||
    !isInside(trustedToolchainRoot, trustedLakeExecutable)
  ) {
    fail(
      "toolchain_executable_escape",
      "Trusted Lean and Lake executables must be distinct files inside the trusted toolchain root.",
    );
  }
  if (samePath(trustedLeanExecutable, trustedLakeExecutable)) {
    fail(
      "toolchain_role_alias",
      "Trusted Lean and Lake executable paths must be distinct.",
    );
  }

  const candidateObservation = await readCandidate({
    workspaceRoot,
    candidatePath,
    limits,
  });
  budget.add(candidateObservation.sizeBytes, "candidate manifest");
  const candidate = candidateObservation.candidate;
  const plan = formalPlan(candidate);
  const frozenFormalInvocation = (() => {
    try {
      return nhm2ExperimentReadyTheoryFormalInvocation({
        candidateManifestPath: portablePath(workspaceRoot, candidatePath),
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
  if (!samePath(stagingRoot, path.dirname(frozenFormalRunSpecAbsolutePath))) {
    fail(
      "formal_staging_binding_mismatch",
      "Formal staging root must equal the directory frozen by the candidate plan.",
    );
  }
  if (path.extname(plan.solver.path).toLowerCase() !== ".ts") {
    fail(
      "formal_plan_invalid",
      "Formal plan solver must bind the outer TypeScript runtime wrapper.",
    );
  }
  const inputBindings = canonicalInputBindings({
    workspaceRoot,
    candidatePath,
    candidateSha256: candidateObservation.sha256,
    candidate,
    plan,
  });
  const inputTree = await observeBoundInputTree({
    workspaceRoot,
    bindings: inputBindings,
    budget,
  });

  const outputRoot = resolveWorkspacePath(
    workspaceRoot,
    plan.expectedInvocation.outputDirectory,
    "formal output root",
  );
  await assertMissing(outputRoot, "Formal output root");
  await assertExistingPathChainSafe(
    path.dirname(outputRoot),
    "formal output parent",
  );
  for (const [left, right, label] of [
    [stagingRoot, outputRoot, "staging and output roots"],
    [stagingRoot, trustedFormalProjectRoot, "staging and trusted source roots"],
    [stagingRoot, trustedToolchainRoot, "staging and trusted toolchain roots"],
  ] as const) {
    if (pathsOverlap(left, right)) {
      fail("root_overlap_forbidden", `${label} must be disjoint.`);
    }
  }

  const sourceTree = await observeTree({
    rootPath: trustedFormalProjectRoot,
    label: "trusted formal source closure",
    budget,
    includeFile: (relativePath) => sourceRole(relativePath) != null,
  });
  const roleCounts = new Map<string, number>();
  for (const file of sourceTree.files) {
    const role = sourceRole(file.relativePath);
    if (role == null) continue;
    roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
    if (file.identity.size <= 0) {
      fail(
        "formal_source_empty",
        `Formal source is empty: ${file.relativePath}.`,
      );
    }
  }
  for (const role of NHM2_EXPERIMENT_READY_THEORY_FORMAL_REQUIRED_SOURCE_ROLES) {
    if (roleCounts.get(role) !== 1) {
      fail(
        "formal_source_role_mismatch",
        `Formal source closure must contain exactly one ${role} role.`,
      );
    }
  }

  const toolchainTree = await observeTree({
    rootPath: trustedToolchainRoot,
    label: "trusted Lean toolchain closure",
    budget,
    includeFile: () => true,
  });
  if (toolchainTree.files.length < 2) {
    fail(
      "toolchain_closure_invalid",
      "Trusted toolchain closure is incomplete.",
    );
  }
  const leanRelative = portablePath(
    trustedToolchainRoot,
    trustedLeanExecutable,
  );
  const lakeRelative = portablePath(
    trustedToolchainRoot,
    trustedLakeExecutable,
  );
  if (
    !isPortableRelativePath(leanRelative) ||
    !isPortableRelativePath(lakeRelative) ||
    !toolchainTree.files.some((entry) => entry.relativePath === leanRelative) ||
    !toolchainTree.files.some((entry) => entry.relativePath === lakeRelative)
  ) {
    fail(
      "toolchain_executable_missing",
      "Trusted Lean/Lake executables are absent from the exact toolchain closure.",
    );
  }
  for (const entry of toolchainTree.files) {
    if (
      (entry.relativePath === leanRelative ||
        entry.relativePath === lakeRelative) &&
      entry.identity.size <= 0
    ) {
      fail(
        "toolchain_executable_empty",
        `${entry.relativePath} is an empty executable.`,
      );
    }
  }

  await fs.mkdir(stagingRoot);
  const inputRoot = path.join(stagingRoot, "candidate-input");
  const sourceRoot = path.join(stagingRoot, "formal-source");
  const toolchainRoot = path.join(stagingRoot, "lean-toolchain");
  const stagedInput = await stageTree({
    tree: inputTree,
    destinationRoot: inputRoot,
    label: "candidate input",
  });
  const stagedSource = await stageTree({
    tree: sourceTree,
    destinationRoot: sourceRoot,
    label: "formal source",
  });
  const stagedToolchain = await stageTree({
    tree: toolchainTree,
    destinationRoot: toolchainRoot,
    label: "Lean toolchain",
  });
  const inputLedger = ledger("input", inputRoot, stagedInput);
  const sourceLedger = ledger("source", sourceRoot, stagedSource);
  const toolchainLedger = ledger("toolchain", toolchainRoot, stagedToolchain);

  const replayDriver =
    stagedSource.find(
      (entry) => sourceRole(entry.relativePath) === "replay_driver",
    ) ??
    fail("formal_source_role_mismatch", "Staged replay driver is missing.");
  await validateDriver(replayDriver);

  const sourceBindings: Nhm2ExperimentReadyTheoryFormalSourceBindingV1[] =
    stagedSource
      .map((entry) => {
        const role = sourceRole(entry.relativePath);
        if (role == null) {
          return fail(
            "formal_source_role_mismatch",
            `Unassigned source ${entry.relativePath}.`,
          );
        }
        return {
          sourceRole: role,
          path: portablePath(workspaceRoot, entry.absolutePath),
          sha256: entry.sha256,
          sizeBytes: entry.sizeBytes,
        };
      })
      .sort((left, right) => compareUtf8(left.path, right.path));
  const toolchainBindings: Nhm2ExperimentReadyTheoryFormalToolchainBindingV1[] =
    stagedToolchain
      .map((entry) => ({
        toolchainRole:
          entry.relativePath === leanRelative
            ? ("lean_executable" as const)
            : entry.relativePath === lakeRelative
              ? ("lake_executable" as const)
              : ("runtime_dependency" as const),
        path: portablePath(workspaceRoot, entry.absolutePath),
        sha256: entry.sha256,
        sizeBytes: entry.sizeBytes,
      }))
      .sort((left, right) => compareUtf8(left.path, right.path));
  const leanStaged =
    stagedToolchain.find((entry) => entry.relativePath === leanRelative) ??
    fail("toolchain_executable_missing", "Staged Lean executable is missing.");
  const lakeStaged =
    stagedToolchain.find((entry) => entry.relativePath === lakeRelative) ??
    fail("toolchain_executable_missing", "Staged Lake executable is missing.");

  const now = (input.now ?? (() => new Date()))();
  if (!Number.isFinite(now.getTime()))
    fail("timestamp_invalid", "Preseal clock is invalid.");
  const sealedAt = now.toISOString();
  if (Date.parse(sealedAt) < Date.parse(candidate.frozenAt)) {
    fail(
      "timestamp_invalid",
      "Preseal timestamp predates the frozen candidate.",
    );
  }
  const timeoutMs = input.timeoutMs ?? 5 * 60 * 1_000;
  const maxCapturedOutputBytes = input.maxCapturedOutputBytes ?? 1024 * 1024;
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs <= 0 ||
    timeoutMs > MAX_TIMEOUT_MS ||
    !Number.isSafeInteger(maxCapturedOutputBytes) ||
    maxCapturedOutputBytes <= 0 ||
    maxCapturedOutputBytes > MAX_CAPTURE_BYTES
  ) {
    fail(
      "executor_limits_invalid",
      "Formal executor time or capture limit is invalid.",
    );
  }
  const replayOne = path.join(outputRoot, "replay-one");
  const replayTwo = path.join(outputRoot, "replay-two");
  const runSpec: Nhm2ExperimentReadyTheoryFormalRunSpecV1 = {
    artifactId: NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_ARTIFACT_ID,
    contractVersion:
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_CONTRACT_VERSION,
    generatedAt: sealedAt,
    sealedAt,
    identity: {
      candidateId: candidate.bindings.candidate.candidateId,
      candidateManifestId: candidate.manifestId,
      candidateManifestSha256: candidateObservation.sha256,
      candidateFrozenAt: candidate.frozenAt,
      requestId: plan.requestId,
      runId: plan.runId,
      receiptId: plan.receiptId,
      runtimeId: plan.runtimeId,
      sourceCommitSha: plan.sourceCommitSha,
    },
    planBinding: plan,
    theoremName: NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME,
    formalSourceBindings: {
      authority: "server_owned_formal_project",
      projectRoot: sourceRoot,
      entries: sourceBindings,
    },
    toolchainBindings: {
      authority: "sealed_lean_toolchain",
      toolchainRoot,
      entries: toolchainBindings,
    },
    executor: {
      theoremName: NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME,
      executableRole: "lean",
      executables: {
        lean: {
          absolutePath: leanStaged.absolutePath,
          sha256: leanStaged.sha256,
          sizeBytes: leanStaged.sizeBytes,
        },
        lake: {
          absolutePath: lakeStaged.absolutePath,
          sha256: lakeStaged.sha256,
          sizeBytes: lakeStaged.sizeBytes,
        },
      },
      ledgers: {
        source: sourceLedger,
        toolchain: toolchainLedger,
        input: inputLedger,
      },
      outputRoot,
      replayWorkdirs: [replayOne, replayTwo],
      environmentAllowlist: [],
      environment: {},
      executableArguments: [replayDriver.absolutePath, "-o", "proof.olean"],
      expectedOutputPaths: ["proof.olean"],
      timeoutMs,
      maxCapturedOutputBytes,
    },
    outerArtifactPath: `${plan.expectedInvocation.outputDirectory}/${NHM2_EXPERIMENT_READY_THEORY_FORMAL_OUTER_FILENAME}`,
    claimBoundary: CLAIM_BOUNDARY,
  };

  await verifyLedgerTree(sourceLedger);
  await verifyLedgerTree(toolchainLedger);
  await verifyLedgerTree(inputLedger);
  const candidateAfter = await fs.lstat(candidatePath);
  if (!identitiesMatch(candidateObservation.identity, candidateAfter)) {
    fail("input_changed", "Candidate manifest changed during preseal staging.");
  }

  const specBytes = Buffer.from(JSON.stringify(runSpec), "utf8");
  const specAbsolutePath = path.join(
    stagingRoot,
    NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_FILENAME,
  );
  if (!samePath(specAbsolutePath, frozenFormalRunSpecAbsolutePath)) {
    fail(
      "formal_staging_binding_mismatch",
      "Published formal run-spec path does not match the candidate plan.",
    );
  }
  const specHandle = await fs.open(specAbsolutePath, "wx", 0o600);
  try {
    await specHandle.writeFile(specBytes);
    await specHandle.sync();
  } finally {
    await specHandle.close();
  }
  const specStat = await fs.lstat(specAbsolutePath);
  const specObserved = await hashObservedFile({
    file: {
      absolutePath: specAbsolutePath,
      relativePath: NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_FILENAME,
      identity: identity(specStat),
    },
    label: "formal run spec",
  });
  if (specObserved.sha256 !== sha256(specBytes)) {
    fail("staged_hash_mismatch", "Published formal run spec bytes changed.");
  }
  await verifyLedgerTree(sourceLedger);
  await verifyLedgerTree(toolchainLedger);

  return {
    formalRunSpecPath: portablePath(workspaceRoot, specAbsolutePath),
    formalRunSpecSha256: specObserved.sha256,
    formalRunSpecSizeBytes: specObserved.sizeBytes,
    stagingRoot: portablePath(workspaceRoot, stagingRoot),
    sourceLedger,
    toolchainLedger,
    inputLedger,
    runSpec,
    claimBoundary: CLAIM_BOUNDARY,
  };
}

export const parseNhm2ExperimentReadyTheoryFormalPresealCliArgs = (
  argv: string[],
): Omit<PresealNhm2ExperimentReadyTheoryFormalRunInput, "now"> => {
  const values: Record<string, string> = {};
  const keys: Record<string, string> = {
    "--candidate-manifest": "candidateManifestPath",
    "--staging-root": "stagingRoot",
    "--trusted-toolchain-root": "trustedToolchainRoot",
    "--trusted-lean-executable": "trustedLeanExecutablePath",
    "--trusted-lake-executable": "trustedLakeExecutablePath",
    "--trusted-formal-project-root": "trustedFormalProjectRoot",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const key = keys[argument];
    if (key == null) throw new Error(`Unknown argument: ${argument}`);
    const value = argv[++index];
    if (!isText(value)) throw new Error(`${argument} requires a value.`);
    if (values[key] != null)
      throw new Error(`${argument} may be supplied only once.`);
    values[key] = value;
  }
  for (const [argument, key] of Object.entries(keys)) {
    if (argument === "--trusted-formal-project-root") continue;
    if (!isText(values[key])) throw new Error(`${argument} is required.`);
  }
  return {
    candidateManifestPath: values.candidateManifestPath,
    stagingRoot: values.stagingRoot,
    trustedToolchainRoot: values.trustedToolchainRoot,
    trustedLeanExecutablePath: values.trustedLeanExecutablePath,
    trustedLakeExecutablePath: values.trustedLakeExecutablePath,
    ...(values.trustedFormalProjectRoot == null
      ? {}
      : { trustedFormalProjectRoot: values.trustedFormalProjectRoot }),
  };
};

async function main(): Promise<void> {
  const result = await presealNhm2ExperimentReadyTheoryFormalRun(
    parseNhm2ExperimentReadyTheoryFormalPresealCliArgs(process.argv.slice(2)),
  );
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    const code =
      error instanceof Nhm2ExperimentReadyTheoryFormalPresealError
        ? ` [${error.code}]`
        : "";
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}${code}\n`,
    );
    process.exitCode = 1;
  });
}
