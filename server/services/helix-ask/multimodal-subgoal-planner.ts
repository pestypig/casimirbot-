import crypto from "node:crypto";
import {
  HELIX_MULTIMODAL_SUBGOAL_PLAN_SCHEMA,
  type HelixMultimodalSubgoalPlan,
  type HelixMultimodalSubgoalPlanItem,
} from "@shared/helix-multimodal-subgoal-plan";
import type { HelixMultimodalTurnContext } from "@shared/helix-multimodal-turn-context";
import { getUserTextFromTurnInputItems } from "./turn-input-item-normalizer";

const hashShort = (parts: unknown[]): string =>
  crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 16);

export function planMultimodalSubgoals(input: {
  threadId: string;
  turnId: string;
  context: HelixMultimodalTurnContext;
  workspaceContextSnapshot?: Record<string, unknown> | null;
  createdAt?: string;
}): HelixMultimodalSubgoalPlan {
  const userGoal = getUserTextFromTurnInputItems(input.context.turn_input_items);
  const normalized = userGoal.toLowerCase();
  const hasVisualEvidence = input.context.visual_evidence_refs.length > 0;
  const wantsCalculator = /\b(?:calculator|calculate|compute|sum|total|add\s+up|add|plus|solve)\b/i.test(userGoal);
  const wantsCount = /\b(?:count|counts?|how\s+many|hotbar|inventory|items?)\b/i.test(userGoal);
  const wantsDocs = /\b(?:compare|contrast|against|match|check)\b[\s\S]{0,120}\b(?:doc|document|whitepaper|paper|viewer|open file|current file)\b/i.test(userGoal);
  const wantsNotes = /\b(?:save|store|append|note|notes)\b/i.test(userGoal);
  const asksAboutImage = /\b(?:image|picture|photo|screenshot|visual|frame|from\s+the\s+image|attached)\b/i.test(userGoal);
  const requiredItems: HelixMultimodalSubgoalPlanItem[] = [];
  const workstationTools: string[] = [];
  const missingRequirements: string[] = [];

  if (hasVisualEvidence && (asksAboutImage || wantsCount || wantsDocs || wantsNotes)) {
    if (wantsCount || wantsCalculator || wantsDocs || wantsNotes) {
      requiredItems.push("visual_extraction");
    }
    if (wantsCalculator && wantsCount) {
      requiredItems.push("equation_builder", "calculator_tool");
      workstationTools.push("scientific-calculator.solve_with_steps");
    }
    if (wantsDocs) {
      requiredItems.push("docs_lookup");
      workstationTools.push("docs-viewer.lookup_reference");
    }
    if (wantsNotes) {
      requiredItems.push("notes_storage");
      workstationTools.push("workstation-notes.append_to_note");
    }
  }

  if (!hasVisualEvidence && (asksAboutImage || normalized.includes("from the image"))) {
    missingRequirements.push("visual_evidence");
  }

  if (requiredItems.length === 0) requiredItems.push("final_synthesis");
  if (!requiredItems.includes("final_synthesis")) requiredItems.push("final_synthesis");

  return {
    schema: HELIX_MULTIMODAL_SUBGOAL_PLAN_SCHEMA,
    plan_id: `multimodal-subgoal-plan:${hashShort([
      input.threadId,
      input.turnId,
      userGoal,
      input.context.visual_evidence_refs,
    ])}`,
    thread_id: input.threadId,
    turn_id: input.turnId,
    user_goal: userGoal,
    required_items: requiredItems,
    visual_evidence_refs: input.context.visual_evidence_refs,
    workstation_tools: workstationTools,
    missing_requirements: missingRequirements,
    assistant_answer: false,
    raw_content_included: false,
    created_at: input.createdAt ?? new Date().toISOString(),
  };
}

export function multimodalPlanRequiresToolContinuation(plan: HelixMultimodalSubgoalPlan): boolean {
  return plan.required_items.some((item: HelixMultimodalSubgoalPlanItem) =>
    item === "visual_extraction" ||
    item === "equation_builder" ||
    item === "calculator_tool" ||
    item === "docs_lookup" ||
    item === "notes_storage"
  );
}
