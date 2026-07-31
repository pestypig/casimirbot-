// math-stage: diagnostic
import { createHash } from "node:crypto";
import {
  buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress,
} from "./contracts/casimir-finite-temperature-finite-geometry-maxwell-stress.v1";
import type {
  CasimirDpMaxwellMacroscopicQedClosureStage4_2FConfig,
} from "./contracts/casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f.v1";
import {
  CASIMIR_DP_DP_MODEL_REGISTRATION,
  evaluateCasimirDpDpRegisteredPoint,
  sha256CasimirDpDpParameterManifest,
  type CasimirDpDpParameterManifest,
} from "./casimir-dp-dp-companion";

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

function buildDpManifest(
  config: CasimirDpMaxwellMacroscopicQedClosureStage4_2FConfig,
  R0_m: number,
): CasimirDpDpParameterManifest {
  return {
    schema_version: "casimir_dp_dp_parameter_manifest/1",
    model_id: "diosi_1989_gaussian_regularized_nondissipative",
    model_version: "1",
    physical_regularization: {
      kind: "gaussian_mass_density_smearing",
      R0_m,
    },
    numerical_regularization: {
      kind: "fourier_simpson_quadrature",
      softening_m: 1e-9,
      used_as_physical_cutoff: false,
      integration_upper_u: 8,
      even_intervals: 4096,
      crosscheck_relative_tolerance: 1e-5,
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
      masses_kg: [config.dp_model_audit.mass_kg],
      branch_separations_m: [config.dp_model_audit.branch_separation_m],
      hold_times_s: [config.dp_model_audit.hold_time_s],
    },
  };
}

