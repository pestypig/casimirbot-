const SPEED_OF_LIGHT_MPS = 299_792_458;

export const WARP_WORLDLINE_CONTRACT_VERSION = "warp_worldline_contract/v1";
export const WARP_WORLDLINE_NORMALIZATION_TOLERANCE = 1e-9;
export const WARP_WORLDLINE_DTAU_VARIATION_TOLERANCE = 1e-12;
export const WARP_WORLDLINE_VECTOR_VARIATION_TOLERANCE = 1e-18;

export type WarpWorldlineVec3 = [number, number, number];
export type WarpWorldlineSourceModel = "warp_worldline_local_comoving";
export type WarpWorldlineSampleRole =
  | "centerline_aft"
  | "centerline_center"
  | "centerline_fore"
  | "shell_aft"
  | "shell_fore"
  | "shell_port"
  | "shell_starboard"
  | "shell_dorsal"
  | "shell_ventral";
export type WarpWorldlineTransportProvenance = "solve_backed_shift_vector_sample";

export type WarpWorldlineStatus = "bounded_solve_backed";
export type WarpWorldlineTransportVariationStatus =
  | "numerically_flat"
  | "descriptor_varied_dtau_flat"
  | "descriptor_and_dtau_varied";
export type WarpWorldlineTransportInformativenessStatus =
  | "structurally_valid_but_flat"
  | "descriptor_informative_local_only";
export type WarpWorldlineSampleFamilyAdequacy =
  | "insufficiently_differentiated"
  | "adequate_for_bounded_cruise_preflight";
export type WarpWorldlineCertifiedTransportMeaning =
  "bounded_local_shift_descriptor_gradient_only";
export type WarpWorldlineEligibleNextProduct = "bounded_cruise_envelope_preflight";

export const WARP_WORLDLINE_SAMPLE_ORDER: WarpWorldlineSampleRole[] = [
  "centerline_aft",
  "centerline_center",
  "centerline_fore",
  "shell_aft",
  "shell_fore",
  "shell_port",
  "shell_starboard",
  "shell_dorsal",
  "shell_ventral",
];

export type WarpWorldlineSourceSurface = {
  surfaceId: "nhm2_metric_local_comoving_transport_cross";
  producer: "server/energy-pipeline.ts";
  provenanceClass: "solve_backed";
  transportVectorSource: "warp.solveBackedTransportSampleFamily";
  transportVectorField: "shiftVectorField.evaluateShiftVector";
  metricT00Ref: string;
  metricT00Source: "metric";
  metricFamily: string;
  metricT00ContractStatus: "ok";
  chartContractStatus: "ok";
};

export type WarpWorldlineChart = {
  label: string;
  coordinateMap: string | null;
  chartFixed: true;
};

export type WarpWorldlineValidityRegime = {
  regimeId: "nhm2_local_comoving_shell_cross";
  bounded: true;
  chartFixed: true;
  observerDefined: true;
  failClosedOutsideRegime: true;
  routeTimeCertified: false;
  description: string;
  allowedSourceModels: ["warp_worldline_local_comoving"];
  deferredSourceModels: ["warp_worldline_route_time"];
  restrictions: string[];
};

export type WarpWorldlineSampleGeometry = {
  familyId: "nhm2_centerline_shell_cross";
  description: string;
  coordinateFrame: "comoving_cartesian";
  originDefinition: "ship_center";
  ordering: WarpWorldlineSampleRole[];
  representativeSampleId: "centerline_center";
  axes: {
    centerline: WarpWorldlineVec3;
    portStarboard: WarpWorldlineVec3;
    dorsalVentral: WarpWorldlineVec3;
  };
  offsets_m: {
    centerline: number;
    shellLongitudinal: number;
    shellTransverse: number;
    shellVertical: number;
    shellClearance: number;
  };
};

export type WarpWorldlineTransportInterpretation = {
  coordinateVelocityFrame: "chart_fixed_comoving";
  coordinateVelocityInterpretation: "zero_by_chart_choice";
  transportTerm: "solve_backed_shift_term";
  effectiveTransportInterpretation: "bounded_local_comoving_descriptor_not_speed";
  certifiedSpeedMeaning: false;
  note: string;
};

