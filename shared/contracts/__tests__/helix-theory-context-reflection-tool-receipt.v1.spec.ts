import { describe, expect, it } from "vitest";
import {
  buildHelixTheoryContextReflectionToolReceiptV1,
  HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID,
  HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION,
  isHelixTheoryContextReflectionToolReceiptV1,
  validateHelixTheoryContextReflectionToolReceiptV1,
} from "../helix-theory-context-reflection-tool-receipt.v1";
import {
  buildTheoryContextReflectionV1,
  type TheoryContextReflectionV1,
} from "../theory-context-reflection.v1";
import {
  buildTheoryContextExplanationPlanV1,
  type TheoryContextExplanationPlanV1,
} from "../theory-context-explanation-plan.v1";

function reflectionFixture(): TheoryContextReflectionV1 {
  return buildTheoryContextReflectionV1({
    generatedAt: "2026-05-31T00:00:00.000Z",
    reflectionId: "reflection:test",
    graphId: "nhm2-theory-badge-graph",
    input: {
      prompt: "Map source residual and QEI margin in the theory graph.",
      conversationContext: "The user is discussing NHM2 diagnostic margins.",
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
        reasons: ["symbol match"],
        matchedSymbols: ["qei_margin"],
        matchedEquationFamilies: ["qei_sampling_window"],
        matchedRepoPaths: ["shared/theory/nhm2-theory-badges.ts"],
        claimBoundaryNotes: ["Diagnostic-only context."],
      },
    ],
    likelyMatches: [
      {
        badgeId: "nhm2.closure.source_residual",
        title: "Source residual",
        score: 72,
        reasons: ["nearby source closure context"],
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
  });
}

function receiptFixture(
  overrides: Partial<Parameters<typeof buildHelixTheoryContextReflectionToolReceiptV1>[0]> = {},
) {
  const reflectionV1 = reflectionFixture();
  return buildHelixTheoryContextReflectionToolReceiptV1({
    generatedAt: "2026-05-31T00:00:00.000Z",
    receiptId: "helix-theory-reflection-tool-receipt:test",
    turnId: "turn:test",
    threadId: "thread:test",
    prompt: reflectionV1.input.prompt,
    conversationContext: reflectionV1.input.conversationContext,
    reflectionV1,
    explanationPlanV1: null,
    panelSync: {
      requested: true,
      applied: false,
      panelId: "theory-badge-graph",
      selectedLiveContextBlock: true,
      openPanel: true,
      overlayMode: "live_answer_context",
    },
    recommendedNextActions: reflectionV1.evidenceForAsk.recommendedNextActions,
    ...overrides,
  });
}

function explanationPlanFixture(): TheoryContextExplanationPlanV1 {
  return buildTheoryContextExplanationPlanV1({
    generatedAt: "2026-05-31T00:00:00.000Z",
    planId: "theory-context-explanation:test",
    graphId: "nhm2-theory-badge-graph",
    reflectionId: "reflection:test",
    source: {
      kind: "theory_context_reflection",
      prompt: "Map source residual and QEI margin in the theory graph.",
      confidenceMode: "soft_locator",
    },
    inferredDomains: [],
    selectedBadgeIds: ["nhm2.closure.source_residual"],
    firstPrincipleRoots: [],
    branchNodes: [],
    diagnosticNodes: [],
    runtimeNodes: [],
    claimBoundaryNodes: [],
    connectingEdges: [],
    explanationSteps: [],
    scalarCutBadgeIds: [],
    runtimeTraceBadgeIds: [],
    claimBoundaryNotes: ["Diagnostic-only context."],
    recommendedNextActions: [
      {
        actionId: "theory-badge-graph.get_runtime_math_trace",
        label: "Get runtime math trace",
        panelId: "theory-badge-graph",
        args: { badge_id: "nhm2.closure.source_residual" },
        mutatesCalculator: false,
        solves: false,
      },
    ],
  });
}

describe("helix theory context reflection tool receipt v1", () => {
  it("builds a valid evidence-only Ask tool receipt", () => {
    const receipt = receiptFixture();

    expect(receipt.artifactId).toBe(HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID);
    expect(receipt.schemaVersion).toBe(HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION);
    expect(receipt.artifactId).toBe("helix_theory_context_reflection_tool_receipt");
    expect(receipt.schemaVersion).toBe("helix_theory_context_reflection_tool_receipt/v1");
    expect(receipt.authority.assistant_answer).toBe(false);
    expect(receipt.authority.raw_content_included).toBe(false);
    expect(receipt.authority.terminal_eligible).toBe(false);
    expect(receipt.authority.panel_generated_answer).toBe(false);
    expect(receipt.authority.context_role).toBe("tool_evidence");
    expect(receipt.authority.ask_context_policy).toBe("evidence_only");
    expect(receipt.reflectionV1.terminal_eligible).toBe(false);
    expect(receipt.reflectionV1.scientificMethod.terminal_eligible).toBe(false);
    expect(receipt.reflectionV1.scientificMethod.context_role).toBe("tool_evidence");
    expect(receipt.reflectionV1.scientificMethod.reflectionId).toBe(receipt.reflectionV1.reflectionId);
    expect(receipt.explanationPlanV1?.terminal_eligible ?? false).toBe(false);
    expect(validateHelixTheoryContextReflectionToolReceiptV1(receipt)).toEqual([]);
    expect(isHelixTheoryContextReflectionToolReceiptV1(receipt)).toBe(true);
  });

  it("rejects missing artifactId", () => {
    const receipt = {
      ...receiptFixture(),
      artifactId: undefined,
    };

    expect(validateHelixTheoryContextReflectionToolReceiptV1(receipt)).toContain(
      "artifactId must be helix_theory_context_reflection_tool_receipt",
    );
  });

  it("allows null explanationPlanV1", () => {
    const receipt = receiptFixture({ explanationPlanV1: null });

    expect(validateHelixTheoryContextReflectionToolReceiptV1(receipt)).toEqual([]);
    expect(isHelixTheoryContextReflectionToolReceiptV1(receipt)).toBe(true);
  });

  it("accepts combined reflection and explanation recommended next actions", () => {
    const reflection = reflectionFixture();
    const explanationPlan = explanationPlanFixture();
    const receipt = receiptFixture({
      reflectionV1: reflection,
      explanationPlanV1: explanationPlan,
      recommendedNextActions: [
        ...reflection.evidenceForAsk.recommendedNextActions,
        ...explanationPlan.recommendedNextActions,
      ],
    });

    expect(validateHelixTheoryContextReflectionToolReceiptV1(receipt)).toEqual([]);
    expect(receipt.recommendedNextActions.map((action: { actionId: string }) => action.actionId)).toEqual([
      "theory-badge-graph.build_compound_theory_run",
      "theory-badge-graph.get_runtime_math_trace",
    ]);
  });

  it("rejects invalid frontier exact verification result artifacts", () => {
    const receipt = {
      ...receiptFixture(),
      frontierExactVerificationResultsV1: [
        {
          verifierVersion: "theory_frontier_exact_contract/v1",
          candidateId: "frontier:test",
          exactContractSatisfied: true,
          promotionAllowed: true,
          validatesTheory: false,
          issues: [],
          checkedRequirements: { nonTerminalBoundary: true },
        },
      ],
    };

    expect(validateHelixTheoryContextReflectionToolReceiptV1(receipt)).toContain(
      "frontierExactVerificationResultsV1[0] must be a valid theory_frontier_exact_contract_verification/v1 artifact",
    );
  });

  it("rejects invalid frontier literature maps", () => {
    const receipt = {
      ...receiptFixture(),
      frontierLiteratureMapV1: {
        artifactId: "theory_frontier_literature_map",
        schemaVersion: "theory_frontier_literature_map/v1",
        authority: {
          assistant_answer: true,
          terminal_eligible: true,
          promotionAllowed: true,
        },
      },
    };

    expect(validateHelixTheoryContextReflectionToolReceiptV1(receipt)).toContain(
      "frontierLiteratureMapV1 must be null or a valid theory_frontier_literature_map/v1 artifact",
    );
  });

  it("rejects terminal nested authority", () => {
    const receipt = {
      ...receiptFixture(),
      authority: {
        ...receiptFixture().authority,
        terminal_eligible: true,
      },
    };

    expect(validateHelixTheoryContextReflectionToolReceiptV1(receipt)).toContain(
      "authority.terminal_eligible must be false",
    );
  });

  it("rejects terminal legacy top-level authority", () => {
    const receipt = {
      ...receiptFixture(),
      terminal_eligible: true,
    };

    expect(validateHelixTheoryContextReflectionToolReceiptV1(receipt)).toContain(
      "top-level authority.terminal_eligible must be false",
    );
  });

  it("rejects invalid panel sync overlay mode", () => {
    const receipt = receiptFixture();
    const invalid = {
      ...receipt,
      panelSync: {
        ...receipt.panelSync,
        overlayMode: "proof_zone",
      },
    };

    expect(validateHelixTheoryContextReflectionToolReceiptV1(invalid)).toContain(
      "panelSync.overlayMode is invalid",
    );
  });

  it("rejects invalid nested reflection artifacts", () => {
    const receipt = {
      ...receiptFixture(),
      reflectionV1: {
        ...reflectionFixture(),
        terminal_eligible: true,
      },
    };

    expect(validateHelixTheoryContextReflectionToolReceiptV1(receipt)).toContain(
      "reflectionV1 must be a valid theory_context_reflection/v1 artifact",
    );
  });

  it("rejects forbidden claim phrases", () => {
    const receipt = {
      ...receiptFixture(),
      prompt: "This is a working warp drive.",
    };

    expect(validateHelixTheoryContextReflectionToolReceiptV1(receipt).join("\n")).toMatch(
      /forbidden overclaiming/i,
    );
  });
});
