import type { SamplingKind, QITileSnapshot, QISample } from "@shared/schema";

/** Build a normalized sampling window g(t) such that ∑ g · dt = 1. */
export function buildWindow(
  N: number,
  dt_s: number,
  tau_s: number,
  sampler: SamplingKind,
): Float64Array {
  const kernel = new Float64Array(Math.max(1, Math.floor(N) || 1));
  const mid = Math.floor(kernel.length / 2);
  let accum = 0;

  if (sampler === "lorentzian") {
    const c = tau_s / Math.PI;
    for (let k = 0; k < kernel.length; k++) {
      const t = (k - mid) * dt_s;
      const v = c / (t * t + tau_s * tau_s);
      kernel[k] = v;
      accum += v;
    }
  } else {
    const twoSigmaSq = 2 * tau_s * tau_s;
    for (let k = 0; k < kernel.length; k++) {
      const t = (k - mid) * dt_s;
      const v = Math.exp(-(t * t) / twoSigmaSq);
      kernel[k] = v;
      accum += v;
    }
  }

  const norm = accum * dt_s || 1;
  for (let k = 0; k < kernel.length; k++) {
    kernel[k] /= norm;
  }
  return kernel;
}

/** Compute S = |∫ g(t) ρ_neg(t) dt| / qiLimit for a discrete series. */
export function computeS(
  rho_t: ArrayLike<number>,
  dt_s: number,
  sampler: SamplingKind,
  tau_s: number,
  qiLimit: number,
): number {
  const N = rho_t.length;
  if (!N || dt_s <= 0 || tau_s <= 0 || qiLimit <= 0) return 0;
  const window = buildWindow(N, dt_s, tau_s, sampler);
  let avgNeg = 0;
  for (let k = 0; k < N; k++) {
    const rho = rho_t[k];
    if (rho < 0) avgNeg += window[k] * rho;
  }
  const S = Math.abs(avgNeg) / qiLimit;
  return Number.isFinite(S) ? Math.min(S, 1.5) : 0;
}

/** Approximate S when only instantaneous ρ_neg and qi_limit are available. */
export function computeSApprox(rhoNegJm3: number, qiLimit: number): number {
  if (!(qiLimit > 0)) return 0;
  const S = Math.abs(Math.min(0, rhoNegJm3)) / qiLimit;
  return Number.isFinite(S) ? Math.min(S, 1.5) : 0;
}

export type RawTileInput = {
  id: string;
  ijk: [number, number, number];
  center_m: [number, number, number];
  rho_neg_Jm3: number;
  tau_eff_s: number;
  qi_limit: number;
  Q_factor?: number;
  T_K?: number;
  absRho_Jm3?: number;
  deviation_Jm3?: number;
  sigmaNorm?: number;
  weight?: number;
};

type SampleOpts = {
  frame_kind?: "full" | "delta";
  sequence?: number;
};

export function reduceTilesToSample(
  tiles: RawTileInput[],
  tUnixMs: number,
  sampler: SamplingKind,
  window_s: number,
  opts: SampleOpts = {},
): QISample {
  const snapshots: QITileSnapshot[] = tiles.map((tile) => ({
    tileId: tile.id,
    ijk: tile.ijk,
    center_m: tile.center_m,
    rho_neg_Jm3: tile.rho_neg_Jm3,
    tau_eff_s: tile.tau_eff_s,
    qi_limit: tile.qi_limit,
    Q_factor: tile.Q_factor,
    T_K: tile.T_K,
    absRho_Jm3: tile.absRho_Jm3 ?? Math.abs(tile.rho_neg_Jm3),
    deviation_Jm3: tile.deviation_Jm3,
    sigmaNorm: tile.sigmaNorm,
    weight: tile.weight,
    S: computeSApprox(tile.rho_neg_Jm3, tile.qi_limit),
  }));

  return {
    tUnixMs,
    tiles: snapshots,
    meta: {
      window_s,
      sampler,
      frame_kind: opts.frame_kind ?? "delta",
      sequence: opts.sequence,
    },
  };
}
