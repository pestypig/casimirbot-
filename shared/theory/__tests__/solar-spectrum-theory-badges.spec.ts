import { describe, expect, it } from "vitest";
import { validateTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import type { TheoryBadgeV1 } from "../../contracts/theory-badge-graph.v1";
import type { TheoryBadgeLookupMatch } from "../theory-badge-overlap-locator";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { locateTheoryBadges } from "../theory-badge-overlap-locator";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";
import { buildSolarSpectrumTheoryBadgesV1 } from "../solar-spectrum-theory-badges";
import { buildSolarSpectrumObservationBindings } from "../solar-spectrum-observation-bindings";

describe("solar spectrum theory badges", () => {
  it("merges a validating solar spectrum branch into the theory graph", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const badgeIds = graph.badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(validateTheoryBadgeGraphV1(graph)).toEqual([]);
    const solarSeed = buildSolarSpectrumTheoryBadgesV1();

    expect(solarSeed.badges.length).toBeGreaterThanOrEqual(11);
    expect(badgeIds).toContain("solar.spectrum.photon_energy");
    expect(badgeIds).toContain("solar.spectrum.doppler_shift");
    expect(badgeIds).toContain("solar.spectrum.radial_velocity_proxy");
    expect(badgeIds).toContain("solar.magnetic.zeeman_split_proxy");
    expect(badgeIds).toContain("solar.flare.energy_proxy");
    expect(badgeIds).toContain("solar.runtime.spectrum_analysis");
    expect(badgeIds).toContain("solar.claim_boundary.observational_proxy");
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
    expect(spectrumMatches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toContain("solar.spectrum.photon_energy");
    expect(spectrumMatches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toContain("solar.spectrum.doppler_shift");

    const flareMatches = locateTheoryBadges({
      graph,
      input: {
        query: "solar flare radiant energy power duration",
        simulationOwners: ["solar_flare"],
      },
    });
    expect(flareMatches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toContain("solar.flare.energy_proxy");
  });

  it("builds a solar scalar loadout from selected badges", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: ["solar.spectrum.photon_energy", "solar.spectrum.doppler_shift", "solar.spectrum.radial_velocity_proxy"],
      mode: "selected_badges",
      objectContext: buildSolarSpectrumObservationBindings({
        lambda: 656.28e-9,
        lambda0: 656.28e-9,
        lambda_obs: 656.35e-9,
      }),
      includeContextItems: false,
    });

    expect(loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.expression)).toEqual(
      expect.arrayContaining(["E = h*c/lambda", "z = (lambda_obs - lambda0)/lambda0", "v = c*z"]),
    );
    expect(loadout.objectContext?.kind).toBe("solar_spectrum_observation");
    expect(loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression)).toEqual(
      expect.arrayContaining([
        "E = 6.62607015e-34*299792458/6.5628e-7",
        "z = (6.5635e-7 - 6.5628e-7)/6.5628e-7",
      ]),
    );
  });
});
