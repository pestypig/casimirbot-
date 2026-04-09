import { hashStableJson } from "../../../utils/information-boundary";
import type {
  StarSimRequest,
  StarSimResolveResponse,
  StarSimSourceCatalog,
  StarSimSourceIdentifiers,
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
  getPreferredCatalogForField,
  mergeResolvedIdentifiers,
  mergeTrustedIdentifiers,
  summarizeSourceCandidates,
} from "./selection";
import { getSdssAstraAdapterVersion, resolveSdssAstraSource } from "./sdss-astra";
import {
  STAR_SIM_SOURCE_REGISTRY_VERSION,
  type StarSimSourceCacheIdentity,
  type StarSimSourceRecord,
} from "./types";

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));
const normalizeIdentifier = (value: string | null | undefined): string =>
  (value ?? "").trim().toLowerCase();
const sourceIdentifierKeys: Array<keyof StarSimSourceIdentifiers> = [
  "gaia_dr3_source_id",
  "sdss_apogee_id",
  "lamost_obsid",
  "tess_tic_id",
  "tasoc_target_id",
  "mast_obs_id",
];

const getRecordTrustedIdentityBasis = (args: {
  record: StarSimSourceRecord;
  explicitIdentifiers: StarSimSourceIdentifiers;
  trustedIdentifiers: StarSimSourceIdentifiers;
}): string[] => {
  const bases = new Set<string>();
  for (const key of sourceIdentifierKeys) {
    const recordValue = args.record.identifiers[key];
    if (!recordValue) continue;
    const explicitValue = args.explicitIdentifiers[key];
    if (explicitValue && normalizeIdentifier(recordValue) === normalizeIdentifier(explicitValue)) {
      bases.add("explicit_request_identifier");
      continue;
    }
    const trustedValue = args.trustedIdentifiers[key];
    if (trustedValue && normalizeIdentifier(recordValue) === normalizeIdentifier(trustedValue)) {
      bases.add("trusted_identifier");
    }
  }
  return [...bases];
};

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

const secondaryCatalogs: Array<StarSimSourceCatalog> = ["sdss_astra", "lamost_dr10", "tasoc", "tess_mast"];

const applyCrossmatchPolicy = (args: {
  request: StarSimRequest;
  records: StarSimSourceRecord[];
}): {
  acceptedRecords: StarSimSourceRecord[];
  trustedIdentifiers: ReturnType<typeof mergeResolvedIdentifiers>;
  outcomes: CrossmatchOutcome[];
  crossmatchIdentityBasis: Partial<Record<StarSimSourceCatalog, string[]>>;
  qualityRejections: import("../contract").StarSimQualityRejection[];
  qualityWarnings: import("../contract").StarSimQualityWarning[];
} => {
  const gaia = args.records.find((record) => record.catalog === "gaia_dr3") ?? null;
  const acceptedRecords = gaia ? [gaia] : [...args.records];
  const identityTrustedRecords = gaia ? [gaia] : [];
  const outcomes: CrossmatchOutcome[] = [];
  const crossmatchIdentityBasis: Partial<Record<StarSimSourceCatalog, string[]>> = {};
  const qualityRejections: import("../contract").StarSimQualityRejection[] = [];
  const qualityWarnings: import("../contract").StarSimQualityWarning[] = [];
  const explicitIdentifiers = args.request.identifiers ?? {};
  let trustedIdentifiers = mergeTrustedIdentifiers({
    explicitIdentifiers,
    acceptedRecords: identityTrustedRecords,
  });

  if (!gaia) {
    for (const catalog of secondaryCatalogs) {
      const record = args.records.find((candidate) => candidate.catalog === catalog) ?? null;
      if (!record) continue;
      const identityBasis = getRecordTrustedIdentityBasis({
        record,
        explicitIdentifiers,
        trustedIdentifiers,
      });
      if (identityBasis.length === 0) continue;
      crossmatchIdentityBasis[catalog] = identityBasis;
      if (!identityTrustedRecords.some((entry) => entry.catalog === catalog)) {
        identityTrustedRecords.push(record);
        trustedIdentifiers = mergeTrustedIdentifiers({
          explicitIdentifiers,
          acceptedRecords: identityTrustedRecords,
        });
      }
    }

    return {
      acceptedRecords,
      trustedIdentifiers,
      outcomes,
      crossmatchIdentityBasis,
      qualityRejections,
      qualityWarnings,
    };
  }

  for (const catalog of secondaryCatalogs) {
    const record = args.records.find((candidate) => candidate.catalog === catalog) ?? null;
    const outcome = evaluateCrossmatch({
      primary: gaia,
      candidate: record,
      explicitIdentifiers,
      trustedIdentifiers,
    });
    if (!outcome) continue;
    outcomes.push(outcome);
    if (outcome.identity_basis) {
      crossmatchIdentityBasis[catalog] = [...outcome.identity_basis];
    }
    if (outcome.status.startsWith("rejected") && record) {
      qualityRejections.push({
        catalog,
        reason: outcome.status,
        field_path: catalog.includes("tasoc") || catalog.includes("tess") ? "asteroseismology" : "spectroscopy",
        quality_flags: outcome.quality_flags,
        fallback_consequence: "candidate_dropped",
      });
      continue;
    }
    if (record && !acceptedRecords.some((entry) => entry.catalog === catalog)) {
      acceptedRecords.push(record);
    }
    if (record && !identityTrustedRecords.some((entry) => entry.catalog === catalog)) {
      identityTrustedRecords.push(record);
      trustedIdentifiers = mergeTrustedIdentifiers({
        explicitIdentifiers,
        acceptedRecords: identityTrustedRecords,
      });
    }
    if (outcome.status === "accepted_with_warning") {
      qualityWarnings.push({
        catalog,
        reason: outcome.reason,
        field_path: catalog.includes("tasoc") || catalog.includes("tess") ? "asteroseismology" : "spectroscopy",
        quality_flags: outcome.quality_flags,
      });
    }
  }

  return {
    acceptedRecords,
    trustedIdentifiers,
    outcomes,
    crossmatchIdentityBasis,
    qualityRejections,
    qualityWarnings,
  };
};

