import { describe, expect, it } from "vitest";
import { isTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildSolarStellarReferenceTheoryBadgesV1 } from "../solar-stellar-reference-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("solar/stellar reference theory badges", () => {
  it("adds the solar and stellar reference branch to the main graph", () => {
    const branch = buildSolarStellarReferenceTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();
    const branchBadgeIds = branch.badges.map((badge) => badge.id);
    const graphBadgeIds = graph.badges.map((badge) => badge.id);

    expect(branchBadgeIds).toContain("solar.reference.solar_product_registry");
    expect(branchBadgeIds).toContain("solar.interior.helioseismic_sound_speed");
    expect(branchBadgeIds).toContain("solar.nanoflare.heating_proxy");
    expect(branchBadgeIds).toContain("solar.sunquake.flare_coupling_window");
    expect(branchBadgeIds).toContain("stellar.structure.hydrostatic_equilibrium");
    expect(branchBadgeIds).toContain("stellar.nucleosynthesis.reaction_network_context");
    expect(branchBadgeIds).toContain("stellar.claim_boundary.reduced_order_observational_context");

    expect(graphBadgeIds).toContain("solar.reference.solar_product_registry");
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
  });

  it("exposes the scalar calculator loadout rows", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "solar.interior.helioseismic_sound_speed",
        "solar.nanoflare.heating_proxy",
        "solar.sunquake.flare_coupling_window",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      includeContextItems: true,
    });

    const solveExpressions = loadout.items.map((item) => item.solveExpression);

    expect(solveExpressions).toContain("delta_c_ratio = (c_observed - c_reference)/c_reference");
    expect(solveExpressions).toContain("P_nano = E_nano/tau_nano");
    expect(solveExpressions).toContain("delta_t_flare_sunquake = t_sunquake - t_flare");
  });

  it("keeps the solar/stellar claim boundary strict", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const boundary = graph.badges.find(
      (badge) => badge.id === "stellar.claim_boundary.reduced_order_observational_context",
    );

    expect(boundary?.claimBoundary.diagnosticOnly).toBe(true);
    expect(boundary?.claimBoundary.doesValidateNHM2).toBe(false);
    expect(boundary?.claimBoundary.validationClaimAllowed).toBe(false);
    expect(boundary?.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
    expect(boundary?.claimBoundary.promotionAllowed).toBe(false);
  });

  it("does not emit forbidden overclaiming language", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const seed = graph.badges.filter(
      (badge) => badge.id.startsWith("solar.reference.") ||
        badge.id.startsWith("solar.interior.") ||
        badge.id.startsWith("solar.cycle.") ||
        badge.id.startsWith("solar.nanoflare.") ||
        badge.id.startsWith("solar.sunquake.") ||
        badge.id.startsWith("stellar."),
    );

    expect(JSON.stringify(seed)).not.toMatch(
      /Solar proves|sunquakes prove collapse|nanoflares validate consciousness|solar restoration is feasible|NHM2 validated|working warp drive|physical mechanism confirmed/i,
    );
  });
});
