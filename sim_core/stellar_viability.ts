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

export interface StellarSpectrumObservation {
  wavelength_m: ArrayLike<number>;
  intensity: ArrayLike<number>;
  continuum_mask?: ArrayLike<number | boolean>;
  uv_mask?: ArrayLike<number | boolean>;
  line_mask?: ArrayLike<number | boolean>;
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
  continuum_rms: number;
  uv_residual: number;
  line_residual: number | null;
  bolometric_closure: number;
  anisotropy_penalty: number;
  polarization_penalty: number;
  parameter_penalty: number;
  total: number;
}

export interface StellarModelResult {
  id: StellarRadiationModelId;
  teff_K: number;
  predicted_intensity: Float64Array;
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
  contract: {
    continuum_rms_max: number;
    uv_residual_max: number;
    line_residual_max: number;
    bolometric_closure_max: number;
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

function toMask(values: ArrayLike<number | boolean> | undefined, length: number, fallback: (index: number) => boolean): boolean[] {
  if (!values) {
    return Array.from({ length }, (_, index) => fallback(index));
  }
  return Array.from({ length }, (_, index) => Boolean(values[index]));
}

function averageSeries(values: ArrayLike<number> | undefined): number {
  return values && values.length > 0 ? clamp01(mean(values)) : 0;
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

function integrateTrapezoid(x: Float64Array, y: Float64Array): number {
  if (x.length < 2 || y.length !== x.length) return 0;
  let area = 0;
  for (let index = 0; index < x.length - 1; index += 1) {
    const dx = x[index + 1] - x[index];
    area += 0.5 * (y[index] + y[index + 1]) * dx;
  }
  return area;
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
  const nlteDeparture = scalarOrSeries(atmosphere?.nlte_departure, wavelength_m.length, 0);
  const sourceMode = atmosphere?.source_function_mode ?? "lte";
  return Float64Array.from(wavelength_m, (lambda, index) => {
    const planckBase = planckRadianceLambda(lambda, teff_K);
    const boundedDeparture = Math.max(-0.5, Math.min(0.5, nlteDeparture[index]));
    const sourceFunction = sourceMode === "nlte_proxy" ? planckBase * (1 + boundedDeparture) : planckBase;
    const opacity = Math.max(0, continuumOpacity[index]);
    const attenuation = 1 / (1 + opacity);
    return sourceFunction * attenuation * Math.max(0, emissivity[index]) * Math.max(0, transfer[index]);
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
  };

  const observedIntensity = toFloat64(observation.intensity);
  const continuumMask = toMask(observation.continuum_mask, wavelength_m.length, (index) => wavelength_m[index] >= 400e-9 && wavelength_m[index] <= 2.5e-6);
  const uvMask = toMask(observation.uv_mask, wavelength_m.length, (index) => wavelength_m[index] < 400e-9);
  const lineMask = observation.line_mask ? toMask(observation.line_mask, wavelength_m.length, () => false) : null;
  const observedAnisotropy = averageSeries(observation.anisotropy);
  const observedPolarization = averageSeries(observation.polarization);
  const expectedBolometricFlux = STEFAN_BOLTZMANN * Math.pow(teff_K, 4);
  const observedBolometricFlux = PI * integrateTrapezoid(wavelength_m, observedIntensity);
  const weights: StellarViabilityWeights = { ...DEFAULT_WEIGHTS, ...(input.weights ?? {}) };

  const hasLineMask = lineMask ? lineMask.some(Boolean) : false;
  const models = buildModelPredictions(input, wavelength_m, base).map((entry) => {
    const predictedFlux = PI * integrateTrapezoid(wavelength_m, entry.predicted);
    const metrics: StellarModelMetrics = {
      continuum_rms: relativeRms(observedIntensity, entry.predicted, continuumMask),
      uv_residual: relativeRms(observedIntensity, entry.predicted, uvMask),
      line_residual: hasLineMask && lineMask ? relativeRms(observedIntensity, entry.predicted, lineMask) : null,
      bolometric_closure: Math.abs(predictedFlux - expectedBolometricFlux) / Math.max(expectedBolometricFlux, TINY),
      anisotropy_penalty: Math.abs(entry.anisotropy - observedAnisotropy),
      polarization_penalty: Math.abs(entry.polarization - observedPolarization),
      parameter_penalty: MODEL_PENALTY[entry.id],
      total: 0,
    };

    metrics.total =
      weights.continuum * metrics.continuum_rms +
      weights.uv * metrics.uv_residual +
      (metrics.line_residual == null ? 0 : weights.line * metrics.line_residual) +
      weights.bolometric * metrics.bolometric_closure +
      weights.anisotropy * metrics.anisotropy_penalty +
      weights.polarization * metrics.polarization_penalty +
      metrics.parameter_penalty;

    return {
      id: entry.id,
      teff_K,
      predicted_intensity: entry.predicted,
      bolometric_flux_W_m2: predictedFlux,
      observed_bolometric_flux_W_m2: observedBolometricFlux,
      predicted_anisotropy: entry.anisotropy,
      predicted_polarization: entry.polarization,
      metrics,
      passes_contract:
        metrics.continuum_rms <= DEFAULT_CONTRACT.continuum_rms_max &&
        metrics.uv_residual <= DEFAULT_CONTRACT.uv_residual_max &&
        (metrics.line_residual == null || metrics.line_residual <= DEFAULT_CONTRACT.line_residual_max) &&
        metrics.bolometric_closure <= DEFAULT_CONTRACT.bolometric_closure_max &&
        metrics.anisotropy_penalty <= DEFAULT_CONTRACT.anisotropy_penalty_max &&
        metrics.polarization_penalty <= DEFAULT_CONTRACT.polarization_penalty_max,
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
    contract: DEFAULT_CONTRACT,
  };
}

export default evaluateStellarSpectralViability;
