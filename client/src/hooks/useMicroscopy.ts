import { useMemo } from "react";
import type { CurvatureQuality } from "@/lib/curvature-brick";
import type { StressEnergyBrickDecoded } from "@/lib/stress-energy-brick";
import { useStressEnergyBrick } from "./useStressEnergyBrick";

export interface MicroscopyScalarField {
  data: Float32Array;
  min: number;
  max: number;
}

export interface MicroscopyVectorField {
  vx: Float32Array;
  vy: Float32Array;
  mag: Float32Array;
  maxMag: number;
}

export interface MicroscopyFrame {
  dims: { nx: number; ny: number; nz: number };
  planeZ: number;
  density: MicroscopyScalarField;
  divergence: MicroscopyScalarField;
  flux: MicroscopyVectorField;
  stats?: StressEnergyBrickDecoded["stats"];
}

export interface UseMicroscopyOptions {
  quality?: CurvatureQuality;
  refetchMs?: number;
  plane?: number;
}

const clampRange = (min: number, max: number) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 0 };
  }
  if (min === max) {
    return { min, max: min + 1e-9 };
  }
  return { min, max };
};

const axisIndex = (x: number, y: number, z: number, nx: number, ny: number) => z * nx * ny + y * nx + x;

const sliceScalarField = (
  channel: Float32Array | undefined,
  dims: { nx: number; ny: number; nz: number },
  planeZ: number,
): MicroscopyScalarField => {
  const { nx, ny } = dims;
  const size = nx * ny;
  const slice = new Float32Array(size);
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  if (!channel || channel.length === 0) {
    return { data: slice, min: 0, max: 0 };
  }
  let idx2d = 0;
  for (let y = 0; y < ny; y += 1) {
    for (let x = 0; x < nx; x += 1) {
      const idx3d = axisIndex(x, y, planeZ, nx, ny);
      const value = channel[idx3d] ?? 0;
      slice[idx2d] = value;
      if (value < min) min = value;
      if (value > max) max = value;
      idx2d += 1;
    }
  }
  const range = clampRange(min, max);
  return { data: slice, min: range.min, max: range.max };
};

const sliceFluxField = (
  flux: StressEnergyBrickDecoded["flux"] | undefined,
  dims: { nx: number; ny: number; nz: number },
  planeZ: number,
): MicroscopyVectorField => {
  const { nx, ny } = dims;
  const size = nx * ny;
  const vx = new Float32Array(size);
  const vy = new Float32Array(size);
  const mag = new Float32Array(size);
  if (!flux) {
    return { vx, vy, mag, maxMag: 0 };
  }
  let idx2d = 0;
  let maxMag = 0;
  for (let y = 0; y < ny; y += 1) {
    for (let x = 0; x < nx; x += 1) {
      const idx3d = axisIndex(x, y, planeZ, nx, ny);
      const fx = flux.Sx.data[idx3d] ?? 0;
      const fy = flux.Sy.data[idx3d] ?? 0;
      vx[idx2d] = fx;
      vy[idx2d] = fy;
      const m = Math.hypot(fx, fy);
      mag[idx2d] = m;
      if (m > maxMag) maxMag = m;
      idx2d += 1;
    }
  }
  return { vx, vy, mag, maxMag };
};

export function useMicroscopy(options: UseMicroscopyOptions = {}) {
  const quality = options.quality ?? "medium";
  const refetchMs = options.refetchMs ?? 2000;

  const stressQuery = useStressEnergyBrick({ quality, refetchMs });

  const frame = useMemo<MicroscopyFrame | null>(() => {
    const brick = stressQuery.data;
    if (!brick) return null;
    const dims = {
      nx: brick.dims[0],
      ny: brick.dims[1],
      nz: brick.dims[2],
    };
    const requestedPlane = options.plane ?? Math.floor(dims.nz / 2);
    const planeZ = Math.max(0, Math.min(dims.nz - 1, Math.floor(requestedPlane)));
    return {
      dims,
      planeZ,
      density: sliceScalarField(brick.t00.data, dims, planeZ),
      divergence: sliceScalarField(brick.flux?.divS.data, dims, planeZ),
      flux: sliceFluxField(brick.flux, dims, planeZ),
      stats: brick.stats,
    };
  }, [stressQuery.data, options.plane]);

  return {
    frame,
    isLoading: stressQuery.isLoading,
    isFetching: stressQuery.isFetching,
    refetch: stressQuery.refetch,
  };
}
