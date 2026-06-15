import {
  WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION,
  type WarpMissionTimeComparisonContractV1,
} from "./warp-mission-time-comparison.v1";
import {
  WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION,
  type WarpMissionTimeEstimatorContractV1,
} from "./warp-mission-time-estimator.v1";
import {
  WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION,
  type WarpRouteTimeWorldlineContractV1,
} from "./warp-route-time-worldline.v1";
import type { WarpWorldlineSourceSurface } from "./warp-worldline-contract.v1";

const SECONDS_PER_DAY = 86_400;
const NUMERIC_TOLERANCE = 1e-9;

export const NHM2_TRIP_CLOCKING_DIAGNOSTIC_CONTRACT_VERSION =
  "nhm2_trip_clocking_diagnostic/v1";

export type Nhm2TripClockingDiagnosticStatus =
  "trip_clocking_diagnostic_ready";

export type Nhm2TripClockingSpeedInterpretation =
  "analogy_only_not_speed";

export type Nhm2TripClockingProfileCoherenceV1 = {
  expectedSelectedProfileId: string | null;
  routeTimeProfileId: string;
  missionTimeProfileId: string;
  comparisonProfileId: string;
  profileMatch: true;
  warnings: string[];
};

export type Nhm2TripClockingDiagnosticContractV1 = {
  contractVersion: typeof NHM2_TRIP_CLOCKING_DIAGNOSTIC_CONTRACT_VERSION;
  status: Nhm2TripClockingDiagnosticStatus;
  generatedAt: string;
  tripClockingComputed: true;
  fullSolveClosurePassed: boolean;
  routeEtaCertified: false;
  maxSpeedCertified: false;
  physicalViabilityClaimAllowed: false;
  sourceRouteTimeWorldlineContractVersion: typeof WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION;
  sourceMissionTimeEstimatorContractVersion: typeof WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION;
  sourceMissionTimeComparisonContractVersion: typeof WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION;
  profile: {
    selectedProfileId: string;
    alphaCenterline: number;
  };
  profileCoherence: Nhm2TripClockingProfileCoherenceV1;
  oneWay: {
    targetName: string;
    coordinateYears: number;
    shipProperYears: number;
    shipYoungerByDays: number;
  };
  roundTripMirrorDiagnostic: {
    coordinateYears: number;
    shipProperYears: number;
    shipYoungerByDays: number;
    assumption: "mirrored_one_way_schedule";
  };
  speedLikeQuantities: {
    coordinateScheduleRatioC: number;
    localShiftDescriptorFractionC: number | null;
    srEquivalentBetaForAlpha: number;
    interpretation: Nhm2TripClockingSpeedInterpretation;
  };
  claimBoundary: {
    diagnosticOnly: true;
    answersShipClockAccumulationOnly: true;
    doesNotCertifyShipSpeed: true;
    doesNotCertifyRouteEta: true;
    doesNotCertifyPhysicalViability: true;
    srEquivalentBetaIsAnalogyOnly: true;
  };
  claimBoundaryText: string[];
  falsifierConditions: string[];
  nonClaims: string[];
};

type TripClockingRouteInput = Pick<
  WarpRouteTimeWorldlineContractV1,
  "contractVersion" | "sourceSurface" | "descriptorScheduleSummary"
>;

type TripClockingEstimatorInput = Pick<
  WarpMissionTimeEstimatorContractV1,
  | "contractVersion"
  | "sourceSurface"
  | "targetName"
  | "targetDistance"
  | "coordinateTimeEstimate"
  | "properTimeEstimate"
>;

type TripClockingComparisonInput = Pick<
  WarpMissionTimeComparisonContractV1,
  | "contractVersion"
  | "sourceSurface"
  | "targetName"
  | "warpCoordinateTimeEstimate"
  | "warpProperTimeEstimate"
  | "comparisonMetrics"
>;

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const nearlyEqual = (
  lhs: number,
  rhs: number,
  tolerance = NUMERIC_TOLERANCE,
): boolean => Math.abs(lhs - rhs) <= tolerance;

const getProfileId = (
  surface: WarpWorldlineSourceSurface | undefined,
): string | null => {
  const gate = surface?.shiftLapseTransportPromotionGate ?? null;
  return gate?.shiftLapseProfileId ?? surface?.shiftLapseProfileId ?? null;
};

