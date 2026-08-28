Program gate: G8 — Environment-harness release evaluation
Workstream: Installed profile connection recovery
Capability or component: Owner-scoped opaque local Fabric sensing re-pair through authenticated MCP
Lifecycle stage: Source admission; secondary tool admission and connector lifecycle recovery
Reaction timescale: none
Authority owner: Authenticated CasimirBot profile that owns the exact room-source binding
Current maturity: deterministically verified
Target maturity: live accepted
Required evidence: Focused MCP catalog and invocation tests; existing connector-pairing owner/identity/idempotency tests; secret-exclusion assertions; Helix Ask discipline quick check; environment-harness documentation audit; live catalog refresh, opaque redemption, and fresh exact-binding heartbeat
Explicit non-goals: Granting World Authority or Player Embodiment; executing Minecraft actions or commands; accepting caller-selected filesystem paths; exposing pairing codes, connector credentials, private endpoints, or host process control; replacing Codex-owned tool execution or completion
Downstream gate unlocked: Live same-host C0 source recovery and the disconnect/reconnect segment of the post-G7 Minecraft integration course

# EH-G8 owner-scoped local sensing repair v1

## Problem

The owner UI already exposes a source-only same-host recovery route at
`connector-pairings/local-source-handoff`. It rotates an existing Fabric
room-source binding with both command and action credential requests disabled,
then deposits the generated `/helix pair ...` command into the fixed bounded
server inbox. The authenticated MCP catalog exposed analogous local handoffs
only for command authority and Player Embodiment.

That asymmetry caused an avoidable lifecycle interruption during C0 combat
testing. Runtime Codex could inspect the stale source, but the only server-side
MCP handoff required active World Authority. A read-only sensing recovery must
not require or manufacture mutation authority.

## Contract

`helix_environment_source_pair_local` accepts only:

- the exact room identity;
- the exact existing room-source binding identity;
- a bounded credential lifetime; and
- a caller-stable idempotency key.

The server derives the authenticated profile from the MCP principal and reuses
`createConnectorBootstrapPairing` with `purpose=rotate`,
`commandCredentialRequested=false`, and `actionCredentialRequested=false`.
The pairing command is delivered through `stageLocalMinecraftServerPairing`,
whose path contract permits only the fixed Fabric run root or one direct child
profile. No caller path is accepted.

The MCP result contains only the sanitized pairing projection and explicit
negative-authority facts:

```text
credential_included=false
pairing_code_included=false
command_authority_granted=false
player_embodiment_granted=false
answer_authority=false
terminal_eligible=false
```

Pairing remains a lifecycle mutation and is therefore not labeled read-only,
even though the resulting connector credential admits only the observation
plane. The receipt must re-enter Runtime Codex as an observation; it cannot
answer the user's gameplay objective.

## Deterministic acceptance

Required focused checks:

1. The authenticated MCP catalog includes the new tool under the existing
   Shared Live Room source-management OAuth scope.
2. Invocation forwards the authenticated owner profile, exact room and binding,
   bounded TTL, and idempotency key to the source-only handoff.
3. The response schema proves that neither mutation plane was granted and that
   no pairing code or credential was returned.
4. The existing connector bootstrap tests continue to prove exact owner/binding
   validation, idempotent replay, and revoked/closed fail-closed behavior.
5. The local handoff tests continue to prove the fixed inbox/path boundary and
   command-shape validation.
6. Ask discipline and environment documentation audits pass.

## Live acceptance boundary

Deterministic verification does not establish a fresh Minecraft source. Live
acceptance requires the keyed installed-node surface to reload the catalog,
invoke the new tool for C0's exact source binding, observe the Fabric connector
redeem the opaque handoff, and verify a fresh heartbeat/snapshot with unchanged
room, source, world, and subject identity. World Authority and Player
Embodiment must remain absent until separately granted.

## 2026-08-27 deterministic evidence

- `server/mcp/__tests__/helix-mcp-environment-reasoning-role.test.ts`
- `server/services/environment-connectors/pairing/__tests__/bootstrap-service.test.ts`
- `server/services/environment-connectors/pairing/__tests__/local-server-pairing-handoff.test.ts`
- Focused result: 3 files, 11 tests passed.
- `npm run helix:ask:discipline:quick`: static checks passed. Warnings refer
  to unrelated pre-existing changed files in the shared dirty worktree; this
  packet adds no solver shortcut or terminal path.
- `npm run helix:environment-harness:docs-audit`: passed with active gate G8.
- Repository TypeScript check remains baseline red, with zero diagnostics for
  the changed MCP implementation or focused test file.
- `git diff --check` passed for this packet's files apart from the repository's
  existing Windows line-ending notices.

The live run then established the remaining first divergence without claiming
acceptance. Keyed CasimirBot was relaunched through the approved opaque launcher
with the C0 direct-child server profile selected. The C0 Fabric server reached
ready state, admitted its read-only manifest, and kept its command lane
disabled. It continued publishing under a different historical room-source
binding, while C0's exact active binding remained stale. The already-running
Codex MCP client reconnected to the new service but retained its turn-start
tool catalog, so the new tool was not callable in that same turn. This is a
catalog-refresh/client-turn boundary, not a failure of source-only pairing or a
reason to weaken identity.
