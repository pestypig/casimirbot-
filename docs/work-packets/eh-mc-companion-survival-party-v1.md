Program gate: G8 — environment-harness release evaluation; parallel specification work for post-G3 EH-RCC1 through EH-RCC3
Workstream: Minecraft server-native companion embodiment, survival interaction fidelity, and multi-companion party evaluation
Capability or component: Account-independent visible companion actors with finite resident-controller leases, player-semantic survival interactions, canonical inventory and health custody, and a real-client differential benchmark lane
Lifecycle stage: admission and specification; later stages are server-thread execution, observation normalization, evidence re-entry, verification, suspension, release, and restart recovery
Reaction timescale: Minecraft server tick for admitted movement and interaction progress; event-driven short Codex replanning for target and task changes; durable planning for party objectives and progression
Authority owner: the user owns each companion and its finite actor/effect leases; Runtime Codex owns semantic plans and completion claims; Helix owns identity, admission, arbitration, provenance, evidence, and terminal eligibility; the Fabric/server arbiter owns only admitted tick-local execution and fail-closed release
Current maturity: projected
Target maturity: specified
Required evidence: clean-room feasibility results for custom-entity and headless-player-semantic backends; deterministic GameTests; exact mining, inventory, lifecycle, lease, interruption, restart, and resource receipts; direct A0, authenticated MCP A1, and keyed Helix B acceptance; multi-companion tick-budget tests; user-plus-companion coexistence; and differential comparison against a real Fabric client under matched survival conditions
Explicit non-goals: no extra paid Minecraft account per normal companion; no command-based or instant block breaking as survival evidence; no copied Carpet, Mineflayer, Baritone, or other bot implementation; no hidden second planner or answer writer; no ambient World Authority; no duplicated actor, inventory, drops, XP, or health; no unbounded chunk loading; no claim of authenticated-server or modpack compatibility before live evidence
Downstream gate unlocked: an implementation packet for EH-RCC3 follow embodiment followed by a separately admitted survival-interaction profile, if the feasibility and fidelity stop criteria pass

# EH-MC server-native companion survival party v1

## Decision

Pursue a **server-native companion lane** so a user can play beside one or more
AI-controlled actors without one authenticated Minecraft client and paid
account per companion. Retain the real Fabric-client Player Embodiment lane as
the fidelity oracle and as the option when a real logged-in player is required.

Do not choose the final interaction backend from documentation alone. Build a
bounded clean-room feasibility spike with two candidates:

1. **Custom-entity backend.** A visible Fabric entity owns health, equipment,
   inventory, navigation and animation. CasimirBot implements admitted
   interaction state machines through normal server mechanics.
2. **Player-semantics backend.** A server-side player-shaped executor uses
   vanilla `ServerPlayerEntity` and `ServerPlayerInteractionManager` pathways
   where player-only semantics matter. It has no separate agency, plan,
   inventory or visible body.

The preferred product shape, subject to the spike, is a hybrid: one visible
custom companion is the only actor users can see, target, damage, heal and
equip; an exactly bound player-semantics executor may perform one admitted
interaction on that actor's behalf. If it would create a second position,
inventory, health pool, pickup owner, advancement identity or mutation, the
action fails closed.

This packet specifies research and evaluation. It does not promote the
projected capability, authorize runtime implementation ahead of EH-RCC1 and
EH-RCC2, or replace
`docs/architecture/helix-minecraft-companion-embodiment-v1.md`.

## Gate placement

G3 is closed, and the work program already reserves EH-RCC1, EH-RCC2 and
EH-RCC3. This is parallel design work only; it changes no runtime, authority,
source identity, G8 release claim or accepted guardian behavior.

```text
EH-RCC1 generic resident-controller contract
  -> EH-RCC2 guardian migration with accepted behavior preserved
  -> EH-RCC3 companion follow/hold acceptance
  -> separate inventory/equipment acceptance
  -> separate survival-interaction/mining acceptance
  -> multi-companion party acceptance
```

The first EH-RCC3 profile remains `resident.minecraft.companion-follow.v1`.
Mining, combat, crafting, containers, item transfer and world interaction do
not enter that profile implicitly.

## Research basis — 2026-08-31

Research used official Fabric documentation, mapped Minecraft APIs, and public
source repositories. External projects are behavioral precedents only. The
implementation remains clean-room and CasimirBot-owned.

