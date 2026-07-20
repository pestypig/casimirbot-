/**
 * Offline administrative enrollment for an NHM2 formal Lean toolchain.
 *
 * Caller-selected paths are inspection inputs only. The emitted policy does
 * not authorize a runtime to trust those paths. Production admission must
 * separately install and select the reviewed JSON as a server-owned immutable
 * policy, then verify a run-specific sealed toolchain against it.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import {
  NHM2_FORMAL_APPROVED_LAKE_LEAN_COMMIT_PREFIX,
  NHM2_FORMAL_APPROVED_LAKE_RELEASE,
  NHM2_FORMAL_APPROVED_LAKE_VERSION_OUTPUT,
  NHM2_FORMAL_APPROVED_LEAN_COMMIT_SHA,
  NHM2_FORMAL_APPROVED_LEAN_RELEASE,
  NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE,
  NHM2_FORMAL_APPROVED_TOOLCHAIN_BLOCKERS,
  NHM2_FORMAL_APPROVED_TOOLCHAIN_CLAIM_BOUNDARY,
  NHM2_FORMAL_APPROVED_TOOLCHAIN_LEDGER_ALGORITHM,
  NHM2_FORMAL_APPROVED_TOOLCHAIN_LEDGER_DOMAIN,
  NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID,
  NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_AUTHORITY,
  NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION,
  NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS,
  NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_STATUS,
  NHM2_FORMAL_APPROVED_TOOLCHAIN_TARGETS,
  Nhm2FormalApprovedToolchainPolicyContractError,
  assertNhm2FormalApprovedToolchainPolicy,
  compareNhm2FormalApprovedToolchainUtf8,
  computeNhm2FormalApprovedToolchainLedgerSha256,
  computeNhm2FormalApprovedToolchainPolicySemanticSha256,
  isNhm2FormalApprovedToolchainPortableRelativePath,
  type Nhm2FormalApprovedToolchainExecutableV1,
  type Nhm2FormalApprovedToolchainLedgerEntryV1,
  type Nhm2FormalApprovedToolchainPolicySemanticV1,
  type Nhm2FormalApprovedToolchainPolicyV1,
  type Nhm2FormalApprovedToolchainTargetV1,
} from "../../shared/contracts/nhm2-formal-approved-toolchain-policy.v1";

export const NHM2_FORMAL_TOOLCHAIN_ENROLLMENT_AUTHORITY_NOTICE =
  "Caller-selected toolchain paths are administrative enrollment inputs only; runtime admission must consume a separately configured server-owned immutable policy and verify a run-specific sealed toolchain against it." as const;

export const NHM2_FORMAL_TOOLCHAIN_ENROLLMENT_SCAN_LIMITS = Object.freeze({
  maxLedgerEntryCount:
    NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxLedgerEntryCount,
  maxLedgerEntryBytes:
    NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxLedgerEntryBytes,
  maxLedgerAggregateBytes:
    NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxLedgerAggregateBytes,
  maxRelativePathDepth:
    NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxRelativePathDepth,
  maxRelativePathUtf8Bytes:
    NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxRelativePathUtf8Bytes,
});

export type Nhm2FormalToolchainEnrollmentScanLimitsV1 =
  typeof NHM2_FORMAL_TOOLCHAIN_ENROLLMENT_SCAN_LIMITS;

export type EnrollNhm2FormalApprovedToolchainPolicyInput = {
  policyId: string;
  trustedToolchainRoot: string;
  trustedLeanExecutablePath: string;
  trustedLakeExecutablePath: string;
  outputPolicyPath: string;
  workspaceRoot?: string;
  now?: () => Date;
  /** May only tighten, never loosen, the fixed contract resource ceilings. */
  scanLimits?: Partial<Nhm2FormalToolchainEnrollmentScanLimitsV1>;
};

export type EnrollNhm2FormalApprovedToolchainPolicyResult = {
  policyPath: string;
  policySha256: string;
  policySizeBytes: number;
  policy: Nhm2FormalApprovedToolchainPolicyV1;
  authorityNotice: typeof NHM2_FORMAL_TOOLCHAIN_ENROLLMENT_AUTHORITY_NOTICE;
};

export class Nhm2FormalToolchainEnrollmentError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "Nhm2FormalToolchainEnrollmentError";
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

type DirectoryObservation = {
  absolutePath: string;
  relativePath: string;
  identity: FileIdentity;
};

type FileObservation = {
  absolutePath: string;
  relativePath: string;
  identity: FileIdentity;
  sha256: string;
  sizeBytes: number;
};

type ToolchainSnapshot = {
  rootPath: string;
  directories: DirectoryObservation[];
  files: FileObservation[];
  ledgerEntries: Nhm2FormalApprovedToolchainLedgerEntryV1[];
  aggregateBytes: number;
  aggregateSha256: string;
};

