import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  OFFICIAL_REPOSITORY,
  SITE_RELEASE_METADATA_SCHEMA,
  createSiteReleaseMetadata,
} from "../apps/desktop/scripts/site-release-metadata-lib.mjs";
import { desktopReleaseStatusSchema } from "@shared/desktop-release";

const temporaryRoots: string[] = [];
const sha256 = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");

const createFixture = async () => {
  const releaseRoot = await mkdtemp(path.join(os.tmpdir(), "casimir-site-release-"));
  temporaryRoots.push(releaseRoot);
  const version = "0.1.0-alpha.1";
  const installerFileName = `CasimirBot-${version}-x64-setup.exe`;
  const installerBytes = Buffer.from("signed-installer-fixture");
  await writeFile(path.join(releaseRoot, installerFileName), installerBytes);
  await writeFile(
    path.join(releaseRoot, "release-manifest.json"),
    JSON.stringify({
      schema: "casimir_desktop_release_manifest/1",
      version,
      sourceCommit: "a".repeat(40),
      runtimeManifestSha256: "d".repeat(64),
      updaterMetadataSha256: "e".repeat(64),
      releaseSliceManifestSha256: "2".repeat(64),
      dependencyClosureStatus: "staged_verified",
      publisherName: "CasimirBot LLC",
      files: [{ file: installerFileName, sha256: sha256(installerBytes) }],
    }),
  );
  await writeFile(
    path.join(releaseRoot, "authenticode-receipt.json"),
    JSON.stringify({
      schema: "casimir_desktop_authenticode_receipt/1",
      publisher_name: "CasimirBot LLC",
      files: [{
        file: installerFileName,
        status: "Valid",
        signer_thumbprint: "b".repeat(40),
      }],
    }),
  );
  await writeFile(
    path.join(releaseRoot, "casimir-gate-receipt.json"),
    JSON.stringify({
      schema: "casimir_desktop_gate_receipt/1",
      generatedAt: "2026-08-11T12:00:00.000Z",
      verdict: "PASS",
      pass: true,
      firstFail: null,
      certificate: { certificateHash: "c".repeat(64), integrity: "OK" },
      traceExport: { recordCount: 1, sha256: "f".repeat(64) },
      adapterResponseSha256: "1".repeat(64),
    }),
  );
  return { releaseRoot, version, installerFileName, installerBytes };
};

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("desktop site release metadata", () => {
  it("atomically derives a browser-valid approval record from verified receipts", async () => {
    const fixture = await createFixture();
    const metadata = await createSiteReleaseMetadata({
      releaseRoot: fixture.releaseRoot,
      repository: OFFICIAL_REPOSITORY,
      releaseTag: `desktop-v${fixture.version}`,
      generatedAt: "2026-08-11T12:00:00.000Z",
    });

    expect(metadata.schema).toBe(SITE_RELEASE_METADATA_SCHEMA);
    expect(desktopReleaseStatusSchema.parse(metadata.status)).toEqual(metadata.status);
    expect(metadata.status.release.downloadUrl).toBe(
      `https://github.com/${OFFICIAL_REPOSITORY}/releases/download/desktop-v${fixture.version}/${fixture.installerFileName}`,
    );
    expect(metadata.deploymentEnvironment).toMatchObject({
      DESKTOP_RELEASE_APPROVED: "1",
      DESKTOP_RELEASE_SHA256: sha256(fixture.installerBytes),
      DESKTOP_RELEASE_CASIMIR_CERTIFICATE_HASH: "c".repeat(64),
    });
    expect(metadata.evidence.releaseSliceManifestSha256).toBe(
      "2".repeat(64),
    );
    expect(JSON.parse(await readFile(
      path.join(fixture.releaseRoot, "site-release-metadata.json"),
      "utf8",
    ))).toEqual(metadata);
  });

  it("rejects an installer whose bytes do not match the verified manifest", async () => {
    const fixture = await createFixture();
    await writeFile(
      path.join(fixture.releaseRoot, fixture.installerFileName),
      "tampered-installer",
    );
    await expect(createSiteReleaseMetadata({
      releaseRoot: fixture.releaseRoot,
      releaseTag: `desktop-v${fixture.version}`,
    })).rejects.toThrow("installer SHA-256 does not match");
  });

  it.each([
    ["foreign repository", { repository: "other/casimirbot-" }],
    ["mismatched tag", { releaseTag: "desktop-v9.9.9" }],
  ])("rejects a %s", async (_label, overrides) => {
    const fixture = await createFixture();
    await expect(createSiteReleaseMetadata({
      releaseRoot: fixture.releaseRoot,
      releaseTag: `desktop-v${fixture.version}`,
      ...overrides,
    })).rejects.toThrow();
  });

  it("rejects Casimir evidence without integrity", async () => {
    const fixture = await createFixture();
    await writeFile(
      path.join(fixture.releaseRoot, "casimir-gate-receipt.json"),
      JSON.stringify({
        schema: "casimir_desktop_gate_receipt/1",
        generatedAt: "2026-08-11T12:00:00.000Z",
        verdict: "PASS",
        pass: true,
        firstFail: null,
        certificate: { certificateHash: "c".repeat(64), integrity: "NOT_OK" },
        traceExport: { recordCount: 1, sha256: "f".repeat(64) },
        adapterResponseSha256: "1".repeat(64),
      }),
    );
    await expect(createSiteReleaseMetadata({
      releaseRoot: fixture.releaseRoot,
      releaseTag: `desktop-v${fixture.version}`,
    })).rejects.toThrow("Casimir PASS certificate evidence is invalid");
  });

  it("rejects Authenticode evidence from a different publisher", async () => {
    const fixture = await createFixture();
    await writeFile(
      path.join(fixture.releaseRoot, "authenticode-receipt.json"),
      JSON.stringify({
        schema: "casimir_desktop_authenticode_receipt/1",
        publisher_name: "Unexpected Publisher",
        files: [{
          file: fixture.installerFileName,
          status: "Valid",
          signer_thumbprint: "b".repeat(40),
        }],
      }),
    );
    await expect(createSiteReleaseMetadata({
      releaseRoot: fixture.releaseRoot,
      releaseTag: `desktop-v${fixture.version}`,
    })).rejects.toThrow("Authenticode evidence does not match");
  });
});
