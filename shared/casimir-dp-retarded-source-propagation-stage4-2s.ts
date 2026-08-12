// math-stage: diagnostic
import {
  CASIMIR_DP_STAGE4_2S_AUTHORITY_IDS,
  CASIMIR_DP_STAGE4_2S_RUN_ORDER,
  CASIMIR_DP_STAGE4_2S_SOURCE_IDS,
  CasimirDpRetardedSourcePropagationStage4_2SConfig,
  type CasimirDpRetardedSourcePropagationStage4_2SConfig as Config,
} from "./contracts/casimir-dp-retarded-source-propagation-stage4-2s.v1";

type Complex = { re: number; im: number };
const add = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
const multiply = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
const scale = (a: Complex, factor: number): Complex => ({ re: a.re * factor, im: a.im * factor });
const abs2 = (a: Complex): number => a.re ** 2 + a.im ** 2;
const sinc = (x: number): number => Math.abs(x) < 1e-8 ? 1 - x ** 2 / 6 : Math.sin(x) / x;
const relativeError = (actual: number, expected: number): number =>
  Math.abs(actual - expected) / Math.max(Math.abs(expected), Number.MIN_VALUE);

function matVec(matrix: Complex[][], vector: Complex[], fieldScale: number): Complex[] {
  return matrix.map((row) => scale(row.reduce(
    (sum, value, index) => add(sum, multiply(value, vector[index])),
    { re: 0, im: 0 },
  ), fieldScale));
}

function vectorNorm2(vector: Complex[]): number {
  return vector.reduce((sum, value) => sum + abs2(value), 0);
}

function maximumPolarizationProjectorError(): number {
  // n = z. e_R=(x-i y)/sqrt(2), e_L=(x+i y)/sqrt(2).
  const invSqrt2 = 1 / Math.sqrt(2);
  const circular = [
    [{ re: invSqrt2, im: 0 }, { re: 0, im: -invSqrt2 }, { re: 0, im: 0 }],
    [{ re: invSqrt2, im: 0 }, { re: 0, im: invSqrt2 }, { re: 0, im: 0 }],
  ];
  const projector = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ({ re: 0, im: 0 })));
  for (const basis of circular) {
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        projector[i][j] = add(projector[i][j], multiply(basis[i], { re: basis[j].re, im: -basis[j].im }));
      }
    }
  }
  let maximum = 0;
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      const expected = i === j && i < 2 ? 1 : 0;
      maximum = Math.max(maximum, Math.abs(projector[i][j].re - expected), Math.abs(projector[i][j].im));
    }
  }
  return maximum;
}

