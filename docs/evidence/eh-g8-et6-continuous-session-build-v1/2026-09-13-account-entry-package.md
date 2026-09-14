# Account-entry package and ordinary navigation

Supplement to [the direct account-entry repair](2026-09-13-account-entry-repair.md), within the unchanged [onboarding scope](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

`apps/desktop/release-account-entry-20260913/win-unpacked/CasimirBot.exe` packaged with exit 0. [Content comparison](2026-09-13-account-entry-package.json) matched 645 runtime files, 635 renderer files and eight host artifacts with no mismatches or extra files. EXE SHA256 remains `de7f33876c58a69d48632a8dad19c3bf0e0583f754f37a4158e746e275b563f1`; renderer changes live outside the EXE, so path and renderer comparison distinguish this package. Service hash remains `dc5ed813463e5df57d1dec798f6ead5c03f7bf0e598436c7488e7757de2e3d30`.

[Isolated startup smoke](2026-09-13-account-entry-smoke.json) passed full API/service readiness, key-vault and protocol-preservation checks, with five processes, four loopback listeners, minimum free memory 5.5 GiB and maximum commit 42.7%. Friends coordination broker was not configured. Disposable smoke state was cleaned up.

The previous ordinary package was observed idle at Sign in to CasimirBot, closed normally, and process absence verified. The new ordinary launch reached full API readiness at 2026-09-13T08:16:18.259Z. Native pointer navigation through Activity & setup, External agent setup, Open Agent Access and Codex App exposed the new Open account sign-in button. Clicking it opened Account & Sessions; the loaded panel displayed email/password and Auth0 sign-in choices. Authentication was not activated and no credential was read or entered. Agent Access remains open alongside the account panel.

The new launch again began at New chat with no open panels and setup at Choose your AI app. The cause of that presentation reset is not established here; this trace does not prove ordinary UI/session persistence. Restoring sign-in, authenticated MCP presence, durable registration, genuine pairing and the full Ready up/prompt/pickup/ack workflow remain open.

Validation remains scoped: 41 component tests, two isolated Chromium pointer/keyboard input tests, client/host/service build, byte comparison, isolated smoke, and ordinary native pointer navigation. These do not substitute for O6 or CS1–CS4 acceptance. Full CS5 requirements and original ET6/NAV1 status remain unchanged.
