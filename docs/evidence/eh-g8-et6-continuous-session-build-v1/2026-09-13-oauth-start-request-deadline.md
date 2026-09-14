# Account-link preparation deadline supplement

Classification: presentation. O4 recovery prerequisite, source-only change.

Two isolated component cases reproduced indefinite waiting before the account
link start response and during its body read. Before the repair, both lacked a
deadline alert (2 failed, 11 passed). Preparation now establishes a 15-second
local UI deadline and exposes Stop waiting immediately. Receipt arrival replaces
that preparation deadline with the existing bounded receipt expiry. Ending the
wait aborts the start request; generation checks prevent late response/body
settlement from opening a browser after recovery. The native consent and server
authority boundary are unchanged. No retry is automatic. Aborting local waiting
does not assert cancellation of a server-side request already received.

Validation:

```text
npx vitest run client/src/components/agent-access/__tests__/AgentAccountBindingReadiness.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1
npx playwright test --config=playwright.onboarding.config.ts oauth-wait-recovery.spec.ts
```

Results: 13/13 component cases passed at 13:34:17 America/New_York; 2/2 isolated
browser control cases passed afterward. New tests advance a fixture clock by
15 seconds, assert abort, settle the request/body late, and prove no native open,
one start POST, enabled retry and no linked-state inference. They are not live
timing measurements. Browser test scope and layout limits remain those in
2026-09-13-oauth-wait-browser-input.md.

The running release-oauth-open-wait-20260913 does not yet include this latest
preparation deadline. Its pending real consent page remains preserved, and no
restart was performed for this source repair. Read-only account status request
timeout and exact correlation of multiple callback transactions are not proved
by these tests. All original CS1–CS4, O1–O6 and CS5 requirements remain required;
ET6 is unpassed and NAV1 unqualified.
