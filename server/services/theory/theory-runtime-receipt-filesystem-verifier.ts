import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  isTheoryRuntimeReceiptV1,
  validateTheoryRuntimeOutputManifestV1,
  type TheoryRuntimeArtifactFreshness,
  type TheoryRuntimeOutputManifestEntryV1,
  type TheoryRuntimeOutputManifestV1,
  type TheoryRuntimeReceiptV1,
  type TheoryRuntimeSnapshotEntryV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";
import {
  sha256TheoryRuntimeFile,
  sha256TheoryRuntimeSnapshotEntries,
  type TheoryRuntimePreSpawnSnapshotCommitmentV1,
} from "./runtime-artifact-manifest";

const PRE_SPAWN_COMMITMENT_ROOT =
  "artifacts/research/theory-runtime-pre-spawn-snapshots/";

export type VerifiedTheoryRuntimeFileV1 = TheoryRuntimeOutputManifestEntryV1 & {
  absolutePath: string;
  bytes: Buffer;
};

export type TheoryRuntimeReceiptFilesystemVerificationV1 = {
  ok: boolean;
  blockers: string[];
  projectRoot: string;
  outputDirectory: string | null;
  manifestPath: string | null;
  files: VerifiedTheoryRuntimeFileV1[];
  freshnessProofVerified: boolean;
};

const isPortableRepoPath = (value: string): boolean =>
  value.length > 0 &&
  !value.includes("\\") &&
  !path.posix.isAbsolute(value) &&
  !path.win32.isAbsolute(value) &&
  !value.split("/").includes("..") &&
  !/(^|\/)latest(?:\.|\/|$)/i.test(value);

const normalizeRepoPath = (value: string): string =>
  value.replace(/\\/g, "/").replace(/^\.\//, "");

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length === 0 ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stable);
  if (value == null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stable(entry)]),
  );
};

const sameJson = (left: unknown, right: unknown): boolean =>
  JSON.stringify(stable(left)) === JSON.stringify(stable(right));

const unique = (values: string[]): string[] => Array.from(new Set(values));

const expectedFreshness = (
  before: TheoryRuntimeSnapshotEntryV1 | undefined,
  after: TheoryRuntimeOutputManifestEntryV1,
): TheoryRuntimeArtifactFreshness =>
  before == null
    ? "new"
    : before.sha256.toLowerCase() !== after.sha256.toLowerCase() ||
        before.sizeBytes !== after.sizeBytes
      ? "changed"
      : "preexisting";

async function assertRegularFileInside(input: {
  projectRoot: string;
  outputDirectory: string;
  repoPath: string;
}): Promise<{ absolutePath: string; blocker: string | null }> {
  if (!isPortableRepoPath(input.repoPath)) {
    return { absolutePath: "", blocker: `path_not_pinned:${input.repoPath}` };
  }
  const absolutePath = path.resolve(input.projectRoot, input.repoPath);
  if (!isInside(input.outputDirectory, absolutePath)) {
    return {
      absolutePath,
      blocker: `path_outside_output_directory:${input.repoPath}`,
    };
  }
  try {
    const stat = await fs.lstat(absolutePath);
    if (stat.isSymbolicLink()) {
      return { absolutePath, blocker: `symlink_forbidden:${input.repoPath}` };
    }
    if (!stat.isFile()) {
      return {
        absolutePath,
        blocker: `regular_file_required:${input.repoPath}`,
      };
    }
    const realOutput = await fs.realpath(input.outputDirectory);
    const realFile = await fs.realpath(absolutePath);
    if (!isInside(realOutput, realFile)) {
      return { absolutePath, blocker: `realpath_escape:${input.repoPath}` };
    }
    return { absolutePath, blocker: null };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code ?? "unknown";
    return {
      absolutePath,
      blocker: `file_unreadable:${input.repoPath}:${code}`,
    };
  }
}

