# Persisted steering transition validation

Snapshot under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md).
Classification: evidence normalization. No identity, authority, consent lifetime,
sampling, or continuation protocol changes. No maturity promotion.

The v1 steering schema models immutable creation at revision 1 and one
acknowledgement at revision 2. Inspection found that its validator accepted
contradictory revision/acknowledgement combinations. A new regression reproduced
that acceptance before the repair. The schema now rejects pending revision 2,
acknowledged revision 1, revision 3, and an acknowledged revision with its
acknowledgement removed. Valid pending and acknowledged records remain accepted.
Retries still preserve revision, identity, deadline and acknowledgement.

Focused command ran durable-steering-contract, durable-steering-repository,
durable-reasoning-binding-access and pairing-ledger-snapshot tests with vitest,
fork pool and one worker. Result: four files, 20 tests passed, exit 0. Snapshot
tests use isolated files and actual broker reconstruction within the test process;
they do not establish independent OS-process crash recovery or real PostgreSQL
concurrency. No production records or credentials were modified.

This validation fix and the latest guide label correction are newer than the
running recovery EXE. Integrated provider pairing, full native/process recovery,
remaining O1–O6/CS1–CS4 requirements and CS5 handoff remain incomplete. Original
ET6 is unpassed and NAV1 remains gated.
