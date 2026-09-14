# Public consent boundary and browser regression

O2/O4/O5 evidence under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

Inspected the real invitation route: it still requires browser session identity,
registered destination ownership, matching device installation, retained trust,
active account link and applicable room/run eligibility. Its authorizer does not
approve automatic delivery. Added an HTTP regression sending an automatic flag
through that route: it returns 409 pairing_approval_scope_mismatch, preserves the
existing grant and creates no additional row. The entire 17-test route suite passes.

The eight isolated real-handler Chromium cases also pass (21.3 seconds): pointer
and keyboard, normal issuance, lost committed reply, chat switch and account
switch. They continue exercising encrypted persistence, exact acceptance,
replacement/revoke recovery and rendered prompt delivery states. The fixture
retains its existing import.meta/IIFE warning; no new failure occurred.

This requalifies the copy-based fixture workflow against the current approval
schema and persistence changes. It does not test automatic delivery through the
public route, which remains disabled, or production human consent, current-host
MCP acceptance, native UI or game effects. The running package was not rebuilt
or restarted. Full O1–O6 and original CS/ET6 acceptance remain incomplete.
