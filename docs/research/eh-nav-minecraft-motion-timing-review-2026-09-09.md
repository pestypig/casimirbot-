# NAV Minecraft motion and timing review — 2026-09-09

Status: source inspection and proposed experiments only. Implementation and
game testing remain paused. No capability-maturity promotion or gate change.
This dated research record supplements the
[robotics/TAS review](eh-nav-robotics-tas-methods-review-2026-09-09.md), not the
canonical [NAV plan](../work-packets/eh-g8-environment-spatial-navigation-v1.md)
or [work program](../helix-environment-harness-work-program-v1.md).

## Findings from our code

Paths below are relative to
`minecraft/helix-fabric-player-agent/src/main/java/com/casimirbot/helixplayer/fabric/`.

- `HelixFabricPlayerAgentClient.java` registers `runtime.tick()` at
  `END_CLIENT_TICK`, with a separate render callback. An end-of-tick callback
  alone does not establish when a newly asserted key affects movement.
- `NativeFabricControlBridge.java::applyMovement` asserts directional, jump
  and sprint key states. This is input application, not a position receipt.
  Its `releaseAll` cancels resident activities and releases resources; it
  must not be interpreted as a physical-rest measurement.
- `ShortHorizonTrajectoryPredictor.java` already supplies bounded 1–20 tick
  position/velocity projections. It advances measured velocity with fixed
  gravity/drag constants. It takes no future input sequence and performs no
  collision resolution: it is not yet an input-conditioned movement model.
- `NativeFabricControlBridge.java::liveTrajectory` rejects water, lava,
  elytra and ability-flight regimes. It checks projected bounding boxes for
  airborne collision, stopping its collision search on grounded starts.
  These discrete checks do not establish swept-volume clearance between
  samples. The applicability checks inspected here do not establish accuracy
  for every status effect, surface, mount or external impulse.
- `build.gradle.kts` pins Minecraft 1.21.8, Fabric API 0.136.1+1.21.8,
  Loader 0.18.4 and Java 21. Qualification must identify the actually loaded
  artifacts as well as these source settings.

Reuse these seams rather than introduce a second scheduler or predictor.
Deterministic arithmetic is not evidence of predictive accuracy in the game.

## External grounding and limits

