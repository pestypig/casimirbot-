import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

export const RELEASE_SLICE_SCHEMA = "casimir_desktop_release_slice/1";
export const RELEASE_SLICE_REPORT_SCHEMA =
  "casimir_desktop_release_slice_report/1";

const execFileAsync = promisify(execFile);
const globCharacters = /[*?[\]{}]/u;

const sorted = (values) => [...values].sort((left, right) =>
  left.localeCompare(right, "en"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const fail = (message) => {
  throw new Error(`[desktop-release-slice] ${message}`);
};

export function assertSafeRepositoryPath(value, label = "path") {
  if (
    typeof value !== "string" ||
    !value ||
    value.includes("\\") ||
    path.posix.isAbsolute(value) ||
    path.posix.normalize(value) !== value ||
    value === ".." ||
    value.startsWith("../") ||
    globCharacters.test(value)
  ) {
    fail(`${label} must be an exact normalized repository-relative path`);
  }
  return value;
}

export function validateReleaseSliceManifest(value) {
  if (!value || value.schema !== RELEASE_SLICE_SCHEMA) {
    fail(`manifest schema must be ${RELEASE_SLICE_SCHEMA}`);
  }
  for (const key of [
    "ownedTrees",
    "ownedFiles",
    "sharedFiles",
    "forbiddenTrackedTrees",
    "forbiddenOwnedExtensions",
  ]) {
    if (!Array.isArray(value[key])) fail(`${key} must be an array`);
  }

  const ownedTrees = value.ownedTrees.map((entry) =>
    assertSafeRepositoryPath(entry, "owned tree"));
  const ownedFiles = value.ownedFiles.map((entry) =>
    assertSafeRepositoryPath(entry, "owned file"));
  const sharedFiles = value.sharedFiles.map((entry) => {
    const sharedPath = assertSafeRepositoryPath(entry?.path, "shared file");
    if (typeof entry.purpose !== "string" || !entry.purpose.trim()) {
      fail(`shared file ${sharedPath} requires a purpose`);
    }
    if (
      !Array.isArray(entry.requiredMarkers) ||
      entry.requiredMarkers.length < 1 ||
      entry.requiredMarkers.some((marker) =>
        typeof marker !== "string" || !marker)
    ) {
      fail(`shared file ${sharedPath} requires non-empty markers`);
    }
    return {
      path: sharedPath,
      purpose: entry.purpose,
      requiredMarkers: [...entry.requiredMarkers],
    };
  });
  const forbiddenTrackedTrees = value.forbiddenTrackedTrees.map((entry) =>
    assertSafeRepositoryPath(entry, "forbidden tracked tree"));
  const forbiddenOwnedExtensions = value.forbiddenOwnedExtensions.map((entry) => {
    if (typeof entry !== "string" || !/^\.[a-z0-9]+$/u.test(entry)) {
      fail("forbidden owned extensions must be lowercase dot extensions");
    }
    return entry;
  });

  const allExactPaths = [...ownedFiles, ...sharedFiles.map((entry) => entry.path)];
  if (new Set(allExactPaths).size !== allExactPaths.length) {
    fail("owned and shared exact paths must be unique and disjoint");
  }
  for (const tree of ownedTrees) {
    if (ownedTrees.some((candidate) =>
      candidate !== tree && tree.startsWith(`${candidate}/`))) {
      fail(`owned tree ${tree} is nested beneath another owned tree`);
    }
  }

  return {
    schema: RELEASE_SLICE_SCHEMA,
    ownedTrees: sorted(ownedTrees),
    ownedFiles: sorted(ownedFiles),
    sharedFiles: [...sharedFiles].sort((left, right) =>
      left.path.localeCompare(right.path, "en")),
    forbiddenTrackedTrees: sorted(forbiddenTrackedTrees),
    forbiddenOwnedExtensions: sorted(forbiddenOwnedExtensions),
  };
}

export function parsePorcelainV1Z(output) {
  const records = output.split("\0");
  const entries = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!record) continue;
    if (record.length < 4 || record[2] !== " ") {
      fail("git status returned an unexpected porcelain record");
    }
    const indexStatus = record[0];
    const worktreeStatus = record[1];
    const currentPath = record.slice(3).replaceAll("\\", "/");
    const entry = {
      path: assertSafeRepositoryPath(currentPath, "git status path"),
      indexStatus,
      worktreeStatus,
      originalPath: null,
    };
    if (indexStatus === "R" || indexStatus === "C") {
      const originalPath = records[index + 1];
      if (!originalPath) fail("renamed status entry is missing its original path");
      entry.originalPath = assertSafeRepositoryPath(
        originalPath.replaceAll("\\", "/"),
        "git status original path",
      );
      index += 1;
    }
    entries.push(entry);
  }
  return entries;
}

export function classifyReleaseSlicePath(filePath, manifest) {
  if (manifest.ownedFiles.includes(filePath)) return "owned";
  if (manifest.ownedTrees.some((tree) =>
    filePath === tree || filePath.startsWith(`${tree}/`))) return "owned";
  if (manifest.sharedFiles.some((entry) => entry.path === filePath)) {
    return "shared";
  }
  return "outside";
}

export function findPathsWithinTrees(paths, trees) {
  return sorted(paths.filter((filePath) => trees.some((tree) =>
    filePath === tree || filePath.startsWith(`${tree}/`))));
}

export function findForbiddenOwnedFiles(paths, extensions) {
  return sorted(paths.filter((filePath) => extensions.some((extension) =>
    filePath.toLowerCase().endsWith(extension))));
}

