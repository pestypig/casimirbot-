import { describe, expect, it } from "vitest";

import {
  NHM2_TRIP_CLOCKING_DIAGNOSTIC_CONTRACT_VERSION,
  buildNhm2TripClockingDiagnosticContract,
  isNhm2TripClockingDiagnosticContract,
} from "../shared/contracts/nhm2-trip-clocking-diagnostic.v1";
import {
  WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION,
  type WarpMissionTimeComparisonContractV1,
} from "../shared/contracts/warp-mission-time-comparison.v1";
import {
  WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION,
  type WarpMissionTimeEstimatorContractV1,
} from "../shared/contracts/warp-mission-time-estimator.v1";
import {
  WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION,
  type WarpRouteTimeWorldlineContractV1,
} from "../shared/contracts/warp-route-time-worldline.v1";
import type { WarpWorldlineSourceSurface } from "../shared/contracts/warp-worldline-contract.v1";

const sourceSurface = (
  selectedProfileId: string,
  alpha: number,
): WarpWorldlineSourceSurface => ({
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
  shiftLapseProfileId: selectedProfileId,
  shiftLapseTransportPromotionGate: {
    gateId: "nhm2_shift_lapse_transport_promotion_gate/v1",
    status: "pass",
    reason: "shift_lapse_transport_promotion_gate_pass",
    shiftLapseProfileId: selectedProfileId,
    shiftLapseProfileStage: "controlled_tuning_stage_1",
    shiftLapseProfileLabel: null,
    shiftLapseProfileNote: "clocking diagnostic fixture",
    familyAuthorityStatus: "candidate_authoritative_solve_family",
    familyTransportCertificationStatus:
      "bounded_transport_proof_bearing_gate_admitted",
    transportCertificationStatus: "bounded_transport_proof_bearing_gate_admitted",
    authoritativeLowExpansionStatus: "pass",
    authoritativeLowExpansionReason: "fixture",
    authoritativeLowExpansionSource: "gr_evolve_brick",
    authoritativeLowExpansionObservable: "brick_native_div_beta",
    divergenceRms: 0,
    divergenceMaxAbs: 0,
    divergenceTolerance: 1e-9,
    thetaKConsistencyStatus: "pass",
    thetaKResidualAbs: 0,
    thetaKTolerance: 1e-9,
    wallSafetyStatus: "pass",
    wallSafetyReason: "wall_safety_guardrail_ok",
    betaOverAlphaMax: 0.01483479440521692,
    betaOutwardOverAlphaWallMax: 0,
    wallHorizonMargin: 0.985165205594783,
    timingStatus: "available",
    timingReason: "fixture",
    centerlineAlpha: alpha,
    centerlineDtauDt: alpha,
  },
});

const profileId = "stage1_centerline_alpha_0p995_v1";
const coordinateSeconds = 137_755_965.9171795;
const properSeconds = 137_067_186.0875936;
const coordinateYears = 4.3652231448899625;
const properYears = 4.343397029165513;
const targetDistanceLightYears = 4.365218089591392;

const scalarEstimate = (seconds: number, years: number, meaning: string) => ({
  seconds,
  years,
  units: { primary: "s" as const, secondary: "yr" as const },
  meaning,
});

const alphaForProfile = (id: string): number =>
  id.includes("0p7000") ? 0.7 : 0.995;

const routeTime = (id = profileId): WarpRouteTimeWorldlineContractV1 =>
  ({
    contractVersion: WARP_ROUTE_TIME_WORLDLINE_CONTRACT_VERSION,
    sourceSurface: sourceSurface(id, alphaForProfile(id)),
    descriptorScheduleSummary: {
      quantityId: "bounded_local_transport_descriptor_norm",
      quantityMeaning: "fixture",
      quantityUnits: "dimensionless",
      representative: 0.014,
      min: 0,
      max: 0.01483479440521692,
      spread: 0.01483479440521692,
    },
  }) as WarpRouteTimeWorldlineContractV1;

const estimator = (id = profileId): WarpMissionTimeEstimatorContractV1 =>
  ({
    contractVersion: WARP_MISSION_TIME_ESTIMATOR_CONTRACT_VERSION,
    sourceSurface: sourceSurface(id, alphaForProfile(id)),
    targetName: "Alpha Centauri A",
    targetDistance: {
      meters: 41_298_199_626_475_464,
      parsecs: 1.338383500408207,
      lightYears: targetDistanceLightYears,
      epochMs: 1_763_696_773_601,
      snapshotPath: "server/_generated/local-rest.json",
      selectionRule: "max_epochMs_then_lexicographic_filename",
    },
    coordinateTimeEstimate: scalarEstimate(
      coordinateSeconds,
      coordinateYears,
      "coordinate fixture",
    ),
    properTimeEstimate: scalarEstimate(
      properSeconds,
      properYears,
      "proper fixture",
    ),
  }) as WarpMissionTimeEstimatorContractV1;

