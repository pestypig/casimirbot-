import { randomUUID } from "node:crypto";
import { EssenceEnvelope } from "@shared/essence-schema";
import { withDerivedArtifactInformationBoundary } from "@shared/information-boundary-derived";
import {
  SolarModelComparisonReport,
  SolarModelConfig,
  type TSolarModelComparisonReport,
  type TSolarModelConfig,
  type TSolarModelFitReport,
  type TSolarModelFamily,
} from "@shared/solar-model";
import {
  decodeFloat64Vector,
  type TSolarSpectrum,
  type TSolarSpectrumSeries,
  type TSolarSpectrumView,
} from "@shared/solar-spectrum";
import { planckRadianceLambda, SOLAR_OMEGA_SUN_SR } from "@shared/solar-spectrum-analysis";
import type { TSolarSpectrumAnalysis } from "@shared/solar-spectrum-analysis";
import { putBlob } from "../../storage";
import { putEnvelope } from "./store";
import {
  buildInformationBoundaryFromHashes,
  hashStableJson,
  sha256Hex,
} from "../../utils/information-boundary";
import { stableJsonStringify } from "../../utils/stable-json";
import { runSolarGuardrails } from "./solar-guardrails";
import type { SolarGuardrailInputs } from "@shared/solar-guardrails";

type ModelSeries = {
  series_id: string;
  view: TSolarSpectrumView;
  mu: number | null;
  wavelength_m: Float64Array;
  ssi_W_m2_m: Float64Array;
};

type FitWindow = {
  id: string;
  min_m: number;
  max_m: number;
};

type SeriesFitData = ModelSeries & {
  indices: number[];
};

type SseResult = {
  sse: number;
  n_points: number;
  muStats: Map<string, { mu: number | null; sse: number; n: number }>;
  bandStats: Map<string, { band: FitWindow; sse: number; n: number }>;
};

const DEFAULT_CONFIGS: TSolarModelConfig[] = [
  SolarModelConfig.parse({
    schema_version: "solar_model_config/1",
    model_family: "opacity_depth",
    parameter_bounds: {
      T_ref_K: { min: 4500, max: 6500 },
      alpha: { min: -0.3, max: 0.3 },
      scale: { min: 0.6, max: 1.4 },
      limb_u1: { min: 0.0, max: 1.0 },
      limb_u2: { min: 0.0, max: 1.0 },
    },
    mu_policy: { mode: "mu-grid", stability_target: 0.6 },
    grid: { coarse_samples: 120, refine_samples: 60 },
  }),
  SolarModelConfig.parse({
    schema_version: "solar_model_config/1",
    model_family: "emissivity_drude",
    parameter_bounds: {
      T_ref_K: { min: 4500, max: 6500 },
      eps_base: { min: 0.4, max: 1.2 },
      drude_amp: { min: 0.0, max: 0.8 },
      drude_lambda_m: { min: 120e-9, max: 900e-9 },
      defect_amp: { min: 0.0, max: 0.5 },
      defect_lambda_m: { min: 150e-9, max: 1200e-9 },
      defect_sigma_m: { min: 20e-9, max: 250e-9 },
      mu_exp: { min: 0.0, max: 1.5 },
    },
    mu_policy: { mode: "mu-grid", stability_target: 0.6 },
    grid: { coarse_samples: 160, refine_samples: 80 },
  }),
];

const EPS = 1e-12;
const LAMBDA_REF_M = 500e-9;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const toSeriesValues = (series: TSolarSpectrumSeries[]): ModelSeries[] =>
  series.map((entry) => ({
    series_id: entry.series_id,
    view: entry.view,
    mu: entry.mu ?? null,
    wavelength_m: decodeFloat64Vector(entry.wavelength_m),
    ssi_W_m2_m: decodeFloat64Vector(entry.ssi_W_m2_m),
  }));

const resolveMu = (
  entry: ModelSeries,
  policy: TSolarModelConfig["mu_policy"],
): number | null => {
  if (typeof entry.mu === "number") return entry.mu;
  if (entry.view === "disk_center") return 1;
  if (entry.view === "disk_integrated" && policy.mode === "include-integrated") {
    return policy.integrated_mu ?? 0.5;
  }
  return null;
};

const selectSeries = (
  series: ModelSeries[],
  policy: TSolarModelConfig["mu_policy"],
): ModelSeries[] => {
  return series
    .map((entry) => ({ ...entry, mu: resolveMu(entry, policy) }))
    .filter((entry) => {
      if (entry.mu === null) return false;
      if (policy.mode === "disk-center") {
        return entry.view === "disk_center";
      }
      if (policy.mode === "mu-grid") {
        return entry.view === "disk_center" || entry.view === "intermediate";
      }
      return true;
    });
};

