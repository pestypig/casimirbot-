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
    include: [
      "tests/**/*.spec.ts",
      "server/**/__tests__/**/*.spec.ts",
      "tools/**/__tests__/**/*.spec.ts",
      "client/src/**/*.{spec,test}.ts?(x)",
    ],
    environmentMatchGlobs: [["client/src/**/*.{spec,test}.ts?(x)", "jsdom"]],
    setupFiles: ["./tests/setup-vitest.ts"],
  },
});
