import { describe, expect, it } from "vitest";
import { buildSolarSpectrumObservationBindings } from "../solar-spectrum-observation-bindings";

describe("solar spectrum observation bindings", () => {
  it("binds H-alpha observation values and constants for calculator loadouts", () => {
    const context = buildSolarSpectrumObservationBindings({
      objectId: "solar-observation:test",
      label: "H-alpha test",
      lambda: 656.28e-9,
      lambda0: 656.28e-9,
      lambda_obs: 656.35e-9,
    });

    expect(context.kind).toBe("solar_spectrum_observation");
    expect(context.variableBindings.h).toBe(6.62607015e-34);
    expect(context.variableBindings.c).toBe(299792458);
    expect(context.variableBindings.lambda).toBe(656.28e-9);
    expect(context.variableBindings.lambda0).toBe(656.28e-9);
    expect(context.variableBindings.lambda_obs).toBe(656.35e-9);
    expect(Number(context.variableBindings.z)).toBeCloseTo((656.35e-9 - 656.28e-9) / 656.28e-9);
    expect(context.claimBoundaryNotes.join(" ")).toMatch(/observational\/inference helpers/i);
  });
});
