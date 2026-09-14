# Post-sign-in transport boundary

Scope: O6/CS1 ordinary packaged recovery diagnostic. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
status authority. No acceptance gate advances.

After the operator reported completing sign-in, native accessibility showed an
active local password account and a linked local owner account. This supersedes
the earlier signed-out observation only; it does not prove OAuth linkage,
developer policy, device trust or exact-task binding.

The current task's v2 authenticated supervisor-presence call returned
`UNAVAILABLE`, `invalid_mcp_response`, HTTP 404 from the configured tunnel
gateway. No presence was registered. This differs from the earlier
`Session terminated` response. Process inspection found no `tunnel-client`
process. Neither observation proves whether the remote tunnel was removed or
which configuration must be recovered.

The supported Tunnel MCP alias-list tool separately rejected its selected
v0.0.11 binary path as not executable. No plugin configuration, credentials,
remote tunnel or runtime alias was modified.

Native navigation to Agent Access failed with `coordinate input geometry is
unavailable`. Fresh unique window selection followed by activation failed with
`failed to activate captured window`. Inputs stopped; the operator was asked to
bring the app forward and open Agent Access. These helper failures are not
evidence of an EXE crash. The last observed ordinary package remains
`release-profile-settlement-20260913`, not the staged frontier-lease package.

## Source boundary inspected

- `apps/desktop/src/main.ts` invokes
  `autoStartConfiguredDesktopMcpTunnelReadOnly` during startup. The helper
  returns without starting for unavailable accounts and non-developer accounts.
- `mcp-tunnel-recovery-supervisor.ts` is triggered by an existing transport's
  process exit or health failure; its retries revalidate the exact account.
- `client/src/components/agent-access/AgentConnectionSetup.tsx` explicitly
  refreshes status on account-policy events without starting transport or
  inferring consent. Its explicit harness-start flow is separate.

Consequently, the passing helper test that calls startup again with an
authenticated fixture does not prove that real sign-in invokes it. Automatic
transport startup after sign-in is not established by this checkpoint. Do not
change that boundary without preserving account policy, operator stop and scope
consent. Inspect the actual setup state before selecting a recovery action.

No production patch or new test execution occurred in this diagnostic. All
CS1–CS4/O1–O6 exits remain incomplete; the latest full
[CS5 reconciliation](2026-09-13-manual-repair-cs5-reconciliation.md) and subsequent
frontier-lease evidence retain their stated scopes. ET6 remains unpassed and
NAV1 unqualified. No old claim, credential, presence or binding was reused.
