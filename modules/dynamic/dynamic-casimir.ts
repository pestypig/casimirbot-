/**
 * Dynamic Casimir Effects Module
 * Pipeline-true implementation with Natário metric support
 */

import { calculateNatarioMetric, validateGRConsistency, type NatarioMetricResult } from './natario-metric.js';
import { PHYSICS_CONSTANTS } from '../core/physics-constants.js';
import { omega0_from_gap, domega0_dd } from '../sim_core/static-casimir.js';
import { Qint_nb3sn } from './stress-energy-equations.js';
import type { CasimirModule } from '../core/module-registry.js';
import type {
  SimulationParameters,
  DynamicConfig,
  DynamicCasimirSweepConfig,
  VacuumGapSweepRow,
  SweepPointExtended,
  SweepGuardSpec,
  GatePulse,
  GateRoute,
  GateAnalytics,
  PumpCommand,
  PumpTone,
  QiStats,
} from '../../shared/schema.js';
import { assignGateSummaries, type GateEvaluationOptions } from './gates/index.js';

export type DynamicConfigLike = Partial<Omit<DynamicConfig, "sweep">> & {
  sweep?: Partial<DynamicCasimirSweepConfig>;
};

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;
const linToDb = (x: number) => 10 * Math.log10(Math.max(x, 1e-18));
const TWO_PI = 2 * Math.PI;

const DEFAULT_PROBE_PIN_W = 1e-6; // -30 dBm probe unless overridden
const BOLTZMANN = 1.380649e-23;
const FALLBACK_RBW_HZ = 1.0;

const RHO_COS_GUARD_LIMIT = 0.95;
const SQUEEZE_CALIBRATION_LIMIT_DB = -15; // power dB cap for uncalibrated squeezing claims

function detuneHzFromGap(pumpFreq_GHz: number, f0_GHz: number): number {
  const delta_GHz = pumpFreq_GHz - 2 * f0_GHz;
  return delta_GHz * 1e9;
}

export function storedEnergyJ(omega0: number, QL: number, Pin_W = DEFAULT_PROBE_PIN_W) {
  return (QL / Math.max(omega0, 1e-12)) * Math.max(Pin_W, 0);
}

export function energyDeltaPerPumpCycleJ(
  omega0: number,
  QL_with: number,
  QL_base: number,
  U_mode: number,
  Omega: number,
) {
  const dInvQ = (1 / Math.max(QL_with, 1)) - (1 / Math.max(QL_base, 1));
  const dP = Math.max(0, omega0 * Math.max(U_mode, 0) * dInvQ);
  return dP * (2 * Math.PI / Math.max(Omega, 1e-12));
}

export function predictSqueezing_dB(rho: number) {
  const r = Math.max(0, Math.min(0.999, rho));
  return 20 * Math.log10((1 - r) / (1 + r));
}

export function sidebandAsymmetryProxy(G_lin: number) {
  if (!Number.isFinite(G_lin) || G_lin <= 1) return 0;
  const rho = Math.max(0, Math.min(0.99, Math.sqrt((G_lin - 1) / Math.max(G_lin, 1e-6))));
  return rho * 0.6;
}

const noiseTempK = (G_lin: number, Pin_W = DEFAULT_PROBE_PIN_W, RBW = FALLBACK_RBW_HZ) =>
  ((G_lin - 1) * Math.max(Pin_W, 0)) / Math.max(BOLTZMANN * RBW, 1e-24);

// --- Multi-tone helpers (PR-2) ----------------------------------------------
export interface BiHarmonicSpec {
  carrier_hz: number;
  delta_hz: number;
  carrier_depth: number;
  compensator_depth: number;
  base_phase_deg: number;
  rho0?: number;
  epoch_ms?: number;
}

export function emitBiHarmonic(spec: BiHarmonicSpec): PumpCommand {
  const basePhase = spec.base_phase_deg ?? 0;
  const tones: PumpTone[] = [
    { omega_hz: spec.carrier_hz, depth: spec.carrier_depth, phase_deg: basePhase },
    {
      omega_hz: spec.carrier_hz + spec.delta_hz,
      depth: spec.compensator_depth,
      phase_deg: basePhase + 180,
    },
  ];
  return {
    tones,
    rho0: spec.rho0,
    epoch_ms: spec.epoch_ms,
    issuedAt_ms: Date.now(),
  };
}

export function biHarmonicFromTau(
  tau_s_ms: number,
  opts: Partial<BiHarmonicSpec> = {},
): PumpCommand {
  const tauMs = Math.max(1, Math.abs(Number.isFinite(tau_s_ms) ? tau_s_ms : 1));
  const delta_hz = opts.delta_hz ?? 1000 / tauMs;
  const envCarrier = Number(process.env.PUMP_CARRIER_HZ);
  const envDepthNeg = Number(process.env.PUMP_DEPTH_NEG);
  const envDepthPos = Number(process.env.PUMP_DEPTH_POS);
  const spec: BiHarmonicSpec = {
    carrier_hz: opts.carrier_hz ?? (Number.isFinite(envCarrier) ? envCarrier : 5_000),
    delta_hz,
    carrier_depth: opts.carrier_depth ?? (Number.isFinite(envDepthNeg) ? envDepthNeg : 0.6),
    compensator_depth: opts.compensator_depth ?? (Number.isFinite(envDepthPos) ? envDepthPos : 0.4),
    base_phase_deg: opts.base_phase_deg ?? 0,
    rho0: opts.rho0 ?? 0,
    epoch_ms: opts.epoch_ms,
  };
  return emitBiHarmonic(spec);
}

// ---- Minimal QI-aware controller (stateless, gentle nudges) ----------------
/**
 * Returns a PumpCommand using tau_s-driven beat frequency.
 * Applies a light margin-based tweak to depths (no integral state).
 * Guard with env PUMP_TONE_ENABLE=1 in the caller.
 */
