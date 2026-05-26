import { describe, expect, it } from "vitest";
import { buildGalacticDynamicsObjectBindings } from "../galactic-dynamics-object-bindings";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("galactic dynamics calculator loadout", () => {
  it("substitutes object values into map and rotation residual rows", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const objectContext = buildGalacticDynamicsObjectBindings({
      dx_pc: 3,
      dy_pc: 4,
      dz_pc: 12,
      distance_pc: 13,
      v_obs: 220,
      v_model: 190,
      residual_sum_sq: 900,
      N_points: 1,
    });

    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "galactic.map.distance_3d",
        "galactic.map.structure_weight_proxy",
        "galactic.rotation.velocity_residual",
        "galactic.rotation.rms_residual_proxy",
        "galactic.runtime.rotation_controls",
        "galactic.claim_boundary.null_model_only",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      objectContext,
      includeContextItems: true,
    });

    expect(loadout.objectContext?.kind).toBe("galactic_dynamics_object");
    expect(loadout.items.map((item) => item.solveExpression)).toContain(
      "distance_pc = sqrt(3^2 + 4^2 + 12^2)",
    );
    expect(loadout.items.map((item) => item.solveExpression)).toContain("structureWeight = 1/(1 + 13)");
    expect(loadout.items.map((item) => item.solveExpression)).toContain("velocity_residual = 220 - 190");
    expect(loadout.items.map((item) => item.solveExpression)).toContain("rms_residual = sqrt(900/1)");
    expect(loadout.items.some((item) => item.kind === "runtime_context")).toBe(true);
    expect(loadout.items.some((item) => item.kind === "claim_boundary")).toBe(true);
  });
});
