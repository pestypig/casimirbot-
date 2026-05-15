export const HELIX_VISUAL_ANALYSIS_TURN_ITEM_SCHEMA =
  "helix.visual_analysis_turn_item.v1" as const;

export type HelixVisualAnalysisTurnItem = {
  schema: typeof HELIX_VISUAL_ANALYSIS_TURN_ITEM_SCHEMA;
  item_id: string;
  thread_id: string;
  turn_id: string;
  status: "inProgress" | "completed" | "failed";
  source_input_item_index: number;
  frame_id?: string | null;
  evidence_id?: string | null;
  summary?: string | null;
  error_code?: "vision_timeout" | "vision_provider_unavailable" | "vision_parse_error" | null;
  model_invoked: boolean;
  assistant_answer: false;
  raw_image_included: false;
  context_policy: "compact_context_pack_only";
};

