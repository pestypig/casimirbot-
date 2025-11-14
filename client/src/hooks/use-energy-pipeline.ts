// Hook for accessing the centralized HELIX-CORE energy pipeline
import { startTransition } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { publish, subscribe, unsubscribe } from "@/lib/luma-bus";
import { getModeWisdom } from "@/lib/luma-whispers-core";
import type {
  VacuumGapSweepRow,
  DynamicConfig,
  DynamicCasimirSweepConfig,
  SweepRuntime,
  SweepPointExtended,
  GateAnalytics,
  QiStats,
  PhaseScheduleTelemetry,
} from "@shared/schema";

/**
 * TheoryRefs:
 *  - ford-roman-qi-1995: FR duty clamp + scheduler spacing
 */

// Greens function types
export type GreensKind = "poisson" | "helmholtz";
export type GreensSource = "server" | "client" | "none";

export interface GreensPayload {
  kind: GreensKind;
  m: number;                 // mass parameter for Helmholtz (0 ⇒ Poisson limit)
  normalize: boolean;
  phi: Float32Array;         // normalized or raw potential samples (per-tile order)
  size: number;              // phi.length
  source: GreensSource;      // who computed it
}

export interface EnergyPipelineState {
  // Input parameters
  tileArea_cm2: number;
  shipRadius_m: number;
  gap_nm: number;
  sag_nm?: number;
  temperature_K: number;
  modulationFreq_GHz: number;
  
  /** Post-scale for translational bias (0..1). 1 = full translation. */
  beta_trans?: number;
  /** Optional target ground speed for Taxi mode, meters/second (default 1.4). */
  taxi_target_mps?: number;

  // Mode parameters
  currentMode: 'hover' | 'taxi' | 'nearzero' | 'cruise' | 'emergency' | 'standby';
  dutyCycle: number;
  sectorStrobing: number;
  qSpoilingFactor: number;
  
  // Additional mode knobs (explicit to drive FR duty & timing)
  localBurstFrac?: number;     // sector-local burst fraction (0..1); defaults to dutyCycle
  sectorsTotal?: number;       // total sectors in sweep
  sectorsConcurrent?: number;  // how many sectors fire simultaneously

  // Light-crossing & cycle timing (server may emit, else client derives)
  tau_LC_ms?: number;          // light-crossing time across hull/bubble (ms)
  sectorPeriod_ms?: number;    // dwell period per sector (ms)
  burst_ms?: number;           // instantaneous burst window (ms)
  dwell_ms?: number;           // gap between bursts (ms)
  
  // Scheduling truth
  sectorCount?: number;
  concurrentSectors?: number;
  tilesPerSector?: number;
  activeSectors?: number;
  activeTiles?: number;
  activeFraction?: number;
  S_live?: number;
  sectors?: number;
  tiles?: {
    active?: number;
    total?: number;
    tileArea_cm2?: number;
    hullArea_m2?: number;
    [key: string]: unknown;
  };
  currentSector?: number;
  __sectors?: unknown;
  __fr?: unknown;
  __mockData?: boolean;
  
  // FR duty direct
  dutyEffectiveFR?: number;
  dutyEffective_FR?: number;    // legacy alias
  dutyShip?: number;            // legacy alias
  dutyFR?: number;              // legacy alias
  dutyBurst?: number;           // legacy alias
  dutyUsed?: number;            // legacy alias
  dutyFR_slice?: number;        // legacy alias
  dutyFR_ship?: number;         // legacy alias
  dutyEff?: number;             // legacy alias
  dutyGate?: number;            // legacy alias
  deltaAOverA?: number;         // alias for qSpoilingFactor
  strobeHz?: number;
  phase01?: number;
  phaseSign?: number;
  phaseMode?: string;
  pumpPhase_deg?: number;
  phaseFreeze?: boolean;
  negativeFraction?: number;   // share of sectors assigned to negative lobe (0..1)

  // Physics parameters
  gammaGeo: number;
  qMechanical: number;
  qCavity: number;
  gammaVanDenBroeck: number;
  gammaVdB?: number;            // legacy alias
  gamma_vdb?: number;           // legacy alias
  exoticMassTarget_kg: number;
  geomCoupling?: number;        // χ coupling factor for parametric sweeps
  pumpEff?: number;             // η pump transduction efficiency (0..1)
  
  // Visual vs mass split (server emits both)
  gammaVanDenBroeck_vis?: number;
  gammaVanDenBroeck_mass?: number;
  gammaVdB_vis?: number;        // legacy alias
  sigma?: number;               // legacy alias
  q?: number;                   // legacy alias
  qSpoil?: number;              // legacy alias
  greens?: GreensPayload | null | Record<string, unknown>;
  lightCrossing?: unknown;
  lc?: unknown;
  natario?: unknown;
  warp?: unknown;
  stressEnergy?: unknown;
  P_avg_W?: number;             // alias for power in watts
  qi?: QiStats;
  qiBadge?: "ok" | "near" | "violation";
  phaseSchedule?: PhaseScheduleTelemetry;

  // Hull parameters for UI overlays
  hull?: {
    // Client-friendly axes (semi-major lengths of ellipsoid)
    a?: number;
    b?: number;
    c?: number;
    // Server canonical box dimensions
    Lx_m?: number;
    Ly_m?: number;
    Lz_m?: number;
    wallWidth_m?: number;
    wallThickness_m?: number;
  };
  bubble?: {
    R?: number;
    sigma?: number;
    beta?: number;
    dutyGate?: number;
  };
  R?: number;
  radius?: number;
  driveDir?: [number, number, number];
  bubbleStatus?: "NOMINAL" | "WARNING" | "CRITICAL";

