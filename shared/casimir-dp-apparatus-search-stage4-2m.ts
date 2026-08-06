// math-stage: diagnostic
import { createHash } from "node:crypto";
import {
  evaluateCasimirDpDpRegisteredPoint,
  sha256CasimirDpDpParameterManifest,
  type CasimirDpDpParameterManifest,
} from "./casimir-dp-dp-companion";
import {
  CasimirDpApparatusSearchStage4_2MConfig,
  type CasimirDpApparatusSearchStage4_2MConfig as Config,
} from "./contracts/casimir-dp-apparatus-search-stage4-2m.v1";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value == null || typeof value !== "object") return Object.is(value, -0) ? 0 : value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [
    key,
    canonicalize((value as Record<string, unknown>)[key]),
  ]));
}

export function sha256CasimirDpApparatusSearchStage4_2M(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value)), "utf8").digest("hex");
}

function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = sign * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t -
    0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
  return 0.5 * (1 + erf);
}

type Candidate = {
  material_id: Config["materials"][number]["id"];
  density_kg_m3: number;
  radius_m: number;
  separation_m: number;
  hold_time_s: number;
  gap_m: number;
  plate_size_m: number;
  branch_orientation_tilt_rad: number;
  temperature_K: number;
  pressure_Pa: number;
  lateral_sigma_m: number;
  angular_sigma_rad: number;
  echo_residual_fraction: number;
  modulation_frequency_Hz: number;
  readout_efficiency: number;
};

function at<T>(rows: T[], index: number): T {
  return rows[((index % rows.length) + rows.length) % rows.length];
}

function buildCandidates(config: Config): Candidate[] {
  const axes = config.axes;
  const rows: Candidate[] = config.materials.map((anchorMaterial) => ({
    material_id: anchorMaterial.id,
    density_kg_m3: anchorMaterial.density_kg_m3,
    radius_m: Math.max(...axes.radius_m),
    separation_m: Math.max(...axes.separation_m),
    hold_time_s: axes.hold_time_s.find((value) => value === 0.25) ?? Math.max(...axes.hold_time_s),
    gap_m: Math.max(...axes.gap_m),
    plate_size_m: Math.max(...axes.plate_size_m),
    branch_orientation_tilt_rad: 0,
    temperature_K: Math.min(...axes.temperature_K),
    pressure_Pa: Math.min(...axes.pressure_Pa),
    lateral_sigma_m: Math.min(...axes.lateral_sigma_m),
    angular_sigma_rad: Math.min(...axes.angular_sigma_rad),
    echo_residual_fraction: Math.min(...axes.echo_residual_fraction),
    modulation_frequency_Hz: at(axes.modulation_frequency_Hz, 1),
    readout_efficiency: Math.max(...axes.readout_efficiency),
  }));
  const diamondAnchor = rows.find((row) => row.material_id === "diamond");
  if (diamondAnchor) {
    rows.push({
      ...diamondAnchor,
      gap_m: at(axes.gap_m, axes.gap_m.length - 2),
    });
    rows.push({
      ...diamondAnchor,
      pressure_Pa: at(axes.pressure_Pa, 1),
    });
  }
  for (let index = rows.length; index < config.max_candidates; index += 1) {
    const material = at(config.materials, Math.floor(index / 64));
    rows.push({
      material_id: material.id,
      density_kg_m3: material.density_kg_m3,
      radius_m: at(axes.radius_m, index),
      separation_m: at(axes.separation_m, Math.floor(index / 4)),
      hold_time_s: at(axes.hold_time_s, Math.floor(index / 16)),
      gap_m: at(axes.gap_m, index * 7 + Math.floor(index / 11)),
      plate_size_m: at(axes.plate_size_m, index * 5),
      branch_orientation_tilt_rad: at(axes.branch_orientation_tilt_rad, index * 7),
      temperature_K: at(axes.temperature_K, index * 3),
      pressure_Pa: at(axes.pressure_Pa, index * 5),
      lateral_sigma_m: at(axes.lateral_sigma_m, index * 7),
      angular_sigma_rad: at(axes.angular_sigma_rad, index * 11),
      echo_residual_fraction: at(axes.echo_residual_fraction, index * 13),
      modulation_frequency_Hz: at(axes.modulation_frequency_Hz, index * 17),
      readout_efficiency: at(axes.readout_efficiency, index * 19),
    });
  }
  return rows;
}