const normalizeWindows = (
  windows?: Array<[number, number]>,
): FitWindow[] => {
  if (!windows?.length) return [];
  return windows.map(([min, max], idx) => ({
    id: `band-${idx + 1}`,
    min_m: Math.min(min, max),
    max_m: Math.max(min, max),
  }));
};

const buildIndices = (series: ModelSeries, windows: FitWindow[]): number[] => {
  const n = series.wavelength_m.length;
  if (!windows.length) {
    return Array.from({ length: n }, (_, i) => i);
  }
  const indices: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const lambda = series.wavelength_m[i];
    for (const window of windows) {
      if (lambda >= window.min_m && lambda <= window.max_m) {
        indices.push(i);
        break;
      }
    }
  }
  return indices;
};

const buildFitData = (
  series: ModelSeries[],
  windows: FitWindow[],
): SeriesFitData[] =>
  series.map((entry) => ({
    ...entry,
    indices: buildIndices(entry, windows),
  }));

const seedFrom = (value: unknown): number => {
  const hash = hashStableJson(value).replace(/^sha256:/, "");
  const seed = parseInt(hash.slice(0, 8), 16);
  return Number.isFinite(seed) ? seed : 0;
};

const mulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const sampleParams = (
  bounds: TSolarModelConfig["parameter_bounds"],
  rng: () => number,
  count: number,
): Array<Record<string, number>> => {
  const params: Array<Record<string, number>> = [];
  const keys = Object.keys(bounds).sort();
  for (let i = 0; i < count; i += 1) {
    const entry: Record<string, number> = {};
    for (const key of keys) {
      const range = bounds[key];
      const min = range.min;
      const max = range.max;
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        continue;
      }
      const steps = range.steps ?? 0;
      if (steps > 1) {
        const idx = Math.floor(rng() * steps);
        const t = steps === 1 ? 0 : idx / (steps - 1);
        entry[key] = min + (max - min) * t;
      } else {
        entry[key] = min + (max - min) * rng();
      }
    }
    params.push(entry);
  }
  return params;
};

const sampleAround = (
  base: Record<string, number>,
  bounds: TSolarModelConfig["parameter_bounds"],
  rng: () => number,
  count: number,
  spread = 0.15,
): Array<Record<string, number>> => {
  const params: Array<Record<string, number>> = [];
  const keys = Object.keys(bounds).sort();
  for (let i = 0; i < count; i += 1) {
    const entry: Record<string, number> = {};
    for (const key of keys) {
      const range = bounds[key];
      const min = range.min;
      const max = range.max;
      const span = Math.max(EPS, max - min);
      const center = Number.isFinite(base[key]) ? base[key] : min + span * 0.5;
      const window = span * spread;
      const lo = Math.max(min, center - window);
      const hi = Math.min(max, center + window);
      entry[key] = lo + (hi - lo) * rng();
    }
    params.push(entry);
  }
  return params;
};

const modelSsi = (
  family: TSolarModelFamily,
  lambda_m: number,
  mu: number,
  params: Record<string, number>,
  omega_sun_sr: number,
): number => {
  const muClamped = Math.min(1, Math.max(0, mu));
  if (family === "opacity_depth") {
    const tRef = params.T_ref_K ?? 5772;
    const alpha = params.alpha ?? 0;
    const scale = params.scale ?? 1;
    const u1 = params.limb_u1 ?? 0.3;
    const u2 = params.limb_u2 ?? 0.2;
    const tEff = tRef * Math.pow(lambda_m / LAMBDA_REF_M, alpha);
    const limb =
      1 - u1 * (1 - muClamped) - u2 * (1 - muClamped) * (1 - muClamped);
    const limbScale = Math.max(0, limb);
    const base = planckRadianceLambda(lambda_m, tEff) * omega_sun_sr;
    return scale * base * limbScale;
  }
  const tRef = params.T_ref_K ?? 5772;
  const epsBase = params.eps_base ?? 0.9;
  const drudeAmp = params.drude_amp ?? 0.3;
  const drudeLambda = params.drude_lambda_m ?? 400e-9;
  const defectAmp = params.defect_amp ?? 0.1;
  const defectLambda = params.defect_lambda_m ?? 700e-9;
  const defectSigma = params.defect_sigma_m ?? 60e-9;
  const muExp = params.mu_exp ?? 0.6;
  const ratio = drudeLambda > 0 ? lambda_m / drudeLambda : 0;
  const drude = drudeAmp / (1 + ratio * ratio);
  const defect =
    defectSigma > 0
      ? defectAmp *
        Math.exp(-0.5 * Math.pow((lambda_m - defectLambda) / defectSigma, 2))
      : 0;
  const emissivity = Math.min(2, Math.max(0, epsBase + drude + defect));
  const muScale = Math.pow(Math.max(1e-3, muClamped), muExp);
  const base = planckRadianceLambda(lambda_m, tRef) * omega_sun_sr;
  return base * emissivity * muScale;
};

