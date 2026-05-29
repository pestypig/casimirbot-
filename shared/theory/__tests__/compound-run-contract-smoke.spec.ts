import { describe, expect, it } from "vitest";
import { isTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { isTheoryCalculatorLoadoutV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("compound theory run contract smoke baseline", () => {
  it("keeps existing badge graph and scalar loadout contracts available for Phase 0", () => {
    // TODO(compound-run): replace this smoke baseline with direct
    // theory_compound_run/v1 contract validation once the Phase 1 contract exists.
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: ["solar.spectrum.photon_energy"],
      mode: "selected_badges",
      source: "helix_ask",
      variableBindings: {
        h: "6.62607015e-34",
        c: 299792458,
        lambda: "656.28e-9",
      },
      includeContextItems: false,
    });

    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
    expect(isTheoryCalculatorLoadoutV1(loadout)).toBe(true);
    expect(loadout.items.some((item) => item.kind === "calculator_payload")).toBe(true);
    expect(loadout.summary.solvedCount).toBe(0);
  });
});
