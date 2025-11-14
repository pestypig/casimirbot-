import vm from "node:vm";
import type { z } from "zod";
import { VerifierSpec, VerifierInput, CheckResult } from "@shared/agi-specialists";
import type { CodeAnswer } from "../solvers/code.isBalanced";

const HIDDEN_TESTS = [
  `isBalanced("") === true`,
  `isBalanced("([{}])[]") === true`,
  `isBalanced("([{}]])") === false`,
  `isBalanced("([]{}") === false`,
];

function transpileTsToJs(tsSrc: string): string {
  return tsSrc.replace(/export\s+/g, "");
}

function runInSandbox(jsSrc: string, tests: string[]) {
  const sandbox: Record<string, unknown> = {
    console: { log: () => {} },
    result: undefined,
  };
  const context = vm.createContext(sandbox, { name: "code.isBalanced.verify" });
  const implScript = new vm.Script(jsSrc, { filename: "isBalanced.impl.js" });
  implScript.runInContext(context, { timeout: 100 });
  if (typeof (sandbox as any).isBalanced !== "function") {
    throw new Error("isBalanced not defined");
  }
  let pass = 0;
  for (const test of tests) {
    const testScript = new vm.Script(`result = (${test});`, { filename: "isBalanced.test.js" });
    testScript.runInContext(context, { timeout: 100 });
    if ((sandbox as any).result === true) {
      pass += 1;
    }
  }
  return { total: tests.length, pass };
}

export const codeIsBalancedVerifierSpec = {
  name: "code.isBalanced.verify",
  desc: "Executes the submitted implementation in a vm sandbox with public + hidden tests.",
  inputSchema: VerifierInput,
  outputSchema: CheckResult,
} satisfies z.infer<typeof VerifierSpec>;

export const codeIsBalancedVerifierHandler = async (rawInput: unknown) => {
  const input = VerifierInput.parse(rawInput);
  try {
    const data = (input.solver_output.data ?? {}) as { answer?: CodeAnswer };
    const answer = data.answer;
    if (!answer?.source) {
      return CheckResult.parse({
        ok: false,
        reason: "no source provided",
        metrics: { build_ok: 0 },
        citations: [],
      });
    }
    const jsSource = transpileTsToJs(answer.source);
    const publicTests = Array.isArray(answer.tests) ? answer.tests.filter((t): t is string => typeof t === "string") : [];
    const tests = [...publicTests, ...HIDDEN_TESTS];
    const { total, pass } = runInSandbox(jsSource, tests);
    const ok = pass === total;
    return CheckResult.parse({
      ok,
      reason: ok ? "all tests pass" : "some tests failed",
      metrics: {
        build_ok: 1,
        tests_total: total,
        tests_passed: pass,
      },
      citations: [],
    });
  } catch (error) {
    return CheckResult.parse({
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
      metrics: { build_ok: 0, tests_total: 0, tests_passed: 0 },
      citations: [],
    });
  }
};
