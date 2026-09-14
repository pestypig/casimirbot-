# Continuous resident chain stop checks

CS3/CS4 deterministic integration evidence under the [continuous-session packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md). Classification: test harness / evidence normalization. No production code, package or authority changes in this checkpoint.

The existing four-plan native runtime fixture now has explicit cancellation and emergency-stop cases. At tick 43 it has activated two successors and queued the third. The controller receives the stop before that tick's execution. Each subsequent tick through 84 must have forward movement released, no active runtime envelope or temporal delivery state, and no further HTTP successor poll. The third successor must never appear as an active sequence. Each case publishes exactly one root result with recorded earlier motion, controls released, no automatic replay and the correct canceled/emergency outcome. Stop input is injected into the real controller; this is not an ordinary user-interface control or authenticated control-poll test.

Native suite: 17/17 runtime transport tests passed, zero failures/errors/skips with HELIX_NATIVE_COMPILED_HANDOFF=1, JDK 21 and Gradle 8.14.3. Both stop cases and the uninterrupted positive case execute in that suite. Each stopped case has 43 moving ticks and two handoffs, followed by 42 checked stopped ticks. Clock and player observations remain synthetic; no Minecraft process runs.

The connected fixture uses HELIX_NATIVE_BROKER_CONTINUOUS_STOP=cancel or emergency in addition to continuous mode. Real admission, lease, workflow/event/result handling execute against the same isolated pg-mem schema. After native stop, an exact successor request returns null and the ordinary queue returns no requests. The root has the correct terminal state and one result; all four requests have attempt_count=1.

The first connected cancellation run failed only in the added ordinary-queue check: the earlier fixture read-database spy had already been restored, so the check reached the default test database with no fixture schema. A scoped read override now keeps that check on the same isolated database. Corrected cancellation integration passed: one selected test, one filtered out, 53.52 seconds test time / 59.81 seconds total. The separate ordinary-queue and successor-lease regressions passed 9/9.

Connected emergency-stop integration also passed: one selected test, one filtered out, 50.71 seconds test time / 56.92 seconds total. Documentation audit passed. Preserved artifacts: [cancellation broker](2026-09-12-continuous-broker-cancel.json), [cancellation native](2026-09-12-continuous-native-cancel.json), [emergency broker](2026-09-12-continuous-broker-emergency.json), [emergency native](2026-09-12-continuous-native-emergency.json).

## Open lifecycle and acceptance requirements

Cancellation leaves child:1 marked running and the never-activated child:3 marked leased, while child:2 and root are canceled. The root's terminal state prevents subsequent lease delivery and the ordinary queue excludes successors, but these retained child statuses still require explicit lifecycle cleanup and recovery tests. Do not present no-redelivery checks as clean settlement. The earlier successful-result repair does not cover cancellation.

Authenticated revocation, real manual-input/control ingress, in-flight delivery races, stale/reordered/lost responses through this chain, fresh live observation re-entry, wall-clock capacity, packaged adoption/recovery and actual Minecraft acceptance remain open. This checkpoint does not close CS1–CS4, replace original ET6 or unlock NAV1.
