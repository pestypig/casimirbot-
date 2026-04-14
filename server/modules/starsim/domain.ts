import type {
  CanonicalStar,
  PhysicsFlagValue,
  StarSimRequest,
  StarSimSolarBaselinePhase,
  StarSimSolarBaselineSupport,
  StarSimSupportedDomain,
  StarSimSupportedDomainReason,
} from "./contract";
import {
  getSolarBenchmarkPackById,
  STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
} from "./solar-benchmarks";
import {
  collectSolarCycleBlockingReasons,
  collectSolarCrossLayerConsistencyBlockingReasons,
  collectSolarClosureBlockingReasons,
  collectSolarCoronalFieldBlockingReasons,
  collectSolarEruptiveBlockingReasons,
  collectSolarEventLinkageBlockingReasons,
  collectSolarLocalHelioBlockingReasons,
  collectSolarMagneticMemoryBlockingReasons,
  collectSolarSpotRegionBlockingReasons,
  collectSolarStructuralResidualBlockingReasons,
  collectSolarSurfaceFlowBlockingReasons,
  collectSolarTopologyLinkageBlockingReasons,
  evaluateSolarCycleObservedDiagnostics,
  evaluateSolarCrossLayerConsistencyDiagnostics,
  evaluateSolarCoronalFieldDiagnostics,
  evaluateSolarInteriorClosureDiagnostics,
  evaluateSolarEruptiveCatalogDiagnostics,
  evaluateSolarEventLinkageDiagnostics,
  evaluateSolarLocalHelioDiagnostics,
  evaluateSolarMagneticMemoryDiagnostics,
  evaluateSolarSpotRegionDiagnostics,
  evaluateSolarStructuralResidualDiagnostics,
  evaluateSolarSurfaceFlowDiagnostics,
  evaluateSolarTopologyLinkageDiagnostics,
} from "./solar-diagnostics";
import { getSolarReferencePackIdentity } from "./solar-reference-anchors";

export const STAR_SIM_SUPPORTED_DOMAIN_ID = "solar_like_main_sequence_live";
export const STAR_SIM_SUPPORTED_DOMAIN_VERSION = "star-sim-domain/1";
export const STAR_SIM_SOLAR_BASELINE_DOMAIN_VERSION = "star-sim-solar-domain/15";

type SupportedLiveLane = "structure_mesa" | "oscillation_gyre";

const DEFAULT_FIT_PROFILES: Record<SupportedLiveLane, string> = {
  structure_mesa: "solar_like_observable_fit_v1",
  oscillation_gyre: "solar_like_seismic_compare_v1",
};

const DEFAULT_FIT_CONSTRAINTS: Record<SupportedLiveLane, Record<string, PhysicsFlagValue>> = {
  structure_mesa: {
    helium_prior: "solar_scaled",
    mixing_length_alpha_min: 1.6,
    mixing_length_alpha_max: 2.2,
    age_max_gyr: 12.5,
  },
  oscillation_gyre: {
    mode_matching: "solar_like_global",
    max_mode_degree_l: 3,
    frequency_window_uHz: 250,
  },
};

const DEFAULT_BENCHMARK_PACKS: Record<SupportedLiveLane, string> = {
  structure_mesa: "solar_like_structure_fit_pack_v1",
  oscillation_gyre: "solar_like_seismic_compare_pack_v1",
};

const hasNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const mergeConstraints = (
  lane: SupportedLiveLane,
  star: CanonicalStar,
): Record<string, PhysicsFlagValue> => ({
  ...DEFAULT_FIT_CONSTRAINTS[lane],
  ...star.fit_constraints,
});

const inRange = (value: number | null, min: number, max: number): boolean =>
  value !== null && value >= min && value <= max;

