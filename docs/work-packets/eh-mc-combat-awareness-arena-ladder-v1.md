Program gate: G8 — environment-harness release evaluation; supporting Minecraft integration work after G7
Workstream: Minecraft Player Embodiment combat perception, bounded reflex control, and reproducible arena evaluation
Capability or component: Tick-consistent projectile and hostile-state sensing, explicit governed combat actions, resident combat guardian, semantic combat events, and an isolated arena ladder culminating in a legitimate Survival Wither trial
Lifecycle stage: execution; secondary stages are observation normalization, evidence re-entry, short semantic replanning, verification, and operator presentation
Reaction timescale: one Minecraft client tick for admitted defensive reflexes; event-driven short replanning for target, loadout, phase, and retreat decisions; durable planning for preparation and boss progression
Authority owner: Runtime Codex owns encounter strategy, target selection, loadout, phase changes, retreat, and completion claims; Helix owns identity, admission, target and effect scope, leases, provenance, evidence, and terminal eligibility; the Fabric companion owns only admitted tick-local sensing, arbitration, execution, verification, and control release; the operator owns consent, manual override, and Emergency Stop
Current maturity: specified
Target maturity: integrated accepted
Required evidence: typed combat perception and action contracts; deterministic trajectory, threat, action, cancellation, and performance fixtures; command-assisted diagnostic arenas whose setup authority is released before measurement; direct A0, authenticated MCP A1, and keyed Helix B parity; live skeleton, blaze, mixed-enemy, miniboss, and isolated Wither trials; an operator-visible ordered trace; afterward-only screenshots; and one legitimate Survival Wither defeat with commands, Creative mode, teleportation, keepInventory, and World Authority absent from the measured run
Explicit non-goals: no PvP, attacks on friendly or neutral entities, unrestricted autonomous violence, raw 20 Hz MCP streaming, model call per tick, screenshot-dependent decisions, copied Baritone combat code, Baritone as a required combat runtime, prompt-specific boss script, hidden planner or answer writer, arbitrary commands, preserved-world destruction, credential exposure, or claim that a command-assisted diagnostic proves legitimate Survival completion
Downstream gate unlocked: an evidence-backed GO decision for combat-aware unknown-world Nether progression and later high-consequence survival encounters

# EH-MC combat awareness and arena ladder v1

## Decision

Do not use the Wither as the first combat-awareness test. It combines fast
projectiles, melee pressure, status damage, flight, block destruction, phase
changes, resource management and navigation. A failure would not identify which
capability diverged.

Build one versioned combat evaluation pack with two strictly separated lanes:

1. **Diagnostic fixture lane.** A disposable dedicated world contains small,
   reproducible arenas. Separately authorized World Authority may construct,
   reset and populate a fixture before a trial. Its lease must then be released
   and verified inactive before Player Embodiment measurement begins. These
   results diagnose mechanics and establish deterministic/live capability
   evidence; they never satisfy legitimate Survival progression.
2. **Legitimate Survival lane.** A separate disposable Survival world is reset
   from an offline world snapshot, not by commands during the trial. The player
   obtains equipment and summons the Wither through legal Player Embodiment.
   `keepInventory=false`, no Creative mode, no teleportation, no command effects
   and no active World Authority are hard preconditions. This is the only lane
   eligible to prove the final Wither objective.

Do not run destructive combat evaluation in the preserved Nether-journey world.
The fixture and legitimate worlds have independent identities, save snapshots,
connector epochs, authority records and evidence ledgers.

This packet is allowed during G8 as representative post-G7 Minecraft integration
work. It reuses the accepted lifecycle, resident-control, durable-goal,
semantic-monitor and single-arbiter contracts. It does not modify credential
classes, create another runtime, or substitute for the remaining G8
installed-node release blockers.

## Why the present harness is not yet combat-ready

The current client loop already advances admitted reactive programs at the
Minecraft tick and can coordinate camera, locomotion, hand and safety resources.
The current tactical snapshot recognizes projectiles and hostile entities, and
the native control bridge contains an internal attack pulse. Those pieces do
not yet form an admitted, verifiable combat capability.

The blocking gaps are:

- projectile observations do not yet expose the complete decision-neutral
  trajectory facts needed to distinguish collision, near miss, occlusion and
  shieldable approach;
- boss health, phase, invulnerability and attack-state evidence is incomplete;
- the provider-visible Player Embodiment catalog has no explicit attack,
  maintained shield, bow draw/release or bounded consume contract with combat
  postconditions;
- the reactive-program schema currently fixes `combat_allowed=false`;
- target eligibility, friendly-fire exclusion, damage attribution, attack
  cooldown, resource consumption and successful defense are not preserved as
  one typed causal chain; and
- no arena battery yet proves that local defense continues while Runtime Codex
  is delayed, then emits a compact event that materially changes the semantic
  plan.

Internal key pulses and generic item interaction are implementation primitives,
not evidence that the public governed contract is complete.

## Pre-implementation research — 2026-08-25

Research used mapped Minecraft/Fabric APIs and first-party project repositories.
Third-party projects are clean-room behavior references only. No source from
them is an implementation dependency or acceptance artifact.

