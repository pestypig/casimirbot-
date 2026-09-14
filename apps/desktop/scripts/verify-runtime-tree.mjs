import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertReleaseSliceIdentity } from "./release-slice-audit-lib.mjs";
import {
  assertNoRequiredCodexRuntimePackage,
  assertProviderNeutralRuntimeTree,
} from "./provider-neutral-runtime-guard-lib.mjs";

const desktopRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(desktopRoot, "..", "..");
const packageArgument = process.argv.slice(2);
if (packageArgument.length && (packageArgument.length !== 2 || packageArgument[0] !== "--package-dir")) {
  throw new Error("Usage: verify-runtime-tree.mjs [--package-dir <desktop build/win-unpacked>]");
}
const packageRoot = path.resolve(desktopRoot, packageArgument[1] ?? "release/win-unpacked");
const packageRelative = path.relative(desktopRoot, packageRoot);
if (!packageRelative || packageRelative.startsWith("..") || path.isAbsolute(packageRelative) || path.basename(packageRoot) !== "win-unpacked") {
  throw new Error("Package must be an explicit win-unpacked build inside apps/desktop");
}
const packedRuntimeRoot = path.join(packageRoot, "resources", "runtime");
const minecraftFabricLoopbackLifecycleScript =
  "scripts/helix-minecraft-launch-fabric-loopback.ps1";
const minecraftFabricServerLifecycleScript = "scripts/helix-minecraft-start-fabric-server.ps1";
const rendererRoots = {
  built: path.join(repoRoot, "dist", "public"),
  staged: path.join(desktopRoot, "runtime", "dist", "public"),
  packed: path.join(packedRuntimeRoot, "dist", "public"),
};
const marketplaceRoots = {
  staged: path.join(desktopRoot, "runtime", "codex-marketplace"),
  packed: path.join(packedRuntimeRoot, "codex-marketplace"),
};
const tunnelPayloadRoots = {
  staged: path.join(desktopRoot, "runtime"),
  packed: packedRuntimeRoot,
};
const minecraftLifecycleRoots = {
  source: repoRoot,
  staged: path.join(desktopRoot, "runtime"),
  packed: packedRuntimeRoot,
};

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

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
  return { count: entries.length, sha256: sha256(entries.join("\n")) };
};

