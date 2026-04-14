# StarSim Solar Reference Anchors

`star-sim-v1` now evaluates the Sun-only observed baseline against a central reference-pack artifact instead of scattering solar thresholds through multiple modules.

Pack artifact:

- `data/starsim/solar-reference-pack.v1.json`
- loaded through `server/modules/starsim/solar-reference-pack.ts`

Separate evidence artifact:

- `data/starsim/solar-product-registry.v1.json`
- loaded through `server/modules/starsim/solar-product-registry.ts`

Current pack identity:

- `solar_reference_pack`
- version `2026-04-13/10`

## What the pack anchors

Interior anchors:

- `solar.interior.convection_zone_depth.v1`
- `solar.interior.envelope_helium_fraction.v1`
- `solar.interior.low_degree_mode_support.v1`
- `solar.interior.neutrino_constraint_vector.v1`

Local helioseismology anchors:

- `solar.local_helio.dopplergram_context.v1`
- `solar.local_helio.travel_time_or_holography_context.v1`
- `solar.local_helio.sunquake_event_context.v1`

Structural-residual anchors:

- `solar.structural_residuals.hydrostatic_balance_context.v1`
- `solar.structural_residuals.sound_speed_residual_context.v1`
- `solar.structural_residuals.rotation_residual_context.v1`
- `solar.structural_residuals.pressure_scale_height_continuity_context.v1`
- `solar.structural_residuals.neutrino_seismic_consistency_context.v1`
- `solar.structural_residuals.residual_metadata_coherence_context.v1`

Cycle anchors:

- `solar.cycle.cycle_indices.v1`
- `solar.cycle.chronology_window.v1`
- `solar.cycle.polarity_reversal_context.v1`
- `solar.cycle.butterfly_history.v1`
- `solar.cycle.axial_dipole_history.v1`
- `solar.cycle.magnetogram_context.v1`
- `solar.cycle.active_region_context.v1`
- `solar.cycle.irradiance_continuity.v1`

Surface-flow anchors:

- `solar.surface_flow.differential_rotation_context.v1`
- `solar.surface_flow.meridional_flow_context.v1`
- `solar.surface_flow.surface_transport_proxy_context.v1`
- `solar.surface_flow.active_region_geometry_context.v1`

Magnetic-memory anchors:

- `solar.magnetic_memory.axial_dipole_continuity_context.v1`
- `solar.magnetic_memory.polar_field_continuity_context.v1`
- `solar.magnetic_memory.reversal_linkage_context.v1`
- `solar.magnetic_memory.active_region_polarity_ordering_context.v1`
- `solar.magnetic_memory.hemisphere_bipolar_coverage_context.v1`
- `solar.magnetic_memory.bipolar_region_proxy_context.v1`

Spot-region anchors:

- `solar.spot_region.sunspot_catalog_context.v1`
- `solar.spot_region.spot_geometry_context.v1`
- `solar.spot_region.spot_region_linkage_context.v1`
- `solar.spot_region.bipolar_grouping_context.v1`
- `solar.spot_region.polarity_tilt_context.v1`

Event-linkage anchors:

- `solar.event_linkage.flare_region_linkage_context.v1`
- `solar.event_linkage.cme_region_linkage_context.v1`
- `solar.event_linkage.sunquake_flare_region_linkage_context.v1`
- `solar.event_linkage.event_chronology_alignment_context.v1`
- `solar.event_linkage.region_identifier_consistency_context.v1`

Coronal-field anchors:

- `solar.coronal_field.pfss_context.v1`
- `solar.coronal_field.synoptic_boundary_context.v1`
- `solar.coronal_field.open_field_topology_context.v1`
- `solar.coronal_field.source_region_linkage_context.v1`
- `solar.coronal_field.metadata_coherence_context.v1`
- `solar.coronal_field.euv_coronal_context.v1`

Topology-linkage anchors:

- `solar.topology_linkage.spot_region_corona_context.v1`
- `solar.topology_linkage.open_flux_polar_field_continuity_context.v1`
- `solar.topology_linkage.event_topology_context.v1`
- `solar.topology_linkage.topology_role_context.v1`
- `solar.topology_linkage.chronology_alignment_context.v1`
- `solar.topology_linkage.identifier_consistency_context.v1`

Cross-layer consistency anchors:

- `solar.cross_layer_consistency.interior_residual_coherence.v1`
- `solar.cross_layer_consistency.mode_residual_coherence.v1`
- `solar.cross_layer_consistency.rotation_residual_coherence.v1`
- `solar.cross_layer_consistency.cycle_memory_topology_coherence.v1`
- `solar.cross_layer_consistency.event_topology_identifier_coherence.v1`
- `solar.cross_layer_consistency.chronology_metadata_alignment.v1`

