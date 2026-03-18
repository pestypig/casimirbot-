# State-of-Record Synthesis (2026-03-18)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Result
- artifact_type: `state_of_record_synthesis/v1`
- commit_pin: `7e8cc8952db5649e54d797a3786bd85e3fb0e96b`
- head_commit: `35eb6be9c6b8add1bc73af4771633090aa0af3de`
- stale_against_head: `true`
- overall_status: `PARTIAL`
- checksum: `5a8ab14cb974213eaae784208b5c60530c8ed55f6f92f80a7ad5083c4eef8c46`

## Canonical
- decision: `REDUCED_ORDER_ADMISSIBLE`
- counts: `PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`
- source: `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`

## Integrity Parity
- verdict: `PASS`
- blocker_count: `0`
- source: `artifacts/research/full-solve/integrity-parity-suite-latest.json`

## Geometry + GR Observable Parity
- geometry_all_pass: `true` (`5/5`)
- mercury: `pass`
- lensing: `pass`
- frame_dragging: `pass`
- shapiro: `pass`

## Promotion Readiness
- verdict: `PARTIAL`
- readiness_gate_pass: `false`
- lane_count: `3`
- reportable_ready_count: `2`
- blocked_count: `1`
- source: `artifacts/research/full-solve/promotion-readiness-suite-latest.json`

| lane | reportableReady | congruent | incongruent | unknown | blockedReasons |
| --- | --- | ---: | ---: | ---: | --- |
| q_spoiling | true | 5 | 24 | 25 | none |
| timing | true | 9 | 2 | 1 | none |
| sem_ellipsometry | false | 0 | 0 | 18 | missing_covariance_uncertainty_anchor, missing_paired_dual_instrument_run |

## SE Publication Overlay
- available: `true`
- reportable_unlock: `false`
- run_summary: `scenarioCount=6, compatible=6, partial=0, incompatible=0, error=0`
- congruence_summary: `congruent=2, incongruent=0, unknown=4`
- blocked_reasons: `publication_cross_study_not_paired_instrument_design, reportable_unlock_reserved_for_instrument_export_paired_runs`
- source: `artifacts/research/full-solve/se-publication-overlay-latest.json`

## External Comparison
- summary: `total=14, compatible=7, partial=5, inconclusive=2`
- stale_count: `0`
- source: `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json`

## Certification
- verdict: `PASS`
- firstFail: `null`
- traceId: `adapter:9fe67bc2-a830-4d4f-9b16-1753063d3734`
- runId: `32888`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`
- status: `GREEN`

## Blockers
| id | severity | code | detail |
| --- | --- | --- | --- |
| BLK-SOR-001 | MEDIUM | artifact_commit_pin_stale_vs_head | artifact commit_pin=7e8cc8952db5649e54d797a3786bd85e3fb0e96b differs from current HEAD=35eb6be9c6b8add1bc73af4771633090aa0af3de |
| BLK-SOR-RDY-002 | HIGH | lane_reportable_blocked:sem_ellipsometry | missing_covariance_uncertainty_anchor,missing_paired_dual_instrument_run |

## Anchors
- proof_index: `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.json`
- capsule: `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
- integrity_parity: `artifacts/research/full-solve/integrity-parity-suite-latest.json`
- promotion_readiness: `artifacts/research/full-solve/promotion-readiness-suite-latest.json`
- external_matrix: `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json`
