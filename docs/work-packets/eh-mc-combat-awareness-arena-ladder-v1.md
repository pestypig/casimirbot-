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

### C0 provider lifecycle and camera-evidence repair — 2026-08-26

After local persistence compaction restored enough bounded headroom, the
unchanged C0 turn reached the native Codex loop. Two general lifecycle defects
were repaired before any combat action was accepted:

- owner-only first-party room presence is renewed from the exact authenticated
  browser membership immediately before an environment probe, while external
  runs, closed rooms and identity or consent changes remain fail closed; and
- a provider runtime cycle is complete after `runtime.turn.completed`, final
  agent output, post-observation reasoning and zero pending tool calls. It no
  longer circularly requires the later Helix terminal event. An exact governed
  observation packet can also prove its declared capability from its typed
  capability identity and observation schema instead of incidental prose.

The focused environment-probe suite passes 34/34 and the runtime-authority
contract suite passes 52/52. On live replay, Codex then executed the same-revision
perception snapshot, exact nearby-zombie read and bounded camera tracker in
order. The previous generic missing-runtime-authority reasons disappeared;
Helix retained only `goal_satisfaction_not_terminal`, correctly preventing a
combat completion claim after the camera receipt was rejected.

The camera rejection was traced to the Fabric measurement source, not to a
missing event or relaxed server policy. Action request
`environment_action_request:fccfc313-7327-4da9-b7b6-1e5420c71f0f` and workflow
`environment_action_workflow:59539b62-c2ce-45ba-8146-d8245ebaa995` recorded all
five referenced events, the exact terminal event, released controls and 60/60
retained target ticks. Its histogram rounded a sub-degree p95 error upward to
`1.0` degree while the exact observed maximum was
`0.6875163819559228` degree. That impossible `p95 > max` relation correctly
failed the server verifier.

`PlayerActionController` now clamps the upper-bound histogram estimate to the
exact observed maximum, preserving the mathematical `p95 <= max` invariant
without weakening server-side evidence validation. A sub-degree regression
reproduces the old failure. The focused controller suite and all three required
Fabric GameTests pass on Java 21; the complete player-agent build passes. The
installed isolated-profile artifact is
`HelixFabricPlayerAgent-0.4.0.jar`, SHA-256
`e01dcab0fbe4f7f1556e8f50376661baf33d4893582a83c7e3f2897574d87049`;
the prior artifact is preserved outside the `mods` directory.

The isolated client was relaunched and joined only `127.0.0.1:25566`. Its log
proves `Helix Fabric Player Agent loaded with a separately paired action
authority`, and the client holds exact loopback connections to the arena and
the keyed harness. The existing room recovered without re-pairing: Fabric
source active, 19 admitted reads, bound world
`minecraft:connector:e64fda9a-4f6`, DatDamPig selected, observation-only command
authority, and active/client-ready 19-capability Player Embodiment including
combat. The heartbeat was current after restart.

The unchanged post-repair replay was admitted to the UI but rejected by the
runtime governor as `memory_hard_pressure` before Codex sampling or Minecraft
action. A separate Casimir Node listener on port `5050` and a separate Chrome
tree appeared during this interval and consumed approximately 1.8 GiB; they
belong to other work and were not stopped. Docker/WSL was not touched. The idle
preserved `25565` server was stopped through a console control signal, reached
`Stopping server`, and was restored from its exact root under a retained console
session, but overlapping external work still prevented safe admission. This is
a genuine capacity blocker for the next live replay, not a camera or combat
failure. C0 A1/B remains open at the unchanged prompt; C1-C8 and the Wither
decision remain **NO-GO** until that replay passes and the ladder advances.

### C0 exact-effect continuation and release-readiness findings — 2026-08-26

The disposable owner-only C0 topology was recovered without requiring a second
room participant. The active room is
`shared_realtime_room:61732092-6036-4dc1-a367-337ed18b069b`, the exact Fabric
world is `minecraft:connector:e109834f-147`, DatDamPig is selected, command
authority remains observation-only, and the separate Player Embodiment lease
is active/client-ready with 19 capabilities including combat attack. The
isolated client profile is selected with
`HELIX_MINECRAFT_PLAYER_GAME_DIR=C:\Users\dan\AppData\Roaming\.minecraft-helix-c0`.
The preserved `25565` Survival/Nether server was cleanly saved and stopped to
free bounded in-scope capacity; Docker/WSL and the unrelated port-5050 workload
were not touched.

The wrong-profile local handoff was repaired in
`local-player-pairing-handoff.ts`: an explicitly selected isolated game
directory is validated fail closed and handed to the Fabric client lifecycle
without reading or exposing a Minecraft/Microsoft credential. Its focused
battery passes 4/4, and the live C0 rotation recovered the source, DatDamPig
binding and action heartbeat after keyed restarts. The user-facing Player
Embodiment panel now exposes **Pair local player privately** through a
same-origin owner-only route. It creates the action-only rotation, stages the
generated command into the bounded configured Fabric-profile inbox, and returns
neither the one-time code nor connector credential. The manual **Pair player
client in game** path remains available for a genuinely remote Minecraft
client, but local users no longer need its code rendered or copied. The focused
panel plus local-player handoff battery passes 8/8. One release-boundary issue
remains open: the current MCP authorization lacks
`helix.room_sources.manage`, which forced a server-console sensor pairing path.
Test operators must also never inspect or dump full Minecraft launcher process
command lines: a prior Win32 diagnostic exposed a launcher access token in tool
output. Opaque inbox/handle delivery is the required profile and room
credential boundary.

After the preserved server was stopped, the unchanged C0 prompt reached the
live action plane. Actor evidence
`environment_probe_evidence:59ac632c00c6aed503581b3bbbe902964f8168a6` and
target evidence
`environment_probe_evidence:55fd1e1f7ba9158b504c81fd1fdf2960b4b95b65`
verified DatDamPig at 20/20 health and one exact 20/20 hostile zombie at ten
blocks. Action request
`environment_action_request:a2889098-ce93-4d00-8604-00f9faa52920`, workflow
`environment_action_workflow:b84624e2-47b6-413e-8238-2e9be9b140cf`, execution
`environment_action_execution:670a96e7-2a76-4e86-bf30-14b0361c0a37` and
evidence
`environment_action_evidence:6acdd5d85cbf4e05e887d6bebbb65e6516849e7db`
prove 100/100 target-retention ticks, retained line of sight, approximately
0.69-degree mean angular error, zero loss/reacquisition ticks and released
controls. No attack or other mutation occurred.

That run exposed a terminal-contract defect: the generic
`minecraft.player_embodiment.action` any-of group treated successful camera
tracking as sufficient even though the affirmative prompt explicitly required
combat. Prompt interpretation now adds
`com.casimirbot.minecraft.player.combat.attack` as exact effect evidence for an
affirmative combat request while leaving attack arguments and execution choice
to Runtime Codex. Contextual, negated, quoted, historical, future and
explanatory combat mentions add no such requirement. The focused semantic
sequencing battery passes 72/72, and the exact provider regression passes.

The first post-patch live run correctly refused camera-only terminalization but
then failed closed as `subgoal_observation_missing`. Debug turn
`ask:1ff258cf-99eb-4bce-b38b-a396f84d39b9` showed that the admitted compound
ledger retained combat as mandatory subgoal two while post-camera continuation
consulted only an absent itinerary execution projection. Continuation
arbitration now also consumes the pending authoritative compound subgoal. It
does not choose combat or author arguments; it keeps the already-admitted
missing effect available for the next model decision. The focused regression
`continues from a pending compound combat rail when the itinerary projection is
absent` passes.

The runtime-governor rejection was diagnosed separately rather than weakened.
Its exact recorded reason was `host_memory_limit`; Node heap and RSS remained
inside their active-turn ceilings. The low-memory launcher now uses a calibrated
768 MiB active-turn burst estimate while retaining the immutable four-percent
physical floor, 1 GiB commit reserve, heap safety reserve and process ceilings.
The subsequent live turn was admitted with approximately 2.2 GiB free physical
memory. The task-class status surface previously reported the static 1536 MiB
catalog default while the actual effective limits and admission decision used
768 MiB. `getRuntimeTaskSnapshot()` now projects the same environment-resolved
limits used by admission instead of the immutable catalog seed. The complete
runtime memory-governor suite passes 37/37. After an opaque keyed-harness
restart, live `/api/runtime/tasks` and `/api/runtime/memory` both reported 768
MiB for the active-user-turn burst, with normal pressure, reason `ok`, and
approximately 3.3 GiB free physical memory. This release-polish defect is
closed.

The post-restart room state also revealed a durable UX defect: the first Ask
could use a non-room thread until the Shared GPT Live Room panel was opened once
and restored `helix-ask:room:<room_id>`. This produced a correct but avoidable
`permission_revoked`. Typed Ask submission now resolves its room scope against
the authenticated room service before constructing the backend thread ID. An
already selected room is re-read and rejected if closed; when client state has
not hydrated after restart, the only non-closed room is restored. Multiple open
rooms are ambiguous and now fail closed until the user or room UI supplies an
explicit selection; recency alone cannot choose authority. A room-service
failure stops submission with a typed client error instead of falling back to
an unrelated desktop thread. The focused room-scope battery passes 5/5, and the
Helix Ask discipline quick static guard passes. This repair is independent of
opening the room modal and requires no credential persistence in browser
storage.

The final unchanged replay loaded the continuation repair and its native trace
confirmed the full Minecraft read/action catalog, including
`com.casimirbot.minecraft.player.combat.attack`. It then stopped before any
gameplay decision with `native_provider_quota_exhausted`: the configured OpenAI
API account has no credits remaining. No connector re-pairing is required, no
tool was requested or executed, and the room subsequently showed the source
active, DatDamPig selected, command authority off, Player Embodiment active and
client-ready with a fresh heartbeat. This is an external provider-capacity
stop, not C0 combat evidence.

After the room-scope repair, the keyed harness and Minecraft telemetry remained
live, but the separate Codex MCP OAuth session could no longer refresh and both
the authorization-status and action-authority inspection calls returned
`OAuth authorization required`. This does not require a Docker, Minecraft or
keyed-harness restart and does not invalidate prior evidence. It is a second
external readiness gate for the next live replay: refresh the MCP OAuth session
and provide funded Runtime Codex capacity, then revalidate the exact room,
world and Player Embodiment lease before sending the unchanged C0 prompt.

The required prompt-solving benchmark completed 32 cases before its Vitest
worker RPC timed out under host pressure with six infrastructure errors and four
cases uncompleted; it is not a clean pass. The broad provider file produced 276
passes and 22 unrelated scholarly/Image Lens/translation failures, while both
new combat regressions passed. Helix Ask discipline quick static checks pass
with the change classified as prompt interpretation plus capability-itinerary
and terminal-evidence enforcement.

**NO-GO for C1 or a Wither attempt.** The harness now preserves exact combat as
a post-camera obligation and can re-offer the pending combat rail, but a funded
Runtime Codex turn must still execute the unchanged C0 prompt and produce exact
attack, target-health/death and all-path control-release evidence. Only that
evidence can close C0 and unlock C1 projectile calibration. The keyed harness,
C0 server/client and room are otherwise staged for that retry; Docker remains
outside this work packet's process authority.

### C0 private re-pair and quota-stop confirmation — 2026-08-26

The keyed harness was restarted only through the opaque launcher, the exact
`combat-c0-server` was restored on `127.0.0.1:25566`, and Docker/WSL remained
untouched. A source-only rotation was delivered through the connector's opaque
inbox without command or player-action authority. The room projection then
reported a fresh active Fabric source, DatDamPig selected, observation-only
World Authority and a separately paired Player Embodiment with all 19 declared
capabilities and a fresh heartbeat. No Minecraft command authority was enabled.

This recovery exposed two credential/profile boundaries rather than a gameplay
failure. The browser-owned `qte-demo-dev` room and the OAuth-owned `pestypig`
room are correctly tenant-isolated; the G2 bearer cannot inspect the former.
OAuth was reauthorized with the narrowly required
`helix.room_sources.manage` scope, but the already-running Codex task retained
its older in-memory MCP bearer. The refreshed credential is durable for the
next MCP connection; no Codex-app restart was forced while other user tasks
were active.

The unchanged C0 prompt was submitted in the live browser-owned room. Native
turn `ask:2910d15b-ce56-4492-8de4-eaacf38fc9b8` received the complete admitted
catalog: 12 read capabilities and 19 Player Embodiment capabilities including
camera tracking and exact combat attack. It stopped as
`native_provider_quota_exhausted` before the model selected a tool. The bridge
recorded zero requested, executed, successful or failed tools, zero observation
re-entry references and no terminal candidate. Therefore the player and zombie
were untouched, and this replay is clean provider-capacity evidence rather than
C0 combat evidence.

Local sensor pairing now has a user-facing source-only private route and a
validated server-profile selector. `HELIX_MINECRAFT_SERVER_RUN_DIR` may select
the canonical Fabric run root or one direct child such as
`combat-c0-server`; paths outside that boundary and deeper nested profiles fail
closed. This prevents a C0 repair from being staged into the preserved default
server. The focused source-panel and local-server-handoff suites pass 11/11.

**C0 remains open and C1/Wither remain NO-GO.** The next replay needs funded
Runtime Codex capacity and a refreshed MCP connection if MCP-side observation
is required. Before submitting the same prompt, revalidate one exact account,
room, world, source and Player Embodiment tuple; do not auto-select a room by
recency alone when multiple open rooms belong to the profile.

### C0 funded-provider replay and combat deadline — 2026-08-26

After API credits were replenished, the exact `localhost` profile and room tuple
was revalidated before replay: room
`shared_realtime_room:67ce81da-fbb9-4fa5-9eaf-f7f71fff9f9c`, active Fabric
world `minecraft:connector:e64fda9a-4f6`, DatDamPig selected, observation-only
World Authority, and client-ready Player Embodiment with all 19 declared
capabilities. The keyed harness and C0 server remained live on ports 1522 and
25566 respectively. Docker/WSL remained outside process authority and was not
touched.

The unchanged natural C0 replay materialized as native turn
`ask:7dc4489f-53a0-476a-8b86-07ec8ca16a92`. This proves provider-credit
recovery: Runtime Codex started normally, requested admitted Minecraft tools,
received their observations, and did not emit another quota failure. Its first
perception request used an invalid `horizontal_radius`, then repaired the
arguments and obtained a bounded same-revision snapshot. Camera tracking
subsequently retained the exact zombie for 60/60 measured ticks with 0.69-degree
mean and p95 angular error.

The run progressed beyond the previous camera-only divergence and requested
`com.casimirbot.minecraft.player.combat.attack` as `workstation_gateway_4`.
That mutating workflow did not return before the gateway deadline, so its
outcome is unknown and Helix correctly did not replay it. The observation was
re-entered and the turn terminated as a typed failure because the required
combat observation was absent. This is the current first divergence; it is not
a C0 pass and must not be relabeled by a later world-state read.

A separate read-only post-timeout safety prompt was then rejected at admission
with `memory_hard_pressure`. At that instant the host reported 15.78 GiB total
physical memory with 0.48 GiB free, and 31.68 GiB total virtual memory with 1.15
GiB free. No post-timeout actor, target or control-release observation was
therefore obtained. Do not remove the memory guard or stop Docker for this
packet; retry that read-only safety probe only after unrelated host pressure
falls, then diagnose the combat workflow deadline without replaying the unknown
attack.

**Provider capacity is restored, but C0 remains open and C1/Wither remain
NO-GO.** Progress now depends on a safe post-timeout observation followed by a
fresh checkpointed C0 attempt that returns an exact attack receipt, target
health/death evidence and all-path control release within the bounded deadline.

### C0 restart and sensing-readiness audit — 2026-08-26

