export const HELIX_PROCEDURE_EPOCH_LEDGER_ITEM_SCHEMA =
  "helix.procedure_epoch_ledger_item.v1" as const;

export type HelixProcedureEpochLedgerItemKind =
  | "observation"
  | "field_worker_run"
  | "field_evaluation"
  | "interpretation_run"
  | "interpretation_worker_run"
  | "interpretation_hypothesis"
  | "prediction"
  | "probe"
  | "probe_result"
  | "confidence_update"
  | "tangent"
  | "arbitration_candidate"
  | "handoff"
  | "plan_contract"
  | "runtime_receipt"
  | "silent_update"
  | "request_user_input"
  | "epoch_closure";

export type HelixProcedureEpochLedgerItem = {
  schema: typeof HELIX_PROCEDURE_EPOCH_LEDGER_ITEM_SCHEMA;
  ledger_item_id: string;
  situation_run_id: string;
  source_binding_id: string;
  thread_id: string;
  environment_id: string;
  epoch: number;
  item_kind: HelixProcedureEpochLedgerItemKind;
  item_ref: string;
  summary: string;
  causality_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};

export type HelixProcedureEpochReplay = {
  schema: "helix.procedure_epoch_replay.v1";
  closure_id?: string | null;
  situation_run_id: string;
  source_binding_id?: string | null;
  thread_id?: string | null;
  environment_id?: string | null;
  epoch: number;
  ledger_items: HelixProcedureEpochLedgerItem[];
  causality_graph: Array<{
    from: string;
    to: string;
  }>;
  selected_evidence_refs: string[];
  terminal_policy_state: "non_terminal_replay";
  poison_authority_status: {
    assistant_answer: false;
    raw_content_included: false;
  };
  assistant_answer: false;
  raw_content_included: false;
};
