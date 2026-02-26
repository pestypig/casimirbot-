import { Buffer } from "node:buffer";
import { resolveHullRadius, type HullRadialMap, type Vec3 } from "./curvature-brick";
import { getGlobalPipelineState } from "./energy-pipeline";
import { enhancedAvgEnergyDensity, natarioShiftFromDensity } from "../modules/dynamic/stress-energy-equations.js";
import { computeInvariantMassFromFluxTotals } from "../modules/gr/stress-energy-integrals.js";

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
  hullAxes?: Vec3;
  hullWall?: number;
  radialMap?: HullRadialMap | null;
  metricT00?: number;
  metricT00Source?: string;
  metricT00Ref?: string;
  observerRapidityCap?: number;
  observerTypeITolerance?: number;
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
  totalMomentum_kg_m_s?: Vec3;
  momentumMagnitude_kg_m_s?: number;
  invariantMass_kg?: number;
  invariantMassEnergy_J?: number;
  divMin: number;
  divMax: number;
  dutyFR: number;
  strobePhase: number;
  natario?: NatarioDiagnostics;
  conservation?: StressEnergyConservationStats;
  mapping?: StressEnergyMappingStats;
  observerRobust?: ObserverRobustDiagnostics;
}

export interface NatarioDiagnostics {
  divBetaMax: number;
  divBetaRms: number;
  divBetaMaxPre?: number;
  divBetaRmsPre?: number;
  divBetaMaxPost?: number;
  divBetaRmsPost?: number;
  clampScale?: number;
  clampApplied?: boolean;
  clampActivationRate?: number;
  clampMode?: "natario" | "stability";
  gateLimit: number;
  gNatario: number;
}

export interface StressEnergyConservationStats {
  divMean: number;
  divAbsMean: number;
  divRms: number;
  divMaxAbs: number;
  netFluxMagnitude: number;
  netFluxNorm: number;
  divRmsNorm: number;
}

export interface StressEnergyMappingStats {
  rho_avg: number;
  rho_inst: number;
  gap_nm: number;
  cavityQ: number;
  qSpoil: number;
  gammaGeo: number;
  gammaVdB: number;
  dutyFR: number;
  ampBase: number;
  zeta: number;
  pressureFactor?: number;
  pressureSource?: "pipeline" | "proxy" | "override";
  anisotropyStrength?: number;
  anisotropyMode?: "flux" | "radial";
  conservationDamping?: number;
  conservationNetFlux?: boolean;
  conservationScale?: number;
  source?: "pipeline" | "defaults" | "metric";
  proxy: boolean;
}

export type ObserverMarginSource = "algebraic_type_i" | "capped_search";

export interface ObserverConditionSummary {
  eulerianMin: number;
  eulerianMean: number;
  robustMin: number;
  robustMean: number;
  eulerianViolationFraction: number;
  robustViolationFraction: number;
  missedViolationFraction: number;
  severityGainMin: number;
  severityGainMean: number;
  maxRobustMinusEulerian: number;
  worstCase: {
    index: number;
    value: number;
    direction: Vec3;
    rapidity: number | null;
    source: ObserverMarginSource;
  };
}

export interface ObserverRobustDiagnostics {
  pressureModel: "isotropic_pressure";
  pressureFactor: number;
  rapidityCap: number;
  rapidityCapBeta: number;
  typeI: {
    count: number;
    fraction: number;
    tolerance: number;
  };
  nec: ObserverConditionSummary;
  wec: ObserverConditionSummary;
  sec: ObserverConditionSummary;
  dec: ObserverConditionSummary;
  consistency: {
    robustNotGreaterThanEulerian: boolean;
    maxRobustMinusEulerian: number;
  };
}

