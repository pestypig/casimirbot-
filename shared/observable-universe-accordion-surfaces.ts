import {
  OBSERVABLE_UNIVERSE_ACCORDION_ETA_SURFACE_ID,
  OBSERVABLE_UNIVERSE_SUPPORTED_ETA_MODES,
  type ObservableUniverseSupportedEtaMode,
} from "./observable-universe-accordion-projections-constants";
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
};

export type ObservableUniverseAccordionEtaSurfaceEntry = {
  id: string;
  label?: string;
  inputPosition_m: [number, number, number];
  inputDistance_m: number;
  inputDirectionUnit: [number, number, number];
  outputPosition_m: [number, number, number];
  mappedRadius_m: number;
  estimateKind: ObservableUniverseSupportedEtaMode;
  estimateSeconds: number;
  estimateYears: number;
  drivingProfileId: string;
  drivingCenterlineAlpha: number;
  withinSupportedBand: boolean;
  sourceArtifactPath: string;
};

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

const buildBase = (
  contract: WarpCatalogEtaProjectionV1 | null,
  radiusMeaning: string,
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

export const buildObservableUniverseAccordionEtaSurface = (args: {
  contract: WarpCatalogEtaProjectionV1 | null | undefined;
  catalog: ObservableUniverseAccordionCatalogEntry[];
  estimateKind?: ObservableUniverseSupportedEtaMode;
}): ObservableUniverseAccordionEtaSurfaceResult => {
  const estimateKind = args.estimateKind ?? "proper_time";
  const contract = isWarpCatalogEtaProjectionV1(args.contract) ? args.contract : null;
  const radiusMeaning =
    estimateKind === "proper_time"
      ? "Output radius means c times the bounded ship proper-time trip estimate."
      : "Output radius means c times the bounded coordinate-time trip estimate.";

  if (!contract) {
    return {
      ...buildBase(null, radiusMeaning),
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
      ...buildBase(contract, radiusMeaning),
      fail_id: "NHM2_REQUESTED_MODE_UNSUPPORTED",
      reason:
        "The requested bounded trip-estimate mode is not present in the explicit NHM2 contract, so the surface stays fail-closed.",
      deferredState: "fail_closed_deferred",
    };
  }

  if (
    args.catalog.length === 0 ||
    args.catalog.some((catalogEntry) => !isCoveredTarget(catalogEntry, contractEntry))
  ) {
    return {
      ...buildBase(contract, contractEntry.radiusMeaning),
      fail_id: "NHM2_TARGET_NOT_IN_EXPLICIT_CONTRACT",
      reason:
        "The explicit NHM2 contract is target-coupled and only covers the declared supported catalog target. Requests outside that contract stay fail-closed.",
      deferredState: "fail_closed_deferred",
    };
  }

  const entries: ObservableUniverseAccordionEtaSurfaceEntry[] = args.catalog.map(
    (catalogEntry) => {
      const inputDistance = norm(catalogEntry.position_m);
      const inputDirectionUnit = directionUnitFor(catalogEntry.position_m);
      const outputPosition_m = scale(
        inputDirectionUnit,
        contractEntry.outputRadius_m,
      );
      return {
        id: catalogEntry.id,
        label: catalogEntry.label,
        inputPosition_m: catalogEntry.position_m,
        inputDistance_m: inputDistance,
        inputDirectionUnit,
        outputPosition_m,
        mappedRadius_m: contractEntry.outputRadius_m,
        estimateKind,
        estimateSeconds: contractEntry.estimate.seconds,
        estimateYears: contractEntry.estimate.years,
        drivingProfileId: contractEntry.drivingProfileId,
        drivingCenterlineAlpha: contractEntry.drivingCenterlineAlpha,
        withinSupportedBand: contractEntry.withinSupportedBand,
        sourceArtifactPath: contractEntry.sourceArtifactPath,
      };
    },
  );

  return {
    ...buildBase(contract, contractEntry.radiusMeaning),
    status: "computed",
    estimateKind,
    entries,
  };
};
