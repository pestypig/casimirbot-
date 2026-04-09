const PLANCK_H = 6.62607015e-34;
const BOLTZMANN_K = 1.380649e-23;
const LIGHT_C = 299792458;
const STEFAN_BOLTZMANN = 5.670374419e-8;
const PI = Math.PI;
const TINY = 1e-30;

export type StellarRadiationModelId =
  | "M0_planck_atmosphere"
  | "M1_lattice_emissivity"
  | "M2_mechanoluminescent_pressure"
  | "M3_coherence_angular";

export type StellarCoverageMode = "full_spectrum" | "band_limited";

export interface StellarSpectrumObservation {
  wavelength_m: ArrayLike<number>;
  intensity: ArrayLike<number>;
  benchmark_id?: string;
  coverage_mode?: StellarCoverageMode;
  reference_flux_W_m2?: number;
  coverage_fraction?: number;
  continuum_mask?: ArrayLike<number | boolean>;
  uv_mask?: ArrayLike<number | boolean>;
  line_mask?: ArrayLike<number | boolean>;
  mu_grid?: ArrayLike<number>;
  intensity_by_mu?: ArrayLike<number>;
  anisotropy?: ArrayLike<number>;
  polarization?: ArrayLike<number>;
}

export interface StellarKernelPack {
  emissivity_base?: ArrayLike<number> | number;
  transfer_operator?: ArrayLike<number> | number;
  lattice?: ArrayLike<number>;
  mechanoluminescent?: ArrayLike<number>;
  coherence?: ArrayLike<number>;
}

export interface StellarAtmosphereState {
  emissivity_base?: ArrayLike<number> | number;
  transfer_operator?: ArrayLike<number> | number;
  pressure_profile_Pa?: ArrayLike<number>;
  continuum_opacity?: ArrayLike<number> | number;
  line_opacity?: ArrayLike<number> | number;
  line_source_contrast?: ArrayLike<number> | number;
  source_function_mode?: "lte" | "nlte_proxy";
  nlte_departure?: ArrayLike<number> | number;
}

export interface StellarStructureState {
  xi?: number;
  alpha_xi?: number;
  d_eff?: number;
  A_ml?: number;
  Q_coh?: number;
  pressure_proxy_Pa?: number;
  stress_rate_proxy_Pa_s?: number;
  trap_density_m3?: number;
  chi_piezo?: number;
  material_gate?: boolean;
  m2_source_power_enabled?: boolean;
}

export interface StellarViabilityWeights {
  continuum: number;
  uv: number;
  line: number;
  bolometric: number;
  anisotropy: number;
  polarization: number;
}

export interface StellarRadiationInput {
  luminosity_W: number;
  radius_m: number;
  observation?: StellarSpectrumObservation;
  atmosphere?: StellarAtmosphereState;
  structure?: StellarStructureState;
  kernels?: StellarKernelPack;
  weights?: Partial<StellarViabilityWeights>;
}

export interface StellarModelMetrics {
  continuum_rms: number | null;
  uv_residual: number | null;
  line_residual: number | null;
  bolometric_closure: number | null;
  band_flux_closure: number | null;
  anisotropy_penalty: number | null;
  polarization_penalty: number | null;
  parameter_penalty: number;
  total: number;
  status: {
    continuum_rms: "computed" | "gated";
    uv_residual: "computed" | "gated";
    line_residual: "computed" | "gated";
    bolometric_closure: "computed" | "gated";
    band_flux_closure: "computed" | "gated";
    anisotropy_penalty: "computed" | "unavailable";
    polarization_penalty: "computed" | "unavailable";
  };
}

export interface StellarModelResult {
  id: StellarRadiationModelId;
  teff_K: number;
  predicted_intensity: Float64Array;
  predicted_mu_profile: Float64Array | null;
  bolometric_flux_W_m2: number;
  observed_bolometric_flux_W_m2: number;
  predicted_anisotropy: number;
  predicted_polarization: number;
  metrics: StellarModelMetrics;
  passes_contract: boolean;
}

