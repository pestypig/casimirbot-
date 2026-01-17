import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { EssenceEnvelope } from "@shared/essence-schema";
import {
  SolarSpectrum,
  type TSolarSpectrum,
  type TSolarSpectrumView,
  encodeFloat64Vector,
  float64ToBase64,
} from "@shared/solar-spectrum";
import {
  SolarSpectrumAnalysis,
  type TSolarSpectrumAnalysis,
  analyzeSolarSpectrum,
  type SolarSpectrumAnalysisOptions,
  type SolarSpectrumAnalysisResult,
  type SolarSpectrumSeriesValues,
} from "@shared/solar-spectrum-analysis";
import { SI_UNITS } from "@shared/unit-system";
import { putBlob } from "../../storage";
import { putEnvelope } from "./store";
import {
  buildInformationBoundaryFromHashes,
  hashStableJson,
  sha256Hex,
  sha256Prefixed,
} from "../../utils/information-boundary";
import { stableJsonStringify } from "../../utils/stable-json";

export type SolarSpectrumFormat = "solar-iss" | "solar-hrs" | "solar-hrs-mu";
export type SolarSpectrumDataset = "solar-iss" | "solar-hrs";

export type SolarSpectrumIngestSpec = {
  id: string;
  dataset: SolarSpectrumDataset;
  version: string;
  format: SolarSpectrumFormat;
  view: TSolarSpectrumView;
  file: string;
  data_cutoff_iso: string;
  instrument?: string;
  citation?: string;
  observed_at?: string;
  notes?: string;
};

export type SolarSpectrumIngestOptions = {
  baseDir?: string;
  persistEnvelope?: boolean;
  personaId?: string;
  analysis?: SolarSpectrumAnalysisOptions;
};

export type SolarSpectrumIngestResult = {
  spectrum: TSolarSpectrum;
  analysis: TSolarSpectrumAnalysis;
  envelopeId?: string;
  spectrumUrl?: string;
  analysisUrl?: string;
};

const SOLAR_SPECTRA_ROOT = path.resolve(process.cwd(), "datasets", "solar", "spectra");
const DEFAULT_DATA_CUTOFF = "2025-01-01T00:00:00.000Z";
const DEFAULT_MU_GRID = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.05];

export const DEFAULT_SOLAR_SPECTRUM_SPECS: SolarSpectrumIngestSpec[] = [
  {
    id: "solar-iss-v1.1-disk-integrated",
    dataset: "solar-iss",
    version: "v1.1",
    format: "solar-iss",
    view: "disk_integrated",
    file: path.join("solar-iss", "v1.1", "spectrum.dat"),
    data_cutoff_iso: DEFAULT_DATA_CUTOFF,
    instrument: "SOLAR-ISS",
    citation: "VizieR J/A+A/611/A1",
  },
  {
    id: "solar-hrs-v1-disk-integrated",
    dataset: "solar-hrs",
    version: "v1",
    format: "solar-hrs",
    view: "disk_integrated",
    file: path.join("solar-hrs", "v1", "Spectre_HR_LATMOS_Meftah_V1.txt"),
    data_cutoff_iso: DEFAULT_DATA_CUTOFF,
    instrument: "SOLAR-HRS",
    citation: "VizieR VI/159",
  },
  {
    id: "solar-hrs-v1-disk-center",
    dataset: "solar-hrs",
    version: "v1",
    format: "solar-hrs",
    view: "disk_center",
    file: path.join("solar-hrs", "v1", "Spectre_HR_Disk_Center_LATMOS_Meftah_V1_1.txt"),
    data_cutoff_iso: DEFAULT_DATA_CUTOFF,
    instrument: "SOLAR-HRS",
    citation: "VizieR VI/159",
  },
  {
    id: "solar-hrs-v1-mu-grid",
    dataset: "solar-hrs",
    version: "v1",
    format: "solar-hrs-mu",
    view: "intermediate",
    file: path.join("solar-hrs", "v1", "Spectre_HR_Solar_position_LATMOS_Meftah_V1_1.txt"),
    data_cutoff_iso: DEFAULT_DATA_CUTOFF,
    instrument: "SOLAR-HRS",
    citation: "VizieR VI/159",
  },
];

