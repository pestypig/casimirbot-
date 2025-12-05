/**
 * SunPy coherence bridge:
 * - Takes the /sunpy-export payload (frames + HEK events)
 * - Bins into 5-minute windows (300 s macro eigenmode)
 * - Emits HEK events via the existing mass/alignment model
 * - Emits one InformationEvent per bin with phase-modulated alignment + entropy proxy
 */
import { emitSolarHekEvents, handleInformationEvent, type SolarHekEventInput } from "../star/service";

const BIN_SECONDS = 300;
const BIN_MS = BIN_SECONDS * 1000;

export interface SunpyExportFrame {
  index: number;
  obstime: string;
  fits_path?: string | null;
  png_path?: string | null;
}

export interface SunpyExportEvent {
  id?: string;
  ivorn?: string;
  event_type?: string;
  start_time?: string;
  end_time?: string;
  start?: string;
  end?: string;
  u?: number;
  v?: number;
  rho?: number;
  on_disk?: boolean;
  goes_class?: string;
  peak_flux?: number;
  noaa_ar?: number;
  ch_area?: number;
  frm_name?: string;
  bbox?: Array<{ u: number; v: number }>;
  grid_i?: number;
  grid_j?: number;
  grid_n?: number;
  grid_rsun_arcsec?: number;
}

export interface SunpyCdawebBin {
  start?: string;
  end?: string;
  variance?: number;
  rms?: number;
  mean?: number;
  samples?: number;
  dbdt_rms?: number;
  anisotropy?: number;
}

export interface SunpyCdawebBlock {
  dataset?: string;
  bins?: SunpyCdawebBin[];
  window_start?: string;
  window_end?: string;
  reason?: string;
}

export interface SunpyGoesXrsPoint {
  time?: string;
  short?: number;
  long?: number;
}

export interface SunpyGoesXrsBin {
  start?: string;
  end?: string;
  mean_short?: number;
  mean_long?: number;
  max_short?: number;
  max_long?: number;
}

export interface SunpyGoesXrsBlock {
  points?: SunpyGoesXrsPoint[];
  bins?: SunpyGoesXrsBin[];
  reason?: string | null;
}

export interface SunpyJsocCutout {
  file?: string;
  start?: string;
  end?: string;
  center_arcsec?: { x?: number; y?: number };
  width_arcsec?: number;
  height_arcsec?: number;
  reason?: string | null;
}

export interface SunpySharpSummary {
  harpnum?: number;
  source?: string;
  segment?: string;
  map_path?: string;
  obstime?: string;
  mean_abs_flux?: number;
  total_abs_flux?: number;
  max_abs_flux?: number;
  pixels?: number;
}

export interface SunpyExportPayload {
  instrument: string;
  wavelength_A: number;
  rsun_arcsec?: number;
  reason?: string | null;
  meta?: {
    start?: string;
    end?: string;
    instrument?: string;
    wavelength?: number;
    cadence_s?: number | null;
    max_frames?: number;
    requestedEventTypes?: string[];
    rsun_arcsec?: number;
    frames_missing?: boolean;
    frames_missing_reason?: string | null;
    source?: string | null;
    reason?: string | null;
    requested_start?: string;
    requested_end?: string;
    normalized_window?: boolean;
    fallback_applied?: boolean;
    fallback_start?: string;
    fallback_end?: string;
  };
  frames: SunpyExportFrame[];
  events: SunpyExportEvent[];
  cdaweb?: SunpyCdawebBlock | null;
  jsoc_sharp?: SunpySharpSummary | null;
  jsoc_cutout?: SunpyJsocCutout | null;
  goes_xrs?: SunpyGoesXrsBlock | null;
}

type Ms = number;

interface CoherenceBin {
  startMs: Ms;
  endMs: Ms;
  centerMs: Ms;
  phaseRad: number;
  frames: SunpyExportFrame[];
  events: SunpyExportEvent[];
}

interface HeuristicStats {
  globalCoherence: number;
  energy: number;
  dispersion: number;
  entropy: number;
  eventMass: number;
  flareFlux?: number;
  flareFluxNorm?: number;
  turbulence?: number;
  sharpFlux?: number;
  goesFlux?: number;
}

export interface SunpyBridgeBinSummary {
  startIso: string;
  endIso: string;
  phaseRad: number;
  frameCount: number;
  eventCount: number;
  alignment: number;
  entropy: number;
  energy: number;
  dispersion: number;
  turbulence?: number;
  flareFlux?: number;
  flareFluxNorm?: number;
  sharpFlux?: number;
  goesFlux?: number;
}

export interface SunpyBridgeSummary {
  t0Iso: string;
  binCount: number;
  frameCount: number;
  eventCount: number;
  bins: SunpyBridgeBinSummary[];
}

