# Exact pairing expiry after process recovery

Snapshot under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md).
Test-only evidence; no maturity or gate promotion.

Extended the independent-process recovery fixture with a fifth process whose
injected clock is exactly the persisted pairing expiry. It reconstructs the real
snapshot and native broker, then tests list, duplicate submit, acknowledged-event
ack and pending-event ack. All four reject with `pairing_expired`. Underlying
stored events equal the initial process's complete records; no deadline, cursor,
acknowledgement or identity changes. The existing valid recovery and persisted
revocation checks still pass. This uses an injected clock, not elapsed production
consent, and does not prove power-loss or kill-during-write behavior.

`npx vitest run server/db/__tests__/steering-process-recovery.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

Result: one test exercising five distinct child processes passed, exit 0,
7.01 seconds overall. No production app or records were modified. The broader
O1–O6/CS1–CS4 and CS5 scopes remain incomplete; original ET6 is unpassed and NAV1
gated.