export interface StellarViabilityReport {
  teff_K: number;
  wavelength_m: Float64Array;
  winner: StellarRadiationModelId;
  best_fit_winner: StellarRadiationModelId;
  promotable_winner: StellarRadiationModelId | null;
  fallback_winner: StellarRadiationModelId;
  models: StellarModelResult[];
  null_model: StellarRadiationModelId;
  observables_active: {
    continuum: boolean;
    uv: boolean;
    line: boolean;
    angular: boolean;
    polarization: boolean;
  };
  benchmark: {
    id: string | null;
    coverage_mode: StellarCoverageMode;
    wavelength_min_m: number;
    wavelength_max_m: number;
    coverage_fraction: number | null;
  };
  contract: {
    continuum_rms_max: number;
    uv_residual_max: number;
    line_residual_max: number;
    bolometric_closure_max: number;
    band_flux_closure_max: number;
    anisotropy_penalty_max: number;
    polarization_penalty_max: number;
  };
}

const DEFAULT_WEIGHTS: StellarViabilityWeights = {
  continuum: 0.35,
  uv: 0.2,
  line: 0.2,
  bolometric: 0.15,
  anisotropy: 0.05,
  polarization: 0.05,
};

const DEFAULT_CONTRACT = {
  continuum_rms_max: 0.05,
  uv_residual_max: 0.15,
  line_residual_max: 0.1,
  bolometric_closure_max: 0.02,
  band_flux_closure_max: 0.02,
  anisotropy_penalty_max: 0.05,
  polarization_penalty_max: 0.05,
};

const MODEL_PENALTY: Record<StellarRadiationModelId, number> = {
  M0_planck_atmosphere: 0,
  M1_lattice_emissivity: 0.01,
  M2_mechanoluminescent_pressure: 0.03,
  M3_coherence_angular: 0.02,
};

function toFloat64(values: ArrayLike<number>): Float64Array {
  return Float64Array.from(Array.from(values, (value) => Number(value) || 0));
}

