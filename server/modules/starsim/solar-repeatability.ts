import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { hashStableJson } from "../../utils/information-boundary";
import { resolveStarSimArtifactRoot } from "./artifacts";
import type {
  StarSimResolveResponse,
  StarSimRequest,
  StarSimSolarArtifactMetadata,
  StarSimSolarBaselinePhase,
  StarSimSolarBaselineRepeatability,
  StarSimSolarConsistencyCheck,
  StarSimSolarConsistencyDiagnostics,
  StarSimSolarProvenanceDiagnostics,
} from "./contract";
import { getSolarProductRegistryIdentity } from "./solar-product-registry";
import {
  getSolarReferencePack,
  getSolarReferencePackIdentity,
  type StarSimSolarReferenceAnchor,
  type StarSimSolarReferencePack,
} from "./solar-reference-pack";

const STAR_SIM_SOLAR_BASELINE_SUMMARY_SCHEMA_VERSION = "star-sim-solar-baseline-summary/4" as const;

type SolarMetadataSummary = {
  coordinate_frames: string[];
  carrington_rotations: number[];
  cadences_by_section: Record<string, { value: number; unit: string }>;
  time_ranges_by_section: Record<string, { start_iso: string; end_iso: string }>;
  instruments_by_section: Record<string, string>;
};

type SolarProductSummary = Record<
  string,
  {
    source_product_id: string | null;
    source_product_family: string | null;
    source_doc_ids: string[];
  }
>;

type SolarSupportSummary = Record<
  StarSimSolarBaselinePhase,
  {
    passed: boolean;
    reasons: string[];
    overall_status: "pass" | "warn" | "fail" | null;
  }
>;

type StarSimSolarBaselineSummary = {
  schema_version: typeof STAR_SIM_SOLAR_BASELINE_SUMMARY_SCHEMA_VERSION;
  written_at_iso: string;
  target_id: string;
  solar_reference_pack_id: string;
  solar_reference_pack_version: string;
  solar_reference_pack_content_hash: string;
  solar_reference_pack_ref: string;
  solar_product_registry_id: string;
  solar_product_registry_version: string;
  solar_product_registry_content_hash: string;
  solar_product_registry_ref: string;
  solar_baseline_signature: string;
  present_sections: string[];
  section_ref_summary: Record<string, string[]>;
  section_product_summary: SolarProductSummary;
  phase_support_summary: Partial<SolarSupportSummary>;
  source_region_summary: {
    flare_source_region_refs: string[];
    cme_source_region_refs: string[];
    active_region_refs: string[];
    magnetogram_patch_refs: string[];
  };
  irradiance_summary: {
    tsi_ref: string | null;
    euv_ref: string | null;
    xray_ref: string | null;
  };
  phase_metadata_summary: SolarMetadataSummary;
  solar_consistency_diagnostics: StarSimSolarConsistencyDiagnostics;
  solar_provenance_diagnostics: StarSimSolarProvenanceDiagnostics | null;
};

type PersistedSolarBaselineSummary = {
  summary: StarSimSolarBaselineSummary;
  ref: string;
};

const asRelative = (filePath: string): string => path.relative(process.cwd(), filePath).replace(/\\/g, "/");

const writeJsonAtomic = async (filePath: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
};

const hasString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const sortArray = (values: string[] | undefined): string[] =>
  [...(values ?? [])].sort((left, right) => left.localeCompare(right));

const sortNumericArray = (values: number[] | undefined): number[] => [...(values ?? [])].sort((left, right) => left - right);

const sortRecord = <T>(record: Record<string, T> | undefined): Record<string, T> =>
  Object.fromEntries(
    Object.entries(record ?? {})
      .sort(([left], [right]) => left.localeCompare(right)),
  );

const normalizeSolarTargetId = (requestDraft: StarSimRequest | null | undefined): string | null => {
  const objectId = requestDraft?.target?.object_id?.trim().toLowerCase();
  const name = requestDraft?.target?.name?.trim().toLowerCase();
  if (objectId === "sun" || objectId === "sol" || name === "sun" || name === "sol" || requestDraft?.orbital_context?.naif_body_id === 10) {
    return "sun";
  }
  return null;
};

const getPresentSections = (baseline: StarSimRequest["solar_baseline"]): string[] =>
  Object.entries(baseline ?? {})
    .filter(([key, value]) => key !== "schema_version" && value !== undefined)
    .map(([key]) => key)
    .sort((left, right) => left.localeCompare(right));

const collectRefs = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(hasString).flatMap((entry) => collectRefs(entry));
  }
  if (!value || typeof value !== "object") {
    return [];
  }
  const refs: string[] = [];
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (key === "metadata") {
      continue;
    }
    if (key.endsWith("_ref") && hasString(entry)) {
      refs.push(entry);
      continue;
    }
    if (key.endsWith("_refs") && Array.isArray(entry)) {
      refs.push(...entry.filter(hasString));
      continue;
    }
    if (entry && typeof entry === "object") {
      refs.push(...collectRefs(entry));
    }
  }
  return sortArray(refs);
};

