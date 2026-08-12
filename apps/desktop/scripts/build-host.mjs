import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const desktopRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(desktopRoot, "..", "..");
const distRoot = path.join(desktopRoot, "dist");
const serviceDataAssets = [
  "data/starsim/solar-product-registry.v1.json",
  "data/starsim/solar-reference-pack.v1.json",
];

const resolveCommit = () => {
  const configured = [
    process.env.GIT_COMMIT,
    process.env.GITHUB_SHA,
    process.env.SOURCE_VERSION,
  ].find((value) => typeof value === "string" && value.trim());
  if (configured) return configured.trim();
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "development-worktree";
  }
};

const productionViteStub = {
  name: "casimir-desktop-production-vite-stub",
  setup(buildContext) {
    buildContext.onResolve({ filter: /^\.\/vite$/ }, (args) => {
      if (path.normalize(args.importer) !== path.join(repoRoot, "server", "index.ts")) {
        return null;
      }
      return {
        path: "casimir-desktop-production-vite-stub",
        namespace: "casimir-desktop",
      };
    });
    buildContext.onLoad(
      {
        filter: /^casimir-desktop-production-vite-stub$/,
        namespace: "casimir-desktop",
      },
      () => ({
        loader: "js",
        contents:
          'export async function setupVite(){throw new Error("Vite middleware is unavailable in the signed desktop runtime");}',
      }),
    );
  },
};

const optionalRuntimePackages = [
  "@playwright/test",
  "@replit/object-storage",
  "@sentry/node",
  "pdfjs-dist/*",
  "playwright",
];

await mkdir(distRoot, { recursive: true });

const packagedDataRoot = path.join(distRoot, "data");
await rm(packagedDataRoot, { recursive: true, force: true });
const serviceDataAssetHashes = {};
for (const relativePath of serviceDataAssets) {
  const source = path.join(repoRoot, relativePath);
  const target = path.join(distRoot, relativePath);
  const bytes = await readFile(source);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  serviceDataAssetHashes[relativePath] = createHash("sha256")
    .update(bytes)
    .digest("hex");
}

const common = {
  bundle: true,
  platform: "node",
  target: "node24",
  logLevel: "info",
};

await build({
  ...common,
  entryPoints: [path.join(desktopRoot, "src", "main.ts")],
  outfile: path.join(distRoot, "main.cjs"),
  format: "cjs",
  external: ["electron", "electron-updater"],
});

await build({
  ...common,
  entryPoints: [path.join(desktopRoot, "src", "preload.ts")],
  outfile: path.join(distRoot, "preload.cjs"),
  format: "cjs",
  external: ["electron"],
});

const sourceCommit = resolveCommit();
const serviceEntry = path.join(distRoot, "service.mjs");
await build({
  ...common,
  entryPoints: [path.join(repoRoot, "server", "index.ts")],
  outfile: serviceEntry,
  format: "esm",
  plugins: [productionViteStub],
  external: ["sharp", ...optionalRuntimePackages],
  banner: {
    js: `import { createRequire as __casimirCreateRequire } from "node:module";const require=__casimirCreateRequire(import.meta.url);globalThis.__CASIMIR_SERVER_BUILD_COMMIT__=${JSON.stringify(sourceCommit)};`,
  },
});

const desktopPackage = JSON.parse(
  await readFile(path.join(desktopRoot, "package.json"), "utf8"),
);
const serviceBytes = await readFile(serviceEntry);
const serviceDependencies = {
  schemaVersion: "casimir_desktop_service_dependencies/1",
  sourceCommit,
  serviceSha256: createHash("sha256").update(serviceBytes).digest("hex"),
  requiredRuntimePackages: {
    sharp: desktopPackage.dependencies?.sharp,
  },
  requiredDataAssets: serviceDataAssetHashes,
  optionalUnavailablePackages: optionalRuntimePackages,
  productionViteMiddleware: "disabled",
};
await writeFile(
  path.join(distRoot, "service-dependencies.json"),
  `${JSON.stringify(serviceDependencies, null, 2)}\n`,
  "utf8",
);

console.log(
  `[desktop-build] host and bundled service built for ${sourceCommit}; required external=sharp@${serviceDependencies.requiredRuntimePackages.sharp}; data_assets=${serviceDataAssets.length}`,
);
