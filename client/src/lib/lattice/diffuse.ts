import { clamp } from "@/lib/utils";

export interface DiffuseOptions {
  cols: number;
  rows: number;
  iterations?: number;
  alpha?: number;
  kappa?: number;
  weights?: Float32Array;
}

/**
 * Lightweight anisotropic Jacobi diffusion tuned for lattice diagnostics.
 * Preserves sharp discontinuities by decaying the neighbor weight
 * when the sigma delta exceeds kappa.
 */
export function diffuseSigmaField(
  source: Float32Array,
  { cols, rows, iterations = 4, alpha = 0.35, kappa = 1, weights }: DiffuseOptions,
): Float32Array {
  const total = cols * rows;
  if (total === 0 || source.length !== total) {
    return source.slice();
  }

  const current = new Float32Array(source);
  const next = new Float32Array(total);
  const safeKappa = Math.max(kappa, 1e-3);

  for (let iter = 0; iter < iterations; iter += 1) {
    for (let idx = 0; idx < total; idx += 1) {
      const center = current[idx];
      let accum = 0;
      let weightSum = 0;

      const neighbor = (offset: number) => {
        const neighborIdx = idx + offset;
        if (neighborIdx < 0 || neighborIdx >= total) {
          return;
        }
        const neighborValue = current[neighborIdx];
        const delta = Math.abs(neighborValue - center);
        const w = Math.exp(-Math.pow(delta / safeKappa, 2));
        accum += neighborValue * w;
        weightSum += w;
      };

      const col = idx % cols;
      const row = Math.floor(idx / cols);
      if (col > 0) neighbor(-1);
      if (col < cols - 1) neighbor(1);
      if (row > 0) neighbor(-cols);
      if (row < rows - 1) neighbor(cols);

      const mix = weightSum > 0 ? accum / weightSum : center;
      const localAlpha = alpha * (weights ? clamp(weights[idx], 0, 1) : 1);
      next[idx] = center * (1 - localAlpha) + mix * localAlpha;
    }
    current.set(next);
  }

  return current;
}
