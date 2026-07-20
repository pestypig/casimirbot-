import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME =
  "nhm2_pre_experimental_claim_locks" as const;
export const NHM2_FORMAL_KERNEL_THEOREM_TRANSCRIPT_MARKER =
  `NHM2_FORMAL_THEOREM ${NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME} PROVED` as const;
export const NHM2_FORMAL_KERNEL_AXIOM_TRANSCRIPT_MARKER =
  `'${NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME}' does not depend on any axioms` as const;

export const NHM2_FORMAL_KERNEL_EXECUTION_OBSERVATION_CONTRACT_VERSION =
  "nhm2_formal_kernel_execution_observation/v1" as const;

export type Nhm2FormalKernelLedgerKind = "source" | "toolchain" | "input";
export type Nhm2FormalKernelExecutableRoleV1 = "lean" | "lake";

export type Nhm2FormalKernelLedgerEntryV1 = {
  relativePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2FormalKernelSealedLedgerV1 = {
  kind: Nhm2FormalKernelLedgerKind;
  rootPath: string;
  entries: Nhm2FormalKernelLedgerEntryV1[];
  ledgerSha256: string;
};

export type Nhm2FormalKernelExecutableBindingV1 = {
  absolutePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2FormalKernelPresealedRunSpecV1 = {
  theoremName: typeof NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME;
  executableRole: Nhm2FormalKernelExecutableRoleV1;
  executables: {
    lean: Nhm2FormalKernelExecutableBindingV1;
    lake: Nhm2FormalKernelExecutableBindingV1;
  };
  ledgers: {
    source: Nhm2FormalKernelSealedLedgerV1;
    toolchain: Nhm2FormalKernelSealedLedgerV1;
    input: Nhm2FormalKernelSealedLedgerV1;
  };
  outputRoot: string;
  replayWorkdirs: [string, string];
  environmentAllowlist: string[];
  environment: Record<string, string>;
  executableArguments: string[];
  expectedOutputPaths: string[];
  timeoutMs: number;
  maxCapturedOutputBytes: number;
};

export type Nhm2FormalKernelLedgerObservationV1 = {
  kind: Nhm2FormalKernelLedgerKind;
  observedAt: string;
  ledgerSha256: string;
  entryCount: number;
  entries: Nhm2FormalKernelLedgerEntryV1[];
};

export type Nhm2FormalKernelProcessObservationV1 = {
  executableRole: Nhm2FormalKernelExecutableRoleV1;
  command: string;
  args: string[];
  cwd: string;
  environment: Record<string, string>;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  stdoutSha256: string;
  stderrSha256: string;
  stdoutBytes: number;
  stderrBytes: number;
  timedOut: boolean;
  outputLimitExceeded: boolean;
  spawnError: string | null;
};

export type Nhm2FormalKernelOutputObservationV1 = {
  relativePath: string;
  sha256: string;
  sizeBytes: number;
  modifiedAt: string;
  freshness: "new";
};

export type Nhm2FormalKernelReplayObservationV1 = {
  replayIndex: 1 | 2;
  executableRole: Nhm2FormalKernelExecutableRoleV1;
  process: Nhm2FormalKernelProcessObservationV1;
  transcript: {
    theoremMarker: typeof NHM2_FORMAL_KERNEL_THEOREM_TRANSCRIPT_MARKER;
    axiomMarker: typeof NHM2_FORMAL_KERNEL_AXIOM_TRANSCRIPT_MARKER;
  };
  outputInventorySha256: string;
  outputs: Nhm2FormalKernelOutputObservationV1[];
  postRunLedgers: Record<
    Nhm2FormalKernelLedgerKind,
    Nhm2FormalKernelLedgerObservationV1
  >;
};

export type Nhm2FormalKernelExecutionObservationV1 = {
  artifactId: "nhm2.formal_kernel_execution_observation";
  contractVersion: typeof NHM2_FORMAL_KERNEL_EXECUTION_OBSERVATION_CONTRACT_VERSION;
  generatedAt: string;
  status: "pass";
  theoremName: typeof NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME;
  executableRole: Nhm2FormalKernelExecutableRoleV1;
  executables: {
    lean: Nhm2FormalKernelExecutableBindingV1;
    lake: Nhm2FormalKernelExecutableBindingV1;
  };
  preRunLedgers: Record<
    Nhm2FormalKernelLedgerKind,
    Nhm2FormalKernelLedgerObservationV1
  >;
  replays: [
    Nhm2FormalKernelReplayObservationV1,
    Nhm2FormalKernelReplayObservationV1,
  ];
  replayAgreement: {
    executableRolesExact: true;
    commandsExact: true;
    environmentsExact: true;
    transcriptsExact: true;
    outputInventoriesExact: true;
    sealedLedgersStable: true;
  };
  claimBoundary: {
    formalLogicReplayOnly: true;
    numericalPhysicsValidated: false;
    empiricalValidationEstablished: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
    operatingSystemHermeticityAsserted: false;
    filesystemSandboxAsserted: false;
  };
};

export class Nhm2FormalKernelExecutorError extends Error {
  readonly code: string;
  observedProcesses: Nhm2FormalKernelProcessObservationV1[];

  constructor(
    code: string,
    message: string,
    observedProcesses: Nhm2FormalKernelProcessObservationV1[] = [],
  ) {
    super(message);
    this.name = "Nhm2FormalKernelExecutorError";
    this.code = code;
    this.observedProcesses = [...observedProcesses];
  }
}

type TreeFileObservation = Nhm2FormalKernelLedgerEntryV1 & {
  modifiedAt: string;
};

type TreeObservation = {
  files: TreeFileObservation[];
  directories: string[];
};

const SHA256 = /^[a-f0-9]{64}$/;
const ENVIRONMENT_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const MAX_TIMEOUT_MS = 60 * 60 * 1_000;
const MAX_CAPTURE_BYTES = 16 * 1024 * 1024;

export const NHM2_FORMAL_KERNEL_RESOURCE_LIMITS = {
  maxTreeFileCount: 250_000,
  maxTreeDirectoryCount: 250_000,
  maxFileBytes: 512 * 1024 * 1024,
  maxAggregateTreeBytes: 8 * 1024 * 1024 * 1024,
  maxPathDepth: 64,
  maxExpectedOutputCount: 64,
} as const;

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

const compareUtf8 = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const fail = (
  code: string,
  message: string,
  observedProcesses: Nhm2FormalKernelProcessObservationV1[] = [],
): never => {
  throw new Nhm2FormalKernelExecutorError(code, message, observedProcesses);
};

const isPortableRelativePath = (value: string): boolean =>
  value.length > 0 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !path.posix.isAbsolute(value) &&
  !value.includes("\0") &&
  value
    .split("/")
    .every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    );

const normalizeAbsoluteForComparison = (value: string): string => {
  let normalized = path.normalize(value);
  if (process.platform === "win32") {
    normalized = normalized
      .replace(/^\\\\\?\\UNC\\/i, "\\\\")
      .replace(/^\\\\\?\\/, "")
      .toLowerCase();
  }
  return normalized;
};

const sameFilesystemPath = (left: string, right: string): boolean =>
  normalizeAbsoluteForComparison(left) ===
  normalizeAbsoluteForComparison(right);

const caseAwarePathKey = (value: string): string =>
  process.platform === "win32" ? value.toLowerCase() : value;

const isContainedPath = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length > 0 &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  );
};

