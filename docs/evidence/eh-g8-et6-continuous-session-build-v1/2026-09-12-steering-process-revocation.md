# Persisted revocation across process termination

Snapshot under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md).
Test-only work; no maturity or gate promotion.

Extended the isolated subprocess test to four distinct processes: create,
recover, revoke, and recover-revoked. The fixture parent terminates each exact
child after receiving a complete result line and waits for its close event.
No database reset or persistence shutdown hook runs. Revocation modes close
their HTTP broker before publishing the result; that has no database flush hook.

Both before and after revoked-state process recovery, list, duplicate submit,
acknowledged-event ack and pending-event ack reject with `pairing_revoked`.
The two underlying encrypted events retain their original record contents;
denial creates no event or acknowledgement. Identity/admission are fixture
injections, not production OAuth or human-consent acceptance.

Initial direct process.exit attempts hit a Windows Node/libuv assertion after
publishing the result and were failures. Moving exit to setImmediate and closing
the broker did not resolve it. The parent-owned termination protocol avoids that
exit path and explicitly exercises post-commit process termination. No failed
child exit is silently accepted: the parent requires its own termination request
and a complete result before inspecting the recovery invariants.

`npx vitest run server/db/__tests__/steering-process-recovery.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

Final result: one test passed, exit 0, 5.87 seconds overall. This replaces the
fixture's earlier self-exit mechanism, not the immutable preceding evidence.
Kill-during-write, power loss, production keyring persistence, real PostgreSQL
concurrency and packaged authenticated workflow remain separate requirements.
O1–O6/CS1–CS4 and CS5 remain incomplete; original ET6 is unpassed and NAV1 gated.
