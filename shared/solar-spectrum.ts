import { z } from "zod";
import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";
import { SI_UNITS, UnitSystemSI } from "./unit-system";

const stripDataUrlPrefix = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed.startsWith("data:")) {
    const comma = trimmed.indexOf(",");
    if (comma >= 0) {
      return trimmed.slice(comma + 1).replace(/\s+/g, "");
    }
  }
  return trimmed.replace(/\s+/g, "");
};

export const Float64VectorB64 = z.object({
  encoding: z.literal("base64"),
  dtype: z.literal("float64"),
  endian: z.literal("little"),
  data_b64: z.preprocess(stripDataUrlPrefix, z.string().min(1)),
});

export type TFloat64VectorB64 = z.infer<typeof Float64VectorB64>;

export const SolarSpectrumView = z.enum([
  "disk_integrated",
  "disk_center",
  "intermediate",
]);

export type TSolarSpectrumView = z.infer<typeof SolarSpectrumView>;

export const SolarSpectrumSeries = z.object({
  series_id: z.string().min(1),
  view: SolarSpectrumView,
  mu: z.number().min(0).max(1).nullable().optional(),
  wavelength_m: Float64VectorB64,
  ssi_W_m2_m: Float64VectorB64,
  uncertainty_pct: Float64VectorB64.optional(),
  label: z.string().optional(),
  notes: z.string().optional(),
});

export type TSolarSpectrumSeries = z.infer<typeof SolarSpectrumSeries>;

export const SolarSpectrum = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("solar_spectrum/1"),
  kind: z.literal("solar_spectrum"),
  units: UnitSystemSI.default(SI_UNITS),
  source: z.object({
    dataset: z.string().min(1),
    version: z.string().optional(),
    file: z.string().min(1),
    view: SolarSpectrumView.optional(),
    instrument: z.string().optional(),
    citation: z.string().optional(),
    observed_at: z.string().optional(),
    raw_hash: z.string().optional(),
    notes: z.string().optional(),
  }),
  series: z.array(SolarSpectrumSeries).min(1),
});

export type TSolarSpectrum = z.infer<typeof SolarSpectrum>;

export const float64ToBase64 = (arr: Float64Array): string =>
  Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).toString("base64");

export const base64ToFloat64 = (input: string): Float64Array => {
  const clean = input.trim().replace(/^data:[^,]+,/, "").replace(/\s+/g, "");
  const buf = Buffer.from(clean, "base64");
  return new Float64Array(buf.buffer, buf.byteOffset, buf.byteLength / 8);
};

export const encodeFloat64Vector = (arr: Float64Array): TFloat64VectorB64 => ({
  encoding: "base64",
  dtype: "float64",
  endian: "little",
  data_b64: float64ToBase64(arr),
});

export const decodeFloat64Vector = (vector: TFloat64VectorB64): Float64Array =>
  base64ToFloat64(vector.data_b64);
