import type { Nhm2ComputableForm, Nhm2EquationVisualizerPreset } from "../../../shared/contracts/nhm2-equation-visualizer.v1.js";
import { evaluateSafeMathExpression } from "../safe-mathjs-evaluator.js";
import { buildBaseScope, resolveScopeValue, sweepValues, variableTrace } from "../equation-variable-scope.js";
import type { EquationSampleResult } from "../equation-visualizer-types.js";

export function runScalarExpressionOperator(
  preset: Nhm2EquationVisualizerPreset,
  form: Nhm2ComputableForm,
): EquationSampleResult {
  if (!form.expression) throw new Error(`scalar_expression_missing_expression:${form.id}`);
  const sweep = preset.variables.find((variable) => variable.source === "sweep_axis");
  if (!sweep) throw new Error(`scalar_expression_missing_sweep:${preset.id}`);
  const baseScope = buildBaseScope([...form.inputs, ...preset.variables]);
  const values = sweepValues(sweep, form.domainPolicy.maxSamples);
  const rows = values.map((x) => {
    const scope: Record<string, number> = { pi: Math.PI, [sweep.name]: x };
    for (const variable of [...form.inputs, ...preset.variables]) {
      if (variable.name === sweep.name) continue;
      const resolved = resolveScopeValue(baseScope, variable);
      if (resolved !== undefined) scope[variable.name] = resolved;
    }
    const result = evaluateSafeMathExpression(form.expression!, scope, {
      finiteOnly: form.domainPolicy.finiteOnly,
      allowComplex: form.domainPolicy.allowComplex,
    });
    return {
      [sweep.name]: x,
      value: result.value,
      output: form.outputs[0]?.name ?? "value",
      invalid: result.value === null,
      invalidReason: result.invalidReason,
    };
  });
  return {
    id: preset.id,
    graphMode: preset.graphMode,
    rows,
    variables: variableTrace(preset.variables),
    notes: ["Scalar expression evaluated through math.js with project AST whitelist."],
  };
}
