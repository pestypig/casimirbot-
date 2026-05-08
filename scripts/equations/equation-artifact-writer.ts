import path from "node:path";
import type {
  Nhm2EquationVisualizerManifest,
  Nhm2EquationVisualizerPreset,
} from "../../shared/contracts/nhm2-equation-visualizer.v1.js";
import { ensureDir, relPath, writeJson } from "../figures/figure-manifest.js";
import { renderVegaLite } from "../figures/render-vega.js";
import type { EquationSampleResult, EquationVisualizerRenderResult, ResolvedEquationNode } from "./equation-visualizer-types.js";
import { buildEquationPlotSpec } from "./equation-plot-spec.js";

export async function writeEquationVisualizerArtifact(
  outRoot: string,
  resolved: ResolvedEquationNode,
  sample: EquationSampleResult,
): Promise<EquationVisualizerRenderResult> {
  const preset = resolved.preset;
  for (const dir of ["presets", "source-data", "specs", "figures"]) ensureDir(path.join(outRoot, dir));
  const presetPath = path.join(outRoot, "presets", `${preset.id}.visualizer-preset.json`);
  const sourceDataJson = path.join(outRoot, "source-data", `${preset.id}.data.json`);
  const specJson = path.join(outRoot, "specs", `${preset.id}.vega.json`);
  const svg = path.join(outRoot, "figures", `${preset.id}.svg`);
  const png = path.join(outRoot, "figures", `${preset.id}.png`);
  const spec = buildEquationPlotSpec(preset, sample);

  writeJson(presetPath, preset);
  writeJson(sourceDataJson, {
    presetId: preset.id,
    equationNodeId: preset.equationNodeId,
    computableFormId: preset.computableFormId,
    graphMode: preset.graphMode,
    rows: sample.rows,
    variables: sample.variables,
    notes: sample.notes,
    invalidSamples: sample.rows.filter((row) => row.invalid),
    claimBoundary: preset.claimBoundary,
  });
  await renderVegaLite(spec, svg, png, specJson);

  return {
    id: preset.id,
    equationNodeId: preset.equationNodeId,
    computableFormId: preset.computableFormId,
    graphMode: preset.graphMode,
    outputPng: relPath(png),
    outputSvg: relPath(svg),
    sourceDataJson: relPath(sourceDataJson),
    vegaSpecJson: relPath(specJson),
    visualizerPresetJson: relPath(presetPath),
    variables: sample.variables,
    caption: preset.caption,
    uncertaintyNote: preset.uncertaintyNote,
    literatureRefs: preset.literatureRefs,
  };
}

export function writeEquationVisualizerManifest(
  outRoot: string,
  manifest: Nhm2EquationVisualizerManifest,
): void {
  writeJson(path.join(outRoot, "manifest.json"), manifest);
}

export function manifestOutputFromResult(result: EquationVisualizerRenderResult, preset: Nhm2EquationVisualizerPreset) {
  return {
    ...result,
    claimBoundary: preset.claimBoundary,
  };
}
