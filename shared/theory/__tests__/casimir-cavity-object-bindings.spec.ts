import { describe, expect, it } from "vitest";
import { buildCasimirCavityObjectBindings } from "../casimir-cavity-object-bindings";

describe("casimir cavity object bindings", () => {
  it("binds cavity constants and explicit tile values for calculator loadouts", () => {
    const context = buildCasimirCavityObjectBindings({
      objectId: "casimir-cavity:test",
      label: "Test cavity tile",
      a: 1e-9,
      A_tile: 2.5e-3,
      E_area: -0.4333,
      E_tile: -0.001083,
      d_burst: 0.12,
      d_cycle: 0.12,
      N_concurrent: 2,
      N_sector: 80,
    });

    expect(context.kind).toBe("casimir_cavity_object");
    expect(context.variableBindings.pi).toBe(Math.PI);
    expect(context.variableBindings.hbar_c).toBe(3.16152677e-26);
    expect(context.variableBindings.c).toBe(299792458);
    expect(context.variableBindings.a).toBe(1e-9);
    expect(context.variableBindings.A_tile).toBe(2.5e-3);
    expect(context.variableBindings.E_area).toBe(-0.4333);
    expect(context.variableBindings.d_burst).toBe(0.12);
    expect(context.variableBindings.N_concurrent).toBe(2);
    expect(context.units.E_area).toBe("J/m^2");
    expect(context.units.d_burst).toBe("1");
    expect(context.units.N_sector).toBe("1");
    expect(context.claimBoundaryNotes.join(" ")).not.toMatch(/confirmed physical mechanism|validated propulsion/i);
  });
});
