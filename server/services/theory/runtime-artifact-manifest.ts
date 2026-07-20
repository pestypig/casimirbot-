import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import {
  buildTheoryRuntimeOutputManifestV1,
  type TheoryRuntimeFreshnessProofV1,
  type TheoryRuntimeOutputManifestEntryV1,
  type TheoryRuntimeOutputManifestV1,
  type TheoryRuntimeSnapshotEntryV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";
import { writeTheoryRuntimeJsonFile } from "./runtime-atomic-json-store";

const OUTPUT_MANIFEST_PREFIX = "theory-runtime-output-manifest-";
const OUTPUT_MANIFEST_SUFFIX = ".v1.json";
const PRE_SPAWN_COMMITMENT_ROOT =
  "artifacts/research/theory-runtime-pre-spawn-snapshots";

export type TheoryRuntimePreSpawnSnapshotCommitmentV1 = {
  artifactId: "theory_runtime_pre_spawn_snapshot_commitment";
  schemaVersion: "theory_runtime_pre_spawn_snapshot_commitment/v1";
  committedAt: string;
  requestId: string;
  runtimeId: string;
  outputDirectory: string;
  beforeCapturedAt: string;
  gitSha: string | null;
  sourceTreeAlgorithm: "git_head_tree_clean_status_sha256/v1";
  sourceTreeSha256: string | null;
  worktreeClean: boolean;
  outputDirectoryInitiallyEmpty: boolean;
  beforeSnapshotSha256: string;
  beforeEntries: TheoryRuntimeSnapshotEntryV1[];
};

export type TheoryRuntimePreSpawnSnapshotCommitmentRefV1 = {
  path: string;
  sha256: string;
  committedAt: string;
};

export type TheoryRuntimeArtifactSnapshotEntry = {
  path: string;
  absolutePath: string;
  sha256: string;
  sizeBytes: number;
  modifiedAt: string;
  modifiedAtMs: number;
};

export type TheoryRuntimeArtifactSnapshot = Map<
  string,
  TheoryRuntimeArtifactSnapshotEntry
>;

function canonicalSnapshotEntries(
  snapshot: TheoryRuntimeArtifactSnapshot,
): TheoryRuntimeSnapshotEntryV1[] {
  return Array.from(snapshot.values())
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((entry) => ({
      path: entry.path,
      sha256: entry.sha256,
      sizeBytes: entry.sizeBytes,
      modifiedAt: entry.modifiedAt,
    }));
}

export function sha256TheoryRuntimeSnapshotEntries(
  entries: readonly TheoryRuntimeSnapshotEntryV1[],
): string {
  const canonical = [...entries]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((entry) => ({
      path: entry.path,
      sha256: entry.sha256.toLowerCase(),
      sizeBytes: entry.sizeBytes,
      modifiedAt: entry.modifiedAt,
    }));
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function buildTheoryRuntimeFreshnessProof(input: {
  before: TheoryRuntimeArtifactSnapshot;
  after: TheoryRuntimeArtifactSnapshot;
  beforeCapturedAt: string;
  afterCapturedAt: string;
  beforeCommitmentPath: string;
  beforeCommitmentSha256: string;
}): TheoryRuntimeFreshnessProofV1 {
  const beforeEntries = canonicalSnapshotEntries(input.before);
  const afterEntries = canonicalSnapshotEntries(input.after);
  return {
    schemaVersion: "theory_runtime_freshness_snapshot/v1",
    algorithm: "sha256_size_pre_post/v1",
    beforeCapturedAt: input.beforeCapturedAt,
    afterCapturedAt: input.afterCapturedAt,
    beforeCommitmentPath: input.beforeCommitmentPath,
    beforeCommitmentSha256: input.beforeCommitmentSha256,
    beforeSnapshotSha256: sha256TheoryRuntimeSnapshotEntries(beforeEntries),
    afterSnapshotSha256: sha256TheoryRuntimeSnapshotEntries(afterEntries),
    beforeEntries,
  };
}

export async function writeTheoryRuntimePreSpawnSnapshotCommitment(input: {
  projectRoot: string;
  requestId: string;
  runtimeId: string;
  outputDirectory: string;
  beforeCapturedAt: string;
  gitSha: string | null;
  sourceTreeSha256: string | null;
  worktreeClean: boolean;
  before: TheoryRuntimeArtifactSnapshot;
}): Promise<TheoryRuntimePreSpawnSnapshotCommitmentRefV1> {
  const projectRoot = path.resolve(input.projectRoot);
  const commitmentRoot = path.resolve(projectRoot, PRE_SPAWN_COMMITMENT_ROOT);
  await fs.mkdir(commitmentRoot, { recursive: true });
  const [realProjectRoot, realCommitmentRoot] = await Promise.all([
    fs.realpath(projectRoot),
    fs.realpath(commitmentRoot),
  ]);
  const relativeRoot = path.relative(realProjectRoot, realCommitmentRoot);
  if (
    !relativeRoot ||
    relativeRoot.startsWith("..") ||
    path.isAbsolute(relativeRoot)
  ) {
    throw new Error("Pre-spawn commitment root escaped the project root.");
  }
  const rootStat = await fs.lstat(commitmentRoot);
  if (rootStat.isSymbolicLink()) {
    throw new Error("Pre-spawn commitment root must not be a symbolic link.");
  }
  const beforeEntries = canonicalSnapshotEntries(input.before);
  const beforeSnapshotSha256 =
    sha256TheoryRuntimeSnapshotEntries(beforeEntries);
  const committedAt = new Date().toISOString();
  const payload: TheoryRuntimePreSpawnSnapshotCommitmentV1 = {
    artifactId: "theory_runtime_pre_spawn_snapshot_commitment",
    schemaVersion: "theory_runtime_pre_spawn_snapshot_commitment/v1",
    committedAt,
    requestId: input.requestId,
    runtimeId: input.runtimeId,
    outputDirectory:
      normalizeRelativePath(
        path.relative(projectRoot, path.resolve(input.outputDirectory)),
      ) || ".",
    beforeCapturedAt: input.beforeCapturedAt,
    gitSha: input.gitSha,
    sourceTreeAlgorithm: "git_head_tree_clean_status_sha256/v1",
    sourceTreeSha256: input.sourceTreeSha256,
    worktreeClean: input.worktreeClean,
    outputDirectoryInitiallyEmpty: beforeEntries.length === 0,
    beforeSnapshotSha256,
    beforeEntries,
  };
  const requestDigest = createHash("sha256")
    .update(`${input.runtimeId}\0${input.requestId}`, "utf8")
    .digest("hex");
  const fileName = `${requestDigest}.v1.json`;
  const absolutePath = path.join(commitmentRoot, fileName);
  const bytes = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await fs.writeFile(absolutePath, bytes, { flag: "wx" });
  const fileStat = await fs.lstat(absolutePath);
  if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
    throw new Error("Pre-spawn commitment must be a regular file.");
  }
  return {
    path: normalizeRelativePath(path.relative(projectRoot, absolutePath)),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    committedAt,
  };
}

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

function isOutputManifestFile(fileName: string): boolean {
  return (
    fileName.startsWith(OUTPUT_MANIFEST_PREFIX) &&
    fileName.endsWith(OUTPUT_MANIFEST_SUFFIX)
  );
}

function safeFileToken(value: string): string {
  const safe = value.replace(/[^A-Za-z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || "runtime";
}

function safeTimestamp(value: string | null): string {
  if (!value) return Date.now().toString(36);
  return value.replace(/[^0-9A-Za-z]+/g, "");
}

function assertInsideOutputDirectory(
  outputDirectory: string,
  candidate: string,
): void {
  const relative = path.relative(outputDirectory, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      `Runtime artifact escaped the requested output directory: ${candidate}`,
    );
  }
}

async function assertConfinedOutputDirectory(
  projectRoot: string,
  outputDirectory: string,
): Promise<void> {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedOutputDirectory = path.resolve(outputDirectory);
  const relative = path.relative(resolvedProjectRoot, resolvedOutputDirectory);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      "Runtime output directory must resolve inside the project root.",
    );
  }
  const outputStat = await fs.lstat(resolvedOutputDirectory);
  if (outputStat.isSymbolicLink()) {
    throw new Error("Runtime output directory must not be a symbolic link.");
  }
  const [realProjectRoot, realOutputDirectory] = await Promise.all([
    fs.realpath(resolvedProjectRoot),
    fs.realpath(resolvedOutputDirectory),
  ]);
  const realRelative = path.relative(realProjectRoot, realOutputDirectory);
  if (
    !realRelative ||
    realRelative.startsWith("..") ||
    path.isAbsolute(realRelative)
  ) {
    throw new Error(
      "Runtime output directory must resolve inside the real project root.",
    );
  }
}

