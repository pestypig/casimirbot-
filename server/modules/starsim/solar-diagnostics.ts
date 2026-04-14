import { createHash } from "node:crypto";
import type {
  StarSimRequest,
  StarSimSolarArtifactMetadata,
  StarSimSolarBaselineSectionId,
  StarSimSolarClosureCheck,
  StarSimSolarClosureDiagnostics,
  StarSimSolarCycleDiagnostics,
  StarSimSolarCoronalFieldDiagnostics,
  StarSimSolarCrossLayerConsistencyDiagnostics,
  StarSimSolarCrossLayerMismatchSummary,
  StarSimSolarEruptiveDiagnostics,
  StarSimSolarEventLinkageDiagnostics,
  StarSimSolarLocalHelioDiagnostics,
  StarSimSolarMagneticMemoryDiagnostics,
  StarSimSolarProvenanceCheck,
  StarSimSolarProvenanceDiagnostics,
  StarSimSolarSpotRegionDiagnostics,
  StarSimSolarStructuralResidualDiagnostics,
  StarSimSolarSurfaceFlowDiagnostics,
  StarSimSolarTopologyLinkageDiagnostics,
  StarSimSupportedDomainReason,
} from "./contract";
import { STAR_SIM_SOLAR_BASELINE_SECTION_IDS } from "./solar-contract";
import {
  getSolarProductRegistry,
  getSolarProductRegistryIdentity,
  type StarSimSolarProductRegistry,
  type StarSimSolarProductRegistryEntry,
} from "./solar-product-registry";
import {
  getSolarReferencePack,
  type StarSimSolarReferenceAnchor,
  type StarSimSolarReferencePack,
} from "./solar-reference-pack";

type NumericRange = {
  min: number;
  max: number;
};

type SolarCrossLayerCheckId = keyof StarSimSolarCrossLayerConsistencyDiagnostics["checks"];

type CrossLayerMismatchFields = Pick<
  StarSimSolarClosureCheck,
  | "conflicting_ref_pairs"
  | "conflicting_region_ids"
  | "conflicting_noaa_ids"
  | "conflicting_harp_ids"
  | "missing_required_refs"
  | "non_carrington_sections"
  | "missing_time_range_sections"
  | "out_of_window_event_refs"
  | "topology_link_ids_in_conflict"
  | "event_refs_in_conflict"
>;

const hasNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const hasString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const sortArray = (values: string[] | undefined): string[] => [...(values ?? [])].sort((left, right) => left.localeCompare(right));
const sortUniqueStrings = (values: Array<string | null | undefined>): string[] =>
  sortArray([...new Set(values.filter(hasString))]);

const inRange = (value: number, range: NumericRange): boolean => value >= range.min && value <= range.max;

const getExpectedStringArray = (anchor: StarSimSolarReferenceAnchor, key: string): string[] => {
  const value = anchor.expected_summary[key];
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0) : [];
};

const getInstrumentKeywordMatch = (instrument: string | undefined, keywords: string[]): boolean | null => {
  if (!hasString(instrument)) {
    return null;
  }
  const normalized = instrument.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
};

const getSectionMetadata = (sectionValue: unknown): StarSimSolarArtifactMetadata | null => {
  if (!sectionValue || typeof sectionValue !== "object") {
    return null;
  }
  const metadata = (sectionValue as { metadata?: StarSimSolarArtifactMetadata }).metadata;
  return metadata ?? null;
};

const buildMetadataSummary = (metadata: StarSimSolarArtifactMetadata | null): Record<string, unknown> => ({
  source_product_id: metadata?.source_product_id ?? null,
  source_product_family: metadata?.source_product_family ?? null,
  source_doc_ids: sortArray(metadata?.source_doc_ids),
  instrument: metadata?.instrument ?? null,
  observed_mode: metadata?.observed_mode ?? null,
  coordinate_frame: metadata?.coordinate_frame ?? null,
  carrington_rotation: metadata?.carrington_rotation ?? null,
  cadence_unit: metadata?.cadence?.unit ?? null,
  cadence_value: metadata?.cadence?.value ?? null,
});

const mergeMetadataSummary = (
  actualSummary: Record<string, unknown>,
  ...metadataValues: Array<StarSimSolarArtifactMetadata | null | undefined>
): Record<string, unknown> => ({
  ...actualSummary,
  ...Object.fromEntries(
    metadataValues.map((metadata, index) => [`metadata_${index + 1}`, buildMetadataSummary(metadata ?? null)]),
  ),
});

const getExpectedSectionProductFamilies = (
  referencePack: StarSimSolarReferencePack,
  sectionId: StarSimSolarBaselineSectionId,
): string[] => {
  switch (sectionId) {
    case "solar_interior_profile":
      return [
        referencePack.anchors.interior.convection_zone_depth.product_family,
        referencePack.anchors.interior.envelope_helium_fraction.product_family,
      ];
    case "solar_layer_boundaries":
      return [referencePack.anchors.interior.convection_zone_depth.product_family];
    case "solar_global_modes":
      return [referencePack.anchors.interior.low_degree_mode_support.product_family];
    case "solar_structural_residuals":
      return [
        referencePack.anchors.structural_residuals.hydrostatic_balance_context.product_family,
        referencePack.anchors.structural_residuals.sound_speed_residual_context.product_family,
        referencePack.anchors.structural_residuals.rotation_residual_context.product_family,
        referencePack.anchors.structural_residuals.pressure_scale_height_continuity_context.product_family,
        referencePack.anchors.structural_residuals.neutrino_seismic_consistency_context.product_family,
        referencePack.anchors.structural_residuals.residual_metadata_coherence_context.product_family,
      ];
    case "solar_local_helio":
      return [referencePack.anchors.local_helio.dopplergram_context.product_family];
    case "solar_neutrino_constraints":
      return [referencePack.anchors.interior.neutrino_constraint_vector.product_family];
    case "solar_cycle_indices":
      return [referencePack.anchors.cycle.cycle_indices.product_family];
    case "solar_cycle_history":
      return [
        referencePack.anchors.cycle.chronology_window.product_family,
        referencePack.anchors.cycle.polarity_reversal_context.product_family,
        referencePack.anchors.cycle.butterfly_history.product_family,
        referencePack.anchors.cycle.axial_dipole_history.product_family,
      ];
    case "solar_magnetogram":
      return [referencePack.anchors.cycle.magnetogram_context.product_family];
    case "solar_surface_flows":
      return [
        referencePack.anchors.surface_flow.differential_rotation_context.product_family,
        referencePack.anchors.surface_flow.surface_transport_proxy_context.product_family,
      ];
    case "solar_coronal_field":
      return [referencePack.anchors.coronal_field.pfss_context.product_family];
    case "solar_magnetic_memory":
      return [
        referencePack.anchors.magnetic_memory.axial_dipole_continuity_context.product_family,
        referencePack.anchors.magnetic_memory.bipolar_region_proxy_context.product_family,
      ];
    case "solar_active_regions":
      return [
        referencePack.anchors.cycle.active_region_context.product_family,
        referencePack.anchors.surface_flow.active_region_geometry_context.product_family,
        referencePack.anchors.magnetic_memory.active_region_polarity_ordering_context.product_family,
      ];
    case "solar_sunspot_catalog":
      return [
        referencePack.anchors.spot_region.sunspot_catalog_context.product_family,
        referencePack.anchors.spot_region.spot_geometry_context.product_family,
        referencePack.anchors.spot_region.spot_region_linkage_context.product_family,
        referencePack.anchors.spot_region.bipolar_grouping_context.product_family,
        referencePack.anchors.spot_region.polarity_tilt_context.product_family,
      ];
    case "solar_event_linkage":
      return [
        referencePack.anchors.event_linkage.flare_region_linkage_context.product_family,
        referencePack.anchors.event_linkage.cme_region_linkage_context.product_family,
        referencePack.anchors.event_linkage.sunquake_flare_region_linkage_context.product_family,
        referencePack.anchors.event_linkage.event_chronology_alignment_context.product_family,
        referencePack.anchors.event_linkage.region_identifier_consistency_context.product_family,
      ];
    case "solar_topology_linkage":
      return [
        referencePack.anchors.topology_linkage.spot_region_corona_context.product_family,
        referencePack.anchors.topology_linkage.open_flux_polar_field_continuity_context.product_family,
        referencePack.anchors.topology_linkage.event_topology_context.product_family,
        referencePack.anchors.topology_linkage.topology_role_context.product_family,
        referencePack.anchors.topology_linkage.chronology_alignment_context.product_family,
        referencePack.anchors.topology_linkage.identifier_consistency_context.product_family,
      ];
    case "solar_flare_catalog":
      return [referencePack.anchors.eruptive.flare_catalog.product_family];
    case "solar_cme_catalog":
      return [referencePack.anchors.eruptive.cme_catalog.product_family];
    case "solar_irradiance_series":
      return [
        referencePack.anchors.cycle.irradiance_continuity.product_family,
        referencePack.anchors.eruptive.irradiance_continuity.product_family,
      ];
    default:
      return [];
  }
};

const buildProvenanceCheck = (args: {
  sectionId: StarSimSolarBaselineSectionId;
  status: StarSimSolarProvenanceCheck["status"];
  registryIdentity: ReturnType<typeof getSolarProductRegistryIdentity>;
  metadata: StarSimSolarArtifactMetadata | null;
  registryEntry?: StarSimSolarProductRegistryEntry | null;
  actual_summary?: Record<string, unknown>;
  expected_summary?: Record<string, unknown>;
  notes: string[];
  reason_code?: string;
}): StarSimSolarProvenanceCheck => ({
  status: args.status,
  section_id: args.sectionId,
  ...(args.reason_code ? { reason_code: args.reason_code } : {}),
  ...(args.metadata?.source_product_id ? { source_product_id: args.metadata.source_product_id } : {}),
  ...(args.metadata?.source_product_family ? { source_product_family: args.metadata.source_product_family } : {}),
  ...(args.metadata?.source_doc_ids ? { source_doc_ids: sortArray(args.metadata.source_doc_ids) } : {}),
  product_registry_id: args.registryIdentity.id,
  product_registry_version: args.registryIdentity.version,
  ...(args.registryEntry ? { reference_doc_ids: args.registryEntry.reference_doc_ids } : {}),
  ...(args.actual_summary ? { actual_summary: args.actual_summary } : {}),
  ...(args.expected_summary ? { expected_summary: args.expected_summary } : {}),
  notes: args.notes,
});

const normalizeConflictingRefPairs = (
  pairs: Array<{ left_ref?: string | null; right_ref?: string | null; relation?: string | null } | null | undefined>,
): NonNullable<StarSimSolarClosureCheck["conflicting_ref_pairs"]> =>
  pairs
    .filter(
      (pair): pair is { left_ref: string; right_ref: string; relation?: string | null } =>
        Boolean(pair)
        && hasString(pair.left_ref)
        && hasString(pair.right_ref)
        && pair.left_ref !== pair.right_ref,
    )
    .map((pair) => ({
      left_ref: pair.left_ref.trim(),
      right_ref: pair.right_ref.trim(),
      ...(hasString(pair.relation) ? { relation: pair.relation.trim() } : {}),
    }))
    .sort((left, right) =>
      `${left.relation ?? ""}|${left.left_ref}|${left.right_ref}`.localeCompare(
        `${right.relation ?? ""}|${right.left_ref}|${right.right_ref}`,
      ));

const compactCrossLayerMismatchFields = (
  fields?: CrossLayerMismatchFields,
): CrossLayerMismatchFields | undefined => {
  if (!fields) {
    return undefined;
  }

  const compact: CrossLayerMismatchFields = {};
  const conflictingRefPairs = normalizeConflictingRefPairs(fields.conflicting_ref_pairs ?? []);
  if (conflictingRefPairs.length > 0) {
    compact.conflicting_ref_pairs = conflictingRefPairs;
  }
  const conflictingRegionIds = sortUniqueStrings(fields.conflicting_region_ids ?? []);
  if (conflictingRegionIds.length > 0) {
    compact.conflicting_region_ids = conflictingRegionIds;
  }
  const conflictingNoaaIds = sortUniqueStrings(fields.conflicting_noaa_ids ?? []);
  if (conflictingNoaaIds.length > 0) {
    compact.conflicting_noaa_ids = conflictingNoaaIds;
  }
  const conflictingHarpIds = sortUniqueStrings(fields.conflicting_harp_ids ?? []);
  if (conflictingHarpIds.length > 0) {
    compact.conflicting_harp_ids = conflictingHarpIds;
  }
  const missingRequiredRefs = sortUniqueStrings(fields.missing_required_refs ?? []);
  if (missingRequiredRefs.length > 0) {
    compact.missing_required_refs = missingRequiredRefs;
  }
  const nonCarringtonSections = sortUniqueStrings(fields.non_carrington_sections ?? []);
  if (nonCarringtonSections.length > 0) {
    compact.non_carrington_sections = nonCarringtonSections;
  }
  const missingTimeRangeSections = sortUniqueStrings(fields.missing_time_range_sections ?? []);
  if (missingTimeRangeSections.length > 0) {
    compact.missing_time_range_sections = missingTimeRangeSections;
  }
  const outOfWindowEventRefs = sortUniqueStrings(fields.out_of_window_event_refs ?? []);
  if (outOfWindowEventRefs.length > 0) {
    compact.out_of_window_event_refs = outOfWindowEventRefs;
  }
  const topologyLinkIdsInConflict = sortUniqueStrings(fields.topology_link_ids_in_conflict ?? []);
  if (topologyLinkIdsInConflict.length > 0) {
    compact.topology_link_ids_in_conflict = topologyLinkIdsInConflict;
  }
  const eventRefsInConflict = sortUniqueStrings(fields.event_refs_in_conflict ?? []);
  if (eventRefsInConflict.length > 0) {
    compact.event_refs_in_conflict = eventRefsInConflict;
  }

  return Object.keys(compact).length > 0 ? compact : undefined;
};

const CROSS_LAYER_CHECK_SECTION_IDS: Record<SolarCrossLayerCheckId, string[]> = {
  interior_residual_coherence: ["solar_interior_profile", "solar_structural_residuals"],
  mode_residual_coherence: ["solar_global_modes", "solar_structural_residuals"],
  rotation_residual_coherence: ["solar_global_modes", "solar_interior_profile", "solar_structural_residuals"],
  cycle_memory_topology_coherence: ["solar_cycle_history", "solar_magnetic_memory", "solar_coronal_field", "solar_topology_linkage"],
  event_topology_identifier_coherence: ["solar_active_regions", "solar_event_linkage", "solar_topology_linkage", "solar_sunspot_catalog"],
  chronology_metadata_alignment: ["solar_structural_residuals", "solar_cycle_history", "solar_coronal_field", "solar_event_linkage", "solar_topology_linkage"],
};

const collectCrossLayerMismatchTokens = (check: StarSimSolarClosureCheck): string[] => sortUniqueStrings([
  ...(check.conflicting_ref_pairs ?? []).map((pair) => `ref:${pair.relation ?? "pair"}:${pair.left_ref}->${pair.right_ref}`),
  ...(check.conflicting_region_ids ?? []).map((value) => `region:${value}`),
  ...(check.conflicting_noaa_ids ?? []).map((value) => `noaa:${value}`),
  ...(check.conflicting_harp_ids ?? []).map((value) => `harp:${value}`),
  ...(check.missing_required_refs ?? []).map((value) => `missing:${value}`),
  ...(check.non_carrington_sections ?? []).map((value) => `frame:${value}`),
  ...(check.missing_time_range_sections ?? []).map((value) => `timerange:${value}`),
  ...(check.out_of_window_event_refs ?? []).map((value) => `event-window:${value}`),
  ...(check.topology_link_ids_in_conflict ?? []).map((value) => `topology-link:${value}`),
  ...(check.event_refs_in_conflict ?? []).map((value) => `event:${value}`),
]);

const buildCrossLayerMismatchSummary = (
  checks: StarSimSolarCrossLayerConsistencyDiagnostics["checks"],
): StarSimSolarCrossLayerMismatchSummary => {
  const checkEntries = Object.entries(checks) as Array<[SolarCrossLayerCheckId, StarSimSolarClosureCheck]>;
  const failingCheckIds = checkEntries
    .filter(([, check]) => check.status === "fail" || check.status === "missing")
    .map(([checkId]) => checkId)
    .sort((left, right) => left.localeCompare(right));
  const warningCheckIds = checkEntries
    .filter(([, check]) => check.status === "warn")
    .map(([checkId]) => checkId)
    .sort((left, right) => left.localeCompare(right));
  const conflictingSectionIds = sortUniqueStrings(
    [...failingCheckIds, ...warningCheckIds].flatMap((checkId) => CROSS_LAYER_CHECK_SECTION_IDS[checkId] ?? []),
  );
  const conflictTokens = sortUniqueStrings(
    checkEntries.flatMap(([, check]) => collectCrossLayerMismatchTokens(check)),
  );
  const mismatchFingerprint = conflictTokens.length === 0 && failingCheckIds.length === 0 && warningCheckIds.length === 0
    ? "cross-layer:none"
    : `cross-layer:${createHash("sha256")
      .update(JSON.stringify({
        failing_check_ids: failingCheckIds,
        warning_check_ids: warningCheckIds,
        conflicting_section_ids: conflictingSectionIds,
        conflict_tokens: conflictTokens,
      }))
      .digest("hex")
      .slice(0, 16)}`;

  return {
    failing_check_ids: failingCheckIds,
    warning_check_ids: warningCheckIds,
    conflicting_section_ids: conflictingSectionIds,
    conflict_token_count: conflictTokens.length,
    mismatch_fingerprint: mismatchFingerprint,
  };
};

const buildCheck = (args: {
  anchor: StarSimSolarReferenceAnchor;
  referencePack: StarSimSolarReferencePack;
  status: StarSimSolarClosureCheck["status"];
  reason_code?: StarSimSupportedDomainReason;
  actual_summary?: Record<string, unknown>;
  expected_summary?: Record<string, unknown>;
  mismatch_fields?: CrossLayerMismatchFields;
  notes: string[];
}): StarSimSolarClosureCheck => ({
  status: args.status,
  ...(args.reason_code ? { reason_code: args.reason_code } : {}),
  reference_anchor_id: args.anchor.id,
  reference_pack_id: args.referencePack.id,
  reference_pack_version: args.referencePack.version,
  reference_basis: args.anchor.reference_basis,
  product_family: args.anchor.product_family,
  reference_doc_ids: args.anchor.reference_doc_ids,
  ...(args.actual_summary ? { actual_summary: args.actual_summary } : {}),
  expected_summary: {
    ...args.anchor.expected_summary,
    ...(args.expected_summary ?? {}),
  },
  ...(compactCrossLayerMismatchFields(args.mismatch_fields) ?? {}),
  notes: args.notes,
});

const buildConvectionZoneDepthCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.interior.convection_zone_depth;
  const expectedSummary = anchor.expected_summary as {
    unit: string;
    pass_range: NumericRange;
    warn_range: NumericRange;
    max_section_delta_rsun: number;
  };
  const interiorValue = request.solar_baseline?.solar_interior_profile?.summary?.convection_zone_base_rsun;
  const layerValue = request.solar_baseline?.solar_layer_boundaries?.convection_zone_base_rsun;
  const valueUsed = hasNumber(layerValue) ? layerValue : interiorValue;
  const delta = hasNumber(interiorValue) && hasNumber(layerValue) ? Math.abs(interiorValue - layerValue) : null;
  const actualSummary = mergeMetadataSummary(
    {
      interior_summary_rsun: interiorValue ?? null,
      layer_boundary_rsun: layerValue ?? null,
      value_used_rsun: valueUsed ?? null,
      section_delta_rsun: delta,
    },
    request.solar_baseline?.solar_interior_profile?.metadata,
    request.solar_baseline?.solar_layer_boundaries?.metadata,
  );

  if (!hasNumber(valueUsed)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code:
        request.solar_baseline?.solar_interior_profile || request.solar_baseline?.solar_layer_boundaries
          ? "solar_convection_zone_depth_invalid"
          : "solar_layer_boundaries_missing",
      actual_summary: actualSummary,
      notes: ["No convection-zone depth value was available from the solar interior summary or layer boundaries."],
    });
  }

  if (inRange(valueUsed, expectedSummary.pass_range) && (delta === null || delta <= expectedSummary.max_section_delta_rsun)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Convection-zone depth is within the reference-pack closure band."],
    });
  }

  if (inRange(valueUsed, expectedSummary.warn_range)) {
    const notes = ["Convection-zone depth is close to the anchored closure band but outside the preferred range."];
    if (delta !== null && delta > expectedSummary.max_section_delta_rsun) {
      notes.push("Interior summary and layer-boundary values disagree more than the anchored tolerance.");
    }
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      notes,
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_convection_zone_depth_invalid",
    actual_summary: actualSummary,
    notes: ["Convection-zone depth is outside the anchored closure envelope."],
  });
};

const buildEnvelopeHeliumCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.interior.envelope_helium_fraction;
  const expectedSummary = anchor.expected_summary as {
    pass_range: NumericRange;
    warn_range: NumericRange;
  };
  const helium = request.solar_baseline?.solar_interior_profile?.summary?.envelope_helium_fraction;
  const actualSummary = mergeMetadataSummary(
    {
      envelope_helium_fraction: helium ?? null,
    },
    request.solar_baseline?.solar_interior_profile?.metadata,
  );

  if (!hasNumber(helium)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code:
        request.solar_baseline?.solar_interior_profile ? "solar_envelope_helium_invalid" : "solar_interior_profile_missing",
      actual_summary: actualSummary,
      notes: ["No envelope helium fraction was available from the solar interior summary."],
    });
  }

  if (inRange(helium, expectedSummary.pass_range)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Envelope helium fraction is within the anchored closure band."],
    });
  }

  if (inRange(helium, expectedSummary.warn_range)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      notes: ["Envelope helium fraction is present but sits outside the preferred anchored closure band."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_envelope_helium_invalid",
    actual_summary: actualSummary,
    notes: ["Envelope helium fraction is outside the anchored closure envelope."],
  });
};

const buildLowDegreeModeSupportCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.interior.low_degree_mode_support;
  const expectedSummary = anchor.expected_summary as {
    minimum_mode_count_pass: number;
    minimum_mode_count_warn: number;
    required_ref: string;
    preferred_supporting_refs: string[];
  };
  const modes = request.solar_baseline?.solar_global_modes;
  const modeCount = modes?.low_degree_mode_count;
  const hasModeTable = Boolean(modes?.mode_table_ref);
  const hasDetailRef = Boolean(modes?.detail_ref);
  const hasSplittingRef = Boolean(modes?.splitting_ref);
  const instrumentMatch = getInstrumentKeywordMatch(
    modes?.metadata?.instrument,
    referencePack.product_semantics.section_instrument_keywords.solar_global_modes ?? [],
  );
  const actualSummary = mergeMetadataSummary(
    {
      low_degree_mode_count: modeCount ?? null,
      has_mode_table_ref: hasModeTable,
      has_detail_ref: hasDetailRef,
      has_splitting_ref: hasSplittingRef,
      instrument: modes?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    modes?.metadata,
  );

  if (!modes) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_global_modes_missing",
      actual_summary: actualSummary,
      notes: ["No solar global-mode section was available for the low-degree closure check."],
    });
  }

  if (!hasModeTable || !hasNumber(modeCount)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_low_degree_modes_incomplete",
      actual_summary: actualSummary,
      notes: ["Low-degree mode support requires both a mode table ref and an explicit low-degree mode count."],
    });
  }

  if (modeCount >= expectedSummary.minimum_mode_count_pass && (hasDetailRef || hasSplittingRef) && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Low-degree mode support meets the anchored Phase 0 coverage target."],
    });
  }

  if (modeCount >= expectedSummary.minimum_mode_count_warn) {
    const notes = ["Low-degree mode support is present but below the preferred anchored coverage target."];
    if (!hasDetailRef && !hasSplittingRef) {
      notes.push("Detail or splitting refs are missing, so the support remains warning strength.");
    }
    if (instrumentMatch === false) {
      notes.push("The declared instrument family does not match the anchored helioseismology product expectations.");
    }
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      notes,
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_low_degree_modes_incomplete",
    actual_summary: actualSummary,
    notes: ["Low-degree mode support is too sparse for the anchored closure requirement."],
  });
};

const buildNeutrinoConstraintVectorCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.interior.neutrino_constraint_vector;
  const requiredComponents = getExpectedStringArray(anchor, "required_components");
  const neutrinos = request.solar_baseline?.solar_neutrino_constraints;
  const presentComponents = requiredComponents.filter((key) =>
    hasNumber((neutrinos as Record<string, unknown> | undefined)?.[key]),
  );
  const instrumentMatch = getInstrumentKeywordMatch(
    neutrinos?.metadata?.instrument,
    referencePack.product_semantics.section_instrument_keywords.solar_neutrino_constraints ?? [],
  );
  const actualSummary = mergeMetadataSummary(
    {
      constraints_ref: neutrinos?.constraints_ref ?? null,
      present_components: presentComponents,
      missing_components: requiredComponents.filter((key) => !presentComponents.includes(key)),
      instrument: neutrinos?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    neutrinos?.metadata,
  );

  if (!neutrinos) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_neutrino_constraints_missing",
      actual_summary: actualSummary,
      notes: ["No solar neutrino constraint section was available for the closure check."],
    });
  }

  if (presentComponents.length === requiredComponents.length && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["The full anchored neutrino constraint vector is present."],
    });
  }

  if (presentComponents.length >= Math.max(requiredComponents.length - 1, 1)) {
    const notes = ["The neutrino constraint vector is nearly complete but still incomplete for anchored closure."];
    if (instrumentMatch === false) {
      notes.push("The declared instrument family does not match the anchored neutrino product expectations.");
    }
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_neutrino_vector_incomplete",
      actual_summary: actualSummary,
      notes,
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_neutrino_vector_incomplete",
    actual_summary: actualSummary,
    notes: ["The neutrino constraint vector is too incomplete for the anchored closure requirement."],
  });
};

const buildLocalHelioDopplergramContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.local_helio.dopplergram_context;
  const expectedSummary = anchor.expected_summary as {
    preferred_instrument_keywords: string[];
  };
  const localHelio = request.solar_baseline?.solar_local_helio;
  const instrumentMatch = getInstrumentKeywordMatch(localHelio?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      dopplergram_ref: localHelio?.dopplergram_ref ?? null,
      instrument: localHelio?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    localHelio?.metadata,
  );

  if (!localHelio) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_local_helio_missing",
      actual_summary: actualSummary,
      notes: ["No local helioseismology section was available for the Dopplergram context check."],
    });
  }

  if (hasString(localHelio.dopplergram_ref) && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Local helioseismology includes anchored Dopplergram context."],
    });
  }

  if (hasString(localHelio.dopplergram_ref)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_local_helio_context_incomplete",
      actual_summary: actualSummary,
      notes: ["A Dopplergram ref is present, but the declared instrument family does not match the anchored local-helioseismology expectation."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "missing",
    reason_code: "solar_local_helio_dopplergram_missing",
    actual_summary: actualSummary,
    notes: ["Local helioseismology is missing the required Dopplergram ref."],
  });
};

const buildLocalHelioTravelTimeOrHolographyCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.local_helio.travel_time_or_holography_context;
  const expectedSummary = anchor.expected_summary as {
    preferred_instrument_keywords: string[];
  };
  const localHelio = request.solar_baseline?.solar_local_helio;
  const hasTravelTime = hasString(localHelio?.travel_time_ref);
  const hasHolography = hasString(localHelio?.holography_ref);
  const instrumentMatch = getInstrumentKeywordMatch(localHelio?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      travel_time_ref: localHelio?.travel_time_ref ?? null,
      holography_ref: localHelio?.holography_ref ?? null,
      has_travel_time_ref: hasTravelTime,
      has_holography_ref: hasHolography,
      instrument: localHelio?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    localHelio?.metadata,
  );

  if (!localHelio) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_local_helio_missing",
      actual_summary: actualSummary,
      notes: ["No local helioseismology section was available for the travel-time or holography check."],
    });
  }

  if ((hasTravelTime || hasHolography) && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Local helioseismology includes anchored travel-time or holography context."],
    });
  }

  if (hasTravelTime || hasHolography) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_local_helio_context_incomplete",
      actual_summary: actualSummary,
      notes: ["Travel-time or holography evidence is present, but the declared instrument family does not match the anchored local-helioseismology expectation."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_local_helio_context_incomplete",
    actual_summary: actualSummary,
    notes: ["Local helioseismology is missing both travel-time and holography evidence."],
  });
};

const buildLocalHelioSunquakeEventContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.local_helio.sunquake_event_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_event_count: number;
  };
  const localHelio = request.solar_baseline?.solar_local_helio;
  const sunquakeEventCount = localHelio?.sunquake_event_refs?.length ?? 0;
  const actualSummary = mergeMetadataSummary(
    {
      sunquake_event_ref_count: sunquakeEventCount,
      sunquake_event_refs: sortArray(localHelio?.sunquake_event_refs),
    },
    localHelio?.metadata,
  );

  if (!localHelio) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_local_helio_missing",
      actual_summary: actualSummary,
      notes: ["No local helioseismology section was available for the sunquake event context check."],
    });
  }

  if (sunquakeEventCount >= expectedSummary.minimum_event_count) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Local helioseismology includes explicit sunquake-event refs as observational context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "warn",
    actual_summary: actualSummary,
    notes: ["Sunquake-event refs are advisory-only in this phase and are currently absent."],
  });
};

const buildCycleIndicesCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cycle.cycle_indices;
  const expectedSummary = anchor.expected_summary as {
    required_fields: string[];
    preferred_instrument_keywords: string[];
  };
  const indices = request.solar_baseline?.solar_cycle_indices;
  const missingFields = expectedSummary.required_fields.filter((field) => {
    const value = (indices as Record<string, unknown> | undefined)?.[field];
    return typeof value === "number" ? !hasNumber(value) : !hasString(value);
  });
  const instrumentMatch = getInstrumentKeywordMatch(indices?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      sunspot_number: indices?.sunspot_number ?? null,
      f10_7_sfu: indices?.f10_7_sfu ?? null,
      cycle_label: indices?.cycle_label ?? null,
      polarity_label: indices?.polarity_label ?? null,
      instrument: indices?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    indices?.metadata,
  );

  if (!indices) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_cycle_indices_missing",
      actual_summary: actualSummary,
      notes: ["No solar cycle-index section was available for the observed cycle baseline."],
    });
  }

  if (
    hasNumber(indices.sunspot_number)
    && hasNumber(indices.f10_7_sfu)
    && missingFields.length === 0
    && instrumentMatch !== false
  ) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Cycle indices satisfy the anchored observed-cycle requirement."],
    });
  }

  if (hasNumber(indices.sunspot_number) && hasNumber(indices.f10_7_sfu)) {
    const notes = ["Cycle indices are partially usable but missing required anchored label or product context."];
    if (missingFields.length > 0) {
      notes.push(`Missing required cycle fields: ${missingFields.join(", ")}.`);
    }
    if (instrumentMatch === false) {
      notes.push("The declared instrument family does not match the anchored cycle-index expectations.");
    }
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_cycle_indices_incomplete",
      actual_summary: actualSummary,
      notes,
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_cycle_indices_incomplete",
    actual_summary: actualSummary,
    notes: ["Cycle indices are too incomplete for the anchored observed-cycle requirement."],
  });
};

const buildCycleChronologyWindowCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cycle.chronology_window;
  const expectedSummary = anchor.expected_summary as {
    minimum_coverage_days: number;
    minimum_cycle_labels: number;
    preferred_cycle_labels: string[];
  };
  const history = request.solar_baseline?.solar_cycle_history;
  const historyStartIso = history?.history_start_iso ?? null;
  const historyEndIso = history?.history_end_iso ?? null;
  const startMs = hasString(historyStartIso) ? Date.parse(historyStartIso) : Number.NaN;
  const endMs = hasString(historyEndIso) ? Date.parse(historyEndIso) : Number.NaN;
  const coverageDays = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs
    ? Math.floor((endMs - startMs) / 86_400_000) + 1
    : null;
  const coveredCycleLabels = sortArray(history?.covered_cycle_labels);
  const instrumentMatch = getInstrumentKeywordMatch(
    history?.metadata?.instrument,
    referencePack.product_semantics.section_instrument_keywords.solar_cycle_history ?? [],
  );
  const actualSummary = mergeMetadataSummary(
    {
      history_start_iso: historyStartIso,
      history_end_iso: historyEndIso,
      coverage_days: coverageDays,
      covered_cycle_labels: coveredCycleLabels,
      preferred_cycle_labels_present: expectedSummary.preferred_cycle_labels.filter((label) =>
        coveredCycleLabels.includes(label),
      ),
      instrument: history?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    history?.metadata,
  );

  if (!history) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_cycle_history_missing",
      actual_summary: actualSummary,
      notes: ["No multi-year solar cycle-history section was available for the Hale-aware observed cycle baseline."],
    });
  }

  if (
    hasString(historyStartIso)
    && hasString(historyEndIso)
    && coverageDays !== null
    && coverageDays >= expectedSummary.minimum_coverage_days
    && coveredCycleLabels.length >= expectedSummary.minimum_cycle_labels
    && instrumentMatch !== false
  ) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Cycle chronology spans the anchored multi-year Hale-aware context window."],
    });
  }

  const notes = ["Cycle chronology is too thin for the anchored Hale-aware observed-cycle requirement."];
  if (!(coverageDays !== null && coverageDays >= expectedSummary.minimum_coverage_days)) {
    notes.push("The chronology window does not cover the anchored multi-year minimum.");
  }
  if (coveredCycleLabels.length < expectedSummary.minimum_cycle_labels) {
    notes.push("Covered cycle labels do not include enough cycle phases to establish Cycle 24 to Cycle 25 context.");
  }
  if (instrumentMatch === false) {
    notes.push("The declared instrument family does not match the anchored cycle-history expectations.");
  }
  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_cycle_chronology_incomplete",
    actual_summary: actualSummary,
    notes,
  });
};

const buildCyclePolarityReversalContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cycle.polarity_reversal_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_marker_count: number;
  };
  const history = request.solar_baseline?.solar_cycle_history;
  const refCount = history?.polarity_reversal_refs?.length ?? 0;
  const dateCount = history?.polarity_reversal_dates_iso?.length ?? 0;
  const markerCount = Math.max(refCount, dateCount);
  const actualSummary = mergeMetadataSummary(
    {
      polarity_reversal_ref_count: refCount,
      polarity_reversal_dates_iso: sortArray(history?.polarity_reversal_dates_iso),
      marker_count: markerCount,
    },
    history?.metadata,
  );

  if (!history) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_cycle_history_missing",
      actual_summary: actualSummary,
      notes: ["No cycle-history section was available for the polarity-reversal context check."],
    });
  }

  if (markerCount >= expectedSummary.minimum_marker_count) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Cycle chronology carries explicit polarity-reversal context for Hale-aware interpretation."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_cycle_polarity_reversal_missing",
    actual_summary: actualSummary,
    notes: ["Cycle chronology does not include polarity-reversal marker refs or dates."],
  });
};

const buildCycleButterflyHistoryCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cycle.butterfly_history;
  const history = request.solar_baseline?.solar_cycle_history;
  const actualSummary = mergeMetadataSummary(
    {
      butterfly_history_ref: history?.butterfly_history_ref ?? null,
    },
    history?.metadata,
  );

  if (!history) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_cycle_history_missing",
      actual_summary: actualSummary,
      notes: ["No cycle-history section was available for the butterfly-history check."],
    });
  }

  if (hasString(history.butterfly_history_ref)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Cycle chronology includes butterfly-history evidence for latitudinal migration context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_cycle_butterfly_history_missing",
    actual_summary: actualSummary,
    notes: ["Cycle chronology is missing butterfly-history evidence."],
  });
};

const buildCycleAxialDipoleHistoryCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cycle.axial_dipole_history;
  const history = request.solar_baseline?.solar_cycle_history;
  const hasAxialDipoleHistory = hasString(history?.axial_dipole_history_ref);
  const hasPolarFieldHistory = hasString(history?.polar_field_history_ref);
  const actualSummary = mergeMetadataSummary(
    {
      axial_dipole_history_ref: history?.axial_dipole_history_ref ?? null,
      polar_field_history_ref: history?.polar_field_history_ref ?? null,
      has_axial_dipole_history: hasAxialDipoleHistory,
      has_polar_field_history: hasPolarFieldHistory,
    },
    history?.metadata,
  );

  if (!history) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_cycle_history_missing",
      actual_summary: actualSummary,
      notes: ["No cycle-history section was available for the axial-dipole and polar-field trend check."],
    });
  }

  if (hasAxialDipoleHistory && hasPolarFieldHistory) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Cycle chronology includes both axial-dipole and polar-field trend context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_cycle_axial_dipole_history_missing",
    actual_summary: actualSummary,
    notes: ["Cycle chronology is missing anchored axial-dipole or polar-field trend evidence."],
  });
};

const buildMagnetogramContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cycle.magnetogram_context;
  const expectedSummary = anchor.expected_summary as {
    required_any_ref: string[];
    preferred_supporting_ref: string;
    preferred_instrument_keywords: string[];
  };
  const magnetogram = request.solar_baseline?.solar_magnetogram;
  const hasPrimaryRef = expectedSummary.required_any_ref.some((field) =>
    hasString((magnetogram as Record<string, unknown> | undefined)?.[field]),
  );
  const hasSupportingRef =
    hasString((magnetogram as Record<string, unknown> | undefined)?.[expectedSummary.preferred_supporting_ref])
    || (magnetogram?.active_region_patch_refs?.length ?? 0) > 0;
  const instrumentMatch = getInstrumentKeywordMatch(magnetogram?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      line_of_sight_ref: magnetogram?.line_of_sight_ref ?? null,
      vector_field_ref: magnetogram?.vector_field_ref ?? null,
      synoptic_radial_map_ref: magnetogram?.synoptic_radial_map_ref ?? null,
      active_region_patch_ref_count: magnetogram?.active_region_patch_refs?.length ?? 0,
      instrument: magnetogram?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    magnetogram?.metadata,
  );

  if (!magnetogram) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_magnetogram_missing",
      actual_summary: actualSummary,
      notes: ["No magnetogram section was available for the observed cycle baseline."],
    });
  }

  if (hasPrimaryRef && hasSupportingRef && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Magnetogram context satisfies the anchored observed-cycle requirement."],
    });
  }

  if (hasPrimaryRef) {
    const notes = ["Magnetogram context is present but missing the full anchored linkage support."];
    if (!hasSupportingRef) {
      notes.push("A synoptic radial map or active-region patch linkage is still missing.");
    }
    if (instrumentMatch === false) {
      notes.push("The declared instrument family does not match the anchored magnetogram expectations.");
    }
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_cycle_magnetogram_incomplete",
      actual_summary: actualSummary,
      notes,
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_cycle_magnetogram_incomplete",
    actual_summary: actualSummary,
    notes: ["Magnetogram context is too incomplete for the anchored observed-cycle requirement."],
  });
};

const countRichActiveRegions = (
  activeRegions: NonNullable<StarSimRequest["solar_baseline"]>["solar_active_regions"] | undefined,
  requiredFields: string[],
): number => {
  const regions = activeRegions?.regions ?? [];
  return regions.filter((region) =>
    requiredFields.every((field) => {
      const value = (region as Record<string, unknown>)[field];
      return typeof value === "number" ? hasNumber(value) : hasString(value);
    })
  ).length;
};

const countRichSunspots = (
  sunspotCatalog: NonNullable<StarSimRequest["solar_baseline"]>["solar_sunspot_catalog"] | undefined,
  requiredFields: string[],
): number => {
  const spots = sunspotCatalog?.spots ?? [];
  return spots.filter((spot) =>
    requiredFields.every((field) => {
      const value = (spot as Record<string, unknown>)[field];
      return typeof value === "number" ? hasNumber(value) : hasString(value);
    })
  ).length;
};

const buildActiveRegionContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cycle.active_region_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_region_count: number;
    required_any_field: string[];
    preferred_instrument_keywords: string[];
  };
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const regionRefCount = activeRegions?.region_refs?.length ?? 0;
  const regionCount = activeRegions?.region_count ?? null;
  const geometryRegionCount = activeRegions?.regions?.length ?? 0;
  const hasContext = regionRefCount >= expectedSummary.minimum_region_count
    || (hasNumber(regionCount) && regionCount >= expectedSummary.minimum_region_count)
    || geometryRegionCount >= expectedSummary.minimum_region_count;
  const instrumentMatch = getInstrumentKeywordMatch(activeRegions?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      region_ref_count: regionRefCount,
      region_count: regionCount,
      geometry_region_count: geometryRegionCount,
      instrument: activeRegions?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    activeRegions?.metadata,
  );

  if (!activeRegions) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_active_regions_missing",
      actual_summary: actualSummary,
      notes: ["No active-region section was available for the observed cycle baseline."],
    });
  }

  if (hasContext && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Active-region context satisfies the anchored observed-cycle requirement."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_active_regions_incomplete",
    actual_summary: actualSummary,
    notes: [
      hasContext
        ? "Active-region context is present but does not match the anchored product expectations."
        : "Active-region context is empty for the observed cycle baseline.",
    ],
  });
};

const buildDifferentialRotationContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.surface_flow.differential_rotation_context;
  const expectedSummary = anchor.expected_summary as {
    required_ref: string;
    required_summary_fields: string[];
    preferred_instrument_keywords: string[];
  };
  const surfaceFlows = request.solar_baseline?.solar_surface_flows;
  const hasRequiredRef = hasString((surfaceFlows as Record<string, unknown> | undefined)?.[expectedSummary.required_ref]);
  const hasRequiredSummaryFields = expectedSummary.required_summary_fields.every((field) =>
    hasNumber((surfaceFlows?.summary as Record<string, unknown> | undefined)?.[field]),
  );
  const instrumentMatch = getInstrumentKeywordMatch(surfaceFlows?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      differential_rotation_ref: surfaceFlows?.differential_rotation_ref ?? null,
      equatorial_rotation_deg_per_day: surfaceFlows?.summary?.equatorial_rotation_deg_per_day ?? null,
      rotation_shear_deg_per_day: surfaceFlows?.summary?.rotation_shear_deg_per_day ?? null,
      instrument: surfaceFlows?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    surfaceFlows?.metadata,
  );

  if (!surfaceFlows) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_surface_flows_missing",
      actual_summary: actualSummary,
      notes: ["No solar surface-flow section was available for the observed surface-flow baseline."],
    });
  }

  if (hasRequiredRef && hasRequiredSummaryFields && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Surface-flow context includes anchored differential-rotation evidence."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: hasRequiredRef ? "fail" : "missing",
    reason_code: hasRequiredRef ? "solar_surface_flow_rotation_missing" : "solar_surface_flow_rotation_missing",
    actual_summary: actualSummary,
    notes: [
      hasRequiredRef
        ? "Differential-rotation context is present but missing anchored summary support or plausible product semantics."
        : "Surface-flow context is missing the required differential-rotation ref.",
    ],
  });
};

const buildMeridionalFlowContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.surface_flow.meridional_flow_context;
  const expectedSummary = anchor.expected_summary as {
    required_ref: string;
    preferred_summary_field: string;
    preferred_instrument_keywords: string[];
  };
  const surfaceFlows = request.solar_baseline?.solar_surface_flows;
  const hasRequiredRef = hasString((surfaceFlows as Record<string, unknown> | undefined)?.[expectedSummary.required_ref]);
  const hasPreferredSummaryField = hasNumber((surfaceFlows?.summary as Record<string, unknown> | undefined)?.[expectedSummary.preferred_summary_field]);
  const instrumentMatch = getInstrumentKeywordMatch(surfaceFlows?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      meridional_flow_ref: surfaceFlows?.meridional_flow_ref ?? null,
      meridional_flow_peak_ms: surfaceFlows?.summary?.meridional_flow_peak_ms ?? null,
      instrument: surfaceFlows?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    surfaceFlows?.metadata,
  );

  if (!surfaceFlows) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_surface_flows_missing",
      actual_summary: actualSummary,
      notes: ["No solar surface-flow section was available for the meridional-flow check."],
    });
  }

  if (hasRequiredRef && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: hasPreferredSummaryField ? "pass" : "warn",
      actual_summary: actualSummary,
      notes: hasPreferredSummaryField
        ? ["Surface-flow context includes anchored meridional-flow evidence."]
        : ["Meridional-flow evidence is present, but peak-flow summary support is still advisory-only missing."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_surface_flow_meridional_missing",
    actual_summary: actualSummary,
    notes: ["Surface-flow context is missing anchored meridional-flow evidence or plausible product semantics."],
  });
};

const buildActiveRegionGeometryContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.surface_flow.active_region_geometry_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_region_count: number;
    required_fields_per_region: string[];
    preferred_instrument_keywords: string[];
  };
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const geometryRegionCount = activeRegions?.regions?.length ?? 0;
  const richRegionCount = countRichActiveRegions(activeRegions, expectedSummary.required_fields_per_region);
  const instrumentMatch = getInstrumentKeywordMatch(activeRegions?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      region_count: activeRegions?.region_count ?? null,
      region_ref_count: activeRegions?.region_refs?.length ?? 0,
      geometry_region_count: geometryRegionCount,
      rich_geometry_region_count: richRegionCount,
      instrument: activeRegions?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    activeRegions?.metadata,
  );

  if (!activeRegions) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_active_regions_missing",
      actual_summary: actualSummary,
      notes: ["No active-region section was available for the surface-flow geometry check."],
    });
  }

  if (richRegionCount >= expectedSummary.minimum_region_count && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Active-region geometry includes anchored latitude, longitude, area, tilt, polarity, and class context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_active_region_geometry_incomplete",
    actual_summary: actualSummary,
    notes: ["Active-region geometry is too thin for the observed surface-flow baseline."],
  });
};

const buildSurfaceTransportProxyContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.surface_flow.surface_transport_proxy_context;
  const expectedSummary = anchor.expected_summary as {
    preferred_any_ref: string[];
  };
  const surfaceFlows = request.solar_baseline?.solar_surface_flows;
  const hasProxyRef = expectedSummary.preferred_any_ref.some((field) =>
    hasString((surfaceFlows as Record<string, unknown> | undefined)?.[field]),
  );
  const actualSummary = mergeMetadataSummary(
    {
      supergranular_diffusion_ref: surfaceFlows?.supergranular_diffusion_ref ?? null,
      surface_transport_proxy_ref: surfaceFlows?.surface_transport_proxy_ref ?? null,
      has_proxy_ref: hasProxyRef,
    },
    surfaceFlows?.metadata,
  );

  if (!surfaceFlows) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_surface_flows_missing",
      actual_summary: actualSummary,
      notes: ["No solar surface-flow section was available for the transport-proxy advisory check."],
    });
  }

  if (hasProxyRef) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Surface-flow context includes advisory supergranular-diffusion or transport-proxy support."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "warn",
    actual_summary: actualSummary,
    notes: ["Surface-flow transport-proxy context is advisory-only in this phase and is currently absent."],
  });
};

const buildCoronalPfssContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.coronal_field.pfss_context;
  const expectedSummary = anchor.expected_summary as {
    required_ref: string;
    required_summary_field: string;
    preferred_instrument_keywords: string[];
  };
  const coronalField = request.solar_baseline?.solar_coronal_field;
  const hasRequiredRef = hasString((coronalField as Record<string, unknown> | undefined)?.[expectedSummary.required_ref]);
  const hasRequiredSummaryField = hasNumber(
    (coronalField?.summary as Record<string, unknown> | undefined)?.[expectedSummary.required_summary_field],
  );
  const instrumentMatch = getInstrumentKeywordMatch(
    coronalField?.metadata?.instrument,
    expectedSummary.preferred_instrument_keywords,
  );
  const actualSummary = mergeMetadataSummary(
    {
      pfss_solution_ref: coronalField?.pfss_solution_ref ?? null,
      source_surface_rsun: coronalField?.summary?.source_surface_rsun ?? null,
      instrument: coronalField?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    coronalField?.metadata,
  );

  if (!coronalField) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_coronal_field_missing",
      actual_summary: actualSummary,
      notes: ["No solar coronal-field section was available for the PFSS-style coronal context check."],
    });
  }

  if (hasRequiredRef && hasRequiredSummaryField && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Coronal-field context includes an anchored PFSS-style solution and source-surface summary."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_coronal_field_pfss_missing",
    actual_summary: actualSummary,
    notes: ["Coronal-field context is missing the PFSS-style solution ref, source-surface summary, or plausible product semantics required by this phase."],
  });
};

const buildCoronalSynopticBoundaryContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.coronal_field.synoptic_boundary_context;
  const expectedSummary = anchor.expected_summary as {
    required_ref: string;
    preferred_instrument_keywords: string[];
  };
  const coronalField = request.solar_baseline?.solar_coronal_field;
  const hasRequiredRef = hasString((coronalField as Record<string, unknown> | undefined)?.[expectedSummary.required_ref]);
  const instrumentMatch = getInstrumentKeywordMatch(
    coronalField?.metadata?.instrument,
    expectedSummary.preferred_instrument_keywords,
  );
  const actualSummary = mergeMetadataSummary(
    {
      synoptic_boundary_ref: coronalField?.synoptic_boundary_ref ?? null,
      instrument: coronalField?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    coronalField?.metadata,
  );

  if (!coronalField) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_coronal_field_missing",
      actual_summary: actualSummary,
      notes: ["No solar coronal-field section was available for the synoptic-boundary check."],
    });
  }

  if (hasRequiredRef && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Coronal-field context includes an explicit synoptic magnetic boundary ref."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_coronal_field_boundary_missing",
    actual_summary: actualSummary,
    notes: ["Coronal-field context is missing the synoptic magnetogram boundary ref or plausible PFSS-style boundary semantics."],
  });
};

const buildCoronalOpenFieldTopologyContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.coronal_field.open_field_topology_context;
  const expectedSummary = anchor.expected_summary as {
    required_any_field: string[];
    minimum_coronal_hole_count: number;
    required_summary_fields: string[];
  };
  const coronalField = request.solar_baseline?.solar_coronal_field;
  const coronalHoleRefs = sortArray(coronalField?.coronal_hole_refs);
  const hasTopologyRef = expectedSummary.required_any_field.some((field) =>
    field === "coronal_hole_refs"
      ? coronalHoleRefs.length > 0
      : hasString((coronalField as Record<string, unknown> | undefined)?.[field]),
  );
  const summary = coronalField?.summary as Record<string, unknown> | undefined;
  const hasSummaryFields = expectedSummary.required_summary_fields.every((field) => {
    const value = summary?.[field];
    return typeof value === "number" ? hasNumber(value) : hasString(value);
  });
  const coronalHoleCount = hasNumber(coronalField?.summary?.coronal_hole_count)
    ? coronalField?.summary?.coronal_hole_count
    : coronalHoleRefs.length;
  const actualSummary = mergeMetadataSummary(
    {
      coronal_hole_refs: coronalHoleRefs,
      coronal_hole_ref_count: coronalHoleRefs.length,
      open_field_map_ref: coronalField?.open_field_map_ref ?? null,
      dominant_topology: coronalField?.summary?.dominant_topology ?? null,
      coronal_hole_count: coronalHoleCount,
    },
    coronalField?.metadata,
  );

  if (!coronalField) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_coronal_field_missing",
      actual_summary: actualSummary,
      notes: ["No solar coronal-field section was available for the open-field topology check."],
    });
  }

  if (hasTopologyRef && coronalHoleCount >= expectedSummary.minimum_coronal_hole_count && hasSummaryFields) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Coronal-field context includes anchored open-field or coronal-hole topology support."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_coronal_field_topology_incomplete",
    actual_summary: actualSummary,
    notes: ["Coronal-field context is missing the required open-field or coronal-hole topology evidence."],
  });
};

const buildCoronalSourceRegionLinkageContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.coronal_field.source_region_linkage_context;
  const expectedSummary = anchor.expected_summary as {
    preferred_context_fields: string[];
    minimum_linked_contexts: number;
  };
  const coronalField = request.solar_baseline?.solar_coronal_field;
  const magnetogram = request.solar_baseline?.solar_magnetogram;
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const eventLinkage = request.solar_baseline?.solar_event_linkage;
  const linkedContexts = [
    hasString(magnetogram?.synoptic_radial_map_ref) ? "solar_magnetogram.synoptic_radial_map_ref" : null,
    (activeRegions?.region_refs?.length ?? 0) > 0 || (activeRegions?.regions?.length ?? 0) > 0
      ? "solar_active_regions.region_refs"
      : null,
    (eventLinkage?.link_refs?.length ?? 0) > 0 || (eventLinkage?.links?.length ?? 0) > 0
      ? "solar_event_linkage.link_refs"
      : null,
  ].filter((value): value is string => value !== null);
  const actualSummary = mergeMetadataSummary(
    {
      pfss_solution_ref: coronalField?.pfss_solution_ref ?? null,
      linked_contexts_present: linkedContexts,
      linked_context_count: linkedContexts.length,
      expected_context_fields: expectedSummary.preferred_context_fields,
    },
    coronalField?.metadata,
    magnetogram?.metadata,
    activeRegions?.metadata,
    eventLinkage?.metadata,
  );

  if (!coronalField) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_coronal_field_missing",
      actual_summary: actualSummary,
      notes: ["No solar coronal-field section was available for the source-region linkage check."],
    });
  }

  if (linkedContexts.length >= expectedSummary.minimum_linked_contexts) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Coronal-field context remains linkable back to the surface magnetogram and source-region context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_coronal_field_source_region_incomplete",
    actual_summary: actualSummary,
    notes: ["Coronal-field context is too disconnected from surface magnetogram, active-region, or event-linkage context."],
  });
};

const buildCoronalMetadataCoherenceContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.coronal_field.metadata_coherence_context;
  const expectedSummary = anchor.expected_summary as {
    required_summary_fields: string[];
    preferred_instrument_keywords: string[];
  };
  const coronalField = request.solar_baseline?.solar_coronal_field;
  const metadata = coronalField?.metadata;
  const summary = coronalField?.summary as Record<string, unknown> | undefined;
  const hasSummaryFields = expectedSummary.required_summary_fields.every((field) => {
    const value = summary?.[field];
    return typeof value === "number" ? hasNumber(value) : hasString(value);
  });
  const cadenceExpectation = referencePack.product_semantics.section_cadence_expectations.solar_coronal_field;
  const coordinateFrameOk = metadata?.coordinate_frame === referencePack.product_semantics.coordinate_frame;
  const cadenceOk = cadenceExpectation
    ? (metadata?.cadence !== undefined && cadenceExpectation.allowed_units.includes(metadata.cadence.unit))
    : true;
  const instrumentMatch = getInstrumentKeywordMatch(metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      required_summary_fields_present: hasSummaryFields,
      source_surface_rsun: coronalField?.summary?.source_surface_rsun ?? null,
      dominant_topology: coronalField?.summary?.dominant_topology ?? null,
      coordinate_frame_ok: coordinateFrameOk,
      cadence_ok: cadenceOk,
      instrument: metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    metadata,
  );

  if (!coronalField) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_coronal_field_missing",
      actual_summary: actualSummary,
      notes: ["No solar coronal-field section was available for the coronal metadata-coherence check."],
    });
  }

  if (hasSummaryFields && coordinateFrameOk && cadenceOk && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Coronal-field metadata remain coherent with the anchored Carrington and cadence expectations."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_coronal_field_topology_incomplete",
    actual_summary: actualSummary,
    notes: ["Coronal-field metadata or topology summaries do not satisfy the anchored PFSS-style coherence expectations."],
  });
};

const buildCoronalEuvContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.coronal_field.euv_coronal_context;
  const expectedSummary = anchor.expected_summary as {
    preferred_ref: string;
    preferred_instrument_keywords: string[];
  };
  const coronalField = request.solar_baseline?.solar_coronal_field;
  const hasPreferredRef = hasString((coronalField as Record<string, unknown> | undefined)?.[expectedSummary.preferred_ref]);
  const instrumentMatch = getInstrumentKeywordMatch(
    coronalField?.metadata?.instrument,
    expectedSummary.preferred_instrument_keywords,
  );
  const actualSummary = mergeMetadataSummary(
    {
      euv_coronal_context_ref: coronalField?.euv_coronal_context_ref ?? null,
      instrument: coronalField?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    coronalField?.metadata,
  );

  if (!coronalField) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_coronal_field_missing",
      actual_summary: actualSummary,
      notes: ["No solar coronal-field section was available for the advisory EUV coronal-context check."],
    });
  }

  if (hasPreferredRef && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Coronal-field context includes optional supporting EUV coronal imagery context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "warn",
    actual_summary: actualSummary,
    notes: ["EUV coronal imagery context is advisory-only in this phase and is currently absent."],
  });
};

const collectActiveRegionHemispheres = (
  activeRegions: NonNullable<StarSimRequest["solar_baseline"]>["solar_active_regions"] | undefined,
): string[] =>
  sortArray(
    Array.from(
      new Set(
        (activeRegions?.regions ?? [])
          .map((region) => region.hemisphere)
          .filter((value): value is string => hasString(value)),
      ),
    ),
  );

type SolarEventLinkageSection = NonNullable<NonNullable<StarSimRequest["solar_baseline"]>["solar_event_linkage"]>;
type SolarEventLink = NonNullable<SolarEventLinkageSection["links"]>[number];
type SolarTopologyLinkageSection = NonNullable<NonNullable<StarSimRequest["solar_baseline"]>["solar_topology_linkage"]>;
type SolarTopologyLink = NonNullable<SolarTopologyLinkageSection["links"]>[number];

const getSolarEventLinks = (
  request: StarSimRequest,
  eventType?: SolarEventLink["event_type"],
): SolarEventLink[] => {
  const links = request.solar_baseline?.solar_event_linkage?.links ?? [];
  return eventType ? links.filter((link) => link.event_type === eventType) : links;
};

const getSolarTopologyLinks = (request: StarSimRequest): SolarTopologyLink[] =>
  request.solar_baseline?.solar_topology_linkage?.links ?? [];

const buildActiveRegionIdentifierIndex = (
  activeRegions: NonNullable<StarSimRequest["solar_baseline"]>["solar_active_regions"] | undefined,
): {
  regionIds: Set<string>;
  noaaRegionIds: Set<string>;
  harpIds: Set<string>;
  emergenceTimesByRegionId: Map<string, string>;
  emergenceTimesByNoaaId: Map<string, string>;
  emergenceTimesByHarpId: Map<string, string>;
} => {
  const regionIds = new Set<string>();
  const noaaRegionIds = new Set<string>();
  const harpIds = new Set<string>();
  const emergenceTimesByRegionId = new Map<string, string>();
  const emergenceTimesByNoaaId = new Map<string, string>();
  const emergenceTimesByHarpId = new Map<string, string>();

  for (const region of activeRegions?.regions ?? []) {
    if (hasString(region.region_id)) {
      regionIds.add(region.region_id);
      if (hasString(region.emergence_time_iso)) {
        emergenceTimesByRegionId.set(region.region_id, region.emergence_time_iso);
      }
    }
    if (hasString(region.noaa_region_id)) {
      noaaRegionIds.add(region.noaa_region_id);
      if (hasString(region.emergence_time_iso)) {
        emergenceTimesByNoaaId.set(region.noaa_region_id, region.emergence_time_iso);
      }
    }
    if (hasString(region.harp_id)) {
      harpIds.add(region.harp_id);
      if (hasString(region.emergence_time_iso)) {
        emergenceTimesByHarpId.set(region.harp_id, region.emergence_time_iso);
      }
    }
  }

  for (const regionRef of activeRegions?.region_refs ?? []) {
    if (hasString(regionRef)) {
      regionIds.add(regionRef);
    }
  }

  return {
    regionIds,
    noaaRegionIds,
    harpIds,
    emergenceTimesByRegionId,
    emergenceTimesByNoaaId,
    emergenceTimesByHarpId,
  };
};

const hasAnyLinkedRegionIdentifier = (link: SolarEventLink): boolean =>
  hasString(link.linked_region_id) || hasString(link.linked_noaa_region_id) || hasString(link.linked_harp_id);

const resolveLinkedRegionEmergenceTime = (
  link: SolarEventLink,
  index: ReturnType<typeof buildActiveRegionIdentifierIndex>,
): string | null => {
  if (hasString(link.linked_region_id) && index.emergenceTimesByRegionId.has(link.linked_region_id)) {
    return index.emergenceTimesByRegionId.get(link.linked_region_id) ?? null;
  }
  if (hasString(link.linked_noaa_region_id) && index.emergenceTimesByNoaaId.has(link.linked_noaa_region_id)) {
    return index.emergenceTimesByNoaaId.get(link.linked_noaa_region_id) ?? null;
  }
  if (hasString(link.linked_harp_id) && index.emergenceTimesByHarpId.has(link.linked_harp_id)) {
    return index.emergenceTimesByHarpId.get(link.linked_harp_id) ?? null;
  }
  return null;
};

const isEventLinkIdentifierConsistent = (
  link: SolarEventLink,
  index: ReturnType<typeof buildActiveRegionIdentifierIndex>,
): boolean =>
  (hasString(link.linked_region_id) && index.regionIds.has(link.linked_region_id))
  || (hasString(link.linked_noaa_region_id) && index.noaaRegionIds.has(link.linked_noaa_region_id))
  || (hasString(link.linked_harp_id) && index.harpIds.has(link.linked_harp_id));

const buildSunspotIdentifierIndex = (
  sunspotCatalog: NonNullable<StarSimRequest["solar_baseline"]>["solar_sunspot_catalog"] | undefined,
): {
  spotIds: Set<string>;
  spotsById: Map<
    string,
    {
      linked_region_id: string | null;
      linked_noaa_region_id: string | null;
      linked_harp_id: string | null;
      emergence_time_iso: string | null;
    }
  >;
} => {
  const spotIds = new Set<string>();
  const spotsById = new Map<
    string,
    {
      linked_region_id: string | null;
      linked_noaa_region_id: string | null;
      linked_harp_id: string | null;
      emergence_time_iso: string | null;
    }
  >();

  for (const spot of sunspotCatalog?.spots ?? []) {
    if (!hasString(spot.spot_id)) {
      continue;
    }
    spotIds.add(spot.spot_id);
    spotsById.set(spot.spot_id, {
      linked_region_id: spot.linked_region_id ?? null,
      linked_noaa_region_id: spot.linked_noaa_region_id ?? null,
      linked_harp_id: spot.linked_harp_id ?? null,
      emergence_time_iso: spot.emergence_time_iso ?? null,
    });
  }

  for (const spotRef of sunspotCatalog?.spot_refs ?? []) {
    if (hasString(spotRef)) {
      spotIds.add(spotRef);
    }
  }

  return {
    spotIds,
    spotsById,
  };
};

const buildEventTimeIndex = (eventLinks: SolarEventLink[]): Map<string, string> => {
  const eventTimes = new Map<string, string>();
  for (const link of eventLinks) {
    if (hasString(link.event_ref) && hasString(link.event_time_iso)) {
      eventTimes.set(link.event_ref, link.event_time_iso);
    }
  }
  return eventTimes;
};

const topologyLinkHasAnyRegionIdentifier = (link: SolarTopologyLink): boolean =>
  hasString(link.linked_region_id) || hasString(link.linked_noaa_region_id) || hasString(link.linked_harp_id);

const topologyLinkHasOpenFieldContext = (link: SolarTopologyLink): boolean =>
  hasString(link.linked_open_field_map_ref) || (link.linked_coronal_hole_refs?.some(hasString) ?? false);

const topologyLinkHasLinkedEvents = (link: SolarTopologyLink): boolean =>
  (link.linked_flare_refs?.some(hasString) ?? false) || (link.linked_cme_refs?.some(hasString) ?? false);