These anchors now also carry mismatch-policy semantics in the reference pack, including whether missing refs must be surfaced, whether exact history-to-memory ref equality is required, and whether cross-layer failures should emit conflicting id/ref tokens and topology-window mismatch details.

Eruptive anchors:

- `solar.eruptive.flare_catalog.v1`
- `solar.eruptive.cme_catalog.v1`
- `solar.eruptive.irradiance_continuity.v1`
- `solar.eruptive.source_region_linkage.v1`

Cross-phase consistency anchors:

- `solar.consistency.source_region_overlap.v1`
- `solar.consistency.magnetogram_active_region_linkage.v1`
- `solar.consistency.irradiance_context.v1`
- `solar.consistency.phase_metadata_coherence.v1`

## Reference basis

The current pack is anchored to the targeted solar references already selected for the repo:

- [Basu & Antia 2004](https://arxiv.org/abs/astro-ph/0403485) for helioseismic closure context
- [Borexino solar neutrino spectroscopy](https://www.nature.com/articles/s41586-018-0624-y) for neutrino-vector completeness context
- [HMI magnetic products](https://hmi.stanford.edu/magnetic/) and [GONG helioseismology products](https://nso.edu/telescopes/nisp/gong/) for compact sound-speed and rotation residual product semantics
- [HMI magnetic products](https://hmi.stanford.edu/magnetic/) for magnetogram and active-region semantics
- [GONG helioseismology products](https://nso.edu/telescopes/nisp/gong/) for global-mode product semantics
- [GOES X-ray flux products](https://www.swpc.noaa.gov/node/47) for flare/X-ray observational context
- [Surface Flux Transport on the Sun](https://link.springer.com/article/10.1007/s11214-023-00978-8) for Hale-cycle chronology, butterfly-history, axial-dipole trend context, observed surface-flow semantics, and magnetic-memory continuity semantics
- [NSO PFSS products](https://nso.edu/data/nisp-data/pfss/) for PFSS-style coronal topology and source-surface semantics
- [SDO/AIA](https://sdo.gsfc.nasa.gov/data/aiahmi/) for advisory EUV coronal context
- [SDO/EVE](https://lasp.colorado.edu/eve/) for EUV irradiance context
- [TSIS/TIM TSI data](https://lasp.colorado.edu/tsis/data/tsi-data/) for long-baseline irradiance continuity
- [SOHO/LASCO](https://lasco-www.nrl.navy.mil/) for CME catalog semantics

## Operational meaning

Every solar diagnostic check now carries:

- `reference_anchor_id`
- `reference_pack_id`
- `reference_pack_version`
- `reference_doc_ids`
- `reference_basis`
- `product_family`

This lets operators see which anchored criterion produced a given `pass`, `warn`, `fail`, or `missing` result.

Sun resolve responses also surface:

- `solar_reference_pack_id`
- `solar_reference_pack_version`
- `solar_reference_pack_ref`
- `solar_product_registry_id`
- `solar_product_registry_version`
- `solar_product_registry_ref`

The distinction is intentional:

- reference pack = criteria, tolerances, and benchmark semantics
- product registry = evidence/product semantics and section-level provenance

## Repeatability

The Sun baseline signature now includes the reference-pack identity and pack content basis.

That means:

- evidence changes still show up as ordinary solar drift
- criteria changes show up as `reference_basis_changed`
- product-id or section provenance changes show up as evidence drift, not `reference_basis_changed`
- structural-residual ref or residual-summary changes show up as evidence drift through `structural_residual_context_changed`
- surface-flow ref changes or active-region geometry changes show up as evidence drift through `surface_flow_context_changed`
- magnetic-memory ref changes or bipolar active-region semantic changes show up as evidence drift through `magnetic_memory_context_changed`
- sunspot ref changes or spot-to-region / bipolar-group semantic changes show up as evidence drift through `spot_region_context_changed`
- event-linkage ref or association-semantic changes show up as evidence drift through `event_linkage_context_changed`
- coronal-field ref or PFSS/open-field topology changes show up as evidence drift through `coronal_field_context_changed`
- topology-linkage ref, topology-role, or linkage-basis changes show up as evidence drift through `topology_linkage_context_changed`
- cross-layer coherence verdict and mismatch-fingerprint changes show up as evidence drift through `cross_layer_consistency_changed`

This is intentional. A change in benchmark criteria should not masquerade as data drift.

`reference_basis_changed` can now happen because:

- the pack version changed
- or the pack content changed materially while keeping the same id/version

This is determined from deterministic pack content identity, not file timestamps.

## Out of scope

This pack does not imply:

- live HMI, GONG, GOES, EVE, TSIS, or LASCO ingestion
- predictive flux transport or dynamo logic
- flare or CME forecasting
- full local helioseismology inversion