export function getPumpCommandForQi(
  qi: QiStats | undefined,
  opts: { epoch_ms?: number; base_phase_deg?: number } = {},
): PumpCommand | undefined {
  if (!qi) return undefined;
  const epoch_ms = opts.epoch_ms;
  const base_phase_deg = opts.base_phase_deg ?? 0;

  const base = biHarmonicFromTau(qi.tau_s_ms, {
    epoch_ms,
    base_phase_deg,
  });

  const margin = qi.margin;
  const boundMag = Math.max(1e-6, Math.abs(qi.bound));
  const thinBandThreshold = 0.05 * boundMag;
  const thin = margin < thinBandThreshold;

  if (thin && base.tones.length >= 2) {
    const neg = base.tones[0];
    const pos = base.tones[1];
    const deficit = thinBandThreshold - margin;
    const tweak = Math.min(0.08, Math.max(0.02, deficit / (boundMag + 1e-6))); // 2-8%
    pos.depth = clamp01(pos.depth + tweak);
    neg.depth = clamp01(neg.depth - 0.5 * tweak);
  }

  return base;
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x;
}

type PipeLike = Partial<{
  gammaGeo: number;
  gammaVanDenBroeck: number;
  qSpoilingFactor: number;
  cavityQ: number;
  sectorStrobing: number;
  dutyCycle: number;
  dutyEffectiveFR: number;
  modulationFreq_GHz: number;
  tauLC_ms: number;
  N_tiles: number;
  tileArea_m2: number;
  gap_nm: number;
}>;

function resolveFromPipeline(sim: SimulationParameters): Required<PipeLike> {
  const dc: any = sim.dynamicConfig ?? {};
  const p  : any = sim as any;

  const sectors = Math.max(1, Number(p.sectorStrobing ?? dc.sectorCount ?? 1));
  const dutyLocal = Math.max(0, Math.min(1, Number(p.dutyCycle ?? dc.sectorDuty ?? 0.14)));

  // Prefer FR duty if available from light-crossing loop
  const lc = p.lightCrossing;
  const dutyFR = (Number.isFinite(lc?.burst_ms) && Number.isFinite(lc?.dwell_ms) && lc!.dwell_ms! > 0)
    ? Math.max(0, Math.min(1, Number(lc!.burst_ms) / Number(lc!.dwell_ms)))
    : Number(p.dutyEffectiveFR);

  return {
    gammaGeo:           Number(p.gammaGeo ?? dc.gammaGeo ?? 26),
    gammaVanDenBroeck:  Number(p.gammaVanDenBroeck ?? dc.gammaVanDenBroeck ?? 2.86e5),
    qSpoilingFactor:    Math.max(1e-6, Number(p.qSpoilingFactor ?? dc.qSpoilingFactor ?? 1)),
    cavityQ:            Math.max(1, Number(p.cavityQ ?? dc.cavityQ ?? 1e9)),
    sectorStrobing:     sectors,
    dutyCycle:          dutyLocal,
    dutyEffectiveFR:    Number.isFinite(dutyFR) ? dutyFR : (dutyLocal / sectors),
    modulationFreq_GHz: Number(p.modulationFreq_GHz ?? dc.modulationFreqGHz ?? 15),
    tauLC_ms:           Number(p.tauLC_ms ?? p.lightCrossing?.tauLC_ms ?? (dc.lightCrossingTimeNs ? dc.lightCrossingTimeNs * 1e-6 : 0.1)),
    N_tiles:            Math.max(1, Number(p.N_tiles ?? (sim.arrayConfig?.size ? Math.pow(sim.arrayConfig.size, 2) : 1))),
    tileArea_m2:        Number(p.tileArea_m2 ?? 0.05 * 0.05),
    gap_nm:             Number(p.gap_nm ?? sim.gap ?? 1.0),
  } as Required<PipeLike>;
}

function computeAmplificationChain(pipe: Required<PipeLike>) {
  // E, ρ scale like γ_geo^3 · √(Q/1e9) · γ_VdB · q_spoil
  const qGain = Math.sqrt(pipe.cavityQ / 1e9);
  const A_geo = Math.pow(pipe.gammaGeo, 3);
  const A_total_inst = A_geo * qGain * pipe.gammaVanDenBroeck * pipe.qSpoilingFactor;
  return { A_geo, qGain, A_total_inst };
}

export interface DynamicCasimirParams {
  // Static Casimir baseline
  staticEnergy: number;

  // Dynamic modulation parameters (from roadmap spec)
  modulationFreqGHz: number;     // fₘ (15 GHz default)
  strokeAmplitudePm: number;     // δa (±50 pm default)
  burstLengthUs: number;         // t_burst (10 μs default)
  cycleLengthUs: number;         // t_cycle (1000 μs = 1 kHz default)
  cavityQ: number;               // Q factor (1×10⁹ default)
  tileCount: number;             // N_tiles for lattice calculations
}

export interface DynamicCasimirResult {
  // Time-domain parameters
  strokePeriodPs: number;        // Tₘ = 1/fₘ (66.7 ps for 15 GHz)
  dutyFactor: number;            // d = t_burst/t_cycle

  // Enhanced energy calculations
  boostedEnergy: number;         // ΔE enhanced (instantaneous)
  cycleAverageEnergy: number;    // ⟨ΔE⟩ cycle-averaged

  // Lattice and density calculations
  totalExoticMass: number;       // Total exotic mass
  exoticEnergyDensity: number;   // ρ_eff = ⟨ΔE⟩ / tile_volume

  // Quantum inequality and safety
  quantumInequalityMargin: number; // placeholder (server owns QI)
  quantumSafetyStatus: 'safe' | 'warning' | 'violation';

  // Power calculations
  instantaneousPower: number;    // Power during burst
  averagePower: number;          // Duty-mitigated power

  // GR validity checks
  isaacsonLimit: boolean;        // High-frequency limit compliance
  greenWaldCompliance: boolean;  // Averaged null energy condition

  // Additional readouts for research verification
  averagePowerPerTile: number;       // Power per tile
  averagePowerTotalLattice: number;  // Full lattice power
  exoticMassPerTile: number;         // Mass per tile
  exoticMassTotalLattice: number;    // Total exotic mass

  // Complete Energy Pipeline (optional summary)
  energyPipeline?: {
    U_static: number;             // Static energy per cavity [J]
    U_Q: number;                  // Q-amplified energy [J]
    U_geo: number;                // Effective amplified energy [J]
    U_cycle: number;              // Stored energy per cycle [J]
    P_loss: number;               // Power loss per cavity [W]
    TS_ratio: number;             // Time-scale separation ratio
    E_tile: number;               // Per-tile negative energy [J]
    E_total: number;              // Total exotic energy [J]
    m_exotic: number;             // Exotic mass via E=mc² [kg]
    γ_geo: number;                // Geometric blueshift factor
    ω: number;                    // Angular frequency [rad/s]
    d: number;                    // Duty cycle
    N_tiles: number;              // Tile count
    τ_pulse: number;              // Mechanical period [s]
    T_LC: number;                 // Light crossing time [s]
    powerPerTileComputed: number; // P_loss per tile [W]
    powerTotalComputed: number;   // Total lattice power [W]
    massPerTileComputed: number;  // Mass per tile [kg]
  };
}

