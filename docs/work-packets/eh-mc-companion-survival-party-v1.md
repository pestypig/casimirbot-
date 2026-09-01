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

## Noble Team coordination and legacy-authority hygiene

The multi-companion product should behave as one user-commanded team without
creating one semantic planner per entity. The authority and timing split is:

```text
user or authorized room member
  -> commander intent and priority
  -> Runtime Codex mission plan, dependencies and assignments
  -> Helix identity, consent, actor/effect leases and conflict arbitration
  -> one resident controller per admitted companion
  -> canonical mission events, receipts and Go Board state
  -> Dottie-style overwatch summarizes status, risks and user decisions
```

Runtime Codex remains the only semantic planner and terminal candidate author.
The companion controllers perform only admitted tick-local modes. Helix is the
only authority and execution arbiter. Dottie remains a witness/overwatch role:
it may normalize events, score operator-facing salience, maintain evidence
references, acknowledge changes and prepare compact debriefs, but it cannot
assign a companion, choose a tactical response, mutate Minecraft, change a
durable goal, grant a lease or write the answer.

### Provider-neutral activity projection and optional Dottie layers

Companion work must reuse the ordinary CasimirBot MCP lifecycle rather than
introduce a special overwatch execution mode. Every Codex MCP interaction is
eligible for an always-on Helix operational projection:

```text
Codex requests a tool
  -> Helix admits or rejects the request
  -> an admitted connector action executes
  -> observation and receipt are recorded
  -> the result returns to Codex
  -> the same public lifecycle events project into Helix
```

This baseline projection is provider-neutral and is required independently of
missions, Dottie or the Go Board. Two optional layers may organize or extend the
same record without replacing it:

1. A mission overlay groups existing events into objectives, assignments,
   companion activity, Dottie callouts and Go Board state.
2. Bound steering lets Helix or voice submit a new prompt only through an
   explicit mission-to-provider-thread binding and continuation transport.

Helix does not mirror Codex private reasoning or ordinary conversation prose.
A Codex conclusion appears in Helix only when the provider publishes an
eligible terminal product or mission update through the harness contract.
Therefore future Auntie Dottie and Noble Team work may summarize and steer the
canonical operational record, but must not add a second tool runtime, infer
hidden reasoning, or manufacture execution or answer authority.

S1 reserves the following team-ready identity vocabulary even though team
coordination is not implemented until C5/S6:

```text
team_id / team_epoch / mission_id / objective_id
companion_id / role_profile_id / assignment_id
dependency_refs / resource_reservation_refs
actor_lease_id / effect_lease_id / coordination_event_ref
```

An assignment is advisory until its exact actor, incarnation, observation
revision, capability, resource envelope and finite leases are admitted. Team
membership cannot union inventories, authority or observations. Two companions
may execute concurrently only under distinct actor/effect leases and shared
global budgets; dependencies and reservations prevent both from claiming the
same target, item, route or mutation.

### Pre-implementation legacy-authority audit

Before S1 runtime work, inventory every Dottie, mission-overwatch, Go Board,
generated-index and companion-adjacent surface and classify it as exactly one
of `canonical_reuse`, `adapt`, `quarantine` or `delete`. Here, **reasoning
poison** means stale, superseded, unreferenced, receipt-only, generated or
immutable-audit material being projected to Codex as current executable or
authoritative truth.

The first-pass classifications are deliberately conservative:

| Surface | Initial classification | Boundary |
| --- | --- | --- |
| Mission event normalization and evidence references | `canonical_reuse` or `adapt` | Preserve provenance and typed event identity; no strategy or authority. |
| Salience and acknowledgment/debrief logic | `adapt` | Operator-facing attention only; never tactical priority or controller input by implication. |
| Go Board objective/action/threat/timer/signal contracts | `adapt` | Project canonical team mission state and evidence, not hidden reasoning or mutation authority. |
| Dottie manifest preset/run | `canonical_reuse` for overwatch only | Keep `witness_only`, `command_lane_enabled=false`, `assistant_answer=false` and `instruction_authority=none`. |
| Unreferenced top-level Dottie orchestration | `quarantine` pending reachability proof | Thin or obsolete orchestration must not appear in Codex context as a live controller merely because it is indexed. |
| Receipt-only UI scaffolds and generated code-lattice entries | `quarantine` | A receipt or generated projection is not implementation, admission, evidence of effect or answer authority. |
| Dated audits and historical reports | `canonical_reuse` as immutable evidence only | Retain them, but exclude them from roadmap, current-design and executable-capability authority. |

Quarantine means exclusion from active capability documentation, prompt/context
assembly, retrieval indexes and generated code-lattice authority while the
source remains available for audit. Delete only after all of the following are
proved: no live import, route, manifest, UI action, test or canonical backlink;
a current replacement contract exists where behavior is still required; focused
tests demonstrate no lost lifecycle or evidence behavior; and the generated
indexes are rebuilt without reintroducing the retired symbol.

The audit must add adversarial retrieval tests showing that names, personas,
historical receipts, stale architecture and generated projections cannot be
selected as current controller capability or authority. It must also preserve
the opposite guarantee: current canonical contracts and tested reusable
components remain discoverable. No deletion is authorized by this planning
section alone.

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
| S1 | Companion actor/action/receipt schemas behind EH-RCC1, plus team-ready identity reservations and the legacy-authority inventory | Type/lifecycle and adversarial retrieval tests; no Minecraft strategy in generic types; no stale or receipt-only surface presented as current authority |
| S2 | Visible identity, presence, persistence and cleanup | C0 A0/A1/B |
| S3 | `resident.minecraft.companion-follow.v1` | C1 A0/A1/B and EH-RCC3 evidence |
| S4 | Transactional inventory/equipment custody | C2 A0/A1/B and no-duplication |
| S5 | Exact Survival mining using accepted backend | C3 A0/A1/B plus real-client differential |
| S6 | Gather/craft, Noble Team assignments/dependencies and cooperative party budgets | C4/C5 evidence, serialized conflicts and distinct actor/effect leases |
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

