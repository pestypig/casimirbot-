import {
  LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION,
  SECONDS_PER_YEAR,
  WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION,
  isCertifiedWarpMissionTimeEstimatorContract,
  type WarpMissionTimeEstimatorContractV1,
  type WarpMissionTimeScalarEstimate,
} from "./warp-mission-time-estimator.v1";
import { WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION } from "./warp-route-time-worldline.v1";
import { WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION } from "./warp-cruise-envelope-preflight.v1";
import {
  WARP_WORLDLINE_CONTRACT_VERSION,
  type WarpWorldlineChart,
  type WarpWorldlineSourceSurface,
} from "./warp-worldline-contract.v1";

const MISSION_TIME_COMPARISON_REL_TOL = 1e-12;

export const WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION =
  "warp_mission_time_comparison/v1";

export type WarpMissionTimeComparisonStatus =
  "bounded_target_coupled_comparison_ready";
export type WarpMissionTimeComparisonModelId =
  "nhm2_classical_no_time_dilation_reference";
export type WarpMissionTimeComparisonReadiness =
  "paired_classical_reference_certified_speed_comparators_deferred";
export type WarpMissionTimeComparisonDeferredComparator =
  | "speed_based_nonrelativistic_reference"
  | "speed_based_flat_sr_reference"
  | "route_map_eta_surface"
  | "broad_relativistic_advantage_certification";
export type WarpMissionTimeComparisonInterpretationStatus =
  | "no_certified_relativistic_differential_detected"
  | "bounded_relativistic_differential_detected";

export type WarpMissionTimeComparisonMetricsV1 = {
  properMinusCoordinate_seconds: number;
  properVsCoordinate_ratio: number;
  properMinusClassical_seconds: number;
  properVsClassical_ratio: number;
  coordinateMinusClassical_seconds: number;
  coordinateVsClassical_ratio: number;
  interpretationStatus: WarpMissionTimeComparisonInterpretationStatus;
  differentialToleranceSeconds: number;
};

export type WarpMissionTimeComparisonContractV1 = {
  contractVersion: typeof WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION;
  status: WarpMissionTimeComparisonStatus;
  certified: true;
  sourceMissionTimeEstimatorContractVersion: typeof WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION;
  sourceRouteTimeWorldlineContractVersion: typeof WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION;
  sourceCruisePreflightContractVersion: typeof WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION;
  sourceWorldlineContractVersion: typeof WARP_WORLDLINE_CONTRACT_VERSION;
  targetDistanceContractVersion: typeof LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION;
  sourceSurface: WarpWorldlineSourceSurface;
  chart: WarpWorldlineChart;
  observerFamily: "ship_centerline_local_comoving";
  comparisonModelId: WarpMissionTimeComparisonModelId;
  comparisonModelMeaning: string;
  targetId: WarpMissionTimeEstimatorContractV1["targetId"];
  targetName: string;
  targetFrame: WarpMissionTimeEstimatorContractV1["targetFrame"];
  warpCoordinateTimeEstimate: WarpMissionTimeScalarEstimate;
  warpProperTimeEstimate: WarpMissionTimeScalarEstimate;
  classicalReferenceTimeEstimate: WarpMissionTimeScalarEstimate;
  comparisonMetrics: WarpMissionTimeComparisonMetricsV1;
  comparisonReadiness: WarpMissionTimeComparisonReadiness;
  deferredComparators: WarpMissionTimeComparisonDeferredComparator[];
  claimBoundary: string[];
  falsifierConditions: string[];
  nonClaims: string[];
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const nearlyEqual = (lhs: number, rhs: number, tolerance: number): boolean =>
  Math.abs(lhs - rhs) <= tolerance;

const matchesStringArray = (
  value: unknown,
  expected: readonly string[],
): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  expected.every((entry, index) => value[index] === entry);

const buildScalarEstimate = (args: {
  seconds: number;
  meaning: string;
}): WarpMissionTimeScalarEstimate => ({
  seconds: args.seconds,
  years: args.seconds / SECONDS_PER_YEAR,
  units: { primary: "s", secondary: "yr" },
  meaning: args.meaning,
});

const computeComparisonMetrics = (args: {
  coordinateSeconds: number;
  properSeconds: number;
  classicalSeconds: number;
}): WarpMissionTimeComparisonMetricsV1 => {
  const tolerance = Math.max(
    1e-9,
    Math.max(args.coordinateSeconds, args.properSeconds, args.classicalSeconds) *
      MISSION_TIME_COMPARISON_REL_TOL,
  );
  const properMinusCoordinate_seconds =
    args.properSeconds - args.coordinateSeconds;
  const properMinusClassical_seconds =
    args.properSeconds - args.classicalSeconds;
  const coordinateMinusClassical_seconds =
    args.coordinateSeconds - args.classicalSeconds;
  const interpretationStatus =
    nearlyEqual(args.properSeconds, args.coordinateSeconds, tolerance) &&
    nearlyEqual(args.properSeconds, args.classicalSeconds, tolerance) &&
    nearlyEqual(args.coordinateSeconds, args.classicalSeconds, tolerance)
      ? "no_certified_relativistic_differential_detected"
      : "bounded_relativistic_differential_detected";
  return {
    properMinusCoordinate_seconds,
    properVsCoordinate_ratio: args.properSeconds / args.coordinateSeconds,
    properMinusClassical_seconds,
    properVsClassical_ratio: args.properSeconds / args.classicalSeconds,
    coordinateMinusClassical_seconds,
    coordinateVsClassical_ratio:
      args.coordinateSeconds / args.classicalSeconds,
    interpretationStatus,
    differentialToleranceSeconds: tolerance,
  };
};

const isValidScalarEstimate = (
  value: unknown,
): value is WarpMissionTimeScalarEstimate => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const seconds = toFiniteNumber(record.seconds);
  const years = toFiniteNumber(record.years);
  const units = record.units as Record<string, unknown> | undefined;
  return Boolean(
    seconds != null &&
      years != null &&
      seconds > 0 &&
      years > 0 &&
      units?.primary === "s" &&
      units?.secondary === "yr" &&
      nearlyEqual(years, seconds / SECONDS_PER_YEAR, 1e-12) &&
      typeof record.meaning === "string" &&
      record.meaning.length > 0,
  );
};

