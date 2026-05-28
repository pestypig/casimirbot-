import { describe, expect, it } from "vitest";
import { HELIX_WORKSTATION_TOOL_PLAN_SCHEMA } from "../../helix-workstation-tool-plan";
import {
  buildHelixPhysicsCalculationContextPlanV1,
  isHelixPhysicsCalculationContextPlanV1,
  validateHelixPhysicsCalculationContextPlanV1,
} from "../helix-physics-calculation-context-plan.v1";

function basePlan(overrides: Partial<Parameters<typeof buildHelixPhysicsCalculationContextPlanV1>[0]> = {}) {
  return buildHelixPhysicsCalculationContextPlanV1({
    query: "H-alpha photon energy",
    intent: "solve_scalar",
    graphId: "nhm2-theory-badge-graph",
    locatedBadges: [],
    selectedBadgeIds: [],
    atlasLenses: [],
    calculatorPlan: {
      canBuildLoadout: true,
      mode: "locator_matches",
      scalarRowCount: 1,
      runtimeRowCount: 0,
      contextRowCount: 0,
      claimBoundaryCount: 0,
      previewRows: [],
    },
    workstationToolPlan: {
      schema: HELIX_WORKSTATION_TOOL_PLAN_SCHEMA,
      plan_id: "workstation-plan:test",
      thread_id: "thread:test",
      turn_id: "turn:test",
      goal: "H-alpha photon energy",
      intent: "physics_calculation_context",
      steps: [],
      missing_requirements: [],
      created_at: "2026-05-28T00:00:00.000Z",
    },
    nextActions: [
      {
        actionId: "theory-badge-graph.solve_calculator_loadout",
        label: "Solve scalar rows",
        panelId: "theory-badge-graph",
        args: { solve_scope: "all_scalar" },
        mutatesCalculator: true,
        solves: true,
        expectedArtifactKind: "theory_calculator_loadout_solve",
      },
    ],
    commentaryEventsPreview: [],
    claimBoundaryNotes: [],
    warnings: [],
    ...overrides,
  });
}

describe("helix physics calculation context plan v1", () => {
  it("builds a validating plan artifact", () => {
    const plan = basePlan();

    expect(validateHelixPhysicsCalculationContextPlanV1(plan)).toEqual([]);
    expect(isHelixPhysicsCalculationContextPlanV1(plan)).toBe(true);
    expect(plan.assistantAnswer).toBe(false);
    expect(plan.rawReasoningIncluded).toBe(false);
  });

  it("rejects locate-only plans that mutate or solve the calculator", () => {
    const plan = basePlan({ intent: "locate_only" });

    expect(validateHelixPhysicsCalculationContextPlanV1(plan)).toEqual(
      expect.arrayContaining([
        "locate_only must not include calculator mutation actions",
        "locate_only must not include solve actions",
        "locate_only must not include solve_calculator_loadout",
      ]),
    );
  });

  it("rejects forbidden overclaiming text", () => {
    const plan = basePlan({
      claimBoundaryNotes: ["Solar proves propulsion"],
    });

    expect(validateHelixPhysicsCalculationContextPlanV1(plan).join("\n")).toMatch(/forbidden overclaiming/i);
  });
});