const resolveSpectrumPath = (file: string, baseDir?: string): string =>
  path.isAbsolute(file) ? file : path.resolve(baseDir ?? SOLAR_SPECTRA_ROOT, file);

const parseNumber = (token: string): number => Number(token.replace(/[dD]/g, "e"));

const parseLineNumbers = (line: string): number[] => {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  const values = tokens.map(parseNumber).filter((value) => Number.isFinite(value));
  return values;
};

const parseMuHeader = (line: string): number[] | null => {
  const lower = line.toLowerCase();
  if (!lower.includes("mu")) return null;
  const matches = line.match(/[-+]?\d*\.?\d+(?:[eEdD][-+]?\d+)?/g);
  if (!matches) return null;
  const values = matches.map(parseNumber).filter((v) => Number.isFinite(v) && v >= 0 && v <= 1);
  return values.length >= 2 ? values : null;
};

const convertSeriesUnits = (values: number[], scale: number): Float64Array => {
  const out = new Float64Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    out[i] = values[i] * scale;
  }
  return out;
};

const toMeters = (lambdaNm: number[]): Float64Array => convertSeriesUnits(lambdaNm, 1e-9);
const toWPerM2PerM = (ssiNm: number[]): Float64Array => convertSeriesUnits(ssiNm, 1e9);

const buildSeriesId = (baseId: string, view: TSolarSpectrumView, mu?: number | null): string => {
  if (mu === null || mu === undefined) {
    return `${baseId}:${view}`;
  }
  return `${baseId}:mu-${mu.toFixed(2)}`;
};

const hashFloat64 = (arr: Float64Array): string =>
  sha256Prefixed(Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength));

const computeWavelengthBounds = (
  series: SolarSpectrumSeriesValues[],
): { min: number | null; max: number | null } => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const entry of series) {
    for (let i = 0; i < entry.wavelength_m.length; i += 1) {
      const value = entry.wavelength_m[i];
      if (!Number.isFinite(value)) continue;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: null, max: null };
  }
  return { min, max };
};

const buildSpectrumHashes = (series: SolarSpectrumSeriesValues[]): { features_hash: string } => {
  const seriesHashes = series.map((entry) => ({
    series_id: entry.series_id,
    view: entry.view,
    mu: entry.mu ?? null,
    wavelength_hash: hashFloat64(entry.wavelength_m),
    ssi_hash: hashFloat64(entry.ssi_W_m2_m),
    uncertainty_hash: entry.uncertainty_pct ? hashFloat64(entry.uncertainty_pct) : null,
  }));
  return {
    features_hash: hashStableJson({
      kind: "solar_spectrum/features",
      v: 1,
      series: seriesHashes,
    }),
  };
};

const buildAnalysisHashes = (
  analysis: SolarSpectrumAnalysisResult,
  spectrum: TSolarSpectrum,
): { inputs_hash: string; features_hash: string } => {
  const seriesHashes = analysis.series.map((entry) => ({
    series_id: entry.series_id,
    view: entry.view,
    mu: entry.mu ?? null,
    t_fit_K: entry.t_fit_K ?? null,
    t_fit_scale: entry.t_fit_scale ?? null,
    summary: entry.summary,
    band_integrals: entry.band_integrals ?? [],
    tb_hash: hashFloat64(entry.tb_K),
    eps_t0_hash: hashFloat64(entry.eps_eff_t0),
    eps_fit_hash: entry.eps_eff_tfit ? hashFloat64(entry.eps_eff_tfit) : null,
    ratio_hash: entry.ratio_fit ? hashFloat64(entry.ratio_fit) : null,
    log_resid_hash: entry.log_resid_fit ? hashFloat64(entry.log_resid_fit) : null,
  }));
  const limbDarkening = (analysis.limb_darkening ?? []).map((curve) => ({
    band_id: curve.band_id,
    view: curve.view,
    reference_mu: curve.reference_mu,
    reference_integral_W_m2: curve.reference_integral_W_m2,
    points: curve.points.map((point) => ({
      mu: point.mu,
      ratio: point.ratio,
      ssi_integral_W_m2: point.ssi_integral_W_m2,
    })),
  }));

  return {
    inputs_hash: hashStableJson({
      kind: "solar_spectrum_analysis/input",
      v: 1,
      spectrum_inputs_hash: spectrum.inputs_hash,
      spectrum_features_hash: spectrum.features_hash,
      t0_K: analysis.t0_K,
      omega_sun_sr: analysis.omega_sun_sr,
      fit_config: analysis.fit_config,
      bands: analysis.bands,
    }),
    features_hash: hashStableJson({
      kind: "solar_spectrum_analysis/features",
      v: 1,
      series: seriesHashes,
      limb_darkening: limbDarkening,
    }),
  };
};

