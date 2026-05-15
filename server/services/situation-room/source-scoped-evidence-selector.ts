import type { HelixInterpretedEvent } from "@shared/helix-interpreted-event-log";
import type { HelixSituationSourceCapability } from "@shared/helix-situation-source-capability";

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const hasFreshModality = (
  capabilities: HelixSituationSourceCapability[],
  modality: HelixSituationSourceCapability["modality"],
): boolean =>
  capabilities.some((entry) => entry.modality === modality && entry.status === "active");

const isWorldEvent = (event: HelixInterpretedEvent): boolean => {
  const text = lower(`${event.source_family} ${event.kind} ${event.title} ${event.summary} ${(event.evidence_refs ?? []).join(" ")}`);
  return /\b(?:minecraft|world_event|world event|world-sense|hostile|damage|creeper|zombie|slab|block)\b/.test(text);
};

const isVisualEvent = (event: HelixInterpretedEvent): boolean => {
  const text = lower(`${event.source_family} ${event.kind} ${event.title} ${event.summary} ${(event.evidence_refs ?? []).join(" ")}`);
  return /\b(?:visual|frame|screen|image|screenshot|visual_evidence)\b/.test(text);
};

const isTranscriptEvent = (event: HelixInterpretedEvent): boolean => {
  const text = lower(`${event.source_family} ${event.kind} ${event.title} ${event.summary} ${(event.evidence_refs ?? []).join(" ")}`);
  return /\b(?:audio|voice|transcript|discord|speaker)\b/.test(text);
};

export function selectSourceScopedEvidence(input: {
  interpretedEvents: HelixInterpretedEvent[];
  capabilities: HelixSituationSourceCapability[];
}): HelixInterpretedEvent[] {
  const worldActive = hasFreshModality(input.capabilities, "world_event");
  const visualActive = hasFreshModality(input.capabilities, "visual_frame");
  const transcriptActive = hasFreshModality(input.capabilities, "audio_transcript");
  return input.interpretedEvents.filter((event) => {
    if (isWorldEvent(event) && !worldActive) return false;
    if (isVisualEvent(event) && !visualActive) return false;
    if (isTranscriptEvent(event) && !transcriptActive) return false;
    return true;
  });
}