  // Optional: targets if you want to show them
  P_target_W?: number;
  
  // Calculated values
  U_static: number;
  U_geo: number;
  U_Q: number;
  U_cycle: number;
  P_loss_raw: number;
  P_avg: number;
  M_exotic: number;
  M_exotic_raw: number;     // Raw physics exotic mass (before calibration)
  massCalibration: number;  // Mass calibration factor
  TS_ratio: number;
  TS_long?: number;
  TS_geom?: number;
  zeta: number;
  N_tiles: number;
  hullArea_m2?: number;
  
  // System status
  fordRomanCompliance: boolean;
  natarioConstraint: boolean;
  curvatureLimit: boolean;
  overallStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  modelMode?: 'calibrated' | 'raw';
  atmDensity_kg_m3?: number | null;
  altitude_m?: number | null;
  dynamicConfig?: DynamicConfig | null;
  vacuumGapSweepResults?: VacuumGapSweepRow[];
  vacuumGapSweepRowsTotal?: number;
  vacuumGapSweepRowsDropped?: number;
  sweep?: SweepRuntime | null;
  gateAnalytics?: GateAnalytics | null;
}

const MAX_SWEEP_ROWS = 2000;
const MAX_STREAM_SWEEP_ROWS = 5000;

const ACTIVE_SLEW_DEFAULT_MOD_DEPTH_CAP_PCT = 0.8;
const ACTIVE_SLEW_MIN_MOD_DEPTH_PCT = 0.005;
const ACTIVE_SLEW_ABSOLUTE_MIN_MOD_DEPTH_PCT = 0.001;
const ACTIVE_SLEW_TARGET_RHO = 0.85;
const ACTIVE_SLEW_MAX_GAIN_DB = 12;
const ACTIVE_SLEW_HARDWARE_GUARDS = {
  gapLimit: 6,
  modDepthLimit: 2,
  phaseLimit: 6,
  pumpLimit: 2,
  pumpFreqLimit_GHz: 120,
  delayMs: 8,
} as const;
const TWO_PHASE_DEFAULT_GAPS = [20, 100, 170, 250, 320, 400] as const;
const TWO_PHASE_DEFAULT_MOD_DEPTHS = [0.1, 0.5] as const;
const TWO_PHASE_DEFAULT_PHASES = [-10, -6, -2, 2, 6, 10] as const;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toNumberArray = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => Number(entry))
      .filter((num): num is number => Number.isFinite(num));
  }
  const num = Number(value);
  return Number.isFinite(num) ? [num] : [];
};

const pickNumber = (value: unknown): number | undefined => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const dedupeNumeric = (values: number[], digits: number): number[] => {
  if (!values.length) return [];
  const scale = 10 ** digits;
  const unique = new Set<number>();
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    const rounded = Math.round(value * scale) / scale;
    if (!Number.isFinite(rounded)) continue;
    unique.add(rounded);
  }
  return Array.from(unique).sort((a, b) => a - b);
};

type ActiveSlewGuardContext = {
  pipeline?: EnergyPipelineState;
  sweepResults: VacuumGapSweepRow[];
};