const collectSectionRefSummary = (baseline: StarSimRequest["solar_baseline"]): Record<string, string[]> =>
  Object.fromEntries(
    Object.entries(baseline ?? {})
      .filter(([key, value]) => key !== "schema_version" && value !== undefined)
      .map(([sectionName, sectionValue]) => [sectionName, collectRefs(sectionValue)])
      .sort(([left], [right]) => left.localeCompare(right)),
  );

const getSectionMetadata = (sectionValue: unknown): StarSimSolarArtifactMetadata | null => {
  if (!sectionValue || typeof sectionValue !== "object") {
    return null;
  }
  const metadata = (sectionValue as { metadata?: StarSimSolarArtifactMetadata }).metadata;
  return metadata ?? null;
};

const buildPhaseMetadataSummary = (baseline: StarSimRequest["solar_baseline"]): SolarMetadataSummary => {
  const coordinateFrames = new Set<string>();
  const carringtonRotations = new Set<number>();
  const cadencesBySection: Record<string, { value: number; unit: string }> = {};
  const timeRangesBySection: Record<string, { start_iso: string; end_iso: string }> = {};
  const instrumentsBySection: Record<string, string> = {};

  for (const [sectionName, sectionValue] of Object.entries(baseline ?? {})) {
    if (sectionName === "schema_version" || sectionValue === undefined) {
      continue;
    }
    const metadata = getSectionMetadata(sectionValue);
    if (!metadata) {
      continue;
    }
    if (hasString(metadata.coordinate_frame)) {
      coordinateFrames.add(metadata.coordinate_frame);
    }
    if (typeof metadata.carrington_rotation === "number" && Number.isFinite(metadata.carrington_rotation)) {
      carringtonRotations.add(metadata.carrington_rotation);
    }
    if (metadata.time_range?.start_iso && metadata.time_range?.end_iso) {
      timeRangesBySection[sectionName] = {
        start_iso: metadata.time_range.start_iso,
        end_iso: metadata.time_range.end_iso,
      };
    }
    if (metadata.cadence?.value && metadata.cadence?.unit) {
      cadencesBySection[sectionName] = {
        value: metadata.cadence.value,
        unit: metadata.cadence.unit,
      };
    }
    if (hasString(metadata.instrument)) {
      instrumentsBySection[sectionName] = metadata.instrument;
    }
  }

  return {
    coordinate_frames: sortArray([...coordinateFrames]),
    carrington_rotations: sortNumericArray([...carringtonRotations]),
    cadences_by_section: sortRecord(cadencesBySection),
    time_ranges_by_section: sortRecord(timeRangesBySection),
    instruments_by_section: sortRecord(instrumentsBySection),
  };
};

