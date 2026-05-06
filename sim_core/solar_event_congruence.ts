export type SolarMechanismId =
  | "magnetic_reconnection_null"
  | "p_mode_phase_modulation"
  | "ribbon_blob_tearing"
  | "photospheric_field_backreaction"
  | "sunquake_acoustic_response"
  | "nanoflare_transition_region_brightening"
  | "multifractal_flare_memory_proxy"
  | "polarimetric_faraday_path"
  | "collapse_residual_hypothesis";

export type SolarCongruenceStatus = "pass" | "warn" | "fail" | "missing" | "advisory";

export interface SolarEventObservation {
  event_id: string;
  time_s: ArrayLike<number>;
  goes_xray_flux?: ArrayLike<number>;
  euv_irradiance?: ArrayLike<number>;
  uv_lyman_alpha?: ArrayLike<number>;
  hmi_doppler_velocity?: ArrayLike<number>;
  p_mode_phase_rad?: ArrayLike<number>;
  sunquake_power?: ArrayLike<number>;
  ribbon_flux_Mx?: ArrayLike<number>;
  ribbon_area_m2?: ArrayLike<number>;
  pil_horizontal_field_T?: ArrayLike<number>;
  magnetic_free_energy_J?: number;
  ribbon_blob_width_km?: ArrayLike<number>;
  ribbon_blob_spacing_km?: ArrayLike<number>;
  polarization_fraction?: ArrayLike<number>;
  rotation_measure_rad_m2?: ArrayLike<number>;
  source_region_id?: string;
  noaa_active_region?: string;
  harp_id?: string;
  topology_context_ref?: string;
  energy_closure_fraction?: number;
  packet_expected_energy_J?: number;
  radiated_energy_J?: number;
  p_mode_frequency_mHz?: number;
  qpp_period_candidates_s?: ArrayLike<number>;
}

export interface SolarCongruenceMetric {
  id: SolarMechanismId;
  value: number | null;
  status: SolarCongruenceStatus;
  null_model: string;
  evidence_refs: string[];
  notes?: string;
}

export interface SolarEventCongruenceReport {
  event_id: string;
  metrics: SolarCongruenceMetric[];
  constraint_envelope: SolarConstraintEnvelope;
  primary_physics_pass: boolean;
  speculative_residual_allowed: boolean;
  mismatch_fingerprint: string;
}

export interface SolarConstraintEnvelope {
  event_id: string;
  energy_budget: {
    magnetic_free_energy_J?: number;
    radiated_energy_J?: number;
    acoustic_energy_proxy?: number;
    packet_expected_energy_J?: number;
    energy_closure_fraction?: number;
    status: SolarCongruenceStatus;
  };
  timing_budget: {
    p_mode_frequency_mHz?: number;
    phase_lock_score?: number;
    flare_onset_lag_s?: number;
    ribbon_to_quake_lag_s?: number;
    qpp_period_candidates_s?: number[];
    status: SolarCongruenceStatus;
  };
  topology_budget: {
    has_active_region_linkage: boolean;
    has_pil_context: boolean;
    has_ribbon_flux: boolean;
    has_topology_context: boolean;
    status: SolarCongruenceStatus;
  };
  residual_budget: {
    residual_allowed: boolean;
    residual_claim_tier: "none" | "advisory_only";
    blocked_reasons: string[];
  };
}

const finiteValues = (series?: ArrayLike<number>): number[] =>
  series ? Array.from({ length: series.length }, (_, index) => Number(series[index])).filter(Number.isFinite) : [];
const hasSeries = (series?: ArrayLike<number>): boolean => finiteValues(series).length > 0;
const mean = (values: number[]): number | null =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
const std = (values: number[]): number | null => {
  if (values.length < 2) return null;
  const avg = mean(values) ?? 0;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1));
};
const range = (values: number[]): number | null =>
  values.length === 0 ? null : Math.max(...values) - Math.min(...values);