const collectBaseReasons = (star: CanonicalStar): StarSimSupportedDomainReason[] => {
  const reasons = new Set<StarSimSupportedDomainReason>();
  const teff = hasNumber(star.fields.spectroscopy.teff_K.value) ? star.fields.spectroscopy.teff_K.value : null;
  const logg = hasNumber(star.fields.spectroscopy.logg_cgs.value) ? star.fields.spectroscopy.logg_cgs.value : null;
  const feh = hasNumber(star.fields.spectroscopy.metallicity_feh.value)
    ? star.fields.spectroscopy.metallicity_feh.value
    : null;
  const vsini = hasNumber(star.fields.spectroscopy.vsini_kms.value) ? star.fields.spectroscopy.vsini_kms.value : null;
  const radius = hasNumber(star.fields.structure.radius_Rsun.value) ? star.fields.structure.radius_Rsun.value : null;
  const mass = hasNumber(star.fields.structure.mass_Msun.value) ? star.fields.structure.mass_Msun.value : null;
  const luminosityClass = star.target.luminosity_class?.trim().toUpperCase() ?? null;
  const spectralType = star.target.spectral_type?.trim().toUpperCase() ?? null;

  if (luminosityClass && luminosityClass !== "V") {
    reasons.add("unsupported_evolutionary_state");
  }
  if (logg !== null && logg < 4.0) {
    reasons.add("unsupported_evolutionary_state");
  }
  if (radius !== null && radius > 1.7) {
    reasons.add("unsupported_evolutionary_state");
  }

  const solarLikeBySpectralType = spectralType?.startsWith("G") || spectralType?.startsWith("F9") || spectralType?.startsWith("K0");
  const solarLikeByTeff = teff !== null && teff >= 5_300 && teff <= 6_200;
  if (!solarLikeBySpectralType && !solarLikeByTeff) {
    reasons.add("out_of_supported_domain");
  }
  if (feh !== null && (feh < -0.6 || feh > 0.5)) {
    reasons.add("out_of_supported_domain");
  }
  if (vsini !== null && vsini > 30) {
    reasons.add("out_of_supported_domain");
  }
  if (mass !== null && (mass < 0.8 || mass > 1.25)) {
    reasons.add("out_of_supported_domain");
  }

  return [...reasons];
};

const hasStructureObservables = (star: CanonicalStar): boolean => {
  const teff = hasNumber(star.fields.spectroscopy.teff_K.value);
  const feh = hasNumber(star.fields.spectroscopy.metallicity_feh.value);
  const logg = hasNumber(star.fields.spectroscopy.logg_cgs.value);
  const radius = hasNumber(star.fields.structure.radius_Rsun.value);
  return teff && feh && (logg || radius);
};

const hasSeismicObservables = (star: CanonicalStar): boolean =>
  hasNumber(star.fields.asteroseismology.numax_uHz.value)
  || hasNumber(star.fields.asteroseismology.deltanu_uHz.value)
  || hasNumber(star.fields.asteroseismology.mode_count.value);

export const evaluateStarSimSupportedDomain = (
  star: CanonicalStar,
  lane: SupportedLiveLane,
): StarSimSupportedDomain => {
  const reasons = new Set<StarSimSupportedDomainReason>(collectBaseReasons(star));
  const notes: string[] = [
    "Live fitting is currently limited to solar-like main-sequence stars with constrained observable-driven inference.",
  ];
  const requiredObservables =
    lane === "structure_mesa"
      ? ["spectroscopy.teff_K", "spectroscopy.metallicity_feh", "spectroscopy.logg_cgs|structure.radius_Rsun"]
      : ["asteroseismology.numax_uHz|asteroseismology.deltanu_uHz|asteroseismology.mode_count"];
  const optionalObservables =
    lane === "structure_mesa"
      ? ["structure.mass_Msun", "structure.age_Gyr", "asteroseismology.numax_uHz", "asteroseismology.deltanu_uHz"]
      : ["asteroseismology.mode_frequencies_uHz", "spectroscopy.teff_K", "spectroscopy.logg_cgs"];

  if (lane === "structure_mesa" && !hasStructureObservables(star)) {
    reasons.add("insufficient_observables");
  }
  if (lane === "oscillation_gyre" && !hasSeismicObservables(star)) {
    reasons.add("seismology_required");
  }

  if (reasons.has("unsupported_evolutionary_state")) {
    notes.push("The declared live fitting domain excludes giants and low-gravity/subgiant-like cases.");
  }
  if (reasons.has("out_of_supported_domain")) {
    notes.push("The target sits outside the current near-solar temperature, metallicity, rotation, or mass envelope.");
  }
  if (reasons.has("insufficient_observables")) {
    notes.push("The current constrained fit requires Teff, [Fe/H], and either log g or radius.");
  }
  if (reasons.has("seismology_required")) {
    notes.push("The oscillation comparison lane requires asteroseismic summary inputs.");
  }

  return {
    id: STAR_SIM_SUPPORTED_DOMAIN_ID,
    version: STAR_SIM_SUPPORTED_DOMAIN_VERSION,
    lane_id: lane,
    passed: reasons.size === 0,
    reasons: [...reasons],
    required_observables: requiredObservables,
    optional_observables: optionalObservables,
    fit_profile_id: star.fit_profile_id ?? DEFAULT_FIT_PROFILES[lane],
    fit_constraints_applied: mergeConstraints(lane, star),
    benchmark_pack_id: DEFAULT_BENCHMARK_PACKS[lane],
    notes,
  };
};

