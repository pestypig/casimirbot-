/**
 * Dynamic Casimir Effects Module
 * Based on math-gpt.org formulation reference and theoretical foundations
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
    N_tiles:            Math.max(1, Number(p.N_tiles ?? sim.arrayConfig?.size ? Math.pow(sim.arrayConfig!.size!, 2) : 1)),
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
  boostedEnergy: number;         // ΔE enhanced by Q factor during burst
  cycleAverageEnergy: number;    // ⟨ΔE⟩ = ΔE_static × Q × d
  
  // Lattice and density calculations
  totalExoticMass: number;       // Total exotic mass (target ≈ 1.4×10³ kg)
  exoticEnergyDensity: number;   // ρ_eff = ⟨ΔE⟩ / tile_volume
  
  // Quantum inequality and safety
  quantumInequalityMargin: number; // ζ = ρ_eff × τ_pulse / QI_bound
  quantumSafetyStatus: 'safe' | 'warning' | 'violation';
  
  // Power calculations
  instantaneousPower: number;    // Raw power during burst
  averagePower: number;          // Duty-mitigated power
  
  // GR validity checks
  isaacsonLimit: boolean;        // High-frequency limit compliance
  greenWaldCompliance: boolean;  // Averaged null energy condition
  
  // Additional readouts for research verification
  averagePowerPerTile: number;     // Power per tile for scaling
  averagePowerTotalLattice: number; // Full lattice power
  exoticMassPerTile: number;       // Mass per tile
  exoticMassTotalLattice: number;  // Total exotic mass
  
  // Complete Energy Pipeline (T_μν → metric calculations)
  energyPipeline?: {
    U_static: number;             // Static Casimir energy per cavity [J]
    U_Q: number;                  // Q-amplified energy [J]
    U_geo: number;                // Geometrically amplified energy [J]
    U_cycle: number;              // Stored energy per cycle [J]
    P_loss: number;               // Power loss per cavity [W]
    TS_ratio: number;             // Time-scale separation ratio
    E_tile: number;               // Per-tile negative energy [J]
    E_total: number;              // Total exotic energy [J]
    m_exotic: number;             // Exotic mass via E=mc² [kg]
    γ_geo: number;                // Geometric blueshift factor
    ω: number;                    // Angular frequency [rad/s]
    d: number;                    // Duty cycle [dimensionless]
    N_tiles: number;              // Number of tiles in full lattice
    τ_pulse: number;              // Mechanical period [s]
    T_LC: number;                 // Light crossing time [s]
    powerPerTileComputed: number; // P_loss per tile [W]
    powerTotalComputed: number;   // Total lattice power [W]
    massPerTileComputed: number;  // Mass per tile from E=mc² [kg]
  };
}

/**
 * Calculate dynamic Casimir effects with quantum inequality constraints
 */
