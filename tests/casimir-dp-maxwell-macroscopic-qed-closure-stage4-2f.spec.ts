import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CasimirDpMaxwellMacroscopicQedClosureStage4_2FConfig,
} from "../shared/contracts/casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f.v1";
import {
  evaluateCasimirDpMaxwellMacroscopicQedClosureStage4_2F,
} from "../shared/casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f";

const config = CasimirDpMaxwellMacroscopicQedClosureStage4_2FConfig.parse(
  JSON.parse(
    readFileSync(
      path.resolve(
        process.cwd(),
        "configs/research/casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f.v1.json",
      ),
      "utf8",
    ),
  ),
);

describe("Casimir-DP Stage-4.2F Maxwell/macroscopic-QED closure", () => {
  it("recovers transverse Maxwell propagation and polarization basis invariance", () => {
    const result =
      evaluateCasimirDpMaxwellMacroscopicQedClosureStage4_2F(config);
    expect(result.covariant_maxwell_closure.gate).toBe("pass");
    expect(
      result.covariant_maxwell_closure.plane_wave.normalized_residuals.maximum,
    ).toBeLessThanOrEqual(
      config.maxwell_recovery.maximum_normalized_residual,
    );
    expect(
      result.covariant_maxwell_closure.polarization.basis_invariance_error,
    ).toBeLessThanOrEqual(
      config.maxwell_recovery.maximum_basis_invariance_error,
    );
    expect(
      result.covariant_maxwell_closure.polarization
        .transverse_degrees_of_freedom,
    ).toBe(2);
  });

  it("recovers a passive Green/FDT control and the ideal Casimir stress identity", () => {
    const result =
      evaluateCasimirDpMaxwellMacroscopicQedClosureStage4_2F(config);
    expect(result.macroscopic_qed_green_fdt_closure.gate).toBe("pass");
    expect(result.macroscopic_qed_green_fdt_closure.passive_response).toBe(
      true,
    );
    expect(result.ideal_casimir_recovery.gate).toBe("pass");
    expect(
      result.ideal_casimir_recovery.pressure_to_energy_density_ratio,
    ).toBeCloseTo(3, 12);
    expect(result.ideal_casimir_recovery.authority).toBe(
      "analytic_limit_crosscheck_only",
    );
  });

  it("reuses the NHM2 method but fails closed on missing apparatus evidence", () => {
    const result =
      evaluateCasimirDpMaxwellMacroscopicQedClosureStage4_2F(config);
    expect(result.finite_geometry_maxwell_readiness.gate).toBe("pass");
    expect(result.finite_geometry_maxwell_readiness.method_contract_status)
      .toBe("blocked");
    expect(result.finite_geometry_maxwell_readiness.nhm2_method_reused).toBe(
      true,
    );
    expect(result.finite_geometry_maxwell_readiness.nhm2_evidence_reused).toBe(
      false,
    );
    expect(result.finite_geometry_maxwell_readiness.apparatus_authority).toBe(
      "not_ready",
    );
  });

  it("defines one exact DP model while keeping R0 sensitivity non-evidential", () => {
    const result =
      evaluateCasimirDpMaxwellMacroscopicQedClosureStage4_2F(config);
    expect(result.named_dp_model_domain.gate).toBe("pass");
    expect(result.named_dp_model_domain.registration.model_id).toBe(
      "diosi_1989_gaussian_regularized_nondissipative",
    );
    expect(result.named_dp_model_domain.R0_sensitivity_rows).toHaveLength(3);
    expect(
      result.named_dp_model_domain.R0_sensitivity_rows.every(
        (row) => row.crosscheck_gate === "pass",
      ),
    ).toBe(true);
    expect(result.named_dp_model_domain.sensitivity_role).toBe(
      "model_sensitivity_not_allowed_parameter_region",
    );
    expect(
      result.named_dp_model_domain.maxwell_or_cavity_frequency_enters_generator,
    ).toBe(false);
  });

  it("names the synthetic heating companion without promoting its SNR", () => {
    const result =
      evaluateCasimirDpMaxwellMacroscopicQedClosureStage4_2F(config);
    expect(result.companion_observable_audit.observable).toBe("heating_W");
    expect(result.companion_observable_audit.reported_synthetic_forecast_snr)
      .toBeCloseTo(1985.5322830887471, 12);
    expect(result.companion_observable_audit.independence_receipt_class).toBe(
      "synthetic",
    );
    expect(
      result.companion_observable_audit.detector_noise_receipt_available,
    ).toBe(false);
    expect(result.companion_observable_audit.measured_companion_authority).toBe(
      "not_ready",
    );
    expect(
      result.companion_observable_audit
        .inferred_signal_matches_selected_model,
    ).toBe(false);
    expect(
      result.companion_observable_audit
        .inferred_signal_matches_strongest_transported_model,
    ).toBe(false);
    expect(result.companion_observable_audit.model_identity_authority).toBe(
      "not_ready",
    );
  });

  it("separates the declared candidate mass from the strongest transported grid cell", () => {
    const result =
      evaluateCasimirDpMaxwellMacroscopicQedClosureStage4_2F(config);
    const audit = result.stage4_2c_transport_identity_audit;
    expect(audit.gate).toBe("pass");
    expect(audit.declared_candidate_point.mass_kg).toBe(1.94385e-16);
    expect(
      audit.strongest_transported_grid_point.transported_mass_kg,
    ).toBe(4.60765e-16);
    expect(
      audit.strongest_transported_grid_point.transported_branch_separation_m,
    ).toBe(1.6e-7);
    expect(
      audit.strongest_transported_grid_point.Gamma_DP_s,
    ).toBeCloseTo(0.13487168259863525, 12);
    expect(audit.declared_and_transported_mass_match).toBe(false);
    expect(audit.apparatus_identity_authority).toBe("not_ready");
  });

  it("preserves every empirical and interpretation blocker", () => {
    const result =
      evaluateCasimirDpMaxwellMacroscopicQedClosureStage4_2F(config);
    expect(result.hypothesis_separation.observable_bridge_edges_added).toBe(0);
    expect(result.final_gates).toEqual(
      config.final_status_policy,
    );
  });
});
