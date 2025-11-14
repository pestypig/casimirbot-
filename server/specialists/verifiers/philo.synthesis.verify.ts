import type { z } from "zod";
import { VerifierSpec, VerifierInput, CheckResult } from "@shared/agi-specialists";
import type { PhiloAnswer } from "../solvers/philo.synthesis";

const PREMISE_TAGS = ["P1", "P2", "P3"];

function hasTag(text: string, tag: string) {
  return new RegExp(`\\[${tag}\\]`).test(text);
}

function coverageScore(answer: PhiloAnswer) {
  const combined = `${answer.thesis}${answer.antithesis}${answer.synthesis}`;
  const required = ["Thesis:", "Antithesis:", "Synthesis:"];
  return required.every((token) => combined.includes(token)) ? 1 : 0;
}

function nonContradictionScore(answer: PhiloAnswer) {
  const neg = /\b(never|not|cannot|must\s+not)\b/i;
  const bothNeg = neg.test(answer.thesis) && neg.test(answer.synthesis);
  return bothNeg ? 0 : 1;
}

function traceabilityScore(answer: PhiloAnswer) {
  const sections = [answer.thesis, answer.antithesis, answer.synthesis];
  const cited = sections.filter((section) => PREMISE_TAGS.some((tag) => hasTag(section, tag))).length;
  return cited / sections.length;
}

function steelmanScore(answer: PhiloAnswer) {
  return /\b(best|strongest|steelman|valid|credible)\b/i.test(answer.antithesis) ? 1 : 0.6;
}

export const philoSynthesisVerifierSpec = {
  name: "philo.synthesis.verify",
  desc: "Scores thesis/antithesis/synthesis answers with a lightweight rubric.",
  inputSchema: VerifierInput,
  outputSchema: CheckResult,
} satisfies z.infer<typeof VerifierSpec>;

export const philoSynthesisVerifierHandler = async (rawInput: unknown) => {
  const input = VerifierInput.parse(rawInput);
  const payload = input.solver_output.data as { answer?: PhiloAnswer };
  const answer = payload?.answer ?? (input.solver_output.data as PhiloAnswer);
  if (!answer) {
    return CheckResult.parse({
      ok: false,
      reason: "no answer provided",
      metrics: {},
      citations: [],
    });
  }
  const scores = {
    coverage: coverageScore(answer),
    non_contradiction: nonContradictionScore(answer),
    traceability: traceabilityScore(answer),
    steelman: steelmanScore(answer),
  };
  const composite = 0.3 * scores.coverage + 0.3 * scores.non_contradiction + 0.25 * scores.traceability + 0.15 * scores.steelman;
  const ok = composite >= 0.75;
  return CheckResult.parse({
    ok,
    reason: ok ? "meets rubric" : "below rubric threshold",
    metrics: { ...scores, composite },
    citations: [],
  });
};
