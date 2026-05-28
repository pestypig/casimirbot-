import { describe, expect, it } from "vitest";
import { isHelixPhysicsCalculationContextPlanV1 } from "../../contracts/helix-physics-calculation-context-plan.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildHelixPhysicsAtlasV1 } from "../physics-atlas-blocks";
import { planHelixPhysicsCalculationContext } from "../helix-physics-calculation-context-planner";

describe("helix physics calculation context planner", () => {
  it("plans a solar H-alpha scalar workflow with next actions", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const atlas = buildHelixPhysicsAtlasV1({ graph });
    const plan = planHelixPhysicsCalculationContext({
      graph,
      atlas,
      query: "H-alpha photon energy Doppler shift",
      intent: "solve_scalar",
      atlasBlockIds: ["solar_surface_spectrum"],
    });

    expect(isHelixPhysicsCalculationContextPlanV1(plan)).toBe(true);
    expect(plan.selectedBadgeIds.length).toBeGreaterThan(0);
    expect(plan.selectedBadgeIds).toContain("solar.spectrum.photon_energy");
    expect(plan.calculatorPlan.scalarRowCount).toBeGreaterThanOrEqual(1);
    expect(plan.nextActions.some((action) => action.actionId === "theory-badge-graph.solve_calculator_loadout")).toBe(true);
    expect(plan.commentaryEventsPreview.length).toBeGreaterThan(0);
    expect(plan.assistantAnswer).toBe(false);
    expect(plan.rawReasoningIncluded).toBe(false);
  });

  it("keeps locate-only plans non-mutating", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const atlas = buildHelixPhysicsAtlasV1({ graph });
    const plan = planHelixPhysicsCalculationContext({
      graph,
      atlas,
      query: "where does QEI margin fit in the theory map",
      intent: "locate_only",
      atlasBlockIds: ["qei_stress_energy"],
    });

    expect(plan.nextActions).toEqual([]);
    expect(JSON.stringify(plan)).not.toContain("solve_calculator_loadout");
    expect(plan.workstationToolPlan.steps.some((step) => step.action_id === "locate_context")).toBe(true);
  });
});
