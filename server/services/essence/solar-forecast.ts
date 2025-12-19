import { hashStableJson, buildInformationBoundaryFromHashes, buildInformationBoundary, sha256Prefixed } from "../../utils/information-boundary";
import {
  SolarForecastRecord,
  SolarOutcomeRecord,
  SolarEvalReport,
  type TSolarForecastRecord,
  type TSolarOutcomeRecord,
  type TSolarEvalReport,
} from "@shared/solar-forecast";
import type { TRasterEnergyField2D } from "@shared/raster-energy-field";

type ForecastFilters = { horizon_s?: number; model_version?: string };

const forecastLog: TSolarForecastRecord[] = [];
const outcomeLog: TSolarOutcomeRecord[] = [];

const toIso = (value: string): string => new Date(value).toISOString();

const assertIssuedAfterCutoff = (issuedIso: string, cutoffIso: string) => {
  if (Date.parse(issuedIso) < Date.parse(cutoffIso)) {
    throw new Error("solar_forecast_invalid_timing: issued_at must be >= data_cutoff_iso");
  }
};

const assertOutcomeAfterCutoff = (outcome: TSolarOutcomeRecord, cutoffIso: string) => {
  if (Date.parse(outcome.window_start_iso) < Date.parse(cutoffIso)) {
    throw new Error("solar_outcome_invalid_join: window_start must be >= data_cutoff_iso");
  }
};

export const resetSolarForecastLogs = (): void => {
  forecastLog.length = 0;
  outcomeLog.length = 0;
};

export const listSolarForecasts = (): TSolarForecastRecord[] => [...forecastLog];
export const listSolarOutcomes = (): TSolarOutcomeRecord[] => [...outcomeLog];

export function logSolarForecastFromFeatures(
  features: Pick<TRasterEnergyField2D, "data_cutoff_iso" | "inputs_hash" | "features_hash" | "information_boundary" | "meta">,
  payload: { issued_at_iso: string; horizon_s: number; model_version: string; p_event: number; source?: string },
): TSolarForecastRecord {
  const issued_at_iso = toIso(payload.issued_at_iso);
  const data_cutoff_iso = toIso(features.data_cutoff_iso);
  assertIssuedAfterCutoff(issued_at_iso, data_cutoff_iso);

  const inputs_hash = hashStableJson({
    kind: "solar_forecast/input",
    v: 1,
    feature_inputs_hash: features.inputs_hash,
    feature_features_hash: features.features_hash ?? null,
    model_version: payload.model_version,
    horizon_s: payload.horizon_s,
  });

  const features_hash = sha256Prefixed(
    Buffer.from(
      `forecast:${payload.model_version};h=${payload.horizon_s};p=${payload.p_event};feature=${features.features_hash ?? "na"}`,
      "utf8",
    ),
  );

  const ib = buildInformationBoundaryFromHashes({
    data_cutoff_iso,
    mode: features.information_boundary.mode,
    labels_used_as_features: features.information_boundary.labels_used_as_features,
    event_features_included: features.information_boundary.event_features_included,
    inputs_hash,
    features_hash,
  });

  const record = SolarForecastRecord.parse({
    schema_version: "solar_forecast/1",
    kind: "solar_forecast",
    issued_at_iso,
    horizon_s: payload.horizon_s,
    model_version: payload.model_version,
    p_event: payload.p_event,
    data_cutoff_iso,
    inputs_hash,
    features_hash,
    information_boundary: ib,
    meta: {
      calibration_version: (features.meta as any)?.calibration_version ?? undefined,
      feature_window_start: (features.meta as any)?.window_start ?? undefined,
      feature_window_end: (features.meta as any)?.window_end ?? undefined,
      source: payload.source ?? undefined,
    },
  });

  forecastLog.push(record);
  return record;
}

