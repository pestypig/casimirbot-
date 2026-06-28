import { normalizeHelixAskTurnContractText } from "./turn-contract-text";

export const buildHelixAskTurnContractClarifyQuestion = (args: {
  plannerClarifyQuestion?: string | null;
  requiresRepoEvidence: boolean;
  objectiveCount: number;
  explicitAnchorPathCount: number;
}): string => {
  const plannerClarifyQuestion = normalizeHelixAskTurnContractText(
    args.plannerClarifyQuestion ?? "",
    180,
  );
  if (plannerClarifyQuestion) return plannerClarifyQuestion;
  if (
    args.requiresRepoEvidence &&
    args.objectiveCount > 2 &&
    args.explicitAnchorPathCount === 0
  ) {
    return "Which objective should be pinned to explicit repo anchors first?";
  }
  return "";
};
