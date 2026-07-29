# Environment Connector Read-Only Probe

Status: draft.

Capabilities:

- `com.casimirbot.minecraft.actor.status.read`
- `com.casimirbot.minecraft.inventory.check`
- `com.casimirbot.minecraft.nearby_entities.list`
- `com.casimirbot.minecraft.hazards.scan`
- `com.casimirbot.minecraft.local_map.inspect`
- `com.casimirbot.minecraft.line_of_sight.check`
- `com.casimirbot.minecraft.crop_state.read`
- `com.casimirbot.minecraft.reachability.check`

Internal action: `room.environment.probe`

Observation schema: `helix.environment_connector.probe_observation.v1`

## Purpose

Give a reasoning provider strongly typed, on-demand, read-only inspections
of the exact Minecraft environment already bound to the authenticated Agent API
run. This capability is the first concrete use of the provider-neutral Helix
Environment Connector platform.

It is distinct from passive `room.evidence.read_bound` and from the reserved
future action lane. A passive read cannot initiate this probe. A probe
credential cannot execute a command or mutation.

## Owner

Codex owns semantic tool choice, the native tool call, waiting/retry behavior,
tool-result re-entry, post-observation reasoning, and completion.

Helix owns authenticated run-room identity, current membership and consent,
source admission, immutable package/catalog identity, device and binding
admission, exact provenance, schema validation, evidence identity, and terminal
eligibility.

The outbound connector owns only the admitted native inspection and the
structured result. It cannot select a room, run, turn, tool call, reasoning
provider, terminal product, or visible answer.

## Inputs

The model may provide:

```json
{
  "target": "current_actor",
  "freshness_requirement_ms": 5000
}
```

`target` is required. Actor, inventory, entity, hazard, and local-map reads use
`current_actor`. Line of sight and geometric reachability use `position` plus
an exact `{x,y,z}` object. Crop state uses either `current_focus` or
`position`; a position object is required only for the positioned form.
`freshness_requirement_ms` is optional.

The model must not provide a room, source, world, device, installation,
environment binding, address, credential, producer epoch, adapter identity,
manifest hash, schema hash, catalog snapshot, run ID, turn ID, tool-call ID,
command, selector, or arbitrary native arguments.

## Observation

The durable broker returns a nonterminal
`helix.environment_connector.probe_observation.v1` record. It carries exact
capability/version and evidence identity, a typed outcome, validated result
fields, freshness, provenance validity, current-turn re-entry eligibility, and
any late-result disposition.

Required non-answer flags:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

A result may be provenance-valid yet ineligible for the original turn. Late
results remain evidence and never reopen a completed turn.

## Host Projection

The Codex app-server receives a generated dynamic tool whose model-visible
semantics come from Helix-reviewed descriptor fields. The raw lease token,
device credential, room-source bearer, provider key, private address, and
publisher setup text never enter model context, MCP output, debug export,
chat, terminal text, or the observation.

The provider sends a semantic call. Helix dispatches a durable request, the
outbound connector polls a scoped lease, and the connector submits one
schema-valid result. Duplicate identical results are idempotent; conflicting
results are rejected and audited.

## Visible Trace

The same logical turn must show this order:

```txt
route.proposed
route.committed
tool.call.started
tool.call.completed or tool.call.failed
observation.reentered
agent.message.completed
runtime.turn.completed
terminal.eligibility.checked
turn.completed
```

The observation is not the final answer. Terminal authority must remain blocked
until the observation re-enters and the provider performs a later reasoning
step.

## Negative Admission Cases

The capability must not execute when any of these conditions applies:

- contextual, negated, historical, future/conditional, quoted,
  screen-visible, or mixed-intent command language is not an affirmative
  semantic probe request;
- the caller supplies protected environment or command fields;
- the current Agent API run lacks the read-only database scope or room OAuth
  scope;
- run-room binding, membership, consent, account permission, source
  credential, adapter admission, device credential, environment binding,
  producer epoch, frozen catalog, or schema identity changed;
- no exact connector is available or more than one paired device matches;
- the result comes from the wrong device, binding, capability, adapter, room,
  owner, run, turn, tool call, catalog, or epoch;
- the result is late, stale, oversized, malformed, mutating, or conflicts with
  an accepted result.

Every rejection remains a typed nonterminal observation or gateway failure.
REST, MCP, and room commands remain `command_execution_not_enabled`.

## Tests

Primary deterministic coverage:

```txt
server/services/helix-ask/workstation-tool-gateway/__tests__/environment-probe.test.ts
server/services/environment-connectors/probe/__tests__/durable-broker.test.ts
server/services/environment-connectors/pairing/__tests__/service.test.ts
server/services/environment-connectors/conformance/__tests__/sdk-conformance.test.ts
server/routes/__tests__/environment-connector-platform.test.ts
server/services/helix-ask/agent-providers/codex-native/__tests__/app-server-turn.test.ts
server/services/helix-ask/agent-providers/codex-native/__tests__/workstation-turn-runtime-approval.test.ts
```

Keyed acceptance must add a real Codex-backed tool selection, outbound poll and
submission, current-turn observation re-entry, later provider reasoning, and
single-writer terminal projection.
