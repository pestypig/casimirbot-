Program gate: G8
Workstream: O2/O5 prerequisite pairing persistence and recovery
Capability or component: encrypted pairing transaction failure containment and finite trust contention
Lifecycle stage: source admission; evidence re-entry
Reaction timescale: database transaction and bounded request reconciliation
Authority owner: existing authenticated human and provider admission; Helix persistence policy
Current maturity: specified for the integrated prerequisite; previous component evidence retains its scope
Target maturity: deterministically verified prerequisite and separately evidenced packaged rehearsal
Required evidence: actual PostgreSQL locks, transactional backend failure, rollback, replay, revocation and focused embedded regressions
Explicit non-goals: no production consent fixture, identity substitution, private model loop, environment effects, original ET6 substitution or NAV1 qualification
Downstream gate unlocked: none

# Real PostgreSQL recovery supplement

This immutable 2026-09-13 snapshot supplements the
[onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md),
[continuous-session packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md)
and [post-reboot CS5 inventory](2026-09-13-post-reboot-recovery.md).
The [work program](../../helix-environment-harness-work-program-v1.md) remains
the sole status authority. No complete O1–O6 or CS1–CS4 exit is claimed here.

## Isolation and actual database boundary

Docker Desktop's local Linux engine was available. The fixture used PostgreSQL
17.11 from the official image pinned to
`postgres@sha256:18cfe3ef5e6815560c98237d6216d1e5119702fb0f3894c8785dd58b8bbe5d73`.
One labelled container had a 384 MiB memory cap, one CPU, a 64-process limit,
loopback-only dynamically assigned port and a 256 MiB temporary database mount.
No user database, profile, native credentials, host data mount or keyed running
service was used. The runner did not read the application's DATABASE_URL.

The opt-in test URL is accepted only for a loopback PostgreSQL database with
the fixture-specific database prefix and fixture username. Test-process
migration selection runs the actual account, installed-device, trust and
pairing migrations. The pool, two-write transaction primitive, encrypted ledger
repository, transition service and installed-security store are production code.
Only the identity authorizers, clock, encryption key and accounts are fixtures.
The PostgreSQL COMMIT is real; the embedded snapshot callback is a fixture no-op.
No HTTP, browser, provider task delivery or native consent is exercised here.

Tests wait for PostgreSQL to report actual lock waits in pg_stat_activity before
releasing the held row. They do not infer contention from Promise.all alone.

## First failure and repair

The first four tests passed their assertions but Vitest exited unsuccessfully
with an unhandled `Connection terminated unexpectedly` error during transaction
backend termination. This was a failed run, not positive recovery evidence.
The two ledger changes rolled back correctly, but the acquired pg client had
no error listener for the separate socket-close event while rollback was pending.
Discarding the failed client alone reproduced the same unhandled error.

The PostgreSQL branch of `commitPairingLedgerWrites` now attaches a scoped
connection error listener while it owns the client, discards failed connections,
and removes the listener on release. Pending/subsequent queries still reject;
the original operation failure reaches the caller. No failure is converted to
a success, no transaction is retried privately and no consent is broadened.
The embedded database branch is unchanged.

The first runner also had a Windows native-argument quoting error when checking
its cleanup label. That exact fixture was identified by its label and removed.
The runner now decodes the label JSON without nested argument quotes. Successful
subsequent runs removed their exact owned containers and temporary credentials;
the final inventory showed no remaining onboarding fixture container or env file.

## Deterministic results

`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-onboarding-postgres.ps1`
passed five tests at 19:52:36 America/New_York, 2.36 seconds of Vitest wall time:

| Requirement | Actual assertion |
| --- | --- |
| O2/O5 duplicate acceptance | Two requests blocked on a real row lock converge to one revision-2 acceptance and identical projections; expiry is unchanged |
| O2/O5 revocation during acceptance | Revocation contends with acceptance, advances to revision 3, and both fresh recovery and replay reject the revoked grant |
| O2/O5 competing replacements | Exactly one transaction consumes the predecessor; the losing invitation remains pending and receives replacement conflict |
| O2/O5 backend termination | Kill the exact fixture transaction backend while its second ledger write is blocked; both rows remain original, retry accepts once and replay preserves expiry |
| O5 duplicate trust and later revoke | Concurrent locked grants admit one revision; later revoke wins, a stale grant rejects, and exactly one grant and one revoke event exist |

The backend-termination test kills one PostgreSQL session, not the database
server, desktop app or machine. It proves transaction rollback and fresh
connection recovery, not PostgreSQL server restart, power-loss durability,
all audit-event crash atomicity or the complete O5 fault matrix.

Focused regressions passed 48 tests across these five files in 12.38 seconds:

```text
npx vitest run server/db/__tests__/pairing-atomic-snapshot.test.ts server/db/__tests__/pairing-ledger-snapshot.test.ts server/services/local-supervisor/__tests__/pairing-ledger-repository.test.ts server/services/local-supervisor/__tests__/pairing-replacement-storage-mechanics.test.ts server/services/helix-account/__tests__/installed-security-store.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

These retain their component/embedded snapshot/isolated broker scopes. They do
not establish live user consent. The static discipline quick check passed;
its broad dirty-checkout output is not verification of unrelated edits.
Classification for this patch is source admission and evidence re-entry:
failure containment in durable pairing storage. No continuation identity,
source epoch, adapter, physics, certificate or verification policy changed.
Full discipline and Casimir verification do not apply to this narrow patch.
The documentation audit passed with 14 acceptance claims and 40 capability
status rows checked; log `.tmp/onboarding-postgres-docs-audit-20260913.log`.

`node apps/desktop/scripts/build-host.mjs` passed. It emitted four existing
duplicate-key warnings in unrelated demonstration/starsim code. The built
service SHA256 is
`189a0b0209816ff26afb12039a4027138b83d6ae6235403bb6b55a5f45c7470d`.
The new connection handling is present in that bundle; the three checked
PostgreSQL fixture markers are absent. This is a host/service build, not a new
package or native launch. It has not replaced the running package.

Source SHA256 at verification:

| File | SHA256 |
| --- | --- |
| server/db/client.ts | 262a09dd89de4ea45541d524e4c7c1e42a95a333e57bf20d8b93f370f2374c4f |
| tests/integration/onboarding-postgres.spec.ts | 9c13ade0b7d0d8b43e15f6b2a4df8f3e7ec6708fba64c4c90d4bcbd11ea620d9 |
| scripts/test-onboarding-postgres.ps1 | 7362aac24d1d5ebc7fbe663be5afb6c6c716c7a02e39a8ff49b9eb3c082bcd6a |

Local logs: `.tmp/onboarding-postgres-20260913.log` (red and cleanup failure),
`.tmp/onboarding-postgres-green-20260913.log` (discard-only still red),
`.tmp/onboarding-postgres-repair-20260913.log` (four passing),
`.tmp/onboarding-postgres-final-20260913.log` (five passing),
`.tmp/onboarding-pg-regressions-20260913.log`,
`.tmp/onboarding-postgres-discipline-20260913.log`, and
`.tmp/onboarding-postgres-build-20260913.log`.

## Packaged and live boundary

The [guidance-recovery package](2026-09-13-guidance-recovery-package.json) remains
running with main PID 25968, service PID 21096 and native window 265334. Native
inspection still showed AI app connected and the available human control
Trust this device for Full Harness. Trust remained unapproved. No repeated
sign-in, restart, reconnect, finite transport execution or human approval was
automated in this increment.

Presence at 23:48:08.806Z revalidated this exact continuation on service
`service_instance:f375ae425580648438961e1fb056c0de` and client
`supervisor_client:bed40871e206c0c5b026d3f9963dbe4c`. Profile and MCP client were
server verified; the task continuation remained client declared. The v2 Ready
up, prompt submit, binding claim and steering read/ack tools were callable.
Presence declared only tool_activity_only. No higher public-checkpoint or
continuation capability was invented to enable the UI. Presence expired after
180 seconds; that does not revoke device registration or create pairing consent.

## Requirement-by-requirement CS5 supplement

All exits remain incomplete. Earlier evidence remains in the linked full CS5
inventory and [OAuth recovery reconciliation](2026-09-13-oauth-recovery-cs5-reconciliation.md).

| ID | Evidence added here / remaining proof |
| --- | --- |
| CS1.1 | Catalog and authenticated presence revalidated; full MCP/EXE Ready up still required |
| CS1.2 | Exact task/service/client preserved; full chat/run/source/player/lease/goal chain still required |
| CS1.3 | No reconnect performed; three integrated idempotent Ready up calls still required |
| CS1.4 | Real PG duplicate/revocation storage negatives added; complete independent finite-grant lifecycle still required |
| CS1.5 | Real pairing transaction rollback and retry added; complete identity/expiry/durable-goal restart matrix still required |
| CS2.1 | No new ingress trace; one visible natural prompt with truthful origin, pickup and acknowledgement still required |
| CS2.2 | Pairing replay/revoke contention added; all exact-chat/run/epoch ingress and duplicate-effect negatives still required |
| CS2.3 | Higher continuation capability remains unproven; actual supported delivery and authoritative answer path still required |
| CS3.1 | No movement evidence added; useful course and three linked successors through real compiler/broker/resident executor still required |
| CS3.2 | No live timing added; correlated observation/admission/delivery/activation/runway/stall/release timings still required |
| CS3.3 | Database failure is a separate boundary; complete four-plan faults and live reconnect/backpressure recovery still required |
| CS4.1 | No gameplay interruption added; genuine override/stop, queue invalidation and release latency still required |
| CS4.2 | Fixture trust revoke is not gameplay revoke; broker/connector/executor rejection and fresh no-motion proof still required |
| CS4.3 | No environment observation re-entry added; fresh exact evidence changing reasoning and response still required |
| CS4.4 | New service builds; this PostgreSQL repair is not yet packaged; companion and package qualification still required |
| CS4.5 | Existing EXE remains available at genuine trust boundary; complete ordinary consent/prompt/result/recovery workflow still required |
| CS5.1 | All requirements retained with explicit limits; complete acceptance artifact still required |

O2/O5 gain actual PostgreSQL evidence, while their complete matrices remain open.
O1, O3, O4 and O6 gain no new qualification from these database tests. Original
ET6 remains unpassed. NAV1 remains unqualified; the separate NAV-EQ dependency
rule is unchanged. The persistent goal remains incomplete.