const guardActiveSlewPayload = (
  payload: Partial<DynamicConfig>,
  context: ActiveSlewGuardContext,
): Partial<DynamicConfig> => {
  if (!payload || typeof payload !== "object") return payload;
  const sweepPayload = payload.sweep;
  if (!sweepPayload || sweepPayload.activeSlew !== true) {
    return payload;
  }

  const pipeline = context.pipeline;
  const dynamicConfig = (pipeline as any)?.dynamicConfig as DynamicConfig | undefined;
  const runtimeSweep = pipeline?.sweep as SweepRuntime | undefined;

  const baseSweep: Partial<DynamicCasimirSweepConfig> = {
    ...(dynamicConfig?.sweep ?? {}),
    ...sweepPayload,
  };

  const twoPhaseRequested = baseSweep.twoPhase === true;
  const allowMeasurementSeed = !twoPhaseRequested || Boolean(runtimeSweep?.activeSlew);

  const lastRow =
    allowMeasurementSeed
      ? ((runtimeSweep?.last as VacuumGapSweepRow | undefined) ??
        (context.sweepResults.length
          ? (context.sweepResults[context.sweepResults.length - 1] as VacuumGapSweepRow)
          : undefined))
      : undefined;

  const measuredRho = allowMeasurementSeed ? pickNumber((lastRow as any)?.pumpRatio) : undefined;
  const measuredModDepthFrac = allowMeasurementSeed ? pickNumber((lastRow as any)?.m) : undefined;
  const measuredModDepthPct =
    typeof measuredModDepthFrac === "number" ? measuredModDepthFrac * 100 : undefined;
  const measuredKappaEffMHz = allowMeasurementSeed ? pickNumber((lastRow as any)?.kappaEff_MHz) : undefined;
  const measuredGapNm = allowMeasurementSeed ? pickNumber((lastRow as any)?.d_nm) : undefined;
  const measuredPhaseDeg = allowMeasurementSeed ? pickNumber((lastRow as any)?.phi_deg) : undefined;
  const measuredPumpGHz = allowMeasurementSeed ? pickNumber((lastRow as any)?.Omega_GHz) : undefined;

  const modDepthInputs = [
    ...toNumberArray(baseSweep.mod_depth_pct),
    ...toNumberArray(dynamicConfig?.mod_depth_pct),
    ...toNumberArray(payload.mod_depth_pct),
  ];
  if (typeof measuredModDepthPct === "number") {
    modDepthInputs.push(measuredModDepthPct);
  }
  if (!modDepthInputs.length) {
    modDepthInputs.push(ACTIVE_SLEW_DEFAULT_MOD_DEPTH_CAP_PCT);
  }

  let modDepthCap = ACTIVE_SLEW_DEFAULT_MOD_DEPTH_CAP_PCT;
  const maxSpecified = modDepthInputs.length ? Math.max(...modDepthInputs) : undefined;
  if (Number.isFinite(maxSpecified)) {
    modDepthCap = Math.min(modDepthCap, maxSpecified as number);
  }
  if (typeof measuredModDepthPct === "number" && measuredModDepthPct > 0) {
    modDepthCap = Math.min(modDepthCap, measuredModDepthPct);
  }

  if (
    typeof measuredRho === "number" &&
    measuredRho > 0 &&
    typeof measuredModDepthPct === "number" &&
    measuredModDepthPct > 0
  ) {
    if (measuredRho > ACTIVE_SLEW_TARGET_RHO) {
      const scaled = measuredModDepthPct * (ACTIVE_SLEW_TARGET_RHO / measuredRho);
      if (scaled > 0) {
        modDepthCap = Math.min(
          modDepthCap,
          Math.max(ACTIVE_SLEW_ABSOLUTE_MIN_MOD_DEPTH_PCT, scaled),
        );
      }
    }
  }

  if (typeof measuredKappaEffMHz === "number" && measuredKappaEffMHz <= 0) {
    modDepthCap = Math.min(modDepthCap, ACTIVE_SLEW_MIN_MOD_DEPTH_PCT);
  }

  modDepthCap = Math.max(ACTIVE_SLEW_ABSOLUTE_MIN_MOD_DEPTH_PCT, modDepthCap);
  const depthFloor = Math.max(
    ACTIVE_SLEW_ABSOLUTE_MIN_MOD_DEPTH_PCT,
    Math.min(ACTIVE_SLEW_MIN_MOD_DEPTH_PCT, modDepthCap),
  );

  const modDepthDigits = modDepthCap < 0.1 ? 4 : 3;
  let trimmedModDepths = dedupeNumeric(
    modDepthInputs.map((value) => clampNumber(value, depthFloor, modDepthCap)),
    modDepthDigits,
  );
  trimmedModDepths = dedupeNumeric(
    [...trimmedModDepths, modDepthCap],
    modDepthDigits,
  );

  const gapInputs = [
    ...toNumberArray(baseSweep.gaps_nm),
    ...toNumberArray(dynamicConfig?.gap_nm),
    ...toNumberArray(payload.gap_nm),
  ].filter((value) => value > 0);
  if (typeof measuredGapNm === "number" && measuredGapNm > 0) {
    gapInputs.push(measuredGapNm);
  }
  let safeGaps = dedupeNumeric(gapInputs, 2);
  if (!safeGaps.length && typeof measuredGapNm === "number" && measuredGapNm > 0) {
    safeGaps = [Number(measuredGapNm.toFixed(2))];
  }

  const phaseInputs = [
    ...toNumberArray(baseSweep.phase_deg),
    ...toNumberArray(dynamicConfig?.phase_deg),
    ...toNumberArray(payload.phase_deg),
  ];
  if (typeof measuredPhaseDeg === "number") {
    phaseInputs.push(measuredPhaseDeg);
  }
  const safePhaseList = dedupeNumeric(phaseInputs, 2);

  const pumpSources = [
    baseSweep.pump_freq_GHz,
    dynamicConfig?.pump_freq_GHz,
    payload.pump_freq_GHz,
    payload.sweep?.pump_freq_GHz,
  ];
  const pumpAuto = twoPhaseRequested || pumpSources.some((value) => value === "auto");
  const pumpInputs = twoPhaseRequested
    ? []
    : pumpSources
        .filter((value) => value !== "auto")
        .flatMap((value) => toNumberArray(value));
  if (!twoPhaseRequested && typeof measuredPumpGHz === "number" && measuredPumpGHz > 0) {
    pumpInputs.push(measuredPumpGHz);
  }
  const pumpDigits = 6;
  const pumpList = pumpAuto ? [] : dedupeNumeric(pumpInputs, pumpDigits);

  const guardHardwareLimit = (value: unknown, guard: number, available: number) => {
    const numeric = Number(value);
    const fallback = available > 0 ? available : guard;
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return Math.max(1, Math.min(guard, fallback));
    }
    return Math.max(1, Math.min(Math.floor(numeric), guard, fallback));
  };

  const guardPumpFreqLimit = (value: unknown, guard: number) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return guard;
    }
    return Math.max(0.01, Math.min(numeric, guard));
  };

  const baseHardwareProfile = {
    ...(dynamicConfig?.sweep?.hardwareProfile ?? {}),
    ...(baseSweep.hardwareProfile ?? {}),
  } as Record<string, unknown>;

  const gainCandidates = [
    ACTIVE_SLEW_MAX_GAIN_DB,
    Number(baseSweep.maxGain_dB),
    Number(dynamicConfig?.sweep?.maxGain_dB),
  ].filter((value) => Number.isFinite(value) && value > 0) as number[];
  const maxGainGuard =
    gainCandidates.length > 0
      ? Math.min(...gainCandidates, ACTIVE_SLEW_MAX_GAIN_DB)
      : ACTIVE_SLEW_MAX_GAIN_DB;

  let resolvedGaps: number[];
  if (twoPhaseRequested) {
    resolvedGaps = dedupeNumeric(Array.from(TWO_PHASE_DEFAULT_GAPS, (value) => Number(value)), 2);
  } else {
    resolvedGaps = safeGaps.length ? safeGaps : toNumberArray(baseSweep.gaps_nm);
    if (!resolvedGaps.length && typeof measuredGapNm === "number" && measuredGapNm > 0) {
      resolvedGaps = [Number(measuredGapNm.toFixed(2))];
    }
    if (!resolvedGaps.length) {
      resolvedGaps = [20];
    }
    resolvedGaps = dedupeNumeric(resolvedGaps, 2);
  }

  let resolvedModDepths: number[];
  if (twoPhaseRequested) {
    resolvedModDepths = dedupeNumeric(
      Array.from(TWO_PHASE_DEFAULT_MOD_DEPTHS, (value) =>
        Number(value.toFixed(modDepthDigits)),
      ),
      modDepthDigits,
    );
  } else {
    resolvedModDepths = trimmedModDepths.length
      ? trimmedModDepths
      : toNumberArray(baseSweep.mod_depth_pct);
    if (!resolvedModDepths.length) {
      resolvedModDepths = [Number(modDepthCap.toFixed(modDepthDigits))];
    }
    resolvedModDepths = dedupeNumeric(resolvedModDepths, modDepthDigits);
  }

  let resolvedPhases: number[];
  if (twoPhaseRequested) {
    resolvedPhases = dedupeNumeric(
      Array.from(TWO_PHASE_DEFAULT_PHASES, (value) => Number(value)),
      2,
    );
  } else {
    resolvedPhases = safePhaseList.length ? safePhaseList : toNumberArray(baseSweep.phase_deg);
    if (!resolvedPhases.length && typeof measuredPhaseDeg === "number") {
      resolvedPhases = [Number(measuredPhaseDeg.toFixed(1))];
    }
    if (!resolvedPhases.length) {
      resolvedPhases = [0];
    }
    resolvedPhases = dedupeNumeric(resolvedPhases, 2);
  }

  let resolvedPump: DynamicCasimirSweepConfig["pump_freq_GHz"];
  if (pumpAuto) {
    resolvedPump = "auto";
  } else {
    let pumpValues = pumpList.length ? pumpList : toNumberArray(baseSweep.pump_freq_GHz);
    if (!pumpValues.length && typeof measuredPumpGHz === "number" && measuredPumpGHz > 0) {
      pumpValues = [Number(measuredPumpGHz.toFixed(pumpDigits))];
    }
    pumpValues = dedupeNumeric(pumpValues, pumpDigits);
    resolvedPump = pumpValues.length ? pumpValues : "auto";
  }

  const pumpCountForHardware =
    resolvedPump === "auto"
      ? 1
      : Array.isArray(resolvedPump)
      ? resolvedPump.length
      : 1;

  const safeHardwareProfile = {
    gapLimit: guardHardwareLimit(
      baseHardwareProfile.gapLimit,
      ACTIVE_SLEW_HARDWARE_GUARDS.gapLimit,
      resolvedGaps.length,
    ),
    modDepthLimit: guardHardwareLimit(
      baseHardwareProfile.modDepthLimit,
      ACTIVE_SLEW_HARDWARE_GUARDS.modDepthLimit,
      resolvedModDepths.length,
    ),
    phaseLimit: guardHardwareLimit(
      baseHardwareProfile.phaseLimit,
      ACTIVE_SLEW_HARDWARE_GUARDS.phaseLimit,
      resolvedPhases.length,
    ),
    pumpLimit: guardHardwareLimit(
      baseHardwareProfile.pumpLimit,
      ACTIVE_SLEW_HARDWARE_GUARDS.pumpLimit,
      pumpCountForHardware,
    ),
    pumpFreqLimit_GHz: guardPumpFreqLimit(
      baseHardwareProfile.pumpFreqLimit_GHz,
      ACTIVE_SLEW_HARDWARE_GUARDS.pumpFreqLimit_GHz,
    ),
    delayMs: Math.max(
      Number.isFinite(Number(baseHardwareProfile.delayMs))
        ? Number(baseHardwareProfile.delayMs)
        : 0,
      ACTIVE_SLEW_HARDWARE_GUARDS.delayMs,
    ),
  };

  const sanitizedSweep = {
    ...baseSweep,
    activeSlew: true,
    hardwareProfile: safeHardwareProfile,
    maxGain_dB: maxGainGuard,
  } as DynamicCasimirSweepConfig;

  sanitizedSweep.twoPhase = twoPhaseRequested ? true : baseSweep.twoPhase;
  sanitizedSweep.gaps_nm = resolvedGaps;
  sanitizedSweep.mod_depth_pct = resolvedModDepths;
  sanitizedSweep.phase_deg = resolvedPhases;
  sanitizedSweep.pump_freq_GHz = resolvedPump;

  const nextPayload: Partial<DynamicConfig> = {
    ...payload,
    sweep: sanitizedSweep,
  };

  if (resolvedModDepths.length === 1) {
    nextPayload.mod_depth_pct = resolvedModDepths[0];
  } else if (resolvedModDepths.length > 1) {
    nextPayload.mod_depth_pct = resolvedModDepths;
  }

  if (resolvedGaps.length === 1) nextPayload.gap_nm = resolvedGaps[0];
  else if (resolvedGaps.length > 1) nextPayload.gap_nm = resolvedGaps;

  if (resolvedPhases.length === 1) nextPayload.phase_deg = resolvedPhases[0];
  else if (resolvedPhases.length > 1) nextPayload.phase_deg = resolvedPhases;

  if (resolvedPump === "auto") nextPayload.pump_freq_GHz = "auto";
  else if (resolvedPump.length === 1) nextPayload.pump_freq_GHz = resolvedPump[0];
  else if (resolvedPump.length > 1) nextPayload.pump_freq_GHz = resolvedPump;

  return nextPayload;
};

