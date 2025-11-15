import { Buffer } from "node:buffer";
import type { Vec3 } from "./curvature-brick";
import { getGlobalPipelineState } from "./energy-pipeline";
import { enhancedAvgEnergyDensity, natarioShiftFromDensity } from "../modules/dynamic/stress-energy-equations.js";

export interface StressEnergyBrickParams {
  dims: [number, number, number];
  bounds?: { min: Vec3; max: Vec3 };
  phase01: number;
  sigmaSector: number;
  splitEnabled: boolean;
  splitFrac: number;
  dutyFR: number;
  q: number;
  gammaGeo: number;
  gammaVdB: number;
  ampBase: number;
  zeta: number;
  driveDir?: Vec3 | null;
}

export interface StressEnergyChannel {
  data: Float32Array;
  min: number;
  max: number;
}

export interface StressEnergyStats {
  totalEnergy_J: number;
  avgT00: number;
  avgFluxMagnitude: number;
  netFlux: Vec3;
  divMin: number;
  divMax: number;
  dutyFR: number;
  strobePhase: number;
}

export interface StressEnergyBrick {
  dims: [number, number, number];
  voxelBytes: number;
  format: "r32f";
  channels: {
    t00: StressEnergyChannel;
    Sx: StressEnergyChannel;
    Sy: StressEnergyChannel;
    Sz: StressEnergyChannel;
    divS: StressEnergyChannel;
  };
  stats: StressEnergyStats;
}

const EPS = 1e-9;
const TWO_PI = Math.PI * 2;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const wrap01 = (value: number) => {
  const n = value % 1;
  return n < 0 ? n + 1 : n;
};

const gaussian = (x: number, sigma: number) => {
  const s = Math.max(sigma, 1e-4);
  const t = x / s;
  return Math.exp(-0.5 * t * t);
};

const shortestPhaseDelta = (a: number, b: number) => {
  let delta = a - b;
  if (delta > 0.5) delta -= 1;
  if (delta < -0.5) delta += 1;
  return delta;
};

const normalize = (v: Vec3): Vec3 => {
  const [x, y, z] = v;
  const mag = Math.hypot(x, y, z);
  if (!Number.isFinite(mag) || mag === 0) {
    return [0, 0, 0];
  }
  return [x / mag, y / mag, z / mag];
};

const defaultHullBounds = () => {
  const state = getGlobalPipelineState();
  const hull = state?.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173, wallThickness_m: 0.45 };
  const min: Vec3 = [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2];
  const max: Vec3 = [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2];
  return {
    min,
    max,
    axes: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2] as Vec3,
    wall: hull.wallThickness_m ?? 0.45,
  };
};

const ellipsoidRho = (p: Vec3, axes: Vec3) => {
  const [x, y, z] = p;
  const [a, b, c] = axes;
  const nx = x / Math.max(a, 1e-6);
  const ny = y / Math.max(b, 1e-6);
  const nz = z / Math.max(c, 1e-6);
  return Math.hypot(nx, ny, nz);
};

const ellipsoidRadiusAt = (dir: Vec3, axes: Vec3) => {
  const [a, b, c] = axes;
  const [x, y, z] = dir;
  const denom = (x * x) / (a * a) + (y * y) / (b * b) + (z * z) / (c * c);
  if (denom <= 0) return Math.max(a, Math.max(b, c));
  return 1 / Math.sqrt(denom);
};

const ellipsoidNormal = (pos: Vec3, axesSq: Vec3): Vec3 => {
  const [x, y, z] = pos;
  const nx = x / Math.max(axesSq[0], 1e-6);
  const ny = y / Math.max(axesSq[1], 1e-6);
  const nz = z / Math.max(axesSq[2], 1e-6);
  return normalize([nx, ny, nz]);
};

const azimuth01 = (x: number, z: number) => wrap01((Math.atan2(z, x) / TWO_PI) + 0.5);

const computeSectorEnvelope = (theta: number, phase01: number, params: { sigma: number; splitEnabled: boolean; splitFrac: number }) => {
  const primary = gaussian(shortestPhaseDelta(theta, phase01), params.sigma);
  if (!params.splitEnabled) {
    return primary;
  }
  const secondaryPhase = wrap01(phase01 + 0.5);
  const secondary = gaussian(shortestPhaseDelta(theta, secondaryPhase), params.sigma);
  const frac = clamp01(params.splitFrac);
  return frac * primary + (1 - frac) * secondary;
};

