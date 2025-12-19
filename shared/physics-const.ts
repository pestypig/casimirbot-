/**
 * Physics constants (shared).
 *
 * Goal: keep server + client + tooling numerically consistent and prevent drift.
 * Values follow CODATA 2018 where applicable.
 */

// Speed of light in vacuum (m/s).
export const C = 299_792_458;
export const C2 = C * C;

// Newtonian gravitational constant (m^3 kg^-1 s^-2).
export const G = 6.674_30e-11;

// Reduced Planck constant ħ (J·s).
export const HBAR = 1.054_571_817_646_156_5e-34;

export const PI = Math.PI;

