import { describe, expect, it } from "vitest";
import { THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1 } from "@shared/contracts/theory-biome-layout.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "@shared/theory/nhm2-theory-badges";
import { layoutTheoryBiomeMap } from "../theoryBiomeLayout";

describe("layoutTheoryBiomeMap", () => {
  it("places badges deterministically", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const first = layoutTheoryBiomeMap(graph);
    const second = layoutTheoryBiomeMap(graph);

    expect(first.nodes).toEqual(second.nodes);
    expect(first.edges).toEqual(second.edges);
    expect(first.biome.coordinates).toEqual(second.biome.coordinates);
    expect(first.biome.chunks).toEqual(second.biome.chunks);
  });

  it("assigns claim boundaries to the claim-boundary biome", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const layout = layoutTheoryBiomeMap(graph);
    const boundary = layout.biome.coordinates.find(
      (coord) => coord.badgeId === "nhm2.claim_boundary.diagnostic_only",
    );

    expect(boundary?.scaleBand).toBe("claim_boundary");
    expect(boundary?.claimPressure).toBe(1);
    expect(boundary?.altitude).toBe(1);
  });

  it("separates quantum, molecular, stellar, and galactic scale bands", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const layout = layoutTheoryBiomeMap(graph);
    const coords = new Map(layout.biome.coordinates.map((coord) => [coord.badgeId, coord]));

    expect(coords.get("physics.quantum.energy_frequency")?.scaleBand).toMatch(/planck_quantum|abstract_formal/);
    expect(coords.get("astrochemistry.fullerene.c60_stellar_context")?.scaleBand).toBe("molecular");
    expect(coords.get("stellar.nucleosynthesis.reaction_network_context")?.scaleBand).toBe("stellar");
    expect(coords.get("galactic.rotation.circular_velocity_newtonian")?.scaleBand).toBe("galactic_cosmic");
  });

  it("creates non-empty chunks with dominant scale bands", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const layout = layoutTheoryBiomeMap(graph);
    const chunkCapacity = THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.badgesPerChunkTarget ** 2;

    expect(layout.biome.chunks.length).toBeGreaterThan(0);
    expect(layout.biome.chunks.every((chunk) => chunk.badgeIds.length > 0)).toBe(true);
    expect(layout.biome.chunks.every((chunk) => chunk.dominantScaleBand.length > 0)).toBe(true);
    expect(layout.biome.chunks.every((chunk) => chunk.capacityBadgeCount === chunkCapacity)).toBe(true);
    expect(layout.biome.chunks.every((chunk) => chunk.densityRatio > 0)).toBe(true);
    expect(layout.biome.chunks.every((chunk) => chunk.semanticChunkIds.length > 0)).toBe(true);
  });

  it("keeps render and semantic chunk ids available for locator overlays", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const layout = layoutTheoryBiomeMap(graph);

    expect(THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.chunkSizePx).toBeGreaterThanOrEqual(768);
    expect(THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.badgesPerChunkTarget).toBeGreaterThanOrEqual(6);
    expect(
      layout.biome.coordinates.every(
        (coordinate) => coordinate.renderChunkId === `${coordinate.chunkX}:${coordinate.chunkY}`,
      ),
    ).toBe(true);
    expect(layout.biome.coordinates.every((coordinate) => coordinate.semanticChunkId.length > 0)).toBe(true);
    expect(layout.nodes.every((node) => node.renderChunkId && node.semanticChunkId)).toBe(true);
  });

  it("keeps rendered badge boxes separated by the spacing contract", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const layout = layoutTheoryBiomeMap(graph);
    const minDx =
      THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.badgeSizePx +
      THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.minBadgeGapXPx;
    const minDy =
      THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.badgeSizePx +
      THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.minBadgeGapYPx;

    for (let i = 0; i < layout.nodes.length; i += 1) {
      for (let j = i + 1; j < layout.nodes.length; j += 1) {
        const a = layout.nodes[i];
        const b = layout.nodes[j];
        expect(Math.abs(a.x - b.x) >= minDx || Math.abs(a.y - b.y) >= minDy).toBe(true);
      }
    }
  });
});