| Reference system | Already-defined behavior worth using | Decision for CasimirBot |
| --- | --- | --- |
| [Fabric automated testing](https://docs.fabricmc.net/develop/automatic-testing) and the [Fabric 1.21.8 API index](https://maven.fabricmc.net/docs/fabric-api-0.136.0%2B1.21.8/allclasses-index.html) | Minecraft supplies server GameTests; Fabric also supplies client GameTests that can create a test world, wait for rendered chunks and capture screenshots. The repository already pins Fabric API `0.136.1+1.21.8`. | Use GameTest as the executable C0–C3 mechanics/fixture layer instead of inventing a separate simulator. Store arena block layouts as versioned Minecraft structure assets plus the Helix manifest. Keep authenticated dedicated-server A0/A1/B acceptance separate because GameTest does not prove room identity, action authority, MCP re-entry or terminal continuity. |
| [Vanilla `ClientPlayerInteractionManager`](https://maven.fabricmc.net/docs/yarn-1.21.8%2Bbuild.1/net/minecraft/client/network/ClientPlayerInteractionManager.html) and [`PlayerEntity`](https://maven.fabricmc.net/docs/yarn-1.21.8%2Bbuild.1/net/minecraft/entity/player/PlayerEntity.html) | The mapped client API already exposes `attackEntity`; player state exposes attack-cooldown progress and legal interaction range. | Implement the governed attack action by wrapping the normal vanilla client attack path. Do not synthesize damage, bypass reach, or implement a second packet-level combat engine. Record cooldown/reach before the call and measured hurt/health/death evidence afterward. |
| Vanilla [`LivingEntity`](https://maven.fabricmc.net/docs/yarn-1.21.8%2Bbuild.1/net/minecraft/entity/LivingEntity.html) | Living entities expose blocking state/item, item-use time, attacker/damage tracking, health, active effects and targetability. | Build shield, damage-attribution and target-state evidence from vanilla state. Do not infer a successful block merely because the use key was held. |
| Vanilla [`ProjectileEntity`](https://maven.fabricmc.net/docs/yarn-1.21.8%2Bbuild.1/net/minecraft/entity/projectile/ProjectileEntity.html) | Projectiles expose current velocity, owner/effect cause, targeting margin, hit/deflection and subclass-specific behavior. | Use vanilla entity motion, owner and bounding-box facts as the forecast inputs. Support projectile families explicitly and label unsupported drag/gravity/deflection regimes `unknown`; do not force every projectile through one hand-written ballistic formula. |
| Vanilla [`ZombieEntity`](https://maven.fabricmc.net/docs/yarn-1.21.8%2Bbuild.1/net/minecraft/entity/mob/ZombieEntity.html) | A zombie is a native hostile with ordinary target/navigation/attack, hurt and death lifecycles and no required projectile model. | Make a single adult unarmored zombie the first in-game opponent. It isolates identity, hostile targeting, approach, facing, reach, cooldown, knockback, retreat, damage and death evidence before adding ranged uncertainty. |
| Vanilla [`WitherEntity`](https://maven.fabricmc.net/docs/yarn-1.21.8%2Bbuild.1/net/minecraft/entity/boss/WitherEntity.html) | Mapped state includes the invulnerability timer, three tracked head-target IDs, side-head rotations and the armored overlay phase. | Read these native facts directly for the later boss schema. Retain boss bar, health, entity death and Nether Star as independent terminal observations; no single signal proves completion. |
| [Mineflayer core API](https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md) and [mineflayer-pvp](https://github.com/PrismarineJS/mineflayer-pvp) | Core separates attack, item activation/deactivation and consume operations and emits entity hurt/dead/moved, health, item and boss-bar changes. The PVP plugin exposes exact current target, start/stop/force-stop, attack/follow/view ranges and attack-rate policy. Both are MIT-licensed, but run a separate Node bot/auth/world stack. | Adopt the public lifecycle decomposition and event vocabulary, not the runtime or authentication stack. Helix needs the same explicit target lock and stop semantics, with stronger incarnation, authority, idempotency and evidence checks. |
| [AltoClef](https://github.com/gaucho-matrero/altoclef) and its [task-chain design](https://github.com/gaucho-matrero/altoclef/wiki/1:-Documentation:-Big-Picture) | An archived Minecraft 1.18 bot used higher-priority mob-defense/food chains, projectile dodging and target commitment so the main task could be pre-empted and resumed without oscillating between nearest targets. | Reuse the general pre-emption, resume and target-commitment ideas through the existing Helix arbiter and resident guardian. Do not import its task runtime, Baritone fork or survival strategy. |
| [Baritone official features](https://github.com/cabaletta/baritone/blob/1.19.4/FEATURES.md) | Goal-conditioned segmented A*, loaded/cached coverage, hazard costs, timeout states and safe rerouting support continuous pursuit/retreat movement. It does not supply the governed combat lifecycle. | Keep the existing movement-only optional adapter as an A/B oracle. CasimirBot owns target choice, combat actions, native bounded navigation, evidence and safety; Baritone remains unnecessary for C0 and cannot become combat authority. |
| [Meteor Client](https://github.com/MeteorDevelopment/meteor-client) | Its combat modules demonstrate practical target filters, range/cooldown gates, rotations and tick scheduling in a current Fabric client. It is an anarchy utility client under GPL-3.0 and its semantics intentionally exceed this product's governed PvE scope. | Treat only public behavior/configuration as a negative and comparative oracle. Do not copy code, link the runtime, or inherit automatic target selection. CasimirBot v1 remains hostile-PvE-only, exact-target-bound and fail-closed. |

### Research conclusions frozen for implementation

1. **Zombie is the first arena and first live opponent.** Projectile simulation,
   shields, ranged weapons and multi-target priority are not prerequisites for
   proving the basic governed combat loop.
2. **Vanilla is the mechanics authority.** Use its normal client attack path,
   cooldown, reach, blocking, damage, projectile and boss tracked state before
   introducing a CasimirBot-derived observation.
3. **GameTest is the deterministic fixture engine.** It should exercise real
   Minecraft entity/physics code and versioned structures. It complements, but
   cannot replace, the dedicated authenticated acceptance worlds.
4. **Separate target lock, movement and attack.** Mineflayer-pvp demonstrates
   why `target`, pursue range, attack range/rate and stop are different states.
   Helix adds exact incarnation, current revision, authority and postconditions.
5. **Defense pre-empts but does not rewrite the goal.** AltoClef's task-chain
   pattern maps to a higher-priority admitted guardian response followed by
   resume or semantic escalation through the existing arbiter.
6. **Pathfinding remains goal-conditioned and combat-neutral.** Baritone may
   move toward an admitted combat waypoint or retreat goal, but it cannot choose
   the enemy, decide to attack or expand digging/placement permissions.
7. **Projectile prediction is family-specific.** Use current entity velocity,
   owner, targeting margin, bounding-box collision and vanilla/subclass facts;
   unsupported behaviors stay explicit unknowns.
8. **External mods remain oracles.** No external combat mod is required in the
   shipped harness. This preserves the CasimirBot-owned implementation and the
   existing single Player Embodiment authority.

## Control architecture

```text
same-tick player, entity, projectile and geometry frame
  -> deterministic threat and affordance observations
  -> admitted local combat guardian
       block / sidestep / retreat / release / abstain
       through the existing trusted arbiter and resource locks
  -> measured collision, damage, inventory and target postconditions
  -> compact semantic event and operator trace
  -> Runtime Codex chooses target, strategy, loadout, phase or retreat
  -> next exact action/program is admitted against a fresh revision
```

The resident guardian may choose only among responses that Runtime Codex placed
in the finite admitted repertoire. It cannot select a new enemy, chase outside
the arena, change weapons beyond the admitted set, consume an unlisted item,
continue after lease loss, decide that the boss is defeated, or write an answer.

Raw combat ticks remain in the connector/evidence ledger. MCP and the operator
surface receive semantic transitions: projectile threat acquired/cleared,
defense activated/settled, damage taken/avoided, target state changed, resource
threshold crossed, path/cover lost, phase changed, retreat requested, authority
changed and terminal postcondition measured.

## Required observation contract

### Same-revision actor state

Each combat frame must bind the exact environment, world, connector epoch,
player incarnation, observation revision and client game tick. It includes:

- position, eye position, body and view rotation, velocity, grounded/collision
  state and current input-owning screen;
- health, absorption, armor, toughness, food, air, active effects and remaining
  effect durations;
- main/off-hand item, shield state, item-use ticks, attack cooldown, selected
  hotbar slot and bounded relevant inventory counts;
- current asserted controls, action/program identity, manual-input state and
  Emergency Stop state; and
- complete/partial/unknown coverage labels for every derived conclusion.

### Projectile facts

Every retained projectile uses an opaque current-incarnation entity reference
and reports:

- entity type, current position, velocity vector, age and observation tick;
- known owner/team relation when observable, otherwise explicit `unknown`;
- line of sight, occlusion and loaded-coverage boundary;
- trajectory-model identifier plus supported/unsupported gravity, drag,
  deflection or special-projectile regime;
- predicted closest approach to the player's expanded collision volume,
  predicted intersection/impact tick, impact side and confidence;
- `collision_predicted`, `near_miss_predicted`, `prediction_unknown` and
  `shield_blockable` as distinct states; and
- source revision and every voxel/entity fact used by the forecast.

The sensor reports consequences, not strategy. It may rank time-to-impact and
collision risk, but it must not choose “block left” or “dodge right.”

### Hostile and boss facts

For each admitted hostile candidate, preserve entity type/reference, distance,
bearing, relative elevation, velocity, line of sight, targeting relation,
reachable/unknown status and last material change. When observable, add held
weapon, use/attack animation, hurt time and current health fraction.

Boss observations additionally carry boss-bar identity and health, Wither
invulnerability/spawn countdown, armored phase, head targets/projectile origins,
current height band, block-destruction event references and an explicit reason
when a phase fact is unavailable. Absence of the boss bar alone is not proof of
death; terminal verification also requires the entity outcome and reward
postcondition.

### Defensive affordances

The frame may expose a bounded set of decision-neutral defensive candidates:

- shield line/angle and whether the admitted hand can block in time;
- collision-checked left/right/back step footholds and nearby admitted cover;
- predicted hazard introduced by each candidate, including fire, lava, fall,
  entrapment, unknown coverage and leaving the arena boundary; and
- time budget before predicted impact.

The frame must preserve all retained candidates and their costs. Runtime Codex
or the already-admitted guardian repertoire selects among them.

## Required governed action surface

The first combat implementation should add explicit semantics rather than hide
combat inside generic `interact`:

| Capability | Bounded contract | Required terminal measurements |
| --- | --- | --- |
| `com.casimirbot.minecraft.player.combat.attack` | One admitted target incarnation; hostile classification; current LOS/reach; minimum attack-cooldown fraction; maximum pulse count and ticks; `friendly_fire=false`. | target reference, pulse ticks, cooldown at pulse, reach/LOS, target health/hurt transition when observable, damage attribution, misses, inventory/world mutations and control release. |
| `com.casimirbot.minecraft.player.item_use.maintain` | One exact admitted hand/item and mode: `shield_block`, `bow_draw`, `consume`, or other separately reviewed mode; finite hold and release conditions. | use start/end ticks, held duration, item state, projectile/release event where applicable, consumed count, health/effect delta and continuous-use release. |
| `com.casimirbot.minecraft.player.combat.guardian.execute` | Finite `survival_tas` response graph with exact target classes, arena bounds, response vocabulary, health/resource floors, max ticks and `combat_allowed=true`; no commands or target invention. | every triggering observation, selected admitted response, arbiter result, controls/resources, damage avoided/taken, target/resource changes, interruptions, abstentions, escalations and terminal release. |

Combat admission fails closed when the target is stale, friendly/neutral,
outside the arena or lease, occluded beyond the action contract, from a new
incarnation, or no longer hostile. An area attack or ambiguous crosshair pulse
is outside v1. The guardian may retreat or abstain without attacking.

## Arena construction and reset contract

### Repository assets

Create a provider-neutral fixture package under a future
`scripts/fixtures/minecraft-combat-v1/` directory:

- one JSON manifest per arena;
- optional Minecraft structure template(s) identified by checksum;
- one credential-free planner that validates and previews setup/reset operations;
- deterministic Java fixtures for trajectory, geometry and response selection;
- an acceptance runner that correlates A0/A1/B receipts without executing a
  private strategy; and
- a screenshot index containing path, SHA-256, world/tick/revision and whether
  the image was captured before or after the tested decision.

The manifest is the canonical arena description. A structure file is only a
versioned block-layout asset; it does not own test meaning or acceptance.

```json
{
  "schema": "helix.minecraft_combat_arena.v1",
  "arena_id": "projectile_calibration_v1",
  "arena_version": 1,
  "lane": "command_assisted_sandbox",
  "world_id": "fixture-bound-at-runtime",
  "dimension": "minecraft:overworld",
  "bounds": { "min": [-8, 0, -8], "max": [8, 6, 8] },
  "spawn_points": {},
  "equipment": {},
  "rules": {},
  "perturbations": [],
  "success_thresholds": {},
  "failure_conditions": [],
  "reset_recipe": {},
  "screenshot_checkpoints": []
}
```

Every setup binds the actual server, dimension, player, origin, world revision,
manifest hash and resulting fixture checksum. Setup receipts are ineligible as
combat success evidence.

### Reset procedure

For diagnostic arenas:

1. stop or pause measurement and release Player Embodiment controls;
2. acquire a narrow fixture-only World Authority lease;
3. restore/build the exact arena and populate the declared entities/items;
4. verify blocks, gamerules, difficulty, entities, inventory and player spawn;
5. release World Authority and prove it inactive;
6. rotate to a fresh trial identity and capture the pre-trial snapshot; and
7. admit only the exact Player Embodiment combat envelope for the arena.

For the legitimate Survival lane, stop the server and restore the dedicated
world directory from a verified offline snapshot. Restarting rotates connector
and actor runtime identity; no old proposal or lease survives. The measured run
begins only after fresh binding, `keepInventory=false`, Survival mode and absent
World Authority are observed in-band.

## Arena ladder

Dimensions below are reference envelopes and may be adjusted once fixture
collision tests establish the smallest non-distorting space. Any adjustment
increments the arena version and invalidates comparisons to the old layout.

| ID | Arena and construction | Capability isolated | Pass evidence |
| --- | --- | --- | --- |
| C0 | **Zombie baseline ring**, approximately 17×17×6. One adult unarmored zombie, no other mobs, no projectile sources, daylight-neutral enclosure, fixed player/zombie spawn points and an exclusion buffer. Begin with a separated observation/track trial, then a bounded defend-and-defeat trial. | Exact hostile/target incarnation, approach direction, facing, LOS/reach, cooldown-aware attack, zombie attack/damage attribution, knockback recovery, retreat and death verification. | Only the admitted zombie is attacked; at least one player attack produces a verified zombie hurt/health transition; any player damage is attributed; the zombie death/absence settles consistently; no friendly/neutral hit; controls and target lock release. |
| C1 | **Static projectile calibration**, approximately 17×17×7. Dispensers fire arrows from fixed front, rear and side bearings through open, slit-occluded, collision and labelled near-miss lanes. No hostile mob is needed. | Same-tick projectile vectors, trajectory support, collision versus near miss, occlusion and impact-side labelling. | 100% collision-threat recall in the finite fixture set; no false `safe` under incomplete evidence; bounded near-miss false-positive rate; frame latency budget retained. |
| C2 | **Shield timing corridor**, approximately 5×24×5. One fixed dispenser first, then one skeleton behind a slit; fixed shield and food inventory. | Maintained use, shield angle, time-to-impact, block start/hold/release and damage measurement. | Deterministic arrow blocks settle without leaked use state; live block rate threshold passes; damage or miss is attributed; manual override and Emergency Stop release use immediately. |
| C3 | **Evasion and cover court**, approximately 25×25×7. Side/front projectile sources, pillars, two safe footholds, one hazardous/unknown candidate and a blocked route. Attacking is disabled. | Peripheral threat awareness, ranked defensive affordances, native bounded reroute, collision-free sidestep/retreat and abstention. | The guardian never selects the labelled hazardous/unknown foothold, reroutes on one perturbation, stays inside bounds and reports the exact intervention. |
| C4 | **Ranged duel court**, approximately 31×31×10. Run a skeleton case in the Overworld fixture and a separate blaze case in a Nether-themed diagnostic fixture with fire-safe reset. | Bow draw/release, line of fire, projectile defense while attacking, cover choice, fire-effect recovery and resource accounting. | Projectile and item-use events correlate to the admitted target; cover/defense continues during semantic delay; inventory and health effects are exact. |
| C5 | **Mixed-pressure court**, approximately 33×33×10. Begin with zombie plus skeleton; add blaze only in a separately versioned case after the two-enemy case passes. | Target priority remains Runtime-Codex-owned; local guardian arbitrates defense, camera, locomotion and hand resources without a second planner. | One serialized mutation/control path, no target confusion, no duplicate attacks after reconnect, one semantic priority replan and safe retreat on a resource floor. |
| C6 | **Miniboss rehearsal**, approximately 41×41×12, using a ravager in the diagnostic lane. | High-health target tracking, knockback recovery, navigation under pressure, healing/retreat thresholds and long action duration. | Sustained viability, accurate target-health changes, bounded local recovery during Codex delay, no arena escape and a supported terminal result. |
| C7 | **Wither diagnostic arena**, minimum approximately 65×65×25 in an isolated disposable world. Prebuilt gear and fixture spawn are permitted only before measurement; World Authority is then released. Avoid bedrock containment that removes intended navigation/destruction behavior. | Full Wither sensing, phase changes, multiple projectile origins, block destruction, resource policy and semantic phase replanning. | Diagnostic defeat or accurate bounded failure with complete causal trace; command-assisted result remains labelled ineligible for legitimate completion. |
| C8 | **Legitimate Survival Wither zone**, a naturally generated isolated area in a separate disposable Survival world with at least a 96-block protected exclusion radius from anything intended to be preserved. The player legitimately acquires gear and constructs the Wither. | End-to-end durable preparation, legal summoning, combat guardian, semantic strategy, recovery and terminal proof under authentic consequences. | Player survives; Wither entity and boss bar settle consistently; Nether Star is observed and acquired; no forbidden authority/effect occurred; controls release; cross-surface evidence and screenshots agree. |

C0–C6 are repeatable capability tests. C7 is a rehearsal and integration
diagnostic. C8 is the legitimate acceptance run. A C7 success cannot waive a
failed or unrun C8.

## Acceptance thresholds

### Deterministic and timing thresholds

1. Combat-frame capture retains the existing local p95 budget of 4 ms across
   the finite deterministic and warmed live samples.
2. A critical admitted projectile threat is classified and activates its
   already-admitted local response no later than the next client tick after the
   qualifying frame.
3. Collision-threat recall is 100% in the finite C1 fixture. Unsupported or
   incomplete trajectory evidence must be `unknown`, never `safe`.
4. Labelled near misses do not activate an evasive response in more than 5% of
   the live repeated C1 trials. Diagnostic false positives remain visible.
5. The deterministic C2 battery releases continuous use on 100% of terminal
   paths. The live repeated shield trial must block at least 95% of otherwise
   colliding supported arrows; every miss retains an attributable reason.
6. Manual override, authority loss and Emergency Stop cause local control/use
   release by the next client tick. The governed terminal control receipt must
   arrive within the existing two-second local dispatch-to-observation budget.
7. Semantic combat events are ordered, deduplicated and visible before the next
   strategy-changing action. Raw unchanged ticks are not projected through MCP.

### Safety and authority thresholds

1. Every target and action binds the current actor/target incarnation,
   observation revision, arena, lease and policy revision.
2. No friendly, passive, neutral, stale, occluded-unverified or out-of-bounds
   entity receives an attack pulse in v1.
3. One execution arbiter owns camera, locomotion, attack and continuous-use
   resources. Reconnect/replay can redeliver evidence but cannot repeat a
   physical attack or item use.
4. A changed target, phase, arena boundary, health/resource floor, coverage gap
   or connector epoch invalidates incompatible pending work before execution.
5. Death, unreleased controls, unsupported World Authority during measurement,
   `keepInventory=true` in C8, Creative mode, teleportation, fixture-provided
   final gear, or a command-spawned C8 boss is a hard acceptance failure.
6. The operator can inspect active target/effect scope, guardian state,
   authority, health/resource floors, latest intervention and stop control
   without seeing credentials or hidden reasoning.

### Final Wither postconditions

C8 succeeds only when all of the following agree in one causal record:

- the same legitimate durable run performed preparation and summoning;
- the player remains alive and controllable;
- the admitted Wither incarnation is dead or absent through an exact terminal
  entity observation, and the matching boss bar is gone;
- the Nether Star appears through a measured drop/inventory transition and is
  acquired by the player;
- expected combat-caused block/inventory mutations remain inside the admitted
  envelope;
- no command, Creative, teleport, World Authority or duplicate physical effect
  occurred during the measured run;
- every asserted control and maintained item-use state is released; and
- Runtime Codex's supported completion candidate retains the same evidence
  references through Helix terminal authority and operator presentation.

## Screenshot and replay proof

Screenshots validate the operator-visible world state; they do not inform the
tested decision path. Each live arena records at least:

1. pre-trial arena, inventory, game mode and authority state;
2. first threat acquisition;
3. first local defensive intervention;
4. one material strategy or phase change;
5. terminal state and released controls; and
6. for C8, the Wither terminal state and Nether Star postcondition.

Every screenshot entry binds filename/hash, arena/trial identity, game tick,
observation revision, action/program reference and capture timing
(`afterward_only=true`). A short replay artifact correlates authoritative combat
frames, resident decisions, arbiter outcomes, action receipts, semantic monitor
cursor, durable-goal revision and screenshots. Hidden reasoning and raw
credentials are excluded.

## Delivery and promotion order

### P0 — seal contracts and fixtures

- define combat frame, zombie/target lifecycle, projectile forecast, boss state and arena-manifest
  schemas;
- freeze C0 zombie and C1–C3 deterministic geometry/projectile labels using
  Fabric GameTest and versioned structures;
- add target eligibility, friendly-fire and authority negative tests; and
- implement credential-free setup planning and offline-reset verification.

### P1 — explicit combat actions

- implement the vanilla-backed target-bound attack first, then maintained
  item-use lifecycles;
- preserve cooldown, target hurt/health, inventory, damage and control-release
  measurements; and
- keep `combat_allowed=false` for every legacy program unless the exact new
  combat capability and finite lease are admitted.

### P2 — resident combat guardian

- add the finite response vocabulary behind the existing local arbiter;
- prove one-tick response, resource arbitration, abstention, interruption and
  release; and
- project semantic changes through the existing monitor without tick spam.

### P3 — deterministic and direct A0 arenas

- pass the C0 zombie fixture first, then C1–C3 fixtures and performance thresholds;
- run the production Fabric controller through the direct diagnostic actuator;
- preserve `helix_terminal_authority_status=not_applicable`; and
- use Baritone only as an optional movement A/B oracle, never as combat decision
  authority or required runtime.

### P4 — authenticated MCP A1 and keyed Helix B parity

- restore equivalent arena starts for A0, A1 and B;
- submit the same natural objective and capability descriptions;
- compare request, admission, execution, normalization, re-entry, Codex repair,
  materialization, terminal authority and presentation; and
- stop at the first divergence instead of modifying the prompt or encoding the
  successful procedure.

### P5 — live progression ladder

- pass C0 zombie first, then C1 projectile calibration, C2 skeleton/shield,
  C3 evasion, C4 skeleton/blaze, C5 mixed pressure and C6 ravager in order;
- require the prior arena's regression to remain green; and
- produce screenshot/replay and manual/Emergency Stop evidence at each tier.

### P6 — diagnostic and legitimate Wither

- run C7 only after C0–C6 pass;
- use its failures to repair general observation/action/controller contracts;
- restore a fresh C8 Survival world after every failed legitimate attempt; and
- promote only the C8 cross-surface trace to legitimate Wither evidence.

## Stop and rollback conditions

Stop the current tier and return to the first failing lower arena when any of
the following occurs:

- a projectile collision or hostile target is missing from complete supported
  coverage;
- a near miss and collision are conflated without an explicit uncertainty;
- an action attacks an unadmitted entity or repeats after reconnect;
- the local guardian misses its tick deadline or waits for Runtime Codex to
  perform a defensive reflex;
- a strategy-changing action begins before the prior receipt/change re-enters;
- control, attack, shield/bow use or a pathing process remains asserted after a
  terminal path;
- World Authority remains active when diagnostic measurement begins;
- the operator trace and MCP evidence disagree on target, tick, authority,
  action or outcome; or
- a screenshot is used as hidden input rather than afterward-only proof.

Do not tune directly on C7/C8 until the equivalent failure is represented in a
smaller deterministic or live arena. Failed live attempts remain immutable
evidence.

## Verification plan

The implementation packet that follows this specification should add focused
commands with exact filenames. The expected verification classes are:

```text
Fabric projectile/trajectory and same-revision combat-frame unit tests
Fabric target eligibility, attack, item-use and guardian scheduler tests
TypeScript schema, catalog, admission, idempotency and semantic-monitor tests
C0-C3 Fabric GameTest, arena-manifest and result-verifier tests
A0 direct-controller fixture traces
A1 authenticated MCP traces
B keyed natural-prompt first-divergence traces
C0-C8 live arena artifacts and screenshot indexes as each tier opens
npm run helix:ask:discipline:full  # when live-source identity/continuation changes
npm run helix:environment-harness:docs-audit
```

Casimir verification is required only if a later implementation touches the
verification gate's physics, adapter-contract, constraint-pack,
training-trace, certificate, CI/release or proof-maturity surfaces. This
documentation packet does not claim a Casimir verification result.

## Current disposition

### Implementation evidence — 2026-08-25

The first C0 increment is now **deterministically verified**:

- `shared/helix-minecraft-combat.ts` seals v1 combat-frame, target lifecycle,
  projectile-forecast, boss-state and arena-manifest schemas. Incomplete
  projectile evidence cannot be labelled `safe`, and C0 admits exactly one
  adult, unarmored, non-projectile hostile zombie.
- `scripts/fixtures/minecraft-combat-c0-zombie-baseline-v1.json` and
  `scripts/helix-minecraft-combat-c0-arena-plan.ts` provide a hashed,
  credential-free, setup-only C0 plan with snapshot restore, explicit authority
  separation and an exact runtime target-lock requirement. Six focused
  TypeScript fixture/contract tests pass.
- Fabric GameTest is configured for the player-agent module. The versioned
  17×17×7 C0 structure and `CombatArenaGameTests` verify enclosure geometry,
  one adult unarmed hostile zombie, absence of projectiles, and vanilla
  hurt/health/death transitions. The dedicated GameTest server reported all
  three required tests passed.
- `com.casimirbot.minecraft.player.combat.attack` is **implemented** and
  **deterministically verified** across the shared action contract, catalog,
  action profile, broker evidence normalization, diagnostic inbox and native
  Fabric controller. The action uses the vanilla client attack path for one
  prior opaque target lock, rejects substitution/non-hostile/occluded/out-of-
  reach targets, gates pulses on cooldown, observes hurt/health/death, and
  releases controls on terminal/manual paths. Legacy sequence and reactive
  program schemas still retain `combat_allowed=false` and do not embed attack.
- Focused TypeScript suites passed 55 assertions across schema, arena plan,
  action contract, catalog parity and action-result evidence. The Fabric
  `PlayerActionControllerTest` suite passed with exact-target success, refusal,
  cooldown and manual-release cases. Helix discipline quick checks and the
  environment-harness documentation audit passed.
- Adapter verification passed as trace
  `adapter:61771910-3a99-490b-bffc-e6da03cb05c4`, run `2524`, with certificate
  hash `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
  and integrity OK.

### Live direct A0 evidence — 2026-08-26

The production Fabric client passed the canonical direct A0 C0 observation and
defend-and-defeat sequence on the disposable direct-connect server at
`localhost:25566`. The preserved Survival/Nether world at `localhost:25565`
remained untouched.

- The frozen-target track trial retained the exact adult zombie for 20/20 ticks
  with zero target-loss ticks, mean angular error `0.54` degrees, p95 angular
  error `4.00` degrees and released controls. It yielded opaque incarnation
  reference `target:beca5033a7b7219e7962081f3397cf053cf34a5a`.
- The first live attempts remain failure evidence. They exposed, in order, an
  omitted diagnostic-inbox `attack` admission, a missing finite outer deadline
  for the staging envelope, and a second runtime diagnostic allowlist that did
  not expose `attack`. Each was repaired at the general contract boundary and
  protected by focused tests before retrying; no successful procedure was
  encoded in the arena prompt.
- The final attack workflow
  `direct_player_action_workflow:e400c081-f1ec-4219-bfb1-2df0cd3b9c5a`
  started with the exact prior target reference, hostile classification,
  `friendly_fire=false`, LOS required, vanilla interaction reach and a `0.9`
  minimum cooldown. It sent four cooldown-admitted iron-sword pulses, observed
  four hurt/health transitions, emitted `waiting_for_vanilla_reach` while
  knockback placed the target outside legal reach, then observed
  `reason_code=target_dead`, `target_health=0`, `target_defeated=true`, zero
  rejected pulses, no safety interruption and `controls_released=true`.
- Public receipt capture is stored at
  `artifacts/helix-minecraft-combat-c0/a0-exact-zombie-defeated-v1.json`.
  The afterward-only proof image is
  `artifacts/helix-minecraft-combat-c0/c0-exact-zombie-defeated-v1.png`, SHA-256
  `9de25e5a4cad40eae68eadcf54c37ccce6f0bc5082c5cfbb3fddaa50c9a7cc08`,
  indexed by `c0-screenshot-index-v1.json` at terminal client tick `1769` and
  world tick `40147`. The screenshot was not an action input.
- The repaired artifact installed in the test profile has SHA-256
  `03fb510481b5272bb9eb5b5352b2072e8da585fb415a54e0a3471f37484479fb`.
  Focused Java controller, inbox and runtime-lifecycle tests passed on Java 21;
  all three required Fabric GameTests also remained green. The staging-envelope
  regression suite passed 10/10 tests.
- Adapter verification passed again after the live repairs as trace
  `adapter:4fb1b1c6-7995-4fbd-8fe5-bc1187f292b3`, run `2525`, with certificate
  hash `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity OK and GREEN status.

### Authenticated MCP A1 admission evidence — 2026-08-26

An initial A1 request exposed a translation-only divergence: the canonical MCP
target correctly required `selection="nearest"`, but the MCP-to-gateway
normalizer leaked that fixed invariant into the flat provider schema, where it
was rejected as an unadmitted property. The normalizer now removes only that
redundant flattened field; the gateway continues to materialize
`selection="nearest"` into the strict connector action. The focused MCP action
boundary suite passes and Helix Ask discipline quick static checks pass.

After the keyed server restart, the operator identified that the client had
been left on the disposable `localhost:25566` arena server rather than the
Fabric/Helix direct-connect world. The client was disconnected from that server
and connected explicitly to `localhost:25565`. Fresh authenticated evidence
then identified player `DatDamPig`, world `minecraft:overworld`, position
`(-30.09, 14, 3.5)`, and a live same-revision perception snapshot. The separate
Player Embodiment pairing was rotated locally after restart; its manifest was
admitted with 19 capabilities and a fresh active heartbeat.

The repaired A1 camera-track request reached native Fabric execution as action
request `environment_action_request:467dd69f-f1e9-4adf-87c5-77c4fa9f5dad`
and workflow
`environment_action_workflow:a3a433c9-e33d-44ff-836b-3989630fa716`.
It failed with the expected typed result `No matching entity could be acquired
inside the admitted tracking envelope` because no zombie was present within 16
blocks. Provenance was valid, no attack occurred, inventory and world mutation
were false, and controls released. This proves repaired A1 admission and
dispatch, not C0 combat parity.

The `localhost:25565` Survival/Nether world remains ineligible for destructive
arena testing. Equivalent A1 C0 evidence must use a disposable fixture world
with both the sensor and Player Embodiment connectors paired to its own world
identity. The direct A0 evidence from `localhost:25566` remains valid but cannot
be relabelled as authenticated A1 evidence.

### Repeated topology correction and operator fail-closed repair — 2026-08-26

The client was later found on the C0 server again while the intended operator
session was the preserved Fabric direct-connect world. It was disconnected from
`localhost:25566`, the preserved server was restarted, and the client was
connected explicitly to `localhost:25565`. The server and TCP observations agree
that `DatDamPig` is connected only to the preserved world at approximately
`(-30.09, 14, 3.50)`; the isolated C0 source remains active in its separate room
but correctly reports zero online subjects. No combat or World Authority action
was issued during the correction. The credential-free observation is
`artifacts/helix-minecraft-combat-c0/topology-correction-2026-08-26-v1.json`.

This repeated operator/agent mistake exposed a presentation defect even though
the subject/action boundary itself remained fail closed: the room card showed an
active connector and a low-emphasis empty subject selector without making the
wrong-world consequence prominent. The room environment card now displays its
exact bound `world_id` and shows an explicit warning when a fresh connector has
no online player: Player Embodiment must not be paired and player actions must
not run until the intended client appears and is selected. The Player
Embodiment panel remains absent in that state. The focused room-source UI suite
passes 7/7 tests.

The loopback workstation lifecycle now also accepts an explicitly selected
Fabric launcher profile and an `AllowAdditionalClient` mode only when that
profile has a separate game directory. A credential-free provisioner prepares
one bounded C0 profile with a 512–1536 MiB validated memory ceiling, a small
explicitly selected jar set, loopback-only autojoin, low render/simulation settings and
a first-write-preserved launcher-profile backup. It neither reads nor emits a
Minecraft/Microsoft credential. Two focused tests prove preparation,
idempotent backup preservation, loopback rejection and same-directory
rejection; the PowerShell launcher parses cleanly. The real profile was prepared
for `localhost:25566` with a 640 MiB ceiling while the existing client remained
connected to `localhost:25565`. Its credential-free receipt is
`artifacts/helix-minecraft-combat-c0/isolated-client-profile-preparation-v1.json`.

### Isolated-client live launch and host-envelope stop — 2026-08-26

The operator accepted the Minecraft Launcher's standard modified-installation
warning. The isolated Fabric client launched successfully as PID `26184`, loaded
the Helix Fabric Player Agent, consumed a fresh one-shot loopback autojoin
request, and established a TCP connection only to `127.0.0.1:25566`. The
preserved client PID `2056` remained connected only to `127.0.0.1:25565`. This
proves isolated-client launch and port separation without moving or mutating the
preserved player. The afterward-only screenshot
`artifacts/helix-minecraft-combat-c0/isolated-c0-arena-joined-2026-08-26.png`
shows the isolated player inside the sealed C0 arena with the zombie fixture;
its SHA-256 is recorded in the launch receipt, and it was not used to choose a
gameplay action.

Exact-world A1 admission could not safely continue under the simultaneous
two-client, two-server workload. The previously running keyed runtime had
already terminated at its 1280 MiB Node heap ceiling. A fresh restart through
the approved opaque launcher reached the `1522` listener but remained in
bootstrap with HTTP 503 responses while host physical memory rose to 96.8%.
The runbook's 95% hard stop was applied immediately; only that fresh keyed
runtime was terminated. Memory recovered to 84.2%, port `1522` closed, and both
Minecraft TCP sessions remained intact. The credential-free receipt is
`artifacts/helix-minecraft-combat-c0/isolated-client-live-launch-2026-08-26-v1.json`.

This is an infrastructure-capacity stop, not a C0 combat or connector failure.
The next safe promotion attempt must first free one bounded in-scope runtime.
The least disruptive candidate is to temporarily disconnect the preserved
`25565` client while leaving its server/world intact, then restart the keyed
runtime, admit and pair the isolated `25566` subject, and run the unchanged C0
A1/B prompt. Do not stop unrelated user processes or relax the memory guard.

After the extra Minecraft client was closed, the exact topology was retried
with 2922 MiB free physical memory: only the isolated C0 client remained online
and the preserved `25565` server/world remained idle. The keyed runtime reached
`app ready`, and account-session, Helix-pipeline and agent-provider health all
returned HTTP 200. Its settled startup footprint nevertheless raised physical
memory to 96.0%, so the same 95% hard stop was applied before room admission or
pairing. The C0 client remained connected and memory recovered to 82.7%. This
proves that closing only the extra client is insufficient; another bounded
approximately 1.0–1.5 GiB of pre-start headroom is required. The observed
candidates are the idle preserved `25565` Fabric server (approximately 617 MiB)
and Docker/WSL (approximately 945 MiB), but neither may be stopped without an
explicit scope decision.

Adapter verification passed for this increment as trace
`adapter:9a5d624d-0602-41e2-aac0-c044125744d5`, run `2526`, with certificate
hash `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
integrity OK and GREEN status. The focused UI/provisioner battery passes 9/9,
the client build passes, Helix Ask discipline quick static checks pass, and the
environment-harness documentation audit passes.

**NO-GO for a Wither combat attempt.** Direct A0 C0 and isolated-client launch
are now passed, but
authenticated MCP A1 and keyed Helix B parity have not yet reproduced the same
natural objective and terminal evidence. Resident approach/retreat arbitration,
same-revision combat sensing, projectile calibration, maintained item use and
C1–C6 live evidence remain open. The next promotion gate is equivalent C0 A1/B
evidence followed by C1 projectile calibration; only then can the ladder advance
toward shield, mixed-pressure, miniboss and Wither tiers.

### Keyed C0 route-admission and owner-room authority repair — 2026-08-26

The isolated topology subsequently reached a safe keyed acceptance envelope
without stopping Docker/WSL or the preserved `25565` server. Explicit JVM
collection reduced the isolated client and both Fabric server heaps enough for
the approved opaque launcher to reach `app ready`; the isolated client remained
connected only to `127.0.0.1:25566`. The C0 source and DatDamPig Player
Embodiment were paired through their owner-private inboxes without exposing a
pairing command. The room showed the exact C0 world, 12 read capabilities,
DatDamPig identity, an active 19-capability player lease including combat
attack, a fresh client heartbeat and observation-only command authority.

The first unchanged C0 B turn failed before any tool call as
`native_route_proposal_missing`: the native model saw all 31 admitted read and
player-action capabilities but selected none. The Codex-native base
instructions now state the general contract that a connected-environment state
or effect request is incomplete until a matching dynamic Helix tool returns an
observation; uncertainty requires the narrowest matching read instead of an
unsupported terminal answer, while unsupported action evidence requires a
typed safety stop. This is generic route/tool-admission guidance and does not
encode Minecraft, zombie targeting or a successful combat procedure. The
focused native app-server assertion passes with one worker.

The required static Helix Ask discipline check passes. A serialized one-worker
run of `helix.ask.prompt-solving-benchmark.test.ts` was also attempted while
the keyed harness and live C0 fixture remained online, but did not complete
before host physical memory reached 94.8%. Only that test runner was stopped
under the 95% runbook guard and memory immediately recovered to 80.0%. This is
capacity-incomplete evidence, not a benchmark pass or product failure; the
broader benchmark remains required when the live fixture no longer needs to
share the constrained host.

On replay, Codex proposed
`com.casimirbot.minecraft.actor.status.read`, Helix admitted and executed that
exact route, and the failed observation re-entered the same native turn. This
closes the original route-proposal divergence. No camera, movement, attack,
command or World Authority mutation occurred.

Two replacement rooms then exposed the next divergence precisely. One room
was accidentally lifecycle-closed by treating the destructive **Close room**
control as a dialog-dismiss action; its `permission_revoked` result is an
operator error and not product evidence. A second replacement room,
`shared_realtime_room:67ce81da-fbb9-4fa5-9eaf-f7f71fff9f9c`, was kept open by
using the non-destructive Room panel toggle. Its server lifecycle remains
`waiting_for_participant`, with the C0 source and Player Embodiment ready. That
status is valid for an owner-only first-party environment turn: the durable
broker admits any non-closed room whose exact authenticated member is present
with current consent. The earlier conclusion that a second participant and a
two-member **Ready** state were required was incorrect.

The unchanged Ask turn selected actor-status correctly but the gateway denied
execution before dispatch because the exact browser owner's stored room
presence could age out during the native model step. The probe renewed presence
only for an authenticated in-game interaction, even though a trusted browser
Ask is also an active first-party room client. The gateway now renews only the
server-resolved first-party membership immediately before the probe. Room
closure, explicit leave, identity mismatch and consent change still fail
closed; external Agent API runs still require their exact active durable
run-room binding and receive no first-party renewal.

The focused environment-probe battery passes 34/34, including an owner-only
room whose readiness projection still reports one missing participant, a
separate external-run non-renewal assertion, and the existing closure,
presence and consent-revocation cases. The next exact step is to restart only
the keyed CasimirBot harness through the approved opaque launcher, preserve the
current C0 Minecraft topology, and rerun the unchanged C0 prompt. C0 A1/B
combat parity, C1 and all later tiers remain open; the Wither decision remains
**NO-GO**.

The canonical opaque launcher subsequently restarted the keyed harness with
the patched code. Account-session, Helix-pipeline and agent-provider health
returned HTTP 200; the current one-member room still showed its owner present,
the Fabric source active in the exact C0 world, DatDamPig selected, and the
19-capability Player Embodiment lease fresh. The unchanged C0 replay was then
rejected at Ask admission as `capacity_unavailable` before Codex sampling,
gateway execution or any Minecraft action. The runtime governor reported an
`active_user_turn` decision of `reject_memory_pressure` with reason
`host_memory_limit`, zero active tasks and approximately 1.2 GiB host physical
memory free. A bounded explicit GC request to only the three known Minecraft
JVMs completed but did not restore the admission reserve; host use remained
below the 95% hard-stop line but above the 90% warning line. Docker/WSL, both
Fabric servers, the Minecraft client and the keyed harness were left running.
This replay therefore neither passes nor falsifies the live owner-room repair.
The next safe C0 B attempt requires enough host headroom for the unchanged
runtime memory policy; do not lower or bypass that guard.
