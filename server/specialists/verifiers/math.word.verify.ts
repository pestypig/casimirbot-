import type { z } from "zod";
import { VerifierSpec, VerifierInput, CheckResult } from "@shared/agi-specialists";
import type { MathWordAnswer } from "../solvers/math.word";

const TANK_REGEX =
  /fills at\s+(\d+(?:\.\d+)?)\s*L\/min\s+for\s+(\d+(?:\.\d+)?)\s*min.*?drains\s+(\d+(?:\.\d+)?)\s*L.*?start\s*=\s*(\d+(?:\.\d+)?)\s*L/i;

function recompute(text: string) {
  const match = TANK_REGEX.exec(text);
  if (!match) return null;
  const rate = Number(match[1]);
  const minutes = Number(match[2]);
  const drain = Number(match[3]);
  const start = Number(match[4]);
  return start + rate * minutes - drain;
}

function extractProblemText(input: z.infer<typeof VerifierInput>): string {
  const ctxText = typeof input.problem.context?.text === "string" ? input.problem.context.text.trim() : "";
  const solverData = input.solver_output.data as Record<string, unknown>;
  const solverText = typeof solverData?.problemText === "string" ? solverData.problemText.trim() : "";
  return ctxText || solverText || input.problem.goal.trim();
}

export const mathWordVerifierSpec = {
  name: "math.word.verify",
  desc: "Recomputes the deterministic tank pattern and checks numeric/unit agreement.",
  inputSchema: VerifierInput,
  outputSchema: CheckResult,
} satisfies z.infer<typeof VerifierSpec>;

export const mathWordVerifierHandler = async (rawInput: unknown) => {
  const input = VerifierInput.parse(rawInput);
  const text = extractProblemText(input);
  const expected = text ? recompute(text) : null;
  if (expected == null) {
    return CheckResult.parse({
      ok: false,
      reason: "pattern not recognized",
      metrics: { eq_ok: 0, units_ok: 0 },
      citations: [],
    });
  }
  const data = (input.solver_output.data ?? {}) as { answer?: MathWordAnswer };
  const answer = data.answer;
  const reported = typeof answer?.value === "number" ? answer.value : Number.NaN;
  const unitsOk = (answer?.unit ?? "L") === "L" ? 1 : 0;
  const eqOk = Number.isFinite(reported) && Math.abs(reported - expected) < 1e-6 ? 1 : 0;
  const ok = eqOk === 1 && unitsOk === 1;
  return CheckResult.parse({
    ok,
    reason: ok ? "verified" : `expected ${expected} L`,
    metrics: { eq_ok: eqOk, units_ok: unitsOk },
    citations: input.solver_output.essence_ids,
  });
};
