export type SolarFrame = "BCRS" | "GCRS";
export type SolarAberration = "none" | "lt" | "lt+s";

export type SolarObserver =
  | {
      mode: "geocenter";
    }
  | {
      mode: "body-fixed";
      body: number;
      lon_deg: number;
      lat_deg: number;
      height_m: number;
    };

export type SolarGateDelta = {
  id: string;
  comparator: "<=" | ">=";
  value: number;
  limit: number;
  pass: boolean;
  note?: string;
};

export type SolarGate = {
  gate: string;
  verdict: "PASS" | "FAIL";
  firstFail: string | null;
  deterministic: true;
  deltas: SolarGateDelta[];
  reasons: string[];
};

export type SolarEphemerisSourceClass = "kernel_bundle" | "hybrid_diagnostic" | "fallback";

export type SolarProvenance = {
  kernel_bundle_id: string;
  source_class: SolarEphemerisSourceClass;
  claim_tier: "diagnostic";
  certifying: false;
  evidence_refs: string[];
  signature_ok: boolean;
  epoch_window: {
    start_iso: string;
    end_iso: string;
  };
  note: string;
};

export type SolarRelativeKinematics = {
  speed_au_per_day: number;
  speed_km_s: number;
  speed_fraction_c: number;
  radial_velocity_au_per_day: number;
  radial_velocity_km_s: number;
  transverse_speed_au_per_day: number;
  transverse_speed_km_s: number;
  galactic_uvw_km_s: [number, number, number];
  galactic_axes: "U_toward_gc,V_rotation,W_toward_ngp";
  local_rest?: {
    status: "projected" | "unavailable";
    semantics: "translation_invariant_relative_velocity";
    uvw_km_s?: [number, number, number];
    axes?: "U_toward_gc,V_rotation,W_toward_ngp";
    solar_peculiar_kms?: [number, number, number];
    provenance_class?: string;
    claim_tier?: string;
    certifying?: boolean;
    source?: string;
    fail_id?: "HALOBANK_SOLAR_LOCAL_REST_UNAVAILABLE";
    error?: string;
  };
};

export type SolarState = {
  target: number;
  center: number;
  frame: SolarFrame;
  pos: [number, number, number];
  vel: [number, number, number];
  light_time_s: number;
  kinematics: SolarRelativeKinematics;
};

export type SolarReferenceContext = {
  requested_center: number;
  resolved_center: number;
  frame: SolarFrame;
  observer_mode: "none" | "geocenter" | "body-fixed";
  relation: "target_minus_reference";
  speed_semantics: "relative_to_resolved_reference";
};

export type SolarReferenceOriginState = {
  body: number;
  pos: [number, number, number];
  vel: [number, number, number];
  speed_au_per_day: number;
  speed_km_s: number;
  galactic_uvw_km_s: [number, number, number];
  galactic_axes: "U_toward_gc,V_rotation,W_toward_ngp";
  local_rest?: {
    status: "projected" | "unavailable";
    semantics: "resolved_reference_minus_declared_local_rest";
    uvw_km_s?: [number, number, number];
    axes?: "U_toward_gc,V_rotation,W_toward_ngp";
    solar_peculiar_kms?: [number, number, number];
    ssb_offset_km_s?: [number, number, number];
    provenance_class?: string;
    claim_tier?: string;
    certifying?: boolean;
    source?: string;
    fail_id?: "HALOBANK_SOLAR_LOCAL_REST_UNAVAILABLE";
    error?: string;
  };
};

export type SolarTimeScales = {
  utc: string;
  tai: string;
  tt: string;
  tcg: string;
  tdb: string;
  tcb: string;
  offsets_s: {
    tai_minus_utc: number;
    tt_minus_utc: number;
    tdb_minus_tt: number;
    tcb_minus_tdb: number;
    tcg_minus_tt: number;
  };
};

export type SolarMetricStandardRef = {
  id: string;
  citation: string;
  url: string;
};

export type SolarMetricPotential = {
  id: string;
  symbol: string;
  kind: "scalar" | "vector" | "monopole";
  frames: SolarFrame[];
  role: string;
  source_ref: string;
};