export function assertReleaseSliceIdentity(runtimeManifest, expectedSha256) {
  if (!/^[a-f0-9]{64}$/u.test(expectedSha256)) {
    fail("expected release-slice SHA-256 is invalid");
  }
  if (runtimeManifest?.releaseSliceManifestSha256 !== expectedSha256) {
    fail("runtime manifest release-slice identity does not match source");
  }
}

const splitNul = (output) => output.split("\0").filter(Boolean)
  .map((entry) => entry.replaceAll("\\", "/"));

async function runGit(repoRoot, args) {
  const { stdout } = await execFileAsync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });
  return stdout;
}

const fileExists = async (filePath) => {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
};

export async function auditReleaseSlice({ repoRoot, manifestPath }) {
  const manifestBytes = await readFile(manifestPath);
  const manifest = validateReleaseSliceManifest(JSON.parse(
    manifestBytes.toString("utf8"),
  ));
  const canonicalRoot = (await runGit(repoRoot, [
    "rev-parse",
    "--show-toplevel",
  ])).trim();
  if (path.resolve(canonicalRoot) !== path.resolve(repoRoot)) {
    fail("repoRoot must be the canonical Git worktree root");
  }

  const head = (await runGit(repoRoot, ["rev-parse", "HEAD"])).trim();
  const branch = (await runGit(repoRoot, [
    "rev-parse",
    "--abbrev-ref",
    "HEAD",
  ])).trim();
  const statusEntries = parsePorcelainV1Z(await runGit(repoRoot, [
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
  ]));
  const repositoryOwnedPaths = new Set(splitNul(await runGit(repoRoot, [
    "ls-files",
    "-z",
    "--cached",
    "--others",
    "--exclude-standard",
    "--",
    ...manifest.ownedTrees,
    ...manifest.ownedFiles,
  ])));
  const forbiddenTrackedPaths = sorted(splitNul(await runGit(repoRoot, [
    "ls-files",
    "-z",
    "--",
    ...manifest.forbiddenTrackedTrees,
  ])));

  const missingOwnedFiles = [];
  for (const filePath of manifest.ownedFiles) {
    if (
      !repositoryOwnedPaths.has(filePath) ||
      !await fileExists(path.join(repoRoot, filePath))
    ) missingOwnedFiles.push(filePath);
  }
  const emptyOwnedTrees = manifest.ownedTrees.filter((tree) =>
    ![...repositoryOwnedPaths].some((filePath) =>
      filePath.startsWith(`${tree}/`)));
  const markerFailures = [];
  for (const shared of manifest.sharedFiles) {
    const absolutePath = path.join(repoRoot, shared.path);
    if (!await fileExists(absolutePath)) {
      markerFailures.push({ path: shared.path, missing: ["<file>"] });
      continue;
    }
    const source = await readFile(absolutePath, "utf8");
    const missing = shared.requiredMarkers.filter((marker) =>
      !source.includes(marker));
    if (missing.length) markerFailures.push({ path: shared.path, missing });
  }
  const forbiddenOwnedFiles = findForbiddenOwnedFiles(
    [...repositoryOwnedPaths],
    manifest.forbiddenOwnedExtensions,
  );

  const changed = { owned: [], shared: [], outside: [] };
  for (const entry of statusEntries) {
    changed[classifyReleaseSlicePath(entry.path, manifest)].push(entry);
  }
  for (const value of Object.values(changed)) {
    value.sort((left, right) => left.path.localeCompare(right.path, "en"));
  }
  const stagedPaths = sorted(statusEntries.filter((entry) =>
    entry.indexStatus !== " " && entry.indexStatus !== "?")
    .map((entry) => entry.path));
  const violations = [
    ...missingOwnedFiles.map((filePath) => `missing owned file: ${filePath}`),
    ...emptyOwnedTrees.map((tree) => `empty owned tree: ${tree}`),
    ...forbiddenTrackedPaths.map((filePath) =>
      `generated output is tracked: ${filePath}`),
    ...forbiddenOwnedFiles.map((filePath) =>
      `credential-like file is in the owned slice: ${filePath}`),
    ...markerFailures.map((entry) =>
      `shared markers missing: ${entry.path}`),
  ];

  return {
    schema: RELEASE_SLICE_REPORT_SCHEMA,
    verdict: violations.length === 0 ? "PASS" : "FAIL",
    head,
    branch,
    manifest: path.relative(repoRoot, manifestPath).replaceAll("\\", "/"),
    manifestSha256: sha256(manifestBytes),
    ownedPathSetSha256: sha256(
      `${sorted(repositoryOwnedPaths).join("\n")}\n`,
    ),
    sharedPathSetSha256: sha256(
      `${manifest.sharedFiles.map((entry) => entry.path).join("\n")}\n`,
    ),
    counts: {
      repositoryOwnedFiles: repositoryOwnedPaths.size,
      ownedChanged: changed.owned.length,
      sharedChanged: changed.shared.length,
      outsideChanged: changed.outside.length,
      staged: stagedPaths.length,
    },
    safeWholeFileCandidates: changed.owned.map((entry) => entry.path),
    requiresHunkReview: changed.shared.map((entry) => ({
      path: entry.path,
      purpose: manifest.sharedFiles.find((shared) =>
        shared.path === entry.path)?.purpose ?? "shared integration",
    })),
    outsideChanges: changed.outside.map((entry) => entry.path),
    stagedPaths,
    forbiddenTrackedPaths,
    forbiddenOwnedFiles,
    missingOwnedFiles: sorted(missingOwnedFiles),
    emptyOwnedTrees: sorted(emptyOwnedTrees),
    markerFailures,
    violations,
  };
}