const evaluateModel = (
  data: SeriesFitData[],
  family: TSolarModelFamily,
  params: Record<string, number>,
  omega_sun_sr: number,
  windows: FitWindow[],
): SseResult => {
  let sse = 0;
  let n = 0;
  const muStats = new Map<string, { mu: number | null; sse: number; n: number }>();
  const bandStats = new Map<string, { band: FitWindow; sse: number; n: number }>();
  for (const window of windows) {
    bandStats.set(window.id, { band: window, sse: 0, n: 0 });
  }
  for (const series of data) {
    const mu = series.mu ?? 1;
    const muKey = mu.toFixed(3);
    const muEntry = muStats.get(muKey) ?? { mu, sse: 0, n: 0 };
    for (const idx of series.indices) {
      const lambda = series.wavelength_m[idx];
      const actual = series.ssi_W_m2_m[idx];
      if (!Number.isFinite(lambda) || !Number.isFinite(actual)) continue;
      const predicted = modelSsi(family, lambda, mu, params, omega_sun_sr);
      const diff = actual - predicted;
      const diff2 = diff * diff;
      sse += diff2;
      n += 1;
      muEntry.sse += diff2;
      muEntry.n += 1;
      for (const window of windows) {
        if (lambda >= window.min_m && lambda <= window.max_m) {
          const bandEntry = bandStats.get(window.id);
          if (bandEntry) {
            bandEntry.sse += diff2;
            bandEntry.n += 1;
          }
        }
      }
    }
    muStats.set(muKey, muEntry);
  }
  return { sse, n_points: n, muStats, bandStats };
};

const buildMuMetrics = (muStats: SseResult["muStats"]) => {
  const entries = Array.from(muStats.values()).map((entry) => ({
    mu: entry.mu,
    rmse: Math.sqrt(entry.sse / Math.max(1, entry.n)),
  }));
  if (entries.length < 2) {
    return { entries, stability: undefined };
  }
  const values = entries.map((entry) => entry.rmse);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    Math.max(1, values.length);
  const std = Math.sqrt(variance);
  const range = Math.max(...values) - Math.min(...values);
  const score = clamp01(1 - std / (mean + EPS));
  return {
    entries,
    stability: {
      mean_rmse: mean,
      std_rmse: std,
      range_rmse: range,
      score,
    },
  };
};

const buildBandMetrics = (bandStats: SseResult["bandStats"]) =>
  Array.from(bandStats.values())
    .filter((entry) => entry.n > 0)
    .map((entry) => ({
      band_id: entry.band.id,
      lambda_min_m: entry.band.min_m,
      lambda_max_m: entry.band.max_m,
      rmse: Math.sqrt(entry.sse / Math.max(1, entry.n)),
    }));

const computeInformationCriteria = (
  sse: number,
  n: number,
  k: number,
): { aic: number; bic: number } => {
  const safeN = Math.max(1, n);
  const mse = Math.max(EPS, sse / safeN);
  const aic = safeN * Math.log(mse) + 2 * k;
  const bic = safeN * Math.log(mse) + k * Math.log(safeN);
  return { aic, bic };
};

const paramsNearBounds = (
  params: Record<string, number>,
  bounds: TSolarModelConfig["parameter_bounds"],
): boolean => {
  for (const [key, range] of Object.entries(bounds)) {
    const value = params[key];
    if (!Number.isFinite(value)) return true;
    const span = range.max - range.min;
    if (!Number.isFinite(span) || span <= 0) continue;
    const margin = span * 0.02;
    if (value <= range.min + margin || value >= range.max - margin) {
      return true;
    }
  }
  return false;
};