export interface StressEnergyBrick {
  dims: [number, number, number];
  voxelBytes: number;
  format: "r32f";
  source?: "pipeline" | "metric" | "unknown";
  proxy?: boolean;
  congruence?: "proxy-only" | "geometry-derived" | "conditional";
  metricT00Ref?: string;
  metricT00Source?: string;
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
const NATARIO_K_TOL = 1e-6;
const ALCUBIERRE_K_TOL = 1e-4;
const DEFAULT_OBSERVER_RAPIDITY_CAP = 2.5;
const DEFAULT_HAWKING_ELLIS_TYPE_I_TOL = 1e-9;
const STRESS_ENERGY_CHANNEL_ORDER = ["t00", "Sx", "Sy", "Sz", "divS"] as const;

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

const smoothVectorField = (
  fieldX: Float32Array,
  fieldY: Float32Array,
  fieldZ: Float32Array,
  nx: number,
  ny: number,
  nz: number,
  passes = 1,
) => {
  if (passes <= 0) return;
  const total = nx * ny * nz;
  const tmpX = new Float32Array(total);
  const tmpY = new Float32Array(total);
  const tmpZ = new Float32Array(total);
  for (let pass = 0; pass < passes; pass += 1) {
    let idx = 0;
    for (let z = 0; z < nz; z++) {
      const zStart = Math.max(0, z - 1);
      const zEnd = Math.min(nz - 1, z + 1);
      for (let y = 0; y < ny; y++) {
        const yStart = Math.max(0, y - 1);
        const yEnd = Math.min(ny - 1, y + 1);
        for (let x = 0; x < nx; x++) {
          const xStart = Math.max(0, x - 1);
          const xEnd = Math.min(nx - 1, x + 1);
          let sumX = 0;
          let sumY = 0;
          let sumZ = 0;
          let count = 0;
          for (let zz = zStart; zz <= zEnd; zz += 1) {
            for (let yy = yStart; yy <= yEnd; yy += 1) {
              let base = zz * nx * ny + yy * nx + xStart;
              for (let xx = xStart; xx <= xEnd; xx += 1) {
                sumX += fieldX[base];
                sumY += fieldY[base];
                sumZ += fieldZ[base];
                count += 1;
                base += 1;
              }
            }
          }
          const inv = count > 0 ? 1 / count : 1;
          tmpX[idx] = sumX * inv;
          tmpY[idx] = sumY * inv;
          tmpZ[idx] = sumZ * inv;
          idx += 1;
        }
      }
    }
    fieldX.set(tmpX);
    fieldY.set(tmpY);
    fieldZ.set(tmpZ);
  }
};

const computeBetaDivergenceStats = (
  betaX: Float32Array,
  betaY: Float32Array,
  betaZ: Float32Array,
  nx: number,
  ny: number,
  nz: number,
  dx: number,
  dy: number,
  dz: number,
) => {
  let divBetaMaxAbs = 0;
  let divBetaRmsSum = 0;
  let idx = 0;
  for (let z = 0; z < nz; z++) {
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const divBeta =
          gradientX(betaX, x, y, z, nx, ny, dx) +
          gradientY(betaY, x, y, z, nx, ny, dy) +
          gradientZ(betaZ, x, y, z, nx, ny, nz, dz);
        const absVal = Math.abs(divBeta);
        if (absVal > divBetaMaxAbs) divBetaMaxAbs = absVal;
        divBetaRmsSum += divBeta * divBeta;
        idx += 1;
      }
    }
  }
  return {
    divBetaMaxAbs,
    divBetaRms: Math.sqrt(divBetaRmsSum / Math.max(nx * ny * nz, 1)),
  };
};

type BetaDivergenceStats = ReturnType<typeof computeBetaDivergenceStats>;

const clampNatarioShift = (
  betaX: Float32Array,
  betaY: Float32Array,
  betaZ: Float32Array,
  nx: number,
  ny: number,
  nz: number,
  dx: number,
  dy: number,
  dz: number,
  preStats?: BetaDivergenceStats,
  limit: number = NATARIO_K_TOL,
) => {
  const stats =
    preStats ?? computeBetaDivergenceStats(betaX, betaY, betaZ, nx, ny, nz, dx, dy, dz);
  if (stats.divBetaMaxAbs > limit && stats.divBetaMaxAbs > 0) {
    const scale = limit / stats.divBetaMaxAbs;
    for (let i = 0; i < betaX.length; i += 1) {
      betaX[i] *= scale;
      betaY[i] *= scale;
      betaZ[i] *= scale;
    }
    return {
      divBetaMaxAbs: limit,
      divBetaRms: stats.divBetaRms * scale,
      scaled: true,
      scale,
    };
  }
  return { ...stats, scaled: false, scale: 1 };
};

type ObserverConditionKey = "nec" | "wec" | "sec" | "dec";

type ConditionAccumulator = {
  eulerianSum: number;
  robustSum: number;
  eulerianMin: number;
  robustMin: number;
  eulerianViolationCount: number;
  robustViolationCount: number;
  missedViolationCount: number;
  severityGainSum: number;
  severityGainMin: number;
  maxRobustMinusEulerian: number;
  worstIndex: number;
  worstValue: number;
  worstDirection: Vec3;
  worstRapidity: number | null;
  worstSource: ObserverMarginSource;
};

const createConditionAccumulator = (): ConditionAccumulator => ({
  eulerianSum: 0,
  robustSum: 0,
  eulerianMin: Number.POSITIVE_INFINITY,
  robustMin: Number.POSITIVE_INFINITY,
  eulerianViolationCount: 0,
  robustViolationCount: 0,
  missedViolationCount: 0,
  severityGainSum: 0,
  severityGainMin: Number.POSITIVE_INFINITY,
  maxRobustMinusEulerian: Number.NEGATIVE_INFINITY,
  worstIndex: -1,
  worstValue: Number.POSITIVE_INFINITY,
  worstDirection: [1, 0, 0],
  worstRapidity: null,
  worstSource: "capped_search",
});

const safeDirection = (value: Vec3 | null | undefined, fallback: Vec3 = [1, 0, 0]): Vec3 => {
  if (!value) return normalize(fallback);
  const n = normalize(value);
  if (Number.isFinite(n[0]) && Number.isFinite(n[1]) && Number.isFinite(n[2])) {
    const mag = Math.hypot(n[0], n[1], n[2]);
    if (mag > 0) return n;
  }
  return normalize(fallback);
};

const cross = (a: Vec3, b: Vec3): Vec3 => ([
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]);

const orthogonalDirection = (direction: Vec3): Vec3 => {
  const base = Math.abs(direction[0]) < 0.9 ? ([1, 0, 0] as Vec3) : ([0, 1, 0] as Vec3);
  const c = cross(direction, base);
  return safeDirection(c, [0, 0, 1]);
};

const clampBeta = (value: number, cap: number): number => {
  const finiteCap = Number.isFinite(cap) ? Math.max(0, Math.min(0.999999999, cap)) : 0;
  const finiteValue = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(finiteCap, finiteValue));
};

const rapidityFromBeta = (beta: number): number => {
  const b = Math.max(-0.999999999, Math.min(0.999999999, beta));
  return 0.5 * Math.log((1 + b) / (1 - b));
};

