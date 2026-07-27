import { describe, expect, it } from "vitest";
import {
  CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_FAILURE_ORDER,
  CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_INPUT_VERSION,
  CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_RESULT_VERSION,
  CasimirDpApparatusSpectralThermometryStage4_2BInput,
  evaluateCasimirDpApparatusSpectralThermometryStage4_2B,
} from "../shared/casimir-dp-apparatus-spectral-thermometry-stage4-2b";

const PLANCK_J_S = 6.626_070_15e-34;
const C_M_S = 299_792_458;
const BOLTZMANN_J_K = 1.380_649e-23;
const hash = (character: string) => character.repeat(64);

function receipt(id: string, digest = hash("a")) {
  return {
    receipt_id: id,
    artifact_path: `artifacts/${id}.json`,
    evidence_class: "synthetic_fixture" as const,
    expected_sha256: digest,
    actual_sha256: digest,
    integrity_verified: true,
  };
}

function planckRadianceLambda(wavelengthM: number, temperatureK: number) {
  const exponent =
    PLANCK_J_S * C_M_S /
    (wavelengthM * BOLTZMANN_J_K * temperatureK);
  return 2 * PLANCK_J_S * C_M_S ** 2 /
    wavelengthM ** 5 /
    Math.expm1(exponent);
}

function identity(dimension: number) {
  return Array.from(
    { length: dimension },
    (_, row) =>
      Array.from(
        { length: dimension },
        (_, column) => row === column ? 1 : 0,
      ),
  );
}

function target(args: {
  id: string;
  kind: "particle_internal" | "boundary_surface";
  temperatureK: number;
}) {
  const wavelengthM = [3, 5, 8, 12, 20, 30].map(
    (value) => value * 1e-6,
  );
  const binWidthM = wavelengthM.map((value) => value * 0.12);
  const baseArea = args.kind === "particle_internal" ? 1e-15 : 2e-10;
  const factors = [0.55, 0.9, 1.25, 1.5, 1.1, 0.7];
  const emissionArea = factors.map((factor) => baseArea * factor);
  const solidAngle = args.kind === "particle_internal" ? 0.02 : 0.01;
  const thermal = wavelengthM.map(
    (wavelength, index) =>
      solidAngle *
      emissionArea[index] *
      planckRadianceLambda(wavelength, args.temperatureK) *
      binWidthM[index],
  );
  const reflected = thermal.map((value) => value * 0.01);
  const stray = thermal.map((value) => value * 0.01);
  const detectorBackground = thermal.map((value) => value * 0.01);
  const detectorPower = thermal.map(
    (value, index) =>
      value +
      reflected[index] +
      stray[index] +
      detectorBackground[index],
  );
  const standardUncertainty = thermal.map(
    (value) => Math.max(value * 1e-3, 1e-35),
  );
  const covariance = standardUncertainty.map((sigma, row) =>
    standardUncertainty.map(
      (_otherSigma, column) => row === column ? sigma ** 2 : 0,
    )
  );
  return {
    target_id: args.id,
    target_kind: args.kind,
    spectrum_receipt: receipt(`${args.id}-spectrum`),
    detector_response_receipt: receipt(`${args.id}-response`),
    spectral_covariance_receipt: receipt(`${args.id}-covariance`),
    material_response_receipt: receipt(`${args.id}-material`),
    geometry_receipt: receipt(`${args.id}-geometry`),
    field_response_receipt: receipt(`${args.id}-field`),
    wavelength_m: wavelengthM,
    source_bin_width_m: binWidthM,
    source_bin_mask: wavelengthM.map(() => true),
    detector_power_W: detectorPower,
    detector_bin_mask: wavelengthM.map(() => true),
    detector_response_matrix: identity(wavelengthM.length),
    spectral_covariance_W2: covariance,
    source_reflected_power_W: reflected,
    source_stray_power_W: stray,
    detector_background_W: detectorBackground,
    collection_solid_angle_sr: solidAngle,
    emission_area_response_m2: emissionArea,
    absorption_cross_section_m2: factors.map(
      (factor) => 1e-15 * factor,
    ),
    scattering_cross_section_m2: factors.map(
      (factor) => 2e-16 * factor,
    ),
    wavelength_calibration: {
      frozen: true,
      coverage_frozen: true,
      masks_frozen: true,
      response_frozen: true,
      line_spread_function_included: true,
      throughput_included: true,
      polarization_response_included: true,
      gain_drift_model_included: true,
    },
    material_response: {
      model_kind:
        args.kind === "particle_internal"
          ? "complex_permittivity_mie" as const
          : "finite_geometry_emissivity" as const,
      non_blackbody_response_present: true,
      complex_response_or_cross_section_uncertainty_included: true,
    },
    thermal_state_model: {
      model_kind: "local_thermal_equilibrium" as const,
      valid_over_fit_window: true,
      model_receipt: null,
    },
    field_response: {
      regime: "near_boundary" as const,
      model_kind:
        "boundary_inclusive_dyadic_green_fdt" as const,
      boundary_included: true,
      free_space_recovery_demonstrated: false,
      free_space_recovery_relative_error: null,
      free_space_recovery_tolerance: 1e-3,
    },
    fit_contract: {
      minimum_temperature_K: 200,
      maximum_temperature_K: 400,
      temperature_grid_steps: 21,
      required_planck_x_interval: [2, 10] as [number, number],
      minimum_signal_to_background: 2,
      minimum_fisher_information_per_K2: 1e-6,
    },
  };
}

