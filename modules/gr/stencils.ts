import type { GridSpec } from "./bssn-state";

export type BoundaryMode = "clamp" | "periodic" | "outflow" | "sommerfeld";
export type StencilOrder = 2 | 4;
export type Axis = 0 | 1 | 2;

export interface StencilOptions {
  order?: StencilOrder;
  boundary?: BoundaryMode;
}

export const index3D = (i: number, j: number, k: number, dims: [number, number, number]) =>
  i + dims[0] * (j + dims[1] * k);

const wrapIndex = (value: number, size: number) => {
  const mod = value % size;
  return mod < 0 ? mod + size : mod;
};

const clampIndex = (value: number, size: number) => Math.max(0, Math.min(size - 1, value));

const resolveIndex = (value: number, size: number, mode: BoundaryMode) =>
  mode === "periodic" ? wrapIndex(value, size) : clampIndex(value, size);

const sample = (
  field: Float32Array,
  i: number,
  j: number,
  k: number,
  dims: [number, number, number],
  boundary: BoundaryMode,
) => {
  const ii = resolveIndex(i, dims[0], boundary);
  const jj = resolveIndex(j, dims[1], boundary);
  const kk = resolveIndex(k, dims[2], boundary);
  return field[index3D(ii, jj, kk, dims)];
};

const axisStep = (axis: Axis, spacing: [number, number, number]) =>
  axis === 0 ? spacing[0] : axis === 1 ? spacing[1] : spacing[2];

export const diff1 = (
  field: Float32Array,
  i: number,
  j: number,
  k: number,
  axis: Axis,
  grid: GridSpec,
  options: StencilOptions = {},
): number => {
  const order = options.order ?? 2;
  const boundary = options.boundary ?? "clamp";
  const dx = axisStep(axis, grid.spacing);
  if (dx === 0) return 0;

  const di = axis === 0 ? 1 : 0;
  const dj = axis === 1 ? 1 : 0;
  const dk = axis === 2 ? 1 : 0;

  if (order === 4) {
    const f2p = sample(field, i + 2 * di, j + 2 * dj, k + 2 * dk, grid.dims, boundary);
    const f1p = sample(field, i + di, j + dj, k + dk, grid.dims, boundary);
    const f1m = sample(field, i - di, j - dj, k - dk, grid.dims, boundary);
    const f2m = sample(field, i - 2 * di, j - 2 * dj, k - 2 * dk, grid.dims, boundary);
    return (-f2p + 8 * f1p - 8 * f1m + f2m) / (12 * dx);
  }

  const f1p = sample(field, i + di, j + dj, k + dk, grid.dims, boundary);
  const f1m = sample(field, i - di, j - dj, k - dk, grid.dims, boundary);
  return (f1p - f1m) / (2 * dx);
};

export const diff2 = (
  field: Float32Array,
  i: number,
  j: number,
  k: number,
  axis: Axis,
  grid: GridSpec,
  options: StencilOptions = {},
): number => {
  const order = options.order ?? 2;
  const boundary = options.boundary ?? "clamp";
  const dx = axisStep(axis, grid.spacing);
  if (dx === 0) return 0;

  const di = axis === 0 ? 1 : 0;
  const dj = axis === 1 ? 1 : 0;
  const dk = axis === 2 ? 1 : 0;

  if (order === 4) {
    const f2p = sample(field, i + 2 * di, j + 2 * dj, k + 2 * dk, grid.dims, boundary);
    const f1p = sample(field, i + di, j + dj, k + dk, grid.dims, boundary);
    const f0 = sample(field, i, j, k, grid.dims, boundary);
    const f1m = sample(field, i - di, j - dj, k - dk, grid.dims, boundary);
    const f2m = sample(field, i - 2 * di, j - 2 * dj, k - 2 * dk, grid.dims, boundary);
    return (-f2p + 16 * f1p - 30 * f0 + 16 * f1m - f2m) / (12 * dx * dx);
  }

  const f1p = sample(field, i + di, j + dj, k + dk, grid.dims, boundary);
  const f0 = sample(field, i, j, k, grid.dims, boundary);
  const f1m = sample(field, i - di, j - dj, k - dk, grid.dims, boundary);
  return (f1p - 2 * f0 + f1m) / (dx * dx);
};

export const laplacianAt = (
  field: Float32Array,
  i: number,
  j: number,
  k: number,
  grid: GridSpec,
  options: StencilOptions = {},
): number => diff2(field, i, j, k, 0, grid, options) +
  diff2(field, i, j, k, 1, grid, options) +
  diff2(field, i, j, k, 2, grid, options);

export const computeGradient = (
  field: Float32Array,
  grid: GridSpec,
  options: StencilOptions = {},
): { dx: Float32Array; dy: Float32Array; dz: Float32Array } => {
  const total = grid.dims[0] * grid.dims[1] * grid.dims[2];
  const outX = new Float32Array(total);
  const outY = new Float32Array(total);
  const outZ = new Float32Array(total);
  let idx = 0;
  for (let k = 0; k < grid.dims[2]; k += 1) {
    for (let j = 0; j < grid.dims[1]; j += 1) {
      for (let i = 0; i < grid.dims[0]; i += 1) {
        outX[idx] = diff1(field, i, j, k, 0, grid, options);
        outY[idx] = diff1(field, i, j, k, 1, grid, options);
        outZ[idx] = diff1(field, i, j, k, 2, grid, options);
        idx += 1;
      }
    }
  }
  return { dx: outX, dy: outY, dz: outZ };
};

export const computeLaplacian = (
  field: Float32Array,
  grid: GridSpec,
  options: StencilOptions = {},
): Float32Array => {
  const total = grid.dims[0] * grid.dims[1] * grid.dims[2];
  const out = new Float32Array(total);
  let idx = 0;
  for (let k = 0; k < grid.dims[2]; k += 1) {
    for (let j = 0; j < grid.dims[1]; j += 1) {
      for (let i = 0; i < grid.dims[0]; i += 1) {
        out[idx] = laplacianAt(field, i, j, k, grid, options);
        idx += 1;
      }
    }
  }
  return out;
};