const updateConditionAccumulator = (
  acc: ConditionAccumulator,
  eulerian: number,
  robust: number,
  index: number,
  direction: Vec3,
  rapidity: number | null,
  source: ObserverMarginSource,
) => {
  if (!Number.isFinite(eulerian) || !Number.isFinite(robust)) return;
  acc.eulerianSum += eulerian;
  acc.robustSum += robust;
  if (eulerian < acc.eulerianMin) acc.eulerianMin = eulerian;
  if (robust < acc.robustMin) acc.robustMin = robust;
  if (eulerian < 0) acc.eulerianViolationCount += 1;
  if (robust < 0) acc.robustViolationCount += 1;
  if (robust < 0 && eulerian >= 0) acc.missedViolationCount += 1;
  const severityGain = robust - eulerian;
  acc.severityGainSum += severityGain;
  if (severityGain < acc.severityGainMin) acc.severityGainMin = severityGain;
  if (severityGain > acc.maxRobustMinusEulerian) {
    acc.maxRobustMinusEulerian = severityGain;
  }
  if (robust < acc.worstValue) {
    acc.worstValue = robust;
    acc.worstIndex = index;
    acc.worstDirection = direction;
    acc.worstRapidity = rapidity;
    acc.worstSource = source;
  }
};

const finalizeConditionAccumulator = (
  acc: ConditionAccumulator,
  total: number,
): ObserverConditionSummary => {
  const denom = Math.max(1, total);
  const eulerianMin = Number.isFinite(acc.eulerianMin) ? acc.eulerianMin : 0;
  const robustMin = Number.isFinite(acc.robustMin) ? acc.robustMin : 0;
  const severityGainMin = Number.isFinite(acc.severityGainMin) ? acc.severityGainMin : 0;
  const maxRobustMinusEulerian = Number.isFinite(acc.maxRobustMinusEulerian)
    ? acc.maxRobustMinusEulerian
    : 0;
  const worstValue = Number.isFinite(acc.worstValue) ? acc.worstValue : robustMin;
  const worstDirection = safeDirection(acc.worstDirection, [1, 0, 0]);
  return {
    eulerianMin,
    eulerianMean: acc.eulerianSum / denom,
    robustMin,
    robustMean: acc.robustSum / denom,
    eulerianViolationFraction: acc.eulerianViolationCount / denom,
    robustViolationFraction: acc.robustViolationCount / denom,
    missedViolationFraction: acc.missedViolationCount / denom,
    severityGainMin,
    severityGainMean: acc.severityGainSum / denom,
    maxRobustMinusEulerian,
    worstCase: {
      index: acc.worstIndex,
      value: worstValue,
      direction: worstDirection,
      rapidity: acc.worstRapidity,
      source: acc.worstSource,
    },
  };
};

const evaluateWecMargin = (rho: number, pressure: number, fluxMag: number, beta: number): number => {
  const b = Math.max(0, Math.min(0.999999999, beta));
  const oneMinus = Math.max(1e-12, 1 - b * b);
  return (rho - 2 * fluxMag * b + pressure * b * b) / oneMinus;
};

const optimizeWecMargin = (
  rho: number,
  pressure: number,
  fluxMag: number,
  betaCap: number,
): { margin: number; beta: number } => {
  const cap = clampBeta(betaCap, betaCap);
  let bestBeta = 0;
  let bestMargin = evaluateWecMargin(rho, pressure, fluxMag, 0);
  const consider = (candidate: number) => {
    if (!Number.isFinite(candidate)) return;
    const b = clampBeta(candidate, cap);
    const margin = evaluateWecMargin(rho, pressure, fluxMag, b);
    if (margin < bestMargin) {
      bestMargin = margin;
      bestBeta = b;
    }
  };

  consider(cap);
  if (fluxMag > EPS) {
    const discriminant = (rho + pressure) * (rho + pressure) - 4 * fluxMag * fluxMag;
    if (discriminant >= 0) {
      const root = Math.sqrt(discriminant);
      const denom = 2 * fluxMag;
      consider((rho + pressure - root) / denom);
      consider((rho + pressure + root) / denom);
    }
  }

  return { margin: bestMargin, beta: bestBeta };
};

const evaluateDecMargin = (
  rho: number,
  pressure: number,
  sx: number,
  sy: number,
  sz: number,
  direction: Vec3,
  beta: number,
): number => {
  const dir = safeDirection(direction, [1, 0, 0]);
  const b = Math.max(0, Math.min(0.999999999, beta));
  const oneMinus = Math.max(1e-12, 1 - b * b);
  const gamma = 1 / Math.sqrt(oneMinus);
  const gamma2 = 1 / oneMinus;
  const dotSn = sx * dir[0] + sy * dir[1] + sz * dir[2];

  const energy = gamma2 * (rho + 2 * b * dotSn + pressure * b * b);
  const j0 = gamma * (rho + b * dotSn);
  const jx = -gamma * (sx + pressure * b * dir[0]);
  const jy = -gamma * (sy + pressure * b * dir[1]);
  const jz = -gamma * (sz + pressure * b * dir[2]);

  const u0 = gamma;
  const ux = gamma * b * dir[0];
  const uy = gamma * b * dir[1];
  const uz = gamma * b * dir[2];

  const q0 = j0 - energy * u0;
  const qx = jx - energy * ux;
  const qy = jy - energy * uy;
  const qz = jz - energy * uz;
  let qNormSq = -q0 * q0 + qx * qx + qy * qy + qz * qz;
  if (qNormSq < 0 && qNormSq > -1e-9) qNormSq = 0;
  if (qNormSq < 0) qNormSq = 0;
  const margin = energy - Math.sqrt(qNormSq);
  return Number.isFinite(margin) ? margin : Number.NEGATIVE_INFINITY;
};

