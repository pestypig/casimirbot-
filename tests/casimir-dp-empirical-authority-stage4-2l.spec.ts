import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateCasimirDpEmpiricalAuthorityStage4_2L } from "../shared/casimir-dp-empirical-authority-stage4-2l";
import {
  CasimirDpApparatusDesignManifestStage4_2L,
  CasimirDpEmpiricalAuthorityFixtureStage4_2L,
  CasimirDpEmpiricalAuthorityStage4_2LConfig,
} from "../shared/contracts/casimir-dp-empirical-authority-stage4-2l.v1";

const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const config = CasimirDpEmpiricalAuthorityStage4_2LConfig.parse(json("configs/research/casimir-dp-empirical-authority-stage4-2l.v1.json"));
const fixture = CasimirDpEmpiricalAuthorityFixtureStage4_2L.parse(json(config.fixture.path));
const apparatus = CasimirDpApparatusDesignManifestStage4_2L.parse(json(config.apparatus_manifest.path));
const evaluate = () => evaluateCasimirDpEmpiricalAuthorityStage4_2L({ config, fixture, apparatus });

describe("Casimir-DP Stage-4.2L empirical-authority closure", () => {
  it("freezes a dimensional 3D tangential reference without claiming as-built authority", () => {
    const result = evaluate();
    expect(result.apparatus_manifest.branch_vector_m).toEqual([1.6e-7, 0, 0]);
    expect(result.apparatus_manifest.plate_normal).toEqual([0, 0, 1]);
    expect(result.apparatus_manifest.tangential_dot_product_m).toBe(0);
    expect(result.apparatus_manifest.as_built_receipts_ready).toBe(false);
  });

  it("crosschecks the finite-rectangle surrogate while withholding full Green authority", () => {
    const result = evaluate();
    expect(result.finite_geometry.numerical_crosscheck_gate).toBe("pass");
    expect(result.finite_geometry.energy_crosscheck_relative_error).toBeLessThan(1e-4);
    expect(result.finite_geometry.nominal_analytic.phase_rad).toBe(0);
    expect(result.finite_geometry.full_maxwell_green_authority).toBe("not_ready");
  });

  it("turns tangential symmetry fragility into an explicit phase-covariance no-go", () => {
    const result = evaluate();
    expect(result.phase_covariance.synthetic_design_gate).toBe("no_go");
    expect(result.phase_covariance.predicted_sigma_phi_rad).toBeGreaterThan(1e4);
    expect(result.phase_covariance.required_one_sigma_controls.lateral_centering_m).toBeLessThan(1e-13);
    expect(result.phase_covariance.required_one_sigma_controls.branch_tilt_rad).toBeLessThan(1e-11);
    expect(result.phase_covariance.empirical_authority).toBe("not_ready");
  });

  it("evaluates the QLBE structure and preserves its measured-input no-go", () => {
    const result = evaluate();
    expect(result.qlbe.qlbe_to_dp_rate_ratio).toBeGreaterThan(700);
    expect(result.qlbe.pressure_for_target_fraction_of_dp_Pa).toBeLessThan(3e-15);
    expect(result.qlbe.proxy_gate).toBe("no_go");
    expect(result.qlbe.measured_authority).toBe("not_ready");
  });

  it("quantifies the state-preparation gap and current DP scalar bound", () => {
    const result = evaluate();
    expect(result.state_preparation.mass_ratio).toBeGreaterThan(6e5);
    expect(result.state_preparation.separation_ratio).toBeCloseTo(160 / 133, 10);
    expect(result.state_preparation.empirical_sequence).toBe("not_ready");
    expect(result.external_bound.scalar_point_excluded).toBe(false);
    expect(result.external_bound.ratio_to_90CL_lower_bound).toBeCloseTo(1e-7 / 4.9e-10, 10);
    expect(result.external_bound.exact_composite_mapping).toBe("not_ready");
  });

  it("expands the mass-density envelope without promoting it to material authority", () => {
    const result = evaluate();
    expect(result.mass_density_robustness.rows).toHaveLength(4);
    expect(result.mass_density_robustness.maximum_to_minimum_ratio).toBeGreaterThan(6);
    expect(result.mass_density_robustness.maximum_to_minimum_ratio).toBeLessThan(7);
    expect(result.hypothesis_separation.observable_bridge_edges_added).toBe(0);
    expect(result.outcome.residual_attribution).toBe("blocked");
    expect(result.outcome.confirmatory_campaign_authorized).toBe(false);
  });
});
