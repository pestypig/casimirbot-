# Environment Connector Player Embodiment Actions

Status: implemented deterministic baseline; keyed live acceptance pending.

Capabilities:

- `com.casimirbot.minecraft.player.navigate`
- `com.casimirbot.minecraft.player.look`
- `com.casimirbot.minecraft.player.walk`
- `com.casimirbot.minecraft.player.jump`
- `com.casimirbot.minecraft.player.interact`
- `com.casimirbot.minecraft.player.hotbar.select`
- `com.casimirbot.minecraft.player.equipment.equip`
- `com.casimirbot.minecraft.player.follow`
- `com.casimirbot.minecraft.player.collect`
- `com.casimirbot.minecraft.player.mine`
- `com.casimirbot.minecraft.player.place`
- `com.casimirbot.minecraft.player.craft`
- `com.casimirbot.minecraft.player.inventory.transfer`
- `com.casimirbot.minecraft.player.workflow.status`
- `com.casimirbot.minecraft.player.workflow.resume`
- `com.casimirbot.minecraft.player.workflow.cancel`
- `com.casimirbot.minecraft.player.emergency_stop`

Internal action: `room.environment.player_action`

Observation schema: `helix.environment_action.observation.v1`

## Purpose

Expose a separately paired Fabric client as the Player Embodiment Plane while
the Fabric server connector remains the World Authority Plane. These tools move
or manipulate only the exact room participant's server-observed player. They do
not grant Minecraft server administration, host shell, files, RCON, processes,
credentials, arbitrary client code, or automatic replay.

## Owner

Codex owns semantic planning, capability selection, argument construction,
observation re-entry, repair choice, and final synthesis. Helix owns the exact
room, participant, player UUID, source, world, adapter, capability version,
authority lease, manual-override policy, provenance, evidence identity, and
terminal eligibility. The Fabric client owns only the admitted control step and
postcondition measurement; it cannot author an answer or select a new goal.

## Inputs

The model supplies only semantic action fields plus an optional
`environment_label` when multiple eligible environments need disambiguation:

- navigate: `destination`, `arrival_radius`, `allow_sprint`, `allow_dig`,
  `allow_place`, `engine_preference`;
- look: `target_kind`, target-specific fields, `max_turn_degrees_per_tick`.
  `relative_rotation` accepts `yaw_delta_degrees` and
  `pitch_delta_degrees` in `[-180, 180]`; positive yaw turns right and positive
  pitch turns down;
- walk: `direction`, `duration_ms`, `sprint`;
- jump: `count`;
- interact: `target`, `hand`, `interaction`;
- hotbar select: `slot`;
- equip: `item_id`, `destination`;
- follow: an environment `subject_ref`, desired `distance`, bounded
  `max_duration_ms`, and `stop_below_health`;
- collect: `item_or_block_id`, `count`, and loaded `search_radius`;
- mine: `block_id`, `count`, and a loaded integer `search_radius` of at most 32;
- place: `block_id` and at most 256 exact integer block positions;
- craft: `output_item_id`, `count`, and optional exact `recipe_id`;
- inventory transfer: `direction`, `item_id`, `count`, and current/opened
  container target;
- workflow status/resume/cancel: the exact prior `workflow_ref` and an optional
  semantic `reason`;
- emergency stop: an exact prior `workflow_ref` used only to resolve the
  server-owned player authority, plus an optional semantic `reason`; the
  resulting stop applies to every active workflow for that paired client and
  suspends ordinary actions until the owner configures authority again.

The model never supplies a room, participant, player UUID, source, world,
connector, credential, authority, manifest, catalog, run, turn, tool-call,
retry, replay, approval, or terminal identity. Helix injects `action_kind` from
the selected capability rather than trusting a model-authored duplicate.

## Admission and execution

Admission requires an active room membership, an exact participant-to-player
binding for the current connector epoch, an unexpired action authority, a
separately paired `minecraft.fabric_client.v1` connector, a fresh action
manifest and heartbeat, an exact frozen capability descriptor, and an authority
policy that admits the requested capability and control engine. `approve_each`
remains blocked until a typed current-request approval channel is present.

Each request is one-shot and idempotent. The connector must not automatically
replay an unknown outcome. Long-running controls emit ordered progress and
settled events, accept cancellation, release input on manual override or
disconnect, and obey the room owner's emergency stop. Optional Baritone use is
admitted only when its exact capability is declared by the live client.
Status, resume, and cancel travel through a distinct typed control request and
`helix.environment_action.control_observation.v1`. Resume is admitted only for
a workflow paused under the `pause` manual-override policy. Cancel always
requires the client to release every asserted control.

## Host Projection

