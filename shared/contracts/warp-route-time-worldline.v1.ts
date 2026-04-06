import {
  WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION,
  computeWarpCruiseEnvelopePreflightQuantity,
  isCertifiedWarpCruiseEnvelopePreflightContract,
  type WarpCruiseEnvelopePreflightContractV1,
} from "./warp-cruise-envelope-preflight.v1";
import {
  WARP_WORLDLINE_CONTRACT_VERSION,
  WARP_WORLDLINE_NORMALIZATION_TOLERANCE,
  isCertifiedWarpWorldlineContract,
  type WarpWorldlineChart,
  type WarpWorldlineContractV1,
  type WarpWorldlineSampleRole,
  type WarpWorldlineSourceSurface,
  type WarpWorldlineTransportProvenance,
  type WarpWorldlineVec3,
  sameWarpWorldlineSourceSurface,
} from "./warp-worldline-contract.v1";

const SPEED_OF_LIGHT_MPS = 299_792_458;
const ROUTE_TIME_MONOTONIC_TOLERANCE = 1e-12;

export const WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION =
  "warp_route_time_worldline/v1";

export type WarpRouteTimeWorldlineStatus = "bounded_route_time_ready";
export type WarpRouteTimeWorldlineRouteModelId =
  "nhm2_bounded_local_probe_lambda";
export type WarpRouteTimeWorldlineRouteParameterName = "lambda";
export type WarpRouteTimeWorldlineRouteTimeStatus =
  "bounded_local_segment_certified";
export type WarpRouteTimeWorldlineEligibleNextProduct = "mission_time_estimator";

export const WARP_ROUTE_TIME_WORLDLINE_SAMPLE_ORDER: WarpWorldlineSampleRole[] =
  [
    "shell_aft",
    "centerline_aft",
    "centerline_center",
    "centerline_fore",
    "shell_fore",
  ];

export type WarpRouteTimeWorldlineProgressionSampleV1 = {
  progressionIndex: number;
  sourceSampleId: WarpWorldlineSampleRole;
  routeParameterValue: number;
  coordinateTime_s: number;
  coordinateTimeIncrement_s: number;
  properTimeIncrement_s: number;
  cumulativeProperTime_s: number;
  boundedProgressCoordinate_m: number;
  position_m: WarpWorldlineVec3;
  betaCoord: WarpWorldlineVec3;
  effectiveTransportVelocityCoord: WarpWorldlineVec3;
  localDescriptorValue: number;
  localDescriptorUnits: "dimensionless";
  dtau_dt: number;
  normalizationResidual: number;
  provenanceClass: "solve_backed";
  transportProvenance: WarpWorldlineTransportProvenance;
};

