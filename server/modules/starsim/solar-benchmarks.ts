import type {
  StarSimSolarBaselinePhase,
  StarSimSolarObservedLane,
} from "./contract";

export const STAR_SIM_SOLAR_BENCHMARK_REGISTRY_VERSION = "starsim-solar-benchmarks/5" as const;
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
  solar_cycle_observed_v1: {
    id: "solar_cycle_observed_v1",
    label: "Solar cycle observed baseline scaffold",
    domain_id: STAR_SIM_SOLAR_BASELINE_DOMAIN_ID,
    support_mode: "observed_baseline_scaffold",
    benchmark_family_ids: ["solar_cycle_observed_v1"],
    required_sections: ["solar_cycle_indices", "solar_magnetogram", "solar_active_regions"],
    optional_sections: ["solar_irradiance_series"],
    quality_checks: [
      "cycle_indices",
      "magnetogram_context",
      "active_region_context",
      "irradiance_continuity",
    ],
    conceptual_lanes: ["solar_cycle_observed", "magnetism_surface_flux_transport"],
    notes: [
      "Cycle context is observational only in this phase and is intended to host sunspot, F10.7, magnetogram, and polarity context.",
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
