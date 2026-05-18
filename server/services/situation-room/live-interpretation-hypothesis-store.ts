import type { HelixLiveInterpretationHypothesis } from "@shared/helix-live-interpretation-hypothesis";

const hypothesesByRun = new Map<string, HelixLiveInterpretationHypothesis[]>();

export function recordLiveInterpretationHypothesis(hypothesis: HelixLiveInterpretationHypothesis): HelixLiveInterpretationHypothesis {
  hypothesesByRun.set(hypothesis.interpretation_run_id, [
    ...(hypothesesByRun.get(hypothesis.interpretation_run_id) ?? [])
      .filter((entry) => entry.hypothesis_id !== hypothesis.hypothesis_id),
    hypothesis,
  ].slice(-1200));
  return hypothesis;
}

export function listLiveInterpretationHypotheses(input: {
  interpretationRunId?: string | null;
  situationRunId?: string | null;
  lens?: string | null;
  limit?: number;
} = {}): HelixLiveInterpretationHypothesis[] {
  const limit = Math.max(0, Math.min(1200, Math.trunc(input.limit ?? 300)));
  return Array.from(hypothesesByRun.values()).flat()
    .filter((entry) => !input.interpretationRunId || entry.interpretation_run_id === input.interpretationRunId)
    .filter((entry) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .filter((entry) => !input.lens || entry.lens === input.lens)
    .slice(-limit);
}

export function resetLiveInterpretationHypothesesForTest(): void {
  hypothesesByRun.clear();
}
