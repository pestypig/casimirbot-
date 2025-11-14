import type { z } from "zod";
import { VerifierSpec, VerifierInput, CheckResult } from "@shared/agi-specialists";
import {
  EvolutionProblem,
  EvolutionTrace,
  type TProblem,
  type TState,
  type TRule,
  type TStep,
} from "@shared/evolution";

const EPS = 1e-6;

const nearly = (a: number, b: number, eps = EPS) => Math.abs(a - b) <= eps;

const degreeAsc = (coeffs: number[]): number => {
  for (let i = coeffs.length - 1; i >= 0; i -= 1) {
    if (Math.abs(coeffs[i]) > EPS) {
      return i;
    }
  }
  return 0;
};

const binom = (n: number, k: number): number => {
  if (k < 0 || k > n) {
    return 0;
  }
  let r = 1;
  for (let i = 1; i <= k; i += 1) {
    r = (r * (n - (k - i))) / i;
  }
  return r;
};

const polyAffineStepAsc = (
  coeffs: [number, ...number[]],
  shift: number,
  scale: number,
): [number, ...number[]] => {
  const maxDeg = degreeAsc(coeffs);
  const out = new Array(maxDeg + 1).fill(0);
  for (let k = 0; k <= maxDeg; k += 1) {
    const ak = coeffs[k] ?? 0;
    for (let j = 0; j <= k; j += 1) {
      out[j] += ak * binom(k, j) * Math.pow(shift, k - j);
    }
  }
  const scaled = out.map((c) => c * scale);
  return scaled as [number, ...number[]];
};

