# Awaitable task association at session and admission boundaries

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission. Component and broker transaction evidence.

The session verification port now accepts either synchronous legacy checks or
asynchronous durable checks. Session readiness, bound evidence, goal recovery,
Ready up, browser preparation and temporal preflight await each existing check.
Browser target resolution is also awaitable. Temporal admission awaits its final
check before calling the broker, and the broker awaits both checks around retained
admission. A rejected promise cannot be mistaken for successful authorization.

The existing authenticated identity checks and action authority policies remain
in their respective services. This change adds no human consent endpoint, new
effects or gameplay authority. The repository-backed durable checker is not yet
supplied to these ports in production.

Verification:

```text
npx vitest run server/services/environment-connectors/session/__tests__/bound-session-evidence.test.ts server/services/environment-connectors/session/__tests__/session-readiness.test.ts server/services/environment-connectors/session/__tests__/ready-up-session.test.ts server/services/environment-connectors/session/__tests__/recover-session-goal.test.ts server/services/environment-connectors/session/__tests__/prepare-browser-session.test.ts server/services/environment-connectors/temporal-plans/__tests__/temporal-plan-preflight.test.ts server/services/environment-connectors/temporal-plans/__tests__/temporal-plan-admission.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
106 tests passed
npx vitest run server/services/environment-connectors/actions/__tests__/action-admission-transaction.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
8 tests passed
```

New regressions hold the first authorization promise pending and verify that
perception has not started, then reject after perception; another rejects before
the action broker. The overlapping real pg-mem broker case now rejects one
binding asynchronously after retention while the other publishes independently.
This is deterministic fixture evidence, not PostgreSQL concurrency qualification
or performed environment effects.

The preceding 101-test full-discipline pass predates this increment. Its result
must not be represented as covering these later await changes; broader validation
remains part of the pending durable runtime integration. No EXE was rebuilt or
launched. Original CS1-CS4 and the final CS5 handoff remain incomplete; ET6 is
unpassed and this goal does not dispatch the independent NAV-EQ lane.