export function logSolarOutcome(payload: {
  window_start_iso: string;
  window_end_iso: string;
  event_present: boolean;
  label_source?: string;
}): TSolarOutcomeRecord {
  const window_start_iso = toIso(payload.window_start_iso);
  const window_end_iso = toIso(payload.window_end_iso);
  if (Date.parse(window_end_iso) < Date.parse(window_start_iso)) {
    throw new Error("solar_outcome_invalid_window: end before start");
  }

  const inputs_hash = hashStableJson({
    kind: "solar_outcome/input",
    v: 1,
    window_start_iso,
    window_end_iso,
    label_source: payload.label_source ?? "solar-events",
  });
  const features_hash = sha256Prefixed(Buffer.from(`event:${payload.event_present ? 1 : 0};window:${window_start_iso}-${window_end_iso}`, "utf8"));
  const ib = buildInformationBoundary({
    data_cutoff_iso: window_end_iso,
    mode: "labels",
    labels_used_as_features: true,
    event_features_included: true,
    inputs: {
      kind: "solar_outcome/input",
      v: 1,
      window_start_iso,
      window_end_iso,
      label_source: payload.label_source ?? "solar-events",
    },
    features: {
      kind: "solar_outcome/features",
      v: 1,
      event_present: payload.event_present,
    },
  });

  const outcome = SolarOutcomeRecord.parse({
    schema_version: "solar_outcome/1",
    kind: "solar_outcome",
    window_start_iso,
    window_end_iso,
    event_present: payload.event_present,
    label_source: payload.label_source ?? "solar-events",
    data_cutoff_iso: window_end_iso,
    inputs_hash,
    features_hash,
    information_boundary: ib,
  });
  outcomeLog.push(outcome);
  return outcome;
}

export function ingestSolarEventsOutcome(params: {
  window_start_iso: string;
  window_end_iso: string;
  events: Array<{ start?: string; end?: string; start_time?: string; end_time?: string }> | null | undefined;
  label_source?: string;
}): TSolarOutcomeRecord {
  const event_present = Array.isArray(params.events) && params.events.length > 0;
  return logSolarOutcome({
    window_start_iso: params.window_start_iso,
    window_end_iso: params.window_end_iso,
    event_present,
    label_source: params.label_source ?? "solar-events",
  });
}

const filterForecasts = (filters?: ForecastFilters): TSolarForecastRecord[] => {
  return forecastLog.filter((f) => {
    if (filters?.horizon_s !== undefined && f.horizon_s !== filters.horizon_s) return false;
    if (filters?.model_version && f.model_version !== filters.model_version) return false;
    return true;
  });
};

const auc = (pairs: Array<{ forecast: TSolarForecastRecord; outcome: TSolarOutcomeRecord }>): number | null => {
  if (!pairs.length) return null;
  const sorted = [...pairs].sort((a, b) => b.forecast.p_event - a.forecast.p_event);
  let tp = 0;
  let fp = 0;
  let tpPrev = 0;
  let fpPrev = 0;
  let aucSum = 0;
  const pos = sorted.filter((p) => p.outcome.event_present).length;
  const neg = sorted.length - pos;
  if (pos === 0 || neg === 0) return null;
  for (const pair of sorted) {
    if (pair.outcome.event_present) tp += 1;
    else fp += 1;
    aucSum += (fp - fpPrev) * (tp + tpPrev) / 2;
    tpPrev = tp;
    fpPrev = fp;
  }
  return 1 - aucSum / (pos * neg);
};

