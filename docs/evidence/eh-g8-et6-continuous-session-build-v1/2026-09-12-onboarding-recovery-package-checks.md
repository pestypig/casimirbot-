# Onboarding recovery package checks

Snapshot under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md)
and [work program](../../helix-environment-harness-work-program-v1.md).
No maturity or gate advance.

The complete isolated browser invocation
`npx playwright test --config playwright.onboarding.config.ts durable-real-handlers.spec.ts`
passed all eight cases in 18.3 seconds. Pointer and keyboard each cover normal
issuance/recovery, lost issuance reply, delayed reconciliation with chat switch,
and delayed reconciliation with account/cookie switch. These use fixture identity
and real handlers; they are not production consent or native workflow acceptance.

Built the late-reconciliation guard and durable steering implementation, including
the [typed error repair](2026-09-12-durable-steering-error-contract.md), into:

`apps/desktop/release-onboarding-recovery-20260912/win-unpacked/CasimirBot.exe`

Client build passed: 3,334 modules, 47.02 seconds. Host build, runtime staging and
electron-builder directory packaging exited 0. Existing client warnings and four
unrelated host duplicate-key/case warnings remain.

[Content comparison](2026-09-12-onboarding-recovery-package.json) passed: 645
runtime files, 635 renderer files, eight host entries, no mismatch or extra file.
EXE SHA256: `77a672ff01d4f778cde64ac6b13de26afcd88ae0239993622cc4e5bc2b07ad24`.
Service SHA256: `ba891e49d49aca8402ccbd77968fbf454fad63742f6c2b97339c9a57b471f986`.
Dirty source checkout; package is a development artifact, not release acceptance.

The existing isolated packaged-launch smoke script exited 0:

```json
{"Verdict":"PASS","Processes":5,"LoopbackListeners":4,"FriendsCoordinationBroker":"NOT_CONFIGURED","IsolatedUserDataFiles":80,"FullReadinessReceipt":"PASS","ServiceListenerReceipt":"PASS","ProviderCredentialKeyVault":"PASS","ProtocolRegistrationPreserved":"PASS","MinFreePhysicalGiB":4.11,"MaxCommitPercent":66.5}
```

The script cleaned up its isolated state. The ordinary app has not yet been
switched to this package. No production consent or environment action occurred.
Full ordinary onboarding, provider catalog adoption and live steering, native
process recovery, and the remaining O1–O6/CS1–CS4 requirements remain open. CS5
remains incomplete, original ET6 is unpassed and NAV1 remains gated.
