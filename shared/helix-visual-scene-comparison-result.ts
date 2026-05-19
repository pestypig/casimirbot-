export const HELIX_VISUAL_SCENE_COMPARISON_RESULT_SCHEMA =
  "helix.visual_scene_comparison_result.v1" as const;

export type HelixVisualSceneComparisonResult = {
  schema: typeof HELIX_VISUAL_SCENE_COMPARISON_RESULT_SCHEMA;
  comparison_id: string;
  turn_id: string;
  thread_id: string;
  query_intent_id: string;
  selected_scene_set_id: string;
  current_scene_ref?: string | null;
  compared_scene_refs: string[];
  summary: string;
  shared_traits: string[];
  differences: string[];
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
};
