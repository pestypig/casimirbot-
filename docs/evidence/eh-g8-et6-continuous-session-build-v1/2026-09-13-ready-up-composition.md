# CS1 Ready up composition and requirement evidence

Classification: test harness and evidence normalization. Supplement to the
[CS5 inventory](2026-09-13-owner-recovery-cs5-reconciliation.md).

The existing five-suite battery passed 112 tests, with no failures or skips:

| Suite | Tests | Scope |
| --- | ---: | --- |
| shared readiness projection | 28 | Layer ordering, freshness, deadlines and non-authority projection |
| readiness collector | 28 | Exact selectors, independent source/subject/authority/controller/goal/perception checks |
| Ready up orchestration | 12 | Repeated healthy calls, bounded subject/goal recovery, typed conflicts and repair facts |
| browser session preparation | 31 | Shared setup entry, explicit goal bootstrap, authenticated task/run checks, probe acquisition and final expiry/revocation checks |
| goal recovery | 13 | Exact recovery evidence, revision and consent-preserving recovery paths |

```text
npx vitest run shared/__tests__/helix-environment-session-readiness.spec.ts server/services/environment-connectors/session/__tests__/session-readiness.test.ts server/services/environment-connectors/session/__tests__/ready-up-session.test.ts server/services/environment-connectors/session/__tests__/prepare-browser-session.test.ts server/services/environment-connectors/session/__tests__/recover-session-goal.test.ts --pool=forks --maxWorkers=1 --minWorkers=1 --reporter=json
```

A new collector-suite composition test then connected the real
`readyUpEnvironmentSession` orchestrator to `readEnvironmentSessionReadiness`,
instead of providing the orchestrator with a mocked ready boolean. Three
sequential calls must return identical projections, preserve input selectors
and authority data, collect goal/perception twice per call, and invoke neither
subject refresh nor goal recovery. Expiring the same authority then produces
an authority blocker requiring human approval, without a repair or renewal.

The expanded collector suite passed all 29 tests:

```text
npx vitest run server/services/environment-connectors/session/__tests__/session-readiness.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

This adds one new case; the 28 original collector cases overlap the preceding
battery and must not be counted twice as independent coverage. No production
source changed.

Underlying membership, binding, device, subject, controller, goal and perception
readers are injected fixtures. This verifies collector/orchestrator composition
and repeated-read policy, not a real database/connector/probe workflow. It does
not establish UI/MCP revision agreement, zero rotations across actual durable
rows, current authenticated presence, real goal recovery or genuine approval.
Those CS1.1–CS1.5 exits remain incomplete in the handoff.

The running package, external MCP boundary and ordinary signed-out account are
unchanged. All CS1–CS4/O1–O6 exits remain incomplete. The
[work program](../../helix-environment-harness-work-program-v1.md) is the sole
status authority; ET6 is unpassed and NAV1 unqualified.