const topologyLinkIdentifiersConsistent = (args: {
  link: SolarTopologyLink;
  activeRegionIndex: ReturnType<typeof buildActiveRegionIdentifierIndex>;
  sunspotIndex: ReturnType<typeof buildSunspotIdentifierIndex>;
}): boolean => {
  const { link, activeRegionIndex, sunspotIndex } = args;
  const regionConsistent =
    !topologyLinkHasAnyRegionIdentifier(link)
    || (hasString(link.linked_region_id) && activeRegionIndex.regionIds.has(link.linked_region_id))
    || (hasString(link.linked_noaa_region_id) && activeRegionIndex.noaaRegionIds.has(link.linked_noaa_region_id))
    || (hasString(link.linked_harp_id) && activeRegionIndex.harpIds.has(link.linked_harp_id));
  if (!regionConsistent) {
    return false;
  }

  for (const spotId of link.linked_spot_ids ?? []) {
    if (!sunspotIndex.spotIds.has(spotId)) {
      return false;
    }
    const spot = sunspotIndex.spotsById.get(spotId);
    if (!spot) {
      continue;
    }
    if (hasString(link.linked_region_id) && hasString(spot.linked_region_id) && link.linked_region_id !== spot.linked_region_id) {
      return false;
    }
    if (hasString(link.linked_noaa_region_id) && hasString(spot.linked_noaa_region_id) && link.linked_noaa_region_id !== spot.linked_noaa_region_id) {
      return false;
    }
    if (hasString(link.linked_harp_id) && hasString(spot.linked_harp_id) && link.linked_harp_id !== spot.linked_harp_id) {
      return false;
    }
  }

  return true;
};

const buildAxialDipoleContinuityContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.magnetic_memory.axial_dipole_continuity_context;
  const expectedSummary = anchor.expected_summary as {
    required_ref: string;
    minimum_cycle_labels: number;
    required_summary_field: string;
  };
  const magneticMemory = request.solar_baseline?.solar_magnetic_memory;
  const hasRequiredRef = hasString((magneticMemory as Record<string, unknown> | undefined)?.[expectedSummary.required_ref]);
  const coveredCycleLabels = sortArray(magneticMemory?.summary?.cycle_labels_covered);
  const hasSummaryField = hasString(
    (magneticMemory?.summary as Record<string, unknown> | undefined)?.[expectedSummary.required_summary_field],
  );
  const actualSummary = mergeMetadataSummary(
    {
      axial_dipole_history_ref: magneticMemory?.axial_dipole_history_ref ?? null,
      cycle_labels_covered: coveredCycleLabels,
      cycle_label_count: coveredCycleLabels.length,
      latest_axial_dipole_sign: magneticMemory?.summary?.latest_axial_dipole_sign ?? null,
    },
    magneticMemory?.metadata,
  );

  if (!magneticMemory) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_magnetic_memory_missing",
      actual_summary: actualSummary,
      notes: ["No solar magnetic-memory section was available for the axial-dipole continuity check."],
    });
  }

  if (!hasRequiredRef) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_magnetic_memory_axial_dipole_missing",
      actual_summary: actualSummary,
      notes: ["Magnetic-memory context is missing the required axial-dipole history ref."],
    });
  }

  if (coveredCycleLabels.length >= expectedSummary.minimum_cycle_labels && hasSummaryField) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Magnetic-memory context includes anchored axial-dipole continuity across the expected cycle window."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_magnetic_memory_axial_dipole_missing",
    actual_summary: actualSummary,
    notes: ["Axial-dipole continuity is present but too thin to support the observed magnetic-memory baseline."],
  });
};

const buildPolarFieldContinuityContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.magnetic_memory.polar_field_continuity_context;
  const expectedSummary = anchor.expected_summary as {
    required_ref: string;
    required_summary_fields: string[];
  };
  const magneticMemory = request.solar_baseline?.solar_magnetic_memory;
  const hasRequiredRef = hasString((magneticMemory as Record<string, unknown> | undefined)?.[expectedSummary.required_ref]);
  const presentSummaryFields = expectedSummary.required_summary_fields.filter((field) =>
    hasString((magneticMemory?.summary as Record<string, unknown> | undefined)?.[field]),
  );
  const actualSummary = mergeMetadataSummary(
    {
      polar_field_history_ref: magneticMemory?.polar_field_history_ref ?? null,
      north_polarity_state: magneticMemory?.summary?.north_polarity_state ?? null,
      south_polarity_state: magneticMemory?.summary?.south_polarity_state ?? null,
      present_summary_fields: presentSummaryFields,
    },
    magneticMemory?.metadata,
  );

  if (!magneticMemory) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_magnetic_memory_missing",
      actual_summary: actualSummary,
      notes: ["No solar magnetic-memory section was available for the polar-field continuity check."],
    });
  }

  if (!hasRequiredRef) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_magnetic_memory_polar_field_missing",
      actual_summary: actualSummary,
      notes: ["Magnetic-memory context is missing the required polar-field history ref."],
    });
  }

  if (presentSummaryFields.length === expectedSummary.required_summary_fields.length) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Polar-field continuity includes the anchored north/south polarity-state context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_magnetic_memory_polar_field_missing",
    actual_summary: actualSummary,
    notes: ["Polar-field continuity is missing the anchored north/south polarity-state summary context."],
  });
};

const buildReversalLinkageContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.magnetic_memory.reversal_linkage_context;
  const expectedSummary = anchor.expected_summary as {
    required_ref: string;
    minimum_marker_count: number;
    required_summary_field: string;
  };
  const magneticMemory = request.solar_baseline?.solar_magnetic_memory;
  const reversalRefs = sortArray(magneticMemory?.polarity_reversal_refs);
  const summaryCount = (magneticMemory?.summary as Record<string, unknown> | undefined)?.[expectedSummary.required_summary_field];
  const markerCount = hasNumber(summaryCount) ? summaryCount : null;
  const actualSummary = mergeMetadataSummary(
    {
      polarity_reversal_refs: reversalRefs,
      polarity_reversal_ref_count: reversalRefs.length,
      reversal_marker_count: markerCount,
    },
    magneticMemory?.metadata,
  );

  if (!magneticMemory) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_magnetic_memory_missing",
      actual_summary: actualSummary,
      notes: ["No solar magnetic-memory section was available for the reversal-linkage check."],
    });
  }

  if (reversalRefs.length >= expectedSummary.minimum_marker_count && (markerCount ?? 0) >= expectedSummary.minimum_marker_count) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Magnetic-memory context includes the anchored polarity-reversal markers."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: reversalRefs.length > 0 ? "fail" : "missing",
    reason_code: "solar_magnetic_memory_reversal_missing",
    actual_summary: actualSummary,
    notes: ["Magnetic-memory context is missing sufficient polarity-reversal linkage for Hale-aware continuity."],
  });
};

const buildActiveRegionPolarityOrderingContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.magnetic_memory.active_region_polarity_ordering_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_region_count: number;
    required_fields_per_region: string[];
    preferred_instrument_keywords: string[];
  };
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const regionCount = activeRegions?.regions?.length ?? 0;
  const richRegionCount = countRichActiveRegions(activeRegions, expectedSummary.required_fields_per_region);
  const instrumentMatch = getInstrumentKeywordMatch(activeRegions?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      region_count: activeRegions?.region_count ?? null,
      bipolar_region_count: regionCount,
      rich_bipolar_region_count: richRegionCount,
      instrument: activeRegions?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    activeRegions?.metadata,
  );

  if (!activeRegions) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_active_regions_missing",
      actual_summary: actualSummary,
      notes: ["No active-region section was available for the magnetic-memory polarity-ordering check."],
    });
  }

  if (richRegionCount >= expectedSummary.minimum_region_count && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Active-region polarity ordering includes anchored hemisphere, separation, tilt, and leading/following polarity context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_active_region_polarity_incomplete",
    actual_summary: actualSummary,
    notes: ["Active-region polarity ordering is too thin for the observed magnetic-memory baseline."],
  });
};

const buildHemisphereBipolarCoverageContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.magnetic_memory.hemisphere_bipolar_coverage_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_hemisphere_count: number;
    required_hemispheres: string[];
  };
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const hemispheres = collectActiveRegionHemispheres(activeRegions);
  const requiredHemispheresPresent = expectedSummary.required_hemispheres.every((hemisphere) => hemispheres.includes(hemisphere));
  const actualSummary = mergeMetadataSummary(
    {
      hemispheres_present: hemispheres,
      hemisphere_count: hemispheres.length,
      required_hemispheres_present: requiredHemispheresPresent,
    },
    activeRegions?.metadata,
  );

  if (!activeRegions) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_active_regions_missing",
      actual_summary: actualSummary,
      notes: ["No active-region section was available for the hemisphere-coverage check."],
    });
  }

  if (hemispheres.length >= expectedSummary.minimum_hemisphere_count && requiredHemispheresPresent) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Active-region coverage spans both hemispheres, as expected for the observed magnetic-memory baseline."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_active_region_hemisphere_incomplete",
    actual_summary: actualSummary,
    notes: ["Active-region coverage does not yet span both hemispheres strongly enough for magnetic-memory context."],
  });
};

const buildBipolarRegionProxyContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.magnetic_memory.bipolar_region_proxy_context;
  const expectedSummary = anchor.expected_summary as {
    preferred_ref: string;
  };
  const magneticMemory = request.solar_baseline?.solar_magnetic_memory;
  const hasProxyRef = hasString((magneticMemory as Record<string, unknown> | undefined)?.[expectedSummary.preferred_ref]);
  const actualSummary = mergeMetadataSummary(
    {
      bipolar_region_proxy_ref: magneticMemory?.bipolar_region_proxy_ref ?? null,
      has_proxy_ref: hasProxyRef,
    },
    magneticMemory?.metadata,
  );

  if (!magneticMemory) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_magnetic_memory_missing",
      actual_summary: actualSummary,
      notes: ["No solar magnetic-memory section was available for the bipolar-region proxy advisory check."],
    });
  }

  if (hasProxyRef) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Magnetic-memory context includes advisory bipolar-region proxy support."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "warn",
    actual_summary: actualSummary,
    notes: ["Bipolar-region proxy support is advisory-only in this phase and is currently absent."],
  });
};

const buildSunspotCatalogContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.spot_region.sunspot_catalog_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_spot_count: number;
    preferred_instrument_keywords: string[];
  };
  const sunspotCatalog = request.solar_baseline?.solar_sunspot_catalog;
  const spotRefCount = sunspotCatalog?.spot_refs?.length ?? 0;
  const spotObjectCount = sunspotCatalog?.spots?.length ?? 0;
  const declaredSpotCount = sunspotCatalog?.spot_count ?? null;
  const effectiveSpotCount = Math.max(
    spotRefCount,
    spotObjectCount,
    hasNumber(declaredSpotCount) ? declaredSpotCount : 0,
  );
  const instrumentMatch = getInstrumentKeywordMatch(
    sunspotCatalog?.metadata?.instrument,
    expectedSummary.preferred_instrument_keywords,
  );
  const actualSummary = mergeMetadataSummary(
    {
      spot_ref_count: spotRefCount,
      spot_object_count: spotObjectCount,
      spot_count_declared: declaredSpotCount,
      effective_spot_count: effectiveSpotCount,
      bipolar_group_ref_count: sunspotCatalog?.bipolar_group_refs?.length ?? 0,
      instrument: sunspotCatalog?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    sunspotCatalog?.metadata,
  );

  if (!sunspotCatalog) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_sunspot_catalog_missing",
      actual_summary: actualSummary,
      notes: ["No sunspot catalog section was available for the observed spot-region baseline."],
    });
  }

  if (effectiveSpotCount >= expectedSummary.minimum_spot_count && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["The observed Sun baseline includes an explicit sunspot catalog with usable spot coverage."],
    });
  }

  const notes = ["The sunspot catalog exists but does not yet provide enough observed spot coverage for the anchored spot-region baseline."];
  if (instrumentMatch === false) {
    notes.push("The declared instrument family does not match the anchored sunspot product expectation.");
  }
  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_sunspot_catalog_incomplete",
    actual_summary: actualSummary,
    notes,
  });
};

const buildSpotGeometryContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.spot_region.spot_geometry_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_rich_spot_count: number;
    required_fields_per_spot: string[];
  };
  const sunspotCatalog = request.solar_baseline?.solar_sunspot_catalog;
  const spotCount = sunspotCatalog?.spots?.length ?? 0;
  const richSpotCount = countRichSunspots(sunspotCatalog, expectedSummary.required_fields_per_spot);
  const actualSummary = mergeMetadataSummary(
    {
      spot_object_count: spotCount,
      rich_spot_count: richSpotCount,
      required_fields_per_spot: expectedSummary.required_fields_per_spot,
    },
    sunspotCatalog?.metadata,
  );

  if (!sunspotCatalog) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_sunspot_catalog_missing",
      actual_summary: actualSummary,
      notes: ["No sunspot catalog section was available for the per-spot geometry check."],
    });
  }

  if (richSpotCount >= expectedSummary.minimum_rich_spot_count) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Per-spot geometry and polarity fields are populated strongly enough for the anchored spot baseline."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_spot_geometry_incomplete",
    actual_summary: actualSummary,
    notes: ["The sunspot catalog lacks enough per-spot geometry or polarity detail for the anchored spot-region baseline."],
  });
};

const buildSpotRegionLinkageContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.spot_region.spot_region_linkage_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_linked_spot_count: number;
    require_active_region_reverse_linkage: boolean;
  };
  const sunspotCatalog = request.solar_baseline?.solar_sunspot_catalog;
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const spots = sunspotCatalog?.spots ?? [];
  const activeRegionIndex = buildActiveRegionIdentifierIndex(activeRegions);
  const linkedSpots = spots.filter((spot) =>
    hasString(spot.linked_region_id) || hasString(spot.linked_noaa_region_id) || hasString(spot.linked_harp_id),
  );
  const consistentLinkedSpots = linkedSpots.filter((spot) =>
    (hasString(spot.linked_region_id) && activeRegionIndex.regionIds.has(spot.linked_region_id))
    || (hasString(spot.linked_noaa_region_id) && activeRegionIndex.noaaRegionIds.has(spot.linked_noaa_region_id))
    || (hasString(spot.linked_harp_id) && activeRegionIndex.harpIds.has(spot.linked_harp_id))
  );
  const spotIds = new Set(spots.map((spot) => spot.spot_id));
  const reverseLinkedRegions = activeRegions?.regions?.filter((region) => (region.linked_spot_ids?.length ?? 0) > 0) ?? [];
  const inconsistentReverseLinkedRegions = reverseLinkedRegions.filter((region) =>
    (region.linked_spot_ids ?? []).some((spotId) => !spotIds.has(spotId)),
  );
  const actualSummary = mergeMetadataSummary(
    {
      linked_spot_count: linkedSpots.length,
      consistent_linked_spot_count: consistentLinkedSpots.length,
      reverse_linked_region_count: reverseLinkedRegions.length,
      inconsistent_reverse_linked_region_count: inconsistentReverseLinkedRegions.length,
      active_region_count: activeRegions?.regions?.length ?? 0,
    },
    sunspotCatalog?.metadata,
    activeRegions?.metadata,
  );

  if (!sunspotCatalog) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_sunspot_catalog_missing",
      actual_summary: actualSummary,
      notes: ["No sunspot catalog section was available for the spot-to-region linkage check."],
    });
  }

  if (!activeRegions) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_active_regions_missing",
      actual_summary: actualSummary,
      notes: ["No active-region section was available to verify reverse spot linkage."],
    });
  }

  if (
    consistentLinkedSpots.length >= expectedSummary.minimum_linked_spot_count
    && (!expectedSummary.require_active_region_reverse_linkage || reverseLinkedRegions.length > 0)
    && inconsistentReverseLinkedRegions.length === 0
  ) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Spot objects and active-region summaries resolve coherently against each other."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_spot_region_linkage_incomplete",
    actual_summary: actualSummary,
    notes: ["Spot-to-region linkage is too thin or reverse active-region linkage is inconsistent for the anchored spot-region baseline."],
  });
};

const buildBipolarGroupingContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.spot_region.bipolar_grouping_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_grouped_spot_count: number;
  };
  const sunspotCatalog = request.solar_baseline?.solar_sunspot_catalog;
  const groupedSpotCount = (sunspotCatalog?.spots ?? []).filter((spot) => hasString(spot.bipolar_group_id)).length;
  const bipolarGroupRefCount = sunspotCatalog?.bipolar_group_refs?.length ?? 0;
  const actualSummary = mergeMetadataSummary(
    {
      grouped_spot_count: groupedSpotCount,
      bipolar_group_ref_count: bipolarGroupRefCount,
      spot_object_count: sunspotCatalog?.spots?.length ?? 0,
    },
    sunspotCatalog?.metadata,
  );

  if (!sunspotCatalog) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_sunspot_catalog_missing",
      actual_summary: actualSummary,
      notes: ["No sunspot catalog section was available for the bipolar-grouping check."],
    });
  }

  if (groupedSpotCount >= expectedSummary.minimum_grouped_spot_count) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["The spot catalog carries explicit bipolar grouping context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_bipolar_grouping_incomplete",
    actual_summary: actualSummary,
    notes: ["The spot catalog does not yet provide enough bipolar grouping context for the anchored spot-region baseline."],
  });
};

const buildPolarityTiltContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.spot_region.polarity_tilt_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_polarity_spot_count: number;
  };
  const sunspotCatalog = request.solar_baseline?.solar_sunspot_catalog;
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const polaritySpotCount = (sunspotCatalog?.spots ?? []).filter((spot) => hasString(spot.polarity)).length;
  const richRegionSemanticsCount = (activeRegions?.regions ?? []).filter((region) =>
    hasString(region.leading_polarity)
    && hasString(region.following_polarity)
    && (hasString(region.joy_law_tilt_class) || hasString(region.polarity_ordering_class))
  ).length;
  const actualSummary = mergeMetadataSummary(
    {
      polarity_spot_count: polaritySpotCount,
      rich_region_semantics_count: richRegionSemanticsCount,
      active_region_count: activeRegions?.regions?.length ?? 0,
    },
    sunspotCatalog?.metadata,
    activeRegions?.metadata,
  );

  if (!sunspotCatalog) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_sunspot_catalog_missing",
      actual_summary: actualSummary,
      notes: ["No sunspot catalog section was available for the spot polarity and tilt check."],
    });
  }

  if (!activeRegions) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_active_regions_missing",
      actual_summary: actualSummary,
      notes: ["No active-region section was available to verify polarity ordering and tilt context."],
    });
  }

  if (polaritySpotCount >= expectedSummary.minimum_polarity_spot_count && richRegionSemanticsCount > 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Spot polarity and linked active-region tilt/order semantics are populated strongly enough for the anchored baseline."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_spot_polarity_tilt_incomplete",
    actual_summary: actualSummary,
    notes: ["Spot polarity or linked region tilt/order semantics are too thin for the anchored spot-region baseline."],
  });
};

const buildFlareRegionLinkageContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.event_linkage.flare_region_linkage_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_link_count: number;
  };
  const eventLinkage = request.solar_baseline?.solar_event_linkage;
  const flareCatalog = request.solar_baseline?.solar_flare_catalog;
  const flareLinks = getSolarEventLinks(request, "flare");
  const catalogEventRefs = new Set(flareCatalog?.event_refs ?? []);
  const matchedCatalogLinkCount = flareLinks.filter((link) => catalogEventRefs.has(link.event_ref)).length;
  const linksWithRegionIdentifiers = flareLinks.filter(hasAnyLinkedRegionIdentifier).length;
  const actualSummary = mergeMetadataSummary(
    {
      flare_link_count: flareLinks.length,
      flare_catalog_event_ref_count: flareCatalog?.event_refs?.length ?? 0,
      matched_catalog_link_count: matchedCatalogLinkCount,
      links_with_region_identifiers: linksWithRegionIdentifiers,
    },
    eventLinkage?.metadata,
    flareCatalog?.metadata,
  );

  if (!eventLinkage) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_event_linkage_missing",
      actual_summary: actualSummary,
      notes: ["No solar event-linkage section was available for the flare-to-region association check."],
    });
  }

  if (flareLinks.length < expectedSummary.minimum_link_count) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_event_linkage_flare_missing",
      actual_summary: actualSummary,
      notes: ["The event-linkage section does not include the required flare-to-region association context."],
    });
  }

  if (matchedCatalogLinkCount < flareLinks.length || linksWithRegionIdentifiers < flareLinks.length) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_event_linkage_flare_missing",
      actual_summary: actualSummary,
      notes: ["One or more flare links do not resolve back to the flare catalog or do not declare a linked region identifier."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Explicit flare-to-region associations are present and linked back to the flare catalog."],
  });
};

const buildCmeRegionLinkageContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.event_linkage.cme_region_linkage_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_link_count: number;
  };
  const eventLinkage = request.solar_baseline?.solar_event_linkage;
  const cmeCatalog = request.solar_baseline?.solar_cme_catalog;
  const cmeLinks = getSolarEventLinks(request, "cme");
  const catalogEventRefs = new Set(cmeCatalog?.event_refs ?? []);
  const matchedCatalogLinkCount = cmeLinks.filter((link) => catalogEventRefs.has(link.event_ref)).length;
  const linksWithRegionIdentifiers = cmeLinks.filter(hasAnyLinkedRegionIdentifier).length;
  const actualSummary = mergeMetadataSummary(
    {
      cme_link_count: cmeLinks.length,
      cme_catalog_event_ref_count: cmeCatalog?.event_refs?.length ?? 0,
      matched_catalog_link_count: matchedCatalogLinkCount,
      links_with_region_identifiers: linksWithRegionIdentifiers,
    },
    eventLinkage?.metadata,
    cmeCatalog?.metadata,
  );

  if (!eventLinkage) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_event_linkage_missing",
      actual_summary: actualSummary,
      notes: ["No solar event-linkage section was available for the CME-to-region association check."],
    });
  }

  if (cmeLinks.length < expectedSummary.minimum_link_count) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_event_linkage_cme_missing",
      actual_summary: actualSummary,
      notes: ["The event-linkage section does not include the required CME-to-region association context."],
    });
  }

  if (matchedCatalogLinkCount < cmeLinks.length || linksWithRegionIdentifiers < cmeLinks.length) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_event_linkage_cme_missing",
      actual_summary: actualSummary,
      notes: ["One or more CME links do not resolve back to the CME catalog or do not declare a linked region identifier."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Explicit CME-to-region associations are present and linked back to the CME catalog."],
  });
};

const buildSunquakeFlareRegionLinkageContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.event_linkage.sunquake_flare_region_linkage_context;
  const eventLinkage = request.solar_baseline?.solar_event_linkage;
  const localHelio = request.solar_baseline?.solar_local_helio;
  const flareCatalog = request.solar_baseline?.solar_flare_catalog;
  const sunquakeLinks = getSolarEventLinks(request, "sunquake");
  const sunquakeEventRefs = new Set(localHelio?.sunquake_event_refs ?? []);
  const flareEventRefs = new Set(flareCatalog?.event_refs ?? []);
  const matchedSunquakeLinks = sunquakeLinks.filter((link) => sunquakeEventRefs.has(link.event_ref)).length;
  const matchedLinkedFlareCount = sunquakeLinks.filter(
    (link) => hasString(link.linked_flare_event_ref) && flareEventRefs.has(link.linked_flare_event_ref),
  ).length;
  const actualSummary = mergeMetadataSummary(
    {
      sunquake_link_count: sunquakeLinks.length,
      local_sunquake_event_ref_count: localHelio?.sunquake_event_refs?.length ?? 0,
      matched_sunquake_link_count: matchedSunquakeLinks,
      matched_linked_flare_count: matchedLinkedFlareCount,
    },
    eventLinkage?.metadata,
    localHelio?.metadata,
    flareCatalog?.metadata,
  );

  if (!eventLinkage) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_event_linkage_missing",
      actual_summary: actualSummary,
      notes: ["No solar event-linkage section was available for the advisory sunquake association check."],
    });
  }

  if (sunquakeLinks.length === 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      notes: ["Explicit sunquake linkage is not yet present; this remains advisory-only in the observed event-association phase."],
    });
  }

  if (
    matchedSunquakeLinks < sunquakeLinks.length
    || matchedLinkedFlareCount < sunquakeLinks.length
    || sunquakeLinks.some((link) => !hasAnyLinkedRegionIdentifier(link))
  ) {
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      notes: ["Sunquake links are present but do not all resolve cleanly back to both local-helioseismology and flare-region context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Sunquake associations are explicitly tied back to local-helioseismology, flare, and region context."],
  });
};

const buildEventChronologyAlignmentContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.event_linkage.event_chronology_alignment_context;
  const expectedSummary = anchor.expected_summary as {
    max_sunquake_time_offset_minutes: number;
  };
  const eventLinkage = request.solar_baseline?.solar_event_linkage;
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const links = getSolarEventLinks(request);
  const regionIndex = buildActiveRegionIdentifierIndex(activeRegions);
  const missingEventTimeRefs = links.filter((link) => !hasString(link.event_time_iso)).map((link) => link.event_ref);
  const beforeEmergenceRefs = links
    .filter((link) => {
      if (!hasString(link.event_time_iso)) {
        return false;
      }
      const emergenceTime = resolveLinkedRegionEmergenceTime(link, regionIndex);
      return hasString(emergenceTime) && Date.parse(link.event_time_iso) < Date.parse(emergenceTime);
    })
    .map((link) => link.event_ref);
  const oversizedSunquakeOffsets = links
    .filter((link) => link.event_type === "sunquake" && hasNumber(link.time_offset_minutes))
    .filter((link) => Math.abs(link.time_offset_minutes as number) > expectedSummary.max_sunquake_time_offset_minutes)
    .map((link) => ({ event_ref: link.event_ref, time_offset_minutes: link.time_offset_minutes ?? null }));
  const actualSummary = mergeMetadataSummary(
    {
      link_count: links.length,
      missing_event_time_refs: missingEventTimeRefs,
      links_before_region_emergence: beforeEmergenceRefs,
      oversized_sunquake_offsets: oversizedSunquakeOffsets,
    },
    eventLinkage?.metadata,
    activeRegions?.metadata,
  );

  if (!eventLinkage) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_event_linkage_missing",
      actual_summary: actualSummary,
      notes: ["No solar event-linkage section was available for the event-chronology alignment check."],
    });
  }

  if (links.length === 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_event_linkage_chronology_incomplete",
      actual_summary: actualSummary,
      notes: ["Chronology alignment cannot be checked because the event-linkage section has no links."],
    });
  }

  if (missingEventTimeRefs.length > 0 || beforeEmergenceRefs.length > 0 || oversizedSunquakeOffsets.length > 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_event_linkage_chronology_incomplete",
      actual_summary: actualSummary,
      notes: ["One or more linked events are missing timestamps, precede the linked-region emergence context, or exceed the anchored sunquake timing offset."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Linked event timestamps remain chronologically aligned with the active-region context."],
  });
};

const buildRegionIdentifierConsistencyContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.event_linkage.region_identifier_consistency_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_consistent_link_count: number;
  };
  const eventLinkage = request.solar_baseline?.solar_event_linkage;
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const links = getSolarEventLinks(request);
  const regionIndex = buildActiveRegionIdentifierIndex(activeRegions);
  const consistentLinkCount = links.filter((link) => isEventLinkIdentifierConsistent(link, regionIndex)).length;
  const inconsistentEventRefs = links
    .filter((link) => !isEventLinkIdentifierConsistent(link, regionIndex))
    .map((link) => link.event_ref);
  const actualSummary = mergeMetadataSummary(
    {
      link_count: links.length,
      consistent_link_count: consistentLinkCount,
      inconsistent_event_refs: inconsistentEventRefs,
      active_region_region_id_count: regionIndex.regionIds.size,
      active_region_noaa_id_count: regionIndex.noaaRegionIds.size,
      active_region_harp_id_count: regionIndex.harpIds.size,
    },
    eventLinkage?.metadata,
    activeRegions?.metadata,
  );

  if (!eventLinkage) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_event_linkage_missing",
      actual_summary: actualSummary,
      notes: ["No solar event-linkage section was available for the region-identifier consistency check."],
    });
  }

  if (consistentLinkCount < expectedSummary.minimum_consistent_link_count || inconsistentEventRefs.length > 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_event_linkage_region_identifier_inconsistent",
      actual_summary: actualSummary,
      notes: ["Linked event identifiers do not resolve consistently against the active-region region, NOAA, or HARP identifiers."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Linked event identifiers resolve consistently against the active-region context."],
  });
};

const buildTopologySpotRegionCoronaContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.topology_linkage.spot_region_corona_context;
  const topology = request.solar_baseline?.solar_topology_linkage;
  const coronalField = request.solar_baseline?.solar_coronal_field;
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const sunspotCatalog = request.solar_baseline?.solar_sunspot_catalog;
  const links = getSolarTopologyLinks(request);
  const activeRegionIndex = buildActiveRegionIdentifierIndex(activeRegions);
  const sunspotIndex = buildSunspotIdentifierIndex(sunspotCatalog);
  const validLinks = links.filter((link) =>
    (link.linked_spot_ids?.some((spotId) => sunspotIndex.spotIds.has(spotId)) ?? false)
    && topologyLinkHasAnyRegionIdentifier(link)
    && hasString(link.linked_pfss_solution_ref)
    && link.linked_pfss_solution_ref === coronalField?.pfss_solution_ref
    && topologyLinkHasOpenFieldContext(link),
  );
  const inconsistentLinkIds = links
    .filter((link) => !topologyLinkIdentifiersConsistent({ link, activeRegionIndex, sunspotIndex }))
    .map((link) => link.link_id);
  const actualSummary = mergeMetadataSummary(
    {
      topology_link_count: links.length,
      valid_surface_corona_link_count: validLinks.length,
      linked_spot_count: links.reduce((count, link) => count + (link.linked_spot_ids?.length ?? 0), 0),
      inconsistent_link_ids: inconsistentLinkIds,
      pfss_solution_ref: coronalField?.pfss_solution_ref ?? null,
    },
    topology?.metadata,
    coronalField?.metadata,
    activeRegions?.metadata,
    sunspotCatalog?.metadata,
  );

  if (!topology) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_topology_linkage_missing",
      actual_summary: actualSummary,
      notes: ["No solar topology-linkage section was available for the surface-to-corona linkage check."],
    });
  }

  if (validLinks.length === 0 || inconsistentLinkIds.length > 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_topology_linkage_surface_corona_missing",
      actual_summary: actualSummary,
      notes: ["Spot, region, and PFSS/open-field topology context are not linked strongly enough to support the observed topology baseline."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["At least one topology link ties spot, region, and PFSS/open-field context into the same observed system."],
  });
};

const buildTopologyOpenFluxPolarFieldContinuityCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.topology_linkage.open_flux_polar_field_continuity_context;
  const topology = request.solar_baseline?.solar_topology_linkage;
  const coronalField = request.solar_baseline?.solar_coronal_field;
  const magneticMemory = request.solar_baseline?.solar_magnetic_memory;
  const links = getSolarTopologyLinks(request);
  const validLinks = links.filter((link) =>
    topologyLinkHasOpenFieldContext(link)
    && (!hasString(link.linked_open_field_map_ref) || link.linked_open_field_map_ref === coronalField?.open_field_map_ref)
    && (link.linked_coronal_hole_refs?.every((ref) => coronalField?.coronal_hole_refs?.includes(ref) ?? false) ?? true)
    && hasString(link.linked_polar_field_ref)
    && hasString(link.linked_axial_dipole_ref)
    && link.linked_polar_field_ref === magneticMemory?.polar_field_history_ref
    && link.linked_axial_dipole_ref === magneticMemory?.axial_dipole_history_ref,
  );
  const actualSummary = mergeMetadataSummary(
    {
      topology_link_count: links.length,
      continuity_link_count: validLinks.length,
      linked_open_field_map_ref_count: links.filter((link) => hasString(link.linked_open_field_map_ref)).length,
      linked_coronal_hole_ref_count: links.reduce((count, link) => count + (link.linked_coronal_hole_refs?.length ?? 0), 0),
      linked_polar_field_ref: magneticMemory?.polar_field_history_ref ?? null,
      linked_axial_dipole_ref: magneticMemory?.axial_dipole_history_ref ?? null,
    },
    topology?.metadata,
    coronalField?.metadata,
    magneticMemory?.metadata,
  );

  if (!topology) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_topology_linkage_missing",
      actual_summary: actualSummary,
      notes: ["No solar topology-linkage section was available for the open-flux continuity check."],
    });
  }

  if (validLinks.length === 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_topology_linkage_open_flux_missing",
      actual_summary: actualSummary,
      notes: ["Topology links do not connect open-field/coronal-hole context back to the polar-field and axial-dipole continuity layer."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Topology links retain explicit continuity between open-field context and polar-field/axial-dipole history."],
  });
};

const buildTopologyEventContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.topology_linkage.event_topology_context;
  const topology = request.solar_baseline?.solar_topology_linkage;
  const coronalField = request.solar_baseline?.solar_coronal_field;
  const flareRefs = new Set(request.solar_baseline?.solar_flare_catalog?.event_refs ?? []);
  const cmeRefs = new Set(request.solar_baseline?.solar_cme_catalog?.event_refs ?? []);
  const links = getSolarTopologyLinks(request);
  const linkedEventCount = links.reduce(
    (count, link) => count + (link.linked_flare_refs?.filter((ref) => flareRefs.has(ref)).length ?? 0)
      + (link.linked_cme_refs?.filter((ref) => cmeRefs.has(ref)).length ?? 0),
    0,
  );
  const validLinks = links.filter((link) =>
    topologyLinkHasLinkedEvents(link)
    && hasString(link.linked_pfss_solution_ref)
    && link.linked_pfss_solution_ref === coronalField?.pfss_solution_ref,
  );
  const actualSummary = mergeMetadataSummary(
    {
      topology_link_count: links.length,
      linked_event_count: linkedEventCount,
      valid_event_topology_link_count: validLinks.length,
      linked_flare_ref_count: links.reduce((count, link) => count + (link.linked_flare_refs?.length ?? 0), 0),
      linked_cme_ref_count: links.reduce((count, link) => count + (link.linked_cme_refs?.length ?? 0), 0),
    },
    topology?.metadata,
    coronalField?.metadata,
    request.solar_baseline?.solar_flare_catalog?.metadata,
    request.solar_baseline?.solar_cme_catalog?.metadata,
  );

  if (!topology) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_topology_linkage_missing",
      actual_summary: actualSummary,
      notes: ["No solar topology-linkage section was available for the event-to-topology association check."],
    });
  }

  if (linkedEventCount === 0 || validLinks.length === 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_topology_linkage_event_context_incomplete",
      actual_summary: actualSummary,
      notes: ["Topology links do not tie linked flare/CME events back into the PFSS-style coronal context strongly enough."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Linked eruptive events resolve back through explicit topology links into the coronal-field context."],
  });
};

const buildTopologyRoleContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.topology_linkage.topology_role_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_role_count: number;
    allowed_roles: string[];
  };
  const topology = request.solar_baseline?.solar_topology_linkage;
  const links = getSolarTopologyLinks(request);
  const populatedRoles = sortArray(
    links
      .map((link) => link.topology_role)
      .filter(hasString),
  );
  const invalidRoles = populatedRoles.filter((role) => !expectedSummary.allowed_roles.includes(role));
  const actualSummary = mergeMetadataSummary(
    {
      topology_link_count: links.length,
      populated_role_count: populatedRoles.length,
      unique_roles: sortArray([...new Set(populatedRoles)]),
      invalid_roles: sortArray(invalidRoles),
    },
    topology?.metadata,
  );

  if (!topology) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_topology_linkage_missing",
      actual_summary: actualSummary,
      notes: ["No solar topology-linkage section was available for the topology-role check."],
    });
  }

  if (populatedRoles.length < expectedSummary.minimum_role_count || invalidRoles.length > 0 || links.some((link) => !hasString(link.topology_role))) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_topology_linkage_role_missing",
      actual_summary: actualSummary,
      notes: ["Topology links are missing required topology-role semantics or use roles outside the anchored allowlist."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Topology links carry explicit machine-readable topology roles compatible with the anchored baseline."],
  });
};

const buildTopologyChronologyAlignmentCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.topology_linkage.chronology_alignment_context;
  const topology = request.solar_baseline?.solar_topology_linkage;
  const activeRegionIndex = buildActiveRegionIdentifierIndex(request.solar_baseline?.solar_active_regions);
  const sunspotIndex = buildSunspotIdentifierIndex(request.solar_baseline?.solar_sunspot_catalog);
  const eventTimeIndex = buildEventTimeIndex(getSolarEventLinks(request));
  const links = getSolarTopologyLinks(request);
  const missingWindowLinkIds = links
    .filter((link) => !hasString(link.time_window_start) || !hasString(link.time_window_end))
    .map((link) => link.link_id);
  const invalidWindowLinkIds = links
    .filter((link) =>
      hasString(link.time_window_start)
      && hasString(link.time_window_end)
      && Date.parse(link.time_window_start) > Date.parse(link.time_window_end),
    )
    .map((link) => link.link_id);
  const outOfWindowEventRefs = links.flatMap((link) => {
    if (!hasString(link.time_window_start) || !hasString(link.time_window_end)) {
      return [];
    }
    const start = Date.parse(link.time_window_start);
    const end = Date.parse(link.time_window_end);
    return [...(link.linked_flare_refs ?? []), ...(link.linked_cme_refs ?? [])].filter((eventRef) => {
      const eventTime = eventTimeIndex.get(eventRef);
      return hasString(eventTime) && (Date.parse(eventTime) < start || Date.parse(eventTime) > end);
    });
  });
  const beforeEmergenceLinkIds = links.filter((link) => {
    if (!hasString(link.time_window_end)) {
      return false;
    }
    const windowEnd = Date.parse(link.time_window_end);
    const emergenceCandidates = [
      hasString(link.linked_region_id) ? activeRegionIndex.emergenceTimesByRegionId.get(link.linked_region_id) ?? null : null,
      hasString(link.linked_noaa_region_id) ? activeRegionIndex.emergenceTimesByNoaaId.get(link.linked_noaa_region_id) ?? null : null,
      hasString(link.linked_harp_id) ? activeRegionIndex.emergenceTimesByHarpId.get(link.linked_harp_id) ?? null : null,
      ...(link.linked_spot_ids ?? []).map((spotId) => sunspotIndex.spotsById.get(spotId)?.emergence_time_iso ?? null),
    ].filter(hasString);
    return emergenceCandidates.some((emergenceTime) => Date.parse(emergenceTime) > windowEnd);
  }).map((link) => link.link_id);
  const actualSummary = mergeMetadataSummary(
    {
      topology_link_count: links.length,
      missing_window_link_ids: missingWindowLinkIds,
      invalid_window_link_ids: invalidWindowLinkIds,
      out_of_window_event_refs: sortArray(outOfWindowEventRefs),
      before_emergence_link_ids: beforeEmergenceLinkIds,
    },
    topology?.metadata,
    request.solar_baseline?.solar_active_regions?.metadata,
    request.solar_baseline?.solar_sunspot_catalog?.metadata,
    request.solar_baseline?.solar_event_linkage?.metadata,
  );

  if (!topology) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_topology_linkage_missing",
      actual_summary: actualSummary,
      notes: ["No solar topology-linkage section was available for the chronology-alignment check."],
    });
  }

  if (missingWindowLinkIds.length > 0 || invalidWindowLinkIds.length > 0 || outOfWindowEventRefs.length > 0 || beforeEmergenceLinkIds.length > 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_topology_linkage_chronology_incomplete",
      actual_summary: actualSummary,
      notes: ["Topology-linkage time windows are missing, invalid, or misaligned with linked events and emergence context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Topology-linkage windows align cleanly with linked events and emergence context."],
  });
};

const buildTopologyIdentifierConsistencyCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.topology_linkage.identifier_consistency_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_consistent_link_count: number;
  };
  const topology = request.solar_baseline?.solar_topology_linkage;
  const activeRegionIndex = buildActiveRegionIdentifierIndex(request.solar_baseline?.solar_active_regions);
  const sunspotIndex = buildSunspotIdentifierIndex(request.solar_baseline?.solar_sunspot_catalog);
  const links = getSolarTopologyLinks(request);
  const consistentLinks = links.filter((link) => topologyLinkIdentifiersConsistent({ link, activeRegionIndex, sunspotIndex }));
  const inconsistentLinkIds = links
    .filter((link) => !topologyLinkIdentifiersConsistent({ link, activeRegionIndex, sunspotIndex }))
    .map((link) => link.link_id);
  const actualSummary = mergeMetadataSummary(
    {
      topology_link_count: links.length,
      consistent_link_count: consistentLinks.length,
      inconsistent_link_ids: inconsistentLinkIds,
      spot_count: sunspotIndex.spotIds.size,
      active_region_count: activeRegionIndex.regionIds.size,
    },
    topology?.metadata,
    request.solar_baseline?.solar_active_regions?.metadata,
    request.solar_baseline?.solar_sunspot_catalog?.metadata,
  );

  if (!topology) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_topology_linkage_missing",
      actual_summary: actualSummary,
      notes: ["No solar topology-linkage section was available for the cross-identifier consistency check."],
    });
  }

  if (consistentLinks.length < expectedSummary.minimum_consistent_link_count || inconsistentLinkIds.length > 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_topology_linkage_identifier_inconsistent",
      actual_summary: actualSummary,
      notes: ["Topology-link identifiers do not resolve coherently across spot, region, NOAA, and HARP fields."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Topology-link identifiers resolve coherently across the spot and active-region layers."],
  });
};

const buildCycleIrradianceContinuityCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cycle.irradiance_continuity;
  const expectedSummary = anchor.expected_summary as {
    required_any_ref: string[];
    preferred_instrument_keywords: string[];
  };
  const irradiance = request.solar_baseline?.solar_irradiance_series;
  const hasRequiredRef = expectedSummary.required_any_ref.some((field) =>
    hasString((irradiance as Record<string, unknown> | undefined)?.[field]),
  );
  const instrumentMatch = getInstrumentKeywordMatch(irradiance?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      tsi_ref: irradiance?.tsi_ref ?? null,
      xray_ref: irradiance?.xray_ref ?? null,
      instrument: irradiance?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    irradiance?.metadata,
  );

  if (!irradiance) {
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      reason_code: "solar_irradiance_series_missing",
      actual_summary: actualSummary,
      notes: ["No irradiance continuity section was available for the observed cycle baseline."],
    });
  }

  if (hasRequiredRef && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Irradiance continuity provides the anchored observed-cycle context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "warn",
    reason_code: "solar_irradiance_series_incomplete",
    actual_summary: actualSummary,
    notes: ["Irradiance continuity is only advisory-strength for the observed cycle baseline."],
  });
};

const buildFlareCatalogCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.eruptive.flare_catalog;
  const expectedSummary = anchor.expected_summary as {
    minimum_flare_count: number;
    preferred_instrument_keywords: string[];
  };
  const flareCatalog = request.solar_baseline?.solar_flare_catalog;
  const eventRefCount = flareCatalog?.event_refs?.length ?? 0;
  const flareCount = flareCatalog?.flare_count ?? null;
  const strongestGoesClass = flareCatalog?.strongest_goes_class ?? null;
  const instrumentMatch = getInstrumentKeywordMatch(flareCatalog?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      flare_count: flareCount,
      event_ref_count: eventRefCount,
      strongest_goes_class: strongestGoesClass,
      instrument: flareCatalog?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    flareCatalog?.metadata,
  );

  if (!flareCatalog) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_flare_catalog_missing",
      actual_summary: actualSummary,
      notes: ["No flare catalog section was available for the observed eruptive baseline."],
    });
  }

  const hasEvents = (hasNumber(flareCount) && flareCount >= expectedSummary.minimum_flare_count)
    || eventRefCount >= expectedSummary.minimum_flare_count;
  if (hasEvents && hasString(strongestGoesClass) && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Flare catalog includes anchored event coverage plus strongest GOES class context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_flare_catalog_incomplete",
    actual_summary: actualSummary,
    notes: ["Flare catalog is present but missing anchored event coverage or strongest GOES class context."],
  });
};

const buildCmeCatalogCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.eruptive.cme_catalog;
  const expectedSummary = anchor.expected_summary as {
    minimum_cme_count: number;
    preferred_instrument_keywords: string[];
  };
  const cmeCatalog = request.solar_baseline?.solar_cme_catalog;
  const eventRefCount = cmeCatalog?.event_refs?.length ?? 0;
  const sourceRegionRefCount = cmeCatalog?.source_region_refs?.length ?? 0;
  const cmeCount = cmeCatalog?.cme_count ?? null;
  const instrumentMatch = getInstrumentKeywordMatch(cmeCatalog?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      cme_count: cmeCount,
      event_ref_count: eventRefCount,
      source_region_ref_count: sourceRegionRefCount,
      instrument: cmeCatalog?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    cmeCatalog?.metadata,
  );

  if (!cmeCatalog) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_cme_catalog_missing",
      actual_summary: actualSummary,
      notes: ["No CME catalog section was available for the observed eruptive baseline."],
    });
  }

  if (
    ((hasNumber(cmeCount) && cmeCount >= expectedSummary.minimum_cme_count) || eventRefCount >= expectedSummary.minimum_cme_count)
    && instrumentMatch !== false
  ) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["CME catalog includes anchored event coverage."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_cme_catalog_incomplete",
    actual_summary: actualSummary,
    notes: ["CME catalog is present but does not include anchored event coverage."],
  });
};

const buildEruptiveIrradianceContinuityCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.eruptive.irradiance_continuity;
  const expectedSummary = anchor.expected_summary as {
    preferred_eruptive_refs: string[];
    fallback_ref: string;
    preferred_instrument_keywords: string[];
  };
  const irradiance = request.solar_baseline?.solar_irradiance_series;
  const hasFallbackRef = hasString((irradiance as Record<string, unknown> | undefined)?.[expectedSummary.fallback_ref]);
  const hasPreferredEruptiveRef = expectedSummary.preferred_eruptive_refs.some((field) =>
    hasString((irradiance as Record<string, unknown> | undefined)?.[field]),
  );
  const instrumentMatch = getInstrumentKeywordMatch(irradiance?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      tsi_ref: irradiance?.tsi_ref ?? null,
      euv_ref: irradiance?.euv_ref ?? null,
      xray_ref: irradiance?.xray_ref ?? null,
      instrument: irradiance?.metadata?.instrument ?? null,
      instrument_keyword_match: instrumentMatch,
    },
    irradiance?.metadata,
  );

  if (!irradiance) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_irradiance_series_missing",
      actual_summary: actualSummary,
      notes: ["No irradiance continuity section was available for the observed eruptive baseline."],
    });
  }

  if (hasPreferredEruptiveRef && instrumentMatch !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Irradiance continuity includes anchored EUV or X-ray context for the eruptive baseline."],
    });
  }

  if (hasFallbackRef) {
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      notes: ["Only TSI continuity is available; EUV or X-ray context would satisfy the preferred anchored eruptive support."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "solar_irradiance_series_incomplete",
    actual_summary: actualSummary,
    notes: ["Irradiance continuity is present but does not include usable anchored TSI, EUV, or X-ray refs."],
  });
};

const buildSourceRegionLinkageCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.eruptive.source_region_linkage;
  const flareCatalog = request.solar_baseline?.solar_flare_catalog;
  const cmeCatalog = request.solar_baseline?.solar_cme_catalog;
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const magnetogram = request.solar_baseline?.solar_magnetogram;
  const flareSourceRegionCount = flareCatalog?.source_region_refs?.length ?? 0;
  const cmeSourceRegionCount = cmeCatalog?.source_region_refs?.length ?? 0;
  const activeRegionRefCount = activeRegions?.region_refs?.length ?? 0;
  const magnetogramPatchCount = magnetogram?.active_region_patch_refs?.length ?? 0;
  const actualSummary = mergeMetadataSummary(
    {
      flare_source_region_ref_count: flareSourceRegionCount,
      cme_source_region_ref_count: cmeSourceRegionCount,
      active_region_ref_count: activeRegionRefCount,
      magnetogram_patch_count: magnetogramPatchCount,
    },
    request.solar_baseline?.solar_flare_catalog?.metadata,
    request.solar_baseline?.solar_cme_catalog?.metadata,
    request.solar_baseline?.solar_active_regions?.metadata,
    request.solar_baseline?.solar_magnetogram?.metadata,
  );

  if (flareSourceRegionCount > 0 || cmeSourceRegionCount > 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Explicit source-region linkage is available for at least one anchored eruptive catalog."],
    });
  }

  if (activeRegionRefCount > 0 || magnetogramPatchCount > 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      notes: ["Eruptive catalogs only have indirect active-region or magnetogram linkage in this anchored phase."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "warn",
    actual_summary: actualSummary,
    notes: ["No source-region linkage is available yet for the anchored eruptive observed baseline."],
  });
};

const buildCrossLayerInteriorResidualCoherenceCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cross_layer_consistency.interior_residual_coherence;
  const expectedSummary = anchor.expected_summary as {
    preferred_max_mean_hydrostatic_fractional_residual?: number;
    preferred_max_sound_speed_fractional_residual?: number;
    report_missing_required_refs?: boolean;
  };
  const interior = request.solar_baseline?.solar_interior_profile;
  const residuals = request.solar_baseline?.solar_structural_residuals;
  const meanHydrostaticResidual = residuals?.summary?.mean_hydrostatic_fractional_residual ?? null;
  const maxSoundSpeedResidual = residuals?.summary?.max_sound_speed_fractional_residual ?? null;
  const missingRequiredRefs = sortUniqueStrings([
    !interior ? "solar_interior_profile" : null,
    !residuals ? "solar_structural_residuals" : null,
    residuals && !hasString(residuals.hydrostatic_residual_ref)
      ? "solar_structural_residuals.hydrostatic_residual_ref"
      : null,
    residuals && !hasString(residuals.sound_speed_residual_ref)
      ? "solar_structural_residuals.sound_speed_residual_ref"
      : null,
  ]);
  const actualSummary = mergeMetadataSummary(
    {
      has_interior_profile: Boolean(interior),
      convection_zone_base_rsun: interior?.summary?.convection_zone_base_rsun ?? null,
      envelope_helium_fraction: interior?.summary?.envelope_helium_fraction ?? null,
      hydrostatic_residual_ref: residuals?.hydrostatic_residual_ref ?? null,
      sound_speed_residual_ref: residuals?.sound_speed_residual_ref ?? null,
      missing_required_refs: missingRequiredRefs,
      mean_hydrostatic_fractional_residual: meanHydrostaticResidual,
      max_sound_speed_fractional_residual: maxSoundSpeedResidual,
    },
    interior?.metadata,
    residuals?.metadata,
  );

  if (!interior || !residuals || !hasString(residuals.hydrostatic_residual_ref) || !hasString(residuals.sound_speed_residual_ref)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_cross_layer_structural_context_incomplete",
      actual_summary: actualSummary,
      mismatch_fields: expectedSummary.report_missing_required_refs === false
        ? undefined
        : { missing_required_refs: missingRequiredRefs },
      notes: ["Cross-layer structural coherence requires the interior profile to stay paired with explicit hydrostatic and sound-speed residual evidence."],
    });
  }

  if (
    (hasNumber(meanHydrostaticResidual)
      && hasNumber(expectedSummary.preferred_max_mean_hydrostatic_fractional_residual)
      && meanHydrostaticResidual > expectedSummary.preferred_max_mean_hydrostatic_fractional_residual)
    || (hasNumber(maxSoundSpeedResidual)
      && hasNumber(expectedSummary.preferred_max_sound_speed_fractional_residual)
      && maxSoundSpeedResidual > expectedSummary.preferred_max_sound_speed_fractional_residual)
  ) {
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      notes: ["Interior and residual context remain linked, but one or more residual summaries sit outside the preferred cross-layer closure band."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Interior profile summaries remain paired with explicit hydrostatic and sound-speed residual evidence."],
  });
};

const buildCrossLayerModeResidualCoherenceCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cross_layer_consistency.mode_residual_coherence;
  const expectedSummary = anchor.expected_summary as {
    minimum_mode_count: number;
    report_missing_required_refs?: boolean;
  };
  const modes = request.solar_baseline?.solar_global_modes;
  const residuals = request.solar_baseline?.solar_structural_residuals;
  const lowDegreeModeCount = modes?.low_degree_mode_count ?? null;
  const missingRequiredRefs = sortUniqueStrings([
    !modes ? "solar_global_modes" : null,
    !residuals ? "solar_structural_residuals" : null,
    modes && !hasString(modes.mode_table_ref) ? "solar_global_modes.mode_table_ref" : null,
    !hasNumber(lowDegreeModeCount) || lowDegreeModeCount < expectedSummary.minimum_mode_count
      ? "solar_global_modes.low_degree_mode_count"
      : null,
    residuals && !hasString(residuals.sound_speed_residual_ref)
      ? "solar_structural_residuals.sound_speed_residual_ref"
      : null,
  ]);
  const actualSummary = mergeMetadataSummary(
    {
      mode_table_ref: modes?.mode_table_ref ?? null,
      detail_ref: modes?.detail_ref ?? null,
      splitting_ref: modes?.splitting_ref ?? null,
      low_degree_mode_count: lowDegreeModeCount,
      sound_speed_residual_ref: residuals?.sound_speed_residual_ref ?? null,
      missing_required_refs: missingRequiredRefs,
    },
    modes?.metadata,
    residuals?.metadata,
  );

  if (
    !modes
    || !residuals
    || !hasString(modes.mode_table_ref)
    || !hasNumber(lowDegreeModeCount)
    || lowDegreeModeCount < expectedSummary.minimum_mode_count
    || !hasString(residuals.sound_speed_residual_ref)
  ) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_cross_layer_mode_residual_incomplete",
      actual_summary: actualSummary,
      mismatch_fields: expectedSummary.report_missing_required_refs === false
        ? undefined
        : { missing_required_refs: missingRequiredRefs },
      notes: ["Cross-layer seismic coherence requires global-mode support to remain paired with an explicit sound-speed residual ref and minimum low-degree mode coverage."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Global-mode support remains paired with the sound-speed residual context expected for cross-layer structural closure."],
  });
};

const buildCrossLayerRotationResidualCoherenceCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cross_layer_consistency.rotation_residual_coherence;
  const expectedSummary = anchor.expected_summary as {
    preferred_max_rotation_residual_nhz?: number;
    report_missing_required_refs?: boolean;
  };
  const interior = request.solar_baseline?.solar_interior_profile;
  const modes = request.solar_baseline?.solar_global_modes;
  const residuals = request.solar_baseline?.solar_structural_residuals;
  const hasRotationSupport = hasString(modes?.splitting_ref) || hasString(interior?.rotation_profile_ref);
  const maxRotationResidual = residuals?.summary?.max_rotation_residual_nhz ?? null;
  const missingRequiredRefs = sortUniqueStrings([
    !residuals ? "solar_structural_residuals" : null,
    residuals && !hasString(residuals.rotation_residual_ref)
      ? "solar_structural_residuals.rotation_residual_ref"
      : null,
    !hasRotationSupport && !hasString(modes?.splitting_ref) ? "solar_global_modes.splitting_ref" : null,
    !hasRotationSupport && !hasString(interior?.rotation_profile_ref)
      ? "solar_interior_profile.rotation_profile_ref"
      : null,
  ]);
  const actualSummary = mergeMetadataSummary(
    {
      rotation_profile_ref: interior?.rotation_profile_ref ?? null,
      splitting_ref: modes?.splitting_ref ?? null,
      rotation_residual_ref: residuals?.rotation_residual_ref ?? null,
      has_rotation_support: hasRotationSupport,
      missing_required_refs: missingRequiredRefs,
      max_rotation_residual_nhz: maxRotationResidual,
    },
    interior?.metadata,
    modes?.metadata,
    residuals?.metadata,
  );

  if (!residuals || !hasString(residuals.rotation_residual_ref) || !hasRotationSupport) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_cross_layer_rotation_incomplete",
      actual_summary: actualSummary,
      mismatch_fields: expectedSummary.report_missing_required_refs === false
        ? undefined
        : { missing_required_refs: missingRequiredRefs },
      notes: ["Cross-layer rotation coherence requires a rotation residual ref plus splitting or rotation-profile support."],
    });
  }

  if (
    hasNumber(maxRotationResidual)
    && hasNumber(expectedSummary.preferred_max_rotation_residual_nhz)
    && maxRotationResidual > expectedSummary.preferred_max_rotation_residual_nhz
  ) {
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      notes: ["Rotation residual support is present, but the residual summary sits outside the preferred cross-layer closure band."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Rotation residual context remains paired with splitting or rotation-profile support."],
  });
};

const buildCrossLayerCycleMemoryTopologyCoherenceCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cross_layer_consistency.cycle_memory_topology_coherence;
  const expectedSummary = anchor.expected_summary as {
    minimum_open_flux_links: number;
    minimum_memory_topology_links: number;
    require_exact_history_memory_ref_equality?: boolean;
    report_conflicting_ref_pairs?: boolean;
    report_missing_required_refs?: boolean;
    report_topology_link_ids_in_conflict?: boolean;
  };
  const cycleHistory = request.solar_baseline?.solar_cycle_history;
  const magneticMemory = request.solar_baseline?.solar_magnetic_memory;
  const coronalField = request.solar_baseline?.solar_coronal_field;
  const topology = request.solar_baseline?.solar_topology_linkage;
  const links = getSolarTopologyLinks(request);
  const historyAxialRef = cycleHistory?.axial_dipole_history_ref ?? null;
  const historyPolarRef = cycleHistory?.polar_field_history_ref ?? null;
  const memoryAxialRef = magneticMemory?.axial_dipole_history_ref ?? null;
  const memoryPolarRef = magneticMemory?.polar_field_history_ref ?? null;
  const pfssSolutionRef = coronalField?.pfss_solution_ref ?? null;
  const hasHistoryRefs = hasString(historyAxialRef) && hasString(historyPolarRef);
  const hasMemoryRefs = hasString(memoryAxialRef) && hasString(memoryPolarRef);
  const requireExactHistoryMemoryRefEquality = expectedSummary.require_exact_history_memory_ref_equality === true;
  const openFluxLinks = links.filter((link) => topologyLinkHasOpenFieldContext(link));
  const continuityLinks = links.filter((link) =>
    topologyLinkHasOpenFieldContext(link)
    && hasString(link.linked_axial_dipole_ref)
    && hasString(link.linked_polar_field_ref)
    && link.linked_axial_dipole_ref === memoryAxialRef
    && link.linked_polar_field_ref === memoryPolarRef
    && (!hasString(link.linked_pfss_solution_ref) || link.linked_pfss_solution_ref === pfssSolutionRef),
  );
  const conflictingRefPairs = normalizeConflictingRefPairs([
    ...(requireExactHistoryMemoryRefEquality
      ? [
          hasString(historyAxialRef) && hasString(memoryAxialRef) && historyAxialRef !== memoryAxialRef
            ? {
                left_ref: historyAxialRef,
                right_ref: memoryAxialRef,
                relation: "history_memory_axial_dipole",
              }
            : null,
          hasString(historyPolarRef) && hasString(memoryPolarRef) && historyPolarRef !== memoryPolarRef
            ? {
                left_ref: historyPolarRef,
                right_ref: memoryPolarRef,
                relation: "history_memory_polar_field",
              }
            : null,
        ]
      : []),
    ...links.flatMap((link) => [
      hasString(link.linked_axial_dipole_ref) && hasString(memoryAxialRef) && link.linked_axial_dipole_ref !== memoryAxialRef
        ? {
            left_ref: link.linked_axial_dipole_ref,
            right_ref: memoryAxialRef,
            relation: "topology_memory_axial_dipole",
          }
        : null,
      hasString(link.linked_polar_field_ref) && hasString(memoryPolarRef) && link.linked_polar_field_ref !== memoryPolarRef
        ? {
            left_ref: link.linked_polar_field_ref,
            right_ref: memoryPolarRef,
            relation: "topology_memory_polar_field",
          }
        : null,
      hasString(link.linked_pfss_solution_ref)
        && hasString(pfssSolutionRef)
        && link.linked_pfss_solution_ref !== pfssSolutionRef
        ? {
            left_ref: link.linked_pfss_solution_ref,
            right_ref: pfssSolutionRef,
            relation: "topology_coronal_pfss_solution",
          }
        : null,
    ]),
  ]);
  const topologyLinkIdsInConflict = sortUniqueStrings(
    links
      .filter((link) =>
        (hasString(link.linked_axial_dipole_ref) && hasString(memoryAxialRef) && link.linked_axial_dipole_ref !== memoryAxialRef)
        || (hasString(link.linked_polar_field_ref) && hasString(memoryPolarRef) && link.linked_polar_field_ref !== memoryPolarRef)
        || (hasString(link.linked_pfss_solution_ref)
          && hasString(pfssSolutionRef)
          && link.linked_pfss_solution_ref !== pfssSolutionRef))
      .map((link) => link.link_id),
  );
  const missingRequiredRefs = sortUniqueStrings([
    !cycleHistory ? "solar_cycle_history" : null,
    cycleHistory && !hasString(historyAxialRef) ? "solar_cycle_history.axial_dipole_history_ref" : null,
    cycleHistory && !hasString(historyPolarRef) ? "solar_cycle_history.polar_field_history_ref" : null,
    !magneticMemory ? "solar_magnetic_memory" : null,
    magneticMemory && !hasString(memoryAxialRef) ? "solar_magnetic_memory.axial_dipole_history_ref" : null,
    magneticMemory && !hasString(memoryPolarRef) ? "solar_magnetic_memory.polar_field_history_ref" : null,
    !coronalField ? "solar_coronal_field" : null,
    coronalField && !hasString(pfssSolutionRef) ? "solar_coronal_field.pfss_solution_ref" : null,
    !topology ? "solar_topology_linkage" : null,
  ]);
  const actualSummary = mergeMetadataSummary(
    {
      cycle_history_axial_dipole_ref: historyAxialRef,
      cycle_history_polar_field_ref: historyPolarRef,
      magnetic_memory_axial_dipole_ref: memoryAxialRef,
      magnetic_memory_polar_field_ref: memoryPolarRef,
      history_ref_coverage: hasHistoryRefs,
      magnetic_memory_ref_coverage: hasMemoryRefs,
      pfss_solution_ref: pfssSolutionRef,
      topology_link_count: links.length,
      open_flux_link_count: openFluxLinks.length,
      continuity_link_count: continuityLinks.length,
      conflicting_ref_pairs: conflictingRefPairs,
      topology_link_ids_in_conflict: topologyLinkIdsInConflict,
      missing_required_refs: missingRequiredRefs,
    },
    cycleHistory?.metadata,
    magneticMemory?.metadata,
    coronalField?.metadata,
    topology?.metadata,
  );

  if (
    !cycleHistory
    || !magneticMemory
    || !coronalField
    || !topology
    || !hasHistoryRefs
    || !hasMemoryRefs
    || openFluxLinks.length < expectedSummary.minimum_open_flux_links
    || continuityLinks.length < expectedSummary.minimum_memory_topology_links
  ) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_cross_layer_memory_topology_inconsistent",
      actual_summary: actualSummary,
      mismatch_fields: {
        ...(expectedSummary.report_conflicting_ref_pairs === false ? {} : { conflicting_ref_pairs: conflictingRefPairs }),
        ...(expectedSummary.report_missing_required_refs === false ? {} : { missing_required_refs: missingRequiredRefs }),
        ...(expectedSummary.report_topology_link_ids_in_conflict === false ? {} : { topology_link_ids_in_conflict: topologyLinkIdsInConflict }),
      },
      notes: ["Cycle history, magnetic memory, coronal field, and topology linkage do not currently form a coherent open-flux continuity chain."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Cycle-history, magnetic-memory, and topology-linkage refs remain coherent across the open-flux continuity chain."],
  });
};

