Program gate: G8 — environment-harness release evaluation
Workstream: Provider-neutral spatial navigation with Minecraft as the first capacity reference
Capability or component: ENV-NAV1 — bounded spatial/topological evidence, goal-directed route planning, receding-horizon trajectory execution and sensor-driven replanning
Lifecycle stage: evidence normalization → intent arbitration → tool admission → execution → evidence re-entry → follow-up reasoning
Reaction timescale: adapter cadence for local control and safety; short checkpoint horizons for route execution; semantic-event cadence for Codex replanning; durable milestones for longer objectives
Authority owner: Runtime Codex selects the destination, policy and strategy; Helix owns identity, admission, effect bounds, provenance and terminal eligibility; the adapter owns evidence compilation; the admitted local planner/controller may choose only a route and trajectory inside the fixed destination, traversal, cost and safety envelope; the environment arbiter owns physical execution and release
Current maturity: deterministically verified for NAV0, NAV1-D synthetic topology, NAV1-M native measurement/replay, NAV1-C capture orchestration fixtures and NAV1-O admitted observation integration; remaining NAV1–NAV9 work stays specified; live executor integration depends on NAV-EQ
Target maturity: deterministically verified provider-neutral contracts and Minecraft planner/controller, followed by live-accepted Minecraft A0/A1/B evidence and a non-shipping Baritone black-box comparison; FiveM remains a contract-only second-environment fixture in this packet
Required evidence: strict schemas and adversarial fixtures; revision-bound coverage and topology; bounded search and trajectory budgets; checkpoint-linked temporal plans; obstacle, hazard, deviation and coverage-boundary replanning; local and user interruption latency; no duplicate effects; deterministic Minecraft courses; held-out black-box benchmark results; shipping-profile dependency exclusion; A0 direct, A1 authenticated MCP and B keyed Helix acceptance; and one non-Minecraft conformance fixture
Explicit non-goals: no Baritone redistribution, shipping dependency, source translation, copied API or implementation structure; no FiveM/GTA runtime implementation in this packet; no unbounded world dump or generic physics engine; no planner-authored objective; no mining, building, combat, inventory mutation, teleportation or World Authority hidden inside movement-only navigation; no claim that reachability, distance, one local frontier or one benchmark course proves general navigation
Downstream gate unlocked: after NAV-EQ passes, Minecraft-native movement qualification for companion C4/S6 gather-and-craft, unknown-world Nether progression and later second-adapter navigation; no public companion mining or full Nether acceptance is authorized by this packet alone

# EH-G8 environment spatial navigation v1

## Decision

CasimirBot should own a provider-neutral spatial-navigation contract and an
original Minecraft implementation. The first admitted product action is a
movement-only `navigate_to` that compiles an operator- or Codex-selected goal
against bounded, revision-bound world evidence. It emits a finite route
corridor plus short executable trajectory segments and continuously proves
progress, interruption and replanning through the existing Environment Time
contract.

This packet may be specified during G8 because it fixes schemas, authority and
acceptance boundaries. Live executor integration begins only after NAV-EQ establishes
the Minecraft scheduler/controller/watchdog capacity envelope. That order
prevents a new planner from hiding existing latency, stall or duplication
problems.

The NAV1-D offline slice below may compile bounded Minecraft evidence and run
deterministic topology fixtures before that qualification. It cannot dispatch
movement or establish scheduler timing, so it cannot hide execution stalls.

“Baritone-class or better” is an evaluation target, not a product dependency or
an architectural inheritance claim. Regardless of what upstream licensing may
permit, this program excludes Baritone from shipping and excludes its code,
assets, APIs and implementation structure from the owned planner.

## Existing CasimirBot foundation

The work is an extension rather than a fresh automation stack:

- `environment.temporal_action_plan.v1` already supplies three clocks, finite
  plans, committed/decision/stop watermarks, semantic resources, checkpoints,
  progressive affordance frontiers and ordered interrupts.
- Minecraft already compiles bounded plans to the finite sequence and
  concurrent reactive scheduler schemas.
- `ConcurrentReactiveScheduler`, controller/watchdog implementations and the
  environment arbiter already separate admitted intent, fast local reaction,
  feedback and release.
- the Fabric sensor and connector already expose revision-bound actor facts,
  bounded local maps/spatial regions and
  `helix.minecraft_navigation_frontier.v1`.
- the existing frontier distinguishes observed footholds and traversal
  primitives; its bounded coverage is evidence, not permission to infer a
  route through unknown terrain.
- the evaluation-only Baritone adapter and controlled trace provide a frozen
  behavioral baseline, but no product engine.

The missing slice is the owned bridge from a selected destination plus bounded
evidence to a topology, route corridor, receding trajectory and truthful
replanning lifecycle.

## Research conclusions

