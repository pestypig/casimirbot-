import {
  normalizeHelixAskTurnContractText,
  normalizeSlotId,
  type HelixAskAnswerPlanFamily,
  type HelixAskTurnContractObjective,
} from "../obligations";
import type { HelixAskObjectivePlannerPassObjective } from "../objectives/objective-llm-contracts";
import type { PromptResearchContract } from "../prompt-research-contract";
import type { HelixAskTurnContractGroundingMode } from "./turn-contract-normalizers";
import {
  buildHelixAskPromptResearchObjectiveInputs,
  buildHelixAskTurnObjectiveQueryHints,
  buildHelixAskTurnObjectiveSlots,
  extractHelixAskTurnObjectiveFragments,
} from "./turn-contract-objective-planning";

export const buildHelixAskTurnContractResearchObjectiveInputs = (args: {
  researchContract?: PromptResearchContract | null;
  family: HelixAskAnswerPlanFamily;
  groundingMode: HelixAskTurnContractGroundingMode;
  maxObjectives: number;
}): HelixAskObjectivePlannerPassObjective[] =>
  args.researchContract
    ? buildHelixAskPromptResearchObjectiveInputs({
        contract: args.researchContract,
        family: args.family,
        groundingMode: args.groundingMode,
        maxObjectives: args.maxObjectives,
      })
    : [];

export const buildHelixAskTurnContractFallbackObjectiveLabels = (args: {
  hasResearchObjectiveInputs: boolean;
  question: string;
  maxObjectives: number;
}): string[] =>
  args.hasResearchObjectiveInputs
    ? []
    : extractHelixAskTurnObjectiveFragments(args.question, args.maxObjectives);

export const selectHelixAskTurnContractObjectiveInputs = (args: {
  researchObjectiveInputs: HelixAskObjectivePlannerPassObjective[];
  plannerObjectiveInputs?: HelixAskObjectivePlannerPassObjective[] | null;
  fallbackObjectiveLabels: string[];
}): HelixAskObjectivePlannerPassObjective[] =>
  args.researchObjectiveInputs.length
    ? args.researchObjectiveInputs
    : args.plannerObjectiveInputs?.length
      ? args.plannerObjectiveInputs
      : args.fallbackObjectiveLabels.map((label): HelixAskObjectivePlannerPassObjective => ({ label }));

export const buildHelixAskTurnContractObjectives = (args: {
  objectiveInputs: HelixAskObjectivePlannerPassObjective[];
  question: string;
  family: HelixAskAnswerPlanFamily;
  groundingMode: HelixAskTurnContractGroundingMode;
  maxObjectives: number;
}): HelixAskTurnContractObjective[] => {
  const objectives = args.objectiveInputs
    .map((entry) => {
      const label = normalizeHelixAskTurnContractText(entry.label, 180);
      if (!label) return null;
      const fallbackSlots = buildHelixAskTurnObjectiveSlots(label, args.family);
      const requiredSlots = Array.from(
        new Set(
          [
            ...(entry.required_slots ?? []).map((slot: string) => normalizeSlotId(slot)),
            ...fallbackSlots,
          ].filter((slot): slot is string => Boolean(slot)),
        ),
      ).slice(0, 4);
      const queryHints = Array.from(
        new Set(
          [
            ...(entry.query_hints ?? []).map((hint: string) =>
              normalizeHelixAskTurnContractText(hint, 120),
            ),
            ...buildHelixAskTurnObjectiveQueryHints(label, args.groundingMode, args.family),
          ].filter((hint): hint is string => Boolean(hint)),
        ),
      ).slice(0, 5);
      return {
        label,
        required_slots: requiredSlots,
        query_hints: queryHints,
      } satisfies HelixAskTurnContractObjective;
    })
    .filter((entry): entry is HelixAskTurnContractObjective => Boolean(entry))
    .slice(0, args.maxObjectives);
  if (objectives.length === 0) {
    const fallbackLabel =
      normalizeHelixAskTurnContractText(args.question, 180) || "Answer the current ask.";
    objectives.push({
      label: fallbackLabel,
      required_slots: buildHelixAskTurnObjectiveSlots(fallbackLabel, args.family),
      query_hints: buildHelixAskTurnObjectiveQueryHints(
        fallbackLabel,
        args.groundingMode,
        args.family,
      ),
    });
  }
  return objectives;
};
