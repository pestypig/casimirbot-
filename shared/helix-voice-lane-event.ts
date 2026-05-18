import type { HelixConversationModeClassification } from "./helix-conversation-mode";
import type { HelixVoiceOutputDecision } from "./helix-voice-output-decision";

export const HELIX_VOICE_LANE_EVENT_SCHEMA = "helix.voice_lane_event.v1" as const;
export const HELIX_VOICE_LANE_INGEST_RECEIPT_SCHEMA =
  "helix.voice_lane_ingest_receipt.v1" as const;

export type HelixVoiceLaneEvent = {
  schema: typeof HELIX_VOICE_LANE_EVENT_SCHEMA;
  voice_event_id: string;
  thread_id: string;
  source_id: string;
  room_id?: string | null;
  speaker_id?: string | null;
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
  review_id?: string | null;
  thread_item_ids: string[];
  message: string;
  error?: string | null;
  raw_audio_included: false;
  raw_transcript_included: false;
  context_policy: "compact_context_pack_only";
};
