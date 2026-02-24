import type { SuppressionReason } from "./helix-dottie-callout-contract";

export type EligibilityInput = {
  contextTier?: "tier0" | "tier1";
  sessionState?: "idle" | "requesting" | "active" | "stopping" | "error";
  voiceMode?: "off" | "critical_only" | "normal" | "dnd";
  classification: "info" | "warn" | "critical" | "action";
  isUserTyping?: boolean;
  muteWhileTyping?: boolean;
};

export type EligibilityDecision = {
  emitText: boolean;
  emitVoice: boolean;
  suppressionReason: SuppressionReason | "context_ineligible" | null;
  cooldownMs: number;
};

export const evaluateCalloutEligibility = (input: EligibilityInput): EligibilityDecision => {
  const cooldownMs = input.classification === "info" ? 60_000 : input.classification === "warn" ? 30_000 : input.classification === "critical" ? 10_000 : 5_000;
  const typingSuppressed = Boolean(input.muteWhileTyping && input.isUserTyping);
  if (typingSuppressed) return { emitText: false, emitVoice: false, suppressionReason: "context_ineligible", cooldownMs };
  if (input.contextTier === "tier0") return { emitText: false, emitVoice: false, suppressionReason: "context_ineligible", cooldownMs };
  if (input.sessionState && input.sessionState !== "active") return { emitText: false, emitVoice: false, suppressionReason: "context_ineligible", cooldownMs };
  if (input.voiceMode === "off" || input.voiceMode === "dnd") return { emitText: true, emitVoice: false, suppressionReason: "context_ineligible", cooldownMs };
  if (input.voiceMode === "critical_only" && input.classification !== "critical" && input.classification !== "action") {
    return { emitText: true, emitVoice: false, suppressionReason: "context_ineligible", cooldownMs };
  }
  return { emitText: true, emitVoice: true, suppressionReason: null, cooldownMs };
};
