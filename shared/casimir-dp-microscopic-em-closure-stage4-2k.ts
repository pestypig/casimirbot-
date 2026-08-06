// math-stage: diagnostic
import { createHash } from "node:crypto";
import {
  CasimirDpMicroscopicEmClosureFixtureStage4_2K,
  type CasimirDpMicroscopicEmClosureFixtureStage4_2K as Fixture,
  type CasimirDpMicroscopicEmClosureStage4_2KConfig as Config,
} from "./contracts/casimir-dp-microscopic-em-closure-stage4-2k.v1";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value == null || typeof value !== "object") return Object.is(value, -0) ? 0 : value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]));
}

export function sha256CasimirDpMicroscopicEmClosureStage4_2K(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value)), "utf8").digest("hex");
}

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.max(Math.abs(expected), Number.MIN_VALUE);
}

function epsilonImaginary(fixture: Fixture, xi: number): number {
  return 1 + fixture.silica_response.oscillators.reduce(
    (sum, oscillator) => sum + oscillator.strength /
      (1 + (xi / oscillator.omega0_rad_s) ** 2),
    0,
  );
}

function spherePolarizability(fixture: Fixture, xi: number): number {
  const epsilon = epsilonImaginary(fixture, xi);
  const { epsilon0_F_m } = fixture.constants;
  const radius = fixture.apparatus.sphere_radius_m;
  return 4 * Math.PI * epsilon0_F_m * radius ** 3 *
    (epsilon - 1) / (epsilon + 2);
}

function atomicPolarizability(fixture: Fixture, xi: number): number {
  const omega = 2 * Math.PI * fixture.ground_state_benchmark.transition_frequency_Hz;
  const dipole = fixture.ground_state_benchmark.dipole_matrix_element_C_m;
  return 2 * omega * dipole ** 2 /
    (3 * fixture.constants.hbar_J_s * (omega ** 2 + xi ** 2));
}

function idealRetardedCpEnergy(fixture: Fixture, centerDistanceM: number): number {
  const { hbar_J_s, c_m_s, epsilon0_F_m } = fixture.constants;
  const alpha0 = spherePolarizability(fixture, 0);
  return -3 * hbar_J_s * c_m_s * alpha0 /
    (32 * Math.PI ** 2 * epsilon0_F_m * centerDistanceM ** 4);
}

