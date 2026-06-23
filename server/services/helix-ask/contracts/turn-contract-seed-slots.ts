import { normalizeSlotId, type HelixAskTurnContractObjective } from "../obligations";

export type HelixAskTurnContractSeedSlotContract = {
  objectives: HelixAskTurnContractObjective[];
  required_slots: string[];
  query_hints: string[];
};

export type HelixAskTurnContractSeedSlotEntry = {
  id: string;
  label: string;
  required: true;
  source: "turn_contract";
  weak: false;
  aliases?: string[];
  evidenceCriteria?: string[];
};

export const buildHelixAskTurnContractSeedSlots = (
  contract: HelixAskTurnContractSeedSlotContract | null,
): HelixAskTurnContractSeedSlotEntry[] => {
  if (!contract) return [];
  const slots: HelixAskTurnContractSeedSlotEntry[] = [];
  for (const objective of contract.objectives) {
    for (const slot of objective.required_slots) {
      const normalized = normalizeSlotId(slot);
      if (!normalized) continue;
      slots.push({
        id: normalized,
        label: normalized.replace(/-/g, " "),
        required: true,
        source: "turn_contract",
        weak: false,
        aliases: [objective.label].slice(0, 1),
        evidenceCriteria: objective.query_hints.slice(0, 3),
      });
    }
  }
  for (const slot of contract.required_slots) {
    const normalized = normalizeSlotId(slot);
    if (!normalized) continue;
    slots.push({
      id: normalized,
      label: normalized.replace(/-/g, " "),
      required: true,
      source: "turn_contract",
      weak: false,
      evidenceCriteria: contract.query_hints.slice(0, 3),
    });
  }
  return slots;
};
