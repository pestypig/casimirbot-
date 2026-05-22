import type { HelixCalculatorSetupContext } from "./helix-calculator-setup-context";

export const HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA = "helix.workstation_tool_evaluation.v1" as const;

export type HelixWorkstationToolEvaluation = {
  schema: typeof HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA;
  evaluation_id: string;
  plan_id: string;
  thread_id: string;
  turn_id: string;
  goal: string;
  subgoal: string;
  tool_receipt_ids: string[];
  supports_goal: true | false | "partial" | "unknown";
  summary: string;
  evidence_refs: string[];
  calculator_setup?: HelixCalculatorSetupContext | null;
  categorization_event_ids?: string[];
  synthetic_evidence_ids?: string[];
  subgoal_evaluation_ids?: string[];
  deterministic: boolean;
  model_invoked: boolean;
  created_at: string;
};
