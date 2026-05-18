import type { HelixSituationSourceBindingModality } from "./helix-situation-source-binding";

export const HELIX_SOURCE_FUSION_SELECTION_SCHEMA =
  "helix.source_fusion_selection.v1" as const;

export type HelixSourceFusionSelection = {
  schema: typeof HELIX_SOURCE_FUSION_SELECTION_SCHEMA;
  selection_id: string;
  situation_run_id: string;
  epoch: number;
  thread_id: string;
  source_set_ref: string;
  field_key: string;
  selected_modalities: HelixSituationSourceBindingModality[];
  selected_evidence_refs: string[];
  excluded_evidence_refs: string[];
  exclusion_reasons: string[];
  authority_reason: string;
  assistant_answer: false;
  raw_content_included: false;
};