The keyed harness was restarted through the opaque launcher while the existing
`combat-c0-server` remained live on port 25566. Docker/WSL was not stopped or
modified. Restore discarded an invalid historical connector row, so the exact
room initially projected the Fabric source as missing. The source-only private
re-pair path restaged the connector without exposing its one-time credential or
granting command or player-action authority. The exact room then reported the
Fabric source active with a fresh observation, DatDamPig selected,
observation-only World Authority, and expired/inactive Player Embodiment.

The required read-only post-timeout probe was submitted without renewing the
action lease. Native turn `ask:107cd6fd-1b0b-4729-81ac-a40d1a1df1b4` was
rejected before model sampling or Minecraft tool execution with
`memory_hard_pressure`; the runtime decision recorded the exact reason as
`host_memory_limit`, zero active tasks and a 768 MiB active-turn burst reserve.
The contemporaneous runtime snapshot showed the active-turn class itself below
its heap and RSS ceilings, but only approximately 1.32 GiB host physical memory
free. After subtracting the calibrated burst reserve, projected free memory was
below the immutable four-percent physical floor. This is a real host-capacity
admission stop, not a provider-credit, connector, OAuth or gameplay failure.

**The C0 environment is sensing-ready but not turn-ready. C1 and Wither remain
NO-GO.** Resume with the same read-only safety probe only after the host has at
least approximately 1.42 GiB free physical memory under the current 768 MiB
burst estimate and four-percent floor. Do not weaken the memory guard, stop
Docker, renew Player Embodiment or replay the unknown attack merely to bypass
this check. Once the safety probe returns exact actor, zombie and control-release
evidence, diagnose the combat workflow deadline and run a fresh checkpointed C0
attempt.

### C0 combat deadline first-divergence repair — 2026-08-26

Patch classification: `tool admission`, `evidence re-entry`, and action-result
lifecycle timing. This repair does not add gameplay strategy, a private retry
loop, broader combat authority, or a terminal shortcut.

The first divergent gateway boundary was reproducible in request construction.
`attack` did not participate in declared-duration budgeting, so a bounded exact
attack inherited the descriptor's full 60-second execution constraint. The same
request also carried `combat_allowed=false` despite admission of the dedicated
exact-hostile attack capability. For duration-bearing actions the gateway had
additionally assigned the five-second result-delivery allowance to the Fabric
execution constraint itself, leaving no separate time for the connector's
durable outbox to publish the terminal event, normalized environment event and
action result before the outer deadline.

The gateway now keeps these clocks distinct. Exact attack, camera tracking,
follow, finite sequence and finite reactive-program execution receive only their
declared execution duration in `constraints.max_duration_ms`; the outer action
deadline retains up to five seconds of bounded delivery allowance within the
catalog ceiling. Only `action_kind=attack` receives `combat_allowed=true` on
this surface. Host access and automatic replay remain false, so an unknown
mutating outcome still fails closed and is never replayed automatically.

Focused verification passed:

- `environment-action.test.ts`: 23/23, including an exact zombie attack proving
  the maximum 60,000 ms Fabric execution ceiling, a 65,000 ms outer deadline,
  combat authority true, host authority false and automatic replay false;
- `action-result-canonicalization.test.ts`: 27/27; and
- `catalog.test.ts`: 8/8, including descriptor-schema validation; and
- `npm run helix:ask:discipline:quick`: PASS.

`npm run typecheck:environment-actions` remains red from pre-existing
repository-wide failures across unrelated active work. Its output did not
identify a new error at the changed duration/authority construction or focused
test. This is not treated as a passing typecheck.

**C0 remains open and C1/Wither remain NO-GO.** Live acceptance requires the
patched keyed harness to be relaunched by its current supervisor owner, followed
by the still-required read-only actor/zombie/control-release safety probe. Only
then may a fresh C0 checkpoint be restored and the unchanged natural zombie
prompt run once for exact attack, target-health/death, evidence-re-entry,
terminal-continuity and all-path control-release proof.

### C0 patched-runtime live handoff blocker — 2026-08-26

Three consecutive goal continuations rechecked the required live topology after
the combat-deadline repair. In every check, the disposable C0 Minecraft server
remained listening on `127.0.0.1:25566`, while no process listened on the keyed
harness port `127.0.0.1:1522` and `/healthz` was unreachable. The final check at
2026-08-26T19:07:10-04:00 measured approximately 3.07 GiB free physical memory,
well above the earlier C0 turn-admission threshold. Host capacity and Minecraft
availability are therefore not the current stopping condition.

The shared keyed-harness supervisor is being repaired by a separately owned
task. This packet did not race that owner by starting another instance, because
two launchers could diverge in service identity, in-memory room/invite state and
execution-lease ownership. No read-only C0 probe, authority renewal, checkpoint
restore or attack was attempted while the governed service boundary was absent.
Docker/WSL remained untouched.

**C0 is blocked at live acceptance, not at implementation. C1, Nether and
Wither remain NO-GO.** Recovery requires the owning task to launch the patched
workspace as the single keyed harness on port 1522 and provide a healthy
supervisor/service-instance handoff. The first resumed operation remains the
read-only actor/zombie/control-release probe; mutation authority must not be
renewed until that probe settles.

### C0 client recovery and safe post-timeout probe — 2026-08-26

The keyed harness recovered on port 1522 from the patched workspace, but the
M1 room correctly reported no online subject. The isolated C0 client log showed
that Minecraft had exited cleanly at 19:24:53 local time; the C0 server itself
remained listening on port 25566. This was a client-lifecycle stop, not a stale
room projection.

The approved loopback launcher initially failed closed before process creation
because strict PowerShell property access assumed every unrelated entry in
`launcher_profiles.json` declared optional `gameDir` and `lastUsed` fields. The
launcher now reads those optional fields through an explicit property lookup,
while preserving exact profile selection, loopback-only validation, memory
ceiling, credential exclusion and receipt semantics. The retried launch emitted
`helix.minecraft.workstation_launch_receipt.v1` with status `connected`, exact
profile `helix-combat-c0-isolated`, Fabric 1.21.8, isolated game directory,
server `127.0.0.1:25566`, `mod_loaded=true` and
`credentials_exposed=false`. The room then re-established DatDamPig as the
selected online subject in bound world `minecraft:connector:7596075d-cc1`.

With Player Embodiment still off, the required read-only safety probe completed
successfully:

- actor-status evidence
  `environment_probe_evidence:442a7e7623de355d8852cb0f61323d71b7a42e24`:
  DatDamPig, survival, overworld, position `(-4.5, 65, 0.5)`, health 20/20,
  food 20, saturation 20 and no status effects;
- same-revision perception evidence
  `environment_probe_evidence:e38a8b3fd50744a9aa168d5ba7bdc0893b5f1762`:
  one exact hostile `minecraft:zombie`, 10 blocks away, zero closing speed,
  clear line of sight, no occlusion, not targeting the actor, no hazards and
  stationary actor state; and
- inventory: one iron sword and four bread. `keep_inventory=true` remains an
  arena rule, not evidence that a failed combat attempt is acceptable.

The earlier unknown attack therefore did not defeat or displace the C0 target,
and the safe starting state is available without a checkpoint mutation.
However, the active room is the other task's two-member M1 room and this task is
the participant; its owner controls the separately paired Player Embodiment
lease. This task did not leave or replace the room because doing so would
invalidate M1's live acceptance topology.

**C0 is sensing-ready and safe, but mutation remains owner-gated. C1, Nether
and Wither remain NO-GO.** The M1 room owner must enable the exact bounded C0
Player Embodiment lease, or complete the M1 handoff so C0 can move to an
owner-controlled room. After that single authority transition, run the unchanged
natural zombie objective once and require exact attack, health/death,
evidence-re-entry, terminal-continuity and control-release proof.

### C0 hostile-AI diagnosis and deterministic restage — 2026-08-26

The apparent non-attacking zombie was not a Peaceful-mode failure. The isolated
server was configured for Normal difficulty and Survival; `spawn-monsters=false`
only suppresses unbounded natural spawning. A temporary local setup authority
query returned `NoAI:1b` for the exact staged zombie. That fixture-level freeze
fully explains the earlier zero closing speed and `targeting_actor=false`
observation.

Setup authority cleared `NoAI` and invulnerability on that same persistent
zombie. The result was immediate and unambiguous: it crossed the arena, filled
the player's first-person view, reduced DatDamPig from 20 health to 6 and then
killed the stationary player. This was an A0 arena-validation event, not a C0
combat pass: Player Embodiment was off, no harness attack occurred and no
terminal claim is authorized from the death alone. It nevertheless proves that
Normal hostile AI and zombie damage are functioning when the fixture is active.

The disposable arena was then recovered deterministically. One temporary
Peaceful restart removed the live attacker, the isolated client rejoined with
DatDamPig at full health and preserved inventory, Normal difficulty was restored
both live and in `server.properties`, and one persistent frozen zombie was
reseeded at `(5.5, 65, 0.5)`, ten blocks from the player baseline. Temporary
operator status was revoked live and `ops.json` is empty. The settled server is
Normal/Survival with `spawn-monsters=false`, one safe frozen baseline target and
no retained setup authority.

The M1 room boundary also tightened during this recovery: the participant now
receives `room_read_grant_not_found` for both actor status and perception, in
addition to having no owner-granted Player Embodiment. The next owner action is
therefore a least-privilege C0 lease bundle for DatDamPig: restore the bounded
combat read share, camera tracking and exact combat attack, with no raw command
authority. Activate the frozen zombie only as the scored turn begins so the
agent can observe and react rather than being attacked during setup.

**C0 remains open; C1, Nether and Wither remain NO-GO.** The game/fixture is
healthy and safely staged. The sole live-test boundary is the M1 owner's exact
read plus Player Embodiment grant; it must not be bypassed by participant-side
self-granting.

### C0 owner-room recovery and command-observation divergence — 2026-08-26

The C0 task recovered an owner-controlled room with DatDamPig selected and an
active least-privilege Player Embodiment lease containing only camera tracking
and exact hostile combat attack. A fresh readiness inspection reported the
Fabric client ready, 19 declared capabilities, a fresh active heartbeat, zero
active workflows and no asserted controls. Camera tracking had already retained
the exact frozen zombie for 24/24 ticks with 1.17-degree mean and p95 angular
error and a clean control release.

The retained keyed Node listener then exited while Minecraft and the disposable
C0 server remained live. Local-supervisor preflight returned `start` with
`reason=no_listener`; the approved opaque launcher restarted the patched
canonical workspace and reached `[express] app ready`. All three required
surfaces returned HTTP 200: account session, Helix pipeline and agent providers.
The persisted room, source, selected subject and exact Player Embodiment lease
were restored, and the patched MCP action registry was therefore live without
restarting Minecraft.

The server-side command connector was paired opaquely through the verified
`combat-c0-server` profile. World Authority was restricted to `world_operator`,
approved-category mode and `entity_control` only. Natural turn
`ask:bbbb2509-7df1-4d7a-b143-495b1e96d4b5` requested one exact mutation to
clear `NoAI` on the nearest staged zombie. The turn reached
`com.casimirbot.minecraft.command`, but no required command observation returned
to the compound turn. Helix terminated with a typed failure and the command
outcome is treated as unknown; the command was not replayed.

The mandatory read-only safety probe then returned:

- actor evidence
  `environment_probe_evidence:5f05af5079ca3187de165f6a1110c20b3f5aab49`:
  DatDamPig remained stationary at `(-4.5, 65, 0.5)`, survival, health 20/20,
  food 20 and saturation 20; and
- perception evidence
  `environment_probe_evidence:df545ee8c6eed88eb956bf7db3691f32b895f6b4`:
  the one hostile zombie remained exactly 10 blocks away with clear line of
  sight, zero closing speed and `targeting_actor=false`. The semantic
  fingerprint changed only with the camera heading; no hostile-AI transition
  was observed.

**The first live divergence is now command-result continuity, not room
ownership, OAuth, memory, sensing, camera tracking or Player Embodiment. C0
remains open; C1, Nether and Wither remain NO-GO.** Before another scored
attempt, repair or prove the exact path `command request -> connector lease ->
Fabric execution -> command result -> observation re-entry`. Do not replay the
unknown mutation or begin an attack against the frozen ten-block target. Once
that path returns an unambiguous activation receipt, run the unchanged C0
camera/attack attempt and require target health/death plus all-path control
release evidence.

### C0 command-risk correction and authenticated exact-target pass — 2026-08-26

The preceding command-continuity diagnosis was superseded by a narrower first
divergence. The connector and result path were healthy; both the server and
Fabric command-risk classifiers categorized every mutating `data` command as
`world_build`, even when the command targeted an entity. The staged request
correctly declared `entity_control`, so the category mismatch failed closed
before the activation mutation could execute.

Both classifiers now inspect the semantic `data` target kind. Mutating
`data merge|modify|remove entity ...` commands classify as `entity_control` /
`world_mutation`, while block and storage targets remain `world_build` /
`world_mutation`. Focused TypeScript and Fabric tests cover direct and nested
`execute ... run data merge entity ...` forms, and the patched Fabric server
artifact was rebuilt and deployed to the disposable C0 server. The focused
TypeScript battery passed 56 tests, the Java 21 Fabric focused tests and full
build passed, and `npm run helix:ask:discipline:quick` passed.

Live keyed turn `ask:023ed874-a2fc-4f34-b2e0-f219678b50c4` then executed the
exact activation command and returned the unambiguous result `Modified entity
data of Zombie`. The first released zombie attacked normally, but the operator
killed it manually; that event is setup/activation evidence only and is not a
scored combat attempt.

A fresh adult zombie was therefore summoned frozen at `(5.5, 65, 0.5)`, with
DatDamPig restored to the canonical `(-4.5, 65, 0.5)` baseline at health 20/20,
food 20 and saturation 20. Authenticated camera action evidence
`environment_action_evidence:7854a37104e111ba9b30127032229c39ac78b3bfb`
retained that exact zombie for 60/60 measured ticks, with 0.36-degree mean
angular error, no target loss and clean control release. It produced exact
incarnation lock `target:ab13e4ad4e9ddc64f815728d3e868d3ba37c1d10`.

After an explicit setup release, authenticated MCP A1 attack evidence
`environment_action_evidence:2f3788285a5f666f65ba39b3dc090045042fad41b`
settled successfully in 122 ticks. The native Fabric controller waited for the
zombie to enter vanilla reach, issued four cooldown-admitted sword pulses,
observed four independent hurt/health transitions, rejected zero pulses and
observed the exact admitted target at zero health with death time one tick.
Friendly fire remained false, no manual override occurred and all controls
released. Independent post-fight actor evidence
`environment_probe_evidence:c45831ac07de2d05cb9e0667cd4d13bbc55fdd18`
showed DatDamPig alive at health 20/20, and perception evidence
`environment_probe_evidence:6c235059d736efb3ddbe49e9f7104874dd90c140`
showed no remaining entity or hazard.

This is the first scored authenticated MCP A1 C0 defeat and closes the prior
activation and exact-effect blockers. It does not by itself prove the unchanged
natural keyed Helix B turn, so B parity remains open and must not be inferred
from the direct MCP result. Deterministic P3 work may advance to C1; live P5
promotion still requires the keyed B parity receipt.

### C0 three-zombie exploratory stress result — 2026-08-26

An operator-requested, non-promotional stress trial then placed three frozen
adult zombies at 10.00, 10.44 and 10.44 blocks from the same unarmored player
baseline. Perception evidence
`environment_probe_evidence:d635af0020972cec62e9904cc805811bbda23520`
correctly reported all three hostile bearings with complete local coverage.
Camera evidence
`environment_action_evidence:613fb18793a00c5b7b1ae74b1c6455e0dc9ce04f7`
locked one exact incarnation for 20/20 ticks.

