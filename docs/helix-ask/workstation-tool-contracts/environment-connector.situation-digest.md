# Environment Connector Situation Digest

Status: draft.

Capability: `com.casimirbot.minecraft.situation_digest.read`

Internal action: `room.environment.situation_digest.read`

Observation schema: `helix.environment_situation_digest_observation.v1`

## Purpose

Give Codex bounded current Minecraft context without discarding the typed raw
event ledger. The Player Embodiment Plane publishes ordered, content-hashed
events under its separate connector credential. Helix verifies the exact room,
world, player, connector epoch, sequence and replay identity, retains every raw
event, and derives a compact actor/inventory/hazards/focus/workflow digest.

The digest is an observation, not memory authority, a route conclusion, or an
assistant answer. Codex may request a fresh probe when the compact state is
insufficient and must synthesize only after the digest re-enters the same turn.

## Owner

Codex owns the decision to read this capability, interpret the returned state,
request a more precise probe, and write the final answer. The connector owns
measurement and publication. Helix owns identity, admission, sequence/replay
integrity, provenance, freshness, evidence re-entry and terminal eligibility.

## Inputs and server-owned identity

The model may supply only an optional visible `environment_label`, a bounded
`freshness_requirement_ms`, and `producer_plane` (`world_authority` or
`player_embodiment`). Helix resolves the signed-in Shared Live Room,
current text author or GPT Live speaker, participant-to-player binding,
environment binding, source, world and active action authority server-side.
Credentials, private endpoints, player UUIDs, authority IDs and connector
epochs never enter model arguments, chat, voice or MCP output.

## Integrity and freshness

An accepted batch must have a valid canonical content hash, a current paired
manifest, the exact producer epoch, contiguous sequence numbers and matching
event identities. Reusing a batch or sequence identity with different content
fails closed. Exact replay returns the original receipt.

Each digest stores its own content hash plus `derived_from_event_refs`; the raw
events remain available for audit. Only a schema-valid, hash-valid,
provenance-valid digest inside the requested freshness ceiling receives the
`fresh` outcome and current-turn re-entry eligibility. Missing, stale or
integrity-failed digests are typed failures and cannot support a success claim.

Required flags:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Observation

`helix.environment_situation_digest_observation.v1` returns `fresh` only with a
schema-valid, hash-valid and provenance-valid digest inside the requested age
ceiling. The embedded digest includes producer plane and epoch, exact subject,
event counts, compact situation sections and all source event/snapshot refs.
Other outcomes carry no digest and are ineligible for current-turn re-entry.

## Host Projection

The gateway may show only the visible environment label and freshness request
as executed arguments. Private endpoint, credential, binding, source/world,
player UUID, authority, manifest and producer-epoch identities remain
server-owned. UI and voice may present only Codex's later authorized synthesis,
not the digest as substitute prose.

## Visible Trace

```txt
tool.call.started
environment_situation_digest.read
observation.reentered
agent.message.completed
terminal.eligibility.checked
turn.completed
```

The digest read and its raw event references must share the exact room, player,
world and current turn. A typed stale or integrity failure follows the same
trace and remains visible to Codex for repair.

## Negative cases

Fail closed for missing room membership, unresolved speaker/player identity,
wrong or ambiguous environment, inactive player binding, stale producer epoch,
sequence gap, conflicting replay, cross-room/source/world event, forged subject,
invalid batch or digest hash, absent digest, stale digest, or raw event loss.

## Tests

```txt
server/__tests__/environment-action-contract.test.ts
server/services/environment-connectors/events/__tests__/event-stream-store.test.ts
server/services/helix-ask/workstation-tool-gateway/__tests__/environment-situation-digest.test.ts
server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts
```
