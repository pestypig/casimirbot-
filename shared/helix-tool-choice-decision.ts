export const HELIX_TOOL_CHOICE_DECISION_SCHEMA = "helix.tool_choice_decision.v1" as const;

export type HelixToolChoiceDecision = {
  schema: typeof HELIX_TOOL_CHOICE_DECISION_SCHEMA;
  turn_id: string;
  decision:
    | "direct_answer"
    | "workstation_tool_plan"
    | "live_environment_synthesis"
    | "agentic_review"
    | "request_user_input";
  selected_affordance_ids: string[];
  reason: string;
  confidence: number;
};
