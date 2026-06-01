import { describe, expect, it } from "vitest";
import { isTheoryContextExplanationPlanV1 } from "../../contracts/theory-context-explanation-plan.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryContextExplanationPlan } from "../theory-context-explanation-plan";
import { buildTheoryContextReflection } from "../theory-context-reflector";

describe("theory context explanation plan", () => {
  it("builds a first-principles-to-branch route from reflection evidence", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const reflection = buildTheoryContextReflection({
      graph,
      prompt: "Map source residual and QEI margin in the theory graph.",
      conversationContext: "The user wants to dive conceptually from first principles into NHM2/QEI diagnostics.",
      mentionedEquations: [
        "G_mu_nu = 8*pi*G*T_mu_nu/c^4",
        "R_source = source_required - source_available",
        "qei_margin = qei_bound - qei_sample",
      ],
      mentionedSymbols: ["G_mu_nu", "T_mu_nu", "R_source", "qei_margin"],
      mentionedDomains: ["warp_gr_nhm2", "qei_stress_energy"],
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:explanation-test",
    });
    const plan = buildTheoryContextExplanationPlan({
      graph,
      reflection,
      generatedAt: "2026-05-31T00:00:00.000Z",
      planId: "theory-context-explanation:test",
    });
    const allNodeIds = [
      ...plan.firstPrincipleRoots,
      ...plan.branchNodes,
      ...plan.diagnosticNodes,
      ...plan.runtimeNodes,
      ...plan.claimBoundaryNodes,
    ].map((node) => node.badgeId);

    expect(isTheoryContextExplanationPlanV1(plan)).toBe(true);
    expect(allNodeIds).toContain("physics.gr.einstein_field_equation");
    expect(allNodeIds).toContain("nhm2.closure.source_residual");
    expect(allNodeIds).toContain("nhm2.qei.sampling_window");
    expect(plan.explanationSteps.map((step) => step.role)).toContain("first_principles");
    expect(plan.explanationSteps.map((step) => step.role)).toContain("diagnostic_context");
    expect(plan.claimBoundaryNotes.join(" ")).toMatch(/diagnostic|promotion not allowed|validation claim not allowed/i);
    expect(plan.recommendedNextActions.every((action) => action.solves === false)).toBe(true);
  });

  it("includes scalar and runtime follow-up suggestions without solving", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const reflection = buildTheoryContextReflection({
      graph,
      prompt: "Show where Einstein tensor, source residual, and QEI margin fit, then prepare a trace.",
      mentionedSymbols: ["G_mu_nu", "R_source", "qei_margin"],
      mentionedDomains: ["warp_gr_nhm2", "qei_stress_energy"],
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:followups",
    });
    const plan = buildTheoryContextExplanationPlan({ graph, reflection });

    expect(plan.scalarCutBadgeIds.length).toBeGreaterThan(0);
    expect(plan.runtimeTraceBadgeIds.length).toBeGreaterThan(0);
    expect(plan.recommendedNextActions.some((action) => action.actionId === "theory-badge-graph.build_compound_theory_run")).toBe(true);
    expect(plan.recommendedNextActions.some((action) => action.actionId === "theory-badge-graph.get_runtime_math_trace")).toBe(true);
    expect(plan.recommendedNextActions.every((action) => action.solves === false)).toBe(true);
  });
});
