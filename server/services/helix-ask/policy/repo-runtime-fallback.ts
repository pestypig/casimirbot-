export const selectDeterministicRepoRuntimeFallbackCandidate = (args: {
  promptFamily?: string | null;
  familyFallback?: string | null;
  baseFallback?: string | null;
}): string | null => {
  const familyFallback =
    typeof args.familyFallback === "string" ? args.familyFallback.trim() : "";
  if (familyFallback) return familyFallback;
  const family = (args.promptFamily ?? "").trim();
  if (family === "definition_overview") {
    return null;
  }
  const baseFallback =
    typeof args.baseFallback === "string" ? args.baseFallback.trim() : "";
  return baseFallback || null;
};

export const shouldDirectUseDeterministicRepoRuntimeFallback = (args: {
  fallbackText?: string | null;
  promptFamily?: string | null;
  repoGrounded: boolean;
  relationIntentActive: boolean;
  forceLlmProbe: boolean;
  compositeEnabled: boolean;
}): boolean => {
  if (!args.repoGrounded) return false;
  if (args.relationIntentActive) return false;
  if (args.forceLlmProbe) return false;
  if (args.compositeEnabled) return false;
  const fallbackText =
    typeof args.fallbackText === "string" ? args.fallbackText.trim() : "";
  if (!fallbackText) return false;
  const family = (args.promptFamily ?? "").trim();
  if (family === "definition_overview") {
    return true;
  }
  if (family === "implementation_code_path") {
    return /^Where in repo:/im.test(fallbackText) && /^Call chain:/im.test(fallbackText) && /^Sources:/im.test(fallbackText);
  }
  if (family === "roadmap_planning") {
    return (
      /^Repo-Grounded Findings:/im.test(fallbackText) &&
      /^Implementation Roadmap:/im.test(fallbackText) &&
      /^Evidence Gaps:/im.test(fallbackText) &&
      /^Next Anchors Needed:/im.test(fallbackText) &&
      /^Sources:/im.test(fallbackText)
    );
  }
  if (family === "troubleshooting_diagnosis") {
    return (
      /^Symptoms:/im.test(fallbackText) &&
      /^Most likely causes:/im.test(fallbackText) &&
      /^Fixes:/im.test(fallbackText) &&
      /^Sources:/im.test(fallbackText)
    );
  }
  if (family === "recommendation_decision") {
    return (
      /^Decision:/im.test(fallbackText) &&
      /^Rationale:/im.test(fallbackText) &&
      /^Constraints:/im.test(fallbackText) &&
      /^Risks:/im.test(fallbackText) &&
      /^Sources:/im.test(fallbackText)
    );
  }
  return false;
};

const hasHelixAskFiveSectionShape = (text: string): boolean => {
  const normalized = text.toLowerCase();
  const required = [
    "short answer:",
    "conceptual baseline:",
    "how repo solves it:",
    "evidence + proof anchors:",
    "uncertainty / open gaps:",
  ];
  return required.every((heading) => normalized.includes(heading));
};

const hasHelixAskFamilyFallbackShape = (text: string): boolean => {
  const normalized = text.toLowerCase();
  const familyShapes = [
    ["where in repo:", "call chain:", "sources:"],
    ["mechanism explanation:", "inputs/outputs:", "sources:"],
    ["definition:", "repo anchors:", "sources:"],
    ["repo-grounded findings:", "implementation roadmap:", "sources:"],
  ];
  return familyShapes.some((shape) => shape.every((heading) => normalized.includes(heading)));
};

export const hasAcceptedHelixAskRepoFallbackShape = (text: string): boolean =>
  hasHelixAskFiveSectionShape(text) || hasHelixAskFamilyFallbackShape(text);
