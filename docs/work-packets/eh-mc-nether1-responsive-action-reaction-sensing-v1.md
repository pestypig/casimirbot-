# EH-MC-NETHER1 responsive action/reaction sensing plan v1

Program gate: G8 — Environment-harness release evaluation; supporting N0 work for the reserved post-G7 Minecraft integration objective
Workstream: Minecraft Player Embodiment sensing, continuous-control responsiveness, optional pathing-engine integration, and compact evidence re-entry
Capability or component: General responsive sensing and consecutive action/reaction substrate for legitimate survival objectives
Lifecycle stage: execution; secondary stages are observation normalization, evidence re-entry, and short semantic replanning
Reaction timescale: continuous control at the Minecraft client tick, bounded local reflex within one tick, event-driven semantic wake, and durable checkpoint planning
Authority owner: Runtime Codex owns semantic strategy and finite-program authorship; Helix owns identity, admission, authority, effect ceilings, provenance, evidence, and terminal eligibility; the Fabric companion owns only admitted tick-sensitive sensing, arbitration, execution, verification, and control release
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: pinned primary-source research; deterministic sensor, scheduler, cancellation, replay, and performance tests; an installed Fabric/optional-Baritone capability manifest; controlled N0 micro-courses; and later A0 direct, A1 Codex-through-MCP, and B keyed-Helix first-divergence traces
Explicit non-goals: no portal-specific planner, prompt-specific walkthrough, model call per tick, second answer writer, unrestricted Baritone mutation, Mineflayer or AltoClef runtime embedding, copied third-party internals, World Authority substitution, commands, creative inventory, teleportation, arbitrary code, host shell, credential exposure, or N1/N2 acceptance claim
Downstream gate unlocked: N0 responsiveness and workflow-composition evidence required for an honest N1 controlled-world GO decision

## Purpose and dependency statement

The user should be able to state a natural objective while the player responds
smoothly enough to look embodied rather than remotely puppeted one isolated
keypress at a time. Smoothness does not move strategy into the adapter. It
comes from an already-admitted local controller continuously sensing, advancing
one finite action/program, verifying its effects, and handing meaningful
changes back to Runtime Codex.

This packet is allowed during G8 because the canonical work program explicitly
permits the reserved Nether objective's N0 capability-readiness course. It does
not depend on an open pre-G8 prerequisite and cannot perturb the selected
installed-profile connection-broker packet: it changes neither credential
classes nor installed-node authority. Any future runtime implementation remains
inside the existing Player Embodiment lease and canonical lifecycle.

The target loop is:

```text
admitted semantic action or finite program
  -> capture one tick-consistent local observation revision
  -> derive bounded affordances, hazards, and deviations
  -> arbitrate exact owned resources and higher-priority safety
  -> advance continuous camera/locomotion/hand behavior
  -> measure the post-tick result
  -> continue locally when the admitted contract still applies
  -> emit only meaningful deltas, checkpoints, or terminal evidence
  -> wake Runtime Codex when semantics, viability, or strategy must change
```

The Fabric game thread remains authoritative for Minecraft reads and effects.
Asynchronous work may prepare immutable calculations for a later tick, but it
may never touch live game state or assert controls off-thread.

## Research method and boundary

Research was performed on 2026-08-24 from primary project documentation,
official API documentation, and first-party repositories. External projects
are comparative references. Their successful behavior is not evidence that the
Helix capability is implemented or accepted.

