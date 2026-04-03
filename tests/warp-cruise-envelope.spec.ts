import { describe, expect, it } from "vitest";
import {
  buildWarpCruiseEnvelopeContract,
  isCertifiedWarpCruiseEnvelopeContract,
} from "../shared/contracts/warp-cruise-envelope.v1";
import {
  makeWarpCruiseEnvelopeFixture,
  makeWarpCruiseEnvelopePreflightFixture,
  makeWarpMissionTimeComparisonFixture,
  makeWarpMissionTimeEstimatorFixture,
  makeWarpRouteTimeWorldlineFixture,
  makeWarpWorldlineFixture,
} from "./helpers/warp-worldline-fixture";

describe("warp cruise-envelope contract", () => {
  it("builds a deterministic certified bounded cruise envelope from the certified transport chain", () => {
    const envelope = makeWarpCruiseEnvelopeFixture();
    const second = makeWarpCruiseEnvelopeFixture();

    expect(second).toEqual(envelope);
    expect(envelope.status).toBe("bounded_cruise_envelope_certified");
    expect(envelope.cruiseEnvelopeModelId).toBe(
      "nhm2_route_consistent_descriptor_band",
    );
    expect(envelope.envelopeQuantityId).toBe(
      "bounded_local_transport_descriptor_norm",
    );
    expect(envelope.admissibleBand.min).toBeGreaterThan(0);
    expect(envelope.admissibleBand.max).toBeGreaterThanOrEqual(
      envelope.admissibleBand.min,
    );
    expect(envelope.representativeValue).toBeGreaterThanOrEqual(
      envelope.admissibleBand.min,
    );
    expect(envelope.representativeValue).toBeLessThanOrEqual(
      envelope.admissibleBand.max,
    );
    expect(envelope.routeTimeStatus).toBe("bounded_local_segment_certified");
    expect(envelope.missionTimeStatus).toBe(
      "bounded_target_coupled_estimate_ready",
    );
    expect(envelope.nonClaims).toContain("not max-speed certified");
    expect(isCertifiedWarpCruiseEnvelopeContract(envelope)).toBe(true);
  });

  it("fails closed when any certified prerequisite contract is missing", () => {
    const worldline = makeWarpWorldlineFixture();
    const preflight = makeWarpCruiseEnvelopePreflightFixture(worldline);
    const routeTime = makeWarpRouteTimeWorldlineFixture(worldline, preflight);
    const missionTimeEstimator = makeWarpMissionTimeEstimatorFixture({
      worldline,
      preflight,
      routeTime,
    });
    const missionTimeComparison = makeWarpMissionTimeComparisonFixture({
      missionTimeEstimator,
    });

    expect(
      buildWarpCruiseEnvelopeContract({
        preflight: null,
        routeTimeWorldline: routeTime,
        missionTimeEstimator,
        missionTimeComparison,
      }),
    ).toBeNull();
    expect(
      buildWarpCruiseEnvelopeContract({
        preflight,
        routeTimeWorldline: { ...routeTime, certified: false } as any,
        missionTimeEstimator,
        missionTimeComparison,
      }),
    ).toBeNull();
    expect(
      buildWarpCruiseEnvelopeContract({
        preflight,
        routeTimeWorldline: routeTime,
        missionTimeEstimator: { ...missionTimeEstimator, certified: false } as any,
        missionTimeComparison,
      }),
    ).toBeNull();
    expect(
      buildWarpCruiseEnvelopeContract({
        preflight,
        routeTimeWorldline: routeTime,
        missionTimeEstimator,
        missionTimeComparison: {
          ...missionTimeComparison,
          certified: false,
        } as any,
      }),
    ).toBeNull();
  });

  it("reports zero-differential comparison consistency honestly when the certified mission chain has tau=t", () => {
    const worldline = makeWarpWorldlineFixture();
    const preflight = makeWarpCruiseEnvelopePreflightFixture(worldline);
    const routeTime = makeWarpRouteTimeWorldlineFixture(worldline, preflight);
    const missionTimeEstimator = makeWarpMissionTimeEstimatorFixture({
      worldline,
      preflight,
      routeTime,
    });
    const zeroDiffEstimator = {
      ...missionTimeEstimator,
      properTimeEstimate: {
        ...missionTimeEstimator.coordinateTimeEstimate,
        meaning: missionTimeEstimator.properTimeEstimate.meaning,
      },
    };
    const comparison = makeWarpMissionTimeComparisonFixture({
      missionTimeEstimator: zeroDiffEstimator as any,
    });
    const envelope = buildWarpCruiseEnvelopeContract({
      preflight,
      routeTimeWorldline: routeTime,
      missionTimeEstimator: zeroDiffEstimator as any,
      missionTimeComparison: comparison,
    });

    expect(envelope).not.toBeNull();
    expect(envelope?.comparisonInterpretationStatus).toBe(
      "no_certified_relativistic_differential_detected",
    );
    expect(envelope?.comparisonConsistencyStatus).toBe(
      "consistent_with_zero_differential_comparison",
    );
  });

  it("rejects forged or weakened cruise-envelope contracts", () => {
    const envelope = makeWarpCruiseEnvelopeFixture();

    expect(isCertifiedWarpCruiseEnvelopeContract(envelope)).toBe(true);
    expect(
      isCertifiedWarpCruiseEnvelopeContract({
        ...envelope,
        cruiseEnvelopeModelId: "forged",
      }),
    ).toBe(false);
    expect(
      isCertifiedWarpCruiseEnvelopeContract({
        ...envelope,
        sourceSurface: {
          ...envelope.sourceSurface,
          provenanceClass: "proxy",
        },
      }),
    ).toBe(false);
    expect(
      isCertifiedWarpCruiseEnvelopeContract({
        ...envelope,
        representativeValue: envelope.admissibleBand.max * 2,
      }),
    ).toBe(false);
    expect(
      isCertifiedWarpCruiseEnvelopeContract({
        ...envelope,
        rejectionReasons: ["forged"],
      }),
    ).toBe(false);
  });
});
