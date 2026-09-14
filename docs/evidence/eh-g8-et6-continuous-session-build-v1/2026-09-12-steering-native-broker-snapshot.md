# Steering native-broker snapshot recovery — September 12, 2026

Snapshot under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md)
and the [work program](../../helix-environment-harness-work-program-v1.md).
No maturity or gate advances.

Extended the existing isolated snapshot test to create an accepted pairing,
one acknowledged steering event and one pending event through native repository
factories and the actual desktop provider-credential broker. The snapshot contains
two encrypted events and no plaintext instruction. The test closes the database
client and broker listener, reopens the database from its temporary snapshot, and
starts a new broker with a rotated active key and the old key retained.

The new service lists the same ordered acknowledged/pending records. Exact retries
retain event IDs, cursor, deadlines and acknowledgement; repeated acknowledgement
is unchanged. The table still contains two rows. Removing the retired key makes
event decryption fail with pairing_storage_unreadable. Fixture keys/cookies never
authenticate against production, and no production broker was stopped.

```powershell
npx vitest run server/db/__tests__/pairing-ledger-snapshot.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Three tests passed after adding both pending and acknowledged cases. This is real
snapshot-file reconstruction and real broker listener restart/key rotation within
one isolated test process. It is stronger than repository-object replacement but
does not prove an OS-process crash/restart, native profile keyring persistence,
ordinary packaged workflow, public MCP reattachment or actual host delivery.
Full discipline, PostgreSQL concurrency and final package evidence remain pending.
O1–O6 and CS1–CS4 remain incomplete, CS5 incomplete, original ET6 unpassed and
NAV1 gated.
