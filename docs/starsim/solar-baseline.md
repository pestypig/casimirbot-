# StarSim Solar Baseline

`star-sim-v1` now has a separate solar scaffolding track alongside the existing `solar_like_main_sequence_live` path.

## Scope

This scaffold is for `solar_observed_baseline_v1` only.
It is intended to make the repo observationally literate for the Sun without claiming full-Sun closure.

Phase labels:

- `solar_interior_closure_v1`
- `solar_structural_residual_closure_v1`
- `solar_cycle_observed_v1`
- `solar_eruptive_catalog_v1`
- `solar_local_helio_observed_v1`
- `solar_surface_flow_observed_v1`
- `solar_magnetic_memory_observed_v1`
- `solar_spot_region_observed_v1`
- `solar_event_association_observed_v1`
- `solar_coronal_field_observed_v1`
- `solar_topology_linkage_observed_v1`
- `solar_cross_layer_consistency_v1`

## What the scaffold adds

The request contract can now carry a `solar_baseline` section with first-class solar objects such as:

- `solar_interior_profile`
- `solar_layer_boundaries`
- `solar_global_modes`
- `solar_local_helio`
- `solar_structural_residuals`
- `solar_magnetogram`
- `solar_surface_flows`
- `solar_cycle_indices`
- `solar_cycle_history`
- `solar_magnetic_memory`
- `solar_sunspot_catalog`
- `solar_event_linkage`
- `solar_coronal_field`
- `solar_topology_linkage`
- `solar_active_regions`
- `solar_flare_catalog`
- `solar_cme_catalog`
- `solar_irradiance_series`
- `solar_neutrino_constraints`
- `solar_granulation_stats`

Solar artifacts can also carry additive metadata for:

- time range
- cadence
- coordinate frame
- Carrington rotation
- instrument
- observed/model/assimilated mode
- source product id
- source product family
- source doc ids
- uncertainty summary

## Current population path

Sun requests can now populate a fixture/static `solar_baseline` through the source resolver.
The current populated Phase 0 sections are:

- `solar_interior_profile`
- `solar_layer_boundaries`
- `solar_global_modes`
- `solar_local_helio`
- `solar_neutrino_constraints`
- `solar_structural_residuals`
- `solar_cycle_indices`
- `solar_cycle_history`
- `solar_magnetogram`
- `solar_surface_flows`
- `solar_magnetic_memory`
- `solar_sunspot_catalog`
- `solar_event_linkage`
- `solar_coronal_field`
- `solar_topology_linkage`
- `solar_active_regions`
- `solar_flare_catalog`
- `solar_cme_catalog`
- `solar_irradiance_series`

The resolver also exposes additive `solar_baseline_support` readiness for the populated solar baseline phases.
This support signal is content-sensitive, not just section-sensitive.

Current Phase 0 closure checks:

- convection-zone depth against the current Sun closure band
- envelope helium fraction against the current Sun closure band
- low-degree mode support count plus supporting refs
- neutrino closure vector completeness

These checks surface under `closure_diagnostics` with `pass`, `warn`, `fail`, or `missing` status per check.
They are now anchored to the data-driven pack in `data/starsim/solar-reference-pack.v1.json` at `solar_reference_pack@2026-04-13/10`, and each check carries `reference_anchor_id`, `reference_pack_id`, `reference_pack_version`, `reference_doc_ids`, `reference_basis`, and `product_family`.
Passing this gate still does not mean `structure_mesa` or `oscillation_gyre` solve the full Sun.

Current structural-residual closure checks:

- hydrostatic-balance residual context requires a `hydrostatic_residual_ref` plus compact residual summary support
- sound-speed residual context requires a `sound_speed_residual_ref` plus compact residual summary support
- rotation residual context requires a `rotation_residual_ref` plus compact residual summary support
- pressure-scale-height continuity is advisory-only if missing in this phase, but it is checked when present
- neutrino-seismic consistency is advisory-only if missing in this phase, but it is checked when present
- residual metadata coherence requires Carrington-frame, cadence-aware, residual-window-aware metadata