const hasSource = (observation: SolarEventObservation): boolean =>
  Boolean(observation.source_region_id || observation.noaa_active_region || observation.harp_id);
const driverSeries = (observation: SolarEventObservation): ArrayLike<number> | undefined =>
  observation.goes_xray_flux ?? observation.euv_irradiance ?? observation.ribbon_flux_Mx;

function metricById(metrics: SolarCongruenceMetric[], id: SolarMechanismId): SolarCongruenceMetric | undefined {
  return metrics.find((metric) => metric.id === id);
}

function vectorStrength(phases: number[]): number {
  if (phases.length === 0) return 0;
  return Math.sqrt((mean(phases.map(Math.cos)) ?? 0) ** 2 + (mean(phases.map(Math.sin)) ?? 0) ** 2);
}

function shiftedPhaseControl(phases: number[], selectedIndices: number[]): number {
  if (phases.length < 4 || selectedIndices.length === 0) return 0;
  const controlCount = Math.min(16, phases.length - 1);
  const strengths = Array.from({ length: controlCount }, (_, shiftIndex) => {
    const shift = shiftIndex + 1;
    return vectorStrength(selectedIndices.map((index) => phases[(index + shift) % phases.length]));
  });
  return mean(strengths) ?? 0;
}

function magneticReconnectionNull(observation: SolarEventObservation): SolarCongruenceMetric {
  const radiative = hasSeries(observation.goes_xray_flux) || hasSeries(observation.euv_irradiance);
  const ribbon = hasSeries(observation.ribbon_flux_Mx) || hasSeries(observation.ribbon_area_m2);
  const source = hasSource(observation);
  const topology = Boolean(observation.topology_context_ref);
  const energy = Number.isFinite(observation.magnetic_free_energy_J);
  const evidence_refs = [
    ...(radiative ? ["goes_or_euv_curve"] : []),
    ...(ribbon ? ["ribbon_evolution"] : []),
    ...(source ? ["active_region_linkage"] : []),
    ...(topology ? ["magnetic_topology_context"] : []),
    ...(energy ? ["magnetic_free_energy_budget"] : []),
  ];
  if (!radiative && !ribbon && !source) {
    return { id: "magnetic_reconnection_null", value: null, status: "missing", null_model: "magnetic_reconnection_floor", evidence_refs };
  }
  if (observation.magnetic_free_energy_J !== undefined && (!energy || observation.magnetic_free_energy_J <= 0)) {
    return { id: "magnetic_reconnection_null", value: 0, status: "fail", null_model: "magnetic_reconnection_floor", evidence_refs };
  }
  const score = [radiative, ribbon, source, topology, energy].filter(Boolean).length / 5;
  return {
    id: "magnetic_reconnection_null",
    value: score,
    status: score >= 0.6 ? "pass" : "warn",
    null_model: "magnetic_reconnection_floor",
    evidence_refs,
  };
}

function pModePhaseModulation(observation: SolarEventObservation): SolarCongruenceMetric {
  const phases = finiteValues(observation.p_mode_phase_rad);
  if (phases.length === 0) {
    return { id: "p_mode_phase_modulation", value: null, status: "missing", null_model: "random_event_phase_control", evidence_refs: [] };
  }
  const driver = finiteValues(driverSeries(observation));
  const driverRange = range(driver);
  const threshold = driver.length === phases.length && driverRange !== null ? Math.min(...driver) + 0.75 * driverRange : null;
  const selectedIndices = phases
    .map((_, index) => index)
    .filter((index) => threshold === null || driver[index] >= threshold);
  const sampleIndices = selectedIndices.length > 0 ? selectedIndices : phases.map((_, index) => index);
  const score = vectorStrength(sampleIndices.map((index) => phases[index]));
  const control = shiftedPhaseControl(phases, sampleIndices);
  const beatsControl = score >= control + 0.1;
  return {
    id: "p_mode_phase_modulation",
    value: score,
    status: score >= 0.7 && beatsControl ? "pass" : "warn",
    null_model: "random_event_phase_control",
    evidence_refs: ["p_mode_phase_rad", ...(driver.length > 0 ? ["event_driver_series"] : [])],
    notes: `Five-minute p-modes are timing modulators, not EUV photon energy sources; shuffled_control=${control.toFixed(6)}.`,
  };
}

