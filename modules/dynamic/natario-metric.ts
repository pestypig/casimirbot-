/**
 * Natário Metric Implementation for Needle Hull Design
 * Based on "time-sliced sector strobing functions as a GR-valid proxy"
 * and "Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator"
 */

import { PHYSICS_CONSTANTS } from '../core/physics-constants.js';

// Add gravitational constant for stress-energy calculations
const G = 6.67430e-11; // m³/(kg⋅s²) - gravitational constant
import type { SimulationParameters } from '../../shared/schema.js';

const clamp01 = (x: number, lo = 1e-12) => Math.max(lo, Math.min(1, Number(x) || 0));

export interface NatarioMetricResult {
  // Stress-energy tensor components
  stressEnergyT00: number;   // Energy density (time-averaged / FR)
  stressEnergyT11: number;   // Pressure component (principal)
  stressEnergyT00_inst?: number; // Instantaneous (no duty averaging), for diagnostics

  // Natário shift vector
  natarioShiftAmplitude: number;  // β parameter

  // Sector strobing validation
  sectorStrobingEfficiency: number;  // Duty factor effectiveness
  grValidityCheck: boolean;          // GR validity via homogenization
  homogenizationRatio: number;       // τ_pulse / τ_LC ratio
  timeAveragedCurvature: number;     // Cycle-averaged curvature
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

  // FIX: correct fallbacks (total sectors vs concurrent sectors)
  const sectorCount = Math.max(
    1,
    Number(dc.sectorCount ?? (params as any).sectorCount ?? 400)
  );
  const concurrentSectors = Math.max(
    1,
    Number(dc.concurrentSectors ?? (params as any).sectorStrobing ?? 1)
  );

  // Local (on-window) duty
  const dutyLocal = clamp01(dc.sectorDuty ?? (params as any).dutyCycle ?? 0.14);

  // Prefer authoritative Ford–Roman duty if provided; else derive
  // d_eff = dutyLocal × (S_live / S_total); or if burst/dwell present, use that ratio
  const dutyEffFR = (() => {
    const lc = (params as any).lightCrossing;
    const burst = Number(lc?.burst_ms);
    const dwell = Number(lc?.dwell_ms);
    if (Number.isFinite(burst) && Number.isFinite(dwell) && dwell > 0) {
      return clamp01(burst / dwell);
    }
    const provided = Number((params as any).dutyEffectiveFR);
    if (Number.isFinite(provided) && provided > 0) return clamp01(provided);
    return clamp01(dutyLocal * (concurrentSectors / sectorCount));
  })();

  // FIX: correct frequency clamp (GHz → Hz); allow low GHz, avoid 0
  const fGHz = Math.max(0.001, Number(dc.pulseFrequencyGHz ?? (params as any).modulationFreq_GHz ?? 15));
  const pulsePeriodS = 1 / (fGHz * 1e9);

  // Light-crossing time (seconds); prefer explicit ns, else pipeline packet ms, else 100 ns default
  const tauLC_s = (() => {
    if (dc.lightCrossingTimeNs != null) return Math.max(1e-12, Number(dc.lightCrossingTimeNs) * 1e-9);
    const lc = (params as any).lightCrossing;
    if (lc?.tauLC_ms != null) return Math.max(1e-12, Number(lc.tauLC_ms) * 1e-3);
    return 1e-7; // 100 ns default
  })();

  // Strategy A homogenization: want τ_pulse / τ_LC ≪ 1
  const homogenizationRatio = pulsePeriodS / tauLC_s;
  const grValidityCheck = homogenizationRatio < (dc.maxHomogenizationRatio ?? 1e-3);

  // Aliases for downstream compatibility
  const sectors = sectorCount;
  const d_eff = dutyEffFR;

  // Calculate stress-energy tensor using pipeline energy
  const { stressEnergyT00, stressEnergyT11, stressEnergyT00_inst } = calculateStressEnergyTensor(
    casimirEnergy,
    params,
    d_eff
  );

  // --- hull geometry in meters from pipeline
  const hull = (params as any).hull ?? { a: 503.5, b: 132, c: 86.5 };
  const hullRadiusM = Math.cbrt(hull.a * hull.b * hull.c); // effective radius ~ geometric mean

