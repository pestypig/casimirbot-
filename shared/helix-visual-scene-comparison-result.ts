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
  changed_objects: string[];
  unchanged_objects: string[];
  changed_activity: string[];
  changed_app_or_window: string[];
  changed_user_focus: string[];
  added_terms: string[];
  removed_terms: string[];
  shared_terms: string[];
  prior_scene_evidence_refs: string[];
  current_scene_evidence_refs: string[];
  confidence: number;
  shared_traits: string[];
  differences: string[];
  evidence_refs: string[];
  missing_evidence: string[];
  next_check: string;
  role: "validation";
  assistant_answer: false;
  raw_content_included: false;
};