async function readRegularProjectFile(input: {
  projectRoot: string;
  repoPath: string;
}): Promise<{ bytes: Buffer | null; blocker: string | null }> {
  if (!isPortableRepoPath(input.repoPath)) {
    return { bytes: null, blocker: `path_not_pinned:${input.repoPath}` };
  }
  const absolutePath = path.resolve(input.projectRoot, input.repoPath);
  if (!isInside(input.projectRoot, absolutePath)) {
    return { bytes: null, blocker: `path_outside_project:${input.repoPath}` };
  }
  try {
    const stat = await fs.lstat(absolutePath);
    if (stat.isSymbolicLink())
      return { bytes: null, blocker: `symlink_forbidden:${input.repoPath}` };
    if (!stat.isFile())
      return {
        bytes: null,
        blocker: `regular_file_required:${input.repoPath}`,
      };
    const [realProject, realFile] = await Promise.all([
      fs.realpath(input.projectRoot),
      fs.realpath(absolutePath),
    ]);
    if (!isInside(realProject, realFile))
      return { bytes: null, blocker: `realpath_escape:${input.repoPath}` };
    return { bytes: await fs.readFile(absolutePath), blocker: null };
  } catch (error) {
    return {
      bytes: null,
      blocker: `file_unreadable:${input.repoPath}:${(error as NodeJS.ErrnoException).code ?? "unknown"}`,
    };
  }
}

function isPreSpawnCommitment(
  value: unknown,
): value is TheoryRuntimePreSpawnSnapshotCommitmentV1 {
  if (value == null || typeof value !== "object" || Array.isArray(value))
    return false;
  const record = value as Record<string, unknown>;
  const keys = [
    "artifactId",
    "schemaVersion",
    "committedAt",
    "requestId",
    "runtimeId",
    "outputDirectory",
    "beforeCapturedAt",
    "gitSha",
    "sourceTreeAlgorithm",
    "sourceTreeSha256",
    "worktreeClean",
    "outputDirectoryInitiallyEmpty",
    "beforeSnapshotSha256",
    "beforeEntries",
  ];
  return (
    Object.keys(record).length === keys.length &&
    Object.keys(record).every((key) => keys.includes(key)) &&
    record.artifactId === "theory_runtime_pre_spawn_snapshot_commitment" &&
    record.schemaVersion ===
      "theory_runtime_pre_spawn_snapshot_commitment/v1" &&
    typeof record.committedAt === "string" &&
    Number.isFinite(Date.parse(record.committedAt)) &&
    typeof record.requestId === "string" &&
    record.requestId.length > 0 &&
    typeof record.runtimeId === "string" &&
    record.runtimeId.length > 0 &&
    typeof record.outputDirectory === "string" &&
    record.outputDirectory.length > 0 &&
    typeof record.beforeCapturedAt === "string" &&
    Number.isFinite(Date.parse(record.beforeCapturedAt)) &&
    (record.gitSha === null ||
      (typeof record.gitSha === "string" &&
        /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(record.gitSha))) &&
    record.sourceTreeAlgorithm === "git_head_tree_clean_status_sha256/v1" &&
    (record.sourceTreeSha256 === null ||
      (typeof record.sourceTreeSha256 === "string" &&
        /^[a-f0-9]{64}$/i.test(record.sourceTreeSha256))) &&
    typeof record.worktreeClean === "boolean" &&
    typeof record.outputDirectoryInitiallyEmpty === "boolean" &&
    typeof record.beforeSnapshotSha256 === "string" &&
    /^[a-f0-9]{64}$/i.test(record.beforeSnapshotSha256) &&
    Array.isArray(record.beforeEntries)
  );
}

async function inventoryOutputDirectory(input: {
  projectRoot: string;
  outputDirectory: string;
  manifestPath: string;
}): Promise<{ paths: string[]; blockers: string[] }> {
  const paths: string[] = [];
  const blockers: string[] = [];

  const visit = async (directory: string): Promise<void> => {
    const entries = await fs.readdir(directory, {
      withFileTypes: true,
      encoding: "utf8",
    });
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const repoPath = normalizeRepoPath(
        path.relative(input.projectRoot, absolutePath),
      );
      if (entry.isSymbolicLink()) {
        blockers.push(`symlink_forbidden:${repoPath}`);
        continue;
      }
      if (entry.isDirectory()) {
        await visit(absolutePath);
        continue;
      }
      if (!entry.isFile()) {
        blockers.push(`regular_file_required:${repoPath}`);
        continue;
      }
      if (repoPath === normalizeRepoPath(input.manifestPath)) {
        continue;
      }
      paths.push(repoPath);
    }
  };

  await visit(input.outputDirectory);
  return { paths: paths.sort(), blockers };
}

