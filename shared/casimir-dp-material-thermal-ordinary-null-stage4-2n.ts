// math-stage: diagnostic
import { createHash } from "node:crypto";
import {
  convertLossTableToImaginaryAxis,
  type OpticalResponseReceipt,
} from "./casimir-optical-response";
import {
  evaluateCasimirDpQedGreenNoise,
  type CasimirDpQedGreenNoiseInput,
} from "./casimir-dp-qed-green-noise";
import {
  evaluateCasimirDpRadiativeThermalClosure,
  type CasimirDpRadiativeThermalClosureInput,
} from "./casimir-dp-radiative-thermal-closure";
import {
  CASIMIR_DP_STAGE4_2N_RUN_ORDER,
  CasimirDpMaterialThermalOrdinaryNullFixtureStage4_2N,
  CasimirDpMaterialThermalOrdinaryNullStage4_2NConfig,
  type CasimirDpMaterialThermalOrdinaryNullFixtureStage4_2N as Fixture,
  type CasimirDpMaterialThermalOrdinaryNullStage4_2NConfig as Config,
} from "./contracts/casimir-dp-material-thermal-ordinary-null-stage4-2n.v1";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value == null || typeof value !== "object") return Object.is(value, -0) ? 0 : value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [
    key,
    canonicalize((value as Record<string, unknown>)[key]),
  ]));
}

export function sha256CasimirDpMaterialThermalOrdinaryNullStage4_2N(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value)), "utf8").digest("hex");
}

type Complex = [number, number];

function complexFromPhaseChi(phase: number, chi: number): Complex {
  const magnitude = Math.exp(-chi);
  return [magnitude * Math.cos(phase), magnitude * Math.sin(phase)];
}

function multiply([ar, ai]: Complex, [br, bi]: Complex): Complex {
  return [ar * br - ai * bi, ar * bi + ai * br];
}

function divide([ar, ai]: Complex, [br, bi]: Complex): Complex {
  const denominator = br * br + bi * bi;
  if (denominator === 0) throw new Error("stage4_2n_zero_complex_denominator");
  return [(ar * br + ai * bi) / denominator, (ai * br - ar * bi) / denominator];
}

function inverse2(matrix: [[number, number], [number, number]]) {
  const determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  if (!(determinant > 0)) throw new Error("stage4_2n_calibration_covariance_not_invertible");
  return [
    [matrix[1][1] / determinant, -matrix[0][1] / determinant],
    [-matrix[1][0] / determinant, matrix[0][0] / determinant],
  ] as [[number, number], [number, number]];
}

function mahalanobis2(residual: Complex, covariance: [[number, number], [number, number]]) {
  const inverse = inverse2(covariance);
  return residual[0] * (inverse[0][0] * residual[0] + inverse[0][1] * residual[1]) +
    residual[1] * (inverse[1][0] * residual[0] + inverse[1][1] * residual[1]);
}

