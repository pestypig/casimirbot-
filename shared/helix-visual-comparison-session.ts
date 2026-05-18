export const HELIX_VISUAL_COMPARISON_SESSION_SCHEMA =
  "helix.visual_comparison_session.v1" as const;

export type HelixVisualComparisonSessionStatus =
  | "waiting"
  | "resolved"
  | "expired"
  | "cancelled";

export type HelixVisualComparisonSession = {
  schema: typeof HELIX_VISUAL_COMPARISON_SESSION_SCHEMA;
  comparison_session_id: string;
  thread_id: string;
  situation_run_id: string;
  baseline_epoch: number;
  baseline_observation_ref: string;
  waiting_for_next_visual_observation: boolean;
  status: HelixVisualComparisonSessionStatus;
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
  updated_at: string;
};
