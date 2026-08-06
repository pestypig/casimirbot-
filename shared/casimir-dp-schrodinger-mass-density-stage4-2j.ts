// math-stage: diagnostic
import { createHash } from "node:crypto";
import {
  evaluateCasimirDpDpRegisteredPoint,
  sha256CasimirDpDpParameterManifest,
  type CasimirDpDpParameterManifest,
} from "./casimir-dp-dp-companion";
import {
  CasimirDpSchrodingerMassDensityFixtureStage4_2J,
  type CasimirDpSchrodingerMassDensityFixtureStage4_2J as Stage4JFixture,
  type CasimirDpSchrodingerMassDensityStage4_2JConfig,
} from "./contracts/casimir-dp-schrodinger-mass-density-stage4-2j.v1";

type Complex = { re: number; im: number };

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value == null || typeof value !== "object") {
    return Object.is(value, -0) ? 0 : value;
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

export function sha256CasimirDpSchrodingerMassDensityStage4_2J(
  value: unknown,
): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)), "utf8")
    .digest("hex");
}

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) /
    Math.max(Math.abs(expected), Number.MIN_VALUE);
}

function multiply(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

function phaseFactor(phaseRad: number): Complex {
  return { re: Math.cos(phaseRad), im: -Math.sin(phaseRad) };
}

function lossFactor(lossExponent: number): Complex {
  return { re: Math.exp(-lossExponent), im: 0 };
}

function magnitude(value: Complex): number {
  return Math.hypot(value.re, value.im);
}

function phase(value: Complex): number {
  return Math.atan2(value.im, value.re);
}

function wrapPhase(value: number): number {
  return Math.atan2(Math.sin(value), Math.cos(value));
}

function sinc(value: number): number {
  if (Math.abs(value) < 1e-5) {
    const square = value * value;
    return 1 - square / 6 + square * square / 120;
  }
  return Math.sin(value) / value;
}

function homogeneousSphereFormFactor(value: number): number {
  if (Math.abs(value) < 1e-4) {
    const square = value * value;
    return 1 - square / 10 + square * square / 280;
  }
  return 3 * (Math.sin(value) - value * Math.cos(value)) /
    (value * value * value);
}

function simpsonIntegral(
  integrand: (value: number) => number,
  upper: number,
  intervals: number,
): number {
  const step = upper / intervals;
  let sum = 0;
  for (let index = 0; index <= intervals; index += 1) {
    const value = index * step;
    const weight = index === 0 || index === intervals
      ? 1
      : index % 2 === 0
      ? 2
      : 4;
    sum += weight * integrand(value);
  }
  return sum * step / 3;
}

function homogeneousSphereGaussianConvolvedEnergy(args: {
  massKg: number;
  sphereRadiusM: number;
  separationM: number;
  regularizationM: number;
  G: number;
  upperU: number;
  intervals: number;
}): number {
  const radiusRatio = args.sphereRadiusM / args.regularizationM;
  const separationRatio = args.separationM / args.regularizationM;
  const integral = simpsonIntegral((u) => {
    const form = homogeneousSphereFormFactor(radiusRatio * u);
    return Math.exp(-u * u) * form * form *
      (1 - sinc(separationRatio * u));
  }, args.upperU, args.intervals);
  return 2 * args.G * args.massKg * args.massKg * integral /
    (Math.PI * args.regularizationM);
}

function buildRegisteredManifest(
  fixture: Stage4JFixture,
  config: CasimirDpSchrodingerMassDensityStage4_2JConfig,
): CasimirDpDpParameterManifest {
  const apparatus = fixture.apparatus_identity;
  return {
    schema_version: "casimir_dp_dp_parameter_manifest/1",
    model_id: fixture.registered_dp_reference.model_id,
    model_version: "1",
    physical_regularization: {
      kind: "gaussian_mass_density_smearing",
      R0_m: apparatus.dp_regularization_length_m,
    },
    numerical_regularization: {
      kind: "fourier_simpson_quadrature",
      softening_m: 0,
      used_as_physical_cutoff: false,
      integration_upper_u: config.numerical.integration_upper_u,
      even_intervals: config.numerical.convergence_intervals[2],
      crosscheck_relative_tolerance:
        config.numerical.maximum_relative_convergence_error,
    },
    composition: {
      kind: "single_effective_particle",
      density_profile: "gaussian_smeared_point",
    },
    dynamics: {
      dissipation: "none",
      dissipative_temperature_K: null,
      friction_s: null,
    },
    scan: {
      masses_kg: [apparatus.mass_kg],
      branch_separations_m: [apparatus.branch_separation_m],
      hold_times_s: [apparatus.hold_time_s],
    },
  };
}

export function evaluateCasimirDpSchrodingerMassDensityStage4_2J(args: {
  config: CasimirDpSchrodingerMassDensityStage4_2JConfig;
  fixture: Stage4JFixture;
}) {
  const fixture = CasimirDpSchrodingerMassDensityFixtureStage4_2J.parse(
    args.fixture,
  );
  const { config } = args;
  const apparatus = fixture.apparatus_identity;
  const constants = fixture.constants;
  const manifest = buildRegisteredManifest(fixture, config);
  const manifestSha256 = sha256CasimirDpDpParameterManifest(manifest);
  const registered = evaluateCasimirDpDpRegisteredPoint({
    mass_kg: apparatus.mass_kg,
    branch_separation_m: apparatus.branch_separation_m,
    parameter_manifest: manifest,
    parameter_manifest_sha256: manifestSha256,
  });
  const registeredVisibility = Math.exp(
    -registered.Gamma_DP_s * apparatus.hold_time_s,
  );
  // Recover the evaluator's own constant convention for the inverse check.
  // The fixture carries a display-rounded hbar, which is adequate for the
  // environmental screens but would otherwise manufacture a ~6e-10 mismatch.
  const registeredEffectiveHbar =
    registered.E_G_analytic_J / registered.Gamma_DP_s;
  const registeredErrors = {
    E_G_relative: relativeError(
      registered.E_G_analytic_J,
      fixture.registered_dp_reference.E_G_J,
    ),
    Gamma_relative: relativeError(
      registered.Gamma_DP_s,
      fixture.registered_dp_reference.Gamma_DP_s,
    ),
    visibility_relative: relativeError(
      registeredVisibility,
      fixture.registered_dp_reference.visibility_ratio,
    ),
  };
  const registeredRecoveryGate = Math.max(...Object.values(registeredErrors)) <=
    config.numerical.registered_point_relative_tolerance;

  const hamiltonianPhase =
    fixture.schrodinger_baseline.branch_energy_difference_J *
    apparatus.hold_time_s / constants.hbar_J_s;
  const unitaryCoherence = multiply(
    fixture.schrodinger_baseline.initial_coherence,
    phaseFactor(hamiltonianPhase),
  );
  const dpExponent = registered.Gamma_DP_s * apparatus.hold_time_s;
  const dpCoherence = multiply(unitaryCoherence, lossFactor(dpExponent));
  const dpPhaseDelta = wrapPhase(phase(dpCoherence) - phase(unitaryCoherence));
  const schrodingerDpSeparationGate =
    Math.abs(magnitude(unitaryCoherence) -
      magnitude(fixture.schrodinger_baseline.initial_coherence)) <= 1e-15 &&
    Math.abs(dpPhaseDelta) <= config.numerical.phase_absolute_tolerance_rad;

  const convergenceRows = config.numerical.convergence_intervals.map(
    (intervals) => {
      const E_G_J = homogeneousSphereGaussianConvolvedEnergy({
        massKg: apparatus.mass_kg,
        sphereRadiusM: apparatus.sphere_radius_m,
        separationM: apparatus.branch_separation_m,
        regularizationM: apparatus.dp_regularization_length_m,
        G: constants.G_m3_kg_s2,
        upperU: config.numerical.integration_upper_u,
        intervals,
      });
      const Gamma_DP_s = E_G_J / constants.hbar_J_s;
      return {
        intervals,
        E_G_J,
        Gamma_DP_s,
        visibility_ratio: Math.exp(-Gamma_DP_s * apparatus.hold_time_s),
        loss_fraction: 1 - Math.exp(-Gamma_DP_s * apparatus.hold_time_s),
      };
    },
  );
  const priorSphere = convergenceRows[convergenceRows.length - 2];
  const sphere = convergenceRows[convergenceRows.length - 1];
  const sphereConvergenceError = relativeError(
    sphere.E_G_J,
    priorSphere.E_G_J,
  );
  const sphereConvergenceGate = sphereConvergenceError <=
    config.numerical.maximum_relative_convergence_error;

  const representationResults = fixture.mass_representations.map((row) => {
    if (row.representation_id === "single_effective_gaussian") {
      return {
        ...row,
        E_G_J: registered.E_G_analytic_J,
        Gamma_DP_s: registered.Gamma_DP_s,
        visibility_ratio: registeredVisibility,
        loss_fraction: 1 - registeredVisibility,
        gate: registeredRecoveryGate ? "pass" as const : "blocked" as const,
      };
    }
    if (row.representation_id === "homogeneous_sphere_gaussian_convolved") {
      return {
        ...row,
        E_G_J: sphere.E_G_J,
        Gamma_DP_s: sphere.Gamma_DP_s,
        visibility_ratio: sphere.visibility_ratio,
        loss_fraction: sphere.loss_fraction,
        gate: sphereConvergenceGate ? "pass" as const : "blocked" as const,
      };
    }
    return {
      ...row,
      E_G_J: null,
      Gamma_DP_s: null,
      visibility_ratio: null,
      loss_fraction: null,
      gate: "not_ready" as const,
    };
  });
  const readyRepresentations = representationResults.filter(
    (row) => row.gate === "pass" && row.E_G_J != null,
  );
  const completeRepresentationGate = representationResults.every(
    (row) => row.gate === "pass",
  );
  const readyEnergies = readyRepresentations.map((row) => row.E_G_J!);
  const representationEnvelope = {
    ready_count: readyRepresentations.length,
    required_count: config.required_complete_representations.length,
    minimum_E_G_J: Math.min(...readyEnergies),
    maximum_E_G_J: Math.max(...readyEnergies),
    maximum_to_minimum_ratio:
      Math.max(...readyEnergies) / Math.min(...readyEnergies),
    homogeneous_to_effective_gaussian_ratio:
      sphere.E_G_J / registered.E_G_analytic_J,
    complete_gate: completeRepresentationGate
      ? "pass" as const
      : "blocked" as const,
  };

  const inferredGamma = -Math.log(
    magnitude(dpCoherence) / magnitude(unitaryCoherence),
  ) / apparatus.hold_time_s;
  const inferredEnergy = registeredEffectiveHbar * inferredGamma;
  const inverseEnergyError = relativeError(
    inferredEnergy,
    registered.E_G_analytic_J,
  );
  const inverseGate = inverseEnergyError <=
    config.numerical.inverse_energy_relative_tolerance;

  const rydbergEnergyJ = fixture.hydrogen_calibration.rydberg_energy_eV *
    constants.elementary_charge_C;
  const stateMassDa = apparatus.mass_kg / constants.dalton_kg;
  const statePreparationRatio = stateMassDa /
    fixture.state_preparation_benchmark.demonstrated_mass_Da;

  const gasScreens = fixture.residual_gases.map((gas) => {
    const numberDensity = apparatus.environment_pressure_Pa /
      (constants.k_B_J_K * apparatus.environment_temperature_K);
    const meanSpeed = Math.sqrt(
      8 * constants.k_B_J_K * apparatus.environment_temperature_K /
        (Math.PI * gas.molecular_mass_kg),
    );
    const geometricCrossSection = Math.PI * apparatus.sphere_radius_m ** 2;
    const collisionRate = numberDensity * meanSpeed * geometricCrossSection;
    const thermalWavelength = constants.h_J_s / Math.sqrt(
      2 * Math.PI * gas.molecular_mass_kg * constants.k_B_J_K *
        apparatus.environment_temperature_K,
    );
    const separationToWavelength = apparatus.branch_separation_m /
      thermalWavelength;
    const fullLocalizationScreen = separationToWavelength >=
      config.environmental_screen
        .minimum_separation_to_thermal_wavelength_for_full_localization;
    const gasToDpRateRatio = collisionRate / registered.Gamma_DP_s;
    return {
      species_id: gas.species_id,
      number_density_m3: numberDensity,
      mean_speed_m_s: meanSpeed,
      geometric_cross_section_m2: geometricCrossSection,
      collision_rate_s: collisionRate,
      collision_loss_fraction_over_hold:
        1 - Math.exp(-collisionRate * apparatus.hold_time_s),
      thermal_de_broglie_wavelength_m: thermalWavelength,
      separation_to_thermal_wavelength: separationToWavelength,
      full_localization_screen: fullLocalizationScreen,
      gas_to_dp_rate_ratio: gasToDpRateRatio,
      pressure_for_gas_rate_equal_dp_Pa:
        apparatus.environment_pressure_Pa / gasToDpRateRatio,
      pressure_for_target_fraction_of_dp_Pa:
        apparatus.environment_pressure_Pa *
        config.environmental_screen.target_gas_fraction_of_dp /
        gasToDpRateRatio,
      screen_gate:
        gasToDpRateRatio <=
            config.environmental_screen.maximum_gas_to_dp_rate_ratio_for_candidate
          ? "pass" as const
          : "no_go" as const,
    };
  });
  const gasScreenGate = gasScreens.every((row) => row.screen_gate === "pass");

  const diagnosticGate = registeredRecoveryGate &&
    schrodingerDpSeparationGate && sphereConvergenceGate && inverseGate &&
    !fixture.registered_dp_reference.boundary_variable_in_generator &&
    !fixture.registered_dp_reference.transfer_kernel_registered;

  return {
    schema_version:
      "casimir_dp_schrodinger_mass_density_stage4_2j_result/1",
    fixture_id: fixture.fixture_id,
    evidence_class: fixture.evidence_class,
    claim_ceiling: config.claim_ceiling,
    promotion_allowed: false,
    hypothesis_lanes: {
      schrodinger_hamiltonian:
        "unitary_complex_phase_and_norm_preservation",
      ordinary_environment:
        "measured_or_source_bound_open_system_contraction_and_phase",
      frozen_dp:
        "boundary_independent_nonunitary_mass_density_contraction",
      speculative_boundary_bridge:
        "absent_without_separately_registered_transfer_kernel",
    },
    registered_gaussian_recovery: {
      gate: registeredRecoveryGate ? "pass" as const : "blocked" as const,
      parameter_manifest_sha256: manifestSha256,
      E_G_J: registered.E_G_analytic_J,
      Gamma_DP_s: registered.Gamma_DP_s,
      dp_exponent: dpExponent,
      visibility_ratio: registeredVisibility,
      loss_fraction: 1 - registeredVisibility,
      errors: registeredErrors,
    },
    schrodinger_open_system_separation: {
      gate: schrodingerDpSeparationGate ? "pass" as const : "blocked" as const,
      branch_energy_difference_J:
        fixture.schrodinger_baseline.branch_energy_difference_J,
      hamiltonian_phase_rad: hamiltonianPhase,
      unitary_coherence: unitaryCoherence,
      dp_coherence: dpCoherence,
      unitary_magnitude: magnitude(unitaryCoherence),
      dp_magnitude: magnitude(dpCoherence),
      dp_phase_change_rad: dpPhaseDelta,
      distinction:
        "Delta_E_H_and_sigma_H_are_not_the_DP_gravitational_difference_self_energy",
    },
    mass_density_robustness: {
      homogeneous_convergence: convergenceRows,
      homogeneous_relative_convergence_error: sphereConvergenceError,
      homogeneous_convergence_gate:
        sphereConvergenceGate ? "pass" as const : "blocked" as const,
      representations: representationResults,
      envelope: representationEnvelope,
    },
    residual_inverse_mapping: {
      gate: inverseGate ? "pass" as const : "blocked" as const,
      inferred_Gamma_s: inferredGamma,
      inferred_DP_equivalent_E_J: inferredEnergy,
      relative_error: inverseEnergyError,
      registered_effective_hbar_J_s: registeredEffectiveHbar,
      fixture_hbar_J_s: constants.hbar_J_s,
      fixture_hbar_relative_rounding:
        relativeError(constants.hbar_J_s, registeredEffectiveHbar),
      interpretation:
        "conditional_model_inference_not_directly_collected_gravitational_energy",
      five_sigma_scalar_screen: {
        maximum_exponent_standard_uncertainty: dpExponent / 5,
        maximum_energy_standard_uncertainty_J:
          registered.E_G_analytic_J / 5,
        scope: "scalar_screen_only_whitened_complex_analysis_remains_authoritative",
      },
    },
    hydrogen_qed_nonbridge: {
      rydberg_energy_J: rydbergEnergyJ,
      rydberg_energy_eV: fixture.hydrogen_calibration.rydberg_energy_eV,
      leading_hydrogen_1s_2s_frequency_Hz:
        fixture.hydrogen_calibration.leading_hydrogen_1s_2s_frequency_Hz,
      dp_to_rydberg_energy_ratio:
        registered.E_G_analytic_J / rydbergEnergyJ,
      dp_cycle_frequency_Hz:
        registered.E_G_analytic_J / constants.h_J_s,
      dp_angular_decay_rate_s:
        registered.E_G_analytic_J / constants.hbar_J_s,
      role: fixture.hydrogen_calibration.role,
      transfer_kernel_registered: false,
      rule:
        "shared_energy_frequency_dimensions_do_not_create_a_collapse_or_cavity_mechanism",
    },
    residual_gas_screen: {
      assumption:
        "ideal_equilibrium_gas_geometric_cross_section_and_full_which_path_screen",
      rows: gasScreens,
      candidate_gate: gasScreenGate ? "pass" as const : "no_go" as const,
      measured_authority: "not_ready" as const,
      consequence:
        gasScreenGate
          ? "proceed_to_measured_scattering_and_covariance_model"
          : "redesign_pressure_species_sequence_or_collision_veto_before_power_claim",
    },
    state_preparation_scale_screen: {
      apparatus_mass_Da: stateMassDa,
      demonstrated_mass_Da:
        fixture.state_preparation_benchmark.demonstrated_mass_Da,
      apparatus_to_demonstrated_mass_ratio: statePreparationRatio,
      role: fixture.state_preparation_benchmark.comparison_role,
      empirical_preparation_receipt: "not_ready" as const,
    },
    external_bound_mapping: {
      status: "not_ready" as const,
      reason:
        "exact_current_bound_normalization_and_composite_representation_mapping_not_registered",
    },
    hypothesis_separation: {
      standard_dp_boundary_independent: true,
      transfer_kernel_registered: false,
      observable_bridge_edges_added: 0,
      four_cell_interaction_role:
        "separate_boundary_branch_nonfactorization_diagnostic",
    },
    outcome: {
      diagnostic_gate: diagnosticGate ? "pass" as const : "blocked" as const,
      complete_representation_robustness:
        completeRepresentationGate ? "pass" as const : "blocked" as const,
      declared_equilibrium_gas_screen:
        gasScreenGate ? "pass" as const : "no_go" as const,
      physical_candidate_selected: false,
      recommended_next_action:
        "measure_or_redesign_environment_then_complete_density_and_external_bound_envelopes",
    },
    bounded_status: config.final_status_policy,
  };
}
