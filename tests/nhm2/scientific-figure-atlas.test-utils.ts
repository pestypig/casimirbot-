import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Nhm2ScientificFigureAtlasManifest } from "../../shared/contracts/nhm2-scientific-figure-atlas.v1.js";

export const SCIENTIFIC_ATLAS_TEST_OUT = path.join("artifacts", "tmp", "scientific-figure-atlas-vitest");

export function ensureScientificAtlasRendered(): string {
  const manifestPath = path.join(SCIENTIFIC_ATLAS_TEST_OUT, "manifest.json");
  if (fs.existsSync(manifestPath) && !manifestHasFidelityOutputs(manifestPath)) {
    fs.rmSync(SCIENTIFIC_ATLAS_TEST_OUT, { recursive: true, force: true });
  }
  if (!fs.existsSync(manifestPath)) {
    execFileSync(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "scripts/render-nhm2-scientific-figure-atlas.ts",
      "--out",
      SCIENTIFIC_ATLAS_TEST_OUT,
      "--run-id",
      "vitest-scientific-figure-atlas",
    ], { stdio: "inherit" });
  }
  return manifestPath;
}

export function loadScientificAtlasManifest(): Nhm2ScientificFigureAtlasManifest {
  return JSON.parse(fs.readFileSync(ensureScientificAtlasRendered(), "utf8")) as Nhm2ScientificFigureAtlasManifest;
}

export function resolveRepoPath(relativeOrAbsolutePath: string): string {
  return path.isAbsolute(relativeOrAbsolutePath) ? relativeOrAbsolutePath : path.join(process.cwd(), relativeOrAbsolutePath);
}

function manifestHasFidelityOutputs(manifestPath: string): boolean {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Nhm2ScientificFigureAtlasManifest;
  return manifest.figures.some((figure) => figure.id === "03_lapse_shift_grid_slice" && Boolean(figure.fieldStatsJson));
}
