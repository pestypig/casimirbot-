import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const NHM2_EXTERNAL_NUMERICAL_KERNEL_OBSERVATION_VERSION =
  "nhm2_external_numerical_kernel_observation/v2" as const;

export const NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES = {
  observer_continuous_optimizer: {
    solverFamily: "warpax",
    requiredOutputRoles: [
      "observer_optimizer_result",
      "observer_optimizer_trace",
    ],
  },
  casimir_finite_temperature_maxwell_stress: {
    solverFamily: "scuff_em",
    requiredOutputRoles: [
      "casimir_convergence_series",
      "casimir_force_gradient",
      "casimir_stress_traction",
    ],
  },
  casimir_finite_temperature_integrated_force_sweep: {
    solverFamily: "scuff_em",
    requiredOutputRoles: [
      "casimir_integrated_force_sweep",
      "casimir_matsubara_spectrum",
      "casimir_solver_log",
    ],
  },
  mechanics_nonlinear_support_control: {
    solverFamily: "calculix",
    requiredOutputRoles: [
      "mechanics_field_results",
      "mechanics_nonlinear_history",
      "mechanics_solver_report",
    ],
  },
  gr_bssn_backreaction_stability: {
    solverFamily: "einstein_toolkit",
    requiredOutputRoles: [
      "bssn_constraint_history",
      "bssn_convergence_series",
      "bssn_evolution_fields",
    ],
  },
  independent_numerical_replication: {
    solverFamily: "independent_replication_suite",
    requiredOutputRoles: [
      "independent_replay_bundle",
      "independent_replay_inventory",
      "independent_replay_trace",
    ],
  },
} as const;

export type Nhm2ExternalNumericalKernelLane =
  keyof typeof NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES;

export type Nhm2ExternalNumericalKernelSolverFamily =
  (typeof NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES)[Nhm2ExternalNumericalKernelLane]["solverFamily"];

export type Nhm2ExternalNumericalKernelLedgerKind = "toolchain" | "input";

