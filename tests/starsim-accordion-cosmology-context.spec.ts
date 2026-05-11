import { describe, expect, it } from "vitest";
import {
  buildStarSimAccordionCosmologyContext,
  starSimAccordionCosmologyContextSchema,
} from "../shared/starsim-accordion-cosmology-context";

describe("StarSim Accordion cosmology context", () => {
  it("maps redshift to scale factor", () => {
    const context = buildStarSimAccordionCosmologyContext({
      redshift: 3,
      systemKind: "large_scale",
    });
    expect(context.epoch.scaleFactor).toBeCloseTo(0.25);
    expect(context.expansionRole).toBe("large_scale_background");
  });

  it("marks galaxies and stellar cores as bound systems, not local Hubble flow", () => {
    const galaxy = buildStarSimAccordionCosmologyContext({
      redshift: 0.01,
      systemKind: "bound_galaxy",
    });
    const core = buildStarSimAccordionCosmologyContext({
      redshift: 0,
      systemKind: "stellar_core",
    });
    expect(galaxy.expansionRole).toBe("bound_system_not_locally_expanding");
    expect(core.expansionRole).toBe("bound_system_not_locally_expanding");
    expect(core.caveats).toContain("cosmic_expansion_context_not_local_stellar_core_expansion");
  });

  it("cannot mark expansion as local stellar-core expansion", () => {
    expect(() =>
      starSimAccordionCosmologyContextSchema.parse({
        schemaVersion: "starsim-accordion-cosmology-context.v1",
        epoch: { redshift: 0 },
        distances: {},
        expansionRole: "local_stellar_core_expansion",
        caveats: [
          "cosmic_expansion_context_not_local_stellar_core_expansion",
          "bound_galactic_systems_require_dynamics_model",
        ],
      }),
    ).toThrow();
  });
});
