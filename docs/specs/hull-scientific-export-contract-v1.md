# Hull Scientific Export Contract v1

## Purpose

Phase 3 defines the scientific export lane for NHM2 full-atlas snapshots.

It is the parity bridge between:

- in-app certified full-atlas rendering, and
- external scientific inspection in ParaView/VisIt.

This contract is export/parity only. It does not change solver physics.

## Scope

Phase 3 exports one certified snapshot bundle:

- one `metric_ref_hash`
- one `certificate_hash`
- one timestamp/convention set
- one deterministic field package

All exported products must remain bound to the same certified source identity.

## Non-Goals

- No new physics equations.
- No render semantic changes.
- No replacement of in-app atlas as source of truth.
- No requirement to export full null-ray histories in Phase 3A.

## Contract Source

Type contract: `shared/hull-export-contract.ts`.

Render certificate source: `shared/hull-render-contract.ts`.

## API Shape

Dataset export endpoint:

- `POST /api/helix/hull-export/dataset`
- request type: `HullScientificExportRequestV1`
- response type: `HullScientificExportResponseV1`

Parity endpoint:

- `POST /api/helix/hull-export/parity`
- request/response types share the same parity structures defined in `shared/hull-export-contract.ts`.

Strict policy:

- fail-closed on certificate mismatch, metadata mismatch, channel hash mismatch, or stale linkage.

## Required Channels

The export must include, at minimum:

- ADM/metric channels:
  - `alpha`
  - `beta_x`, `beta_y`, `beta_z`
  - `gamma_xx`, `gamma_xy`, `gamma_xz`, `gamma_yy`, `gamma_yz`, `gamma_zz`
  - `K_xx`, `K_xy`, `K_xz`, `K_yy`, `K_yz`, `K_zz`
  - `K_trace`
- derived physics channels:
  - `theta`
  - `rho`
  - `H_constraint`
  - `M_constraint_x`, `M_constraint_y`, `M_constraint_z`
- support channels:
  - `hull_sdf`
  - `tile_support_mask`
  - `region_class`

Optional channels for Phase 3A/3B are defined in the shared contract and include causal/optical attachments.

## Metadata and Convention Lock

Export sidecar must include:

- `metric_ref_hash`
- `certificate_hash`
- `certificate_schema_version`
- `chart`
- `observer`
- `theta_definition`
- `kij_sign_convention`
- `unit_system`
- `dims`
- `spacing_m`
- `axes`
- `storage_order` (fixed: `zyx`)
- `timestamp_ms`
- `field_hashes`

Any drift between export metadata and certificate metadata is a strict failure.

## File Formats

Primary scientific package:

- HDF5: field volumes.
- XDMF: dataset index for ParaView/VisIt.

Optional report assets:

- deterministic slice PNGs
- CSV summaries
- JSON parity report

## Failure Codes

Phase 3 canonical fail reasons:

- `scientific_export_certificate_missing`
- `scientific_export_certificate_mismatch`
- `scientific_export_channel_hash_mismatch`
- `scientific_export_metadata_mismatch`
- `scientific_export_slice_parity_fail`
- `scientific_export_constraint_parity_fail`
- `scientific_export_optical_parity_fail`

## Parity Matrix

The parity harness must run these checks:

1. Field hash parity
2. Metadata parity (chart/observer/conventions/units)
3. Slice parity (fixed orthogonal slices)
4. Constraint parity (`H_constraint`, `M_constraint_*` stats)
5. Support mask parity (coverage and topology counters)
6. Optical diagnostics parity (null residual, convergence, bundle spread)
7. Timestamp/certificate linkage parity

Each check emits `pass|fail|skipped` and threshold evidence in `HullScientificExportParityReportV1`.

## Implementation Split

Phase 3A:

- contract + endpoint + deterministic HDF5/XDMF export
- strict metadata/certificate validation
- sidecar emission with hashes and conventions

Phase 3B:

- external-tool parity harness (ParaView/VisIt loader path)
- deterministic slice extraction and parity reports
- strict drift fail reasons in CI/operator lane

## Done Criteria

Phase 3 is complete when:

1. A certified full-atlas snapshot exports as HDF5/XDMF.
2. Export sidecar carries the same certificate identity as atlas.
3. ParaView/VisIt can load dataset without semantic ambiguity.
4. Parity checks pass against in-app certified snapshot.
5. Strict mode rejects stale, partial, or convention-mismatched exports.
