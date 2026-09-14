# Third-successor response loss: native runtime fixture

Scope: CS3/O5 transport uncertainty after two linked handoffs. Classification:
test harness and evidence normalization. This is native-runtime simulation with
real compiler artifacts, not a production broker round trip or live Minecraft.

Inspection found that the connected four-plan fixture explicitly rejects the
existing pair lost/late-response flags. The prior lost-response case therefore
did not establish uncertainty behavior after multiple resident handoffs.

The new `continuousCompiledChainLostThirdResponseNeverReplaysDelivery` case
reuses the four-plan compiler artifact and real PlayerActionRuntime/controller.
An isolated HTTP responder returns the first two successors normally, then 503
for the third successor request at tick 42. Its later status responses say
`leased`, `execution_authority=false`, `automatic_replay_allowed=false`.
This models an uncertain response; it does not execute the server's real lease
commit. The case refuses an external broker fixture origin to avoid claiming
that these response injections are a broker-backed test.

Verified assertions:

- Two resident handoffs and 43 simulated moving ticks occur before inspection.
- The third successor is not queued; an uncertain poll is retained.
- Three repeated recovery calls use only the status endpoint. Delivery request
  count stays exactly three; none is retried as execution.
- Status observations do not create a queued successor or activate sequence 3.
- The fixture explicitly cancels for cleanup and checks movement is released.

The [native artifact](2026-09-13-continuous-lost-third-native.json) captures the
pre-cleanup wires, polls and publications. It is not a successful full-chain
result and does not claim autonomous deadline release under uncertainty.

## Verification

Regenerated current compiler output:

```text
npx vitest run server/services/environment-connectors/temporal-plans/__tests__/native-handoff-fixture.test.ts -t 'four-plan continuous chain' --pool=forks --maxWorkers=1 --minWorkers=1
```

One selected case passed; three intentionally skipped. Then used the installed
JDK 21 and Gradle 8.14.3, `HELIX_NATIVE_COMPILED_HANDOFF=1`, with the broker fixture
origin absent in the test process:

```text
gradle --no-daemon --max-workers=1 test --rerun -x runGameTest --tests '*PlayerActionRuntimeTransportTest.continuousCompiledChain*'
```

Build succeeded in 1m35s. The XML report records four tests, zero failures,
errors or skips (3.803 seconds test execution). These are uninterrupted chain,
cancel, emergency stop and lost-third-response cases. Compilation tasks used
normal incremental checks; the test task was forced to rerun. Existing Gradle
deprecation warnings remain.

## Remaining requirements

The real four-plan broker must still inject loss after durable lease commit and
verify its recorded state, no redelivery, deadline/terminal release and recovery.
Reordered responses, changed affordances, backpressure, reconnect, authenticated
revocation, genuine operator interruption and fresh live re-entry remain open.
Fixture clocks pause during HTTP work; 43 simulated ticks are not a live runway
or latency measurement. No running package, JAR or production authority changed.

The [current CS5 inventory](2026-09-13-account-recovery-cs5-reconciliation.md)
retains the full scope. The [work program](../../helix-environment-harness-work-program-v1.md)
remains the sole status authority. CS1–CS4/O1–O6 remain incomplete; ET6 remains
unpassed and NAV1 is not qualified by this fixture.
