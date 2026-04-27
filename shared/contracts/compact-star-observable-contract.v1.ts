import type {
  LaneBundleV1,
  ObservableContractV1,
  ObservableResponseModelRefV1,
} from "./observable-contract.v1";

export const COMPACT_STAR_LANE_CONTRACT_SCHEMA_VERSION = "compact_star_lane_contract/v1";

export const COMPACT_STAR_OBJECT_CLASS_VALUES = [
  "neutron_star",
  "white_dwarf_candidate",
  "strangeon_star_candidate",
  "hybrid_candidate",
  "unknown",
] as const;

export const COMPACT_STAR_OBSERVABLE_KIND_VALUES = [
  "pulse_profile",
  "dynamic_spectrum",
  "polarization_profile",
  "timing_solution",
  "limit_envelope",
] as const;

export const COMPACT_STAR_LIMIT_KIND_VALUES = [
  "rotational_energy_budget",
  "pulsar_death_line",
  "pair_cascade_threshold",
  "vacuum_gap_potential",
  "surface_rigidity_mountain_support",
  "magnetosphere_diffraction_tomography",
  "compact_matter_eos_envelope",
] as const;

export const COMPACT_STAR_LIMIT_STATUS_VALUES = [
  "inside_expected_envelope",
  "near_limit",
  "outside_expected_envelope",
  "bridge_case",
  "unknown",
] as const;

export const COMPACT_STAR_MATTER_MODEL_VALUES = [
  "normal_neutron_star_crust",
  "solid_strangeon_matter",
  "hybrid_star",
  "white_dwarf",
  "unknown",
] as const;

export const COMPACT_STAR_MATTER_HYPOTHESIS_STATUS_VALUES = [
  "candidate",
  "speculative",
  "supported",
  "rejected",
] as const;

export const COMPACT_STAR_DYNAMIC_SPECTRUM_FEATURE_VALUES = [
  "zebra_band",
  "single_pulse_modulation",
  "interpulse_band",
  "broadband_pulse",
  "unknown",
] as const;

export const COMPACT_STAR_BAND_SPACING_MODEL_VALUES = [
  "proportional",
  "absolute",
  "unknown",
] as const;

export const COMPACT_STAR_BRIDGE_STATUS_VALUES = [
  "hypothesis",
  "diagnostic",
  "reduced_order",
  "validated",
] as const;

export type CompactStarObjectClass = (typeof COMPACT_STAR_OBJECT_CLASS_VALUES)[number];
export type CompactStarObservableKind = (typeof COMPACT_STAR_OBSERVABLE_KIND_VALUES)[number];
export type CompactStarLimitKind = (typeof COMPACT_STAR_LIMIT_KIND_VALUES)[number];
export type CompactStarLimitStatus = (typeof COMPACT_STAR_LIMIT_STATUS_VALUES)[number];
export type CompactStarMatterModel = (typeof COMPACT_STAR_MATTER_MODEL_VALUES)[number];
export type CompactStarMatterHypothesisStatus =
  (typeof COMPACT_STAR_MATTER_HYPOTHESIS_STATUS_VALUES)[number];
export type CompactStarDynamicSpectrumFeature =
  (typeof COMPACT_STAR_DYNAMIC_SPECTRUM_FEATURE_VALUES)[number];
export type CompactStarBandSpacingModel =
  (typeof COMPACT_STAR_BAND_SPACING_MODEL_VALUES)[number];
export type CompactStarBridgeStatus = (typeof COMPACT_STAR_BRIDGE_STATUS_VALUES)[number];

export interface CompactStarLimitProbeV1 {
  limit_kind: CompactStarLimitKind;
  quantity_ref: string;
  threshold_ref?: string;
  observed_status: CompactStarLimitStatus;
  evidence_refs: string[];
  substitute_state_ref?: string;
  notes?: string;
}

export interface CompactStarMatterHypothesisV1 {
  hypothesis_id: string;
  matter_model: CompactStarMatterModel;
  status: CompactStarMatterHypothesisStatus;
  eos_ref?: string;
  surface_rigidity_ref?: string;
  supporting_observable_refs?: string[];
  contradicting_observable_refs?: string[];
}

export interface PulsarDynamicSpectrumFeatureV1 {
  feature_kind: CompactStarDynamicSpectrumFeature;
  frequency_min_hz?: number;
  frequency_max_hz?: number;
  band_spacing_model?: CompactStarBandSpacingModel;
  polarization_ref?: string;
  phase_window_ref?: string;
  fit_summary_ref?: string;
}

export interface CompactStarMicroMacroBridgeV1 {
  quantum_side_refs: string[];
  classical_side_refs: string[];
  bridge_status: CompactStarBridgeStatus;
  notes?: string;
}

export interface CompactStarObservableContractV1 extends ObservableContractV1 {
  lane_id: "compact_star_radio";
  object_class: CompactStarObjectClass;
  observable_kind: CompactStarObservableKind;
  source_name?: string;
  period_s?: number;
  period_dot?: number;
  spin_down_power_ref?: string;
  death_line_status?: CompactStarLimitStatus;
  response_model?: ObservableResponseModelRefV1 | null;
  dynamic_spectrum_features?: PulsarDynamicSpectrumFeatureV1[];
  limit_probes?: CompactStarLimitProbeV1[];
  matter_hypotheses?: CompactStarMatterHypothesisV1[];
  micro_macro_bridge?: CompactStarMicroMacroBridgeV1;
}

export interface CompactStarGeometryStateV1 {
  compactness_ref?: string;
  radius_ref?: string;
  mass_ref?: string;
  polar_cap_geometry_ref?: string;
  surface_topography_ref?: string;
  line_of_sight_ref?: string;
  magnetosphere_geometry_ref?: string;
}

export interface CompactStarForcingStateV1 {
  gap_electric_field_ref?: string;
  particle_injection_ref?: string;
  spin_down_driver_ref?: string;
  glitch_or_burst_ref?: string;
}

export interface CompactStarStateVectorV1 {
  period_s?: number;
  period_dot?: number;
  magnetic_field_ref?: string;
  plasma_density_profile_ref?: string;
  eos_hypothesis_refs?: string[];
  surface_material_state_ref?: string;
}

export interface CompactStarClosureStateV1 {
  death_line_model_ref?: string;
  pair_cascade_model_ref?: string;
  vacuum_gap_model_ref?: string;
  diffraction_screen_model_ref?: string;
  surface_mountain_model_ref?: string;
  eos_model_refs?: string[];
}

export interface CompactStarLaneBundleV1
  extends LaneBundleV1<
    CompactStarGeometryStateV1,
    CompactStarForcingStateV1,
    CompactStarStateVectorV1,
    CompactStarClosureStateV1,
    CompactStarObservableContractV1[]
  > {
  schema_version: typeof COMPACT_STAR_LANE_CONTRACT_SCHEMA_VERSION;
}
