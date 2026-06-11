import { describe, expect, it } from "vitest";
import { QEI_STRESS_ENERGY_GROUPS, getQeiStressEnergyGroup } from "../qei-stress-energy-map";

describe("QEI / stress-energy map", () => {
  it("defines deterministic diagnostic groups and calculator payload refs", () => {
    expect(QEI_STRESS_ENERGY_GROUPS.map((group) => group.id)).toEqual([
      "qei.stress_energy.unit_bridge",
      "qei.stress_energy.source_residual",
      "qei.stress_energy.qei_margin",
      "qei.stress_energy.energy_condition_gate",
      "qei.stress_energy.claim_boundary",
    ]);

    const qeiMargin = getQeiStressEnergyGroup("qei.stress_energy.qei_margin");
    expect(qeiMargin?.calculatorPayloadRefs).toContainEqual({
      badgeId: "nhm2.qei.sampling_window",
      payloadId: "qei_margin_difference_payload",
    });
    expect(qeiMargin?.theoryBadgeIds).toContain("nhm2.qei.worldline_dossier");
    expect(qeiMargin?.claimBoundaryBadgeIds).toContain("nhm2.claim_boundary.diagnostic_only");

    const source = getQeiStressEnergyGroup("qei.stress_energy.source_residual");
    expect(source?.theoryBadgeIds).toContain("nhm2.source.wall_t00_trace");
    expect(source?.theoryBadgeIds).toContain("nhm2.source.same_basis_tensor_authority");
  });
});
