import {
  analyzeWarpWorldlineTransportVariation,
  computeWarpWorldlineDtauDt,
  computeWarpWorldlineNormalizationResidual,
  type WarpShiftLapseTransportPromotionGate,
  type WarpTransportCertificationStatus,
  type WarpTransportFamilyAuthorityStatus,
  type WarpWorldlineContractV1,
  type WarpWorldlineSampleV1,
  type WarpWorldlineVec3,
} from "../../shared/contracts/warp-worldline-contract.v1";
import {
  buildWarpCruiseEnvelopePreflightContractFromWorldline,
  type WarpCruiseEnvelopePreflightContractV1,
} from "../../shared/contracts/warp-cruise-envelope-preflight.v1";
import {
  buildWarpRouteTimeWorldlineContract,
  type WarpRouteTimeWorldlineContractV1,
} from "../../shared/contracts/warp-route-time-worldline.v1";
import {
  LIGHT_YEARS_PER_PARSEC,
  LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION,
  METERS_PER_PARSEC,
  buildWarpMissionTimeEstimatorContract,
  type WarpMissionEstimatorTargetId,
  type WarpMissionTargetDistanceContractV1,
  type WarpMissionTimeEstimatorContractV1,
} from "../../shared/contracts/warp-mission-time-estimator.v1";
import {
  buildWarpMissionTimeComparisonContract,
  type WarpMissionTimeComparisonContractV1,
} from "../../shared/contracts/warp-mission-time-comparison.v1";
import {
  WARP_CATALOG_ETA_PROJECTION_CONTRACT_VERSION,
  type WarpCatalogEtaProjectionV1,
} from "../../shared/contracts/warp-catalog-eta-projection.v1";
import {
  buildWarpCruiseEnvelopeContract,
  type WarpCruiseEnvelopeContractV1,
} from "../../shared/contracts/warp-cruise-envelope.v1";
import {
  buildWarpInHullProperAccelerationContract,
  properAccelerationGeomToMps2,
  properAccelerationMps2ToG,
  type WarpInHullProperAccelerationContractV1,
  type WarpInHullProperAccelerationSampleRole,
  type WarpInHullProperAccelerationSamplingGeometry,
  type WarpInHullProperAccelerationVec3,
} from "../../shared/contracts/warp-in-hull-proper-acceleration.v1";

const ALPHA = 1;
const GAMMA_DIAG: WarpWorldlineVec3 = [1, 1, 1];
const COORDINATE_VELOCITY: WarpWorldlineVec3 = [0, 0, 0];

const buildSample = (
  sampleId: WarpWorldlineSampleV1["sampleId"],
  position_m: WarpWorldlineVec3,
  betaCoord: WarpWorldlineVec3,
  alpha = ALPHA,
): WarpWorldlineSampleV1 => {
  const dtau_dt =
    computeWarpWorldlineDtauDt({
      alpha,
      gammaDiag: GAMMA_DIAG,
      coordinateVelocity: COORDINATE_VELOCITY,
      betaCoord,
    }) ?? 0;
  return {
    sampleId,
    sampleRole: sampleId,
    sourceModel: "warp_worldline_local_comoving",
    transportProvenance: "solve_backed_shift_vector_sample",
    coordinateTime_s: 0,
    position_m,
    coordinateVelocity: COORDINATE_VELOCITY,
    coordinateVelocityUnits: "m/s",
    betaCoord,
    effectiveTransportVelocityCoord: [...betaCoord] as WarpWorldlineVec3,
    dtau_dt,
    normalizationResidual: computeWarpWorldlineNormalizationResidual({
      alpha,
      gammaDiag: GAMMA_DIAG,
      coordinateVelocity: COORDINATE_VELOCITY,
      betaCoord,
      dtau_dt,
    }),
  };
};

export const makeInformativeWarpWorldlineSamples = (): WarpWorldlineSampleV1[] => [
  buildSample("centerline_aft", [-2.5, 0, 0], [0.58, 0, 0]),
  buildSample("centerline_center", [0, 0, 0], [0.6, 0, 0]),
  buildSample("centerline_fore", [2.5, 0, 0], [0.62, 0, 0]),
  buildSample("shell_aft", [-4.9, 0, 0], [0.42, -0.01, 0]),
  buildSample("shell_fore", [4.9, 0, 0], [0.48, -0.02, 0]),
  buildSample("shell_port", [0, 1.3, 0], [0.5, 0.06, 0]),
  buildSample("shell_starboard", [0, -1.3, 0], [0.5, -0.04, 0]),
  buildSample("shell_dorsal", [0, 0, 0.9], [0.52, 0, 0.05]),
  buildSample("shell_ventral", [0, 0, -0.9], [0.52, 0, -0.03]),
];