const getCenterlineAlpha = (
  surface: WarpWorldlineSourceSurface | undefined,
): number | null => {
  const gate = surface?.shiftLapseTransportPromotionGate ?? null;
  const alpha = toFiniteNumber(gate?.centerlineAlpha);
  if (alpha != null) return alpha;
  return toFiniteNumber(gate?.centerlineDtauDt);
};

const getLocalShiftDescriptorFractionC = (
  routeTimeWorldline: TripClockingRouteInput,
): number | null => {
  const gate =
    routeTimeWorldline.sourceSurface?.shiftLapseTransportPromotionGate ?? null;
  const betaOverAlphaMax = toFiniteNumber(gate?.betaOverAlphaMax);
  if (betaOverAlphaMax != null) return betaOverAlphaMax;
  return toFiniteNumber(routeTimeWorldline.descriptorScheduleSummary?.max);
};

const assertProfileCoherence = (args: {
  expectedSelectedProfileId?: string | null;
  routeTimeWorldline: TripClockingRouteInput;
  missionTimeEstimator: TripClockingEstimatorInput;
  missionTimeComparison: TripClockingComparisonInput;
}): Nhm2TripClockingProfileCoherenceV1 | null => {
  const routeTimeProfileId = getProfileId(args.routeTimeWorldline.sourceSurface);
  const missionTimeProfileId = getProfileId(args.missionTimeEstimator.sourceSurface);
  const comparisonProfileId = getProfileId(args.missionTimeComparison.sourceSurface);
  const expectedSelectedProfileId = args.expectedSelectedProfileId ?? null;

  if (!routeTimeProfileId || !missionTimeProfileId || !comparisonProfileId) {
    return null;
  }
  if (
    routeTimeProfileId !== missionTimeProfileId ||
    routeTimeProfileId !== comparisonProfileId
  ) {
    return null;
  }
  if (
    expectedSelectedProfileId != null &&
    routeTimeProfileId !== expectedSelectedProfileId
  ) {
    return null;
  }

  return {
    expectedSelectedProfileId,
    routeTimeProfileId,
    missionTimeProfileId,
    comparisonProfileId,
    profileMatch: true,
    warnings: [],
  };
};