/**
 * Minimal dynamic Casimir calculator (kept for API compatibility).
 * Uses only the provided params (no hidden constants).
 * For full pipeline + GR, use calculateDynamicCasimirWithNatario().
 */
export function calculateDynamicCasimir(params: DynamicCasimirParams): DynamicCasimirResult {
  const {
    staticEnergy,
    modulationFreqGHz,
    burstLengthUs,
    cycleLengthUs,
    cavityQ,
    tileCount
  } = params;

  // Time-domain
  const f_m = Math.max(1, modulationFreqGHz * 1e9); // Hz
  const strokePeriodPs = 1e12 / f_m;                // ps
  const dutyFactor = Math.max(0, Math.min(1, burstLengthUs / Math.max(1e-12, cycleLengthUs)));

  // Amplification (neutral baseline: √Q only; geometry handled elsewhere)
  const qEnhancement = Math.sqrt(Math.max(1, cavityQ) / 1e9);
  const boostedEnergy = Math.abs(staticEnergy) * qEnhancement;     // instantaneous
  const cycleAverageEnergy = boostedEnergy * dutyFactor;           // averaged per cycle

  // Per-tile / lattice
  const E_tile = cycleAverageEnergy;
  const E_total = E_tile * Math.max(1, tileCount);
  const c2 = PHYSICS_CONSTANTS.C * PHYSICS_CONSTANTS.C;
  const exoticMassPerTile = Math.abs(E_tile) / c2;
  const exoticMassTotalLattice = Math.abs(E_total) / c2;

  // Densities need a volume; use a conservative nominal 5cm×5cm×1nm
  const tileVolume = 0.05 * 0.05 * 1e-9; // m³
  const exoticEnergyDensity = E_tile / tileVolume;

  // Power
  const burst_s = Math.max(1e-12, burstLengthUs * 1e-6);
  const instantaneousPower = boostedEnergy / burst_s;
  const averagePower = cycleAverageEnergy * f_m;

  // Simple cavity loss estimate (per tile)
  const ω = 2 * Math.PI * f_m;
  const P_loss = Math.abs(boostedEnergy * ω / Math.max(1, cavityQ));

  // Time-scale separation (no LC number here → set T_LC conservative to 1e-9s)
  const T_m = 1 / f_m;
  const T_LC = 1e-9;
  const TS_ratio = T_m / T_LC;

  return {
    strokePeriodPs,
    dutyFactor,
    boostedEnergy,
    cycleAverageEnergy,
    totalExoticMass: exoticMassTotalLattice,
    exoticEnergyDensity,
    quantumInequalityMargin: 0,   // server-side QI owns this
    quantumSafetyStatus: 'safe',  // placeholder
    instantaneousPower,
    averagePower,
    isaacsonLimit: dutyFactor < 0.1,
    greenWaldCompliance: true,
    averagePowerPerTile: averagePower / Math.max(1, tileCount),
    averagePowerTotalLattice: averagePower,
    exoticMassPerTile,
    exoticMassTotalLattice,
    energyPipeline: {
      U_static: staticEnergy,
      U_Q: cavityQ * staticEnergy,
      U_geo: boostedEnergy,
      U_cycle: cycleAverageEnergy,
      P_loss,
      TS_ratio,
      E_tile,
      E_total,
      m_exotic: exoticMassTotalLattice,
      γ_geo: 1,               // geometry not applied in this minimal path
      ω,
      d: dutyFactor,
      N_tiles: Math.max(1, tileCount),
      τ_pulse: T_m,
      T_LC,
      powerPerTileComputed: P_loss,
      powerTotalComputed: P_loss * Math.max(1, tileCount),
      massPerTileComputed: exoticMassPerTile
    }
  };
}

/**
 * Dynamic Casimir Module Definition
 */
export const dynamicCasimirModule: CasimirModule = {
  name: 'dynamic',
  version: '1.0.0',
  description: 'Dynamic Casimir effects with moving boundaries and quantum inequality constraints',
  dependencies: ['static'], // Requires static calculations as baseline

  async initialize(): Promise<boolean> {
    // Validate physics constants and dependencies
    return true;
  },

  async calculate(params: SimulationParameters): Promise<DynamicCasimirResult> {
    // First get static baseline from static module
    const { calculateCasimirEnergy } = await import('../sim_core/static-casimir.js');
    const staticResult = calculateCasimirEnergy(params);

    // Extract dynamic parameters with defaults
    const dynamicParams: DynamicCasimirParams = {
      staticEnergy: staticResult.totalEnergy,
      modulationFreqGHz: params.dynamicConfig?.modulationFreqGHz || 15,
      strokeAmplitudePm: params.dynamicConfig?.strokeAmplitudePm || 50,
      burstLengthUs: params.dynamicConfig?.burstLengthUs || 10,
      cycleLengthUs: params.dynamicConfig?.cycleLengthUs || 1000,
      cavityQ: params.dynamicConfig?.cavityQ || 1e9,
      tileCount: params.arrayConfig?.size ? Math.pow(params.arrayConfig.size, 2) : 1
    };

    return calculateDynamicCasimirWithNatario(dynamicParams, params);
  }
};

/**
 * Calculate enhanced dynamic Casimir with Natário metric support
 * Integrates sector strobing and GR validity checks
 */
