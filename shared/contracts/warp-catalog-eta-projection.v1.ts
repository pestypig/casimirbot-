import { SPEED_OF_LIGHT_MPS } from "../observable-universe-accordion-projections-constants";
import { WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION } from "./warp-mission-time-comparison.v1";
import {
  LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION,
  WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION,
} from "./warp-mission-time-estimator.v1";
import { WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION } from "./warp-route-time-worldline.v1";
import { WARP_WORLDLINE_CONTRACT_VERSION } from "./warp-worldline-contract.v1";

export const WARP_CATALOG_ETA_PROJECTION_CONTRACT_VERSION =
  "warp_catalog_eta_projection/v1";

export type WarpCatalogEtaProjectionV1 = {
  contractVersion: typeof WARP_CATALOG_ETA_PROJECTION_CONTRACT_VERSION;
  status: "catalog_eta_projection_ready";
  certified: true;
  integrityStatus: "ok" | "failed";
  claimTier: "diagnostic_catalog_eta_surface";
  frame: "heliocentric-icrs";

  metricFamily: string;
  selectedLaneId: string;
  selectedProfileId: string;
  defaultOperatingProfileId: string;
  supportedBandFloorProfileId: string;
  supportedBandCeilingProfileId: string;
  evidenceFloorProfileId: string;
  evidenceFloorCenterlineAlpha: number;
  supportBufferDeltaCenterlineAlpha: number;
  sourceSurfaceId: string;

  sourceWorldlineContractId: string;
  sourceWorldlineContractVersion: typeof WARP_WORLDLINE_CONTRACT_VERSION;

  sourceRouteTimeWorldlineContractId: string;
  sourceRouteTimeWorldlineContractVersion: typeof WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION;

  sourceMissionTimeEstimatorContractId: string;
  sourceMissionTimeEstimatorContractVersion: typeof WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION;

  sourceMissionTimeComparisonContractId?: string;
  sourceMissionTimeComparisonContractVersion?: typeof WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION;

  targetDistanceContractId: string;
  targetDistanceContractVersion: typeof LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION;
  targetDistanceBasis: {
    frame: "heliocentric-icrs";
    snapshotPath: string;
    snapshotEpochMs: number;
    selectionRule: string;
  };

  radiusMeaning: "proper_time" | "coordinate_time";
  claimBoundary: string[];
  falsifierConditions: string[];
  nonClaims: string[];

  entries: Array<{
    id: string;
    label: string;
    inputPosition_m: [number, number, number];
    inputDistance_m: number;

    properTimeEstimate_s: number;
    coordinateTimeEstimate_s: number;

    mappedRadius_s: number;
    outputPosition_m: [number, number, number];
  }>;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asFinite = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isVec3 = (value: unknown): value is [number, number, number] =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((entry) => Number.isFinite(Number(entry)));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const sameDirection = (
  input: [number, number, number],
  output: [number, number, number],
): boolean => {
  const inputNorm = Math.hypot(input[0], input[1], input[2]);
  const outputNorm = Math.hypot(output[0], output[1], output[2]);
  if (!(inputNorm > 0) || !(outputNorm >= 0)) return inputNorm === 0 && outputNorm === 0;
  if (!(outputNorm > 0)) return false;
  const inputUnit = [input[0] / inputNorm, input[1] / inputNorm, input[2] / inputNorm] as const;
  const outputUnit = [
    output[0] / outputNorm,
    output[1] / outputNorm,
    output[2] / outputNorm,
  ] as const;
  return (
    Math.abs(inputUnit[0] - outputUnit[0]) <= 1e-9 &&
    Math.abs(inputUnit[1] - outputUnit[1]) <= 1e-9 &&
    Math.abs(inputUnit[2] - outputUnit[2]) <= 1e-9
  );
};

const isEntry = (value: unknown): boolean => {
  const record = asRecord(value);
  const id = asText(record.id);
  const label = asText(record.label);
  const inputPosition = record.inputPosition_m;
  const outputPosition = record.outputPosition_m;
  const inputDistance = asFinite(record.inputDistance_m);
  const properTimeEstimate = asFinite(record.properTimeEstimate_s);
  const coordinateTimeEstimate = asFinite(record.coordinateTimeEstimate_s);
  const mappedRadius = asFinite(record.mappedRadius_s);
  if (!id || !label || !isVec3(inputPosition) || !isVec3(outputPosition)) return false;
  if (
    inputDistance == null ||
    properTimeEstimate == null ||
    coordinateTimeEstimate == null ||
    mappedRadius == null
  ) {
    return false;
  }
  if (
    !(inputDistance >= 0) ||
    !(properTimeEstimate > 0) ||
    !(coordinateTimeEstimate > 0) ||
    !(mappedRadius > 0)
  ) {
    return false;
  }
  const norm = Math.hypot(outputPosition[0], outputPosition[1], outputPosition[2]);
  if (!(norm > 0)) return false;
  const expectedMeters = mappedRadius * SPEED_OF_LIGHT_MPS;
  if (Math.abs(norm - expectedMeters) > Math.max(1e-6, expectedMeters * 1e-9)) {
    return false;
  }
  return sameDirection(inputPosition, outputPosition);
};

export const isCertifiedWarpCatalogEtaProjectionContract = (
  value: unknown,
): value is WarpCatalogEtaProjectionV1 => {
  const record = asRecord(value);
  const entries = Array.isArray(record.entries) ? record.entries : null;
  const targetDistanceBasis = asRecord(record.targetDistanceBasis);
  const selectedLaneId = asText(record.selectedLaneId);
  const selectedProfileId = asText(record.selectedProfileId);
  const defaultOperatingProfileId = asText(record.defaultOperatingProfileId);
  const supportedBandFloorProfileId = asText(record.supportedBandFloorProfileId);
  const supportedBandCeilingProfileId = asText(record.supportedBandCeilingProfileId);
  const evidenceFloorProfileId = asText(record.evidenceFloorProfileId);
  const evidenceFloorCenterlineAlpha = asFinite(record.evidenceFloorCenterlineAlpha);
  const supportBufferDeltaCenterlineAlpha = asFinite(
    record.supportBufferDeltaCenterlineAlpha,
  );
  const sourceSurfaceId = asText(record.sourceSurfaceId);

  return (
    record.contractVersion === WARP_CATALOG_ETA_PROJECTION_CONTRACT_VERSION &&
    record.status === "catalog_eta_projection_ready" &&
    record.certified === true &&
    record.integrityStatus === "ok" &&
    record.claimTier === "diagnostic_catalog_eta_surface" &&
    record.frame === "heliocentric-icrs" &&
    asText(record.metricFamily) != null &&
    selectedLaneId != null &&
    selectedProfileId != null &&
    defaultOperatingProfileId != null &&
    supportedBandFloorProfileId != null &&
    supportedBandCeilingProfileId != null &&
    evidenceFloorProfileId != null &&
    evidenceFloorCenterlineAlpha != null &&
    evidenceFloorCenterlineAlpha > 0 &&
    evidenceFloorCenterlineAlpha < 1 &&
    supportBufferDeltaCenterlineAlpha != null &&
    supportBufferDeltaCenterlineAlpha > 0 &&
    supportBufferDeltaCenterlineAlpha < 1 &&
    sourceSurfaceId != null &&
    asText(record.sourceWorldlineContractId) != null &&
    record.sourceWorldlineContractVersion === WARP_WORLDLINE_CONTRACT_VERSION &&
    asText(record.sourceRouteTimeWorldlineContractId) != null &&
    record.sourceRouteTimeWorldlineContractVersion ===
      WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION &&
    asText(record.sourceMissionTimeEstimatorContractId) != null &&
    record.sourceMissionTimeEstimatorContractVersion ===
      WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION &&
    (record.sourceMissionTimeComparisonContractId === undefined ||
      asText(record.sourceMissionTimeComparisonContractId) != null) &&
    (record.sourceMissionTimeComparisonContractVersion === undefined ||
      record.sourceMissionTimeComparisonContractVersion ===
        WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION) &&
    asText(record.targetDistanceContractId) != null &&
    record.targetDistanceContractVersion === LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION &&
    targetDistanceBasis.frame === "heliocentric-icrs" &&
    asText(targetDistanceBasis.snapshotPath) != null &&
    (asFinite(targetDistanceBasis.snapshotEpochMs) ?? 0) > 0 &&
    asText(targetDistanceBasis.selectionRule) != null &&
    (record.radiusMeaning === "proper_time" ||
      record.radiusMeaning === "coordinate_time") &&
    isStringArray(record.claimBoundary) &&
    isStringArray(record.falsifierConditions) &&
    isStringArray(record.nonClaims) &&
    entries != null &&
    entries.length > 0 &&
    entries.every((entry) => isEntry(entry))
  );
};