export const buildNhm2TripClockingDiagnosticContract = (args: {
  routeTimeWorldline: TripClockingRouteInput | null | undefined;
  missionTimeEstimator: TripClockingEstimatorInput | null | undefined;
  missionTimeComparison: TripClockingComparisonInput | null | undefined;
  expectedSelectedProfileId?: string | null;
  fullSolveClosurePassed?: boolean;
  generatedAt?: string;
}): Nhm2TripClockingDiagnosticContractV1 | null => {
  const routeTimeWorldline = args.routeTimeWorldline ?? null;
  const missionTimeEstimator = args.missionTimeEstimator ?? null;
  const missionTimeComparison = args.missionTimeComparison ?? null;

  if (!routeTimeWorldline || !missionTimeEstimator || !missionTimeComparison) {
    return null;
  }
  if (
    routeTimeWorldline.contractVersion !==
    WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION
  ) {
    return null;
  }
  if (
    missionTimeEstimator.contractVersion !==
    WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION
  ) {
    return null;
  }
  if (
    missionTimeComparison.contractVersion !==
    WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION
  ) {
    return null;
  }

  const profileCoherence = assertProfileCoherence({
    expectedSelectedProfileId: args.expectedSelectedProfileId,
    routeTimeWorldline,
    missionTimeEstimator,
    missionTimeComparison,
  });
  if (!profileCoherence) return null;

  const coordinateYears = toFiniteNumber(
    missionTimeComparison.warpCoordinateTimeEstimate?.years,
  );
  const shipProperYears = toFiniteNumber(
    missionTimeComparison.warpProperTimeEstimate?.years,
  );
  const coordinateSeconds = toFiniteNumber(
    missionTimeComparison.warpCoordinateTimeEstimate?.seconds,
  );
  const shipProperSeconds = toFiniteNumber(
    missionTimeComparison.warpProperTimeEstimate?.seconds,
  );
  const estimatorCoordinateSeconds = toFiniteNumber(
    missionTimeEstimator.coordinateTimeEstimate?.seconds,
  );
  const estimatorProperSeconds = toFiniteNumber(
    missionTimeEstimator.properTimeEstimate?.seconds,
  );
  const targetDistanceLightYears = toFiniteNumber(
    missionTimeEstimator.targetDistance?.lightYears,
  );
  const alphaFromGate = getCenterlineAlpha(routeTimeWorldline.sourceSurface);
  const alphaFromComparison =
    coordinateSeconds != null && coordinateSeconds > 0 && shipProperSeconds != null
      ? shipProperSeconds / coordinateSeconds
      : null;
  const alphaCenterline = alphaFromGate ?? alphaFromComparison;

  if (
    coordinateYears == null ||
    shipProperYears == null ||
    coordinateSeconds == null ||
    shipProperSeconds == null ||
    estimatorCoordinateSeconds == null ||
    estimatorProperSeconds == null ||
    targetDistanceLightYears == null ||
    alphaCenterline == null ||
    alphaFromComparison == null ||
    !(coordinateYears > 0) ||
    !(shipProperYears > 0) ||
    !(coordinateSeconds > 0) ||
    !(shipProperSeconds > 0) ||
    !(targetDistanceLightYears > 0) ||
    !(alphaCenterline > 0 && alphaCenterline <= 1)
  ) {
    return null;
  }

  const secondsTolerance = Math.max(1e-6, coordinateSeconds * 1e-12);
  if (!nearlyEqual(coordinateSeconds, estimatorCoordinateSeconds, secondsTolerance)) {
    return null;
  }
  if (!nearlyEqual(shipProperSeconds, estimatorProperSeconds, secondsTolerance)) {
    return null;
  }
  if (!nearlyEqual(alphaCenterline, alphaFromComparison, 1e-9)) {
    return null;
  }

  const shipYoungerByDays = (coordinateSeconds - shipProperSeconds) / SECONDS_PER_DAY;

  return {
    contractVersion: NHM2_TRIP_CLOCKING_DIAGNOSTIC_CONTRACT_VERSION,
    status: "trip_clocking_diagnostic_ready",
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    tripClockingComputed: true,
    fullSolveClosurePassed: args.fullSolveClosurePassed === true,
    routeEtaCertified: false,
    maxSpeedCertified: false,
    physicalViabilityClaimAllowed: false,
    sourceRouteTimeWorldlineContractVersion: WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION,
    sourceMissionTimeEstimatorContractVersion:
      WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION,
    sourceMissionTimeComparisonContractVersion:
      WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION,
    profile: {
      selectedProfileId: profileCoherence.routeTimeProfileId,
      alphaCenterline,
    },
    profileCoherence,
    oneWay: {
      targetName: missionTimeComparison.targetName,
      coordinateYears,
      shipProperYears,
      shipYoungerByDays,
    },
    roundTripMirrorDiagnostic: {
      coordinateYears: 2 * coordinateYears,
      shipProperYears: 2 * shipProperYears,
      shipYoungerByDays: 2 * shipYoungerByDays,
      assumption: "mirrored_one_way_schedule",
    },
    speedLikeQuantities: {
      coordinateScheduleRatioC: targetDistanceLightYears / coordinateYears,
      localShiftDescriptorFractionC:
        getLocalShiftDescriptorFractionC(routeTimeWorldline),
      srEquivalentBetaForAlpha: Math.sqrt(Math.max(0, 1 - alphaCenterline ** 2)),
      interpretation: "analogy_only_not_speed",
    },
    claimBoundary: {
      diagnosticOnly: true,
      answersShipClockAccumulationOnly: true,
      doesNotCertifyShipSpeed: true,
      doesNotCertifyRouteEta: true,
      doesNotCertifyPhysicalViability: true,
      srEquivalentBetaIsAnalogyOnly: true,
    },
    claimBoundaryText: [
      "Trip clocking reports ship proper-time accumulation under the bounded lapse schedule only.",
      "The coordinate schedule ratio is a target-distance over coordinate-duration diagnostic, not ship-speed authority.",
      "The local shift descriptor is a chart-bound transport descriptor, not ordinary velocity.",
      "The SR-equivalent beta row is an intuition analogy for the same clock ratio only.",
      "This artifact does not certify route ETA, max speed, physical viability, or propulsion.",
    ],
    falsifierConditions: [
      "route_time_worldline_contract_missing",
      "mission_time_estimator_contract_missing",
      "mission_time_comparison_contract_missing",
      "profile_id_missing_or_mismatched",
      "expected_profile_id_mismatch",
      "coordinate_or_proper_time_nonfinite",
      "estimator_and_comparison_times_disagree",
      "centerline_alpha_missing_or_out_of_range",
      "centerline_alpha_disagrees_with_comparison_ratio",
    ],
    nonClaims: [
      "not a speed certificate",
      "not route-ETA authority",
      "not a physical trip result",
      "not propulsion validation",
      "not full-solve closure evidence",
    ],
  };
};

