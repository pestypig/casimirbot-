import fs from "node:fs/promises";
import path from "node:path";
import type {
  StarSimRequest,
  StarSimSolarArtifactMetadata,
  StarSimSolarBaselineSectionId,
  StarSimSolarObservedBaseline,
  StarSimSolarObservedMode,
} from "../../contract";
import { STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION } from "../../contract";

export const STAR_SIM_SOLAR_OBSERVED_ADAPTER_VERSION = "solar_observed.scaffold/1" as const;

export interface StarSimSolarObservedAdapterInput {
  request: StarSimRequest;
  source_id: string;
  instrument?: string;
  observed_mode?: StarSimSolarObservedMode;
  time_range?: StarSimSolarArtifactMetadata["time_range"];
  cadence?: StarSimSolarArtifactMetadata["cadence"];
  coordinate_frame?: string;
  carrington_rotation?: number;
  uncertainty_note?: string;
  section_metadata_overrides?: Partial<Record<StarSimSolarBaselineSectionId, StarSimSolarArtifactMetadata>>;
  payload: Partial<Omit<StarSimSolarObservedBaseline, "schema_version">>;
}

export interface StarSimSolarObservedAdapterResult {
  adapter_version: typeof STAR_SIM_SOLAR_OBSERVED_ADAPTER_VERSION;
  attempted: boolean;
  reason: string | null;
  source_id: string;
  metadata: StarSimSolarArtifactMetadata;
  baseline_patch: StarSimSolarObservedBaseline | null;
  raw_payload?: Record<string, unknown>;
}

const FIXTURE_ROOT = path.resolve(process.cwd(), "tests", "fixtures", "starsim", "sources", "solar-observed");
const FIXTURE_FILE_ORDER = [
  "solar-interior-closure.json",
  "solar-structural-residual-observed.json",
  "solar-local-helio-observed.json",
  "solar-cycle-observed.json",
  "solar-cycle-history-observed.json",
  "solar-surface-flow-observed.json",
  "solar-coronal-field-observed.json",
  "solar-magnetic-memory-observed.json",
  "solar-sunspot-region-observed.json",
  "solar-eruptive-observed.json",
  "solar-event-linkage-observed.json",
  "solar-topology-linkage-observed.json",
] as const;
const FIXTURE_EXCLUDE_MARKERS = ["counterexample."] as const;

const isSolarTarget = (request: StarSimRequest): boolean => {
  const objectId = request.target?.object_id?.trim().toLowerCase();
  const name = request.target?.name?.trim().toLowerCase();
  return objectId === "sun" || objectId === "sol" || name === "sun" || name === "sol" || request.orbital_context?.naif_body_id === 10;
};

const normalizeMetadata = (input: StarSimSolarObservedAdapterInput): StarSimSolarArtifactMetadata => ({
  ...(input.time_range ? { time_range: input.time_range } : {}),
  ...(input.cadence ? { cadence: input.cadence } : {}),
  ...(input.coordinate_frame ? { coordinate_frame: input.coordinate_frame } : {}),
  ...(input.carrington_rotation ? { carrington_rotation: input.carrington_rotation } : {}),
  ...(input.instrument ? { instrument: input.instrument } : {}),
  observed_mode: input.observed_mode ?? "observed",
  ...(input.uncertainty_note ? { uncertainty_summary: { kind: "summary", note: input.uncertainty_note } } : {}),
});

const withSectionMetadata = <T extends { metadata?: StarSimSolarArtifactMetadata }>(
  section: T | undefined,
  metadata: StarSimSolarArtifactMetadata,
  metadataOverride?: StarSimSolarArtifactMetadata,
): T | undefined => {
  if (!section) {
    return undefined;
  }
  return {
    ...section,
    metadata: {
      ...metadata,
      ...(metadataOverride ?? {}),
      ...(section.metadata ?? {}),
    },
  };
};

