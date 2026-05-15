export const HELIX_VISUAL_EXTRACTION_EVIDENCE_SCHEMA = "helix.visual_extraction_evidence.v1" as const;

export type HelixVisualExtractionGoal =
  | "hotbar_item_counts"
  | "inventory_counts"
  | "visible_objects"
  | "scene_relations"
  | "text_in_image"
  | "custom";

export type HelixVisualExtractionEvidence = {
  schema: typeof HELIX_VISUAL_EXTRACTION_EVIDENCE_SCHEMA;
  extraction_id: string;
  thread_id: string;
  turn_id: string;
  source_evidence_refs: string[];
  extraction_goal: HelixVisualExtractionGoal;
  structured_result: Record<string, unknown>;
  confidence: number;
  uncertainty: string[];
  model_invoked: boolean;
  assistant_answer: false;
  raw_image_included: false;
  context_policy: "compact_context_pack_only";
};
