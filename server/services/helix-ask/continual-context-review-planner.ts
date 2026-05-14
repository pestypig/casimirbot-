import type { HelixPatternCandidate } from "@shared/helix-pattern-candidate";

export type ContinualContextReviewPlan = {
  schema: "helix.continual_context_review_plan.v1";
  thread_id: string;
  decision: "silent_keep_categorizing" | "review_pattern_candidates" | "ask_user_to_promote_pattern";
  candidate_ids: string[];
  reason: string;
  raw_logs_included: false;
  assistant_answer: false;
};

export function planContinualContextReview(input: {
  threadId: string;
  candidates: HelixPatternCandidate[];
}): ContinualContextReviewPlan {
  const strongCandidates = input.candidates.filter((candidate: HelixPatternCandidate) =>
    candidate.confidence >= 0.76 && candidate.status === "candidate",
  );
  if (strongCandidates.length > 0) {
    return {
      schema: "helix.continual_context_review_plan.v1",
      thread_id: input.threadId,
      decision: "ask_user_to_promote_pattern",
      candidate_ids: strongCandidates.map((candidate: HelixPatternCandidate) => candidate.candidate_id),
      reason: "One or more repeated compact evidence patterns are strong enough for user review before promotion.",
      raw_logs_included: false,
      assistant_answer: false,
    };
  }
  return {
    schema: "helix.continual_context_review_plan.v1",
    thread_id: input.threadId,
    decision: "silent_keep_categorizing",
    candidate_ids: [],
    reason: "No pattern candidate crosses the review threshold.",
    raw_logs_included: false,
    assistant_answer: false,
  };
}
