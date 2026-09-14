# Durable steering storage primitive — September 12, 2026

Snapshot under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md)
and the [work program](../../helix-environment-harness-work-program-v1.md).
No maturity or gate advances.

Added migration 090 and registered helix_durable_steering with existing embedded
snapshot persistence. The repository uses the existing native pairing vault,
binds authenticated encryption context to owner/pairing/event/revision, verifies
decrypted fields against SQL identity columns, and stores instruction content only
inside ciphertext. It supports scoped reads, bounded ordered lists, optimistic
cursor allocation with unique-index arbitration, insert and revision CAS. Every
mutation flushes, including conflicts after a possibly lost durability reply.

This is a storage primitive, not admission or public delivery. The service layer
must authenticate and freshly validate the grant around asynchronous persistence.
No public handler has been connected to it yet; the runtime restart gap remains.

```powershell
npx vitest run server/services/local-supervisor/__tests__/durable-steering-repository.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Three embedded repository tests passed: concurrent insert gives one row; encrypted
acknowledgement survives repository-object replacement; owner isolation and cursor
ordering hold; duplicate cursor conflicts; an injected lost flush reply preserves
committed identity; corrupt payload and wrong encryption key give typed blockers.
The injected flush failure is not a disk durability test. Real PostgreSQL,
snapshot/process recovery and native broker integration are still unverified.

The first run failed because the fixture invoked CREATE TABLE IF NOT EXISTS twice
and pg-mem rejected AST coverage for its existing-table branch. The fixture now
runs this migration once, matching a normal tracked migration application. Repeat
migration behavior is not established by this test; schema constraints were not
disabled to obtain the pass.

This code is newer than the running visibility package. O1–O6 and CS1–CS4 remain
incomplete; CS5 remains incomplete, original ET6 unpassed and NAV1 gated.
