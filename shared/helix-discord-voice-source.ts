import type { HelixDiscordParticipant } from "./helix-discord-session";

export const HELIX_DISCORD_SOURCE_EVENT_SCHEMA =
  "helix.discord_source_event.v1" as const;
export const HELIX_DISCORD_VOICE_OUTPUT_RECEIPT_SCHEMA =
  "helix.discord_voice_output_receipt.v1" as const;

export type HelixDiscordSourceEventType =
  | "voice_transcript"
  | "speaker_joined"
  | "speaker_left"
  | "direct_address"
  | "command_candidate"
  | "ambient_context";

export type HelixDiscordSourceEvent = {
  schema: typeof HELIX_DISCORD_SOURCE_EVENT_SCHEMA;
  discord_event_id: string;
  session_id: string;
  guild_id: string;
  voice_channel_id: string;
  thread_id?: string | null;
  event_type: HelixDiscordSourceEventType;
  participant?: HelixDiscordParticipant | null;
  text?: string | null;
  diarization_speaker_id?: string | null;
  evidence_refs: string[];
  ts: string;
  raw_audio_included: false;
  raw_transcript_included: false;
  context_policy: "compact_context_pack_only";
};

export type HelixDiscordVoiceOutputReceipt = {
  schema: typeof HELIX_DISCORD_VOICE_OUTPUT_RECEIPT_SCHEMA;
  receipt_id: string;
  session_id: string;
  guild_id: string;
  voice_channel_id: string;
  thread_id?: string | null;
  delivered: boolean;
  channel: "discord_voice" | "discord_text" | "none";
  reason:
    | "delivered"
    | "suppressed_policy"
    | "awaiting_confirmation"
    | "voice_not_enabled"
    | "user_busy"
    | "error";
  text_preview?: string | null;
  audio_event_id?: string | null;
  evidence_refs: string[];
  ts: string;
  raw_audio_included: false;
  raw_transcript_included: false;
};
