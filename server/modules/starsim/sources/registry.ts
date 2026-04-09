import { hashStableJson } from "../../../utils/information-boundary";
import type {
  StarSimRequest,
  StarSimResolveResponse,
  StarSimSourceCatalog,
} from "../contract";
import { canonicalizeStarSimRequest } from "../canonicalize";
import { resolveBenchmarkTarget } from "../benchmark-targets";
import { buildLaneDiagnosticSummary } from "../diagnostics";
import { evaluateStarSimSupportedDomain } from "../domain";
import { getGaiaDr3AdapterVersion, resolveGaiaDr3Source } from "./gaia-dr3";
import { getLamostDr10AdapterVersion, resolveLamostDr10Source } from "./lamost-dr10";
import { getTasocAdapterVersion, resolveTasocSource } from "./tasoc";
import { getTessMastAdapterVersion, resolveTessMastSource } from "./tess-mast";
import {
  readStarSimSourceCache,
  writeStarSimSourceCache,
} from "./artifacts";
import {
  buildSourceResolutionCacheKey,
  DEFAULT_SOURCE_CATALOG_ORDER,
  normalizeSourceHints,
  normalizeSourcePolicy,
} from "./cache";
import { buildStarSimSourceAdapterRuntime } from "./runtime";
import { evaluateCrossmatch, type CrossmatchOutcome } from "./crossmatch";
import {
  buildResolvedRequestDraft,
  buildSourceSelectionManifest,
  mergeResolvedIdentifiers,
  summarizeSourceCandidates,
} from "./selection";
import { getSdssAstraAdapterVersion, resolveSdssAstraSource } from "./sdss-astra";
import {
  STAR_SIM_SOURCE_REGISTRY_VERSION,
  type StarSimSourceCacheIdentity,
  type StarSimSourceRecord,
} from "./types";

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const buildCacheIdentity = (): StarSimSourceCacheIdentity => ({
  registry_version: STAR_SIM_SOURCE_REGISTRY_VERSION,
  adapter_versions: {
    gaia_dr3: getGaiaDr3AdapterVersion(),
    sdss_astra: getSdssAstraAdapterVersion(),
    lamost_dr10: getLamostDr10AdapterVersion(),
    tasoc: getTasocAdapterVersion(),
    tess_mast: getTessMastAdapterVersion(),
  },
  fetch_modes: {
    gaia_dr3: buildStarSimSourceAdapterRuntime("gaia_dr3").mode,
    sdss_astra: buildStarSimSourceAdapterRuntime("sdss_astra").mode,
    lamost_dr10: buildStarSimSourceAdapterRuntime("lamost_dr10").mode,
    tasoc: buildStarSimSourceAdapterRuntime("tasoc").mode,
    tess_mast: buildStarSimSourceAdapterRuntime("tess_mast").mode,
  },
  runtime_identities: {
    gaia_dr3: buildStarSimSourceAdapterRuntime("gaia_dr3").endpoint_identity,
    sdss_astra: buildStarSimSourceAdapterRuntime("sdss_astra").endpoint_identity,
    lamost_dr10: buildStarSimSourceAdapterRuntime("lamost_dr10").endpoint_identity,
    tasoc: buildStarSimSourceAdapterRuntime("tasoc").endpoint_identity,
    tess_mast: buildStarSimSourceAdapterRuntime("tess_mast").endpoint_identity,
  },
});

const buildAttemptOrder = (
  preferredCatalogs: StarSimSourceCatalog[],
  allowFallbacks: boolean,
): StarSimSourceCatalog[] => (allowFallbacks ? unique([...preferredCatalogs, ...DEFAULT_SOURCE_CATALOG_ORDER]) : [...preferredCatalogs]);

const hasSelection = (fieldIds: string[], selectionManifest: ReturnType<typeof buildSourceSelectionManifest>): boolean =>
  fieldIds.some((fieldId) => Boolean(selectionManifest.fields[fieldId]));