export const normalizeSolarObservedBaselinePatch = (
  input: StarSimSolarObservedAdapterInput,
): StarSimSolarObservedAdapterResult => {
  const metadata = normalizeMetadata(input);
  if (!isSolarTarget(input.request)) {
    return {
      adapter_version: STAR_SIM_SOLAR_OBSERVED_ADAPTER_VERSION,
      attempted: true,
      reason: "solar_target_required",
      source_id: input.source_id,
      metadata,
      baseline_patch: null,
    };
  }

  const baselinePatch: StarSimSolarObservedBaseline = {
    schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
    ...(input.payload.solar_interior_profile
      ? {
          solar_interior_profile: withSectionMetadata(
            input.payload.solar_interior_profile,
            metadata,
            input.section_metadata_overrides?.solar_interior_profile,
          ),
        }
      : {}),
    ...(input.payload.solar_layer_boundaries
      ? {
          solar_layer_boundaries: withSectionMetadata(
            input.payload.solar_layer_boundaries,
            metadata,
            input.section_metadata_overrides?.solar_layer_boundaries,
          ),
        }
      : {}),
    ...(input.payload.solar_global_modes
      ? {
          solar_global_modes: withSectionMetadata(
            input.payload.solar_global_modes,
            metadata,
            input.section_metadata_overrides?.solar_global_modes,
          ),
        }
      : {}),
    ...(input.payload.solar_structural_residuals
      ? {
          solar_structural_residuals: withSectionMetadata(
            input.payload.solar_structural_residuals,
            metadata,
            input.section_metadata_overrides?.solar_structural_residuals,
          ),
        }
      : {}),
    ...(input.payload.solar_local_helio
      ? {
          solar_local_helio: withSectionMetadata(
            input.payload.solar_local_helio,
            metadata,
            input.section_metadata_overrides?.solar_local_helio,
          ),
        }
      : {}),
    ...(input.payload.solar_magnetogram
      ? {
          solar_magnetogram: withSectionMetadata(
            input.payload.solar_magnetogram,
            metadata,
            input.section_metadata_overrides?.solar_magnetogram,
          ),
        }
      : {}),
    ...(input.payload.solar_surface_flows
      ? {
          solar_surface_flows: withSectionMetadata(
            input.payload.solar_surface_flows,
            metadata,
            input.section_metadata_overrides?.solar_surface_flows,
          ),
        }
      : {}),
    ...(input.payload.solar_coronal_field
      ? {
          solar_coronal_field: withSectionMetadata(
            input.payload.solar_coronal_field,
            metadata,
            input.section_metadata_overrides?.solar_coronal_field,
          ),
        }
      : {}),
    ...(input.payload.solar_cycle_indices
      ? {
          solar_cycle_indices: withSectionMetadata(
            input.payload.solar_cycle_indices,
            metadata,
            input.section_metadata_overrides?.solar_cycle_indices,
          ),
        }
      : {}),
    ...(input.payload.solar_cycle_history
      ? {
          solar_cycle_history: withSectionMetadata(
            input.payload.solar_cycle_history,
            metadata,
            input.section_metadata_overrides?.solar_cycle_history,
          ),
        }
      : {}),
    ...(input.payload.solar_magnetic_memory
      ? {
          solar_magnetic_memory: withSectionMetadata(
            input.payload.solar_magnetic_memory,
            metadata,
            input.section_metadata_overrides?.solar_magnetic_memory,
          ),
        }
      : {}),
    ...(input.payload.solar_active_regions
      ? {
          solar_active_regions: withSectionMetadata(
            input.payload.solar_active_regions,
            metadata,
            input.section_metadata_overrides?.solar_active_regions,
          ),
        }
      : {}),
    ...(input.payload.solar_sunspot_catalog
      ? {
          solar_sunspot_catalog: withSectionMetadata(
            input.payload.solar_sunspot_catalog,
            metadata,
            input.section_metadata_overrides?.solar_sunspot_catalog,
          ),
        }
      : {}),
    ...(input.payload.solar_event_linkage
      ? {
          solar_event_linkage: withSectionMetadata(
            input.payload.solar_event_linkage,
            metadata,
            input.section_metadata_overrides?.solar_event_linkage,
          ),
        }
      : {}),
    ...(input.payload.solar_topology_linkage
      ? {
          solar_topology_linkage: withSectionMetadata(
            input.payload.solar_topology_linkage,
            metadata,
            input.section_metadata_overrides?.solar_topology_linkage,
          ),
        }
      : {}),
    ...(input.payload.solar_flare_catalog
      ? {
          solar_flare_catalog: withSectionMetadata(
            input.payload.solar_flare_catalog,
            metadata,
            input.section_metadata_overrides?.solar_flare_catalog,
          ),
        }
      : {}),
    ...(input.payload.solar_cme_catalog
      ? {
          solar_cme_catalog: withSectionMetadata(
            input.payload.solar_cme_catalog,
            metadata,
            input.section_metadata_overrides?.solar_cme_catalog,
          ),
        }
      : {}),
    ...(input.payload.solar_irradiance_series
      ? {
          solar_irradiance_series: withSectionMetadata(
            input.payload.solar_irradiance_series,
            metadata,
            input.section_metadata_overrides?.solar_irradiance_series,
          ),
        }
      : {}),
    ...(input.payload.solar_neutrino_constraints
      ? {
          solar_neutrino_constraints: withSectionMetadata(
            input.payload.solar_neutrino_constraints,
            metadata,
            input.section_metadata_overrides?.solar_neutrino_constraints,
          ),
        }
      : {}),
    ...(input.payload.solar_granulation_stats
      ? {
          solar_granulation_stats: withSectionMetadata(
            input.payload.solar_granulation_stats,
            metadata,
            input.section_metadata_overrides?.solar_granulation_stats,
          ),
        }
      : {}),
  };

  return {
    adapter_version: STAR_SIM_SOLAR_OBSERVED_ADAPTER_VERSION,
    attempted: true,
    reason: null,
    source_id: input.source_id,
    metadata,
    baseline_patch: baselinePatch,
    raw_payload: {
      source_id: input.source_id,
      metadata,
      payload: baselinePatch,
    },
  };
};

