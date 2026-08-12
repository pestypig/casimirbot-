// math-stage: diagnostic
import {
  SOLAR_KHI_MEASUREMENT_SCHEMA_VERSION,
  SolarKhiMeasurementInputV1Schema,
  SolarKhiMeasurementResultV1Schema,
  SolarKhiReconstructionAgreementV1Schema,
  type SolarKhiMeasurementInputV1,
  type SolarKhiMeasurementResultV1,
  type SolarKhiReconstructionAgreementV1,
} from "@shared/contracts/solar-khi-observation.v1";

const KM_TO_M = 1_000;
const PUBLISHED_WAVELENGTH_M = { min: 25_000, max: 170_000 } as const;
const PUBLISHED_GROWTH_RATE_S_INV = { min: 0.014, max: 0.054 } as const;
const PUBLISHED_PHASE_SPEED_M_S = { min: 670, max: 3_000 } as const;

type LinearFit = {
  slope: number;
  intercept: number;
  slopeUncertainty: number;
  r2: number;
};

const mean = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const median = (values: number[]): number => {
  if (!values.length) throw new Error("solar_khi_median_requires_values");
  const ordered = [...values].sort((a, b) => a - b);
  const mid = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0 ? (ordered[mid - 1] + ordered[mid]) / 2 : ordered[mid];
};

const medianUncertainty = (values: number[]): number => {
  if (values.length < 2) return 0;
  const center = median(values);
  const mad = median(values.map((value) => Math.abs(value - center)));
  return (1.4826 * mad) / Math.sqrt(values.length);
};

const linearFit = (x: number[], y: number[]): LinearFit => {
  if (x.length !== y.length || x.length < 2) {
    throw new Error("solar_khi_linear_fit_requires_paired_samples");
  }
  const xMean = mean(x);
  const yMean = mean(y);
  const sxx = x.reduce((sum, value) => sum + (value - xMean) ** 2, 0);
  if (!(sxx > 0)) throw new Error("solar_khi_linear_fit_requires_time_span");
  const sxy = x.reduce((sum, value, index) => sum + (value - xMean) * (y[index] - yMean), 0);
  const slope = sxy / sxx;
  const intercept = yMean - slope * xMean;
  const residuals = y.map((value, index) => value - (intercept + slope * x[index]));
  const sse = residuals.reduce((sum, value) => sum + value ** 2, 0);
  const sst = y.reduce((sum, value) => sum + (value - yMean) ** 2, 0);
  const r2 = sst > 0 ? Math.max(0, Math.min(1, 1 - sse / sst)) : 1;
  const slopeUncertainty = x.length > 2 ? Math.sqrt((sse / (x.length - 2)) / sxx) : 0;
  return { slope, intercept, slopeUncertainty, r2 };
};

// Kuridze et al. define A(t) as the full transverse extent bounded by two
// lines parallel to the mean shear layer, not an RMS texture statistic.
const transverseCorrugationExtent = (values: number[]): number =>
  Math.max(...values) - Math.min(...values);

/**
 * Paper-faithful local-minimum detector for the repeated dark striations sampled
 * along a traced magnetic-element boundary. It is intentionally deterministic:
 * a VLM may suggest a boundary, but it never supplies the reported quantities.
 */
export const detectBoundaryIntensityDips = (
  intensity: number[],
  minimumNormalizedProminence = 0.04,
): number[] => {
  if (intensity.length < 3) return [];
  const minValue = Math.min(...intensity);
  const maxValue = Math.max(...intensity);
  const span = Math.max(Number.EPSILON, maxValue - minValue);
  const dips: number[] = [];
  for (let index = 1; index < intensity.length - 1; index += 1) {
    const value = intensity[index];
    if (value > intensity[index - 1] || value >= intensity[index + 1]) continue;
    const shoulder = Math.min(intensity[index - 1], intensity[index + 1]);
    if ((shoulder - value) / span >= minimumNormalizedProminence) dips.push(index);
  }
  return dips;
};

const relativeDelta = (a: number, b: number): number =>
  Math.abs(a - b) / Math.max(Number.EPSILON, Math.abs(a), Math.abs(b));

