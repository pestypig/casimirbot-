export const HELIX_VISUAL_EVENT_ALIGNMENT_SCHEMA =
  "helix.visual_event_alignment.v1" as const;

export type HelixVisualEventAlignment = {
  schema: typeof HELIX_VISUAL_EVENT_ALIGNMENT_SCHEMA;
  alignment_id: string;
  thread_id: string;
  frame_ids: string[];
  event_refs: string[];
  place_id?: string | null;
  summary: string;
  confidence: number;
  missing_evidence: string[];
  assistant_answer: false;
  raw_image_included: false;
  context_policy: "compact_context_pack_only";
};