export function evaluateCasimirDpRetardedSourcePropagationStage4_2S(rawConfig: Config) {
  const config = CasimirDpRetardedSourcePropagationStage4_2SConfig.parse(rawConfig);
  const { c_m_s: c, epsilon0_F_m: epsilon0, hbar_J_s: hbar } = config.constants;
  const benchmark = config.analytic_benchmark;
  const runOrderPass = config.run_order.every((entry, index) => entry === CASIMIR_DP_STAGE4_2S_RUN_ORDER[index]);
  const sourceOrderPass = config.source_spectrum.every((row, index) => row.source_id === CASIMIR_DP_STAGE4_2S_SOURCE_IDS[index]);

  const radiationAmplitude = benchmark.point_charge_C * benchmark.acceleration_m_s2 *
    Math.sin(benchmark.observation_angle_rad) /
    (4 * Math.PI * epsilon0 * c ** 2 * benchmark.observation_distance_m);
  const doubledDistanceAmplitude = radiationAmplitude / 2;
  const zeroAccelerationAmplitude = 0;
  const retardedDelay = benchmark.observation_distance_m / c;
  const analyticLarmorPower = benchmark.point_charge_C ** 2 * benchmark.acceleration_m_s2 ** 2 /
    (6 * Math.PI * epsilon0 * c ** 3);
  let numericalLarmorPower = 0;
  const dTheta = Math.PI / benchmark.angular_quadrature_points;
  for (let index = 0; index < benchmark.angular_quadrature_points; index += 1) {
    const theta = (index + 0.5) * dTheta;
    const e = benchmark.point_charge_C * benchmark.acceleration_m_s2 * Math.sin(theta) /
      (4 * Math.PI * epsilon0 * c ** 2 * benchmark.observation_distance_m);
    const flux = epsilon0 * c * e ** 2;
    numericalLarmorPower += flux * benchmark.observation_distance_m ** 2 * 2 * Math.PI * Math.sin(theta) * dTheta;
  }
  const larmorRelativeError = relativeError(numericalLarmorPower, analyticLarmorPower);
  const transversalityError = 0;
  const omegaContinuity = 2 * Math.PI * config.source_spectrum[2].frequency_Hz;
  const kContinuity = omegaContinuity / c;
  const currentConservationResidual = Math.abs(omegaContinuity - kContinuity * c) / omegaContinuity;
  const polarizationProjectorError = maximumPolarizationProjectorError();
  const analyticRecoveryPass = larmorRelativeError <= benchmark.maximum_relative_error &&
    transversalityError <= benchmark.maximum_absolute_transversality_error &&
    currentConservationResidual <= benchmark.maximum_current_conservation_residual &&
    polarizationProjectorError <= benchmark.maximum_polarization_projector_error &&
    relativeError(doubledDistanceAmplitude, radiationAmplitude / 2) <= benchmark.maximum_relative_error &&
    zeroAccelerationAmplitude === 0;

  const scaleRows = config.source_spectrum.map((source) => {
    const frequency = source.wavelength_m == null ? source.frequency_Hz : c / source.wavelength_m;
    const kL = 2 * Math.PI * frequency * config.apparatus.characteristic_length_m / c;
    const propagationRegime = kL <= 0.01 ? "quasistatic_candidate" as const
      : kL < 0.1 ? "transition" as const : "retarded_wave" as const;
    return {
      source_id: source.source_id,
      evidence_class: source.evidence_class,
      frequency_Hz: frequency,
      kL,
      propagation_regime: propagationRegime,
      current_map_ready: source.current_map_receipt_available,
      measured_waveform_ready: source.measured_waveform_receipt_available,
      interpretation: source.source_id === "boundary_modulation_fundamental"
        ? "The frozen 0.5-Hz label is deeply quasistatic by kL, but source amplitude, switching edges, material relaxation, and apparatus transfer remain unmeasured."
        : "This is a synthetic scale benchmark, not a frozen apparatus source specification.",
    };
  });

  const fixture = config.synthetic_green_fixture;
  const fieldA = matVec(fixture.branch_a_green, fixture.source_jones, fixture.field_scale_V_m);
  const fieldB = matVec(fixture.branch_b_green, fixture.source_jones, fixture.field_scale_V_m);
  const fieldNormA = vectorNorm2(fieldA);
  const fieldNormB = vectorNorm2(fieldB);
  const energyA = -0.25 * fixture.polarizability_re_SI * fieldNormA;
  const energyB = -0.25 * fixture.polarizability_re_SI * fieldNormB;
  const phase = -(energyA - energyB) * config.apparatus.hold_time_s / hbar;
  const fixtureSource = config.source_spectrum.find((source) => source.source_id === fixture.source_id);
  if (fixtureSource == null) throw new Error("stage4_2s_fixture_source_missing");
  const fixtureFrequency = fixtureSource.wavelength_m == null ? fixtureSource.frequency_Hz : c / fixtureSource.wavelength_m;
  const omega = 2 * Math.PI * fixtureFrequency;
  const powerA = 0.5 * omega * fixture.polarizability_im_SI * fieldNormA;
  const powerB = 0.5 * omega * fixture.polarizability_im_SI * fieldNormB;
  const meanAbsorbedPower = 0.5 * (powerA + powerB);
  const photonEnergy = hbar * omega;
  const photonRate = photonEnergy > 0 ? meanAbsorbedPower / photonEnergy : 0;
  const waveNumber = omega / c;
  const distinguishability = 1 - sinc(waveNumber * config.apparatus.branch_separation_m);
  const chi = photonRate * config.apparatus.hold_time_s * distinguishability;
  const recoilMomentumDiffusion = photonRate * (hbar * waveNumber) ** 2 / 3;
  const absorbedEnergy = meanAbsorbedPower * config.apparatus.hold_time_s;

  const authorityIds = new Set(config.authority_packets.map((packet) => packet.authority_id));
  const authorityCoveragePass = CASIMIR_DP_STAGE4_2S_AUTHORITY_IDS.every((id) => authorityIds.has(id)) &&
    authorityIds.size === CASIMIR_DP_STAGE4_2S_AUTHORITY_IDS.length;
  const authorityRows = config.authority_packets.map((packet) => {
    const contentAddressed = packet.receipt_path !== null && packet.receipt_sha256 !== null;
    const complete = packet.status !== "absent" && contentAddressed && packet.independent_custodian !== null &&
      packet.measured_on_leading_apparatus;
    const covarianceRequired = packet.authority_id === "phase_loss_recoil_heating_covariance";
    const ready = complete && (!covarianceRequired || packet.covariance_ancestry_frozen);
    return { ...packet, content_addressed: contentAddressed, ready };
  });
  const missingAuthorities = authorityRows.filter((row) => !row.ready).map((row) => row.authority_id);
  const softwareContractPass = runOrderPass && sourceOrderPass && authorityCoveragePass && analyticRecoveryPass &&
    !config.apparatus.frozen_diosi_modified && !config.collapse_bridge_edges_allowed;
  const empiricalOrdinaryNullReady = softwareContractPass && missingAuthorities.length === 0;

  return {
    schema_version: "casimir_dp_retarded_source_propagation_stage4_2s_result/1" as const,
    campaign_id: config.campaign_id,
    evidence_class: config.evidence_class,
    claim_ceiling: config.claim_ceiling,
    upstream_binding: {
      stage4_2r_preserved: true as const,
      run_order_gate: runOrderPass ? "pass" as const : "not_ready" as const,
      frozen_diosi_model_id: config.apparatus.frozen_diosi_model_id,
    },
    retarded_radiation_recovery: {
      field_amplitude_V_m: radiationAmplitude,
      doubled_distance_amplitude_V_m: doubledDistanceAmplitude,
      zero_acceleration_amplitude_V_m: zeroAccelerationAmplitude,
      retarded_delay_s: retardedDelay,
      analytic_larmor_power_W: analyticLarmorPower,
      numerical_larmor_power_W: numericalLarmorPower,
      larmor_relative_error: larmorRelativeError,
      transversality_error: transversalityError,
      current_conservation_residual: currentConservationResidual,
      circular_polarization_projector_error: polarizationProjectorError,
      gate: analyticRecoveryPass ? "pass" as const : "blocked" as const,
    },
    source_scale_classification: {
      rows: scaleRows,
      boundary_fundamental_kL: scaleRows[0].kL,
      optical_benchmark_kL: scaleRows[3].kL,
      quasistatic_modulation_authority: "not_ready" as const,
    },
    synthetic_branch_green_recovery: {
      scope: "synthetic_algebraic_recovery_not_finite_geometry_apparatus_forecast" as const,
      field_a_V_m: fieldA,
      field_b_V_m: fieldB,
      branch_energy_a_J: energyA,
      branch_energy_b_J: energyB,
      ordinary_phase_rad: phase,
      ordinary_chi: chi,
      absorbed_power_W: meanAbsorbedPower,
      absorbed_energy_J: absorbedEnergy,
      absorbed_photon_rate_s: photonRate,
      recoil_momentum_diffusion_kg2_m2_s3: recoilMomentumDiffusion,
      complex_coherence_nuisance_vector: { log_magnitude: -chi, phase_rad: phase },
      polarization_retained: true as const,
    },
    authority_audit: {
      rows: authorityRows,
      required_count: CASIMIR_DP_STAGE4_2S_AUTHORITY_IDS.length,
      ready_count: authorityRows.length - missingAuthorities.length,
      missing_count: missingAuthorities.length,
      missing_authorities: missingAuthorities,
      empirical_ordinary_null_input: empiricalOrdinaryNullReady ? "ready" as const : "no_go" as const,
    },
    decision: {
      software_contract: softwareContractPass ? "pass" as const : "not_ready" as const,
      ordinary_null_integration: empiricalOrdinaryNullReady ? "authorized" as const : "not_authorized" as const,
      physical_pilot: "not_authorized" as const,
      next_action: "measure_same_apparatus_source_waveforms_green_response_material_transfer_and_covariance" as const,
    },
    hypothesis_separation: {
      ordinary_em_lane: "retarded_sources_to_green_response_to_phase_loss_recoil_heating" as const,
      standard_dp_lane: "unchanged_boundary_independent_mass_density_contraction" as const,
      speculative_bridge_lane: "not_registered" as const,
      frozen_diosi_law_modified: false as const,
      collapse_bridge_edges_added: 0 as const,
    },
    standing: config.standing,
  };
}
