Program gate: G8 — environment-harness release evaluation; supporting N0 work for the reserved post-G7 Minecraft integration objective
Workstream: Minecraft Player Embodiment perception fidelity and operator-visible Codex steering
Capability or component: Authenticated external-Codex situation probes, one bounded same-revision perception snapshot, semantic change delivery, and perception benchmark
Lifecycle stage: observation normalization → northbound delivery → evidence re-entry → short semantic replanning
Reaction timescale: one Minecraft tick for local safety; on-demand bounded snapshot for tactical decisions; event-driven semantic wake for decision-relevant changes
Authority owner: Fabric owns game-thread facts and local control release; Helix owns identity, admission, provenance, coverage and delivery; Runtime Codex owns interpretation and strategy; the operator owns consent and Emergency Stop
Current maturity: specified
Target maturity: live accepted
Required evidence: strict typed contracts; authenticated MCP exposure for actor, inventory, nearby entities, hazards, local map, spatial region, line of sight and reachability; same-revision snapshot tests; explicit unknown and coverage behavior; semantic-monitor and ordered-trace tests; human/screenshot-labelled benchmark fixtures; measured latency and critical-hazard recall; and one authenticated keepInventory-off Survival sense-decide-act-observe course without screenshot dependence or redundant unchanged retries
Explicit non-goals: no full Nether journey, portal construction, commands, Creative mode, teleportation, World Authority substitution, raw screenshot dependency, raw 20 Hz MCP stream, unbounded or externally owned production planner, private model loop, unrestricted pathing mutation, credential exposure, or claim that straight-line distance proves navigability
Downstream gate unlocked: an evidence-backed GO decision for a fresh legitimate Nether journey from the preserved Survival world

# EH-MC-NETHER1 perception parity v1

## Why this packet exists

The first legitimate Nether attempt showed a large fluency gap. The harness
could act and could obtain screenshots, but external Runtime Codex repeatedly
requested narrow status observations and sometimes retried unchanged actions.
A human player would continuously combine inventory, crosshair focus, nearby
entities, terrain shape, drops, fluids, UI state and recent motion before
choosing the next input. The connector already implements many of those typed
reads, but the authenticated external MCP surface currently exposes only the
actor-status read directly.

`keepInventory` prevented this awareness gap from becoming a costly inventory
loss. The next course therefore treats `keepInventory=false` as a safety and
fidelity acceptance condition, not as permission to accept death. The full
Nether objective remains out of scope until this packet passes.

This packet is allowed during G8 as N0 capability-readiness work. It extends
the existing observation lifecycle and profile-scoped monitor; it does not
alter installed-profile credential authority or create another agent runtime.

## Baseline blind spots

| Decision question | Current evidence | Gap that blocks fluent play |
| --- | --- | --- |
| What state am I in? | Actor status includes health, food, pose, game mode and a short looked-at-block raycast. | It is not coherently revision-bound to the other tactical facts. |
| What do I possess? | A typed inventory probe already exists behind the environment gateway. | External Codex has no direct authenticated MCP affordance for it. |
| What is near me? | Nearby-entity and hazard probes exist. | Entity direction, relative motion, occlusion and hazard direction are missing. |
| Where can I safely step? | Local-map and bounded spatial-region probes exist. | The tactical snapshot reduces locomotion to four same-height adjacent cells. It does not represent a one-block jump/ascend, diagonal clearance, bounded descent, a multi-step traversable corridor or an alternate route around a blocked neighbor. A false four-way dead end must not be promoted to path authority. |
| Can I see or reach the target? | Exact line-of-sight and distance-based reachability probes exist. | External Codex cannot call them directly, and Euclidean reachability must not be described as a path. |
| Is a screen consuming input? | The Fabric sensor frame tracks the current screen and manual focus/input state. | Those facts are not yet included in the tactical MCP observation. |
| Did anything meaningful change? | A profile-scoped semantic monitor and ordered evidence lifecycle exist. | The monitor does not yet project the new coherent tactical deltas and coverage transitions. |

## Delivery order

### P0 — expose existing typed reads

Expose the seven currently hidden situation probes through the same
authenticated room, selected-subject, connector, provenance and least-scope
gateway used by actor status:

1. inventory;
2. nearby entities;
3. hazards;
4. local map;
5. spatial region;
6. line of sight; and
7. reachability.

Inputs remain strict and bounded. Results remain observations with no answer or
terminal authority. Tool descriptions must distinguish exact raycast facts,
bounded map coverage and straight-line reach from path navigability.

### P1 — bounded same-revision perception snapshot