const VERSION_TIMEOUT_MS = 30_000;
const VERSION_MAX_CAPTURE_BYTES = 64 * 1024;
const HASH_BUFFER_BYTES = 1024 * 1024;
const POLICY_ID = /^[a-z0-9][a-z0-9._-]*$/;
const LIMIT_KEYS = Object.freeze([
  "maxLedgerEntryCount",
  "maxLedgerEntryBytes",
  "maxLedgerAggregateBytes",
  "maxRelativePathDepth",
  "maxRelativePathUtf8Bytes",
] as const);

const fail = (code: string, message: string): never => {
  throw new Nhm2FormalToolchainEnrollmentError(code, message);
};

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.trim() === value;

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
  expected: FileIdentity,
  actual: Awaited<ReturnType<typeof fs.lstat>>,
): boolean => isDeepStrictEqual(expected, identity(actual));

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

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

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

const resolveScanLimits = (
  supplied: Partial<Nhm2FormalToolchainEnrollmentScanLimitsV1> = {},
): Nhm2FormalToolchainEnrollmentScanLimitsV1 => {
  const suppliedKeys = Object.keys(supplied);
  if (
    suppliedKeys.some(
      (key) => !LIMIT_KEYS.includes(key as (typeof LIMIT_KEYS)[number]),
    )
  ) {
    fail("resource_limits_invalid", "Unknown scan resource limit supplied.");
  }
  const limits = {
    ...NHM2_FORMAL_TOOLCHAIN_ENROLLMENT_SCAN_LIMITS,
    ...supplied,
  };
  for (const key of LIMIT_KEYS) {
    const value = limits[key];
    const hard = NHM2_FORMAL_TOOLCHAIN_ENROLLMENT_SCAN_LIMITS[key];
    if (!Number.isSafeInteger(value) || value <= 0 || value > hard) {
      fail(
        "resource_limits_invalid",
        `${key} must be a positive safe integer no greater than ${hard}.`,
      );
    }
  }
  return limits;
};

const requirePortablePath = (
  relativePath: string,
  limits: Nhm2FormalToolchainEnrollmentScanLimitsV1,
): void => {
  if (
    !isNhm2FormalApprovedToolchainPortableRelativePath(relativePath) ||
    Buffer.byteLength(relativePath, "utf8") > limits.maxRelativePathUtf8Bytes ||
    relativePath.split("/").length > limits.maxRelativePathDepth
  ) {
    fail(
      "toolchain_relative_path_invalid",
      `Toolchain relative path is not portable or exceeds policy limits: ${relativePath}.`,
    );
  }
};

