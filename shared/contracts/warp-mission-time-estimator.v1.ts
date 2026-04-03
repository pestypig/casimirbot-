import {
  WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION,
  isCertifiedWarpCruiseEnvelopePreflightContract,
  type WarpCruiseEnvelopePreflightContractV1,
} from "./warp-cruise-envelope-preflight.v1";
import {
  WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION,
  isCertifiedWarpRouteTimeWorldlineContract,
  type WarpRouteTimeWorldlineContractV1,
} from "./warp-route-time-worldline.v1";
import {
  WARP_WORLDLINE_CONTRACT_VERSION,
  type WarpWorldlineChart,
  type WarpWorldlineContractV1,
  type WarpWorldlineSourceSurface,
} from "./warp-worldline-contract.v1";

const SECONDS_PER_DAY = 86_400;
export const SECONDS_PER_YEAR = 365.25 * SECONDS_PER_DAY;
export const METERS_PER_PARSEC = 3.085677581e16;
export const LIGHT_YEARS_PER_PARSEC = 3.26156;

export const LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION =
  "local_rest_target_distance_contract/v1";
export const WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION =
  "warp_mission_time_estimator/v1";
export const DEFAULT_WARP_MISSION_ESTIMATOR_TARGET_ID = "alpha-cen-a";
export const WARP_MISSION_ESTIMATOR_TARGET_IDS: WarpMissionEstimatorTargetId[] = [
  "alpha-cen-a",
  "proxima",
];

export type WarpMissionEstimatorTargetId = "alpha-cen-a" | "proxima";
export type WarpMissionTimeEstimatorStatus = "bounded_target_coupled_estimate_ready";
export type WarpMissionTimeEstimatorModelId =
  "nhm2_repeated_local_probe_segment_estimator";
export type WarpMissionTimeEstimatorRouteTimeStatus =
  "bounded_local_segment_certified";
export type WarpMissionTimeEstimatorEligibleNextProduct =
  | "relativistic_vs_nonrelativistic_comparison"
  | "cruise_envelope_semantics_upgrade";

export type WarpMissionTargetDistanceContractV1 = {
  contractVersion: typeof LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION;
  status: "catalog_distance_resolved";
  certified: true;
  catalogFamily: "committed_local_rest_epoch_snapshot";
  catalogSelectionRule: "max_epochMs_then_lexicographic_filename";
  snapshotPath: string;
  snapshotEpochMs: number;
  targetId: WarpMissionEstimatorTargetId;
  targetName: string;
  targetFrame: "heliocentric-icrs";
  targetEpochMs: number;
  distanceMeters: number;
  distanceParsecs: number;
  distanceLightYears: number;
  sourceVectorNormMeters: number;
  sourceCatalogRadiusPc: number;
  sourceCatalogTotal: number;
  claimBoundary: string[];
  falsifierConditions: string[];
};

export type WarpMissionTimeScalarEstimate = {
  seconds: number;
  years: number;
  units: {
    primary: "s";
    secondary: "yr";
  };
  meaning: string;
};