export const makeInformativeWarpWorldlineSamplesForAlpha = (
  alpha: number,
): WarpWorldlineSampleV1[] => [
  buildSample("centerline_aft", [-2.5, 0, 0], [0.58, 0, 0], alpha),
  buildSample("centerline_center", [0, 0, 0], [0.6, 0, 0], alpha),
  buildSample("centerline_fore", [2.5, 0, 0], [0.62, 0, 0], alpha),
  buildSample("shell_aft", [-4.9, 0, 0], [0.42, -0.01, 0], alpha),
  buildSample("shell_fore", [4.9, 0, 0], [0.48, -0.02, 0], alpha),
  buildSample("shell_port", [0, 1.3, 0], [0.5, 0.06, 0], alpha),
  buildSample("shell_starboard", [0, -1.3, 0], [0.5, -0.04, 0], alpha),
  buildSample("shell_dorsal", [0, 0, 0.9], [0.52, 0, 0.05], alpha),
  buildSample("shell_ventral", [0, 0, -0.9], [0.52, 0, -0.03], alpha),
];

export const makeFlatWarpWorldlineSamples = (): WarpWorldlineSampleV1[] =>
  [
    [-2.5, 0, 0],
    [0, 0, 0],
    [2.5, 0, 0],
    [-4.9, 0, 0],
    [4.9, 0, 0],
    [0, 1.3, 0],
    [0, -1.3, 0],
    [0, 0, 0.9],
    [0, 0, -0.9],
  ].map((position_m, index) =>
    buildSample(
      [
        "centerline_aft",
        "centerline_center",
        "centerline_fore",
        "shell_aft",
        "shell_fore",
        "shell_port",
        "shell_starboard",
        "shell_dorsal",
        "shell_ventral",
      ][index] as WarpWorldlineSampleV1["sampleId"],
      position_m as WarpWorldlineVec3,
      [0.02, 0, 0],
    ),
  );

export const makeWarpWorldlineFixture = (
  samples: WarpWorldlineSampleV1[] = makeInformativeWarpWorldlineSamples(),
): WarpWorldlineContractV1 => {
  const analysis = analyzeWarpWorldlineTransportVariation(samples);
  if (!analysis) {
    throw new Error("expected non-empty worldline sample family");
  }
  const representativeSample =
    samples.find((entry) => entry.sampleId === "centerline_center") ?? samples[0];
  const dtau_dt_values = samples.map((entry) => entry.dtau_dt);
  const residual_values = samples.map((entry) => Math.abs(entry.normalizationResidual));
  return {
    contractVersion: "warp_worldline_contract/v1",
    status: "bounded_solve_backed",
    certified: true,
    sourceSurface: {
      surfaceId: "nhm2_metric_local_comoving_transport_cross",
      producer: "server/energy-pipeline.ts",
      provenanceClass: "solve_backed",
      transportVectorSource: "warp.solveBackedTransportSampleFamily",
      transportVectorField: "shiftVectorField.evaluateShiftVector",
      metricT00Ref: "warp.metric.T00.natario_sdf.shift",
      metricT00Source: "metric",
      metricFamily: "natario_sdf",
      familyAuthorityStatus: "canonical_bounded_baseline_solve_family",
      transportCertificationStatus: "bounded_transport_proof_bearing_baseline",
      metricT00ContractStatus: "ok",
      chartContractStatus: "ok",
    },
    chart: {
      label: "comoving_cartesian",
      coordinateMap: "comoving_cartesian: x' = x - x_s(t), t = t",
      chartFixed: true,
    },
    observerFamily: "ship_centerline_local_comoving",
    validityRegime: {
      regimeId: "nhm2_local_comoving_shell_cross",
      bounded: true,
      chartFixed: true,
      observerDefined: true,
      failClosedOutsideRegime: true,
      routeTimeCertified: false,
      description: "bounded local-comoving centerline-plus-shell-cross sample family",
      allowedSourceModels: ["warp_worldline_local_comoving"],
      deferredSourceModels: ["warp_worldline_route_time"],
      restrictions: [
        "deterministic_centerline_shell_cross_family_only",
        "coordinate_velocity_fixed_to_zero_in_comoving_chart",
        "effective_transport_velocity_is_local_shift_descriptor_not_certified_speed",
      ],
    },
    sampleGeometry: {
      familyId: "nhm2_centerline_shell_cross",
      description:
        "Deterministic bounded local-comoving shell-cross family with centerline and shell-proximal probes.",
      coordinateFrame: "comoving_cartesian",
      originDefinition: "ship_center",
      ordering: [
        "centerline_aft",
        "centerline_center",
        "centerline_fore",
        "shell_aft",
        "shell_fore",
        "shell_port",
        "shell_starboard",
        "shell_dorsal",
        "shell_ventral",
      ],
      representativeSampleId: "centerline_center",
      axes: {
        centerline: [1, 0, 0],
        portStarboard: [0, 1, 0],
        dorsalVentral: [0, 0, 1],
      },
      offsets_m: {
        centerline: 2.5,
        shellLongitudinal: 4.9,
        shellTransverse: 1.3,
        shellVertical: 0.9,
        shellClearance: 0.1,
      },
    },
    sampleCount: samples.length,
    representativeSampleId: "centerline_center",
    transportInterpretation: {
      coordinateVelocityFrame: "chart_fixed_comoving",
      coordinateVelocityInterpretation: "zero_by_chart_choice",
      transportTerm: "solve_backed_shift_term",
      effectiveTransportInterpretation: "bounded_local_comoving_descriptor_not_speed",
      certifiedSpeedMeaning: false,
      note:
        "Effective transport is a bounded local shift descriptor only. Even when shell-cross variation is present, it is not a certified speed or route-time answer.",
    },
    transportVariation: analysis.transportVariation,
    transportInformativenessStatus: analysis.transportInformativenessStatus,
    sampleFamilyAdequacy: analysis.sampleFamilyAdequacy,
    flatnessInterpretation: analysis.flatnessInterpretation,
    certifiedTransportMeaning: analysis.certifiedTransportMeaning,
    eligibleNextProducts: analysis.eligibleNextProducts,
    nextRequiredUpgrade: analysis.nextRequiredUpgrade,
    samples,
    timeCoordinateName: "t",
    positionCoordinates: ["x", "y", "z"],
    coordinateVelocity: COORDINATE_VELOCITY,
    coordinateVelocityUnits: "m/s",
    effectiveTransportVelocityCoord: [
      ...representativeSample.effectiveTransportVelocityCoord,
    ] as WarpWorldlineVec3,
    dtau_dt: {
      representative: representativeSample.dtau_dt,
      min: Math.min(...dtau_dt_values),
      max: Math.max(...dtau_dt_values),
      units: "dimensionless",
      positivityRequired: true,
    },
    normalizationResidual: {
      representative: representativeSample.normalizationResidual,
      maxAbs: Math.max(...residual_values),
      tolerance: 1e-9,
      relation: "alpha^2 - gamma_ij(v^i+beta^i)(v^j+beta^j) - (d tau / dt)^2",
    },
    claimBoundary: ["bounded solve-backed transport contract only"],
    falsifierConditions: ["normalization_residual_exceeds_tolerance"],
  };
};

