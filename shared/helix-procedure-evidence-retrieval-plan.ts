export const HELIX_PROCEDURE_EVIDENCE_RETRIEVAL_PLAN_SCHEMA =
  "helix.procedure_evidence_retrieval_plan.v1" as const;

export type HelixProcedureEvidenceRetrievalTask =
  | "current_state"
  | "comparison"
  | "trend"
  | "prediction"
  | "explanation"
  | "debug_diagnosis"
  | "evidence_replay";

export type HelixProcedureEvidenceRetrievalAnchor =
  | "latest_visual_epoch"
  | "latest_situation_run"
  | "latest_live_source_observation"
  | "named_scene"
  | "debug_export"
  | "time_window";

export type HelixProcedureEvidenceRetrievalCompareAgainst =
  | "previous_epoch"
  | "last_n_epochs"
  | "named_scene"
  | "previous_turn"
  | "time_window";

export type HelixProcedureEvidenceRetrievalFacet =
  | "scene"
  | "activity"
  | "objects"
  | "app_window"
  | "source_binding"
  | "field_evaluations"
  | "interpretations"
  | "probes"
  | "predictions"
  | "uncertainty"
  | "terminal_authority";

export type HelixProcedureEvidenceRetrievalPlan = {
  schema: typeof HELIX_PROCEDURE_EVIDENCE_RETRIEVAL_PLAN_SCHEMA;
  turn_id: string;
  prompt_hash: string;
  task: HelixProcedureEvidenceRetrievalTask;
  anchor: HelixProcedureEvidenceRetrievalAnchor;
  compare_against?: HelixProcedureEvidenceRetrievalCompareAgainst;
  requested_facets: HelixProcedureEvidenceRetrievalFacet[];
  source_targets: string[];
  evidence_required: boolean;
  why_needed: string;
  assistant_answer: false;
  raw_content_included: false;
};
