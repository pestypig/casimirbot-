# Warp Deliverable Bundle Contract v1

## Purpose
Defines a frozen review bundle generated from `warp-deliverable-dossier-latest.json`, with copied source artifacts and per-file checksums in one package.

Boundary statement (required):

`This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.`

## Command

`npm run warp:deliverable:bundle`

Optional strict mode (fail if any referenced file is missing):

`npm run warp:deliverable:bundle -- --strict-missing`

## Outputs

- Bundle directory: `artifacts/research/full-solve/warp-deliverable-bundle-YYYY-MM-DD/`
- Bundle manifest JSON: `artifacts/research/full-solve/warp-deliverable-bundle-YYYY-MM-DD/manifest.json`
- Bundle manifest Markdown: `artifacts/research/full-solve/warp-deliverable-bundle-YYYY-MM-DD/manifest.md`
- Dated summary JSON: `artifacts/research/full-solve/warp-deliverable-bundle-YYYY-MM-DD.json`
- Dated summary Markdown: `docs/audits/research/warp-deliverable-bundle-YYYY-MM-DD.md`
- Latest summary JSON alias: `artifacts/research/full-solve/warp-deliverable-bundle-latest.json`
- Latest summary Markdown alias: `docs/audits/research/warp-deliverable-bundle-latest.md`

## Required manifest keys

- `artifact_type` = `warp_deliverable_bundle/v1`
- `generator_version`
- `generated_on`
- `generated_at`
- `commit_pin`
- `boundary_statement`
- `source_dossier_path`
- `max_depth`
- `copied_count`
- `missing_count`
- `copied_files[]`
- `missing_files[]`
- `normalized_checksum`
- `checksum`

## Required summary keys

- `artifact_type` = `warp_deliverable_bundle_summary/v1`
- `generator_version`
- `generated_on`
- `generated_at`
- `commit_pin`
- `boundary_statement`
- `source_dossier_path`
- `status` (`PASS | PARTIAL`)
- `bundle_dir`
- `manifest_path`
- `copied_count`
- `missing_count`
- `missing_sample[]`
- `manifest_checksum`
- `normalized_checksum`
- `checksum`

## Status policy

- `PASS`: no missing files were detected.
- `PARTIAL`: one or more referenced files are missing (bundle still emitted for review).
- `--strict-missing` converts `PARTIAL` into non-zero exit for CI enforcement.

## Non-blocking posture

This bundle is packaging/reporting only. It does not alter canonical thresholds, lane policy, or promotion policy.