const pathsOverlap = (left: string, right: string): boolean =>
  sameFilesystemPath(left, right) ||
  isContainedPath(left, right) ||
  isContainedPath(right, left);

const requireAbsoluteLocalPath = (value: string, label: string): string => {
  if (
    value.length === 0 ||
    value.includes("\0") ||
    !path.isAbsolute(value) ||
    (process.platform === "win32" &&
      (/^\\\\/.test(value) || /^\\\\\?\\/.test(value)))
  ) {
    fail("absolute_path_required", `${label} must be an absolute local path.`);
  }
  return path.resolve(value);
};

const exactSortedUnique = (values: readonly string[]): boolean =>
  values.every(
    (value, index) => index === 0 || compareUtf8(values[index - 1], value) < 0,
  ) && new Set(values.map(caseAwarePathKey)).size === values.length;

const expectedDirectoriesForFiles = (
  relativePaths: readonly string[],
): string[] => {
  const directories = new Set<string>();
  for (const relativePath of relativePaths) {
    const parts = relativePath.split("/");
    parts.pop();
    let current = "";
    for (const part of parts) {
      current = current.length === 0 ? part : `${current}/${part}`;
      directories.add(current);
    }
  }
  return [...directories].sort(compareUtf8);
};

export function computeNhm2FormalKernelLedgerSha256(input: {
  kind: Nhm2FormalKernelLedgerKind;
  entries: readonly Nhm2FormalKernelLedgerEntryV1[];
}): string {
  return sha256(
    JSON.stringify({
      domain: "nhm2_formal_kernel_sealed_ledger/v1",
      kind: input.kind,
      entries: input.entries.map((entry) => ({
        relativePath: entry.relativePath,
        sha256: entry.sha256,
        sizeBytes: entry.sizeBytes,
      })),
    }),
  );
}

const computeOutputInventorySha256 = (
  entries: readonly Nhm2FormalKernelOutputObservationV1[],
): string =>
  sha256(
    JSON.stringify({
      domain: "nhm2_formal_kernel_output_inventory/v1",
      entries: entries.map(({ relativePath, sha256, sizeBytes }) => ({
        relativePath,
        sha256,
        sizeBytes,
      })),
    }),
  );

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
    let stat: Awaited<ReturnType<typeof fs.lstat>> | null = null;
    try {
      stat = await fs.lstat(cursor);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? "unknown";
      fail(
        "path_unreadable",
        `${label} path component is unreadable (${cursor}): ${code}.`,
      );
    }
    const resolvedStat = stat;
    if (resolvedStat == null) {
      throw new Nhm2FormalKernelExecutorError(
        "path_unreadable",
        `${label} path component is unreadable.`,
      );
    }
    if (resolvedStat.isSymbolicLink()) {
      fail(
        "symlink_or_reparse_forbidden",
        `${label} path contains a symbolic link or reparse point: ${cursor}.`,
      );
    }
    const realPath = await fs.realpath(cursor);
    if (!sameFilesystemPath(realPath, cursor)) {
      fail(
        "symlink_or_reparse_forbidden",
        `${label} path resolves through a reparse point: ${cursor}.`,
      );
    }
  }
}

