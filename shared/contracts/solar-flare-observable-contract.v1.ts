import type { ObservableContractV1 } from "./observable-contract.v1";

export const SOLAR_FLARE_SPECTRAL_OBSERVABLE_SCHEMA_VERSION =
  "solar_flare_spectral_observable/v1";

export const SOLAR_FLARE_INSTRUMENT_VALUES = [
  "DKIST_ViSP",
  "DKIST_VBI",
  "SDO_AIA",
  "OTHER",
] as const;

export const SOLAR_FLARE_PHASE_VALUES = [
  "precursor",
  "impulsive",
  "decay",
] as const;

export const SOLAR_FLARE_STOKES_MODE_VALUES = ["I", "IQUV", "other"] as const;

export const SOLAR_FLARE_RIBBON_SEGMENT_VALUES = [
  "leading_edge",
  "center",
  "trailing_edge",
  "mixed",
] as const;

export const SOLAR_FLARE_SUBTRACTION_METHOD_VALUES = [
  "nonflare_subtraction",
  "none",
  "other",
] as const;

export const SOLAR_FLARE_HEATING_FAMILY_VALUES = [
  "electron_beam",
  "conduction",
  "mixed",
  "alfvenic",
  "proton_beam",
  "other",
] as const;

export const SOLAR_FLARE_INTERPRETATION_STATUS_VALUES = [
  "descriptive",
  "suggestive",
  "validated",
] as const;

export const SOLAR_FLARE_OPTICAL_DEPTH_REGIME_VALUES = [
  "optically_thin",
  "optically_thick",
  "mixed",
] as const;

export type SolarFlareInstrument =
  (typeof SOLAR_FLARE_INSTRUMENT_VALUES)[number];
export type SolarFlarePhase = (typeof SOLAR_FLARE_PHASE_VALUES)[number];
export type SolarFlareStokesMode =
  (typeof SOLAR_FLARE_STOKES_MODE_VALUES)[number];
export type SolarFlareRibbonSegment =
  (typeof SOLAR_FLARE_RIBBON_SEGMENT_VALUES)[number];
export type SolarFlareSubtractionMethod =
  (typeof SOLAR_FLARE_SUBTRACTION_METHOD_VALUES)[number];
export type SolarFlareHeatingFamily =
  (typeof SOLAR_FLARE_HEATING_FAMILY_VALUES)[number];
export type SolarFlareInterpretationStatus =
  (typeof SOLAR_FLARE_INTERPRETATION_STATUS_VALUES)[number];
export type SolarFlareOpticalDepthRegime =
  (typeof SOLAR_FLARE_OPTICAL_DEPTH_REGIME_VALUES)[number];

export interface SolarFlareLineWindow {
  line_id: string;
  wavelength_min_nm: number;
  wavelength_max_nm: number;
}

export interface SolarFlareSpatialContext {
  frame: "Helioprojective";
  longitude_arcsec?: number;
  latitude_arcsec?: number;
  ribbon_segment?: SolarFlareRibbonSegment;
  context_image_refs?: string[];
  coalignment_ref?: string;
  unresolved_mixing_flag?: boolean;
  unresolved_mixing_note?: string;
}

export interface SolarFlareSubtractionContext {
  method: SolarFlareSubtractionMethod;
  reference_observation_id?: string;
  note?: string;
}

export interface SolarFlareLineDescriptor {
  peak_count?: 1 | 2 | 3;
  central_reversal?: boolean;
  red_wing_width_pm?: number;
  blue_wing_width_pm?: number;
  bisector_ref?: string;
  gaussian_components_ref?: string;
}

export interface SolarFlareForwardModelComparison {
  model_family: "RADYN_RH" | "other";
  heating_family: SolarFlareHeatingFamily;
  model_state_ref: string;
  psf_ref?: string;
  residual_summary_ref: string;
}

export interface OriginHypothesis {
  mechanism: string;
  layer_support: string[];
  evidence_refs: string[];
  confidence: number;
  interpretation_status: SolarFlareInterpretationStatus;
}

export interface SolarFlareSpectralObservableContractV1
  extends ObservableContractV1 {
  schema_version: typeof SOLAR_FLARE_SPECTRAL_OBSERVABLE_SCHEMA_VERSION;
  lane_id: "stellar_radiation";
  modality: "spectrum" | "spectrogram";
  instrument: SolarFlareInstrument;
  line_window: SolarFlareLineWindow[];
  optical_depth_regime?: SolarFlareOpticalDepthRegime;
  flare_phase?: SolarFlarePhase;
  stokes_mode?: SolarFlareStokesMode;
  spatial_context?: SolarFlareSpatialContext;
  subtraction?: SolarFlareSubtractionContext;
  descriptors?: SolarFlareLineDescriptor;
  forward_model_comparisons?: SolarFlareForwardModelComparison[];
  origin_hypotheses?: OriginHypothesis[];
}