const isSolarObservedRequest = (request: StarSimRequest): boolean => {
  const objectId = request.target?.object_id?.trim().toLowerCase();
  const name = request.target?.name?.trim().toLowerCase();
  return objectId === "sun" || objectId === "sol" || name === "sun" || name === "sol" || request.orbital_context?.naif_body_id === 10;
};

const solarMissingReasonBySection: Record<string, StarSimSupportedDomainReason> = {
  solar_interior_profile: "solar_interior_profile_missing",
  solar_layer_boundaries: "solar_layer_boundaries_missing",
  solar_global_modes: "solar_global_modes_missing",
  solar_structural_residuals: "solar_structural_residuals_missing",
  solar_local_helio: "solar_local_helio_missing",
  solar_neutrino_constraints: "solar_neutrino_constraints_missing",
  solar_cycle_indices: "solar_cycle_indices_missing",
  solar_cycle_history: "solar_cycle_history_missing",
  solar_magnetic_memory: "solar_magnetic_memory_missing",
  solar_magnetogram: "solar_magnetogram_missing",
  solar_surface_flows: "solar_surface_flows_missing",
  solar_coronal_field: "solar_coronal_field_missing",
  solar_sunspot_catalog: "solar_sunspot_catalog_missing",
  solar_event_linkage: "solar_event_linkage_missing",
  solar_topology_linkage: "solar_topology_linkage_missing",
  solar_flare_catalog: "solar_flare_catalog_missing",
  solar_cme_catalog: "solar_cme_catalog_missing",
  solar_irradiance_series: "solar_irradiance_series_missing",
};

const getPresentSolarSections = (request: StarSimRequest): string[] =>
  Object.entries(request.solar_baseline ?? {})
    .filter(([key, value]) => key !== "schema_version" && value !== undefined)
    .map(([key]) => key)
    .sort((left, right) => left.localeCompare(right));

