export const HELIX_CLIENT_CAPABILITY_ACTION_SCHEMA =
  "helix.client_capability_action.v1" as const;

export type HelixClientCapabilityTarget =
  | "current_browser"
  | "desktop_client"
  | "discord_bridge"
  | "any_available";

export type HelixClientCapability =
  | "visual_capture"
  | "tab_audio_capture"
  | "microphone_capture"
  | "screen_capture"
  | "browser_tab_capture"
  | "local_file_pick"
  | "clipboard_read"
  | "clipboard_write"
  | "workstation_panel_focus";

export type HelixClientCapabilityActionKind =
  | "request_permission"
  | "adopt_producer"
  | "set_rate"
  | "capture_now"
  | "start_interval"
  | "pause"
  | "resume"
  | "stop"
  | "heartbeat";

export type HelixClientCapabilityActionStatus =
  | "requested"
  | "delivered"
  | "adopted"
  | "completed"
  | "failed"
  | "expired";

export type HelixClientCapabilityAction = {
  schema: typeof HELIX_CLIENT_CAPABILITY_ACTION_SCHEMA;
  action_request_id: string;
  thread_id: string;
  environment_id?: string | null;
  pipeline_id?: string | null;
  target_client: HelixClientCapabilityTarget;
  capability: HelixClientCapability;
  action: HelixClientCapabilityActionKind;
  args: Record<string, unknown>;
  status: HelixClientCapabilityActionStatus;
  requires_user_gesture: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