async function hashObservedRegularFile(input: {
  absolutePath: string;
  relativePath: string;
  expectedIdentity: FileIdentity;
  collectBytes?: boolean;
}): Promise<{ sha256: string; sizeBytes: number; bytes?: Buffer }> {
  const noFollow =
    process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    handle = await fs.open(input.absolutePath, fsConstants.O_RDONLY | noFollow);
    const opened = await handle.stat();
    if (
      !identitiesMatch(input.expectedIdentity, opened) ||
      !opened.isFile() ||
      opened.isSymbolicLink() ||
      opened.nlink !== 1
    ) {
      fail(
        "toolchain_changed",
        `${input.relativePath} changed or became aliased while opening.`,
      );
    }
    const digest = createHash("sha256");
    const chunks: Buffer[] = [];
    const buffer = Buffer.allocUnsafe(HASH_BUFFER_BYTES);
    let position = 0;
    while (position < input.expectedIdentity.size) {
      const requested = Math.min(
        buffer.byteLength,
        input.expectedIdentity.size - position,
      );
      const { bytesRead } = await handle.read(buffer, 0, requested, position);
      if (bytesRead <= 0) {
        fail(
          "toolchain_changed",
          `${input.relativePath} ended before its observed size.`,
        );
      }
      const chunk = buffer.subarray(0, bytesRead);
      digest.update(chunk);
      if (input.collectBytes) chunks.push(Buffer.from(chunk));
      position += bytesRead;
    }
    const after = await fs.lstat(input.absolutePath);
    if (!identitiesMatch(input.expectedIdentity, after)) {
      fail(
        "toolchain_changed",
        `${input.relativePath} changed while it was being hashed.`,
      );
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

async function scanToolchainTree(
  rootPath: string,
  limits: Nhm2FormalToolchainEnrollmentScanLimitsV1,
): Promise<ToolchainSnapshot> {
  await assertExistingPathChainSafe(rootPath, "trusted toolchain root");
  const rootStat = await fs.lstat(rootPath);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    fail(
      "regular_directory_required",
      "Trusted toolchain root must be a regular non-aliased directory.",
    );
  }
  const rootRealPath = await fs.realpath(rootPath);
  if (!samePath(rootRealPath, rootPath)) {
    fail(
      "symlink_or_reparse_forbidden",
      "Trusted toolchain root resolves through a symbolic link or reparse point.",
    );
  }

  const directories: DirectoryObservation[] = [
    {
      absolutePath: rootPath,
      relativePath: "",
      identity: identity(rootStat),
    },
  ];
  const files: FileObservation[] = [];
  const aliases = new Set<string>();
  let visitedNodeCount = 0;
  let aggregateBytes = 0;

  const visit = async (
    absoluteDirectory: string,
    relativeDirectory: string,
    expectedDirectoryIdentity: FileIdentity,
  ): Promise<void> => {
    const entries = await fs.readdir(absoluteDirectory, {
      encoding: "utf8",
      withFileTypes: true,
    });
    entries.sort((left, right) =>
      compareNhm2FormalApprovedToolchainUtf8(left.name, right.name),
    );
    for (const entry of entries) {
      visitedNodeCount += 1;
      if (visitedNodeCount > limits.maxLedgerEntryCount) {
        fail(
          "resource_limit_exceeded",
          `Toolchain traversal exceeds maxLedgerEntryCount=${limits.maxLedgerEntryCount}.`,
        );
      }
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      requirePortablePath(relativePath, limits);
      const aliasKey = relativePath.toLowerCase();
      if (aliases.has(aliasKey)) {
        fail(
          "toolchain_path_alias",
          `Toolchain contains a case-insensitive path alias: ${relativePath}.`,
        );
      }
      aliases.add(aliasKey);

      const absolutePath = path.join(absoluteDirectory, entry.name);
      const stat = await fs.lstat(absolutePath);
      if (entry.isSymbolicLink() || stat.isSymbolicLink()) {
        fail(
          "symlink_or_reparse_forbidden",
          `Toolchain contains a symbolic link or reparse point: ${relativePath}.`,
        );
      }
      const real = await fs.realpath(absolutePath);
      if (!samePath(real, absolutePath)) {
        fail(
          "symlink_or_reparse_forbidden",
          `Toolchain entry resolves through a symbolic link or reparse point: ${relativePath}.`,
        );
      }
      if (entry.isDirectory() && stat.isDirectory()) {
        const observedDirectory = {
          absolutePath,
          relativePath,
          identity: identity(stat),
        };
        directories.push(observedDirectory);
        await visit(absolutePath, relativePath, observedDirectory.identity);
        continue;
      }
      if (!entry.isFile() || !stat.isFile()) {
        fail(
          "special_file_forbidden",
          `Toolchain contains a non-regular entry: ${relativePath}.`,
        );
      }
      if (stat.nlink !== 1) {
        fail(
          "hardlink_forbidden",
          `Toolchain file has nlink=${stat.nlink}: ${relativePath}.`,
        );
      }
      const sizeBytes = Number(stat.size);
      if (
        !Number.isSafeInteger(sizeBytes) ||
        sizeBytes < 0 ||
        sizeBytes > limits.maxLedgerEntryBytes
      ) {
        fail(
          "resource_limit_exceeded",
          `${relativePath} exceeds maxLedgerEntryBytes=${limits.maxLedgerEntryBytes}.`,
        );
      }
      aggregateBytes += sizeBytes;
      if (
        !Number.isSafeInteger(aggregateBytes) ||
        aggregateBytes > limits.maxLedgerAggregateBytes
      ) {
        fail(
          "resource_limit_exceeded",
          `Toolchain exceeds maxLedgerAggregateBytes=${limits.maxLedgerAggregateBytes}.`,
        );
      }
      const expectedIdentity = identity(stat);
      const hashed = await hashObservedRegularFile({
        absolutePath,
        relativePath,
        expectedIdentity,
      });
      files.push({
        absolutePath,
        relativePath,
        identity: expectedIdentity,
        sha256: hashed.sha256,
        sizeBytes: hashed.sizeBytes,
      });
    }
    const directoryAfter = await fs.lstat(absoluteDirectory);
    if (
      !directoryAfter.isDirectory() ||
      directoryAfter.isSymbolicLink() ||
      !identitiesMatch(expectedDirectoryIdentity, directoryAfter)
    ) {
      fail(
        "toolchain_changed",
        `${relativeDirectory || "."} changed while the toolchain was scanned.`,
      );
    }
  };

  await visit(rootPath, "", identity(rootStat));
  files.sort((left, right) =>
    compareNhm2FormalApprovedToolchainUtf8(
      left.relativePath,
      right.relativePath,
    ),
  );
  directories.sort((left, right) =>
    compareNhm2FormalApprovedToolchainUtf8(
      left.relativePath,
      right.relativePath,
    ),
  );
  if (files.length > limits.maxLedgerEntryCount) {
    fail(
      "resource_limit_exceeded",
      `Toolchain exceeds maxLedgerEntryCount=${limits.maxLedgerEntryCount}.`,
    );
  }
  const ledgerEntries = files.map(({ relativePath, sha256, sizeBytes }) => ({
    relativePath,
    sha256,
    sizeBytes,
  }));
  const relativePaths = ledgerEntries.map((entry) => entry.relativePath);
  if (
    relativePaths.some(
      (relativePath, index) =>
        index > 0 &&
        compareNhm2FormalApprovedToolchainUtf8(
          relativePaths[index - 1],
          relativePath,
        ) >= 0,
    ) ||
    new Set(relativePaths.map((relativePath) => relativePath.toLowerCase()))
      .size !== relativePaths.length
  ) {
    fail(
      "toolchain_path_alias",
      "Toolchain ledger paths are not exact UTF-8 sorted, unique, and case-alias-free.",
    );
  }
  return {
    rootPath,
    directories,
    files,
    ledgerEntries,
    aggregateBytes,
    aggregateSha256:
      computeNhm2FormalApprovedToolchainLedgerSha256(ledgerEntries),
  };
}

const exactSnapshotCommitment = (snapshot: ToolchainSnapshot): unknown => ({
  rootPath: normalizedPath(snapshot.rootPath),
  directories: snapshot.directories.map((entry) => ({
    relativePath: entry.relativePath,
    identity: entry.identity,
  })),
  files: snapshot.files.map((entry) => ({
    relativePath: entry.relativePath,
    identity: entry.identity,
    sha256: entry.sha256,
    sizeBytes: entry.sizeBytes,
  })),
  ledgerEntries: snapshot.ledgerEntries,
  aggregateBytes: snapshot.aggregateBytes,
  aggregateSha256: snapshot.aggregateSha256,
});

const assertSnapshotsExact = (
  before: ToolchainSnapshot,
  after: ToolchainSnapshot,
): void => {
  if (
    !isDeepStrictEqual(
      exactSnapshotCommitment(before),
      exactSnapshotCommitment(after),
    )
  ) {
    fail(
      "toolchain_changed",
      "Trusted toolchain inventory or bytes changed during enrollment.",
    );
  }
};

const bindExecutable = (
  snapshot: ToolchainSnapshot,
  absolutePath: string,
  role: "Lean" | "Lake",
): FileObservation => {
  if (!isInside(snapshot.rootPath, absolutePath)) {
    fail(
      "toolchain_executable_outside_root",
      `${role} executable is outside the trusted toolchain root.`,
    );
  }
  const matches = snapshot.files.filter((entry) =>
    samePath(entry.absolutePath, absolutePath),
  );
  if (matches.length !== 1) {
    fail(
      "toolchain_executable_missing",
      `${role} executable is not exactly one regular file in the toolchain ledger.`,
    );
  }
  const executable = matches[0];
  if (executable.sizeBytes <= 0) {
    fail("toolchain_executable_empty", `${role} executable must not be empty.`);
  }
  return executable;
};

async function recheckObservedFile(
  file: FileObservation,
  label: string,
): Promise<void> {
  await assertExistingPathChainSafe(file.absolutePath, label);
  const observed = await hashObservedRegularFile({
    absolutePath: file.absolutePath,
    relativePath: label,
    expectedIdentity: file.identity,
  });
  if (
    observed.sha256 !== file.sha256 ||
    observed.sizeBytes !== file.sizeBytes
  ) {
    fail("toolchain_changed", `${label} bytes changed during enrollment.`);
  }
}

const exactVersionStdout = (expected: string, actual: string): boolean =>
  actual === expected ||
  actual === `${expected}\n` ||
  actual === `${expected}\r\n`;

async function executeExactVersion(input: {
  role: "Lean" | "Lake";
  executable: FileObservation;
  toolchainRoot: string;
  expectedOutput: string;
}): Promise<void> {
  await recheckObservedFile(input.executable, `${input.role} executable`);
  const result = spawnSync(input.executable.absolutePath, ["--version"], {
    cwd: input.toolchainRoot,
    env: {},
    encoding: "utf8",
    shell: false,
    windowsHide: true,
    timeout: VERSION_TIMEOUT_MS,
    maxBuffer: VERSION_MAX_CAPTURE_BYTES,
  });
  await recheckObservedFile(input.executable, `${input.role} executable`);
  if (result.error != null || result.status !== 0 || result.signal != null) {
    fail(
      "toolchain_version_execution_failed",
      `${input.role} --version did not exit successfully under the empty approved environment.`,
    );
  }
  if (
    typeof result.stdout !== "string" ||
    typeof result.stderr !== "string" ||
    result.stderr !== "" ||
    !exactVersionStdout(input.expectedOutput, result.stdout)
  ) {
    fail(
      `${input.role.toLowerCase()}_version_mismatch`,
      `${input.role} --version output does not match the fixed approved release, commit, and target.`,
    );
  }
}

async function observeFormalProjectToolchainFile(
  workspaceRoot: string,
): Promise<FileObservation> {
  const absolutePath = path.resolve(
    workspaceRoot,
    ...NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE.path.split("/"),
  );
  if (!isInside(workspaceRoot, absolutePath)) {
    fail(
      "formal_lean_toolchain_file_invalid",
      "Frozen formal/lean/lean-toolchain path escapes the workspace.",
    );
  }
  await assertExistingPathChainSafe(
    absolutePath,
    "repository formal Lean toolchain file",
  );
  const stat = await fs.lstat(absolutePath);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) {
    fail(
      "formal_lean_toolchain_file_invalid",
      "Repository formal/lean/lean-toolchain must be one regular non-aliased file.",
    );
  }
  const expectedIdentity = identity(stat);
  const observed = await hashObservedRegularFile({
    absolutePath,
    relativePath: NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE.path,
    expectedIdentity,
    collectBytes: true,
  });
  const expectedBytes = Buffer.from(
    `${NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE.exactUtf8Line}\n`,
    "utf8",
  );
  if (
    observed.sizeBytes !== NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE.sizeBytes ||
    observed.sha256 !== NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE.sha256 ||
    observed.bytes == null ||
    !observed.bytes.equals(expectedBytes)
  ) {
    fail(
      "formal_lean_toolchain_file_mismatch",
      "Repository formal/lean/lean-toolchain bytes do not match the fixed 4.31.0 contract.",
    );
  }
  return {
    absolutePath,
    relativePath: NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE.path,
    identity: expectedIdentity,
    sha256: observed.sha256,
    sizeBytes: observed.sizeBytes,
  };
}

