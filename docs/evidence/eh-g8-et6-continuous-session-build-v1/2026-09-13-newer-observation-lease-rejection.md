# Newer observation invalidates an unleased temporal successor

Classification: source admission, tool admission and evidence normalization.
CS3.3/CS4.2/O5 supplement to the
[latest CS5 inventory](2026-09-13-manual-repair-cs5-reconciliation.md).

The cross-language continuous fixture now publishes a newer frontier after the
third successor is admitted and before leasing it. Publication uses the real
frontier store with an incremented observation revision and a distinct evidence
reference; the store allocates its next affordance revision. The negative branch
requires no lease and no attempt-count change, then restores only the isolated
pg-mem snapshot so the original positive native chain can continue.

The red run reproduced an actual lease-admission gap: the broker returned the
older request instead of null. Its failure is retained in
`.tmp/continuous-newer-observation-red-20260913.json`. Native third-successor
queueing subsequently failed because the fixture returned the assertion error;
the first divergence is the broker lease assertion, not a native motion defect.

`leasePendingEnvironmentTemporalSuccessor` now reads the newest goal frontier
inside its existing authority/goal/resident transaction, before the one-shot
lease UPDATE. Publication holds the same goal lock. The check requires a
schema-valid, hash-valid, retained and non-future frontier with the complete
identity equal to the proposed successor, including observation and affordance
revisions. Missing or mismatched state returns no lease. No grant is renewed,
no plan is authored and no retry/execution loop is introduced.

This applies the existing exact currentness contract to still-unleased work.
It does not retroactively stop a successor already delivered to the resident;
that requires the separate native guard/interruption path. It also does not
prove material-affordance interpretation or Codex replanning after the change.

The repaired integration passed one selected case in 34.923 seconds, with one
other parameterized case filtered out. Use JDK 21 / Gradle 8.14.3,
`HELIX_NATIVE_PUBLICATION_INTEGRATION=1`, `HELIX_NATIVE_BROKER_ROUNDTRIP=1`,
`HELIX_NATIVE_BROKER_CONTINUOUS=1`, empty continuous stop and all other fault
flags disabled:

```text
npx vitest run server/services/environment-connectors/events/__tests__/native-temporal-publication.test.ts -t native-compiled-publication --pool=forks --maxWorkers=1 --minWorkers=1 --reporter=json --outputFile=.tmp/continuous-newer-observation-repair-20260913.json
```

The negative branch leaves the candidate admitted with attempt_count 0. After
restoring the fixture database, the [broker artifact](2026-09-13-newer-observation-broker.json)
and [native artifact](2026-09-13-newer-observation-native.json) retain the positive
four-plan chain: three handoffs, 84 moving ticks, one attempt per request, one
root result, released controls and no automatic action replay. These artifacts
describe the restored positive path; the negative branch is evidenced by the
executed assertions, not by the final artifact state.

All 23 adjacent delivery-route, ordinary-queue, one-shot lease and frontier-store
tests passed without skips:

```text
npx vitest run server/routes/__tests__/environment-temporal-delivery.test.ts server/services/environment-connectors/actions/__tests__/temporal-ordinary-queue.test.ts server/services/environment-connectors/actions/__tests__/temporal-successor-lease.test.ts server/services/environment-connectors/temporal-plans/__tests__/temporal-frontier-store.test.ts --pool=forks --maxWorkers=1 --minWorkers=1 --reporter=json --outputFile=.tmp/temporal-frontier-lease-regressions-20260913.json
```

Discipline quick passed with the classifications above. No contract schema,
physics, certificate semantics or release verification code changed. No Casimir
certificate claim is made. The broker source repair postdates the running
profile-settlement EXE and still needs packaging. The previously built manual
observation companion JAR is unchanged by this server repair.

Player/clock/perception authority are fixtures; real HTTP, storage statements,
compiler and resident executors run in isolation. This is not live latency,
real changed-affordance replanning, genuine revocation or ordinary EXE acceptance.
All CS1–CS4/O1–O6 exit scopes remain incomplete. ET6 is unpassed and NAV1
unqualified; the [work program](../../helix-environment-harness-work-program-v1.md)
remains the sole status authority.