export function evaluateSolarForecasts(filters?: ForecastFilters): TSolarEvalReport {
  const forecasts = filterForecasts(filters);
  const pairs: Array<{ forecast: TSolarForecastRecord; outcome: TSolarOutcomeRecord }> = [];
  for (const forecast of forecasts) {
    assertIssuedAfterCutoff(forecast.issued_at_iso, forecast.data_cutoff_iso);
    const horizonMs = forecast.horizon_s * 1000;
    const issuedMs = Date.parse(forecast.issued_at_iso);
    const horizonEnd = issuedMs + horizonMs;
    const invalidOutcome = outcomeLog.find(
      (o) =>
        Date.parse(o.window_end_iso) <= horizonEnd &&
        Date.parse(o.window_start_iso) < Date.parse(forecast.data_cutoff_iso),
    );
    if (invalidOutcome) {
      throw new Error("solar_outcome_invalid_join: window_start must be >= data_cutoff_iso");
    }
    const candidate = outcomeLog
      .filter((o) => Date.parse(o.window_start_iso) >= Date.parse(forecast.data_cutoff_iso))
      .filter((o) => Date.parse(o.window_start_iso) >= issuedMs)
      .filter((o) => Date.parse(o.window_end_iso) <= horizonEnd)
      .sort((a, b) => Date.parse(a.window_start_iso) - Date.parse(b.window_start_iso))[0];
    if (candidate) {
      assertOutcomeAfterCutoff(candidate, forecast.data_cutoff_iso);
      pairs.push({ forecast, outcome: candidate });
    }
  }

  const joined = pairs.length;
  const count = forecasts.length;
  const brierSum = pairs.reduce((acc, pair) => {
    const y = pair.outcome.event_present ? 1 : 0;
    return acc + Math.pow(pair.forecast.p_event - y, 2);
  }, 0);
  const brier_score = joined ? brierSum / joined : undefined;

  const observedRate =
    joined > 0 ? pairs.reduce((acc, pair) => acc + (pair.outcome.event_present ? 1 : 0), 0) / joined : 0;
  const null_rate_brier =
    joined > 0 ? pairs.reduce((acc, pair) => acc + Math.pow(observedRate - (pair.outcome.event_present ? 1 : 0), 2), 0) / joined : undefined;

  const persistence_brier =
    joined > 1
      ? pairs.reduce((acc, pair, idx) => {
          const y = pair.outcome.event_present ? 1 : 0;
          const prev = pairs[Math.max(0, idx - 1)].forecast.p_event;
          return acc + Math.pow(prev - y, 2);
        }, 0) / joined
      : undefined;

  const shuffledProbs = pairs.map((p) => p.forecast.p_event).reverse();
  const shuffled_brier =
    joined > 0
      ? pairs.reduce((acc, pair, idx) => {
          const y = pair.outcome.event_present ? 1 : 0;
          const alt = shuffledProbs[idx] ?? observedRate;
          return acc + Math.pow(alt - y, 2);
        }, 0) / joined
      : undefined;

  const bins: { bin_start: number; bin_end: number; sumProb: number; count: number; sumObs: number }[] = [];
  const BIN_COUNT = 5;
  for (let i = 0; i < BIN_COUNT; i++) {
    bins.push({ bin_start: i / BIN_COUNT, bin_end: (i + 1) / BIN_COUNT, sumProb: 0, count: 0, sumObs: 0 });
  }
  for (const pair of pairs) {
    const p = clamp(pair.forecast.p_event, 0, 1);
    const idx = Math.min(BIN_COUNT - 1, Math.floor(p * BIN_COUNT));
    bins[idx].sumProb += p;
    bins[idx].sumObs += pair.outcome.event_present ? 1 : 0;
    bins[idx].count += 1;
  }
  const reliability = bins
    .filter((b) => b.count > 0)
    .map((b) => ({
      bin_start: b.bin_start,
      bin_end: b.bin_end,
      forecast_freq: b.sumProb / b.count,
      observed_freq: b.sumObs / b.count,
    }));

  const aucScore = auc(pairs);

  const inputs_hash = hashStableJson({
    kind: "solar_eval/input",
    v: 1,
    model_version: filters?.model_version ?? null,
    horizon_s: filters?.horizon_s ?? null,
    forecast_hashes: pairs.map((p) => p.forecast.features_hash),
    outcome_hashes: pairs.map((p) => p.outcome.features_hash),
  });
  const features_hash = sha256Prefixed(
    Buffer.from(
      JSON.stringify({
        count,
        joined,
        brier_score,
        auc: aucScore,
        baselines: { null_rate_brier, persistence_brier, shuffled_brier },
        reliability,
      }),
      "utf8",
    ),
  );

  const information_boundary = buildInformationBoundaryFromHashes({
    data_cutoff_iso: pairs.length
      ? pairs[pairs.length - 1].forecast.data_cutoff_iso
      : new Date().toISOString(),
    mode: "observables",
    labels_used_as_features: false,
    event_features_included: false,
    inputs_hash,
    features_hash,
  });

  return SolarEvalReport.parse({
    schema_version: "solar_eval/1",
    kind: "solar_eval",
    count,
    joined,
    horizon_s: filters?.horizon_s,
    model_version: filters?.model_version,
    brier_score,
    auc: aucScore,
    baselines: {
      null_rate_brier,
      persistence_brier,
      shuffled_brier,
    },
    reliability,
    data_cutoff_iso: information_boundary.data_cutoff_iso,
    inputs_hash,
    features_hash,
    information_boundary,
  });
}

const clamp = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};