const SWEEP_RESULTS_QUERY_KEY = ["helix:sweep:results"] as const;

const adaptVacuumRowToExtended = (row: VacuumGapSweepRow): SweepPointExtended => {
  const modulationPct = Number.isFinite(row.m) ? row.m * 100 : row.m ?? 0;
  const pumpFreq = Number.isFinite(row.Omega_GHz) ? row.Omega_GHz : 0;
  const gLinear = Number.isFinite(row.G) ? 10 ** (row.G / 10) : undefined;
  const abortReason =
    row.abortReason ??
    (Array.isArray(row.notes) && row.notes.length ? row.notes.join("; ") : null);
  return {
    gap_nm: row.d_nm,
    pumpFreq_GHz: pumpFreq,
    modulationDepth_pct: modulationPct,
    pumpPhase_deg: row.phi_deg,
    kappa_Hz: row.kappa_Hz,
    kappaEff_Hz: row.kappaEff_Hz,
    kappa_MHz: row.kappa_MHz,
    kappaEff_MHz: row.kappaEff_MHz,
    detune_MHz: row.detune_MHz,
    pumpRatio: row.pumpRatio,
    G_dB: row.G,
    G_lin: gLinear,
    QL: row.QL,
    QL_base: row.QL_base,
    stable: row.stable,
    status: row.status,
    plateau: row.plateau ? true : row.crest ?? false,
    abortReason,
    ts: Date.now(),
  };
};

