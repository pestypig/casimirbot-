import {
  WARP_CATALOG_ETA_PROJECTION_CONTRACT_VERSION,
  buildOutputRadiusMeters,
  type WarpCatalogEtaProjectionEntryV1,
  type WarpCatalogEtaProjectionEstimateKind,
  type WarpCatalogEtaProjectionV1,
} from "./contracts/warp-catalog-eta-projection.v1";
import {
  WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION,
} from "./contracts/warp-mission-time-comparison.v1";
import type { WarpMissionTimeScalarEstimate } from "./contracts/warp-mission-time-estimator.v1";
import {
  OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY,
  type ObservableUniverseSupportedEtaMode,
} from "./observable-universe-accordion-projections-constants";

type JsonRecord = Record<string, unknown>;

type BoundarySweepEntry = {
  shiftLapseProfileId: string;
};

type MissionTimeComparisonArtifactSource = {
  targetId: "alpha-cen-a" | "proxima";
  targetName: string;
  targetFrame: "heliocentric-icrs";
  metricFamily: string;
  shiftLapseProfileId: string;
  centerlineAlpha: number;
  warpCoordinateTimeEstimate: WarpMissionTimeScalarEstimate;
  warpProperTimeEstimate: WarpMissionTimeScalarEstimate;
  nonClaims: string[];
};

export type ObservableUniverseAccordionProjectionSourceBundle = {
  boundaryArtifact: unknown;
  defaultMissionTimeComparison: unknown;
  supportedFloorMissionTimeComparison: unknown;
  supportedBandCeilingReferenceMissionTimeComparison: unknown;
  evidenceFloorMissionTimeComparison: unknown;
};

const dedupeStrings = (values: readonly string[]): string[] =>
  Array.from(new Set(values.filter((value) => value.trim().length > 0)));

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" ? (value as JsonRecord) : {};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isScalarEstimate = (
  value: unknown,
): value is WarpMissionTimeScalarEstimate => {
  if (!value || typeof value !== "object") return false;
  const record = value as JsonRecord;
  const units = asRecord(record.units);
  return Boolean(
    isFiniteNumber(record.seconds) &&
      record.seconds > 0 &&
      isFiniteNumber(record.years) &&
      record.years > 0 &&
      isString(record.meaning) &&
      units.primary === "s" &&
      units.secondary === "yr",
  );
};

const parseMissionTimeComparisonArtifact = (
  value: unknown,
): MissionTimeComparisonArtifactSource | null => {
  const record = asRecord(value);
  const sourceSurface = asRecord(record.sourceSurface);
  const promotionGate = asRecord(sourceSurface.shiftLapseTransportPromotionGate);
  if (
    record.contractVersion !== WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION ||
    record.status !== "bounded_target_coupled_comparison_ready" ||
    record.certified !== true ||
    (record.targetId !== "alpha-cen-a" && record.targetId !== "proxima") ||
    !isString(record.targetName) ||
    record.targetFrame !== "heliocentric-icrs" ||
    !isString(sourceSurface.metricFamily) ||
    !isString(sourceSurface.shiftLapseProfileId) ||
    !isFiniteNumber(promotionGate.centerlineAlpha) ||
    !isScalarEstimate(record.warpCoordinateTimeEstimate) ||
    !isScalarEstimate(record.warpProperTimeEstimate) ||
    !isStringArray(record.nonClaims)
  ) {
    return null;
  }
  return {
    targetId: record.targetId,
    targetName: record.targetName,
    targetFrame: record.targetFrame,
    metricFamily: sourceSurface.metricFamily,
    shiftLapseProfileId: sourceSurface.shiftLapseProfileId,
    centerlineAlpha: promotionGate.centerlineAlpha,
    warpCoordinateTimeEstimate: record.warpCoordinateTimeEstimate,
    warpProperTimeEstimate: record.warpProperTimeEstimate,
    nonClaims: record.nonClaims,
  };
};

const buildClaimBoundary = (): string[] =>
  dedupeStrings([
    "bounded target-coupled trip-estimate layer only",
    "default operating profile only",
    "supported band is manual and static until explicitly reviewed",
    "evidence floor is provenance only and not an active product default",
    "not an unconstrained catalog ETA surface",
    "not a max-speed certificate",
    "not a viability promotion",
    "not a speed-based relativistic-advantage certificate",
  ]);

const buildNonClaims = (
  defaultComparison: MissionTimeComparisonArtifactSource,
): string[] =>
  dedupeStrings([
    ...defaultComparison.nonClaims,
    "not an unconstrained catalog ETA surface",
    "not a viability promotion",
    "route_map_eta_surface_still_target_coupled_only",
  ]);

const buildRadiusMeaning = (estimateKind: WarpCatalogEtaProjectionEstimateKind): string =>
  estimateKind === "proper_time"
    ? "Output radius is c times the bounded ship proper-time trip estimate from the explicit default NHM2 contract-backed target-coupled layer."
    : "Output radius is c times the bounded coordinate-time trip estimate from the explicit default NHM2 contract-backed target-coupled layer.";