export const parseSolarIssSpectrum = (raw: string): {
  wavelength_nm: number[];
  ssi_W_m2_nm: number[];
  uncertainty_pct: number[];
} => {
  const wavelength_nm: number[] = [];
  const ssi_W_m2_nm: number[] = [];
  const uncertainty_pct: number[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) continue;
    const values = parseLineNumbers(trimmed);
    if (values.length < 3) continue;
    wavelength_nm.push(values[0]);
    ssi_W_m2_nm.push(values[1]);
    uncertainty_pct.push(values[2]);
  }
  return { wavelength_nm, ssi_W_m2_nm, uncertainty_pct };
};

export const parseSolarHrsSpectrum = (raw: string): {
  wavelength_nm: number[];
  ssi_W_m2_nm: number[];
} => {
  const wavelength_nm: number[] = [];
  const ssi_W_m2_nm: number[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";")) continue;
    const values = parseLineNumbers(trimmed);
    if (values.length < 2) continue;
    wavelength_nm.push(values[0]);
    ssi_W_m2_nm.push(values[1]);
  }
  return { wavelength_nm, ssi_W_m2_nm };
};

export const parseSolarHrsMuSpectrum = (raw: string): Array<{
  mu: number;
  wavelength_nm: number[];
  ssi_W_m2_nm: number[];
}> => {
  let muValues: number[] | null = null;
  const rows: number[][] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith(";")) {
      const parsed = parseMuHeader(trimmed);
      if (parsed) {
        muValues = parsed;
      }
      continue;
    }
    const values = parseLineNumbers(trimmed);
    if (values.length >= 3) {
      rows.push(values);
    }
  }

  const wideRow = rows.find((row) => row.length > 3);
  if (wideRow) {
    const width = wideRow.length - 1;
    const muGrid =
      muValues && muValues.length === width
        ? muValues
        : DEFAULT_MU_GRID.length === width
          ? DEFAULT_MU_GRID
          : null;
    if (!muGrid) {
      throw new Error(`solar_hrs_mu_grid_mismatch:${width}`);
    }
    const series = muGrid.map((mu) => ({
      mu,
      wavelength_nm: [] as number[],
      ssi_W_m2_nm: [] as number[],
    }));
    for (const row of rows) {
      if (row.length < width + 1) continue;
      const lambda = row[0];
      for (let i = 0; i < width; i += 1) {
        const target = series[i];
        target.wavelength_nm.push(lambda);
        target.ssi_W_m2_nm.push(row[i + 1]);
      }
    }
    return series;
  }

  const seriesMap = new Map<number, { mu: number; wavelength_nm: number[]; ssi_W_m2_nm: number[] }>();
  for (const row of rows) {
    if (row.length < 3) continue;
    const lambda = row[0];
    const mu = row[1];
    const ssi = row[2];
    const key = Number(mu.toFixed(4));
    const entry =
      seriesMap.get(key) ??
      (() => {
        const created = { mu, wavelength_nm: [], ssi_W_m2_nm: [] };
        seriesMap.set(key, created);
        return created;
      })();
    entry.wavelength_nm.push(lambda);
    entry.ssi_W_m2_nm.push(ssi);
  }
  const series = Array.from(seriesMap.values());
  series.sort((a, b) => b.mu - a.mu);
  return series;
};

