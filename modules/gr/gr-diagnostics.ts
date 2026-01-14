import type { BssnState } from "./bssn-state";
import type { StencilParams } from "./bssn-evolve";
import { diff1 } from "./stencils";

export type ShiftStiffnessMetrics = {
  betaMaxAbs: number;
  betaP98Abs: number;
  gradBetaMaxAbs: number;
  gradBetaP98Abs: number;
  advectiveCflSuggested: number;
  charSpeedSuggested: number;
  charCflSuggested: number;
  shockIndex: number;
  shockSeverity: "ok" | "warn" | "severe";
  shockMode?: "off" | "diagnostic" | "stabilize";
  stabilizersApplied?: string[];
};

const DEFAULT_CFL_TARGET = 0.5;
const DEFAULT_SAMPLE_MAX = 50_000;
const P98 = 0.98;
const SHOCK_WARN = 0.5;
const SHOCK_SEVERE = 1.0;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const percentile = (values: number[], p: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const q = clampNumber(p, 0, 1);
  const index = Math.floor((sorted.length - 1) * q);
  return sorted[index] ?? 0;
};

export const computeShiftStiffnessMetrics = (
  state: BssnState,
  stencils?: StencilParams,
  options?: { cflTarget?: number; sampleMax?: number },
): ShiftStiffnessMetrics => {
  const { dims, spacing } = state.grid;
  const [nx, ny, nz] = dims;
  const boundary = stencils?.boundary ?? "clamp";
  const order = stencils?.order ?? 2;
  const stencilsResolved = { boundary, order };
  const total = Math.max(0, nx * ny * nz);
  const sampleMax = Math.max(1, Math.floor(options?.sampleMax ?? DEFAULT_SAMPLE_MAX));
  const stride = Math.max(1, Math.floor(total / sampleMax));
  const minSpacing = Math.max(1e-12, Math.min(spacing[0], spacing[1], spacing[2]));
  const cflTarget = Number.isFinite(options?.cflTarget)
    ? Math.max(0, options?.cflTarget as number)
    : DEFAULT_CFL_TARGET;

  const betaSamples: number[] = [];
  const gradSamples: number[] = [];
  let betaMaxAbs = 0;
  let gradBetaMaxAbs = 0;
  let charSpeedSuggested = 0;

  let idx = 0;
  for (let k = 0; k < nz; k += 1) {
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const bx = state.beta_x[idx];
        const by = state.beta_y[idx];
        const bz = state.beta_z[idx];
        const betaMagRaw = Math.hypot(bx, by, bz);
        const betaMag = Number.isFinite(betaMagRaw) ? betaMagRaw : 0;
        if (betaMag > betaMaxAbs) betaMaxAbs = betaMag;

        const dBx_dx = diff1(state.beta_x, i, j, k, 0, state.grid, stencilsResolved);
        const dBx_dy = diff1(state.beta_x, i, j, k, 1, state.grid, stencilsResolved);
        const dBx_dz = diff1(state.beta_x, i, j, k, 2, state.grid, stencilsResolved);
        const dBy_dx = diff1(state.beta_y, i, j, k, 0, state.grid, stencilsResolved);
        const dBy_dy = diff1(state.beta_y, i, j, k, 1, state.grid, stencilsResolved);
        const dBy_dz = diff1(state.beta_y, i, j, k, 2, state.grid, stencilsResolved);
        const dBz_dx = diff1(state.beta_z, i, j, k, 0, state.grid, stencilsResolved);
        const dBz_dy = diff1(state.beta_z, i, j, k, 1, state.grid, stencilsResolved);
        const dBz_dz = diff1(state.beta_z, i, j, k, 2, state.grid, stencilsResolved);
        const gradSq =
          dBx_dx * dBx_dx +
          dBx_dy * dBx_dy +
          dBx_dz * dBx_dz +
          dBy_dx * dBy_dx +
          dBy_dy * dBy_dy +
          dBy_dz * dBy_dz +
          dBz_dx * dBz_dx +
          dBz_dy * dBz_dy +
          dBz_dz * dBz_dz;
        const gradMag = Number.isFinite(gradSq) ? Math.sqrt(gradSq) : 0;
        if (gradMag > gradBetaMaxAbs) gradBetaMaxAbs = gradMag;

        if (idx % stride === 0) {
          betaSamples.push(betaMag);
          gradSamples.push(gradMag);
        }

        const alphaRaw = state.alpha[idx];
        const alphaAbs = Number.isFinite(alphaRaw) ? Math.abs(alphaRaw) : 0;
        const gxx = state.gamma_xx[idx];
        const gyy = state.gamma_yy[idx];
        const gzz = state.gamma_zz[idx];
        let metricSpeed = alphaAbs;
        if (Number.isFinite(gxx) && Number.isFinite(gyy) && Number.isFinite(gzz)) {
          if (gxx > 0 && gyy > 0 && gzz > 0) {
            const invMax = Math.max(1 / gxx, 1 / gyy, 1 / gzz);
            if (Number.isFinite(invMax) && invMax > 0) {
              metricSpeed = alphaAbs * Math.sqrt(invMax);
            }
          }
        }
        const charSpeed = betaMag + metricSpeed;
        if (Number.isFinite(charSpeed) && charSpeed > charSpeedSuggested) {
          charSpeedSuggested = charSpeed;
        }

        idx += 1;
      }
    }
  }

  const betaP98Abs = percentile(betaSamples, P98);
  const gradBetaP98Abs = percentile(gradSamples, P98);
  const betaSafe = Math.max(1e-12, betaMaxAbs);
  const charSafe = Math.max(1e-12, charSpeedSuggested);
  const advectiveCflSuggested = cflTarget * minSpacing / betaSafe;
  const charCflSuggested = cflTarget * minSpacing / charSafe;
  const betaP98Safe = Math.max(1e-12, betaP98Abs);
  const shockRaw = gradBetaP98Abs * minSpacing / betaP98Safe;
  const shockIndex = Number.isFinite(shockRaw) ? shockRaw : 0;
  let shockSeverity: ShiftStiffnessMetrics["shockSeverity"] = "ok";
  if (shockIndex >= SHOCK_SEVERE) {
    shockSeverity = "severe";
  } else if (shockIndex >= SHOCK_WARN) {
    shockSeverity = "warn";
  }

  return {
    betaMaxAbs,
    betaP98Abs,
    gradBetaMaxAbs,
    gradBetaP98Abs,
    advectiveCflSuggested,
    charSpeedSuggested,
    charCflSuggested,
    shockIndex,
    shockSeverity,
  };
};
