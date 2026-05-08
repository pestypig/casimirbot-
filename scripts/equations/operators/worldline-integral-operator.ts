import type { Nhm2ComputableForm, Nhm2EquationVisualizerPreset } from "../../../shared/contracts/nhm2-equation-visualizer.v1.js";
import { evaluateSafeMathExpression } from "../safe-mathjs-evaluator.js";
import { sweepValues, variableTrace } from "../equation-variable-scope.js";
import type { EquationSampleResult } from "../equation-visualizer-types.js";

export function runWorldlineIntegralOperator(
  preset: Nhm2EquationVisualizerPreset,
  form: Nhm2ComputableForm,
): EquationSampleResult {
  if (!form.expression) throw new Error(`worldline_integral_missing_expression:${form.id}`);
  const sweep = preset.variables.find((variable) => variable.source === "sweep_axis");
  if (!sweep) throw new Error(`worldline_integral_missing_sweep:${preset.id}`);
  const tau0 = preset.variables.find((variable) => variable.name === "tau0")?.defaultValue ?? 0.5;
  const sigma = preset.variables.find((variable) => variable.name === "sigma")?.defaultValue ?? 0.18;
  const rows = sweepValues(sweep, form.domainPolicy.maxSamples).map((tau) => {
    const result = evaluateSafeMathExpression(form.expression!, { tau, tau0, sigma }, {
      finiteOnly: true,
      allowComplex: false,
    });
    return {
      tau,
      value: result.value,
      channel: "sampling_weight",
      invalid: result.value === null,
      invalidReason: result.invalidReason,
    };
  });
  return {
    id: preset.id,
    graphMode: preset.graphMode,
    rows,
    variables: variableTrace(preset.variables),
    notes: ["Sampling window is a QEI requirement visualization, not a completed QEI bound."],
  };
}
