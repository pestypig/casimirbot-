import { describe, expect, it } from "vitest";
import type { PhysicsAtlasBlockV1 } from "../../contracts/physics-atlas.v1";
import { buildPhysicsAtlasBlocksV1 } from "../physics-atlas-blocks";

describe("physics atlas blocks", () => {
  it("includes the finite rail domains and source references", () => {
    const atlas = buildPhysicsAtlasBlocksV1();
    const byId = new Map(atlas.blocks.map((block: PhysicsAtlasBlockV1) => [block.id, block]));

    expect(byId.get("stellar_evolution")?.status).toBe("active");
    expect(byId.get("cosmic_distance_ladder")?.status).toBe("active");
    expect(byId.get("solar_surface_spectrum")?.status).toBe("active");
    expect(byId.get("solar_surface_spectrum")?.primaryBadgeIds).toContain(
      "solar.spectrum.photon_energy_wavelength",
    );
    expect(byId.get("casimir_cavity_modes")?.repoPathHints).toContain("modules/sim_core/static-casimir.ts");
  });
});
