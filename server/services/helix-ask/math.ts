import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import nerdamer from "nerdamer";
import "nerdamer/Solve";
import "nerdamer/Calculus";

const scriptPath = fileURLToPath(new URL("../../../scripts/py/math_solve.py", import.meta.url));

export type HelixAskMathSolveResult = {
  ok: boolean;
  kind?: "solve" | "derivative" | "evaluate";
  final?: string;
  equation?: string;
  equations?: string[];
  solutions?: string[];
  solutionMap?: Record<string, string[]>;
  expr?: string;
  variable?: string;
  reason?: string;
  gatePass?: boolean;
  gateReason?: string;
  domainPass?: boolean;
  residualPass?: boolean;
  residualMax?: number;
  registryId?: string;
  selectedSolution?: string;
  admissibleSolutions?: string[];
};

const MATH_TRIGGER =
  /\b(solve|derivative|d\/d[a-z]|equation|quadratic|algebra|integral|differentiate)\b|[A-Za-z_][A-Za-z0-9_]*\s*=\s*[A-Za-z_(]|[0-9]+\s*[+\-*/^=]/i;

export function isHelixAskMathQuestion(question: string): boolean {
  const trimmed = question.trim();
  if (!trimmed) return false;
  return MATH_TRIGGER.test(trimmed);
}

type MathRegistryEntry = {
  id: string;
  targetVar: string;
  equations: string[];
  matchers: RegExp[];
  preferredSolutionExpr?: string;
  assignments: Record<string, number>;
  domainConstraints?: string[];
  tolerance: number;
};

const MATH_REGISTRY: MathRegistryEntry[] = [
  {
    id: "natario.theta_scale_core.gamma_geo",
    targetVar: "gammaGeo",
    equations: ["thetaScaleCore = gammaGeo^3 * qEnhancement * sqrt(dutyFactor)"],
    matchers: [
      /thetaScaleCore\s*=\s*gammaGeo\^?3/i,
      /gammaGeo\^?3\s*\*\s*qEnhancement/i,
    ],
    preferredSolutionExpr: "(thetaScaleCore / (qEnhancement * sqrt(dutyFactor)))^(1/3)",
    assignments: {
      thetaScaleCore: 10,
      qEnhancement: 2,
      dutyFactor: 0.25,
    },
    domainConstraints: [
      "gammaGeo >= 1",
      "thetaScaleCore > 0",
      "qEnhancement > 0",
      "dutyFactor > 0",
    ],
    tolerance: 1e-8,
  },
  {
    id: "natario.geometric_amplification.gamma_geo",
    targetVar: "gammaGeo",
    equations: ["geometricAmplification = gammaGeo^3 * gammaVanDenBroeck"],
    matchers: [
      /geometricAmplification\s*=\s*gammaGeo\^?3/i,
      /gammaGeo\^?3\s*\*\s*gammaVanDenBroeck/i,
    ],
    preferredSolutionExpr: "(geometricAmplification / gammaVanDenBroeck)^(1/3)",
    assignments: {
      geometricAmplification: 64,
      gammaVanDenBroeck: 2,
    },
    domainConstraints: ["gammaGeo >= 1", "geometricAmplification > 0", "gammaVanDenBroeck > 0"],
    tolerance: 1e-8,
  },
  {
    id: "natario.dynamic_amplification.q_enhancement",
    targetVar: "qEnhancement",
    equations: ["qEnhancement = sqrt(cavityQ / referenceQ)"],
    matchers: [
      /qEnhancement\s*=\s*sqrt\(cavityQ\s*\/\s*referenceQ\)/i,
      /sqrt\(cavityQ\s*\/\s*referenceQ\)/i,
    ],
    preferredSolutionExpr: "sqrt(cavityQ / referenceQ)",
    assignments: {
      cavityQ: 4e9,
      referenceQ: 1e9,
    },
    domainConstraints: ["qEnhancement >= 1", "cavityQ > 0", "referenceQ > 0"],
    tolerance: 1e-8,
  },
  {
    id: "natario.dynamic_amplification.cavity_q",
    targetVar: "cavityQ",
    equations: ["qEnhancement = sqrt(cavityQ / referenceQ)"],
    matchers: [
      /qEnhancement\s*=\s*sqrt\(cavityQ\s*\/\s*referenceQ\)/i,
      /solve\s+for\s+cavityQ/i,
    ],
    preferredSolutionExpr: "referenceQ * qEnhancement^2",
    assignments: {
      referenceQ: 1e9,
      qEnhancement: 2,
    },
    domainConstraints: ["cavityQ > 0", "referenceQ > 0", "qEnhancement > 0"],
    tolerance: 1e-8,
  },
];

function sanitizeMathInput(value: string): string {
  const withoutPrefix = value.replace(/^question\s*:/i, "").trim();
  const normalized = withoutPrefix
    .replace(/[\u2212\u2013\u2014]/g, "-")
    .replace(/[\u00d7\u2217]/g, "*")
    .replace(/\u00f7/g, "/")
    .replace(/\*\*/g, "^")
    .replace(/`+/g, "")
    .trim();
  const instructionSplit = normalized.split(
    /\b(explain|briefly|in practice|details|show work|steps|answer only)\b/i,
    1,
  )[0];
  return instructionSplit.replace(/[.,;]+$/g, "").trim();
}

function extractEquation(question: string): string {
  const normalized = sanitizeMathInput(question);
  if (/solve\b/i.test(normalized)) {
    const colonIndex = normalized.indexOf(":");
    if (colonIndex >= 0) {
      return sanitizeMathInput(normalized.slice(colonIndex + 1));
    }
    if (normalized.includes("=")) {
      const eqStartMatch = normalized.match(/[A-Za-z0-9_(][^=]*[+\-*/^][^=]*=/);
      if (eqStartMatch) {
        const startIndex = normalized.indexOf(eqStartMatch[0]);
        return sanitizeMathInput(normalized.slice(startIndex));
      }
    }
  }
  if (normalized.includes("=")) {
    return sanitizeMathInput(normalized);
  }
  return "";
}

const RESERVED_TOKENS = new Set([
  "solve",
  "for",
  "derivative",
  "differentiate",
  "equation",
  "integral",
  "what",
  "is",
  "the",
  "of",
  "and",
  "or",
  "let",
  "be",
  "with",
  "respect",
  "to",
  "sin",
  "cos",
  "tan",
  "sqrt",
  "log",
  "ln",
  "exp",
  "abs",
  "pow",
  "min",
  "max",
]);

function collectVariables(text: string): string[] {
  const matches = text.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
  const seen = new Set<string>();
  for (const token of matches) {
    const lower = token.toLowerCase();
    if (RESERVED_TOKENS.has(lower)) continue;
    if (lower.length === 1 && lower >= "a" && lower <= "z") {
      seen.add(token);
      continue;
    }
    // Keep longer identifiers (e.g., gammaGeo, thetaScaleCore).
    seen.add(token);
  }
  return Array.from(seen);
}

function inferSolveVariable(question: string, equations: string[]): string | undefined {
  const solveForMatch = question.match(/solve\s+for\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  if (solveForMatch?.[1]) return solveForMatch[1];
  const joined = equations.join(" ");
  const variables = collectVariables(joined);
  if (variables.includes("x")) return "x";
  return variables[0];
}

function inferDerivativeVariable(question: string): string {
  const ddMatch = question.match(/d\/d([A-Za-z_][A-Za-z0-9_]*)/i);
  if (ddMatch?.[1]) return ddMatch[1];
  const wrtMatch = question.match(/with\s+respect\s+to\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  if (wrtMatch?.[1]) return wrtMatch[1];
  const fxVar = question.match(/f\(([A-Za-z_][A-Za-z0-9_]*)\)/i);
  if (fxVar?.[1]) return fxVar[1];
  return "x";
}

function extractDerivativeExpr(question: string): { expr: string; variable: string } | null {
  const variable = inferDerivativeVariable(question);
  const fxMatch = question.match(/f\([A-Za-z_][A-Za-z0-9_]*\)\s*=\s*(.+)$/i);
  if (fxMatch?.[1]) return { expr: sanitizeMathInput(fxMatch[1]), variable };
  const derivMatch = question.match(/derivative of\s+(.+)$/i);
  if (derivMatch?.[1]) return { expr: sanitizeMathInput(derivMatch[1]), variable };
  const ddxMatch = question.match(/d\/d[A-Za-z_][A-Za-z0-9_]*\s*(.+)$/i);
  if (ddxMatch?.[1]) return { expr: sanitizeMathInput(ddxMatch[1]), variable };
  return null;
}

function normalizeExpression(expr: string): string {
  const sanitized = sanitizeMathInput(expr)
    .replace(/^[^0-9a-zA-Z(+-]+/, "")
    .replace(/[?]+$/g, "")
    .trim();
  const trimmed = sanitized.replace(/\s+/g, " ");
  const stopIndex = sanitized.search(/\.(?=\s+[A-Za-z])/);
  return stopIndex === -1 ? trimmed : trimmed.slice(0, stopIndex).trim();
}

function stripLeadingNoise(expr: string): string {
  return expr.replace(/^(of|the)\s+/i, "").trim();
}

function toExplicitMultiplication(expr: string): string {
  return expr
    .replace(/(\d)([A-Za-z_])/g, "$1*$2")
    .replace(/(\))([A-Za-z0-9_])/g, "$1*$2");
}

function splitEquations(equationText: string): string[] {
  const baseParts = equationText
    .split(/[\n;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const equations: string[] = [];
  for (const part of baseParts) {
    if (!part.includes("=")) continue;
    const commaSplit = part.split(/,(?=[^,]*=)/).map((p) => p.trim());
    if (commaSplit.length > 1) {
      equations.push(...commaSplit.filter((p) => p.includes("=")));
      continue;
    }
    const andSplit = part.split(/\band\b/i).map((p) => p.trim());
    if (andSplit.length > 1 && andSplit.every((p) => p.includes("="))) {
      equations.push(...andSplit);
      continue;
    }
    equations.push(part);
  }
  return equations;
}

function extractEquationSystem(question: string): string[] {
  const equationText = extractEquation(question);
  if (!equationText) return [];
  const equations = splitEquations(equationText);
  return equations.length > 0 ? equations : [equationText];
}

function prettyMath(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\+\s*-/g, "- ")
    .replace(/^\+\s*/, "")
    .replace(/\(\+\s*/g, "(")
    .replace(/(\d)\*([A-Za-z_])/g, "$1$2")
    .replace(/([A-Za-z_])\*(\d)/g, "$1$2")
    .trim();
}

const COMPLEX_TOKEN = /(^|[^A-Za-z_])i([^A-Za-z_]|$)/i;
const DEFAULT_RESIDUAL_TOLERANCE = 1e-8;

function hasComplexToken(value: string): boolean {
  return COMPLEX_TOKEN.test(value);
}

function matchMathRegistry(
  question: string,
  equations: string[],
  targetVar?: string,
): MathRegistryEntry | null {
  const haystack = `${question}\n${equations.join("\n")}`;
  const normalizedTarget = targetVar?.toLowerCase();
  for (const entry of MATH_REGISTRY) {
    if (normalizedTarget && entry.targetVar.toLowerCase() !== normalizedTarget) {
      continue;
    }
    if (entry.matchers.some((matcher) => matcher.test(haystack))) {
      return entry;
    }
  }
  return null;
}

function evaluateExpression(expr: string, vars: Record<string, number | string>) {
  try {
    return nerdamer(expr, vars).evaluate();
  } catch {
    return null;
  }
}

function evaluateNumeric(expr: string, vars: Record<string, number | string>): number | null {
  const evaluated = evaluateExpression(expr, vars);
  if (!evaluated) return null;
  const value = (evaluated as { valueOf?: () => unknown }).valueOf?.();
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const text = evaluated.toString();
  if (!text) return null;
  if (hasComplexToken(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

type ParsedConstraint = {
  left: string;
  op: ">=" | "<=" | ">" | "<" | "==";
  right: string;
};

function parseConstraint(constraint: string): ParsedConstraint | null {
  const match = constraint.match(/(.+?)(>=|<=|==|>|<)(.+)/);
  if (!match) return null;
  return {
    left: match[1].trim(),
    op: match[2] as ParsedConstraint["op"],
    right: match[3].trim(),
  };
}

function checkConstraint(constraint: string, vars: Record<string, number | string>): boolean | null {
  const parsed = parseConstraint(constraint);
  if (!parsed) return null;
  const left = evaluateNumeric(parsed.left, vars);
  const right = evaluateNumeric(parsed.right, vars);
  if (left === null || right === null) return null;
  switch (parsed.op) {
    case ">=":
      return left >= right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    case "<":
      return left < right;
    case "==":
      return Math.abs(left - right) <= DEFAULT_RESIDUAL_TOLERANCE;
    default:
      return null;
  }
}

function computeResidual(
  equation: string,
  targetVar: string,
  solutionExpr: string,
  assignments: Record<string, number | string>,
): number | null {
  const splitIndex = equation.indexOf("=");
  if (splitIndex === -1) return null;
  const left = equation.slice(0, splitIndex).trim();
  const right = equation.slice(splitIndex + 1).trim();
  if (!left || !right) return null;
  const vars: Record<string, number | string> = { ...assignments, [targetVar]: solutionExpr };
  const residualExpr = `(${left})-(${right})`;
  const evaluated = evaluateExpression(residualExpr, vars);
  if (!evaluated) return null;
  const value = (evaluated as { valueOf?: () => unknown }).valueOf?.();
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.abs(value);
  }
  const text = evaluated.toString();
  if (!text) return null;
  if (text === "0") return 0;
  if (hasComplexToken(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? Math.abs(parsed) : null;
}

function applyMathTruthGates(question: string, result: HelixAskMathSolveResult): HelixAskMathSolveResult {
  if (!result.ok || result.kind !== "solve") {
    return { ...result, gatePass: result.ok };
  }
  const equations =
    result.equations && result.equations.length > 0
      ? result.equations
      : result.equation
        ? [result.equation]
        : extractEquationSystem(question);
  if (equations.length === 0) {
    return { ...result, gatePass: false, gateReason: "no_equations" };
  }
  const targetVar = result.variable ?? inferSolveVariable(question, equations) ?? "x";
  const registry = matchMathRegistry(question, equations, targetVar);
  const assignments: Record<string, number | string> = registry?.assignments ?? {};
  const domainConstraints = registry?.domainConstraints ?? [];
  const tolerance = registry?.tolerance ?? DEFAULT_RESIDUAL_TOLERANCE;
  const preferredSolutions = registry?.preferredSolutionExpr ? [registry.preferredSolutionExpr] : null;
  const candidateSolutions = preferredSolutions ?? result.solutions ?? [];
  const admissibleSolutions: string[] = [];
  const solutionScores: Array<{ solution: string; residual: number | null }> = [];
  let domainPass = false;

  for (const solution of candidateSolutions) {
    if (!solution) continue;
    if (hasComplexToken(solution)) continue;
    const numericValue =
      Object.keys(assignments).length > 0 ? evaluateNumeric(solution, assignments) : null;
    const varsForDomain: Record<string, number | string> = { ...assignments };
    const residualSolution = numericValue !== null ? String(numericValue) : solution;
    if (numericValue !== null) {
      varsForDomain[targetVar] = numericValue;
    } else {
      varsForDomain[targetVar] = solution;
    }
    const domainChecks =
      domainConstraints.length === 0
        ? true
        : domainConstraints.every((constraint) => checkConstraint(constraint, varsForDomain));
    if (!domainChecks) {
      continue;
    }
    domainPass = true;
    let maxResidual: number | null = null;
    if (Object.keys(assignments).length > 0) {
      const residualValues = equations
        .map((equation) => computeResidual(equation, targetVar, residualSolution, assignments))
        .filter((value): value is number => value !== null && Number.isFinite(value));
      if (residualValues.length === equations.length && residualValues.length > 0) {
        maxResidual = Math.max(...residualValues);
      }
    } else if (equations.every((equation) => /[0-9]/.test(equation))) {
      const residualValues = equations
        .map((equation) => computeResidual(equation, targetVar, residualSolution, {}))
        .filter((value): value is number => value !== null && Number.isFinite(value));
      if (residualValues.length === equations.length && residualValues.length > 0) {
        maxResidual = Math.max(...residualValues);
      }
    }
    admissibleSolutions.push(solution);
    solutionScores.push({ solution, residual: maxResidual });
  }

  if (!domainPass || admissibleSolutions.length === 0) {
    return {
      ...result,
      gatePass: false,
      gateReason: domainConstraints.length > 0 ? "domain_constraints_failed" : "no_real_root",
      domainPass: false,
      residualPass: false,
      registryId: registry?.id,
      admissibleSolutions: [],
    };
  }

  let selectedSolution = admissibleSolutions[0];
  let residualMax: number | undefined;
  const residualCandidates = solutionScores.filter(
    (entry): entry is { solution: string; residual: number } =>
      typeof entry.residual === "number" && Number.isFinite(entry.residual),
  );
  if (residualCandidates.length > 0) {
    residualCandidates.sort((a, b) => a.residual - b.residual);
    selectedSolution = residualCandidates[0].solution;
    residualMax = residualCandidates[0].residual;
  }

  const residualPass =
    residualMax === undefined ? true : residualMax <= Math.max(tolerance, DEFAULT_RESIDUAL_TOLERANCE);
  const gatePass = domainPass && residualPass;
  const gateReasonParts: string[] = [];
  if (registry?.id) gateReasonParts.push(`registry:${registry.id}`);
  if (registry?.preferredSolutionExpr) gateReasonParts.push("preferred_solution");
  if (residualMax !== undefined) {
    gateReasonParts.push(residualPass ? "residual_pass" : "residual_fail");
  }

  return {
    ...result,
    solutions: admissibleSolutions,
    final: selectedSolution,
    registryId: registry?.id,
    gatePass,
    gateReason: gateReasonParts.join("|") || undefined,
    domainPass: domainPass,
    residualPass,
    residualMax,
    selectedSolution,
    admissibleSolutions,
  };
}

function solveWithNerdamer(question: string): HelixAskMathSolveResult | null {
  const normalizedQuestion = normalizeExpression(question);
  if (!normalizedQuestion) return null;
  const lowered = normalizedQuestion.toLowerCase();
  try {
    if (lowered.includes("derivative") || lowered.includes("d/d")) {
      const derivativeTarget = extractDerivativeExpr(normalizedQuestion);
      if (!derivativeTarget) return { ok: false, reason: "js_missing_expression" };
      const displayExpr = prettyMath(stripLeadingNoise(normalizeExpression(derivativeTarget.expr)));
      if (!displayExpr) return { ok: false, reason: "js_missing_expression" };
      const expr = toExplicitMultiplication(displayExpr);
      const variable = derivativeTarget.variable || "x";
      const final = prettyMath(nerdamer.diff(expr, variable).toString());
      return { ok: true, kind: "derivative", expr: displayExpr, final, variable, reason: "js_solver" };
    }
    if (lowered.includes("solve") || normalizedQuestion.includes("=")) {
      const equations = extractEquationSystem(normalizedQuestion);
      if (!equations.length) return { ok: false, reason: "js_missing_equation" };
      const solveVar = inferSolveVariable(normalizedQuestion, equations);
      const explicitEquations = equations.map((eq) => toExplicitMultiplication(eq));
      const variables = collectVariables(explicitEquations.join(" "));
      const variableOrder = solveVar
        ? [solveVar, ...variables.filter((v) => v !== solveVar)]
        : variables;
      const solutionMap = new Map<string, string[]>();
      const pushSolution = (name: string, value: string) => {
        const current = solutionMap.get(name) ?? [];
        if (!current.includes(value)) {
          current.push(value);
        }
        solutionMap.set(name, current);
      };
      if (explicitEquations.length === 1 && (solveVar || variables.length > 0)) {
        const target = solveVar ?? variables[0];
        if (!target) return { ok: false, reason: "js_missing_variable" };
        const solved = nerdamer.solve(explicitEquations[0], target).toString();
        const cleaned = solved.replace(/^\[|\]$/g, "");
        const values = cleaned
          .split(/\s*,\s*/)
          .map((v: string) => prettyMath(v))
          .filter(Boolean);
        values.forEach((value: string) => pushSolution(target, value));
      } else {
        const rawSolutions =
          variableOrder.length > 0
            ? nerdamer.solveEquations(explicitEquations, variableOrder)
            : nerdamer.solveEquations(explicitEquations);
        for (const entry of rawSolutions as unknown[]) {
          if (Array.isArray(entry) && entry.length >= 2) {
            pushSolution(String(entry[0]), prettyMath(String(entry[1])));
            continue;
          }
          const text = String(entry);
          const eqMatch = text.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
          if (eqMatch) {
            pushSolution(eqMatch[1], prettyMath(eqMatch[2]));
          }
        }
      }
      const solutionObject = Object.fromEntries(solutionMap.entries());
      const targetVar =
        (solveVar && solutionMap.has(solveVar) && solveVar) ||
        (solutionMap.has("x") ? "x" : solutionMap.keys().next().value);
      const solutions = targetVar ? solutionMap.get(targetVar) ?? [] : [];
      if (!solutions.length && solutionMap.size === 0) {
        return { ok: false, reason: "js_no_solution" };
      }
      const final = solutions.length ? solutions.join(", ") : undefined;
      const rawResult: HelixAskMathSolveResult = {
        ok: true,
        kind: "solve",
        equation: equations[0],
        equations,
        solutions,
        final,
        solutionMap: solutionObject,
        variable: targetVar ?? solveVar,
        reason: "js_solver",
      };
      return applyMathTruthGates(question, rawResult);
    }
    const final = prettyMath(nerdamer(toExplicitMultiplication(normalizedQuestion)).evaluate().toString());
    return {
      ok: true,
      kind: "evaluate",
      expr: normalizedQuestion,
      final,
      reason: "js_solver",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `js_exception:${message}` };
  }
}

export async function solveHelixAskMathQuestion(
  question: string,
): Promise<HelixAskMathSolveResult | null> {
  if (!isHelixAskMathQuestion(question)) return null;
  const jsResult = solveWithNerdamer(question);
  if (jsResult?.ok) return jsResult;
  if (process.env.ENABLE_PY_CHECKERS !== "1") return null;
  const pythonBin = process.env.PYTHON_BIN || "python";
  const payload = JSON.stringify({ question });
  return new Promise((resolve) => {
    const child = spawn(pythonBin, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      resolve({ ok: false, reason: `spawn_error:${error.message}` });
    });
    child.on("close", () => {
      if (!stdout.trim()) {
        const suffix = stderr.trim() ? `:${stderr.trim().slice(0, 160)}` : "";
        resolve({ ok: false, reason: `python_exit_empty${suffix}` });
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as HelixAskMathSolveResult;
        resolve(parsed);
      } catch (error) {
        resolve({ ok: false, reason: `parse_error:${(error as Error).message}` });
      }
    });
    child.stdin.write(payload);
    child.stdin.end();
  });
}

export function buildHelixAskMathAnswer(result: HelixAskMathSolveResult): string {
  if (!result.ok || !result.kind) {
    return "I could not verify this math problem deterministically.";
  }
  if (result.kind === "solve" && result.gatePass === false) {
    if (!result.admissibleSolutions || result.admissibleSolutions.length === 0) {
      return "I could not find an admissible real solution under the current constraints. Please specify the allowed domain.";
    }
    return "I found candidate solutions, but they did not pass the verification gates. Please provide domain constraints or reference values.";
  }
  if (result.kind === "derivative" && result.final && result.expr) {
    const variable = result.variable ?? "x";
    if (variable === "x") {
      return `The derivative of f(x) = ${result.expr} is ${result.final}.`;
    }
    return `The derivative with respect to ${variable} of f(${variable}) = ${result.expr} is ${result.final}.`;
  }
  if (result.kind === "solve") {
    if (result.solutionMap && Object.keys(result.solutionMap).length > 1) {
      const pairs = Object.entries(result.solutionMap).map(([name, values]) => {
        const joined = values.join(", ");
        return `${name} = ${joined}`;
      });
      return `Solving the system yields ${pairs.join(" and ")}.`;
    }
    const solutions = result.solutions && result.solutions.length
      ? result.solutions
      : result.final
      ? [result.final]
      : [];
    if (!solutions.length) {
      return "I could not find a solution to the equation.";
    }
    const variable = result.variable ?? "x";
    const solutionText =
      solutions.length === 1
        ? `${variable} = ${solutions[0]}`
        : `${variable} = ${solutions.join(", ")}`;
    return `Solving the equation yields ${solutionText}.`;
  }
  if (result.kind === "evaluate" && result.final && result.expr) {
    return `The value of ${result.expr} is ${result.final}.`;
  }
  if (result.final) {
    return `Final answer: ${result.final}.`;
  }
  return "I could not verify this math problem deterministically.";
}
