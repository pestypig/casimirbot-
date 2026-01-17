import { z } from "zod";
import { C, HBAR, PI } from "./physics-const";
import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";
import { Float64VectorB64, SolarSpectrumView, type TSolarSpectrumView } from "./solar-spectrum";

export const SOLAR_T0_K = 5772;
export const SOLAR_R_SUN_M = 696_340_000;
export const SOLAR_AU_M = 149_597_870_700;
export const SOLAR_OMEGA_SUN_SR = PI * Math.pow(SOLAR_R_SUN_M / SOLAR_AU_M, 2);

const PLANCK_H = 2 * PI * HBAR;
const K_B = 1.380649e-23;

export type SolarSpectrumSeriesValues = {
  series_id: string;
  view: TSolarSpectrumView;
  mu?: number | null;
  wavelength_m: Float64Array;
  ssi_W_m2_m: Float64Array;
  uncertainty_pct?: Float64Array;
};

export const SolarSpectrumBandWindow = z.object({
  id: z.string().min(1),
  lambda_min_m: z.number(),
  lambda_max_m: z.number(),
  label: z.string().optional(),
});

export type TSolarSpectrumBandWindow = z.infer<typeof SolarSpectrumBandWindow>;

export const SolarSpectrumBandIntegral = z.object({
  band_id: z.string().min(1),
  label: z.string().optional(),
  lambda_min_m: z.number(),
  lambda_max_m: z.number(),
  ssi_integral_W_m2: z.number(),
});

export type TSolarSpectrumBandIntegral = z.infer<typeof SolarSpectrumBandIntegral>;

export const SolarSpectrumLimbPoint = z.object({
  mu: z.number().min(0).max(1),
  ratio: z.number(),
  ssi_integral_W_m2: z.number(),
});

export const SolarSpectrumLimbDarkeningCurve = z.object({
  band_id: z.string().min(1),
  label: z.string().optional(),
  view: SolarSpectrumView,
  reference_mu: z.number().min(0).max(1),
  reference_integral_W_m2: z.number(),
  points: z.array(SolarSpectrumLimbPoint).min(1),
});

export type TSolarSpectrumLimbDarkeningCurve = z.infer<typeof SolarSpectrumLimbDarkeningCurve>;

export const SolarSpectrumFitConfig = z.object({
  allow_scale: z.boolean(),
  smooth_window: z.number().int().positive(),
  min_T_K: z.number().positive(),
  max_T_K: z.number().positive(),
  coarse_steps: z.number().int().positive(),
  refine_steps: z.number().int().positive(),
  max_samples: z.number().int().positive(),
  windows_m: z.array(z.tuple([z.number(), z.number()])),
});

export type TSolarSpectrumFitConfig = z.infer<typeof SolarSpectrumFitConfig>;

export const SolarSpectrumSeriesSummary = z.object({
  series_id: z.string().min(1),
  view: SolarSpectrumView,
  mu: z.number().min(0).max(1).nullable().optional(),
  t_fit_K: z.number().nullable(),
  t_fit_scale: z.number().nullable(),
  tb_min_K: z.number(),
  tb_max_K: z.number(),
  tb_minus_t0_max_K: z.number(),
  tb_minus_t0_min_K: z.number(),
  tb_minus_t0_max_lambda_m: z.number().nullable(),
  tb_minus_t0_min_lambda_m: z.number().nullable(),
  residual_abs_W_m2: z.number(),
});

export type TSolarSpectrumSeriesSummary = z.infer<typeof SolarSpectrumSeriesSummary>;

export const SolarSpectrumDerivedSeries = z.object({
  series_id: z.string().min(1),
  view: SolarSpectrumView,
  mu: z.number().min(0).max(1).nullable().optional(),
  t_fit_K: z.number().nullable(),
  t_fit_scale: z.number().nullable(),
  tb_K: Float64VectorB64,
  eps_eff_t0: Float64VectorB64,
  eps_eff_tfit: Float64VectorB64.optional(),
  ratio_fit: Float64VectorB64.optional(),
  log_resid_fit: Float64VectorB64.optional(),
  band_integrals: z.array(SolarSpectrumBandIntegral).optional(),
  summary: SolarSpectrumSeriesSummary,
});

