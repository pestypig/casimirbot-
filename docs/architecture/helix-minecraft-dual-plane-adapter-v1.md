# Helix Minecraft dual-plane adapter v1

Status: implementation contract.

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
com.casimirbot.minecraft.player.walk
com.casimirbot.minecraft.player.jump
com.casimirbot.minecraft.player.interact
com.casimirbot.minecraft.player.hotbar.select
com.casimirbot.minecraft.player.equipment.equip
com.casimirbot.minecraft.player.workflow.status
com.casimirbot.minecraft.player.workflow.resume
com.casimirbot.minecraft.player.workflow.cancel
com.casimirbot.minecraft.player.emergency_stop
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

| Plane | Capability family | Current implementation evidence | Release status |
| --- | --- | --- | --- |
| World Authority | source manifest, heartbeat, probes and typed world events | Fabric server connector plus protected room-source ingress | implemented; keyed live regression still required |
| World Authority | exact Brigadier catalog and governed server command | command broker, member ceilings, one-shot request/result evidence | implemented; hybrid live journeys still required |
| Player Embodiment | navigate, look, walk, jump, interact, hotbar and equip | separately paired Fabric client, finite owner-configured UI/API authority, durable action broker and measured postconditions | implemented baseline; keyed live regression still required |
| Player Embodiment | workflow status, resume, cancel and emergency stop | typed control queue/result lane with control release requirements | implemented baseline; manual-interruption live journey still required |
| Shared evidence | raw event ledger and situation digest | both protected world events and client workflow events enter plane-labeled, content-hashed batches; `com.casimirbot.minecraft.situation_digest.read` re-enters a selected plane | implemented deterministic slice; freshness and cross-plane live evidence still required |
| Player Embodiment | optional Baritone navigation | `BaritoneFacade` discovers the public API at runtime; the live manifest advertises the engine only when discovery succeeds | implemented conditional adapter; installed-Baritone keyed live regression still required |
| Player Embodiment | follow, collect, mine, place, craft and inventory transfer | Fabric player-agent `0.2.0`, trusted 13-action catalog/profile parity, bounded native workflow engine, action-specific terminal measurements and broker-side scope validation | implemented deterministic baseline; workflow-by-workflow keyed live regression still required |
| Lifecycle parity | direct Codex versus Helix first-divergence comparison | required trace contract below | pending workflow-by-workflow acceptance |

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

Mutating or ambiguous operations are never automatically replayed. A new user
request is a new action identity.

A bounded provider retry of the same semantic current-turn request is not a
new action. The broker's idempotency comparison covers authority, exact
environment/player identity, catalog capability/version, arguments,
preconditions, postconditions, approval and constraints. It deliberately
excludes delivery-only workflow/request/condition/tool-call ids and timestamps.
The retry therefore resolves to the original admitted request; changing any
semantic action content under the same key remains a typed conflict. This
deduplication never authorizes the client to execute an ambiguous action again.

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

## Differential acceptance

For every workflow, hold the starting world, selected player, permissions,
capability descriptions and requested goal constant. Compare:

```text
direct Codex/reference actuator
  versus
natural prompt -> Helix admission -> companion -> observation re-entry -> Codex
```

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
