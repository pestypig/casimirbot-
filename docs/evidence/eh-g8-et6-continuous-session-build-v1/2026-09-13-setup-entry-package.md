# Setup-entry package and ordinary pointer rehearsal

This supplements [the source repair](2026-09-13-setup-entry-repair.md) and [ordinary recovery boundary](2026-09-13-ordinary-recovery-boundary.md). Scope: one setup navigation repair, not integrated pairing or continuous-session acceptance.

`apps/desktop/release-setup-entry-20260913/win-unpacked/CasimirBot.exe` packaged successfully. [Byte comparison](2026-09-13-setup-entry-package.json) matched 645 runtime files, 635 renderer files and eight host artifacts, with no mismatches or extra files. The EXE SHA256 is `de7f33876c58a69d48632a8dad19c3bf0e0583f754f37a4158e746e275b563f1`, identical to the prior package because the changed renderer is outside the executable. The package path and renderer content comparison are necessary to distinguish this repair; the EXE hash alone does not.

[Isolated startup smoke](2026-09-13-setup-entry-smoke.json) passed: five processes, four loopback listeners, full API/service readiness, credential-key-vault check and protocol registration preservation. Minimum free physical memory was 4.91 GiB and maximum commit 41.6%. Friends coordination broker was not configured. The disposable process/data scope was cleaned up; no ordinary-profile consent was exercised by the smoke.

The old ordinary package was reobserved idle at the signed-out activity drawer, closed normally with Alt+F4, and process absence confirmed before replacement launch. The replacement reported full API readiness at 2026-09-13T08:05:09.063Z. Native pointer actions then opened Activity & setup, expanded External agent setup, and clicked Open Agent Access. The drawer closed and the Agent Access panel appeared. Selecting Codex App reached the explicit Sign in to CasimirBot step. No sign-in, trust, pairing or environment-consent control was activated.

This proves the previously empty setup section now provides working ordinary native pointer navigation into the setup panel. Keyboard activation, full onboarding and account recovery are not proved by this trace. Account sign-in remains pending human action; no successful MCP presence or durable destination registration is claimed. The original runtime-recovery package remains available for rollback.

Focused component tests passed 2/2; presentation discipline and environment documentation audits passed. Component checks, byte comparison, isolated launch, ordinary pointer navigation and live acceptance remain distinct. Every original CS1–CS4/O1–O6 requirement and the full CS5 handoff remain in scope; ET6 and NAV1 are not advanced.