const clamp = (v: number, min = 0, max = 1) => {
  if (!Number.isFinite(v)) return min;
  if (v < min) return min;
  if (v > max) return max;
  return v;
};

type ExternalSignals = {
  turbulence?: number;
  flareFlux?: number;
  flareFluxNorm?: number;
  sharpFlux?: number;
  goesFlux?: number;
};

type CdawebBinMs = SunpyCdawebBin & { startMs?: Ms; endMs?: Ms; turbulence?: number };
type GoesXrsBinMs = SunpyGoesXrsBin & { startMs?: Ms; endMs?: Ms };

const TYPE_WEIGHTS: Record<string, number> = {
  FL: 6000,
  AR: 3800,
  CH: 2600,
  CE: 4200,
  EF: 2400,
  CJ: 1800,
  FI: 2000,
  FE: 2000,
};

const parseGoesScale = (goes?: string): number => {
  if (!goes) return 1;
  const match = goes.trim().toUpperCase().match(/^([A-Z])\s*([0-9.]+)?/);
  if (!match) return 1;
  const letter = match[1];
  const value = Number.parseFloat(match[2] ?? "1");
  const letterScale: Record<string, number> = { A: 0.01, B: 0.1, C: 1, M: 10, X: 100 };
  return Math.max(0.1, value * (letterScale[letter] ?? 1));
};

const goesPeakFluxWm2 = (goes?: string): number => {
  if (!goes) return 0;
  const match = goes.trim().toUpperCase().match(/^([A-Z])\s*([0-9.]+)?/);
  if (!match) return 0;
  const letter = match[1];
  const value = Number.parseFloat(match[2] ?? "1");
  const letterScale: Record<string, number> = { A: 1e-8, B: 1e-7, C: 1e-6, M: 1e-5, X: 1e-4 };
  return Math.max(0, value * (letterScale[letter] ?? 0));
};

const estimateEventMass = (ev: SunpyExportEvent): number => {
  const typeKey = (ev.event_type ?? "").toUpperCase();
  if (!typeKey) return 0;
  const base = TYPE_WEIGHTS[typeKey] ?? 1200;
  const goesScale = typeKey === "FL" ? parseGoesScale(ev.goes_class) : 1;
  const chScale = typeKey === "CH" && Number.isFinite(ev.ch_area) ? Math.log1p(ev.ch_area as number) / 20 : 1;
  const rhoPenalty = Number.isFinite(ev.rho) ? Math.max(0.6, 1.05 - Math.min(1, Math.abs(ev.rho as number))) : 1;
  return Math.max(200, base * goesScale * chScale * rhoPenalty);
};

const eventPeakFluxWm2 = (ev: SunpyExportEvent): number => {
  if (Number.isFinite(ev.peak_flux)) {
    return Math.max(0, ev.peak_flux as number);
  }
  return goesPeakFluxWm2(ev.goes_class);
};

const parseMs = (iso?: string | null): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
};

