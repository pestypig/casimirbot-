import { describe, expect, it } from "vitest";
import { validateTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { locateTheoryBadges } from "../theory-badge-overlap-locator";
import { buildCosmicDistanceObjectBindings } from "../cosmic-distance-object-bindings";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("Cosmic distance ladder theory badges", () => {
  it("merges a validating cosmic distance ladder branch into the theory graph", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const badgeIds = graph.badges.map((badge) => badge.id);

    expect(validateTheoryBadgeGraphV1(graph)).toEqual([]);
    expect(badgeIds).toContain("cosmic.spectral.redshift");
    expect(badgeIds).toContain("cosmic.cepheid.period_luminosity");
    expect(badgeIds).toContain("cosmic.standard_candle.distance_modulus");
    expect(badgeIds).toContain("cosmic.claim_boundary.distance_ladder_context");
  });

  it("locates redshift and Cepheid prompts on the new branch", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();

    const redshiftMatches = locateTheoryBadges({
      graph,
      input: {
        query: "observed H alpha line redshift wavelength distance",
        simulationOwners: ["cosmic_distance_ladder"],
      },
    });
    expect(redshiftMatches.map((match) => match.badgeId)).toContain("cosmic.spectral.redshift");

    const cepheidMatches = locateTheoryBadges({
      graph,
      input: {
        query: "Cepheid period luminosity distance modulus",
        simulationOwners: ["cosmic_distance_ladder"],
      },
    });
    expect(cepheidMatches.map((match) => match.badgeId)).toContain("cosmic.cepheid.period_luminosity");
  });

  it("builds object-bound scalar loadouts for redshift and low-z distance", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const objectContext = buildCosmicDistanceObjectBindings({
      label: "Low-z H-alpha galaxy",
      lambda_rest: 656.28,
      lambda_obs: 721.91,
      z: 0.1,
      H0_km_s_Mpc: 70,
    });

    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: ["cosmic.spectral.redshift", "cosmic.low_z.hubble_distance"],
      objectContext,
      mode: "selected_badges",
      includeContextItems: false,
    });

    expect(loadout.objectContext?.kind).toBe("cosmic_distance_object");
    expect(loadout.items.map((item) => item.solveExpression)).toEqual(
      expect.arrayContaining([
        "z = (721.91 - 656.28) / 656.28",
        "d_Mpc = 299792.458 * 0.1 / 70",
      ]),
    );
  });
});
