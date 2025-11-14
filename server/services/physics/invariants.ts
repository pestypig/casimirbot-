export function integrateEnergyJ(
  u: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  thickness: number,
): number {
  let sum = 0;
  const total = nx * ny;
  for (let i = 0; i < total; i++) {
    sum += u[i];
  }
  return sum * dx * dy * thickness;
}

export function poissonResidualRMS(
  phi: Float32Array,
  rhoEff: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  fourPiG: number,
): number {
  const invdx2 = 1 / (dx * dx);
  const invdy2 = 1 / (dy * dy);
  let sse = 0;
  let n = 0;
  for (let y = 1; y < ny - 1; y++) {
    for (let x = 1; x < nx - 1; x++) {
      const i = y * nx + x;
      const lap =
        (phi[i - 1] - 2 * phi[i] + phi[i + 1]) * invdx2 +
        (phi[i - nx] - 2 * phi[i] + phi[i + nx]) * invdy2;
      const res = lap - fourPiG * rhoEff[i];
      sse += res * res;
      n++;
    }
  }
  if (n === 0) {
    return 0;
  }
  return Math.sqrt(sse / n);
}
