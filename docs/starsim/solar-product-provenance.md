# StarSim Solar Product Provenance

`star-sim-v1` now separates Sun calibration criteria from Sun evidence provenance.

## Data artifacts

- `data/starsim/solar-reference-pack.v1.json`
  Criteria and benchmark semantics.
- `data/starsim/solar-product-registry.v1.json`
  Evidence/product semantics for the current Sun baseline fixtures.

## Section metadata

Each populated solar section can now declare:

- `source_product_id`
- `source_product_family`
- `source_doc_ids`

These fields sit alongside the existing solar artifact metadata such as:

- `instrument`
- `observed_mode`
- `time_range`
- `cadence`
- `coordinate_frame`
- `carrington_rotation`

## Product-provenance diagnostics

Sun resolves now expose `solar_provenance_diagnostics`.

That diagnostic layer checks whether a section:

- declares a source product id
- uses a product id present in the active solar product registry
- declares a product family compatible with the active solar reference pack
- carries the citation ids expected for that product
- matches the registry’s observed/assimilated mode
- keeps metadata semantics compatible with the registry entry

## Drift semantics

The solar baseline signature now includes section product provenance.

That means:

- changing section product ids, families, or citation ids counts as evidence drift
- changing only the calibration pack counts as `reference_basis_changed`

This separation keeps provenance churn from masquerading as calibration drift, and keeps calibration changes from masquerading as data drift.
