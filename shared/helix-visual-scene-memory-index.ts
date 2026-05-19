export const HELIX_VISUAL_SCENE_MEMORY_INDEX_SCHEMA =
  "helix.visual_scene_memory_index.v1" as const;

export type HelixVisualSceneMemoryIndex = {
  schema: typeof HELIX_VISUAL_SCENE_MEMORY_INDEX_SCHEMA;
  scene_memory_id: string;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  epoch: number;
  timestamp: string;
  app_or_surface?: string | null;
  visible_title?: string | null;
  objects: string[];
  file_names: string[];
  activity_summary: string;
  intent_hypotheses: string[];
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
};
