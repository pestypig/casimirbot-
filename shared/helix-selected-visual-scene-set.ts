import type { HelixVisualSceneMemoryIndex } from "./helix-visual-scene-memory-index";

export const HELIX_SELECTED_VISUAL_SCENE_SET_SCHEMA =
  "helix.selected_visual_scene_set.v1" as const;

export type HelixSelectedVisualScene = {
  scene_memory: HelixVisualSceneMemoryIndex;
  score: number;
  matched_terms: string[];
};

export type HelixRejectedVisualScene = {
  scene_memory_ref: string;
  reason:
    | "lower_score_than_selected_scene"
    | "wrong_scene_kind"
    | "wrong_app_or_surface"
    | "outside_anchor_window"
    | "insufficient_term_overlap"
    | "future_or_post_anchor"
    | "missing_evidence_refs";
  score: number;
  matched_terms: string[];
  evidence_refs: string[];
};

export type HelixSelectedVisualSceneSet = {
  schema: typeof HELIX_SELECTED_VISUAL_SCENE_SET_SCHEMA;
  selection_id: string;
  turn_id: string;
  thread_id: string;
  query_intent_id: string;
  selected_scenes: HelixSelectedVisualScene[];
  current_scene?: HelixVisualSceneMemoryIndex | null;
  current_scene_ref?: string | null;
  candidate_pool_size: number;
  source_target_ref: string;
  selection_policy:
    | "exact_title_first"
    | "semantic_terms_with_recency"
    | "last_kind_match"
    | "no_match";
  selection_reason: string;
  confidence: number;
  evidence_refs: string[];
  rejected_candidates: HelixRejectedVisualScene[];
  missing_evidence: string[];
  assistant_answer: false;
  raw_content_included: false;
};
