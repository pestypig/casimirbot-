import type { EnergyPipelineState } from "../../energy-pipeline";
import type {
  QiDiagnosticsPayload,
  QiDiagnosticsRequest,
  TileDatum,
  QiDiagnosticsGrid,
} from "@shared/qi-diagnostics";

type V3 = [number, number, number];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const MAX_TILES = 4096;
const DEFAULT_RADIUS_M = 0.5;

const toWeights = (input?: number[]): [number, number, number] => {
  const w = Array.isArray(input) ? input.filter((x) => Number.isFinite(x)) : [];
  if (w.length >= 3) {
    const [w1, w2, w3] = w.slice(0, 3) as [number, number, number];
    const sum = w1 + w2 + w3;
    if (sum > 0) return [w1 / sum, w2 / sum, w3 / sum];
  }
  return [0.4, 0.3, 0.3];
};

const safeRadius = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const downsampleTiles = (tiles: TileDatum[]): TileDatum[] => {
  if (tiles.length <= MAX_TILES) return tiles;
  const step = Math.max(1, Math.floor(tiles.length / MAX_TILES));
  const sampled: TileDatum[] = [];
  for (let i = 0; i < tiles.length; i += step) sampled.push(tiles[i]);
  return sampled;
};

const fallbackTiles = (state: EnergyPipelineState, count = 512): TileDatum[] => {
  const tiles: TileDatum[] = [];
  const hull = (state.hull ?? {}) as Partial<{ Lx_m: number; Ly_m: number; Lz_m: number }>;
  const a = Number(hull.Lx_m ?? (state.shipRadius_m ? state.shipRadius_m * 2 : 1007)) / 2;
  const b = Number(hull.Ly_m ?? (state.shipRadius_m ? state.shipRadius_m * 2 : 264)) / 2;
  const c = Number(hull.Lz_m ?? (state.shipRadius_m ? state.shipRadius_m * 2 : 173)) / 2;
  const t00Base = Number((state as any)?.stressEnergy?.T00 ?? -2.5e13);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = a * Math.sin(phi) * Math.cos(theta);
    const y = b * Math.sin(phi) * Math.sin(theta);
    const z = c * Math.cos(phi);
    const r = Math.hypot(x / a, y / b, z / c);
    const t00 = t00Base * (1 + 0.1 * Math.sin(5 * theta) * Math.cos(3 * phi)) * (1 - 0.5 * r);
    tiles.push({ pos: [x, y, z], t00 });
  }
  return tiles;
};

const sanitizeTiles = (state: EnergyPipelineState): { tiles: TileDatum[]; meanT00: number } => {
  const raw = (state as any).tileData as TileDatum[] | undefined;
  const tiles = Array.isArray(raw) ? raw.filter((t) => Array.isArray(t?.pos) && t.pos.length >= 3) : [];
  const hydrated = tiles.length ? tiles : fallbackTiles(state);
  const sampled = downsampleTiles(hydrated);
  const mean = sampled.reduce((acc, t) => acc + (Number(t.t00) || 0), 0) / Math.max(1, sampled.length);
  return { tiles: sampled, meanT00: mean };
};

const gridFromTiles = (tiles: TileDatum[]): QiDiagnosticsGrid => {
  let min: V3 = [Infinity, Infinity, Infinity];
  let max: V3 = [-Infinity, -Infinity, -Infinity];
  for (const t of tiles) {
    const [x, y, z] = t.pos;
    if (x < min[0]) min[0] = x;
    if (y < min[1]) min[1] = y;
    if (z < min[2]) min[2] = z;
    if (x > max[0]) max[0] = x;
    if (y > max[1]) max[1] = y;
    if (z > max[2]) max[2] = z;
  }
  const span: V3 = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const spacingScalar = Math.max(1e-6, Math.cbrt((span[0] * span[1] * span[2]) / Math.max(1, tiles.length)));
  const spacing: V3 = [spacingScalar, spacingScalar, spacingScalar];
  const nx = Math.max(1, Math.round(span[0] / spacingScalar));
  const ny = Math.max(1, Math.round(span[1] / spacingScalar));
  const nz = Math.max(1, Math.round(span[2] / spacingScalar));
  return { nx, ny, nz, spacing, origin: min[0] < Infinity ? min : undefined };
};

