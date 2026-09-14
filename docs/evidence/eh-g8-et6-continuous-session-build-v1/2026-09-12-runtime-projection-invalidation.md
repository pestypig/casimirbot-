Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding repair
Capability or component: O4/O5 stale runtime-binding presentation
Lifecycle stage: presentation; evidence normalization
Reaction timescale: fresh binding inspection response
Authority owner: server validates current binding; browser projects availability only
Current maturity: implemented
Target maturity: deterministically verified scoped projection invalidation
Required evidence: failing rendered callback regression and focused browser checks
Explicit non-goals: no consent revocation, server authority change, complete account-lifecycle claim or ET6 substitution
Downstream gate unlocked: none

# Stale runtime projection invalidation

Inspection found that DurableTaskPairing's runtime inspection catch path changed
the message to unavailable but did not clear a previously published runtime
binding. The parent AgentConnectionSetup retains that projection until its
callback receives null for the same pairing ID.

Added a rendered regression: publish a valid accepted binding, return a fresh
projection for a different pairing, activate Check acceptance and require the
previous projection to be cleared while durable pairing remains accepted.
An initial fixture incorrectly supplied `runtime_binding_active: true`, which
the status contract forbids; corrected it to null before reproducing the defect.
The valid regression then failed with 7 passed/1 failed: the last callback still
contained the old binding instead of null.

The runtime-inspection catch now sends null and the inspected pairing ID while
the component remains mounted. The parent already clears only a matching
pairing's projection. The durable approval is preserved; recovery, expiry and
server admission rules are unchanged. This does not claim the full account/chat
lifecycle or all browser binding-cache consumers have been qualified.

Verification:

- Rendered DurableTaskPairing plus durablePairing transport Vitest files,
  one fork: 17 passed, exit 0.
- `npx playwright test --config=playwright.onboarding.config.ts durable-real-handlers.spec.ts`:
  four passed, exit 0, 14.0 seconds. These are existing pointer/keyboard and
  lost-reply real-handler cases; the new mismatch assertion is a jsdom component
  test, not an additional Chromium/native mismatch scenario.
- Quick discipline and environment docs audit: exit 0. Quick classifier inferred
  no sensitive paths; it is not runtime authority evidence.
- Scoped diff check passed after removing a test-file trailing blank line.

This source repair postdates the September 12 EXE whose hash begins `4275cbac`.
It requires a later renderer/package build before native qualification. Neither
the current running EXE nor that built artifact is claimed to contain this fix.
No CS/O6/ET6 stage is closed by this component repair.
