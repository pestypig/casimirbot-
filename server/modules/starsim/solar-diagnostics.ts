import type {
  StarSimRequest,
  StarSimSolarArtifactMetadata,
  StarSimSolarBaselineSectionId,
  StarSimSolarClosureCheck,
  StarSimSolarClosureDiagnostics,
  StarSimSolarCycleDiagnostics,
  StarSimSolarEruptiveDiagnostics,
  StarSimSolarProvenanceCheck,
  StarSimSolarProvenanceDiagnostics,
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

const hasNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const hasString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const sortArray = (values: string[] | undefined): string[] => [...(values ?? [])].sort((left, right) => left.localeCompare(right));

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
    case "solar_neutrino_constraints":
      return [referencePack.anchors.interior.neutrino_constraint_vector.product_family];
    case "solar_cycle_indices":
      return [referencePack.anchors.cycle.cycle_indices.product_family];
    case "solar_magnetogram":
      return [referencePack.anchors.cycle.magnetogram_context.product_family];
    case "solar_active_regions":
      return [referencePack.anchors.cycle.active_region_context.product_family];
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

const buildCheck = (args: {
  anchor: StarSimSolarReferenceAnchor;
  referencePack: StarSimSolarReferencePack;
  status: StarSimSolarClosureCheck["status"];
  reason_code?: StarSimSupportedDomainReason;
  actual_summary?: Record<string, unknown>;
  expected_summary?: Record<string, unknown>;
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

const buildActiveRegionContextCheck = (
  request: StarSimRequest,
  referencePack: StarSimSolarReferencePack,
): StarSimSolarClosureCheck => {
  const anchor = referencePack.anchors.cycle.active_region_context;
  const expectedSummary = anchor.expected_summary as {
    minimum_region_count: number;
    preferred_instrument_keywords: string[];
  };
  const activeRegions = request.solar_baseline?.solar_active_regions;
  const regionRefCount = activeRegions?.region_refs?.length ?? 0;
  const regionCount = activeRegions?.region_count ?? null;
  const hasContext = regionRefCount >= expectedSummary.minimum_region_count
    || (hasNumber(regionCount) && regionCount >= expectedSummary.minimum_region_count);
  const instrumentMatch = getInstrumentKeywordMatch(activeRegions?.metadata?.instrument, expectedSummary.preferred_instrument_keywords);
  const actualSummary = mergeMetadataSummary(
    {
      region_ref_count: regionRefCount,
      region_count: regionCount,
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

export const evaluateSolarCycleObservedDiagnostics = (
  request: StarSimRequest,
): StarSimSolarCycleDiagnostics => {
  const referencePack = getSolarReferencePack();
  const checks = {
    cycle_indices: buildCycleIndicesCheck(request, referencePack),
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
