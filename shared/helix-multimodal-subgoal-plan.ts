export const HELIX_MULTIMODAL_SUBGOAL_PLAN_SCHEMA = "helix.multimodal_subgoal_plan.v1" as const;

export type HelixMultimodalSubgoalPlanItem =
  | "visual_extraction"
  | "semantic_lookup"
  | "equation_builder"
  | "calculator_tool"
  | "docs_lookup"
  | "notes_storage"
  | "final_synthesis";

export type HelixMultimodalSubgoalPlan = {
  schema: typeof HELIX_MULTIMODAL_SUBGOAL_PLAN_SCHEMA;
  plan_id: string;
  thread_id: string;
  turn_id: string;
  user_goal: string;
  required_items: HelixMultimodalSubgoalPlanItem[];
  visual_evidence_refs: string[];
  workstation_tools: string[];
  missing_requirements: string[];
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
