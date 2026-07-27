import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CasimirDpRadiativeThermalClosureInput,
  evaluateCasimirDpRadiativeThermalClosure,
} from "../shared/casimir-dp-radiative-thermal-closure";

const fixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-stage4-thermal.synthetic.v1.json",
);
const fixture = CasimirDpRadiativeThermalClosureInput.parse(
  JSON.parse(readFileSync(fixturePath, "utf8")),
);

type Input = typeof fixture;

function clone(): Input {
  return structuredClone(fixture);
}

function syntheticNearField(): NonNullable<Input["near_field_fdt"]> {
  return {
    source_ref: "synthetic://near-field/fdt-v1",
    receipt: {
      source_ref: "synthetic://near-field/fdt-table-v1",
      evidence_class: "synthetic_fixture",
      expected_sha256:
        "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      actual_sha256:
        "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      integrity_verified: true,
    },
    green_tensor_ref: "synthetic://near-field/green-v1",
    spectrum_convention: "two_sided_angular_frequency",
    material_loss_included: true,
    temperature_included: true,
    geometry_included: true,
    zero_point_separated_from_thermal_transfer: true,
    net_thermal_power_W: 2e-12,
    gross_thermal_power_W: 5e-12,
    energy_transfer_variance_rate_J2_s: 3e-35,
    recoil_force_N: [4e-22, 0, 0],
    occupation_heating_rate_s: 6,
    decoherence_rate_s: 0.07,
    accumulated_covariance: [
      [1, 0, 0, 0],
      [0, 2, 0, 0],
      [0, 0, 3, 0],
      [0, 0, 0, 4],
    ],
  };
}