function mean(values: ArrayLike<number>): number {
  if (values.length === 0) return 0;
  let total = 0;
  for (let index = 0; index < values.length; index += 1) {
    total += Number(values[index]) || 0;
  }
  return total / values.length;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function scalarOrSeries(value: ArrayLike<number> | number | undefined, length: number, fallback: number): Float64Array {
  if (typeof value === "number") {
    return Float64Array.from(Array.from({ length }, () => value));
  }
  if (value && value.length === length) {
    return toFloat64(value);
  }
  return Float64Array.from(Array.from({ length }, () => fallback));
}

function toOptionalMask(values: ArrayLike<number | boolean> | undefined, length: number): boolean[] | null {
  if (!values) {
    return null;
  }
  return Array.from({ length }, (_, index) => Boolean(values[index]));
}

function averageSeries(values: ArrayLike<number> | undefined): number {
  return values && values.length > 0 ? clamp01(mean(values)) : 0;
}

function averageScalarOrSeries(value: ArrayLike<number> | number | undefined): number {
  if (typeof value === "number") return value;
  return value && value.length > 0 ? mean(value) : 0;
}

function normalizeKernel(kernel: Float64Array): Float64Array {
  let maxAbs = TINY;
  for (let index = 0; index < kernel.length; index += 1) {
    maxAbs = Math.max(maxAbs, Math.abs(kernel[index]));
  }
  return Float64Array.from(kernel, (value) => value / maxAbs);
}

function zeroMeanKernel(kernel: Float64Array): Float64Array {
  const avg = mean(kernel);
  return normalizeKernel(Float64Array.from(kernel, (value) => value - avg));
}

function gaussianKernel(wavelength_m: Float64Array, center_m: number, width_m: number): Float64Array {
  return normalizeKernel(
    Float64Array.from(wavelength_m, (lambda) => {
      const z = (lambda - center_m) / Math.max(width_m, TINY);
      return Math.exp(-0.5 * z * z);
    }),
  );
}

function oscillatoryKernel(wavelength_m: Float64Array): Float64Array {
  if (wavelength_m.length === 0) return new Float64Array();
  const minLambda = wavelength_m[0];
  const maxLambda = wavelength_m[wavelength_m.length - 1];
  const span = Math.max(maxLambda - minLambda, TINY);
  return zeroMeanKernel(
    Float64Array.from(wavelength_m, (lambda) => {
      const phase = (lambda - minLambda) / span;
      return Math.cos(2 * PI * phase) + 0.5 * Math.cos(6 * PI * phase);
    }),
  );
}

function stellarLineKernel(wavelength_m: Float64Array): Float64Array {
  const hBeta = gaussianKernel(wavelength_m, 486.1e-9, 4e-9);
  const hAlpha = gaussianKernel(wavelength_m, 656.3e-9, 6e-9);
  return normalizeKernel(
    Float64Array.from(wavelength_m, (_, index) => 0.75 * hBeta[index] + 1.0 * hAlpha[index]),
  );
}

function integrateTrapezoid(x: Float64Array, y: Float64Array): number {
  if (x.length < 2 || y.length !== x.length) return 0;
  let area = 0;
  for (let index = 0; index < x.length - 1; index += 1) {
    const dx = x[index + 1] - x[index];
    area += 0.5 * (y[index] + y[index + 1]) * dx;
  }
  return area;
}

function maxFinite(values: ArrayLike<number>): number {
  let best = 0;
  for (let index = 0; index < values.length; index += 1) {
    const value = Number(values[index]) || 0;
    if (Number.isFinite(value)) {
      best = Math.max(best, value);
    }
  }
  return best;
}

function relativeRms(observed: Float64Array, predicted: Float64Array, mask: boolean[]): number {
  let sumSq = 0;
  let count = 0;
  for (let index = 0; index < observed.length; index += 1) {
    if (!mask[index]) continue;
    const scale = Math.max(Math.abs(observed[index]), TINY);
    const delta = (predicted[index] - observed[index]) / scale;
    sumSq += delta * delta;
    count += 1;
  }
  return count > 0 ? Math.sqrt(sumSq / count) : 0;
}

function normalizeByPeak(values: Float64Array): Float64Array {
  const peak = Math.max(maxFinite(values), TINY);
  return Float64Array.from(values, (value) => Math.max(0, value / peak));
}

function computeMaskedResidual(
  observed: Float64Array,
  predicted: Float64Array,
  mask: boolean[] | null,
): { value: number | null; status: "computed" | "gated" } {
  if (!mask || !mask.some(Boolean)) {
    return { value: null, status: "gated" };
  }
  return {
    value: relativeRms(observed, predicted, mask),
    status: "computed",
  };
}

function computeFluxClosure(referenceFlux: number | null | undefined, predictedFlux: number): { value: number | null; status: "computed" | "gated" } {
  if (!(referenceFlux != null && Number.isFinite(referenceFlux) && referenceFlux > 0)) {
    return { value: null, status: "gated" };
  }
  return {
    value: Math.abs(predictedFlux - referenceFlux) / Math.max(referenceFlux, TINY),
    status: "computed",
  };
}

function buildAngularProfile(
  muGrid: Float64Array,
  atmosphere: StellarAtmosphereState | undefined,
  anisotropy: number,
): Float64Array {
  if (muGrid.length === 0) return new Float64Array();
  const meanOpacity = Math.max(0, averageScalarOrSeries(atmosphere?.continuum_opacity));
  const meanLineOpacity = Math.max(0, averageScalarOrSeries(atmosphere?.line_opacity));
  const meanDeparture = averageScalarOrSeries(atmosphere?.nlte_departure);
  const meanLineContrast = averageScalarOrSeries(atmosphere?.line_source_contrast);
  const linearCoeff = Math.min(
    0.9,
    Math.max(
      0.25,
      0.55 +
        0.08 * Math.tanh(meanOpacity) +
        0.06 * Math.tanh(meanLineOpacity) -
        0.1 * meanDeparture +
        0.05 * meanLineContrast,
    ),
  );
  const quadraticCoeff = Math.min(
    0.2,
    Math.max(0, 0.04 * Math.tanh(meanOpacity + meanLineOpacity) - 0.03 * meanDeparture + 0.02 * Math.abs(meanLineContrast)),
  );
  const meanMu = mean(muGrid);
  const profile = Float64Array.from(muGrid, (muValue) => {
    const mu = clamp01(muValue);
    const edge = 1 - mu;
    const base = Math.max(TINY, 1 - linearCoeff * edge - quadraticCoeff * edge * edge);
    const angularModifier = 1 + 0.35 * anisotropy * (mu - meanMu);
    return Math.max(TINY, base * angularModifier);
  });
  return normalizeByPeak(profile);
}

function computeProxyScale(value: number, reference: number): number {
  if (!Number.isFinite(value) || !(reference > 0)) return 0;
  return Math.max(0, value / reference);
}

function defaultWavelengthGrid(): Float64Array {
  const minLambda = 100e-9;
  const maxLambda = 10e-6;
  const count = 256;
  const logMin = Math.log(minLambda);
  const logMax = Math.log(maxLambda);
  return Float64Array.from(
    Array.from({ length: count }, (_, index) => Math.exp(logMin + ((logMax - logMin) * index) / (count - 1))),
  );
}

function renormalizeToTargetFlux(
  wavelength_m: Float64Array,
  spectrum: Float64Array,
  targetIntegral: number,
  allowSourcePower: boolean,
): Float64Array {
  if (allowSourcePower) {
    return spectrum;
  }
  const integral = integrateTrapezoid(wavelength_m, spectrum);
  if (!(integral > 0) || !(targetIntegral > 0)) {
    return spectrum;
  }
  const scale = targetIntegral / integral;
  return Float64Array.from(spectrum, (value) => Math.max(0, value * scale));
}

export function computeEffectiveTemperature(luminosity_W: number, radius_m: number): number {
  const denom = 4 * PI * radius_m * radius_m * STEFAN_BOLTZMANN;
  if (!(luminosity_W > 0) || !(radius_m > 0) || !(denom > 0)) return 0;
  return Math.pow(luminosity_W / denom, 0.25);
}

export function planckRadianceLambda(lambda_m: number, temperature_K: number): number {
  if (!(lambda_m > 0) || !(temperature_K > 0)) return 0;
  const numerator = 2 * PLANCK_H * LIGHT_C * LIGHT_C;
  const lambda5 = Math.pow(lambda_m, 5);
  const exponent = (PLANCK_H * LIGHT_C) / (lambda_m * BOLTZMANN_K * temperature_K);
  const denominator = Math.expm1(exponent);
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
  return numerator / (lambda5 * denominator);
}

function buildBaseSpectrum(
  wavelength_m: Float64Array,
  teff_K: number,
  atmosphere: StellarAtmosphereState | undefined,
  kernels: StellarKernelPack | undefined,
): Float64Array {
  const emissivity = scalarOrSeries(kernels?.emissivity_base ?? atmosphere?.emissivity_base, wavelength_m.length, 1);
  const transfer = scalarOrSeries(kernels?.transfer_operator ?? atmosphere?.transfer_operator, wavelength_m.length, 1);
  const continuumOpacity = scalarOrSeries(atmosphere?.continuum_opacity, wavelength_m.length, 0);
  const lineOpacity = scalarOrSeries(atmosphere?.line_opacity, wavelength_m.length, 0);
  const lineSourceContrast = scalarOrSeries(atmosphere?.line_source_contrast, wavelength_m.length, 0);
  const nlteDeparture = scalarOrSeries(atmosphere?.nlte_departure, wavelength_m.length, 0);
  const lineKernel = stellarLineKernel(wavelength_m);
  const sourceMode = atmosphere?.source_function_mode ?? "lte";
  return Float64Array.from(wavelength_m, (lambda, index) => {
    const planckBase = planckRadianceLambda(lambda, teff_K);
    const boundedDeparture = Math.max(-0.5, Math.min(0.5, nlteDeparture[index]));
    const uvWeight = lambda <= 400e-9 ? 1 : Math.exp(-(lambda - 400e-9) / 800e-9);
    const sourceFunction =
      sourceMode === "nlte_proxy" ? planckBase * Math.max(0, 1 + boundedDeparture * (0.45 + 0.55 * uvWeight)) : planckBase;
    const opacity = Math.max(0, continuumOpacity[index]);
    const lineWeight = lineKernel[index];
    const boundedLineOpacity = Math.max(0, lineOpacity[index]) * lineWeight;
    const boundedLineContrast = Math.max(-0.5, Math.min(0.5, lineSourceContrast[index])) * lineWeight;
    const attenuation = 1 / (1 + opacity);
    const lineAttenuation = 1 / (1 + boundedLineOpacity);
    const lineSourceMultiplier = Math.max(0, 1 + boundedLineContrast);
    return (
      sourceFunction *
      attenuation *
      lineAttenuation *
      lineSourceMultiplier *
      Math.max(0, emissivity[index]) *
      Math.max(0, transfer[index])
    );
  });
}

function buildModelPredictions(input: StellarRadiationInput, wavelength_m: Float64Array, base: Float64Array): Array<{
  id: StellarRadiationModelId;
  predicted: Float64Array;
  anisotropy: number;
  polarization: number;
}> {
  const structure = input.structure ?? {};
  const atmosphere = input.atmosphere;
  const kernels = input.kernels ?? {};

  const xi = Number(structure.xi ?? 0);
  const alphaXi = Number(structure.alpha_xi ?? 0.2);
  const qCoh = Math.max(0, Number(structure.Q_coh ?? 0));
  const dEff = Math.max(0, Number(structure.d_eff ?? 0));
  const aml = Math.max(0, Number(structure.A_ml ?? 0));

  const latticeKernel = kernels.lattice ? normalizeKernel(toFloat64(kernels.lattice)) : oscillatoryKernel(wavelength_m);
  const mechKernel = kernels.mechanoluminescent
    ? normalizeKernel(toFloat64(kernels.mechanoluminescent))
    : gaussianKernel(wavelength_m, 350e-9, 120e-9);
  const coherenceKernel = kernels.coherence
    ? zeroMeanKernel(toFloat64(kernels.coherence))
    : zeroMeanKernel(gaussianKernel(wavelength_m, 550e-9, 180e-9));

  const baseIntegral = Math.max(integrateTrapezoid(wavelength_m, base), TINY);
  const pressureProxyValue = Number(structure.pressure_proxy_Pa ?? mean(atmosphere?.pressure_profile_Pa ?? []));
  const pressureProxy = computeProxyScale(pressureProxyValue, 1e8);
  const stressRateProxy = computeProxyScale(Number(structure.stress_rate_proxy_Pa_s ?? 0), 1e8);
  const trapProxy = computeProxyScale(Number(structure.trap_density_m3 ?? 0), 1e20);
  const piezoProxy = computeProxyScale(dEff, 1e-12);
  const materialGateEnabled = Boolean(structure.material_gate) || Number(structure.chi_piezo ?? 0) > 0;
  const allowM2SourcePower = Boolean(structure.m2_source_power_enabled);
  const mechEnvelope = 0.35 * pressureProxy + 0.25 * stressRateProxy + 0.25 * trapProxy + 0.15 * Math.abs(xi);
  const mechAmplitude = aml * piezoProxy * mechEnvelope;
  const coherenceStrength = clamp01(Math.abs(xi) * (qCoh / (qCoh + 1)));

  const latticeRaw = Float64Array.from(base, (value, index) => {
    const modifier = 1 + alphaXi * xi * latticeKernel[index];
    return value * Math.max(0, modifier);
  });
  const lattice = renormalizeToTargetFlux(wavelength_m, latticeRaw, baseIntegral, false);

  const mechRaw = materialGateEnabled
    ? Float64Array.from(lattice, (value, index) => Math.max(0, value + baseIntegral * mechAmplitude * mechKernel[index]))
    : Float64Array.from(lattice);
  const mech = renormalizeToTargetFlux(wavelength_m, mechRaw, baseIntegral, allowM2SourcePower);

  const coherenceRedistribution = Float64Array.from(lattice, (value, index) => {
    return coherenceStrength * Math.abs(value) * coherenceKernel[index];
  });
  const redistributionMean = mean(coherenceRedistribution);
  const coherenceRaw = Float64Array.from(lattice, (value, index) => {
    return Math.max(0, value + coherenceRedistribution[index] - redistributionMean);
  });
  const coherence = renormalizeToTargetFlux(wavelength_m, coherenceRaw, baseIntegral, false);

  return [
    { id: "M0_planck_atmosphere", predicted: base, anisotropy: 0, polarization: 0 },
    { id: "M1_lattice_emissivity", predicted: lattice, anisotropy: 0, polarization: 0 },
    {
      id: "M2_mechanoluminescent_pressure",
      predicted: mech,
      anisotropy: materialGateEnabled ? 0.02 * clamp01(mechEnvelope) : 0,
      polarization: materialGateEnabled ? clamp01(0.05 * piezoProxy * Math.max(Math.abs(xi), 0.2)) : 0,
    },
    { id: "M3_coherence_angular", predicted: coherence, anisotropy: coherenceStrength, polarization: 0 },
  ];
}

export function evaluateStellarSpectralViability(input: StellarRadiationInput): StellarViabilityReport {
  const wavelength_m = input.observation?.wavelength_m ? toFloat64(input.observation.wavelength_m) : defaultWavelengthGrid();
  const teff_K = computeEffectiveTemperature(input.luminosity_W, input.radius_m);
  const base = buildBaseSpectrum(wavelength_m, teff_K, input.atmosphere, input.kernels);

  const observation = input.observation ?? {
    wavelength_m,
    intensity: base,
    coverage_mode: "full_spectrum" as const,
  };

  const observedIntensity = toFloat64(observation.intensity);
  const coverageMode: StellarCoverageMode = observation.coverage_mode ?? "full_spectrum";
  const continuumMask = toOptionalMask(observation.continuum_mask, wavelength_m.length);
  const uvMask = toOptionalMask(observation.uv_mask, wavelength_m.length);
  const lineMask = toOptionalMask(observation.line_mask, wavelength_m.length);
  const muGrid =
    observation.mu_grid && observation.intensity_by_mu && observation.mu_grid.length === observation.intensity_by_mu.length
      ? toFloat64(observation.mu_grid)
      : null;
  const observedMuProfile =
    muGrid && observation.intensity_by_mu ? normalizeByPeak(toFloat64(observation.intensity_by_mu)) : null;
  const observedAnisotropy = observation.anisotropy ? averageSeries(observation.anisotropy) : null;
  const observedPolarization = observation.polarization ? averageSeries(observation.polarization) : null;
  const expectedBolometricFlux = STEFAN_BOLTZMANN * Math.pow(teff_K, 4);
  const observedBolometricFlux = PI * integrateTrapezoid(wavelength_m, observedIntensity);
  const bolometricReferenceFlux =
    coverageMode === "full_spectrum" ? (observation.reference_flux_W_m2 ?? expectedBolometricFlux) : null;
  const bandReferenceFlux =
    coverageMode === "band_limited" ? (observation.reference_flux_W_m2 ?? observedBolometricFlux) : null;
  const weights: StellarViabilityWeights = { ...DEFAULT_WEIGHTS, ...(input.weights ?? {}) };
  const observablesActive = {
    continuum: Boolean(continuumMask?.some(Boolean)),
    uv: Boolean(uvMask?.some(Boolean)),
    line: Boolean(lineMask?.some(Boolean)),
    angular: Boolean((muGrid && observedMuProfile) || (observation.anisotropy && observation.anisotropy.length > 0)),
    polarization: Boolean(observation.polarization && observation.polarization.length > 0),
  };
  const benchmarkCoverageFraction =
    observation.coverage_fraction == null
      ? coverageMode === "full_spectrum"
        ? 1
        : null
      : clamp01(observation.coverage_fraction);
  const benchmarkSummary = {
    id: observation.benchmark_id ?? null,
    coverage_mode: coverageMode,
    wavelength_min_m: wavelength_m[0] ?? 0,
    wavelength_max_m: wavelength_m[wavelength_m.length - 1] ?? 0,
    coverage_fraction: benchmarkCoverageFraction,
  };

  const models = buildModelPredictions(input, wavelength_m, base).map((entry) => {
    const predictedFlux = PI * integrateTrapezoid(wavelength_m, entry.predicted);
    const continuumResidual = computeMaskedResidual(observedIntensity, entry.predicted, continuumMask);
    const uvResidual = computeMaskedResidual(observedIntensity, entry.predicted, uvMask);
    const lineResidual = computeMaskedResidual(observedIntensity, entry.predicted, lineMask);
    const bolometricClosure = computeFluxClosure(bolometricReferenceFlux, predictedFlux);
    const bandFluxClosure = computeFluxClosure(bandReferenceFlux, predictedFlux);
    const activeClosure = coverageMode === "band_limited" ? bandFluxClosure : bolometricClosure;
    const predictedMuProfile = muGrid ? buildAngularProfile(muGrid, input.atmosphere, entry.anisotropy) : null;
    const anisotropyMetric =
      muGrid && observedMuProfile && predictedMuProfile
        ? {
            value: relativeRms(observedMuProfile, predictedMuProfile, Array.from({ length: muGrid.length }, () => true)),
            status: "computed" as const,
          }
        : observedAnisotropy != null
          ? {
              value: Math.abs(entry.anisotropy - observedAnisotropy),
              status: "computed" as const,
            }
          : {
              value: null,
              status: "unavailable" as const,
            };
    const polarizationMetric =
      observedPolarization != null
        ? {
            value: Math.abs(entry.polarization - observedPolarization),
            status: "computed" as const,
          }
        : {
            value: null,
            status: "unavailable" as const,
          };
    const metrics: StellarModelMetrics = {
      continuum_rms: continuumResidual.value,
      uv_residual: uvResidual.value,
      line_residual: lineResidual.value,
      bolometric_closure: bolometricClosure.value,
      band_flux_closure: bandFluxClosure.value,
      anisotropy_penalty: anisotropyMetric.value,
      polarization_penalty: polarizationMetric.value,
      parameter_penalty: MODEL_PENALTY[entry.id],
      total: 0,
      status: {
        continuum_rms: continuumResidual.status,
        uv_residual: uvResidual.status,
        line_residual: lineResidual.status,
        bolometric_closure: bolometricClosure.status,
        band_flux_closure: bandFluxClosure.status,
        anisotropy_penalty: anisotropyMetric.status,
        polarization_penalty: polarizationMetric.status,
      },
    };

    metrics.total =
      (metrics.continuum_rms == null ? 0 : weights.continuum * metrics.continuum_rms) +
      (metrics.uv_residual == null ? 0 : weights.uv * metrics.uv_residual) +
      (metrics.line_residual == null ? 0 : weights.line * metrics.line_residual) +
      (activeClosure.value == null ? 0 : weights.bolometric * activeClosure.value) +
      (metrics.anisotropy_penalty == null ? 0 : weights.anisotropy * metrics.anisotropy_penalty) +
      (metrics.polarization_penalty == null ? 0 : weights.polarization * metrics.polarization_penalty) +
      metrics.parameter_penalty;

    return {
      id: entry.id,
      teff_K,
      predicted_intensity: entry.predicted,
      predicted_mu_profile: predictedMuProfile,
      bolometric_flux_W_m2: predictedFlux,
      observed_bolometric_flux_W_m2: observedBolometricFlux,
      predicted_anisotropy: entry.anisotropy,
      predicted_polarization: entry.polarization,
      metrics,
      passes_contract:
        (metrics.continuum_rms == null || metrics.continuum_rms <= DEFAULT_CONTRACT.continuum_rms_max) &&
        (metrics.uv_residual == null || metrics.uv_residual <= DEFAULT_CONTRACT.uv_residual_max) &&
        (metrics.line_residual == null || metrics.line_residual <= DEFAULT_CONTRACT.line_residual_max) &&
        (coverageMode === "band_limited"
          ? activeClosure.value == null || activeClosure.value <= DEFAULT_CONTRACT.band_flux_closure_max
          : activeClosure.value == null || activeClosure.value <= DEFAULT_CONTRACT.bolometric_closure_max) &&
        (metrics.anisotropy_penalty == null || metrics.anisotropy_penalty <= DEFAULT_CONTRACT.anisotropy_penalty_max) &&
        (metrics.polarization_penalty == null || metrics.polarization_penalty <= DEFAULT_CONTRACT.polarization_penalty_max),
    } satisfies StellarModelResult;
  });

  const byScore = [...models].sort((left, right) => left.metrics.total - right.metrics.total);
  const bestFitWinner = byScore[0]?.id ?? "M0_planck_atmosphere";
  const promotable = byScore.find((entry) => entry.passes_contract);
  const promotableWinner = promotable?.id ?? null;
  const fallbackWinner: StellarRadiationModelId = "M0_planck_atmosphere";
  const winner = promotableWinner ?? fallbackWinner;

  return {
    teff_K,
    wavelength_m,
    winner,
    best_fit_winner: bestFitWinner,
    promotable_winner: promotableWinner,
    fallback_winner: fallbackWinner,
    models: byScore,
    null_model: "M0_planck_atmosphere",
    observables_active: observablesActive,
    benchmark: benchmarkSummary,
    contract: DEFAULT_CONTRACT,
  };
}

export default evaluateStellarSpectralViability;
