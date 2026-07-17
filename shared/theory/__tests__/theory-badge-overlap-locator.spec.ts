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

  it("abstains on named mathematics theorems outside current graph coverage", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const queries = [
      "Godel's incompleteness theorem",
      "Gödel's incompleteness theorem",
      "Fermat's Last Theorem",
      "x^n + y^n = z^n has no positive integer solutions for n greater than 2",
    ];

    for (const query of queries) {
      expect(
        locateTheoryBadges({
          graph,
          input: { query, limit: 8 },
        }),
        query,
      ).toEqual([]);
    }
  });

  it("does not treat reflection packet vocabulary as scientific identity", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const matches = locateTheoryBadges({
      graph,
      input: {
        query:
          "LIVE_DERIVATION_PROGRAM_GODEL_07 Use helix_ask.reflect_theory_context exactly once " +
          "to compare Gödel incompleteness theorem with Fermat Last Theorem. " +
          "Report exact_badge_ids, likely_badge_ids, representedProbabilityMass, " +
          "outOfGraphProbability, master_problem_v1, derivation_program_v1, and failureReceipts.",
        limit: 20,
      },
    });

    expect(matches).toEqual([]);
  });

  it("does not match short element tags as substrings but preserves explicit lookup", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const theoremMatches = locateTheoryBadges({
      graph,
      input: { query: "Fermat's Last Theorem", limit: 20 },
    });
    const explicitElementMatches = locateTheoryBadges({
      graph,
      input: { subjects: ["as"], limit: 20 },
    });
    const namedElementMatches = locateTheoryBadges({
      graph,
      input: { query: "arsenic element origin", limit: 20 },
    });

    expect(theoremMatches).toEqual([]);
    expect(explicitElementMatches.map((match) => match.badgeId)).toContain("element.as.origin");
    expect(namedElementMatches.map((match) => match.badgeId)).toContain("element.as.origin");
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
