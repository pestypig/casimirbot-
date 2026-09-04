Program gate: G8 — environment-harness release evaluation
Workstream: Provider-neutral spatial navigation with Minecraft as the first capacity reference
Capability or component: ENV-NAV1 — bounded spatial/topological evidence, goal-directed route planning, receding-horizon trajectory execution and sensor-driven replanning
Lifecycle stage: evidence normalization → intent arbitration → tool admission → execution → evidence re-entry → follow-up reasoning
Reaction timescale: adapter cadence for local control and safety; short checkpoint horizons for route execution; semantic-event cadence for Codex replanning; durable milestones for longer objectives
Authority owner: Runtime Codex selects the destination, policy and strategy; Helix owns identity, admission, effect bounds, provenance and terminal eligibility; the adapter owns evidence compilation; the admitted local planner/controller may choose only a route and trajectory inside the fixed destination, traversal, cost and safety envelope; the environment arbiter owns physical execution and release
Current maturity: deterministically verified for NAV0; NAV1–NAV9 remain specified and depend on the open ET6 Minecraft capacity qualification
Target maturity: deterministically verified provider-neutral contracts and Minecraft planner/controller, followed by live-accepted Minecraft A0/A1/B evidence and a non-shipping Baritone black-box comparison; FiveM remains a contract-only second-environment fixture in this packet
Required evidence: strict schemas and adversarial fixtures; revision-bound coverage and topology; bounded search and trajectory budgets; checkpoint-linked temporal plans; obstacle, hazard, deviation and coverage-boundary replanning; local and user interruption latency; no duplicate effects; deterministic Minecraft courses; held-out black-box benchmark results; shipping-profile dependency exclusion; A0 direct, A1 authenticated MCP and B keyed Helix acceptance; and one non-Minecraft conformance fixture
Explicit non-goals: no Baritone redistribution, shipping dependency, source translation, copied API or implementation structure; no FiveM/GTA runtime implementation in this packet; no unbounded world dump or generic physics engine; no planner-authored objective; no mining, building, combat, inventory mutation, teleportation or World Authority hidden inside movement-only navigation; no claim that reachability, distance, one local frontier or one benchmark course proves general navigation
Downstream gate unlocked: after ET6 passes, Minecraft-native movement qualification for companion C4/S6 gather-and-craft, unknown-world Nether progression and later second-adapter navigation; no public companion mining or full Nether acceptance is authorized by this packet alone

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
acceptance boundaries. Runtime implementation begins only after ET6 establishes
the Minecraft scheduler/controller/watchdog capacity envelope. That order
prevents a new planner from hiding existing latency, stall or duplication
problems.

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
| NAV3  | Receding-horizon trajectory compiler into Environment Time/scheduler checkpoints     | no unbounded queue; current/next segment continuity and stale discard   |
| NAV4  | Controller/watchdog progress, stuck, hazard, deviation and manual-interrupt feedback | tick-budget, stop-latency and zero-late-effect tests                    |
| NAV5  | Sensor-driven route repair and reconnect/recovery                                    | changed-evidence replan, no unchanged retry, no duplicate effect        |
| NAV6  | Full deterministic Minecraft arena suite                                             | frozen scorecard and all stop/fail cases                                |
| NAV7  | Isolated non-shipping Baritone black-box comparison                                  | matched held-out distributions plus shipping exclusion audit            |
| NAV8  | Live A0, authenticated MCP A1 and keyed Helix B Minecraft acceptance                 | exact goal/effect parity, activity/evidence re-entry, revoke and denial |
| NAV9  | FiveM-shaped contract conformance fixture                                            | no Minecraft vocabulary in shared schemas; no live GTA claim            |

NAV1 implementation cannot begin until ET6 has passed. NAV0 may proceed now.
NAV8 does not authorize mining/building/combat or promote the Nether journey.

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

- ET6 has not established the executor/watchdog capacity needed by NAV1–NAV5;
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
ET6 Minecraft capacity qualification
  -> NAV0–NAV6 owned neutral/Minecraft navigation
  -> NAV7 isolated black-box comparison
  -> NAV8 Minecraft A0/A1/B acceptance
  -> companion C4/S6 and unknown-world Nether compositions
  -> NAV9/ET7 second-environment conformance
```