export const makeShiftLapseTransportPromotionGateFixture = (args?: {
  status?: WarpShiftLapseTransportPromotionGate["status"];
  reason?: string;
  transportCertificationStatus?: WarpTransportCertificationStatus;
  authoritativeLowExpansionStatus?: WarpShiftLapseTransportPromotionGate["authoritativeLowExpansionStatus"];
  authoritativeLowExpansionReason?: string;
  thetaKConsistencyStatus?: WarpShiftLapseTransportPromotionGate["thetaKConsistencyStatus"];
  wallSafetyStatus?: WarpShiftLapseTransportPromotionGate["wallSafetyStatus"];
  wallSafetyReason?: string;
  timingStatus?: WarpShiftLapseTransportPromotionGate["timingStatus"];
  timingReason?: string;
  centerlineAlpha?: number | null;
  centerlineDtauDt?: number | null;
  shiftLapseProfileId?: string | null;
  shiftLapseProfileStage?: string | null;
  shiftLapseProfileLabel?: string | null;
  shiftLapseProfileNote?: string | null;
}): WarpShiftLapseTransportPromotionGate => ({
  gateId: "nhm2_shift_lapse_transport_promotion_gate/v1",
  status: args?.status ?? "pass",
  reason: args?.reason ?? "shift_lapse_transport_promotion_gate_pass",
  shiftLapseProfileId: args?.shiftLapseProfileId ?? null,
  shiftLapseProfileStage: args?.shiftLapseProfileStage ?? null,
  shiftLapseProfileLabel: args?.shiftLapseProfileLabel ?? null,
  shiftLapseProfileNote: args?.shiftLapseProfileNote ?? null,
  familyAuthorityStatus: "candidate_authoritative_solve_family",
  familyTransportCertificationStatus: "bounded_transport_fail_closed_reference_only",
  transportCertificationStatus:
    args?.transportCertificationStatus ??
    "bounded_transport_proof_bearing_gate_admitted",
  authoritativeLowExpansionStatus: args?.authoritativeLowExpansionStatus ?? "pass",
  authoritativeLowExpansionReason:
    args?.authoritativeLowExpansionReason ?? "authoritative_low_expansion_ok",
  authoritativeLowExpansionSource: "gr_evolve_brick",
  authoritativeLowExpansionObservable: "brick_native_div_beta",
  divergenceRms: 1e-4,
  divergenceMaxAbs: 2e-4,
  divergenceTolerance: 1e-3,
  thetaKConsistencyStatus: args?.thetaKConsistencyStatus ?? "pass",
  thetaKResidualAbs: 1e-4,
  thetaKTolerance: 1e-3,
  wallSafetyStatus: args?.wallSafetyStatus ?? "pass",
  wallSafetyReason: args?.wallSafetyReason ?? "wall_safety_guardrail_ok",
  betaOverAlphaMax: 0.2,
  betaOutwardOverAlphaWallMax: 0.15,
  wallHorizonMargin: 0.4,
  timingStatus: args?.timingStatus ?? "available",
  timingReason: args?.timingReason ?? "centerline_lapse_timing_available",
  centerlineAlpha: args?.centerlineAlpha ?? 1,
  centerlineDtauDt: args?.centerlineDtauDt ?? 1,
});