The first group-release command failed closed because vanilla `data merge
entity` requires a selector resolving to one entity. The corrected fan-out
`execute as @e[type=minecraft:zombie] run data merge entity @s {NoAI:0b}`
then activated all three. However, the repeated exact-target attack was
deduplicated to the prior no-effect timeout evidence
`environment_action_evidence:5db6c4ffc079161a971a0480c7ccf5e42f66d07dc`
instead of becoming a second physical effect. With no resident reacquisition
workflow active, the three zombies killed the stationary player. They were
then frozen; evidence
`environment_probe_evidence:146f438a92643194190bc3f5506f9beef40f78f9`
showed the dead player and three stationary hostiles at 0.72, 0.96 and 1.15
blocks.

This exploratory failure does not invalidate the single-zombie C0 pass. It
does prove that exact single-target attack plus caller retries is not a
multi-hostile combat controller. Before C5 mixed-pressure promotion, the
resident combat guardian needs an explicit bounded target-reacquisition loop
and an admitted new-attempt identity that preserves no-duplicate-effect safety
without replaying a prior terminal timeout. The player must be respawned and
the disposable arena reset before further live trials.

### C1 sensing compatibility and fresh three-zombie reacquisition trial — 2026-08-26

The first live C1 sensor deployment exposed an adapter-schema divergence rather
than a trajectory-math failure. The Fabric sensor emitted the new bounded
`projectiles` forecast array and `coverage.projectiles_complete`, but the
strict perception capability output schema did not yet admit either field.
The probe therefore failed closed at
`$.coverage.projectiles_complete`. The harness catalog now admits optional,
backward-compatible projectile forecasts, the legacy normalization boundary
preserves them, and absent nullable forecast values are omitted rather than
serialized outside the constrained schema vocabulary. Focused TypeScript
verification passed 21 tests and the Java 21 Fabric sensor build passed.

After redeployment and keyed-harness restart, authenticated perception evidence
`environment_probe_evidence:7ddb12e1a3e43b34399907182f8f329500ff45c6`
returned `projectiles: []` with `projectiles_complete=true`; this supersedes the
schema-validation failure for the empty-projectile case. Full moving-projectile
C1 live calibration remains open.

The dead disposable player state was recovered without altering the world. The
exact `.dat` and `.dat_old` records were moved to recoverable backups inside the
arena player-data directory, producing a new survival player at health 20/20.
The isolated-client pairing handoff then exposed a profile-routing defect: the
opaque one-time inbox was staged in the default Minecraft profile even though
the running test client used `.minecraft-helix-c0`. Moving that unread file to
the isolated profile allowed the companion to claim it; the new bounded
authority became ready with 19 declared capabilities, fresh heartbeat and no
asserted controls. Release work should bind local pairing handoff to the exact
selected profile instead of relying on the default profile path.

A fresh three-zombie trial staged all hostiles frozen and separated at 7.60,
7.74 and 8.06 blocks. Perception evidence
`environment_probe_evidence:c7ab19ecaadf3144e7e61ed56435182875fbbdae`
reported all three with clear line of sight and complete coverage. Camera
evidence
`environment_action_evidence:e0a0bc963600da9756b9286222e47d3730ef28c63`
retained the nearest exact incarnation for 60/60 ticks and returned target lock
`target:ccc0255a9a05a3129022a9c30ca32703d12191ae` with clean control release.
After a correct three-entity fan-out release, attack evidence
`environment_action_evidence:2636fbdf5845482f15243f902c983af214454d9c6`
defeated that exact zombie in four accepted pulses and four observed health
transitions, with zero rejected pulses and no manual override.

The unattended pair simultaneously reduced DatDamPig from health 20 to 8.67
and displaced the player by knockback before the first target's terminal result
could re-enter Codex. Fresh perception evidence
`environment_probe_evidence:1f870af12c0c89c3ff0bd0b76f6ccc7ee0653488`
showed both survivors inside one block and targeting the actor. The next bounded
camera reacquisition was canceled at tick zero by `screen_open`, with controls
released, because the player had already died. Final evidence
`environment_probe_evidence:3602bfc2519240593d6e67ed81f3c3c2e2425aa2`
showed health zero and both surviving hostiles; they were frozen immediately
afterward.

This fresh trial removes the earlier duplicate-request ambiguity: the
single-target primitive performed one real kill, but the observation/reasoning/
reacquisition round trip was slower than the damage window from the other two
hostiles. Caller-paced sequential action is therefore insufficient for C5.
The next multi-hostile implementation must be a bounded resident combat
guardian that can retain a threat set, switch targets on verified death or
reachability loss, interleave retreat with cooldown-admitted attacks, enforce a
health floor and emit per-switch evidence. Jump-critical timing remains a later
optimization and must not substitute for the missing survival/reacquisition
control loop. The single-zombie C0 A1 pass remains valid; keyed B parity and
moving-projectile C1 acceptance remain open, so Nether/Wither readiness remains
NO-GO.

### C1 resident hostile-combat controller implementation — 2026-08-26

The multi-hostile failure is now represented by a new explicit Player
Embodiment capability rather than a caller-paced chain of camera and attack
requests. `com.casimirbot.minecraft.player.combat.guard` / `combat_guard`
admits one short native-Fabric lease with an allowlist of hostile entity type
identities, acquisition radius, cooldown floor, attack-pulse and target-switch
budgets, target-commit interval, retreat hysteresis, hostile-count threshold,
duration ceiling and player-health floor. `friendly_fire=false` and
`require_line_of_sight=true` are literals. The connector runtime advertises
the capability as native-only continuous control.

The compiled profile `resident.minecraft.hostile-combat.v1` now performs the
bounded tick-speed repertoire. It enumerates only loaded vanilla `Monster`
instances whose exact type is in the admitted allowlist, creates stable opaque
incarnation references, prioritizes mobs currently targeting the player,
retains a viable target through a commitment/hysteresis window, aims at the
selected hostile, backpedals inside the retreat envelope and uses only the
normal vanilla attack path when reach, line of sight and cooldown all pass.
It releases camera, locomotion and attack controls on success, health-floor
interruption, target-switch exhaustion, attack-budget exhaustion, vanilla
rejection, cancellation, disconnect or Emergency Stop. It cannot select a
player, passive entity or neutral non-`Monster`, invent a target type, synthesize
damage, mutate inventory or mutate the world.

Receipts include the resident profile and artifact versions, eligible and peak
hostile counts, selected opaque target reference, switch count, attack pulses,
retreat ticks, current health, reason code and explicit friendly-fire/world/
inventory mutation denials. Natural affirmative multi-hostile combat intent is
narrowed to this capability for terminal evidence, while a single exact-target
fight continues to require the existing exact combat-attack capability.
Contextual, quoted, historical, hypothetical and negated combat language still
passes through the established operative-action gate and does not authorize an
effect.

Deterministic verification currently passes for threat-first target selection,
commitment anti-oscillation, cooldown-gated attacks, retreat activation,
health-floor release and target-switch budget refusal. The Fabric Java 21
module compiled successfully, all five existing Fabric game tests passed, the
focused resident-controller tests passed 4/4, and the focused TypeScript MCP
plus action-profile parity tests passed 6/6. This is implementation evidence,
not live combat acceptance. The next admissible step is to rebuild and deploy
the exact Fabric artifact, re-pair the isolated client, stage a clean three-
zombie arena baseline and run A0 then authenticated MCP A1 with per-tick and
postcondition receipts. Nether/Wither readiness remains NO-GO until that live
resident round, keyed B parity and the open moving-projectile C1 acceptance
have passed.

### C1 resident hostile-combat A0 live repeatability result — 2026-08-26

The rebuilt isolated-client artifact was deployed with SHA-256
`9E1DF076A8E2FBDFE51E06A85738A28F80EB71A2C23E8EDBE50B2B1D8BF3816D`.
Focused Java verification for the strict diagnostic-inbox parser and resident
guardian passed before deployment. The deployed parser accepted the exact
bounded `combat_guard` request; no broader action kind or target vocabulary was
enabled.

The first staging attempt is retained as a non-pass. It completed immediately
with `peak_hostile_count=0` and `attack_pulses=0` because the three zombies had
been placed at an incorrect absolute height and were absent from the admitted
client envelope at acquisition. This false-positive-looking visual outcome was
rejected by the structured receipt. The arena procedure was corrected to spawn
each frozen, invulnerable setup entity relative to DatDamPig, prove that all
three tagged entities existed, admit and start the guard, verify a running
receipt with `eligible_hostile_count=3`, and only then release AI and
invulnerability for all three through an exact server-side fan-out.

Corrected A0 run 1, workflow
`direct_player_action_workflow:0eb052f2-28b7-46a3-a733-1cfb7048228f`,
settled `workflow.succeeded` with `reason_code=hostiles_cleared`. It observed a
peak of three admitted hostiles, issued 11 cooldown-admitted attack pulses,
performed 18 retreat ticks and six target switches, ended with zero eligible
hostiles, retained player health 20/20, reported `friendly_fire=false`, and
released all controls. Independent server inspection found no remaining zombie.

At the operator's request, a second independent attempt used three fresh tagged
zombies and a new diagnostic request identity. Run 2, workflow
`direct_player_action_workflow:c4738981-027b-4593-97fb-04769e59734d`, also
settled `workflow.succeeded` with `reason_code=hostiles_cleared`. It observed a
peak of three hostiles, issued 12 attack pulses, performed 20 retreat ticks and
seven target switches, ended with zero eligible hostiles, retained player
health 20/20, reported `friendly_fire=false`, and released all controls.

In-game proof images are retained at:

- `docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-26-c1-a0/three-zombie-run-1-cleared-arena.png`;
- `docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-26-c1-a0/three-zombie-run-1-terminal-receipt.png`; and
- `docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-26-c1-a0/three-zombie-run-2-terminal-receipt.png`.

This closes the local diagnostic A0 repeatability slice for the resident
three-zombie controller. It does not promote authenticated MCP A1, the natural
keyed Helix B path, moving-projectile C1 acceptance, PvP, Nether readiness or
Wither readiness. The live Node harness on port 1522 still advertises the
pre-patch capability catalog, so the next admissible step is a safe owning-
process restart of the exact patched keyed harness followed by private
re-pairing and the same three-zombie trial through authenticated MCP A1.

### C1 A0 opponent-boundary probes — 2026-08-26

Three exploratory single-opponent probes followed the repeatable zombie result.
The first skeleton was observed by the operator to be unarmed. Although workflow
`direct_player_action_workflow:2ba96d06-7d55-4268-92fe-f35f465828b5`
cleared it with four attack pulses, 43 retreat ticks and player health 20/20,
that result is classified only as another melee-opponent pass. It is not
projectile or ranged-combat evidence.

The corrected skeleton fixture explicitly replaced its main-hand item with a
bow and received the server result `Replaced a slot on Skeleton with [Bow]`
before admission. From nine blocks away, workflow
`direct_player_action_workflow:407a9d72-3897-4834-afea-46bce9e8741d`
tracked the one admitted hostile but issued zero attack pulses and zero retreat
ticks. It failed closed at the admitted health floor with
`reason_code=player_health_floor_reached`, measured health 12 and
`controls_released=true`. This proves target sensing without ranged engagement:
the current controller has no approach/closing policy, projectile-evasion
policy, cover selection, shield use or ranged weapon repertoire.

The bow skeleton then fired again after the controller had correctly released
controls and killed the stationary player. The server-side fixture was manually
contained and DatDamPig was respawned with inventory preserved. This exposes a
harness-level safety gap distinct from controller release semantics: a scored
arena needs a server-owned watchdog that freezes or removes every admitted test
hostile when a workflow reaches a health floor, timeout, cancellation,
disconnect or Emergency Stop. Releasing player controls while leaving the
hazard active is not a sufficient arena fail-safe.

After arena reset, a frozen spider was admitted and released as a fast lateral
melee probe. Workflow
`direct_player_action_workflow:55e4069c-7642-4648-8184-3d34af758781`
settled `workflow.succeeded` with `reason_code=hostiles_cleared`, three attack
pulses, 12 retreat ticks, peak hostile count one, player health 20/20 and clean
control release. The observed strength boundary is therefore close-range
hostiles that enter vanilla sword reach, including faster lateral motion; the
observed weakness boundary is distance-maintaining ranged pressure.

Additional in-game proof images are retained at:

- `docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-26-c1-a0/unarmed-skeleton-nonprojectile-result.png`;
- `docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-26-c1-a0/bow-skeleton-post-release-death.png`; and
- `docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-26-c1-a0/spider-cleared-arena.png`.

These probes do not change the promotion boundary. A0 melee repeatability is
supported; authenticated MCP A1, keyed B parity, the server-owned arena
watchdog, and moving-projectile C1 sensing/response remain open. Nether/Wither
readiness remains NO-GO.

### C1 ranged-response and arena-watchdog implementation — 2026-08-27

The bow-skeleton failure now has two separately owned deterministic responses.
The Fabric server's World Authority fixture surface adds a bounded
`combat_watchdog` lease keyed by exact player and validated literal mob tag.
It captures one dimension and arena volume, then freezes only admitted tagged
monsters on health-floor crossing, player death, disconnect, lease expiry,
explicit disarm or server stop. Its settled status records the terminal reason,
contained entity count and measured player health. This closes the earlier
failure mode in which Player Embodiment correctly released its controls while
the diagnostic hostile remained able to kill the stationary player.

The resident Player Embodiment guardian initially advanced to artifact version `1.2.2`
with separately admitted and metered repertoires:

- `direct_bounded` closing uses only vanilla forward input after immediate
  collision and support checks, while separately admitted
  `local_reroute_bounded` may use one checked lateral direction and its
  alternate when the direct step is unavailable; closing, retreat and reroute
  vectors are derived from the selected hostile position rather than lagging
  camera orientation;
- `lateral_bounded` cover prefers a short collision-safe lateral corridor only
  when bounded block-ray lookahead finds actual occlusion from the projectile
  source;
- projectile forecasts identify imminent collision ticks and admit a bounded
  sidestep when cover is unavailable;
- `shield_or_sidestep` may hold only an actual off-hand shield and falls back to
  the admitted evasion budget when the shield is absent; and
- approach, cover, evasion and shield holding have independent tick ceilings,
  fail-closed cross-field validation and terminal receipt counters.

Strategy remains outside the harness planner. Helix admits the finite profile;
the Fabric companion applies only tick-local reactions, hostile-only targeting,
vanilla reach/cooldown attacks and all-path control release. No copied Baritone
code, hidden model loop, PvP target, arbitrary command, jump-critical timing or
unbounded movement was added.

Focused Java 21 verification passes for the guardian, diagnostic inbox and
projectile forecaster, including approach exhaustion, cover preference,
sidestep, shield use and malformed-budget rejection. The Fabric watchdog and
command-classifier focused tests also pass. Shared TypeScript action and
capability-catalog verification passes 23/23 tests. These are deterministic
implementation results only: deployable artifact hashes, live watchdog
containment, the repeated bow-skeleton A0 journey, authenticated MCP A1 parity
and keyed B parity remain open. Nether and Wither readiness therefore remain
NO-GO.

### C1 ranged-response A0 and authenticated MCP A1 acceptance — 2026-08-27

Live testing exposed and closed three integration defects after the initial
`1.2.2` implementation. World-direction closing had been translated into
fixed keyboard directions instead of camera-relative inputs; the direct
diagnostic staging helper omitted the `combat_guard` duration conversion; and
the MCP canonical result verifier did not yet admit `combat_guard` terminal
measurements or classify its movement and attack effects. Artifact `1.2.4`
contains the corrected camera-relative movement translation and effect
accounting. The MCP boundary now also returns credential-free typed connector
pairing errors instead of collapsing known pairing failures into
`internal_error`.

The server-owned watchdog was exercised live. At the configured health floor
it froze the exact tagged arena skeletons and settled with
`player_health_floor_reached`; explicit disarm also settled cleanly with zero
remaining admitted hostiles. Invalid early trials in which the watchdog was
armed on the same tick as healing, or a hostile was released before the player
action was staged, are retained as fixture-order failures and are not counted
as controller evidence. The accepted fixture order is: heal and verify,
spawn frozen, arm watchdog, admit the player action, then release the hostile.