| Reference | Useful pattern | Boundary for CasimirBot |
| --- | --- | --- |
| [Fabric `ClientTickEvents` API](https://maven.fabricmc.net/docs/fabric-api-0.95.0%2B1.20.4/net/fabricmc/fabric/api/client/event/lifecycle/v1/ClientTickEvents.html) | Separate start/end client and world tick hooks; end-world-tick may begin asynchronous preparation for the next tick. | Use the Fabric API version pinned by the 1.21.8 companion and verify its exact signatures. Capture and apply live state only on the client thread. |
| [Baritone repository and public API](https://github.com/cabaletta/baritone), [feature description](https://github.com/cabaletta/baritone/blob/1.19.4/FEATURES.md), and [official releases](https://github.com/cabaletta/baritone/releases) | Goal-based A* navigation, segmented paths, calculation of the next segment while the current segment executes, chunk-aware planning, explicit costs, and public cancellation/status APIs. Official release `v1.15.0` declares Fabric support for Minecraft 1.21.6, 1.21.7, and 1.21.8, matching the companion's Minecraft 1.21.8 baseline. | Treat `v1.15.0` only as the compatibility candidate. Optional public-API integration requires an exact artifact checksum, API probe, and LGPL-3.0 compliance packet before installation or distribution. Do not use unsupported internal classes. A navigation request must not inherit block breaking, placement, sprint, or hazard permissions. |
| [Baritone `IBaritoneProcess`](https://baritone.leijurv.com/baritone/api/process/IBaritoneProcess.html) and [`PathingBehavior`](https://github.com/cabaletta/baritone/blob/1.19.4/src/main/java/baritone/behavior/PathingBehavior.java) | Active processes arbitrate every tick by priority; the selected process receives calculation failure and safe-cancel state; pathing distinguishes requested pause, safe segment cancellation, and global process cancellation. | Reuse the concepts through the supported API. Helix remains the only authority and resource arbiter; Baritone cannot become a second goal planner. |
| [Mineflayer API](https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md) | Event-driven health, breath, entity, block, window, and connection sensing; physics-tick timing; explicit control states and `clearControlStates`; promise-based postconditions for dig, place, equip, craft, and containers. | Architecture reference only. Do not embed a second Node bot, authentication stack, world model, or action authority in the Fabric client. |
| [Mineflayer Pathfinder](https://github.com/PrismarineJS/mineflayer-pathfinder) | Dynamic/composite goals, bounded per-tick search work, automatic replanning after world changes, typed `path_update` results, and `path_reset` reasons including block update, chunk load, dig/place error, and stuck. | Adopt typed status and deviation vocabulary, not its runtime. Preserve Helix observation identity and the Fabric player's exact physics. |
| [AltoClef](https://github.com/gaucho-matrero/altoclef) and its [task-chain design](https://github.com/gaucho-matrero/altoclef/wiki/1%3A-Documentation%3A-Big-Picture/3abb2d0db4840228392e19bbf8808d3e2a1fc6a3) | A user task can be temporarily preempted by higher-scoring food or mob-defense chains, then resumed; unreachable targets are remembered so the bot does not repeat unchanged failures. | Archived Fabric 1.18/MIT design reference only. Do not import its task runtime or hardcoded survival strategy. Express preemption through existing Helix/Fabric lanes, locks, guardian coverage, and immutable failed-attempt evidence. |

### Research conclusion

The useful common pattern is not “install a bot and let it decide everything.”
It is a four-layer decomposition:

1. an event/tick observation substrate;
2. a locally persistent goal or finite program;
3. a deterministic priority/resource arbiter with safe cancellation; and
4. compact typed outcomes that trigger a slower planner only when meaning changes.

CasimirBot already has much of layers two through four in
`ConcurrentReactiveScheduler`, `MinecraftViabilityGuardian`, the action
controller, the durable outbox, and the live-mail wake bridge. The immediate
gap is a richer, tick-consistent sensing/affordance layer and a more truthful
optional path-engine adapter.

## Current implementation baseline

The current companion already provides:

- a 20 Hz Fabric action runtime and finite action lifecycle;
- simultaneous camera, locomotion, hand, inventory, world, and safety resource
  lanes inside an admitted reactive program;
- condition-change evidence rather than repeated identical 20 Hz messages;
- resident viability decisions, manual override, Emergency Stop, bounded
  control release, and an acknowledged ordered delivery outbox;
- compact player, focus, inventory, portal, hazard, trajectory, and workflow
  state in direct and governed observations; and
- a reflection-only optional `BaritoneFacade` that currently exposes only
  exact `GoalBlock`, `isPathing`, and `cancelEverything` behavior.

The N0 live course exposed the first concrete gaps:

- a block may be inside nominal interaction range but lack an actual raycast
  focus from the current eye pose;
- local native navigation does not yet reason over alternative approach poses
  or obstacles generally;
- the current Baritone facade does not expose goal shape, path status,
  calculation failure, reset reason, safe cancellation, or mutation policy;
- workflow-local progress summaries are useful after settlement but are not a
  complete low-latency sensor frame for consecutive action handoff; and
- host memory pressure can invalidate an otherwise correct live trial, so
  responsiveness evaluation must include resource budgets.

## Proposed architecture

### 1. Tick-consistent sensor frame

Add an internal immutable `PlayerSensorFrame` captured once per client tick.
Every derived condition and controller decision for that tick uses the same
frame and `observation_revision`. The initial bounded fields are:

- client/world tick, wall-clock monotonic time, connection, dimension, world
  and connector epoch;
- player feet/eye pose, yaw/pitch, velocity, grounded/collision, health, food,
  air, swimming, fire/lava, active effects, selected slot, both hands, armor,
  current screen, and controls owned by Helix;
- current crosshair hit plus an exact fresh raycast, hit face, distance,
  reachability, and occlusion reason;
- nearby bounded block collision shapes, fluids, dangerous blocks, replaceable
  cells, support faces, portal blocks, dropped items, relevant entities, and
  loaded-chunk boundary;
- inventory revision and counts, container/window revision, recipe/craftability
  revision, and pending server-confirmed inventory transaction; and
- active workflow/program/lane/node, held resources, guardian state, path-engine
  state, last progress marker, and last meaningful deviation.

Raw NBT, credentials, unrelated entities, arbitrary expressions, and unbounded
chunk scans remain excluded.

### 2. Derived affordance graph

Derive a small ephemeral graph from the sensor frame. It is an observation,
not a plan:

```text
target candidate
  -> visible/clickable faces
  -> legal standing/eye approach poses
  -> current direct reach and raycast result
  -> bounded path-engine reachability/status
  -> required tool/hand and predicted action duration
  -> nearby hazards and mutation implications
```

The first slice should cover block mining, looked-at interaction, support-face
placement, dropped-item collection, and container access. The graph must label
unknown/unloaded geometry and must never infer reachability from Euclidean
distance alone.

For the observed stone failure, the sensor should report that the stone is
nominally near but currently occluded, enumerate candidate visible faces and
approach poses, and allow the admitted mining workflow to reposition toward one
pose before reacquiring an exact raycast.

### 3. Six deterministic tick phases

Use explicit phases so consecutive actions cannot fight over stale state:

1. `capture`: freeze the current sensor frame;
2. `derive`: evaluate conditions, hazards, affordances, and path deviations;
3. `arbitrate`: apply priority and resource locks;
4. `act`: assert only the exact controls/effects owned by the admitted action;
5. `verify`: capture post-effect facts available in the same/end tick; and
6. `publish`: append meaningful condition changes, checkpoints, or terminal
   evidence and prepare immutable async work for a later tick.

Priority is fixed by authority, not by adapter strategy:

```text
Emergency Stop / authority loss / disconnect
  > genuine manual override
  > admitted resident safety interrupt
  > active admitted action or finite program
  > speculative read-only path preparation
  > idle
```

An action may hand resources directly to its next already-admitted node after a
verified postcondition. It may not invent that node or skip Codex-authored
branches.

### 4. Optional Baritone adapter v2

Expand `BaritoneFacade` only through the installed public API and only after an
exact compatibility/license packet is pinned. The provider-visible manifest
should declare:

- installed Baritone version and public API compatibility;
- supported goal forms such as near-position, adjacent-to-block, and
  visible-face/interaction stance when the installed API exposes them;
- current path state: idle, calculating, executing, paused, safe-to-cancel,
  reached, partial, calculation-failed, stuck, or canceled;
- current/next segment progress and a bounded deviation/reset reason;
- the exact navigation mutation policy for this request; and
- whether the engine can satisfy the admitted goal without world mutation.

Default navigation must forbid Baritone-owned breaking and placement. A future
request that permits either must declare exact world/inventory ceilings and
still pass through Helix/Fabric postcondition validation. Mining should use
Baritone to obtain an admitted approach pose, then use the existing exact
Fabric raycast and game-mode controller for the target mutation.

The adapter must cancel Baritone on settlement, manual override, lease loss,
disconnect, Emergency Stop, path-policy mismatch, or resource preemption. A
generic `isPathing=false` is not success; the exact goal postcondition decides.

### 5. Delta and wake policy

Local sensing remains 20 Hz. Network evidence does not.

Emit immediately when:

- a hazard or manual/Emergency Stop boundary activates;
- identity, authority, dimension, world, connection, screen ownership, or
  loaded-region validity changes;
- a path becomes stuck/no-path or an action loses its required target;
- a postcondition changes, a checkpoint is satisfied, or a workflow settles;
  or
- the admitted repertoire cannot continue without semantic replanning.

Coalesce routine pose/path progress to a bounded cadence and include the first,
latest, minimum/maximum, and change count with exact source revisions. Never
publish identical false conditions every tick. The wake bridge receives one
deduplicated semantic event, not the raw sensor stream.

### 6. Consecutive survival action example

For an admitted request to mine and collect eight stone-derived blocks:

```text
select matching loaded candidate
  -> inspect faces and legal approach poses
  -> continuously approach while camera tracks the chosen face
  -> require exact current raycast and correct equipped tool
  -> mine through the normal game-mode controller
  -> observe block removal and drop/inventory delta
  -> mark that exact target complete or unreachable
  -> select the next candidate without a model round trip
  -> stop on the requested count, hazard, changed authority, or bounded failure
```

This is one generic admitted workflow with repeated verified subtargets. It is
not a portal walkthrough. Runtime Codex still decides why stone is needed and
what semantic milestone follows.

## Responsiveness and resource budgets

These are proposed deterministic test targets, not current measurements:

| Budget | Initial target |
| --- | --- |
| Sensor frame capture plus bounded derivation | p95 at or below 4 ms per client tick; no individual tick above 10 ms in the N0 fixture |
| Emergency/manual/lease-loss control release | same tick when observed, otherwise by the next client tick |
| Guardian condition-to-local response | at most one client tick after a fresh applicable frame |
| Already-admitted node-to-node handoff | no idle control gap longer than one tick unless the graph declares a wait/checkpoint |
| Path planning on the client thread | zero unbounded searches; asynchronous or incrementally yielded planning only |
| Routine progress publication | at most 5 Hz per active workflow, plus immediate meaningful events |
| Semantic wake | one deduplicated wake per causal change/revision until consumed or materially revised |
| Stuck detection | explicit motion/progress window with typed closest-progress evidence; never indefinite |
| Memory | pause new heavy work at 90% host use; stop the active heavy phase and preserve state at 95% |

Minecraft client FPS/TPS, sensor/derive/arbitrate/act/verify durations, GC pauses,
path calculation time, queue depth, and evidence flush latency must be measured
separately from model deliberation and terminal synthesis.

## Work plan

### R0 — Baseline and instrumentation

- Add per-phase timing counters and a bounded in-memory ring buffer with no raw
  credentials or unrelated game data.
- Capture a replay fixture for the current near-lava stone focus failure and a
  successful crafting/equip interaction.
- Measure current client tick time, frame rate, workflow gaps, event volume,
  memory, and provider latency separately.
- Stop if instrumentation changes controller decisions or exceeds the proposed
  tick budget.

Exit evidence: deterministic timing/replay tests and one baseline report. No
capability maturity promotion.

### R1 — Sensor frame and meaningful deltas

- Introduce the immutable frame and revision contract.
- Move existing player-only predicates to the shared frame.
- Add screen/container, focus/raycast, inventory transaction, dimension/portal,
  chunk-boundary, path-state, and control-ownership deltas.
- Prove identical state does not create repeated evidence or semantic wakes.

Exit evidence: unit/property tests for frame consistency, delta coalescing,
stale revision rejection, and event ordering.

### R2 — Target affordances and approach poses

- Enumerate exposed/clickable faces and bounded collision-safe approach poses.
- Separate nominal distance, line of sight, exact raycast, support reach, and
  path reachability.
- Mark failed target/approach pairs with a bounded reason and avoid ping-pong
  reselection until a relevant world revision changes.
- Apply the generic model to mine, interact, place, collect, and containers.

Exit evidence: the recorded stone failure replays into a materially different
bounded approach or an accurate no-path result; no indefinite walk or repeated
unchanged target.

### R3 — Phased scheduler and handoff continuity

- Make capture/derive/arbitrate/act/verify/publish order explicit.
- Preserve exact resource ownership across an already-admitted handoff without
  leaking controls.
- Add safe pause/resume semantics for resident-safety preemption.
- Verify every terminal, cancellation, disconnect, and override path releases
  controls and optional pathing.

Exit evidence: deterministic concurrency, race, preemption, cancellation, and
one-tick handoff tests.

### R4 — Optional Baritone adapter v2

- Evaluate official Baritone `v1.15.0` as the Minecraft 1.21.8/Fabric candidate;
  pin its exact artifact checksum, loader/API compatibility, and license notice
  before installing or distributing it.
- Use only `baritone.api` surfaces; advertise the engine only after live
  discovery and compatibility checks.
- Add goal/status/cancel/deviation projection and mutation-disabled navigation.
- Differentially test native and Baritone approach behavior from the same
  frames, without making Baritone required for the baseline harness.

Exit evidence: installed manifest, no-mutation navigation receipts, safe-cancel
tests, version mismatch failure, and one live controlled approach trace.

The pinned artifact, license boundary, admitted public API, movement-only
settings lease, and stop criteria are recorded in
[`eh-mc-baritone-v1.15.0-compatibility-license-v1.md`](eh-mc-baritone-v1.15.0-compatibility-license-v1.md).

### R5 — N0 consecutive-action micro-courses

Run independently:

1. focus-reposition-mine-collect eight cobblestone;
2. return to/open a crafting table, craft and place a furnace;
3. open/load/observe/collect one furnace smelt;
4. place and ignite a controlled survival portal frame;
5. transition dimensions, stabilize, observe the return portal, and return;
6. inject obstruction, target loss, screen opening, lava/fire, manual override,
   disconnect, and lease expiry cases.

Every course records sensor revisions, admitted requests, path status,
condition changes, mutations, checkpoints, deviations, terminal postconditions,
control release, tick timing, wall time, memory, and artifact hashes. Controlled
fixture provisioning remains separate World Authority setup and cannot satisfy
an authentic Player Embodiment postcondition.

### R6 — A0/A1/B differential acceptance

- A0 direct Fabric proves local mechanics and timing.
- A1 authenticated Codex-through-MCP proves admission, delivery,
  normalization, and evidence re-entry.
- B keyed Helix proves the unchanged natural objective, Codex continuation,
  terminal candidate, UI/API and applicable voice continuity.
- Restore equivalent state and stop at the first divergent lifecycle stage.

Exit evidence: observer-only parity report with exact identities and hashes.
Direct success alone does not promote Helix or N1 readiness.

## Deterministic verification matrix

| Case | Required result |
| --- | --- |
| Same frame consumed by two conditions | identical revision and values; no mixed-tick result |
| Block inside nominal reach but occluded | `focus_reachable=false` plus reason and candidate approach poses; no immediate false mine success |
| Target becomes visible while approaching | exact raycast gates mining; approach controls transfer cleanly to mining |
| Candidate becomes blocked/unloaded | typed deviation; stale candidate invalidated; bounded replan or failure |
| Repeated unreachable target | target/approach failure retained until a relevant world revision changes |
| Baritone unavailable or wrong version | manifest omits engine or reports typed incompatibility; native baseline remains available |
| Baritone navigation with no mutation scope | no break/place effects; policy violation cancels and fails closed |
| Safety event during active path | safety preempts; path and controls release; original workflow remains resumable only through admitted semantics |
| Manual screen/input | same/next-tick release and typed override; no automatic physical replay |
| Inventory server acknowledgment delayed | one request, pending transaction observation, server-confirmed postcondition, no swap oscillation |
| Dimension/world/epoch changes | active proposals and paths become stale and cannot resume under the old identity |
| Evidence transport unavailable | local controls release or settle according to policy; ordered evidence is retained without physical replay |
| Stable unchanged play | no 20 Hz network spam and no repeated semantic wake |
| Memory reaches 95% | active heavy evaluation stops safely; world server and evidence are preserved |

## Stop/fail criteria

Stop the slice and retain its evidence when:

- the design needs a second semantic planner or private tool loop;
- a sensor cannot bind to one exact frame/world/player/epoch revision;
- off-thread code reads or mutates live Minecraft state;
- Baritone can perform an effect outside the admitted mutation policy;
- a path/action can hang without a finite timeout or progress bound;
- safety, manual override, cancellation, lease loss, or disconnect leaves a
  control asserted;
- routine events overwhelm the outbox, wake bridge, model context, or host;
- credentials, raw pairing material, unrestricted host state, or hidden
  reasoning enter an observation or artifact;
- direct feasibility fails and the proposed response is to patch Helix prompt
  interpretation instead of the general capability; or
- host memory reaches the existing 95% safety boundary.

## Immediate next slice

The recommended first implementation packet is R0 plus the smallest part of
R1/R2 needed to model the observed stone failure:

1. capture exact focus/raycast, exposed face, candidate approach pose, motion,
   collision, and progress in one sensor revision;
2. replay the current failure deterministically;
3. prove the workflow either reaches a valid approach and mines or returns a
   typed bounded no-path result;
4. verify no control leak and no repeated unchanged target; and
5. measure tick cost before adding or installing Baritone.

This order tells us whether richer native sensing is sufficient. Baritone then
solves a measured navigation problem instead of concealing a sensing defect.

## Implementation checkpoint — 2026-08-24

The first R0-R3 slice is implemented in the Fabric 1.21.8 companion:

- `PlayerSensorFrame` captures one immutable world-revision/game-tick-bound
  position, velocity, collision, screen/manual state, and exact focus sample;
- repeated consumers in the same world tick reuse that frame rather than
  mixing pre- and post-camera state;
- `MiningTargetAffordance` performs a constant-ceiling search for a two-block-
  clear, supported stance within three horizontal blocks of an already-selected
  mining target;
- mining binds focus verification, target face, approach progress, collision,
  and typed failure evidence to the sensor frame;
- typed native failures distinguish no approach pose, approach stall, focus
  stall, and focus-unreachable outcomes; and
- the existing reactive scheduler has explicit deterministic evidence that a
  settled action releases its resources and starts its next admitted action in
  the same game tick.

Local evidence: the clean Fabric companion test/build completed with 133 tests,
zero failures, zero errors, and remapped
`HelixFabricPlayerAgent-0.4.0.jar` SHA-256
`70118231D45035634D6C24CB2DD19DC03DEE011544EDC6DF489848E6F2041E6A`.
The controlled A0 course then removed three consecutive stone targets through
ordinary survival Player Embodiment in 45 ticks, verified all three world
mutations, released controls, and reported 45 bounded timing samples with
0.338 ms p95 and 1.305 ms conservative maximum sensor-plus-affordance cost.
The public, hidden-reasoning-free capture is
`reports/helix-minecraft/nether1-responsive-stone-sequence-a0.json`.

This advances the exact responsive sensing/consecutive-mining component to
`deterministically verified`. It does not advance the legitimate durable Nether
entry capability: the remaining N0 compositions, keyed A1/B re-entry and
terminal-authority traces, and unknown-world portal-entry/return demonstration
remain required.

## R4 verification checkpoint — 2026-08-24

The measured navigation gap justified a narrow optional Baritone adapter. The
v1.15.0 public-API-only movement lease, cancellation/restoration behavior,
pre-existing-task rejection, policy-drift response, installed manifest, and
zero-mutation controlled trace are now `deterministically verified`. The full
record is
[`eh-mc-baritone-v1.15.0-compatibility-license-v1.md`](eh-mc-baritone-v1.15.0-compatibility-license-v1.md),
with the public trace at
`reports/helix-minecraft/nether1-baritone-movement-only-a0.json`.

R5 is the active next slice. Its contract surface passes the 165-check N0
readiness audit, but the furnace, portal, transition, return-viability,
post-transition guardian, and durable recovery courses still need live
evidence. R6 remains blocked behind those courses and a refreshed authenticated
Minecraft multiplayer session.

The reproducible course planner later expanded that audit to 174 checks and 12
contract files. Offline mechanics review repaired furnace menu re-entry,
support-face-first flint-and-steel use, tool-durability observation, and
connected portal-block mutation accounting before the first live ignition
attempt. The full Fabric companion build now passes 140 tests with zero
failures. These repairs make R5 executable; they are not substitutes for its
remaining live receipts.

## Keyed A1 action/reaction checkpoint — 2026-08-24

OAuth reauthorization and the keyed local-server catalog are current. No
additional Codex restart was needed after the refreshed tools became callable.
The exact room projected one active Fabric environment, one fresh online player
subject, and an active self-binding for the current room owner.

The first live connector admission exposed two contract divergences rather than
a gameplay defect. The installed Fabric companion truthfully advertised the
optional Baritone movement-only lease and detailed Baritone heartbeat state,
while the shared server schemas still admitted only the older generic engine
shape. The shared contract now admits only these exact safe variants:

- native Fabric is available and version identified;
- unavailable Baritone carries no version or implied capability;
- available Baritone identifies its version, supports only `near_position`,
  declares `movement_only`, and explicitly forbids breaking, placement, and
  inventory mutation; and
- Baritone heartbeat state retains goal ownership, process activity, policy
  integrity, safe-cancel result, bounded error, and optional remaining-tick
  estimate. Duplicate engine identities fail closed.

After the keyed server reloaded that contract, the existing player authority
reached `ready`: its manifest was admitted, both engines were visible, its
heartbeat was active and fresh, no workflow or control remained asserted, and
manual-input and Emergency Stop flags were clear.

One no-displacement `look_at/current_focus` A1 action then completed through the
authenticated MCP route in the same client tick. It produced an exact request,
execution, workflow, and evidence identity; satisfied the action-specific
postcondition; retained the measured view; performed no interaction,
inventory, or world mutation; detected no manual override; and released all
controls. Its provenance was valid and the observation was eligible for current
Codex re-entry.

The first actor-status probe correctly failed closed because the room owner was
marked away. After the owner used the room's typed presence control to become
present, the immediate retry succeeded with valid provenance and 160 ms
freshness age. It observed survival mode, full health and food, the Overworld,
the current pose, and an interaction-range grass-block focus. This proves a
live keyed A1 `action -> normalized evidence -> room-presence repair -> fresh
observation` loop; it does not prove furnace, portal, or dimension mechanics.

The public evidence summary is
`reports/helix-minecraft/nether1-keyed-a1-action-reaction-20260824.json`.
Focused shared-contract and admission-lease tests pass. The required Casimir
adapter verification also returned `PASS`, no first failure, certificate status
`GREEN`, and integrity OK for certificate hash
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.

R6 is therefore partially evidenced at A1 for one bounded action/reaction pair,
but it is not accepted: B keyed-Helix natural-objective/terminal-authority parity
and the remaining R5 live compositions are still open. The full Nether journey
must not begin until the controlled World Authority snapshot/setup/release
boundary is ready and the live furnace, portal ignition, transition, viable
arrival/return-portal, post-transition guardian, and durable recovery courses
have passed without command substitution.

## Governing references

- `docs/helix-environment-harness-work-program-v1.md`
- `docs/architecture/casimirbot-environment-harness-product-goal-v1.md`
- `docs/architecture/helix-environment-agent-reasoning-v1.md`
- `docs/architecture/helix-minecraft-dual-plane-adapter-v1.md`
- `docs/research/helix-minecraft-environment-adapter-reference-prompt.md`
- `docs/work-packets/eh-mc-nether1-legitimate-nether-entry-v1.md`
- `docs/helix-ask-codex-loop-discipline.md`
