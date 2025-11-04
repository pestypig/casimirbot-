import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    viteStaticCopy({
      targets: [
        { src: path.resolve(import.meta.dirname, "node_modules/web-tree-sitter/tree-sitter.wasm"), dest: "treesitter" },
        {
          src: path.resolve(
            import.meta.dirname,
            "node_modules/tree-sitter-typescript/tree-sitter-typescript.wasm",
          ),
          dest: "treesitter",
        },
        {
          src: path.resolve(
            import.meta.dirname,
            "node_modules/tree-sitter-typescript/tree-sitter-tsx.wasm",
          ),
          dest: "treesitter",
        },
        {
          src: path.resolve(
            import.meta.dirname,
            "node_modules/tree-sitter-javascript/tree-sitter-javascript.wasm",
          ),
          dest: "treesitter",
        },
      ],
    }),
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
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      allow: [
        path.resolve(import.meta.dirname, "client"),
        path.resolve(import.meta.dirname, "server"),
        path.resolve(import.meta.dirname, "shared"),
        path.resolve(import.meta.dirname, "modules"),
      ],
      deny: ["**/.*"],
    },
  },
});
