import type {
  StarSimSolarBaselinePhase,
  StarSimSolarObservedLane,
} from "./contract";

export const STAR_SIM_SOLAR_BENCHMARK_REGISTRY_VERSION = "starsim-solar-benchmarks/15" as const;
export const STAR_SIM_SOLAR_BASELINE_DOMAIN_ID = "solar_observed_baseline_v1" as const;

export interface StarSimSolarBenchmarkPackSpec {
  id: StarSimSolarBaselinePhase;
  label: string;
  domain_id: typeof STAR_SIM_SOLAR_BASELINE_DOMAIN_ID;
  support_mode: "observed_baseline_scaffold";
  benchmark_family_ids: string[];
  required_sections: string[];
  optional_sections: string[];
  quality_checks: string[];
  conceptual_lanes: StarSimSolarObservedLane[];
  notes: string[];
}

const SOLAR_BENCHMARK_PACKS: Record<StarSimSolarBaselinePhase, StarSimSolarBenchmarkPackSpec> = {
  solar_interior_closure_v1: {
    id: "solar_interior_closure_v1",
    label: "Solar interior closure scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_interior_closure_v1"],
    required_sections: [
      "solar_interior_profile",
      "solar_layer_boundaries",
      "solar_global_modes",
      "solar_neutrino_constraints",
    ],
    optional_sections: ["solar_local_helio", "solar_granulation_stats"],
    quality_checks: [
      "convection_zone_depth",
      "envelope_helium_fraction",
      "low_degree_mode_support",
      "neutrino_constraint_vector",
    ],
    conceptual_lanes: ["helioseismology_solar_observed"],
    notes: [
      "Phase 0 closure is limited to interior profiles, layer boundaries, low-degree helioseismology, and neutrino constraints.",
      "This pack is observationally literate but does not imply full inversion, 3D MHD, or corona closure.",
    ],
  },
  solar_structural_residual_closure_v1: {
    id: "solar_structural_residual_closure_v1",
    label: "Solar structural-residual closure scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_structural_residual_closure_v1"],
    required_sections: ["solar_structural_residuals"],
    optional_sections: ["solar_interior_profile", "solar_global_modes", "solar_neutrino_constraints"],
    quality_checks: [
      "hydrostatic_balance_context",
      "sound_speed_residual_context",
      "rotation_residual_context",
      "pressure_scale_height_continuity_context",
      "neutrino_seismic_consistency_context",
      "residual_metadata_coherence_context",
    ],
    conceptual_lanes: ["helioseismology_solar_observed"],
    notes: [
      "Structural residual closure is compact observed/assimilated evidence only and does not imply a live inversion engine or full-Sun solver closure.",
    ],
  },
  solar_cycle_observed_v1: {
    id: "solar_cycle_observed_v1",
    label: "Solar cycle observed baseline scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_cycle_observed_v1"],
    required_sections: ["solar_cycle_indices", "solar_cycle_history", "solar_magnetogram", "solar_active_regions"],
    optional_sections: ["solar_irradiance_series"],
    quality_checks: [
      "cycle_indices",
      "chronology_window",
      "polarity_reversal_context",
      "butterfly_history",
      "axial_dipole_history",
      "magnetogram_context",
      "active_region_context",
      "irradiance_continuity",
    ],
    conceptual_lanes: ["solar_cycle_observed", "magnetism_surface_flux_transport"],
    notes: [
      "Cycle context is observational only in this phase and is intended to host sunspot, F10.7, magnetogram, polarity, and Hale-aware chronology context.",
    ],
  },
  solar_eruptive_catalog_v1: {
    id: "solar_eruptive_catalog_v1",
    label: "Solar eruptive observed baseline scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_eruptive_catalog_v1"],
    required_sections: ["solar_flare_catalog", "solar_cme_catalog", "solar_irradiance_series"],
    optional_sections: ["solar_active_regions", "solar_magnetogram"],
    quality_checks: [
      "flare_catalog",
      "cme_catalog",
      "irradiance_continuity",
      "source_region_linkage",
    ],
    conceptual_lanes: ["eruptive_activity_observed"],
    notes: [
      "Eruptive context is catalog-backed in this phase and does not claim flare or CME prediction capability.",
    ],
  },
  solar_local_helio_observed_v1: {
    id: "solar_local_helio_observed_v1",
    label: "Solar local helioseismology observed scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_local_helio_observed_v1"],
    required_sections: ["solar_local_helio"],
    optional_sections: ["solar_global_modes", "solar_flare_catalog", "solar_active_regions", "solar_magnetogram"],
    quality_checks: [
      "dopplergram_context",
      "travel_time_or_holography_context",
      "sunquake_event_context",
    ],
    conceptual_lanes: ["helioseismology_solar_observed"],
    notes: [
      "Local helioseismology context is observational only in this phase and does not imply inversion closure or causal sunquake attribution.",
    ],
  },
  solar_surface_flow_observed_v1: {
    id: "solar_surface_flow_observed_v1",
    label: "Solar surface-flow observed scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_surface_flow_observed_v1"],
    required_sections: ["solar_surface_flows", "solar_active_regions"],
    optional_sections: ["solar_magnetogram", "solar_cycle_history"],
    quality_checks: [
      "differential_rotation_context",
      "meridional_flow_context",
      "active_region_geometry_context",
      "surface_transport_proxy_context",
    ],
    conceptual_lanes: ["magnetism_surface_flux_transport", "solar_cycle_observed"],
    notes: [
      "Surface-flow context is observational only in this phase and does not imply flux-transport, Babcock-Leighton, or predictive dynamo closure.",
    ],
  },
  solar_coronal_field_observed_v1: {
    id: "solar_coronal_field_observed_v1",
    label: "Solar coronal magnetic-field observed/proxy scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_coronal_field_observed_v1"],
    required_sections: ["solar_coronal_field", "solar_magnetogram"],
    optional_sections: ["solar_active_regions", "solar_event_linkage"],
    quality_checks: [
      "pfss_context",
      "synoptic_boundary_context",
      "open_field_topology_context",
      "source_region_linkage_context",
      "metadata_coherence_context",
      "euv_coronal_context",
    ],
    conceptual_lanes: ["eruptive_activity_observed", "solar_cycle_observed", "magnetism_surface_flux_transport"],
    notes: [
      "Coronal-field context is observational/proxy only in this phase and does not imply NLFFF, MHD, CME propagation, or predictive eruptive closure.",
    ],
  },
  solar_magnetic_memory_observed_v1: {
    id: "solar_magnetic_memory_observed_v1",
    label: "Solar magnetic-memory observed scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_magnetic_memory_observed_v1"],
    required_sections: ["solar_magnetic_memory", "solar_active_regions"],
    optional_sections: ["solar_cycle_history", "solar_surface_flows", "solar_magnetogram"],
    quality_checks: [
      "axial_dipole_continuity_context",
      "polar_field_continuity_context",
      "reversal_linkage_context",
      "active_region_polarity_ordering_context",
      "hemisphere_bipolar_coverage_context",
      "bipolar_region_proxy_context",
    ],
    conceptual_lanes: ["magnetism_surface_flux_transport", "solar_cycle_observed"],
    notes: [
      "Magnetic-memory context is observational only in this phase and does not imply flux-transport, Babcock-Leighton, or predictive dynamo closure.",
    ],
  },
  solar_spot_region_observed_v1: {
    id: "solar_spot_region_observed_v1",
    label: "Solar sunspot and bipolar-region observed scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_spot_region_observed_v1"],
    required_sections: ["solar_sunspot_catalog", "solar_active_regions"],
    optional_sections: ["solar_magnetogram", "solar_surface_flows", "solar_magnetic_memory"],
    quality_checks: [
      "sunspot_catalog_context",
      "spot_geometry_context",
      "spot_region_linkage_context",
      "bipolar_grouping_context",
      "polarity_tilt_context",
    ],
    conceptual_lanes: ["solar_cycle_observed", "magnetism_surface_flux_transport"],
    notes: [
      "Sunspot and bipolar-region context is observational only in this phase and does not imply spot-evolution modeling, predictive transport, or dynamo closure.",
    ],
  },
  solar_event_association_observed_v1: {
    id: "solar_event_association_observed_v1",
    label: "Solar event-association observed scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_event_association_observed_v1"],
    required_sections: ["solar_event_linkage", "solar_active_regions", "solar_flare_catalog", "solar_cme_catalog"],
    optional_sections: ["solar_local_helio", "solar_magnetogram"],
    quality_checks: [
      "flare_region_linkage_context",
      "cme_region_linkage_context",
      "sunquake_flare_region_linkage_context",
      "event_chronology_alignment_context",
      "region_identifier_consistency_context",
    ],
    conceptual_lanes: ["eruptive_activity_observed", "solar_cycle_observed"],
    notes: [
      "Event-association context is observational only in this phase and does not imply flare prediction, CME initiation, or causal sunquake closure.",
    ],
  },
  solar_topology_linkage_observed_v1: {
    id: "solar_topology_linkage_observed_v1",
    label: "Solar topology-linkage observed scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_topology_linkage_observed_v1"],
    required_sections: ["solar_topology_linkage", "solar_coronal_field", "solar_magnetic_memory", "solar_active_regions"],
    optional_sections: ["solar_sunspot_catalog", "solar_event_linkage", "solar_flare_catalog", "solar_cme_catalog"],
    quality_checks: [
      "spot_region_corona_context",
      "open_flux_polar_field_continuity_context",
      "event_topology_context",
      "topology_role_context",
      "chronology_alignment_context",
      "identifier_consistency_context",
    ],
    conceptual_lanes: ["eruptive_activity_observed", "solar_cycle_observed", "magnetism_surface_flux_transport"],
    notes: [
      "Topology-linkage context is observational/proxy only in this phase and does not imply NLFFF, MHD, predictive transport, or eruptive prediction.",
    ],
  },
  solar_cross_layer_consistency_v1: {
    id: "solar_cross_layer_consistency_v1",
    label: "Solar cross-layer consistency scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_cross_layer_consistency_v1"],
    required_sections: [
      "solar_interior_profile",
      "solar_global_modes",
      "solar_structural_residuals",
      "solar_cycle_history",
      "solar_magnetic_memory",
      "solar_coronal_field",
      "solar_active_regions",
      "solar_event_linkage",
      "solar_topology_linkage",
    ],
    optional_sections: [
      "solar_magnetogram",
      "solar_sunspot_catalog",
      "solar_flare_catalog",
      "solar_cme_catalog",
    ],
    quality_checks: [
      "interior_residual_coherence",
      "mode_residual_coherence",
      "rotation_residual_coherence",
      "cycle_memory_topology_coherence",
      "event_topology_identifier_coherence",
      "chronology_metadata_alignment",
    ],
    conceptual_lanes: ["helioseismology_solar_observed", "solar_cycle_observed", "eruptive_activity_observed", "magnetism_surface_flux_transport"],
    notes: [
      "Cross-layer consistency hardens the existing Sun baseline by checking whether interior, residual, cycle-memory, coronal, and event-linkage layers remain mutually coherent.",
      "This phase reuses existing observational sections only and does not imply predictive transport, NLFFF, MHD, or full-Sun solver closure.",
    ],
  },
};

export const getSolarBenchmarkPackById = (
  benchmarkPackId: string,
): StarSimSolarBenchmarkPackSpec | null => SOLAR_BENCHMARK_PACKS[benchmarkPackId as StarSimSolarBaselinePhase] ?? null;

export const listSolarBenchmarkPacks = (): StarSimSolarBenchmarkPackSpec[] =>
  Object.values(SOLAR_BENCHMARK_PACKS).map((entry) => ({
    ...entry,
    benchmark_family_ids: [...entry.benchmark_family_ids],
    required_sections: [...entry.required_sections],
    optional_sections: [...entry.optional_sections],
    quality_checks: [...entry.quality_checks],
    conceptual_lanes: [...entry.conceptual_lanes],
    notes: [...entry.notes],
  }));