const targetForHost = (): Nhm2FormalApprovedToolchainTargetV1 =>
  NHM2_FORMAL_APPROVED_TOOLCHAIN_TARGETS.find(
    (target) =>
      target.platform === process.platform &&
      target.architecture === process.arch,
  ) ??
  fail(
    "unsupported_toolchain_target",
    `No approved NHM2 formal toolchain target exists for ${process.platform}/${process.arch}.`,
  );

const executablePolicyBinding = (
  observation: FileObservation,
): Nhm2FormalApprovedToolchainExecutableV1 => ({
  relativePath: observation.relativePath,
  sha256: observation.sha256,
  sizeBytes: observation.sizeBytes,
});

const buildPolicy = (input: {
  policyId: string;
  approvedAt: string;
  target: Nhm2FormalApprovedToolchainTargetV1;
  snapshot: ToolchainSnapshot;
  lean: FileObservation;
  lake: FileObservation;
}): Nhm2FormalApprovedToolchainPolicyV1 => {
  const leanVersionOutput =
    `Lean (version ${NHM2_FORMAL_APPROVED_LEAN_RELEASE}, ${input.target.leanTargetTriple}, ` +
    `commit ${NHM2_FORMAL_APPROVED_LEAN_COMMIT_SHA}, Release)`;
  const semantic: Nhm2FormalApprovedToolchainPolicySemanticV1 = {
    artifactId: NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID,
    contractVersion: NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION,
    policyId: input.policyId,
    approvedAt: input.approvedAt,
    authority: NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_AUTHORITY,
    status: NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_STATUS,
    target: { ...input.target },
    releases: {
      lean: {
        release: NHM2_FORMAL_APPROVED_LEAN_RELEASE,
        commitSha: NHM2_FORMAL_APPROVED_LEAN_COMMIT_SHA,
        buildProfile: "Release",
        exactVersionOutput: leanVersionOutput,
      },
      lake: {
        release: NHM2_FORMAL_APPROVED_LAKE_RELEASE,
        leanReleaseBinding: NHM2_FORMAL_APPROVED_LEAN_RELEASE,
        leanCommitShaBinding: NHM2_FORMAL_APPROVED_LEAN_COMMIT_SHA,
        leanCommitPrefixBinding: NHM2_FORMAL_APPROVED_LAKE_LEAN_COMMIT_PREFIX,
        exactVersionOutput: NHM2_FORMAL_APPROVED_LAKE_VERSION_OUTPUT,
      },
    },
    formalProjectToolchainFile: {
      ...NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE,
    },
    toolchainLedger: {
      rootIndependent: true,
      algorithm: NHM2_FORMAL_APPROVED_TOOLCHAIN_LEDGER_ALGORITHM,
      domain: NHM2_FORMAL_APPROVED_TOOLCHAIN_LEDGER_DOMAIN,
      kind: "toolchain",
      entries: input.snapshot.ledgerEntries.map((entry) => ({ ...entry })),
      aggregateSha256: input.snapshot.aggregateSha256,
      entryCount: input.snapshot.ledgerEntries.length,
      aggregateBytes: input.snapshot.aggregateBytes,
    },
    executables: {
      lean: executablePolicyBinding(input.lean),
      lake: executablePolicyBinding(input.lake),
    },
    approvedEnvironment: {
      allowlist: [],
      values: [],
    },
    blockers: [...NHM2_FORMAL_APPROVED_TOOLCHAIN_BLOCKERS],
    claimBoundary: { ...NHM2_FORMAL_APPROVED_TOOLCHAIN_CLAIM_BOUNDARY },
  };
  const policy: Nhm2FormalApprovedToolchainPolicyV1 = {
    artifactId: semantic.artifactId,
    contractVersion: semantic.contractVersion,
    policyId: semantic.policyId,
    semanticSha256:
      computeNhm2FormalApprovedToolchainPolicySemanticSha256(semantic),
    approvedAt: semantic.approvedAt,
    authority: semantic.authority,
    status: semantic.status,
    target: semantic.target,
    releases: semantic.releases,
    formalProjectToolchainFile: semantic.formalProjectToolchainFile,
    toolchainLedger: semantic.toolchainLedger,
    executables: semantic.executables,
    approvedEnvironment: semantic.approvedEnvironment,
    blockers: semantic.blockers,
    claimBoundary: semantic.claimBoundary,
  };
  try {
    assertNhm2FormalApprovedToolchainPolicy(policy);
  } catch (error) {
    if (error instanceof Nhm2FormalApprovedToolchainPolicyContractError) {
      fail(error.code, error.message);
    }
    throw error;
  }
  return policy;
};

