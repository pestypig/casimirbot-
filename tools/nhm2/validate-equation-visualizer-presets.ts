import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  validateNhm2EquationVisualizerPresetFile,
  type Nhm2EquationVisualizerPresetFile,
} from "../../shared/contracts/nhm2-equation-visualizer.v1.js";
import type { Nhm2ObservableEquationMap } from "../../shared/contracts/nhm2-observable-equation-map.v1.js";
import { DEFAULT_EQUATION_MAP_PATH, DEFAULT_VISUALIZER_PRESETS_PATH } from "../../scripts/equations/load-equation-map.js";
import { findComputableForm } from "../../scripts/equations/equation-node-resolver.js";
import { validateSafeMathExpression } from "../../scripts/equations/safe-mathjs-evaluator.js";
import { getAxisTemplate, validateAxisTemplateForMode } from "../../scripts/equations/equation-axis-templates.js";
import { sha256File } from "../../scripts/figures/figure-manifest.js";

export function validateEquationVisualizerPresets(
  presetPath = DEFAULT_VISUALIZER_PRESETS_PATH,
  mapPath = DEFAULT_EQUATION_MAP_PATH,
): string[] {
  const issues: string[] = [];
  if (!fs.existsSync(presetPath)) return [`preset file not found: ${presetPath}`];
  if (!fs.existsSync(mapPath)) return [`equation map not found: ${mapPath}`];
  const presetFile = JSON.parse(fs.readFileSync(presetPath, "utf8")) as Nhm2EquationVisualizerPresetFile;
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8")) as Nhm2ObservableEquationMap;
  issues.push(...validateNhm2EquationVisualizerPresetFile(presetFile));
  const mapHash = sha256File(mapPath);
  if (presetFile.equationMap.sha256 !== mapHash) issues.push("preset equationMap hash does not match current map");

  for (const preset of presetFile.presets) {
    const node = map.nodes.find((entry) => entry.id === preset.equationNodeId);
    if (!node) {
      issues.push(`preset references missing equation-map node: ${preset.id}:${preset.equationNodeId}`);
      continue;
    }
    const form = findComputableForm(node, preset.computableFormId);
    if (!form) {
      issues.push(`preset references missing computableForm: ${preset.id}:${preset.computableFormId}`);
      continue;
    }
    if (!form.allowedGraphModes.includes(preset.graphMode)) issues.push(`preset graph mode is not allowed by computableForm: ${preset.id}`);
    const template = getAxisTemplate(form, preset.axisTemplateId);
    issues.push(...validateAxisTemplateForMode(template));
    const presetVariableNames = new Set(preset.variables.map((variable) => variable.name));
    for (const variable of form.inputs) {
      if (variable.required && !presetVariableNames.has(variable.name) && variable.source !== "constant") {
        issues.push(`preset ${preset.id} omits required variable ${variable.name}`);
      }
    }
    for (const variable of preset.variables) {
      if (!variable.units) issues.push(`preset ${preset.id} variable ${variable.name} missing units`);
      if (variable.source === "repo_artifact") {
        const artifactPath = variable.artifactBinding?.artifactPath;
        if (!artifactPath || !fs.existsSync(artifactPath)) issues.push(`preset ${preset.id} repo variable missing artifact ${artifactPath ?? variable.name}`);
        if (variable.artifactBinding?.sha256Required !== true) issues.push(`preset ${preset.id} repo variable ${variable.name} must require sha256`);
      }
      if (variable.source === "manual_input" && (!variable.defaultRange || typeof variable.defaultValue !== "number")) {
        issues.push(`preset ${preset.id} manual variable ${variable.name} requires default/range`);
      }
      if (variable.source === "sweep_axis") {
        const range = variable.defaultRange;
        if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max) || !Number.isFinite(range.steps)) {
          issues.push(`preset ${preset.id} sweep variable ${variable.name} requires finite range`);
        }
        if (range && range.steps > form.domainPolicy.maxSamples) {
          issues.push(`preset ${preset.id} sweep variable ${variable.name} exceeds maxSamples`);
        }
      }
    }
    if (form.expression) {
      const symbols = new Set(form.inputs.map((input) => input.name));
      const expressionIssues = validateSafeMathExpression(form.expression, symbols);
      issues.push(...expressionIssues.map((issue) => `preset ${preset.id} expression ${issue}`));
    }
    if (/Casimir|QEI|NEC|WEC|stress-energy|warp/i.test(`${preset.caption} ${preset.uncertaintyNote}`) && preset.literatureRefs.length === 0) {
      issues.push(`preset ${preset.id} uses physics-boundary terms without literatureRefs`);
    }
  }
  const text = JSON.stringify(presetFile);
  if (/[A-Z]:[\\/]/.test(text)) issues.push("preset file contains absolute local Windows path");
  return issues;
}

function parseArgs(argv: string[]): { presets?: string; map?: string } {
  const get = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return { presets: get("presets"), map: get("map") };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const issues = validateEquationVisualizerPresets(args.presets, args.map);
  if (issues.length > 0) {
    console.error(JSON.stringify({ ok: false, issues }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, presets: args.presets ?? DEFAULT_VISUALIZER_PRESETS_PATH }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
