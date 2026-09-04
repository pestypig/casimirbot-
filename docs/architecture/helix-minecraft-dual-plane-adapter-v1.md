# Helix Minecraft dual-plane adapter v1

Status: implementation contract.

The runtime reasoning, simultaneous-lane, advisory-governance and durable-goal
contract shared by Minecraft and future environments is defined in
`helix-environment-agent-reasoning-v1.md`. This document maps that contract to
Minecraft's World Authority and Player Embodiment planes.

The active development gate, dependency order, capability-specific maturity
and required evidence are maintained only in
`docs/helix-environment-harness-work-program-v1.md`.

## Outcome

Minecraft is exposed through one provider-neutral Helix environment catalog and
two independently paired execution planes:

```text
Codex semantic decision
  -> Helix identity, admission, authority, provenance and evidence policy
     -> World Authority Plane: dedicated-server Fabric/Paper connector
     -> Player Embodiment Plane: Fabric client companion
  -> typed observation re-enters Codex
  -> Codex final candidate
  -> Helix terminal eligibility and single writer
```

The existing Fabric server connector remains responsible for live server
observations, Brigadier command discovery, governed exact commands, bounded
world mutation, checkpoints and server-side post-state reads. It is not a
player autopilot.

The Fabric client companion controls only the selected Minecraft client. It may
navigate, look, walk, jump, interact, select a hotbar slot, equip an item and
run admitted higher-level workflows. It never receives host shell, filesystem,
process, credential-store or general code-execution authority.

## Product support ladder

Helix support for an environment is a declared capability tier, not a binary
integration badge. The same provider-neutral northbound interface may expose
progressively deeper tiers as an environment adapter becomes mature:

| Tier                  | Minecraft example                                                                                                         | Authority boundary                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Observe               | status, inventory, hazards, entities and local geometry                                                                   | read-only source credential                                                |
| Advise                | Codex combines current observations with versioned mechanics evidence                                                     | no additional environment authority                                        |
| Player action         | look, track, walk, jump, interact, equip and bounded workflows                                                            | selected-player Fabric lease                                               |
| Reactive guardian     | concurrent camera, locomotion, hand, inventory, world and safety lanes with resource locks, races and one-shot interrupts | explicit `survival_tas` program plus effect ceilings                       |
| World authority       | governed Brigadier commands and exact server-side mutation                                                                | separate server-command lease                                              |
| Workstation lifecycle | detect a compatible installation, prepare a profile, launch and direct-connect                                            | separate operating-system capability; never inherited by the Minecraft mod |

This is the reusable Helix Environment Connector service model: deeper support
means more typed observations, actions, postconditions and recovery behavior,
not wider ambient host access. A user with a compatible Minecraft installation
may be offered the connector automatically by the future Helix harness, but it
is only _available_ at detection time. Installing or modifying a game profile,
pairing a room, selecting a player, and granting player/admin authority remain
explicit user decisions. Read-only observation is the safest initial tier.

The eventual harness distribution should bundle the provider-neutral Minecraft
support pack so a compatible installation is discoverable without a separate
integration hunt. That product promise is represented by explicit lifecycle
states, not by silently controlling every detected game:

```text
bundled -> compatible installation detected -> profile prepared with consent
  -> connector paired -> player selected -> authority granted -> ready
```

Each state is independently observable. `bundled` or `detected` means the
service can offer setup; it does not mean the mod is installed, a room is
paired, or actions are authorized. This same lifecycle applies to future
environment support packs even when their deepest supported tier differs.

The first Windows reference provider is
`scripts/helix-minecraft-launch-fabric-loopback.ps1`. It is deliberately a
Workstation Lifecycle adapter, not part of the Fabric Player Embodiment mod.
For an already installed and previously selected Fabric profile it verifies a
loopback server, enforces the local memory ceiling, reuses a compatible running
client or identifies the actual rendered launcher Play control and starts one,
waits for the Helix mod-load signal, stages a fresh loopback-only auto-join when
needed, and requires the client TCP connection before emitting
`helix.minecraft.workstation_launch_receipt.v1`. It neither reads nor emits a
Minecraft/Microsoft credential. The rendered-control step is a bounded Windows
launcher fallback; structured game capability calls begin as soon as Fabric
loads and remain the primary control plane.