const appendStreamRow = (row: SweepPointExtended) => {
  const prev =
    (queryClient.getQueryData(SWEEP_RESULTS_QUERY_KEY) as SweepPointExtended[] | undefined) ?? [];
  const next = [...prev, row].slice(-MAX_STREAM_SWEEP_ROWS);
  queryClient.setQueryData(SWEEP_RESULTS_QUERY_KEY, next);
};

export function useSweepResults() {
  return useQuery<SweepPointExtended[]>({
    queryKey: SWEEP_RESULTS_QUERY_KEY,
    queryFn: async () =>
      (queryClient.getQueryData(SWEEP_RESULTS_QUERY_KEY) as SweepPointExtended[] | undefined) ?? [],
    initialData: () =>
      (queryClient.getQueryData(SWEEP_RESULTS_QUERY_KEY) as SweepPointExtended[] | undefined) ?? [],
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

type SweepResultsMeta = {
  total: number;
  dropped: number;
};

const EMPTY_SWEEP_META: SweepResultsMeta = { total: 0, dropped: 0 };

const trimSweepRows = (rows?: VacuumGapSweepRow[] | null): VacuumGapSweepRow[] => {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (rows.length <= MAX_SWEEP_ROWS) return rows;
  return rows.slice(-MAX_SWEEP_ROWS);
};

const deriveSweepMeta = (
  state: Pick<
    EnergyPipelineState,
    "vacuumGapSweepRowsTotal" | "vacuumGapSweepRowsDropped" | "vacuumGapSweepResults"
  > | undefined,
  visibleCount: number,
): SweepResultsMeta => {
  if (!state) {
    return visibleCount > 0 ? { total: visibleCount, dropped: 0 } : EMPTY_SWEEP_META;
  }
  const total =
    typeof state.vacuumGapSweepRowsTotal === "number"
      ? state.vacuumGapSweepRowsTotal
      : visibleCount;
  const dropped =
    typeof state.vacuumGapSweepRowsDropped === "number"
      ? Math.max(0, state.vacuumGapSweepRowsDropped)
      : Math.max(0, total - visibleCount);
  return { total, dropped };
};

// Server emits per-tile stress–energy samples for φ = G · ρ
export type TileDatum = {
  pos: [number, number, number];
  t00: number;
};

// Chat message interface for HELIX-CORE
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// System metrics interface (add tile arrays for φ compute back-compat)
export interface SystemMetrics {
  totalTiles: number;
  activeTiles: number;
  currentMode?: string;
  tileData?: TileDatum[]; // current server shape
  tiles?: TileDatum[];    // legacy shape
  // Optional LC/timing structure from backend metrics, if available
  lightCrossing?: {
    tauLC_ms?: number;        // preferred
    tau_ms?: number;          // alias
    tauLC_s?: number;         // alt units
    sectorPeriod_ms?: number; // dwell per sector
    burst_ms?: number;
    dwell_ms?: number;
    sectorsTotal?: number;
    activeSectors?: number;
  };
  env?: {
    atmDensity_kg_m3?: number | null;
    altitude_m?: number | null;
  };
}

// Helix metrics interface (some callers read directly from here)
export interface HelixMetrics {
  totalTiles: number;
  activeTiles: number;
  activeFraction?: number;
  data?: any;
  tileData?: TileDatum[];
  tiles?: TileDatum[];
  // lightCrossing may be a simple numeric or the structured SystemMetrics lighting object
  lightCrossing?: SystemMetrics['lightCrossing'] | number;
  env?: SystemMetrics['env'];
}

// Shared physics constants from pipeline backend
export const PIPE_CONST = {
  TOTAL_SECTORS: 400,
  BURST_DUTY_LOCAL: 0.01,  // 1% local burst window
  Q_BURST: 1e9
};

// Shared smart formatter (W→kW→MW) for UI labels
export const fmtPowerUnitFromW = (watts?: number) => {
  const x = Number(watts);
  if (!Number.isFinite(x)) return '—';
  if (x >= 1e6) return `${(x/1e6).toFixed(1)} MW`;
  if (x >= 1e3) return `${(x/1e3).toFixed(1)} kW`;
  return `${x.toFixed(1)} W`;
};

// Optional: inline compute helper (Poisson kernel) for emergency fallback
const poissonKernel = (r: number) => {
  const rr = Number.isFinite(r) && r > 0 ? r : 1e-6;
  return 1 / (4 * Math.PI * rr);
};

/**
 * Publish Greens payload to the canonical cache key and broadcast the window event.
 * Call this from the Energy Pipeline page after compute, or from a worker/other panel.
 */
export function publishGreens(payload: GreensPayload) {
  queryClient.setQueryData(["helix:pipeline:greens"], payload);
  try { window.dispatchEvent(new CustomEvent("helix:greens", { detail: payload })); } catch {}
}

/**
 * Subscribe to Greens payload no matter who publishes it.
 * - Reads from React-Query cache key ["helix:pipeline:greens"]
 * - Listens to `helix:greens` window events
 * Returns latest payload (or undefined if none yet).
 */
export function useGreens() {
  const [greens, setGreens] = React.useState<GreensPayload | undefined>(() =>
    queryClient.getQueryData(["helix:pipeline:greens"]) as GreensPayload | undefined
  );

  // react-query cache poll (cheap; avoids event-order races)
  React.useEffect(() => {
    let raf = 0, lastSig = "";
    const tick = () => {
      const cached = queryClient.getQueryData(["helix:pipeline:greens"]) as GreensPayload | undefined;
      const sig = cached ? `${cached.kind}|${cached.size}|${cached.source}` : "";
      if (sig && sig !== lastSig) {
        lastSig = sig;
        setGreens(cached);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // window event listener
  React.useEffect(() => {
    const onGreens = (e: any) => {
      const payload = e?.detail as GreensPayload | undefined;
      if (payload?.phi && payload.size > 0) setGreens(payload);
    };
    window.addEventListener("helix:greens" as any, onGreens as any);
    return () => window.removeEventListener("helix:greens" as any, onGreens as any);
  }, []);

  return greens;
}

/**
 * Optional emergency helper:
 * Build a Poisson φ on the client if you just have tiles but no publisher mounted.
 * (You can keep this or omit it if the Energy Pipeline page will always publish.)
 */
export function buildGreensFromTiles(
  tiles?: { pos: [number,number,number]; t00: number }[],
  normalize = true
): GreensPayload | undefined {
  if (!Array.isArray(tiles) || tiles.length === 0) return undefined;
  const N = tiles.length;
  const phi = new Float32Array(N);
  for (let i=0;i<N;i++){
    let s=0; const [xi,yi,zi] = tiles[i].pos;
    for (let j=0;j<N;j++){
      const [xj,yj,zj] = tiles[j].pos;
      const r = Math.hypot(xi-xj, yi-yj, zi-zj) + 1e-6;
      s += poissonKernel(r) * tiles[j].t00;
    }
    phi[i] = s;
  }
  if (normalize) {
    let min=Infinity, max=-Infinity;
    for (let i=0;i<N;i++){ const v=phi[i]; if(v<min)min=v; if(v>max)max=v; }
    const span = (max-min) || 1;
    for (let i=0;i<N;i++) phi[i] = (phi[i]-min)/span;
  }
  return { kind:"poisson", m:0, normalize, phi, size:N, source:"client" };
}

// Hook to get current pipeline state
export function useEnergyPipeline(options?: {
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
}) {
  const selectPipelineState = React.useCallback(
    (raw: EnergyPipelineState): EnergyPipelineState => {
      if (!raw) return raw;
      const rows = Array.isArray(raw.vacuumGapSweepResults)
        ? raw.vacuumGapSweepResults
        : [];
      const visibleCount = rows.length;
      const totalFromServer =
        typeof raw.vacuumGapSweepRowsTotal === "number"
          ? raw.vacuumGapSweepRowsTotal
          : visibleCount;
      const total = Math.max(totalFromServer, visibleCount);

      if (visibleCount > MAX_SWEEP_ROWS) {
        const trimmed = rows.slice(-MAX_SWEEP_ROWS);
        return {
          ...raw,
          vacuumGapSweepResults: trimmed,
          vacuumGapSweepRowsTotal: total,
          vacuumGapSweepRowsDropped: total - trimmed.length,
        };
      }

      const dropped =
        typeof raw.vacuumGapSweepRowsDropped === "number"
          ? Math.max(0, raw.vacuumGapSweepRowsDropped)
          : Math.max(0, total - visibleCount);

      if (
        raw.vacuumGapSweepRowsTotal === total &&
        raw.vacuumGapSweepRowsDropped === dropped
      ) {
        return raw;
      }

      return {
        ...raw,
        vacuumGapSweepRowsTotal: total,
        vacuumGapSweepRowsDropped: dropped,
      };
    },
    [],
  );

  const query = useQuery<EnergyPipelineState>({
    queryKey: ['/api/helix/pipeline'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/helix/pipeline');
      const json = await response.json();
      return json as EnergyPipelineState;
    },
    select: selectPipelineState,
    refetchInterval: (queryInstance) => {
      if (typeof options?.refetchInterval === "number") {
        return options.refetchInterval;
      }
      const snapshot = queryInstance.state?.data as EnergyPipelineState | undefined;
      const sweepActive = !!snapshot?.sweep?.active;
      return sweepActive ? 600 : 1000;
    },
    staleTime: options?.staleTime,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
  });

  const [sweepResults, setSweepResults] = React.useState<VacuumGapSweepRow[]>([]);
  const [sweepMeta, setSweepMeta] = React.useState<SweepResultsMeta>(EMPTY_SWEEP_META);

  React.useEffect(() => {
    const state = query.data;
    if (!state) return;
    const rows = Array.isArray(state.vacuumGapSweepResults)
      ? state.vacuumGapSweepResults
      : [];
    setSweepResults(rows);
    setSweepMeta(deriveSweepMeta(state, rows.length));
    if (rows.length) {
      const existing =
        (queryClient.getQueryData(SWEEP_RESULTS_QUERY_KEY) as SweepPointExtended[] | undefined) ??
        [];
      if (existing.length === 0) {
        queryClient.setQueryData(
          SWEEP_RESULTS_QUERY_KEY,
          rows.map(adaptVacuumRowToExtended).slice(-MAX_STREAM_SWEEP_ROWS),
        );
      }
    }
  }, [query.data]);

  React.useEffect(() => {
    const ids = [
      subscribe("vacuumGapSweepResults", (rows: VacuumGapSweepRow[] | undefined) => {
        if (!Array.isArray(rows)) return;
        const trimmed = trimSweepRows(rows);
        setSweepResults(trimmed);
        setSweepMeta({
          total: rows.length,
          dropped: Math.max(0, rows.length - trimmed.length),
        });
        queryClient.setQueryData(
          SWEEP_RESULTS_QUERY_KEY,
          trimmed.map(adaptVacuumRowToExtended).slice(-MAX_STREAM_SWEEP_ROWS),
        );
      }),
      subscribe("vacuumGapSweepStep", (row: VacuumGapSweepRow | undefined) => {
        if (!row) return;
        setSweepResults((prev) => {
          if (prev.length >= MAX_SWEEP_ROWS) {
            const next = prev.slice(-(MAX_SWEEP_ROWS - 1));
            next.push(row);
            return next;
          }
          return [...prev, row];
        });
        setSweepMeta((prev) => {
          const total = prev.total + 1;
          const dropped = Math.max(0, total - MAX_SWEEP_ROWS);
          return { total, dropped };
        });
        appendStreamRow(adaptVacuumRowToExtended(row));
      }),
      subscribe("parametricSweepStep", (row: SweepPointExtended | undefined) => {
        if (!row) return;
        appendStreamRow(row);
      }),
    ];
    return () => {
      ids.forEach((id) => unsubscribe(id));
    };
  }, []);

  const publishSweepControls = React.useCallback(async (payload: Partial<DynamicConfig>) => {
    const guardedPayload = guardActiveSlewPayload(payload, {
      pipeline: query.data,
      sweepResults,
    });
    try {
      await apiRequest('POST', '/api/helix/pipeline/update', { dynamicConfig: guardedPayload });
      startTransition(() => {
        queryClient.invalidateQueries({ predicate: q =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === '/api/helix/pipeline' || q.queryKey[0] === '/api/helix/metrics')
        });
      });
    } catch (err) {
      console.error("[HELIX] Failed to publish sweep controls:", err);
    }
  }, [query.data, sweepResults]);

  return {
    ...query,
    sweepResults,
    sweepResultsTotal: sweepMeta.total,
    sweepResultsDropped: sweepMeta.dropped,
    sweepResultsLimit: MAX_SWEEP_ROWS,
    sweepResultsOverLimit: sweepMeta.total > MAX_SWEEP_ROWS,
    publishSweepControls,
  };
}

// Hook to update pipeline parameters
export function useUpdatePipeline() {
  return useMutation({
    mutationFn: async (params: Partial<EnergyPipelineState>) => {
      const response = await apiRequest('POST', '/api/helix/pipeline/update', params);
      return response.json();
    },
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ predicate: q =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === '/api/helix/pipeline' || q.queryKey[0] === '/api/helix/metrics')
        });
      });
    }
  });
}