const prettyCanonicalPolicyBytes = (
  policy: Nhm2FormalApprovedToolchainPolicyV1,
): Buffer => Buffer.from(`${JSON.stringify(policy, null, 2)}\n`, "utf8");

async function assertOutputParentStable(input: {
  parentPath: string;
  expectedIdentity: FileIdentity;
}): Promise<void> {
  const stat = await fs.lstat(input.parentPath);
  const real = await fs.realpath(input.parentPath);
  const sameDirectoryObject =
    String(stat.dev) === input.expectedIdentity.dev &&
    String(stat.ino) === input.expectedIdentity.ino &&
    Number(stat.mode) === input.expectedIdentity.mode &&
    Number(stat.nlink) === input.expectedIdentity.nlink;
  if (
    stat.isSymbolicLink() ||
    !stat.isDirectory() ||
    !sameDirectoryObject ||
    !samePath(real, input.parentPath)
  ) {
    fail(
      "output_parent_changed",
      "Output parent changed or became aliased during enrollment.",
    );
  }
}

async function assertPolicyOutputAvailable(outputPath: string): Promise<void> {
  const parentPath = path.dirname(outputPath);
  await assertExistingPathChainSafe(parentPath, "policy output parent");
  const parentStat = await fs.lstat(parentPath);
  if (parentStat.isSymbolicLink() || !parentStat.isDirectory()) {
    fail(
      "regular_directory_required",
      "Policy output parent must be a regular non-aliased directory.",
    );
  }
  await fs.lstat(outputPath).then(
    () => fail("output_exists", "Policy output already exists."),
    (error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    },
  );
}

