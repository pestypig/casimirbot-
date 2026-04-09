import type {
  FieldStatus,
  StarSimRequest,
  StarSimSourceCatalog,
  StarSimSourceCandidate,
  StarSimSourceFieldSelection,
  StarSimSourceIdentifiers,
  StarSimSourcePolicy,
  StarSimSourceSelectionManifest,
  StarSimSourceSelectionOrigin,
} from "../contract";
import type {
  SourceFieldCandidateInput,
  SourceFieldDefinition,
  SourceSelectionReason,
  StarSimSourceRecord,
} from "./types";
import { STAR_SIM_SOURCE_SELECTION_SCHEMA_VERSION } from "./types";

const FIELD_DEFINITIONS: SourceFieldDefinition[] = [
  { path: "astrometry.parallax_mas", section: "astrometry", key: "parallax_mas", unit: "mas", value_kind: "number", allowed_catalogs: ["user_override", "gaia_dr3"] },
  { path: "astrometry.proper_motion_ra_masyr", section: "astrometry", key: "proper_motion_ra_masyr", unit: "mas/yr", value_kind: "number", allowed_catalogs: ["user_override", "gaia_dr3"] },
  { path: "astrometry.proper_motion_dec_masyr", section: "astrometry", key: "proper_motion_dec_masyr", unit: "mas/yr", value_kind: "number", allowed_catalogs: ["user_override", "gaia_dr3"] },
  { path: "astrometry.radial_velocity_kms", section: "astrometry", key: "radial_velocity_kms", unit: "km/s", value_kind: "number", allowed_catalogs: ["user_override", "gaia_dr3"] },
  { path: "photometry.bands", section: "photometry", key: "bands", unit: null, value_kind: "record", allowed_catalogs: ["user_override", "gaia_dr3"] },
  { path: "photometry.time_series_ref", section: "photometry", key: "time_series_ref", unit: null, value_kind: "string", allowed_catalogs: ["user_override", "gaia_dr3", "tess_mast", "tasoc"] },
  { path: "spectroscopy.teff_K", section: "spectroscopy", key: "teff_K", unit: "K", value_kind: "number", allowed_catalogs: ["user_override", "sdss_astra", "lamost_dr10"] },
  { path: "spectroscopy.logg_cgs", section: "spectroscopy", key: "logg_cgs", unit: "dex", value_kind: "number", allowed_catalogs: ["user_override", "sdss_astra", "lamost_dr10"] },
  { path: "spectroscopy.metallicity_feh", section: "spectroscopy", key: "metallicity_feh", unit: "dex", value_kind: "number", allowed_catalogs: ["user_override", "sdss_astra", "lamost_dr10"] },
  { path: "spectroscopy.metallicity_Z", section: "spectroscopy", key: "metallicity_Z", unit: null, value_kind: "number", allowed_catalogs: ["user_override", "sdss_astra", "lamost_dr10"] },
  { path: "spectroscopy.vsini_kms", section: "spectroscopy", key: "vsini_kms", unit: "km/s", value_kind: "number", allowed_catalogs: ["user_override", "sdss_astra", "lamost_dr10"] },
  { path: "spectroscopy.spectrum_ref", section: "spectroscopy", key: "spectrum_ref", unit: null, value_kind: "string", allowed_catalogs: ["user_override", "sdss_astra", "lamost_dr10"] },
  { path: "spectroscopy.abundances", section: "spectroscopy", key: "abundances", unit: null, value_kind: "record", allowed_catalogs: ["user_override", "sdss_astra", "lamost_dr10"] },
  { path: "asteroseismology.numax_uHz", section: "asteroseismology", key: "numax_uHz", unit: "uHz", value_kind: "number", allowed_catalogs: ["user_override", "tasoc", "tess_mast"] },
  { path: "asteroseismology.deltanu_uHz", section: "asteroseismology", key: "deltanu_uHz", unit: "uHz", value_kind: "number", allowed_catalogs: ["user_override", "tasoc", "tess_mast"] },
  { path: "asteroseismology.mode_frequencies_uHz", section: "asteroseismology", key: "mode_frequencies_uHz", unit: "uHz", value_kind: "number_array", allowed_catalogs: ["user_override", "tasoc", "tess_mast"] },
];