const optimizeDecMargin = (args: {
  rho: number;
  pressure: number;
  sx: number;
  sy: number;
  sz: number;
  fluxDir: Vec3;
  canonicalDir: Vec3;
  betaCap: number;
  betaHint: number;
}): { margin: number; beta: number; direction: Vec3 } => {
  const cap = clampBeta(args.betaCap, args.betaCap);
  const fluxDir = safeDirection(args.fluxDir, args.canonicalDir);
  const canonicalDir = safeDirection(args.canonicalDir, [1, 0, 0]);
  const antiFluxDir: Vec3 = [-fluxDir[0], -fluxDir[1], -fluxDir[2]];
  const parallelFluxDir: Vec3 = [fluxDir[0], fluxDir[1], fluxDir[2]];
  const orthoDir = orthogonalDirection(fluxDir);
  const directionCandidatesRaw: Vec3[] = [antiFluxDir, canonicalDir, parallelFluxDir, orthoDir];
  const directionCandidates: Vec3[] = [];
  for (const candidate of directionCandidatesRaw) {
    const dir = safeDirection(candidate, canonicalDir);
    const alreadyPresent = directionCandidates.some((existing) =>
      Math.abs(existing[0] - dir[0]) < 1e-6 &&
      Math.abs(existing[1] - dir[1]) < 1e-6 &&
      Math.abs(existing[2] - dir[2]) < 1e-6,
    );
    if (!alreadyPresent) directionCandidates.push(dir);
  }

  const betaCandidatesRaw = [0, cap * 0.5, cap, args.betaHint];
  const betaCandidates: number[] = [];
  for (const candidate of betaCandidatesRaw) {
    const b = clampBeta(candidate, cap);
    if (!betaCandidates.some((existing) => Math.abs(existing - b) < 1e-9)) {
      betaCandidates.push(b);
    }
  }

  let bestMargin = Number.POSITIVE_INFINITY;
  let bestBeta = 0;
  let bestDirection = antiFluxDir;
  for (const direction of directionCandidates) {
    for (const beta of betaCandidates) {
      const margin = evaluateDecMargin(
        args.rho,
        args.pressure,
        args.sx,
        args.sy,
        args.sz,
        direction,
        beta,
      );
      if (margin < bestMargin) {
        bestMargin = margin;
        bestBeta = beta;
        bestDirection = direction;
      }
    }
  }

  if (!Number.isFinite(bestMargin)) {
    const fallback = evaluateDecMargin(
      args.rho,
      args.pressure,
      args.sx,
      args.sy,
      args.sz,
      antiFluxDir,
      0,
    );
    return {
      margin: Number.isFinite(fallback) ? fallback : args.rho - Math.hypot(args.sx, args.sy, args.sz),
      beta: 0,
      direction: antiFluxDir,
    };
  }

  return { margin: bestMargin, beta: bestBeta, direction: bestDirection };
};

const resolveTypeISlacks = (
  rho: number,
  pressure: number,
  fluxMag: number,
  tolerance: number,
): {
  isTypeI: boolean;
  nec?: number;
  wec?: number;
  sec?: number;
  dec?: number;
} => {
  const discriminant = (rho + pressure) * (rho + pressure) - 4 * fluxMag * fluxMag;
  if (discriminant < -Math.max(0, tolerance)) {
    return { isTypeI: false };
  }
  const sqrtDisc = Math.sqrt(Math.max(0, discriminant));
  const sign = rho + pressure >= 0 ? 1 : -1;
  const lambdaTime = 0.5 * (pressure - rho - sign * sqrtDisc);
  const lambdaLongitudinal = 0.5 * (pressure - rho + sign * sqrtDisc);
  const epsilon = -lambdaTime;
  const pParallel = lambdaLongitudinal;
  const pPerp = pressure;
  const nec = Math.min(epsilon + pParallel, epsilon + pPerp);
  const wec = Math.min(epsilon, nec);
  const sec = Math.min(epsilon + pParallel, epsilon + pPerp, epsilon + pParallel + 2 * pPerp);
  const dec = Math.min(epsilon, epsilon - Math.abs(pParallel), epsilon - Math.abs(pPerp));
  if (!Number.isFinite(nec) || !Number.isFinite(wec) || !Number.isFinite(sec) || !Number.isFinite(dec)) {
    return { isTypeI: false };
  }
  return { isTypeI: true, nec, wec, sec, dec };
};