## S0 deterministic execution record — 2026-08-31

This is feasibility evidence for the pinned Minecraft/Fabric combination, not
real-client equivalence and not promotion of a runtime companion capability.

Implementation fixture:

- Minecraft `1.21.8`, Fabric Loader `0.18.4`, Fabric API `0.136.1+1.21.8`,
  Fabric Loom `1.11.8`, Java 21;
- isolated module `minecraft/helix-fabric-companion-spike`;
- one visible `PathfinderMob`-based candidate with one nine-slot canonical
  inventory;
- one locally identified, unregistered `ServerPlayer` mechanics subject with a
  bounded non-networked client-update sink (maximum 64 discarded packets);
- normal `ServerPlayerGameMode` START, tick, STOP and ABORT paths and Fabric
  before/after/canceled block-break callbacks.

The final deterministic run passed all 16 required GameTests. Pinned results:

| Trial | Expected and observed result |
| --- | --- |
| visible custom entity | one live body and one nine-slot canonical inventory |
| custom-entity mining formula | progressive result, but explicit `playerModifiersSupported=false` |
| raw detached normal break | succeeds and traverses before/after callbacks |
| raw detached canceled break | fails closed at Fabric `InteractionEventsRouter` because cancellation sends client updates through a missing connection |
| bounded-sink canceled break | no mutation or wear, before/canceled callbacks, exactly 27 discarded 3x3x3 correction packets |
| grounded stone, wooden pickaxe | 23 action ticks, one drop, durability delta 1 |
| dirt by hand | 15 action ticks, one drop, durability delta 0 |
| stone by hand | 150 action ticks, no drop, durability delta 0 |
| airborne stone, wooden pickaxe | 113 action ticks and normal settlement |
| Haste I stone, wooden pickaxe | 19 action ticks and durability delta 1 |
| Mining Fatigue I stone, wooden pickaxe | 75 action ticks |
| submerged-eyes stone, wooden pickaxe | eye-fluid state proved true; 113 action ticks |
| abort after three action ticks | no late mutation, drop, wear or completion callbacks after three settle ticks |
| hybrid canonical settlement | mechanics subject absent from the online player list; exactly one wear delta applied to the visible companion tool |
| stale canonical prestate | settlement rejected and externally changed tool left unchanged |

The effect trial also exposed an ordering boundary: applying a status effect to
the detached subject before installing the bounded sink dereferenced a null
connection because the server immediately emits an effect update packet. The
fixture now installs the bounded sink before any packet-emitting state setup.
This supports a hybrid feasibility direction, but every state transition that
may emit a client update still requires explicit compatibility coverage.

The direct Fabric real-client oracle also passed: actual client attack input
settled grounded stone with a wooden pickaxe in 23 ticks, with durability delta
1 and exactly one cobblestone. This is zero-tick divergence from the bounded
player-semantics trial and lies within the frozen one-tick tolerance. Before and
after screenshots and their hashes are retained under
`artifacts/eh-mc-companion-survival-party-v1/real-client/`.

Authenticated MCP remained a truthful negative boundary. Device Check returned
a stale, offline connector with expired admission and credential, and the
authenticated public catalog contained no companion capability or binding.
Therefore A1 was `capability_unavailable`, not attempted through an unrelated
player capability and not counted as a failed companion acceptance.

### S0 decision

**GO — bounded hybrid to the next contract/lifecycle implementation slice.**

- Candidate A, custom entity as the sole survival-mining backend: **NO-GO**.
- Raw Candidate B without a bounded client-update sink: **NO-GO**.
- One visible custom entity plus an unregistered, action-scoped bounded
  player-semantics executor: **GO for S1 contract and lifecycle implementation
  only**.

This does not promote mining, expose MCP authority or claim general player
equivalence. A1/B, restart/death, tool-break settlement, multi-companion load,
modpack compatibility and broader real-client differentials remain downstream
acceptance work. The next slice defines exact actor/action/receipt and lifecycle
contracts behind EH-RCC1; it does not add a public companion action.

## S1 deterministic execution record — 2026-08-31

S1 now defines the provider-neutral resident-controller boundary and the
Minecraft hybrid specialization without registering a route, catalog entry,
connector action or public companion capability.

Implemented contracts:

- `shared/helix-resident-controller.ts` defines versioned profile, proposal,
  admission, receipt and hash-linked lifecycle-event schemas;
- every identity binds the environment, world, connector epoch, durable actor,
  runtime actor, incarnation, controller artifact, owner, authority subject,
  beneficiary, room and observation revision;
- proposals are non-authoritative and expire; admissions bind distinct finite
  actor/effect leases, serialized execution, effect/resource ceilings, manual
  override, Emergency Stop and no automatic replay;
- receipts cannot regress observation revision, must release controls and
  resources, cannot replay leases and remain nonterminal evidence;
- the lifecycle reducer accepts only
  `registered -> bound -> admitted -> active -> suspended/releasing -> released`
  or explicit invalidation, with no state, identity, incarnation or hash repair;
- `shared/helix-minecraft-companion.ts` binds one durable companion to one
  visible runtime entity and a hidden, unregistered, bounded player-semantics
  backend with no independent location, health, inventory, pickup owner,
  advancement identity or command lane;
- executable S1 action vocabulary is limited to observe, follow, hold, look,
  nearby waypoint, return, release and abstain; follow requires true hysteresis;
- hybrid receipts settle at most once against the canonical visible actor,
  discard backend working state, reject late/duplicate effects and cannot
  settle a failed/interrupted action; and
- mining is represented only by a frozen disabled declaration requiring C2,
  C3, A0, A1 and B. It has `public_catalog_exposed=false`,
  `execution_enabled=false`, no World Authority substitution and no command
  fallback. No action schema accepts `mine`.

Legacy-authority hygiene is executable rather than prose-only:

- `shared/helix-resident-controller-legacy-authority.ts` records the first
  Dottie/mission-overwatch/generated-index inventory using the packet's
  `canonical_reuse | adapt | quarantine | delete` vocabulary;
