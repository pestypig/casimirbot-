# Emergency-stop disk persistence and database reload

CS4 recovery prerequisite under the [continuous-session packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md), extending [finite stop retry](2026-09-12-emergency-stop-retry.md). Classification: deterministic persistence test. No production source changed in this checkpoint.

The new emergency-stop snapshot test runs the real authority handler, room transaction wrapper, local database client, strict snapshot writer and restore path. Each scenario creates a unique temporary snapshot directory, uses deferred local persistence, and recreates the database client from disk. A bounded three-table migration fixture replaces the full migrated schema; membership and the environment join are fixtures. The desktop tunnel safety call is stubbed, so no production authority or connection is modified.

Normal scenario: stop returns only after disk contains suspended authority, emergency_stopped action and exactly one pending finite release control. After database reset/reload, retry returns the same complete control payload, including ID and original deadline. Disk still contains exactly that control row.

Failure scenario: filesystem rename is forced to fail in the real snapshot writer after in-memory stop writes. The call rejects. The prior snapshot still contains active authority and no control, while memory contains exactly one pending release control. Removing the filesystem fault and explicitly retrying reuses that control ID and completes persistence. Database reload then recovers the same finite control without duplicate insertion or deadline extension.

This demonstrates failure propagation and recovery after successful explicit persistence retry. It does not claim that a stop survived a crash before persistence succeeded, that a real Minecraft client received the release, or that an ordinary EXE restart is qualified. It also does not test the full migrated authority hierarchy, production authentication, power loss or a separate operating-system process.

Verification: both disk/reload scenarios and all five strict-snapshot-barrier regressions passed, 7/7; 5.94 seconds total. Temporary snapshot files were removed by fixture cleanup. The test is `server/db/__tests__/emergency-stop-snapshot.test.ts` and runs with ordinary `npx vitest run ... --pool=forks --maxWorkers=1 --minWorkers=1` without production configuration.

Remaining requirements include full-schema/packaged recovery, authenticated control delivery and revocation races, exact-chat onboarding tool adoption, actual observation re-entry and live environment acceptance. CS1–CS4 remain incomplete; original ET6 is unpassed and NAV1 is not unlocked.
