# Visibility fixes: ordinary native rehearsal — September 12, 2026

Snapshot under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md)
and [work program](../../helix-environment-harness-work-program-v1.md).
No gate or capability maturity is advanced.

After the [package checks](2026-09-12-onboarding-visibility-package-checks.md),
native Computer Use sent Alt+F4 to the exact prior package window. All processes
at that prior path were confirmed absent before starting the visibility package
with ordinary profile state and no isolated user-data override. The native app
was subsequently brought into view through its single-instance launch behavior.

The service started on its original launch without retry or reconnect. Its
readiness receipt was matched to a process at the new exact package path:

```json
{"schema":"casimir_desktop_service_ready_receipt/1","ready":true,"readyAt":"2026-09-12T17:09:46.673Z","origin":"http://127.0.0.1:58278","serviceProcessId":18488}
```

Running package:
`apps/desktop/release-onboarding-visibility-20260912/win-unpacked/CasimirBot.exe`.
Native window ID 8063346; initial main process ID 31432. These are dated
observations, not stable selectors for subsequent sessions.

Through native clicks, the existing chat list was opened, followed by the
composer's Set up connection → Open Agent Access dialog. A fresh screenshot
showed Agent Access in the workspace, with the chat-list overlay closed and
Continuous session recovery still selected. The guide highlighted the actual
panel rather than an obscuring chat list. This verifies the repaired ordinary
desktop navigation path, not all keyboard/mobile/guide paths.

Authenticated MCP presence at 2026-09-12T17:11:48.802Z succeeded against
`service_instance:5e08ac96a38c5ad05075a2c82c9dafac` for continuation
`codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d`. Resource claims were empty,
room/run/environment null, and observability tool_activity_only. Owner/client
were server verified; continuation remained client declared.

Automatic polling advanced setup. The next screenshot visibly displayed the
repaired explanation that repeating the same presence refresh cannot enable
steering. The guide also stated that steering pickup support was undeclared.
Durable destination registration remained absent. Legacy binding and the
unverified-run checkbox remained disabled. No consent checkbox was activated,
no invitation issued, and no game action or prompt ingress was requested.

This establishes separately observed ordinary package navigation and truthful
tool-only guidance. It does not establish durable task registration, invitation
acceptance, exact-chat delivery, restart recovery of a consented pairing or the
continuous gameplay loop. O1–O6 and CS1–CS4 remain incomplete; CS5 remains an
incomplete handoff, original ET6 is unpassed and NAV1 remains gated.
