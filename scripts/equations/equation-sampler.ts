import type { ResolvedEquationNode, EquationSampleResult } from "./equation-visualizer-types.js";
import { runFieldSampleOperator } from "./operators/field-sample-operator.js";
import { runResidualOperator } from "./operators/residual-operator.js";
import { runScalarExpressionOperator } from "./operators/scalar-expression-operator.js";
import { runWorldlineIntegralOperator } from "./operators/worldline-integral-operator.js";
import { runGateStatusOperator } from "./operators/gate-status-operator.js";

export function sampleEquationNode(resolved: ResolvedEquationNode): EquationSampleResult {
  const { preset, form } = resolved;
  switch (form.operatorKind) {
    case "field_sample":
      return runFieldSampleOperator(preset, form);
    case "residual":
      return runResidualOperator(preset, form);
    case "scalar_expression":
      return runScalarExpressionOperator(preset, form);
    case "worldline_integral":
      return runWorldlineIntegralOperator(preset, form);
    case "gate_status":
      return runGateStatusOperator(preset, form);
    default:
      throw new Error(`operator_not_implemented:${form.operatorKind}`);
  }
}