const blendDirections = (a: Vec3, b: Vec3 | null, weight: number): Vec3 => {
  if (!b) return a;
  const t = clamp01(weight);
  return normalize([
    a[0] * (1 - t) + b[0] * t,
    a[1] * (1 - t) + b[1] * t,
    a[2] * (1 - t) + b[2] * t,
  ]);
};

const encodeFloat32 = (payload: Float32Array) =>
  Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength).toString("base64");

const axisIndex = (x: number, y: number, z: number, nx: number, ny: number) => z * nx * ny + y * nx + x;

const gradientX = (field: Float32Array, x: number, y: number, z: number, nx: number, ny: number, dx: number) => {
  if (nx <= 1 || dx === 0) return 0;
  const left = x > 0 ? x - 1 : x;
  const right = x < nx - 1 ? x + 1 : x;
  const denom = (right - left) * dx;
  if (denom === 0) return 0;
  const leftVal = field[axisIndex(left, y, z, nx, ny)];
  const rightVal = field[axisIndex(right, y, z, nx, ny)];
  return (rightVal - leftVal) / denom;
};

const gradientY = (field: Float32Array, x: number, y: number, z: number, nx: number, ny: number, dy: number) => {
  if (ny <= 1 || dy === 0) return 0;
  const down = y > 0 ? y - 1 : y;
  const up = y < ny - 1 ? y + 1 : y;
  const denom = (up - down) * dy;
  if (denom === 0) return 0;
  const downVal = field[axisIndex(x, down, z, nx, ny)];
  const upVal = field[axisIndex(x, up, z, nx, ny)];
  return (upVal - downVal) / denom;
};

const gradientZ = (field: Float32Array, x: number, y: number, z: number, nx: number, ny: number, nz: number, dz: number) => {
  if (nz <= 1 || dz === 0) return 0;
  const back = z > 0 ? z - 1 : z;
  const front = z < nz - 1 ? z + 1 : z;
  const denom = (front - back) * dz;
  if (denom === 0) return 0;
  const backVal = field[axisIndex(x, y, back, nx, ny)];
  const frontVal = field[axisIndex(x, y, front, nx, ny)];
  return (frontVal - backVal) / denom;
};

