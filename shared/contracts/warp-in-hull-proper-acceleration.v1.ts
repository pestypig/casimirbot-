const SPEED_OF_LIGHT_MPS = 299_792_458;
const STANDARD_GRAVITY_MPS2 = 9.80665;

export const WARP_IN_HULL_PROPER_ACCELERATION_CONTRACT_VERSION =
  "warp_in_hull_proper_acceleration/v1";

export const WARP_IN_HULL_PROPER_ACCELERATION_SAMPLE_ORDER = [
  "cabin_center",
  "cabin_fore",
  "cabin_aft",
  "cabin_port",
  "cabin_starboard",
  "cabin_dorsal",
  "cabin_ventral",
] as const;

export type WarpInHullProperAccelerationVec3 = [number, number, number];
export type WarpInHullProperAccelerationSampleRole =
  (typeof WARP_IN_HULL_PROPER_ACCELERATION_SAMPLE_ORDER)[number];
export type WarpInHullProperAccelerationStatus =
  "bounded_in_hull_profile_certified";
export type WarpInHullProperAccelerationObserverFamily =
  "eulerian_comoving_cabin";
export type WarpInHullProperAccelerationResolutionAdequacyStatus =
  | "adequate_constant_lapse_zero_profile"
  | "adequate_direct_brick_profile";
export type WarpInHullProperAccelerationProfileInterpretation =
  | "observer_defined_zero_profile_in_constant_lapse_regime"
  | "observer_defined_direct_brick_profile";

export type WarpInHullProperAccelerationSourceSurface = {
  surfaceId: "nhm2_metric_in_hull_proper_acceleration_profile";
  producer: "server/energy-pipeline.ts";
  provenanceClass: "solve_backed";
  brickChannelSource: "gr_evolve_brick";
  accelerationField: "eulerian_accel_geom_*";
  metricT00Ref: string;
  metricT00Source: "metric";
  metricFamily: string;
  metricT00ContractStatus: "ok";
  chartContractStatus: "ok";
  brickStatus: "CERTIFIED";
  brickSolverStatus: "CERTIFIED";
};

export type WarpInHullProperAccelerationChart = {
  label: "comoving_cartesian";
  coordinateMap: string | null;
  chartFixed: true;
};

export type WarpInHullProperAccelerationSamplingGeometry = {
  familyId: "nhm2_cabin_cross";
  description: string;
  coordinateFrame: "comoving_cartesian";
  originDefinition: "ship_center";
  ordering: WarpInHullProperAccelerationSampleRole[];
  representativeSampleId: "cabin_center";
  axes: {
    centerline: WarpInHullProperAccelerationVec3;
    portStarboard: WarpInHullProperAccelerationVec3;
    dorsalVentral: WarpInHullProperAccelerationVec3;
  };
  offsets_m: {
    centerline: number;
    transverse: number;
    vertical: number;
    interiorClearance: number;
  };
  samplePositions_m: Record<
    WarpInHullProperAccelerationSampleRole,
    WarpInHullProperAccelerationVec3
  >;
};

export type WarpInHullProperAccelerationSampleSummaryV1 = {
  sampleId: WarpInHullProperAccelerationSampleRole;
  sampleRole: WarpInHullProperAccelerationSampleRole;
  position_m: WarpInHullProperAccelerationVec3;
  properAccelerationGeomVector_per_m: WarpInHullProperAccelerationVec3;
  properAccelerationGeomMagnitude_per_m: number;
  properAccelerationMagnitude_mps2: number;
  properAccelerationMagnitude_g: number;
};

export type WarpInHullProperAccelerationProfileSummary = {
  representativeSampleId: "cabin_center";
  interpretation: WarpInHullProperAccelerationProfileInterpretation;
  min_mps2: number;
  max_mps2: number;
  representative_mps2: number;
  spread_mps2: number;
  min_g: number;
  max_g: number;
  representative_g: number;
  spread_g: number;
};

export type WarpInHullProperAccelerationResolutionAdequacy = {
  status: WarpInHullProperAccelerationResolutionAdequacyStatus;
  criterionId: "direct_gr_evolve_brick_no_fallback_v1";
  criterionMeaning: string;
  brickDims: [number, number, number];
  voxelSize_m: [number, number, number];
  wholeBrickAccelerationAbsMax_per_m: number;
  wholeBrickGradientAbsMax_per_m: number;
  allSampleMagnitudesZero: boolean;
  expectedZeroProfileByModel: boolean;
  note: string;
};