export type Nhm2ExternalNumericalKernelLedgerEntryV1 = {
  relativePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2ExternalNumericalKernelSealedLedgerV1 = {
  kind: Nhm2ExternalNumericalKernelLedgerKind;
  rootPath: string;
  entries: Nhm2ExternalNumericalKernelLedgerEntryV1[];
  ledgerSha256: string;
};

export type Nhm2ExternalNumericalKernelExecutableBindingV1 = {
  absolutePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2ExternalNumericalKernelArgumentV1 =
  | { kind: "literal"; value: string }
  | { kind: "input_path"; relativePath: string }
  | { kind: "output_path"; relativePath: string }
  | { kind: "output_root" };

export type Nhm2ExternalNumericalKernelExpectedOutputV1 = {
  role: string;
  relativePath: string;
  maxBytes: number;
};

export type Nhm2ExternalNumericalKernelRunSpecV1 = {
  lane: Nhm2ExternalNumericalKernelLane;
  solver: {
    family: Nhm2ExternalNumericalKernelSolverFamily;
    implementationId: string;
    version: string;
    producerMode: "external_binary";
  };
  executable: Nhm2ExternalNumericalKernelExecutableBindingV1;
  ledgers: {
    toolchain: Nhm2ExternalNumericalKernelSealedLedgerV1;
    input: Nhm2ExternalNumericalKernelSealedLedgerV1;
  };
  outputRoot: string;
  arguments: Nhm2ExternalNumericalKernelArgumentV1[];
  environmentAllowlist: string[];
  environment: Record<string, string>;
  expectedOutputs: Nhm2ExternalNumericalKernelExpectedOutputV1[];
  timeoutMs: number;
  maxCapturedOutputBytes: number;
  maxLedgerFileBytes: number;
  maxLedgerAggregateBytes: number;
  maxOutputAggregateBytes: number;
};

export type Nhm2ExternalNumericalKernelLedgerObservationV1 = {
  kind: Nhm2ExternalNumericalKernelLedgerKind;
  observedAt: string;
  ledgerSha256: string;
  entryCount: number;
  aggregateBytes: number;
  entries: Nhm2ExternalNumericalKernelLedgerEntryV1[];
};

export type Nhm2ExternalNumericalKernelProcessObservationV1 = {
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

export type Nhm2ExternalNumericalKernelOutputObservationV1 = {
  role: string;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
  modifiedAt: string;
  freshness: "new";
};

export type Nhm2ExternalNumericalKernelRunOwnedToolchainObservationV2 = {
  authority: "executor_created_fresh_copy";
  stagingIdentitySha256: string;
  rootPath: string;
  executableRelativePath: string;
  executablePath: string;
  sourceLedgerSha256: string;
  preSpawnLedger: Nhm2ExternalNumericalKernelLedgerObservationV1;
  postRunLedger: Nhm2ExternalNumericalKernelLedgerObservationV1;
  permissions: {
    policy: "owner_read_execute_only_best_effort/v1";
    executableMode: "0500";
    executableAuxiliaryMode: "0500";
    dataFileMode: "0400";
    directoryMode: "0500";
    osLevelImmutabilityAsserted: false;
  };
  removedAfterExecution: true;
};

export type Nhm2ExternalNumericalKernelObservationV1 = {
  artifactId: "nhm2.external_numerical_kernel_observation";
  contractVersion: typeof NHM2_EXTERNAL_NUMERICAL_KERNEL_OBSERVATION_VERSION;
  generatedAt: string;
  status: "execution_observed_scientific_replay_required";
  lane: Nhm2ExternalNumericalKernelLane;
  solver: Nhm2ExternalNumericalKernelRunSpecV1["solver"];
  executable: Nhm2ExternalNumericalKernelExecutableBindingV1;
  runOwnedToolchain: Nhm2ExternalNumericalKernelRunOwnedToolchainObservationV2;
  preRunLedgers: Record<
    Nhm2ExternalNumericalKernelLedgerKind,
    Nhm2ExternalNumericalKernelLedgerObservationV1
  >;
  process: Nhm2ExternalNumericalKernelProcessObservationV1;
  outputs: Nhm2ExternalNumericalKernelOutputObservationV1[];
  outputInventorySha256: string;
  postRunLedgers: Record<
    Nhm2ExternalNumericalKernelLedgerKind,
    Nhm2ExternalNumericalKernelLedgerObservationV1
  >;
  blockers: [
    "independent_scientific_content_replay_required",
    "same_user_staged_toolchain_mutation_exclusion_not_os_enforced",
  ];
  claimBoundary: {
    externalBinaryExecutionObserved: true;
    solverOutputScientificallyValidated: false;
    theoryClosureClaimAllowed: false;
    empiricalValidationEstablished: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
    operatingSystemHermeticityAsserted: false;
    networkIsolationAsserted: false;
    filesystemSandboxAsserted: false;
  };
};

export type Nhm2ExternalNumericalKernelExecutorHooksV1 = {
  /**
   * Test/audit synchronization point. It intentionally receives no staging
   * path, and the staged closure is re-observed after the hook returns.
   */
  afterRunOwnedToolchainStaged?: () => void | Promise<void>;
};

export class Nhm2ExternalNumericalKernelExecutorError extends Error {
  readonly code: string;
  readonly processObservation: Nhm2ExternalNumericalKernelProcessObservationV1 | null;

  constructor(
    code: string,
    message: string,
    processObservation: Nhm2ExternalNumericalKernelProcessObservationV1 | null = null,
  ) {
    super(message);
    this.name = "Nhm2ExternalNumericalKernelExecutorError";
    this.code = code;
    this.processObservation = processObservation;
  }
}

type TreeEntry = Nhm2ExternalNumericalKernelLedgerEntryV1 & {
  modifiedAt: string;
};

type ProcessResult = Nhm2ExternalNumericalKernelProcessObservationV1;

const SHA256 = /^[a-f0-9]{64}$/;
const ENVIRONMENT_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,127}$/;
const MAX_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1_000;
const MAX_CAPTURE_BYTES = 16 * 1024 * 1024;
const MAX_LEDGER_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_LEDGER_AGGREGATE_BYTES = 8 * 1024 * 1024 * 1024;
const MAX_OUTPUT_AGGREGATE_BYTES = 8 * 1024 * 1024 * 1024;
const MAX_LEDGER_ENTRIES = 100_000;
const MAX_EXPECTED_OUTPUTS = 10_000;

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

const compareUtf8 = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const fail = (
  code: string,
  message: string,
  processObservation: Nhm2ExternalNumericalKernelProcessObservationV1 | null = null,
): never => {
  throw new Nhm2ExternalNumericalKernelExecutorError(
    code,
    message,
    processObservation,
  );
};

const requireExecutionValue = <T>(
  value: T | null,
  label: string,
  processObservation: Nhm2ExternalNumericalKernelProcessObservationV1 | null,
): T => {
  if (value == null) {
    fail(
      "execution_observation_incomplete",
      `External execution did not produce ${label}.`,
      processObservation,
    );
  }
  return value as T;
};

const isPortableRelativePath = (value: string): boolean =>
  value.length > 0 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !path.posix.isAbsolute(value) &&
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

export function computeNhm2ExternalNumericalKernelLedgerSha256(input: {
  kind: Nhm2ExternalNumericalKernelLedgerKind;
  entries: readonly Nhm2ExternalNumericalKernelLedgerEntryV1[];
}): string {
  return sha256(
    JSON.stringify({
      domain: "nhm2_external_numerical_kernel_sealed_ledger/v1",
      kind: input.kind,
      entries: input.entries.map(({ relativePath, sha256, sizeBytes }) => ({
        relativePath,
        sha256,
        sizeBytes,
      })),
    }),
  );
}

const outputInventorySha256 = (
  outputs: readonly Nhm2ExternalNumericalKernelOutputObservationV1[],
): string =>
  sha256(
    JSON.stringify({
      domain: "nhm2_external_numerical_kernel_output_inventory/v1",
      outputs: outputs.map(({ role, relativePath, sha256, sizeBytes }) => ({
        role,
        relativePath,
        sha256,
        sizeBytes,
      })),
    }),
  );

export function computeNhm2ExternalNumericalKernelStagingIdentitySha256(input: {
  rootPath: string;
  executableRelativePath: string;
  executablePath: string;
  sourceLedgerSha256: string;
  stagedLedger: Nhm2ExternalNumericalKernelLedgerObservationV1;
}): string {
  return sha256(
    JSON.stringify({
      domain: "nhm2_external_numerical_kernel_run_owned_toolchain/v1",
      rootPath: path.resolve(input.rootPath),
      executableRelativePath: input.executableRelativePath,
      executablePath: path.resolve(input.executablePath),
      sourceLedgerSha256: input.sourceLedgerSha256,
      stagedLedgerSha256: input.stagedLedger.ledgerSha256,
      entryCount: input.stagedLedger.entryCount,
      aggregateBytes: input.stagedLedger.aggregateBytes,
      entries: input.stagedLedger.entries,
    }),
  );
}

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
    let stat: Awaited<ReturnType<typeof fs.lstat>>;
    try {
      stat = await fs.lstat(cursor);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? "unknown";
      throw new Nhm2ExternalNumericalKernelExecutorError(
        "path_unreadable",
        `${label} path component is unreadable (${cursor}): ${code}.`,
      );
    }
    if (stat.isSymbolicLink()) {
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

async function hashRegularFile(input: {
  absolutePath: string;
  relativePath: string;
  label: string;
  maxBytes: number;
}): Promise<TreeEntry> {
  const before = await fs.lstat(input.absolutePath);
  if (before.isSymbolicLink() || !before.isFile()) {
    fail(
      "regular_file_required",
      `${input.label} entry is not a non-symbolic regular file: ${input.relativePath}.`,
    );
  }
  if (before.nlink !== 1) {
    fail(
      "hardlink_forbidden",
      `${input.label} entry must have exactly one hard link: ${input.relativePath}.`,
    );
  }
  if (before.size > input.maxBytes) {
    fail(
      "filesystem_resource_limit_exceeded",
      `${input.label} entry exceeds its byte limit: ${input.relativePath}.`,
    );
  }
  const realPath = await fs.realpath(input.absolutePath);
  if (!sameFilesystemPath(realPath, input.absolutePath)) {
    fail(
      "symlink_or_reparse_forbidden",
      `${input.label} entry resolves through a reparse point: ${input.relativePath}.`,
    );
  }
  const digest = createHash("sha256");
  let observedBytes = 0;
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(input.absolutePath);
    stream.on("data", (chunk: Buffer) => {
      observedBytes += chunk.byteLength;
      if (observedBytes > input.maxBytes) {
        stream.destroy(new Error("filesystem_resource_limit_exceeded"));
        return;
      }
      digest.update(chunk);
    });
    stream.on("error", reject);
    stream.on("end", resolve);
  }).catch((error) => {
    if ((error as Error).message === "filesystem_resource_limit_exceeded") {
      fail(
        "filesystem_resource_limit_exceeded",
        `${input.label} entry exceeded its byte limit while hashing: ${input.relativePath}.`,
      );
    }
    fail(
      "file_unreadable",
      `${input.label} entry could not be hashed: ${input.relativePath}.`,
    );
  });
  const after = await fs.lstat(input.absolutePath);
  if (
    after.isSymbolicLink() ||
    !after.isFile() ||
    after.nlink !== 1 ||
    before.dev !== after.dev ||
    before.ino !== after.ino ||
    before.size !== after.size ||
    before.mtimeMs !== after.mtimeMs ||
    observedBytes !== after.size
  ) {
    fail(
      "file_changed_while_reading",
      `${input.label} entry changed while it was being hashed: ${input.relativePath}.`,
    );
  }
  return {
    relativePath: input.relativePath,
    sha256: digest.digest("hex"),
    sizeBytes: observedBytes,
    modifiedAt: after.mtime.toISOString(),
  };
}

async function observeTree(input: {
  rootPath: string;
  label: string;
  maxFileBytes: number;
}): Promise<{ files: TreeEntry[]; directories: string[] }> {
  await assertExistingPathChainSafe(input.rootPath, input.label);
  const rootStat = await fs.lstat(input.rootPath);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    fail(
      "regular_directory_required",
      `${input.label} root must be a non-symbolic directory.`,
    );
  }
  const files: TreeEntry[] = [];
  const directories: string[] = [];
  const visit = async (
    absoluteDirectory: string,
    relativeDirectory: string,
  ): Promise<void> => {
    const directoryRealPath = await fs.realpath(absoluteDirectory);
    if (!sameFilesystemPath(directoryRealPath, absoluteDirectory)) {
      fail(
        "symlink_or_reparse_forbidden",
        `${input.label} directory resolves through a reparse point: ${relativeDirectory || "."}.`,
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
      const stat = await fs.lstat(absoluteEntry);
      if (entry.isSymbolicLink() || stat.isSymbolicLink()) {
        fail(
          "symlink_or_reparse_forbidden",
          `${input.label} contains a symbolic link or reparse point: ${relativeEntry}.`,
        );
      }
      const realPath = await fs.realpath(absoluteEntry);
      if (!sameFilesystemPath(realPath, absoluteEntry)) {
        fail(
          "symlink_or_reparse_forbidden",
          `${input.label} entry resolves through a reparse point: ${relativeEntry}.`,
        );
      }
      if (entry.isDirectory() && stat.isDirectory()) {
        directories.push(relativeEntry);
        await visit(absoluteEntry, relativeEntry);
      } else if (entry.isFile() && stat.isFile()) {
        if (files.length >= MAX_LEDGER_ENTRIES) {
          fail(
            "filesystem_resource_limit_exceeded",
            `${input.label} contains too many files.`,
          );
        }
        files.push(
          await hashRegularFile({
            absolutePath: absoluteEntry,
            relativePath: relativeEntry,
            label: input.label,
            maxBytes: input.maxFileBytes,
          }),
        );
      } else {
        fail(
          "regular_file_required",
          `${input.label} contains a non-regular entry: ${relativeEntry}.`,
        );
      }
    }
  };
  await visit(input.rootPath, "");
  files.sort((left, right) =>
    compareUtf8(left.relativePath, right.relativePath),
  );
  directories.sort(compareUtf8);
  return { files, directories };
}

function validateResourceLimits(
  spec: Nhm2ExternalNumericalKernelRunSpecV1,
): void {
  const bounded = (value: number, hardMaximum: number): boolean =>
    Number.isSafeInteger(value) && value > 0 && value <= hardMaximum;
  if (
    !bounded(spec.timeoutMs, MAX_TIMEOUT_MS) ||
    !bounded(spec.maxCapturedOutputBytes, MAX_CAPTURE_BYTES) ||
    !bounded(spec.maxLedgerFileBytes, MAX_LEDGER_FILE_BYTES) ||
    !bounded(spec.maxLedgerAggregateBytes, MAX_LEDGER_AGGREGATE_BYTES) ||
    !bounded(spec.maxOutputAggregateBytes, MAX_OUTPUT_AGGREGATE_BYTES)
  ) {
    fail(
      "resource_limit_invalid",
      "External numerical-kernel resource limits are invalid or exceed hard caps.",
    );
  }
}

function validateLedger(
  ledger: Nhm2ExternalNumericalKernelSealedLedgerV1,
  kind: Nhm2ExternalNumericalKernelLedgerKind,
  spec: Nhm2ExternalNumericalKernelRunSpecV1,
): void {
  if (ledger.kind !== kind) {
    fail("ledger_kind_mismatch", `Expected ${kind} ledger.`);
  }
  requireAbsoluteLocalPath(ledger.rootPath, `${kind} ledger root`);
  if (
    ledger.entries.length === 0 ||
    ledger.entries.length > MAX_LEDGER_ENTRIES
  ) {
    fail("ledger_size_invalid", `${kind} ledger entry count is invalid.`);
  }
  const paths = ledger.entries.map((entry) => entry.relativePath);
  if (
    !paths.every(isPortableRelativePath) ||
    paths.some(
      (value, index) => index > 0 && compareUtf8(paths[index - 1], value) >= 0,
    )
  ) {
    fail(
      "ledger_paths_invalid",
      `${kind} ledger paths must be portable, unique, and UTF-8 sorted.`,
    );
  }
  let aggregateBytes = 0;
  for (const entry of ledger.entries) {
    if (
      !SHA256.test(entry.sha256) ||
      !Number.isSafeInteger(entry.sizeBytes) ||
      entry.sizeBytes < 0 ||
      entry.sizeBytes > spec.maxLedgerFileBytes
    ) {
      fail("ledger_entry_invalid", `${kind} ledger entry is invalid.`);
    }
    aggregateBytes += entry.sizeBytes;
  }
  if (aggregateBytes > spec.maxLedgerAggregateBytes) {
    fail(
      "filesystem_resource_limit_exceeded",
      `${kind} ledger exceeds its aggregate byte limit.`,
    );
  }
  if (
    !SHA256.test(ledger.ledgerSha256) ||
    ledger.ledgerSha256 !==
      computeNhm2ExternalNumericalKernelLedgerSha256({
        kind,
        entries: ledger.entries,
      })
  ) {
    fail("ledger_commitment_invalid", `${kind} ledger digest is invalid.`);
  }
}

async function observeLedger(
  ledger: Nhm2ExternalNumericalKernelSealedLedgerV1,
  spec: Nhm2ExternalNumericalKernelRunSpecV1,
): Promise<Nhm2ExternalNumericalKernelLedgerObservationV1> {
  const tree = await observeTree({
    rootPath: path.resolve(ledger.rootPath),
    label: `${ledger.kind} ledger`,
    maxFileBytes: spec.maxLedgerFileBytes,
  });
  const expectedDirectories = expectedDirectoriesForFiles(
    ledger.entries.map((entry) => entry.relativePath),
  );
  if (
    JSON.stringify(tree.files.map((entry) => entry.relativePath)) !==
      JSON.stringify(ledger.entries.map((entry) => entry.relativePath)) ||
    JSON.stringify(tree.directories) !== JSON.stringify(expectedDirectories)
  ) {
    fail(
      "ledger_inventory_mismatch",
      `${ledger.kind} ledger has missing or extra files/directories.`,
    );
  }
  const entries = tree.files.map(({ relativePath, sha256, sizeBytes }) => ({
    relativePath,
    sha256,
    sizeBytes,
  }));
  if (JSON.stringify(entries) !== JSON.stringify(ledger.entries)) {
    fail(
      "ledger_entry_hash_mismatch",
      `${ledger.kind} ledger bytes do not match the sealed declaration.`,
    );
  }
  const aggregateBytes = entries.reduce(
    (total, entry) => total + entry.sizeBytes,
    0,
  );
  if (aggregateBytes > spec.maxLedgerAggregateBytes) {
    fail(
      "filesystem_resource_limit_exceeded",
      `${ledger.kind} ledger exceeds its aggregate byte limit.`,
    );
  }
  return {
    kind: ledger.kind,
    observedAt: new Date().toISOString(),
    ledgerSha256: ledger.ledgerSha256,
    entryCount: entries.length,
    aggregateBytes,
    entries,
  };
}

function validateExpectedOutputs(
  spec: Nhm2ExternalNumericalKernelRunSpecV1,
): void {
  const policy = NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES[spec.lane];
  const expectedRoles = [...policy.requiredOutputRoles].sort(compareUtf8);
  const outputs = [...spec.expectedOutputs].sort((left, right) =>
    compareUtf8(left.role, right.role),
  );
  if (
    outputs.length === 0 ||
    outputs.length > MAX_EXPECTED_OUTPUTS ||
    JSON.stringify(outputs.map((entry) => entry.role)) !==
      JSON.stringify(expectedRoles)
  ) {
    fail(
      "output_roles_invalid",
      `${spec.lane} must declare exactly its required output roles.`,
    );
  }
  const paths = outputs.map((entry) => entry.relativePath);
  if (
    !outputs.every(
      (entry) =>
        IDENTIFIER.test(entry.role) &&
        isPortableRelativePath(entry.relativePath) &&
        Number.isSafeInteger(entry.maxBytes) &&
        entry.maxBytes > 0 &&
        entry.maxBytes <= spec.maxOutputAggregateBytes,
    ) ||
    new Set(paths.map((value) => value.toLowerCase())).size !== paths.length
  ) {
    fail(
      "expected_output_invalid",
      "Expected output declarations are invalid.",
    );
  }
  const declaredMaximum = outputs.reduce(
    (total, entry) => total + entry.maxBytes,
    0,
  );
  if (declaredMaximum > spec.maxOutputAggregateBytes) {
    fail(
      "filesystem_resource_limit_exceeded",
      "Expected outputs exceed the aggregate byte limit.",
    );
  }
}

function validateEnvironment(spec: Nhm2ExternalNumericalKernelRunSpecV1): void {
  if (
    spec.environmentAllowlist.some(
      (name, index) =>
        !ENVIRONMENT_NAME.test(name) ||
        (index > 0 &&
          compareUtf8(spec.environmentAllowlist[index - 1], name) >= 0),
    ) ||
    Object.keys(spec.environment).sort(compareUtf8).join("\0") !==
      spec.environmentAllowlist.join("\0") ||
    Object.values(spec.environment).some(
      (value) => typeof value !== "string" || value.includes("\0"),
    )
  ) {
    fail(
      "environment_invalid",
      "Environment must exactly match its sorted allowlist and contain no NUL bytes.",
    );
  }
}

function validateSpec(spec: Nhm2ExternalNumericalKernelRunSpecV1): void {
  if (!(spec.lane in NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES)) {
    fail("lane_invalid", "External numerical-kernel lane is not governed.");
  }
  const policy = NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES[spec.lane];
  if (
    spec.solver.family !== policy.solverFamily ||
    spec.solver.producerMode !== "external_binary" ||
    !IDENTIFIER.test(spec.solver.implementationId) ||
    !IDENTIFIER.test(spec.solver.version)
  ) {
    fail(
      "solver_binding_invalid",
      "Solver family, implementation, version, or producer mode is invalid.",
    );
  }
  validateResourceLimits(spec);
  validateLedger(spec.ledgers.toolchain, "toolchain", spec);
  validateLedger(spec.ledgers.input, "input", spec);
  validateExpectedOutputs(spec);
  validateEnvironment(spec);
  const toolchainRoot = requireAbsoluteLocalPath(
    spec.ledgers.toolchain.rootPath,
    "toolchain root",
  );
  const inputRoot = requireAbsoluteLocalPath(
    spec.ledgers.input.rootPath,
    "input root",
  );
  const outputRoot = requireAbsoluteLocalPath(spec.outputRoot, "output root");
  if (
    pathsOverlap(toolchainRoot, inputRoot) ||
    pathsOverlap(toolchainRoot, outputRoot) ||
    pathsOverlap(inputRoot, outputRoot)
  ) {
    fail(
      "filesystem_roots_overlap",
      "Toolchain, input, and output roots must be pairwise disjoint.",
    );
  }
  if (
    spec.arguments.length > 10_000 ||
    spec.arguments.some((argument) => {
      if (argument.kind === "literal") {
        return (
          argument.value.length === 0 ||
          argument.value.length > 16_384 ||
          argument.value.includes("\0")
        );
      }
      if (argument.kind === "output_root") return false;
      return !isPortableRelativePath(argument.relativePath);
    })
  ) {
    fail("argument_invalid", "Argument declarations are invalid.");
  }
  const inputPaths = new Set(
    spec.ledgers.input.entries.map((entry) => entry.relativePath),
  );
  const outputPaths = new Set(
    spec.expectedOutputs.map((entry) => entry.relativePath),
  );
  for (const argument of spec.arguments) {
    if (
      argument.kind === "input_path" &&
      !inputPaths.has(argument.relativePath)
    ) {
      fail("argument_not_ledger_bound", "Input argument is not ledger-bound.");
    }
    if (
      argument.kind === "output_path" &&
      !outputPaths.has(argument.relativePath)
    ) {
      fail(
        "argument_not_output_bound",
        "Output argument is not expected-output-bound.",
      );
    }
  }
}

async function observeExecutable(
  spec: Nhm2ExternalNumericalKernelRunSpecV1,
): Promise<Nhm2ExternalNumericalKernelExecutableBindingV1> {
  const executablePath = requireAbsoluteLocalPath(
    spec.executable.absolutePath,
    "solver executable",
  );
  const toolchainRoot = path.resolve(spec.ledgers.toolchain.rootPath);
  if (!isContainedPath(toolchainRoot, executablePath)) {
    fail(
      "executable_outside_toolchain",
      "Solver executable is outside the sealed toolchain root.",
    );
  }
  const relativePath = path
    .relative(toolchainRoot, executablePath)
    .split(path.sep)
    .join("/");
  const entry = spec.ledgers.toolchain.entries.find(
    (candidate) => candidate.relativePath === relativePath,
  );
  if (
    entry == null ||
    entry.sha256 !== spec.executable.sha256 ||
    entry.sizeBytes !== spec.executable.sizeBytes
  ) {
    fail(
      "executable_not_ledger_bound",
      "Solver executable does not match the sealed toolchain ledger.",
    );
  }
  const observed = await hashRegularFile({
    absolutePath: executablePath,
    relativePath,
    label: "solver executable",
    maxBytes: spec.maxLedgerFileBytes,
  });
  if (
    observed.sha256 !== spec.executable.sha256 ||
    observed.sizeBytes !== spec.executable.sizeBytes
  ) {
    fail("executable_hash_mismatch", "Solver executable bytes changed.");
  }
  return {
    absolutePath: executablePath,
    sha256: observed.sha256,
    sizeBytes: observed.sizeBytes,
  };
}

type RunOwnedToolchain = {
  rootPath: string;
  rootIdentity: { dev: number; ino: number };
  executableRelativePath: string;
  executablePath: string;
  directories: string[];
};

const executableModeForPath = (input: {
  relativePath: string;
  sourceMode: number;
  selectedExecutableRelativePath: string;
}): number => {
  if (input.relativePath === input.selectedExecutableRelativePath) return 0o500;
  if ((input.sourceMode & 0o111) !== 0) return 0o500;
  return /\.(?:bat|cmd|com|exe)$/i.test(input.relativePath) ? 0o500 : 0o400;
};

async function copyLedgerEntryToRunOwnedToolchain(input: {
  sourceRoot: string;
  stagingRoot: string;
  entry: Nhm2ExternalNumericalKernelLedgerEntryV1;
  selectedExecutableRelativePath: string;
}): Promise<void> {
  const sourcePath = path.resolve(
    input.sourceRoot,
    ...input.entry.relativePath.split("/"),
  );
  const destinationPath = path.resolve(
    input.stagingRoot,
    ...input.entry.relativePath.split("/"),
  );
  if (
    !isContainedPath(input.sourceRoot, sourcePath) ||
    !isContainedPath(input.stagingRoot, destinationPath)
  ) {
    fail("staging_path_escape", "Run-owned toolchain staging path escaped.");
  }
  const sourcePathBefore = await fs.lstat(sourcePath);
  const sourceRealPath = await fs.realpath(sourcePath);
  if (
    sourcePathBefore.isSymbolicLink() ||
    !sourcePathBefore.isFile() ||
    sourcePathBefore.nlink !== 1 ||
    !sameFilesystemPath(sourceRealPath, sourcePath)
  ) {
    fail(
      "staging_source_invalid",
      `Toolchain entry is not an exact regular source file: ${input.entry.relativePath}.`,
    );
  }
  const source = await fs.open(sourcePath, "r");
  let destination: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const openedBefore = await source.stat();
    if (
      !openedBefore.isFile() ||
      openedBefore.nlink !== 1 ||
      openedBefore.dev !== sourcePathBefore.dev ||
      openedBefore.ino !== sourcePathBefore.ino ||
      openedBefore.size !== sourcePathBefore.size ||
      openedBefore.mtimeMs !== sourcePathBefore.mtimeMs ||
      openedBefore.size !== input.entry.sizeBytes
    ) {
      fail(
        "staging_source_changed",
        `Toolchain entry changed before staging: ${input.entry.relativePath}.`,
      );
    }
    const destinationMode = executableModeForPath({
      relativePath: input.entry.relativePath,
      sourceMode: openedBefore.mode,
      selectedExecutableRelativePath: input.selectedExecutableRelativePath,
    });
    destination = await fs.open(destinationPath, "wx", destinationMode);
    const digest = createHash("sha256");
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let copiedBytes = 0;
    while (true) {
      const { bytesRead } = await source.read(
        buffer,
        0,
        buffer.byteLength,
        copiedBytes,
      );
      if (bytesRead === 0) break;
      copiedBytes += bytesRead;
      if (copiedBytes > input.entry.sizeBytes) {
        fail(
          "staging_source_changed",
          `Toolchain entry grew while staging: ${input.entry.relativePath}.`,
        );
      }
      digest.update(buffer.subarray(0, bytesRead));
      let written = 0;
      while (written < bytesRead) {
        const result = await destination.write(
          buffer,
          written,
          bytesRead - written,
          copiedBytes - bytesRead + written,
        );
        if (result.bytesWritten <= 0) {
          fail(
            "staging_write_failed",
            `Toolchain staging made no write progress: ${input.entry.relativePath}.`,
          );
        }
        written += result.bytesWritten;
      }
    }
    await destination.sync();
    const [openedAfter, sourcePathAfter] = await Promise.all([
      source.stat(),
      fs.lstat(sourcePath),
    ]);
    if (
      openedAfter.dev !== openedBefore.dev ||
      openedAfter.ino !== openedBefore.ino ||
      openedAfter.size !== openedBefore.size ||
      openedAfter.mtimeMs !== openedBefore.mtimeMs ||
      sourcePathAfter.dev !== openedBefore.dev ||
      sourcePathAfter.ino !== openedBefore.ino ||
      sourcePathAfter.size !== openedBefore.size ||
      sourcePathAfter.mtimeMs !== openedBefore.mtimeMs ||
      copiedBytes !== input.entry.sizeBytes ||
      digest.digest("hex") !== input.entry.sha256
    ) {
      fail(
        "staging_source_changed",
        `Toolchain entry changed while staging: ${input.entry.relativePath}.`,
      );
    }
    await destination.chmod(destinationMode);
  } finally {
    await source.close().catch(() => undefined);
    if (destination != null) await destination.close().catch(() => undefined);
  }
}