export function calculateDynamicCasimirWithNatario(
  params: DynamicCasimirParams,
  simulationParams: SimulationParameters
): DynamicCasimirResult & Partial<NatarioMetricResult> {
  // --- Resolve pipeline values
  const pipe = resolveFromPipeline(simulationParams);
  const { A_total_inst } = computeAmplificationChain(pipe);

  // --- Time domain
  const strokePeriodPs = 1000 / pipe.modulationFreq_GHz;
  const dutyFactor_local = Math.max(0, Math.min(1, params.burstLengthUs / params.cycleLengthUs)); // local burst duty
  // Prefer FR duty (burst/dwell or explicit) for average physics:
  const d_eff = Math.max(0, Math.min(1, pipe.dutyEffectiveFR));

  // --- Static baseline (from static module call above)
  const staticEnergy = Math.abs(params.staticEnergy); // magnitude

  // Instantaneous amplified energy (per cavity/tile-scale quantity as appropriate to your staticEnergy)
  const boostedEnergy = staticEnergy * A_total_inst;

  // Cycle-averaged energy uses FR duty
  const cycleAverageEnergy = boostedEnergy * d_eff;

  // Geometry for densities
  const gap_m = Math.max(1e-12, pipe.gap_nm * PHYSICS_CONSTANTS.NM_TO_M);
  const tileVolume = Math.max(1e-18, pipe.tileArea_m2 * gap_m);
  const exoticEnergyDensity = cycleAverageEnergy / tileVolume;

  // Power (do not use targets)
  const f_m = pipe.modulationFreq_GHz * 1e9;
  const T_m = 1 / f_m;
  const instantaneousPower = boostedEnergy / Math.max(1e-12, params.burstLengthUs * 1e-6); // during local burst
  const averagePower = cycleAverageEnergy * f_m; // ⟨E⟩ per cycle times cycles/s

  // Lattice totals (use pipeline N_tiles)
  const E_tile = cycleAverageEnergy;              // per tile/cavity (matches staticEnergy basis)
  const E_total = E_tile * pipe.N_tiles;
  const c2 = PHYSICS_CONSTANTS.C * PHYSICS_CONSTANTS.C;
  const massPerTileComputed = Math.abs(E_tile) / c2;
  const massTotalLatticeReadout = Math.abs(E_total) / c2;

  // Cavity losses (pipeline Q)
  const ω = 2 * Math.PI * f_m;
  const U_geo_like = boostedEnergy; // energy sitting in the effective "amplified" state
  const P_loss = Math.abs(U_geo_like * ω / Math.max(1, pipe.cavityQ)); // simplistic cavity loss model

  // Light-crossing & TS ratio (pipeline hull → τ_LC already supplied)
  const T_LC = Math.max(1e-12, pipe.tauLC_ms * 1e-3);
  const TS_ratio = T_m / T_LC;

  // Compose base dynamic result
  const baseResults: DynamicCasimirResult = {
    strokePeriodPs,
    dutyFactor: dutyFactor_local,   // keep local % for UI
    boostedEnergy,
    cycleAverageEnergy,
    totalExoticMass: massTotalLatticeReadout,
    exoticEnergyDensity,
    quantumInequalityMargin: 0,     // leave 0 or compute with your proper QI bound; server owns this
    quantumSafetyStatus: 'safe',    // let validation service own strict status
    instantaneousPower,
    averagePower,
    isaacsonLimit: d_eff < 0.1,     // rough check; refine if needed
    greenWaldCompliance: true,      // defer to natario-metric's GR checks
    averagePowerPerTile: averagePower / pipe.N_tiles,
    averagePowerTotalLattice: averagePower,
    exoticMassPerTile: massPerTileComputed,
    exoticMassTotalLattice: massTotalLatticeReadout,
    energyPipeline: {
      U_static: params.staticEnergy,     // sign-preserving if your static returns signed
      U_Q: params.cavityQ * params.staticEnergy,
      U_geo: boostedEnergy,              // effective amplified energy
      U_cycle: cycleAverageEnergy,
      P_loss,
      TS_ratio,
      E_tile,
      E_total,
      m_exotic: massTotalLatticeReadout,
      γ_geo: pipe.gammaGeo,
      ω,
      d: d_eff,
      N_tiles: pipe.N_tiles,
      τ_pulse: T_m,
      T_LC,
      powerPerTileComputed: P_loss,
      powerTotalComputed: P_loss * pipe.N_tiles,
      massPerTileComputed
    }
  };

  // Natário metric on **time-averaged** energy (pipeline-true)
  let natarioResults: Partial<NatarioMetricResult> = {};
  try {
    const nat = calculateNatarioMetric(
      {
        ...simulationParams,
        // hand the same knobs the viewers read:
        dynamicConfig: {
          ...(simulationParams.dynamicConfig||{}),
          cavityQ: pipe.cavityQ,
          sectorCount: pipe.sectorStrobing,
          sectorDuty: pipe.dutyCycle,
          pulseFrequencyGHz: pipe.modulationFreq_GHz,
          lightCrossingTimeNs: pipe.tauLC_ms * 1e6
        }
      } as any,
      E_total // total average negative energy (preferred over static)
    );
    const gr = validateGRConsistency(nat);
    natarioResults = {
      stressEnergyT00: nat.stressEnergyT00,
      stressEnergyT11: nat.stressEnergyT11,
      natarioShiftAmplitude: nat.natarioShiftAmplitude,
      sectorStrobingEfficiency: nat.sectorStrobingEfficiency,
      grValidityCheck: nat.grValidityCheck && gr.strategyA,
      homogenizationRatio: nat.homogenizationRatio,
      timeAveragedCurvature: nat.timeAveragedCurvature
    };
  } catch (e) {
    console.warn('Natário metric calculation failed:', e);
  }

  return { ...baseResults, ...natarioResults };
}

export interface SweepPointInput {
  d_nm: number;
  m: number;
  Omega_GHz: number;
  phi_deg: number;
}

export interface PlateauGuardrail {
  dBDrop?: number;
  maxQLPenaltyPct?: number;
  minWidth_deg?: number;
}

export interface RunSweepConfig {
  gaps_nm: number[];
  mod_depth_pct: number[];
  pump_freq_GHz: number[];
  pumpStrategy?: "auto";
  phase_deg: number[];
  geometry?: "parallel_plate" | "cpw";
  gamma_geo?: number;
  base_f0_GHz?: number;
  Qc?: number;
  T_K?: number;
  activeSlew?: boolean;
  twoPhase?: boolean;
  slewDelayMs?: number;
  maxGain_dB?: number;
  minQL?: number;
  plateau?: PlateauGuardrail;
  phaseMicroStep_deg?: number;
  hardwareProfile?: {
    gapLimit?: number;
    phaseLimit?: number;
    modDepthLimit?: number;
    pumpLimit?: number;
    delayMs?: number;
  };
  gateSchedule?: GatePulse[];
  gateRouting?: GateRoute[];
  gateOptions?: GateEvaluationOptions;
  gateAnalyticsSink?: (analytics: GateAnalytics | null) => void;
}

