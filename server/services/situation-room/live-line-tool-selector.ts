import type { HelixLiveCardLineReasoningModalityScope } from "@shared/helix-live-card-line-reasoning";

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

export function selectLiveLineTool(input: {
  modalityScope: HelixLiveCardLineReasoningModalityScope;
  lineKey: string;
  lineLabel?: string | null;
  value?: string | null;
  worldFresh?: boolean;
}): string | null {
  const key = lower(input.lineKey);
  const text = lower(`${input.lineKey} ${input.lineLabel ?? ""} ${input.value ?? ""}`);
  if (input.modalityScope === "generic_visual") {
    if (key === "activity") return "live-cognition.synthesize_line_from_observations";
    if (key === "objects" || key === "scene") return "visual.latest_observation";
    if (key === "evidence") return "observation_journal.latest";
    if (key === "uncertainty") return "interpretation_card.missing_evidence";
    if (key === "next_check") return "visual.compare_recent_frames";
    return "live-cognition.synthesize_line_from_observations";
  }
  if (input.modalityScope === "minecraft_visual" && !input.worldFresh) {
    if (key === "risk") return "visual.latest_observation";
    if (key === "next_check" || key === "missing_evidence") return "visual.capture_now";
    if (key === "place" || key === "activity" || key === "entities" || key === "structure") return "visual.latest_observation";
    return "live-cognition.synthesize_line_from_observations";
  }
  if (input.modalityScope === "minecraft_world" || input.worldFresh) {
    if (key === "rehearsal" || key === "possibilities" || key === "unknowns" || /\b(?:route|path|waypoint|gateway|drift|navigation|baritone|pathmind)\b/.test(text)) {
      return "minecraft.query_navigation_state";
    }
    if (key === "risk" || key === "structure") return "minecraft.query_event_window";
    if (key === "entities") return "minecraft.query_world_sense_window";
    if (/\b(?:semantic|meaning|utility|purpose)\b/.test(text)) return "minecraft.lookup_semantics";
    return "minecraft.query_event_window";
  }
  if (input.modalityScope === "audio_transcript") return "live-cognition.synthesize_line_from_observations";
  if (input.modalityScope === "calculator_stream") return "scientific-calculator.solve_with_steps";
  if (input.modalityScope === "document_context") return "docs-viewer.lookup_reference";
  return null;
}
