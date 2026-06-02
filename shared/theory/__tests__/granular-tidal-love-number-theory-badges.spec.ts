import { describe, expect, it } from "vitest";
import { isTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { buildGranularTidalLoveNumberTheoryBadgesV1 } from "../granular-tidal-love-number-theory-badges";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("granular/tidal Love-number theory badges", () => {
  it("adds material-response diagnostic badges to the main graph", () => {
    const granularTidal = buildGranularTidalLoveNumberTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();
    const graphBadgeIds = graph.badges.map((badge) => badge.id);

    expect(granularTidal.badges.map((badge) => badge.id)).toContain("self_gravity.shape.strength_balance");
    expect(graphBadgeIds).toContain("self_gravity.shape.strength_balance");
    expect(graphBadgeIds).toContain("granular.rubble_pile.dissipation_closure");
    expect(graphBadgeIds).toContain("tidal.love_number.displacement_response");
    expect(graphBadgeIds).toContain("tidal.claim_boundary.material_response_only");
    expect(
      graph.edges.some(
        (edge) =>
          edge.from === "granular.rubble_pile.dissipation_closure" &&
          edge.to === "tidal.quality_factor.damping_proxy",
      ),
    ).toBe(true);
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
  });

  it("loads scalar diagnostics into the calculator without solving body-specific dynamics", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "self_gravity.shape.strength_balance",
        "granular.rubble_pile.dissipation_closure",
        "tidal.quality_factor.damping_proxy",
        "tidal.love_number.displacement_response",
        "tidal.claim_boundary.material_response_only",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      includeContextItems: true,
    });
    const solveExpressions = loadout.items.map((item) => item.solveExpression);

    expect(solveExpressions).toContain("R_p_proxy = sqrt(sigma_y/(G*rho^2))");
    expect(solveExpressions).toContain("Q_tide = 2*pi*E_stored/E_lost_per_cycle");
    expect(solveExpressions).toContain("loss_fraction = 2*pi/Q_tide");
    expect(solveExpressions).toContain("deltaR_m = h2*U_tide/g_surface");
    expect(loadout.items.some((item) => item.kind === "claim_boundary")).toBe(true);
  });

  it("preserves diagnostic-only claim boundaries and avoids overclaiming language", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const granularTidalBadges = graph.badges.filter(
      (badge) =>
        badge.id.startsWith("self_gravity.") ||
        badge.id.startsWith("granular.") ||
        badge.id.startsWith("tidal."),
    );
    const boundary = granularTidalBadges.find((badge) => badge.id === "tidal.claim_boundary.material_response_only");

    expect(boundary?.claimBoundary?.diagnosticOnly).toBe(true);
    expect(boundary?.claimBoundary?.physicalMechanismClaimAllowed).toBe(false);
    expect(boundary?.claimBoundary?.promotionAllowed).toBe(false);
    expect(JSON.stringify(granularTidalBadges)).not.toMatch(
      /validates NHM2|proves collapse|solar restoration|universal gravity mechanism|physical mechanism confirmed/i,
    );
  });
});