const stagedManifestPath = path.join(
  desktopRoot,
  "runtime",
  "runtime-manifest.json",
);
const packedManifestPath = path.join(
  packedRuntimeRoot,
  "runtime-manifest.json",
);
const stagedManifestBytes = await readFile(stagedManifestPath);
const packedManifestBytes = await readFile(packedManifestPath);
const manifest = JSON.parse(stagedManifestBytes.toString("utf8"));
assertNoRequiredCodexRuntimePackage(manifest.requiredRuntimePackages);
const providerNeutralRuntimeReceipts = Object.fromEntries(
  await Promise.all([
    ["staged", path.join(desktopRoot, "runtime")],
    ["packed", packedRuntimeRoot],
  ].map(async ([label, root]) => [
    label,
    await assertProviderNeutralRuntimeTree(root),
  ])),
);
if (
  manifest.providerNeutralAgentBoundary?.bundledAgentRuntime !== false ||
  manifest.providerNeutralAgentBoundary?.requiredAgentRuntimePackage !== false ||
  manifest.providerNeutralAgentBoundary?.codexMarketplaceClassification !==
    "release_required_client_adapter" ||
  manifest.providerNeutralAgentBoundary?.auditedFileCountBeforeManifest !==
    providerNeutralRuntimeReceipts.staged.fileCount - 1 ||
  providerNeutralRuntimeReceipts.staged.fileCount !==
    providerNeutralRuntimeReceipts.packed.fileCount
) {
  throw new Error("Desktop provider-neutral agent boundary receipt is invalid");
}
const releaseSliceManifestBytes = await readFile(
  path.join(desktopRoot, "release-slice.v1.json"),
);
assertReleaseSliceIdentity(manifest, sha256(releaseSliceManifestBytes));
if (sha256(stagedManifestBytes) !== sha256(packedManifestBytes)) {
  throw new Error(
    "Packaged runtime manifest does not exactly match the staged manifest",
  );
}
const minecraftLifecycleReceipts = Object.fromEntries(
  await Promise.all(
    Object.entries(minecraftLifecycleRoots).map(async ([label, root]) => [
      label,
      sha256(await readFile(
        path.join(root, minecraftFabricLoopbackLifecycleScript),
      )),
    ]),
  ),
);
if (
  manifest.minecraftFabricLoopbackLifecycle?.path !==
    minecraftFabricLoopbackLifecycleScript ||
  !/^[a-f0-9]{64}$/u.test(
    manifest.minecraftFabricLoopbackLifecycle?.sha256 ?? "",
  ) ||
  Object.values(minecraftLifecycleReceipts).some(
    (digest) =>
      digest !== manifest.minecraftFabricLoopbackLifecycle.sha256,
  )
) {
  throw new Error(
    `Minecraft Fabric loopback lifecycle mismatch: ${JSON.stringify(minecraftLifecycleReceipts)}`,
  );
}
const minecraftServerLifecycleReceipts = Object.fromEntries(await Promise.all(
  Object.entries(minecraftLifecycleRoots).map(async ([label, root]) => [label,
    sha256(await readFile(path.join(root, minecraftFabricServerLifecycleScript)))]),
));
if (manifest.minecraftFabricServerLifecycle?.path !== minecraftFabricServerLifecycleScript ||
    !/^[a-f0-9]{64}$/u.test(manifest.minecraftFabricServerLifecycle?.sha256 ?? "") ||
    Object.values(minecraftServerLifecycleReceipts).some(digest => digest !== manifest.minecraftFabricServerLifecycle.sha256)) {
  throw new Error(`Minecraft saved server lifecycle mismatch: ${JSON.stringify(minecraftServerLifecycleReceipts)}`);
}
const receipts = Object.fromEntries(
  await Promise.all(
    Object.entries(rendererRoots).map(async ([label, root]) => [label, await hashTree(root)]),
  ),
);
const hashes = Object.values(receipts).map((receipt) => receipt.sha256);
const counts = Object.values(receipts).map((receipt) => receipt.count);
if (
  new Set(hashes).size !== 1 ||
  new Set(counts).size !== 1 ||
  hashes[0] !== manifest.clientTreeSha256
) {
  throw new Error(
    `Desktop renderer tree mismatch: ${JSON.stringify({ manifest: manifest.clientTreeSha256, receipts })}`,
  );
}
const marketplaceReceipts = Object.fromEntries(
  await Promise.all(
    Object.entries(marketplaceRoots).map(async ([label, root]) => [
      label,
      await hashTree(root),
    ]),
  ),
);
const marketplaceHashes = Object.values(marketplaceReceipts).map(
  (receipt) => receipt.sha256,
);
const marketplaceCounts = Object.values(marketplaceReceipts).map(
  (receipt) => receipt.count,
);
if (
  new Set(marketplaceHashes).size !== 1 ||
  new Set(marketplaceCounts).size !== 1 ||
  marketplaceHashes[0] !== manifest.codexMarketplaceTreeSha256
) {
  throw new Error(
    `Codex marketplace tree mismatch: ${JSON.stringify({ manifest: manifest.codexMarketplaceTreeSha256, receipts: marketplaceReceipts })}`,
  );
}

if (
  !manifest.tunnelClient ||
  typeof manifest.tunnelClient.version !== "string" ||
  !/^[a-f0-9]{64}$/u.test(manifest.tunnelClient.executableSha256 ?? "")
) {
  throw new Error("Desktop tunnel-client receipt is missing or invalid");
}
const tunnelPayloadReceipts = Object.fromEntries(
  await Promise.all(
    Object.entries(tunnelPayloadRoots).map(async ([label, root]) => {
      const executable = await readFile(path.join(root, "bin", "tunnel-client.exe"));
      const license = await readFile(
        path.join(root, "licenses", "openai-tunnel-client-LICENSE"),
      );
      return [label, { executableSha256: sha256(executable), licenseBytes: license.length }];
    }),
  ),
);
for (const receipt of Object.values(tunnelPayloadReceipts)) {
  if (
    receipt.executableSha256 !== manifest.tunnelClient.executableSha256 ||
    receipt.licenseBytes === 0
  ) {
    throw new Error(
      `Desktop tunnel-client payload mismatch: ${JSON.stringify(tunnelPayloadReceipts)}`,
    );
  }
}

console.log(
  `[desktop-runtime-tree] PASS renderer_files=${counts[0]} renderer_sha256=${hashes[0]} codex_files=${marketplaceCounts[0]} codex_sha256=${marketplaceHashes[0]} tunnel_client=${manifest.tunnelClient.version} tunnel_sha256=${manifest.tunnelClient.executableSha256} runtime_manifest_sha256=${sha256(stagedManifestBytes)}`,
);