async function createRunOwnedToolchain(
  spec: Nhm2ExternalNumericalKernelRunSpecV1,
): Promise<RunOwnedToolchain> {
  const sourceRoot = path.resolve(spec.ledgers.toolchain.rootPath);
  const executableRelativePath = path
    .relative(sourceRoot, path.resolve(spec.executable.absolutePath))
    .split(path.sep)
    .join("/");
  const temporaryParent = path.resolve(os.tmpdir());
  await assertExistingPathChainSafe(temporaryParent, "temporary root");
  const rootPath = await fs.mkdtemp(
    path.join(temporaryParent, "nhm2-external-toolchain-"),
  );
  const rootStat = await fs.lstat(rootPath);
  if (
    rootStat.isSymbolicLink() ||
    !rootStat.isDirectory() ||
    !isContainedPath(temporaryParent, rootPath) ||
    pathsOverlap(rootPath, sourceRoot) ||
    pathsOverlap(rootPath, path.resolve(spec.ledgers.input.rootPath)) ||
    pathsOverlap(rootPath, path.resolve(spec.outputRoot))
  ) {
    fail(
      "staging_root_invalid",
      "Fresh run-owned toolchain root is unsafe or overlaps a governed root.",
    );
  }
  await fs.chmod(rootPath, 0o700);
  const directories = expectedDirectoriesForFiles(
    spec.ledgers.toolchain.entries.map((entry) => entry.relativePath),
  );
  for (const relativeDirectory of directories) {
    const absoluteDirectory = path.resolve(
      rootPath,
      ...relativeDirectory.split("/"),
    );
    if (!isContainedPath(rootPath, absoluteDirectory)) {
      fail("staging_path_escape", "Run-owned toolchain directory escaped.");
    }
    await fs.mkdir(absoluteDirectory, { recursive: true, mode: 0o700 });
  }
  for (const entry of spec.ledgers.toolchain.entries) {
    await copyLedgerEntryToRunOwnedToolchain({
      sourceRoot,
      stagingRoot: rootPath,
      entry,
      selectedExecutableRelativePath: executableRelativePath,
    });
  }
  for (const relativeDirectory of [...directories].sort(
    (left, right) => right.split("/").length - left.split("/").length,
  )) {
    await fs.chmod(
      path.resolve(rootPath, ...relativeDirectory.split("/")),
      0o500,
    );
  }
  await fs.chmod(rootPath, 0o500);
  const executablePath = path.resolve(
    rootPath,
    ...executableRelativePath.split("/"),
  );
  return {
    rootPath,
    rootIdentity: { dev: rootStat.dev, ino: rootStat.ino },
    executableRelativePath,
    executablePath,
    directories,
  };
}