const buildSolarSpectrumArtifact = (
  spec: SolarSpectrumIngestSpec,
  filePath: string,
  rawBuffer: Buffer,
  series: SolarSpectrumSeriesValues[],
  inputs_hash: string,
  features_hash: string,
): TSolarSpectrum => {
  const information_boundary = buildInformationBoundaryFromHashes({
    data_cutoff_iso: spec.data_cutoff_iso,
    mode: "observables",
    labels_used_as_features: false,
    event_features_included: false,
    inputs_hash,
    features_hash,
  });

  const sourceFile = path.relative(process.cwd(), filePath);
  return SolarSpectrum.parse({
    schema_version: "solar_spectrum/1",
    kind: "solar_spectrum",
    data_cutoff_iso: spec.data_cutoff_iso,
    inputs_hash,
    features_hash,
    information_boundary,
    units: SI_UNITS,
    source: {
      dataset: spec.dataset,
      version: spec.version,
      file: sourceFile,
      view: spec.view,
      instrument: spec.instrument,
      citation: spec.citation,
      observed_at: spec.observed_at,
      notes: spec.notes,
      raw_hash: sha256Hex(rawBuffer),
    },
    series: series.map((entry) => ({
      series_id: entry.series_id,
      view: entry.view,
      mu: entry.mu ?? null,
      wavelength_m: encodeFloat64Vector(entry.wavelength_m),
      ssi_W_m2_m: encodeFloat64Vector(entry.ssi_W_m2_m),
      uncertainty_pct: entry.uncertainty_pct ? encodeFloat64Vector(entry.uncertainty_pct) : undefined,
    })),
  });
};

const buildSolarSpectrumAnalysisArtifact = (
  spectrum: TSolarSpectrum,
  analysis: SolarSpectrumAnalysisResult,
  inputs_hash: string,
  features_hash: string,
): TSolarSpectrumAnalysis => {
  const information_boundary = buildInformationBoundaryFromHashes({
    data_cutoff_iso: spectrum.data_cutoff_iso,
    mode: "observables",
    labels_used_as_features: false,
    event_features_included: false,
    inputs_hash,
    features_hash,
  });

  return SolarSpectrumAnalysis.parse({
    schema_version: "solar_spectrum_analysis/1",
    kind: "solar_spectrum_analysis",
    data_cutoff_iso: spectrum.data_cutoff_iso,
    inputs_hash,
    features_hash,
    information_boundary,
    source_inputs_hash: spectrum.inputs_hash,
    t0_K: analysis.t0_K,
    omega_sun_sr: analysis.omega_sun_sr,
    fit_config: analysis.fit_config,
    bands: analysis.bands.length ? analysis.bands : undefined,
    series: analysis.series.map((entry) => ({
      series_id: entry.series_id,
      view: entry.view,
      mu: entry.mu ?? null,
      t_fit_K: entry.t_fit_K,
      t_fit_scale: entry.t_fit_scale,
      tb_K: { encoding: "base64", dtype: "float64", endian: "little", data_b64: float64ToBase64(entry.tb_K) },
      eps_eff_t0: {
        encoding: "base64",
        dtype: "float64",
        endian: "little",
        data_b64: float64ToBase64(entry.eps_eff_t0),
      },
      eps_eff_tfit: entry.eps_eff_tfit
        ? { encoding: "base64", dtype: "float64", endian: "little", data_b64: float64ToBase64(entry.eps_eff_tfit) }
        : undefined,
      ratio_fit: entry.ratio_fit
        ? { encoding: "base64", dtype: "float64", endian: "little", data_b64: float64ToBase64(entry.ratio_fit) }
        : undefined,
      log_resid_fit: entry.log_resid_fit
        ? { encoding: "base64", dtype: "float64", endian: "little", data_b64: float64ToBase64(entry.log_resid_fit) }
        : undefined,
      band_integrals: entry.band_integrals?.length ? entry.band_integrals : undefined,
      summary: entry.summary,
    })),
    limb_darkening: analysis.limb_darkening?.length ? analysis.limb_darkening : undefined,
  });
};

