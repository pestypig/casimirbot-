import { describe, expect, it } from "vitest";
import { computeStarSimFusionClosure } from "../shared/starsim-fusion-profile-closure";

describe("StarSim fusion profile closure", () => {
  it("computes surface effective temperature and logg from L/R/M", () => {
    const closure = computeStarSimFusionClosure({
      luminosity_Lsun: 1,
      radius_Rsun: 1,
      mass_Msun: 1,
      integratedNucLuminosity_Lsun: 1,
      reproducibilityStatus: "mesa_imported",
      mesaMetadata: { inlistHash: "abc", network: "pp_cno" },
    });
    expect(closure.effectiveTemperatureFromLR_K).toBeGreaterThan(5700);
    expect(closure.surfaceGravityLogg_cgs).toBeGreaterThan(4);
    expect(closure.luminosityClosureRelErr).toBeCloseTo(0);
    expect(closure.warnings).toContain("surface_teff_not_core_temperature");
  });

  it("warns when luminosity closure and MESA metadata are incomplete", () => {
    const closure = computeStarSimFusionClosure({
      luminosity_Lsun: 1,
      radius_Rsun: 1,
      mass_Msun: 1,
      integratedNucLuminosity_Lsun: 2,
      reproducibilityStatus: "mesa_imported",
      mesaMetadata: {},
    });
    expect(closure.warnings).toContain("surface_luminosity_not_identical_to_nuclear_luminosity");
    expect(closure.warnings).toContain("mesa_import_missing_inlist_hash");
    expect(closure.warnings).toContain("mesa_import_missing_network_metadata");
  });
});