The script is implementation detail behind one server-owned executor and the
provider-neutral capability
`environment.minecraft.fabric_loopback.launch_and_join`. The localhost browser
and packaged EXE render the same lifecycle card and call the same same-origin
operator endpoint. Codex reaches that executor through the workstation tool
gateway after a trusted runtime confirmation receipt, or through the installed
MCP lifecycle tool after the exact developer profile and durable Full Harness
device trust are verified. That trust control explicitly discloses installed
local environment application start/stop authority while withholding all
in-environment action authority. The latter may bootstrap the client before a player
subject exists, but returns `action_authority_id: null`, grants no Minecraft
action, and cannot replace a running client without an exact active Player
Embodiment lease. These are different admission paths into one executor, not
separate browser and desktop launchers.
Neither UI shell receives an executable path, arbitrary arguments, a host shell,
or Minecraft credentials. The packaged runtime stages the fixed script under
its allowlisted runtime root so installed and repository surfaces retain the
same receipt and failure vocabulary.

## Ownership

Codex owns semantic planning, capability selection, tool-result review,
correction and the final candidate. Helix does not select a Minecraft goal or
invent a movement sequence from prompt wording.

Helix owns room/source/world/member/player identity, capability and tool
admission, action-authority leases, approvals, idempotency, provenance,
postcondition evidence, terminal eligibility and debug traces.

The client companion owns only tick-sensitive execution of an already-admitted
request, progress publication, manual-input detection, cancellation, control
release and measured result publication. It never samples a model or writes an
answer.

The Fabric guardian is the first concrete resident closed-loop controller. It
may continuously evaluate the admitted program while Runtime Codex is delayed,
but it cannot expand the program, invent a goal, or become a second reasoning
lane. The future generic resident-controller contract must preserve the same
profile identity, observation revision, effect envelope, local arbiter outcome,
postcondition, abstention/interruption and semantic-escalation evidence.
Learned profiles remain proposal-only until a separately accepted local arbiter
promotion path exists.

## Projected companion embodiment

Minecraft may later expose two embodiment subjects behind the same
provider-neutral catalog:

- `player_proxy` acts through the selected user's client and remains governed
  by the existing Player Embodiment lease; and
- `companion_entity` controls a separate in-world assistant actor through a
  distinct finite actor lease.

This does not create a third ambient authority plane. The companion actor is a
server/Fabric-owned subject whose entity-local navigation, orientation and
presentation are separately admitted. Any block, inventory, command, summon,
weather or other broader world mutation still requires the applicable World
Authority capability and lease. Companion authority never inherits from the
selected player's authority, and player authority never follows from owning or
benefiting from a companion.

The initial projected profile is
`resident.minecraft.companion-follow.v1`. Its bounded repertoire is follow,
hold position, look at an admitted target, move to a nearby admitted waypoint,
return to owner, release controls, or abstain and request replanning. Follow is
one semantic mode executed by native local pathfinding with a declared start
and stop distance band; hysteresis prevents boundary chatter. It stops on
obstruction, stale identity, world/epoch change, lease expiry, manual override
or Emergency Stop and emits current causal evidence.

The binding must carry exact `environment_id`, `world_id`, `connector_epoch`,
`actor_entity_id`, `controller_profile_id`, `authority_subject_id`,
`beneficiary_player_id`, `observation_revision`, and `lease_id`. Actor-owner
association cannot be inferred from proximity. Several room members may be
authorized beneficiaries, but one serialized execution lease controls the
actor. Presence and chunk activity remain finite and bounded; the adapter may
not silently keep arbitrary chunks loaded.

Slow model work runs off the Minecraft tick, while every entity or world effect
returns through the authoritative Fabric/server execution thread and trusted
local arbiter. This profile is reserved for post-G3 EH-RCC3 and must not broaden
the active G3 viability and unexpected-event surface.

The complete projected spawn/bind/admit/activate/suspend/release/despawn state
machine, durable companion versus runtime-incarnation identity, observation
origins, room arbitration, spatial presentation, restart behavior, resource
release and EH-RCC3 acceptance cases are defined in
`helix-minecraft-companion-embodiment-v1.md`.

## Contract locations

- Generic action/workflow lifecycle:
  `shared/helix-environment-action.ts`
- Minecraft player capabilities and typed arguments:
  `shared/helix-minecraft-player-capabilities.ts`
- Typed event stream and compact situation digest:
  `shared/helix-environment-event-stream.ts`
