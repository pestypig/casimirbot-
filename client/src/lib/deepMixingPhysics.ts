// client/src/lib/deepMixingPhysics.ts
/**
 * Lightweight helpers for the Deep Mixing autopilot preset.
 * Provides the order-of-magnitude physics used to translate the operator
 * mixing strength (epsilon) into actionable actuator setpoints.
 */

export const AU_METERS = 1.496e11;
export const R_SUN_METERS = 6.957e8;
export const R_TACH_METERS = 0.70 * R_SUN_METERS;
export const RHO_TACH_KG_M3 = 200; // Representative tachocline density
export const DOTM_SUN_KG_S = 6.0e11; // Solar mass-loss rate (kg/s)

/**
 * Compute a radial downflow setpoint at the tachocline that satisfies the
 * requested mixing strength.
 *
 * dotM_mix = epsilon * dotm_sun = 4π r^2 ρ vr f
 *
 * @param epsilon - Fractional mixing strength (dotM_mix / dotm_sun)
 * @param areaFraction - Fraction of the actuator belt engaged (0..1)
 * @returns vr in meters/second
 */
export function vrSetpoint(epsilon: number, areaFraction = 0.1): number {
  const safeEpsilon = Math.max(0, epsilon);
  const safeArea = Math.max(1e-6, Math.min(1, areaFraction));
  const denom = 4 * Math.PI * R_TACH_METERS * R_TACH_METERS * RHO_TACH_KG_M3 * safeArea;
  return (safeEpsilon * DOTM_SUN_KG_S) / denom;
}

/**
 * Convenience helper for callers that need to inspect the implied mass flux.
 */
export function dotMmixFromVr(vr: number, areaFraction = 0.1): number {
  const safeArea = Math.max(1e-6, Math.min(1, areaFraction));
  return 4 * Math.PI * R_TACH_METERS * R_TACH_METERS * RHO_TACH_KG_M3 * vr * safeArea;
}
