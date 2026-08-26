# Helix environment harness G7 progress audit — 2026-08-24

Status: **MCP callable; CasimirBot brokerage binding unavailable; G7 remains active**

This is an immutable dated evidence snapshot. The canonical current status
remains `docs/helix-environment-harness-work-program-v1.md`.

## Scope

This increment resumed the G7 read-only Robinhood transfer after restarting the
Codex application. It tested whether the newly implemented
`helix_brokerage_robinhood_read` tool was discoverable and callable through the
authenticated CasimirBot MCP client. It did not create or modify a brokerage
account, inspect or move credentials, bind a new provider connection, review or
place an order, or enable any mutation authority.

## Keyed server and MCP preflight

The keyed CasimirBot server was started only through the approved opaque
`start-myapp-for-codex` launcher. It reached `[express] app ready` at
`http://127.0.0.1:1522`. The account-session, Helix pipeline, and agent-provider
health endpoints returned HTTP 200, and the Codex provider was enabled.

The restarted Codex task still did not expose a CasimirBot tool namespace in
its already-materialized callable catalog. The configured OAuth MCP connection
was present and healthy, but its explicit local `enabled_tools` allowlist
predated G7 and omitted `helix_brokerage_robinhood_read`. The allowlist was
updated to include only that new read-only tool. Its existing scopes already
contained the exact room-read and environment-action-read scopes required by
the server contract; no new write scope, token, client secret, or provider
credential was added.

The active task could not dynamically rematerialize its tool catalog, so the
official Codex CLI was used as the bounded A1 MCP client. The invocation was
ephemeral, read-only sandboxed, pinned to Terra, prohibited shell and mutation
tools, and used only the configured `casimirbot_g2_a1_local` OAuth connection.
This is the intended Codex-through-MCP route, not a raw HTTP or bearer-token
bypass.

## Read-only evidence

### Direct provider preflight

The already-authorized Robinhood MCP application returned one public SPY quote
through `get_equity_quotes`. The most recent non-regular trade observation in
that result was timestamped `2026-08-24T04:02:36.275Z`; the official completed
session close was dated `2026-08-21`. No portfolio, position, account, order,
tax-lot, or mutation data was requested.

This proves that the separate Robinhood application connection can perform the
chosen upstream read. It is not the G7 reference-adapter acceptance trace,
because it does not carry CasimirBot's exact owner-private room binding,
connection identity, producer epoch, normalized observation identity, or
input/output hashes.

### CasimirBot A1 readiness

`helix_environment_device_check` completed through the authenticated
`casimirbot_g2_a1_local` principal. Its sanitized projection reported one
active, fresh, first-party connector and an active private Minecraft room
binding. It reported no CasimirBot brokerage binding or brokerage credential
readiness.

### CasimirBot A1 read attempt

The same bounded Codex MCP client then invoked the newly admitted
`helix_brokerage_robinhood_read` tool with:

```text
upstream_tool = get_equity_quotes
upstream_arguments.symbols = [SPY]
```

The tool was discovered, started, and settled as a typed failure:

```text
brokerage_connection_not_ready
The current private room has no active Robinhood binding matching this request.
```

This is the correct authority failure. It proves the post-restart blocker is no
longer MCP catalog absence, missing OAuth scopes, provider sampling, or terminal
materialization. No provider call was made through CasimirBot and no observation
was fabricated.

## Browser and identity boundary

The opaque launcher rotated the development-session secret, so the available
in-app browser opened as an anonymous user and could not inspect or bind the
owner-private brokerage environment. The Chrome automation bridge was not
available. No password, browser cookie, local storage, OAuth token, or provider
credential was inspected or copied to compensate.

The direct Robinhood application's OAuth authority remains deliberately
separate from CasimirBot's server-owned brokerage connection and room binding.
Automatically treating the former as the latter would violate the G7 identity
and credential boundary.

## Remaining work to close G7

An authorized owner must make one existing CasimirBot Robinhood connection
active and bind its read capability to the exact owner-private room. This must
occur through the approved account/provider UI or an already-authorized product
workflow; it must not be synthesized from the separate Codex Robinhood token.

Once that binding is current:

1. run the bounded read through the CasimirBot reference adapter;
2. repeat it through authenticated MCP;
3. submit the unchanged natural request through keyed Helix Ask;
4. compare exact connection, room binding, capability, tool, producer epoch,
   observation identity, input/output hashes, observation time/freshness,
   evidence re-entry, supported candidate, terminal selection, and presentation;
5. run the G7 tripath observer; and
6. confirm revocation/privacy invalidation fails closed and no mutation alias is
   admitted.

G7 remains `deterministically verified`. The current typed failure is valuable
admission evidence but does not promote the transfer to `live accepted` or
`integrated accepted`.

## Casimir verification applicability

Casimir verification was not applicable. No warp/GR physics, constraint pack,
certificate, training-trace, or physical-proof surface changed.

