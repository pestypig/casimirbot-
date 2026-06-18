import {
  HELIX_TOOL_CHOICE_DECISION_SCHEMA,
  type HelixToolChoiceDecision,
} from "../../../shared/helix-tool-choice-decision";
import type { HelixSelectedEvidencePack } from "../../../shared/helix-selected-evidence-pack";
import type { HelixWorkstationToolPlan } from "../../../shared/helix-workstation-tool-plan";

export type DecideHelixToolChoiceInput = {
  turn_id: string;
  prompt: string;
  selected_evidence_pack?: HelixSelectedEvidencePack | null;
  workstation_tool_plan?: HelixWorkstationToolPlan | null;
  active_live_environment_ids?: string[];
  missing_requirements?: string[];
};

export function decideHelixToolChoice(input: DecideHelixToolChoiceInput): HelixToolChoiceDecision {
  if (input.missing_requirements && input.missing_requirements.length > 0) {
    return {
      schema: HELIX_TOOL_CHOICE_DECISION_SCHEMA,
      turn_id: input.turn_id,
      decision: "request_user_input",
      selected_affordance_ids: [],
      reason: `Missing required inputs: ${input.missing_requirements.join(", ")}.`,
      confidence: 0.9,
    };
  }
  if (input.workstation_tool_plan && input.workstation_tool_plan.intent !== "direct_answer") {
    return {
      schema: HELIX_TOOL_CHOICE_DECISION_SCHEMA,
      turn_id: input.turn_id,
      decision: "workstation_tool_plan",
      selected_affordance_ids: input.workstation_tool_plan.steps
        .map((step: HelixWorkstationToolPlan["steps"][number]) =>
          step.tool_id ?? (step.panel_id && step.action_id ? `${step.panel_id}.${step.action_id}` : null),
        )
        .filter((entry): entry is string => Boolean(entry)),
      reason: "Prompt maps to a receipt-backed workstation affordance before final answer.",
      confidence: 0.88,
    };
  }
  if ((input.active_live_environment_ids ?? []).length > 0 && /\b(?:current|latest|what.*happen|what.*changed|what.*prime|situation)\b/i.test(input.prompt)) {
    return {
      schema: HELIX_TOOL_CHOICE_DECISION_SCHEMA,
      turn_id: input.turn_id,
      decision: "live_environment_synthesis",
      selected_affordance_ids: [],
      reason: "Prompt is relevant to an active live environment.",
      confidence: 0.72,
    };
  }
  return {
    schema: HELIX_TOOL_CHOICE_DECISION_SCHEMA,
    turn_id: input.turn_id,
    decision: "direct_answer",
    selected_affordance_ids: [],
    reason: input.selected_evidence_pack?.selected_evidence_ids.length
      ? "Direct answer can use selected compact evidence."
      : "No tool-specific affordance was required.",
    confidence: 0.66,
  };
}
