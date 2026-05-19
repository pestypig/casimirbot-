export const HELIX_VISUAL_SCENE_QUERY_INTENT_SCHEMA =
  "helix.visual_scene_query_intent.v1" as const;

export type HelixVisualSceneQueryIntent = {
  schema: typeof HELIX_VISUAL_SCENE_QUERY_INTENT_SCHEMA;
  query_intent_id: string;
  turn_id: string;
  thread_id: string;
  query_text: string;
  query_terms: string[];
  query_mode:
    | "find_prior_scene"
    | "compare_prior_to_current"
    | "changed_since_prior"
    | "compare_current_app_to_prior_kind";
  target_scene_kind?: "folder" | "app_window" | "task_manager" | "media_roll" | "unknown";
  target_app_terms: string[];
  target_window_terms: string[];
  target_file_folder_terms: string[];
  target_object_terms: string[];
  target_activity_terms: string[];
  target_intent_terms: string[];
  relative_time:
    | "last_matching"
    | "last_folder_scene"
    | "latest_any"
    | "unspecified";
  requires_current_scene: boolean;
  compare_to_current: boolean;
  strength: "none" | "soft" | "hard";
  reason: string;
  assistant_answer: false;
  raw_content_included: false;
};
