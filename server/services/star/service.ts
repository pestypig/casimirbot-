import {
  InformationEvent,
  TelemetrySnapshot,
  CollapseDecision,
  type TInformationEvent,
  type TTelemetrySnapshot,
  type TCollapseDecision,
} from "../../../shared/star-telemetry";
import {
  EQUILIBRIUM_DISPERSION_MAX,
  EQUILIBRIUM_HOLD_MS,
  EQUILIBRIUM_R_STAR,
} from "../../../shared/neuro-config";
import { buildInformationBoundary } from "../../utils/information-boundary";

type PhaseState = {
  micro: number;
  meso: number;
  macro: number;
};

type StarState = {
  snapshot: TTelemetrySnapshot;
  lastUpdated: number;
  phase: PhaseState;
  recentMasses: number[];
  recentDrivers: number[];
  prethermalLoad: number;
  equilibriumHoldMs: number;
  rng: () => number;
};

type HostContext = {
  host_id?: string;
  host_mass_norm?: number;
  host_radius_norm?: number;
  host_mode?: string;
};

export type SolarHekEventInput = {
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
  goes_class?: string;
  noaa_ar?: number;
  ch_area?: number;
  peak_flux?: number;
  grid_i?: number;
  grid_j?: number;
  grid_n?: number;
  grid_rsun_arcsec?: number;
};

const defaultHostContext: Required<Pick<HostContext, "host_mass_norm" | "host_radius_norm" | "host_mode">> = {
  host_mass_norm: 1,
  host_radius_norm: 1,
  host_mode: "brain_like",
};

// Simple quiet-Sun baselines (tune with empirical runs).
const QUIET_SIGMA_PHI_MED = 0.15;
const QUIET_SIGMA_PHI_P90 = 0.35;
const FALLBACK_P_MODE_P90 = 0.3;
const DRIVER_HISTORY_MIN = 8; // bins of history required before trusting dispersion/p-mode gauges

// Reference collapse timescale (ms) for dpEnergyNorm = 1.
const TAU_REF_MS = 50;
const GAMMA_SYNC_Z_FLOOR = 1;
const GAMMA_RESONANCE_WEIGHT = 0.5;
const GAMMA_DISPERSION_WEIGHT = 0.35;
const GAMMA_PRESSURE_WEIGHT = 0.08;
const GAMMA_ARTIFACT_PASS_MIN = 0.5;

type HostEigenmode = { freq_hz: number; q: number; weight: number };

const HOST_EIGENMODES: Record<string, HostEigenmode[]> = {
  sun_like: [
    { freq_hz: 1 / 300, q: 50, weight: 1 }, // pin macro to 5-minute mode
    { freq_hz: 6e-3, q: 30, weight: 0.6 },
    { freq_hz: 1e-2, q: 20, weight: 0.4 },
  ],
  brain_like: [
    { freq_hz: 4, q: 5, weight: 0.7 },
    { freq_hz: 40, q: 10, weight: 1 },
    { freq_hz: 10, q: 6, weight: 0.5 },
  ],
  lab: [
    { freq_hz: 1, q: 20, weight: 0.6 },
    { freq_hz: 20, q: 12, weight: 0.8 },
  ],
  other: [{ freq_hz: 0.5, q: 10, weight: 0.5 }],
};

type BandFrequencies = { micro: number; meso: number; macro: number };

const BAND_PRESETS: Record<string, BandFrequencies> = {
  sun_like: { micro: 5e6, meso: 5e3, macro: 1 / 300 }, // exact 5-minute macro mode
  brain_like: { micro: 8e6, meso: 4e4, macro: 10 },
  lab: { micro: 2e6, meso: 2e3, macro: 2 },
  other: { micro: 1e6, meso: 1e3, macro: 1 },
};

const sessions = new Map<string, StarState>();
const hostConfigBySession = new Map<string, HostContext>();
const hostEigenmodesByHost = new Map<string, HostEigenmode[]>();

const normalizeSessionType = (value?: string): string => {
  const trimmed = (value ?? "").trim();
  return trimmed || "debate";
};

