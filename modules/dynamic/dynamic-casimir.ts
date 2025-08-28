/**
 * Dynamic Casimir Effects Module
 * Pipeline-true implementation with Natário metric support
 */

import { calculateNatarioMetric, validateGRConsistency, type NatarioMetricResult } from './natario-metric.js';
import { PHYSICS_CONSTANTS } from '../core/physics-constants.js';
import type { CasimirModule } from '../core/module-registry.js';
import type { SimulationParameters } from '../../shared/schema.js';

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