export const HELIX_SITUATION_SETUP_INTENT_SCHEMA = "helix.situation_setup_intent.v1" as const;
export const HELIX_SITUATION_SETUP_RECEIPT_SCHEMA = "helix.situation_setup_receipt.v1" as const;

export type SituationRoomSetupIntentKind =
  | "translate_conversation"
  | "monitor_conversation"
  | "summarize_conversation"
  | "compose_prompt_from_room";

export type SituationRoomSetupCapturePreference =
  | "existing_source"
  | "browser_tab_audio"
  | "display_audio"
  | "mic"
  | "unknown";

export type SituationRoomSetupOutputMode =
  | "visual_only"
  | "voice_on_confirm"
  | "voice_auto_direct_address";

export type SituationRoomSetupMissingRequirement =
  | "audio_source"
  | "speaker_a"
  | "speaker_b"
  | "speaker_a_native_language"
  | "speaker_b_native_language"
  | "capture_permission";

export type SituationRoomSetupSpeakerMapping = {
  speaker_id?: string | null;
  display_name?: string | null;
  native_language?: string | null;
  role_hint?: "self" | "friend" | "participant";
};

export type SituationRoomSetupIntent = {
  schema: typeof HELIX_SITUATION_SETUP_INTENT_SCHEMA;
  kind: SituationRoomSetupIntentKind;
  capture_preference: SituationRoomSetupCapturePreference;
  room_id?: string | null;
  source_ids?: string[];
  blocked_source_reasons?: string[];
  speaker_mappings?: SituationRoomSetupSpeakerMapping[];
  output_mode: SituationRoomSetupOutputMode;
  missing_requirements: SituationRoomSetupMissingRequirement[];
};

export type SituationRoomSetupActionArgs = {
  intent:
    | "translate_conversation"
    | "monitor_conversation"
    | "summarize_conversation"
    | "compose_prompt_from_room";
  capture_preference?: SituationRoomSetupCapturePreference;
  room_id?: string;
  source_ids?: string[];
  speaker_a_id?: string;
  speaker_b_id?: string;
  speaker_a_native_language?: string;
  speaker_b_native_language?: string;
  output_mode?: SituationRoomSetupOutputMode;
};

export type SituationRoomSetupStatus =
  | "complete"
  | "needs_user_input"
  | "needs_capture_permission"
  | "blocked";

export type SituationRoomSetupLifecycleStatus =
  | "planned"
  | "awaiting_user_input"
  | "awaiting_capture_permission"
  | "executing_client_action"
  | "executed"
  | "failed";

export type HelixWorkstationActionLike = {
  schema_version: "helix.workstation.action/v1";
  action: "open_panel" | "focus_panel" | "run_panel_action";
  panel_id: string;
  action_id?: string;
  args?: Record<string, unknown>;
};

export type SituationRoomSetupReceipt = {
  schema: typeof HELIX_SITUATION_SETUP_RECEIPT_SCHEMA;
  ok: boolean;
  setup_status: SituationRoomSetupStatus;
  lifecycle_status?: SituationRoomSetupLifecycleStatus;
  graph_id?: string;
  job_ids?: string[];
  room_id?: string;
  source_ids?: string[];
  speaker_ids?: string[];
  missing_requirements?: SituationRoomSetupMissingRequirement[];
  next_actions?: HelixWorkstationActionLike[];
  attachment_policy: "manual_only";
  context_injection: "explicit_attachment_only";
  command_lane_enabled: false;
  output_mode: SituationRoomSetupOutputMode;
  message: string;
};

export type SituationRoomSetupPlanReceipt = SituationRoomSetupReceipt & {
  lifecycle_status: "planned" | "awaiting_user_input" | "awaiting_capture_permission";
  execution_required: boolean;
};

export type SituationRoomSetupExecutionReceipt = SituationRoomSetupReceipt & {
  lifecycle_status: "executed" | "failed";
  executed_action_id: string;
  executed_at: string;
  graph_id?: string;
  job_ids?: string[];
  error?: string | null;
};

export const normalizeSituationSetupOutputMode = (value: unknown): SituationRoomSetupOutputMode => {
  const text = typeof value === "string" ? value.trim().toLowerCase().replace(/[\s-]+/g, "_") : "";
  if (text === "voice_auto_direct_address" || text === "auto_when_direct_addressed") {
    return "voice_auto_direct_address";
  }
  if (text === "voice_on_confirm" || text === "on_confirm") return "voice_on_confirm";
  return "visual_only";
};
