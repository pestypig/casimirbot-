import {
  OBSERVABLE_UNIVERSE_ACCORDION_ETA_SURFACE_ID,
  OBSERVABLE_UNIVERSE_SUPPORTED_ETA_MODES,
  type ObservableUniverseSupportedEtaMode,
} from "./observable-universe-accordion-projections-constants";
import {
  ASTRONOMY_ACCORDION_RENDER_TRANSFORM_ID,
  type AstronomyDynamicState,
  type AstronomyFrameLayerV1,
  type AstronomyProvenanceClass,
  type AstronomyReferenceFrameId,
} from "./contracts/astronomy-frame.v1";
import {
  isWarpCatalogEtaProjectionV1,
  type WarpCatalogEtaProjectionEntryV1,
  type WarpCatalogEtaProjectionV1,
} from "./contracts/warp-catalog-eta-projection.v1";
import { resolveObservableUniverseAccordionEtaEntry } from "./observable-universe-accordion-projections";

export type ObservableUniverseAccordionCatalogEntry = {
  id: string;
  label?: string;
  position_m: [number, number, number];
  canonical_position_m?: [number, number, number];
  provenance_class?: AstronomyProvenanceClass;
  source_epoch_tcb_jy?: number | null;
  render_epoch_tcb_jy?: number | null;
  frame_id?: AstronomyReferenceFrameId;
  frame_realization?: string | null;
  dynamic_state?: AstronomyDynamicState;
  render_transform_id?: typeof ASTRONOMY_ACCORDION_RENDER_TRANSFORM_ID | string;
  propagation_limitations?: string[];
};

export type ObservableUniverseAccordionEtaSupport = "contract_backed" | "render_only";

export type ObservableUniverseAccordionEtaSupportReason =
  | "explicit_contract_target"
  | "target_outside_explicit_contract";

type ObservableUniverseAccordionEtaSurfaceEntryBase = {
  id: string;
  label?: string;
  inputPosition_m: [number, number, number];
  inputDistance_m: number;
  inputDirectionUnit: [number, number, number];
  provenance_class: AstronomyProvenanceClass;
  source_epoch_tcb_jy: number | null;
  render_epoch_tcb_jy: number | null;
  frame_id: AstronomyReferenceFrameId;
  frame_realization: string | null;
  dynamic_state: AstronomyDynamicState;
  render_transform_id: string;
  canonicalPosition_m: [number, number, number];
  propagation_limitations: string[];
};

export type ObservableUniverseAccordionEtaSurfaceContractBackedEntry =
  ObservableUniverseAccordionEtaSurfaceEntryBase & {
    etaSupport: "contract_backed";
    etaSupportReason: "explicit_contract_target";
    outputPosition_m: [number, number, number];
    mappedRadius_m: number;
    estimateKind: ObservableUniverseSupportedEtaMode;
    estimateSeconds: number;
    estimateYears: number;
    drivingProfileId: string;
    drivingCenterlineAlpha: number;
    withinSupportedBand: boolean;
    sourceArtifactPath: string;
    renderOnlyReason: null;
  };

export type ObservableUniverseAccordionEtaSurfaceRenderOnlyEntry =
  ObservableUniverseAccordionEtaSurfaceEntryBase & {
    etaSupport: "render_only";
    etaSupportReason: "target_outside_explicit_contract";
    outputPosition_m: [number, number, number];
    mappedRadius_m: null;
    estimateKind: null;
    estimateSeconds: null;
    estimateYears: null;
    drivingProfileId: null;
    drivingCenterlineAlpha: null;
    withinSupportedBand: null;
    sourceArtifactPath: null;
    renderOnlyReason: string;
  };

export type ObservableUniverseAccordionEtaSurfaceEntry =
  | ObservableUniverseAccordionEtaSurfaceContractBackedEntry
  | ObservableUniverseAccordionEtaSurfaceRenderOnlyEntry;