const sessionKey = (sessionId: string, sessionType?: string): string => {
  const normalizedId = sessionId.trim();
  const normalizedType = normalizeSessionType(sessionType);
  return `${normalizedType}::${normalizedId}`;
};

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const normalizeGammaSyncZ = (gammaSyncZ: number): number =>
  clamp(
    (gammaSyncZ - GAMMA_SYNC_Z_FLOOR) /
      Math.max(1, EQUILIBRIUM_R_STAR - GAMMA_SYNC_Z_FLOOR),
    0,
    1,
  );

const hashStringToSeed = (input: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number): (() => number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const makeGaussian = (seed: number): (() => number) => {
  const uniform = mulberry32(seed);
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const val = spare;
      spare = null;
      return val;
    }
    const u = Math.max(1e-12, uniform());
    const v = Math.max(1e-12, uniform());
    const mag = Math.sqrt(-2 * Math.log(u));
    const z0 = mag * Math.cos(2 * Math.PI * v);
    const z1 = mag * Math.sin(2 * Math.PI * v);
    spare = z1;
    return z0;
  };
};

const gaussianForSession = (key: string): (() => number) => makeGaussian(hashStringToSeed(key));

const sdeStep = (xPrev: number, dtMs: number, drift: number, diffusion: number, rng: () => number): number => {
  const dt = Math.max(0, dtMs) / 1000;
  if (!Number.isFinite(xPrev)) return 0;
  if (dt === 0) return xPrev;
  return xPrev + drift * dt + diffusion * Math.sqrt(dt) * rng();
};

const computeMedian = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const computePercentile = (values: number[], p: number): number => {
  const finite = values.filter((v) => Number.isFinite(v));
  if (!finite.length) return 0;
  const sorted = [...finite].sort((a, b) => a - b);
  const idx = clamp(Math.floor(p * sorted.length), 0, sorted.length - 1);
  return sorted[idx];
};

const computeStd = (values: number[]): number => {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length < 2) return 0;
  const mean = finite.reduce((acc, v) => acc + v, 0) / finite.length;
  const variance = finite.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / finite.length;
  return Math.sqrt(Math.max(variance, 0));
};

const estimatePowerLawSlope = (values: number[]): number => {
  const positive = values.filter((v) => Number.isFinite(v) && v > 0);
  if (positive.length < 2) return 0;
  const sorted = [...positive].sort((a, b) => b - a);
  const logX = sorted.map((v) => Math.log(v));
  const logRank = sorted.map((_, idx) => Math.log(idx + 1));
  const meanX = logX.reduce((acc, v) => acc + v, 0) / logX.length;
  const meanY = logRank.reduce((acc, v) => acc + v, 0) / logRank.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < logX.length; i += 1) {
    num += (logX[i] - meanX) * (logRank[i] - meanY);
    den += (logX[i] - meanX) * (logX[i] - meanX);
  }
  if (den === 0) return 0;
  return num / den;
};

const classifySearchRegime = (coherence: number, dispersion: number): "ballistic" | "diffusive" | "mixed" => {
  if (coherence > 0.6 && dispersion < 0.4) return "ballistic";
  if (coherence < 0.4 && dispersion > 0.6) return "diffusive";
  return "mixed";
};

const resolveGammaSyncZ = (event: TInformationEvent): number | undefined => {
  const direct = event.gamma_sync_z;
  if (typeof direct === "number" && Number.isFinite(direct)) return direct;
  const meta = event.metadata as Record<string, unknown> | undefined;
  const metaValue = meta?.gamma_sync_z;
  if (typeof metaValue === "number" && Number.isFinite(metaValue)) {
    return metaValue;
  }
  return undefined;
};

const resolvePhaseDispersion = (
  event: TInformationEvent,
): number | undefined => {
  const direct = event.phase_dispersion;
  if (typeof direct === "number" && Number.isFinite(direct)) return direct;
  const meta = event.metadata as Record<string, unknown> | undefined;
  const metaValue = meta?.phase_dispersion;
  if (typeof metaValue === "number" && Number.isFinite(metaValue)) {
    return metaValue;
  }
  return undefined;
};

