# ToE Scaling Scorecard

Use this scorecard to decide when Codex Cloud runs are reliable enough to scale multi-agent execution.

## ToE Progress Percentage

Track a weighted progress percentage across backlog tickets.

- `diagnostic` ticket with verified Casimir PASS/integrity OK contributes `0.25`.
- `reduced-order` ticket with verified Casimir PASS/integrity OK contributes `0.60`.
- `certified` ticket with verified Casimir PASS/integrity OK contributes `1.00`.
- Missing verification or integrity failure contributes `0.00`.

Formula:

- `toe_progress_pct = (sum(ticket_scores) / total_ticket_count) * 100`
- `strict_ready_progress_pct = (tickets with reduced-order/certified + PASS+integrity) / total_ticket_count * 100`

Compute snapshot:

- `npx tsx scripts/compute-toe-progress.ts`
- Snapshot output: `docs/audits/toe-progress-snapshot.json`

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

| Date (UTC) | Ticket | Commit | Contract | Required tests | Casimir adapter | Integrity | Claim tier | Scope drift | Repeat stability | ToE % after run | Scale decision | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-02-17 | TOE-001-curvature-stress-bridge | e91f803d | PASS | PASS (`tests/stress-energy-units.spec.ts`, `tests/physics-contract.gate0.spec.ts`) | PASS (`run_id=17905`) | PASS | reduced-order | NO | PASS (repeatable local reruns) | 6.0 | HOLD (need 2 more consecutive pass runs) | Ticket result artifact added and validated. |
| 2026-02-17 | TOE-002-semiclassical-coupling-contract | c605cd5e | PASS | PASS (`tests/gr-constraint-contract.spec.ts`, `tests/gr-constraint-gate.spec.ts`) | PASS (`run_id=18170` local reproduction) | PASS | diagnostic | NO | PASS (tests + adapter verify reproduced) | 8.5 | HOLD (need 1 more consecutive full-gate pass) | Implementation quality good; keep claim tier diagnostic pending stronger trace metadata in artifact. |
| 2026-02-17 | TOE-003-quantum-provenance-class | 5a12eff8 | PASS | PASS (`tests/warp-viability.spec.ts`, `tests/qi-guardrail.spec.ts`, `tests/pipeline-ts-qi-guard.spec.ts`) | PASS (`run_id=toe-003-quantum-provenance-class`) | PASS | diagnostic | NO | PASS (tests + verification reproduced) | 11.0 | SCALE +1 (pilot) | Ticket result artifact is valid, contributes to weighted ToE proof progression, and adapter-backed verify replay is reproducible (`run_id=18172`). |

## Daily Summary (2026-02-17)

- Date: 2026-02-17
- Runs completed: 3
- Full-gate passes: 3
- Scope-drift incidents: 0
- Adapter-fallback incidents: 0
- ToE progress %: 11.0
- Strict-ready progress %: 10.0
- Rolling pass rate (last 10 runs): 100% (3/3 observed)
- Reviewer count: not recorded in current audit artifacts
- Active agents: not set (policy baseline is `2 x active reviewers`)
- Decision for next day: `scale +1` (pilot)

## Daily Summary Template

- Date:
- Runs completed:
- Full-gate passes:
- Scope-drift incidents:
- Adapter-fallback incidents:
- ToE progress %:
- Strict-ready progress %:
- Rolling pass rate (last 10 runs):
- Reviewer count:
- Active agents:
- Decision for next day: `hold` or `scale +N`
