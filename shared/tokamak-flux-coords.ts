export type FluxBandingOptions = {
  core_max?: number;
  edge_max?: number;
  mask?: Float32Array | Uint8Array;
};

export type FluxBandMasks = {
  core: Float32Array;
  edge: Float32Array;
  sol: Float32Array;
  coverage: {
    core: number;
    edge: number;
    sol: number;
    total: number;
  };
};

export const buildFluxBandMasks = (
  psiN: Float32Array,
  opts: FluxBandingOptions = {},
): FluxBandMasks => {
  const coreMax = opts.core_max ?? 0.95;
  const edgeMax = opts.edge_max ?? 1.02;
  const lower = Math.min(coreMax, edgeMax);
  const upper = Math.max(coreMax, edgeMax);
  const core = new Float32Array(psiN.length);
  const edge = new Float32Array(psiN.length);
  const sol = new Float32Array(psiN.length);
  let total = 0;
  let coreCount = 0;
  let edgeCount = 0;
  let solCount = 0;
  const mask = opts.mask;
  for (let i = 0; i < psiN.length; i++) {
    const m = mask ? mask[i] : 1;
    if (!(m > 0)) continue;
    const value = psiN[i];
    if (!Number.isFinite(value)) continue;
    total += 1;
    if (value <= lower) {
      core[i] = 1;
      coreCount += 1;
    } else if (value <= upper) {
      edge[i] = 1;
      edgeCount += 1;
    } else {
      sol[i] = 1;
      solCount += 1;
    }
  }
  const denom = total > 0 ? total : 1;
  return {
    core,
    edge,
    sol,
    coverage: {
      core: coreCount / denom,
      edge: edgeCount / denom,
      sol: solCount / denom,
      total,
    },
  };
};