export function Q_loaded(Qint: number, Qc: number): number {
  return 1 / (1 / Math.max(Qint, 1) + 1 / Math.max(Qc, 1));
}

export function stability_check(
  row: SweepPointExtended,
  guards?: SweepGuardSpec,
): { pass: boolean; reason?: string; abortSweep: boolean };
export function stability_check(
  G_dB: number,
  QL: number,
  limits?: { Gmax: number; Qmin: number; Qmax: number },
): { stable: boolean; reasons: string[] };
export function stability_check(
  arg1: number | SweepPointExtended,
  arg2?: any,
  arg3?: any,
):
  | { pass: boolean; reason?: string; abortSweep: boolean }
  | { stable: boolean; reasons: string[] } {
  if (typeof arg1 === "object" && arg1 !== null) {
    const row = arg1;
    const guards = arg2 as SweepGuardSpec | undefined;
    const maxGain = Number.isFinite(guards?.maxGain_dB) ? Number(guards!.maxGain_dB) : 15;
    const minQL = Number.isFinite(guards?.minQL) ? Number(guards!.minQL) : 1e3;
    const maxQL = Number.isFinite(guards?.maxQL) ? Number(guards!.maxQL) : 2e9;
    const qlDropPct = Number.isFinite(guards?.qlDropPct) ? Math.max(0, Number(guards!.qlDropPct)) : null;

    const gain = Number.isFinite(row.G_dB)
      ? Number(row.G_dB)
      : Number.isFinite(row.G_lin)
      ? 10 * Math.log10(Math.max(Number(row.G_lin), 1e-12))
      : undefined;
    const ql = Number.isFinite(row.QL) ? Number(row.QL) : undefined;
    const qlBase = Number.isFinite(row.QL_base) ? Number(row.QL_base) : undefined;

    let reason: string | undefined;
    let abortSweep = false;

    if (typeof gain === "number" && gain > maxGain + 1e-9) {
      reason = `gain ${gain.toFixed(2)} dB > ${maxGain} dB`;
      abortSweep = Boolean(guards?.abortOnGain);
    } else if (typeof ql === "number" && ql < minQL) {
      reason = `QL ${ql.toExponential(2)} < ${minQL}`;
    } else if (typeof ql === "number" && ql > maxQL) {
      reason = `QL ${ql.toExponential(2)} > ${maxQL}`;
    } else if (
      qlDropPct != null &&
      qlDropPct > 0 &&
      typeof ql === "number" &&
      typeof qlBase === "number"
    ) {
      const drop = ((qlBase - ql) / Math.max(qlBase, 1e-12)) * 100;
      if (drop > qlDropPct + 1e-9) {
        reason = `QL drop ${drop.toFixed(1)}% > ${qlDropPct}%`;
      }
    }

    return { pass: !reason, reason, abortSweep };
  }

  const G_dB = Number(arg1);
  const QL = Number(arg2);
  const limits = arg3 ?? { Gmax: 15, Qmin: 1e3, Qmax: 2e9 };
  const reasons: string[] = [];
  if (G_dB > limits.Gmax) reasons.push(`G=${G_dB.toFixed(2)} dB exceeds ${limits.Gmax} dB`);
  if (QL < limits.Qmin) reasons.push(`QL=${QL.toExponential(2)} < ${limits.Qmin}`);
  if (QL > limits.Qmax) reasons.push(`QL=${QL.toExponential(2)} > ${limits.Qmax}`);
  return { stable: reasons.length === 0, reasons };
}

export function coupling(
  d_m: number,
  m: number,
  f0_GHz: number,
  geom: "parallel_plate" | "cpw",
  gammaGeo: number,
): number {
  const dw_dd = domega0_dd(d_m, f0_GHz, geom, gammaGeo);
  return Math.abs(dw_dd) * m * d_m;
}

export function parametric_gain_lin(
  g: number,
  kappa: number,
  Delta: number,
  phi: number,
): number {
  const k = Math.max(Math.abs(kappa), 1e-12);
  const r = (2 * g) / k;
  return 1 / ((1 - r * Math.cos(phi)) ** 2 + (Delta / k) ** 2);
}

export type ComputeSweepPointExtendedArgs = {
  gap_nm: number;
  pumpFreq_GHz: number;
  modulationDepth_pct: number;
  pumpPhase_deg: number;
  w0: number;      // rad/s
  dw_dd: number;   // rad/(s·m)
  Qint?: number;
  Qc?: number;
};

