import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const ChecklistScoreInput = z.object({
  checklist: z.record(z.any()),
  claims: z.array(z.record(z.any())).optional(),
  evidence: z.array(z.record(z.any())).optional(),
  verifierResults: z.array(z.record(z.any())).optional(),
});

const ChecklistScoreOutput = z.object({
  score: z.object({
    coverage: z.number().min(0).max(1),
    falsifiers_tested: z.number().int().nonnegative(),
    open_conflicts: z.number().int().nonnegative(),
  }),
  advice: z.array(z.string()),
});

export const debateChecklistScoreSpec: ToolSpecShape = {
  name: "checklist.method.score",
  desc: "Score debate progress against the falsifiability checklist.",
  inputSchema: ChecklistScoreInput,
  outputSchema: ChecklistScoreOutput,
  deterministic: true,
  rateLimit: { rpm: 20 },
  safety: { risks: [] },
};

export const debateChecklistScoreHandler: ToolHandler = async (rawInput) => {
  const input = ChecklistScoreInput.parse(rawInput ?? {});
  const claims = input.claims?.length ?? 0;
  const evidence = input.evidence?.length ?? 0;
  const verifierResults = input.verifierResults?.length ?? 0;
  const coverage = Math.min(1, (claims + evidence) / Math.max(4, claims + evidence + 1));
  const falsifiers = Math.min(10, verifierResults);
  const openConflicts = Math.max(0, (input.checklist as any)?.conflicts?.length ?? 0);
  const advice: string[] = [];
  if (coverage < 0.5) advice.push("Add citations to at least one prediction.");
  if (falsifiers < 2) advice.push("Run a falsifier experiment to probe the leading hypothesis.");
  if (openConflicts > 0) advice.push("Resolve conflicts before accepting proponent claims.");
  return {
    score: {
      coverage: Number(coverage.toFixed(2)),
      falsifiers_tested: falsifiers,
      open_conflicts: openConflicts,
    },
    advice,
  };
};

// Debate-prefixed alias for convenience.
export const debateChecklistScoreAliasSpec: ToolSpecShape = {
  ...debateChecklistScoreSpec,
  name: "debate.checklist.score",
};

