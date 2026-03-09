# Promotion Readiness Suite Contract v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Define a deterministic, commit-pinned bridge artifact between integrity-parity status and stronger claim-readiness reporting.

## Artifact Type
- `promotion_readiness_suite/v1`

## Command
- `npm run warp:promotion:readiness:check`

## Required Inputs
1. `artifacts/research/full-solve/integrity-parity-suite-latest.json`
2. `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
3. `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json`
4. Reportable lane packs/checks for:
   - `q_spoiling`
   - `timing`
   - `sem_ellipsometry`

## Required Fields
1. `artifact_type`
2. `generator_version`
3. `commit_pin`
4. `boundary_statement`
5. `canonical` (decision + counts)
6. `geometry` (`required_checks`, `pass_count`, `required_count`, `all_pass`)
7. `gr_observable_compatibility` (`mercury`, `lensing`, `frame_dragging`, `shapiro`)
8. `lane_reportable_coverage`
9. `blocker_taxonomy`
10. `casimir` certificate block
11. `rubric` pass flags
12. `blockers`
13. `final_readiness_verdict`
14. `readiness_gate_pass`
15. `normalized_checksum`
16. `checksum`

## Lane Checker Minimum Contract
For reportable profile decisions, lane checker outputs must include:
1. `reportableReady`
2. `blockedReasons`
3. `evidenceCongruence`
4. `summary.reducedReasonCounts`

## Precedence Rule
Canonical interpretation is preserved:
- canonical report -> decision ledger -> governance matrix -> summaries -> exploratory overlays.

Readiness artifacts are reporting overlays and must not override canonical decisions.

## Determinism
1. Dated JSON + MD outputs must be generated.
2. Latest aliases must be updated:
   - `artifacts/research/full-solve/promotion-readiness-suite-latest.json`
   - `docs/audits/research/warp-promotion-readiness-suite-latest.md`
3. Same commit rerun must preserve normalized checksum (timestamps excluded from checksum set).

## Fail-Closed Rules
1. Missing required input artifacts -> blocker.
2. Contract mismatch (`reportableReady=true` with non-empty blocked reasons) -> blocker.
3. Casimir verification non-pass or integrity failure -> blocker.
4. Non-comparable lanes remain explicit via blocked reason codes; never coerced into PASS.

## Traceability
- owner: `research-governance`
- status: `draft_v1`
- dependency_mode: `reference_only`
