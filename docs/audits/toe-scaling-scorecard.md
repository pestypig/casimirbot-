# ToE Scaling Scorecard

Use this scorecard to decide when Codex Cloud runs are reliable enough to scale multi-agent execution.

## Scale Decision Gate

A run is eligible for scaling only when all are true:

1. Contract pass:
   - Ticket result JSON validates.
   - `files_changed` stays inside ticket `allowed_paths`.
   - `tests_run` includes all `required_tests`.
2. Verification pass:
   - Adapter-backed Casimir verify is used (no `--ci` fallback).
   - `casimir.verdict=PASS` and `casimir.integrity_ok=true`.
3. Stability pass:
   - Same ticket can pass on repeat run without scope drift.
4. Merge quality pass:
   - No manual cleanup needed to satisfy contract validators.

Scale rule:

- Start parallelization only after 3 consecutive runs are `PASS` across all gate columns.
- Initial agent cap: `active_agents = 2 x active reviewers`.
- Increase by +1 agent/day only if rolling pass rate remains >= 90% and scope drift is 0.

Stop-scaling triggers:

- Any out-of-scope file change.
- Missing ticket result artifact for ticket-scoped PR.
- Adapter verify replaced by local fallback.
- Repeated nondeterministic failures on the same ticket.

## Run Log

| Date (UTC) | Ticket | Commit | Contract | Required tests | Casimir adapter | Integrity | Claim tier | Scope drift | Repeat stability | Scale decision | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-02-17 | TOE-001-curvature-stress-bridge | e91f803d | PASS | PASS (`tests/stress-energy-units.spec.ts`, `tests/physics-contract.gate0.spec.ts`) | PASS (`run_id=17905`) | PASS | reduced-order | NO | PASS (repeatable local reruns) | HOLD (need 2 more consecutive pass runs) | Ticket result artifact added and validated. |

## Daily Summary Template

- Date:
- Runs completed:
- Full-gate passes:
- Scope-drift incidents:
- Adapter-fallback incidents:
- Rolling pass rate (last 10 runs):
- Reviewer count:
- Active agents:
- Decision for next day: `hold` or `scale +N`