export function measureSolarKhiBoundary(
  rawInput: SolarKhiMeasurementInputV1,
): SolarKhiMeasurementResultV1 {
  const input = SolarKhiMeasurementInputV1Schema.parse(rawInput);
  const frames = [...input.frames].sort(
    (a, b) => a.time_offset_s - b.time_offset_s || a.frame_index - b.frame_index,
  );

  const wavelengthSamplesPx: number[] = [];
  let detectedDipCount = 0;
  for (const frame of frames) {
    const dips = detectBoundaryIntensityDips(
      frame.intensity_along_boundary,
      input.minimum_dip_prominence,
    );
    detectedDipCount += dips.length;
    for (let index = 1; index < dips.length; index += 1) {
      wavelengthSamplesPx.push(dips[index] - dips[index - 1]);
    }
  }
  if (!wavelengthSamplesPx.length) {
    throw new Error("solar_khi_no_repeated_boundary_dips");
  }

  const growthSamples = frames
    .map((frame) => ({
      time: frame.time_offset_s,
      amplitude: transverseCorrugationExtent(frame.boundary_displacement_px),
    }))
    .filter((sample) => sample.amplitude > Number.EPSILON);
  if (growthSamples.length < 3) throw new Error("solar_khi_growth_fit_requires_three_nonzero_frames");
  const growthFit = linearFit(
    growthSamples.map((sample) => sample.time),
    growthSamples.map((sample) => Math.log(sample.amplitude)),
  );
  if (!(growthFit.slope > 0)) throw new Error("solar_khi_non_growing_boundary_mode");

  const ridgeSamples = frames.filter((frame) => Number.isFinite(frame.ridge_position_px));
  if (ridgeSamples.length < 3) throw new Error("solar_khi_phase_fit_requires_three_ridge_positions");
  const phaseFit = linearFit(
    ridgeSamples.map((frame) => frame.time_offset_s),
    ridgeSamples.map((frame) => (frame.ridge_position_px as number) * input.native_km_per_pixel * KM_TO_M),
  );

  const wavelengthM = median(wavelengthSamplesPx) * input.native_km_per_pixel * KM_TO_M;
  const wavelengthUncertaintyM =
    medianUncertainty(wavelengthSamplesPx) * input.native_km_per_pixel * KM_TO_M;
  const growthRate = growthFit.slope;
  const phaseSpeed = Math.abs(phaseFit.slope);
  const eFoldingTimeS = 1 / growthRate;
  const warnings: string[] = [];
  const rangeChecks = {
    wavelength_published_range:
      wavelengthM >= PUBLISHED_WAVELENGTH_M.min && wavelengthM <= PUBLISHED_WAVELENGTH_M.max,
    growth_rate_published_range:
      growthRate >= PUBLISHED_GROWTH_RATE_S_INV.min && growthRate <= PUBLISHED_GROWTH_RATE_S_INV.max,
    phase_speed_published_range:
      phaseSpeed >= PUBLISHED_PHASE_SPEED_M_S.min && phaseSpeed <= PUBLISHED_PHASE_SPEED_M_S.max,
  };
  if (!rangeChecks.wavelength_published_range) warnings.push("wavelength_outside_published_fastcam_range");
  if (!rangeChecks.growth_rate_published_range) warnings.push("growth_rate_outside_published_fastcam_range");
  if (!rangeChecks.phase_speed_published_range) warnings.push("phase_speed_outside_published_fastcam_range");
  if (growthFit.r2 < 0.8) warnings.push("weak_exponential_growth_fit");
  if (phaseFit.r2 < 0.8) warnings.push("weak_phase_propagation_fit");

  return SolarKhiMeasurementResultV1Schema.parse({
    schema_version: SOLAR_KHI_MEASUREMENT_SCHEMA_VERSION,
    observation_id: input.observation_id,
    boundary_id: input.boundary_id,
    reconstruction: input.reconstruction,
    authority: "deterministic_numerical_measurement",
    coherence_kind: "morphological_persistence",
    wavelength_m: wavelengthM,
    wavelength_uncertainty_m: wavelengthUncertaintyM,
    growth_rate_s_inv: growthRate,
    growth_rate_uncertainty_s_inv: growthFit.slopeUncertainty,
    e_folding_time_s: eFoldingTimeS,
    phase_speed_m_s: phaseSpeed,
    phase_speed_uncertainty_m_s: phaseFit.slopeUncertainty,
    phase_speed_reference: "image_plane_apparent",
    turbulent_diffusivity_m2_s:
      input.flow_speed_km_s === undefined
        ? undefined
        : (input.flow_speed_km_s * KM_TO_M * wavelengthM) / 3,
    frames_per_e_folding: eFoldingTimeS / input.cadence_s,
    detected_dip_count: detectedDipCount,
    range_checks: rangeChecks,
    quality: {
      growth_fit_r2: growthFit.r2,
      phase_fit_r2: phaseFit.r2,
      native_resolution_preserved: true,
      warnings,
    },
    extraction_provenance: input.extraction_provenance,
  });
}

export function compareSolarKhiReconstructions(
  mfbd: SolarKhiMeasurementResultV1,
  speckle: SolarKhiMeasurementResultV1,
  tolerances = { wavelength_relative: 0.25, growth_rate_relative: 0.3, phase_speed_relative: 0.3 },
): SolarKhiReconstructionAgreementV1 {
  const parsedMfbd = SolarKhiMeasurementResultV1Schema.parse(mfbd);
  const parsedSpeckle = SolarKhiMeasurementResultV1Schema.parse(speckle);
  if (parsedMfbd.reconstruction !== "mfbd" || parsedSpeckle.reconstruction !== "speckle") {
    throw new Error("solar_khi_reconstruction_order_must_be_mfbd_then_speckle");
  }
  if (parsedMfbd.observation_id !== parsedSpeckle.observation_id) {
    throw new Error("solar_khi_reconstruction_observation_mismatch");
  }
  const wavelengthRelativeDelta = relativeDelta(parsedMfbd.wavelength_m, parsedSpeckle.wavelength_m);
  const growthRateRelativeDelta = relativeDelta(
    parsedMfbd.growth_rate_s_inv,
    parsedSpeckle.growth_rate_s_inv,
  );
  const phaseSpeedRelativeDelta = relativeDelta(parsedMfbd.phase_speed_m_s, parsedSpeckle.phase_speed_m_s);
  return SolarKhiReconstructionAgreementV1Schema.parse({
    observation_id: parsedMfbd.observation_id,
    authority: "deterministic_numerical_measurement",
    matched:
      wavelengthRelativeDelta <= tolerances.wavelength_relative &&
      growthRateRelativeDelta <= tolerances.growth_rate_relative &&
      phaseSpeedRelativeDelta <= tolerances.phase_speed_relative,
    wavelength_relative_delta: wavelengthRelativeDelta,
    growth_rate_relative_delta: growthRateRelativeDelta,
    phase_speed_relative_delta: phaseSpeedRelativeDelta,
    tolerances,
    claim_tier: "diagnostic",
  });
}

export const SOLAR_KHI_PUBLISHED_RANGES = {
  wavelength_m: PUBLISHED_WAVELENGTH_M,
  growth_rate_s_inv: PUBLISHED_GROWTH_RATE_S_INV,
  phase_speed_m_s: PUBLISHED_PHASE_SPEED_M_S,
} as const;
