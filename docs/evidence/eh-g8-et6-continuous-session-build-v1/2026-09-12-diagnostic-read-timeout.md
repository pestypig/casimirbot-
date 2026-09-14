# Bounded native diagnostic collection

Under [onboarding O4/O5](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: presentation; no authority change.

Source inspection found Copy diagnostics awaited native tunnel-state IPC without
a deadline. Added a five-second collection deadline and generation checks so a
late native result after timeout, retry or unmount cannot initiate a clipboard
write or replace the newer diagnostic result. Timeout reports collection failure
and unverified native state; it does not claim the service is offline or restart
anything. Timers are cleared when the operation settles.

Extended the rendered diagnostic test with an unresolved native read, timeout,
successful retry and eventual old-read completion. The old result creates no
additional clipboard write. Existing sanitized copy/fallback tests remain.
First test execution hit Vitest's default five-second test timeout; this test's
budget is now ten seconds to observe the production five-second deadline and
recovery. Full AgentConnectionSetup suite passed 40 tests, exit 0. Discipline
quick exited 0, identifying no sensitive Ask files; this is not full discipline
or integrated acceptance evidence.

This deadline bounds native collection only. It does not cancel a clipboard
write already submitted to the operating system or establish a clipboard-write
timeout contract. The correction is not yet in the running clipboard package.
Live pairing remains limited by current-task tool adoption. All O1–O6/CS1–CS4
and CS5 requirements remain in scope; ET6 remains unpassed and NAV1 gated.
