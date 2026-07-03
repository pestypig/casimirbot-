import type { HelixAgentRuntimeId } from "./helix-agent-runtime";
import type { HelixAgentStepObservationPacket } from "./helix-agent-step-observation-packet";
import type { HelixCapabilityLaneResolveTrace } from "./helix-capability-lane";

export const HELIX_SPEECH_TO_TEXT_ONE_SHOT_REQUEST_SCHEMA =
  "helix.speech_to_text.one_shot_request.v1" as const;
export const HELIX_SPEECH_TO_TEXT_OBSERVATION_SCHEMA =
  "helix.speech_to_text.observation.v1" as const;
export const HELIX_SPEECH_TO_TEXT_ONE_SHOT_RESULT_SCHEMA =
  "helix.speech_to_text.one_shot_result.v1" as const;

export type HelixSpeechToTextOneShotRequest = {
  schema: typeof HELIX_SPEECH_TO_TEXT_ONE_SHOT_REQUEST_SCHEMA;
  capability: "speech_to_text.transcribe_audio";
  transcript_text?: string | null;
  audio_ref?: string | null;
  audio_hash?: string | null;
  language?: string | null;
  locale?: string | null;
  confidence?: number | null;
  requested_backend_provider?: string | null;
  turn_id?: string | null;
  thread_id?: string | null;
  room_id?: string | null;
  environment_id?: string | null;
  source_id?: string | null;
  capture_session_id?: string | null;
  chunk_id?: string | null;
  chunk_index?: number | null;
  duration_ms?: number | null;
  capture_source?: string | null;
  source_event_ms?: number | null;
  assistant_answer: false;
  terminal_eligible: false;
};

export type HelixSpeechToTextObservation = {
  schema: typeof HELIX_SPEECH_TO_TEXT_OBSERVATION_SCHEMA;
  observation_ref: string;
  lane_id: "speech_to_text";
  capability: "speech_to_text.transcribe_audio";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  selected_backend_provider: string | null;
  transcript_hash: string;
  transcript_char_count: number;
  transcript_preview: string;
  audio_ref: string | null;
  audio_hash: string | null;
  language: string | null;
  locale: string | null;
  confidence: number | null;
  thread_id: string;
  room_id: string | null;
  environment_id: string | null;
  source_id: string;
  source_kind: "audio_transcript";
  capture_session_id: string | null;
  chunk_id: string | null;
  chunk_index: number | null;
  duration_ms: number | null;
  capture_source: string | null;
  stage_play_mail_id: string | null;
  stage_play_mail_ref: string | null;
  source_event_ms: number | null;
  observed_at_ms: number;
  evidence_refs: string[];
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
  raw_audio_included: false;
};

export type HelixSpeechToTextOneShotResult = {
  schema: typeof HELIX_SPEECH_TO_TEXT_ONE_SHOT_RESULT_SCHEMA;
  ok: boolean;
  lane_id: "speech_to_text";
  capability: "speech_to_text.transcribe_audio";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  observation: HelixSpeechToTextObservation | null;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  error?: string;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};