const persistSolarSpectrumEnvelope = async (
  spectrum: TSolarSpectrum,
  analysis: TSolarSpectrumAnalysis,
  spec: SolarSpectrumIngestSpec,
  bounds: { min: number | null; max: number | null },
  personaId?: string,
): Promise<{ envelopeId: string; spectrumUrl: string; analysisUrl?: string }> => {
  const spectrumJson = stableJsonStringify(spectrum);
  const spectrumBuf = Buffer.from(spectrumJson, "utf8");
  const spectrumHash = sha256Hex(spectrumBuf);
  const spectrumBlob = await putBlob(spectrumBuf, { contentType: "application/json" });

  let analysisBlob: { uri: string; cid?: string } | null = null;
  if (analysis) {
    const analysisJson = stableJsonStringify(analysis);
    const analysisBuf = Buffer.from(analysisJson, "utf8");
    analysisBlob = await putBlob(analysisBuf, { contentType: "application/json" });
  }

  const now = new Date().toISOString();
  const lambdaMin = bounds.min;
  const lambdaMax = bounds.max;

  const envelope = EssenceEnvelope.parse({
    header: {
      id: randomUUID(),
      version: "essence/1.0",
      modality: "multimodal",
      created_at: now,
      source: {
        uri: "compute://solar-spectrum",
        original_hash: { algo: "sha256", value: spectrumHash },
        creator_id: personaId ?? "persona:solar-spectrum",
        cid: spectrumBlob.cid,
        license: "CC-BY-4.0",
      },
      rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
      acl: { visibility: "public", groups: [] },
    },
    features: {
      physics: {
        kind: "solar-spectrum",
        summary: {
          dataset: spec.dataset,
          version: spec.version,
          view: spec.view,
          series_count: spectrum.series.length,
          wavelength_min_m: lambdaMin ?? undefined,
          wavelength_max_m: lambdaMax ?? undefined,
        },
        artifacts: {
          spectrum_url: spectrumBlob.uri,
          spectrum_cid: spectrumBlob.cid,
          analysis_url: analysisBlob?.uri,
          analysis_cid: analysisBlob?.cid,
        },
      },
    },
    embeddings: [],
    provenance: {
      pipeline: [
        {
          name: "solar-spectrum-ingest",
          impl_version: "1.0.0",
          lib_hash: { algo: "sha256", value: sha256Hex(Buffer.from("solar-spectrum-ingest@1", "utf8")) },
          params: {
            dataset: spec.dataset,
            version: spec.version,
            view: spec.view,
            series_count: spectrum.series.length,
            file: spectrum.source.file,
          },
          input_hash: { algo: "sha256", value: spectrum.inputs_hash.replace(/^sha256:/, "") },
          output_hash: { algo: "sha256", value: spectrumHash },
          started_at: spectrum.data_cutoff_iso,
          ended_at: spectrum.data_cutoff_iso,
        },
      ],
      merkle_root: { algo: "sha256", value: spectrumHash },
      previous: null,
      signatures: [],
      information_boundary: spectrum.information_boundary,
    },
  });

  await putEnvelope(envelope);
  return { envelopeId: envelope.header.id, spectrumUrl: spectrumBlob.uri, analysisUrl: analysisBlob?.uri };
};

const buildSeriesFromIss = (spec: SolarSpectrumIngestSpec, raw: string): SolarSpectrumSeriesValues[] => {
  const parsed = parseSolarIssSpectrum(raw);
  const seriesId = buildSeriesId(spec.id, spec.view);
  return [
    {
      series_id: seriesId,
      view: spec.view,
      mu: null,
      wavelength_m: toMeters(parsed.wavelength_nm),
      ssi_W_m2_m: toWPerM2PerM(parsed.ssi_W_m2_nm),
      uncertainty_pct: new Float64Array(parsed.uncertainty_pct),
    },
  ];
};

