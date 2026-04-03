import {
  WARP_WORLDLINE_CONTRACT_VERSION,
  WARP_WORLDLINE_SAMPLE_ORDER,
  WARP_WORLDLINE_VECTOR_VARIATION_TOLERANCE,
  isCertifiedWarpWorldlineContract,
  resolveWarpWorldlineRepresentativeSample,
  type WarpWorldlineChart,
  type WarpWorldlineContractV1,
  type WarpWorldlineSampleFamilyAdequacy,
  type WarpWorldlineSampleRole,
  type WarpWorldlineSourceSurface,
  type WarpWorldlineTransportInformativenessStatus,
  type WarpWorldlineTransportVariationStatus,
} from "./warp-worldline-contract.v1";

export const WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION =
  "warp_cruise_envelope_preflight/v1";

export type WarpCruiseEnvelopePreflightStatus = "bounded_preflight_ready";
export type WarpCruiseEnvelopePreflightQuantityId =
  "bounded_local_transport_descriptor_norm";
export type WarpCruiseEnvelopePreflightEligibleNextProduct =
  "route_time_worldline_extension";
export type WarpCruiseEnvelopePreflightCandidateClass =
  | "observed_shell_cross_sample"
  | "above_certified_support_probe";

export type WarpCruiseEnvelopePreflightCandidateV1 = {
  candidateId: string;
  candidateClass: WarpCruiseEnvelopePreflightCandidateClass;
  sourceSampleId: WarpWorldlineSampleRole | null;
  preflightQuantityValue: number;
  preflightQuantityUnits: "dimensionless";
  admissible: boolean;
  gateReasons: string[];
  note: string;
};

