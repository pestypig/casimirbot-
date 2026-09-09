# Browser status and steering through durable binding checks

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission and presentation. HTTP/MCP integration evidence.

The browser binding status/current/event/display and steering routes now use the
durable access layer for concrete runtime stores. Authenticated browser ownership,
current installation/trust and active account linking are checked for each durable
operation. Grant lookup and state validation occur again before the synchronous
store operation. Owner-scoped lookup of the current binding ID is metadata only,
never authority. Existing legacy ports retain their existing checks.

The first regression run caught a stale exact-chat request changing from conflict
409 to not-found 404 because the adapter looked up the submitted ID before the
current chat target. The exact-chat adapter now retains the original check order.
The failing regression passed after that repair. Revoked/expired/unaccepted grants
now produce typed conflict errors at these access boundaries rather than generic
availability errors; mismatched destinations remain forbidden.

The joined test extends the browser-issued/MCP-accepted grant through runtime
recovery, MCP prompt/pickup/ack, browser display and current-binding inspection,
then browser typed prompt submission/replay. Display contains one event per distinct
prompt with truthful agent/typed origins. Browser revocation rejects further display
with `pairing_revoked` and MCP use remains denied. These are actual HTTP and MCP
handlers with real encrypted persistence and isolated credentials, not rendered UI.

```text
npx vitest run server/routes/__tests__/agent-connections.test.ts server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts server/services/local-supervisor/__tests__/durable-reasoning-binding-access.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
47 tests passed after the exact-chat regression repair
npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts server/services/local-supervisor/__tests__/durable-reasoning-binding-access.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
31 tests passed after final typed-error assertions
```

The second command repeats coverage; totals are not additive. Browser preparation,
legacy binding-revoke handling for durable grants, other binding consumers,
replacement policy, new rendered controls and native rehearsal remain unfinished.
The prior full-discipline pass predates this wiring and is not its broad acceptance
evidence. No EXE was rebuilt or launched. CS1-CS4/final CS5 remain open, ET6 unpassed;
this goal does not dispatch the independent NAV-EQ lane.
