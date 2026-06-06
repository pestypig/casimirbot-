import { describe, expect, it } from "vitest";
import { CASIMIR_CAVITY_GROUPS } from "../casimir-cavity-map";

describe("casimir cavity map", () => {
  it("provides object-bound groups for Casimir calculator chains", () => {
    const ids = CASIMIR_CAVITY_GROUPS.map((group) => group.id);

    expect(ids).toEqual([
      "casimir.cavity.parallel_plate_tile",
      "casimir.cavity.tile_budget",
      "casimir.cavity.mode_frequency",
      "casimir.cavity.claim_boundary",
    ]);

    const tile = CASIMIR_CAVITY_GROUPS.find((group) => group.id === "casimir.cavity.parallel_plate_tile");
    expect(tile?.calculatorPayloadRefs.map((ref) => ref.payloadId)).toEqual([
      "casimir_energy_per_area_payload",
      "casimir_pressure_payload",
      "casimir_per_tile_energy_payload",
    ]);
    expect(tile?.objectBindings[0]?.input.a).toBe(1e-9);
    expect(tile?.claimBoundaryBadgeIds).toContain("casimir.claim_boundary.diagnostic_source_context");

    const budget = CASIMIR_CAVITY_GROUPS.find((group) => group.id === "casimir.cavity.tile_budget");
    expect(budget?.theoryBadgeIds).toEqual(
      expect.arrayContaining(["casimir.tile.duty_budget", "casimir.material_receipts"]),
    );
    expect(budget?.calculatorPayloadRefs).toContainEqual({
      badgeId: "casimir.tile.duty_budget",
      payloadId: "casimir_effective_sector_duty_payload",
    });
    expect(budget?.objectBindings[0]?.input.N_sector).toBe(80);
  });
});
