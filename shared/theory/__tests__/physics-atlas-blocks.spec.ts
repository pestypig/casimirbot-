import { describe, expect, it } from "vitest";
import type { PhysicsAtlasBlockV1 } from "../../contracts/physics-atlas.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildHelixPhysicsAtlasV1, buildPhysicsAtlasBlocks } from "../physics-atlas-blocks";

describe("physics atlas blocks", () => {
  it("includes the finite rail domains and source references", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const atlas = buildHelixPhysicsAtlasV1({ graph });
    const blocks = buildPhysicsAtlasBlocks({ graph });
    const byId = new Map(atlas.blocks.map((block: PhysicsAtlasBlockV1) => [block.id, block]));

    expect(blocks.map((block: PhysicsAtlasBlockV1) => block.glyph)).toEqual([
      "★",
      "z",
      "☀",
      "▣",
      "G",
      "Q",
      "⊙",
      "◎",
      "κ",
    ]);
    expect(byId.get("stellar_evolution")?.status).toBe("active");
    expect(byId.get("stellar_evolution")?.repoPathHints).toContain("shared/theory/starsim-stellar-evolution-map.ts");
    expect(byId.get("cosmic_distance_ladder")?.status).toBe("active");
    expect(byId.get("solar_surface_spectrum")?.status).toBe("active");
    expect(byId.get("solar_surface_spectrum")?.primaryBadgeIds).toContain(
      "solar.spectrum.photon_energy",
    );
    expect(byId.get("casimir_cavity_modes")?.repoPathHints).toContain("modules/sim_core/static-casimir.ts");
    expect(byId.get("curvature_collapse")?.status).toBe("active");
    expect(byId.get("curvature_collapse")?.primaryBadgeIds).toContain("curvature.proxy.body_density");
  });
});
