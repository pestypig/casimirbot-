# Profile recovery package and ordinary navigation checkpoint

Evidence classes: package content comparison, isolated EXE startup smoke and
ordinary signed-out native navigation. No authenticated recovery or live acceptance.

Package: `apps/desktop/release-profile-recovery-20260913/win-unpacked/CasimirBot.exe`

EXE SHA256: `aede7fa9e64a8951488e1305ca025cec7c5a290c9e3ec319e5959169fe344560`

Bundled service SHA256: `3f10f405cd40db5e539c2a0c6dd945e15aab473d86bdf56e3c1d9864b81c51ee`

This package includes the [restore-failure repair](2026-09-13-profile-restore-failure-repair.md)
and [preference registration repair](2026-09-13-profile-preferences-recovery.md).
The client build passed in 2m11s; desktop host/service build and `pack:dir`
completed with exit 0. Existing build warnings were retained. The checkout is
dirty; this is a development package, not release qualification.

The [content comparison](2026-09-13-profile-recovery-package.json) matched all
645 runtime files, 635 renderer files and eight host artifacts inside app.asar,
with no mismatches or extras. Renderer identity is verified separately because
the EXE hash alone does not identify external renderer content. A narrow scan of
packaged renderer JavaScript found no `Create fixture chat`,
`fixture-unavailable-protection` or `profile:origin-recovery-pointer` markers;
this is not a complete production-isolation audit.

## Startup and ordinary app state

The old account-entry EXE was freshly observed at its blank sign-in panel, with
no active categorization jobs. Free physical memory was about 3.1 GiB, below the
smoke helper's unchanged 4 GiB minimum. The old app was closed normally with
Alt+F4; process inspection confirmed exit, and free memory rose to 4.24 GiB.
No unknown process was terminated and the memory guard was not weakened.

The [isolated startup smoke](2026-09-13-profile-recovery-smoke.json) passed:
five processes, four loopback listeners, full service readiness, native key vault,
preserved protocol registration, 80 isolated data files; minimum free memory
4.0 GiB and maximum commit 50.1%. Friends coordination was NOT_CONFIGURED.
The helper used its disposable data directory and cleaned its own process tree.
It did not authenticate a production account or run an environment action.

The new package was then launched normally with the existing ordinary profile.
Its service reached full API readiness at `2026-09-13T08:54:17.385Z`.
Native window selection returned ID `1837268` for the exact new EXE path.
Ordinary navigation succeeded:

1. Activity & setup → External agent setup → Open Agent Access.
2. Select Codex App (preference only) → Open account sign-in.
3. Account & Sessions loaded with email/password and Auth0 sign-in choices.
4. Workspace Memory visibly listed **Agent connection preferences** as a
   browser-guest/local-storage/profile-candidate artifact alongside New chat.

An initial input attempt reported unavailable coordinate geometry. Fresh window
selection, activation and screenshot capture restored targeting; one retry
succeeded. Immediate post-input accessibility snapshots sometimes preceded the
settled UI, so dependent actions used fresh observations. No consent control,
credential field, authentication link or in-environment action was activated.

The current ordinary app remains signed out with Account & Sessions open.
Guest-local chat/setup is still origin-scoped; authenticated recovery is proven
only by the isolated browser cases so far. This checkpoint does not establish
why the ordinary account is signed out.

## External continuation and remaining gates

After the new launch, one authenticated MCP presence attempt for this same exact
continuation (`codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d`) again returned
`McpServerError: Session terminated` / JSON-RPC 32600. No presence registration,
binding recovery or environment authority was established by that call. Tool
availability and transport/account acceptance remain separate. No additional
restart, reconnect or replacement task was requested as a workaround.

The requirement inventories in the linked recovery evidence and
[CS5 reconciliation](2026-09-12-runtime-recovery-cs5-reconciliation.md) remain
incomplete. O6 ordinary authenticated pairing/recovery, every remaining CS1–CS4
exit, exact visible ingress/pickup/ack, real successors and interruption/revocation
still require evidence. Original ET6 remains unpassed and NAV1 is not unlocked.
