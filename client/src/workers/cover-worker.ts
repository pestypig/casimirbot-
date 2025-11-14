/* eslint-disable no-restricted-globals */
import { computeImmersion } from "@/lib/noise/immersion";
import type { ImmersionScores } from "@/lib/noise/immersion";
import type { BarWindow, HelixPacket, TempoMeta } from "@/types/noise-gens";
import type { TextureFingerprint } from "@/lib/noise/texture-map";
import { textureFrom, createDeterministicRng } from "@/lib/noise/texture-map";
import {
  makeGrid,
  barBoundaries,
  blockSplitsByBoundaries,
  BeatLockedLFO,
  type TimeSig,
} from "@/lib/noise/beat-scheduler";

type CoverRenderRequest = {
  t: "render";
  jobId: string;
  original: { instrumentalUrl: string; vocalUrl?: string };
  tempo: TempoMeta;
  barWindows: BarWindow[];
  helix?: HelixPacket;
  kbTexture?: string | null;
  sampleInfluence: number;
  styleInfluence: number;
  weirdness: number;
  sampleRate?: number;
};

type AbortRequest = { t: "abort"; jobId?: string };

type WorkerInbound = CoverRenderRequest | AbortRequest;

type WorkerProgress = { t: "progress"; pct: number; stage: string };
type WorkerReady = { t: "ready"; wavBlob: Blob; duration: number; immersion: ImmersionScores };
type WorkerError = { t: "error"; error: string };

type WorkerOutbound = WorkerProgress | WorkerReady | WorkerError;

type ManifestRecord = Record<string, TextureFingerprint>;

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

let manifestPromise: Promise<ManifestRecord> | null = null;
const impulseCache = new Map<string, Promise<AudioBuffer>>();
let abortToken: string | null = null;
const CHORUS_BASE_DELAY = 0.015;

ctx.onmessage = (event: MessageEvent<WorkerInbound>) => {
  const message = event.data;
  if (!message) return;
  if (message.t === "abort") {
    abortToken = message.jobId ?? abortToken;
    return;
  }
  if (message.t === "render") {
    abortToken = null;
    handleRender(message).catch((error) => {
      postError(error instanceof Error ? error.message : "cover render failed");
    });
  }
};

async function handleRender(request: CoverRenderRequest) {
  const { jobId } = request;
  try {
    ensureOfflineContextAvailable();
    postProgress(0.05, "Loading texture manifest");
    const manifest = await loadManifest();
    checkAborted(jobId);

    const tempo = sanitizeTempo(request.tempo);
    const barWindows = sanitizeBarWindows(request.barWindows, tempo);
    if (!barWindows.length) {
      throw new Error("No valid bar windows provided");
    }

    postProgress(0.1, "Fetching stems");
    const instrumental = await fetchAudioBuffer(request.original.instrumentalUrl);
    checkAborted(jobId);

    const vocal = request.original.vocalUrl ? await fetchAudioBuffer(request.original.vocalUrl) : null;
    checkAborted(jobId);

    const sampleRate =
      request.sampleRate && Number.isFinite(request.sampleRate)
        ? Math.max(22_050, Math.min(request.sampleRate, 96_000))
        : instrumental.sampleRate;

    const helixPeaks = extractHelixPeaks(request.helix);
    const kbTexture = request.kbTexture ? manifest[request.kbTexture] : undefined;
    const seed = computeSeed(request.helix, request.sampleInfluence, request.styleInfluence, request.weirdness);

    postProgress(0.18, "Blending texture");
    const texture = textureFrom(helixPeaks, kbTexture, {
      sampleInfluence: request.sampleInfluence,
      styleInfluence: request.styleInfluence,
      weirdness: request.weirdness,
      seed,
    });

    const impulse = await loadImpulse(texture.irName, sampleRate);
    checkAborted(jobId);

    postProgress(0.26, "Rendering bars");
    const segments = [];
    let totalLength = 0;

    for (let index = 0; index < barWindows.length; index += 1) {
      const window = barWindows[index];
      const pct = 0.26 + (0.6 * index) / Math.max(1, barWindows.length);
      postProgress(pct, `Rendering bars ${window.startBar}-${window.endBar - 1}`);

      const segment = await renderWindow({
        window,
        instrumental,
        vocal,
        tempo,
        sampleRate,
        texture,
        impulse,
        jobId,
      });
      segments.push(segment);
      totalLength += segment.length;
      checkAborted(jobId);
    }

    postProgress(0.88, "Assembling mixdown");
    const mixed = mergeSegments(segments, sampleRate);
    const duration = mixed.length / sampleRate;

    const mono = bufferToMono(mixed);
    const immersion = computeImmersion(mono, sampleRate, tempo, undefined, helixPeaks);

    postProgress(0.94, "Exporting WAV");
    const wavBlob = bufferToWavBlob(mixed, sampleRate);

    postProgress(1, "Ready");
    ctx.postMessage({ t: "ready", wavBlob, duration, immersion } satisfies WorkerReady);
  } catch (error) {
    postError(error instanceof Error ? error.message : "cover render failed");
  }
}

