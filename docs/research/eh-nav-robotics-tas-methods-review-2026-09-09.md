# NAV robotics and TAS methods review — 2026-09-09

Status: research and proposed acceptance refinements; no implementation or
capability-maturity promotion. The operator's implementation pause remains in
effect. This is a dated research record, not a replacement roadmap.

Controlling plans: [NAV](../work-packets/eh-g8-environment-spatial-navigation-v1.md),
[Environment Time](../architecture/helix-environment-time-action-planning-v1.md),
and the [work program](../helix-environment-harness-work-program-v1.md).

## Conclusion

Keep the existing hierarchy. Robotics supports separating deliberative goals,
route planning, local trajectory control and independent intervention. TAS
practice supplies precise input timing and reproducible experiments, but its
offline rewind/slowdown advantages do not establish online responsiveness.
The recommendations below are engineering inferences from the cited primary
documentation, not evidence that CasimirBot already implements or passes them.

The most useful next refinement is a measured Minecraft motion-primitive and
timing profile before aggressive trajectory optimization. Do not begin with a
generic simulator, a new agent runtime, or a learned policy.

## Methods compared against our plan

| Established method / primary reference | Existing fit | Recommended adaptation, not copied implementation |
| --- | --- | --- |
| Nav2 PipelineSequence revisits earlier work while later work runs and stops children on failure. [Documentation](https://docs.nav2.org/jazzy/configuration_and_development/configuration_guide/core_servers/bt_plugins/controls/PipelineSequence/) | NAV3 prepares the next segment while executing the current segment. | Separate immutable active and candidate plans. Atomically admit a candidate only if its start state, evidence revisions and authority still match. Test delayed planner results. No separate behavior-tree framework is necessary. |
| Nav2 Regulated Pure Pursuit uses lookahead and regulates speed near curvature and obstacles. [Documentation](https://docs.nav2.org/jazzy/configuration_and_development/configuration_guide/controller_plugins/configuring_regulated_pp/) | NAV3 trajectory generation and NAV4 progress/deviation checks. | Use speed-, clearance- and coverage-dependent lookahead. Adapt to discrete Minecraft controls and jumping; do not transplant wheeled-robot steering equations or parameter values. |
| Nav2 MPPI exposes bounded candidate trajectory counts, prediction steps, model timestep and costs. Its documentation relates prediction horizon to observation-map size. [Maintainer README](https://github.com/ros-navigation/navigation2/blob/main/nav2_mppi_controller/README.md) | NAV2 bounded search and NAV3 short trajectories. | First benchmark a small deterministic candidate set. Only consider sampling-based optimization if it improves held-out results within our measured CPU budget. Prediction timestep, simulation ticks and render frames must remain distinct. |
| MuJoCo MPC demonstrates real-time predictive control with multiple shooting-based planners. [Project overview](https://github.com/google-deepmind/mujoco_mpc) | Predict ahead, execute a short portion, then reconsider from observed state. | Borrow the receding-horizon method, not MuJoCo's physical model. Minecraft-specific dynamics must be measured and versioned; a robotics simulator is not a substitute for the game engine. |
| Nav2 Collision Monitor consumes sensor data independently of costmap/trajectory planning and applies local intervention. Its authors explicitly disclaim hard-real-time safety certification. [Maintainer README](https://github.com/ros-navigation/navigation2/blob/main/nav2_collision_monitor/README.md) | Existing watchdog/arbiter and NAV4 interruption. | Preserve a local veto even when a planner or model is late. Releasing input is not proof that momentum, falling or knockback has stopped. Observe the resulting physical state separately. |
| ROS 2 real-time design separates deadline-sensitive work from allocation, blocking synchronization and device I/O. [Design article](https://design.ros2.org/articles/realtime_background.html) | Environment Time clocks/budgets and resident scheduler. | Profile tick-path allocation, GC, locks, serialization and callbacks; keep network, model calls and expensive reporting off that path. A Windows/JVM game remains a measured soft-real-time system, not certified hard real-time. |
| Minecraft TASmod documents recording/playback, savestates, tickrate changes and single-tick advance; it also notes multiplayer limitations. [Project README](https://github.com/MinecraftTAS/TASmod/blob/develop/README.md) | Tick-addressed input and deterministic course testing. | Separate offline diagnostic timing experiments from live normal-speed acceptance. No slowdown, rewind or RNG manipulation may be counted as live controller performance. No compatibility with our current Fabric version is assumed. |
| TASVideos describes input recording/savestates/frame advance; libTAS guidance requires reproducible version/configuration and startup state. [Basic tools](https://tasvideos.org/TasingGuide/BasicTools), [libTAS](https://tasvideos.org/EmulatorResources/LibTAS) | Frozen initial state, recorded effects, replay and held-out courses. | Freeze environment/version/configuration and capture input/state checkpoints. A matched world seed alone does not reproduce multiplayer timing. Preserve first divergence instead of repeatedly replaying a desynchronized sequence. |

These sources were reviewed as documentation, not imported code. No upstream
library or mod was installed. Baritone remains solely a non-shipping black-box
reference under the existing exclusion policy. Any later dependency proposal
requires its own compatibility and rights review.

## Existing source anchors and specific gaps

The inspected plan already contains the hierarchy, effect boundaries, rolling
watermarks, local interruption and quantitative comparison. Source anchors:

- `shared/helix-environment-navigation.ts`: revision-bound plans, checkpoints,
  tolerances, deadlines and feedback validation.
- `server/services/environment-connectors/temporal-plans/environment-time-ledger.ts`:
  finite checkpoint settlement and rejection of extensions after stopping.
- `minecraft/helix-fabric-player-agent/src/main/java/com/casimirbot/helixplayer/fabric/ConcurrentReactiveScheduler.java`:
  finite admitted graph, resource arbitration and bounded transitions per tick.
- `minecraft/helix-fabric-sensor/src/main/java/com/casimirbot/helixsensor/fabric/FabricNavigationCollisionCapture.java`:
  same-context capture and cooperative 20 ms discard budget.
- [Paused NAV1-O packet](../work-packets/eh-g8-nav1o-admitted-collision-observation-v1.md):
  initial 125-cell opt-in observation integration, not completed live acceptance.

This is a focused plan/source review, not an exhaustive implementation audit.
The following details are not sufficiently explicit in the inspected NAV plan
to freeze performance expectations yet:

### 1. Motion-model qualification — NAV3 entry

Define versioned primitives with preconditions, admissible control inputs,
expected state evolution, uncertainty, completion and abort conditions. Begin
with level walk, diagonal walk, release/deceleration, turning and one-block
ascent/descent on the supported terrain profile. Measure start velocity,
pose, grounding, surface and effects; keep unsupported states explicit.

Compare predicted and actual position, velocity, grounding and landing tick at
1, 2, 5 and 10 ticks on calibration courses and disjoint held-out courses.
Those horizons are proposed experiment points, not pass thresholds. Freeze
error tolerances and sample counts before evaluating held-out runs. Shrink the
allowed horizon when model error rises; do not silently enlarge tolerances.

### 2. Feasible coverage and physical stopping — NAV3/NAV4

Validate the swept player volume over each candidate trajectory, including
headroom, corners and landing support. Couple useful speed to fresh coverage,
prediction uncertainty and the distance needed for an admitted stabilization.
Do not substitute a continuous-car braking formula for game dynamics.

The current 5x5x5 capture is a small evidence-integration profile, not proof of
sufficient high-speed lookahead. If no horizon is both covered and safely
interruptible, reduce progress or request more admitted evidence; never infer
free space beyond the measured region. Input release and physical rest must
be separately measured, especially in air or under knockback.

### 3. Three different horizons — NAV3 and NAV-EQ/ET6

Distinguish semantic-intent lifetime, local prediction horizon and committed
execution horizon. Codex should not have to issue a tool call for every local
correction. But an admitted destination does not authorize arbitrary new
temporal plans: define exactly which mechanical updates the local planner may
perform and how the existing arbiter admits each segment.

Measure model/provider delay, transport, admission, queue delay, sensor age and
native execution separately. Size the decision watermark using those measured
distributions plus stabilization reserve. If the safe execution window is
shorter than replenishment latency, continuous operation is not yet feasible
under that configuration. A longer unchecked queue is not the repair.

### 4. Local repair versus semantic reconsideration — NAV4/NAV5

Write a finite decision table: small corridor-tracking error may receive a
bounded local correction; an invalid edge may receive bounded same-goal route
repair; changed destination, effect policy or risk budget requires Codex.
Unknown geometry must never trigger repeated speculative movement.

Add progress history, repeated-attempt fingerprints, minimum route-improvement
criteria and hysteresis for noncritical route switching. Safety, revocation
and manual input must bypass that hysteresis immediately. These mechanisms
belong to existing planner/controller contracts, not a new private LLM loop.

### 5. Tick-path and telemetry cost — NAV4 and execution qualification

The capture's cooperative 20 ms limit and the Environment Time proposal of
4 ms p95 adapter computation are different budgets; do not treat one as proof
of the other. Audit their timing scopes and coexistence explicitly. The former
cannot preempt an individual slow native call or serialization.

Benchmark compact telemetry versus diagnostic screenshots/logging, and record
GC/allocation, missed deadlines, control gaps, stale sensor reads and dropped
noncritical telemetry. Never block control on screenshot production. Preserve
required causal receipts without exporting every raw tick into model context.

## Experiments that reduce guesswork — NAV6 acceptance refinements

These are proposals for the next implementation review, not tests run today.

| Experiment | Controlled comparison | Evidence required |
| --- | --- | --- |
| Primitive prediction | Same initial state/input, predicted versus observed motion | Error by horizon, support/landing mismatch, model version |
| Closed-loop benefit | Fixed timed inputs versus observed-state corrections | Completion, overshoot, collisions, stopped/stuck ticks |
| Planning overlap | Sequential planning versus valid next-segment preparation | Idle ticks, CPU cost, stale-candidate rejection |
| Coverage versus speed | Several bounded coverage/speed profiles | Boundary stops, safe stopping reserve, unknown-region violations |
| Unexpected changes | Obstruction, knockback, delayed observation and changed goal | Local response time, repair disposition, no stale effects |
| Delayed reasoning | Inject transport/model delay without altering game speed | Watermark behavior, safe exhaustion, model calls per distance |
| Instrumentation overhead | Compact receipts versus diagnostic capture enabled | p50/p95/p99 tick cost, deadline misses, evidence completeness |
| Human intervention | Manual takeover/revocation during walking and airborne motion | Time to input release plus separate subsequent motion trace |

Keep world/build, movement effects, initial pose/velocity, inventory, loaded
coverage, game speed, host load and test disturbances matched. Record actual
server/client ticks and wall time; video/render frame rate is not the control
clock. Distinguish privileged server sensing from player-visible evidence when
comparing against humans or other systems.

Hard failures include out-of-scope effects, stale execution, duplicate effects,
unobserved terrain treated as safe, or unauthorized continuation. Optimize
completion, path efficiency and model-call economy only after those boundaries
pass. Neither a course win nor a precise input replay proves general TAS-level
ability, survival progression or combat/navigation composition.

## Recommended next sequence

The [broader skill-composition review](eh-nav-robotics-skill-composition-review-2026-09-09.md)
maps robotic task/motion planning, affordance grounding and event-triggered
control onto the existing Environment Time contract. It proposes skill-handoff
and recovery experiments without expanding movement authority or adding gates.

The [focused Minecraft motion/timing follow-up](eh-nav-minecraft-motion-timing-review-2026-09-09.md)
inspects the existing predictor and input hook, and proposes phase-aware
measurements, primitive qualification and airborne interruption experiments.
It remains research only and does not change this sequence or the pause.

1. Finish the paused NAV1-O verification and separately coordinate read-only
   live evidence qualification; preserve NAV-EQ before live executor integration.
2. Keep NAV2 as bounded owned graph search, with a simple deterministic baseline.
3. At NAV3 entry, freeze the motion-model, timing and horizon experiments above
   before adding sophisticated trajectory optimization.
4. Use NAV4/NAV5 to validate local intervention and bounded same-goal repair.
5. Use NAV6 ablations and NAV7 held-out black-box comparison to decide whether
   predictive sampling adds measurable value. Do not select it by reputation.

This sharpens existing stages rather than adding a replacement navigation
program. Learned motor policies remain a later optional experiment requiring
the same observation, action, timing and safety interfaces plus separate
training-data and held-out evaluation review.
