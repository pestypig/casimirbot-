export const HELIX_PROCEDURE_REASONING_SNAPSHOT_SCHEMA =
  "helix.procedure_reasoning_snapshot.v1" as const;

export type HelixProcedureReasoningSnapshot = {
  schema: typeof HELIX_PROCEDURE_REASONING_SNAPSHOT_SCHEMA;
  snapshot_id: string;
  turn_id: string;
  thread_id: string;
  situation_run_id?: string | null;
  epoch?: number | null;
  user_question: string;
  full_reasoning_summary: string;
  observation_refs: string[];
  field_evaluation_refs: string[];
  prediction_refs: string[];
  probe_result_refs: string[];
  confidence_update_refs: string[];
  epoch_closure_refs: string[];
  selected_evidence_pack_ref?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
