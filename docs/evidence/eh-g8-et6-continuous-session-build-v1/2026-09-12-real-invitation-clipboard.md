# Browser copy of a real-handler invitation

Under [onboarding O4/O5](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: test-only browser integration.

Extended the real HTTP/encrypted persistence browser fixture's normal pointer
and keyboard paths to activate Copy invitation and compare Chromium clipboard
contents with the exact invitation issued through the production router.
Clipboard permission is granted only to the disposable fixture browser origin;
no production account, consent control or invitation is used.

The encrypted repository row is identical before and after copy, remains
unaccepted, and the mutation count remains one issuance POST. Thus copy changes
neither the grant deadline nor acceptance. The existing acceptance, replacement,
recovery and revoke assertions continue afterward.

```text
npx playwright test --config=playwright.onboarding.config.ts durable-real-handlers.spec.ts --grep 'lost reply=false'
```

Both cases passed, exit 0, 10.9 seconds including setup. Pointer uses the narrow
375x640 viewport; keyboard uses 1280x640. This is Chromium/real-handler fixture
evidence, distinct from the native diagnostic-copy result. It does not prove
native invitation copy, actual provider delivery/acceptance, or live environment
execution. O1–O6 and CS1–CS4 remain open with CS5 handoff still required; ET6
remains unpassed and NAV1 gated.
