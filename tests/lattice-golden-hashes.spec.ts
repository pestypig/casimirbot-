import { describe, expect, it } from "vitest";
import { HULL_BASIS_IDENTITY } from "@shared/hull-basis";
import type { HullPreviewPayload } from "@shared/schema";
import { buildLatticeFrame } from "@/lib/lattice-frame";
import { buildHullDistanceGrid } from "@/lib/lattice-sdf";
import { hashLatticeSdfDeterminism, hashLatticeVolumeDeterminism } from "@/lib/lattice-health";
import { voxelizeHullSurfaceStrobe } from "@/lib/lattice-surface";
import type { HullSurfaceMesh } from "@/lib/resolve-wireframe-overlay";

describe("lattice golden hashes (CI determinism)", () => {
  it("produces stable lattice generation + determinism hash for volume voxelization", async () => {
    const frame = buildLatticeFrame({
      hullDims: { Lx_m: 1, Ly_m: 1, Lz_m: 1 },
      basis: HULL_BASIS_IDENTITY,
      boundsProfile: "tight",
      preset: "low",
      profileTag: "preview",
      overrides: {
        paddingPct: 0,
        paddingMin_m: 0,
        paddingMax_m: 0,
        targetVoxel_m: 0.5,
        minVoxel_m: 0.5,
        maxVoxel_m: 0.5,
        maxDim: 2,
        maxVoxels: 8,
      },
      centerWorld: [0, 0, 0],
    });

    const positions = new Float32Array([
      -0.25, -0.25, 0,
       0.25, -0.25, 0,
       0.00,  0.25, 0,
    ]);

    const surface: HullSurfaceMesh = {
      key: "goldenSurface",
      lod: "preview",
      positions,
      indices: new Uint32Array([0, 1, 2]),
      normals: null,
      tangents: null,
      vertexAngles01: new Float32Array([0, 0, 0]),
      vertexSectors: new Uint16Array([0, 0, 0]),
      triangleAngles01: new Float32Array([0]),
      triangleSectors: new Uint16Array([0]),
      sectorCount: 1,
      triangleCount: 1,
      vertexCount: 3,
      meshHash: "meshGolden",
      basis: HULL_BASIS_IDENTITY,
      handedness: 1,
      bounds: {
        min: [-0.25, -0.25, 0],
        max: [0.25, 0.25, 0],
        size: [0.5, 0.5, 0],
        center: [0, 0, 0],
      },
      wireframe: null,
      clampReasons: [],
      source: "preview",
    };

    const volumeResult = voxelizeHullSurfaceStrobe({
      frame,
      surface,
      sectorWeights: new Float32Array([1]),
      perVertexDfdr: new Float32Array([1, 1, 1]),
      gateScale: 1,
      driveScale: 1,
      driveLadder: { R: 1, sigma: 6, beta: 0.2, gate: 1, ampChain: 1 },
      shellThickness: 0.3,
      sampleBudget: 256,
      surfaceHash: "meshGolden|preview",
      weightsHash: "w00000000",
      dfdrSignature: "6.000000|0.200000|1.000",
    });
    expect(volumeResult.volume).not.toBeNull();

    const volume = volumeResult.volume!;
    const generationHash = volume.hash.slice(0, 8);
    const determinismHash = await hashLatticeVolumeDeterminism(volume, {
      sampleCount: 64,
      quantScale: 1e5,
    });

    expect(generationHash).toBe("39d8ab50");
    expect(determinismHash).toBe("0eb6c680e5503e52");
  });

  it("produces stable cache key + determinism hash for hull SDF band grid", async () => {
    const frame = buildLatticeFrame({
      hullDims: { Lx_m: 1, Ly_m: 1, Lz_m: 1 },
      basis: HULL_BASIS_IDENTITY,
      boundsProfile: "tight",
      preset: "low",
      profileTag: "preview",
      overrides: {
        paddingPct: 0,
        paddingMin_m: 0,
        paddingMax_m: 0,
        targetVoxel_m: 0.5,
        minVoxel_m: 0.5,
        maxVoxel_m: 0.5,
        maxDim: 2,
        maxVoxels: 8,
      },
      centerWorld: [0, 0, 0],
    });

    const positions = [
      -0.25, -0.25, 0,
       0.25, -0.25, 0,
       0.00,  0.25, 0,
    ];

    const payload: HullPreviewPayload = {
      version: "v1",
      provenance: "preview",
      meshHash: "meshGolden",
      lodCoarse: {
        tag: "coarse",
        meshHash: "meshGolden",
        indexedGeometry: {
          positions,
          indices: [0, 1, 2],
          vertexCount: 3,
          triangleCount: 1,
        },
      },
    };

    const sdfResult = await buildHullDistanceGrid({
      payload,
      frame,
      band: 0.6,
      surface: { lod: "preview", totalSectors: 1 },
      maxSamples: 256,
    });
    expect(sdfResult.grid).not.toBeNull();

    const grid = sdfResult.grid!;
    const determinismHash = await hashLatticeSdfDeterminism(grid, {
      sampleCount: 64,
      quantScale: 1e5,
    });

    expect(grid.key).toBe("meshGolden|d76552b58b6e2978|2x2x2|v0.50000|b0.6000");
    expect(determinismHash).toBe("88075b46cdf5dbd1");
  });
});