type ObservableUniverseAccordionEtaSurfaceBase = {
  kind: "observable_universe_accordion_eta_surface";
  surfaceId: typeof OBSERVABLE_UNIVERSE_ACCORDION_ETA_SURFACE_ID;
  sourceModel: "warp_worldline_route_time";
  projectionKind: "sun_centered_accessibility";
  semantics: "bounded_target_coupled_trip_estimate";
  status: "computed" | "unavailable";
  metricFamily: string | null;
  defaultOperatingProfileId: string | null;
  supportedBandFloorProfileId: string | null;
  supportedBandCeilingProfileId: string | null;
  evidenceFloorProfileId: string | null;
  evidenceFloorCenterlineAlpha: number | null;
  supportBufferDeltaCenterlineAlpha: number | null;
  supportedBandStatus: string | null;
  autoTracksEvidenceFloor: boolean;
  radiusMeaning: string;
  supportedModes: ObservableUniverseSupportedEtaMode[];
  sourceBoundaryArtifactPath: string | null;
  sourceDefaultMissionTimeComparisonArtifactPath: string | null;
  sourceSupportedFloorMissionTimeComparisonArtifactPath: string | null;
  sourceEvidenceFloorMissionTimeComparisonArtifactPath: string | null;
  claimBoundary: string[];
  nonClaims: string[];
  canonicalFrame: {
    id: AstronomyReferenceFrameId;
    realization: string | null;
    timeScale: "TCB";
  };
  renderFrame: {
    id: "sol_centered_accordion_render";
    transformId: string;
  };
  referenceEpoch: {
    kind: "uniform" | "mixed" | "unknown";
    tcb_jy: number | null;
    min_tcb_jy: number | null;
    max_tcb_jy: number | null;
  };
  renderEpoch_tcb_jy: number | null;
  propagationApplied: boolean;
  propagationLimitations: string[];
  hiddenAnchorCount: number;
  hiddenAnchorsUsed: boolean;
  provenanceSummary: Record<AstronomyProvenanceClass, number>;
  frameLayer?: AstronomyFrameLayerV1;
};

export type ObservableUniverseAccordionEtaSurfaceUnavailable =
  ObservableUniverseAccordionEtaSurfaceBase & {
    status: "unavailable";
    fail_id:
      | "NHM2_EXPLICIT_CONTRACT_MISSING"
      | "NHM2_TARGET_NOT_IN_EXPLICIT_CONTRACT"
      | "NHM2_REQUESTED_MODE_UNSUPPORTED";
    reason: string;
    deferredState: "fail_closed_deferred";
    entries?: undefined;
  };

export type ObservableUniverseAccordionEtaSurfaceComputed =
  ObservableUniverseAccordionEtaSurfaceBase & {
    status: "computed";
    estimateKind: ObservableUniverseSupportedEtaMode;
    entries: ObservableUniverseAccordionEtaSurfaceEntry[];
  };

export type ObservableUniverseAccordionEtaSurfaceResult =
  | ObservableUniverseAccordionEtaSurfaceComputed
  | ObservableUniverseAccordionEtaSurfaceUnavailable;

const zeroVec = (): [number, number, number] => [0, 0, 0];

const norm = (vec: [number, number, number]): number =>
  Math.hypot(vec[0], vec[1], vec[2]);

const scale = (
  vec: [number, number, number],
  factor: number,
): [number, number, number] => [vec[0] * factor, vec[1] * factor, vec[2] * factor];

const directionUnitFor = (
  vec: [number, number, number],
): [number, number, number] => {
  const magnitude = norm(vec);
  if (!(magnitude > 0)) return zeroVec();
  return scale(vec, 1 / magnitude);
};