async function readUniqueRegularFile(
  absolutePath: string,
  relativePath: string,
  label: string,
): Promise<TreeFileObservation> {
  const before = await fs.lstat(absolutePath);
  if (before.isSymbolicLink()) {
    fail(
      "symlink_or_reparse_forbidden",
      `${label} contains a symbolic link or reparse point: ${relativePath}.`,
    );
  }
  if (!before.isFile()) {
    fail(
      "regular_file_required",
      `${label} entry is not a regular file: ${relativePath}.`,
    );
  }
  if (before.nlink !== 1) {
    fail(
      "hardlink_forbidden",
      `${label} entry must have exactly one hard link: ${relativePath}.`,
    );
  }
  if (before.size > NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxFileBytes) {
    fail(
      "resource_limit_exceeded",
      `${label} entry exceeds the per-file byte limit: ${relativePath}.`,
    );
  }
  const realPath = await fs.realpath(absolutePath);
  if (!sameFilesystemPath(realPath, absolutePath)) {
    fail(
      "symlink_or_reparse_forbidden",
      `${label} entry resolves through a reparse point: ${relativePath}.`,
    );
  }
  const bytes = await fs.readFile(absolutePath);
  if (bytes.byteLength > NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxFileBytes) {
    fail(
      "resource_limit_exceeded",
      `${label} entry exceeds the per-file byte limit: ${relativePath}.`,
    );
  }
  const after = await fs.lstat(absolutePath);
  if (
    after.isSymbolicLink() ||
    !after.isFile() ||
    after.nlink !== 1 ||
    before.dev !== after.dev ||
    before.ino !== after.ino ||
    before.size !== after.size ||
    before.mtimeMs !== after.mtimeMs ||
    bytes.byteLength !== after.size
  ) {
    fail(
      "file_changed_while_reading",
      `${label} entry changed while it was being read: ${relativePath}.`,
    );
  }
  return {
    relativePath,
    sha256: sha256(bytes),
    sizeBytes: bytes.byteLength,
    modifiedAt: after.mtime.toISOString(),
  };
}

async function observeRegularTree(
  rootPath: string,
  label: string,
): Promise<TreeObservation> {
  await assertExistingPathChainSafe(rootPath, label);
  const rootStat = await fs.lstat(rootPath);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    fail(
      "regular_directory_required",
      `${label} root must be a non-symbolic directory.`,
    );
  }
  const files: TreeFileObservation[] = [];
  const directories: string[] = [];
  let aggregateBytes = 0;
  const visit = async (
    absoluteDirectory: string,
    relativeDirectory: string,
  ) => {
    const directoryRealPath = await fs.realpath(absoluteDirectory);
    if (!sameFilesystemPath(directoryRealPath, absoluteDirectory)) {
      fail(
        "symlink_or_reparse_forbidden",
        `${label} directory resolves through a reparse point: ${relativeDirectory || "."}.`,
      );
    }
    const entries = await fs.readdir(absoluteDirectory, {
      encoding: "utf8",
      withFileTypes: true,
    });
    entries.sort((left, right) => compareUtf8(left.name, right.name));
    for (const entry of entries) {
      const absoluteEntry = path.join(absoluteDirectory, entry.name);
      const relativeEntry =
        relativeDirectory.length === 0
          ? entry.name
          : `${relativeDirectory}/${entry.name}`;
      if (
        relativeEntry.split("/").length >
        NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxPathDepth
      ) {
        fail(
          "resource_limit_exceeded",
          `${label} entry exceeds the path-depth limit: ${relativeEntry}.`,
        );
      }
      const stat = await fs.lstat(absoluteEntry);
      if (entry.isSymbolicLink() || stat.isSymbolicLink()) {
        fail(
          "symlink_or_reparse_forbidden",
          `${label} contains a symbolic link or reparse point: ${relativeEntry}.`,
        );
      }
      const realPath = await fs.realpath(absoluteEntry);
      if (!sameFilesystemPath(realPath, absoluteEntry)) {
        fail(
          "symlink_or_reparse_forbidden",
          `${label} entry resolves through a reparse point: ${relativeEntry}.`,
        );
      }
      if (entry.isDirectory() && stat.isDirectory()) {
        if (
          directories.length >=
          NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxTreeDirectoryCount
        ) {
          fail(
            "resource_limit_exceeded",
            `${label} exceeds the directory-count limit.`,
          );
        }
        directories.push(relativeEntry);
        await visit(absoluteEntry, relativeEntry);
      } else if (entry.isFile() && stat.isFile()) {
        if (
          files.length >= NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxTreeFileCount ||
          stat.size > NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxFileBytes ||
          aggregateBytes + stat.size >
            NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxAggregateTreeBytes
        ) {
          fail(
            "resource_limit_exceeded",
            `${label} exceeds its file-count or byte budget.`,
          );
        }
        aggregateBytes += stat.size;
        files.push(
          await readUniqueRegularFile(absoluteEntry, relativeEntry, label),
        );
      } else {
        fail(
          "regular_file_required",
          `${label} contains a non-regular entry: ${relativeEntry}.`,
        );
      }
    }
  };
  await visit(rootPath, "");
  files.sort((left, right) =>
    compareUtf8(left.relativePath, right.relativePath),
  );
  directories.sort(compareUtf8);
  return { files, directories };
}

