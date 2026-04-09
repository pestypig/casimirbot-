import type { StarSimRequest, StarSimSourceCatalog, StarSimSourceIdentifiers } from "./contract";

export interface StarSimBenchmarkTarget {
  id: string;
  canonical_name: string;
  allowed_identifiers: Partial<StarSimSourceIdentifiers>;
  allowed_object_ids?: string[];
  aliases: string[];
  preferred_source_stack: StarSimSourceCatalog[];
  benchmark_family_or_pack_ids: string[];
  observable_envelopes?: Partial<Record<
    "spectroscopy.teff_K" | "asteroseismology.numax_uHz" | "asteroseismology.deltanu_uHz",
    { min: number; max: number }
  >>;
}

const normalize = (value: string | null | undefined): string =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9:._+\- ]+/g, "");

export const STAR_SIM_BENCHMARK_TARGETS_VERSION = "starsim-benchmark-targets/1";

const BENCHMARK_TARGETS: StarSimBenchmarkTarget[] = [
  {
    id: "demo_solar_a",
    canonical_name: "Demo Solar A",
    allowed_identifiers: { gaia_dr3_source_id: "123456789012345678", tess_tic_id: "100000001", tasoc_target_id: "TASOC-A-0001" },
    aliases: ["demo solar a", "demo-a"],
    preferred_source_stack: ["gaia_dr3", "sdss_astra", "tasoc", "tess_mast", "lamost_dr10"],
    benchmark_family_or_pack_ids: ["astero_gyre_solar_like", "solar_like_seismic_compare_pack_v1"],
    observable_envelopes: {
      "spectroscopy.teff_K": { min: 5600, max: 6000 },
      "asteroseismology.numax_uHz": { min: 2800, max: 3300 },
    },
  },
  {
    id: "demo_solar_b",
    canonical_name: "Demo Solar B",
    allowed_identifiers: { gaia_dr3_source_id: "987654321098765432", lamost_obsid: "LAMOST-B-0002" },
    aliases: ["demo solar b", "demo-b"],
    preferred_source_stack: ["gaia_dr3", "sdss_astra", "lamost_dr10", "tasoc", "tess_mast"],
    benchmark_family_or_pack_ids: ["simplex_solar_calibration", "solar_like_structure_fit_pack_v1"],
    observable_envelopes: {
      "spectroscopy.teff_K": { min: 5450, max: 5950 },
    },
  },
  {
    id: "alpha_centauri_a",
    canonical_name: "Alpha Centauri A",
    allowed_identifiers: {},
    allowed_object_ids: ["alpha-centauri-a"],
    aliases: ["alpha centauri a", "rigil kentaurus"],
    preferred_source_stack: ["gaia_dr3", "sdss_astra", "lamost_dr10", "tasoc", "tess_mast"],
    benchmark_family_or_pack_ids: ["solar_like_structure_fit_pack_v1", "solar_like_seismic_compare_pack_v1"],
  },
];

const findMatchedId = (target: StarSimBenchmarkTarget, identifiers: StarSimSourceIdentifiers): boolean =>
  Object.entries(target.allowed_identifiers).some(([key, expected]) => {
    if (key === "object_id") return false;
    const actual = identifiers[key as keyof StarSimSourceIdentifiers];
    return typeof expected === "string" && normalize(actual) === normalize(expected);
  });

export const resolveBenchmarkTarget = (args: {
  request: StarSimRequest;
  identifiersResolved: StarSimSourceIdentifiers;
}): StarSimBenchmarkTarget | null => {
  const objectIds = [args.request.target?.object_id, args.request.target?.name]
    .map((value) => normalize(value))
    .filter(Boolean);
  for (const target of BENCHMARK_TARGETS) {
    const aliasSet = new Set([target.canonical_name, ...(target.allowed_object_ids ?? []), ...target.aliases].map((value) => normalize(value)));
    if (objectIds.some((id) => aliasSet.has(id))) {
      return target;
    }
    if (findMatchedId(target, args.identifiersResolved)) {
      return target;
    }
  }
  return null;
};

export const listBenchmarkTargets = (): StarSimBenchmarkTarget[] => BENCHMARK_TARGETS.map((entry) => ({ ...entry }));