These checks surface under `structural_residual_diagnostics`.
They use the same anchored reference metadata and product-provenance model as the other solar phases.
Passing `solar_structural_residual_closure_v1` means the baseline has compact observed/assimilated residual closure context; it does not imply live inversions, full structural closure, or a full-Sun solver.

Current observed cycle checks:

- cycle indices require `sunspot_number`, `f10_7_sfu`, `cycle_label`, and `polarity_label`
- cycle chronology requires a multi-year `solar_cycle_history` section spanning Cycle 24 to Cycle 25 context
- polarity-reversal context requires explicit reversal refs or dates
- butterfly-history evidence requires a `butterfly_history_ref`
- axial-dipole history requires both axial-dipole and polar-field trend refs
- magnetogram context requires a primary magnetogram ref plus synoptic or active-region linkage
- active-region context requires non-empty region count or refs
- irradiance continuity is advisory and currently reported as cycle warning context only

These checks surface under `cycle_diagnostics`.
They also carry the same anchored reference metadata, so cycle readiness is explicit about which product semantics it used.
Passing `solar_cycle_observed_v1` now requires Hale-aware chronology context, but it still does not imply flux transport, dynamo closure, or cycle prediction.

Current observed eruptive checks:

- flare catalog requires event coverage plus a strongest GOES class summary
- CME catalog requires event coverage
- irradiance continuity prefers EUV or X-ray continuity, with TSI-only support treated as warning strength
- source-region linkage prefers explicit flare/CME source-region refs and otherwise falls back to advisory active-region context

These checks surface under `eruptive_diagnostics`.
They also carry anchored reference metadata so flare/CME/irradiance verdicts can be traced back to the current reference pack.
Passing `solar_eruptive_catalog_v1` does not imply flare prediction, CME prediction, nanoflare closure, or solar-wind propagation.

Current observed local-helio checks:

- Dopplergram context requires a `dopplergram_ref`
- local analysis context requires either `travel_time_ref` or `holography_ref`
- sunquake event refs are advisory-only observational context in this phase

These checks surface under `local_helio_diagnostics`.
They use the same anchored reference metadata and product provenance model as the other solar phases.
Passing `solar_local_helio_observed_v1` means the baseline has explicit local-helioseismology context; it does not imply local inversion closure, causal sunquake attribution, or predictive flare-seismic coupling.

Current observed surface-flow checks:

- differential-rotation context requires a `differential_rotation_ref` plus compact rotation summary support
- meridional-flow context requires a `meridional_flow_ref`, with peak-flow summary support treated as preferred but advisory
- active-region geometry requires compact per-region latitude, longitude, area, tilt, magnetic class, and leading-polarity summaries
- supergranular-diffusion or transport-proxy refs are advisory-only in this phase

These checks surface under `surface_flow_diagnostics`.
They use the same anchored reference metadata and product-provenance model as the other solar phases.
Passing `solar_surface_flow_observed_v1` means the baseline has observed surface-flow and active-region geometry context; it does not imply a surface-flux-transport solver, Babcock-Leighton closure, or cycle prediction.

Current observed magnetic-memory checks:

- axial-dipole continuity requires an `axial_dipole_history_ref` plus explicit cycle-label coverage and latest-sign summary context
- polar-field continuity requires a `polar_field_history_ref` plus north/south polarity-state summaries
- reversal linkage requires explicit `polarity_reversal_refs` plus reversal-marker summary support
- bipolar active-region ordering requires hemisphere, leading/following polarity, separation, and tilt semantics per region
- hemisphere coverage requires populated bipolar active-region context in both hemispheres
- a `bipolar_region_proxy_ref` is advisory-only in this phase

These checks surface under `magnetic_memory_diagnostics`.
They use the same anchored reference metadata and product-provenance model as the other solar phases.
Passing `solar_magnetic_memory_observed_v1` means the baseline has observed magnetic-memory continuity context; it does not imply a surface-flux-transport solver, Babcock-Leighton closure, or predictive dynamo physics.

