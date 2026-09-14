# Four-plan chain with an observation acknowledgement lost after commit

Classification: test harness and evidence normalization. CS3.3/O5 supplement
to the [CS5 inventory](2026-09-13-owner-recovery-cs5-reconciliation.md).

The explicit `HELIX_NATIVE_BROKER_CONTINUOUS_LOST_BATCH_ACK=1` fixture flag
commits the first native observation batch through the real event-stream store,
then substitutes HTTP 503 for its acknowledgement. It is mutually exclusive
with the continuous stop and lost-third-successor variants.

The first run failed at the native fixture's unconditional first-successor
assertion (PlayerActionRuntimeTransportTest.java:173 at that revision). Inspection
found correct resident behavior: unacknowledged evidence remained in the outbox,
and temporal successor delivery was deferred. The fixture had not modeled a
retry opportunity. This is retained as a test-setup failure, not a product
regression or an accepted capacity result.

The native fixture now explicitly checks that the projection outbox is nonempty,
the first poll sends no successor request and no successor is queued. It invokes
the existing delivery-flush scheduler, drains its actual delivery executors and
requires an empty projection outbox before continuing. The server requires the
retried body to equal the original batch and the event store to report replay.
No production scheduler, authority, admission or delivery behavior changed.

The corrected integration passed one selected case in 39.402 seconds, with the
other parameterized case filtered out. Use the existing JDK 21 / Gradle 8.14.3
fixture configuration, `HELIX_NATIVE_PUBLICATION_INTEGRATION=1`,
`HELIX_NATIVE_BROKER_ROUNDTRIP=1`, `HELIX_NATIVE_BROKER_CONTINUOUS=1`, the flag
above, and other fault flags disabled:

```text
npx vitest run server/services/environment-connectors/events/__tests__/native-temporal-publication.test.ts -t native-compiled-publication --pool=forks --maxWorkers=1 --minWorkers=1 --reporter=json
```

The [broker artifact](2026-09-13-continuous-lost-batch-ack-broker.json) records one
exact batch acknowledgement replay, three successor deliveries, four admissions
and four succeeded action requests with one attempt each. Existing positive
assertions retain one root result, exact result replay without row/timestamp
changes, and rejection of conflicting terminal replay.
The [native artifact](2026-09-13-continuous-lost-batch-ack-native.json) retains the
four linked compiler plans, 84 moving ticks, three handoffs and released controls
with no automatic action replay. Observation retransmission is distinct from
re-executing gameplay.

Player positions and clock are simulated. HTTP processing and explicit retry
occur while that clock is held; the test does not prove a live elapsed-time
envelope, arbitrary backpressure duration, reordered acknowledgements, disk
restart, real connector reconnect or useful Minecraft motion. Embedded storage
is isolated pg-mem. No deployed JAR or EXE changed.

All CS1–CS4/O1–O6 exit scopes remain incomplete. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole status authority; ET6 is unpassed and NAV1 unqualified.