export type TSolarSpectrumDerivedSeries = z.infer<typeof SolarSpectrumDerivedSeries>;

export const SolarSpectrumAnalysis = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("solar_spectrum_analysis/1"),
  kind: z.literal("solar_spectrum_analysis"),
  source_inputs_hash: z.string().min(8),
  t0_K: z.number(),
  omega_sun_sr: z.number(),
  fit_config: SolarSpectrumFitConfig,
  bands: z.array(SolarSpectrumBandWindow).optional(),
  series: z.array(SolarSpectrumDerivedSeries).min(1),
  limb_darkening: z.array(SolarSpectrumLimbDarkeningCurve).optional(),
});

export type TSolarSpectrumAnalysis = z.infer<typeof SolarSpectrumAnalysis>;

export type SolarSpectrumSeriesAnalysis = {
  series_id: string;
  view: TSolarSpectrumView;
  mu?: number | null;
  t_fit_K: number | null;
  t_fit_scale: number | null;
  tb_K: Float64Array;
  eps_eff_t0: Float64Array;
  eps_eff_tfit?: Float64Array;
  ratio_fit?: Float64Array;
  log_resid_fit?: Float64Array;
  band_integrals?: TSolarSpectrumBandIntegral[];
  summary: TSolarSpectrumSeriesSummary;
};

export type SolarSpectrumAnalysisOptions = {
  t0_K?: number;
  omega_sun_sr?: number;
  fit?: Partial<TSolarSpectrumFitConfig>;
  bands?: TSolarSpectrumBandWindow[];
};

export type SolarSpectrumAnalysisResult = {
  t0_K: number;
  omega_sun_sr: number;
  fit_config: TSolarSpectrumFitConfig;
  bands: TSolarSpectrumBandWindow[];
  series: SolarSpectrumSeriesAnalysis[];
  limb_darkening?: TSolarSpectrumLimbDarkeningCurve[];
};

export const DEFAULT_SOLAR_FIT_CONFIG: TSolarSpectrumFitConfig = {
  allow_scale: true,
  smooth_window: 11,
  min_T_K: 3000,
  max_T_K: 8000,
  coarse_steps: 80,
  refine_steps: 60,
  max_samples: 5000,
  windows_m: [],
};

const clampFinite = (value: number, fallback = 0): number =>
  Number.isFinite(value) ? value : fallback;

export const planckRadianceLambda = (lambda_m: number, T_K: number): number => {
  if (!(lambda_m > 0) || !(T_K > 0)) return 0;
  const a = 2 * PLANCK_H * C * C;
  const lambda5 = Math.pow(lambda_m, 5);
  const x = (PLANCK_H * C) / (lambda_m * K_B * T_K);
  const denom = Math.expm1(x);
  if (!Number.isFinite(denom) || denom <= 0) return 0;
  return a / (lambda5 * denom);
};

export const brightnessTemperatureLambda = (
  lambda_m: number,
  radiance: number,
): number => {
  if (!(lambda_m > 0) || !(radiance > 0)) return 0;
  const a = (2 * PLANCK_H * C * C) / Math.pow(lambda_m, 5);
  if (!Number.isFinite(a) || a <= 0) return 0;
  const denom = Math.log1p(a / radiance);
  if (!Number.isFinite(denom) || denom <= 0) return 0;
  return (PLANCK_H * C) / (lambda_m * K_B * denom);
};

export const smoothSeries = (
  series: Float64Array,
  windowSize: number,
): Float64Array => {
  const n = series.length;
  if (windowSize <= 1 || n < 3) return new Float64Array(series);
  const half = Math.floor(windowSize / 2);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const start = Math.max(0, i - half);
    const end = Math.min(n - 1, i + half);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= end; j += 1) {
      const v = series[j];
      if (Number.isFinite(v)) {
        sum += v;
        count += 1;
      }
    }
    out[i] = count > 0 ? sum / count : 0;
  }
  return out;
};