export const isNhm2TripClockingDiagnosticContract = (
  value: unknown,
): value is Nhm2TripClockingDiagnosticContractV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.contractVersion !== NHM2_TRIP_CLOCKING_DIAGNOSTIC_CONTRACT_VERSION) {
    return false;
  }
  if (record.status !== "trip_clocking_diagnostic_ready") return false;
  if (record.tripClockingComputed !== true) return false;
  if (record.routeEtaCertified !== false) return false;
  if (record.maxSpeedCertified !== false) return false;
  if (record.physicalViabilityClaimAllowed !== false) return false;

  const profile = record.profile as Record<string, unknown> | undefined;
  if (!profile || typeof profile.selectedProfileId !== "string") return false;
  const alpha = toFiniteNumber(profile.alphaCenterline);
  if (alpha == null || !(alpha > 0 && alpha <= 1)) return false;

  const oneWay = record.oneWay as Record<string, unknown> | undefined;
  const roundTrip =
    record.roundTripMirrorDiagnostic as Record<string, unknown> | undefined;
  if (!oneWay || !roundTrip) return false;

  const oneWayCoordinateYears = toFiniteNumber(oneWay.coordinateYears);
  const oneWayProperYears = toFiniteNumber(oneWay.shipProperYears);
  const oneWaySavedDays = toFiniteNumber(oneWay.shipYoungerByDays);
  const roundCoordinateYears = toFiniteNumber(roundTrip.coordinateYears);
  const roundProperYears = toFiniteNumber(roundTrip.shipProperYears);
  const roundSavedDays = toFiniteNumber(roundTrip.shipYoungerByDays);

  if (
    oneWayCoordinateYears == null ||
    oneWayProperYears == null ||
    oneWaySavedDays == null ||
    roundCoordinateYears == null ||
    roundProperYears == null ||
    roundSavedDays == null
  ) {
    return false;
  }
  if (!nearlyEqual(roundCoordinateYears, 2 * oneWayCoordinateYears, 1e-9)) {
    return false;
  }
  if (!nearlyEqual(roundProperYears, 2 * oneWayProperYears, 1e-9)) {
    return false;
  }
  if (!nearlyEqual(roundSavedDays, 2 * oneWaySavedDays, 1e-9)) {
    return false;
  }

  const speedLike =
    record.speedLikeQuantities as Record<string, unknown> | undefined;
  if (!speedLike) return false;
  if (speedLike.interpretation !== "analogy_only_not_speed") return false;
  const srBeta = toFiniteNumber(speedLike.srEquivalentBetaForAlpha);
  if (srBeta == null || srBeta < 0 || srBeta >= 1) return false;

  const claimBoundary =
    record.claimBoundary as Record<string, unknown> | undefined;
  return Boolean(
    claimBoundary?.diagnosticOnly === true &&
      claimBoundary.answersShipClockAccumulationOnly === true &&
      claimBoundary.doesNotCertifyShipSpeed === true &&
      claimBoundary.doesNotCertifyRouteEta === true &&
      claimBoundary.doesNotCertifyPhysicalViability === true &&
      claimBoundary.srEquivalentBetaIsAnalogyOnly === true &&
      Array.isArray(record.claimBoundaryText) &&
      Array.isArray(record.falsifierConditions) &&
      Array.isArray(record.nonClaims),
  );
};