const buildFallbackSummary = (args: {
  selectionManifest: ReturnType<typeof buildSourceSelectionManifest>;
  preferredCatalogs: StarSimSourceCatalog[];
  qualityRejections: import("../contract").StarSimQualityRejection[];
}): NonNullable<StarSimResolveResponse["crossmatch_summary"]> => {
  const fallbackFields: NonNullable<NonNullable<StarSimResolveResponse["crossmatch_summary"]>["fallback_fields"]> = [];
  for (const selection of Object.values(args.selectionManifest.fields)) {
    const chosen = selection.chosen;
    if (chosen.selected_from === "user_override") continue;
    const fieldSection = selection.field_path.split(".")[0];
    const rejectedForField = args.qualityRejections.filter(
      (entry) => entry.field_path === fieldSection || entry.field_path === selection.field_path,
    );
    const preferred = getPreferredCatalogForField(selection.field_path, args.preferredCatalogs);
    if (!preferred || chosen.selected_from === preferred) continue;
    const rejectedPreferred = rejectedForField.some((entry) => entry.catalog === preferred);
    const preferredAvailable = selection.candidates.some((candidate) => candidate.selected_from === preferred);
    fallbackFields.push({
      field_path: selection.field_path,
      selected_from: chosen.selected_from,
      preferred_catalog: preferred,
      preferred_status: rejectedPreferred
        ? "rejected"
        : preferredAvailable
          ? "available_not_selected"
          : "absent",
    });
  }
  return {
    accepted: 0,
    rejected: 0,
    accepted_with_warnings: 0,
    fallback_used: fallbackFields.length > 0,
    fallback_fields: fallbackFields,
  };
};

