# Warp Deliverable Dossier (2026-03-19)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Result
- artifact_type: `warp_deliverable_dossier/v1`
- commit_pin: `e07f027f3181b7884498c4262cb6bad92085acc6`
- final_deliverable_status: `PARTIAL`
- checksum: `df7695f029066049eaa15d450e645bd86fd8204264e5e944fc69d20f8d8642f8`

## Canonical
- decision: `REDUCED_ORDER_ADMISSIBLE`
- counts: `PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`

## Integrity + Readiness
- integrity_final_parity_verdict: `PASS`
- integrity_blocker_count: `0`
- readiness_final_verdict: `PARTIAL`
- readiness_gate_pass: `false`

## Casimir Certificate
- verdict: `PASS`
- firstFail: `null`
- traceId: `adapter:26a9c21e-b8ef-4ef2-9c7b-06e8c940ed8c`
- runId: `32889`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`
- status: `GREEN`

## Lane Coverage
| lane | reportable_ready | congruent | incongruent | unknown | blocked_reasons |
|---|---|---:|---:|---:|---|
| q_spoiling | true | 5 | 24 | 25 | none |
| timing | true | 9 | 2 | 1 | none |
| sem_ellipsometry | false | 0 | 0 | 18 | missing_covariance_uncertainty_anchor, missing_paired_dual_instrument_run |

## External Matrix
- total: `14`
- compatible: `7`
- partial: `5`
- inconclusive: `2`
- stale_count: `0`

## Repeatability
- same_commit_prior_found: `true`
- comparable_prior: `true`
- matches_prior_checksum: `false`
- prior_checksum: `41d09a385c4e09f5ab07649604ebeaeee298900972c3c2bfd1cf264948a66f75`

## Executed Steps
| id | command | status |
|---|---|---|
| none | n/a | unknown |

## Blockers
| code | category | path | detail |
|---|---|---|---|
| readiness_gate_not_pass | readiness | artifacts/research/full-solve/promotion-readiness-suite-latest.json | readiness_gate_pass=false final_readiness_verdict=PARTIAL |
| repeatability_checksum_mismatch | repeatability | artifacts/research/full-solve/warp-deliverable-dossier-latest.json | prior=41d09a385c4e09f5ab07649604ebeaeee298900972c3c2bfd1cf264948a66f75 new=fb69143087d386651028943b388638dbe3b2b0679096cf4e2c823a702e042d35 |