export async function verifyTheoryRuntimeReceiptFilesystem(input: {
  projectRoot: string;
  receipt: TheoryRuntimeReceiptV1;
}): Promise<TheoryRuntimeReceiptFilesystemVerificationV1> {
  const projectRoot = path.resolve(input.projectRoot);
  const blockers: string[] = [];
  const files: VerifiedTheoryRuntimeFileV1[] = [];

  if (!isTheoryRuntimeReceiptV1(input.receipt)) {
    return {
      ok: false,
      blockers: ["runtime_receipt_schema_invalid"],
      projectRoot,
      outputDirectory: null,
      manifestPath: null,
      files,
      freshnessProofVerified: false,
    };
  }
  const manifest = input.receipt.outputs.artifactManifest;
  if (manifest == null) blockers.push("runtime_output_manifest_missing");
  if (manifest != null) {
    blockers.push(
      ...validateTheoryRuntimeOutputManifestV1(manifest).map(
        (issue) => `runtime_output_manifest_schema_invalid:${issue}`,
      ),
    );
  }

  const outputDirectoryValue = manifest?.outputDirectory ?? null;
  const manifestPathValue = manifest?.manifestPath ?? null;
  if (
    outputDirectoryValue == null ||
    !isPortableRepoPath(outputDirectoryValue)
  ) {
    blockers.push("runtime_output_directory_not_pinned");
  }
  if (manifestPathValue == null || !isPortableRepoPath(manifestPathValue)) {
    blockers.push("runtime_manifest_path_not_pinned");
  }
  if (
    manifest == null ||
    outputDirectoryValue == null ||
    manifestPathValue == null
  ) {
    return {
      ok: false,
      blockers: unique(blockers),
      projectRoot,
      outputDirectory: null,
      manifestPath: manifestPathValue,
      files,
      freshnessProofVerified: false,
    };
  }

  const outputDirectory = path.resolve(projectRoot, outputDirectoryValue);
  if (
    !isInside(projectRoot, outputDirectory) ||
    outputDirectory === projectRoot
  ) {
    blockers.push("runtime_output_directory_outside_project");
  }
  try {
    const outputStat = await fs.lstat(outputDirectory);
    if (outputStat.isSymbolicLink())
      blockers.push("runtime_output_directory_symlink_forbidden");
    if (!outputStat.isDirectory())
      blockers.push("runtime_output_directory_not_directory");
    const [realProject, realOutput] = await Promise.all([
      fs.realpath(projectRoot),
      fs.realpath(outputDirectory),
    ]);
    if (!isInside(realProject, realOutput) || realOutput === realProject) {
      blockers.push("runtime_output_directory_realpath_escape");
    }
  } catch (error) {
    blockers.push(
      `runtime_output_directory_unreadable:${(error as NodeJS.ErrnoException).code ?? "unknown"}`,
    );
  }

  const manifestFile = await assertRegularFileInside({
    projectRoot,
    outputDirectory,
    repoPath: manifestPathValue,
  });
  if (manifestFile.blocker)
    blockers.push(`runtime_manifest:${manifestFile.blocker}`);
  if (manifestFile.blocker == null) {
    try {
      const manifestSha256 = await sha256TheoryRuntimeFile(
        manifestFile.absolutePath,
      );
      if (
        manifestSha256.toLowerCase() !== manifest.manifestSha256?.toLowerCase()
      ) {
        blockers.push("runtime_manifest_sha256_mismatch");
      }
      const diskManifest = JSON.parse(
        await fs.readFile(manifestFile.absolutePath, "utf8"),
      ) as unknown;
      const expectedDiskManifest: TheoryRuntimeOutputManifestV1 = {
        ...manifest,
        manifestSha256: null,
      };
      if (!sameJson(diskManifest, expectedDiskManifest)) {
        blockers.push("runtime_manifest_embedded_content_mismatch");
      }
    } catch (error) {
      blockers.push(
        `runtime_manifest_unreadable:${(error as NodeJS.ErrnoException).code ?? "invalid_json"}`,
      );
    }
  }

  if (manifest.boundToExecution !== true)
    blockers.push("runtime_manifest_not_execution_bound");
  if (manifest.runtimeId !== input.receipt.runtimeId)
    blockers.push("runtime_manifest_runtime_id_mismatch");
  if (input.receipt.args.requestId !== manifest.requestId)
    blockers.push("runtime_manifest_request_id_mismatch");
  if (manifest.gitSha !== input.receipt.provenance.gitSha)
    blockers.push("runtime_manifest_git_sha_mismatch");
  if (
    manifest.startedAt !== input.receipt.provenance.startedAt ||
    manifest.completedAt !== input.receipt.provenance.completedAt
  ) {
    blockers.push("runtime_manifest_execution_interval_mismatch");
  }
  if (input.receipt.execution?.outputDirectory !== manifest.outputDirectory) {
    blockers.push("runtime_execution_output_directory_mismatch");
  }

  const entryPaths = manifest.entries.map((entry) => entry.path);
  if (new Set(entryPaths).size !== entryPaths.length)
    blockers.push("runtime_manifest_duplicate_paths");
  const beforePaths =
    manifest.freshnessProof?.beforeEntries.map((entry) => entry.path) ?? [];
  if (new Set(beforePaths).size !== beforePaths.length)
    blockers.push("runtime_before_snapshot_duplicate_paths");

  for (const entry of manifest.entries) {
    const located = await assertRegularFileInside({
      projectRoot,
      outputDirectory,
      repoPath: entry.path,
    });
    if (located.blocker) {
      blockers.push(`runtime_artifact:${located.blocker}`);
      continue;
    }
    try {
      const handle = await fs.open(located.absolutePath, "r");
      let beforeStat;
      let afterStat;
      let bytes: Buffer;
      try {
        beforeStat = await handle.stat();
        bytes = await handle.readFile();
        afterStat = await handle.stat();
      } finally {
        await handle.close();
      }
      if (
        beforeStat.size !== afterStat.size ||
        beforeStat.mtimeMs !== afterStat.mtimeMs
      ) {
        blockers.push(`runtime_artifact_changed_while_reading:${entry.path}`);
        continue;
      }
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (sha256.toLowerCase() !== entry.sha256.toLowerCase()) {
        blockers.push(`runtime_artifact_sha256_mismatch:${entry.path}`);
      }
      if (beforeStat.size !== entry.sizeBytes)
        blockers.push(`runtime_artifact_size_mismatch:${entry.path}`);
      files.push({ ...entry, absolutePath: located.absolutePath, bytes });
    } catch (error) {
      blockers.push(
        `runtime_artifact_unreadable:${entry.path}:${(error as NodeJS.ErrnoException).code ?? "unknown"}`,
      );
    }
  }

  try {
    const inventory = await inventoryOutputDirectory({
      projectRoot,
      outputDirectory,
      manifestPath: manifestPathValue,
    });
    blockers.push(...inventory.blockers);
    const expectedPaths = [...entryPaths].sort();
    if (!sameJson(inventory.paths, expectedPaths))
      blockers.push("runtime_manifest_inventory_mismatch");
  } catch (error) {
    blockers.push(
      `runtime_output_inventory_failed:${(error as NodeJS.ErrnoException).code ?? "unknown"}`,
    );
  }

  let freshnessProofVerified = false;
  const proof = manifest.freshnessProof;
  if (proof == null) {
    blockers.push("runtime_freshness_snapshot_proof_missing");
  } else {
    const beforeHash = sha256TheoryRuntimeSnapshotEntries(proof.beforeEntries);
    const afterEntries = manifest.entries.map(
      ({ freshness: _freshness, ...entry }) => entry,
    );
    const afterHash = sha256TheoryRuntimeSnapshotEntries(afterEntries);
    if (beforeHash !== proof.beforeSnapshotSha256.toLowerCase()) {
      blockers.push("runtime_before_snapshot_sha256_mismatch");
    }
    if (afterHash !== proof.afterSnapshotSha256.toLowerCase()) {
      blockers.push("runtime_after_snapshot_sha256_mismatch");
    }
    if (!proof.beforeCommitmentPath.startsWith(PRE_SPAWN_COMMITMENT_ROOT)) {
      blockers.push("runtime_before_commitment_store_path_invalid");
    }
    const commitmentRead = await readRegularProjectFile({
      projectRoot,
      repoPath: proof.beforeCommitmentPath,
    });
    if (commitmentRead.blocker != null || commitmentRead.bytes == null) {
      blockers.push(
        `runtime_before_commitment_unreadable:${commitmentRead.blocker ?? "unknown"}`,
      );
    } else {
      const commitmentSha256 = createHash("sha256")
        .update(commitmentRead.bytes)
        .digest("hex");
      if (commitmentSha256 !== proof.beforeCommitmentSha256.toLowerCase()) {
        blockers.push("runtime_before_commitment_sha256_mismatch");
      }
      let commitment: unknown;
      try {
        commitment = JSON.parse(commitmentRead.bytes.toString("utf8"));
      } catch {
        commitment = null;
      }
      if (!isPreSpawnCommitment(commitment)) {
        blockers.push("runtime_before_commitment_schema_invalid");
      } else {
        if (
          commitment.requestId !== manifest.requestId ||
          commitment.runtimeId !== manifest.runtimeId ||
          commitment.outputDirectory !== manifest.outputDirectory ||
          commitment.beforeCapturedAt !== proof.beforeCapturedAt ||
          commitment.gitSha !== manifest.gitSha ||
          commitment.beforeSnapshotSha256.toLowerCase() !== beforeHash ||
          !sameJson(commitment.beforeEntries, proof.beforeEntries)
        ) {
          blockers.push("runtime_before_commitment_content_mismatch");
        }
        if (
          commitment.outputDirectoryInitiallyEmpty !==
            (proof.beforeEntries.length === 0) ||
          !commitment.outputDirectoryInitiallyEmpty
        ) {
          blockers.push("runtime_output_directory_not_exclusive");
        }
        if (!commitment.worktreeClean || commitment.sourceTreeSha256 == null) {
          blockers.push("runtime_source_tree_not_clean_or_unbound");
        }
        const startedAt = input.receipt.provenance.startedAt;
        if (
          startedAt != null &&
          Date.parse(commitment.committedAt) > Date.parse(startedAt)
        ) {
          blockers.push("runtime_before_commitment_after_execution_started");
        }
      }
    }
    const beforeByPath = new Map(
      proof.beforeEntries.map((entry) => [entry.path, entry]),
    );
    for (const entry of manifest.entries) {
      if (
        expectedFreshness(beforeByPath.get(entry.path), entry) !==
        entry.freshness
      ) {
        blockers.push(
          `runtime_freshness_classification_mismatch:${entry.path}`,
        );
      }
    }
    const startedAt = input.receipt.provenance.startedAt;
    const completedAt = input.receipt.provenance.completedAt;
    if (
      startedAt != null &&
      Date.parse(proof.beforeCapturedAt) > Date.parse(startedAt)
    ) {
      blockers.push("runtime_before_snapshot_after_execution_started");
    }
    if (
      completedAt != null &&
      Date.parse(proof.afterCapturedAt) < Date.parse(completedAt)
    ) {
      blockers.push("runtime_after_snapshot_before_execution_completed");
    }
    freshnessProofVerified = !blockers.some(
      (blocker) =>
        blocker.startsWith("runtime_before_snapshot_") ||
        blocker.startsWith("runtime_before_commitment_") ||
        blocker.startsWith("runtime_after_snapshot_") ||
        blocker.startsWith("runtime_freshness_"),
    );
  }

  return {
    ok: blockers.length === 0,
    blockers: unique(blockers),
    projectRoot,
    outputDirectory,
    manifestPath: manifestPathValue,
    files,
    freshnessProofVerified,
  };
}
