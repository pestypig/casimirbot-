import fs from "node:fs";
import path from "node:path";
import type { Nhm2EquationVisualizerPresetFile } from "../../shared/contracts/nhm2-equation-visualizer.v1.js";
import type { Nhm2ObservableEquationMap } from "../../shared/contracts/nhm2-observable-equation-map.v1.js";
import { sha256File } from "../figures/figure-manifest.js";

export const DEFAULT_EQUATION_MAP_PATH = path.join("docs", "research", "nhm2-observable-equation-map.v1.json");
export const DEFAULT_VISUALIZER_PRESETS_PATH = path.join("docs", "research", "nhm2-equation-visualizer-presets.v1.json");

export function loadEquationMap(mapPath = DEFAULT_EQUATION_MAP_PATH): Nhm2ObservableEquationMap {
  return JSON.parse(fs.readFileSync(mapPath, "utf8")) as Nhm2ObservableEquationMap;
}

export function loadVisualizerPresets(presetPath = DEFAULT_VISUALIZER_PRESETS_PATH): Nhm2EquationVisualizerPresetFile {
  return JSON.parse(fs.readFileSync(presetPath, "utf8")) as Nhm2EquationVisualizerPresetFile;
}

export function equationMapRef(mapPath = DEFAULT_EQUATION_MAP_PATH): { path: string; sha256: string } {
  return {
    path: mapPath.replace(/\\/g, "/"),
    sha256: sha256File(mapPath),
  };
}
