import type {
  HelixAskAnswerPlanFamily,
  HelixAskTurnContractGroundingMode,
} from "./turn-contract-normalizers";

export type HelixAskAnswerPlanSpecificity = "broad" | "mid" | "specific";

export type HelixAskTurnContractConstraints = {
  requires_repo_evidence: boolean;
  requires_citations: boolean;
  allow_open_world_bypass: boolean;
  clarify_allowed: boolean;
  tone_policy: "optimistic-but-honest";
};

export const buildHelixAskTurnContractConstraints = (args: {
  requiresRepoEvidence: boolean;
  groundingMode: HelixAskTurnContractGroundingMode;
  family: HelixAskAnswerPlanFamily;
  specificity: HelixAskAnswerPlanSpecificity;
}): HelixAskTurnContractConstraints => ({
  requires_repo_evidence: args.requiresRepoEvidence,
  requires_citations: args.requiresRepoEvidence || args.groundingMode !== "open",
  allow_open_world_bypass: !args.requiresRepoEvidence && args.groundingMode !== "repo",
  clarify_allowed: args.family !== "equation_formalism" || args.specificity !== "specific",
  tone_policy: "optimistic-but-honest",
});
