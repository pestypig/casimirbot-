# Durable steering pagination — September 12, 2026

Snapshot under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md)
and the [work program](../../helix-environment-harness-work-program-v1.md).
No maturity or gate advances.

Repaired an integration difference from the prior runtime store: owner chat
display must select the most recent 50 matching events, then return ascending
cursor order. Task polling selects the first 50 after its cursor. The encrypted
repository now supports those two bounded views, and only the chat-display
access path requests the recent view. Neither read acknowledges an event.

```powershell
npx vitest run server/services/local-supervisor/__tests__/durable-steering-repository.test.ts server/services/local-supervisor/__tests__/durable-reasoning-binding-access.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

11 passed. The new 52-event embedded case verifies polling cursors 1–50, display
cursors 3–52, subsequent windows 51–52 and 52, unchanged acknowledgement and
stable repeated IDs. This is repository/service and access evidence, not native
rendered 50-event chat history or automatic host delivery.

After this source change the required forced full discipline run was started:
`npm run helix:ask:discipline:full -- --force`. It is still running at this
snapshot; no PASS is claimed. Preserve the live process rather than restarting it
on an output timeout. O1–O6 and CS1–CS4 remain incomplete, CS5 incomplete,
original ET6 unpassed and NAV1 gated.
