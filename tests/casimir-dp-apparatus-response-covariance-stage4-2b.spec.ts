import { describe, expect, it } from "vitest";
import { HBAR } from "@shared/physics-const";
import {
  evaluateCasimirDpApparatusResponseCovarianceStage4_2B,
} from "@shared/casimir-dp-apparatus-response-covariance-stage4-2b";

const HASH = "a".repeat(64);
const receipt = (source = "synthetic://receipt") => ({
  source_ref: source,
  expected_sha256: HASH,
  actual_sha256: HASH,
  integrity_verified: true,
});
const complex = (re: number, im = 0) => ({ re, im });
const matrix2 = (
  a: number,
  b: number,
  d: number,
) => [
  [complex(a), complex(b)],
  [complex(b), complex(d)],
];
const identity2 = [
  [complex(1), complex(0)],
  [complex(0), complex(1)],
];
const zero2 = matrix2(0, 0, 0);

function baseInput() {
  const omega = [-2, -1, 0, 1, 2];
  const physical = matrix2(2e-68, 0.5e-68, 1e-68);
  const selfNoise = matrix2(0.2e-68, 0, 0.1e-68);
  const observed = matrix2(2.2e-68, 0.5e-68, 1.1e-68);
  return {
    schema_version:
      "casimir_dp_apparatus_response_covariance_stage4_2b/1",
    evidence_class: "synthetic_fixture",
    acquisition_audit: {
      clocks_synchronized: true,
      anti_alias_filter_verified: true,
      bandwidth_coverage_verified: true,
      response_phase_calibrated: true,
      response_phase_max_error_rad: 1e-4,
      response_phase_tolerance_rad: 1e-3,
      calibration_age_s: 10,
      maximum_calibration_age_s: 100,
      audit_receipt: receipt("synthetic://acquisition-audit"),
    },
    sensor_forward_model: {
      learned_from: "calibration_or_pilot",
      frozen_before_confirmatory: true,
      forward_model_receipt: receipt("synthetic://sensor-model"),
      channel_ids: ["vibration", "patch"],
      physical_units: ["m s^-2", "V"],
      spectrum_convention: "two_sided_angular_frequency",
      cross_covariances_explicit: true,
      physical_sensor_cross_disposition: "bounded_zero_with_receipt",
      physical_sensor_cross_receipt: receipt("synthetic://cross-bound"),
      hermiticity_relative_tolerance: 1e-10,
      psd_relative_tolerance: 1e-10,
      two_sided_frequency_absolute_tolerance_rad_s: 1e-12,
      two_sided_relative_tolerance: 1e-10,
      forward_recovery_relative_tolerance: 1e-10,
      samples: omega.map((omega_rad_s) => ({
        omega_rad_s,
        response: identity2,
        observed_cross_spectrum: observed,
        sensor_self_noise_cross_spectrum: selfNoise,
        physical_sensor_noise_cross_spectrum: zero2,
      })),
    },
    predecessor_reconciliation: {
      qed_green_noise: {
        module_id: "shared/casimir-dp-qed-green-noise.ts",
        role: "upstream_green_fdt_phase_noise_and_heating_prediction",
        output_receipt: receipt("synthetic://green-fdt-output"),
      },
      radiative_thermal_closure: {
        module_id: "shared/casimir-dp-radiative-thermal-closure.ts",
        role: "upstream_non_gaussian_thermal_localization_prediction",
        output_receipt: receipt("synthetic://thermal-output"),
      },
      scalar_predecessor_psd_used_as_full_covariance: false,
      duplicate_kernel_vote_counting_allowed: false,
    },
    gaussian_cells: [{
      cell_id: "cell-1",
      hold_time_s: 1,
      energy_transfer_J_per_physical_unit: omega.map(() => [
        complex(1),
        complex(0.25),
      ]),
      sequence_filter_abs2_s2: omega.map(() => 1),
      coherent_trace: {
        time_s: [0, 1],
        branch_a_energy_J: [HBAR, HBAR],
        branch_b_energy_J: [0, 0],
      },
      non_gaussian_contributions: [{
        contribution_id: "gas-1",
        process: "gas_collision",
        chi: 0.1,
        coherent_phase_rad: 0,
        diffusion_limit_used: false,
        diffusion_limit_validated: false,
        receipt: receipt("synthetic://gas-kernel"),
      }],
    }],
    covariance: {
      row_cell_ids: ["cell-1"],
      measured_coherence_covariance: [[4]],
      ordinary_input_covariance: [[1]],
      measured_ordinary_cross_covariance: [[0.5]],
      ordinary_measured_cross_covariance: [[0.5]],
      ordinary_jacobian: [[2]],
      omitted_cross_covariance: false,
      common_calibration_ancestry_receipt:
        receipt("synthetic://covariance-ancestry"),
      maximum_condition_number: 1e6,
      symmetry_relative_tolerance: 1e-12,
      positive_definite_relative_tolerance: 1e-14,
      regularization: {
        kind: "none",
      },
    },
    channel_ownership: [{
      contribution_id: "vibration-spectrum",
      category: "vibration_inertial",
      owner_runtime: "stage4_2b_runtime_c",
      process_class: "gaussian_spectral",
      source_kind: "measured_transfer",
      shared_term_rule: null,
    }],
    injection_checks: [
      {
        injection_id: "line-1",
        kind: "spectral_line",
        expected_frequency_rad_s: 1,
        recovered_frequency_rad_s: 1.001,
        maximum_frequency_error_rad_s: 0.01,
        expected_amplitude: 2,
        recovered_amplitude: 2.001,
        maximum_relative_amplitude_error: 0.01,
        expected_correlation: 0,
        recovered_correlation: 0,
        maximum_absolute_correlation_error: 0.01,
      },
      {
        injection_id: "correlated-1",
        kind: "correlated_channels",
        expected_frequency_rad_s: 1,
        recovered_frequency_rad_s: 1,
        maximum_frequency_error_rad_s: 0.01,
        expected_amplitude: 1,
        recovered_amplitude: 1,
        maximum_relative_amplitude_error: 0.01,
        expected_correlation: 0.5,
        recovered_correlation: 0.501,
        maximum_absolute_correlation_error: 0.01,
      },
    ],
  };
}

