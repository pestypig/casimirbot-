import type { HelixTurnInputItem } from "./helix-turn-input-item";
import type { HelixVisualAnalysisTurnItem } from "./helix-visual-analysis-turn-item";

export const HELIX_NATIVE_IMAGE_TURN_CONTEXT_SCHEMA =
  "helix.native_image_turn_context.v1" as const;

export type HelixNativeImageTurnContext = {
  schema: typeof HELIX_NATIVE_IMAGE_TURN_CONTEXT_SCHEMA;
  thread_id: string;
  turn_id: string;
  input_items: HelixTurnInputItem[];
  visual_analysis_items: HelixVisualAnalysisTurnItem[];
  raw_image_included: false;
  assistant_answer: false;
  context_policy: "compact_context_pack_only";
};

