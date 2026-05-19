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

export type HelixProcedureMemoryRecallRefKind =
  | "selected_evidence"
  | "reasoning_snapshot"
  | "epoch_ledger"
  | "probe_result"
  | "confidence_update"
  | "closure"
  | "answer_distillation";

export type HelixProcedureMemoryRecallSourceScope =
  | "active_situation_run"
  | "active_situation_epoch"
  | "visual_scene_memory"
  | "answer_distillation"
  | "legacy_context_pack";

export type HelixProcedureMemoryRecallRef = {
  ref_id: string;
  ref_kind: HelixProcedureMemoryRecallRefKind;
  source_scope: HelixProcedureMemoryRecallSourceScope;
  situation_run_id?: string | null;
  environment_id?: string | null;
  epoch?: number | null;
  created_at?: string | null;
  observed_at?: string | null;
  confidence?: number | null;
  summary?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};

export type ProcedureRecallFailureCode =
  | "PROCEDURE_MEMORY_RECALL_EVIDENCE_MISSING"
  | "PROCEDURE_MEMORY_ACTIVE_SITUATION_RUN_MISSING"
  | "PROCEDURE_MEMORY_SELECTED_REFS_MISSING"
  | "PROCEDURE_REASONING_SNAPSHOT_MISSING"
  | "PROCEDURE_EPOCH_LEDGER_MISSING"
  | "PROCEDURE_EPOCH_PREVIOUS_UNAVAILABLE"
  | "PROCEDURE_RECALL_TERMINAL_AUTHORITY_MISSING"
  | "PROCEDURE_RECALL_VOICE_NOT_TERMINAL_AUTHORIZED";

export type HelixProcedureMemoryRecall = {
  schema: typeof HELIX_PROCEDURE_MEMORY_RECALL_SCHEMA;
  recall_id: string;
  thread_id: string;
  turn_id: string;
  anchor_turn_id?: string | null;
  anchor_answer_ref?: string | null;
  source_turn_id?: string | null;

  mode: HelixProcedureMemoryRecallMode;
  terminal_artifact_kind:
    | "procedure_memory_recall"
    | "answer_distillation_expansion"
    | "procedure_epoch_replay";

  situation_run_id?: string | null;
  environment_id?: string | null;
  source_binding_id?: string | null;
  epoch?: number | null;

  selected_evidence_refs: HelixProcedureMemoryRecallRef[];
  reasoning_snapshot_refs: HelixProcedureMemoryRecallRef[];
  epoch_ledger_refs: HelixProcedureMemoryRecallRef[];
  probe_result_refs: HelixProcedureMemoryRecallRef[];
  confidence_update_refs: HelixProcedureMemoryRecallRef[];
  closure_refs: HelixProcedureMemoryRecallRef[];

  answer_distillation_ref?: string | null;
  expansion_ref?: string | null;

  selection_precedence: HelixProcedureMemoryRecallSourceScope[];
  evidence_complete: boolean;
  missing_evidence_reasons: string[];

  terminal_authorized: boolean;
  voice_read_authorized: boolean;

  // Legacy string-ref aliases kept for existing route/debug consumers.
  snapshot_refs: string[];
  distillation_refs: string[];
  selected_evidence_ref_ids: string[];
  epoch_ledger_ref_ids: string[];
  recall_type: HelixProcedureMemoryRecallType;
  recall_mode: HelixProcedureMemoryRecallMode;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixProcedureMemoryRecallFailure = {
  schema: "helix.procedure_memory_recall_failure.v1";
  failure_id: string;
  turn_id: string;
  thread_id: string;
  requested_mode: HelixProcedureMemoryRecallMode;
  failure_code: ProcedureRecallFailureCode;
  source_target: "procedure_memory" | "situation_epoch";
  missing_refs: string[];
  suppressed_routes: string[];
  terminal_artifact_kind: "typed_failure";
  assistant_answer: false;
  raw_content_included: false;
};