- event normalization and salience are advisory adaptation candidates only;
- the unreferenced top-level Dottie orchestrator and generated code lattice are
  quarantined from resident-controller context;
- generated and receipt-only surfaces cannot become current design authority;
  no inventory entry has execution, controller-selection, answer or deletion
  authority; and
- quarantine is not deletion. Reachability, replacement and focused evidence
  remain required before removing source.

Focused deterministic evidence:

```text
npx vitest run server/services/environment-connectors/resident-control/__tests__/resident-controller-contract.test.ts --pool=forks
  1 file passed; 13 tests passed

npx tsc --noEmit --pretty false --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --esModuleInterop true shared/helix-resident-controller.ts shared/helix-minecraft-companion.ts shared/helix-resident-controller-legacy-authority.ts
  passed
```

The repository-wide `npm run typecheck -- --pretty false` produced no TypeScript
diagnostic before Node exhausted its 4 GB heap after approximately 130 seconds.
That broad host-resource failure is recorded separately from the passing narrow
compile and focused behavioral suite; it is not promoted into S1 evidence.

### S1 decision

**GO — actor/lifecycle implementation may advance to S2 behind the private
contract.** S1 is deterministically verified as a schema and lifecycle slice.
It does not implement a Minecraft entity, activate a controller, grant a lease,
expose MCP, authorize mining, or advance C0/C1/C2/C3 acceptance. S2 must bind
visible identity, finite presence, incarnation rotation, persistence and cleanup
to these contracts before any resident behavior is promoted.

## S2 deterministic implementation record — 2026-08-31

S2 now implements the private presence and persistence layer required before a
real companion body may be accepted. This is deterministic implementation
evidence, not C0 A0/A1/B acceptance.

Implemented surfaces:

- `shared/helix-minecraft-companion-presence.ts` defines the durable companion
  profile, finite runtime incarnation, presence projection, persistence
  snapshot and complete cleanup receipt;
- the durable profile retains the companion, owner, authority subject,
  beneficiary and controller artifact, while each runtime incarnation binds a
  distinct entity, incarnation ID, environment, world, connector epoch, spawn
  time and finite presence expiry;
- persistence explicitly excludes the active incarnation, actor/effect leases,
  resource claims, pending proposals, credentials and answer authority;
- restore always returns to `registered` with no runtime body, control or lease;
  the previous incarnation is retained only as a non-reusable stale-action
  boundary;
- `companion-presence-store.ts` enforces
  `registered -> spawned -> bound -> admitted -> active`, suspension, complete
  release, despawn and fresh-incarnation respawn;
- action admission checks the exact durable companion, runtime entity,
  incarnation, environment, world, connector epoch, observation revision and
  actor/effect leases, then rejects stale or expired actions with stable typed
  errors;
- release is idempotent and clears navigation, transient effects, bounded chunk
  claims, resource keys, outstanding proposals, controls and both leases with
  zero late or duplicate effects; and
- finite presence expiry releases an admitted body or invalidates and cleans a
  spawned/bound body that never acquired authority.

Focused deterministic evidence:

```text
npx vitest run server/services/environment-connectors/resident-control/__tests__/resident-controller-contract.test.ts server/services/environment-connectors/resident-control/__tests__/companion-presence-store.test.ts --pool=forks
  2 files passed; 23 tests passed

targeted TypeScript compiler API check for the S1/S2 store and tests
  passed with zero diagnostics

npx tsc --noEmit --pretty false --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --esModuleInterop true shared/helix-resident-controller.ts shared/helix-minecraft-companion.ts shared/helix-minecraft-companion-presence.ts shared/helix-resident-controller-legacy-authority.ts
  passed
```

### S2 testing boundary

**STOP — deterministic implementation is ready; C0 physical acceptance is
next.** No Fabric entity type, server-thread binding, persistent-world adapter,
private connector route, catalog declaration or actor/effect authority was
added in this slice. Mining remains disabled and absent from the executable
action vocabulary.

The next run must be a pinned private Fabric C0 course, not a production or
public-catalog launch:

```text
create one visible test companion
-> bind its exact owner, entity and incarnation
-> save/restart without restoring runtime authority
-> observe and bind a fresh incarnation
-> prove an old action and lease are rejected
-> expire or manually release the current presence
-> verify entity/navigation/chunk/task/control cleanup
-> repeat through private A1 and keyed B only after A0 passes
```

S2 cannot be promoted to C0 acceptance until those measured A0, A1 and B
artifacts exist. A deterministic cleanup receipt cannot substitute for an
observed Fabric entity and server-thread resource release.

## C0 A0 direct-Fabric execution record — 2026-08-31

The private direct-Fabric C0 course is now deterministically verified on the
pinned S0 module. It added no connector route, public catalog capability,
World Authority, command lane or mining authority.

`CompanionPresenceRuntime` bound one registered `PathfinderMob` entity to the
durable profile, exact entity UUID, incarnation, connector epoch and finite
actor/effect leases. The test then acquired actual native server resources:

- a `PathNavigation` route that was in progress before cleanup;
- one `ServerLevel` forced-chunk claim verified in the server's force-loaded
  chunk set;
- bounded resident task and control claims; and
- one exact action bound to the first entity, incarnation, observation revision
  and leases.

The fixture serialized only the durable profile through Minecraft
`CompoundTag`, cleaned and discarded the first entity, restored the profile,
spawned a distinct second entity with a fresh incarnation and connector epoch,
and admitted fresh leases. The second incarnation rejected the old action with
`companion_action_identity_stale` and accepted its new exact action.

Restart and manual/expiry cleanup measured:

```text
native navigation stopped
server forced-chunk claim absent
resident task set empty
controls released
actor/effect leases cleared
actor removed
late effects = 0
duplicate effects = 0
```

The original attempt-1 record is superseded for C0 acceptance. Its module
compiled both presence tests, but `fabric.mod.json` registered only the
feasibility entrypoint, so the reported 16-test pass did not execute the two C0
presence cases it named. Attempt 2 corrected discovery, added an explicit
atomic physical-evidence export, and replaced a timing-sensitive navigation
assumption with a bounded retry against the required native capability itself.
The corrected Java compile and isolated Fabric GameTest server passed:

```text
18 tests discovered and executed
18 required tests passed
BUILD SUCCESSFUL
shared TypeScript evidence schema parse passed
```

The immutable correction manifest is
`artifacts/eh-mc-companion-survival-party-v1/A0/c0-presence-lifecycle/attempt-2/manifest.json`.
It preserves the attempt-1 record while explicitly removing its C0 acceptance
authority. Attempt 2 records source, log and physical-evidence hashes plus a
deliberate limitation: the restart boundary is same-process durable-profile
reconstruction with the old entity discarded, not an observed operating-system
process restart. It verifies A0 reconstruction semantics but does not prove
installed-server crash recovery.

### C0 A0 decision and stop

**PASS — deterministic direct-Fabric C0 A0. STOP before A1.**

The next stage is a separately authorized private authenticated-MCP A1 course.
It must discover the private test capability, bind the same identity fields,
materialize the cleanup receipt through evidence re-entry and remain
nonterminal. Only after A1 passes may keyed Helix B test room admission,
authority arbitration and terminal continuity. This A0 result does not expose
the capability publicly, accept C0 across all lanes or authorize mining.

## C0 A1 authenticated-MCP implementation record — 2026-08-31

The first private A1 MCP slice is implemented and deterministically verified.
This change is classified as `tool admission`, `evidence normalization` and
`evidence re-entry`; it does not implement a private model loop, planner,
generic tool runtime or terminal writer.

The private tool is
`helix_minecraft_companion_presence_evidence_read`. Production registration
requires all three conditions below; deterministic tests may inject the same
reader only for a developer principal:

- a finite fixed-path private config admits the exact authenticated owner
  profile and physical-evidence hash, independently of whether an external
  OAuth account projection is labelled `developer` or `user`;
- the configured profile is the sole owner admitted by that private config;
- the private reader remains available and hash-valid at execution time.

The exact owner-scoped config is not a public `user` grant. With no matching
finite config, a public account remains unable to discover the tool; an
injected reader is likewise admitted only for deterministic developer tests.

It requires both `helix.rooms.read` and `helix.environment.actions.read`. Its
request binds the exact `companion_id`, entity, incarnation, environment,
world, connector epoch and observation revision. A stale request fails with
`companion_presence_identity_mismatch`; retrying with the current identity is
the bounded A1 repair path. A successful read strictly parses the released or
invalidated presence and complete cleanup receipt, then stores a nonterminal
MCP evidence observation for owner-scoped re-entry through
`helix_evidence_observation_get`.

The corrected focused acceptance run passed 18 tests across the new A1 MCP
boundary, the S2 presence store and the private fixed-path reader. It verifies:

```text
disabled or missing reader -> tool absent
unconfigured or non-owner public user -> tool absent
authenticated owner mismatch -> tool absent
expired private config -> tool absent
physical evidence hash changes -> typed integrity rejection
missing OAuth read scope -> rejected before source read
stale exact identity -> typed mismatch
current exact identity -> cleanup evidence materialized
observation_ref -> durable owner-scoped evidence re-entry
execution/mining/answer/terminal authority -> false
```

`npm run helix:environment-harness:docs-audit` passed and
`npm run helix:ask:discipline:quick` found no Helix Ask-sensitive changed
files. The broad `npx tsc --noEmit` process exhausted Node's 4 GB heap without
emitting a source diagnostic, so it is recorded as memory-limited rather than
passed or failed source verification.

The immutable corrected preflight manifest is
`artifacts/eh-mc-companion-survival-party-v1/A1/c0-presence-mcp-contract/attempt-2/manifest.json`.

The authenticated live A1 sequence subsequently passed against the keyed
source server through `casimirbot_g2_a1_local`. Two pre-acceptance failures
were retained as useful boundary evidence:

- the installed Codex profile's explicit `enabled_tools` allowlist initially
  filtered both the private reader and generic evidence-retrieval tool before
  MCP discovery; and
- the full MCP surface unnecessarily required `helix.agent_runs.read` for the
  same owner-scoped, non-executable evidence retrieval that the Device Check
  and coordination surfaces already admit under `helix.rooms.read`.

The profile allowlist now admits only the two required read tools. Generic
owner-scoped evidence retrieval now consistently requires `helix.rooms.read`;
it still enforces tenant/profile ownership, retention and revocation, and it
cannot execute, answer or become terminal. The expanded focused boundary run
passed 22/22 tests across four files.

The final fresh authenticated client discovered the private tool, received
`companion_presence_identity_mismatch` with `retryable=true` for the stale
incarnation, read the exact released incarnation and complete cleanup receipt,
and retrieved the same observation through
`helix_evidence_observation_get`. The exact observation reference was:

`mcp_evidence_observation:helix.minecraft.companion_presence_evidence.inspect:4663d3b9-3766-4f93-bf58-421d0211a075`

The immutable live manifest is
`artifacts/eh-mc-companion-survival-party-v1/A1/c0-presence-live/attempt-1/manifest.json`.

### C0 A1 decision and stop

**PRIVATE AUTHENTICATED-MCP C0 A1 IS LIVE ACCEPTED. STOP before keyed Helix B.**

This acceptance proves authenticated OAuth transport, exact owner/config
admission, private catalog discovery, live physical Fabric-reader binding,
typed stale-identity repair, cleanup-receipt materialization and exact evidence
re-entry for the C0 presence slice. It does not prove public release, mining,
follow behavior, C0 tripath closure, keyed Helix room admission or any broader
companion authority. Public capability exposure, execution authority, mining
authority, answer authority and terminal eligibility remained false. Keyed
Helix B was not attempted.

## C0 B keyed-Helix room acceptance — 2026-08-31

This stage is classified as `tool admission`, `evidence normalization` and
`evidence re-entry`. It projects the already accepted immutable A0/A1 physical
observation into one keyed Helix room; it does not create another companion,
sample a model, execute an action, grant a room capability to another member or
write a terminal result.