const buildSectionProductSummary = (baseline: StarSimRequest["solar_baseline"]): SolarProductSummary =>
  Object.fromEntries(
    Object.entries(baseline ?? {})
      .filter(([sectionName, sectionValue]) => sectionName !== "schema_version" && sectionValue !== undefined)
      .map(([sectionName, sectionValue]) => {
        const metadata = getSectionMetadata(sectionValue);
        return [
          sectionName,
          {
            source_product_id: metadata?.source_product_id ?? null,
            source_product_family: metadata?.source_product_family ?? null,
            source_doc_ids: sortArray(metadata?.source_doc_ids),
          },
        ];
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );

const buildSupportSummary = (
  support: Partial<Record<StarSimSolarBaselinePhase, NonNullable<StarSimResolveResponse["solar_baseline_support"]>[StarSimSolarBaselinePhase]>> | undefined,
): Partial<SolarSupportSummary> => {
  const entries = Object.entries(support ?? {}) as Array<
    [StarSimSolarBaselinePhase, NonNullable<NonNullable<StarSimResolveResponse["solar_baseline_support"]>[StarSimSolarBaselinePhase]>]
  >;
  return Object.fromEntries(
    entries
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([phaseId, phaseSupport]) => {
        const overallStatus =
          phaseSupport.closure_diagnostics?.overall_status
          ?? phaseSupport.cycle_diagnostics?.overall_status
          ?? phaseSupport.eruptive_diagnostics?.overall_status
          ?? null;
        return [
          phaseId,
          {
            passed: phaseSupport.passed,
            reasons: sortArray(phaseSupport.reasons),
            overall_status: overallStatus,
          },
        ];
      }),
  ) as Partial<SolarSupportSummary>;
};

const asSet = (values: string[]): Set<string> => new Set(values);

const intersection = (left: string[], right: string[]): string[] => {
  const rightSet = asSet(right);
  return sortArray(left.filter((value) => rightSet.has(value)));
};

const getInstrumentKeywordMatch = (instrument: string | undefined, keywords: string[]): boolean | null => {
  if (!hasString(instrument)) {
    return null;
  }
  const normalized = instrument.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
};

const buildConsistencyCheck = (args: {
  anchor: StarSimSolarReferenceAnchor;
  referencePack: StarSimSolarReferencePack;
  status: StarSimSolarConsistencyCheck["status"];
  reason_code?: string;
  actual_summary?: Record<string, unknown>;
  expected_summary?: Record<string, unknown>;
  notes: string[];
}): StarSimSolarConsistencyCheck => ({
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

const buildSourceRegionSummary = (baseline: StarSimRequest["solar_baseline"]) => ({
  flare_source_region_refs: sortArray(baseline?.solar_flare_catalog?.source_region_refs),
  cme_source_region_refs: sortArray(baseline?.solar_cme_catalog?.source_region_refs),
  active_region_refs: sortArray(baseline?.solar_active_regions?.region_refs),
  magnetogram_patch_refs: sortArray(baseline?.solar_magnetogram?.active_region_patch_refs),
});

const buildIrradianceSummary = (baseline: StarSimRequest["solar_baseline"]) => ({
  tsi_ref: baseline?.solar_irradiance_series?.tsi_ref ?? null,
  euv_ref: baseline?.solar_irradiance_series?.euv_ref ?? null,
  xray_ref: baseline?.solar_irradiance_series?.xray_ref ?? null,
});

const buildSourceRegionOverlapCheck = (
  baseline: StarSimRequest["solar_baseline"],
  referencePack: StarSimSolarReferencePack,
): StarSimSolarConsistencyCheck => {
  const anchor = referencePack.anchors.consistency.source_region_overlap;
  const summary = buildSourceRegionSummary(baseline);
  const eruptiveRefs = sortArray([...summary.flare_source_region_refs, ...summary.cme_source_region_refs]);
  const overlap = intersection(eruptiveRefs, summary.active_region_refs);
  const actualSummary = {
    eruptive_source_region_refs: eruptiveRefs,
    active_region_refs: summary.active_region_refs,
    overlap_refs: overlap,
  };

  if (eruptiveRefs.length === 0 && summary.active_region_refs.length === 0) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "source_region_context_missing",
      actual_summary: actualSummary,
      expected_summary: { required_overlap: "eruptive_source_region_refs ∩ active_region_refs" },
      notes: ["No explicit eruptive or cycle source-region refs are available to compare."],
    });
  }

  if (eruptiveRefs.length === 0 || summary.active_region_refs.length === 0) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "warn",
      reason_code: "source_region_overlap_unverifiable",
      actual_summary: actualSummary,
      expected_summary: { required_overlap: "eruptive_source_region_refs ∩ active_region_refs" },
      notes: ["Source-region overlap cannot be fully verified because one side of the linkage is missing."],
    });
  }

  if (overlap.length > 0) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      expected_summary: { minimum_overlap_refs: 1 },
      notes: ["Cycle and eruptive source-region refs overlap."],
    });
  }

  return buildConsistencyCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "source_region_overlap_mismatch",
    actual_summary: actualSummary,
    expected_summary: { minimum_overlap_refs: 1 },
    notes: ["Eruptive source-region refs do not overlap with the cycle active-region context."],
  });
};

const buildMagnetogramActiveRegionLinkageCheck = (
  baseline: StarSimRequest["solar_baseline"],
  referencePack: StarSimSolarReferencePack,
): StarSimSolarConsistencyCheck => {
  const anchor = referencePack.anchors.consistency.magnetogram_active_region_linkage;
  const patchRefs = sortArray(baseline?.solar_magnetogram?.active_region_patch_refs);
  const activeRefs = sortArray(baseline?.solar_active_regions?.region_refs);
  const hasSynoptic = hasString(baseline?.solar_magnetogram?.synoptic_radial_map_ref);
  const actualSummary = {
    magnetogram_patch_refs: patchRefs,
    active_region_refs: activeRefs,
    has_synoptic_radial_map_ref: hasSynoptic,
  };

  if (patchRefs.length === 0 && activeRefs.length === 0 && !hasSynoptic) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "magnetogram_active_region_context_missing",
      actual_summary: actualSummary,
      expected_summary: { preferred_linkage: "active_region_patch_refs + active_region_refs" },
      notes: ["No magnetogram or active-region linkage context is available to compare."],
    });
  }

  if (patchRefs.length > 0 && activeRefs.length > 0) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      expected_summary: { minimum_patch_refs: 1, minimum_active_region_refs: 1 },
      notes: ["Magnetogram patch refs and active-region refs are both present."],
    });
  }

  if (hasSynoptic && activeRefs.length > 0) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "warn",
      reason_code: "magnetogram_patch_linkage_missing",
      actual_summary: actualSummary,
      expected_summary: { preferred_linkage: "active_region_patch_refs + active_region_refs" },
      notes: ["Active-region context exists, but only synoptic magnetogram linkage is available."],
    });
  }

  return buildConsistencyCheck({
    anchor,
    referencePack,
    status: "fail",
    reason_code: "magnetogram_active_region_linkage_mismatch",
    actual_summary: actualSummary,
    expected_summary: { preferred_linkage: "active_region_patch_refs + active_region_refs" },
    notes: ["Magnetogram and active-region linkage are not coherent enough for the anchored solar baseline check."],
  });
};