// Hook to switch operational mode
export function useSwitchMode() {
  return useMutation({
    mutationFn: async (mode: EnergyPipelineState['currentMode']) => {
      const requireOk = async (response: Response, label: string) => {
        if (!response.ok) {
          const detail = await response.text().catch(() => response.statusText);
          throw new Error(`${label} failed: ${detail || response.statusText}`);
        }
      };

      // 1) switch server mode
      const resMode = await apiRequest('POST', '/api/helix/pipeline/mode', { mode });
      await requireOk(resMode, 'Mode switch');
      const data = await resMode.json();

      // 2) immediately push mode-specific knobs so duty/strobing/qSpoil are in sync
      const cfg = MODE_CONFIGS[mode];
      if (cfg) {
        const resUpdate = await apiRequest('POST', '/api/helix/pipeline/update', {
          dutyCycle: cfg.dutyCycle,
          sectorStrobing: cfg.sectorStrobing,
          qSpoilingFactor: cfg.qSpoilingFactor,
          sectorsConcurrent: (cfg as any).sectorsConcurrent ?? (cfg as any).concurrentSectors,
          localBurstFrac: (cfg as any).localBurstFrac ?? cfg.dutyCycle,
          sectorsTotal: (cfg as any).sectorsTotal,
        });
        await requireOk(resUpdate, 'Mode knob sync');
      }
      publish("warp:reload", { reason: "mode-switch-local", mode, ts: Date.now() });
      return data;
    },
    onSuccess: (data, mode) => {
      startTransition(() => {
        queryClient.invalidateQueries({ predicate: q =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === '/api/helix/pipeline' || q.queryKey[0] === '/api/helix/metrics')
        });
      });
      
      // Let visualizers/inspectors hard-refresh
      publish("helix:pipeline:updated", { mode });
      
      // Trigger Luma whisper for mode changes
      const wisdom = getModeWisdom(mode);
      publish("luma:whisper", { text: wisdom });
    },
    onError: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ predicate: q =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === '/api/helix/pipeline' || q.queryKey[0] === '/api/helix/metrics')
        });
      });
    }
  });
}

