// client/src/workers/fractional-scan.ts
// Lightweight DSP worker that evaluates fractional harmonic coherence using Goertzel kernels.

export type FractionalSidebands = {
  plus: number;
  minus: number;
  symmetry: number;
};

export type FractionalLine = {
  ratio: number;
  fHz: number;
  A: number;
  P: number;
  phase: number;
  snr: number;
  sidebands?: FractionalSidebands;
};

export type FractionalScanConfig = {
  fs: number;
  f0: number;
  windowMs: number;
  hopMs: number;
  ratios: number[];
  sidebandDeltaHz: number;
};

type WorkerMessage =
  | { type: "init"; config: FractionalScanConfig }
  | { type: "push"; samples: Float32Array }
  | { type: "flush" };

type WorkerResponse = {
  CP: number;
  IFC: number;
  SS: number;
  lines: FractionalLine[];
};

const ctx: any = self as any;

let config: FractionalScanConfig | null = null;
let ring = new Float32Array(0);
let writeIndex = 0;
let buffered = 0;
let windowSize = 0;
let hopSize = 0;
let samplesSinceFrame = 0;

function ensureRing(capacity: number) {
  if (ring.length >= capacity) return;
  ring = new Float32Array(capacity);
  writeIndex = 0;
  buffered = 0;
}

function hannWindow(samples: Float32Array) {
  const { length } = samples;
  if (length <= 1) return;
  for (let i = 0; i < length; i++) {
    samples[i] *= 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
  }
}

function goertzel(samples: Float32Array, fs: number, f: number) {
  const omega = (2 * Math.PI * f) / fs;
  const coeff = 2 * Math.cos(omega);
  const sin = Math.sin(omega);
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < samples.length; i++) {
    s0 = samples[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  const real = s1 - s2 * Math.cos(omega);
  const imag = s2 * sin;
  const power = real * real + imag * imag;
  const amplitude = Math.sqrt(power) / (samples.length / 2);
  const phase = Math.atan2(imag, real);
  return { A: amplitude, P: power, phase };
}

function noiseFloor(samples: Float32Array) {
  const stride = Math.max(1, Math.floor(samples.length / 64));
  let accum = 0;
  let count = 0;
  for (let i = 0; i < samples.length; i += stride) {
    accum += Math.abs(samples[i]);
    count++;
  }
  return count > 0 ? (0.8 * accum) / count + 1e-12 : 1e-12;
}

function snapshotWindow(): Float32Array | null {
  if (!config || buffered < windowSize || samplesSinceFrame < hopSize) {
    return null;
  }
  const out = new Float32Array(windowSize);
  let readIndex = writeIndex - windowSize;
  if (readIndex < 0) readIndex += ring.length;
  for (let i = 0; i < windowSize; i++) {
    out[i] = ring[readIndex++];
    if (readIndex >= ring.length) readIndex = 0;
  }
  samplesSinceFrame = 0;
  hannWindow(out);
  return out;
}

function pushSamples(samples: Float32Array) {
  if (!config) return;
  const requiredCapacity = Math.max(
    ring.length,
    4 * Math.ceil((config.fs * config.windowMs) / 1000)
  );
  ensureRing(requiredCapacity);

  for (let i = 0; i < samples.length; i++) {
    ring[writeIndex++] = samples[i];
    if (writeIndex >= ring.length) writeIndex = 0;
  }
  buffered = Math.min(ring.length, buffered + samples.length);
  samplesSinceFrame += samples.length;
}

function analyse(samples: Float32Array) {
  if (!config) return;
  const { fs, f0, ratios, sidebandDeltaHz } = config;
  const floor = noiseFloor(samples);

  let integerPower = 0;
  for (let h = 1; h <= 4; h++) {
    integerPower += goertzel(samples, fs, h * f0).P;
  }

  const lines: FractionalLine[] = [];
  let fracPowerSum = 0;
  let qualitySum = 0;
  let sbSymmetrySum = 0;
  let sbSymmetryCount = 0;
  let phaseStability = 0;

  for (const ratio of ratios) {
    const f = ratio * f0;
    const core = goertzel(samples, fs, f);
    const snr = core.A / floor;

    const sidebands = {
      plus: goertzel(samples, fs, f + sidebandDeltaHz).P,
      minus: goertzel(samples, fs, f - sidebandDeltaHz).P,
    };
    const sbMax = Math.max(sidebands.plus, sidebands.minus) + 1e-15;
    const sbMin = Math.min(sidebands.plus, sidebands.minus) + 1e-15;
    const symmetry = sbMin / sbMax;

    lines.push({
      ratio,
      fHz: f,
      A: core.A,
      P: core.P,
      phase: core.phase,
      snr,
      sidebands: { ...sidebands, symmetry },
    });

    fracPowerSum += core.P;
    sbSymmetrySum += symmetry;
    sbSymmetryCount++;

    const sharpness = symmetry;
    const quality = (core.A / (1 + (1 - sharpness))) * Math.max(0, Math.log1p(Math.max(0, snr)));
    qualitySum += quality;
    phaseStability += Math.abs(core.phase) < 0.2 ? 1 : Math.exp(-Math.abs(core.phase));
  }

  const IFC = (integerPower + 1e-18) / (fracPowerSum + 1e-18);
  const SS = sbSymmetryCount > 0 ? sbSymmetrySum / sbSymmetryCount : 0;
  const CP = qualitySum * Math.exp(0.1 * phaseStability / Math.max(1, ratios.length));

  const payload: WorkerResponse = { CP, IFC, SS, lines };
  ctx.postMessage(payload);
}

ctx.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  if (!message) return;

  if (message.type === "init") {
    config = message.config;
    if (!config || !Number.isFinite(config.fs) || config.fs <= 0) {
      config = null;
      return;
    }
    windowSize = Math.max(
      256,
      1 << Math.ceil(Math.log2((config.fs * config.windowMs) / 1000))
    );
    hopSize = Math.max(128, Math.floor((config.fs * config.hopMs) / 1000));
    ensureRing(4 * windowSize);
    writeIndex = 0;
    buffered = 0;
    samplesSinceFrame = 0;
    return;
  }

  if (!config) return;

  if (message.type === "push") {
    pushSamples(message.samples);
    const window = snapshotWindow();
    if (window) analyse(window);
    return;
  }

  if (message.type === "flush") {
    const window = snapshotWindow();
    if (window) analyse(window);
  }
};