const computeObserverRobustDiagnostics = (args: {
  t00: Float32Array;
  sx: Float32Array;
  sy: Float32Array;
  sz: Float32Array;
  pressureFactor: number;
  rapidityCap: number;
  typeITolerance: number;
  canonicalNullDir: Vec3;
}): ObserverRobustDiagnostics => {
  const total = Math.min(args.t00.length, args.sx.length, args.sy.length, args.sz.length);
  const pressureFactor = Number.isFinite(args.pressureFactor) ? args.pressureFactor : -1;
  const rapidityCap = Number.isFinite(args.rapidityCap)
    ? Math.max(0, args.rapidityCap)
    : DEFAULT_OBSERVER_RAPIDITY_CAP;
  const betaCap = Math.tanh(rapidityCap);
  const typeITolerance = Number.isFinite(args.typeITolerance)
    ? Math.max(0, args.typeITolerance)
    : DEFAULT_HAWKING_ELLIS_TYPE_I_TOL;
  const canonicalNullDir = safeDirection(args.canonicalNullDir, [1, 0, 0]);

  const acc: Record<ObserverConditionKey, ConditionAccumulator> = {
    nec: createConditionAccumulator(),
    wec: createConditionAccumulator(),
    sec: createConditionAccumulator(),
    dec: createConditionAccumulator(),
  };
  let typeICount = 0;

  for (let i = 0; i < total; i += 1) {
    const rho = Number.isFinite(args.t00[i]) ? args.t00[i] : 0;
    const sx = Number.isFinite(args.sx[i]) ? args.sx[i] : 0;
    const sy = Number.isFinite(args.sy[i]) ? args.sy[i] : 0;
    const sz = Number.isFinite(args.sz[i]) ? args.sz[i] : 0;
    const fluxMag = Math.hypot(sx, sy, sz);
    const fluxDir = fluxMag > EPS
      ? ([sx / fluxMag, sy / fluxMag, sz / fluxMag] as Vec3)
      : canonicalNullDir;
    const antiFluxDir: Vec3 = [-fluxDir[0], -fluxDir[1], -fluxDir[2]];
    const pressure = rho * pressureFactor;
    const trace = -rho + 3 * pressure;
    const canonicalFluxProjection =
      sx * canonicalNullDir[0] + sy * canonicalNullDir[1] + sz * canonicalNullDir[2];

    const necEulerian = rho + pressure + 2 * canonicalFluxProjection;
    const wecEulerian = rho;
    const secEulerian = wecEulerian + 0.5 * trace;
    const decEulerian = rho - fluxMag;

    const typeI = resolveTypeISlacks(rho, pressure, fluxMag, typeITolerance);
    if (typeI.isTypeI && typeI.nec != null && typeI.wec != null && typeI.sec != null && typeI.dec != null) {
      typeICount += 1;
      updateConditionAccumulator(acc.nec, necEulerian, typeI.nec, i, antiFluxDir, null, "algebraic_type_i");
      updateConditionAccumulator(acc.wec, wecEulerian, typeI.wec, i, antiFluxDir, null, "algebraic_type_i");
      updateConditionAccumulator(acc.sec, secEulerian, typeI.sec, i, antiFluxDir, null, "algebraic_type_i");
      updateConditionAccumulator(acc.dec, decEulerian, typeI.dec, i, antiFluxDir, null, "algebraic_type_i");
      continue;
    }

    const necRobust = rho + pressure - 2 * fluxMag;
    const wecOptimized = optimizeWecMargin(rho, pressure, fluxMag, betaCap);
    const wecRobust = wecOptimized.margin;
    const secRobust = wecRobust + 0.5 * trace;
    const decOptimized = optimizeDecMargin({
      rho,
      pressure,
      sx,
      sy,
      sz,
      fluxDir,
      canonicalDir: canonicalNullDir,
      betaCap,
      betaHint: wecOptimized.beta,
    });

    updateConditionAccumulator(acc.nec, necEulerian, necRobust, i, antiFluxDir, null, "capped_search");
    updateConditionAccumulator(
      acc.wec,
      wecEulerian,
      wecRobust,
      i,
      antiFluxDir,
      rapidityFromBeta(wecOptimized.beta),
      "capped_search",
    );
    updateConditionAccumulator(
      acc.sec,
      secEulerian,
      secRobust,
      i,
      antiFluxDir,
      rapidityFromBeta(wecOptimized.beta),
      "capped_search",
    );
    updateConditionAccumulator(
      acc.dec,
      decEulerian,
      decOptimized.margin,
      i,
      decOptimized.direction,
      rapidityFromBeta(decOptimized.beta),
      "capped_search",
    );
  }

  const nec = finalizeConditionAccumulator(acc.nec, total);
  const wec = finalizeConditionAccumulator(acc.wec, total);
  const sec = finalizeConditionAccumulator(acc.sec, total);
  const dec = finalizeConditionAccumulator(acc.dec, total);
  const maxRobustMinusEulerian = Math.max(
    nec.maxRobustMinusEulerian,
    wec.maxRobustMinusEulerian,
    sec.maxRobustMinusEulerian,
    dec.maxRobustMinusEulerian,
  );

  return {
    pressureModel: "isotropic_pressure",
    pressureFactor,
    rapidityCap,
    rapidityCapBeta: betaCap,
    typeI: {
      count: typeICount,
      fraction: typeICount / Math.max(1, total),
      tolerance: typeITolerance,
    },
    nec,
    wec,
    sec,
    dec,
    consistency: {
      robustNotGreaterThanEulerian: maxRobustMinusEulerian <= 1e-8,
      maxRobustMinusEulerian,
    },
  };
};