- Existing server command plane:
  `shared/helix-environment-command.ts`
- Existing read-only probe plane:
  `shared/helix-environment-connector.ts`
- Durable action broker and event ledger:
  `server/services/environment-connectors/actions/`
  `server/services/environment-connectors/events/`
- Fabric client companion:
  `minecraft/helix-fabric-player-agent/`
- Shared-room owner authority and pairing surface:
  `client/src/components/helix/ask-console/shared-live-room/SharedLiveRoomPlayerEmbodimentPanel.tsx`

New runtime behavior must not be added to the retired
`server/routes/agi.plan.ts`.

## Comparative reference prompt

Before planning or reviewing this adapter, read
`docs/research/helix-minecraft-environment-adapter-reference-prompt.md`. It is
the compact directory for the Minecraft-God-AI, Pathmind and openai/codex
reference repositories and states the allowed comparison boundary for each.

## Pairing and credential isolation

Observation, server-command and client-action credentials are distinct. A room
may have a healthy observation source while command or player-action authority
is absent. The client-action credential is scoped to one action authority,
environment binding, room, source, world, participant, selected subject and
policy version. It is installed directly in the client companion through a
short-lived pairing flow and is never returned to Codex, MCP results, chat,
debug export or the browser.

Pairing the client companion does not automatically grant actions. An active,
time-bounded authority lease and member ceiling remain required.

For same-host agent-run setup, the Fabric companion may consume an exact
`/helix-player pair ...` command from the bounded local pairing inbox in its
instance config directory. This is only an opaque delivery alternative to
client chat: it creates no authority, uses the same room-generated one-time
code, accepts only a small fresh regular file, atomically claims and deletes it
before redemption, and never exposes its contents to model/debug context. The
inbox cannot contain actions, server commands, credentials or host operations.

## Capability families

Initial client actions:

```text
com.casimirbot.minecraft.player.navigate
com.casimirbot.minecraft.player.look
com.casimirbot.minecraft.player.camera.track
com.casimirbot.minecraft.player.walk
com.casimirbot.minecraft.player.jump
com.casimirbot.minecraft.player.interact
com.casimirbot.minecraft.player.hotbar.select
com.casimirbot.minecraft.player.equipment.equip
com.casimirbot.minecraft.player.workflow.status
com.casimirbot.minecraft.player.workflow.resume
com.casimirbot.minecraft.player.workflow.cancel
com.casimirbot.minecraft.player.emergency_stop
com.casimirbot.minecraft.player.sequence.execute
com.casimirbot.minecraft.player.guardian.execute
com.casimirbot.minecraft.situation_digest.read
```

Reusable workflows:

```text
com.casimirbot.minecraft.player.follow
com.casimirbot.minecraft.player.collect
com.casimirbot.minecraft.player.mine
com.casimirbot.minecraft.player.place
com.casimirbot.minecraft.player.craft
com.casimirbot.minecraft.player.inventory.transfer
```

Unknown mod GUIs or interactions return a typed `capability_unavailable` or
`control_engine_unavailable`. The companion does not fall back to desktop pixel
control or generated host code.

## Capability matrix