describe("Casimir-DP Stage-4 thermal-radiative/FDT closure", () => {
  it("uses a distinct result schema", () => {
    const result = evaluateCasimirDpRadiativeThermalClosure(fixture);
    expect(result.schema_version)
      .toBe("casimir_dp_radiative_thermal_closure_result/1");
    expect(result.input_schema_version)
      .toBe("casimir_dp_radiative_thermal_closure/1");
  });

  it("keeps omega canonical while closing nu/omega and h/hbar conversions", () => {
    const result = evaluateCasimirDpRadiativeThermalClosure(fixture);
    expect(result.constants.canonical_spectral_variable).toBe("omega_rad_s");
    expect(result.constants.h_J_s).toBeCloseTo(
      2 * Math.PI * result.constants.hbar_J_s,
      15,
    );
    expect(result.frequency_congruence.gate).toBe("pass");
    expect(result.frequency_congruence.maximum_relative_error).toBeLessThan(
      1e-12,
    );
    for (const checkpoint of result.frequency_congruence.checkpoints) {
      expect(checkpoint.photon_energy_h_nu_J).toBeCloseTo(
        checkpoint.photon_energy_hbar_omega_J,
        12,
      );
      expect(checkpoint.planck_occupation).toBeGreaterThanOrEqual(0);
      expect(checkpoint.mode_zero_point_energy_J).toBeGreaterThan(0);
      expect(checkpoint.mode_thermal_energy_J).toBeGreaterThanOrEqual(0);
    }
  });

  it("numerically integrates Planck radiance to sigma T^4 and recovers solar Teff", () => {
    const result = evaluateCasimirDpRadiativeThermalClosure(fixture);
    expect(result.planck_stefan_boltzmann.gate).toBe("pass");
    expect(result.planck_stefan_boltzmann.sigma_relative_error).toBeLessThan(
      1e-10,
    );
    expect(result.planck_stefan_boltzmann.sigma_numerical_W_m2_K4)
      .toBeCloseTo(5.670374419e-8, 9);
    expect(result.solar_benchmark.effective_temperature_K).toBeCloseTo(
      5772,
      0,
    );
    expect(result.solar_benchmark.gate).toBe("pass");
    expect(result.solar_benchmark.interpretation).toContain(
      "flux-equivalent effective temperature",
    );
  });

  it("produces ordinary thermal power, recoil, noise, heating, decoherence, and covariance", () => {
    const result = evaluateCasimirDpRadiativeThermalClosure(fixture);
    expect(result.transfer_regime.active_model)
      .toBe("far_field_greybody_stefan_boltzmann");
    expect(result.transfer_regime.far_field_validity_gate).toBe("pass");
    expect(result.thermal_transfer.net_power_source_to_environment_W)
      .toBeGreaterThan(0);
    expect(result.recoil.force_N[0]).toBeGreaterThan(0);
    expect(result.noise.energy_transfer_variance_rate_J2_s)
      .toBeGreaterThan(0);
    expect(result.heating.occupation_heating_rate_s).toBeGreaterThan(0);
    expect(result.decoherence.rate_s).toBeGreaterThanOrEqual(0);
    expect(result.residual_covariance.covariance).toHaveLength(4);
    expect(result.residual_covariance.covariance[0][1]).toBe(
      result.residual_covariance.covariance[1][0],
    );
    for (let index = 0; index < 4; index += 1) {
      expect(result.residual_covariance.covariance[index][index])
        .toBeGreaterThanOrEqual(0);
    }
    expect(result.thermal_transfer.nonnegative_entropy_production_gate)
      .toBe("pass");
  });

  it("enforces detailed balance at equal temperature", () => {
    const equal = clone();
    equal.reservoirs.environment_temperature_K =
      equal.reservoirs.source_temperature_K;
    const result = evaluateCasimirDpRadiativeThermalClosure(equal);
    expect(result.thermal_transfer.net_power_source_to_environment_W).toBe(0);
    expect(result.thermal_transfer.detailed_balance_gate).toBe("pass");
    expect(result.thermal_transfer.entropy_production_W_K).toBe(0);
    expect(result.thermal_transfer.nonnegative_entropy_production_gate)
      .toBe("pass");
    // Equilibrium has zero mean transfer but retains ordinary fluctuations.
    expect(result.noise.energy_transfer_variance_rate_J2_s)
      .toBeGreaterThan(0);
  });

  it("separates zero-point energy and suppresses every thermal output at T -> 0", () => {
    const zero = clone();
    zero.reservoirs.source_temperature_K = 0;
    zero.reservoirs.environment_temperature_K = 0;
    const result = evaluateCasimirDpRadiativeThermalClosure(zero);
    expect(result.mode_energy_accounting.zero_point_in_net_thermal_power)
      .toBe(false);
    expect(result.mode_energy_accounting.gate).toBe("pass");
    expect(result.thermal_transfer.net_power_source_to_environment_W).toBe(0);
    expect(result.thermal_transfer.gross_exchange_power_W).toBe(0);
    expect(result.noise.energy_transfer_variance_rate_J2_s).toBe(0);
    expect(result.heating.occupation_heating_rate_s).toBe(0);
    expect(result.decoherence.rate_s).toBe(0);
    expect(result.recoil.force_N).toEqual([0, 0, 0]);
    expect(result.transfer_regime.far_field_validity_gate).toBe("pass");
  });

  it("recovers transparent and blackbody emissivity limits", () => {
    const transparent = clone();
    transparent.reservoirs.source_emissivity = 0;
    let result = evaluateCasimirDpRadiativeThermalClosure(transparent);
    expect(result.emissivity.effective_grey_emissivity).toBe(0);
    expect(result.thermal_transfer.net_power_source_to_environment_W).toBe(0);
    expect(result.noise.energy_transfer_variance_rate_J2_s).toBe(0);

    const blackbody = clone();
    blackbody.reservoirs.source_emissivity = 1;
    blackbody.reservoirs.environment_emissivity = 1;
    result = evaluateCasimirDpRadiativeThermalClosure(blackbody);
    const expected =
      result.planck_stefan_boltzmann.sigma_numerical_W_m2_K4 *
      blackbody.reservoirs.radiating_area_m2 *
      blackbody.reservoirs.view_factor *
      (
        blackbody.reservoirs.source_temperature_K ** 4 -
        blackbody.reservoirs.environment_temperature_K ** 4
      );
    expect(result.emissivity.effective_grey_emissivity).toBe(1);
    expect(result.thermal_transfer.net_power_source_to_environment_W)
      .toBeCloseTo(expected, 12);
    expect(result.emissivity.opaque_limit_gate).toBe("pass");
  });

  it("fails the far-field gate inside the thermal wavelength and admits only receipted near-field FDT", () => {
    const invalidFarField = clone();
    invalidFarField.geometry.separation_m = 1e-9;
    let result = evaluateCasimirDpRadiativeThermalClosure(invalidFarField);
    expect(result.transfer_regime.far_field_validity_gate).toBe("not_ready");
    expect(result.readiness.thermal_closure_gate).toBe("not_ready");

    const nearField = clone();
    nearField.geometry.transfer_regime = "near_field";
    nearField.near_field_fdt = syntheticNearField();
    result = evaluateCasimirDpRadiativeThermalClosure(nearField);
    expect(result.transfer_regime.active_model)
      .toBe("near_field_green_fdt_supplied");
    expect(result.transfer_regime.far_field_validity_gate)
      .toBe("not_applicable");
    expect(result.transfer_regime.near_field_green_fdt_gate).toBe("pass");
    expect(result.near_field_validation.applicable).toBe(true);
    expect(result.near_field_validation.covariance?.square_gate).toBe("pass");
    expect(result.near_field_validation.covariance?.finite_gate).toBe("pass");
    expect(result.near_field_validation.covariance?.symmetry_gate).toBe("pass");
    expect(
      result.near_field_validation.covariance?.positive_semidefinite_gate,
    ).toBe("pass");
    expect(
      result.near_field_validation.power_consistency
        ?.gross_not_less_than_absolute_net_gate,
    ).toBe("pass");
    expect(result.near_field_validation.gate).toBe("pass");
    expect(result.readiness.thermal_closure_gate).toBe("pass");
    expect(result.thermal_transfer.net_power_source_to_environment_W)
      .toBe(2e-12);
    expect(result.noise.energy_transfer_variance_rate_J2_s).toBe(3e-35);
    expect(result.residual_covariance.covariance[3][3]).toBe(4);
  });

  it("fails closed on a negative near-field covariance diagonal", () => {
    const nearField = clone();
    nearField.geometry.transfer_regime = "near_field";
    nearField.near_field_fdt = syntheticNearField();
    nearField.near_field_fdt.accumulated_covariance[0][0] = -1;

    const result = evaluateCasimirDpRadiativeThermalClosure(nearField);
    expect(
      result.near_field_validation.covariance?.positive_semidefinite_gate,
    ).toBe("not_ready");
    expect(result.near_field_validation.gate).toBe("not_ready");
    expect(result.transfer_regime.near_field_green_fdt_gate).toBe("not_ready");
    expect(result.readiness.thermal_closure_gate).toBe("not_ready");
  });

  it("fails closed on a symmetric but non-PSD near-field covariance", () => {
    const nearField = clone();
    nearField.geometry.transfer_regime = "near_field";
    nearField.near_field_fdt = syntheticNearField();
    nearField.near_field_fdt.accumulated_covariance[0][1] = 2;
    nearField.near_field_fdt.accumulated_covariance[1][0] = 2;

    const result = evaluateCasimirDpRadiativeThermalClosure(nearField);
    expect(result.near_field_validation.covariance?.symmetry_gate).toBe("pass");
    expect(
      result.near_field_validation.covariance?.minimum_scaled_eigenvalue,
    ).toBeLessThan(0);
    expect(
      result.near_field_validation.covariance?.positive_semidefinite_gate,
    ).toBe("not_ready");
    expect(result.transfer_regime.near_field_green_fdt_gate).toBe("not_ready");
    expect(result.readiness.thermal_closure_gate).toBe("not_ready");
  });

  it("fails closed on an asymmetric near-field covariance", () => {
    const nearField = clone();
    nearField.geometry.transfer_regime = "near_field";
    nearField.near_field_fdt = syntheticNearField();
    nearField.near_field_fdt.accumulated_covariance[0][1] = 0.25;

    const result = evaluateCasimirDpRadiativeThermalClosure(nearField);
    expect(result.near_field_validation.covariance?.symmetry_gate)
      .toBe("not_ready");
    expect(
      result.near_field_validation.covariance?.positive_semidefinite_gate,
    ).toBe("not_ready");
    expect(result.near_field_validation.gate).toBe("not_ready");
    expect(result.transfer_regime.near_field_green_fdt_gate).toBe("not_ready");
    expect(result.readiness.thermal_closure_gate).toBe("not_ready");
  });

  it("fails closed when near-field gross power is below absolute net power", () => {
    const nearField = clone();
    nearField.geometry.transfer_regime = "near_field";
    nearField.near_field_fdt = syntheticNearField();
    nearField.near_field_fdt.gross_thermal_power_W = 1e-12;

    const result = evaluateCasimirDpRadiativeThermalClosure(nearField);
    expect(
      result.near_field_validation.power_consistency
        ?.gross_not_less_than_absolute_net_gate,
    ).toBe("not_ready");
    expect(result.near_field_validation.gate).toBe("not_ready");
    expect(result.transfer_regime.near_field_green_fdt_gate).toBe("not_ready");
    expect(result.readiness.thermal_closure_gate).toBe("not_ready");
  });

  it("fails closed on unit mismatch, provenance damage, and double counting", () => {
    const mismatchedFrequency = clone();
    mismatchedFrequency.frequency_convention.spectral_checkpoints[0]
      .omega_rad_s *= 1.1;
    let result = evaluateCasimirDpRadiativeThermalClosure(mismatchedFrequency);
    expect(result.frequency_congruence.gate).toBe("not_ready");
    expect(result.readiness.thermal_closure_gate).toBe("not_ready");

    const damagedReceipt = clone();
    damagedReceipt.reservoirs.material_receipt.actual_sha256 =
      "9999999999999999999999999999999999999999999999999999999999999999";
    result = evaluateCasimirDpRadiativeThermalClosure(damagedReceipt);
    expect(result.provenance.gate).toBe("not_ready");
    expect(result.readiness.thermal_closure_gate).toBe("not_ready");

    const doubleCounted = clone();
    doubleCounted.accounting.zero_point_in_net_thermal_power = true;
    expect(() => evaluateCasimirDpRadiativeThermalClosure(doubleCounted))
      .toThrow(/double counting/);
  });

  it("rejects non-finite inputs and closes on finite inputs that overflow derived outputs", () => {
    const nonFinite = clone();
    nonFinite.reservoirs.source_temperature_K = Number.POSITIVE_INFINITY;
    expect(() => evaluateCasimirDpRadiativeThermalClosure(nonFinite))
      .toThrow();

    const extremeFinite = clone();
    extremeFinite.reservoirs.source_temperature_K = 1e308;
    const result = evaluateCasimirDpRadiativeThermalClosure(extremeFinite);
    expect(result.numerical_validity.checks.far_field_transfer).toBe(false);
    expect(result.numerical_validity.checks.active_transfer_and_noise)
      .toBe(false);
    expect(result.numerical_validity.gate).toBe("not_ready");
    expect(result.readiness.thermal_closure_gate).toBe("not_ready");
    expect(result.promotion_allowed).toBe(false);
  });

  it("keeps the synthetic fixture diagnostic and blocks collapse/manifold claims", () => {
    const result = evaluateCasimirDpRadiativeThermalClosure(fixture);
    expect(result.numerical_validity.gate).toBe("pass");
    expect(result.readiness.thermal_closure_gate).toBe("pass");
    expect(result.readiness.measured_thermal_lane).toBe("not_ready");
    expect(result.readiness.maximum_claim)
      .toBe("synthetic_pipeline_validation");
    expect(result.promotion_allowed).toBe(false);
    expect(result.collapse_identification).toBe("blocked");
    expect(result.manifold_dynamics).toBe("blocked");
  });

  it("does not promote a relabeled input while active receipts remain synthetic", () => {
    const relabeled = clone();
    relabeled.evidence_class = "measured";
    const result = evaluateCasimirDpRadiativeThermalClosure(relabeled);

    expect(result.readiness.thermal_closure_gate).toBe("pass");
    expect(result.provenance.gate).toBe("pass");
    expect(result.provenance.receipt_evidence_classes).toEqual({
      authority: "synthetic_fixture",
      material: "synthetic_fixture",
      geometry: "synthetic_fixture",
      solar_benchmark: "synthetic_fixture",
      near_field_fdt: null,
    });
    expect(result.provenance.all_active_receipts_measured).toBe(false);
    expect(result.readiness.measured_thermal_lane).toBe("not_ready");
    expect(result.promotion_allowed).toBe(false);

    const nearFieldRelabeled = clone();
    nearFieldRelabeled.evidence_class = "measured";
    nearFieldRelabeled.authority_receipt.evidence_class = "measured";
    nearFieldRelabeled.reservoirs.material_receipt.evidence_class = "measured";
    nearFieldRelabeled.geometry.geometry_receipt.evidence_class = "measured";
    nearFieldRelabeled.solar_benchmark.receipt.evidence_class = "measured";
    nearFieldRelabeled.geometry.transfer_regime = "near_field";
    nearFieldRelabeled.near_field_fdt = syntheticNearField();
    const nearFieldResult = evaluateCasimirDpRadiativeThermalClosure(
      nearFieldRelabeled,
    );
    expect(nearFieldResult.provenance.receipt_evidence_classes).toEqual({
      authority: "measured",
      material: "measured",
      geometry: "measured",
      solar_benchmark: "measured",
      near_field_fdt: "synthetic_fixture",
    });
    expect(nearFieldResult.provenance.all_active_receipts_measured).toBe(false);
    expect(nearFieldResult.readiness.measured_thermal_lane).toBe("not_ready");
    expect(nearFieldResult.promotion_allowed).toBe(false);
  });
});