export async function sha256TheoryRuntimeFile(
  absolutePath: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(absolutePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export async function snapshotTheoryRuntimeOutput(input: {
  projectRoot: string;
  outputDirectory: string;
}): Promise<TheoryRuntimeArtifactSnapshot> {
  const projectRoot = path.resolve(input.projectRoot);
  const outputDirectory = path.resolve(input.outputDirectory);
  await assertConfinedOutputDirectory(projectRoot, outputDirectory);
  const snapshot: TheoryRuntimeArtifactSnapshot = new Map();

  async function visit(directory: string): Promise<void> {
    assertInsideOutputDirectory(outputDirectory, directory);
    let entries: Awaited<ReturnType<typeof fs.readdir>>;
    try {
      entries = await fs.readdir(directory, {
        withFileTypes: true,
        encoding: "utf8",
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      assertInsideOutputDirectory(outputDirectory, absolutePath);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        await visit(absolutePath);
        continue;
      }
      if (!entry.isFile() || isOutputManifestFile(entry.name)) continue;
      const stat = await fs.stat(absolutePath);
      const relativePath = normalizeRelativePath(
        path.relative(projectRoot, absolutePath),
      );
      snapshot.set(relativePath, {
        path: relativePath,
        absolutePath,
        sha256: await sha256TheoryRuntimeFile(absolutePath),
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        modifiedAtMs: stat.mtimeMs,
      });
    }
  }

  await visit(outputDirectory);
  return snapshot;
}

export function classifyTheoryRuntimeArtifacts(input: {
  before: TheoryRuntimeArtifactSnapshot;
  after: TheoryRuntimeArtifactSnapshot;
}): TheoryRuntimeOutputManifestEntryV1[] {
  return Array.from(input.after.values())
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((entry) => {
      const previous = input.before.get(entry.path);
      const freshness = !previous
        ? "new"
        : previous.sha256 !== entry.sha256 ||
            previous.sizeBytes !== entry.sizeBytes
          ? "changed"
          : "preexisting";
      return {
        path: entry.path,
        sha256: entry.sha256,
        sizeBytes: entry.sizeBytes,
        modifiedAt: entry.modifiedAt,
        freshness,
      };
    });
}

export async function writeTheoryRuntimeOutputManifest(input: {
  projectRoot: string;
  outputDirectory: string;
  requestId: string;
  runtimeId: string;
  gitSha: string | null;
  startedAt: string | null;
  completedAt: string | null;
  generatedAt?: string;
  entries: TheoryRuntimeOutputManifestEntryV1[];
  freshnessProof?: TheoryRuntimeFreshnessProofV1;
}): Promise<TheoryRuntimeOutputManifestV1> {
  const projectRoot = path.resolve(input.projectRoot);
  const outputDirectory = path.resolve(input.outputDirectory);
  await assertConfinedOutputDirectory(projectRoot, outputDirectory);
  const fileName = `${OUTPUT_MANIFEST_PREFIX}${safeFileToken(input.requestId)}-${safeTimestamp(input.completedAt)}${OUTPUT_MANIFEST_SUFFIX}`;
  const absoluteManifestPath = path.join(outputDirectory, fileName);
  assertInsideOutputDirectory(outputDirectory, absoluteManifestPath);
  const manifestPath = normalizeRelativePath(
    path.relative(projectRoot, absoluteManifestPath),
  );
  const relativeOutputDirectory =
    normalizeRelativePath(path.relative(projectRoot, outputDirectory)) || ".";
  const manifest = buildTheoryRuntimeOutputManifestV1({
    generatedAt: input.generatedAt,
    requestId: input.requestId,
    runtimeId: input.runtimeId,
    gitSha: input.gitSha,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    outputDirectory: relativeOutputDirectory,
    boundToExecution: true,
    manifestPath,
    manifestSha256: null,
    entries: input.entries,
    ...(input.freshnessProof ? { freshnessProof: input.freshnessProof } : {}),
  });
  await writeTheoryRuntimeJsonFile(absoluteManifestPath, manifest);
  return {
    ...manifest,
    manifestSha256: await sha256TheoryRuntimeFile(absoluteManifestPath),
  };
}