Direct A0 bow-skeleton workflow
`direct_player_action_workflow:6e0f86c1-bf14-444f-a9e1-451ccaad9f49`
closed from 10.89 blocks, used 47 approach ticks and four attacks, cleared the
hostile at health 20 and released every control. The 14-block repeat,
`direct_player_action_workflow:736bad2a-84de-445f-90b0-be858a986693`,
used 42 approach ticks and four attacks with the same terminal safety result.
Because the controller killed both live skeletons before an arrow entered the
forecast horizon, a separate deterministic projectile fixture injected one
arrow on a collision path while a bow skeleton was present. Workflow
`direct_player_action_workflow:d661caa5-bbfa-4e56-9402-f85078220ea6`
observed one projectile threat, held the real off-hand shield for 132 ticks,
earned the vanilla `Not Today, Thank You` advancement, then closed and cleared
the hostile with health 20 and controls released. This is deterministic
projectile/shield evidence; it is not represented as a skeleton-fired-arrow
observation.

The first authenticated MCP execution physically succeeded but correctly
remained a non-pass because the pre-patch verifier returned
`postcondition_failed`. Its measurements proved 53 approach ticks, four
attacks, health 20 and hostile clearance, exposing that the verifier lacked a
`combat_guard` measurement branch and that the client falsely labeled the
effect as side-effect-free. Focused regression coverage now validates the
bounded combat measurements, typed pairing errors and effect classification.

The decisive authenticated MCP A1 run enabled an ordinary bow skeleton at 14
blocks before submitting the action. Request
`environment_action_request:542a7813-8593-4542-9a51-c4706647c8ec`, workflow
`environment_action_workflow:d5d90b42-bd26-4d2d-88d8-764e75465796` and
evidence `environment_action_evidence:271da8402e795e1e60d1ecef07993f20f43cb7842`
settled `outcome=succeeded`. Artifact `1.2.4` used 38 approach ticks and four
attacks over 67 total ticks, cleared the hostile, retained health 20, performed
no inventory or world mutation, reported both player motion and player
interaction, and released all controls. The skeleton did not release a tracked
projectile before defeat, so projectile-response promotion continues to rely
on the separate A0 collision-path fixture above.

Durable evidence is retained at:

- `docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-27-c1-a0/bow-skeleton-a0-success-terminal.png`;
- `docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-27-c1-a0/projectile-shield-a0-success-terminal.png`;
- `docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-27-c1-a0/projectile-shield-a0-public-capture.json`;
- `docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-27-c1-a1/bow-skeleton-a1-success-terminal.png`; and
- `docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-27-c1-a1/bow-skeleton-a1-success-receipt.json`.

Focused TypeScript verification passes 32/32 tests. The Java 21 Fabric build,
focused guardian/runtime tests and all five Fabric GameTests pass, and the
remapped client jar SHA-256 is
`BCB8E93F52CCDD749C23898FDFB306F4F3D0B3933E7D885933DA7685506E73BE`.
The C1 A0/A1 ranged-response slice is therefore accepted. Natural keyed Helix
B parity, PvP, Nether readiness and Wither readiness remain open; this result
does not promote any of them. The opaque launcher also still needs to load the
per-profile Minecraft game directory automatically: this run had to move the
unread pairing inbox from `.minecraft` to `.minecraft-helix-c0` before the
client could redeem it.

### Combat-recovery contingency arena plan — 2026-08-27

The retained C1 arena is the next controlled fixture for separating strategic
delegation from tick-sensitive recovery. This is a supporting G8/N0 continuity
increment, not a portal-specific planner, C2 promotion, or permission to begin
the Nether journey. The first recovery item is mushroom stew because it forces
the system to distinguish ingredient perception, craftability, safe action
timing, hand/inventory mutation and post-use verification. Mushroom stew is a
food recovery resource; the controller must not claim that using it directly
restores health. Any later health increase must be separately observed and
attributed to the applicable vanilla regeneration conditions.

The authority split is frozen for this ladder:

- Runtime Codex chooses whether recovery is worth attempting, admits the item,
  ingredients, health/food thresholds, maximum disengage/craft/use duration,
  allowed hostile set and resume/escape/abstain branches;
- the resident priority arbiter may select only an already-admitted defensive,
  disengage, stabilize, craft, consume, reassess or combat mode from fresh
  frames;
- the safety watchdog enforces the hard health floor, arena containment,
  authority/lease validity, manual override, Emergency Stop, deadlines,
  resource locks and control release; and
- the semantic monitor reports the first recovery threshold, safe-envelope
  result, inventory/craftability change, consumption receipt, post-use actor
  state and resume/abstain outcome without projecting raw ticks.

The resident priority order is:

```text
Emergency Stop / authority loss / genuine manual override
  > imminent lethal or projectile impact
  > hard-floor stabilization and arena containment
  > admitted recovery contingency
  > admitted combat
  > current strategic objective
```

The recovery ladder is deliberately incremental:

| Tier | Arena perturbation | Required result |
| --- | --- | --- |
| REC0 — perception and recipe | No active hostile. Inventory contains exactly the declared bowl, red mushroom and brown mushroom inputs, with controlled food/health. | One same-revision snapshot distinguishes current stew count, ingredient counts, food, health, craftability and unknowns. No mutation occurs. |
| REC1 — pre-crafted use | One stew is already present; the player is hungry and above the hard health floor. | A general typed consume action equips/uses exactly one admitted item, measures the stew decrement and bowl result, food before/after, health before/after, use ticks and full control release. |
| REC2 — craft then use while contained | Ingredients are present but no stew exists. One tagged zombie supplies bounded pressure and the arena watchdog owns containment. | The plan disengages or obtains a verified stable envelope, crafts exactly one stew through the existing craft workflow, consumes it through REC1, reassesses a newer frame and either resumes combat or abstains with the exact reason. |
| REC2A — latent recovery under unexpected crowd pressure | The declared objective is to finish the fight, not to eat. One pre-crafted food item is available and a bounded recovery contingency is admitted but inactive. Begin against one tagged zombie, then introduce two additional tagged zombies or one controlled damage transition after combat has started. | A fresh health/crowd frame crosses the admitted risk threshold; the resident arbiter pre-empts combat, disengages to a verified safe envelope, consumes once, observes the post-use state, and resumes only if the newer frame satisfies the admitted resume rule. Runtime Codex receives the semantic transition and may revise the longer strategy, but is not required for the tick-critical dodge/use sequence. |
| REC2B — bad-break abstention | Repeat REC2A with no reachable separation envelope, an imminent projectile, full hunger, a missing item, or health already at/below the hard floor in separate trials. | The controller does not force a meal merely because recovery was authorized. Defense, cover, Emergency Stop or exact abstention wins according to priority; no use input, duplicate consumption or unsupported healing claim occurs. |
| REC2C — pressure-committed consumption and horde breakpoint | A fixed arena, loadout, health/food state and admitted direct-survival consumable are repeated against increasing tagged-zombie counts. One branch has no reachable separation envelope but still has a positive bounded survival margin through item-use completion. | The resident arbiter may deliberately complete one admitted use while receiving contact damage only when predicted health at completion remains above the hard floor and the item's measured benefit beats immediate attack, shield or escape. It then re-equips, resumes the still-admitted fight and reports damage received during use. Matched trials identify the first repeated controller-loss count and compare it with a separately recorded skilled-player baseline; no single win or loss establishes the breakpoint. |
| REC3 — projectile priority | A bow skeleton or deterministic collision-path arrow is introduced during the recovery window. | Shield/evade/cover pre-empts crafting or consumption before impact; recovery resumes only from a later safe frame. No simultaneous hand-resource conflict occurs. |
| REC4 — missing resource/no cover | Remove one ingredient, fill the food bar, block retreat, or invalidate cover in separate trials. | The controller never fabricates craftability or repeats an unchanged mutation; it stabilizes, selects an admitted alternative, or escalates an exact bounded blocker. |
| REC5 — semantic handoff | Repeat the accepted direct fixture through authenticated MCP and then keyed Helix. | At least three consecutive sense-decide-act-observe cycles correlate the operator trace, monitor cursor, action receipts and durable-goal revision with zero duplicate effects and no hidden user gameplay. |

Each recovery mode is a finite priority lease with activation revision,
minimum/maximum duration, preemption rule, cooldown/hysteresis, resource locks,
completion/failure postconditions and forced release. The measured latency
chain is:

```text
sensor age
  -> threshold detection
  -> resident arbitration
  -> local dispatch/actuation
  -> postcondition observation
  -> semantic delivery/re-entry
  -> Runtime Codex disposition
  -> next admitted action
```

Local impact avoidance and hard-floor response must remain within the existing
one-client-tick deadline. REC1/REC2 record total and longest nonproductive dead
time, decision-to-dispatch and dispatch-to-receipt latency separately. A model
delay is acceptable only while an admitted controller is advancing bounded
work or the player is explicitly stabilized with current evidence.

REC2A is the primary decision-quality scenario. Its opening action plan contains
combat only; it must not contain a scheduled consume step or a scripted damage
timestamp. The test fixture owns a bounded, recorded perturbation window and
chooses one admissible perturbation after combat begins. The controller sees
only ordinary fresh observations. The recovery capability and thresholds are
pre-authorized as a dormant contingency, so an unexpected transition can be
handled within the resident reaction budget without granting new authority or
waiting for a model round trip.

The score separates three decisions rather than treating survival as one pass:

1. **trigger quality:** recovery begins only after the same-revision risk state
   crosses the admitted threshold, with no premature meal during a winning
   combat state;
2. **execution quality:** disengage/cover, hand arbitration and consumption
   occur without taking an avoidable hit, fighting and eating simultaneously,
   or crossing the hard health floor; and
3. **resume quality:** combat resumes only from a later verified state, while a
   still-unsafe state produces defense, continued disengagement or bounded
   abstention instead of oscillation.

Record threshold-to-preemption ticks, preemption-to-safe-envelope ticks,
safe-envelope-to-use ticks, hits received after the trigger, minimum health,
food/item/remainder deltas, controller mode changes, semantic-delivery delay,
Runtime Codex disposition delay and whether the original fight eventually
settles. Run matched controls with the same starting state: a no-perturbation
fight that should never eat, a perturbation that should trigger recovery, and a
bad-break fixture that must refuse recovery. Randomized perturbations are an
evaluation layer only after these deterministic fixtures pass; fixture timing
and expected branch must remain hidden from the controller but recorded for
replay.

REC2C adds a second recovery policy; it does not weaken REC2B. `safe_break`
continues to require verified separation or cover. `pressure_commit` permits a
bounded main-hand use without separation only when a fresh risk frame proves
all of the following:

- the exact item, use duration and expected vanilla effect are admitted;
- the item can finish before `health - predicted_damage_through_completion`
  reaches the hard floor, including a configurable uncertainty margin;
- current hunger/effect state allows the expected benefit;
- the benefit is relevant on the encounter timescale (mushroom stew restores
  hunger but is not immediate healing; a golden apple is the first
  direct-survival calibration item);
- no higher-priority projectile, lethal, authority, containment or manual-input
  transition is active; and
- one main-hand owner holds the use resource until completion or a typed
  cancellation. The controller never attacks and consumes in the same tick.

The horde ladder uses counts `3, 5, 7, ...` until the first candidate failure,
then brackets the boundary one zombie at a time. Each count receives at least
five controller trials from the same reset snapshot. A provisional controller
breakpoint is the first count with at least three losses in five trials. The
same fixture and visible rules are offered to a skilled human for at least five
trials; an actionable controller gap exists when the human succeeds at least
four times where the controller loses at least three. Record survival, kills,
terminal reason, minimum health, time-to-first-use, completed/canceled uses,
damage and hits during use, skipped and completed attack opportunities, target
switches, contact time, movement modes, item/effect deltas and full control
release. This is an arena-relative comparator, not a universal player-skill
rating.

Target admission is also separated from entity classification. A zombie may be
`hostile_by_type` without being an `actionable_threat`. Runtime Codex must admit
an encounter posture (`engage`, `avoid`, `ignore`, or `deflect_only`) plus a
bounded predicate over exact entity incarnation, targeting state, reachability,
containment, path intersection and protected-region context. The resident
controller may react only to entities satisfying that predicate. Thus a named
or intentionally retained hostile behind a verified closed barrier can remain
observed and ignored, while a zombie targeting the player inside the arena can
be engaged. Type-only automatic attack remains a diagnostic compatibility mode,
not the target production contract.

The later ghast case composes concurrent lanes rather than redefining all
hostiles as objectives: navigation retains the strategic route, a projectile
lane may intercept or deflect collision-path fireballs toward an admitted aim
region, and the safety arbiter pre-empts either lane on a hard transition. That
case begins only after REC2C and REC3 establish hand arbitration, trajectory
freshness and stable objective resumption.

The immediate implementation slice is REC0/REC1: expose and verify a general
`consume` Player Embodiment action, retain existing `craft` semantics, and add
deterministic inventory/food/use/release evidence. REC2 may compose those
capabilities only after REC1 passes direct A0. The combined controller must not
embed a mushroom-stew-specific strategy or bypass the existing execution
arbiter.

### REC0/REC1 implementation and first live setup divergence — 2026-08-27

The general `consume` Player Embodiment capability is implemented and
deterministically verified, but REC1 is not live accepted. Its bounded action
contract admits one exact main-hand item, count, maximum duration, hard health
floor, minimum food gain and optional exact remainder item. The native Fabric
workflow records food, saturation and health before/after, use ticks, consumed
count, remainder delta, zero world mutations and all-path control release. The
canonical verifier requires the food gain to agree with the measured food
levels and does not infer direct healing from consumption.

Focused verification passed 59/59 TypeScript tests, the focused Java 21 suite,
and all five Fabric GameTests. The remapped client artifact is
`HelixFabricPlayerAgent-0.4.0.jar`, 442,944 bytes, SHA-256
`6842FDD5C533CB776D88BD5F86EC7121135AA056C2615B0CE38A90B145097211`.
The Helix Ask static discipline check and environment-harness documentation
audit also passed. These results establish deterministic verification only.

The rebuilt artifact was installed in `.minecraft-helix-c0` and the isolated
client rejoined `127.0.0.1:25566`. The first live attempt stopped before the
consume action for two independent setup reasons:

1. the running keyed harness did not carry
   `HELIX_MINECRAFT_PLAYER_GAME_DIR=.minecraft-helix-c0` or
   `HELIX_MINECRAFT_SERVER_RUN_DIR=.../combat-c0-server`, so both unread opaque
   pairing inboxes landed in their default profiles and had to be transferred
   without inspection; and
2. the running keyed catalog predates the new consume capability. The client
   redeemed its Player Embodiment pairing, while the server pairing reported
   `The environment connector service is temporarily unavailable`; therefore
   no command-authorized mushroom-stew fixture could be admitted and the
   operator account could not substitute an in-game `/give` command.

No REC1 consume request was issued and no consume outcome is claimed. An
attempt to lower hunger using a bounded sprint-jump setup action also produced
a separate controller/watchdog finding. Workflow
`direct_player_action_workflow:b0d2bedf-ae10-421a-8caf-41b63b72437e` began at
health 20, food 20 and saturation 20, then the general locomotion watchdog
canceled the ordinary jump descent after 11 ticks as
`locomotion_active_fall`, with `predicted_drop_blocks=0` and controls released.
The dedicated jump primitive provided the discriminating control:
`direct_player_action_workflow:26890549-8481-4888-8633-6ebad5dbc6a8`
completed 10/10 observed jumps and released controls. This proves that the
false positive is specific to the walk-with-jump/watchdog arbitration path,
not all airborne motion.

