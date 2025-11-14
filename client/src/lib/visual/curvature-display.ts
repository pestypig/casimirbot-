// Centralized display transfer utilities for warp/Alcubierre visuals.
// These functions do NOT change physics — they only map scalar magnitudes
// into visual gains or normalized display values. Keep side‑effect free.

export type RidgeMode = 0 | 1; // 0 = REAL (double-lobe |d*dG|), 1 = SHOW (single crest |d|*G)

export type DisplayMode =
  | "raw"          // 1:1, no extra gain beyond zeroStop protection
  | "exaggerated"  // constant gain multiplier for legibility
  | "calibrated";  // fits crest to rim (if/when hooked up)

export interface ThetaChainInputs {
  gammaGeo: number;   // I3_geo (>=1)
  q: number;          // dA/A (>=0)
  gammaVdB: number;   // I3_VdB (>=1)
  dutyFR: number;     // 0..1
  viewAvg?: boolean;  // multiply by sqrt(duty)
}

export interface DisplayTransferParams {
  mode: DisplayMode;
  ridgeMode: RidgeMode;
  zeroStop?: number;   // small positive floor to avoid log blow‑ups
  gain?: number;       // only used for exaggerated mode
}

export interface DisplayTransferOut {
  theta: number;
  displayGain: number; // scalar gain applied to base magnitude path
  zeroStop: number;
}

export function computeTheta(chain: ThetaChainInputs): number {
  const gGeo = Math.max(1.0, Number.isFinite(chain.gammaGeo) ? chain.gammaGeo : 1.0);
  const q = Math.max(0, Number.isFinite(chain.q) ? chain.q : 0);
  const gV = Math.max(1.0, Number.isFinite(chain.gammaVdB) ? chain.gammaVdB : 1.0);
  const dFR = Math.min(1, Math.max(0, Number.isFinite(chain.dutyFR) ? chain.dutyFR : 0));
  const dutyTerm = chain.viewAvg ? Math.sqrt(dFR) : 1.0;
  // Canonical chain used across viewers
  return Math.pow(gGeo, 3) * Math.max(1e-12, q) * Math.max(1.0, gV) * dutyTerm;
}

export function mapThetaToDisplay(
  chain: ThetaChainInputs,
  params: DisplayTransferParams,
): DisplayTransferOut {
  const theta = computeTheta(chain);
  const zeroStop = Math.max(1e-12, Number.isFinite(params.zeroStop!) ? (params.zeroStop as number) : 1e-9);

  if (params.mode === "raw") {
    return { theta, displayGain: 1.0, zeroStop };
  }
  if (params.mode === "exaggerated") {
    const g = Number.isFinite(params.gain as number) ? (params.gain as number) : 20.0;
    return { theta, displayGain: Math.max(1.0, g), zeroStop };
  }
  // calibrated — placeholder until crest-to-rim fit is fully wired
  // For now keep a gentle gain above raw, but expose identical interface.
  return { theta, displayGain: 3.0, zeroStop };
}

