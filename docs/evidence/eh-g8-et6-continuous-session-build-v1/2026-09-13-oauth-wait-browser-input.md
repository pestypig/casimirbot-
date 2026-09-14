# OAuth wait control browser input evidence

Classification: presentation, test-only addition. O4 recovery coverage supplement.

Executed:

```text
npx playwright test --config=playwright.onboarding.config.ts oauth-wait-recovery.spec.ts
```

Result: 2 passed, one worker, 7.4 seconds total. The production readiness React
component was rendered in an isolated Chromium browser with fixture-only HTTP
responses and a pending fake native open. All traffic outside the fresh loopback
origin was blocked. No real OAuth page, production profile, credential or consent
was used. The fake server does not substitute for real OAuth-handler validation.

Pointer case at 375x640 and keyboard case at 1280x640 each started the local wait,
activated Stop waiting, restored enabled Link Auth0, retained NOT LINKED, and
rejected the pending native open afterward without replacing the stopped-state
explanation. Keyboard used Enter to start, Tab to the Stop waiting control with
an explicit focus assertion, then Enter to activate. Both asserted one start
POST, two status GETs and one native open: no automatic retry or account grant.

This fixture renders the real component without the complete workstation CSS or
surrounding overlays. It proves these control interactions, not the whole O4/O5
layout/occlusion matrix, real OAuth handlers, native broker integration or O6.
The current running package remains release-oauth-open-wait-20260913. Its real
authorization consent tab was preserved for the human handoff. No new consent
or callback acceptance was observed as part of this browser fixture.

All original CS1–CS4 and O1–O6 exits and the requirement-level CS5 handoff remain
required. ET6 remains unpassed and NAV1 unqualified.
