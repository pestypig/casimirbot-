Program gate: G8
Workstream: CS3 moving-runway preparation
Capability or component: compiler-derived walk handoff timing
Lifecycle stage: evidence normalization
Reaction timescale: native source ticks and semantic successor preparation
Authority owner: caller-authored plans, existing compiler/broker and resident gates
Current maturity: specified
Target maturity: deterministically verified prerequisite
Required evidence: delayed delivery boundary regression and later useful live linked motion
Explicit non-goals: no gameplay, timing padding, authority changes or ET6 promotion
Downstream gate unlocked: none

Source inspection confirmed that PlayerActionController supplies the sequence
engine with source-relative resident ticks, including delay before first native
execution. FluidSequenceEngine starts a walk when its action node is entered,
but a queued successor must begin exactly at the predecessor's committed source
tick. A completed route is not allowed to hold stale inputs until that boundary.
An unfinished walk at the boundary fails closed and releases controls.

The existing `compilerDerivedWalksCrossThreeResidentBoundariesWithoutAReleasedTick`
test starts execution at source tick zero using `compiled-rolling-walk.json`.
It remains useful component evidence, but does not model live admission/delivery
delay. The added
`compilerDerivedWalkRejectsHandoffWhenDeliveryConsumesOneSourceTick` test uses
the same compiler artifact, begins one source tick later, and queues a successor
before the chosen stop boundary. It verifies failure, preservation of predecessor
identity, no forward input and released controls. No production code changed.

Focused Gradle test selection `*FluidSequenceEngineTest.compilerDerivedWalk*`
passed both tests. `runGameTest` was explicitly excluded. These are native-engine
fixture results, not real Minecraft movement or measured transport capacity.

This changes the next trial-design requirement: an unscheduled fixed-duration
walk cannot be assumed to finish at a preselected source-clock boundary merely
because its maximum timeout is large. Caller plans must explicitly align useful
motion and completion with that boundary and reject late admission. Existing
earliest/latest-start scheduling may support a bounded pre-motion launch window;
that needs its own delayed-delivery fixture before live use. Pre-motion waiting
must be measured separately and cannot count as performed motion or extension
runway. No idle padding after completion, wall contact or pointless route loops
may be used. If supported primitives cannot meet that contract, specify and
test the missing primitive before another capacity attempt, as CS3 requires.

The one-root live calibration remains calibration only. Three linked successors,
the complete latency envelope, interruption, revocation and final packaged
rehearsal remain outstanding. Human exact-chat binding consent is still pending.
ET6 remains unpassed and NAV1 remains gated.
