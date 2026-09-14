# Browser account-cookie switch — September 12, 2026

Snapshot under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md)
and [work program](../../helix-environment-harness-work-program-v1.md).
No maturity or gate advances.

Extended the [late reconciliation browser fixture](2026-09-12-browser-late-reconciliation.md)
with a second isolated account and distinct HTTP-only session cookie. During a
held absent-invitation reply, the test replaces the browser cookie and activates
a fixture-only account switch using pointer or keyboard. The real public handler
observes the second session, and the second account's task picker contains no
registration from the first account. Releasing the first account's delayed reply
does not send its old reviewed issuance request.

```powershell
npx playwright test --config playwright.onboarding.config.ts durable-real-handlers.spec.ts --grep account-switch
```

Result: two tests passed in 9.8 seconds. Each asserted one initial aborted browser
POST only, zero handler mutations, zero ledger rows and unchecked approval in the
new account. The same real-handler/migration/encryption fixture is used. Session
resolution is an injected test dependency; this is not actual provider OAuth or
production account switching. No production credentials or consent were used.

The four acceptance/replacement cases and two chat-switch cases were not rerun in
this invocation; their latest evidence remains the preceding six-test snapshot.
The current suite now defines eight cases. The application liveness guard is
unchanged from the preceding source repair and remains newer than the running
visibility EXE. O1–O6 and CS1–CS4 remain incomplete, CS5 remains incomplete,
original ET6 is unpassed and NAV1 gated.
