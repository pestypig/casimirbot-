export const HELIX_VISUAL_SCENE_QUERY_INTENT_SCHEMA =
  "helix.visual_scene_query_intent.v1" as const;

export type HelixVisualSceneQueryIntent = {
  schema: typeof HELIX_VISUAL_SCENE_QUERY_INTENT_SCHEMA;
  query_intent_id: string;
  turn_id: string;
  thread_id: string;
  query_text: string;
  query_terms: string[];
  compare_to_current: boolean;
  strength: "none" | "soft" | "hard";
  reason: string;
  assistant_answer: false;
  raw_content_included: false;
};
