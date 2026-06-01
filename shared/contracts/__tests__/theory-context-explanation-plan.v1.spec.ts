import { describe, expect, it } from "vitest";
import {
  buildTheoryContextExplanationPlanV1,
  isTheoryContextExplanationPlanV1,
  validateTheoryContextExplanationPlanV1,
  type TheoryContextExplanationPlanV1,
} from "../theory-context-explanation-plan.v1";

function basePlan(
  overrides: Partial<Parameters<typeof buildTheoryContextExplanationPlanV1>[0]> = {},
): TheoryContextExplanationPlanV1 {
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
    inferredDomains: [
      {
        atlasBlockId: "warp_gr_nhm2",
        title: "Warp / GR / NHM2",
        score: 80,
        reasons: ["NHM2 badges matched"],
      },
    ],
    selectedBadgeIds: ["physics.gr.einstein_field_equation", "nhm2.closure.source_residual"],
    firstPrincipleRoots: [
      {
        badgeId: "physics.gr.einstein_field_equation",
        title: "Einstein field equation",
        level: "foundation",
        subjects: ["gr", "stress-energy"],
        role: "first_principle_root",
        displayLatex: "G_{\\mu\\nu}=8\\pi G T_{\\mu\\nu}/c^4",
        expression: null,
        claimBoundaryNotes: ["Reference relation only."],
        sourceRefs: [{ kind: "repo_module", path: "shared/theory/nhm2-theory-badges.ts", id: null, note: null }],
      },
    ],
    branchNodes: [],
    diagnosticNodes: [
      {
        badgeId: "nhm2.closure.source_residual",
        title: "Source residual",
        level: "diagnostic",
        subjects: ["nhm2", "source_closure"],
        role: "diagnostic_branch",
        displayLatex: "R_{source}=source_{required}-source_{available}",
        expression: "R_source = source_required - source_available",
        claimBoundaryNotes: ["Diagnostic comparison only."],
        sourceRefs: [{ kind: "repo_module", path: "shared/theory/nhm2-theory-badges.ts", id: null, note: null }],
      },
    ],
    runtimeNodes: [],
    claimBoundaryNodes: [],
    connectingEdges: [
      {
        edgeId: "edge:test",
        from: "physics.gr.einstein_field_equation",
        to: "nhm2.closure.source_residual",
        relation: "supports",
        label: "diagnostic branch",
      },
    ],
    explanationSteps: [
      {
        id: "step:1",
        index: 1,
        title: "First-principle roots",
        badgeIds: ["physics.gr.einstein_field_equation"],
        role: "first_principles",
        summary: "Start at the shared GR root.",
        calculatorReady: false,
        runtimeReady: false,
        boundaryOnly: false,
        claimBoundaryNotes: ["Diagnostic-only context."],
      },
      {
        id: "step:2",
        index: 2,
        title: "Diagnostic context",
        badgeIds: ["nhm2.closure.source_residual"],
        role: "diagnostic_context",
        summary: "Then compare source residual as a diagnostic scalar cut.",
        calculatorReady: true,
        runtimeReady: false,
        boundaryOnly: false,
        claimBoundaryNotes: ["Diagnostic-only context."],
      },
    ],
    scalarCutBadgeIds: ["nhm2.closure.source_residual"],
    runtimeTraceBadgeIds: [],
    claimBoundaryNotes: ["Diagnostic-only context."],
    recommendedNextActions: [
      {
        actionId: "theory-badge-graph.build_compound_theory_run",
        label: "Build compound theory run",
        panelId: "theory-badge-graph",
        args: { badge_ids: ["nhm2.closure.source_residual"] },
        mutatesCalculator: false,
        solves: false,
      },
    ],
    ...overrides,
  });
}

describe("theory context explanation plan v1", () => {
  it("builds a valid non-terminal explanation plan", () => {
    const plan = basePlan();

    expect(validateTheoryContextExplanationPlanV1(plan)).toEqual([]);
    expect(isTheoryContextExplanationPlanV1(plan)).toBe(true);
    expect(plan.assistant_answer).toBe(false);
    expect(plan.raw_content_included).toBe(false);
    expect(plan.terminal_eligible).toBe(false);
    expect(plan.panel_generated_answer).toBe(false);
    expect(plan.context_role).toBe("tool_evidence");
    expect(plan.ask_context_policy).toBe("evidence_only");
  });

  it("rejects terminal-eligible receipts", () => {
    const invalid = { ...basePlan(), terminal_eligible: true };

    expect(validateTheoryContextExplanationPlanV1(invalid)).toContain("terminal_eligible must be false");
  });

  it("rejects invalid node roles", () => {
    const invalid = {
      ...basePlan(),
      diagnosticNodes: [{ ...basePlan().diagnosticNodes[0], role: "answer" }],
    };

    expect(validateTheoryContextExplanationPlanV1(invalid).join("\n")).toMatch(/diagnosticNodes\[0\]\.role is invalid/);
  });

  it("rejects summary count mismatches", () => {
    const invalid = {
      ...basePlan(),
      summary: { ...basePlan().summary, scalarCutCount: 99 },
    };

    expect(validateTheoryContextExplanationPlanV1(invalid)).toContain(
      "summary.scalarCutCount must match computed count",
    );
  });

  it("rejects forbidden claim phrases", () => {
    const invalid = basePlan({
      claimBoundaryNotes: ["This is a certified transport solution."],
    });

    expect(validateTheoryContextExplanationPlanV1(invalid).join("\n")).toMatch(/forbidden overclaiming/i);
  });
});