const buildEntry = (args: {
  defaultMissionTimeComparison: MissionTimeComparisonArtifactSource;
  defaultArtifactPath: string;
  estimateKind: WarpCatalogEtaProjectionEstimateKind;
  drivingProfileId: string;
  drivingCenterlineAlpha: number;
  supportedBandFloorProfileId: string;
  supportedBandCeilingProfileId: string;
  withinSupportedBand: boolean;
  claimBoundary: string[];
  nonClaims: string[];
}): WarpCatalogEtaProjectionEntryV1 => {
  const estimate =
    args.estimateKind === "proper_time"
      ? args.defaultMissionTimeComparison.warpProperTimeEstimate
      : args.defaultMissionTimeComparison.warpCoordinateTimeEstimate;
  return {
    entryId: `${args.defaultMissionTimeComparison.targetId}:${args.estimateKind}`,
    targetId: args.defaultMissionTimeComparison.targetId,
    targetName: args.defaultMissionTimeComparison.targetName,
    targetFrame: args.defaultMissionTimeComparison.targetFrame,
    estimateKind: args.estimateKind,
    estimate,
    outputRadius_m: buildOutputRadiusMeters(estimate),
    radiusMeaning: buildRadiusMeaning(args.estimateKind),
    drivingProfileId: args.drivingProfileId,
    drivingCenterlineAlpha: args.drivingCenterlineAlpha,
    supportedBandFloorProfileId: args.supportedBandFloorProfileId,
    supportedBandCeilingProfileId: args.supportedBandCeilingProfileId,
    withinSupportedBand: args.withinSupportedBand,
    sourceArtifactPath: args.defaultArtifactPath,
    claimBoundary: [...args.claimBoundary],
    nonClaims: [...args.nonClaims],
  };
};

const boundaryArtifactSupportsProfile = (
  boundaryArtifact: unknown,
  profileId: string,
): boolean => {
  const record = asRecord(boundaryArtifact);
  const entries = Array.isArray(record.entries)
    ? (record.entries as BoundarySweepEntry[])
    : [];
  return entries.some((entry) => entry?.shiftLapseProfileId === profileId);
};