export const buildWarpMissionTimeComparisonContract = (args: {
  missionTimeEstimator: WarpMissionTimeEstimatorContractV1 | null | undefined;
}): WarpMissionTimeComparisonContractV1 | null => {
  if (!isCertifiedWarpMissionTimeEstimatorContract(args.missionTimeEstimator)) {
    return null;
  }
  const estimator = args.missionTimeEstimator;
  if (
    estimator.comparisonReadiness !==
    "ready_for_paired_relativistic_vs_nonrelativistic_comparison"
  ) {
    return null;
  }
  if (!estimator.nextEligibleProducts.includes("relativistic_vs_nonrelativistic_comparison")) {
    return null;
  }

  const coordinateSeconds = estimator.coordinateTimeEstimate.seconds;
  const properSeconds = estimator.properTimeEstimate.seconds;
  if (!(coordinateSeconds > 0) || !(properSeconds > 0)) return null;

  const classicalReferenceTimeEstimate = buildScalarEstimate({
    seconds: coordinateSeconds,
    meaning:
      "Classical no-time-dilation reference on the same target-coupled bounded mission-estimator basis: impose tau=t over the repeated certified local route-time schedule without introducing any speed-based comparator semantics.",
  });

  return {
    contractVersion: WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION,
    status: "bounded_target_coupled_comparison_ready",
    certified: true,
    sourceMissionTimeEstimatorContractVersion:
      WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION,
    sourceRouteTimeWorldlineContractVersion:
      estimator.sourceRouteTimeWorldlineContractVersion,
    sourceCruisePreflightContractVersion:
      estimator.sourceCruisePreflightContractVersion,
    sourceWorldlineContractVersion: estimator.sourceWorldlineContractVersion,
    targetDistanceContractVersion: estimator.targetDistanceContractVersion,
    sourceSurface: { ...estimator.sourceSurface },
    chart: { ...estimator.chart },
    observerFamily: estimator.observerFamily,
    comparisonModelId: "nhm2_classical_no_time_dilation_reference",
    comparisonModelMeaning:
      "Compare the certified bounded NHM2 warp mission coordinate time and ship proper time against a classical no-time-dilation reference that uses the exact same target-distance-coupled mission-estimator basis and sets tau=t. This comparison reports only the certified proper-time differential, if any, and does not introduce speed-based relativistic or nonrelativistic semantics.",
    targetId: estimator.targetId,
    targetName: estimator.targetName,
    targetFrame: estimator.targetFrame,
    warpCoordinateTimeEstimate: {
      ...estimator.coordinateTimeEstimate,
      units: { ...estimator.coordinateTimeEstimate.units },
    },
    warpProperTimeEstimate: {
      ...estimator.properTimeEstimate,
      units: { ...estimator.properTimeEstimate.units },
    },
    classicalReferenceTimeEstimate,
    comparisonMetrics: computeComparisonMetrics({
      coordinateSeconds,
      properSeconds,
      classicalSeconds: classicalReferenceTimeEstimate.seconds,
    }),
    comparisonReadiness:
      "paired_classical_reference_certified_speed_comparators_deferred",
    deferredComparators: [
      "speed_based_nonrelativistic_reference",
      "speed_based_flat_sr_reference",
      "route_map_eta_surface",
      "broad_relativistic_advantage_certification",
    ],
    claimBoundary: [
      "bounded mission-time comparison only",
      "target-coupled through the certified mission-time estimator basis only",
      "classical comparator is tau=t on the same certified target-distance schedule only",
      "not max-speed certified",
      "not viability-promotion evidence",
      "not a route-map ETA surface",
      "not a broad relativistic-advantage certificate",
    ],
    falsifierConditions: [
      "certified_mission_time_estimator_missing",
      "comparison_readiness_not_granted_by_mission_estimator",
      "target_distance_contract_provenance_missing",
      "comparison_time_estimate_nonfinite",
      "speed_based_comparator_requested_without_certified_speed_semantics",
    ],
    nonClaims: [
      "not max-speed certified",
      "not viability-promotion evidence",
      "not full route dynamic certified",
      "not unconstrained ETA for arbitrary targets",
      "not a speed-based relativistic or nonrelativistic comparator",
    ],
  };
};