export type WarpCruiseEnvelopePreflightContractV1 = {
  contractVersion: typeof WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION;
  status: WarpCruiseEnvelopePreflightStatus;
  certified: true;
  sourceWorldlineContractVersion: typeof WARP_WORLDLINE_CONTRACT_VERSION;
  sourceSurface: WarpWorldlineSourceSurface;
  chart: WarpWorldlineChart;
  observerFamily: "ship_centerline_local_comoving";
  sourceSampleGeometryFamilyId: "nhm2_centerline_shell_cross";
  preflightQuantityId: WarpCruiseEnvelopePreflightQuantityId;
  preflightQuantityMeaning: string;
  preflightQuantityUnits: "dimensionless";
  validityRegime: {
    regimeId: "nhm2_bounded_cruise_preflight";
    bounded: true;
    chartFixed: true;
    observerDefined: true;
    localComovingOnly: true;
    routeTimeDeferred: true;
    missionTimeCertified: false;
    failClosedOutsideRegime: true;
    description: string;
  };
  transportVariationStatus: WarpWorldlineTransportVariationStatus;
  transportInformativenessStatus: WarpWorldlineTransportInformativenessStatus;
  sampleFamilyAdequacy: WarpWorldlineSampleFamilyAdequacy;
  flatnessInterpretation: string;
  certifiedTransportMeaning: string;
  descriptorNormSummary: {
    representative: number;
    minAdmissible: number;
    maxAdmissible: number;
    spread: number;
    units: "dimensionless";
  };
  boundedCruisePreflightBand: {
    min: number;
    max: number;
    units: "dimensionless";
    meaning: "certified_local_descriptor_support_only";
  };
  candidateCount: number;
  admissibleCount: number;
  rejectedCount: number;
  candidateSet: WarpCruiseEnvelopePreflightCandidateV1[];
  admissibleCandidates: WarpCruiseEnvelopePreflightCandidateV1[];
  rejectedCandidates: WarpCruiseEnvelopePreflightCandidateV1[];
  gateReasons: string[];
  routeTimeStatus: "deferred";
  eligibleNextProducts: WarpCruiseEnvelopePreflightEligibleNextProduct[];
  nextRequiredUpgrade: "route_time_worldline_extension";
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

const finitePositive = (value: unknown): boolean => {
  const parsed = toFiniteNumber(value);
  return parsed != null && parsed > 0;
};

export const computeWarpCruiseEnvelopePreflightQuantity = (
  worldline: Pick<
    WarpWorldlineContractV1["samples"][number],
    "effectiveTransportVelocityCoord"
  >,
): number =>
  Math.hypot(
    worldline.effectiveTransportVelocityCoord[0],
    worldline.effectiveTransportVelocityCoord[1],
    worldline.effectiveTransportVelocityCoord[2],
  );

export const buildWarpCruiseEnvelopePreflightContractFromWorldline = (
  worldline: WarpWorldlineContractV1 | null | undefined,
): WarpCruiseEnvelopePreflightContractV1 | null => {
  if (!isCertifiedWarpWorldlineContract(worldline)) return null;
  if (worldline.sampleFamilyAdequacy !== "adequate_for_bounded_cruise_preflight") {
    return null;
  }
  if (worldline.transportInformativenessStatus !== "descriptor_informative_local_only") {
    return null;
  }
  if (worldline.validityRegime.routeTimeCertified !== false) return null;

  const representativeSample = resolveWarpWorldlineRepresentativeSample(worldline);
  if (!representativeSample) return null;

  const observedCandidates = worldline.samples.map((sample) => ({
    candidateId: `sample_${sample.sampleId}`,
    candidateClass: "observed_shell_cross_sample" as const,
    sourceSampleId: sample.sampleId,
    preflightQuantityValue: computeWarpCruiseEnvelopePreflightQuantity(sample),
    preflightQuantityUnits: "dimensionless" as const,
    admissible: true,
    gateReasons: [
      "certified_warp_worldline_present",
      "worldline_sample_family_adequate_for_bounded_cruise_preflight",
      "candidate_within_certified_shell_cross_support",
      "route_time_still_deferred",
    ],
    note:
      "Observed local-comoving shell-cross descriptor support from a certified solve-backed worldline sample. This is a bounded transport descriptor only, not a speed.",
  }));
  if (observedCandidates.length !== WARP_WORLDLINE_SAMPLE_ORDER.length) return null;

  const admissibleValues = observedCandidates.map((entry) => entry.preflightQuantityValue);
  const minAdmissible = Math.min(...admissibleValues);
  const maxAdmissible = Math.max(...admissibleValues);
  const representativeValue = computeWarpCruiseEnvelopePreflightQuantity(representativeSample);
  const spread = maxAdmissible - minAdmissible;
  const supportProbeMargin = Math.max(
    worldline.transportVariation.effectiveTransportSpread.maxPairwiseL2,
    maxAdmissible * 0.1,
    WARP_WORLDLINE_VECTOR_VARIATION_TOLERANCE,
  );
  const aboveSupportProbeValue = maxAdmissible + supportProbeMargin;
  const rejectedProbe: WarpCruiseEnvelopePreflightCandidateV1 = {
    candidateId: "probe_above_certified_support",
    candidateClass: "above_certified_support_probe",
    sourceSampleId: null,
    preflightQuantityValue: aboveSupportProbeValue,
    preflightQuantityUnits: "dimensionless",
    admissible: false,
    gateReasons: [
      "candidate_exceeds_certified_local_descriptor_support",
      "route_time_extension_required_for_broader_transport_claims",
    ],
    note:
      "Intentional above-support probe used to keep the bounded preflight fail-closed above current certified local shell-cross evidence.",
  };

  const candidateSet = [...observedCandidates, rejectedProbe];
  return {
    contractVersion: WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION,
    status: "bounded_preflight_ready",
    certified: true,
    sourceWorldlineContractVersion: WARP_WORLDLINE_CONTRACT_VERSION,
    sourceSurface: { ...worldline.sourceSurface },
    chart: { ...worldline.chart },
    observerFamily: worldline.observerFamily,
    sourceSampleGeometryFamilyId: worldline.sampleGeometry.familyId,
    preflightQuantityId: "bounded_local_transport_descriptor_norm",
    preflightQuantityMeaning:
      "Dimensionless norm ||beta_eff|| of the certified local-comoving effective transport descriptor across the shell-cross family. This is fixed-chart local descriptor support only, not a ship speed.",
    preflightQuantityUnits: "dimensionless",
    validityRegime: {
      regimeId: "nhm2_bounded_cruise_preflight",
      bounded: true,
      chartFixed: true,
      observerDefined: true,
      localComovingOnly: true,
      routeTimeDeferred: true,
      missionTimeCertified: false,
      failClosedOutsideRegime: true,
      description:
        "Bounded NHM2 cruise-envelope preflight over the certified local-comoving shell-cross worldline family. It carries local descriptor support only and remains fail-closed for route-time and mission-time products.",
    },
    transportVariationStatus: worldline.transportVariation.transportVariationStatus,
    transportInformativenessStatus: worldline.transportInformativenessStatus,
    sampleFamilyAdequacy: worldline.sampleFamilyAdequacy,
    flatnessInterpretation: worldline.flatnessInterpretation,
    certifiedTransportMeaning: worldline.certifiedTransportMeaning,
    descriptorNormSummary: {
      representative: representativeValue,
      minAdmissible,
      maxAdmissible,
      spread,
      units: "dimensionless",
    },
    boundedCruisePreflightBand: {
      min: minAdmissible,
      max: maxAdmissible,
      units: "dimensionless",
      meaning: "certified_local_descriptor_support_only",
    },
    candidateCount: candidateSet.length,
    admissibleCount: observedCandidates.length,
    rejectedCount: 1,
    candidateSet,
    admissibleCandidates: observedCandidates,
    rejectedCandidates: [rejectedProbe],
    gateReasons: [
      "certified_warp_worldline_present",
      "worldline_transport_informativeness_sufficient_for_bounded_preflight",
      "worldline_sample_family_adequate_for_bounded_cruise_preflight",
      "dtau_dt_positive_across_worldline_family",
      "normalization_residual_within_worldline_tolerance",
      "route_time_and_mission_time_remain_deferred",
    ],
    routeTimeStatus: "deferred",
    eligibleNextProducts: ["route_time_worldline_extension"],
    nextRequiredUpgrade: "route_time_worldline_extension",
    claimBoundary: [
      "bounded cruise-envelope preflight only",
      "fixed-chart local-comoving descriptor support only",
      "not a speed certificate",
      "not a route-time worldline",
      "not a mission-time estimator",
      "not viability-promotion evidence",
    ],
    falsifierConditions: [
      "certified_warp_worldline_missing",
      "worldline_transport_informativeness_insufficient",
      "worldline_sample_family_not_adequate_for_bounded_cruise_preflight",
      "route_time_certified_flag_set_true",
      "candidate_exceeds_certified_local_descriptor_support",
    ],
    nonClaims: [
      "not max-speed certified",
      "not route-time certified",
      "not mission-time certified",
      "not relativistic-advantage certified",
      "not viability-promotion evidence",
    ],
  };
};

export const isCertifiedWarpCruiseEnvelopePreflightContract = (
  value: unknown,
): value is WarpCruiseEnvelopePreflightContractV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.contractVersion !== WARP_CRUISE_ENVELOPE_PREFLIGHT_CONTRACT_VERSION) {
    return false;
  }
  if (record.status !== "bounded_preflight_ready") return false;
  if (record.certified !== true) return false;
  if (record.sourceWorldlineContractVersion !== WARP_WORLDLINE_CONTRACT_VERSION) {
    return false;
  }
  if (record.observerFamily !== "ship_centerline_local_comoving") return false;
  if (record.sourceSampleGeometryFamilyId !== "nhm2_centerline_shell_cross") {
    return false;
  }
  if (record.preflightQuantityId !== "bounded_local_transport_descriptor_norm") {
    return false;
  }
  if (record.preflightQuantityUnits !== "dimensionless") return false;
  if (record.routeTimeStatus !== "deferred") return false;
  if (record.nextRequiredUpgrade !== "route_time_worldline_extension") return false;

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
  if (validityRegime.regimeId !== "nhm2_bounded_cruise_preflight") return false;
  if (validityRegime.bounded !== true) return false;
  if (validityRegime.chartFixed !== true) return false;
  if (validityRegime.observerDefined !== true) return false;
  if (validityRegime.localComovingOnly !== true) return false;
  if (validityRegime.routeTimeDeferred !== true) return false;
  if (validityRegime.missionTimeCertified !== false) return false;
  if (validityRegime.failClosedOutsideRegime !== true) return false;

  if (record.transportInformativenessStatus !== "descriptor_informative_local_only") {
    return false;
  }
  if (record.sampleFamilyAdequacy !== "adequate_for_bounded_cruise_preflight") {
    return false;
  }
  if (
    record.transportVariationStatus !== "descriptor_varied_dtau_flat" &&
    record.transportVariationStatus !== "descriptor_and_dtau_varied"
  ) {
    return false;
  }
  if (typeof record.flatnessInterpretation !== "string" || !record.flatnessInterpretation.length) {
    return false;
  }
  if (record.certifiedTransportMeaning !== "bounded_local_shift_descriptor_gradient_only") {
    return false;
  }

  const descriptorNormSummary = record.descriptorNormSummary as Record<string, unknown> | undefined;
  if (!descriptorNormSummary) return false;
  const representative = toFiniteNumber(descriptorNormSummary.representative);
  const minAdmissible = toFiniteNumber(descriptorNormSummary.minAdmissible);
  const maxAdmissible = toFiniteNumber(descriptorNormSummary.maxAdmissible);
  const spread = toFiniteNumber(descriptorNormSummary.spread);
  if (
    representative == null ||
    minAdmissible == null ||
    maxAdmissible == null ||
    spread == null ||
    descriptorNormSummary.units !== "dimensionless" ||
    !(minAdmissible > 0) ||
    !(maxAdmissible >= minAdmissible) ||
    !(representative >= minAdmissible) ||
    !(representative <= maxAdmissible) ||
    !(spread >= 0)
  ) {
    return false;
  }

  const band = record.boundedCruisePreflightBand as Record<string, unknown> | undefined;
  if (!band) return false;
  if (band.units !== "dimensionless") return false;
  if (band.meaning !== "certified_local_descriptor_support_only") return false;
  if (
    !nearlyEqual(Number(band.min), minAdmissible) ||
    !nearlyEqual(Number(band.max), maxAdmissible)
  ) {
    return false;
  }

  const candidateSet = Array.isArray(record.candidateSet) ? record.candidateSet : null;
  const admissibleCandidates = Array.isArray(record.admissibleCandidates)
    ? record.admissibleCandidates
    : null;
  const rejectedCandidates = Array.isArray(record.rejectedCandidates)
    ? record.rejectedCandidates
    : null;
  const candidateCount = toFiniteNumber(record.candidateCount);
  const admissibleCount = toFiniteNumber(record.admissibleCount);
  const rejectedCount = toFiniteNumber(record.rejectedCount);
  if (
    !candidateSet ||
    !admissibleCandidates ||
    !rejectedCandidates ||
    candidateCount == null ||
    admissibleCount == null ||
    rejectedCount == null
  ) {
    return false;
  }
  if (
    candidateCount !== candidateSet.length ||
    admissibleCount !== admissibleCandidates.length ||
    rejectedCount !== rejectedCandidates.length ||
    candidateCount !== admissibleCount + rejectedCount
  ) {
    return false;
  }
  if (admissibleCount !== WARP_WORLDLINE_SAMPLE_ORDER.length || rejectedCount !== 1) {
    return false;
  }

  const candidateRecords = candidateSet as Record<string, unknown>[];
  for (let index = 0; index < WARP_WORLDLINE_SAMPLE_ORDER.length; index += 1) {
    const candidate = candidateRecords[index];
    const expectedSampleId = WARP_WORLDLINE_SAMPLE_ORDER[index];
    if (candidate.candidateId !== `sample_${expectedSampleId}`) return false;
    if (candidate.candidateClass !== "observed_shell_cross_sample") return false;
    if (candidate.sourceSampleId !== expectedSampleId) return false;
    if (candidate.preflightQuantityUnits !== "dimensionless") return false;
    if (candidate.admissible !== true) return false;
    if (!finitePositive(candidate.preflightQuantityValue)) return false;
    if (!Array.isArray(candidate.gateReasons) || candidate.gateReasons.length === 0) {
      return false;
    }
    if (typeof candidate.note !== "string" || !candidate.note.length) return false;
  }

  const rejectedProbe = candidateRecords[candidateRecords.length - 1];
  if (rejectedProbe.candidateId !== "probe_above_certified_support") return false;
  if (rejectedProbe.candidateClass !== "above_certified_support_probe") return false;
  if (rejectedProbe.sourceSampleId !== null) return false;
  if (rejectedProbe.preflightQuantityUnits !== "dimensionless") return false;
  if (rejectedProbe.admissible !== false) return false;
  if (!finitePositive(rejectedProbe.preflightQuantityValue)) return false;
  if (!Array.isArray(rejectedProbe.gateReasons) || rejectedProbe.gateReasons.length === 0) {
    return false;
  }
  if (!(Number(rejectedProbe.preflightQuantityValue) > maxAdmissible)) return false;

  if (
    !matchesTuple(
      admissibleCandidates.map((entry) => (entry as Record<string, unknown>).candidateId),
      WARP_WORLDLINE_SAMPLE_ORDER.map((sampleId) => `sample_${sampleId}`),
    )
  ) {
    return false;
  }
  if (
    !matchesTuple(
      rejectedCandidates.map((entry) => (entry as Record<string, unknown>).candidateId),
      ["probe_above_certified_support"],
    )
  ) {
    return false;
  }

  const computedAdmissibleValues = admissibleCandidates.map((entry) =>
    Number((entry as Record<string, unknown>).preflightQuantityValue),
  );
  const computedRepresentative =
    Number(
      (
        admissibleCandidates.find(
          (entry) =>
            (entry as Record<string, unknown>).candidateId === "sample_centerline_center",
        ) as Record<string, unknown> | undefined
      )?.preflightQuantityValue,
    ) || NaN;
  const computedMin = Math.min(...computedAdmissibleValues);
  const computedMax = Math.max(...computedAdmissibleValues);
  if (!nearlyEqual(representative, computedRepresentative)) return false;
  if (!nearlyEqual(minAdmissible, computedMin)) return false;
  if (!nearlyEqual(maxAdmissible, computedMax)) return false;
  if (!nearlyEqual(spread, computedMax - computedMin)) return false;

  if (
    !matchesTuple(record.eligibleNextProducts, ["route_time_worldline_extension"])
  ) {
    return false;
  }
  if (!Array.isArray(record.gateReasons) || record.gateReasons.length === 0) return false;
  if (!Array.isArray(record.claimBoundary) || record.claimBoundary.length === 0) return false;
  if (!Array.isArray(record.falsifierConditions) || record.falsifierConditions.length === 0) {
    return false;
  }
  if (!Array.isArray(record.nonClaims) || record.nonClaims.length === 0) return false;
  return true;
};