const resolveArtifactFlags = (
  event: TInformationEvent,
): Record<string, number> | undefined => {
  const direct = event.artifact_flags;
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    return direct as Record<string, number>;
  }
  const meta = event.metadata as Record<string, unknown> | undefined;
  const metaFlags = meta?.artifact_flags;
  if (metaFlags && typeof metaFlags === "object" && !Array.isArray(metaFlags)) {
    return metaFlags as Record<string, number>;
  }
  return undefined;
};

const resolveGammaArtifactPass = (
  flags?: Record<string, number>,
): boolean => {
  const value = flags?.gamma_artifact_pass;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value >= GAMMA_ARTIFACT_PASS_MIN;
  }
  return true;
};

const resolveBandFrequencies = (hostMode?: string): BandFrequencies => {
  const modeKey = (hostMode ?? defaultHostContext.host_mode) as keyof typeof BAND_PRESETS;
  return BAND_PRESETS[modeKey] ?? BAND_PRESETS.other;
};

const getHostEigenmodes = (host: HostContext): HostEigenmode[] => {
  const hostId = host.host_id ?? host.host_mode ?? defaultHostContext.host_mode;
  const cached = hostEigenmodesByHost.get(hostId);
  if (cached) return cached;
  const modes = HOST_EIGENMODES[host.host_mode ?? defaultHostContext.host_mode] ?? [];
  hostEigenmodesByHost.set(hostId, modes);
  return modes;
};

const computeResonanceScore = (host: HostContext, nowMs: number): number => {
  const modes = getHostEigenmodes(host);
  if (!modes.length) return 0.5;
  const phaseSum = modes.reduce((acc, m) => {
    const phase = 2 * Math.PI * m.freq_hz * (nowMs / 1000);
    return acc + m.weight * Math.cos(phase);
  }, 0);
  const resonance = phaseSum / Math.max(modes.length, 1);
  return clamp(0.5 * (resonance + 1), 0, 1);
};

const ensureSnapshot = (sessionId: string, sessionType?: string): StarState => {
  const key = sessionKey(sessionId, sessionType);
  const existing = sessions.get(key) ?? sessions.get(sessionId); // tolerate legacy keys
  const ensureStateShape = (state: StarState): StarState => {
    const bands = resolveBandFrequencies(state.snapshot.host_mode);
    const ropeBeatHz = Math.abs(bands.meso - bands.macro);
    const parsedSnapshot = TelemetrySnapshot.parse({
      ...state.snapshot,
      session_type: normalizeSessionType(state.snapshot.session_type ?? sessionType),
      host_mass_norm: state.snapshot.host_mass_norm ?? defaultHostContext.host_mass_norm,
      host_radius_norm: state.snapshot.host_radius_norm ?? defaultHostContext.host_radius_norm,
      host_mode: state.snapshot.host_mode ?? defaultHostContext.host_mode,
      bands: state.snapshot.bands ?? {
        micro_freq_hz: bands.micro,
        meso_freq_hz: bands.meso,
        macro_freq_hz: bands.macro,
        rope_beat_hz: ropeBeatHz,
      },
    });
    return {
      snapshot: parsedSnapshot,
      lastUpdated: state.lastUpdated,
      phase: state.phase ?? { micro: 0, meso: 0, macro: 0 },
      recentMasses: state.recentMasses ?? [],
      recentDrivers: state.recentDrivers ?? [],
      prethermalLoad: state.prethermalLoad ?? 0,
      equilibriumHoldMs: state.equilibriumHoldMs ?? state.snapshot.equilibrium_hold_ms ?? 0,
      rng: state.rng ?? gaussianForSession(key),
    };
  };

  if (existing) {
    const normalized = ensureStateShape(existing);
    sessions.set(key, normalized);
    return normalized;
  }

  const now = Date.now();
  const bands = resolveBandFrequencies(defaultHostContext.host_mode);
  const base: TTelemetrySnapshot = TelemetrySnapshot.parse({
    session_id: sessionId,
    session_type: normalizeSessionType(sessionType),
    host_mass_norm: defaultHostContext.host_mass_norm,
    host_radius_norm: defaultHostContext.host_radius_norm,
    host_mode: defaultHostContext.host_mode,
    bands: {
      micro_freq_hz: bands.micro,
      meso_freq_hz: bands.meso,
      macro_freq_hz: bands.macro,
      rope_beat_hz: Math.abs(bands.meso - bands.macro),
    },
    global_coherence: 0.5,
    levels: {},
    collapse_pressure: 0.2,
    phase_dispersion: 0.4,
    energy_budget: 0,
    equilibrium: false,
    equilibrium_hold_ms: 0,
    equilibrium_r_star: EQUILIBRIUM_R_STAR,
    equilibrium_dispersion_max: EQUILIBRIUM_DISPERSION_MAX,
    equilibrium_hold_ms_threshold: EQUILIBRIUM_HOLD_MS,
    updated_at: now,
  });
  const state: StarState = {
    snapshot: base,
    lastUpdated: now,
    phase: { micro: 0, meso: 0, macro: 0 },
    recentMasses: [],
    recentDrivers: [],
    prethermalLoad: 0,
    equilibriumHoldMs: 0,
    rng: gaussianForSession(key),
  };
  sessions.set(key, state);
  return state;
};

