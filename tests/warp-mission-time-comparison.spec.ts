import { describe, expect, it } from "vitest";
import {
  buildWarpMissionTimeComparisonContract,
  isCertifiedWarpMissionTimeComparisonContract,
} from "../shared/contracts/warp-mission-time-comparison.v1";
import {
  makeShiftLapseTransportPromotionGateFixture,
  makeShiftLapseWarpWorldlineFixture,
  makeWarpCruiseEnvelopePreflightFixture,
  makeWarpRouteTimeWorldlineFixture,
  makeWarpMissionTimeComparisonFixture,
  makeWarpMissionTimeEstimatorFixture,
} from "./helpers/warp-worldline-fixture";

describe("warp mission-time comparison contract", () => {
  it("builds a deterministic bounded comparison from the certified mission-time estimator", () => {
    const comparison = makeWarpMissionTimeComparisonFixture();
    const second = makeWarpMissionTimeComparisonFixture();

    expect(second).toEqual(comparison);
    expect(comparison.status).toBe("bounded_target_coupled_comparison_ready");
    expect(comparison.comparisonModelId).toBe(
      "nhm2_classical_no_time_dilation_reference",
    );
    expect(comparison.targetId).toBe("alpha-cen-a");
    expect(comparison.warpCoordinateTimeEstimate.seconds).toBeGreaterThan(0);
    expect(comparison.warpProperTimeEstimate.seconds).toBeGreaterThan(0);
    expect(comparison.classicalReferenceTimeEstimate.seconds).toBeGreaterThan(0);
    expect(
      comparison.comparisonMetrics.interpretationStatus,
    ).toBe("bounded_relativistic_differential_detected");
    expect(comparison.comparisonMetrics.properMinusCoordinate_seconds).toBeLessThan(0);
    expect(comparison.comparisonMetrics.properMinusClassical_seconds).toBeLessThan(0);
    expect(comparison.deferredComparators).toEqual([
      "speed_based_nonrelativistic_reference",
      "speed_based_flat_sr_reference",
      "route_map_eta_surface",
      "broad_relativistic_advantage_certification",
    ]);
    expect(isCertifiedWarpMissionTimeComparisonContract(comparison)).toBe(true);
  });

  it("fails closed when mission-estimator inputs are missing, non-certified, or not comparison-ready", () => {
    const estimator = makeWarpMissionTimeEstimatorFixture();
    expect(
      buildWarpMissionTimeComparisonContract({
        missionTimeEstimator: null,
      }),
    ).toBeNull();
    expect(
      buildWarpMissionTimeComparisonContract({
        missionTimeEstimator: {
          ...estimator,
          certified: false,
        } as any,
      }),
    ).toBeNull();
    expect(
      buildWarpMissionTimeComparisonContract({
        missionTimeEstimator: {
          ...estimator,
          comparisonReadiness: "deferred",
        } as any,
      }),
    ).toBeNull();
    expect(
      buildWarpMissionTimeComparisonContract({
        missionTimeEstimator: {
          ...estimator,
          nextEligibleProducts: [],
        } as any,
      }),
    ).toBeNull();
  });

  it("preserves zero-difference cases honestly when the certified mission estimator reports tau=t", () => {
    const estimator = makeWarpMissionTimeEstimatorFixture();
    const comparison = buildWarpMissionTimeComparisonContract({
      missionTimeEstimator: {
        ...estimator,
        properTimeEstimate: {
          ...estimator.coordinateTimeEstimate,
          meaning: estimator.properTimeEstimate.meaning,
        },
      },
    });

    expect(comparison).not.toBeNull();
    expect(comparison?.comparisonMetrics.interpretationStatus).toBe(
      "no_certified_relativistic_differential_detected",
    );
    expect(comparison?.comparisonMetrics.properMinusCoordinate_seconds).toBeCloseTo(
      0,
      12,
    );
    expect(comparison?.comparisonMetrics.properMinusClassical_seconds).toBeCloseTo(
      0,
      12,
    );
  });

  it("rejects forged or weakened comparison contracts", () => {
    const comparison = makeWarpMissionTimeComparisonFixture();
    expect(isCertifiedWarpMissionTimeComparisonContract(comparison)).toBe(true);
    expect(
      isCertifiedWarpMissionTimeComparisonContract({
        ...comparison,
        comparisonModelId: "forged",
      }),
    ).toBe(false);
    expect(
      isCertifiedWarpMissionTimeComparisonContract({
        ...comparison,
        sourceSurface: {
          ...comparison.sourceSurface,
          provenanceClass: "proxy",
        },
      }),
    ).toBe(false);
    expect(
      isCertifiedWarpMissionTimeComparisonContract({
        ...comparison,
        deferredComparators: ["speed_based_flat_sr_reference"],
      }),
    ).toBe(false);
  });

  it("keeps admitted nhm2_shift_lapse mission comparison bounded and honest when tau=t", () => {
    const worldline = makeShiftLapseWarpWorldlineFixture();
    const preflight = makeWarpCruiseEnvelopePreflightFixture(worldline);
    const routeTime = makeWarpRouteTimeWorldlineFixture(worldline, preflight);
    const estimator = makeWarpMissionTimeEstimatorFixture({
      worldline,
      preflight,
      routeTime,
    });
    const comparison = buildWarpMissionTimeComparisonContract({
      missionTimeEstimator: {
        ...estimator,
        properTimeEstimate: {
          ...estimator.coordinateTimeEstimate,
          meaning: estimator.properTimeEstimate.meaning,
        },
      },
    });

    expect(comparison).not.toBeNull();
    expect(comparison?.sourceSurface.metricFamily).toBe("nhm2_shift_lapse");
    expect(comparison?.sourceSurface.familyAuthorityStatus).toBe(
      "candidate_authoritative_solve_family",
    );
    expect(comparison?.sourceSurface.transportCertificationStatus).toBe(
      "bounded_transport_proof_bearing_gate_admitted",
    );
    expect(comparison?.sourceSurface.shiftLapseTransportPromotionGate?.status).toBe("pass");
    expect(comparison?.comparisonMetrics.interpretationStatus).toBe(
      "no_certified_relativistic_differential_detected",
    );
    expect(comparison?.comparisonMetrics.properMinusCoordinate_seconds).toBeCloseTo(0, 12);
    expect(comparison?.comparisonMetrics.properMinusClassical_seconds).toBeCloseTo(0, 12);
    expect(isCertifiedWarpMissionTimeComparisonContract(comparison)).toBe(true);
  });

  it("reports a bounded differential for an admitted tuned nhm2_shift_lapse profile without adding speed semantics", () => {
    const tunedAlpha = 0.995;
    const worldline = makeShiftLapseWarpWorldlineFixture(
      undefined,
      makeShiftLapseTransportPromotionGateFixture({
        centerlineAlpha: tunedAlpha,
        centerlineDtauDt: tunedAlpha,
        shiftLapseProfileId: "stage1_centerline_alpha_0p995_v1",
        shiftLapseProfileStage: "controlled_tuning_stage_1",
      }),
    );
    const preflight = makeWarpCruiseEnvelopePreflightFixture(worldline);
    const routeTime = makeWarpRouteTimeWorldlineFixture(worldline, preflight);
    const estimator = makeWarpMissionTimeEstimatorFixture({
      worldline,
      preflight,
      routeTime,
    });
    const comparison = buildWarpMissionTimeComparisonContract({
      missionTimeEstimator: estimator,
    });

    expect(comparison).not.toBeNull();
    expect(comparison?.sourceSurface.metricFamily).toBe("nhm2_shift_lapse");
    expect(comparison?.sourceSurface.shiftLapseProfileId).toBe(
      "stage1_centerline_alpha_0p995_v1",
    );
    expect(comparison?.sourceSurface.shiftLapseTransportPromotionGate?.status).toBe("pass");
    expect(comparison?.comparisonMetrics.interpretationStatus).toBe(
      "bounded_relativistic_differential_detected",
    );
    expect(
      Math.abs(comparison?.comparisonMetrics.properMinusCoordinate_seconds ?? 0),
    ).toBeGreaterThan(0);
    expect(comparison?.deferredComparators).toContain("speed_based_flat_sr_reference");
    expect(isCertifiedWarpMissionTimeComparisonContract(comparison)).toBe(true);
  });
});
