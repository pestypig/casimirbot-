# Helix Ask Math Router Evidence (2026-03-03T07-56-51-275Z)

- Run label: `baseline-local`
- Battery: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\scripts\helix-ask-math-router-battery.json`
- Base URL: `http://127.0.0.1:5050`
- Started: `2026-03-03T07:56:51.274Z`
- Finished: `2026-03-03T07:57:36.660Z`
- Artifacts: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-math-router-evidence\2026-03-03T07-56-51-275Z`

## Scorecard

- Total: **11**
- Pass: **11**
- Fail: **0**
- Deterministic forced-math rate: **83.3%**
- Deterministic math-solver-ok rate: **83.3%**
- Deterministic silent bypass count: **0**
- Warp-guard coverage: **100.0%**

## By Class

| Class | Total | Pass |
| --- | ---: | ---: |
| deterministic_compute | 6 | 6 |
| generic_reasoning | 3 | 3 |
| warp_certificate_required | 2 | 2 |

## Math Reason Histogram

- `none`: 3
- `symbolic_lane:determinant`: 2
- `js_solver`: 2
- `warp_delegation_required`: 2
- `symbolic_lane:derivative`: 1
- `matrix_entries_required`: 1

## Top Failures

- none

## Case Snapshot

- `sym_det_literal` [deterministic_compute] pass=true status=200 latencyMs=3796 reason=`symbolic_lane:determinant` forcedMath=true
- `sym_det_matrix_call` [deterministic_compute] pass=true status=200 latencyMs=7061 reason=`symbolic_lane:determinant` forcedMath=true
- `sym_derivative_e_symbol` [deterministic_compute] pass=true status=200 latencyMs=4368 reason=`symbolic_lane:derivative` forcedMath=true
- `algebra_solve_linear` [deterministic_compute] pass=true status=200 latencyMs=10101 reason=`js_solver` forcedMath=true
- `numeric_eval_simple` [deterministic_compute] pass=true status=200 latencyMs=6331 reason=`js_solver` forcedMath=true
- `numeric_det_shape_only` [deterministic_compute] pass=true status=200 latencyMs=3979 reason=`matrix_entries_required` forcedMath=false
- `generic_natario_explain` [generic_reasoning] pass=true status=200 latencyMs=877 reason=`none` forcedMath=false
- `generic_repo_pipeline` [generic_reasoning] pass=true status=200 latencyMs=1346 reason=`none` forcedMath=false
- `generic_open_world_safety` [generic_reasoning] pass=true status=200 latencyMs=1127 reason=`none` forcedMath=false
- `warp_viability_guard` [warp_certificate_required] pass=true status=200 latencyMs=1690 reason=`warp_delegation_required` forcedMath=true
- `warp_certificate_guard` [warp_certificate_required] pass=true status=200 latencyMs=108 reason=`warp_delegation_required` forcedMath=true

## Next Tuning Targets

1. Reduce deterministic silent bypass count to 0.
2. Keep warp-guard coverage at 100% for certificate-required prompts.
3. Validate deterministic path before any single-pipeline migration.
