export const HELIX_PROCEDURE_EVIDENCE_RETRIEVAL_RESULT_SCHEMA =
  "helix.procedure_evidence_retrieval_result.v1" as const;

export type HelixProcedureEvidenceRetrievalFact = {
  claim: string;
  current_refs: string[];
  prior_refs: string[];
  confidence: number;
};

export type HelixProcedureEvidenceStableFact = {
  claim: string;
  refs: string[];
  confidence: number;
};

export type HelixProcedureEvidenceRetrievalUncertainty = {
  issue: string;
  missing_evidence: string[];
  effect_on_answer: string;
};

export type HelixProcedureEvidenceRejectedRef = {
  ref: string;
  reason: string;
};

export type HelixProcedureEvidenceRetrievalResult = {
  schema: typeof HELIX_PROCEDURE_EVIDENCE_RETRIEVAL_RESULT_SCHEMA;
  turn_id: string;
  retrieval_plan_id: string;

  selected_current_refs: string[];
  selected_prior_refs: string[];
  selected_epoch_refs: string[];
  selected_field_evaluation_refs: string[];
  selected_interpretation_refs: string[];
  selected_probe_refs: string[];

  changed_facts: HelixProcedureEvidenceRetrievalFact[];
  stable_facts: HelixProcedureEvidenceStableFact[];
  uncertainty: HelixProcedureEvidenceRetrievalUncertainty[];
  rejected_refs: HelixProcedureEvidenceRejectedRef[];

  answerability: "answerable" | "partially_answerable" | "not_answerable";

  assistant_answer: false;
  raw_content_included: false;
};
