import { createCipheriv, createHash, randomUUID } from "node:crypto";
import {
  DEFAULT_HCE_CONFIG,
  type HceConfigPayload,
  type HceResolvedConfig,
  type HcePeak,
  type HceAudioPacket,
  type HceStreamEvent,
} from "@shared/hce-types";

const BLOCK_SIZE = 16;
const TWO_PI = Math.PI * 2;
const SUBSTEP_DIVISOR = 2;

type Vec = Float64Array;

interface AesCtrPrng {
  nextFloat(): number;
  nextGaussian(): number;
}

interface PeakState extends HcePeak {
  vector: Vec;
  phase: number;
  magnitude: number;
}

export interface HceRun {
  id: string;
  config: HceResolvedConfig;
  psi: Vec;
  colored: Vec;
  time: number;
  centers: Vec[];
  peaks: PeakState[];
  prng: AesCtrPrng;
  subDt: number;
  frame: number;
  lastFrame?: HceStreamEvent;
}

const runs = new Map<string, HceRun>();

function createAesCtrPrng(seed: string): AesCtrPrng {
  const key = createHash("sha256").update(seed).digest();
  const iv = Buffer.alloc(BLOCK_SIZE);
  const cipher = createCipheriv("aes-256-ctr", key, iv);
  let buffer = Buffer.alloc(0);
  let spare: number | null = null;

  const refill = () => {
    const chunk = cipher.update(Buffer.alloc(BLOCK_SIZE));
    buffer = buffer.length === 0 ? chunk : Buffer.concat([buffer, chunk]);
  };

  const nextUInt32 = () => {
    if (buffer.length < 4) {
      refill();
    }
    const value = buffer.readUInt32BE(0);
    buffer = buffer.subarray(4);
    return value >>> 0;
  };

  const nextFloat = () => nextUInt32() / 0x1_0000_0000;

  const nextGaussian = () => {
    if (spare !== null) {
      const val = spare;
      spare = null;
      return val;
    }
    let u = 0;
    let v = 0;
    let r = 0;
    do {
      u = nextFloat() * 2 - 1;
      v = nextFloat() * 2 - 1;
      r = u * u + v * v;
    } while (r === 0 || r >= 1);
    const factor = Math.sqrt((-2 * Math.log(r)) / r);
    spare = v * factor;
    return u * factor;
  };

  return { nextFloat, nextGaussian };
}

function deterministicFrameUniform(seed: string, frameIndex: number): number {
  const hash = createHash("sha256")
    .update(`${seed}:branch:${frameIndex}`)
    .digest();
  const value = hash.readUInt32BE(0);
  return (value + 0.5) / 0x1_0000_0000;
}

export function hashSeedToUint32(seed: string): number {
  const hash = createHash("sha256").update(seed).digest();
  return hash.readUInt32BE(0);
}

