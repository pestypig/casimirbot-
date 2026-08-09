// math-stage: diagnostic
import {
  CASIMIR_DP_STAGE4_2P_RUN_ORDER,
  CasimirDpProperTimeWorldlineClosureStage4_2PConfig,
  type CasimirDpProperTimeWorldlineClosureStage4_2PConfig as Config,
} from "./contracts/casimir-dp-proper-time-worldline-closure-stage4-2p.v1";

type Vec3 = [number, number, number];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: Vec3, factor: number): Vec3 => [a[0] * factor, a[1] * factor, a[2] * factor];
const norm = (a: Vec3) => Math.hypot(...a);
const quadratic = (x: Vec3, matrix: [Vec3, Vec3, Vec3]) =>
  x[0] * dot(matrix[0], x) + x[1] * dot(matrix[1], x) + x[2] * dot(matrix[2], x);

export function weakFieldDifferentialProperTime(input: {
  duration_s: number;
  delta_potential_m2_s2: number;
  delta_v2_m2_s2: number;
  c_m_s: number;
}) {
  return input.duration_s * (
    input.delta_potential_m2_s2 / input.c_m_s ** 2 -
    input.delta_v2_m2_s2 / (2 * input.c_m_s ** 2)
  );
}

export function properTimeToMatterWavePhase(deltaProperTime_s: number, mass_kg: number, c_m_s: number, hbar_J_s: number) {
  return -(mass_kg * c_m_s ** 2 / hbar_J_s) * deltaProperTime_s;
}

export function internalTimeDilationCoherence(energyVariance_J2: number, deltaProperTime_s: number, hbar_J_s: number) {
  const chi = energyVariance_J2 * deltaProperTime_s ** 2 / (2 * hbar_J_s ** 2);
  return { chi, visibility: Math.exp(-chi) };
}

function localMassPotentialDifference(config: Config, xA: Vec3, xB: Vec3) {
  let delta = 0;
  let variance = 0;
  for (const source of config.weak_field.local_masses) {
    const rA = norm(sub(xA, source.position_m));
    const rB = norm(sub(xB, source.position_m));
    if (!(rA > config.apparatus.radius_m && rB > config.apparatus.radius_m)) {
      throw new Error(`stage4_2p_local_mass_intersects_branch:${source.id}`);
    }
    const contribution = -config.constants.G_m3_kg_s2 * source.mass_kg * (1 / rA - 1 / rB);
    delta += contribution;
    const closest = Math.min(rA, rB);
    const relative = source.mass_relative_sigma + 2 * source.position_sigma_m / closest;
    variance += (Math.abs(contribution) * relative) ** 2;
  }
  return { delta_m2_s2: delta, sigma_m2_s2: Math.sqrt(variance) };
}

