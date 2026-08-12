import { z } from "zod";

export const SOLAR_KHI_OBSERVATION_SCHEMA_VERSION = "solar_khi_observation/v1" as const;
export const SOLAR_KHI_MEASUREMENT_SCHEMA_VERSION = "solar_khi_measurement/v1" as const;

export const SOLAR_KHI_COHERENCE_KINDS = [
  "quantum_amplitude",
  "mode_phase",
  "morphological_persistence",
  "cross_spectral",
  "topological_persistence",
  "predictive_dependence",
] as const;

export const SOLAR_KHI_RECONSTRUCTION_KINDS = ["mfbd", "speckle"] as const;

export const SOLAR_TEMPORAL_PYRAMID_V1 = {
  schema_version: "solar_temporal_pyramid/v1",
  exchange_policy: "summaries_and_causal_state_variables_only",
  master_cadence_forbidden: true,
  lanes: [
    { id: "fastcam_khi", native_cadence_s: 2.7, window_s: { min: 10, max: 180 }, operation: "growth_propagation_merging" },
    { id: "granular_magnetoconvection", native_cadence_s: null, window_s: { min: 1, max: 1_800 }, operation: "flow_and_boundary_evolution" },
    { id: "p_mode", native_cadence_s: null, window_s: { min: 250, max: 350 }, operation: "mode_phase_coherence" },
    { id: "nanoflare", native_cadence_s: null, window_s: { min: 60, max: 14_400 }, operation: "transient_event_process" },
    { id: "flux_rope", native_cadence_s: null, window_s: { min: 3_600, max: 259_200 }, operation: "topology_and_free_energy" },
    { id: "fusion_stellar_structure", native_cadence_s: null, window_s: null, operation: "slow_boundary_condition" },
  ],
} as const;

const finite = z.number().finite();
const nonnegative = finite.nonnegative();
const positive = finite.positive();
const sha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/i);

export const SolarKhiPixelPointV1Schema = z.object({
  x_px: finite,
  y_px: finite,
});

export const SolarKhiWorldPointV1Schema = z.object({
  frame: z.enum(["helioprojective", "heliographic_stonyhurst", "carrington"]),
  x: finite,
  y: finite,
  unit: z.enum(["arcsec", "deg"]),
});

export const SolarKhiRegistrationV1Schema = z.object({
  source_frame: z.string().min(1),
  target_frame: z.string().min(1),
  transform_kind: z.enum(["wcs", "affine", "projective", "cross_correlation"]),
  matrix_3x3: z.array(finite).length(9),
  residual_rms_arcsec: nonnegative,
  covariance_2x2_arcsec2: z.array(nonnegative).length(4),
  artifact_ref: z.string().min(1),
});

export const SolarKhiReconstructionProductV1Schema = z.object({
  kind: z.enum(SOLAR_KHI_RECONSTRUCTION_KINDS),
  frame_artifact_refs: z.array(z.string().min(1)).min(1),
  native_width_px: z.number().int().positive(),
  native_height_px: z.number().int().positive(),
  frame_count: z.number().int().positive(),
  content_hash: sha256,
  reconstruction_method: z.string().min(1),
});

export const SolarKhiTrackSampleV1Schema = z.object({
  frame_index: z.number().int().nonnegative(),
  time_offset_s: nonnegative,
  centroid_px: SolarKhiPixelPointV1Schema,
  boundary_displacement_px: finite,
  ridge_position_px: finite.optional(),
  confidence: finite.min(0).max(1),
});

export const SolarKhiVortexTrackV1Schema = z.object({
  track_id: z.string().min(1),
  boundary_id: z.string().min(1),
  reconstruction: z.enum(SOLAR_KHI_RECONSTRUCTION_KINDS),
  instance_polygon_px: z.array(SolarKhiPixelPointV1Schema).min(3),
  world_coordinate_polygon: z.array(SolarKhiWorldPointV1Schema).min(3),
  samples: z.array(SolarKhiTrackSampleV1Schema).min(2),
  coherence_kind: z.literal("morphological_persistence"),
});

export const SolarKhiObservationV1Schema = z.object({
  schema_version: z.literal(SOLAR_KHI_OBSERVATION_SCHEMA_VERSION),
  observation_id: z.string().min(1),
  observation_time: z.string().datetime(),
  instrument: z.literal("DKIST_FastCam"),
  detector: z.string().min(1),
  noaa_active_region_id: z.string().min(1),
  passband: z.object({ center_nm: positive, fwhm_nm: positive }),
  sampling: z.object({
    reconstructed_cadence_s: positive,
    native_km_per_pixel: positive,
    effective_resolution_km: positive,
  }),
  native_field_of_view: z.object({ width_km: positive, height_km: positive }),
  coordinates: z.object({
    helioprojective_center_arcsec: z.object({ x: finite, y: finite }),
    footprint_polygon_arcsec: z.array(z.object({ x: finite, y: finite })).min(3),
    heliographic_stonyhurst_deg: z.object({ longitude: finite, latitude: finite }),
    carrington_deg: z.object({ longitude: finite, latitude: finite }),
    mu: finite.min(0).max(1),
    observer_metadata: z.record(z.unknown()),
    wcs_artifact_ref: z.string().min(1),
  }),
  registrations: z.array(SolarKhiRegistrationV1Schema).min(1),
  reconstruction_products: z.array(SolarKhiReconstructionProductV1Schema).min(2),
  psf_artifact_ref: z.string().min(1),
  quality_report_ref: z.string().min(1),
  parent_context_image_refs: z.array(z.string().min(1)).min(1),
  boundary_track_artifact_refs: z.array(z.string().min(1)).default([]),
  vortex_tracks: z.array(SolarKhiVortexTrackV1Schema).default([]),
  radiometric_interpretation: z.literal("forward_model_required"),
  energy_calibration: z.literal("not_applicable_aia_193"),
  numerical_measurement_authority: z.literal(true),
  provenance: z.object({
    source_archive: z.string().url(),
    source_literature_doi: z.string().min(1),
    ingest_tool: z.literal("tools/dkist_fastcam_ingest.py"),
    ingest_version: z.string().min(1),
    manifest_hash: sha256.optional(),
  }),
}).superRefine((value, ctx) => {
  const kinds = new Set(value.reconstruction_products.map((product) => product.kind));
  for (const required of SOLAR_KHI_RECONSTRUCTION_KINDS) {
    if (!kinds.has(required)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reconstruction_products"],
        message: `missing required ${required} reconstruction`,
      });
    }
  }
});

