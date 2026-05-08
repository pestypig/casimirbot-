import fs from "node:fs";
import type { Nhm2ComputableForm, Nhm2EquationVisualizerPreset } from "../../../shared/contracts/nhm2-equation-visualizer.v1.js";
import { variableTrace } from "../equation-variable-scope.js";
import type { EquationSampleResult } from "../equation-visualizer-types.js";

const SOURCE_CLOSURE = "artifacts/research/full-solve/nhm2-source-closure-latest.json";

export function runResidualOperator(
  preset: Nhm2EquationVisualizerPreset,
  form: Nhm2ComputableForm,
): EquationSampleResult {
  const artifact = JSON.parse(fs.readFileSync(SOURCE_CLOSURE, "utf8"));
  const metric = artifact.tensors?.metricRequired ?? {};
  const tile = artifact.tensors?.tileEffective ?? {};
  const axes = ["0", "1", "2", "3"];
  const rows = axes.flatMap((a) => axes.map((b) => {
    const component = `T${a}${b}`;
    const hasMetric = typeof metric[component] === "number";
    const hasTile = typeof tile[component] === "number";
    const value = hasMetric && hasTile ? metric[component] - tile[component] : null;
    return {
      a,
      b,
      component,
      metricRequired: hasMetric ? metric[component] : null,
      tileEffective: hasTile ? tile[component] : null,
      value,
      status: hasMetric && hasTile ? "available" : "missing",
      invalid: !(hasMetric && hasTile),
      invalidReason: hasMetric && hasTile ? undefined : "missing_same_basis_counterpart",
    };
  }));
  return {
    id: preset.id,
    graphMode: preset.graphMode,
    rows,
    variables: variableTrace(preset.variables),
    notes: [
      "Residuals are shown only where both metric-required and tile-effective components are present.",
      "Missing components are status-coded and are not plotted as zero.",
    ],
  };
}
