import { Buffer } from "node:buffer";
import { C } from "./utils/physics-const-safe";
import { getGlobalPipelineState } from "./energy-pipeline";

export type Vec3 = [number, number, number];

export interface CurvBrickParams {
  dims: [number, number, number];
  bounds: { min: Vec3; max: Vec3 };
  phase01: number;
  sigmaSector: number;
  splitEnabled: boolean;
  splitFrac: number;
  dutyFR: number;
  tauLC_s: number;
  Tm_s: number;
  beta0: number;
  betaMax: number;
  zeta: number;
  q: number;
  gammaGeo: number;
  gammaVdB: number;
  ampBase: number;
  clampQI: boolean;
}

export interface CurvatureBrick {
  dims: [number, number, number];
  voxelBytes: number;
  format: "r32f";
  data: Float32Array;
  min: number;
  max: number;
  qiMargin?: Float32Array;
  qiMin?: number;
  qiMax?: number;
}

const INV_TAU_FLOOR = 1e-12;
const INV_TM_FLOOR = 1e-15;
const LAMBDA_DEFAULT = 0.25; // meters – tuned to Natário wall scale

const tauWindow = (tauLC: number, Tm: number) => Math.max(tauLC, 5 * Tm);

const harmonicMean = (values: Vec3) => {
  const [a, b, c] = values;
  const denom = (1 / Math.max(a, 1e-9)) + (1 / Math.max(b, 1e-9)) + (1 / Math.max(c, 1e-9));
  if (!Number.isFinite(denom) || denom <= 0) return Math.cbrt(a * b * c);
  return 3 / denom;
};

const ellipsoidRho = (p: Vec3, axes: Vec3) => {
  const [x, y, z] = p;
  const [a, b, c] = axes;
  const nx = x / Math.max(a, 1e-9);
  const ny = y / Math.max(b, 1e-9);
  const nz = z / Math.max(c, 1e-9);
  return Math.hypot(nx, ny, nz);
};

const ellipsoidRadiusAt = (dir: Vec3, axes: Vec3) => {
  const [a, b, c] = axes;
  const [x, y, z] = dir;
  const denom =
    (x * x) / (a * a) +
    (y * y) / (b * b) +
    (z * z) / (c * c);
  if (denom <= 0) return Math.max(a, Math.max(b, c));
  return 1 / Math.sqrt(denom);
};

const normalize = (v: Vec3): Vec3 => {
  const [x, y, z] = v;
  const m = Math.hypot(x, y, z) || 1;
  return [x / m, y / m, z / m];
};

const softClamp = (value: number, limit: number) => {
  if (value <= limit) return value;
  const over = value - limit;
  return limit + over / (1 + over);
};

const wrap01 = (value: number) => {
  const n = value % 1;
  return n < 0 ? n + 1 : n;
};

const shortestPhaseDelta = (a: number, b: number) => {
  let delta = a - b;
  if (delta > 0.5) delta -= 1;
  if (delta < -0.5) delta += 1;
  return delta;
};

const gaussian = (x: number, sigma: number) => {
  const s = Math.max(sigma, 1e-4);
  const t = x / s;
  return Math.exp(-0.5 * t * t);
};

const defaultHullBounds = () => {
  const state = getGlobalPipelineState();
  const hull = state?.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173, wallThickness_m: 0.45 };
  const min: Vec3 = [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2];
  const max: Vec3 = [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2];
  return { min, max, axes: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2] as Vec3, wall: hull.wallThickness_m ?? 0.45 };
};

const qChain = (params: { q: number; gammaGeo: number; gammaVdB: number; zeta: number; ampBase: number }) => {
  const zetaWeight = 0.85 + 0.15 * Math.max(0, Math.min(1, params.zeta));
  const ampBoost = 1 + params.ampBase;
  return Math.pow(Math.max(params.gammaGeo, 1e-6), 3) *
    Math.max(params.q, 0) *
    Math.max(params.gammaVdB, 1e-6) *
    zetaWeight *
    ampBoost;
};

const computeSectorEnvelope = (position: Vec3, phase01: number, params: { sigma: number; splitEnabled: boolean; splitFrac: number }) => {
  const [x, , z] = position;
  const theta = wrap01((Math.atan2(z, x) / (2 * Math.PI)) + 0.5);
  const primaryWeight = gaussian(shortestPhaseDelta(theta, phase01), params.sigma);
  if (!params.splitEnabled) {
    return primaryWeight;
  }
  const secondaryPhase = wrap01(phase01 + 0.5);
  const secondaryWeight = gaussian(shortestPhaseDelta(theta, secondaryPhase), params.sigma);
  const frac = Math.max(0, Math.min(1, params.splitFrac));
  return frac * primaryWeight + (1 - frac) * secondaryWeight;
};

const betaAmplification = (distance: number, params: { tauLC: number; Tm: number; beta0: number; betaMax: number }) => {
  const tauLC = Math.max(params.tauLC, INV_TAU_FLOOR);
  const Tm = Math.max(params.Tm, INV_TM_FLOOR);
  const wallDecay = Math.exp(-Math.max(0, distance) / LAMBDA_DEFAULT);
  const base = params.beta0 * Math.sqrt(tauLC / Tm) * wallDecay;
  return Math.min(params.betaMax, base);
};

const qiAllowance = (kExpect: number, params: { window: number; betaAmp: number }) => {
  const windowGain = Math.sqrt(Math.max(params.window, INV_TAU_FLOOR));
  const betaBudget = Math.max(0.25, 1.1 - 0.1 * Math.min(params.betaAmp, 4));
  return kExpect * windowGain * betaBudget;
};

