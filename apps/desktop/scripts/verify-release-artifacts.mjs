import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { assertReleaseSliceIdentity } from "./release-slice-audit-lib.mjs";

const desktopRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const releaseRoot = path.resolve(
  process.env.DESKTOP_RELEASE_DIR ?? path.join(desktopRoot, "release"),
);
const fail = (message) => {
  throw new Error(`[desktop-release-artifacts] ${message}`);
};
const digest = (algorithm, bytes, encoding) =>
  createHash(algorithm).update(bytes).digest(encoding);

const packageJson = JSON.parse(
  await readFile(path.join(desktopRoot, "package.json"), "utf8"),
);
const runtimeManifestBytes = await readFile(
  path.join(desktopRoot, "runtime", "runtime-manifest.json"),
);
const runtimeManifest = JSON.parse(runtimeManifestBytes.toString("utf8"));
const releaseSliceManifestBytes = await readFile(
  path.join(desktopRoot, "release-slice.v1.json"),
);
const releaseSliceManifestSha256 = digest(
  "sha256",
  releaseSliceManifestBytes,
  "hex",
);
assertReleaseSliceIdentity(runtimeManifest, releaseSliceManifestSha256);
const latestBytes = await readFile(path.join(releaseRoot, "latest.yml"));
const latest = parseYaml(latestBytes.toString("utf8"));

if (!latest || latest.version !== packageJson.version) {
  fail("latest.yml version does not match desktop package version");
}
if (!Array.isArray(latest.files) || latest.files.length < 1) {
  fail("latest.yml does not contain update files");
}

const verifiedFiles = [];
for (const entry of latest.files) {
  const relative = typeof entry?.url === "string" ? entry.url : null;
  if (!relative || path.basename(relative) !== relative) {
    fail("latest.yml contains an invalid update artifact path");
  }
  const absolute = path.join(releaseRoot, relative);
  const bytes = await readFile(absolute);
  const sha512 = digest("sha512", bytes, "base64");
  if (sha512 !== entry.sha512) {
    fail(`SHA-512 mismatch for ${relative}`);
  }
  verifiedFiles.push({
    file: relative,
    size: bytes.length,
    sha256: digest("sha256", bytes, "hex"),
    sha512,
  });
}

if (typeof latest.path !== "string" || !verifiedFiles.some((entry) => entry.file === latest.path)) {
  fail("latest.yml primary path is not in the verified file list");
}
if (latest.sha512 !== verifiedFiles.find((entry) => entry.file === latest.path)?.sha512) {
  fail("latest.yml primary SHA-512 does not match its file entry");
}

const expectedInstaller = `CasimirBot-${packageJson.version}-x64-setup.exe`;
if (latest.path !== expectedInstaller) {
  fail(`primary installer must be ${expectedInstaller}`);
}

const blockmapName = `${latest.path}.blockmap`;
const blockmapBytes = await readFile(path.join(releaseRoot, blockmapName));
verifiedFiles.push({
  file: blockmapName,
  size: blockmapBytes.length,
  sha256: digest("sha256", blockmapBytes, "hex"),
  sha512: digest("sha512", blockmapBytes, "base64"),
});

const signatureReceiptPath =
  process.env.DESKTOP_SIGNATURE_RECEIPT ??
  path.join(releaseRoot, "authenticode-receipt.json");
const signatureReceipt = JSON.parse(await readFile(signatureReceiptPath, "utf8"));
const publisherName = process.env.WINDOWS_PUBLISHER_NAME?.trim();
if (!publisherName || signatureReceipt.publisher_name !== publisherName) {
  fail("Authenticode receipt publisher does not match WINDOWS_PUBLISHER_NAME");
}
for (const file of verifiedFiles.filter((entry) => entry.file.endsWith(".exe"))) {
  const signature = signatureReceipt.files?.find((entry) => entry.file === file.file);
  if (!signature || signature.status !== "Valid" || !signature.signer_thumbprint) {
    fail(`missing valid Authenticode receipt for ${file.file}`);
  }
}

const releaseManifest = {
  schema: "casimir_desktop_release_manifest/1",
  version: packageJson.version,
  sourceCommit: runtimeManifest.sourceCommit,
  runtimeManifestSha256: digest("sha256", runtimeManifestBytes, "hex"),
  updaterMetadataSha256: digest("sha256", latestBytes, "hex"),
  releaseSliceManifestSha256,
  dependencyClosureStatus: runtimeManifest.dependencyClosureStatus,
  publisherName,
  files: verifiedFiles,
};
await writeFile(
  path.join(releaseRoot, "release-manifest.json"),
  `${JSON.stringify(releaseManifest, null, 2)}\n`,
  "utf8",
);

const releaseNames = (await readdir(releaseRoot)).sort();
console.log(
  `[desktop-release-artifacts] PASS version=${packageJson.version} files=${verifiedFiles.length} metadata_sha256=${releaseManifest.updaterMetadataSha256} directory_entries=${releaseNames.length}`,
);
