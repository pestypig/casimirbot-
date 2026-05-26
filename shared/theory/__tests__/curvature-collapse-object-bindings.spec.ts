import { describe, expect, it } from "vitest";
import { buildCurvatureCollapseObjectBindings } from "../curvature-collapse-object-bindings";

describe("curvature/collapse object bindings", () => {
  it("maps benchmark observables into calculator bindings with safe defaults", () => {
    const context = buildCurvatureCollapseObjectBindings({
      objectId: "curvature:sample",
      rho_kg_m3: 1000,
      power_W: 1000000,
      area_m2: 10,
      tau_ms: 1000,
      dt_ms: 50,
    });

    expect(context.kind).toBe("curvature_collapse_object");
    expect(context.variableBindings.rho_kg_m3).toBe(1000);
    expect(context.variableBindings.power_W).toBe(1000000);
    expect(context.variableBindings.c).toBe(299792458);
    expect(context.variableBindings.G).toBe(6.6743e-11);
    expect(context.claimBoundaryNotes.join(" ")).toMatch(/benchmark diagnostics/i);
  });
});
