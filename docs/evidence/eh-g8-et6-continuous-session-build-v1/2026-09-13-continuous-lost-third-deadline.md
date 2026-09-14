# Lost third successor: automatic runway release

CS3/CS4/O5 native-runtime simulation supplement to the
[uncertain-delivery inspection](2026-09-13-continuous-lost-third.md).
Classification: test harness and evidence normalization. The earlier artifact
remains unchanged; it ended before deadline release and used explicit cleanup.

The same test now continues through tick 84 without an injected cancellation.
The first two successors are received and activated normally. The third response
is lost at tick 42; three status-only responses cannot authorize replay. With no
third successor reserved, plan 2's existing stop watermark is tick 62. That limit
was fixed in the assertion before running the test, not adjusted to the result.

The real controller automatically settles with `temporal_runway_exhausted` at
tick 62. The fixture checks no forward movement at ticks 62 through 84, no active
envelope or temporal delivery state after settlement, and no further delivery
or status polling. Sequence 3 never activates. Exactly one root-owned result
reports `request_canceled`, recorded earlier motion, `controls_released=true`
and `automatic_replay_performed=false`.

[Native publications](2026-09-13-continuous-lost-third-deadline-native.json)
record 62 moving ticks, three delivery requests, three status requests, stop
tick 62 and one root result. Player positions, clock and HTTP responses remain
fixtures. This does not execute a real broker lease commit, prove a wall-clock
latency envelope or establish live Minecraft behavior.

Verification used the existing freshly generated compiler chain, installed JDK
21 and Gradle 8.14.3, with `HELIX_NATIVE_COMPILED_HANDOFF=1` and no broker fixture
origin in the test process:

```text
gradle --no-daemon --max-workers=1 test --rerun -x runGameTest --tests '*PlayerActionRuntimeTransportTest.continuousCompiledChain*'
```

Build succeeded in 38 seconds. XML: four tests, zero failures/errors/skips,
2.869 seconds test execution. Uninterrupted, cancel and emergency-stop cases
remain passing alongside the extended lost-third case. Existing Gradle
deprecation warnings remain; no production source or deployed JAR changed.

Real-broker uncertainty, durable child settlement, reordered delivery,
backpressure, reconnect, changed affordances, genuine intervention/revocation
and fresh exact observation re-entry remain incomplete in the
[CS5 inventory](2026-09-13-account-recovery-cs5-reconciliation.md).
The [work program](../../helix-environment-harness-work-program-v1.md) remains
the sole status authority. All CS1–CS4/O1–O6 exits retain their original scope;
ET6 remains unpassed and NAV1 is not qualified by this fixture.