The [2026-09-09 robotics/TAS methods review](../research/eh-nav-robotics-tas-methods-review-2026-09-09.md)
compares this hierarchy with Nav2, predictive control, real-time design and
Minecraft TAS instrumentation. It proposes explicit motion-model calibration,
coverage/stopping envelopes, separate semantic/prediction/commit horizons,
bounded local repair and ablation tests for NAV3–NAV6. These are design-review
inputs, not adopted runtime changes or acceptance claims. Existing gate order,
the NAV1-O pause, NAV-EQ requirements and non-shipping exclusions are unchanged.

### Non-shipping Baritone behavioral baseline

Only public behavior and documentation are admitted as research inputs.
Baritone's public goal model separates goal satisfaction from route execution;
its published feature description identifies segmented calculation, next-path
precalculation, bounded behavior at render/knowledge limits, traversal costs,
hazard avoidance and explicit stop/cancel behavior. These are benchmark
questions CasimirBot must answer independently:

1. Can a goal be expressed as a region/predicate rather than one brittle exact
   coordinate?
2. Can useful motion continue while the next bounded segment is planned?
3. Does unknown or unloaded coverage remain explicit rather than become
   invented free space?
4. Are traversal types, hazards and resource-consuming effects separately
   costed and admitted?
5. Can current and prefetched work be invalidated immediately when position,
   terrain, authority or user intent changes?

Sources are the official Baritone project README, public Goal API documentation
and published feature description:

- <https://github.com/cabaletta/baritone>
- <https://baritone.leijurv.com/baritone/api/pathing/goals/Goal.html>
- <https://github.com/cabaletta/baritone/blob/1.19.4/FEATURES.md>

No Baritone source file is an implementation input. The comparison harness sees
the reference as a black box: start state, admitted goal, public status,
observed trajectory and terminal outcome.

### FiveM/GTA cross-environment baseline

The future FiveM profile demonstrates why the shared contract cannot contain
Minecraft blocks or ticks. Cfx.re's public native surface distinguishes:

- a safe coordinate selected from navigation data;
- whether navigation coverage is loaded in a bounded area;
- a ped task following navigation data toward coordinates with a speed,
  timeout, stopping radius and final orientation;
- route result and remaining-distance feedback; and
- traversal policy such as climbovers, ladders, dropping, water and fire
  avoidance.

Those concepts map cleanly to coverage, goal region, topology edges, traversal
classes, costs, route status and local execution. They do not imply that the
Minecraft planner should use a navmesh or that a future FiveM adapter should
use voxel footholds.

Primary Cfx.re references:

- <https://docs.fivem.net/natives/>
- <https://github.com/citizenfx/natives/blob/master/PATHFIND/GetSafeCoordForPed.md>
- <https://github.com/citizenfx/natives/blob/master/PATHFIND/IsNavmeshLoadedInArea.md>
- <https://github.com/citizenfx/natives/blob/master/TASK/TaskFollowNavMeshToCoord.md>
- <https://github.com/citizenfx/natives/blob/master/TASK/GetNavmeshRouteResult.md>
- <https://github.com/citizenfx/natives/blob/master/TASK/GetNavmeshRouteDistanceRemaining.md>
- <https://github.com/citizenfx/natives/blob/master/TASK/SetPedPathCanUseClimbovers.md>

FiveM is research and a schema fixture here. No GTA assets, native calls or
live FiveM adapter enter the Minecraft implementation.

## Neutral contract family

The contract is coordinate-frame-neutral, topology-neutral and
provider-neutral. Environment-specific fields belong under typed adapter
profiles, never in the shared required vocabulary.

### `environment.spatial_snapshot.v1`

One immutable observation contains:

- environment, source, subject, coordinate-frame and producer-epoch identity;
- observation revision, environment time and capture time;
- bounded coverage geometry, completeness, truncation and unknown regions;
- observed surfaces, regions, portals/links and dynamic obstacles;
- hazard/cost annotations with confidence and evidence references; and
- a stable content fingerprint.

The word `portal` in this contract means a topological connection between
regions, not specifically a Minecraft Nether portal.

### `environment.topology_graph.v1`

The adapter compiles a bounded snapshot into opaque nodes and directed edges:

- node identity is stable only within its producer epoch and declared source
  revisions;
- each edge declares a traversal class, entry/exit state, preconditions,
  estimated cost, risk, reversibility and evidence coverage;
- dynamic or uncertain edges carry validity windows and invalidation reasons;
- an unknown boundary is an explicit frontier, never a traversable edge; and
- graph deltas are hash-linked to the snapshot and prior graph revision.

The shared graph does not require grids, blocks, navmesh polygons or road
nodes. Those are adapter representations.

### `environment.navigation_request.v1`

The admitted request fixes:

- selected subject and destination predicate or goal region;
- coordinate frame and tolerance, including optional terminal orientation;
- allowed traversal classes and movement-only effect ceiling;
- cost/risk policy and forbidden regions/effects;
- search, trajectory and evidence budgets;
- temporal-plan epoch, authority epoch and observation floor;
- deadline, stop conditions and interruption policy; and
- whether partial progress to a coverage frontier is permitted.

