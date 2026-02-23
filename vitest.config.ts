import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  test: {
    environment: "node",
    // Helix Ask integration suites are memory-heavy; run files sequentially for stable CI/local gates.
    fileParallelism: false,
    include: [
      "tests/**/*.spec.ts",
      "server/**/__tests__/**/*.{spec,test}.ts",
      "tools/**/__tests__/**/*.spec.ts",
      "client/src/**/*.{spec,test}.ts?(x)",
    ],
    environmentMatchGlobs: [["client/src/**/*.{spec,test}.ts?(x)", "jsdom"]],
    setupFiles: ["./tests/setup-vitest.ts"],
  },
});
