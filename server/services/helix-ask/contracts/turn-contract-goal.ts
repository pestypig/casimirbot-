import { normalizeHelixAskTurnContractText } from "./turn-contract-text";

export const buildHelixAskTurnContractGoal = (args: {
  researchPurpose?: string | null;
  plannerGoal?: string | null;
  question: string;
}): string =>
  normalizeHelixAskTurnContractText(args.researchPurpose ?? "", 180) ||
  normalizeHelixAskTurnContractText(args.plannerGoal ?? "", 180) ||
  normalizeHelixAskTurnContractText(args.question, 180) ||
  "Answer the current ask.";
