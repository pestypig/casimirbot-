import type { Nhm2ComputableForm, Nhm2EquationVisualizerPreset } from "../../../shared/contracts/nhm2-equation-visualizer.v1.js";
import { variableTrace } from "../equation-variable-scope.js";
import type { EquationSampleResult } from "../equation-visualizer-types.js";

export function runGateStatusOperator(
  preset: Nhm2EquationVisualizerPreset,
  _form: Nhm2ComputableForm,
): EquationSampleResult {
  return {
    id: preset.id,
    graphMode: preset.graphMode,
    rows: [
      { gate: "validationClaimAllowed", value: false, status: "locked" },
      { gate: "physicalMechanismClaimAllowed", value: false, status: "locked" },
      { gate: "promotionAllowed", value: false, status: "locked" },
    ],
    variables: variableTrace(preset.variables),
    notes: ["Claim boundary gates remain locked for visualizer outputs."],
  };
}
