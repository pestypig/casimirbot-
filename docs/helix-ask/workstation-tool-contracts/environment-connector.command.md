# Environment Connector Minecraft Command

Status: draft.

Capability: `com.casimirbot.minecraft.command`

Companion read capability: `com.casimirbot.minecraft.command.catalog`

Internal action: `room.environment.command`

Observation schema: `helix.environment_command.observation.v1`

Catalog observation schema: `helix.environment_command.catalog_observation.v1`

## Purpose

Let a reasoning provider compose and request one Minecraft command against the
exact live Brigadier dispatcher exposed by a room-bound Fabric connector. Room
owners may deliberately choose Observe, Player assistant, World operator, or
Server administrator. Server administrator admits the entire live command tree,
including installed mod commands, subject to the selected member ceiling and
autonomy lease.

This is Minecraft authority, not computer authority. It never grants a shell,
filesystem access, environment variables, RCON, process control, private
addresses, or credentials.

Before composing unfamiliar vanilla or mod syntax, Codex may call the companion
read-only catalog with optional `query`, `path_prefix`, `limit`, and
`environment_label`. The catalog comes from the current server's Brigadier
dispatcher, prioritizes every root command in its bounded snapshot, and returns
nonterminal evidence for reasoning. It neither runs a command nor grants extra
authority.

## Owner

Codex owns semantic tool choice, Minecraft command composition, native tool
calls, observation re-entry, subsequent reasoning, and terminal completion. It
must not privately retry a command whose outcome is ambiguous.

Helix owns room/member/source/world identity, authority and autonomy policy,
catalog admission, idempotency, one-shot lease state, provenance, and terminal
eligibility. The Fabric connector owns live dispatcher parsing and execution of
the exact admitted command. Neither Helix nor the connector writes the answer.

## Inputs

The model may provide only:

```json
{
  "command": "time set day",
  "category": "world_time_weather",
  "effect": "world_mutation",
  "environment_label": "Local Fabric 1.21.8"
}
```

`command`, `category`, and `effect` are required. `environment_label` is
optional and is used only when more than one active command-enabled Minecraft
environment is available. The model cannot supply room, member, player, source,
world, connector, credential, authority, grant, catalog, run, turn, tool-call,
policy, retry, or terminal identity.

The connector reparses the exact command through the current live dispatcher
and independently classifies its category/effect. A mismatch blocks execution.
Unknown and mod commands require the Server administrator profile.

## Observation

Every completion or typed failure produces a nonterminal
`helix.environment_command.observation.v1`. A successful observation binds the
exact command hash and root, command request/execution references, outcome,
bounded result, current source/world/catalog/policy provenance, and current-turn
re-entry eligibility.

Required authority flags:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

Mutation receipts are observations, not answers. Codex must receive the
current-turn observation before it may synthesize text or voice output.

## Host Projection

The room owner configures authority and member ceilings in the ordinary Shared
GPT Live Room environment panel. For an admitted Fabric source, the owner then
selects **Pair command access in game** and runs the displayed short-lived
`/helix pair <code>` command as a Minecraft operator. Redemption returns a
command-only setup packet directly to the Fabric connector, which atomically
installs only the nested `command` object and preserves the active observation
credential. The browser never receives the command credential. The older
one-time command-config REST response remains an operator API fallback, not the
normal room UI workflow. Only token hashes remain on the server.

The command connector uses an outbound-only HTTP client with separate catalog,
poll, and result scopes. Its credential is distinct from observation ingress
and never enters a provider prompt, answer, MCP result, debug export, or chat
history. `host_access_enabled=false` and `automatic_retry_enabled=false` are
mandatory.

The connector waits for source-manifest admission before publishing its live
Brigadier catalog. Catalog publication is lifecycle setup, not a Minecraft
command retry; a command with an ambiguous outcome is still never replayed.

## Visible Trace

The same turn must show:

```txt
route.proposed
route.committed
tool.call.started
command.request.enqueued
command.request.leased
command.result.recorded
observation.reentered
agent.message.completed
terminal.eligibility.checked
turn.completed
```

Text and GPT Live must project the same post-re-entry terminal product. The
command request, connector result, or room UI state cannot terminalize the turn.

## Negative Admission Cases

The command must not execute when language is quoted, negated, historical,
future/conditional, explanatory, or merely visible on screen instead of an
affirmative current operator request. It also fails closed for a missing or
revoked authority/grant, insufficient profile, unavailable approval, expired
lease, stale or mismatched catalog, wrong room/source/world/member/player,
category/effect mismatch, forged result, duplicate conflict, deadline expiry,
host escape, or any request for automatic retry after an unknown outcome.

No command is automatically replayed. A later user request is a new decision
and a new idempotency identity, not a retry of the ambiguous operation.

## Tests

Primary deterministic coverage:

```txt
server/__tests__/environment-command-contract.test.ts
server/__tests__/environment-command-authority-policy.test.ts
server/services/helix-ask/realtime-room/__tests__/room-environment-command-authority-route.test.ts
server/services/helix-ask/workstation-tool-gateway/__tests__/environment-command.test.ts
server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts
minecraft/helix-fabric-sensor/src/test/java/com/casimirbot/helixsensor/fabric/FabricCommandClassifierTest.java
```

Keyed acceptance must prove a real online-player Fabric turn from natural
prompt through provider tool selection, live catalog admission, connector
execution, observation re-entry, later provider synthesis, and identical
text/voice terminal authority.