function validateLedgerDeclaration(
  ledger: Nhm2FormalKernelSealedLedgerV1,
  expectedKind: Nhm2FormalKernelLedgerKind,
): void {
  if (ledger.kind !== expectedKind) {
    fail(
      "ledger_kind_mismatch",
      `Expected ${expectedKind} ledger but received ${ledger.kind}.`,
    );
  }
  requireAbsoluteLocalPath(ledger.rootPath, `${expectedKind} ledger root`);
  if (ledger.entries.length === 0) {
    fail(
      "ledger_empty",
      `${expectedKind} ledger must contain at least one file.`,
    );
  }
  if (
    ledger.entries.length > NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxTreeFileCount
  ) {
    fail(
      "resource_limit_exceeded",
      `${expectedKind} ledger exceeds the file-count limit.`,
    );
  }
  const relativePaths = ledger.entries.map((entry) => entry.relativePath);
  if (
    !relativePaths.every(isPortableRelativePath) ||
    !exactSortedUnique(relativePaths)
  ) {
    fail(
      "ledger_paths_invalid",
      `${expectedKind} ledger paths must be portable, UTF-8 sorted, and unique.`,
    );
  }
  for (const entry of ledger.entries) {
    if (
      entry.sizeBytes > NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxFileBytes ||
      entry.relativePath.split("/").length >
        NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxPathDepth
    ) {
      fail(
        "resource_limit_exceeded",
        `${expectedKind} ledger entry exceeds its byte or path-depth limit: ${entry.relativePath}.`,
      );
    }
    if (
      !SHA256.test(entry.sha256) ||
      !Number.isSafeInteger(entry.sizeBytes) ||
      entry.sizeBytes < 0
    ) {
      fail(
        "ledger_entry_invalid",
        `${expectedKind} ledger entry is invalid: ${entry.relativePath}.`,
      );
    }
  }
  const aggregateBytes = ledger.entries.reduce(
    (total, entry) => total + entry.sizeBytes,
    0,
  );
  if (
    !Number.isSafeInteger(aggregateBytes) ||
    aggregateBytes > NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxAggregateTreeBytes
  ) {
    fail(
      "resource_limit_exceeded",
      `${expectedKind} ledger exceeds the aggregate byte limit.`,
    );
  }
  const declaredDigest = computeNhm2FormalKernelLedgerSha256({
    kind: expectedKind,
    entries: ledger.entries,
  });
  if (
    !SHA256.test(ledger.ledgerSha256) ||
    ledger.ledgerSha256 !== declaredDigest
  ) {
    fail(
      "ledger_commitment_invalid",
      `${expectedKind} ledger commitment is not canonical.`,
    );
  }
}

async function observeSealedLedger(
  ledger: Nhm2FormalKernelSealedLedgerV1,
): Promise<Nhm2FormalKernelLedgerObservationV1> {
  const rootPath = path.resolve(ledger.rootPath);
  const tree = await observeRegularTree(rootPath, `${ledger.kind} ledger`);
  const expectedFiles = ledger.entries;
  const expectedDirectories = expectedDirectoriesForFiles(
    expectedFiles.map((entry) => entry.relativePath),
  );
  if (
    JSON.stringify(tree.files.map((entry) => entry.relativePath)) !==
      JSON.stringify(expectedFiles.map((entry) => entry.relativePath)) ||
    JSON.stringify(tree.directories) !== JSON.stringify(expectedDirectories)
  ) {
    fail(
      "ledger_inventory_mismatch",
      `${ledger.kind} ledger root contains missing or extra files/directories.`,
    );
  }
  const observedEntries = tree.files.map(
    ({ relativePath, sha256, sizeBytes }) => ({
      relativePath,
      sha256,
      sizeBytes,
    }),
  );
  for (let index = 0; index < expectedFiles.length; index += 1) {
    const expected = expectedFiles[index];
    const observed = observedEntries[index];
    if (
      expected.relativePath !== observed.relativePath ||
      expected.sha256 !== observed.sha256 ||
      expected.sizeBytes !== observed.sizeBytes
    ) {
      fail(
        "ledger_entry_hash_mismatch",
        `${ledger.kind} ledger entry changed: ${expected.relativePath}.`,
      );
    }
  }
  const observedDigest = computeNhm2FormalKernelLedgerSha256({
    kind: ledger.kind,
    entries: observedEntries,
  });
  if (observedDigest !== ledger.ledgerSha256) {
    fail("ledger_hash_mismatch", `${ledger.kind} ledger digest changed.`);
  }
  return {
    kind: ledger.kind,
    observedAt: new Date().toISOString(),
    ledgerSha256: observedDigest,
    entryCount: observedEntries.length,
    entries: observedEntries,
  };
}

async function observeAllLedgers(
  spec: Nhm2FormalKernelPresealedRunSpecV1,
): Promise<
  Record<Nhm2FormalKernelLedgerKind, Nhm2FormalKernelLedgerObservationV1>
> {
  const source = await observeSealedLedger(spec.ledgers.source);
  const toolchain = await observeSealedLedger(spec.ledgers.toolchain);
  const input = await observeSealedLedger(spec.ledgers.input);
  return { source, toolchain, input };
}

async function observeExecutable(
  binding: Nhm2FormalKernelExecutableBindingV1,
  role: Nhm2FormalKernelExecutableRoleV1,
  toolchain: Nhm2FormalKernelSealedLedgerV1,
): Promise<Nhm2FormalKernelExecutableBindingV1> {
  const absolutePath = requireAbsoluteLocalPath(
    binding.absolutePath,
    `${role} executable`,
  );
  const toolchainRoot = path.resolve(toolchain.rootPath);
  if (!isContainedPath(toolchainRoot, absolutePath)) {
    fail(
      "executable_outside_toolchain",
      `${role} executable is outside the sealed toolchain root.`,
    );
  }
  const relativePath = path
    .relative(toolchainRoot, absolutePath)
    .split(path.sep)
    .join("/");
  if (!isPortableRelativePath(relativePath)) {
    fail(
      "path_escape",
      `${role} executable does not have a canonical toolchain-relative path.`,
    );
  }
  const ledgerEntry = toolchain.entries.find(
    (entry) => entry.relativePath === relativePath,
  );
  if (
    ledgerEntry == null ||
    ledgerEntry.sha256 !== binding.sha256 ||
    ledgerEntry.sizeBytes !== binding.sizeBytes
  ) {
    fail(
      "executable_not_ledger_bound",
      `${role} executable does not match the sealed toolchain ledger.`,
    );
  }
  await assertExistingPathChainSafe(absolutePath, `${role} executable`);
  const observed = await readUniqueRegularFile(
    absolutePath,
    relativePath,
    `${role} executable`,
  );
  if (
    observed.sha256 !== binding.sha256 ||
    observed.sizeBytes !== binding.sizeBytes
  ) {
    fail(
      "executable_hash_mismatch",
      `${role} executable bytes changed before execution.`,
    );
  }
  return {
    absolutePath,
    sha256: observed.sha256,
    sizeBytes: observed.sizeBytes,
  };
}