const buildIrradianceContextConsistencyCheck = (
  baseline: StarSimRequest["solar_baseline"],
  referencePack: StarSimSolarReferencePack,
): StarSimSolarConsistencyCheck => {
  const anchor = referencePack.anchors.consistency.irradiance_context_consistency;
  const expectedSummary = anchor.expected_summary as {
    preferred_instrument_keywords: string[];
  };
  const summary = buildIrradianceSummary(baseline);
  const instrumentMatch = getInstrumentKeywordMatch(
    baseline?.solar_irradiance_series?.metadata?.instrument,
    expectedSummary.preferred_instrument_keywords,
  );
  const actualSummary = {
    ...summary,
    instrument: baseline?.solar_irradiance_series?.metadata?.instrument ?? null,
    instrument_keyword_match: instrumentMatch,
  };

  if (!summary.tsi_ref && !summary.euv_ref && !summary.xray_ref) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "irradiance_context_missing",
      actual_summary: actualSummary,
      expected_summary: { cycle_ref: "tsi_ref", eruptive_refs: ["euv_ref", "xray_ref"] },
      notes: ["No irradiance continuity refs are available across the solar phases."],
    });
  }

  if (summary.tsi_ref && (summary.euv_ref || summary.xray_ref) && instrumentMatch !== false) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "pass",
      actual_summary: actualSummary,
      expected_summary: { cycle_ref: "tsi_ref", eruptive_refs: ["euv_ref", "xray_ref"] },
      notes: ["Irradiance continuity covers both long-baseline and eruptive context."],
    });
  }

  return buildConsistencyCheck({
    anchor,
    referencePack,
    status: "warn",
    reason_code: "irradiance_context_partial",
    actual_summary: actualSummary,
    expected_summary: { cycle_ref: "tsi_ref", eruptive_refs: ["euv_ref", "xray_ref"] },
    notes: ["Irradiance continuity is only partially populated across cycle and eruptive phases."],
  });
};

