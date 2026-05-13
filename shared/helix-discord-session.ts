export const HELIX_DISCORD_VOICE_SESSION_SCHEMA =
  "helix.discord_voice_session.v1" as const;
export const HELIX_DISCORD_PARTICIPANT_SCHEMA =
  "helix.discord_participant.v1" as const;
export const HELIX_DISCORD_SESSION_RECEIPT_SCHEMA =
  "helix.discord_session_receipt.v1" as const;

export type HelixDiscordVoiceSessionStatus =
  | "unlinked"
  | "link_pending"
  | "active"
  | "paused"
  | "ended";

export type HelixDiscordParticipantRole =
  | "commander"
  | "trusted_participant"
  | "guest"
  | "unknown";

export type HelixDiscordParticipantAuthority =
  | "command_allowed"
  | "command_confirm"
  | "transcribe_only"
  | "ignored";

export type HelixDiscordParticipant = {
  schema: typeof HELIX_DISCORD_PARTICIPANT_SCHEMA;
  discord_user_id: string;
  display_name: string;
  role: HelixDiscordParticipantRole;
  speaker_id?: string | null;
  authority: HelixDiscordParticipantAuthority;
};

export type HelixDiscordVoiceSession = {
  schema: typeof HELIX_DISCORD_VOICE_SESSION_SCHEMA;
  session_id: string;
  guild_id: string;
  voice_channel_id: string;
  text_channel_id?: string | null;
  status: HelixDiscordVoiceSessionStatus;
  linked_profile_id?: string | null;
  commander_discord_user_id?: string | null;
  thread_id?: string | null;
  room_id?: string | null;
  live_environment_ids: string[];
  participants: HelixDiscordParticipant[];
  created_at: string;
  updated_at: string;
};

export type HelixDiscordSessionReceipt = {
  schema: typeof HELIX_DISCORD_SESSION_RECEIPT_SCHEMA;
  ok: boolean;
  session: HelixDiscordVoiceSession | null;
  message: string;
  error?: string | null;
  credential_collection_allowed: false;
  context_policy: "compact_context_pack_only";
};