function ensureOfflineContextAvailable() {
  if (typeof OfflineAudioContext === "undefined") {
    throw new Error("Offline audio context unavailable in this browser");
  }
}

type MaybeClosableOfflineAudioContext = OfflineAudioContext & { close?: () => Promise<void> };

async function closeOfflineContext(context: OfflineAudioContext) {
  const maybeClose = (context as MaybeClosableOfflineAudioContext).close;
  if (typeof maybeClose === "function") {
    await maybeClose.call(context);
  }
}

function checkAborted(jobId: string) {
  if (!abortToken) return;
  if (abortToken === jobId || abortToken === "*") {
    throw new Error("render aborted");
  }
}

function postProgress(pct: number, stage: string) {
  ctx.postMessage({ t: "progress", pct: clamp01(pct), stage } satisfies WorkerProgress);
}

function postError(error: string) {
  ctx.postMessage({ t: "error", error } satisfies WorkerError);
}

async function loadManifest(): Promise<ManifestRecord> {
  if (!manifestPromise) {
    manifestPromise = fetch("/kb-textures/manifest.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load texture manifest (${res.status})`);
        }
        return res.json() as Promise<ManifestRecord>;
      })
      .catch((error) => {
        manifestPromise = null;
        throw error;
      });
  }
  return manifestPromise;
}

async function loadImpulse(irName: string, sampleRate: number): Promise<AudioBuffer> {
  const cacheKey = `${irName}:${sampleRate}`;
  let cached = impulseCache.get(cacheKey);
  if (!cached) {
    cached = fetch(`/kb-textures/irs/${encodeURIComponent(irName)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load impulse response ${irName}`);
        const arrayBuffer = await res.arrayBuffer();
        const context = new OfflineAudioContext(2, 1, sampleRate);
        const buffer = await context.decodeAudioData(arrayBuffer);
        await closeOfflineContext(context);
        return buffer;
      })
      .catch((error) => {
        impulseCache.delete(cacheKey);
        throw error;
      });
    impulseCache.set(cacheKey, cached);
  }
  return cached;
}

