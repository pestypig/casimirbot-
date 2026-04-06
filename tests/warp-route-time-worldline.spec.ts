import { describe, expect, it } from "vitest";
import {
  buildWarpRouteTimeWorldlineContract,
  isCertifiedWarpRouteTimeWorldlineContract,
} from "../shared/contracts/warp-route-time-worldline.v1";
import {
  makeWarpCruiseEnvelopePreflightFixture,
  makeShiftLapseWarpWorldlineFixture,
  makeWarpRouteTimeWorldlineFixture,
  makeWarpWorldlineFixture,
} from "./helpers/warp-worldline-fixture";

describe("warp route-time worldline contract", () => {
  it("builds a deterministic bounded route-time progression from certified worldline and preflight inputs", () => {
    const worldline = makeWarpWorldlineFixture();
    const preflight = makeWarpCruiseEnvelopePreflightFixture(worldline);
    const first = buildWarpRouteTimeWorldlineContract({ worldline, preflight });
    const second = buildWarpRouteTimeWorldlineContract({ worldline, preflight });

    expect(first).not.toBeNull();
    expect(second).toEqual(first);
    expect(first?.status).toBe("bounded_route_time_ready");
    expect(first?.routeModelId).toBe("nhm2_bounded_local_probe_lambda");
    expect(first?.routeParameterName).toBe("lambda");
    expect(first?.progressionSampleCount).toBe(5);
    expect(first?.progressionSamples.map((entry) => entry.sourceSampleId)).toEqual([
      "shell_aft",
      "centerline_aft",
      "centerline_center",
      "centerline_fore",
      "shell_fore",
    ]);
    const lambda = first?.progressionSamples.map((entry) => entry.routeParameterValue) ?? [];
    expect(lambda).toHaveLength(5);
    expect(lambda[0]).toBeCloseTo(0, 12);
    expect(lambda[1]).toBeCloseTo(0.24489795918367346, 12);
    expect(lambda[2]).toBeCloseTo(0.5, 12);
    expect(lambda[3]).toBeCloseTo(0.7551020408163265, 12);
    expect(lambda[4]).toBeCloseTo(1, 12);
    expect(first?.coordinateTimeSummary.start).toBe(0);
    expect(first?.coordinateTimeSummary.end ?? 0).toBeGreaterThan(0);
    expect(first?.properTimeSummary.end ?? 0).toBeGreaterThan(0);
    expect(first?.routeTimeStatus).toBe("bounded_local_segment_certified");
    expect(first?.nextEligibleProducts).toEqual(["mission_time_estimator"]);
    expect(isCertifiedWarpRouteTimeWorldlineContract(first)).toBe(true);
  });

  it("fails closed when worldline or preflight inputs are missing or forged", () => {
    expect(buildWarpRouteTimeWorldlineContract({ worldline: null, preflight: null })).toBeNull();
    expect(
      buildWarpRouteTimeWorldlineContract({
        worldline: makeWarpWorldlineFixture(),
        preflight: {
          contractVersion: "warp_cruise_envelope_preflight/v1",
          certified: true,
        } as any,
      }),
    ).toBeNull();
  });

  it("rejects forged partial route-time contracts that omit strict provenance and monotonic summaries", () => {
    expect(
      isCertifiedWarpRouteTimeWorldlineContract({
        contractVersion: "warp_route_time_worldline/v1",
        status: "bounded_route_time_ready",
        certified: true,
        progressionSamples: [],
      }),
    ).toBe(false);
  });

  it("keeps progression ordering monotone and target-distance claims deferred", () => {
    const routeTime = makeWarpRouteTimeWorldlineFixture();
    const lambda = routeTime.progressionSamples.map((entry) => entry.routeParameterValue);
    const coordinate = routeTime.progressionSamples.map((entry) => entry.coordinateTime_s);
    const proper = routeTime.progressionSamples.map((entry) => entry.cumulativeProperTime_s);

    expect(lambda).toEqual([...lambda].sort((lhs, rhs) => lhs - rhs));
    expect(coordinate).toEqual([...coordinate].sort((lhs, rhs) => lhs - rhs));
    expect(proper).toEqual([...proper].sort((lhs, rhs) => lhs - rhs));
    expect(routeTime.nonClaims).toContain("not mission-time certified");
    expect(routeTime.nonClaims).toContain("not route ETA to a real target");
  });

  it("admits a gate-passed nhm2_shift_lapse family through the certified route-time contract", () => {
    const worldline = makeShiftLapseWarpWorldlineFixture();
    const preflight = makeWarpCruiseEnvelopePreflightFixture(worldline);
    const routeTime = buildWarpRouteTimeWorldlineContract({ worldline, preflight });

    expect(routeTime).not.toBeNull();
    expect(routeTime?.sourceSurface.metricFamily).toBe("nhm2_shift_lapse");
    expect(routeTime?.sourceSurface.familyAuthorityStatus).toBe(
      "candidate_authoritative_solve_family",
    );
    expect(routeTime?.sourceSurface.transportCertificationStatus).toBe(
      "bounded_transport_proof_bearing_gate_admitted",
    );
    expect(routeTime?.sourceSurface.shiftLapseTransportPromotionGate?.status).toBe("pass");
    expect(routeTime?.routeTimeStatus).toBe("bounded_local_segment_certified");
    expect(isCertifiedWarpRouteTimeWorldlineContract(routeTime)).toBe(true);
  });
});
