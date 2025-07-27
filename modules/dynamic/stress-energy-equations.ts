/**
 * Stress-Energy Tensor Calculations for Van den Broeck-Natário Metric
 * Direct implementation of equations from the research paper's logical flow
 */

import { PHYSICS_CONSTANTS } from '../core/physics-constants.js';

// Physical constants from the paper
const G = 6.67430e-11; // Gravitational constant
const BASE_ENERGY_DENSITY = -4.3e8; // J/m³ (from paper for 1 nm gap)

/**
 * Step 1: Static Casimir Energy Density
 * From parallel plate formula: ρ₀ = -π²ℏc/(720a³)
 */
export function calculateStaticEnergyDensity(gapMeters: number): number {
  const a3 = Math.pow(gapMeters, 3);
  const prefactor = Math.PI * Math.PI * PHYSICS_CONSTANTS.HBAR_C / 720;
  return -prefactor / a3;
}

/**
 * Step 2: Geometric Amplification (γ_geo³)
 * For concave bowl: γ_geo = a₀/a_eff ≈ 25
 * Energy scales as γ_geo³ in 3D
 */
export function calculateGeometricAmplification(
  originalGap: number,
  effectiveGap: number
): number {
  const gammaGeo = originalGap / effectiveGap;
  return Math.pow(gammaGeo, 3);
}

/**
 * Step 3: Dynamic Enhancement from Q factor
 * Energy boost during cavity resonance: √(Q/Q₀)
 */
export function calculateQEnhancement(cavityQ: number): number {
  const referenceQ = 1e9; // Reference Q factor
  return Math.sqrt(cavityQ / referenceQ);
}

/**
 * Step 4: Van den Broeck Amplification
 * Seed pocket amplification factor: γ_VdB ≈ 10¹¹
 */
export function getVanDenBroeckFactor(): number {
  return 1e11; // From paper
}

/**
 * Step 5: Sector Strobing Duty Factor
 * d_eff = d_local / S = 0.01 / 400 = 2.5×10⁻⁵
 */
export function calculateEffectiveDuty(
  localDuty: number,
  sectorCount: number
): number {
  return localDuty / sectorCount;
}

/**
 * Step 6: Total Enhanced Energy Density
 * ρ_enhanced = ρ₀ × γ_geo³ × √Q × γ_VdB × d_eff
 */
export function calculateEnhancedEnergyDensity(
  baseEnergyDensity: number,
  geometricAmplification: number,
  qEnhancement: number,
  vanDenBroeckFactor: number,
  effectiveDuty: number
): number {
  return baseEnergyDensity * geometricAmplification * qEnhancement * vanDenBroeckFactor * effectiveDuty;
}

/**
 * Step 7: Stress-Energy Tensor Components
 * T₀₀ = ρ (energy density)
 * T₁₁ = T₂₂ = T₃₃ = -ρ (exotic matter pressure, w = -1)
 */
export function calculateStressEnergyTensor(enhancedEnergyDensity: number): {
  T00: number; // Energy density
  T11: number; // Pressure (radial)
  T22: number; // Pressure (tangential)
  T33: number; // Pressure (tangential)
} {
  return {
    T00: enhancedEnergyDensity,           // ρ (negative for exotic matter)
    T11: -enhancedEnergyDensity,          // -ρ (positive pressure)
    T22: -enhancedEnergyDensity,          // -ρ (positive pressure)  
    T33: -enhancedEnergyDensity           // -ρ (positive pressure)
  };
}

/**
 * Step 8: Van den Broeck Metric Functions
 * f(r) and θ(r) functions for the warp bubble
 */
export function calculateMetricFunctions(
  radius: number,
  bubbleRadius: number,
  wallThickness: number
): { f: number; theta: number } {
  const sigma = wallThickness;
  const rs = bubbleRadius;
  
  // Smooth top-hat function for Van den Broeck metric
  const x = (radius - rs) / sigma;
  
  let f: number, theta: number;
  
  if (Math.abs(x) <= 1) {
    // Inside transition region
    const tanhTerm = Math.tanh(sigma * (radius - rs + sigma));
    const tanhTerm2 = Math.tanh(sigma * (radius - rs - sigma));
    f = (tanhTerm - tanhTerm2) / 2;
    theta = f; // For Van den Broeck metric
  } else if (radius < rs - sigma) {
    // Inside bubble
    f = 1;
    theta = 1;
  } else {
    // Outside bubble  
    f = 0;
    theta = 0;
  }
  
  return { f, theta };
}

/**
 * Step 9: Natário Shift Vector
 * β(t) = β₀ × sin(ωt) × f(r) for time-dependent shift
 */
export function calculateNatarioShift(
  stressEnergyT00: number,
  hullRadius: number,
  sectorDuty: number
): number {
  // From Van den Broeck-Natário formulation
  const eightPiG = 8 * Math.PI * G;
  const cSquared = PHYSICS_CONSTANTS.C * PHYSICS_CONSTANTS.C;
  
  // Shift amplitude from stress-energy tensor
  const energyDensityMagnitude = Math.abs(stressEnergyT00);
  const baseShift = Math.sqrt((eightPiG * energyDensityMagnitude) / cSquared) * hullRadius;
  
  // Time-averaged shift for sector strobing
  return baseShift * Math.sqrt(sectorDuty);
}

/**
 * Step 10: Exotic Mass Calculation
 * M_exotic = ∫ ρ dV over the hull volume
 */
export function calculateExoticMass(
  energyDensity: number,
  hullVolume: number
): number {
  // Total exotic mass from energy density integration
  const totalEnergy = Math.abs(energyDensity) * hullVolume;
  return totalEnergy / (PHYSICS_CONSTANTS.C * PHYSICS_CONSTANTS.C);
}