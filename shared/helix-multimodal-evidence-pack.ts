export const HELIX_MULTIMODAL_EVIDENCE_PACK_SCHEMA =
  "helix.multimodal_evidence_pack.v1" as const;

export type HelixMultimodalEvidencePack = {
  schema: typeof HELIX_MULTIMODAL_EVIDENCE_PACK_SCHEMA;
  thread_id: string;
  visual_frame_evidence_ids: string[];
  source_event_refs: string[];
  synthetic_evidence_refs: string[];
  interpreted_event_refs: string[];
  selected_summary: string;
  raw_image_included: false;
  raw_logs_included: false;
  assistant_answer: false;
  context_policy: "compact_context_pack_only";
};
