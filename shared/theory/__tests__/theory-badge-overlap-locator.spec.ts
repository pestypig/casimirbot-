import { describe, expect, it } from "vitest";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import {
  locateTheoryBadges,
  traceTheoryBadgeConnections,
  type TheoryBadgeLookupMatch,
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
        limit: 40,
      },
    });
    const matchIds = matches.map((match: TheoryBadgeLookupMatch) => match.badgeId);

    expect(matchIds).toEqual(
      expect.arrayContaining([
        "nhm2.source.energy_density_proxy",
        "nhm2.qei.sampling_window",
        "nhm2.closure.source_residual",
        "nhm2.closure.wall_t00_source_residual",
        "nhm2.tensor.same_chart_full_tensor",
      ]),
    );
    expect(matches.find((match) => match.badgeId === "nhm2.source.energy_density_proxy")?.calculatorPayloadIds).toContain(
      "rho_equals_E_over_V_payload",
    );
    expect(matches.find((match) => match.badgeId === "nhm2.qei.sampling_window")?.calculatorPayloadIds).toContain(
      "qei_margin_difference_payload",
    );
  });

  it("uses atlas blocks as scoring priors without matching single-letter unit signatures", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const solarMatches = locateTheoryBadges({
      graph,
      input: {
        query: "line splitting wavelength",
        atlasBlockIds: ["solar_surface_spectrum"],
        limit: 8,
      },
    });

    expect(solarMatches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toContain(
      "solar.magnetic.zeeman_split_proxy",
    );
    expect(solarMatches[0]?.reasons.some((reason: string) => reason.includes("atlas block"))).toBe(true);

    const massOnlyMatches = locateTheoryBadges({
      graph,
      input: {
        unitSignatures: ["M"],
        limit: 10,
      },
    });

    expect(massOnlyMatches).toEqual([]);
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
    expect(trace.claimBoundaryNotes.some((note: string) => note.includes("diagnostic-only"))).toBe(true);
  });
});
