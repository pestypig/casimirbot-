import type { HelixAgentRuntimeId } from "./helix-agent-runtime";
import type { HelixAgentStepObservationPacket } from "./helix-agent-step-observation-packet";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneResolveTrace,
} from "./helix-capability-lane";

export const HELIX_TEXT_TO_SPEECH_ONE_SHOT_REQUEST_SCHEMA =
  "helix.text_to_speech.one_shot_request.v1" as const;
export const HELIX_TEXT_TO_SPEECH_RECEIPT_SCHEMA =
  "helix.text_to_speech.receipt.v1" as const;
export const HELIX_TEXT_TO_SPEECH_ONE_SHOT_RESULT_SCHEMA =
  "helix.text_to_speech.one_shot_result.v1" as const;

export type HelixTextToSpeechPlaybackStatus =
  | "pending"
  | "played"
  | "blocked"
  | "failed";

export type HelixTextToSpeechOneShotRequest = {
  schema: typeof HELIX_TEXT_TO_SPEECH_ONE_SHOT_REQUEST_SCHEMA;
  capability: "text_to_speech.speak_text";
  text: string;
  voice?: string | null;
  profile?: string | null;
  locale?: string | null;
  voice_playback_kind?: "tool_receipt" | "translation_relay" | "narrator_read" | "panel_narration" | null;
  requested_backend_provider?: string | null;
  turn_id?: string | null;
  thread_id?: string | null;
  source_observation_ref?: string | null;
  assistant_answer: false;
  terminal_eligible: false;
};

export type HelixTextToSpeechReceipt = {
  schema: typeof HELIX_TEXT_TO_SPEECH_RECEIPT_SCHEMA;
  receipt_ref: string;
  request_ref: string;
  lane_id: "text_to_speech";
  tool: "text_to_speech.speak_text";
  capability: "text_to_speech.speak_text";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  requested_backend_provider: string | null;
  selected_backend_provider: string | null;
  selection_reason: string;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  utterance_id: string | null;
  playback_status: HelixTextToSpeechPlaybackStatus;
  provider_playback_status: string;
  audio_ref: string | null;
  playback_request_ref: string | null;
  client_playback_receipt_ref: string | null;
  audio_bytes_observed: boolean;
  playback_started: boolean;
  playback_completed: boolean;
  playback_failed: boolean;
  delivered_utterance_id: string | null;
  client_playback_receipt_status: string | null;
  playback_requested_at_ms: number | null;
  playback_confirmed_at_ms: number | null;
  delivered_at_ms: number | null;
  playback_error: string | null;
  source_text_hash: string;
  source_text_char_count: number;
  voice_profile: string | null;
  locale: string | null;
  source_observation_ref: string | null;
  backend_receipt_ref: string;
  backend_request_ref: string;
  backend_provider: string | null;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixTextToSpeechOneShotResult = {
  schema: typeof HELIX_TEXT_TO_SPEECH_ONE_SHOT_RESULT_SCHEMA;
  ok: boolean;
  lane_id: "text_to_speech";
  capability: "text_to_speech.speak_text";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  receipt: HelixTextToSpeechReceipt | null;
  observation: HelixTextToSpeechReceipt | null;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  voice_playback_receipt_barrier?: unknown;
  error?: string;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};