| Plane             | Capability family                                          | Current implementation evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Release status                                                                                         |
| ----------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| World Authority   | source manifest, heartbeat, probes and typed world events  | Fabric server connector plus protected room-source ingress                                                                                                                                                                                                                                                                                                                                                                                                                                                     | implemented; keyed live regression still required                                                      |
| World Authority   | exact Brigadier catalog and governed server command        | command broker, member ceilings, one-shot request/result evidence                                                                                                                                                                                                                                                                                                                                                                                                                                              | implemented; hybrid live journeys still required                                                       |
| Player Embodiment | navigate, look, walk, jump, interact, hotbar and equip     | separately paired Fabric client, finite owner-configured UI/API authority, durable action broker and measured postconditions                                                                                                                                                                                                                                                                                                                                                                                   | implemented baseline; keyed live regression still required                                             |
| Player Embodiment | workflow status, resume, cancel and emergency stop         | typed control queue/result lane with control release requirements                                                                                                                                                                                                                                                                                                                                                                                                                                              | implemented baseline; manual-interruption live journey still required                                  |
| Shared evidence   | raw event ledger and situation digest                      | both protected world events and client workflow events enter plane-labeled, content-hashed batches; `com.casimirbot.minecraft.situation_digest.read` re-enters a selected plane                                                                                                                                                                                                                                                                                                                                | implemented deterministic slice; freshness and cross-plane live evidence still required                |
| Player Embodiment | evaluation-only Baritone comparison                        | `BaritoneFacade` discovers the public API only in the isolated non-shipping evaluation profile; product and shipping manifests must omit the engine. The owned successor is specified in `docs/work-packets/eh-g8-environment-spatial-navigation-v1.md`.                                                                                                                                                                                                                                                         | comparison deterministically verified; owned planner remains specified after ET6                         |
| Player Embodiment | follow, collect, mine, place, craft and inventory transfer | Fabric player-agent `0.3.0`, trusted 13-action catalog/profile parity, bounded native workflow engine, action-specific terminal measurements and broker-side scope validation                                                                                                                                                                                                                                                                                                                                  | implemented deterministic baseline; workflow-by-workflow keyed live regression still required          |
| Player Embodiment | fluid survival TAS sequence                                | one provider-neutral sequence capability embeds the existing actions plus tick-addressed input, finite branches and checkpoints; the 20 Hz Fabric interpreter reports world ticks and wall time independently and releases controls on every terminal path                                                                                                                                                                                                                                                     | implemented and unit-tested; direct-Codex and keyed-Helix micro-course evidence still required         |
| Player Embodiment | concurrent reactive guardian                               | Codex authors a finite `helix.minecraft.reactive_program.v1`; Fabric executes same-tick nonconflicting lanes, explicit resource locks, bounded repeat/maintain/event nodes, races and one-shot interrupts. A place action may use exact cells or one bounded `predicted_collision_cell` binding (1-20 ticks, at most six actor-relative blocks); Fabric resolves geometry while Codex still owns locomotion, timing and strategy. Helix validates the resolved cell, settled lane evidence and effect ceilings | direct and keyed water-bucket rescue benchmark live accepted; cross-gap viability, broader unexpected-event and workflow acceptance remain open |
| Lifecycle parity  | direct Codex versus Helix first-divergence comparison      | required trace contract below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | water-bucket rescue accepted; fluid micro-course and workflow-by-workflow parity remain open             |

`implemented baseline` does not mean release-ready. The remaining rows and the
keyed natural prompt/text/voice journeys are required before this contract may
be promoted.

## Workflow lifecycle

Player actions are not modeled as a series of prompt-generated key presses.
Codex requests a typed goal. The client controller executes the tick-sensitive
details and emits an ordered lifecycle:

```text
created -> admitted -> started -> progress*
  -> postcondition_checked*
  -> succeeded | failed | canceled | timed_out | emergency_stopped
```

Progress events are nonterminal observations. A settled result must release all
client controls. A successful result requires every required postcondition to
be satisfied by current evidence. The terminal workflow event carries bounded
action-specific measurements. Helix checks those measurements against the
admitted arguments, mutation limits and inventory-transfer ceiling before the
result can become a current-turn observation. The final action observation then
re-enters Codex before any user-facing success claim.

For reactive placement, `positions` and `position_binding` are mutually
exclusive. The binding is not an adapter-authored rescue plan: it exposes one
measured dataflow edge from a short-horizon collision forecast to a normal
player item-use action. The Fabric runtime resolves one replaceable cell above
the predicted downward collision, enforces the authored horizon and
actor-relative distance, and receives the admitted mutation scope for a second
local region/block check. Its receipt publishes the exact resolved target,
trajectory model, collision tick, reach forecast, item/inventory change and
world mutation. Timeout evidence retains the last runtime summary and target so
Codex can repair the program instead of receiving a generic terminal failure.

For `player.look`, `target_kind: relative_rotation` accepts semantic
`yaw_delta_degrees` and `pitch_delta_degrees`; positive yaw means right and
positive pitch means down. The client resolves one absolute target from the
initial view, turns toward that target without accumulating the delta on each
tick, and records initial, target and final yaw/pitch plus applied deltas and
angular errors. The broker validates those values against the admitted request
and copies only the measurements from the exact accepted terminal workflow
event into `verified_terminal_measurements`. A client-authored result summary
cannot manufacture the terminal pose.

Mutating or ambiguous operations are never automatically replayed. A new user
request is a new action identity.

### Fluid state and observation contract

