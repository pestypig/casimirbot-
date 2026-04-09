import { describe, expect, it } from "vitest";

import {
  computeEffectiveTemperature,
  evaluateStellarSpectralViability,
} from "../sim_core/stellar_viability";

const SOLAR_LUMINOSITY_W = 3.828e26;
const SOLAR_RADIUS_M = 6.957e8;

function makeWavelengthGrid(): Float64Array {
  const minLambda = 100e-9;
  const maxLambda = 10e-6;
  const count = 256;
  return Float64Array.from(
    Array.from({ length: count }, (_, index) => minLambda + ((maxLambda - minLambda) * index) / (count - 1)),
  );
}

describe("stellar viability contract", () => {
  it("recovers the solar blackbody-equivalent effective temperature from luminosity and radius", () => {
    const teff = computeEffectiveTemperature(SOLAR_LUMINOSITY_W, SOLAR_RADIUS_M);
    expect(teff).toBeCloseTo(5772, 0);
  });

  it("keeps the blackbody-plus-transfer null model as the winner for a blackbody-like spectrum", () => {
    const seed = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
    });
    const nullModel = seed.models.find((entry) => entry.id === "M0_planck_atmosphere");
    expect(nullModel).toBeDefined();

    const report = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
      observation: {
        wavelength_m: makeWavelengthGrid(),
        intensity: nullModel?.predicted_intensity ?? new Float64Array(),
      },
      structure: {
        xi: 0.4,
        alpha_xi: 0.25,
        d_eff: 1e-12,
        A_ml: 0.01,
        Q_coh: 4,
      },
    });

    expect(report.winner).toBe("M0_planck_atmosphere");
    expect(
      report.models.find((entry) => entry.id === "M0_planck_atmosphere")?.metrics.continuum_rms,
    ).toBeLessThan(1e-12);
  });

  it("promotes the lattice lane only when it improves the observed structured spectrum", () => {
    const seed = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
      structure: {
        xi: 0.8,
        alpha_xi: 0.35,
      },
    });
    const lattice = seed.models.find((entry) => entry.id === "M1_lattice_emissivity");
    expect(lattice).toBeDefined();

    const report = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
      observation: {
        wavelength_m: makeWavelengthGrid(),
        intensity: lattice?.predicted_intensity ?? new Float64Array(),
      },
      structure: {
        xi: 0.8,
        alpha_xi: 0.35,
      },
    });

    expect(report.winner).toBe("M1_lattice_emissivity");
    expect(
      report.models.find((entry) => entry.id === "M1_lattice_emissivity")?.metrics.continuum_rms,
    ).toBeLessThan(1e-12);
  });
});
