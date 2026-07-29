import { createHash } from "node:crypto";
import type {
  CasimirDpCrossScaleMetrologyStage4_2DConfig,
} from "./contracts/casimir-dp-cross-scale-metrology-stage4-2d.v1";

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

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) /
    Math.max(Math.abs(expected), Number.MIN_VALUE);
}

function diagonalMatrix(values: number[]): number[][] {
  return values.map((value, row) =>
    values.map((_, column) => row === column ? value : 0)
  );
}

export function evaluateCasimirDpCrossScaleMetrologyStage4_2D(
  config: CasimirDpCrossScaleMetrologyStage4_2DConfig,
) {
  const { constants, spectroscopic_witness: witness } = config;
  const zeemanShiftHz =
    witness.zeeman.lande_g *
    witness.zeeman.magnetic_quantum_number *
    constants.mu_B_J_T *
    witness.zeeman.magnetic_field_T /
    constants.h_J_s;
  const zeemanResponseHzPerT =
    witness.zeeman.lande_g *
    witness.zeeman.magnetic_quantum_number *
    constants.mu_B_J_T /
    constants.h_J_s;
  const circularPairSeparationHz =
    2 *
    witness.zeeman.lande_g *
    constants.mu_B_J_T *
    witness.zeeman.magnetic_field_T /
    constants.h_J_s;

  const starkShiftHz =
    -0.5 *
    witness.stark.differential_polarizability_Hz_per_V2_m2 *
    witness.stark.electric_field_V_m ** 2;
  const starkResponseHzPerVm =
    -witness.stark.differential_polarizability_Hz_per_V2_m2 *
    witness.stark.electric_field_V_m;

  const bbr = witness.blackbody_dynamic_stark;
  const blackbodyStarkShiftHz =
    bbr.coefficient_Hz_K4 *
    (bbr.temperature_K ** 4 - bbr.reference_temperature_K ** 4);
  const blackbodyResponseHzPerK =
    4 * bbr.coefficient_Hz_K4 * bbr.temperature_K ** 3;

  const standardUncertaintiesHz = [
    Math.abs(
      zeemanResponseHzPerT *
      witness.zeeman.magnetic_field_standard_uncertainty_T,
    ),
    Math.abs(
      starkResponseHzPerVm *
      witness.stark.electric_field_standard_uncertainty_V_m,
    ),
    Math.abs(
      blackbodyResponseHzPerK *
      bbr.temperature_standard_uncertainty_K,
    ),
  ];
  const covariance = diagonalMatrix(
    standardUncertaintiesHz.map((value) => value ** 2),
  );
  const covarianceAsymmetry = covariance.reduce(
    (maximum, row, rowIndex) =>
      Math.max(
        maximum,
        ...row.map((value, columnIndex) =>
          Math.abs(value - (covariance[columnIndex]?.[rowIndex] ?? 0))
        ),
      ),
    0,
  );
  const minimumCovarianceDiagonal = Math.min(
    ...covariance.map((row, index) => row[index] ?? 0),
  );

  const compactness = config.gravitational_recovery.compactness_cases.map(
    (row) => {
      const schwarzschildRadiusM =
        2 * constants.G_m3_kg_s2 * row.mass_kg /
        constants.c_m_s ** 2;
      const value = schwarzschildRadiusM / row.radius_m;
      return {
        ...row,
        schwarzschild_radius_m: schwarzschildRadiusM,
        compactness: value,
        gate: value <= row.expected_compactness_max ? "pass" : "blocked",
        interpretation:
          "Relativistic compactness recovery only; not a DP threshold.",
      };
    },
  );

  const potato = config.gravitational_recovery.potato_crossover;
  const potatoRadiusM = Math.sqrt(
    potato.yield_strength_Pa /
      (
        potato.geometry_coefficient *
        constants.G_m3_kg_s2 *
        potato.density_kg_m3 ** 2
      ),
  );
  const potatoGate =
    potatoRadiusM >= potato.expected_radius_min_m &&
      potatoRadiusM <= potato.expected_radius_max_m
      ? "pass"
      : "blocked";

  const jeans = config.gravitational_recovery.jeans_crossover;
  const meanParticleMassKg = jeans.molecular_weight_u * constants.m_u_kg;
  const massDensityKgM3 = jeans.number_density_m3 * meanParticleMassKg;
  const soundSpeedMS = Math.sqrt(
    constants.k_B_J_K * jeans.temperature_K / meanParticleMassKg,
  );
  const jeansLengthM = soundSpeedMS * Math.sqrt(
    Math.PI / (constants.G_m3_kg_s2 * massDensityKgM3),
  );
  const jeansMassKg =
    Math.PI ** 2.5 * soundSpeedMS ** 3 /
    (
      6 *
      constants.G_m3_kg_s2 ** 1.5 *
      Math.sqrt(massDensityKgM3)
    );
  const freeFallTimeS = Math.sqrt(
    3 * Math.PI /
      (32 * constants.G_m3_kg_s2 * massDensityKgM3),
  );
  const jeansGate =
    jeansLengthM >= jeans.expected_jeans_length_min_m &&
      jeansLengthM <= jeans.expected_jeans_length_max_m
      ? "pass"
      : "blocked";

  const algebraicReplay = {
    zeeman_energy_frequency_relative_error: relativeError(
      constants.h_J_s * zeemanShiftHz,
      witness.zeeman.lande_g *
        witness.zeeman.magnetic_quantum_number *
        constants.mu_B_J_T *
        witness.zeeman.magnetic_field_T,
    ),
    stark_derivative_central_difference_relative_error: relativeError(
      starkResponseHzPerVm,
      (
        -0.5 *
          witness.stark.differential_polarizability_Hz_per_V2_m2 *
          (witness.stark.electric_field_V_m + 1) ** 2 -
        (
          -0.5 *
          witness.stark.differential_polarizability_Hz_per_V2_m2 *
          (witness.stark.electric_field_V_m - 1) ** 2
        )
      ) / 2,
    ),
    compactness_identity_relative_error: relativeError(
      compactness[0]?.compactness ?? 0,
      (compactness[0]?.schwarzschild_radius_m ?? 0) /
        (compactness[0]?.radius_m ?? 1),
    ),
  };
  const maximumAlgebraicRelativeError = Math.max(
    ...Object.values(algebraicReplay),
  );

  const congruenceMatrix = [
    {
      relation_id: "electric_field_to_stark_frequency",
      relation_class: "sourced_calibration_transfer",
      source_quantity: "electric_field_V_m",
      target_quantity: "spectroscopic_frequency_shift_Hz",
      admitted_to_dp_rate: false,
    },
    {
      relation_id: "magnetic_field_to_zeeman_frequency",
      relation_class: "sourced_calibration_transfer",
      source_quantity: "magnetic_flux_density_T",
      target_quantity: "spectroscopic_frequency_shift_Hz",
      admitted_to_dp_rate: false,
    },
    {
      relation_id: "blackbody_field_to_dynamic_stark_frequency",
      relation_class: "sourced_calibration_transfer",
      source_quantity: "temperature_K",
      target_quantity: "spectroscopic_frequency_shift_Hz",
      admitted_to_dp_rate: false,
    },
    {
      relation_id: "maxwell_and_curvature_spinors",
      relation_class: "representation_equivalence",
      source_quantity: "classical_field_or_curvature",
      target_quantity: "spinor_representation",
      admitted_to_dp_rate: false,
    },
    {
      relation_id: "mass_radius_to_schwarzschild_compactness",
      relation_class: "classical_gravity_recovery",
      source_quantity: "mass_and_radius",
      target_quantity: "dimensionless_compactness",
      admitted_to_dp_rate: false,
    },
    {
      relation_id: "yield_strength_to_potato_crossover",
      relation_class: "classical_gravity_recovery",
      source_quantity: "density_and_yield_strength",
      target_quantity: "material_gravity_crossover_radius",
      admitted_to_dp_rate: false,
    },
    {
      relation_id: "pressure_support_to_jeans_crossover",
      relation_class: "classical_gravity_recovery",
      source_quantity: "temperature_and_density",
      target_quantity: "jeans_length_and_mass",
      admitted_to_dp_rate: false,
    },
    {
      relation_id: "branch_density_difference_to_dp_rate",
      relation_class: "frozen_hypothesis_transfer",
      source_quantity: "branch_mass_density_difference",
      target_quantity: "Gamma_DP_s",
      admitted_to_dp_rate: true,
    },
  ] as const;

  const prohibitedEdges = [
    "stark_frequency_to_dp_rate",
    "zeeman_frequency_to_dp_rate",
    "blackbody_frequency_to_dp_rate",
    "spinor_representation_to_mass",
    "spinor_representation_to_collapse",
    "schwarzschild_compactness_to_dp_rate",
    "potato_crossover_to_dp_rate",
    "jeans_crossover_to_dp_rate",
  ];

  const spectroscopicGate =
    maximumAlgebraicRelativeError <=
        config.thresholds.maximum_algebraic_relative_error &&
      minimumCovarianceDiagonal >=
        config.thresholds.minimum_covariance_diagonal &&
      covarianceAsymmetry <= config.thresholds.maximum_covariance_asymmetry
      ? "pass"
      : "blocked";
  const gravityGate =
    compactness.every((row) => row.gate === "pass") &&
      potatoGate === "pass" &&
      jeansGate === "pass"
      ? "pass"
      : "blocked";
  const nonbridgeGate =
    config.observable_bridge_edges_allowed === false &&
      config.hypothesis_policy.registered_dp_generator_mutated === false &&
      config.hypothesis_policy.transfer_kernel_registered === false &&
      congruenceMatrix.filter((row) => row.admitted_to_dp_rate).length === 1
      ? "pass"
      : "blocked";

  const output = {
    schema_version: "casimir_dp_cross_scale_metrology_stage4_2d_result/1",
    evidence_class: config.evidence_class,
    claim_ceiling: config.claim_ceiling,
    promotion_allowed: false,
    observable_bridge_edges_added: 0,
    spectroscopic_metrology: {
      gate: spectroscopicGate,
      evidence_class: "design_assumption",
      measured_response_available: false,
      zeeman: {
        shift_Hz: zeemanShiftHz,
        response_Hz_per_T: zeemanResponseHzPerT,
        circular_pair_separation_Hz: circularPairSeparationHz,
      },
      stark: {
        shift_Hz: starkShiftHz,
        response_Hz_per_V_m: starkResponseHzPerVm,
      },
      blackbody_dynamic_stark: {
        shift_Hz: blackbodyStarkShiftHz,
        response_Hz_per_K: blackbodyResponseHzPerK,
      },
      covariance_Hz2: covariance,
      covariance_asymmetry: covarianceAsymmetry,
      minimum_covariance_diagonal_Hz2: minimumCovarianceDiagonal,
      response_to_complex_coherence_transfer: "not_ready",
      pilot_use:
        "Estimate E, B, temperature, and helicity leakage before fitting apparatus-to-coherence response.",
    },
    gravitational_recovery: {
      gate: gravityGate,
      compactness,
      potato_crossover: {
        radius_m: potatoRadiusM,
        radius_km: potatoRadiusM / 1000,
        gate: potatoGate,
        interpretation:
          "Self-gravity versus material-yield crossover; not gravity activation or DP collapse.",
      },
      jeans_crossover: {
        sound_speed_m_s: soundSpeedMS,
        mass_density_kg_m3: massDensityKgM3,
        jeans_length_m: jeansLengthM,
        jeans_length_pc: jeansLengthM / constants.parsec_m,
        jeans_mass_kg: jeansMassKg,
        jeans_mass_solar: jeansMassKg / constants.solar_mass_kg,
        free_fall_time_s: freeFallTimeS,
        gate: jeansGate,
        interpretation:
          "Pressure-support versus self-gravity crossover; not a microscopic collapse threshold.",
      },
    },
    spinor_semantic_gate: {
      gate: "pass",
      mass_is_a_spinor: false,
      maxwell_spinor_is_collapse_generator: false,
      penrose_1960_quantizes_gravity: false,
      allowed_claim:
        "Spinors represent relativistic fields and curvature; the frozen DP rate remains mass-density based.",
    },
    equation_congruence: {
      gate: nonbridgeGate,
      matrix: congruenceMatrix,
      prohibited_edges: prohibitedEdges,
      observable_bridge_edges_added: 0,
      registered_dp_generator_unchanged:
        !config.hypothesis_policy.registered_dp_generator_mutated,
      optimization_rule:
        "Prefer sourced apparatus-calibration transfers, use astrophysical equations as recovery checks, and admit no cross-scale collapse transfer without a separately registered kernel.",
    },
    algebraic_replay: {
      ...algebraicReplay,
      maximum_relative_error: maximumAlgebraicRelativeError,
      gate:
        maximumAlgebraicRelativeError <=
            config.thresholds.maximum_algebraic_relative_error
          ? "pass"
          : "blocked",
    },
    final_gates: {
      software_and_recovery_diagnostics:
        spectroscopicGate === "pass" &&
          gravityGate === "pass" &&
          nonbridgeGate === "pass"
          ? "pass"
          : "blocked",
      spectroscopic_response_authority: "not_ready",
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
      schema_version: "casimir_dp_stage4_2d_result_receipt/1",
      sha256: sha256(output),
    },
  };
}
