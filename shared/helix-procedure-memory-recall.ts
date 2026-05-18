export const HELIX_PROCEDURE_MEMORY_RECALL_SCHEMA =
  "helix.procedure_memory_recall.v1" as const;

export type HelixProcedureMemoryRecallType =
  | "show_evidence"
  | "why_answer"
  | "epoch_replay"
  | "confidence_change"
  | "log_navigation";

export type HelixProcedureMemoryRecallMode =
  | "brief_evidence"
  | "expanded_trace"
  | "epoch_replay";

export type HelixProcedureMemoryRecall = {
  schema: typeof HELIX_PROCEDURE_MEMORY_RECALL_SCHEMA;
  recall_id: string;
  thread_id: string;
  turn_id: string;
  source_turn_id?: string | null;
  snapshot_refs: string[];
  epoch_ledger_refs: string[];
  distillation_refs: string[];
  selected_evidence_refs: string[];
  recall_type: HelixProcedureMemoryRecallType;
  recall_mode: HelixProcedureMemoryRecallMode;
  assistant_answer: false;
  raw_content_included: false;
};