function dpManifest(config: Config, candidate: Candidate, massKg: number): CasimirDpDpParameterManifest {
  return {
    schema_version: "casimir_dp_dp_parameter_manifest/1",
    model_id: config.frozen_dp.model_id,
    model_version: "1",
    physical_regularization: {
      kind: "gaussian_mass_density_smearing",
      R0_m: config.frozen_dp.R0_m,
    },
    numerical_regularization: {
      kind: "fourier_simpson_quadrature",
      softening_m: config.frozen_dp.numerical_softening_m,
      used_as_physical_cutoff: false,
      integration_upper_u: config.frozen_dp.integration_upper_u,
      even_intervals: config.frozen_dp.even_intervals,
      crosscheck_relative_tolerance: config.frozen_dp.crosscheck_relative_tolerance,
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
      masses_kg: [massKg],
      branch_separations_m: [candidate.separation_m],
      hold_times_s: [candidate.hold_time_s],
    },
  };
}

export function evaluateCasimirDpApparatusSearchStage4_2M(rawConfig: Config) {
  const config = CasimirDpApparatusSearchStage4_2MConfig.parse(rawConfig);
  const evaluated = buildCandidates(config).map((candidate, index) => {
    const massKg = 4 * Math.PI * candidate.radius_m ** 3 * candidate.density_kg_m3 / 3;
    const manifest = dpManifest(config, candidate, massKg);
    const prediction = evaluateCasimirDpDpRegisteredPoint({
      mass_kg: massKg,
      branch_separation_m: candidate.separation_m,
      parameter_manifest: manifest,
      parameter_manifest_sha256: sha256CasimirDpDpParameterManifest(manifest),
    });
    const gaussianExponent = prediction.Gamma_DP_s * candidate.hold_time_s;
    const worstDensityExponent = gaussianExponent / config.reference.density_envelope_factor;

    const radiusScale = candidate.radius_m / config.reference.radius_m;
    const holdScale = candidate.hold_time_s / config.reference.hold_time_s;
    const separationScale = candidate.separation_m / config.reference.separation_m;
    const gapScale = config.reference.gap_m / candidate.gap_m;
    const plateScale = 4e-5 / candidate.plate_size_m;
    const lateralJacobian = config.reference.phase_lateral_jacobian_rad_per_m *
      radiusScale ** 3 * holdScale * separationScale * gapScale ** 4 * plateScale;
    const angularJacobian = config.reference.phase_angular_jacobian_rad_per_rad *
      radiusScale ** 3 * holdScale * separationScale * gapScale ** 5;
    const rawPhaseSigma = Math.hypot(
      lateralJacobian * candidate.lateral_sigma_m,
      Math.sqrt(2) * angularJacobian * candidate.angular_sigma_rad,
    );
    const phaseSigma = rawPhaseSigma * candidate.echo_residual_fraction;
    const echoedNominalPhase = Math.abs(
      angularJacobian * candidate.branch_orientation_tilt_rad *
      candidate.echo_residual_fraction,
    );

    const localizationScale = Math.min(1, candidate.separation_m / config.reference.separation_m);
    const gasRate = config.reference.gas_rate_s *
      (candidate.pressure_Pa / config.reference.pressure_Pa) *
      Math.sqrt(config.reference.temperature_K / candidate.temperature_K) *
      radiusScale ** 2 * localizationScale;
    const gasToDp = gasRate / prediction.Gamma_DP_s;
    const requiredWindows = Math.ceil(
      config.reference.stage4_2c_required_windows *
      (config.reference.dp_exponent / Math.max(worstDensityExponent, Number.MIN_VALUE)) ** 2,
    );
    const forecastPower = normalCdf(
      2.486 * Math.sqrt(config.gates.maximum_required_windows / requiredWindows) - 1.644854,
    );
    const companionSnr = config.reference.companion_snr *
      (massKg / config.reference.mass_kg) *
      Math.sqrt(candidate.readout_efficiency / 0.8);
    const massRatio = (massKg / config.reference.dalton_kg) /
      config.reference.demonstrated_mass_Da;
    const separationToDiameter = candidate.separation_m / (2 * candidate.radius_m);
    const gates = {
      dp_minimum: worstDensityExponent >= config.gates.minimum_worst_density_dp_exponent,
      dp_maximum: gaussianExponent <= config.gates.maximum_gaussian_dp_exponent,
      phase_covariance: phaseSigma <= config.gates.maximum_phase_sigma_rad,
      nominal_phase: echoedNominalPhase <= config.gates.maximum_echoed_nominal_phase_rad,
      gas: gasToDp <= config.gates.maximum_gas_to_dp_ratio,
      signature_cosine: config.reference.stage4_2c_maximum_cosine <= config.gates.maximum_signature_cosine,
      condition: config.reference.stage4_2c_condition_number <= config.gates.maximum_condition_number,
      power: requiredWindows <= config.gates.maximum_required_windows &&
        forecastPower >= config.gates.minimum_power,
      companion: companionSnr >= config.gates.minimum_companion_snr,
      preparation_scale: massRatio <= config.gates.maximum_state_preparation_mass_ratio &&
        separationToDiameter <= config.gates.maximum_separation_to_diameter,
      external_scalar_bound: config.frozen_dp.R0_m > 4.9e-10,
      dp_crosscheck: prediction.E_G_crosscheck_gate === "pass",
    };
    const passed = Object.values(gates).every(Boolean);
    const score = Object.values(gates).filter(Boolean).length -
      Math.log10(Math.max(1, phaseSigma / config.gates.maximum_phase_sigma_rad)) -
      Math.log10(Math.max(1, gasToDp / config.gates.maximum_gas_to_dp_ratio));
    return {
      candidate_id: "stage4_2m_candidate_" + String(index).padStart(3, "0"),
      ...candidate,
      mass_kg: massKg,
      dp: {
        E_G_J: prediction.E_G_analytic_J,
        Gamma_s: prediction.Gamma_DP_s,
        gaussian_exponent: gaussianExponent,
        conservative_density_envelope_exponent: worstDensityExponent,
        gaussian_visibility: Math.exp(-gaussianExponent),
        conservative_density_visibility: Math.exp(-worstDensityExponent),
        crosscheck_relative_error: prediction.E_G_crosscheck_relative_error,
      },
      electromagnetic: {
        transported_lateral_jacobian_rad_per_m: lateralJacobian,
        transported_angular_jacobian_rad_per_rad: angularJacobian,
        raw_phase_sigma_rad: rawPhaseSigma,
        echoed_phase_sigma_rad: phaseSigma,
        echoed_nominal_phase_rad: echoedNominalPhase,
        model_scope: "stage4_2l_finite_rectangle_jacobian_power_law_transport_only",
      },
      gas: {
        QLBE_proxy_rate_s: gasRate,
        gas_to_dp_ratio: gasToDp,
        model_scope: "stage4_2l_species_proxy_scaled_by_pressure_temperature_radius_and_localization",
      },
      identifiability: {
        transported_maximum_signature_cosine: config.reference.stage4_2c_maximum_cosine,
        transported_condition_number: config.reference.stage4_2c_condition_number,
        required_paired_windows: requiredWindows,
        forecast_power_at_maximum_windows: forecastPower,
        rule: "shape_metrics_transport_only_amplitude_rescales_power",
      },
      companion: {
        synthetic_snr: companionSnr,
        measured_detector_authority: "not_ready" as const,
      },
      state_preparation: {
        mass_ratio_to_170kDa: massRatio,
        separation_to_diameter: separationToDiameter,
        integrated_sequence_authority: "not_ready" as const,
      },
      gates,
      passed_all_synthetic_gates: passed,
      score,
    };
  }).sort((left, right) => Number(right.passed_all_synthetic_gates) - Number(left.passed_all_synthetic_gates) ||
    right.score - left.score);

  const eligible = evaluated.filter((row) => row.passed_all_synthetic_gates);
  const measuredAuthoritiesReady = Object.values(config.empirical_authorities).every(Boolean);
  return {
    schema_version: "casimir_dp_apparatus_search_stage4_2m_result/1",
    candidate_count: evaluated.length,
    eligible_synthetic_candidate_count: eligible.length,
    best_candidate: evaluated[0],
    eligible_region: eligible.slice(0, 10),
    outcome: {
      synthetic_search: eligible.length > 0
        ? "bounded_configuration_region_found" as const
        : "explicit_bounded_search_no_go" as const,
      measured_commissioning: eligible.length > 0
        ? "candidate_region_for_measured_subsystem_commissioning_only" as const
        : "not_authorized" as const,
      empirical_authorities_ready: measuredAuthoritiesReady,
      physical_pilot_authorized: false,
      confirmatory_campaign_authorized: false,
      measured_evidence: "not_ready" as const,
      residual_attribution: "blocked" as const,
      collapse_identification: "blocked" as const,
      manifold_dynamics: "blocked" as const,
      physical_viability: "not_evaluated" as const,
      transfer_kernel: "not_registered" as const,
      observable_bridge_edges_added: 0,
    },
    search_scope: {
      max_candidates: config.max_candidates,
      axes: config.axes,
      frozen_dp_model: config.frozen_dp,
      no_confirmatory_fitting: true,
      synthetic_inputs_are_not_measurements: true,
    },
  };
}
