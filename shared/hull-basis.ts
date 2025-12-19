import type { AxisLabel, BasisTransform, HullBasisResolved } from "./schema";

export type { HullBasisResolved } from "./schema";

const axisLabel = (axis: any, fallback: AxisLabel): AxisLabel =>
  axis === "x" || axis === "y" || axis === "z" ? axis : fallback;

const coerceScale = (
  scale?: ArrayLike<number> | null,
): { scale: [number, number, number]; flipFromScale: { x: boolean; y: boolean; z: boolean } } => {
  const arr = Array.isArray(scale) || ArrayBuffer.isView(scale as any) ? Array.from(scale as any) : [];
  const out: [number, number, number] = [1, 1, 1];
  const flipFromScale = { x: false, y: false, z: false };
  const apply = (idx: number, axis: "x" | "y" | "z") => {
    const raw = Number(arr[idx]);
    if (!Number.isFinite(raw) || Math.abs(raw) < 1e-9) {
      out[idx] = 1;
      return;
    }
    out[idx] = Math.abs(raw);
    if (raw < 0) flipFromScale[axis] = !flipFromScale[axis];
  };
  apply(0, "x");
  apply(1, "y");
  apply(2, "z");
  return { scale: out, flipFromScale };
};

const normalizeVec3 = (vec: [number, number, number]): [number, number, number] => {
  const mag = Math.hypot(vec[0], vec[1], vec[2]);
  if (!Number.isFinite(mag) || mag < 1e-9) return [0, 0, 0];
  return [vec[0] / mag, vec[1] / mag, vec[2] / mag];
};

export const HULL_BASIS_IDENTITY: HullBasisResolved = Object.freeze({
  swap: { x: "x", y: "y", z: "z" },
  flip: { x: false, y: false, z: false },
  scale: [1, 1, 1],
  forward: [0, 0, 1],
  up: [0, 1, 0],
  right: [1, 0, 0],
});

export function resolveHullBasis(
  basis?: BasisTransform | HullBasisResolved | null,
  extraScale?: ArrayLike<number> | null,
): HullBasisResolved {
  const base = basis && (basis as HullBasisResolved).forward ? (basis as HullBasisResolved) : (basis as BasisTransform);
  const swapRaw = (base as any)?.swap ?? {};
  const flipRaw = (base as any)?.flip ?? {};
  const scaleRaw = Array.isArray((base as any)?.scale) || ArrayBuffer.isView((base as any)?.scale)
    ? ((base as any)?.scale as ArrayLike<number>)
    : undefined;

  const swap = {
    x: axisLabel((swapRaw as any).x, "x"),
    y: axisLabel((swapRaw as any).y, "y"),
    z: axisLabel((swapRaw as any).z, "z"),
  };
  const baseScale = coerceScale(scaleRaw);
  const extra = coerceScale(extraScale);
  const flip = {
    x: !!(flipRaw as any).x || baseScale.flipFromScale.x || extra.flipFromScale.x,
    y: !!(flipRaw as any).y || baseScale.flipFromScale.y || extra.flipFromScale.y,
    z: !!(flipRaw as any).z || baseScale.flipFromScale.z || extra.flipFromScale.z,
  };
  const scale: [number, number, number] = [
    baseScale.scale[0] * extra.scale[0],
    baseScale.scale[1] * extra.scale[1],
    baseScale.scale[2] * extra.scale[2],
  ];

  const apply = (vec: [number, number, number]): [number, number, number] => {
    const rawX = vec[0] ?? 0;
    const rawY = vec[1] ?? 0;
    const rawZ = vec[2] ?? 0;
    const swapX = swap.x === "x" ? rawX : swap.x === "y" ? rawY : rawZ;
    const swapY = swap.y === "x" ? rawX : swap.y === "y" ? rawY : rawZ;
    const swapZ = swap.z === "x" ? rawX : swap.z === "y" ? rawY : rawZ;
    const tx = (flip.x ? -swapX : swapX) * scale[0];
    const ty = (flip.y ? -swapY : swapY) * scale[1];
    const tz = (flip.z ? -swapZ : swapZ) * scale[2];
    return [tx, ty, tz];
  };

  const right = normalizeVec3(apply([1, 0, 0]));
  const up = normalizeVec3(apply([0, 1, 0]));
  const forward = normalizeVec3(apply([0, 0, 1]));

  return { swap, flip, scale, forward, up, right };
}

