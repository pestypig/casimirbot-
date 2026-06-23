import { normalizeSlotId } from "../obligations";

export type HelixAskTurnContractObjectiveSupportContract = {
  objectives: Array<{
    label: string;
    required_slots: string[];
  }>;
};

export type HelixAskTurnContractObjectiveSupport = {
  objective: string;
  supported: boolean;
  matched_slots: string[];
};

export const buildHelixAskTurnContractObjectiveSupport = (args: {
  contract: HelixAskTurnContractObjectiveSupportContract | null;
  coveredSlots: string[];
}): HelixAskTurnContractObjectiveSupport[] => {
  if (!args.contract) return [];
  const covered = new Set(args.coveredSlots.map((slot) => normalizeSlotId(slot)).filter(Boolean));
  return args.contract.objectives.map((objective) => {
    const matchedSlots = objective.required_slots
      .map((slot) => normalizeSlotId(slot))
      .filter((slot) => covered.has(slot));
    return {
      objective: objective.label,
      supported:
        objective.required_slots.length > 0
          ? matchedSlots.length === objective.required_slots.length
          : matchedSlots.length > 0,
      matched_slots: matchedSlots,
    };
  });
};