const pickFitIndices = (
  wavelengths: Float64Array,
  windows: Array<[number, number]>,
): number[] => {
  const indices: number[] = [];
  const n = wavelengths.length;
  if (!windows.length) {
    for (let i = 0; i < n; i += 1) indices.push(i);
    return indices;
  }
  for (let i = 0; i < n; i += 1) {
    const lambda = wavelengths[i];
    for (const [min, max] of windows) {
      if (lambda >= min && lambda <= max) {
        indices.push(i);
        break;
      }
    }
  }
  return indices;
};

const downsampleIndices = (indices: number[], maxSamples: number): number[] => {
  if (indices.length <= maxSamples) return indices;
  const step = Math.ceil(indices.length / maxSamples);
  const out: number[] = [];
  for (let i = 0; i < indices.length; i += step) {
    out.push(indices[i]);
  }
  return out;
};

export const fitPlanckTemperature = (
  wavelengths: Float64Array,
  radiance: Float64Array,
  config: TSolarSpectrumFitConfig,
): { t_fit_K: number | null; scale: number | null } => {
  const indices = downsampleIndices(
    pickFitIndices(wavelengths, config.windows_m),
    config.max_samples,
  );
  if (indices.length < 3) {
    return { t_fit_K: null, scale: null };
  }
  const smooth = smoothSeries(radiance, config.smooth_window);
  const evalSse = (T_K: number): { sse: number; scale: number } => {
    let sumBB = 0;
    let sumIB = 0;
    for (const idx of indices) {
      const B = planckRadianceLambda(wavelengths[idx], T_K);
      if (B <= 0) continue;
      const I = smooth[idx];
      sumBB += B * B;
      sumIB += I * B;
    }
    const scale = config.allow_scale && sumBB > 0 ? sumIB / sumBB : 1;
    let sse = 0;
    for (const idx of indices) {
      const B = planckRadianceLambda(wavelengths[idx], T_K);
      if (B <= 0) continue;
      const I = smooth[idx];
      const diff = I - scale * B;
      sse += diff * diff;
    }
    return { sse, scale: clampFinite(scale, 1) };
  };

  const scan = (minT: number, maxT: number, steps: number) => {
    let bestT = minT;
    let bestSse = Number.POSITIVE_INFINITY;
    let bestScale = 1;
    for (let i = 0; i <= steps; i += 1) {
      const t = minT + (maxT - minT) * (i / steps);
      const { sse, scale } = evalSse(t);
      if (sse < bestSse) {
        bestSse = sse;
        bestT = t;
        bestScale = scale;
      }
    }
    return { bestT, bestSse, bestScale };
  };

  const coarse = scan(config.min_T_K, config.max_T_K, config.coarse_steps);
  const step = (config.max_T_K - config.min_T_K) / Math.max(1, config.coarse_steps);
  const refineMin = Math.max(config.min_T_K, coarse.bestT - step);
  const refineMax = Math.min(config.max_T_K, coarse.bestT + step);
  const refine = scan(refineMin, refineMax, config.refine_steps);
  return { t_fit_K: refine.bestT, scale: refine.bestScale };
};

