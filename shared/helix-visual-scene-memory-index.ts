export const HELIX_VISUAL_SCENE_MEMORY_INDEX_SCHEMA =
  "helix.visual_scene_memory_index.v1" as const;

export type HelixVisualSceneMemoryIndex = {
  schema: typeof HELIX_VISUAL_SCENE_MEMORY_INDEX_SCHEMA;
  scene_memory_id: string;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  source_id?: string | null;
  epoch: number;
  timestamp: string;
  summary_ref?: string | null;
  observation_refs: string[];
  field_evaluation_refs: string[];
  interpretation_hypothesis_refs: string[];
  probe_result_refs: string[];
  closure_refs: string[];
  app_or_surface?: string | null;
  visible_title?: string | null;
  app_hints: string[];
  window_title_hints: string[];
  visible_object_terms: string[];
  file_folder_terms: string[];
  activity_terms: string[];
  uncertainty_terms: string[];
  user_objective_terms: string[];
  objects: string[];
  file_names: string[];
  activity_summary: string;
  intent_hypotheses: string[];
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
};
