export const HELIX_SITUATION_SEMANTIC_EVENT_SCHEMA =
  "helix.situation_semantic_event.v1" as const;

export type SituationSemanticTag =
  | "risk"
  | "combat"
  | "resource_gathering"
  | "travel"
  | "crafting"
  | "building"
  | "exploration"
  | "goal_progress"
  | "goal_blocked"
  | "source_health"
  | "unknown";

export type SituationSemanticEvent = {
  schema: typeof HELIX_SITUATION_SEMANTIC_EVENT_SCHEMA;
  semantic_event_id: string;
  source_signal_id: string;
  room_id: string;
  graph_id?: string | null;
  world_id?: string | null;
  actor_id?: string | null;
  event_type: string;
  subject?: string | null;
  verb: string;
  object?: string | null;
  tags: SituationSemanticTag[];
  goal_clues: string[];
  risk_clues: string[];
  narrative_template: string;
  evidence_refs: string[];
  ts: string;
};
