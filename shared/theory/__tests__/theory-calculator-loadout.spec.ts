import { describe, expect, it } from "vitest";
import { isTheoryCalculatorLoadoutV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildStarSimObjectBindings } from "../starsim-object-bindings";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("theory calculator loadout builder", () => {
  it("builds an object-bound StarSim scalar chain with runtime context rows", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const objectContext = buildStarSimObjectBindings({
      objectClass: "red_giant",
      spectralType: "K1III",
      luminosity_Lsun: 65,
      radius_Rsun: 12,
      mass_Msun: 1.1,
      r90_Rstar: 0.2,
    });
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: ["starsim.runtime.evaluate_fusion_microphysics"],
      mode: "dependency_path",
      source: "helix_ask",
      objectContext,
      includeContextItems: true,
    });

    expect(isTheoryCalculatorLoadoutV1(loadout)).toBe(true);
    expect(loadout.items.some((item) => item.solveExpression?.includes("5772*(65/(12^2))"))).toBe(true);
    expect(loadout.items.some((item) => item.badgeId === "starsim.classifier.cno_mass_margin")).toBe(true);
    expect(loadout.items.some((item) => item.badgeId === "starsim.classifier.brown_dwarf_mass_margin")).toBe(true);
    expect(loadout.items.some((item) => item.kind === "runtime_context")).toBe(true);
    expect(loadout.claimBoundaryNotes.some((note) => note.includes("diagnostic-only"))).toBe(true);
  });

  it("builds locator-matched solar atlas rows with explicit bindings", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [],
      mode: "locator_matches",
      atlasBlockId: "solar_surface_spectrum",
      query: "H-alpha photon energy Doppler shift",
      variableBindings: {
        h: "6.62607015e-34",
        c: 299792458,
        lambda: "656.28e-9",
        lambda0: "656.28e-9",
        lambda_obs: "656.35e-9",
      },
      includeContextItems: false,
    });

    expect(isTheoryCalculatorLoadoutV1(loadout)).toBe(true);
    expect(loadout.mode).toBe("locator_matches");
    expect(loadout.items.map((item) => item.badgeId)).toEqual(
      expect.arrayContaining([
        "solar.spectrum.photon_energy",
        "solar.spectrum.doppler_shift",
        "solar.spectrum.radial_velocity_proxy",
      ]),
    );
    expect(loadout.items.some((item) => item.solveExpression === "E = 6.62607015e-34*299792458/656.28e-9")).toBe(true);
    expect(loadout.items.some((item) => item.solveExpression === "z = (656.35e-9 - 656.28e-9)/656.28e-9")).toBe(true);
    expect(loadout.summary.solvedCount).toBe(0);
  });
});