Add one tactical snapshot captured from one immutable sensor revision. It must
include:

- observation revision, game tick, dimension and observation time;
- actor pose, velocity, health/food/air, grounded/collision state and current
  screen/manual-input/focus state;
- crosshair target, hit face, distance and occlusion result;
- bounded directional terrain around and ahead of the actor, including support,
  head clearance, climb, drop depth, fluid/fire/lava and loaded-region limits;
- relevant entities with bearing, relative elevation, bounded relative motion,
  targeting, line-of-sight/occlusion and freshness;
- dropped-item direction and distance;
- exact requested inventory summary where needed for the pending decision;
- the effective `keepInventory` world rule, observed in-band from the same
  server revision rather than inferred from setup notes;
- coverage radius, omitted categories, unloaded/unknown cells and truncation;
  and
- a stable semantic fingerprint for deduplication.

The snapshot is evidence, not a plan. It may report candidate affordances, but
must not choose the user's strategy or assert that an unobserved route is safe.

### P1A — bounded 3D navigation frontier and pathfinder evidence

Add a navigation-frontier observation between the coherent snapshot and action
selection. It must traverse every distinct, fully observed foothold inside the
bounded local volume once under an explicit movement model rather than attempt
to enumerate every simple path, which is cyclic and exponential. The movement
model must distinguish at least level walk, diagonal walk with corner
clearance, one-block jump/ascend and bounded descent. Each admitted foothold
requires feet/head clearance, solid nonhazardous support, hazard/fluid margins
and complete loaded evidence.

Return the best known route to each retained frontier endpoint, its movement
primitives and cost, displacement from the actor, vertical gain, coverage
boundary status and risk flags. Return a bounded ranked set including the
farthest safely reachable endpoint; do not make that endpoint the harness's
strategy. Runtime Codex may select it as an explicit exploration policy when
the goal is to escape or reveal more of a cave.

Expose the installed Baritone planner as typed evidence rather than only as a
mutating `navigate_to` executor. Planning evidence must identify the goal,
movement restrictions, calculation state, partial/complete/no-path status,
estimated cost, retained path primitives, reason for recalculation and whether
the path crosses unknown coverage. Execution remains separately admitted and
movement-only by default (`allow_dig=false`, `allow_place=false`). Block update,
chunk load, path obstruction, measured deviation or stuck state may trigger a
bounded replan against the same waypoint; a semantic route change must be
re-entered before an alternate physical action.

The local frontier and Baritone plan are complementary. The frontier gives
Runtime Codex human-like nearby peripheral traversability and candidate goals;
Baritone supplies goal-directed A* execution and rerouting. Neither may assert
that all paths were searched outside the declared loaded volume.

Baritone is a reference implementation and temporary A/B oracle for this work,
not the target architecture, copied implementation or required production
dependency. CasimirBot must own the frontier graph, movement primitives, cost
and risk model, planner observation contract, reroute lifecycle, cancellation,
postconditions and native executor. Public Baritone behavior may inform test
cases and parity measurements, but no Baritone source is to be copied or
translated into the CasimirBot implementation. Acceptance must pass with the
CasimirBot-native planner/executor path when Baritone is absent; an optional
Baritone adapter may remain only as a separately labelled interoperability and
comparison lane.

### P2 — change delivery and anti-repetition contract

Project decision-relevant snapshot changes into the existing profile-scoped
semantic monitor and operator-visible ordered trace. Emit on new critical
hazard, lost coverage, UI capture, target/focus change, material inventory
change, path deviation, action failure or verified postcondition. Do not emit
unchanged raw ticks.

Runtime Codex must not repeat an identical physical action against the same
snapshot revision and the same failure evidence. A retry requires at least one
of: a newer relevant revision, a different approach/target/parameter, a typed
transient disposition, or an explicit operator instruction. Unknown or stale
coverage blocks any `safe` conclusion.

### P3 — perception benchmark

Build deterministic scenes and one human-labelled screenshot/reference record
for each critical class:

- safe level step versus one-, two- and deep-drop edge;
- lava, fire and water adjacency;
- hostile ahead, behind, occluded and approaching;
- dropped item with and without a safe approach;
- visible/reachable block, occluded block and distance-only false positive;
- inventory/tool availability and material change;
- open inventory/container/pause screen consuming input; and
- loaded boundary or deliberately incomplete coverage.

The screenshot is ground truth for the benchmark and operator proof. It is not
an input required by the tested Codex decision path.

### P4 — controlled Survival acceptance