const buildCrossLayerEventTopologyIdentifierCoherenceCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cross_layer_consistency.event_topology_identifier_coherence;
  const expectedSummary = anchor.expected_summary as {
    minimum_identifier_overlap_links: number;
    require_linked_event_overlap: boolean;
    report_conflicting_region_ids?: boolean;
    report_conflicting_noaa_ids?: boolean;
    report_conflicting_harp_ids?: boolean;
    report_event_refs_in_conflict?: boolean;
    report_topology_link_ids_in_conflict?: boolean;
  };
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const eventLinkage = request.solar_baseline?.solar_event_linkage;
  const topology = request.solar_baseline?.solar_topology_linkage;
  const activeRegionIndex = buildActiveRegionIdentifierIndex(activeRegions);
  const sunspotIndex = buildSunspotIdentifierIndex(request.solar_baseline?.solar_sunspot_catalog);
  const eventLinks = getSolarEventLinks(request);
  const topologyLinks = getSolarTopologyLinks(request);
  const eventTokens = new Set(
    eventLinks.flatMap((link) => [
      hasString(link.linked_region_id) ? `region:${link.linked_region_id}` : null,
      hasString(link.linked_noaa_region_id) ? `noaa:${link.linked_noaa_region_id}` : null,
      hasString(link.linked_harp_id) ? `harp:${link.linked_harp_id}` : null,
    ].filter(hasString)),
  );
  const topologyTokens = new Set(
    topologyLinks.flatMap((link) => [
      hasString(link.linked_region_id) ? `region:${link.linked_region_id}` : null,
      hasString(link.linked_noaa_region_id) ? `noaa:${link.linked_noaa_region_id}` : null,
      hasString(link.linked_harp_id) ? `harp:${link.linked_harp_id}` : null,
    ].filter(hasString)),
  );
  const identifierOverlap = sortArray([...eventTokens].filter((token) => topologyTokens.has(token)));
  const unmatchedIdentifierTokens = sortUniqueStrings([
    ...[...eventTokens].filter((token) => !topologyTokens.has(token)),
    ...[...topologyTokens].filter((token) => !eventTokens.has(token)),
  ]);
  const topologyEventRefs = new Set(
    topologyLinks.flatMap((link) => [...(link.linked_flare_refs ?? []), ...(link.linked_cme_refs ?? [])].filter(hasString)),
  );
  const eventRefOverlap = sortArray(eventLinks.map((link) => link.event_ref).filter((eventRef) => topologyEventRefs.has(eventRef)));
  const inconsistentEventLinks = eventLinks.filter((link) => !isEventLinkIdentifierConsistent(link, activeRegionIndex));
  const inconsistentEventRefs = inconsistentEventLinks.map((link) => link.event_ref);
  const inconsistentTopologyLinks = topologyLinks
    .filter((link) => !topologyLinkIdentifiersConsistent({ link, activeRegionIndex, sunspotIndex }));
  const inconsistentTopologyLinkIds = inconsistentTopologyLinks.map((link) => link.link_id);
  const overlappingEventsRequiredButMissing = expectedSummary.require_linked_event_overlap && eventRefOverlap.length === 0;
  const conflictingRegionIds = sortUniqueStrings([
    ...inconsistentEventLinks.map((link) => link.linked_region_id ?? null),
    ...inconsistentTopologyLinks.map((link) => link.linked_region_id ?? null),
    ...unmatchedIdentifierTokens
      .filter((token) => token.startsWith("region:"))
      .map((token) => token.slice("region:".length)),
  ]);
  const conflictingNoaaIds = sortUniqueStrings([
    ...inconsistentEventLinks.map((link) => link.linked_noaa_region_id ?? null),
    ...inconsistentTopologyLinks.map((link) => link.linked_noaa_region_id ?? null),
    ...unmatchedIdentifierTokens
      .filter((token) => token.startsWith("noaa:"))
      .map((token) => token.slice("noaa:".length)),
  ]);
  const conflictingHarpIds = sortUniqueStrings([
    ...inconsistentEventLinks.map((link) => link.linked_harp_id ?? null),
    ...inconsistentTopologyLinks.map((link) => link.linked_harp_id ?? null),
    ...unmatchedIdentifierTokens
      .filter((token) => token.startsWith("harp:"))
      .map((token) => token.slice("harp:".length)),
  ]);
  const eventRefsInConflict = sortUniqueStrings([
    ...inconsistentEventRefs,
    ...(overlappingEventsRequiredButMissing ? eventLinks.map((link) => link.event_ref) : []),
  ]);
  const topologyLinkIdsInConflict = sortUniqueStrings([
    ...inconsistentTopologyLinkIds,
    ...(overlappingEventsRequiredButMissing ? topologyLinks.map((link) => link.link_id) : []),
  ]);
  const actualSummary = mergeMetadataSummary(
    {
      active_region_count: activeRegionIndex.regionIds.size,
      event_link_count: eventLinks.length,
      topology_link_count: topologyLinks.length,
      identifier_overlap: identifierOverlap,
      unmatched_identifier_tokens: unmatchedIdentifierTokens,
      event_ref_overlap: eventRefOverlap,
      inconsistent_event_refs: inconsistentEventRefs,
      inconsistent_topology_link_ids: inconsistentTopologyLinkIds,
      conflicting_region_ids: conflictingRegionIds,
      conflicting_noaa_ids: conflictingNoaaIds,
      conflicting_harp_ids: conflictingHarpIds,
      event_refs_in_conflict: eventRefsInConflict,
      topology_link_ids_in_conflict: topologyLinkIdsInConflict,
    },
    activeRegions?.metadata,
    eventLinkage?.metadata,
    topology?.metadata,
  );

  if (
    !activeRegions
    || !eventLinkage
    || !topology
    || identifierOverlap.length < expectedSummary.minimum_identifier_overlap_links
    || inconsistentEventRefs.length > 0
    || inconsistentTopologyLinkIds.length > 0
    || overlappingEventsRequiredButMissing
  ) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_cross_layer_event_topology_inconsistent",
      actual_summary: actualSummary,
      mismatch_fields: {
        ...(expectedSummary.report_conflicting_region_ids === false ? {} : { conflicting_region_ids: conflictingRegionIds }),
        ...(expectedSummary.report_conflicting_noaa_ids === false ? {} : { conflicting_noaa_ids: conflictingNoaaIds }),
        ...(expectedSummary.report_conflicting_harp_ids === false ? {} : { conflicting_harp_ids: conflictingHarpIds }),
        ...(expectedSummary.report_event_refs_in_conflict === false ? {} : { event_refs_in_conflict: eventRefsInConflict }),
        ...(expectedSummary.report_topology_link_ids_in_conflict === false ? {} : { topology_link_ids_in_conflict: topologyLinkIdsInConflict }),
      },
      notes: ["Event-linkage and topology-linkage identifiers do not resolve back to the same active-region context."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Event-linkage and topology-linkage identifiers remain coherent across active-region context."],
  });
};

const buildCrossLayerChronologyMetadataAlignmentCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cross_layer_consistency.chronology_metadata_alignment;
  const expectedSummary = anchor.expected_summary as {
    coordinate_frame: string;
    carrington_rotation_spread_max: number;
    overlapping_time_ranges: boolean;
    require_topology_event_window_overlap: boolean;
    report_non_carrington_sections?: boolean;
    report_missing_time_range_sections?: boolean;
    report_out_of_window_event_refs?: boolean;
    report_topology_link_ids_in_conflict?: boolean;
  };
  const structuralResiduals = request.solar_baseline?.solar_structural_residuals;
  const cycleHistory = request.solar_baseline?.solar_cycle_history;
  const coronalField = request.solar_baseline?.solar_coronal_field;
  const eventLinkage = request.solar_baseline?.solar_event_linkage;
  const topology = request.solar_baseline?.solar_topology_linkage;
  const sectionMetadata = [
    { section: "solar_structural_residuals", metadata: structuralResiduals?.metadata ?? null },
    { section: "solar_cycle_history", metadata: cycleHistory?.metadata ?? null },
    { section: "solar_coronal_field", metadata: coronalField?.metadata ?? null },
    { section: "solar_event_linkage", metadata: eventLinkage?.metadata ?? null },
    { section: "solar_topology_linkage", metadata: topology?.metadata ?? null },
  ];
  const coordinateFrames = sortArray(
    [...new Set(sectionMetadata.map((entry) => entry.metadata?.coordinate_frame).filter(hasString))],
  );
  const nonCarringtonSections = sectionMetadata
    .filter((entry) => hasString(entry.metadata?.coordinate_frame) && entry.metadata?.coordinate_frame !== expectedSummary.coordinate_frame)
    .map((entry) => entry.section);
  const carringtonRotations = sectionMetadata
    .map((entry) => entry.metadata?.carrington_rotation)
    .filter(hasNumber);
  const carringtonSpread = carringtonRotations.length > 0
    ? Math.max(...carringtonRotations) - Math.min(...carringtonRotations)
    : null;
  const parsedTimeRanges = sectionMetadata
    .map((entry) => {
      const startIso = entry.metadata?.time_range?.start_iso;
      const endIso = entry.metadata?.time_range?.end_iso;
      const startMs = hasString(startIso) ? Date.parse(startIso) : Number.NaN;
      const endMs = hasString(endIso) ? Date.parse(endIso) : Number.NaN;
      return Number.isFinite(startMs) && Number.isFinite(endMs)
        ? { section: entry.section, startIso: startIso as string, endIso: endIso as string, startMs, endMs }
        : null;
    })
    .filter((entry): entry is { section: string; startIso: string; endIso: string; startMs: number; endMs: number } => entry !== null);
  const missingTimeRangeSections = sectionMetadata
    .filter((entry) => !entry.metadata?.time_range?.start_iso || !entry.metadata?.time_range?.end_iso)
    .map((entry) => entry.section);
  const overlappingWindow = parsedTimeRanges.length < 2
    ? true
    : Math.max(...parsedTimeRanges.map((entry) => entry.startMs)) <= Math.min(...parsedTimeRanges.map((entry) => entry.endMs));
  const topologyLinks = getSolarTopologyLinks(request);
  const eventTimeIndex = buildEventTimeIndex(getSolarEventLinks(request));
  const outOfWindowEventRefs = sortArray(
    topologyLinks.flatMap((link) => {
      if (!hasString(link.time_window_start) || !hasString(link.time_window_end)) {
        return [];
      }
      const startMs = Date.parse(link.time_window_start);
      const endMs = Date.parse(link.time_window_end);
      return [...(link.linked_flare_refs ?? []), ...(link.linked_cme_refs ?? [])]
        .filter(hasString)
        .filter((eventRef) => {
          const eventTime = eventTimeIndex.get(eventRef);
          return hasString(eventTime) && (Date.parse(eventTime) < startMs || Date.parse(eventTime) > endMs);
        });
    }),
  );
  const outOfWindowTopologyLinkIds = sortUniqueStrings(
    topologyLinks
      .filter((link) => {
        if (!hasString(link.time_window_start) || !hasString(link.time_window_end)) {
          return false;
        }
        const startMs = Date.parse(link.time_window_start);
        const endMs = Date.parse(link.time_window_end);
        return [...(link.linked_flare_refs ?? []), ...(link.linked_cme_refs ?? [])]
          .filter(hasString)
          .some((eventRef) => {
            const eventTime = eventTimeIndex.get(eventRef);
            return hasString(eventTime) && (Date.parse(eventTime) < startMs || Date.parse(eventTime) > endMs);
          });
      })
      .map((link) => link.link_id),
  );
  const actualSummary = mergeMetadataSummary(
    {
      coordinate_frames: coordinateFrames,
      non_carrington_sections: nonCarringtonSections,
      carrington_rotations: carringtonRotations.sort((left, right) => left - right),
      carrington_rotation_spread: carringtonSpread,
      parsed_time_range_sections: parsedTimeRanges.map((entry) => entry.section),
      missing_time_range_sections: missingTimeRangeSections,
      overlapping_time_ranges: overlappingWindow,
      topology_out_of_window_event_refs: outOfWindowEventRefs,
      topology_link_ids_in_conflict: outOfWindowTopologyLinkIds,
    },
    structuralResiduals?.metadata,
    cycleHistory?.metadata,
    coronalField?.metadata,
    eventLinkage?.metadata,
    topology?.metadata,
  );

  if (
    nonCarringtonSections.length > 0
    || (hasNumber(carringtonSpread) && carringtonSpread > expectedSummary.carrington_rotation_spread_max)
    || (expectedSummary.overlapping_time_ranges && !overlappingWindow)
    || (expectedSummary.require_topology_event_window_overlap && outOfWindowEventRefs.length > 0)
  ) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_cross_layer_metadata_misaligned",
      actual_summary: actualSummary,
      mismatch_fields: {
        ...(expectedSummary.report_non_carrington_sections === false ? {} : { non_carrington_sections: nonCarringtonSections }),
        ...(expectedSummary.report_missing_time_range_sections === false ? {} : { missing_time_range_sections: missingTimeRangeSections }),
        ...(expectedSummary.report_out_of_window_event_refs === false ? {} : { out_of_window_event_refs: outOfWindowEventRefs }),
        ...(expectedSummary.report_topology_link_ids_in_conflict === false ? {} : { topology_link_ids_in_conflict: outOfWindowTopologyLinkIds }),
      },
      notes: ["Cross-layer chronology or Carrington metadata are misaligned across the structural, cycle, coronal, topology, and event chain."],
    });
  }

  if (missingTimeRangeSections.length > 0) {
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      mismatch_fields: {
        ...(expectedSummary.report_missing_time_range_sections === false ? {} : { missing_time_range_sections: missingTimeRangeSections }),
      },
      notes: ["One or more cross-layer sections do not declare explicit time ranges, so chronology alignment remains advisory-only for those sections."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Cross-layer chronology and Carrington metadata remain aligned across the structural, cycle, coronal, topology, and event chain."],
  });
};

export const evaluateSolarInteriorClosureDiagnostics = (
  request: StarSimRequest,
): StarSimSolarClosureDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    convection_zone_depth: buildConvectionZoneDepthCheck(request, referencePack),
    envelope_helium_fraction: buildEnvelopeHeliumCheck(request, referencePack),
    low_degree_mode_support: buildLowDegreeModeSupportCheck(request, referencePack),
    neutrino_constraint_vector: buildNeutrinoConstraintVectorCheck(request, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    benchmark_pack_id: "solar_interior_closure_v1",
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
  };
};

const buildStructuralResidualHydrostaticCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.structural_residuals.hydrostatic_balance_context;
  const expectedSummary = anchor.expected_summary as {
    preferred_max_mean_fractional_residual?: number;
  };
  const residuals = request.solar_baseline?.solar_structural_residuals;
  const meanResidual = residuals?.summary?.mean_hydrostatic_fractional_residual;
  const actualSummary = mergeMetadataSummary(
    {
      hydrostatic_residual_ref: residuals?.hydrostatic_residual_ref ?? null,
      mean_hydrostatic_fractional_residual: meanResidual ?? null,
    },
    residuals?.metadata,
    request.solar_baseline?.solar_interior_profile?.metadata,
  );

  if (!residuals) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_structural_residuals_missing",
      actual_summary: actualSummary,
      notes: ["No solar structural-residual section was available for the hydrostatic residual check."],
    });
  }

  if (!hasString(residuals.hydrostatic_residual_ref)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_hydrostatic_residual_missing",
      actual_summary: actualSummary,
      notes: ["Structural residual closure requires an explicit hydrostatic residual ref."],
    });
  }

  if (hasNumber(meanResidual) && hasNumber(expectedSummary.preferred_max_mean_fractional_residual) && meanResidual > expectedSummary.preferred_max_mean_fractional_residual) {
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      notes: ["Hydrostatic residual evidence is present, but the reported mean residual sits outside the preferred anchored summary band."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Hydrostatic residual context is present for compact structural closure."],
  });
};

const buildStructuralResidualSoundSpeedCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.structural_residuals.sound_speed_residual_context;
  const expectedSummary = anchor.expected_summary as {
    preferred_max_fractional_residual?: number;
  };
  const residuals = request.solar_baseline?.solar_structural_residuals;
  const maxResidual = residuals?.summary?.max_sound_speed_fractional_residual;
  const actualSummary = mergeMetadataSummary(
    {
      sound_speed_residual_ref: residuals?.sound_speed_residual_ref ?? null,
      max_sound_speed_fractional_residual: maxResidual ?? null,
      global_mode_table_ref: request.solar_baseline?.solar_global_modes?.mode_table_ref ?? null,
    },
    residuals?.metadata,
    request.solar_baseline?.solar_global_modes?.metadata,
  );

  if (!residuals) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_structural_residuals_missing",
      actual_summary: actualSummary,
      notes: ["No solar structural-residual section was available for the sound-speed residual check."],
    });
  }

  if (!hasString(residuals.sound_speed_residual_ref)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_sound_speed_residual_missing",
      actual_summary: actualSummary,
      notes: ["Structural residual closure requires an explicit sound-speed residual ref."],
    });
  }

  if (hasNumber(maxResidual) && hasNumber(expectedSummary.preferred_max_fractional_residual) && maxResidual > expectedSummary.preferred_max_fractional_residual) {
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      notes: ["Sound-speed residual evidence is present, but the reported maximum fractional residual sits outside the preferred anchored summary band."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Sound-speed residual context is present for compact structural closure."],
  });
};

const buildStructuralResidualRotationCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.structural_residuals.rotation_residual_context;
  const expectedSummary = anchor.expected_summary as {
    preferred_max_rotation_residual_nhz?: number;
  };
  const residuals = request.solar_baseline?.solar_structural_residuals;
  const maxResidual = residuals?.summary?.max_rotation_residual_nhz;
  const actualSummary = mergeMetadataSummary(
    {
      rotation_residual_ref: residuals?.rotation_residual_ref ?? null,
      max_rotation_residual_nhz: maxResidual ?? null,
      rotation_profile_ref: request.solar_baseline?.solar_interior_profile?.rotation_profile_ref ?? null,
    },
    residuals?.metadata,
    request.solar_baseline?.solar_interior_profile?.metadata,
  );

  if (!residuals) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_structural_residuals_missing",
      actual_summary: actualSummary,
      notes: ["No solar structural-residual section was available for the rotation residual check."],
    });
  }

  if (!hasString(residuals.rotation_residual_ref)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_rotation_residual_missing",
      actual_summary: actualSummary,
      notes: ["Structural residual closure requires an explicit rotation residual ref."],
    });
  }

  if (hasNumber(maxResidual) && hasNumber(expectedSummary.preferred_max_rotation_residual_nhz) && maxResidual > expectedSummary.preferred_max_rotation_residual_nhz) {
    return buildCheck({
      anchor,
      referencePack,
      status: "warn",
      actual_summary: actualSummary,
      notes: ["Rotation residual evidence is present, but the reported maximum residual sits outside the preferred anchored summary band."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Rotation residual context is present for compact structural closure."],
  });
};

const buildStructuralResidualPressureScaleHeightCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.structural_residuals.pressure_scale_height_continuity_context;
  const residuals = request.solar_baseline?.solar_structural_residuals;
  const actualSummary = mergeMetadataSummary(
    {
      pressure_scale_height_ref: residuals?.pressure_scale_height_ref ?? null,
      pressure_scale_height_consistent: residuals?.summary?.pressure_scale_height_consistent ?? null,
    },
    residuals?.metadata,
  );

  if (!residuals) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_structural_residuals_missing",
      actual_summary: actualSummary,
      notes: ["No solar structural-residual section was available for the pressure-scale-height continuity check."],
    });
  }

  if (hasString(residuals.pressure_scale_height_ref) && residuals.summary?.pressure_scale_height_consistent !== false) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Pressure-scale-height continuity context is present."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "warn",
    reason_code: "solar_pressure_scale_height_incomplete",
    actual_summary: actualSummary,
    notes: ["Pressure-scale-height continuity context is advisory in this phase and is incomplete or explicitly inconsistent."],
  });
};

const buildStructuralResidualNeutrinoSeismicConsistencyCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.structural_residuals.neutrino_seismic_consistency_context;
  const residuals = request.solar_baseline?.solar_structural_residuals;
  const fallbackNeutrinoRef = request.solar_baseline?.solar_neutrino_constraints?.constraints_ref ?? null;
  const actualSummary = mergeMetadataSummary(
    {
      neutrino_consistency_ref: residuals?.neutrino_consistency_ref ?? null,
      fallback_neutrino_constraints_ref: fallbackNeutrinoRef,
    },
    residuals?.metadata,
    request.solar_baseline?.solar_neutrino_constraints?.metadata,
  );

  if (!residuals) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_structural_residuals_missing",
      actual_summary: actualSummary,
      notes: ["No solar structural-residual section was available for the neutrino-seismic consistency check."],
    });
  }

  if (hasString(residuals.neutrino_consistency_ref) || hasString(fallbackNeutrinoRef)) {
    return buildCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      notes: ["Neutrino-seismic consistency context is available directly or through the existing neutrino closure vector."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "warn",
    actual_summary: actualSummary,
    notes: ["Neutrino-seismic residual consistency remains advisory at current maturity and is not yet explicitly populated."],
  });
};

const buildStructuralResidualMetadataCoherenceCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.structural_residuals.residual_metadata_coherence_context;
  const expectedSummary = anchor.expected_summary as {
    preferred_coordinate_frame?: string;
    preferred_instrument_keywords?: string[];
  };
  const residuals = request.solar_baseline?.solar_structural_residuals;
  const metadata = residuals?.metadata ?? null;
  const instrumentMatch = getInstrumentKeywordMatch(metadata?.instrument, expectedSummary.preferred_instrument_keywords ?? []);
  const coordinateFrameMatch = !expectedSummary.preferred_coordinate_frame || !metadata?.coordinate_frame
    ? null
    : metadata.coordinate_frame === expectedSummary.preferred_coordinate_frame;
  const actualSummary = mergeMetadataSummary(
    {
      residual_window_label: residuals?.summary?.residual_window_label ?? null,
      instrument_keyword_match: instrumentMatch,
      coordinate_frame_match: coordinateFrameMatch,
      has_cadence: Boolean(metadata?.cadence),
    },
    metadata,
  );

  if (!residuals) {
    return buildCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "solar_structural_residuals_missing",
      actual_summary: actualSummary,
      notes: ["No solar structural-residual section was available for the metadata coherence check."],
    });
  }

  if (
    !hasString(residuals.summary?.residual_window_label)
    || !metadata?.cadence
    || coordinateFrameMatch === false
    || instrumentMatch === false
  ) {
    return buildCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "solar_structural_residual_metadata_incomplete",
      actual_summary: actualSummary,
      notes: ["Structural residual metadata are incomplete or inconsistent with the anchored residual product semantics."],
    });
  }

  return buildCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    notes: ["Structural residual metadata remain coherent and attributable for repeatable residual closure."],
  });
};

