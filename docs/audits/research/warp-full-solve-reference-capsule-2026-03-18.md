# Full-Solve Reference Capsule (2026-03-18)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Identity
- artifact_type: `full_solve_reference_capsule/v1`
- generator_version: `1.3.0`
- commit_pin: `7e8cc8952db5649e54d797a3786bd85e3fb0e96b`
- checksum: `d1181f7ed42239abc3ba2c163e45a58988941436d9f5cca0896c4d3345f76414`
- blocked: `false`

## Canonical State
- decision: `REDUCED_ORDER_ADMISSIBLE`
- counts: `PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`
- strong_claim_pass_all: `true`

## Certification
- trace_id: `adapter:5e1b55a9-971b-4145-8045-1fa1cfe4efec`
- run_id: `32887`
- certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrity_ok: `true`
- status: `GREEN`

## Geometry Conformance
| check | status | test_file |
|---|---|---|
| metric_form_alignment | pass | tests/theory-checks.spec.ts |
| shift_mapping | pass | tests/warp-metric-adapter.spec.ts |
| york_time_sign_parity | pass | tests/york-time.spec.ts |
| natario_control_behavior | pass | tests/warpfield-cross-validation.spec.ts |
| metric_derived_t00_path | pass | tests/natario-metric-t00.spec.ts |

## Energetics/QEI Baseline
| key | status | reason_code |
|---|---|---|
| negative_energy_branch_policy | pass | negative_energy_branch_allowed_under_qei_gate |
| qei_worldline_requirement | pass | worldline_qei_required_for_gate_admissibility |
| stress_source_contract | pass | metric_derived_stress_lane_verified |
| assumption_domain_disclosure | pass | assumption_domain_must_be_explicit_for_external_comparison |
| physical_feasibility_boundary | pass | non_feasibility_boundary_is_explicit |

## GR Observable Baseline
- mercury_perihelion_status: `pass`
- predicted_arcsec_per_century: `42.98067577225568`
- observed_arcsec_per_century: `43`
- residual_arcsec_per_century: `-0.01932422774432041`
- tolerance_arcsec_per_century: `1`
- lensing_deflection_status: `pass`
- lensing_predicted_limb_arcsec: `1.7495808220945537`
- lensing_historical_residual_arcsec: `-0.2304191779054463`
- lensing_modern_gamma_residual: `-0.00019999999999997797`
- frame_dragging_status: `pass`
- frame_dragging_gpb_residual_mas_per_year: `-2`
- frame_dragging_lageos_residual_ratio: `-0.010000000000000009`
- shapiro_delay_status: `pass`
- shapiro_gamma_minus_one: `0.000021`
- shapiro_gamma_residual: `0.000021`
- source_snapshot_paths: `{"mercury_perihelion":"docs/specs/data/gr-mercury-perihelion-einstein-1915.v1.json","lensing_deflection":"docs/specs/data/gr-lensing-deflection-observable.v1.json","frame_dragging":"docs/specs/data/gr-frame-dragging-observable.v1.json","shapiro_delay":"docs/specs/data/gr-shapiro-delay-observable.v1.json"}`

## Evidence Lanes (C/I/U)
| lane | typed | reportable |
|---|---|---|
| casimir_sign_control | 6 / 9 / 3 | 6 / 9 / 3 |
| q_spoiling | 5 / 24 / 25 | 5 / 24 / 25 |
| nanogap | 5 / 5 / 0 | 5 / 5 / 0 |
| timing | 9 / 2 / 1 | 9 / 2 / 1 |
| sem_ellipsometry | 0 / 0 / 2 | 0 / 0 / 18 |
| qcd_analog | 0 / 0 / 0 | 0 / 0 / 0 |

## External Work Comparison
- matrix_path: `artifacts/research/full-solve/external-work/external-work-comparison-matrix-2026-03-18.json`
- total: `14`
- compatible: `7`
- partial: `5`
- inconclusive: `2`
- stale_count: `0`
- reduced_reason_counts: `non_comparable_or_unknown=24`

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

## Blockers
| id | severity | path | reason |
|---|---|---|---|
| none | n/a | n/a | none |

