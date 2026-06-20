import { contextualToolSuppressionBlocksFamily, detectContextualToolAdmissionSuppression } from "./contextual-tool-admission";

export const HELIX_THEORY_FRONTIER_VECTOR_FIELD_TRACE_CAPABILITY =
  "helix.theory.frontierVectorFieldTrace" as const;

const STAGE_PLAY_RE =
  /\b(?:stage\s*play|stage_play|live_env\.reflect_stage_play_context|reflect_stage_play_context|live\s+interpretation|stage\s*play\s+badge\s+graph)\b/i;

const FRONTIER_VECTOR_FIELD_CUE_RE =
  /\b(?:helix\.theory\.frontierVectorFieldTrace|frontierVectorFieldTrace|theory\s+frontier\s+vector\s+field|frontier\s+vector\s+field|badge\s+coordinate\s+vectors?|coordinate\s+vectors?\s+(?:for|between|over)\s+badges?|relation\s+tensors?|dimensional\s+connections?|evidence\s+gaps?|candidate\s+badge\s+connections?|parameteri[sz]ed\s+frontier\s+research|theory\s+frontiers?|frontier\s+candidate|missing\s+intermediate\s+badges?)\b/i;

const FRONTIER_VECTOR_FIELD_INQUIRY_RE =
  /\b(?:trace|inspect|map|find|locate|parameteri[sz]e|evaluate|compare|show|use|run|call|build)\b[\s\S]{0,140}\b(?:frontier\s+vector\s+field|badge\s+coordinate\s+vectors?|relation\s+tensors?|dimensional\s+connections?|evidence\s+gaps?|candidate\s+badge\s+connections?|theory\s+frontiers?|frontier\s+candidate)\b|\b(?:what|where|why|how)\b[\s\S]{0,140}\b(?:between\s+(?:these\s+)?badges?|badges?\s+near\s+each\s+other|frontier\s+region|relation\s+tensors?|badge\s+coordinate\s+vectors?|dimensional\s+connections?|evidence\s+gaps?)\b/i;

const CONTEXTUAL_FRONTIER_REFERENCE_RE =
  /\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no\s+need\s+to|no)\b[^.!?;\n]{0,180}\b(?:helix\.theory\.frontierVectorFieldTrace|frontierVectorFieldTrace|frontier\s+vector\s+field|badge\s+coordinate\s+vectors?|relation\s+tensors?|dimensional\s+connections?|evidence\s+gaps?|candidate\s+badge\s+connections?|theory\s+frontiers?)\b|\b(?:if|when|before|after|would|could|might|hypothetically|later|next\s+time|in\s+the\s+future)\b[^.!?;\n]{0,180}\b(?:run|call|use|trace|inspect|map|find|locate|parameteri[sz]e)?[^.!?;\n]{0,120}\b(?:helix\.theory\.frontierVectorFieldTrace|frontierVectorFieldTrace|frontier\s+vector\s+field|badge\s+coordinate\s+vectors?|relation\s+tensors?|dimensional\s+connections?|evidence\s+gaps?|candidate\s+badge\s+connections?)\b|\b(?:earlier|previously|last\s+turn|historically|already)\b[^.!?;\n]{0,180}\b(?:ran|used|called|traced|inspected|mapped|discussed)?[^.!?;\n]{0,120}\b(?:helix\.theory\.frontierVectorFieldTrace|frontierVectorFieldTrace|frontier\s+vector\s+field|badge\s+coordinate\s+vectors?|relation\s+tensors?|dimensional\s+connections?|evidence\s+gaps?|candidate\s+badge\s+connections?)\b|\b(?:screen|visible|label|button|quoted?|quote|phrase|text)\b[^.!?;\n]{0,180}\b(?:helix\.theory\.frontierVectorFieldTrace|frontierVectorFieldTrace|frontier\s+vector\s+field|badge\s+coordinate\s+vectors?|relation\s+tensors?|dimensional\s+connections?|evidence\s+gaps?|candidate\s+badge\s+connections?)\b/i;

const QUOTED_FRONTIER_REFERENCE_RE =
  /["'`][^"'`]*(?:helix\.theory\.frontierVectorFieldTrace|frontierVectorFieldTrace|frontier\s+vector\s+field|badge\s+coordinate\s+vectors?|relation\s+tensors?|dimensional\s+connections?|evidence\s+gaps?|candidate\s+badge\s+connections?)[^"'`]*["'`]/i;

export function isTheoryFrontierVectorFieldTracePrompt(promptText: string): boolean {
  const prompt = promptText.trim();
  if (!prompt || STAGE_PLAY_RE.test(prompt)) return false;
  const suppression = detectContextualToolAdmissionSuppression(prompt);
  if (contextualToolSuppressionBlocksFamily(suppression, "theory_locator")) return false;
  if (CONTEXTUAL_FRONTIER_REFERENCE_RE.test(prompt)) return false;
  if (QUOTED_FRONTIER_REFERENCE_RE.test(prompt) && !/\b(?:run|call|use|trace|inspect|map|find|locate)\b/i.test(prompt)) {
    return false;
  }
  return FRONTIER_VECTOR_FIELD_INQUIRY_RE.test(prompt) || FRONTIER_VECTOR_FIELD_CUE_RE.test(prompt);
}