export const __buildFallbackSummaryForTest = buildFallbackSummary;
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

  const identifiersObserved = identifiers;
  const crossmatchPolicy = applyCrossmatchPolicy({ request, records });
  const identifiersTrusted = crossmatchPolicy.trustedIdentifiers;
  const benchmarkMatch = resolveBenchmarkTarget({ request, identifiersResolved: identifiersTrusted });
  const benchmarkTarget = benchmarkMatch.benchmark_target;
  const recordsForSelection = crossmatchPolicy.acceptedRecords;
  const preferredCatalogs = benchmarkTarget?.preferred_source_stack ?? sourceHints.preferred_catalogs;
  const selectionManifest = buildSourceSelectionManifest({
    request,
    records: recordsForSelection,
    preferredCatalogs,
    allowFallbacks: sourceHints.allow_fallbacks,
    policy: sourcePolicy,
    identifiersResolved: identifiersTrusted,
    qualityRejections: crossmatchPolicy.qualityRejections,
    qualityWarnings: crossmatchPolicy.qualityWarnings,
  });
  const fallbackSummary = buildFallbackSummary({
    selectionManifest,
    preferredCatalogs,
    qualityRejections: crossmatchPolicy.qualityRejections,
  });
  const canonicalRequestDraft = buildResolvedRequestDraft({
    request,
    records: recordsForSelection,
    identifiersResolved: identifiersTrusted,
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
    identifiers_resolved: identifiersTrusted,
    identifiers_observed: identifiersObserved,
    identifiers_trusted: identifiersTrusted,
    canonical_request_draft: canonicalRequestDraft,
    source_resolution: {
      status: resolutionStatus,
      cache_key: cacheKey,
      cache_status: cacheRead.status === "miss" ? cacheRead.miss_reason ?? "missing" : "hit",
      fetch_mode: fetchMode,
      fetch_modes_by_catalog: fetchModesByCatalog,
      artifact_integrity_status: cacheRead.artifact_integrity_status,
      identifiers_resolved: identifiersTrusted,
      identifiers_observed: identifiersObserved,
      identifiers_trusted: identifiersTrusted,
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
      benchmark_target_match_mode: benchmarkMatch.benchmark_target_match_mode,
      benchmark_target_conflict_reason: benchmarkMatch.benchmark_target_conflict_reason,
      benchmark_target_identity_basis: benchmarkMatch.benchmark_target_identity_basis,
      benchmark_target_quality_ok: benchmarkMatch.benchmark_target_quality_ok,
      crossmatch_summary: {
        accepted: crossmatchPolicy.outcomes.filter((entry) => entry.status === "accepted" || entry.status === "accepted_with_warning").length,
        rejected: crossmatchPolicy.outcomes.filter((entry) => entry.status.startsWith("rejected")).length,
        accepted_with_warnings: crossmatchPolicy.outcomes.filter((entry) => entry.status === "accepted_with_warning").length,
        fallback_used: fallbackSummary.fallback_used,
        fallback_fields: fallbackSummary.fallback_fields,
      },
      quality_rejections: crossmatchPolicy.qualityRejections,
      quality_warnings: crossmatchPolicy.qualityWarnings,
      crossmatch_identity_basis: crossmatchPolicy.crossmatchIdentityBasis,
      diagnostic_summary: {
        top_residual_fields: [],
      },
    },
    structure_mesa_ready: structureReady,
    supported_domain_preview: supportedDomainPreview,
    oscillation_gyre_ready: oscillationReady,
    oscillation_supported_domain_preview: oscillationSupportedDomainPreview,
    benchmark_target_id: benchmarkTarget?.id,
    benchmark_target_match_mode: benchmarkMatch.benchmark_target_match_mode,
    benchmark_target_conflict_reason: benchmarkMatch.benchmark_target_conflict_reason,
    benchmark_target_identity_basis: benchmarkMatch.benchmark_target_identity_basis,
    benchmark_target_quality_ok: benchmarkMatch.benchmark_target_quality_ok,
    crossmatch_summary: {
      accepted: crossmatchPolicy.outcomes.filter((entry) => entry.status === "accepted" || entry.status === "accepted_with_warning").length,
      rejected: crossmatchPolicy.outcomes.filter((entry) => entry.status.startsWith("rejected")).length,
      accepted_with_warnings: crossmatchPolicy.outcomes.filter((entry) => entry.status === "accepted_with_warning").length,
      fallback_used: fallbackSummary.fallback_used,
      fallback_fields: fallbackSummary.fallback_fields,
    },
    quality_rejections: crossmatchPolicy.qualityRejections,
    quality_warnings: crossmatchPolicy.qualityWarnings,
    crossmatch_identity_basis: crossmatchPolicy.crossmatchIdentityBasis,
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