// --- Types
export type ModeKey = "standby" | "hover" | "taxi" | "nearzero" | "cruise" | "emergency";

export type ModeConfig = {
  name: string;
  color: string;
  description?: string;
  hint?: string;

  // UI duty knob (not FR-averaged)
  dutyCycle: number;

  // 🔁 NEW: how many sectors exist vs. are live at once
  sectorsTotal: number;        // e.g., 400 (grid partitions across the hull)
  sectorsConcurrent: number;   // e.g., 1 in Hover/Cruise, maybe 4–8 in Emergency

  // 🔦 NEW: per-sector ON window (fraction of dwell, 0..1)
  localBurstFrac: number;      // e.g., 0.01 in Hover/Cruise; 0.50 in Emergency; 0 in Standby

  // 🎯 Optional: what the mode is aiming to produce (display only)
  powerTarget_W?: number;

  // 🧹 Legacy back-compat (many places still reference this)
  // Keep it equal to sectorsConcurrent so older code "just works".
  sectorStrobing?: number;

  // Legacy fields for backward compatibility
  qSpoilingFactor?: number;

  envCaps?: {
    rho_pad: number;
    v_pad: number;
    rho_strat: number;
    v_strat: number;
  };
  guards?: {
    q: { amber: number; red: number };
    zeta: { amber: number; red: number };
    stroke_pm: { amber: number; red: number };
    TS: { amber: number; red: number };
  };
  actionGuards?: { T_guard_amber_s: number; T_guard_red_s: number };
};

