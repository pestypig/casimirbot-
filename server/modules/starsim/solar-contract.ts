import { z } from "zod";

export const STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION = "star-sim-solar-baseline/1" as const;
export const STAR_SIM_SOLAR_BASELINE_SECTION_IDS = [
  "solar_interior_profile",
  "solar_layer_boundaries",
  "solar_global_modes",
  "solar_local_helio",
  "solar_magnetogram",
  "solar_cycle_indices",
  "solar_active_regions",
  "solar_flare_catalog",
  "solar_cme_catalog",
  "solar_irradiance_series",
  "solar_neutrino_constraints",
  "solar_granulation_stats",
] as const;

export const starSimSolarObservedModeSchema = z.enum(["observed", "modeled", "assimilated"]);
export const starSimSolarBaselineSectionIdSchema = z.enum(STAR_SIM_SOLAR_BASELINE_SECTION_IDS);
export const starSimSolarObservedLaneSchema = z.enum([
  "helioseismology_solar_observed",
  "magnetism_surface_flux_transport",
  "solar_cycle_observed",
  "eruptive_activity_observed",
]);
export const starSimSolarBaselinePhaseSchema = z.enum([
  "solar_interior_closure_v1",
  "solar_cycle_observed_v1",
  "solar_eruptive_catalog_v1",
]);

export const starSimSolarArtifactMetadataSchema = z
  .object({
    time_range: z
      .object({
        start_iso: z.string().min(1),
        end_iso: z.string().min(1),
      })
      .optional(),
    cadence: z
      .object({
        value: z.number().positive(),
        unit: z.enum(["s", "min", "hour", "day", "carrington_rotation", "snapshot"]),
      })
      .optional(),
    coordinate_frame: z.string().min(1).optional(),
    carrington_rotation: z.number().int().positive().optional(),
    instrument: z.string().min(1).optional(),
    observed_mode: starSimSolarObservedModeSchema.optional(),
    source_product_id: z.string().min(1).optional(),
    source_product_family: z.string().min(1).optional(),
    source_doc_ids: z.array(z.string().min(1)).optional(),
    source_product_note: z.string().min(1).optional(),
    uncertainty_summary: z
      .object({
        kind: z.enum(["none", "summary", "per_point", "mixed"]),
        note: z.string().min(1).optional(),
      })
      .optional(),
  })
  .strict();

const refArraySchema = z.array(z.string().min(1));

