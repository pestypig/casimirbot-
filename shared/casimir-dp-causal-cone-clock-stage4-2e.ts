import { createHash } from "node:crypto";
import type {
  CasimirDpCausalConeClockStage4_2EConfig,
} from "./contracts/casimir-dp-causal-cone-clock-stage4-2e.v1";

type Vec3 = readonly [number, number, number];
type Matrix3 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
];

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

function canonicalize(value: unknown): JsonValue {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value == null || typeof value !== "object") {
    if (typeof value === "number" && Object.is(value, -0)) return 0;
    return value as JsonValue;
  }
  return Object.fromEntries(
    Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [
        key,
        canonicalize((value as Record<string, unknown>)[key]),
      ]),
  );
}

function sha256(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)), "utf8")
    .digest("hex");
}

function add(lhs: Vec3, rhs: Vec3): Vec3 {
  return [lhs[0] + rhs[0], lhs[1] + rhs[1], lhs[2] + rhs[2]];
}

function scale(value: Vec3, factor: number): Vec3 {
  return [value[0] * factor, value[1] * factor, value[2] * factor];
}

function euclideanNorm(value: Vec3): number {
  return Math.hypot(value[0], value[1], value[2]);
}

function metricDot(metric: Matrix3, lhs: Vec3, rhs: Vec3): number {
  let sum = 0;
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      sum += lhs[row]! * metric[row]![column]! * rhs[column]!;
    }
  }
  return sum;
}

function determinant3(metric: Matrix3): number {
  const [[a, b, c], [d, e, f], [g, h, i]] = metric;
  return a * (e * i - f * h) -
    b * (d * i - f * g) +
    c * (d * h - e * g);
}

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) /
    Math.max(Math.abs(expected), Number.MIN_VALUE);
}

function simpson(
  fn: (value: number) => number,
  lower: number,
  upper: number,
  intervals: number,
): number {
  const count = intervals % 2 === 0 ? intervals : intervals + 1;
  const step = (upper - lower) / count;
  let sum = fn(lower) + fn(upper);
  for (let index = 1; index < count; index += 1) {
    sum += (index % 2 === 0 ? 2 : 4) * fn(lower + index * step);
  }
  return sum * step / 3;
}