export const integrateBandIrradiance = (
  wavelengths: Float64Array,
  ssi: Float64Array,
  band: TSolarSpectrumBandWindow,
): TSolarSpectrumBandIntegral => {
  const min = Math.min(band.lambda_min_m, band.lambda_max_m);
  const max = Math.max(band.lambda_min_m, band.lambda_max_m);
  let integral = 0;
  for (let i = 0; i < wavelengths.length - 1; i += 1) {
    const x0 = wavelengths[i];
    const x1 = wavelengths[i + 1];
    const segMin = Math.max(min, Math.min(x0, x1));
    const segMax = Math.min(max, Math.max(x0, x1));
    if (segMax <= segMin) continue;
    const y0 = ssi[i];
    const y1 = ssi[i + 1];
    const t0 = (segMin - x0) / (x1 - x0);
    const t1 = (segMax - x0) / (x1 - x0);
    const ySeg0 = y0 + t0 * (y1 - y0);
    const ySeg1 = y0 + t1 * (y1 - y0);
    integral += 0.5 * (ySeg0 + ySeg1) * (segMax - segMin);
  }
  return {
    band_id: band.id,
    label: band.label,
    lambda_min_m: min,
    lambda_max_m: max,
    ssi_integral_W_m2: integral,
  };
};

const buildLimbDarkeningCurves = (
  series: SolarSpectrumSeriesAnalysis[],
  bands: TSolarSpectrumBandWindow[],
): TSolarSpectrumLimbDarkeningCurve[] => {
  if (!bands.length) return [];
  const muSeries = series.filter(
    (entry) => entry.view === "intermediate" && typeof entry.mu === "number",
  );
  if (!muSeries.length) return [];

  const curves: TSolarSpectrumLimbDarkeningCurve[] = [];
  for (const band of bands) {
    const points = muSeries
      .map((entry) => {
        const integral = entry.band_integrals?.find((value) => value.band_id === band.id);
        if (!integral || entry.mu == null) return null;
        return { mu: entry.mu, ssi_integral_W_m2: integral.ssi_integral_W_m2 };
      })
      .filter((entry): entry is { mu: number; ssi_integral_W_m2: number } => !!entry);

    if (!points.length) continue;
    const reference = points.reduce((best, point) => (point.mu > best.mu ? point : best), points[0]);
    const refIntegral = reference.ssi_integral_W_m2;
    const refMu = reference.mu;
    const sorted = points
      .slice()
      .sort((a, b) => b.mu - a.mu)
      .map((point) => ({
        mu: point.mu,
        ratio: refIntegral > 0 ? point.ssi_integral_W_m2 / refIntegral : 0,
        ssi_integral_W_m2: point.ssi_integral_W_m2,
      }));

    curves.push({
      band_id: band.id,
      label: band.label,
      view: "intermediate",
      reference_mu: refMu,
      reference_integral_W_m2: refIntegral,
      points: sorted,
    });
  }

  return curves;
};