const DEFAULT_TARGET_SOURCE_ORDER: StarSimSourceCatalog[] = ["gaia_dr3", "sdss_astra", "lamost_dr10", "tasoc", "tess_mast"];

const getFieldDefinition = (fieldPath: string): SourceFieldDefinition | null =>
  FIELD_DEFINITIONS.find((definition) => definition.path === fieldPath) ?? null;

export const getEligibleCatalogsForField = (
  fieldPath: string,
): StarSimSourceCatalog[] => {
  const fieldDefinition = getFieldDefinition(fieldPath);
  if (!fieldDefinition) {
    return [];
  }
  return fieldDefinition.allowed_catalogs.filter(
    (catalog): catalog is StarSimSourceCatalog => catalog !== "user_override",
  );
};

export const getPreferredCatalogForField = (
  fieldPath: string,
  preferredCatalogs: StarSimSourceCatalog[],
): StarSimSourceCatalog | null => {
  const eligibleCatalogs = getEligibleCatalogsForField(fieldPath);
  if (eligibleCatalogs.length === 0) {
    return null;
  }
  return preferredCatalogs.find((catalog) => eligibleCatalogs.includes(catalog)) ?? null;
};

const catalogPriority = (
  catalog: StarSimSourceSelectionOrigin,
  preferredCatalogs: StarSimSourceCatalog[],
  policy: Required<StarSimSourcePolicy>,
): number => {
  if (catalog === "user_override") {
    return policy.user_overrides_win ? -100 : preferredCatalogs.length + 100;
  }
  const index = preferredCatalogs.indexOf(catalog);
  return index === -1 ? preferredCatalogs.length + 50 : index;
};

const isPresentValue = (value: unknown, valueKind: SourceFieldDefinition["value_kind"]): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (valueKind === "string") {
    return typeof value === "string" && value.trim().length > 0;
  }
  if (valueKind === "number") {
    return typeof value === "number" && Number.isFinite(value);
  }
  if (valueKind === "record") {
    return typeof value === "object" && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length > 0;
  }
  if (valueKind === "number_array") {
    return Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === "number" && Number.isFinite(entry));
  }
  return false;
};

const getSectionValue = (section: Record<string, unknown> | undefined, key: string): unknown =>
  section && key in section ? section[key] : undefined;

const buildCandidate = (
  field: SourceFieldDefinition,
  input: SourceFieldCandidateInput,
): StarSimSourceCandidate => ({
  field_path: field.path,
  selected_from: input.catalog,
  value: input.value,
  unit: input.unit,
  uncertainty: input.uncertainty,
  status: input.status,
  source_record_id: input.record_id,
  identifiers: input.identifiers,
  quality_flags: [...input.quality_flags],
  provenance_ref: input.provenance_ref,
  raw_payload_ref: input.raw_payload_ref,
  fetch_mode: input.fetch_mode,
  fetched_at_iso: input.fetched_at_iso ?? null,
  query_metadata: input.query_metadata ?? null,
});

const buildUserOverrideCandidate = (
  request: StarSimRequest,
  field: SourceFieldDefinition,
): StarSimSourceCandidate | null => {
  const section = (request as Record<string, unknown>)[field.section] as Record<string, unknown> | undefined;
  const value = getSectionValue(section, field.key);
  if (!isPresentValue(value, field.value_kind)) {
    return null;
  }
  const uncertainties = (section?.uncertainties as Record<string, number> | undefined) ?? undefined;
  const statuses = (section?.statuses as Record<string, FieldStatus> | undefined) ?? undefined;
  const fieldSources = (section?.field_sources as Record<string, string> | undefined) ?? undefined;
  const fieldProvenanceRefs = (section?.field_provenance_refs as Record<string, string> | undefined) ?? undefined;
  return buildCandidate(field, {
    catalog: "user_override",
    record_id: null,
    identifiers: request.identifiers ?? {},
    quality_flags: ["user_supplied"],
    quality_score: 1_000,
    value,
    uncertainty: uncertainties?.[field.key] ?? null,
    unit: field.unit,
    status: statuses?.[field.key] ?? "observed",
    provenance_ref: fieldProvenanceRefs?.[field.key] ?? (typeof section?.provenance_ref === "string" ? section.provenance_ref : null),
    raw_payload_ref: fieldSources?.[field.key] ?? (typeof section?.source === "string" ? section.source : null),
    fetched_at_iso: null,
    query_metadata: {
      source: "request",
    },
  });
};