export const isCertifiedWarpMissionTimeComparisonContract = (
  value: unknown,
): value is WarpMissionTimeComparisonContractV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.contractVersion !== WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION) {
    return false;
  }
  if (record.status !== "bounded_target_coupled_comparison_ready") return false;
  if (record.certified !== true) return false;
  if (
    record.sourceMissionTimeEstimatorContractVersion !==
    WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION
  ) {
    return false;
  }
  if (
    record.sourceRouteTimeWorldlineContractVersion !==
      WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION ||
    record.sourceCruisePreflightContractVersion !==
      WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION ||
    record.sourceWorldlineContractVersion !== WARP_WORLDLINE_CONTRACT_VERSION ||
    record.targetDistanceContractVersion !==
      LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION
  ) {
    return false;
  }
  if (record.observerFamily !== "ship_centerline_local_comoving") return false;
  if (record.comparisonModelId !== "nhm2_classical_no_time_dilation_reference") {
    return false;
  }
  if (
    typeof record.comparisonModelMeaning !== "string" ||
    !record.comparisonModelMeaning.length
  ) {
    return false;
  }
  if (record.targetId !== "alpha-cen-a" && record.targetId !== "proxima") return false;
  if (typeof record.targetName !== "string" || !record.targetName.length) return false;
  if (record.targetFrame !== "heliocentric-icrs") return false;

  const sourceSurface = record.sourceSurface as Record<string, unknown> | undefined;
  if (!sourceSurface) return false;
  if (sourceSurface.provenanceClass !== "solve_backed") return false;
  if (sourceSurface.metricT00Source !== "metric") return false;
  if (sourceSurface.metricT00ContractStatus !== "ok") return false;
  if (sourceSurface.chartContractStatus !== "ok") return false;

  const chart = record.chart as Record<string, unknown> | undefined;
  if (!chart) return false;
  if (chart.label !== "comoving_cartesian") return false;
  if (chart.chartFixed !== true) return false;

  if (!isValidScalarEstimate(record.warpCoordinateTimeEstimate)) return false;
  if (!isValidScalarEstimate(record.warpProperTimeEstimate)) return false;
  if (!isValidScalarEstimate(record.classicalReferenceTimeEstimate)) return false;

  const warpCoordinate =
    record.warpCoordinateTimeEstimate as WarpMissionTimeScalarEstimate;
  const warpProper = record.warpProperTimeEstimate as WarpMissionTimeScalarEstimate;
  const classical =
    record.classicalReferenceTimeEstimate as WarpMissionTimeScalarEstimate;
  const metrics = record.comparisonMetrics as Record<string, unknown> | undefined;
  if (!metrics) return false;
  const properMinusCoordinate_seconds = toFiniteNumber(
    metrics.properMinusCoordinate_seconds,
  );
  const properVsCoordinate_ratio = toFiniteNumber(metrics.properVsCoordinate_ratio);
  const properMinusClassical_seconds = toFiniteNumber(
    metrics.properMinusClassical_seconds,
  );
  const properVsClassical_ratio = toFiniteNumber(metrics.properVsClassical_ratio);
  const coordinateMinusClassical_seconds = toFiniteNumber(
    metrics.coordinateMinusClassical_seconds,
  );
  const coordinateVsClassical_ratio = toFiniteNumber(
    metrics.coordinateVsClassical_ratio,
  );
  const differentialToleranceSeconds = toFiniteNumber(
    metrics.differentialToleranceSeconds,
  );
  if (
    properMinusCoordinate_seconds == null ||
    properVsCoordinate_ratio == null ||
    properMinusClassical_seconds == null ||
    properVsClassical_ratio == null ||
    coordinateMinusClassical_seconds == null ||
    coordinateVsClassical_ratio == null ||
    differentialToleranceSeconds == null ||
    !(differentialToleranceSeconds > 0)
  ) {
    return false;
  }
  if (
    !nearlyEqual(
      properMinusCoordinate_seconds,
      warpProper.seconds - warpCoordinate.seconds,
      differentialToleranceSeconds,
    ) ||
    !nearlyEqual(
      properMinusClassical_seconds,
      warpProper.seconds - classical.seconds,
      differentialToleranceSeconds,
    ) ||
    !nearlyEqual(
      coordinateMinusClassical_seconds,
      warpCoordinate.seconds - classical.seconds,
      differentialToleranceSeconds,
    )
  ) {
    return false;
  }
  if (
    !nearlyEqual(
      properVsCoordinate_ratio,
      warpProper.seconds / warpCoordinate.seconds,
      1e-12,
    ) ||
    !nearlyEqual(
      properVsClassical_ratio,
      warpProper.seconds / classical.seconds,
      1e-12,
    ) ||
    !nearlyEqual(
      coordinateVsClassical_ratio,
      warpCoordinate.seconds / classical.seconds,
      1e-12,
    )
  ) {
    return false;
  }
  const expectedInterpretation =
    nearlyEqual(warpProper.seconds, warpCoordinate.seconds, differentialToleranceSeconds) &&
    nearlyEqual(warpProper.seconds, classical.seconds, differentialToleranceSeconds) &&
    nearlyEqual(warpCoordinate.seconds, classical.seconds, differentialToleranceSeconds)
      ? "no_certified_relativistic_differential_detected"
      : "bounded_relativistic_differential_detected";
  if (metrics.interpretationStatus !== expectedInterpretation) return false;

  if (
    record.comparisonReadiness !==
    "paired_classical_reference_certified_speed_comparators_deferred"
  ) {
    return false;
  }
  if (
    !matchesStringArray(record.deferredComparators, [
      "speed_based_nonrelativistic_reference",
      "speed_based_flat_sr_reference",
      "route_map_eta_surface",
      "broad_relativistic_advantage_certification",
    ])
  ) {
    return false;
  }

  const claimBoundary = Array.isArray(record.claimBoundary)
    ? record.claimBoundary
    : null;
  const falsifierConditions = Array.isArray(record.falsifierConditions)
    ? record.falsifierConditions
    : null;
  const nonClaims = Array.isArray(record.nonClaims) ? record.nonClaims : null;
  if (!claimBoundary || claimBoundary.length === 0) return false;
  if (!falsifierConditions || falsifierConditions.length === 0) return false;
  if (!nonClaims || nonClaims.length === 0) return false;
  if (!nonClaims.includes("not max-speed certified")) return false;
  if (!nonClaims.includes("not viability-promotion evidence")) return false;
  return true;
};
