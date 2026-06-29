import type { RecordLike } from "./core";

export const buildGoldenPathPromptCivilizationBoundsToolResult = (promptText: string): RecordLike => ({
  roadmap: {
    roadmapId: "civilization-bounds:prompt-produced",
    title: "Prompt-produced Civilization Bounds Roadmap",
    systems: [
      {
        id: "claim_boundary",
        label: "Claim boundary",
        summary: "Keep the answer diagnostic unless retrieved evidence proves a stronger claim.",
      },
      {
        id: "capacity_budget",
        label: "Capacity and energy budget",
        summary: "Quantified loads, power, scale, and material constraints bound any actionable interpretation.",
      },
      {
        id: "review_gate",
        label: "Review gate",
        summary: "Separate source-backed statements from speculation, feasibility, policy, or implementation claims.",
      },
    ],
    badges: [
      { id: "diagnostic_only", label: "Diagnostic only" },
      { id: "source_bounded", label: "Source bounded" },
      { id: "no_viability_claim", label: "No viability claim" },
    ],
    collaborationBounds: [
      "Use retrieved document/tool observations as support refs.",
      "Treat reflection as claim-boundary guidance, not as proof.",
      "Only compute scalar quantities that appear in evidence or explicit calculator args.",
    ],
    missingEvidence: [
      "independent engineering validation",
      "provider-backed scholarly corroboration",
      "explicit material and power budget measurements",
    ],
    prompt_text: promptText,
  },
  bridgeContext: {
    source: "prompt_produced_golden_path_bounds",
    confidence: "low",
    terminal_eligible: false,
  },
});