const fitModel = (
  series: ModelSeries[],
  config: TSolarModelConfig,
  omega_sun_sr: number,
): TSolarModelFitReport => {
  const windows = normalizeWindows(config.continuum_windows_m);
  const data = buildFitData(series, windows);
  const seed = seedFrom({ model: config.model_family, bounds: config.parameter_bounds, omega_sun_sr, windows });
  const rng = mulberry32(seed);
  const coarse = sampleParams(
    config.parameter_bounds,
    rng,
    config.grid.coarse_samples,
  );
  let bestParams: Record<string, number> = {};
  let bestScore = Number.POSITIVE_INFINITY;
  for (const params of coarse) {
    const score = evaluateModel(
      data,
      config.model_family,
      params,
      omega_sun_sr,
      windows,
    );
    const rmse = Math.sqrt(score.sse / Math.max(1, score.n_points));
    if (rmse < bestScore) {
      bestScore = rmse;
      bestParams = params;
    }
  }
  const refined = sampleAround(
    bestParams,
    config.parameter_bounds,
    rng,
    config.grid.refine_samples,
  );
  for (const params of refined) {
    const score = evaluateModel(
      data,
      config.model_family,
      params,
      omega_sun_sr,
      windows,
    );
    const rmse = Math.sqrt(score.sse / Math.max(1, score.n_points));
    if (rmse < bestScore) {
      bestScore = rmse;
      bestParams = params;
    }
  }

  const finalScore = evaluateModel(
    data,
    config.model_family,
    bestParams,
    omega_sun_sr,
    windows,
  );
  const nParams = Object.keys(config.parameter_bounds).length;
  const rmse = Math.sqrt(finalScore.sse / Math.max(1, finalScore.n_points));
  const { aic, bic } = computeInformationCriteria(
    finalScore.sse,
    finalScore.n_points,
    nParams,
  );
  const muReport = buildMuMetrics(finalScore.muStats);
  const bandReport = buildBandMetrics(finalScore.bandStats);
  const plausible =
    finalScore.n_points > 0 &&
    !paramsNearBounds(bestParams, config.parameter_bounds);
  return {
    model_family: config.model_family,
    params: bestParams,
    metrics: {
      rmse,
      n_points: finalScore.n_points,
      n_params: nParams,
      sse: finalScore.sse,
      aic,
      bic,
      mu_rmse: muReport.entries.length ? muReport.entries : undefined,
      mu_stability: muReport.stability ?? undefined,
      band_rmse: bandReport.length ? bandReport : undefined,
    },
    plausible,
    ...(finalScore.n_points === 0 ? { notes: "no_fit_points" } : {}),
  };
};

const buildViability = (
  configs: TSolarModelConfig[],
  fits: TSolarModelFitReport[],
  guardrails: ReturnType<typeof runSolarGuardrails>,
  bestModel?: TSolarModelFamily,
): { status: "pass" | "review" | "fail"; reasons: string[] } => {
  const reasons: string[] = [];
  let status: "pass" | "review" | "fail" = "pass";
  if (guardrails.summary.hard_fail_count > 0) {
    status = "fail";
    reasons.push("guardrails:hard_fail");
  }
  if (guardrails.summary.soft_fail_count > 0) {
    if (status === "pass") status = "review";
    reasons.push("guardrails:soft_fail");
  }
  if (guardrails.summary.unknown_count > 0) {
    if (status === "pass") status = "review";
    reasons.push("guardrails:unknown");
  }
  if (!bestModel) {
    if (status === "pass") status = "review";
    reasons.push("model:mu_consistency");
  } else {
    const config = configs.find((item) => item.model_family === bestModel);
    const fit = fits.find((item) => item.model_family === bestModel);
    const threshold = config?.mu_policy.stability_target ?? 0.6;
    const score = fit?.metrics.mu_stability?.score;
    if (score !== undefined && score < threshold) {
      if (status === "pass") status = "review";
      reasons.push("model:mu_stability");
    }
  }
  return { status, reasons };
};

export type SolarModelComparisonResult = {
  report: TSolarModelComparisonReport;
  envelopeId?: string;
  reportUrl?: string;
};