export type SolarMetricContextManifest = {
  schema_version: "halobank.solar.metric_context/1";
  model_id: string;
  approximation: "first_post_newtonian_weak_field";
  gauge: "harmonic";
  ppn_parameters: {
    gamma: number;
    beta: number;
    theory: "general_relativity";
  };
  observer_contract: string;
  signal_contract: string;
  standards: SolarMetricStandardRef[];
  source_potentials: SolarMetricPotential[];
};

export type SolarMetricContext = {
  frame: SolarFrame;
  coordinate_time_scale: "TCB" | "TCG";
  evaluation_time_scale: "TDB";
  observer_time_scale: "TT";
  pn_gr_model_id: string;
  approximation: "first_post_newtonian_weak_field";
  gauge: "harmonic";
  ppn_parameters: {
    gamma: number;
    beta: number;
    theory: "general_relativity";
  };
  source_potentials_used: SolarMetricPotential[];
  standards_refs: SolarMetricStandardRef[];
  observer_contract: string;
  signal_contract: string;
};

export type SolarKernelAsset = {
  id: string;
  kind: "spk" | "pck" | "lsk" | "eop";
  path: string;
  digest: string;
  optional?: boolean;
};

export type SolarKernelBundleManifest = {
  schema_version: "halobank.solar.kernel.bundle/1";
  bundle_id: string;
  release_policy: "pinned-manual-promotion";
  epoch_range: {
    start_iso: string;
    end_iso: string;
  };
  assets: SolarKernelAsset[];
  signature: {
    alg: "sha256";
    signed_payload_hash: string;
    signer: string;
  };
};

export type SolarThresholdsManifest = {
  schema_version: "halobank.solar.thresholds/1";
  epoch_window: {
    start_iso: string;
    end_iso: string;
  };
  modules: {
    mercury_precession: {
      target_arcsec_per_century: number;
      pass_tolerance_arcsec_per_century: number;
      warn_tolerance_arcsec_per_century: number;
      min_perihelion_events: number;
    };
    mercury_cross_lane_congruence_diagnostic: {
      max_precession_margin: number;
      max_figure_component_margin: number;
      max_figure_rms_residual: number;
      max_combined_margin: number;
    };
    earth_moon_eclipse_timing: {
      max_contact_separation_deg: number;
      event_time_tolerance_s: number;
    };
    resonance_libration: {
      libration_span_deg_max: number;
      ratio_tolerance: number;
    };
    saros_cycle: {
      target_saros_days: number;
      max_pair_abs_error_days: number;
      min_pair_count: number;
    };
    jovian_moon_event_timing: {
      max_contact_ratio: number;
      event_time_tolerance_s: number;
      min_event_count: number;
    };
    earth_orientation_precession_nutation_proxy: {
      min_sample_count: number;
      expected_lunar_to_solar_ratio: number;
      max_lunar_to_solar_ratio_abs_error: number;
    };
    planetary_shape_orientation_proxy: {
      min_sample_count: number;
      expected_lunar_to_solar_ratio: number;
      max_lunar_to_solar_ratio_abs_error: number;
    };
    planetary_figure_diagnostic: {
      min_sample_count: number;
      expected_lunar_to_solar_ratio: number;
      max_lunar_to_solar_ratio_abs_error: number;
      reference_flattening: number;
      reference_j2: number;
      reference_effective_love_number: number;
      reference_moment_of_inertia_factor: number;
      max_flattening_abs_error: number;
      max_j2_abs_error: number;
      max_effective_love_number_abs_error: number;
      max_dynamical_ellipticity_abs_error: number;
      min_hydrostatic_rounding_proxy: number;
      min_potato_threshold_ratio: number;
      default_effective_rigidity_pa: number;
    };
    granular_tidal_response_diagnostic: {
      min_sample_count: number;
      min_granular_dissipation_proxy: number;
      min_tidal_quality_factor_proxy: number;
      min_spin_state_evolution_proxy: number;
      min_angular_momentum_redistribution_proxy: number;
    };
    stellar_observables_diagnostic: {
      min_sample_count: number;
      min_activity_pmode_correlation: number;
      min_pmode_slope_nhz_per_activity_unit: number;
      min_pmode_shift_span_nhz: number;
      min_flare_sample_count: number;
      flare_power_law_alpha_min: number;
      flare_power_law_alpha_max: number;
    };
    stellar_flare_sunquake_diagnostic: {
      min_event_count: number;
      min_flare_energy_helioseismic_correlation: number;
      max_mean_timing_offset_s: number;
      max_median_timing_offset_s: number;
      min_coupling_score: number;
    };
    sunquake_timing_replay_diagnostic: {
      min_event_count: number;
      max_mean_timing_offset_s: number;
      max_median_timing_offset_s: number;
      max_max_timing_offset_s: number;
    };
    solar_light_deflection: {
      target_limb_arcsec: number;
      historical_observed_arcsec: number;
      historical_max_abs_residual_arcsec: number;
      modern_gamma_measured: number;
      modern_gamma_max_abs_residual: number;
      shapiro_gamma_minus_one_measured: number;
      shapiro_gamma_minus_one_max_abs: number;
    };
    inner_solar_metric_parity: {
      max_mercury_abs_error_arcsec_per_century: number;
      max_deflection_abs_residual_arcsec: number;
      max_modern_gamma_abs_residual: number;
      max_shapiro_gamma_minus_one_abs: number;
    };
    local_rest_anchor_calibration: {
      max_component_abs_delta_km_s: number;
    };
  };
};

