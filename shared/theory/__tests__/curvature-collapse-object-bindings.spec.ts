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
      dt_s: 0.05,
      deltaE_G_J: 1e-30,
      tau_DP_s: 1.054571817e-4,
      L_present_DP: 0.25,
    });

    expect(context.kind).toBe("curvature_collapse_object");
    expect(context.variableBindings.rho_kg_m3).toBe(1000);
    expect(context.variableBindings.power_W).toBe(1000000);
    expect(context.variableBindings.c).toBe(299792458);
    expect(context.variableBindings.G).toBe(6.6743e-11);
    expect(context.variableBindings.h).toBe(6.62607015e-34);
    expect(context.variableBindings.hbar).toBe(1.054571817e-34);
    expect(context.variableBindings.deltaE_G_J).toBe(1e-30);
    expect(context.variableBindings.dt_s).toBe(0.05);
    expect(context.variableBindings.tau_DP_s).toBe(1.054571817e-4);
    expect(context.variableBindings.L_present_DP).toBe(0.25);
    expect(context.claimBoundaryNotes.join(" ")).toMatch(/benchmark diagnostics/i);
    expect(context.claimBoundaryNotes.join(" ")).toMatch(/Diosi-Penrose timescale/i);
  });
});