function ribbonBlobTearing(observation: SolarEventObservation): SolarCongruenceMetric {
  const widths = finiteValues(observation.ribbon_blob_width_km);
  const spacings = finiteValues(observation.ribbon_blob_spacing_km);
  if (widths.length === 0 && spacings.length === 0) {
    return { id: "ribbon_blob_tearing", value: null, status: "missing", null_model: "random_ribbon_kernel_spacing", evidence_refs: [] };
  }
  const widthScore = widths.length ? widths.filter((v) => v >= 320 && v <= 455).length / widths.length : null;
  const spacingScore = spacings.length ? spacings.filter((v) => v >= 850 && v <= 1350).length / spacings.length : null;
  const parts = [widthScore, spacingScore].filter((v): v is number => v !== null);
  const score = mean(parts) ?? 0;
  return {
    id: "ribbon_blob_tearing",
    value: score,
    status: score >= 0.5 ? "pass" : "warn",
    null_model: "random_ribbon_kernel_spacing",
    evidence_refs: [...(widths.length ? ["ribbon_blob_width_km"] : []), ...(spacings.length ? ["ribbon_blob_spacing_km"] : [])],
  };
}

function photosphericFieldBackreaction(observation: SolarEventObservation): SolarCongruenceMetric {
  const field = finiteValues(observation.pil_horizontal_field_T);
  if (field.length === 0) {
    return { id: "photospheric_field_backreaction", value: null, status: "missing", null_model: "no_permanent_pil_field_step", evidence_refs: [] };
  }
  const midpoint = Math.floor(field.length / 2);
  const pre = field.slice(0, midpoint);
  const post = field.slice(midpoint);
  const stepAmplitude = Math.abs((mean(post) ?? 0) - (mean(pre) ?? 0));
  const pooledScale = Math.max(std(field) ?? 0, Math.abs(mean(field) ?? 0), 1e-12);
  const score = Math.min(1, stepAmplitude / pooledScale);
  return {
    id: "photospheric_field_backreaction",
    value: score,
    status: score >= 0.25 ? "pass" : "warn",
    null_model: "no_permanent_pil_field_step",
    evidence_refs: ["pil_horizontal_field_T", ...(hasSeries(observation.goes_xray_flux) ? ["goes_xray_flux"] : [])],
    notes: "PIL backreaction uses a pre/post field-step proxy and remains magnetic recoil context, not collapse evidence.",
  };
}

function sunquakeAcousticResponse(observation: SolarEventObservation): SolarCongruenceMetric {
  const quake = finiteValues(observation.sunquake_power);
  if (quake.length === 0) {
    return { id: "sunquake_acoustic_response", value: null, status: "missing", null_model: "no_acoustic_impulse", evidence_refs: [] };
  }
  const linked = hasSeries(driverSeries(observation)) || hasSeries(observation.hmi_doppler_velocity);
  return {
    id: "sunquake_acoustic_response",
    value: Math.max(...quake),
    status: linked ? "pass" : "warn",
    null_model: "no_acoustic_impulse",
    evidence_refs: ["sunquake_power", ...(linked ? ["flare_or_doppler_driver"] : [])],
  };
}

function nanoflareTransitionRegionBrightening(observation: SolarEventObservation): SolarCongruenceMetric {
  const euv = finiteValues(observation.euv_irradiance);
  if (euv.length === 0) {
    return { id: "nanoflare_transition_region_brightening", value: null, status: "missing", null_model: "no_compact_transition_region_brightening", evidence_refs: [] };
  }
  const burstiness = (std(euv) ?? 0) / Math.max(Math.abs(mean(euv) ?? 0), 1e-12);
  return {
    id: "nanoflare_transition_region_brightening",
    value: burstiness,
    status: burstiness > 0.05 && (hasSource(observation) || Boolean(observation.topology_context_ref)) ? "pass" : "warn",
    null_model: "no_compact_transition_region_brightening",
    evidence_refs: ["euv_irradiance"],
  };
}

