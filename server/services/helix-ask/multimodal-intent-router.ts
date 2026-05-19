import type { HelixMultimodalTurnContext } from "@shared/helix-multimodal-turn-context";
import { getUserTextFromTurnInputItems, getVisualEvidenceSummaryFromTurnInputItems } from "./turn-input-item-normalizer";

export type HelixMultimodalIntentRoute = {
  route: "multimodal_visual_answer" | "multimodal_visual_doc_compare" | "none";
  selected_evidence_refs: string[];
  visual_summary: string | null;
  docs_route_allowed: boolean;
};

export const isExplicitVisualEpochDeltaPrompt = (promptText: string): boolean =>
  /\b(?:what\s+changed|changed\s+since|compare(?:d)?\b[\s\S]{0,100}\b(?:previous|prior|last)\s+(?:one|scene|frame|visual|screen|capture|epoch)|(?:different|difference)\b[\s\S]{0,100}\b(?:previous|prior|last)\s+(?:one|scene|frame|visual|screen|capture|epoch)|previous\s+(?:one|scene|frame|visual|screen|capture|epoch)|prior\s+(?:one|scene|frame|visual|screen|capture|epoch)|since\s+(?:the\s+)?(?:previous|prior|last)\s+(?:one|scene|frame|visual|screen|capture|epoch)|scene\s+epoch|visual\s+epoch)\b/i
    .test(promptText);

export function routeHelixMultimodalIntent(context: HelixMultimodalTurnContext): HelixMultimodalIntentRoute {
  const userText = getUserTextFromTurnInputItems(context.turn_input_items);
  const hasVisualEvidence = context.visual_evidence_refs.length > 0;
  const asksAboutVisual =
    /\b(?:attached|upload(?:ed)?|image|picture|photo|screenshot|visual|frame|what\s+(?:do\s+you\s+)?see|describe)\b/i
      .test(userText);
  const asksForLiveOrchestration =
    /\b(?:set\s*up|setup|start|create|configure|prepare|enable)\b[\s\S]*\b(?:live\s+answer|live\s+environment|minecraft\s+cortana|cortana\s+mode|live\s+source|source\s+fidelity|line\s+checks?)\b/i
      .test(userText) ||
    /\b(?:live\s+answer|live\s+environment|minecraft\s+cortana|cortana\s+mode)\b[\s\S]*\b(?:visual(?:\s+capture)?|source|fidelity|line\s+checks?|describe)\b/i
      .test(userText);
  const asksForDocumentCompare =
    /\b(?:compare|contrast|check|match|against)\b[\s\S]*\b(?:doc|document|whitepaper|paper|viewer|open file|current file)\b/i
      .test(userText);
  const visualSummary = getVisualEvidenceSummaryFromTurnInputItems(context.turn_input_items);
  if (!hasVisualEvidence || !asksAboutVisual || asksForLiveOrchestration || isExplicitVisualEpochDeltaPrompt(userText)) {
    return { route: "none", selected_evidence_refs: [], visual_summary: null, docs_route_allowed: true };
  }
  if (asksForDocumentCompare) {
    return {
      route: "multimodal_visual_doc_compare",
      selected_evidence_refs: context.visual_evidence_refs,
      visual_summary: visualSummary,
      docs_route_allowed: true,
    };
  }
  return {
    route: "multimodal_visual_answer",
    selected_evidence_refs: context.visual_evidence_refs,
    visual_summary: visualSummary,
    docs_route_allowed: false,
  };
}