export const SolarKhiBoundaryFrameV1Schema = z.object({
  frame_index: z.number().int().nonnegative(),
  time_offset_s: nonnegative,
  boundary_displacement_px: z.array(finite).min(3),
  intensity_along_boundary: z.array(finite).min(3),
  ridge_position_px: finite.optional(),
});

export const SolarKhiMeasurementInputV1Schema = z.object({
  schema_version: z.literal(SOLAR_KHI_MEASUREMENT_SCHEMA_VERSION),
  observation_id: z.string().min(1),
  boundary_id: z.string().min(1),
  reconstruction: z.enum(SOLAR_KHI_RECONSTRUCTION_KINDS),
  native_km_per_pixel: positive,
  effective_resolution_km: positive,
  cadence_s: positive,
  flow_speed_km_s: positive.optional(),
  minimum_dip_prominence: finite.min(0).max(1).default(0.04),
  frames: z.array(SolarKhiBoundaryFrameV1Schema).min(3),
  extraction_provenance: z.object({
    trace_schema_version: z.literal("solar_khi_manual_trace/v1"),
    extraction_tool: z.literal("tools/dkist_fastcam_measure.py"),
    extraction_version: z.string().min(1),
    source_artifact_ref: z.string().min(1),
    source_content_hash: sha256,
    annotation_artifact_ref: z.string().min(1),
    annotation_content_hash: sha256,
    native_width_px: z.number().int().positive(),
    native_height_px: z.number().int().positive(),
    interpolation: z.literal("bilinear_native_pixel_grid"),
    resampled_image_forbidden: z.literal(true),
    manual_trace_authority: z.literal(true),
  }).optional(),
});

export const SolarKhiMeasurementResultV1Schema = z.object({
  schema_version: z.literal(SOLAR_KHI_MEASUREMENT_SCHEMA_VERSION),
  observation_id: z.string().min(1),
  boundary_id: z.string().min(1),
  reconstruction: z.enum(SOLAR_KHI_RECONSTRUCTION_KINDS),
  authority: z.literal("deterministic_numerical_measurement"),
  coherence_kind: z.literal("morphological_persistence"),
  wavelength_m: positive,
  wavelength_uncertainty_m: nonnegative,
  growth_rate_s_inv: finite,
  growth_rate_uncertainty_s_inv: nonnegative,
  e_folding_time_s: positive,
  phase_speed_m_s: finite,
  phase_speed_uncertainty_m_s: nonnegative,
  phase_speed_reference: z.literal("image_plane_apparent"),
  turbulent_diffusivity_m2_s: nonnegative.optional(),
  frames_per_e_folding: positive,
  detected_dip_count: z.number().int().nonnegative(),
  range_checks: z.object({
    wavelength_published_range: z.boolean(),
    growth_rate_published_range: z.boolean(),
    phase_speed_published_range: z.boolean(),
  }),
  quality: z.object({
    growth_fit_r2: finite.min(0).max(1),
    phase_fit_r2: finite.min(0).max(1),
    native_resolution_preserved: z.literal(true),
    warnings: z.array(z.string()),
  }),
  extraction_provenance: SolarKhiMeasurementInputV1Schema.shape.extraction_provenance,
});

export const SolarKhiReconstructionAgreementV1Schema = z.object({
  observation_id: z.string().min(1),
  authority: z.literal("deterministic_numerical_measurement"),
  matched: z.boolean(),
  wavelength_relative_delta: nonnegative,
  growth_rate_relative_delta: nonnegative,
  phase_speed_relative_delta: nonnegative,
  tolerances: z.object({
    wavelength_relative: positive,
    growth_rate_relative: positive,
    phase_speed_relative: positive,
  }),
  claim_tier: z.literal("diagnostic"),
});

export type SolarKhiCoherenceKind = (typeof SOLAR_KHI_COHERENCE_KINDS)[number];
export type SolarKhiObservationV1 = z.infer<typeof SolarKhiObservationV1Schema>;
export type SolarKhiMeasurementInputV1 = z.infer<typeof SolarKhiMeasurementInputV1Schema>;
export type SolarKhiMeasurementResultV1 = z.infer<typeof SolarKhiMeasurementResultV1Schema>;
export type SolarKhiReconstructionAgreementV1 = z.infer<typeof SolarKhiReconstructionAgreementV1Schema>;
