import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CasimirDpCausalConeClockStage4_2EConfig,
} from "../shared/contracts/casimir-dp-causal-cone-clock-stage4-2e.v1";
import {
  evaluateCasimirDpCausalConeClockStage4_2E,
} from "../shared/casimir-dp-causal-cone-clock-stage4-2e";

const config = CasimirDpCausalConeClockStage4_2EConfig.parse(
  JSON.parse(
    readFileSync(
      path.resolve(
        process.cwd(),
        "configs/research/casimir-dp-causal-cone-clock-stage4-2e.v1.json",
      ),
      "utf8",
    ),
  ),
);

describe("Casimir-DP Stage-4.2E causal-cone and clock congruence", () => {
  it("reconstructs local ADM null roots and timelike clocks", () => {
    const result = evaluateCasimirDpCausalConeClockStage4_2E(config);
    expect(result.adm_local_causal_recovery.gate).toBe("pass");
    expect(
      result.adm_local_causal_recovery
        .maximum_null_constraint_absolute_error,
    ).toBeLessThanOrEqual(1e-12);
    const minkowski = result.adm_local_causal_recovery.cases[0];
    expect(
      minkowski?.null_coordinate_velocity_over_c.directional_roots,
    ).toEqual({ minus: -1, plus: 1 });
    expect(minkowski?.timelike_clock.rate_d_tau_d_t).toBe(1);
  });

  it("keeps the NHM2 L/c reference distinct from metric-derived null time", () => {
    const result = evaluateCasimirDpCausalConeClockStage4_2E(config);
    const nhm2 = result.adm_local_causal_recovery.cases.find(
      (row) => row.case_id === "nhm2_centerline_lapse_reference",
    );
    expect(nhm2?.timelike_clock.rate_d_tau_d_t).toBe(0.7);
    expect(
      nhm2?.null_coordinate_velocity_over_c.directional_roots,
    ).toEqual({ minus: -0.7, plus: 0.7 });
    expect(nhm2?.bounded_light_time.plus_to_flat_reference_ratio).toBeCloseTo(
      1 / 0.7,
      14,
    );
    expect(
      nhm2?.bounded_light_time.reference_is_solved_null_geodesic,
    ).toBe(false);
  });

  it("recovers bounded Schwarzschild radial-null and radar-clock relations", () => {
    const result = evaluateCasimirDpCausalConeClockStage4_2E(config);
    expect(result.bounded_radial_null_recovery.gate).toBe("pass");
    expect(
      result.bounded_radial_null_recovery.numerical_relative_error,
    ).toBeLessThanOrEqual(1e-12);
    expect(
      result.bounded_radial_null_recovery.coordinate_shapiro_excess_s,
    ).toBeGreaterThan(0);
    expect(
      result.bounded_radial_null_recovery
        .emitter_radar_round_trip_proper_time_s,
    ).toBeGreaterThan(0);
  });

  it("separates the Casimir gravity screen from QED effective propagation", () => {
    const result = evaluateCasimirDpCausalConeClockStage4_2E(config);
    expect(result.casimir_semiclassical_screen.gate).toBe("pass");
    expect(
      result.casimir_semiclassical_screen.metric_response_authority,
    ).toBe("not_ready");
    expect(
      result.casimir_semiclassical_screen
        .fractional_light_time_bound_over_gap,
    ).toBeLessThan(1e-40);
    expect(result.qed_effective_propagation_control.gate).toBe("pass");
    expect(
      result.qed_effective_propagation_control
        .qed_to_gravity_fractional_scale_separation,
    ).toBeGreaterThan(1e10);
    expect(
      result.qed_effective_propagation_control.front_velocity_claim_allowed,
    ).toBe(false);
  });

  it("admits only the frozen branch-density relation to the DP rate", () => {
    const result = evaluateCasimirDpCausalConeClockStage4_2E(config);
    const admitted = result.causal_signature_separation.matrix.filter(
      (row) => row.admitted_to_dp_rate,
    );
    expect(admitted).toHaveLength(1);
    expect(admitted[0]?.signature_id).toBe(
      "branch_density_difference_to_dp_rate",
    );
    expect(
      result.causal_signature_separation.observable_bridge_edges_added,
    ).toBe(0);
  });
});
