# Replacement MCP and disk recovery — September 12, 2026

Evidence under [the replacement packet](../../work-packets/eh-g8-cs-durable-pairing-replacement-v1.md)
and [the canonical work program](../../helix-environment-harness-work-program-v1.md).
Test-only extension of source-admission/evidence-re-entry coverage; no maturity
or gate promotion.

## Actual MCP handler matrix

`npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

29 passed, including an expanded existing durable-pairing test. It uses actual
MCP SDK in-memory transport and real registered handlers, an injected authenticated
fixture principal, real browser-session issuance routes and encrypted embedded
repository with the atomic two-record operation. No external provider or real
human session is used.

The added sequence registers a second exact task, issues two explicitly reviewed
replacements of one accepted predecessor, rejects pending replacement recovery
and the wrong destination, accepts two competing requests concurrently with one
winner, and replays the winner without changing its result. The losing invitation
stays pending and cannot later consume the superseded predecessor. Old acceptance,
recovery, steering read, prompt submission and acknowledgement reject with
pairing_superseded. The acknowledgement case tests rejection before event lookup;
it does not claim successful prior delivery of that fixture event.

A new service object recovers the winner over the retained encrypted database
with the same finite projection. The browser owner then revokes the winner;
winner replay rejects pairing_revoked, predecessor replay remains
pairing_superseded and the competing invitation still conflicts. This is service
object recovery, not a native process or host restart.

## Actual disk snapshot restore

`npx vitest run server/db/__tests__/pairing-atomic-snapshot.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

1 passed. The existing primitive snapshot case was strengthened to use actual
replacement policy, acceptance and recovery services. It still injects a second
CAS conflict to prove rollback of the first embedded write. A simulated lost
durability reply is reconciled by accepting the same invitation again. Both
encrypted records are then loaded from the isolated on-disk snapshot after
database-client reset. The old grant rejects acceptance and recovery; the new
grant recovers unchanged. After revoking the new grant and another disk reload,
old recovery remains superseded and new recovery is revoked. Fixture identities
remain absent from plaintext snapshot content. This is real disk reload inside
one test process with an ephemeral vault, not native credential-broker/process
restart qualification.

## PostgreSQL and package boundary

Read-only host inspection found Docker CLI but no postgres/pg_ctl/psql executable
on PATH and no C:\Program Files\PostgreSQL directory. Docker server-version
inspection failed because the Docker Desktop Linux engine pipe did not exist.
No database daemon or user service was restarted. Real PostgreSQL concurrency
remains unverified; the embedded tests do not stand in for it.

A point memory observation returned 5,207,220 KiB free physical memory, so the
previous native-smoke low-memory condition is not assumed to persist. Revalidate
memory and the exact built package at launch; this observation is not a launch
receipt. The running EXE still predates the replacement changes. Cumulative full
discipline validation and refreshed packaging remain required.

All O1-O6 and original CS1-CS4 exits remain incomplete, CS5 is an incomplete
handoff, ET6 is unpassed and no NAV gate is unlocked.