That watchdog divergence is now repaired and live-regressed without replacing
the general safety envelope. A walk/input segment may identify an airborne
frame as its own controlled jump arc only after it requested jump from a
grounded frame. This suppresses `locomotion_active_fall` for that owned arc,
while unknown forward geometry, lava exposure and excessive predicted drop
remain independent hard refusals. The focused Java suite and all five
GameTests passed with positive and negative ownership cases. The rebuilt
artifact was installed in the isolated profile with the prior artifact retained
as a backup. On `127.0.0.1:25566`, workflow
`direct_player_action_workflow:b03d8415-e8dd-437a-8234-43124a591338`
completed the same 10-second sprint-jump action for 200 ticks, measured 3.138
blocks of motion, released controls and emitted `workflow.succeeded` rather
than `locomotion_active_fall`. This is live acceptance of the narrow
walk-with-jump repair, not of REC1 consumption.

The next unchanged acceptance sequence is:

1. coordinate the keyed-harness relaunch so concurrent chats are not
   interrupted, and launch it with both exact isolated profile paths;
2. verify the new consume descriptor is present, then opaquely re-pair both
   planes without manual inbox transfer;
3. create and read a command-authorized REC0 fixture containing one stew (or
   its exact ingredients), controlled hunger and health above the hard floor;
4. run one direct REC1 consume, requiring stew decrement, bowl increment,
   food gain, separately measured health and control release; and
5. only after that direct pass, repeat through authenticated MCP A1 before
   REC2 hostile pressure.

REC0/REC1 remain at `deterministically verified`; neither is `live accepted`.
REC2, Nether readiness and Wither readiness remain NO-GO.

### REC0 owner-MCP World Authority parity prerequisite — 2026-08-27

The first keyed REC0 continuation exposed an authority-management parity gap,
not a Minecraft controller failure. The authenticated MCP identity still owned
the C0 room and its Player Embodiment connector was ready with a fresh
heartbeat and 21 admitted capabilities, but the Fabric server observation
plane was stale. The opaque same-host server pairing command reached the
verified `combat-c0-server` inbox and was claimed without credential exposure.
Redemption then failed because the room had no active World Authority. The
pairing row had already advanced to `redeemed`, so the one-time code could not
be retried after correcting authority. Both registered owner-UI OAuth callback
origins also returned Auth0 callback mismatch, leaving no uninterrupted owner
path from the authenticated agent.

The harness now implements an owner-only MCP mirror of the existing finite
World Authority configuration contract. It accepts only the shared command
authority settings schema and delegates to the canonical authority store, so
room ownership, environment identity, authority-profile ceilings, autonomy,
approved command categories and expiry remain server validated. It returns
only nonterminal authority and owner-grant receipts; it cannot execute a
command, issue a connector credential, expose pairing material or grant host
access. Admission requires both room-source management and environment-action
write scopes.

Command-only pairing creation also now fails closed before generating or
staging a one-time code unless the exact room-source binding has a current
active World Authority and admitted environment binding. This prevents the
observed `pending -> redeemed -> credential issuance failure` path for a
missing-authority precondition. Focused MCP and command-authority route tests
passed 6/6, including owner rejection, credential-free projections, zero
pairing-row creation on preflight failure, successful configured pairing and
idempotent redemption. The Helix Ask discipline guard passed. This prerequisite
is `deterministically verified`, not `live accepted`; the currently running
keyed service predates the patch and must be relaunched through the opaque
launcher at a coordinated ownership boundary before REC0 continues.

### REC1 direct A0 pass and authenticated A1 source boundary — 2026-08-27

The keyed harness was relaunched with the exact
`combat-c0-server` run-directory profile while the existing isolated Fabric
client remained connected. A controlled zero-hostile fixture contained one
mushroom stew, health 20, food 14, saturation 0 and no bowl. Direct workflow
`direct_player_action_workflow:a63a2e37-8815-4d16-a4a1-191b61c599d9`
completed in 34 use ticks with food `14 -> 20`, saturation `0 -> 7.2000003`,
stew `1 -> 0`, bowl `0 -> 1`, health `20 -> 20`, one inventory mutation, zero
world mutations, no manual override and `controls_released=true`. An
independent server-console read confirmed the terminal food, saturation,
health and inventory state. REC1 direct A0 therefore has a live evidence pass;
this does not promote authenticated MCP or keyed-Helix acceptance.

The authenticated owner then configured a new consume-only Player Embodiment
lease and opaquely paired the isolated client. Its manifest and heartbeat were
fresh and action-ready with 21 capabilities. The local handoff still staged to
the default `.minecraft` profile, so the unread inbox file required one exact
opaque move into `.minecraft-helix-c0`; this is retained as an installed-node
profile portability defect.

The repeated A1 fixture was staged at health 20, food 13, saturation 0, one
stew, no bowl and no zombie. Both authenticated consume attempts failed closed
before workflow creation as `wrong_environment`. The first included a
non-matching display label; the later label-free attempt established the first
real divergence: the action gateway had zero active Minecraft source
projections because the C0 room-source heartbeat remained stale. No physical
effect occurred and the fixture remains staged.

The source-only owner MCP repair now exists as
`helix_environment_source_pair_local` and is deterministically verified, but
this Codex app session cached its MCP catalog before that tool was registered.
Restarting only the keyed Node service preserved room state and restored all
health endpoints, but did not refresh the app-owned catalog. The available
Chrome harness session was guest-only and the in-app browser control surface
was unavailable, so no login, World Authority expansion or credential bypass
was used.

Detailed receipts and the hashed fixture screenshot are in
`docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-27-rec1-a0/`.
Overall REC0/REC1 maturity remains `deterministically verified` pending a fresh
catalog load, exact source-only C0 re-pair, current source observation and one
later authenticated MCP consume success. REC2, Nether and Wither remain
NO-GO.

The next goal continuation repeated the authenticated boundary check after the
Node relaunch and a fresh app turn. The action companion was still ready and
idle, while the exact server environment remained `missing` with no current
observation and a stale subject binding. The app-owned MCP catalog again lacked
the deterministically verified source-only pairing tool. This is now the third
consecutive continuation at the same external catalog-refresh boundary. The
goal is paused blocked until the desktop app reloads its MCP catalog; no game,
server, room, lease, or fixture reset is required. After reload, resume at:
source-only pair -> fresh device/subject observation -> exact subject reselect
if the producer epoch changes -> authenticated consume -> independent
postcondition verification.

### REC1 no-desktop-restart recovery attempt — 2026-08-27

The operator explicitly authorized this single C0 task to replace the exact
Node listener on port 1522 despite the preflight's future multi-agent
`supervisor_not_enforcing` warning. PID 33688 was verified as the sole Node
listener on that port, stopped without inspecting its command line or
credentials, and the released endpoint was relaunched through the opaque keyed
launcher with `combat-c0-server` selected. Account, pipeline, and provider
health routes returned HTTP 200 on service instance
`service_instance:a876e5992fa93cc8928f5059317ceb25`.

The isolated Fabric server was also restored on port 25566 with Java 21 and the
existing `helix_combat_c0_world`. Its retained credential received manifest
admission after restart backoff, but the authenticated C0 projection remained
`connection_status=missing`, `latest_observed_at=null`; the active C0 device
continued to report `contact_stale`. There were zero players online, and the
Player Embodiment heartbeat was stale, so no consume action was attempted.

This turn's Codex tool runtime still neither listed nor defined
`helix_environment_source_pair_local`. The local browser-control bridge also
failed before a harness tab could be acquired, so there was no authenticated UI
fallback. Continuing without a desktop MCP-host reload would therefore require
either credential inspection, direct storage mutation, or temporary World
Authority expansion; all remain explicit non-goals. The keyed harness and C0
server were left running for the next continuation.

The following automatic continuation confirmed why a keyed-server restart
cannot repair the catalog. `createHelixMcpRouter` constructs a stateless
`StreamableHTTPServerTransport` with no session ID for each request, connects a
fresh `McpServer`, handles one request, and closes both objects. The SDK
advertises tool-list change support, but there is no retained transport on
which this service can notify an already-loaded Codex task after code changes.
The installed `codex mcp` CLI exposes list, get, add, remove, login and logout;
it has no connection-only reload operation. The task runtime again reported
the source-only tool as both unlisted and undefined. The canonical first-party
HTTP handoff route was also checked without a browser session and correctly
returned `401 shared_realtime_room_auth_required`; no local unauthenticated
bypass exists.

This narrows the product gap: newly registered MCP tools require a client-host
catalog reload (or a future persistent/dynamically refreshed client transport),
whereas restarting the keyed CasimirBot service alone only refreshes server
code. REC1 must still resume through the same authenticated source-only
operation after that catalog reload; the command-authority pairing contract
must not be repurposed as a compatibility alias.

### REC1 installed-EXE private-tunnel handoff — 2026-08-28

The operator switched from the repository-keyed service to the installed
CasimirBot EXE and its bundled OpenAI Secure MCP Tunnel. The exact installed
`tunnel-client.exe` process was present, and its app-private loopback
`/healthz` and `/readyz` probes both returned HTTP 200. Port 1522 was already
free, so no local Node listener was retained or replaced.

The green tunnel state is transport health, not full environment-harness
readiness. The shipped desktop controller currently forwards only to
`/mcp/local-supervisor-coordination`; the shared state schema fixes its scope to
`local_supervisor_coordination_and_device_check`, and the installed Device
Check UI explicitly excludes environment actions and general MCP tools. This
Codex task consequently exposed no CasimirBot MCP tools after the EXE switch.
Its saved CLI aliases still target the now-absent loopback port and do not
automatically attach the app-private tunnel to the active task.

REC1 therefore cannot use the current installed tunnel for source-only pairing
or Player Embodiment. The G8 prerequisite is an explicit profile-owned,
developer-authorized full Helix MCP tunnel mode (or equivalent managed client
connection) that preserves OAuth scope admission, room ownership, separately
leased Player Embodiment and World Authority, desktop-session transport
security, and complete credential exclusion. The existing read-only tunnel
must remain the default; a green read-only tunnel must not silently imply or
acquire environment mutation authority. Managed client reconnect and catalog
re-enumeration remain part of the same G8 release blocker.

### REC1 source recovery and consume-only lease preparation — 2026-08-29

The owner-keyed harness was restored on port 1522 through the approved opaque
launcher, and the disposable Fabric server was restored on
`127.0.0.1:25566` with the existing `helix_combat_c0_world`. The isolated
`helix-combat-c0-isolated` client joined as `DatDamPig`. The first source-only
local handoff did not reach the server because the keyed harness had been
started without the required `combat-c0-server` run-directory selector. The
listener was stopped through its retained terminal, relaunched with
`HELIX_MINECRAFT_SERVER_RUN_DIR=minecraft/helix-fabric-sensor/run/combat-c0-server`,
and the authenticated owner repeated only **Re-pair local sensing privately**.

The server independently logged that pairing succeeded, the connector
restarted, its read-only manifest was admitted, and the command lane remained
disabled. The owner UI then observed the exact C0 projection as active with 12
admitted read capabilities, current observation time, bound world
`minecraft:connector:023aa276-59a`, and online subject `DatDamPig`. The owner
reselected that fresh subject, replacing the stale re-verification state with
an active participant-to-player binding. No World Authority was configured.

The live lease editor exposed a separate fidelity defect before action pairing:
the action contract selected 21 capabilities by default, including
`com.casimirbot.minecraft.player.combat.guard` and
`com.casimirbot.minecraft.player.consume`, but the UI omitted both from its
checkbox list. An owner could therefore not prove a consume-only draft by
visible deselection. The editor now exposes **Combat guard** and **Consume**,
and the focused component test passes 4/4. `npm run build:client` also passed,
and the C0-profiled keyed harness was restarted against the rebuilt client.

Using the corrected UI, the owner selected exactly **Consume**, approved-
capabilities mode, manual-input cancellation, and a one-hour lease. The
returned projection reported active authority, one capability, and manual
input cancellation. The next browser action is **Pair local player privately**,
which creates the separately scoped action credential. That action is held at
the action-time confirmation boundary; no Player Embodiment credential was
created in this continuation, no consume workflow was attempted, and the
staged A1 fixture was not mutated. REC2, Nether, and Wither remain NO-GO.

### REC1 installed-EXE full-tunnel convergence check — 2026-08-29

The isolated C0 fixture remained intact while the installed-node route was
rechecked. An independent Fabric server-console read observed `DatDamPig`
online with health `20.0`, food `13`, saturation `0.0`, one
`minecraft:mushroom_stew`, no bowl, and no hostile fixture. The C0 room source
remained fresh with 12 admitted read capabilities and bound world
`minecraft:connector:023aa276-59a`. Its Player Embodiment lease projected one
exact capability, **Consume**, manual-input cancellation, and a finite
one-hour expiry, but remained `waiting for client`. No action or inventory
mutation occurred.

The current alpha.11 `win-unpacked` CasimirBot EXE was then launched directly.
Its native service and bundled `tunnel-client` 0.0.13 started successfully.
The signed-in `qte-demo-dev@casimirbot.local` profile was independently
confirmed as a developer account. Device Check initially projected
`Ready · tunnel-client 0.0.13 · Read only coordination`, matching the required
restart default. Through the explicit native stop/start boundary, the operator-
authorized session selected **Start full developer MCP**; Device Check then
projected `Ready · tunnel-client 0.0.13 · Full developer MCP`. This mode switch
does not itself grant room, source, Player Embodiment, World Authority, or
terminal authority.

The already-open Codex task retained its installed Device Check plugin schema.
An authenticated `helix_environment_device_check` call succeeded through the
new full tunnel for EXE room
`shared_realtime_room:07c009a9-cb6f-44f9-a1c4-48baa2e079ef` and returned a
valid credential-free device-check list with zero devices. The task's callable
catalog still contained no environment action, subject, source-pair, player-
pair, or player-action tools. This proves native full-tunnel transport and the
cached-client catalog divergence separately; it does not prove authenticated
REC1 action readiness.

The EXE room currently has no environment binding. Its next credential-creating
action is **Pair in game**, held at the explicit action-time confirmation
boundary. After source admission, the already-confirmed **Pair local player
privately** action can stage the isolated client credential. Authenticated MCP
consume still additionally requires a managed Codex catalog refresh or a new
full-MCP client attachment. REC2, Nether, and Wither remain NO-GO.

### REC1 installed-EXE connector admission and direct replay — 2026-08-29

The installed desktop session boundary admitted source pairing and room ingress
but rejected the independently authenticated Player Embodiment transport with
`desktop_session_required` after its one-time pairing succeeded. The native
guard now admits only the exact
`/api/environment-action/v1/authorities/` connector namespace. Every route
under that namespace still requires its separately scoped action bearer token;
browser authority-management routes remain behind the per-launch desktop
session. Focused desktop-session and MCP transport tests passed 28/28.

The Fabric connector client also pins HTTP/1.1 so Java does not attempt an h2c
upgrade through the Node transport. Its focused connector tests, Fabric sensor
build and Player Agent build all passed. The rebuilt alpha.11 EXE then reported
the exact C0 source fresh, subject `DatDamPig` selected, consume-only authority
active, and the paired client ready with 21 declared capabilities. World
Authority remained disabled.

A first replay timed out with controls released because Peaceful difficulty
refilled hunger to 20 before use. That was a rejected fixture, not an acceptance
result. After restoring Normal difficulty with no hostile entity and staging a
bounded Hunger effect, the accepted direct fixture began at food `13`,
saturation `0.0`, health `20.0`, mushroom stew x1 and bowl x0. Workflow
`direct_player_action_workflow:fa76fdce-7254-4be8-8364-c2f4a611ca46`
succeeded in 32 use ticks with food `13 -> 19`, saturation
`0 -> 7.2000003`, health unchanged, stew `1 -> 0`, bowl `0 -> 1`, zero world
mutations, no manual override and controls released. Independent server-console
reads matched every material postcondition.

