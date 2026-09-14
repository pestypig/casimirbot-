# Missing device registration was reported as a sign-in failure

Classification: evidence normalization and presentation. Authority is unchanged.

After the [genuine account link](2026-09-13-native-oauth-link-accepted.md), the
operator clicked Trust this device for Full Harness. Agent Access displayed a
generic instruction to sign in as a developer. The operator found the account
already signed in, returned, and reproduced the trust error. Native inspection
of Connections, Billing & Security / Device & Security established an active
profile session and an unregistered current device, with Register this device
with MFA available. No device registration, MFA or trust consent was automated.

The first reproduced code defect has two layers. InstalledSecurityStore throws
device_not_registered when a device has no active registration. The trust route
did not preserve that error class and converted it to a generic 503. The client
then discarded every failed response body and prescribed sign-in for all errors.
Its error did not establish a missing account session.

The route now preserves the typed installed-security status/code with the existing
non-authority flags. The client maps only known codes to fixed guidance and offers
a presentation-only link to the relevant account or device panel. Missing-device
guidance explains registration/recovery with MFA and a separate return to trust
consent. Unknown failures do not assert that the user is signed out. Raw server
messages never become display copy. Existing same-origin, developer-session,
active-device, MFA and separate environment authority boundaries remain intact.

## Deterministic verification

The new real-router/real-store fixture uses pg-mem with migrations 026, 070 and
081, isolated owner/session/device rows and the production SQL store. The only
account resolver is injected inside the test process. Before the repair, the
missing-device response was 503 instead of 404 and the new rendered-component
assertion found the misleading sign-in copy. Both focused regressions failed.

After the repair, the complete selected suites passed: 51 tests across
AgentConnectionSetup (44), desktop-mcp-tunnel-transition (6), and the new
desktop-trust-registration test (1), in 45.07 seconds. The real-store sequence
checks unregistered rejection without creating a device, fixture registration
followed by successful trust, and revoked-device rejection without revival.
Responses exclude raw device and session identities and grant no gameplay.

Command: `npx vitest run server/routes/__tests__/desktop-trust-registration.test.ts server/routes/__tests__/desktop-mcp-tunnel-transition.test.ts client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`

Two isolated rendered browser cases passed in 15.8 seconds, using real pointer
and keyboard activation at 375x640 and 1280x640. The production component receives
HTTP fixture responses; the recovery link emits the expected panel navigation,
does not repeat the PUT, and never renders a private-message sentinel. Simulated
registration then allows a separate fixture consent click to show trusted state.
These tests omit full workstation styling/host navigation and do not prove real
MFA or live consent. They complement rather than replace the real-store tests.

Command: `npx playwright test --config=playwright.onboarding.config.ts binding-input.spec.ts -g 'O4 unregistered device recovery'`

Discipline quick passed static checks on the dirty checkout. Its unrelated
changed-file classifications do not qualify this workflow. Casimir verification
does not apply to this non-physics error normalization/UI patch; no adapter or
certificate integrity claim is made.

## Packaging and acceptance boundary at this snapshot

The repair is source-only here. Renderer build and packaging are subsequent work.
The current status-recovery EXE remains running and preserves the accepted OAuth
link. The older request-recovery package was recycled after resolved-parent,
non-reparse and no-running-process checks; the current and dispatch rollback
packages remain. No permanent deletion or Recycle Bin emptying occurred.

CS5: retain every requirement in [the latest inventory](2026-09-13-browser-dispatch-recovered.md).
This adds bounded prerequisite evidence under CS1.5, CS4.5 and O4/O5. Genuine
installed-device registration/trust, exact pairing, integrated Ready up, prompt
delivery/pickup/ack and all CS3/CS4 live motion/fault evidence remain required.
No CS1-CS4 or O1-O6 exit is complete. ET6 remains unpassed and NAV1 unqualified.
The [work program](../../helix-environment-harness-work-program-v1.md) remains
the sole dependency and maturity authority.
