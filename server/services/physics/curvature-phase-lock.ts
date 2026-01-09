import { computePhaseLockScore } from "./curvature-metrics";

export type PhaseLockSample = {
  t_s: number;
  k1: number;
  frame_id?: string;
  timestamp_iso?: string;
};

export type PhaseSlipEvent = {
  frame_id?: string;
  timestamp_iso?: string;
  t_s: number;
  coherence: number;
  delta: number;
};

export type PhaseLockBandwidth = {
  low_hz: number;
  high_hz: number;
  width_hz: number;
  threshold: number;
};

export type PhaseLockWindow = {
  window_s?: number;
  window_cycles?: number;
  min_window_s?: number;
  band_threshold_ratio?: number;
  slip_drop?: number;
  slip_floor?: number;
};

export type PhaseLockScanResult = {
  fStar?: number;
  bandwidth?: PhaseLockBandwidth;
  k3ByF: Array<{ frequency_hz: number; k3: number }>;
  phaseSlipEvents: PhaseSlipEvent[];
};

const computeWindowedCoherence = (
  samples: PhaseLockSample[],
  frequency_hz: number,
  window_s: number,
): Array<{ t_s: number; coherence: number }> => {
  const omega = 2 * Math.PI * frequency_hz;
  const times = samples.map((sample) => sample.t_s);
  const weights = samples.map((sample) => Math.max(0, sample.k1));
  const cosVals = times.map((t) => Math.cos(omega * t));
  const sinVals = times.map((t) => Math.sin(omega * t));
  const halfWindow = window_s / 2;
  const out: Array<{ t_s: number; coherence: number }> = [];
  let start = 0;
  let end = 0;
  let sumRe = 0;
  let sumIm = 0;
  let sumW = 0;
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    const minT = t - halfWindow;
    const maxT = t + halfWindow;
    while (end < times.length && times[end] <= maxT) {
      sumRe += weights[end] * cosVals[end];
      sumIm += weights[end] * sinVals[end];
      sumW += weights[end];
      end += 1;
    }
    while (start < times.length && times[start] < minT) {
      sumRe -= weights[start] * cosVals[start];
      sumIm -= weights[start] * sinVals[start];
      sumW -= weights[start];
      start += 1;
    }
    const coherence = sumW > 0 ? Math.hypot(sumRe, sumIm) / sumW : 0;
    out.push({ t_s: t, coherence });
  }
  return out;
};

const detectPhaseSlips = (
  samples: PhaseLockSample[],
  coherence: Array<{ t_s: number; coherence: number }>,
  window: PhaseLockWindow,
): PhaseSlipEvent[] => {
  const drop = window.slip_drop ?? 0.35;
  const floor = window.slip_floor ?? 0.35;
  const events: PhaseSlipEvent[] = [];
  for (let i = 1; i < coherence.length; i++) {
    const prev = coherence[i - 1].coherence;
    const curr = coherence[i].coherence;
    if (prev - curr >= drop && curr <= floor) {
      const sample = samples[i];
      events.push({
        frame_id: sample.frame_id,
        timestamp_iso: sample.timestamp_iso,
        t_s: sample.t_s,
        coherence: curr,
        delta: curr - prev,
      });
    }
  }
  return events;
};

const sortSamples = (samples: PhaseLockSample[]) =>
  [...samples]
    .map((sample, index) => ({ ...sample, _order: index }))
    .sort((a, b) =>
      a.t_s === b.t_s ? a._order - b._order : a.t_s - b.t_s,
    )
    .map(({ _order, ...sample }) => sample);

export const scanK3FrequencyBand = (
  timeSeries: PhaseLockSample[],
  fGrid: number[],
  window: PhaseLockWindow,
): PhaseLockScanResult => {
  if (timeSeries.length < 2 || fGrid.length === 0) {
    return {
      k3ByF: [],
      phaseSlipEvents: [],
    };
  }
  const samples = sortSamples(timeSeries);
  const k3ByF = fGrid.map((frequency) => ({
    frequency_hz: frequency,
    k3: computePhaseLockScore(samples, frequency),
  }));
  let bestIndex = 0;
  for (let i = 1; i < k3ByF.length; i++) {
    if (k3ByF[i].k3 > k3ByF[bestIndex].k3) bestIndex = i;
  }
  const fStar = k3ByF[bestIndex]?.frequency_hz;
  const ratio = Math.min(
    1,
    Math.max(0, window.band_threshold_ratio ?? 0.8),
  );
  const threshold = k3ByF[bestIndex]?.k3 * ratio;
  let bandwidth: PhaseLockBandwidth | undefined;
  if (threshold > 0) {
    let low = bestIndex;
    let high = bestIndex;
    while (low > 0 && k3ByF[low - 1].k3 >= threshold) low -= 1;
    while (high < k3ByF.length - 1 && k3ByF[high + 1].k3 >= threshold) {
      high += 1;
    }
    const lowHz = k3ByF[low].frequency_hz;
    const highHz = k3ByF[high].frequency_hz;
    bandwidth = {
      low_hz: lowHz,
      high_hz: highHz,
      width_hz: Math.max(0, highHz - lowHz),
      threshold,
    };
  }
  const rawWindow =
    window.window_s ??
    (window.window_cycles && fStar ? window.window_cycles / fStar : 0);
  const window_s = Math.max(window.min_window_s ?? 0, rawWindow ?? 0);
  const coherenceSeries =
    fStar && window_s > 0
      ? computeWindowedCoherence(samples, fStar, window_s)
      : [];
  const phaseSlipEvents =
    fStar && coherenceSeries.length > 0
      ? detectPhaseSlips(samples, coherenceSeries, window)
      : [];
  return {
    fStar,
    bandwidth,
    k3ByF,
    phaseSlipEvents,
  };
};