const buildPhaseMetadataCoherenceCheck = (
  baseline: StarSimRequest["solar_baseline"],
  referencePack: StarSimSolarReferencePack,
): StarSimSolarConsistencyCheck => {
  const anchor = referencePack.anchors.consistency.phase_metadata_coherence;
  const summary = buildPhaseMetadataSummary(baseline);
  const timeRanges = Object.values(summary.time_ranges_by_section);
  const latestStart =
    timeRanges.length > 0
      ? Math.max(...timeRanges.map((entry) => Date.parse(entry.start_iso)))
      : null;
  const earliestEnd =
    timeRanges.length > 0
      ? Math.min(...timeRanges.map((entry) => Date.parse(entry.end_iso)))
      : null;
  const timeOverlap = latestStart !== null && earliestEnd !== null ? latestStart <= earliestEnd : null;
  const rotationSpread =
    summary.carrington_rotations.length > 0
      ? summary.carrington_rotations[summary.carrington_rotations.length - 1] - summary.carrington_rotations[0]
      : null;
  const instrumentKeywordMatches = Object.fromEntries(
    Object.entries(summary.instruments_by_section).map(([section, instrument]) => [
      section,
      getInstrumentKeywordMatch(instrument, referencePack.product_semantics.section_instrument_keywords[section] ?? []),
    ]),
  );
  const cadenceExpectationMatches = Object.fromEntries(
    Object.entries(referencePack.product_semantics.section_cadence_expectations).map(([section, expectation]) => {
      const cadence = summary.cadences_by_section[section];
      if (!cadence) {
        return [section, expectation.required ? "missing" : null];
      }
      return [section, expectation.allowed_units.includes(cadence.unit) ? true : false];
    }),
  );
  const actualSummary = {
    coordinate_frames: summary.coordinate_frames,
    carrington_rotations: summary.carrington_rotations,
    cadences_by_section: summary.cadences_by_section,
    time_ranges_by_section: summary.time_ranges_by_section,
    instruments_by_section: summary.instruments_by_section,
    instrument_keyword_matches_by_section: instrumentKeywordMatches,
    cadence_expectation_matches_by_section: cadenceExpectationMatches,
    time_range_overlap: timeOverlap,
    carrington_rotation_spread: rotationSpread,
  };

  if (
    summary.coordinate_frames.length === 0
    && summary.carrington_rotations.length === 0
    && Object.keys(summary.cadences_by_section).length === 0
    && Object.keys(summary.time_ranges_by_section).length === 0
  ) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "missing",
      reason_code: "phase_metadata_missing",
      actual_summary: actualSummary,
      expected_summary: { coordinate_frame: "Carrington", carrington_rotation_spread_max: 1, overlapping_time_ranges: true },
      notes: ["No section metadata were available to assess cross-phase coherence."],
    });
  }

  if (
    summary.coordinate_frames.length > 1
    || (summary.coordinate_frames.length === 1 && summary.coordinate_frames[0] !== referencePack.product_semantics.coordinate_frame)
  ) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "phase_coordinate_frame_mismatch",
      actual_summary: actualSummary,
      expected_summary: { coordinate_frame_count_max: 1 },
      notes: ["Solar phase metadata use multiple coordinate frames or disagree with the anchored Carrington expectation."],
    });
  }

  if (rotationSpread !== null && rotationSpread > referencePack.product_semantics.carrington_rotation_spread_max) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "phase_carrington_rotation_mismatch",
      actual_summary: actualSummary,
      expected_summary: { carrington_rotation_spread_max: 1 },
      notes: ["Solar phase metadata disagree on Carrington rotation by more than the anchored allowance."],
    });
  }

  if (timeRanges.length > 1 && timeOverlap === false && referencePack.product_semantics.require_overlapping_time_ranges) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "fail",
      reason_code: "phase_time_range_disjoint",
      actual_summary: actualSummary,
      expected_summary: { overlapping_time_ranges: true },
      notes: ["Solar phase metadata time ranges do not overlap."],
    });
  }

  if (Object.values(cadenceExpectationMatches).some((value) => value === false)) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "warn",
      reason_code: "phase_cadence_mismatch",
      actual_summary: actualSummary,
      expected_summary: {
        section_cadence_expectations: referencePack.product_semantics.section_cadence_expectations,
      },
      notes: ["One or more section cadence declarations do not match the anchored solar product-semantic expectations."],
    });
  }

  if (Object.values(cadenceExpectationMatches).some((value) => value === "missing")) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "warn",
      reason_code: "phase_cadence_missing",
      actual_summary: actualSummary,
      expected_summary: {
        section_cadence_expectations: referencePack.product_semantics.section_cadence_expectations,
      },
      notes: ["One or more sections are missing cadence metadata required by the anchored solar product semantics."],
    });
  }

  if (Object.values(instrumentKeywordMatches).some((value) => value === false)) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "warn",
      reason_code: "phase_instrument_family_mismatch",
      actual_summary: actualSummary,
      notes: ["One or more section instrument labels do not match the anchored solar product-family expectations."],
    });
  }

  if (Object.keys(summary.instruments_by_section).length < 2 || timeRanges.length < 2) {
    return buildConsistencyCheck({
      anchor,
      referencePack,
      status: "warn",
      reason_code: "phase_metadata_partial",
      actual_summary: actualSummary,
      expected_summary: { minimum_metadata_sections: 2 },
      notes: ["Cross-phase metadata are only partially populated."],
    });
  }

  return buildConsistencyCheck({
    anchor,
    referencePack,
    status: "pass",
    actual_summary: actualSummary,
    expected_summary: { coordinate_frame_count_max: 1, carrington_rotation_spread_max: 1, overlapping_time_ranges: true },
    notes: ["Solar phase metadata are coherent at the current anchored observed-baseline level."],
  });
};

export const buildSolarConsistencyDiagnostics = (
  requestDraft: StarSimRequest | null | undefined,
): StarSimSolarConsistencyDiagnostics | null => {
  const baseline = requestDraft?.solar_baseline;
  if (!baseline) {
    return null;
  }
  const referencePack = getSolarReferencePack();
  const checks = {
    source_region_overlap: buildSourceRegionOverlapCheck(baseline, referencePack),
    magnetogram_active_region_linkage: buildMagnetogramActiveRegionLinkageCheck(baseline, referencePack),
    irradiance_context_consistency: buildIrradianceContextConsistencyCheck(baseline, referencePack),
    phase_metadata_coherence: buildPhaseMetadataCoherenceCheck(baseline, referencePack),
  };
  const statuses = Object.values(checks).map((check) => check.status);
  const overall_status =
    statuses.includes("fail") || statuses.includes("missing")
      ? "fail"
      : statuses.includes("warn")
        ? "warn"
        : "pass";

  return {
    reference_pack_id: referencePack.id,
    reference_pack_version: referencePack.version,
    overall_status,
    checks,
  };
};