Runtime Codex or the operator chooses these semantics. The planner cannot
silently change the destination, widen effects or convert missing coverage into
exploration authority.

### `environment.navigation_plan.v1`

A plan contains two distinct layers:

1. a route corridor: the selected topology nodes/edges, alternatives retained
   within budget, accumulated cost/risk and evidence dependencies;
2. a receding trajectory: only the short executable actions and checkpoints
   justified by the current corridor and committed Environment Time horizon.

Every plan binds request hash, snapshot revision, topology revision, start
state, goal predicate, planner version/profile, cost-policy hash and authority
epoch. Checkpoints declare expected coordinate/pose tolerances, environment
clock bounds, evidence required before commit and the next decision watermark.

The route may outlive one trajectory segment. A trajectory may never outlive
the evidence or authority that justified it.

### `environment.navigation_feedback.v1`

The local controller/watchdog emits semantic changes rather than raw tick spam:

- checkpoint reached;
- expected progress below threshold;
- pose or corridor deviation;
- collision or dynamic obstruction;
- topology/terrain changed;
- hazard or cost policy violated;
- coverage exhausted or newly extended;
- destination satisfied or invalidated;
- manual input detected; or
- lease, authority, plan or producer epoch changed.

Each event identifies whether the local executor can hold safely, can continue
within the committed horizon, or requires a new route decision. Changed
strategy remains Codex-owned; emergency hold/release remains local and
deterministic.

## Coordination model

```text
Codex/operator selects goal and policy
  -> Helix admits exact movement-only envelope
  -> adapter compiles revision-bound spatial/topological evidence
  -> planner selects bounded route corridor
  -> trajectory compiler fills a short Environment Time horizon
  -> controller advances at adapter cadence
  -> watchdog checks progress, hazards, manual input and validity
  -> semantic feedback re-enters Helix/Codex
  -> continue, repair route, change goal, hold or release
```

Responsibilities remain separate:

| Layer               | May do                                                                          | Must not do                                         |
| ------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| Codex               | choose goal, trade-offs, exploration policy and semantic repair                 | drive individual ticks or assume unobserved terrain |
| Helix               | bind identity, authority, effects, lifecycle, evidence and terminal eligibility | author a private strategy or model loop             |
| spatial compiler    | normalize bounded sensed geometry and topology                                  | claim facts beyond coverage                         |
| route planner       | choose edges inside the admitted cost/effect policy                             | invent objectives or hidden mutations               |
| trajectory compiler | emit short checkpointed controller actions                                      | enqueue an unbounded macro                          |
| controller          | execute the current trajectory at environment cadence                           | widen the route or effect set                       |
| watchdog            | hold/release and report invalidation quickly                                    | turn a safety reaction into a new strategy          |

## Minecraft profile

### Spatial representation

Minecraft compiles loaded voxel evidence into foothold states rather than
simply marking blocks passable. A state includes feet volume, head/body
clearance, support, pose, fluid state and bounded momentum class. Edges cover
at least:

- level and diagonal walk with corner clearance;
- step up/down;
- one-block jump/ascend;
- bounded descent/fall under a declared risk ceiling;
- swim/wade and climb only when explicitly enabled; and
- door/gate interaction only under a separately declared reversible-interact
  effect, absent from movement-only v1.

Lava, fire, cactus, suffocation, drowning, deep fall, unstable support and
unknown/unloaded cells affect admissibility or cost. Terrain gradients may be
a cost feature, but cannot replace discrete support, clearance, jump, door,
fluid, hazard and dead-end reasoning.

### Planning and execution

- Begin with an owned bounded graph-search implementation behind a pluggable
  search interface. Algorithm choice is subordinate to the contract and
  benchmark; A*, incremental repair or hierarchical search must not leak into
  the public schema.
- Search runs off the game thread under strict time/node/memory budgets.
- The planner may return complete, partial-to-frontier, no-path,
  insufficient-coverage or budget-exhausted, each as a typed outcome.
- The trajectory compiler commits only short movement/checkpoint segments to
  the existing scheduler.
- The next segment may be prepared before the current segment ends, but is
  discarded when its expected start, graph revision or authority no longer
  matches.
- The controller drives view/movement/jump at tick cadence; the watchdog checks
  grounded state, progress, collision, hazard and user input on the next
  available adapter tick.
- Mining, placement, inventory use and combat remain separate effects/actions.
  A later survival planner may compose them only through explicit admission.

### Sensor-driven replanning

Replan the same admitted goal when a block update, chunk/coverage extension,
moving entity, measured deviation, failed movement primitive or stuck window
invalidates the corridor. Re-enter a semantic route-change observation before
executing a materially different corridor. Repeated failure against an
unchanged revision and unchanged approach is rejected as duplicate behavior.

