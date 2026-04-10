import type { StellarCoverageMode, StellarSpectrumObservation } from "../../sim_core/stellar_viability";

export const SOLAR_LUMINOSITY_W = 3.828e26;
export const SOLAR_RADIUS_M = 6.957e8;

export interface StellarBenchmarkFixture {
  benchmark_id: string;
  coverage_mode: StellarCoverageMode;
  coverage_fraction: number;
  wavelength_m: Float64Array;
  continuum_mask?: Float64Array;
  uv_mask?: Float64Array;
  line_mask?: Float64Array;
  reference_flux_W_m2?: number;
}

export function makeWavelengthGrid(): Float64Array {
  const minLambda = 100e-9;
  const maxLambda = 10e-6;
  const count = 256;
  return Float64Array.from(
    Array.from({ length: count }, (_, index) => minLambda + ((maxLambda - minLambda) * index) / (count - 1)),
  );
}

export function makeVisibleBandGrid(): Float64Array {
  return Float64Array.from({ length: 64 }, (_, index) => 420e-9 + index * 5e-9);
}

export function makeUvHeavyBandGrid(): Float64Array {
  return Float64Array.from({ length: 72 }, (_, index) => 200e-9 + index * 2e-9);
}

export function makeLineFocusedOpticalGrid(): Float64Array {
  return Float64Array.from({ length: 96 }, (_, index) => 460e-9 + index * 2.2e-9);
}

export function makeContinuumMask(wavelengths: ArrayLike<number>): Float64Array {
  return Float64Array.from(wavelengths, (lambda) =>
    lambda >= 400e-9 &&
    lambda <= 2.5e-6 &&
    !((lambda >= 482e-9 && lambda <= 490e-9) || (lambda >= 650e-9 && lambda <= 660e-9))
      ? 1
      : 0,
  );
}

export function makeUvMask(wavelengths: ArrayLike<number>): Float64Array {
  return Float64Array.from(wavelengths, (lambda) => (lambda < 400e-9 ? 1 : 0));
}

export function makeLineMask(wavelengths: ArrayLike<number>): Float64Array {
  return Float64Array.from(wavelengths, (lambda) =>
    (lambda >= 482e-9 && lambda <= 490e-9) || (lambda >= 650e-9 && lambda <= 660e-9) ? 1 : 0,
  );
}

export function makeMuGrid(): Float64Array {
  return Float64Array.from([0.2, 0.35, 0.5, 0.7, 0.85, 1]);
}

export function makeFullSpectrumSolarLikeFixture(
  wavelength_m: Float64Array = makeWavelengthGrid(),
): StellarBenchmarkFixture {
  return {
    benchmark_id: "solar-like-full-spectrum",
    coverage_mode: "full_spectrum",
    coverage_fraction: 1,
    wavelength_m,
    continuum_mask: makeContinuumMask(wavelength_m),
    uv_mask: makeUvMask(wavelength_m),
    line_mask: makeLineMask(wavelength_m),
  };
}

export function makeVisibleBandSolarLikeFixture(
  wavelength_m: Float64Array = makeVisibleBandGrid(),
): StellarBenchmarkFixture {
  return {
    benchmark_id: "solar-like-visible-band",
    coverage_mode: "band_limited",
    coverage_fraction: 0.38,
    wavelength_m,
    continuum_mask: makeContinuumMask(wavelength_m),
    line_mask: makeLineMask(wavelength_m),
  };
}

export function makeUvHeavySolarLikeFixture(
  wavelength_m: Float64Array = makeUvHeavyBandGrid(),
): StellarBenchmarkFixture {
  return {
    benchmark_id: "solar-like-uv-band",
    coverage_mode: "band_limited",
    coverage_fraction: 0.11,
    wavelength_m,
    uv_mask: makeUvMask(wavelength_m),
  };
}

export function makeLineFocusedOpticalSolarLikeFixture(
  wavelength_m: Float64Array = makeLineFocusedOpticalGrid(),
): StellarBenchmarkFixture {
  return {
    benchmark_id: "solar-like-line-focused-optical",
    coverage_mode: "band_limited",
    coverage_fraction: 0.18,
    wavelength_m,
    continuum_mask: makeContinuumMask(wavelength_m),
    line_mask: makeLineMask(wavelength_m),
  };
}

export function makeCanonicalStellarBenchmarkFixtures(): StellarBenchmarkFixture[] {
  return [
    makeFullSpectrumSolarLikeFixture(),
    makeVisibleBandSolarLikeFixture(),
    makeUvHeavySolarLikeFixture(),
    makeLineFocusedOpticalSolarLikeFixture(),
  ];
}

export function buildBenchmarkObservation(
  fixture: StellarBenchmarkFixture,
  intensity: ArrayLike<number>,
  overrides: Partial<StellarSpectrumObservation> = {},
): StellarSpectrumObservation {
  return {
    benchmark_id: overrides.benchmark_id ?? fixture.benchmark_id,
    coverage_mode: overrides.coverage_mode ?? fixture.coverage_mode,
    reference_flux_W_m2: overrides.reference_flux_W_m2 ?? fixture.reference_flux_W_m2,
    coverage_fraction: overrides.coverage_fraction ?? fixture.coverage_fraction,
    wavelength_m: fixture.wavelength_m,
    intensity,
    continuum_mask: overrides.continuum_mask ?? fixture.continuum_mask,
    uv_mask: overrides.uv_mask ?? fixture.uv_mask,
    line_mask: overrides.line_mask ?? fixture.line_mask,
    mu_grid: overrides.mu_grid,
    intensity_by_mu: overrides.intensity_by_mu,
    anisotropy: overrides.anisotropy,
    polarization: overrides.polarization,
  };
}
