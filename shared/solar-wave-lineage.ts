import { z } from "zod";
import { sharedObservableContractSchema } from "./solar-flare-observable";

export const solarWaveObservableKindSchema = z.enum([
  "spectral_cube",
  "line_fit_series",
  "wave_psd",
  "wavelet_spectrogram",
  "coherence_map",
  "in_situ_psd",
]);
export type SolarWaveObservableKind = z.infer<typeof solarWaveObservableKindSchema>;

export const spectralFormationRegionSchema = z.enum([
  "photosphere",
  "chromosphere",
  "corona",
  "heliosphere",
]);
export type SpectralFormationRegion = z.infer<typeof spectralFormationRegionSchema>;

export const spectralDriverOriginSchema = z.enum([
  "p_mode",
  "flare",
  "active_region_wave",
  "compressive_mhd",
  "mass_flow",
  "unknown",
]);
export type SpectralDriverOrigin = z.infer<typeof spectralDriverOriginSchema>;

export const spectralHypothesisStatusSchema = z.enum([
  "descriptive",
  "supported",
  "contradicted",
]);
export type SpectralHypothesisStatus = z.infer<typeof spectralHypothesisStatusSchema>;

export const spectralOriginHypothesisSchema = z.object({
  transition_id: z.string().min(1),
  formation_region: spectralFormationRegionSchema,
  driver_origin: spectralDriverOriginSchema,
  measurement_region: z.string().min(1),
  evidence_refs: z.array(z.string().min(1)).min(1),
  confidence: z.number().min(0).max(1),
  status: spectralHypothesisStatusSchema,
});
export type SpectralOriginHypothesis = z.infer<typeof spectralOriginHypothesisSchema>;

export const remoteInstrumentSchema = z.enum([
  "DKIST_CRYO_NIRSP",
  "DKIST_VISP",
  "SDO_AIA",
  "OTHER",
]);
export type RemoteInstrument = z.infer<typeof remoteInstrumentSchema>;

export const inSituInstrumentSchema = z.enum([
  "PARKER_SOLAR_PROBE",
  "SOLAR_ORBITER",
  "WIND",
  "OTHER",
]);
export type InSituInstrument = z.infer<typeof inSituInstrumentSchema>;

export const solarSpectralCubeSchema = sharedObservableContractSchema
  .extend({
    kind: z.literal("spectral_cube"),
    modality: z.literal("spectrogram"),
    instrument: remoteInstrumentSchema,
    line_ids: z.array(z.string().min(1)).min(1),
    wcs_ref: z.string().min(1),
    geometry_ref: z.string().min(1),
    measurement_region: z.string().min(1),
    off_limb: z.boolean().default(false),
    context_image_refs: z.array(z.string().min(1)).optional(),
    origin_hypotheses: z.array(spectralOriginHypothesisSchema).optional(),
  })
  .superRefine((value, context) => {
    const axisNames = new Set(value.axes.map((entry) => entry.name));
    const requiredAxes = [
      "helioprojective_longitude",
      "wavelength",
      "helioprojective_latitude",
      "time",
    ];
    for (const axis of requiredAxes) {
      if (!axisNames.has(axis)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["axes"],
          message: `DKIST spectral-cube observable missing required axis: ${axis}`,
        });
      }
    }
  });
export type SolarSpectralCube = z.infer<typeof solarSpectralCubeSchema>;

export const solarLineFitSeriesSchema = sharedObservableContractSchema.extend({
  kind: z.literal("line_fit_series"),
  modality: z.literal("time_series"),
  source_spectral_cube_ref: z.string().min(1),
  geometry_ref: z.string().min(1),
  fit_method_ref: z.string().min(1),
  line_id: z.string().min(1),
  fit_parameters_ref: z.string().min(1),
  origin_hypotheses: z.array(spectralOriginHypothesisSchema).optional(),
});
export type SolarLineFitSeries = z.infer<typeof solarLineFitSeriesSchema>;