export const makeShiftLapseWarpWorldlineFixture = (
  samples: WarpWorldlineSampleV1[] = makeInformativeWarpWorldlineSamples(),
  gate: WarpShiftLapseTransportPromotionGate = makeShiftLapseTransportPromotionGateFixture(),
): WarpWorldlineContractV1 => {
  const analysis = analyzeWarpWorldlineTransportVariation(samples);
  if (!analysis) {
    throw new Error("expected non-empty worldline sample family");
  }
  const representativeSample =
    samples.find((entry) => entry.sampleId === "centerline_center") ?? samples[0];
  const dtau_dt_values = samples.map((entry) => entry.dtau_dt);
  const residual_values = samples.map((entry) => Math.abs(entry.normalizationResidual));
  return {
    contractVersion: "warp_worldline_contract/v1",
    status: "bounded_solve_backed",
    certified: true,
    sourceSurface: {
      surfaceId: "nhm2_metric_local_comoving_transport_cross",
      producer: "server/energy-pipeline.ts",
      provenanceClass: "solve_backed",
      transportVectorSource: "warp.solveBackedTransportSampleFamily",
      transportVectorField: "shiftVectorField.evaluateShiftVector",
      metricT00Ref: "warp.metric.T00.nhm2.shift_lapse",
      metricT00Source: "metric",
      metricFamily: "nhm2_shift_lapse",
      familyAuthorityStatus: "candidate_authoritative_solve_family",
      transportCertificationStatus: "bounded_transport_proof_bearing_gate_admitted",
      metricT00ContractStatus: "ok",
      chartContractStatus: "ok",
      shiftLapseProfileId: gate.shiftLapseProfileId ?? null,
      shiftLapseTransportPromotionGate: gate,
    },
    chart: {
      label: "comoving_cartesian",
      coordinateMap: "comoving_cartesian: x' = x - x_s(t), t = t",
      chartFixed: true,
    },
    observerFamily: "ship_centerline_local_comoving",
    validityRegime: {
      regimeId: "nhm2_local_comoving_shell_cross",
      bounded: true,
      chartFixed: true,
      observerDefined: true,
      failClosedOutsideRegime: true,
      routeTimeCertified: false,
      description: "bounded local-comoving centerline-plus-shell-cross sample family",
      allowedSourceModels: ["warp_worldline_local_comoving"],
      deferredSourceModels: ["warp_worldline_route_time"],
      restrictions: [
        "deterministic_centerline_shell_cross_family_only",
        "coordinate_velocity_fixed_to_zero_in_comoving_chart",
        "effective_transport_velocity_is_local_shift_descriptor_not_certified_speed",
      ],
    },
    sampleGeometry: {
      familyId: "nhm2_centerline_shell_cross",
      description:
        "Deterministic bounded local-comoving shell-cross family with centerline and shell-proximal probes.",
      coordinateFrame: "comoving_cartesian",
      originDefinition: "ship_center",
      ordering: [
        "centerline_aft",
        "centerline_center",
        "centerline_fore",
        "shell_aft",
        "shell_fore",
        "shell_port",
        "shell_starboard",
        "shell_dorsal",
        "shell_ventral",
      ],
      representativeSampleId: "centerline_center",
      axes: {
        centerline: [1, 0, 0],
        portStarboard: [0, 1, 0],
        dorsalVentral: [0, 0, 1],
      },
      offsets_m: {
        centerline: 2.5,
        shellLongitudinal: 4.9,
        shellTransverse: 1.3,
        shellVertical: 0.9,
        shellClearance: 0.1,
      },
    },
    sampleCount: samples.length,
    representativeSampleId: "centerline_center",
    transportInterpretation: {
      coordinateVelocityFrame: "chart_fixed_comoving",
      coordinateVelocityInterpretation: "zero_by_chart_choice",
      transportTerm: "solve_backed_shift_term",
      effectiveTransportInterpretation: "bounded_local_comoving_descriptor_not_speed",
      certifiedSpeedMeaning: false,
      note:
        "Effective transport is a bounded local shift descriptor only. Even when shell-cross variation is present, it is not a certified speed or route-time answer.",
    },
    transportVariation: analysis.transportVariation,
    transportInformativenessStatus: analysis.transportInformativenessStatus,
    sampleFamilyAdequacy: analysis.sampleFamilyAdequacy,
    flatnessInterpretation: analysis.flatnessInterpretation,
    certifiedTransportMeaning: analysis.certifiedTransportMeaning,
    eligibleNextProducts: analysis.eligibleNextProducts,
    nextRequiredUpgrade: analysis.nextRequiredUpgrade,
    samples,
    timeCoordinateName: "t",
    positionCoordinates: ["x", "y", "z"],
    coordinateVelocity: COORDINATE_VELOCITY,
    coordinateVelocityUnits: "m/s",
    effectiveTransportVelocityCoord: [
      ...representativeSample.effectiveTransportVelocityCoord,
    ] as WarpWorldlineVec3,
    dtau_dt: {
      representative: representativeSample.dtau_dt,
      min: Math.min(...dtau_dt_values),
      max: Math.max(...dtau_dt_values),
      units: "dimensionless",
      positivityRequired: true,
    },
    normalizationResidual: {
      representative: representativeSample.normalizationResidual,
      maxAbs: Math.max(...residual_values),
      tolerance: 1e-9,
      relation: "alpha^2 - gamma_ij(v^i+beta^i)(v^j+beta^j) - (d tau / dt)^2",
    },
    claimBoundary: ["bounded solve-backed transport contract only"],
    falsifierConditions: ["shift_lapse_transport_promotion_gate_not_pass"],
  };
};

