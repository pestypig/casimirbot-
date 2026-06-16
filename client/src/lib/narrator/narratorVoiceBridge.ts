import type { VoiceSpeakPayload } from "@/lib/agi/api";
import type { NarratorEventV1 } from "@shared/contracts/narrator-event.v1";

export type NarratorVoiceChunkKind = "final" | "tool_receipt" | "narrator_read" | "panel_narration";

export function narratorVoiceChunkKind(event: NarratorEventV1): NarratorVoiceChunkKind {
  if (event.sourceKind === "final_answer") return "final";
  if (event.sourceKind === "workstation_panel" || event.sourceKind === "hover_focus_inspector") return "panel_narration";
  return "narrator_read";
}

function narratorCertaintyToVoiceCertainty(
  certainty: NarratorEventV1["certainty"],
): NonNullable<VoiceSpeakPayload["textCertainty"]> {
  if (certainty === "high") return "confirmed";
  if (certainty === "medium") return "reasoned";
  if (certainty === "low") return "hypothesis";
  return "unknown";
}

export function buildNarratorVoiceSpeakPayload(input: {
  event: NarratorEventV1;
  text?: string;
  voiceProfileId?: string | null;
}): VoiceSpeakPayload {
  const chunkKind = narratorVoiceChunkKind(input.event);
  const voiceCertainty = narratorCertaintyToVoiceCertainty(input.event.certainty);
  return {
    text: input.text ?? input.event.text,
    mode: chunkKind === "final" ? "briefing" : "callout",
    priority: input.event.sourceKind === "final_answer" ? "info" : "info",
    voice_profile_id: input.voiceProfileId ?? undefined,
    traceId: input.event.traceId ?? input.event.turnKey ?? input.event.eventId,
    eventId: input.event.eventId,
    utteranceId: `narrator:${input.event.eventId}`,
    chunkIndex: 0,
    chunkCount: 1,
    chunkKind,
    turnKey: input.event.turnKey,
    evidenceRefs: input.event.evidenceRefs,
    dedupe_key: input.event.dedupeKey,
    repoAttributed: false,
    deterministic: true,
    textCertainty: voiceCertainty,
    voiceCertainty,
  };
}
