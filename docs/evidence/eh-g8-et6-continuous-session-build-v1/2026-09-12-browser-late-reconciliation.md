# Browser late reconciliation — September 12, 2026

Snapshot under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md)
and [work program](../../helix-environment-harness-work-program-v1.md).
No maturity or gate advances.

Extended the existing isolated Chromium real-handler fixture to exercise the
[late reconciliation guard](2026-09-12-late-reconciliation-account-switch.md).
A fixture-only button changes the rendered Helix chat; no production control or
endpoint was added. The test aborts initial invitation issuance before reaching
the handler, initiates reconciliation, fetches the actual authenticated public
handler's absent-invitation result, and holds that reply until after the chat
switch. It then releases the reply and inspects subsequent browser requests,
handler mutation counts and the actual encrypted-ledger database.

Both 375px pointer and 1280px keyboard cases passed: one initial aborted browser
POST only, zero handler mutations, zero pairing rows, and new chat approval
unchecked. Response completion and browser animation frames precede assertions;
no fixed-duration sleep is used. Account switching is still covered only by the
component cases, not by a real cookie/account browser transition in this fixture.

Command:

```powershell
npx playwright test --config playwright.onboarding.config.ts durable-real-handlers.spec.ts
```

Result: 6 passed in 20.3 seconds, including four existing normal/lost-commit-reply
pointer/keyboard cases covering acceptance, replacement and revocation. The test
uses actual Express handlers, migrations, encrypted rows and transition services;
human/provider identity and encryption keys remain isolated fixture dependencies.
This is browser integration, not production consent, native broker/process
recovery, external provider delivery or continuous environment acceptance.

Quick discipline passed and inferred no sensitive Ask changes; it did not run a
runtime battery. The running visibility package predates the liveness guard and
these fixture edits. Full O1–O6 and CS1–CS4 remain incomplete; CS5 is incomplete,
original ET6 unpassed and NAV1 gated.
