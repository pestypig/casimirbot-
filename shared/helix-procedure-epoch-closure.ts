export const HELIX_PROCEDURE_EPOCH_CLOSURE_SCHEMA =
  "helix.procedure_epoch_closure.v1" as const;

export type HelixProcedureEpochClosureStatus =
  | "silent_update"
  | "handoff_pending"
  | "plan_pending"
  | "request_input_pending"
  | "runtime_executed"
  | "suppressed"
  | "blocked"
  | "expired";

export type HelixProcedureEpochClosure = {
  schema: typeof HELIX_PROCEDURE_EPOCH_CLOSURE_SCHEMA;
  closure_id: string;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  source_binding_id: string;
  epoch: number;
  status: HelixProcedureEpochClosureStatus;
  card_updated: boolean;
  confidence_changes: string[];
  pending_actions: string[];
  next_epoch_triggers: string[];
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