export function computeSweepPointExtended(args: ComputeSweepPointExtendedArgs): SweepPointExtended {
  const m_frac = Math.max(0, args.modulationDepth_pct) / 100;
  const pumpFreq_GHz = args.pumpFreq_GHz;
  const pumpFreq_Hz = pumpFreq_GHz * 1e9;
  const phi = toRad(args.pumpPhase_deg);
  const f0_Hz = Math.abs(args.w0) / TWO_PI;
  const f0_GHz = f0_Hz / 1e9;

  const Qint = Number.isFinite(args.Qint) ? Math.max(Number(args.Qint), 1) : 2e9;
  const Qc = Number.isFinite(args.Qc) ? Math.max(Number(args.Qc), 1) : 5e5;
  const QL_base = Math.max(1e-12, 1 / ((1 / Qint) + (1 / Qc)));
  const kappa_rad = Math.abs(args.w0) / Math.max(QL_base, 1);
  const kappa_Hz = kappa_rad / TWO_PI;

  const gap_m = Math.max(args.gap_nm, 0) * 1e-9;
  const dw_dd_abs = Number.isFinite(args.dw_dd) ? Math.abs(args.dw_dd) : 0;
  const g_rad =
    dw_dd_abs > 0 && gap_m > 0
      ? 0.5 * dw_dd_abs * m_frac * gap_m
      : 0.5 * Math.abs(args.w0) * m_frac;
  const g_Hz = g_rad / TWO_PI;
  const gth_rad = kappa_rad / 2;
  const gth_Hz = gth_rad / TWO_PI;
  const rho = gth_rad > 0 ? g_rad / gth_rad : 0;

  const Delta_Hz = detuneHzFromGap(pumpFreq_GHz, f0_GHz);
  const kappaEff_Hz = kappa_Hz - 2 * g_Hz * Math.cos(phi);
  const den = (1 - rho * Math.cos(phi)) ** 2 + (kappa_Hz > 0 ? (Delta_Hz / kappa_Hz) ** 2 : 0);
  const G_lin = 1 / Math.max(den, 1e-12);
  const G_dB = linToDb(G_lin);

  const Q_eff = kappaEff_Hz > 0 ? f0_Hz / kappaEff_Hz : Number.NaN;
  const detune_MHz = Delta_Hz / 1e6;
  const detuneRatio = kappa_Hz > 0 ? Math.abs(Delta_Hz) / kappa_Hz : Number.POSITIVE_INFINITY;

  const status: "PASS" | "WARN" | "UNSTABLE" =
    kappaEff_Hz <= 0 || rho >= 1
      ? "UNSTABLE"
      : rho > 0.9 || detuneRatio > 1
      ? "WARN"
      : "PASS";

  const row: SweepPointExtended = {
    gap_nm: args.gap_nm,
    pumpFreq_GHz: args.pumpFreq_GHz,
    modulationDepth_pct: args.modulationDepth_pct,
    pumpPhase_deg: args.pumpPhase_deg,
    kappa_Hz,
    kappaEff_Hz,
    kappa_MHz: kappa_Hz / 1e6,
    kappaEff_MHz: kappaEff_Hz / 1e6,
    detune_MHz,
    pumpRatio: rho,
    g_lin: g_Hz,
    G_lin,
    G_dB,
    QL: Number.isFinite(Q_eff) && Q_eff > 0 ? Q_eff : undefined,
    QL_base,
    stable: status === "PASS",
    status,
    ts: Date.now(),
  };

  if (!Number.isFinite(row.kappa_Hz!)) delete row.kappa_Hz;
  if (!Number.isFinite(row.kappaEff_Hz!)) delete row.kappaEff_Hz;
  if (!Number.isFinite(row.kappa_MHz!)) delete row.kappa_MHz;
  if (!Number.isFinite(row.kappaEff_MHz!)) delete row.kappaEff_MHz;
  if (!Number.isFinite(row.detune_MHz!)) delete row.detune_MHz;
  if (!Number.isFinite(row.pumpRatio!)) delete row.pumpRatio;
  if (!Number.isFinite(row.g_lin!)) delete row.g_lin;
  if (!Number.isFinite(row.G_lin!)) delete row.G_lin;
  if (!Number.isFinite(row.G_dB!)) delete row.G_dB;
  if (!Number.isFinite(row.QL!)) delete row.QL;
  if (!Number.isFinite(row.QL_base!)) delete row.QL_base;

  return row;
}

export function computeSweepPoint(
  pt: SweepPointInput,
  ctx: {
    geom: "parallel_plate" | "cpw";
    gammaGeo: number;
    base_f0_GHz: number;
    Qc: number;
    T_K: number;
  },
): VacuumGapSweepRow {
  const phi = toRad(pt.phi_deg);
  const f0_GHz = omega0_from_gap(pt.d_nm * 1e-9, ctx.base_f0_GHz, ctx.geom, ctx.gammaGeo);
  const f0_Hz = Math.abs(f0_GHz) * 1e9;
  const omega0 = TWO_PI * f0_Hz;
  const pump_GHz = pt.Omega_GHz;
  const pump_Hz = pump_GHz * 1e9;
  const Omega = TWO_PI * pump_Hz;
  const Delta_Hz = detuneHzFromGap(pump_GHz, f0_GHz);
  const Qi = Qint_nb3sn({ T_K: ctx.T_K, f_GHz: f0_GHz });
  const QL_base = Q_loaded(Qi, ctx.Qc);
  const kappa_base_rad = Math.abs(omega0) / Math.max(QL_base, 1);
  const kappa_base_Hz = kappa_base_rad / TWO_PI;

  const m_frac = Math.max(pt.m, 0);
  const d_m = Math.max(pt.d_nm, 0) * 1e-9;
  const dw_dd = domega0_dd(d_m, f0_GHz, ctx.geom, ctx.gammaGeo);
  const dw_dd_abs = Number.isFinite(dw_dd) ? Math.abs(dw_dd) : 0;
  const g_rad =
    dw_dd_abs > 0 && d_m > 0
      ? 0.5 * dw_dd_abs * m_frac * d_m
      : 0.5 * Math.abs(omega0) * m_frac;
  const g_Hz = g_rad / TWO_PI;
  const gth_rad = kappa_base_rad / 2;
  const gth_Hz = gth_rad / TWO_PI;
  const rho = gth_rad > 0 ? g_rad / gth_rad : 0;
  const kappa_eff_Hz = kappa_base_Hz - 2 * g_Hz * Math.cos(phi);
  const hasPositiveQ = kappa_eff_Hz > 0;
  const Q_eff = hasPositiveQ ? f0_Hz / kappa_eff_Hz : Number.NaN;
  const G_lin = parametric_gain_lin(g_Hz, kappa_base_Hz, Delta_Hz, phi);
  const G_dB = linToDb(G_lin);

  const phiQuadr = Math.PI / 2;
  const kappa_quadrature_Hz = kappa_base_Hz - 2 * g_Hz * Math.cos(phiQuadr);
  const QL_quadrature = omega0 / Math.max(kappa_quadrature_Hz * TWO_PI, 1);
  const G_base_lin = parametric_gain_lin(g_Hz, kappa_base_Hz, Delta_Hz, phiQuadr);

  const U_mode = hasPositiveQ ? storedEnergyJ(omega0, Q_eff) : 0;
  const U_mode_base = storedEnergyJ(omega0, QL_quadrature);
  const deltaU_cycle = hasPositiveQ
    ? energyDeltaPerPumpCycleJ(omega0, Q_eff, QL_quadrature, U_mode, Omega)
    : Number.NaN;
  const deltaU_mode = U_mode - U_mode_base;

  const rhoClamped = Math.max(0, Math.min(0.999, rho));
  const squeeze_dB = predictSqueezing_dB(rhoClamped);
  const asym = sidebandAsymmetryProxy(G_lin);
  const noiseTemp = Math.max(0, noiseTempK(G_lin));
  const negEnergyProxy = (G_lin - G_base_lin) / Math.max(G_base_lin, 1e-6) / Math.max(1, noiseTemp);

  const detune_MHz = Delta_Hz / 1e6;
  const detuneRatio = kappa_base_Hz > 0 ? Math.abs(Delta_Hz) / kappa_base_Hz : Number.POSITIVE_INFINITY;
  const status: "PASS" | "WARN" | "UNSTABLE" =
    kappa_eff_Hz <= 0 || rho >= 1
      ? "UNSTABLE"
      : rho > 0.9 || detuneRatio > 1
      ? "WARN"
      : "PASS";

  const Q_guard = hasPositiveQ ? Q_eff : QL_base;
  const { stable: guardStable, reasons } = stability_check(G_dB, Q_guard);
  const notes = reasons.length ? [...reasons] : [];
  const row: VacuumGapSweepRow = {
    d_nm: pt.d_nm,
    m: pt.m,
    Omega_GHz: pt.Omega_GHz,
    phi_deg: pt.phi_deg,
    G: G_dB,
    QL: hasPositiveQ ? Q_eff : undefined,
    QL_base,
    stable: status === "PASS" && guardStable,
    status,
    notes: notes.length ? notes : undefined,
    Omega_rad_s: Omega,
    detune_MHz,
    kappa_Hz: kappa_base_Hz,
    kappaEff_Hz: kappa_eff_Hz,
    kappa_MHz: kappa_base_Hz / 1e6,
    kappaEff_MHz: kappa_eff_Hz / 1e6,
    pumpRatio: rho,
    dB_squeeze: squeeze_dB,
    sidebandAsym: asym,
    noiseTemp_K: noiseTemp,
    deltaU_cycle_J: Number.isFinite(deltaU_cycle) ? deltaU_cycle : undefined,
    deltaU_mode_J: Number.isFinite(deltaU_mode) ? deltaU_mode : undefined,
    negEnergyProxy,
    crest: false,
    plateau: null,
    pumpPhase_deg: pt.phi_deg,
    g_lin: g_Hz,
  };
  return row;
}

