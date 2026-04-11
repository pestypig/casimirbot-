import { hashStableJson } from "../../../utils/information-boundary";
import type {
  StarSimRequest,
  StarSimResolveResponse,
  StarSimSourceCatalog,
  StarSimSourceIdentifiers,
  StarSimSolarBaselinePhase,
  StarSimSolarObservedBaseline,
} from "../contract";
import { canonicalizeStarSimRequest } from "../canonicalize";
import { resolveBenchmarkTarget } from "../benchmark-targets";
import { buildLaneDiagnosticSummary } from "../diagnostics";
import { evaluateSolarProvenanceDiagnostics } from "../solar-diagnostics";
import { evaluateSolarObservedBaseline, evaluateStarSimSupportedDomain } from "../domain";
import { getSolarProductRegistryIdentity } from "../solar-product-registry";
import {
  buildAndPersistSolarBaselineSummary,
  decorateResolveResponseWithSolarBaselineSummary,
} from "../solar-repeatability";
import { getGaiaDr3AdapterVersion, resolveGaiaDr3Source } from "./gaia-dr3";
import { getLamostDr10AdapterVersion, resolveLamostDr10Source } from "./lamost-dr10";
import { getTasocAdapterVersion, resolveTasocSource } from "./tasoc";
import { getTessMastAdapterVersion, resolveTessMastSource } from "./tess-mast";
import { resolveSolarObservedSource } from "./adapters/solar-observed";
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
  getStarSimSourceRegistryVersion,
  type StarSimSourceCacheIdentity,
  type StarSimSourceRecord,
} from "./types";
import { getSolarReferencePackIdentity } from "../solar-reference-pack";

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
  registry_version: getStarSimSourceRegistryVersion(),
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
const solarBaselinePhaseIds: StarSimSolarBaselinePhase[] = [
  "solar_interior_closure_v1",
  "solar_cycle_observed_v1",
  "solar_eruptive_catalog_v1",
];

const isSolarObservedRequest = (request: StarSimRequest): boolean => {
  const objectId = request.target?.object_id?.trim().toLowerCase();
  const name = request.target?.name?.trim().toLowerCase();
  return objectId === "sun" || objectId === "sol" || name === "sun" || name === "sol" || request.orbital_context?.naif_body_id === 10;
};

const mergeSolarBaseline = (
  request: StarSimRequest,
  patch: StarSimSolarObservedBaseline | null,
): StarSimRequest => {
  if (!patch) {
    return request;
  }
  return {
    ...request,
    solar_baseline: {
      schema_version: patch.schema_version,
      ...(patch as Omit<StarSimSolarObservedBaseline, "schema_version">),
      ...(request.solar_baseline ?? {}),
    },
  };
};

