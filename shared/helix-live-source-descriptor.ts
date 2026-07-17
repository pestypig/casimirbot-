export const HELIX_LIVE_SOURCE_DESCRIPTOR_SCHEMA =
  "helix.live_source_descriptor.v1" as const;

export type HelixLiveSourceDescriptorModality =
  | "visual_frame"
  | "world_event"
  | "environment_state"
  | "environment_affordance"
  | "audio_transcript"
  | "text_chat"
  | "calculator_stream"
  | "simulation_stream"
  | "document_context"
  | "note_context"
  | "procedure_graph"
  | "process_graph";

export type HelixLiveSourceSurface =
  | "screen"
  | "window"
  | "browser_tab"
  | "camera"
  | "document"
  | "game"
  | "app"
  | "terminal"
  | "file_manager"
  | "calculator"
  | "simulation"
  | "unknown";

export type HelixLiveSourceOrigin =
  | "browser_getDisplayMedia"
  | "browser_getUserMedia"
  | "manual_upload"
  | "discord_bridge"
  | "minehut_plugin"
  | "workstation_panel"
  | "api";

export type HelixLiveSourceDescriptorState =
  | "active"
  | "active_interval"
  | "permission_required"
  | "stale"
  | "paused"
  | "stopped"
  | "error";

export type HelixLiveSourceDescriptor = {
  schema: typeof HELIX_LIVE_SOURCE_DESCRIPTOR_SCHEMA;
  descriptor_id: string;
  source_id: string;
  thread_id: string;
  environment_id?: string | null;
  pipeline_id?: string | null;
  modality: HelixLiveSourceDescriptorModality;
  user_label?: string | null;
  serving_context: {
    surface: HelixLiveSourceSurface;
    app_hint?: string | null;
    window_title_hint?: string | null;
    source_origin: HelixLiveSourceOrigin;
    participant_id?: string | null;
  };
  capabilities: string[];
  current_state: HelixLiveSourceDescriptorState;
  cadence_ms?: number | null;
  latest_observation_refs: string[];
  raw_content_included: false;
  assistant_answer: false;
};