const vecRotate = ([x, y]: [number, number], deg: number): [number, number] => {
  const t = (deg * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [c * x - s * y, s * x + c * y];
};

const norm2 = ([x, y]: [number, number]) => Math.sqrt(x * x + y * y);

const fieldDiffuse = (
  grid: [[number, ...number[]], ...[number, ...number[]][]],
  beta: number,
  boundary: [[boolean, ...boolean[]], ...[boolean, ...boolean[]][]],
): [[number, ...number[]], ...[number, ...number[]][]] => {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const out = grid.map((row) => row.slice()) as typeof grid;
  for (let i = 0; i < h; i += 1) {
    for (let j = 0; j < w; j += 1) {
      if (boundary[i]?.[j]) {
        out[i][j] = grid[i][j];
        continue;
      }
      const up = i > 0 ? grid[i - 1][j] : grid[i][j];
      const dn = i + 1 < h ? grid[i + 1][j] : grid[i][j];
      const lf = j > 0 ? grid[i][j - 1] : grid[i][j];
      const rt = j + 1 < w ? grid[i][j + 1] : grid[i][j];
      out[i][j] = (1 - 4 * beta) * grid[i][j] + beta * (up + dn + lf + rt);
    }
  }
  return out;
};

const energy = (grid: number[][]): number => {
  let e = 0;
  for (const row of grid) {
    for (const value of row) {
      e += value * value;
    }
  }
  return e;
};

const sum = (values: number[]): number => values.reduce((acc, value) => acc + value, 0);

const compareState = (expected: TState, actual: TState): boolean => {
  if (expected.kind !== actual.kind) {
    return false;
  }
  switch (expected.kind) {
    case "poly": {
      if (actual.kind !== "poly") {
        return false;
      }
      const need = expected.coeffs;
      const have = actual.coeffs;
      const n = Math.max(need.length, have.length);
      for (let i = 0; i < n; i += 1) {
        const e = need[i] ?? 0;
        const a = have[i] ?? 0;
        if (!nearly(e, a)) {
          return false;
        }
      }
      return true;
    }
    case "vec2": {
      if (actual.kind !== "vec2") {
        return false;
      }
      return nearly(expected.v[0], actual.v[0]) && nearly(expected.v[1], actual.v[1]);
    }
    case "graph": {
      if (actual.kind !== "graph") {
        return false;
      }
      const eSum = sum(Object.values(expected.weights));
      const aSum = sum(Object.values(actual.weights));
      return nearly(eSum, aSum);
    }
    case "field2": {
      if (actual.kind !== "field2") {
        return false;
      }
      const eGrid = expected.grid;
      const aGrid = actual.grid;
      if (eGrid.length !== aGrid.length || eGrid[0]?.length !== aGrid[0]?.length) {
        return false;
      }
      for (let i = 0; i < eGrid.length; i += 1) {
        for (let j = 0; j < eGrid[0].length; j += 1) {
          if (!nearly(eGrid[i][j], aGrid[i][j])) {
            return false;
          }
        }
      }
      return true;
    }
    case "ledger": {
      if (actual.kind !== "ledger") {
        return false;
      }
      const expectedAccounts = expected.accounts;
      const actualAccounts = actual.accounts;
      if (expectedAccounts.length !== actualAccounts.length) {
        return false;
      }
      for (let i = 0; i < expectedAccounts.length; i += 1) {
        const e = expectedAccounts[i];
        const a = actualAccounts[i];
        if (e.id !== a.id || !nearly(e.bal, a.bal)) {
          return false;
        }
      }
      return true;
    }
    default:
      return false;
  }
};

const applyRule = (state: TState, rule: TRule): TState => {
  switch (state.kind) {
    case "poly": {
      if (rule.type !== "poly.affine") {
        throw new Error("rule_state_mismatch");
      }
      return { kind: "poly", coeffs: polyAffineStepAsc(state.coeffs, rule.shift, rule.scale) };
    }
    case "vec2": {
      if (rule.type !== "vector.rotate") {
        throw new Error("rule_state_mismatch");
      }
      return { kind: "vec2", v: vecRotate(state.v, rule.theta_deg) };
    }
    case "graph": {
      if (rule.type !== "graph.conserve") {
        throw new Error("rule_state_mismatch");
      }
      const nodes = state.nodes.slice() as typeof state.nodes;
      return { kind: "graph", nodes, weights: { ...state.weights } };
    }
    case "field2": {
      if (rule.type !== "field.diffuse") {
        throw new Error("rule_state_mismatch");
      }
      const nextGrid = fieldDiffuse(state.grid, rule.beta, state.boundary);
      return { kind: "field2", grid: nextGrid, boundary: state.boundary };
    }
    case "ledger": {
      if (rule.type !== "ledger.transfer") {
        throw new Error("rule_state_mismatch");
      }
      const accounts = state.accounts.map((acct) => ({ ...acct })) as typeof state.accounts;
      return { kind: "ledger", accounts };
    }
    default:
      throw new Error("unsupported_state");
  }
};

const aggregateScore = (stepPass: number, globalPass: number, faithful: number, complete: number): number =>
  0.4 * stepPass + 0.3 * globalPass + 0.2 * faithful + 0.1 * complete;

const extractProblem = (input: z.infer<typeof VerifierInput>): TProblem => {
  const context = (input.problem.context ?? {}) as Record<string, unknown>;
  const solverData = (input.solver_output.data ?? {}) as Record<string, unknown>;
  const source = solverData.problem ?? context.problem ?? context.evolution_problem;
  if (!source) {
    throw new Error("missing_problem_payload");
  }
  return EvolutionProblem.parse(source);
};

const extractTrace = (input: z.infer<typeof VerifierInput>): TStep[] => {
  const context = (input.problem.context ?? {}) as Record<string, unknown>;
  const solverData = (input.solver_output.data ?? {}) as Record<string, unknown>;
  const source = solverData.steps ?? solverData.trace ?? context.steps;
  if (!source) {
    throw new Error("missing_steps_payload");
  }
  return EvolutionTrace.parse(source);
};

export const evolutionVerifierSpec = {
  name: "evolution.verify",
  desc: "Verifier for evolution problems (pattern/invariant faithfulness).",
  inputSchema: VerifierInput,
  outputSchema: CheckResult,
} satisfies z.infer<typeof VerifierSpec>;

export const evolutionVerifierHandler = async (rawInput: unknown) => {
  const input = VerifierInput.parse(rawInput);

  let problem: TProblem;
  let steps: TStep[];
  try {
    problem = extractProblem(input);
    steps = extractTrace(input);
  } catch (err) {
    return CheckResult.parse({
      ok: false,
      reason: err instanceof Error ? err.message : "parse_error",
      metrics: {},
      citations: input.solver_output.essence_ids,
    });
  }

  const complete = steps.length === problem.steps_required ? 1 : 0;
  let stepPasses = 0;
  let faithfulPasses = 0;
  let prev: TState = problem.state0;

  for (const step of steps) {
    const base = step.input ?? prev;
    let expected: TState | null = null;
    try {
      expected = applyRule(base, problem.rule);
    } catch {
      expected = null;
    }
    if (expected && compareState(expected, step.output)) {
      faithfulPasses += 1;
    }
    switch (problem.family) {
      case "poly":
        if (step.input.kind === "poly" && step.output.kind === "poly") {
          const degIn = degreeAsc(step.input.coeffs);
          const degOut = degreeAsc(step.output.coeffs);
          const leadIn = step.input.coeffs[degIn] ?? 0;
          const leadOut = step.output.coeffs[degOut] ?? 0;
          const scale = problem.rule.type === "poly.affine" ? problem.rule.scale : 1;
          if (degIn === degOut && nearly(leadOut, leadIn * scale)) {
            stepPasses += 1;
          }
        }
        break;
      case "vector":
        if (step.input.kind === "vec2" && step.output.kind === "vec2") {
          if (nearly(norm2(step.input.v), norm2(step.output.v))) {
            stepPasses += 1;
          }
        }
        break;
      case "graph":
        if (step.input.kind === "graph" && step.output.kind === "graph") {
          const sumIn = sum(Object.values(step.input.weights));
          const sumOut = sum(Object.values(step.output.weights));
          if (nearly(sumIn, sumOut)) {
            stepPasses += 1;
          }
        }
        break;
      case "field":
        if (step.input.kind === "field2" && step.output.kind === "field2") {
          const boundary = problem.state0.kind === "field2" ? problem.state0.boundary : [];
          let boundaryOk = true;
          for (let i = 0; boundaryOk && i < boundary.length; i += 1) {
            for (let j = 0; j < (boundary[0]?.length ?? 0); j += 1) {
              if (boundary[i]?.[j] && !nearly(step.input.grid[i][j], step.output.grid[i][j])) {
                boundaryOk = false;
                break;
              }
            }
          }
          if (boundaryOk) {
            stepPasses += 1;
          }
        }
        break;
      case "ledger":
        if (step.input.kind === "ledger" && step.output.kind === "ledger") {
          const sumIn = sum(step.input.accounts.map((acct) => acct.bal));
          const sumOut = sum(step.output.accounts.map((acct) => acct.bal));
          const allowNeg = problem.rule.type === "ledger.transfer" ? problem.rule.allow_negative : false;
          const nonNegative = allowNeg || step.output.accounts.every((acct) => acct.bal >= -EPS);
          if (nearly(sumIn, sumOut) && nonNegative) {
            stepPasses += 1;
          }
        }
        break;
      default:
        break;
    }
    prev = step.output;
  }

  const stepRate = steps.length ? stepPasses / steps.length : 0;
  const faithfulRate = steps.length ? faithfulPasses / steps.length : 0;

  let globalPass = 0;
  switch (problem.family) {
    case "poly": {
      if (problem.state0.kind !== "poly") {
        break;
      }
      const deg0 = degreeAsc(problem.state0.coeffs);
      const lead0 = problem.state0.coeffs[deg0] ?? 0;
      const scale = problem.rule.type === "poly.affine" ? problem.rule.scale : 1;
      const finalState = steps.length ? steps[steps.length - 1].output : problem.state0;
      if (finalState.kind !== "poly") {
        break;
      }
      const degF = degreeAsc(finalState.coeffs);
      const leadF = finalState.coeffs[degF] ?? 0;
      const want = lead0 * Math.pow(scale, problem.steps_required);
      globalPass = nearly(leadF, want) ? 1 : 0;
      break;
    }
    case "vector": {
      if (problem.state0.kind !== "vec2") {
        break;
      }
      const n0 = norm2(problem.state0.v);
      const finalState = steps.length ? steps[steps.length - 1].output : problem.state0;
      if (finalState.kind !== "vec2") {
        break;
      }
      const nF = norm2(finalState.v);
      globalPass = nearly(n0, nF) ? 1 : 0;
      break;
    }
    case "graph": {
      if (problem.state0.kind !== "graph") {
        break;
      }
      const sum0 = sum(Object.values(problem.state0.weights));
      const finalState = steps.length ? steps[steps.length - 1].output : problem.state0;
      if (finalState.kind !== "graph") {
        break;
      }
      const sumF = sum(Object.values(finalState.weights));
      globalPass = nearly(sum0, sumF) ? 1 : 0;
      break;
    }
    case "field": {
      if (problem.state0.kind !== "field2") {
        break;
      }
      const e0 = energy(problem.state0.grid);
      const finalState = steps.length ? steps[steps.length - 1].output : problem.state0;
      if (finalState.kind !== "field2") {
        break;
      }
      const eF = energy(finalState.grid);
      globalPass = eF <= e0 + 1e-9 ? 1 : 0;
      break;
    }
    case "ledger": {
      if (problem.state0.kind !== "ledger") {
        break;
      }
      const sum0 = sum(problem.state0.accounts.map((acct) => acct.bal));
      const finalState = steps.length ? steps[steps.length - 1].output : problem.state0;
      if (finalState.kind !== "ledger") {
        break;
      }
      const sumF = sum(finalState.accounts.map((acct) => acct.bal));
      globalPass = nearly(sum0, sumF) ? 1 : 0;
      break;
    }
    default:
      break;
  }

  const score = aggregateScore(stepRate, globalPass, faithfulRate, complete);
  const ok = score >= 0.75;

  return CheckResult.parse({
    ok,
    reason: ok ? "evolution_pass" : "evolution_fail",
    metrics: {
      score,
      step_rate: stepRate,
      global: globalPass,
      faithful: faithfulRate,
      complete,
    },
    citations: input.solver_output.essence_ids,
  });
};
