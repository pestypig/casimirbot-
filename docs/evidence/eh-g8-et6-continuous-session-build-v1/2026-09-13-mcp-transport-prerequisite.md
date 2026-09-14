# MCP transport prerequisite diagnostic

Scope: O5/O6 diagnostic and deterministic native startup recovery sequence.
The [work program](../../helix-environment-harness-work-program-v1.md) remains
the sole status authority. No production authentication or consent was automated.

## Current observations

The ordinary [account-scope package](2026-09-13-account-scope-package.md) is open
and signed out. Native UI navigation to Agent Access and its advanced reference
section succeeded after fresh window activation recovered a coordinate geometry
error. No authentication or tunnel-start control was activated.

Process inspection found no `tunnel-client` process. The supported native command
`tunnel-client runtimes list --json`, using the verified executable bundled in
that package, succeeded and returned an empty alias list. This does not prove
that no desktop-managed configuration exists: desktop tunnel control has its
own lifecycle and does not depend on the runtime alias inventory.

The Tunnel MCP connector's `list_runtime_aliases` first rejected its stale
v0.0.11 binary selection. Supplying the verified current package executable also
returned "is not an executable file", while the local filesystem and native
CLI proved that file exists and executes. The connector's file-access/selection
failure remains separate from the product's external MCP session error. No
plugin configuration, credentials, profiles or remote tunnel were changed.

Inspection of `main.ts` confirms native startup calls
`autoStartConfiguredDesktopMcpTunnelReadOnly` with account resolution from the
actual window session. That helper refuses unavailable authentication and
non-developer accounts before starting transport. The signed-out state is thus
a real local prerequisite. It does not establish which remote/client layer
originated the preceding `McpServerError: Session terminated` response.
No raw provider API, credential lookup or reconnect workaround was used.

## Deterministic verification

Added an unavailable-account → authenticated-developer → repeated-check case to
`tests/desktop-mcp-tunnel-transition-executor.spec.ts`. It uses the actual startup
helper with a fixture controller, not a live tunnel or account. It verifies:

- A rejected account lookup returns only `account_unavailable`, with no start or
  stop and configuration retained.
- A subsequent authenticated lookup starts exactly one read-only transport for
  the exact fixture session.
- Repeating the check returns `already_running`, with no additional lookup,
  duplicate start, stop or full-scope escalation.

The initial new test used a matcher absent from Vitest 1.6.1 and failed at that
assertion; it was corrected to the supported separate count/argument matchers.
No product change was required for this sequence.

```text
npx vitest run tests/desktop-mcp-tunnel-transition-executor.spec.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

All 13 tests passed, 1.80 seconds. This does not prove that production sign-in
automatically invokes recovery, that the real tunnel becomes reachable, or that
the exact Codex task resumes a terminated MCP session. Those require separate
integrated evidence. No package rebuild is required for this test-only addition.

The [CS5 inventory](2026-09-12-runtime-recovery-cs5-reconciliation.md) remains
open. All CS1–CS4 and O1–O6 exits retain their original scope. ET6 remains
unpassed, and this diagnostic does not qualify NAV1.