export const makeWarpCruiseEnvelopePreflightFixture = (
  worldline: WarpWorldlineContractV1 = makeWarpWorldlineFixture(),
): WarpCruiseEnvelopePreflightContractV1 => {
  const preflight = buildWarpCruiseEnvelopePreflightContractFromWorldline(worldline);
  if (!preflight) {
    throw new Error("expected bounded cruise-envelope preflight fixture");
  }
  return preflight;
};

export const makeWarpRouteTimeWorldlineFixture = (
  worldline: WarpWorldlineContractV1 = makeWarpWorldlineFixture(),
  preflight: WarpCruiseEnvelopePreflightContractV1 = makeWarpCruiseEnvelopePreflightFixture(
    worldline,
  ),
): WarpRouteTimeWorldlineContractV1 => {
  const routeTime = buildWarpRouteTimeWorldlineContract({ worldline, preflight });
  if (!routeTime) {
    throw new Error("expected bounded route-time worldline fixture");
  }
  return routeTime;
};

const TARGET_DISTANCE_BY_ID: Record<
  WarpMissionEstimatorTargetId,
  { name: string; parsecs: number }
> = {
  "alpha-cen-a": {
    name: "Alpha Centauri A",
    parsecs: 1.338,
  },
  proxima: {
    name: "Proxima Centauri",
    parsecs: 1.301,
  },
};

export const makeWarpMissionTargetDistanceFixture = (
  targetId: WarpMissionEstimatorTargetId = "alpha-cen-a",
): WarpMissionTargetDistanceContractV1 => {
  const target = TARGET_DISTANCE_BY_ID[targetId];
  const distanceMeters = target.parsecs * METERS_PER_PARSEC;
  return {
    contractVersion: LOCAL_REST_TARGET_DISTANCE_CONTRACT_VERSION,
    status: "catalog_distance_resolved",
    certified: true,
    catalogFamily: "committed_local_rest_epoch_snapshot",
    catalogSelectionRule: "max_epochMs_then_lexicographic_filename",
    snapshotPath:
      "server/_generated/local-rest_epoch-1763696773601_r-200pc_012fd60ec17881cc.json",
    snapshotEpochMs: 1763696773601,
    targetId,
    targetName: target.name,
    targetFrame: "heliocentric-icrs",
    targetEpochMs: 1763696773601,
    distanceMeters,
    distanceParsecs: target.parsecs,
    distanceLightYears: target.parsecs * LIGHT_YEARS_PER_PARSEC,
    sourceVectorNormMeters: distanceMeters,
    sourceCatalogRadiusPc: 200,
    sourceCatalogTotal: 3,
    claimBoundary: [
      "target distance resolved from committed local-rest epoch snapshot only",
      "not a route ETA by itself",
    ],
    falsifierConditions: [
      "committed_local_rest_snapshot_missing",
      "target_id_missing_from_snapshot",
    ],
  };
};

export const makeWarpMissionTimeEstimatorFixture = (args?: {
  worldline?: WarpWorldlineContractV1;
  preflight?: WarpCruiseEnvelopePreflightContractV1;
  routeTime?: WarpRouteTimeWorldlineContractV1;
  targetDistance?: WarpMissionTargetDistanceContractV1;
}): WarpMissionTimeEstimatorContractV1 => {
  const worldline = args?.worldline ?? makeWarpWorldlineFixture();
  const preflight =
    args?.preflight ?? makeWarpCruiseEnvelopePreflightFixture(worldline);
  const routeTime =
    args?.routeTime ?? makeWarpRouteTimeWorldlineFixture(worldline, preflight);
  const targetDistance =
    args?.targetDistance ?? makeWarpMissionTargetDistanceFixture();
  const mission = buildWarpMissionTimeEstimatorContract({
    worldline,
    preflight,
    routeTimeWorldline: routeTime,
    targetDistance,
  });
  if (!mission) {
    throw new Error("expected bounded mission-time estimator fixture");
  }
  return mission;
};

export const makeWarpMissionTimeComparisonFixture = (args?: {
  missionTimeEstimator?: WarpMissionTimeEstimatorContractV1;
}): WarpMissionTimeComparisonContractV1 => {
  const missionTimeEstimator =
    args?.missionTimeEstimator ?? makeWarpMissionTimeEstimatorFixture();
  const comparison = buildWarpMissionTimeComparisonContract({
    missionTimeEstimator,
  });
  if (!comparison) {
    throw new Error("expected bounded mission-time comparison fixture");
  }
  return comparison;
};

