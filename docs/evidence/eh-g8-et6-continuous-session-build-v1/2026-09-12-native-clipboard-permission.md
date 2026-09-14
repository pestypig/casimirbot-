# Native clipboard permission boundary

Under [onboarding O4/O5/O6](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: presentation and native browser permission admission. No task,
pairing, environment or execution authority is granted.

The ordinary Copy diagnostics failure was reproduced in the guidance package;
its combined catch did not identify the failure stage. Source inspection found
that both Electron permission handlers deny clipboard-sanitized-write. Electron's
[session contract](https://www.electronjs.org/docs/latest/api/session) identifies
this as clipboard write permission separately from clipboard-read.

The host now allows sanitized clipboard writes only when both the owning
WebContents URL and requesting origin match the current private renderer origin.
Clipboard reads, deprecated paste permission, foreign request origins, foreign
owners, null owners and missing trusted origin remain denied. The separate
readable diagnostics fallback remains available if copying still fails.

Validation: desktop TypeScript check passed. Desktop host security suite passed
10 tests. Its first run passed the new permission regression but found an older
static listener-count expectation (4/3) inconsistent with the existing packaged
smoke script (5/4 with/without friends coordination). Updated only that test's
expectation; the smoke script was not changed. This is component evidence, not
native clipboard success or release verification.

This patch is not yet in the running guidance EXE. Rebuild and ordinary native
Copy diagnostics verification remain required; do not claim its observed failure
is completely diagnosed until that succeeds. Full O1–O6 and CS1–CS4 criteria and
the CS5 handoff remain open. Original ET6 remains unpassed and NAV1 gated.