function multifractalFlareMemoryProxy(observation: SolarEventObservation): SolarCongruenceMetric {
  const driver = finiteValues(observation.goes_xray_flux ?? observation.euv_irradiance);
  if (driver.length < 4) {
    return { id: "multifractal_flare_memory_proxy", value: null, status: "missing", null_model: "white_or_smoothed_flare_noise", evidence_refs: [] };
  }
  const differences = driver.slice(1).map((value, index) => value - driver[index]);
  const burstiness = (std(differences) ?? 0) / Math.max(std(driver) ?? 0, 1e-12);
  return {
    id: "multifractal_flare_memory_proxy",
    value: burstiness,
    status: burstiness > 0.15 ? "pass" : "warn",
    null_model: "white_or_smoothed_flare_noise",
    evidence_refs: [observation.goes_xray_flux ? "goes_xray_flux" : "euv_irradiance"],
    notes: "Proxy only; full multifractal validation requires WTMM, structure-function, or spectrum analysis.",
  };
}

function polarimetricFaradayPath(observation: SolarEventObservation): SolarCongruenceMetric {
  const rm = finiteValues(observation.rotation_measure_rad_m2);
  const pol = finiteValues(observation.polarization_fraction);
  if (rm.length === 0 && pol.length === 0) {
    return { id: "polarimetric_faraday_path", value: null, status: "missing", null_model: "no_magnetized_path_constraint", evidence_refs: [] };
  }
  return {
    id: "polarimetric_faraday_path",
    value: Math.abs(mean(rm) ?? 0),
    status: "advisory",
    null_model: "magnetized_path_constraint_only",
    evidence_refs: [...(rm.length ? ["rotation_measure_rad_m2"] : []), ...(pol.length ? ["polarization_fraction"] : [])],
    notes: "Faraday rotation constrains magnetic path geometry only; collapse_rate_claim_from_faraday_only = false.",
  };
}

function buildResidualBlockedReasons(metrics: SolarCongruenceMetric[], observation: SolarEventObservation): string[] {
  const blocked: string[] = [];
  const magneticStatus = metricById(metrics, "magnetic_reconnection_null")?.status;
  const pModeStatus = metricById(metrics, "p_mode_phase_modulation")?.status;
  if (magneticStatus !== "pass" && magneticStatus !== "warn") blocked.push("magnetic_floor_not_computed_or_failed");
  if (pModeStatus !== "pass" && pModeStatus !== "warn") blocked.push("p_mode_not_computed");
  if (
    hasSeries(observation.pil_horizontal_field_T) &&
    metricById(metrics, "photospheric_field_backreaction")?.status === "missing"
  ) {
    blocked.push("photospheric_backreaction_missing");
  }
  if (
    (hasSeries(observation.ribbon_blob_width_km) || hasSeries(observation.ribbon_blob_spacing_km)) &&
    metricById(metrics, "ribbon_blob_tearing")?.status === "missing"
  ) {
    blocked.push("ribbon_topology_missing");
  }
  if (observation.energy_closure_fraction !== undefined && observation.energy_closure_fraction > 1.01) {
    blocked.push("energy_closure_exceeds_budget");
  }
  return blocked;
}

