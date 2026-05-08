import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type {
  Nhm2EquationVisualizerManifest,
  Nhm2EquationVisualizerPresetFile,
} from "../../shared/contracts/nhm2-equation-visualizer.v1.js";

export const EQUATION_VISUALIZER_TEST_OUT = path.join("artifacts", "tmp", "equation-visualizer-vitest");
export const PRESETS_PATH = path.join("docs", "research", "nhm2-equation-visualizer-presets.v1.json");

export function ensureEquationVisualizerRendered(): string {
  const manifestPath = path.join(EQUATION_VISUALIZER_TEST_OUT, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    execFileSync(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "scripts/render-nhm2-equation-visualizer-demos.ts",
      "--out",
      EQUATION_VISUALIZER_TEST_OUT,
      "--run-id",
      "vitest-equation-visualizer",
    ], { stdio: "inherit" });
  }
  return manifestPath;
}

export function loadEquationVisualizerManifest(): Nhm2EquationVisualizerManifest {
  return JSON.parse(fs.readFileSync(ensureEquationVisualizerRendered(), "utf8")) as Nhm2EquationVisualizerManifest;
}

export function loadEquationVisualizerPresets(): Nhm2EquationVisualizerPresetFile {
  return JSON.parse(fs.readFileSync(PRESETS_PATH, "utf8")) as Nhm2EquationVisualizerPresetFile;
}

export function resolveRepoPath(relativeOrAbsolutePath: string): string {
  return path.isAbsolute(relativeOrAbsolutePath) ? relativeOrAbsolutePath : path.join(process.cwd(), relativeOrAbsolutePath);
}
