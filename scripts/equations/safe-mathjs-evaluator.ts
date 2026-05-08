import { evaluate, parse } from "mathjs";

const ALLOWED_NODE_TYPES = new Set([
  "AccessorNode",
  "ArrayNode",
  "ConstantNode",
  "FunctionNode",
  "IndexNode",
  "OperatorNode",
  "ParenthesisNode",
  "SymbolNode",
]);

const ALLOWED_FUNCTIONS = new Set([
  "abs",
  "acos",
  "asin",
  "atan",
  "cos",
  "exp",
  "log",
  "log10",
  "max",
  "min",
  "pow",
  "sin",
  "sqrt",
  "tan",
]);

const ALLOWED_OPERATORS = new Set(["+", "-", "*", "/", "^", "unaryMinus", "unaryPlus"]);

export interface SafeEvaluationResult {
  value: number | null;
  invalidReason?: string;
}

export function validateSafeMathExpression(expression: string, allowedSymbols: Set<string>): string[] {
  const issues: string[] = [];
  let root: any;
  try {
    root = parse(expression);
  } catch (error) {
    return [`parse_error:${(error as Error).message}`];
  }
  root.traverse((node: any) => {
    if (!ALLOWED_NODE_TYPES.has(node.type)) {
      issues.push(`disallowed_node_type:${node.type}`);
    }
    if (node.type === "OperatorNode" && !ALLOWED_OPERATORS.has(String(node.op))) {
      issues.push(`disallowed_operator:${node.op}`);
    }
    if (node.type === "FunctionNode") {
      const fnName = String(node.fn?.name ?? node.name ?? "");
      if (!ALLOWED_FUNCTIONS.has(fnName)) issues.push(`disallowed_function:${fnName}`);
    }
    if (node.type === "SymbolNode") {
      const name = String(node.name);
      if (!allowedSymbols.has(name) && name !== "pi" && name !== "e" && !ALLOWED_FUNCTIONS.has(name)) {
        issues.push(`unknown_symbol:${name}`);
      }
    }
  });
  return issues;
}

export function evaluateSafeMathExpression(
  expression: string,
  scope: Record<string, number>,
  options: { finiteOnly?: boolean; allowComplex?: boolean } = {},
): SafeEvaluationResult {
  const allowedSymbols = new Set([...Object.keys(scope), "pi", "e"]);
  const issues = validateSafeMathExpression(expression, allowedSymbols);
  if (issues.length > 0) return { value: null, invalidReason: issues.join(";") };
  try {
    const value = evaluate(expression, { pi: Math.PI, e: Math.E, ...scope });
    if (typeof value !== "number") return { value: null, invalidReason: `non_numeric_output:${typeof value}` };
    if (options.finiteOnly !== false && !Number.isFinite(value)) return { value: null, invalidReason: "non_finite_output" };
    if (options.allowComplex !== true && String(value).includes("i")) return { value: null, invalidReason: "complex_output" };
    return { value };
  } catch (error) {
    return { value: null, invalidReason: `evaluation_error:${(error as Error).message}` };
  }
}