function zeroMatrix3(): [[number, number, number], [number, number, number], [number, number, number]] {
  return [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
}

function receipt(sourceRef: string, hash: string) {
  return {
    source_ref: sourceRef,
    expected_sha256: hash,
    actual_sha256: hash,
    integrity_verified: true,
  };
}

function buildQedInput(config: Config, fixture: Fixture): CasimirDpQedGreenNoiseInput {
  const binding = sha256CasimirDpMaterialThermalOrdinaryNullStage4_2N({
    campaign_id: config.campaign_id,
    candidate_id: config.upstream_stage4_2m.candidate_id,
    leading_design: config.leading_design,
    optical_response: fixture.optical_response.actual_sha256,
    green_response: fixture.green_response.source_ref,
  });
  const phaseSeed = 0.02;
  const chiSeed = 1e-5;
  return {
    schema_version: "casimir_dp_qed_green_noise/1",
    evidence_class: "synthetic_fixture",
    model_domain: "finite_geometry",
    model_binding_sha256: binding,
    coupling_limit_case: "registered_coupling",
    zero_limit_absolute_tolerance: config.gates.maximum_limit_magnitude,
    green_tensor: {
      source_kind: "finite_geometry_table",
      receipt: receipt(fixture.green_response.source_ref, config.fixture_sha256),
      solver_name: fixture.green_response.solver_name,
      solver_version: fixture.green_response.solver_version,
      model_binding_sha256: binding,
      reciprocity_required: true,
      reciprocity_relative_tolerance: fixture.green_response.reciprocity_relative_tolerance,
      interpolation_relative_error: fixture.green_response.interpolation_relative_error,
      maximum_interpolation_relative_error: fixture.green_response.maximum_interpolation_relative_error,
      samples: fixture.green_response.samples,
    },
    material: {
      material_id: fixture.optical_response.material_id,
      evidence_class: "synthetic_fixture",
      response_kind: "complex_permittivity_permeability",
      receipt: receipt(fixture.optical_response.source_ref, fixture.optical_response.actual_sha256),
      measured_response_over_required_band: false,
      loss_parameter: Math.max(...fixture.optical_response.points.map((point) => point.epsilon_imag)),
      extrapolation_ref: null,
      kramers_kronig: {
        maximum_relative_error: 0,
        standard_uncertainty: 0,
        tolerance: config.gates.maximum_kramers_kronig_relative_uncertainty,
        receipt_ref: fixture.optical_response.source_ref,
      },
    },
    geometry: {
      evidence_class: "synthetic_fixture",
      receipt: receipt("synthetic://casimir-dp-stage4-2n/leading-geometry", config.fixture_sha256),
      gap_m: config.leading_design.gap_m,
      surface_distance_m: config.leading_design.gap_m,
      roughness_rms_m: 0,
      coating_thickness_m: 0,
      alignment_standard_uncertainty_rad: 0,
      temperature_K: config.leading_design.temperature_K,
      measured_geometry_and_alignment: false,
    },
    probe: {
      state_ref: fixture.probe.state_ref,
      response_receipt: receipt(fixture.probe.state_ref, config.fixture_sha256),
      polarizability_SI: fixture.probe.polarizability_SI,
    },
    branch_trace: {
      model_binding_sha256: binding,
      ...fixture.branch_trace,
    },
    noise: {
      model_binding_sha256: binding,
      receipt: receipt(fixture.noise.source_ref, config.fixture_sha256),
      spectrum_convention: "two_sided_angular_frequency",
      source_kind: "explicit_fluctuation_dissipation_model",
      fluctuation_dissipation_ref: "Rytov fluctuation electrodynamics; synthetic finite-geometry recovery fixture",
      includes_material_loss: true,
      includes_temperature: true,
      includes_geometry: true,
      two_sided_frequency_absolute_tolerance_rad_s: 0,
      two_sided_relative_tolerance: 1e-12,
      ...fixture.noise,
      linearized_check: {
        enabled: false,
        linear_response_domain_confirmed: false,
        branch_displacement_m: [config.leading_design.branch_separation_m, 0, 0],
        maximum_relative_error: 0,
      },
    },
    heating_model: null,
    sensitivity_runs: [
      { parameter: "material_loss", parameter_value: 1.1, phase_rad: phaseSeed * 1.01, ramsey_chi: chiSeed * 1.1, model_binding_sha256: binding },
      { parameter: "temperature", parameter_value: 4.1, phase_rad: phaseSeed, ramsey_chi: chiSeed * 1.03, model_binding_sha256: binding },
      { parameter: "surface_distance", parameter_value: config.leading_design.gap_m * 1.01, phase_rad: phaseSeed * 0.98, ramsey_chi: chiSeed * 0.98, model_binding_sha256: binding },
      { parameter: "geometry", parameter_value: config.leading_design.plate_size_m * 1.01, phase_rad: phaseSeed * 1.005, ramsey_chi: chiSeed * 1.005, model_binding_sha256: binding },
    ],
  };
}

function buildLimitInput(
  input: CasimirDpQedGreenNoiseInput,
  limit: "zero_coupling" | "infinite_distance",
): CasimirDpQedGreenNoiseInput {
  const vector = [0, 0, 0] as [number, number, number];
  const zeros = input.branch_trace.time_s.map(() => 0);
  const zeroVectors = input.branch_trace.time_s.map(() => vector);
  const zeroNoise = input.noise.omega_rad_s.map(() => 0);
  const zeroMatrices = input.noise.omega_rad_s.map(() => zeroMatrix3());
  return {
    ...input,
    coupling_limit_case: limit,
    branch_trace: {
      ...input.branch_trace,
      branch_a_potential_J: zeros,
      branch_b_potential_J: zeros,
      branch_a_force_N: zeroVectors,
      branch_b_force_N: zeroVectors,
      differential_force_gradient_N_m: zeros,
    },
    noise: {
      ...input.noise,
      energy_difference_psd_J2_s: zeroNoise,
      force_noise_psd_N2_s: zeroMatrices,
    },
    sensitivity_runs: [
      { parameter: "material_loss", parameter_value: 0, phase_rad: 0, ramsey_chi: 0, model_binding_sha256: input.model_binding_sha256 },
      { parameter: "temperature", parameter_value: 0, phase_rad: 0, ramsey_chi: 0, model_binding_sha256: input.model_binding_sha256 },
      { parameter: "surface_distance", parameter_value: limit === "infinite_distance" ? 1e30 : input.geometry.surface_distance_m, phase_rad: 0, ramsey_chi: 0, model_binding_sha256: input.model_binding_sha256 },
      { parameter: "geometry", parameter_value: 0, phase_rad: 0, ramsey_chi: 0, model_binding_sha256: input.model_binding_sha256 },
    ],
  };
}

function buildThermalInput(config: Config, fixture: Fixture): CasimirDpRadiativeThermalClosureInput {
  const hash = config.fixture_sha256;
  const thermal = fixture.thermal_recovery;
  const area = 4 * Math.PI * config.leading_design.radius_m ** 2;
  const hashed = (sourceRef: string) => ({
    source_ref: sourceRef,
    evidence_class: "synthetic_fixture" as const,
    expected_sha256: hash,
    actual_sha256: hash,
    integrity_verified: true,
  });
  return {
    schema_version: "casimir_dp_radiative_thermal_closure/1",
    evidence_class: "synthetic_fixture",
    model_binding_sha256: sha256CasimirDpMaterialThermalOrdinaryNullStage4_2N({
      campaign_id: config.campaign_id,
      thermal_recovery: fixture.thermal_recovery,
    }),
    authority_receipt: hashed("synthetic://casimir-dp-stage4-2n/thermal-recovery"),
    frequency_convention: {
      canonical_internal_variable: "omega_rad_s",
      conversion_relative_tolerance: 1e-12,
      spectral_checkpoints: [
        { checkpoint_id: "thermal-4K-1THz", nu_Hz: 1e12, omega_rad_s: 2 * Math.PI * 1e12, temperature_K: 4 },
      ],
    },
    integration: {
      dimensionless_x_max: 40,
      simpson_intervals: 20_000,
      stefan_boltzmann_relative_tolerance: 1e-8,
    },
    reservoirs: {
      source_temperature_K: thermal.source_temperature_K,
      environment_temperature_K: thermal.environment_temperature_K,
      source_emissivity: thermal.source_emissivity,
      environment_emissivity: thermal.environment_emissivity,
      radiating_area_m2: area,
      view_factor: 1,
      material_receipt: hashed(fixture.optical_response.source_ref),
    },
    geometry: {
      transfer_regime: "near_field",
      separation_m: config.leading_design.gap_m,
      minimum_far_field_thermal_wavelength_ratio: 10,
      geometry_receipt: hashed(fixture.green_response.source_ref),
    },
    near_field_fdt: {
      source_ref: fixture.noise.source_ref,
      receipt: hashed(fixture.noise.source_ref),
      green_tensor_ref: fixture.green_response.source_ref,
      spectrum_convention: "two_sided_angular_frequency",
      material_loss_included: true,
      temperature_included: true,
      geometry_included: true,
      zero_point_separated_from_thermal_transfer: true,
      net_thermal_power_W: 0,
      gross_thermal_power_W: thermal.gross_thermal_power_W,
      energy_transfer_variance_rate_J2_s: thermal.energy_transfer_variance_rate_J2_s,
      recoil_force_N: thermal.recoil_force_N,
      occupation_heating_rate_s: thermal.occupation_heating_rate_s,
      decoherence_rate_s: thermal.decoherence_rate_s,
      accumulated_covariance: thermal.accumulated_covariance,
    },
    probe: {
      interaction_time_s: config.leading_design.hold_time_s,
      branch_separation_m: config.leading_design.branch_separation_m,
      oscillator_omega_rad_s: fixture.probe.oscillator_omega_rad_s,
      heating_absorption_fraction: 1,
      decoherence_coupling_efficiency: 1,
      recoil_anisotropy: 1,
      recoil_direction: [1, 0, 0],
    },
    solar_benchmark: {
      luminosity_W: 3.828e26,
      radius_m: 6.957e8,
      reference_effective_temperature_K: 5772,
      absolute_tolerance_K: 2,
      receipt: hashed("synthetic://casimir-dp-stage4-2n/iau-solar-nominal-recovery"),
    },
    gates: {
      detailed_balance_absolute_tolerance_W: 0,
      recoil_direction_norm_tolerance: 1e-12,
    },
    accounting: {
      zero_point_in_net_thermal_power: false,
      thermal_channel_already_counted_in_parent_qed: false,
      combine_far_field_and_near_field_outputs: false,
    },
  };
}

export function evaluateCasimirDpMaterialThermalOrdinaryNullStage4_2N(
  rawConfig: Config,
  rawFixture: Fixture,
) {
  const config = CasimirDpMaterialThermalOrdinaryNullStage4_2NConfig.parse(rawConfig);
  const fixture = CasimirDpMaterialThermalOrdinaryNullFixtureStage4_2N.parse(rawFixture);
  const runOrderPass = config.run_order.every((entry, index) => entry === CASIMIR_DP_STAGE4_2N_RUN_ORDER[index]);
  const designBindingPass =
    fixture.branch_trace.time_s.at(-1) === config.leading_design.hold_time_s &&
    config.upstream_stage4_2m.candidate_id === "stage4_2m_candidate_002";

  const opticalReceipt: OpticalResponseReceipt = {
    schema_version: "casimir_optical_response_receipt/1",
    material_id: fixture.optical_response.material_id,
    label: fixture.optical_response.label,
    evidence_class: "synthetic_fixture",
    source_ref: fixture.optical_response.source_ref,
    raw_artifact_path: fixture.optical_response.raw_artifact_path,
    expected_sha256: fixture.optical_response.expected_sha256,
    actual_sha256: fixture.optical_response.actual_sha256,
    calibration_refs: fixture.optical_response.calibration_refs,
    points: fixture.optical_response.points,
    required_coverage: fixture.optical_response.required_coverage,
    tails: fixture.optical_response.tails,
  };
  const imaginaryAxis = convertLossTableToImaginaryAxis({
    receipt: opticalReceipt,
    xi_rad_s: fixture.optical_response.xi_rad_s,
  });
  const kkMaximumRelativeUncertainty = Math.max(...imaginaryAxis.points.map((point) =>
    (point.standard_uncertainty ?? Number.POSITIVE_INFINITY) /
    Math.max(Math.abs(point.epsilon), Number.MIN_VALUE)
  ));
  const kkDiagnosticPass = kkMaximumRelativeUncertainty <=
    config.gates.maximum_kramers_kronig_relative_uncertainty;

  const qedInput = buildQedInput(config, fixture);
  qedInput.material.kramers_kronig.standard_uncertainty = kkMaximumRelativeUncertainty;
  const qed = evaluateCasimirDpQedGreenNoise(qedInput);
  const zeroCoupling = evaluateCasimirDpQedGreenNoise(buildLimitInput(qedInput, "zero_coupling"));
  const infiniteDistance = evaluateCasimirDpQedGreenNoise(buildLimitInput(qedInput, "infinite_distance"));
  const thermal = evaluateCasimirDpRadiativeThermalClosure(buildThermalInput(config, fixture));

  const calibrationRows = fixture.calibration_interventions.map((intervention) => {
    const expected = complexFromPhaseChi(intervention.expected_phase_rad, intervention.expected_chi);
    const residual: Complex = [
      intervention.observed_complex[0] - expected[0],
      intervention.observed_complex[1] - expected[1],
    ];
    const value = mahalanobis2(residual, intervention.covariance);
    const observedMagnitude = Math.hypot(...intervention.observed_complex);
    return {
      intervention_id: intervention.intervention_id,
      kind: intervention.kind,
      evidence_class: intervention.evidence_class,
      expected_complex: expected,
      observed_complex: intervention.observed_complex,
      reconstructed_phase_rad: Math.atan2(intervention.observed_complex[1], intervention.observed_complex[0]),
      reconstructed_chi: -Math.log(Math.max(observedMagnitude, Number.MIN_VALUE)),
      residual_complex: residual,
      mahalanobis2: value,
      gate: value <= config.gates.maximum_calibration_mahalanobis2 ? "pass" as const : "not_ready" as const,
    };
  });
  const calibrationPass = calibrationRows.every((row) => row.gate === "pass");

  const activeSeparated = complexFromPhaseChi(qed.mean_interaction.phase_rad, qed.decoherence.echo_chi);
  const activeCompact: Complex = [1, 0];
  const referenceSeparated: Complex = [1, 0];
  const referenceCompact: Complex = [1, 0];
  const fourCellRatio = divide(
    multiply(activeSeparated, referenceCompact),
    multiply(activeCompact, referenceSeparated),
  );

  const softwarePipelinePass =
    runOrderPass &&
    designBindingPass &&
    imaginaryAxis.gates.artifact_integrity === "pass" &&
    imaginaryAxis.gates.spectral_coverage === "pass" &&
    kkDiagnosticPass &&
    qed.readiness.finite_geometry_gate === "pass" &&
    qed.green_tensor_diagnostics.reciprocity_gate === "pass" &&
    qed.green_tensor_diagnostics.interpolation_gate === "pass" &&
    qed.noise.fluctuation_dissipation_metadata_gate === "pass" &&
    qed.noise.two_sided_frequency_grid.gate === "pass" &&
    qed.noise.two_sided_spectrum_symmetry.gate === "pass" &&
    qed.mean_interaction.phase_standard_uncertainty_rad <= config.gates.maximum_phase_sigma_rad &&
    zeroCoupling.limits.gate === "pass" &&
    infiniteDistance.limits.gate === "pass" &&
    zeroCoupling.limits.maximum_supplied_coupling_magnitude <= config.gates.maximum_limit_magnitude &&
    infiniteDistance.limits.maximum_supplied_coupling_magnitude <= config.gates.maximum_limit_magnitude &&
    thermal.planck_stefan_boltzmann.gate === "pass" &&
    thermal.thermal_transfer.detailed_balance_gate === "pass" &&
    thermal.transfer_regime.double_counting_gate === "pass" &&
    calibrationPass;

  return {
    schema_version: "casimir_dp_material_thermal_ordinary_null_stage4_2n_result/1" as const,
    campaign_id: config.campaign_id,
    evidence_class: config.evidence_class,
    claim_ceiling: config.claim_ceiling,
    upstream_binding: {
      candidate_id: config.upstream_stage4_2m.candidate_id,
      leading_design: config.leading_design,
      run_order_gate: runOrderPass ? "pass" as const : "not_ready" as const,
      design_binding_gate: designBindingPass ? "pass" as const : "not_ready" as const,
    },
    material_response: {
      conversion: imaginaryAxis,
      maximum_propagated_relative_uncertainty: kkMaximumRelativeUncertainty,
      diagnostic_tolerance: config.gates.maximum_kramers_kronig_relative_uncertainty,
      numerical_diagnostic_gate: kkDiagnosticPass ? "pass" as const : "not_ready" as const,
      specimen_specific_measured_response: "not_ready" as const,
    },
    ordinary_qed: qed,
    standard_limits: {
      zero_coupling: zeroCoupling.limits,
      infinite_distance: infiniteDistance.limits,
      gate: zeroCoupling.limits.gate === "pass" && infiniteDistance.limits.gate === "pass"
        ? "pass" as const
        : "not_ready" as const,
    },
    thermal_recovery: {
      planck_stefan_boltzmann: thermal.planck_stefan_boltzmann,
      detailed_balance_gate: thermal.thermal_transfer.detailed_balance_gate,
      near_field_green_fdt_gate: thermal.transfer_regime.near_field_green_fdt_gate,
      double_counting_gate: thermal.transfer_regime.double_counting_gate,
      thermal_chi_crosscheck_only: thermal.decoherence.chi,
      added_to_qed_chi: false as const,
      interpretation: "The near-field thermal fixture checks accounting and standard limits; it is not added to the Green/FDT coherence loss a second time." as const,
    },
    calibration_recovery: {
      rows: calibrationRows,
      maximum_mahalanobis2: Math.max(...calibrationRows.map((row) => row.mahalanobis2)),
      gate: calibrationPass ? "pass" as const : "not_ready" as const,
      measured_calibration_authority: "not_ready" as const,
    },
    ordinary_complex_coherence_null: {
      convention: "C=exp(i*Phi_EM-chi_ordinary)" as const,
      cells: {
        active_boundary_separated: activeSeparated,
        active_boundary_compact: activeCompact,
        reference_boundary_separated: referenceSeparated,
        reference_boundary_compact: referenceCompact,
      },
      cross_ratio: fourCellRatio,
      cross_ratio_definition: "(C_active,separated*C_reference,compact)/(C_active,compact*C_reference,separated)" as const,
      phase_rad: Math.atan2(fourCellRatio[1], fourCellRatio[0]),
      chi: -Math.log(Math.max(Math.hypot(...fourCellRatio), Number.MIN_VALUE)),
      status: "synthetic_ordinary_null_recovery_only" as const,
    },
    frozen_dp_comparator: {
      ...config.frozen_dp_comparator,
      conservative_visibility: Math.exp(-config.frozen_dp_comparator.conservative_density_envelope_exponent),
      gaussian_visibility: Math.exp(-config.frozen_dp_comparator.gaussian_exponent),
      comparison_rule: "Report beside the ordinary-null prediction; do not add or multiply unless a separately registered hypothesis explicitly defines that operation." as const,
    },
    empirical_authorities: fixture.empirical_authorities,
    readiness: {
      software_pipeline: softwarePipelinePass ? "pass" as const : "not_ready" as const,
      specimen_material: "not_ready" as const,
      as_built_geometry: "not_ready" as const,
      full_maxwell_green_tensor: "not_ready" as const,
      independent_solver: "not_ready" as const,
      measured_calibrations: "not_ready" as const,
      measured_covariance: "not_ready" as const,
      ordinary_null_authority: config.standing.ordinary_null_authority,
      measured_evidence: config.standing.measured_evidence,
      residual_attribution: config.standing.residual_attribution,
      collapse_identification: config.standing.collapse_identification,
      manifold_dynamics: config.standing.manifold_dynamics,
      physical_viability: config.standing.physical_viability,
      physical_pilot_authorized: config.standing.physical_pilot_authorized,
      confirmatory_campaign_authorized: config.standing.confirmatory_campaign_authorized,
    },
    graph_policy: {
      theory_badge_promotable: false as const,
      observable_bridge_edges_added: 0 as const,
      ordinary_qed_dp_separation: "pass" as const,
    },
    claim_boundaries: [
      "The finite-geometry table, material spectrum, calibrations, and covariance are synthetic recovery fixtures rather than measurements.",
      "The ordinary Green/FDT phase and loss are not a Casimir-to-collapse transfer kernel.",
      "The frozen Diósi exponents remain a separate hypothesis comparator and are not combined with the ordinary-null result.",
      "A residual cannot be attributed until specimen-specific spectra, as-built geometry, independently checked full-Maxwell response, and measured calibration covariance exist.",
      "No synthetic result identifies collapse or spacetime-manifold dynamics.",
    ],
  };
}