const computePhaseTension = (tiles: TileDatum[]): Float32Array => {
  const hasPhase = tiles.some((t) => Number.isFinite(t.phase01) || Number.isFinite(t.pumpPhase_deg));
  const field = tiles.map((t) =>
    hasPhase ? (Number(t.phase01) || Number(t.pumpPhase_deg) / 360 || 0) : Number(t.t00) || 0,
  );
  const tension = new Float32Array(tiles.length);
  for (let i = 0; i < tiles.length; i++) {
    const p0 = tiles[i].pos;
    let gx = 0;
    let gy = 0;
    let gz = 0;
    let count = 0;
    for (let j = 0; j < tiles.length; j++) {
      if (i === j) continue;
      const p = tiles[j].pos;
      const dx = p[0] - p0[0];
      const dy = p[1] - p0[1];
      const dz = p[2] - p0[2];
      const r2 = dx * dx + dy * dy + dz * dz;
      if (r2 <= 0) continue;
      const w = 1 / Math.max(1e-6, r2);
      const df = field[j] - field[i];
      gx += w * df * dx;
      gy += w * df * dy;
      gz += w * df * dz;
      count++;
    }
    tension[i] = Math.hypot(gx, gy, gz) / Math.max(1, count);
  }
  return tension;
};

const computeCasimirVariance = (tiles: TileDatum[], radius_m: number): Float32Array => {
  const out = new Float32Array(tiles.length);
  const t00 = tiles.map((t) => Number(t.t00) || 0);
  const mean = t00.reduce((a, b) => a + b, 0) / Math.max(1, t00.length);
  const norm = 1 / Math.max(1e-9, mean * mean);
  for (let i = 0; i < tiles.length; i++) {
    const p0 = tiles[i].pos;
    let m = 0;
    let m2 = 0;
    let n = 0;
    for (let k = 0; k < tiles.length; k++) {
      const p = tiles[k].pos;
      const dx = p[0] - p0[0];
      const dy = p[1] - p0[1];
      const dz = p[2] - p0[2];
      if (dx * dx + dy * dy + dz * dz > radius_m * radius_m) continue;
      const x = t00[k];
      m += x;
      m2 += x * x;
      n++;
    }
    const mu = m / Math.max(1, n);
    out[i] = Math.max(0, m2 / Math.max(1, n) - mu * mu) * norm;
  }
  return out;
};

const computeFRProximity = (tiles: TileDatum[], zeta: number): Float32Array => {
  const out = new Float32Array(tiles.length);
  const t00 = tiles.map((t) => Number(t.t00) || 0);
  const mean = t00.reduce((a, b) => a + b, 0) / Math.max(1, t00.length);
  for (let i = 0; i < tiles.length; i++) {
    out[i] = clamp01(((t00[i] || 0) / Math.max(1e-12, mean)) * zeta);
  }
  return out;
};

const composeCSI = (
  tension: Float32Array,
  variance: Float32Array,
  proximity: Float32Array,
  weights: [number, number, number],
): Float32Array => {
  const squash = (arr: Float32Array) => {
    const mu = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const sd =
      arr.length > 1
        ? Math.sqrt(arr.reduce((a, b) => a + (b - mu) * (b - mu), 0) / (arr.length - 1))
        : 1;
    const denom = sd > 0 ? sd : 1;
    return Float32Array.from(arr, (x) => 1 / (1 + Math.exp(-((x - mu) / denom))));
  };
  const Zt = squash(tension);
  const Zv = squash(variance);
  const out = new Float32Array(tension.length);
  for (let i = 0; i < out.length; i++) {
    out[i] = weights[0] * Zt[i] + weights[1] * Zv[i] + weights[2] * clamp01(proximity[i]);
  }
  return out;
};

export function computeQiDiagnostics(
  state: EnergyPipelineState,
  req: QiDiagnosticsRequest = {},
): QiDiagnosticsPayload {
  const radius_m = safeRadius(req.radius_m, DEFAULT_RADIUS_M);
  const weights = toWeights(req.weights ?? []);
  const { tiles, meanT00 } = sanitizeTiles(state);
  const grid = gridFromTiles(tiles);
  const zeta = Number((state as any)?.zeta ?? 0);
  const duty = Number(
    (state as any)?.dutyEffectiveFR ??
      (state as any)?.dutyEffective_FR ??
      (state as any)?.dutyShip ??
      state.dutyCycle ??
      0,
  );

  const tphi = computePhaseTension(tiles);
  const var_rho = computeCasimirVariance(tiles, radius_m);
  const pi_fr = computeFRProximity(tiles, Number.isFinite(zeta) ? zeta : 0);
  const csi = composeCSI(tphi, var_rho, pi_fr, weights);

  const tau_ms =
    Number((state as any)?.lightCrossing?.tauLC_ms) ??
    Number((state as any)?.tau_LC_ms) ??
    Number((state as any)?.tauLC_ms) ??
    null;

  return {
    grid,
    tiles,
    tphi: Array.from(tphi),
    var_rho: Array.from(var_rho),
    pi_fr: Array.from(pi_fr),
    csi: Array.from(csi),
    meta: {
      ts: Date.now(),
      tau_ms,
      fr_bound: 1,
      zeta: Number.isFinite(zeta) ? zeta : null,
      weights,
      radius_m,
      dutyEffectiveFR: Number.isFinite(duty) ? duty : null,
      tileCount: tiles.length,
      meanT00: Number.isFinite(meanT00) ? meanT00 : null,
    },
  };
}
