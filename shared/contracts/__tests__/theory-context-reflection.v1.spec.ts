import { describe, expect, it } from "vitest";
import {
  buildTheoryContextReflectionV1,
  isTheoryContextReflectionV1,
  validateTheoryContextReflectionV1,
  type TheoryContextReflectionV1,
} from "../theory-context-reflection.v1";

function baseReflection(
  overrides: Partial<Parameters<typeof buildTheoryContextReflectionV1>[0]> = {},
): TheoryContextReflectionV1 {
  return buildTheoryContextReflectionV1({
    generatedAt: "2026-05-31T00:00:00.000Z",
    reflectionId: "reflection:test",
    graphId: "nhm2-theory-badge-graph",
    input: {
      prompt: "Locate this discussion near source residual and QEI margin.",
      conversationContext: "The user is discussing NHM2 diagnostic scalar cuts.",
      mentionedEquations: ["qei_margin = qei_bound - qei_sample"],
      mentionedSymbols: ["qei_margin", "R_source"],
      mentionedDomains: ["warp_gr_nhm2", "qei_stress_energy"],
      source: "helix_ask",
      confidenceMode: "soft_locator",
    },
    exactMatches: [
      {
        badgeId: "nhm2.qei.sampling_window",
        title: "QEI badge replay margin",
        score: 90,
        reasons: ["symbol match: qei_margin"],
        matchedSymbols: ["qei_margin"],
        matchedEquationFamilies: ["qei_sampling_window"],
        matchedRepoPaths: ["shared/theory/nhm2-theory-badges.ts"],
        claimBoundaryNotes: ["Diagnostic margin only."],
      },
    ],
    likelyMatches: [
      {
        badgeId: "nhm2.closure.source_residual",
        title: "Source residual",
        score: 72,
        reasons: ["nearby NHM2 source closure context"],
        matchedSymbols: ["R_source"],
        matchedEquationFamilies: ["source_residual"],
        matchedRepoPaths: ["shared/theory/nhm2-theory-badges.ts"],
        claimBoundaryNotes: ["Source residual is diagnostic only."],
      },
    ],
    inferredDomains: [
      {
        atlasBlockId: "warp_gr_nhm2",
        title: "Warp / GR / NHM2",
        score: 84,
        reasons: ["NHM2 badges matched"],
      },
    ],
    overlay: {
      centerBadgeIds: ["nhm2.qei.sampling_window"],
      highlightedBadgeIds: ["nhm2.qei.sampling_window", "nhm2.closure.source_residual"],
      highlightedEdgeIds: [],
      heatByBadgeId: {
        "nhm2.qei.sampling_window": 1,
        "nhm2.closure.source_residual": 0.72,
      },
      exactBadgeIds: ["nhm2.qei.sampling_window"],
      likelyBadgeIds: ["nhm2.closure.source_residual"],
      suggestedBiomeChunkIds: ["7:2"],
      suggestedSemanticChunkIds: ["warp_gr_nhm2:human_engineering:diagnostic:claim_medium"],
      suggestedScaleBands: ["human_engineering"],
      uncertainty: {
        badgeProbabilityById: {
          "nhm2.qei.sampling_window": 0.555556,
          "nhm2.closure.source_residual": 0.444444,
        },
        renderChunkProbabilityById: {
          "7:2": 1,
        },
        semanticChunkProbabilityById: {
          "warp_gr_nhm2:human_engineering:diagnostic:claim_medium": 1,
        },
        priorEntropyBits: 1,
        posteriorEntropyBits: 0.991076,
        informationGainBits: 0.008924,
        normalizedMass: 1,
        uncertaintyMode: "broad",
      },
      softRegion: {
        id: "discussion-zone:test",
        label: "Current discussion zone",
        badgeIds: ["nhm2.qei.sampling_window", "nhm2.closure.source_residual"],
        confidence: 0.78,
        tone: "green",
        meaning: "discussion_context_not_proof",
      },
    },
    evidenceForAsk: {
      summary: "The discussion appears near NHM2 source residual and QEI sampling diagnostics.",
      claimBoundaries: ["Diagnostic-only context."],
      recommendedNextActions: [
        {
          actionId: "theory-badge-graph.build_compound_theory_run",
          label: "Build compound theory run",
          panelId: "theory-badge-graph",
          args: { badge_ids: ["nhm2.qei.sampling_window"] },
          mutatesCalculator: false,
          solves: false,
        },
      ],
    },
    ...overrides,
  });
}

