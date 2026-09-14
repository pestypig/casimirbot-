# Durable steering public regressions — September 12, 2026

Snapshot under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md)
and the [work program](../../helix-environment-harness-work-program-v1.md).
No maturity or gate advances.

Initial public regression run: 45 passed, 3 failed across MCP coordination (29),
agent-connections routes (17) and rendered workflow (2). The three durable-flow
failures reached the native steering factory without a native persistence setup.
The isolated fixtures now run migration090 and supply the actual encrypted
steering repository through a test-scoped factory spy. No production bypass or
unkeyed replacement server was introduced.

After fixture integration:

```powershell
npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts server/routes/__tests__/pairing-rendered-workflow.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

31 passed. The 17 agent-connections route tests passed on the initial run and
were not repeated after fixture-only changes.

The two rendered workflow cases were then extended and rerun successfully. After
typed prompt dispatch and acknowledgement, they create a fresh service store and
router over the same encrypted database, restore the pairing, and retry through
the public HTTP steering endpoint using the new binding. The response preserves
event ID, original creation/expiry and acknowledgement; the SQL table has one
event. Old binding handles reject, and subsequent owner revocation blocks reads
through both service stores.

This is actual handler/SDK and encrypted embedded integration with isolated
authentication, not actual external host delivery. Service-object replacement
does not prove snapshot/process recovery. Native broker/disk restart, PostgreSQL
concurrency, complete typed-error/pagination behavior, full discipline and package
verification remain outstanding. The running visibility EXE predates this work.
O1–O6 and CS1–CS4 remain incomplete, CS5 incomplete, ET6 unpassed and NAV1 gated.
