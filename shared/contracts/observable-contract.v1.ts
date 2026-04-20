export const SHARED_OBSERVABLE_CONTRACT_SCHEMA_VERSION = "shared_observable_contract/v1";

export const SHARED_OBSERVABLE_MODALITY_VALUES = [
  "spectrum",
  "spectrogram",
  "image",
  "time_series",
  "channel_series",
] as const;

export const SHARED_OBSERVABLE_TIME_MODE_VALUES = [
  "independent",
  "homogeneous",
  "heterogeneous",
] as const;

export const SHARED_OBSERVABLE_COVERAGE_MODE_VALUES = [
  "full_spectrum",
  "band_limited",
  "channel_limited",
] as const;

export const SHARED_OBSERVABLE_AXIS_ROLE_VALUES = [
  "wavelength",
  "frequency",
  "radius",
  "channel",
  "time",
  "mu",
  "other",
] as const;

export const SHARED_OBSERVABLE_PROVENANCE_CLASS_VALUES = [
  "observed",
  "synthetic_truth",
  "synthetic_observed",
  "inferred",
] as const;

export const SHARED_OBSERVABLE_CLAIM_TIER_VALUES = [
  "diagnostic",
  "reduced-order",
  "certified",
] as const;

export const SHARED_OBSERVABLE_RESPONSE_MODEL_KIND_VALUES = [
  "instrument_response",
  "transfer_function",
  "synthetic_diagnostic",
  "radiative_transfer",
] as const;

export const SHARED_OBSERVABLE_RAW_MASK_SEMANTICS_VALUES = [
  "native",
  "astropy_true_invalid",
  "imas_validity_code",
] as const;

export type SharedObservableModality =
  (typeof SHARED_OBSERVABLE_MODALITY_VALUES)[number];
export type SharedObservableTimeMode =
  (typeof SHARED_OBSERVABLE_TIME_MODE_VALUES)[number];
export type SharedObservableCoverageMode =
  (typeof SHARED_OBSERVABLE_COVERAGE_MODE_VALUES)[number];
export type SharedObservableAxisRole =
  (typeof SHARED_OBSERVABLE_AXIS_ROLE_VALUES)[number];
export type SharedObservableProvenanceClass =
  (typeof SHARED_OBSERVABLE_PROVENANCE_CLASS_VALUES)[number];
export type SharedObservableClaimTier =
  (typeof SHARED_OBSERVABLE_CLAIM_TIER_VALUES)[number];
export type SharedObservableResponseModelKind =
  (typeof SHARED_OBSERVABLE_RESPONSE_MODEL_KIND_VALUES)[number];
export type SharedObservableRawMaskSemantics =
  (typeof SHARED_OBSERVABLE_RAW_MASK_SEMANTICS_VALUES)[number];

export interface ObservableAxisSpecV1 {
  axis_id: string;
  unit: string;
  role: SharedObservableAxisRole;
  time_mode?: SharedObservableTimeMode;
  monotonic?: boolean;
}

export interface ObservableDomainSpecV1 {
  axis_id: string;
  min: number;
  max: number;
}

export interface ObservableErrorSpecV1 {
  lower?: ArrayLike<number>;
  upper?: ArrayLike<number>;
  sigma?: ArrayLike<number>;
  covariance_ref?: string;
  quality_mask?: ArrayLike<number | boolean>;
  quality_label?: string;
}

export interface ObservableResponseModelRefV1 {
  id: string;
  kind: SharedObservableResponseModelKind;
  model_ref?: string;
  notes?: string;
}

export interface ObservableProvenanceRefV1 {
  source_id: string;
  source_family?: string;
  source_url?: string;
  citation_refs?: string[];
}

export interface ObservableContractV1 {
  schema_version: typeof SHARED_OBSERVABLE_CONTRACT_SCHEMA_VERSION;
  observable_id: string;
  lane_id: string;
  modality: SharedObservableModality;
  axes: ObservableAxisSpecV1[];
  units: string;
  values_ref?: string;
  values?: ArrayLike<number>;
  valid_mask_ref?: string;
  valid_mask?: ArrayLike<number | boolean>;
  raw_mask_ref?: string;
  raw_mask_semantics?: SharedObservableRawMaskSemantics;
  coverage_mode?: SharedObservableCoverageMode;
  valid_domain?: ObservableDomainSpecV1;
  error?: ObservableErrorSpecV1;
  min_valid_fraction?: number;
  response_model?: ObservableResponseModelRefV1 | null;
  provenance: ObservableProvenanceRefV1;
  claim_tier: SharedObservableClaimTier;
  provenance_class: SharedObservableProvenanceClass;
  intended_observables?: string[];
}

export interface LaneBundleV1<G, F, S, C, O> {
  G_geometry: G;
  F_forcing: F;
  S_state: S;
  C_closure: C;
  O_observables: O;
}