Current observed sunspot / spot-region checks:

- sunspot catalog context requires a populated `solar_sunspot_catalog` with nonzero spot coverage
- spot geometry requires enough per-spot latitude, Carrington longitude, area, and polarity detail
- spot-to-region linkage requires spot identifiers to resolve coherently against `solar_active_regions`
- bipolar grouping requires enough explicit `bipolar_group_id` coverage across the spot catalog
- polarity / tilt context requires spot polarity plus linked active-region tilt or polarity-ordering semantics

These checks surface under `spot_region_diagnostics`.
They use the same anchored reference metadata and product-provenance model as the other solar phases.
Passing `solar_spot_region_observed_v1` means the baseline has observed sunspot and bipolar-region object context; it does not imply sunspot-evolution modeling, predictive transport, or dynamo closure.

Current observed event-association checks:

- flare-to-region linkage requires explicit flare links that resolve back to the flare catalog and declare linked region identifiers
- CME-to-region linkage requires explicit CME links that resolve back to the CME catalog and declare linked region identifiers
- sunquake-to-flare/region linkage is advisory-only in this phase
- chronology alignment requires event timestamps compatible with linked-region emergence context and anchored sunquake timing offsets
- region-identifier consistency requires linked region, NOAA, or HARP identifiers to resolve coherently against `solar_active_regions`

These checks surface under `event_linkage_diagnostics`.
They use the same anchored reference metadata and product-provenance model as the other solar phases.
Passing `solar_event_association_observed_v1` means the baseline has observed multi-layer event-association integrity; it does not imply flare prediction, CME initiation modeling, or causal sunquake attribution.

Current observed coronal-field checks:

- PFSS context requires a `pfss_solution_ref` plus `source_surface_rsun` summary support
- synoptic boundary context requires a `synoptic_boundary_ref`
- open-field topology context requires coronal-hole or open-field map evidence plus compact topology summaries
- source-region linkage requires plausible linkage back to synoptic magnetogram, active-region, or event-linkage context
- coronal metadata coherence requires compatible Carrington-frame metadata, cadence semantics, and topology summary fields
- EUV coronal context is advisory-only supporting evidence in this phase

These checks surface under `coronal_field_diagnostics`.
They use the same anchored reference metadata and product-provenance model as the other solar phases.
Passing `solar_coronal_field_observed_v1` means the baseline has observed/proxy coronal magnetic topology context; it does not imply NLFFF closure, MHD closure, CME propagation modeling, or flare prediction.

Current observed topology-linkage checks:

- spot-region-corona linkage requires linked spot ids, region identifiers, and PFSS/open-field context to resolve coherently against populated surface and coronal sections
- open-flux / polar-field continuity requires topology links to carry open-field or coronal-hole context plus matching magnetic-memory refs
- event-to-topology context requires linked flare or CME refs that resolve back to the populated eruptive catalogs
- topology-role context requires explicit machine-readable `topology_role` values from the anchored allowlist
- chronology alignment requires valid topology windows and plausible ordering against linked event times or region emergence times
- cross-identifier consistency requires spot, region, NOAA, and HARP identifiers to agree across the linked sections

These checks surface under `topology_linkage_diagnostics`.
They use the same anchored reference metadata and product-provenance model as the other solar phases.
Passing `solar_topology_linkage_observed_v1` means the baseline has observed cross-layer topology linkage context; it does not imply NLFFF closure, MHD closure, transport closure, or predictive eruptive physics.

Current cross-layer consistency checks:

- interior profile summaries against structural residual summaries
- global-mode support against sound-speed and rotation residual support
- cycle-history and magnetic-memory continuity against PFSS/open-field topology linkage
- event linkage against topology-linkage identifier overlap
- chronology and metadata alignment across the interior-to-corona chain

