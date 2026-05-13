import crypto from "node:crypto";
import type {
  HelixCompanionPolicy,
  HelixConversationMode,
  HelixConversationModeClassification,
  HelixVoiceTranscriptKind,
} from "@shared/helix-conversation-mode";
import type { HelixVoiceLaneEvent } from "@shared/helix-voice-lane-event";

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const commandPattern =
  /\b(?:open|start|stop|pause|resume|create|set up|enable|disable|show|switch|attach|run)\b/i;
const companionPattern =
  /\b(?:keep me company|talk me through|watch my run|watch this|stay with me|companion|dottie mode|cortana mode)\b/i;

export function classifyVoiceLaneEvent(input: {
  event: HelixVoiceLaneEvent;
  policy: HelixCompanionPolicy;
  speaker_authority?: HelixConversationModeClassification["speaker_authority"];
}): HelixConversationModeClassification {
  const text = input.event.transcript.trim();
  const normalized = text.toLowerCase();
  const addressedName = input.policy.direct_address_names.find((name: string) =>
    normalized.startsWith(`${name},`) ||
    normalized.startsWith(`${name} `) ||
    normalized.includes(`hey ${name}`) ||
    normalized.includes(`ok ${name}`) ||
    normalized.includes(`okay ${name}`),
  );
  const directAddressed = Boolean(addressedName);
  const commandCandidate = commandPattern.test(text);
  const activeCompanionRequested = companionPattern.test(text);
  const transcriptKind: HelixVoiceTranscriptKind = directAddressed
    ? commandCandidate
      ? "command_candidate"
      : "direct_address"
    : activeCompanionRequested
      ? "direct_address"
      : "ambient";
  const conversationMode: HelixConversationMode = directAddressed
    ? commandCandidate
      ? "command_mode"
      : "direct_address"
    : activeCompanionRequested
      ? "active_companion"
      : "ambient_listening";
  const reason = directAddressed
    ? `Transcript addressed ${addressedName ?? "the assistant"}.`
    : activeCompanionRequested
      ? "Transcript requested active companion behavior."
      : "Transcript treated as ambient context.";
  return {
    schema: "helix.conversation_mode_classification.v1",
    classification_id: `voice_mode:${hashShort([input.event.voice_event_id, conversationMode, transcriptKind], 18)}`,
    thread_id: input.event.thread_id,
    source_id: input.event.source_id,
    transcript_kind: transcriptKind,
    conversation_mode: conversationMode,
    direct_addressed: directAddressed,
    command_candidate: commandCandidate,
    active_companion_requested: activeCompanionRequested,
    speaker_authority: input.speaker_authority ?? (directAddressed ? "authorized_user" : "ambient"),
    confidence: directAddressed || activeCompanionRequested ? 0.86 : 0.72,
    reason,
    evidence_refs: input.event.evidence_refs,
    model_invoked: false,
    deterministic: true,
    context_policy: "compact_context_pack_only",
    raw_audio_included: false,
    raw_transcript_included: false,
    ts: input.event.ts,
  };
}
