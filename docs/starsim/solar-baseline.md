# StarSim Solar Baseline

`star-sim-v1` now has a separate solar scaffolding track alongside the existing `solar_like_main_sequence_live` path.

## Scope

This scaffold is for `solar_observed_baseline_v1` only.
It is intended to make the repo observationally literate for the Sun without claiming full-Sun closure.

Phase labels:

- `solar_interior_closure_v1`
- `solar_cycle_observed_v1`
- `solar_eruptive_catalog_v1`

## What the scaffold adds

The request contract can now carry a `solar_baseline` section with first-class solar objects such as:

- `solar_interior_profile`
- `solar_layer_boundaries`
- `solar_global_modes`
- `solar_local_helio`
- `solar_magnetogram`
- `solar_cycle_indices`
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
- `solar_neutrino_constraints`
- `solar_cycle_indices`
- `solar_magnetogram`
- `solar_active_regions`
- `solar_flare_catalog`
- `solar_cme_catalog`
- `solar_irradiance_series`

The resolver also exposes additive `solar_baseline_support` readiness for `solar_interior_closure_v1`.
This support signal is now content-sensitive, not just section-sensitive.

Current Phase 0 closure checks:

- convection-zone depth against the current Sun closure band
- envelope helium fraction against the current Sun closure band
- low-degree mode support count plus supporting refs
- neutrino closure vector completeness

These checks surface under `closure_diagnostics` with `pass`, `warn`, `fail`, or `missing` status per check.
They are now anchored to the data-driven pack in `data/starsim/solar-reference-pack.v1.json` at `solar_reference_pack@2026-04-11/2`, and each check carries `reference_anchor_id`, `reference_pack_id`, `reference_pack_version`, `reference_doc_ids`, `reference_basis`, and `product_family`.
Passing this gate still does not mean `structure_mesa` or `oscillation_gyre` solve the full Sun.

Current observed cycle checks:

- cycle indices require `sunspot_number`, `f10_7_sfu`, `cycle_label`, and `polarity_label`
- magnetogram context requires a primary magnetogram ref plus synoptic or active-region linkage
- active-region context requires non-empty region count or refs
- irradiance continuity is advisory and currently reported as cycle warning context only

These checks surface under `cycle_diagnostics`.
They also carry the same anchored reference metadata, so cycle readiness is explicit about which product semantics it used.
Passing `solar_cycle_observed_v1` does not imply flux transport, dynamo closure, or cycle prediction.

Current observed eruptive checks:

- flare catalog requires event coverage plus a strongest GOES class summary
- CME catalog requires event coverage
- irradiance continuity prefers EUV or X-ray continuity, with TSI-only support treated as warning strength
- source-region linkage prefers explicit flare/CME source-region refs and otherwise falls back to advisory active-region context

These checks surface under `eruptive_diagnostics`.
They also carry anchored reference metadata so flare/CME/irradiance verdicts can be traced back to the current reference pack.
Passing `solar_eruptive_catalog_v1` does not imply flare prediction, CME prediction, nanoflare closure, or solar-wind propagation.

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