export type WarpWorldlineTransportVariation = {
  transportVariationStatus: WarpWorldlineTransportVariationStatus;
  dtauDtSpread: {
    absolute: number;
    flatWithinTolerance: boolean;
  };
  effectiveTransportSpread: {
    maxPairwiseL2: number;
    minNorm: number;
    maxNorm: number;
    flatWithinTolerance: boolean;
  };
  betaSpread: {
    maxPairwiseL2: number;
    minNorm: number;
    maxNorm: number;
    flatWithinTolerance: boolean;
  };
  variationTolerance: {
    dtauDtAbsolute: number;
    effectiveTransportVectorL2: number;
    betaVectorL2: number;
  };
  flatWithinTolerance: boolean;
  flatnessReason: string;
};

export type WarpWorldlineSampleV1 = {
  sampleId: WarpWorldlineSampleRole;
  sampleRole: WarpWorldlineSampleRole;
  sourceModel: WarpWorldlineSourceModel;
  transportProvenance: WarpWorldlineTransportProvenance;
  coordinateTime_s: number;
  position_m: WarpWorldlineVec3;
  coordinateVelocity: WarpWorldlineVec3;
  coordinateVelocityUnits: "m/s";
  betaCoord: WarpWorldlineVec3;
  effectiveTransportVelocityCoord: WarpWorldlineVec3;
  dtau_dt: number;
  normalizationResidual: number;
};