Run an authenticated A1 sense-decide-act-observe micro-course in Survival with
`keepInventory=false`. The course uses reversible low-value inventory and
contains target acquisition, safe locomotion, one obstacle, one drop/fluid
hazard, one entity change, one inventory postcondition and one UI-capture
condition. The course must end with controls released and world state preserved.
Do not continue into portal construction or the Nether journey.

## Frozen acceptance thresholds

1. All eight situation reads are discoverable through authenticated MCP and
   reject unknown fields, unauthorized rooms and unavailable subjects.
2. Every snapshot field is derived from one declared observation revision, or
   is explicitly labelled with a different revision and freshness; silent
   mixed-revision snapshots fail.
3. Critical-hazard recall is 100% across the finite labelled benchmark for
   deep drop, lava/fire contact risk and admitted hostile threat. Any false
   `safe` result under missing/unloaded coverage fails.
4. Local tick-frame capture preserves the existing p95 budget of 4 ms. The
   bounded snapshot reports its measured construction time; A1
   dispatch-to-observation p95 must be at most 2 seconds in the controlled
   local course.
5. No identical mutating request is issued twice against the same semantic
   fingerprint and unchanged failure evidence.
6. The tested decision path uses typed observations only. Screenshots may be
   captured afterward for proof and benchmark comparison but are not supplied
   to Runtime Codex before its decision.
7. Monitor delivery is ordered, deduplicated and provenance-linked. Critical
   semantic changes appear in the operator-visible trace before the next
   strategy-changing action.
8. `keepInventory=false` is verified before the live course. Death, material
   inventory loss, unreleased controls, Emergency Stop failure, unsupported
   command use or World Authority effects fail acceptance.
9. Unsupported facts remain explicit `unknown`, `unobserved`, `unloaded`,
   `occluded`, `stale` or `not_path_verified`; absence is never promoted to a
   safe observation.

## Verification plan

```bash
npx vitest run server/mcp/__tests__/helix-mcp-minecraft-action.test.ts --pool=forks
npx vitest run shared/__tests__/helix-minecraft-perception-benchmark.spec.ts --pool=forks
npx vitest run server/mcp/__tests__/helix-mcp-environment-monitor.test.ts --pool=forks
npx vitest run server/services/environment-connectors/monitoring/__tests__/environment-monitor-store.test.ts --pool=forks
npm run helix:ask:discipline:full
npm run helix:environment-harness:docs-audit
npm run casimir:verify -- --ci --url http://127.0.0.1:1522 --trace-out artifacts/training-trace.jsonl
```

## Interim implementation evidence — 2026-08-25

- Full Fabric sensor test suite: PASS. The exact remapped client/server jar is
  SHA-256 `1A81FA67923DC4D095F195802A908E98903B5DECB6FFA3A036C845B4C79DE0DC`.
- Focused TypeScript perception, catalog, adapter-manifest and monitor battery:
  38 tests PASS.
- Full Helix Ask discipline gate: PASS, including all adversarial prompt and API
  parity shards, 26 live-source continuation tests and the identity audit.
- Environment-harness documentation audit: PASS for active gate G8.
- Casimir adapter verification: PASS; no first failure; certificate integrity
  OK; certificate hash
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
- The rebuilt Fabric manifest is admitted on the keyed installed node. The
  already-open Codex task retained its pre-change MCP catalog after both server
  reconnect and a subsequent task turn, even though the live subject projection
  advertised `com.casimirbot.minecraft.perception_snapshot.read`. The current
  Codex client therefore cannot discover `helix_minecraft_situation_probe`
  without a full client-session reconnect. A bounded compatibility projection
  now attaches an independently typed
  `com.casimirbot.minecraft.perception_snapshot.read` observation to the
  already-loaded `helix_minecraft_actor_status` result. The legacy actor result
  retains its own outcome, the nested snapshot retains its own outcome, and the
  response explicitly reports
  `mode=actor_status_catalog_compatibility_v1` and
  `catalog_refresh_required=true`; snapshot failure is never promoted to actor
  success or hidden. The focused MCP boundary test passes (2 tests), and a live
  call from the unrestarted Codex task received the new envelope with the exact
  typed `result_stale` snapshot failure after the keyed server restart.
- This compatibility projection lets an active authenticated task recover
  tactical evidence without restarting unrelated Codex work. It does not make
  the catalog coherent or satisfy acceptance threshold 1. G8 still requires
  profile-managed MCP reconnect/catalog resynchronization so ordinary users do
  not diagnose or compensate for this boundary manually. The compatibility
  path must not be counted as dedicated-tool discovery in P3 or P4.
