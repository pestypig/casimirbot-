# Steering recovery across independent OS processes

Snapshot under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md).
Classification: test-only evidence re-entry verification. No maturity promotion.

Added an isolated child-process fixture using the production migrated local
snapshot database, native pairing/steering repository factories, actual desktop
credential broker and durable steering service. A parent test supplies an
ephemeral key in the child environment; it never reads production credentials.
The fixture injects its own accepted grant and admission callback, not production
human consent or provider identity. Temporary files stay in a checked repository
`.tmp/steering-process-*` directory and are removed after the test.

The first process commits a grant, one acknowledged event and one pending event,
then exits directly after publishing its result, without database reset, broker
shutdown or graceful cleanup hooks. A distinct second PID creates a fresh broker
and database from the snapshot. Before retries, its history equals the first
process's final history. Exact submit and acknowledgement retries preserve every
record field, including identity, cursor, original deadline and acknowledgement.
The snapshot has two event rows and no plaintext fixture instruction.

`npx vitest run server/db/__tests__/steering-process-recovery.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

Result: one test passed, exit 0, 3.59 seconds overall. This advances beyond
same-process database reconstruction. It does not prove kill-during-write,
power-loss durability, Windows-protected keyring persistence, real PostgreSQL
concurrency, provider authentication, UI pickup visibility, or packaged ordinary
restart acceptance. The key is deliberately retained by the test parent.

No production app, authority or record was changed. Remaining O1–O6/CS1–CS4 and
CS5 requirements remain open; original ET6 is unpassed and NAV1 gated.