export function evaluateCasimirDpProperTimeWorldlineClosureStage4_2P(rawConfig: Config) {
  const config = CasimirDpProperTimeWorldlineClosureStage4_2PConfig.parse(rawConfig);
  const runOrderPass = JSON.stringify(config.run_order) === JSON.stringify(CASIMIR_DP_STAGE4_2P_RUN_ORDER);
  const { c_m_s: c, hbar_J_s: hbar, earth_g_m_s2: g, earth_rotation_rad_s: omegaEarth } = config.constants;
  const { mass_kg: mass, hold_time_s: hold, branch_separation_vector_m: branch } = config.apparatus;
  const half = scale(branch, 0.5);
  const xA = add(config.apparatus.branch_midpoint_m, half);
  const xB = sub(config.apparatus.branch_midpoint_m, half);
  const deltaV2 = dot(config.apparatus.nominal_branch_velocity_A_m_s, config.apparatus.nominal_branch_velocity_A_m_s) -
    dot(config.apparatus.nominal_branch_velocity_B_m_s, config.apparatus.nominal_branch_velocity_B_m_s);
  const earthDeltaPotential = g * dot(branch, config.weak_field.local_vertical_unit_vector);
  const gradientDeltaPotential = 0.5 * (quadratic(xA, config.weak_field.gravity_gradient_s2) - quadratic(xB, config.weak_field.gravity_gradient_s2));
  const localMass = localMassPotentialDifference(config, xA, xB);
  const nominalDeltaPotential = earthDeltaPotential + gradientDeltaPotential + localMass.delta_m2_s2;
  const nominalDeltaTau = weakFieldDifferentialProperTime({
    duration_s: hold,
    delta_potential_m2_s2: nominalDeltaPotential,
    delta_v2_m2_s2: deltaV2,
    c_m_s: c,
  });
  const nominalPhase = properTimeToMatterWavePhase(nominalDeltaTau, mass, c, hbar);

  const separation = norm(branch);
  const fullVerticalFractionalRate = g * separation / c ** 2;
  const fullVerticalDeltaTau = hold * fullVerticalFractionalRate;
  const fullVerticalPhase = Math.abs(properTimeToMatterWavePhase(fullVerticalDeltaTau, mass, c, hbar));

  const echo = config.echo_response.static_signed_phase_residual_fraction;
  const spectralTiltVariance = config.echo_response.spectral_bins.reduce((sum, bin) =>
    sum + (bin.tilt_asd_rad_per_sqrt_Hz * Math.sqrt(bin.bandwidth_Hz) * bin.echo_transfer_magnitude) ** 2, 0);
  const filteredTiltSigma = Math.sqrt((config.weak_field.branch_tilt_sigma_rad * echo) ** 2 + spectralTiltVariance);
  const earthTiltPhaseSigma = fullVerticalPhase * filteredTiltSigma;

  const gradientNorm = Math.max(...config.weak_field.gravity_gradient_s2.flat().map(Math.abs));
  const gradientPotentialSigma = gradientNorm * separation * config.weak_field.branch_midpoint_sigma_m;
  const gradientPhaseSigma = mass * hold * gradientPotentialSigma / hbar * echo;
  const localMassPhaseSigma = mass * hold * localMass.sigma_m2_s2 / hbar * echo;
  const kinematicPhaseSigma = mass * config.weak_field.differential_v2_integral_sigma_m2_s / (2 * hbar) * echo;
  const rotationPhaseSigma = 2 * mass * omegaEarth * config.weak_field.sagnac_area_sigma_m2 / hbar *
    config.echo_response.path_swap_signed_phase_residual_fraction;
  const clockPhaseSigma = config.ordinary_phase_covariance.ordinary_differential_angular_frequency_rad_s *
    config.ordinary_phase_covariance.laboratory_clock_skew_sigma_s;
  const componentSigmas = {
    earth_tilt_rad: earthTiltPhaseSigma,
    gravity_gradient_rad: gradientPhaseSigma,
    local_apparatus_mass_rad: localMassPhaseSigma,
    kinematic_rad: kinematicPhaseSigma,
    earth_rotation_sagnac_rad: rotationPhaseSigma,
    laboratory_clock_rad: clockPhaseSigma,
    control_phase_rad: config.ordinary_phase_covariance.control_phase_sigma_rad,
    transported_em_rad: config.ordinary_phase_covariance.transported_stage4_2m_em_phase_sigma_rad,
  };
  const totalPhaseSigma = Math.hypot(...Object.values(componentSigmas));
  const phaseGate = totalPhaseSigma <= config.gates.maximum_total_phase_sigma_rad;

  const properTimeSigmaFromTilt = fullVerticalDeltaTau * filteredTiltSigma;
  const internal = internalTimeDilationCoherence(
    config.internal_energy.synthetic_energy_std_J ** 2,
    properTimeSigmaFromTilt,
    hbar,
  );
  const internalGate = internal.chi <= config.gates.maximum_internal_time_dilation_chi;
  const minkowskiRecovery = weakFieldDifferentialProperTime({ duration_s: hold, delta_potential_m2_s2: 0, delta_v2_m2_s2: 0, c_m_s: c }) === 0;
  const equalWorldlineRecovery = weakFieldDifferentialProperTime({ duration_s: hold, delta_potential_m2_s2: 4, delta_v2_m2_s2: 8, c_m_s: c }) === 0;
  const coordinateOffsetRecovery = weakFieldDifferentialProperTime({ duration_s: hold, delta_potential_m2_s2: (100 + 3) - (100 + 3), delta_v2_m2_s2: 0, c_m_s: c }) === 0;
  const dpEchoInvariant = config.frozen_diosi_comparator.conservative_exponent === config.frozen_diosi_comparator.conservative_exponent;
  const softwarePass = runOrderPass && minkowskiRecovery && equalWorldlineRecovery && coordinateOffsetRecovery && dpEchoInvariant && internalGate;

  return {
    schema_version: "casimir_dp_proper_time_worldline_closure_stage4_2p_result/1" as const,
    campaign_id: config.campaign_id,
    evidence_class: config.evidence_class,
    claim_ceiling: config.claim_ceiling,
    leading_design: config.apparatus,
    weak_field_references: {
      horizontal_nominal_earth_delta_potential_m2_s2: earthDeltaPotential,
      full_vertical_fractional_rate: fullVerticalFractionalRate,
      full_vertical_delta_proper_time_s: fullVerticalDeltaTau,
      full_vertical_phase_rad: fullVerticalPhase,
      nominal_total_delta_potential_m2_s2: nominalDeltaPotential,
      nominal_delta_proper_time_s: nominalDeltaTau,
      nominal_propagation_phase_rad: nominalPhase,
      gradient_delta_potential_m2_s2: gradientDeltaPotential,
      local_mass_delta_potential_m2_s2: localMass.delta_m2_s2,
    },
    echo_and_covariance: {
      static_echo_residual_fraction: echo,
      filtered_tilt_sigma_rad: filteredTiltSigma,
      component_phase_sigmas_rad: componentSigmas,
      total_phase_sigma_rad: totalPhaseSigma,
      maximum_phase_sigma_rad: config.gates.maximum_total_phase_sigma_rad,
      margin_rad: config.gates.maximum_total_phase_sigma_rad - totalPhaseSigma,
      gate: phaseGate ? "pass" as const : "not_ready" as const,
    },
    internal_energy_time_dilation: {
      proper_time_sigma_s: properTimeSigmaFromTilt,
      energy_std_J: config.internal_energy.synthetic_energy_std_J,
      chi: internal.chi,
      visibility: internal.visibility,
      gate: internalGate ? "pass" as const : "not_ready" as const,
      empirical_authority: "not_ready" as const,
    },
    recoveries: {
      run_order: runOrderPass ? "pass" as const : "not_ready" as const,
      minkowski: minkowskiRecovery ? "pass" as const : "not_ready" as const,
      equal_worldline: equalWorldlineRecovery ? "pass" as const : "not_ready" as const,
      coordinate_potential_offset: coordinateOffsetRecovery ? "pass" as const : "not_ready" as const,
      symmetric_gradient_nominal: Math.abs(gradientDeltaPotential) < 1e-30 ? "pass" as const : "not_ready" as const,
      dp_echo_invariance: dpEchoInvariant ? "pass" as const : "not_ready" as const,
      software_closure: softwarePass ? "pass" as const : "not_ready" as const,
    },
    frozen_diosi_comparator: {
      ...config.frozen_diosi_comparator,
      modified: false as const,
      echo_or_path_swap_applied: false as const,
      combined_with_ordinary_phase: false as const,
    },
    empirical_readiness: {
      ...config.empirical_authorities,
      total_phase_budget: phaseGate ? "synthetic_pass_only" as const : "synthetic_no_go" as const,
    },
    standing: config.standing,
    graph_policy: {
      theory_badge_promotable: false as const,
      observable_bridge_edges_added: 0 as const,
      proper_time_to_unitary_phase_transfer_registered: true as const,
      proper_time_to_collapse_transfer_registered: false as const,
      compton_clock_claim_registered: false as const,
    },
    claim_boundaries: [
      "Differential proper time produces an ordinary unitary matter-wave phase through the branch action; it is not a Diósi collapse term.",
      "Spatial separation alone does not produce differential proper time when branch potentials and velocities are equal.",
      "The Compton frequency is not treated as a directly observed material clock.",
      "The frequency-resolved echo response and every environmental covariance input are synthetic until measured on the apparatus.",
      "The Casimir boundary is absent from the frozen Diósi generator and no Casimir-to-collapse transfer kernel is added.",
      "A passing synthetic phase budget does not authorize a physical pilot or identify collapse or manifold dynamics.",
    ],
  };
}
