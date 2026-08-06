import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateCasimirDpApparatusSearchStage4_2M } from "../shared/casimir-dp-apparatus-search-stage4-2m";
import { CasimirDpApparatusSearchStage4_2MConfig } from "../shared/contracts/casimir-dp-apparatus-search-stage4-2m.v1";

const config = CasimirDpApparatusSearchStage4_2MConfig.parse(JSON.parse(
  readFileSync("configs/research/casimir-dp-apparatus-search-stage4-2m.v1.json", "utf8"),
));

describe("Casimir-DP Stage-4.2M constrained apparatus search", () => {
  it("evaluates the full bounded sample without changing the frozen DP law", () => {
    const result = evaluateCasimirDpApparatusSearchStage4_2M(config);
    expect(result.candidate_count).toBe(200);
    expect(result.search_scope.frozen_dp_model.model_id).toBe("diosi_1989_gaussian_regularized_nondissipative");
    expect(result.search_scope.no_confirmatory_fitting).toBe(true);
  });

  it("finds a bounded synthetic commissioning neighborhood", () => {
    const result = evaluateCasimirDpApparatusSearchStage4_2M(config);
    expect(result.eligible_synthetic_candidate_count).toBeGreaterThanOrEqual(3);
    expect(result.outcome.synthetic_search).toBe("bounded_configuration_region_found");
    expect(result.best_candidate.passed_all_synthetic_gates).toBe(true);
    expect(Object.values(result.best_candidate.gates).every(Boolean)).toBe(true);
  });

  it("uses conservative density, phase, gas, identifiability, power, companion, and preparation gates", () => {
    const best = evaluateCasimirDpApparatusSearchStage4_2M(config).best_candidate;
    expect(best.dp.conservative_density_envelope_exponent).toBeGreaterThanOrEqual(0.001);
    expect(best.electromagnetic.echoed_phase_sigma_rad).toBeLessThan(config.gates.maximum_phase_sigma_rad);
    expect(best.gas.gas_to_dp_ratio).toBeLessThan(config.gates.maximum_gas_to_dp_ratio);
    expect(best.identifiability.required_paired_windows).toBeLessThanOrEqual(1600);
    expect(best.identifiability.forecast_power_at_maximum_windows).toBeGreaterThanOrEqual(0.8);
    expect(best.companion.synthetic_snr).toBeGreaterThanOrEqual(5);
    expect(best.state_preparation.mass_ratio_to_170kDa).toBeLessThanOrEqual(1_200_000);
  });

  it("fails closed when the pressure axis cannot suppress the gas proxy", () => {
    const impossible = {
      ...config,
      axes: { ...config.axes, pressure_Pa: [1e-9, 2e-9] },
    };
    const result = evaluateCasimirDpApparatusSearchStage4_2M(impossible);
    expect(result.eligible_synthetic_candidate_count).toBe(0);
    expect(result.outcome.synthetic_search).toBe("explicit_bounded_search_no_go");
  });

  it("never promotes synthetic selection into a physical or collapse claim", () => {
    const outcome = evaluateCasimirDpApparatusSearchStage4_2M(config).outcome;
    expect(outcome.empirical_authorities_ready).toBe(false);
    expect(outcome.physical_pilot_authorized).toBe(false);
    expect(outcome.confirmatory_campaign_authorized).toBe(false);
    expect(outcome.measured_evidence).toBe("not_ready");
    expect(outcome.collapse_identification).toBe("blocked");
    expect(outcome.manifold_dynamics).toBe("blocked");
    expect(outcome.observable_bridge_edges_added).toBe(0);
  });
});
