import { describe, expect, it } from "vitest";
import {
  buildWarpCruiseEnvelopePreflightContractFromWorldline,
  isCertifiedWarpCruiseEnvelopePreflightContract,
} from "../shared/contracts/warp-cruise-envelope-preflight.v1";
import {
  makeFlatWarpWorldlineSamples,
  makeWarpCruiseEnvelopePreflightFixture,
  makeWarpWorldlineFixture,
} from "./helpers/warp-worldline-fixture";

describe("warp cruise-envelope preflight contract", () => {
  it("builds a deterministic bounded local descriptor preflight from a certified informative worldline", () => {
    const worldline = makeWarpWorldlineFixture();
    const first = buildWarpCruiseEnvelopePreflightContractFromWorldline(worldline);
    const second = buildWarpCruiseEnvelopePreflightContractFromWorldline(worldline);

    expect(first).not.toBeNull();
    expect(second).toEqual(first);
    expect(first?.status).toBe("bounded_preflight_ready");
    expect(first?.preflightQuantityId).toBe("bounded_local_transport_descriptor_norm");
    expect(first?.candidateCount).toBe(10);
    expect(first?.admissibleCount).toBe(9);
    expect(first?.rejectedCount).toBe(1);
    expect(first?.routeTimeStatus).toBe("deferred");
    expect(first?.candidateSet.map((entry) => entry.candidateId)).toEqual([
      "sample_centerline_aft",
      "sample_centerline_center",
      "sample_centerline_fore",
      "sample_shell_aft",
      "sample_shell_fore",
      "sample_shell_port",
      "sample_shell_starboard",
      "sample_shell_dorsal",
      "sample_shell_ventral",
      "probe_above_certified_support",
    ]);
    expect(first?.boundedCruisePreflightBand.max ?? 0).toBeGreaterThan(
      first?.boundedCruisePreflightBand.min ?? 0,
    );
    expect(first?.eligibleNextProducts).toEqual(["route_time_worldline_extension"]);
    expect(isCertifiedWarpCruiseEnvelopePreflightContract(first)).toBe(true);
  });

  it("fails closed when the worldline is missing, forged, or not informative enough for bounded preflight", () => {
    expect(buildWarpCruiseEnvelopePreflightContractFromWorldline(null)).toBeNull();
    expect(
      buildWarpCruiseEnvelopePreflightContractFromWorldline({
        contractVersion: "warp_worldline_contract/v1",
        certified: true,
      } as any),
    ).toBeNull();
    expect(
      buildWarpCruiseEnvelopePreflightContractFromWorldline(
        makeWarpWorldlineFixture(makeFlatWarpWorldlineSamples()),
      ),
    ).toBeNull();
  });

  it("rejects forged partial preflight contracts that try to bypass provenance and candidate accounting", () => {
    expect(
      isCertifiedWarpCruiseEnvelopePreflightContract({
        contractVersion: "warp_cruise_envelope_preflight/v1",
        status: "bounded_preflight_ready",
        certified: true,
        candidateCount: 1,
        admissibleCount: 1,
        rejectedCount: 0,
      }),
    ).toBe(false);
  });

  it("keeps the rejected probe above the admissible band and leaves route-time deferred", () => {
    const preflight = makeWarpCruiseEnvelopePreflightFixture();
    const rejectedProbe = preflight.rejectedCandidates[0];

    expect(rejectedProbe.candidateId).toBe("probe_above_certified_support");
    expect(rejectedProbe.preflightQuantityValue).toBeGreaterThan(
      preflight.boundedCruisePreflightBand.max,
    );
    expect(rejectedProbe.gateReasons).toContain(
      "candidate_exceeds_certified_local_descriptor_support",
    );
    expect(preflight.nonClaims).toContain("not max-speed certified");
    expect(preflight.nonClaims).toContain("not route-time certified");
    expect(preflight.nextRequiredUpgrade).toBe("route_time_worldline_extension");
  });
});
