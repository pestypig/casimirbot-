# Helix Ask Math Router Evidence (2026-03-02T06-00-19-483Z)

- Run label: `baseline-local`
- Battery: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\scripts\helix-ask-math-router-battery.json`
- Base URL: `http://127.0.0.1:5180`
- Started: `2026-03-02T06:00:19.482Z`
- Finished: `2026-03-02T06:01:10.458Z`
- Artifacts: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-math-router-evidence\2026-03-02T06-00-19-483Z`

## Scorecard

- Total: **11**
- Pass: **6**
- Fail: **5**
- Deterministic forced-math rate: **83.3%**
- Deterministic math-solver-ok rate: **83.3%**
- Deterministic silent bypass count: **0**
- Warp-guard coverage: **50.0%**

## By Class

| Class | Total | Pass |
| --- | ---: | ---: |
| deterministic_compute | 6 | 3 |
| generic_reasoning | 3 | 3 |
| warp_certificate_required | 2 | 0 |

## Math Reason Histogram

- `none`: 3
- `symbolic_lane:determinant`: 2
- `js_solver`: 2
- `warp_delegation_required`: 2
- `symbolic_lane:derivative`: 1
- `matrix_entries_required`: 1

## Top Failures

- `warp_certificate_guard` (warp_certificate_required) failed 3 check(s): forced_math_path, answer_includes, answer_includes
- `warp_viability_guard` (warp_certificate_required) failed 2 check(s): answer_includes, answer_includes
- `sym_det_literal` (deterministic_compute) failed 1 check(s): answer_includes
- `sym_det_matrix_call` (deterministic_compute) failed 1 check(s): answer_includes
- `numeric_eval_simple` (deterministic_compute) failed 1 check(s): answer_includes

## Case Snapshot

- `sym_det_literal` [deterministic_compute] pass=false status=200 latencyMs=4712 reason=`symbolic_lane:determinant` forcedMath=true
- `sym_det_matrix_call` [deterministic_compute] pass=false status=200 latencyMs=8247 reason=`symbolic_lane:determinant` forcedMath=true
- `sym_derivative_e_symbol` [deterministic_compute] pass=true status=200 latencyMs=4873 reason=`symbolic_lane:derivative` forcedMath=true
- `algebra_solve_linear` [deterministic_compute] pass=true status=200 latencyMs=9709 reason=`js_solver` forcedMath=true
- `numeric_eval_simple` [deterministic_compute] pass=false status=200 latencyMs=6818 reason=`js_solver` forcedMath=true
- `numeric_det_shape_only` [deterministic_compute] pass=true status=200 latencyMs=4021 reason=`matrix_entries_required` forcedMath=false
- `generic_natario_explain` [generic_reasoning] pass=true status=200 latencyMs=1151 reason=`none` forcedMath=false
- `generic_repo_pipeline` [generic_reasoning] pass=true status=200 latencyMs=1420 reason=`none` forcedMath=false
- `generic_open_world_safety` [generic_reasoning] pass=true status=200 latencyMs=899 reason=`none` forcedMath=false
- `warp_viability_guard` [warp_certificate_required] pass=false status=200 latencyMs=1379 reason=`warp_delegation_required` forcedMath=true
- `warp_certificate_guard` [warp_certificate_required] pass=false status=200 latencyMs=5185 reason=`warp_delegation_required` forcedMath=false

## Next Tuning Targets

1. Reduce deterministic silent bypass count to 0.
2. Keep warp-guard coverage at 100% for certificate-required prompts.
3. Validate deterministic path before any single-pipeline migration.
