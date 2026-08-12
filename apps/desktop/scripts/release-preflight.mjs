import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertReleaseSliceIdentity,
  auditReleaseSlice,
} from "./release-slice-audit-lib.mjs";

const desktopRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(desktopRoot, "..", "..");

const fail = (message) => {
  throw new Error(`[desktop-release-preflight] ${message}`);
};
const requiredEnvironment = (name) => {
  const value = process.env[name]?.trim();
  if (!value) fail(`${name} is required`);
  return value;
};
const git = (...args) =>
  execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

if (process.env.CASIMIR_DESKTOP_RELEASE !== "1") {
  fail("CASIMIR_DESKTOP_RELEASE=1 is required");
}

const releaseSliceManifestPath = path.join(
  desktopRoot,
  "release-slice.v1.json",
);
const releaseSliceReport = await auditReleaseSlice({
  repoRoot,
  manifestPath: releaseSliceManifestPath,
});
if (releaseSliceReport.verdict !== "PASS") {
  fail(`release slice audit failed: ${releaseSliceReport.violations.join("; ")}`);
}

requiredEnvironment("CSC_LINK");
requiredEnvironment("CSC_KEY_PASSWORD");
requiredEnvironment("WINDOWS_PUBLISHER_NAME");
requiredEnvironment("CASIMIR_ADAPTER_VERIFY_URL");

const packageJson = JSON.parse(
  await readFile(path.join(desktopRoot, "package.json"), "utf8"),
);
const expectedTag = `desktop-v${packageJson.version}`;
const releaseTag =
  process.env.RELEASE_TAG?.trim() ?? process.env.GITHUB_REF_NAME?.trim();
if (releaseTag !== expectedTag) {
  fail(`release tag must be ${expectedTag}; received ${releaseTag ?? "missing"}`);
}

const sourceCommit = git("rev-parse", "HEAD");
const ciCommit = process.env.GITHUB_SHA?.trim();
if (!ciCommit || sourceCommit !== ciCommit) {
  fail(`GITHUB_SHA must exactly match HEAD (${sourceCommit})`);
}

const status = git("status", "--porcelain=v1", "--untracked-files=all");
if (status) fail("release checkout must be clean after ignored build outputs");

const exactTagCommit = git("rev-list", "-n", "1", expectedTag);
if (exactTagCommit !== sourceCommit) {
  fail(`${expectedTag} does not resolve to HEAD`);
}

const runtimeManifestBytes = await readFile(
  path.join(desktopRoot, "runtime", "runtime-manifest.json"),
);
const runtimeManifest = JSON.parse(runtimeManifestBytes.toString("utf8"));
if (runtimeManifest.dependencyClosureStatus !== "staged_verified") {
  fail("desktop dependency closure is not staged_verified");
}
if (
  !runtimeManifest.tunnelClient ||
  typeof runtimeManifest.tunnelClient.version !== "string" ||
  !/^[a-f0-9]{64}$/u.test(
    runtimeManifest.tunnelClient.executableSha256 ?? "",
  )
) {
  fail("tunnel-client integrity receipt is missing");
}
const tunnelClientBytes = await readFile(
  path.join(desktopRoot, "runtime", "bin", "tunnel-client.exe"),
);
if (
  sha256(tunnelClientBytes) !== runtimeManifest.tunnelClient.executableSha256
) {
  fail("staged tunnel-client hash does not match runtime manifest");
}
if (runtimeManifest.sourceCommit !== sourceCommit) {
  fail("runtime manifest source commit does not match HEAD");
}
assertReleaseSliceIdentity(runtimeManifest, releaseSliceReport.manifestSha256);

const serviceBytes = await readFile(path.join(desktopRoot, "dist", "service.mjs"));
if (sha256(serviceBytes) !== runtimeManifest.serverSha256) {
  fail("bundled service hash does not match runtime manifest");
}

const lockBytes = await readFile(path.join(desktopRoot, "package-lock.json"));
if (sha256(lockBytes) !== runtimeManifest.desktopLockfileSha256) {
  fail("desktop lockfile hash does not match runtime manifest");
}

console.log(
  `[desktop-release-preflight] PASS tag=${expectedTag} commit=${sourceCommit} closure=staged_verified runtime_manifest_sha256=${sha256(runtimeManifestBytes)} release_slice_sha256=${releaseSliceReport.manifestSha256}`,
);
