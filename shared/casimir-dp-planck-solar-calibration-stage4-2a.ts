// math-stage: diagnostic
import { z } from "zod";

export const CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_INPUT_VERSION =
  "casimir_dp_planck_solar_calibration_stage4_2a_input/1" as const;

export const CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_RESULT_VERSION =
  "casimir_dp_planck_solar_calibration_stage4_2a_result/1" as const;

export const CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_FAILURE_ORDER = [
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
] as const;

export type CasimirDpPlanckSolarCalibrationStage4_2AFailureCode =
  typeof CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_FAILURE_ORDER[number];

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const NonEmpty = z.string().min(1);

const SourceRef = z.object({
  source_id: NonEmpty,
  citation: NonEmpty,
  url: z.string().url(),
  supports: NonEmpty,
  does_not_support: NonEmpty,
}).strict();

const SpectralPoint = z.object({
  wavelength_nm: z.number().positive().finite(),
  irradiance_W_m2_nm: z.number().positive().finite(),
  standard_uncertainty_W_m2_nm: z.number().positive().finite(),
  use_for_peak: z.boolean(),
  exclusion_reason: z.string().nullable(),
}).strict();

const SpectralCheckpoint = z.object({
  checkpoint_id: NonEmpty,
  wavelength_nm: z.number().positive().finite(),
  temperature_K: z.number().positive().finite(),
}).strict();

export const CasimirDpPlanckSolarCalibrationStage4_2AInput = z.object({
  schema_version: z.literal(
    CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_INPUT_VERSION,
  ),
  calibration_id: z.literal(
    "stage4-2a-planck-solar-radiometric-calibration-v1",
  ),
  evidence_class: z.literal("source_backed_radiometric_calibration"),
  claim_ceiling: z.literal(
    "cross_scale_constant_unit_and_normalization_consistency_only",
  ),
  promotion_allowed: z.literal(false),
  source_registry: z.array(SourceRef).min(3),
  constants: z.object({
    h_J_s: z.literal(6.626_070_15e-34),
    hbar_J_s: z.literal(1.054_571_817_646_156_5e-34),
    c_m_s: z.literal(299_792_458),
    k_B_J_K: z.literal(1.380_649e-23),
    wien_lambda_displacement_m_K: z.literal(0.002_897_771_955),
    stefan_boltzmann_reference_W_m2_K4:
      z.literal(5.670_374_419e-8),
  }).strict(),
  conventions: z.object({
    internal_frequency: z.literal("cyclic_nu_Hz"),
    angular_frequency_relation: z.literal("omega_equals_2pi_nu"),
    wavelength_density_unit: z.literal("W_m-2_sr-1_m-1"),
    frequency_density_unit: z.literal("W_m-2_sr-1_Hz-1"),
    angular_frequency_density_unit:
      z.literal("W_m-2_sr-1_per_rad_s"),
    observed_solar_quantity: z.literal(
      "spectral_irradiance_at_1_AU_W_m-2_nm-1",
    ),
    color_temperature_definition: z.literal(
      "wien_peak_of_frozen_continuum_snapshot",
    ),
    bolometric_temperature_definition: z.literal(
      "flux_equivalent_L_over_4piR2_sigma",
    ),
  }).strict(),
  numerical_integration: z.object({
    x_max: z.number().positive().finite(),
    simpson_intervals: z.number().int().positive(),
    planck_moment_relative_tolerance: z.number().nonnegative().finite(),
    sigma_relative_tolerance: z.number().nonnegative().finite(),
    spectral_jacobian_relative_tolerance:
      z.number().nonnegative().finite(),
  }).strict(),
  spectral_checkpoints: z.array(SpectralCheckpoint).min(2),
  tsis_hsrs_snapshot: z.object({
    source_id: z.literal("tsis1_hsrs"),
    query_url: z.literal(
      "https://lasp.colorado.edu/lisird/latis/dap/tsis1_hsrs.csv?wavelength%3E=480&wavelength%3C=800&stride(10000)",
    ),
    source_snapshot_path: z.literal(
      "configs/research/source-snapshots/tsis1-hsrs-20260725-480-800nm.csv",
    ),
    source_snapshot_format: z.literal(
      "wavelength_nm,irradiance_W_m2_nm,standard_uncertainty_W_m2_nm",
    ),
    retrieved_at: z.literal("2026-07-25T00:00:00.000Z"),
    expected_snapshot_sha256: Sha256,
    actual_snapshot_sha256: Sha256,
    integrity_verified: z.boolean(),
    complete_cross_wavelength_covariance_supplied: z.literal(false),
    selection_frozen_before_evaluation: z.literal(true),
    points: z.array(SpectralPoint).min(5),
    accepted_color_temperature_min_K: z.literal(5700),
    accepted_color_temperature_max_K: z.literal(5900),
  }).strict(),
  iau_solar_bolometric: z.object({
    source_id: z.literal("iau_2015_resolution_b3"),
    luminosity_W: z.literal(3.828e26),
    photospheric_radius_m: z.literal(695_700_000),
    nominal_effective_temperature_K: z.literal(5772),
    absolute_tolerance_K: z.literal(2),
    emitting_area_convention: z.literal("4_pi_R_squared"),
    nominal_values_are_true_time_invariant_solar_properties:
      z.literal(false),
  }).strict(),
  dependency_semantics: z.object({
    planck_integral_and_sigma_independent_theories: z.literal(false),
    spectral_and_bolometric_temperature_independent_when_sources_overlap:
      z.literal(false),
    shared_h_is_independent_dp_evidence: z.literal(false),
    source_overlap_class: z.literal(
      "correlated_calibration_with_distinct_operational_temperature_definitions",
    ),
    cross_covariance_required_for_significance: z.literal(true),
  }).strict(),
  nonbridge_policy: z.object({
    common_constants_imply_collapse_clock: z.literal(false),
    color_temperature_equals_effective_temperature: z.literal(false),
    solar_temperature_supports_dp: z.literal(false),
    observable_bridge_edges_allowed: z.literal(false),
    apparatus_thermal_transfer_modeled: z.literal(false),
    cosmological_lift_registered: z.literal(false),
  }).strict(),
}).strict().superRefine((input, context) => {
  if (input.numerical_integration.simpson_intervals % 2 !== 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["numerical_integration", "simpson_intervals"],
      message: "Composite Simpson integration requires an even interval count.",
    });
  }
  const ids = input.source_registry.map((source) => source.source_id);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["source_registry"],
      message: "Source ids must be unique.",
    });
  }
});

