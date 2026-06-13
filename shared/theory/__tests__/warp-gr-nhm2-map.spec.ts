import { describe, expect, it } from "vitest";
import { WARP_GR_NHM2_GROUPS } from "../warp-gr-nhm2-map";

describe("Warp / GR / NHM2 map", () => {
  it("provides grouped diagnostic paths for the atlas lens", () => {
    expect(WARP_GR_NHM2_GROUPS.map((group) => group.id)).toEqual([
      "warp.gr.reference_roots",
      "warp.nhm2.geometry_sample",
      "warp.nhm2.source_closure",
      "warp.nhm2.diagnostic_path",
      "warp.nhm2.claim_boundary",
    ]);

    const path = WARP_GR_NHM2_GROUPS.find((group) => group.id === "warp.nhm2.diagnostic_path");
    expect(path?.calculatorPayloadRefs.map((ref) => ref.payloadId)).toEqual([
      "proper_time_scalar_offset_payload",
      "rho_equals_E_over_V_payload",
      "average_power_from_cycle_energy_payload",
      "wall_t00_source_residual_payload",
      "source_residual_difference_payload",
      "qei_margin_difference_payload",
    ]);
    expect(path?.theoryBadgeIds).toEqual(
      expect.arrayContaining([
        "nhm2.source.wall_t00_trace",
        "nhm2.closure.wall_t00_source_residual",
        "nhm2.tensor.full_authority_gate",
        "nhm2.tensor.same_chart_full_tensor",
        "nhm2.regional_atlas.available",
        "nhm2.regional_atlas.partition_of_unity",
        "nhm2.regional_atlas.transition_supports",
        "nhm2.regional_atlas.derivative_support",
        "nhm2.regional_atlas.consumer_congruence",
        "nhm2.source.same_basis_tensor_authority",
        "nhm2.qei.worldline_dossier",
        "nhm2.natario.curvature_invariants",
        "nhm2.natario.invariant_audit",
        "nhm2.energy_condition.observer_robust_gate",
        "nhm2.regional_atlas.claim_boundary",
      ]),
    );
    for (const ref of path?.calculatorPayloadRefs ?? []) {
      expect(ref.badgeId.startsWith("nhm2.regional_atlas.")).toBe(false);
    }
    expect(path?.claimBoundaryBadgeIds).toContain("nhm2.claim_boundary.diagnostic_only");
  });
});