function validateEnvironment(spec: Nhm2FormalKernelPresealedRunSpecV1): void {
  if (
    !spec.environmentAllowlist.every(
      (name) => ENVIRONMENT_NAME.test(name) && !name.includes("\0"),
    ) ||
    !exactSortedUnique(spec.environmentAllowlist)
  ) {
    fail(
      "environment_allowlist_invalid",
      "Environment allowlist must be UTF-8 sorted, unique, and contain valid names.",
    );
  }
  const environmentKeys = Object.keys(spec.environment).sort(compareUtf8);
  if (
    JSON.stringify(environmentKeys) !==
      JSON.stringify(spec.environmentAllowlist) ||
    new Set(environmentKeys.map((name) => name.toLowerCase())).size !==
      environmentKeys.length ||
    Object.values(spec.environment).some(
      (value) => typeof value !== "string" || value.includes("\0"),
    )
  ) {
    fail(
      "environment_not_allowlisted",
      "Process environment must exactly match the explicit allowlist.",
    );
  }
}

function validateSpec(spec: Nhm2FormalKernelPresealedRunSpecV1): {
  outputRoot: string;
  replayWorkdirs: [string, string];
} {
  if (spec.theoremName !== NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME) {
    fail(
      "theorem_name_not_exact",
      `Formal replay theorem must be ${NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME}.`,
    );
  }
  if (spec.executableRole !== "lean" && spec.executableRole !== "lake") {
    fail(
      "executable_role_invalid",
      "Formal replay executable role must be exactly lean or lake.",
    );
  }
  validateLedgerDeclaration(spec.ledgers.source, "source");
  validateLedgerDeclaration(spec.ledgers.toolchain, "toolchain");
  validateLedgerDeclaration(spec.ledgers.input, "input");
  const ledgerRoots = [
    path.resolve(spec.ledgers.source.rootPath),
    path.resolve(spec.ledgers.toolchain.rootPath),
    path.resolve(spec.ledgers.input.rootPath),
  ];
  for (let left = 0; left < ledgerRoots.length; left += 1) {
    for (let right = left + 1; right < ledgerRoots.length; right += 1) {
      if (pathsOverlap(ledgerRoots[left], ledgerRoots[right])) {
        fail(
          "ledger_roots_overlap",
          "Source, toolchain, and input ledger roots must be disjoint.",
        );
      }
    }
  }
  for (const [role, executable] of Object.entries(spec.executables)) {
    requireAbsoluteLocalPath(executable.absolutePath, `${role} executable`);
    if (
      !SHA256.test(executable.sha256) ||
      !Number.isSafeInteger(executable.sizeBytes) ||
      executable.sizeBytes <= 0
    ) {
      fail(
        "executable_binding_invalid",
        `${role} executable binding is invalid.`,
      );
    }
  }
  if (
    sameFilesystemPath(
      spec.executables.lean.absolutePath,
      spec.executables.lake.absolutePath,
    )
  ) {
    fail(
      "executable_bindings_not_distinct",
      "Lean and Lake must have distinct sealed executable bindings.",
    );
  }
  validateEnvironment(spec);
  if (
    spec.executableArguments.length === 0 ||
    spec.executableArguments.some(
      (argument) => typeof argument !== "string" || argument.includes("\0"),
    )
  ) {
    fail(
      "executable_arguments_invalid",
      "Formal executable arguments must be a non-empty exact string array.",
    );
  }
  if (
    spec.expectedOutputPaths.length === 0 ||
    spec.expectedOutputPaths.length >
      NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxExpectedOutputCount ||
    !spec.expectedOutputPaths.every(isPortableRelativePath) ||
    spec.expectedOutputPaths.some(
      (entry) =>
        entry.split("/").length >
        NHM2_FORMAL_KERNEL_RESOURCE_LIMITS.maxPathDepth,
    ) ||
    !exactSortedUnique(spec.expectedOutputPaths)
  ) {
    fail(
      "expected_outputs_invalid",
      "Expected output paths must be non-empty, portable, UTF-8 sorted, and unique.",
    );
  }
  if (
    !Number.isSafeInteger(spec.timeoutMs) ||
    spec.timeoutMs <= 0 ||
    spec.timeoutMs > MAX_TIMEOUT_MS
  ) {
    fail(
      "timeout_invalid",
      "Formal replay timeout is outside the allowed range.",
    );
  }
  if (
    !Number.isSafeInteger(spec.maxCapturedOutputBytes) ||
    spec.maxCapturedOutputBytes <= 0 ||
    spec.maxCapturedOutputBytes > MAX_CAPTURE_BYTES
  ) {
    fail(
      "capture_limit_invalid",
      "Formal replay capture limit is outside the allowed range.",
    );
  }
  const outputRoot = requireAbsoluteLocalPath(spec.outputRoot, "output root");
  if (ledgerRoots.some((ledgerRoot) => pathsOverlap(ledgerRoot, outputRoot))) {
    fail(
      "output_overlaps_sealed_input",
      "Output root must not overlap a sealed ledger root.",
    );
  }
  if (!Array.isArray(spec.replayWorkdirs) || spec.replayWorkdirs.length !== 2) {
    fail(
      "replay_workdirs_invalid",
      "Exactly two replay workdirs are required.",
    );
  }
  const replayWorkdirs = spec.replayWorkdirs.map((workdir, index) =>
    requireAbsoluteLocalPath(workdir, `replay ${index + 1} workdir`),
  ) as [string, string];
  if (sameFilesystemPath(replayWorkdirs[0], replayWorkdirs[1])) {
    fail("replay_workdirs_invalid", "Replay workdirs must be distinct.");
  }
  for (const workdir of replayWorkdirs) {
    if (
      !sameFilesystemPath(path.dirname(workdir), outputRoot) ||
      !isContainedPath(outputRoot, workdir)
    ) {
      fail(
        "path_escape",
        "Replay workdirs must be direct children of the fresh output root.",
      );
    }
  }
  return { outputRoot, replayWorkdirs };
}

