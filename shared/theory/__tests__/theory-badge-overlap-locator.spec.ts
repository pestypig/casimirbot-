import { describe, expect, it } from "vitest";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import {
  locateTheoryBadges,
  traceTheoryBadgeConnections,
} from "../theory-badge-overlap-locator";

describe("theory badge overlap locator", () => {
  it("locates QEI sampling from prompt text", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const matches = locateTheoryBadges({
      graph,
      input: {
        query: "solve the QEI sampling margin",
        limit: 3,
      },
    });

    expect(matches[0]?.badgeId).toBe("nhm2.qei.sampling_window");
    expect(matches[0]?.calculatorPayloadIds).toContain("qei_margin_difference_payload");
    expect(matches[0]?.claimBoundaryWarnings).toContain("diagnostic-only badge");
  });

  it("locates energy-density-like badges by unit signature", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const matches = locateTheoryBadges({
      graph,
      input: {
        unitSignatures: ["M L^-1 T^-2"],
        limit: 10,
      },
    });

    expect(matches.map((match) => match.badgeId)).toEqual(
      expect.arrayContaining([
        "nhm2.source.energy_density_proxy",
        "nhm2.qei.sampling_window",
        "nhm2.closure.source_residual",
      ]),
    );
  });

  it("traces connections across selected badges", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const trace = traceTheoryBadgeConnections({
      graph,
      badgeIds: ["nhm2.qei.sampling_window", "nhm2.closure.source_residual"],
    });

    expect(trace.selectedBadgeIds).toEqual([
      "nhm2.qei.sampling_window",
      "nhm2.closure.source_residual",
    ]);
    expect(trace.sharedAncestorIds).toContain("nhm2.source.energy_density_proxy");
    expect(trace.connectingBadgeIds).toEqual(
      expect.arrayContaining(["nhm2.qei.sampling_window", "nhm2.closure.source_residual"]),
    );
    expect(trace.sharedUnitSignatures).toContain("M L^-1 T^-2");
    expect(trace.claimBoundaryNotes.some((note) => note.includes("diagnostic-only"))).toBe(true);
  });
});