export function buildStressEnergyBrick(input: Partial<StressEnergyBrickParams>): StressEnergyBrick {
  const defaults = defaultHullBounds();
  const dims: [number, number, number] = input.dims ?? [128, 128, 128];
  const axes: Vec3 = input.hullAxes ?? defaults.axes;
  const bounds = input.bounds ?? { min: [-axes[0], -axes[1], -axes[2]], max: [axes[0], axes[1], axes[2]] };

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
  const observerRapidityCap = Number.isFinite(input.observerRapidityCap)
    ? Math.max(0, input.observerRapidityCap as number)
    : DEFAULT_OBSERVER_RAPIDITY_CAP;
  const observerTypeITolerance = Number.isFinite(input.observerTypeITolerance)
    ? Math.max(0, input.observerTypeITolerance as number)
    : DEFAULT_HAWKING_ELLIS_TYPE_I_TOL;
  const driveDirInput = input.driveDir && Array.isArray(input.driveDir) ? (input.driveDir as Vec3) : null;
  const driveDirUnit = driveDirInput ? normalize(driveDirInput) : null;

  const state = getGlobalPipelineState();
  const gap_m = Math.max(1e-12, (state?.gap_nm ?? 1) * 1e-9);
  const cavityQ = Math.max(1e5, state?.qCavity ?? state?.QL ?? 1e9);
  const dutyEff = dutyFR;
  const qSpoil = Math.max(1e-6, state?.qSpoilingFactor ?? q);
  const metricT00Raw =
    Number.isFinite(input.metricT00) ? Number(input.metricT00) : Number(state?.warp?.metricT00);
  const metricT00Ref =
    typeof input.metricT00Ref === "string"
      ? input.metricT00Ref
      : typeof (state as any)?.warp?.metricT00Ref === "string"
        ? String((state as any).warp.metricT00Ref)
        : undefined;
  const metricSource =
    input.metricT00Source ??
    (state as any)?.warp?.metricT00Source ??
    (state as any)?.warp?.stressEnergySource;
  const metricMode =
    metricSource === "metric" && Number.isFinite(metricT00Raw);
  const metricT00Source = metricMode ? (typeof metricSource === "string" ? metricSource : "metric") : undefined;

  const { rho_avg: rhoAvgPipeline, rho_inst: rhoInstPipeline } = enhancedAvgEnergyDensity({
    gap_m,
    gammaGeo,
    cavityQ,
    gammaVdB,
    gammaVanDenBroeck: gammaVdB,
    qSpoilingFactor: qSpoil,
    deltaAOverA: qSpoil,
    dutyEff,
  });
  const rho_avg = metricMode ? (metricT00Raw as number) : rhoAvgPipeline;
  const rho_inst = metricMode ? (metricT00Raw as number) : rhoInstPipeline;

  const [nx, ny, nz] = dims;
  const dx = (bounds.max[0] - bounds.min[0]) / nx;
  const dy = (bounds.max[1] - bounds.min[1]) / ny;
  const dz = (bounds.max[2] - bounds.min[2]) / nz;
  const cellVolume = dx * dy * dz;
  const mappingSource = metricMode ? "metric" : state ? "pipeline" : "defaults";
  const stressMeta = state?.stressMeta;
  const brickSource: StressEnergyBrick["source"] = (stressMeta?.source as StressEnergyBrick["source"])
    ?? (metricMode ? "metric" : state ? "pipeline" : "unknown");
  const brickCongruence: StressEnergyBrick["congruence"] =
    (stressMeta?.congruence as StressEnergyBrick["congruence"])
    ?? (metricMode ? "conditional" : "proxy-only");
  const brickProxy =
    typeof stressMeta?.proxy === "boolean"
      ? stressMeta.proxy
      : brickCongruence !== "geometry-derived";

  const axesSq: Vec3 = [axes[0] * axes[0], axes[1] * axes[1], axes[2] * axes[2]];
  const wallSigma = Math.max(input.hullWall ?? defaults.wall, 0.1);
  const totalVoxels = nx * ny * nz;
  const envelope = new Float32Array(totalVoxels);
  let envelopeSum = 0;
  const radialMap = input.radialMap ?? null;

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
        const pLen = Math.hypot(px, py, pz);
        const dir = pLen > 1e-9 ? ([px / pLen, py / pLen, pz / pLen] as Vec3) : ([0, 0, 0] as Vec3);
        const radius = resolveHullRadius(dir, axes, radialMap);
        const centerDist = pLen - radius;
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
  const betaMag = new Float32Array(totalVoxels);
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

        const pLen = Math.hypot(px, py, pz);
        const dir = pLen > 1e-9 ? ([px / pLen, py / pLen, pz / pLen] as Vec3) : ([0, 0, 0] as Vec3);
        const radius = resolveHullRadius(dir, axes, radialMap);
        const normal = radialMap ? dir : ellipsoidNormal(pos, axesSq);
        const betaDir = blendDirections(normal, driveDirUnit, 0.32);
        const betaAmp = natarioShiftFromDensity(Math.abs(density), Math.max(radius, 1e-3));
        const sign = density >= 0 ? 1 : -1;
        const vecX = betaDir[0] * betaAmp * sign;
        const vecY = betaDir[1] * betaAmp * sign;
        const vecZ = betaDir[2] * betaAmp * sign;
        const mag = Math.hypot(vecX, vecY, vecZ);
        betaMag[idx] = mag;
        if (mag > 0) {
          betaX[idx] = vecX / mag;
          betaY[idx] = vecY / mag;
          betaZ[idx] = vecZ / mag;
        } else {
          betaX[idx] = 0;
          betaY[idx] = 0;
          betaZ[idx] = 0;
        }
        idx += 1;
      }
    }
  }

  smoothVectorField(betaX, betaY, betaZ, nx, ny, nz, 2);
  for (let i = 0; i < totalVoxels; i += 1) {
    const dirMag = Math.hypot(betaX[i], betaY[i], betaZ[i]);
    const desired = betaMag[i];
    const scale = dirMag > 1e-12 ? desired / dirMag : 0;
    betaX[i] *= scale;
    betaY[i] *= scale;
    betaZ[i] *= scale;
  }

  const natarioPre = computeBetaDivergenceStats(
    betaX,
    betaY,
    betaZ,
    nx,
    ny,
    nz,
    dx,
    dy,
    dz,
  );
  const warpFieldType = state?.warpFieldType ?? "natario";
  const isNatarioField = warpFieldType === "natario" || warpFieldType === "natario_sdf";
  const clampLimit = isNatarioField ? NATARIO_K_TOL : ALCUBIERRE_K_TOL;
  const clampMode = isNatarioField ? "natario" : "stability";
  const natarioClamp = clampNatarioShift(
    betaX,
    betaY,
    betaZ,
    nx,
    ny,
    nz,
    dx,
    dy,
    dz,
    natarioPre,
    clampLimit,
  );
  const clampActivationRate = natarioClamp.scaled ? 1 - natarioClamp.scale : 0;
  if (natarioClamp.scaled) {
    console.warn(
      isNatarioField
        ? "[Natario] Divergence exceeds gate; scaling shift field"
        : "[ShiftClamp] Divergence exceeds stability gate; scaling shift field",
      {
        divMax: natarioClamp.divBetaMaxAbs,
        gate: clampLimit,
        clampMode,
        clampActivationRate,
        dutyFR,
        phase01,
        warpFieldType,
      },
    );
  }
  const natarioDiagnostics: NatarioDiagnostics = {
    divBetaMax: natarioClamp.divBetaMaxAbs,
    divBetaRms: natarioClamp.divBetaRms,
    divBetaMaxPre: natarioPre.divBetaMaxAbs,
    divBetaRmsPre: natarioPre.divBetaRms,
    divBetaMaxPost: natarioClamp.divBetaMaxAbs,
    divBetaRmsPost: natarioClamp.divBetaRms,
    clampScale: natarioClamp.scale,
    clampApplied: natarioClamp.scaled,
    clampActivationRate,
    clampMode,
    gateLimit: clampLimit,
    gNatario: Math.max(0, 1 - natarioClamp.divBetaMaxAbs / clampLimit),
  };

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
  let netFluxSum: Vec3 = [0, 0, 0];

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
        netFluxSum = [
          netFluxSum[0] + sX * cellVolume,
          netFluxSum[1] + sY * cellVolume,
          netFluxSum[2] + sZ * cellVolume,
        ];
        idx += 1;
      }
    }
  }

  const divS = new Float32Array(totalVoxels);
  let divMin = Number.POSITIVE_INFINITY;
  let divMax = Number.NEGATIVE_INFINITY;
  let divSum = 0;
  let divAbsSum = 0;
  let divRmsSum = 0;
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
        divSum += div;
        divAbsSum += Math.abs(div);
        divRmsSum += div * div;
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
  const voxelNorm = Math.max(totalVoxels, 1);
  const netFlux: Vec3 = [
    netFluxSum[0] / voxelNorm,
    netFluxSum[1] / voxelNorm,
    netFluxSum[2] / voxelNorm,
  ];
  const avgFluxMagnitude = fluxMagSum / voxelNorm;
  const divMaxAbs = Math.max(Math.abs(divMin), Math.abs(divMax));
  const divMean = divSum / voxelNorm;
  const divAbsMean = divAbsSum / voxelNorm;
  const divRms = Math.sqrt(divRmsSum / voxelNorm);
  const netFluxMagnitude = Math.hypot(netFlux[0], netFlux[1], netFlux[2]);
  const normBase = Math.max(avgFluxMagnitude, EPS);
  const netFluxNorm = netFluxMagnitude / normBase;
  const divRmsNorm = divRms / normBase;
  const totalEnergy_J = sumT00 * cellVolume;
  const invariantTotals = computeInvariantMassFromFluxTotals(
    totalEnergy_J,
    netFluxSum,
  );
  const pressureFactor = -1;
  const observerRobust = computeObserverRobustDiagnostics({
    t00,
    sx: Sx,
    sy: Sy,
    sz: Sz,
    pressureFactor,
    rapidityCap: observerRapidityCap,
    typeITolerance: observerTypeITolerance,
    canonicalNullDir: driveDirUnit ?? [1, 0, 0],
  });

  const stats: StressEnergyStats = {
    totalEnergy_J,
    avgT00: sumT00 / Math.max(totalVoxels, 1),
    avgFluxMagnitude,
    netFlux,
    totalMomentum_kg_m_s: invariantTotals.totalMomentum_kg_m_s,
    momentumMagnitude_kg_m_s: invariantTotals.momentumMagnitude_kg_m_s,
    invariantMass_kg: invariantTotals.invariantMass_kg,
    invariantMassEnergy_J: invariantTotals.invariantMassEnergy_J,
    divMin,
    divMax,
    dutyFR,
    strobePhase,
    natario: natarioDiagnostics,
    conservation: {
      divMean: Number.isFinite(divMean) ? divMean : 0,
      divAbsMean: Number.isFinite(divAbsMean) ? divAbsMean : 0,
      divRms: Number.isFinite(divRms) ? divRms : 0,
      divMaxAbs: Number.isFinite(divMaxAbs) ? divMaxAbs : 0,
      netFluxMagnitude: Number.isFinite(netFluxMagnitude) ? netFluxMagnitude : 0,
      netFluxNorm: Number.isFinite(netFluxNorm) ? netFluxNorm : 0,
      divRmsNorm: Number.isFinite(divRmsNorm) ? divRmsNorm : 0,
    },
    mapping: {
      rho_avg,
      rho_inst,
      gap_nm: gap_m * 1e9,
      cavityQ,
      qSpoil,
      gammaGeo,
      gammaVdB,
      dutyFR,
      ampBase,
      zeta,
      pressureFactor,
      pressureSource: "proxy",
      source: mappingSource,
      proxy: !metricMode,
    },
    observerRobust,
  };

  return {
    dims,
    voxelBytes: 4,
    format: "r32f",
    source: brickSource,
    proxy: brickProxy,
    congruence: brickCongruence,
    metricT00Ref,
    metricT00Source,
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
  source?: "pipeline" | "metric" | "unknown";
  proxy?: boolean;
  congruence?: "proxy-only" | "geometry-derived" | "conditional";
  metricT00Ref?: string;
  metricT00Source?: string;
  channels: {
    t00: StressEnergyBrickResponseChannel;
    Sx: StressEnergyBrickResponseChannel;
    Sy: StressEnergyBrickResponseChannel;
    Sz: StressEnergyBrickResponseChannel;
    divS: StressEnergyBrickResponseChannel;
  };
  stats: StressEnergyStats;
}