async function removeRunOwnedToolchain(input: {
  staging: RunOwnedToolchain;
  entries: readonly Nhm2ExternalNumericalKernelLedgerEntryV1[];
}): Promise<void> {
  const observedRoot = await fs.lstat(input.staging.rootPath);
  if (
    observedRoot.isSymbolicLink() ||
    !observedRoot.isDirectory() ||
    observedRoot.dev !== input.staging.rootIdentity.dev ||
    observedRoot.ino !== input.staging.rootIdentity.ino
  ) {
    fail(
      "staging_cleanup_identity_changed",
      "Run-owned toolchain root changed identity before cleanup.",
    );
  }
  await fs.chmod(input.staging.rootPath, 0o700);
  for (const relativeDirectory of input.staging.directories) {
    await fs
      .chmod(
        path.resolve(input.staging.rootPath, ...relativeDirectory.split("/")),
        0o700,
      )
      .catch(() => undefined);
  }
  for (const entry of input.entries) {
    const absolutePath = path.resolve(
      input.staging.rootPath,
      ...entry.relativePath.split("/"),
    );
    if (!isContainedPath(input.staging.rootPath, absolutePath)) {
      fail("staging_cleanup_path_escape", "Staging cleanup path escaped.");
    }
    const stat = await fs.lstat(absolutePath);
    if (!stat.isFile() && !stat.isSymbolicLink()) {
      fail(
        "staging_cleanup_entry_changed",
        `Staging cleanup entry changed type: ${entry.relativePath}.`,
      );
    }
    if (stat.isFile()) await fs.chmod(absolutePath, 0o600);
    await fs.unlink(absolutePath);
  }
  for (const relativeDirectory of [...input.staging.directories].sort(
    (left, right) => right.split("/").length - left.split("/").length,
  )) {
    await fs.rmdir(
      path.resolve(input.staging.rootPath, ...relativeDirectory.split("/")),
    );
  }
  await fs.rmdir(input.staging.rootPath);
}