async function publishPolicyNoOverwrite(input: {
  outputPath: string;
  bytes: Buffer;
  beforePublish: () => Promise<void>;
}): Promise<{ sha256: string; sizeBytes: number }> {
  const parentPath = path.dirname(input.outputPath);
  await assertPolicyOutputAvailable(input.outputPath);
  const parentStat = await fs.lstat(parentPath);
  const parentIdentity = identity(parentStat);
  await input.beforePublish();
  await assertOutputParentStable({
    parentPath,
    expectedIdentity: parentIdentity,
  });

  const noFollow =
    process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  let createdIdentity: FileIdentity | null = null;
  try {
    handle = await fs
      .open(
        input.outputPath,
        fsConstants.O_WRONLY |
          fsConstants.O_CREAT |
          fsConstants.O_EXCL |
          noFollow,
        0o600,
      )
      .catch((error: NodeJS.ErrnoException) => {
        if (error.code === "EEXIST") {
          fail("output_exists", "Policy output already exists.");
        }
        throw error;
      });
    const opened = await handle.stat();
    if (!opened.isFile() || opened.isSymbolicLink() || opened.nlink !== 1) {
      fail(
        "output_publish_failed",
        "Policy output did not open as a new regular file.",
      );
    }
    createdIdentity = identity(opened);
    await handle.writeFile(input.bytes);
    await handle.sync();
    const written = await handle.stat();
    if (
      !identitiesMatch(createdIdentity, written) &&
      (written.dev !== opened.dev ||
        written.ino !== opened.ino ||
        written.mode !== opened.mode ||
        written.nlink !== opened.nlink)
    ) {
      fail(
        "output_publish_failed",
        "Policy output identity changed while writing.",
      );
    }
    if (Number(written.size) !== input.bytes.byteLength) {
      fail("output_publish_failed", "Policy output size is incomplete.");
    }
    createdIdentity = identity(written);
    await handle.close();
    handle = null;
    await assertOutputParentStable({
      parentPath,
      expectedIdentity: parentIdentity,
    });
    const finalStat = await fs.lstat(input.outputPath);
    if (
      !identitiesMatch(createdIdentity, finalStat) ||
      finalStat.isSymbolicLink() ||
      !finalStat.isFile() ||
      finalStat.nlink !== 1
    ) {
      fail(
        "output_publish_failed",
        "Published policy file is unsafe or changed.",
      );
    }
    const observed = await hashObservedRegularFile({
      absolutePath: input.outputPath,
      relativePath: "published approved toolchain policy",
      expectedIdentity: createdIdentity,
      collectBytes: true,
    });
    if (
      observed.bytes == null ||
      !observed.bytes.equals(input.bytes) ||
      observed.sha256 !== sha256(input.bytes)
    ) {
      fail(
        "output_publish_failed",
        "Published policy bytes changed after writing.",
      );
    }
    return { sha256: observed.sha256, sizeBytes: observed.sizeBytes };
  } catch (error) {
    await handle?.close().catch(() => undefined);
    if (createdIdentity != null) {
      const current = await fs.lstat(input.outputPath).catch(() => null);
      if (current != null && identitiesMatch(createdIdentity, current)) {
        await fs.unlink(input.outputPath).catch(() => undefined);
      }
    }
    throw error;
  }
}

