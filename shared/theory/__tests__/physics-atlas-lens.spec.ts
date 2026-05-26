import { describe, expect, it } from "vitest";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildHelixPhysicsAtlasV1 } from "../physics-atlas-blocks";
import { resolvePhysicsAtlasLens } from "../physics-atlas-lens";

describe("physics atlas lens", () => {
  it("projects the solar atlas block onto graph badges and edges", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const atlas = buildHelixPhysicsAtlasV1({ graph });
    const lens = resolvePhysicsAtlasLens({ graph, atlas, blockId: "solar_surface_spectrum" });

    expect(lens.blockId).toBe("solar_surface_spectrum");
    expect(lens.title).toBe("Solar Surface & Spectrum");
    expect(lens.highlightedBadgeIds).toContain("solar.spectrum.photon_energy_wavelength");
    expect(lens.highlightedBadgeIds).toContain("solar.claim_boundary.observation_proxy");
    expect(lens.foundationBadgeIds).toContain("physics.constants.speed_of_light");
    expect(lens.claimBoundaryBadgeIds).toContain("solar.claim_boundary.observation_proxy");
    expect(lens.highlightedEdgeIds.length).toBeGreaterThan(0);
    expect(lens.dimmedBadgeIds.length).toBeGreaterThan(0);
    expect(lens.dimmedBadgeIds.every((badgeId: string) => !lens.highlightedBadgeIds.includes(badgeId))).toBe(true);
    expect(lens.suggestedViewport.centerBadgeId).toBe("solar.spectrum.frequency_from_wavelength");
    expect(lens.calculatorExamples.some((example) => example.expression === "E = h*c/lambda")).toBe(true);
  });
});