const buildSourceRecordCandidate = (
  record: StarSimSourceRecord,
  field: SourceFieldDefinition,
): StarSimSourceCandidate | null => {
  const section = (record as Record<string, unknown>)[field.section] as Record<string, unknown> | undefined;
  const value = getSectionValue(section, field.key);
  if (!isPresentValue(value, field.value_kind)) {
    return null;
  }
  const uncertainties = (section?.uncertainties as Record<string, number> | undefined) ?? undefined;
  const statuses = (section?.statuses as Record<string, FieldStatus> | undefined) ?? undefined;
  return buildCandidate(field, {
    catalog: record.catalog,
    record_id: record.record_id,
    identifiers: record.identifiers,
    quality_flags: record.quality_flags,
    quality_score: record.quality_score ?? 0,
    value,
    uncertainty: uncertainties?.[field.key] ?? null,
    unit: field.unit,
    status: statuses?.[field.key] ?? "observed",
    provenance_ref: `source:${record.catalog}:${record.record_id}#${field.path}`,
    raw_payload_ref: `raw:${record.catalog}:${record.record_id}`,
    fetch_mode: record.fetch_mode,
    fetched_at_iso: record.fetched_at_iso ?? null,
    query_metadata: record.query_metadata ?? null,
  });
};

const selectReason = (args: {
  chosen: StarSimSourceCandidate;
  candidates: StarSimSourceCandidate[];
  preferredCatalogs: StarSimSourceCatalog[];
  policy: Required<StarSimSourcePolicy>;
}): SourceSelectionReason => {
  if (args.chosen.selected_from === "user_override" && args.policy.user_overrides_win) {
    return "user_override";
  }
  if (args.candidates.length === 1) {
    return "only_available_candidate";
  }
  if (args.policy.strict_catalog_resolution && args.candidates.some((candidate) => candidate.selected_from === "user_override")) {
    return "strict_catalog_resolution";
  }
  const chosenCatalogIndex =
    args.chosen.selected_from === "user_override" ? -1 : args.preferredCatalogs.indexOf(args.chosen.selected_from);
  if (chosenCatalogIndex > 0) {
    return "fallback_catalog";
  }
  return "preferred_catalog_order";
};

const selectCandidate = (args: {
  field: SourceFieldDefinition;
  candidates: StarSimSourceCandidate[];
  preferredCatalogs: StarSimSourceCatalog[];
  policy: Required<StarSimSourcePolicy>;
}): StarSimSourceFieldSelection | null => {
  if (args.candidates.length === 0) {
    return null;
  }

  const sorted = [...args.candidates].sort((left, right) => {
    const priorityDelta =
      catalogPriority(left.selected_from, args.preferredCatalogs, args.policy)
      - catalogPriority(right.selected_from, args.preferredCatalogs, args.policy);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }
    const leftQuality = left.selected_from === "user_override" ? 1_000 : left.quality_flags.length;
    const rightQuality = right.selected_from === "user_override" ? 1_000 : right.quality_flags.length;
    if (leftQuality !== rightQuality) {
      return rightQuality - leftQuality;
    }
    const leftRecord = left.source_record_id ?? "";
    const rightRecord = right.source_record_id ?? "";
    return leftRecord.localeCompare(rightRecord);
  });

  const chosen = sorted[0];
  return {
    field_path: args.field.path,
    selected_from: chosen.selected_from,
    reason: selectReason({
      chosen,
      candidates: sorted,
      preferredCatalogs: args.preferredCatalogs,
      policy: args.policy,
    }),
    chosen,
    candidates: sorted,
  };
};

