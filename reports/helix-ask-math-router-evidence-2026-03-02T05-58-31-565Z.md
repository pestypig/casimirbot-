# Helix Ask Math Router Evidence (2026-03-02T05-58-31-565Z)

- Run label: `baseline-local`
- Battery: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\scripts\helix-ask-math-router-battery.json`
- Base URL: `http://127.0.0.1:5173`
- Started: `2026-03-02T05:58:31.564Z`
- Finished: `2026-03-02T05:59:22.130Z`
- Artifacts: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-math-router-evidence\2026-03-02T05-58-31-565Z`

## Scorecard

- Total: **11**
- Pass: **4**
- Fail: **7**
- Deterministic forced-math rate: **50.0%**
- Deterministic math-solver-ok rate: **50.0%**
- Deterministic silent bypass count: **3**
- Warp-guard coverage: **0.0%**

## By Class

| Class | Total | Pass |
| --- | ---: | ---: |
| deterministic_compute | 6 | 1 |
| generic_reasoning | 3 | 3 |
| warp_certificate_required | 2 | 0 |

## Math Reason Histogram

- `none`: 8
- `js_solver`: 3

## Top Failures

- `sym_det_literal` (deterministic_compute) failed 4 check(s): math_solver_ok, math_solver_reason_in, forced_math_path, answer_includes
- `sym_det_matrix_call` (deterministic_compute) failed 4 check(s): math_solver_ok, math_solver_reason_in, forced_math_path, answer_includes
- `warp_viability_guard` (warp_certificate_required) failed 4 check(s): math_solver_reason_eq, forced_math_path, answer_includes, answer_includes
- `warp_certificate_guard` (warp_certificate_required) failed 4 check(s): math_solver_reason_eq, forced_math_path, answer_includes, answer_includes
- `sym_derivative_e_symbol` (deterministic_compute) failed 1 check(s): math_solver_reason_in
- `numeric_eval_simple` (deterministic_compute) failed 1 check(s): answer_includes
- `numeric_det_shape_only` (deterministic_compute) failed 1 check(s): math_solver_reason_eq

## Case Snapshot

- `sym_det_literal` [deterministic_compute] pass=false status=200 latencyMs=3589 reason=`none` forcedMath=false
- `sym_det_matrix_call` [deterministic_compute] pass=false status=200 latencyMs=6708 reason=`none` forcedMath=false
- `sym_derivative_e_symbol` [deterministic_compute] pass=false status=200 latencyMs=3827 reason=`js_solver` forcedMath=true
- `algebra_solve_linear` [deterministic_compute] pass=true status=200 latencyMs=11904 reason=`js_solver` forcedMath=true
- `numeric_eval_simple` [deterministic_compute] pass=false status=200 latencyMs=8124 reason=`js_solver` forcedMath=true
- `numeric_det_shape_only` [deterministic_compute] pass=false status=200 latencyMs=3895 reason=`none` forcedMath=false
- `generic_natario_explain` [generic_reasoning] pass=true status=200 latencyMs=1125 reason=`none` forcedMath=false
- `generic_repo_pipeline` [generic_reasoning] pass=true status=200 latencyMs=1385 reason=`none` forcedMath=false
- `generic_open_world_safety` [generic_reasoning] pass=true status=200 latencyMs=860 reason=`none` forcedMath=false
- `warp_viability_guard` [warp_certificate_required] pass=false status=200 latencyMs=1368 reason=`none` forcedMath=false
- `warp_certificate_guard` [warp_certificate_required] pass=false status=200 latencyMs=5213 reason=`none` forcedMath=false

## Next Tuning Targets

1. Reduce deterministic silent bypass count to 0.
2. Keep warp-guard coverage at 100% for certificate-required prompts.
3. Validate deterministic path before any single-pipeline migration.
