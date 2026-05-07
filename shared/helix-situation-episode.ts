export const HELIX_SITUATION_EPISODE_SCHEMA = "helix.situation_episode.v1" as const;
export const HELIX_SITUATION_EPISODE_NARRATION_SCHEMA =
  "helix.situation_episode_narration.v1" as const;
export const HELIX_SITUATION_PREDICTION_SCHEMA =
  "helix.situation_prediction.v1" as const;

export type SituationEpisodeType =
  | "resource_gathering"
  | "movement_transition"
  | "combat_risk"
  | "death_event"
  | "goal_progress"
  | "goal_blocked"
  | "inventory_change"
  | "social_or_chat_context"
  | "unknown";

export type SituationEpisode = {
  schema: typeof HELIX_SITUATION_EPISODE_SCHEMA;
  episode_id: string;
  room_id: string;
  world_id?: string | null;
  graph_id?: string | null;
  actor_id?: string | null;
  actor_label?: string | null;
  episode_type: SituationEpisodeType;
  from_ts: string;
  to_ts: string;
  event_ids: string[];
  evidence_refs: string[];
  summary_seed: string;
  location_path?: Array<Record<string, unknown>>;
  inventory_events?: Array<Record<string, unknown>>;
  combat_events?: Array<Record<string, unknown>>;
  meta?: Record<string, unknown>;
};

export type SituationEpisodeNarration = {
  schema: typeof HELIX_SITUATION_EPISODE_NARRATION_SCHEMA;
  narration_id: string;
  episode_id: string;
  room_id: string;
  world_id?: string | null;
  actor_label?: string | null;
  text: string;
  perspective: "third_person";
  confidence: number;
  source: "deterministic_dictionary" | "micro_reasoner" | "hybrid";
  evidence_refs: string[];
  ts: string;
};

export type SituationPrediction = {
  schema: typeof HELIX_SITUATION_PREDICTION_SCHEMA;
  prediction_id: string;
  room_id: string;
  episode_id?: string | null;
  actor_label?: string | null;
  predicted_goal: string;
  rationale: string;
  confidence: number;
  status: "hypothesis" | "active" | "completed" | "blocked";
  evidence_refs: string[];
  ts: string;
};
