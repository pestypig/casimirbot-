// math-stage: diagnostic
import {
  CASIMIR_DP_STAGE4_2Q_RUN_ORDER,
  CasimirDpSuperconductingBoundaryControlStage4_2QConfig,
  CasimirDpSuperconductingBoundaryFixtureStage4_2Q,
  type CasimirDpSuperconductingBoundaryControlStage4_2QConfig as Config,
  type CasimirDpSuperconductingBoundaryFixtureStage4_2Q as Fixture,
} from "./contracts/casimir-dp-superconducting-boundary-control-stage4-2q.v1";

type Complex = [number, number];

function coherence(phase: number, chi: number): Complex {
  const magnitude = Math.exp(-chi);
  return [magnitude * Math.cos(phase), magnitude * Math.sin(phase)];
}

function multiply([ar, ai]: Complex, [br, bi]: Complex): Complex {
  return [ar * br - ai * bi, ar * bi + ai * br];
}

function divide([ar, ai]: Complex, [br, bi]: Complex): Complex {
  const denominator = br * br + bi * bi;
  if (!(denominator > 0)) throw new Error("stage4_2q_zero_complex_denominator");
  return [(ar * br + ai * bi) / denominator, (ai * br - ar * bi) / denominator];
}

function norm(vector: number[]): number {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("stage4_2q_signature_length_mismatch");
  const denominator = norm(a) * norm(b);
  if (!(denominator > 0)) throw new Error("stage4_2q_zero_signature_norm");
  return a.reduce((sum, value, index) => sum + value * b[index], 0) / denominator;
}

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.max(Math.abs(expected), Number.MIN_VALUE);
}

