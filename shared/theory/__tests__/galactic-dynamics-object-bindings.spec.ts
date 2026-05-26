import { describe, expect, it } from "vitest";
import { buildGalacticDynamicsObjectBindings } from "../galactic-dynamics-object-bindings";

describe("galactic dynamics object bindings", () => {
  it("normalizes map and rotation observables into calculator symbols", () => {
    const context = buildGalacticDynamicsObjectBindings({
      objectId: "galactic:test",
      label: "Test stream",
      dx_pc: 3,
      dy_pc: 4,
      dz_pc: 12,
      v_obs: 220,
      v_model: 190,
    });

    expect(context.kind).toBe("galactic_dynamics_object");
    expect(context.variableBindings.dx_pc).toBe(3);
    expect(context.variableBindings.dy_pc).toBe(4);
    expect(context.variableBindings.dz_pc).toBe(12);
    expect(context.variableBindings.G).toBe(4.30091e-6);
    expect(context.variableBindings.v_obs).toBe(220);
    expect(context.variableBindings.v_model).toBe(190);
    expect(context.claimBoundaryNotes.join(" ")).toMatch(/null-model/i);
  });
});