export function buildStressEnergyBrick(input: Partial<StressEnergyBrickParams>): StressEnergyBrick {
  const defaults = defaultHullBounds();
  const dims: [number, number, number] = input.dims ?? [128, 128, 128];
  const bounds = input.bounds ?? { min: defaults.min, max: defaults.max };

  const phase01 = wrap01(input.phase01 ?? 0);
  const sigmaSector = Math.max(input.sigmaSector ?? 0.05, 1e-3);
  const splitEnabled = input.splitEnabled ?? false;
  const splitFrac = clamp01(input.splitFrac ?? 0.6);
  const dutyFR = Math.max(input.dutyFR ?? 0.0025, 1e-8);
  const q = Math.max(input.q ?? 1, 1e-4);
  const gammaGeo = Math.max(input.gammaGeo ?? 26, 1);
  const gammaVdB = Math.max(input.gammaVdB ?? 1, 1);
  const ampBase = Math.max(input.ampBase ?? 0, 0);
  const zeta = clamp01(input.zeta ?? 0.84);
  const driveDirInput = input.driveDir && Array.isArray(input.driveDir) ? (input.driveDir as Vec3) : null;
  const driveDirUnit = driveDirInput ? normalize(driveDirInput) : null;

  const state = getGlobalPipelineState();
  const gap_m = Math.max(1e-12, (state?.gap_nm ?? 1) * 1e-9);
  const cavityQ = Math.max(1e5, state?.qCavity ?? state?.QL ?? 1e9);
  const dutyEff = dutyFR;
  const qSpoil = Math.max(1e-6, state?.qSpoilingFactor ?? q);

  const { rho_avg } = enhancedAvgEnergyDensity({
    gap_m,
    gammaGeo,
    cavityQ,
    gammaVdB,
    gammaVanDenBroeck: gammaVdB,
    qSpoilingFactor: qSpoil,
    deltaAOverA: qSpoil,
    dutyEff,
  });

  const [nx, ny, nz] = dims;
  const dx = (bounds.max[0] - bounds.min[0]) / nx;
  const dy = (bounds.max[1] - bounds.min[1]) / ny;
  const dz = (bounds.max[2] - bounds.min[2]) / nz;
  const cellVolume = dx * dy * dz;

  const axes = defaults.axes;
  const axesSq: Vec3 = [axes[0] * axes[0], axes[1] * axes[1], axes[2] * axes[2]];
  const wallSigma = Math.max(defaults.wall, 0.1);
  const totalVoxels = nx * ny * nz;
  const envelope = new Float32Array(totalVoxels);
  let envelopeSum = 0;

  const nowSeconds = Date.now() / 1000;
  const strobeHz = Number.isFinite(state?.strobeHz) ? Number(state!.strobeHz) : 1000;
  const strobePhase = wrap01((nowSeconds * strobeHz) % 1);
  const driveGain = q * (0.85 + 0.15 * zeta) * (1 + 0.25 * ampBase);

  let idx = 0;
  for (let z = 0; z < nz; z++) {
    const pz = bounds.min[2] + (z + 0.5) * dz;
    for (let y = 0; y < ny; y++) {
      const py = bounds.min[1] + (y + 0.5) * dy;
      for (let x = 0; x < nx; x++) {
        const px = bounds.min[0] + (x + 0.5) * dx;
        const pos: Vec3 = [px, py, pz];
        const rho = ellipsoidRho(pos, axes);
        const dir = normalize(pos);
        const radius = ellipsoidRadiusAt(dir, axes);
        const centerDist = (rho - 1) * radius;
        const wallEnvelope = Math.exp(-0.5 * Math.pow(centerDist / wallSigma, 2));
        const theta = azimuth01(px, pz);
        const sectorEnvelope = computeSectorEnvelope(theta, phase01, { sigma: sigmaSector, splitEnabled, splitFrac });
        const phaseDelta = shortestPhaseDelta(theta, phase01);
        const strobeEnvelope = 0.5 + 0.5 * Math.cos(TWO_PI * wrap01(strobePhase - phaseDelta));
        const value = wallEnvelope * sectorEnvelope * driveGain * (0.65 + 0.35 * strobeEnvelope);
        envelope[idx] = value;
        envelopeSum += value;
        idx += 1;
      }
    }
  }

  const envelopeScale = envelopeSum > EPS ? totalVoxels / envelopeSum : 1;
  const t00 = new Float32Array(totalVoxels);
  const betaX = new Float32Array(totalVoxels);
  const betaY = new Float32Array(totalVoxels);
  const betaZ = new Float32Array(totalVoxels);
  let t00Min = Number.POSITIVE_INFINITY;
  let t00Max = Number.NEGATIVE_INFINITY;
  let sumT00 = 0;

  idx = 0;
  for (let z = 0; z < nz; z++) {
    const pz = bounds.min[2] + (z + 0.5) * dz;
    for (let y = 0; y < ny; y++) {
      const py = bounds.min[1] + (y + 0.5) * dy;
      for (let x = 0; x < nx; x++) {
        const px = bounds.min[0] + (x + 0.5) * dx;
        const pos: Vec3 = [px, py, pz];
        const density = rho_avg * envelope[idx] * envelopeScale;
        t00[idx] = density;
        if (density < t00Min) t00Min = density;
        if (density > t00Max) t00Max = density;
        sumT00 += density;

        const dir = normalize(pos);
        const radius = ellipsoidRadiusAt(dir, axes);
        const normal = ellipsoidNormal(pos, axesSq);
        const betaDir = blendDirections(normal, driveDirUnit, 0.32);
        const betaAmp = natarioShiftFromDensity(Math.abs(density), Math.max(radius, 1e-3));
        const sign = density >= 0 ? 1 : -1;
        betaX[idx] = betaDir[0] * betaAmp * sign;
        betaY[idx] = betaDir[1] * betaAmp * sign;
        betaZ[idx] = betaDir[2] * betaAmp * sign;
        idx += 1;
      }
    }
  }

  const Sx = new Float32Array(totalVoxels);
  const Sy = new Float32Array(totalVoxels);
  const Sz = new Float32Array(totalVoxels);
  let SxMin = Number.POSITIVE_INFINITY;
  let SxMax = Number.NEGATIVE_INFINITY;
  let SyMin = Number.POSITIVE_INFINITY;
  let SyMax = Number.NEGATIVE_INFINITY;
  let SzMin = Number.POSITIVE_INFINITY;
  let SzMax = Number.NEGATIVE_INFINITY;
  let fluxMagSum = 0;
  let netFlux: Vec3 = [0, 0, 0];

  idx = 0;
  for (let z = 0; z < nz; z++) {
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const bX = betaX[idx];
        const bY = betaY[idx];
        const bZ = betaZ[idx];
        const curlX = gradientY(betaZ, x, y, z, nx, ny, dy) - gradientZ(betaY, x, y, z, nx, ny, nz, dz);
        const curlY = gradientZ(betaX, x, y, z, nx, ny, nz, dz) - gradientX(betaZ, x, y, z, nx, ny, dx);
        const curlZ = gradientX(betaY, x, y, z, nx, ny, dx) - gradientY(betaX, x, y, z, nx, ny, dy);
        const sX = bY * curlZ - bZ * curlY;
        const sY = bZ * curlX - bX * curlZ;
        const sZ = bX * curlY - bY * curlX;
        Sx[idx] = sX;
        Sy[idx] = sY;
        Sz[idx] = sZ;
        if (sX < SxMin) SxMin = sX;
        if (sX > SxMax) SxMax = sX;
        if (sY < SyMin) SyMin = sY;
        if (sY > SyMax) SyMax = sY;
        if (sZ < SzMin) SzMin = sZ;
        if (sZ > SzMax) SzMax = sZ;
        const mag = Math.hypot(sX, sY, sZ);
        fluxMagSum += mag;
        netFlux = [
          netFlux[0] + sX * cellVolume,
          netFlux[1] + sY * cellVolume,
          netFlux[2] + sZ * cellVolume,
        ];
        idx += 1;
      }
    }
  }

  const divS = new Float32Array(totalVoxels);
  let divMin = Number.POSITIVE_INFINITY;
  let divMax = Number.NEGATIVE_INFINITY;
  idx = 0;
  for (let z = 0; z < nz; z++) {
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const div =
          gradientX(Sx, x, y, z, nx, ny, dx) +
          gradientY(Sy, x, y, z, nx, ny, dy) +
          gradientZ(Sz, x, y, z, nx, ny, nz, dz);
        divS[idx] = div;
        if (div < divMin) divMin = div;
        if (div > divMax) divMax = div;
        idx += 1;
      }
    }
  }

  if (!Number.isFinite(t00Min)) t00Min = 0;
  if (!Number.isFinite(t00Max)) t00Max = 0;
  if (!Number.isFinite(SxMin)) SxMin = 0;
  if (!Number.isFinite(SxMax)) SxMax = 0;
  if (!Number.isFinite(SyMin)) SyMin = 0;
  if (!Number.isFinite(SyMax)) SyMax = 0;
  if (!Number.isFinite(SzMin)) SzMin = 0;
  if (!Number.isFinite(SzMax)) SzMax = 0;
  if (!Number.isFinite(divMin)) divMin = 0;
  if (!Number.isFinite(divMax)) divMax = 0;

  const stats: StressEnergyStats = {
    totalEnergy_J: sumT00 * cellVolume,
    avgT00: sumT00 / Math.max(totalVoxels, 1),
    avgFluxMagnitude: fluxMagSum / Math.max(totalVoxels, 1),
    netFlux,
    divMin,
    divMax,
    dutyFR,
    strobePhase,
  };

  return {
    dims,
    voxelBytes: 4,
    format: "r32f",
    channels: {
      t00: { data: t00, min: t00Min, max: t00Max },
      Sx: { data: Sx, min: SxMin, max: SxMax },
      Sy: { data: Sy, min: SyMin, max: SyMax },
      Sz: { data: Sz, min: SzMin, max: SzMax },
      divS: { data: divS, min: divMin, max: divMax },
    },
    stats,
  };
}