function evaluateAdmBenchmark(
  config: CasimirDpCausalConeClockStage4_2EConfig,
  row: CasimirDpCausalConeClockStage4_2EConfig["adm_benchmarks"][number],
) {
  const metric = row.spatial_metric as Matrix3;
  const shift = row.shift as Vec3;
  const rawDirection = row.direction as Vec3;
  const directionNorm = euclideanNorm(rawDirection);
  const direction = scale(rawDirection, 1 / directionNorm);
  const a = metricDot(metric, direction, direction);
  const b = metricDot(metric, direction, shift);
  const c = metricDot(metric, shift, shift) - row.lapse ** 2;
  const discriminant = b ** 2 - a * c;
  if (!(discriminant > 0)) {
    throw new Error(`stage4_2e_nonhyperbolic_local_cone:${row.case_id}`);
  }
  const root = Math.sqrt(discriminant);
  const minusLambda = (-b - root) / a;
  const plusLambda = (-b + root) / a;
  const minusVelocity = scale(direction, minusLambda);
  const plusVelocity = scale(direction, plusLambda);
  const minusResidual = row.lapse ** 2 -
    metricDot(metric, add(minusVelocity, shift), add(minusVelocity, shift));
  const plusResidual = row.lapse ** 2 -
    metricDot(metric, add(plusVelocity, shift), add(plusVelocity, shift));

  const timelikeVelocity = row.timelike_coordinate_velocity_over_c as Vec3;
  const timelikeTransport = add(timelikeVelocity, shift);
  const clockRateSquared = row.lapse ** 2 -
    metricDot(metric, timelikeTransport, timelikeTransport);
  const clockRate = clockRateSquared > 0 ? Math.sqrt(clockRateSquared) : 0;
  const clockIdentityError = Math.abs(
    clockRate ** 2 +
      metricDot(metric, timelikeTransport, timelikeTransport) -
      row.lapse ** 2,
  );

  const leadingMinors = [
    metric[0][0],
    metric[0][0] * metric[1][1] - metric[0][1] * metric[1][0],
    determinant3(metric),
  ];
  const symmetryError = Math.max(
    Math.abs(metric[0][1] - metric[1][0]),
    Math.abs(metric[0][2] - metric[2][0]),
    Math.abs(metric[1][2] - metric[2][1]),
  );
  const positiveDefinite = leadingMinors.every(
    (value) =>
      value >= config.thresholds.minimum_spatial_metric_leading_minor,
  );
  const nullConstraintError = Math.max(
    Math.abs(minusResidual),
    Math.abs(plusResidual),
  );
  const plusTravelTimeS =
    plusLambda > 0
      ? row.segment_length_m / (plusLambda * config.constants.c_m_s)
      : Number.POSITIVE_INFINITY;
  const minusTravelTimeS =
    minusLambda < 0
      ? row.segment_length_m /
        (Math.abs(minusLambda) * config.constants.c_m_s)
      : Number.POSITIVE_INFINITY;
  const flatReferenceTimeS = row.segment_length_m / config.constants.c_m_s;
  const gate =
    row.lapse > 0 &&
      positiveDefinite &&
      symmetryError <=
        config.thresholds.maximum_null_constraint_absolute_error &&
      clockRateSquared > 0 &&
      nullConstraintError <=
        config.thresholds.maximum_null_constraint_absolute_error &&
      clockIdentityError <=
        config.thresholds.maximum_clock_identity_absolute_error &&
      relativeError(clockRate, row.expected_clock_rate) <=
        config.thresholds.maximum_clock_identity_absolute_error &&
      Number.isFinite(plusTravelTimeS) &&
      Number.isFinite(minusTravelTimeS)
      ? "pass"
      : "blocked";

  return {
    case_id: row.case_id,
    authority: row.authority,
    gate,
    lapse: row.lapse,
    shift,
    spatial_metric_leading_minors: leadingMinors,
    spatial_metric_symmetry_error: symmetryError,
    spatial_metric_positive_definite: positiveDefinite,
    null_coordinate_velocity_over_c: {
      minus: minusVelocity,
      plus: plusVelocity,
      directional_roots: { minus: minusLambda, plus: plusLambda },
    },
    null_constraint_residual: {
      minus: minusResidual,
      plus: plusResidual,
      maximum_absolute: nullConstraintError,
    },
    timelike_clock: {
      coordinate_velocity_over_c: timelikeVelocity,
      rate_d_tau_d_t: clockRate,
      expected_rate_d_tau_d_t: row.expected_clock_rate,
      inside_cone: clockRateSquared > 0,
      identity_absolute_error: clockIdentityError,
    },
    bounded_light_time: {
      segment_length_m: row.segment_length_m,
      plus_coordinate_time_s: plusTravelTimeS,
      minus_coordinate_time_s: minusTravelTimeS,
      round_trip_coordinate_time_s: plusTravelTimeS + minusTravelTimeS,
      flat_l_over_c_reference_s: flatReferenceTimeS,
      plus_to_flat_reference_ratio: plusTravelTimeS / flatReferenceTimeS,
      reference_is_solved_null_geodesic: false,
    },
  } as const;
}

