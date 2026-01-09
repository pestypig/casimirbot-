import type { NeuroFrameWindow } from "../sync/ring-buffer.js";
import {
  DEFAULT_GAMMA_BAND as DEFAULT_GAMMA_BAND_CONFIG,
} from "../../../shared/neuro-config.js";

export type GammaPlvBand = {
  lowHz: number;
  highHz: number;
};

export type GammaPlvOptions = {
  bandHz?: GammaPlvBand;
  anchorHz?: number;
  anchorBandwidthHz?: number;
  minSamples?: number;
};

export type GammaPlvSurrogateOptions = GammaPlvOptions & {
  surrogateCount?: number;
  surrogateSeed?: number;
};

export type GammaPlvResult = {
  plv: number;
  pairCount: number;
  sampleCount: number;
  channelCount: number;
  bandHz: GammaPlvBand;
};

export type GammaPlvCrossResult = {
  plv: number;
  pairCount: number;
  sampleCount: number;
  channelCountA: number;
  channelCountB: number;
  bandHz: GammaPlvBand;
};

export type GammaPlvSurrogateResult = GammaPlvResult & {
  nullMean: number;
  nullStd: number;
  zScore: number;
  surrogateCount: number;
};

export type GammaPlvNullBaseline = {
  mean: number;
  std: number;
  count: number;
};

export const DEFAULT_GAMMA_BAND: GammaPlvBand = {
  lowHz: DEFAULT_GAMMA_BAND_CONFIG.lowHz,
  highHz: DEFAULT_GAMMA_BAND_CONFIG.highHz,
};

const DEFAULT_ANCHOR_BANDWIDTH_HZ = 10;
const DEFAULT_MIN_SAMPLES = 32;
const DEFAULT_SURROGATE_COUNT = 40;
const DEFAULT_BASELINE_ALPHA = 0.2;

const resolveBand = (options?: GammaPlvOptions): GammaPlvBand => {
  const base = options?.bandHz ?? DEFAULT_GAMMA_BAND;
  if (Number.isFinite(options?.anchorHz)) {
    const anchor = options?.anchorHz as number;
    const width = Math.max(
      1,
      options?.anchorBandwidthHz ?? DEFAULT_ANCHOR_BANDWIDTH_HZ,
    );
    const half = width / 2;
    const low = Math.max(0.1, anchor - half);
    const high = Math.max(low + 1, anchor + half);
    return { lowHz: low, highHz: high };
  }
  return base;
};

const nextPow2 = (value: number): number => {
  let n = 1;
  while (n < value) n <<= 1;
  return n;
};

const fft = (re: number[], im: number[]): void => {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wlenCos = Math.cos(ang);
    const wlenSin = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wCos = 1;
      let wSin = 0;
      const half = len >> 1;
      for (let j = 0; j < half; j += 1) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + half] * wCos - im[i + j + half] * wSin;
        const vIm = re[i + j + half] * wSin + im[i + j + half] * wCos;
        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + half] = uRe - vRe;
        im[i + j + half] = uIm - vIm;
        const nextCos = wCos * wlenCos - wSin * wlenSin;
        const nextSin = wCos * wlenSin + wSin * wlenCos;
        wCos = nextCos;
        wSin = nextSin;
      }
    }
  }
};

const ifft = (re: number[], im: number[]): void => {
  const n = re.length;
  for (let i = 0; i < n; i += 1) {
    im[i] = -im[i];
  }
  fft(re, im);
  for (let i = 0; i < n; i += 1) {
    re[i] /= n;
    im[i] = -im[i] / n;
  }
};

const removeMean = (samples: number[]): number[] => {
  if (samples.length === 0) return [];
  let sum = 0;
  for (const v of samples) sum += v;
  const mean = sum / samples.length;
  return samples.map((v) => v - mean);
};

const bandpassAnalyticSignal = (
  samples: number[],
  sampleRateHz: number,
  band: GammaPlvBand,
): { re: number[]; im: number[]; length: number } => {
  const length = samples.length;
  const nfft = nextPow2(length);
  const re = new Array<number>(nfft).fill(0);
  const im = new Array<number>(nfft).fill(0);
  for (let i = 0; i < length; i += 1) {
    re[i] = samples[i];
  }
  fft(re, im);
  const df = sampleRateHz / nfft;
  for (let k = 0; k < nfft; k += 1) {
    const freq = k <= nfft / 2 ? k * df : -(nfft - k) * df;
    const absFreq = Math.abs(freq);
    if (absFreq < band.lowHz || absFreq > band.highHz) {
      re[k] = 0;
      im[k] = 0;
    }
  }
  for (let k = 1; k < nfft / 2; k += 1) {
    re[k] *= 2;
    im[k] *= 2;
  }
  for (let k = Math.floor(nfft / 2) + 1; k < nfft; k += 1) {
    re[k] = 0;
    im[k] = 0;
  }
  ifft(re, im);
  return { re, im, length };
};