export interface StressEnergyBrickBinaryHeader {
  kind: "stress-energy-brick";
  version: 1;
  dims: [number, number, number];
  voxelBytes: number;
  format: "r32f";
  source?: "pipeline" | "metric" | "unknown";
  proxy?: boolean;
  congruence?: "proxy-only" | "geometry-derived" | "conditional";
  metricT00Ref?: string;
  metricT00Source?: string;
  channelOrder: typeof STRESS_ENERGY_CHANNEL_ORDER;
  channels: {
    t00: { min: number; max: number; bytes: number };
    Sx: { min: number; max: number; bytes: number };
    Sy: { min: number; max: number; bytes: number };
    Sz: { min: number; max: number; bytes: number };
    divS: { min: number; max: number; bytes: number };
  };
  stats: StressEnergyStats;
}

export type StressEnergyBrickBinaryPayload = {
  header: StressEnergyBrickBinaryHeader;
  buffers: Buffer[];
};

export const serializeStressEnergyBrick = (brick: StressEnergyBrick): StressEnergyBrickResponse => ({
  dims: brick.dims,
  voxelBytes: brick.voxelBytes,
  format: brick.format,
  source: brick.source ?? "pipeline",
  proxy: brick.proxy ?? true,
  congruence: brick.congruence ?? "proxy-only",
  metricT00Ref: brick.metricT00Ref,
  metricT00Source: brick.metricT00Source,
  channels: {
    t00: { data: encodeFloat32(brick.channels.t00.data), min: brick.channels.t00.min, max: brick.channels.t00.max },
    Sx: { data: encodeFloat32(brick.channels.Sx.data), min: brick.channels.Sx.min, max: brick.channels.Sx.max },
    Sy: { data: encodeFloat32(brick.channels.Sy.data), min: brick.channels.Sy.min, max: brick.channels.Sy.max },
    Sz: { data: encodeFloat32(brick.channels.Sz.data), min: brick.channels.Sz.min, max: brick.channels.Sz.max },
    divS: { data: encodeFloat32(brick.channels.divS.data), min: brick.channels.divS.min, max: brick.channels.divS.max },
  },
  stats: brick.stats,
});