Codex receives generated semantic tools for the 13 admitted action
capabilities plus separate typed workflow controls.
The paired-client endpoint, action token, room/source/world IDs, player UUID,
authority lease, connector epoch, private address, and setup material remain
server-owned and never enter model arguments, chat, MCP results, voice output,
or debug exports. The outbound-only client polls the broker and returns typed
events and results under its separate action credential.

## Observation and postconditions

The connector returns a nonterminal `helix.environment_action.observation.v1`
with exact request/workflow/execution identity, outcome, bounded result,
progress references, postcondition evidence references, freshness, provenance,
and current-turn re-entry eligibility.

Minecraft workflow heartbeats and events may also carry a typed
`helix.environment_clock_snapshot.v1`. The Fabric client records a monotonic
client `tick_index`, the nominal `20` TPS rate, and the synchronized
`world_tick_index` when it is connected. Settled results expose the exact
`started_clock`, `completed_clock`, and `duration_ticks`; the shared schema
requires the duration to equal the completed/start tick delta on the same
clock. Helix preserves those fields in the action observation so Codex can
reason about local sequencing without treating nominal TPS as measured wall
time.

`completed` means the action-specific postcondition was measured and satisfied;
dispatch acceptance alone is not completion. A missing, stale, contradictory,
or unsatisfied check yields `postcondition_failed` or
`action_outcome_unknown`. Failed attempts remain immutable provenance.

The terminal `helix.environment_action.workflow_event.v1` carries a bounded
`measurements` record. Helix validates action-specific proof—destination
radius, view error, motion distance, confirmed jumps, accepted interaction,
selected equipment, follow interval, item delta, removed blocks, exact placed
positions, crafted output or transfer delta—and enforces the admitted mutation
and inventory ceilings. A generic `workflow.succeeded` marker without those
measurements is insufficient.

The public action observation exposes `verified_terminal_measurements` only
after Helix has found the exact terminal workflow event for the same action,
workflow, execution, connector epoch and provenance envelope. For relative
look, this contains requested deltas, initial/target/final yaw and pitch,
applied deltas and angular error. This field is derived from the accepted event
ledger; the client result body cannot independently promote measurements into
model-visible evidence.

## Bounded implementation notes

Version `0.2.0` supports native local steering and conditionally declares
Baritone navigation only when its public API is installed. Follow targets are
resolved to native identity by Helix and that identity is never returned to
Codex. Collect covers dropped item entities. Mine is limited to loaded blocks
within 32 blocks. Place requires exact positions, an available block and a
support face. Craft uses the player grid or an already-open crafting table;
supplying an exact resource-key `recipe_id` currently returns a typed
limitation because the 1.21.8 client recipe book exposes display identities.
Inventory transfer requires a current or looked-at server menu.

Required authority flags:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

Codex must receive the observation in the same turn and perform a later model
step before Helix may authorize a terminal answer. Text and voice must project
the same authorized post-re-entry product.

## Visible Trace

The same logical turn must preserve this order:

```txt
route.proposed
route.committed
tool.call.started
environment_action.request.enqueued
environment_action.request.leased
environment_action.progress.recorded
environment_action.result.recorded
observation.reentered
agent.message.completed
terminal.eligibility.checked
turn.completed
```

A cancellation, manual override, emergency stop, postcondition failure, or
unknown result takes the same trace through a typed failed observation; it does
not skip re-entry or become substitute answer prose.

## Negative cases

Fail closed for a quoted, negated, historical, future, conditional, or merely
screen-visible action; missing or stale identity; cross-participant action;
wrong room/source/world/player/connector epoch; expired or insufficient
authority; stale manifest or heartbeat; capability-version drift; unavailable
engine; missing approval; manual override; emergency stop; conflicting
idempotency reuse; malformed or forged result; failed postcondition; ambiguous
outcome; late result; host escape; or automatic replay request.

Every rejection is a typed observation or gateway failure with a stable reason
and repair disposition. It must not be silently rewritten into success or used
as a competing assistant answer.

## Tests

Primary deterministic coverage:

```txt
server/__tests__/environment-action-contract.test.ts
server/db/migrations/__tests__/046_environment_action_plane.spec.ts
server/services/environment-connectors/pairing/__tests__/bootstrap-service.test.ts
server/services/environment-connectors/actions/__tests__/action-result-canonicalization.test.ts
server/__tests__/environment-action-profile-catalog-parity.test.ts
server/services/helix-ask/workstation-tool-gateway/__tests__/environment-action.test.ts
server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts
minecraft/helix-fabric-player-agent/src/test/java/com/casimirbot/helixplayer/fabric/PlayerActionControllerTest.java
```

Keyed acceptance must prove natural prompts through the provider gateway,
separate client pairing, exact-player execution, typed progress and
postcondition evidence, observation re-entry, later Codex synthesis, manual
interruption, emergency stop, and text/voice terminal parity.
