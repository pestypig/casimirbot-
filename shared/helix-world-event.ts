export type HelixWorldEvent = {
  schema: "helix.world_event.v1";
  world_id: string;
  room_id: string;
  source_id?: string;
  ts: string;
  actor_id?: string;
  actor_label?: string;
  event_type: string;
  location?: Record<string, unknown>;
  inventory_delta?: Record<string, unknown>;
  health_delta?: Record<string, unknown>;
  objective_delta?: Record<string, unknown>;
  entities?: Array<Record<string, unknown>>;
  text?: string;
  evidence_refs: string[];
  meta?: Record<string, unknown>;
};

