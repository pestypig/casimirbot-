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
  reason: string;
  score: number;
  matched_terms: string[];
};

export type HelixSelectedVisualSceneSet = {
  schema: typeof HELIX_SELECTED_VISUAL_SCENE_SET_SCHEMA;
  selection_id: string;
  turn_id: string;
  thread_id: string;
  query_intent_id: string;
  selected_scenes: HelixSelectedVisualScene[];
  current_scene?: HelixVisualSceneMemoryIndex | null;
  selection_reason: string;
  confidence: number;
  evidence_refs: string[];
  rejected_candidates: HelixRejectedVisualScene[];
  missing_evidence: string[];
  assistant_answer: false;
  raw_content_included: false;
};
