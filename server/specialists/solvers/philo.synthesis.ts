import type { z } from "zod";
import { SolverSpec, SolverInput, SolverOutput } from "@shared/agi-specialists";

export type PhiloTask = { task_id?: string; prompt: string; axes?: string[] };
export type PhiloAnswer = {
  thesis: string;
  antithesis: string;
  synthesis: string;
  premises: string[];
  cites?: string[];
};

export const philoSynthesisSpec = {
  name: "philo.synthesis",
  desc: "Outputs a thesis/antithesis/synthesis trio with traceable premises for ethical tradeoffs.",
  inputSchema: SolverInput,
  outputSchema: SolverOutput,
} satisfies z.infer<typeof SolverSpec>;

export const philoSynthesisHandler = async (rawInput: unknown) => {
  const input = SolverInput.parse(rawInput);
  const params = (input.params ?? {}) as Partial<PhiloTask>;
  const topic = typeof params.prompt === "string" && params.prompt.trim().length > 0 ? params.prompt.trim() : input.problem.goal.trim();
  if (!topic) {
    throw new Error("philo.synthesis: prompt_required");
  }
  const premises = [
    "P1: Short-term welfare requires minimizing acute, local harms.",
    "P2: Long-term flourishing requires compounding knowledge and infrastructure.",
    "P3: Risk should be bounded by reversible trials and verifiable criteria.",
  ];
  const thesis = `Thesis: Prioritize near-term welfare to avoid irreversible harms while capability is immature. [P1]`;
  const antithesis = `Antithesis: Invest in star-scale engineering to unlock compounding gains for many generations. [P2]`;
  const synthesis =
    "Synthesis: Stage capability growth via reversible, auditable milestones that maximize present welfare and open optionality for far futures. Use bounded trials, verifiers, and public ledgers to keep risk legible. [P1][P2][P3]";
  const answer: PhiloAnswer = { thesis, antithesis, synthesis, premises, cites: [] };
  return SolverOutput.parse({
    summary: `Captured dialectic synthesis for topic: ${topic}`,
    data: { answer, topic, axes: params.axes ?? [] },
    artifacts: [],
    essence_ids: [],
  });
};
