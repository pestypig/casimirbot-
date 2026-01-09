import { TokamakStabilityProxyMetrics } from "@shared/tokamak-stability-proxies";
import { buildFluxBandMasks } from "@shared/tokamak-flux-coords";
import type { TTokamakStabilityProxyMetrics } from "@shared/tokamak-stability-proxies";

type ProxyInputs = {
  u_gradp?: Float32Array | null;
  u_J?: Float32Array | null;
  psi_N?: Float32Array | null;
  mask?: Float32Array | Uint8Array | null;
  flux_banding?: {
    core_max?: number;
    edge_max?: number;
  };
};

const percentile = (values: number[], p: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = Math.min(1, Math.max(0, p)) * (sorted.length - 1);
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  if (lower === upper) return sorted[lower];
  const t = pos - lower;
  return sorted[lower] * (1 - t) + sorted[upper] * t;
};

const buildMaskOn = (mask?: Float32Array | Uint8Array | null): Uint8Array | undefined => {
  if (!mask) return undefined;
  if (mask instanceof Uint8Array) return mask;
  const out = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) {
    out[i] = mask[i] > 0 ? 1 : 0;
  }
  return out;
};

const collectMaskedValues = (
  arr: Float32Array | null | undefined,
  maskOn?: Uint8Array,
): number[] => {
  if (!arr) return [];
  const values: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (maskOn && !maskOn[i]) continue;
    const v = arr[i];
    if (Number.isFinite(v)) values.push(v);
  }
  return values;
};

const combineMasks = (
  base?: Uint8Array,
  band?: Float32Array,
): Uint8Array | undefined => {
  if (!base && !band) return undefined;
  const length = base ? base.length : band!.length;
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    const allowed = base ? base[i] > 0 : true;
    const bandOn = band ? band[i] > 0 : true;
    out[i] = allowed && bandOn ? 1 : 0;
  }
  return out;
};

export const computeTokamakStabilityProxies = (
  input: ProxyInputs,
): TTokamakStabilityProxyMetrics | undefined => {
  const maskOn = buildMaskOn(input.mask ?? undefined);
  const gradpValues = collectMaskedValues(input.u_gradp, maskOn);
  const currentValues = collectMaskedValues(input.u_J, maskOn);
  const proxies: TTokamakStabilityProxyMetrics = {};

  if (gradpValues.length) {
    proxies.gradp_p95 = percentile(gradpValues, 0.95);
  }
  if (currentValues.length) {
    proxies.current_p95 = percentile(currentValues, 0.95);
  }

  if (input.psi_N) {
    const bands = buildFluxBandMasks(input.psi_N, {
      core_max: input.flux_banding?.core_max,
      edge_max: input.flux_banding?.edge_max,
      mask: maskOn,
    });
    proxies.psi_core_fraction = bands.coverage.core;
    proxies.psi_edge_fraction = bands.coverage.edge;

    const edgeMask = combineMasks(maskOn, bands.edge);
    const edgeGradp = collectMaskedValues(input.u_gradp, edgeMask);
    const edgeCurrent = collectMaskedValues(input.u_J, edgeMask);
    if (edgeGradp.length) {
      proxies.gradp_edge_p95 = percentile(edgeGradp, 0.95);
    }
    if (edgeCurrent.length) {
      proxies.current_edge_p95 = percentile(edgeCurrent, 0.95);
    }
  }

  if (Object.keys(proxies).length === 0) return undefined;
  return TokamakStabilityProxyMetrics.parse(proxies);
};
