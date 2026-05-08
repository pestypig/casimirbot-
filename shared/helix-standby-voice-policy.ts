export type HelixStandbyVoicePolicy = {
  schema: "helix.standby_voice_policy.v1";
  voice_input_active: boolean;
  voice_output_enabled: boolean;
  standby_voice_mode:
    | "off"
    | "text_only"
    | "voice_on_confirm"
    | "critical_voice"
    | "direct_address_only";
  requires_confirmation: boolean;
  last_user_granted_voice_output_at?: string | null;
};

export const DEFAULT_MINECRAFT_STANDBY_VOICE_POLICY: HelixStandbyVoicePolicy = {
  schema: "helix.standby_voice_policy.v1",
  voice_input_active: false,
  voice_output_enabled: false,
  standby_voice_mode: "text_only",
  requires_confirmation: false,
  last_user_granted_voice_output_at: null,
};
