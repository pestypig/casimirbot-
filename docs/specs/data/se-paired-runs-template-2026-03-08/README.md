# SE Paired-Run Starter Bundle (2026-03-08)

This template demonstrates the structure needed to close the two current reportable blockers for `sem_ellipsometry`:
- `missing_paired_dual_instrument_run`
- `missing_covariance_uncertainty_anchor`

Important:
1. Numeric rows in this folder are starter placeholders for pipeline validation.
2. Do not use this bundle as manuscript-grade measurement evidence.
3. For reportable claims, replace all placeholder rows with instrument-exported paired runs and commit raw provenance metadata.

## Files
1. `sem-measurements.csv`
2. `ellips-measurements.csv`
3. `pairing-manifest.json`
4. `covariance-budget.json`

## Minimum workflow
1. Populate CSV rows with matched `sample_id` values.
2. Prepare manifest provenance from instrument exports:

```powershell
npm run warp:shadow:se-paired-evidence:prepare-manifest -- \
  --manifest docs/specs/data/se-paired-runs-template-2026-03-08/pairing-manifest.json \
  --run-ids SEM_RUN_001,ELLIPS_RUN_001 \
  --data-origin instrument_export \
  --raw-refs raw/sem-export.csv,raw/ellips-export.csv,raw/lab-metadata.json
```

3. In `pairing-manifest.json`, ensure:
   - `provenance.data_origin = "instrument_export"`
   - non-empty `provenance.instrument_run_ids`
   - non-empty `provenance.raw_artifact_refs`
   - `provenance.raw_artifact_sha256` entries for any non-local refs
4. Fill manifest/covariance numeric fields.
5. Ingest and validate:

```powershell
npm run warp:shadow:se-paired-evidence:ingest -- \
  --sem docs/specs/data/se-paired-runs-template-2026-03-08/sem-measurements.csv \
  --ellips docs/specs/data/se-paired-runs-template-2026-03-08/ellips-measurements.csv \
  --manifest docs/specs/data/se-paired-runs-template-2026-03-08/pairing-manifest.json \
  --covariance docs/specs/data/se-paired-runs-template-2026-03-08/covariance-budget.json \
  --out-evidence docs/specs/data/se-paired-runs-template-2026-03-08/se-paired-run-evidence.v1.json

npm run warp:shadow:se-paired-evidence:validate -- \
  --evidence docs/specs/data/se-paired-runs-template-2026-03-08/se-paired-run-evidence.v1.json
```

6. Rebuild/reportable-check:

```powershell
npm run warp:shadow:build-se-packs -- --paired-evidence docs/specs/data/se-paired-runs-template-2026-03-08/se-paired-run-evidence.v1.json
```

## Source anchors
Use strict source refs from:
- `EXP-SE-021..EXP-SE-031` (NIST SRM ellipsometry transfer anchors)
- existing SEM anchors (`EXP-SE-003`, `EXP-SE-009`, `EXP-SE-016`, `EXP-SE-017`)

Starter-state note:
1. This template ships with `data_origin=template_placeholder`, so reportable readiness is expected to remain blocked until replaced with real instrument provenance.
2. Ingest auto-hashes local input files (`sem`, `ellips`, `manifest`, `covariance`) into `raw_artifact_sha256`; external refs must carry explicit SHA-256 entries.
