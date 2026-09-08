# Local ET6 snapshot-batch package

Built `apps/desktop/release-et6-snapshot-batch-20260907/win-unpacked/CasimirBot.exe` from the dirty canonical checkout without changing unrelated source or the Git index. This is a local unsigned test package, not a public release.

- EXE SHA-256: `622355770c2e1d6ad4d282ab393b4140f2141efc035ea8b17eee663592b77e83`.
- Built and independently extracted packaged service SHA-256: `3adbefa8fa7c29dfc780a0d25f6f14d01dbfeacdc6f65652dbb11421054ad681`.
- Built, staged and packaged renderer tree SHA-256: `d54e19b21810e9668c7c4504029497838d4ea5f8bef2ce1c73eb2b8af5441502`.
- Host/service build passed with four existing duplicate-key/case warnings; allowlist runtime staging passed.
- Isolated packaged launch smoke passed: five processes, four expected loopback listeners, full readiness and exact service-listener receipt, protected key-vault existence, protocol registration preserved. Minimum physical free memory 3.29 GiB; maximum commit 71.3%. Disposable smoke processes/profile were cleaned by the contained test helper.

Preflight initially had about 1 GiB free RAM. The exact Minecraft client PID 15064 was closed normally and its exit confirmed; the exact old CasimirBot host PID 11616 was closed normally. Unrelated applications and the keyed repository server were not stopped. Fabric server was not stopped in this turn.

Replacement EXE launched on the existing profile as PID 26600 at 16:45:12Z. Initial profile readiness was still pending at the first check; isolated-profile PASS does not substitute for existing-profile or MCP readiness. Old package retained until replacement verification. No new Minecraft acceptance sample yet; ET6 remains incomplete and NAV1 gated.

Subsequent existing-profile readiness receipt passed at 16:45:54.675Z: origin `http://127.0.0.1:52880`, service PID 6528, host PID 26600 verified at the replacement executable path. Startup logs show account/session 200; also observed profile-storage snapshot 413 and a 1368 ms database save. Those are not resolved by the launch check and must not be hidden in a broad readiness claim. Exact MCP/run/binding revalidation and live throughput remain outstanding.
