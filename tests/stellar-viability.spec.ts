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
        wavelength_m: seed.wavelength_m,
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
        wavelength_m: seed.wavelength_m,
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

  it("tracks best-fit winner separately from promotable winner when the lowest-score model fails contract", () => {
    const seed = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
      structure: { xi: 1, alpha_xi: 0, d_eff: 1e-12, A_ml: 0, material_gate: true },
    });
    const m0 = seed.models.find((entry) => entry.id === "M0_planck_atmosphere");
    expect(m0).toBeDefined();

    const report = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
      observation: {
        wavelength_m: seed.wavelength_m,
        intensity: m0?.predicted_intensity ?? new Float64Array(),
        polarization: Float64Array.from({ length: seed.wavelength_m.length }, () => 0.05),
      },
      structure: { xi: 1, alpha_xi: 0, d_eff: 1e-12, A_ml: 0, material_gate: true },
      weights: {
        continuum: 1,
        uv: 0,
        line: 0,
        bolometric: 0,
        anisotropy: 0,
        polarization: 0,
      },
    });

    const bestFit = report.models.find((entry) => entry.id === report.best_fit_winner);
    const promotable = report.models.find((entry) => entry.id === report.promotable_winner);
    expect(bestFit?.passes_contract).toBe(false);
    expect(promotable?.passes_contract).toBe(true);
    expect(report.promotable_winner).not.toBe(report.best_fit_winner);
    expect(report.winner).toBe(report.promotable_winner);
  });

  it("sets promotable winner to null and falls back to M0 when all models fail the contract", () => {
    const wavelengths = makeWavelengthGrid();
    const report = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
      observation: {
        wavelength_m: wavelengths,
        intensity: Float64Array.from({ length: wavelengths.length }, () => 0),
      },
    });
    expect(report.models.every((entry) => entry.passes_contract === false)).toBe(true);
    expect(report.promotable_winner).toBeNull();
    expect(report.fallback_winner).toBe("M0_planck_atmosphere");
    expect(report.winner).toBe(report.fallback_winner);
  });

  it("keeps M1 and M3 bolometric flux matched to M0 by default", () => {
    const report = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
      structure: {
        xi: 0.95,
        alpha_xi: 0.75,
        Q_coh: 10,
      },
    });
    const m0 = report.models.find((entry) => entry.id === "M0_planck_atmosphere");
    const m1 = report.models.find((entry) => entry.id === "M1_lattice_emissivity");
    const m3 = report.models.find((entry) => entry.id === "M3_coherence_angular");
    expect(m0).toBeDefined();
    expect(m1).toBeDefined();
    expect(m3).toBeDefined();
    const flux0 = m0?.bolometric_flux_W_m2 ?? 0;
    expect(Math.abs((m1?.bolometric_flux_W_m2 ?? 0) - flux0) / flux0).toBeLessThan(1e-10);
    expect(Math.abs((m3?.bolometric_flux_W_m2 ?? 0) - flux0) / flux0).toBeLessThan(1e-10);
  });

  it("keeps M1 and M3 flux-conserving even when M2 source power is enabled", () => {
    const baseInput = {
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
      structure: {
        xi: 0.95,
        alpha_xi: 0.75,
        Q_coh: 10,
        d_eff: 2e-12,
        A_ml: 0.9,
        pressure_proxy_Pa: 5e8,
        stress_rate_proxy_Pa_s: 4e8,
        trap_density_m3: 6e20,
        material_gate: true,
      },
    };
    const report = evaluateStellarSpectralViability({
      ...baseInput,
      structure: { ...baseInput.structure, m2_source_power_enabled: true },
    });
    const reportWithoutM2Source = evaluateStellarSpectralViability({
      ...baseInput,
      structure: { ...baseInput.structure, m2_source_power_enabled: false },
    });

    const m0 = report.models.find((entry) => entry.id === "M0_planck_atmosphere");
    const m1 = report.models.find((entry) => entry.id === "M1_lattice_emissivity");
    const m2 = report.models.find((entry) => entry.id === "M2_mechanoluminescent_pressure");
    const m3 = report.models.find((entry) => entry.id === "M3_coherence_angular");
    const m2WithoutSource = reportWithoutM2Source.models.find((entry) => entry.id === "M2_mechanoluminescent_pressure");
    expect(m0).toBeDefined();
    expect(m1).toBeDefined();
    expect(m2).toBeDefined();
    expect(m3).toBeDefined();
    expect(m2WithoutSource).toBeDefined();

    const flux0 = m0?.bolometric_flux_W_m2 ?? 0;
    const m1Closure = Math.abs((m1?.bolometric_flux_W_m2 ?? 0) - flux0) / flux0;
    const m3Closure = Math.abs((m3?.bolometric_flux_W_m2 ?? 0) - flux0) / flux0;
    expect(m1Closure).toBeLessThan(1e-10);
    expect(m3Closure).toBeLessThan(1e-10);
    expect(m2?.bolometric_flux_W_m2).not.toBeCloseTo(m2WithoutSource?.bolometric_flux_W_m2 ?? 0, 12);
  });

  it("separates continuum and line residual metrics when no line mask is supplied", () => {
    const wavelengths = makeWavelengthGrid();
    const report = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
      observation: {
        wavelength_m: wavelengths,
        intensity: Float64Array.from(wavelengths, (_, index) => (index % 2 === 0 ? 1.1 : 0.9)),
        continuum_mask: Float64Array.from(wavelengths, (_, index) => (index % 2 === 0 ? 1 : 0)),
      },
    });
    const m0 = report.models.find((entry) => entry.id === "M0_planck_atmosphere");
    expect(m0?.metrics.continuum_rms).toBeGreaterThan(0);
    expect(m0?.metrics.line_residual).toBeNull();
  });

  it("requires explicit M2 material gate and prevents M2 wins when the gate is off", () => {
    const seed = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
      structure: {
        xi: 0.6,
        d_eff: 2e-12,
        A_ml: 0.8,
        pressure_proxy_Pa: 5e8,
        stress_rate_proxy_Pa_s: 4e8,
        trap_density_m3: 6e20,
        material_gate: true,
      },
    });
    const m2Seed = seed.models.find((entry) => entry.id === "M2_mechanoluminescent_pressure");
    expect(m2Seed).toBeDefined();

    const gatedOff = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
      observation: {
        wavelength_m: makeWavelengthGrid(),
        intensity: m2Seed?.predicted_intensity ?? new Float64Array(),
      },
      structure: {
        xi: 0.6,
        d_eff: 2e-12,
        A_ml: 0.8,
        pressure_proxy_Pa: 5e8,
        stress_rate_proxy_Pa_s: 4e8,
        trap_density_m3: 6e20,
        material_gate: false,
      },
    });

    const m2 = gatedOff.models.find((entry) => entry.id === "M2_mechanoluminescent_pressure");
    expect(m2?.predicted_anisotropy).toBe(0);
    expect(gatedOff.winner).not.toBe("M2_mechanoluminescent_pressure");
  });

  it("uses the observation-driven wavelength grid for band-limited inputs", () => {
    const wavelengths = Float64Array.from({ length: 48 }, (_, index) => 420e-9 + index * 4e-9);
    const observation = Float64Array.from({ length: wavelengths.length }, () => 1);
    const report = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
      observation: {
        wavelength_m: wavelengths,
        intensity: observation,
      },
    });
    expect(report.models[0]?.predicted_intensity.length).toBe(48);
  });

  it("uses a log-spaced fallback wavelength grid when no observation is provided", () => {
    const report = evaluateStellarSpectralViability({
      luminosity_W: SOLAR_LUMINOSITY_W,
      radius_m: SOLAR_RADIUS_M,
    });
    expect(report.wavelength_m.length).toBe(256);
    const ratioA = report.wavelength_m[1] / report.wavelength_m[0];
    const ratioB = report.wavelength_m[128] / report.wavelength_m[127];
    expect(Math.abs(ratioA - ratioB)).toBeLessThan(1e-12);
  });
});