describe("theory context reflection v1", () => {
  it("builds a valid non-terminal reflection receipt", () => {
    const reflection = baseReflection();

    expect(validateTheoryContextReflectionV1(reflection)).toEqual([]);
    expect(isTheoryContextReflectionV1(reflection)).toBe(true);
    expect(reflection.assistant_answer).toBe(false);
    expect(reflection.raw_content_included).toBe(false);
    expect(reflection.terminal_eligible).toBe(false);
    expect(reflection.panel_generated_answer).toBe(false);
    expect(reflection.context_role).toBe("tool_evidence");
    expect(reflection.ask_context_policy).toBe("evidence_only");
    expect(reflection.deterministic_content_role).toBe("observation_not_assistant_answer");
    expect(reflection.scientificMethod.artifactId).toBe("theory_context_scientific_method_reflection");
    expect(reflection.scientificMethod.reflectionId).toBe(reflection.reflectionId);
    expect(reflection.scientificMethod.graphId).toBe(reflection.graphId);
    expect(reflection.scientificMethod.terminal_eligible).toBe(false);
    expect(reflection.scientificMethod.proceduralNextSteps.every((step) => step.solves === false)).toBe(true);
    expect(reflection.overlay.suggestedBiomeChunkIds).toEqual(["7:2"]);
    expect(reflection.overlay.suggestedSemanticChunkIds).toEqual([
      "warp_gr_nhm2:human_engineering:diagnostic:claim_medium",
    ]);
    expect(reflection.overlay.suggestedScaleBands).toEqual(["human_engineering"]);
    expect(reflection.overlay.uncertainty?.normalizedMass).toBe(1);
    expect(reflection.overlay.uncertainty?.posteriorEntropyBits).toBeGreaterThan(0);
    expect(reflection.overlay.uncertainty?.informationGainBits).toBeGreaterThanOrEqual(0);
    expect(reflection.resolution).toEqual(expect.objectContaining({
      mode: "path",
      explanationDepthHint: "path",
    }));
  });

  it("rejects terminal eligible receipts", () => {
    const reflection = {
      ...baseReflection(),
      terminal_eligible: true,
    };

    expect(validateTheoryContextReflectionV1(reflection)).toContain("terminal_eligible must be false");
  });

  it("rejects assistant-answer receipts", () => {
    const reflection = {
      ...baseReflection(),
      assistant_answer: true,
    };

    expect(validateTheoryContextReflectionV1(reflection)).toContain("assistant_answer must be false");
  });

  it("rejects receipts with the wrong deterministic content role", () => {
    const reflection = {
      ...baseReflection(),
      deterministic_content_role: "assistant_answer",
    };

    expect(validateTheoryContextReflectionV1(reflection)).toContain(
      "deterministic_content_role must be observation_not_assistant_answer",
    );
  });

  it("rejects scientific-method reflections that do not belong to the parent reflection", () => {
    const reflection = baseReflection();
    const invalid = {
      ...reflection,
      scientificMethod: {
        ...reflection.scientificMethod,
        reflectionId: "reflection:other",
      },
    };

    expect(validateTheoryContextReflectionV1(invalid)).toContain(
      "scientificMethod.reflectionId must match reflectionId",
    );
  });

  it("rejects nested scientific-method terminal authority", () => {
    const reflection = baseReflection();
    const invalid = {
      ...reflection,
      scientificMethod: {
        ...reflection.scientificMethod,
        terminal_eligible: true,
      },
    };

    expect(validateTheoryContextReflectionV1(invalid)).toContain(
      "scientificMethod must be a valid theory_context_scientific_method_reflection/v1 artifact",
    );
  });

  it("rejects soft regions without badge ids", () => {
    const reflection = baseReflection();
    const invalid = {
      ...reflection,
      overlay: {
        ...reflection.overlay,
        softRegion: {
          ...reflection.overlay.softRegion,
          badgeIds: [],
        },
      },
    };

    expect(validateTheoryContextReflectionV1(invalid)).toContain(
      "overlay.softRegion.badgeIds must contain at least one badge id",
    );
  });

  it("rejects soft regions with proof-like meaning", () => {
    const reflection = baseReflection();
    const invalid = {
      ...reflection,
      overlay: {
        ...reflection.overlay,
        softRegion: {
          ...reflection.overlay.softRegion,
          meaning: "proof",
        },
      },
    };

    expect(validateTheoryContextReflectionV1(invalid)).toContain(
      "overlay.softRegion.meaning must be discussion_context_not_proof",
    );
  });

  it("rejects forbidden claim phrases", () => {
    const reflection = baseReflection({
      evidenceForAsk: {
        summary: "This is a working warp drive.",
        claimBoundaries: [],
        recommendedNextActions: [],
      },
    });

    expect(validateTheoryContextReflectionV1(reflection).join("\n")).toMatch(/forbidden overclaiming/i);
  });

  it("rejects invalid suggested biome scale bands", () => {
    const reflection = baseReflection();
    const invalid = {
      ...reflection,
      overlay: {
        ...reflection.overlay,
        suggestedScaleBands: ["invalid_band"],
      },
    };

    expect(validateTheoryContextReflectionV1(invalid)).toContain(
      "overlay.suggestedScaleBands contains invalid scale band: invalid_band",
    );
  });

  it("rejects invalid suggested semantic chunk ids", () => {
    const reflection = baseReflection();
    const invalid = {
      ...reflection,
      overlay: {
        ...reflection.overlay,
        suggestedSemanticChunkIds: ["valid:chunk:id", 123],
      },
    };

    expect(validateTheoryContextReflectionV1(invalid)).toContain(
      "overlay.suggestedSemanticChunkIds must be an array of strings",
    );
  });

  it("rejects invalid uncertainty probabilities", () => {
    const reflection = baseReflection();
    const invalid = {
      ...reflection,
      overlay: {
        ...reflection.overlay,
        uncertainty: {
          ...reflection.overlay.uncertainty,
          badgeProbabilityById: {
            "nhm2.qei.sampling_window": 1.2,
          },
        },
      },
    };

    expect(validateTheoryContextReflectionV1(invalid)).toContain(
      "overlay.uncertainty.badgeProbabilityById.nhm2.qei.sampling_window must be between 0 and 1",
    );
  });

  it("rejects invalid resolution roles", () => {
    const reflection = baseReflection();
    const invalid = {
      ...reflection,
      resolution: {
        ...reflection.resolution,
        roleByBadgeId: {
          "nhm2.qei.sampling_window": "too_specific",
        },
      },
    };

    expect(validateTheoryContextReflectionV1(invalid)).toContain(
      "resolution.roleByBadgeId.nhm2.qei.sampling_window is invalid",
    );
  });

  it("rejects empty prompts", () => {
    const reflection = baseReflection({
      input: {
        ...baseReflection().input,
        prompt: "",
      },
    });

    expect(validateTheoryContextReflectionV1(reflection)).toContain(
      "input.prompt must be a non-empty string",
    );
  });
});
