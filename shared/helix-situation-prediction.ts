export const HELIX_SITUATION_PREDICTION_SCHEMA =
  "helix.situation_prediction.v1" as const;

export type SituationPrediction = {
  schema: typeof HELIX_SITUATION_PREDICTION_SCHEMA;
  prediction_id: string;
  room_id: string;
  graph_id?: string | null;
  actor_id?: string | null;
  predicted_goal: string;
  predicted_next_action?: string | null;
  confidence: number;
  status: "tentative" | "active" | "confirmed" | "stale" | "rejected";
  evidence_refs: string[];
  derived_from_narration_ids: string[];
  updated_at: string;
};