describe("Casimir-DP Stage-4.2B Runtime C", () => {
  it("separates sensor self-noise and propagates the full residual covariance", () => {
    const result =
      evaluateCasimirDpApparatusResponseCovarianceStage4_2B(
        baseInput() as never,
      );

    expect(result.status).toBe("pass");
    expect(result.physical_disturbance_separation.gate).toBe("pass");
    expect(
      result.physical_disturbance_separation
        .spectra[0].cross_spectrum[0][0].re,
    ).toBeCloseTo(2e-68, 12);
    expect(
      result.physical_disturbance_separation
        .spectra[0].cross_spectrum[0][0].re / 2.2e-68,
    ).not.toBeCloseTo(1, 6);
    expect(result.cell_predictions[0].gaussian_chi).toBeGreaterThan(0);
    expect(result.cell_predictions[0].total_ordinary_chi).toBeCloseTo(
      result.cell_predictions[0].gaussian_chi! + 0.1,
      12,
    );
    expect(
      result.cell_predictions[0].ordinary_coherent_phase_rad,
    ).toBeCloseTo(-1, 12);
    expect(result.residual_covariance.matrix[0][0]).toBeCloseTo(6, 12);
    expect(
      result.residual_covariance.whitening_cholesky_lower?.[0][0],
    ).toBeCloseTo(Math.sqrt(6), 12);
    expect(result.measured_evidence).toBe("not_ready");
    expect(result.collapse_identification).toBe("blocked");
  });

  it("fails closed when a non-Hermitian observed spectrum cannot be physical", () => {
    const input = baseInput();
    input.sensor_forward_model.samples[2].observed_cross_spectrum[0][1] =
      complex(3e-68);

    const result =
      evaluateCasimirDpApparatusResponseCovarianceStage4_2B(input as never);

    expect(result.status).toBe("blocked");
    expect(result.failures.map((row) => row.code)).toContain(
      "physical_disturbance_spectrum_not_recovered",
    );
  });

  it("rejects a Hermitian but non-PSD sensor self-noise spectrum", () => {
    const input = baseInput();
    input.sensor_forward_model.samples[2]
      .sensor_self_noise_cross_spectrum = matrix2(0.1e-68, 0.2e-68, 0.1e-68);

    const result =
      evaluateCasimirDpApparatusResponseCovarianceStage4_2B(input as never);

    expect(result.status).toBe("blocked");
    expect(result.failures.map((row) => row.code)).toContain(
      "physical_disturbance_spectrum_not_recovered",
    );
    expect(
      result.physical_disturbance_separation.diagnostics[2]
        .self_noise_minimum_eigenvalue,
    ).toBeLessThan(0);
  });

  it("preserves spectral row identity when a middle response is singular", () => {
    const input = baseInput();
    input.sensor_forward_model.samples[2].response = zero2;

    const result =
      evaluateCasimirDpApparatusResponseCovarianceStage4_2B(input as never);

    expect(result.status).toBe("blocked");
    expect(
      result.physical_disturbance_separation.spectra.map(
        (row) => row.omega_rad_s,
      ),
    ).toEqual([-2, -1, 0, 1, 2]);
    expect(
      result.physical_disturbance_separation.spectra[2].cross_spectrum,
    ).toBeNull();
    expect(
      result.physical_disturbance_separation.spectra[3].cross_spectrum,
    ).not.toBeNull();
    expect(result.cell_predictions[0].gaussian_chi).toBeNull();
    expect(JSON.stringify(result)).not.toMatch(/NaN|Infinity/);
  });

  it("rejects mean Casimir pressure as a noise spectrum", () => {
    const input = baseInput();
    input.channel_ownership[0].source_kind =
      "mean_casimir_pressure_proxy";

    const result =
      evaluateCasimirDpApparatusResponseCovarianceStage4_2B(input as never);

    expect(result.status).toBe("blocked");
    expect(result.failures.map((row) => row.code)).toContain(
      "mean_casimir_pressure_is_not_noise_psd",
    );
  });

  it("returns not_identifiable for a singular scored covariance", () => {
    const input = baseInput();
    input.covariance.measured_coherence_covariance = [[0]];
    input.covariance.ordinary_input_covariance = [[0]];
    input.covariance.measured_ordinary_cross_covariance = [[0]];
    input.covariance.ordinary_measured_cross_covariance = [[0]];

    const result =
      evaluateCasimirDpApparatusResponseCovarianceStage4_2B(input as never);

    expect(result.status).toBe("not_identifiable");
    expect(result.residual_covariance.gate).toBe("not_identifiable");
    expect(result.residual_covariance.condition_number).toBeNull();
    expect(
      JSON.stringify(result),
    ).not.toContain("Infinity");
  });

  it("does not allow confirmatory-trained jitter to rescue singular covariance", () => {
    const input = baseInput();
    input.covariance.measured_coherence_covariance = [[0]];
    input.covariance.ordinary_input_covariance = [[0]];
    input.covariance.measured_ordinary_cross_covariance = [[0]];
    input.covariance.ordinary_measured_cross_covariance = [[0]];
    input.covariance.regularization = {
      kind: "diagonal_jitter",
      jitter_variance: 1,
      learned_from: "confirmatory",
      frozen_before_confirmatory: false,
      coverage_validated: false,
      receipt: receipt("synthetic://invalid-jitter"),
    };

    const result =
      evaluateCasimirDpApparatusResponseCovarianceStage4_2B(input as never);

    expect(result.status).toBe("not_identifiable");
    expect(result.failures.map((row) => row.code)).toContain(
      "confirmatory_trained_covariance_rescue",
    );
    expect(result.residual_covariance.matrix[0][0]).toBe(0);
  });

  it("requires Sigma_xy and Sigma_yx to be explicit transpose pairs", () => {
    const input = baseInput();
    input.covariance.ordinary_measured_cross_covariance = [[0.25]];

    const result =
      evaluateCasimirDpApparatusResponseCovarianceStage4_2B(input as never);

    expect(result.status).toBe("blocked");
    expect(result.failures.map((row) => row.code)).toContain(
      "residual_cross_covariance_invalid",
    );
  });
});
