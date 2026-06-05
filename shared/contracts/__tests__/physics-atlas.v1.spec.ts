import { describe, expect, it } from "vitest";
import {
  isPhysicsAtlasV1,
  PHYSICS_ATLAS_BLOCK_IDS,
  type PhysicsAtlasBlockV1,
  validatePhysicsAtlasV1,
} from "../physics-atlas.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../../theory/nhm2-theory-badges";
import { buildHelixPhysicsAtlasV1 } from "../../theory/physics-atlas-blocks";

describe("physics_atlas/v1", () => {
  it("validates the compact physics atlas blocks", () => {
    const atlas = buildHelixPhysicsAtlasV1({ graph: buildNhm2TheoryBadgeGraphV1() });

    expect(validatePhysicsAtlasV1(atlas)).toEqual([]);
    expect(isPhysicsAtlasV1(atlas)).toBe(true);
    expect(atlas.blocks.map((block: PhysicsAtlasBlockV1) => block.id)).toEqual([...PHYSICS_ATLAS_BLOCK_IDS]);
    expect(atlas.summary.blockCount).toBe(11);
    expect(atlas.summary.activeCount).toBeGreaterThanOrEqual(3);
  });

  it("rejects forbidden overclaiming language", () => {
    const atlas = buildHelixPhysicsAtlasV1({ graph: buildNhm2TheoryBadgeGraphV1() });
    atlas.blocks[0] = {
      ...atlas.blocks[0],
      description: "StarSim proves an external claim.",
    };

    expect(validatePhysicsAtlasV1(atlas).some((issue: string) => issue.includes("forbidden overclaiming"))).toBe(true);
  });
});