export type WarpInHullProperAccelerationContractV1 = {
  contractVersion: typeof WARP_IN_HULL_PROPER_ACCELERATION_CONTRACT_VERSION;
  status: WarpInHullProperAccelerationStatus;
  certified: true;
  sourceSurface: WarpInHullProperAccelerationSourceSurface;
  chart: WarpInHullProperAccelerationChart;
  observerFamily: WarpInHullProperAccelerationObserverFamily;
  accelerationQuantityId: "experienced_proper_acceleration_magnitude";
  accelerationQuantityMeaning: string;
  accelerationUnits: "m/s^2";
  samplingGeometry: WarpInHullProperAccelerationSamplingGeometry;
  sampleCount: number;
  sampleSummaries: WarpInHullProperAccelerationSampleSummaryV1[];
  profileSummary: WarpInHullProperAccelerationProfileSummary;
  resolutionAdequacy: WarpInHullProperAccelerationResolutionAdequacy;
  fallbackUsed: false;
  claimBoundary: string[];
  falsifierConditions: string[];
  nonClaims: string[];
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const finitePositive = (value: unknown): value is number => {
  const parsed = toFiniteNumber(value);
  return parsed != null && parsed > 0;
};

const finiteNonNegative = (value: unknown): value is number => {
  const parsed = toFiniteNumber(value);
  return parsed != null && parsed >= 0;
};

const matchesTuple = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  expected.every((entry, index) => value[index] === entry);

const toVec3 = (value: unknown): WarpInHullProperAccelerationVec3 | null => {
  if (!Array.isArray(value) || value.length < 3) return null;
  const x = toFiniteNumber(value[0]);
  const y = toFiniteNumber(value[1]);
  const z = toFiniteNumber(value[2]);
  if (x == null || y == null || z == null) return null;
  return [x, y, z];
};

const isFiniteVec3 = (value: unknown): value is WarpInHullProperAccelerationVec3 =>
  toVec3(value) != null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const nearlyEqual = (lhs: number, rhs: number, tolerance = 1e-12): boolean =>
  Math.abs(lhs - rhs) <= tolerance;

const maxAbsFromMinMax = (min: unknown, max: unknown): number => {
  const parsedMin = Math.abs(toFiniteNumber(min) ?? 0);
  const parsedMax = Math.abs(toFiniteNumber(max) ?? 0);
  return Math.max(parsedMin, parsedMax);
};

export const properAccelerationGeomToMps2 = (valuePerM: number): number =>
  valuePerM * SPEED_OF_LIGHT_MPS * SPEED_OF_LIGHT_MPS;

export const properAccelerationMps2ToG = (valueMps2: number): number =>
  valueMps2 / STANDARD_GRAVITY_MPS2;

export const buildWarpInHullProperAccelerationContract = (args: {
  sourceSurface: WarpInHullProperAccelerationSourceSurface;
  chart: WarpInHullProperAccelerationChart;
  samplingGeometry: WarpInHullProperAccelerationSamplingGeometry;
  sampleSummaries: WarpInHullProperAccelerationSampleSummaryV1[];
  resolutionAdequacy: WarpInHullProperAccelerationResolutionAdequacy;
  claimBoundary?: string[];
  falsifierConditions?: string[];
  nonClaims?: string[];
}): WarpInHullProperAccelerationContractV1 | null => {
  if (!args || typeof args !== "object") return null;
  if (args.chart.label !== "comoving_cartesian" || args.chart.chartFixed !== true) {
    return null;
  }
  if (
    args.sourceSurface.provenanceClass !== "solve_backed" ||
    args.sourceSurface.brickChannelSource !== "gr_evolve_brick" ||
    args.sourceSurface.accelerationField !== "eulerian_accel_geom_*" ||
    args.sourceSurface.metricT00Source !== "metric" ||
    args.sourceSurface.metricT00ContractStatus !== "ok" ||
    args.sourceSurface.chartContractStatus !== "ok" ||
    args.sourceSurface.brickStatus !== "CERTIFIED" ||
    args.sourceSurface.brickSolverStatus !== "CERTIFIED"
  ) {
    return null;
  }
  if (
    args.samplingGeometry.familyId !== "nhm2_cabin_cross" ||
    args.samplingGeometry.coordinateFrame !== "comoving_cartesian" ||
    args.samplingGeometry.originDefinition !== "ship_center" ||
    args.samplingGeometry.representativeSampleId !== "cabin_center"
  ) {
    return null;
  }
  if (
    args.samplingGeometry.ordering.join(",") !==
    WARP_IN_HULL_PROPER_ACCELERATION_SAMPLE_ORDER.join(",")
  ) {
    return null;
  }

  const sampleSummaries = args.sampleSummaries.map((entry) => ({
    ...entry,
    position_m: [...entry.position_m] as WarpInHullProperAccelerationVec3,
    properAccelerationGeomVector_per_m: [
      ...entry.properAccelerationGeomVector_per_m,
    ] as WarpInHullProperAccelerationVec3,
  }));
  if (sampleSummaries.length !== WARP_IN_HULL_PROPER_ACCELERATION_SAMPLE_ORDER.length) {
    return null;
  }
  if (
    sampleSummaries.some(
      (entry, index) =>
        entry.sampleId !== WARP_IN_HULL_PROPER_ACCELERATION_SAMPLE_ORDER[index] ||
        entry.sampleRole !== entry.sampleId ||
        !isFiniteVec3(entry.position_m) ||
        !isFiniteVec3(entry.properAccelerationGeomVector_per_m) ||
        !finiteNonNegative(entry.properAccelerationGeomMagnitude_per_m) ||
        !finiteNonNegative(entry.properAccelerationMagnitude_mps2) ||
        !finiteNonNegative(entry.properAccelerationMagnitude_g),
    )
  ) {
    return null;
  }

  const representativeSample =
    sampleSummaries.find((entry) => entry.sampleId === "cabin_center") ?? null;
  if (!representativeSample) return null;

  const magnitudesMps2 = sampleSummaries.map(
    (entry) => entry.properAccelerationMagnitude_mps2,
  );
  const magnitudesG = sampleSummaries.map((entry) => entry.properAccelerationMagnitude_g);
  const minMps2 = Math.min(...magnitudesMps2);
  const maxMps2 = Math.max(...magnitudesMps2);
  const minG = Math.min(...magnitudesG);
  const maxG = Math.max(...magnitudesG);
  if (
    args.resolutionAdequacy.status === "adequate_constant_lapse_zero_profile" &&
    (!args.resolutionAdequacy.allSampleMagnitudesZero ||
      !args.resolutionAdequacy.expectedZeroProfileByModel ||
      !nearlyEqual(args.resolutionAdequacy.wholeBrickAccelerationAbsMax_per_m, 0) ||
      !nearlyEqual(args.resolutionAdequacy.wholeBrickGradientAbsMax_per_m, 0) ||
      !nearlyEqual(maxMps2, 0) ||
      !nearlyEqual(maxG, 0))
  ) {
    return null;
  }
  if (
    args.resolutionAdequacy.status === "adequate_direct_brick_profile" &&
    !(
      args.resolutionAdequacy.wholeBrickAccelerationAbsMax_per_m > 0 ||
      maxMps2 > 0 ||
      maxG > 0
    )
  ) {
    return null;
  }

  const interpretation =
    args.resolutionAdequacy.status === "adequate_constant_lapse_zero_profile"
      ? "observer_defined_zero_profile_in_constant_lapse_regime"
      : "observer_defined_direct_brick_profile";

  const claimBoundary = args.claimBoundary ?? [
    "bounded observer-defined in-hull proper acceleration only",
    "solve-backed direct brick Eulerian-acceleration path only",
    "not a curvature-gravity certificate",
    "not a comfort or safety certification by itself",
  ];
  const falsifierConditions = args.falsifierConditions ?? [
    "direct_gr_evolve_brick_channels_missing",
    "brick_status_not_certified",
    "brick_solver_status_not_certified",
    "metric_t00_source_not_metric",
    "reference_only_shift_lapse_family_selected",
    "fallback_used_in_certified_mode",
    "under_resolved_direct_brick_profile",
  ];
  const nonClaims = args.nonClaims ?? [
    "not curvature-gravity certified",
    "not comfort-certified",
    "not safety-certified",
    "not viability-promotion evidence",
    "not source-mechanism promotion",
  ];

  return {
    contractVersion: WARP_IN_HULL_PROPER_ACCELERATION_CONTRACT_VERSION,
    status: "bounded_in_hull_profile_certified",
    certified: true,
    sourceSurface: { ...args.sourceSurface },
    chart: { ...args.chart },
    observerFamily: "eulerian_comoving_cabin",
    accelerationQuantityId: "experienced_proper_acceleration_magnitude",
    accelerationQuantityMeaning:
      "Proper-acceleration magnitude experienced by Eulerian observers fixed to bounded cabin sample points in the comoving Cartesian chart. The solve-backed quantity is taken directly from brick-resolved eulerian_accel_geom_i = partial_i alpha / alpha and converted to SI via c^2. This is observer-defined experienced acceleration, not curvature gravity.",
    accelerationUnits: "m/s^2",
    samplingGeometry: {
      ...args.samplingGeometry,
      ordering: [...args.samplingGeometry.ordering],
      axes: {
        centerline: [...args.samplingGeometry.axes.centerline],
        portStarboard: [...args.samplingGeometry.axes.portStarboard],
        dorsalVentral: [...args.samplingGeometry.axes.dorsalVentral],
      },
      offsets_m: { ...args.samplingGeometry.offsets_m },
      samplePositions_m: Object.fromEntries(
        Object.entries(args.samplingGeometry.samplePositions_m).map(([key, value]) => [
          key,
          [...value],
        ]),
      ) as WarpInHullProperAccelerationSamplingGeometry["samplePositions_m"],
    },
    sampleCount: sampleSummaries.length,
    sampleSummaries,
    profileSummary: {
      representativeSampleId: "cabin_center",
      interpretation,
      min_mps2: minMps2,
      max_mps2: maxMps2,
      representative_mps2: representativeSample.properAccelerationMagnitude_mps2,
      spread_mps2: maxMps2 - minMps2,
      min_g: minG,
      max_g: maxG,
      representative_g: representativeSample.properAccelerationMagnitude_g,
      spread_g: maxG - minG,
    },
    resolutionAdequacy: {
      ...args.resolutionAdequacy,
      brickDims: [...args.resolutionAdequacy.brickDims] as [number, number, number],
      voxelSize_m: [...args.resolutionAdequacy.voxelSize_m] as [number, number, number],
    },
    fallbackUsed: false,
    claimBoundary: [...claimBoundary],
    falsifierConditions: [...falsifierConditions],
    nonClaims: [...nonClaims],
  };
};

export const isCertifiedWarpInHullProperAccelerationContract = (
  value: unknown,
): value is WarpInHullProperAccelerationContractV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (
    record.contractVersion !== WARP_IN_HULL_PROPER_ACCELERATION_CONTRACT_VERSION ||
    record.status !== "bounded_in_hull_profile_certified" ||
    record.certified !== true ||
    record.observerFamily !== "eulerian_comoving_cabin" ||
    record.accelerationQuantityId !== "experienced_proper_acceleration_magnitude" ||
    record.accelerationUnits !== "m/s^2" ||
    record.fallbackUsed !== false
  ) {
    return false;
  }

  const sourceSurface = record.sourceSurface as Record<string, unknown> | undefined;
  if (!sourceSurface) return false;
  if (
    sourceSurface.surfaceId !== "nhm2_metric_in_hull_proper_acceleration_profile" ||
    sourceSurface.producer !== "server/energy-pipeline.ts" ||
    sourceSurface.provenanceClass !== "solve_backed" ||
    sourceSurface.brickChannelSource !== "gr_evolve_brick" ||
    sourceSurface.accelerationField !== "eulerian_accel_geom_*" ||
    sourceSurface.metricT00Source !== "metric" ||
    sourceSurface.metricT00ContractStatus !== "ok" ||
    sourceSurface.chartContractStatus !== "ok" ||
    sourceSurface.brickStatus !== "CERTIFIED" ||
    sourceSurface.brickSolverStatus !== "CERTIFIED"
  ) {
    return false;
  }
  if (typeof sourceSurface.metricT00Ref !== "string" || sourceSurface.metricT00Ref.length === 0) {
    return false;
  }
  if (typeof sourceSurface.metricFamily !== "string" || sourceSurface.metricFamily.length === 0) {
    return false;
  }

  const chart = record.chart as Record<string, unknown> | undefined;
  if (!chart) return false;
  if (
    chart.label !== "comoving_cartesian" ||
    chart.chartFixed !== true ||
    (chart.coordinateMap != null && typeof chart.coordinateMap !== "string")
  ) {
    return false;
  }

  const samplingGeometry = record.samplingGeometry as Record<string, unknown> | undefined;
  if (!samplingGeometry) return false;
  if (
    samplingGeometry.familyId !== "nhm2_cabin_cross" ||
    samplingGeometry.coordinateFrame !== "comoving_cartesian" ||
    samplingGeometry.originDefinition !== "ship_center" ||
    samplingGeometry.representativeSampleId !== "cabin_center" ||
    !matchesTuple(
      samplingGeometry.ordering,
      WARP_IN_HULL_PROPER_ACCELERATION_SAMPLE_ORDER,
    )
  ) {
    return false;
  }
  const axes = samplingGeometry.axes as Record<string, unknown> | undefined;
  const offsets = samplingGeometry.offsets_m as Record<string, unknown> | undefined;
  const samplePositions =
    samplingGeometry.samplePositions_m as Record<string, unknown> | undefined;
  if (!axes || !offsets || !samplePositions) return false;
  if (
    !isFiniteVec3(axes.centerline) ||
    !isFiniteVec3(axes.portStarboard) ||
    !isFiniteVec3(axes.dorsalVentral) ||
    !finitePositive(offsets.centerline) ||
    !finitePositive(offsets.transverse) ||
    !finitePositive(offsets.vertical) ||
    !finitePositive(offsets.interiorClearance)
  ) {
    return false;
  }
  for (const sampleId of WARP_IN_HULL_PROPER_ACCELERATION_SAMPLE_ORDER) {
    if (!isFiniteVec3(samplePositions[sampleId])) return false;
  }

  const sampleCount = toFiniteNumber(record.sampleCount);
  if (sampleCount !== WARP_IN_HULL_PROPER_ACCELERATION_SAMPLE_ORDER.length) return false;
  const sampleSummaries = Array.isArray(record.sampleSummaries)
    ? (record.sampleSummaries as Record<string, unknown>[])
    : null;
  if (!sampleSummaries || sampleSummaries.length !== sampleCount) return false;
  for (let index = 0; index < sampleSummaries.length; index += 1) {
    const sample = sampleSummaries[index];
    const expectedId = WARP_IN_HULL_PROPER_ACCELERATION_SAMPLE_ORDER[index];
    if (
      sample.sampleId !== expectedId ||
      sample.sampleRole !== expectedId ||
      !isFiniteVec3(sample.position_m) ||
      !isFiniteVec3(sample.properAccelerationGeomVector_per_m) ||
      !finiteNonNegative(sample.properAccelerationGeomMagnitude_per_m) ||
      !finiteNonNegative(sample.properAccelerationMagnitude_mps2) ||
      !finiteNonNegative(sample.properAccelerationMagnitude_g)
    ) {
      return false;
    }
  }

  const profileSummary = record.profileSummary as Record<string, unknown> | undefined;
  if (!profileSummary) return false;
  if (
    profileSummary.representativeSampleId !== "cabin_center" ||
    (profileSummary.interpretation !==
      "observer_defined_zero_profile_in_constant_lapse_regime" &&
      profileSummary.interpretation !== "observer_defined_direct_brick_profile") ||
    !finiteNonNegative(profileSummary.min_mps2) ||
    !finiteNonNegative(profileSummary.max_mps2) ||
    !finiteNonNegative(profileSummary.representative_mps2) ||
    !finiteNonNegative(profileSummary.spread_mps2) ||
    !finiteNonNegative(profileSummary.min_g) ||
    !finiteNonNegative(profileSummary.max_g) ||
    !finiteNonNegative(profileSummary.representative_g) ||
    !finiteNonNegative(profileSummary.spread_g)
  ) {
    return false;
  }
  if (
    profileSummary.min_mps2 > profileSummary.max_mps2 ||
    profileSummary.representative_mps2 < profileSummary.min_mps2 ||
    profileSummary.representative_mps2 > profileSummary.max_mps2 ||
    !nearlyEqual(
      profileSummary.spread_mps2,
      profileSummary.max_mps2 - profileSummary.min_mps2,
    ) ||
    profileSummary.min_g > profileSummary.max_g ||
    profileSummary.representative_g < profileSummary.min_g ||
    profileSummary.representative_g > profileSummary.max_g ||
    !nearlyEqual(profileSummary.spread_g, profileSummary.max_g - profileSummary.min_g)
  ) {
    return false;
  }

  const resolutionAdequacy =
    record.resolutionAdequacy as Record<string, unknown> | undefined;
  if (!resolutionAdequacy) return false;
  if (
    (resolutionAdequacy.status !== "adequate_constant_lapse_zero_profile" &&
      resolutionAdequacy.status !== "adequate_direct_brick_profile") ||
    resolutionAdequacy.criterionId !== "direct_gr_evolve_brick_no_fallback_v1" ||
    typeof resolutionAdequacy.criterionMeaning !== "string"
  ) {
    return false;
  }
  const brickDims = Array.isArray(resolutionAdequacy.brickDims)
    ? resolutionAdequacy.brickDims.map((entry) => toFiniteNumber(entry))
    : null;
  const voxelSize = Array.isArray(resolutionAdequacy.voxelSize_m)
    ? resolutionAdequacy.voxelSize_m.map((entry) => toFiniteNumber(entry))
    : null;
  if (
    !brickDims ||
    brickDims.length !== 3 ||
    brickDims.some((entry) => entry == null || entry <= 0) ||
    !voxelSize ||
    voxelSize.length !== 3 ||
    voxelSize.some((entry) => entry == null || entry <= 0) ||
    !finiteNonNegative(resolutionAdequacy.wholeBrickAccelerationAbsMax_per_m) ||
    !finiteNonNegative(resolutionAdequacy.wholeBrickGradientAbsMax_per_m) ||
    typeof resolutionAdequacy.allSampleMagnitudesZero !== "boolean" ||
    typeof resolutionAdequacy.expectedZeroProfileByModel !== "boolean" ||
    typeof resolutionAdequacy.note !== "string"
  ) {
    return false;
  }
  if (
    resolutionAdequacy.status === "adequate_constant_lapse_zero_profile" &&
    (!resolutionAdequacy.allSampleMagnitudesZero ||
      !resolutionAdequacy.expectedZeroProfileByModel ||
      !nearlyEqual(resolutionAdequacy.wholeBrickAccelerationAbsMax_per_m, 0) ||
      !nearlyEqual(resolutionAdequacy.wholeBrickGradientAbsMax_per_m, 0) ||
      !nearlyEqual(profileSummary.max_mps2, 0) ||
      !nearlyEqual(profileSummary.max_g, 0))
  ) {
    return false;
  }

  if (!isStringArray(record.claimBoundary) || !isStringArray(record.falsifierConditions)) {
    return false;
  }
  if (!isStringArray(record.nonClaims)) return false;

  return true;
};

export const summarizeInHullProperAccelerationChannelExtrema = (args: {
  accelMagMin: unknown;
  accelMagMax: unknown;
  alphaGradXMin?: unknown;
  alphaGradXMax?: unknown;
  alphaGradYMin?: unknown;
  alphaGradYMax?: unknown;
  alphaGradZMin?: unknown;
  alphaGradZMax?: unknown;
}): {
  wholeBrickAccelerationAbsMax_per_m: number;
  wholeBrickGradientAbsMax_per_m: number;
} => ({
  wholeBrickAccelerationAbsMax_per_m: maxAbsFromMinMax(args.accelMagMin, args.accelMagMax),
  wholeBrickGradientAbsMax_per_m: Math.max(
    maxAbsFromMinMax(args.alphaGradXMin, args.alphaGradXMax),
    maxAbsFromMinMax(args.alphaGradYMin, args.alphaGradYMax),
    maxAbsFromMinMax(args.alphaGradZMin, args.alphaGradZMax),
  ),
});