export async function enrollNhm2FormalApprovedToolchainPolicy(
  input: EnrollNhm2FormalApprovedToolchainPolicyInput,
): Promise<EnrollNhm2FormalApprovedToolchainPolicyResult> {
  const workspaceRoot = requireAbsoluteLocalPath(
    input.workspaceRoot ?? process.cwd(),
    "workspace root",
  );
  const trustedToolchainRoot = requireAbsoluteLocalPath(
    input.trustedToolchainRoot,
    "trusted toolchain root",
  );
  const trustedLeanExecutablePath = requireAbsoluteLocalPath(
    input.trustedLeanExecutablePath,
    "trusted Lean executable",
  );
  const trustedLakeExecutablePath = requireAbsoluteLocalPath(
    input.trustedLakeExecutablePath,
    "trusted Lake executable",
  );
  const outputPolicyPath = requireAbsoluteLocalPath(
    input.outputPolicyPath,
    "output policy",
  );
  if (
    !isText(input.policyId) ||
    !POLICY_ID.test(input.policyId) ||
    Buffer.byteLength(input.policyId, "utf8") >
      NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxPolicyIdUtf8Bytes
  ) {
    fail(
      "policy_id_invalid",
      "Policy id must match the bounded lowercase approved-policy identifier syntax.",
    );
  }
  if (samePath(trustedLeanExecutablePath, trustedLakeExecutablePath)) {
    fail(
      "toolchain_executable_alias",
      "Lean and Lake enrollment paths must identify distinct files.",
    );
  }
  if (
    samePath(outputPolicyPath, trustedToolchainRoot) ||
    isInside(trustedToolchainRoot, outputPolicyPath)
  ) {
    fail(
      "output_overlaps_toolchain",
      "Policy output must be outside the toolchain being enrolled.",
    );
  }
  await assertPolicyOutputAvailable(outputPolicyPath);
  await assertExistingPathChainSafe(workspaceRoot, "workspace root");
  const workspaceStat = await fs.lstat(workspaceRoot);
  if (workspaceStat.isSymbolicLink() || !workspaceStat.isDirectory()) {
    fail(
      "regular_directory_required",
      "Workspace root must be a regular non-aliased directory.",
    );
  }

  const limits = resolveScanLimits(input.scanLimits);
  const formalProjectToolchainFile =
    await observeFormalProjectToolchainFile(workspaceRoot);
  const firstSnapshot = await scanToolchainTree(trustedToolchainRoot, limits);
  const lean = bindExecutable(firstSnapshot, trustedLeanExecutablePath, "Lean");
  const lake = bindExecutable(firstSnapshot, trustedLakeExecutablePath, "Lake");
  if (lean.relativePath.toLowerCase() === lake.relativePath.toLowerCase()) {
    fail(
      "toolchain_executable_alias",
      "Lean and Lake executable bindings alias the same ledger path.",
    );
  }
  const target = targetForHost();
  const expectedLeanVersion =
    `Lean (version ${NHM2_FORMAL_APPROVED_LEAN_RELEASE}, ${target.leanTargetTriple}, ` +
    `commit ${NHM2_FORMAL_APPROVED_LEAN_COMMIT_SHA}, Release)`;
  await executeExactVersion({
    role: "Lean",
    executable: lean,
    toolchainRoot: trustedToolchainRoot,
    expectedOutput: expectedLeanVersion,
  });
  await executeExactVersion({
    role: "Lake",
    executable: lake,
    toolchainRoot: trustedToolchainRoot,
    expectedOutput: NHM2_FORMAL_APPROVED_LAKE_VERSION_OUTPUT,
  });
  const secondSnapshot = await scanToolchainTree(trustedToolchainRoot, limits);
  assertSnapshotsExact(firstSnapshot, secondSnapshot);
  await recheckObservedFile(
    formalProjectToolchainFile,
    "repository formal/lean/lean-toolchain",
  );

  const now = (input.now ?? (() => new Date()))();
  if (!Number.isFinite(now.getTime())) {
    fail("approved_at_invalid", "Enrollment clock returned an invalid date.");
  }
  const policy = buildPolicy({
    policyId: input.policyId,
    approvedAt: now.toISOString(),
    target,
    snapshot: secondSnapshot,
    lean:
      secondSnapshot.files.find(
        (entry) => entry.relativePath === lean.relativePath,
      ) ?? fail("toolchain_changed", "Lean ledger binding disappeared."),
    lake:
      secondSnapshot.files.find(
        (entry) => entry.relativePath === lake.relativePath,
      ) ?? fail("toolchain_changed", "Lake ledger binding disappeared."),
  });
  const bytes = prettyCanonicalPolicyBytes(policy);
  const reparsed: unknown = JSON.parse(bytes.toString("utf8"));
  try {
    assertNhm2FormalApprovedToolchainPolicy(reparsed);
  } catch (error) {
    if (error instanceof Nhm2FormalApprovedToolchainPolicyContractError) {
      fail(error.code, error.message);
    }
    throw error;
  }
  if (
    !isDeepStrictEqual(reparsed, policy) ||
    !bytes.equals(prettyCanonicalPolicyBytes(reparsed))
  ) {
    fail(
      "policy_canonicalization_failed",
      "Approved toolchain policy did not survive exact pretty-canonical replay.",
    );
  }

  const published = await publishPolicyNoOverwrite({
    outputPath: outputPolicyPath,
    bytes,
    beforePublish: async () => {
      const finalSnapshot = await scanToolchainTree(
        trustedToolchainRoot,
        limits,
      );
      assertSnapshotsExact(secondSnapshot, finalSnapshot);
      await recheckObservedFile(
        formalProjectToolchainFile,
        "repository formal/lean/lean-toolchain",
      );
    },
  });
  return {
    policyPath: outputPolicyPath,
    policySha256: published.sha256,
    policySizeBytes: published.sizeBytes,
    policy,
    authorityNotice: NHM2_FORMAL_TOOLCHAIN_ENROLLMENT_AUTHORITY_NOTICE,
  };
}

