export type LiveSourcePipelineIntentKind =
  | "minecraft_cortana"
  | "moral_transcript"
  | "equation_stream"
  | "document_math"
  | "generic_visual"
  | "generic_live_source";

export function isLiveSourcePipelineIntent(prompt: string): boolean {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return false;
  return /\b(?:live\s+source|live\s+answer|pipeline|watch|track|monitor|cortana|screen\s+capture|screen|tab\s+transcript|equation\s+stream|verify\s+equations)\b/.test(normalized);
}

export function classifyLiveSourcePipelineIntent(prompt: string): LiveSourcePipelineIntentKind {
  const normalized = prompt.trim().toLowerCase();
  if (/\b(?:minecraft|minehut|gameplay|cortana)\b/.test(normalized)) return "minecraft_cortana";
  if (/\b(?:moral|transcript|tab\s+audio|conversation|dialogue)\b/.test(normalized)) return "moral_transcript";
  if (/\b(?:equation\s+stream|live\s+calculation|stability|residual|simulation)\b/.test(normalized)) return "equation_stream";
  if (/\b(?:document|paper|equations?|verify\s+math|check\s+math)\b/.test(normalized)) return "document_math";
  if (/\b(?:screen|visual|window|tab|capture)\b/.test(normalized)) return "generic_visual";
  return "generic_live_source";
}