const computePhaseSeries = (
  samples: number[],
  sampleRateHz: number,
  band: GammaPlvBand,
): number[] => {
  const cleaned = removeMean(samples);
  const analytic = bandpassAnalyticSignal(cleaned, sampleRateHz, band);
  const phases = new Array<number>(analytic.length);
  for (let i = 0; i < analytic.length; i += 1) {
    phases[i] = Math.atan2(analytic.im[i], analytic.re[i]);
  }
  return phases;
};

const computeBandRms = (
  samplesByChannel: number[][],
  sampleRateHz: number,
  band: GammaPlvBand,
  minSamples = DEFAULT_MIN_SAMPLES,
): number | null => {
  const channelCount = samplesByChannel.length;
  const sampleCount = channelCount
    ? Math.min(...samplesByChannel.map((ch) => ch.length))
    : 0;
  if (
    channelCount < 1 ||
    !Number.isFinite(sampleRateHz) ||
    sampleRateHz <= 0 ||
    sampleCount < minSamples ||
    sampleRateHz < band.highHz * 2
  ) {
    return null;
  }
  let sumSq = 0;
  let count = 0;
  for (const series of samplesByChannel) {
    const trimmed = series.slice(0, sampleCount);
    const cleaned = removeMean(trimmed);
    const analytic = bandpassAnalyticSignal(cleaned, sampleRateHz, band);
    for (let i = 0; i < analytic.length; i += 1) {
      const value = analytic.re[i];
      sumSq += value * value;
      count += 1;
    }
  }
  return count > 0 ? Math.sqrt(sumSq / count) : null;
};

const computePairwisePlv = (phases: number[][]): number => {
  const channelCount = phases.length;
  if (channelCount < 2) return 0;
  const sampleCount = Math.min(...phases.map((row) => row.length));
  if (sampleCount < 2) return 0;
  let sumPlv = 0;
  let pairCount = 0;
  for (let i = 0; i < channelCount; i += 1) {
    for (let j = i + 1; j < channelCount; j += 1) {
      let sumRe = 0;
      let sumIm = 0;
      const phaseI = phases[i];
      const phaseJ = phases[j];
      for (let t = 0; t < sampleCount; t += 1) {
        const delta = phaseI[t] - phaseJ[t];
        sumRe += Math.cos(delta);
        sumIm += Math.sin(delta);
      }
      const plv = Math.hypot(sumRe, sumIm) / sampleCount;
      sumPlv += plv;
      pairCount += 1;
    }
  }
  return pairCount > 0 ? sumPlv / pairCount : 0;
};

const computeCrossPlv = (
  phasesA: number[][],
  phasesB: number[][],
  sampleCount: number,
): number => {
  const channelCountA = phasesA.length;
  const channelCountB = phasesB.length;
  if (channelCountA < 1 || channelCountB < 1 || sampleCount < 2) return 0;
  let sumPlv = 0;
  let pairCount = 0;
  for (let i = 0; i < channelCountA; i += 1) {
    for (let j = 0; j < channelCountB; j += 1) {
      let sumRe = 0;
      let sumIm = 0;
      const phaseA = phasesA[i];
      const phaseB = phasesB[j];
      for (let t = 0; t < sampleCount; t += 1) {
        const delta = phaseA[t] - phaseB[t];
        sumRe += Math.cos(delta);
        sumIm += Math.sin(delta);
      }
      const plv = Math.hypot(sumRe, sumIm) / sampleCount;
      sumPlv += plv;
      pairCount += 1;
    }
  }
  return pairCount > 0 ? sumPlv / pairCount : 0;
};

const computePairwisePlvWithOffsets = (
  phases: number[][],
  offsets: number[],
  sampleCount: number,
): number => {
  const channelCount = phases.length;
  if (channelCount < 2 || sampleCount < 2) return 0;
  let sumPlv = 0;
  let pairCount = 0;
  for (let i = 0; i < channelCount; i += 1) {
    for (let j = i + 1; j < channelCount; j += 1) {
      let sumRe = 0;
      let sumIm = 0;
      const phaseI = phases[i];
      const phaseJ = phases[j];
      const offsetI = offsets[i] % sampleCount;
      const offsetJ = offsets[j] % sampleCount;
      for (let t = 0; t < sampleCount; t += 1) {
        const idxI = (t + offsetI) % sampleCount;
        const idxJ = (t + offsetJ) % sampleCount;
        const delta = phaseI[idxI] - phaseJ[idxJ];
        sumRe += Math.cos(delta);
        sumIm += Math.sin(delta);
      }
      const plv = Math.hypot(sumRe, sumIm) / sampleCount;
      sumPlv += plv;
      pairCount += 1;
    }
  }
  return pairCount > 0 ? sumPlv / pairCount : 0;
};