export const parseNhm2FormalToolchainEnrollmentCliArgs = (
  argv: string[],
): Omit<EnrollNhm2FormalApprovedToolchainPolicyInput, "now" | "scanLimits"> => {
  const keys = {
    "--policy-id": "policyId",
    "--trusted-toolchain-root": "trustedToolchainRoot",
    "--trusted-lean-executable": "trustedLeanExecutablePath",
    "--trusted-lake-executable": "trustedLakeExecutablePath",
    "--output-policy": "outputPolicyPath",
    "--workspace-root": "workspaceRoot",
  } as const;
  const values: Partial<Record<(typeof keys)[keyof typeof keys], string>> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] as keyof typeof keys;
    const key = keys[argument];
    if (key == null) throw new Error(`Unknown argument: ${argv[index]}`);
    const value = argv[++index];
    if (!isText(value)) throw new Error(`${argument} requires a value.`);
    if (values[key] != null) {
      throw new Error(`${argument} may be supplied only once.`);
    }
    values[key] = value;
  }
  for (const [argument, key] of Object.entries(keys)) {
    if (key === "workspaceRoot") continue;
    if (!isText(values[key])) throw new Error(`${argument} is required.`);
  }
  return {
    policyId: values.policyId as string,
    trustedToolchainRoot: values.trustedToolchainRoot as string,
    trustedLeanExecutablePath: values.trustedLeanExecutablePath as string,
    trustedLakeExecutablePath: values.trustedLakeExecutablePath as string,
    outputPolicyPath: values.outputPolicyPath as string,
    ...(values.workspaceRoot == null
      ? {}
      : { workspaceRoot: values.workspaceRoot }),
  };
};

async function main(): Promise<void> {
  const result = await enrollNhm2FormalApprovedToolchainPolicy(
    parseNhm2FormalToolchainEnrollmentCliArgs(process.argv.slice(2)),
  );
  process.stdout.write(
    `${JSON.stringify(
      {
        status: "administrative_toolchain_policy_enrolled",
        policyPath: result.policyPath,
        policySha256: result.policySha256,
        policySizeBytes: result.policySizeBytes,
        policyId: result.policy.policyId,
        policySemanticSha256: result.policy.semanticSha256,
        authorityNotice: result.authorityNotice,
      },
      null,
      2,
    )}\n`,
  );
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    const code =
      error instanceof Nhm2FormalToolchainEnrollmentError
        ? ` [${error.code}]`
        : "";
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}${code}\n`,
    );
    process.exitCode = 1;
  });
}