const applyCrossmatchPolicy = (args: {
  request: StarSimRequest;
  records: StarSimSourceRecord[];
  identifiers: ReturnType<typeof mergeResolvedIdentifiers>;
}): {
  acceptedRecords: StarSimSourceRecord[];
  outcomes: CrossmatchOutcome[];
  qualityRejections: import("../contract").StarSimQualityRejection[];
} => {
  const gaia = args.records.find((record) => record.catalog === "gaia_dr3") ?? null;
  const accepted = [...args.records];
  const outcomes: CrossmatchOutcome[] = [];
  const qualityRejections: import("../contract").StarSimQualityRejection[] = [];
  const secondaryCatalogs: Array<StarSimSourceCatalog> = ["sdss_astra", "lamost_dr10", "tasoc", "tess_mast"];
  const fallbackAvailable = (catalog: StarSimSourceCatalog): boolean =>
    catalog === "sdss_astra" ? accepted.some((entry) => entry.catalog === "lamost_dr10") : false;

  for (const catalog of secondaryCatalogs) {
    const record = accepted.find((candidate) => candidate.catalog === catalog) ?? null;
    const outcome = evaluateCrossmatch({
      primary: gaia,
      candidate: record,
      expectedIdentifiers: args.identifiers,
      fallbackAvailable: fallbackAvailable(catalog),
    });
    if (!outcome) continue;
    outcomes.push(outcome);
    if (outcome.status.startsWith("rejected") && record) {
      const idx = accepted.findIndex((entry) => entry.catalog === catalog);
      if (idx >= 0) accepted.splice(idx, 1);
      qualityRejections.push({
        catalog,
        reason: outcome.status,
        field_path: catalog.includes("tasoc") || catalog.includes("tess") ? "asteroseismology" : "spectroscopy",
        quality_flags: outcome.quality_flags,
        fallback_consequence: fallbackAvailable(catalog) ? "fallback_used" : "candidate_dropped",
      });
    }
  }

  return { acceptedRecords: accepted, outcomes, qualityRejections };
};
const summarizeResolutionState = (args: {
  request: StarSimRequest;
  records: StarSimSourceRecord[];
  selectionManifest: ReturnType<typeof buildSourceSelectionManifest>;
  canonicalRequestDraft: StarSimRequest | null;
}) => {
  const reasons = new Set<string>();
  const notes: string[] = [];
  if (!args.records.some((record) => record.catalog === "gaia_dr3")) {
    reasons.add("gaia_target_not_found");
    notes.push("Gaia DR3 identity/astrometry could not be resolved for this request.");
  }
  if (!hasSelection(
    ["spectroscopy.teff_K", "spectroscopy.logg_cgs", "spectroscopy.metallicity_feh"],
    args.selectionManifest,
  )) {
    reasons.add("spectroscopy_unresolved");
    notes.push("No spectroscopy source resolved enough fields to populate Teff, log g, and [Fe/H].");
  }
  const requestedOscillation = args.request.requested_lanes?.includes("oscillation_gyre") === true;
  const requestedSeismologyHints = Boolean(
    args.request.identifiers?.tess_tic_id || args.request.identifiers?.tasoc_target_id || args.request.identifiers?.mast_obs_id,
  );
  if (
    (requestedOscillation || requestedSeismologyHints)
    && !hasSelection(
      [
        "asteroseismology.numax_uHz",
        "asteroseismology.deltanu_uHz",
        "asteroseismology.mode_frequencies_uHz",
      ],
      args.selectionManifest,
    )
  ) {
    reasons.add("seismology_unresolved");
    notes.push("No seismic-summary source resolved numax, deltanu, or mode frequencies for this request.");
  }
  if (!args.canonicalRequestDraft) {
    reasons.add("no_resolved_request_draft");
  }
  return {
    reasons: [...reasons],
    notes,
  };
};