export function applyVacuumSweepGuardrails(row: VacuumGapSweepRow): boolean {
  let include = true;
  const notes = row.notes ? [...row.notes] : [];

  if (typeof row.pumpRatio === "number" && Number.isFinite(row.pumpRatio) && typeof row.phi_deg === "number") {
    const rhoCos = Math.abs(row.pumpRatio * Math.cos(toRad(row.phi_deg)));
    if (rhoCos >= RHO_COS_GUARD_LIMIT) {
      notes.push(`guard: |rho·cosφ|=${rhoCos.toFixed(3)} ≥ ${RHO_COS_GUARD_LIMIT.toFixed(2)}`);
      row.status = "UNSTABLE";
      row.stable = false;
      row.abortReason = "rho_cos_guard";
      include = false;
    }
  }

  if (include && Number.isFinite(row.G) && row.G <= SQUEEZE_CALIBRATION_LIMIT_DB) {
    notes.push(
      `calibration required: squeezing ${row.G.toFixed(2)} dB < ${SQUEEZE_CALIBRATION_LIMIT_DB.toFixed(1)} dB ceiling`,
    );
    if (row.status === "PASS") {
      row.status = "WARN";
    }
  }

  if (notes.length) {
    row.notes = Array.from(new Set(notes));
  } else if (row.notes) {
    delete row.notes;
  }

  return include;
}

export function runVacuumGapSweep(cfg: RunSweepConfig): VacuumGapSweepRow[] {
  const geom = cfg.geometry ?? "cpw";
  const gammaGeo = cfg.gamma_geo ?? 1e-3;
  const base_f0_GHz = cfg.base_f0_GHz ?? 6;
  const Qc = cfg.Qc ?? 5e5;
  const T_K = cfg.T_K ?? 2;
  const maxGain = cfg.maxGain_dB ?? 15;
  const minQL = cfg.minQL ?? 1e3;
  const rows: VacuumGapSweepRow[] = [];
  const ctx = { geom, gammaGeo, base_f0_GHz, Qc, T_K };
  const modDepthList = cfg.mod_depth_pct && cfg.mod_depth_pct.length ? cfg.mod_depth_pct : [0.5];
  const phaseList = cfg.phase_deg && cfg.phase_deg.length ? cfg.phase_deg : [0];

  for (const d_nm of cfg.gaps_nm) {
    const d_m = d_nm * 1e-9;
    const autoPump = cfg.pumpStrategy === "auto";
    const f0_auto = omega0_from_gap(d_m, base_f0_GHz, geom, gammaGeo);
    const pumpList = autoPump
      ? [2 * f0_auto]
      : (cfg.pump_freq_GHz && cfg.pump_freq_GHz.length ? cfg.pump_freq_GHz : [2 * base_f0_GHz]);

    for (const m_pct of modDepthList) {
      const m = m_pct / 100;
      for (const pump of pumpList) {
        const phaseRows: VacuumGapSweepRow[] = [];
        for (const phase of phaseList) {
          const row = computeSweepPoint(
            { d_nm, m, Omega_GHz: pump, phi_deg: phase },
            ctx,
          );

          if (row.G > maxGain && (row.QL ?? Infinity) < minQL) {
            continue;
          }

          if (!applyVacuumSweepGuardrails(row)) {
            continue;
          }

          phaseRows.push(row);
        }
        if (!phaseRows.length) continue;
        phaseRows.sort((a, b) => a.phi_deg - b.phi_deg);
        detectPlateau(phaseRows, cfg);
        rows.push(...phaseRows);
      }
    }
  }
  let gateAnalytics: GateAnalytics | null = null;
  if (cfg.gateSchedule && cfg.gateSchedule.length) {
    const { analytics } = assignGateSummaries(
      rows,
      cfg.gateSchedule,
      cfg.gateRouting,
      cfg.gateOptions ?? {},
    );
    gateAnalytics = analytics;
  } else {
    for (const row of rows) {
      if (row && "gate" in row) {
        delete row.gate;
      }
    }
  }
  if (cfg.gateAnalyticsSink) {
    cfg.gateAnalyticsSink(gateAnalytics);
  }
  return rows;
}