export const makeWarpCatalogEtaProjectionFixture = (args?: {
  missionTimeEstimator?: WarpMissionTimeEstimatorContractV1;
  missionTimeComparison?: WarpMissionTimeComparisonContractV1;
  selectedLaneId?: string;
  selectedProfileId?: string;
  metricFamily?: string;
  sourceSurfaceId?: string;
}): WarpCatalogEtaProjectionV1 => {
  const missionTimeEstimator =
    args?.missionTimeEstimator ?? makeWarpMissionTimeEstimatorFixture();
  const missionTimeComparison =
    args?.missionTimeComparison ??
    makeWarpMissionTimeComparisonFixture({ missionTimeEstimator });
  const sourcePosition: [number, number, number] = [3, 4, 0];
  const inputDistance = Math.hypot(...sourcePosition);
  const mappedRadiusSeconds = 2;
  const mappedRadiusMeters = mappedRadiusSeconds * 299_792_458;
  const outputPosition: [number, number, number] = [
    (sourcePosition[0] / inputDistance) * mappedRadiusMeters,
    (sourcePosition[1] / inputDistance) * mappedRadiusMeters,
    0,
  ];
  return {
    contractVersion: WARP_CATALOG_ETA_PROJECTION_CONTRACT_VERSION,
    status: "catalog_eta_projection_ready",
    certified: true,
    integrityStatus: "ok",
    claimTier: "diagnostic_catalog_eta_surface",
    frame: "heliocentric-icrs",
    metricFamily: args?.metricFamily ?? missionTimeEstimator.sourceSurface.metricFamily,
    selectedLaneId: args?.selectedLaneId ?? "nhm2_lane",
    selectedProfileId: args?.selectedProfileId ?? "stage1_centerline_alpha_0p8200_v1",
    defaultOperatingProfileId: "stage1_centerline_alpha_0p8200_v1",
    supportedBandFloorProfileId: "stage1_centerline_alpha_0p8000_v1",
    supportedBandCeilingProfileId: "stage1_centerline_alpha_0p995_v1",
    evidenceFloorProfileId: "stage1_centerline_alpha_0p7700_v1",
    evidenceFloorCenterlineAlpha: 0.77,
    supportBufferDeltaCenterlineAlpha: 0.03,
    sourceSurfaceId:
      args?.sourceSurfaceId ?? missionTimeEstimator.sourceSurface.surfaceId,
    sourceWorldlineContractId: "warp-worldline-latest",
    sourceWorldlineContractVersion: missionTimeEstimator.sourceWorldlineContractVersion,
    sourceRouteTimeWorldlineContractId: "warp-route-time-worldline-latest",
    sourceRouteTimeWorldlineContractVersion:
      missionTimeEstimator.sourceRouteTimeWorldlineContractVersion,
    sourceMissionTimeEstimatorContractId: "warp-mission-time-estimator-latest",
    sourceMissionTimeEstimatorContractVersion: missionTimeEstimator.contractVersion,
    sourceMissionTimeComparisonContractId: "warp-mission-time-comparison-latest",
    sourceMissionTimeComparisonContractVersion: missionTimeComparison.contractVersion,
    targetDistanceContractId: "local-rest-target-distance-latest",
    targetDistanceContractVersion: missionTimeEstimator.targetDistanceContractVersion,
    targetDistanceBasis: {
      frame: "heliocentric-icrs",
      snapshotPath: missionTimeEstimator.targetDistance.snapshotPath,
      snapshotEpochMs: missionTimeEstimator.targetDistance.epochMs,
      selectionRule: missionTimeEstimator.targetDistance.selectionRule,
    },
    radiusMeaning: "proper_time",
    claimBoundary: [
      "catalog-facing ETA projection only",
      "not a direct metric or viability promotion surface",
    ],
    falsifierConditions: [
      "mission_time_estimator_contract_missing",
      "catalog_entry_missing_from_projection",
    ],
    nonClaims: [
      "not a wall-safety surface",
      "not a lapse diagnostic surface",
      "not a direct speed certificate",
    ],
    entries: [
      {
        id: "demo",
        label: "Demo",
        inputPosition_m: sourcePosition,
        inputDistance_m: inputDistance,
        properTimeEstimate_s: mappedRadiusSeconds,
        coordinateTimeEstimate_s: 3,
        mappedRadius_s: mappedRadiusSeconds,
        outputPosition_m: outputPosition,
      },
    ],
  };
};

export const makeWarpCruiseEnvelopeFixture = (args?: {
  preflight?: WarpCruiseEnvelopePreflightContractV1;
  routeTime?: WarpRouteTimeWorldlineContractV1;
  missionTimeEstimator?: WarpMissionTimeEstimatorContractV1;
  missionTimeComparison?: WarpMissionTimeComparisonContractV1;
}): WarpCruiseEnvelopeContractV1 => {
  const worldline = makeWarpWorldlineFixture();
  const preflight =
    args?.preflight ?? makeWarpCruiseEnvelopePreflightFixture(worldline);
  const routeTime =
    args?.routeTime ?? makeWarpRouteTimeWorldlineFixture(worldline, preflight);
  const missionTimeEstimator =
    args?.missionTimeEstimator ??
    makeWarpMissionTimeEstimatorFixture({ preflight, routeTime });
  const missionTimeComparison =
    args?.missionTimeComparison ??
    makeWarpMissionTimeComparisonFixture({ missionTimeEstimator });
  const cruiseEnvelope = buildWarpCruiseEnvelopeContract({
    preflight,
    routeTimeWorldline: routeTime,
    missionTimeEstimator,
    missionTimeComparison,
  });
  if (!cruiseEnvelope) {
    throw new Error("expected certified bounded cruise-envelope fixture");
  }
  return cruiseEnvelope;
};

