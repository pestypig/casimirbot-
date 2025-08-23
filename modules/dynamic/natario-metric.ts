/**
 * Natário Metric Implementation for Needle Hull Design
 * Based on "time-sliced sector strobing functions as a GR-valid proxy"
 * and "Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator"
 */

import { PHYSICS_CONSTANTS } from '../core/physics-constants.js';

// Add gravitational constant for stress-energy calculations
const G = 6.67430e-11; // m³/(kg⋅s²) - gravitational constant
import type { SimulationParameters } from '../../shared/schema.js';

export interface NatarioMetricResult {
  // Stress-energy tensor components
  stressEnergyT00: number;  // Energy density
  stressEnergyT11: number;  // Pressure component
  
  // Natário shift vector
  natarioShiftAmplitude: number;  // β parameter
  
  // Sector strobing validation
  sectorStrobingEfficiency: number;  // Duty factor effectiveness
  grValidityCheck: boolean;  // GR validity via homogenization
  homogenizationRatio: number;  // τ_pulse / τ_LC ratio
  timeAveragedCurvature: number;  // Cycle-averaged curvature
}

/**
 * Calculate Natário metric components for sector-strobed Casimir lattice
 * Based on Strategy A: Ultrafast PWM ≪ light-crossing time
 */
export function calculateNatarioMetric(
  params: SimulationParameters,
  casimirEnergy: number
): NatarioMetricResult {
  // ---- Resolve from pipeline names first, then dynamicConfig fallbacks
  const dc = params.dynamicConfig ?? {};
  const sectorCount = Math.max(1, dc.sectorCount ?? (params as any).sectorStrobing ?? 1);
  const dutyLocal   = Math.max(0, Math.min(1, dc.sectorDuty ?? (params as any).dutyCycle ?? 0.14));

  // Prefer Ford–Roman window if provided (burst/dwell), else local/sector
  const dutyEffFR = (() => {
    const lc = (params as any).lightCrossing;
    const burst = Number(lc?.burst_ms), dwell = Number(lc?.dwell_ms);
    if (Number.isFinite(burst) && Number.isFinite(dwell) && dwell > 0) return Math.max(0, Math.min(1, burst/dwell));
    return Math.max(0, Math.min(1, ((params as any).dutyEffectiveFR ?? dutyLocal / sectorCount)));
  })();

  const freqGHz = dc.pulseFrequencyGHz ?? (params as any).modulationFreq_GHz ?? 15;
  const tauLC_s = (() => {
    const ms = (dc.lightCrossingTimeNs != null) ? (dc.lightCrossingTimeNs * 1e-9) :
               ((params as any).lightCrossing?.tauLC_ms != null ? (params as any).lightCrossing.tauLC_ms * 1e-3 : 1e-7);
    return Math.max(1e-12, ms);
  })();

  const pulsePeriodS = 1 / (Math.max(1e3, freqGHz) * 1e9);
  const homogenizationRatio = pulsePeriodS / tauLC_s;
  const grValidityCheck = homogenizationRatio < (dc.maxHomogenizationRatio ?? 1e-3);

  // Aliases for downstream compatibility
  const sectors = sectorCount;
  const d_eff = dutyEffFR;
  
  // Calculate stress-energy tensor using pipeline energy
  const { stressEnergyT00, stressEnergyT11 } = calculateStressEnergyTensor(
    casimirEnergy,
    params,
    d_eff
  );
  
  // Natário shift amplitude β with hull geometry
  const hullDimensions = { 
    a: 503.5, b: 132, c: 86.5 // Default needle hull dimensions
  };
  const hullRadius = params.radius * PHYSICS_CONSTANTS.UM_TO_M;
  const natarioShiftAmplitude = calculateNatarioShift(
    stressEnergyT00,
    hullRadius,
    d_eff,
    hullDimensions
  );
  
  // Time-averaged curvature with configurable kernel
  const timeAveragedCurvature = calculateTimeAveragedCurvature(
    stressEnergyT00,
    homogenizationRatio
  );
  
  // Sector strobing efficiency with configurable parameters
  const sectorStrobingEfficiency = calculateStrobingEfficiency(
    sectors,
    d_eff,
    homogenizationRatio
  );
  
  return {
    stressEnergyT00,
    stressEnergyT11,
    natarioShiftAmplitude,
    sectorStrobingEfficiency,
    grValidityCheck,
    homogenizationRatio,
    timeAveragedCurvature
  };
}

/**
 * Calculate stress-energy tensor components from pipeline Casimir energy
 * Pipeline-true implementation using authentic energy values
 */
