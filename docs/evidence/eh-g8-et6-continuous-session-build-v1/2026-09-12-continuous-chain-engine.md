# Continuous compiled chain: engine prerequisite

CS3 fixture development under the [continuous-session packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md). This is compiler/engine interoperability evidence, not broker delivery or live capacity.

Inspection of the older wide pair found its 100 ms walk did not span its 20-tick acceptance window. Its passing timing baseline therefore cannot establish continuous movement. That baseline and its budgets remain unchanged.

Added a separate four-plan compiler fixture: 1,050 ms walks, start ticks 0/21/42/63, stop ticks 20/41/62/83 and committed boundaries 21/42/63/84. Predecessor IDs/hashes are linked; source and compilation canonical JSON are retained for later broker wire integration. Observation/affordance revisions are fixture-authored, not actual fresh perception. [Compiled artifacts](2026-09-12-continuous-chain-compiled.json) are preserved separately from generated build outputs.

The first engine run failed the no-released-tick assertion at tick 21. The proposal gave the child workflow only 21 timeout ticks, leaving no tick to verify completed motion. Increasing that workflow timeout to 22 preserves exactly 21 movement ticks, the same stop/committed boundaries, and the strict no-release assertion; this is a fixture validity correction, not a measured transport-budget change. No production engine code changed.

The corrected Java test reads the TypeScript-compiled artifact and uses the production FluidSequenceEngine with a fixture bridge. It queues all three admitted successors into one engine, asserts RUNNING and forward movement on every tick 0–83, then successful completion, three handoffs and released controls. It does not invoke the broker and does not establish that these successors would be admitted or delivered in time. Fixture position observations provide measured-motion postconditions; no Minecraft process runs.

Verification:

- `npx vitest run server/services/environment-connectors/temporal-plans/__tests__/native-handoff-fixture.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`: 4/4 passed.
- With installed JDK 21, Gradle 8.14.3 and `HELIX_NATIVE_COMPILED_HANDOFF=1`: `--no-daemon --max-workers=1 test -x runGameTest --rerun-tasks --tests '*FluidSequenceEngineTest'`: 44 tests, zero failures/errors/skips, build success in 45 seconds, seven tasks executed. Forced execution avoids stale test results when only generated JSON changes.

Next required work is the same root-owned three-successor chain through real broker admission, leases and runtime polling, with per-successor observations/checkpoints and faults. Do not treat three pair-fixture invocations as that chain. Actual useful movement, frozen full timing, interruption/re-entry, authority rejection, packaged acceptance and original ET6 remain open. The ordinary EXE and production authority were untouched.