async function assertPathMissing(
  absolutePath: string,
  label: string,
): Promise<void> {
  try {
    await fs.lstat(absolutePath);
    fail("fresh_output_required", `${label} must not already exist.`);
  } catch (error) {
    if (
      error instanceof Nhm2FormalKernelExecutorError ||
      (error as NodeJS.ErrnoException).code !== "ENOENT"
    ) {
      throw error;
    }
  }
}

async function createFreshOutputTree(
  outputRoot: string,
  replayWorkdirs: [string, string],
): Promise<void> {
  await assertPathMissing(outputRoot, "Formal output root");
  const outputParent = path.dirname(outputRoot);
  await assertExistingPathChainSafe(outputParent, "formal output parent");
  const parentStat = await fs.lstat(outputParent);
  if (!parentStat.isDirectory() || parentStat.isSymbolicLink()) {
    fail(
      "regular_directory_required",
      "Formal output parent must be a non-symbolic directory.",
    );
  }
  await fs.mkdir(outputRoot);
  await assertExistingPathChainSafe(outputRoot, "formal output root");
  for (const workdir of replayWorkdirs) {
    await fs.mkdir(workdir);
    await assertExistingPathChainSafe(workdir, "formal replay workdir");
  }
}

async function assertOutputRootTopLevelExact(
  outputRoot: string,
  replayWorkdirs: [string, string],
): Promise<void> {
  const expectedNames = replayWorkdirs
    .map((workdir) => path.basename(workdir))
    .sort(compareUtf8);
  const entries = await fs.readdir(outputRoot, {
    encoding: "utf8",
    withFileTypes: true,
  });
  entries.sort((left, right) => compareUtf8(left.name, right.name));
  if (
    JSON.stringify(entries.map((entry) => entry.name)) !==
      JSON.stringify(expectedNames) ||
    entries.some((entry) => !entry.isDirectory() || entry.isSymbolicLink())
  ) {
    fail(
      "output_inventory_mismatch",
      "Formal output root contains files or directories outside the two replay workdirs.",
    );
  }
  for (const entry of entries) {
    const absolutePath = path.join(outputRoot, entry.name);
    const stat = await fs.lstat(absolutePath);
    const realPath = await fs.realpath(absolutePath);
    if (
      stat.isSymbolicLink() ||
      !stat.isDirectory() ||
      !sameFilesystemPath(realPath, absolutePath)
    ) {
      fail(
        "symlink_or_reparse_forbidden",
        `Formal replay workdir is a symbolic link or reparse point: ${entry.name}.`,
      );
    }
  }
}

async function observeOutputWorkdir(
  workdir: string,
  expectedOutputPaths: readonly string[],
): Promise<{
  outputs: Nhm2FormalKernelOutputObservationV1[];
  inventorySha256: string;
}> {
  const tree = await observeRegularTree(workdir, "formal replay output");
  const expectedDirectories = expectedDirectoriesForFiles(expectedOutputPaths);
  if (
    JSON.stringify(tree.files.map((entry) => entry.relativePath)) !==
      JSON.stringify(expectedOutputPaths) ||
    JSON.stringify(tree.directories) !== JSON.stringify(expectedDirectories)
  ) {
    fail(
      "output_inventory_mismatch",
      "Formal replay output contains a missing or extra file/directory.",
    );
  }
  const outputs = tree.files.map(
    ({ relativePath, sha256, sizeBytes, modifiedAt }) => ({
      relativePath,
      sha256,
      sizeBytes,
      modifiedAt,
      freshness: "new" as const,
    }),
  );
  return {
    outputs,
    inventorySha256: computeOutputInventorySha256(outputs),
  };
}

const appendCapturedChunk = (input: {
  chunks: Buffer[];
  chunk: Buffer;
  capturedBytes: number;
  maximumBytes: number;
}): { capturedBytes: number; exceeded: boolean } => {
  const remaining = Math.max(0, input.maximumBytes - input.capturedBytes);
  if (remaining > 0) input.chunks.push(input.chunk.subarray(0, remaining));
  return {
    capturedBytes:
      input.capturedBytes + Math.min(remaining, input.chunk.length),
    exceeded: input.chunk.length > remaining,
  };
};