const normalizeTargetKey = (value: string | undefined): string =>
  (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

const summarizeReferenceEpoch = (
  catalog: ObservableUniverseAccordionCatalogEntry[],
): ObservableUniverseAccordionEtaSurfaceBase["referenceEpoch"] => {
  const epochs = catalog
    .map((entry) => entry.source_epoch_tcb_jy)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .sort((left, right) => left - right);
  if (epochs.length === 0) {
    return { kind: "unknown", tcb_jy: null, min_tcb_jy: null, max_tcb_jy: null };
  }
  const min = epochs[0];
  const max = epochs[epochs.length - 1];
  return {
    kind: min === max ? "uniform" : "mixed",
    tcb_jy: min === max ? min : null,
    min_tcb_jy: min,
    max_tcb_jy: max,
  };
};

const summarizeProvenance = (
  catalog: ObservableUniverseAccordionCatalogEntry[],
): Record<AstronomyProvenanceClass, number> => {
  const summary: Record<AstronomyProvenanceClass, number> = {
    observed: 0,
    synthetic_truth: 0,
    synthetic_observed: 0,
    inferred: 0,
  };
  for (const entry of catalog) {
    const key = entry.provenance_class ?? "observed";
    summary[key] += 1;
  }
  return summary;
};

const summarizePropagationLimitations = (catalog: ObservableUniverseAccordionCatalogEntry[]): string[] =>
  Array.from(
    new Set(
      catalog.flatMap((entry) => entry.propagation_limitations ?? []).filter((value) => value.trim().length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right));

const buildBase = (
  contract: WarpCatalogEtaProjectionV1 | null,
  radiusMeaning: string,
  context?: {
    catalog?: ObservableUniverseAccordionCatalogEntry[];
    canonicalFrameId?: AstronomyReferenceFrameId;
    canonicalFrameRealization?: string | null;
    renderEpoch_tcb_jy?: number | null;
    propagationApplied?: boolean;
    hiddenAnchorCount?: number;
    hiddenAnchorsUsed?: boolean;
    frameLayer?: AstronomyFrameLayerV1;
  },
): ObservableUniverseAccordionEtaSurfaceBase => ({
  kind: "observable_universe_accordion_eta_surface",
  surfaceId: OBSERVABLE_UNIVERSE_ACCORDION_ETA_SURFACE_ID,
  sourceModel: "warp_worldline_route_time",
  projectionKind: "sun_centered_accessibility",
  semantics: "bounded_target_coupled_trip_estimate",
  status: "unavailable",
  metricFamily: contract?.metricFamily ?? null,
  defaultOperatingProfileId: contract?.defaultOperatingProfileId ?? null,
  supportedBandFloorProfileId: contract?.supportedBandFloorProfileId ?? null,
  supportedBandCeilingProfileId: contract?.supportedBandCeilingProfileId ?? null,
  evidenceFloorProfileId: contract?.evidenceFloorProfileId ?? null,
  evidenceFloorCenterlineAlpha: contract?.evidenceFloorCenterlineAlpha ?? null,
  supportBufferDeltaCenterlineAlpha:
    contract?.supportBufferDeltaCenterlineAlpha ?? null,
  supportedBandStatus: contract?.supportedBandStatus ?? null,
  autoTracksEvidenceFloor: contract?.autoTracksEvidenceFloor ?? false,
  radiusMeaning,
  supportedModes: [...OBSERVABLE_UNIVERSE_SUPPORTED_ETA_MODES],
  sourceBoundaryArtifactPath: contract?.sourceBoundaryArtifactPath ?? null,
  sourceDefaultMissionTimeComparisonArtifactPath:
    contract?.sourceDefaultMissionTimeComparisonArtifactPath ?? null,
  sourceSupportedFloorMissionTimeComparisonArtifactPath:
    contract?.sourceSupportedFloorMissionTimeComparisonArtifactPath ?? null,
  sourceEvidenceFloorMissionTimeComparisonArtifactPath:
    contract?.sourceEvidenceFloorMissionTimeComparisonArtifactPath ?? null,
  claimBoundary: contract?.claimBoundary ?? [
    "bounded target-coupled trip-estimate layer only",
    "not an unconstrained catalog ETA surface",
  ],
  nonClaims: contract?.nonClaims ?? [
    "not an unconstrained catalog ETA surface",
    "route_map_eta_surface_still_target_coupled_only",
  ],
  canonicalFrame: {
    id: context?.canonicalFrameId ?? "ICRS",
    realization: context?.canonicalFrameRealization ?? "Gaia_CRF3",
    timeScale: "TCB",
  },
  renderFrame: {
    id: "sol_centered_accordion_render",
    transformId: ASTRONOMY_ACCORDION_RENDER_TRANSFORM_ID,
  },
  referenceEpoch: summarizeReferenceEpoch(context?.catalog ?? []),
  renderEpoch_tcb_jy: context?.renderEpoch_tcb_jy ?? null,
  propagationApplied: context?.propagationApplied ?? false,
  propagationLimitations: summarizePropagationLimitations(context?.catalog ?? []),
  hiddenAnchorCount: context?.hiddenAnchorCount ?? 0,
  hiddenAnchorsUsed: context?.hiddenAnchorsUsed ?? false,
  provenanceSummary: summarizeProvenance(context?.catalog ?? []),
  ...(context?.frameLayer ? { frameLayer: context.frameLayer } : {}),
});

const isCoveredTarget = (
  catalogEntry: ObservableUniverseAccordionCatalogEntry,
  entry: WarpCatalogEtaProjectionEntryV1,
): boolean => {
  const keys = [
    normalizeTargetKey(catalogEntry.id),
    normalizeTargetKey(catalogEntry.label),
  ];
  const targetKeys = [
    normalizeTargetKey(entry.targetId),
    normalizeTargetKey(entry.targetName),
  ];
  return keys.some((key) => key.length > 0 && targetKeys.includes(key));
};

const buildEntryBase = (
  catalogEntry: ObservableUniverseAccordionCatalogEntry,
  inputDirectionUnit: [number, number, number],
): ObservableUniverseAccordionEtaSurfaceEntryBase => ({
  id: catalogEntry.id,
  label: catalogEntry.label,
  inputPosition_m: catalogEntry.position_m,
  inputDistance_m: norm(catalogEntry.position_m),
  inputDirectionUnit,
  provenance_class: catalogEntry.provenance_class ?? "observed",
  source_epoch_tcb_jy: catalogEntry.source_epoch_tcb_jy ?? null,
  render_epoch_tcb_jy: catalogEntry.render_epoch_tcb_jy ?? null,
  frame_id: catalogEntry.frame_id ?? "ICRS",
  frame_realization: catalogEntry.frame_realization ?? "Gaia_CRF3",
  dynamic_state: catalogEntry.dynamic_state ?? "legacy_render_seed",
  render_transform_id:
    catalogEntry.render_transform_id ?? ASTRONOMY_ACCORDION_RENDER_TRANSFORM_ID,
  canonicalPosition_m: catalogEntry.canonical_position_m ?? catalogEntry.position_m,
  propagation_limitations: [...(catalogEntry.propagation_limitations ?? [])],
});

export const buildObservableUniverseAccordionEtaSurface = (args: {
  contract: WarpCatalogEtaProjectionV1 | null | undefined;
  catalog: ObservableUniverseAccordionCatalogEntry[];
  estimateKind?: ObservableUniverseSupportedEtaMode;
  canonicalFrameId?: AstronomyReferenceFrameId;
  canonicalFrameRealization?: string | null;
  renderEpoch_tcb_jy?: number | null;
  propagationApplied?: boolean;
  hiddenAnchorCount?: number;
  hiddenAnchorsUsed?: boolean;
  frameLayer?: AstronomyFrameLayerV1;
}): ObservableUniverseAccordionEtaSurfaceResult => {
  const estimateKind = args.estimateKind ?? "proper_time";
  const contract = isWarpCatalogEtaProjectionV1(args.contract) ? args.contract : null;
  const radiusMeaning =
    estimateKind === "proper_time"
      ? "Output radius means c times the bounded ship proper-time trip estimate."
      : "Output radius means c times the bounded coordinate-time trip estimate.";

  if (!contract) {
    return {
      ...buildBase(null, radiusMeaning, {
        catalog: args.catalog,
        canonicalFrameId: args.canonicalFrameId,
        canonicalFrameRealization: args.canonicalFrameRealization,
        renderEpoch_tcb_jy: args.renderEpoch_tcb_jy,
        propagationApplied: args.propagationApplied,
        hiddenAnchorCount: args.hiddenAnchorCount,
        hiddenAnchorsUsed: args.hiddenAnchorsUsed,
        frameLayer: args.frameLayer,
      }),
      fail_id: "NHM2_EXPLICIT_CONTRACT_MISSING",
      reason:
        "The explicit NHM2 catalog ETA contract is missing or invalid, so the product layer stays fail-closed and no SR fallback is allowed.",
      deferredState: "fail_closed_deferred",
    };
  }

  const contractEntry = resolveObservableUniverseAccordionEtaEntry(
    contract,
    estimateKind,
  );
  if (!contractEntry) {
    return {
      ...buildBase(contract, radiusMeaning, {
        catalog: args.catalog,
        canonicalFrameId: args.canonicalFrameId,
        canonicalFrameRealization: args.canonicalFrameRealization,
        renderEpoch_tcb_jy: args.renderEpoch_tcb_jy,
        propagationApplied: args.propagationApplied,
        hiddenAnchorCount: args.hiddenAnchorCount,
        hiddenAnchorsUsed: args.hiddenAnchorsUsed,
        frameLayer: args.frameLayer,
      }),
      fail_id: "NHM2_REQUESTED_MODE_UNSUPPORTED",
      reason:
        "The requested bounded trip-estimate mode is not present in the explicit NHM2 contract, so the surface stays fail-closed.",
      deferredState: "fail_closed_deferred",
    };
  }

  if (
    args.catalog.length === 0 ||
    !args.catalog.some((catalogEntry) => isCoveredTarget(catalogEntry, contractEntry))
  ) {
    return {
      ...buildBase(contract, contractEntry.radiusMeaning, {
        catalog: args.catalog,
        canonicalFrameId: args.canonicalFrameId,
        canonicalFrameRealization: args.canonicalFrameRealization,
        renderEpoch_tcb_jy: args.renderEpoch_tcb_jy,
        propagationApplied: args.propagationApplied,
        hiddenAnchorCount: args.hiddenAnchorCount,
        hiddenAnchorsUsed: args.hiddenAnchorsUsed,
        frameLayer: args.frameLayer,
      }),
      fail_id: "NHM2_TARGET_NOT_IN_EXPLICIT_CONTRACT",
      reason:
        "The explicit NHM2 contract is target-coupled and only covers the declared supported catalog target. Requests outside that contract stay fail-closed.",
      deferredState: "fail_closed_deferred",
    };
  }

  const entries: ObservableUniverseAccordionEtaSurfaceEntry[] = args.catalog.map(
    (catalogEntry) => {
      const inputDirectionUnit = directionUnitFor(catalogEntry.position_m);
      const entryBase = buildEntryBase(catalogEntry, inputDirectionUnit);
      if (!isCoveredTarget(catalogEntry, contractEntry)) {
        return {
          ...entryBase,
          etaSupport: "render_only",
          etaSupportReason: "target_outside_explicit_contract",
          outputPosition_m: entryBase.canonicalPosition_m,
          mappedRadius_m: null,
          estimateKind: null,
          estimateSeconds: null,
          estimateYears: null,
          drivingProfileId: null,
          drivingCenterlineAlpha: null,
          withinSupportedBand: null,
          sourceArtifactPath: null,
          renderOnlyReason:
            "Visible in the nearby-star accordion catalog, but outside the explicit NHM2 target contract. The entry remains render-only and does not receive a fabricated ETA.",
        };
      }

      const outputPosition_m = scale(inputDirectionUnit, contractEntry.outputRadius_m);
      return {
        ...entryBase,
        etaSupport: "contract_backed",
        etaSupportReason: "explicit_contract_target",
        outputPosition_m,
        mappedRadius_m: contractEntry.outputRadius_m,
        estimateKind,
        estimateSeconds: contractEntry.estimate.seconds,
        estimateYears: contractEntry.estimate.years,
        drivingProfileId: contractEntry.drivingProfileId,
        drivingCenterlineAlpha: contractEntry.drivingCenterlineAlpha,
        withinSupportedBand: contractEntry.withinSupportedBand,
        sourceArtifactPath: contractEntry.sourceArtifactPath,
        render_epoch_tcb_jy:
          catalogEntry.render_epoch_tcb_jy ?? args.renderEpoch_tcb_jy ?? null,
        renderOnlyReason: null,
      };
    },
  );

  return {
    ...buildBase(contract, contractEntry.radiusMeaning, {
      catalog: args.catalog,
      canonicalFrameId: args.canonicalFrameId,
      canonicalFrameRealization: args.canonicalFrameRealization,
      renderEpoch_tcb_jy: args.renderEpoch_tcb_jy,
      propagationApplied: args.propagationApplied,
      hiddenAnchorCount: args.hiddenAnchorCount,
      hiddenAnchorsUsed: args.hiddenAnchorsUsed,
      frameLayer: args.frameLayer,
    }),
    status: "computed",
    estimateKind,
    entries,
  };
};
