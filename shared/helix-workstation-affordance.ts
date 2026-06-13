export const HELIX_WORKSTATION_AFFORDANCE_SCHEMA = "helix.workstation_affordance.v1" as const;
export const HELIX_WORKSTATION_ACTION_EXECUTION_SCHEMA = "helix.workstation_action_execution.v1" as const;
export const HELIX_WORKSTATION_ACTION_RECEIPT_SCHEMA = "helix.workstation_action_receipt.v1" as const;
export const HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA = "helix.workstation_tool_evaluation.v1" as const;

export type HelixWorkstationAffordanceFamily =
  | "calculation"
  | "notes"
  | "documents"
  | "live_source"
  | "live_answer_environment"
  | "situation_room"
  | "clipboard"
  | "history"
  | "storage"
  | "ideology"
  | "debug"
  | "admin";

export type HelixWorkstationActionLifecycleStatus =
  | "planned"
  | "rendered"
  | "confirmed"
  | "skipped_confirmation"
  | "dispatched"
  | "backend_acknowledged"
  | "state_observed"
  | "receipt_recorded"
  | "completed"
  | "failed";

export type HelixWorkstationAffordance = {
  schema: typeof HELIX_WORKSTATION_AFFORDANCE_SCHEMA;
  affordance_id: string;
  panel_id: string;
  action_id: string;
  label: string;
  family: HelixWorkstationAffordanceFamily;
  description: string;
  input_schema: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  risk: "low" | "medium" | "high";
  confirmation_policy: "never" | "on_high_risk" | "always";
  execution_target: "client" | "server" | "hybrid";
  backend_endpoint?: string | null;
  client_handler_key?: string | null;
  expected_receipt_kind: string;
  expected_state_change?: {
    store?: string;
    selector_hint?: string;
    proof_key?: string;
  } | null;
  context_policy: "compact_context_only" | "explicit_attachment_only" | "debug_only";
  deterministic_content_role: "observation_not_assistant_answer";
};

export type HelixWorkstationActionExecution = {
  schema: typeof HELIX_WORKSTATION_ACTION_EXECUTION_SCHEMA;
  execution_id: string;
  thread_id?: string | null;
  turn_id?: string | null;
  trace_id?: string | null;
  panel_id: string;
  action_id: string;
  affordance_id?: string | null;
  status: HelixWorkstationActionLifecycleStatus;
  args: Record<string, unknown>;
  receipt?: Record<string, unknown> | null;
  state_observed?: boolean;
  state_observation?: Record<string, unknown> | null;
  error?: string | null;
  started_at: string;
  updated_at: string;
};

export type HelixWorkstationActionReceipt = {
  schema: typeof HELIX_WORKSTATION_ACTION_RECEIPT_SCHEMA;
  receipt_id: string;
  execution_id: string;
  thread_id?: string | null;
  turn_id?: string | null;
  panel_id: string;
  action_id: string;
  affordance_id?: string | null;
  ok: boolean;
  receipt_kind: string;
  artifact?: Record<string, unknown> | null;
  message?: string | null;
  evidence_refs: string[];
  deterministic: true;
  model_invoked: false;
  context_policy: "compact_context_only" | "explicit_attachment_only" | "debug_only";
  deterministic_content_role: "observation_not_assistant_answer";
  created_at: string;
};

export type WorkstationToolEvaluation = {
  schema: typeof HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA;
  evaluation_id: string;
  thread_id: string;
  turn_id?: string | null;
  goal_id?: string | null;
  subgoal_id?: string | null;
  tool_receipt_id: string;
  result:
    | "supports_subgoal"
    | "contradicts_subgoal"
    | "insufficient"
    | "needs_followup_tool"
    | "stored_for_reference";
  summary: string;
  evidence_refs: string[];
  model_invoked: boolean;
  deterministic_gate: boolean;
  created_at: string;
};