const cloneRequest = (request: StarSimRequest): StarSimRequest => JSON.parse(JSON.stringify(request)) as StarSimRequest;

const setSelectedField = (draft: StarSimRequest, field: SourceFieldDefinition, selection: StarSimSourceFieldSelection) => {
  const section = ((draft as Record<string, unknown>)[field.section] as Record<string, unknown> | undefined) ?? {};
  const statuses = (section.statuses as Record<string, FieldStatus> | undefined) ?? {};
  const uncertainties = (section.uncertainties as Record<string, number> | undefined) ?? {};
  const fieldSources = (section.field_sources as Record<string, string> | undefined) ?? {};
  const fieldProvenanceRefs = (section.field_provenance_refs as Record<string, string> | undefined) ?? {};

  section[field.key] = selection.chosen.value;
  statuses[field.key] = selection.chosen.status;
  if (selection.chosen.uncertainty !== null) {
    uncertainties[field.key] = selection.chosen.uncertainty;
  }
  fieldSources[field.key] = selection.selected_from;
  if (selection.chosen.provenance_ref) {
    fieldProvenanceRefs[field.key] = selection.chosen.provenance_ref;
  }

  const uniqueSources = Array.from(new Set(Object.values(fieldSources)));
  section.source = uniqueSources.length === 1 ? uniqueSources[0] : "source_resolution.mixed";
  section.provenance_ref = `source-selection:${field.section}`;
  section.statuses = statuses;
  if (Object.keys(uncertainties).length > 0) {
    section.uncertainties = uncertainties;
  }
  section.field_sources = fieldSources;
  section.field_provenance_refs = fieldProvenanceRefs;

  (draft as Record<string, unknown>)[field.section] = section;
};

const mergeTarget = (request: StarSimRequest, records: StarSimSourceRecord[], identifiers: StarSimSourceIdentifiers): StarSimRequest["target"] => {
  const draftTarget = { ...(request.target ?? {}) };
  for (const catalog of DEFAULT_TARGET_SOURCE_ORDER) {
    const record = records.find((candidate) => candidate.catalog === catalog);
    if (!record?.target) {
      continue;
    }
    draftTarget.object_id = draftTarget.object_id ?? record.target.object_id ?? record.identifiers.gaia_dr3_source_id;
    draftTarget.name = draftTarget.name ?? record.target.name;
    draftTarget.spectral_type = draftTarget.spectral_type ?? record.target.spectral_type;
    draftTarget.luminosity_class = draftTarget.luminosity_class ?? record.target.luminosity_class;
    draftTarget.epoch_iso = draftTarget.epoch_iso ?? record.target.epoch_iso;
  }
  if (!draftTarget.object_id && identifiers.gaia_dr3_source_id) {
    draftTarget.object_id = identifiers.gaia_dr3_source_id;
  }
  return Object.keys(draftTarget).length > 0 ? draftTarget : undefined;
};

const hasObservablePayload = (request: StarSimRequest): boolean =>
  Boolean(
    request.astrometry
    || request.photometry
    || request.spectroscopy
    || request.asteroseismology
    || request.activity
    || request.surface
    || request.structure
    || request.orbital_context
    || request.environment,
  );

export const mergeResolvedIdentifiers = (
  request: StarSimRequest,
  records: StarSimSourceRecord[],
): StarSimSourceIdentifiers => {
  const merged: StarSimSourceIdentifiers = {
    ...(request.identifiers ?? {}),
  };
  for (const record of records) {
    merged.gaia_dr3_source_id = merged.gaia_dr3_source_id ?? record.identifiers.gaia_dr3_source_id;
    merged.sdss_apogee_id = merged.sdss_apogee_id ?? record.identifiers.sdss_apogee_id;
    merged.lamost_obsid = merged.lamost_obsid ?? record.identifiers.lamost_obsid;
    merged.tess_tic_id = merged.tess_tic_id ?? record.identifiers.tess_tic_id;
    merged.tasoc_target_id = merged.tasoc_target_id ?? record.identifiers.tasoc_target_id;
    merged.mast_obs_id = merged.mast_obs_id ?? record.identifiers.mast_obs_id;
  }
  return merged;
};

