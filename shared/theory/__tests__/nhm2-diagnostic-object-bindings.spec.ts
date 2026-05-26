import { describe, expect, it } from "vitest";
import { buildNhm2DiagnosticObjectBindings } from "../nhm2-diagnostic-object-bindings";

describe("NHM2 diagnostic object bindings", () => {
  it("binds scalar diagnostic values for calculator loadouts", () => {
    const context = buildNhm2DiagnosticObjectBindings({
      objectId: "nhm2-diagnostic:test",
      label: "Test diagnostic path",
      t_shift: 1,
      delta_t_lapse: 0.1,
      E: 1,
      V: 2,
      source_required: 1,
      source_available: 0.8,
    });

    expect(context.kind).toBe("nhm2_diagnostic_object");
    expect(context.variableBindings.t_shift).toBe(1);
    expect(context.variableBindings.delta_t_lapse).toBe(0.1);
    expect(context.variableBindings.E).toBe(1);
    expect(context.variableBindings.V).toBe(2);
    expect(context.units.R_source).toBe("J/m^3");
    expect(context.claimBoundaryNotes.join(" ")).toMatch(/do not validate NHM2/i);
  });
});