type OutputRootIdentity = {
  dev: number;
  ino: number;
};

async function prepareFreshOutputRoot(
  outputRoot: string,
): Promise<OutputRootIdentity> {
  const absolute = path.resolve(outputRoot);
  try {
    await fs.lstat(absolute);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const parent = path.dirname(absolute);
      await assertExistingPathChainSafe(parent, "output root parent");
      await fs.mkdir(absolute);
      await assertExistingPathChainSafe(absolute, "output root");
      const created = await fs.lstat(absolute);
      if (created.isSymbolicLink() || !created.isDirectory()) {
        fail(
          "regular_directory_required",
          "Fresh output root is not a non-symbolic directory.",
        );
      }
      return { dev: created.dev, ino: created.ino };
    }
    throw error;
  }
  throw new Nhm2ExternalNumericalKernelExecutorError(
    "output_root_preexisting",
    "Output root must not exist before execution; a fresh directory is required.",
  );
}

async function assertOutputRootIdentity(
  outputRoot: string,
  expected: OutputRootIdentity,
): Promise<void> {
  const absolute = path.resolve(outputRoot);
  await assertExistingPathChainSafe(absolute, "output root");
  const observed = await fs.lstat(absolute);
  if (
    observed.isSymbolicLink() ||
    !observed.isDirectory() ||
    observed.dev !== expected.dev ||
    observed.ino !== expected.ino
  ) {
    fail(
      "output_root_replaced",
      "Output root identity changed during solver execution.",
    );
  }
}