export function evaluateCasimirDpMaxwellMacroscopicQedClosureStage4_2F(
  config: CasimirDpMaxwellMacroscopicQedClosureStage4_2FConfig,
) {
  const constants = config.constants;
  const maxwell = config.maxwell_recovery;
  const omega = 2 * Math.PI * maxwell.frequency_Hz;
  const materialLightSpeed = 1 /
    Math.sqrt(constants.epsilon0_F_m * constants.mu0_N_A2);
  const waveNumber = omega / materialLightSpeed;
  const electricPeak = maxwell.electric_field_peak_V_m;
  const magneticPeak = electricPeak / materialLightSpeed;

  const gaussElectricNormalized = 0;
  const gaussMagneticNormalized = 0;
  const faradayNormalized = Math.abs(
    waveNumber * electricPeak - omega * magneticPeak,
  ) / Math.max(waveNumber * electricPeak, Number.MIN_VALUE);
  const ampereNormalized = Math.abs(
    waveNumber * magneticPeak -
      omega * constants.epsilon0_F_m * constants.mu0_N_A2 * electricPeak,
  ) / Math.max(waveNumber * magneticPeak, Number.MIN_VALUE);
  const constitutiveLightSpeedRelativeError = relativeError(
    materialLightSpeed,
    constants.c_m_s,
  );
  const maximumMaxwellResidual = Math.max(
    gaussElectricNormalized,
    gaussMagneticNormalized,
    faradayNormalized,
    ampereNormalized,
    constitutiveLightSpeedRelativeError,
  );

  const linearJonesNorm = 1;
  const circularJonesNorm = (1 / Math.sqrt(2)) ** 2 +
    (1 / Math.sqrt(2)) ** 2;
  const basisInvarianceError = Math.abs(
    linearJonesNorm - circularJonesNorm,
  );
  const peakEnergyDensity =
    0.5 * (
      constants.epsilon0_F_m * electricPeak ** 2 +
      magneticPeak ** 2 / constants.mu0_N_A2
    );
  const averageEnergyDensity = peakEnergyDensity / 2;
  const averagePoyntingFlux =
    electricPeak * magneticPeak /
    (2 * constants.mu0_N_A2);
  const poyntingEnergyIdentityError = relativeError(
    averagePoyntingFlux,
    materialLightSpeed * averageEnergyDensity,
  );
  const maxwellGate =
    maximumMaxwellResidual <= maxwell.maximum_normalized_residual &&
      basisInvarianceError <= maxwell.maximum_basis_invariance_error &&
      poyntingEnergyIdentityError <= maxwell.maximum_normalized_residual
      ? "pass"
      : "blocked";

  const fdt = config.green_fdt_recovery;
  const thermalArgument =
    constants.hbar_J_s * fdt.angular_frequency_rad_s /
    (2 * constants.k_B_J_K * fdt.temperature_K);
  const coth = 1 / Math.tanh(thermalArgument);
  const zeroTemperatureCoth = 1 /
    Math.tanh(
      constants.hbar_J_s * fdt.angular_frequency_rad_s /
        (2 * constants.k_B_J_K * 1e-12),
    );
  const zeroTemperatureRelativeError = relativeError(
    zeroTemperatureCoth,
    1,
  );
  const electricCorrelationTrace =
    constants.hbar_J_s *
    constants.mu0_N_A2 *
    fdt.angular_frequency_rad_s ** 2 *
    coth *
    fdt.imaginary_green_trace_m_inv /
    Math.PI;
  const fdtGate =
    fdt.imaginary_green_trace_m_inv > 0 &&
      electricCorrelationTrace > 0 &&
      zeroTemperatureRelativeError <=
        fdt.maximum_zero_temperature_relative_error
      ? "pass"
      : "blocked";

  const casimir = config.ideal_casimir_recovery;
  const idealEnergyDensity = -(
    Math.PI ** 2 *
    constants.hbar_J_s *
    constants.c_m_s /
    (720 * casimir.gap_m ** 4)
  );
  const idealPressure = -(
    Math.PI ** 2 *
    constants.hbar_J_s *
    constants.c_m_s /
    (240 * casimir.gap_m ** 4)
  );
  const pressureEnergyIdentityError = relativeError(
    idealPressure,
    casimir.pressure_to_energy_density_ratio * idealEnergyDensity,
  );
  const idealCasimirGate =
    pressureEnergyIdentityError <=
      casimir.maximum_identity_relative_error
      ? "pass"
      : "blocked";

  const finiteGeometry =
    buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress();
  const finiteGeometryGate =
    finiteGeometry.status === "blocked" &&
      !finiteGeometry.finiteTemperatureFiniteGeometryMaxwellStressReady &&
      !config.finite_geometry_readiness.import_nhm2_evidence
      ? "pass"
      : "blocked";

  const dpRows = config.dp_model_audit.sensitivity_R0_m.map((R0_m) => {
    const manifest = buildDpManifest(config, R0_m);
    const manifestHash = sha256CasimirDpDpParameterManifest(manifest);
    const result = evaluateCasimirDpDpRegisteredPoint({
      mass_kg: config.dp_model_audit.mass_kg,
      branch_separation_m: config.dp_model_audit.branch_separation_m,
      parameter_manifest: manifest,
      parameter_manifest_sha256: manifestHash,
    });
    return {
      R0_m,
      selected: R0_m === config.dp_model_audit.selected_R0_m,
      parameter_manifest_sha256: manifestHash,
      E_G_J: result.E_G_analytic_J,
      Gamma_DP_s: result.Gamma_DP_s,
      tau_DP_s: result.tau_DP_s,
      visibility_ratio:
        result.coherence.find(
          (row) => row.hold_time_s === config.dp_model_audit.hold_time_s,
        )?.visibility_ratio ?? null,
      D_pp_kg2_m2_s3: result.master_equation_D_pp_kg2_m2_s3,
      heating_W: result.heating_W,
      crosscheck_relative_error: result.E_G_crosscheck_relative_error,
      crosscheck_gate: result.E_G_crosscheck_gate,
    };
  });
  const selectedDp = dpRows.find((row) => row.selected);
  const transport = config.stage4_2c_transport_audit;
  const transportedMass =
    transport.strongest_baseline_cell_mass_kg * transport.mass_scale;
  const transportedSeparation =
    transport.strongest_baseline_separation_m *
    transport.branch_separation_scale;
  const transportManifest = buildDpManifest(
    config,
    config.dp_model_audit.selected_R0_m,
  );
  const transportManifestHash =
    sha256CasimirDpDpParameterManifest(transportManifest);
  const transportedPoint = evaluateCasimirDpDpRegisteredPoint({
    mass_kg: transportedMass,
    branch_separation_m: transportedSeparation,
    parameter_manifest: transportManifest,
    parameter_manifest_sha256: transportManifestHash,
  });
  const transportRateRelativeError = relativeError(
    transportedPoint.Gamma_DP_s,
    transport.reported_strongest_Gamma_DP_s,
  );
  const declaredAndTransportedMassMatch =
    relativeError(
      transport.declared_candidate_mass_kg,
      transportedMass,
    ) <= 1e-12;
  const transportAuditGate =
    transportRateRelativeError <= 1e-12 &&
      !transport.single_mass_apparatus_identity_demonstrated &&
      !declaredAndTransportedMassMatch
      ? "pass"
      : "blocked";
  const dpDefinitionGate =
    CASIMIR_DP_DP_MODEL_REGISTRATION.model_id ===
      config.dp_model_audit.registered_model_id &&
      selectedDp != null &&
      dpRows.every((row) => row.crosscheck_gate === "pass") &&
      !config.dp_model_audit.boundary_variable_in_generator &&
      !config.dp_model_audit.transfer_kernel_registered
      ? "pass"
      : "blocked";

  const companion = config.companion_forecast_audit;
  const forecastStandardUncertainty =
    companion.one_shot_standard_uncertainty_W /
    Math.sqrt(companion.planned_independent_samples);
  const inferredSignal =
    companion.expected_forecast_snr * forecastStandardUncertainty;
  const selectedCompanionHeating =
    selectedDp?.heating_W ?? Number.NaN;
  const transportedCompanionHeating = transportedPoint.heating_W;
  const inferredSignalMatchesSelectedModel =
    Number.isFinite(selectedCompanionHeating) &&
    relativeError(inferredSignal, selectedCompanionHeating) <= 1e-12;
  const inferredSignalMatchesTransportedModel =
    relativeError(inferredSignal, transportedCompanionHeating) <= 1e-12;
  const companionModelIdentityAuthority =
    inferredSignalMatchesSelectedModel ||
      inferredSignalMatchesTransportedModel
      ? "ready"
      : "not_ready";
  const companionAuditGate =
    companion.independence_receipt_class === "synthetic" &&
      !companion.detector_noise_receipt_available &&
      companion.measured_companion_authority === "not_ready"
      ? "pass"
      : "blocked";

  const statePreparationGate =
    config.apparatus_gates.selected_superposition_prepared &&
      config.apparatus_gates.branch_separation_metrology_measured &&
      config.apparatus_gates.hold_time_coherence_demonstrated
      ? "ready"
      : "not_ready";
  const modulationAngularFrequency =
    2 * Math.PI * config.apparatus_gates.boundary_modulation_Hz;
  const modulationGate =
    config.apparatus_gates.cavity_relaxation_measured &&
      config.apparatus_gates.material_relaxation_measured &&
      config.apparatus_gates.mechanical_sideband_transfer_measured &&
      config.apparatus_gates.dynamical_casimir_background_bounded
      ? "ready"
      : "not_ready";
  const completeStressEnergyGate =
    config.apparatus_gates
      .complete_apparatus_renormalized_stress_energy_available &&
      config.apparatus_gates.conserved_total_stress_verified
      ? "ready"
      : "not_ready";

  const nonbridgeGate =
    !config.observable_bridge_edges_allowed &&
      !config.dp_model_audit.boundary_variable_in_generator &&
      !config.dp_model_audit.transfer_kernel_registered
      ? "pass"
      : "blocked";
  const softwareGate =
    maxwellGate === "pass" &&
      fdtGate === "pass" &&
      idealCasimirGate === "pass" &&
      finiteGeometryGate === "pass" &&
      dpDefinitionGate === "pass" &&
      transportAuditGate === "pass" &&
      companionAuditGate === "pass" &&
      nonbridgeGate === "pass"
      ? "pass"
      : "blocked";

  const output = {
    schema_version:
      "casimir_dp_maxwell_macroscopic_qed_closure_stage4_2f_result/1",
    evidence_class: config.evidence_class,
    claim_ceiling: config.claim_ceiling,
    promotion_allowed: false,
    covariant_maxwell_closure: {
      gate: maxwellGate,
      equations: {
        homogeneous: "nabla_[alpha F_beta_gamma]=0",
        inhomogeneous: "nabla_mu H^(mu nu)=J_free^nu",
        charge_conservation: "nabla_mu J^mu=0",
        constitutive_scope:
          "H is related to F by a causal material response; vacuum H=F/mu0 is only the recovery limit.",
      },
      observer_frame: maxwell.observer_frame,
      material_light_speed_m_s: materialLightSpeed,
      constitutive_light_speed_relative_error:
        constitutiveLightSpeedRelativeError,
      plane_wave: {
        angular_frequency_rad_s: omega,
        wave_number_rad_m: waveNumber,
        electric_peak_V_m: electricPeak,
        magnetic_peak_T: magneticPeak,
        normalized_residuals: {
          gauss_electric: gaussElectricNormalized,
          gauss_magnetic: gaussMagneticNormalized,
          faraday: faradayNormalized,
          ampere_maxwell: ampereNormalized,
          maximum: maximumMaxwellResidual,
        },
        average_energy_density_J_m3: averageEnergyDensity,
        average_poynting_flux_W_m2: averagePoyntingFlux,
        poynting_energy_identity_relative_error:
          poyntingEnergyIdentityError,
      },
      polarization: {
        linear_jones_norm: linearJonesNorm,
        circular_jones_norm: circularJonesNorm,
        basis_invariance_error: basisInvarianceError,
        transverse_degrees_of_freedom: 2,
        interpretation:
          "TE/TM, linear, and circular polarization are bases or states of the same transverse electromagnetic field space.",
      },
    },
    macroscopic_qed_green_fdt_closure: {
      gate: fdtGate,
      green_operator:
        "[curl mu^-1 curl-(omega^2/c^2) epsilon]G=I delta",
      thermal_argument: thermalArgument,
      coth_factor: coth,
      zero_temperature_coth_factor: zeroTemperatureCoth,
      zero_temperature_relative_error: zeroTemperatureRelativeError,
      imaginary_green_trace_m_inv: fdt.imaginary_green_trace_m_inv,
      electric_correlation_trace_SI_proxy: electricCorrelationTrace,
      passive_response: fdt.imaginary_green_trace_m_inv > 0,
      chain:
        "Maxwell plus causal constitutive response and boundary conditions -> Green tensor -> FDT field correlations -> renormalized mean stress and force/noise/phase/coherence observables.",
    },
    ideal_casimir_recovery: {
      gate: idealCasimirGate,
      gap_m: casimir.gap_m,
      energy_density_J_m3: idealEnergyDensity,
      pressure_Pa: idealPressure,
      pressure_to_energy_density_ratio:
        idealPressure / idealEnergyDensity,
      identity_relative_error: pressureEnergyIdentityError,
      authority: "analytic_limit_crosscheck_only",
    },
    finite_geometry_maxwell_readiness: {
      gate: finiteGeometryGate,
      method_contract_status: finiteGeometry.status,
      method_contract_ready:
        finiteGeometry.finiteTemperatureFiniteGeometryMaxwellStressReady,
      check_summary: {
        total: finiteGeometry.checks.length,
        pass: finiteGeometry.checks.filter((row) => row.status === "pass")
          .length,
        blocked:
          finiteGeometry.checks.filter((row) => row.status === "blocked")
            .length,
        fail: finiteGeometry.checks.filter((row) => row.status === "fail")
          .length,
      },
      first_blocker: finiteGeometry.blockers[0] ?? null,
      nhm2_method_reused: true,
      nhm2_evidence_reused: false,
      apparatus_authority: "not_ready",
    },
    named_dp_model_domain: {
      gate: dpDefinitionGate,
      registration: CASIMIR_DP_DP_MODEL_REGISTRATION,
      master_equation_convention:
        "dot(rho)=-i[H,rho]/hbar-(G/(2hbar)) integral d3x d3y [mu_R0(x),[mu_R0(y),rho]]/|x-y|",
      mass_density_smearing:
        "mu_R0 is the registered Gaussian-smeared single-effective-particle mass-density operator.",
      selected_point: selectedDp,
      R0_sensitivity_rows: dpRows,
      sensitivity_role: "model_sensitivity_not_allowed_parameter_region",
      external_parameter_region_authority: "not_ready",
      standard_dp_boundary_variable_present: false,
      maxwell_or_cavity_frequency_enters_generator: false,
    },
    stage4_2c_transport_identity_audit: {
      gate: transportAuditGate,
      selected_candidate_id: transport.selected_candidate_id,
      declared_candidate_point: {
        mass_kg: transport.declared_candidate_mass_kg,
        branch_separation_m: config.dp_model_audit.branch_separation_m,
        Gamma_DP_s: selectedDp?.Gamma_DP_s ?? null,
        hold_time_s: config.dp_model_audit.hold_time_s,
        visibility_ratio: selectedDp?.visibility_ratio ?? null,
      },
      strongest_transported_grid_point: {
        baseline_mass_kg: transport.strongest_baseline_cell_mass_kg,
        mass_scale: transport.mass_scale,
        transported_mass_kg: transportedMass,
        baseline_branch_separation_m:
          transport.strongest_baseline_separation_m,
        branch_separation_scale: transport.branch_separation_scale,
        transported_branch_separation_m: transportedSeparation,
        Gamma_DP_s: transportedPoint.Gamma_DP_s,
        reported_Gamma_DP_s: transport.reported_strongest_Gamma_DP_s,
        rate_relative_error: transportRateRelativeError,
        hold_time_s: config.dp_model_audit.hold_time_s,
        visibility_ratio:
          transportedPoint.coherence.find(
            (row) =>
              row.hold_time_s === config.dp_model_audit.hold_time_s,
          )?.visibility_ratio ?? null,
      },
      declared_and_transported_mass_match:
        declaredAndTransportedMassMatch,
      single_mass_apparatus_identity_demonstrated:
        transport.single_mass_apparatus_identity_demonstrated,
      apparatus_identity_authority: "not_ready",
      interpretation:
        "The Stage-4.2C headline rate is recovered from the strongest transported grid cell, not from the separately declared candidate mass. A single physical apparatus identity must be frozen before confirmatory use.",
    },
    companion_observable_audit: {
      gate: companionAuditGate,
      observable: companion.observable,
      reported_synthetic_forecast_snr: companion.expected_forecast_snr,
      one_shot_standard_uncertainty_W:
        companion.one_shot_standard_uncertainty_W,
      planned_independent_samples: companion.planned_independent_samples,
      forecast_standard_uncertainty_W: forecastStandardUncertainty,
      inferred_predicted_signal_W: inferredSignal,
      selected_model_heating_W: selectedCompanionHeating,
      strongest_transported_model_heating_W:
        transportedCompanionHeating,
      inferred_signal_matches_selected_model:
        inferredSignalMatchesSelectedModel,
      inferred_signal_matches_strongest_transported_model:
        inferredSignalMatchesTransportedModel,
      model_identity_authority: companionModelIdentityAuthority,
      independence_receipt_class: companion.independence_receipt_class,
      detector_noise_receipt_available:
        companion.detector_noise_receipt_available,
      measured_companion_authority: companion.measured_companion_authority,
      interpretation:
        "The large Stage-4.2B SNR is a synthetic heating forecast conditional on an assumed noise floor. Its signal is not reconciled to either the declared Stage-4.2C reference object or the strongest transported cell, so it is neither demonstrated apparatus sensitivity nor yet a companion prediction for the selected design.",
    },
    apparatus_readiness: {
      state_preparation: {
        gate: statePreparationGate,
        mass_kg: config.dp_model_audit.mass_kg,
        branch_separation_m: config.dp_model_audit.branch_separation_m,
        hold_time_s: config.dp_model_audit.hold_time_s,
      },
      active_boundary: {
        gate: modulationGate,
        modulation_frequency_Hz:
          config.apparatus_gates.boundary_modulation_Hz,
        modulation_angular_frequency_rad_s: modulationAngularFrequency,
        required_comparisons: [
          "Omega_mod*tau_cavity",
          "Omega_mod*tau_material",
          "Omega_mod versus mechanical resonances and sidebands",
          "dynamical-Casimir and switching-radiation background",
        ],
      },
      complete_apparatus_stress_energy: {
        gate: completeStressEnergyGate,
        maxwell_field_stress_is_complete_gr_source: false,
        requires:
          "renormalized conserved total tensor for fields, plates, supports, sources, and boundary conditions",
      },
    },
    hypothesis_separation: {
      gate: nonbridgeGate,
      lanes: [
        "H0_ordinary_maxwell_macroscopic_qed_material_and_environment",
        "H1_frozen_regularized_mass_density_dp",
        "H2_registered_casimir_to_collapse_extension_slot",
      ],
      admitted_dp_edges: [
        "branch_mass_density_difference_to_registered_dp_generator",
      ],
      prohibited_edges: [
        "maxwell_frequency_to_dp_rate_without_kernel",
        "green_tensor_to_dp_rate_without_kernel",
        "casimir_mean_pressure_to_noise_psd",
        "maxwell_field_stress_to_complete_gr_source",
        "material_phase_velocity_to_metric_light_cone",
        "synthetic_companion_snr_to_measured_support",
      ],
      observable_bridge_edges_added: 0,
    },
    final_gates: {
      software_and_equation_recovery: softwareGate,
      finite_geometry_maxwell_authority: "not_ready",
      measured_material_green_authority: "not_ready",
      named_dp_model_definition: dpDefinitionGate,
      candidate_transport_identity_authority: "not_ready",
      dp_parameter_region_authority: "not_ready",
      companion_detector_authority: "not_ready",
      companion_model_identity_authority:
        companionModelIdentityAuthority,
      state_preparation_authority: statePreparationGate,
      quasistatic_modulation_authority: modulationGate,
      complete_apparatus_stress_energy: completeStressEnergyGate,
      measured_evidence: "not_ready",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      physical_viability: "not_evaluated",
    },
  } as const;

  return {
    ...output,
    result_receipt: {
      schema_version: "casimir_dp_stage4_2f_result_receipt/1",
      sha256: sha256(output),
    },
  };
}
