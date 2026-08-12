import { createHash } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const SITE_RELEASE_METADATA_SCHEMA =
  "casimir_desktop_site_release_metadata/1";
export const RELEASE_STATUS_SCHEMA = "casimir_desktop_release_status/1";
export const OFFICIAL_REPOSITORY = "pestypig/casimirbot-";

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/;
const THUMBPRINT_PATTERN = /^[a-f0-9]{40,128}$/i;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = (message) => {
  throw new Error(`[desktop-site-release] ${message}`);
};
const readJsonReceipt = async (filePath, label) => {
  let bytes;
  try {
    bytes = await readFile(filePath);
  } catch {
    fail(`missing ${label}`);
  }
  try {
    return { bytes, value: JSON.parse(bytes.toString("utf8")) };
  } catch {
    fail(`invalid JSON in ${label}`);
  }
};

export async function createSiteReleaseMetadata({
  releaseRoot,
  repository = OFFICIAL_REPOSITORY,
  releaseTag,
  outputPath = path.join(releaseRoot, "site-release-metadata.json"),
  generatedAt = new Date().toISOString(),
}) {
  if (repository !== OFFICIAL_REPOSITORY) {
    fail(`repository must be ${OFFICIAL_REPOSITORY}`);
  }

  const releaseManifestReceipt = await readJsonReceipt(
    path.join(releaseRoot, "release-manifest.json"),
    "release-manifest.json",
  );
  const signatureReceipt = await readJsonReceipt(
    path.join(releaseRoot, "authenticode-receipt.json"),
    "authenticode-receipt.json",
  );
  const casimirReceipt = await readJsonReceipt(
    path.join(releaseRoot, "casimir-gate-receipt.json"),
    "casimir-gate-receipt.json",
  );
  const manifest = releaseManifestReceipt.value;
  const version = typeof manifest.version === "string" ? manifest.version : "";
  if (
    manifest.schema !== "casimir_desktop_release_manifest/1" ||
    !SEMVER_PATTERN.test(version) ||
    !COMMIT_PATTERN.test(manifest.sourceCommit ?? "") ||
    !SHA256_PATTERN.test(manifest.runtimeManifestSha256 ?? "") ||
    !SHA256_PATTERN.test(manifest.updaterMetadataSha256 ?? "") ||
    !SHA256_PATTERN.test(manifest.releaseSliceManifestSha256 ?? "") ||
    manifest.dependencyClosureStatus !== "staged_verified" ||
    typeof manifest.publisherName !== "string" ||
    !manifest.publisherName.trim()
  ) {
    fail("release manifest identity or closure is invalid");
  }

  const expectedTag = `desktop-v${version}`;
  if (releaseTag && releaseTag !== expectedTag) {
    fail(`release tag must be ${expectedTag}`);
  }
  const installerFileName = `CasimirBot-${version}-x64-setup.exe`;
  const installerEntries = Array.isArray(manifest.files)
    ? manifest.files.filter((entry) => entry?.file?.endsWith(".exe"))
    : [];
  if (
    installerEntries.length !== 1 ||
    installerEntries[0].file !== installerFileName ||
    !SHA256_PATTERN.test(installerEntries[0].sha256 ?? "")
  ) {
    fail("release manifest must contain exactly the expected x64 installer");
  }
  const installerBytes = await readFile(path.join(releaseRoot, installerFileName));
  const installerSha256 = sha256(installerBytes);
  if (installerSha256 !== installerEntries[0].sha256) {
    fail("installer SHA-256 does not match the release manifest");
  }

  const authenticode = signatureReceipt.value;
  const installerSignature = Array.isArray(authenticode.files)
    ? authenticode.files.find((entry) => entry?.file === installerFileName)
    : null;
  if (
    authenticode.schema !== "casimir_desktop_authenticode_receipt/1" ||
    authenticode.publisher_name !== manifest.publisherName ||
    installerSignature?.status !== "Valid" ||
    !THUMBPRINT_PATTERN.test(installerSignature?.signer_thumbprint ?? "")
  ) {
    fail("Authenticode evidence does not match the installer and publisher");
  }

  const casimir = casimirReceipt.value;
  const certificateHash = String(
    casimir.certificate?.certificateHash ?? "",
  ).toLowerCase();
  if (
    casimir.schema !== "casimir_desktop_gate_receipt/1" ||
    casimir.verdict !== "PASS" ||
    casimir.pass !== true ||
    !SHA256_PATTERN.test(certificateHash) ||
    casimir.certificate?.integrity !== "OK" ||
    !SHA256_PATTERN.test(casimir.traceExport?.sha256 ?? "") ||
    !Number.isInteger(casimir.traceExport?.recordCount) ||
    casimir.traceExport.recordCount < 1 ||
    !SHA256_PATTERN.test(casimir.adapterResponseSha256 ?? "")
  ) {
    fail("Casimir PASS certificate evidence is invalid");
  }

  const downloadUrl =
    `https://github.com/${repository}/releases/download/` +
    `${expectedTag}/${installerFileName}`;
  const status = {
    schemaVersion: RELEASE_STATUS_SCHEMA,
    available: true,
    approved: true,
    release: {
      platform: "windows",
      arch: "x64",
      version,
      installerFileName,
      downloadUrl,
      sha256: installerSha256,
      publisher: manifest.publisherName,
      publishedAt: null,
      casimirGate: {
        verdict: "PASS",
        certificateHash,
        integrity: "OK",
      },
    },
  };
  const metadata = {
    schema: SITE_RELEASE_METADATA_SCHEMA,
    generatedAt,
    sourceCommit: manifest.sourceCommit,
    releaseTag: expectedTag,
    status,
    deploymentEnvironment: {
      DESKTOP_RELEASE_APPROVED: "1",
      DESKTOP_RELEASE_VERSION: version,
      DESKTOP_RELEASE_DOWNLOAD_URL: downloadUrl,
      DESKTOP_RELEASE_SHA256: installerSha256,
      DESKTOP_RELEASE_PUBLISHER: manifest.publisherName,
      DESKTOP_RELEASE_CASIMIR_CERTIFICATE_HASH: certificateHash,
    },
    evidence: {
      releaseManifestSha256: sha256(releaseManifestReceipt.bytes),
      authenticodeReceiptSha256: sha256(signatureReceipt.bytes),
      casimirGateReceiptSha256: sha256(casimirReceipt.bytes),
      releaseSliceManifestSha256: manifest.releaseSliceManifestSha256,
      signerThumbprint: installerSignature.signer_thumbprint,
    },
  };

  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(metadata, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(temporaryPath, outputPath);
  } finally {
    await unlink(temporaryPath).catch(() => undefined);
  }
  return metadata;
}