const buildSolarBaselineSummary = (args: {
  requestDraft: StarSimRequest | null | undefined;
  solarBaselineSupport?: StarSimResolveResponse["solar_baseline_support"];
  solarProvenanceDiagnostics?: StarSimSolarProvenanceDiagnostics | null;
}): StarSimSolarBaselineSummary | null => {
  const targetId = normalizeSolarTargetId(args.requestDraft);
  const referencePack = getSolarReferencePackIdentity();
  const productRegistry = getSolarProductRegistryIdentity();
  const baseline = args.requestDraft?.solar_baseline;
  if (!targetId || !baseline) {
    return null;
  }
  const presentSections = getPresentSections(baseline);
  const sectionRefSummary = collectSectionRefSummary(baseline);
  const sectionProductSummary = buildSectionProductSummary(baseline);
  const phaseSupportSummary = buildSupportSummary(args.solarBaselineSupport);
  const sourceRegionSummary = buildSourceRegionSummary(baseline);
  const irradianceSummary = buildIrradianceSummary(baseline);
  const phaseMetadataSummary = buildPhaseMetadataSummary(baseline);
  const solarConsistencyDiagnostics = buildSolarConsistencyDiagnostics(args.requestDraft);
  if (!solarConsistencyDiagnostics) {
    return null;
  }

  const solarBaselineSignature = hashStableJson({
    schema_version: "star-sim-solar-baseline-signature/4",
    target_id: targetId,
    solar_reference_pack_id: referencePack.id,
    solar_reference_pack_version: referencePack.version,
    solar_reference_pack_content_hash: referencePack.content_hash,
    solar_product_registry_id: productRegistry.id,
    solar_product_registry_version: productRegistry.version,
    solar_product_registry_content_hash: productRegistry.content_hash,
    present_sections: presentSections,
    section_ref_summary: sectionRefSummary,
    section_product_summary: sectionProductSummary,
    phase_support_summary: phaseSupportSummary,
    source_region_summary: sourceRegionSummary,
    irradiance_summary: irradianceSummary,
    phase_metadata_summary: phaseMetadataSummary,
    solar_provenance_diagnostics: args.solarProvenanceDiagnostics,
  });

  return {
    schema_version: STAR_SIM_SOLAR_BASELINE_SUMMARY_SCHEMA_VERSION,
    written_at_iso: new Date().toISOString(),
    target_id: targetId,
    solar_reference_pack_id: referencePack.id,
    solar_reference_pack_version: referencePack.version,
    solar_reference_pack_content_hash: referencePack.content_hash,
    solar_reference_pack_ref: referencePack.ref,
    solar_product_registry_id: productRegistry.id,
    solar_product_registry_version: productRegistry.version,
    solar_product_registry_content_hash: productRegistry.content_hash,
    solar_product_registry_ref: productRegistry.ref,
    solar_baseline_signature: solarBaselineSignature,
    present_sections: presentSections,
    section_ref_summary: sectionRefSummary,
    section_product_summary: sectionProductSummary,
    phase_support_summary: phaseSupportSummary,
    source_region_summary: sourceRegionSummary,
    irradiance_summary: irradianceSummary,
    phase_metadata_summary: phaseMetadataSummary,
    solar_consistency_diagnostics: solarConsistencyDiagnostics,
    solar_provenance_diagnostics: args.solarProvenanceDiagnostics ?? null,
  };
};

const resolveSolarBaselineSummaryPath = (signature: string): string =>
  path.join(
    resolveStarSimArtifactRoot(),
    "solar-baselines",
    signature.replace(/^sha256:/, ""),
    "solar-baseline-summary.json",
  );

const resolveSolarBaselineHistoryRoot = (signature: string): string =>
  path.join(
    resolveStarSimArtifactRoot(),
    "solar-baselines",
    signature.replace(/^sha256:/, ""),
    "history",
  );

const resolveSolarBaselineHistoryPath = (summary: StarSimSolarBaselineSummary): string => {
  const timestampSegment = summary.written_at_iso.replace(/[:.]/g, "-");
  return path.join(
    resolveSolarBaselineHistoryRoot(summary.solar_baseline_signature),
    `${timestampSegment}-${randomUUID()}.json`,
  );
};

const readSolarBaselineSummaryFile = async (filePath: string): Promise<StarSimSolarBaselineSummary | null> => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StarSimSolarBaselineSummary;
    if (parsed.schema_version !== STAR_SIM_SOLAR_BASELINE_SUMMARY_SCHEMA_VERSION) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const listPriorSolarBaselineSummaries = async (targetId: string): Promise<PersistedSolarBaselineSummary[]> => {
  const root = path.join(resolveStarSimArtifactRoot(), "solar-baselines");
  try {
    const signatureDirs = await fs.readdir(root, { withFileTypes: true });
    const summaries: PersistedSolarBaselineSummary[] = [];
    for (const signatureDir of signatureDirs) {
      if (!signatureDir.isDirectory()) {
        continue;
      }
      const historyRoot = path.join(root, signatureDir.name, "history");
      try {
        const historyEntries = await fs.readdir(historyRoot, { withFileTypes: true });
        for (const historyEntry of historyEntries) {
          if (!historyEntry.isFile() || !historyEntry.name.endsWith(".json")) {
            continue;
          }
          const absolutePath = path.join(historyRoot, historyEntry.name);
          const summary = await readSolarBaselineSummaryFile(absolutePath);
          if (!summary || summary.target_id !== targetId) {
            continue;
          }
          summaries.push({
            summary,
            ref: asRelative(absolutePath),
          });
        }
      } catch {
        // no history for this signature yet
      }
    }
    return summaries;
  } catch {
    return [];
  }
};