The A1 fixture is restaged at food `15`, saturation `0.0`, health `20.0`, one
stew, no bowl and no hostile. OAuth reauthorization for
`casimirbot_g2_a1_local` completed successfully, and the configured server
catalog includes `helix_minecraft_player_action`. This already-running Codex
task still holds its pre-login callable catalog, so the authenticated consume
requires one client-host catalog refresh. No MCP consume was simulated through
the direct lane, and maturity is not promoted. REC2, Nether and Wither remain
NO-GO.

### REC1 authenticated MCP A1 pass — 2026-08-29

After the Codex client-host reload, the local MCP profile still failed to
attach because its keyed port-1522 listener and the isolated Fabric server had
both exited with the previous app process. The MCP profile and OAuth session
were valid. The profile allowlist was corrected to include the already
registered `helix_environment_source_pair_local` tool, the owner-keyed harness
was restored through the approved opaque launcher with the exact
`combat-c0-server` selector, and all three required health routes returned
HTTP 200. The disposable Fabric server was restored with Java 21, the existing
`helix_combat_c0_world`, and its 640 MiB ceiling. Docker, WSL, the preserved
Nether world and unrelated processes were untouched.

The authenticated source-only handoff rotated the exact existing Fabric
binding without requesting command or action credentials. The dedicated
server claimed the opaque inbox, admitted its 12-capability read-only manifest,
and explicitly kept the command lane disabled. The still-open isolated client
was rejoined to `127.0.0.1:25566`. The room then projected a fresh active source
and online `DatDamPig`; the participant re-verified the new subject at producer
epoch `adapter_epoch:6c62552b30ff0e670e562fac3a4d5fbfa6cddd02`.

The source rotation correctly invalidated the prior action binding. A new
one-hour Player Embodiment lease was created for exactly
`com.casimirbot.minecraft.player.consume`, approved-capabilities mode and
manual-input cancellation. The action pairing was staged opaquely and moved,
without reading it, from the default Minecraft profile into the isolated
`.minecraft-helix-c0` inbox. The client admitted a 21-capability manifest and
fresh heartbeat. Readiness reported no active workflow, no asserted controls,
no manual input and no emergency-stop latch.

The MCP actor-status preflight exposed a separate retained-grant defect:
`room_read_grant_identity_mismatch` after the environment-binding rotation.
No read grant or World Authority was expanded. Instead, the retained dedicated
server console supplied independent read-only fixture evidence. It confirmed
health `20`, food `15`, saturation `0`, mushroom stew `1` and bowl `0`.

The first authenticated action was intentionally retained as failed evidence.
Workflow `environment_action_workflow:6b44e434-f497-4550-bd7e-7f2c07bd7da5`
consumed the stew and produced the bowl with food `15 -> 20`, saturation
`0 -> 7.2000003`, unchanged health, zero world mutations and released controls,
but correctly failed the requested `minimum_food_gain=6` because Minecraft's
food cap allowed only a five-point gain. This was a fixture/assertion mismatch,
not an execution failure, and it was not replayed under the same idempotency
key.

The isolated fixture was then restored through the dedicated test console to
the canonical health `20`, food `14`, saturation `0`, stew `1`, bowl `0` state.
The second logical MCP action completed successfully:

- workflow: `environment_action_workflow:10e69d62-6341-485e-8c35-ba3d65700bcc`
- execution: `environment_action_execution:295424ef-68f5-4bc5-a9ef-cf91ebbe242e`
- evidence: `environment_action_evidence:2c7942ac1f657ea1b2e41640ba41c69ca88bc13c9`
- duration: 34 synchronized client ticks, including 33 use ticks
- food: `14 -> 20`; saturation: `0 -> 7.2000003`; health: `20 -> 20`
- mushroom stew: `1 -> 0`; bowl: `0 -> 1`; inventory mutations: `1`
- world mutations: `0`; manual override: none; controls released: true
- model invoked inside connector: false; host access: false; automatic replay: false

An independent dedicated-server read matched health `20`, food `20`, saturation
`7.2000003`, no stew and one bowl. The post-action connector inspection showed
the consume-only authority still active, heartbeat fresh, zero active workflows,
controls unasserted and no manual input or emergency stop. The in-game proof
screenshot is recorded at
`docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-29-rec1-a1-mcp/minecraft-post-consume.png`
with SHA-256
`720F27F7F64F301547BE05662FBB26ED41C067C8502769281269AD14B57EECD0`.

This satisfies the REC1 authenticated MCP A1 evidence requirement and closes
the scoped REC0/REC1 acceptance objective. It does not close G8 or authorize
REC2, Nether or Wither progression. Per the goal boundary, all three remain
NO-GO in this continuation.

### Combat Inventory Recovery v1 / REC2 goal activation — 2026-08-29

The next bounded goal is REC2, not the full Nether journey and not REC2A crowd
pressure. The user-supplied soup-PvP inventory image is comparative operator
evidence for rapid inventory use under damage; it is not a prescribed loadout,
vanilla-healing claim, or permission to encode mushroom-stew strategy in the
controller. Vanilla mushroom stew restores food and saturation. Any later
health regeneration remains a separately observed consequence of the active
game rules.

The frozen first direct program is
`scripts/fixtures/minecraft-combat-rec2-inventory-recovery-v1.json`. Runtime
Codex may author an equivalent bounded program from fresh state, but the
fixture defines the deterministic capability benchmark and evidence fields:

```text
stable hostile-clear envelope
  -> recipe craftability checkpoint
  -> craft exactly one admitted output
  -> verify output inventory delta
  -> consume exactly one admitted item
  -> verify food and remainder delta
  -> explicitly re-equip the reasoning-selected weapon
  -> re-engage only through admitted combat policy
  -> verify the newer combat/player state and release all controls
```

One health-floor interrupt may cancel the inventory lane and activate a
separately declared defensive stabilization lane. A handled interrupt proves
preemption and control release, not recovery-goal completion; the exact partial
inventory state must re-enter Runtime Codex before a revised program may run.
The controller may not replay a mutating craft, consumption, or attack from an
ambiguous receipt.

The initial code audit found that `attack` and `combat_guard` were valid typed
Player Embodiment actions and standalone live capabilities, but both were
absent from the reactive scheduler's TypeScript and Fabric resource maps. That
made a model-authored `fight -> recover -> re-engage` program fail before
execution even with an explicit combat scope. The shared correction assigns
exact camera/hand/locomotion/native-workflow locks and requires
`mutation_scope.combat_allowed=true`; it neither selects a target nor invents
a recovery branch.

REC2 acceptance requires one equivalent-state direct A0 run and then one
authenticated MCP A1 run. Each must preserve the program hash, authority and
subject/world identity, initial ingredient/food/health state, condition
changes, action receipts, inventory ceiling, interrupt outcome, minimum health,
food/stew/bowl deltas, combat outcome, timing, zero world mutation, and full
resource/control release. A screenshot is afterward-only corroboration. REC2A,
keyed Helix B parity, unknown-world Nether progression and Wither progression
remain NO-GO until this narrower chain passes.

### REC2 direct A0 and authenticated MCP A1 live acceptance — 2026-08-29

The generic reactive protocol repair is complete. Reactive programs now admit
`attack` and `combat_guard` only when `mutation_scope.combat_allowed=true`, and
the TypeScript and Fabric schedulers assign their exact camera, locomotion,
hand and native-workflow resources. The public connector catalog now describes
the same combat actions plus craft and consume shapes accepted by the trusted
parser. Noncombat fluid sequences retain literal `combat_allowed=false`.

The frozen program is SHA-256
`701E715624A92288DBCF99DF3C80CBB9D9B34FF7B7C0706D9E0B2B2AA4046BA5`.
Its final graph requires a hostile-clear envelope, craftability, one stew
craft, measured consumption, food recovery, explicit reasoning-selected iron
sword re-equipment, and bounded zombie re-engagement. The declared inventory
ceiling is three; the graph cannot add another inventory-affecting action
without failing validation.

The live diagnostic sequence retained three informative fail-closed results:

- the first run completed craft and consumption but observed no admitted
  hostile, proving only the inventory chain;
- the next visible-hostile run reduced the tagged zombie from health `20` to
  `4.020001` but exhausted 32 bare-hand attack pulses after consumption left
  the recovery item path selected; and
- the first re-equipment retry timed out at the hostile-clear checkpoint after
  the prior chase displaced the player inside the four-block safety radius.

The repaired direct A0 fixture restored the known open arena pose and began at
health `20`, food `15`, saturation `0`, bowl x1, red mushroom x1, brown
mushroom x1, iron sword x1, shield x1 and one visible tagged zombie. Workflow
`direct_player_action_workflow:03fe8c8c-e39c-4400-ba11-0c01358e307e`
succeeded in 106 synchronized client ticks. Craft succeeded at tick 4,
consume at tick 37, weapon equip at tick 37 and combat guard at tick 106.
There were two inventory mutations, zero world mutations, no interrupt or
manual override and every resource/control was released. Independent server
reads confirmed health `20`, food `20`, saturation `7.2000003`, bowl x1,
iron sword x1 and no tagged zombie.

The first A1 submission then exposed the expected running-service schema
boundary: the old keyed service still required reactive
`combat_allowed=false`, so no workflow was created. The exact keyed Node
listener was restarted through the opaque launcher after supervisor
coordination showed no active competing client. The room survived, the source
credential was rotated read-only after expiry, and DatDamPig was re-verified
at producer epoch
`adapter_epoch:afce61ca4673c3538e4c316b0aa0221de295d1c0`. A new
guardian-only Player Embodiment lease was paired opaquely:

- environment binding:
  `environment_binding:legacy:207e917c2f59fc92062bdcf568c509e8db419cff`
- subject binding:
  `environment_subject_binding:a647bf6d-a22e-42f7-a6c2-65d3e5640aad`
- action authority:
  `environment_action_authority:04f69a80-5710-48fe-a3e7-aa5a48611a43`
- allowed capability:
  `com.casimirbot.minecraft.player.guardian.execute`

The final A1 fixture began at health `20`, food `14`, saturation `0`, the same
ingredient/weapon inventory and the same bounded tagged-zombie geometry.
Authenticated MCP workflow
`environment_action_workflow:3109f77d-7015-4b91-b132-c311252b5caf`
succeeded in 107 synchronized client ticks:

- request: `environment_action_request:8ff2dd58-5253-4b73-a208-dcce0d688898`
- execution:
  `environment_action_execution:9359861e-7e16-4cd0-a5b3-8819c1c65e0c`
- evidence:
  `environment_action_evidence:0895c26a223251ebc5a413b6a2fbca989a6f0deae`
- craft tick 5; consume and sword equip tick 38; combat completion tick 107
- two inventory mutations; zero world mutations; no manual override
- no connector-side model, host access or automatic replay
- all lanes settled and every held resource/control released

Independent server reads again confirmed health `20`, food `20`, saturation
`7.2000003`, bowl x1, iron sword x1 and no tagged zombie. The direct capture,
comparison trace, A1 summary and afterward-only screenshot are under
`docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-29-rec2-a0/`.
The screenshot SHA-256 is
`FE812CAB4B7828AE6EC5E52840F44C0D3698CAFB99CDE5E6EA2D673B783557D0`.

This promotes only the bounded REC2 capability slice to `live accepted`.
REC2A latent recovery is now unblocked as the next arena goal, but it is not
yet accepted. Keyed Helix B parity, unknown-world Nether progression and
Wither progression remain NO-GO pending their own evidence.

Final deterministic verification passed 25 of 25 focused TypeScript contract
tests, the focused Java scheduler tests, and the full Fabric build with five
GameTests. The installed remapped Fabric agent JAR is SHA-256
`751C3D9156DF661BBCF378172A9498ECA2EA64A8C529EBC45001BF020D4D5883`.
The canonical environment-harness documentation audit passed with active gate
G8, 36 capability-status rows, 14 acceptance claims and zero failures.

### REC2A latent combat recovery implementation contract — 2026-08-29

Primary lifecycle stage: execution. Secondary stages are tool admission,
evidence normalization and semantic re-entry. This slice remains inside active
program gate G8 and extends the already accepted C0/REC2 arena capability; it
does not depend on or perturb an open prerequisite.

REC2A freezes one provider-neutral reactive program at
`scripts/fixtures/minecraft-combat-rec2a-latent-recovery-v1.json`. Its only
immediate required lane is ordinary bounded zombie combat. Craft, consume,
re-equip and resumed combat exist only in a dormant interrupt lane. The
program contains no damage timestamp, fixture command, scheduled meal or
adapter-authored target. The external arena fixture introduces the recorded
health transition only after physical combat has begun, and the resident
scheduler sees only the resulting ordinary health observation.

The first-divergence audit found that `combat_guard` could defeat hostiles but
could not settle a deliberate separation maneuver while those hostiles still
existed. The generic correction adds an optional `combat_mode`:

- `engage` preserves the existing target, cooldown, retreat and attack
  behavior; and
- `disengage_to_distance` suppresses every attack pulse, tracks the closest
  visible eligible hostile, retreats through the existing collision-checked
  movement primitive and succeeds only after every visible eligible hostile
  is at least `retreat_stop_distance` away.

The mode is reasoning-selected data in the typed action schema and public
catalog. It does not choose when to eat, set a health threshold, identify a
target class, invent a route, perform a fixture mutation or grant combat
authority. Its terminal receipt must retain `combat_mode`, minimum hostile
distance, `safe_separation_reached`, retreat ticks, zero attack pulses and
control release.

The frozen recovery trigger is a one-shot same-tick health condition:
`health_at_least: 16`, observed as `not_satisfied`. It cancels the required
opening-combat lane and activates exactly one dormant recovery lane. That lane
must then establish seven-block hostile separation, independently verify a
six-block hostile-clear envelope, verify recipe craftability, craft one stew,
consume it above the hard health floor, verify food at least 18 and health at
least 10, re-equip the iron sword and resume bounded combat. The mutation
ceiling remains three inventory-affecting actions and zero world mutations.

Acceptance uses matched control and treatment runs from equivalent C0 state:

1. **No-perturbation control:** opening combat settles without activating the
   interrupt, crafting, consuming or changing the ingredient inventory.
2. **Latent-trigger treatment:** physical combat starts first; a separately
   recorded bounded damage transition crosses the threshold; preemption occurs
   within one client tick; disengagement performs zero attacks; exactly one
   stew is crafted and consumed; a later verified frame satisfies the resume
   rules; the sword is restored; and the original fight settles.
3. **Fail-closed floor:** any action that observes health at or below five
   stops rather than forcing inventory use or replay. REC2B will separately
   test missing food, unreachable separation and other bad-break branches.

Record the program hash, player/world/authority identity, external
perturbation receipt and tick, threshold-to-preemption ticks,
preemption-to-separation ticks, separation-to-consumption ticks, hits after the
trigger, minimum health, ingredient/stew/bowl/food deltas, action receipts,
interrupt count, zero world mutation and final control/resource release.
Equivalent-state direct A0 must pass before authenticated MCP A1. Keyed Helix
B, REC2B, unknown-world Nether progression and Wither progression remain
outside this slice.

### REC2A direct A0 live acceptance and first-divergence repair — 2026-08-29

The final direct program is SHA-256
`8D71CE6C1A0159CD3FD03E2FE14E58E268300642C52177A355112D2A750307F5`.
The final installed remapped Player Agent JAR is SHA-256
`AB2663106EB8C512D696A2A1787355D8BA7B9EC107D6231FC6509740D1CEF9D1`
and carries combat-controller artifact version `1.3.1`.

The live sequence retained two useful rejected attempts. Two early
perturbations arrived after the short opening fight had already settled and
therefore did not qualify as latent-trigger evidence. After replacing only the
fixture zombie with a 200-health, zero-damage equivalent, one treatment exposed
a real controller divergence: looking at the pursuer while holding backward
could not create separation. The attempt failed closed at the disengagement
timeout with minimum hostile distance `0.7548506259918213`, zero attack pulses,
zero mutations and controls released.