The private C0 B tool is
`helix_minecraft_companion_room_presence_evidence_read`. It is registered only
beside the exact owner-scoped private A1 reader. Every call requires the same
two OAuth read scopes as A1, then re-inspects the requested room through the
canonical Shared Live Room control service. Admission requires all of the
following at call time:

- the bearer profile is the private-config owner;
- the profile is a current member of the exact `room_id`;
- its current room participant has role `owner` and has not left;
- the room is not closed;
- the requested companion, entity, incarnation, environment, world, connector
  epoch and observation revision match the immutable A0 evidence; and
- the evidence hash still matches the fixed private configuration.

The resulting `helix.minecraft_companion.room_presence_evidence.v1` envelope
sets `observation_origin=room_projection` and binds the exact room, owner
profile and requesting participant. It retains the full cleanup receipt while
asserting zero commands, side effects or environment mutation. Public
capability exposure, execution authority, mutation authority, mining authority,
credential/private-endpoint/hidden-reasoning inclusion, answer authority,
assistant-answer status and terminal eligibility are all literal `false`.
Closing or leaving the room invalidates future reads; reconnecting an MCP
client does not persist or restore any actor/effect lease because none exists.

### Frozen C0 B acceptance matrix

| Case | Required outcome | Evidence authority |
| --- | --- | --- |
| tool discovery | private owner catalog includes both A1 and B read tools with read-only, nondestructive, idempotent annotations | catalog only |
| stale incarnation | `companion_presence_identity_mismatch`, `retryable=true`, no observation stored | typed repair boundary |
| exact owner room | room/participant/owner plus exact physical identity and complete cleanup receipt | nonterminal evidence support |
| evidence re-entry | `helix_evidence_observation_get` returns the exact same observation reference and payload hash | current Codex evidence only |
| non-owner member | fail before the physical reader with `companion_presence_room_owner_required` or canonical room-membership denial | owner isolation |
| closed/left room | fail before the physical reader with `companion_presence_room_revoked` or canonical closed/not-found denial | revocation |
| fresh reconnect | exact read succeeds only while the owner-room admission is current; every action/answer authority remains false | transport continuity only |
| successor room after revocation | new room and participant identities are required; the old room remains denied | no ambient room carryover |

Focused deterministic tests pass all five MCP cases, including stale repair,
exact evidence re-entry, non-owner denial, closed/not-found room denial and
fresh client reconnect. The keyed live run completed private discovery, stale
rejection, exact room binding and exact evidence re-entry in the initial owner
room:

```text
room = shared_realtime_room:456dc105-8cd8-48c2-800b-4b5ad8efba6d
participant = shared_realtime_participant:ba122d90-244f-484d-ae84-954582f3c318
observation = mcp_evidence_observation:helix.minecraft.companion_room_presence_evidence.inspect:4411aea9-be26-44b0-bc37-23229eba8187
same observation re-entered = true
cleanup complete = true
public/execution/mutation/mining/answer/assistant/terminal authority = false
```

The same profile was only a participant in
`shared_realtime_room:14bc1eee-6cfd-4714-9b59-57a8cc17bdda`; the B tool rejected
that call with `companion_presence_room_owner_required` before admitting the
physical reader. Closing the initial owner room at
`2026-08-31T20:46:48.420Z` caused subsequent calls to fail with
`companion_presence_room_revoked`, `retryable=false`.

A fresh successor room proved reconnect without authority restoration. During
the final source-aligned restart, a canonical `room_not_found` surfaced as a
generic `internal_error`. The B handler now maps both `room_not_found` and
`room_closed` to the same typed, non-retryable
`companion_presence_room_revoked` boundary. Five focused tests passed after the
repair, and a nonexistent room returned that exact typed denial on the keyed
runtime.

The final patched-runtime acceptance is:

```text
room = shared_realtime_room:fc2fb0b1-dcf6-4813-bbe9-5c26bb1882dd
participant = shared_realtime_participant:025a87e2-6944-4988-93df-db27dcd0d288
observation = mcp_evidence_observation:helix.minecraft.companion_room_presence_evidence.inspect:ca2a8a4c-6d05-4ab8-9ac0-a00e22a4a311
same observation re-entered = true
payload sha256 = sha256:d3da2767f155fa3a2b489c9074d68054e169cf4e13a2b5039895b9627d881fee
cleanup complete = true
public/execution/mutation/mining/answer/assistant/terminal authority = false
```

The immutable live manifest is
`artifacts/eh-mc-companion-survival-party-v1/B/c0-presence-keyed-helix/attempt-1/manifest.json`.
Its SHA-256 is
`852ae675ab21afce305528072acbb79f2eb1170751504c595d4a2a4d4e84b65e`.

### C0 B decision and stop

**PRIVATE KEYED-HELIX C0 B IS LIVE ACCEPTED. STOP before C1/EH-RCC3.**

The C0 A0/A1/B identity-and-presence tripath is accepted. This result proves
only exact companion identity, cleanup, private MCP transport, owner-room
admission, typed stale/revoked isolation and Codex evidence re-entry. Overall
optional companion embodiment remains `projected` under the G8 work program.
It grants no public capability, follow behavior, mining, execution, mutation,
answer or terminal authority. C1 follow behavior and EH-RCC3 remain separately
gated and are not authorized by this acceptance.

## S3 / C1 follow-baseline implementation packet — 2026-08-31

Program gate: G8 — environment-harness release evaluation; permitted EH-RCC3
parallel lane after accepted C0 A0/A1/B identity and presence

Workstream: deterministic Minecraft companion follow embodiment

Capability or component: `resident.minecraft.companion-follow.v1`

Lifecycle stage: semantic proposal, finite admission, tick-local native
pathfinding, observation, interruption, release and exact evidence re-entry

Reaction timescale: one Minecraft server tick for local control; event-driven
Codex replanning only after a typed escalation or semantic-mode change

Authority owner: the user owns the companion and finite actor/effect leases;
Helix owns admission and serialization; the Fabric controller owns only the
admitted follow-mode mechanics; Codex owns semantic intent and replanning

Current maturity: live accepted

