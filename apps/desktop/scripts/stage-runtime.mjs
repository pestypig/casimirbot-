import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateReleaseSliceManifest } from "./release-slice-audit-lib.mjs";

const desktopRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(desktopRoot, "..", "..");
const runtimeRoot = path.join(desktopRoot, "runtime");

const copies = [
  ["dist/public", "dist/public"],
  ["configs/ideology-verifiers.json", "configs/ideology-verifiers.json"],
  ["docs/ethos/ideology.json", "docs/ethos/ideology.json"],
  [
    ".agents/plugins/marketplace.json",
    "codex-marketplace/.agents/plugins/marketplace.json",
  ],
  [
    "plugins/casimirbot-device-check",
    "codex-marketplace/plugins/casimirbot-device-check",
  ],
];

const tunnelArtifactManifest = JSON.parse(
  await readFile(path.join(desktopRoot, "tunnel-client.v1.json"), "utf8"),
);
const tunnelVendorRoot = path.join(
  desktopRoot,
  "vendor",
  "tunnel-client",
  `v${tunnelArtifactManifest.version}`,
  "windows-amd64",
  "expanded",
);
const tunnelPayloads = [
  [path.join(tunnelVendorRoot, "tunnel-client.exe"), "bin/tunnel-client.exe"],
  [path.join(tunnelVendorRoot, "LICENSE"), "licenses/openai-tunnel-client-LICENSE"],
];

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const assertInsideDesktopRuntime = (candidate) => {
  const resolved = path.resolve(candidate);
  const expectedPrefix = `${path.resolve(runtimeRoot)}${path.sep}`;
  if (!resolved.startsWith(expectedPrefix)) {
    throw new Error(`Refusing to stage outside ${runtimeRoot}`);
  }
  return resolved;
};

const hashTree = async (root) => {
  const entries = [];
  const visit = async (directory) => {
    const children = await readdir(directory);
    children.sort((a, b) => a.localeCompare(b));
    for (const child of children) {
      const absolute = path.join(directory, child);
      const details = await stat(absolute);
      if (details.isDirectory()) {
        await visit(absolute);
      } else if (details.isFile()) {
        const relative = path.relative(root, absolute).replaceAll(path.sep, "/");
        entries.push(`${relative}\0${sha256(await readFile(absolute))}`);
      }
    }
  };
  await visit(root);
  return sha256(entries.join("\n"));
};

const serviceDependencies = JSON.parse(
  await readFile(path.join(desktopRoot, "dist", "service-dependencies.json"), "utf8"),
);
const desktopPackage = JSON.parse(
  await readFile(path.join(desktopRoot, "package.json"), "utf8"),
);
const desktopLockBytes = await readFile(path.join(desktopRoot, "package-lock.json"));
const releaseSliceManifestBytes = await readFile(
  path.join(desktopRoot, "release-slice.v1.json"),
);
validateReleaseSliceManifest(JSON.parse(
  releaseSliceManifestBytes.toString("utf8"),
));
const desktopLock = JSON.parse(desktopLockBytes.toString("utf8"));
const lockedRoot = desktopLock.packages?.[""];

for (const dependency of ["electron-updater", "sharp"]) {
  const declared = desktopPackage.dependencies?.[dependency];
  const locked = lockedRoot?.dependencies?.[dependency];
  const resolved = desktopLock.packages?.[`node_modules/${dependency}`]?.version;
  if (!declared || declared !== locked || declared !== resolved) {
    throw new Error(
      `Desktop dependency closure mismatch for ${dependency}: declared=${declared ?? "missing"} locked=${locked ?? "missing"} resolved=${resolved ?? "missing"}`,
    );
  }
}

const serviceBytes = await readFile(path.join(desktopRoot, "dist", "service.mjs"));
const serviceSha256 = sha256(serviceBytes);
if (serviceSha256 !== serviceDependencies.serviceSha256) {
  throw new Error("Desktop service hash does not match its dependency manifest");
}

