import type { HelixAskAnswerPlanSection } from "../answer-plan";
import type { HelixAskObjectivePlannerVerbosity } from "../objectives/objective-llm-contracts";

export type HelixAskTurnContractAnswerFormat = {
  sections: HelixAskAnswerPlanSection[];
  preferred_verbosity: HelixAskObjectivePlannerVerbosity | null;
};

export const buildHelixAskTurnContractAnswerFormat = (args: {
  sections: HelixAskAnswerPlanSection[];
  preferredVerbosity?: HelixAskObjectivePlannerVerbosity | null;
}): HelixAskTurnContractAnswerFormat => ({
  sections: args.sections,
  preferred_verbosity: args.preferredVerbosity ?? null,
});
