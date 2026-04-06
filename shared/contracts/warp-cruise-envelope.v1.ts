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
  WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION,
  isCertifiedWarpMissionTimeEstimatorContract,
  type WarpMissionTimeEstimatorContractV1,
} from "./warp-mission-time-estimator.v1";
import {
  WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION,
  isCertifiedWarpMissionTimeComparisonContract,
  type WarpMissionTimeComparisonContractV1,
  type WarpMissionTimeComparisonInterpretationStatus,
} from "./warp-mission-time-comparison.v1";
import {
  WARP_WORLDLINE_CONTRACT_VERSION,
  sameWarpWorldlineSourceSurface,
  type WarpWorldlineChart,
  type WarpWorldlineSourceSurface,
} from "./warp-worldline-contract.v1";

const CRUISE_ENVELOPE_TIME_TOLERANCE_SECONDS = 1e-9;

export const WARP_CRUISE_ENVELOPE_CONTRACT_VERSION = "warp_cruise_envelope/v1";

export type WarpCruiseEnvelopeStatus = "bounded_cruise_envelope_certified";
export type WarpCruiseEnvelopeModelId = "nhm2_route_consistent_descriptor_band";
export type WarpCruiseEnvelopeQuantityId =
  "bounded_local_transport_descriptor_norm";
export type WarpCruiseEnvelopeComparisonConsistencyStatus =
  | "consistent_with_zero_differential_comparison"
  | "consistent_with_bounded_relativistic_differential";

