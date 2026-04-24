import nerdamer from "nerdamer";
import "nerdamer/Algebra";
import "nerdamer/Calculus";
import "nerdamer/Solve";

export type ScientificSolveMode = "expression" | "equation";

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
  error?: string;
};

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
      error: "No equation input provided.",
    };
  }

  try {
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
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
