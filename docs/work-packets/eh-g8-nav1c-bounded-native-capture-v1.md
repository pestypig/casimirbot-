Program gate: G8 — environment-harness release evaluation
Workstream: NAV1-C bounded native capture, offline continuation of NAV1-M
Capability or component: Same-tick selected-player collision capture primitive and replay qualification
Lifecycle stage: evidence normalization
Reaction timescale: cooperative 20 ms capture-discard budget; live latency remains unproven
Authority owner: Admitted caller selects player and source; native capture enforces thread/context/coverage bounds; no action or terminal authority
Current maturity: deterministically verified for capture orchestration and replay; native ServerLevel entry implemented but not live accepted
Target maturity: deterministically verified
Required evidence: native compilation, injected boundary failures, native-shape fixture export, TypeScript replay/topology checks, exact source hashes, targeted typecheck and docs audit
Explicit non-goals: no probe registration or transport change, no deployment, no live server/player acceptance, no route search, no action dispatch or NAV-EQ promotion
Downstream gate unlocked: NAV1 admitted observation-path integration and read-only live capture qualification; live movement remains gated by NAV-EQ

# NAV1-C bounded native collision capture

Parent: [NAV plan](eh-g8-environment-spatial-navigation-v1.md).
Predecessor: [native measurement/replay](eh-g8-nav1m-native-collision-replay-v1.md).
This slice is an unregistered capture primitive and local tests, not a new
public adapter contract or permission to deploy into the active game. It
cannot perturb the open execution prerequisite because no action, probe or
heartbeat handler invokes it. Product onboarding and personal access remain
owned by the product plan.

## Implemented boundary

`FabricNavigationCollisionCapture.java` exposes an internal ServerLevel/player
entry that rejects off-server-thread calls, uses `CollisionContext.of(player)`
and requires a live, nonremoved player in that exact level with standing pose
and the supported 0.6-by-1.8 standing dimensions. It captures around the player's
block position. Dimension, player UUID, block position, tick and availability
must still match both before serialization and at publication.

For each cell, build-height and loaded-chunk checks precede any block-state
read. Outside-height/unloaded cells return explicit unknown facts; the
collector does not request chunk loading. Native measurement now rejects
unreviewed materials before invoking contextual shape code. This avoids
neighboring-chunk queries for unreviewed stair/fence/modded shapes. Air and the
four reviewed support materials retain exact native shape measurement;
hazards/fluids remain excluded. Existing public perception behavior is unchanged.

Bounds:

- Horizontal radius 1–7, vertical radius 1–8: maximum 3825 cells within the
  4096-cell limit; bounds reject rather than clamp.
- Coordinate limits checked with long arithmetic before offsets, preventing
  integer-overflow bypass; ticks fit the JavaScript safe-integer range.
- One measurement per observed cell, unknown cells never reach measurement.
- Two-MiB serialized replay cap, with no silent truncation.
- Cooperative elapsed checks before each cell and after serialization;
  negative elapsed time or more than 20 ms discards the whole capture. This
  cannot preempt one slow native call or serialization and is not a proven
  hard execution-time ceiling. The budget begins in the bounded collector,
  after construction of the native collision context.

The return value retains cell/unknown/unsupported counts, serialized bytes and
elapsed time alongside the existing internal replay shape. No provenance,
lease, approval or source/producer epoch is invented. The future admitted
observation caller must bind those fields through the existing evidence path.

## Verification — 2026-09-08

Native tests: 13 capture cases, 8 collision-fact cases and 9 existing spatial
survey regressions passed. Coverage includes exact read count; wrong thread;
unavailable player; unloaded and out-of-height short-circuit; changed tick,
player, dimension, block position or availability; thread loss mid-capture;
publication-time revalidation; elapsed/clock regression; radius, coordinate
overflow and tick limits; maximum volume; payload overflow; and fixture export.
Unreviewed shape tests pass even with no world/context available, proving the
new short-circuit does not query neighbors.

The tests drive the same capture algorithm through its injected `View`. Native
block measurements use real Minecraft 1.21.8 BlockState/VoxelShape APIs with
EmptyBlockGetter and empty collision context. Thread, selected-player identity,
availability, tick and elapsed clock are controlled fixtures. The real
ServerLevel/ServerPlayer entry compiled successfully, but has not run against
a live selected player. This distinction limits the maturity claim.

The collector exported a 125-cell stone/air fixture. The unchanged TypeScript
replay bridge and topology compiler produced exactly 9 nodes, 40 edges and 8
frontiers. All 65 TypeScript tests passed: 13 replay/collector-bridge, 37
topology and 15 neutral-contract cases. Targeted typechecking passed with zero
diagnostics; no full-repository typecheck or live latency distribution is
claimed. Java used the existing portable JDK 21 and one 768 MiB Gradle worker.

Evidence: [verification manifest](../evidence/eh-g8-environment-spatial-navigation-v1/2026-09-08-nav1c-bounded-capture-acceptance.json)
and [collector-generated fixture](../evidence/eh-g8-environment-spatial-navigation-v1/nav1c-selected-player-capture-fixture.json).

## Next boundary

Integrate this bounded capture into the existing admitted observation path,
not a parallel endpoint. Verify exact source/world/player/producer and
observation-clock binding, payload admission, evidence re-entry and stale
rejection before a separately scoped read-only live rehearsal. Do not treat
fixture identity or successful parsing as authentication. NAV1-wide and
NAV-EQ remain open; NAV2 search and subsequent trajectory execution retain
their declared dependencies. No running Minecraft, server, harness, Docker or
WSL process was changed, and no mod was installed in this goal.
