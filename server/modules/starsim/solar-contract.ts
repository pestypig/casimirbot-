import { z } from "zod";

export const STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION = "star-sim-solar-baseline/1" as const;
export const STAR_SIM_SOLAR_BASELINE_SECTION_IDS = [
  "solar_interior_profile",
  "solar_layer_boundaries",
  "solar_global_modes",
  "solar_structural_residuals",
  "solar_local_helio",
  "solar_magnetogram",
  "solar_surface_flows",
  "solar_coronal_field",
  "solar_cycle_indices",
  "solar_cycle_history",
  "solar_magnetic_memory",
  "solar_active_regions",
  "solar_sunspot_catalog",
  "solar_event_linkage",
  "solar_topology_linkage",
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
  "solar_structural_residual_closure_v1",
  "solar_cycle_observed_v1",
  "solar_eruptive_catalog_v1",
  "solar_local_helio_observed_v1",
  "solar_surface_flow_observed_v1",
  "solar_magnetic_memory_observed_v1",
  "solar_spot_region_observed_v1",
  "solar_event_association_observed_v1",
  "solar_coronal_field_observed_v1",
  "solar_topology_linkage_observed_v1",
  "solar_cross_layer_consistency_v1",
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

const solarStructuralResidualsSchema = z
  .object({
    hydrostatic_residual_ref: z.string().min(1).optional(),
    sound_speed_residual_ref: z.string().min(1).optional(),
    rotation_residual_ref: z.string().min(1).optional(),
    pressure_scale_height_ref: z.string().min(1).optional(),
    density_residual_ref: z.string().min(1).optional(),
    neutrino_consistency_ref: z.string().min(1).optional(),
    summary: z
      .object({
        max_sound_speed_fractional_residual: z.number().nonnegative().optional(),
        mean_hydrostatic_fractional_residual: z.number().nonnegative().optional(),
        max_rotation_residual_nhz: z.number().nonnegative().optional(),
        pressure_scale_height_consistent: z.boolean().optional(),
        residual_window_label: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
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

const solarSurfaceFlowsSchema = z
  .object({
    differential_rotation_ref: z.string().min(1).optional(),
    meridional_flow_ref: z.string().min(1).optional(),
    supergranular_diffusion_ref: z.string().min(1).optional(),
    surface_transport_proxy_ref: z.string().min(1).optional(),
    summary: z
      .object({
        equatorial_rotation_deg_per_day: z.number().finite().optional(),
        rotation_shear_deg_per_day: z.number().finite().optional(),
        meridional_flow_peak_ms: z.number().finite().optional(),
      })
      .strict()
      .optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarCoronalFieldSchema = z
  .object({
    pfss_solution_ref: z.string().min(1).optional(),
    synoptic_boundary_ref: z.string().min(1).optional(),
    coronal_hole_refs: refArraySchema.optional(),
    helmet_streamer_ref: z.string().min(1).optional(),
    open_field_map_ref: z.string().min(1).optional(),
    euv_coronal_context_ref: z.string().min(1).optional(),
    summary: z
      .object({
        source_surface_rsun: z.number().positive().optional(),
        open_flux_weber: z.number().nonnegative().optional(),
        dominant_topology: z.string().min(1).optional(),
        coronal_hole_count: z.number().int().nonnegative().optional(),
      })
      .strict()
      .optional(),
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

const solarCycleHistorySchema = z
  .object({
    history_start_iso: z.string().min(1).optional(),
    history_end_iso: z.string().min(1).optional(),
    covered_cycle_labels: refArraySchema.optional(),
    polarity_reversal_refs: refArraySchema.optional(),
    polarity_reversal_dates_iso: refArraySchema.optional(),
    butterfly_history_ref: z.string().min(1).optional(),
    axial_dipole_history_ref: z.string().min(1).optional(),
    polar_field_history_ref: z.string().min(1).optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarMagneticMemorySchema = z
  .object({
    axial_dipole_history_ref: z.string().min(1).optional(),
    polar_field_history_ref: z.string().min(1).optional(),
    polarity_reversal_refs: refArraySchema.optional(),
    bipolar_region_proxy_ref: z.string().min(1).optional(),
    summary: z
      .object({
        cycle_labels_covered: refArraySchema.optional(),
        north_polarity_state: z.string().min(1).optional(),
        south_polarity_state: z.string().min(1).optional(),
        latest_axial_dipole_sign: z.string().min(1).optional(),
        reversal_marker_count: z.number().int().nonnegative().optional(),
      })
      .strict()
      .optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarActiveRegionSummarySchema = z
  .object({
    region_id: z.string().min(1),
    noaa_region_id: z.string().min(1).optional(),
    harp_id: z.string().min(1).optional(),
    sharp_ref: z.string().min(1).optional(),
    heliographic_latitude_deg: z.number().finite().optional(),
    carrington_longitude_deg: z.number().finite().optional(),
    area_msh: z.number().nonnegative().optional(),
    magnetic_class: z.string().min(1).optional(),
    tilt_deg: z.number().finite().optional(),
    leading_polarity: z.string().min(1).optional(),
    hemisphere: z.enum(["north", "south"]).optional(),
    following_polarity: z.string().min(1).optional(),
    bipole_separation_deg: z.number().finite().optional(),
    emergence_time_iso: z.string().min(1).optional(),
    joy_law_tilt_class: z.string().min(1).optional(),
    linked_spot_ids: refArraySchema.optional(),
    bipolar_group_id: z.string().min(1).optional(),
    polarity_ordering_class: z.string().min(1).optional(),
  })
  .strict();

const solarActiveRegionsSchema = z
  .object({
    region_refs: refArraySchema.optional(),
    region_count: z.number().int().nonnegative().optional(),
    regions: z.array(solarActiveRegionSummarySchema).optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarSunspotSummarySchema = z
  .object({
    total_area_msh: z.number().nonnegative().optional(),
    mean_absolute_latitude_deg: z.number().nonnegative().optional(),
    bipolar_group_count: z.number().int().nonnegative().optional(),
  })
  .strict();

const solarSunspotEntrySchema = z
  .object({
    spot_id: z.string().min(1),
    linked_region_id: z.string().min(1).optional(),
    linked_noaa_region_id: z.string().min(1).optional(),
    linked_harp_id: z.string().min(1).optional(),
    hemisphere: z.enum(["north", "south"]).optional(),
    heliographic_latitude_deg: z.number().finite().optional(),
    carrington_longitude_deg: z.number().finite().optional(),
    area_msh: z.number().nonnegative().optional(),
    polarity: z.string().min(1).optional(),
    umbra_area_msh: z.number().nonnegative().optional(),
    penumbra_area_msh: z.number().nonnegative().optional(),
    magnetic_class: z.string().min(1).optional(),
    bipolar_group_id: z.string().min(1).optional(),
    emergence_time_iso: z.string().min(1).optional(),
  })
  .strict();

const solarSunspotCatalogSchema = z
  .object({
    spot_refs: refArraySchema.optional(),
    spot_count: z.number().int().nonnegative().optional(),
    bipolar_group_refs: refArraySchema.optional(),
    spots: z.array(solarSunspotEntrySchema).optional(),
    summary: solarSunspotSummarySchema.optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarEventLinkageEntrySchema = z
  .object({
    linked_region_id: z.string().min(1).optional(),
    linked_noaa_region_id: z.string().min(1).optional(),
    linked_harp_id: z.string().min(1).optional(),
    linked_flare_event_ref: z.string().min(1).optional(),
    event_type: z.enum(["flare", "cme", "sunquake"]),
    event_ref: z.string().min(1),
    linkage_basis: z.enum(["catalog", "region_id_match", "spatiotemporal", "manual_catalog_association"]),
    event_time_iso: z.string().min(1).optional(),
    time_offset_minutes: z.number().finite().optional(),
    notes: refArraySchema.optional(),
  })
  .strict();

const solarEventLinkageSchema = z
  .object({
    link_refs: refArraySchema.optional(),
    links: z.array(solarEventLinkageEntrySchema).optional(),
    summary: z
      .object({
        flare_link_count: z.number().int().nonnegative().optional(),
        cme_link_count: z.number().int().nonnegative().optional(),
        sunquake_link_count: z.number().int().nonnegative().optional(),
      })
      .strict()
      .optional(),
    metadata: starSimSolarArtifactMetadataSchema.optional(),
  })
  .strict();

const solarTopologyLinkageEntrySchema = z
  .object({
    link_id: z.string().min(1),
    linked_spot_ids: refArraySchema.optional(),
    linked_region_id: z.string().min(1).optional(),
    linked_noaa_region_id: z.string().min(1).optional(),
    linked_harp_id: z.string().min(1).optional(),
    linked_pfss_solution_ref: z.string().min(1).optional(),
    linked_open_field_map_ref: z.string().min(1).optional(),
    linked_coronal_hole_refs: refArraySchema.optional(),
    linked_flare_refs: refArraySchema.optional(),
    linked_cme_refs: refArraySchema.optional(),
    linked_polar_field_ref: z.string().min(1).optional(),
    linked_axial_dipole_ref: z.string().min(1).optional(),
    topology_role: z.string().min(1).optional(),
    linkage_basis: z.enum(["catalog", "region_id_match", "spatiotemporal", "manual_catalog_association"]),
    time_window_start: z.string().min(1).optional(),
    time_window_end: z.string().min(1).optional(),
    notes: refArraySchema.optional(),
  })
  .strict();

const solarTopologyLinkageSchema = z
  .object({
    link_refs: refArraySchema.optional(),
    link_count: z.number().int().nonnegative().optional(),
    links: z.array(solarTopologyLinkageEntrySchema).optional(),
    summary: z
      .object({
        topology_role_count: z.number().int().nonnegative().optional(),
        open_flux_link_count: z.number().int().nonnegative().optional(),
        event_link_count: z.number().int().nonnegative().optional(),
      })
      .strict()
      .optional(),
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
    solar_structural_residuals: solarStructuralResidualsSchema.optional(),
    solar_local_helio: solarLocalHelioSchema.optional(),
    solar_magnetogram: solarMagnetogramSchema.optional(),
    solar_surface_flows: solarSurfaceFlowsSchema.optional(),
    solar_coronal_field: solarCoronalFieldSchema.optional(),
    solar_cycle_indices: solarCycleIndicesSchema.optional(),
    solar_cycle_history: solarCycleHistorySchema.optional(),
    solar_magnetic_memory: solarMagneticMemorySchema.optional(),
    solar_active_regions: solarActiveRegionsSchema.optional(),
    solar_sunspot_catalog: solarSunspotCatalogSchema.optional(),
    solar_event_linkage: solarEventLinkageSchema.optional(),
    solar_topology_linkage: solarTopologyLinkageSchema.optional(),
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
