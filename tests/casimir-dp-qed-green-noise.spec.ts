import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CasimirDpQedGreenNoiseInput,
  evaluateCasimirDpQedGreenNoise,
} from "../shared/casimir-dp-qed-green-noise";

const fixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-stage3-qed-green-noise.synthetic.v1.json",
);
const fixture = CasimirDpQedGreenNoiseInput.parse(
  JSON.parse(readFileSync(fixturePath, "utf8")),
);

type Input = typeof fixture;

function clone(): Input {
  return structuredClone(fixture);
}

function scaleNoise(input: Input, factor: number): void {
  input.noise.energy_difference_psd_J2_s =
    input.noise.energy_difference_psd_J2_s.map((value) => value * factor);
  input.noise.energy_difference_psd_standard_uncertainty_J2_s =
    input.noise.energy_difference_psd_standard_uncertainty_J2_s.map(
      (value) => value * factor,
    );
  input.noise.force_noise_psd_N2_s =
    input.noise.force_noise_psd_N2_s.map((matrix) =>
      matrix.map((row) => row.map((value) => value * factor))
    ) as Input["noise"]["force_noise_psd_N2_s"];
  input.noise.force_noise_psd_standard_uncertainty_N2_s =
    input.noise.force_noise_psd_standard_uncertainty_N2_s.map((matrix) =>
      matrix.map((row) => row.map((value) => value * factor))
    ) as Input["noise"]["force_noise_psd_standard_uncertainty_N2_s"];
}

