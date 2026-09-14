# Manual-input observation preserves resident execution evidence

Classification: evidence normalization. CS4.1/CS3.3/O5 supplement to the
[CS5 inventory](2026-09-13-owner-recovery-cs5-reconciliation.md).

The four-plan native fixture previously injected cancellation by calling the
controller directly. The new `HELIX_NATIVE_BROKER_CONTINUOUS_STOP=manual` case
instead supplies a player snapshot with manual input at tick 43, after two
handoffs and after the third successor has been queued. It uses the existing
CANCEL policy and ordinary controller tick; no cancellation method is invoked.

The first run reproduced a product evidence defect: control stopped, but
`handleManualOverride` replaced `lastMeasurements` with only the manual-input
reason and action ticks. The terminal observation lost its resident handoff
count (expected 2, observed null). The handler now copies its previous execution
measurements and adds the interruption fields. It preserves already performed
effects and handoff facts without changing control policy or authority.

The first fixture also used an unsupported invented manual-input reason. After
the measurement repair, native assertions passed but the broker correctly
rejected that result envelope. Replacing the fixture reason with the admitted
`forward_key_pressed` value resolved this separate test-input fault; the result
schema was not weakened. Failed runs remain in local reports:
`.tmp/continuous-broker-manual-observation-20260913.json` and
`.tmp/continuous-broker-manual-observation-repair-20260913.json`.

The corrected full integration passed one selected case in 44.468 seconds,
with one other parameterized case filtered out. Use JDK 21 / Gradle 8.14.3,
`HELIX_NATIVE_PUBLICATION_INTEGRATION=1`, `HELIX_NATIVE_BROKER_ROUNDTRIP=1`,
`HELIX_NATIVE_BROKER_CONTINUOUS=1`, `HELIX_NATIVE_BROKER_CONTINUOUS_STOP=manual`,
and all other fault flags disabled:

```text
npx vitest run server/services/environment-connectors/events/__tests__/native-temporal-publication.test.ts -t native-compiled-publication --pool=forks --maxWorkers=1 --minWorkers=1 --reporter=json --outputFile=.tmp/continuous-broker-manual-observation-valid-reason-20260913.json
```

The [native artifact](2026-09-13-continuous-manual-observation-native.json)
records 43 moving ticks, release at tick 43, no motion through tick 84, two
handoffs, no activation of the queued third successor and one root terminal
result. That result reports `request_canceled`, `forward_key_pressed`, actual
prior player motion, released controls and no automatic replay.

The [broker artifact](2026-09-13-continuous-manual-observation-broker.json)
records four canceled requests with one attempt each, three successor
deliveries, zero reconciliation polls and no subsequent successor or ordinary
delivery. Replaying the terminal workflow event preserves request rows and
timestamps. Only the root publishes a terminal result.

The native `PlayerActionControllerTest` suite also passed all 40 tests with
zero failures/errors/skips using Gradle `--no-daemon --max-workers=1 test --rerun
-x runGameTest --tests '*PlayerActionControllerTest'`. It retains manual cancel,
partial-motion reporting, pause/exact resume and emergency-stop regressions.
The discipline quick static check passed; its dirty-worktree classification
warning is addressed by the evidence-normalization declaration above.

Player positions, manual input and clock are simulated. HTTP and actual native
delivery executors run while the virtual player clock is held; embedded storage
is isolated pg-mem. This is real compiler/broker/resident integration with a
fixture observation, not genuine keyboard ingress, live release latency,
changed-affordance replanning, reconnect or useful Minecraft motion acceptance.
Free physical memory observed during the run was 4.62 GiB. One heavy test tree
ran at a time; the ordinary EXE remained running.

The controller source fix is not yet a qualified/deployed companion JAR. The
current [EXE checkpoint](2026-09-13-profile-settlement-package.md) is unchanged.
No physics, adapter contract or certificate semantics changed, and no Casimir
certificate integrity claim is made. All CS1–CS4/O1–O6 exits remain incomplete;
ET6 is unpassed and NAV1 unqualified. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole status authority.
