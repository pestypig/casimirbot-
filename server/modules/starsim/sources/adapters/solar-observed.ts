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
  "solar-cycle-observed.json",
  "solar-eruptive-observed.json",
] as const;

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
    ...(input.payload.solar_cycle_indices
      ? {
          solar_cycle_indices: withSectionMetadata(
            input.payload.solar_cycle_indices,
            metadata,
            input.section_metadata_overrides?.solar_cycle_indices,
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
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
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
      solar_magnetogram: {
        line_of_sight_ref: "fixture:solar/magnetograms/los",
        synoptic_radial_map_ref: "fixture:solar/magnetograms/synoptic-radial",
        active_region_patch_refs: ["fixture:solar/active-regions/patch-1"],
      },
      solar_active_regions: {
        region_refs: ["fixture:solar/active-regions/ar13000"],
        region_count: 1,
      },
      solar_flare_catalog: {
        event_refs: ["fixture:solar/flares/goes-event-1"],
        source_region_refs: ["fixture:solar/active-regions/ar13000"],
        flare_count: 1,
        strongest_goes_class: "M1.2",
      },
      solar_cme_catalog: {
        event_refs: ["fixture:solar/cmes/lasco-event-1"],
        source_region_refs: ["fixture:solar/active-regions/ar13000"],
        cme_count: 1,
      },
      solar_irradiance_series: {
        tsi_ref: "fixture:solar/tsi",
        euv_ref: "fixture:solar/euv",
        xray_ref: "fixture:solar/goes-xray",
      },
    },
  });