export type SolarDiagnosticPlanetaryShapeOrientationProfile = {
  id: string;
  label: string;
  state_source?: "astronomy-engine" | "synthetic-saturnian-satellite";
  expected_response_regime?: "gravity-rounded" | "transition" | "strength-supported";
  target_body_id: number;
  primary_perturber_body_id: number;
  secondary_perturber_body_id: number | null;
  start_iso: string;
  end_iso: string;
  step_minutes: number;
  body_mass_kg: number;
  equatorial_radius_m: number;
  yield_strength_pa: number;
  effective_rigidity_pa: number;
  rotation_rate_rad_s: number;
  moment_of_inertia_factor: number;
  source_refs: string[];
  notes?: string[];
};

export type SolarDiagnosticPlanetaryFigureProfile = SolarDiagnosticPlanetaryShapeOrientationProfile & {
  reference_flattening: number;
  reference_j2: number;
  reference_effective_love_number: number;
  reference_moment_of_inertia_factor: number;
  max_flattening_abs_error: number;
  max_j2_abs_error: number;
  max_effective_love_number_abs_error: number;
  max_dynamical_ellipticity_abs_error: number;
  min_hydrostatic_rounding_proxy: number;
  min_potato_threshold_ratio: number;
};

export type SolarDiagnosticStellarReplaySeries = {
  id: string;
  label: string;
  cadence_days: number;
  epoch_iso_series: string[];
  magnetic_activity_index_series: number[];
  p_mode_frequency_shift_nhz_series: number[];
  flare_energy_proxy_series?: number[];
  source_refs: string[];
  notes?: string[];
};

export type SolarDiagnosticSunquakeReplaySeries = {
  id: string;
  label: string;
  cadence_days: number;
  flare_peak_iso_series: string[];
  sunquake_peak_iso_series: string[];
  flare_energy_proxy_series: number[];
  helioseismic_amplitude_proxy_series: number[];
  magnetic_activity_index_series?: number[];
  p_mode_frequency_shift_nhz_series?: number[];
  source_refs: string[];
  notes?: string[];
};

export type SolarDiagnosticDatasetsManifest = {
  schema_version: "halobank.solar.diagnostic_datasets/1";
  planetary_figure_profiles: SolarDiagnosticPlanetaryFigureProfile[];
  stellar_observables_replay_series: SolarDiagnosticStellarReplaySeries[];
  sunquake_replay_series: SolarDiagnosticSunquakeReplaySeries[];
};

export type SolarLocalRestReference = {
  id: string;
  label: string;
  source_class: "primary" | "standard";
  citation: string;
  doi: string;
  url: string;
  published: string;
  solar_peculiar_kms: [number, number, number];
  random_uncertainty_kms: [number, number, number];
  systematic_uncertainty_kms: [number, number, number];
  component_tolerance_km_s: number;
};

export type SolarLocalRestReferenceManifest = {
  schema_version: "halobank.solar.local_rest_reference/1";
  default_reference_id: string;
  references: SolarLocalRestReference[];
};
