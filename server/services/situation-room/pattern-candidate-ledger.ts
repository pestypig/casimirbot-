import crypto from "node:crypto";
import {
  HELIX_PATTERN_CANDIDATE_SCHEMA,
  type HelixPatternCandidate,
  type HelixPatternCandidateStatus,
} from "@shared/helix-pattern-candidate";
import type { GameUtilityHypothesis } from "@shared/helix-game-utility-hypothesis";

const candidatesByThread = new Map<string, HelixPatternCandidate[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function recordPatternCandidateFromUtilityHypothesis(input: {
  hypothesis: GameUtilityHypothesis;
  status?: HelixPatternCandidateStatus;
}): HelixPatternCandidate {
  const now = input.hypothesis.ts;
  const candidate: HelixPatternCandidate = {
    schema: HELIX_PATTERN_CANDIDATE_SCHEMA,
    candidate_id: `pattern_candidate:${hashShort([
      input.hypothesis.thread_id,
      input.hypothesis.room_id,
      input.hypothesis.subject_ref,
      input.hypothesis.utility_label,
    ])}`,
    thread_id: input.hypothesis.thread_id,
    room_id: input.hypothesis.room_id,
    source_family: input.hypothesis.game_id,
    pattern_label: input.hypothesis.utility_label,
    subject_ref: input.hypothesis.subject_ref,
    status: input.status ?? "candidate",
    confidence: input.hypothesis.confidence,
    support_summary: `${input.hypothesis.utility_label} is ${input.hypothesis.status} from ${input.hypothesis.supporting_evidence_refs.length} evidence refs.`,
    supporting_evidence_refs: input.hypothesis.supporting_evidence_refs,
    missing_evidence: input.hypothesis.missing_evidence,
    promoted_dictionary_entry_id: null,
    raw_logs_included: false,
    assistant_answer: false,
    deterministic: input.hypothesis.deterministic,
    model_invoked: input.hypothesis.model_invoked,
    created_at: now,
    updated_at: now,
  };
  const existing = candidatesByThread.get(candidate.thread_id) ?? [];
  const filtered = existing.filter((entry: HelixPatternCandidate) => entry.candidate_id !== candidate.candidate_id);
  candidatesByThread.set(candidate.thread_id, [...filtered, candidate].slice(-200));
  return candidate;
}

export function listPatternCandidates(threadId: string): HelixPatternCandidate[] {
  return [...(candidatesByThread.get(threadId) ?? [])];
}

export function clearPatternCandidatesForTest(): void {
  candidatesByThread.clear();
}