async function runExactFormalProcess(input: {
  executableRole: Nhm2FormalKernelExecutableRoleV1;
  command: string;
  args: string[];
  cwd: string;
  environment: Record<string, string>;
  timeoutMs: number;
  maxCapturedOutputBytes: number;
}): Promise<Nhm2FormalKernelProcessObservationV1> {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();
  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let outputLimitExceeded = false;
  let timedOut = false;
  let spawnError: string | null = null;
  let exitCode: number | null = null;
  let signal: NodeJS.Signals | null = null;

  await new Promise<void>((resolve) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(input.command, input.args, {
        cwd: input.cwd,
        env: { ...input.environment },
        shell: false,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      spawnError = error instanceof Error ? error.message : String(error);
      resolve();
      return;
    }
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, input.timeoutMs);
    child.stdout?.on("data", (value: Buffer | string) => {
      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
      const appended = appendCapturedChunk({
        chunks: stdoutChunks,
        chunk,
        capturedBytes: stdoutBytes,
        maximumBytes: input.maxCapturedOutputBytes,
      });
      stdoutBytes = appended.capturedBytes;
      if (appended.exceeded) {
        outputLimitExceeded = true;
        child.kill("SIGKILL");
      }
    });
    child.stderr?.on("data", (value: Buffer | string) => {
      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
      const appended = appendCapturedChunk({
        chunks: stderrChunks,
        chunk,
        capturedBytes: stderrBytes,
        maximumBytes: input.maxCapturedOutputBytes,
      });
      stderrBytes = appended.capturedBytes;
      if (appended.exceeded) {
        outputLimitExceeded = true;
        child.kill("SIGKILL");
      }
    });
    child.once("error", (error) => {
      spawnError = error.message;
    });
    child.once("close", (code, closeSignal) => {
      clearTimeout(timeout);
      exitCode = code;
      signal = closeSignal;
      resolve();
    });
  });

  const completedMs = Date.now();
  const stdoutBuffer = Buffer.concat(stdoutChunks);
  const stderrBuffer = Buffer.concat(stderrChunks);
  return {
    executableRole: input.executableRole,
    command: input.command,
    args: [...input.args],
    cwd: input.cwd,
    environment: { ...input.environment },
    startedAt,
    completedAt: new Date(completedMs).toISOString(),
    durationMs: Math.max(0, completedMs - startedMs),
    exitCode,
    signal,
    stdout: stdoutBuffer.toString("utf8"),
    stderr: stderrBuffer.toString("utf8"),
    stdoutSha256: sha256(stdoutBuffer),
    stderrSha256: sha256(stderrBuffer),
    stdoutBytes,
    stderrBytes,
    timedOut,
    outputLimitExceeded,
    spawnError,
  };
}

function assertExactTranscriptMarkers(
  processObservation: Nhm2FormalKernelProcessObservationV1,
): void {
  const lines = `${processObservation.stdout}\n${processObservation.stderr}`
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
  const authorityLines = lines.filter(
    (line) =>
      line.startsWith("NHM2_FORMAL_THEOREM ") ||
      line === NHM2_FORMAL_KERNEL_AXIOM_TRANSCRIPT_MARKER,
  );
  const expected = [
    NHM2_FORMAL_KERNEL_THEOREM_TRANSCRIPT_MARKER,
    NHM2_FORMAL_KERNEL_AXIOM_TRANSCRIPT_MARKER,
  ];
  if (
    authorityLines.length !== expected.length ||
    expected.some(
      (marker) => authorityLines.filter((line) => line === marker).length !== 1,
    )
  ) {
    fail(
      "transcript_markers_invalid",
      "Formal replay did not emit the exact theorem proof and empty-axiom markers.",
    );
  }
}

const sameJson = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

async function executeReplay(input: {
  replayIndex: 1 | 2;
  spec: Nhm2FormalKernelPresealedRunSpecV1;
  executableRole: Nhm2FormalKernelExecutableRoleV1;
  selectedExecutable: Nhm2FormalKernelExecutableBindingV1;
  outputRoot: string;
  replayWorkdirs: [string, string];
  observedProcesses: Nhm2FormalKernelProcessObservationV1[];
}): Promise<Nhm2FormalKernelReplayObservationV1> {
  const workdir = input.replayWorkdirs[input.replayIndex - 1];
  const processObservation = await runExactFormalProcess({
    executableRole: input.executableRole,
    command: input.selectedExecutable.absolutePath,
    args: [...input.spec.executableArguments],
    cwd: workdir,
    environment: { ...input.spec.environment },
    timeoutMs: input.spec.timeoutMs,
    maxCapturedOutputBytes: input.spec.maxCapturedOutputBytes,
  });
  input.observedProcesses.push(processObservation);

  try {
    const postRunLedgers = await observeAllLedgers(input.spec);
    await assertOutputRootTopLevelExact(input.outputRoot, input.replayWorkdirs);
    const output = await observeOutputWorkdir(
      workdir,
      input.spec.expectedOutputPaths,
    );
    const otherWorkdir = input.replayWorkdirs[input.replayIndex === 1 ? 1 : 0];
    if (input.replayIndex === 1) {
      await observeOutputWorkdir(otherWorkdir, []);
    }

    if (processObservation.spawnError != null) {
      fail(
        "replay_spawn_failed",
        `Formal replay ${input.replayIndex} could not spawn: ${processObservation.spawnError}.`,
      );
    }
    if (processObservation.timedOut) {
      fail("replay_timed_out", `Formal replay ${input.replayIndex} timed out.`);
    }
    if (processObservation.outputLimitExceeded) {
      fail(
        "replay_output_limit_exceeded",
        `Formal replay ${input.replayIndex} exceeded its capture limit.`,
      );
    }
    if (
      processObservation.exitCode !== 0 ||
      processObservation.signal != null
    ) {
      fail(
        "replay_exit_nonzero",
        `Formal replay ${input.replayIndex} exited nonzero or by signal.`,
      );
    }
    assertExactTranscriptMarkers(processObservation);

    return {
      replayIndex: input.replayIndex,
      executableRole: input.executableRole,
      process: processObservation,
      transcript: {
        theoremMarker: NHM2_FORMAL_KERNEL_THEOREM_TRANSCRIPT_MARKER,
        axiomMarker: NHM2_FORMAL_KERNEL_AXIOM_TRANSCRIPT_MARKER,
      },
      outputInventorySha256: output.inventorySha256,
      outputs: output.outputs,
      postRunLedgers,
    };
  } catch (error) {
    if (error instanceof Nhm2FormalKernelExecutorError) {
      error.observedProcesses = [...input.observedProcesses];
      throw error;
    }
    throw new Nhm2FormalKernelExecutorError(
      "replay_finalization_failed",
      error instanceof Error ? error.message : String(error),
      input.observedProcesses,
    );
  }
}