export function evaluateCasimirDpMicroscopicEmClosureStage4_2K(args: {
  config: Config;
  fixture: Fixture;
}) {
  const fixture = CasimirDpMicroscopicEmClosureFixtureStage4_2K.parse(args.fixture);
  const { config } = args;
  const staticPermittivity = epsilonImaginary(fixture, 0);
  const staticRecoveryError = relativeError(
    staticPermittivity,
    fixture.silica_response.expected_static_relative_permittivity,
  );
  const staticRecoveryGate = staticRecoveryError <=
    config.numerical.static_permittivity_relative_tolerance;
  const alphaSphere0 = spherePolarizability(fixture, 0);
  const alphaAtom0 = atomicPolarizability(fixture, 0);
  const centerDistance = fixture.apparatus.surface_gap_m +
    fixture.apparatus.sphere_radius_m;
  const halfSeparation = fixture.apparatus.branch_separation_m / 2;
  const normalA = centerDistance - halfSeparation;
  const normalB = centerDistance + halfSeparation;
  const energyA = idealRetardedCpEnergy(fixture, normalA);
  const energyB = idealRetardedCpEnergy(fixture, normalB);
  const normalDeltaEnergy = energyB - energyA;
  const normalPhase = normalDeltaEnergy * fixture.apparatus.hold_time_s /
    fixture.constants.hbar_J_s;
  const tangentialDeltaEnergy = 0;
  const tangentialPhase = 0;
  const dpExponent = fixture.apparatus.dp_rate_s * fixture.apparatus.hold_time_s;
  const dpEnergyRecoveryError = relativeError(
    fixture.apparatus.dp_energy_J / fixture.constants.hbar_J_s,
    fixture.apparatus.dp_rate_s,
  );
  const maximumPhaseJitter = Math.sqrt(
    2 * config.numerical.maximum_phase_jitter_fraction_of_dp_exponent * dpExponent,
  );
  const requiredNormalFractionalStability = maximumPhaseJitter /
    Math.abs(normalPhase);
  const requiredNormalUnwrapFraction = config.numerical.phase_unwrap_target_rad /
    Math.abs(normalPhase);
  const materialEmpiricalReady =
    fixture.silica_response.measured_spectrum_receipt_available &&
    fixture.silica_response.temperature_matched_receipt_available;
  const geometryEmpiricalReady =
    fixture.geometry.registered_branch_orientation !== "unregistered" &&
    fixture.geometry.finite_cad_mesh_receipt_available &&
    fixture.geometry.finite_geometry_green_receipt_available &&
    fixture.geometry.independent_solver_receipt_available;
  const ordinaryCovarianceReady =
    fixture.ordinary_loss.empirical_response_receipt_available &&
    fixture.ordinary_loss.empirical_covariance_receipt_available;
  const qlbeRows = Object.entries(fixture.qlbe_readiness).map(([input, ready]) => ({ input, ready }));
  const qlbeReady = qlbeRows.every((row) => row.ready);
  const rawFourCell = {
    log_amplitude: fixture.ordinary_loss.synthetic_active_separated_log_loss +
      fixture.interaction_fixture.injected_bridge_log_amplitude,
    phase_rad: normalPhase + fixture.interaction_fixture.injected_bridge_phase_rad,
  };
  const ordinaryPrediction = {
    log_amplitude: fixture.ordinary_loss.synthetic_active_separated_log_loss,
    phase_rad: normalPhase,
  };
  const correctedFourCell = {
    log_amplitude: rawFourCell.log_amplitude - ordinaryPrediction.log_amplitude,
    phase_rad: rawFourCell.phase_rad - ordinaryPrediction.phase_rad,
  };
  const residualAttributionReady = materialEmpiricalReady && geometryEmpiricalReady &&
    ordinaryCovarianceReady && qlbeReady;
  return {
    schema_version: "casimir_dp_microscopic_em_closure_stage4_2k_result/1",
    material_ground_state_chain: {
      epsilon_static: staticPermittivity,
      epsilon_static_relative_error: staticRecoveryError,
      analytic_recovery_gate: staticRecoveryGate ? "pass" as const : "blocked" as const,
      sphere_polarizability_static_SI: alphaSphere0,
      atomic_ground_state_polarizability_static_SI: alphaAtom0,
      measured_material_authority: materialEmpiricalReady ? "ready" as const : "not_ready" as const,
      semantic_chain: "ground_state_transition_sum_to_polarizability_to_green_scattering_response",
    },
    ideal_planar_orientation_screen: {
      model_scope: "retarded_dipole_ideal_conductor_screen_not_finite_geometry_forecast",
      center_distance_m: centerDistance,
      radius_to_center_distance_ratio: fixture.apparatus.sphere_radius_m / centerDistance,
      normal: {
        branch_a_center_distance_m: normalA,
        branch_b_center_distance_m: normalB,
        energy_a_J: energyA,
        energy_b_J: energyB,
        delta_energy_J: normalDeltaEnergy,
        phase_rad: normalPhase,
        delta_energy_to_dp_energy_ratio: Math.abs(normalDeltaEnergy) / fixture.apparatus.dp_energy_J,
      },
      tangential: { delta_energy_J: tangentialDeltaEnergy, phase_rad: tangentialPhase },
      registered_orientation: fixture.geometry.registered_branch_orientation,
      orientation_authority: fixture.geometry.registered_branch_orientation === "unregistered"
        ? "not_ready" as const : "ready" as const,
    },
    phase_to_coherence_budget: {
      dp_exponent: dpExponent,
      dp_rate_recovery_relative_error: dpEnergyRecoveryError,
      maximum_phase_jitter_rad_for_registered_fraction_of_dp_loss: maximumPhaseJitter,
      required_normal_fractional_stability: requiredNormalFractionalStability,
      required_normal_fractional_unwrap_accuracy: requiredNormalUnwrapFraction,
      relation: "gaussian_phase_jitter_produces_log_visibility_loss_sigma_phi_squared_over_two",
    },
    finite_geometry_readiness: {
      measured_material_ready: materialEmpiricalReady,
      registered_orientation_ready: fixture.geometry.registered_branch_orientation !== "unregistered",
      cad_mesh_ready: fixture.geometry.finite_cad_mesh_receipt_available,
      green_tensor_ready: fixture.geometry.finite_geometry_green_receipt_available,
      independent_solver_ready: fixture.geometry.independent_solver_receipt_available,
      gate: geometryEmpiricalReady ? "pass" as const : "blocked" as const,
    },
    four_cell_residual_attribution: {
      raw_interaction: rawFourCell,
      ordinary_prediction: ordinaryPrediction,
      corrected_interaction: correctedFourCell,
      standard_boundary_independent_dp_contribution: 0,
      synthetic_recovery_gate:
        Math.abs(correctedFourCell.log_amplitude - fixture.interaction_fixture.injected_bridge_log_amplitude) < 1e-15 &&
        Math.abs(correctedFourCell.phase_rad - fixture.interaction_fixture.injected_bridge_phase_rad) < 1e-9
          ? "pass" as const : "blocked" as const,
      empirical_authority: residualAttributionReady ? "ready" as const : "not_ready" as const,
    },
    qlbe_readiness: { rows: qlbeRows, gate: qlbeReady ? "pass" as const : "blocked" as const },
    hypothesis_separation: {
      ordinary_em_lane: "polarizability_green_tensor_phase_and_fdt_loss",
      standard_dp_lane: "frozen_boundary_independent_mass_density_contraction",
      speculative_bridge_lane: "not_registered",
      observable_bridge_edges_added: 0,
    },
    outcome: {
      diagnostic_gate: staticRecoveryGate && dpEnergyRecoveryError <= config.numerical.dp_rate_recovery_relative_tolerance
        ? "pass" as const : "blocked" as const,
      finite_geometry_em_closure: geometryEmpiricalReady ? "ready" as const : "blocked" as const,
      qlbe_environment_model: qlbeReady ? "ready" as const : "not_ready" as const,
      residual_attribution: residualAttributionReady ? "ready" as const : "blocked" as const,
      confirmatory_campaign_authorized: false,
    },
  };
}
