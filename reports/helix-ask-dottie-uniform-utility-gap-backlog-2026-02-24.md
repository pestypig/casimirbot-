# Helix Ask x Dottie Uniform Utility Gap Backlog (2026-02-24)

## Prioritized backlog
| Priority | Work item | Owner | Risk | Acceptance test |
|---|---|---|---|---|
| P0 | Wire end-to-end certainty parity checker into mission-overwatch runtime emit path | Mission-overwatch | Medium | `tests/helix-dottie-certainty-parity.spec.ts` + runtime regression with replay |
| P0 | Enforce deterministic overload reason labels on all `/api/agi/*` write routes | API platform | Medium | `tests/agi-admission-control.spec.ts` and contract snapshots |
| P1 | Add timer-to-debrief closure metrics and dashboards | Observability | Low | metric assertions in integration tests and trace export check |
| P1 | Persist explicit ack linkage key (not overloaded evidence refs) | Mission board | Medium | route tests for `ackRefId` + replay consistency |
| P2 | Harden callout template static validation in CI docs gate | Docs tooling | Low | markdown/schema validation pass in CI |

## Kill criteria / rollback triggers
- Kill rollout if voice emits certainty higher than text in replay sample.
- Roll back if overload middleware causes >2% false-positive 429 at baseline traffic.
- Roll back timer callout policy if >5% of timer updates produce missing linkage in debrief rows.

## KPI instrumentation plan
- **Parity KPI:** `voice_certainty_gt_text_certainty_count == 0`
- **Noise KPI:** `mission_suppression_rate_by_reason` trend, especially `dedupe_cooldown` and `mission_rate_limited`
- **Latency KPI:**
  - `/api/mission-board/:id` p95 < 250ms
  - `/api/mission-board/:id/events` p95 < 250ms
  - `trigger_to_debrief_closed_ms` p95 target < 60s