export function buildSolarConstraintEnvelope(
  observation: SolarEventObservation,
  metrics: SolarCongruenceMetric[],
): SolarConstraintEnvelope {
  const closure = observation.energy_closure_fraction;
  const hasEnergyEvidence =
    observation.magnetic_free_energy_J !== undefined ||
    observation.radiated_energy_J !== undefined ||
    observation.packet_expected_energy_J !== undefined ||
    closure !== undefined;
  const energyStatus: SolarCongruenceStatus =
    !hasEnergyEvidence
      ? "missing"
      : closure !== undefined && closure > 1.01
        ? "fail"
        : observation.magnetic_free_energy_J !== undefined && observation.magnetic_free_energy_J <= 0
          ? "fail"
          : observation.magnetic_free_energy_J
            ? "pass"
            : "warn";
  const phaseScore = metricById(metrics, "p_mode_phase_modulation")?.value ?? undefined;
  const timingStatus = metricById(metrics, "p_mode_phase_modulation")?.status ?? "missing";
  const topologyParts = {
    has_active_region_linkage: hasSource(observation),
    has_pil_context: hasSeries(observation.pil_horizontal_field_T),
    has_ribbon_flux: hasSeries(observation.ribbon_flux_Mx) || hasSeries(observation.ribbon_area_m2),
    has_topology_context: Boolean(observation.topology_context_ref),
  };
  const topologyCount = Object.values(topologyParts).filter(Boolean).length;
  const topologyStatus: SolarCongruenceStatus =
    topologyCount === 0 ? "missing" : topologyCount >= 3 ? "pass" : "warn";
  const blockedReasons = buildResidualBlockedReasons(metrics, observation);
  const acoustic = finiteValues(observation.sunquake_power);

  return {
    event_id: observation.event_id,
    energy_budget: {
      magnetic_free_energy_J: observation.magnetic_free_energy_J,
      radiated_energy_J: observation.radiated_energy_J,
      acoustic_energy_proxy: acoustic.length > 0 ? Math.max(...acoustic) : undefined,
      packet_expected_energy_J: observation.packet_expected_energy_J,
      energy_closure_fraction: closure,
      status: energyStatus,
    },
    timing_budget: {
      p_mode_frequency_mHz: observation.p_mode_frequency_mHz,
      phase_lock_score: phaseScore,
      qpp_period_candidates_s: observation.qpp_period_candidates_s
        ? finiteValues(observation.qpp_period_candidates_s)
        : undefined,
      status: timingStatus,
    },
    topology_budget: {
      ...topologyParts,
      status: topologyStatus,
    },
    residual_budget: {
      residual_allowed: blockedReasons.length === 0,
      residual_claim_tier: blockedReasons.length === 0 ? "advisory_only" : "none",
      blocked_reasons: blockedReasons,
    },
  };
}

export function evaluateSolarEventCongruence(observation: SolarEventObservation): SolarEventCongruenceReport {
  const metrics = [
    magneticReconnectionNull(observation),
    pModePhaseModulation(observation),
    ribbonBlobTearing(observation),
    photosphericFieldBackreaction(observation),
    sunquakeAcousticResponse(observation),
    nanoflareTransitionRegionBrightening(observation),
    multifractalFlareMemoryProxy(observation),
    polarimetricFaradayPath(observation),
  ];
  const constraintEnvelope = buildSolarConstraintEnvelope(observation, metrics);
  const allowed = constraintEnvelope.residual_budget.residual_allowed;
  metrics.push({
    id: "collapse_residual_hypothesis",
    value: allowed ? 0 : null,
    status: allowed ? "advisory" : "missing",
    null_model: "post_mhd_residual_only",
    evidence_refs: allowed ? metrics.map((metric) => metric.id) : [],
    notes: allowed
      ? "Advisory residual gate only; this metric is never a primary winner and never creates source power."
      : "Residual gate blocked until magnetic, p-mode, applicable topology/backreaction, and energy gates are computed.",
  });
  const primary = metrics.filter((metric) => metric.id !== "collapse_residual_hypothesis");
  return {
    event_id: observation.event_id,
    metrics,
    constraint_envelope: constraintEnvelope,
    primary_physics_pass: primary.some((metric) => metric.status === "pass") && primary.every((metric) => metric.status !== "fail"),
    speculative_residual_allowed: allowed,
    mismatch_fingerprint: metrics.map((metric) => `${metric.id}:${metric.status}`).join("|"),
  };
}
