import { hashStableJson } from "../../../utils/information-boundary";
import type {
  StarSimRequest,
  StarSimSourceCatalog,
  StarSimSourceHints,
  StarSimSourcePolicy,
} from "../contract";
import type { StarSimSourceCacheIdentity } from "./types";

export const DEFAULT_SOURCE_CATALOG_ORDER: StarSimSourceCatalog[] = [
  "gaia_dr3",
  "sdss_astra",
  "lamost_dr10",
  "tasoc",
  "tess_mast",
];

export const normalizeSourceHints = (
  sourceHints: StarSimSourceHints | undefined,
): Required<Pick<StarSimSourceHints, "preferred_catalogs" | "allow_fallbacks">> => ({
  preferred_catalogs:
    sourceHints?.preferred_catalogs && sourceHints.preferred_catalogs.length > 0
      ? Array.from(new Set(sourceHints.preferred_catalogs))
      : [...DEFAULT_SOURCE_CATALOG_ORDER],
  allow_fallbacks: sourceHints?.allow_fallbacks !== false,
});

export const normalizeSourcePolicy = (policy: StarSimSourcePolicy | undefined): Required<StarSimSourcePolicy> => {
  const strictCatalogResolution = policy?.strict_catalog_resolution === true;
  return {
    user_overrides_win: strictCatalogResolution ? false : policy?.user_overrides_win !== false,
    strict_catalog_resolution: strictCatalogResolution,
  };
};

export const buildSourceResolutionCacheKey = (
  request: StarSimRequest,
  cacheIdentity: StarSimSourceCacheIdentity,
): string =>
  hashStableJson({
    target: request.target ?? null,
    identifiers: request.identifiers ?? null,
    source_hints: normalizeSourceHints(request.source_hints),
    source_policy: normalizeSourcePolicy(request.source_policy),
    overrides: {
      astrometry: request.astrometry ?? null,
      photometry: request.photometry ?? null,
      spectroscopy: request.spectroscopy ?? null,
      asteroseismology: request.asteroseismology ?? null,
      activity: request.activity ?? null,
      surface: request.surface ?? null,
      structure: request.structure ?? null,
      orbital_context: request.orbital_context ?? null,
      environment: request.environment ?? null,
    },
    registry_version: cacheIdentity.registry_version,
    adapter_versions: cacheIdentity.adapter_versions,
    fetch_modes: cacheIdentity.fetch_modes,
    runtime_identities: cacheIdentity.runtime_identities,
  });