These checks surface under `cross_layer_consistency_diagnostics`.
Each failing or warning check can now emit explicit mismatch fingerprint fields such as conflicting refs, conflicting region/NOAA/HARP ids, non-Carrington sections, missing time-range sections, out-of-window event refs, and topology-link ids in conflict.
`cross_layer_mismatch_summary` provides the compact aggregate with failing check ids, warning check ids, conflicting section ids, conflict-token count, and a deterministic `mismatch_fingerprint`.
They use the same anchored reference metadata as the other solar phases, but they evaluate whether existing populated sections agree rather than introducing a new solar section.
Passing `solar_cross_layer_consistency_v1` means the current Sun baseline clears a strict coherence phase across the existing structural, magnetic-memory, coronal, and event-linkage layers; it does not imply predictive transport, dynamo closure, or a full-Sun solver.

Cross-phase solar consistency now checks:

- eruptive source-region refs against cycle active-region refs
- magnetogram patch linkage against active-region context
- irradiance continuity across cycle and eruptive use
- section metadata coherence across coordinate frame, Carrington rotation, overlapping time ranges, and cadence semantics

These checks surface under `solar_consistency_diagnostics`.
The resolver also emits:

- `solar_reference_pack_id`
- `solar_reference_pack_version`
- `solar_reference_pack_ref`
- `solar_product_registry_id`
- `solar_product_registry_version`
- `solar_product_registry_ref`
- `solar_provenance_diagnostics`
- a deterministic `solar_baseline_signature`
- `solar_baseline_repeatability`

Repeatability now distinguishes evidence drift from criteria drift through `reference_basis_changed`.
That distinction is pack-content-aware, so a changed reference-pack artifact is treated differently from changed solar evidence.
Product-provenance changes are tracked separately from calibration-pack changes, so a changed section product id or doc-id set is treated as evidence drift rather than criteria drift.
Structural-residual refs and residual summary values are also part of the persisted Sun baseline signature, so those changes register as evidence drift through `structural_residual_context_changed`.
Surface-flow refs, magnetic-memory refs, and active-region geometry/bipolar summaries are also part of the persisted Sun baseline signature, so those changes show up as evidence drift rather than silent metadata churn.
Sunspot refs, bipolar-group ids, and spot-to-region linkage semantics are also part of the persisted Sun baseline signature, so those changes show up as evidence drift through `spot_region_context_changed`.
Event-linkage refs and `linkage_basis` semantics are also part of the persisted Sun baseline signature, so cross-layer association changes register as evidence drift through `event_linkage_context_changed`.
Coronal-field refs and PFSS/open-field topology summaries are also part of the persisted Sun baseline signature, so those changes register as evidence drift through `coronal_field_context_changed`.
Topology-linkage refs, topology roles, and linkage-basis semantics are also part of the persisted Sun baseline signature, so those changes register as evidence drift through `topology_linkage_context_changed`.
Cross-layer consistency verdict summaries and mismatch fingerprints are also part of the persisted Sun baseline signature, so coherence-only evidence changes register as evidence drift through `cross_layer_consistency_changed`.
This is an observational coherence/repeatability check, not a predictive solar-physics score.

## Product provenance

The Sun baseline now uses two separate data artifacts:

- `data/starsim/solar-reference-pack.v1.json`
  This is the calibration authority for pass/warn/fail criteria.
- `data/starsim/solar-product-registry.v1.json`
  This is the evidence/product authority for section-level product ids, product families, and citation ids.

Each populated solar section can now declare:

- `source_product_id`
- `source_product_family`
- `source_doc_ids`

These declarations are validated additively through `solar_provenance_diagnostics`.
That diagnostic layer checks whether a section:

- declares a product id
- uses a product id present in the active product registry
- declares a family compatible with the active reference pack
- carries the expected citation ids
- matches the product-registry observed/assimilated mode and metadata semantics

## What this does not claim

This patch does not imply:

- full JSOC/HMI/AIA/EVE live ingestion
- full raw helioseismology inversion
- 3D MHD
- full corona closure
- full flare/CME prediction

The current live fit path remains the existing solar-like stellar path.