Target maturity: live accepted for the private follow-only C1 A0/A1/B slice

Required evidence: native `PathNavigation` movement, hysteresis, hold/look/
nearby-waypoint/return, obstruction and target-loss escalation, continuity
during Codex delay, serialized admission, expiry/manual/Emergency-Stop release,
restart stale-action resistance, cleanup and exact A0/A1/B evidence re-entry

Explicit non-goals: no inventory, equipment, pickup, mining, combat, crafting,
containers, item transfer, command lane, World Authority, public MCP capability,
answer authority or terminal authority

Downstream gate unlocked: C2 inventory/equipment custody specification and
implementation only after the complete C1 A0/A1/B evidence tripath passes

### Frozen controller profile

The first C1 implementation uses Minecraft's registered companion entity and
native `PathNavigation`. It is a clean-room controller, not Baritone, Carpet or
Mineflayer code. One admitted semantic mode continues locally without another
Codex call until it completes, expires, is interrupted or requests replanning.

| Parameter | Frozen value | Purpose |
| --- | ---: | --- |
| follow start distance | 6 blocks | begin/rebegin native movement |
| follow stop distance | 3 blocks | stop inside the admitted band |
| maximum target radius | 24 blocks | abstain instead of pursuing unboundedly |
| nearby waypoint radius | 16 blocks | constrain explicit local navigation |
| navigation speed | 1.0 | deterministic test profile speed |
| path recalculation interval | 5 ticks | bound native path searches |
| maximum consecutive path failures | 4 | escalate obstruction deterministically |
| no-progress ceiling | 20 ticks | stop rather than thrash on a stuck path |
| target observation-age ceiling | 20 ticks | reject stale target identity |
| default action lease | 200 ticks | finite local continuity window |
| chunk policy | already loaded only | no implicit forced-chunk authority |

Hysteresis is stateful: outside six blocks the controller starts movement;
inside three blocks it stops; between those boundaries it preserves its prior
moving/holding state. A semantic `follow` instruction therefore cannot become
a stream of model-authored movement calls.

### Frozen C1 acceptance matrix

| Case | Required outcome | Failure boundary |
| --- | --- | --- |
| exact follow | actor enters and remains inside the 3–6 block band through native pathfinding | no teleport or command fallback |
| hysteresis | no start/stop chatter while distance stays between thresholds | measured navigation transitions |
| hold | native navigation stops and controls release while presence remains | no actor deletion |
| look | actor look control tracks the exact admitted target | no movement authority |
| nearby waypoint | waypoint inside 16 blocks is reached; farther waypoint is rejected | `companion_waypoint_out_of_bounds` |
| return | actor returns to the exact bound owner target | no proximity-based ownership inference |
| obstruction | bounded path failures or no progress suspend and request semantic replanning | `companion_obstruction_replan_required` |
| target loss/staleness | removed, cross-world or stale target suspends before further movement | `companion_target_lost_replan_required` or `companion_target_stale` |
| Codex delay | admitted local mode continues without provider/model heartbeat | finite lease only |
| serialization | a second action cannot replace an active action without explicit release/interruption | `companion_controller_busy` |
| expiry/manual/Emergency Stop | navigation, tasks, effects and controls release with no late effect | typed receipt and zero replay |
| restart/incarnation change | every old action and lease remains stale | no automatic resumption |
| A1/B re-entry | exact physical receipt is owner-private, room-bound and retrieved by observation reference | all broader authority false |

### Implementation and stop order

```text
private deterministic controller and focused JVM/GameTests
-> C1 A0 direct Fabric evidence
-> private authenticated MCP C1 A1 evidence/action admission
-> keyed owner-room C1 B admission, revocation and reconnect
-> immutable manifests and work-program audit
-> STOP before C2 inventory/equipment custody
```

No earlier C0 cleanup receipt or S1 schema test substitutes for C1 physical
movement. No A0 result authorizes A1/B, and no C1 result implicitly authorizes
inventory or Survival interaction.

## C1 A0 direct-Fabric execution record — 2026-08-31

The clean-room `CompanionFollowController` now drives the registered visible
companion only through Minecraft 1.21.8 native `PathNavigation`, navigation
stop and look controls. Ambient random-stroll and random-look goals are absent,
so no unadmitted behavior can masquerade as accepted movement.

The complete Fabric GameTest module ran 22 required tests and passed 22. The
four C1 cases proved the frozen follow thresholds and hysteresis, hold, exact
look target, nearby waypoint and bounded rejection, return to exact owner,
bounded obstruction escalation, removed-target escalation, uninterrupted
finite local progress during a Codex delay, busy-controller serialization,
lease expiry, manual release, Emergency Stop cleanup and restart/incarnation
stale-action rejection. The obstruction case also asserts semantic `RELEASE`
and reason-bearing `ABSTAIN(unsafe_context)` settle immediately with controls
and tasks released and every broader authority false. No command or teleport
fallback was used.

Controller artifact:

`sha256:96d277687e90f952882e5b2f8a88813483ddd394f82b32a8e240d983a4e90c20`

Immutable record:

`artifacts/eh-mc-companion-survival-party-v1/A0/c1-follow-baseline/attempt-1/manifest.json`

Its SHA-256 is
`21a8a0a324e83a45d4d9416812d45175112d04064a5db268451e8597cd66cd76`.

**PASS — deterministic direct-Fabric C1 A0.**

## C1 A1 authenticated-MCP execution record — 2026-08-31

The private developer-only
`helix_minecraft_companion_follow_evidence_read` tool is registered only when
an exact owner-scoped configuration and reader are present. Every call rechecks
the authenticated profile, contained regular-file input, finite configuration
expiry, admitted SHA-256, exact companion incarnation and exact controller
artifact. The tool requires room-read plus environment-action-read OAuth
scopes and has read-only, idempotent, non-destructive annotations.

A fresh Codex MCP client called the tool against the keyed local server and
then retrieved the resulting durable observation by exact reference:

`mcp_evidence_observation:helix.minecraft.companion_follow_evidence.inspect:98a1dd8d-3062-4e74-be21-9fd44e07ca33`

