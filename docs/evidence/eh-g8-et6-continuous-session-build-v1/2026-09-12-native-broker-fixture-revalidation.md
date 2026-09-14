# Native engine and broker fixture revalidation

CS3 prerequisite evidence under the [continuous-session packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md). Classification: evidence normalization / internal test dependency injection. No adapter contract or execution authority changed.

The current default native-publication Vitest file skips cross-language integration unless explicitly enabled. Existing generated publications were dated September 6–7, so they were not reused as fresh execution proof. The server compiler fixture was rerun (3/3 passed), regenerating its narrow/wide linked-plan artifacts. Installed Gradle 8.14.3 and cached JDK 21 were used explicitly; system `java` is Java 8. No installation or global Java setting changed.

With `HELIX_NATIVE_COMPILED_HANDOFF=1`, Gradle ran `--no-daemon --max-workers=1 test -x runGameTest --rerun-tasks --tests '*FluidSequenceEngineTest' --tests '*PlayerActionRuntimeTransportTest'`. Build succeeded in 1m41s, all seven tasks executed. XML reports showed 43 engine and 14 runtime transport tests, zero failures/errors/skips. These include the scheduled three-handoff engine case and compiled transport cases. They use fixture engines/observations; Minecraft game tests were excluded and no real gameplay occurred.

The opt-in broker trial set `HELIX_NATIVE_PUBLICATION_INTEGRATION=1`, `HELIX_NATIVE_BROKER_ROUNDTRIP=1`, `HELIX_NATIVE_BROKER_LOST_RESPONSE=1`, and the inspected absolute `HELIX_NATIVE_GRADLE_PATH`. Command:

```text
npx vitest run server/services/environment-connectors/events/__tests__/native-temporal-publication.test.ts -t 'native-compiled-publication' --pool=forks --maxWorkers=1 --minWorkers=1
```

Its first execution failed with missing `helix_environment_durable_goals`, followed by a missing lease. The table was present in the fixture pool. The actual cause was the frontier publisher's module-created store retaining a transaction function before the test installed its database adapter, so it queried a different test-process database. This was not a live broker or player defect.

The publisher now accepts an internal optional `publish` dependency, defaulting to the same production store. The native fixture passes a real EnvironmentTemporalFrontierStore using its installed transaction adapter. No HTTP/MCP flag, alternate authentication, mock publication result or production fixture registration was added. Production validation, publication, revision allocation and persistence execute in the intended isolated database.

After repair the opt-in trial passed: 1 executed, 1 unrelated case filtered, 32.44 seconds. This crosses the real Java runtime and TypeScript broker with deliberate response loss and exact reconciliation. It covers a root/child pair, not three broker-delivered successors. Engine-level three-handoff evidence cannot fill that gap or prove useful live movement. Publisher/store regressions and quick discipline accompany this record.

The running delivery EXE was preserved; this internal source change is not packaged. No production consent, credentials, movement, repeated reconnect or replacement task was used. CS3 still needs a complete cross-language three-successor fixture, full adversarial execution matrix, frozen correlated live timing and a bounded Minecraft mechanics trial. CS4 and original ET6 remain unqualified; all original measurements remain unavailable rather than inferred from these fixture timings.