function resolveArguments(
  spec: Nhm2ExternalNumericalKernelRunSpecV1,
): string[] {
  const inputRoot = path.resolve(spec.ledgers.input.rootPath);
  const outputRoot = path.resolve(spec.outputRoot);
  return spec.arguments.map((argument) => {
    switch (argument.kind) {
      case "literal":
        return argument.value;
      case "input_path":
        return path.join(inputRoot, ...argument.relativePath.split("/"));
      case "output_path":
        return path.join(outputRoot, ...argument.relativePath.split("/"));
      case "output_root":
        return outputRoot;
    }
  });
}

async function runProcess(input: {
  command: string;
  args: string[];
  cwd: string;
  environment: Record<string, string>;
  timeoutMs: number;
  maxCapturedOutputBytes: number;
}): Promise<ProcessResult> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  return new Promise((resolve) => {
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);
    let timedOut = false;
    let outputLimitExceeded = false;
    let spawnError: string | null = null;
    let settled = false;
    let capturedBytes = 0;
    const child = spawn(input.command, input.args, {
      cwd: input.cwd,
      env: { ...input.environment },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const append = (current: Buffer, chunk: Buffer): Buffer => {
      const nextCapturedBytes = capturedBytes + chunk.byteLength;
      if (nextCapturedBytes > input.maxCapturedOutputBytes) {
        outputLimitExceeded = true;
        child.kill();
        return current;
      }
      capturedBytes = nextCapturedBytes;
      return Buffer.concat(
        [current, chunk],
        current.byteLength + chunk.byteLength,
      );
    };
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout = append(stdout, chunk);
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr = append(stderr, chunk);
    });
    child.on("error", (error) => {
      spawnError = error.message;
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, input.timeoutMs);
    const finish = (exitCode: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const completed = Date.now();
      resolve({
        command: input.command,
        args: [...input.args],
        cwd: input.cwd,
        environment: { ...input.environment },
        startedAt,
        completedAt: new Date(completed).toISOString(),
        durationMs: Math.max(0, completed - started),
        exitCode,
        signal,
        stdout: stdout.toString("utf8"),
        stderr: stderr.toString("utf8"),
        stdoutSha256: sha256(stdout),
        stderrSha256: sha256(stderr),
        stdoutBytes: stdout.byteLength,
        stderrBytes: stderr.byteLength,
        timedOut,
        outputLimitExceeded,
        spawnError,
      });
    };
    child.on("close", finish);
  });
}

