# Needle Hull Mark 2 Theory Directory (latest)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Identity
- artifact_type: `needle_hull_mark2_theory_directory/v1`
- theory_slug: `needle-hull-mark2`
- generated_at_utc: `2026-03-18T06:36:22.091Z`
- commit_pin: `35eb6be9c6b8add1bc73af4771633090aa0af3de`
- source_config: `configs/warp-needle-hull-mark2-theory-directory.v1.json`

## Entry Points
- root_directory: `docs/audits/research/needle-hull-mark2`
- latest_json: `docs/audits/research/needle-hull-mark2/theory-directory-latest.json`
- latest_md: `docs/audits/research/needle-hull-mark2/theory-directory-latest.md`
- dated_json: `docs/audits/research/needle-hull-mark2/theory-directory-2026-03-18.json`
- dated_md: `docs/audits/research/needle-hull-mark2/theory-directory-2026-03-18.md`

## Summary
- overall_status: `READY`
- required_missing: `0/22`
- optional_missing: `0/0`

## Sections
### entrypoints
- [required/present] `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`
- [required/present] `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.json`
- [required/present] `docs/audits/research/warp-state-of-record-synthesis-latest.md`
- [required/present] `artifacts/research/full-solve/state-of-record-synthesis-latest.json`

### canonical_authority
- [required/present] `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`
- [required/present] `artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json`
- [required/present] `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- [required/present] `docs/audits/research/warp-evidence-snapshot-2026-03-02.md`

### parity_and_readiness
- [required/present] `docs/audits/research/warp-full-solve-reference-capsule-latest.md`
- [required/present] `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
- [required/present] `docs/audits/research/warp-integrity-parity-suite-latest.md`
- [required/present] `artifacts/research/full-solve/integrity-parity-suite-latest.json`
- [required/present] `docs/audits/research/warp-promotion-readiness-suite-latest.md`
- [required/present] `artifacts/research/full-solve/promotion-readiness-suite-latest.json`

### external_comparison
- [required/present] `docs/audits/research/warp-external-work-comparison-matrix-latest.md`
- [required/present] `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json`

### evidence_and_provenance
- [required/present] `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md`
- [required/present] `docs/specs/casimir-tile-paper-equation-trace-2026-03-04.md`
- [required/present] `docs/specs/casimir-tile-spec-bookkeeping-v1.md`
- [required/present] `docs/specs/casimir-tile-experimental-data-staging-ledger-v1.md`

### paper_generation
- [required/present] `docs/audits/research/warp-paper-draft-A-defensible-now.md`
- [required/present] `docs/audits/research/warp-paper-draft-B-strong-claim-upgrade-spec.md`

## Regeneration Commands
1. `npm run warp:proof-index:sync`
2. `npm run warp:state-of-record:synthesis`
3. `npm run warp:needle-hull:directory:sync`
4. `npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl`
5. `curl.exe -fsS http://127.0.0.1:5050/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl`
