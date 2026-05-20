import type { LiveAnswerLineState } from "@shared/helix-live-answer-environment";
import type { HelixLiveCognitionTool } from "@shared/helix-live-cognition-tool";
import { getLiveCognitionTool } from "./live-cognition-tool-registry";

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const byId = (toolId: string): HelixLiveCognitionTool | null => getLiveCognitionTool(toolId);

export function selectLiveCognitionToolForLine(
  line: Pick<LiveAnswerLineState, "key" | "label" | "value">,
): HelixLiveCognitionTool | null {
  const text = lower(`${line.key} ${line.label} ${line.value}`);
  if (/\b(?:file explorer|folder|directory|document|browser tab|current screen|latest visual observation|visual observation|visible ui|screen contents|compare the next captured frame|content changes)\b/.test(text) &&
    !/\b(?:minecraft|minehut|creeper|zombie|wheat|farm|mob|world-event)\b/.test(text)) {
    if (/\b(?:objects?|scene|visible)\b/.test(text)) return byId("visual.latest_observation");
    if (/\b(?:evidence)\b/.test(text)) return byId("observation_journal.latest");
    if (/\b(?:uncertain|unknown|missing)\b/.test(text)) return byId("interpretation_card.missing_evidence");
    if (/\b(?:next|compare|change)\b/.test(text)) return byId("visual.compare_recent_frames");
    return byId("live-cognition.synthesize_line_from_observations");
  }
  if (/\b(?:equation|calculate|calculator|solve|numeric|residual|function|total|sum)\b/.test(text)) {
    return byId("scientific-calculator.solve_with_steps");
  }
  if (/\b(?:image|visual|screenshot|frame|seen|visible|screen|view|camera)\b/.test(text)) {
    return byId("visual.align_latest_with_event_window");
  }
  if (/\b(?:route|path|waypoint|gateway|end gateway|return home|go home|drift|wrong direction|navigation|rehearsal|baritone|pathmind)\b/.test(text)) {
    return byId("minecraft.query_navigation_state");
  }
  if (/\b(?:threat|risk|danger|hostile|creeper|explosion|damage|lava|bucket|fluid|block|stair|trench|mine)\b/.test(text)) {
    return byId("minecraft.query_event_window");
  }
  if (/\b(?:chicken|cow|zombie|entity|farm|egg|mob|containment|wheat|crop|place)\b/.test(text)) {
    return byId("minecraft.query_world_sense_window");
  }
  if (/\b(?:semantic|affordance|means|meaning|use|utility)\b/.test(text)) {
    return byId("minecraft.lookup_semantics");
  }
  if (/\b(?:paper|document|docs?|reference|citation|whitepaper)\b/.test(text)) {
    return byId("docs-viewer.lookup_reference");
  }
  if (/\b(?:note|archive|store|remember)\b/.test(text)) {
    return byId("workstation-notes.append_to_note");
  }
  if (/\b(?:uncertain|unknown|missing|review|hypothesis|ambiguous|next check)\b/.test(text)) {
    return byId("situation-room.run_agentic_review");
  }
  return null;
}