const comparison = (
  id = profileId,
  overrideProperSeconds = properSeconds,
  overrideProperYears = properYears,
): WarpMissionTimeComparisonContractV1 =>
  ({
    contractVersion: WARP_MISSION_TIME_COMPARISON_CONTRACT_VERSION,
    sourceSurface: sourceSurface(id, alphaForProfile(id)),
    targetName: "Alpha Centauri A",
    warpCoordinateTimeEstimate: scalarEstimate(
      coordinateSeconds,
      coordinateYears,
      "coordinate fixture",
    ),
    warpProperTimeEstimate: scalarEstimate(
      overrideProperSeconds,
      overrideProperYears,
      "proper fixture",
    ),
    comparisonMetrics: {
      properMinusCoordinate_seconds: overrideProperSeconds - coordinateSeconds,
      properVsCoordinate_ratio: overrideProperSeconds / coordinateSeconds,
      properMinusClassical_seconds: overrideProperSeconds - coordinateSeconds,
      properVsClassical_ratio: overrideProperSeconds / coordinateSeconds,
      coordinateMinusClassical_seconds: 0,
      coordinateVsClassical_ratio: 1,
      interpretationStatus: "bounded_relativistic_differential_detected",
      differentialToleranceSeconds: 0.0001377559659171795,
    },
  }) as WarpMissionTimeComparisonContractV1;

describe("nhm2_trip_clocking_diagnostic/v1", () => {
  it("computes one-way and mirrored round-trip clocking for the 0p995 anchor", () => {
    const artifact = buildNhm2TripClockingDiagnosticContract({
      routeTimeWorldline: routeTime(),
      missionTimeEstimator: estimator(),
      missionTimeComparison: comparison(),
      expectedSelectedProfileId: profileId,
      generatedAt: "2026-06-15T00:00:00.000Z",
    });

    expect(artifact?.contractVersion).toBe(
      NHM2_TRIP_CLOCKING_DIAGNOSTIC_CONTRACT_VERSION,
    );
    expect(artifact?.tripClockingComputed).toBe(true);
    expect(artifact?.profile).toMatchObject({
      selectedProfileId: profileId,
      alphaCenterline: 0.995,
    });
    expect(artifact?.oneWay.shipYoungerByDays).toBeCloseTo(7.971989, 6);
    expect(artifact?.roundTripMirrorDiagnostic.shipYoungerByDays).toBeCloseTo(
      15.943978,
      6,
    );
    expect(isNhm2TripClockingDiagnosticContract(artifact)).toBe(true);
  });

  it("marks SR beta as analogy only, not a speed claim", () => {
    const artifact = buildNhm2TripClockingDiagnosticContract({
      routeTimeWorldline: routeTime(),
      missionTimeEstimator: estimator(),
      missionTimeComparison: comparison(),
      expectedSelectedProfileId: profileId,
    });

    expect(artifact?.speedLikeQuantities.srEquivalentBetaForAlpha).toBeCloseTo(
      0.0998749218,
      10,
    );
    expect(artifact?.speedLikeQuantities.interpretation).toBe(
      "analogy_only_not_speed",
    );
    expect(artifact?.claimBoundary.srEquivalentBetaIsAnalogyOnly).toBe(true);
  });

  it("keeps route, speed, and physical viability claims locked false", () => {
    const artifact = buildNhm2TripClockingDiagnosticContract({
      routeTimeWorldline: routeTime(),
      missionTimeEstimator: estimator(),
      missionTimeComparison: comparison(),
      expectedSelectedProfileId: profileId,
      fullSolveClosurePassed: true,
    });

    expect(artifact?.fullSolveClosurePassed).toBe(true);
    expect(artifact?.routeEtaCertified).toBe(false);
    expect(artifact?.maxSpeedCertified).toBe(false);
    expect(artifact?.physicalViabilityClaimAllowed).toBe(false);
    expect(artifact?.claimBoundary.doesNotCertifyShipSpeed).toBe(true);
    expect(artifact?.claimBoundary.doesNotCertifyRouteEta).toBe(true);
    expect(artifact?.claimBoundary.doesNotCertifyPhysicalViability).toBe(true);
  });

  it("fails closed on the alpha latest trap: 0p995 anchor mixed with 0p7000 mission latest", () => {
    const artifact = buildNhm2TripClockingDiagnosticContract({
      routeTimeWorldline: routeTime(profileId),
      missionTimeEstimator: estimator("stage1_centerline_alpha_0p7000_v1"),
      missionTimeComparison: comparison(profileId),
      expectedSelectedProfileId: profileId,
    });

    expect(artifact).toBeNull();
  });

  it("fails closed when all inputs are 0p7000 but the expected whitepaper anchor is 0p995", () => {
    const artifact = buildNhm2TripClockingDiagnosticContract({
      routeTimeWorldline: routeTime("stage1_centerline_alpha_0p7000_v1"),
      missionTimeEstimator: estimator("stage1_centerline_alpha_0p7000_v1"),
      missionTimeComparison: comparison("stage1_centerline_alpha_0p7000_v1"),
      expectedSelectedProfileId: profileId,
    });

    expect(artifact).toBeNull();
  });

  it("fails closed when declared alpha disagrees with the comparison clock ratio", () => {
    const artifact = buildNhm2TripClockingDiagnosticContract({
      routeTimeWorldline: routeTime(profileId),
      missionTimeEstimator: estimator(profileId),
      missionTimeComparison: comparison(profileId, coordinateSeconds * 0.7, 3.055656201422974),
      expectedSelectedProfileId: profileId,
    });

    expect(artifact).toBeNull();
  });

  it("does not emit forbidden route/speed/viability copy", () => {
    const artifact = buildNhm2TripClockingDiagnosticContract({
      routeTimeWorldline: routeTime(),
      missionTimeEstimator: estimator(),
      missionTimeComparison: comparison(),
      expectedSelectedProfileId: profileId,
    });
    const text = JSON.stringify(artifact);

    expect(text).not.toMatch(/\bcertified speed\b/i);
    expect(text).not.toMatch(/\btrue ETA\b/i);
    expect(text).not.toMatch(/\bphysical warp trip\b/i);
  });
});
