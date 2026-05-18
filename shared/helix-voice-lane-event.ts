import type { HelixConversationModeClassification } from "./helix-conversation-mode";
import type { HelixVoiceOutputDecision } from "./helix-voice-output-decision";
import type {
  HelixEvidenceObservation,
  HelixEvidenceObservationConsentState,
} from "./helix-evidence-observation";
import type { HelixSpeakerRole } from "./helix-audio-identity";

export const HELIX_VOICE_LANE_EVENT_SCHEMA = "helix.voice_lane_event.v1" as const;
export const HELIX_VOICE_LANE_INGEST_RECEIPT_SCHEMA =
  "helix.voice_lane_ingest_receipt.v1" as const;

export type HelixVoiceSourceSurface =
  | "room_mic"
  | "discord_user_stream"
  | "discord_mixed_stream"
  | "browser_tab_audio"
  | "system_loopback"
  | "display_audio"
  | "elevenlabs_output_receipt"
  | "translation_job"
  | "unknown";

export type HelixVoiceLaneEvent = {
  schema: typeof HELIX_VOICE_LANE_EVENT_SCHEMA;
  voice_event_id: string;
  thread_id: string;
  source_id: string;
  source_surface?: HelixVoiceSourceSurface | null;
  room_id?: string | null;
  speaker_id?: string | null;
  diarization_speaker_id?: string | null;
  speaker_role?: HelixSpeakerRole | null;
  speaker_confidence?: number | null;
  overlap?: boolean | null;
  language?: string | null;
  consent_state?: HelixEvidenceObservationConsentState | null;
  transcript: string;
  transcript_is_final: boolean;
  confidence?: number | null;
  ts: string;
  evidence_refs: string[];
  raw_audio_included: false;
  context_policy: "compact_context_pack_only";
};

export type HelixVoiceLaneIngestDecision =
  | "silent_keep_in_context"
  | "record_context"
  | "request_agentic_review"
  | "start_user_turn"
  | "show_text"
  | "voice_on_confirm";

export type HelixVoiceLaneIngestReceipt = {
  schema: typeof HELIX_VOICE_LANE_INGEST_RECEIPT_SCHEMA;
  ok: boolean;
  event: HelixVoiceLaneEvent | null;
  classification: HelixConversationModeClassification | null;
  decision: HelixVoiceLaneIngestDecision;
  output_decision: HelixVoiceOutputDecision;
  source_observation?: HelixVoiceSourceObservation | null;
  review_id?: string | null;
  thread_item_ids: string[];
  message: string;
  error?: string | null;
  raw_audio_included: false;
  raw_transcript_included: false;
  context_policy: "compact_context_pack_only";
};

export type HelixVoiceSourceObservation = {
  schema: "helix.voice_source_observation.v1";
  voice_event_id: string;
  thread_id: string;
  source_id: string;
  source_surface: HelixVoiceSourceSurface;
  room_id?: string | null;
  speaker_id?: string | null;
  diarization_speaker_id?: string | null;
  speaker_role?: HelixSpeakerRole | null;
  speaker_authority: HelixConversationModeClassification["speaker_authority"];
  transcript_kind: HelixConversationModeClassification["transcript_kind"];
  conversation_mode: HelixConversationModeClassification["conversation_mode"];
  transcript_final: boolean;
  transcript_confidence?: number | null;
  speaker_confidence?: number | null;
  overlap: boolean;
  language?: string | null;
  consent_state: HelixEvidenceObservationConsentState;
  evidence_observation: HelixEvidenceObservation;
  evidence_refs: string[];
  content_role: "observation_not_assistant_answer";
  assistant_answer: false;
  raw_audio_included: false;
  raw_transcript_included: false;
  context_policy: "compact_context_pack_only";
};