The fluid sequence is a finite typed program authored by Codex, not an adapter
planner. Its Player Embodiment ruleset is `survival_tas`: only legal client
inputs and the existing typed workflows are executable. The named
`command_assisted_sandbox` ruleset belongs to separately authorized World
Authority, while `copilot_speedrun` is guidance-only. Naming either future
ruleset in the player sequence is a typed admission failure.

The provider-neutral parent for clocks, rolling plan watermarks, progressive
affordance frontiers and interruption timing is
`docs/architecture/helix-environment-time-action-planning-v1.md`. Minecraft's
sequence and concurrent guardian are the capacity reference and compilation
target; their tick vocabulary must not leak into the shared contract. The ET2
compatibility compiler is deterministically verified against both existing
schemas and native engine tests. That evidence does not establish ET6 live
capacity, select a planning horizon or admit unsupported interrupt semantics.

Branch, event, interrupt and checkpoint conditions may read only a bounded vocabulary: tick,
grounded pose, position, health, food, inventory/resource counts, equipped
items/tools, current-focus kind and reachability, exact block state, current
dimension, nearby portal kind, bounded local hazards, recipe craftability,
prior node outcome, checkpoint progress, vertical velocity, a 1-20 tick
collision forecast, and exact support-face placement reach over the same
bounded horizon. The trajectory model is labeled as a vanilla airborne
approximation and reports unsupported water, lava, Elytra or flight regimes
instead of inventing certainty. These are observations, not strategy. Fabric
evaluates them against current client state; Codex decides which conditions
and recovery branches satisfy the user's objective.

Condition evidence is event-triggered. Fabric records the first value observed
for a condition and any later value change, together with its node, world tick,
condition kind and bounded subject identity. It does not publish the same false
value on every 20 Hz poll. This compact stream exposes reachability, resource
or crafting readiness, hazards, equipment, dimension/portal state and
checkpoint progress without raw NBT, arbitrary expressions, model calls or a
second answer writer. The terminal result also retains executed node ids,
per-node outcomes, exact scheduler ticks, separately measured wall-clock time,
deviations, retries and admitted inventory/world-effect counts.

The concurrent scheduler additionally reports the maximum number of lanes
scheduled in one game tick, the number of ticks with more than one scheduled
lane, exact declared-race winners and canceled members, and bounded placement
prediction receipts. Helix admits those receipts only when their race, lane,
target block and horizon match the submitted program. They prove execution
continuity; they do not authorize Helix to choose a rescue or building plan.

A bounded provider retry of the same semantic current-turn request is not a
new action. The broker's idempotency comparison covers authority, exact
environment/player identity, catalog capability/version, arguments,
preconditions, postconditions, approval and constraints. It deliberately
excludes delivery-only workflow/request/condition/tool-call ids and timestamps.
The retry therefore resolves to the original admitted request; changing any
semantic action content under the same key remains a typed conflict. This
deduplication never authorizes the client to execute an ambiguous action again.

### Concurrent reactive-program contract

`com.casimirbot.minecraft.player.guardian.execute` is the provider-neutral
reactive tier. Codex remains the strategy author: it chooses typed actions,
conditions, lanes, races and recovery edges. Helix validates identity, graph
bounds, exact resource ceilings, mutation scope, lease and terminal evidence.
The Fabric companion only advances the admitted program at render/tick cadence.

Camera and locomotion may therefore advance on the same tick, while two lanes
that both require the physical use-key channel serialize through the same hand
resources. Safety lanes may be activated by a one-shot typed interrupt and can
cancel lower-priority work. Every terminal path releases the resources held by
each lane. The terminal evidence includes lane/node state, tick identity,
condition changes, conflicts, interrupts and admitted effect counts; a generic
connector success message is insufficient.

Reactive programs cannot contain arbitrary code, raw Minecraft commands,
shell, files, credentials, model calls or nested programs. Subject-bound
embedded actions remain a typed limitation until nested room/player identity
resolution is implemented; entity and particle tracking use the existing
opaque target identities.

Once the client has executed an admitted action, its workflow event, raw
player-embodiment event batch and terminal result enter a bounded ordered
outbox. The client removes each item only after the corresponding Helix
endpoint acknowledges it. A transport failure retries delivery with the same
event/result identities, not physical execution, and blocks the next action
lease until the outbox drains. Only one network flusher is scheduled at a time,
so an unavailable Helix endpoint cannot create an unbounded executor backlog.
Sanitized diagnostics identify the failed delivery stage and typed error code
without logging payloads or credentials.