export const serializeStressEnergyBrickBinary = (brick: StressEnergyBrick): StressEnergyBrickBinaryPayload => {
  const t00 = brick.channels.t00;
  const Sx = brick.channels.Sx;
  const Sy = brick.channels.Sy;
  const Sz = brick.channels.Sz;
  const divS = brick.channels.divS;
  return {
    header: {
      kind: "stress-energy-brick",
      version: 1,
      dims: brick.dims,
      voxelBytes: brick.voxelBytes,
      format: brick.format,
      source: brick.source ?? "pipeline",
      proxy: brick.proxy ?? true,
      congruence: brick.congruence ?? "proxy-only",
      metricT00Ref: brick.metricT00Ref,
      metricT00Source: brick.metricT00Source,
      channelOrder: STRESS_ENERGY_CHANNEL_ORDER,
      channels: {
        t00: { min: t00.min, max: t00.max, bytes: t00.data.byteLength },
        Sx: { min: Sx.min, max: Sx.max, bytes: Sx.data.byteLength },
        Sy: { min: Sy.min, max: Sy.max, bytes: Sy.data.byteLength },
        Sz: { min: Sz.min, max: Sz.max, bytes: Sz.data.byteLength },
        divS: { min: divS.min, max: divS.max, bytes: divS.data.byteLength },
      },
      stats: brick.stats,
    },
    buffers: [
      Buffer.from(t00.data.buffer, t00.data.byteOffset, t00.data.byteLength),
      Buffer.from(Sx.data.buffer, Sx.data.byteOffset, Sx.data.byteLength),
      Buffer.from(Sy.data.buffer, Sy.data.byteOffset, Sy.data.byteLength),
      Buffer.from(Sz.data.buffer, Sz.data.byteOffset, Sz.data.byteLength),
      Buffer.from(divS.data.buffer, divS.data.byteOffset, divS.data.byteLength),
    ],
  };
};