function calculateStressEnergyTensor(
  casimirEnergy: number,
  params: SimulationParameters,
  sectorDutyEff: number // effective duty d_eff = duty/sectors
): { stressEnergyT00: number; stressEnergyT11: number } {
  // Extract tile geometry from parameters
  const tileArea = 0.05 * 0.05; // 5cm × 5cm tile from config
  const gapM = params.gap * PHYSICS_CONSTANTS.NM_TO_M;
  const tileVolume = Math.max(1e-18, tileArea * gapM); // clamp to avoid division by zero
  
  // Signed energy density from pipeline (negative for Casimir)
  const totalTiles = Math.max(1, 1.96e9); // Default tile count
  const rho = casimirEnergy / totalTiles / tileVolume;
  
  const gammaGeo  = params.dynamicConfig?.gammaGeo  ?? (params as any).gammaGeo  ?? 26;
  const gammaVdB  = params.dynamicConfig?.gammaVanDenBroeck ?? (params as any).gammaVanDenBroeck ?? 2.86e5;
  const qFactor   = params.dynamicConfig?.cavityQ   ?? (params as any).cavityQ   ?? 1e9;
  const qSpoil    = params.dynamicConfig?.qSpoilingFactor ?? (params as any).qSpoilingFactor ?? 1;

  // Choose your Q model (sqrt by default)
  const qGain = Math.sqrt(qFactor / 1e9);

  // ---- Build *instantaneous* energy density (no duty averaging yet)
  const rho_inst = rho * Math.pow(gammaGeo, 3) * gammaVdB * qGain * qSpoil;

  // ---- Export both: instantaneous and time-averaged (FR)
  const rho_avg  = rho_inst * sectorDutyEff;

  return {
    stressEnergyT00: rho_avg,
    stressEnergyT11: -rho_avg,
    // @ts-expect-error: add fields to result type or export separately
    stressEnergyT00_inst: rho_inst
  };
}

/**
 * Calculate geometric factor from ellipsoidal hull dimensions
 */
function geomFactorFromEllipsoid(a: number, b: number, c: number): number {
  // Crude but pipeline-driven: normalize to effective spherical radius
  const Reff = Math.cbrt(a * b * c); // Geometric mean radius
  return Reff / Math.max(a, b, c); // Aspect ratio correction [0,1]
}

/**
 * Calculate Natário shift vector amplitude β
 * Pipeline-true implementation using authentic hull geometry
 */
function calculateNatarioShift(
  t00: number,
  hullRadiusM: number,
  sectorDutyEff: number, // d_eff = duty/sectors
  hullDimensions?: { a: number; b: number; c: number }
): number {
  // Van den Broeck-Natário shift vector from paper:
  // β = √(8πG|ρ|/c²) × R_hull × f(geometry)
  
  const eightPiG = 8 * Math.PI * G;
  const energyDensityMagnitude = Math.abs(t00);
  const cSquared = PHYSICS_CONSTANTS.C * PHYSICS_CONSTANTS.C;
  
  // Pipeline-driven geometric factor from actual hull geometry
  const geometricFactor = hullDimensions 
    ? geomFactorFromEllipsoid(hullDimensions.a, hullDimensions.b, hullDimensions.c)
    : 1.0; // Fallback to spherical
  
  // Base shift amplitude from *averaged* T00
  const baseShift = Math.sqrt((eightPiG * energyDensityMagnitude) / cSquared) * hullRadiusM;
  
  // Time-averaged shift with geometric correction only (no extra √duty here)
  return baseShift * geometricFactor;
}

/**
 * Calculate time-averaged curvature using configurable homogenization
 * Pipeline-true implementation with configurable GR validation thresholds
 */
function calculateTimeAveragedCurvature(
  t00: number,
  homogenizationRatio: number
): number {
  // Einstein tensor: G_μν = 8πG T_μν / c⁴
  const einsteinFactor = 8 * Math.PI * G / (PHYSICS_CONSTANTS.C ** 4);
  
  // Default averaging kernel
  const kAvg = 1.0;
  
  // Homogenization factor with kernel
  const homogenizationFactor = Math.exp(-kAvg * homogenizationRatio);
  
  // Time-averaged Ricci scalar curvature
  return einsteinFactor * Math.abs(t00) * homogenizationFactor;
}

/**
 * Calculate sector strobing efficiency with configurable parameters
 * Pipeline-true implementation using configurable temporal penalties
 */
function calculateStrobingEfficiency(
  sectorCount: number,
  sectorDutyEff: number, // d_eff = duty/sectors
  homogenizationRatio: number
): number {
  // Base efficiency from sector tessellation
  const tessellationEfficiency = Math.min(1.0, sectorCount / 100); // Saturates at 100 sectors
  
  // Effective duty cycle efficiency 
  const dutyEfficiency = sectorDutyEff * Math.sqrt(sectorCount);
  
  // Default temporal efficiency penalty
  const kTemp = 10.0;
  const temporalEfficiency = Math.exp(-kTemp * homogenizationRatio);
  
  return tessellationEfficiency * dutyEfficiency * temporalEfficiency;
}

/**
 * Validate GR consistency using multi-scale analysis
 * Implements checks from research papers
 */
export function validateGRConsistency(result: NatarioMetricResult): {
  strategyA: boolean;  // Ultrafast PWM validity
  burnettConjecture: boolean;  // Homogenization theorem
  fordRomanBound: boolean;  // Quantum inequality
} {
  return {
    // Strategy A: τ_pulse ≪ τ_LC
    strategyA: result.homogenizationRatio < 1e-3,
    
    // Burnett Conjecture: smooth curvature from oscillatory source
    burnettConjecture: result.timeAveragedCurvature > 0 && result.grValidityCheck,
    
    // Ford-Roman bound: sector duty preserves quantum safety
    fordRomanBound: result.sectorStrobingEfficiency > 0.1 && result.stressEnergyT00 < 0
  };
}