const mulberry32 = (seed: number): (() => number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const resolveRng = (seed?: number): (() => number) => {
  if (Number.isFinite(seed)) {
    return mulberry32(seed as number);
  }
  return Math.random;
};

export const deriveGammaPlvZ = (
  plv: number,
  nullMean: number,
  nullStd: number,
): number => {
  if (!Number.isFinite(nullStd) || nullStd <= 0) return 0;
  return (plv - nullMean) / nullStd;
};

const computeSurrogateStats = (
  phases: number[][],
  surrogateCount: number,
  rng: () => number,
): { mean: number; std: number } => {
  const channelCount = phases.length;
  if (channelCount < 2 || surrogateCount <= 0) {
    return { mean: 0, std: 0 };
  }
  const sampleCount = Math.min(...phases.map((row) => row.length));
  if (sampleCount < 2) return { mean: 0, std: 0 };
  const values = new Array<number>(surrogateCount);
  const offsets = new Array<number>(channelCount);
  for (let s = 0; s < surrogateCount; s += 1) {
    for (let ch = 0; ch < channelCount; ch += 1) {
      offsets[ch] = Math.floor(rng() * sampleCount);
    }
    values[s] = computePairwisePlvWithOffsets(phases, offsets, sampleCount);
  }
  const mean = values.reduce((acc, v) => acc + v, 0) / surrogateCount;
  let variance = 0;
  for (const v of values) {
    variance += (v - mean) * (v - mean);
  }
  variance /= surrogateCount;
  return { mean, std: Math.sqrt(variance) };
};

const flattenWindow = (
  window: NeuroFrameWindow,
): { samples: number[][]; sampleRateHz: number } | null => {
  const frames = window.frames;
  if (!frames.length) return null;
  const sampleRateHz = frames[0].sampleRateHz;
  const channelCount = frames[0].samples.length;
  if (!channelCount) return null;
  const samples = Array.from({ length: channelCount }, () => [] as number[]);
  for (const frame of frames) {
    if (frame.sampleRateHz !== sampleRateHz) {
      return null;
    }
    if (frame.samples.length !== channelCount) {
      return null;
    }
    for (let ch = 0; ch < channelCount; ch += 1) {
      samples[ch].push(...frame.samples[ch]);
    }
  }
  return { samples, sampleRateHz };
};

export const computeGammaPlvWithSurrogates = (
  samplesByChannel: number[][],
  sampleRateHz: number,
  options?: GammaPlvSurrogateOptions,
): GammaPlvSurrogateResult => {
  const band = resolveBand(options);
  const minSamples = options?.minSamples ?? DEFAULT_MIN_SAMPLES;
  const channelCount = samplesByChannel.length;
  const sampleCount = channelCount
    ? Math.min(...samplesByChannel.map((ch) => ch.length))
    : 0;
  const base: GammaPlvResult = {
    plv: 0,
    pairCount: channelCount > 1 ? (channelCount * (channelCount - 1)) / 2 : 0,
    sampleCount,
    channelCount,
    bandHz: band,
  };
  if (
    channelCount < 2 ||
    !Number.isFinite(sampleRateHz) ||
    sampleRateHz <= 0 ||
    sampleCount < minSamples ||
    sampleRateHz < band.highHz * 2
  ) {
    return {
      ...base,
      nullMean: 0,
      nullStd: 0,
      zScore: 0,
      surrogateCount: 0,
    };
  }
  const phases = samplesByChannel.map((series) =>
    computePhaseSeries(series.slice(0, sampleCount), sampleRateHz, band),
  );
  const plv = computePairwisePlv(phases);
  const surrogateCount = options?.surrogateCount ?? DEFAULT_SURROGATE_COUNT;
  if (!Number.isFinite(surrogateCount) || surrogateCount <= 0) {
    return {
      ...base,
      plv,
      nullMean: 0,
      nullStd: 0,
      zScore: 0,
      surrogateCount: 0,
    };
  }
  const rng = resolveRng(options?.surrogateSeed);
  const nullStats = computeSurrogateStats(phases, surrogateCount, rng);
  const zScore = deriveGammaPlvZ(plv, nullStats.mean, nullStats.std);
  return {
    ...base,
    plv,
    nullMean: nullStats.mean,
    nullStd: nullStats.std,
    zScore,
    surrogateCount,
  };
};

export const computeGammaPlv = (
  samplesByChannel: number[][],
  sampleRateHz: number,
  options?: GammaPlvOptions,
): GammaPlvResult => {
  const result = computeGammaPlvWithSurrogates(samplesByChannel, sampleRateHz, {
    ...options,
    surrogateCount: 0,
  });
  return {
    plv: result.plv,
    pairCount: result.pairCount,
    sampleCount: result.sampleCount,
    channelCount: result.channelCount,
    bandHz: result.bandHz,
  };
};

export const computeGammaPlvCross = (
  samplesA: number[][],
  samplesB: number[][],
  sampleRateHz: number,
  options?: GammaPlvOptions,
): GammaPlvCrossResult => {
  const band = resolveBand(options);
  const minSamples = options?.minSamples ?? DEFAULT_MIN_SAMPLES;
  const channelCountA = samplesA.length;
  const channelCountB = samplesB.length;
  const sampleCount = Math.min(
    channelCountA ? Math.min(...samplesA.map((ch) => ch.length)) : 0,
    channelCountB ? Math.min(...samplesB.map((ch) => ch.length)) : 0,
  );
  const base: GammaPlvCrossResult = {
    plv: 0,
    pairCount: channelCountA * channelCountB,
    sampleCount,
    channelCountA,
    channelCountB,
    bandHz: band,
  };
  if (
    channelCountA < 1 ||
    channelCountB < 1 ||
    !Number.isFinite(sampleRateHz) ||
    sampleRateHz <= 0 ||
    sampleCount < minSamples ||
    sampleRateHz < band.highHz * 2
  ) {
    return base;
  }
  const phasesA = samplesA.map((series) =>
    computePhaseSeries(series.slice(0, sampleCount), sampleRateHz, band),
  );
  const phasesB = samplesB.map((series) =>
    computePhaseSeries(series.slice(0, sampleCount), sampleRateHz, band),
  );
  const plv = computeCrossPlv(phasesA, phasesB, sampleCount);
  return {
    ...base,
    plv,
  };
};

export const computeGammaPlvFromWindow = (
  window: NeuroFrameWindow | null,
  options?: GammaPlvOptions,
): GammaPlvResult | null => {
  if (!window) return null;
  const flattened = flattenWindow(window);
  if (!flattened) return null;
  return computeGammaPlv(flattened.samples, flattened.sampleRateHz, options);
};

export const computeGammaPlvCrossFromWindows = (
  windowA: NeuroFrameWindow | null,
  windowB: NeuroFrameWindow | null,
  options?: GammaPlvOptions,
): GammaPlvCrossResult | null => {
  if (!windowA || !windowB) return null;
  const flattenedA = flattenWindow(windowA);
  const flattenedB = flattenWindow(windowB);
  if (!flattenedA || !flattenedB) return null;
  if (flattenedA.sampleRateHz !== flattenedB.sampleRateHz) return null;
  return computeGammaPlvCross(
    flattenedA.samples,
    flattenedB.samples,
    flattenedA.sampleRateHz,
    options,
  );
};

export const computeBandRmsFromWindow = (
  window: NeuroFrameWindow | null,
  band: GammaPlvBand,
  options?: { minSamples?: number },
): number | null => {
  if (!window) return null;
  const flattened = flattenWindow(window);
  if (!flattened) return null;
  return computeBandRms(
    flattened.samples,
    flattened.sampleRateHz,
    band,
    options?.minSamples,
  );
};

export const computeGammaPlvFromWindowWithSurrogates = (
  window: NeuroFrameWindow | null,
  options?: GammaPlvSurrogateOptions,
): GammaPlvSurrogateResult | null => {
  if (!window) return null;
  const flattened = flattenWindow(window);
  if (!flattened) return null;
  return computeGammaPlvWithSurrogates(
    flattened.samples,
    flattened.sampleRateHz,
    options,
  );
};

export const updateGammaPlvNullBaseline = (
  baseline: GammaPlvNullBaseline | null,
  stats: Pick<GammaPlvSurrogateResult, "nullMean" | "nullStd" | "surrogateCount">,
  options?: { alpha?: number },
): GammaPlvNullBaseline | null => {
  if (!Number.isFinite(stats.nullMean) || !Number.isFinite(stats.nullStd)) {
    return baseline;
  }
  if (stats.surrogateCount <= 0) return baseline;
  const alpha = Math.max(0, Math.min(1, options?.alpha ?? DEFAULT_BASELINE_ALPHA));
  if (!baseline) {
    return {
      mean: stats.nullMean,
      std: stats.nullStd,
      count: 1,
    };
  }
  return {
    mean: baseline.mean * (1 - alpha) + stats.nullMean * alpha,
    std: baseline.std * (1 - alpha) + stats.nullStd * alpha,
    count: baseline.count + 1,
  };
};