The generic repair does not slow the fixture or script an escape path.
`disengage_to_distance` now orients away from the closest admitted hostile,
uses forward sprint when the camera reaches that direction and tries the
existing collision-checked deterministic flank alternatives when the direct
step is blocked. Engage mode still tracks the hostile normally. The scheduler
also normalizes the native consume receipt's `consumed_count` into the
program-level `consumed_item_count` and retains the bounded combat separation
measurements required by acceptance.

The matched final-artifact A0 pair then passed:

- control workflow
  `direct_player_action_workflow:401dd018-3254-4c8d-bd0c-f93e27357f44`
  completed at tick 397 with one engage action, 34 attack pulses, zero
  interrupts, zero consumption, zero inventory/world mutations and controls
  released;
- treatment workflow
  `direct_player_action_workflow:4b3286f7-b513-4fa5-934d-fa612a87083c`
  observed the external health transition `20 -> 15`, fired the authored
  interrupt once, canceled opening combat, and reached verified 7.045-block
  separation at tick 212 with zero disengagement attack pulses;
- the dormant lane then crafted and consumed exactly one stew, reported
  program-level `consumed_item_count=1`, re-equipped the iron sword at tick
  248, resumed combat for 28 attack pulses, cleared the zombie and settled at
  tick 635; and
- treatment totals were two inventory mutations, zero world mutations, no
  manual override and full resource/control release.

The public captures and comparison summary are under
`docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-29-rec2a-a0/`.
This promotes only REC2A direct A0 to `live accepted`. Authenticated MCP A1 is
still required before REC2A as a whole may be promoted. On the first A1
preflight, the keyed server reached `app ready`, but the old Fabric source
credential expired and stopped its loops fail-closed. The currently loaded
Codex catalog exposes only the read-only Device Check plugin, and no browser
control surface is attached, so the credential-opaque
`helix_environment_source_pair_local` handoff has not yet been invoked. No
credential was read, copied or replaced through a manual fallback.

### REC2A authenticated MCP A1 live acceptance — 2026-08-30

The restarted Codex client loaded the full OAuth MCP catalog with all required
room-read and environment-action scopes. The existing C0 room was recovered,
the read-only Fabric credential was rotated through the opaque same-host
handoff, `DatDamPig` was re-verified against the fresh producer epoch, and a
one-hour `approved_capabilities` authority was issued for only
`com.casimirbot.minecraft.player.guardian.execute`. The action connector then
reported an admitted 21-capability manifest, a fresh active heartbeat, no
manual input, no emergency-stop latch and zero asserted controls.

The action-plane adapter identity is `minecraft.fabric_client.v1`; the source
plane remains `minecraft.fabric_mod.v1`. An initial configure call used the
source label for the action plane and correctly failed before issuing an
authority. The corrected action-adapter identity succeeded without widening
the requested capability set.

The matched authenticated pair passed on the unchanged program and JAR:

- control workflow
  `environment_action_workflow:3497d5be-b08a-40f7-be66-8989c12bc185`
  completed in 410 synchronized ticks with 35 attack pulses, zero interrupts,
  zero consumption, zero inventory/world mutations and controls released;
- one treatment timing diagnostic
  `environment_action_workflow:83eb3a59-79c6-4fdf-a110-0697e9b54064`
  is excluded because the interactive console write serialized behind MCP and
  arrived after terminal completion;
- accepted treatment workflow
  `environment_action_workflow:4b4a8263-de5d-4d1c-81c4-520eb5eeeb08`
  began normal combat before a separate localhost-only arena RCON actor
  recorded exactly five generic damage and health `20 -> 15`;
- the watchdog crossed its threshold at tick 68, canceled opening combat and
  reached 7.0045-block separation at tick 118 with zero disengagement attacks;
- it crafted at tick 120, consumed one stew and re-equipped the sword at tick
  154, resumed combat for 30 attack pulses and settled at tick 540; and
- totals were one interrupt, five actions, two inventory mutations, zero world
  mutations, no manual override, no connector-side model/replay/host access
  and full resource/control release.

Independent afterward reads found health 20, food 19, saturation 0, one bowl,
one iron sword, no stew or mushroom ingredients and no tagged zombie. The
sanitized summary and afterward screenshot are under
`docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-30-rec2a-a1/`.
The screenshot SHA-256 is
`C4F9E2F14991E9AE3E7D33BB7ED5F73BD75FFA68213E073FD99845360FF16070`.

This promotes the bounded REC2A slice to `live accepted`. It does not promote
REC2B bad-break recovery, keyed Helix B parity, unknown-world Nether
progression, PvP or Wither progression.

### REC2C pressure-commit exploratory A1 and first evidence gap — 2026-08-30

The next bounded slice separates direct-survival consumption from the accepted
REC2A safe-break policy. A frozen reactive fixture now admits one low-health
interrupt, exact golden-apple use, sword re-equip and resumed zombie combat.
The deterministic TypeScript contract passes 19/19 tests. This fixture is an
evaluation artifact, not yet a predictive damage-risk controller.

Open-floor controls cleared five adult zombies in 239 ticks with 18 attacks and
seven adults in 335 ticks with 26 attacks; afterward health remained 20 in both
single exploratory trials. A close nine-adult surround also cleared without a
recovery trigger. These are not breakpoint samples because each count has only
one run and the open retreat geometry did not generate pressure.

A temporary inner ring plus seven baby zombies produced the first genuine loss.
The guardian timed out at 1,200 ticks with four survivors after 13 attacks, then
released controls. The survivors killed the player before setup cleanup arrived.
This does not establish the count-seven breakpoint, but it proves that terminal
control release is not a sufficient safe handoff while admitted live threats
remain. A required failure must retain a bounded defensive/containment owner or
emit a synchronous fixture-stop request before action ownership settles.

After two discarded setup attempts exposed healing from an uncleared Instant
Health effect, the accepted exploratory sequence began from independently
verified health 17 with passive natural regeneration disabled. Authenticated
workflow `environment_action_workflow:7e6cbf20-d74b-4687-9aa3-4e86f375418f`
triggered recovery at tick zero, consumed exactly one golden apple at tick 33,
re-equipped the iron sword at tick 33, then cleared five adult zombies by tick
179 with 13 attacks. Independent afterward reads found health 20, absorption 4
and two apples remaining. The run had one interrupt, two inventory mutations,
zero measured world mutations and full control release.

The receipt proves ordered `consume -> re-equip -> resume -> clear` execution
while live hostiles were released, but it does not expose minimum health,
health-loss event count or damage received during the 33 use ticks. Therefore
it does not yet prove that a zombie strike landed while the use key remained
held. REC2C remains `specified` plus exploratory A1 evidence, not live accepted.
The next implementation increment adds those use-window measurements, a
damage-through-completion risk margin and hazard-safe terminal settlement before
repeating five trials per count. Evidence is under
`docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-30-rec2c-a1/`;
the screenshot SHA-256 is
`02165C89D47680B12790D65AE9AFBF85DDB2379F4820025A62C729BA1808C94E`.

The first measurement increment is now implemented in the native Fabric
workflow engine. Every admitted `consume` receipt reports
`minimum_health_during_use`, `observed_health_loss_during_use` and
`health_loss_event_count_during_use`; the scheduler retains those fields in
the authenticated MCP result. Adapter artifact version `0.4.1` was deployed
from JAR SHA-256
`497BE8BC50B02AC2C2AC7B25334462E5ED9CCF5A8EF0FD192573D7010D0518E3`.
The focused TypeScript contract passed 19/19, the Java 21 test/build and all
five Fabric GameTests passed, and the environment-harness documentation audit
passed.

Measured authenticated workflow
`environment_action_workflow:af6f96d0-597a-45f6-bba1-5bb0775b50c3`
repeated the low-health five-baby pressure sequence. It consumed one golden
apple over 31 use ticks, re-equipped at tick 32 and cleared the horde at tick
250 with 19 attack pulses. The new receipt measured minimum health 17, zero
health-loss events during use and zero observed health loss during use. A
seven-baby low-health repeat also consumed and cleared, but likewise measured
zero use-window health loss.

Full-health reactive trials then admitted live baby-zombie counts 7, 11, 15
and 16. All four cleared without crossing the health interrupt: respectively
11 attacks/121 ticks, 20/229, 32/373 and 34/397. A five-opponent sustained
pressure variant with Speed III, Strength II and Resistance II also cleared in
289 ticks with 25 attacks and no interrupt. These are single exploratory
trials, not the frozen five-run breakpoint bracket, and the status remains
`exploratory_not_accepted`. They establish that raw count through 16 is not the
observed limiting variable in this tight-ring setup; the controller suppresses
contact faster than ordinary zombies can produce the intended pressure event.
The next arena rung must vary sustained threat geometry or projectile pressure,
while preserving a human-comparable opponent contract, rather than increasing
zombie count alone.

The implementation still does not provide source-attributed damage, bounded
hazard ownership after a failed workflow, contextual target admission, or the
five-trial controller-versus-human breakpoint bracket. Those remain the REC2C
acceptance blockers. The temporary ring and tagged fixtures were removed,
natural regeneration was restored, effects were cleared and the player was
returned alive at health 20.

### REC2C installed-EXE MCP transport/catalog preflight — 2026-08-30

The next C0 continuation intentionally preferred the installed CasimirBot EXE
and its private tunnel over browser or desktop-input execution. The arena
server and Minecraft client remained running, but restarting the installed EXE
created a fresh service instance and left Device Check with zero paired
devices. No hostile fixture or environment mutation was admitted during this
preflight.

The native desktop UI reported `Ready · tunnel-client 0.0.13 · Full developer
MCP`, and the existing Codex client automatically reattached to service
instance `service_instance:a899ee6276a95ea38b8ac07cb5efcb65` without a Codex
application restart. The callable client catalog nevertheless remained the
read-only Device Check catalog: exactly one environment tool was present, and
the source-pair, subject, Player Embodiment, controller and finite action-pulse
tools were absent. A native transition request then returned `Tool
helix_desktop_tunnel_transition_request not found` while that tool remained in
the Codex-side catalog. A room-list observation on the same authenticated
profile returned `account_policy_blocked`, even though the desktop retained the
active local `qte-demo-dev@casimirbot.local` session.

The tunnel process itself remained alive. A secondary diagnostic exposed a
separate Windows plugin-integration defect: the Tunnel MCP selector rejected
the installed, currently running 21.8 MB `tunnel-client.exe` as “not an
executable file.” Invoking that binary's native `runtimes list --json` command
directly succeeded and reported no managed runtime aliases, which is consistent
with the EXE owning its tunnel lifecycle rather than the plugin runtime
inventory.

This is a transport/catalog convergence failure, not a REC2C controller or
Minecraft-play failure. The next implementation increment must make the full
catalog selection, authenticated account policy and tool-list refresh converge
for the already-attached Codex continuation, then re-pair the exact C0 Fabric
source opaquely on the fresh service instance. Only after Device Check is fresh
and the bounded action-pulse tools are callable may the mixed-pressure arena
test resume. REC2C remains `exploratory_not_accepted`; REC2B, Nether, PvP and
Wither maturity are unchanged.

### REC2C native full-MCP convergence repair and live transition — 2026-08-30

The transport/catalog preflight produced two concrete server defects and one
remaining client-lifecycle limitation.

First, the full MCP router selected ordinary bearer authentication whenever an
`Authorization` header was present, even when the native tunnel had also
injected its protected desktop session headers. Tunnel-client 0.0.13 can
forward both. The router now gives the protected native desktop delegation
precedence whenever either protected native header is present; bearer-only
clients retain their previous path. The native full-agent delegation scope set
was also completed with agent-run, room/source, environment-action, brokerage,
supervisor and tunnel-transition scopes. The focused transport suite passed
21/21.

Second, the read-only coordination catalog pre-advertised only room controls.
It now pre-advertises exact-schema, fail-closed transition shadows for source
pairing, subject selection, environment authority, local player/server pairing,
Minecraft actor status, finite player actions and workflow control. Every
shadow returns typed `full_mcp_transition_required` with
`mutation_executed=false` before the full transport is active. Exact schema
parity and fail-closed coverage passed 14/14. The server build and desktop host
build passed; the unpacked desktop artifact was produced before packaging later
stopped at icon conversion because Windows could not allocate another WebAssembly
memory block. No Minecraft, Docker or Fabric process was stopped by that build
failure.

Live acceptance then launched the repaired unpacked CasimirBot host against the
existing local developer profile. The active Codex continuation registered with
fresh service instance
`service_instance:46c0f88c7b6ba1628dce16ae0e0c7674`, created a bounded
300-second transport request, received explicit native UI delegation and
executed the transition. The desktop independently reported
`Ready · tunnel-client 0.0.13 · Full developer MCP`. This proves that native
presence, developer policy and the full transport now converge without a Codex
application restart.

The already-open Codex turn did not apply the requested tool-list refresh. Its
callable catalog remained the immutable pre-transition snapshot containing only
`helix_environment_device_check`, and an inspect call issued after the transport
switch remained pending until canceled. Therefore no source credential,
environment authority, hostile fixture or Minecraft action was admitted in this
turn. The repaired transition-shadow catalog makes a subsequent catalog
initialization stable, but the current Codex client still needs to honor the MCP
`tools/list_changed` notification (or refresh tools at a turn boundary) before
seamless same-turn play is proven. This is now the sole pre-play blocker for the
resumed C0 mixed-pressure test; the Fabric arena server on 25566 and Minecraft
client remain retained.

### REC2C endpoint-aware opaque re-pair and installed-profile finding — 2026-08-30

The next continuation rebuilt and packaged the unpacked desktop successfully,
deployed the remapped Fabric sensor JAR, and restarted only the C0 Fabric server
on `127.0.0.1:25566`. Docker remained untouched. The server returned to the
exact `helix_combat_c0_world` baseline with the command lane disabled.

The opaque pairing handoff now supports a strict
`casimirbot.local_server_pairing_handoff.v1` envelope carrying the current
loopback redeem endpoint. The Fabric inbox accepts that envelope as well as the
legacy plain pairing command, validates the exact loopback route and port, and
uses the envelope endpoint instead of a stale endpoint persisted by an earlier
ephemeral desktop service. Focused TypeScript tests passed 6/6, the Java 21
Fabric pairing tests passed 5/5, `build:server`, `build:host`, runtime staging
and unpacked Electron packaging passed. The deployed sensor JAR SHA-256 was
`CC2FF5BFDD89823E6B5AFEB490CAD5B59D18C7DBC47785066200C155310B3063`.

Live transition proved that Computer Control is still needed only for a broken
bootstrap boundary, not intended steady-state play. The limited native catalog
could register supervisor presence and request full MCP, but the consent surface
was trapped inside a Device Check panel omitted from the current launcher. The
same native owner operation used by that panel switched the tunnel to
`ready · full_helix_agent`; `helix_room_list` then succeeded immediately through
MCP without a Codex restart. The current Codex turn still did not add the
Minecraft source, subject, status or action schemas to its advertised tool set.

The authenticated desktop staged a sensing-only local handoff for the exact
active Fabric binding without exposing the one-time code or enabling command
access. A second release defect was then isolated: the packaged service ignored
the selected C0 run profile and wrote the unopened inbox under its packaged
runtime tree. After the unopened file was moved atomically, without reading its
contents, the running server reported `Helix pairing succeeded`, followed by
`manifest was admitted; read-only observations are active`. This is direct live
proof that the endpoint-aware envelope and sensor consumption path work.

Two pre-action blockers remain. First, the installed profile must persist and
route the selected Minecraft run directory so opaque handoffs never depend on a
manual file transfer or process working directory. Second, two fresh
`helix_environment_device_check` calls returned retryable `internal_error`
after manifest admission, while the same full MCP connection continued to serve
room reads. No Player Embodiment authority, command access, hostile fixture or
combat action was enabled. REC2C remains `exploratory_not_accepted` until Device
Check projects the fresh connector and the finite Minecraft action schemas are
callable from the Codex turn.

