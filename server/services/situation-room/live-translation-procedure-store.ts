import crypto from "node:crypto";
import {
  HELIX_LIVE_TRANSLATION_PROCEDURE_SCHEMA,
  HELIX_TRANSLATION_OBSERVATION_SCHEMA,
  type HelixLiveTranslationProcedure,
  type HelixLiveTranslationSourceBinding,
  type HelixTranslationObservation,
  type HelixTranslationVoiceRelayGate,
} from "@shared/helix-live-translation-procedure";
import { buildHelixEvidenceObservation } from "@shared/helix-evidence-observation";
import type { HelixVoiceOutputDecision } from "@shared/helix-voice-output-decision";

const procedures = new Map<string, HelixLiveTranslationProcedure>();
const observations: HelixTranslationObservation[] = [];

const shortHash = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const nowIso = (): string => new Date().toISOString();

const clampConfidence = (value: number | null | undefined): number => {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, Number(value)));
};

export function createLiveTranslationProcedure(input: {
  thread_id: string;
  room_id: string;
  source_bindings: HelixLiveTranslationSourceBinding[];
  render_text?: boolean;
  speak_translation?: boolean;
  voice_profile?: string | null;
  require_confirm_for_unknown_speaker?: boolean;
  suppress_overlap?: boolean;
  evidence_refs?: string[];
  now?: string;
}): HelixLiveTranslationProcedure {
  const now = input.now ?? nowIso();
  const procedure: HelixLiveTranslationProcedure = {
    schema: HELIX_LIVE_TRANSLATION_PROCEDURE_SCHEMA,
    procedure_id: `translation_procedure:${shortHash([
      input.thread_id,
      input.room_id,
      input.source_bindings,
      now,
    ], 18)}`,
    thread_id: input.thread_id,
    room_id: input.room_id,
    status: "active",
    source_bindings: input.source_bindings,
    output_policy: {
      render_text: input.render_text ?? true,
      speak_translation: input.speak_translation ?? false,
      voice_profile: input.voice_profile ?? null,
      require_confirm_for_unknown_speaker:
        input.require_confirm_for_unknown_speaker ?? true,
      suppress_overlap: input.suppress_overlap ?? true,
    },
    evidence_refs: input.evidence_refs?.length
      ? input.evidence_refs
      : [`translation_setup:${shortHash([input.thread_id, now], 10)}`],
    created_at: now,
    updated_at: now,
    context_policy: "compact_context_pack_only",
    assistant_answer: false,
    raw_audio_included: false,
    raw_transcript_included: false,
  };
  procedures.set(procedure.procedure_id, procedure);
  return procedure;
}

export function recordTranslationObservation(input: {
  procedure_id: string;
  source_id: string;
  speaker_id: string;
  source_language: string;
  target_language: string;
  source_text: string;
  translated_text: string;
  transcript_confidence?: number | null;
  language_confidence?: number | null;
  speaker_confidence?: number | null;
  translation_confidence?: number | null;
  dispatch_state?: HelixTranslationObservation["dispatch_state"];
  evidence_refs?: string[];
  now?: string;
}): HelixTranslationObservation {
  const procedure = procedures.get(input.procedure_id);
  if (!procedure) {
    throw new Error("translation_procedure_not_found");
  }
  const now = input.now ?? nowIso();
  const evidenceRefs = input.evidence_refs?.length
    ? input.evidence_refs
    : [`translation_observation:${shortHash([input.procedure_id, input.source_id, now], 10)}`];
  const observationId = `translation_obs:${shortHash([
    input.procedure_id,
    input.source_id,
    input.speaker_id,
    input.source_text,
    input.translated_text,
    now,
  ], 18)}`;
  const sourceBinding =
    procedure.source_bindings.find((binding: HelixLiveTranslationSourceBinding) =>
      binding.source_id === input.source_id && binding.speaker_id === input.speaker_id
    ) ?? null;
  const observation: HelixTranslationObservation = {
    schema: HELIX_TRANSLATION_OBSERVATION_SCHEMA,
    observation_id: observationId,
    procedure_id: input.procedure_id,
    thread_id: procedure.thread_id,
    source_id: input.source_id,
    speaker_id: input.speaker_id,
    source_language: input.source_language,
    target_language: input.target_language,
    speaker_role: sourceBinding?.role ?? "unknown",
    speaker_authority: sourceBinding?.authority ?? "transcribe_only",
    consent_state: sourceBinding?.consent_state ?? "requested",
    source_text: input.source_text,
    translated_text: input.translated_text,
    transcript_confidence: clampConfidence(input.transcript_confidence),
    language_confidence: clampConfidence(input.language_confidence),
    speaker_confidence: clampConfidence(input.speaker_confidence),
    translation_confidence: clampConfidence(input.translation_confidence),
    dispatch_state: input.dispatch_state ?? "confirm",
    evidence_observation: buildHelixEvidenceObservation({
      id: observationId,
      lane: "translation_procedure",
      source_kind: "live_translation",
      source_id: `${input.source_id}:${input.speaker_id}`,
      observed_at: now,
      provenance: "inferred",
      confidence: clampConfidence(input.translation_confidence),
      refs: evidenceRefs,
      content_role: "observation_not_assistant_answer",
      consent_state: sourceBinding?.consent_state ?? "requested",
      term: input.source_language,
      query: input.target_language,
    }),
    evidence_refs: evidenceRefs,
    content_role: "observation_not_assistant_answer",
    context_policy: "compact_context_pack_only",
    assistant_answer: false,
    raw_audio_included: false,
    raw_transcript_included: false,
  };
  observations.push(observation);
  procedures.set(input.procedure_id, {
    ...procedure,
    updated_at: now,
    evidence_refs: Array.from(new Set([...procedure.evidence_refs, observationId])),
  });
  return observation;
}

export function getLiveTranslationProcedure(
  procedureId: string,
): HelixLiveTranslationProcedure | null {
  return procedures.get(procedureId) ?? null;
}

export function listTranslationObservations(
  procedureId?: string | null,
): HelixTranslationObservation[] {
  return observations.filter(
    (observation: HelixTranslationObservation) =>
      !procedureId || observation.procedure_id === procedureId,
  );
}

export function evaluateTranslationVoiceRelayGate(input: {
  procedure: HelixLiveTranslationProcedure;
  observation: HelixTranslationObservation;
  outputDecision: HelixVoiceOutputDecision;
}): HelixTranslationVoiceRelayGate {
  const reason: HelixTranslationVoiceRelayGate["reason"] =
    !input.procedure.output_policy.speak_translation
      ? "procedure_voice_disabled"
      : !input.outputDecision.speakable
        ? "voice_output_not_speakable"
        : input.observation.dispatch_state === "blocked"
          ? "translation_blocked"
          : input.observation.speaker_authority === "ignored"
            ? "speaker_not_authorized"
            : "allowed";
  return {
    schema: "helix.translation_voice_relay_gate.v1",
    procedure_id: input.procedure.procedure_id,
    observation_id: input.observation.observation_id,
    allowed: reason === "allowed",
    reason,
    assistant_answer: false,
    raw_audio_included: false,
    raw_transcript_included: false,
  };
}

export function resetLiveTranslationProcedures(): void {
  procedures.clear();
  observations.length = 0;
}