const IN_HULL_SAMPLE_ORDER: WarpInHullProperAccelerationSampleRole[] = [
  "cabin_center",
  "cabin_fore",
  "cabin_aft",
  "cabin_port",
  "cabin_starboard",
  "cabin_dorsal",
  "cabin_ventral",
];

const makeInHullSamplingGeometry = (): WarpInHullProperAccelerationSamplingGeometry => ({
  familyId: "nhm2_cabin_cross",
  description: "Deterministic bounded cabin-cross family.",
  coordinateFrame: "comoving_cartesian",
  originDefinition: "ship_center",
  ordering: [...IN_HULL_SAMPLE_ORDER],
  representativeSampleId: "cabin_center",
  axes: {
    centerline: [1, 0, 0],
    portStarboard: [0, 1, 0],
    dorsalVentral: [0, 0, 1],
  },
  offsets_m: {
    centerline: 10,
    transverse: 3,
    vertical: 2,
    interiorClearance: 0.5,
  },
  samplePositions_m: {
    cabin_center: [0, 0, 0],
    cabin_fore: [10, 0, 0],
    cabin_aft: [-10, 0, 0],
    cabin_port: [0, 3, 0],
    cabin_starboard: [0, -3, 0],
    cabin_dorsal: [0, 0, 2],
    cabin_ventral: [0, 0, -2],
  },
});

const makeInHullAccelerationSamples = (
  geomMagnitudesPerM: Record<WarpInHullProperAccelerationSampleRole, number>,
) =>
  IN_HULL_SAMPLE_ORDER.map((sampleId) => {
    const position_m = makeInHullSamplingGeometry().samplePositions_m[sampleId];
    const properAccelerationGeomMagnitude_per_m = geomMagnitudesPerM[sampleId];
    const properAccelerationMagnitude_mps2 = properAccelerationGeomToMps2(
      properAccelerationGeomMagnitude_per_m,
    );
    const vector: WarpInHullProperAccelerationVec3 =
      sampleId === "cabin_fore" || sampleId === "cabin_aft"
        ? [properAccelerationGeomMagnitude_per_m, 0, 0]
        : sampleId === "cabin_port" || sampleId === "cabin_starboard"
          ? [0, properAccelerationGeomMagnitude_per_m, 0]
          : [0, 0, properAccelerationGeomMagnitude_per_m];
    return {
      sampleId,
      sampleRole: sampleId,
      position_m,
      properAccelerationGeomVector_per_m: vector,
      properAccelerationGeomMagnitude_per_m,
      properAccelerationMagnitude_mps2,
      properAccelerationMagnitude_g: properAccelerationMps2ToG(
        properAccelerationMagnitude_mps2,
      ),
    };
  });

export const makeWarpInHullProperAccelerationFixture = (args?: {
  zeroProfile?: boolean;
  directProfileMagnitudesPerM?: Partial<
    Record<WarpInHullProperAccelerationSampleRole, number>
  >;
}): WarpInHullProperAccelerationContractV1 => {
  const geometry = makeInHullSamplingGeometry();
  const directMagnitudes: Record<WarpInHullProperAccelerationSampleRole, number> = {
    cabin_center: 0,
    cabin_fore: 2e-16,
    cabin_aft: 1.5e-16,
    cabin_port: 8e-17,
    cabin_starboard: 8e-17,
    cabin_dorsal: 1.1e-16,
    cabin_ventral: 1.1e-16,
    ...(args?.directProfileMagnitudesPerM ?? {}),
  };
  const sampleSummaries = makeInHullAccelerationSamples(
    args?.zeroProfile
      ? {
          cabin_center: 0,
          cabin_fore: 0,
          cabin_aft: 0,
          cabin_port: 0,
          cabin_starboard: 0,
          cabin_dorsal: 0,
          cabin_ventral: 0,
        }
      : directMagnitudes,
  );
  const contract = buildWarpInHullProperAccelerationContract({
    sourceSurface: {
      surfaceId: "nhm2_metric_in_hull_proper_acceleration_profile",
      producer: "server/energy-pipeline.ts",
      provenanceClass: "solve_backed",
      brickChannelSource: "gr_evolve_brick",
      accelerationField: "eulerian_accel_geom_*",
      metricT00Ref: "warp.metric.T00.natario_sdf.shift",
      metricT00Source: "metric",
      metricFamily: "natario_sdf",
      familyAuthorityStatus: "canonical_bounded_baseline_solve_family",
      transportCertificationStatus: "bounded_transport_proof_bearing_baseline",
      metricT00ContractStatus: "ok",
      chartContractStatus: "ok",
      brickStatus: "CERTIFIED",
      brickSolverStatus: "CERTIFIED",
    },
    chart: {
      label: "comoving_cartesian",
      coordinateMap: "comoving_cartesian: x' = x - x_s(t), t = t",
      chartFixed: true,
    },
    samplingGeometry: geometry,
    sampleSummaries,
    resolutionAdequacy: {
      status: args?.zeroProfile
        ? "adequate_constant_lapse_zero_profile"
        : "adequate_direct_brick_profile",
      criterionId: "direct_gr_evolve_brick_no_fallback_v1",
      criterionMeaning: "Direct gr-evolve brick channels only, no analytic fallback.",
      brickDims: [24, 24, 24],
      voxelSize_m: [1, 1, 1],
      wholeBrickAccelerationAbsMax_per_m: args?.zeroProfile ? 0 : 2e-16,
      wholeBrickGradientAbsMax_per_m: args?.zeroProfile ? 0 : 2e-16,
      allSampleMagnitudesZero: Boolean(args?.zeroProfile),
      expectedZeroProfileByModel: Boolean(args?.zeroProfile),
      note: args?.zeroProfile
        ? "Constant-lapse zero profile."
        : "Direct brick profile resolved.",
    },
  });
  if (!contract) {
    throw new Error("expected certified in-hull proper-acceleration fixture");
  }
  return contract;
};