const buildSeriesFromHrs = (spec: SolarSpectrumIngestSpec, raw: string): SolarSpectrumSeriesValues[] => {
  const parsed = parseSolarHrsSpectrum(raw);
  const seriesId = buildSeriesId(spec.id, spec.view);
  return [
    {
      series_id: seriesId,
      view: spec.view,
      mu: null,
      wavelength_m: toMeters(parsed.wavelength_nm),
      ssi_W_m2_m: toWPerM2PerM(parsed.ssi_W_m2_nm),
    },
  ];
};

const buildSeriesFromHrsMu = (spec: SolarSpectrumIngestSpec, raw: string): SolarSpectrumSeriesValues[] => {
  const parsed = parseSolarHrsMuSpectrum(raw);
  return parsed.map((entry) => ({
    series_id: buildSeriesId(spec.id, spec.view, entry.mu),
    view: spec.view,
    mu: entry.mu,
    wavelength_m: toMeters(entry.wavelength_nm),
    ssi_W_m2_m: toWPerM2PerM(entry.ssi_W_m2_nm),
  }));
};

export async function ingestSolarSpectrumFile(
  spec: SolarSpectrumIngestSpec,
  opts: SolarSpectrumIngestOptions = {},
): Promise<SolarSpectrumIngestResult> {
  const filePath = resolveSpectrumPath(spec.file, opts.baseDir);
  const rawBuffer = fs.readFileSync(filePath);
  const raw = rawBuffer.toString("utf8");

  let series: SolarSpectrumSeriesValues[] = [];
  switch (spec.format) {
    case "solar-iss":
      series = buildSeriesFromIss(spec, raw);
      break;
    case "solar-hrs":
      series = buildSeriesFromHrs(spec, raw);
      break;
    case "solar-hrs-mu":
      series = buildSeriesFromHrsMu(spec, raw);
      break;
    default:
      throw new Error(`solar_spectrum_unknown_format:${spec.format}`);
  }

  if (!series.length) {
    throw new Error(`solar_spectrum_no_series:${spec.id}`);
  }

  const raw_hash = sha256Prefixed(rawBuffer);
  const { features_hash } = buildSpectrumHashes(series);
  const inputs_hash = hashStableJson({
    kind: "solar_spectrum/input",
    v: 1,
    dataset: spec.dataset,
    version: spec.version,
    view: spec.view,
    format: spec.format,
    file: path.relative(process.cwd(), filePath),
    raw_hash,
  });
  const spectrum = buildSolarSpectrumArtifact(spec, filePath, rawBuffer, series, inputs_hash, features_hash);

  const analysisResult = analyzeSolarSpectrum(series, opts.analysis);
  const analysisHashes = buildAnalysisHashes(analysisResult, spectrum);
  const analysis = buildSolarSpectrumAnalysisArtifact(
    spectrum,
    analysisResult,
    analysisHashes.inputs_hash,
    analysisHashes.features_hash,
  );
  const wavelengthBounds = computeWavelengthBounds(series);

  let envelopeId: string | undefined;
  let spectrumUrl: string | undefined;
  let analysisUrl: string | undefined;
  if (opts.persistEnvelope) {
    const persisted = await persistSolarSpectrumEnvelope(
      spectrum,
      analysis,
      spec,
      wavelengthBounds,
      opts.personaId,
    );
    envelopeId = persisted.envelopeId;
    spectrumUrl = persisted.spectrumUrl;
    analysisUrl = persisted.analysisUrl;
  }

  return { spectrum, analysis, envelopeId, spectrumUrl, analysisUrl };
}

export async function ingestSolarSpectrumDefaults(
  specs = DEFAULT_SOLAR_SPECTRUM_SPECS,
  opts: SolarSpectrumIngestOptions = {},
): Promise<SolarSpectrumIngestResult[]> {
  const results: SolarSpectrumIngestResult[] = [];
  for (const spec of specs) {
    results.push(await ingestSolarSpectrumFile(spec, opts));
  }
  return results;
}