export function handleInformationEvent(eventInput: unknown): TTelemetrySnapshot {
  const raw = eventInput as { session_type?: unknown; metadata?: { session_type?: unknown } } | null;
  const rawSessionType = typeof raw?.session_type === "string" ? raw.session_type : undefined;
  const metadataSessionType =
    raw && raw.metadata && typeof raw.metadata.session_type === "string" ? raw.metadata.session_type : undefined;
  const event = InformationEvent.parse(eventInput);
  const sessionType = rawSessionType ?? metadataSessionType ?? event.session_type;
  const key = sessionKey(event.session_id, sessionType);
  const state = ensureSnapshot(event.session_id, sessionType);
  const now = event.timestamp ?? Date.now();
  const dt = Math.max(0, now - state.lastUpdated);
  const dtSec = dt / 1000;
  const mass = Math.max(0, event.bytes || 0);
  const complexity = clamp(event.complexity_score ?? 0.5, 0, 1);
  const alignment = clamp(event.alignment ?? 0, -1, 1);
  const phase_5min = Number.isFinite(event.phase_5min ?? NaN) ? event.phase_5min : undefined;
  const driver = clamp(
    phase_5min !== undefined ? Math.cos(phase_5min) * Math.abs(alignment) : alignment,
    -1,
    1,
  );

  const prevCoherence = state.snapshot.global_coherence ?? 0.5;
  const prevDispersion = state.snapshot.phase_dispersion ?? 0.4;
  const prevEnergy = state.snapshot.energy_budget ?? 0;

  // Keep a short rolling window of drivers for dispersion and normalization.
  const recentDrivers = state.recentDrivers ?? [];
  recentDrivers.push(driver);
  if (recentDrivers.length > 24) recentDrivers.shift();
  state.recentDrivers = recentDrivers;
  const historyLen = recentDrivers.length;
  const historyReady = historyLen >= DRIVER_HISTORY_MIN;

  const sigma_phi_raw = computeStd(recentDrivers);
  const sigma_phi_med = QUIET_SIGMA_PHI_MED;
  const sigma_phi_p90 = Math.max(QUIET_SIGMA_PHI_P90, sigma_phi_med + 1e-3);
  const disp_norm_raw = clamp((sigma_phi_raw - sigma_phi_med) / (sigma_phi_p90 - sigma_phi_med), 0, 1);
  const absDrivers = recentDrivers.map((d) => Math.abs(d));
  const driver_p90 = Math.max(computePercentile(absDrivers, 0.9), FALLBACK_P_MODE_P90);
  const p_mode_ready = historyReady;
  const p_mode_power_norm_raw = clamp(Math.abs(driver) / driver_p90, 0, 1);
  const observedDispersion = resolvePhaseDispersion(event);
  const dispersion_ready = historyReady || observedDispersion !== undefined;

  const hostFromEvent: HostContext = {
    host_id: event.host_id,
    host_mass_norm: event.host_mass_norm,
    host_radius_norm: event.host_radius_norm,
    host_mode: event.host_mode,
  };

  const cachedHost = hostConfigBySession.get(key) ?? {};
  const resolvedHost: HostContext = {
    host_id: hostFromEvent.host_id ?? state.snapshot.host_id ?? cachedHost.host_id,
    host_mass_norm:
      hostFromEvent.host_mass_norm ??
      state.snapshot.host_mass_norm ??
      cachedHost.host_mass_norm ??
      defaultHostContext.host_mass_norm,
    host_radius_norm:
      hostFromEvent.host_radius_norm ??
      state.snapshot.host_radius_norm ??
      cachedHost.host_radius_norm ??
      defaultHostContext.host_radius_norm,
    host_mode:
      hostFromEvent.host_mode ??
      state.snapshot.host_mode ??
      cachedHost.host_mode ??
      defaultHostContext.host_mode,
  };
  hostConfigBySession.set(key, resolvedHost);

  const rng = state.rng ?? gaussianForSession(key);
  state.rng = rng;

  // Stochastic Ito-style updates (Euler-Maruyama)
  const coherenceDrift = (0.5 - prevCoherence) / 15;
  const coherenceDiff = 0.05 + 0.1 * complexity;
  let coherence = clamp(sdeStep(prevCoherence, dt, coherenceDrift, coherenceDiff, rng), 0, 1);
  const coherenceBoost = clamp(Math.log1p(mass) / 12, 0, 0.25) * (driver >= 0 ? 1 : 0.5) * complexity;
  coherence = clamp(coherence + coherenceBoost, 0, 1);

  const dispersionDrift = (0.4 - prevDispersion) / 12 + (driver < 0 ? 0.05 : -0.02);
  const dispersionDiff = 0.04 + 0.08 * (1 - Math.abs(driver));

  const energyDrift = -prevEnergy / 20 + Math.log1p(mass) / 12;
  const energyDiff = 0.03 + 0.05 * complexity;
  const energy = clamp(sdeStep(prevEnergy, dt, energyDrift, energyDiff, rng), 0, 1);

  // Normalize coherence and dispersion against the rolling driver stats.
  const dispersionModel = clamp(sdeStep(prevDispersion, dt, dispersionDrift, dispersionDiff, rng), 0, 1);
  const dispersion_for_dynamics =
    observedDispersion !== undefined
      ? clamp(observedDispersion, 0, 1)
      : dispersion_ready
        ? disp_norm_raw
        : dispersionModel;
  const artifactFlags = resolveArtifactFlags(event);
  const gammaArtifactPass = resolveGammaArtifactPass(artifactFlags);
  const gammaSyncZ = resolveGammaSyncZ(event);
  const gammaSyncNorm =
    gammaArtifactPass && gammaSyncZ !== undefined
      ? normalizeGammaSyncZ(gammaSyncZ)
      : undefined;
  let dispersion = clamp(dispersion_for_dynamics, 0, 1);
  if (gammaSyncNorm !== undefined) {
    dispersion = clamp(
      dispersion * (1 - GAMMA_DISPERSION_WEIGHT) +
        (1 - gammaSyncNorm) * GAMMA_DISPERSION_WEIGHT,
      0,
      1,
    );
  }
  const coherence_effective = clamp(coherence * (1 - dispersion), 0, 1);
  const equilibriumCandidate =
    dispersion_ready &&
    gammaArtifactPass &&
    gammaSyncZ !== undefined &&
    gammaSyncZ >= EQUILIBRIUM_R_STAR &&
    dispersion <= EQUILIBRIUM_DISPERSION_MAX;
  const equilibriumHoldMs = equilibriumCandidate
    ? Math.max(0, state.equilibriumHoldMs + dt)
    : 0;
  const equilibrium =
    equilibriumCandidate && equilibriumHoldMs >= EQUILIBRIUM_HOLD_MS;
  state.equilibriumHoldMs = equilibriumHoldMs;

  // Multi-scale bands and phase cascade
  const bands = resolveBandFrequencies(resolvedHost.host_mode);
  const ropeBeatHz = Math.abs(bands.meso - bands.macro);
  state.phase.micro += dtSec * bands.micro * 2 * Math.PI;
  state.phase.meso += dtSec * bands.meso * 2 * Math.PI;
  state.phase.macro += dtSec * bands.macro * 2 * Math.PI;

  const edge_of_chaos = clamp(1 - Math.abs(complexity - 0.5) / 0.5, 0, 1);
  const basePressure = clamp(
    0.4 * coherence_effective + 0.4 * energy + 0.2 * (complexity + (driver > 0 ? 0.1 : 0)),
    0,
    1,
  );

  const baseResonanceScore = computeResonanceScore(resolvedHost, now);
  const resonance_score =
    gammaSyncNorm !== undefined
      ? clamp(
          baseResonanceScore * (1 - GAMMA_RESONANCE_WEIGHT) +
            gammaSyncNorm * GAMMA_RESONANCE_WEIGHT,
          0,
          1,
        )
      : baseResonanceScore;
  const off_resonant = 1 - Math.abs(driver);
  const collapse_gain = clamp(off_resonant * edge_of_chaos, 0, 1);
  const gammaPressureBoost =
    gammaSyncNorm !== undefined ? GAMMA_PRESSURE_WEIGHT * gammaSyncNorm : 0;
  const pressure = clamp(
    basePressure + 0.15 * collapse_gain + 0.1 * resonance_score + gammaPressureBoost,
    0,
    1,
  );

  const levels = {
    micro: clamp(coherence_effective + 0.05 * complexity * Math.cos(state.phase.micro), 0, 1),
    meso: clamp(coherence_effective + 0.02 * driver * Math.cos(state.phase.meso), 0, 1),
    macro: clamp(coherence_effective - 0.03 * dispersion * Math.cos(state.phase.macro), 0, 1),
    rope: clamp((coherence_effective + pressure) / 2, 0, 1),
  };

  // Multi-fractal granulation proxy
  const recentMasses = state.recentMasses ?? [];
  recentMasses.push(mass);
  if (recentMasses.length > 512) recentMasses.shift();
  state.recentMasses = recentMasses;
  const median = computeMedian(recentMasses);
  const small = recentMasses.filter((m) => m <= median);
  const large = recentMasses.filter((m) => m > median);
  const slopeSmall = estimatePowerLawSlope(small);
  const slopeLarge = estimatePowerLawSlope(large);
  const multi_fractal_index = clamp((Math.abs(slopeSmall) - Math.abs(slopeLarge)) / 4, 0, 1);

  const flare_score = clamp((energy - 0.7) * 1.2 + (dispersion - 0.5) * 0.8, 0, 1);
  const search_regime = classifySearchRegime(coherence_effective, dispersion);

  const pump = Math.max(0, energy - 0.7) * Math.max(0, driver);
  state.prethermalLoad = clamp(state.prethermalLoad * Math.exp(-dt / 5000) + pump, 0, 1);
  const singularity_score = clamp(
    0.5 * state.prethermalLoad + 0.5 * Math.max(0, dispersion - 0.6),
    0,
    1,
  );

  const hostMass = resolvedHost.host_mass_norm ?? defaultHostContext.host_mass_norm;
  const dpEnergyNorm = clamp(hostMass * (0.5 * coherence_effective + 0.3 * energy - 0.2 * dispersion), 0, 1);
  const dpTauEstimateMs = TAU_REF_MS / Math.max(dpEnergyNorm, 1e-3);

  let recommended_action: TTelemetrySnapshot["recommended_action"] =
    pressure > 0.72
      ? "collapse"
      : coherence_effective < 0.35 && dispersion > 0.55
        ? "ask_clarification"
        : energy > 0.85
          ? "branch"
          : "explore_more";

  if (flare_score > 0.6 && coherence_effective < 0.8) {
    recommended_action = "branch";
  }
  if (singularity_score > 0.7 && coherence_effective < 0.5) {
    recommended_action = "ask_clarification";
  }

  const next: TTelemetrySnapshot = {
    session_id: event.session_id,
    session_type: normalizeSessionType(sessionType),
    host_id: resolvedHost.host_id,
    host_mass_norm: resolvedHost.host_mass_norm,
    host_radius_norm: resolvedHost.host_radius_norm,
    host_mode: resolvedHost.host_mode,
    bands: {
      micro_freq_hz: bands.micro,
      meso_freq_hz: bands.meso,
      macro_freq_hz: bands.macro,
      rope_beat_hz: ropeBeatHz,
    },
    global_coherence: coherence_effective,
    levels,
    phase_dispersion: dispersion,
    gamma_sync_z: gammaSyncZ,
    artifact_flags: artifactFlags,
    equilibrium,
    equilibrium_hold_ms: equilibriumHoldMs,
    equilibrium_r_star: EQUILIBRIUM_R_STAR,
    equilibrium_dispersion_max: EQUILIBRIUM_DISPERSION_MAX,
    equilibrium_hold_ms_threshold: EQUILIBRIUM_HOLD_MS,
    collapse_pressure: pressure,
    multi_fractal_index,
    resonance_score,
    flare_score,
    search_regime,
    singularity_score,
    phase_5min,
    p_mode_driver: p_mode_ready ? p_mode_power_norm_raw : undefined,
    driver_history_len: historyLen,
    driver_history_required: DRIVER_HISTORY_MIN,
    phase_dispersion_ready: dispersion_ready,
    p_mode_ready,
    dp_energy_norm: dpEnergyNorm,
    dp_tau_estimate_ms: dpTauEstimateMs,
    energy_budget: energy,
    recommended_action,
    notes: event.metadata?.goal ? `tracking goal: ${String(event.metadata.goal).slice(0, 80)}` : undefined,
    updated_at: now,
  };

  state.snapshot = TelemetrySnapshot.parse(next);
  state.lastUpdated = now;
  sessions.set(key, state);
  return state.snapshot;
}