export const buildSourceSelectionManifest = (args: {
  request: StarSimRequest;
  records: StarSimSourceRecord[];
  preferredCatalogs: StarSimSourceCatalog[];
  allowFallbacks: boolean;
  policy: Required<StarSimSourcePolicy>;
  identifiersResolved: StarSimSourceIdentifiers;
  qualityRejections?: import("../contract").StarSimQualityRejection[];
  qualityWarnings?: import("../contract").StarSimQualityWarning[];
}): StarSimSourceSelectionManifest => {
  const fields: Record<string, StarSimSourceFieldSelection> = {};
  const activeCatalogs = args.allowFallbacks
    ? new Set<StarSimSourceCatalog>(["gaia_dr3", "sdss_astra", "lamost_dr10", "tasoc", "tess_mast"])
    : new Set<StarSimSourceCatalog>(args.preferredCatalogs);

  for (const field of FIELD_DEFINITIONS) {
    const candidates: StarSimSourceCandidate[] = [];
    const userCandidate = buildUserOverrideCandidate(args.request, field);
    if (userCandidate) {
      candidates.push(userCandidate);
    }
    for (const record of args.records) {
      if (!field.allowed_catalogs.includes(record.catalog) || !activeCatalogs.has(record.catalog)) {
        continue;
      }
      const sourceCandidate = buildSourceRecordCandidate(record, field);
      if (sourceCandidate) {
        candidates.push(sourceCandidate);
      }
    }
    const selected = selectCandidate({
      field,
      candidates,
      preferredCatalogs: args.preferredCatalogs,
      policy: args.policy,
    });
    if (selected) {
      fields[field.path] = selected;
    }
  }

  return {
    schema_version: STAR_SIM_SOURCE_SELECTION_SCHEMA_VERSION,
    target_query: {
      object_id: args.request.target?.object_id ?? null,
      name: args.request.target?.name ?? null,
      identifiers: args.identifiersResolved,
    },
    fields,
    quality_rejections: args.qualityRejections,
    quality_warnings: args.qualityWarnings,
  };
};

export const buildResolvedRequestDraft = (args: {
  request: StarSimRequest;
  records: StarSimSourceRecord[];
  identifiersResolved: StarSimSourceIdentifiers;
  selectionManifest: StarSimSourceSelectionManifest;
}): StarSimRequest | null => {
  const draft = cloneRequest(args.request);
  draft.identifiers = args.identifiersResolved;
  draft.target = mergeTarget(args.request, args.records, args.identifiersResolved);

  for (const field of FIELD_DEFINITIONS) {
    const selection = args.selectionManifest.fields[field.path];
    if (!selection) {
      continue;
    }
    setSelectedField(draft, field, selection);
  }

  if (!hasObservablePayload(draft)) {
    return null;
  }
  return draft;
};

export const summarizeSourceCandidates = (selectionManifest: StarSimSourceSelectionManifest) => {
  const byCatalog: Record<StarSimSourceSelectionOrigin, number> = {
    user_override: 0,
    gaia_dr3: 0,
    sdss_astra: 0,
    lamost_dr10: 0,
    tess_mast: 0,
    tasoc: 0,
  };
  const byField: Record<string, number> = {};
  let total = 0;
  for (const selection of Object.values(selectionManifest.fields)) {
    byField[selection.field_path] = selection.candidates.length;
    total += selection.candidates.length;
    for (const candidate of selection.candidates) {
      byCatalog[candidate.selected_from] += 1;
    }
  }
  return {
    total,
    by_catalog: byCatalog,
    by_field: byField,
  };
};
