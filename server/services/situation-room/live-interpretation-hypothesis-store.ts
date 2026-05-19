import type { HelixLiveInterpretationHypothesis } from "@shared/helix-live-interpretation-hypothesis";

const hypothesesByRun = new Map<string, HelixLiveInterpretationHypothesis[]>();

export function recordLiveInterpretationHypothesis(hypothesis: HelixLiveInterpretationHypothesis): HelixLiveInterpretationHypothesis {
  hypothesesByRun.set(hypothesis.interpretation_run_id, [
    ...(hypothesesByRun.get(hypothesis.interpretation_run_id) ?? [])
      .filter((entry: HelixLiveInterpretationHypothesis) => entry.hypothesis_id !== hypothesis.hypothesis_id),
    hypothesis,
  ].slice(-1200));
  return hypothesis;
}

export function updateLiveInterpretationHypothesis(
  hypothesis: HelixLiveInterpretationHypothesis,
): HelixLiveInterpretationHypothesis {
  return recordLiveInterpretationHypothesis(hypothesis);
}

export function listLiveInterpretationHypotheses(input: {
  interpretationRunId?: string | null;
  situationRunId?: string | null;
  lens?: string | null;
  limit?: number;
} = {}): HelixLiveInterpretationHypothesis[] {
  const limit = Math.max(0, Math.min(1200, Math.trunc(input.limit ?? 300)));
  return (Array.from(hypothesesByRun.values()).flat() as HelixLiveInterpretationHypothesis[])
    .filter((entry: HelixLiveInterpretationHypothesis) => !input.interpretationRunId || entry.interpretation_run_id === input.interpretationRunId)
    .filter((entry: HelixLiveInterpretationHypothesis) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .filter((entry: HelixLiveInterpretationHypothesis) => !input.lens || entry.lens === input.lens)
    .slice(-limit);
}

export function listActiveLiveInterpretationHypotheses(input: {
  interpretationRunId?: string | null;
  situationRunId?: string | null;
  lens?: string | null;
  limit?: number;
} = {}): HelixLiveInterpretationHypothesis[] {
  return listLiveInterpretationHypotheses(input)
    .filter((entry: HelixLiveInterpretationHypothesis) => !["contradicted", "superseded", "expired", "rejected", "stale"].includes(entry.status));
}

export function resetLiveInterpretationHypothesesForTest(): void {
  hypothesesByRun.clear();
}
