export type SolarMechanismId =
  | "magnetic_reconnection_null"
  | "p_mode_phase_modulation"
  | "ribbon_blob_tearing"
  | "photospheric_field_backreaction"
  | "sunquake_acoustic_response"
  | "nanoflare_transition_region_brightening"
  | "multifractal_flare_memory"
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
  primary_physics_pass: boolean;
  speculative_residual_allowed: boolean;
  mismatch_fingerprint: string;
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
  const selected = phases.filter((_, index) => threshold === null || driver[index] >= threshold);
  const sample = selected.length > 0 ? selected : phases;
  const score = Math.sqrt((mean(sample.map(Math.cos)) ?? 0) ** 2 + (mean(sample.map(Math.sin)) ?? 0) ** 2);
  return {
    id: "p_mode_phase_modulation",
    value: score,
    status: score >= 0.7 ? "pass" : "warn",
    null_model: "random_event_phase_control",
    evidence_refs: ["p_mode_phase_rad", ...(driver.length > 0 ? ["event_driver_series"] : [])],
    notes: "Five-minute p-modes are timing modulators, not EUV photon energy sources.",
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
  const score = Math.min(1, (range(field) ?? 0) / Math.max(Math.abs(mean(field) ?? 0), 1e-12));
  return {
    id: "photospheric_field_backreaction",
    value: score,
    status: score >= 0.35 ? "pass" : "warn",
    null_model: "no_permanent_pil_field_step",
    evidence_refs: ["pil_horizontal_field_T", ...(hasSeries(observation.goes_xray_flux) ? ["goes_xray_flux"] : [])],
    notes: "PIL backreaction is magnetic recoil context, not collapse evidence.",
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

function multifractalFlareMemory(observation: SolarEventObservation): SolarCongruenceMetric {
  const driver = finiteValues(observation.goes_xray_flux ?? observation.euv_irradiance);
  if (driver.length < 4) {
    return { id: "multifractal_flare_memory", value: null, status: "missing", null_model: "white_or_smoothed_flare_noise", evidence_refs: [] };
  }
  const differences = driver.slice(1).map((value, index) => value - driver[index]);
  const burstiness = (std(differences) ?? 0) / Math.max(std(driver) ?? 0, 1e-12);
  return {
    id: "multifractal_flare_memory",
    value: burstiness,
    status: burstiness > 0.15 ? "pass" : "warn",
    null_model: "white_or_smoothed_flare_noise",
    evidence_refs: [observation.goes_xray_flux ? "goes_xray_flux" : "euv_irradiance"],
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

function residualAllowed(metrics: SolarCongruenceMetric[], observation: SolarEventObservation): boolean {
  const byId = new Map(metrics.map((metric) => [metric.id, metric]));
  const primaryComputed = ["magnetic_reconnection_null", "p_mode_phase_modulation"].every((id) =>
    ["pass", "warn"].includes(byId.get(id as SolarMechanismId)?.status ?? ""),
  );
  const fieldOk = hasSeries(observation.pil_horizontal_field_T)
    ? byId.get("photospheric_field_backreaction")?.status !== "missing"
    : true;
  const ribbonOk = hasSeries(observation.ribbon_blob_width_km) || hasSeries(observation.ribbon_blob_spacing_km)
    ? byId.get("ribbon_blob_tearing")?.status !== "missing"
    : true;
  const energyOk = observation.energy_closure_fraction === undefined || observation.energy_closure_fraction <= 1.01;
  return primaryComputed && fieldOk && ribbonOk && energyOk;
}

export function evaluateSolarEventCongruence(observation: SolarEventObservation): SolarEventCongruenceReport {
  const metrics = [
    magneticReconnectionNull(observation),
    pModePhaseModulation(observation),
    ribbonBlobTearing(observation),
    photosphericFieldBackreaction(observation),
    sunquakeAcousticResponse(observation),
    nanoflareTransitionRegionBrightening(observation),
    multifractalFlareMemory(observation),
    polarimetricFaradayPath(observation),
  ];
  const allowed = residualAllowed(metrics, observation);
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
    primary_physics_pass: primary.some((metric) => metric.status === "pass") && primary.every((metric) => metric.status !== "fail"),
    speculative_residual_allowed: allowed,
    mismatch_fingerprint: metrics.map((metric) => `${metric.id}:${metric.status}`).join("|"),
  };
}