export const buildObservableUniverseAccordionEtaProjection = (
  sources: ObservableUniverseAccordionProjectionSourceBundle,
): WarpCatalogEtaProjectionV1 | null => {
  const policy = OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY;
  const boundaryArtifact = asRecord(sources.boundaryArtifact);
  const defaultMissionTimeComparison = parseMissionTimeComparisonArtifact(
    sources.defaultMissionTimeComparison,
  );
  const supportedFloorMissionTimeComparison = parseMissionTimeComparisonArtifact(
    sources.supportedFloorMissionTimeComparison,
  );
  const supportedBandCeilingReferenceMissionTimeComparison =
    parseMissionTimeComparisonArtifact(
      sources.supportedBandCeilingReferenceMissionTimeComparison,
    );
  const evidenceFloorMissionTimeComparison = parseMissionTimeComparisonArtifact(
    sources.evidenceFloorMissionTimeComparison,
  );

  if (
    boundaryArtifact.canonicalBaselineLatestAliasesChanged !== false ||
    boundaryArtifact.referenceSelectedFamilyResult == null
  ) {
    return null;
  }
  const referenceSelectedFamilyResult = asRecord(
    boundaryArtifact.referenceSelectedFamilyResult,
  );
  if (
    referenceSelectedFamilyResult.shiftLapseProfileId !==
    policy.supportedBandCeilingProfileId
  ) {
    return null;
  }

  if (
    defaultMissionTimeComparison == null ||
    supportedFloorMissionTimeComparison == null ||
    supportedBandCeilingReferenceMissionTimeComparison == null ||
    evidenceFloorMissionTimeComparison == null
  ) {
    return null;
  }

  const defaultProfileId = defaultMissionTimeComparison.shiftLapseProfileId;
  const supportedFloorProfileId =
    supportedFloorMissionTimeComparison.shiftLapseProfileId;
  const supportedBandCeilingProfileId =
    supportedBandCeilingReferenceMissionTimeComparison.shiftLapseProfileId;
  const evidenceFloorProfileId =
    evidenceFloorMissionTimeComparison.shiftLapseProfileId;
  const defaultAlpha = defaultMissionTimeComparison.centerlineAlpha;
  const supportedFloorAlpha = supportedFloorMissionTimeComparison.centerlineAlpha;
  const supportedBandCeilingAlpha =
    supportedBandCeilingReferenceMissionTimeComparison.centerlineAlpha;
  const evidenceFloorAlpha = evidenceFloorMissionTimeComparison.centerlineAlpha;

  if (
    defaultProfileId !== policy.defaultOperatingProfileId ||
    supportedFloorProfileId !== policy.supportedBandFloorProfileId ||
    supportedBandCeilingProfileId !== policy.supportedBandCeilingProfileId ||
    evidenceFloorProfileId !== policy.evidenceFloorProfileId
  ) {
    return null;
  }

  if (
    defaultMissionTimeComparison.targetId !==
      supportedFloorMissionTimeComparison.targetId ||
    defaultMissionTimeComparison.targetId !==
      supportedBandCeilingReferenceMissionTimeComparison.targetId ||
    defaultMissionTimeComparison.targetId !==
      evidenceFloorMissionTimeComparison.targetId ||
    defaultMissionTimeComparison.targetName !==
      supportedFloorMissionTimeComparison.targetName ||
    defaultMissionTimeComparison.targetName !==
      supportedBandCeilingReferenceMissionTimeComparison.targetName ||
    defaultMissionTimeComparison.targetName !==
      evidenceFloorMissionTimeComparison.targetName ||
    defaultMissionTimeComparison.metricFamily !==
      supportedFloorMissionTimeComparison.metricFamily ||
    defaultMissionTimeComparison.metricFamily !==
      supportedBandCeilingReferenceMissionTimeComparison.metricFamily ||
    defaultMissionTimeComparison.metricFamily !==
      evidenceFloorMissionTimeComparison.metricFamily
  ) {
    return null;
  }

  if (
    defaultProfileId === supportedFloorProfileId ||
    evidenceFloorAlpha !== policy.evidenceFloorCenterlineAlpha ||
    Number((supportedFloorAlpha - evidenceFloorAlpha).toFixed(6)) !==
      policy.supportBufferDeltaCenterlineAlpha ||
    !boundaryArtifactSupportsProfile(
      sources.boundaryArtifact,
      policy.defaultOperatingProfileId,
    ) ||
    !boundaryArtifactSupportsProfile(
      sources.boundaryArtifact,
      policy.supportedBandFloorProfileId,
    ) ||
    !boundaryArtifactSupportsProfile(
      sources.boundaryArtifact,
      policy.evidenceFloorProfileId,
    )
  ) {
    return null;
  }

  const withinSupportedBand =
    defaultAlpha >= supportedFloorAlpha &&
    defaultAlpha <= supportedBandCeilingAlpha;
  const claimBoundary = buildClaimBoundary();
  const nonClaims = buildNonClaims(defaultMissionTimeComparison);

  return {
    contractVersion: WARP_CATALOG_ETA_PROJECTION_CONTRACT_VERSION,
    status: "bounded_target_coupled_trip_estimate_ready",
    metricFamily: defaultMissionTimeComparison.metricFamily,
    defaultOperatingProfileId: policy.defaultOperatingProfileId,
    supportedBandFloorProfileId: policy.supportedBandFloorProfileId,
    supportedBandCeilingProfileId: policy.supportedBandCeilingProfileId,
    evidenceFloorProfileId: policy.evidenceFloorProfileId,
    evidenceFloorCenterlineAlpha: policy.evidenceFloorCenterlineAlpha,
    supportBufferDeltaCenterlineAlpha: policy.supportBufferDeltaCenterlineAlpha,
    supportedBandStatus: policy.supportedBandStatus,
    autoTracksEvidenceFloor: policy.autoTracksEvidenceFloor,
    sourceBoundaryArtifactPath: policy.sourceBoundaryArtifactPath,
    sourceDefaultMissionTimeComparisonArtifactPath:
      policy.sourceDefaultMissionTimeComparisonArtifactPath,
    sourceSupportedFloorMissionTimeComparisonArtifactPath:
      policy.sourceSupportedFloorMissionTimeComparisonArtifactPath,
    sourceEvidenceFloorMissionTimeComparisonArtifactPath:
      policy.sourceEvidenceFloorMissionTimeComparisonArtifactPath,
    entries: (["proper_time", "coordinate_time"] as const).map((estimateKind) =>
      buildEntry({
        defaultMissionTimeComparison,
        defaultArtifactPath: policy.sourceDefaultMissionTimeComparisonArtifactPath,
        estimateKind,
        drivingProfileId: policy.defaultOperatingProfileId,
        drivingCenterlineAlpha: defaultAlpha,
        supportedBandFloorProfileId: policy.supportedBandFloorProfileId,
        supportedBandCeilingProfileId: policy.supportedBandCeilingProfileId,
        withinSupportedBand,
        claimBoundary,
        nonClaims,
      }),
    ),
    claimBoundary,
    nonClaims,
  };
};

export const resolveObservableUniverseAccordionEtaEntry = (
  contract: WarpCatalogEtaProjectionV1,
  estimateKind: ObservableUniverseSupportedEtaMode,
): WarpCatalogEtaProjectionEntryV1 | null =>
  contract.entries.find((entry) => entry.estimateKind === estimateKind) ?? null;