For an admitted `navigate_to` skill operation, a corridor change can be a
qualified **local repair** when the request explicitly permits it and the
destination, traversal classes, hard prohibitions, effect/risk ceilings,
deadline, actor and current authority remain unchanged. Publish the route-change
reason and bound the replacement segment to the parent operation, fresh
topology/observation, predecessor checkpoint, expected start and planner
version. Recheck those inputs before dispatch. Re-entry means the current
principal receives truthful evidence; it is not automatically a remote
approval round trip for every authorized detour. A new traversal class,
mutation capability, group route policy, destination or wider risk requires a
new principal decision and Helix admission. If no qualified repair remains,
hold or release according to the admitted transition and report the blocker.

Policy must distinguish a hard constraint from a preference. “Do not enter
water” excludes water edges at admission and repair; “prefer dry routes” may
price water edges only when water traversal was separately allowed. A route
planner cannot trade away a prohibition for distance or speed. Following a
moving person needs its own qualified target-freshness, allowed-region,
distance, deadline and target-loss policy; reaching a fixed coordinate does
not establish that following profile.

Navigation feedback should make the ongoing operation explainable: operation
and actor identity, active corridor/trajectory revisions, actual checkpoint,
control state, observed obstruction or hazard, applicable policy, performed
effects, evidence freshness and whether local repair or a principal decision
is next. Reconcile these associations with the existing feedback schema rather
than minting a second operation status writer. A retained route/checkpoint
after reconnect is history, not renewed movement authority. NAV-EQ and NAV8
still require their own live executor evidence.

### Game-AI execution hierarchy — procedural first (2026-09-12)

This refinement is `specified`. Established game-AI navigation methods inform
NAV2–NAV6 alongside the robotics research; they do not introduce a second
runtime, new authority or a requirement to use a navmesh in Minecraft.

Use inexpensive qualified procedural movement for ordinary traversal. Reserve
bounded input-sequence simulation for maneuvers whose dynamics or uncertainty
justify it. A capability to search does not require searching every tick.

| Situation | Bounded response | Stage |
| --- | --- | --- |
| Valid ordinary corridor | Qualified path following, arrival and movement primitives | NAV2/3 |
| Small deviation with valid clearance | Local correction within the admitted corridor and dynamics envelope | NAV3/4 |
| Blocked or invalid corridor | Revision-bound route repair under the same goal and policy | NAV5 |
| Difficult or unqualified maneuver | Bounded model-based candidate search, or typed abstention if the model is inapplicable | NAV3 |
| No permitted route or exhausted budget | Distinguish no-path, missing coverage and budget exhaustion; return evidence to reasoning | NAV2/5 |

Choose the response from explicit measured conditions: primitive applicability,
corridor clearance, deviation, prediction error, repeated failure and remaining
deadline. Use bounded hysteresis to avoid oscillation between modes, but never
delay manual takeover, Emergency Stop or revocation. Search failure cannot
fall back to a procedural primitive whose preconditions are unsatisfied.

#### Methods and references

