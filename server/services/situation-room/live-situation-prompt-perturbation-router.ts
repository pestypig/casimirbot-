import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";
import { ensureLiveSituationRunForEnvironment } from "./live-situation-run-store";
import { registerFieldWorkersForSituationRun } from "./live-field-worker-registry";

export function perturbLiveSituationRunFromPrompt(input: {
  environment: LiveAnswerEnvironment;
  pipelineId?: string | null;
  now?: string;
}) {
  const run = ensureLiveSituationRunForEnvironment({
    environment: input.environment,
    pipelineId: input.pipelineId ?? null,
    now: input.now,
  });
  const workers = registerFieldWorkersForSituationRun({
    run,
    environment: input.environment,
  });
  return {
    run,
    workers,
    assistant_answer: false as const,
    raw_content_included: false as const,
  };
}