The re-entered payload retained 22/22 GameTests and all authority negatives:
public exposure, execution, mutation, inventory, mining, combat, answer and
terminal authority remained false. The separate unlogged `localhost` alias
emitted authentication warnings during client startup; the configured
`127.0.0.1` A1 call and exact re-entry both succeeded.

Immutable record:

`artifacts/eh-mc-companion-survival-party-v1/A1/c1-follow-mcp-live/attempt-1/manifest.json`

Its SHA-256 is
`c858c77715820ccc29fc50a83b26d082472bb6ebe0f5514a975e9cac7fc9b255`.

**PASS — private authenticated-MCP C1 A1.**

## C1 B keyed-Helix owner-room execution record — 2026-08-31

The owner created dedicated room
`shared_realtime_room:b5037895-026a-4954-a075-8d705366174e`. The private
`helix_minecraft_companion_room_follow_evidence_read` tool rechecked current
membership and owner role, projected the exact C1 receipt into that room, and
stored observation:

`mcp_evidence_observation:helix.minecraft.companion_room_follow_evidence.inspect:f34bf0c1-8a38-4a48-bc9f-1a26788a07df`

Exact retrieval succeeded. The projection reports zero commands, no side
effects, no environment mutation and false execution, inventory, mining,
combat, answer and terminal authority. Focused contract tests also pass stale
artifact, missing-scope, non-owner, closed-room, missing-room and fresh
reconnect cases before the physical reader or evidence store where required.

The owner then closed only that dedicated room through the browser lifecycle
control. An exact repeat read failed closed as
`companion_follow_room_revoked` with `retryable=false`. A fresh owner room,
`shared_realtime_room:b3775122-eab0-4b3d-b3bf-06ee47978449`, admitted the same
read-only projection with zero commands and no mutation. Exact re-entry of
fresh observation
`mcp_evidence_observation:helix.minecraft.companion_room_follow_evidence.inspect:d893f41c-27ed-41ff-a94b-f2109dfc795b`
succeeded with valid provenance. The reconnect room remains open solely as an
inert acceptance artifact; it holds no environment binding or execution grant.

Current record:

`artifacts/eh-mc-companion-survival-party-v1/B/c1-follow-keyed-helix/attempt-1/manifest.json`

Its SHA-256 is
`e4a629352f18a5bbf2ec17527b4712f7da0ac2b31f45ac234819706b2b5de865`.

**PASS — keyed owner-room projection, revocation and fresh inert reconnect.**

## C1 decision and stop

**PRIVATE C1 A0/A1/B IS LIVE ACCEPTED. STOP before C2 inventory/equipment
custody or Survival interaction.**

This closes only `resident.minecraft.companion-follow.v1`: bounded native
follow, hold, look, nearby waypoint, return, release, abstain, replanning and
finite cleanup. It does not expose a public capability or grant inventory,
equipment, pickup, mining, crafting, combat, World Authority, answer or
terminal authority. C2 remains a separate future gate.

## S4 / C2 transactional inventory and equipment custody packet — 2026-08-31

Program gate: G8 — environment-harness release evaluation; permitted optional
companion lane after private C1 A0/A1/B acceptance

Workstream: deterministic Minecraft companion item custody

Capability or component: `resident.minecraft.companion-custody.v1`

Lifecycle stage: exact proposal identity, actor/action admission, atomic
prestate validation, one physical settlement, poststate receipt, delivery
deduplication, rollback, persistence/death settlement and finite release

Reaction timescale: same server tick for one admitted transaction; no resident
inventory strategy and no model call inside settlement

Authority owner: the user owns the item economy and finite actor/effect leases;
Helix owns identity, admission, revision and serialization; the Fabric arbiter
owns only exact mechanical settlement; Codex owns semantic item intent

Current maturity: deterministically verified for direct A0 mechanics and private
A1/keyed-B admission contracts; live A1 and keyed B acceptance remain open

Target maturity: live accepted for private C2 A0/A1/B with zero duplication or
loss

Required evidence: canonical actor-bound inventory and native equipment,
save/restart revision rotation, configured KEEP and DROP death policy, exact
pickup/equip/unequip/owner-transfer deltas, denied slots and containers, stale
revision rejection, atomic rollback, idempotent delivery retry, disconnect and
backend-failure behavior, finite release, exact evidence re-entry and current
owner-room revocation

Explicit non-goals: no mining, crafting, recipe execution, combat, block/world
mutation, arbitrary container access, player-proxy inventory inheritance,
public capability, commands, World Authority, answer authority or terminal
authority

Downstream gate unlocked: C3 Survival mining may begin only after complete C2
A0/A1/B acceptance and no-duplication evidence; this A0 implementation alone
does not unlock C3

### Frozen C2 custody invariants

1. The visible companion's nine-slot `SimpleContainer` plus its native
   `EquipmentSlot` values are the only canonical item state. Detached mechanics
   subjects and MCP receipts cannot own a second inventory.
2. Every transaction binds the current companion entity/incarnation,
   connector epoch, actor/effect leases, action expiry and exact custody
   revision before any item moves.
3. One caller-stable transaction identity settles once. An identical delivery
   retry returns the original immutable receipt; different semantic arguments
   under that identity fail as `companion_custody_idempotency_conflict`.
4. Source, destination and native equipment are snapshotted before mutation.
   Backend refusal or implementation failure restores all touched state before
   returning a typed failure.
5. Only `bound_owner_inventory` may receive a companion transfer in C2.
   Nearby or arbitrary containers remain denied.
6. Restart persists item economy and death policy but rotates the custody
   revision and clears settled delivery identities. It never restores an old
   action lease.
7. KEEP produces no drops and retains custody. DROP returns the exact inventory
   plus equipment economy once and clears canonical state.
8. Every receipt explicitly reports mining, crafting, combat, World, answer and
   terminal authority as false.

### Frozen C2 acceptance matrix