async function observeOutputs(
  spec: Nhm2ExternalNumericalKernelRunSpecV1,
): Promise<Nhm2ExternalNumericalKernelOutputObservationV1[]> {
  const tree = await observeTree({
    rootPath: path.resolve(spec.outputRoot),
    label: "solver output",
    maxFileBytes: spec.maxOutputAggregateBytes,
  });
  const expectedByPath = new Map(
    spec.expectedOutputs.map((entry) => [entry.relativePath, entry]),
  );
  const expectedPaths = [...expectedByPath.keys()].sort(compareUtf8);
  const expectedDirectories = expectedDirectoriesForFiles(expectedPaths);
  if (
    JSON.stringify(tree.files.map((entry) => entry.relativePath)) !==
      JSON.stringify(expectedPaths) ||
    JSON.stringify(tree.directories) !== JSON.stringify(expectedDirectories)
  ) {
    fail(
      "output_inventory_mismatch",
      "Solver output has missing or extra files/directories.",
    );
  }
  let aggregateBytes = 0;
  const outputs = tree.files.map((entry) => {
    const expected = expectedByPath.get(entry.relativePath);
    if (expected == null) {
      throw new Nhm2ExternalNumericalKernelExecutorError(
        "output_inventory_mismatch",
        "Unexpected solver output was observed.",
      );
    }
    if (entry.sizeBytes > expected.maxBytes) {
      fail(
        "filesystem_resource_limit_exceeded",
        `Solver output exceeds its role limit: ${expected.role}.`,
      );
    }
    aggregateBytes += entry.sizeBytes;
    return {
      role: expected.role,
      relativePath: entry.relativePath,
      sha256: entry.sha256,
      sizeBytes: entry.sizeBytes,
      modifiedAt: entry.modifiedAt,
      freshness: "new" as const,
    };
  });
  if (aggregateBytes > spec.maxOutputAggregateBytes) {
    fail(
      "filesystem_resource_limit_exceeded",
      "Solver output exceeds the aggregate byte limit.",
    );
  }
  return outputs.sort((left, right) => compareUtf8(left.role, right.role));
}

const ledgersEqual = (
  left: Record<
    Nhm2ExternalNumericalKernelLedgerKind,
    Nhm2ExternalNumericalKernelLedgerObservationV1
  >,
  right: Record<
    Nhm2ExternalNumericalKernelLedgerKind,
    Nhm2ExternalNumericalKernelLedgerObservationV1
  >,
): boolean =>
  left.toolchain.ledgerSha256 === right.toolchain.ledgerSha256 &&
  left.input.ledgerSha256 === right.input.ledgerSha256 &&
  JSON.stringify(left.toolchain.entries) ===
    JSON.stringify(right.toolchain.entries) &&
  JSON.stringify(left.input.entries) === JSON.stringify(right.input.entries);