export const makeShiftLapseWarpInHullProperAccelerationFixture = (args?: {
  zeroProfile?: boolean;
  directProfileMagnitudesPerM?: Partial<
    Record<WarpInHullProperAccelerationSampleRole, number>
  >;
  gate?: WarpShiftLapseTransportPromotionGate;
}): WarpInHullProperAccelerationContractV1 => {
  const gate =
    args?.gate ?? makeShiftLapseTransportPromotionGateFixture();
  const geometry = makeInHullSamplingGeometry();
  const directMagnitudes: Record<WarpInHullProperAccelerationSampleRole, number> = {
    cabin_center: 0,
    cabin_fore: 2e-16,
    cabin_aft: 1.5e-16,
    cabin_port: 8e-17,
    cabin_starboard: 8e-17,
    cabin_dorsal: 1.1e-16,
    cabin_ventral: 1.1e-16,
    ...(args?.directProfileMagnitudesPerM ?? {}),
  };
  const sampleSummaries = makeInHullAccelerationSamples(
    args?.zeroProfile
      ? {
          cabin_center: 0,
          cabin_fore: 0,
          cabin_aft: 0,
          cabin_port: 0,
          cabin_starboard: 0,
          cabin_dorsal: 0,
          cabin_ventral: 0,
        }
      : directMagnitudes,
  );
  const contract = buildWarpInHullProperAccelerationContract({
    sourceSurface: {
      surfaceId: "nhm2_metric_in_hull_proper_acceleration_profile",
      producer: "server/energy-pipeline.ts",
      provenanceClass: "solve_backed",
      brickChannelSource: "gr_evolve_brick",
      accelerationField: "eulerian_accel_geom_*",
      metricT00Ref: "warp.metric.T00.nhm2.shift_lapse",
      metricT00Source: "metric",
      metricFamily: "nhm2_shift_lapse",
      familyAuthorityStatus: "candidate_authoritative_solve_family",
      transportCertificationStatus: "bounded_transport_proof_bearing_gate_admitted",
      metricT00ContractStatus: "ok",
      chartContractStatus: "ok",
      brickStatus: "CERTIFIED",
      brickSolverStatus: "CERTIFIED",
      shiftLapseProfileId: gate.shiftLapseProfileId ?? null,
      shiftLapseTransportPromotionGate: gate,
    },
    chart: {
      label: "comoving_cartesian",
      coordinateMap: "comoving_cartesian: x' = x - x_s(t), t = t",
      chartFixed: true,
    },
    samplingGeometry: geometry,
    sampleSummaries,
    resolutionAdequacy: {
      status: args?.zeroProfile
        ? "adequate_constant_lapse_zero_profile"
        : "adequate_direct_brick_profile",
      criterionId: "direct_gr_evolve_brick_no_fallback_v1",
      criterionMeaning: "Direct gr-evolve brick channels only, no analytic fallback.",
      brickDims: [24, 24, 24],
      voxelSize_m: [1, 1, 1],
      wholeBrickAccelerationAbsMax_per_m: args?.zeroProfile ? 0 : 2e-16,
      wholeBrickGradientAbsMax_per_m: args?.zeroProfile ? 0 : 2e-16,
      allSampleMagnitudesZero: Boolean(args?.zeroProfile),
      expectedZeroProfileByModel: Boolean(args?.zeroProfile),
      note: args?.zeroProfile
        ? "Constant-lapse zero profile."
        : "Direct brick profile resolved.",
    },
  });
  if (!contract) {
    throw new Error("expected certified shift-lapse in-hull proper-acceleration fixture");
  }
  return contract;
};
