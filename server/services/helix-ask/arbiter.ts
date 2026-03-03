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
  budgetLevel?: "OK" | "WARNING" | "OVER";
  budgetRecommend?: "none" | "reduce_tool_calls" | "force_clarify" | "queue_deep_work";
  strictCertainty?: boolean;
  certaintyEvidenceOk?: boolean;
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
  provenance_class: "measured" | "proxy" | "inferred";
  claim_tier: "diagnostic" | "reduced-order" | "certified";
  certifying: boolean;
  fail_reason?: string;
};

const CERTAINTY_FAIL_REASON = "CERTAINTY_EVIDENCE_MISSING" as const;

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
  } else if (input.budgetLevel === "OVER" && input.budgetRecommend === "force_clarify") {
    mode = "clarify";
    reason = "budget_force_clarify";
  } else if (input.budgetLevel === "OVER" && input.budgetRecommend === "queue_deep_work") {
    mode = "hybrid";
    reason = "budget_queue_deep_work";
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

  const strictFailReason =
    input.strictCertainty === true && input.certaintyEvidenceOk !== true
      ? CERTAINTY_FAIL_REASON
      : undefined;
  const strictMode = input.strictCertainty === true;
  if (strictMode && strictFailReason && mode !== "clarify") {
    mode = "clarify";
    reason = "strict_ready_contract_missing";
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
    provenance_class: "inferred",
    claim_tier: "diagnostic",
    certifying: false,
    fail_reason: strictFailReason,
  };
}
