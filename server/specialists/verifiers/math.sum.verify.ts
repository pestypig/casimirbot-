import type { z } from "zod";
import { VerifierSpec, VerifierInput, CheckResult } from "@shared/agi-specialists";

export const mathSumVerifierSpec = {
  name: "math.sum.verify",
  desc: "Checks whether a math.sum output matches the provided inputs.",
  inputSchema: VerifierInput,
  outputSchema: CheckResult,
} satisfies z.infer<typeof VerifierSpec>;

export const mathSumVerifierHandler = async (rawInput: unknown) => {
  const input = VerifierInput.parse(rawInput);
  const numbers: number[] = Array.isArray(input.problem.context?.numbers) ? input.problem.context?.numbers : [];
  const expected = numbers.reduce((sum, value) => sum + (Number.isFinite(value) ? Number(value) : 0), 0);
  const reported = Number((input.solver_output.data as any)?.total ?? NaN);
  const diff = Math.abs((Number.isFinite(reported) ? reported : 0) - expected);
  const ok = Number.isFinite(reported) && diff < 1e-9;
  return CheckResult.parse({
    ok,
    reason: ok ? "sum verified" : `mismatch expected=${expected} got=${reported}`,
    metrics: { abs_err: diff },
    citations: input.solver_output.essence_ids,
  });
};
