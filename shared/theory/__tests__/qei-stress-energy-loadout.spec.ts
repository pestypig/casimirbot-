import { describe, expect, it } from "vitest";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildNhm2DiagnosticObjectBindings } from "../nhm2-diagnostic-object-bindings";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("QEI / stress-energy calculator loadout", () => {
  it("builds object-bound source and QEI margin rows with gate context", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "nhm2.closure.source_residual",
        "nhm2.qei.sampling_window",
        "nhm2.energy_condition.diagnostic_gate",
        "nhm2.claim_boundary.diagnostic_only",
      ],
      mode: "selected_badges",
      objectContext: buildNhm2DiagnosticObjectBindings({
        source_required: 1,
        source_available: 0.8,
        qei_bound: 1,
        qei_sample: 0.9,
      }),
      includeContextItems: true,
    });

    expect(loadout.objectContext?.kind).toBe("nhm2_diagnostic_object");
    expect(loadout.items.some((item: TheoryCalculatorLoadoutItemV1) => item.kind === "runtime_context")).toBe(true);
    expect(loadout.items.some((item: TheoryCalculatorLoadoutItemV1) => item.kind === "claim_boundary")).toBe(true);
    expect(loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression)).toEqual(
      expect.arrayContaining([
        "R_source = 1 - 0.8",
        "qei_margin = 1 - 0.9",
      ]),
    );
    expect(loadout.claimBoundaryNotes.join(" ")).toMatch(/do not validate NHM2/i);
  });
});
