import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_FAILURE_ORDER,
  CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_INPUT_VERSION,
  CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_RESULT_VERSION,
  CasimirDpPlanckSolarCalibrationStage4_2AInput,
  evaluateCasimirDpPlanckSolarCalibrationStage4_2A,
} from "../shared/casimir-dp-planck-solar-calibration-stage4-2a";

const fixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-planck-solar-calibration.source-backed.v1.json",
);

async function loadRawFixture(): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(fixturePath, "utf8"),
  ) as Record<string, unknown>;
}

describe("Casimir-DP Planck/solar calibration Stage-4.2A", () => {
  it("closes the Planck spectral Jacobians and Stefan-Boltzmann identity", async () => {
    const input = CasimirDpPlanckSolarCalibrationStage4_2AInput.parse(
      await loadRawFixture(),
    );
    const result =
      evaluateCasimirDpPlanckSolarCalibrationStage4_2A(input);

    expect(input.schema_version).toBe(
      CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_INPUT_VERSION,
    );
    expect(result.schema_version).toBe(
      CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_RESULT_VERSION,
    );
    expect(result.status).toBe("pass");
    expect(result.failures).toEqual([]);
    expect(result.first_failure_code).toBeNull();
    expect(
      result.spectral_density_closure.maximum_relative_error,
    ).toBeLessThanOrEqual(1e-12);
    expect(
      result.planck_stefan_boltzmann.planck_moment_relative_error,
    ).toBeLessThan(1e-10);
    expect(
      result.planck_stefan_boltzmann.sigma_analytic_W_m2_K4,
    ).toBeCloseTo(5.670374419e-8, 17);
    expect(
      result.planck_stefan_boltzmann.sigma_reference_relative_error,
    ).toBeLessThan(1e-10);
    const snapshotBytes = await readFile(
      path.resolve(
        process.cwd(),
        input.tsis_hsrs_snapshot.source_snapshot_path,
      ),
    );
    expect(
      createHash("sha256").update(snapshotBytes).digest("hex"),
    ).toBe(input.tsis_hsrs_snapshot.expected_snapshot_sha256);
    expect(input.tsis_hsrs_snapshot.actual_snapshot_sha256).toBe(
      input.tsis_hsrs_snapshot.expected_snapshot_sha256,
    );
    expect(input.tsis_hsrs_snapshot.integrity_verified).toBe(true);
    expect(result.provenance).toMatchObject({
      tsis_source_snapshot_path:
        "configs/research/source-snapshots/tsis1-hsrs-20260725-480-800nm.csv",
      tsis_snapshot_expected_sha256:
        "a9b28d4ec51a10e077fd6999f992fe8829c18328a77c50ad4c0849ef1bd23d79",
      tsis_snapshot_actual_sha256:
        "a9b28d4ec51a10e077fd6999f992fe8829c18328a77c50ad4c0849ef1bd23d79",
      complete_cross_wavelength_covariance_supplied: false,
      measured_fit_significance:
        "not_computable_without_complete_cross_wavelength_covariance",
      gate: "pass",
    });
  });

  it("recovers distinct spectrum-derived color and bolometric effective temperatures", async () => {
    const result =
      evaluateCasimirDpPlanckSolarCalibrationStage4_2A(
        await loadRawFixture(),
      );

    expect(
      result.solar_spectral_color_temperature.peak_wavelength_nm,
    ).toBe(500);
    expect(
      result.solar_spectral_color_temperature
        .color_temperature_planck_wien_K,
    ).toBeCloseTo(5795.54391, 5);
    expect(
      result.solar_spectral_color_temperature
        .peak_grid_bracket_wavelength_nm,
    ).toEqual({ lower: 490, upper: 520 });
    expect(
      result.solar_spectral_color_temperature
        .color_temperature_grid_bracket_K,
    ).toEqual({
      lower: expect.closeTo(5572.638375, 5),
      upper: expect.closeTo(5913.820316, 5),
    });
    expect(
      result.solar_spectral_color_temperature
        .statistical_standard_uncertainty_K,
    ).toBeNull();
    expect(
      result.solar_spectral_color_temperature.uncertainty_status,
    ).toBe(
      "not_ready_without_response_covariance_and_peak_model",
    );
    expect(
      result.solar_spectral_color_temperature
        .measured_fit_significance,
    ).toBe("not_ready");
    expect(
      result.solar_spectral_color_temperature.band_and_model_dependent,
    ).toBe(true);
    expect(
      result.solar_bolometric_effective_temperature
        .effective_temperature_bolometric_K,
    ).toBeCloseTo(5772.003429, 5);
    expect(
      result.solar_bolometric_effective_temperature.absolute_error_K,
    ).toBeLessThan(2);
    expect(
      result.temperature_semantics.color_minus_bolometric_K,
    ).toBeGreaterThan(20);
    expect(result.temperature_semantics).toMatchObject({
      color_and_bolometric_are_distinct: true,
      equality_required: false,
      independent_significance: "not_ready",
      gate: "pass",
    });
    expect(
      result.solar_spectral_color_temperature.perfect_blackbody_claimed,
    ).toBe(false);
    expect(
      result.solar_bolometric_effective_temperature
        .stellar_structure_prediction,
    ).toBe(false);
  });

  it("keeps calibration closure separate from DP, manifold, and cosmological claims", async () => {
    const result =
      evaluateCasimirDpPlanckSolarCalibrationStage4_2A(
        await loadRawFixture(),
      );

    expect(result.promotion_allowed).toBe(false);
    expect(result.semantic_nonbridge).toEqual({
      cross_scale_statement:
        "shared_constants_and_dimensions_are_calibration_dependencies_not_mechanism_evidence",
      observable_bridge_edges_added: 0,
      apparatus_thermal_transfer_modeled: false,
      dp_rate_computed: false,
      cosmological_kernel_registered: false,
      gate: "pass",
    });
    expect(result.final_gates).toMatchObject({
      planck_spectral_density_closure: "pass",
      stefan_boltzmann_closure: "pass",
      solar_color_temperature_recovery: "pass",
      solar_bolometric_temperature_recovery: "pass",
      temperature_semantics: "pass",
      cross_scale_dependency_semantics: "pass",
      independent_solar_validation: "not_ready",
      measured_spectral_fit_significance: "not_ready",
      stellar_structure_inference: "not_evaluated",
      thermal_to_dp_transfer: "blocked",
      compton_to_collapse_clock: "blocked",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      cosmological_lift: "blocked",
      physical_viability: "not_evaluated",
      publication_claim:
        "diagnostic_planck_solar_radiometric_calibration_only",
    });
  });

  it("fails closed when the frozen TSIS snapshot hash is altered", async () => {
    const raw = await loadRawFixture();
    (raw.tsis_hsrs_snapshot as {
      actual_snapshot_sha256: string;
    }).actual_snapshot_sha256 = "0".repeat(64);

    const result =
      evaluateCasimirDpPlanckSolarCalibrationStage4_2A(raw);
    expect(result.status).toBe("not_ready");
    expect(result.first_failure_code).toBe(
      "PS_SOURCE_PROVENANCE_INVALID",
    );
    expect(result.provenance.gate).toBe("blocked");
  });

  it("rejects a rewritten exact hbar literal before evaluation", async () => {
    const raw = await loadRawFixture();
    (raw.constants as { hbar_J_s: number }).hbar_J_s *= 1.01;

    expect(() =>
      CasimirDpPlanckSolarCalibrationStage4_2AInput.parse(raw)
    ).toThrow(/Invalid literal value/);
  });

  it("rejects coordinated rewrites of frozen Wien and IAU source literals", async () => {
    const wienRewrite = await loadRawFixture();
    (wienRewrite.constants as {
      wien_lambda_displacement_m_K: number;
    }).wien_lambda_displacement_m_K = 0.0029;
    const wienSnapshot = wienRewrite.tsis_hsrs_snapshot as {
      accepted_color_temperature_min_K: number;
      accepted_color_temperature_max_K: number;
    };
    wienSnapshot.accepted_color_temperature_min_K = 5600;
    wienSnapshot.accepted_color_temperature_max_K = 6000;
    expect(() =>
      CasimirDpPlanckSolarCalibrationStage4_2AInput.parse(
        wienRewrite,
      )
    ).toThrow(/Invalid literal value/);

    const iauRewrite = await loadRawFixture();
    const iau = iauRewrite.iau_solar_bolometric as {
      luminosity_W: number;
      photospheric_radius_m: number;
      nominal_effective_temperature_K: number;
    };
    iau.luminosity_W = 3.83e26;
    iau.photospheric_radius_m = 696_000_000;
    iau.nominal_effective_temperature_K = 5778;
    expect(() =>
      CasimirDpPlanckSolarCalibrationStage4_2AInput.parse(iauRewrite)
    ).toThrow(/Invalid literal value/);
  });

  it("fails color-temperature recovery when the frozen maximum is a window boundary", async () => {
    const raw = await loadRawFixture();
    const points = (raw.tsis_hsrs_snapshot as {
      points: Array<{
        wavelength_nm: number;
        irradiance_W_m2_nm: number;
      }>;
    }).points;
    const firstUsedPoint = points.find(
      (point) => point.wavelength_nm === 480,
    );
    if (firstUsedPoint === undefined) {
      throw new Error("fixture lacks the 480 nm peak-window point");
    }
    firstUsedPoint.irradiance_W_m2_nm = 3;

    const result =
      evaluateCasimirDpPlanckSolarCalibrationStage4_2A(raw);
    expect(result.failures).toContain(
      "PS_COLOR_TEMPERATURE_FAILED",
    );
    expect(
      result.final_gates.solar_color_temperature_recovery,
    ).toBe("blocked");
  });

  it("rejects odd Simpson grids, unknown mechanism fields, and conflated semantics", async () => {
    const oddGrid = await loadRawFixture();
    (oddGrid.numerical_integration as {
      simpson_intervals: number;
    }).simpson_intervals = 4095;
    expect(() =>
      CasimirDpPlanckSolarCalibrationStage4_2AInput.parse(oddGrid)
    ).toThrow(/even interval count/);

    const unknownBridge = await loadRawFixture();
    unknownBridge.dp_transfer_kernel = { status: "assumed" };
    expect(() =>
      CasimirDpPlanckSolarCalibrationStage4_2AInput.parse(
        unknownBridge,
      )
    ).toThrow();

    const conflated = await loadRawFixture();
    (conflated.nonbridge_policy as {
      color_temperature_equals_effective_temperature: boolean;
    }).color_temperature_equals_effective_temperature = true;
    expect(() =>
      CasimirDpPlanckSolarCalibrationStage4_2AInput.parse(
        conflated,
      )
    ).toThrow();
  });

  it("uses a stable deterministic failure order", async () => {
    expect(
      CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_FAILURE_ORDER,
    ).toEqual([
      "PS_SOURCE_PROVENANCE_INVALID",
      "PS_CONSTANT_OR_UNIT_CONTRACT_INVALID",
      "PS_SPECTRAL_INPUT_INVALID",
      "PS_FREQUENCY_JACOBIAN_FAILED",
      "PS_PLANCK_INTEGRAL_FAILED",
      "PS_STEFAN_BOLTZMANN_FAILED",
      "PS_COLOR_TEMPERATURE_FAILED",
      "PS_SOLAR_GEOMETRY_INVALID",
      "PS_BOLOMETRIC_TEMPERATURE_FAILED",
      "PS_TEMPERATURE_SEMANTICS_CONFLATED",
      "PS_CORRELATED_INPUTS_MISLABELED",
      "PS_NONBRIDGE_POLICY_FAILED",
    ]);

    const raw = await loadRawFixture();
    (raw.tsis_hsrs_snapshot as {
      actual_snapshot_sha256: string;
    }).actual_snapshot_sha256 = "0".repeat(64);
    (raw.numerical_integration as {
      x_max: number;
    }).x_max = 1;
    const points = (raw.tsis_hsrs_snapshot as {
      points: Array<{ wavelength_nm: number }>;
    }).points;
    [points[0].wavelength_nm, points[1].wavelength_nm] = [
      points[1].wavelength_nm,
      points[0].wavelength_nm,
    ];

    const result =
      evaluateCasimirDpPlanckSolarCalibrationStage4_2A(raw);
    expect(result.failures.slice(0, 3)).toEqual([
      "PS_SOURCE_PROVENANCE_INVALID",
      "PS_SPECTRAL_INPUT_INVALID",
      "PS_PLANCK_INTEGRAL_FAILED",
    ]);
  });
});