/**
 * Executes two cold replays through the explicitly selected, exact-binary Lean
 * or Lake binding over presealed source, toolchain, and input trees. All
 * authority in the returned observation is derived by this outer process.
 * Child-authored status or proof metadata is never consumed.
 *
 * A successful result proves only that the pinned formal theorem replayed under
 * the sealed local environment. It does not validate numerical physics,
 * empirical realization, transport, propulsion, route ETA, or certified speed.
 */
export async function executeNhm2FormalKernelReplay(
  spec: Nhm2FormalKernelPresealedRunSpecV1,
): Promise<Nhm2FormalKernelExecutionObservationV1> {
  const { outputRoot, replayWorkdirs } = validateSpec(spec);
  const preRunLedgers = await observeAllLedgers(spec);
  const lean = await observeExecutable(
    spec.executables.lean,
    "lean",
    spec.ledgers.toolchain,
  );
  const lake = await observeExecutable(
    spec.executables.lake,
    "lake",
    spec.ledgers.toolchain,
  );
  const selectedExecutable = spec.executableRole === "lean" ? lean : lake;
  await createFreshOutputTree(outputRoot, replayWorkdirs);
  await assertOutputRootTopLevelExact(outputRoot, replayWorkdirs);
  await observeOutputWorkdir(replayWorkdirs[0], []);
  await observeOutputWorkdir(replayWorkdirs[1], []);

  const observedProcesses: Nhm2FormalKernelProcessObservationV1[] = [];
  const first = await executeReplay({
    replayIndex: 1,
    spec,
    executableRole: spec.executableRole,
    selectedExecutable,
    outputRoot,
    replayWorkdirs,
    observedProcesses,
  });
  const second = await executeReplay({
    replayIndex: 2,
    spec,
    executableRole: spec.executableRole,
    selectedExecutable,
    outputRoot,
    replayWorkdirs,
    observedProcesses,
  });

  const firstOutputAfterSecondReplay = await observeOutputWorkdir(
    replayWorkdirs[0],
    spec.expectedOutputPaths,
  );
  await assertOutputRootTopLevelExact(outputRoot, replayWorkdirs);
  if (
    firstOutputAfterSecondReplay.inventorySha256 !==
      first.outputInventorySha256 ||
    !sameJson(
      firstOutputAfterSecondReplay.outputs.map(
        ({ relativePath, sha256, sizeBytes }) => ({
          relativePath,
          sha256,
          sizeBytes,
        }),
      ),
      first.outputs.map(({ relativePath, sha256, sizeBytes }) => ({
        relativePath,
        sha256,
        sizeBytes,
      })),
    )
  ) {
    fail(
      "replay_output_mismatch",
      "The second cold replay altered the first replay output tree.",
      observedProcesses,
    );
  }

  if (
    first.executableRole !== spec.executableRole ||
    second.executableRole !== spec.executableRole ||
    first.process.executableRole !== spec.executableRole ||
    second.process.executableRole !== spec.executableRole
  ) {
    fail(
      "replay_executable_role_mismatch",
      "Cold replay executable roles were not exact.",
      observedProcesses,
    );
  }
  if (
    first.process.command !== selectedExecutable.absolutePath ||
    second.process.command !== selectedExecutable.absolutePath ||
    first.process.command !== second.process.command ||
    !sameJson(first.process.args, second.process.args)
  ) {
    fail(
      "replay_command_mismatch",
      "Cold replay commands were not exact.",
      observedProcesses,
    );
  }
  if (!sameJson(first.process.environment, second.process.environment)) {
    fail(
      "replay_environment_mismatch",
      "Cold replay environments were not exact.",
      observedProcesses,
    );
  }
  if (
    first.process.stdoutSha256 !== second.process.stdoutSha256 ||
    first.process.stderrSha256 !== second.process.stderrSha256
  ) {
    fail(
      "replay_transcript_mismatch",
      "Cold replay transcripts were not byte-identical.",
      observedProcesses,
    );
  }
  if (
    first.outputInventorySha256 !== second.outputInventorySha256 ||
    !sameJson(
      first.outputs.map(({ relativePath, sha256, sizeBytes }) => ({
        relativePath,
        sha256,
        sizeBytes,
      })),
      second.outputs.map(({ relativePath, sha256, sizeBytes }) => ({
        relativePath,
        sha256,
        sizeBytes,
      })),
    )
  ) {
    fail(
      "replay_output_mismatch",
      "Cold replay output inventories were not byte-identical.",
      observedProcesses,
    );
  }
  for (const kind of ["source", "toolchain", "input"] as const) {
    if (
      first.postRunLedgers[kind].ledgerSha256 !==
        preRunLedgers[kind].ledgerSha256 ||
      second.postRunLedgers[kind].ledgerSha256 !==
        preRunLedgers[kind].ledgerSha256
    ) {
      fail(
        "sealed_ledger_changed",
        `${kind} ledger changed across cold replays.`,
        observedProcesses,
      );
    }
  }

  return {
    artifactId: "nhm2.formal_kernel_execution_observation",
    contractVersion: NHM2_FORMAL_KERNEL_EXECUTION_OBSERVATION_CONTRACT_VERSION,
    generatedAt: new Date().toISOString(),
    status: "pass",
    theoremName: NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME,
    executableRole: spec.executableRole,
    executables: { lean, lake },
    preRunLedgers,
    replays: [first, second],
    replayAgreement: {
      executableRolesExact: true,
      commandsExact: true,
      environmentsExact: true,
      transcriptsExact: true,
      outputInventoriesExact: true,
      sealedLedgersStable: true,
    },
    claimBoundary: {
      formalLogicReplayOnly: true,
      numericalPhysicsValidated: false,
      empiricalValidationEstablished: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
      operatingSystemHermeticityAsserted: false,
      filesystemSandboxAsserted: false,
    },
  };
}