export async function runSolarModelComparison(args: {
  spectrum: TSolarSpectrum;
  analysis: TSolarSpectrumAnalysis;
  configs?: TSolarModelConfig[];
  guardrailInputs?: SolarGuardrailInputs | null;
  guardrailConfigVersion?: string;
  persistEnvelope?: boolean;
  personaId?: string;
}): Promise<SolarModelComparisonResult> {
  const configs = args.configs?.length ? args.configs : DEFAULT_CONFIGS;
  const policy = configs[0]?.mu_policy ?? { mode: "mu-grid" };
  const series = selectSeries(toSeriesValues(args.spectrum.series), policy);
  if (!series.length) {
    throw new Error("solar_model_fit_missing_series");
  }
  const omega = args.analysis.omega_sun_sr ?? SOLAR_OMEGA_SUN_SR;
  const fits = configs.map((config) => fitModel(series, config, omega));
  const guardrails = runSolarGuardrails(args.guardrailInputs ?? null, {
    configVersion: args.guardrailConfigVersion,
  });

  const muStabilityByFamily = new Map<TSolarModelFamily, boolean>();
  for (const fit of fits) {
    const config = configs.find((item) => item.model_family === fit.model_family);
    const threshold = config?.mu_policy.stability_target ?? 0.6;
    const score = fit.metrics.mu_stability?.score ?? 0;
    muStabilityByFamily.set(fit.model_family, score >= threshold);
  }

  const bestCandidate = fits
    .filter((fit) => fit.plausible)
    .filter((fit) => muStabilityByFamily.get(fit.model_family))
    .sort((a, b) => a.metrics.rmse - b.metrics.rmse)[0];
  const bestModel = guardrails.summary.hard_fail_count > 0 ? undefined : bestCandidate?.model_family;
  const muConsistencyOk = bestModel ? muStabilityByFamily.get(bestModel) ?? false : false;

  const inputs_hash = hashStableJson({
    spectrum_inputs_hash: args.spectrum.inputs_hash,
    analysis_inputs_hash: args.analysis.inputs_hash,
    configs,
    guardrail_inputs: args.guardrailInputs ?? null,
  });
  const features_hash = hashStableJson({
    models: fits,
    best_model: bestModel ?? null,
    guardrails: guardrails.summary,
  });
  const information_boundary = buildInformationBoundaryFromHashes({
    data_cutoff_iso: args.analysis.data_cutoff_iso,
    mode: "observables",
    labels_used_as_features: false,
    event_features_included: false,
    inputs_hash,
    features_hash,
  });
  const generatedAt = new Date().toISOString();
  const viability = buildViability(configs, fits, guardrails, bestModel);
  const reportBase = {
    schema_version: "solar_model_comparison/1",
    kind: "solar_model_comparison",
    generated_at_iso: generatedAt,
    spectrum_inputs_hash: args.spectrum.inputs_hash,
    analysis_inputs_hash: args.analysis.inputs_hash,
    model_configs: configs,
    models: fits,
    best_model: bestModel,
    mu_consistency_ok: muConsistencyOk,
    guardrails,
    viability,
  };
  const report = SolarModelComparisonReport.parse(
    withDerivedArtifactInformationBoundary(reportBase, information_boundary),
  );

  let envelopeId: string | undefined;
  let reportUrl: string | undefined;
  if (args.persistEnvelope) {
    const reportJson = stableJsonStringify(report);
    const reportBuf = Buffer.from(reportJson, "utf8");
    const reportHash = sha256Hex(reportBuf);
    const reportBlob = await putBlob(reportBuf, { contentType: "application/json" });
    const now = new Date().toISOString();
    const envelope = EssenceEnvelope.parse({
      header: {
        id: randomUUID(),
        version: "essence/1.0",
        modality: "multimodal",
        created_at: now,
        source: {
          uri: "compute://solar-model-comparison",
          original_hash: { algo: "sha256", value: reportHash },
          creator_id: args.personaId ?? "persona:solar-models",
          cid: reportBlob.cid,
          license: "CC-BY-4.0",
        },
        rights: {
          allow_mix: true,
          allow_remix: true,
          allow_commercial: false,
          attribution: true,
        },
        acl: { visibility: "public", groups: [] },
      },
      features: {
        physics: {
          kind: "solar-model-comparison",
          summary: {
            spectrum_inputs_hash: report.spectrum_inputs_hash,
            analysis_inputs_hash: report.analysis_inputs_hash,
            best_model: report.best_model ?? null,
          },
          artifacts: {
            report_url: reportBlob.uri,
            report_cid: reportBlob.cid,
          },
        },
      },
      embeddings: [],
      provenance: {
        pipeline: [
          {
            name: "solar-model-comparison",
            impl_version: "1.0.0",
            lib_hash: {
              algo: "sha256",
              value: sha256Hex(Buffer.from("solar-model-comparison@1", "utf8")),
            },
            params: {
              model_families: configs.map((config) => config.model_family),
              sample_counts: configs.map((config) => ({
                family: config.model_family,
                coarse: config.grid.coarse_samples,
                refine: config.grid.refine_samples,
              })),
            },
            input_hash: { algo: "sha256", value: report.inputs_hash.replace(/^sha256:/, "") },
            output_hash: { algo: "sha256", value: reportHash },
            started_at: report.data_cutoff_iso,
            ended_at: report.data_cutoff_iso,
          },
        ],
        merkle_root: { algo: "sha256", value: reportHash },
        previous: null,
        signatures: [],
        information_boundary: report.information_boundary,
      },
    });
    await putEnvelope(envelope);
    envelopeId = envelope.header.id;
    reportUrl = reportBlob.uri;
  }

  return { report, envelopeId, reportUrl };
}