export type WarpCruiseEnvelopeContractV1 = {
  contractVersion: typeof WARP_CRUISE_ENVELOPE_CONTRACT_VERSION;
  status: WarpCruiseEnvelopeStatus;
  certified: true;
  sourcePreflightContractVersion: typeof WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION;
  sourceRouteTimeWorldlineContractVersion: typeof WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION;
  sourceMissionTimeEstimatorContractVersion: typeof WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION;
  sourceMissionTimeComparisonContractVersion: typeof WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION;
  sourceWorldlineContractVersion: typeof WARP_WORLDLINE_CONTRACT_VERSION;
  sourceSurface: WarpWorldlineSourceSurface;
  chart: WarpWorldlineChart;
  observerFamily: "ship_centerline_local_comoving";
  validityRegime: {
    regimeId: "nhm2_bounded_cruise_descriptor_envelope";
    bounded: true;
    chartFixed: true;
    observerDefined: true;
    localComovingOnly: true;
    routeTimeCertified: true;
    missionTimeCertified: true;
    missionComparisonCertified: true;
    routeMapEtaCertified: false;
    maxSpeedCertified: false;
    viabilityCertified: false;
    failClosedOutsideRegime: true;
    description: string;
    restrictions: string[];
  };
  cruiseEnvelopeModelId: WarpCruiseEnvelopeModelId;
  cruiseEnvelopeModelMeaning: string;
  envelopeQuantityId: WarpCruiseEnvelopeQuantityId;
  envelopeQuantityMeaning: string;
  envelopeQuantityUnits: "dimensionless";
  targetId: WarpMissionTimeEstimatorContractV1["targetId"];
  targetName: string;
  targetFrame: WarpMissionTimeEstimatorContractV1["targetFrame"];
  sourcePreflightStatus: WarpCruiseEnvelopePreflightContractV1["status"];
  sourceRouteTimeWorldlineStatus: WarpRouteTimeWorldlineContractV1["status"];
  sourceMissionTimeEstimatorStatus: WarpMissionTimeEstimatorContractV1["status"];
  sourceMissionTimeComparisonStatus: WarpMissionTimeComparisonContractV1["status"];
  admissibleBand: {
    min: number;
    max: number;
    units: "dimensionless";
    meaning: "certified_route_consistent_descriptor_band";
  };
  representativeValue: number;
  admissibilityReasons: string[];
  rejectionReasons: string[];
  comparisonConsistencyStatus: WarpCruiseEnvelopeComparisonConsistencyStatus;
  comparisonInterpretationStatus: WarpMissionTimeComparisonInterpretationStatus;
  comparisonConsistencyNote: string;
  routeTimeStatus: WarpRouteTimeWorldlineContractV1["routeTimeStatus"];
  missionTimeStatus: WarpMissionTimeEstimatorContractV1["status"];
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

const sameChart = (
  lhs: WarpWorldlineChart,
  rhs: WarpWorldlineChart,
): boolean =>
  lhs.label === rhs.label &&
  lhs.chartFixed === rhs.chartFixed &&
  (lhs.coordinateMap ?? null) === (rhs.coordinateMap ?? null);

const matchesStringArray = (
  value: unknown,
  expected: readonly string[],
): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  expected.every((entry, index) => value[index] === entry);

const resolveComparisonConsistencyStatus = (
  interpretationStatus: WarpMissionTimeComparisonInterpretationStatus,
): WarpCruiseEnvelopeComparisonConsistencyStatus =>
  interpretationStatus === "no_certified_relativistic_differential_detected"
    ? "consistent_with_zero_differential_comparison"
    : "consistent_with_bounded_relativistic_differential";

export const buildWarpCruiseEnvelopeContract = (args: {
  preflight: WarpCruiseEnvelopePreflightContractV1 | null | undefined;
  routeTimeWorldline: WarpRouteTimeWorldlineContractV1 | null | undefined;
  missionTimeEstimator: WarpMissionTimeEstimatorContractV1 | null | undefined;
  missionTimeComparison: WarpMissionTimeComparisonContractV1 | null | undefined;
}): WarpCruiseEnvelopeContractV1 | null => {
  if (!isCertifiedWarpCruiseEnvelopePreflightContract(args.preflight)) return null;
  if (!isCertifiedWarpRouteTimeWorldlineContract(args.routeTimeWorldline)) return null;
  if (!isCertifiedWarpMissionTimeEstimatorContract(args.missionTimeEstimator)) {
    return null;
  }
  if (!isCertifiedWarpMissionTimeComparisonContract(args.missionTimeComparison)) {
    return null;
  }

  const preflight = args.preflight;
  const routeTime = args.routeTimeWorldline;
  const missionTime = args.missionTimeEstimator;
  const comparison = args.missionTimeComparison;

  if (!sameWarpWorldlineSourceSurface(preflight.sourceSurface, routeTime.sourceSurface)) {
    return null;
  }
  if (!sameWarpWorldlineSourceSurface(preflight.sourceSurface, missionTime.sourceSurface)) {
    return null;
  }
  if (!sameWarpWorldlineSourceSurface(preflight.sourceSurface, comparison.sourceSurface)) {
    return null;
  }
  if (!sameChart(preflight.chart, routeTime.chart)) return null;
  if (!sameChart(preflight.chart, missionTime.chart)) return null;
  if (!sameChart(preflight.chart, comparison.chart)) return null;
  if (preflight.observerFamily !== routeTime.observerFamily) return null;
  if (preflight.observerFamily !== missionTime.observerFamily) return null;
  if (preflight.observerFamily !== comparison.observerFamily) return null;

  if (
    routeTime.descriptorScheduleSummary.quantityId !== preflight.preflightQuantityId ||
    routeTime.descriptorScheduleSummary.quantityUnits !== preflight.preflightQuantityUnits
  ) {
    return null;
  }
  if (missionTime.routeTimeStatus !== routeTime.routeTimeStatus) return null;
  if (comparison.targetId !== missionTime.targetId) return null;
  if (comparison.targetName !== missionTime.targetName) return null;
  if (comparison.targetFrame !== missionTime.targetFrame) return null;
  if (
    !nearlyEqual(
      comparison.warpCoordinateTimeEstimate.seconds,
      missionTime.coordinateTimeEstimate.seconds,
      CRUISE_ENVELOPE_TIME_TOLERANCE_SECONDS,
    ) ||
    !nearlyEqual(
      comparison.warpProperTimeEstimate.seconds,
      missionTime.properTimeEstimate.seconds,
      CRUISE_ENVELOPE_TIME_TOLERANCE_SECONDS,
    )
  ) {
    return null;
  }

  const admissibleMin = routeTime.descriptorScheduleSummary.min;
  const admissibleMax = routeTime.descriptorScheduleSummary.max;
  const representativeValue = routeTime.descriptorScheduleSummary.representative;
  if (
    !(admissibleMin > 0) ||
    !(admissibleMax >= admissibleMin) ||
    !(representativeValue >= admissibleMin) ||
    !(representativeValue <= admissibleMax)
  ) {
    return null;
  }
  if (
    admissibleMin < preflight.boundedCruisePreflightBand.min - 1e-12 ||
    admissibleMax > preflight.boundedCruisePreflightBand.max + 1e-12
  ) {
    return null;
  }

  const comparisonInterpretationStatus =
    comparison.comparisonMetrics.interpretationStatus;
  const comparisonConsistencyStatus = resolveComparisonConsistencyStatus(
    comparisonInterpretationStatus,
  );
  const routeTimeBandMatchesPreflightExtrema =
    nearlyEqual(admissibleMin, preflight.boundedCruisePreflightBand.min) &&
    nearlyEqual(admissibleMax, preflight.boundedCruisePreflightBand.max);

  return {
    contractVersion: WARP_CRUISE_ENVELOPE_CONTRACT_VERSION,
    status: "bounded_cruise_envelope_certified",
    certified: true,
    sourcePreflightContractVersion: WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION,
    sourceRouteTimeWorldlineContractVersion:
      WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION,
    sourceMissionTimeEstimatorContractVersion:
      WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION,
    sourceMissionTimeComparisonContractVersion:
      WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION,
    sourceWorldlineContractVersion: WARP_WORLDLINE_CONTRACT_VERSION,
    sourceSurface: { ...preflight.sourceSurface },
    chart: { ...preflight.chart },
    observerFamily: preflight.observerFamily,
    validityRegime: {
      regimeId: "nhm2_bounded_cruise_descriptor_envelope",
      bounded: true,
      chartFixed: true,
      observerDefined: true,
      localComovingOnly: true,
      routeTimeCertified: true,
      missionTimeCertified: true,
      missionComparisonCertified: true,
      routeMapEtaCertified: false,
      maxSpeedCertified: false,
      viabilityCertified: false,
      failClosedOutsideRegime: true,
      description:
        "Certified bounded NHM2 cruise-envelope semantics over the fixed-chart local-comoving descriptor quantity ||beta_eff||. The envelope is strengthened beyond preflight by consistency with a certified bounded route-time worldline, certified bounded mission-time estimator, and certified bounded mission-time comparison, while remaining explicitly non-speed and non-viability.",
      restrictions: [
        "descriptor_band_only_not_speed_mapping",
        "chart_fixed_comoving_cartesian_only",
        "observer_ship_centerline_local_comoving_only",
        "target_consistency_basis_inherited_from_certified_mission_estimator_only",
        "route_map_eta_surface_still_deferred",
        "outside_declared_regime_fail_closed",
      ],
    },
    cruiseEnvelopeModelId: "nhm2_route_consistent_descriptor_band",
    cruiseEnvelopeModelMeaning:
      "Certify the bounded fixed-chart cruise-control descriptor envelope over ||beta_eff|| by requiring that the admissible descriptor band remains within the certified preflight support, is exercised by the certified bounded route-time worldline, and stays consistent with the certified bounded mission-time estimator and bounded mission-time comparison. This is a descriptor envelope only, not a max-speed certificate.",
    envelopeQuantityId: "bounded_local_transport_descriptor_norm",
    envelopeQuantityMeaning:
      "Dimensionless norm ||beta_eff|| of the certified local-comoving effective transport descriptor, now elevated from preflight support to a route-time and mission-consistent bounded cruise envelope without introducing a speed mapping.",
    envelopeQuantityUnits: "dimensionless",
    targetId: missionTime.targetId,
    targetName: missionTime.targetName,
    targetFrame: missionTime.targetFrame,
    sourcePreflightStatus: preflight.status,
    sourceRouteTimeWorldlineStatus: routeTime.status,
    sourceMissionTimeEstimatorStatus: missionTime.status,
    sourceMissionTimeComparisonStatus: comparison.status,
    admissibleBand: {
      min: admissibleMin,
      max: admissibleMax,
      units: "dimensionless",
      meaning: "certified_route_consistent_descriptor_band",
    },
    representativeValue,
    admissibilityReasons: [
      "certified_cruise_preflight_present",
      "certified_route_time_worldline_present",
      "certified_mission_time_estimator_present",
      "certified_mission_time_comparison_present",
      routeTimeBandMatchesPreflightExtrema
        ? "route_time_exercised_band_matches_preflight_extrema_in_current_solve"
        : "route_time_exercised_band_refines_preflight_support",
      "descriptor_band_within_certified_preflight_support",
      comparisonConsistencyStatus ===
      "consistent_with_zero_differential_comparison"
        ? "comparison_zero_differential_reported_honestly_and_kept_nonpromotional"
        : "comparison_differential_reported_honestly_and_kept_bounded",
      "route_map_eta_and_speed_semantics_remain_deferred",
    ],
    rejectionReasons: [
      "missing_certified_cruise_preflight",
      "missing_certified_route_time_worldline",
      "missing_certified_mission_time_estimator",
      "missing_certified_mission_time_comparison",
      "descriptor_band_outside_certified_preflight_support",
      "target_consistency_mismatch_between_mission_estimator_and_comparison",
      "speed_or_eta_semantics_requested_without_dedicated_contract",
    ],
    comparisonConsistencyStatus,
    comparisonInterpretationStatus,
    comparisonConsistencyNote:
      comparisonConsistencyStatus ===
      "consistent_with_zero_differential_comparison"
        ? "The current bounded comparison shows no certified relativistic differential on the same target-distance basis. The cruise envelope therefore remains a consistency-qualified descriptor envelope, not evidence of warp advantage."
        : "The current bounded comparison shows a certified proper-time differential on the same target-distance basis, but the cruise envelope still remains a bounded descriptor envelope rather than a speed or advantage certificate.",
    routeTimeStatus: routeTime.routeTimeStatus,
    missionTimeStatus: missionTime.status,
    claimBoundary: [
      "certified bounded cruise-envelope semantics only",
      "fixed-chart local-comoving descriptor envelope only",
      "not a scalar vmax certificate",
      "not a route-map ETA contract",
      "not a viability-promotion evidence surface",
      "not an unconstrained relativistic-advantage certificate",
    ],
    falsifierConditions: [
      "certified_prerequisite_contract_missing",
      "descriptor_band_outside_certified_preflight_support",
      "target_or_time_consistency_mismatch_across_transport_chain",
      "route_map_eta_or_speed_semantics_requested_without_dedicated_contract",
      "comparison_consistency_not_preserved",
    ],
    nonClaims: [
      "not max-speed certified",
      "not viability-promotion evidence",
      "not a route-map ETA surface",
      "not unconstrained relativistic advantage certified",
      "not full route dynamic certified",
    ],
  };
};

export const isCertifiedWarpCruiseEnvelopeContract = (
  value: unknown,
): value is WarpCruiseEnvelopeContractV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.contractVersion !== WARP_CRUISE_ENVELOPE_CONTRACT_VERSION) return false;
  if (record.status !== "bounded_cruise_envelope_certified") return false;
  if (record.certified !== true) return false;
  if (
    record.sourcePreflightContractVersion !==
      WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION ||
    record.sourceRouteTimeWorldlineContractVersion !==
      WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION ||
    record.sourceMissionTimeEstimatorContractVersion !==
      WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION ||
    record.sourceMissionTimeComparisonContractVersion !==
      WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION ||
    record.sourceWorldlineContractVersion !== WARP_WORLDLINE_CONTRACT_VERSION
  ) {
    return false;
  }
  if (record.observerFamily !== "ship_centerline_local_comoving") return false;
  if (record.cruiseEnvelopeModelId !== "nhm2_route_consistent_descriptor_band") {
    return false;
  }
  if (record.envelopeQuantityId !== "bounded_local_transport_descriptor_norm") {
    return false;
  }
  if (record.envelopeQuantityUnits !== "dimensionless") return false;
  if (record.targetId !== "alpha-cen-a" && record.targetId !== "proxima") return false;
  if (typeof record.targetName !== "string" || !record.targetName.length) return false;
  if (record.targetFrame !== "heliocentric-icrs") return false;

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

  const validityRegime = record.validityRegime as Record<string, unknown> | undefined;
  if (!validityRegime) return false;
  if (validityRegime.regimeId !== "nhm2_bounded_cruise_descriptor_envelope") {
    return false;
  }
  if (validityRegime.bounded !== true) return false;
  if (validityRegime.chartFixed !== true) return false;
  if (validityRegime.observerDefined !== true) return false;
  if (validityRegime.localComovingOnly !== true) return false;
  if (validityRegime.routeTimeCertified !== true) return false;
  if (validityRegime.missionTimeCertified !== true) return false;
  if (validityRegime.missionComparisonCertified !== true) return false;
  if (validityRegime.routeMapEtaCertified !== false) return false;
  if (validityRegime.maxSpeedCertified !== false) return false;
  if (validityRegime.viabilityCertified !== false) return false;
  if (validityRegime.failClosedOutsideRegime !== true) return false;

  if (record.sourcePreflightStatus !== "bounded_preflight_ready") return false;
  if (record.sourceRouteTimeWorldlineStatus !== "bounded_route_time_ready") {
    return false;
  }
  if (
    record.sourceMissionTimeEstimatorStatus !==
    "bounded_target_coupled_estimate_ready"
  ) {
    return false;
  }
  if (
    record.sourceMissionTimeComparisonStatus !==
    "bounded_target_coupled_comparison_ready"
  ) {
    return false;
  }
  if (record.routeTimeStatus !== "bounded_local_segment_certified") return false;
  if (record.missionTimeStatus !== "bounded_target_coupled_estimate_ready") {
    return false;
  }

  const admissibleBand = record.admissibleBand as Record<string, unknown> | undefined;
  const representativeValue = toFiniteNumber(record.representativeValue);
  if (!admissibleBand || representativeValue == null) return false;
  const bandMin = toFiniteNumber(admissibleBand.min);
  const bandMax = toFiniteNumber(admissibleBand.max);
  if (
    bandMin == null ||
    bandMax == null ||
    admissibleBand.units !== "dimensionless" ||
    admissibleBand.meaning !== "certified_route_consistent_descriptor_band" ||
    !(bandMin > 0) ||
    !(bandMax >= bandMin) ||
    !(representativeValue >= bandMin) ||
    !(representativeValue <= bandMax)
  ) {
    return false;
  }

  const comparisonInterpretationStatus = record.comparisonInterpretationStatus;
  if (
    comparisonInterpretationStatus !==
      "no_certified_relativistic_differential_detected" &&
    comparisonInterpretationStatus !==
      "bounded_relativistic_differential_detected"
  ) {
    return false;
  }
  const expectedConsistencyStatus = resolveComparisonConsistencyStatus(
    comparisonInterpretationStatus,
  );
  if (record.comparisonConsistencyStatus !== expectedConsistencyStatus) return false;
  if (
    typeof record.comparisonConsistencyNote !== "string" ||
    !record.comparisonConsistencyNote.length
  ) {
    return false;
  }

  const admissibilityReasons = Array.isArray(record.admissibilityReasons)
    ? record.admissibilityReasons
    : null;
  const rejectionReasons = Array.isArray(record.rejectionReasons)
    ? record.rejectionReasons
    : null;
  const claimBoundary = Array.isArray(record.claimBoundary)
    ? record.claimBoundary
    : null;
  const falsifierConditions = Array.isArray(record.falsifierConditions)
    ? record.falsifierConditions
    : null;
  const nonClaims = Array.isArray(record.nonClaims) ? record.nonClaims : null;
  if (!admissibilityReasons || admissibilityReasons.length === 0) return false;
  if (!rejectionReasons || rejectionReasons.length === 0) return false;
  if (!claimBoundary || claimBoundary.length === 0) return false;
  if (!falsifierConditions || falsifierConditions.length === 0) return false;
  if (!nonClaims || nonClaims.length === 0) return false;
  if (!nonClaims.includes("not max-speed certified")) return false;
  if (!nonClaims.includes("not viability-promotion evidence")) return false;
  if (!nonClaims.includes("not a route-map ETA surface")) return false;
  if (
    !matchesStringArray(rejectionReasons, [
      "missing_certified_cruise_preflight",
      "missing_certified_route_time_worldline",
      "missing_certified_mission_time_estimator",
      "missing_certified_mission_time_comparison",
      "descriptor_band_outside_certified_preflight_support",
      "target_consistency_mismatch_between_mission_estimator_and_comparison",
      "speed_or_eta_semantics_requested_without_dedicated_contract",
    ])
  ) {
    return false;
  }
  return true;
};
