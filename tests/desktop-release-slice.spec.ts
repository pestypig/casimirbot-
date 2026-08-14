import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  RELEASE_SLICE_REPORT_SCHEMA,
  RELEASE_SLICE_SCHEMA,
  assertReleaseSliceIdentity,
  assertSafeRepositoryPath,
  auditReleaseSlice,
  classifyReleaseSlicePath,
  findForbiddenOwnedFiles,
  findPathsWithinTrees,
  parsePorcelainV1Z,
  validateReleaseSliceManifest,
} from "../apps/desktop/scripts/release-slice-audit-lib.mjs";

const repoRoot = path.resolve(".");
const manifestPath = path.join(
  repoRoot,
  "apps/desktop/release-slice.v1.json",
);

const readManifest = async () => validateReleaseSliceManifest(
  JSON.parse(await readFile(manifestPath, "utf8")),
);

describe("desktop release slice audit", () => {
  it("stages, packages, and verifies the one shared Minecraft lifecycle provider", async () => {
    const [stageSource, packagerSource, verifierSource] = await Promise.all([
      readFile(
        path.join(repoRoot, "apps/desktop/scripts/stage-runtime.mjs"),
        "utf8",
      ),
      readFile(
        path.join(repoRoot, "apps/desktop/electron-builder.config.cjs"),
        "utf8",
      ),
      readFile(
        path.join(repoRoot, "apps/desktop/scripts/verify-runtime-tree.mjs"),
        "utf8",
      ),
    ]);
    const provider = "scripts/helix-minecraft-launch-fabric-loopback.ps1";

    expect(stageSource).toContain(provider);
    expect(packagerSource).toContain(provider);
    expect(verifierSource).toContain(provider);
    expect(stageSource).toContain("minecraftFabricLoopbackLifecycle");
    expect(verifierSource).toContain("minecraftLifecycleReceipts");
  });

  it("validates the exact owned/shared release-slice contract", async () => {
    const manifest = await readManifest();
    expect(manifest.schema).toBe(RELEASE_SLICE_SCHEMA);
    expect(manifest.ownedTrees).toEqual([
      "apps/desktop",
      "plugins/casimirbot-device-check",
    ]);
    expect(manifest.ownedFiles).toContain(
      ".github/workflows/desktop-release.yml",
    );
    expect(manifest.sharedFiles.map((entry) => entry.path)).toContain(
      "server/mcp/helix-mcp-server.ts",
    );
  });

  it.each([
    "../secret.pfx",
    "/absolute/path",
    "apps\\desktop\\main.ts",
    "apps/desktop/*",
  ])("rejects unsafe or ambiguous path %s", (filePath) => {
    expect(() => assertSafeRepositoryPath(filePath)).toThrow(
      "exact normalized repository-relative path",
    );
  });

  it("parses untracked and renamed porcelain records without shell paths", () => {
    expect(parsePorcelainV1Z(
      " M shared.ts\0?? new.ts\0R  next.ts\0old.ts\0",
    )).toEqual([
      {
        path: "shared.ts",
        indexStatus: " ",
        worktreeStatus: "M",
        originalPath: null,
      },
      {
        path: "new.ts",
        indexStatus: "?",
        worktreeStatus: "?",
        originalPath: null,
      },
      {
        path: "next.ts",
        indexStatus: "R",
        worktreeStatus: " ",
        originalPath: "old.ts",
      },
    ]);
  });

  it("separates whole-file, hunk-review, and outside changes", async () => {
    const manifest = await readManifest();
    expect(classifyReleaseSlicePath(
      "apps/desktop/src/main.ts",
      manifest,
    )).toBe("owned");
    expect(classifyReleaseSlicePath("server/routes.ts", manifest)).toBe(
      "shared",
    );
    expect(classifyReleaseSlicePath("MATH_STATUS.md", manifest)).toBe(
      "outside",
    );
  });

  it("rejects generated trees and credential-like files from the slice", () => {
    expect(findPathsWithinTrees([
      "apps/desktop/src/main.ts",
      "apps/desktop/release/CasimirBot.exe",
      "apps/desktop/runtime/manifest.json",
    ], [
      "apps/desktop/release",
      "apps/desktop/runtime",
    ])).toEqual([
      "apps/desktop/release/CasimirBot.exe",
      "apps/desktop/runtime/manifest.json",
    ]);
    expect(findForbiddenOwnedFiles([
      "apps/desktop/src/main.ts",
      "apps/desktop/signing/release.PFX",
    ], [".pfx"])).toEqual([
      "apps/desktop/signing/release.PFX",
    ]);
  });

  it("fails closed when runtime staging is bound to another slice", () => {
    const expected = "a".repeat(64);
    expect(() => assertReleaseSliceIdentity({
      releaseSliceManifestSha256: expected,
    }, expected)).not.toThrow();
    expect(() => assertReleaseSliceIdentity({
      releaseSliceManifestSha256: "b".repeat(64),
    }, expected)).toThrow("does not match source");
    expect(() => assertReleaseSliceIdentity({}, "short")).toThrow(
      "expected release-slice SHA-256 is invalid",
    );
  });

  it("audits the canonical worktree without changing the Git index", async () => {
    const indexBefore = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "-z"],
      { cwd: repoRoot },
    );
    const report = await auditReleaseSlice({ repoRoot, manifestPath });
    const indexAfter = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "-z"],
      { cwd: repoRoot },
    );

    expect(report.schema).toBe(RELEASE_SLICE_REPORT_SCHEMA);
    expect(report.verdict).toBe("PASS");
    expect(report.manifestSha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(report.ownedPathSetSha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(report.sharedPathSetSha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(report.forbiddenTrackedPaths).toEqual([]);
    expect(report.forbiddenOwnedFiles).toEqual([]);
    expect(report.missingOwnedFiles).toEqual([]);
    expect(report.markerFailures).toEqual([]);
    expect(indexAfter.equals(indexBefore)).toBe(true);
  });
});