export type WarpWorldlineContractV1 = {
  contractVersion: typeof WARP_WORLDLINE_CONTRACT_VERSION;
  status: WarpWorldlineStatus;
  certified: true;
  sourceSurface: WarpWorldlineSourceSurface;
  chart: WarpWorldlineChart;
  observerFamily: "ship_centerline_local_comoving";
  validityRegime: WarpWorldlineValidityRegime;
  sampleGeometry: WarpWorldlineSampleGeometry;
  sampleCount: number;
  representativeSampleId: "centerline_center";
  transportInterpretation: WarpWorldlineTransportInterpretation;
  transportVariation: WarpWorldlineTransportVariation;
  transportInformativenessStatus: WarpWorldlineTransportInformativenessStatus;
  sampleFamilyAdequacy: WarpWorldlineSampleFamilyAdequacy;
  flatnessInterpretation: string;
  certifiedTransportMeaning: WarpWorldlineCertifiedTransportMeaning;
  eligibleNextProducts: WarpWorldlineEligibleNextProduct[];
  nextRequiredUpgrade: string;
  samples: WarpWorldlineSampleV1[];
  timeCoordinateName: "t";
  positionCoordinates: ["x", "y", "z"];
  coordinateVelocity: WarpWorldlineVec3;
  coordinateVelocityUnits: "m/s";
  effectiveTransportVelocityCoord: WarpWorldlineVec3;
  dtau_dt: {
    representative: number;
    min: number;
    max: number;
    units: "dimensionless";
    positivityRequired: true;
  };
  normalizationResidual: {
    representative: number;
    maxAbs: number;
    tolerance: number;
    relation: "alpha^2 - gamma_ij(v^i+beta^i)(v^j+beta^j) - (d tau / dt)^2";
  };
  claimBoundary: string[];
  falsifierConditions: string[];
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const toWarpWorldlineVec3 = (value: unknown): WarpWorldlineVec3 | null => {
  if (!Array.isArray(value) || value.length < 3) return null;
  const x = toFiniteNumber(value[0]);
  const y = toFiniteNumber(value[1]);
  const z = toFiniteNumber(value[2]);
  if (x == null || y == null || z == null) return null;
  return [x, y, z];
};

const finiteVec3 = (value: unknown): value is WarpWorldlineVec3 =>
  toWarpWorldlineVec3(value) != null;

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

const nearlyEqual = (lhs: number, rhs: number, tolerance = 1e-12): boolean =>
  Math.abs(lhs - rhs) <= tolerance;

const dotDiag = (metricDiag: WarpWorldlineVec3, vec: WarpWorldlineVec3): number =>
  metricDiag[0] * vec[0] * vec[0] +
  metricDiag[1] * vec[1] * vec[1] +
  metricDiag[2] * vec[2] * vec[2];

const vecNorm = (vec: WarpWorldlineVec3): number => Math.hypot(vec[0], vec[1], vec[2]);

const vecDistance = (lhs: WarpWorldlineVec3, rhs: WarpWorldlineVec3): number =>
  Math.hypot(lhs[0] - rhs[0], lhs[1] - rhs[1], lhs[2] - rhs[2]);

const maxPairwiseVecDistance = (vectors: WarpWorldlineVec3[]): number => {
  let maxDistance = 0;
  for (let i = 0; i < vectors.length; i += 1) {
    for (let j = i + 1; j < vectors.length; j += 1) {
      maxDistance = Math.max(maxDistance, vecDistance(vectors[i], vectors[j]));
    }
  }
  return maxDistance;
};

export const computeWarpWorldlineEffectiveTransportVelocityCoord = (args: {
  coordinateVelocity: WarpWorldlineVec3;
  betaCoord: WarpWorldlineVec3;
}): WarpWorldlineVec3 => {
  const velocityCoord: WarpWorldlineVec3 = [
    args.coordinateVelocity[0] / SPEED_OF_LIGHT_MPS,
    args.coordinateVelocity[1] / SPEED_OF_LIGHT_MPS,
    args.coordinateVelocity[2] / SPEED_OF_LIGHT_MPS,
  ];
  return [
    velocityCoord[0] + args.betaCoord[0],
    velocityCoord[1] + args.betaCoord[1],
    velocityCoord[2] + args.betaCoord[2],
  ];
};

export const computeWarpWorldlineDtauDt = (args: {
  alpha: number;
  gammaDiag: WarpWorldlineVec3;
  coordinateVelocity: WarpWorldlineVec3;
  betaCoord: WarpWorldlineVec3;
}): number | null => {
  const effectiveVelocity = computeWarpWorldlineEffectiveTransportVelocityCoord(args);
  const underRoot = args.alpha * args.alpha - dotDiag(args.gammaDiag, effectiveVelocity);
  return underRoot > 0 ? Math.sqrt(underRoot) : null;
};

export const computeWarpWorldlineNormalizationResidual = (args: {
  alpha: number;
  gammaDiag: WarpWorldlineVec3;
  coordinateVelocity: WarpWorldlineVec3;
  betaCoord: WarpWorldlineVec3;
  dtau_dt: number;
}): number => {
  const effectiveVelocity = computeWarpWorldlineEffectiveTransportVelocityCoord(args);
  const lhs = args.alpha * args.alpha - dotDiag(args.gammaDiag, effectiveVelocity);
  return lhs - args.dtau_dt * args.dtau_dt;
};

export const analyzeWarpWorldlineTransportVariation = (
  samples: WarpWorldlineSampleV1[],
): {
  transportVariation: WarpWorldlineTransportVariation;
  transportInformativenessStatus: WarpWorldlineTransportInformativenessStatus;
  sampleFamilyAdequacy: WarpWorldlineSampleFamilyAdequacy;
  flatnessInterpretation: string;
  certifiedTransportMeaning: WarpWorldlineCertifiedTransportMeaning;
  eligibleNextProducts: WarpWorldlineEligibleNextProduct[];
  nextRequiredUpgrade: string;
} | null => {
  if (!Array.isArray(samples) || samples.length === 0) return null;

  const dtauDtValues = samples.map((entry) => entry.dtau_dt);
  const betaVectors = samples.map((entry) => entry.betaCoord);
  const effectiveVectors = samples.map((entry) => entry.effectiveTransportVelocityCoord);
  const dtauDtMin = Math.min(...dtauDtValues);
  const dtauDtMax = Math.max(...dtauDtValues);
  const dtauDtSpreadAbs = dtauDtMax - dtauDtMin;
  const betaPairwiseSpread = maxPairwiseVecDistance(betaVectors);
  const effectivePairwiseSpread = maxPairwiseVecDistance(effectiveVectors);
  const betaNorms = betaVectors.map((entry) => vecNorm(entry));
  const effectiveNorms = effectiveVectors.map((entry) => vecNorm(entry));
  const dtauFlat = dtauDtSpreadAbs <= WARP_WORLDLINE_DTAU_VARIATION_TOLERANCE;
  const betaFlat = betaPairwiseSpread <= WARP_WORLDLINE_VECTOR_VARIATION_TOLERANCE;
  const effectiveFlat =
    effectivePairwiseSpread <= WARP_WORLDLINE_VECTOR_VARIATION_TOLERANCE;
  const flatWithinTolerance = dtauFlat && betaFlat && effectiveFlat;
  const transportVariationStatus: WarpWorldlineTransportVariationStatus = flatWithinTolerance
    ? "numerically_flat"
    : dtauFlat
      ? "descriptor_varied_dtau_flat"
      : "descriptor_and_dtau_varied";
  const transportInformativenessStatus: WarpWorldlineTransportInformativenessStatus =
    betaFlat && effectiveFlat
      ? "structurally_valid_but_flat"
      : "descriptor_informative_local_only";
  const sampleFamilyAdequacy: WarpWorldlineSampleFamilyAdequacy =
    transportInformativenessStatus === "descriptor_informative_local_only"
      ? "adequate_for_bounded_cruise_preflight"
      : "insufficiently_differentiated";
  const flatnessReason = flatWithinTolerance
    ? "samples_numerically_flat_within_declared_tolerances"
    : dtauFlat
      ? "shell_cross_samples_reveal_shift_variation_while_dtau_stays_flat_in_bounded_regime"
      : "bounded_local_samples_reveal_shift_and_dtau_variation";
  const flatnessInterpretation = flatWithinTolerance
    ? "This bounded local-comoving family is structurally valid but numerically flat within tolerance. It should be treated as transport scaffolding, not as a differentiated transport surface."
    : dtauFlat
      ? "The bounded local-comoving family exposes solve-backed local shift variation, but the low-g bounded regime keeps dtau_dt numerically flat. This is informative for bounded transport differentiation only, not for route-time or speed claims."
      : "The bounded local-comoving family exposes solve-backed shift and dtau_dt variation. This remains a bounded local transport descriptor and does not certify route-time or speed claims.";
  const eligibleNextProducts: WarpWorldlineEligibleNextProduct[] =
    transportInformativenessStatus === "descriptor_informative_local_only"
      ? ["bounded_cruise_envelope_preflight"]
      : [];
  const nextRequiredUpgrade =
    transportInformativenessStatus === "descriptor_informative_local_only"
      ? "route_time_worldline_extension_after_bounded_cruise_preflight"
      : "improve_bounded_local_sample_family_before_cruise_preflight";

  return {
    transportVariation: {
      transportVariationStatus,
      dtauDtSpread: {
        absolute: dtauDtSpreadAbs,
        flatWithinTolerance: dtauFlat,
      },
      effectiveTransportSpread: {
        maxPairwiseL2: effectivePairwiseSpread,
        minNorm: Math.min(...effectiveNorms),
        maxNorm: Math.max(...effectiveNorms),
        flatWithinTolerance: effectiveFlat,
      },
      betaSpread: {
        maxPairwiseL2: betaPairwiseSpread,
        minNorm: Math.min(...betaNorms),
        maxNorm: Math.max(...betaNorms),
        flatWithinTolerance: betaFlat,
      },
      variationTolerance: {
        dtauDtAbsolute: WARP_WORLDLINE_DTAU_VARIATION_TOLERANCE,
        effectiveTransportVectorL2: WARP_WORLDLINE_VECTOR_VARIATION_TOLERANCE,
        betaVectorL2: WARP_WORLDLINE_VECTOR_VARIATION_TOLERANCE,
      },
      flatWithinTolerance,
      flatnessReason,
    },
    transportInformativenessStatus,
    sampleFamilyAdequacy,
    flatnessInterpretation,
    certifiedTransportMeaning: "bounded_local_shift_descriptor_gradient_only",
    eligibleNextProducts,
    nextRequiredUpgrade,
  };
};

export const resolveWarpWorldlineRepresentativeSample = (
  contract: WarpWorldlineContractV1 | null | undefined,
): WarpWorldlineSampleV1 | null => {
  if (!contract || !Array.isArray(contract.samples) || contract.samples.length === 0) return null;
  return (
    contract.samples.find((entry) => entry.sampleId === contract.representativeSampleId) ??
    contract.samples.find((entry) => entry.sampleRole === "centerline_center") ??
    contract.samples[0] ??
    null
  );
};

export const isCertifiedWarpWorldlineContract = (
  value: unknown,
): value is WarpWorldlineContractV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.contractVersion !== WARP_WORLDLINE_CONTRACT_VERSION) return false;
  if (record.status !== "bounded_solve_backed") return false;
  if (record.certified !== true) return false;
  if (record.observerFamily !== "ship_centerline_local_comoving") return false;
  if (record.timeCoordinateName !== "t") return false;
  if (!matchesTuple(record.positionCoordinates, ["x", "y", "z"])) return false;
  if (record.coordinateVelocityUnits !== "m/s") return false;

  const sourceSurface = record.sourceSurface as Record<string, unknown> | undefined;
  if (!sourceSurface) return false;
  if (sourceSurface.surfaceId !== "nhm2_metric_local_comoving_transport_cross") return false;
  if (sourceSurface.producer !== "server/energy-pipeline.ts") return false;
  if (sourceSurface.provenanceClass !== "solve_backed") return false;
  if (sourceSurface.transportVectorSource !== "warp.solveBackedTransportSampleFamily") {
    return false;
  }
  if (sourceSurface.transportVectorField !== "shiftVectorField.evaluateShiftVector") {
    return false;
  }
  if (sourceSurface.metricT00Source !== "metric") return false;
  if (sourceSurface.metricT00ContractStatus !== "ok") return false;
  if (sourceSurface.chartContractStatus !== "ok") return false;

  const chart = record.chart as Record<string, unknown> | undefined;
  if (!chart) return false;
  if (chart.label !== "comoving_cartesian") return false;
  if (chart.chartFixed !== true) return false;

  const validityRegime = record.validityRegime as Record<string, unknown> | undefined;
  if (!validityRegime) return false;
  if (validityRegime.regimeId !== "nhm2_local_comoving_shell_cross") return false;
  if (validityRegime.bounded !== true) return false;
  if (validityRegime.chartFixed !== true) return false;
  if (validityRegime.observerDefined !== true) return false;
  if (validityRegime.failClosedOutsideRegime !== true) return false;
  if (validityRegime.routeTimeCertified !== false) return false;
  if (!matchesTuple(validityRegime.allowedSourceModels, ["warp_worldline_local_comoving"])) {
    return false;
  }
  if (!matchesTuple(validityRegime.deferredSourceModels, ["warp_worldline_route_time"])) {
    return false;
  }
  if (!Array.isArray(validityRegime.restrictions) || validityRegime.restrictions.length === 0) {
    return false;
  }

  const sampleGeometry = record.sampleGeometry as Record<string, unknown> | undefined;
  if (!sampleGeometry) return false;
  if (sampleGeometry.familyId !== "nhm2_centerline_shell_cross") return false;
  if (sampleGeometry.coordinateFrame !== "comoving_cartesian") return false;
  if (sampleGeometry.originDefinition !== "ship_center") return false;
  if (!matchesTuple(sampleGeometry.ordering, WARP_WORLDLINE_SAMPLE_ORDER)) return false;
  if (sampleGeometry.representativeSampleId !== "centerline_center") return false;
  const axes = sampleGeometry.axes as Record<string, unknown> | undefined;
  const offsets = sampleGeometry.offsets_m as Record<string, unknown> | undefined;
  if (!axes || !offsets) return false;
  if (!finiteVec3(axes.centerline)) return false;
  if (!finiteVec3(axes.portStarboard)) return false;
  if (!finiteVec3(axes.dorsalVentral)) return false;
  if (!finitePositive(offsets.centerline)) return false;
  if (!finitePositive(offsets.shellLongitudinal)) return false;
  if (!finitePositive(offsets.shellTransverse)) return false;
  if (!finitePositive(offsets.shellVertical)) return false;
  if (!finitePositive(offsets.shellClearance)) return false;

  const transportInterpretation =
    record.transportInterpretation as Record<string, unknown> | undefined;
  if (!transportInterpretation) return false;
  if (transportInterpretation.coordinateVelocityFrame !== "chart_fixed_comoving") return false;
  if (transportInterpretation.coordinateVelocityInterpretation !== "zero_by_chart_choice") {
    return false;
  }
  if (transportInterpretation.transportTerm !== "solve_backed_shift_term") return false;
  if (
    transportInterpretation.effectiveTransportInterpretation !==
    "bounded_local_comoving_descriptor_not_speed"
  ) {
    return false;
  }
  if (transportInterpretation.certifiedSpeedMeaning !== false) return false;
  if (typeof transportInterpretation.note !== "string" || !transportInterpretation.note.length) {
    return false;
  }

  const samples = Array.isArray(record.samples) ? record.samples : null;
  const sampleCount = toFiniteNumber(record.sampleCount);
  if (!samples || sampleCount == null || sampleCount !== samples.length || sampleCount <= 0) {
    return false;
  }
  if (sampleCount !== WARP_WORLDLINE_SAMPLE_ORDER.length) return false;

  const sampleRecords = samples as Record<string, unknown>[];
  const ids = new Set<string>();
  for (let index = 0; index < sampleRecords.length; index += 1) {
    const sample = sampleRecords[index];
    const expectedRole = WARP_WORLDLINE_SAMPLE_ORDER[index];
    if (sample.sampleRole !== expectedRole) return false;
    const sampleId = sample.sampleId;
    if (sampleId !== expectedRole || typeof sampleId !== "string") return false;
    if (ids.has(sampleId)) return false;
    ids.add(sampleId);
    if (sample.sourceModel !== "warp_worldline_local_comoving") return false;
    if (sample.transportProvenance !== "solve_backed_shift_vector_sample") return false;
    if (!finiteNonNegative(sample.coordinateTime_s)) return false;
    if (!finiteVec3(sample.position_m)) return false;
    if (!finiteVec3(sample.coordinateVelocity)) return false;
    if (sample.coordinateVelocityUnits !== "m/s") return false;
    if (!finiteVec3(sample.betaCoord)) return false;
    if (!finiteVec3(sample.effectiveTransportVelocityCoord)) return false;
    if (!finitePositive(sample.dtau_dt)) return false;
    if (!finiteNonNegative(Math.abs(Number(sample.normalizationResidual)))) return false;
  }

  if (record.representativeSampleId !== "centerline_center") return false;

  const sample = resolveWarpWorldlineRepresentativeSample(record as WarpWorldlineContractV1);
  if (!sample || sample.sampleId !== "centerline_center" || sample.sampleRole !== "centerline_center") {
    return false;
  }

  const contractCoordinateVelocity = toWarpWorldlineVec3(record.coordinateVelocity);
  const contractEffectiveTransportVelocity = toWarpWorldlineVec3(
    record.effectiveTransportVelocityCoord,
  );
  if (!contractCoordinateVelocity) return false;
  if (!contractEffectiveTransportVelocity) return false;
  if (
    !nearlyEqual(contractCoordinateVelocity[0], sample.coordinateVelocity[0]) ||
    !nearlyEqual(contractCoordinateVelocity[1], sample.coordinateVelocity[1]) ||
    !nearlyEqual(contractCoordinateVelocity[2], sample.coordinateVelocity[2])
  ) {
    return false;
  }
  if (
    !nearlyEqual(
      contractEffectiveTransportVelocity[0],
      sample.effectiveTransportVelocityCoord[0],
    ) ||
    !nearlyEqual(
      contractEffectiveTransportVelocity[1],
      sample.effectiveTransportVelocityCoord[1],
    ) ||
    !nearlyEqual(
      contractEffectiveTransportVelocity[2],
      sample.effectiveTransportVelocityCoord[2],
    )
  ) {
    return false;
  }

  const dtauDtSummary = record.dtau_dt as Record<string, unknown> | undefined;
  if (!dtauDtSummary) return false;
  const representativeDtauDt = toFiniteNumber(dtauDtSummary.representative);
  const minDtauDt = toFiniteNumber(dtauDtSummary.min);
  const maxDtauDt = toFiniteNumber(dtauDtSummary.max);
  if (
    representativeDtauDt == null ||
    minDtauDt == null ||
    maxDtauDt == null ||
    !(minDtauDt > 0) ||
    !(maxDtauDt > 0) ||
    minDtauDt > representativeDtauDt ||
    representativeDtauDt > maxDtauDt ||
    dtauDtSummary.units !== "dimensionless" ||
    dtauDtSummary.positivityRequired !== true
  ) {
    return false;
  }

  const sampleDtauDtValues = sampleRecords.map((entry) => Number(entry.dtau_dt));
  const computedMinDtauDt = Math.min(...sampleDtauDtValues);
  const computedMaxDtauDt = Math.max(...sampleDtauDtValues);
  if (!nearlyEqual(representativeDtauDt, Number(sample.dtau_dt))) return false;
  if (!nearlyEqual(minDtauDt, computedMinDtauDt)) return false;
  if (!nearlyEqual(maxDtauDt, computedMaxDtauDt)) return false;

  const normalization = record.normalizationResidual as Record<string, unknown> | undefined;
  const representativeResidual = toFiniteNumber(normalization?.representative);
  const maxAbsResidual = toFiniteNumber(normalization?.maxAbs);
  const tolerance = toFiniteNumber(normalization?.tolerance);
  if (
    representativeResidual == null ||
    maxAbsResidual == null ||
    tolerance == null ||
    tolerance <= 0 ||
    tolerance > WARP_WORLDLINE_NORMALIZATION_TOLERANCE
  ) {
    return false;
  }
  if (
    normalization?.relation !==
    "alpha^2 - gamma_ij(v^i+beta^i)(v^j+beta^j) - (d tau / dt)^2"
  ) {
    return false;
  }
  const sampleResiduals = sampleRecords.map((entry) =>
    Math.abs(Number(entry.normalizationResidual)),
  );
  const computedMaxResidual = Math.max(...sampleResiduals);
  if (!nearlyEqual(representativeResidual, Number(sample.normalizationResidual))) return false;
  if (!nearlyEqual(maxAbsResidual, computedMaxResidual)) return false;
  if (!(maxAbsResidual <= tolerance)) return false;

  const analysis = analyzeWarpWorldlineTransportVariation(
    (sampleRecords as WarpWorldlineSampleV1[]).map((entry) => ({
      sampleId: entry.sampleId as WarpWorldlineSampleRole,
      sampleRole: entry.sampleRole as WarpWorldlineSampleRole,
      sourceModel: entry.sourceModel as WarpWorldlineSourceModel,
      transportProvenance:
        entry.transportProvenance as WarpWorldlineTransportProvenance,
      coordinateTime_s: Number(entry.coordinateTime_s),
      position_m: entry.position_m as WarpWorldlineVec3,
      coordinateVelocity: entry.coordinateVelocity as WarpWorldlineVec3,
      coordinateVelocityUnits: entry.coordinateVelocityUnits as "m/s",
      betaCoord: entry.betaCoord as WarpWorldlineVec3,
      effectiveTransportVelocityCoord:
        entry.effectiveTransportVelocityCoord as WarpWorldlineVec3,
      dtau_dt: Number(entry.dtau_dt),
      normalizationResidual: Number(entry.normalizationResidual),
    })),
  );
  if (!analysis) return false;

  const transportVariation = record.transportVariation as Record<string, unknown> | undefined;
  if (!transportVariation) return false;
  const dtauDtSpread = transportVariation.dtauDtSpread as Record<string, unknown> | undefined;
  const effectiveTransportSpread =
    transportVariation.effectiveTransportSpread as Record<string, unknown> | undefined;
  const betaSpread = transportVariation.betaSpread as Record<string, unknown> | undefined;
  const variationTolerance =
    transportVariation.variationTolerance as Record<string, unknown> | undefined;
  if (!dtauDtSpread || !effectiveTransportSpread || !betaSpread || !variationTolerance) {
    return false;
  }
  if (
    transportVariation.transportVariationStatus !==
    analysis.transportVariation.transportVariationStatus
  ) {
    return false;
  }
  if (
    !nearlyEqual(
      Number(dtauDtSpread.absolute),
      analysis.transportVariation.dtauDtSpread.absolute,
    ) ||
    dtauDtSpread.flatWithinTolerance !== analysis.transportVariation.dtauDtSpread.flatWithinTolerance
  ) {
    return false;
  }
  if (
    !nearlyEqual(
      Number(effectiveTransportSpread.maxPairwiseL2),
      analysis.transportVariation.effectiveTransportSpread.maxPairwiseL2,
    ) ||
    !nearlyEqual(
      Number(effectiveTransportSpread.minNorm),
      analysis.transportVariation.effectiveTransportSpread.minNorm,
    ) ||
    !nearlyEqual(
      Number(effectiveTransportSpread.maxNorm),
      analysis.transportVariation.effectiveTransportSpread.maxNorm,
    ) ||
    effectiveTransportSpread.flatWithinTolerance !==
      analysis.transportVariation.effectiveTransportSpread.flatWithinTolerance
  ) {
    return false;
  }
  if (
    !nearlyEqual(
      Number(betaSpread.maxPairwiseL2),
      analysis.transportVariation.betaSpread.maxPairwiseL2,
    ) ||
    !nearlyEqual(
      Number(betaSpread.minNorm),
      analysis.transportVariation.betaSpread.minNorm,
    ) ||
    !nearlyEqual(
      Number(betaSpread.maxNorm),
      analysis.transportVariation.betaSpread.maxNorm,
    ) ||
    betaSpread.flatWithinTolerance !== analysis.transportVariation.betaSpread.flatWithinTolerance
  ) {
    return false;
  }
  if (
    !nearlyEqual(
      Number(variationTolerance.dtauDtAbsolute),
      analysis.transportVariation.variationTolerance.dtauDtAbsolute,
    ) ||
    !nearlyEqual(
      Number(variationTolerance.effectiveTransportVectorL2),
      analysis.transportVariation.variationTolerance.effectiveTransportVectorL2,
    ) ||
    !nearlyEqual(
      Number(variationTolerance.betaVectorL2),
      analysis.transportVariation.variationTolerance.betaVectorL2,
    ) ||
    transportVariation.flatWithinTolerance !== analysis.transportVariation.flatWithinTolerance ||
    transportVariation.flatnessReason !== analysis.transportVariation.flatnessReason
  ) {
    return false;
  }

  if (
    record.transportInformativenessStatus !== analysis.transportInformativenessStatus ||
    record.sampleFamilyAdequacy !== analysis.sampleFamilyAdequacy ||
    record.flatnessInterpretation !== analysis.flatnessInterpretation ||
    record.certifiedTransportMeaning !== analysis.certifiedTransportMeaning ||
    record.nextRequiredUpgrade !== analysis.nextRequiredUpgrade
  ) {
    return false;
  }
  if (!matchesTuple(record.eligibleNextProducts, analysis.eligibleNextProducts)) return false;
  return maxAbsResidual <= tolerance;
};