export function detectPlateau(
  rows: VacuumGapSweepRow[],
  cfg: { plateau?: PlateauGuardrail } | RunSweepConfig,
) {
  if (!rows.length) return { plateau: null, crestPhiDeg: 0, crestIdx: -1 };

  rows.forEach((row) => {
    row.crest = false;
    row.plateau = null;
  });

  const eligible = rows.filter(
    (row) =>
      row.stable !== false &&
      row.status !== "UNSTABLE" &&
      Number.isFinite(row.G) &&
      typeof row.phi_deg === "number",
  );

  if (!eligible.length) {
    return { plateau: null, crestPhiDeg: 0, crestIdx: -1 };
  }

  const sorted = eligible.slice().sort((a, b) => a.phi_deg - b.phi_deg);
  let crestRow = sorted[0];
  let crestGain = crestRow.G;
  for (const row of sorted) {
    if (row.G > crestGain) {
      crestGain = row.G;
      crestRow = row;
    }
  }

  crestRow.crest = true;

  const plateauCfg = (cfg as RunSweepConfig).plateau ?? cfg.plateau ?? {};
  const drop = plateauCfg.dBDrop ?? 0.5;
  const maxPenalty = (plateauCfg.maxQLPenaltyPct ?? 5) / 100;
  const minWidth = plateauCfg.minWidth_deg ?? 1;
  const Qref = crestRow.QL ?? crestRow.QL_base ?? 0;

  const within = (candidate: VacuumGapSweepRow) => {
    const gainOk = candidate.G >= crestRow.G - drop;
    const qPenalty =
      Qref > 0 ? (Qref - (candidate.QL ?? Qref)) / Math.max(Qref, 1) : 0;
    const qOk = Math.abs(qPenalty) <= maxPenalty;
    return gainOk && qOk;
  };

  const crestIdxSorted = sorted.findIndex((row) => row === crestRow);
  let left = crestIdxSorted;
  let right = crestIdxSorted;
  while (left - 1 >= 0 && within(sorted[left - 1])) left--;
  while (right + 1 < sorted.length && within(sorted[right + 1])) right++;

  const phiMin = sorted[left].phi_deg;
  const phiMax = sorted[right].phi_deg;
  const width = phiMax - phiMin;

  const plateau =
    width >= minWidth
      ? {
          phi_min_deg: phiMin,
          phi_max_deg: phiMax,
          width_deg: width,
          G_ref_dB: crestRow.G,
          Q_penalty_pct:
            Qref > 0
              ? ((Qref - (crestRow.QL ?? Qref)) / Math.max(Qref, 1)) * 100
              : 0,
        }
      : null;

  crestRow.plateau = plateau;
  return { plateau, crestPhiDeg: crestRow.phi_deg, crestIdx: rows.indexOf(crestRow) };
}

export function defaultSweepConfigFromDynamic(
  config: DynamicConfigLike | undefined | null,
): RunSweepConfig | null {
  const sweep = config?.sweep;
  const toNumberArray = (value: unknown): number[] => {
    if (Array.isArray(value)) {
      return value
        .map((v) => (typeof v === "number" ? v : Number(v)))
        .filter((v) => Number.isFinite(v));
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return [value];
    }
    return [];
  };

  const gaps =
    (sweep && Array.isArray(sweep.gaps_nm) && sweep.gaps_nm.length ? sweep.gaps_nm : undefined) ??
    (Array.isArray(config?.gap_nm) ? toNumberArray(config?.gap_nm) : undefined) ??
    (typeof config?.gap_nm === "number" ? [config.gap_nm] : undefined);
  if (!gaps || gaps.length === 0) return null;

  const modDepthPct =
    (sweep?.mod_depth_pct && sweep.mod_depth_pct.length
      ? sweep.mod_depth_pct
      : toNumberArray(config?.mod_depth_pct)) || [0.5];

  const phase_deg =
    (sweep?.phase_deg && sweep.phase_deg.length
      ? sweep.phase_deg
      : toNumberArray(config?.phase_deg)) || [0];

  const pumpSource = sweep?.pump_freq_GHz ?? config?.pump_freq_GHz;
  let pumpStrategy: "auto" | undefined;
  let pump_freq_GHz = toNumberArray(pumpSource);
  if (pumpSource === "auto") {
    pumpStrategy = "auto";
  }
  if (!pump_freq_GHz.length && pumpStrategy !== "auto") {
    const fallback =
      typeof config?.modulationFreqGHz === "number"
        ? config.modulationFreqGHz * 2
        : (Array.isArray(config?.pump_freq_GHz) && config?.pump_freq_GHz.length
            ? Number(config.pump_freq_GHz[0])
            : typeof config?.pump_freq_GHz === "number"
              ? config.pump_freq_GHz
              : 12);
    pump_freq_GHz = [fallback];
  }

  return {
    gaps_nm: gaps,
    mod_depth_pct: modDepthPct,
    pump_freq_GHz,
    pumpStrategy,
    phase_deg,
    geometry: sweep?.geometry,
    gamma_geo: sweep?.gamma_geo,
    base_f0_GHz: sweep?.base_f0_GHz,
    Qc: sweep?.Qc,
    T_K: sweep?.T_K,
    activeSlew: sweep?.activeSlew ?? undefined,
    slewDelayMs: sweep?.slewDelayMs,
    hardwareProfile: sweep?.hardwareProfile,
    maxGain_dB: sweep?.maxGain_dB ?? config?.sweep?.maxGain_dB,
    minQL: sweep?.minQL ?? config?.sweep?.minQL,
    plateau: sweep?.plateau ?? config?.sweep?.plateau,
    phaseMicroStep_deg: sweep?.phaseMicroStep_deg ?? config?.sweep?.phaseMicroStep_deg,
    gateSchedule:
      sweep?.gateSchedule && sweep.gateSchedule.length
        ? sweep.gateSchedule
        : config?.gateSchedule && config.gateSchedule.length
        ? config.gateSchedule
        : undefined,
    gateRouting:
      sweep?.gateRouting && sweep.gateRouting.length
        ? sweep.gateRouting
        : config?.gateRouting && config.gateRouting.length
        ? config.gateRouting
        : undefined,
    gateOptions:
      sweep?.T_K != null
        ? { bathTemperature_K: sweep.T_K }
        : undefined,
    twoPhase: sweep?.twoPhase ?? (config as any)?.sweep?.twoPhase,
  };
}