export const analyzeSolarSpectrum = (
  series: SolarSpectrumSeriesValues[],
  options: SolarSpectrumAnalysisOptions = {},
): SolarSpectrumAnalysisResult => {
  const t0_K = options.t0_K ?? SOLAR_T0_K;
  const omega_sun_sr = options.omega_sun_sr ?? SOLAR_OMEGA_SUN_SR;
  const fit_config: TSolarSpectrumFitConfig = {
    ...DEFAULT_SOLAR_FIT_CONFIG,
    ...(options.fit ?? {}),
    windows_m: options.fit?.windows_m ?? DEFAULT_SOLAR_FIT_CONFIG.windows_m,
  };
  const bands = options.bands ?? [];

  const outSeries: SolarSpectrumSeriesAnalysis[] = series.map((entry) => {
    const wavelengths = entry.wavelength_m;
    const ssi = entry.ssi_W_m2_m;
    const radiance = new Float64Array(ssi.length);
    for (let i = 0; i < ssi.length; i += 1) {
      radiance[i] = ssi[i] / omega_sun_sr;
    }

    const tb = new Float64Array(ssi.length);
    const epsT0 = new Float64Array(ssi.length);
    for (let i = 0; i < ssi.length; i += 1) {
      tb[i] = brightnessTemperatureLambda(wavelengths[i], radiance[i]);
      const base = planckRadianceLambda(wavelengths[i], t0_K);
      epsT0[i] = base > 0 ? radiance[i] / base : 0;
    }

    const fit = fitPlanckTemperature(wavelengths, radiance, fit_config);
    let epsFit: Float64Array | undefined;
    let ratioFit: Float64Array | undefined;
    let logResid: Float64Array | undefined;
    if (fit.t_fit_K && fit.scale) {
      epsFit = new Float64Array(ssi.length);
      ratioFit = new Float64Array(ssi.length);
      logResid = new Float64Array(ssi.length);
      for (let i = 0; i < ssi.length; i += 1) {
        const base = planckRadianceLambda(wavelengths[i], fit.t_fit_K);
        const scaled = base * fit.scale;
        const ratio = scaled > 0 ? radiance[i] / scaled : 0;
        epsFit[i] = ratio;
        ratioFit[i] = ratio;
        logResid[i] =
          radiance[i] > 0 && scaled > 0 ? Math.log(radiance[i]) - Math.log(scaled) : 0;
      }
    }

    let tbMin = Number.POSITIVE_INFINITY;
    let tbMax = 0;
    let tbMinusMax = Number.NEGATIVE_INFINITY;
    let tbMinusMin = Number.POSITIVE_INFINITY;
    let tbMinusMaxLambda: number | null = null;
    let tbMinusMinLambda: number | null = null;
    for (let i = 0; i < tb.length; i += 1) {
      const value = tb[i];
      if (!Number.isFinite(value)) continue;
      tbMin = Math.min(tbMin, value);
      tbMax = Math.max(tbMax, value);
      const delta = value - t0_K;
      if (delta > tbMinusMax) {
        tbMinusMax = delta;
        tbMinusMaxLambda = wavelengths[i];
      }
      if (delta < tbMinusMin) {
        tbMinusMin = delta;
        tbMinusMinLambda = wavelengths[i];
      }
    }
    if (!Number.isFinite(tbMin)) tbMin = 0;

    const refT = fit.t_fit_K ?? t0_K;
    const refScale = fit.scale ?? 1;
    let residual = 0;
    for (let i = 0; i < wavelengths.length - 1; i += 1) {
      const lambda0 = wavelengths[i];
      const lambda1 = wavelengths[i + 1];
      const baseline0 = planckRadianceLambda(lambda0, refT) * refScale * omega_sun_sr;
      const baseline1 = planckRadianceLambda(lambda1, refT) * refScale * omega_sun_sr;
      const diff0 = Math.abs(ssi[i] - baseline0);
      const diff1 = Math.abs(ssi[i + 1] - baseline1);
      residual += 0.5 * (diff0 + diff1) * (lambda1 - lambda0);
    }

    const bandIntegrals = bands.map((band) =>
      integrateBandIrradiance(wavelengths, ssi, band),
    );

    const summary: TSolarSpectrumSeriesSummary = {
      series_id: entry.series_id,
      view: entry.view,
      mu: entry.mu ?? null,
      t_fit_K: fit.t_fit_K,
      t_fit_scale: fit.scale,
      tb_min_K: tbMin,
      tb_max_K: tbMax,
      tb_minus_t0_max_K: tbMinusMax,
      tb_minus_t0_min_K: tbMinusMin,
      tb_minus_t0_max_lambda_m: tbMinusMaxLambda,
      tb_minus_t0_min_lambda_m: tbMinusMinLambda,
      residual_abs_W_m2: residual,
    };

    return {
      series_id: entry.series_id,
      view: entry.view,
      mu: entry.mu ?? null,
      t_fit_K: fit.t_fit_K,
      t_fit_scale: fit.scale,
      tb_K: tb,
      eps_eff_t0: epsT0,
      eps_eff_tfit: epsFit,
      ratio_fit: ratioFit,
      log_resid_fit: logResid,
      band_integrals: bandIntegrals.length ? bandIntegrals : undefined,
      summary,
    };
  });

  const limbDarkening = buildLimbDarkeningCurves(outSeries, bands);

  return {
    t0_K,
    omega_sun_sr,
    fit_config,
    bands,
    series: outSeries,
    limb_darkening: limbDarkening.length ? limbDarkening : undefined,
  };
};
