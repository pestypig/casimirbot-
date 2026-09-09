Program gate: G8 — environment-harness release evaluation
Workstream: NAV1-D offline spatial evidence qualification
Capability or component: Pure bounded Minecraft collision-fact snapshot and neutral topology compilation
Lifecycle stage: evidence normalization
Reaction timescale: offline bounded computation; no tick execution claim
Authority owner: Caller supplies pinned evidence and identity; compiler derives candidate topology only; no execution or strategy authority
Current maturity: deterministically verified for the synthetic full-cube collision profile only
Target maturity: deterministically verified
Required evidence: exact source hashes, independently asserted topology fixtures, unknown/unsupported and identity failures, bounded work, neutral-schema regression and targeted typecheck
Explicit non-goals: no new public adapter schema or MCP tool, native sensor/controller change, route search, action dispatch, onboarding/account service, live timing, native collision completeness, Baritone dependency or gameplay acceptance
Downstream gate unlocked: NAV1 sensor-to-profile mapping and topology completion; live executor integration still requires NAV-EQ

# NAV1-D offline Minecraft topology

Parent and sequencing: [NAV plan](eh-g8-environment-spatial-navigation-v1.md)
and [canonical work program](../helix-environment-harness-work-program-v1.md).
This is the expressly admitted offline parallel slice: it cannot perturb an
open execution prerequisite because it imports no broker, controller, game
client, database or tool handler and performs no IO. Personal MCP readiness
remains product-owned; no CFP admission or maturity is changed here.

## Existing implementation inventory

- `minecraft/helix-minecraft-connector-core/src/main/java/com/casimirbot/helixsensor/navigation/BoundedNavigationFrontier.java`
  already implements owned bounded foothold search over typed cell facts,
  cardinal/diagonal/ascent/descent primitives, cached reads and limited routes.
  It returns reachable routes, not the sealed NAV0 topology contract.
- `minecraft/helix-fabric-sensor/src/main/java/com/casimirbot/helixsensor/fabric/FabricPerceptionSnapshot.java`
  exports `helix.minecraft_navigation_frontier.v1`. Its `frontierCell` maps any
  non-empty native collision shape to `SOLID`; this is not proof of full-cube
  support. Its block labels or ranked routes cannot silently become the
  stricter collision profile implemented here.
- The native analyzer seeds its origin without a standability prerequisite,
  and its descent check tests the destination stance without a separate
  swept-head-volume check. These are source-inspection differences, not newly
  reproduced live gameplay defects. No native production behavior was patched.
- `shared/helix-environment-navigation.ts` already owns the neutral snapshot,
  graph, identity, effect and hash vocabulary. It is reused without adding
  Minecraft fields to its required schema.

## Delivered offline slice

Implementation:
`server/services/environment-connectors/navigation/minecraft-voxel-topology.ts`.
Fixtures:
`server/services/environment-connectors/navigation/__tests__/minecraft-voxel-topology.test.ts`.

The internal, non-registered profile is
`minecraft:offline_full_cube_topology:v1`. Its explicit cells are `empty`,
`full_cube`, `blocked`, `hazard`, `fluid`, `unknown` or `unsupported`. These are
collision facts, not registry-name heuristics. No current Fabric snapshot is
claimed to publish this profile. Missing cells stay unknown; inconsistent
complete-coverage claims, duplicates and out-of-bounds evidence reject.

The snapshot normalizer sorts cells and seals the existing neutral snapshot.
The pure compiler requires a pinned snapshot hash, complete expected identity
and caller-supplied evaluation time/age bound. It emits grounded nodes at
cell-center feet coordinates and candidate walk/diagonal/one-block ascent or
descent edges. Each graph binds the snapshot, observation revision, coordinate
frame and producer identity. Edge reversibility means a reverse candidate
edge exists; it is not a physics guarantee. The zero risk score describes
only the modeled exclusion of known hazards, not measured damage risk.

Conservative restrictions:

- Full-cube support and a two-cell standing body only; no slabs, stairs,
  fences, doors, crawling, swimming, climbing, sprint momentum or shape-level
  swept collision claims. `blocked` cannot substitute for full-cube support.
- One-cell horizontal and bounded vertical hazard/unknown halo, matching the
  existing analyzer's conservative neighborhood policy. This can reject
  routes that a skilled player could legally traverse.
- Diagonals require both corner stances. Ascent requires source headroom;
  descent requires clearance above the landing body. No two-block drop edge.
- Unsupported or missing evidence can produce a frontier at an observed safe
  node, never an edge into unknown space. No supported stance returns a typed
  `no_supported_footholds` result with `graph: null`, not an invented origin.
- Candidate edges still need the later trajectory/executor qualification;
  this is neither a route planner nor a `navigate_to` action.

Hard work bounds: at most 4096 cells and 2 MiB input evidence, 1024 nodes,
16384 edges, and 16 transition candidates per accepted node. Node/edge budget
exhaustion rejects the whole compilation rather than returning a silently
truncated graph. Computation uses no wall-clock-dependent search decisions.

## Deterministic cases and verification — 2026-09-08

The test fixture explicitly fills a bounded volume with observed blocked cells,
then supplies exact supports/body clearance. It is synthetic evidence, not a
game capture. Assertions specify topology independently of compiler output:

- exact flat reciprocal edges and centered node positions;
- diagonal corner obstruction with surviving cardinal alternative;
- one-block ascent with and without source/target headroom;
- narrow standing corridor versus unsupported crawl;
- descent beneath an overhang; forbidden deeper drop;
- unsupported, missing, non-full-cube, hazardous or fluid support;
- hazard/fluid short-corridor exclusion with a retained dry detour;
- missing coverage and unsupported adjacent geometry;
- deterministic input-order normalization and repeated output hashes;
- changed geometry invalidating the previous snapshot pin;
- all identity fields, stale/future age, tamper and false complete coverage;
- malformed budgets, metadata contradictions and input size/volume bounds;
- dense floor: exactly 196 nodes, 1404 edges, 52 frontiers and 3136 transition
  checks; maximum 4096-cell blocked fixture returns no invented foothold.

Results: 37/37 new topology tests; 15/15 NAV0 regression tests including the
non-voxel fixture; 9/9 existing native `BoundedNavigationFrontierTest` tests.
Native tests ran with the portable Java 21 toolchain and one 512 MiB Gradle
worker; no mod was installed and no game/server was restarted. They are
existing component regression, not a differential replay of the new compiler.

A targeted TypeScript check initially found an existing NAV0 narrowing error
in coordinate-radius validation. Capturing the narrowed coordinate array
before the callback fixed it without schema or behavior changes. The targeted
compiler/test/NAV0 check then passed with zero diagnostics. This is not a full
repository typecheck. No physics, public adapter contract or release gate was
changed, so no Casimir verification claim is made.

Evidence: [source and verification record](../evidence/eh-g8-environment-spatial-navigation-v1/2026-09-08-nav1d-offline-topology-acceptance.json).

## Next boundary

Finish NAV1 by mapping trustworthy native shape/support/coverage evidence into
the sealed topology, using recorded/native fixtures to test that mapping.
Reuse the existing analyzer where its facts suffice; do not replace working
schedulers or mistake `SOLID` for a certified collision surface. Any required
native sensor change needs its own scoped review and regression before a
separately authorized live rebuild. NAV2 then adds bounded route search.
NAV-EQ remains required before live executor integration. No NAV1-wide, NAV-EQ,
NAV8, Nether, ordinary-user installed or cross-environment runtime acceptance
is implied by this result.