  const natarioShiftAmplitude = calculateNatarioShift(
    stressEnergyT00,
    hullRadiusM,
    d_eff,
    { a: hull.a, b: hull.b, c: hull.c }
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
    stressEnergyT00_inst,
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
  sectorDutyEff: number // effective duty d_eff = duty × (S_live/S_total)
): { stressEnergyT00: number; stressEnergyT11: number; stressEnergyT00_inst: number } {
  // --- tile geometry (prefer pipeline)
  const tileArea =
    Number((params as any).tileArea_m2) ||
    // default to 25 cm² tiles (0.05 m × 0.05 m = 0.0025 m²)
    0.05 * 0.05;

  const gapNm = Number((params as any).gap ?? (params as any).gap_nm ?? params.gap ?? 1);
  const gapM = Math.max(1e-12, gapNm * PHYSICS_CONSTANTS.NM_TO_M);

  const tileVolume = Math.max(1e-18, tileArea * gapM);
  const totalTiles = Math.max(1, Number((params as any).N_tiles ?? 1.96e9));

  // Signed energy density from pipeline (negative for Casimir)
  const rho_flat = casimirEnergy / totalTiles / tileVolume;

  // Gains (prefer pipeline/dynamicConfig names)
  const gammaGeo = Math.max(1, Number(params.dynamicConfig?.gammaGeo ?? (params as any).gammaGeo ?? 26));
  const gammaVdB = Math.max(
    1,
    Number(
      params.dynamicConfig?.gammaVanDenBroeck ??
      (params as any).gammaVanDenBroeck ??
      (params as any).gammaVdB ??
      1.4e5
    )
  );
  const qFactor = Math.max(1, Number(params.dynamicConfig?.cavityQ ?? (params as any).cavityQ ?? 1e9));
  const qSpoil = Math.max(
    1e-12,
    Number(
      params.dynamicConfig?.qSpoilingFactor ??
      (params as any).qSpoilingFactor ??
      (params as any).deltaAOverA ??
      1
    )
  );

  // Choose your Q model (sqrt by default)
  const qGain = Math.sqrt(qFactor / 1e9);

  // ---- Build *instantaneous* energy density (no duty averaging yet)
  const rho_inst = rho_flat * Math.pow(gammaGeo, 3) * gammaVdB * qGain * qSpoil;

  // ---- Export both: instantaneous and time-averaged (FR)
  const rho_avg = rho_inst * sectorDutyEff;

  return {
    stressEnergyT00: rho_avg,
    stressEnergyT11: -rho_avg,
    stressEnergyT00_inst: rho_inst
  };
}

/**
 * Calculate geometric factor from ellipsoidal hull dimensions
 */
function geomFactorFromEllipsoid(a: number, b: number, c: number): number {
  // Normalize to effective spherical radius vs longest semi-axis
  const Reff = Math.cbrt(a * b * c); // Geometric mean radius
  return Reff / Math.max(a, b, c);    // Aspect ratio correction [0,1]
}

/**
 * Calculate Natário shift vector amplitude β
 * Pipeline-true implementation using authentic hull geometry
 */
function calculateNatarioShift(
  t00: number,
  hullRadiusM: number,
  _sectorDutyEff: number, // d_eff provided if needed later
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
  const einsteinFactor = (8 * Math.PI * G) / (PHYSICS_CONSTANTS.C ** 4);

  // Default averaging kernel
  const kAvg = 1.0;

  // Homogenization factor with kernel (τ_pulse/τ_LC → 0 ⇒ factor → 1)
  const homogenizationFactor = Math.exp(-kAvg * homogenizationRatio);

  // Time-averaged Ricci scalar curvature proxy
  return einsteinFactor * Math.abs(t00) * homogenizationFactor;
}

/**
 * Calculate sector strobing efficiency with configurable parameters
 * Pipeline-true implementation using configurable temporal penalties
 */
function calculateStrobingEfficiency(
  sectorCount: number,
  sectorDutyEff: number, // This is the FR duty (burst/dwell or duty × S_live/S_total)
  homogenizationRatio: number
): number {
  const tessellationEfficiency = Math.min(1.0, sectorCount / 400); // saturate at grid size
  const dutyEfficiency = Math.sqrt(Math.max(0, sectorDutyEff));    // √d to match β scaling
  const kTemp = 10.0;
  const temporalEfficiency = Math.exp(-kTemp * homogenizationRatio);
  return tessellationEfficiency * dutyEfficiency * temporalEfficiency;
}

/**
 * Validate GR consistency using multi-scale analysis
 * Implements checks from research papers
 */
export function validateGRConsistency(result: NatarioMetricResult): {
  strategyA: boolean;       // Ultrafast PWM validity (τ_pulse ≪ τ_LC)
  burnettConjecture: boolean;  // Homogenization theorem proxy
  fordRomanBound: boolean;  // Quantum inequality proxy
} {
  return {
    // Strategy A: τ_pulse ≪ τ_LC
    strategyA: result.homogenizationRatio < 1e-3,

    // Burnett Conjecture: smooth curvature from oscillatory source
    burnettConjecture: result.timeAveragedCurvature > 0 && result.grValidityCheck,

    // Ford–Roman bound: sector duty preserves quantum safety (heuristic proxy)
    fordRomanBound: result.sectorStrobingEfficiency > 0.1 && result.stressEnergyT00 < 0
  };
}