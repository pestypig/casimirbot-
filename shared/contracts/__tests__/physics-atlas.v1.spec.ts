import { describe, expect, it } from "vitest";
import {
  isPhysicsAtlasV1,
  PHYSICS_ATLAS_BLOCK_IDS,
  type PhysicsAtlasBlockV1,
  validatePhysicsAtlasV1,
} from "../physics-atlas.v1";
import { buildPhysicsAtlasBlocksV1 } from "../../theory/physics-atlas-blocks";

describe("physics_atlas/v1", () => {
  it("validates the compact physics atlas blocks", () => {
    const atlas = buildPhysicsAtlasBlocksV1();

    expect(validatePhysicsAtlasV1(atlas)).toEqual([]);
    expect(isPhysicsAtlasV1(atlas)).toBe(true);
    expect(atlas.blocks.map((block: PhysicsAtlasBlockV1) => block.id)).toEqual([...PHYSICS_ATLAS_BLOCK_IDS]);
    expect(atlas.summary.blockCount).toBe(9);
    expect(atlas.summary.activeCount).toBeGreaterThanOrEqual(3);
  });

  it("rejects forbidden overclaiming language", () => {
    const atlas = buildPhysicsAtlasBlocksV1();
    atlas.blocks[0] = {
      ...atlas.blocks[0],
      description: "StarSim proves an external claim.",
    };

    expect(validatePhysicsAtlasV1(atlas).some((issue: string) => issue.includes("forbidden overclaiming"))).toBe(true);
  });
});