export const wavePsdObservableSchema = sharedObservableContractSchema.extend({
  kind: z.literal("wave_psd"),
  modality: z.enum(["time_series", "spectrogram"]),
  source_observable_ref: z.string().min(1),
  frequency_axis_unit: z.enum(["Hz", "mHz"]),
  psd_method_ref: z.string().min(1),
  peak_frequency_mhz: z.number().positive().optional(),
  significance_sigma: z.number().nonnegative().optional(),
});
export type WavePsdObservable = z.infer<typeof wavePsdObservableSchema>;

export const crossObservableCoherenceSchema = sharedObservableContractSchema.extend({
  kind: z.literal("coherence_map"),
  modality: z.literal("spectrogram"),
  observable_a_ref: z.string().min(1),
  observable_b_ref: z.string().min(1),
  frequency_band_mhz: z.tuple([z.number().positive(), z.number().positive()]),
  coherence_method_ref: z.string().min(1),
  phase_relation: z.enum(["in_phase", "anti_phase", "mixed", "unknown"]).optional(),
});
export type CrossObservableCoherence = z.infer<typeof crossObservableCoherenceSchema>;

export const heliosphericWaveObservableSchema = sharedObservableContractSchema.extend({
  kind: z.literal("in_situ_psd"),
  modality: z.enum(["time_series", "spectrogram", "channel_series"]),
  instrument: inSituInstrumentSchema,
  frame: z.enum(["RTN", "other"]),
  heliocentric_distance_rsun: z.number().positive(),
  frequency_band_mhz: z.tuple([z.number().positive(), z.number().positive()]),
  peak_frequency_mhz: z.number().positive().optional(),
  significance_sigma: z.number().nonnegative().optional(),
  polarization: z.enum(["alfvenic", "compressive", "mixed", "unknown"]).optional(),
  dominant_component: z.string().optional(),
});
export type HeliosphericWaveObservable = z.infer<typeof heliosphericWaveObservableSchema>;

export const solarWaveObservableSchema = z.union([
  solarSpectralCubeSchema,
  solarLineFitSeriesSchema,
  wavePsdObservableSchema,
  crossObservableCoherenceSchema,
  heliosphericWaveObservableSchema,
]);
export type SolarWaveObservable = z.infer<typeof solarWaveObservableSchema>;

export const solarEventLineageSchema = z
  .object({
    event_id: z.string().min(1),
    remote_observable_refs: z.array(z.string().min(1)).min(1),
    in_situ_observable_refs: z.array(z.string().min(1)).optional(),
    frequency_band_mhz: z.tuple([z.number().positive(), z.number().positive()]).optional(),
    carrington_window_ref: z.string().optional(),
    heliocentric_geometry_ref: z.string().optional(),
    propagation_hypothesis: z.string().optional(),
    evidence_status: z.enum(["candidate", "supported", "rejected"]),
    hard_identity_asserted: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    const hasInSitu = Boolean(
      value.in_situ_observable_refs && value.in_situ_observable_refs.length > 0,
    );
    if (hasInSitu && !value.frequency_band_mhz) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["frequency_band_mhz"],
        message: "Remote-to-in-situ lineage requires explicit frequency-band evidence.",
      });
    }
    if (hasInSitu && !value.heliocentric_geometry_ref) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["heliocentric_geometry_ref"],
        message: "Remote-to-in-situ lineage requires heliocentric geometry context.",
      });
    }
    if (value.hard_identity_asserted) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hard_identity_asserted"],
        message:
          "Remote-to-in-situ linkage is hypothesis-level evidence, not ground-truth identity.",
      });
    }
  });
export type SolarEventLineage = z.infer<typeof solarEventLineageSchema>;

export function ingestSolarWaveObservable<T extends SolarWaveObservable>(
  observable: T,
): T {
  return solarWaveObservableSchema.parse(observable) as T;
}
