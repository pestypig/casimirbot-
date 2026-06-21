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
      "delta_m_energy_equivalent_payload",
      "delta_F_weight_equivalent_payload",
      "array_scaling_ratio_payload",
      "h00_proxy_weak_field_payload",
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
        "nhm2.source.component_authority_ledger",
        "nhm2.source.same_basis_tensor_authority",
        "nhm2.closure.coupled_pass_candidate",
        "nhm2.closure.regional_tensor_pass_path_harness",
        "nhm2.formal.lean_certificate",
        "nhm2.formal.certificate_hashes_pinned",
        "nhm2.formal.diagnostic_campaign_admissible",
        "nhm2.formal.claim_locks_closed",
        "nhm2.formal.negative_fixtures_fail_closed",
        "nhm2.experimental.physical_viability_campaign",
        "nhm2.experimental.theory_solve_roadmap",
        "nhm2.experimental.parameter_targets",
        "nhm2.experimental.prediction_freeze",
        "nhm2.experimental.tile_force_receipt",
        "nhm2.experimental.tile_cycle_energy_balance",
        "nhm2.experimental.array_scaling",
        "nhm2.experimental.full_apparatus_tensor",
        "nhm2.experimental.vacuum_weight",
        "nhm2.experimental.metric_upper_bound",
        "nhm2.experimental.invariant_metric_response",
        "nhm2.experimental.geodesic_response",
        "nhm2.experimental.independent_replication",
        "nhm2.claim_boundary.physical_viability_locked",
        "nhm2.claim_boundary.transport_locked",
        "nhm2.qei.worldline_dossier",
        "nhm2.natario.curvature_invariants",
        "nhm2.natario.invariant_audit",
        "nhm2.energy_condition.observer_robust_gate",
        "nhm2.regional_atlas.claim_boundary",
      ]),
    );
    for (const ref of path?.calculatorPayloadRefs ?? []) {
      expect(ref.badgeId.startsWith("nhm2.regional_atlas.")).toBe(false);
      expect(ref.badgeId.startsWith("nhm2.formal.")).toBe(false);
      expect(ref.badgeId).not.toBe("nhm2.experimental.physical_viability_campaign");
      expect(ref.badgeId).not.toBe("nhm2.experimental.theory_solve_roadmap");
      expect(ref.badgeId).not.toBe("nhm2.experimental.parameter_targets");
      expect(ref.badgeId).not.toBe("nhm2.experimental.vacuum_weight");
      expect(ref.badgeId).not.toBe("nhm2.experimental.invariant_metric_response");
      expect(ref.badgeId).not.toBe("nhm2.experimental.geodesic_response");
    }
    expect(path?.claimBoundaryBadgeIds).toContain("nhm2.claim_boundary.diagnostic_only");

    const claimBoundary = WARP_GR_NHM2_GROUPS.find((group) => group.id === "warp.nhm2.claim_boundary");
    expect(claimBoundary?.theoryBadgeIds).toEqual(
      expect.arrayContaining([
        "nhm2.formal.claim_locks_closed",
        "nhm2.formal.diagnostic_campaign_admissible",
        "nhm2.claim_boundary.physical_viability_locked",
        "nhm2.claim_boundary.transport_locked",
      ]),
    );
  });
});