## Manual override and emergency stop

The client companion monitors genuine user input while a workflow controls the
player. The authority chooses `pause` or `cancel`; it may not choose to ignore
manual input. On pause, cancel, timeout, disconnect, authority loss, settlement
or emergency stop, the companion releases every key and continuous-use state it
owns.

Manual override is typed evidence, not a generic boolean-only failure. The
client reports one bounded cause from `screen_open`, mouse-button input,
movement/jump/sprint input, or `unexpected_view_change`, together with the
number of action ticks completed before override. A zero-tick cancellation
must not claim that player motion or another side effect occurred. A
`request_canceled` observation with `manual_override_detected` is a
human-intervention boundary for that turn: it re-enters Codex, which reports
the exact cause or asks the user to clear it. It is not automatically retried
as a new physical action in the same turn.

Admission and execution outcome remain separate lifecycle facts. Once the
gateway has admitted and queued a player action, a later manual cancellation
does not retroactively turn admission into `blocked`. The failed observation
retains the executed capability and exact evidence refs, while its typed
`repair_action: ask_user` projects to `retry_recommendation: ask_user`,
`next_action: ask_user`, and `external_change_required: true`. This projection
does not answer for Codex; it prevents a deterministic adapter rail from
silently replaying physical control after the client has yielded to the human.

Emergency stop is a first-class, idempotent capability. It may target one
workflow or every active workflow for the bound client. It remains available
even when ordinary action authority is being revoked and produces a typed
control result proving whether controls were released.

At the provider boundary, the runtime `emergency_stop` tool requires an exact
server-owned `workflow_ref`. Helix resolves that workflow to its action
authority, suspends the authority, enqueues the global client stop and waits
for the typed control observation. The workflow reference is therefore a
non-secret authority locator, not permission supplied by the model. This path
cannot grant host process, shell, filesystem or credential access.

Only one active action authority may survive for an environment and
participant, even when the selected player binding has rotated. Saving a new
authority supersedes all prior active leases in that scope. Read projections
and execution admission both select newest policy version, then newest creation
time, so pairing cannot silently target a different lease than execution.

## Navigation engines

The companion declares its installed engines in its capability manifest.
`native_fabric` is the baseline engine for bounded local controls. `baritone`
is optional and must be advertised before Helix can admit a request that
requires it. Engine selection does not expand the action authority, permitted
distance, block-breaking, block-placement or combat scopes.

Pathmind is an architecture reference only and is All Rights Reserved. Do not
copy its implementation. Baritone integration must use its public API and obey
its LGPL license.

## Implemented workflow envelope

The `0.2.0` client intentionally exposes a truthful bounded slice rather than
claiming universal Minecraft play:

- native navigation uses local view/forward/jump controls; obstacle-aware
  general pathfinding requires a live-declared Baritone engine;
- follow resolves an exact room-bound target identity server-side and runs for
  one admitted interval with a health floor and manual override;
- collect targets matching dropped item entities in loaded client range;
- mine searches loaded blocks within at most 32 blocks, moves into legitimate
  interaction range, and verifies each removed block;
- place accepts at most 256 exact integer positions, requires held blocks and a
  valid support face, and verifies every resulting block state;
- craft uses the current 2x2 inventory grid or an already-open crafting table
  and verifies player-inventory output. Minecraft 1.21.8 exposes a display-book
  identity here, so an exact resource-key `recipe_id` fails with a typed
  limitation until an exact mapping is implemented;
- inventory transfer uses the current or looked-at container, performs bounded
  menu clicks, and verifies the exact player-side item delta.

These limitations are model-visible capability facts. They are not reasons for
Helix to invent a private workflow or silently fall back to server commands.

## Event stream and situation digest

The raw evidence ledger retains typed, ordered events from both
`world_authority` and `player_embodiment` producer planes. A server-owned digest
may coalesce repeated events and summarize actor, inventory, hazards, focus and
active-workflow state for bounded model context. Every digest preserves its
source event/snapshot references, producer plane and epoch, and remains
`environment_situation_digest_not_assistant_answer`.

The digest is an observation, not memory authority or terminal prose. Codex may
request a fresh probe when the compact digest is insufficient.