- [Detour path corridors](https://recastnav.com/classdtPathCorridor.html)
  separate a route from locally maintained path-following state. Adapt this
  concept to revision-bound foothold corridors; local repair cannot invent
  unseen geometry or silently widen the admitted route/effect policy.
- [Reynolds' steering behaviors](https://www.red3d.com/cwr/steer/gdc99/)
  distinguish action selection, steering and locomotion. Use qualified path
  following, arrival and avoidance concepts, not arbitrary steering-vector
  blending that could send a Minecraft player off support or into a hazard.
- [Unity navigation links](https://docs.unity.cn/Manual/nav-NavigationSystem.html)
  represent transitions outside ordinary walkable surfaces. Our traversal
  edges must additionally qualify takeoff state, clearance, momentum, landing
  and interruption. A graph link alone is not proof of executable player input.
- [Unreal behavior-tree tasks](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-behavior-tree-node-reference-tasks)
  illustrate procedural task execution. Map applicable concepts to the
  existing finite scheduler and resource arbiter; do not add a competing
  behavior-tree engine, hidden strategy loop or independent dispatcher.

These are documentation-level design references, not imported implementations
or evidence of Minecraft fidelity. Native player controls and actual collision
mechanics remain the verifier. The Baritone exclusion policy is unchanged.

#### NAV6 comparison

Compare procedural-only, always-search and procedural-first hybrid modes on
matched ordinary corridors, narrow turns, difficult jumps and dynamic
obstructions. Use identical evidence, authority, input capabilities and total
compute/deadline limits. Record completion, coordinate error, stalled ticks,
planning latency, search invocations, mode transitions, repeated failures and
release latency. Freeze selection thresholds before held-out trials.

The hybrid must demonstrate useful difficult-maneuver gains without regressing
ordinary-path responsiveness or interruption correctness. Retain failure
evidence; fewer searches alone is not success. NAV1-O's pause, NAV-EQ and
NAV8's live acceptance requirements remain unchanged.

### NAV3 refinement — bounded forward simulation and input search (2026-09-12)

This refinement is `specified`, not implemented or accepted. It adds a
qualified input-conditioned movement model and bounded candidate search to
NAV3, rather than replacing the route planner, scheduler or watchdog. The
NAV1-O pause and NAV-EQ live-executor prerequisite remain unchanged. No live
test or implementation resumes through this documentation edit.

The question changes from “where does current velocity carry the actor?” to
“which permitted short input sequence reaches the selected waypoint?” The
existing short-horizon predictor is a reuse/calibration starting point, not
proof of a complete movement simulator. Follow the
[motion/timing review](../research/eh-nav-minecraft-motion-timing-review-2026-09-09.md)
and [skill-composition review](../research/eh-nav-robotics-skill-composition-review-2026-09-09.md).

#### Bounded model and isolation contract

- Capture immutable, revision-bound starting pose, velocity, input state,
  movement regime, relevant effects and bounded collision/support geometry.
  Bind model, game and adapter versions, native timestep, coverage and expiry.
- The neutral seam describes model applicability, isolated candidate rollout,
  resource budgets, predicted outcomes and uncertainty. Minecraft owns its
  motion, arithmetic, collision and control semantics; no block constants or
  Minecraft-specific input vocabulary become shared required fields.
- Simulate candidates against copied/model state only. Prediction workers
  cannot assert live controls, advance the live world, alter RNG, or obtain
  mutation authority. Do not describe a partial local snapshot as an exact
  clone of the whole client/server simulation.
- Omit rendering only where its removal preserves relevant behavior. Faster
  wall-clock evaluation must not change the modeled native timestep. No
  `/tick` speed change, teleport or rewind counts as normal-speed acceptance.
- Return unsupported regime, insufficient coverage, stale start,
  budget exhaustion or no candidate found distinctly. Unknown geometry is
  never free space, and no candidate found is not an impossibility proof.

#### Search and live integration

1. NAV2 supplies a bounded corridor and waypoint under the existing request.
2. NAV3 first compares a small deterministic set of maneuver/input candidates:
   direction, heading, jump timing and bounded duration. Fix wall-time,
   rollout-count, horizon and memory budgets; keep search off the game thread.
3. Score only within the admitted cost/risk policy. Prefer candidates with
   tested tolerance to initial-state and timing error over brittle exact-state
   successes. Report uncertainty rather than invent a success probability.
4. Compile only a short portion of the selected candidate into the existing
   Environment Time plan. Revalidate start state, geometry, identity and
   authority before commit; discard stale background results.
5. NAV4/5 compare fresh native observations against predictions, record the
   first divergence and invalidate/repair within the existing envelope. Manual
   takeover, expiry and revocation still pre-empt locally; predicted safe
   landing does not permit continued control after authority ends.

Reuse prior candidates only with valid state/geometry/model dependencies.
Position alone cannot establish equivalent future states: velocity, heading,
effects and other modeled state may change the result. Heuristic pruning may
improve search, but optimality or impossibility claims require separately
justified model bounds and complete search conditions.

#### First experiment and advancement criteria

Start with one platform-to-platform jump, varying sub-block starting position,
heading and velocity. Compare the same procedural baseline with bounded
model-based input search under matched evidence, inputs and compute limits.

Required evidence:

- calibration followed by frozen tolerances and held-out starting states;
- prediction error at declared tick horizons, landing error/success, first
  divergence, model applicability and correction/recovery behavior;
- end-to-end planning latency, p50/p95/p99/max compute cost, deadline misses,
  rollout count, stale-candidate rejection and zero unintended live effects;
- normal-speed replay through admitted controls, with predicted state and
  observed outcome kept separate; and
- unchanged interruption/resource-release tests and a trace of failed trials.

Reject promotion if prediction error exceeds the frozen envelope, the search
misses its deadline, changes semantics or adds latency without a demonstrated
benefit on the selected scorecard. Preserve the simple baseline; any fallback
must itself be admitted and valid, otherwise hold/release as specified. NAV6
adds obstacles, perturbations and broader held-out courses only after this
bounded comparison. Simulation success alone never establishes live acceptance.

#### Research basis and explicit deferrals

- The [SMB minimum-A-press TAS authors](https://tasvideos.org/7094S) describe
  reduced vertical-physics and targeted search tools used in a published run:
  an offline, human-assisted precedent, not autonomous live-control proof.
- [Wafel](https://github.com/branpk/wafel) documents SM64 save/restore and
  simulation advancement; this demonstrates an interface pattern, not an
  available Minecraft clone or guaranteed optimal search.
- [Sampling-based robotic MPC](https://arxiv.org/html/2307.09105v2) demonstrates
  parallel simulation with real robot feedback; its compute and dynamics
  results do not transfer automatically to this adapter.
- [Prismarine Physics](https://github.com/PrismarineJS/prismarine-physics)
  documents input-conditioned Minecraft simulation. It is a feasibility
  reference, not an imported dependency or fidelity certificate for our build.

Defer full-world cloning, learned world models, generic simulation engines,
SAT/SMT motion solving and exploit-discovery search. They are not NAV3 exit
requirements. No Baritone code, API or implementation structure enters this
work; the non-shipping black-box policy is unchanged.

## Future FiveM conformance profile

The contract-only fixture maps:

| Neutral concept  | Future FiveM representation                                               |
| ---------------- | ------------------------------------------------------------------------- |
| coordinate frame | GTA world coordinates plus entity/network identity                        |
| coverage         | loaded navmesh/streaming bounds                                           |
| topology node    | navmesh polygon/corridor point or road node                               |
| topology edge    | pedestrian traversal or vehicle-road connection                           |
| traversal class  | walk/run/sprint, climbover, ladder, drop, water, vehicle                  |
| risk/cost policy | fire/water/traffic/cover and actor-specific restrictions                  |
| goal predicate   | coordinate radius plus optional final heading/entity offset               |
| feedback         | task status, route result, remaining distance, deviation/ownership change |

This fixture must prove that the neutral types can express a polygon/corridor
world without `block`, `chunk`, `jump_tick` or Minecraft registry identifiers.
It does not claim GTA navigation correctness.

## Clean-room Baritone comparison

### Firewall

- Keep the reference jar only in an isolated, local, non-shipping evaluation
  profile.
- Do not decompile, translate or consult implementation sources while building
  the owned planner. Public user/API/feature documentation may define observed
  behavior and test taxonomy only.
- The owned planner may not import Baritone packages or reproduce its command,
  API or internal class structure.
- A release test must prove that shipping manifests, installers, lockfiles,
  classpaths and capability catalogs contain no Baritone artifact or runtime
  dependency.
- Benchmark records label the reference name/version/hash and never present its
  output as CasimirBot evidence authority.

### Matched protocol

For every comparison, hold constant:

- Minecraft/Fabric versions, world seed/snapshot and loaded coverage;
- start pose, goal predicate/tolerance and movement-only effect policy;
- game mode, inventory, effects, difficulty, TPS and render/simulation bounds;
- hardware/process priority, warm-up and measurement instrumentation; and
- interruption script and failure injection.

Run both planners on training courses and separately on frozen held-out courses.
Do not tune against held-out results.

### Scorecard

Report distributions and failures, not one showcase:

- goal completion and typed failure disposition;
- first-valid-action latency;
- elapsed environment ticks and wall time;
- path length, vertical movement and normalized route cost;
- planning CPU, memory, expanded nodes for the owned planner, and budget exits;
- number and cause of replans;
- stationary/stuck ticks and recovery time;
- collisions, falls, hazard exposure, damage and forbidden mutations;
- local/manual interruption latency and control-release latency;
- duplicate effects or stale-segment execution;
- evidence bytes/events per travelled block; and
- A0/A1/B outcome and receipt parity.

“Baritone-class or better” may be claimed only for a frozen capability profile
whose preregistered thresholds pass across the held-out suite. Individual wins
must be described only as course-specific.

## Test arenas

The deterministic Minecraft suite should include:

1. flat and diagonal approach with exact stopping tolerance;
2. stairs, one-block step and one-block jump;
3. narrow cave, low ceiling and corner-clearance trap;
4. bounded descent beside a forbidden deep fall;
5. water crossing beside a dry but longer route;
6. lava/fire/hazard margin with a safe detour;
7. dead end requiring backtrack and alternate corridor;
8. dynamic obstruction invalidating a prefetched segment;
9. loaded-coverage boundary, then newly loaded continuation;
10. forced pose deviation/knockback and stuck recovery;
11. user steering/manual input during a committed segment;
12. authority expiry, Emergency Stop and restart/reconnect between plan and
    settlement; and
13. held-out natural caves and surface terrain with no fixture labels exposed
    to the planner.

Each course records tick- and coordinate-based checkpoints, snapshot/topology/
plan hashes, controller state, semantic feedback, effects, postconditions and
final control release. Screenshots may supplement proof but never substitute
for structured evidence.

## Delivery stages

| Stage | Deliverable                                                                          | Exit evidence                                                           |
| ----- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| NAV0  | Seal neutral schemas, authority split, clean-room policy and benchmark protocol      | schema/adversarial fixtures; documentation audit                        |
| NAV1  | Compile existing Minecraft snapshot/frontier evidence into owned foothold topology   | deterministic coverage, clearance, hazard and unknown-boundary fixtures |
| NAV2  | Bounded route planner with typed complete/partial/no-path/budget outcomes            | deterministic course search results and stable plan hashes              |
| NAV3  | Qualified bounded forward model/input search and receding-horizon trajectory compiler | held-out baseline comparison, model-error/timing bounds, continuity and stale discard |
| NAV4  | Controller/watchdog progress, stuck, hazard, deviation and manual-interrupt feedback | tick-budget, stop-latency and zero-late-effect tests                    |
| NAV5  | Sensor-driven route repair and reconnect/recovery                                    | changed-evidence replan, no unchanged retry, no duplicate effect        |
| NAV6  | Full deterministic Minecraft arena suite                                             | frozen scorecard and all stop/fail cases                                |
| NAV7  | Isolated non-shipping Baritone black-box comparison                                  | matched held-out distributions plus shipping exclusion audit            |
| NAV8  | Live A0, authenticated MCP A1 and keyed Helix B Minecraft acceptance                 | exact goal/effect parity, activity/evidence re-entry, revoke and denial |
| NAV9  | FiveM-shaped contract conformance fixture                                            | no Minecraft vocabulary in shared schemas; no live GTA claim            |

NAV1-D offline topology compilation and fixtures may proceed in parallel.
Live executor integration requires live-accepted NAV-EQ execution qualification.
See `docs/work-packets/eh-g8-nav-direct-mcp-execution-qualification-v1.md`.
Full ET6 and room-driven steering retain their separate acceptance requirements.
NAV8 does not authorize mining/building/combat or promote the Nether journey.

## Current prerequisite revision — 2026-09-08

NAV-EQ replaces full ET6 closure as the engineering prerequisite for NAV
live executor integration. Its direct authenticated MCP trial must establish rolling
execution, fresh observation re-entry, local/manual and direct-user
interruption, reconnect, explicit revoke and zero duplicate or stale effects
through the real temporal compiler, broker and executor. It is currently
`specified`; this documentation revision does not unlock NAV1 by itself.

Hosted-room message binding is an additional dependency for room-driven
steering. Existing execution authorization checks remain enforced, even when
the implementation stores them in a room context. Full ET6/CS1–CS5 criteria and
NAV8's full A0/A1/B exits remain unchanged. The dated NAV0 record below retains
the former ET6-only policy as history; this section governs current sequencing.

## Personal-product alignment and NAV1-D — 2026-09-08

This revision supersedes earlier blanket NAV implementation holds only for
the explicitly offline NAV1-D scope. The [developer-platform product contract](../architecture/casimirbot-developer-platform-product-contract-v1.md)
and [CFP-2.ONBOARD](eh-g8-cfp2-external-client-onboarding-v1.md) own the free
personal tool journey. Navigation consumes their supported connection,
identity, consent and recovery mechanisms. This task does not implement a
parallel account system, direct-context service, SDK, billing flow or room
onboarding workaround. CFP admission and release gates remain unchanged;
neither the selected free offer nor local Minecraft tests close CFP-1 or G8.

The next navigation-owned goal is **NAV1-D: deterministic Minecraft spatial
evidence-to-topology qualification**. It is independent of an open execution
prerequisite because it has no tool dispatch, native control or live authority
mutation. It reuses the NAV0 neutral contracts and existing Minecraft sensor
vocabulary; Minecraft geometry stays in the adapter, not shared required types.

Scope and order:

1. Inventory the exact sensor snapshot/frontier schemas and existing collision,
   support and traversal facts. Identify gaps explicitly rather than inventing
   passability from block names or treating omitted cells as air.
2. Freeze small deterministic input fixtures and independently specified
   expected nodes, edges, rejected transitions and unknown frontiers: flat
   floor; diagonal corner obstruction; one-block ascent with and without
   headroom; narrow/low cave; unsupported or unsafe descent; hazard detour;
   truncated/unloaded coverage; changed observation or producer identity.
3. Implement a pure, bounded, original topology compiler with no dispatch or
   executor import. Preserve snapshot hash/revision, frame, epoch and evidence
   lineage. Conservative unsupported geometry remains unknown or rejected.
4. Test exact topology, deterministic output hashes, input ordering invariance,
   resource bounds, and stale/cross-identity rejection. Keep the existing
   non-voxel conformance fixture green. Do not claim a route-search engine from
   topology tests; route planning remains NAV2.
5. Where available, compare against consented read-only Minecraft captures or
   controlled native fixtures. Record synthetic, replayed and live evidence
   separately. Arena construction/reset needs separately scoped setup
   authority; an already-open game does not prove reproducibility.

Exit: bounded topology compiler and frozen deterministic tests, with exact
unsupported geometry documented. No fluent movement, ordinary-user installed
acceptance, NAV-EQ, NAV8, Nether or second-environment runtime claim.

Personal onboarding/access remains product-owned. NAV-EQ consumes its actual
execution readiness and measures rolling handoff, interruption and recovery;
hosted subscription or collaboration acceptance is not a prerequisite for
the free personal navigation path. Product catalog-count failures remain
tracked by their owning packet, not silently reclassified as NAV failures.

## NAV1-D deterministic acceptance — 2026-09-08

Current NAV1-D evidence is recorded separately in
`docs/work-packets/eh-g8-nav1d-offline-minecraft-topology-v1.md` and
`docs/evidence/eh-g8-environment-spatial-navigation-v1/2026-09-08-nav1d-offline-topology-acceptance.json`.
That offline full-cube profile passed 37 new deterministic cases, 15 NAV0
regressions and 9 existing native component tests. It introduces no live
sensor wiring or executor integration. The NAV0 record below is historical;
its blanket hold has been narrowly superseded by the NAV1-D revision above.

## NAV1-M native measurement/replay — 2026-09-08

The next bounded mapping slice is deterministically verified in
`docs/work-packets/eh-g8-nav1m-native-collision-replay-v1.md`. Real Minecraft
block-state and voxel-shape tests produced a replay consumed by the neutral
topology bridge: 64 TypeScript tests and 16 native tests passed. This is an
unregistered helper and offline replay, not selected-player world capture or
full NAV1 acceptance. Next is authoritative-thread bounded capture wiring,
under exact observation identity and coverage/clock checks. No game deployment
or movement occurred; NAV-EQ still gates live executor integration.

## NAV1-C bounded capture — 2026-09-08

The follow-on observation integration at
[NAV1-O](eh-g8-nav1o-admitted-collision-observation-v1.md) is deterministically
verified as of 2026-09-13. Its requirement audit and evidence preserve the
unavailable matching-runtime live-test boundary. It has not advanced live
maturity or unlocked movement; full NAV1 and NAV-EQ remain open. Earlier dated
pause references in this plan are historical, not the current NAV1-O status.

The unregistered capture primitive and deterministic boundary fixtures are
recorded in `docs/work-packets/eh-g8-nav1c-bounded-native-capture-v1.md`.
Sixty-five TypeScript and thirty native tests passed. The ServerLevel/player
entry compiles; the tests inject thread/player/tick/clock state and do not
prove live selected-player capture or the 20 ms elapsed budget in a running
world. Next is admitted observation-path integration and read-only capture
qualification. Full NAV1 and NAV-EQ remain open; no movement was dispatched.

## NAV0 deterministic acceptance — 2026-09-03

NAV0 is deterministically verified. The shared module
`shared/helix-environment-navigation.ts` seals six strict, hash-bound contracts:

- `environment.spatial_snapshot.v1`;
- `environment.topology_graph.v1`;
- `environment.navigation_request.v1`;
- `environment.navigation_plan.v1`;
- `environment.navigation_feedback.v1`; and
- `environment.navigation_benchmark_protocol.v1`.

The validators bind coordinate frame, producer/authority/observation identity,
snapshot and topology revisions, request and cost policy, route continuity,
movement-only effects, traversal/risk ceilings, checkpoints, committed horizon,
destination satisfaction, partial-frontier admission and deadlines. Feedback
cannot change strategy; manual input and authority/producer changes must hold
or release controls. The benchmark contract fixes disjoint training/held-out
courses, all required measurements, no held-out tuning, black-box isolation and
shipping exclusion.

Fifteen focused adversarial tests pass. Combined with the existing Environment
Time suite, 38 tests pass. The fixtures include a non-voxel,
navmesh-shaped adapter profile, proving the shared contract does not require
Minecraft blocks or ticks. The full repository typecheck reached Node's
approximately 4 GB heap limit before emitting a diagnostic; the targeted check
reported only current diagnostics in the imported Environment Time module and
none in the NAV0 module. Those tooling results are recorded without being
misrepresented as typecheck success.

Immutable evidence:
`docs/evidence/eh-g8-environment-spatial-navigation-v1/2026-09-03-nav0-deterministic-acceptance.json`.

**Stop after NAV0.** NAV1 is not authorized to start until ET6 passes. No route
search, Minecraft executor, FiveM runtime, Baritone product dependency or
movement authority was introduced by NAV0.

## Stop/fail criteria

Stop the affected stage and retain its lower maturity when:

- live executor integration is attempted before NAV-EQ establishes capacity;
- shared schemas require Minecraft blocks/ticks or FiveM navmesh/ped types;
- the planner executes through unknown coverage without explicit frontier
  permission;
- movement-only navigation mutates blocks, inventory or combat state;
- a route or prefetched segment survives invalid authority, producer epoch,
  graph revision or expected start state;
- local or manual interruption exceeds the frozen budget or leaves controls
  held;
- an identical failed action repeats without new evidence or changed approach;
- comparison conditions differ materially between engines;
- any shipping artifact or runtime capability depends on Baritone; or
- a benchmark result is promoted beyond its exact version, profile and course
  distribution.

## Documentation placement and dependency order

The canonical roadmap is
`docs/helix-environment-harness-work-program-v1.md`. This packet sits directly
after Environment Time because ET provides its execution and interruption
substrate. The Minecraft adapter links this packet as the owned successor to
the evaluation-only comparison engine. Companion C4/S6 and the unknown-world
Nether objective consume only a live-accepted Minecraft navigation profile;
they do not absorb planner authority or bypass their own effect gates.

```text
NAV0 contracts (deterministically verified)
  -> NAV1-D offline Minecraft evidence/topology fixtures (parallel)
  + product-owned personal MCP readiness -> NAV-EQ live execution qualification
  -> remaining NAV1–NAV6 owned neutral/Minecraft navigation and integration
  -> NAV7 isolated black-box comparison
  -> NAV8 Minecraft A0/A1/B acceptance
  -> companion C4/S6 and unknown-world Nether compositions
  -> NAV9/ET7 second-environment conformance
```
