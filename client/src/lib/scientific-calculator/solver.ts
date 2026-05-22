import nerdamer from "nerdamer";
import "nerdamer/Algebra";
import "nerdamer/Calculus";
import "nerdamer/Solve";

export type ScientificSolveMode = "expression" | "equation";
export type ScientificCapabilityClass =
  | "arithmetic"
  | "symbolic_algebra"
  | "latex_parse"
  | "calculus"
  | "gr_warp_physics"
  | "unsupported";

export type ScientificSolveTrace = {
  traceId: string;
  runId: string;
  route: string;
  engine: "nerdamer" | "warp_full_solve" | "unsupported";
  sourceOfTruth: "scientific_calculator" | "einstein_backend" | "unsupported";
  capabilityClass: ScientificCapabilityClass;
  artifactPath: string | null;
  delegatedTo?: string | null;
  warnings: string[];
};

export type ScientificSolveStep = {
  id: string;
  label: string;
  value: string;
  latex?: string;
};

export type ScientificSolveResult = {
  ok: boolean;
  mode: ScientificSolveMode;
  input_latex: string;
  normalized_expression: string;
  variable: string | null;
  result_text: string;
  result_latex?: string;
  steps: ScientificSolveStep[];
  trace: ScientificSolveTrace;
  error?: string;
};