export async function executeNhm2ExternalNumericalKernel(
  spec: Nhm2ExternalNumericalKernelRunSpecV1,
  hooks: Nhm2ExternalNumericalKernelExecutorHooksV1 = {},
): Promise<Nhm2ExternalNumericalKernelObservationV1> {
  validateSpec(spec);
  const executable = await observeExecutable(spec);
  const preRunLedgers = {
    toolchain: await observeLedger(spec.ledgers.toolchain, spec),
    input: await observeLedger(spec.ledgers.input, spec),
  };
  const staging = await createRunOwnedToolchain(spec);
  let processObservation: ProcessResult | null = null;
  let preSpawnStagedLedger: Nhm2ExternalNumericalKernelLedgerObservationV1 | null =
    null;
  let postRunStagedLedger: Nhm2ExternalNumericalKernelLedgerObservationV1 | null =
    null;
  let outputs: Nhm2ExternalNumericalKernelOutputObservationV1[] | null = null;
  let postRunLedgers: Record<
    Nhm2ExternalNumericalKernelLedgerKind,
    Nhm2ExternalNumericalKernelLedgerObservationV1
  > | null = null;
  let operationError: unknown = null;
  try {
    await hooks.afterRunOwnedToolchainStaged?.();
    const stagedLedgerDeclaration: Nhm2ExternalNumericalKernelSealedLedgerV1 = {
      ...spec.ledgers.toolchain,
      rootPath: staging.rootPath,
    };
    preSpawnStagedLedger = await observeLedger(stagedLedgerDeclaration, spec);
    const outputRootIdentity = await prepareFreshOutputRoot(spec.outputRoot);
    processObservation = await runProcess({
      command: staging.executablePath,
      args: resolveArguments(spec),
      cwd: path.resolve(spec.outputRoot),
      environment: spec.environment,
      timeoutMs: spec.timeoutMs,
      maxCapturedOutputBytes: spec.maxCapturedOutputBytes,
    });
    if (
      processObservation.spawnError != null ||
      processObservation.timedOut ||
      processObservation.outputLimitExceeded ||
      processObservation.exitCode !== 0 ||
      processObservation.signal != null
    ) {
      fail(
        "external_process_failed",
        "External numerical kernel did not complete successfully.",
        processObservation,
      );
    }
    await assertOutputRootIdentity(spec.outputRoot, outputRootIdentity);
    outputs = await observeOutputs(spec);
    try {
      postRunStagedLedger = await observeLedger(stagedLedgerDeclaration, spec);
      postRunLedgers = {
        toolchain: await observeLedger(spec.ledgers.toolchain, spec),
        input: await observeLedger(spec.ledgers.input, spec),
      };
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "unknown ledger error";
      throw new Nhm2ExternalNumericalKernelExecutorError(
        "sealed_ledger_mutated",
        `Run-owned toolchain, source toolchain, or input bytes changed during execution: ${detail}`,
        processObservation,
      );
    }
  } catch (error) {
    operationError = error;
  }
  try {
    await removeRunOwnedToolchain({
      staging,
      entries: spec.ledgers.toolchain.entries,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "unknown staging cleanup error";
    throw new Nhm2ExternalNumericalKernelExecutorError(
      "staging_cleanup_failed",
      `Run-owned toolchain could not be removed safely: ${detail}`,
      processObservation,
    );
  }
  if (operationError != null) {
    throw operationError;
  }
  const completedProcess = requireExecutionValue(
    processObservation,
    "a process observation",
    processObservation,
  );
  const completedPreSpawnStagedLedger = requireExecutionValue(
    preSpawnStagedLedger,
    "a pre-spawn staged ledger",
    processObservation,
  );
  const completedPostRunStagedLedger = requireExecutionValue(
    postRunStagedLedger,
    "a post-run staged ledger",
    processObservation,
  );
  const completedOutputs = requireExecutionValue(
    outputs,
    "an output inventory",
    processObservation,
  );
  const completedPostRunLedgers = requireExecutionValue(
    postRunLedgers,
    "post-run source ledgers",
    processObservation,
  );
  if (
    !ledgersEqual(preRunLedgers, completedPostRunLedgers) ||
    completedPreSpawnStagedLedger.ledgerSha256 !==
      completedPostRunStagedLedger.ledgerSha256 ||
    JSON.stringify(completedPreSpawnStagedLedger.entries) !==
      JSON.stringify(completedPostRunStagedLedger.entries)
  ) {
    fail(
      "sealed_ledger_mutated",
      "Run-owned toolchain, source toolchain, or input bytes changed during execution.",
      completedProcess,
    );
  }
  const stagingIdentitySha256 =
    computeNhm2ExternalNumericalKernelStagingIdentitySha256({
      rootPath: staging.rootPath,
      executableRelativePath: staging.executableRelativePath,
      executablePath: staging.executablePath,
      sourceLedgerSha256: spec.ledgers.toolchain.ledgerSha256,
      stagedLedger: completedPreSpawnStagedLedger,
    });
  return {
    artifactId: "nhm2.external_numerical_kernel_observation",
    contractVersion: NHM2_EXTERNAL_NUMERICAL_KERNEL_OBSERVATION_VERSION,
    generatedAt: new Date().toISOString(),
    status: "execution_observed_scientific_replay_required",
    lane: spec.lane,
    solver: { ...spec.solver },
    executable,
    runOwnedToolchain: {
      authority: "executor_created_fresh_copy",
      stagingIdentitySha256,
      rootPath: staging.rootPath,
      executableRelativePath: staging.executableRelativePath,
      executablePath: staging.executablePath,
      sourceLedgerSha256: spec.ledgers.toolchain.ledgerSha256,
      preSpawnLedger: completedPreSpawnStagedLedger,
      postRunLedger: completedPostRunStagedLedger,
      permissions: {
        policy: "owner_read_execute_only_best_effort/v1",
        executableMode: "0500",
        executableAuxiliaryMode: "0500",
        dataFileMode: "0400",
        directoryMode: "0500",
        osLevelImmutabilityAsserted: false,
      },
      removedAfterExecution: true,
    },
    preRunLedgers,
    process: completedProcess,
    outputs: completedOutputs,
    outputInventorySha256: outputInventorySha256(completedOutputs),
    postRunLedgers: completedPostRunLedgers,
    blockers: [
      "independent_scientific_content_replay_required",
      "same_user_staged_toolchain_mutation_exclusion_not_os_enforced",
    ],
    claimBoundary: {
      externalBinaryExecutionObserved: true,
      solverOutputScientificallyValidated: false,
      theoryClosureClaimAllowed: false,
      empiricalValidationEstablished: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
      operatingSystemHermeticityAsserted: false,
      networkIsolationAsserted: false,
      filesystemSandboxAsserted: false,
    },
  };
}
