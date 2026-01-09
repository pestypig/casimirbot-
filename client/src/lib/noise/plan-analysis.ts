import type { BarWindow, TempoMeta } from "@/types/noise-gens";

export type PlanWindowAnalysis = {
  startBar: number;
  bars: number;
  energy?: number;
  density?: number;
  brightness?: number;
};

export type PlanSection = {
  name: string;
  startBar: number;
  bars: number;
};

export type PlanEnergyPoint = { bar: number; energy: number };

export type PlanAnalysis = {
  windows?: PlanWindowAnalysis[];
  energyByBar?: number[];
  sections?: PlanSection[];
  energyCurve?: PlanEnergyPoint[];
};

type PlanAnalysisInput = {
  originalId: string;
  barWindows: BarWindow[];
  tempo: TempoMeta;
};

const clamp01 = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

const resourceCache = new Map<string, Promise<boolean>>();

const resourceExists = async (url: string) => {
  let cached = resourceCache.get(url);
  if (!cached) {
    cached = fetch(url, { method: "HEAD" })
      .then((res) => res.ok)
      .catch(() => false);
    resourceCache.set(url, cached);
  }
  return cached;
};

const resolveInstrumentalUrl = async (originalId: string) => {
  const slug = encodeURIComponent(originalId.toLowerCase());
  const roots = [`/originals/${slug}`, `/audio/originals/${slug}`];
  for (const root of roots) {
    const url = `${root}/instrumental.wav`;
    if (await resourceExists(url)) {
      return url;
    }
  }
  return "/originals/default/instrumental.wav";
};

const sanitizeTempo = (tempo: TempoMeta) => ({
  bpm: Math.min(240, Math.max(40, Number(tempo.bpm) || 120)),
  timeSig:
    typeof tempo.timeSig === "string" && /^\d+\/\d+$/.test(tempo.timeSig)
      ? tempo.timeSig
      : ("4/4" as TempoMeta["timeSig"]),
  offsetMs: Number.isFinite(tempo.offsetMs) ? tempo.offsetMs : 0,
});

export async function analyzeOriginalForPlan(
  input: PlanAnalysisInput,
): Promise<PlanAnalysis | null> {
  if (typeof AudioContext === "undefined") return null;
  const cleanedWindows = (input.barWindows ?? []).filter(
    (window) =>
      Number.isFinite(window.startBar) &&
      Number.isFinite(window.endBar) &&
      window.endBar > window.startBar,
  );
  if (!cleanedWindows.length) return null;

  try {
    const tempo = sanitizeTempo(input.tempo);
    const url = await resolveInstrumentalUrl(input.originalId);
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const context = new AudioContext();
    const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
    if (context.close) {
      void context.close();
    }

    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const channelA = audioBuffer.getChannelData(0);
    const channelB = channels > 1 ? audioBuffer.getChannelData(1) : null;
    const channelScale = channels > 1 ? 1 / channels : 1;

    const maxEndBar = Math.max(
      ...cleanedWindows.map((window) => Math.floor(window.endBar)),
    );
    const maxBar = Math.max(1, maxEndBar - 1);
    const energyRaw = new Array<number>(maxBar).fill(0);
    const densityRaw = new Array<number>(maxBar).fill(0);
    const brightnessRaw = new Array<number>(maxBar).fill(0);

    const beatsPerBar = Number(tempo.timeSig.split("/")[0]) || 4;
    const msPerBeat = 60000 / tempo.bpm;
    const msPerBar = msPerBeat * beatsPerBar;
    const offsetMs = tempo.offsetMs;
    const cutoffHz = 250;
    const lpAlpha = Math.exp((-2 * Math.PI * cutoffHz) / sampleRate);

    let energyMin = Number.POSITIVE_INFINITY;
    let energyMax = Number.NEGATIVE_INFINITY;
    let densityMin = Number.POSITIVE_INFINITY;
    let densityMax = Number.NEGATIVE_INFINITY;

    for (let bar = 1; bar <= maxBar; bar += 1) {
      const startMs = offsetMs + (bar - 1) * msPerBar;
      const endMs = offsetMs + bar * msPerBar;
      const startSample = Math.max(0, Math.floor((startMs / 1000) * sampleRate));
      const endSample = Math.min(
        audioBuffer.length,
        Math.floor((endMs / 1000) * sampleRate),
      );
      const count = Math.max(0, endSample - startSample);
      if (count <= 0) {
        energyRaw[bar - 1] = 0;
        densityRaw[bar - 1] = 0;
        brightnessRaw[bar - 1] = 0;
        continue;
      }

      let sumSq = 0;
      let sumLowSq = 0;
      let sumHighSq = 0;
      let sumDiff = 0;
      let low = 0;
      let prev = 0;
      let seeded = false;

      for (let idx = startSample; idx < endSample; idx += 1) {
        const sample =
          channels > 1
            ? (channelA[idx] + (channelB?.[idx] ?? 0)) * channelScale
            : channelA[idx];
        low = lpAlpha * low + (1 - lpAlpha) * sample;
        const high = sample - low;
        sumSq += sample * sample;
        sumLowSq += low * low;
        sumHighSq += high * high;
        if (seeded) {
          sumDiff += Math.abs(sample - prev);
        } else {
          seeded = true;
        }
        prev = sample;
      }

      const rms = Math.sqrt(sumSq / count);
      const lowRms = Math.sqrt(sumLowSq / count);
      const highRms = Math.sqrt(sumHighSq / count);
      const brightness =
        highRms + lowRms > 0 ? highRms / (highRms + lowRms) : 0;
      const density = sumDiff / count;

      energyRaw[bar - 1] = rms;
      densityRaw[bar - 1] = density;
      brightnessRaw[bar - 1] = clamp01(brightness);

      energyMin = Math.min(energyMin, rms);
      energyMax = Math.max(energyMax, rms);
      densityMin = Math.min(densityMin, density);
      densityMax = Math.max(densityMax, density);
    }

    const energyRange =
      Number.isFinite(energyMin) && Number.isFinite(energyMax) && energyMax > energyMin
        ? energyMax - energyMin
        : 0;
    const densityRange =
      Number.isFinite(densityMin) &&
      Number.isFinite(densityMax) &&
      densityMax > densityMin
        ? densityMax - densityMin
        : 0;

    const energyByBar = energyRaw.map((value) =>
      energyRange > 0 ? clamp01((value - energyMin) / energyRange) : 0.5,
    );
    const densityByBar = densityRaw.map((value) =>
      densityRange > 0 ? clamp01((value - densityMin) / densityRange) : 0.5,
    );

    const windows: PlanWindowAnalysis[] = cleanedWindows.map((window) => {
      const startBar = Math.max(1, Math.floor(window.startBar));
      const bars = Math.max(1, Math.floor(window.endBar - window.startBar));
      const startIndex = Math.max(0, startBar - 1);
      const endIndex = Math.min(maxBar, startIndex + bars);
      let sumEnergy = 0;
      let sumDensity = 0;
      let sumBrightness = 0;
      let count = 0;
      for (let idx = startIndex; idx < endIndex; idx += 1) {
        sumEnergy += energyByBar[idx] ?? 0;
        sumDensity += densityByBar[idx] ?? 0;
        sumBrightness += brightnessRaw[idx] ?? 0;
        count += 1;
      }
      const denom = count || 1;
      return {
        startBar,
        bars,
        energy: clamp01(sumEnergy / denom),
        density: clamp01(sumDensity / denom),
        brightness: clamp01(sumBrightness / denom),
      };
    });

    return { windows, energyByBar };
  } catch {
    return null;
  }
}