export type WarpMissionTimeEstimatorContractV1 = {
  contractVersion: typeof WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION;
  status: WarpMissionTimeEstimatorStatus;
  certified: true;
  sourceRouteTimeWorldlineContractVersion: typeof WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION;
  sourceCruisePreflightContractVersion: typeof WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION;
  sourceWorldlineContractVersion: typeof WARP_WORLDLINE_CONTRACT_VERSION;
  targetDistanceContractVersion: typeof LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION;
  sourceSurface: WarpWorldlineSourceSurface;
  chart: WarpWorldlineChart;
  observerFamily: "ship_centerline_local_comoving";
  estimatorModelId: WarpMissionTimeEstimatorModelId;
  estimatorModelMeaning: string;
  targetFrame: "heliocentric-icrs";
  targetId: WarpMissionEstimatorTargetId;
  targetName: string;
  targetDistance: {
    meters: number;
    parsecs: number;
    lightYears: number;
    epochMs: number;
    snapshotPath: string;
    selectionRule: WarpMissionTargetDistanceContractV1["catalogSelectionRule"];
  };
  routeParameterMeaning: string;
  validityRegime: {
    regimeId: "nhm2_bounded_target_coupled_mission_estimator";
    bounded: true;
    chartFixed: true;
    observerDefined: true;
    targetDistanceCoupled: true;
    routeTimeDerived: true;
    fullRouteDynamicCertified: false;
    maxSpeedCertified: false;
    viabilityCertified: false;
    failClosedOutsideRegime: true;
    description: string;
    restrictions: string[];
  };
  sourceWorldlineStatus: WarpWorldlineContractV1["status"];
  sourceCruisePreflightStatus: WarpCruiseEnvelopePreflightContractV1["status"];
  sourceRouteTimeWorldlineStatus: WarpRouteTimeWorldlineContractV1["status"];
  routeTimeStatus: WarpMissionTimeEstimatorRouteTimeStatus;
  estimatorAssumptions: string[];
  coordinateTimeEstimate: WarpMissionTimeScalarEstimate;
  properTimeEstimate: WarpMissionTimeScalarEstimate;
  comparisonReadiness:
    "ready_for_paired_relativistic_vs_nonrelativistic_comparison";
  nextEligibleProducts: WarpMissionTimeEstimatorEligibleNextProduct[];
  claimBoundary: string[];
  falsifierConditions: string[];
  nonClaims: string[];
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const nearlyEqual = (lhs: number, rhs: number, tolerance = 1e-12): boolean =>
  Math.abs(lhs - rhs) <= tolerance;

const finitePositive = (value: unknown): value is number => {
  const parsed = toFiniteNumber(value);
  return parsed != null && parsed > 0;
};

const sameChart = (
  lhs: WarpWorldlineChart,
  rhs: WarpWorldlineChart,
): boolean =>
  lhs.label === rhs.label &&
  lhs.chartFixed === rhs.chartFixed &&
  (lhs.coordinateMap ?? null) === (rhs.coordinateMap ?? null);

const sameSourceSurface = (
  lhs: WarpWorldlineSourceSurface,
  rhs: WarpWorldlineSourceSurface,
): boolean =>
  lhs.surfaceId === rhs.surfaceId &&
  lhs.producer === rhs.producer &&
  lhs.provenanceClass === rhs.provenanceClass &&
  lhs.transportVectorSource === rhs.transportVectorSource &&
  lhs.transportVectorField === rhs.transportVectorField &&
  lhs.metricT00Ref === rhs.metricT00Ref &&
  lhs.metricT00Source === rhs.metricT00Source &&
  lhs.metricFamily === rhs.metricFamily &&
  lhs.metricT00ContractStatus === rhs.metricT00ContractStatus &&
  lhs.chartContractStatus === rhs.chartContractStatus;

const matchesStringArray = (
  value: unknown,
  expected: readonly string[],
): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  expected.every((entry, index) => value[index] === entry);

export const buildWarpMissionTimeEstimatorContract = (args: {
  worldline: WarpWorldlineContractV1 | null | undefined;
  preflight: WarpCruiseEnvelopePreflightContractV1 | null | undefined;
  routeTimeWorldline: WarpRouteTimeWorldlineContractV1 | null | undefined;
  targetDistance: WarpMissionTargetDistanceContractV1 | null | undefined;
}): WarpMissionTimeEstimatorContractV1 | null => {
  if (!isCertifiedWarpCruiseEnvelopePreflightContract(args.preflight)) return null;
  if (!isCertifiedWarpRouteTimeWorldlineContract(args.routeTimeWorldline)) return null;
  if (!isCertifiedWarpMissionTargetDistanceContract(args.targetDistance)) return null;
  if (
    !args.worldline ||
    args.worldline.contractVersion !== WARP_WORLDLINE_CONTRACT_VERSION ||
    args.worldline.certified !== true
  ) {
    return null;
  }
  const worldline = args.worldline;
  const preflight = args.preflight;
  const routeTime = args.routeTimeWorldline;
  const targetDistance = args.targetDistance;

  if (!sameSourceSurface(worldline.sourceSurface, preflight.sourceSurface)) return null;
  if (!sameSourceSurface(worldline.sourceSurface, routeTime.sourceSurface)) return null;
  if (!sameChart(worldline.chart, preflight.chart)) return null;
  if (!sameChart(worldline.chart, routeTime.chart)) return null;
  if (worldline.observerFamily !== preflight.observerFamily) return null;
  if (worldline.observerFamily !== routeTime.observerFamily) return null;
  if (routeTime.routeTimeStatus !== "bounded_local_segment_certified") return null;
  if (!matchesStringArray(routeTime.nextEligibleProducts, ["mission_time_estimator"])) {
    return null;
  }

  const boundedProgressStart =
    routeTime.progressionSamples[0]?.boundedProgressCoordinate_m ?? null;
  const boundedProgressEnd =
    routeTime.progressionSamples[routeTime.progressionSamples.length - 1]
      ?.boundedProgressCoordinate_m ?? null;
  const boundedProgressSpan_m =
    boundedProgressStart == null || boundedProgressEnd == null
      ? null
      : boundedProgressEnd - boundedProgressStart;
  if (!(boundedProgressSpan_m != null && boundedProgressSpan_m > 0)) return null;

  const coordinateSpan_s = routeTime.coordinateTimeSummary.span;
  const properSpan_s = routeTime.properTimeSummary.span;
  if (!(coordinateSpan_s > 0) || !(properSpan_s > 0)) return null;

  const coordinateSecondsPerMeter = coordinateSpan_s / boundedProgressSpan_m;
  const properSecondsPerMeter = properSpan_s / boundedProgressSpan_m;
  if (!(coordinateSecondsPerMeter > 0) || !(properSecondsPerMeter > 0)) return null;

  const coordinateTimeSeconds =
    targetDistance.distanceMeters * coordinateSecondsPerMeter;
  const properTimeSeconds = targetDistance.distanceMeters * properSecondsPerMeter;
  if (!(coordinateTimeSeconds > 0) || !(properTimeSeconds > 0)) return null;

  return {
    contractVersion: WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION,
    status: "bounded_target_coupled_estimate_ready",
    certified: true,
    sourceRouteTimeWorldlineContractVersion:
      WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION,
    sourceCruisePreflightContractVersion:
      WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION,
    sourceWorldlineContractVersion: WARP_WORLDLINE_CONTRACT_VERSION,
    targetDistanceContractVersion: LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION,
    sourceSurface: { ...worldline.sourceSurface },
    chart: { ...worldline.chart },
    observerFamily: worldline.observerFamily,
    estimatorModelId: "nhm2_repeated_local_probe_segment_estimator",
    estimatorModelMeaning:
      "Repeat the certified bounded NHM2 local probe route-time segment over the deterministic committed local-rest target distance. This is a bounded translational repetition law over the certified local route-time schedule, not a full route dynamic or a speed proof.",
    targetFrame: targetDistance.targetFrame,
    targetId: targetDistance.targetId,
    targetName: targetDistance.targetName,
    targetDistance: {
      meters: targetDistance.distanceMeters,
      parsecs: targetDistance.distanceParsecs,
      lightYears: targetDistance.distanceLightYears,
      epochMs: targetDistance.snapshotEpochMs,
      snapshotPath: targetDistance.snapshotPath,
      selectionRule: targetDistance.catalogSelectionRule,
    },
    routeParameterMeaning: routeTime.routeParameterMeaning,
    validityRegime: {
      regimeId: "nhm2_bounded_target_coupled_mission_estimator",
      bounded: true,
      chartFixed: true,
      observerDefined: true,
      targetDistanceCoupled: true,
      routeTimeDerived: true,
      fullRouteDynamicCertified: false,
      maxSpeedCertified: false,
      viabilityCertified: false,
      failClosedOutsideRegime: true,
      description:
        "Bounded NHM2 mission-time estimator that couples the certified local route-time worldline to a deterministic committed local-rest target-distance contract. It remains assumption-bearing and does not certify a full route dynamic, max speed, or viability.",
      restrictions: [
        "repeat_certified_local_probe_schedule_only",
        "target_distance_from_committed_local_rest_snapshot_only",
        "no_target_dependent_cruise_or_braking_model",
        "no_catalog_eta_projection_surface_promotion",
        "relativistic_advantage_reporting_deferred_to_follow_on_comparison_layer",
      ],
    },
    sourceWorldlineStatus: worldline.status,
    sourceCruisePreflightStatus: preflight.status,
    sourceRouteTimeWorldlineStatus: routeTime.status,
    routeTimeStatus: routeTime.routeTimeStatus,
    estimatorAssumptions: [
      "The certified bounded local probe route-time schedule is translationally repeated over the target distance without introducing new route dynamics.",
      "Target distance is fixed by the deterministic committed local-rest epoch snapshot in the heliocentric-icrs frame.",
      "No braking phase, cruise-envelope widening, target gravity capture, or catalog-specific control law is added in this estimator.",
      "Coordinate and proper time are reported separately from the same repeated bounded route-time basis.",
    ],
    coordinateTimeEstimate: {
      seconds: coordinateTimeSeconds,
      years: coordinateTimeSeconds / SECONDS_PER_YEAR,
      units: { primary: "s", secondary: "yr" },
      meaning:
        "Estimated coordinate time from repeated bounded local route-time schedule over the committed target distance.",
    },
    properTimeEstimate: {
      seconds: properTimeSeconds,
      years: properTimeSeconds / SECONDS_PER_YEAR,
      units: { primary: "s", secondary: "yr" },
      meaning:
        "Estimated ship proper time from repeated bounded local route-time schedule over the committed target distance.",
    },
    comparisonReadiness:
      "ready_for_paired_relativistic_vs_nonrelativistic_comparison",
    nextEligibleProducts: [
      "relativistic_vs_nonrelativistic_comparison",
      "cruise_envelope_semantics_upgrade",
    ],
    claimBoundary: [
      "bounded mission-time estimator only",
      "target-coupled through a committed local-rest target-distance contract only",
      "derived from repeated bounded local probe route-time schedule, not a full route dynamic",
      "not max-speed certified",
      "not viability-promotion evidence",
      "not relativistic-advantage certified",
    ],
    falsifierConditions: [
      "certified_route_time_worldline_missing",
      "certified_cruise_preflight_missing",
      "certified_warp_worldline_missing",
      "target_distance_contract_missing_or_noncommitted",
      "route_time_progress_span_nonpositive",
      "coordinate_or_proper_time_estimate_nonfinite",
      "unsupported_target_id",
    ],
    nonClaims: [
      "not max-speed certified",
      "not viability-promotion evidence",
      "not full route dynamic certified",
      "not unconstrained ETA for arbitrary targets",
      "not relativistic-advantage certified",
    ],
  };
};

export const isCertifiedWarpMissionTargetDistanceContract = (
  value: unknown,
): value is WarpMissionTargetDistanceContractV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.contractVersion !== LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION) {
    return false;
  }
  if (record.status !== "catalog_distance_resolved") return false;
  if (record.certified !== true) return false;
  if (record.catalogFamily !== "committed_local_rest_epoch_snapshot") return false;
  if (
    record.catalogSelectionRule !== "max_epochMs_then_lexicographic_filename"
  ) {
    return false;
  }
  if (typeof record.snapshotPath !== "string" || !record.snapshotPath.length) return false;
  if (!finitePositive(record.snapshotEpochMs)) return false;
  if (record.targetFrame !== "heliocentric-icrs") return false;
  if (record.targetId !== "alpha-cen-a" && record.targetId !== "proxima") return false;
  if (typeof record.targetName !== "string" || !record.targetName.length) return false;
  if (!finitePositive(record.targetEpochMs)) return false;
  const distanceMeters = toFiniteNumber(record.distanceMeters);
  const distanceParsecs = toFiniteNumber(record.distanceParsecs);
  const distanceLightYears = toFiniteNumber(record.distanceLightYears);
  const sourceVectorNormMeters = toFiniteNumber(record.sourceVectorNormMeters);
  if (
    distanceMeters == null ||
    distanceParsecs == null ||
    distanceLightYears == null ||
    sourceVectorNormMeters == null ||
    !(distanceMeters > 0) ||
    !(distanceParsecs > 0) ||
    !(distanceLightYears > 0) ||
    !(sourceVectorNormMeters > 0)
  ) {
    return false;
  }
  if (!nearlyEqual(distanceMeters, sourceVectorNormMeters, 1e-6 * distanceMeters)) {
    return false;
  }
  if (
    !nearlyEqual(distanceParsecs, distanceMeters / METERS_PER_PARSEC, 1e-9) ||
    !nearlyEqual(distanceLightYears, distanceParsecs * LIGHT_YEARS_PER_PARSEC, 1e-9)
  ) {
    return false;
  }
  if (!finitePositive(record.sourceCatalogRadiusPc)) return false;
  if (!finitePositive(record.sourceCatalogTotal)) return false;
  if (!Array.isArray(record.claimBoundary)) return false;
  if (!Array.isArray(record.falsifierConditions)) return false;
  return true;
};

