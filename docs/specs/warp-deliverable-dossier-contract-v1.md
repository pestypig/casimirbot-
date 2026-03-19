# Warp Deliverable Dossier Contract v1

## Purpose
Defines the commit-pinned, reproducible deliverable artifact for Needle Hull Mark 2 state-of-record packaging.

Boundary statement (required):

`This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.`

## Command

`npm run warp:deliverable:build`

Optional local packaging-only mode (skip rerunning readiness chain):

`npm run warp:deliverable:build -- --skip-readiness-chain`

## Outputs

- Dated JSON: `artifacts/research/full-solve/warp-deliverable-dossier-YYYY-MM-DD.json`
- Dated Markdown: `docs/audits/research/warp-deliverable-dossier-YYYY-MM-DD.md`
- Latest JSON alias: `artifacts/research/full-solve/warp-deliverable-dossier-latest.json`
- Latest Markdown alias: `docs/audits/research/warp-deliverable-dossier-latest.md`

## Required payload keys

- `artifact_type` = `warp_deliverable_dossier/v1`
- `generator_version`
- `generated_on`
- `generated_at`
- `commit_pin`
- `boundary_statement`
- `canonical`
- `integrity`
- `readiness`
- `lane_reportable_coverage`
- `external_work`
- `certification`
- `anchors`
- `steps`
- `blockers`
- `blocker_count`
- `final_deliverable_status` (`PASS | PARTIAL | FAIL`)
- `repeatability`
- `normalized_checksum`
- `checksum`

## Status policy

- `FAIL`:
  - missing required source artifacts,
  - integrity suite not `PASS`,
  - certificate not `PASS` + `integrityOk=true` + hash present,
  - external stale count non-zero.
- `PARTIAL`:
  - hard failure absent, but readiness gate not passed.
- `PASS`:
  - all fail conditions absent and readiness gate passed.

## Non-blocking posture

This dossier is reporting and traceability packaging only. It does not alter canonical solver thresholds or promotion policy by itself.

