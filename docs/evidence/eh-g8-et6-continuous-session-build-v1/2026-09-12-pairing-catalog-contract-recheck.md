# Pairing catalog contract recheck

Under [onboarding O3](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: source-admission investigation; no implementation change.

Inspected current MCP registration and scope maps. The installed coordination
surface registers destination-register and pairing-accept with rooms manage/read
scopes, and pairing-recover with rooms read. The handlers derive authenticated
profile/client identity and require current native device trust. Their declared
continuation is not provider attestation.

Ran:

```text
npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks --maxWorkers=1 --minWorkers=1 -t 'publishes public observations and bounded coordination on the installed tunnel surface'
```

One test passed, 28 skipped, exit 0. This test connects an isolated MCP client
to the production server implementation and asserts its exact advertised tool
list includes all three pairing tools. It does not call the production host or
prove this task's catalog adopts the list.

The prior supported publication refresh is recorded in
[published pairing catalog refresh](2026-09-12-published-pairing-catalog-refresh.md).
Current task metadata still lacks all three pairing tools and offers no callable
tool-search/catalog-refresh entry point. This narrows the observed discrepancy
to publication/adoption outside the tested local server catalog; it does not
identify an internal provider defect. No repeated refresh, restart, reconnect,
guessed invocation, principal substitution or replacement task was attempted.

Actual provider list/send/attestation and automatic delivery remain unproven.
Fallback does not close O3 or O6. The complete O1–O6 and CS1–CS4 objective and
CS5 handoff remain open; ET6 unpassed and NAV1 gated.
