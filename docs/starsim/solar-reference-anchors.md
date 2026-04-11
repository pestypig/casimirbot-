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
- version `2026-04-11/2`

## What the pack anchors

Interior anchors:

- `solar.interior.convection_zone_depth.v1`
- `solar.interior.envelope_helium_fraction.v1`
- `solar.interior.low_degree_mode_support.v1`
- `solar.interior.neutrino_constraint_vector.v1`

Cycle anchors:

- `solar.cycle.cycle_indices.v1`
- `solar.cycle.magnetogram_context.v1`
- `solar.cycle.active_region_context.v1`
- `solar.cycle.irradiance_continuity.v1`

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
- [HMI magnetic products](https://hmi.stanford.edu/magnetic/) for magnetogram and active-region semantics
- [GONG helioseismology products](https://nso.edu/telescopes/nisp/gong/) for global-mode product semantics
- [GOES X-ray flux products](https://www.swpc.noaa.gov/node/47) for flare/X-ray observational context
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
