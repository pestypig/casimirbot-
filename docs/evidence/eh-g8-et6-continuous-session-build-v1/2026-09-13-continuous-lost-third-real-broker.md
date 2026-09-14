# Third successor response loss through the real broker

Classification: test harness and evidence normalization. This supplements the
[native-only deadline case](2026-09-13-continuous-lost-third-deadline.md) and the
[CS5 requirement inventory](2026-09-13-account-recovery-cs5-reconciliation.md).
The [work program](../../helix-environment-harness-work-program-v1.md) remains
the sole dependency and maturity authority. No production implementation or
running package changed in this increment.

The explicit `HELIX_NATIVE_BROKER_CONTINUOUS_LOST_THIRD=1` integration mode
connects the four-plan compiler fixture and Java resident to the actual broker
admission, successor lease, status, event and result handlers. After committing
the third one-shot successor lease, the fixture replaces its HTTP response with
a 503. Status requests read the real committed lease; they return observation
only, without execution authority or automatic replay permission.

The [preserved broker artifact](2026-09-13-continuous-lost-third-real-broker.json)
records four admissions, three deliveries and three status reconciliations.
All four request rows end canceled, each with exactly one attempt. The fixture
asserts one root-owned result, exact terminal-event replay without timestamp or
row changes, no further successor lease, and an empty ordinary action queue.

The [preserved native artifact](2026-09-13-continuous-lost-third-real-broker-native.json)
records 62 moving ticks and automatic stop at tick 62. The resident activates
only the first two successors; the third never activates. It releases controls,
clears active delivery state and performs no further delivery or status polls
after settlement. The result reports `request_canceled` and no automatic replay.

These artifacts were recovered after task output was interrupted. The native
JUnit report at recovery contained one test, zero failures/errors/skips. The
original outer Vitest exit output was unavailable; fresh JSON-reported runs
are recorded separately below rather than inferred from artifact existence.

## Verification scope

Use installed JDK 21 and Gradle 8.14.3, with
`HELIX_NATIVE_PUBLICATION_INTEGRATION=1`, `HELIX_NATIVE_BROKER_ROUNDTRIP=1`,
`HELIX_NATIVE_BROKER_CONTINUOUS=1`, and the lost-third flag above. Other fault
flags are disabled. The existing Vitest integration starts one bounded Gradle
worker and isolated loopback broker fixture:

```text
npx vitest run server/services/environment-connectors/events/__tests__/native-temporal-publication.test.ts -t native-compiled-publication --pool=forks --maxWorkers=1 --minWorkers=1 --reporter=json
```

The uninterrupted control uses the same command with the lost-third flag set
to zero. It passed the selected integration case (36.430 seconds); the other
parameterized case was filtered out. This verifies the successful three-handoff
path still settles all four requests and retains exact result idempotency.

The lost-third rerun also passed its selected integration case (33.898 seconds),
with the other parameterized case filtered out. Its fresh native XML contains
one test and zero failures/errors/skips. The
[verification record](2026-09-13-continuous-lost-third-real-broker-verification.json)
preserves per-case status; the reporter's aggregate passed count includes the
filtered case and is deliberately not used as the executed-test count.
`npm run helix:environment-harness:docs-audit` passed with G8 active and no
failures. No Casimir physics/certificate verification is claimed for this
test-only and documentation increment.

## Requirement disposition

CS3's compiler/broker/resident linkage and CS4's uncertain-delivery, bounded
release and duplicate-effect defenses gain cross-language deterministic
evidence. O5 gains a reproducible integration fault case. Their full exits
remain incomplete. The broker uses isolated pg-mem storage; identities,
perception, player position and clock are fixtures. This does not prove disk
restart durability, live wall-clock scheduling, useful Minecraft motion,
human intervention/revocation, authenticated Codex observation re-entry,
onboarding consent, or packaged workflow recovery. CS1–CS4/O1–O6 remain open;
ET6 remains unpassed and this does not qualify NAV1.