export const resolveStarSimSources = async (request: StarSimRequest): Promise<StarSimResolveResponse> => {
  const cacheIdentity = buildCacheIdentity();
  const cacheKey = buildSourceResolutionCacheKey(request, cacheIdentity);
  const cacheRead = await readStarSimSourceCache({
    cacheKey,
    cacheIdentity,
  });
  if (cacheRead.status === "hit" && cacheRead.response) {
    return cacheRead.response;
  }

  const sourceHints = normalizeSourceHints(request.source_hints);
  const sourcePolicy = normalizeSourcePolicy(request.source_policy);
  const fetchModesByCatalog = cacheIdentity.fetch_modes;
  const fetchMode: StarSimResolveResponse["source_resolution"]["fetch_mode"] =
    Object.values(fetchModesByCatalog).includes("live")
      ? "live"
      : Object.values(fetchModesByCatalog).includes("fixture")
        ? "fixture"
        : Object.values(fetchModesByCatalog).includes("cache_only")
          ? "cache_only"
          : "disabled";
  const attemptedCatalogs = buildAttemptOrder(sourceHints.preferred_catalogs, sourceHints.allow_fallbacks);

  const records: StarSimSourceRecord[] = [];
  const notes: string[] = [];
  const reasons: string[] = [];
  let identifiers = request.identifiers ?? {};

  if (fetchMode === "disabled") {
    reasons.push("source_fetch_disabled");
    notes.push("Source resolution is disabled by STAR_SIM_SOURCE_FETCH_MODE=disabled.");
  } else if (fetchMode === "cache_only") {
    reasons.push("cache_only_miss");
    notes.push("Source resolution is in cache-only mode and no compatible cached artifact was found.");
  } else {
    if (attemptedCatalogs.includes("gaia_dr3")) {
      const gaia = await resolveGaiaDr3Source({ request, identifiers });
      if (gaia.record) {
        records.push(gaia.record);
        identifiers = mergeResolvedIdentifiers({ ...request, identifiers }, records);
      } else if (gaia.reason) {
        reasons.push(gaia.reason);
      }
    }

    if (attemptedCatalogs.includes("sdss_astra")) {
      const astra = await resolveSdssAstraSource({ request, identifiers });
      if (astra.record) {
        records.push(astra.record);
        identifiers = mergeResolvedIdentifiers({ ...request, identifiers }, records);
      } else if (astra.reason) {
        reasons.push(astra.reason);
      }
    }

    if (attemptedCatalogs.includes("lamost_dr10")) {
      const lamost = await resolveLamostDr10Source({ request, identifiers });
      if (lamost.record) {
        records.push(lamost.record);
        identifiers = mergeResolvedIdentifiers({ ...request, identifiers }, records);
      } else if (lamost.reason) {
        reasons.push(lamost.reason);
      }
    }

    if (attemptedCatalogs.includes("tasoc")) {
      const tasoc = await resolveTasocSource({ request, identifiers });
      if (tasoc.record) {
        records.push(tasoc.record);
        identifiers = mergeResolvedIdentifiers({ ...request, identifiers }, records);
      } else if (tasoc.reason) {
        reasons.push(tasoc.reason);
      }
    }

    if (attemptedCatalogs.includes("tess_mast")) {
      const tess = await resolveTessMastSource({ request, identifiers });
      if (tess.record) {
        records.push(tess.record);
        identifiers = mergeResolvedIdentifiers({ ...request, identifiers }, records);
      } else if (tess.reason) {
        reasons.push(tess.reason);
      }
    }
  }

  const benchmarkTarget = resolveBenchmarkTarget({ request, identifiersResolved: identifiers });
  const crossmatchPolicy = applyCrossmatchPolicy({ request, records, identifiers });
  const recordsForSelection = crossmatchPolicy.acceptedRecords;
  const selectionManifest = buildSourceSelectionManifest({
    request,
    records: recordsForSelection,
    preferredCatalogs: benchmarkTarget?.preferred_source_stack ?? sourceHints.preferred_catalogs,
    allowFallbacks: sourceHints.allow_fallbacks,
    policy: sourcePolicy,
    identifiersResolved: identifiers,
    qualityRejections: crossmatchPolicy.qualityRejections,
  });
  const canonicalRequestDraft = buildResolvedRequestDraft({
    request,
    records: recordsForSelection,
    identifiersResolved: identifiers,
    selectionManifest,
  });
  const resolutionState = summarizeResolutionState({
    request,
    records,
    selectionManifest,
    canonicalRequestDraft,
  });
  for (const note of resolutionState.notes) {
    notes.push(note);
  }
  for (const reason of resolutionState.reasons) {
    reasons.push(reason);
  }
  for (const rejection of crossmatchPolicy.qualityRejections) {
    reasons.push(rejection.reason);
  }

  const supportedDomainPreview = canonicalRequestDraft
    ? evaluateStarSimSupportedDomain(canonicalizeStarSimRequest(canonicalRequestDraft), "structure_mesa")
    : null;
  const oscillationSupportedDomainPreview = canonicalRequestDraft
    ? evaluateStarSimSupportedDomain(canonicalizeStarSimRequest(canonicalRequestDraft), "oscillation_gyre")
    : null;
  const structureReady = supportedDomainPreview?.passed === true;
  const oscillationReady = structureReady && oscillationSupportedDomainPreview?.passed === true;
  const requestedOscillation = request.requested_lanes?.includes("oscillation_gyre") === true;
  const resolutionStatus: StarSimResolveResponse["source_resolution"]["status"] =
    canonicalRequestDraft === null
      ? "unresolved"
      : requestedOscillation
        ? structureReady && oscillationReady
          ? "resolved"
          : "partial"
        : structureReady
        ? "resolved"
        : "partial";

  const response: StarSimResolveResponse = {
    schema_version: "star-sim-source-resolve-v1",
    target: {
      requested_object_id: request.target?.object_id ?? null,
      requested_name: request.target?.name ?? null,
      resolved_name: canonicalRequestDraft?.target?.name ?? request.target?.name ?? null,
    },
    identifiers_resolved: identifiers,
    canonical_request_draft: canonicalRequestDraft,
    source_resolution: {
      status: resolutionStatus,
      cache_key: cacheKey,
      cache_status: cacheRead.status === "miss" ? cacheRead.miss_reason ?? "missing" : "hit",
      fetch_mode: fetchMode,
      fetch_modes_by_catalog: fetchModesByCatalog,
      artifact_integrity_status: cacheRead.artifact_integrity_status,
      identifiers_resolved: identifiers,
      artifact_refs: [],
      selection_manifest: selectionManifest,
      candidate_counts: summarizeSourceCandidates(selectionManifest),
      resolved_sections: unique(
        Object.keys(selectionManifest.fields)
          .map((fieldPath) => fieldPath.split(".")[0])
          .sort((left, right) => left.localeCompare(right)),
      ),
      reasons: unique(reasons).sort((left, right) => left.localeCompare(right)),
      notes: unique(notes).sort((left, right) => left.localeCompare(right)),
      benchmark_target_id: benchmarkTarget?.id,
      crossmatch_summary: {
        accepted: crossmatchPolicy.outcomes.filter((entry) => entry.status === "accepted").length,
        rejected: crossmatchPolicy.outcomes.filter((entry) => entry.status.startsWith("rejected")).length,
        fallback_used: crossmatchPolicy.outcomes.some((entry) => entry.status === "fallback_used"),
      },
      quality_rejections: crossmatchPolicy.qualityRejections,
      diagnostic_summary: {
        top_residual_fields: [],
      },
    },
    structure_mesa_ready: structureReady,
    supported_domain_preview: supportedDomainPreview,
    oscillation_gyre_ready: oscillationReady,
    oscillation_supported_domain_preview: oscillationSupportedDomainPreview,
    benchmark_target_id: benchmarkTarget?.id,
    crossmatch_summary: {
      accepted: crossmatchPolicy.outcomes.filter((entry) => entry.status === "accepted").length,
      rejected: crossmatchPolicy.outcomes.filter((entry) => entry.status.startsWith("rejected")).length,
      fallback_used: crossmatchPolicy.outcomes.some((entry) => entry.status === "fallback_used"),
    },
    quality_rejections: crossmatchPolicy.qualityRejections,
    diagnostic_summary: buildLaneDiagnosticSummary({ residuals: {}, observablesUsed: selectionManifest ? Object.keys(selectionManifest.fields) : [] }),
  };

  const requestHash = hashStableJson(request);
  const writeResult = await writeStarSimSourceCache({
    cache_key: cacheKey,
    request_hash: requestHash,
    request,
    response,
    selection_manifest: selectionManifest,
    raw_records: records,
    cache_identity: cacheIdentity,
  });
  return {
    ...response,
    source_resolution: {
      ...response.source_resolution,
      artifact_integrity_status: "verified",
      artifact_refs: writeResult.artifact_refs,
    },
  };
};
