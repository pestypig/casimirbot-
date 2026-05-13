export const HELIX_WORKSTATION_TOOL_PLAN_SCHEMA = "helix.workstation_tool_plan.v1" as const;

export type HelixWorkstationToolPlanIntent =
  | "calculator_verify"
  | "calculator_solve"
  | "notes_create"
  | "notes_append"
  | "notes_store_large_text"
  | "ideology_compare"
  | "live_environment_create"
  | "direct_answer";

export type HelixWorkstationToolPlanStepKind =
  | "open_panel"
  | "run_panel_action"
  | "run_job"
  | "observe_state"
  | "evaluate_result";

export type HelixWorkstationToolPlanStep = {
  step_id: string;
  kind: HelixWorkstationToolPlanStepKind;
  panel_id?: string | null;
  action_id?: string | null;
  args?: Record<string, unknown>;
  depends_on?: string[];
  expected_receipt_kind?: string | null;
  expected_state_change?: Record<string, unknown> | null;
  required: boolean;
};

export type HelixWorkstationToolPlan = {
  schema: typeof HELIX_WORKSTATION_TOOL_PLAN_SCHEMA;
  plan_id: string;
  thread_id: string;
  turn_id: string;
  goal: string;
  intent: HelixWorkstationToolPlanIntent;
  steps: HelixWorkstationToolPlanStep[];
  missing_requirements: string[];
  created_at: string;
};