## Fluid sequence layer

The fluid layer extends Player Embodiment with one provider-neutral capability,
`com.casimirbot.minecraft.player.sequence.execute`. It does not replace or
privately orchestrate the original thirteen player actions. Codex authors one
bounded program; Helix validates its identities, ruleset, graph, lease and
effect ceilings; the paired Fabric client advances the admitted state machine
on the 20 Hz Minecraft client tick.

This removes provider round trips from keypress timing without moving strategy
into deterministic adapter code:

```text
natural objective
  -> Codex observes, decomposes and authors typed sequence
  -> Helix admits exact player/world/ruleset/effect envelope
  -> Fabric executes input segments and existing workflow nodes per tick
  -> Fabric emits compact checkpoints, deviations and terminal measurements
  -> Helix normalizes exact evidence and re-enters Codex
  -> Codex replans or synthesizes; Helix checks terminal eligibility
```

The named rulesets are deliberately different authority products:

- `survival_tas` permits legal automated player inputs and the existing typed
  Player Embodiment workflows. It is the only ruleset admitted by the first
  sequence capability.
- `command_assisted_sandbox` requires a separately authorized World Authority
  command capability. Merely naming this ruleset cannot grant commands to the
  client companion.
- `copilot_speedrun` is guidance-only and leaves input with the player. It is
  not silently upgraded to automated embodiment.

The v1 sequence graph is finite and acyclic. Its node kinds are tick-addressed
input segments, embedded typed workflows, observation checkpoints, finite
branches and explicit success/failure terminals. Repetition remains inside a
bounded typed workflow rather than an arbitrary graph loop. Branch conditions
come from a whitelist of client-observable state such as tick, grounded state,
health, food, position, inventory count, focused object, block state, prior
node outcome and checkpoint status. No condition contains code or a general
expression language.

Every request declares `max_total_ticks`, required checkpoints, scheduler
engine, optimization target, and a mutation scope. Static admission proves
that graph references are valid and reachable, the graph terminates, and every
declared mine/place/inventory effect fits its ceiling. Runtime success still
requires all named checkpoints, a continuous start/completion clock, exact
duration ticks, terminal postcondition evidence and released controls.

The Fabric scheduler must release all owned controls on success, failure,
timeout, cancellation, disconnect, manual override and emergency stop. It may
evaluate an admitted immediate condition locally, but it must not invoke a
model, invent a new goal, synthesize an unadmitted action, replay automatically
or author the final answer. Unexpected state becomes a typed deviation or
failure observation for Codex re-entry.

## Differential acceptance

The first reserved post-G7 integrated Player Embodiment objective is
`docs/work-packets/eh-mc-nether1-legitimate-nether-entry-v1.md`. It combines
the existing typed observations, survival workflows, fluid sequence, reactive
guardian, durable checkpoints, semantic wake, and terminal-parity contracts in
one legitimate Nether-entry journey. The packet is a future acceptance target,
not an implemented `build_nether_portal` capability and not permission to use
World Authority for survival postconditions.

For every workflow, hold the starting world, selected player, permissions,
capability descriptions and requested goal constant. Compare:

```text
direct Codex/reference actuator
  versus
natural prompt -> Helix admission -> companion -> observation re-entry -> Codex
```

The client companion's local `/helix-player diagnostic` lane is the canonical
reference actuator for bounded walk, jump and relative-look comparisons. It
uses the production controller and postcondition measurement code but bypasses
Helix Ask and room admission. Its public JSON events explicitly carry
`helix_terminal_authority_status=not_applicable`; they must never be promoted
to room evidence or an assistant answer. This makes controller success useful
for locating an adapter divergence without weakening the governed path.

Record proposed/admitted calls, ordered progress, final observation refs,
postconditions, candidate hash, route-product hash, terminal-writer hash and
visible/text/voice hash. Stop at the first divergence. Direct execution is a
diagnostic oracle; it does not replace end-to-end Helix acceptance.

Candidate, route-product, terminal-writer, visible-text and voice hashes are
computed over the same canonicalized public answer text. The trace separately
retains observation/support refs at candidate, route-product and terminal-writer
boundaries. This proves that a grounded Codex candidate survived downstream
materialization; identical missing fields in both comparison lanes are not
treated as parity. The differential auditor only reports continuity and never
approves, rewrites, rejects or terminalizes the answer.
