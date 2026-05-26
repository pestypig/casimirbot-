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
});
