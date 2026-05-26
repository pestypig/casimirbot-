import { describe, expect, it } from "vitest";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";
import { buildTokamakPlasmaObjectBindings } from "../tokamak-plasma-object-bindings";

describe("Tokamak plasma calculator loadout", () => {
  it("builds object-bound pressure, beta, and runtime context rows", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "tokamak.plasma.magnetic_pressure",
        "tokamak.plasma.thermal_pressure_proxy",
        "tokamak.plasma.beta_proxy",
        "tokamak.runtime.energy_field",
        "tokamak.claim_boundary.diagnostic_proxy",
      ],
      mode: "selected_badges",
      objectContext: buildTokamakPlasmaObjectBindings({
        B_T: 5.3,
        p_B: 11176683.7,
        n_m3: 1e20,
        T_eV: 10000,
        p_Pa: 160217.6634,
      }),
      includeContextItems: true,
    });

    expect(loadout.objectContext?.kind).toBe("tokamak_plasma_object");
    expect(loadout.items.some((item: TheoryCalculatorLoadoutItemV1) => item.kind === "reference_context")).toBe(true);
    expect(loadout.items.some((item: TheoryCalculatorLoadoutItemV1) => item.kind === "claim_boundary")).toBe(true);
    expect(loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression)).toEqual(
      expect.arrayContaining([
        "p_B = 5.3^2/(2*0.00000125663706212)",
        "p_Pa = 100000000000000000000*10000*1.602176634e-19",
        "beta = 160217.6634/11176683.7",
      ]),
    );
    expect(loadout.claimBoundaryNotes.join(" ")).toMatch(/diagnostic\/proxy helpers/i);
  });
});