export const evaluateSolarStructuralResidualDiagnostics = (
  request: StarSimRequest,
): StarSimSolarStructuralResidualDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    hydrostatic_balance_context: buildStructuralResidualHydrostaticCheck(request, referencePack),
    sound_speed_residual_context: buildStructuralResidualSoundSpeedCheck(request, referencePack),
    rotation_residual_context: buildStructuralResidualRotationCheck(request, referencePack),
    pressure_scale_height_continuity_context: buildStructuralResidualPressureScaleHeightCheck(request, referencePack),
    neutrino_seismic_consistency_context: buildStructuralResidualNeutrinoSeismicConsistencyCheck(request, referencePack),
    residual_metadata_coherence_context: buildStructuralResidualMetadataCoherenceCheck(request, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    benchmark_pack_id: "solar_structural_residual_closure_v1",
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
  };
};

export const evaluateSolarCycleObservedDiagnostics = (
  request: StarSimRequest,
): StarSimSolarCycleDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    cycle_indices: buildCycleIndicesCheck(request, referencePack),
    chronology_window: buildCycleChronologyWindowCheck(request, referencePack),
    polarity_reversal_context: buildCyclePolarityReversalContextCheck(request, referencePack),
    butterfly_history: buildCycleButterflyHistoryCheck(request, referencePack),
    axial_dipole_history: buildCycleAxialDipoleHistoryCheck(request, referencePack),
    magnetogram_context: buildMagnetogramContextCheck(request, referencePack),
    active_region_context: buildActiveRegionContextCheck(request, referencePack),
    irradiance_continuity: buildCycleIrradianceContinuityCheck(request, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    benchmark_pack_id: "solar_cycle_observed_v1",
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
  };
};

export const evaluateSolarLocalHelioDiagnostics = (
  request: StarSimRequest,
): StarSimSolarLocalHelioDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    dopplergram_context: buildLocalHelioDopplergramContextCheck(request, referencePack),
    travel_time_or_holography_context: buildLocalHelioTravelTimeOrHolographyCheck(request, referencePack),
    sunquake_event_context: buildLocalHelioSunquakeEventContextCheck(request, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    benchmark_pack_id: "solar_local_helio_observed_v1",
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
  };
};

export const evaluateSolarSurfaceFlowDiagnostics = (
  request: StarSimRequest,
): StarSimSolarSurfaceFlowDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    differential_rotation_context: buildDifferentialRotationContextCheck(request, referencePack),
    meridional_flow_context: buildMeridionalFlowContextCheck(request, referencePack),
    active_region_geometry_context: buildActiveRegionGeometryContextCheck(request, referencePack),
    surface_transport_proxy_context: buildSurfaceTransportProxyContextCheck(request, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    benchmark_pack_id: "solar_surface_flow_observed_v1",
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
  };
};

export const evaluateSolarCoronalFieldDiagnostics = (
  request: StarSimRequest,
): StarSimSolarCoronalFieldDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    pfss_context: buildCoronalPfssContextCheck(request, referencePack),
    synoptic_boundary_context: buildCoronalSynopticBoundaryContextCheck(request, referencePack),
    open_field_topology_context: buildCoronalOpenFieldTopologyContextCheck(request, referencePack),
    source_region_linkage_context: buildCoronalSourceRegionLinkageContextCheck(request, referencePack),
    metadata_coherence_context: buildCoronalMetadataCoherenceContextCheck(request, referencePack),
    euv_coronal_context: buildCoronalEuvContextCheck(request, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    benchmark_pack_id: "solar_coronal_field_observed_v1",
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
  };
};

export const evaluateSolarMagneticMemoryDiagnostics = (
  request: StarSimRequest,
): StarSimSolarMagneticMemoryDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    axial_dipole_continuity_context: buildAxialDipoleContinuityContextCheck(request, referencePack),
    polar_field_continuity_context: buildPolarFieldContinuityContextCheck(request, referencePack),
    reversal_linkage_context: buildReversalLinkageContextCheck(request, referencePack),
    active_region_polarity_ordering_context: buildActiveRegionPolarityOrderingContextCheck(request, referencePack),
    hemisphere_bipolar_coverage_context: buildHemisphereBipolarCoverageContextCheck(request, referencePack),
    bipolar_region_proxy_context: buildBipolarRegionProxyContextCheck(request, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    benchmark_pack_id: "solar_magnetic_memory_observed_v1",
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
  };
};

export const evaluateSolarSpotRegionDiagnostics = (
  request: StarSimRequest,
): StarSimSolarSpotRegionDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    sunspot_catalog_context: buildSunspotCatalogContextCheck(request, referencePack),
    spot_geometry_context: buildSpotGeometryContextCheck(request, referencePack),
    spot_region_linkage_context: buildSpotRegionLinkageContextCheck(request, referencePack),
    bipolar_grouping_context: buildBipolarGroupingContextCheck(request, referencePack),
    polarity_tilt_context: buildPolarityTiltContextCheck(request, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    benchmark_pack_id: "solar_spot_region_observed_v1",
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
  };
};

export const evaluateSolarEventLinkageDiagnostics = (
  request: StarSimRequest,
): StarSimSolarEventLinkageDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    flare_region_linkage_context: buildFlareRegionLinkageContextCheck(request, referencePack),
    cme_region_linkage_context: buildCmeRegionLinkageContextCheck(request, referencePack),
    sunquake_flare_region_linkage_context: buildSunquakeFlareRegionLinkageContextCheck(request, referencePack),
    event_chronology_alignment_context: buildEventChronologyAlignmentContextCheck(request, referencePack),
    region_identifier_consistency_context: buildRegionIdentifierConsistencyContextCheck(request, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    benchmark_pack_id: "solar_event_association_observed_v1",
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
  };
};

export const evaluateSolarTopologyLinkageDiagnostics = (
  request: StarSimRequest,
): StarSimSolarTopologyLinkageDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    spot_region_corona_context: buildTopologySpotRegionCoronaContextCheck(request, referencePack),
    open_flux_polar_field_continuity_context: buildTopologyOpenFluxPolarFieldContinuityCheck(request, referencePack),
    event_topology_context: buildTopologyEventContextCheck(request, referencePack),
    topology_role_context: buildTopologyRoleContextCheck(request, referencePack),
    chronology_alignment_context: buildTopologyChronologyAlignmentCheck(request, referencePack),
    identifier_consistency_context: buildTopologyIdentifierConsistencyCheck(request, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    benchmark_pack_id: "solar_topology_linkage_observed_v1",
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
  };
};

export const evaluateSolarCrossLayerConsistencyDiagnostics = (
  request: StarSimRequest,
): StarSimSolarCrossLayerConsistencyDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    interior_residual_coherence: buildCrossLayerInteriorResidualCoherenceCheck(request, referencePack),
    mode_residual_coherence: buildCrossLayerModeResidualCoherenceCheck(request, referencePack),
    rotation_residual_coherence: buildCrossLayerRotationResidualCoherenceCheck(request, referencePack),
    cycle_memory_topology_coherence: buildCrossLayerCycleMemoryTopologyCoherenceCheck(request, referencePack),
    event_topology_identifier_coherence: buildCrossLayerEventTopologyIdentifierCoherenceCheck(request, referencePack),
    chronology_metadata_alignment: buildCrossLayerChronologyMetadataAlignmentCheck(request, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    benchmark_pack_id: "solar_cross_layer_consistency_v1",
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
    cross_layer_mismatch_summary: buildCrossLayerMismatchSummary(checks),
  };
};

export const evaluateSolarEruptiveCatalogDiagnostics = (
  request: StarSimRequest,
): StarSimSolarEruptiveDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    flare_catalog: buildFlareCatalogCheck(request, referencePack),
    cme_catalog: buildCmeCatalogCheck(request, referencePack),
    irradiance_continuity: buildEruptiveIrradianceContinuityCheck(request, referencePack),
    source_region_linkage: buildSourceRegionLinkageCheck(request, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    benchmark_pack_id: "solar_eruptive_catalog_v1",
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
  };
};

const evaluateSectionProductProvenance = (args: {
  sectionId: StarSimSolarBaselineSectionId;
  sectionValue: unknown;
  referencePack: StarSimSolarReferencePack;
  productRegistry: StarSimSolarProductRegistry;
}): StarSimSolarProvenanceCheck => {
  const registryIdentity = getSolarProductRegistryIdentity();
  const metadata = getSectionMetadata(args.sectionValue);
  const expectedProductFamilies = sortArray(getExpectedSectionProductFamilies(args.referencePack, args.sectionId));
  const actualSummaryBase = buildMetadataSummary(metadata);

  if (!metadata) {
    return buildProvenanceCheck({
      sectionId: args.sectionId,
      status: "missing",
      registryIdentity,
      metadata,
      reason_code: "section_metadata_missing",
      actual_summary: actualSummaryBase,
      expected_summary: { expected_product_families: expectedProductFamilies },
      notes: ["The solar section does not declare artifact metadata, so product provenance cannot be evaluated."],
    });
  }

  if (!hasString(metadata.source_product_id)) {
    return buildProvenanceCheck({
      sectionId: args.sectionId,
      status: "fail",
      registryIdentity,
      metadata,
      reason_code: "source_product_id_missing",
      actual_summary: actualSummaryBase,
      expected_summary: { expected_product_families: expectedProductFamilies },
      notes: ["The solar section metadata do not declare a source product id."],
    });
  }

  const registryEntry = args.productRegistry.products[metadata.source_product_id] ?? null;
  if (!registryEntry) {
    return buildProvenanceCheck({
      sectionId: args.sectionId,
      status: "fail",
      registryIdentity,
      metadata,
      reason_code: "source_product_id_unknown",
      actual_summary: actualSummaryBase,
      expected_summary: { expected_product_families: expectedProductFamilies },
      notes: ["The declared source product id is not present in the active solar product registry."],
    });
  }

  const supportedSectionMatch = registryEntry.supported_sections.includes(args.sectionId);
  const declaredFamily = metadata.source_product_family ?? null;
  const familyMatch = declaredFamily === registryEntry.product_family;
  const expectedFamilyMatch = !declaredFamily || expectedProductFamilies.length === 0
    ? true
    : expectedProductFamilies.includes(declaredFamily);
  const sourceDocIds = sortArray(metadata.source_doc_ids);
  const missingRegistryDocIds = registryEntry.reference_doc_ids.filter((docId) => !sourceDocIds.includes(docId));
  const observedModeMatch = !metadata.observed_mode || metadata.observed_mode === registryEntry.observed_mode;
  const instrumentMatch = !hasString(metadata.instrument)
    ? null
    : metadata.instrument.toLowerCase().includes(registryEntry.instrument.toLowerCase())
      || registryEntry.instrument.toLowerCase().includes(metadata.instrument.toLowerCase());
  const coordinateFrameMatch = !registryEntry.coordinate_frame || !metadata.coordinate_frame
    ? null
    : metadata.coordinate_frame === registryEntry.coordinate_frame;
  const cadenceUnitMatch = !registryEntry.cadence_units?.length
    ? null
    : metadata.cadence?.unit
      ? registryEntry.cadence_units.includes(metadata.cadence.unit)
      : "missing";
  const actualSummary = {
    ...actualSummaryBase,
    registry_product_id: registryEntry.id,
    registry_product_family: registryEntry.product_family,
    registry_reference_doc_ids: registryEntry.reference_doc_ids,
    supported_section_match: supportedSectionMatch,
    declared_family_matches_registry: familyMatch,
    declared_family_matches_reference_pack: expectedFamilyMatch,
    missing_registry_doc_ids: missingRegistryDocIds,
    observed_mode_match: observedModeMatch,
    instrument_match: instrumentMatch,
    coordinate_frame_match: coordinateFrameMatch,
    cadence_unit_match: cadenceUnitMatch,
  };
  const expectedSummary = {
    expected_product_families: expectedProductFamilies,
    required_product_id: registryEntry.id,
    required_product_family: registryEntry.product_family,
    required_doc_ids: registryEntry.reference_doc_ids,
    supported_sections: registryEntry.supported_sections,
    observed_mode: registryEntry.observed_mode,
    coordinate_frame: registryEntry.coordinate_frame ?? null,
    cadence_units: registryEntry.cadence_units ?? [],
    instrument: registryEntry.instrument,
  };

  if (!supportedSectionMatch) {
    return buildProvenanceCheck({
      sectionId: args.sectionId,
      status: "fail",
      registryIdentity,
      metadata,
      registryEntry,
      reason_code: "section_product_section_mismatch",
      actual_summary: actualSummary,
      expected_summary: expectedSummary,
      notes: ["The declared source product does not advertise support for this solar section."],
    });
  }

  if (!familyMatch || !expectedFamilyMatch) {
    return buildProvenanceCheck({
      sectionId: args.sectionId,
      status: "fail",
      registryIdentity,
      metadata,
      registryEntry,
      reason_code: "section_product_family_mismatch",
      actual_summary: actualSummary,
      expected_summary: expectedSummary,
      notes: ["The declared source product family does not match the active product registry or the active solar reference-pack expectation."],
    });
  }

  if (sourceDocIds.length === 0) {
    return buildProvenanceCheck({
      sectionId: args.sectionId,
      status: "fail",
      registryIdentity,
      metadata,
      registryEntry,
      reason_code: "section_product_doc_ids_missing",
      actual_summary: actualSummary,
      expected_summary: expectedSummary,
      notes: ["The solar section metadata do not declare source doc ids for the chosen product."],
    });
  }

  if (missingRegistryDocIds.length > 0) {
    return buildProvenanceCheck({
      sectionId: args.sectionId,
      status: "fail",
      registryIdentity,
      metadata,
      registryEntry,
      reason_code: "section_product_doc_ids_mismatch",
      actual_summary: actualSummary,
      expected_summary: expectedSummary,
      notes: ["The declared source doc ids do not cover the product registry citations for this solar section."],
    });
  }

  if (!observedModeMatch) {
    return buildProvenanceCheck({
      sectionId: args.sectionId,
      status: "fail",
      registryIdentity,
      metadata,
      registryEntry,
      reason_code: "section_product_mode_mismatch",
      actual_summary: actualSummary,
      expected_summary: expectedSummary,
      notes: ["The section observed/assimilated mode does not match the active solar product registry entry."],
    });
  }

  if (instrumentMatch === false) {
    return buildProvenanceCheck({
      sectionId: args.sectionId,
      status: "fail",
      registryIdentity,
      metadata,
      registryEntry,
      reason_code: "section_product_instrument_mismatch",
      actual_summary: actualSummary,
      expected_summary: expectedSummary,
      notes: ["The declared instrument label is not compatible with the active solar product registry entry."],
    });
  }

  if (coordinateFrameMatch === false) {
    return buildProvenanceCheck({
      sectionId: args.sectionId,
      status: "fail",
      registryIdentity,
      metadata,
      registryEntry,
      reason_code: "section_product_coordinate_frame_mismatch",
      actual_summary: actualSummary,
      expected_summary: expectedSummary,
      notes: ["The section coordinate frame does not match the product-registry expectation."],
    });
  }

  if (cadenceUnitMatch === false || cadenceUnitMatch === "missing") {
    return buildProvenanceCheck({
      sectionId: args.sectionId,
      status: "warn",
      registryIdentity,
      metadata,
      registryEntry,
      reason_code: cadenceUnitMatch === "missing" ? "section_product_cadence_missing" : "section_product_cadence_mismatch",
      actual_summary: actualSummary,
      expected_summary: expectedSummary,
      notes: ["The section cadence metadata are incomplete or fall outside the product-registry cadence semantics."],
    });
  }

  return buildProvenanceCheck({
    sectionId: args.sectionId,
    status: "pass",
    registryIdentity,
    metadata,
    registryEntry,
    actual_summary: actualSummary,
    expected_summary: expectedSummary,
    notes: ["The solar section provenance matches the active product registry and reference-pack expectations."],
  });
};

export const evaluateSolarProvenanceDiagnostics = (
  request: StarSimRequest,
): StarSimSolarProvenanceDiagnostics | null => {
  const baseline = request.solar_baseline;
  if (!baseline) {
    return null;
  }
  const referencePack = getSolarReferencePack();
  const productRegistry = getSolarProductRegistry();
  const productRegistryIdentity = getSolarProductRegistryIdentity();
  const checks = Object.fromEntries(
    STAR_SIM_SOLAR_BASELINE_SECTION_IDS
      .filter((sectionId) => baseline[sectionId] !== undefined)
      .map((sectionId) => [
        sectionId,
        evaluateSectionProductProvenance({
          sectionId,
          sectionValue: baseline[sectionId],
          referencePack,
          productRegistry,
        }),
      ]),
  ) as Partial<Record<StarSimSolarBaselineSectionId, StarSimSolarProvenanceCheck>>;
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.length === 0
      ? "fail"
      : statuses.includes("fail") || statuses.includes("missing")
        ? "fail"
        : statuses.includes("warn")
          ? "warn"
          : "pass";

  return {
    product_registry_id: productRegistryIdentity.id,
    product_registry_version: productRegistryIdentity.version,
    overall_status,
    checks,
  };
};

export const collectSolarClosureBlockingReasons = (
  diagnostics: StarSimSolarClosureDiagnostics,
): StarSimSupportedDomainReason[] =>
  Array.from(
    new Set(
      Object.values(diagnostics.checks)
        .filter((check) => (check.status === "fail" || check.status === "missing") && check.reason_code)
        .map((check) => check.reason_code as StarSimSupportedDomainReason),
    ),
  );

export const collectSolarStructuralResidualBlockingReasons = (
  diagnostics: StarSimSolarStructuralResidualDiagnostics,
): StarSimSupportedDomainReason[] =>
  Array.from(
    new Set(
      Object.values(diagnostics.checks)
        .filter((check) => (check.status === "fail" || check.status === "missing") && check.reason_code)
        .map((check) => check.reason_code as StarSimSupportedDomainReason),
    ),
  );

export const collectSolarCycleBlockingReasons = (
  diagnostics: StarSimSolarCycleDiagnostics,
): StarSimSupportedDomainReason[] =>
  Array.from(
    new Set(
      Object.values(diagnostics.checks)
        .filter((check) => (check.status === "fail" || check.status === "missing") && check.reason_code)
        .map((check) => check.reason_code as StarSimSupportedDomainReason),
    ),
  );

export const collectSolarEruptiveBlockingReasons = (
  diagnostics: StarSimSolarEruptiveDiagnostics,
): StarSimSupportedDomainReason[] =>
  Array.from(
    new Set(
      Object.values(diagnostics.checks)
        .filter((check) => (check.status === "fail" || check.status === "missing") && check.reason_code)
        .map((check) => check.reason_code as StarSimSupportedDomainReason),
    ),
  );

export const collectSolarLocalHelioBlockingReasons = (
  diagnostics: StarSimSolarLocalHelioDiagnostics,
): StarSimSupportedDomainReason[] =>
  Array.from(
    new Set(
      Object.values(diagnostics.checks)
        .filter((check) => (check.status === "fail" || check.status === "missing") && check.reason_code)
        .map((check) => check.reason_code as StarSimSupportedDomainReason),
    ),
  );

export const collectSolarSurfaceFlowBlockingReasons = (
  diagnostics: StarSimSolarSurfaceFlowDiagnostics,
): StarSimSupportedDomainReason[] =>
  Array.from(
    new Set(
      Object.values(diagnostics.checks)
        .filter((check) => (check.status === "fail" || check.status === "missing") && check.reason_code)
        .map((check) => check.reason_code as StarSimSupportedDomainReason),
    ),
  );

export const collectSolarCoronalFieldBlockingReasons = (
  diagnostics: StarSimSolarCoronalFieldDiagnostics,
): StarSimSupportedDomainReason[] =>
  Array.from(
    new Set(
      Object.values(diagnostics.checks)
        .filter((check) => (check.status === "fail" || check.status === "missing") && check.reason_code)
        .map((check) => check.reason_code as StarSimSupportedDomainReason),
    ),
  );

export const collectSolarMagneticMemoryBlockingReasons = (
  diagnostics: StarSimSolarMagneticMemoryDiagnostics,
): StarSimSupportedDomainReason[] =>
  Array.from(
    new Set(
      Object.values(diagnostics.checks)
        .filter((check) => (check.status === "fail" || check.status === "missing") && check.reason_code)
        .map((check) => check.reason_code as StarSimSupportedDomainReason),
    ),
  );

export const collectSolarSpotRegionBlockingReasons = (
  diagnostics: StarSimSolarSpotRegionDiagnostics,
): StarSimSupportedDomainReason[] =>
  Array.from(
    new Set(
      Object.values(diagnostics.checks)
        .filter((check) => (check.status === "fail" || check.status === "missing") && check.reason_code)
        .map((check) => check.reason_code as StarSimSupportedDomainReason),
    ),
  );

export const collectSolarEventLinkageBlockingReasons = (
  diagnostics: StarSimSolarEventLinkageDiagnostics,
): StarSimSupportedDomainReason[] =>
  Array.from(
    new Set(
      Object.values(diagnostics.checks)
        .filter((check) => (check.status === "fail" || check.status === "missing") && check.reason_code)
        .map((check) => check.reason_code as StarSimSupportedDomainReason),
    ),
  );

export const collectSolarTopologyLinkageBlockingReasons = (
  diagnostics: StarSimSolarTopologyLinkageDiagnostics,
): StarSimSupportedDomainReason[] =>
  Array.from(
    new Set(
      Object.values(diagnostics.checks)
        .filter((check) => (check.status === "fail" || check.status === "missing") && check.reason_code)
        .map((check) => check.reason_code as StarSimSupportedDomainReason),
    ),
  );

export const collectSolarCrossLayerConsistencyBlockingReasons = (
  diagnostics: StarSimSolarCrossLayerConsistencyDiagnostics,
): StarSimSupportedDomainReason[] =>
  Array.from(
    new Set(
      Object.values(diagnostics.checks)
        .filter((check) => (check.status === "fail" || check.status === "missing") && check.reason_code)
        .map((check) => check.reason_code as StarSimSupportedDomainReason),
    ),
  );