export type CasimirDpPlanckSolarCalibrationStage4_2AInput = z.infer<
  typeof CasimirDpPlanckSolarCalibrationStage4_2AInput
>;

function relativeError(left: number, right: number): number {
  if (left === right) return 0;
  return Math.abs(left - right) /
    Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

function simpsonIntegral(
  upper: number,
  intervals: number,
  integrand: (x: number) => number,
): number {
  const step = upper / intervals;
  let sum = integrand(0) + integrand(upper);
  for (let index = 1; index < intervals; index += 1) {
    sum += (index % 2 === 0 ? 2 : 4) * integrand(index * step);
  }
  return sum * step / 3;
}

function planckMomentIntegrand(x: number): number {
  if (x === 0) return 0;
  if (x > 700) return 0;
  return x ** 3 / Math.expm1(x);
}

function planckSpectralDensities(args: {
  wavelengthM: number;
  temperatureK: number;
  h: number;
  c: number;
  kB: number;
}) {
  const { wavelengthM, temperatureK, h, c, kB } = args;
  const nuHz = c / wavelengthM;
  const omegaRadS = 2 * Math.PI * nuHz;
  const occupation = 1 / Math.expm1(
    h * nuHz / (kB * temperatureK),
  );
  const bLambdaPerM =
    2 * h * c ** 2 / wavelengthM ** 5 * occupation;
  const bNuPerHz = 2 * h * nuHz ** 3 / c ** 2 * occupation;
  const bOmegaPerRadS = bNuPerHz / (2 * Math.PI);
  return {
    nu_Hz: nuHz,
    omega_rad_s: omegaRadS,
    photon_energy_h_nu_J: h * nuHz,
    photon_energy_hbar_omega_J:
      h / (2 * Math.PI) * omegaRadS,
    B_lambda_W_m2_sr_m: bLambdaPerM,
    B_lambda_W_m2_sr_nm: bLambdaPerM * 1e-9,
    B_nu_W_m2_sr_Hz: bNuPerHz,
    B_omega_W_m2_sr_per_rad_s: bOmegaPerRadS,
    B_lambda_from_B_nu_W_m2_sr_m:
      bNuPerHz * c / wavelengthM ** 2,
    B_omega_from_B_nu_W_m2_sr_per_rad_s:
      bNuPerHz / (2 * Math.PI),
  };
}

function gateFromFailure(
  failures: Set<CasimirDpPlanckSolarCalibrationStage4_2AFailureCode>,
  code: CasimirDpPlanckSolarCalibrationStage4_2AFailureCode,
): "pass" | "blocked" {
  return failures.has(code) ? "blocked" : "pass";
}

export function evaluateCasimirDpPlanckSolarCalibrationStage4_2A(
  rawInput: CasimirDpPlanckSolarCalibrationStage4_2AInput,
) {
  const input = CasimirDpPlanckSolarCalibrationStage4_2AInput.parse(
    rawInput,
  );
  const failures =
    new Set<CasimirDpPlanckSolarCalibrationStage4_2AFailureCode>();
  const constants = input.constants;

  const sourceIds = new Set(
    input.source_registry.map((source) => source.source_id),
  );
  const requiredSourceIds = [
    "bipm_si_defining_constants",
    "iau_2015_resolution_b3",
    "tsis1_hsrs",
  ];
  const sourceIntegrity =
    requiredSourceIds.every((id) => sourceIds.has(id)) &&
    input.tsis_hsrs_snapshot.integrity_verified &&
    input.tsis_hsrs_snapshot.expected_snapshot_sha256 ===
      input.tsis_hsrs_snapshot.actual_snapshot_sha256;
  if (!sourceIntegrity) failures.add("PS_SOURCE_PROVENANCE_INVALID");

  const exactContract =
    constants.h_J_s === 6.626_070_15e-34 &&
    constants.c_m_s === 299_792_458 &&
    constants.k_B_J_K === 1.380_649e-23 &&
    relativeError(
      constants.hbar_J_s,
      constants.h_J_s / (2 * Math.PI),
    ) <= 1e-15;
  if (!exactContract) {
    failures.add("PS_CONSTANT_OR_UNIT_CONTRACT_INVALID");
  }

  const points = input.tsis_hsrs_snapshot.points;
  const usedPoints = points.filter((point) => point.use_for_peak);
  const spectralInputValid =
    points.every((point, index) =>
      index === 0 ||
      point.wavelength_nm > points[index - 1].wavelength_nm
    ) &&
    usedPoints.length >= 3 &&
    usedPoints.every((point) => point.exclusion_reason === null);
  if (!spectralInputValid) failures.add("PS_SPECTRAL_INPUT_INVALID");

  const checkpointRows = input.spectral_checkpoints.map((checkpoint) => {
    const densities = planckSpectralDensities({
      wavelengthM: checkpoint.wavelength_nm * 1e-9,
      temperatureK: checkpoint.temperature_K,
      h: constants.h_J_s,
      c: constants.c_m_s,
      kB: constants.k_B_J_K,
    });
    const energyError = relativeError(
      densities.photon_energy_h_nu_J,
      densities.photon_energy_hbar_omega_J,
    );
    const lambdaJacobianError = relativeError(
      densities.B_lambda_W_m2_sr_m,
      densities.B_lambda_from_B_nu_W_m2_sr_m,
    );
    const omegaJacobianError = relativeError(
      densities.B_omega_W_m2_sr_per_rad_s,
      densities.B_omega_from_B_nu_W_m2_sr_per_rad_s,
    );
    return {
      checkpoint_id: checkpoint.checkpoint_id,
      wavelength_nm: checkpoint.wavelength_nm,
      temperature_K: checkpoint.temperature_K,
      ...densities,
      energy_relative_error: energyError,
      lambda_nu_jacobian_relative_error: lambdaJacobianError,
      nu_omega_jacobian_relative_error: omegaJacobianError,
      maximum_relative_error: Math.max(
        energyError,
        lambdaJacobianError,
        omegaJacobianError,
      ),
    };
  });
  const maximumSpectralJacobianError = Math.max(
    ...checkpointRows.map((row) => row.maximum_relative_error),
  );
  if (
    maximumSpectralJacobianError >
      input.numerical_integration.spectral_jacobian_relative_tolerance
  ) {
    failures.add("PS_FREQUENCY_JACOBIAN_FAILED");
  }

  const planckMomentNumerical = simpsonIntegral(
    input.numerical_integration.x_max,
    input.numerical_integration.simpson_intervals,
    planckMomentIntegrand,
  );
  const planckMomentAnalytic = Math.PI ** 4 / 15;
  const planckMomentRelativeError = relativeError(
    planckMomentNumerical,
    planckMomentAnalytic,
  );
  if (
    planckMomentRelativeError >
      input.numerical_integration.planck_moment_relative_tolerance
  ) {
    failures.add("PS_PLANCK_INTEGRAL_FAILED");
  }

  const sigmaAnalytic =
    2 * Math.PI ** 5 * constants.k_B_J_K ** 4 /
    (15 * constants.h_J_s ** 3 * constants.c_m_s ** 2);
  const sigmaFromNumericalMoment =
    2 * Math.PI * constants.k_B_J_K ** 4 /
    (constants.h_J_s ** 3 * constants.c_m_s ** 2) *
    planckMomentNumerical;
  const sigmaIdentityRelativeError = relativeError(
    sigmaFromNumericalMoment,
    sigmaAnalytic,
  );
  const sigmaReferenceRelativeError = relativeError(
    sigmaAnalytic,
    constants.stefan_boltzmann_reference_W_m2_K4,
  );
  if (
    Math.max(sigmaIdentityRelativeError, sigmaReferenceRelativeError) >
      input.numerical_integration.sigma_relative_tolerance
  ) {
    failures.add("PS_STEFAN_BOLTZMANN_FAILED");
  }

  const peak = usedPoints.reduce((best, point) =>
    point.irradiance_W_m2_nm > best.irradiance_W_m2_nm
      ? point
      : best
  );
  const peakUsedIndex = usedPoints.indexOf(peak);
  const peakIdentified =
    peakUsedIndex > 0 && peakUsedIndex < usedPoints.length - 1;
  const lowerWavelengthNeighbor = peakIdentified
    ? usedPoints[peakUsedIndex - 1]
    : null;
  const upperWavelengthNeighbor = peakIdentified
    ? usedPoints[peakUsedIndex + 1]
    : null;
  const colorTemperatureK =
    constants.wien_lambda_displacement_m_K /
    (peak.wavelength_nm * 1e-9);
  const colorTemperatureGridBracketK =
    lowerWavelengthNeighbor != null &&
      upperWavelengthNeighbor != null
      ? {
          lower:
            constants.wien_lambda_displacement_m_K /
            (upperWavelengthNeighbor.wavelength_nm * 1e-9),
          upper:
            constants.wien_lambda_displacement_m_K /
            (lowerWavelengthNeighbor.wavelength_nm * 1e-9),
        }
      : null;
  const colorTemperatureInRange =
    peakIdentified &&
    colorTemperatureK >=
      input.tsis_hsrs_snapshot.accepted_color_temperature_min_K &&
    colorTemperatureK <=
      input.tsis_hsrs_snapshot.accepted_color_temperature_max_K;
  if (!colorTemperatureInRange) {
    failures.add("PS_COLOR_TEMPERATURE_FAILED");
  }

  const solar = input.iau_solar_bolometric;
  if (solar.emitting_area_convention !== "4_pi_R_squared") {
    failures.add("PS_SOLAR_GEOMETRY_INVALID");
  }
  const emittingAreaM2 = 4 * Math.PI * solar.photospheric_radius_m ** 2;
  const effectiveTemperatureK = (
    solar.luminosity_W / (emittingAreaM2 * sigmaAnalytic)
  ) ** 0.25;
  const luminosityRoundTripW =
    emittingAreaM2 * sigmaAnalytic * effectiveTemperatureK ** 4;
  const bolometricTemperatureAbsoluteErrorK = Math.abs(
    effectiveTemperatureK - solar.nominal_effective_temperature_K,
  );
  if (
    bolometricTemperatureAbsoluteErrorK >
      solar.absolute_tolerance_K ||
    relativeError(luminosityRoundTripW, solar.luminosity_W) > 1e-14
  ) {
    failures.add("PS_BOLOMETRIC_TEMPERATURE_FAILED");
  }

  const temperatureSemanticsPass =
    input.conventions.color_temperature_definition ===
      "wien_peak_of_frozen_continuum_snapshot" &&
    input.conventions.bolometric_temperature_definition ===
      "flux_equivalent_L_over_4piR2_sigma" &&
    !input.nonbridge_policy
      .color_temperature_equals_effective_temperature;
  if (!temperatureSemanticsPass) {
    failures.add("PS_TEMPERATURE_SEMANTICS_CONFLATED");
  }

  const dependencySemanticsPass =
    !input.dependency_semantics
      .planck_integral_and_sigma_independent_theories &&
    !input.dependency_semantics
      .spectral_and_bolometric_temperature_independent_when_sources_overlap &&
    !input.dependency_semantics.shared_h_is_independent_dp_evidence &&
    input.dependency_semantics
      .cross_covariance_required_for_significance;
  if (!dependencySemanticsPass) {
    failures.add("PS_CORRELATED_INPUTS_MISLABELED");
  }

  const nonbridgePass =
    !input.nonbridge_policy.common_constants_imply_collapse_clock &&
    !input.nonbridge_policy.solar_temperature_supports_dp &&
    !input.nonbridge_policy.observable_bridge_edges_allowed &&
    !input.nonbridge_policy.apparatus_thermal_transfer_modeled &&
    !input.nonbridge_policy.cosmological_lift_registered;
  if (!nonbridgePass) failures.add("PS_NONBRIDGE_POLICY_FAILED");

  const orderedFailures =
    CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_FAILURE_ORDER
      .filter((code) => failures.has(code));

  return {
    schema_version:
      CASIMIR_DP_PLANCK_SOLAR_CALIBRATION_STAGE4_2A_RESULT_VERSION,
    input_schema_version: input.schema_version,
    calibration_id: input.calibration_id,
    status:
      orderedFailures.length === 0
        ? "pass" as const
        : "not_ready" as const,
    evidence_class: input.evidence_class,
    claim_ceiling: input.claim_ceiling,
    promotion_allowed: false as const,
    failures: orderedFailures,
    first_failure_code: orderedFailures[0] ?? null,
    provenance: {
      source_ids: [...sourceIds],
      tsis_source_snapshot_path:
        input.tsis_hsrs_snapshot.source_snapshot_path,
      tsis_snapshot_expected_sha256:
        input.tsis_hsrs_snapshot.expected_snapshot_sha256,
      tsis_snapshot_actual_sha256:
        input.tsis_hsrs_snapshot.actual_snapshot_sha256,
      complete_cross_wavelength_covariance_supplied: false as const,
      measured_fit_significance:
        "not_computable_without_complete_cross_wavelength_covariance" as const,
      gate: gateFromFailure(
        failures,
        "PS_SOURCE_PROVENANCE_INVALID",
      ),
    },
    constants: {
      h_J_s: constants.h_J_s,
      hbar_J_s: constants.hbar_J_s,
      c_m_s: constants.c_m_s,
      k_B_J_K: constants.k_B_J_K,
      wien_lambda_displacement_m_K:
        constants.wien_lambda_displacement_m_K,
      gate: gateFromFailure(
        failures,
        "PS_CONSTANT_OR_UNIT_CONTRACT_INVALID",
      ),
    },
    spectral_density_closure: {
      checkpoints: checkpointRows,
      maximum_relative_error: maximumSpectralJacobianError,
      B_lambda_per_m_to_per_nm_factor: 1e-9 as const,
      gate: gateFromFailure(
        failures,
        "PS_FREQUENCY_JACOBIAN_FAILED",
      ),
    },
    planck_stefan_boltzmann: {
      planck_moment_numerical: planckMomentNumerical,
      planck_moment_analytic: planckMomentAnalytic,
      planck_moment_relative_error: planckMomentRelativeError,
      sigma_numerical_W_m2_K4: sigmaFromNumericalMoment,
      sigma_analytic_W_m2_K4: sigmaAnalytic,
      sigma_reference_W_m2_K4:
        constants.stefan_boltzmann_reference_W_m2_K4,
      sigma_identity_relative_error: sigmaIdentityRelativeError,
      sigma_reference_relative_error: sigmaReferenceRelativeError,
      planck_integral_gate: gateFromFailure(
        failures,
        "PS_PLANCK_INTEGRAL_FAILED",
      ),
      stefan_boltzmann_gate: gateFromFailure(
        failures,
        "PS_STEFAN_BOLTZMANN_FAILED",
      ),
    },
    solar_spectral_color_temperature: {
      method: input.conventions.color_temperature_definition,
      peak_wavelength_nm: peak.wavelength_nm,
      peak_irradiance_W_m2_nm: peak.irradiance_W_m2_nm,
      color_temperature_planck_wien_K: colorTemperatureK,
      peak_grid_bracket_wavelength_nm:
        lowerWavelengthNeighbor != null &&
          upperWavelengthNeighbor != null
          ? {
              lower: lowerWavelengthNeighbor.wavelength_nm,
              upper: upperWavelengthNeighbor.wavelength_nm,
            }
          : null,
      color_temperature_grid_bracket_K:
        colorTemperatureGridBracketK,
      statistical_standard_uncertainty_K: null,
      uncertainty_status:
        "not_ready_without_response_covariance_and_peak_model" as const,
      brightness_temperature_lambda_K: null,
      band_and_model_dependent: true as const,
      perfect_blackbody_claimed: false as const,
      measured_fit_significance: "not_ready" as const,
      gate: gateFromFailure(
        failures,
        "PS_COLOR_TEMPERATURE_FAILED",
      ),
    },
    solar_bolometric_effective_temperature: {
      method: input.conventions.bolometric_temperature_definition,
      luminosity_W: solar.luminosity_W,
      photospheric_radius_m: solar.photospheric_radius_m,
      emitting_area_m2: emittingAreaM2,
      effective_temperature_bolometric_K: effectiveTemperatureK,
      nominal_reference_temperature_K:
        solar.nominal_effective_temperature_K,
      absolute_error_K: bolometricTemperatureAbsoluteErrorK,
      luminosity_round_trip_W: luminosityRoundTripW,
      flux_equivalent_definition: true as const,
      stellar_structure_prediction: false as const,
      gate: gateFromFailure(
        failures,
        "PS_BOLOMETRIC_TEMPERATURE_FAILED",
      ),
    },
    temperature_semantics: {
      color_and_bolometric_are_distinct: true as const,
      color_minus_bolometric_K:
        colorTemperatureK - effectiveTemperatureK,
      equality_required: false as const,
      source_overlap_class:
        input.dependency_semantics.source_overlap_class,
      independent_significance: "not_ready" as const,
      gate: gateFromFailure(
        failures,
        "PS_TEMPERATURE_SEMANTICS_CONFLATED",
      ),
    },
    semantic_nonbridge: {
      cross_scale_statement:
        "shared_constants_and_dimensions_are_calibration_dependencies_not_mechanism_evidence" as const,
      observable_bridge_edges_added: 0 as const,
      apparatus_thermal_transfer_modeled: false as const,
      dp_rate_computed: false as const,
      cosmological_kernel_registered: false as const,
      gate: gateFromFailure(
        failures,
        "PS_NONBRIDGE_POLICY_FAILED",
      ),
    },
    final_gates: {
      planck_spectral_density_closure:
        failureGate(
          failures,
          [
            "PS_CONSTANT_OR_UNIT_CONTRACT_INVALID",
            "PS_FREQUENCY_JACOBIAN_FAILED",
          ],
        ),
      stefan_boltzmann_closure:
        failureGate(
          failures,
          ["PS_PLANCK_INTEGRAL_FAILED", "PS_STEFAN_BOLTZMANN_FAILED"],
        ),
      solar_color_temperature_recovery:
        failureGate(
          failures,
          ["PS_SPECTRAL_INPUT_INVALID", "PS_COLOR_TEMPERATURE_FAILED"],
        ),
      solar_bolometric_temperature_recovery:
        failureGate(
          failures,
          ["PS_SOLAR_GEOMETRY_INVALID", "PS_BOLOMETRIC_TEMPERATURE_FAILED"],
        ),
      temperature_semantics:
        gateFromFailure(
          failures,
          "PS_TEMPERATURE_SEMANTICS_CONFLATED",
        ),
      cross_scale_dependency_semantics:
        gateFromFailure(
          failures,
          "PS_CORRELATED_INPUTS_MISLABELED",
        ),
      independent_solar_validation: "not_ready" as const,
      measured_spectral_fit_significance: "not_ready" as const,
      stellar_structure_inference: "not_evaluated" as const,
      thermal_to_dp_transfer: "blocked" as const,
      compton_to_collapse_clock: "blocked" as const,
      collapse_identification: "blocked" as const,
      manifold_dynamics: "blocked" as const,
      cosmological_lift: "blocked" as const,
      physical_viability: "not_evaluated" as const,
      publication_claim:
        "diagnostic_planck_solar_radiometric_calibration_only" as const,
    },
  };
}

function failureGate(
  failures: Set<CasimirDpPlanckSolarCalibrationStage4_2AFailureCode>,
  codes: CasimirDpPlanckSolarCalibrationStage4_2AFailureCode[],
): "pass" | "blocked" {
  return codes.some((code) => failures.has(code)) ? "blocked" : "pass";
}

export type CasimirDpPlanckSolarCalibrationStage4_2AResult =
  ReturnType<
    typeof evaluateCasimirDpPlanckSolarCalibrationStage4_2A
  >;