const latestSummary = (summaries: PersistedSolarBaselineSummary[]): PersistedSolarBaselineSummary | null =>
  summaries
    .sort((left, right) => Date.parse(right.summary.written_at_iso) - Date.parse(left.summary.written_at_iso))[0]
    ?? null;

const selectComparableSolarBaselineSummary = async (
  currentSummary: StarSimSolarBaselineSummary,
): Promise<PersistedSolarBaselineSummary | null> => {
  const priorSummaries = await listPriorSolarBaselineSummaries(currentSummary.target_id);
  if (priorSummaries.length === 0) {
    return null;
  }
  const sameSignature = priorSummaries.filter(
    (entry) => entry.summary.solar_baseline_signature === currentSummary.solar_baseline_signature,
  );
  return latestSummary(sameSignature) ?? latestSummary(priorSummaries);
};

const summarizeSolarBaselineRepeatability = (args: {
  currentSummary: StarSimSolarBaselineSummary;
  previousSummary: StarSimSolarBaselineSummary;
}): StarSimSolarBaselineRepeatability => {
  const driftCategories = new Set<StarSimSolarBaselineRepeatability["drift_categories"][number]>();
  const sameSignature =
    args.currentSummary.solar_baseline_signature === args.previousSummary.solar_baseline_signature;

  if (
    hashStableJson(sortRecord(args.currentSummary.phase_support_summary))
    !== hashStableJson(sortRecord(args.previousSummary.phase_support_summary))
  ) {
    driftCategories.add("phase_support_changed");
  }

  if (
    hashStableJson(args.currentSummary.source_region_summary)
    !== hashStableJson(args.previousSummary.source_region_summary)
  ) {
    driftCategories.add("source_region_linkage_changed");
  }

  if (
    hashStableJson(args.currentSummary.phase_metadata_summary)
    !== hashStableJson(args.previousSummary.phase_metadata_summary)
  ) {
    driftCategories.add("phase_metadata_changed");
  }

  if (
    hashStableJson(sortRecord(args.currentSummary.section_ref_summary))
    !== hashStableJson(sortRecord(args.previousSummary.section_ref_summary))
  ) {
    driftCategories.add("artifact_refs_changed");
  }

  if (
    hashStableJson(sortRecord(args.currentSummary.section_product_summary))
    !== hashStableJson(sortRecord(args.previousSummary.section_product_summary))
  ) {
    driftCategories.add("product_provenance_changed");
  }

  if (
    args.currentSummary.solar_product_registry_id !== args.previousSummary.solar_product_registry_id
    || args.currentSummary.solar_product_registry_version !== args.previousSummary.solar_product_registry_version
    || args.currentSummary.solar_product_registry_content_hash !== args.previousSummary.solar_product_registry_content_hash
  ) {
    driftCategories.add("product_provenance_changed");
  }

  if (
    hashStableJson(args.currentSummary.irradiance_summary)
    !== hashStableJson(args.previousSummary.irradiance_summary)
  ) {
    driftCategories.add("irradiance_context_changed");
  }

  if (
    args.currentSummary.solar_reference_pack_id !== args.previousSummary.solar_reference_pack_id
    || args.currentSummary.solar_reference_pack_version !== args.previousSummary.solar_reference_pack_version
    || args.currentSummary.solar_reference_pack_content_hash !== args.previousSummary.solar_reference_pack_content_hash
  ) {
    driftCategories.add("reference_basis_changed");
  }

  const notes: string[] = [];
  if (sameSignature) {
    notes.push("Compared against the most recent Sun baseline summary with the same signature.");
  } else {
    notes.push("Compared against the most recent persisted Sun baseline summary.");
  }
  if (driftCategories.has("reference_basis_changed")) {
    notes.push("The solar reference pack changed between the two Sun baseline summaries.");
  }
  if (driftCategories.has("product_provenance_changed")) {
    notes.push("One or more Sun baseline section product identities changed between the two summaries.");
  }

  return {
    repeatable: sameSignature && driftCategories.size === 0,
    same_signature: sameSignature,
    drift_categories: [...driftCategories],
    notes,
  };
};

