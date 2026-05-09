export const HELIX_WORKSTATION_LIVE_SOURCE_SCHEMA = "helix.workstation_live_source.v1" as const;
export const HELIX_WORKSTATION_LIVE_SOURCE_EVENT_SCHEMA = "helix.workstation_live_source_event.v1" as const;

export type WorkstationLiveSourceKind =
  | "minecraft_world_events"
  | "calculator_series"
  | "physics_simulation"
  | "browser_audio_transcript"
  | "screen_summary"
  | "manual_feed"
  | "custom_panel";

export type WorkstationLiveSource = {
  schema: typeof HELIX_WORKSTATION_LIVE_SOURCE_SCHEMA;
  source_id: string;
  kind: WorkstationLiveSourceKind;
  panel_id?: string | null;
  thread_id?: string | null;
  environment_id?: string | null;
  status: "active" | "paused" | "stopped" | "error";
  tick_rate_ms?: number | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type WorkstationLiveSourceEvent = {
  schema: typeof HELIX_WORKSTATION_LIVE_SOURCE_EVENT_SCHEMA;
  event_id: string;
  source_id: string;
  environment_id?: string | null;
  seq: number;
  ts: string;
  kind: WorkstationLiveSourceKind;
  event_type: string;
  payload: Record<string, unknown>;
  evidence_refs: string[];
  trace?: Record<string, unknown> | null;
};
