import { describe, expect, it } from "vitest";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildNhm2DiagnosticObjectBindings } from "../nhm2-diagnostic-object-bindings";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("Warp / GR / NHM2 calculator loadout", () => {
  it("builds object-bound scalar diagnostic rows while preserving context rows", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "physics.gr.einstein_field_equation",
        "physics.gr.3p1_decomposition",
        "nhm2.geometry.lapse_shift_profile",
        "nhm2.source.energy_density_proxy",
        "nhm2.tile.duty_cycle_average",
        "nhm2.closure.source_residual",
        "nhm2.qei.sampling_window",
        "nhm2.energy_condition.diagnostic_gate",
        "nhm2.claim_boundary.diagnostic_only",
      ],
      mode: "selected_badges",
      objectContext: buildNhm2DiagnosticObjectBindings({
        t_shift: 1,
        delta_t_lapse: 0.1,
        E: 1,
        V: 1,
        E_cycle: 1,
        T_cycle: 2,
        source_required: 1,
        source_available: 0.8,
        qei_bound: 1,
        qei_sample: 0.9,
      }),
      includeContextItems: true,
    });

    expect(loadout.objectContext?.kind).toBe("nhm2_diagnostic_object");
    expect(loadout.items.some((item: TheoryCalculatorLoadoutItemV1) => item.kind === "reference_context")).toBe(true);
    expect(loadout.items.some((item: TheoryCalculatorLoadoutItemV1) => item.kind === "claim_boundary")).toBe(true);
    expect(loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression)).toEqual(
      expect.arrayContaining([
        "t_proper = 1 + 0.1",
        "rho = 1 / 1",
        "P_avg = 1 / 2",
        "R_source = 1 - 0.8",
        "qei_margin = 1 - 0.9",
      ]),
    );
    expect(loadout.claimBoundaryNotes.join(" ")).toMatch(/validation claim not allowed/i);
  });
});
