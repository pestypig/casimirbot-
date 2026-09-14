# Four-plan compiler, broker and resident runtime baseline

CS3 integration fixture under the [continuous-session packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md). This adds production broker coverage to the [runtime settlement evidence](2026-09-12-continuous-runtime-settlement.md); it is not packaged rehearsal or live acceptance.

An explicit HELIX_NATIVE_BROKER_CONTINUOUS mode starts an isolated loopback fixture server and invokes the native Java runtime test. Its three successor HTTP polls call the real frontier publisher/store, action admission, one-shot lease and workflow/event/result handlers. Four compiler artifacts retain linked predecessor IDs/hashes. Exact authenticated identity joins, reasoning binding, perception context and player/clock observations are fixtures; the database is pg-mem with a bounded fixture schema. There is no production consent, model call or Minecraft process. Positive continuous mode refuses the pair fault, wide-runway and persistence mode flags to avoid conflating distinct test conditions.

The runtime keeps forward movement for ticks 0–83, activates three successors in one resident execution, suppresses duplicate polling while a successor is queued, releases controls, and sends one successful root result. Broker diagnostics show four admissions and three deliveries; each request has attempt_count=1. The result handler accepted the resident chain and persisted one root result. [Broker rows and diagnostics](2026-09-12-continuous-broker-baseline.json) and [native publications](2026-09-12-continuous-broker-native-publications.json) preserve the evidence. Timing fields are diagnostic only: simulated ticks pause during network work, so this does not prove a live runway or continuous wall-clock movement.

Verification:

- Continuous cross-language run: 1 selected integration passed, 1 filtered out; final run 50.93 seconds test time / 56.97 seconds total. Java compilation/test tasks were forced to avoid cached tests overlooking changed fixture inputs.
- Existing wide pair baseline: 1 selected integration passed, 1 filtered out; 27.32 seconds test time / 33.43 seconds total.
- Static Helix discipline check passed; its report includes pre-existing dirty UI surfaces. This turn changes test fixtures only.

Reproduction: set HELIX_NATIVE_PUBLICATION_INTEGRATION=1, HELIX_NATIVE_BROKER_ROUNDTRIP=1, HELIX_NATIVE_BROKER_CONTINUOUS=1, wide/lost/advancing-clock flags to 0, JAVA_HOME to the installed JDK 21 and HELIX_NATIVE_GRADLE_PATH to the installed absolute Gradle 8.14.3 executable. Run `npx vitest run server/services/environment-connectors/events/__tests__/native-temporal-publication.test.ts -t 'native-compiled-publication' --pool=forks --maxWorkers=1 --minWorkers=1`. Generate the compiler and isolated native continuous artifacts first as documented in the linked runtime evidence.

## Reproduced lifecycle gap

Final database states are root=succeeded, child:3=succeeded, child:1=running and child:2=running. The earlier successors have completed native sequence evidence but remain active delivery rows. Current temporalDeliveryStatusSql updates only the event's current sequence. This baseline does not certify clean lifecycle settlement/recovery. Next work must settle previously verified chain members without inferring success from unverified history, reviving terminal rows, creating synthetic results or weakening exact-replay behavior. Successful native movement is insufficient to close that requirement.

Full adversarial four-plan transport/authority coverage, fresh live observation re-entry, useful Minecraft movement, frozen full timing, ordinary packaged recovery, exact-chat onboarding and CS1–CS4 qualification remain open. Original ET6 remains unpassed and NAV1 is not unlocked. No package or production authority was modified in this turn.