const phaseForTime = (tMs: Ms, t0Ms: Ms): number => {
  const dt = (tMs - t0Ms) / 1000;
  const raw = (2 * Math.PI * dt) / BIN_SECONDS;
  const wrapped = ((raw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return wrapped;
};

const phaseGainFor = (phaseRad: number, amp = 0.25): number => 1 + amp * Math.cos(phaseRad);

const chooseReferenceT0 = (payload: SunpyExportPayload): Ms | null => {
  const metaStart = parseMs(payload.meta?.start);
  if (metaStart !== null) return metaStart;
  const firstFrame = payload.frames?.[0];
  const frameMs = parseMs(firstFrame?.obstime);
  if (frameMs !== null) return frameMs;
  return null;
};

const turbulenceFromCdaweb = (bin: SunpyCdawebBin): number => {
  const variance = Number.isFinite(bin.variance ?? NaN) ? (bin.variance as number) : undefined;
  const rms = Number.isFinite(bin.rms ?? NaN) ? (bin.rms as number) : undefined;
  const dbdt = Number.isFinite(bin.dbdt_rms ?? NaN) ? (bin.dbdt_rms as number) : undefined;
  const anisotropy = Number.isFinite(bin.anisotropy ?? NaN) ? (bin.anisotropy as number) : undefined;
  const basis = variance !== undefined ? variance : rms !== undefined ? rms : 0;
  const baseNorm = clamp(Math.log1p(Math.max(0, basis)) / Math.log(1 + 5_000), 0, 1);
  const dbdtNorm = clamp(Math.log1p(Math.max(0, dbdt ?? 0)) / Math.log(1 + 200), 0, 1);
  const anisotropyNorm = anisotropy !== undefined ? clamp(anisotropy / 3, 0, 1) : 0;
  // Blend magnitude variance with temporal roughness (dB/dt) and component anisotropy.
  return clamp(baseNorm * 0.7 + dbdtNorm * 0.2 + anisotropyNorm * 0.1, 0, 1);
};

const normalizeCdawebBins = (block?: SunpyCdawebBlock | null): CdawebBinMs[] => {
  if (!block?.bins?.length) return [];
  return block.bins
    .map((bin) => {
      const startMs = parseMs(bin.start);
      const endMs = parseMs(bin.end);
      const turbulence = turbulenceFromCdaweb(bin);
      return { ...bin, startMs: startMs ?? undefined, endMs: endMs ?? undefined, turbulence };
    })
    .filter((b) => b.startMs !== undefined && b.endMs !== undefined);
};

const normalizeGoesBins = (block?: SunpyGoesXrsBlock | null): GoesXrsBinMs[] => {
  if (!block?.bins?.length) return [];
  return block.bins
    .map((bin) => {
      const startMs = parseMs(bin.start);
      const endMs = parseMs(bin.end);
      return { ...bin, startMs: startMs ?? undefined, endMs: endMs ?? undefined };
    })
    .filter((b) => b.startMs !== undefined && b.endMs !== undefined)
    .sort((a, b) => (a.startMs as number) - (b.startMs as number));
};

const buildBins = (payload: SunpyExportPayload, t0Ms: Ms): CoherenceBin[] => {
  const map = new Map<number, CoherenceBin>();
  const ensure = (idx: number): CoherenceBin => {
    let bin = map.get(idx);
    if (!bin) {
      const startMs = t0Ms + idx * BIN_MS;
      const endMs = startMs + BIN_MS;
      const centerMs = startMs + BIN_MS / 2;
      bin = {
        startMs,
        endMs,
        centerMs,
        phaseRad: phaseForTime(centerMs, t0Ms),
        frames: [],
        events: [],
      };
      map.set(idx, bin);
    }
    return bin;
  };

  for (const frame of payload.frames ?? []) {
    const tMs = parseMs(frame.obstime);
    if (tMs === null) continue;
    const idx = Math.floor((tMs - t0Ms) / BIN_MS);
    if (idx < 0) continue;
    ensure(idx).frames.push(frame);
  }

  for (const ev of payload.events ?? []) {
    const tMs = parseMs(ev.start_time ?? ev.start ?? ev.end_time ?? ev.end);
    if (tMs === null) continue;
    const idx = Math.floor((tMs - t0Ms) / BIN_MS);
    if (idx < 0) continue;
    ensure(idx).events.push(ev);
  }

  return [...map.values()].sort((a, b) => a.startMs - b.startMs);
};

const computeHeuristicCoherence = (
  bin: CoherenceBin,
  cadenceS: number | null | undefined,
  extra?: ExternalSignals,
): HeuristicStats => {
  const totalMass = bin.events.reduce((acc, ev) => acc + estimateEventMass(ev), 0);
  const expectedFrames = cadenceS && cadenceS > 0 ? Math.max(1, Math.round(BIN_SECONDS / cadenceS)) : 10;
  const frameFill = clamp(bin.frames.length / expectedFrames, 0, 1);
  const massNorm = clamp(Math.log1p(totalMass) / Math.log(1 + 20_000), 0, 1);
  const frameNorm = frameFill;
  const turbulence = clamp(extra?.turbulence ?? 0, 0, 1);
  const flareFluxNorm = clamp(extra?.flareFluxNorm ?? 0, 0, 1);
  const sharpFluxNorm = clamp(
    extra?.sharpFlux !== undefined ? Math.log1p(Math.max(0, extra.sharpFlux)) / Math.log(1 + 5_000) : 0,
    0,
    1,
  );

  const globalCoherence = clamp(0.5 * frameNorm + 0.35 * massNorm + 0.15 * sharpFluxNorm - 0.25 * turbulence, 0, 1);
  const energy = clamp(0.5 * massNorm + 0.3 * frameNorm + 0.2 * flareFluxNorm, 0, 1);
  const dispersion = clamp(0.6 - 0.4 * globalCoherence + 0.2 * turbulence + 0.05 * (1 - frameNorm), 0, 1);
  const entropy = clamp((0.45 * massNorm + 0.45 * frameNorm + 0.25 * turbulence) * 0.95, 0, 1);

  return {
    globalCoherence,
    energy,
    dispersion,
    entropy,
    eventMass: totalMass,
    flareFlux: extra?.flareFlux,
    flareFluxNorm,
    turbulence,
    sharpFlux: extra?.sharpFlux,
    goesFlux: extra?.goesFlux,
  };
};

const resolveExternalSignals = (
  bin: CoherenceBin,
  cdawebBins: CdawebBinMs[],
  goesBins: GoesXrsBinMs[],
  sharpFlux?: number | null,
): ExternalSignals => {
  const cdaMatch = cdawebBins.find(
    (b) =>
      b.startMs !== undefined &&
      b.endMs !== undefined &&
      bin.startMs < (b.endMs as number) &&
      bin.endMs > (b.startMs as number),
  );
  const goesMatch = goesBins.find(
    (b) =>
      b.startMs !== undefined &&
      b.endMs !== undefined &&
      bin.startMs < (b.endMs as number) &&
      bin.endMs > (b.startMs as number),
  );
  const eventsFlux = bin.events.reduce((acc, ev) => acc + eventPeakFluxWm2(ev), 0);
  const goesFlux = Math.max(0, goesMatch?.max_long ?? goesMatch?.mean_long ?? 0);
  const flareFlux = eventsFlux + goesFlux;
  const flareFluxNorm = clamp(Math.log10(1 + Math.max(0, flareFlux) * 1e8) / 8, 0, 1);
  return {
    turbulence: cdaMatch?.turbulence,
    flareFlux,
    flareFluxNorm,
    sharpFlux: sharpFlux ?? undefined,
    goesFlux,
  };
};

export async function ingestSunpyCoherenceBridge(
  payload: SunpyExportPayload,
  opts?: { sessionId?: string; sessionType?: string; hostMode?: string; emitEvents?: boolean; phaseGainAmp?: number },
): Promise<SunpyBridgeSummary | null> {
  if (!payload || !Array.isArray(payload.frames)) return null;

  const sessionId = opts?.sessionId ?? "solar-hek";
  const sessionType = opts?.sessionType ?? "solar";
  const hostMode = opts?.hostMode ?? "sun_like";
  const emitEvents = opts?.emitEvents ?? true;
  const t0Ms = chooseReferenceT0(payload);
  if (t0Ms === null) return null;

  const bins = buildBins(payload, t0Ms);
  const cadenceS = payload.meta?.cadence_s ?? null;
  const cdawebBins = normalizeCdawebBins(payload.cdaweb);
  const goesBins = normalizeGoesBins(payload.goes_xrs);
  const sharpFlux = payload.jsoc_sharp?.mean_abs_flux ?? null;
  const binSummaries: SunpyBridgeBinSummary[] = [];
  let totalFrames = 0;
  let totalEvents = 0;

  for (const bin of bins) {
    totalFrames += bin.frames.length;
    totalEvents += bin.events.length;

    if (emitEvents && bin.events.length) {
      emitSolarHekEvents(bin.events as SolarHekEventInput[], { sessionId, sessionType, hostMode });
    }

    const externalSignals = resolveExternalSignals(bin, cdawebBins, goesBins, sharpFlux);
    const stats = computeHeuristicCoherence(bin, cadenceS, externalSignals);
    const turbPenalty = clamp(externalSignals.turbulence ?? 0, 0, 1);
    const alignment = clamp(stats.globalCoherence * phaseGainFor(bin.phaseRad, opts?.phaseGainAmp) * (1 - 0.35 * turbPenalty), 0, 1);
    const bytes = Math.max(400, Math.round(stats.eventMass * 0.8 + bin.frames.length * 500));
    const timestamp = bin.centerMs ?? Date.now();

    handleInformationEvent({
      session_id: sessionId,
      session_type: sessionType,
      host_mode: hostMode,
      origin: "system",
      bytes,
      alignment,
      complexity_score: stats.entropy,
      timestamp,
      metadata: {
        kind: "sunpy_coherence_bin",
        bin_start: new Date(bin.startMs).toISOString(),
        bin_end: new Date(bin.endMs).toISOString(),
        phase_rad: bin.phaseRad,
        frame_count: bin.frames.length,
        event_count: bin.events.length,
        event_mass: stats.eventMass,
        cadence_s: cadenceS,
        instrument: payload.instrument,
        wavelength_A: payload.wavelength_A,
        turbulence_index: externalSignals.turbulence,
        flare_flux_wm2: externalSignals.flareFlux,
        sharp_mean_abs_flux: externalSignals.sharpFlux,
        goes_xrs_long_wm2: externalSignals.goesFlux,
      },
    });

    binSummaries.push({
      startIso: new Date(bin.startMs).toISOString(),
      endIso: new Date(bin.endMs).toISOString(),
      phaseRad: bin.phaseRad,
      frameCount: bin.frames.length,
      eventCount: bin.events.length,
      alignment,
      entropy: stats.entropy,
      energy: stats.energy,
      dispersion: stats.dispersion,
      turbulence: externalSignals.turbulence,
      flareFlux: externalSignals.flareFlux,
      flareFluxNorm: externalSignals.flareFluxNorm,
      sharpFlux: externalSignals.sharpFlux ?? undefined,
      goesFlux: externalSignals.goesFlux,
    });
  }

  return {
    t0Iso: new Date(t0Ms).toISOString(),
    binCount: bins.length,
    frameCount: totalFrames,
    eventCount: totalEvents,
    bins: binSummaries,
  };
}