const getPresentSolarSections = (baseline: StarSimRequest["solar_baseline"]): string[] =>
  Object.entries(baseline ?? {})
    .filter(([key, value]) => key !== "schema_version" && value !== undefined)
    .map(([key]) => key)
    .sort((left, right) => left.localeCompare(right));

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
  const solarObserved = isSolarObservedRequest(args.request);
  if (!solarObserved && !args.records.some((record) => record.catalog === "gaia_dr3")) {
    reasons.add("gaia_target_not_found");
    notes.push("Gaia DR3 identity/astrometry could not be resolved for this request.");
  }
  if (!solarObserved && !hasSelection(
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
    return decorateResolveResponseWithSolarBaselineSummary(cacheRead.response);
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
  let requestForResolution = request;
  let solarObservedArtifact:
    | {
        kind: string;
        file_name: string;
        content: unknown;
        metadata: NonNullable<StarSimResolveResponse["source_resolution"]["artifact_refs"]>[number]["metadata"];
      }
    | null = null;

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

  if (isSolarObservedRequest(request) && fetchMode !== "disabled" && fetchMode !== "cache_only") {
    const solarObserved = await resolveSolarObservedSource(request);
    if (solarObserved.baseline_patch) {
      requestForResolution = mergeSolarBaseline(requestForResolution, solarObserved.baseline_patch);
      solarObservedArtifact = {
        kind: "solar_observed_baseline",
        file_name: "solar-observed.baseline.json",
        content: solarObserved.raw_payload ?? solarObserved.baseline_patch,
        metadata: solarObserved.metadata,
      };
      notes.push("Solar observed baseline scaffold populated for the Sun request.");
    } else if (solarObserved.reason) {
      reasons.push(solarObserved.reason);
    }
  }

  const identifiersObserved = identifiers;
  const crossmatchPolicy = applyCrossmatchPolicy({ request: requestForResolution, records });
  const identifiersTrusted = crossmatchPolicy.trustedIdentifiers;
  const benchmarkMatch = resolveBenchmarkTarget({ request: requestForResolution, identifiersResolved: identifiersTrusted });
  const benchmarkTarget = benchmarkMatch.benchmark_target;
  const recordsForSelection = crossmatchPolicy.acceptedRecords;
  const preferredCatalogs = benchmarkTarget?.preferred_source_stack ?? sourceHints.preferred_catalogs;
  const selectionManifest = buildSourceSelectionManifest({
    request: requestForResolution,
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
    request: requestForResolution,
    records: recordsForSelection,
    identifiersResolved: identifiersTrusted,
    selectionManifest,
  });
  const resolutionState = summarizeResolutionState({
    request: requestForResolution,
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
  const solarBaselineSupport =
    canonicalRequestDraft && isSolarObservedRequest(requestForResolution)
      ? Object.fromEntries(
          solarBaselinePhaseIds.map((phaseId) => [phaseId, evaluateSolarObservedBaseline(canonicalRequestDraft, phaseId)]),
        ) as Partial<Record<StarSimSolarBaselinePhase, ReturnType<typeof evaluateSolarObservedBaseline>>>
      : undefined;
  const solarProvenanceDiagnostics =
    canonicalRequestDraft && isSolarObservedRequest(requestForResolution)
      ? evaluateSolarProvenanceDiagnostics(canonicalRequestDraft)
      : undefined;
  const solarReferencePack = isSolarObservedRequest(requestForResolution) ? getSolarReferencePackIdentity() : null;
  const solarProductRegistry = isSolarObservedRequest(requestForResolution) ? getSolarProductRegistryIdentity() : null;
  const structureReady = supportedDomainPreview?.passed === true;
  const oscillationReady = structureReady && oscillationSupportedDomainPreview?.passed === true;
  const requestedOscillation = request.requested_lanes?.includes("oscillation_gyre") === true;
  const requestedStellarHeavyLane =
    request.requested_lanes?.includes("structure_mesa") === true || requestedOscillation;
  const solarInteriorReady = solarBaselineSupport?.solar_interior_closure_v1?.passed === true;
  const solarCycleReady = solarBaselineSupport?.solar_cycle_observed_v1?.passed === true;
  const solarEruptiveReady = solarBaselineSupport?.solar_eruptive_catalog_v1?.passed === true;
  const solarBaselineReady = solarInteriorReady || solarCycleReady || solarEruptiveReady;
  const resolutionStatus: StarSimResolveResponse["source_resolution"]["status"] =
    canonicalRequestDraft === null
      ? "unresolved"
      : isSolarObservedRequest(requestForResolution) && !requestedStellarHeavyLane
        ? solarBaselineReady
          ? "resolved"
          : "partial"
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
        [
          ...Object.keys(selectionManifest.fields)
            .map((fieldPath) => fieldPath.split(".")[0]),
          ...getPresentSolarSections(canonicalRequestDraft?.solar_baseline),
        ]
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
      solar_baseline_support: solarBaselineSupport,
      solar_provenance_diagnostics: solarProvenanceDiagnostics,
      ...(solarReferencePack
        ? {
            solar_reference_pack_id: solarReferencePack.id,
            solar_reference_pack_version: solarReferencePack.version,
            solar_reference_pack_ref: solarReferencePack.ref,
          }
        : {}),
      ...(solarProductRegistry
        ? {
            solar_product_registry_id: solarProductRegistry.id,
            solar_product_registry_version: solarProductRegistry.version,
            solar_product_registry_ref: solarProductRegistry.ref,
          }
        : {}),
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
    solar_baseline_support: solarBaselineSupport,
    solar_provenance_diagnostics: solarProvenanceDiagnostics,
    ...(solarReferencePack
      ? {
          solar_reference_pack_id: solarReferencePack.id,
          solar_reference_pack_version: solarReferencePack.version,
          solar_reference_pack_ref: solarReferencePack.ref,
        }
      : {}),
    ...(solarProductRegistry
      ? {
          solar_product_registry_id: solarProductRegistry.id,
          solar_product_registry_version: solarProductRegistry.version,
          solar_product_registry_ref: solarProductRegistry.ref,
        }
      : {}),
  };

  const solarBaselineSummary = await buildAndPersistSolarBaselineSummary({
    requestDraft: canonicalRequestDraft,
    solarBaselineSupport,
    solarProvenanceDiagnostics,
  });
  if (solarBaselineSummary) {
    response.source_resolution.solar_reference_pack_id = solarBaselineSummary.solar_reference_pack_id;
    response.source_resolution.solar_reference_pack_version = solarBaselineSummary.solar_reference_pack_version;
    response.source_resolution.solar_reference_pack_ref = solarBaselineSummary.solar_reference_pack_ref;
    response.source_resolution.solar_product_registry_id = solarBaselineSummary.solar_product_registry_id;
    response.source_resolution.solar_product_registry_version = solarBaselineSummary.solar_product_registry_version;
    response.source_resolution.solar_product_registry_ref = solarBaselineSummary.solar_product_registry_ref;
    response.source_resolution.solar_consistency_diagnostics = solarBaselineSummary.solar_consistency_diagnostics;
    response.source_resolution.solar_provenance_diagnostics = solarBaselineSummary.solar_provenance_diagnostics ?? undefined;
    response.source_resolution.solar_baseline_signature = solarBaselineSummary.solar_baseline_signature;
    response.source_resolution.previous_solar_baseline_ref = solarBaselineSummary.previous_solar_baseline_ref;
    response.source_resolution.solar_baseline_repeatability = solarBaselineSummary.solar_baseline_repeatability;
    response.solar_reference_pack_id = solarBaselineSummary.solar_reference_pack_id;
    response.solar_reference_pack_version = solarBaselineSummary.solar_reference_pack_version;
    response.solar_reference_pack_ref = solarBaselineSummary.solar_reference_pack_ref;
    response.solar_product_registry_id = solarBaselineSummary.solar_product_registry_id;
    response.solar_product_registry_version = solarBaselineSummary.solar_product_registry_version;
    response.solar_product_registry_ref = solarBaselineSummary.solar_product_registry_ref;
    response.solar_consistency_diagnostics = solarBaselineSummary.solar_consistency_diagnostics;
    response.solar_provenance_diagnostics = solarBaselineSummary.solar_provenance_diagnostics ?? undefined;
    response.solar_baseline_signature = solarBaselineSummary.solar_baseline_signature;
    response.previous_solar_baseline_ref = solarBaselineSummary.previous_solar_baseline_ref;
    response.solar_baseline_repeatability = solarBaselineSummary.solar_baseline_repeatability;
  }

  const requestHash = hashStableJson(request);
  const writeResult = await writeStarSimSourceCache({
    cache_key: cacheKey,
    request_hash: requestHash,
    request,
    response,
    selection_manifest: selectionManifest,
    raw_records: records,
    cache_identity: cacheIdentity,
    extra_artifacts: [
      ...(solarObservedArtifact ? [solarObservedArtifact] : []),
      ...(solarBaselineSummary ? [solarBaselineSummary.summary_artifact] : []),
    ],
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