[Fabric's networking documentation](https://docs.fabricmc.net/develop/networking)
distinguishes logical client and server, including an integrated server in
singleplayer, and describes synchronization through packets. Therefore our
local observation and server observation should remain separate evidence;
neither receipt arrival nor a local predicted position proves server agreement.
The current documentation is for 26.2: it supports this architectural
distinction, not exact 1.21.8 packet or callback ordering. The pinned-version
API page could not be retrieved during this review; no exact phase-order
guarantee is inferred from it.

[Mojang's tick-command introduction](https://www.minecraft.net/en-us/article/minecraft-snapshot-23w43a)
documents a default 20-tick rate and special treatment of players under tick
rate/freeze controls. This historical source is a warning against equating
world tick manipulation with faithful player-time simulation, not validation
of our installed version. Offline stepping can diagnose ordering, but final
acceptance must run at the qualified normal-speed configuration.

The earlier robotics/TAS review supplies the predictive-control and reproducible
experiment rationale. None of these sources establishes TAS-class live results
for our implementation. No mod, dependency or upstream implementation was
installed or copied; Baritone remains a non-shipping black-box comparison.

## Proposed timing evidence contract

For each bounded movement segment, correlate these distinct events:

| Event | Evidence required |
| --- | --- |
| Admitted | Actor, authority epoch, plan/segment identity, expiry and permitted resources |
| Input asserted | Local tick origin, tick index, hook phase, monotonic timestamp and actual input |
| Local motion observed | Position, velocity, grounded state and observation phase after application |
| Server state observed | Independently identified server tick/origin and freshness; unavailable if absent |
| Divergence/correction observed | State delta and provenance; do not invent an acknowledgement per movement packet |
| Input released | Reason, released resources, tick/phase and timestamp |
| Physical outcome | Still moving, airborne, grounded/stable, corrected, or unknown |

Client tick, server tick, render frame, monotonic duration and receipt arrival
are not interchangeable. Cross-clock timing needs a measured mapping and
uncertainty; otherwise report each duration only within its own clock domain.
Instrument before moving the callback or promising a one-tick response.

## Proposed motion-primitive qualification

Each primitive should describe:

- Exact game/mod/model version and supported movement regime.
- Starting pose, velocity, collision/support evidence, effects and input state.
- Tick-addressed input sequence, prediction horizon and shorter committed horizon.
- Predicted poses/velocities, clearance, uncertainty and required observation coverage.
- Completion predicate, deadline, expected resources and permitted effects.
- Interruption policy, irreversible interval, and separate release/outcome receipts.

Start with walk, turn-and-walk, release-to-rest, jump and landing. Extend the
existing predictor behind an explicit model/version boundary only after its
current forecast is compared with measured motion. Unsupported regimes return
typed unavailability, not an optimistic path. Collision queries and sampled
boxes require an explicit continuous/swept-clearance method or a justified
sampling/error bound before high-speed clearance claims.

Environment-neutral fields are time, pose, velocity, geometry coverage,
uncertainty, bounded inputs, resources and outcomes. Minecraft owns block
support, step/jump physics, status effects and input semantics. Do not place
Minecraft gravity constants or block assumptions in the neutral planner.

## Interruption while airborne

Distinguish stopping the command from stopping the body. On manual takeover,
revocation or expired authority, cease agent-owned actuation and report the
remaining motion; do not retain steering under an implicit rescue exception.
Read-only follow-up remains subject to its own permission and availability.

A preauthorized stabilization maneuver may be considered only for a policy
interruption while the necessary authority remains valid. It needs fresh
landing geometry, a finite deadline and the same effect boundary. Revocation
and user takeover override it. Navigation alone cannot place a rescue block,
teleport, or grant itself inventory/world authority.

Before committing a jump, assess the reachable landing corridor through the
irreversible interval, not merely the next input tick. If evidence is
insufficient, do not initiate the jump. If already airborne with insufficient
evidence, report uncertainty rather than claim a safe stop.

## Small experiment matrix — proposed, not executed

| Fixture | Comparison and failure signal |
| --- | --- |
| Flat walk and release | Input phase to first observed displacement; residual distance/time after release |
| Turning and diagonal movement | Input-conditioned predicted versus observed pose; heading and speed error |
| Jump onto a block / narrow landing | Takeoff, apex, landing tick and swept clearance; miss or unsupported forecast |
| Takeover at ascent, apex and descent | Agent input release latency; no subsequent agent actuation; separately record landing |
| Obstacle change / knockback | Detection age, prediction invalidation and bounded replanning; stale plan must not continue blindly |
| Delayed observations and planner output | Candidate rejected on stale start/epoch; no duplicate effect or unauthorized extension |
| Unsupported surface/effect regime | Typed unsupported response instead of a successful generic forecast |

Record forecast errors at 1, 2, 5 and 10 ticks where applicable, landing error,
release latency, correction count, tick-path p50/p95/p99/max cost and deadline
misses. Keep screenshots as asynchronous supporting evidence, not the control
clock. Preserve failed trials and first divergence. Compare telemetry enabled
and disabled to quantify its overhead.

Freeze fixtures, supported regimes, numerical tolerances and rejection rules
after calibration but before held-out acceptance. Vary starting sub-block
position, heading and timing; a world seed alone is insufficient replay state.
Separate fixture setup effects from scored survival movement. No slowdown,
teleport, rewind or hidden block edits count as controller performance.

## Placement in the existing plan

NAV1 supplies qualified observations; NAV2 keeps a simple bounded-search
baseline. NAV3 is the natural home for motion-model and input-phase calibration;
NAV4 for airborne interruption; NAV5 for stale-state/correction repair; NAV6
for held-out comparisons. This does not bypass NAV1-O's paused verification,
NAV-EQ, or any existing live-acceptance prerequisite. The next development
action remains the paused work's verification when the operator resumes it.
