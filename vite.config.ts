import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { viteStaticCopy } from "vite-plugin-static-copy";

const repoRoot = import.meta.dirname;
const clientRoot = path.resolve(repoRoot, "client");
const toClientRelative = (target: string) =>
  path.relative(clientRoot, path.resolve(repoRoot, target)).split(path.sep).join(path.posix.sep);

const treeSitterSources = [
  "node_modules/web-tree-sitter/tree-sitter.wasm",
  "node_modules/tree-sitter-typescript/tree-sitter-typescript.wasm",
  "node_modules/tree-sitter-typescript/tree-sitter-tsx.wasm",
  "node_modules/tree-sitter-javascript/tree-sitter-javascript.wasm",
];

const WEB_TREE_SITTER_ENTRY = "node_modules/web-tree-sitter/tree-sitter.js";
const CODE_SNAPSHOT_ENTRY = "client/src/lib/code-index/snapshot.ts";
const VIRTUAL_NODE_SHIM_PREFIX = "\0node-shim:";
const defaultApiPort = process.env.PORT ?? "5173";
const apiProxyTarget =
  process.env.API_PROXY_TARGET ?? `http://localhost:${defaultApiPort}`;
const buildStamp =
  process.env.VITE_BUILD_ID ??
  process.env.BUILD_ID ??
  process.env.GIT_COMMIT ??
  process.env.GIT_SHA ??
  new Date().toISOString();
const helixAskJobTimeout = process.env.VITE_HELIX_ASK_JOB_TIMEOUT_MS;

const toPosix = (value: string) => value.split(path.sep).join(path.posix.sep);

const webTreeSitterNodeShim = (): Plugin => ({
  name: "web-tree-sitter-node-shim",
  enforce: "pre",
  resolveId(source: string, importer: string | undefined) {
    if (!importer) return null;
    const posixImporter = toPosix(importer);
    if (posixImporter.includes(WEB_TREE_SITTER_ENTRY)) {
      if (source === "fs/promises") return `${VIRTUAL_NODE_SHIM_PREFIX}fs-promises`;
      if (source === "module") return `${VIRTUAL_NODE_SHIM_PREFIX}module`;
    }
    if (source === "crypto" && posixImporter.includes(CODE_SNAPSHOT_ENTRY)) {
      return `${VIRTUAL_NODE_SHIM_PREFIX}crypto`;
    }
    return null;
  },
  load(id: string) {
    switch (id) {
      case `${VIRTUAL_NODE_SHIM_PREFIX}fs-promises`:
        return [
          "export async function readFile() {",
          '  throw new Error("fs/promises is not available in the browser build.");',
          "}",
          "export default { readFile };",
        ].join("\n");
      case `${VIRTUAL_NODE_SHIM_PREFIX}module`:
        return [
          "export function createRequire() {",
          '  throw new Error("module.createRequire is not available in the browser build.");',
          "}",
          "export default { createRequire };",
        ].join("\n");
      case `${VIRTUAL_NODE_SHIM_PREFIX}crypto`:
        return [
          "export function createHash() {",
          '  throw new Error("crypto.createHash is not available in the browser build.");',
          "}",
          "export function randomUUID() {",
          '  if (typeof globalThis.crypto?.randomUUID === \"function\") {',
          "    return globalThis.crypto.randomUUID();",
          "  }",
          '  throw new Error("crypto.randomUUID is not available in this environment.");',
          "}",
          "export default { createHash, randomUUID };",
        ].join("\n");
      default:
        return null;
    }
  },
  transform(code: string, id: string) {
    const posixId = toPosix(id);
    if (!posixId.includes(WEB_TREE_SITTER_ENTRY)) return null;
    const patched = code
      .replace(/import\("fs\/promises"\)/g, 'import(/* @vite-ignore */ "fs/promises")')
      .replace(/import\("module"\)/g, 'import(/* @vite-ignore */ "module")');
    if (patched === code) return null;
    return { code: patched, map: null };
  },
});

export default defineConfig({
  envPrefix: ["VITE_", "ENABLE_", "KNOWLEDGE_"],
  define: {
    __APP_BUILD__: JSON.stringify(buildStamp),
    __HELIX_ASK_JOB_TIMEOUT_MS__: helixAskJobTimeout
      ? JSON.stringify(helixAskJobTimeout)
      : "undefined",
  },
  plugins: [
    react(),
    runtimeErrorOverlay(),
    viteStaticCopy({
      targets: treeSitterSources.map((source) => ({
        src: toClientRelative(source),
        dest: "treesitter",
      })),
    }),
    webTreeSitterNodeShim(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      idb: path.resolve(import.meta.dirname, "node_modules", "idb", "build", "index.js"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  worker: {
    format: "es",
    rollupOptions: {
      output: {
        format: "es",
      },
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ["web-tree-sitter"],
  },
  server: {
    fs: {
      strict: true,
      allow: [
        path.resolve(import.meta.dirname, "client"),
        path.resolve(import.meta.dirname, "server"),
        path.resolve(import.meta.dirname, "shared"),
        path.resolve(import.meta.dirname, "modules"),
        path.resolve(import.meta.dirname, "docs"),
      ],
      deny: ["**/.*"],
    },
    proxy: {
      // Forward API calls to the backend; defaults to localhost:PORT (5173 unless overridden).
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      "/ws": {
        target: apiProxyTarget,
        ws: true,
        changeOrigin: true,
      },
      // Asset/doc helpers used by Helix panels during client-only dev.
      "/attached_assets": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      "/docs": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      "/originals": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      "/audio/originals": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      "/noisegen/previews": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