export function evaluateCasimirDpSuperconductingBoundaryControlStage4_2Q(
  rawConfig: Config,
  rawFixture: Fixture,
) {
  const config = CasimirDpSuperconductingBoundaryControlStage4_2QConfig.parse(rawConfig);
  const fixture = CasimirDpSuperconductingBoundaryFixtureStage4_2Q.parse(rawFixture);
  const runOrderPass = config.run_order.every((entry, index) => entry === CASIMIR_DP_STAGE4_2Q_RUN_ORDER[index]);
  const specimen = fixture.boundary_specimen;
  const londonCalculated = Math.sqrt(
    specimen.carrier_mass_kg /
      (config.constants.mu0_N_A2 * specimen.carrier_density_m3 * specimen.carrier_charge_C ** 2),
  );
  const londonRelativeError = relativeError(londonCalculated, specimen.london_penetration_depth_m);
  const effectivePhotonMassKg = config.constants.hbar_J_s /
    (specimen.london_penetration_depth_m * config.constants.c_m_s);
  const finiteImpedance = specimen.superconducting_impedance.every((point) =>
    point.omega_rad_s > 0 && Math.hypot(point.resistance_ohm, point.reactance_ohm) > 0
  );
  const reactanceRecovery = specimen.superconducting_impedance.map((point) => {
    const londonExpected = config.constants.mu0_N_A2 * point.omega_rad_s * specimen.london_penetration_depth_m;
    return {
      omega_rad_s: point.omega_rad_s,
      supplied_reactance_ohm: point.reactance_ohm,
      london_expected_reactance_ohm: londonExpected,
      relative_error: relativeError(point.reactance_ohm, londonExpected),
    };
  });
  const maximumReactanceRelativeError = Math.max(...reactanceRecovery.map((row) => row.relative_error));

  const normal = fixture.ordinary_response.normal;
  const superconducting = fixture.ordinary_response.superconducting;
  if (normal.length !== superconducting.length) throw new Error("stage4_2q_response_length_mismatch");
  const responseRows = normal.map((normalPoint, index) => {
    const superconductingPoint = superconducting[index];
    if (normalPoint.hold_time_s !== superconductingPoint.hold_time_s) {
      throw new Error("stage4_2q_hold_time_mismatch");
    }
    const expectedNormal = coherence(normalPoint.phase_rad, normalPoint.chi);
    const expectedSuperconducting = coherence(superconductingPoint.phase_rad, superconductingPoint.chi);
    const suppliedError = Math.max(
      Math.hypot(expectedNormal[0] - normalPoint.complex_coherence[0], expectedNormal[1] - normalPoint.complex_coherence[1]),
      Math.hypot(expectedSuperconducting[0] - superconductingPoint.complex_coherence[0], expectedSuperconducting[1] - superconductingPoint.complex_coherence[1]),
    );
    const ratio = divide(expectedSuperconducting, expectedNormal);
    return {
      hold_time_s: normalPoint.hold_time_s,
      normal: expectedNormal,
      superconducting: expectedSuperconducting,
      boundary_ratio: ratio,
      delta_phase_rad: superconductingPoint.phase_rad - normalPoint.phase_rad,
      delta_chi: superconductingPoint.chi - normalPoint.chi,
      supplied_complex_recovery_error: suppliedError,
    };
  });
  const responseVector = responseRows.flatMap((row) => [row.delta_phase_rad, row.delta_chi]);
  const transfer = fixture.ordinary_response.green_transfer;
  if (transfer.frequency_weights.length !== specimen.normal_impedance.length ||
      specimen.normal_impedance.length !== specimen.superconducting_impedance.length) {
    throw new Error("stage4_2q_green_transfer_frequency_length_mismatch");
  }
  const weightSum = transfer.frequency_weights.reduce((sum, value) => sum + value, 0);
  if (Math.abs(weightSum - 1) > 1e-12) throw new Error("stage4_2q_green_transfer_weights_not_normalized");
  let impedanceMagnitudeContrast = 0;
  let dissipativeResistanceContrast = 0;
  for (let index = 0; index < transfer.frequency_weights.length; index += 1) {
    const normalPoint = specimen.normal_impedance[index];
    const superconductingPoint = specimen.superconducting_impedance[index];
    if (normalPoint.omega_rad_s !== superconductingPoint.omega_rad_s) {
      throw new Error("stage4_2q_impedance_frequency_mismatch");
    }
    const normalMagnitude = Math.hypot(normalPoint.resistance_ohm, normalPoint.reactance_ohm);
    const superconductingMagnitude = Math.hypot(superconductingPoint.resistance_ohm, superconductingPoint.reactance_ohm);
    impedanceMagnitudeContrast += transfer.frequency_weights[index] *
      (superconductingMagnitude - normalMagnitude) / normalMagnitude;
    dissipativeResistanceContrast += transfer.frequency_weights[index] *
      (superconductingPoint.resistance_ohm - normalPoint.resistance_ohm) /
      normalPoint.resistance_ohm;
  }
  const greenTransferRows = responseRows.map((row) => {
    const holdFraction = row.hold_time_s / config.leading_design.hold_time_s;
    const predictedDeltaPhaseRad = transfer.phase_scale_rad * impedanceMagnitudeContrast * holdFraction;
    const predictedDeltaChi = transfer.chi_scale * dissipativeResistanceContrast * holdFraction;
    return {
      hold_time_s: row.hold_time_s,
      predicted_delta_phase_rad: predictedDeltaPhaseRad,
      supplied_delta_phase_rad: row.delta_phase_rad,
      predicted_delta_chi: predictedDeltaChi,
      supplied_delta_chi: row.delta_chi,
      maximum_absolute_error: Math.max(
        Math.abs(predictedDeltaPhaseRad - row.delta_phase_rad),
        Math.abs(predictedDeltaChi - row.delta_chi),
      ),
    };
  });
  const maximumGreenTransferAbsoluteError = Math.max(...greenTransferRows.map((row) => row.maximum_absolute_error));

  const dpCancellationRows = responseRows.map((row) => {
    const exponent = config.frozen_diosi.gaussian_exponent_at_hold *
      (row.hold_time_s / config.leading_design.hold_time_s);
    const dpFactor: Complex = [Math.exp(-exponent), 0];
    const ratioWithDp = divide(multiply(row.superconducting, dpFactor), multiply(row.normal, dpFactor));
    const cancellationError = Math.hypot(
      ratioWithDp[0] - row.boundary_ratio[0],
      ratioWithDp[1] - row.boundary_ratio[1],
    );
    return { hold_time_s: row.hold_time_s, exponent, ratio_with_dp: ratioWithDp, cancellation_error: cancellationError };
  });
  const maximumDpCancellationError = Math.max(...dpCancellationRows.map((row) => row.cancellation_error));

  const strategyRows = fixture.toggle_strategies.map((strategy) => {
    if (strategy.covariance_diagonal.length !== responseVector.length) {
      throw new Error("stage4_2q_covariance_length_mismatch");
    }
    const whiten = (vector: number[]) => vector.map((value, index) =>
      value / Math.sqrt(strategy.covariance_diagonal[index])
    );
    const whitenedSignal = whiten(responseVector);
    const nuisanceCosines = strategy.nuisance_vectors.map((nuisance) => ({
      nuisance_id: nuisance.nuisance_id,
      absolute_cosine: Math.abs(cosine(whitenedSignal, whiten(nuisance.vector))),
    }));
    const maximumCosine = Math.max(...nuisanceCosines.map((row) => row.absolute_cosine));
    const conditionNumber = Math.sqrt((1 + maximumCosine) / Math.max(1 - maximumCosine, Number.MIN_VALUE));
    const snr = norm(whitenedSignal);
    const gate = maximumCosine <= config.gates.maximum_signature_cosine &&
      conditionNumber <= config.gates.maximum_augmented_condition_number &&
      snr >= config.gates.minimum_boundary_contrast_snr
      ? "pass" as const
      : "no_go" as const;
    return {
      strategy_id: strategy.strategy_id,
      description: strategy.description,
      boundary_contrast_snr: snr,
      nuisance_cosines: nuisanceCosines,
      maximum_signature_cosine: maximumCosine,
      augmented_condition_number: conditionNumber,
      gate,
      required_measured_authorities: strategy.required_measured_authorities,
    };
  });
  const passingStrategies = strategyRows.filter((row) => row.gate === "pass")
    .sort((a, b) => b.boundary_contrast_snr - a.boundary_contrast_snr);

  const plateVolumeM3 = config.leading_design.plate_size_m ** 2 * specimen.coating_thickness_m;
  const condensationEnergyDensityJm3 = specimen.thermodynamic_critical_field_T ** 2 /
    (2 * config.constants.mu0_N_A2);
  const condensationEnergyJ = condensationEnergyDensityJm3 * plateVolumeM3;
  const condensationMassEquivalentKg = condensationEnergyJ / config.constants.c_m_s ** 2;
  const condensationToProbeMassRatio = condensationMassEquivalentKg / config.leading_design.mass_kg;

  const softwarePass = runOrderPass &&
    londonRelativeError <= config.gates.london_relative_tolerance &&
    maximumReactanceRelativeError <= config.gates.london_relative_tolerance &&
    finiteImpedance &&
    responseRows.every((row) => row.supplied_complex_recovery_error <= 1e-12) &&
    maximumGreenTransferAbsoluteError <= config.gates.maximum_green_transfer_absolute_error &&
    maximumDpCancellationError <= config.gates.maximum_dp_cancellation_error;

  return {
    schema_version: "casimir_dp_superconducting_boundary_control_stage4_2q_result/1" as const,
    campaign_id: config.campaign_id,
    evidence_class: config.evidence_class,
    claim_ceiling: config.claim_ceiling,
    upstream_binding: {
      leading_design: config.leading_design,
      run_order_gate: runOrderPass ? "pass" as const : "not_ready" as const,
      stage4_2n_ordinary_null_preserved: true as const,
      stage4_2o_public_component_not_transferred: true as const,
      stage4_2p_proper_time_budget_preserved: true as const,
    },
    gauge_condensate_recovery: {
      london_penetration_depth_calculated_m: londonCalculated,
      london_penetration_depth_supplied_m: specimen.london_penetration_depth_m,
      london_relative_error: londonRelativeError,
      effective_in_medium_photon_mass_scale_kg: effectivePhotonMassKg,
      zero_dc_resistance_ohm: specimen.dc_resistance_superconducting_ohm,
      finite_frequency_impedance_nonzero: finiteImpedance,
      reactance_recovery: reactanceRecovery,
      maximum_reactance_relative_error: maximumReactanceRelativeError,
      interpretation: "Anderson-Higgs/Meissner screening is an in-medium electromagnetic response, not a vacuum photon mass or Standard-Model Higgs observation." as const,
    },
    ordinary_boundary_contrast: {
      convention: "C_beta=exp(i*Phi_EM_beta-chi_EM_beta)" as const,
      response_rows: responseRows,
      response_vector_phase_chi_interleaved: responseVector,
      status: "synthetic_stage4_2n_transport_only" as const,
    },
    synthetic_green_transfer: {
      model_id: transfer.model_id,
      frequency_weights: transfer.frequency_weights,
      impedance_magnitude_contrast: impedanceMagnitudeContrast,
      dissipative_resistance_contrast: dissipativeResistanceContrast,
      rows: greenTransferRows,
      maximum_absolute_error: maximumGreenTransferAbsoluteError,
      tolerance: config.gates.maximum_green_transfer_absolute_error,
      gate: maximumGreenTransferAbsoluteError <= config.gates.maximum_green_transfer_absolute_error ? "pass" as const : "not_ready" as const,
      measured_full_maxwell_green_authority: "not_ready" as const,
    },
    frozen_diosi_cancellation: {
      rows: dpCancellationRows,
      maximum_error: maximumDpCancellationError,
      tolerance: config.gates.maximum_dp_cancellation_error,
      gate: maximumDpCancellationError <= config.gates.maximum_dp_cancellation_error ? "pass" as const : "not_ready" as const,
      interpretation: "The normal/superconducting boundary ratio cancels the unchanged standard Diósi factor and therefore diagnoses boundary response rather than the primary Diósi signal." as const,
    },
    strategy_assessment: {
      strategies: strategyRows,
      passing_strategy_ids: passingStrategies.map((row) => row.strategy_id),
      selected_synthetic_strategy: passingStrategies[0]?.strategy_id ?? null,
      synthetic_control_value: passingStrategies.length > 0 ? "bounded_candidate_found" as const : "explicit_redesign_no_go" as const,
      physical_control_authority: "not_ready" as const,
    },
    condensation_energy_screen: {
      plate_volume_m3: plateVolumeM3,
      energy_density_J_m3: condensationEnergyDensityJm3,
      energy_J: condensationEnergyJ,
      mass_equivalent_kg: condensationMassEquivalentKg,
      mass_equivalent_to_probe_mass_ratio: condensationToProbeMassRatio,
      role: "ordinary_stress_energy_upper_bound_only" as const,
    },
    bridge_map: {
      standard_model_higgs_to_diosi: "nonbridge" as const,
      anderson_higgs_to_standard_model_higgs: "structural_analogy_only" as const,
      superconducting_impedance_to_green_tensor: "ordinary_observable_bridge" as const,
      superconducting_state_to_diosi_rate: "nonbridge" as const,
      bec_many_body_coherence_to_platform_replication: "conditional_platform_bridge" as const,
      bec_order_parameter_to_diosi_rate: "nonbridge_without_many_body_mass_density_contract" as const,
      registered_boundary_to_collapse_kernel: false as const,
      collapse_bridge_edges_added: 0 as const,
    },
    recoveries: {
      software_pipeline: softwarePass ? "pass" as const : "not_ready" as const,
      finite_impedance_semantics: finiteImpedance ? "pass" as const : "not_ready" as const,
      dp_boundary_independence: maximumDpCancellationError <= config.gates.maximum_dp_cancellation_error ? "pass" as const : "not_ready" as const,
      public_component_scope_preserved: fixture.public_component_context.apparatus_matched_transfer_allowed === false && fixture.public_component_context.covariance_transport_allowed === false ? "pass" as const : "not_ready" as const,
    },
    empirical_authorities: fixture.empirical_authorities,
    standing: config.standing,
    graph_policy: {
      theory_badge_promotable: false as const,
      ordinary_observable_edges_documented: 1 as const,
      collapse_bridge_edges_added: 0 as const,
      frozen_diosi_law_modified: false as const,
    },
    claim_boundaries: [
      "Zero DC resistance is not zero finite-frequency impedance.",
      "The superconducting order parameter and the Standard-Model Higgs field are not the same physical field.",
      "The measured superconducting-drum component replay is not transported into the proposed apparatus response or covariance.",
      "A normal/superconducting boundary contrast is an ordinary electromagnetic control unless a separate boundary-to-collapse kernel is registered.",
      "A BEC is a possible coherence platform, but its many-body density cannot reuse the single effective Gaussian-sphere Diósi formula without a new contract.",
      "Synthetic control identifiability is not measured evidence, collapse identification, manifold dynamics, or physical viability.",
    ],
  };
}