export const isIdentityHullBasis = (basis: HullBasisResolved) =>
  basis.swap.x === "x" &&
  basis.swap.y === "y" &&
  basis.swap.z === "z" &&
  !basis.flip.x &&
  !basis.flip.y &&
  !basis.flip.z &&
  Math.abs(basis.scale[0] - 1) < 1e-6 &&
  Math.abs(basis.scale[1] - 1) < 1e-6 &&
  Math.abs(basis.scale[2] - 1) < 1e-6;

export const applyHullBasisToDims = (
  dims: { Lx_m: number; Ly_m: number; Lz_m: number },
  basis?: BasisTransform | HullBasisResolved | null,
): { Lx_m: number; Ly_m: number; Lz_m: number } => {
  const resolved = resolveHullBasis(basis);
  const scaleFor = (axis: AxisLabel) =>
    Math.abs(axis === "x" ? resolved.scale[0] : axis === "y" ? resolved.scale[1] : resolved.scale[2]) || 1;
  const pick = (axis: AxisLabel) => (axis === "x" ? dims.Lx_m : axis === "y" ? dims.Ly_m : dims.Lz_m);
  return {
    Lx_m: pick(resolved.swap.x) * scaleFor("x"),
    Ly_m: pick(resolved.swap.y) * scaleFor("y"),
    Lz_m: pick(resolved.swap.z) * scaleFor("z"),
  };
};

export const applyHullBasisToPositions = (
  positions: Float32Array,
  opts?: {
    basis?: BasisTransform | HullBasisResolved | null;
    extraScale?: ArrayLike<number> | null;
    targetDims?: { Lx_m?: number; Ly_m?: number; Lz_m?: number } | null;
  },
) => {
  const basis = resolveHullBasis(opts?.basis, opts?.extraScale);

  const transformed = new Float32Array(positions.length);
  const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];

  for (let i = 0; i < positions.length; i += 3) {
    const rawX = positions[i] ?? 0;
    const rawY = positions[i + 1] ?? 0;
    const rawZ = positions[i + 2] ?? 0;
    const swapX = basis.swap.x === "x" ? rawX : basis.swap.x === "y" ? rawY : rawZ;
    const swapY = basis.swap.y === "x" ? rawX : basis.swap.y === "y" ? rawY : rawZ;
    const swapZ = basis.swap.z === "x" ? rawX : basis.swap.z === "y" ? rawY : rawZ;
    const tx = (basis.flip.x ? -swapX : swapX) * basis.scale[0];
    const ty = (basis.flip.y ? -swapY : swapY) * basis.scale[1];
    const tz = (basis.flip.z ? -swapZ : swapZ) * basis.scale[2];
    transformed[i] = tx;
    transformed[i + 1] = ty;
    transformed[i + 2] = tz;
    if (tx < min[0]) min[0] = tx;
    if (ty < min[1]) min[1] = ty;
    if (tz < min[2]) min[2] = tz;
    if (tx > max[0]) max[0] = tx;
    if (ty > max[1]) max[1] = ty;
    if (tz > max[2]) max[2] = tz;
  }

  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const center = [(max[0] + min[0]) * 0.5, (max[1] + min[1]) * 0.5, (max[2] + min[2]) * 0.5];
  const targetDims = opts?.targetDims ?? null;
  const targetScale: [number, number, number] = [
    targetDims?.Lx_m && size[0] > 1e-6 ? targetDims.Lx_m / size[0] : 1,
    targetDims?.Ly_m && size[1] > 1e-6 ? targetDims.Ly_m / size[1] : 1,
    targetDims?.Lz_m && size[2] > 1e-6 ? targetDims.Lz_m / size[2] : 1,
  ];

  for (let i = 0; i < transformed.length; i += 3) {
    transformed[i] = (transformed[i] - center[0]) * targetScale[0];
    transformed[i + 1] = (transformed[i + 1] - center[1]) * targetScale[1];
    transformed[i + 2] = (transformed[i + 2] - center[2]) * targetScale[2];
  }

  return {
    positions: transformed,
    bounds: { min, max, size, center },
    basis,
    scaleApplied: basis.scale,
    targetScale,
  };
};
