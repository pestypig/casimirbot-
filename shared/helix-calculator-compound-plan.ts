import type { HelixCalculatorSetupContext } from "./helix-calculator-setup-context";

export const HELIX_CALCULATOR_COMPOUND_PLAN_SCHEMA = "helix.calculator_compound_plan.v1" as const;
export const HELIX_CALCULATOR_RESULT_VALIDATION_SCHEMA = "helix.calculator_result_validation.v1" as const;

export type HelixCalculatorCompoundQuantity =
  | "energy"
  | "length"
  | "speed"
  | "time"
  | "mass"
  | "force"
  | "momentum"
  | "dimensionless";

export type HelixCalculatorCompoundSubgoalStatus = "pending" | "running" | "satisfied" | "failed";

export type HelixCalculatorCompoundSubgoal = {
  id: string;
  label: string;
  expression: string;
  expected_quantity: HelixCalculatorCompoundQuantity;
  expected_unit?: string | null;
  depends_on: string[];
  status: HelixCalculatorCompoundSubgoalStatus;
  setup?: HelixCalculatorSetupContext | null;
};

export type HelixCalculatorCompoundPlan = {
  schema: typeof HELIX_CALCULATOR_COMPOUND_PLAN_SCHEMA;
  turn_id: string;
  user_goal: string;
  subgoals: HelixCalculatorCompoundSubgoal[];
  terminal_criteria: string[];
  max_subgoals: number;
  max_repairs_per_subgoal: number;
  max_total_tool_calls: number;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCalculatorSubgoalReceipt = {
  kind: "calculator_subgoal_receipt";
  schema: "helix.calculator_subgoal_receipt.v1";
  receipt_id: string;
  turn_id: string;
  subgoal_id: string;
  expression: string;
  result_text: string | null;
  result_value: number | null;
  result_unit?: string | null;
  result_quantity?: HelixCalculatorCompoundQuantity | string | null;
  trace_source: "scientific-calculator.solve_expression";
  status: "completed" | "failed";
  calculator_setup?: HelixCalculatorSetupContext | null;
  error?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCalculatorResultValidation = {
  schema: typeof HELIX_CALCULATOR_RESULT_VALIDATION_SCHEMA;
  validation_id: string;
  turn_id: string;
  subgoal_id: string;
  receipt_id: string;
  expected_quantity: HelixCalculatorCompoundQuantity;
  expected_unit?: string | null;
  actual_quantity?: string | null;
  actual_unit?: string | null;
  result_numeric: boolean;
  satisfied: boolean;
  failure_reason?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