export function buildCurvatureBrick(input: Partial<CurvBrickParams>): CurvatureBrick {
  const defaults = defaultHullBounds();
  const dims: [number, number, number] = input.dims ?? [128, 128, 128];
  const bounds = input.bounds ?? { min: defaults.min, max: defaults.max };

  const phase01 = wrap01(input.phase01 ?? 0);
  const sigmaSector = Math.max(input.sigmaSector ?? 0.05, 1e-3);
  const splitEnabled = input.splitEnabled ?? false;
  const splitFrac = Math.max(0, Math.min(1, input.splitFrac ?? 0.6));
  const dutyFR = Math.max(input.dutyFR ?? 0.0025, 1e-6);
  const tauLC = Math.max(input.tauLC_s ?? defaults.axes[0] / C, INV_TAU_FLOOR);
  const Tm = Math.max(input.Tm_s ?? 1 / (15e9), INV_TM_FLOOR);
  const beta0 = Math.max(input.beta0 ?? 1, 0);
  const betaMax = Math.max(input.betaMax ?? 12, 0.5);
  const zeta = input.zeta ?? 0.84;
  const q = Math.max(input.q ?? 1, 0);
  const gammaGeo = Math.max(input.gammaGeo ?? 26, 1e-6);
  const gammaVdB = Math.max(input.gammaVdB ?? 1e11, 1e-6);
  const ampBase = Math.max(input.ampBase ?? 0, 0);
  const clampQI = input.clampQI ?? true;

  const chain = qChain({ q, gammaGeo, gammaVdB, zeta, ampBase });
  const kScale = chain * dutyFR;

  const [nx, ny, nz] = dims;
  const dx = (bounds.max[0] - bounds.min[0]) / nx;
  const dy = (bounds.max[1] - bounds.min[1]) / ny;
  const dz = (bounds.max[2] - bounds.min[2]) / nz;

  const axes: Vec3 = defaults.axes;
  const wallSigma = Math.max(defaults.wall, 0.1);
  const axesVec: Vec3 = [axes[0], axes[1], axes[2]];
  const radialMean = harmonicMean(axesVec);
  const centers = new Float32Array(nx * ny * nz);
  const qi = clampQI ? new Float32Array(nx * ny * nz) : undefined;

  let idx = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let qiMin = Number.POSITIVE_INFINITY;
  let qiMax = Number.NEGATIVE_INFINITY;

  const expect = kScale; // baseline expectation per voxel prior to envelopes

  for (let k = 0; k < nz; k++) {
    const z = bounds.min[2] + (k + 0.5) * dz;
    for (let j = 0; j < ny; j++) {
      const y = bounds.min[1] + (j + 0.5) * dy;
      for (let i = 0; i < nx; i++) {
        const x = bounds.min[0] + (i + 0.5) * dx;
        const pos: Vec3 = [x, y, z];
        const rho = ellipsoidRho(pos, axesVec);
        const dir = normalize(pos);
        const radius = ellipsoidRadiusAt(dir, axesVec);
        const centerDist = (rho - 1) * radius;
        const wallFalloff = Math.exp(-0.5 * Math.pow(centerDist / Math.max(wallSigma, 0.1), 2));

        const envelope = computeSectorEnvelope(pos, phase01, { sigma: sigmaSector, splitEnabled, splitFrac });
        const kDrive = kScale * wallFalloff * envelope;

        const betaAmp = betaAmplification(centerDist, { tauLC, Tm, beta0, betaMax });
        let kVox = kDrive * betaAmp;

        if (clampQI && qi) {
          const window = tauWindow(tauLC, Tm);
          const allow = qiAllowance(expect, { window, betaAmp });
          if (kVox > allow) {
            kVox = softClamp(kVox, allow);
          }
          const margin = allow - kVox;
          qi[idx] = margin;
          if (margin < qiMin) qiMin = margin;
          if (margin > qiMax) qiMax = margin;
        }

        centers[idx] = kVox;
        if (kVox < min) min = kVox;
        if (kVox > max) max = kVox;
        idx++;
      }
    }
  }

  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 0;
  if (qi && (!Number.isFinite(qiMin) || !Number.isFinite(qiMax))) {
    qiMin = 0;
    qiMax = 0;
  }

  return {
    dims,
    voxelBytes: 4,
    format: "r32f",
    data: centers,
    min,
    max,
    qiMargin: qi,
    qiMin,
    qiMax,
  };
}

export interface CurvatureBrickResponse {
  dims: [number, number, number];
  format: "r32f";
  voxelBytes: number;
  data: string;
  min: number;
  max: number;
  qiMargin?: string;
  qiMin?: number;
  qiMax?: number;
  emaAlpha?: number;
  residualMin?: number;
  residualMax?: number;
}

export const serializeBrick = (brick: CurvatureBrick): CurvatureBrickResponse => {
  const baseData = Buffer.from(brick.data.buffer, brick.data.byteOffset, brick.data.byteLength).toString("base64");
  const response: CurvatureBrickResponse = {
    dims: brick.dims,
    format: brick.format,
    voxelBytes: brick.voxelBytes,
    data: baseData,
    min: brick.min,
    max: brick.max,
    emaAlpha: 0.18,
    residualMin: -8.0,
    residualMax: 8.0,
  };
  if (brick.qiMargin) {
    response.qiMargin = Buffer.from(brick.qiMargin.buffer, brick.qiMargin.byteOffset, brick.qiMargin.byteLength).toString("base64");
    response.qiMin = brick.qiMin;
    response.qiMax = brick.qiMax;
  }
  return response;
};
