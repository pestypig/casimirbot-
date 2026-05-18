import {
  buildHelixEvidenceObservation,
  type HelixEvidenceObservationConsentState,
} from "@shared/helix-evidence-observation";
import type {
  HelixVoiceLaneEvent,
  HelixVoiceSourceObservation,
  HelixVoiceSourceSurface,
} from "@shared/helix-voice-lane-event";
import type { HelixConversationModeClassification } from "@shared/helix-conversation-mode";

const normalizeSurface = (
  value: HelixVoiceLaneEvent["source_surface"],
): HelixVoiceSourceSurface => {
  if (
    value === "room_mic" ||
    value === "discord_user_stream" ||
    value === "discord_mixed_stream" ||
    value === "browser_tab_audio" ||
    value === "system_loopback" ||
    value === "display_audio" ||
    value === "elevenlabs_output_receipt" ||
    value === "translation_job"
  ) {
    return value;
  }
  return "unknown";
};

const normalizeConsent = (
  value: HelixVoiceLaneEvent["consent_state"],
): HelixEvidenceObservationConsentState =>
  value === "requested" || value === "granted" || value === "revoked"
    ? value
    : "not_required";

export function buildHelixVoiceSourceObservation(input: {
  event: HelixVoiceLaneEvent;
  classification: HelixConversationModeClassification;
}): HelixVoiceSourceObservation {
  const { event, classification } = input;
  const sourceSurface = normalizeSurface(event.source_surface);
  const consentState = normalizeConsent(event.consent_state);
  const evidenceRefs = event.evidence_refs?.length
    ? event.evidence_refs
    : [event.voice_event_id];
  const evidenceObservation = buildHelixEvidenceObservation({
    id: `voice_obs:${event.voice_event_id.replace(/^voice_event:/, "")}`,
    lane: "voice_lane",
    source_kind: "live_voice_speaker",
    source_id: event.speaker_id
      ? `${event.source_id}:${event.speaker_id}`
      : event.source_id,
    observed_at: event.ts,
    provenance: sourceSurface === "unknown" ? "inferred" : "measured",
    confidence: Math.min(
      1,
      Math.max(0, event.confidence ?? classification.confidence ?? 0.5),
    ),
    refs: evidenceRefs,
    content_role: "observation_not_assistant_answer",
    consent_state: consentState,
    term: classification.transcript_kind,
    query: sourceSurface,
  });

  return {
    schema: "helix.voice_source_observation.v1",
    voice_event_id: event.voice_event_id,
    thread_id: event.thread_id,
    source_id: event.source_id,
    source_surface: sourceSurface,
    room_id: event.room_id ?? null,
    speaker_id: event.speaker_id ?? null,
    diarization_speaker_id: event.diarization_speaker_id ?? null,
    speaker_role: event.speaker_role ?? null,
    speaker_authority: classification.speaker_authority,
    transcript_kind: classification.transcript_kind,
    conversation_mode: classification.conversation_mode,
    transcript_final: event.transcript_is_final,
    transcript_confidence: event.confidence ?? null,
    speaker_confidence: event.speaker_confidence ?? null,
    overlap: event.overlap === true,
    language: event.language ?? null,
    consent_state: consentState,
    evidence_observation: evidenceObservation,
    evidence_refs: evidenceRefs,
    content_role: "observation_not_assistant_answer",
    assistant_answer: false,
    raw_audio_included: false,
    raw_transcript_included: false,
    context_policy: "compact_context_pack_only",
  };
}