type SolarObservedFixtureFile = Omit<StarSimSolarObservedAdapterInput, "request">;

const sortFixtureFiles = (fileNames: string[]): string[] => {
  const priority = new Map(FIXTURE_FILE_ORDER.map((name, index) => [name, index]));
  return [...fileNames].sort((left, right) => {
    const leftPriority = priority.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = priority.get(right) ?? Number.MAX_SAFE_INTEGER;
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }
    return left.localeCompare(right);
  });
};

const readSolarObservedFixtureFiles = async (): Promise<SolarObservedFixtureFile[]> => {
  try {
    const entries = await fs.readdir(FIXTURE_ROOT, { withFileTypes: true });
    const fileNames = sortFixtureFiles(
      entries
        .filter((entry) =>
          entry.isFile()
          && entry.name.toLowerCase().endsWith(".json")
          && !FIXTURE_EXCLUDE_MARKERS.some((marker) => entry.name.toLowerCase().includes(marker)),
        )
        .map((entry) => entry.name),
    );
    const fixtures: SolarObservedFixtureFile[] = [];
    for (const fileName of fileNames) {
      const raw = await fs.readFile(path.join(FIXTURE_ROOT, fileName), "utf8");
      fixtures.push(JSON.parse(raw) as SolarObservedFixtureFile);
    }
    return fixtures;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const mergeSolarObservedResults = (
  results: StarSimSolarObservedAdapterResult[],
): StarSimSolarObservedAdapterResult | null => {
  const successful = results.filter((result) => result.baseline_patch);
  if (successful.length === 0) {
    return null;
  }

  const mergedPatch = successful.reduce<StarSimSolarObservedBaseline>(
    (accumulator, result) => ({
      ...accumulator,
      ...(result.baseline_patch as Omit<StarSimSolarObservedBaseline, "schema_version">),
    }),
    {
      schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
    },
  );

  return {
    adapter_version: STAR_SIM_SOLAR_OBSERVED_ADAPTER_VERSION,
    attempted: true,
    reason: null,
    source_id: successful.map((result) => result.source_id).join("+"),
    metadata: successful[0].metadata,
    baseline_patch: mergedPatch,
    raw_payload: {
      sources: successful.map((result) => ({
        source_id: result.source_id,
        metadata: result.metadata,
        payload: result.baseline_patch,
      })),
      merged_payload: mergedPatch,
    },
  };
};

export const resolveSolarObservedSource = async (
  request: StarSimRequest,
): Promise<StarSimSolarObservedAdapterResult> => {
  const fixtures = await readSolarObservedFixtureFiles();
  if (fixtures.length > 0) {
    const merged = mergeSolarObservedResults(
      fixtures.map((fixture) =>
        normalizeSolarObservedBaselinePatch({
          ...fixture,
          request,
        }),
      ),
    );
    if (merged) {
      return merged;
    }
  }
  return buildSolarObservedFixture(request);
};

export const buildSolarObservedFixture = (
  request: StarSimRequest,
): StarSimSolarObservedAdapterResult =>
  normalizeSolarObservedBaselinePatch({
    request,
    source_id: "solar-observed-fixture:sun-baseline",
    instrument: "fixture",
    coordinate_frame: "Carrington",
    observed_mode: "observed",
    cadence: { value: 1, unit: "day" },
    uncertainty_note: "Fixture scaffold only; not a live observatory product.",
    payload: {
      solar_cycle_indices: {
        sunspot_number: 82,
        f10_7_sfu: 155,
        cycle_label: "Cycle 25",
        polarity_label: "north_negative_south_positive",
      },
      solar_structural_residuals: {
        hydrostatic_residual_ref: "fixture:solar/structural-residuals/hydrostatic-balance",
        sound_speed_residual_ref: "fixture:solar/structural-residuals/sound-speed",
        rotation_residual_ref: "fixture:solar/structural-residuals/rotation",
        pressure_scale_height_ref: "fixture:solar/structural-residuals/pressure-scale-height",
        density_residual_ref: "fixture:solar/structural-residuals/density",
        neutrino_consistency_ref: "fixture:solar/structural-residuals/neutrino-consistency",
        summary: {
          max_sound_speed_fractional_residual: 0.0018,
          mean_hydrostatic_fractional_residual: 0.0006,
          max_rotation_residual_nhz: 8.4,
          pressure_scale_height_consistent: true,
          residual_window_label: "cycle24-25-assimilated-closure-window",
        },
      },
      solar_local_helio: {
        dopplergram_ref: "fixture:solar/local-helio/dopplergram",
        travel_time_ref: "fixture:solar/local-helio/travel-time",
        holography_ref: "fixture:solar/local-helio/holography",
        sunquake_event_refs: ["fixture:solar/local-helio/sunquake-event-1"],
      },
      solar_cycle_history: {
        history_start_iso: "2018-01-01T00:00:00.000Z",
        history_end_iso: "2025-12-31T23:59:59.000Z",
        covered_cycle_labels: ["Cycle 24", "Cycle 25"],
        polarity_reversal_dates_iso: ["2019-12-01T00:00:00.000Z", "2024-10-15T00:00:00.000Z"],
        polarity_reversal_refs: ["fixture:solar/cycle/polarity-reversal-markers"],
        butterfly_history_ref: "fixture:solar/cycle/butterfly-history",
        axial_dipole_history_ref: "fixture:solar/cycle/axial-dipole-history",
        polar_field_history_ref: "fixture:solar/cycle/polar-field-history",
      },
      solar_magnetic_memory: {
        axial_dipole_history_ref: "fixture:solar/magnetic-memory/axial-dipole-history",
        polar_field_history_ref: "fixture:solar/magnetic-memory/polar-field-history",
        polarity_reversal_refs: ["fixture:solar/magnetic-memory/polarity-reversal-markers"],
        bipolar_region_proxy_ref: "fixture:solar/magnetic-memory/bipolar-region-proxy",
        summary: {
          cycle_labels_covered: ["Cycle 24", "Cycle 25"],
          north_polarity_state: "negative",
          south_polarity_state: "positive",
          latest_axial_dipole_sign: "positive",
          reversal_marker_count: 2,
        },
      },
      solar_magnetogram: {
        line_of_sight_ref: "fixture:solar/magnetograms/los",
        synoptic_radial_map_ref: "fixture:solar/magnetograms/synoptic-radial",
        active_region_patch_refs: ["fixture:solar/active-regions/patch-1"],
      },
      solar_surface_flows: {
        differential_rotation_ref: "fixture:solar/surface-flows/differential-rotation",
        meridional_flow_ref: "fixture:solar/surface-flows/meridional-flow",
        supergranular_diffusion_ref: "fixture:solar/surface-flows/supergranular-diffusion",
        summary: {
          equatorial_rotation_deg_per_day: 14.35,
          rotation_shear_deg_per_day: 2.7,
          meridional_flow_peak_ms: 12.5,
        },
      },
      solar_coronal_field: {
        pfss_solution_ref: "fixture:solar/coronal/pfss-solution",
        synoptic_boundary_ref: "fixture:solar/coronal/synoptic-boundary",
        coronal_hole_refs: ["fixture:solar/coronal/coronal-hole-1", "fixture:solar/coronal/coronal-hole-2"],
        open_field_map_ref: "fixture:solar/coronal/open-field-map",
        euv_coronal_context_ref: "fixture:solar/coronal/euv-context",
        summary: {
          source_surface_rsun: 2.5,
          open_flux_weber: 3.4e14,
          dominant_topology: "dipolar_open_flux",
          coronal_hole_count: 2,
        },
      },
      solar_active_regions: {
        region_refs: ["fixture:solar/active-regions/ar13000", "fixture:solar/active-regions/ar13001"],
        region_count: 2,
        regions: [
          {
            region_id: "fixture:solar/active-regions/ar13000",
            noaa_region_id: "13000",
            harp_id: "HARP-13000",
            sharp_ref: "fixture:solar/active-regions/sharp-13000",
            heliographic_latitude_deg: 14.2,
            carrington_longitude_deg: 205.4,
            area_msh: 420,
            magnetic_class: "beta-gamma",
            tilt_deg: 11.5,
            leading_polarity: "negative",
            hemisphere: "north",
            following_polarity: "positive",
            bipole_separation_deg: 6.8,
            emergence_time_iso: "2025-02-14T08:15:00.000Z",
            joy_law_tilt_class: "aligned",
            linked_spot_ids: ["fixture:solar/sunspots/spot-13000-a", "fixture:solar/sunspots/spot-13000-b"],
            bipolar_group_id: "fixture:solar/bipolar-groups/group-13000",
            polarity_ordering_class: "hale-consistent",
          },
          {
            region_id: "fixture:solar/active-regions/ar13001",
            noaa_region_id: "13001",
            harp_id: "HARP-13001",
            sharp_ref: "fixture:solar/active-regions/sharp-13001",
            heliographic_latitude_deg: -10.4,
            carrington_longitude_deg: 218.9,
            area_msh: 365,
            magnetic_class: "beta",
            tilt_deg: -8.2,
            leading_polarity: "positive",
            hemisphere: "south",
            following_polarity: "negative",
            bipole_separation_deg: 5.9,
            emergence_time_iso: "2025-02-16T11:40:00.000Z",
            joy_law_tilt_class: "aligned",
            linked_spot_ids: ["fixture:solar/sunspots/spot-13001-a", "fixture:solar/sunspots/spot-13001-b"],
            bipolar_group_id: "fixture:solar/bipolar-groups/group-13001",
            polarity_ordering_class: "hale-consistent",
          },
        ],
      },
      solar_sunspot_catalog: {
        spot_refs: [
          "fixture:solar/sunspots/spot-13000-a",
          "fixture:solar/sunspots/spot-13000-b",
          "fixture:solar/sunspots/spot-13001-a",
          "fixture:solar/sunspots/spot-13001-b",
        ],
        spot_count: 4,
        bipolar_group_refs: [
          "fixture:solar/bipolar-groups/group-13000",
          "fixture:solar/bipolar-groups/group-13001",
        ],
        spots: [
          {
            spot_id: "fixture:solar/sunspots/spot-13000-a",
            linked_region_id: "fixture:solar/active-regions/noaa-13000",
            linked_noaa_region_id: "13000",
            linked_harp_id: "HARP-13000",
            hemisphere: "north",
            heliographic_latitude_deg: 14.1,
            carrington_longitude_deg: 205.1,
            area_msh: 180,
            polarity: "negative",
            umbra_area_msh: 62,
            penumbra_area_msh: 118,
            magnetic_class: "beta-gamma",
            bipolar_group_id: "fixture:solar/bipolar-groups/group-13000",
            emergence_time_iso: "2025-02-14T08:10:00.000Z",
          },
          {
            spot_id: "fixture:solar/sunspots/spot-13000-b",
            linked_region_id: "fixture:solar/active-regions/ar13000",
            linked_noaa_region_id: "13000",
            linked_harp_id: "HARP-13000",
            hemisphere: "north",
            heliographic_latitude_deg: 14.4,
            carrington_longitude_deg: 206.0,
            area_msh: 150,
            polarity: "positive",
            umbra_area_msh: 51,
            penumbra_area_msh: 99,
            magnetic_class: "beta-gamma",
            bipolar_group_id: "fixture:solar/bipolar-groups/group-13000",
            emergence_time_iso: "2025-02-14T08:22:00.000Z",
          },
          {
            spot_id: "fixture:solar/sunspots/spot-13001-a",
            linked_region_id: "fixture:solar/active-regions/ar13001",
            linked_noaa_region_id: "13001",
            linked_harp_id: "HARP-13001",
            hemisphere: "south",
            heliographic_latitude_deg: -9.8,
            carrington_longitude_deg: 218.4,
            area_msh: 135,
            polarity: "positive",
            umbra_area_msh: 44,
            penumbra_area_msh: 91,
            magnetic_class: "beta",
            bipolar_group_id: "fixture:solar/bipolar-groups/group-13001",
            emergence_time_iso: "2025-02-16T11:30:00.000Z",
          },
          {
            spot_id: "fixture:solar/sunspots/spot-13001-b",
            linked_region_id: "fixture:solar/active-regions/ar13001",
            linked_noaa_region_id: "13001",
            linked_harp_id: "HARP-13001",
            hemisphere: "south",
            heliographic_latitude_deg: -10.1,
            carrington_longitude_deg: 219.2,
            area_msh: 120,
            polarity: "negative",
            umbra_area_msh: 38,
            penumbra_area_msh: 82,
            magnetic_class: "beta",
            bipolar_group_id: "fixture:solar/bipolar-groups/group-13001",
            emergence_time_iso: "2025-02-16T11:44:00.000Z",
          },
        ],
        summary: {
          total_area_msh: 585,
          mean_absolute_latitude_deg: 12.1,
          bipolar_group_count: 2,
        },
      },
      solar_event_linkage: {
        link_refs: [
          "fixture:solar/event-linkage/flare-region-link-1",
          "fixture:solar/event-linkage/cme-region-link-1",
          "fixture:solar/event-linkage/sunquake-link-1",
        ],
        links: [
          {
            linked_region_id: "fixture:solar/active-regions/ar13000",
            linked_noaa_region_id: "13000",
            linked_harp_id: "HARP-13000",
            event_type: "flare",
            event_ref: "fixture:solar/flares/goes-event-1",
            linkage_basis: "manual_catalog_association",
            event_time_iso: "2025-02-15T03:10:00.000Z",
          },
          {
            linked_region_id: "fixture:solar/active-regions/ar13000",
            linked_noaa_region_id: "13000",
            linked_harp_id: "HARP-13000",
            event_type: "cme",
            event_ref: "fixture:solar/cmes/lasco-event-1",
            linkage_basis: "catalog",
            event_time_iso: "2025-02-15T03:58:00.000Z",
            time_offset_minutes: 48,
          },
          {
            linked_region_id: "fixture:solar/active-regions/ar13000",
            linked_noaa_region_id: "13000",
            linked_harp_id: "HARP-13000",
            linked_flare_event_ref: "fixture:solar/flares/goes-event-1",
            event_type: "sunquake",
            event_ref: "fixture:solar/local-helio/sunquake-event-1",
            linkage_basis: "spatiotemporal",
            event_time_iso: "2025-02-15T03:16:00.000Z",
            time_offset_minutes: 6,
          },
        ],
        summary: {
          flare_link_count: 1,
          cme_link_count: 1,
          sunquake_link_count: 1,
        },
      },
      solar_topology_linkage: {
        link_refs: [
          "fixture:solar/topology-linkage/region-13000-open-flux",
          "fixture:solar/topology-linkage/region-13001-memory-continuity",
        ],
        link_count: 2,
        links: [
          {
            link_id: "fixture:solar/topology-linkage/region-13000-open-flux",
            linked_spot_ids: [
              "fixture:solar/sunspots/spot-13000-a",
              "fixture:solar/sunspots/spot-13000-b",
            ],
            linked_region_id: "fixture:solar/active-regions/ar13000",
            linked_noaa_region_id: "13000",
            linked_harp_id: "HARP-13000",
            linked_pfss_solution_ref: "fixture:solar/coronal/pfss-solution-2290",
            linked_open_field_map_ref: "fixture:solar/coronal/open-field-map-2290",
            linked_coronal_hole_refs: [
              "fixture:solar/coronal/coronal-hole-north-2290",
              "fixture:solar/coronal/coronal-hole-south-2290",
            ],
            linked_flare_refs: ["fixture:solar/flares/goes-2025-001"],
            linked_cme_refs: ["fixture:solar/cmes/lasco-2025-001"],
            linked_polar_field_ref: "fixture:solar/magnetic-memory/polar-field-history",
            linked_axial_dipole_ref: "fixture:solar/magnetic-memory/axial-dipole-history",
            topology_role: "active_region_open_flux_source",
            linkage_basis: "manual_catalog_association",
            time_window_start: "2025-02-15T02:45:00.000Z",
            time_window_end: "2025-02-15T04:15:00.000Z",
          },
          {
            link_id: "fixture:solar/topology-linkage/region-13001-memory-continuity",
            linked_spot_ids: [
              "fixture:solar/sunspots/spot-13001-a",
              "fixture:solar/sunspots/spot-13001-b",
            ],
            linked_region_id: "fixture:solar/active-regions/noaa-13001",
            linked_noaa_region_id: "13001",
            linked_harp_id: "HARP-13001",
            linked_pfss_solution_ref: "fixture:solar/coronal/pfss-solution-2290",
            linked_open_field_map_ref: "fixture:solar/coronal/open-field-map-2290",
            linked_coronal_hole_refs: ["fixture:solar/coronal/coronal-hole-south-2290"],
            linked_polar_field_ref: "fixture:solar/magnetic-memory/polar-field-history",
            linked_axial_dipole_ref: "fixture:solar/magnetic-memory/axial-dipole-history",
            topology_role: "bipolar_memory_continuity",
            linkage_basis: "region_id_match",
            time_window_start: "2025-02-16T10:30:00.000Z",
            time_window_end: "2025-02-16T12:30:00.000Z",
          },
        ],
        summary: {
          topology_role_count: 2,
          open_flux_link_count: 2,
          event_link_count: 1,
        },
      },
      solar_flare_catalog: {
        event_refs: ["fixture:solar/flares/goes-event-1"],
        source_region_refs: ["fixture:solar/active-regions/noaa-13000"],
        flare_count: 1,
        strongest_goes_class: "M1.2",
      },
      solar_cme_catalog: {
        event_refs: ["fixture:solar/cmes/lasco-event-1"],
        source_region_refs: ["fixture:solar/active-regions/noaa-13000"],
        cme_count: 1,
      },
      solar_irradiance_series: {
        tsi_ref: "fixture:solar/tsi",
        euv_ref: "fixture:solar/euv",
        xray_ref: "fixture:solar/goes-xray",
      },
    },
  });