const parseGoesScale = (goes: string | undefined): number => {
  if (!goes) return 1;
  const trimmed = goes.trim().toUpperCase();
  const match = trimmed.match(/^([A-Z])\s*([0-9.]+)?/);
  if (!match) return 1;
  const letter = match[1];
  const value = Number.parseFloat(match[2] ?? "1");
  const letterScale: Record<string, number> = {
    A: 0.01,
    B: 0.1,
    C: 1,
    M: 10,
    X: 100,
  };
  const scale = letterScale[letter] ?? 1;
  return Math.max(0.1, value * scale);
};

export function emitSolarHekEvents(
  events: Array<SolarHekEventInput | undefined>,
  context?: { sessionId?: string; sessionType?: string; hostMode?: string },
): void {
  const sessionId = context?.sessionId ?? "solar-hek";
  const sessionType = context?.sessionType ?? "solar";
  const hostMode = context?.hostMode ?? "sun_like";
  if (!Array.isArray(events) || !events.length) return;

  const typeWeights: Record<string, number> = {
    FL: 6000,
    AR: 3800,
    CH: 2600,
    CE: 4200,
    EF: 2400,
    CJ: 1800,
    FI: 2000,
    FE: 2000,
  };

  for (const ev of events) {
    if (!ev) continue;
    const typeKey = (ev.event_type ?? "").toUpperCase();
    if (!typeKey) continue;
    const baseMass = typeWeights[typeKey] ?? 1200;
    const goesScale = typeKey === "FL" ? parseGoesScale(ev.goes_class) : 1;
    const chScale = typeKey === "CH" && Number.isFinite(ev.ch_area) ? Math.log1p(ev.ch_area as number) / 20 : 1;
    const rhoPenalty = Number.isFinite(ev.rho) ? Math.max(0.6, 1.05 - Math.min(1, Math.abs(ev.rho as number))) : 1;
    const peakFlux = Number.isFinite(ev.peak_flux) ? Math.max(ev.peak_flux as number, 0) : null;
    const fluxGain = peakFlux && peakFlux > 0 ? Math.max(0, Math.log10(Math.max(peakFlux, 1e-8) / 1e-7)) : 0;
    const mass = Math.max(400, baseMass * goesScale * chScale * rhoPenalty * (1 + fluxGain));
    const alignment =
      typeKey === "CH" ? 0.35 : typeKey === "AR" ? 0.55 : typeKey === "FL" ? 0.7 : typeKey === "CE" ? 0.6 : 0.5;
    const complexity = clamp(0.3 + 0.15 * Math.log10(Math.max(1, mass)), 0.3, 0.85);
    const ts =
      Date.parse(ev.start_time ?? ev.start ?? "") ||
      Date.parse(ev.end_time ?? ev.end ?? "") ||
      Date.now();
    const dataCutoffIso = new Date(ts).toISOString();
    const informationBoundary = buildInformationBoundary({
      data_cutoff_iso: dataCutoffIso,
      mode: "labels",
      labels_used_as_features: true,
      event_features_included: true,
      inputs: {
        kind: "solar_hek_event",
        v: 1,
        event_type: typeKey,
        start_time: ev.start_time ?? ev.start ?? null,
        end_time: ev.end_time ?? ev.end ?? null,
        goes_class: ev.goes_class ?? null,
        peak_flux: peakFlux ?? null,
        noaa_ar: Number.isFinite(ev.noaa_ar ?? NaN) ? (ev.noaa_ar as number) : null,
        ch_area: Number.isFinite(ev.ch_area ?? NaN) ? (ev.ch_area as number) : null,
        u: Number.isFinite(ev.u ?? NaN) ? (ev.u as number) : null,
        v_coord: Number.isFinite(ev.v ?? NaN) ? (ev.v as number) : null,
        rho: Number.isFinite(ev.rho ?? NaN) ? (ev.rho as number) : null,
        grid_i: Number.isFinite(ev.grid_i ?? NaN) ? (ev.grid_i as number) : null,
        grid_j: Number.isFinite(ev.grid_j ?? NaN) ? (ev.grid_j as number) : null,
        grid_n: Number.isFinite(ev.grid_n ?? NaN) ? (ev.grid_n as number) : null,
        grid_rsun_arcsec: Number.isFinite(ev.grid_rsun_arcsec ?? NaN) ? (ev.grid_rsun_arcsec as number) : null,
        id: ev.id ?? ev.ivorn ?? null,
      },
    });

    handleInformationEvent({
      session_id: sessionId,
      session_type: sessionType,
      host_mode: hostMode,
      origin: "system",
      bytes: Math.round(mass),
      alignment,
      complexity_score: complexity,
      timestamp: ts,
      metadata: {
        kind: "solar_hek_event",
        schema_version: informationBoundary.schema_version,
        data_cutoff_iso: informationBoundary.data_cutoff_iso,
        data_cutoff: informationBoundary.data_cutoff_iso,
        inputs_hash: informationBoundary.inputs_hash,
        features_hash: informationBoundary.features_hash,
        mode: informationBoundary.mode,
        labels_used_as_features: informationBoundary.labels_used_as_features,
        event_features_included: informationBoundary.event_features_included,
        information_boundary: informationBoundary,
        event_type: typeKey,
        goes_class: ev.goes_class,
        peak_flux: peakFlux ?? undefined,
        noaa_ar: ev.noaa_ar,
        ch_area: ev.ch_area,
        u: ev.u,
        v: ev.v,
        rho: ev.rho,
        grid_i: ev.grid_i,
        grid_j: ev.grid_j,
        grid_n: ev.grid_n,
        grid_rsun_arcsec: ev.grid_rsun_arcsec,
        id: ev.id ?? ev.ivorn,
      },
    });
  }
}

export function getTelemetrySnapshot(sessionId: string, sessionType?: string): TTelemetrySnapshot {
  return ensureSnapshot(sessionId, sessionType).snapshot;
}

export function forceCollapse(payload: {
  session_id: string;
  session_type?: string;
  branch_id?: string;
  reason?: string;
}): TCollapseDecision {
  const session_id = (payload.session_id ?? "").trim();
  if (!session_id) {
    throw new Error("session_id is required for collapse.");
  }
  const session_type = normalizeSessionType(payload.session_type);
  const snapshot = getTelemetrySnapshot(session_id, session_type);
  const decision = {
    session_id,
    session_type,
    branch_id: payload.branch_id,
    reason: payload.reason ?? "manual_collapse",
    telemetry: snapshot,
  };
  return CollapseDecision.parse(decision);
}
