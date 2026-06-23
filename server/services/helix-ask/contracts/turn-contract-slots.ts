import { normalizeSlotId } from "../obligations";
import type { HelixAskAnswerPlanFamily } from "./turn-contract-normalizers";

export type HelixAskTurnContractSlotObjective = {
  required_slots?: string[];
};

export const buildHelixAskTurnContractRequiredSlots = (args: {
  family: HelixAskAnswerPlanFamily;
  objectives: HelixAskTurnContractSlotObjective[];
  requiredSlots?: string[];
  maxRequiredSlots: number;
}): string[] => {
  const slots = new Set<string>();
  switch (args.family) {
    case "definition_overview":
      slots.add("definition");
      slots.add("repo-mapping");
      break;
    case "mechanism_process":
      slots.add("mechanism");
      slots.add("repo-mapping");
      slots.add("failure-modes");
      break;
    case "implementation_code_path":
      slots.add("repo-mapping");
      slots.add("call-chain");
      slots.add("implementation-touchpoints");
      break;
    case "roadmap_planning":
      slots.add("repo-mapping");
      slots.add("implementation-touchpoints");
      slots.add("failure-modes");
      slots.add("next-steps");
      break;
    case "recommendation_decision":
      slots.add("decision");
      slots.add("repo-mapping");
      slots.add("risks");
      break;
    case "troubleshooting_diagnosis":
      slots.add("symptoms");
      slots.add("likely-causes");
      slots.add("fixes");
      break;
    default:
      break;
  }
  for (const objective of args.objectives) {
    for (const slot of objective.required_slots ?? []) {
      const normalized = normalizeSlotId(slot);
      if (normalized) slots.add(normalized);
    }
  }
  for (const slot of args.requiredSlots ?? []) {
    const normalized = normalizeSlotId(slot);
    if (normalized) slots.add(normalized);
  }
  return Array.from(slots).slice(0, Math.max(0, args.maxRequiredSlots));
};
