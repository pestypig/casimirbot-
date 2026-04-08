import type {
  WarpMissionEstimatorTargetId,
  WarpMissionTimeScalarEstimate,
} from "./warp-mission-time-estimator.v1";

export const SPEED_OF_LIGHT_MPS = 299_792_458;

export const WARP_CATALOG_ETA_PROJECTION_CONTRACT_VERSION =
  "warp_catalog_eta_projection/v1";

export type WarpCatalogEtaProjectionStatus =
  "bounded_target_coupled_trip_estimate_ready";

export type WarpCatalogEtaProjectionEstimateKind =
  | "proper_time"
  | "coordinate_time";

export type WarpCatalogEtaProjectionSupportedBandStatus =
  "manually_reviewed_static_band";

export type WarpCatalogEtaProjectionEntryV1 = {
  entryId: string;
  targetId: WarpMissionEstimatorTargetId;
  targetName: string;
  targetFrame: "heliocentric-icrs";
  estimateKind: WarpCatalogEtaProjectionEstimateKind;
  estimate: WarpMissionTimeScalarEstimate;
  outputRadius_m: number;
  radiusMeaning: string;
  drivingProfileId: string;
  drivingCenterlineAlpha: number;
  supportedBandFloorProfileId: string;
  supportedBandCeilingProfileId: string;
  withinSupportedBand: boolean;
  sourceArtifactPath: string;
  claimBoundary: string[];
  nonClaims: string[];
};

export type WarpCatalogEtaProjectionV1 = {
  contractVersion: typeof WARP_CATALOG_ETA_PROJECTION_CONTRACT_VERSION;
  status: WarpCatalogEtaProjectionStatus;
  metricFamily: string;
  defaultOperatingProfileId: string;
  supportedBandFloorProfileId: string;
  supportedBandCeilingProfileId: string;
  evidenceFloorProfileId: string;
  evidenceFloorCenterlineAlpha: number;
  supportBufferDeltaCenterlineAlpha: number;
  supportedBandStatus: WarpCatalogEtaProjectionSupportedBandStatus;
  autoTracksEvidenceFloor: false;
  sourceBoundaryArtifactPath: string;
  sourceDefaultMissionTimeComparisonArtifactPath: string;
  sourceSupportedFloorMissionTimeComparisonArtifactPath: string;
  sourceEvidenceFloorMissionTimeComparisonArtifactPath: string;
  entries: WarpCatalogEtaProjectionEntryV1[];
  claimBoundary: string[];
  nonClaims: string[];
};

type ScalarEstimateRecord = Record<string, unknown>;

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
  const record = value as ScalarEstimateRecord;
  const units = record.units as ScalarEstimateRecord | undefined;
  return Boolean(
    isFiniteNumber(record.seconds) &&
      record.seconds > 0 &&
      isFiniteNumber(record.years) &&
      record.years > 0 &&
      isString(record.meaning) &&
      units?.primary === "s" &&
      units?.secondary === "yr",
  );
};

export const isWarpCatalogEtaProjectionEstimateKind = (
  value: unknown,
): value is WarpCatalogEtaProjectionEstimateKind =>
  value === "proper_time" || value === "coordinate_time";

export const isWarpCatalogEtaProjectionV1 = (
  value: unknown,
): value is WarpCatalogEtaProjectionV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (
    record.contractVersion !== WARP_CATALOG_ETA_PROJECTION_CONTRACT_VERSION ||
    record.status !== "bounded_target_coupled_trip_estimate_ready"
  ) {
    return false;
  }
  if (
    !isString(record.metricFamily) ||
    !isString(record.defaultOperatingProfileId) ||
    !isString(record.supportedBandFloorProfileId) ||
    !isString(record.supportedBandCeilingProfileId) ||
    !isString(record.evidenceFloorProfileId) ||
    !isFiniteNumber(record.evidenceFloorCenterlineAlpha) ||
    !isFiniteNumber(record.supportBufferDeltaCenterlineAlpha) ||
    record.supportedBandStatus !== "manually_reviewed_static_band" ||
    record.autoTracksEvidenceFloor !== false ||
    !isString(record.sourceBoundaryArtifactPath) ||
    !isString(record.sourceDefaultMissionTimeComparisonArtifactPath) ||
    !isString(record.sourceSupportedFloorMissionTimeComparisonArtifactPath) ||
    !isString(record.sourceEvidenceFloorMissionTimeComparisonArtifactPath) ||
    !isStringArray(record.claimBoundary) ||
    !isStringArray(record.nonClaims)
  ) {
    return false;
  }

  const entries = record.entries;
  if (!Array.isArray(entries) || entries.length === 0) return false;
  return entries.every((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const item = entry as Record<string, unknown>;
    return (
      isString(item.entryId) &&
      (item.targetId === "alpha-cen-a" || item.targetId === "proxima") &&
      isString(item.targetName) &&
      item.targetFrame === "heliocentric-icrs" &&
      isWarpCatalogEtaProjectionEstimateKind(item.estimateKind) &&
      isScalarEstimate(item.estimate) &&
      isFiniteNumber(item.outputRadius_m) &&
      item.outputRadius_m > 0 &&
      isString(item.radiusMeaning) &&
      isString(item.drivingProfileId) &&
      isFiniteNumber(item.drivingCenterlineAlpha) &&
      isString(item.supportedBandFloorProfileId) &&
      isString(item.supportedBandCeilingProfileId) &&
      typeof item.withinSupportedBand === "boolean" &&
      isString(item.sourceArtifactPath) &&
      isStringArray(item.claimBoundary) &&
      isStringArray(item.nonClaims)
    );
  });
};

export const buildOutputRadiusMeters = (
  estimate: WarpMissionTimeScalarEstimate,
): number => estimate.seconds * SPEED_OF_LIGHT_MPS;
