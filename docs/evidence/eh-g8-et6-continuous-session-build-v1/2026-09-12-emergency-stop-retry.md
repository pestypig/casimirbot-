# Emergency-stop retry after uncertain acknowledgement

CS4 recovery prerequisite under the [continuous-session packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md), extending the [required-persistence repair](2026-09-12-emergency-stop-persistence.md). Classification: evidence normalization / authority-reduction acknowledgement.

A real-SQL pg-mem fixture reproduced a duplicate release control: the first stop suspended authority and invalidated actions, then its simulated snapshot acknowledgement failed. Retrying the suspended authority created another control ID instead of recovering the existing pending control.

The handler now reads an unexpired pending or leased emergency control while holding the existing exact authority lock. It validates payload schema/hash, row control identity/deadline, exact authority/environment/room/world/source/player scope, null workflow and release-only behavior. Valid recovery returns the same control and its original deadline; the strict snapshot requirement still applies to that read-only retry. Invalid retained state fails closed rather than creating a replacement. This does not revive authority or extend a lease. The behavior covers an existing pending/leased finite control, not blanket idempotency across completed or expired controls.

The fixture executes actual authority/action/control SQL against a bounded in-memory schema. Membership and the environment read are fixture inputs; a transaction callback models an error after committed in-memory writes. Both pending and leased cases retain exactly one unchanged control row and invoke the snapshot boundary twice across failure and retry. Authority stays suspended and action state stays emergency_stopped. The fixture does not prove actual filesystem persistence or process restart.

Adversarial variants change world, subject, release behavior, control ID and deadline, recomputing the payload hash. Each is rejected with action_control_invalid, without changing the retained row or acknowledging another snapshot. Owner/paired-player access and unrelated-participant rejection remain covered.

Verification: the related authority suites passed 19/19 tests. After adding row-ID/deadline checks, all six emergency-stop tests were rerun and passed, including both real-SQL recovery scenarios and the five tampering variants within each. No live control or production consent was automated. No EXE/JAR was rebuilt or deployed.

Actual strict snapshot failure/restart recovery, authenticated control delivery to the native executor, revocation races, full onboarding tool adoption and ordinary packaged acceptance remain open. Original ET6 is unpassed and NAV1 is not unlocked.
