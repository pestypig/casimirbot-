Program gate: G8 — environment-harness release evaluation
Workstream: NAV1-M native measurement mapping, offline continuation of NAV1-D
Capability or component: Native collision-shape facts and strict replay bridge to neutral topology
Lifecycle stage: evidence normalization
Reaction timescale: bounded offline fixtures; no live sampling/tick budget claim
Authority owner: Native helper measures shapes; trusted caller supplies coverage and collision context; replay bridge checks pinned observation identity/time; no execution authority
Current maturity: deterministically verified for tested native block states and offline replay only
Target maturity: deterministically verified
Required evidence: native Minecraft shape/block-state tests, Java-generated replay consumed by TypeScript, identity/time/contradiction rejection, source hashes, typecheck and docs audit
Explicit non-goals: no probe registration, live source payload change, deployment, action dispatch, selected-player capture acceptance, generic material safety, route search, onboarding or release promotion
Downstream gate unlocked: bounded same-tick selected-player capture wiring and native topology qualification within NAV1; live execution still requires NAV-EQ

# NAV1-M native collision measurement and replay

Parent: [NAV plan](eh-g8-environment-spatial-navigation-v1.md).
Prior evidence: [NAV1-D](eh-g8-nav1d-offline-minecraft-topology-v1.md).
This is an offline G8 continuation: an unregistered helper and replay bridge
cannot dispatch actions or alter a running sensor. Personal access/onboarding
remain product-owned. No native mod was installed and no process restarted.

## Measurement boundary

`FabricNavigationCollisionFacts.java` calls the actual Minecraft 1.21.8
`BlockState.getCollisionShape` with the caller's world, position and
`CollisionContext`. Exact full-cube recognition compares shape occupancy with
`Shapes.block()` using symmetric difference. A full bounding box or non-empty
collision is insufficient. The existing hazard classifier is reused; its only
existing-file change is package visibility, not runtime behavior.

Empty movement space requires both native air semantics and empty collision.
Full-cube support requires measured exact geometry plus a conservative reviewed
material policy: stone, cobblestone, dirt or stone bricks. Block identity alone
never proves shape. Other materials, partial shapes and ambiguous semantics
return `unsupported`; known hazards and fluids are excluded first. This policy
intentionally rejects many useful legal terrains, including unreviewed grass
blocks, and makes no general mod/material-safety claim.

Unloaded cells return unknown without dereferencing state/world. The helper
does not itself query chunk loading, collect a volume or enforce server-thread
execution. The future capture caller must check loaded/build-height coverage,
use the selected player's collision context, capture on the authoritative
thread within one tick, and bind observation provenance. These obligations
are not proven merely by the helper's success.

## Replay boundary

`minecraft-native-collision-replay.ts` consumes the internal versioned replay,
recomputes collision classification from measured flags and rejects
contradictions. It checks native dimension/player UUID and start/end tick
against the caller's observation envelope before invoking NAV1-D's bounded
snapshot normalizer. The trusted envelope supplies source, producer, frame and
authority identity; the replay cannot manufacture or authenticate them.
Parsing is not a new trust boundary or public MCP capability.

The replay uses at most 4096 cells and 2 MiB. Duplicates, invalid bounds,
omission/unknown behavior and topology budgets reuse NAV1-D. Cells sort before
snapshot sealing, so wire ordering does not change normalized evidence.

## Evidence — 2026-09-08

Seven native tests passed:

- full cube versus empty, slab, oversized shape and hollow shape with full
  outer bounds; union of two half-cubes recognized by actual occupancy;
- measured native air and four reviewed supports;
- rejection of native slab, stair, fence, sand, slime, honey, leaves and grass;
- magma/lava/water exclusion;
- unloaded short-circuit without a world read;
- contradictory fact rejection;
- Java-generated 100-cell native stone/air replay export.

The generated replay uses real block-state collision methods in a bootstrapped
Minecraft unit-test runtime with `EmptyBlockGetter` and empty collision
context. Its player UUID, dimension, ticks and layout are fixture metadata,
not a live game capture. The TypeScript bridge consumes that exact exported
data and produces the independently expected 9 nodes, 40 edges and 8 boundary
frontiers. Twelve bridge tests passed, including reordering, wrong dimension/
player, mixed ticks, wrong clock, poisoned facts and missing/extra fields.

Regression: 37 NAV1-D + 15 NAV0 tests passed (64 TypeScript tests total),
plus 9 native spatial-survey tests alongside the 7 new native tests. Targeted
TypeScript checking passed with zero diagnostics; it is not a full repository
typecheck. Java compiled with portable JDK 21, one worker and 768 MiB Gradle
heap. No production adapter contract, physics or release verification changed.

Evidence: [verification manifest](../evidence/eh-g8-environment-spatial-navigation-v1/2026-09-08-nav1m-native-collision-replay-acceptance.json)
and [native-generated replay](../evidence/eh-g8-environment-spatial-navigation-v1/nav1m-native-stone-air-replay.json).

## Stop and next handoff

This completes only the bounded measurement/replay slice. Do not promote
NAV1-wide, NAV-EQ, live source or gameplay acceptance. Next NAV1 work connects
a bounded authoritative-thread capture to the already admitted observation
path, with exact selected-player context, chunk/build-height checks, same-tick
receipts, payload budgets and provenance. Test it before any separately scoped
live deployment. Route search remains NAV2; executor integration remains gated
by NAV-EQ. No new account, room or scheduler implementation is needed here.