### REC2C Codex-plugin durability finding — 2026-08-30

Device Check error re-entry was repaired and now returns a valid typed stale
connector observation rather than `internal_error`. The observation identifies
the exact C0 room and Fabric binding but reports `health=offline`,
`freshness=stale`, `probe_ready=false`, and `contact_stale`. This is useful
evidence, not gameplay readiness.

The remote Device Check v2 plugin declaration was then refreshed and visibly
advertised the environment subject, opaque source-pair, actor-status, player
action, and workflow controls. The current Codex task retained its older
catalog, proving that remote schema publication and existing-task catalog
adoption are separate lifecycle events. In addition, the full `/mcp` surface
was found to omit its own governed transition controls. That discontinuity is
now repaired and covered by a focused passing test; the server production build
also passes.

The product boundary for the resumed C0 test is now explicit:

1. the plugin publishes one stable superset and unavailable tools fail closed;
2. the installed app reports transport, catalog, connector freshness, selected
   environment, and action-authority readiness as separate states;
3. the installed profile owns opaque connector enrollment and the selected
   Minecraft installation/run profile;
4. the Fabric connector discovers or is relayed to the current installed
   loopback service without retaining an obsolete per-launch port;
5. Codex receives only sanitized handles and readiness receipts, never tunnel,
   connector, or environment credentials; and
6. desktop automation remains a bootstrap/recovery fallback, never the normal
   combat or inventory-control plane.

The next implementation slice is the profile-owned local connector gateway and
managed catalog/readiness receipt. After that installed slice is rebuilt, the
acceptance order remains: opaque re-pair -> fresh Device Check -> exact actor
selection -> bounded Player Embodiment -> mixed-pressure recovery/combat test.
REC2C remains `exploratory_not_accepted`; no combat maturity changes here.

### REC2C installed-service endpoint discovery implementation — 2026-08-30

The installed EXE already writes an atomic, credential-free
`casimir_desktop_service_ready_receipt/1` under its protected user-data state.
It contains the current per-launch loopback origin and service PID, but no
desktop-session secret. The Fabric sensor now resolves that receipt before each
HTTP request. It accepts only the exact schema, `ready=true`, a live PID and an
HTTP `127.0.0.1` origin; it retains the previously paired room-ingress binding
path and bearer credential unchanged. Invalid files, dead processes, remote
origins, HTTPS connectors and non-binding endpoints fail closed to the original
configured endpoint.

This removes the installed-app restart dependency from an already paired local
Fabric connector without introducing port 1522, another fixed port, a model-
visible credential, or a second planner. It does not solve first enrollment or
select a Minecraft installation: those remain profile-owned UI/native-host
responsibilities.

Verification passed under Java 21:

- focused installed-service endpoint resolver tests — 2/2;
- full Fabric sensor test task — pass;
- Fabric sensor remapped build — pass;
- rebuilt `HelixFabricSensor-0.3.0.jar` SHA-256
  `1B3F478D84AE1133E869811F8AA8B2938DA590F458F74DFE425FD8E937A436CB`.

The retained C0 server is still running the previous admitted JAR. Deployment
is intentionally deferred to its next graceful stop so a development patch
does not terminate the live world process without a save-capable console path.
No live freshness or combat acceptance is claimed from deterministic tests.

### REC2C live installed-service endpoint recovery — 2026-08-30

The retained C0 process was subsequently stopped by a console control event,
which released only `127.0.0.1:25566`. The rebuilt sensor JAR was copied into
the exact `combat-c0-server` profile and the same world was relaunched with a
hidden Java 21 process. The server reported Fabric sensor `0.3.0`, prepared
`helix_combat_c0_world`, and returned to `Done` on port 25566.

The pre-restart Device Check observation was
`mcp_evidence_observation:helix.environment.device_check.inspect:8e5f801a-e46d-4bc3-bfa5-2e71d430af57`:
`health=offline`, `freshness=stale`, `probe_ready=false`, with
`contact_stale`. After restart, without re-pairing or moving an inbox, the same
room, binding, source, world and active credential produced observation
`mcp_evidence_observation:helix.environment.device_check.inspect:2f6558af-f40d-4192-a61c-21a3efe534f4`:
`health=online`, `freshness=fresh`, `probe_ready=true`, with no blockers and a
5.347-second contact age. This is live proof that the Fabric connector followed
the installed EXE's current per-launch service origin while retaining exact
connector identity.

The current Codex task still exposes none of the refreshed environment subject,
actor-status, Player Embodiment or workflow tools in its callable catalog.
Therefore no action authority or combat effect was attempted. The remaining
pre-action blocker is now isolated to existing-task plugin catalog adoption;
Minecraft sensing transport and installed-service endpoint recovery are live.

### REC2C profile-owned local run selection — 2026-08-30

The installed Device Check panel now includes a native **Local Minecraft
profile** selector. The signed-in Casimir profile chooses a dedicated Fabric
server directory through Electron's native directory picker and may later
change or forget it. The native host validates an absolute local Windows
directory containing `config/` and `server.properties`, stores the selection
atomically under protected Electron user data, and keys it by the exact active
account profile. The selected path is visible to its owner for transparency but
is neither a credential nor accepted from MCP.

The bundled service receives only the native registry-file location. Opaque
source/server pairing resolves exactly one owner-profile entry and independently
revalidates the dedicated-server shape before staging the inbox. Missing,
duplicate, malformed, wrong-profile, root, UNC and non-server selections fail
closed to the existing bounded repository profile behavior.

Verification evidence:

- pairing profile resolver and existing handoff tests — 7/7 pass;
- native service environment, native profile persistence and Device Check UI —
  13/13 pass;
- desktop TypeScript — pass;
- server build, client production build and desktop host/bundled-service build
  — pass with existing unrelated warnings;
- repository-wide TypeScript emitted no source diagnostic but exhausted its
  4 GiB Node heap, so it is recorded as resource-cancelled rather than passed.

This closes the implementation portion of profile-owned first enrollment. A
packaged installed-node picker/re-pair trace remains required for live
acceptance. The current C0 credential is already fresh through endpoint
discovery, so no rotation was needed or performed here.

### REC2C current-task catalog blocker audit — 2026-08-30

Three consecutive goal continuations checked the current Codex task after the
remote plugin refresh. On every continuation,
`helix_environment_subject_list`, `helix_minecraft_actor_status`, and
`helix_minecraft_player_action` were absent from `ALL_TOOLS` and dynamically
undefined. The final Device Check observation,
`mcp_evidence_observation:helix.environment.device_check.inspect:514fc185-be60-4f94-b01f-8afbb827360d`,
simultaneously proved the C0 connector remained `online`, `fresh`,
`probe_ready=true`, with no blocking reasons and a 5.644-second contact age.

The same host catalog condition therefore repeated after server catalog repair,
remote plugin refresh, full-surface transition continuity repair, live Fabric
endpoint recovery, and profile-owned first-enrollment implementation. This
task cannot grant or exercise Player Embodiment because the Codex host does not
admit tools into an already-created task. A fresh Codex task lifecycle that
loads the published catalog is now required. No unrelated MCP tool, browser
receipt, desktop click, command plane, or raw HTTP path may substitute for the
missing action schema. REC2C remains `exploratory_not_accepted` and the durable
goal is paused at the exact pre-action boundary.

### REC2C installed-profile opaque pairing and mixed-pressure boundary — 2026-08-31

The restarted Codex task loaded the full installed-EXE MCP catalog. The native
Casimir profile saved the separate player game directory
`C:\Users\dan\AppData\Roaming\.minecraft-helix-c0`; the MCP player-pair tool
then staged one opaque handoff into that exact profile. The running Fabric
client consumed it without a manual file move or disclosed pairing material,
published 21 capabilities and reached fresh `ready_for_actions=true` state.
This is live acceptance for profile-owned local player routing. It does not
grant World Authority or broaden the finite Player Embodiment lease.

An authenticated REC2C transport rehearsal then ran the frozen
`minecraft-combat-rec2c-pressure-commit-v1.json` program against seven NoAI
baby zombies. Workflow
`environment_action_workflow:9c51b92a-15dd-4c21-a9a9-e0e2ddf5ad7e`
crossed the health interrupt, consumed one golden apple in 33 use ticks,
re-equipped the iron sword and cleared the frozen targets with 24 attack
pulses in 312 ticks. It performed two inventory mutations, zero world
mutations, no model invocation or host access and released all controls. This
proves the installed MCP/controller path, but it is not pressure evidence.

The real seven-active-baby treatment exposed the lower unsafe boundary.
Workflow `environment_action_workflow:ef526db4-12fe-43f0-ade9-6e449f0643e7`
observed health 2 at its tick-zero consume decision, below the frozen hard
floor of 4. The resident arbiter correctly refused consumption, performed zero
actions and mutations, and released controls. Tagged-hostile cleanup ran, but
the player subsequently died from the already-committed damage sequence. This
is useful REC2B-style bad-break evidence, not REC2C acceptance: the geometry
collapses too quickly to measure consumption while taking survivable contact
damage.

Two orchestration failures were also retained as required implementation work:

1. a fixture-release write serialized behind a blocking MCP action call and
   arrived only after that workflow timed out;
2. a later release occurred after the action request had already failed on a
   stale heartbeat because release was keyed to request submission rather than
   positive workflow admission.

Before the next active-pressure trial, fixture release must be one governed
state transition gated by fresh heartbeat plus an admitted active workflow.
Unknown, failed or timed-out outcomes must synchronously retain containment or
stop the fixture before controls settle. The next arena geometry should use a
staggered approach or bounded damage rate so health remains above 4 for at
least the 33-tick use window. REC2C remains `exploratory_not_accepted`.
Evidence and the death-screen capture are under
`docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-31-rec2c-installed-profile-live/`;
the screenshot SHA-256 is
`4C3D757DE7400052CC838F9B4615B9EFA5A1224C60A49EEF9FC74054E4A9604A`.

Final containment verification observed DatDamPig alive in Survival at health
20/20 and food 20, at the C0 baseline position, with zero hostiles in the
bounded snapshot. Natural regeneration and Normal difficulty were restored.
The environment-harness documentation audit passed, the full Helix Ask
discipline battery passed (prompt-solving, four adversarial shards, fixed API
parity, four parity scenario shards, 26/26 live-source continuation cases,
9/9 identity-audit cases and server build), and only pre-existing build
warnings were emitted.

### REC2C governed fixture supervisor and staggered-pressure v3 — 2026-08-31

The two orchestration failures above are now closed at the implementation and
live-transition levels. `helix-minecraft-arena-fixture-supervisor` owns one
strict fixture state machine: stage inert and invulnerable tagged entities,
observe a credential-free local player runtime projection, release only after
the exact action authority has a fresh accepted heartbeat plus one running
workflow with controls asserted, and clean the fixture as soon as that workflow
is no longer active. Timeout, malformed or stale status, authority mismatch,
manual input, emergency stop, process interruption and RCON failure all retain
containment or enter cleanup. The supervisor has no gameplay-success authority
and emits only sanitized state transitions.

The Fabric player companion now writes that local projection atomically every
five client ticks. It includes only authority and producer-epoch handles,
readiness, last accepted heartbeat, active workflow/state, control assertion,
manual/emergency flags and timestamps. It explicitly excludes credentials,
raw content and answer authority. A bounded three-attempt, 5 ms replacement
retry absorbs transient Windows sharing violations without turning local file
presence into action admission.

Deterministic verification passed:

- fixture supervisor behavior — 11/11 focused Vitest cases;
- supervisor standalone TypeScript check — pass;
- Fabric player-agent unit test/build — pass;
- Fabric GameTest — all 5 required tests pass;
- rebuilt player-agent JAR SHA-256
  `D6F7050640E6F106546785E0CC3D9EF2828D932434E1E8B0F4366AFE5F1D5DCE`;
- environment-harness documentation audit — pass; and
- Helix Ask discipline quick check under `tool admission, evidence
  normalization` — pass.

The first v2 live admission correctly failed closed after the client reported
`action_event_stream_resync_required`: the local projection removed readiness
and control assertion, so the supervisor never released the staged fixture and
cleaned it. After an idle opaque re-pair restored a fresh epoch, staggered v3
produced the required positive path. The supervisor observed one running
workflow with controls asserted at `05:37:15.811Z`, released at
`05:37:15.863Z` (52 ms later), detected workflow inactivity at
`05:37:23.795Z`, and completed tagged cleanup nine milliseconds later. Thus the
fixture was active for 7.932 seconds and could not outlive the admitted
workflow.

Fresh post-trial evidence observed DatDamPig alive at health 20/20 and food 20,
with zero hostile entities in the bounded snapshot. The inventory retained the
iron sword and unused golden apple and contained three rotten flesh; five
dropped item entities were visible. This is qualified live evidence for
positive-admission release, resident combat progress, survival and synchronous
containment. It is **not** recovery acceptance: the evidence does not show a
health interrupt, food use, crafting, re-equipping after use or damage received
during use. The normalized receipt is
`docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-31-rec2c-installed-profile-live/rec2c-staggered-v3-qualified-live-summary.json`.

REC2C therefore remains `exploratory_not_accepted`. The next qualified trial
must start with a controlled health deficit and an admitted consumable or stew
recipe, maintain survivable contact pressure across the measured use/craft
window, and capture the ordered transition `fight -> recovery interrupt -> use
or craft/use -> re-equip -> re-engage`. Repeated matched trials are still
required before a controller-loss breakpoint or skilled-player comparison can
be claimed.

### REC2C controlled-deficit contact-use trial — 2026-08-31

The next two governed fixtures separated baseline restoration from test damage
so health was observed rather than inferred from multiple same-tick commands.
Every attempted launch was preceded by a fresh actor/perception probe. One v5
staging attempt found health 1 instead of 14 and was aborted before positive
admission; the inert entities were never released. A reset-only fixture then
restored and verified health 20/20, after which the action fixture applied six
points of generic damage and a fresh probe verified the exact 14/20 start,
three inert tagged baby zombies at 3, 6 and 8 blocks, full food, two golden
apples and no active effects.

The admitted v5 workflow
`environment_action_workflow:d5e7c345-ffd5-46e9-8162-0e2b50331f60`
produced a successful single-trial recovery sequence. Positive workflow
admission was observed at `05:55:02.323Z`; the fixture released seven
milliseconds later. The health interrupt fired at tick 0. The controller:

1. consumed one golden apple in 31 ticks;
2. measured one contact-damage event during use, health 14 -> 11 with a minimum
   of 11;
3. re-equipped the iron sword at tick 32;
4. re-engaged and issued eight attack pulses; and
5. settled at tick 118 with zero admitted hostiles remaining and all controls
   released.

The supervisor detected workflow inactivity at `05:55:07.873Z` and completed
tagged cleanup two milliseconds later. Fresh post-trial sensing observed health
15/20, absorption active, zero hostiles, the iron sword and one remaining
golden apple in inventory, and four rotten flesh. The arena was then restored
to Normal difficulty, natural regeneration enabled, health 20/20, food 20 and
zero hostiles. The restored visual state is captured in
`minecraft-rec2c-v5-restored-baseline.png` with SHA-256
`8873023C967D5407233FD6603764027DAFB8ED9DE0A91781652D53926C07ACAE`.

The normalized single-trial receipt is
`docs/evidence/eh-mc-combat-awareness-arena-ladder-v1/2026-08-31-rec2c-installed-profile-live/rec2c-contact-use-v5-qualified-live-summary.json`.
This qualifies the narrow `interrupt -> consume under measured contact damage
-> re-equip -> re-engage -> clear -> contain` mechanism as live evidence. It
does not promote the whole REC2C ladder: mushroom-stew crafting, repeated
matched trials, a controller-loss bracket and the skilled-player comparison
remain unproven. REC2C therefore remains `exploratory_not_accepted` while the
underlying governed recovery transition is now live demonstrated once.
