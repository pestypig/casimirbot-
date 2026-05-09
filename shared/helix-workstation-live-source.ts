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

export type WorkstationLiveSourceFamily =
  | "minecraft_world"
  | "calculator_stream"
  | "physics_simulation"
  | "browser_audio"
  | "screen_summary"
  | "manual_debug";

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
  run_id?: string | null;
  last_tick_index?: number | null;
  last_event_ts?: string | null;
  event_count?: number;
  created_at: string;
  updated_at: string;
};

export type LiveSourceWindowPolicy = {
  window_ms: number;
  max_events_per_window: number;
  emit_line_delta_on: "every_tick" | "value_changed" | "window_close" | "salience_only";
  max_thread_appends_per_minute: number;
};

export type LiveSourceWindowSummary = {
  window_id: string;
  source_id: string;
  environment_id?: string | null;
  from_ts: string;
  to_ts: string;
  event_count: number;
  window_count: number;
  policy: LiveSourceWindowPolicy;
  evidence_refs: string[];
};

export type WorkstationLiveSourceEvent = {
  schema: typeof HELIX_WORKSTATION_LIVE_SOURCE_EVENT_SCHEMA;
  event_id: string;
  source_event_id?: string;
  source_id: string;
  environment_id?: string | null;
  thread_id?: string | null;
  seq: number;
  tick_index?: number | null;
  ts: string;
  kind: WorkstationLiveSourceKind;
  source_family?: WorkstationLiveSourceFamily;
  event_type: string;
  payload: Record<string, unknown>;
  evidence_refs: string[];
  deterministic?: boolean;
  window_id?: string | null;
  window_event_count?: number | null;
  trace?: Record<string, unknown> | null;
};