export const evaluateSolarObservedBaseline = (
  request: StarSimRequest,
  phase: StarSimSolarBaselinePhase,
): StarSimSolarBaselineSupport => {
  const benchmarkPack = getSolarBenchmarkPackById(phase);
  const solarReferencePack = getSolarReferencePackIdentity();
  const presentSections = getPresentSolarSections(request);
  const reasons = new Set<StarSimSupportedDomainReason>();
  const notes: string[] = [
    "The solar observed baseline is a Sun-only observational scaffold and does not imply full-Sun physics closure.",
  ];

  if (!benchmarkPack) {
    throw new Error(`Unknown solar observed benchmark pack: ${phase}`);
  }

  if (!isSolarObservedRequest(request)) {
    reasons.add("solar_target_required");
    notes.push("This baseline domain is reserved for the Sun (object_id/name sun|sol or NAIF body 10).");
  }

  for (const section of benchmarkPack.required_sections) {
    if (!presentSections.includes(section)) {
      reasons.add(solarMissingReasonBySection[section] ?? "insufficient_observables");
    }
  }

  const closureDiagnostics =
    phase === "solar_interior_closure_v1"
      ? evaluateSolarInteriorClosureDiagnostics(request)
      : undefined;
  const structuralResidualDiagnostics =
    phase === "solar_structural_residual_closure_v1"
      ? evaluateSolarStructuralResidualDiagnostics(request)
      : undefined;
  const cycleDiagnostics =
    phase === "solar_cycle_observed_v1"
      ? evaluateSolarCycleObservedDiagnostics(request)
      : undefined;
  const eruptiveDiagnostics =
    phase === "solar_eruptive_catalog_v1"
      ? evaluateSolarEruptiveCatalogDiagnostics(request)
      : undefined;
  const localHelioDiagnostics =
    phase === "solar_local_helio_observed_v1"
      ? evaluateSolarLocalHelioDiagnostics(request)
      : undefined;
  const surfaceFlowDiagnostics =
    phase === "solar_surface_flow_observed_v1"
      ? evaluateSolarSurfaceFlowDiagnostics(request)
      : undefined;
  const coronalFieldDiagnostics =
    phase === "solar_coronal_field_observed_v1"
      ? evaluateSolarCoronalFieldDiagnostics(request)
      : undefined;
  const magneticMemoryDiagnostics =
    phase === "solar_magnetic_memory_observed_v1"
      ? evaluateSolarMagneticMemoryDiagnostics(request)
      : undefined;
  const spotRegionDiagnostics =
    phase === "solar_spot_region_observed_v1"
      ? evaluateSolarSpotRegionDiagnostics(request)
      : undefined;
  const eventLinkageDiagnostics =
    phase === "solar_event_association_observed_v1"
      ? evaluateSolarEventLinkageDiagnostics(request)
      : undefined;
  const topologyLinkageDiagnostics =
    phase === "solar_topology_linkage_observed_v1"
      ? evaluateSolarTopologyLinkageDiagnostics(request)
      : undefined;
  const crossLayerConsistencyDiagnostics =
    phase === "solar_cross_layer_consistency_v1"
      ? evaluateSolarCrossLayerConsistencyDiagnostics(request)
      : undefined;
  if (closureDiagnostics) {
    for (const reason of collectSolarClosureBlockingReasons(closureDiagnostics)) {
      reasons.add(reason);
    }
    notes.push(
      `Phase 0 interior closure is anchored to ${solarReferencePack.id}@${solarReferencePack.version} for convection-zone depth, envelope helium, low-degree mode support, and neutrino vector completeness.`,
    );
    if (closureDiagnostics.overall_status === "warn") {
      notes.push("One or more interior closure checks are at warning strength; inspect closure_diagnostics for details.");
    }
  }
  if (structuralResidualDiagnostics) {
    for (const reason of collectSolarStructuralResidualBlockingReasons(structuralResidualDiagnostics)) {
      reasons.add(reason);
    }
    notes.push(
      `Solar structural residual closure is anchored to ${solarReferencePack.id}@${solarReferencePack.version} for hydrostatic-balance, sound-speed, rotation, pressure-scale-height, and residual metadata context.`,
    );
    if (structuralResidualDiagnostics.overall_status === "warn") {
      notes.push("One or more structural-residual checks are advisory-only warnings; inspect structural_residual_diagnostics for details.");
    }
  }
  if (cycleDiagnostics) {
    for (const reason of collectSolarCycleBlockingReasons(cycleDiagnostics)) {
      reasons.add(reason);
    }
    notes.push(
      `Solar cycle observed readiness is anchored to ${solarReferencePack.id}@${solarReferencePack.version} for cycle scalars, Hale-aware chronology, polarity-reversal context, butterfly history, axial-dipole history, magnetogram linkage, and active-region context.`,
    );
    if (cycleDiagnostics.overall_status === "warn") {
      notes.push("One or more cycle observed checks are advisory-only warnings; inspect cycle_diagnostics for details.");
    }
  }
  if (eruptiveDiagnostics) {
    for (const reason of collectSolarEruptiveBlockingReasons(eruptiveDiagnostics)) {
      reasons.add(reason);
    }
    notes.push(
      `Solar eruptive observed readiness is anchored to ${solarReferencePack.id}@${solarReferencePack.version} for flare coverage, CME coverage, irradiance continuity, and source-region linkage context.`,
    );
    if (eruptiveDiagnostics.overall_status === "warn") {
      notes.push("One or more eruptive catalog checks are advisory-only warnings; inspect eruptive_diagnostics for details.");
    }
  }
  if (localHelioDiagnostics) {
    for (const reason of collectSolarLocalHelioBlockingReasons(localHelioDiagnostics)) {
      reasons.add(reason);
    }
    notes.push(
      `Solar local helioseismology readiness is anchored to ${solarReferencePack.id}@${solarReferencePack.version} for Dopplergram context, travel-time or holography context, and observational sunquake-event context.`,
    );
    if (localHelioDiagnostics.overall_status === "warn") {
      notes.push("One or more local helioseismology checks are advisory-only warnings; inspect local_helio_diagnostics for details.");
    }
  }
  if (surfaceFlowDiagnostics) {
    for (const reason of collectSolarSurfaceFlowBlockingReasons(surfaceFlowDiagnostics)) {
      reasons.add(reason);
    }
    notes.push(
      `Solar surface-flow readiness is anchored to ${solarReferencePack.id}@${solarReferencePack.version} for differential rotation, meridional flow, active-region geometry, and advisory transport-proxy context.`,
    );
    if (surfaceFlowDiagnostics.overall_status === "warn") {
      notes.push("One or more surface-flow checks are advisory-only warnings; inspect surface_flow_diagnostics for details.");
    }
  }
  if (coronalFieldDiagnostics) {
    for (const reason of collectSolarCoronalFieldBlockingReasons(coronalFieldDiagnostics)) {
      reasons.add(reason);
    }
    notes.push(
      `Solar coronal-field observed readiness is anchored to ${solarReferencePack.id}@${solarReferencePack.version} for PFSS-style proxy context, synoptic boundary linkage, open-field topology, surface-to-corona linkage, and coronal metadata coherence.`,
    );
    if (coronalFieldDiagnostics.overall_status === "warn") {
      notes.push("One or more coronal-field checks are advisory-only warnings; inspect coronal_field_diagnostics for details.");
    }
  }
  if (magneticMemoryDiagnostics) {
    for (const reason of collectSolarMagneticMemoryBlockingReasons(magneticMemoryDiagnostics)) {
      reasons.add(reason);
    }
    notes.push(
      `Solar magnetic-memory readiness is anchored to ${solarReferencePack.id}@${solarReferencePack.version} for axial-dipole continuity, polar-field continuity, reversal linkage, bipolar active-region ordering, and hemisphere coverage context.`,
    );
    if (magneticMemoryDiagnostics.overall_status === "warn") {
      notes.push("One or more magnetic-memory checks are advisory-only warnings; inspect magnetic_memory_diagnostics for details.");
    }
  }
  if (spotRegionDiagnostics) {
    for (const reason of collectSolarSpotRegionBlockingReasons(spotRegionDiagnostics)) {
      reasons.add(reason);
    }
    notes.push(
      `Solar sunspot and bipolar-region readiness is anchored to ${solarReferencePack.id}@${solarReferencePack.version} for catalog presence, per-spot geometry, spot-to-region linkage, bipolar grouping, and polarity/tilt context.`,
    );
    if (spotRegionDiagnostics.overall_status === "warn") {
      notes.push("One or more spot-region checks are advisory-only warnings; inspect spot_region_diagnostics for details.");
    }
  }
  if (eventLinkageDiagnostics) {
    for (const reason of collectSolarEventLinkageBlockingReasons(eventLinkageDiagnostics)) {
      reasons.add(reason);
    }
    notes.push(
      `Solar event-association readiness is anchored to ${solarReferencePack.id}@${solarReferencePack.version} for flare linkage, CME linkage, advisory sunquake linkage, chronology alignment, and region identifier consistency.`,
    );
    if (eventLinkageDiagnostics.overall_status === "warn") {
      notes.push("One or more event-association checks are advisory-only warnings; inspect event_linkage_diagnostics for details.");
    }
  }
  if (topologyLinkageDiagnostics) {
    for (const reason of collectSolarTopologyLinkageBlockingReasons(topologyLinkageDiagnostics)) {
      reasons.add(reason);
    }
    notes.push(
      `Solar topology-linkage readiness is anchored to ${solarReferencePack.id}@${solarReferencePack.version} for spot-region-corona linkage, open-flux continuity, event-topology integrity, topology roles, chronology alignment, and identifier consistency.`,
    );
    if (topologyLinkageDiagnostics.overall_status === "warn") {
      notes.push("One or more topology-linkage checks are advisory-only warnings; inspect topology_linkage_diagnostics for details.");
    }
  }
  if (crossLayerConsistencyDiagnostics) {
    for (const reason of collectSolarCrossLayerConsistencyBlockingReasons(crossLayerConsistencyDiagnostics)) {
      reasons.add(reason);
    }
    notes.push(
      `Solar cross-layer consistency is anchored to ${solarReferencePack.id}@${solarReferencePack.version} for structural residual coherence, mode/residual pairing, magnetic-memory to topology continuity, event-to-topology identifier integrity, and chronology alignment across the observed Sun chain.`,
    );
    if (crossLayerConsistencyDiagnostics.overall_status === "warn") {
      notes.push("One or more cross-layer consistency checks are advisory-only warnings; inspect cross_layer_consistency_diagnostics for details.");
    }
  }

  notes.push(...benchmarkPack.notes);

  return {
    id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    version: STAR_SIM_SOLAR_BASELINE_DOMAIN_VERSION,
    phase_id: phase,
    passed: reasons.size === 0,
    reasons: [...reasons],
    required_sections: [...benchmarkPack.required_sections],
    optional_sections: [...benchmarkPack.optional_sections],
    present_sections: presentSections,
    benchmark_pack_id: benchmarkPack.id,
    solar_reference_pack_id: solarReferencePack.id,
    solar_reference_pack_version: solarReferencePack.version,
    conceptual_lanes: [...benchmarkPack.conceptual_lanes],
    notes,
    ...(closureDiagnostics ? { closure_diagnostics: closureDiagnostics } : {}),
    ...(structuralResidualDiagnostics ? { structural_residual_diagnostics: structuralResidualDiagnostics } : {}),
    ...(cycleDiagnostics ? { cycle_diagnostics: cycleDiagnostics } : {}),
    ...(eruptiveDiagnostics ? { eruptive_diagnostics: eruptiveDiagnostics } : {}),
    ...(localHelioDiagnostics ? { local_helio_diagnostics: localHelioDiagnostics } : {}),
    ...(surfaceFlowDiagnostics ? { surface_flow_diagnostics: surfaceFlowDiagnostics } : {}),
    ...(coronalFieldDiagnostics ? { coronal_field_diagnostics: coronalFieldDiagnostics } : {}),
    ...(magneticMemoryDiagnostics ? { magnetic_memory_diagnostics: magneticMemoryDiagnostics } : {}),
    ...(spotRegionDiagnostics ? { spot_region_diagnostics: spotRegionDiagnostics } : {}),
    ...(eventLinkageDiagnostics ? { event_linkage_diagnostics: eventLinkageDiagnostics } : {}),
    ...(topologyLinkageDiagnostics ? { topology_linkage_diagnostics: topologyLinkageDiagnostics } : {}),
    ...(crossLayerConsistencyDiagnostics ? { cross_layer_consistency_diagnostics: crossLayerConsistencyDiagnostics } : {}),
  };
};
