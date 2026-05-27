export const LIVE_SOURCE_OBSERVATION_SCHEMA =
  "helix.live_source_observation.v1" as const;

export type LiveSourceKind =
  | "minecraft_world_events"
  | "mic_audio"
  | "screen_capture"
  | "browser_audio"
  | "operator_text"
  | "world_event_feed";

export type LiveSourceEventKind =
  | "position_update"
  | "route_state"
  | "source_health"
  | "transcript_segment"
  | "visual_summary"
  | "direct_address"
  | "audio_segment"
  | "browser_tab_audio"
  | "unknown";

export type LiveSourceFreshnessStatus =
  | "fresh"
  | "stale"
  | "missing"
  | "blocked"
  | "unknown";

export type LiveSourceObservation = {
  schema: typeof LIVE_SOURCE_OBSERVATION_SCHEMA;
  observation_id: string;
  thread_id?: string;
  room_id?: string | null;
  environment_id?: string | null;
  source_id: string;
  binding_id?: string;
  job_contract_ids?: string[];
  source_kind: LiveSourceKind;
  event_kind: LiveSourceEventKind;
  observed_at: string;
  freshness: {
    status: LiveSourceFreshnessStatus;
    age_ms?: number;
    stale_after_ms?: number;
    message?: string;
  };
  provenance: {
    adapter: string;
    source_label?: string;
    confidence: "low" | "medium" | "high";
  };
  compact_summary: string;
  payload_summary?: {
    position?: {
      x?: number;
      y?: number;
      z?: number;
      dimension?: string;
    };
    route_state?: {
      status?: "on_route" | "drift_candidate" | "drift_confirmed" | "unknown";
      target?: string;
      distance_from_route?: number;
    };
    transcript?: {
      text: string;
      is_direct_address?: boolean;
      detected_language?: string;
      speaker_label?: string;
    };
    visual?: {
      scene_summary: string;
      confidence: "low" | "medium" | "high";
    };
  };
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
};
