import { describe, expect, it } from "vitest";
import { validateTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import type { TheoryBadgeV1 } from "../../contracts/theory-badge-graph.v1";
import type { TheoryBadgeLookupMatch } from "../theory-badge-overlap-locator";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { locateTheoryBadges } from "../theory-badge-overlap-locator";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("solar spectrum theory badges", () => {
  it("merges a validating solar spectrum branch into the theory graph", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const badgeIds = graph.badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(validateTheoryBadgeGraphV1(graph)).toEqual([]);
    expect(badgeIds).toContain("solar.spectrum.photon_energy_wavelength");
    expect(badgeIds).toContain("solar.spectrum.doppler_velocity");
    expect(badgeIds).toContain("solar.flare.radiant_energy_proxy");
    expect(badgeIds).toContain("solar.claim_boundary.observation_proxy");
  });

  it("locates solar spectral and flare prompts", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();

    const spectrumMatches = locateTheoryBadges({
      graph,
      input: {
        query: "solar H alpha wavelength photon energy doppler velocity",
        simulationOwners: ["solar_spectrum"],
      },
    });
    expect(spectrumMatches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toContain("solar.spectrum.photon_energy_wavelength");
    expect(spectrumMatches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toContain("solar.spectrum.doppler_velocity");

    const flareMatches = locateTheoryBadges({
      graph,
      input: {
        query: "solar flare radiant energy power duration",
        simulationOwners: ["solar_flare"],
      },
    });
    expect(flareMatches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toContain("solar.flare.radiant_energy_proxy");
  });

  it("builds a solar scalar loadout from selected badges", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: ["solar.spectrum.photon_energy_wavelength", "solar.spectrum.doppler_velocity"],
      mode: "selected_badges",
      includeContextItems: false,
    });

    expect(loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.expression)).toEqual(
      expect.arrayContaining(["E = h*c/lambda", "v = c*(lambda_obs - lambda0)/lambda0"]),
    );
  });
});