export function evaluateCasimirDpCausalConeClockStage4_2E(
  config: CasimirDpCausalConeClockStage4_2EConfig,
) {
  const admCases = config.adm_benchmarks.map((row) =>
    evaluateAdmBenchmark(config, row)
  );
  const maximumNullError = Math.max(
    ...admCases.map((row) => row.null_constraint_residual.maximum_absolute),
  );
  const maximumClockError = Math.max(
    ...admCases.map((row) => row.timelike_clock.identity_absolute_error),
  );
  const admGate = admCases.every((row) => row.gate === "pass")
    ? "pass"
    : "blocked";

  const radial = config.weak_field_radial_null_recovery;
  const schwarzschildRadiusM =
    2 * config.constants.G_m3_kg_s2 * radial.central_mass_kg /
    config.constants.c_m_s ** 2;
  const emitterF = 1 - schwarzschildRadiusM / radial.emitter_radius_m;
  const reflectorF = 1 - schwarzschildRadiusM / radial.reflector_radius_m;
  const emitterClockRate = Math.sqrt(emitterF);
  const reflectorClockRate = Math.sqrt(reflectorF);
  const analyticOneWayCoordinateTimeS = (
    radial.reflector_radius_m -
    radial.emitter_radius_m +
    schwarzschildRadiusM *
      Math.log(
        (radial.reflector_radius_m - schwarzschildRadiusM) /
          (radial.emitter_radius_m - schwarzschildRadiusM),
      )
  ) / config.constants.c_m_s;
  const numericOneWayCoordinateTimeS = simpson(
    (radiusM) =>
      1 /
      (
        config.constants.c_m_s *
        (1 - schwarzschildRadiusM / radiusM)
      ),
    radial.emitter_radius_m,
    radial.reflector_radius_m,
    4096,
  );
  const weakFieldRecoveryError = relativeError(
    numericOneWayCoordinateTimeS,
    analyticOneWayCoordinateTimeS,
  );
  const emitterNullCoordinateSpeedMS =
    config.constants.c_m_s * emitterF;
  const emitterNullConstraintResidual =
    emitterF -
    (1 / emitterF) *
      (emitterNullCoordinateSpeedMS / config.constants.c_m_s) ** 2;
  const flatOneWayTimeS =
    (radial.reflector_radius_m - radial.emitter_radius_m) /
    config.constants.c_m_s;
  const emitterRadarProperTimeS =
    2 * emitterClockRate * analyticOneWayCoordinateTimeS;
  const weakFieldGate =
    radial.emitter_radius_m > schwarzschildRadiusM &&
      radial.reflector_radius_m > radial.emitter_radius_m &&
      Math.abs(emitterNullConstraintResidual) <=
        config.thresholds.maximum_null_constraint_absolute_error &&
      weakFieldRecoveryError <=
        config.thresholds.maximum_weak_field_recovery_relative_error
      ? "pass"
      : "blocked";

  const casimir = config.casimir_semiclassical_screen;
  const casimirEnergyDensityJM3 = -(
    Math.PI ** 2 *
    config.constants.hbar_J_s *
    config.constants.c_m_s /
    (720 * casimir.gap_m ** 4)
  );
  const casimirPressurePa = -(
    Math.PI ** 2 *
    config.constants.hbar_J_s *
    config.constants.c_m_s /
    (240 * casimir.gap_m ** 4)
  );
  const interactionEnergyJ =
    casimirEnergyDensityJM3 * casimir.plate_area_m2 * casimir.gap_m;
  const interactionMassKg =
    interactionEnergyJ / config.constants.c_m_s ** 2;
  const curvatureScaleM2Inv =
    8 * Math.PI * config.constants.G_m3_kg_s2 *
    Math.abs(casimirEnergyDensityJM3) /
    config.constants.c_m_s ** 4;
  const gravitationalFractionalLightTimeBound =
    curvatureScaleM2Inv * casimir.gap_m ** 2;
  const flatGapLightTimeS = casimir.gap_m / config.constants.c_m_s;
  const gravitationalLightTimeShiftBoundS =
    flatGapLightTimeS * gravitationalFractionalLightTimeBound;
  const casimirScreenGate =
    gravitationalFractionalLightTimeBound <=
      config.thresholds.maximum_direct_gravitational_fractional_light_time_bound
      ? "pass"
      : "blocked";

  const qed = config.qed_effective_propagation_control;
  const qedFractionalSpeedShift =
    qed.coefficient_11_pi2_over_2700 *
    config.constants.fine_structure_constant ** 2 *
    (
      config.constants.electron_reduced_compton_wavelength_m /
      casimir.gap_m
    ) ** 4;
  const qedLightTimeShiftMagnitudeS =
    flatGapLightTimeS * qedFractionalSpeedShift;
  const qedToGravityScaleSeparation =
    qedFractionalSpeedShift /
    Math.max(
      gravitationalFractionalLightTimeBound,
      Number.MIN_VALUE,
    );
  const qedControlGate =
    Number.isFinite(qedFractionalSpeedShift) &&
      qedFractionalSpeedShift > 0 &&
      qedToGravityScaleSeparation >=
        config.thresholds.minimum_qed_to_gravity_scale_separation &&
      qed.front_velocity_claim_allowed === false
      ? "pass"
      : "blocked";

  const signatureMatrix = [
    {
      signature_id: "universal_adm_null_and_clock_response",
      model_lane: "ordinary_gr",
      frequency_dependence: "none_in_minimally_coupled_classical_gr",
      polarization_dependence: "none_in_minimally_coupled_classical_gr",
      admitted_to_dp_rate: false,
    },
    {
      signature_id: "ideal_qed_effective_index_response",
      model_lane: "ordinary_qed_control",
      frequency_dependence: "low_frequency_effective_theory_domain",
      polarization_dependence: "must_be_measured_and_budgeted",
      admitted_to_dp_rate: false,
    },
    {
      signature_id: "material_boundary_dispersion_response",
      model_lane: "ordinary_material_control",
      frequency_dependence: "expected",
      polarization_dependence: "allowed_and_measured",
      admitted_to_dp_rate: false,
    },
    {
      signature_id: "branch_density_difference_to_dp_rate",
      model_lane: "frozen_standard_dp",
      frequency_dependence: "not_a_cavity_mode_transfer",
      polarization_dependence: "none_registered",
      admitted_to_dp_rate: true,
    },
    {
      signature_id: "boundary_conditioned_branch_metric_to_coherence",
      model_lane: "speculative_registered_bridge_slot",
      frequency_dependence: "kernel_missing",
      polarization_dependence: "kernel_missing",
      admitted_to_dp_rate: false,
    },
  ] as const;
  const prohibitedEdges = [
    "flat_l_over_c_reference_to_null_geodesic_authority",
    "negative_casimir_scalar_to_solved_metric",
    "qed_effective_index_to_gr_metric",
    "polarization_response_to_universal_metric",
    "boundary_label_to_standard_dp_rate",
    "branch_null_cone_to_collapse_without_kernel",
    "clock_rate_to_collapse_without_kernel",
  ] as const;
  const admittedDpEdges = signatureMatrix.filter(
    (row) => row.admitted_to_dp_rate,
  );
  const nonbridgeGate =
    admittedDpEdges.length === 1 &&
      admittedDpEdges[0]?.signature_id ===
        "branch_density_difference_to_dp_rate" &&
      config.observable_bridge_edges_allowed === false &&
      config.hypothesis_policy.standard_dp_boundary_modifier === false &&
      config.hypothesis_policy.branch_metric_kernel_registered === false &&
      config.hypothesis_policy.metric_to_coherence_kernel_registered === false &&
      config.hypothesis_policy.registered_dp_generator_mutated === false
      ? "pass"
      : "blocked";

  const softwareGate =
    admGate === "pass" &&
      weakFieldGate === "pass" &&
      casimirScreenGate === "pass" &&
      qedControlGate === "pass" &&
      nonbridgeGate === "pass"
      ? "pass"
      : "blocked";

  const output = {
    schema_version: "casimir_dp_causal_cone_clock_stage4_2e_result/1",
    evidence_class: config.evidence_class,
    claim_ceiling: config.claim_ceiling,
    promotion_allowed: false,
    observable_bridge_edges_added: 0,
    adm_local_causal_recovery: {
      gate: admGate,
      cases: admCases,
      maximum_null_constraint_absolute_error: maximumNullError,
      maximum_clock_identity_absolute_error: maximumClockError,
      interpretation:
        "Null rays and timelike clocks use one ADM metric. The NHM2 L/c schedule remains a reference parameterization, not a null-geodesic solve.",
    },
    bounded_radial_null_recovery: {
      gate: weakFieldGate,
      coordinate_system: radial.coordinate_system,
      schwarzschild_radius_m: schwarzschildRadiusM,
      emitter_lapse: emitterClockRate,
      reflector_lapse: reflectorClockRate,
      emitter_null_coordinate_speed_m_s: emitterNullCoordinateSpeedMS,
      emitter_null_constraint_residual: emitterNullConstraintResidual,
      analytic_one_way_coordinate_time_s: analyticOneWayCoordinateTimeS,
      numeric_one_way_coordinate_time_s: numericOneWayCoordinateTimeS,
      numerical_relative_error: weakFieldRecoveryError,
      flat_one_way_time_s: flatOneWayTimeS,
      coordinate_shapiro_excess_s:
        analyticOneWayCoordinateTimeS - flatOneWayTimeS,
      emitter_radar_round_trip_proper_time_s: emitterRadarProperTimeS,
      interpretation:
        "Analytic and numerical radial-null recovery in a fixed Schwarzschild chart; not a Casimir apparatus prediction.",
    },
    casimir_semiclassical_screen: {
      gate: casimirScreenGate,
      authority: "ideal_interaction_region_screening_bound_only",
      energy_density_J_m3: casimirEnergyDensityJM3,
      normal_pressure_Pa: casimirPressurePa,
      interaction_energy_J: interactionEnergyJ,
      interaction_mass_equivalent_kg: interactionMassKg,
      einstein_curvature_scale_m2_inv: curvatureScaleM2Inv,
      fractional_light_time_bound_over_gap:
        gravitationalFractionalLightTimeBound,
      gravitational_light_time_shift_bound_s:
        gravitationalLightTimeShiftBoundS,
      complete_apparatus_tensor_available:
        casimir.complete_apparatus_tensor_available,
      conserved_total_stress_verified:
        casimir.conserved_total_stress_verified,
      metric_boundary_conditions_registered:
        casimir.metric_boundary_conditions_registered,
      metric_response_authority: "not_ready",
      interpretation:
        "The ideal interaction energy supplies a scale screen only. Complete plates, supports, conserved total stress, renormalization, and metric boundary conditions are required for a geometry claim.",
    },
    qed_effective_propagation_control: {
      gate: qedControlGate,
      model: qed.model,
      fractional_phase_speed_shift_proxy: qedFractionalSpeedShift,
      light_time_shift_magnitude_proxy_s: qedLightTimeShiftMagnitudeS,
      qed_to_gravity_fractional_scale_separation:
        qedToGravityScaleSeparation,
      sigma_plus_proxy: qedFractionalSpeedShift * qed.sigma_plus_weight,
      sigma_minus_proxy: qedFractionalSpeedShift * qed.sigma_minus_weight,
      ideal_pair_split_proxy: 0,
      material_dispersion_measured: qed.material_dispersion_measured,
      polarization_response_measured: qed.polarization_response_measured,
      front_velocity_claim_allowed: qed.front_velocity_claim_allowed,
      measured_control_authority: "not_ready",
      interpretation:
        "An ideal low-frequency QED effective-propagation control, not a universal GR metric or signalling-speed claim.",
    },
    causal_signature_separation: {
      gate: nonbridgeGate,
      matrix: signatureMatrix,
      prohibited_edges: prohibitedEdges,
      observable_bridge_edges_added: 0,
      standard_dp_boundary_independence: true,
      branch_metric_kernel_registered: false,
      metric_to_coherence_kernel_registered: false,
    },
    final_gates: {
      software_and_causal_recovery_diagnostics: softwareGate,
      null_geodesic_apparatus_authority: "not_ready",
      complete_apparatus_metric_response: "not_ready",
      physical_pilot_readiness: "not_ready",
      measured_evidence: "not_ready",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      physical_viability: "not_evaluated",
    },
  } as const;

  return {
    ...output,
    result_receipt: {
      schema_version: "casimir_dp_stage4_2e_result_receipt/1",
      sha256: sha256(output),
    },
  };
}
