# OAuth waiting UI recovery

Classification: presentation. Scope: O4/O6 prerequisite repair, not OAuth or
integrated session acceptance. The work program remains the status authority.

The operator reported abandoning a browser sign-in and being unable to retry.
Native inspection reproduced a disabled `Waiting for Auth0` button. The component
held `linkBusy` until a completion event, with no explicit escape despite its
comment promising one.

Added `Stop waiting` after the native authorization-open promise resolves. It
only releases local waiting state and performs a read-only binding refresh.
It explains that previously submitted authorization is not canceled and asks
the operator to close the old page before starting another attempt. It does not
open OAuth, grant consent, revoke access or infer successful binding.

Focused component suite: 8/8 passed. The recovery assertion verifies no extra
POST or native open, no inferred linked state, and subsequent callback followed
by server-verified linked projection. This is deterministic component evidence,
not an automated human OAuth transaction or native pointer/keyboard acceptance.

Client build passed (3334 modules, 45.09 seconds); desktop package build passed.
[Content comparison](2026-09-13-oauth-wait-package.json) matched 645 runtime files,
635 renderer files and 8 host artifacts. Discipline quick passed. No physics or
certificate verification is claimed.

The old profile-settlement EXE closed through Alt+F4; process inspection confirmed
zero processes at its exact package path before replacement. The new
`apps/desktop/release-oauth-wait-20260913/win-unpacked/CasimirBot.exe` launched
normally and rendered the workstation. Native picker navigation worked after
fresh activation recovered a geometry error. No live OAuth attempt was created
by the agent. Authentication/linking and the new control's real OAuth workflow
remain to be verified by the operator. No isolated smoke was run for this build.

All CS1–CS4/O1–O6 exits remain open, ET6 unpassed and NAV1 unqualified. This
supplements the existing CS5 requirement inventory without reducing scope.
