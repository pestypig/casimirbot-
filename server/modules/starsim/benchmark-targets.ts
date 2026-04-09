import type {
  StarSimBenchmarkTargetIdentityBasis,
  StarSimRequest,
  StarSimSourceCatalog,
  StarSimSourceIdentifiers,
} from "./contract";

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

export type StarSimBenchmarkTargetMatchMode =
  | "matched_by_identifier"
  | "matched_by_name"
  | "conflicted_name_vs_identifier"
  | "no_match";

export interface StarSimBenchmarkTargetMatchResult {
  benchmark_target: StarSimBenchmarkTarget | null;
  benchmark_target_match_mode: StarSimBenchmarkTargetMatchMode;
  benchmark_target_conflict_reason?: string;
  benchmark_target_identity_basis: StarSimBenchmarkTargetIdentityBasis;
  benchmark_target_quality_ok: boolean;
}

export const STAR_SIM_BENCHMARK_TARGETS_VERSION = "starsim-benchmark-targets/2";
const ALLOW_IDENTIFIER_MATCH_ON_NAME_CONFLICT = false;

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

const matchesName = (target: StarSimBenchmarkTarget, values: string[]): boolean => {
  const aliasSet = new Set(
    [target.canonical_name, ...(target.allowed_object_ids ?? []), ...target.aliases].map((value) => normalize(value)),
  );
  return values.some((value) => aliasSet.has(value));
};

export const resolveBenchmarkTarget = (args: {
  request: StarSimRequest;
  identifiersResolved: StarSimSourceIdentifiers;
}): StarSimBenchmarkTargetMatchResult => {
  const objectIds = [args.request.target?.object_id, args.request.target?.name]
    .map((value) => normalize(value))
    .filter(Boolean);
  const identifierMatches = BENCHMARK_TARGETS.filter((target) => findMatchedId(target, args.identifiersResolved));
  const nameMatches = BENCHMARK_TARGETS.filter((target) => matchesName(target, objectIds));

  if (identifierMatches.length > 0 && nameMatches.length > 0) {
    const shared = identifierMatches.find((target) => nameMatches.some((match) => match.id === target.id));
    if (shared) {
      return {
        benchmark_target: shared,
        benchmark_target_match_mode: "matched_by_identifier",
        benchmark_target_identity_basis: "trusted_identifier",
        benchmark_target_quality_ok: true,
      };
    }
    if (ALLOW_IDENTIFIER_MATCH_ON_NAME_CONFLICT && identifierMatches.length === 1) {
      return {
        benchmark_target: identifierMatches[0],
        benchmark_target_match_mode: "conflicted_name_vs_identifier",
        benchmark_target_conflict_reason: "name_identifier_disagreement_identifier_selected_by_policy",
        benchmark_target_identity_basis: "conflicted_trusted_identifier_vs_name",
        benchmark_target_quality_ok: false,
      };
    }
    return {
      benchmark_target: null,
      benchmark_target_match_mode: "conflicted_name_vs_identifier",
      benchmark_target_conflict_reason: "name_identifier_disagreement_conflict_unresolved",
      benchmark_target_identity_basis: "conflicted_trusted_identifier_vs_name",
      benchmark_target_quality_ok: false,
    };
  }
  if (identifierMatches.length > 0) {
    return {
      benchmark_target: identifierMatches[0],
      benchmark_target_match_mode: "matched_by_identifier",
      benchmark_target_identity_basis: "trusted_identifier",
      benchmark_target_quality_ok: true,
    };
  }
  if (nameMatches.length > 0) {
    return {
      benchmark_target: nameMatches[0],
      benchmark_target_match_mode: "matched_by_name",
      benchmark_target_identity_basis: "name_label",
      benchmark_target_quality_ok: true,
    };
  }
  return {
    benchmark_target: null,
    benchmark_target_match_mode: "no_match",
    benchmark_target_identity_basis: "none",
    benchmark_target_quality_ok: false,
  };
};

export const listBenchmarkTargets = (): StarSimBenchmarkTarget[] => BENCHMARK_TARGETS.map((entry) => ({ ...entry }));
