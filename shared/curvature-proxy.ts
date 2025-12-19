import { C, C2, G, PI } from "./physics-const";

/**
 * Curvature proxy contract (SI).
 *
 * These helpers provide the shared `kappa_*` conversions used across the project:
 * - `kappa_body(rho)`   = (8πG / (3c²)) ρ          [m^-2] from mass density ρ [kg/m^3]
 * - `kappa_drive(P/A)`  = (8πG / c⁵) (P/A) d_eff 𝓖 [m^-2] from power flux (P/A) [W/m^2]
 * - `kappa_u(u)`        = (8πG / c⁴) u            [m^-2] from energy density u [J/m^3]
 */

const C4 = C2 * C2;
const C5 = C4 * C;

export const curvatureProxyPrefactors = {
  drive: (8 * PI * G) / C5,
  body: (8 * PI * G) / (3 * C2),
  energy_density: (8 * PI * G) / C4,
} as const;

export function kappa_body(rho_kg_m3: number): number {
  if (!Number.isFinite(rho_kg_m3)) return Number.NaN;
  return curvatureProxyPrefactors.body * rho_kg_m3;
}

export function kappa_drive(powerFlux_W_m2: number, d_eff = 1, gain = 1): number {
  if (!Number.isFinite(powerFlux_W_m2) || !Number.isFinite(d_eff) || !Number.isFinite(gain)) {
    return Number.NaN;
  }
  return curvatureProxyPrefactors.drive * powerFlux_W_m2 * d_eff * gain;
}

export function kappa_drive_from_power(power_W: number, area_m2: number, d_eff = 1, gain = 1): number {
  if (!Number.isFinite(power_W) || !Number.isFinite(area_m2) || area_m2 <= 0) {
    return Number.NaN;
  }
  return kappa_drive(power_W / area_m2, d_eff, gain);
}

export function kappa_u(u_J_m3: number): number {
  if (!Number.isFinite(u_J_m3)) return Number.NaN;
  return curvatureProxyPrefactors.energy_density * u_J_m3;
}