async function fetchAudioBuffer(url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio source (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  const context = new OfflineAudioContext(2, 1, 44100);
  const audioBuffer = await context.decodeAudioData(buffer);
  await closeOfflineContext(context);
  return audioBuffer;
}

type RenderWindowParams = {
  window: BarWindow;
  instrumental: AudioBuffer;
  vocal: AudioBuffer | null;
  tempo: TempoMeta;
  sampleRate: number;
  texture: ReturnType<typeof textureFrom>;
  impulse: AudioBuffer;
  jobId: string;
};

async function renderWindow({
  window,
  instrumental,
  vocal,
  tempo,
  sampleRate,
  texture,
  impulse,
  jobId,
}: RenderWindowParams): Promise<AudioBuffer> {
  const { startTimeSec, durationSec } = windowToSeconds(window, tempo);
  const frameCount = Math.max(1, Math.ceil(durationSec * sampleRate));
  const renderDurationSec = frameCount / sampleRate;
  const grid = makeGrid(sampleRate, tempo.bpm, tempo.timeSig as TimeSig, tempo.offsetMs);
  const windowStartSample = Math.round(startTimeSec * sampleRate);
  const windowEndSample = windowStartSample + frameCount;
  const barMarkers = barBoundaries(grid, windowStartSample, windowEndSample)
    .map((idx) => idx - windowStartSample)
    .filter((idx) => idx > 0 && idx < frameCount)
    .sort((a, b) => a - b);
  const chorusConfig = {
    rate: clamp(texture.chorus.rate, 0.05, 4),
    depth: clamp(texture.chorus.depth, 0.0005, 0.01),
  };
  const chorusCurve =
    frameCount > 1
      ? buildBeatLockedDelayCurve(frameCount, sampleRate, tempo.bpm, chorusConfig.rate, chorusConfig.depth, barMarkers)
      : null;

  const context = new OfflineAudioContext({
    numberOfChannels: 2,
    length: frameCount,
    sampleRate,
  });

  // Pre-headroom
  const preGain = context.createGain();
  preGain.gain.value = dbToGain(-3);

  const eqOutput = applyEq(context, preGain, texture.eqPeaks);
  const chorus = applyChorus(
    context,
    eqOutput,
    chorusConfig,
    chorusCurve ? { curve: chorusCurve, duration: renderDurationSec } : undefined,
  );
  const saturator = applySaturation(context, chorus.output, texture.sat.drive);
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -12;
  compressor.ratio.value = 2.6;
  compressor.attack.value = 0.006;
  compressor.release.value = 0.24;
  saturator.connect(compressor);

  const reverbGain = context.createGain();
  reverbGain.gain.value = 0.22 + clamp01(texture.sat.drive) * 0.18;
  const convolver = context.createConvolver();
  convolver.buffer = impulse;
  eqOutput.connect(convolver);
  convolver.connect(reverbGain);

  const dryGain = context.createGain();
  dryGain.gain.value = 0.84;
  compressor.connect(dryGain);

  const masterGain = context.createGain();
  masterGain.gain.value = dbToGain(2.6);

  dryGain.connect(masterGain);
  reverbGain.connect(masterGain);

  applyWindowFades(masterGain.gain, durationSec);

  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -0.8;
  limiter.knee.value = 1.5;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.08;
  masterGain.connect(limiter);
  limiter.connect(context.destination);

  const rng = createDeterministicRng(Math.floor(startTimeSec * 10_000));
  const instSource = context.createBufferSource();
  instSource.buffer = instrumental;
  instSource.start(0, startTimeSec, durationSec);
  instSource.connect(preGain);

  if (vocal) {
    const vocalSource = context.createBufferSource();
    vocalSource.buffer = vocal;
    vocalSource.start(0, startTimeSec, durationSec);
    const vocalGain = context.createGain();
    vocalGain.gain.value = 0.42 + rng.next() * 0.1;
    vocalSource.connect(vocalGain);
    vocalGain.connect(preGain);
  }

  chorus.lfo.start(0);
  checkAborted(jobId);
  const buffer = await context.startRendering();
  chorus.lfo.stop();
  return buffer;
}

function mergeSegments(buffers: AudioBuffer[], sampleRate: number): AudioBuffer {
  if (!buffers.length) {
    return new AudioBuffer({ length: sampleRate, numberOfChannels: 2, sampleRate });
  }

  const channels = Math.max(...buffers.map((b) => b.numberOfChannels));
  const totalLength = buffers.reduce((acc, buffer) => acc + buffer.length, 0);
  const merged = new AudioBuffer({ length: totalLength, numberOfChannels: channels, sampleRate });

  let offset = 0;
  for (const buffer of buffers) {
    for (let channel = 0; channel < channels; channel += 1) {
      const destination = new Float32Array(buffer.length);
      if (channel < buffer.numberOfChannels) {
        buffer.copyFromChannel(destination, channel, 0);
      }
      merged.copyToChannel(destination, channel, offset);
    }
    offset += buffer.length;
  }
  return merged;
}

function bufferToMono(buffer: AudioBuffer): Float32Array {
  const length = buffer.length;
  const channels = Math.max(1, buffer.numberOfChannels);
  const mono = new Float32Array(length);
  for (let channel = 0; channel < channels; channel += 1) {
    const channelData = new Float32Array(length);
    buffer.copyFromChannel(channelData, channel, 0);
    for (let i = 0; i < length; i += 1) {
      mono[i] += channelData[i];
    }
  }
  if (channels > 1) {
    for (let i = 0; i < length; i += 1) {
      mono[i] /= channels;
    }
  }
  return mono;
}

function applyEq(context: OfflineAudioContext, input: AudioNode, peaks: readonly { f: number; q: number; gain: number }[]) {
  if (!peaks.length) {
    return input;
  }
  let node: AudioNode = input;
  for (const peak of peaks) {
    const filter = context.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.value = peak.f;
    filter.Q.value = peak.q;
    filter.gain.value = peak.gain;
    node.connect(filter);
    node = filter;
  }
  return node;
}

type LFOHandle = { start(when?: number): void; stop(when?: number): void };

function applyChorus(
  context: OfflineAudioContext,
  input: AudioNode,
  config: { rate: number; depth: number },
  automation?: { curve: Float32Array; duration: number },
) {
  const chorusInput = context.createGain();
  const delay = context.createDelay(0.05);
  const baseDelay = CHORUS_BASE_DELAY;
  delay.delayTime.value = baseDelay;

  const wetGain = context.createGain();
  wetGain.gain.value = 0.28;

  let lfoHandle: LFOHandle;
  if (automation?.curve && automation.curve.length > 1) {
    delay.delayTime.cancelScheduledValues(0);
    delay.delayTime.setValueAtTime(baseDelay, 0);
    delay.delayTime.setValueCurveAtTime(automation.curve, 0, automation.duration);
    lfoHandle = {
      start: () => {},
      stop: () => {},
    };
  } else {
    const lfo = context.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = clamp(config.rate, 0.05, 4);

    const lfoGain = context.createGain();
    lfoGain.gain.value = clamp(config.depth, 0.0005, 0.01);

    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    lfoHandle = lfo;
  }

  input.connect(chorusInput);
  chorusInput.connect(delay);
  delay.connect(wetGain);

  const output = context.createGain();
  chorusInput.connect(output);
  wetGain.connect(output);

  return { input: chorusInput, output, lfo: lfoHandle };
}

function applySaturation(context: OfflineAudioContext, input: AudioNode, drive: number) {
  const shaper = context.createWaveShaper();
  shaper.curve = createSaturationCurve(drive);
  input.connect(shaper);
  return shaper;
}

function buildBeatLockedDelayCurve(
  frameCount: number,
  sampleRate: number,
  bpm: number,
  rateHz: number,
  depth: number,
  boundaries: number[],
): Float32Array {
  const curve = new Float32Array(frameCount);
  if (frameCount <= 0) return curve;

  const baseDelay = CHORUS_BASE_DELAY;
  const beatsPerSecond = bpm / 60;
  if (!Number.isFinite(rateHz) || rateHz <= 0 || !Number.isFinite(depth) || depth <= 0 || beatsPerSecond <= 0) {
    curve.fill(baseDelay);
    return curve;
  }

  const sortedBoundaries = [...boundaries]
    .map((idx) => Math.round(idx))
    .filter((idx) => idx > 0 && idx < frameCount)
    .sort((a, b) => a - b);

  const uniqueBoundaries: number[] = [];
  for (const idx of sortedBoundaries) {
    if (uniqueBoundaries.length === 0 || uniqueBoundaries[uniqueBoundaries.length - 1] !== idx) {
      uniqueBoundaries.push(idx);
    }
  }

  const ratio = rateHz / beatsPerSecond;
  const lfo = new BeatLockedLFO(sampleRate, bpm, ratio, 1, 0);
  const splits = blockSplitsByBoundaries(0, frameCount, uniqueBoundaries);

  let cursor = 0;
  let boundaryIdx = 0;
  for (const segment of splits) {
    if (segment <= 0) continue;
    const { phase0, dphi } = lfo.advance(segment);
    for (let i = 0; i < segment; i += 1) {
      curve[cursor + i] = baseDelay + Math.sin(phase0 + dphi * i) * depth;
    }
    cursor += segment;
    while (boundaryIdx < uniqueBoundaries.length && uniqueBoundaries[boundaryIdx] <= cursor) {
      if (Math.abs(uniqueBoundaries[boundaryIdx] - cursor) <= 1) {
        lfo.reset(0);
      }
      boundaryIdx += 1;
    }
  }

  if (cursor < frameCount) {
    for (let i = cursor; i < frameCount; i += 1) {
      curve[i] = baseDelay;
    }
  }

  return curve;
}

function applyWindowFades(gain: AudioParam, durationSec: number) {
  const fade = Math.min(0.03, durationSec / 6);
  if (fade <= 0) return;
  gain.setValueAtTime(0, 0);
  gain.linearRampToValueAtTime(1, fade);
  gain.setValueAtTime(1, Math.max(fade, durationSec - fade));
  gain.linearRampToValueAtTime(0, durationSec);
}

function createSaturationCurve(drive: number) {
  const amount = clamp(drive, 0.05, 1.5);
  const samples = 1024;
  const curve = new Float32Array(samples);
  const k = amount * 2 + 0.5;
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

function bufferToWavBlob(buffer: AudioBuffer, sampleRate: number): Blob {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length * numChannels * 2;
  const wavBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(wavBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, length, true);

  let offset = 44;
  const channelData = Array.from({ length: numChannels }, (_, channel) => buffer.getChannelData(channel));
  for (let i = 0; i < buffer.length; i += 1) {
    for (let channel = 0; channel < numChannels; channel += 1) {
      const sample = channelData[channel][i];
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([wavBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function sanitizeTempo(raw: TempoMeta): TempoMeta {
  const bpm = clamp(Number(raw?.bpm) || 120, 40, 240);
  const timeSig = typeof raw?.timeSig === "string" && /^\d+\/\d+$/.test(raw.timeSig) ? raw.timeSig : "4/4";
  const offsetMs = clampNumber(raw?.offsetMs ?? 0, -2000, 2000);
  const barsInLoop = raw?.barsInLoop && Number.isFinite(raw.barsInLoop) ? Math.max(1, Math.min(512, raw.barsInLoop)) : undefined;
  return { bpm, timeSig, offsetMs, barsInLoop, quantized: raw?.quantized ?? true };
}

function sanitizeBarWindows(windows: BarWindow[], tempo: TempoMeta): BarWindow[] {
  const seen = new Set<string>();
  const sanitized: BarWindow[] = [];
  for (const window of windows) {
    const startBar = Math.max(1, Math.floor(window.startBar));
    const endBar = Math.max(startBar + 1, Math.floor(window.endBar));
    const key = `${startBar}:${endBar}`;
    if (!seen.has(key)) {
      sanitized.push({ startBar, endBar });
      seen.add(key);
    }
  }
  sanitized.sort((a, b) => a.startBar - b.startBar || a.endBar - b.endBar);
  return sanitized;
}

function windowToSeconds(window: BarWindow, tempo: TempoMeta) {
  const beatsPerBar = Number.parseInt(tempo.timeSig.split("/")[0] || "4", 10);
  const msPerBeat = 60_000 / tempo.bpm;
  const msPerBar = msPerBeat * beatsPerBar;
  const startTimeMs = tempo.offsetMs + (window.startBar - 1) * msPerBar;
  const durationMs = (window.endBar - window.startBar) * msPerBar;
  return {
    startTimeSec: Math.max(0, startTimeMs / 1000),
    durationSec: Math.max(0.01, durationMs / 1000),
  };
}

function extractHelixPeaks(packet: HelixPacket | undefined | null) {
  if (!packet?.peaks?.length) return [];
  return packet.peaks.map((peak) => ({
    f: clampNumber((peak.omega ?? 0) / (2 * Math.PI), 40, 19_500),
    q: clampNumber(1 / Math.max(0.001, peak.gamma ?? 0.4), 0.2, 18),
    gain: clamp01((peak.alpha ?? 0.2) * 0.8 + 1),
  }));
}

function computeSeed(
  helix: HelixPacket | undefined,
  sampleInfluence: number,
  styleInfluence: number,
  weirdness: number,
): number {
  let seed = 0x9e3779b1;
  if (helix?.seed) {
    seed ^= hashString(helix.seed);
  }
  if (typeof helix?.branch === "number") {
    seed ^= Math.trunc(helix.branch * 0x9e3779b97f4a7c15) & 0xffffffff;
  }
  seed ^= Math.trunc(sampleInfluence * 1_000_003);
  seed ^= Math.trunc(styleInfluence * 1_000_033);
  seed ^= Math.trunc(weirdness * 1_000_079);
  return seed >>> 0;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function clampNumber(value: number, min: number, max: number) {
  return clamp(Number(value) || 0, min, max);
}

function dbToGain(db: number) {
  return 10 ** (db / 20);
}

export {};