- The same live run launched the pinned Fabric 1.21.8 profile without restarting
  Codex. Minecraft then reported `Account authentication failed`, and the
  selected dedicated server rejected the join with `Invalid session`. No player
  entered the world, no action authority was configured, and no gameplay action
  occurred. This is a Microsoft/Minecraft client-session blocker distinct from
  the healthy keyed Helix endpoints and the MCP compatibility proof. P3 and P4
  remain unrun until the user restores the launcher account session; no
  authentication dialog will be automated.

The full discipline guard is required because live-source identity and
continuation delivery changed. The capability remains `specified`; no maturity
row may advance to `live accepted` until the screenshot-labelled P3 record and
authenticated P4 trace pass.

## Restricted-lease and live-course evidence — 2026-08-25

- The action broker now admits a trusted connector manifest against the exact
  intersection of its adapter-registered capabilities and the owner's finite
  Player Embodiment lease. A connector may therefore declare its complete
  reviewed manifest without forcing a restricted owner lease to grant every
  declared capability. An empty intersection, an untrusted capability or an
  adapter-contract mismatch still fails closed. Seven focused manifest/lease
  tests pass, including subset admission and both rejection cases.
- The live restricted authority admitted a connector manifest declaring 18
  reviewed capabilities while exposing only the 12 ordinary capabilities in
  the owner lease. Readiness reported `ready_for_actions=true`, a fresh active
  heartbeat, both `baritone` and `native_fabric`, no asserted controls and no
  Emergency Stop latch. World Authority remained revoked.
- With `keepInventory=false` observed in-band, Runtime Codex used a typed
  perception snapshot before action and issued one bounded 250 ms non-sprint
  forward walk. The connector completed five ticks, moved the actor 0.832
  blocks and released controls. A fresh typed snapshot then marked all four
  immediate movement candidates unsafe, so the course stopped without an
  identical retry or a screenshot-informed decision.
- The afterward-only proof screenshot
  `2026-08-25_21.09.22.png` showed a large adjacent lava flow that the original
  radius-4 snapshot had not included. This was a bounded-coverage miss, not a
  false parser result: the closest lava in the radius-7 typed snapshot was 6.29
  blocks away. The MCP compatibility snapshot now requests horizontal radius 7
  and vertical radius 8.
- Ten consecutive authenticated radius-7 snapshots detected the labelled lava
  with 27 hazard cells on every sample. Every sample reported complete loaded
  coverage and zero unknown cells. Capture durations were 1.12–2.61 ms; the
  nearest-rank p95 was 2.61 ms, below the frozen 4 ms local capture threshold.
  This is evidence for this live scene only and is not a substitute for the
  complete finite P3 benchmark.
- The keyed server restart recovered the sensing connector and finite action
  lease without another user authorization. The active source was online and
  fresh, and the action connector returned to `ready` with the restricted
  manifest admitted. The legacy device-health projection still reported
  `credential_missing` while authenticated probes succeeded; that contradictory
  compatibility projection remains a release-readiness defect.
- The already-open Codex task still discovers only the legacy actor-status MCP
  tool. Its compatibility envelope can carry the independently typed snapshot,
  but it remains explicitly catalog-incoherent and does not satisfy threshold
  1. A natural Helix Ask attempt to exercise the dedicated situation-probe tool
  was rejected under `memory_hard_pressure` before tool execution. Profile-led
  MCP catalog resynchronization and low-memory Ask behavior remain required
  release work.
- The opaque launcher successfully starts the exact keyed Desktop checkout, but
  its later workspace-process verification can reject the same listener PID it
  launched. Fixing that launch-session identity check remains required before
  this can be presented as a durable profile-owned harness workflow.
- The post-course verification battery passed: 9 focused MCP/manifest tests,
  11 perception-benchmark/monitor tests, the G8 environment-harness
  documentation audit and the Helix Ask discipline quick check. A fresh
  server-backed Casimir verification also returned `PASS`, certificate
  integrity `OK`, and certificate hash
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
- A direct first-divergence test disproved the four-neighbor dead-end
  conclusion. From actor position `(-24.5, 12, 3.05)`, every snapshot movement
  candidate was `safe_candidate=false` because the forward cell contained the
  gravel block rather than representing its clear upper foothold. Runtime
  Codex admitted one movement-only Baritone goal at `(-24.5, 13, 3.5)` with a
  0.75-block arrival radius, no sprint, no digging and no placement. Baritone
  1.15.0 reached the goal in seven ticks at measured distance 0.734 blocks,
  performed no world or inventory mutation, safely cancelled, released
  controls and left the actor at `(-24.5, 13, 3.05)`. The game
  locomotion/pathfinder path is therefore capable; the first divergence is the
  tactical perception and goal-selection contract.
