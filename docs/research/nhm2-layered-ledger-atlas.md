# NHM2 Layered Ledger Atlas

## Purpose

The layered ledger atlas is a deterministic scientific visualization and audit artifact for the NHM2 selected diagnostic run. It combines solve-derived geometry, region envelopes, source-closure evidence, tile-sector layout context, and frozen-run blocker-ledger state without promoting NHM2 to validation, physical mechanism, propulsion, or solved full-warp status.

## Inputs

- `artifacts/research/full-solve/triage-brick-48.raw`
- `artifacts/research/full-solve/user-york-brick-latest.json`
- `artifacts/research/full-solve/nhm2-blocker-ledger-latest.json`
- `artifacts/research/full-solve/nhm2-regional-source-closure-evidence-latest.json`
- `configs/needle-hull-mark2-cavity-contract.v1.json`
- `docs/research/nhm2-layered-ledger-literature-map.v1.json`

When the default `*-latest.json` ledger/evidence files are absent, the renderer may resolve the newest NHM2 reference-run ledger/evidence artifact and records the resolved paths and SHA-256 hashes in `manifest.json`.

## Outputs

- `base_geometry.png`
- `region_envelopes.png`
- `sector_lattice.png`
- `source_closure_regions.png`
- `observer_qei_placeholders.png`
- `tensor_authority_gate.png`
- `frozen_run_ledger_frame.png`
- `combined_layered_atlas.png`
- `atlas_contact_sheet.png`
- Optional spatial-layer turntable when requested by CLI flag
- `manifest.json`
- `captions.md`

## Layer Semantics

Spatial hull-space layers are limited to solve geometry, nested region envelopes, sector scheduling geometry, source-closure region brackets, and observer/worldline paths. Audit metadata is not drawn as a physical field on the hull.

Validation overlays include tensor authority, QEI pending state, certificate status, adapter status, reproducibility state, literature boundary, and claim locks. These are badges, matrices, panels, legends, or ledger strips only.

## Color Semantics

Ricci-shell colors follow a Natario/Rodal-style contour palette for scalar-field visualization. Region shells use translucent teal/cyan/blue bands. Source/evidence status uses teal for pass, amber for review or missing, red-orange for fail, and gray for unknown or not run. Green audit items remain non-promotional and may be paired with a lock/caution encoding.

## Spatial vs Audit Metadata

Only solve geometry and region evidence may occupy hull space. Certificate status, literature checks, provenance, tensor-authority status, QEI status, and claim locks are audit metadata. They must not be rendered as glowing hull energy, field strength, or causal/propulsive effects.

## Caption Rules

Captions are generated from fixed strings plus ledger statuses. They are not free-form interpretive prose. Any caption using external physics terms such as Casimir, QEI, quantum inequality, energy condition, warp drive, negative energy, NEC, or WEC must cite at least one literature-map reference.

Any caption using `certificate pass` must explicitly carry a non-promotional boundary.

## Citation Rules

The literature map is context-only and claim-boundary support. It never validates NHM2, the selected run, a physical mechanism, propulsion, full tensor closure, QEI closure, or direct Casimir-to-curvature sourcing.

Required references are stored in `docs/research/nhm2-layered-ledger-literature-map.v1.json`.

## Claim Boundary

The manifest claim lock must keep all of these false:

- `validationClaimAllowed`
- `physicalMechanismClaimAllowed`
- `promotionAllowed`

The validator fails if captions or manifest language implies working propulsion, proof of propulsion, validated physical mechanism, solved full warp drive, measured detector observation, direct Casimir-to-curvature proof, or external-paper validation of NHM2.

## Reproduction Commands

```bash
npm run render:nhm2:ricci4-turntable
npm run nhm2:render-layered-ledger-atlas
npm run nhm2:validate-layered-ledger-atlas
```

For the broader NHM2 gate stack:

```bash
npm run nhm2:run-reference-validation-chain
npm run physics:validate
npm test
```
