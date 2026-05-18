export const HELIX_SITUATION_EVIDENCE_SELECTION_SCHEMA =
  "helix.situation_evidence_selection.v1" as const;

export type HelixSituationEvidenceSelection = {
  schema: typeof HELIX_SITUATION_EVIDENCE_SELECTION_SCHEMA;
  selection_id: string;
  thread_id: string;
  situation_run_id?: string | null;
  deictic_reference_id?: string | null;
  selected_observation_refs: string[];
  selected_field_evaluation_refs: string[];
  selected_probe_result_refs: string[];
  selected_epoch_closure_refs: string[];
  selected_source_descriptor_refs: string[];
  exclusion_reasons: string[];
  answerable: boolean;
  answerability_reason: string;
  assistant_answer: false;
  raw_content_included: false;
};