| Case | Required outcome | Typed failure or ceiling |
| --- | --- | --- |
| pickup | exact source decrement and canonical inventory increment | full or insufficient source rejects before mutation |
| equip/unequip | one item moves between canonical inventory and exact native equipment slot | occupied, empty or denied slot rejects |
| owner transfer | exact companion decrement and exact bound-owner increment | other container scope is `companion_container_not_admitted` |
| stale prestate | current identity but old custody revision cannot settle | `companion_custody_revision_stale` |
| delivery retry | one physical commit and replay-marked original receipt | changed semantics under same id conflict |
| backend failure | both sides and equipment restore byte-for-byte-equivalent item state | `companion_custody_backend_failure` or rollback hard failure |
| disconnect/release | no later transaction can mutate; late and duplicate physical effects remain zero | `companion_custody_released` |
| restart | inventory/equipment survive, revision rotates, old action remains stale | no authority or transaction replay |
| KEEP death | inventory/equipment retained and zero drops | configured policy only |
| DROP death | exact item economy returned once and canonical custody cleared | no command-spawned replacement items |
| A1/B re-entry | exact A0 receipt is owner-private and room-bound | read evidence grants no inventory execution authority |

### C2 A0 deterministic execution record

`CompanionInventoryCustody` now provides the private actor-bound transaction
arbiter. `CompanionInventoryCustodyGameTests` registers four focused Minecraft
1.21.8/Fabric GameTests:

- `c2A0ExactPickupEquipUnequipTransferAndRetry`;
- `c2A0DeniedSlotsContainersStaleRevisionAndConflict`;
- `c2A0BackendFailureRollsBackAndReleaseBlocksLateEffects`; and
- `c2A0RestartAndConfiguredDeathPolicyPreserveOneEconomy`.

All four passed as individually filtered real Fabric GameTests. The first
unfiltered 26-test run also passed all four C2 cases but failed one older C0
native-navigation acquisition fixture; a second unfiltered run passed all C2
cases but failed one older C1 nearby-waypoint path fixture. Those independent
pathfinding flakes are retained as suite-health evidence and are not converted
into a C2 failure or silently averaged away.

The module's `gametestFilter` Gradle property makes an exact registered test id
reproducible without changing the GameTest catalog. A filter that matches zero
tests is not acceptance evidence; the record above uses four exact one-test
filters and each reports `All 1 required tests passed`.

Current live boundary: the CasimirBot keyed MCP is reachable, but device check
reports every known Minecraft connector stale/offline. An open Minecraft window
therefore does not yet constitute governed C2 evidence. A fresh opaque source
and actor pairing must follow the C2 private evidence wiring before A1/B can be
accepted.

### C2 hash-pinned evidence and MCP admission record

The four exact Fabric runs now write one controller-hash-matched receipt per
case and atomically assemble
`artifacts/eh-mc-companion-survival-party-v1/A1/runtime/current-custody-evidence.json`
only after all frozen case ids are present for the same compiled controller.
The resulting artifact records 4/4 focused passes, custody revision `5`, all
six broader-authority negatives and zero duplication or loss. Its admitted
SHA-256 is
`sha256:b432ddb16e9eea783e7e4ea9792ec181b61442e4fedf57e6ef16ac2127d8ca1c`;
the compiled controller artifact reports
`sha256:f6809cdd3289f37515335a1d9c597b3f6c615380cbe4a90de306857ca890e6ba`.

The private MCP implementation now exposes two developer/profile-gated,
read-only tools when the exact expiring hash-pinned configuration is active:

- `helix_minecraft_companion_custody_evidence_read` for A1 exact evidence
  re-entry; and
- `helix_minecraft_companion_room_custody_evidence_read` for a current owner
  room projection that rechecks membership and revocation on every call.

Focused Vitest acceptance passes 7/7 checks across the MCP factory and private
reader. It proves developer and OAuth-scope gating, exact identity/artifact/
revision admission, stale artifact and revision rejection, integrity failure,
profile-owner isolation, exact `helix_evidence_observation_get` re-entry,
owner-only room projection and closed/missing-room revocation. Both results
remain observations with `reentry_required=true`, zero commands and false
inventory-execution, mining, crafting, combat, World, answer and terminal
authority.

The A0 immutable record is
`artifacts/eh-mc-companion-survival-party-v1/A0/c2-custody-baseline/attempt-1/manifest.json`.
Live A1/B is not yet claimed. Supervisor coordination showed no competing
active client, all three keyed health routes identified the old listener as a
healthy CasimirBot service, and the user-authorized exact Node listener was
released without touching Minecraft or Docker. The approved opaque launcher
then started the canonical workspace and reached `[express] app ready`.
Existing OAuth scope readiness passed after the service-epoch change. A
dedicated owner room now exists at
`shared_realtime_room:0fae8e23-3bd3-4a20-8bd7-7cdc8eb4cfd1` in
`waiting_for_participant` state. The present Codex turn still holds its
pre-restart tool projection; live acceptance awaits only a new-turn/per-server
catalog refresh followed by exact A1 read, evidence retrieval, owner-room B
read and closed-room denial.

The catalog boundary was re-audited from the next active goal continuation.
The current signed MCP bearer remained healthy for the `g2-action` profile,
with all three required scopes granted and no recovery action. The live keyed
server therefore was not restarted again. The active Codex tool projection
still contained the accepted C1 follow readers but neither new C2 custody
reader. A supported standalone `codex app-server --stdio` client found this
exact task in durable state, but correctly refused `thread/resume` because the
Codex desktop task already held the active writer. The supported app-server
proxy also failed closed because the desktop app had no control socket at the
documented local path. No second task, borrowed participant identity, bearer
extraction, route overloading, or unauthenticated HTTP substitute was used.
This isolates the remaining first divergence to Codex task-scoped MCP catalog
refresh/attachment before tool admission; it is not evidence against the C2
Fabric mechanics, OAuth scopes, keyed service, private reader, or room policy.
Until the two C2 tools are projected into this exact authenticated task, live
A1/B and exact observation re-entry remain unproved.

**PASS — deterministic direct-Fabric C2 mechanics. A1/B OPEN. STOP before C3.**
