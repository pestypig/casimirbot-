# Warp External Work Comparison Contract v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Provide a deterministic, commit-pinned contract for replaying external work against the local full-solve reference capsule without changing canonical solver policy.

## Profile Artifact
- path: `configs/warp-external-work-profiles.v1.json`
- schema: `external_work_profile/v1`
- policy defaults:
  - `data_policy=snapshot_first`
  - `comparison_depth=dual_track`
  - `reference_only=true`
  - `canonical_blocking=false`

## Required Profile Fields
- `work_id`
- `title`
- `source_refs[]`
- `chain_ids[]`
- `commit_pin`
- `track_mirror`
- `track_method`
- `comparison_keys[]`
- `posture.reference_only`
- `posture.canonical_blocking`

## Dual-Track Rules
1. Mirror track:
   - must reference a scenario pack and checker path when enabled.
   - must include `required_anchors[]`.
2. Method track:
   - optional by profile.
   - when enabled, script + input snapshots + expected output keys are required.

## Snapshot-First Rule
1. Commit-tracked snapshots are authoritative inputs.
2. Live fetch is optional refresh only and must not be the only evidence source in strict runs.

## Output Contracts
1. Per-work run artifact:
   - `artifacts/research/full-solve/external-work/external-work-run-<work_id>-YYYY-MM-DD.json`
   - `docs/audits/research/warp-external-work-run-<work_id>-YYYY-MM-DD.md`
2. Per-work compare artifact:
   - `artifacts/research/full-solve/external-work/external-work-compare-<work_id>-YYYY-MM-DD.json`
   - `docs/audits/research/warp-external-work-compare-<work_id>-YYYY-MM-DD.md`
3. Master matrix artifact:
   - `artifacts/research/full-solve/external-work/external-work-comparison-matrix-YYYY-MM-DD.json`
   - `docs/audits/research/warp-external-work-comparison-matrix-YYYY-MM-DD.md`
4. Stable aliases:
   - `.../external-work-run-<work_id>-latest.json`
   - `.../external-work-compare-<work_id>-latest.json`
   - `.../external-work-comparison-matrix-latest.json`

### Method-track payload fields (geometry-first waves)
When a profile runs method-track geometry replay, the output payload must include:
- `geometry_signature`
- `comparison_result`
- `reason_codes`
- `recompute_ready`
- deterministic `checksum`

### Method-track payload fields (energetics/QEI waves)
When a profile runs method-track energetics/QEI replay, the output payload must include:
- `energetics_signature`
- `comparison_result`
- `reason_codes`
- `recompute_ready`
- deterministic `checksum`

## Classification Contract
- `compatible`: all comparison keys pass under configured tolerances.
- `partial`: at least one key passes and at least one key fails/missing.
- `inconclusive`: no evaluable keys or track blockers prevent comparison.

## Reason-Code Reduction Contract
- Per-work compare artifacts must preserve raw `reason_codes[]` and also emit reduced categories:
  - `summary.reduced_reason_codes[]`
  - `summary.reduced_reason_counts{}`
  - `summary.reason_reducer_version`
- Master matrix must aggregate reduced categories into `reduced_reason_counts{}` for manuscript-stable blocker tables.
- Reduced categories are deterministic and non-overlapping:
  - `artifact_missing`
  - `value_missing`
  - `non_comparable_or_unknown`
  - `non_numeric_input`
  - `delta_exceeds_tolerance`
  - `equals_mismatch`
  - `stale_commit_pin`
  - `no_evaluable_keys`
  - `other`

## Precedence Rule
Canonical authority is unchanged:
- canonical report -> decision ledger -> governance matrix -> summaries -> exploratory overlays.
External-work artifacts are overlays only and cannot override canonical outcomes.

## Determinism Rule
- fixed profile IDs and scenario pack references.
- stable key order and payload checksum.
- optional repeat-run parity check for enabled tracks.
