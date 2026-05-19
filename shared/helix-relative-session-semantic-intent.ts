export const HELIX_RELATIVE_SESSION_SEMANTIC_INTENT_SCHEMA =
  "helix.relative_session_semantic_intent.v1" as const;

export type HelixRelativeSessionSemanticIntent = {
  schema: typeof HELIX_RELATIVE_SESSION_SEMANTIC_INTENT_SCHEMA;
  semantic_intent_id: string;
  turn_id: string;
  thread_id: string;
  raw_user_text: string;
  literal_terms: string[];
  deictic_terms: string[];
  local_label_terms: string[];
  action_terms: string[];
  target_domain:
    | "visual_scene_memory"
    | "repo_code"
    | "docs_viewer"
    | "live_pipeline"
    | "procedure_memory"
    | "unknown";
  session_semantic_scope:
    | "current_turn"
    | "recent_turns"
    | "current_thread"
    | "current_situation_run"
    | "unknown";
  requires_binding: boolean;
  reason: string;
  assistant_answer: false;
  raw_content_included: false;
};
