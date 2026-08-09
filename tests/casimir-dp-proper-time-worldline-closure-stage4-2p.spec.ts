import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  evaluateCasimirDpProperTimeWorldlineClosureStage4_2P,
  internalTimeDilationCoherence,
  properTimeToMatterWavePhase,
  weakFieldDifferentialProperTime,
} from "../shared/casimir-dp-proper-time-worldline-closure-stage4-2p";
import { CasimirDpProperTimeWorldlineClosureStage4_2PConfig } from "../shared/contracts/casimir-dp-proper-time-worldline-closure-stage4-2p.v1";

const config = CasimirDpProperTimeWorldlineClosureStage4_2PConfig.parse(JSON.parse(
  readFileSync("configs/research/casimir-dp-proper-time-worldline-closure-stage4-2p.v1.json", "utf8"),
));

describe("Casimir-DP Stage-4.2P proper-time/worldline closure", () => {
  it("recovers Minkowski, equal-worldline, coordinate-offset, and symmetric-gradient limits", () => {
    const result = evaluateCasimirDpProperTimeWorldlineClosureStage4_2P(config);
    expect(result.recoveries).toMatchObject({
      minkowski: "pass",
      equal_worldline: "pass",
      coordinate_potential_offset: "pass",
      symmetric_gradient_nominal: "pass",
      dp_echo_invariance: "pass",
      software_closure: "pass",
    });
    expect(weakFieldDifferentialProperTime({
      duration_s: 2,
      delta_potential_m2_s2: 5,
      delta_v2_m2_s2: 10,
      c_m_s: config.constants.c_m_s,
    })).toBe(0);
  });

  it("recovers the vertical weak-field phase m g d T / hbar", () => {
    const result = evaluateCasimirDpProperTimeWorldlineClosureStage4_2P(config);
    const expected = config.apparatus.mass_kg * config.constants.earth_g_m_s2 *
      Math.hypot(...config.apparatus.branch_separation_vector_m) * config.apparatus.hold_time_s /
      config.constants.hbar_J_s;
    expect(result.weak_field_references.full_vertical_phase_rad).toBeCloseTo(expected, 10);
    const phaseFromTau = Math.abs(properTimeToMatterWavePhase(
      result.weak_field_references.full_vertical_delta_proper_time_s,
      config.apparatus.mass_kg,
      config.constants.c_m_s,
      config.constants.hbar_J_s,
    ));
    expect(phaseFromTau).toBeCloseTo(expected, 10);
  });

  it("keeps the nominal horizontal Earth-redshift term zero but exposes tilt sensitivity", () => {
    const result = evaluateCasimirDpProperTimeWorldlineClosureStage4_2P(config);
    expect(result.weak_field_references.horizontal_nominal_earth_delta_potential_m2_s2).toBe(0);
    expect(result.echo_and_covariance.component_phase_sigmas_rad.earth_tilt_rad).toBeGreaterThan(0.017);
    expect(result.echo_and_covariance.component_phase_sigmas_rad.earth_tilt_rad).toBeLessThan(0.019);
    expect(result.echo_and_covariance.gate).toBe("pass");
  });

  it("fails closed when signed static phase is not echo-suppressed", () => {
    const unsafe = structuredClone(config);
    unsafe.echo_response.static_signed_phase_residual_fraction = 1;
    const result = evaluateCasimirDpProperTimeWorldlineClosureStage4_2P(unsafe);
    expect(result.echo_and_covariance.total_phase_sigma_rad).toBeGreaterThan(100);
    expect(result.echo_and_covariance.gate).toBe("not_ready");
    expect(result.standing.physical_pilot_authorized).toBe(false);
  });

  it("integrates the declared frequency-resolved echo bins in quadrature", () => {
    const result = evaluateCasimirDpProperTimeWorldlineClosureStage4_2P(config);
    const expectedVariance = (config.weak_field.branch_tilt_sigma_rad * config.echo_response.static_signed_phase_residual_fraction) ** 2 +
      config.echo_response.spectral_bins.reduce((sum, bin) => sum +
        (bin.tilt_asd_rad_per_sqrt_Hz * Math.sqrt(bin.bandwidth_Hz) * bin.echo_transfer_magnitude) ** 2, 0);
    expect(result.echo_and_covariance.filtered_tilt_sigma_rad ** 2).toBeCloseTo(expectedVariance, 12);
  });

  it("bounds internal-energy dephasing without treating the sphere as a Compton clock", () => {
    expect(internalTimeDilationCoherence(0, 1, config.constants.hbar_J_s)).toEqual({ chi: 0, visibility: 1 });
    const result = evaluateCasimirDpProperTimeWorldlineClosureStage4_2P(config);
    expect(result.internal_energy_time_dilation.chi).toBeGreaterThan(0);
    expect(result.internal_energy_time_dilation.gate).toBe("pass");
    expect(result.graph_policy.compton_clock_claim_registered).toBe(false);
    expect(result.graph_policy.proper_time_to_collapse_transfer_registered).toBe(false);
  });

  it("does not apply echo or ordinary phase to the frozen Diósi exponent", () => {
    const result = evaluateCasimirDpProperTimeWorldlineClosureStage4_2P(config);
    expect(result.frozen_diosi_comparator.conservative_exponent).toBe(0.004358516271770489);
    expect(result.frozen_diosi_comparator.gaussian_exponent).toBe(0.029511464722144533);
    expect(result.frozen_diosi_comparator.modified).toBe(false);
    expect(result.frozen_diosi_comparator.echo_or_path_swap_applied).toBe(false);
    expect(result.frozen_diosi_comparator.combined_with_ordinary_phase).toBe(false);
    expect(result.graph_policy.observable_bridge_edges_added).toBe(0);
  });
});