function validInput() {
  return {
    schema_version:
      CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_INPUT_VERSION,
    campaign_id:
      "casimir-dp-apparatus-spectral-thermometry-stage4-2b-v1" as const,
    evidence_class: "synthetic_fixture" as const,
    claim_ceiling:
      "response_corrected_apparatus_thermometry_and_thermal_coherence_forecast_only" as const,
    promotion_allowed: false as const,
    acquisition_partition: "pilot" as const,
    freeze_contract: {
      frozen_before_confirmatory_acquisition: true,
      candidate_exclusions_frozen: true,
      temperature_fit_code_sha256: hash("1"),
      row_order_sha256: hash("2"),
    },
    targets: [
      target({
        id: "particle",
        kind: "particle_internal",
        temperatureK: 300,
      }),
      target({
        id: "boundary",
        kind: "boundary_surface",
        temperatureK: 280,
      }),
    ],
    ownership_ledger: {
      unified_model_id: "thermal-green-response-v1",
      far_field_registered: true,
      near_field_registered: true,
      terms: [
        {
          term_id: "far-field-radiation",
          owners: ["far_field" as const],
          allocation_fractions: [1],
          treatment: "exclusive_owner" as const,
        },
        {
          term_id: "near-field-green-correction",
          owners: ["near_field" as const],
          allocation_fractions: [1],
          treatment: "exclusive_owner" as const,
        },
        {
          term_id: "matched-overlap-sector",
          owners: ["far_field" as const, "near_field" as const],
          allocation_fractions: [0.35, 0.65],
          treatment: "shared_partitioned" as const,
        },
      ],
    },
    kinetics: {
      particle_target_id: "particle",
      boundary_target_id: "boundary",
      branch_separation_m: 20e-9,
      hold_times_s: [0, 0.025, 0.1],
      boundary_to_particle_solid_angle_sr: 0.01,
      environment_incident_photon_flux_per_m2_s_m:
        new Array(6).fill(0),
      emission_kernel: "jump_localization" as const,
      absorption_kernel: "jump_localization" as const,
      scattering_kernel: "jump_localization" as const,
      gaussian_diffusion_requested: false,
      diffusion_limit_validation: {
        status: "not_requested" as const,
        maximum_relative_error: null,
        tolerance: 0.01,
        pilot_only: true,
      },
    },
    tolerances: {
      covariance_symmetry_relative: 1e-12,
      covariance_psd_relative: 1e-12,
      ownership_fraction_absolute: 1e-12,
      blackbody_recovery_relative: 1e-9,
    },
  };
}

function codes(result: ReturnType<
  typeof evaluateCasimirDpApparatusSpectralThermometryStage4_2B
>) {
  return result.failures.map((failure) => failure.code);
}

function nonFinitePaths(value: unknown, path = "result"): string[] {
  if (typeof value === "number") {
    return Number.isFinite(value) ? [] : [path];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      nonFinitePaths(entry, `${path}.${index}`)
    );
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) =>
      nonFinitePaths(entry, `${path}.${key}`)
    );
  }
  return [];
}

