export type HelixAskArbiterInput = {
  retrievalConfidence: number;
  repoThreshold: number;
  hybridThreshold: number;
  mustIncludeOk: boolean;
  viabilityMustIncludeOk: boolean;
  topicMustIncludeOk?: boolean;
  conceptMatch: boolean;
  hasRepoHints: boolean;
  topicTags: string[];
  verificationAnchorRequired: boolean;
  verificationAnchorOk: boolean;
  userExpectsRepo: boolean;
  hasHighStakesConstraints: boolean;
  explicitRepoExpectation?: boolean;
  intentDomain?: "general" | "repo" | "hybrid" | "falsifiable";
};

export type HelixAskArbiterResult = {
  mode: "repo_grounded" | "hybrid" | "general" | "clarify";
  reason: string;
  strictness: "low" | "med" | "high";
  repoOk: boolean;
  hybridOk: boolean;
  ratio: number;
  topicOk: boolean;
  conceptMatch: boolean;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function resolveHelixAskArbiter(input: HelixAskArbiterInput): HelixAskArbiterResult {
  const ratio = clampNumber(input.retrievalConfidence, 0, 1);
  const repoThreshold = clampNumber(Math.max(input.repoThreshold, input.hybridThreshold), 0, 1);
  const hybridThreshold = clampNumber(Math.min(input.repoThreshold, input.hybridThreshold), 0, 1);
  const topicOk =
    typeof input.topicMustIncludeOk === "boolean" ? input.topicMustIncludeOk : input.mustIncludeOk;
  const repoOk = ratio >= repoThreshold && input.mustIncludeOk && input.viabilityMustIncludeOk;
  const hybridOk =
    ratio >= hybridThreshold &&
    (input.conceptMatch || input.hasRepoHints || input.topicTags.length > 0) &&
    (!input.verificationAnchorRequired || input.verificationAnchorOk);
  const strictness = input.hasHighStakesConstraints
    ? "high"
    : input.explicitRepoExpectation
      ? "high"
      : input.intentDomain === "general"
        ? "low"
        : "med";
  let mode: HelixAskArbiterResult["mode"] = "general";
  let reason = "no_repo_expectation";
  if (input.hasHighStakesConstraints) {
    mode = "repo_grounded";
    reason = "high_stakes";
  } else if (repoOk) {
    mode = "repo_grounded";
    reason = "repo_ratio";
  } else if (hybridOk) {
    mode = "hybrid";
    reason = "hybrid_ratio";
  } else if (input.userExpectsRepo) {
    mode = "clarify";
    reason = "expect_repo_weak_evidence";
  } else {
    mode = "general";
    reason = "no_repo_expectation";
  }

  return {
    mode,
    reason,
    strictness,
    repoOk,
    hybridOk,
    ratio,
    topicOk,
    conceptMatch: input.conceptMatch,
  };
}