const solarInteriorProfileSchema = z
  .object({
    profile_ref: z.string().min(1).optional(),
    profile_kind: z.enum(["hydrostatic_1d", "helioseismic_inversion", "assimilated_summary"]).optional(),
    pressure_profile_ref: z.string().min(1).optional(),
    density_profile_ref: z.string().min(1).optional(),
    temperature_profile_ref: z.string().min(1).optional(),
    sound_speed_profile_ref: z.string().min(1).optional(),
    rotation_profile_ref: z.string().min(1).optional(),
    summary: z
      .object({
        convection_zone_base_rsun: z.number().positive().optional(),
        envelope_helium_fraction: z.number().min(0).max(1).optional(),
        tachocline_center_rsun: z.number().positive().optional(),
        tachocline_width_rsun: z.number().positive().optional(),
      })
      .strict()
      .optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarLayerBoundariesSchema = z
  .object({
    core_edge_rsun: z.number().positive().optional(),
    convection_zone_base_rsun: z.number().positive().optional(),
    tachocline_center_rsun: z.number().positive().optional(),
    tachocline_width_rsun: z.number().positive().optional(),
    photosphere_tag: z.string().min(1).optional(),
    chromosphere_tag: z.string().min(1).optional(),
    transition_region_tag: z.string().min(1).optional(),
    corona_tag: z.string().min(1).optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarGlobalModesSchema = z
  .object({
    mode_table_ref: z.string().min(1).optional(),
    detail_ref: z.string().min(1).optional(),
    line_width_ref: z.string().min(1).optional(),
    amplitude_ref: z.string().min(1).optional(),
    splitting_ref: z.string().min(1).optional(),
    low_degree_mode_count: z.number().int().nonnegative().optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarLocalHelioSchema = z
  .object({
    dopplergram_ref: z.string().min(1).optional(),
    travel_time_ref: z.string().min(1).optional(),
    holography_ref: z.string().min(1).optional(),
    product_refs: refArraySchema.optional(),
    sunquake_event_refs: refArraySchema.optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarMagnetogramSchema = z
  .object({
    line_of_sight_ref: z.string().min(1).optional(),
    vector_field_ref: z.string().min(1).optional(),
    synoptic_radial_map_ref: z.string().min(1).optional(),
    active_region_patch_refs: refArraySchema.optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarCycleIndicesSchema = z
  .object({
    sunspot_number: z.number().nonnegative().optional(),
    f10_7_sfu: z.number().nonnegative().optional(),
    polar_field_G: z.number().finite().optional(),
    axial_dipole_G: z.number().finite().optional(),
    butterfly_latitude_distribution_ref: z.string().min(1).optional(),
    cycle_label: z.string().min(1).optional(),
    polarity_label: z.string().min(1).optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarActiveRegionsSchema = z
  .object({
    region_refs: refArraySchema.optional(),
    region_count: z.number().int().nonnegative().optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarFlareCatalogSchema = z
  .object({
    event_refs: refArraySchema.optional(),
    source_region_refs: refArraySchema.optional(),
    flare_count: z.number().int().nonnegative().optional(),
    strongest_goes_class: z.string().min(1).optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarCmeCatalogSchema = z
  .object({
    event_refs: refArraySchema.optional(),
    source_region_refs: refArraySchema.optional(),
    cme_count: z.number().int().nonnegative().optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarIrradianceSeriesSchema = z
  .object({
    tsi_ref: z.string().min(1).optional(),
    euv_ref: z.string().min(1).optional(),
    xray_ref: z.string().min(1).optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarNeutrinoConstraintsSchema = z
  .object({
    constraints_ref: z.string().min(1).optional(),
    pp_flux: z.number().nonnegative().optional(),
    be7_flux: z.number().nonnegative().optional(),
    pep_flux: z.number().nonnegative().optional(),
    b8_flux: z.number().nonnegative().optional(),
    cno_flux: z.number().nonnegative().optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarGranulationStatsSchema = z
  .object({
    lifetime_distribution_ref: z.string().min(1).optional(),
    size_distribution_ref: z.string().min(1).optional(),
    horizontal_flow_ref: z.string().min(1).optional(),
    intensity_contrast_ref: z.string().min(1).optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

export const solarObservedBaselineSchema = z
  .object({
    schema_version: z.literal(STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION),
    solar_interior_profile: solarInteriorProfileSchema.optional(),
    solar_layer_boundaries: solarLayerBoundariesSchema.optional(),
    solar_global_modes: solarGlobalModesSchema.optional(),
    solar_local_helio: solarLocalHelioSchema.optional(),
    solar_magnetogram: solarMagnetogramSchema.optional(),
    solar_cycle_indices: solarCycleIndicesSchema.optional(),
    solar_active_regions: solarActiveRegionsSchema.optional(),
    solar_flare_catalog: solarFlareCatalogSchema.optional(),
    solar_cme_catalog: solarCmeCatalogSchema.optional(),
    solar_irradiance_series: solarIrradianceSeriesSchema.optional(),
    solar_neutrino_constraints: solarNeutrinoConstraintsSchema.optional(),
    solar_granulation_stats: solarGranulationStatsSchema.optional(),
  })
  .strict();

export type StarSimSolarObservedMode = z.infer<typeof starSimSolarObservedModeSchema>;
export type StarSimSolarBaselineSectionId = z.infer<typeof starSimSolarBaselineSectionIdSchema>;
export type StarSimSolarObservedLane = z.infer<typeof starSimSolarObservedLaneSchema>;
export type StarSimSolarBaselinePhase = z.infer<typeof starSimSolarBaselinePhaseSchema>;
export type StarSimSolarArtifactMetadata = z.infer<typeof starSimSolarArtifactMetadataSchema>;
export type StarSimSolarObservedBaseline = z.infer<typeof solarObservedBaselineSchema>;