// Mode configurations for UI display (synchronized with backend)
export const MODE_CONFIGS: Record<ModeKey, ModeConfig> = {
  standby: {
    name: "Standby",
    color: "text-slate-300",
    description: "Field idle / safed",
    dutyCycle: 0.0,
    sectorsTotal: 400,
    sectorsConcurrent: 1,        // harmless placeholder; FR duty will be 0 because burst=0
    localBurstFrac: 0.0,         // no RF
    powerTarget_W: 0,
    sectorStrobing: 1,
    qSpoilingFactor: 0.1,
  },
  hover: {
    name: "Hover",
    color: "text-sky-300",
    description: "Gentle bulge / training profile",
    dutyCycle: 0.14,
    sectorsTotal: 400,
    sectorsConcurrent: 1,        // one live sector at a time (classic sweep)
    localBurstFrac: 0.01,        // 1% local ON inside dwell
    powerTarget_W: 83.3e6,       // match your display target
    sectorStrobing: 1,
    qSpoilingFactor: 1,
  },
  taxi: {
    name: "Taxi",
    color: "text-sky-300",
    description: "Ground ops posture; translation suppressed",
    dutyCycle: 0.14,
    sectorsTotal: 400,
    sectorsConcurrent: 1,        // identical electrical posture; translation stays suppressed
    localBurstFrac: 0.01,
    powerTarget_W: 83.3e6,       // inherits hover power budget
    sectorStrobing: 1,
    qSpoilingFactor: 1,
  },
  nearzero: {
    name: "Near-Zero",
    color: "text-amber-300",
    description: "Zero-β hover-climb regime",
    hint: "Zero-β hover-climb",
    dutyCycle: 0.12,
    sectorsTotal: 400,
    sectorsConcurrent: 1,
    localBurstFrac: 0.0075,
    sectorStrobing: 1,
    qSpoilingFactor: 1,
    envCaps: {
      rho_pad: 0.1,
      v_pad: 30,
      rho_strat: 1e-4,
      v_strat: 100,
    },
    guards: {
      q: { amber: 0.9, red: 1.0 },
      zeta: { amber: 0.95, red: 1.0 },
      stroke_pm: { amber: 45, red: 50 },
      TS: { amber: 100, red: 50 },
    },
    actionGuards: { T_guard_amber_s: 120, T_guard_red_s: 30 },
  },
  cruise: {
    name: "Cruise",
    color: "text-cyan-300",
    description: "Coherent 400× sweep; FR duty mostly from averaging",
    dutyCycle: 0.005,
    sectorsTotal: 400,
    sectorsConcurrent: 1,        // keep 1 unless you want faster pass speed
    localBurstFrac: 0.01,        // keep 1% local ON; FR change comes from S_live/S_total
    powerTarget_W: 40e6,
    sectorStrobing: 1,
    qSpoilingFactor: 0.625,
  },
  emergency: {
    name: "Emergency",
    color: "text-rose-300",
    description: "Max response window; fewer averages",
    dutyCycle: 0.50,
    sectorsTotal: 400,
    sectorsConcurrent: 8,        // widen the live window (try 4, 8, or 16)
    localBurstFrac: 0.50,        // big local ON fraction
    powerTarget_W: 120e6,
    sectorStrobing: 8,
    qSpoilingFactor: 1,
  },
};

// Optional: helper if other components want to apply mode knobs explicitly
export const modeKnobsFor = (mode: EnergyPipelineState['currentMode']) => {
  const m = MODE_CONFIGS[mode];
  return m ? {
    dutyCycle: m.dutyCycle,
    sectorStrobing: m.sectorStrobing,
    qSpoilingFactor: m.qSpoilingFactor,
  } : undefined;
};