function zeroCoupling(limit: "zero_coupling" | "infinite_distance"): Input {
  const input = clone();
  input.coupling_limit_case = limit;
  input.branch_trace.branch_a_potential_J = [0, 0];
  input.branch_trace.branch_b_potential_J = [0, 0];
  input.branch_trace.branch_a_force_N = [[0, 0, 0], [0, 0, 0]];
  input.branch_trace.branch_b_force_N = [[0, 0, 0], [0, 0, 0]];
  input.branch_trace.differential_force_gradient_N_m = [0, 0];
  input.noise.energy_difference_psd_J2_s = [0, 0, 0, 0, 0];
  input.noise.energy_difference_psd_standard_uncertainty_J2_s =
    [0, 0, 0, 0, 0];
  input.noise.force_noise_psd_N2_s = Array.from(
    { length: 5 },
    () => [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
  ) as Input["noise"]["force_noise_psd_N2_s"];
  return input;
}

describe("Casimir-DP Stage-3 measurement-constrained QED runtime", () => {
  it("checks dimensions, convention, reciprocity, and nonnegative noise covariance", () => {
    const result = evaluateCasimirDpQedGreenNoise(fixture);
    expect(result.noise.spectrum_convention)
      .toBe("two_sided_angular_frequency");
    expect(result.green_tensor_diagnostics.reciprocity_gate).toBe("pass");
    expect(result.noise.hermitian_real_covariance_gate).toBe("pass");
    expect(result.noise.nonnegative_covariance_gate).toBe("pass");
    expect(result.noise.two_sided_frequency_grid.gate).toBe("pass");
    expect(result.noise.two_sided_spectrum_symmetry.gate).toBe("pass");
    expect(result.noise.linearized_energy_force_check.gate).toBe("pass");

    const wrongSidedness = clone() as unknown as Record<string, unknown>;
    (wrongSidedness.noise as Record<string, unknown>).spectrum_convention =
      "one_sided_hz";
    expect(() => CasimirDpQedGreenNoiseInput.parse(wrongSidedness)).toThrow();
  });

  it("fails reciprocity and PSD gates on nonphysical tables", () => {
    const nonreciprocal = clone();
    nonreciprocal.green_tensor.samples[0].real_m_inv[0][1] = 0.4;
    expect(
      evaluateCasimirDpQedGreenNoise(nonreciprocal)
        .green_tensor_diagnostics.reciprocity_gate,
    ).toBe("not_ready");

    const indefinite = clone();
    indefinite.noise.force_noise_psd_N2_s[0] = [
      [1e-50, 2e-50, 0],
      [2e-50, 1e-50, 0],
      [0, 0, 1e-50],
    ];
    const result = evaluateCasimirDpQedGreenNoise(indefinite);
    expect(result.noise.nonnegative_covariance_gate).toBe("not_ready");

    const asymmetricAtPhysicalScale = clone();
    asymmetricAtPhysicalScale.noise.force_noise_psd_N2_s[0][0][1] = 1e-51;
    expect(
      evaluateCasimirDpQedGreenNoise(asymmetricAtPhysicalScale)
        .noise.hermitian_real_covariance_gate,
    ).toBe("not_ready");
  });

  it("fails closed when a declared two-sided spectrum is not mirror symmetric", () => {
    const asymmetric = clone();
    asymmetric.noise.energy_difference_psd_J2_s[4] *= 1.2;
    const result = evaluateCasimirDpQedGreenNoise(asymmetric);
    expect(result.noise.two_sided_spectrum_symmetry.gate).toBe("not_ready");
    expect(result.readiness.measured_qed_lane).toBe("not_ready");
  });

  it("recovers the zero-coupling and infinite-distance limits", () => {
    for (const limit of ["zero_coupling", "infinite_distance"] as const) {
      const result = evaluateCasimirDpQedGreenNoise(zeroCoupling(limit));
      expect(result.mean_interaction.phase_rad).toBe(0);
      expect(result.decoherence.ramsey_chi).toBe(0);
      expect(result.heating.occupation_heating_rate_s).toBe(0);
      expect(result.limits.gate).toBe("pass");
    }
  });

  it("propagates source-backed material-loss and temperature noise changes", () => {
    const baseline = evaluateCasimirDpQedGreenNoise(fixture);
    const warmerLossier = clone();
    warmerLossier.material.loss_parameter *= 2;
    warmerLossier.geometry.temperature_K *= 2;
    scaleNoise(warmerLossier, 2);
    const changed = evaluateCasimirDpQedGreenNoise(warmerLossier);
    expect(changed.decoherence.ramsey_chi)
      .toBeCloseTo(2 * baseline.decoherence.ramsey_chi, 12);
    expect(changed.heating.occupation_heating_rate_s)
      .toBeCloseTo(2 * baseline.heating.occupation_heating_rate_s!, 12);
  });

  it("propagates Kramers-Kronig and input uncertainties into the output", () => {
    const baseline = evaluateCasimirDpQedGreenNoise(fixture);
    const uncertain = clone();
    uncertain.material.kramers_kronig.maximum_relative_error = 3e-6;
    uncertain.branch_trace.branch_a_potential_standard_uncertainty_J =
      [5e-33, 5e-33];
    uncertain.branch_trace.branch_b_potential_standard_uncertainty_J =
      [5e-33, 5e-33];
    uncertain.noise.energy_difference_psd_standard_uncertainty_J2_s =
      uncertain.noise.energy_difference_psd_standard_uncertainty_J2_s.map(
        (value) => value * 4,
      );
    const result = evaluateCasimirDpQedGreenNoise(uncertain);
    expect(result.material_diagnostics.kramers_kronig_gate).toBe("not_ready");
    expect(result.mean_interaction.phase_standard_uncertainty_rad)
      .toBeGreaterThan(baseline.mean_interaction.phase_standard_uncertainty_rad);
    expect(result.decoherence.ramsey_chi_standard_uncertainty)
      .toBeGreaterThan(baseline.decoherence.ramsey_chi_standard_uncertainty);
    expect(result.decoherence.echo_chi_standard_uncertainty)
      .toBeGreaterThan(baseline.decoherence.echo_chi_standard_uncertainty);
    expect(result.mean_interaction.branch_a_mean_potential_standard_uncertainty_J)
      .toBeGreaterThan(
        baseline.mean_interaction.branch_a_mean_potential_standard_uncertainty_J,
      );
  });

  it("reverses ordinary QED phase under an explicit path swap", () => {
    const baseline = evaluateCasimirDpQedGreenNoise(fixture);
    const swapped = clone();
    [
      swapped.branch_trace.branch_a_potential_J,
      swapped.branch_trace.branch_b_potential_J,
    ] = [
      swapped.branch_trace.branch_b_potential_J,
      swapped.branch_trace.branch_a_potential_J,
    ];
    [
      swapped.branch_trace.branch_a_force_N,
      swapped.branch_trace.branch_b_force_N,
    ] = [
      swapped.branch_trace.branch_b_force_N,
      swapped.branch_trace.branch_a_force_N,
    ];
    swapped.branch_trace.path_swap = true;
    const result = evaluateCasimirDpQedGreenNoise(swapped);
    expect(result.mean_interaction.phase_rad)
      .toBeCloseTo(-baseline.mean_interaction.phase_rad, 12);
    expect(result.mean_interaction.differential_mean_force_N[0])
      .toBeCloseTo(-baseline.mean_interaction.differential_mean_force_N[0], 12);
  });

  it("shows registered echo-filter suppression without assigning collapse", () => {
    const result = evaluateCasimirDpQedGreenNoise(fixture);
    expect(result.decoherence.echo_chi)
      .toBeLessThan(result.decoherence.ramsey_chi);
    expect(result.decoherence.echo_filter_suppression_gate).toBe("pass");
    expect(result.heating.occupation_heating_rate_standard_uncertainty_s)
      .toBeGreaterThan(0);
    expect(result.collapse_identification).toBe("blocked");
    expect(result.manifold_dynamics).toBe("blocked");
  });

  it("rejects mean pressure used as a noise spectrum", () => {
    const invalid = clone();
    invalid.noise.source_kind = "mean_pressure_proxy";
    expect(() => evaluateCasimirDpQedGreenNoise(invalid))
      .toThrow("mean_pressure_is_not_a_noise_spectrum");
  });

  it("keeps the valid synthetic planar fixture diagnostic and not ready", () => {
    const result = evaluateCasimirDpQedGreenNoise(fixture);
    expect(result.green_tensor_diagnostics.artifact_integrity).toBe("pass");
    expect(result.sensitivity.gate).toBe("pass");
    expect(result.readiness.finite_geometry_gate).toBe("not_ready");
    expect(result.readiness.measured_qed_lane).toBe("not_ready");
    expect(result.readiness.maximum_claim).toBe("synthetic_pipeline_validation");
    expect(result.promotion_allowed).toBe(false);
  });
});
