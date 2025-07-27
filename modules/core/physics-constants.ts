/**
 * Fundamental Physics Constants for Casimir Calculations
 * Based on CODATA 2018 values for scientific accuracy
 */

export const PHYSICS_CONSTANTS = {
  // Fundamental constants
  HBAR: 1.0545718176461565e-34,  // Reduced Planck constant (J⋅s)
  C: 299792458,                   // Speed of light (m/s)
  KB: 1.380649e-23,             // Boltzmann constant (J/K)
  PI: Math.PI,                   // Pi
  
  // Derived constants for Casimir calculations
  HBAR_C: 1.0545718176461565e-34 * 299792458, // ℏc (J⋅m)
  
  // Casimir force prefactors
  PARALLEL_PLATE_PREFACTOR: Math.PI * Math.PI / 240, // π²/240 for Lifshitz formula
  SPHERE_PLATE_PREFACTOR: Math.PI * Math.PI * Math.PI / 240, // π³/240 for PFA
  
  // Unit conversions
  NM_TO_M: 1e-9,     // nanometers to meters
  UM_TO_M: 1e-6,     // micrometers to meters  
  PM_TO_M: 1e-12,    // picometers to meters
  MEV_TO_J: 1.602176634e-13, // meV to Joules
  
  // Material properties (for future expansion)
  VACUUM_PERMITTIVITY: 8.8541878128e-12, // ε₀ (F/m)
  VACUUM_PERMEABILITY: 1.25663706212e-6,  // μ₀ (H/m)
} as const;

/**
 * Calculate thermal length scale λT = ℏc/(kBT)
 */
export function thermalLength(temperatureK: number): number {
  return PHYSICS_CONSTANTS.HBAR_C / (PHYSICS_CONSTANTS.KB * temperatureK);
}

/**
 * Calculate characteristic frequency ωc = c/d for geometry
 */
export function characteristicFrequency(gapMeters: number): number {
  return PHYSICS_CONSTANTS.C / gapMeters;
}

/**
 * Calculate Matsubara frequencies ξn = 2πkBT n/ℏ
 */
export function matsubaraFrequency(n: number, temperatureK: number): number {
  return (2 * PHYSICS_CONSTANTS.PI * PHYSICS_CONSTANTS.KB * temperatureK * n) / PHYSICS_CONSTANTS.HBAR;
}