export const isCertifiedWarpMissionTimeEstimatorContract = (
  value: unknown,
): value is WarpMissionTimeEstimatorContractV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.contractVersion !== WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION) {
    return false;
  }
  if (record.status !== "bounded_target_coupled_estimate_ready") return false;
  if (record.certified !== true) return false;
  if (
    record.sourceRouteTimeWorldlineContractVersion !==
    WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION
  ) {
    return false;
  }
  if (
    record.sourceCruisePreflightContractVersion !==
    WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION
  ) {
    return false;
  }
  if (record.sourceWorldlineContractVersion !== WARP_WORLDLINE_CONTRACT_VERSION) {
    return false;
  }
  if (
    record.targetDistanceContractVersion !==
    LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION
  ) {
    return false;
  }
  if (record.observerFamily !== "ship_centerline_local_comoving") return false;
  if (record.estimatorModelId !== "nhm2_repeated_local_probe_segment_estimator") {
    return false;
  }
  if (record.targetFrame !== "heliocentric-icrs") return false;
  if (record.targetId !== "alpha-cen-a" && record.targetId !== "proxima") return false;
  if (typeof record.targetName !== "string" || !record.targetName.length) return false;
  if (record.routeTimeStatus !== "bounded_local_segment_certified") return false;
  if (
    record.sourceWorldlineStatus !== "bounded_solve_backed" ||
    record.sourceCruisePreflightStatus !== "bounded_preflight_ready" ||
    record.sourceRouteTimeWorldlineStatus !== "bounded_route_time_ready"
  ) {
    return false;
  }
  if (
    typeof record.estimatorModelMeaning !== "string" ||
    !record.estimatorModelMeaning.length ||
    typeof record.routeParameterMeaning !== "string" ||
    !record.routeParameterMeaning.length
  ) {
    return false;
  }

  const sourceSurface = record.sourceSurface as Record<string, unknown> | undefined;
  if (!sourceSurface) return false;
  if (sourceSurface.surfaceId !== "nhm2_metric_local_comoving_transport_cross") {
    return false;
  }
  if (sourceSurface.provenanceClass !== "solve_backed") return false;
  if (sourceSurface.metricT00Source !== "metric") return false;
  if (sourceSurface.metricT00ContractStatus !== "ok") return false;
  if (sourceSurface.chartContractStatus !== "ok") return false;

  const chart = record.chart as Record<string, unknown> | undefined;
  if (!chart) return false;
  if (chart.label !== "comoving_cartesian") return false;
  if (chart.chartFixed !== true) return false;

  const targetDistance = record.targetDistance as Record<string, unknown> | undefined;
  if (!targetDistance) return false;
  if (
    typeof targetDistance.snapshotPath !== "string" ||
    !targetDistance.snapshotPath.length ||
    targetDistance.selectionRule !== "max_epochMs_then_lexicographic_filename"
  ) {
    return false;
  }
  const distanceMeters = toFiniteNumber(targetDistance.meters);
  const distanceParsecs = toFiniteNumber(targetDistance.parsecs);
  const distanceLightYears = toFiniteNumber(targetDistance.lightYears);
  const distanceEpochMs = toFiniteNumber(targetDistance.epochMs);
  if (
    distanceMeters == null ||
    distanceParsecs == null ||
    distanceLightYears == null ||
    distanceEpochMs == null ||
    !(distanceMeters > 0) ||
    !(distanceParsecs > 0) ||
    !(distanceLightYears > 0)
  ) {
    return false;
  }
  if (
    !nearlyEqual(distanceParsecs, distanceMeters / METERS_PER_PARSEC, 1e-9) ||
    !nearlyEqual(distanceLightYears, distanceParsecs * LIGHT_YEARS_PER_PARSEC, 1e-9)
  ) {
    return false;
  }

  const validityRegime = record.validityRegime as Record<string, unknown> | undefined;
  if (!validityRegime) return false;
  if (validityRegime.regimeId !== "nhm2_bounded_target_coupled_mission_estimator") {
    return false;
  }
  if (validityRegime.bounded !== true) return false;
  if (validityRegime.chartFixed !== true) return false;
  if (validityRegime.observerDefined !== true) return false;
  if (validityRegime.targetDistanceCoupled !== true) return false;
  if (validityRegime.routeTimeDerived !== true) return false;
  if (validityRegime.fullRouteDynamicCertified !== false) return false;
  if (validityRegime.maxSpeedCertified !== false) return false;
  if (validityRegime.viabilityCertified !== false) return false;
  if (validityRegime.failClosedOutsideRegime !== true) return false;

  const coordinateEstimate =
    record.coordinateTimeEstimate as Record<string, unknown> | undefined;
  const properEstimate =
    record.properTimeEstimate as Record<string, unknown> | undefined;
  if (!coordinateEstimate || !properEstimate) return false;
  const coordinateSeconds = toFiniteNumber(coordinateEstimate.seconds);
  const coordinateYears = toFiniteNumber(coordinateEstimate.years);
  const properSeconds = toFiniteNumber(properEstimate.seconds);
  const properYears = toFiniteNumber(properEstimate.years);
  if (
    coordinateSeconds == null ||
    coordinateYears == null ||
    properSeconds == null ||
    properYears == null ||
    !(coordinateSeconds > 0) ||
    !(properSeconds > 0)
  ) {
    return false;
  }
  const coordinateUnits =
    coordinateEstimate.units as Record<string, unknown> | undefined;
  const properUnits = properEstimate.units as Record<string, unknown> | undefined;
  if (
    !coordinateUnits ||
    !properUnits ||
    coordinateUnits.primary !== "s" ||
    coordinateUnits.secondary !== "yr" ||
    properUnits.primary !== "s" ||
    properUnits.secondary !== "yr"
  ) {
    return false;
  }
  if (
    !nearlyEqual(coordinateYears, coordinateSeconds / SECONDS_PER_YEAR, 1e-12) ||
    !nearlyEqual(properYears, properSeconds / SECONDS_PER_YEAR, 1e-12)
  ) {
    return false;
  }
  if (
    typeof coordinateEstimate.meaning !== "string" ||
    !coordinateEstimate.meaning.length ||
    typeof properEstimate.meaning !== "string" ||
    !properEstimate.meaning.length
  ) {
    return false;
  }

  if (
    record.comparisonReadiness !==
    "ready_for_paired_relativistic_vs_nonrelativistic_comparison"
  ) {
    return false;
  }
  if (
    !matchesStringArray(record.nextEligibleProducts, [
      "relativistic_vs_nonrelativistic_comparison",
      "cruise_envelope_semantics_upgrade",
    ])
  ) {
    return false;
  }

  const estimatorAssumptions = Array.isArray(record.estimatorAssumptions)
    ? record.estimatorAssumptions
    : null;
  const claimBoundary = Array.isArray(record.claimBoundary)
    ? record.claimBoundary
    : null;
  const falsifierConditions = Array.isArray(record.falsifierConditions)
    ? record.falsifierConditions
    : null;
  const nonClaims = Array.isArray(record.nonClaims) ? record.nonClaims : null;
  if (!estimatorAssumptions || estimatorAssumptions.length === 0) return false;
  if (!claimBoundary || !falsifierConditions || !nonClaims) return false;
  if (!nonClaims.includes("not max-speed certified")) return false;
  if (!nonClaims.includes("not viability-promotion evidence")) return false;
  return true;
};