function resolveConfig(input: HceConfigPayload): HceResolvedConfig {
  const seed = input.seed?.trim() || randomUUID();
  const config: HceResolvedConfig = {
    seed,
    rc: input.rc ?? DEFAULT_HCE_CONFIG.rc,
    tau: input.tau ?? DEFAULT_HCE_CONFIG.tau,
    beta: input.beta ?? DEFAULT_HCE_CONFIG.beta,
    lambda: input.lambda ?? DEFAULT_HCE_CONFIG.lambda,
    K: input.K ?? DEFAULT_HCE_CONFIG.K,
    latentDim: input.latentDim ?? DEFAULT_HCE_CONFIG.latentDim,
    dt: input.dt ?? DEFAULT_HCE_CONFIG.dt,
  };
  return config;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

function randomUnitVector(dim: number, prng: AesCtrPrng): Vec {
  const vec = new Float64Array(dim);
  let normSq = 0;
  for (let i = 0; i < dim; i += 1) {
    const v = prng.nextGaussian();
    vec[i] = v;
    normSq += v * v;
  }
  const scale = normSq > 0 ? 1 / Math.sqrt(normSq) : 1;
  for (let i = 0; i < dim; i += 1) {
    vec[i] *= scale;
  }
  return vec;
}

function createPeakStates(
  peaks: HcePeak[],
  dim: number,
  prng: AesCtrPrng,
): PeakState[] {
  return peaks.map((peak) => ({
    ...peak,
    vector: randomUnitVector(dim, prng),
    phase: prng.nextFloat() * TWO_PI,
    magnitude: prng.nextGaussian() * 0.2,
  }));
}

function smoothVector(vec: Vec, smear: number): void {
  if (smear <= 0) return;
  const w = clamp(smear, 0, 0.45);
  if (w <= 0) return;
  const dim = vec.length;
  const scratch = new Float64Array(dim);
  for (let i = 0; i < dim; i += 1) {
    const prev = vec[(i - 1 + dim) % dim];
    const next = vec[(i + 1) % dim];
    scratch[i] = (1 - 2 * w) * vec[i] + w * (prev + next);
  }
  vec.set(scratch);
}

function advanceSubStep(run: HceRun, dt: number): void {
  if (dt <= 0) return;
  const decay = Math.exp(-dt / Math.max(0.001, run.config.tau));
  const noiseDecay = Math.exp(-dt / Math.max(0.001, run.config.tau * 0.5));
  const sqrtVariance = Math.sqrt(Math.max(0, 1 - decay * decay));
  const coloredScale = Math.sqrt(Math.max(0, 1 - noiseDecay * noiseDecay));

  const dim = run.psi.length;
  for (let i = 0; i < dim; i += 1) {
    run.colored[i] =
      noiseDecay * run.colored[i] + coloredScale * run.prng.nextGaussian();
  }

  for (const peak of run.peaks) {
    peak.phase = (peak.phase + peak.omega * dt) % TWO_PI;
    const envelope = Math.exp(-peak.gamma * dt);
    const scatter = Math.sqrt(Math.max(0, 1 - envelope * envelope));
    peak.magnitude = envelope * peak.magnitude + scatter * run.prng.nextGaussian();
    const osc = Math.sin(peak.phase) * peak.alpha * peak.magnitude;
    for (let i = 0; i < dim; i += 1) {
      run.colored[i] += osc * peak.vector[i];
    }
  }

  for (let i = 0; i < dim; i += 1) {
    run.psi[i] = decay * run.psi[i] + sqrtVariance * run.colored[i];
  }

  const baseRc = clamp(run.config.rc, 0, 0.45);
  if (baseRc > 0) {
    const ratio = Math.max(dt / run.config.dt, 0);
    const rcScale = 1 - Math.pow(1 - baseRc, ratio || 1);
    smoothVector(run.psi, rcScale);
  }

  run.time += dt;
}

const dot = (a: Vec, b: Vec) => {
  let acc = 0;
  for (let i = 0; i < a.length; i += 1) {
    acc += a[i] * b[i];
  }
  return acc;
};

const norm = (a: Vec) => Math.sqrt(dot(a, a));

export function computeEnergies(psi: Vec, centers: Vec[], lambda: number): number[] {
  const energies: number[] = [];
  const psiNorm = norm(psi);
  for (let i = 0; i < centers.length; i += 1) {
    const center = centers[i];
    let distSq = 0;
    for (let j = 0; j < psi.length; j += 1) {
      const diff = psi[j] - center[j];
      distSq += diff * diff;
    }
    const centerNorm = norm(center);
    const denom = psiNorm * centerNorm || 1;
    const cosTheta = clamp(dot(psi, center) / denom, -1, 1);
    const angular = 1 - cosTheta;
    energies.push(lambda * distSq + (1 - lambda) * angular);
  }
  return energies;
}

export function sampleBranch(
  energies: number[],
  temp: number,
  prng: AesCtrPrng,
  randomOverride?: number,
): number {
  if (energies.length === 0) return 0;
  const safeTemp = temp <= 0 ? 0.001 : temp;
  const minEnergy = Math.min(...energies);
  const weights = energies.map((e) => Math.exp(-(e - minEnergy) / safeTemp));
  const total = weights.reduce((acc, w) => acc + w, 0);
  if (total === 0) return energies.findIndex((e) => e === minEnergy);
  const uniform = clamp(
    Number.isFinite(randomOverride) ? (randomOverride as number) : prng.nextFloat(),
    Number.MIN_VALUE,
    1 - Number.EPSILON,
  );
  const threshold = uniform * total;
  let accum = 0;
  for (let i = 0; i < weights.length; i += 1) {
    accum += weights[i];
    if (threshold <= accum) {
      return i;
    }
  }
  return weights.length - 1;
}

export function initRun(payload: HceConfigPayload): HceRun {
  const config = resolveConfig(payload);
  const prng = createAesCtrPrng(config.seed);
  const dim = config.latentDim;
  const psi = new Float64Array(dim);
  const colored = new Float64Array(dim);
  for (let i = 0; i < dim; i += 1) {
    psi[i] = prng.nextGaussian() * 0.05;
    colored[i] = 0;
  }
  const centers = Array.from({ length: config.K }, () =>
    randomUnitVector(dim, prng),
  );
  const peaks = createPeakStates(payload.peaks ?? [], dim, prng);
  const run: HceRun = {
    id: randomUUID(),
    config,
    psi,
    colored,
    time: 0,
    centers,
    peaks,
    prng,
    subDt: Math.max(config.dt / SUBSTEP_DIVISOR, 0.0005),
    frame: 0,
    lastFrame: undefined,
  };
  runs.set(run.id, run);
  return run;
}

export function getRun(runId: string): HceRun | undefined {
  return runs.get(runId);
}

export function removeRun(runId: string): void {
  runs.delete(runId);
}

export interface StepResult {
  psi: number[];
  energies: number[];
  suggestedBranch: number;
  time: number;
}

export function evolveRun(
  run: HceRun,
  dtOverride?: number,
  tempForSuggestion = 0.15,
): StepResult {
  const targetDt = dtOverride ?? run.config.dt;
  let remaining = targetDt;
  const epsilon = 1e-9;
  if (!Number.isFinite(remaining) || remaining <= 0) {
    const energies = computeEnergies(run.psi, run.centers, run.config.lambda);
    const frameIndex = Math.floor((run.time + epsilon) / run.config.dt);
    const uniform = deterministicFrameUniform(run.config.seed, frameIndex);
    const suggestedBranch = sampleBranch(energies, tempForSuggestion, run.prng, uniform);
    run.frame = frameIndex;
    const step: StepResult = {
      psi: Array.from(run.psi),
      energies,
      suggestedBranch,
      time: run.time,
    };
    run.lastFrame = {
      t: step.time,
      psi: step.psi,
      energies: step.energies,
      suggestedBranch: step.suggestedBranch,
    };
    return step;
  }

  const subDt = Math.max(Math.min(run.subDt, targetDt), epsilon);
  while (remaining > epsilon) {
    const step = Math.min(subDt, remaining);
    advanceSubStep(run, step);
    remaining -= step;
  }

  const energies = computeEnergies(run.psi, run.centers, run.config.lambda);
  const frameIndex = Math.floor((run.time + epsilon) / run.config.dt);
  const uniform = deterministicFrameUniform(run.config.seed, frameIndex);
  const suggestedBranch = sampleBranch(energies, tempForSuggestion, run.prng, uniform);
  run.frame = frameIndex;

  const step: StepResult = {
    psi: Array.from(run.psi),
    energies,
    suggestedBranch,
    time: run.time,
  };
  run.lastFrame = {
    t: step.time,
    psi: step.psi,
    energies: step.energies,
    suggestedBranch: step.suggestedBranch,
  };
  return step;
}

export function summarizeState(run: HceRun) {
  return {
    runId: run.id,
    time: run.time,
    psi: Array.from(run.psi),
    centers: run.centers.map((center) => Array.from(center)),
  };
}

export function buildAudioPacket(run: HceRun, branch: number): HceAudioPacket {
  const toHz = (omega: number) => clamp(omega * 180 + 80, 20, 16_000);
  const toQ = (gamma: number) => clamp(1 / (gamma + 0.01), 0.5, 40);
  const toGain = (alpha: number) => clamp(Math.abs(alpha), 0.05, 6);

  const peaks = run.peaks.length
    ? run.peaks.map((peak) => ({
        f: Number(toHz(peak.omega).toFixed(3)),
        q: Number(toQ(peak.gamma).toFixed(3)),
        gain: Number(toGain(peak.alpha).toFixed(3)),
      }))
    : [
        {
          f: 220,
          q: 3,
          gain: 1,
        },
      ];

  return {
    type: "set",
    seed: hashSeedToUint32(run.config.seed),
    branch,
    peaks,
    xfadeMs: 20,
  };
}

export function getFrameIndex(runId: string): number {
  return runs.get(runId)?.frame ?? 0;
}

export function frameUniform(frameIndex: number, seed: string): number {
  return deterministicFrameUniform(seed, frameIndex);
}

export function getLastFrame(runId: string): HceStreamEvent | null {
  return runs.get(runId)?.lastFrame ?? null;
}
