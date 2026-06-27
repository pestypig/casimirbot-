import { isSimpleElectronDefinitionPrompt } from "./model-only-rich-concept";

export const classifyAskTurnModelOnlyFallbackId = (transcript: string): string | null => {
  const normalized = transcript.trim().toLowerCase();
  if (
    /\bkinetic\s+energy\b/.test(normalized) &&
    /\bspeed\b/.test(normalized) &&
    /\b(?:did\s+not\s+give|without|missing|underspecified|exact\s+speed|do\s+not\s+invent)\b/.test(normalized)
  ) {
    return "model_only_fallback.underspecified_kinetic_energy";
  }
  if (/\belectron\b/.test(normalized) && /\bproton\b/.test(normalized) && /\bcharg\w*\b/.test(normalized) && /\bmass\b/.test(normalized)) {
    return "model_only_fallback.electron_proton_comparison";
  }
  if (isSimpleElectronDefinitionPrompt(transcript)) {
    return "model_only_fallback.generic_electron";
  }
  if (/\bproper time\b/.test(normalized) && /\bcoordinate time\b/.test(normalized)) {
    return "model_only_fallback.proper_time_coordinate_time";
  }
  if (/\bextrinsic curvature\b/.test(normalized)) {
    return "model_only_fallback.extrinsic_curvature";
  }
  if (/\bdoppler\s+effect\b/.test(normalized)) {
    return "model_only_fallback.doppler_effect";
  }
  if (/\bdocument\s+summary\b/.test(normalized)) {
    return "model_only_fallback.document_summary_definition";
  }
  if (/\bwhat\s+can\s+you\s+help\s+me\s+do\b/.test(normalized) && /\bworkspace\b/.test(normalized)) {
    return "model_only_fallback.workspace_help";
  }
  if (/\bmomentum\b/.test(normalized) && /\bconserv\w*\b/.test(normalized) && /\bisolated\b/.test(normalized)) {
    return "model_only_fallback.momentum_conservation";
  }
  if (
    /\b(?:calculator|tool)\s+receipts?\b/.test(normalized) &&
    /\bobservation(?:s|al)?\b/.test(normalized) &&
    /\bterminal\s+authority\b/.test(normalized)
  ) {
    return "model_only_fallback.receipts_observations_terminal_authority";
  }
  return null;
};