- The direct result matches the public Baritone design: goal-conditioned A*
  supports ordinary ascent/descent and segmented recalculation, while movement
  permissions and hazard costs constrain traversal. The current Helix facade
  already owns a `GoalNear` process and movement-only restrictions, but it does
  not expose planning-only path points, movement primitives, recalculation
  reasons or frontier-goal discovery to Runtime Codex. Those are the game/mod
  capabilities currently left unused.
- The first CasimirBot-native planner increment is implemented in the shared
  Minecraft connector core rather than in Baritone or a sensor-only fork. Its
  bounded Dijkstra search visits distinct typed footholds, supports level walk,
  corner-checked diagonal, one-block ascend and one-block descend, rejects
  hazard/fluid margins and unknown cells, ranks retained frontier routes and
  recomputes after a changed voxel observation. Nine deterministic traversal
  fixtures pass, including the exact blocked-forward/clear-upper-foothold
  divergence, exact-goal planning, unknown-evidence fail-closed behavior and an
  alternate-corridor reroute. The ninth fixture proves that one bounded
  analysis reads each required voxel at most once.
- The Fabric same-revision snapshot now projects the native frontier with
  explicit radius, reachable count, evidence completeness, coverage-boundary
  and route-step-limit flags, ranked route steps/costs and
  `selection_authority=runtime_codex`. The connector catalog and legacy
  normalization boundary accept that typed field; 23 focused TypeScript tests
  and the complete 63-test Fabric sensor suite pass.
- The CasimirBot-native player executor now consumes exact bounded goal plans
  from the same shared core. It follows typed foothold steps, releases controls
  before every plan, keeps digging and placement disabled, revalidates the next
  foothold against current loaded evidence, and performs at most four reroutes
  for route deviation, changed geometry, route exhaustion or bounded
  non-progress. It emits planner identity, status, evidence completeness,
  reachable count, step kind/target and reroute reason/count as action evidence.
  Arrival refinement inside the admitted goal block is handled without asking
  the graph for a nonexistent zero-step route. The complete 151-test Fabric
  player-agent suite passes.
- Clean Java 21 remapped candidate builds produced
  `HelixFabricSensor-0.3.0.jar`, 256,324 bytes, SHA-256
  `50032a91adb0c8f5f777c601c2994ae209a983fc9e7d590faa72e092a00812ac`,
  and `HelixFabricPlayerAgent-0.4.0.jar`, 396,027 bytes, SHA-256
  `5f558ed4e93cdcdb6ecb82ff1e30a36e2ae52b4263008bc2a8b0acd00687853b`.
  The exact sensor jar is installed on the dedicated server and client, and the
  exact player-agent jar is installed on the client. Pre-install copies remain
  beside each target as disabled recovery artifacts. These are live acceptance
  candidates, not release artifacts.
- The first live snapshot after installation exposed a 32.18 ms capture
  regression. The planner was reading the same collision/hazard voxels many
  times while evaluating neighboring footholds. A same-analysis immutable cell
  cache now preserves fail-closed semantics while reading each required voxel
  once. After one cold/JIT capture, a 12-snapshot warmed live sample completed
  12/12 successfully from 1.50 to 3.35 ms with p95 3.35 ms, below the frozen
  4 ms local capture threshold. Each sample retained 50 reachable footholds and
  complete evidence at the original cave position.
- Runtime Codex selected the typed first ascent foothold without using a
  screenshot. One authenticated `native_fabric` movement-only action reached
  `(-24.43, 13, 3.05)` in eight measured client ticks. The receipt reported one
  typed route step, `route_found`, complete planner evidence, zero reroutes,
  zero world/inventory mutations and released controls. A second action then
  followed a six-step native route to `(-30.09, 14, 3.50)` in 35 measured
  ticks, again with no sprint, digging, placement, mutation or Baritone use;
  its required position postcondition passed and controls were released. The
  post-action snapshot retained complete frontier evidence, 45 reachable
  footholds, `keepInventory=false`, unchanged health and a 1.51 ms capture.
  Minecraft saved the post-action operator-proof screenshot at
  `C:\Users\dan\AppData\Roaming\.minecraft\screenshots\2026-08-25_22.45.02.png`.

This is partial P4 evidence only. Target acquisition, obstacle handling, an
entity change, an inventory postcondition and a UI-capture condition have not
yet passed in one controlled authenticated course. P3 is also incomplete. The
GO decision for a fresh Nether journey therefore remains closed.
