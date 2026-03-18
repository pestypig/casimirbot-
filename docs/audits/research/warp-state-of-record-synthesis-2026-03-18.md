# State-of-Record Synthesis (2026-03-18)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Result
- artifact_type: `state_of_record_synthesis/v1`
- commit_pin: `0dc5985b2ff02623e68be3c51019f32e641137a6`
- head_commit: `0dc5985b2ff02623e68be3c51019f32e641137a6`
- stale_against_head: `false`
- overall_status: `PARTIAL`
- checksum: `9277a668fe3ba9c103cadec549dd5eccb7eaa74925dd7046c64869b9ea435aea`

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

## External Comparison
- summary: `total=14, compatible=7, partial=5, inconclusive=2`
- stale_count: `0`
- source: `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json`

## Certification
- verdict: `PASS`
- firstFail: `null`
- traceId: `adapter:2c798dee-1ad3-4ae4-a1b0-eba7a7c9f719`
- runId: `32884`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`
- status: `GREEN`

## Blockers
| id | severity | code | detail |
| --- | --- | --- | --- |
| BLK-SOR-RDY-001 | HIGH | lane_reportable_blocked:sem_ellipsometry | missing_covariance_uncertainty_anchor,missing_paired_dual_instrument_run |

## Anchors
- proof_index: `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.json`
- capsule: `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
- integrity_parity: `artifacts/research/full-solve/integrity-parity-suite-latest.json`
- promotion_readiness: `artifacts/research/full-solve/promotion-readiness-suite-latest.json`
- external_matrix: `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json`