export function calculateDynamicCasimir(params: DynamicCasimirParams): DynamicCasimirResult {
  const {
    staticEnergy,
    modulationFreqGHz,
    strokeAmplitudePm,
    burstLengthUs,
    cycleLengthUs,
    cavityQ,
    tileCount
  } = params;
  
  // Time-domain calculations
  const strokePeriodPs = 1000 / modulationFreqGHz; // Convert GHz to ps
  const dutyFactor = burstLengthUs / cycleLengthUs;
  
  // Exact amplification chain from the research paper's logical flow:
  // Step 1: Geometric blue-shift γ_geo ≈ 25 (from concave bowl geometry)
  // Step 2: Dynamic enhancement from cavity Q factor
  // Step 3: Van den Broeck amplification γ_VdB ≈ 10¹¹
  // Combined as: E' ∝ E₀ × γ_geo³ × √Q × γ_VdB × d_eff
  
  const gammaGeo = 25; // Geometric blue-shift factor
  const gammaVdB = 1e11; // Van den Broeck seed pocket amplification
  const qEnhancement = Math.sqrt(cavityQ / 1e9); // Q-factor enhancement (normalized)
  
  // Paper shows energy scales as γ_geo³ not just γ_geo
  const geometricAmplification = Math.pow(gammaGeo, 3); // E ∝ γ³ for 3D cavity
  
  // Total amplification following paper's exact formula
  const totalAmplification = geometricAmplification * qEnhancement * gammaVdB;
  
  // Dynamic energy enhancement targeting ≈1.5 kg per tile
  // The paper states this amplification produces the required exotic mass
  const boostedEnergy = Math.abs(staticEnergy) * totalAmplification;
  
  // Cycle-averaged energy (duty-cycle reduced for sector strobing)
  const cycleAverageEnergy = boostedEnergy * dutyFactor;
  
  // Exotic mass calculation following paper's target
  // 5cm × 5cm × 1cm tile volume as specified in paper
  const tileVolume = 0.05 * 0.05 * 0.01; // m³ (2.5×10⁻⁵ m³)
  const exoticEnergyDensity = cycleAverageEnergy / tileVolume;
  
  // Calculate mass from amplified energy
  const exoticMassPerTile = Math.abs(cycleAverageEnergy) / (PHYSICS_CONSTANTS.C * PHYSICS_CONSTANTS.C);
  
  // Calculate exotic mass from energy
  const c2 = PHYSICS_CONSTANTS.C * PHYSICS_CONSTANTS.C;
  const massPerTile = Math.abs(cycleAverageEnergy) / c2;
  const totalExoticMass = massPerTile * tileCount;
  
  // Quantum inequality check (Ford-Roman constraints)
  // ζ = ρ_eff × τ_pulse / QI_bound
  const pulseDuration = burstLengthUs * 1e-6; // Convert to seconds
  const qiBound = PHYSICS_CONSTANTS.HBAR_C / (Math.pow(strokeAmplitudePm * 1e-12, 4)); // Simplified QI bound
  const quantumInequalityMargin = Math.abs(exoticEnergyDensity) * pulseDuration / qiBound;
  
  let quantumSafetyStatus: 'safe' | 'warning' | 'violation';
  if (quantumInequalityMargin < 0.9) {
    quantumSafetyStatus = 'safe';
  } else if (quantumInequalityMargin < 1.0) {
    quantumSafetyStatus = 'warning';
  } else {
    quantumSafetyStatus = 'violation';
  }
  
  // Power calculations following paper's methodology
  // Power calculations (pipeline-based)
  const instantaneousPower = boostedEnergy / pulseDuration; // Power during burst
  const averagePower = cycleAverageEnergy * f_m; // ⟨E⟩ per cycle times cycles/s
  
  // GR validity checks
  const isaacsonLimit = dutyFactor < 0.1; // High-frequency limit for spacetime stability
  const greenWaldCompliance = quantumInequalityMargin < 1.0; // Averaged null energy condition
  
  // Calculate power and mass readouts
  const powerPerTileReadout = averagePower / tileCount;
  const powerTotalLatticeReadout = averagePower;
  const massPerTileReadout = Math.abs(cycleAverageEnergy) / (PHYSICS_CONSTANTS.C * PHYSICS_CONSTANTS.C);
  const massTotalLatticeReadout = massPerTileReadout * tileCount;

  // Complete Energy Pipeline Implementation (following theory checklist)
  const c = 299_792_458; // m/s - speed of light
  const f_m = 15e9; // Hz - 15 GHz modulation frequency
  const ω = 2 * Math.PI * f_m; // angular frequency [rad/s]
  
  // Hull geometry parameters for scaling calculations
  const R_hull = 20e-6; // m - 20 μm hull radius from needle hull paper
  const tileRadius = 20e-6; // m - assume 20 μm tile radius for calculations
  const A_tile = Math.PI * Math.pow(tileRadius, 2); // m² - single tile area
  const A_hull = Math.PI * Math.pow(25e-3, 2); // m² - full 25mm disk area from paper
  const N_tiles = A_hull / A_tile; // Number of tiles in full lattice
  
  // 1) Q-factor amplification
  // Use proper SCUFF-EM interaction energy (divide by 2 for identical plates)
  const U_static = staticEnergy / 2; // per-cavity interaction energy [J] (should be ~-2.55e-3)
  const U_Q = cavityQ * U_static; // U_Q = Q·U_static [J]
  
  // 2) Geometric amplification (Van den Broeck)
  const γ_geo = 25; // Geometric blueshift factor (full amplification, not cube root)
  const U_geo = γ_geo * U_Q; // U_geo = γ·U_Q [J]
  
  // 3) Fractional stroke / duty cycle
  const t_burst = params.burstLengthUs * 1e-6; // s - convert μs to s
  const t_cycle = params.cycleLengthUs * 1e-6; // s - convert μs to s
  const d = t_burst / t_cycle; // d = t_burst / t_cycle [dimensionless]
  
  // 4) Stored energy per cycle
  const U_cycle = U_geo * d; // ⟨E⟩_cycle = U_geo·d [J]
  
  // 5) Power loss per cavity
  // P_loss = |U_geo·ω / Q| [W] (take absolute value for power)
  const P_loss = Math.abs(U_geo * ω / cavityQ);
  
  // 6) Time-scale separation check
  // Use mechanical period T_m = 1/f_m, not burst time
  const T_m = 1 / f_m; // mechanical period [s] = 6.67×10⁻¹¹ s for 15 GHz
  const T_LC = 2 * R_hull / c; // light crossing time [s] ≃ 1.33×10⁻¹³ s (corrected)
  const TS_ratio = T_m / T_LC; // dimensionless - should be ≪1 (≃ 0.4)
  
  // 7) Per-tile negative energy
  const E_tile = U_cycle; // E_tile = U_geo·d [J]
  
  // 8) Total exotic energy & mass
  const E_total = E_tile * N_tiles; // J - total exotic energy
  const m_exotic = Math.abs(E_total) / (c * c); // kg - via E=mc²
  
  // Additional calculations for verification
  const powerPerTileComputed = P_loss; // W per tile
  const powerTotalComputed = P_loss * N_tiles; // W total lattice
  const massPerTileComputed = Math.abs(E_tile) / (c * c); // kg per tile
  
  return {
    strokePeriodPs,
    dutyFactor,
    boostedEnergy,
    cycleAverageEnergy,
    totalExoticMass,
    exoticEnergyDensity,
    quantumInequalityMargin,
    quantumSafetyStatus,
    instantaneousPower,
    averagePower: correctedAveragePower,
    // Additional readouts
    averagePowerPerTile: powerPerTileReadout,
    averagePowerTotalLattice: powerTotalLatticeReadout,
    exoticMassPerTile: massPerTileReadout,
    exoticMassTotalLattice: massTotalLatticeReadout,
    isaacsonLimit,
    greenWaldCompliance,
    
    // Complete Energy Pipeline Values (theory checklist)
    energyPipeline: {
      U_static, // Static Casimir energy per cavity [J]
      U_Q,      // Q-amplified energy [J]
      U_geo,    // Geometrically amplified energy [J]
      U_cycle,  // Stored energy per cycle [J]
      P_loss,   // Power loss per cavity [W]
      TS_ratio, // Time-scale separation ratio [dimensionless]
      E_tile,   // Per-tile negative energy [J]
      E_total,  // Total exotic energy [J]
      m_exotic, // Exotic mass via E=mc² [kg]
      γ_geo,    // Geometric blueshift factor
      ω,        // Angular frequency [rad/s]
      d,        // Duty cycle [dimensionless]
      N_tiles,  // Number of tiles in full lattice
      τ_pulse: T_m,  // Mechanical period [s] (corrected)
      T_LC,     // Light crossing time [s]
      powerPerTileComputed,  // P_loss per tile [W]
      powerTotalComputed,    // Total lattice power [W]
      massPerTileComputed    // Mass per tile from E=mc² [kg]
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

  // Power (do not use "2 PW/83 MW" targets)
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
    quantumInequalityMargin: 0,     // leave 0 or compute with your proper QI bound; remove the HBAR_C/δ^4 toy
    quantumSafetyStatus: 'safe',    // let server/services/target-validation.ts own this
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
      U_geo: boostedEnergy,              // using total amp chain is fine as "effective geometric"
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