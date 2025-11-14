import type { z } from "zod";
import { SolverSpec, SolverInput, SolverOutput } from "@shared/agi-specialists";

export const mathExprSpec = {
  name: "math.expr",
  desc: "Echoes a deterministic arithmetic expression as FINAL ANSWER for downstream verification.",
  inputSchema: SolverInput,
  outputSchema: SolverOutput,
} satisfies z.infer<typeof SolverSpec>;

export const mathExprHandler = async (rawInput: unknown, _ctx: Record<string, unknown>) => {
  const input = SolverInput.parse(rawInput);
  const params = (input.params ?? {}) as Record<string, unknown>;
  const exprValue = typeof params.expr === "string" ? params.expr : input.problem.context?.expr;
  const expr = typeof exprValue === "string" ? exprValue.trim() : "";
  if (!expr) {
    throw new Error("expr_required");
  }
  return SolverOutput.parse({
    summary: `FINAL ANSWER: ${expr}`,
    data: { final: expr },
    artifacts: [],
    essence_ids: [],
  });
};