| Primary source | Finding | CasimirBot consequence |
| --- | --- | --- |
| [Fabric custom-entity guide](https://docs.fabricmc.net/develop/entities/first-entity) and [entity attributes](https://docs.fabricmc.net/develop/entities/attributes) | Fabric supports registered custom entities with native pathfinding goals, attributes, server logic, client rendering, synchronized fields and persistent data. | A visible party member can be a native actor rather than another client. A custom mob does not automatically gain player mining or inventory semantics. |
| Yarn [`ServerPlayerEntity`](https://maven.fabricmc.net/docs/yarn-1.21.8%2Bbuild.1/net/minecraft/server/network/ServerPlayerEntity.html) | A server player bundles player-specific interaction, inventory, food, XP, modification checks, combat, screens and a network handler. | A headless surrogate is feasible to investigate but version-sensitive and exposed to network-handler assumptions. Isolate it behind an adapter; do not assume universal compatibility. |
| Yarn [`ServerPlayerInteractionManager`](https://maven.fabricmc.net/docs/yarn-1.21.8%2Bbuild.1/net/minecraft/server/network/ServerPlayerInteractionManager.html) | Vanilla maintains mining position, start tick, progress, failure state and game mode for one server player. | Prefer this pathway in the parity candidate over an instant world mutation, with every result bound to the visible actor's incarnation and lease. |
| Yarn [`AbstractBlock.calcBlockBreakingDelta`](https://maven.fabricmc.net/docs/yarn-1.21%2Bbuild.1/net/minecraft/block/AbstractBlock.html) and [`ExperienceDroppingBlock`](https://maven.fabricmc.net/docs/yarn-1.21.8%2Bbuild.1/net/minecraft/block/ExperienceDroppingBlock.html) | Breaking progress depends on block/player state and normal completion participates in loot/XP behavior. | No fixed timer or remove-block shortcut. Acceptance covers hardness, tool, effects, ground/water state, durability, drops and XP. |
| Fabric [`PlayerBlockBreakEvents`](https://maven.fabricmc.net/docs/fabric-api-0.136.0%2B1.21.8/net/fabricmc/fabric/api/event/player/PlayerBlockBreakEvents.html) | Fabric exposes server-side before, after and canceled block-break callbacks. | A companion must traverse protection/mod callbacks. Cancellation means typed denial and no mutation, wear, drop or retry. |
| [Fabric automated testing](https://docs.fabricmc.net/develop/automatic-testing) | Fabric supports unit tests plus server/client GameTests using actual Minecraft gameplay code. | Use GameTest for deterministic mechanics. Keep authenticated MCP/Helix acceptance separate because GameTest does not prove room authority, identity, evidence re-entry or terminal continuity. |
| [Fabric Carpet fake-player implementation](https://github.com/gnembon/fabric-carpet/blob/master/src/main/java/carpet/patches/EntityPlayerMPFake.java), [entity docs](https://github.com/gnembon/fabric-carpet/blob/master/docs/scarpet/api/Entities.md), and [MIT license](https://github.com/gnembon/fabric-carpet/blob/master/LICENSE) | A mature Fabric project creates server-side fake players, proving technical feasibility without another authenticated client. Its issue history also exposes reach/attribute and unloaded-chunk lifecycle divergence. | Treat it only as a feasibility/failure-mode oracle. Test reach, identity collision, disconnected-network behavior, chunks and restart; copy no implementation. |
| [Mineflayer API](https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md) and [types](https://github.com/PrismarineJS/mineflayer/blob/master/index.d.ts) | A protocol client separates dig time, dig/stop, equip, craft, inventory and visibility operations. | Reuse the lifecycle decomposition, not its runtime. It remains a separate client/auth lane and optional benchmark. |

### Frozen conclusions

1. A custom entity is the scalable **presence** primitive, not proof of
   player-equivalent survival interaction.
2. Vanilla's interaction manager is the strongest **mechanics** oracle, but a
   disconnected server player carries compatibility/lifecycle risks.
3. A hybrid is valid only if it still represents exactly one actor and one
   economic state. A hidden surrogate cannot become a second companion.
4. `World.breakBlock`, `/setblock`, `/fill`, `/give`, Creative mode and direct
   inventory writes are fixture tools, never legitimate Survival evidence.
5. External bots/fake-player mods supply decompositions and failure modes, not
   dependencies or source code.
6. Keep the real-client lane. Player equivalence requires matched reach,
   duration, event, drop, wear, interruption and post-state evidence.

## Product and identity model

```text
player_proxy
  real user-selected Fabric client
  broad compatibility; one authenticated client/account per body

companion_entity
  server-native visible actor
  no additional client login per body
  bounded companion capabilities
  real-client lane supplies differential evidence
```

Users may mix both kinds in a room. Their actor leases, inventories, health,
catalogs and evidence origins remain distinct. Player authority never grants
companion authority, and companion ownership never grants World Authority.

Use every identity field already reserved in the companion architecture:

```text
environment_id / world_id / connector_epoch
companion_id / actor_entity_id / actor_incarnation_id
controller_profile_id / controller_artifact_hash
owner_account_id / authority_subject_id / beneficiary_player_id
target_subject_id (when applicable)
observation_origin / observation_revision / lease_id / room_id
```

Add implementation-private `interaction_backend_id` and version to receipts,
not authority. Backend change rotates the active action/incarnation boundary.
Death, respawn or reconstruction rotates `actor_incarnation_id`; stale
proposals and leases cannot act.

### One actor, one economy

The visible companion is canonical for location, collision, health, effects,
equipment, cooldowns, inventory, pickup, drops, XP, durability, ownership,
damage, death and persistence. A player-semantic executor gets only a bounded
transactional working state. Settlement compares exact pre-state, revision and
incarnation before applying one atomic delta. Mismatch aborts; never duplicate
or use last-writer-wins.

## Authority and capabilities

Suggested families:

```text
companion.observe / spawn / despawn
companion.follow / hold / navigate_nearby
companion.equipment.equip / inventory.transfer
companion.interact.block / mine / craft / combat
companion.emergency_stop
```

Only observe, follow, hold and nearby navigation enter initial EH-RCC3. Each
later family gets its own target, range, duration, effect ceiling, inventory
scope, postconditions and acceptance packet. A mining target cannot imply
arbitrary navigation, combat, containers or commands.

One serialized execution lease mutates a companion at a time. Multiple
companions may act concurrently only with distinct actor leases and enforced
global tick, chunk and mutation budgets.

## Survival mining contract

An admitted request declares exact actor/incarnation, world/dimension/epoch,
observation revision, target position and starting block-state hash, approach
distance, action ticks, loaded-chunk boundary, tools/slots, mutation/drop/XP/
durability ceilings, callback policy and terminal postconditions. Search may
propose loaded targets but cannot authorize one.

The tick-local executor must:

1. verify actor, block, reach, line of sight and selected face;
2. equip an admitted tool from canonical inventory;
3. advance vanilla-consistent break progress over server ticks and publish
   visible crack state;
4. honor hardness, harvestability, tool, enchantments, effects, water/ground
   penalties, game rules and mod/protection callbacks;
5. stop on target mutation, reach loss, damage policy, lease expiry,
   world/epoch change, cancellation or Emergency Stop;
6. settle exactly once through the server-authoritative interaction path; and
7. measure mutation, drops, XP, durability, inventory and resource release.

Unknown modded behavior, missing hooks or inconsistent state returns
`capability_unavailable`, `interaction_backend_incompatible`, or
`postcondition_mismatch`; never fall back to commands or instant mutation.

Required receipt:

```text
companion_id / actor_entity_id / actor_incarnation_id
interaction_backend_id / version
lease_id / action_id / idempotency_key
start_revision / start_tick / end_tick
target_position / block_state_before / block_state_after
reach / line_of_sight / selected_face
tool_before / tool_after / durability_delta
progress_samples / cancellation_cause
protection_and_event_callbacks
drop_entities / pickup_delta / xp_delta
inventory_hash_before / inventory_hash_after
world_mutation_count / controls_and_resources_released
terminal_postcondition_refs
```

Success requires exactly one matching mutation and every admitted postcondition.
Admission, animation or a drop alone is not success.

## Feasibility spike and stop criteria

Use one disposable pinned Fabric test server. Both candidates receive identical
seeded fixtures and loadouts.

- **Candidate A:** minimal custom entity, attributes, persistence, pathfinding,
  small canonical inventory, reach/LOS, ticked progress and server settlement.
- **Candidate B:** locally identified server-player-shaped executor without
  authenticated client login. It cannot appear as a second body, own an
  independent inventory, receive ambient commands or keep chunks loaded. It
  drives only the exact admitted interaction and releases all resources.

Reject Candidate B if callbacks require an unsafe fake network connection,
identity cannot be isolated from real player data, or one-to-one economic
settlement cannot be proved.

| Hard axis | Required result |
| --- | --- |
| Actor singularity | One visible/targetable body and one canonical inventory/health state. |
| Survival timing | Dirt-by-hand and stone-by-pick match the real-client oracle within one server tick at matched TPS/state. |
| Harvest fidelity | Correct/wrong tool, enchantment, drops and XP match. |
| Events/protection | Before/after/canceled hooks and denial match. |
| Interruption | Range loss, target replacement, damage policy, expiry and Emergency Stop cause no late mutation. |
| Persistence | Restart rotates incarnation and cannot replay or duplicate. |
| Compatibility | No null-network crash or silent bypass in the pinned mod set. |
| Cost | Bounded tick time, memory and chunk residency under 1, 4 and 8 companions. |

Do not average away a hard failure. If neither candidate passes, keep companions
follow/advice-only and require real clients for full Survival interaction.

## Acceptance ladder

### C0 — identity and presence

Prove finite spawn/despawn, owner/beneficiary binding, incarnation rotation,
resource release and stale-action rejection after restart.

### C1 — follow baseline (EH-RCC3)

Prove follow hysteresis, hold/waypoint/return, obstruction and target-loss
escalation, Codex-delay continuity, serialized room control and manual release.

### C2 — inventory and equipment custody

Prove canonical inventory across save/restart/death policy, exact equip/
transfer/pickup deltas, denied slots/containers, and no duplication on retry,
disconnect or backend failure.

### C3 — survival mining micro-course

Run matched companion and real-client trials for dirt by hand; stone with a
wood pick; wrong-tool no-drop; durability/breakage; Haste, Mining Fatigue,
underwater and airborne modifiers; protection cancellation; target replacement;
knockback/range loss; lease expiry/Emergency Stop before completion; and restart
between admission and settlement.

### C4 — gather and craft

Search only declared loaded coverage, mine an exact set, collect resulting
items and craft one tool through normal recipes/inventory. Interrupt on an
admitted hazard or health threshold and resume only from a fresh revision.

### C5 — cooperative party

The user plays freely while a companion works a separate target; two companions
work without lease/inventory crossover; friendly interaction is explicit; room
members cannot seize another owner's actor; global budgets suspend deterministically.

### C6 — progression contribution

One companion performs a bounded legal subtask in the legitimate Nether
journey, such as gathering a declared material set, while the user or
`player_proxy` acts separately. This is composition evidence, not a
`build_nether_portal` capability.

## Acceptance paths and real-client oracle

Every promoted capability follows:

```text
A0 direct Fabric/reference actuator
  -> mechanics, identity, cancellation and postconditions
A1 Codex through authenticated MCP
  -> discovery, receipt, evidence re-entry and repair
B natural prompt through keyed Helix
  -> room/actor admission, authority, provenance and terminal continuity
```

World Authority may reset a diagnostic fixture before a run, then must be
released and verified inactive. Legitimate Survival uses snapshot reset and
Player/Companion Embodiment only.

Hold versions, server config, world snapshot, target, TPS, game mode, inventory,
effects, callbacks and measurement schema constant. Compare:

```text
admission -> approach -> reach/LOS -> progress ticks -> callback chain
  -> mutation -> drops/XP/wear -> pickup/inventory -> release -> receipt
```

Report the first divergence and retain both traces. Player equivalence is
capability-, version- and mod-set-specific, never a global label.

## Performance budgets

The arbiter exposes ceilings for active controllers, path searches, expanded
nodes, per-tick CPU and p95/p99, chunk tickets/residency, event volume, MCP
compaction, mutations, pickups and inventory settlements. Budget exhaustion
holds/suspends lower-priority companions with
`companion_resource_budget_exhausted`; it cannot skip mechanics or hooks.

## Implementation slices

| Slice | Deliverable | Promotion evidence |
| --- | --- | --- |
| S0 | Two minimal backends and matched real-client mining traces | Hard scorecard; backend decision or follow-only stop |
| S1 | Companion actor/action/receipt schemas behind EH-RCC1 | Type/lifecycle tests; no Minecraft strategy in generic types |
| S2 | Visible identity, presence, persistence and cleanup | C0 A0/A1/B |
| S3 | `resident.minecraft.companion-follow.v1` | C1 A0/A1/B and EH-RCC3 evidence |
| S4 | Transactional inventory/equipment custody | C2 A0/A1/B and no-duplication |
| S5 | Exact Survival mining using accepted backend | C3 A0/A1/B plus real-client differential |
| S6 | Gather/craft and cooperative party budgets | C4/C5 evidence |
| S7 | Bounded legitimate Nether contribution | C6 evidence; no World Authority in measured lane |

Each slice has a separate GO/NO-GO. S0 does not authorize S5; S3 follow does
not inherit inventory or block effects.

## Evidence and exit

Future immutable evidence belongs under
`artifacts/eh-mc-companion-survival-party-v1/`, separated into feasibility,
GameTest, A0, A1, B, real-client differential and multi-companion load lanes.
Each manifest records versions, backend, snapshot hash, epoch,
actor/incarnation, catalog/profile hashes, authority/lease refs, tick budget,
state hashes, receipts and visible result. Screenshots supplement but never
replace structured postconditions.

This packet reaches `specified` only when dependency order is preserved, the
spike and hard stops are approved, one-actor/one-economy invariants and mining
lifecycle schemas are sealed, fixtures are executable, and differential/load
thresholds are fixed. Until then, maturity remains `projected`.