function makeTraceId(prefix = "scicalc"): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}:${Date.now().toString(36)}:${random}`;
}

function classifyScientificCapability(input: string): ScientificCapabilityClass {
  const normalized = input.toLowerCase();
  if (
    /\b(?:einstein\s+tensor|nat[aá]rio|qi\s+guardrail|quantum\s+inequality|full[-\s]?solve|warp[-\s]?full|rho\s*source|stress[-\s]?energy)\b/i.test(input) ||
    /g_\{?\\?mu\\?nu\}?|t_\{?00\}?|g4_qi|warp\.metric/i.test(input)
  ) {
    return "gr_warp_physics";
  }
  if (/\\frac\s*\{\s*d\s*\}\s*\{\s*d|diff\s*\(|differentiat|derivative/.test(normalized)) return "calculus";
  if (/\\|[\{\}\^_]/.test(input)) return "latex_parse";
  if (/[a-z]/i.test(input)) return "symbolic_algebra";
  return "arithmetic";
}

function buildTrace(input: string, warnings: string[] = []): ScientificSolveTrace {
  const capabilityClass = classifyScientificCapability(input);
  const traceId = makeTraceId(capabilityClass === "gr_warp_physics" ? "scicalc-delegate" : "scicalc");
  if (capabilityClass === "gr_warp_physics") {
    return {
      traceId,
      runId: traceId,
      route: "scientific-calculator/capability-router",
      engine: "unsupported",
      sourceOfTruth: "einstein_backend",
      capabilityClass,
      delegatedTo: "/api/physics/warp/calculator",
      artifactPath: null,
      warnings: [
        "Input was classified as GR/warp physics; use the warp/full-solve backend for a traceable result.",
        ...warnings,
      ],
    };
  }
  return {
    traceId,
    runId: traceId,
    route: "scientific-calculator/nerdamer",
    engine: "nerdamer",
    sourceOfTruth: "scientific_calculator",
    capabilityClass,
    artifactPath: null,
    warnings,
  };
}

function asNonEmpty(value: string): string {
  return value.trim();
}

function sanitizeLatexInput(value: string): string {
  return value
    .replace(/([A-Za-z0-9}\]])\\(?=[A-Za-z])/g, "$1*\\\\")
    .replace(/\\[,;:!]/g, " ")
    .replace(/\\quad\b|\\qquad\b/g, " ")
    .replace(/\\left\b|\\right\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function expressionFromLatexOrText(value: string): string {
  const input = sanitizeLatexInput(asNonEmpty(value));
  if (!input) return "";
  const hasLatexSignal = /\\|\{|\}|\^|_/.test(input);
  if (!hasLatexSignal) return input;
  try {
    const converted = nerdamer.convertFromLaTeX(input).toString();
    const lookedLikeTuple = converted.startsWith("(") && converted.endsWith(")") && converted.includes(",");
    const inputHadCommas = input.includes(",");
    if (lookedLikeTuple && !inputHadCommas) {
      return input;
    }
    return converted;
  } catch {
    return input;
  }
}

function toLatexExpression(expression: string): string {
  const trimmed = expression.trim();
  if (!trimmed) return "";
  try {
    return nerdamer.convertToLaTeX(trimmed);
  } catch {
    return trimmed;
  }
}

function toLatexEquation(equation: string): string {
  const trimmed = equation.trim();
  if (!trimmed) return "";
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) return toLatexExpression(trimmed);
  const lhs = trimmed.slice(0, eqIndex).trim();
  const rhs = trimmed.slice(eqIndex + 1).trim();
  return `${toLatexExpression(lhs)} = ${toLatexExpression(rhs)}`;
}

function formatNumericResult(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (value !== 0 && (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-6)) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }
  return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
}

function evaluateSafeArithmeticExpression(expression: string): string | null {
  const normalized = expression.replace(/\s+/g, "");
  if (!normalized || !/^[\deE.+\-*/^()]+$/.test(normalized)) return null;
  if (!/[+\-*/^]/.test(normalized)) return null;
  try {
    const jsExpression = normalized.replace(/\^/g, "**");
    const value = Function(`"use strict"; return (${jsExpression});`)();
    return typeof value === "number" && Number.isFinite(value) ? formatNumericResult(value) : null;
  } catch {
    return null;
  }
}

function chooseSolveVariable(expressionText: string): string | null {
  try {
    const vars = nerdamer(expressionText).variables();
    if (!vars.length) return null;
    return vars.includes("x") ? "x" : vars[0] ?? null;
  } catch {
    return null;
  }
}

function inferPrimaryEquationVariable(lhsExpr: string, fallbackExpr: string): string | null {
  try {
    const lhsVars = nerdamer(lhsExpr).variables();
    if (lhsVars.length) return lhsVars[0] ?? null;
  } catch {
    // fall through to fallback expression variable inference
  }
  return chooseSolveVariable(fallbackExpr);
}

export function runScientificSolve(inputLatex: string, withSteps: boolean): ScientificSolveResult {
  const input = asNonEmpty(inputLatex);
  const trace = buildTrace(input);
  if (!input) {
    return {
      ok: false,
      mode: "expression",
      input_latex: inputLatex,
      normalized_expression: "",
      variable: null,
      result_text: "",
      result_latex: "",
      steps: [],
      trace,
      error: "No equation input provided.",
    };
  }

  try {
    if (trace.capabilityClass === "gr_warp_physics") {
      return {
        ok: false,
        mode: input.includes("=") ? "equation" : "expression",
        input_latex: input,
        normalized_expression: input,
        variable: null,
        result_text: "This calculation requires the warp/full-solve backend.",
        result_latex: "",
        steps: withSteps
          ? [
              { id: "input", label: "Input", value: input, latex: input },
              {
                id: "capability_route",
                label: "Capability Route",
                value: "GR/warp physics is backend-only; delegate to /api/physics/warp/calculator.",
              },
            ]
          : [],
        trace,
        error: "backend_required",
      };
    }

    const steps: ScientificSolveStep[] = [];
    const pushStep = (id: string, label: string, value: string, latex?: string) => {
      if (!withSteps) return;
      steps.push({ id, label, value, latex });
    };

    pushStep("input", "Input", input, input);

    if (input.includes("=")) {
      const [lhsRaw, ...rhsParts] = input.split("=");
      const rhsRaw = rhsParts.join("=");
      const lhsExpr = expressionFromLatexOrText(lhsRaw);
      const rhsExpr = expressionFromLatexOrText(rhsRaw);
      const normalized = `${lhsExpr} = ${rhsExpr}`;
      pushStep("normalized", "Canonical Equation", normalized, toLatexEquation(normalized));
      const rearranged = `(${lhsExpr})-(${rhsExpr})`;
      const standardForm = `${rearranged} = 0`;
      pushStep("rearranged", "Standard Form", standardForm, toLatexEquation(standardForm));
      const variable = inferPrimaryEquationVariable(lhsExpr, rearranged);
      pushStep("target_variable", "Target Variable", variable ?? "none");

      let resultText = "";
      let resultLatex = "";
      let solveError = "";

      if (variable) {
        const solver = nerdamer as unknown as {
          solveEquations?: (equations: string | string[], variable?: string) => unknown;
        };
        if (typeof solver.solveEquations === "function") {
          try {
            const solved = solver.solveEquations(normalized, variable);
            if (Array.isArray(solved) && solved.length > 0) {
              resultText = solved
                .map((entry) => {
                  if (Array.isArray(entry)) {
                    return entry.map((item) => String(item)).join(" = ");
                  }
                  return String(entry);
                })
                .join(", ");
              resultLatex = solved
                .map((entry) => {
                  if (Array.isArray(entry) && entry.length >= 2) {
                    return `${toLatexExpression(String(entry[0]))} = ${toLatexExpression(String(entry[1]))}`;
                  }
                  return `${toLatexExpression(variable)} = ${toLatexExpression(String(entry))}`;
                })
                .join(",\\ ");
            }
          } catch (error) {
            solveError = error instanceof Error ? error.message : String(error);
          }
        }
        if (!resultText) {
          try {
            const solved = nerdamer(rearranged).solveFor(variable);
            resultText = solved.toString();
            resultLatex = `${toLatexExpression(variable)} = ${toLatexExpression(resultText)}`;
          } catch (error) {
            solveError = error instanceof Error ? error.message : String(error);
          }
        }
      } else {
        solveError = "No symbolic variable detected for direct solve.";
      }

      if (!resultText) {
        resultText = `${normalized} (symbolic relation preserved; direct closed-form solve unavailable)`;
        resultLatex = toLatexEquation(normalized);
        pushStep("solver_notice", "Solver Notice", "Direct closed-form solve unavailable for this symbolic relation.");
      }
      pushStep("solved", variable ? `Solve for ${variable}` : "Symbolic Relation", resultText, resultLatex);
      return {
        ok: true,
        mode: "equation",
        input_latex: input,
        normalized_expression: normalized,
        variable,
        result_text: resultText,
        result_latex: resultLatex,
        steps,
        trace,
      };
    }

    const normalizedExpression = expressionFromLatexOrText(input);
    pushStep("normalized", "Canonical Expression", normalizedExpression, toLatexExpression(normalizedExpression));
    const simplified = nerdamer(normalizedExpression).expand().toString();
    pushStep("simplified", "Expanded/Simplified", simplified, toLatexExpression(simplified));
    let evaluated = simplified;
    let evaluatedLatex = toLatexExpression(simplified);
    try {
      evaluated = nerdamer(simplified).evaluate().text("decimals");
      const safeArithmeticResult = evaluateSafeArithmeticExpression(normalizedExpression);
      if (
        safeArithmeticResult &&
        (/[eE]/.test(normalizedExpression) || /^-?0(?:\.0+)?$/.test(evaluated.trim())) &&
        safeArithmeticResult !== "0"
      ) {
        evaluated = safeArithmeticResult;
      }
      evaluatedLatex = toLatexExpression(evaluated);
      pushStep("evaluated", "Evaluated", evaluated, evaluatedLatex);
    } catch (error) {
      const evalError = error instanceof Error ? error.message : String(error);
      pushStep("evaluation_notice", "Evaluation Notice", evalError);
      pushStep("evaluated", "Symbolic Result", evaluated, evaluatedLatex);
    }

    return {
      ok: true,
      mode: "expression",
      input_latex: input,
      normalized_expression: normalizedExpression,
      variable: chooseSolveVariable(normalizedExpression),
      result_text: evaluated,
      result_latex: evaluatedLatex,
      steps,
      trace,
    };
  } catch (error) {
    return {
      ok: false,
      mode: input.includes("=") ? "equation" : "expression",
      input_latex: input,
      normalized_expression: expressionFromLatexOrText(input),
      variable: null,
      result_text: "",
      result_latex: "",
      steps: [],
      trace: buildTrace(input, [error instanceof Error ? error.message : String(error)]),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