const requiredDataAssets = serviceDependencies.requiredDataAssets;
if (
  !requiredDataAssets ||
  typeof requiredDataAssets !== "object" ||
  Array.isArray(requiredDataAssets)
) {
  throw new Error("Desktop service data-asset manifest is missing");
}
const expectedDataAssets = [
  "data/starsim/solar-product-registry.v1.json",
  "data/starsim/solar-reference-pack.v1.json",
];
if (
  JSON.stringify(Object.keys(requiredDataAssets).sort()) !==
  JSON.stringify(expectedDataAssets)
) {
  throw new Error("Desktop service data-asset allowlist is invalid");
}
for (const relativePath of expectedDataAssets) {
  const sourceBytes = await readFile(path.join(repoRoot, relativePath));
  const packagedBytes = await readFile(
    path.join(desktopRoot, "dist", relativePath),
  );
  const expectedSha256 = requiredDataAssets[relativePath];
  if (
    sha256(sourceBytes) !== expectedSha256 ||
    sha256(packagedBytes) !== expectedSha256
  ) {
    throw new Error(`Desktop service data asset mismatch: ${relativePath}`);
  }
}

const configuredCommit =
  process.env.GIT_COMMIT?.trim() ?? process.env.GITHUB_SHA?.trim();
if (configuredCommit && configuredCommit !== serviceDependencies.sourceCommit) {
  throw new Error(
    `Desktop service source commit ${serviceDependencies.sourceCommit} does not match configured commit ${configuredCommit}`,
  );
}

await mkdir(desktopRoot, { recursive: true });
assertInsideDesktopRuntime(path.join(runtimeRoot, "sentinel"));
await rm(runtimeRoot, { recursive: true, force: true });
await mkdir(runtimeRoot, { recursive: true });

for (const [sourceRelative, targetRelative] of copies) {
  const source = path.join(repoRoot, sourceRelative);
  const target = assertInsideDesktopRuntime(path.join(runtimeRoot, targetRelative));
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: true, force: true });
}

for (const [source, targetRelative] of tunnelPayloads) {
  const target = assertInsideDesktopRuntime(path.join(runtimeRoot, targetRelative));
  const bytes = await readFile(source);
  const expected = targetRelative.startsWith("bin/")
    ? tunnelArtifactManifest.executableSha256
    : tunnelArtifactManifest.licenseSha256;
  if (sha256(bytes) !== expected) {
    throw new Error(`Tunnel-client staged payload mismatch: ${targetRelative}`);
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
}

const clientRoot = path.join(runtimeRoot, "dist", "public");
const codexMarketplaceRoot = path.join(runtimeRoot, "codex-marketplace");
const runtimeManifest = {
  schemaVersion: "casimir_desktop_runtime_manifest/2",
  generatedAt: new Date().toISOString(),
  sourceCommit: serviceDependencies.sourceCommit,
  serverSha256: serviceSha256,
  clientTreeSha256: await hashTree(clientRoot),
  codexMarketplaceTreeSha256: await hashTree(codexMarketplaceRoot),
  desktopLockfileSha256: sha256(desktopLockBytes),
  releaseSliceManifestSha256: sha256(releaseSliceManifestBytes),
  allowlist: copies.map(([source]) => source),
  tunnelClient: {
    version: tunnelArtifactManifest.version,
    executableSha256: tunnelArtifactManifest.executableSha256,
    license: tunnelArtifactManifest.license,
  },
  servicePackaging: "app_asar_bundled_service",
  requiredRuntimePackages: serviceDependencies.requiredRuntimePackages,
  requiredDataAssets,
  dependencyClosureStatus: "staged_verified",
};

await writeFile(
  path.join(runtimeRoot, "runtime-manifest.json"),
  `${JSON.stringify(runtimeManifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `[desktop-stage] staged ${copies.length} allowlisted runtime roots; dependency closure=staged_verified service=${serviceSha256.slice(0, 12)}`,
);
