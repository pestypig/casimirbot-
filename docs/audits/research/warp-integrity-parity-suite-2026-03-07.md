# Warp Integrity Parity Suite (2026-03-07)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Result
- artifact_type: `integrity_parity_suite/v1`
- commit_pin: `6450f41e802e97c5fed02ba097723c00cf49152e`
- checksum: `aa7a27a8d0db665366f89faad37d5097e69e0a560c95415224399b2b31d5ab9c`
- final_parity_verdict: `PASS`
- blocker_count: `0`

## Rubric
- canonical_decision_ok: `true`
- canonical_count_shape_ok: `true`
- geometry_baseline_ok: `true`
- mercury_observable_ok: `true`
- lensing_observable_ok: `true`
- frame_dragging_observable_ok: `true`
- shapiro_observable_ok: `true`
- external_stale_ok: `true`
- external_reason_taxonomy_ok: `true`
- capsule_validate_ok: `true`
- casimir_verify_ok: `true`

## Canonical Summary
- decision: `REDUCED_ORDER_ADMISSIBLE`
- counts: `PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`
- expected_counts: `PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`

## Geometry Baseline Checks
| check | status | test_file |
|---|---|---|
| metric_form_alignment | pass | tests/theory-checks.spec.ts |
| shift_mapping | pass | tests/warp-metric-adapter.spec.ts |
| york_time_sign_parity | pass | tests/york-time.spec.ts |
| natario_control_behavior | pass | tests/warpfield-cross-validation.spec.ts |
| metric_derived_t00_path | pass | tests/natario-metric-t00.spec.ts |

## Mercury Observable Parity
- compare_status: `compatible`
- signature_status: `pass`
- residual_arcsec_per_century: `-0.01932422774432041`
- tolerance_arcsec_per_century: `1`

## Lensing Observable Parity
- compare_status: `compatible`
- signature_status: `pass`
- historical_residual_arcsec: `-0.2304191779054463`
- historical_tolerance_arcsec: `0.5`
- gamma_residual: `-0.00019999999999997797`
- gamma_tolerance: `0.001`

## Frame-Dragging Observable Parity
- compare_status: `compatible`
- signature_status: `pass`
- gpb_residual_mas_per_year: `-2`
- gpb_tolerance_mas_per_year: `14.4`
- lageos_residual_ratio: `-0.010000000000000009`
- lageos_tolerance_ratio: `0.2`

## Shapiro Observable Parity
- compare_status: `compatible`
- signature_status: `pass`
- gamma_residual: `0.000021`
- gamma_tolerance: `0.00007`

## External Work Matrix
- total: `14`
- compatible: `7`
- partial: `5`
- inconclusive: `2`
- stale_count: `0`

| work_id | status | pass | fail | inconclusive | stale |
|---|---|---:|---:|---:|---|
| EXT-GR-FD-001 | compatible | 6 | 0 | 0 | false |
| EXT-GR-LENS-001 | compatible | 6 | 0 | 0 | false |
| EXT-GR-MERC-001 | compatible | 4 | 0 | 0 | false |
| EXT-GR-SHAP-001 | compatible | 4 | 0 | 0 | false |
| EXT-QCD-001 | compatible | 3 | 0 | 0 | false |
| EXT-TI-001 | compatible | 2 | 0 | 0 | false |
| EXT-WARP-ALC-001 | partial | 4 | 0 | 1 | false |
| EXT-WARP-ALC-E001 | partial | 3 | 0 | 2 | false |
| EXT-WARP-LEN-001 | inconclusive | 0 | 0 | 5 | false |
| EXT-WARP-LEN-E001 | partial | 1 | 0 | 4 | false |
| EXT-WARP-NAT-001 | compatible | 5 | 0 | 0 | false |
| EXT-WARP-NAT-E001 | partial | 2 | 0 | 3 | false |
| EXT-WARP-VDB-001 | inconclusive | 0 | 0 | 5 | false |
| EXT-WARP-VDB-E001 | partial | 1 | 0 | 4 | false |

## Casimir Certificate
- verdict: `PASS`
- firstFail: `null`
- traceId: `adapter:39d2706e-56fc-47c0-9796-f621faeb74cc`
- runId: `27652`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`
- status: `GREEN`

## Repeatability
- same_commit_prior_found: `true`
- matches_prior_checksum: `true`
- prior_checksum: `a73be134becf506762df08606d5a989f3c0c1f8f2a64e11c7fda5991650da49c`

## Executed Steps
| id | command | status |
|---|---|---|
| canonical_reconciliation | npm run warp:full-solve:canonical | pass |
| geometry_conformance | npm run warp:full-solve:geometry:conformance | pass |
| external_refresh | npm run warp:external:refresh | pass |
| mercury_external_run | npm run warp:external:run -- --work-id EXT-GR-MERC-001 | pass |
| mercury_external_compare | npm run warp:external:compare -- --work-id EXT-GR-MERC-001 | pass |
| lensing_external_run | npm run warp:external:run -- --work-id EXT-GR-LENS-001 | pass |
| lensing_external_compare | npm run warp:external:compare -- --work-id EXT-GR-LENS-001 | pass |
| frame_dragging_external_run | npm run warp:external:run -- --work-id EXT-GR-FD-001 | pass |
| frame_dragging_external_compare | npm run warp:external:compare -- --work-id EXT-GR-FD-001 | pass |
| shapiro_external_run | npm run warp:external:run -- --work-id EXT-GR-SHAP-001 | pass |
| shapiro_external_compare | npm run warp:external:compare -- --work-id EXT-GR-SHAP-001 | pass |
| external_matrix | npm run warp:external:matrix | pass |
| reference_capsule | npm run warp:full-solve:reference:capsule | pass |
| reference_capsule_validate | npm run warp:full-solve:reference:validate -- --capsule artifacts/research/full-solve/full-solve-reference-capsule-latest.json | pass |
| casimir_verify | npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --trace-out artifacts\training-trace.jsonl | pass |
| casimir_trace_export | GET http://127.0.0.1:5050/api/agi/training-trace/export -> artifacts/training-trace-export.jsonl | pass |

## Blockers
| code | path | detail |
|---|---|---|
| none | n/a | none |

