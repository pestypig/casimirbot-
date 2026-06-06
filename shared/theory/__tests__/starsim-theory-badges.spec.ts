import { describe, expect, it } from "vitest";
import { validateTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildStarSimTheoryBadgesV1 } from "../starsim-theory-badges";
import { locateTheoryBadges } from "../theory-badge-overlap-locator";

describe("StarSim theory badges", () => {
  it("defines a reduced-order StarSim branch with calculator-loadable scalar badges", () => {
    const branch = buildStarSimTheoryBadgesV1();
    const badgeIds = branch.badges.map((badge) => badge.id);

    expect(badgeIds).toContain("starsim.observable.surface_temperature_proxy");
    expect(badgeIds).toContain("starsim.classifier.cno_temperature_margin");
    expect(badgeIds).toContain("starsim.classifier.brown_dwarf_mass_margin");
    expect(badgeIds).toContain("starsim.claim_boundary.stage1_reduced_order_prior");
    expect(badgeIds).toContain("starsim.restoration.deep_mixing_mass_flux");
    expect(badgeIds).toContain("starsim.restoration.claim_boundary.planning_forecast_only");
    expect(branch.badges.filter((badge) => badge.calculatorPayloads.length > 0).length).toBeGreaterThanOrEqual(6);
    expect(branch.edges.length).toBeGreaterThanOrEqual(8);
  });

  it("defines solar-restoration rows as calculator-loadable planning forecasts", () => {
    const branch = buildStarSimTheoryBadgesV1();
    const badgesById = new Map(branch.badges.map((badge) => [badge.id, badge]));
    const massFlux = badgesById.get("starsim.restoration.deep_mixing_mass_flux");
    const downflow = badgesById.get("starsim.restoration.tachocline_downflow_setpoint");
    const boundary = badgesById.get("starsim.restoration.claim_boundary.planning_forecast_only");

    expect(massFlux?.calculatorPayloads.map((payload) => payload.id)).toContain("deep_mixing_mass_flux_payload");
    expect(downflow?.calculatorPayloads.map((payload) => payload.id)).toContain("tachocline_downflow_setpoint_payload");
    expect(boundary?.level).toBe("claim_boundary");
    expect(boundary?.claimBoundary.promotionAllowed).toBe(false);
    expect(boundary?.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
    expect(boundary?.claimBoundary.validationClaimAllowed).toBe(false);
    expect(boundary?.assumptions.join(" ")).toMatch(/planning\/forecast context only/i);
  });

  it("merges StarSim into the validating main theory graph", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();

    expect(validateTheoryBadgeGraphV1(graph)).toEqual([]);
    expect(graph.badges.some((badge) => badge.id === "starsim.runtime.evaluate_fusion_microphysics")).toBe(true);
    expect(graph.badges.some((badge) => badge.simulationOwners.includes("starsim"))).toBe(true);
    expect(graph.summary.calculatorLoadableCount).toBeGreaterThanOrEqual(10);
  });

  it("locates StarSim surface temperature from stellar prompt context", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const matches = locateTheoryBadges({
      graph,
      input: {
        query: "stellar luminosity radius surface temperature",
        simulationOwners: ["starsim"],
        symbols: ["T_eff", "L", "R"],
        limit: 5,
      },
    });

    expect(matches[0]?.badgeId).toBe("starsim.observable.surface_temperature_proxy");
    expect(matches[0]?.calculatorPayloadIds).toContain("teff_from_luminosity_radius_payload");
    expect(matches[0]?.claimBoundaryWarnings).toContain("diagnostic-only badge");
  });

  it("locates compact-object prompts on the non-fusing runtime guardrail", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const matches = locateTheoryBadges({
      graph,
      input: {
        query: "neutron star compact object not fusing pp chain",
        simulationOwners: ["starsim"],
        limit: 8,
      },
    });

    expect(matches.map((match) => match.badgeId)).toContain("starsim.fusion.compact_object_not_fusing");
  });

  it("keeps StarSim branch copy inside reduced-order claim boundaries", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const serialized = JSON.stringify(
      graph.badges.filter((badge) => badge.simulationOwners.includes("starsim")),
    );

    expect(serialized).not.toMatch(/direct ER=EPR evidence|CL4 support|propulsion evidence|wormhole evidence/i);
    expect(serialized).toContain("Reduced-order astrophysical prior only.");
  });
});