export type WarpRouteTimeWorldlineContractV1 = {
  contractVersion: typeof WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION;
  status: WarpRouteTimeWorldlineStatus;
  certified: true;
  sourceWorldlineContractVersion: typeof WARP_WORLDLINE_CONTRACT_VERSION;
  sourceCruisePreflightContractVersion: typeof WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION;
  sourceSurface: WarpWorldlineSourceSurface;
  chart: WarpWorldlineChart;
  observerFamily: "ship_centerline_local_comoving";
  routeModelId: WarpRouteTimeWorldlineRouteModelId;
  routeModelMeaning: string;
  routeParameterName: WarpRouteTimeWorldlineRouteParameterName;
  routeParameterMeaning: string;
  validityRegime: {
    regimeId: "nhm2_bounded_route_time_local_probe";
    bounded: true;
    chartFixed: true;
    observerDefined: true;
    localComovingOnly: true;
    targetDistanceCoupled: false;
    missionTimeCertified: false;
    routeEtaCertified: false;
    failClosedOutsideRegime: true;
    description: string;
    restrictions: string[];
  };
  sourceSampleGeometryFamilyId: "nhm2_centerline_shell_cross";
  sampleFamilyAdequacy: WarpWorldlineContractV1["sampleFamilyAdequacy"];
  transportVariationStatus: WarpWorldlineContractV1["transportVariation"]["transportVariationStatus"];
  transportInformativenessStatus: WarpWorldlineContractV1["transportInformativenessStatus"];
  progressionSampleCount: number;
  representativeProgressionSampleId: "centerline_center";
  progressionSamples: WarpRouteTimeWorldlineProgressionSampleV1[];
  coordinateTimeSummary: {
    start: number;
    end: number;
    span: number;
    monotone: true;
    units: "s";
    meaning: "bounded_local_probe_light_crossing_coordinate_time";
  };
  properTimeSummary: {
    start: number;
    end: number;
    span: number;
    monotone: true;
    positivityRequired: true;
    units: "s";
    meaning: "cumulative_ship_proper_time_over_bounded_local_probe";
  };
  descriptorScheduleSummary: {
    quantityId: "bounded_local_transport_descriptor_norm";
    quantityMeaning: string;
    quantityUnits: "dimensionless";
    representative: number;
    min: number;
    max: number;
    spread: number;
  };
  routeProgressMeaning: string;
  routeTimeStatus: WarpRouteTimeWorldlineRouteTimeStatus;
  nextEligibleProducts: WarpRouteTimeWorldlineEligibleNextProduct[];
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

const matchesTuple = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  expected.every((entry, index) => value[index] === entry);

const vecDot = (lhs: WarpWorldlineVec3, rhs: WarpWorldlineVec3): number =>
  lhs[0] * rhs[0] + lhs[1] * rhs[1] + lhs[2] * rhs[2];

const vecNorm = (vec: WarpWorldlineVec3): number =>
  Math.hypot(vec[0], vec[1], vec[2]);

const normalizeVec = (vec: WarpWorldlineVec3): WarpWorldlineVec3 | null => {
  const norm = vecNorm(vec);
  if (!(norm > 0)) return null;
  return [vec[0] / norm, vec[1] / norm, vec[2] / norm];
};

const sameChart = (
  lhs: WarpWorldlineChart,
  rhs: WarpWorldlineChart,
): boolean =>
  lhs.label === rhs.label &&
  lhs.chartFixed === rhs.chartFixed &&
  (lhs.coordinateMap ?? null) === (rhs.coordinateMap ?? null);

const finiteVec3 = (value: unknown): value is WarpWorldlineVec3 =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((entry) => Number.isFinite(Number(entry)));

const buildProgressionSamples = (
  worldline: WarpWorldlineContractV1,
): WarpRouteTimeWorldlineProgressionSampleV1[] | null => {
  const centerlineAxis = normalizeVec(worldline.sampleGeometry.axes.centerline);
  if (!centerlineAxis) return null;

  const sourceSamples = WARP_ROUTE_TIME_WORLDLINE_SAMPLE_ORDER.map((sampleId) =>
    worldline.samples.find((entry) => entry.sampleId === sampleId) ?? null,
  );
  if (sourceSamples.some((entry) => entry == null)) return null;
  const typedSourceSamples = sourceSamples as WarpWorldlineContractV1["samples"];

  const longitudinalScalars = typedSourceSamples.map((sample) =>
    vecDot(sample.position_m, centerlineAxis),
  );
  const minScalar = longitudinalScalars[0] ?? null;
  const maxScalar = longitudinalScalars[longitudinalScalars.length - 1] ?? null;
  if (minScalar == null || maxScalar == null) return null;
  const span_m = maxScalar - minScalar;
  if (!(span_m > 0)) return null;

  const coordinateTimeSpan_s = span_m / SPEED_OF_LIGHT_MPS;
  if (!(coordinateTimeSpan_s > 0)) return null;

  const progressionSamples: WarpRouteTimeWorldlineProgressionSampleV1[] = [];
  let cumulativeProperTime_s = 0;
  let previousCoordinateTime_s = 0;
  let previousDtauDt = typedSourceSamples[0]?.dtau_dt ?? 0;

  for (let index = 0; index < typedSourceSamples.length; index += 1) {
    const sample = typedSourceSamples[index]!;
    const scalar = longitudinalScalars[index]!;
    const lambda = (scalar - minScalar) / span_m;
    const coordinateTime_s = lambda * coordinateTimeSpan_s;
    const coordinateTimeIncrement_s =
      index === 0 ? 0 : coordinateTime_s - previousCoordinateTime_s;
    if (!(coordinateTimeIncrement_s >= -ROUTE_TIME_MONOTONIC_TOLERANCE)) return null;

    const properTimeIncrement_s =
      index === 0
        ? 0
        : 0.5 * (previousDtauDt + sample.dtau_dt) * coordinateTimeIncrement_s;
    if (!(properTimeIncrement_s >= -ROUTE_TIME_MONOTONIC_TOLERANCE)) return null;

    if (index > 0) {
      cumulativeProperTime_s += properTimeIncrement_s;
    }

    progressionSamples.push({
      progressionIndex: index,
      sourceSampleId: sample.sampleId,
      routeParameterValue: lambda,
      coordinateTime_s,
      coordinateTimeIncrement_s: Math.max(0, coordinateTimeIncrement_s),
      properTimeIncrement_s: Math.max(0, properTimeIncrement_s),
      cumulativeProperTime_s,
      boundedProgressCoordinate_m: scalar - minScalar,
      position_m: [...sample.position_m] as WarpWorldlineVec3,
      betaCoord: [...sample.betaCoord] as WarpWorldlineVec3,
      effectiveTransportVelocityCoord: [
        ...sample.effectiveTransportVelocityCoord,
      ] as WarpWorldlineVec3,
      localDescriptorValue: computeWarpCruiseEnvelopePreflightQuantity(sample),
      localDescriptorUnits: "dimensionless",
      dtau_dt: sample.dtau_dt,
      normalizationResidual: sample.normalizationResidual,
      provenanceClass: "solve_backed",
      transportProvenance: sample.transportProvenance,
    });

    previousCoordinateTime_s = coordinateTime_s;
    previousDtauDt = sample.dtau_dt;
  }

  return progressionSamples;
};

export const buildWarpRouteTimeWorldlineContract = (args: {
  worldline: WarpWorldlineContractV1 | null | undefined;
  preflight: WarpCruiseEnvelopePreflightContractV1 | null | undefined;
}): WarpRouteTimeWorldlineContractV1 | null => {
  if (!isCertifiedWarpWorldlineContract(args.worldline)) return null;
  if (!isCertifiedWarpCruiseEnvelopePreflightContract(args.preflight)) return null;
  const worldline = args.worldline;
  const preflight = args.preflight;

  if (!sameWarpWorldlineSourceSurface(worldline.sourceSurface, preflight.sourceSurface)) {
    return null;
  }
  if (!sameChart(worldline.chart, preflight.chart)) return null;
  if (worldline.observerFamily !== preflight.observerFamily) return null;
  if (worldline.sampleGeometry.familyId !== preflight.sourceSampleGeometryFamilyId) {
    return null;
  }
  if (worldline.sampleFamilyAdequacy !== "adequate_for_bounded_cruise_preflight") {
    return null;
  }
  if (worldline.transportInformativenessStatus !== "descriptor_informative_local_only") {
    return null;
  }
  if (worldline.validityRegime.routeTimeCertified !== false) return null;
  if (preflight.routeTimeStatus !== "deferred") return null;
  if (
    !matchesTuple(preflight.eligibleNextProducts, [
      "route_time_worldline_extension",
    ])
  ) {
    return null;
  }

  const progressionSamples = buildProgressionSamples(worldline);
  if (!progressionSamples) return null;

  const representativeSample =
    progressionSamples.find((entry) => entry.sourceSampleId === "centerline_center") ??
    null;
  if (!representativeSample) return null;

  const coordinateTimeStart = progressionSamples[0]?.coordinateTime_s ?? null;
  const coordinateTimeEnd =
    progressionSamples[progressionSamples.length - 1]?.coordinateTime_s ?? null;
  const properTimeStart = progressionSamples[0]?.cumulativeProperTime_s ?? null;
  const properTimeEnd =
    progressionSamples[progressionSamples.length - 1]?.cumulativeProperTime_s ?? null;
  if (
    coordinateTimeStart == null ||
    coordinateTimeEnd == null ||
    properTimeStart == null ||
    properTimeEnd == null
  ) {
    return null;
  }

  const descriptorValues = progressionSamples.map((entry) => entry.localDescriptorValue);
  const descriptorMin = Math.min(...descriptorValues);
  const descriptorMax = Math.max(...descriptorValues);

  return {
    contractVersion: WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION,
    status: "bounded_route_time_ready",
    certified: true,
    sourceWorldlineContractVersion: WARP_WORLDLINE_CONTRACT_VERSION,
    sourceCruisePreflightContractVersion:
      WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION,
    sourceSurface: { ...worldline.sourceSurface },
    chart: { ...worldline.chart },
    observerFamily: worldline.observerFamily,
    routeModelId: "nhm2_bounded_local_probe_lambda",
    routeModelMeaning:
      "Deterministic bounded route-time progression across the certified shell-aft to shell-fore local probe segment in the comoving Cartesian chart. Coordinate time is parameterized by the local light-crossing horizon of that bounded segment; no target distance or ship speed is inferred.",
    routeParameterName: "lambda",
    routeParameterMeaning:
      "Normalized bounded route progress lambda in [0,1] along the certified local longitudinal probe segment from shell_aft to shell_fore in the fixed comoving Cartesian chart.",
    validityRegime: {
      regimeId: "nhm2_bounded_route_time_local_probe",
      bounded: true,
      chartFixed: true,
      observerDefined: true,
      localComovingOnly: true,
      targetDistanceCoupled: false,
      missionTimeCertified: false,
      routeEtaCertified: false,
      failClosedOutsideRegime: true,
      description:
        "Bounded NHM2 route-time worldline extension over a certified local probe segment. It is valid only in the fixed local-comoving chart, remains uncoupled from target distance, and is not a mission-time or ETA contract.",
      restrictions: [
        "normalized_local_probe_progress_only",
        "target_distance_semantics_deferred",
        "route_map_eta_outputs_deferred",
        "max_speed_claims_deferred",
        "mission_time_estimator_requires_follow_on_contract",
      ],
    },
    sourceSampleGeometryFamilyId: worldline.sampleGeometry.familyId,
    sampleFamilyAdequacy: worldline.sampleFamilyAdequacy,
    transportVariationStatus: worldline.transportVariation.transportVariationStatus,
    transportInformativenessStatus: worldline.transportInformativenessStatus,
    progressionSampleCount: progressionSamples.length,
    representativeProgressionSampleId: "centerline_center",
    progressionSamples,
    coordinateTimeSummary: {
      start: coordinateTimeStart,
      end: coordinateTimeEnd,
      span: coordinateTimeEnd - coordinateTimeStart,
      monotone: true,
      units: "s",
      meaning: "bounded_local_probe_light_crossing_coordinate_time",
    },
    properTimeSummary: {
      start: properTimeStart,
      end: properTimeEnd,
      span: properTimeEnd - properTimeStart,
      monotone: true,
      positivityRequired: true,
      units: "s",
      meaning: "cumulative_ship_proper_time_over_bounded_local_probe",
    },
    descriptorScheduleSummary: {
      quantityId: "bounded_local_transport_descriptor_norm",
      quantityMeaning: preflight.preflightQuantityMeaning,
      quantityUnits: "dimensionless",
      representative: representativeSample.localDescriptorValue,
      min: descriptorMin,
      max: descriptorMax,
      spread: descriptorMax - descriptorMin,
    },
    routeProgressMeaning:
      "Bounded longitudinal local probe progress only. The progression coordinate is a deterministic normalized parameter over certified local transport support and does not represent target distance, cruise speed, or mission completion fraction.",
    routeTimeStatus: "bounded_local_segment_certified",
    nextEligibleProducts: ["mission_time_estimator"],
    claimBoundary: [
      "bounded route-time worldline over a local probe segment only",
      "coordinate-time schedule is a local light-crossing parameterization, not a target ETA",
      "not mission-time certified",
      "not max-speed certified",
      "not relativistic-advantage certified",
      "not viability-promotion evidence",
    ],
    falsifierConditions: [
      "certified_warp_worldline_missing",
      "certified_cruise_preflight_missing",
      "source_surface_mismatch_between_worldline_and_preflight",
      "chart_or_observer_mismatch_between_worldline_and_preflight",
      "route_progression_samples_missing_or_out_of_order",
      "route_progression_coordinate_time_nonmonotone",
      "route_progression_proper_time_nonmonotone",
      "route_progression_normalization_residual_exceeds_tolerance",
    ],
    nonClaims: [
      "not mission-time certified",
      "not max-speed certified",
      "not route ETA to a real target",
      "not relativistic-advantage certified",
      "not viability-promotion evidence",
    ],
  };
};

export const isCertifiedWarpRouteTimeWorldlineContract = (
  value: unknown,
): value is WarpRouteTimeWorldlineContractV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.contractVersion !== WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION) {
    return false;
  }
  if (record.status !== "bounded_route_time_ready") return false;
  if (record.certified !== true) return false;
  if (record.sourceWorldlineContractVersion !== WARP_WORLDLINE_CONTRACT_VERSION) {
    return false;
  }
  if (
    record.sourceCruisePreflightContractVersion !==
    WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION
  ) {
    return false;
  }
  if (record.observerFamily !== "ship_centerline_local_comoving") return false;
  if (record.routeModelId !== "nhm2_bounded_local_probe_lambda") return false;
  if (record.routeParameterName !== "lambda") return false;
  if (record.routeTimeStatus !== "bounded_local_segment_certified") return false;
  if (record.sourceSampleGeometryFamilyId !== "nhm2_centerline_shell_cross") {
    return false;
  }
  if (record.sampleFamilyAdequacy !== "adequate_for_bounded_cruise_preflight") {
    return false;
  }
  if (record.transportInformativenessStatus !== "descriptor_informative_local_only") {
    return false;
  }
  if (
    record.transportVariationStatus !== "descriptor_varied_dtau_flat" &&
    record.transportVariationStatus !== "descriptor_and_dtau_varied"
  ) {
    return false;
  }
  if (
    typeof record.routeModelMeaning !== "string" ||
    !record.routeModelMeaning.length ||
    typeof record.routeParameterMeaning !== "string" ||
    !record.routeParameterMeaning.length ||
    typeof record.routeProgressMeaning !== "string" ||
    !record.routeProgressMeaning.length
  ) {
    return false;
  }

  const sourceSurface = record.sourceSurface as Record<string, unknown> | undefined;
  if (!sourceSurface) return false;
  if (sourceSurface.surfaceId !== "nhm2_metric_local_comoving_transport_cross") return false;
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
  if (validityRegime.regimeId !== "nhm2_bounded_route_time_local_probe") return false;
  if (validityRegime.bounded !== true) return false;
  if (validityRegime.chartFixed !== true) return false;
  if (validityRegime.observerDefined !== true) return false;
  if (validityRegime.localComovingOnly !== true) return false;
  if (validityRegime.targetDistanceCoupled !== false) return false;
  if (validityRegime.missionTimeCertified !== false) return false;
  if (validityRegime.routeEtaCertified !== false) return false;
  if (validityRegime.failClosedOutsideRegime !== true) return false;

  const progressionSampleCount = toFiniteNumber(record.progressionSampleCount);
  if (progressionSampleCount == null) return false;
  if (record.representativeProgressionSampleId !== "centerline_center") return false;
  if (!matchesTuple(record.nextEligibleProducts, ["mission_time_estimator"])) return false;

  const progressionSamples = Array.isArray(record.progressionSamples)
    ? record.progressionSamples
    : null;
  if (!progressionSamples) return false;
  if (progressionSamples.length !== WARP_ROUTE_TIME_WORLDLINE_SAMPLE_ORDER.length) return false;
  if (progressionSamples.length !== progressionSampleCount) return false;

  let previousLambda = -Infinity;
  let previousCoordinateTime = -Infinity;
  let previousProperTime = -Infinity;
  let previousDtauDt = 0;
  let previousSampleCoordinateTime = 0;
  const descriptorValues: number[] = [];

  for (let index = 0; index < progressionSamples.length; index += 1) {
    const sample = progressionSamples[index] as Record<string, unknown>;
    if (toFiniteNumber(sample.progressionIndex) !== index) return false;
    if (sample.sourceSampleId !== WARP_ROUTE_TIME_WORLDLINE_SAMPLE_ORDER[index]) {
      return false;
    }
    const lambda = toFiniteNumber(sample.routeParameterValue);
    const coordinateTime = toFiniteNumber(sample.coordinateTime_s);
    const coordinateTimeIncrement = toFiniteNumber(sample.coordinateTimeIncrement_s);
    const properTimeIncrement = toFiniteNumber(sample.properTimeIncrement_s);
    const cumulativeProperTime = toFiniteNumber(sample.cumulativeProperTime_s);
    const boundedProgressCoordinate = toFiniteNumber(sample.boundedProgressCoordinate_m);
    const localDescriptorValue = toFiniteNumber(sample.localDescriptorValue);
    const dtauDt = toFiniteNumber(sample.dtau_dt);
    const normalizationResidual = toFiniteNumber(sample.normalizationResidual);
    if (
      lambda == null ||
      coordinateTime == null ||
      coordinateTimeIncrement == null ||
      properTimeIncrement == null ||
      cumulativeProperTime == null ||
      boundedProgressCoordinate == null ||
      localDescriptorValue == null ||
      dtauDt == null ||
      normalizationResidual == null
    ) {
      return false;
    }
    if (
      !(lambda >= previousLambda - ROUTE_TIME_MONOTONIC_TOLERANCE) ||
      !(coordinateTime >= previousCoordinateTime - ROUTE_TIME_MONOTONIC_TOLERANCE) ||
      !(cumulativeProperTime >= previousProperTime - ROUTE_TIME_MONOTONIC_TOLERANCE) ||
      !(boundedProgressCoordinate >= 0) ||
      !(dtauDt > 0) ||
      !(Math.abs(normalizationResidual) <= WARP_WORLDLINE_NORMALIZATION_TOLERANCE)
    ) {
      return false;
    }
    if (sample.localDescriptorUnits !== "dimensionless") return false;
    if (sample.provenanceClass !== "solve_backed") return false;
    if (sample.transportProvenance !== "solve_backed_shift_vector_sample") return false;
    if (!finiteVec3(sample.position_m)) return false;
    if (!finiteVec3(sample.betaCoord)) return false;
    if (!finiteVec3(sample.effectiveTransportVelocityCoord)) return false;

    const recomputedDescriptor = computeWarpCruiseEnvelopePreflightQuantity({
      effectiveTransportVelocityCoord:
        sample.effectiveTransportVelocityCoord as WarpWorldlineVec3,
    });
    if (!nearlyEqual(localDescriptorValue, recomputedDescriptor, 1e-12)) return false;

    if (index === 0) {
      if (!nearlyEqual(lambda, 0, 1e-12)) return false;
      if (!nearlyEqual(coordinateTime, 0, 1e-12)) return false;
      if (!nearlyEqual(coordinateTimeIncrement, 0, 1e-12)) return false;
      if (!nearlyEqual(properTimeIncrement, 0, 1e-12)) return false;
      if (!nearlyEqual(cumulativeProperTime, 0, 1e-12)) return false;
    } else {
      const expectedCoordinateIncrement = coordinateTime - previousSampleCoordinateTime;
      const expectedProperIncrement =
        0.5 * (previousDtauDt + dtauDt) * expectedCoordinateIncrement;
      if (!nearlyEqual(coordinateTimeIncrement, expectedCoordinateIncrement, 1e-12)) {
        return false;
      }
      if (!nearlyEqual(properTimeIncrement, expectedProperIncrement, 1e-12)) {
        return false;
      }
    }

    descriptorValues.push(localDescriptorValue);
    previousLambda = lambda;
    previousCoordinateTime = coordinateTime;
    previousProperTime = cumulativeProperTime;
    previousDtauDt = dtauDt;
    previousSampleCoordinateTime = coordinateTime;
  }

  if (!nearlyEqual(previousLambda, 1, 1e-12)) return false;

  const coordinateSummary = record.coordinateTimeSummary as Record<string, unknown> | undefined;
  if (!coordinateSummary) return false;
  const coordinateStart = toFiniteNumber(coordinateSummary.start);
  const coordinateEnd = toFiniteNumber(coordinateSummary.end);
  const coordinateSpan = toFiniteNumber(coordinateSummary.span);
  if (
    coordinateStart == null ||
    coordinateEnd == null ||
    coordinateSpan == null ||
    coordinateSummary.monotone !== true ||
    coordinateSummary.units !== "s" ||
    coordinateSummary.meaning !== "bounded_local_probe_light_crossing_coordinate_time" ||
    !nearlyEqual(coordinateStart, 0, 1e-12) ||
    !nearlyEqual(coordinateEnd, previousCoordinateTime, 1e-12) ||
    !nearlyEqual(coordinateSpan, coordinateEnd - coordinateStart, 1e-12)
  ) {
    return false;
  }

  const properSummary = record.properTimeSummary as Record<string, unknown> | undefined;
  if (!properSummary) return false;
  const properStart = toFiniteNumber(properSummary.start);
  const properEnd = toFiniteNumber(properSummary.end);
  const properSpan = toFiniteNumber(properSummary.span);
  if (
    properStart == null ||
    properEnd == null ||
    properSpan == null ||
    properSummary.monotone !== true ||
    properSummary.positivityRequired !== true ||
    properSummary.units !== "s" ||
    properSummary.meaning !== "cumulative_ship_proper_time_over_bounded_local_probe" ||
    !nearlyEqual(properStart, 0, 1e-12) ||
    !nearlyEqual(properEnd, previousProperTime, 1e-12) ||
    !nearlyEqual(properSpan, properEnd - properStart, 1e-12)
  ) {
    return false;
  }

  const descriptorSummary =
    record.descriptorScheduleSummary as Record<string, unknown> | undefined;
  if (!descriptorSummary) return false;
  const descriptorRepresentative = toFiniteNumber(descriptorSummary.representative);
  const descriptorMin = toFiniteNumber(descriptorSummary.min);
  const descriptorMax = toFiniteNumber(descriptorSummary.max);
  const descriptorSpread = toFiniteNumber(descriptorSummary.spread);
  if (
    descriptorSummary.quantityId !== "bounded_local_transport_descriptor_norm" ||
    descriptorSummary.quantityUnits !== "dimensionless" ||
    typeof descriptorSummary.quantityMeaning !== "string" ||
    !descriptorSummary.quantityMeaning.length ||
    descriptorRepresentative == null ||
    descriptorMin == null ||
    descriptorMax == null ||
    descriptorSpread == null
  ) {
    return false;
  }
  const representativeSample =
    progressionSamples.find(
      (entry) =>
        (entry as Record<string, unknown>).sourceSampleId === "centerline_center",
    ) ?? null;
  const representativeValue =
    representativeSample == null
      ? null
      : toFiniteNumber(
          (representativeSample as Record<string, unknown>).localDescriptorValue,
        );
  if (
    representativeValue == null ||
    !nearlyEqual(descriptorRepresentative, representativeValue, 1e-12) ||
    !nearlyEqual(descriptorMin, Math.min(...descriptorValues), 1e-12) ||
    !nearlyEqual(descriptorMax, Math.max(...descriptorValues), 1e-12) ||
    !nearlyEqual(descriptorSpread, descriptorMax - descriptorMin, 1e-12)
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
  if (!claimBoundary || !falsifierConditions || !nonClaims) return false;
  if (!nonClaims.includes("not mission-time certified")) return false;
  if (!nonClaims.includes("not max-speed certified")) return false;

  return true;
};