describe("Casimir-DP Stage-4.2B spectral thermometry", () => {
  it("recovers response-corrected particle and boundary temperatures", () => {
    const parsed =
      CasimirDpApparatusSpectralThermometryStage4_2BInput.parse(
        validInput(),
      );
    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(parsed);

    expect(result.schema_version).toBe(
      CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_RESULT_VERSION,
    );
    expect(result.status).toBe("pass");
    expect(result.failures).toEqual([]);
    expect(result.first_failure_code).toBeNull();
    expect(result.promotion_allowed).toBe(false);
    expect(result.observable_bridge_edges_added).toBe(0);
    expect(result.no_solar_apparatus_input).toBe(true);

    const particle = result.target_thermometry.find(
      (row) => row.target_id === "particle",
    )!;
    const boundary = result.target_thermometry.find(
      (row) => row.target_id === "boundary",
    )!;
    expect(particle.temperature_status).toBe("identified");
    expect(particle.temperature_estimate_K).toBeCloseTo(300, 6);
    expect(boundary.temperature_status).toBe("identified");
    expect(boundary.temperature_estimate_K).toBeCloseTo(280, 6);
    expect(
      particle.temperature_standard_uncertainty_K,
    ).toBeGreaterThan(0);
    expect(result.thermal_jump_localization.status).toBe("ready");
    expect(
      result.thermal_jump_localization.decoherence_rates_s!.total,
    ).toBeGreaterThan(0);
    expect(result.thermal_to_coherence_jacobian.rows).toHaveLength(3);
    expect(nonFinitePaths(result)).toEqual([]);
  });

  it("retains forecast-only scientific claim boundaries after a synthetic pass", () => {
    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(
        validInput(),
      );
    expect(result.final_gates).toMatchObject({
      calibration_or_pilot_only: "pass",
      spectral_freeze: "pass",
      artifact_integrity: "pass",
      covariance_symmetry_and_psd: "pass",
      nonblackbody_particle_response: "pass",
      thermal_state_validity: "pass",
      temperature_sensitive_coverage: "pass",
      signal_and_identifiability: "pass",
      boundary_or_free_space_response: "pass",
      unified_channel_ownership: "pass",
      jump_localization_kernels: "pass",
      diffusion_limit: "pass",
      ideal_blackbody_recovery: "pass",
      measured_evidence: "not_ready",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      physical_viability: "not_evaluated",
    });
    expect(result.blackbody_recovery_diagnostic).toMatchObject({
      role:
        "ideal_limit_numerical_recovery_not_default_apparatus_model",
      gate: "pass",
    });
    expect(
      result.ownership_ledger.physically_exclusive_assumption_used,
    ).toBe(false);
  });

  it("rejects any solar-temperature shortcut before schema parsing", () => {
    const input = validInput() as Record<string, unknown>;
    input.solar_temperature_K = 5_772;
    expect(() =>
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input)
    ).toThrow("SPB_FORBIDDEN_SOLAR_INPUT:solar_temperature_K");
  });

  it("forbids confirmatory fitting and incomplete spectral freeze", () => {
    const input = validInput();
    input.acquisition_partition = "confirmatory";
    input.freeze_contract.frozen_before_confirmatory_acquisition =
      false;
    input.targets[0].wavelength_calibration.masks_frozen = false;

    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input);
    expect(codes(result).slice(0, 2)).toEqual([
      "SPB_CONFIRMATORY_PARTITION_FORBIDDEN",
      "SPB_SPECTRAL_FREEZE_INVALID",
    ]);
  });

  it("fails hash integrity and non-PSD covariance without rescuing the fit", () => {
    const input = validInput();
    input.targets[0].detector_response_receipt.actual_sha256 =
      hash("f");
    input.targets[1].spectral_covariance_W2[0][0] *= -1;

    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input);
    expect(codes(result)).toContain(
      "SPB_ARTIFACT_INTEGRITY_INVALID",
    );
    expect(codes(result)).toContain("SPB_COVARIANCE_INVALID");
    expect(codes(result)).toContain(
      "SPB_TEMPERATURE_NOT_IDENTIFIABLE",
    );
    expect(
      result.target_thermometry.find(
        (row) => row.target_id === "boundary",
      )!.temperature_estimate_K,
    ).toBeNull();
    expect(nonFinitePaths(result)).toEqual([]);
  });

  it("accepts PSD covariance structurally but returns temperature_not_identifiable when singular", () => {
    const input = validInput();
    input.targets[0].spectral_covariance_W2 =
      input.targets[0].spectral_covariance_W2.map((row) =>
        row.map(() => 0)
      );

    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input);
    const particle = result.target_thermometry.find(
      (row) => row.target_id === "particle",
    )!;
    expect(particle.covariance.positive_semidefinite_gate).toBe(
      "pass",
    );
    expect(particle.positive_definite_for_fit).toBe(false);
    expect(particle.temperature_status).toBe(
      "temperature_not_identifiable",
    );
    expect(codes(result)).not.toContain("SPB_COVARIANCE_INVALID");
    expect(codes(result)).toContain(
      "SPB_TEMPERATURE_NOT_IDENTIFIABLE",
    );
    expect(particle.fit_chi_square).toBeNull();
    expect(nonFinitePaths(result)).toEqual([]);
  });

  it("requires a spectrally resolved non-blackbody nanoparticle response", () => {
    const input = validInput();
    input.targets[0].material_response.model_kind =
      "ideal_blackbody";
    input.targets[0].material_response
      .non_blackbody_response_present = false;
    input.targets[0].emission_area_response_m2.fill(1e-15);

    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input);
    expect(codes(result)).toContain(
      "SPB_NONBLACKBODY_RESPONSE_MISSING",
    );
    expect(result.final_gates.nonblackbody_particle_response).toBe(
      "not_ready",
    );
  });

  it("requires LTE validity or a registered non-equilibrium model", () => {
    const input = validInput();
    input.targets[0].thermal_state_model.model_kind =
      "registered_non_equilibrium";
    input.targets[0].thermal_state_model.model_receipt = null;
    input.targets[1].thermal_state_model.valid_over_fit_window =
      false;

    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input);
    expect(codes(result)).toContain(
      "SPB_THERMAL_STATE_MODEL_INVALID",
    );
    expect(
      result.thermal_state_models.every(
        (row) => row.gate === "not_ready",
      ),
    ).toBe(true);
  });

  it("gates temperature-sensitive coverage, signal background, and Fisher information independently", () => {
    const input = validInput();
    input.targets[0].fit_contract.required_planck_x_interval =
      [0.5, 30];
    input.targets[1].fit_contract.minimum_signal_to_background =
      1e6;
    input.targets[1].fit_contract.minimum_fisher_information_per_K2 =
      1e100;

    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input);
    expect(codes(result)).toEqual(
      expect.arrayContaining([
        "SPB_TEMPERATURE_BAND_INCOMPLETE",
        "SPB_SIGNAL_BACKGROUND_INSUFFICIENT",
        "SPB_TEMPERATURE_NOT_IDENTIFIABLE",
      ]),
    );
    expect(result.thermal_jump_localization.status).toBe(
      "temperature_not_identifiable",
    );
  });

  it("requires boundary-inclusive response or a demonstrated free-space recovery", () => {
    const input = validInput();
    input.targets[0].field_response.regime =
      "free_space_recovery";
    input.targets[0].field_response.model_kind =
      "free_space_mie";
    input.targets[0].field_response
      .free_space_recovery_demonstrated = true;
    input.targets[0].field_response
      .free_space_recovery_relative_error = 2e-3;
    input.targets[0].field_response
      .free_space_recovery_tolerance = 1e-3;
    input.targets[1].field_response.boundary_included = false;

    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input);
    expect(codes(result)).toContain(
      "SPB_BOUNDARY_RESPONSE_INVALID",
    );
    expect(
      result.field_response_models.every(
        (row) => row.gate === "not_ready",
      ),
    ).toBe(true);
  });

  it("rejects far/near double counting while retaining both physical lanes", () => {
    const input = validInput();
    input.ownership_ledger.terms[2].treatment =
      "unpartitioned_addition";
    input.ownership_ledger.terms[2].allocation_fractions =
      [1, 1];

    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input);
    expect(codes(result)).toContain(
      "SPB_CHANNEL_OWNERSHIP_INVALID",
    );
    expect(result.ownership_ledger.far_field_registered).toBe(true);
    expect(result.ownership_ledger.near_field_registered).toBe(true);
    expect(
      result.ownership_ledger.physically_exclusive_assumption_used,
    ).toBe(false);
  });

  it("keeps photon processes in jump kernels unless a pilot diffusion limit is validated", () => {
    const input = validInput();
    input.kinetics.emission_kernel =
      "gaussian_spectral_dephasing";
    input.kinetics.gaussian_diffusion_requested = true;
    input.kinetics.diffusion_limit_validation.status =
      "not_validated";

    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input);
    expect(codes(result)).toContain("SPB_JUMP_KERNEL_INVALID");
    expect(codes(result)).toContain(
      "SPB_DIFFUSION_LIMIT_INVALID",
    );
  });

  it("propagates correlated full covariance in detector-bin order", () => {
    const input = validInput();
    for (const targetRow of input.targets) {
      const sigmas = targetRow.spectral_covariance_W2.map(
        (row, index) => Math.sqrt(row[index]),
      );
      targetRow.spectral_covariance_W2 = sigmas.map(
        (sigma, row) =>
          sigmas.map(
            (otherSigma, column) =>
              row === column
                ? sigma ** 2
                : 0.2 * sigma * otherSigma,
          ),
      );
    }

    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input);
    expect(result.status).toBe("pass");
    expect(
      result.covariance_diagnostics.every(
        (row) =>
          row.symmetry_gate === "pass" &&
          row.positive_semidefinite_gate === "pass" &&
          row.positive_definite_for_fit,
      ),
    ).toBe(true);
    expect(
      result.target_thermometry[0].temperature_estimate_K,
    ).toBeCloseTo(300, 6);
  });

  it("excludes a frozen masked source bin from both thermometry and thermal rates", () => {
    const baselineInput = validInput();
    const stressedInput = validInput();
    for (const input of [baselineInput, stressedInput]) {
      input.targets[0].source_bin_mask[2] = false;
      input.targets[0].detector_bin_mask[2] = false;
    }
    stressedInput.targets[0].emission_area_response_m2[2] = 1e30;
    stressedInput.targets[0].source_reflected_power_W[2] = 1e30;
    stressedInput.targets[0].source_stray_power_W[2] = 1e30;
    stressedInput.kinetics
      .environment_incident_photon_flux_per_m2_s_m[2] = 1e100;

    const baseline =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(
        baselineInput,
      );
    const stressed =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(
        stressedInput,
      );

    expect(
      stressed.target_thermometry[0].temperature_estimate_K,
    ).toBeCloseTo(
      baseline.target_thermometry[0].temperature_estimate_K!,
      10,
    );
    expect(
      stressed.thermal_jump_localization.decoherence_rates_s!.total,
    ).toBeCloseTo(
      baseline.thermal_jump_localization.decoherence_rates_s!.total,
      12,
    );
    expect(
      stressed.thermal_jump_localization.spectral_rows![2],
    ).toMatchObject({
      included: false,
      emission_rate_s: 0,
      absorption_rate_s: 0,
      scattering_rate_s: 0,
    });
  });

  it("uses stable failure ordering and a strict top-level schema", () => {
    const input = validInput();
    input.acquisition_partition = "confirmatory";
    input.targets[0].material_response
      .non_blackbody_response_present = false;
    input.kinetics.absorption_kernel =
      "gaussian_spectral_dephasing";

    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input);
    const order = new Map(
      CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_FAILURE_ORDER
        .map((code, index) => [code, index]),
    );
    expect(result.failures.every((failure, index, failures) =>
      index === 0 ||
      (order.get(failures[index - 1].code) ?? -1) <=
        (order.get(failure.code) ?? -1)
    )).toBe(true);

    const extra = validInput() as Record<string, unknown>;
    extra.unregistered_temperature_shortcut = 300;
    expect(() =>
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(extra)
    ).toThrow();
  });

  it("fails closed when the ideal Planck-moment recovery tolerance is not met", () => {
    const input = validInput();
    input.tolerances.blackbody_recovery_relative = 0;

    const result =
      evaluateCasimirDpApparatusSpectralThermometryStage4_2B(input);

    expect(result.status).toBe("not_ready");
    expect(result.final_gates.ideal_blackbody_recovery).toBe("not_ready");
    expect(result.failures.map((failure) => failure.code)).toContain(
      "SPB_BLACKBODY_RECOVERY_FAILED",
    );
  });
});
