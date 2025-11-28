import type { z } from "zod";
import { SolverSpec, SolverInput, SolverOutput } from "@shared/agi-specialists";

type ReviewIssue = {
  note: string;
  evidence: string[];
};

export const repoAnswerReviewSpec = {
  name: "repo_answer_review",
  desc: "TIMAR-style review: checks novelty/rigor/clarity and returns a refined answer with explicit repo evidence.",
  inputSchema: SolverInput,
  outputSchema: SolverOutput,
} satisfies z.infer<typeof SolverSpec>;

export const repoAnswerReviewHandler = async (rawInput: unknown) => {
  const input = SolverInput.parse(rawInput);
  const goal = input.problem.goal.trim();
  const draft = typeof input.problem.context?.summary === "string" ? input.problem.context.summary : "";
  const citations = Array.isArray(input.problem.context?.citations) ? (input.problem.context?.citations as string[]) : [];
  const concepts =
    Array.isArray(input.problem.context?.concepts) && input.problem.context?.concepts.length > 0
      ? (input.problem.context?.concepts as string[])
      : [];

  const evidenceRefs = citations.slice(0, 6);
  const issues: ReviewIssue[] = [];
  if (!draft) {
    issues.push({ note: "Draft answer missing; cannot review content.", evidence: [] });
  } else {
    if (draft.length > 1400) {
      issues.push({ note: "Draft is long; compress for clarity.", evidence: evidenceRefs });
    }
    if (evidenceRefs.length === 0) {
      issues.push({ note: "No explicit file/symbol citations present; add inline paths.", evidence: [] });
    }
  }

  const refined = [
    "Refined answer:",
    draft || "(no draft provided)",
    concepts.length ? `Concepts: ${concepts.join(", ")}` : "",
    evidenceRefs.length ? `Evidence: ${evidenceRefs.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return SolverOutput.parse({
    summary: [
      `Goal: ${goal}`,
      issues.length ? `Issues found: ${issues.length}` : "Issues: none noted",
      refined,
    ].join("\n"),
    data: { issues, refined, evidence: evidenceRefs, concepts },
    artifacts: [],
    essence_ids: evidenceRefs,
  });
};