export interface StressEnergyBrickResponseChannel {
  data: string;
  min: number;
  max: number;
}

export interface StressEnergyBrickResponse {
  dims: [number, number, number];
  voxelBytes: number;
  format: "r32f";
  channels: {
    t00: StressEnergyBrickResponseChannel;
    Sx: StressEnergyBrickResponseChannel;
    Sy: StressEnergyBrickResponseChannel;
    Sz: StressEnergyBrickResponseChannel;
    divS: StressEnergyBrickResponseChannel;
  };
  stats: StressEnergyStats;
}

export const serializeStressEnergyBrick = (brick: StressEnergyBrick): StressEnergyBrickResponse => ({
  dims: brick.dims,
  voxelBytes: brick.voxelBytes,
  format: brick.format,
  channels: {
    t00: { data: encodeFloat32(brick.channels.t00.data), min: brick.channels.t00.min, max: brick.channels.t00.max },
    Sx: { data: encodeFloat32(brick.channels.Sx.data), min: brick.channels.Sx.min, max: brick.channels.Sx.max },
    Sy: { data: encodeFloat32(brick.channels.Sy.data), min: brick.channels.Sy.min, max: brick.channels.Sy.max },
    Sz: { data: encodeFloat32(brick.channels.Sz.data), min: brick.channels.Sz.min, max: brick.channels.Sz.max },
    divS: { data: encodeFloat32(brick.channels.divS.data), min: brick.channels.divS.min, max: brick.channels.divS.max },
  },
  stats: brick.stats,
});