export const buildAndPersistSolarBaselineSummary = async (args: {
  requestDraft: StarSimRequest | null | undefined;
  solarBaselineSupport?: StarSimResolveResponse["solar_baseline_support"];
  solarProvenanceDiagnostics?: StarSimSolarProvenanceDiagnostics | null;
}): Promise<{
  solar_reference_pack_id: string;
  solar_reference_pack_version: string;
  solar_reference_pack_ref: string;
  solar_product_registry_id: string;
  solar_product_registry_version: string;
  solar_product_registry_ref: string;
  solar_consistency_diagnostics: StarSimSolarConsistencyDiagnostics;
  solar_provenance_diagnostics: StarSimSolarProvenanceDiagnostics | null;
  solar_baseline_signature: string;
  previous_solar_baseline_ref: string | null;
  solar_baseline_repeatability?: StarSimSolarBaselineRepeatability;
  summary_artifact: {
    kind: string;
    file_name: string;
    content: StarSimSolarBaselineSummary;
  };
} | null> => {
  const summary = buildSolarBaselineSummary(args);
  if (!summary) {
    return null;
  }
  const previousSummary = await selectComparableSolarBaselineSummary(summary);
  const solarBaselineRepeatability = previousSummary
    ? summarizeSolarBaselineRepeatability({
        currentSummary: summary,
        previousSummary: previousSummary.summary,
      })
    : undefined;
  await writeJsonAtomic(resolveSolarBaselineSummaryPath(summary.solar_baseline_signature), summary);
  await writeJsonAtomic(resolveSolarBaselineHistoryPath(summary), summary);
  return {
    solar_reference_pack_id: summary.solar_reference_pack_id,
    solar_reference_pack_version: summary.solar_reference_pack_version,
    solar_reference_pack_ref: summary.solar_reference_pack_ref,
    solar_product_registry_id: summary.solar_product_registry_id,
    solar_product_registry_version: summary.solar_product_registry_version,
    solar_product_registry_ref: summary.solar_product_registry_ref,
    solar_consistency_diagnostics: summary.solar_consistency_diagnostics,
    solar_provenance_diagnostics: summary.solar_provenance_diagnostics,
    solar_baseline_signature: summary.solar_baseline_signature,
    previous_solar_baseline_ref: previousSummary?.ref ?? null,
    solar_baseline_repeatability: solarBaselineRepeatability,
    summary_artifact: {
      kind: "solar_baseline_summary",
      file_name: "solar-baseline-summary.json",
      content: summary,
    },
  };
};

export const decorateResolveResponseWithSolarBaselineSummary = async (
  response: StarSimResolveResponse,
): Promise<StarSimResolveResponse> => {
  const summary = buildSolarBaselineSummary({
    requestDraft: response.canonical_request_draft,
    solarBaselineSupport: response.solar_baseline_support,
    solarProvenanceDiagnostics: response.solar_provenance_diagnostics ?? response.source_resolution.solar_provenance_diagnostics ?? null,
  });
  if (!summary) {
    return response;
  }
  const previousSummary = await selectComparableSolarBaselineSummary(summary);
  const solarBaselineRepeatability = previousSummary
    ? summarizeSolarBaselineRepeatability({
        currentSummary: summary,
        previousSummary: previousSummary.summary,
      })
    : undefined;

  return {
    ...response,
    source_resolution: {
      ...response.source_resolution,
      solar_reference_pack_id: summary.solar_reference_pack_id,
      solar_reference_pack_version: summary.solar_reference_pack_version,
      solar_reference_pack_ref: summary.solar_reference_pack_ref,
      solar_product_registry_id: summary.solar_product_registry_id,
      solar_product_registry_version: summary.solar_product_registry_version,
      solar_product_registry_ref: summary.solar_product_registry_ref,
      solar_consistency_diagnostics: summary.solar_consistency_diagnostics,
      solar_provenance_diagnostics: summary.solar_provenance_diagnostics ?? undefined,
      solar_baseline_signature: summary.solar_baseline_signature,
      previous_solar_baseline_ref: previousSummary?.ref ?? null,
      solar_baseline_repeatability: solarBaselineRepeatability,
    },
    solar_reference_pack_id: summary.solar_reference_pack_id,
    solar_reference_pack_version: summary.solar_reference_pack_version,
    solar_reference_pack_ref: summary.solar_reference_pack_ref,
    solar_product_registry_id: summary.solar_product_registry_id,
    solar_product_registry_version: summary.solar_product_registry_version,
    solar_product_registry_ref: summary.solar_product_registry_ref,
    solar_consistency_diagnostics: summary.solar_consistency_diagnostics,
    solar_provenance_diagnostics: summary.solar_provenance_diagnostics ?? undefined,
    solar_baseline_signature: summary.solar_baseline_signature,
    previous_solar_baseline_ref: previousSummary?.ref ?? null,
    solar_baseline_repeatability: solarBaselineRepeatability,
  };
};
